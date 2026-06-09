const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');
const { hashPassword } = require('./security');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_DB_PATH = path.join(ROOT, 'CodeSource', 'Build', 'datingeasy888.sqlite');

const profiles = [
  {
    name: 'Maya',
    seedType: 1,
    sex: 'Woman',
    lookingFor: 'Men',
    birthDate: '1984-09-18',
    city: 'San Diego',
    state: 'CA',
    photoPosition: '0% 0%',
    bio: 'I make a strong cup of coffee, collect small travel stories, and never say no to a sunset walk. I enjoy thoughtful conversation, live music, and finding the funny side of an ordinary day.'
  },
  {
    name: 'Daniel',
    seedType: 2,
    sex: 'Man',
    lookingFor: 'Women',
    birthDate: '1980-02-11',
    city: 'Los Angeles',
    state: 'CA',
    photoPosition: '50% 0%',
    bio: 'Home cook, weekend cyclist, and patient listener. I like old records, neighborhood restaurants, and conversations that wander from serious to delightfully ridiculous.'
  },
  {
    name: 'Ethan',
    seedType: 2,
    sex: 'Man',
    lookingFor: 'Women',
    birthDate: '1983-05-21',
    city: 'Los Angeles',
    state: 'CA',
    photoPosition: '0% 100%',
    bio: 'I enjoy live music, coastal drives, neighborhood food, and calm conversations with a playful edge.'
  },
  {
    name: 'Lucas',
    seedType: 2,
    sex: 'Man',
    lookingFor: 'Women',
    birthDate: '1981-12-09',
    city: 'Los Angeles',
    state: 'CA',
    photoPosition: '100% 100%',
    bio: 'Weekend hiker, amateur cook, and curious listener who appreciates humor, kindness, and thoughtful questions.'
  },
  {
    name: 'Noah',
    seedType: 2,
    sex: 'Man',
    lookingFor: 'Women',
    birthDate: '1985-03-17',
    city: 'Los Angeles',
    state: 'CA',
    photoPosition: '50% 0%',
    bio: 'I like books, basketball, little cafes, and conversations that make an ordinary evening feel memorable.'
  },
  {
    name: 'Emma',
    seedType: 2,
    sex: 'Woman',
    lookingFor: 'Men',
    birthDate: '1986-08-12',
    city: 'Los Angeles',
    state: 'CA',
    photoPosition: '0% 0%',
    bio: 'Warm, artistic, and easygoing. I enjoy watercolor, gardens, good coffee, and stories about places people love.'
  },
  {
    name: 'Grace',
    seedType: 2,
    sex: 'Woman',
    lookingFor: 'Men',
    birthDate: '1982-10-25',
    city: 'Los Angeles',
    state: 'CA',
    photoPosition: '50% 100%',
    bio: 'I enjoy the ocean, home cooking, gentle humor, and conversations that leave both people feeling lighter.'
  },
  {
    name: 'Olivia',
    seedType: 2,
    sex: 'Woman',
    lookingFor: 'Men',
    birthDate: '1984-01-30',
    city: 'Los Angeles',
    state: 'CA',
    photoPosition: '100% 0%',
    bio: 'City explorer, music lover, and thoughtful friend. I like late-night cafes and questions with interesting answers.'
  },
  {
    name: 'Sophia',
    seedType: 2,
    sex: 'Woman',
    lookingFor: 'Men',
    birthDate: '1987-11-04',
    city: 'Los Angeles',
    state: 'CA',
    photoPosition: '0% 100%',
    bio: 'I am happiest near mountains or a kitchen full of good smells, especially when conversation comes easily.'
  },
  {
    name: 'Lena',
    seedType: 1,
    sex: 'Woman',
    lookingFor: 'Men',
    birthDate: '1987-06-03',
    city: 'Seattle',
    state: 'WA',
    photoPosition: '100% 0%',
    bio: 'Creative, grounded, and curious about people. I split my free time between galleries, coastal drives, and trying recipes that use far too many bowls.'
  },
  {
    name: 'Marcus',
    seedType: 1,
    sex: 'Man',
    lookingFor: 'Women',
    birthDate: '1978-11-24',
    city: 'Miami',
    state: 'FL',
    photoPosition: '0% 100%',
    bio: 'I work near the water and reset with jazz, long walks, and good food shared slowly. Kindness and a lively sense of humor get my attention.'
  },
  {
    name: 'Claire',
    seedType: 1,
    sex: 'Woman',
    lookingFor: 'Men',
    birthDate: '1982-04-29',
    city: 'Denver',
    state: 'CO',
    photoPosition: '50% 100%',
    bio: 'Mountains make me happy, but so does a quiet Sunday with a book. I value warmth, clear communication, and people who can laugh at themselves.'
  },
  {
    name: 'Adrian',
    seedType: 1,
    sex: 'Man',
    lookingFor: 'Women',
    birthDate: '1979-08-14',
    city: 'Boston',
    state: 'MA',
    photoPosition: '100% 100%',
    bio: 'Architect by day, enthusiastic dinner host by night. I am drawn to art, city walks, honest conversation, and plans that leave room for a little surprise.'
  }
];

