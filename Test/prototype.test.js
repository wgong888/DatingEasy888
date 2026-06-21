const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { before, after, test } = require('node:test');
const { createApplication } = require('../Service/app');

let app;
let server;
let origin;
let tempDirectory;

async function start() {
  tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'datingeasy-test-'));
  app = createApplication({ databasePath: path.join(tempDirectory, 'test.sqlite') });
  server = http.createServer(app.handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
}

async function stop() {
  await new Promise((resolve) => server.close(resolve));
  app.close();
  fs.rmSync(tempDirectory, { recursive: true, force: true });
}

async function request(pathname, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${origin}${pathname}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const payload = await response.json();
  return {
    response,
    payload,
    cookie: response.headers.get('set-cookie')?.split(';')[0] || null
  };
}

async function loginCustomer() {
  const result = await request('/api/v1/auth/customer/login', {
    method: 'POST',
    body: { email: 'demo@datingeasy.test', password: 'Demo123!' }
  });
  assert.equal(result.response.status, 200);
  assert.ok(result.cookie);
  return result.cookie;
}

async function loginStaff(email) {
  const result = await request('/api/v1/auth/staff/login', {
    method: 'POST',
    body: { email, password: 'Demo123!' }
  });
  assert.equal(result.response.status, 200);
  assert.ok(result.cookie);
  return result.cookie;
}

function currentRobotId(index = 0) {
  const timestamp = new Date().toISOString();
  return app.db.prepare(`
    SELECT RobotCustomerId
    FROM RobotShiftSchedule
    WHERE ShiftStatus = 'Active'
      AND PlannedStartTime <= ? AND PlannedEndTime > ?
    ORDER BY SexSnapshot, PlannedStartTime
  `).all(timestamp, timestamp)[index].RobotCustomerId;
}

function currentRobotIdBySex(sex) {
  const timestamp = new Date().toISOString();
  return app.db.prepare(`
    SELECT RobotCustomerId
    FROM RobotShiftSchedule
    WHERE ShiftStatus = 'Active'
      AND SexSnapshot = ?
      AND PlannedStartTime <= ? AND PlannedEndTime > ?
    ORDER BY PlannedStartTime
  `).get(sex, timestamp, timestamp).RobotCustomerId;
}

function customerByDisplayName(displayName) {
  return app.db.prepare(`
    SELECT CustomerId AS customerId, DisplayName AS displayName
    FROM CustomerProfile
    WHERE DisplayName = ?
  `).get(displayName);
}

function robotReplyReadyTime() {
  return new Date(Date.now() + 7_000);
}

before(start);
after(stop);

test('public health endpoint reports the release candidate ready', async () => {
  const health = await request('/api/v1/health');
  assert.equal(health.response.status, 200);
  assert.equal(health.payload.data.status, 'Healthy');
  assert.equal(health.payload.data.apiVersion, 'v1');
  assert.equal(health.payload.data.prototypeVersion, '0.4.0');
  assert.equal(health.payload.data.releaseName, 'Arfa');
});

