const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { before, after, test } = require('node:test');
const { createApplication } = require('../Service/app');
const {
  ROBOT_DAILY_LIMIT_SECONDS,
  buildShiftWindows,
  reconcileRobotOperations
} = require('../Service/robot-engine');

let app;
let server;
let origin;
let tempDirectory;

function robotReplyReadyTime() {
  return new Date(Date.now() + 16_000);
}

async function request(pathname, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${origin}${pathname}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  return {
    response,
    payload: await response.json(),
    cookie: response.headers.get('set-cookie')?.split(';')[0] || null
  };
}

async function login(email, password = 'Demo123!') {
  return request('/api/v1/auth/staff/login', {
    method: 'POST',
    body: { email, password }
  });
}

function activeRobots() {
  const timestamp = new Date().toISOString();
  return app.db.prepare(`
    SELECT s.*, p.DisplayName
    FROM RobotShiftSchedule s
    JOIN CustomerProfile p ON p.CustomerId = s.RobotCustomerId
    WHERE s.ShiftStatus = 'Active'
      AND s.PlannedStartTime <= ? AND s.PlannedEndTime > ?
    ORDER BY s.SexSnapshot
  `).all(timestamp, timestamp);
}

before(async () => {
  tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'datingeasy-robot-test-'));
  app = createApplication({ databasePath: path.join(tempDirectory, 'test.sqlite') });
  server = http.createServer(app.handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  app.close();
  fs.rmSync(tempDirectory, { recursive: true, force: true });
});

test('scheduler maintains one man and one woman online with eight-hour limits', () => {
  const timestamp = new Date();
  const coverage = reconcileRobotOperations(app.db, timestamp);
  assert.equal(coverage.CoverageStatus, 'CoverageReady');

  const inventory = app.db.prepare(`
    SELECT Sex, COUNT(*) AS value FROM CustomerProfile
    WHERE Seed = 2 AND Active = 1
    GROUP BY Sex
  `).all();
  assert.deepEqual(
    Object.fromEntries(inventory.map((item) => [item.Sex, item.value])),
    { Man: 106, Woman: 306 }
  );
  assert.deepEqual(
    Object.fromEntries(app.db.prepare(`
      SELECT Sex, COUNT(*) AS value FROM CustomerProfile
      WHERE EmailNormalized LIKE 'platform-robot-%@virtual.datingeasy.test'
      GROUP BY Sex
    `).all().map((item) => [item.Sex, item.value])),
    { Man: 100, Woman: 300 }
  );

  const active = activeRobots();
  assert.equal(active.length, 2);
  assert.deepEqual(active.map((shift) => shift.SexSnapshot).sort(), ['Man', 'Woman']);

  const shifts = app.db.prepare('SELECT * FROM RobotShiftSchedule').all();
  assert.ok(shifts.length >= 6);
  assert.ok(shifts.every((shift) => (
    Date.parse(shift.PlannedEndTime) - Date.parse(shift.PlannedStartTime) <=
      ROBOT_DAILY_LIMIT_SECONDS * 1000
  )));
});

test('shift windows preserve coverage across spring and fall daylight-saving days', () => {
  const spring = buildShiftWindows('2026-03-08', 'America/Los_Angeles');
  const fall = buildShiftWindows('2026-11-01', 'America/Los_Angeles');
  const duration = (windows) => windows.reduce(
    (total, window) => total + window.end.getTime() - window.start.getTime(),
    0
  );
  assert.equal(duration(spring), 23 * 60 * 60 * 1000);
  assert.equal(duration(fall), 25 * 60 * 60 * 1000);
  assert.ok([...spring, ...fall].every((window) => (
    window.end.getTime() - window.start.getTime() <= ROBOT_DAILY_LIMIT_SECONDS * 1000
  )));
});

test('an unavailable active robot is replaced by an eligible same-sex reserve', () => {
  const failed = activeRobots()[0];
  app.db.prepare('UPDATE CustomerProfile SET Active = 0 WHERE CustomerId = ?')
    .run(failed.RobotCustomerId);
  reconcileRobotOperations(app.db, new Date());

  const original = app.db.prepare(`
    SELECT * FROM RobotShiftSchedule WHERE RobotShiftScheduleId = ?
  `).get(failed.RobotShiftScheduleId);
  const replacement = app.db.prepare(`
    SELECT * FROM RobotShiftSchedule
    WHERE ReplacedShiftId = ? AND IsReserve = 1
  `).get(failed.RobotShiftScheduleId);
  assert.equal(original.ShiftStatus, 'Replaced');
  assert.ok(replacement);
  assert.equal(replacement.SexSnapshot, failed.SexSnapshot);
  assert.equal(replacement.ShiftStatus, 'Active');
  assert.notEqual(replacement.RobotCustomerId, failed.RobotCustomerId);
  assert.equal(activeRobots().length, 2);
  app.db.prepare('UPDATE CustomerProfile SET Active = 1 WHERE CustomerId = ?')
    .run(failed.RobotCustomerId);
});