function now() {
  return new Date().toISOString();
}

function openDatabase(databasePath = DEFAULT_DB_PATH) {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const db = new DatabaseSync(databasePath);
  db.exec(fs.readFileSync(path.join(ROOT, 'Database', 'schema.sql'), 'utf8'));
  migrateCustomerProfile(db);
  migrateChargeRecord(db);
  seedDatabase(db);
  ensureRobotPrototypeData(db);
  return db;
}

function migrateCustomerProfile(db) {
  const existing = new Set(
    db.prepare('PRAGMA table_info(CustomerProfile)').all().map((column) => column.name)
  );
  const additions = [
    ['MaritalStatus', 'TEXT'],
    ['WorkField', 'TEXT'],
    ['EnglishLevel', 'TEXT'],
    ['LanguagesJson', "TEXT NOT NULL DEFAULT '[]'"],
    ['TraitsJson', "TEXT NOT NULL DEFAULT '[]'"],
    ['InterestsJson', "TEXT NOT NULL DEFAULT '[]'"],
    ['MoviePreferencesJson', "TEXT NOT NULL DEFAULT '[]'"],
    ['MusicPreferencesJson', "TEXT NOT NULL DEFAULT '[]'"],
    ['GoalsJson', "TEXT NOT NULL DEFAULT '[]'"],
    ['PreferredAgeMin', 'INTEGER'],
    ['PreferredAgeMax', 'INTEGER'],
    ['PersonalityType', 'TEXT'],
    ['Story', 'TEXT'],
    ['PublicPhotosJson', "TEXT NOT NULL DEFAULT '[]'"],
    ['PrivatePhotosJson', "TEXT NOT NULL DEFAULT '[]'"],
    ['ProfileCompleted', 'INTEGER NOT NULL DEFAULT 0'],
    ['ProfileCompleteness', 'INTEGER NOT NULL DEFAULT 0'],
    ['UpdateTime', 'TEXT']
  ];
  for (const [name, definition] of additions) {
    if (!existing.has(name)) {
      db.exec(`ALTER TABLE CustomerProfile ADD COLUMN ${name} ${definition}`);
    }
  }
  db.prepare(`
    UPDATE CustomerProfile
    SET UpdateTime = COALESCE(UpdateTime, CreateTime),
        ProfilePhoto = COALESCE(
          NULLIF(ProfilePhoto, ''),
          CASE
            WHEN lower(Sex) = 'man' THEN '/assets/profiles/default-man.svg'
            WHEN lower(Sex) = 'woman' THEN '/assets/profiles/default-woman.svg'
            ELSE '/assets/profiles/default-neutral.svg'
          END
        )
  `).run();
  db.prepare(`
    UPDATE CustomerProfile
    SET MaritalStatus = COALESCE(MaritalStatus, 'Single'),
        WorkField = COALESCE(WorkField, 'Other'),
        EnglishLevel = COALESCE(EnglishLevel, 'Advanced'),
        LanguagesJson = CASE WHEN LanguagesJson = '[]' THEN '["English"]' ELSE LanguagesJson END,
        TraitsJson = CASE WHEN TraitsJson = '[]' THEN '["Thoughtful","Kind"]' ELSE TraitsJson END,
        InterestsJson = CASE WHEN InterestsJson = '[]' THEN '["Traveling","Music"]' ELSE InterestsJson END,
        MoviePreferencesJson = CASE WHEN MoviePreferencesJson = '[]' THEN '["Comedy"]' ELSE MoviePreferencesJson END,
        MusicPreferencesJson = CASE WHEN MusicPreferencesJson = '[]' THEN '["Jazz"]' ELSE MusicPreferencesJson END,
        GoalsJson = CASE WHEN GoalsJson = '[]' THEN '["Chatting","Finding a friend"]' ELSE GoalsJson END,
        PreferredAgeMin = COALESCE(PreferredAgeMin, 25),
        PreferredAgeMax = COALESCE(PreferredAgeMax, 65),
        PersonalityType = COALESCE(PersonalityType, 'Easygoing'),
        Story = COALESCE(NULLIF(Story, ''), NULLIF(Bio, ''), 'Open to a good conversation.'),
        PublicPhotosJson = CASE
          WHEN PublicPhotosJson = '[]' THEN json_array(ProfilePhoto)
          ELSE PublicPhotosJson
        END,
        ProfileCompleted = 1,
        ProfileCompleteness = 100
    WHERE Seed <> 0 OR EmailNormalized = 'demo@datingeasy.test'
  `).run();
}