test('prototype database contains requested review data volume', () => {
  const counts = app.db.prepare(`
    SELECT Seed, COUNT(*) AS value
    FROM CustomerProfile
    GROUP BY Seed
  `).all();
  assert.deepEqual(
    Object.fromEntries(counts.map((item) => [item.Seed, item.value])),
    { 0: 200, 1: 1005, 2: 412 }
  );
  assert.deepEqual(
    Object.fromEntries(app.db.prepare(`
      SELECT Sex, COUNT(*) AS value FROM CustomerProfile
      WHERE EmailNormalized LIKE 'platform-robot-%@virtual.datingeasy.test'
      GROUP BY Sex
    `).all().map((item) => [item.Sex, item.value])),
    { Man: 100, Woman: 300 }
  );
  assert.deepEqual(
    Object.fromEntries(Object.entries(app.db.prepare(`
      SELECT MIN(age) AS minAge, MAX(age) AS maxAge
      FROM (
        SELECT CAST(strftime('%Y', 'now') AS INTEGER) - CAST(strftime('%Y', BirthDate) AS INTEGER) -
          CASE WHEN strftime('%m-%d', 'now') < strftime('%m-%d', BirthDate) THEN 1 ELSE 0 END AS age
        FROM CustomerProfile
        WHERE EmailNormalized LIKE 'platform-robot-%@virtual.datingeasy.test'
      )
    `).get())),
    { minAge: 20, maxAge: 40 }
  );
  assert.deepEqual(
    Object.fromEntries(app.db.prepare(`
      SELECT Sex, COUNT(*) AS value FROM CustomerProfile
      WHERE EmailNormalized LIKE 'platform-seed-%@seed.datingeasy.test'
      GROUP BY Sex
    `).all().map((item) => [item.Sex, item.value])),
    { Man: 250, Woman: 750 }
  );
  assert.deepEqual(
    Object.fromEntries(Object.entries(app.db.prepare(`
      SELECT MIN(age) AS minAge, MAX(age) AS maxAge
      FROM (
        SELECT CAST(strftime('%Y', 'now') AS INTEGER) - CAST(strftime('%Y', BirthDate) AS INTEGER) -
          CASE WHEN strftime('%m-%d', 'now') < strftime('%m-%d', BirthDate) THEN 1 ELSE 0 END AS age
        FROM CustomerProfile
        WHERE EmailNormalized LIKE 'platform-seed-%@seed.datingeasy.test'
      )
    `).get())),
    { minAge: 20, maxAge: 40 }
  );
  assert.equal(
    app.db.prepare(`
      SELECT COUNT(*) AS value
      FROM CustomerProfile
      WHERE Seed = 1
        AND ProfilePhoto NOT LIKE '/assets/profiles/seed-contact-sheet-v2.png#%|800% 600%'
    `).get().value,
    0
  );
  const seedWomanTiles = new Set([
    0, 2, 4, 6,
    9, 11, 13, 15,
    16, 18, 20, 22,
    24, 26, 28, 30,
    33, 35, 37, 39,
    40, 42, 44, 46
  ]);
  const seedManTiles = new Set([
    1, 3, 5, 7,
    8, 10, 12, 14,
    17, 19, 21, 23,
    25, 27, 29, 31,
    32, 34, 36, 38,
    41, 43, 45, 47
  ]);
  const robotWomanTiles = new Set([
    2, 4, 6,
    9, 11, 13, 15,
    16, 18, 20, 22,
    31, 34
  ]);
  const robotManTiles = new Set(Array.from({ length: 48 }, (_, tile) => tile).filter((tile) => {
    const row = Math.floor(tile / 8);
    const column = tile % 8;
    return (row + column) % 2 === 1;
  }));
  const generatedVirtualPhotos = app.db.prepare(`
    SELECT Sex, Seed, ProfilePhoto FROM CustomerProfile WHERE Seed IN (1, 2)
  `).all();
  for (const row of generatedVirtualPhotos) {
    const match = row.ProfilePhoto.match(/#([0-9.]+)% ([0-9.]+)%\|800% 600%$/u);
    assert.ok(match);
    const column = Math.round((Number(match[1]) * 7) / 100);
    const tileRow = Math.round((Number(match[2]) * 5) / 100);
    const tile = tileRow * 8 + column;
    if (row.Seed === 1 && row.Sex === 'Woman') assert.ok(seedWomanTiles.has(tile));
    if (row.Seed === 1 && row.Sex === 'Man') assert.ok(seedManTiles.has(tile));
    if (row.Seed === 2 && row.Sex === 'Woman') assert.ok(robotWomanTiles.has(tile));
    if (row.Seed === 2 && row.Sex === 'Man') assert.ok(robotManTiles.has(tile));
  }
  assert.equal(
    app.db.prepare(`
      SELECT COUNT(*) AS value
      FROM CustomerProfile
      WHERE Seed = 2
        AND ProfilePhoto NOT LIKE '/assets/profiles/robot-contact-sheet-v2.png#%|800% 600%'
    `).get().value,
    0
  );
  assert.equal(
    app.db.prepare(`
      SELECT COUNT(*) AS value
      FROM (
        SELECT DisplayName
        FROM CustomerProfile
        WHERE Seed IN (1, 2)
        GROUP BY DisplayName
        HAVING COUNT(*) > 1
      )
    `).get().value,
    0
  );
  assert.equal(
    app.db.prepare(`
      SELECT COUNT(*) AS value
      FROM (
        SELECT substr(DisplayName, 1, instr(DisplayName || ' ', ' ') - 1) AS FirstName
        FROM CustomerProfile
        WHERE Seed IN (1, 2)
        GROUP BY lower(FirstName)
        HAVING COUNT(*) > 1
      )
    `).get().value,
    0
  );
  const codeLikeNames = app.db.prepare(`
    SELECT DisplayName AS displayName
    FROM CustomerProfile
    WHERE Seed IN (1, 2)
    ORDER BY DisplayName
  `).all().map((row) => row.displayName).filter((displayName) => (
    /\b[A-Z]{2}\d{2,}\b/u.test(displayName) || /\d{2,}$/u.test(displayName)
  ));
  assert.deepEqual(codeLikeNames, []);
  assert.equal(
    app.db.prepare(`
      SELECT COUNT(*) AS value FROM EmployeeSeed es
      JOIN CustomerProfile p ON p.CustomerId = es.CustomerId
      WHERE p.EmailNormalized LIKE 'platform-seed-%@seed.datingeasy.test'
        AND es.Active = 1
    `).get().value,
    1000
  );
  assert.equal(
    app.db.prepare(`
      SELECT COUNT(*) AS value FROM Employees
      WHERE Role = 'ChatEmployee' AND Active = 1
    `).get().value,
    61
  );
});

test('customer login returns the durable opening balance', async () => {
  const cookie = await loginCustomer();
  const me = await request('/api/v1/customer/me', { headers: { Cookie: cookie } });
  assert.equal(me.response.status, 200);
  assert.equal(me.payload.data.creditBalance, 250);
  assert.equal(me.payload.data.displayName, 'Alex');
});

test('customer, employee, administrator, and CEO review sessions can coexist', async () => {
  const cookies = [
    await loginCustomer(),
    await loginStaff('operator@datingeasy.test'),
    await loginStaff('admin@datingeasy.test'),
    await loginStaff('ceo@datingeasy.test')
  ].join('; ');

  const me = await request('/api/v1/customer/me', { headers: { Cookie: cookies } });
  assert.equal(me.response.status, 200);
  assert.equal(me.payload.data.displayName, 'Alex');

  const workspace = await request('/api/v1/backend/workspace', {
    headers: { Cookie: cookies }
  });
  assert.equal(workspace.response.status, 200);
  assert.equal(workspace.payload.data.employee.role, 'ChatEmployee');

  const admin = await request('/api/v1/admin/dashboard', {
    headers: { Cookie: cookies }
  });
  assert.equal(admin.response.status, 200);
  assert.ok(admin.payload.data.metrics.realCustomers.total >= 1);

  const ceo = await request('/api/v1/ceo/dashboard', {
    headers: { Cookie: cookies }
  });
  assert.equal(ceo.response.status, 200);
  assert.ok(ceo.payload.data.finance);
});

test('new real customer starts with an empty chat history', async () => {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const created = await request('/api/v1/auth/customer/register', {
    method: 'POST',
    body: {
      email: `empty-chat-${suffix}@example.test`,
      password: 'Password123!',
      displayName: 'Empty Chat Customer',
      birthDate: '1991-01-01',
      sex: 'Woman',
      countryCode: 'US',
      state: 'CA',
      city: 'Los Angeles'
    }
  });
  assert.equal(created.response.status, 201);
  const conversations = await request('/api/v1/customer/conversations', {
    headers: { Cookie: created.cookie }
  });
  assert.equal(conversations.response.status, 200);
  assert.deepEqual(conversations.payload.data.items, []);
});

test('customer discovery hides internal customer types', async () => {
  const cookie = await loginCustomer();
  const result = await request('/api/v1/customer/discovery/profiles', {
    headers: { Cookie: cookie }
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.payload.data.items.length, 20);
  assert.ok(result.payload.data.items.every((profile) => profile.sex === 'Woman'));
  const assertTypeHidden = (profile) => {
    assert.equal('customerTypeCode' in profile, false);
    assert.equal('customerType' in profile, false);
    assert.equal('isSeed' in profile, false);
    assert.equal('isRobot' in profile, false);
    assert.equal('isVirtual' in profile, false);
    assert.equal('profileDisclosure' in profile, false);
  };
  result.payload.data.items.forEach(assertTypeHidden);

  const profile = await request(
    `/api/v1/customer/profiles/${result.payload.data.items[0].customerId}`,
    { headers: { Cookie: cookie } }
  );
  assertTypeHidden(profile.payload.data);
  assert.equal('email' in profile.payload.data, false);
  assert.equal('phone' in profile.payload.data, false);
  assert.equal(typeof profile.payload.data.bio, 'string');
  assert.equal(typeof profile.payload.data.story, 'string');
  assert.ok(Array.isArray(profile.payload.data.traits));
  assert.ok(Array.isArray(profile.payload.data.interests));
  assert.ok(Array.isArray(profile.payload.data.movies));
  assert.ok(Array.isArray(profile.payload.data.music));
  assert.ok(Array.isArray(profile.payload.data.goals));

  const conversations = await request('/api/v1/customer/conversations', {
    headers: { Cookie: cookie }
  });
  conversations.payload.data.items.forEach((item) => assertTypeHidden(item.otherCustomer));
});

test('customer discovery filters by search, country, state, city, age, sex, and orientation', async () => {
  const cookie = await loginCustomer();
  const locations = await request('/api/v1/customer/discovery/locations', {
    headers: { Cookie: cookie }
  });
  assert.equal(locations.response.status, 200);
  const unitedStates = locations.payload.data.countries.find((country) => country.code === 'US');
  assert.ok(unitedStates);
  const washington = unitedStates.states.find((item) => item.code === 'WA');
  assert.ok(washington);
  assert.ok(washington.cities.includes('Seattle'));
  const california = unitedStates.states.find((item) => item.code === 'CA');
  assert.ok(california);
  assert.ok(california.cities.length > 1000);
  ['Acalanes Ridge', 'Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'Long Beach'].forEach((city) => {
    assert.ok(california.cities.includes(city));
  });

  const search = await request('/api/v1/customer/discovery/profiles?query=coffee', {
    headers: { Cookie: cookie }
  });
  assert.equal(search.response.status, 200);
  assert.ok(search.payload.data.items.length > 0);
  assert.ok(search.payload.data.items.every((profile) => profile.sex === 'Woman'));

  const city = await request('/api/v1/customer/discovery/profiles?city=Seattle', {
    headers: { Cookie: cookie }
  });
  assert.equal(city.response.status, 200);
  assert.ok(city.payload.data.items.some((profile) => profile.displayName === 'Lena'));
  assert.ok(city.payload.data.items.every((profile) => (
    profile.city === 'Seattle' && profile.sex === 'Woman'
  )));

  const location = await request('/api/v1/customer/discovery/profiles?countryCode=US&state=WA&city=Seattle', {
    headers: { Cookie: cookie }
  });
  assert.equal(location.response.status, 200);
  assert.ok(location.payload.data.items.length > 0);
  assert.ok(location.payload.data.items.every((profile) => (
    profile.countryCode === 'US' &&
    profile.state === 'WA' &&
    profile.city === 'Seattle' &&
    profile.sex === 'Woman'
  )));

  const losAngelesWomen = await request('/api/v1/customer/discovery/profiles?countryCode=US&state=CA&city=Los%20Angeles&sex=Woman', {
    headers: { Cookie: cookie }
  });
  assert.equal(losAngelesWomen.response.status, 200);
  assert.ok(losAngelesWomen.payload.data.items.length > 0);
  assert.ok(losAngelesWomen.payload.data.items.every((profile) => (
    profile.countryCode === 'US' &&
    profile.state === 'CA' &&
    profile.city === 'Los Angeles' &&
    profile.sex === 'Woman'
  )));

  const age = await request('/api/v1/customer/discovery/profiles?minAge=41&maxAge=43', {
    headers: { Cookie: cookie }
  });
  assert.equal(age.response.status, 200);
  assert.ok(age.payload.data.items.length > 0);
  assert.ok(age.payload.data.items.every((profile) => (
    profile.age >= 41 && profile.age <= 43 && profile.sex === 'Woman'
  )));

  const requestedWoman = await request('/api/v1/customer/discovery/profiles?sex=Woman', {
    headers: { Cookie: cookie }
  });
  assert.equal(requestedWoman.response.status, 200);
  assert.equal(requestedWoman.payload.data.items.length, 20);

  const requestedMan = await request('/api/v1/customer/discovery/profiles?sex=Man', {
    headers: { Cookie: cookie }
  });
  assert.equal(requestedMan.response.status, 200);
  assert.equal(requestedMan.payload.data.items.length, 0);

  const statusTarget = app.db.prepare(`
    SELECT CustomerId, DisplayName, Active
    FROM CustomerProfile
    WHERE CustomerId <> (
      SELECT CustomerId FROM CustomerProfile WHERE EmailNormalized = 'demo@datingeasy.test'
    )
      AND Active = 1
      AND Sex = 'Woman'
      AND CountryCode = 'US'
      AND StateId = 'CA'
      AND CityName = 'Los Angeles'
    LIMIT 1
  `).get();
  assert.ok(statusTarget);
  try {
    app.db.prepare(`
      UPDATE CustomerProfile
      SET Active = 0, DisplayName = 'Inactive Search Tester'
      WHERE CustomerId = ?
    `).run(statusTarget.CustomerId);
    const activeOnly = await request('/api/v1/customer/discovery/profiles?query=Inactive%20Search%20Tester&countryCode=US&state=CA&city=Los%20Angeles&sex=Woman', {
      headers: { Cookie: cookie }
    });
    assert.equal(activeOnly.response.status, 200);
    assert.equal(activeOnly.payload.data.items.length, 0);

    const allStatuses = await request('/api/v1/customer/discovery/profiles?query=Inactive%20Search%20Tester&countryCode=US&state=CA&city=Los%20Angeles&sex=Woman&status=all', {
      headers: { Cookie: cookie }
    });
    assert.equal(allStatuses.response.status, 200);
    assert.equal(allStatuses.payload.data.items.length, 1);
    assert.equal(allStatuses.payload.data.items[0].displayName, 'Inactive Search Tester');
  } finally {
    app.db.prepare(`
      UPDATE CustomerProfile
      SET Active = ?, DisplayName = ?
      WHERE CustomerId = ?
    `).run(statusTarget.Active, statusTarget.DisplayName, statusTarget.CustomerId);
  }
});

test('real customer can chat with another real customer', async () => {
  const cookie = await loginCustomer();
  app.db.prepare("UPDATE CustomerProfile SET CreditsRemain = 250 WHERE Email = 'demo@datingeasy.test'")
    .run();
  const registered = await request('/api/v1/auth/customer/register', {
    method: 'POST',
    body: {
      email: 'second-real@example.test',
      password: 'Password123!',
      displayName: 'Jamie',
      birthDate: '1991-02-02',
      sex: 'Woman',
      countryCode: 'US',
      state: 'OR',
      city: 'Portland'
    }
  });
  assert.equal(registered.response.status, 201);
  const conversation = await request(
    `/api/v1/customer/conversations/with/${registered.payload.data.customerId}`,
    {
      method: 'POST',
      headers: { Cookie: cookie }
    }
  );
  assert.equal(conversation.response.status, 200);
  const sent = await request(
    `/api/v1/customer/conversations/${conversation.payload.data.conversationId}/messages/text`,
    {
      method: 'POST',
      headers: { Cookie: cookie, 'Idempotency-Key': 'real-to-real-chat' },
      body: { text: 'Hello Jamie. It is nice to meet another real customer.' }
    }
  );
  assert.equal(sent.response.status, 201);
  assert.equal(sent.payload.data.robotReply, null);
  const stored = app.db
    .prepare('SELECT * FROM ChatRecords WHERE ChatRecordId = ?')
    .get(sent.payload.data.chatRecordId);
  assert.equal(stored.ReceiverId, registered.payload.data.customerId);
  assert.equal(stored.ResponseSource, null);
  app.db.prepare("UPDATE CustomerProfile SET CreditsRemain = 250 WHERE Email = 'demo@datingeasy.test'")
    .run();
});

test('customer text send stores and charges even when target is inactive', async () => {
  const cookie = await loginCustomer();
  app.db.prepare("UPDATE CustomerProfile SET CreditsRemain = 250 WHERE Email = 'demo@datingeasy.test'")
    .run();
  const registered = await request('/api/v1/auth/customer/register', {
    method: 'POST',
    body: {
      email: 'inactive-target@example.test',
      password: 'Password123!',
      displayName: 'Inactive Target',
      birthDate: '1991-03-04',
      sex: 'Woman',
      countryCode: 'US',
      state: 'CA',
      city: 'Los Angeles'
    }
  });
  assert.equal(registered.response.status, 201);
  const conversation = await request(
    `/api/v1/customer/conversations/with/${registered.payload.data.customerId}`,
    {
      method: 'POST',
      headers: { Cookie: cookie }
    }
  );
  assert.equal(conversation.response.status, 200);
  app.db.prepare('UPDATE CustomerProfile SET Active = 0 WHERE CustomerId = ?')
    .run(registered.payload.data.customerId);
  const balanceBefore = app.db
    .prepare("SELECT CreditsRemain FROM CustomerProfile WHERE Email = 'demo@datingeasy.test'")
    .get().CreditsRemain;
  const recordCountBefore = app.db.prepare(`
    SELECT COUNT(*) AS value
    FROM ChatRecords
    WHERE ConversationId = ?
  `).get(conversation.payload.data.conversationId).value;
  const sent = await request(
    `/api/v1/customer/conversations/${conversation.payload.data.conversationId}/messages/text`,
    {
      method: 'POST',
      headers: { Cookie: cookie, 'Idempotency-Key': 'inactive-target-chat' },
      body: { text: 'This message should still be saved while you are away.' }
    }
  );
  assert.equal(sent.response.status, 201);
  assert.equal(sent.payload.data.creditUsed, 5);
  assert.equal(sent.payload.data.creditBalance, balanceBefore - 5);
  const balanceAfter = app.db
    .prepare("SELECT CreditsRemain FROM CustomerProfile WHERE Email = 'demo@datingeasy.test'")
    .get().CreditsRemain;
  const recordCountAfter = app.db.prepare(`
    SELECT COUNT(*) AS value
    FROM ChatRecords
    WHERE ConversationId = ?
  `).get(conversation.payload.data.conversationId).value;
  const stored = app.db
    .prepare('SELECT * FROM ChatRecords WHERE ChatRecordId = ?')
    .get(sent.payload.data.chatRecordId);
  assert.equal(balanceAfter, balanceBefore - 5);
  assert.equal(recordCountAfter, recordCountBefore + 1);
  assert.equal(stored.Text, 'This message should still be saved while you are away.');
  assert.equal(stored.ReceiverId, registered.payload.data.customerId);
  app.db.prepare('UPDATE CustomerProfile SET Active = 1 WHERE CustomerId = ?')
    .run(registered.payload.data.customerId);
  app.db.prepare("UPDATE CustomerProfile SET CreditsRemain = 250 WHERE Email = 'demo@datingeasy.test'")
    .run();
});

test('real customer can chat with a robot customer that answers autonomously', async () => {
  const cookie = await loginCustomer();
  app.db.prepare("UPDATE CustomerProfile SET CreditsRemain = 250 WHERE Email = 'demo@datingeasy.test'")
    .run();
  const discovery = await request('/api/v1/customer/discovery/profiles', {
    headers: { Cookie: cookie }
  });
  assert.equal(discovery.response.status, 200);
  const robot = { customerId: currentRobotIdBySex('Woman') };
  const conversation = await request(`/api/v1/customer/conversations/with/${robot.customerId}`, {
    method: 'POST',
    headers: { Cookie: cookie }
  });
  const sent = await request(
    `/api/v1/customer/conversations/${conversation.payload.data.conversationId}/messages/text`,
    {
      method: 'POST',
      headers: { Cookie: cookie, 'Idempotency-Key': 'real-to-robot-chat' },
      body: { text: 'Work was stressful today and I would enjoy a calm conversation.' }
    }
  );
  assert.equal(sent.response.status, 201);
  assert.equal(sent.payload.data.robotReply, null);
  const outgoing = app.db.prepare('SELECT * FROM ChatRecords WHERE ChatRecordId = ?')
    .get(sent.payload.data.chatRecordId);
  assert.equal(outgoing.ReceiverId, robot.customerId);
  assert.equal(outgoing.Text, 'Work was stressful today and I would enjoy a calm conversation.');
  const immediate = app.processRobotReplies(new Date(), 10);
  assert.equal(immediate.sent, 0);
  assert.equal(app.robotQueueSnapshot().queueLength, 1);
  app.processRobotReplies(robotReplyReadyTime(), 10);
  const stored = app.db
    .prepare(`
      SELECT * FROM ChatRecords
      WHERE ConversationId = ? AND SenderId = ?
      ORDER BY ChatTime DESC
      LIMIT 1
    `)
    .get(conversation.payload.data.conversationId, robot.customerId);
  assert.equal(stored.ActingEmployeeId, null);
  assert.equal(stored.ResponseSource, 'RobotLocal');
  assert.match(stored.Text, /work|energy|evening|tired|pressure|unwind|lighter/iu);
  assert.equal(
    app.db.prepare('SELECT COUNT(*) AS count FROM EmployeeSeed WHERE CustomerId = ?')
      .get(robot.customerId).count,
    0
  );
  app.db.prepare('DELETE FROM CreditLedger WHERE ReferenceId = ?')
    .run(sent.payload.data.chatRecordId);
  app.db.prepare('DELETE FROM ChatRecords WHERE ChatRecordId IN (?, ?)')
    .run(sent.payload.data.chatRecordId, stored.ChatRecordId);
  app.db.prepare("UPDATE CustomerProfile SET CreditsRemain = 250 WHERE Email = 'demo@datingeasy.test'")
    .run();
});

test('active robot profile without a current shift answers customer chat on demand', async () => {
  const cookie = await loginCustomer();
  app.db.prepare("UPDATE CustomerProfile SET CreditsRemain = 250 WHERE Email = 'demo@datingeasy.test'")
    .run();
  const robot = app.db.prepare(`
    SELECT p.CustomerId AS customerId, p.DisplayName AS displayName,
      p.CityName AS cityName, p.StateId AS state, p.Seed, p.Active
    FROM CustomerProfile p
    WHERE p.Seed = 2
      AND p.Active = 1
      AND NOT EXISTS (
        SELECT 1
        FROM RobotShiftSchedule s
        WHERE s.RobotCustomerId = p.CustomerId
          AND s.ShiftStatus = 'Active'
          AND s.PlannedStartTime <= ?
          AND s.PlannedEndTime > ?
      )
    ORDER BY p.DisplayName
    LIMIT 1
  `).get(new Date().toISOString(), new Date().toISOString());
  assert.ok(robot);
  assert.equal(robot.Seed, 2);
  assert.equal(robot.Active, 1);

  const conversation = await request(`/api/v1/customer/conversations/with/${robot.customerId}`, {
    method: 'POST',
    headers: { Cookie: cookie }
  });
  assert.equal(conversation.response.status, 200);
  const sent = await request(
    `/api/v1/customer/conversations/${conversation.payload.data.conversationId}/messages/text`,
    {
      method: 'POST',
      headers: { Cookie: cookie, 'Idempotency-Key': `off-shift-on-demand-${robot.customerId}` },
      body: { text: `Hi ${robot.displayName}, where are you from?` }
    }
  );
  assert.equal(sent.response.status, 201);
  assert.equal(sent.payload.data.robotReply, null);
  app.processRobotReplies(robotReplyReadyTime(), 10);
  const reply = app.db.prepare(`
    SELECT * FROM ChatRecords
    WHERE ConversationId = ? AND SenderId = ?
    ORDER BY ChatTime DESC
    LIMIT 1
  `).get(conversation.payload.data.conversationId, robot.customerId);
  assert.ok(reply);
  assert.equal(reply.ResponseSource, 'RobotLocal');
  assert.match(reply.Text, new RegExp(`${robot.cityName}|${robot.state}|home base|based|from`, 'iu'));
  app.db.prepare("UPDATE CustomerProfile SET CreditsRemain = 250 WHERE Email = 'demo@datingeasy.test'")
    .run();
});

test('every online active robot answers customer chat', async () => {
  const adminCookie = await loginStaff('admin@datingeasy.test');
  const onlineRobots = await request('/api/v1/admin/robot-operations?active=true', {
    headers: { Cookie: adminCookie }
  });
  assert.equal(onlineRobots.response.status, 200);
  assert.ok(onlineRobots.payload.data.robots.length > 0);
  assert.ok(onlineRobots.payload.data.robots.every((robot) => robot.active && robot.online));

  const cookie = await loginCustomer();
  app.db.prepare("UPDATE CustomerProfile SET CreditsRemain = 500 WHERE Email = 'demo@datingeasy.test'")
    .run();
  const sentChats = [];
  for (const robot of onlineRobots.payload.data.robots) {
    const conversation = await request(`/api/v1/customer/conversations/with/${robot.customerId}`, {
      method: 'POST',
      headers: { Cookie: cookie }
    });
    assert.equal(conversation.response.status, 200);
    const sent = await request(
      `/api/v1/customer/conversations/${conversation.payload.data.conversationId}/messages/text`,
      {
        method: 'POST',
        headers: { Cookie: cookie, 'Idempotency-Key': `online-robot-response-${robot.customerId}` },
        body: { text: `Hello ${robot.displayName}, how is your day going?` }
      }
    );
    assert.equal(sent.response.status, 201);
    sentChats.push({
      robotId: robot.customerId,
      conversationId: conversation.payload.data.conversationId,
      sentAt: sent.payload.data.chatTime
    });
  }

  const processed = app.processRobotReplies(robotReplyReadyTime(), 20);
  assert.equal(processed.sent, sentChats.length);
  for (const chat of sentChats) {
    const reply = app.db.prepare(`
      SELECT * FROM ChatRecords
      WHERE ConversationId = ? AND SenderId = ? AND ChatTime > ?
      ORDER BY ChatTime DESC
      LIMIT 1
    `).get(chat.conversationId, chat.robotId, chat.sentAt);
    assert.ok(reply);
    assert.equal(reply.ResponseSource, 'RobotLocal');
  }
  app.db.prepare("UPDATE CustomerProfile SET CreditsRemain = 250 WHERE Email = 'demo@datingeasy.test'")
    .run();
});

test('robot local replies vary by customer topic and recent history', async () => {
  const cookie = await loginCustomer();
  app.db.prepare("UPDATE CustomerProfile SET CreditsRemain = 250 WHERE Email = 'demo@datingeasy.test'")
    .run();
  const robot = { customerId: currentRobotIdBySex('Woman') };
  app.db.prepare(`
    UPDATE Conversations
    SET UpdatedAt = ?
    WHERE CustomerAId = ? OR CustomerBId = ?
  `).run(
    new Date(Date.now() - 21 * 60 * 1000).toISOString(),
    robot.customerId,
    robot.customerId
  );
  const conversation = await request(`/api/v1/customer/conversations/with/${robot.customerId}`, {
    method: 'POST',
    headers: { Cookie: cookie }
  });
  const messages = [
    ['topic-work', 'My work meeting was stressful and I am tired tonight.', /work|energy|evening|tired|pressure|unwind|lighter|stress|draining|shoulders/iu],
    ['topic-food', 'I cooked dinner and made coffee after trying sourdough.', /food|meal|cooking|flavor|table|coffee|dish/iu],
    ['topic-beach', 'I miss the beach and the ocean waves at sunset.', /ocean|beach|waves|water|sky|sand|sunset/iu]
  ];
  const replies = [];
  for (const [key, text, pattern] of messages) {
    const sent = await request(
      `/api/v1/customer/conversations/${conversation.payload.data.conversationId}/messages/text`,
      {
        method: 'POST',
        headers: { Cookie: cookie, 'Idempotency-Key': key },
        body: { text }
      }
    );
    assert.equal(sent.response.status, 201);
    const immediate = app.processRobotReplies(new Date(), 10);
    assert.equal(immediate.sent, 0);
    app.processRobotReplies(robotReplyReadyTime(), 10);
    const reply = app.db.prepare(`
      SELECT * FROM ChatRecords
      WHERE ConversationId = ? AND SenderId = ?
      ORDER BY ChatTime DESC
      LIMIT 1
    `).get(conversation.payload.data.conversationId, robot.customerId);
    assert.equal(reply.ResponseSource, 'RobotLocal');
    assert.match(reply.Text, pattern);
    replies.push(reply.Text);
  }
  assert.equal(new Set(replies).size, replies.length);
  app.db.prepare("UPDATE CustomerProfile SET CreditsRemain = 250 WHERE Email = 'demo@datingeasy.test'")
    .run();
});

test('robot uses recent chat history for follow-up and reciprocal replies', async () => {
  const cookie = await loginCustomer();
  app.db.prepare("UPDATE CustomerProfile SET CreditsRemain = 250 WHERE Email = 'demo@datingeasy.test'")
    .run();
  const robot = { customerId: currentRobotIdBySex('Woman') };
  app.db.prepare(`
    UPDATE Conversations
    SET UpdatedAt = ?
    WHERE CustomerAId = ? OR CustomerBId = ?
  `).run(
    new Date(Date.now() - 21 * 60 * 1000).toISOString(),
    robot.customerId,
    robot.customerId
  );
  const conversation = await request(`/api/v1/customer/conversations/with/${robot.customerId}`, {
    method: 'POST',
    headers: { Cookie: cookie }
  });
  const turns = [
    ['history-work-start', 'My job has been stressful this week and I feel tired.', /work|energy|tired|pressure|stress|unwind|shoulders/iu],
    ['history-short-followup', 'yes', /earlier|workday|work|stress|detail|mind|lead/iu],
    ['history-reciprocal', 'What about you?', /for me|I like|I am drawn|I would want|small details/iu]
  ];
  const replies = [];
  for (const [key, text, pattern] of turns) {
    const sent = await request(
      `/api/v1/customer/conversations/${conversation.payload.data.conversationId}/messages/text`,
      {
        method: 'POST',
        headers: { Cookie: cookie, 'Idempotency-Key': key },
        body: { text }
      }
    );
    assert.equal(sent.response.status, 201);
    app.processRobotReplies(robotReplyReadyTime(), 10);
    const reply = app.db.prepare(`
      SELECT * FROM ChatRecords
      WHERE ConversationId = ? AND SenderId = ?
      ORDER BY ChatTime DESC
      LIMIT 1
    `).get(conversation.payload.data.conversationId, robot.customerId);
    assert.equal(reply.ResponseSource, 'RobotLocal');
    assert.match(reply.Text, pattern);
    replies.push(reply.Text);
  }
  assert.equal(new Set(replies).size, replies.length);
  app.db.prepare("UPDATE CustomerProfile SET CreditsRemain = 250 WHERE Email = 'demo@datingeasy.test'")
    .run();
});

test('robot answers profile location and age questions from its profile', async () => {
  const cookie = await loginCustomer();
  app.db.prepare("UPDATE CustomerProfile SET CreditsRemain = 250 WHERE Email = 'demo@datingeasy.test'")
    .run();
  const robot = app.db.prepare(`
    SELECT CustomerId AS customerId, CityName AS cityName, BirthDate AS birthDate
    FROM CustomerProfile
    WHERE CustomerId = ?
  `).get(currentRobotIdBySex('Woman'));
  assert.ok(robot);
  app.db.prepare(`
    UPDATE Conversations
    SET UpdatedAt = ?
    WHERE CustomerAId = ? OR CustomerBId = ?
  `).run(
    new Date(Date.now() - 21 * 60 * 1000).toISOString(),
    robot.customerId,
    robot.customerId
  );
  const conversation = await request(`/api/v1/customer/conversations/with/${robot.customerId}`, {
    method: 'POST',
    headers: { Cookie: cookie }
  });
  const robotAge = new Date().getUTCFullYear() - Number(robot.birthDate.slice(0, 4)) -
    (new Date().toISOString().slice(5, 10) < robot.birthDate.slice(5, 10) ? 1 : 0);
  const questions = [
    ['profile-location-question', 'Where are you from?', new RegExp(robot.cityName, 'iu')],
    ['profile-age-question', 'How old are you?', new RegExp(`\\b${robotAge}\\b`, 'iu')]
  ];
  for (const [key, text, pattern] of questions) {
    const sent = await request(
      `/api/v1/customer/conversations/${conversation.payload.data.conversationId}/messages/text`,
      {
        method: 'POST',
        headers: { Cookie: cookie, 'Idempotency-Key': key },
        body: { text }
      }
    );
    assert.equal(sent.response.status, 201);
    app.processRobotReplies(robotReplyReadyTime(), 10);
    const reply = app.db.prepare(`
      SELECT * FROM ChatRecords
      WHERE ConversationId = ? AND SenderId = ?
      ORDER BY ChatTime DESC
      LIMIT 1
    `).get(conversation.payload.data.conversationId, robot.customerId);
    assert.equal(reply.ResponseSource, 'RobotLocal');
    assert.match(reply.Text, pattern);
  }
  app.db.prepare("UPDATE CustomerProfile SET CreditsRemain = 250 WHERE Email = 'demo@datingeasy.test'")
    .run();
});

test('robot avoids repeating profile answer phrases too close together', async () => {
  const cookie = await loginCustomer();
  app.db.prepare("UPDATE CustomerProfile SET CreditsRemain = 250 WHERE Email = 'demo@datingeasy.test'")
    .run();
  const robot = app.db.prepare(`
    SELECT CustomerId AS customerId
    FROM CustomerProfile
    WHERE CustomerId = ?
  `).get(currentRobotIdBySex('Woman'));
  app.db.prepare(`
    UPDATE Conversations
    SET UpdatedAt = ?
    WHERE CustomerAId = ? OR CustomerBId = ?
  `).run(
    new Date(Date.now() - 21 * 60 * 1000).toISOString(),
    robot.customerId,
    robot.customerId
  );
  const conversation = await request(`/api/v1/customer/conversations/with/${robot.customerId}`, {
    method: 'POST',
    headers: { Cookie: cookie }
  });
  const replies = [];
  for (let index = 0; index < 3; index += 1) {
    const sent = await request(
      `/api/v1/customer/conversations/${conversation.payload.data.conversationId}/messages/text`,
      {
        method: 'POST',
        headers: { Cookie: cookie, 'Idempotency-Key': `repeat-age-${index}` },
        body: { text: 'How old are you?' }
      }
    );
    assert.equal(sent.response.status, 201);
    app.processRobotReplies(robotReplyReadyTime(), 10);
    const reply = app.db.prepare(`
      SELECT Text FROM ChatRecords
      WHERE ConversationId = ? AND SenderId = ?
      ORDER BY ChatTime DESC
      LIMIT 1
    `).get(conversation.payload.data.conversationId, robot.customerId);
    replies.push(reply.Text);
  }
  assert.equal(new Set(replies).size, replies.length);
  assert.ok(replies.every((reply) => !reply.startsWith(replies[0].slice(0, 16)) || reply === replies[0]));
  app.db.prepare("UPDATE CustomerProfile SET CreditsRemain = 250 WHERE Email = 'demo@datingeasy.test'")
    .run();
});

test('off-line robot waits to answer until it is online', async () => {
  const cookie = await loginCustomer();
  app.db.prepare("UPDATE CustomerProfile SET CreditsRemain = 250 WHERE Email = 'demo@datingeasy.test'")
    .run();
  const discovery = await request('/api/v1/customer/discovery/profiles?query=Grace', {
    headers: { Cookie: cookie }
  });
  const grace = discovery.payload.data.items.find((profile) => profile.displayName === 'Grace');
  assert.ok(grace);
  const activeGraceShifts = app.db.prepare(`
    SELECT RobotShiftScheduleId
    FROM RobotShiftSchedule
    WHERE RobotCustomerId = ? AND ShiftStatus = 'Active'
  `).all(grace.customerId);
  app.db.prepare(`
    UPDATE RobotShiftSchedule
    SET ShiftStatus = 'Completed', ActualEndTime = ?, UpdateTime = ?
    WHERE RobotCustomerId = ? AND ShiftStatus = 'Active'
  `).run(new Date().toISOString(), new Date().toISOString(), grace.customerId);
  const offlineProfile = await request(`/api/v1/customer/profiles/${grace.customerId}`, {
    headers: { Cookie: cookie }
  });
  assert.equal(offlineProfile.response.status, 200);
  assert.equal(offlineProfile.payload.data.online, false);

  const conversation = await request(`/api/v1/customer/conversations/with/${grace.customerId}`, {
    method: 'POST',
    headers: { Cookie: cookie }
  });
  assert.equal(conversation.response.status, 200);
  const startingMessageCount = app.db.prepare(`
    SELECT COUNT(*) AS value FROM ChatRecords
    WHERE ConversationId = ?
  `).get(conversation.payload.data.conversationId).value;

  const messages = [
    'Hi Grace, I want to keep chatting with you.',
    'Tell me something calm about the ocean.'
  ];
  for (const [index, text] of messages.entries()) {
    const sent = await request(
      `/api/v1/customer/conversations/${conversation.payload.data.conversationId}/messages/text`,
      {
        method: 'POST',
        headers: { Cookie: cookie, 'Idempotency-Key': `grace-direct-chat-${index}` },
        body: { text }
      }
    );
    assert.equal(sent.response.status, 201);
    assert.equal(sent.payload.data.robotReply, null);
  }
  let stored = app.db.prepare(`
    SELECT COUNT(*) AS value FROM ChatRecords
    WHERE ConversationId = ?
  `).get(conversation.payload.data.conversationId).value;
  assert.equal(stored, startingMessageCount + 2);

  const coverage = app.db.prepare(`
    SELECT * FROM RobotCityCoverage
    WHERE CountryCode = 'US' AND StateId = 'CA' AND CityName = 'Los Angeles'
  `).get();
  const shiftStart = new Date(Date.now() - 1_000);
  const shiftEnd = new Date(Date.now() + 60 * 60 * 1000);
  const graceShiftId = randomUUID();
  app.db.prepare(`
    INSERT INTO RobotShiftSchedule (
      RobotShiftScheduleId, RobotCityCoverageId, RobotCustomerId,
      BusinessDate, SexSnapshot, TimeZoneIdSnapshot,
      StartUtcOffsetMinutes, EndUtcOffsetMinutes,
      PlannedStartTime, PlannedEndTime, ActualStartTime, ShiftStatus,
      IsReserve, CreateTime, UpdateTime
    ) VALUES (?, ?, ?, ?, 'Woman', 'America/Los_Angeles', 0, 0, ?, ?, ?, 'Active', 1, ?, ?)
  `).run(
    graceShiftId,
    coverage.RobotCityCoverageId,
    grace.customerId,
    new Date().toISOString().slice(0, 10),
    shiftStart.toISOString(),
    shiftEnd.toISOString(),
    shiftStart.toISOString(),
    shiftStart.toISOString(),
    shiftStart.toISOString()
  );
  const onlineProfile = await request(`/api/v1/customer/profiles/${grace.customerId}`, {
    headers: { Cookie: cookie }
  });
  assert.equal(onlineProfile.response.status, 200);
  assert.equal(onlineProfile.payload.data.online, true);

  const processed = app.processRobotReplies(robotReplyReadyTime(), 10);
  assert.equal(processed.sent, 1);
  stored = app.db.prepare(`
    SELECT COUNT(*) AS value FROM ChatRecords
    WHERE ConversationId = ?
  `).get(conversation.payload.data.conversationId).value;
  assert.equal(stored, startingMessageCount + 3);
  const latest = app.db.prepare(`
    SELECT * FROM ChatRecords
    WHERE ConversationId = ?
    ORDER BY ChatTime DESC
    LIMIT 1
  `).get(conversation.payload.data.conversationId);
  assert.equal(latest.SenderId, grace.customerId);
  assert.equal(latest.ResponseSource, 'RobotLocal');
  app.db.prepare(`
    UPDATE RobotShiftSchedule
    SET ShiftStatus = 'Completed', ActualEndTime = ?, UpdateTime = ?
    WHERE RobotShiftScheduleId = ?
  `).run(new Date().toISOString(), new Date().toISOString(), graceShiftId);
  for (const shift of activeGraceShifts) {
    app.db.prepare(`
      UPDATE RobotShiftSchedule
      SET ShiftStatus = 'Active', ActualEndTime = NULL, UpdateTime = ?
      WHERE RobotShiftScheduleId = ?
    `).run(new Date().toISOString(), shift.RobotShiftScheduleId);
  }
  app.db.prepare("UPDATE CustomerProfile SET CreditsRemain = 250 WHERE Email = 'demo@datingeasy.test'")
    .run();
});

test('one robot customer can chat with 10 real customers at the same time', async () => {
  const demoCookie = await loginCustomer();
  const discovery = await request('/api/v1/customer/discovery/profiles', {
    headers: { Cookie: demoCookie }
  });
  assert.equal(discovery.response.status, 200);
  const robot = { customerId: currentRobotIdBySex('Woman') };
  app.db.prepare(`
    UPDATE Conversations
    SET UpdatedAt = ?
    WHERE CustomerAId = ? OR CustomerBId = ?
  `).run(
    new Date(Date.now() - 21 * 60 * 1000).toISOString(),
    robot.customerId,
    robot.customerId
  );

  const realCustomers = await Promise.all(
    Array.from({ length: 10 }, (_, index) =>
      request('/api/v1/auth/customer/register', {
        method: 'POST',
        body: {
          email: `robot-concurrent-${index + 1}@example.test`,
          password: 'Password123!',
          displayName: `Robot Tester ${index + 1}`,
          birthDate: '1990-01-01',
          sex: 'Woman',
          countryCode: 'US',
          state: 'CA',
          city: 'Los Angeles'
        }
      })
    )
  );
  assert.ok(realCustomers.every((result) => result.response.status === 201));

  const conversations = await Promise.all(
    realCustomers.map((customer) =>
      request(`/api/v1/customer/conversations/with/${robot.customerId}`, {
        method: 'POST',
        headers: { Cookie: customer.cookie }
      })
    )
  );
  assert.ok(conversations.every((result) => result.response.status === 200));
  assert.equal(
    new Set(conversations.map((result) => result.payload.data.conversationId)).size,
    10
  );

  const sends = await Promise.all(
    conversations.map((conversation, index) =>
      request(
        `/api/v1/customer/conversations/${conversation.payload.data.conversationId}/messages/text`,
        {
          method: 'POST',
          headers: {
            Cookie: realCustomers[index].cookie,
            'Idempotency-Key': `robot-concurrent-message-${index + 1}`
          },
          body: {
            text: `Hello from real customer ${index + 1}. What would make today interesting?`
          }
        }
      )
    )
  );

  assert.ok(sends.every((result) => result.response.status === 201));
  assert.ok(sends.every((result) => result.payload.data.robotReply === null));
  app.processRobotReplies(robotReplyReadyTime(), 20);
  assert.ok(app.robotQueueSnapshot().cachedCustomers >= 10);

  const conversationIds = conversations.map(
    (result) => result.payload.data.conversationId
  );
  const placeholders = conversationIds.map(() => '?').join(', ');
  const records = app.db.prepare(`
    SELECT ConversationId, SenderId, ReceiverId, ResponseSource
    FROM ChatRecords
    WHERE ConversationId IN (${placeholders})
  `).all(...conversationIds);
  assert.equal(records.length, 20);
  assert.equal(
    records.filter(
      (record) =>
        record.SenderId === robot.customerId &&
        record.ResponseSource === 'RobotLocal'
    ).length,
    10
  );
  assert.equal(
    app.db.prepare('SELECT COUNT(*) AS count FROM EmployeeSeed WHERE CustomerId = ?')
      .get(robot.customerId).count,
    0
  );
});

test('real customer can chat with an employee-operated seed customer', async () => {
  const cookie = await loginCustomer();
  app.db.prepare("UPDATE CustomerProfile SET CreditsRemain = 250 WHERE Email = 'demo@datingeasy.test'")
    .run();
  const discovery = await request('/api/v1/customer/discovery/profiles', {
    headers: { Cookie: cookie }
  });
  assert.equal(discovery.response.status, 200);
  const seed = customerByDisplayName('Maya');
  assert.ok(seed);
  const conversation = await request(`/api/v1/customer/conversations/with/${seed.customerId}`, {
    method: 'POST',
    headers: { Cookie: cookie }
  });
  const sent = await request(
    `/api/v1/customer/conversations/${conversation.payload.data.conversationId}/messages/text`,
    {
      method: 'POST',
      headers: { Cookie: cookie, 'Idempotency-Key': 'real-to-seed-chat' },
      body: { text: 'Hello. What kind of weekend conversation do you enjoy?' }
    }
  );
  assert.equal(sent.response.status, 201);
  assert.equal(sent.payload.data.robotReply, null);
  const stored = app.db
    .prepare('SELECT * FROM ChatRecords WHERE ChatRecordId = ?')
    .get(sent.payload.data.chatRecordId);
  assert.equal(stored.ReceiverId, seed.customerId);
  assert.equal(stored.ActingEmployeeId, null);

  const employeeLogin = await request('/api/v1/auth/staff/login', {
    method: 'POST',
    body: { email: 'operator@datingeasy.test', password: 'Demo123!' }
  });
  const workspace = await request('/api/v1/backend/workspace', {
    headers: { Cookie: employeeLogin.cookie }
  });
  const assignedChat = workspace.payload.data.chatSlots.find(
    (slot) => slot.conversationId === conversation.payload.data.conversationId
  );
  assert.ok(assignedChat);
  assert.equal(assignedChat.seed.customerId, seed.customerId);
  assert.equal(assignedChat.waitingForEmployee, true);
  app.db.prepare("UPDATE CustomerProfile SET CreditsRemain = 250 WHERE Email = 'demo@datingeasy.test'")
    .run();
});

test('new seed messages mark the seed waiting and order its customer queue newest first', async () => {
  const discoveryCookie = await loginCustomer();
  const discovery = await request('/api/v1/customer/discovery/profiles', {
    headers: { Cookie: discoveryCookie }
  });
  assert.equal(discovery.response.status, 200);
  const seed = customerByDisplayName('Maya');
  assert.ok(seed);

  async function registerAndSend(email, displayName, message, idempotencyKey) {
    const registered = await request('/api/v1/auth/customer/register', {
      method: 'POST',
      body: {
        email,
        password: 'Password123!',
        displayName,
        birthDate: '1990-01-01',
        sex: 'Woman',
        countryCode: 'US',
        state: 'OR',
        city: 'Portland'
      }
    });
    const conversation = await request(
      `/api/v1/customer/conversations/with/${seed.customerId}`,
      {
        method: 'POST',
        headers: { Cookie: registered.cookie }
      }
    );
    const sent = await request(
      `/api/v1/customer/conversations/${conversation.payload.data.conversationId}/messages/text`,
      {
        method: 'POST',
        headers: {
          Cookie: registered.cookie,
          'Idempotency-Key': idempotencyKey
        },
        body: { text: message }
      }
    );
    assert.equal(sent.response.status, 201);
    return {
      customerId: registered.payload.data.customerId,
      conversationId: conversation.payload.data.conversationId
    };
  }

  const older = await registerAndSend(
    'seed-queue-older@example.test',
    'Older Customer',
    'This message should appear below the newer customer.',
    'seed-queue-older'
  );
  await new Promise((resolve) => setTimeout(resolve, 10));
  const newer = await registerAndSend(
    'seed-queue-newer@example.test',
    'Newest Customer',
    'This is the newest message for the selected seed.',
    'seed-queue-newer'
  );

  const employeeLogin = await request('/api/v1/auth/staff/login', {
    method: 'POST',
    body: { email: 'operator@datingeasy.test', password: 'Demo123!' }
  });
  const workspace = await request('/api/v1/backend/workspace', {
    headers: { Cookie: employeeLogin.cookie }
  });
  const seedSummary = workspace.payload.data.assignedSeeds.find(
    (profile) => profile.customerId === seed.customerId
  );
  const seedQueue = workspace.payload.data.chatSlots.filter(
    (slot) => slot.seed.customerId === seed.customerId
  );

  assert.ok(seedSummary.waitingCount >= 2);
  assert.equal(seedQueue[0].conversationId, newer.conversationId);
  assert.equal(seedQueue[0].realCustomer.customerId, newer.customerId);
  assert.ok(
    seedQueue.findIndex((slot) => slot.conversationId === newer.conversationId) <
      seedQueue.findIndex((slot) => slot.conversationId === older.conversationId)
  );
  assert.ok(seedQueue.every((slot, index) => (
    index === 0 || seedQueue[index - 1].updatedAt >= slot.updatedAt
  )));
});

test('conversations between two non-real customers are blocked', async () => {
  const cookie = await loginCustomer();
  const discovery = await request('/api/v1/customer/discovery/profiles', {
    headers: { Cookie: cookie }
  });
  assert.equal(discovery.response.status, 200);
  const seed = customerByDisplayName('Maya');
  const robot = customerByDisplayName('Emma');
  assert.ok(seed);
  assert.ok(robot);
  assert.throws(() => {
    const [a, b] = [seed.customerId, robot.customerId].sort();
    app.db.prepare(`
      INSERT INTO Conversations (
        ConversationId, CustomerAId, CustomerBId, CreateTime, UpdatedAt
      ) VALUES (?, ?, ?, ?, ?)
    `).run(randomUUID(), a, b, new Date().toISOString(), new Date().toISOString());
  }, /CUSTOMER_TYPE_CHAT_NOT_ALLOWED/);
});

test('customer can maintain a profile and dedicated favorites list', async () => {
  const cookie = await loginCustomer();
  const updated = await request('/api/v1/customer/me', {
    method: 'PATCH',
    headers: { Cookie: cookie },
    body: {
      displayName: 'Alex R',
      city: 'Pasadena',
      state: 'CA',
      lookingFor: 'Thoughtful conversation',
      bio: 'I enjoy art, cooking, and relaxed weekend conversations.'
    }
  });
  assert.equal(updated.response.status, 200);
  assert.equal(updated.payload.data.displayName, 'Alex R');
  assert.equal(updated.payload.data.city, 'Pasadena');

  const discovery = await request('/api/v1/customer/discovery/profiles', {
    headers: { Cookie: cookie }
  });
  assert.equal(discovery.response.status, 200);
  const targetId = customerByDisplayName('Maya').customerId;
  const favorite = await request(`/api/v1/customer/profiles/${targetId}/favorite`, {
    method: 'POST',
    headers: { Cookie: cookie }
  });
  assert.equal(favorite.response.status, 200);
  const favorites = await request('/api/v1/customer/favorites', {
    headers: { Cookie: cookie }
  });
  assert.equal(favorites.payload.data.items.length, 1);
  assert.equal(favorites.payload.data.items[0].customerId, targetId);
});

test('accepted message, credit deduction, and ledger entry commit atomically', async () => {
  const cookie = await loginCustomer();
  const discovery = await request('/api/v1/customer/discovery/profiles', {
    headers: { Cookie: cookie }
  });
  assert.equal(discovery.response.status, 200);
  const targetId = customerByDisplayName('Maya').customerId;
  const conversation = await request(`/api/v1/customer/conversations/with/${targetId}`, {
    method: 'POST',
    headers: { Cookie: cookie }
  });
  const conversationId = conversation.payload.data.conversationId;

  const sent = await request(
    `/api/v1/customer/conversations/${conversationId}/messages/text`,
    {
      method: 'POST',
      headers: {
        Cookie: cookie,
        'Idempotency-Key': 'atomic-message-1'
      },
      body: { text: 'That sounds lovely. What is your favorite kind of weekend?' }
    }
  );
  assert.equal(sent.response.status, 201);
  assert.equal(sent.payload.data.creditUsed, 5);
  assert.equal(sent.payload.data.creditBalance, 245);

  const message = app.db
    .prepare('SELECT * FROM ChatRecords WHERE ChatRecordId = ?')
    .get(sent.payload.data.chatRecordId);
  const ledger = app.db
    .prepare(`
      SELECT * FROM CreditLedger
      WHERE ReferenceType = 'ChatRecord' AND ReferenceId = ?
    `)
    .get(sent.payload.data.chatRecordId);
  const customer = app.db
    .prepare("SELECT CreditsRemain FROM CustomerProfile WHERE Email = 'demo@datingeasy.test'")
    .get();
  assert.equal(message.CreditUsed, 5);
  assert.equal(ledger.CreditsChange, -5);
  assert.equal(ledger.BalanceAfter, 245);
  assert.equal(customer.CreditsRemain, 245);
});

test('idempotent retry does not duplicate or charge twice', async () => {
  const cookie = await loginCustomer();
  const conversations = await request('/api/v1/customer/conversations', {
    headers: { Cookie: cookie }
  });
  const conversationId = conversations.payload.data.items.find(
    (item) => item.otherCustomer.displayName === 'Maya'
  ).conversationId;
  const options = {
    method: 'POST',
    headers: { Cookie: cookie, 'Idempotency-Key': 'retry-message-1' },
    body: { text: 'A retry should create only one message and one charge.' }
  };
  const first = await request(
    `/api/v1/customer/conversations/${conversationId}/messages/text`,
    options
  );
  const second = await request(
    `/api/v1/customer/conversations/${conversationId}/messages/text`,
    options
  );
  assert.equal(first.payload.data.chatRecordId, second.payload.data.chatRecordId);
  assert.equal(first.payload.data.creditBalance, 240);
  assert.equal(second.payload.data.creditBalance, 240);
  const count = app.db
    .prepare('SELECT COUNT(*) AS count FROM ChatRecords WHERE ChatRecordId = ?')
    .get(first.payload.data.chatRecordId).count;
  assert.equal(count, 1);
});

test('insufficient credit rejection creates no message or ledger charge', async () => {
  const customer = app.db
    .prepare("SELECT CustomerId FROM CustomerProfile WHERE Email = 'demo@datingeasy.test'")
    .get();
  app.db
    .prepare('UPDATE CustomerProfile SET CreditsRemain = 0 WHERE CustomerId = ?')
    .run(customer.CustomerId);
  const beforeMessages = app.db.prepare('SELECT COUNT(*) AS count FROM ChatRecords').get().count;
  const beforeLedger = app.db.prepare('SELECT COUNT(*) AS count FROM CreditLedger').get().count;
  const cookie = await loginCustomer();
  const conversations = await request('/api/v1/customer/conversations', {
    headers: { Cookie: cookie }
  });
  const result = await request(
    `/api/v1/customer/conversations/${conversations.payload.data.items[0].conversationId}/messages/text`,
    {
      method: 'POST',
      headers: { Cookie: cookie, 'Idempotency-Key': 'insufficient-1' },
      body: { text: 'This message should not be accepted.' }
    }
  );
  assert.equal(result.response.status, 422);
  assert.equal(result.payload.error.code, 'INSUFFICIENT_CREDITS');
  assert.equal(app.db.prepare('SELECT COUNT(*) AS count FROM ChatRecords').get().count, beforeMessages);
  assert.equal(app.db.prepare('SELECT COUNT(*) AS count FROM CreditLedger').get().count, beforeLedger);
});

test('simulated purchase grants the selected package in one transaction', async () => {
  const cookie = await loginCustomer();
  const chargesBefore = app.db.prepare('SELECT COUNT(*) AS count FROM ChargeRecord').get().count;
  const invalid = await request('/api/v1/customer/credit-purchases/simulate', {
    method: 'POST',
    headers: {
      Cookie: cookie,
      'Idempotency-Key': 'invalid-credit-card'
    },
    body: {
      packageId: 2,
      cardholderName: 'A',
      cardNumber: '1234',
      expirationMonth: 1,
      expirationYear: 2020,
      securityCode: 'x'
    }
  });
  assert.equal(invalid.response.status, 422);
  assert.equal(invalid.payload.error.code, 'PAYMENT_VALIDATION_FAILED');
  assert.equal(
    app.db.prepare('SELECT COUNT(*) AS count FROM ChargeRecord').get().count,
    chargesBefore
  );

  const purchaseOptions = {
    method: 'POST',
    headers: {
      Cookie: cookie,
      'Idempotency-Key': 'credit-purchase-package-2'
    },
    body: {
      packageId: 2,
      cardholderName: 'Alex Demo',
      cardNumber: '4242424242424242',
      expirationMonth: 12,
      expirationYear: 2030,
      securityCode: '123'
    }
  };
  const result = await request('/api/v1/customer/credit-purchases/simulate', purchaseOptions);
  assert.equal(result.response.status, 201);
  assert.equal(result.payload.data.creditsBought, 220);
  assert.equal(result.payload.data.creditBalance, 220);
  const retried = await request('/api/v1/customer/credit-purchases/simulate', purchaseOptions);
  assert.equal(retried.response.status, 200);
  assert.equal(retried.payload.data.chargeRecordId, result.payload.data.chargeRecordId);
  assert.equal(retried.payload.data.creditBalance, 220);
  const charge = app.db
    .prepare('SELECT * FROM ChargeRecord WHERE ChargeRecordId = ?')
    .get(result.payload.data.chargeRecordId);
  assert.equal(charge.Status, 'PrototypeSimulated');
  assert.equal(charge.CardholderName, 'Alex Demo');
  assert.equal(charge.CardType, 'VISA');
  assert.equal(charge.CardLast4, '4242');
  assert.equal(charge.ExpirationMonth, 12);
  assert.equal(charge.ExpirationYear, 2030);
  assert.equal('CardNumber' in charge, false);
  assert.equal('SecurityCode' in charge, false);
  assert.equal(
    app.db.prepare('SELECT COUNT(*) AS count FROM ChargeRecord WHERE ChargeRecordId = ?')
      .get(result.payload.data.chargeRecordId).count,
    1
  );
});

test('real customer buys credits with Visa and company income increases by the charge amount', async () => {
  const companyIncomeBefore = app.db
    .prepare('SELECT COALESCE(SUM(Amount), 0) AS total FROM ChargeRecord')
    .get().total;
  const registered = await request('/api/v1/auth/customer/register', {
    method: 'POST',
    body: {
      email: 'visa-buyer@example.test',
      password: 'Password123!',
      displayName: 'Visa Buyer',
      birthDate: '1988-04-12',
      sex: 'Man',
      countryCode: 'US',
      state: 'WA',
      city: 'Seattle'
    }
  });
  assert.equal(registered.response.status, 201);
  assert.equal(registered.payload.data.creditBalance, 50);

  const purchase = await request('/api/v1/customer/credit-purchases/simulate', {
    method: 'POST',
    headers: {
      Cookie: registered.cookie,
      'Idempotency-Key': 'visa-buyer-package-4'
    },
    body: {
      packageId: 4,
      cardholderName: 'Visa Buyer',
      cardNumber: '4242424242424242',
      expirationMonth: 12,
      expirationYear: 2030,
      securityCode: '123'
    }
  });
  assert.equal(purchase.response.status, 201);
  assert.equal(purchase.payload.data.amount, 50);
  assert.equal(purchase.payload.data.creditsBought, 700);
  assert.equal(purchase.payload.data.creditBalance, 750);

  const customer = app.db
    .prepare(`
      SELECT CreditsRemain, TotalCharged
      FROM CustomerProfile WHERE CustomerId = ?
    `)
    .get(registered.payload.data.customerId);
  assert.equal(customer.CreditsRemain, 750);
  assert.equal(customer.TotalCharged, 50);

  const charge = app.db
    .prepare('SELECT * FROM ChargeRecord WHERE ChargeRecordId = ?')
    .get(purchase.payload.data.chargeRecordId);
  assert.equal(charge.CustomerId, registered.payload.data.customerId);
  assert.equal(charge.Amount, 50);
  assert.equal(charge.CreditsBought, 700);
  assert.equal(charge.CardType, 'VISA');
  assert.equal(charge.CardLast4, '4242');
  assert.equal(charge.Status, 'PrototypeSimulated');

  const ledger = app.db
    .prepare(`
      SELECT * FROM CreditLedger
      WHERE ReferenceType = 'ChargeRecord' AND ReferenceId = ?
    `)
    .get(charge.ChargeRecordId);
  assert.equal(ledger.TransactionType, 'CreditPurchase');
  assert.equal(ledger.CreditsChange, 700);
  assert.equal(ledger.BalanceAfter, 750);

  const adminLogin = await request('/api/v1/auth/staff/login', {
    method: 'POST',
    body: { email: 'admin@datingeasy.test', password: 'Demo123!' }
  });
  const dashboard = await request('/api/v1/admin/dashboard', {
    headers: { Cookie: adminLogin.cookie }
  });
  assert.equal(dashboard.response.status, 200);
  assert.equal(dashboard.payload.data.metrics.revenueToday, companyIncomeBefore + 50);
  assert.equal(
    app.db.prepare('SELECT SUM(Amount) AS total FROM ChargeRecord').get().total,
    companyIncomeBefore + 50
  );
});

test('gift sends immediately when funded and rejects without partial writes when unfunded', async () => {
  const customer = app.db
    .prepare("SELECT CustomerId FROM CustomerProfile WHERE Email = 'demo@datingeasy.test'")
    .get();
  app.db
    .prepare('UPDATE CustomerProfile SET CreditsRemain = 250 WHERE CustomerId = ?')
    .run(customer.CustomerId);
  const cookie = await loginCustomer();
  const conversations = await request('/api/v1/customer/conversations', {
    headers: { Cookie: cookie }
  });
  const conversationId = conversations.payload.data.items.find(
    (item) => item.otherCustomer.displayName === 'Maya'
  ).conversationId;
  const gifts = await request('/api/v1/customer/gifts', { headers: { Cookie: cookie } });
  assert.equal(gifts.payload.data.items.length, 5);

  const sent = await request(`/api/v1/customer/conversations/${conversationId}/gifts`, {
    method: 'POST',
    headers: { Cookie: cookie, 'Idempotency-Key': 'gift-flower-1' },
    body: { giftId: 1 }
  });
  assert.equal(sent.response.status, 201);
  assert.equal(sent.payload.data.creditUsed, 100);
  assert.equal(sent.payload.data.creditBalance, 150);
  assert.equal(sent.payload.data.refundable, false);
  const transaction = app.db
    .prepare('SELECT * FROM GiftTransactions WHERE GiftTransactionId = ?')
    .get(sent.payload.data.giftTransactionId);
  assert.equal(transaction.RecipientCredits, 80);
  const employeeCredit = app.db
    .prepare('SELECT * FROM EmployeeCreditLedger WHERE GiftTransactionId = ?')
    .get(sent.payload.data.giftTransactionId);
  assert.equal(employeeCredit.CreditsChange, 80);

  const beforeGifts = app.db.prepare('SELECT COUNT(*) AS count FROM GiftTransactions').get().count;
  const rejected = await request(`/api/v1/customer/conversations/${conversationId}/gifts`, {
    method: 'POST',
    headers: { Cookie: cookie, 'Idempotency-Key': 'gift-diamond-unfunded' },
    body: { giftId: 4 }
  });
  assert.equal(rejected.response.status, 422);
  assert.equal(rejected.payload.error.code, 'INSUFFICIENT_CREDITS');
  assert.equal(app.db.prepare('SELECT COUNT(*) AS count FROM GiftTransactions').get().count, beforeGifts);
  assert.equal(
    app.db.prepare('SELECT CreditsRemain FROM CustomerProfile WHERE CustomerId = ?').get(customer.CustomerId).CreditsRemain,
    150
  );
});

test('registration enforces 18+ and grants an eligible account 50 credits', async () => {
  const missingLocation = await request('/api/v1/auth/customer/register', {
    method: 'POST',
    body: {
      email: 'missing-location@example.test',
      password: 'Password123!',
      displayName: 'No Location',
      birthDate: '1992-01-01',
      sex: 'Man'
    }
  });
  assert.equal(missingLocation.response.status, 422);
  assert.ok(missingLocation.payload.error.fields.countryCode);
  assert.ok(missingLocation.payload.error.fields.state);
  assert.ok(missingLocation.payload.error.fields.city);

  const underage = await request('/api/v1/auth/customer/register', {
    method: 'POST',
    body: {
      email: 'young@example.test',
      password: 'Password123!',
      displayName: 'Young',
      birthDate: '2012-01-01',
      sex: 'Woman',
      countryCode: 'US',
      state: 'OR',
      city: 'Portland'
    }
  });
  assert.equal(underage.response.status, 422);
  assert.equal(underage.payload.error.code, 'VALIDATION_FAILED');

  const eligible = await request('/api/v1/auth/customer/register', {
    method: 'POST',
    body: {
      email: 'new@example.test',
      password: 'Password123!',
      displayName: 'Taylor',
      birthDate: '1992-01-01',
      sex: 'Nonbinary',
      countryCode: 'US',
      state: 'OR',
      city: 'Portland'
    }
  });
  assert.equal(eligible.response.status, 201);
  assert.equal(eligible.payload.data.creditBalance, 50);
  assert.equal(eligible.payload.data.registrationReward.creditsGranted, 50);
  assert.equal(eligible.payload.data.mustCompleteProfile, true);

  const me = await request('/api/v1/customer/me', {
    headers: { Cookie: eligible.cookie }
  });
  assert.equal(me.payload.data.profileCompleted, false);
  assert.equal(me.payload.data.profilePhoto, '/assets/profiles/default-neutral.svg');
  assert.equal(me.payload.data.countryCode, 'US');
  assert.equal(me.payload.data.state, 'OR');
  assert.equal(me.payload.data.city, 'Portland');
});

test('new customer completes every profile section and can review it through Me', async () => {
  const registered = await request('/api/v1/auth/customer/register', {
    method: 'POST',
    body: {
      email: 'complete-profile@example.test',
      password: 'Password123!',
      displayName: 'Morgan',
      birthDate: '1990-05-15',
      sex: 'Woman',
      countryCode: 'US',
      state: 'CA',
      city: 'Pasadena'
    }
  });
  const completed = await request('/api/v1/customer/me', {
    method: 'PATCH',
    headers: { Cookie: registered.cookie },
    body: {
      displayName: 'Morgan',
      birthDate: '1990-05-15',
      sex: 'Woman',
      lookingFor: 'Everyone',
      countryCode: 'US',
      state: 'CA',
      city: 'Pasadena',
      maritalStatus: 'Single',
      workField: 'Education',
      englishLevel: 'Advanced',
      languages: ['English', 'Spanish'],
      traits: ['Honest', 'Kind', 'Curious'],
      interests: ['Traveling', 'Cooking', 'Reading'],
      movies: ['Comedy', 'Documentary'],
      music: ['Jazz', 'Folk'],
      goals: ['Finding a friend', 'A relationship'],
      preferredAgeMin: 30,
      preferredAgeMax: 55,
      personalityType: 'Quiet thinker',
      bio: 'Teacher, reader, and weekend cook.',
      story: 'I enjoy thoughtful conversations, local adventures, and meeting kind people.',
      profilePhoto: '/assets/profiles/default-woman.svg',
      publicPhotos: ['/assets/profiles/default-woman.svg'],
      privatePhotos: [],
      completeProfile: true
    }
  });
  assert.equal(completed.response.status, 200);
  assert.equal(completed.payload.data.profileCompleted, true);
  assert.equal(completed.payload.data.profileCompleteness, 100);

  const me = await request('/api/v1/customer/me', {
    headers: { Cookie: registered.cookie }
  });
  assert.equal(me.payload.data.maritalStatus, 'Single');
  assert.equal(me.payload.data.workField, 'Education');
  assert.deepEqual(me.payload.data.languages, ['English', 'Spanish']);
  assert.deepEqual(me.payload.data.traits, ['Honest', 'Kind', 'Curious']);
  assert.deepEqual(me.payload.data.goals, ['Finding a friend', 'A relationship']);
  assert.equal(me.payload.data.story.includes('thoughtful conversations'), true);
});

test('new customer can finish profile with basic information only', async () => {
  const registered = await request('/api/v1/auth/customer/register', {
    method: 'POST',
    body: {
      email: 'basic-profile@example.test',
      password: 'Password123!',
      displayName: 'Basic Morgan',
      birthDate: '1990-05-15',
      sex: 'Woman',
      countryCode: 'US',
      state: 'CA',
      city: 'Pasadena'
    }
  });
  const completed = await request('/api/v1/customer/me', {
    method: 'PATCH',
    headers: { Cookie: registered.cookie },
    body: {
      email: 'basic-profile-updated@example.test',
      phone: '+1-626-555-0198',
      displayName: 'Basic Morgan',
      birthDate: '1990-05-15',
      sex: 'Woman',
      lookingFor: 'Everyone',
      countryCode: 'US',
      state: 'CA',
      city: 'Pasadena',
      maritalStatus: 'Single',
      completeProfile: true
    }
  });
  assert.equal(completed.response.status, 200);
  assert.equal(completed.payload.data.email, 'basic-profile-updated@example.test');
  assert.equal(completed.payload.data.phone, '+1-626-555-0198');
  assert.equal(completed.payload.data.profileCompleted, true);
  assert.ok(completed.payload.data.profileCompleteness < 100);
  assert.deepEqual(completed.payload.data.languages, []);
  assert.equal(completed.payload.data.story, '');

  const discover = await request('/api/v1/customer/discovery/profiles', {
    headers: { Cookie: registered.cookie }
  });
  assert.equal(discover.response.status, 200);
  assert.ok(discover.payload.data.items.length > 0);
});

test('logout ignores client balance data and only revokes the session', async () => {
  const cookie = await loginCustomer();
  const before = app.db
    .prepare("SELECT CreditsRemain FROM CustomerProfile WHERE Email = 'demo@datingeasy.test'")
    .get().CreditsRemain;
  const logout = await request('/api/v1/auth/logout', {
    method: 'POST',
    headers: { Cookie: cookie },
    body: { creditBalance: 999999, balanceChanged: true }
  });
  assert.equal(logout.response.status, 200);
  const after = app.db
    .prepare("SELECT CreditsRemain FROM CustomerProfile WHERE Email = 'demo@datingeasy.test'")
    .get().CreditsRemain;
  assert.equal(after, before);
  const me = await request('/api/v1/customer/me', { headers: { Cookie: cookie } });
  assert.equal(me.response.status, 401);
});

test('employee sees assigned seed histories and can use all three response paths', async () => {
  const login = await request('/api/v1/auth/staff/login', {
    method: 'POST',
    body: { email: 'operator@datingeasy.test', password: 'Demo123!' }
  });
  const workspace = await request('/api/v1/backend/workspace', {
    headers: { Cookie: login.cookie }
  });
  assert.equal(workspace.response.status, 200);
  const keepalive = await request('/api/v1/auth/staff/keepalive', {
    method: 'POST',
    headers: { Cookie: login.cookie }
  });
  assert.equal(keepalive.response.status, 200);
  assert.equal(keepalive.payload.data.active, true);
  assert.equal(keepalive.payload.data.role, 'ChatEmployee');
  assert.equal(workspace.payload.data.assignedSeeds.length, 5);
  assert.ok(workspace.payload.data.assignedSeeds.every((profile) => profile.customerTypeCode === 1));
  assert.ok(workspace.payload.data.chatSlots.length >= 1);
  assert.ok(workspace.payload.data.chatSlots[0].messages.length >= 1);
  assert.ok(workspace.payload.data.chatSlots[0].waitingForEmployee);

  const conversationId = workspace.payload.data.chatSlots[0].conversationId;
  const seedId = workspace.payload.data.chatSlots[0].seed.customerId;
  const realCustomerId = workspace.payload.data.chatSlots[0].realCustomer.customerId;
  const prepared = workspace.payload.data.preparedReplies[0];
  const tooLong = await request(
    `/api/v1/backend/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      headers: {
        Cookie: login.cookie,
        'Idempotency-Key': 'employee-too-long-response'
      },
      body: {
        text: Array.from({ length: 61 }, (_, index) => `word${index + 1}`).join(' ')
      }
    }
  );
  assert.equal(tooLong.response.status, 422);
  assert.equal(tooLong.payload.error.code, 'MESSAGE_TOO_LONG');
  const cases = [
    {
      key: 'employee-written',
      body: { text: 'That sounds peaceful. I usually enjoy the quieter path.' },
      expectedSource: 'EmployeeWritten'
    },
    {
      key: 'prepared-unchanged',
      body: { text: prepared.text, preparedReplyId: prepared.preparedReplyId },
      expectedSource: 'PreparedText'
    },
    {
      key: 'prepared-edited',
      body: {
        text: `${prepared.text} Was there one moment you especially enjoyed?`,
        preparedReplyId: prepared.preparedReplyId
      },
      expectedSource: 'PreparedEdited'
    }
  ];

  for (const item of cases) {
    const sent = await request(
      `/api/v1/backend/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers: {
          Cookie: login.cookie,
          'Idempotency-Key': item.key
        },
        body: item.body
      }
    );
    assert.equal(sent.response.status, 201);
    assert.equal(sent.payload.data.senderId, seedId);
    assert.equal(sent.payload.data.receiverId, realCustomerId);
    assert.equal(sent.payload.data.responseSource, item.expectedSource);
    const stored = app.db
      .prepare('SELECT * FROM ChatRecords WHERE ChatRecordId = ?')
      .get(sent.payload.data.chatRecordId);
    assert.equal(stored.ActingEmployeeId, login.payload.data.employeeId);
    assert.equal(stored.ResponseSource, item.expectedSource);
  }
});