test('admin controls global AI mode, budgets, usage, and future shift regeneration', async () => {
  const admin = await login('admin@datingeasy.test');
  assert.equal(admin.response.status, 200);

  const operations = await request('/api/v1/admin/robot-operations', {
    headers: { Cookie: admin.cookie }
  });
  assert.equal(operations.response.status, 200);
  assert.equal(operations.payload.data.robots.length, 412);
  assert.equal(operations.payload.data.robots.filter((item) => item.online).length, 2);
  assert.equal(operations.payload.data.ai.mode, 'LocalOnly');

  const policy = await request('/api/v1/admin/robot-ai-policy', {
    method: 'PUT',
    headers: { Cookie: admin.cookie },
    body: {
      mode: 'HybridExternalAllowed',
      dailyBudget: 10,
      monthlyBudget: 100
    }
  });
  assert.equal(policy.response.status, 200);

  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  const regenerated = await request(
    `/api/v1/admin/robot-city-coverage/${operations.payload.data.coverage.robotCityCoverageId}/shifts/regenerate`,
    {
      method: 'POST',
      headers: { Cookie: admin.cookie },
      body: { businessDate: tomorrow }
    }
  );
  assert.equal(regenerated.response.status, 200);
  assert.equal(regenerated.payload.data.shiftCount, 6);
});

test('admin creates an inactive robot draft from basic details with auto-filled profile data', async () => {
  const admin = await login('admin@datingeasy.test');
  const created = await request('/api/v1/admin/robot-customers', {
    method: 'POST',
    headers: { Cookie: admin.cookie },
    body: {
      creationMode: 'AutoFill',
      displayName: 'Taylor',
      age: 39,
      sex: 'Woman',
      countryCode: 'US',
      state: 'CA',
      city: 'Los Angeles'
    }
  });
  assert.equal(created.response.status, 201);
  assert.equal(created.payload.data.active, false);
  assert.equal(created.payload.data.reviewStatus, 'Pending');
  assert.equal(created.payload.data.profileCompleteness, 100);
  assert.ok(created.payload.data.autoFilledFields.includes('bio'));

  const profile = app.db.prepare(`
    SELECT * FROM CustomerProfile WHERE CustomerId = ?
  `).get(created.payload.data.customerId);
  assert.equal(profile.Seed, 2);
  assert.equal(profile.Active, 0);
  assert.equal(profile.ProfileCompleted, 1);
  assert.equal(profile.DisplayName, 'Taylor');
  assert.equal(profile.CityName, 'Los Angeles');
  assert.ok(profile.Bio.includes('Taylor'));
  assert.deepEqual(JSON.parse(profile.LanguagesJson), ['English']);

  const provenance = app.db.prepare(`
    SELECT * FROM SeedProfileProvenance WHERE CustomerId = ?
  `).get(profile.CustomerId);
  assert.equal(provenance.CreationSource, 'AdminAssisted');
  assert.equal(provenance.CreatedByEmployeeId, admin.payload.data.employeeId);
  assert.equal(provenance.HumanReviewStatus, 'Pending');
  assert.ok(JSON.parse(provenance.AutoFilledFieldsJson).includes('profilePhoto'));
  assert.equal(
    app.db.prepare(`
      SELECT COUNT(*) AS value FROM RobotShiftSchedule WHERE RobotCustomerId = ?
    `).get(profile.CustomerId).value,
    0
  );
});

