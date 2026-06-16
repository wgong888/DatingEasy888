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
    name: 'Henry',
    seedType: 2,
    sex: 'Man',
    lookingFor: 'Women',
    birthDate: '1982-07-19',
    city: 'Los Angeles',
    state: 'CA',
    photoPosition: '100% 100%',
    bio: 'Thoughtful, active, and happiest when a weekend includes a good meal, a walk near the water, and a conversation with honest laughter.'
  },
  {
    name: 'Miles',
    seedType: 2,
    sex: 'Man',
    lookingFor: 'Women',
    birthDate: '1986-02-22',
    city: 'Los Angeles',
    state: 'CA',
    photoPosition: '50% 0%',
    bio: 'I enjoy film nights, early coffee, simple cooking, and people who can talk about ordinary life with curiosity and kindness.'
  },
  {
    name: 'Nora',
    seedType: 2,
    sex: 'Woman',
    lookingFor: 'Men',
    birthDate: '1983-09-16',
    city: 'Los Angeles',
    state: 'CA',
    photoPosition: '0% 0%',
    bio: 'Warm, grounded, and interested in creative people. I like weekend markets, quiet music, and conversations that feel natural.'
  },
  {
    name: 'Violet',
    seedType: 2,
    sex: 'Woman',
    lookingFor: 'Men',
    birthDate: '1985-12-06',
    city: 'Los Angeles',
    state: 'CA',
    photoPosition: '50% 100%',
    bio: 'I like coastal drives, small restaurants, thoughtful questions, and anyone who can be both serious and easy to laugh with.'
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

const TARGET_REAL_CUSTOMERS = 200;
const TARGET_ROBOT_CUSTOMERS = 200;
const GENERATED_PROFILE_SHEET = '/assets/profiles/seed-robot-contact-sheet.png';
const GENERATED_PROFILE_SHEET_COLUMNS = 8;
const GENERATED_PROFILE_SHEET_ROWS = 6;
const GENERATED_PROFILE_TILE_INDEXES = Object.freeze({
  woman: Array.from({ length: 24 }, (_, index) => index * 2),
  man: Array.from({ length: 24 }, (_, index) => index * 2 + 1),
  neutral: Array.from({ length: GENERATED_PROFILE_SHEET_COLUMNS * GENERATED_PROFILE_SHEET_ROWS }, (_, index) => index)
});

const PLATFORM_US_MAJOR_CITIES = [
  ['AL', 'Birmingham'],
  ['AK', 'Anchorage'],
  ['AZ', 'Phoenix'],
  ['AR', 'Little Rock'],
  ['CA', 'Los Angeles'],
  ['CO', 'Denver'],
  ['CT', 'Bridgeport'],
  ['DE', 'Wilmington'],
  ['FL', 'Miami'],
  ['GA', 'Atlanta'],
  ['HI', 'Honolulu'],
  ['ID', 'Boise'],
  ['IL', 'Chicago'],
  ['IN', 'Indianapolis'],
  ['IA', 'Des Moines'],
  ['KS', 'Wichita'],
  ['KY', 'Louisville'],
  ['LA', 'New Orleans'],
  ['ME', 'Portland'],
  ['MD', 'Baltimore'],
  ['MA', 'Boston'],
  ['MI', 'Detroit'],
  ['MN', 'Minneapolis'],
  ['MS', 'Jackson'],
  ['MO', 'Kansas City'],
  ['MT', 'Billings'],
  ['NE', 'Omaha'],
  ['NV', 'Las Vegas'],
  ['NH', 'Manchester'],
  ['NJ', 'Newark'],
  ['NM', 'Albuquerque'],
  ['NY', 'New York City'],
  ['NC', 'Charlotte'],
  ['ND', 'Fargo'],
  ['OH', 'Columbus'],
  ['OK', 'Oklahoma City'],
  ['OR', 'Portland'],
  ['PA', 'Philadelphia'],
  ['RI', 'Providence'],
  ['SC', 'Columbia'],
  ['SD', 'Sioux Falls'],
  ['TN', 'Nashville'],
  ['TX', 'Houston'],
  ['UT', 'Salt Lake City'],
  ['VT', 'Burlington'],
  ['VA', 'Virginia Beach'],
  ['WA', 'Seattle'],
  ['WV', 'Charleston'],
  ['WI', 'Milwaukee'],
  ['WY', 'Cheyenne']
];

const realCustomerCities = [
  ['CA', 'Los Angeles'],
  ['CA', 'San Diego'],
  ['CA', 'San Francisco'],
  ['WA', 'Seattle'],
  ['CO', 'Denver'],
  ['FL', 'Miami'],
  ['MA', 'Boston'],
  ['TX', 'Austin'],
  ['NY', 'New York'],
  ['IL', 'Chicago']
];

const realCustomerNames = [
  'Avery', 'Blake', 'Casey', 'Dana', 'Elliot', 'Finley', 'Harper', 'Jordan',
  'Kendall', 'Logan', 'Morgan', 'Parker', 'Quinn', 'Riley', 'Skyler', 'Taylor',
  'Alexis', 'Cameron', 'Devon', 'Emerson'
];

const naturalFemaleNames = [
  'Ava', 'Mia', 'Sofia', 'Emma', 'Grace', 'Lily', 'Nora', 'Chloe',
  'Ella', 'Ruby', 'Zoe', 'Iris', 'Maya', 'Leah', 'Naomi', 'Hannah',
  'Claire', 'Julia', 'Elena', 'Sabrina', 'Natalie', 'Isabel', 'Vivian', 'Audrey'
];

const naturalMaleNames = [
  'Liam', 'Noah', 'Ethan', 'Owen', 'Miles', 'Lucas', 'Henry', 'Adrian',
  'Daniel', 'Marcus', 'Evan', 'Caleb', 'Julian', 'Simon', 'Nathan', 'Aaron',
  'Thomas', 'Isaac', 'Leo', 'Adam', 'Wesley', 'Victor', 'Gavin', 'Joel'
];

const naturalFemaleMiddleNames = [
  'Rose', 'Jade', 'Marie', 'Lynn', 'Hope', 'Paige', 'Renee', 'Brooke',
  'Elise', 'June', 'Anne', 'Skye', 'Faith', 'Noelle', 'Mae', 'Joy',
  'Claire', 'Belle', 'Eve', 'Pearl', 'Kate', 'Wren', 'Laurel', 'Brielle',
  'Celeste', 'Faye', 'Ivy', 'Serene', 'Avery', 'Morgan'
];

const naturalMaleMiddleNames = [
  'Dean', 'James', 'Reid', 'Cole', 'Grant', 'Lee', 'Shane', 'Blair',
  'Drew', 'Quinn', 'Reese', 'Sage', 'Avery', 'Morgan', 'Paul', 'Scott',
  'Kent', 'Neil', 'Blake', 'Wayne', 'Clark', 'Evan', 'Ray', 'Jude',
  'Troy', 'Lane', 'Wade', 'Pierce', 'Bennett', 'Graham'
];

const naturalSurnames = [
  'Carter', 'Brooks', 'Reed', 'Hayes', 'Parker', 'Bailey', 'Morgan', 'Kim',
  'Rivera', 'Stone', 'Foster', 'Bell', 'Gray', 'Cole', 'Wong', 'Diaz',
  'Chen', 'Patel', 'Nguyen', 'Bennett', 'Sullivan', 'Price', 'Hale', 'Morris',
  'Lawson', 'Fisher', 'Ellis', 'Porter', 'Wells', 'Griffin'
];

function now() {
  return new Date().toISOString();
}

function openDatabase(databasePath = DEFAULT_DB_PATH) {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const db = new DatabaseSync(databasePath);
  db.exec(fs.readFileSync(path.join(ROOT, 'Database', 'schema.sql'), 'utf8'));
  migrateCustomerProfile(db);
  migrateEmployeeProfile(db);
  migrateChargeRecord(db);
  migratePolicyDefaults(db);
  seedDatabase(db);
  ensureTestEmployeeAccounts(db);
  ensurePlatformInitialData(db);
  ensureRobotPrototypeData(db);
  ensureRealCustomerVolume(db);
  ensureUniqueVirtualCustomerNames(db);
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

function migrateEmployeeProfile(db) {
  const existing = new Set(
    db.prepare('PRAGMA table_info(Employees)').all().map((column) => column.name)
  );
  const additions = [
    ['Sex', 'TEXT'],
    ['BirthDate', 'TEXT'],
    ['Phone', 'TEXT'],
    ['Address', 'TEXT'],
    ['Education', 'TEXT']
  ];
  for (const [name, definition] of additions) {
    if (!existing.has(name)) {
      db.exec(`ALTER TABLE Employees ADD COLUMN ${name} ${definition}`);
    }
  }
  db.prepare(`
    UPDATE Employees
    SET Sex = COALESCE(Sex, 'NotSpecified'),
        BirthDate = COALESCE(BirthDate, '1990-01-01'),
        Phone = COALESCE(Phone, '+1-555-0100'),
        Address = COALESCE(Address, 'DatingEasy888 operations office'),
        Education = COALESCE(Education, 'Not specified')
  `).run();
}

function defaultProfilePhoto(sex) {
  const normalized = String(sex || '').toLowerCase();
  if (normalized === 'man') return '/assets/profiles/default-man.svg';
  if (normalized === 'woman') return '/assets/profiles/default-woman.svg';
  return '/assets/profiles/default-neutral.svg';
}

function profilePhotoIndex(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.abs(value);
  const text = String(value ?? '0');
  if (/^-?\d+$/u.test(text)) return Math.abs(Number(text));
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash * 31) + text.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function generatedProfilePhoto(sex, index = 0) {
  const normalized = String(sex || '').toLowerCase();
  const candidates = GENERATED_PROFILE_TILE_INDEXES[normalized] || GENERATED_PROFILE_TILE_INDEXES.neutral;
  const tile = candidates[profilePhotoIndex(index) % candidates.length];
  const column = tile % GENERATED_PROFILE_SHEET_COLUMNS;
  const row = Math.floor(tile / GENERATED_PROFILE_SHEET_COLUMNS);
  const x = `${(column * 100) / (GENERATED_PROFILE_SHEET_COLUMNS - 1)}%`;
  const y = `${(row * 100) / (GENERATED_PROFILE_SHEET_ROWS - 1)}%`;
  const size = `${GENERATED_PROFILE_SHEET_COLUMNS * 100}% ${GENERATED_PROFILE_SHEET_ROWS * 100}%`;
  return `${GENERATED_PROFILE_SHEET}#${x} ${y}|${size}`;
}

function naturalDisplayName(sex, index) {
  const firstNames = sex === 'Man' ? naturalMaleNames : naturalFemaleNames;
  const middleNames = sex === 'Man' ? naturalMaleMiddleNames : naturalFemaleMiddleNames;
  const first = firstNames[index % firstNames.length];
  const middle = middleNames[Math.floor(index / firstNames.length) % middleNames.length];
  const last = naturalSurnames[
    Math.floor(index / (firstNames.length * middleNames.length)) % naturalSurnames.length
  ];
  return `${first} ${middle} ${last}`;
}

function alphaSerial(index) {
  let value = Math.max(0, Number(index) || 0);
  let serial = '';
  do {
    serial = String.fromCharCode(65 + (value % 26)) + serial;
    value = Math.floor(value / 26) - 1;
  } while (value >= 0);
  return serial;
}

function uniqueFirstName(sex, index) {
  const firstNames = sex === 'Man' ? naturalMaleNames : naturalFemaleNames;
  const base = firstNames[index % firstNames.length];
  const cycle = Math.floor(index / firstNames.length);
  return cycle === 0 ? base : `${base}${alphaSerial(cycle - 1)}`;
}

function uniqueVirtualDisplayName(sex, index) {
  const middleNames = sex === 'Man' ? naturalMaleMiddleNames : naturalFemaleMiddleNames;
  const firstNames = sex === 'Man' ? naturalMaleNames : naturalFemaleNames;
  const first = uniqueFirstName(sex, index);
  const middle = middleNames[Math.floor(index / firstNames.length) % middleNames.length];
  const last = naturalSurnames[
    Math.floor(index / (firstNames.length * middleNames.length)) % naturalSurnames.length
  ];
  return `${first} ${middle} ${last}`;
}

function displayFirstName(displayName) {
  return String(displayName || '').trim().split(/\s+/u)[0] || '';
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

function migratePolicyDefaults(db) {
  db.prepare(`
    UPDATE PolicyDefinitions
    SET PolicyValue = '15',
        Version = Version + 1,
        UpdateTime = ?
    WHERE PolicyKey = 'robot_response_delay_seconds'
      AND PolicyValue = '30'
  `).run(now());
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
      generatedProfilePhoto(profile.sex, seedIds.length),
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
      JSON.stringify([generatedProfilePhoto(profile.sex, seedIds.length)]),
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
      EmployeeId, Email, PasswordHash, DisplayName, Sex, BirthDate, Phone,
      Address, Education, EmployeeType, Role, Active, StartDate, Remark
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Human', ?, 1, ?, ?)
  `);
  const employeeId = randomUUID();
  insertEmployee.run(
    employeeId,
    'operator@datingeasy.test',
    hashPassword('Demo123!'),
    'Jordan Lee',
    'NotSpecified',
    '1990-01-01',
    '+1-213-555-0130',
    '100 Operations Way, Los Angeles, CA',
    'Customer operations training',
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
    'NotSpecified',
    '1988-01-01',
    '+1-213-555-0131',
    '200 Administration Ave, Los Angeles, CA',
    'Business administration',
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
    'NotSpecified',
    '1985-01-01',
    '+1-213-555-0132',
    '300 Executive Blvd, Los Angeles, CA',
    'Executive leadership',
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
    ],
    [
      'robot_response_delay_seconds',
      'Robot response delay seconds',
      'Minimum delay before a robot may answer a customer message.',
      '15'
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
      const photo = generatedProfilePhoto(profile.sex, profiles.indexOf(profile));
      const customerId = randomUUID();
      insertRobot.run(
        customerId,
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
      db.prepare(`
        INSERT OR IGNORE INTO SeedProfileProvenance (
          SeedProfileProvenanceId, CustomerId, CreationSource,
          AutoFilledFieldsJson, GenerationBatchId, AssetSourceType, CharacterSpecVersion,
          TextModelVersion, ImageModelVersion, PromptPolicyVersion,
          OriginalityCheckStatus, AdultAppearanceCheckStatus,
          HumanReviewStatus, ProfilePresentationVersion, GeneratedTime, Remark
        ) VALUES (
          ?, ?, 'SystemAutomatic', '[]', ?, 'SystemGenerated', 'robot-profile-v1',
          'PrototypeSeedData', 'PrototypeProfileAssets', 'robot-profile-policy-v1',
          'Passed', 'Passed', 'Approved', 'prototype-v1', ?, ?
        )
      `).run(
        randomUUID(),
        customerId,
        randomUUID(),
        timestamp,
        'Approved prototype robot profile generated by system seed data.'
      );
    } else {
      db.prepare(`
        UPDATE CustomerProfile
        SET Seed = 2, CountryCode = 'US', StateId = 'CA', CityName = 'Los Angeles',
          UpdateTime = COALESCE(UpdateTime, ?)
        WHERE CustomerId = ?
      `).run(timestamp, existing.CustomerId);
      db.prepare(`
        INSERT OR IGNORE INTO SeedProfileProvenance (
          SeedProfileProvenanceId, CustomerId, CreationSource,
          AutoFilledFieldsJson, GenerationBatchId, AssetSourceType, CharacterSpecVersion,
          TextModelVersion, ImageModelVersion, PromptPolicyVersion,
          OriginalityCheckStatus, AdultAppearanceCheckStatus,
          HumanReviewStatus, ProfilePresentationVersion, GeneratedTime, Remark
        ) VALUES (
          ?, ?, 'SystemAutomatic', '[]', ?, 'SystemGenerated', 'robot-profile-v1',
          'PrototypeSeedData', 'PrototypeProfileAssets', 'robot-profile-policy-v1',
          'Passed', 'Passed', 'Approved', 'prototype-v1', ?, ?
        )
      `).run(
        randomUUID(),
        existing.CustomerId,
        randomUUID(),
        timestamp,
        'Approved prototype robot profile generated by system seed data.'
      );
    }
  }

  ensureRobotCustomerVolume(db, timestamp);

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
    ],
    [
      'robot_response_delay_seconds',
      'Robot response delay seconds',
      'Minimum delay before a robot may answer a customer message.',
      '15'
    ]
  ].forEach(([key, title, description, value]) => {
    insertPolicy.run(randomUUID(), key, title, description, value, timestamp, timestamp);
  });
}

function generatedTestEmployee(index) {
  const padded = String(index).padStart(3, '0');
  return {
    email: `test-employee-${padded}@datingeasy.test`,
    displayName: `Test Employee ${padded}`,
    sex: index % 2 === 0 ? 'Woman' : 'Man',
    birthDate: `199${index % 10}-01-${String((index % 27) + 1).padStart(2, '0')}`,
    phone: `+1-213-555-1${padded}`,
    address: `${100 + index} Test Employee Lane, Los Angeles, CA`,
    education: 'Prototype chat-employee test account',
    role: 'ChatEmployee',
    startDate: '2026-01-01',
    remark: 'Additional prototype employee account for testing'
  };
}

function ensureTestEmployeeAccounts(db) {
  const timestamp = now();
  const insertEmployee = db.prepare(`
    INSERT INTO Employees (
      EmployeeId, Email, PasswordHash, DisplayName, Sex, BirthDate, Phone,
      Address, Education, EmployeeType, Role, Active, StartDate, Remark
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Human', ?, 1, ?, ?)
  `);
  const updateEmployee = db.prepare(`
    UPDATE Employees
    SET PasswordHash = ?, DisplayName = ?, Sex = ?, BirthDate = ?, Phone = ?,
        Address = ?, Education = ?, EmployeeType = 'Human', Role = ?,
        Active = 1, StartDate = ?, Remark = ?
    WHERE Email = ?
  `);
  const passwordHash = hashPassword('Demo123!');

  db.exec('BEGIN IMMEDIATE');
  try {
    for (let index = 1; index <= 10; index += 1) {
      const employee = generatedTestEmployee(index);
      const existing = db.prepare('SELECT EmployeeId FROM Employees WHERE Email = ?')
        .get(employee.email);
      if (existing) {
        updateEmployee.run(
          passwordHash,
          employee.displayName,
          employee.sex,
          employee.birthDate,
          employee.phone,
          employee.address,
          employee.education,
          employee.role,
          employee.startDate,
          employee.remark,
          employee.email
        );
      } else {
        insertEmployee.run(
          randomUUID(),
          employee.email,
          passwordHash,
          employee.displayName,
          employee.sex,
          employee.birthDate,
          employee.phone,
          employee.address,
          employee.education,
          employee.role,
          employee.startDate,
          `${employee.remark}; created ${timestamp}`
        );
      }
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function platformProfile({ state, city, sex, index, kind, nameSerial }) {
  const female = sex === 'Woman';
  const serial = nameSerial ?? index + 1;
  const stateIndex = PLATFORM_US_MAJOR_CITIES.findIndex(([code]) => code === state);
  const profileIndex = Math.max(0, stateIndex) * 28 + serial - 1;
  const cityText = city === 'New York City' ? 'New York' : city;
  const birthYear = 1986 + ((serial + state.charCodeAt(0)) % 21);
  const birthMonth = '01';
  const birthDay = '15';
  return {
    displayName: naturalDisplayName(sex, profileIndex),
    birthDate: `${birthYear}-${birthMonth}-${birthDay}`,
    sex,
    lookingFor: female ? 'Men' : 'Women',
    bio: `I live near ${cityText} and enjoy warm conversation, local food, music, and easy weekend plans.`,
    story: `Around ${cityText}, I like simple places with good energy and people who can be thoughtful, kind, and clear.`,
    profilePhoto: generatedProfilePhoto(sex, `${kind}:${state}:${city}:${sex}:${serial}:${profileIndex}`)
  };
}

function ensurePlatformInitialData(db) {
  const timestamp = now();
  const passwordHash = hashPassword('Demo123!');
  const platformCustomerPasswordHash = hashPassword(randomUUID());
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
      ?, ?, ?, NULL, ?, ?, ?, ?, ?, 'US', ?, ?, ?, ?,
      'Single', 'Creative services', 'Advanced', '["English"]',
      '["Warm","Thoughtful","Kind"]', '["Traveling","Cooking","Music"]',
      '["Comedy","Adventure"]', '["Jazz","Pop"]',
      '["Chatting","Finding a friend"]', 30, 60, 'Friendly and curious',
      ?, ?, '[]', 1, 100, ?, ?, 1, ?, 0, 0, ?
    )
  `);
  const updateCustomer = db.prepare(`
    UPDATE CustomerProfile
    SET DisplayName = ?, BirthDate = ?, Sex = ?, GenderLookingFor = ?,
      CountryCode = 'US', StateId = ?, CityName = ?, Bio = ?, ProfilePhoto = ?,
      Story = ?, PublicPhotosJson = ?, Active = 1, Seed = ?, UpdateTime = ?,
      Remark = ?
    WHERE EmailNormalized = ?
  `);
  const insertProvenance = db.prepare(`
    INSERT OR IGNORE INTO SeedProfileProvenance (
      SeedProfileProvenanceId, CustomerId, CreationSource,
      AutoFilledFieldsJson, GenerationBatchId, AssetSourceType, CharacterSpecVersion,
      TextModelVersion, ImageModelVersion, PromptPolicyVersion,
      OriginalityCheckStatus, AdultAppearanceCheckStatus,
      HumanReviewStatus, ProfilePresentationVersion, GeneratedTime, Remark
    ) VALUES (
      ?, ?, 'SystemAutomatic', '[]', ?, 'SystemGenerated', 'platform-profile-v1',
      'PlatformInitialData', 'PlatformProfileAssets', 'platform-initial-data-v1',
      'Passed', 'Passed', 'Approved', 'platform-v1', ?, ?
    )
  `);
  const insertEmployee = db.prepare(`
    INSERT INTO Employees (
      EmployeeId, Email, PasswordHash, DisplayName, Sex, BirthDate, Phone,
      Address, Education, EmployeeType, Role, Active, StartDate, Remark
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Human', 'ChatEmployee', 1, '2026-01-01', ?)
  `);
  const updateEmployee = db.prepare(`
    UPDATE Employees
    SET PasswordHash = ?, DisplayName = ?, Sex = ?, BirthDate = ?, Phone = ?,
      Address = ?, Education = ?, EmployeeType = 'Human', Role = 'ChatEmployee',
      Active = 1, StartDate = '2026-01-01', Remark = ?
    WHERE Email = ?
  `);
  const insertAssignment = db.prepare(`
    INSERT OR IGNORE INTO EmployeeSeed (EmployeeId, CustomerId, Active, Country, State, City)
    VALUES (?, ?, 1, 'US', ?, ?)
  `);
  const updateAssignment = db.prepare(`
    UPDATE EmployeeSeed SET Active = 1, Country = 'US', State = ?, City = ?
    WHERE EmployeeId = ? AND CustomerId = ?
  `);
  const insertCoverage = db.prepare(`
    INSERT OR IGNORE INTO RobotCityCoverage (
      RobotCityCoverageId, CountryCode, StateId, CityName, TimeZoneId,
      MinimumManProfiles, MinimumWomanProfiles, RequiredOnlineMan,
      RequiredOnlineWoman, CoverageStatus, Active, CreateTime, UpdateTime
    ) VALUES (?, 'US', ?, ?, 'America/New_York', 3, 6, 1, 1, 'CoverageReady', 1, ?, ?)
  `);
  const updateCoverage = db.prepare(`
    UPDATE RobotCityCoverage
    SET MinimumManProfiles = 3, MinimumWomanProfiles = 6,
      RequiredOnlineMan = 1, RequiredOnlineWoman = 1,
      CoverageStatus = CASE WHEN CoverageStatus = 'Paused' THEN CoverageStatus ELSE 'CoverageReady' END,
      Active = 1, UpdateTime = ?
    WHERE CountryCode = 'US' AND StateId = ? AND CityName = ?
  `);

  const ensureCustomer = ({ email, state, city, seed, profile, remark }) => {
    const existing = db.prepare('SELECT CustomerId FROM CustomerProfile WHERE EmailNormalized = ?')
      .get(email);
    if (existing) {
      updateCustomer.run(
        profile.displayName,
        profile.birthDate,
        profile.sex,
        profile.lookingFor,
        state,
        city,
        profile.bio,
        profile.profilePhoto,
        profile.story,
        JSON.stringify([profile.profilePhoto]),
        seed,
        timestamp,
        remark,
        email
      );
      return existing.CustomerId;
    }
    const customerId = randomUUID();
    insertCustomer.run(
      customerId,
      email,
      email,
      platformCustomerPasswordHash,
      profile.displayName,
      profile.birthDate,
      profile.sex,
      profile.lookingFor,
      state,
      city,
      profile.bio,
      profile.profilePhoto,
      profile.story,
      JSON.stringify([profile.profilePhoto]),
      timestamp,
      timestamp,
      seed,
      remark
    );
    return customerId;
  };

  db.exec('BEGIN IMMEDIATE');
  try {
    for (const [state, city] of PLATFORM_US_MAJOR_CITIES) {
      insertCoverage.run(randomUUID(), state, city, timestamp, timestamp);
      updateCoverage.run(timestamp, state, city);

      const operatorEmail = `platform-seed-operator-${state.toLowerCase()}@datingeasy.test`;
      let operator = db.prepare('SELECT EmployeeId FROM Employees WHERE Email = ?').get(operatorEmail);
      const operatorProfile = {
        displayName: `${city} Seed Operator`,
        sex: 'NotSpecified',
        birthDate: '1990-01-01',
        phone: `+1-555-30${String(PLATFORM_US_MAJOR_CITIES.findIndex((item) => item[0] === state) + 1).padStart(2, '0')}`,
        address: `${city} seed operations desk, ${state}`,
        education: 'Platform seed operations training',
        remark: 'Platform baseline seed-profile operator'
      };
      if (operator) {
        updateEmployee.run(
          passwordHash,
          operatorProfile.displayName,
          operatorProfile.sex,
          operatorProfile.birthDate,
          operatorProfile.phone,
          operatorProfile.address,
          operatorProfile.education,
          operatorProfile.remark,
          operatorEmail
        );
      } else {
        insertEmployee.run(
          randomUUID(),
          operatorEmail,
          passwordHash,
          operatorProfile.displayName,
          operatorProfile.sex,
          operatorProfile.birthDate,
          operatorProfile.phone,
          operatorProfile.address,
          operatorProfile.education,
          operatorProfile.remark
        );
      }
      operator = db.prepare('SELECT EmployeeId FROM Employees WHERE Email = ?').get(operatorEmail);

      for (let index = 0; index < 6; index += 1) {
        const profile = platformProfile({
          state,
          city,
          sex: 'Woman',
          index,
          kind: 'robot',
          nameSerial: index + 1
        });
        const email = `platform-robot-${state.toLowerCase()}-f-${String(index + 1).padStart(2, '0')}@virtual.datingeasy.test`;
        const customerId = ensureCustomer({
          email,
          state,
          city,
          seed: 2,
          profile,
          remark: 'Permanent platform female robot customer baseline'
        });
        insertProvenance.run(randomUUID(), customerId, randomUUID(), timestamp, 'Permanent platform female robot profile.');
      }
      for (let index = 0; index < 2; index += 1) {
        const profile = platformProfile({
          state,
          city,
          sex: 'Man',
          index,
          kind: 'robot',
          nameSerial: index + 7
        });
        const email = `platform-robot-${state.toLowerCase()}-m-${String(index + 1).padStart(2, '0')}@virtual.datingeasy.test`;
        const customerId = ensureCustomer({
          email,
          state,
          city,
          seed: 2,
          profile,
          remark: 'Permanent platform male robot customer baseline'
        });
        insertProvenance.run(randomUUID(), customerId, randomUUID(), timestamp, 'Permanent platform male robot profile.');
      }
      for (let index = 0; index < 15; index += 1) {
        const profile = platformProfile({
          state,
          city,
          sex: 'Woman',
          index,
          kind: 'seed',
          nameSerial: index + 9
        });
        const email = `platform-seed-${state.toLowerCase()}-f-${String(index + 1).padStart(2, '0')}@seed.datingeasy.test`;
        const customerId = ensureCustomer({
          email,
          state,
          city,
          seed: 1,
          profile,
          remark: 'Permanent platform female employee-operated seed customer baseline'
        });
        insertProvenance.run(randomUUID(), customerId, randomUUID(), timestamp, 'Permanent platform female seed profile.');
        insertAssignment.run(operator.EmployeeId, customerId, state, city);
        updateAssignment.run(state, city, operator.EmployeeId, customerId);
      }
      for (let index = 0; index < 5; index += 1) {
        const profile = platformProfile({
          state,
          city,
          sex: 'Man',
          index,
          kind: 'seed',
          nameSerial: index + 24
        });
        const email = `platform-seed-${state.toLowerCase()}-m-${String(index + 1).padStart(2, '0')}@seed.datingeasy.test`;
        const customerId = ensureCustomer({
          email,
          state,
          city,
          seed: 1,
          profile,
          remark: 'Permanent platform male employee-operated seed customer baseline'
        });
        insertProvenance.run(randomUUID(), customerId, randomUUID(), timestamp, 'Permanent platform male seed profile.');
        insertAssignment.run(operator.EmployeeId, customerId, state, city);
        updateAssignment.run(state, city, operator.EmployeeId, customerId);
      }
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function generatedRobotCustomer(index) {
  const sex = index % 2 === 0 ? 'Woman' : 'Man';
  const name = naturalDisplayName(sex, 2_000 + index);
  const birthYear = 1972 + (index % 24);
  const birthMonth = String((index % 12) + 1).padStart(2, '0');
  const birthDay = String((index % 27) + 1).padStart(2, '0');
  return {
    email: `robot-customer-${String(index).padStart(3, '0')}@virtual.datingeasy.test`,
    displayName: name,
    birthDate: `${birthYear}-${birthMonth}-${birthDay}`,
    sex,
    lookingFor: sex === 'Man' ? 'Women' : 'Men',
    bio: 'I enjoy music, simple food, local walks, and respectful conversation around Los Angeles.',
    story: `Around Los Angeles, I like relaxed plans, steady humor, and conversations that help two people understand each other a little better.`,
    profilePhoto: generatedProfilePhoto(sex, `${name}:${sex}:${index}`)
  };
}

function ensureRobotCustomerVolume(db, timestamp = now()) {
  refreshGeneratedRobotCustomerProfiles(db, timestamp);
  let count = db.prepare(`
    SELECT COUNT(*) AS value FROM CustomerProfile WHERE Seed = 2
  `).get().value;
  if (count >= TARGET_ROBOT_CUSTOMERS) return;

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
      'Generated prototype robot customer operating autonomously'
    )
  `);
  const insertProvenance = db.prepare(`
    INSERT OR IGNORE INTO SeedProfileProvenance (
      SeedProfileProvenanceId, CustomerId, CreationSource,
      AutoFilledFieldsJson, GenerationBatchId, AssetSourceType, CharacterSpecVersion,
      TextModelVersion, ImageModelVersion, PromptPolicyVersion,
      OriginalityCheckStatus, AdultAppearanceCheckStatus,
      HumanReviewStatus, ProfilePresentationVersion, GeneratedTime, Remark
    ) VALUES (
      ?, ?, 'SystemAutomatic', '[]', ?, 'SystemGenerated', 'robot-profile-v1',
      'PrototypeSeedData', 'PrototypeProfileAssets', 'robot-profile-policy-v1',
      'Passed', 'Passed', 'Approved', 'prototype-v1', ?, ?
    )
  `);

  db.exec('BEGIN IMMEDIATE');
  try {
    for (let index = 1; count < TARGET_ROBOT_CUSTOMERS; index += 1) {
      const profile = generatedRobotCustomer(index);
      if (db.prepare('SELECT 1 FROM CustomerProfile WHERE EmailNormalized = ?').get(profile.email)) {
        continue;
      }
      const customerId = randomUUID();
      insertRobot.run(
        customerId,
        profile.email,
        profile.email,
        hashPassword(randomUUID()),
        profile.displayName,
        profile.birthDate,
        profile.sex,
        profile.lookingFor,
        profile.bio,
        profile.profilePhoto,
        profile.story,
        JSON.stringify([profile.profilePhoto]),
        timestamp,
        timestamp
      );
      insertProvenance.run(
        randomUUID(),
        customerId,
        randomUUID(),
        timestamp,
        'Approved prototype robot profile generated for volume testing.'
      );
      count += 1;
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function refreshGeneratedRobotCustomerProfiles(db, timestamp = now()) {
  const generated = db.prepare(`
    SELECT CustomerId, EmailNormalized FROM CustomerProfile
    WHERE Seed = 2
      AND EmailNormalized LIKE 'robot-customer-%@virtual.datingeasy.test'
  `).all();
  if (!generated.length) return;

  const updateProfile = db.prepare(`
    UPDATE CustomerProfile
    SET DisplayName = ?, Bio = ?, Story = ?, ProfilePhoto = ?,
      PublicPhotosJson = ?, UpdateTime = ?
    WHERE CustomerId = ?
  `);
  for (const row of generated) {
    const match = row.EmailNormalized.match(/^robot-customer-(\d+)@virtual\.datingeasy\.test$/);
    if (!match) continue;
    const profile = generatedRobotCustomer(Number(match[1]));
    updateProfile.run(
      profile.displayName,
      profile.bio,
      profile.story,
      profile.profilePhoto,
      JSON.stringify([profile.profilePhoto]),
      timestamp,
      row.CustomerId
    );
  }
}

function generatedRealCustomer(index) {
  const [state, city] = realCustomerCities[index % realCustomerCities.length];
  const sex = index % 2 === 0 ? 'Woman' : 'Man';
  const name = `${realCustomerNames[index % realCustomerNames.length]} ${String(index).padStart(3, '0')}`;
  const birthYear = 1971 + (index % 27);
  const birthMonth = String((index % 12) + 1).padStart(2, '0');
  const birthDay = String((index % 27) + 1).padStart(2, '0');
  return {
    email: `real-customer-${String(index).padStart(3, '0')}@customer.datingeasy.test`,
    phone: `+1-555-02${String(index).padStart(3, '0')}`,
    displayName: name,
    birthDate: `${birthYear}-${birthMonth}-${birthDay}`,
    sex,
    lookingFor: sex === 'Man' ? 'Women' : 'Men',
    state,
    city,
    bio: `I live near ${city} and enjoy practical plans, good food, music, and steady conversation.`,
    maritalStatus: ['Single', 'Divorced', 'Widowed'][index % 3],
    workField: ['Technology', 'Education', 'Healthcare', 'Business', 'Creative services'][index % 5],
    englishLevel: ['Advanced', 'Native', 'Intermediate'][index % 3],
    languages: index % 4 === 0 ? ['English', 'Mandarin'] : ['English'],
    traits: ['Thoughtful', 'Optimistic', 'Kind'],
    interests: ['Traveling', 'Cooking', 'Music', 'Reading', 'Nature'].slice(0, 3 + (index % 3)),
    movies: ['Comedy', 'Adventure', 'Drama'].slice(0, 2 + (index % 2)),
    music: ['Jazz', 'Pop', 'Rock'].slice(0, 2 + (index % 2)),
    goals: ['Chatting', 'Finding a friend'],
    preferredAgeMin: 32,
    preferredAgeMax: 62,
    personalityType: ['Easygoing', 'Family focused', 'Creative spirit', 'Quiet thinker'][index % 4],
    story: `I am here to meet adults who enjoy clear, respectful conversation. Around ${city}, I like simple weekends, local food, and learning what makes another person's life interesting.`,
    profilePhoto: generatedProfilePhoto(sex, `${name}:${sex}:${state}:${city}:${index}`)
  };
}

function ensureRealCustomerVolume(db) {
  let count = db.prepare(`
    SELECT COUNT(*) AS value FROM CustomerProfile WHERE Seed = 0
  `).get().value;
  if (count >= TARGET_REAL_CUSTOMERS) return;

  const timestamp = now();
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
      ?, ?, 1, 0, 150, 0, ?
    )
  `);
  const insertLedger = db.prepare(`
    INSERT INTO CreditLedger (
      CreditLedgerId, CustomerId, TransactionTime, TransactionType,
      CreditsChange, BalanceAfter, ReferenceType, Remark
    ) VALUES (?, ?, ?, 'PrototypeOpeningBalance', 150, 150, 'Prototype', ?)
  `);
  const generatedPasswordHash = hashPassword('Demo123!');

  db.exec('BEGIN IMMEDIATE');
  try {
    for (let index = 1; count < TARGET_REAL_CUSTOMERS; index += 1) {
      const profile = generatedRealCustomer(index);
      if (db.prepare('SELECT 1 FROM CustomerProfile WHERE EmailNormalized = ?').get(profile.email)) {
        continue;
      }
      const customerId = randomUUID();
      insertCustomer.run(
        customerId,
        profile.email,
        profile.email,
        profile.phone,
        generatedPasswordHash,
        profile.displayName,
        profile.birthDate,
        profile.sex,
        profile.lookingFor,
        profile.state,
        profile.city,
        profile.bio,
        profile.profilePhoto,
        profile.maritalStatus,
        profile.workField,
        profile.englishLevel,
        JSON.stringify(profile.languages),
        JSON.stringify(profile.traits),
        JSON.stringify(profile.interests),
        JSON.stringify(profile.movies),
        JSON.stringify(profile.music),
        JSON.stringify(profile.goals),
        profile.preferredAgeMin,
        profile.preferredAgeMax,
        profile.personalityType,
        profile.story,
        JSON.stringify([profile.profilePhoto]),
        timestamp,
        timestamp,
        'Generated prototype real customer for volume testing'
      );
      insertLedger.run(
        randomUUID(),
        customerId,
        timestamp,
        'Seeded generated real-customer opening balance'
      );
      count += 1;
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function ensureUniqueVirtualCustomerNames(db) {
  const rows = db.prepare(`
    SELECT CustomerId, DisplayName, Sex, EmailNormalized
    FROM CustomerProfile
    WHERE Seed IN (1, 2)
    ORDER BY DisplayName, CreateTime, EmailNormalized
  `).all();
  const usedNames = new Set();
  const updateName = db.prepare(`
    UPDATE CustomerProfile
    SET DisplayName = ?, UpdateTime = ?
    WHERE CustomerId = ?
  `);
  const timestamp = now();
  const usedFirstNames = new Set();
  for (const row of rows) {
    let candidate = row.DisplayName;
    let candidateFirst = displayFirstName(candidate).toLowerCase();
    if (usedNames.has(candidate) || usedFirstNames.has(candidateFirst)) {
      let suffix = 3_000 + usedNames.size;
      do {
        candidate = uniqueVirtualDisplayName(row.Sex, suffix);
        candidateFirst = displayFirstName(candidate).toLowerCase();
        suffix += 1;
      } while (usedNames.has(candidate) || usedFirstNames.has(candidateFirst));
      updateName.run(candidate, timestamp, row.CustomerId);
    }
    usedNames.add(candidate);
    usedFirstNames.add(candidateFirst);
  }
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