test('employee workspace returns the latest seed conversation messages', async () => {
  const registered = await request('/api/v1/auth/customer/register', {
    method: 'POST',
    body: {
      email: `latest-employee-chat-${randomUUID()}@example.test`,
      password: 'Password123!',
      displayName: 'Latest Riley',
      birthDate: '1990-06-08',
      sex: 'Woman',
      countryCode: 'US',
      state: 'OR',
      city: 'Portland'
    }
  });
  assert.equal(registered.response.status, 201);
  app.db.prepare('UPDATE CustomerProfile SET CreditsRemain = 500 WHERE CustomerId = ?')
    .run(registered.payload.data.customerId);
  const seed = customerByDisplayName('Maya');
  const conversation = await request(`/api/v1/customer/conversations/with/${seed.customerId}`, {
    method: 'POST',
    headers: { Cookie: registered.cookie }
  });
  assert.equal(conversation.response.status, 200);

  for (let index = 1; index <= 25; index += 1) {
    const message = await request(
      `/api/v1/customer/conversations/${conversation.payload.data.conversationId}/messages/text`,
      {
        method: 'POST',
        headers: {
          Cookie: registered.cookie,
          'Idempotency-Key': `employee-latest-message-${index}`
        },
        body: { text: `Employee latest message ${String(index).padStart(2, '0')}` }
      }
    );
    assert.equal(message.response.status, 201);
  }

  const employeeCookie = await loginStaff('operator@datingeasy.test');
  const workspace = await request('/api/v1/backend/workspace', {
    headers: { Cookie: employeeCookie }
  });
  assert.equal(workspace.response.status, 200);
  const slot = workspace.payload.data.chatSlots.find(
    (item) => item.conversationId === conversation.payload.data.conversationId
  );
  assert.ok(slot);
  assert.equal(slot.messages.length, 20);
  assert.equal(slot.messages[0].text, 'Employee latest message 06');
  assert.equal(slot.messages.at(-1).text, 'Employee latest message 25');
  assert.equal(
    slot.messages.some((message) => message.text === 'Employee latest message 01'),
    false
  );

  const directMessages = await request(
    `/api/v1/backend/conversations/${conversation.payload.data.conversationId}/messages`,
    { headers: { Cookie: employeeCookie } }
  );
  assert.equal(directMessages.response.status, 200);
  assert.equal(directMessages.payload.data.messages.length, 20);
  assert.equal(directMessages.payload.data.messages.at(-1).text, 'Employee latest message 25');
});