test('admin creates a full-profile robot draft and preserves supplied profile fields', async () => {
  const admin = await login('admin@datingeasy.test');
  const created = await request('/api/v1/admin/robot-customers', {
    method: 'POST',
    headers: { Cookie: admin.cookie },
    body: {
      creationMode: 'FullProfile',
      displayName: 'Morgan',
      age: 42,
      sex: 'Man',
      countryCode: 'US',
      state: 'WA',
      city: 'Seattle',
      lookingFor: 'Women',
      maritalStatus: 'Single',
      workField: 'Architecture',
      englishLevel: 'Advanced',
      languages: ['English', 'Spanish'],
      traits: ['Kind', 'Curious', 'Patient'],
      interests: ['Cooking', 'Art', 'Traveling'],
      movies: ['Comedy', 'Documentary'],
      music: ['Jazz', 'Folk'],
      goals: ['Chatting', 'A relationship'],
      preferredAgeMin: 32,
      preferredAgeMax: 55,
      personalityType: 'Quiet thinker',
      bio: 'Architect, home cook, and curious city walker.',
      story: 'I enjoy thoughtful conversations, neighborhood discoveries, and sharing a good meal.',
      profilePhoto: '/assets/profiles/default-man.svg',
      publicPhotos: ['/assets/profiles/default-man.svg'],
      privatePhotos: ['/assets/profiles/default-neutral.svg']
    }
  });
  assert.equal(created.response.status, 201);
  assert.deepEqual(created.payload.data.autoFilledFields, ['birthDate']);

  const profile = app.db.prepare(`
    SELECT * FROM CustomerProfile WHERE CustomerId = ?
  `).get(created.payload.data.customerId);
  assert.equal(profile.Active, 0);
  assert.equal(profile.CityName, 'Seattle');
  assert.equal(profile.WorkField, 'Architecture');
  assert.deepEqual(JSON.parse(profile.LanguagesJson), ['English', 'Spanish']);
  assert.deepEqual(JSON.parse(profile.PrivatePhotosJson), ['/assets/profiles/default-neutral.svg']);
  assert.equal(profile.ProfileCompleteness, 100);

  const provenance = app.db.prepare(`
    SELECT * FROM SeedProfileProvenance WHERE CustomerId = ?
  `).get(profile.CustomerId);
  assert.equal(provenance.CreationSource, 'AdminFull');
  assert.deepEqual(JSON.parse(provenance.AutoFilledFieldsJson), ['birthDate']);
});

test('full-profile robot creation rejects missing profile details', async () => {
  const admin = await login('admin@datingeasy.test');
  const rejected = await request('/api/v1/admin/robot-customers', {
    method: 'POST',
    headers: { Cookie: admin.cookie },
    body: {
      creationMode: 'FullProfile',
      displayName: 'Incomplete Robot',
      age: 40,
      sex: 'Woman',
      countryCode: 'US',
      state: 'CA',
      city: 'Los Angeles'
    }
  });
  assert.equal(rejected.response.status, 422);
  assert.equal(rejected.payload.error.code, 'VALIDATION_FAILED');
  assert.ok(rejected.payload.error.fields.bio);
});

test('hybrid mode records simulated outside AI usage and local mode does not', async () => {
  const robot = activeRobots()[0];
  const admin = await login('admin@datingeasy.test');
  await request('/api/v1/admin/robot-ai-policy', {
    method: 'PUT',
    headers: { Cookie: admin.cookie },
    body: { mode: 'HybridExternalAllowed', dailyBudget: 10, monthlyBudget: 100 }
  });
  const registered = await request('/api/v1/auth/customer/register', {
    method: 'POST',
    body: {
      email: 'robot-ai-policy@example.test',
      password: 'Password123!',
      displayName: 'AI Policy Tester',
      birthDate: '1990-01-01',
      sex: 'Woman',
      countryCode: 'US',
      state: 'CA',
      city: 'Los Angeles'
    }
  });
  app.db.prepare('UPDATE CustomerProfile SET CreditsRemain = 100 WHERE CustomerId = ?')
    .run(registered.payload.data.customerId);
  const conversation = await request(
    `/api/v1/customer/conversations/with/${robot.RobotCustomerId}`,
    { method: 'POST', headers: { Cookie: registered.cookie } }
  );
  const hybrid = await request(
    `/api/v1/customer/conversations/${conversation.payload.data.conversationId}/messages/text`,
    {
      method: 'POST',
      headers: { Cookie: registered.cookie, 'Idempotency-Key': 'hybrid-ai-message' },
      body: { text: 'Why do relationships sometimes feel confusing even when people care?' }
    }
  );
  assert.equal(hybrid.payload.data.robotReply, null);
  app.processRobotReplies(robotReplyReadyTime(), 10);
  let latestRobotMessage = app.db.prepare(`
    SELECT * FROM ChatRecords
    WHERE ConversationId = ? AND SenderId = ?
    ORDER BY ChatTime DESC
    LIMIT 1
  `).get(conversation.payload.data.conversationId, robot.RobotCustomerId);
  assert.equal(latestRobotMessage.ResponseSource, 'ExternalAISimulated');
  assert.equal(app.db.prepare('SELECT COUNT(*) AS value FROM RobotAIUsage').get().value, 1);

  await request('/api/v1/admin/robot-ai-policy', {
    method: 'PUT',
    headers: { Cookie: admin.cookie },
    body: { mode: 'LocalOnly', dailyBudget: 10, monthlyBudget: 100 }
  });
  const local = await request(
    `/api/v1/customer/conversations/${conversation.payload.data.conversationId}/messages/text`,
    {
      method: 'POST',
      headers: { Cookie: registered.cookie, 'Idempotency-Key': 'local-ai-message' },
      body: { text: 'Do you remember why relationships can feel confusing?' }
    }
  );
  assert.equal(local.payload.data.robotReply, null);
  app.processRobotReplies(robotReplyReadyTime(), 10);
  latestRobotMessage = app.db.prepare(`
    SELECT * FROM ChatRecords
    WHERE ConversationId = ? AND SenderId = ?
    ORDER BY ChatTime DESC
    LIMIT 1
  `).get(conversation.payload.data.conversationId, robot.RobotCustomerId);
  assert.equal(latestRobotMessage.ResponseSource, 'RobotLocal');
  assert.equal(app.db.prepare('SELECT COUNT(*) AS value FROM RobotAIUsage').get().value, 1);
});