function defaultProfilePhoto(sex) {
  const normalized = String(sex || '').toLowerCase();
  if (normalized === 'man') return '/assets/profiles/default-man.svg';
  if (normalized === 'woman') return '/assets/profiles/default-woman.svg';
  return '/assets/profiles/default-neutral.svg';
}

function migrateChargeRecord(db) {
  const existing = new Set(
    db.prepare('PRAGMA table_info(ChargeRecord)').all().map((column) => column.name)
  );
  const additions = [
    ['CardholderName', 'TEXT'],
    ['ExpirationMonth', 'INTEGER'],
    ['ExpirationYear', 'INTEGER']
  ];
  for (const [name, definition] of additions) {
    if (!existing.has(name)) {
      db.exec(`ALTER TABLE ChargeRecord ADD COLUMN ${name} ${definition}`);
    }
  }
}

function seedDatabase(db) {
  const existing = db.prepare('SELECT COUNT(*) AS count FROM CustomerProfile').get();
  if (existing.count > 0) return;

  const created = now();
  const insertCustomer = db.prepare(`
    INSERT INTO CustomerProfile (
      CustomerId, Email, EmailNormalized, Phone, PasswordHash, DisplayName, BirthDate,
      Sex, GenderLookingFor, CountryCode, StateId, CityName, Bio, ProfilePhoto,
      MaritalStatus, WorkField, EnglishLevel, LanguagesJson, TraitsJson,
      InterestsJson, MoviePreferencesJson, MusicPreferencesJson, GoalsJson,
      PreferredAgeMin, PreferredAgeMax, PersonalityType, Story,
      PublicPhotosJson, PrivatePhotosJson, ProfileCompleted, ProfileCompleteness,
      CreateTime, UpdateTime, Active, Seed, CreditsRemain, TotalCharged, Remark
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, 'US', ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', 1, 100,
      ?, ?, 1, ?, ?, 0, ?
    )
  `);

  const demoId = randomUUID();
  insertCustomer.run(
    demoId,
    'demo@datingeasy.test',
    'demo@datingeasy.test',
    '+1-213-555-0100',
    hashPassword('Demo123!'),
    'Alex',
    '1988-04-12',
    'Man',
    'Women',
    'CA',
    'Los Angeles',
    'Curious, upbeat, and ready to meet interesting people.',
    defaultProfilePhoto('Man'),
    'Single',
    'Technology',
    'Advanced',
    JSON.stringify(['English']),
    JSON.stringify(['Thoughtful', 'Optimistic', 'Kind']),
    JSON.stringify(['Traveling', 'Cooking', 'Art']),
    JSON.stringify(['Comedy', 'Adventure']),
    JSON.stringify(['Jazz', 'Rock']),
    JSON.stringify(['Finding a friend', 'Chatting']),
    35,
    55,
    'Warm and curious',
    'I enjoy good conversation, weekend discoveries, and meeting people who are kind and genuine.',
    JSON.stringify([defaultProfilePhoto('Man')]),
    created,
    created,
    0,
    250,
    'Prototype demo customer'
  );

  db.prepare(`
    INSERT INTO CreditLedger (
      CreditLedgerId, CustomerId, TransactionTime, TransactionType,
      CreditsChange, BalanceAfter, ReferenceType, Remark
    ) VALUES (?, ?, ?, 'PrototypeOpeningBalance', 250, 250, 'Prototype', ?)
  `).run(randomUUID(), demoId, created, 'Seeded local prototype balance');

  const seedIds = [];
  for (const profile of profiles) {
    const id = randomUUID();
    seedIds.push(id);
    insertCustomer.run(
      id,
      `${profile.name.toLowerCase()}@virtual.datingeasy.test`,
      `${profile.name.toLowerCase()}@virtual.datingeasy.test`,
      null,
      hashPassword(randomUUID()),
      profile.name,
      profile.birthDate,
      profile.sex,
      profile.lookingFor,
      profile.state,
      profile.city,
      profile.bio,
      `/assets/profiles/contact-sheet.png#${profile.photoPosition}`,
      'Single',
      'Creative services',
      'Advanced',
      JSON.stringify(['English']),
      JSON.stringify(['Warm', 'Thoughtful', 'Humorous']),
      JSON.stringify(['Traveling', 'Cooking', 'Music']),
      JSON.stringify(['Comedy', 'Adventure']),
      JSON.stringify(['Jazz', 'Pop']),
      JSON.stringify(['Chatting', 'Finding a friend']),
      30,
      60,
      'Friendly and curious',
      profile.bio,
      JSON.stringify([`/assets/profiles/contact-sheet.png#${profile.photoPosition}`]),
      created,
      created,
      profile.seedType,
      0,
      profile.seedType === 1
        ? 'AI-generated seed customer operated by a company employee'
        : 'AI-generated robot customer operating autonomously'
    );
  }

  const insertEmployee = db.prepare(`
    INSERT INTO Employees (
      EmployeeId, Email, PasswordHash, DisplayName, EmployeeType,
      Role, Active, StartDate, Remark
    ) VALUES (?, ?, ?, ?, 'Human', ?, 1, ?, ?)
  `);
  const employeeId = randomUUID();
  insertEmployee.run(
    employeeId,
    'operator@datingeasy.test',
    hashPassword('Demo123!'),
    'Jordan Lee',
    'ChatEmployee',
    '2026-01-01',
    'Prototype seed conversation operator'
  );
  const adminId = randomUUID();
  insertEmployee.run(
    adminId,
    'admin@datingeasy.test',
    hashPassword('Demo123!'),
    'Morgan Chen',
    'Administrator',
    '2026-01-01',
    'Prototype administrator'
  );
  const ceoId = randomUUID();
  insertEmployee.run(
    ceoId,
    'ceo@datingeasy.test',
    hashPassword('Demo123!'),
    'Avery Brooks',
    'CEO',
    '2026-01-01',
    'Prototype chief executive'
  );

  const insertPaymentRequest = db.prepare(`
    INSERT INTO OutgoingPaymentRequests (
      OutgoingPaymentRequestId, PayeeName, Category, Amount, CurrencyCode,
      Description, Status, RequestTime, RequestedByEmployeeId,
      DecisionTime, DecidedByEmployeeId, DecisionRemark
    ) VALUES (?, ?, ?, ?, 'USD', ?, ?, ?, ?, ?, ?, ?)
  `);
  insertPaymentRequest.run(
    randomUUID(),
    'Northstar Cloud',
    'Cloud service',
    420,
    'Prototype hosting and database capacity.',
    'Pending',
    created,
    adminId,
    null,
    null,
    null
  );
  insertPaymentRequest.run(
    randomUUID(),
    'Cityline Media',
    'Advertisement',
    275,
    'Regional campaign placement.',
    'Pending',
    new Date(Date.parse(created) - 60_000).toISOString(),
    adminId,
    null,
    null,
    null
  );
  insertPaymentRequest.run(
    randomUUID(),
    'SecureMail Systems',
    'Notification service',
    95,
    'Monthly email and SMS delivery service.',
    'Approved',
    new Date(Date.parse(created) - 120_000).toISOString(),
    adminId,
    new Date(Date.parse(created) - 90_000).toISOString(),
    ceoId,
    'Approved prototype operating expense.'
  );

  const insertPolicy = db.prepare(`
    INSERT INTO PolicyDefinitions (
      PolicyId, PolicyKey, Title, Description, PolicyValue,
      Active, Version, CreateTime, UpdateTime
    ) VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?)
  `);
  [
    [
      'text_message_cost',
      'Text message cost',
      'Credits charged for one text message.',
      '5'
    ],
    [
      'customer_session_minutes',
      'Customer session timeout',
      'Customer inactivity timeout in minutes.',
      '20'
    ],
    [
      'password_reset_auto_approve',
      'Password reset auto approval',
      'Automatically approve verified customer password reset requests.',
      'false'
    ],
    [
      'gift_refunds',
      'Gift refund policy',
      'Whether successfully delivered gifts may be refunded.',
      'false'
    ],
    [
      'robot_ai_mode',
      'Robot outside AI mode',
      'LocalOnly or HybridExternalAllowed for every robot customer.',
      'LocalOnly'
    ],
    [
      'robot_ai_daily_budget_usd',
      'Robot AI daily budget',
      'Maximum estimated outside AI cost per UTC day.',
      '25'
    ],
    [
      'robot_ai_monthly_budget_usd',
      'Robot AI monthly budget',
      'Maximum estimated outside AI cost per UTC month.',
      '500'
    ]
  ].forEach(([key, title, description, value]) => {
    insertPolicy.run(randomUUID(), key, title, description, value, created, created);
  });

  const assignSeed = db.prepare(`
    INSERT INTO EmployeeSeed (EmployeeId, CustomerId, Active, Country, State, City)
    VALUES (?, ?, 1, 'US', ?, ?)
  `);
  profiles.forEach((profile, index) => {
    if (profile.seedType !== 1) return;
    assignSeed.run(employeeId, seedIds[index], profile.state, profile.city);
  });

  const insertConversation = db.prepare(`
    INSERT INTO Conversations (ConversationId, CustomerAId, CustomerBId, CreateTime, UpdatedAt)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertMessage = db.prepare(`
    INSERT INTO ChatRecords (
      ChatRecordId, ConversationId, ChatTime, SenderId, ReceiverId,
      Text, MessageType, CreditUsed
    ) VALUES (?, ?, ?, ?, ?, ?, 'Text', 0)
  `);
  const demoThreads = [
    {
      seedIndex: 0,
      messages: [
        {
          offset: -240_000,
          sender: 'seed',
          text: 'Hi Alex. I just made coffee and found a sunny corner outside. How is your day starting?'
        },
        {
          offset: -180_000,
          sender: 'customer',
          text: 'It has been busy. I need a relaxing weekend plan. What always improves your mood?'
        }
      ]
    },
    {
      seedIndex: 2,
      messages: [
        {
          offset: -120_000,
          sender: 'customer',
          text: 'Your interest in galleries caught my eye. What kind of art do you enjoy most?'
        }
      ]
    },
    {
      seedIndex: 1,
      messages: [
        {
          offset: -110_000,
          sender: 'customer',
          text: 'What kind of conversation do you enjoy on a quiet evening?'
        },
        {
          offset: -109_000,
          sender: 'seed',
          text: 'A relaxed conversation with a little humor is a good start. What topic helps you unwind?'
        }
      ]
    },
    {
      seedIndex: 4,
      messages: [
        {
          offset: -60_000,
          sender: 'customer',
          text: 'I like mountain weekends too. Do you prefer a quiet trail or a lively ski town?'
        }
      ]
    }
  ];

  for (const thread of demoThreads) {
    const seedId = seedIds[thread.seedIndex];
    const conversationId = randomUUID();
    const [a, b] = [demoId, seedId].sort();
    const finalTime = new Date(Date.parse(created) + thread.messages.at(-1).offset).toISOString();
    insertConversation.run(conversationId, a, b, created, finalTime);
    for (const message of thread.messages) {
      const senderId = message.sender === 'seed' ? seedId : demoId;
      const receiverId = message.sender === 'seed' ? demoId : seedId;
      insertMessage.run(
        randomUUID(),
        conversationId,
        new Date(Date.parse(created) + message.offset).toISOString(),
        senderId,
        receiverId,
        message.text
      );
    }
  }
}

function ensureRobotPrototypeData(db) {
  const timestamp = now();
  const insertRobot = db.prepare(`
    INSERT INTO CustomerProfile (
      CustomerId, Email, EmailNormalized, Phone, PasswordHash, DisplayName, BirthDate,
      Sex, GenderLookingFor, CountryCode, StateId, CityName, Bio, ProfilePhoto,
      MaritalStatus, WorkField, EnglishLevel, LanguagesJson, TraitsJson,
      InterestsJson, MoviePreferencesJson, MusicPreferencesJson, GoalsJson,
      PreferredAgeMin, PreferredAgeMax, PersonalityType, Story,
      PublicPhotosJson, PrivatePhotosJson, ProfileCompleted, ProfileCompleteness,
      CreateTime, UpdateTime, Active, Seed, CreditsRemain, TotalCharged, Remark
    ) VALUES (
      ?, ?, ?, NULL, ?, ?, ?, ?, ?, 'US', 'CA', 'Los Angeles', ?, ?,
      'Single', 'Creative services', 'Advanced', '["English"]',
      '["Warm","Thoughtful","Humorous"]', '["Traveling","Cooking","Music"]',
      '["Comedy","Adventure"]', '["Jazz","Pop"]',
      '["Chatting","Finding a friend"]', 30, 60, 'Friendly and curious',
      ?, ?, '[]', 1, 100, ?, ?, 1, 2, 0, 0,
      'AI-generated robot customer operating autonomously'
    )
  `);
  for (const profile of profiles.filter((item) => item.seedType === 2)) {
    const email = `${profile.name.toLowerCase()}@virtual.datingeasy.test`;
    const existing = db.prepare(`
      SELECT CustomerId FROM CustomerProfile WHERE EmailNormalized = ?
    `).get(email);
    if (!existing) {
      const photo = `/assets/profiles/contact-sheet.png#${profile.photoPosition}`;
      insertRobot.run(
        randomUUID(),
        email,
        email,
        hashPassword(randomUUID()),
        profile.name,
        profile.birthDate,
        profile.sex,
        profile.lookingFor,
        profile.bio,
        photo,
        profile.bio,
        JSON.stringify([photo]),
        timestamp,
        timestamp
      );
    } else {
      db.prepare(`
        UPDATE CustomerProfile
        SET Seed = 2, CountryCode = 'US', StateId = 'CA', CityName = 'Los Angeles',
          UpdateTime = COALESCE(UpdateTime, ?)
        WHERE CustomerId = ?
      `).run(timestamp, existing.CustomerId);
    }
  }

  const insertPolicy = db.prepare(`
    INSERT OR IGNORE INTO PolicyDefinitions (
      PolicyId, PolicyKey, Title, Description, PolicyValue,
      Active, Version, CreateTime, UpdateTime
    ) VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?)
  `);
  [
    [
      'robot_ai_mode',
      'Robot outside AI mode',
      'LocalOnly or HybridExternalAllowed for every robot customer.',
      'LocalOnly'
    ],
    [
      'robot_ai_daily_budget_usd',
      'Robot AI daily budget',
      'Maximum estimated outside AI cost per UTC day.',
      '25'
    ],
    [
      'robot_ai_monthly_budget_usd',
      'Robot AI monthly budget',
      'Maximum estimated outside AI cost per UTC month.',
      '500'
    ]
  ].forEach(([key, title, description, value]) => {
    insertPolicy.run(randomUUID(), key, title, description, value, timestamp, timestamp);
  });
}

function resetDatabase(databasePath = DEFAULT_DB_PATH) {
  if (fs.existsSync(databasePath)) fs.unlinkSync(databasePath);
  return openDatabase(databasePath);
}

module.exports = {
  ROOT,
  DEFAULT_DB_PATH,
  openDatabase,
  resetDatabase,
  now,
  profiles
};