test('employee and administrator routes enforce role separation', async () => {
  const employeeLogin = await request('/api/v1/auth/staff/login', {
    method: 'POST',
    body: { email: 'operator@datingeasy.test', password: 'Demo123!' }
  });
  const employeeWorkspace = await request('/api/v1/backend/workspace', {
    headers: { Cookie: employeeLogin.cookie }
  });
  assert.equal(employeeWorkspace.response.status, 200);
  assert.equal(employeeWorkspace.payload.data.assignedSeeds.length, 5);
  const employeeAdmin = await request('/api/v1/admin/dashboard', {
    headers: { Cookie: employeeLogin.cookie }
  });
  assert.equal(employeeAdmin.response.status, 403);

  const adminLogin = await request('/api/v1/auth/staff/login', {
    method: 'POST',
    body: { email: 'admin@datingeasy.test', password: 'Demo123!' }
  });
  const dashboard = await request('/api/v1/admin/dashboard', {
    headers: { Cookie: adminLogin.cookie }
  });
  assert.equal(dashboard.response.status, 200);
  assert.equal(dashboard.payload.data.metrics.seedCustomers.total, 1005);
  assert.equal(dashboard.payload.data.metrics.seedCustomers.online, 1005);
  assert.equal(dashboard.payload.data.metrics.robotCustomers.total, 412);
  assert.equal(dashboard.payload.data.metrics.robotCustomers.online, 2);
});