test('one headless robot handles ten customers for thirteen accelerated chat rounds', async () => {
  const robot = activeRobots()[1];
  const customers = [];
  for (let index = 0; index < 10; index += 1) {
    const registered = await request('/api/v1/auth/customer/register', {
      method: 'POST',
      body: {
        email: `robot-soak-${index + 1}@example.test`,
        password: 'Password123!',
        displayName: `Soak Customer ${index + 1}`,
        birthDate: '1990-01-01',
        sex: index % 2 ? 'Man' : 'Woman',
        countryCode: 'US',
        state: 'CA',
        city: 'Los Angeles'
      }
    });
    app.db.prepare('UPDATE CustomerProfile SET CreditsRemain = 100 WHERE CustomerId = ?')
      .run(registered.payload.data.customerId);
    const conversation = await request(
      `/api/v1/customer/conversations/with/${robot.RobotCustomerId}`,
      { method: 'POST', headers: { Cookie: registered.cookie } }
    );
    customers.push({
      customerId: registered.payload.data.customerId,
      cookie: registered.cookie,
      conversationId: conversation.payload.data.conversationId
    });
  }

  const conversationIds = customers.map((customer) => customer.conversationId);
  const placeholders = conversationIds.map(() => '?').join(', ');
  for (let round = 0; round < 13; round += 1) {
    const sends = await Promise.all(customers.map((customer, index) => request(
      `/api/v1/customer/conversations/${customer.conversationId}/messages/text`,
      {
        method: 'POST',
        headers: {
          Cookie: customer.cookie,
          'Idempotency-Key': `soak-${round}-${index}`
        },
        body: {
          text: round === 0
            ? 'I start a new nursing shift on Monday and feel hopeful.'
            : round === 12
              ? 'Do you remember what I said earlier about Monday?'
              : `This is conversation round ${round + 1}. How should I keep the week calm?`
        }
      }
    )));
    assert.ok(sends.every((result) => result.response.status === 201));
    assert.ok(sends.every((result) => result.payload.data.robotReply === null));
    app.processRobotReplies(robotReplyReadyTime(), 20);
    const robotReplies = app.db.prepare(`
      SELECT COUNT(*) AS value FROM ChatRecords
      WHERE ConversationId IN (${placeholders}) AND SenderId = ?
    `).get(...conversationIds, robot.RobotCustomerId).value;
    assert.equal(robotReplies, (round + 1) * 10);
  }

  const messages = app.db.prepare(`
    SELECT * FROM ChatRecords WHERE ConversationId IN (${placeholders})
  `).all(...conversationIds);
  assert.equal(messages.length, 260);
  assert.equal(messages.filter((message) => message.SenderId === robot.RobotCustomerId).length, 130);
  assert.ok(messages.some((message) => message.Text.includes('new nursing shift on Monday')));
  for (const customer of customers) {
    const balance = app.db.prepare(`
      SELECT CreditsRemain FROM CustomerProfile WHERE CustomerId = ?
    `).get(customer.customerId).CreditsRemain;
    assert.equal(balance, 35);
  }
});
