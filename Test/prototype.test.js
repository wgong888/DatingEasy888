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

test('customer login returns the durable opening balance', async () => {
  const cookie = await loginCustomer();
  const me = await request('/api/v1/customer/me', { headers: { Cookie: cookie } });
  assert.equal(me.response.status, 200);
  assert.equal(me.payload.data.creditBalance, 250);
  assert.equal(me.payload.data.displayName, 'Alex');
});

test('customer discovery hides internal customer types', async () => {
  const cookie = await loginCustomer();
  const result = await request('/api/v1/customer/discovery/profiles', {
    headers: { Cookie: cookie }
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.payload.data.items.length, 13);
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

  const conversations = await request('/api/v1/customer/conversations', {
    headers: { Cookie: cookie }
  });
  conversations.payload.data.items.forEach((item) => assertTypeHidden(item.otherCustomer));
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

test('real customer can chat with a robot customer that answers autonomously', async () => {
  const cookie = await loginCustomer();
  app.db.prepare("UPDATE CustomerProfile SET CreditsRemain = 250 WHERE Email = 'demo@datingeasy.test'")
    .run();
  const discovery = await request('/api/v1/customer/discovery/profiles', {
    headers: { Cookie: cookie }
  });
  const robot = discovery.payload.data.items.find(
    (profile) => profile.customerId === currentRobotId(1)
  );
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
  assert.equal(sent.payload.data.robotReply.senderId, robot.customerId);
  assert.equal(sent.payload.data.robotReply.responseSource, 'RobotLocal');
  const stored = app.db
    .prepare('SELECT * FROM ChatRecords WHERE ChatRecordId = ?')
    .get(sent.payload.data.robotReply.chatRecordId);
  assert.equal(stored.ActingEmployeeId, null);
  assert.equal(stored.ResponseSource, 'RobotLocal');
  assert.equal(
    app.db.prepare('SELECT COUNT(*) AS count FROM EmployeeSeed WHERE CustomerId = ?')
      .get(robot.customerId).count,
    0
  );
  app.db.prepare('DELETE FROM CreditLedger WHERE ReferenceId = ?')
    .run(sent.payload.data.chatRecordId);
  app.db.prepare('DELETE FROM ChatRecords WHERE ChatRecordId IN (?, ?)')
    .run(sent.payload.data.chatRecordId, sent.payload.data.robotReply.chatRecordId);
  app.db.prepare("UPDATE CustomerProfile SET CreditsRemain = 250 WHERE Email = 'demo@datingeasy.test'")
    .run();
});

test('one robot customer can chat with 10 real customers at the same time', async () => {
  const demoCookie = await loginCustomer();
  const discovery = await request('/api/v1/customer/discovery/profiles', {
    headers: { Cookie: demoCookie }
  });
  const robot = discovery.payload.data.items.find(
    (profile) => profile.customerId === currentRobotId()
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
  assert.ok(sends.every((result) => result.payload.data.robotReply));
  assert.ok(
    sends.every(
      (result) =>
        result.payload.data.robotReply.senderId === robot.customerId &&
        result.payload.data.robotReply.responseSource === 'RobotLocal'
    )
  );

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
  const seed = discovery.payload.data.items.find((profile) => profile.displayName === 'Maya');
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
  const seed = discovery.payload.data.items.find((profile) => profile.displayName === 'Maya');

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
  const seed = discovery.payload.data.items.find((profile) => profile.displayName === 'Maya');
  const robot = discovery.payload.data.items.find((profile) => profile.displayName === 'Daniel');
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
  const targetId = discovery.payload.data.items.find(
    (profile) => profile.displayName === 'Maya'
  ).customerId;
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
  const targetId = discovery.payload.data.items.find(
    (profile) => profile.displayName === 'Maya'
  ).customerId;
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
  assert.equal(workspace.payload.data.assignedSeeds.length, 5);
  assert.ok(workspace.payload.data.assignedSeeds.every((profile) => profile.customerTypeCode === 1));
  assert.ok(workspace.payload.data.chatSlots.length >= 3);
  assert.ok(workspace.payload.data.chatSlots[0].messages.length >= 1);
  assert.ok(workspace.payload.data.chatSlots[0].waitingForEmployee);

  const conversationId = workspace.payload.data.chatSlots[0].conversationId;
  const seedId = workspace.payload.data.chatSlots[0].seed.customerId;
  const realCustomerId = workspace.payload.data.chatSlots[0].realCustomer.customerId;
  const prepared = workspace.payload.data.preparedReplies[0];
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
  assert.equal(dashboard.payload.data.metrics.seedCustomers.total, 5);
  assert.equal(dashboard.payload.data.metrics.seedCustomers.online, 5);
  assert.equal(dashboard.payload.data.metrics.robotCustomers.total, 8);
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
  assert.equal(dashboard.payload.data.metrics.seedCustomers.total, 5);
  assert.equal(dashboard.payload.data.metrics.seedCustomers.online, 5);
  assert.equal(dashboard.payload.data.metrics.robotCustomers.total, 8);
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
        role
      }
    });
    assert.equal(created.response.status, 201);
    assert.equal(created.payload.data.employee.role, role);
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
        role: 'Administrator',
        active: true
      }
    }
  );
  assert.equal(edited.payload.data.employee.displayName, 'Edited Chat Employee');
  assert.equal(edited.payload.data.employee.role, 'Administrator');

  for (const employee of createdEmployees) {
    const removed = await request(`/api/v1/admin/employees/${employee.employeeId}`, {
      method: 'DELETE',
      headers: { Cookie: adminLogin.cookie }
    });
    assert.equal(removed.response.status, 200);
  }
  const employees = await request('/api/v1/admin/employees', {
    headers: { Cookie: adminLogin.cookie }
  });
  assert.ok(createdEmployees.every((created) => (
    employees.payload.data.items.find((item) => item.employeeId === created.employeeId)?.active === false
  )));
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
  assert.equal(dashboard.payload.data.online.seedCustomers, 5);
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