test('admin overview reports total and online customer types with current-day finance only', async () => {
  const yesterday = new Date(Date.now() - 86_400_000).toISOString();
  const demoCustomer = app.db
    .prepare("SELECT CustomerId FROM CustomerProfile WHERE Email = 'demo@datingeasy.test'")
    .get();
  app.db.prepare(`
    INSERT INTO ChargeRecord (
      ChargeRecordId, CustomerId, ChargeTime, Amount, CreditsBought,
      Status, ProviderReference, CardType, CardLast4
    ) VALUES (?, ?, ?, 999, 999, 'PrototypeSimulated', ?, 'VISA', '4242')
  `).run(randomUUID(), demoCustomer.CustomerId, yesterday, `old_${randomUUID()}`);
  app.db.prepare(`
    INSERT INTO CreditLedger (
      CreditLedgerId, CustomerId, TransactionTime, TransactionType,
      CreditsChange, BalanceAfter, ReferenceType, Remark
    ) VALUES (?, ?, ?, 'HistoricalTest', -99, 0, 'Prototype', 'Prior-day test row')
  `).run(randomUUID(), demoCustomer.CustomerId, yesterday);

  const customerCookie = await loginCustomer();
  const adminLogin = await request('/api/v1/auth/staff/login', {
    method: 'POST',
    body: { email: 'admin@datingeasy.test', password: 'Demo123!' }
  });
  const dashboard = await request('/api/v1/admin/dashboard', {
    headers: { Cookie: adminLogin.cookie }
  });
  const today = new Date().toISOString().slice(0, 10);
  const expectedRevenue = app.db.prepare(`
    SELECT COALESCE(SUM(Amount), 0) AS value FROM ChargeRecord
    WHERE substr(ChargeTime, 1, 10) = ?
      AND Status IN ('Succeeded', 'PrototypeSimulated')
  `).get(today).value;
  const expectedConsumed = app.db.prepare(`
    SELECT COALESCE(SUM(-CreditsChange), 0) AS value FROM CreditLedger
    WHERE CreditsChange < 0 AND substr(TransactionTime, 1, 10) = ?
  `).get(today).value;

  assert.equal(dashboard.response.status, 200);
  assert.ok(dashboard.payload.data.metrics.realCustomers.total >= 1);
  assert.ok(dashboard.payload.data.metrics.realCustomers.online >= 1);
  assert.equal(dashboard.payload.data.metrics.seedCustomers.total, 1005);
  assert.equal(dashboard.payload.data.metrics.seedCustomers.online, 1005);
  assert.equal(dashboard.payload.data.metrics.robotCustomers.total, 412);
  assert.equal(dashboard.payload.data.metrics.robotCustomers.online, 2);
  assert.equal(dashboard.payload.data.metrics.revenueToday, expectedRevenue);
  assert.equal(dashboard.payload.data.metrics.creditsConsumedToday, expectedConsumed);
  assert.notEqual(dashboard.payload.data.metrics.revenueToday, expectedRevenue + 999);
  assert.ok(customerCookie);
});

test('customer password recovery requires approval, temporary login, and password change', async () => {
  const registered = await request('/api/v1/auth/customer/register', {
    method: 'POST',
    body: {
      email: 'recovery-customer@example.test',
      phone: '+1-206-555-0188',
      password: 'Original123!',
      displayName: 'Recovery Customer',
      birthDate: '1985-03-04',
      sex: 'Woman',
      countryCode: 'US',
      state: 'WA',
      city: 'Seattle'
    }
  });
  const reset = await request('/api/v1/auth/customer/password-reset-requests', {
    method: 'POST',
    body: {
      fullName: 'Recovery Customer',
      contact: '+1-206-555-0188'
    }
  });
  assert.equal(reset.response.status, 202);
  assert.equal(reset.payload.data.status, 'Pending');

  const adminLogin = await request('/api/v1/auth/staff/login', {
    method: 'POST',
    body: { email: 'admin@datingeasy.test', password: 'Demo123!' }
  });
  const queue = await request('/api/v1/admin/password-reset-requests', {
    headers: { Cookie: adminLogin.cookie }
  });
  const queued = queue.payload.data.items.find(
    (item) => item.passwordResetRequestId === reset.payload.data.passwordResetRequestId
  );
  assert.equal(queued.customerName, 'Recovery Customer');
  assert.equal(queued.contactType, 'Phone');
  assert.match(queued.contactValueMasked, /0188$/u);

  const approved = await request(
    `/api/v1/admin/password-reset-requests/${queued.passwordResetRequestId}/approve`,
    {
      method: 'POST',
      headers: { Cookie: adminLogin.cookie }
    }
  );
  assert.equal(approved.response.status, 200);
  assert.equal(approved.payload.data.mustChangePassword, true);
  assert.ok(approved.payload.data.temporaryPassword.length >= 8);

  const oldLogin = await request('/api/v1/auth/customer/login', {
    method: 'POST',
    body: { email: 'recovery-customer@example.test', password: 'Original123!' }
  });
  assert.equal(oldLogin.response.status, 401);
  const temporaryLogin = await request('/api/v1/auth/customer/login', {
    method: 'POST',
    body: {
      email: 'recovery-customer@example.test',
      password: approved.payload.data.temporaryPassword
    }
  });
  assert.equal(temporaryLogin.payload.data.mustChangePassword, true);
  const blockedBeforeChange = await request('/api/v1/customer/discovery/profiles', {
    headers: { Cookie: temporaryLogin.cookie }
  });
  assert.equal(blockedBeforeChange.response.status, 403);
  assert.equal(blockedBeforeChange.payload.error.code, 'PASSWORD_CHANGE_REQUIRED');
  const changed = await request('/api/v1/customer/me/password', {
    method: 'POST',
    headers: { Cookie: temporaryLogin.cookie },
    body: {
      currentPassword: approved.payload.data.temporaryPassword,
      newPassword: 'Permanent456!'
    }
  });
  assert.equal(changed.response.status, 200);
  const permanentLogin = await request('/api/v1/auth/customer/login', {
    method: 'POST',
    body: { email: 'recovery-customer@example.test', password: 'Permanent456!' }
  });
  assert.equal(permanentLogin.response.status, 200);
  assert.equal(permanentLogin.payload.data.mustChangePassword, false);
  assert.equal(registered.payload.data.customerId, queued.customerId);

  const policies = await request('/api/v1/admin/policies', {
    headers: { Cookie: adminLogin.cookie }
  });
  const autoPolicy = policies.payload.data.items.find(
    (item) => item.policyKey === 'password_reset_auto_approve'
  );
  await request(`/api/v1/admin/policies/${autoPolicy.policyId}`, {
    method: 'PATCH',
    headers: { Cookie: adminLogin.cookie },
    body: { value: 'true', active: true }
  });
  await request('/api/v1/auth/customer/register', {
    method: 'POST',
    body: {
      email: 'auto-recovery@example.test',
      password: 'Original123!',
      displayName: 'Auto Recovery',
      birthDate: '1986-02-03',
      sex: 'Man',
      countryCode: 'US',
      state: 'CO',
      city: 'Denver'
    }
  });
  const autoReset = await request('/api/v1/auth/customer/password-reset-requests', {
    method: 'POST',
    body: { fullName: 'Auto Recovery', contact: 'auto-recovery@example.test' }
  });
  assert.equal(autoReset.payload.data.status, 'AutoApproved');
  assert.equal(
    app.db.prepare(`
      SELECT Status FROM PasswordResetRequests WHERE PasswordResetRequestId = ?
    `).get(autoReset.payload.data.passwordResetRequestId).Status,
    'AutoApproved'
  );
  assert.equal(
    app.db.prepare(`
      SELECT MustChangePassword FROM CustomerProfile WHERE EmailNormalized = ?
    `).get('auto-recovery@example.test').MustChangePassword,
    1
  );
  await request(`/api/v1/admin/policies/${autoPolicy.policyId}`, {
    method: 'PATCH',
    headers: { Cookie: adminLogin.cookie },
    body: { value: 'false', active: true }
  });

  await request('/api/v1/auth/customer/register', {
    method: 'POST',
    body: {
      email: 'rejected-recovery@example.test',
      password: 'Original123!',
      displayName: 'Rejected Recovery',
      birthDate: '1987-02-03',
      sex: 'Woman',
      countryCode: 'US',
      state: 'CO',
      city: 'Denver'
    }
  });
  const rejectable = await request('/api/v1/auth/customer/password-reset-requests', {
    method: 'POST',
    body: { fullName: 'Rejected Recovery', contact: 'rejected-recovery@example.test' }
  });
  const rejected = await request(
    `/api/v1/admin/password-reset-requests/${rejectable.payload.data.passwordResetRequestId}/reject`,
    { method: 'POST', headers: { Cookie: adminLogin.cookie } }
  );
  assert.equal(rejected.response.status, 200);
  const secondDecision = await request(
    `/api/v1/admin/password-reset-requests/${rejectable.payload.data.passwordResetRequestId}/approve`,
    { method: 'POST', headers: { Cookie: adminLogin.cookie } }
  );
  assert.equal(secondDecision.response.status, 409);
});

test('admin creates, edits, and removes all supported employee roles', async () => {
  const adminLogin = await request('/api/v1/auth/staff/login', {
    method: 'POST',
    body: { email: 'admin@datingeasy.test', password: 'Demo123!' }
  });
  const createdEmployees = [];
  for (const role of ['ChatEmployee', 'Administrator', 'CEO']) {
    const created = await request('/api/v1/admin/employees', {
      method: 'POST',
      headers: { Cookie: adminLogin.cookie },
      body: {
        email: `${role.toLowerCase()}-new@example.test`,
        displayName: `New ${role}`,
        sex: 'NotSpecified',
        birthDate: '1991-02-03',
        phone: '+1-213-555-0900',
        address: '400 Test Staff Lane, Los Angeles, CA',
        education: `${role} training program`,
        role
      }
    });
    assert.equal(created.response.status, 201);
    assert.equal(created.payload.data.employee.role, role);
    assert.equal(created.payload.data.employee.phone, '+1-213-555-0900');
    assert.equal(created.payload.data.employee.education, `${role} training program`);
    const staffLogin = await request('/api/v1/auth/staff/login', {
      method: 'POST',
      body: {
        email: `${role.toLowerCase()}-new@example.test`,
        password: created.payload.data.temporaryPassword
      }
    });
    assert.equal(staffLogin.response.status, 200);
    assert.equal(staffLogin.payload.data.role, role);
    createdEmployees.push(created.payload.data.employee);
  }

  const edited = await request(
    `/api/v1/admin/employees/${createdEmployees[0].employeeId}`,
    {
      method: 'PATCH',
      headers: { Cookie: adminLogin.cookie },
      body: {
        displayName: 'Edited Chat Employee',
        phone: '+1-213-555-0999',
        address: '401 Edited Staff Lane, Los Angeles, CA',
        education: 'Administrator onboarding',
        role: 'Administrator',
        active: true
      }
    }
  );
  assert.equal(edited.payload.data.employee.displayName, 'Edited Chat Employee');
  assert.equal(edited.payload.data.employee.role, 'Administrator');
  assert.equal(edited.payload.data.employee.phone, '+1-213-555-0999');
  assert.equal(edited.payload.data.employee.education, 'Administrator onboarding');

  for (const employee of createdEmployees) {
    const removed = await request(`/api/v1/admin/employees/${employee.employeeId}`, {
      method: 'DELETE',
      headers: { Cookie: adminLogin.cookie }
    });
    assert.equal(removed.response.status, 200);
  }
  assert.ok(createdEmployees.every((created) => (
    app.db.prepare('SELECT Active FROM Employees WHERE EmployeeId = ?')
      .get(created.employeeId).Active === 0
  )));
});

test('admin can filter, edit, activate, and deactivate robot customers', async () => {
  const adminLogin = await request('/api/v1/auth/staff/login', {
    method: 'POST',
    body: { email: 'admin@datingeasy.test', password: 'Demo123!' }
  });
  const filtered = await request(
    '/api/v1/admin/robot-operations?countryCode=US&state=CA&city=Los%20Angeles&active=true',
    { headers: { Cookie: adminLogin.cookie } }
  );
  assert.equal(filtered.response.status, 200);
  assert.ok(filtered.payload.data.robots.length > 0);
  assert.ok(filtered.payload.data.robots.every((robot) => (
    robot.countryCode === 'US' &&
    robot.state === 'CA' &&
    robot.city === 'Los Angeles' &&
    robot.active === true &&
    robot.online === true
  )));
  assert.ok(filtered.payload.data.robots.length <= 2);

  const robot = filtered.payload.data.robots[0];
  const originalName = robot.displayName;
  const editedName = `${originalName} Edited`;
  const activeShiftIds = app.db.prepare(`
    SELECT RobotShiftScheduleId
    FROM RobotShiftSchedule
    WHERE RobotCustomerId = ? AND ShiftStatus = 'Active'
  `).all(robot.customerId).map((shift) => shift.RobotShiftScheduleId);
  const edited = await request(`/api/v1/admin/robot-customers/${robot.customerId}`, {
    method: 'PATCH',
    headers: { Cookie: adminLogin.cookie },
    body: { displayName: editedName, active: true }
  });
  assert.equal(edited.response.status, 200);
  assert.equal(edited.payload.data.displayName, editedName);
  assert.equal(
    app.db.prepare('SELECT DisplayName FROM CustomerProfile WHERE CustomerId = ?')
      .get(robot.customerId).DisplayName,
    editedName
  );

  const deactivated = await request(`/api/v1/admin/robot-customers/${robot.customerId}`, {
    method: 'PATCH',
    headers: { Cookie: adminLogin.cookie },
    body: { active: false }
  });
  assert.equal(deactivated.response.status, 200);
  assert.equal(deactivated.payload.data.active, false);
  const inactiveSearch = await request(
    '/api/v1/admin/robot-operations?countryCode=US&state=CA&city=Los%20Angeles&active=false',
    { headers: { Cookie: adminLogin.cookie } }
  );
  assert.ok(inactiveSearch.payload.data.robots.some((item) => item.customerId === robot.customerId));
  assert.ok(inactiveSearch.payload.data.robots.every((item) => item.online === false));

  const restored = await request(`/api/v1/admin/robot-customers/${robot.customerId}`, {
    method: 'PATCH',
    headers: { Cookie: adminLogin.cookie },
    body: { displayName: originalName, active: true }
  });
  for (const shiftId of activeShiftIds) {
    app.db.prepare(`
      UPDATE RobotShiftSchedule
      SET ShiftStatus = 'Active', FailureCode = NULL, ActualEndTime = NULL, UpdateTime = ?
      WHERE RobotShiftScheduleId = ?
    `).run(new Date().toISOString(), shiftId);
  }
  assert.equal(restored.payload.data.displayName, originalName);
  assert.equal(restored.payload.data.active, true);
});

test('admin can add, edit, disable, and enable policies and inspect system health', async () => {
  const adminLogin = await request('/api/v1/auth/staff/login', {
    method: 'POST',
    body: { email: 'admin@datingeasy.test', password: 'Demo123!' }
  });
  const created = await request('/api/v1/admin/policies', {
    method: 'POST',
    headers: { Cookie: adminLogin.cookie },
    body: {
      policyKey: 'test_daily_policy',
      title: 'Daily test policy',
      description: 'Created by the administration integration test.',
      value: 'alpha',
      active: true
    }
  });
  assert.equal(created.response.status, 201);
  const policyId = created.payload.data.policyId;
  const disabled = await request(`/api/v1/admin/policies/${policyId}`, {
    method: 'PATCH',
    headers: { Cookie: adminLogin.cookie },
    body: { title: 'Daily policy edited', value: 'beta', active: false }
  });
  assert.equal(disabled.payload.data.version, 2);
  const enabled = await request(`/api/v1/admin/policies/${policyId}`, {
    method: 'PATCH',
    headers: { Cookie: adminLogin.cookie },
    body: { active: true }
  });
  assert.equal(enabled.payload.data.version, 3);
  const policies = await request('/api/v1/admin/policies', {
    headers: { Cookie: adminLogin.cookie }
  });
  const policy = policies.payload.data.items.find((item) => item.policyId === policyId);
  assert.equal(policy.title, 'Daily policy edited');
  assert.equal(policy.value, 'beta');
  assert.equal(policy.active, true);
  assert.equal(policy.version, 3);

  const health = await request('/api/v1/admin/health', {
    headers: { Cookie: adminLogin.cookie }
  });
  assert.equal(health.response.status, 200);
  assert.ok(health.payload.data.services.length >= 5);
  assert.equal(
    health.payload.data.services.find((service) => service.name === 'Database').status,
    'Healthy'
  );
});

test('CEO dashboard summarizes finance and presence and exclusively decides outgoing payments', async () => {
  const adminLogin = await request('/api/v1/auth/staff/login', {
    method: 'POST',
    body: { email: 'admin@datingeasy.test', password: 'Demo123!' }
  });
  const forbidden = await request('/api/v1/ceo/dashboard', {
    headers: { Cookie: adminLogin.cookie }
  });
  assert.equal(forbidden.response.status, 403);
  assert.equal(forbidden.payload.error.code, 'CEO_APPROVAL_REQUIRED');

  const prepared = await request('/api/v1/admin/outgoing-payments', {
    method: 'POST',
    headers: { Cookie: adminLogin.cookie },
    body: {
      payeeName: 'Integration Vendor',
      category: 'Contractor',
      amount: 180.5,
      currencyCode: 'USD',
      description: 'Integration test implementation services.'
    }
  });
  assert.equal(prepared.response.status, 201);
  assert.equal(prepared.payload.data.payment.status, 'Pending');
  assert.equal(prepared.payload.data.payment.requestedByName, 'Morgan Chen');

  const preparedList = await request('/api/v1/admin/outgoing-payments', {
    headers: { Cookie: adminLogin.cookie }
  });
  assert.equal(preparedList.response.status, 200);
  assert.equal(
    preparedList.payload.data.items[0].outgoingPaymentRequestId,
    prepared.payload.data.payment.outgoingPaymentRequestId
  );

  const customerCookie = await loginCustomer();
  const ceoLogin = await request('/api/v1/auth/staff/login', {
    method: 'POST',
    body: { email: 'ceo@datingeasy.test', password: 'Demo123!' }
  });
  const dashboard = await request('/api/v1/ceo/dashboard', {
    headers: { Cookie: ceoLogin.cookie }
  });
  assert.equal(dashboard.response.status, 200);
  assert.equal(dashboard.payload.data.ceo.role, 'CEO');
  assert.ok(dashboard.payload.data.online.realCustomers >= 1);
  assert.ok(dashboard.payload.data.online.employees >= 2);
  assert.equal(dashboard.payload.data.online.seedCustomers, 1005);
  assert.equal(dashboard.payload.data.online.robotCustomers, 2);
  assert.equal(dashboard.payload.data.health.services.length, 5);
  assert.equal(dashboard.payload.data.approvals.length, 3);
  assert.ok(dashboard.payload.data.approvals.some(
    (item) => item.outgoingPaymentRequestId === prepared.payload.data.payment.outgoingPaymentRequestId
  ));

  const timestamp = new Date().toISOString();
  const prefixes = [timestamp.slice(0, 4), timestamp.slice(0, 7), timestamp.slice(0, 10)];
  const keys = ['year', 'month', 'day'];
  keys.forEach((key, index) => {
    const prefix = prefixes[index];
    const expectedRevenue = app.db.prepare(`
      SELECT COALESCE(SUM(Amount), 0) AS value FROM ChargeRecord
      WHERE substr(ChargeTime, 1, ?) = ?
        AND Status IN ('Succeeded', 'PrototypeSimulated')
    `).get(prefix.length, prefix).value;
    const expectedExpense = app.db.prepare(`
      SELECT COALESCE(SUM(Amount), 0) AS value FROM OutgoingPaymentRequests
      WHERE Status = 'Approved' AND substr(DecisionTime, 1, ?) = ?
    `).get(prefix.length, prefix).value;
    assert.equal(dashboard.payload.data.finance.revenue[key], expectedRevenue);
    assert.equal(dashboard.payload.data.finance.expense[key], expectedExpense);
  });

  const approveItem = dashboard.payload.data.approvals.find(
    (item) => item.outgoingPaymentRequestId === prepared.payload.data.payment.outgoingPaymentRequestId
  );
  const denyItem = dashboard.payload.data.approvals.find(
    (item) => item.outgoingPaymentRequestId !== approveItem.outgoingPaymentRequestId
  );
  const adminApproval = await request(
    `/api/v1/ceo/outgoing-payments/${approveItem.outgoingPaymentRequestId}/approve`,
    { method: 'POST', headers: { Cookie: adminLogin.cookie } }
  );
  assert.equal(adminApproval.response.status, 403);

  const expenseBefore = dashboard.payload.data.finance.expense.day;
  const approved = await request(
    `/api/v1/ceo/outgoing-payments/${approveItem.outgoingPaymentRequestId}/approve`,
    {
      method: 'POST',
      headers: { Cookie: ceoLogin.cookie },
      body: { remark: 'Approved after executive review.' }
    }
  );
  assert.equal(approved.response.status, 200);
  assert.equal(approved.payload.data.status, 'Approved');

  const denied = await request(
    `/api/v1/ceo/outgoing-payments/${denyItem.outgoingPaymentRequestId}/deny`,
    {
      method: 'POST',
      headers: { Cookie: ceoLogin.cookie },
      body: { remark: 'Denied pending a revised invoice.' }
    }
  );
  assert.equal(denied.response.status, 200);
  assert.equal(denied.payload.data.status, 'Denied');

  const refreshed = await request('/api/v1/ceo/dashboard', {
    headers: { Cookie: ceoLogin.cookie }
  });
  assert.equal(refreshed.payload.data.approvals.length, 1);
  assert.equal(
    refreshed.payload.data.finance.expense.day,
    expenseBefore + approveItem.amount
  );
  assert.ok(customerCookie);
});
