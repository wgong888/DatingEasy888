const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { openDatabase, now, ROOT } = require('./database');
const {
  hashPassword,
  verifyPassword,
  randomToken,
  requestHash
} = require('./security');
const {
  EXTERNAL_MODEL,
  generateRobotReply,
  planDailyShifts,
  reconcileRobotOperations,
  getPolicy
} = require('./robot-engine');

const CUSTOMER_IDLE_MS = 20 * 60 * 1000;
const EMPLOYEE_IDLE_MS = 10 * 60 * 1000;
const SESSION_LIFETIME_MS = 12 * 60 * 60 * 1000;
const MESSAGE_COST = 5;
const MAX_MESSAGE_WORDS = 60;
const MAX_BODY_BYTES = 1_000_000;
const ROBOT_WORKER_INTERVAL_MS = 60_000;
const DEFAULT_ROBOT_RESPONSE_DELAY_SECONDS = 6;
const CUSTOMER_TYPE = Object.freeze({
  REAL: 0,
  SEED: 1,
  ROBOT: 2
});
const ROBOT_PROFILE_SHEET = '/assets/profiles/robot-contact-sheet-v2.png';
const GENERATED_PROFILE_SHEET_COLUMNS = 8;
const GENERATED_PROFILE_SHEET_ROWS = 6;
const GENERATED_PROFILE_TILE_COUNT = GENERATED_PROFILE_SHEET_COLUMNS * GENERATED_PROFILE_SHEET_ROWS;
const GENERATED_PROFILE_TILE_INDEXES = Object.freeze({
  woman: [
    2, 4, 6,
    9, 11, 13, 15,
    16, 18, 20, 22,
    31, 34
  ],
  man: Array.from({ length: GENERATED_PROFILE_TILE_COUNT }, (_, tile) => tile)
    .filter((tile) => {
      const row = Math.floor(tile / GENERATED_PROFILE_SHEET_COLUMNS);
      const column = tile % GENERATED_PROFILE_SHEET_COLUMNS;
      return (row + column) % 2 === 1;
    }),
  neutral: Array.from({ length: GENERATED_PROFILE_TILE_COUNT }, (_, index) => index)
});
const CREDIT_PACKAGES = [
  { packageId: 1, amount: 10, credits: 100 },
  { packageId: 2, amount: 20, credits: 220 },
  { packageId: 3, amount: 30, credits: 360 },
  { packageId: 4, amount: 50, credits: 700 },
  { packageId: 5, amount: 100, credits: 1500 }
];
const GIFTS = [
  { giftId: 1, name: 'Flower', icon: '🌹', senderCost: 100 },
  { giftId: 2, name: 'Silver', icon: '🥈', senderCost: 200 },
  { giftId: 3, name: 'Gold', icon: '🥇', senderCost: 500 },
  { giftId: 4, name: 'Diamond', icon: '💎', senderCost: 1000 },
  { giftId: 5, name: 'Big Rocket', icon: '🚀', senderCost: 10000 }
].map((gift) => ({
  ...gift,
  recipientCredits: Math.floor(gift.senderCost * 0.8),
  platformCredits: gift.senderCost - Math.floor(gift.senderCost * 0.8),
  refundable: false
}));
const COUNTRY_NAMES = Object.freeze({
  US: 'United States',
  CA: 'Canada',
  GB: 'United Kingdom',
  AU: 'Australia',
  NZ: 'New Zealand',
  CN: 'China'
});
const US_STATE_NAMES = Object.freeze({
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming'
});
let configuredLocationsCache = null;
let censusUsPlacesCache = null;

function configuredStateCode(countryCode, state) {
  const id = String(state.id || state.code || '').trim();
  if (id.startsWith(`${countryCode}-`)) return id.slice(countryCode.length + 1);
  return id || String(state.name || '').trim();
}

function configuredDiscoveryLocations() {
  if (configuredLocationsCache) return configuredLocationsCache;
  try {
    const data = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'Design', 'Data', 'countries_states_cities.json'), 'utf8')
    );
    configuredLocationsCache = (data.countries || []).map((country) => {
      const code = String(country.code || '').trim().toUpperCase();
      return {
        code,
        name: country.name || COUNTRY_NAMES[code] || code,
        states: (country.states || []).map((state) => ({
          code: configuredStateCode(code, state),
          name: state.name || configuredStateCode(code, state),
          cities: [...new Set((state.cities || []).map((city) => String(city).trim()).filter(Boolean))]
        })).filter((state) => state.code && state.cities.length)
      };
    }).filter((country) => country.code && country.states.length);
  } catch {
    configuredLocationsCache = [];
  }
  return configuredLocationsCache;
}

function censusUsPlaces() {
  if (censusUsPlacesCache) return censusUsPlacesCache;
  try {
    const data = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'Design', 'Data', 'us_census_places_2024.json'), 'utf8')
    );
    censusUsPlacesCache = new Map(
      (data.states || []).map((state) => [
        String(state.code || '').trim(),
        (state.cities || []).map((city) => String(city).trim()).filter(Boolean)
      ]).filter(([code, cities]) => code && cities.length)
    );
  } catch {
    censusUsPlacesCache = new Map();
  }
  return censusUsPlacesCache;
}
const PREPARED_REPLIES = [
  {
    preparedReplyId: 'acknowledge-detail',
    category: 'Feelings',
    text: 'That sounds like a full day. What part stayed with you most?'
  },
  {
    preparedReplyId: 'invite-detail',
    category: 'Conversation',
    text: 'I like the way you described that. Tell me one more detail.'
  },
  {
    preparedReplyId: 'relaxing-evening',
    category: 'Mood',
    text: 'You made me smile. What would make tonight feel relaxing for you?'
  },
  {
    preparedReplyId: 'listen-or-light',
    category: 'Support',
    text: 'I am listening. We can keep it light or talk about what is really on your mind.'
  }
];
const SESSION_COOKIE_BY_ROLE = Object.freeze({
  Customer: 'de_customer_session',
  ChatEmployee: 'de_employee_session',
  Administrator: 'de_admin_session',
  CEO: 'de_ceo_session'
});
const ALL_SESSION_COOKIES = Object.freeze([
  ...Object.values(SESSION_COOKIE_BY_ROLE),
  'de_session'
]);
const ALLOWED_LOCAL_ORIGINS = new Set([
  'null',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
]);

class ApiError extends Error {
  constructor(status, code, message, fields = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

function parseCookies(req) {
  const result = {};
  for (const pair of String(req.headers.cookie || '').split(';')) {
    const index = pair.indexOf('=');
    if (index < 0) continue;
    result[pair.slice(0, index).trim()] = decodeURIComponent(pair.slice(index + 1));
  }
  return result;
}

function sessionCookieName(principalType, role) {
  if (principalType === 'Customer') return SESSION_COOKIE_BY_ROLE.Customer;
  return SESSION_COOKIE_BY_ROLE[role] || 'de_session';
}

function sessionCookieCandidates(expectedType, options = {}) {
  if (expectedType === 'Customer') {
    return [SESSION_COOKIE_BY_ROLE.Customer, 'de_session'];
  }
  if (expectedType === 'Employee') {
    if (options.role === 'ChatEmployee') return [SESSION_COOKIE_BY_ROLE.ChatEmployee, 'de_session'];
    if (options.role === 'CEO') {
      return [
        SESSION_COOKIE_BY_ROLE.CEO,
        SESSION_COOKIE_BY_ROLE.Administrator,
        SESSION_COOKIE_BY_ROLE.ChatEmployee,
        'de_session'
      ];
    }
    if (options.roles?.includes('Administrator')) {
      return [
        SESSION_COOKIE_BY_ROLE.Administrator,
        SESSION_COOKIE_BY_ROLE.CEO,
        SESSION_COOKIE_BY_ROLE.ChatEmployee,
        'de_session'
      ];
    }
    return [
      SESSION_COOKIE_BY_ROLE.ChatEmployee,
      SESSION_COOKIE_BY_ROLE.Administrator,
      SESSION_COOKIE_BY_ROLE.CEO,
      'de_session'
    ];
  }
  return ALL_SESSION_COOKIES;
}

function setSessionCookie(res, token, principalType, role) {
  const cookieName = sessionCookieName(principalType, role);
  res.setHeader(
    'Set-Cookie',
    `${cookieName}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200`
  );
}

function clearSessionCookies(res) {
  res.setHeader(
    'Set-Cookie',
    ALL_SESSION_COOKIES.map((cookieName) => (
      `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
    ))
  );
}

function envelope(data, requestId) {
  return { success: true, data, meta: { requestId }, error: null };
}

function errorEnvelope(error, requestId) {
  return {
    success: false,
    data: null,
    meta: { requestId },
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'Something went wrong.',
      ...(error.fields ? { fields: error.fields } : {})
    }
  };
}

function localOriginAllowed(origin) {
  if (!origin) return false;
  if (ALLOWED_LOCAL_ORIGINS.has(origin)) return true;
  try {
    const url = new URL(origin);
    return ['localhost', '127.0.0.1'].includes(url.hostname);
  } catch {
    return false;
  }
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (!localOriginAllowed(origin)) return;
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Idempotency-Key');
  res.setHeader('Vary', 'Origin');
}

function json(res, status, body) {
  const content = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(content),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(content);
}

async function readJson(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      throw new ApiError(413, 'CONTENT_TOO_LARGE', 'The request is too large.');
    }
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new ApiError(400, 'INVALID_JSON', 'The request body is not valid JSON.');
  }
}

function ageFromBirthDate(birthDate) {
  const birth = new Date(`${birthDate}T00:00:00Z`);
  if (Number.isNaN(birth.getTime())) return -1;
  const today = new Date();
  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const month = today.getUTCMonth() - birth.getUTCMonth();
  if (month < 0 || (month === 0 && today.getUTCDate() < birth.getUTCDate())) age -= 1;
  return age;
}

function wordCount(text) {
  return String(text).trim().split(/\s+/u).filter(Boolean).length;
}

function orientationSexes(lookingFor) {
  if (lookingFor === 'Women') return ['Woman'];
  if (lookingFor === 'Men') return ['Man'];
  return ['Man', 'Woman', 'Nonbinary', 'NotSpecified'];
}

function parseAgeFilter(value, fallback) {
  const age = Number.parseInt(String(value || ''), 10);
  if (!Number.isInteger(age)) return fallback;
  return Math.min(120, Math.max(18, age));
}

function parseSexFilter(value) {
  const sex = String(value || '').trim();
  return ['Man', 'Woman', 'Nonbinary', 'NotSpecified'].includes(sex) ? sex : '';
}

const EMPLOYEE_ROLES = ['ChatEmployee', 'Administrator', 'CEO'];
const EMPLOYEE_SEXES = ['Man', 'Woman', 'Nonbinary', 'NotSpecified'];

function employeeProfileFromBody(body, current = {}) {
  return {
    email: String(body.email ?? current.Email ?? '').trim().toLowerCase(),
    displayName: String(body.displayName ?? current.DisplayName ?? '').trim(),
    sex: String(body.sex ?? current.Sex ?? '').trim(),
    birthDate: String(body.birthDate ?? current.BirthDate ?? '').trim(),
    phone: String(body.phone ?? current.Phone ?? '').trim(),
    address: String(body.address ?? current.Address ?? '').trim(),
    education: String(body.education ?? current.Education ?? '').trim(),
    role: String(body.role ?? current.Role ?? ''),
    remark: String(body.remark ?? current.Remark ?? '').trim()
  };
}

function validateEmployeeProfile(profile) {
  const fields = {};
  if (!profile.email.includes('@')) fields.email = 'Enter a valid email address.';
  if (profile.displayName.length < 2) fields.displayName = 'Enter the employee full name.';
  if (!EMPLOYEE_SEXES.includes(profile.sex)) fields.sex = 'Choose the employee sex.';
  if (ageFromBirthDate(profile.birthDate) < 18) fields.birthDate = 'Employee must be at least 18.';
  if (profile.phone.length < 7 || profile.phone.length > 50) fields.phone = 'Enter a valid phone number.';
  if (profile.address.length < 5 || profile.address.length > 300) fields.address = 'Enter the employee address.';
  if (profile.education.length < 2 || profile.education.length > 120) fields.education = 'Enter the education background.';
  if (!EMPLOYEE_ROLES.includes(profile.role)) fields.role = 'Choose a valid employee role.';
  if (Object.keys(fields).length) {
    throw new ApiError(422, 'VALIDATION_FAILED', 'Complete every required employee profile field.', fields);
  }
}

function cardTypeFromNumber(value) {
  if (/^4/u.test(value)) return 'VISA';
  if (/^(5[1-5]|2[2-7])/u.test(value)) return 'MASTERCARD';
  if (/^3[47]/u.test(value)) return 'AMEX';
  return 'CARD';
}

function validCardNumber(value) {
  const digits = String(value || '').replace(/\D/gu, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

function parseJsonArray(value) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function cleanStringArray(value, maximum) {
  if (!Array.isArray(value)) return [];
  return [...new Set(
    value.map((item) => String(item).trim()).filter(Boolean)
  )].slice(0, maximum);
}

function validProfilePhoto(value) {
  const photo = String(value || '');
  return photo.startsWith('/assets/profiles/') ||
    (/^data:image\/(?:png|jpeg);base64,/u.test(photo) && photo.length <= 200_000);
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
  return `${ROBOT_PROFILE_SHEET}#${x} ${y}|${size}`;
}

function birthDateForAge(age) {
  const today = new Date();
  const year = today.getUTCFullYear() - age;
  const month = String(today.getUTCMonth() + 1).padStart(2, '0');
  const day = String(today.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function generatedRobotProfile({ displayName, age, sex, countryCode, state, city }) {
  const lookingFor = sex === 'Man' ? 'Women' : sex === 'Woman' ? 'Men' : 'Everyone';
  const interests = ['Traveling', 'Cooking', 'Music'];
  const bio = `${displayName} enjoys good conversation, local discoveries, and relaxed moments in ${city}. Kindness, curiosity, and a sense of humor matter most.`;
  const profilePhoto = generatedProfilePhoto(sex, `${displayName}-${state}-${city}`.length);
  return {
    displayName,
    birthDate: birthDateForAge(age),
    sex,
    lookingFor,
    countryCode,
    state,
    city,
    maritalStatus: 'Single',
    workField: 'Creative services',
    englishLevel: 'Advanced',
    languages: ['English'],
    traits: ['Warm', 'Thoughtful', 'Humorous'],
    interests,
    movies: ['Comedy', 'Adventure'],
    music: ['Jazz', 'Pop'],
    goals: ['Chatting', 'Finding a friend'],
    preferredAgeMin: Math.max(21, age - 10),
    preferredAgeMax: Math.min(100, age + 10),
    personalityType: 'Friendly and curious',
    bio,
    story: `${displayName} likes sharing stories about food, music, travel, and everyday life, and is always ready to listen with genuine interest.`,
    profilePhoto,
    publicPhotos: [profilePhoto],
    privatePhotos: []
  };
}

function customerPhoto(row) {
  const stored = row.ProfilePhoto || defaultProfilePhoto(row.Sex);
  const separator = stored.lastIndexOf('#');
  if (separator > 0) {
    const [position, size = '300% 200%'] = stored.slice(separator + 1).split('|');
    return {
      src: stored.slice(0, separator),
      position,
      size
    };
  }
  return { src: stored, position: '50% 50%', size: 'cover' };
}

function profileCompleteness(profile) {
  const checks = [
    profile.displayName,
    ageFromBirthDate(profile.birthDate) >= 18,
    profile.sex,
    profile.countryCode,
    profile.state,
    profile.city,
    profile.maritalStatus,
    profile.workField,
    profile.englishLevel,
    profile.languages.length,
    profile.traits.length,
    profile.interests.length,
    profile.movies.length,
    profile.music.length,
    profile.goals.length,
    profile.preferredAgeMin >= 18,
    profile.preferredAgeMax >= profile.preferredAgeMin,
    profile.lookingFor,
    profile.personalityType,
    profile.story,
    validProfilePhoto(profile.profilePhoto)
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function basicProfileComplete(profile) {
  return Boolean(
    String(profile.displayName || '').trim().length >= 2 &&
    ageFromBirthDate(profile.birthDate) >= 18 &&
    ['Man', 'Woman', 'Nonbinary', 'NotSpecified'].includes(String(profile.sex || '').trim()) &&
    String(profile.lookingFor || '').trim() &&
    /^[A-Z]{2}$/u.test(String(profile.countryCode || '').trim().toUpperCase()) &&
    String(profile.state || '').trim() &&
    String(profile.city || '').trim() &&
    String(profile.maritalStatus || '').trim() &&
    validProfilePhoto(profile.profilePhoto)
  );
}

function editableCustomerProfile(row) {
  return {
    customerId: row.CustomerId,
    email: row.Email,
    phone: row.Phone || '',
    displayName: row.DisplayName,
    birthDate: row.BirthDate,
    sex: row.Sex,
    lookingFor: row.GenderLookingFor || '',
    countryCode: row.CountryCode,
    state: row.StateId || '',
    city: row.CityName,
    maritalStatus: row.MaritalStatus || '',
    workField: row.WorkField || '',
    englishLevel: row.EnglishLevel || '',
    languages: parseJsonArray(row.LanguagesJson),
    traits: parseJsonArray(row.TraitsJson),
    interests: parseJsonArray(row.InterestsJson),
    movies: parseJsonArray(row.MoviePreferencesJson),
    music: parseJsonArray(row.MusicPreferencesJson),
    goals: parseJsonArray(row.GoalsJson),
    preferredAgeMin: row.PreferredAgeMin,
    preferredAgeMax: row.PreferredAgeMax,
    personalityType: row.PersonalityType || '',
    story: row.Story || '',
    bio: row.Bio || '',
    profilePhoto: row.ProfilePhoto || defaultProfilePhoto(row.Sex),
    publicPhotos: parseJsonArray(row.PublicPhotosJson),
    privatePhotos: parseJsonArray(row.PrivatePhotosJson),
    profileCompleted: Boolean(row.ProfileCompleted),
    profileCompleteness: row.ProfileCompleteness || 0
  };
}

function normalizeCustomer(row, favorite = false, options = {}) {
  const customerType = Number(row.Seed);
  const hasOnlineStatus = Object.prototype.hasOwnProperty.call(row, 'Online');
  const customer = {
    customerId: row.CustomerId,
    displayName: row.DisplayName,
    age: ageFromBirthDate(row.BirthDate),
    sex: row.Sex,
    lookingFor: row.GenderLookingFor,
    city: row.CityName,
    state: row.StateId,
    countryCode: row.CountryCode,
    bio: row.Bio,
    maritalStatus: row.MaritalStatus,
    workField: row.WorkField,
    englishLevel: row.EnglishLevel,
    languages: parseJsonArray(row.LanguagesJson),
    traits: parseJsonArray(row.TraitsJson),
    interests: parseJsonArray(row.InterestsJson),
    movies: parseJsonArray(row.MoviePreferencesJson),
    music: parseJsonArray(row.MusicPreferencesJson),
    goals: parseJsonArray(row.GoalsJson),
    preferredAgeMin: row.PreferredAgeMin,
    preferredAgeMax: row.PreferredAgeMax,
    personalityType: row.PersonalityType,
    story: row.Story,
    online: hasOnlineStatus ? Boolean(row.Online) : customerType !== CUSTOMER_TYPE.REAL,
    favorite: Boolean(favorite),
    photo: customerPhoto(row)
  };
  if (options.includeType) {
    Object.assign(customer, {
      customerTypeCode: customerType,
      customerType:
        customerType === CUSTOMER_TYPE.REAL
          ? 'Real'
          : customerType === CUSTOMER_TYPE.SEED
            ? 'Seed'
            : 'Robot',
      isSeed: customerType === CUSTOMER_TYPE.SEED,
      isRobot: customerType === CUSTOMER_TYPE.ROBOT
    });
  }
  return customer;
}

function customerOnlineStatus(db, row, timestamp = now()) {
  if (!row?.Active) return false;
  const customerType = Number(row.Seed);
  if (customerType === CUSTOMER_TYPE.REAL) {
    const cutoff = new Date(Date.parse(timestamp) - CUSTOMER_IDLE_MS).toISOString();
    return Boolean(db.prepare(`
      SELECT 1 FROM Sessions
      WHERE PrincipalType = 'Customer'
        AND PrincipalId = ?
        AND ExpireTime > ?
        AND LastActivityTime > ?
      LIMIT 1
    `).get(row.CustomerId, timestamp, cutoff));
  }
  if (customerType === CUSTOMER_TYPE.SEED) {
    return Boolean(db.prepare(`
      SELECT 1 FROM EmployeeSeed
      WHERE CustomerId = ?
        AND Active = 1
        AND (ActiveEndTime IS NULL OR ActiveEndTime > ?)
      LIMIT 1
    `).get(row.CustomerId, timestamp));
  }
  if (customerType === CUSTOMER_TYPE.ROBOT) {
    return Boolean(db.prepare(`
      SELECT 1 FROM RobotShiftSchedule
      WHERE RobotCustomerId = ?
        AND ShiftStatus = 'Active'
        AND PlannedStartTime <= ?
        AND PlannedEndTime > ?
      LIMIT 1
    `).get(row.CustomerId, timestamp, timestamp));
  }
  return false;
}

function withCustomerOnlineStatus(db, row, timestamp = now()) {
  return {
    ...row,
    Online: customerOnlineStatus(db, row, timestamp) ? 1 : 0
  };
}

function matchPath(pathname, template) {
  const names = [];
  const pattern = template
    .split('/')
    .map((part) => {
      if (part.startsWith(':')) {
        names.push(part.slice(1));
        return '([^/]+)';
      }
      return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');
  const match = pathname.match(new RegExp(`^${pattern}/?$`));
  if (!match) return null;
  return Object.fromEntries(names.map((name, index) => [name, decodeURIComponent(match[index + 1])]));
}

function createSession(db, principalType, principalId, role) {
  const sessionId = randomToken();
  const created = Date.now();
  db.prepare(`
    INSERT INTO Sessions (
      SessionId, PrincipalType, PrincipalId, Role,
      CreateTime, LastActivityTime, ExpireTime
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    sessionId,
    principalType,
    principalId,
    role,
    new Date(created).toISOString(),
    new Date(created).toISOString(),
    new Date(created + SESSION_LIFETIME_MS).toISOString()
  );
  return sessionId;
}

function authenticate(db, req, expectedType = null, options = {}) {
  const cookies = parseCookies(req);
  let sawCookie = false;
  let sawInvalid = false;
  let sawExpired = false;
  let sawWrongRole = false;

  for (const cookieName of sessionCookieCandidates(expectedType, options)) {
    const sessionId = cookies[cookieName];
    if (!sessionId) continue;
    sawCookie = true;
    const session = db.prepare('SELECT * FROM Sessions WHERE SessionId = ?').get(sessionId);
    if (!session) {
      sawInvalid = true;
      continue;
    }

    const current = Date.now();
    const lastActivity = Date.parse(session.LastActivityTime);
    const expireTime = Date.parse(session.ExpireTime);
    const idleLimit =
      session.PrincipalType === 'Customer' ? CUSTOMER_IDLE_MS : EMPLOYEE_IDLE_MS;
    if (current >= expireTime || current - lastActivity >= idleLimit) {
      db.prepare('DELETE FROM Sessions WHERE SessionId = ?').run(sessionId);
      sawExpired = true;
      continue;
    }
    if (expectedType && session.PrincipalType !== expectedType) {
      sawWrongRole = true;
      continue;
    }
    if (options.role && session.Role !== options.role) {
      sawWrongRole = true;
      continue;
    }
    if (options.roles && !options.roles.includes(session.Role)) {
      sawWrongRole = true;
      continue;
    }
    if (session.PrincipalType === 'Customer' && !options.allowPasswordChangeRequired) {
      const customer = db.prepare(`
        SELECT MustChangePassword FROM CustomerProfile WHERE CustomerId = ?
      `).get(session.PrincipalId);
      if (customer?.MustChangePassword) {
        throw new ApiError(
          403,
          'PASSWORD_CHANGE_REQUIRED',
          'Change the temporary password before continuing.'
        );
      }
    }
    db.prepare('UPDATE Sessions SET LastActivityTime = ? WHERE SessionId = ?').run(
      new Date(current).toISOString(),
      sessionId
    );
    return session;
  }

  if (!sawCookie) throw new ApiError(401, 'AUTHENTICATION_REQUIRED', 'Please sign in.');
  if (sawExpired) throw new ApiError(401, 'SESSION_EXPIRED', 'Your session expired. Please sign in again.');
  if (sawInvalid) throw new ApiError(401, 'SESSION_INVALID', 'Please sign in again.');
  if (sawWrongRole) {
    throw new ApiError(
      403,
      options.forbiddenCode || 'FORBIDDEN',
      options.forbiddenMessage || 'This account cannot use this area.'
    );
  }
  throw new ApiError(401, 'AUTHENTICATION_REQUIRED', 'Please sign in.');
}

function audit(db, actorType, actorId, action, targetType, targetId, detail = {}) {
  db.prepare(`
    INSERT INTO AuditLog (
      AuditLogId, ActorType, ActorId, Action, TargetType,
      TargetId, DetailJson, CreateTime
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    randomUUID(),
    actorType,
    actorId,
    action,
    targetType || null,
    targetId || null,
    JSON.stringify(detail),
    now()
  );
}

function requireAdmin(db, req) {
  const session = authenticate(db, req, 'Employee', {
    roles: ['Administrator', 'CEO']
  });
  if (!['Administrator', 'CEO'].includes(session.Role)) {
    throw new ApiError(403, 'FORBIDDEN', 'Administrator access is required.');
  }
  return session;
}

function requireCEO(db, req) {
  const session = authenticate(db, req, 'Employee', {
    role: 'CEO',
    forbiddenCode: 'CEO_APPROVAL_REQUIRED',
    forbiddenMessage: 'CEO approval access is required.'
  });
  if (session.Role !== 'CEO') {
    throw new ApiError(403, 'CEO_APPROVAL_REQUIRED', 'CEO approval access is required.');
  }
  return session;
}

function maskContact(type, value) {
  const text = String(value || '');
  if (type === 'Email') {
    const [name, domain] = text.split('@');
    return `${name.slice(0, 2)}***@${domain}`;
  }
  return `***-***-${text.replace(/\D/gu, '').slice(-4)}`;
}

function temporaryPassword() {
  return `De!${randomToken(9)}`;
}

function policyEnabled(db, key) {
  const row = db.prepare(`
    SELECT PolicyValue FROM PolicyDefinitions
    WHERE PolicyKey = ? AND Active = 1
  `).get(key);
  return String(row?.PolicyValue || '').toLowerCase() === 'true';
}

function normalizeEmployee(row) {
  return {
    employeeId: row.EmployeeId,
    email: row.Email,
    displayName: row.DisplayName,
    sex: row.Sex || 'NotSpecified',
    birthDate: row.BirthDate || '',
    phone: row.Phone || '',
    address: row.Address || '',
    education: row.Education || '',
    employeeType: row.EmployeeType,
    role: row.Role,
    active: Boolean(row.Active),
    startDate: row.StartDate,
    lastLoginTime: row.LastLoginTime,
    remark: row.Remark || ''
  };
}

function normalizeOutgoingPayment(row) {
  return {
    outgoingPaymentRequestId: row.OutgoingPaymentRequestId,
    payeeName: row.PayeeName,
    category: row.Category,
    amount: row.Amount,
    currencyCode: row.CurrencyCode,
    description: row.Description,
    status: row.Status,
    requestTime: row.RequestTime,
    requestedByEmployeeId: row.RequestedByEmployeeId,
    requestedByName: row.RequestedByName,
    decisionTime: row.DecisionTime,
    decidedByName: row.DecidedByName,
    decisionRemark: row.DecisionRemark
  };
}

function getCustomer(db, customerId) {
  const row = db.prepare('SELECT * FROM CustomerProfile WHERE CustomerId = ?').get(customerId);
  if (!row || !row.Active) throw new ApiError(404, 'CUSTOMER_NOT_FOUND', 'Customer not found.');
  return row;
}

function getConversation(db, conversationId, customerId) {
  const row = db.prepare(`
    SELECT * FROM Conversations
    WHERE ConversationId = ?
      AND (CustomerAId = ? OR CustomerBId = ?)
  `).get(conversationId, customerId, customerId);
  if (!row) throw new ApiError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found.');
  return row;
}

function getEmployeeConversation(db, conversationId, employeeId) {
  const row = db.prepare(`
    SELECT c.*,
      CASE WHEN a.Seed = 1 THEN a.CustomerId ELSE b.CustomerId END AS SeedCustomerId,
      CASE WHEN a.Seed = 0 THEN a.CustomerId ELSE b.CustomerId END AS RealCustomerId
    FROM Conversations c
    JOIN CustomerProfile a ON a.CustomerId = c.CustomerAId
    JOIN CustomerProfile b ON b.CustomerId = c.CustomerBId
    JOIN EmployeeSeed es
      ON es.CustomerId = CASE WHEN a.Seed = 1 THEN a.CustomerId ELSE b.CustomerId END
    WHERE c.ConversationId = ?
      AND es.EmployeeId = ?
      AND es.Active = 1
      AND ((a.Seed = 1 AND b.Seed = 0) OR (a.Seed = 0 AND b.Seed = 1))
  `).get(conversationId, employeeId);
  if (!row) {
    throw new ApiError(404, 'WORK_CONVERSATION_NOT_FOUND', 'Assigned conversation not found.');
  }
  return row;
}

function employeeConversationMessages(db, conversationId, employeeId) {
  const conversation = getEmployeeConversation(db, conversationId, employeeId);
  const seed = getCustomer(db, conversation.SeedCustomerId);
  const realCustomer = getCustomer(db, conversation.RealCustomerId);
  const messages = db.prepare(`
    SELECT * FROM (
      SELECT ChatRecords.*, rowid AS RowOrder FROM ChatRecords
      WHERE ConversationId = ?
      ORDER BY ChatTime DESC, rowid DESC
      LIMIT 20
    )
    ORDER BY ChatTime ASC, RowOrder ASC
  `).all(conversationId);
  const latest = messages.at(-1);
  const waitingForEmployee = Boolean(latest && latest.SenderId === conversation.RealCustomerId);
  return {
    conversationId,
    updatedAt: conversation.UpdatedAt,
    status: waitingForEmployee ? 'Waiting for response' : 'Responded',
    waitingForEmployee,
    seed: normalizeCustomer(withCustomerOnlineStatus(db, seed), false, { includeType: true }),
    realCustomer: normalizeCustomer(withCustomerOnlineStatus(db, realCustomer), false, { includeType: true }),
    messages: messages.map((message) => ({
      chatRecordId: message.ChatRecordId,
      chatTime: message.ChatTime,
      senderId: message.SenderId,
      receiverId: message.ReceiverId,
      text: message.Text,
      messageType: message.MessageType,
      responseSource: message.ResponseSource
    }))
  };
}

function findOrCreateConversation(db, customerId, targetCustomerId) {
  if (customerId === targetCustomerId) {
    throw new ApiError(422, 'INVALID_RECIPIENT', 'You cannot message yourself.');
  }
  const customer = getCustomer(db, customerId);
  const target = getCustomer(db, targetCustomerId);
  if (
    customer.Seed !== CUSTOMER_TYPE.REAL &&
    target.Seed !== CUSTOMER_TYPE.REAL
  ) {
    throw new ApiError(
      422,
      'CUSTOMER_TYPE_CHAT_NOT_ALLOWED',
      'Seed and robot customers may chat only with real customers.'
    );
  }
  const [a, b] = [customerId, targetCustomerId].sort();
  let conversation = db.prepare(`
    SELECT * FROM Conversations WHERE CustomerAId = ? AND CustomerBId = ?
  `).get(a, b);
  if (!conversation) {
    const timestamp = now();
    const conversationId = randomUUID();
    db.prepare(`
      INSERT INTO Conversations (
        ConversationId, CustomerAId, CustomerBId, CreateTime, UpdatedAt
      ) VALUES (?, ?, ?, ?, ?)
    `).run(conversationId, a, b, timestamp, timestamp);
    conversation = db
      .prepare('SELECT * FROM Conversations WHERE ConversationId = ?')
      .get(conversationId);
  }
  return conversation;
}

function insertRobotReply(db, {
  robot,
  realCustomerId,
  conversationId,
  incomingChatRecordId,
  text,
  customerInfo = null,
  timestamp = new Date(),
  allowOffShift = false
}) {
  const generated = generateRobotReply(db, {
    robot,
    realCustomerId,
    conversationId,
    incomingChatRecordId,
    text,
    customerInfo,
    timestamp,
    allowOffShift
  });
  if (!generated.reply) {
    audit(
      db,
      'RobotCustomer',
      robot.CustomerId,
      'RobotCustomerResponseDeferred',
      'ChatRecord',
      incomingChatRecordId,
      { conversationId, reason: generated.reason }
    );
    return { robotReply: null, reason: generated.reason };
  }

  const robotReplyTime = new Date(timestamp.getTime() + 1).toISOString();
  const robotReplyId = randomUUID();
  db.prepare(`
    INSERT INTO ChatRecords (
      ChatRecordId, ConversationId, ChatTime, SenderId,
      ReceiverId, Text, MessageType, CreditUsed, ResponseSource
    ) VALUES (?, ?, ?, ?, ?, ?, 'Text', 0, ?)
  `).run(
    robotReplyId,
    conversationId,
    robotReplyTime,
    robot.CustomerId,
    realCustomerId,
    generated.reply.text,
    generated.reply.responseSource
  );

  if (generated.reply.usage) {
    const usage = generated.reply.usage;
    db.prepare(`
      INSERT INTO RobotAIUsage (
        RobotAIUsageId, RobotCustomerId, ConversationId,
        IncomingChatRecordId, OutgoingChatRecordId, Provider, Model,
        RobotAIPolicyVersion, ResponseMode, InputTokens,
        CachedInputTokens, OutputTokens, EstimatedCost, CurrencyCode,
        LatencyMilliseconds, UsageStatus, SafetyResult,
        LocalValidationResult, CorrelationId, CreateTime
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'USD',
        1, 'Accepted', 'Passed', 'Passed', ?, ?)
    `).run(
      usage.robotAIUsageId,
      robot.CustomerId,
      conversationId,
      incomingChatRecordId,
      robotReplyId,
      usage.provider,
      usage.model,
      usage.policyVersion,
      usage.responseMode,
      usage.inputTokens,
      usage.cachedInputTokens,
      usage.outputTokens,
      usage.estimatedCost,
      randomUUID(),
      robotReplyTime
    );
  }

  db.prepare('UPDATE Conversations SET UpdatedAt = ? WHERE ConversationId = ?').run(
    robotReplyTime,
    conversationId
  );
  audit(
    db,
    'RobotCustomer',
    robot.CustomerId,
    'RobotCustomerResponseSent',
    'ChatRecord',
    robotReplyId,
    {
      conversationId,
      inReplyTo: incomingChatRecordId,
      responseSource: generated.reply.responseSource,
      robotAIPolicyVersion: generated.reply.policyVersion
    }
  );

  return {
    robotReply: {
      chatRecordId: robotReplyId,
      chatTime: robotReplyTime,
      senderId: robot.CustomerId,
      receiverId: realCustomerId,
      text: generated.reply.text,
      responseSource: generated.reply.responseSource
    },
    reason: null
  };
}

function customerMainInfo(db, customerId) {
  const row = db.prepare(`
    SELECT CustomerId, DisplayName, BirthDate, Sex, GenderLookingFor,
      CountryCode, StateId, CityName, Bio, TraitsJson, InterestsJson, GoalsJson
    FROM CustomerProfile
    WHERE CustomerId = ?
  `).get(customerId);
  if (!row) return null;
  return {
    customerId: row.CustomerId,
    displayName: row.DisplayName,
    birthDate: row.BirthDate,
    sex: row.Sex,
    lookingFor: row.GenderLookingFor,
    countryCode: row.CountryCode,
    state: row.StateId,
    city: row.CityName,
    bio: row.Bio,
    traits: JSON.parse(row.TraitsJson || '[]'),
    interests: JSON.parse(row.InterestsJson || '[]'),
    goals: JSON.parse(row.GoalsJson || '[]')
  };
}

function createRobotRequestQueue(db) {
  const customerInfoById = new Map();
  const queue = [];
  const queuedChatIds = new Set();
  let processing = false;
  let scheduled = false;
  let delayedWakeTimer = null;

  function cachedCustomerInfo(customerId) {
    if (!customerInfoById.has(customerId)) {
      customerInfoById.set(customerId, customerMainInfo(db, customerId));
    }
    return customerInfoById.get(customerId);
  }

  function enqueue(request, options = {}) {
    const incomingChatRecordId = request.incomingChatRecordId || request.IncomingChatRecordId;
    if (!incomingChatRecordId || queuedChatIds.has(incomingChatRecordId)) return false;
    const conversationId = request.conversationId || request.ConversationId;
    const requestedAt = request.requestedAt || request.IncomingChatTime || new Date().toISOString();
    const configuredDelay = Number(
      getPolicy(db, 'robot_response_delay_seconds', DEFAULT_ROBOT_RESPONSE_DELAY_SECONDS).value
    );
    const delaySeconds = Math.max(
      0,
      Number.isFinite(configuredDelay) ? configuredDelay : DEFAULT_ROBOT_RESPONSE_DELAY_SECONDS
    );
    const dueAt = new Date(Date.parse(requestedAt) + delaySeconds * 1000).toISOString();
    for (let index = queue.length - 1; index >= 0; index -= 1) {
      if (queue[index].conversationId === conversationId) {
        queuedChatIds.delete(queue[index].incomingChatRecordId);
        queue.splice(index, 1);
      }
    }
    queue.push({
      robotId: request.robotId || request.CustomerId,
      realCustomerId: request.realCustomerId || request.RealCustomerId,
      conversationId,
      incomingChatRecordId,
      text: request.text || request.IncomingText,
      requestedAt,
      dueAt
    });
    queuedChatIds.add(incomingChatRecordId);
    if (options.wake !== false) scheduleWake(dueAt);
    return true;
  }

  function scheduleWake(dueAt = new Date().toISOString()) {
    const delayMs = Math.max(0, Date.parse(dueAt) - Date.now());
    if (delayMs === 0) {
      wake();
      return;
    }
    if (delayedWakeTimer) clearTimeout(delayedWakeTimer);
    delayedWakeTimer = setTimeout(() => {
      delayedWakeTimer = null;
      wake();
    }, delayMs);
    delayedWakeTimer.unref?.();
  }

  function wake() {
    if (processing || scheduled) return;
    scheduled = true;
    setImmediate(() => {
      scheduled = false;
      try {
        process();
      } catch (error) {
        console.error('Robot queue failed', error);
      }
    });
  }

  function process(limit = 50, timestamp = new Date()) {
    if (processing) return { processed: 0, sent: 0, deferred: 0, queueLength: queue.length };
    processing = true;
    let processed = 0;
    let sent = 0;
    let deferred = 0;
    const notReady = [];
    try {
      while (queue.length && processed < limit) {
        const request = queue.shift();
        if (Date.parse(request.dueAt) > timestamp.getTime()) {
          notReady.push(request);
          continue;
        }
        queuedChatIds.delete(request.incomingChatRecordId);
        processed += 1;

        const robot = db.prepare(`
          SELECT * FROM CustomerProfile
          WHERE CustomerId = ? AND Seed = ? AND Active = 1
        `).get(request.robotId, CUSTOMER_TYPE.ROBOT);
        const message = db.prepare(`
          SELECT * FROM ChatRecords
          WHERE ChatRecordId = ? AND SenderId = ? AND ConversationId = ?
        `).get(request.incomingChatRecordId, request.realCustomerId, request.conversationId);
        if (!robot || !message) {
          deferred += 1;
          continue;
        }

        db.exec('BEGIN IMMEDIATE');
        try {
          const result = insertRobotReply(db, {
            robot,
            realCustomerId: request.realCustomerId,
            conversationId: request.conversationId,
            incomingChatRecordId: request.incomingChatRecordId,
            text: request.text,
            customerInfo: cachedCustomerInfo(request.realCustomerId),
            timestamp: new Date(),
            allowOffShift: true
          });
          if (result.robotReply) sent += 1;
          else deferred += 1;
          db.exec('COMMIT');
        } catch (error) {
          db.exec('ROLLBACK');
          throw error;
        }
      }
    } finally {
      if (notReady.length) queue.unshift(...notReady);
      processing = false;
      if (queue.length) {
        const nextDueAt = queue.reduce((minimum, item) => (
          !minimum || Date.parse(item.dueAt) < Date.parse(minimum) ? item.dueAt : minimum
        ), null);
        scheduleWake(nextDueAt);
      }
    }
    return { processed, sent, deferred, queueLength: queue.length };
  }

  function snapshot() {
    return {
      queueLength: queue.length,
      readyQueueLength: queue.filter((item) => Date.parse(item.dueAt) <= Date.now()).length,
      cachedCustomers: customerInfoById.size,
      processing
    };
  }

  function close() {
    if (delayedWakeTimer) clearTimeout(delayedWakeTimer);
  }

  return { enqueue, process, snapshot, close };
}

function pendingRobotMessages(db, timestamp = new Date(), limit = 50) {
  const current = timestamp.toISOString();
  return db.prepare(`
    SELECT
      c.ConversationId,
      robot.*,
      real.CustomerId AS RealCustomerId,
      latest.ChatRecordId AS IncomingChatRecordId,
      latest.ChatTime AS IncomingChatTime,
      latest.Text AS IncomingText
    FROM CustomerProfile robot
    JOIN Conversations c
      ON c.CustomerAId = robot.CustomerId OR c.CustomerBId = robot.CustomerId
    JOIN CustomerProfile real
      ON real.CustomerId = CASE
        WHEN c.CustomerAId = robot.CustomerId THEN c.CustomerBId
        ELSE c.CustomerAId
      END
    JOIN ChatRecords latest
      ON latest.ConversationId = c.ConversationId
      AND latest.ChatTime = (
        SELECT MAX(m.ChatTime)
        FROM ChatRecords m
        WHERE m.ConversationId = c.ConversationId
      )
    WHERE robot.Seed = ?
      AND robot.Active = 1
      AND real.Seed = ?
      AND real.Active = 1
      AND latest.SenderId = real.CustomerId
      AND latest.ChatTime <= ?
    ORDER BY latest.ChatTime
    LIMIT ?
  `).all(CUSTOMER_TYPE.ROBOT, CUSTOMER_TYPE.REAL, current, limit);
}

function processPendingRobotReplies(db, timestamp = new Date(), limit = 50) {
  return processPendingRobotRepliesWithQueue(db, createRobotRequestQueue(db), timestamp, limit);
}

function processPendingRobotRepliesWithQueue(db, robotQueue, timestamp = new Date(), limit = 50) {
  reconcileRobotOperations(db, timestamp);
  const pending = pendingRobotMessages(db, timestamp, limit);
  for (const row of pending) robotQueue.enqueue(row, { wake: false });
  return robotQueue.process(limit, timestamp);
}

function createApplication(options = {}) {
  const db = options.db || openDatabase(options.databasePath);
  const robotQueue = createRobotRequestQueue(db);
  reconcileRobotOperations(db);
  processPendingRobotRepliesWithQueue(db, robotQueue);
  let robotWorker = null;
  if (options.robotWorker !== false) {
    robotWorker = setInterval(() => {
      try {
        processPendingRobotRepliesWithQueue(db, robotQueue);
      } catch (error) {
        console.error('Robot worker failed', error);
      }
    }, options.robotWorkerIntervalMs || ROBOT_WORKER_INTERVAL_MS);
    robotWorker.unref?.();
  }

  async function handleApi(req, res, url, requestId) {
    const { pathname, searchParams } = url;
    let params;

    if (req.method === 'GET' && pathname === '/api/v1/health') {
      const databaseHealthy = db.prepare('SELECT 1 AS ok').get().ok === 1;
      return json(res, 200, envelope({
        status: databaseHealthy ? 'Healthy' : 'Unavailable',
        apiVersion: 'v1',
        prototypeVersion: '0.4.0',
        releaseName: 'Arfa',
        checkedAt: now()
      }, requestId));
    }

    if (req.method === 'POST' && pathname === '/api/v1/auth/customer/login') {
      const body = await readJson(req);
      const email = String(body.email || '').trim().toLowerCase();
      const customer = db
        .prepare('SELECT * FROM CustomerProfile WHERE EmailNormalized = ? AND Seed = 0')
        .get(email);
      if (!customer || !customer.Active || !verifyPassword(body.password || '', customer.PasswordHash)) {
        throw new ApiError(401, 'LOGIN_FAILED', 'Email or password is incorrect.');
      }
      const sessionId = createSession(db, 'Customer', customer.CustomerId, 'Customer');
      db.prepare('UPDATE CustomerProfile SET LastLoginTime = ? WHERE CustomerId = ?').run(
        now(),
        customer.CustomerId
      );
      setSessionCookie(res, sessionId, 'Customer', 'Customer');
      audit(db, 'Customer', customer.CustomerId, 'CustomerLogin', 'Session', sessionId);
      return json(res, 200, envelope({
        customerId: customer.CustomerId,
        displayName: customer.DisplayName,
        creditBalance: customer.CreditsRemain,
        mustChangePassword: Boolean(customer.MustChangePassword),
        mustCompleteProfile: !Boolean(customer.ProfileCompleted)
      }, requestId));
    }

    if (req.method === 'POST' && pathname === '/api/v1/auth/customer/password-reset-requests') {
      const body = await readJson(req);
      const requestedName = String(body.fullName || '').trim();
      const contact = String(body.contact || '').trim();
      const contactType = contact.includes('@') ? 'Email' : 'Phone';
      if (requestedName.length < 2 || contact.length < 5) {
        throw new ApiError(422, 'VALIDATION_FAILED', 'Enter the account name and email or phone number.');
      }
      const customer = contactType === 'Email'
        ? db.prepare(`
            SELECT * FROM CustomerProfile
            WHERE Seed = 0 AND Active = 1
              AND lower(DisplayName) = lower(?)
              AND EmailNormalized = lower(?)
          `).get(requestedName, contact)
        : db.prepare(`
            SELECT * FROM CustomerProfile
            WHERE Seed = 0 AND Active = 1
              AND lower(DisplayName) = lower(?)
              AND Phone = ?
          `).get(requestedName, contact);
      if (!customer) {
        audit(db, 'Public', 'anonymous', 'PasswordResetIdentityMismatch', 'Customer', null);
        return json(res, 202, envelope({
          accepted: true,
          status: 'PendingVerification',
          message: 'If the account information matches, the request will enter the approval queue.'
        }, requestId));
      }
      const pending = db.prepare(`
        SELECT * FROM PasswordResetRequests
        WHERE CustomerId = ? AND Status = 'Pending'
        ORDER BY RequestTime DESC LIMIT 1
      `).get(customer.CustomerId);
      if (pending) {
        return json(res, 202, envelope({
          accepted: true,
          status: 'Pending',
          passwordResetRequestId: pending.PasswordResetRequestId
        }, requestId));
      }
      const resetId = randomUUID();
      const timestamp = now();
      const autoApprove = policyEnabled(db, 'password_reset_auto_approve');
      let status = 'Pending';
      let deliveryStatus = 'WaitingForAdministrator';
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare(`
          INSERT INTO PasswordResetRequests (
            PasswordResetRequestId, CustomerId, RequestedName, ContactType,
            ContactValueMasked, Status, RequestTime, DeliveryChannel
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          resetId,
          customer.CustomerId,
          requestedName,
          contactType,
          maskContact(contactType, contact),
          autoApprove ? 'AutoApproved' : 'Pending',
          timestamp,
          contactType
        );
        if (autoApprove) {
          const generated = temporaryPassword();
          db.prepare(`
            UPDATE CustomerProfile
            SET PasswordHash = ?, MustChangePassword = 1
            WHERE CustomerId = ?
          `).run(hashPassword(generated), customer.CustomerId);
          db.prepare(`
            UPDATE PasswordResetRequests
            SET DecisionTime = ?, Remark = ?
            WHERE PasswordResetRequestId = ?
          `).run(timestamp, 'Temporary password sent through simulated delivery provider.', resetId);
          db.prepare('DELETE FROM Sessions WHERE PrincipalType = ? AND PrincipalId = ?')
            .run('Customer', customer.CustomerId);
          status = 'AutoApproved';
          deliveryStatus = `SentBy${contactType}`;
        }
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
      audit(db, 'Customer', customer.CustomerId, 'PasswordResetRequested', 'PasswordResetRequest', resetId, {
        contactType,
        autoApprove
      });
      return json(res, 202, envelope({
        accepted: true,
        status,
        deliveryStatus,
        passwordResetRequestId: resetId
      }, requestId));
    }

    if (req.method === 'POST' && pathname === '/api/v1/auth/customer/register') {
      const body = await readJson(req);
      const email = String(body.email || '').trim().toLowerCase();
      const displayName = String(body.displayName || '').trim();
      const password = String(body.password || '');
      const birthDate = String(body.birthDate || '');
      const sex = String(body.sex || '').trim();
      const countryCode = String(body.countryCode || '').trim().toUpperCase();
      const state = String(body.state || '').trim();
      const city = String(body.city || '').trim();
      const fields = {};
      if (!email.includes('@')) fields.email = ['Enter a valid email address.'];
      if (displayName.length < 2) fields.displayName = ['Enter a display name.'];
      if (password.length < 8) fields.password = ['Use at least eight characters.'];
      if (ageFromBirthDate(birthDate) < 18) fields.birthDate = ['You must be at least 18.'];
      if (!['Man', 'Woman', 'Nonbinary', 'NotSpecified'].includes(sex)) {
        fields.sex = ['Select your gender.'];
      }
      if (!/^[A-Z]{2}$/u.test(countryCode)) fields.countryCode = ['Select a country.'];
      if (!state || state.length > 120) fields.state = ['Enter a state or province.'];
      if (!city || city.length > 120) fields.city = ['Enter a city.'];
      if (Object.keys(fields).length) {
        throw new ApiError(422, 'VALIDATION_FAILED', 'Please check the submitted fields.', fields);
      }
      if (db.prepare('SELECT 1 FROM CustomerProfile WHERE EmailNormalized = ?').get(email)) {
        throw new ApiError(409, 'EMAIL_IN_USE', 'That email is already registered.');
      }
      const customerId = randomUUID();
      const timestamp = now();
      const profilePhoto = defaultProfilePhoto(sex);
      const initialProfile = {
        displayName,
        birthDate,
        sex,
        countryCode,
        state,
        city,
        maritalStatus: '',
        workField: '',
        englishLevel: '',
        languages: [],
        traits: [],
        interests: [],
        movies: [],
        music: [],
        goals: [],
        preferredAgeMin: null,
        preferredAgeMax: null,
        lookingFor: '',
        personalityType: '',
        story: '',
        profilePhoto
      };
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare(`
          INSERT INTO CustomerProfile (
            CustomerId, Email, EmailNormalized, Phone, PasswordHash, DisplayName,
            BirthDate, Sex, GenderLookingFor, CountryCode, StateId, CityName,
            Bio, ProfilePhoto, PublicPhotosJson, ProfileCompleted,
            ProfileCompleteness, CreateTime, UpdateTime, Active, Seed,
            CreditsRemain, TotalCharged
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?,
            '', ?, ?, 0, ?, ?, ?, 1, 0, 50, 0
          )
        `).run(
          customerId,
          email,
          email,
          body.phone || null,
          hashPassword(password),
          displayName,
          birthDate,
          sex,
          countryCode,
          state,
          city,
          profilePhoto,
          JSON.stringify([profilePhoto]),
          profileCompleteness(initialProfile),
          timestamp,
          timestamp
        );
        db.prepare(`
          INSERT INTO CreditLedger (
            CreditLedgerId, CustomerId, TransactionTime, TransactionType,
            CreditsChange, BalanceAfter, ReferenceType, Remark
          ) VALUES (?, ?, ?, 'RegistrationReward', 50, 50, 'Registration', ?)
        `).run(randomUUID(), customerId, timestamp, 'One-time registration reward');
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
      const sessionId = createSession(db, 'Customer', customerId, 'Customer');
      setSessionCookie(res, sessionId, 'Customer', 'Customer');
      audit(db, 'Customer', customerId, 'CustomerRegistered', 'Customer', customerId);
      return json(res, 201, envelope({
        customerId,
        displayName,
        registrationReward: { creditsGranted: 50, granted: true },
        creditBalance: 50,
        mustCompleteProfile: true
      }, requestId));
    }

    if (req.method === 'POST' && pathname === '/api/v1/auth/staff/login') {
      const body = await readJson(req);
      const employee = db
        .prepare('SELECT * FROM Employees WHERE Email = ?')
        .get(String(body.email || '').trim().toLowerCase());
      if (!employee || !employee.Active || !verifyPassword(body.password || '', employee.PasswordHash)) {
        throw new ApiError(401, 'LOGIN_FAILED', 'Email or password is incorrect.');
      }
      const sessionId = createSession(db, 'Employee', employee.EmployeeId, employee.Role);
      setSessionCookie(res, sessionId, 'Employee', employee.Role);
      audit(db, 'Employee', employee.EmployeeId, 'StaffLogin', 'Session', sessionId, {
        role: employee.Role
      });
      return json(res, 200, envelope({
        employeeId: employee.EmployeeId,
        displayName: employee.DisplayName,
        role: employee.Role
      }, requestId));
    }

    if (req.method === 'POST' && pathname === '/api/v1/auth/staff/keepalive') {
      const session = authenticate(db, req, 'Employee');
      return json(res, 200, envelope({
        employeeId: session.PrincipalId,
        role: session.Role,
        active: true
      }, requestId));
    }

    if (req.method === 'POST' && pathname === '/api/v1/auth/logout') {
      const cookies = parseCookies(req);
      for (const sessionId of ALL_SESSION_COOKIES.map((cookieName) => cookies[cookieName]).filter(Boolean)) {
        db.prepare('DELETE FROM Sessions WHERE SessionId = ?').run(sessionId);
      }
      clearSessionCookies(res);
      return json(res, 200, envelope({ loggedOut: true }, requestId));
    }

    if (req.method === 'GET' && pathname === '/api/v1/customer/me') {
      const session = authenticate(db, req, 'Customer', {
        allowPasswordChangeRequired: true
      });
      const customer = getCustomer(db, session.PrincipalId);
      const profile = editableCustomerProfile(customer);
      return json(res, 200, envelope({
        ...profile,
        active: Boolean(customer.Active),
        creditBalance: customer.CreditsRemain,
        mustChangePassword: Boolean(customer.MustChangePassword),
        capabilities: {
          discover: Boolean(customer.ProfileCompleted),
          message: customer.CreditsRemain >= MESSAGE_COST,
          buyCredits: true
        }
      }, requestId));
    }

    if (req.method === 'POST' && pathname === '/api/v1/customer/me/password') {
      const session = authenticate(db, req, 'Customer', {
        allowPasswordChangeRequired: true
      });
      const customer = db.prepare('SELECT * FROM CustomerProfile WHERE CustomerId = ?')
        .get(session.PrincipalId);
      const body = await readJson(req);
      const currentPassword = String(body.currentPassword || '');
      const newPassword = String(body.newPassword || '');
      if (!verifyPassword(currentPassword, customer.PasswordHash)) {
        throw new ApiError(422, 'CURRENT_PASSWORD_INCORRECT', 'The current password is incorrect.');
      }
      if (newPassword.length < 8) {
        throw new ApiError(422, 'PASSWORD_TOO_SHORT', 'Use at least eight characters.');
      }
      if (currentPassword === newPassword) {
        throw new ApiError(422, 'PASSWORD_UNCHANGED', 'Choose a different password.');
      }
      db.prepare(`
        UPDATE CustomerProfile
        SET PasswordHash = ?, MustChangePassword = 0
        WHERE CustomerId = ?
      `).run(hashPassword(newPassword), session.PrincipalId);
      db.prepare(`
        DELETE FROM Sessions
        WHERE PrincipalType = 'Customer' AND PrincipalId = ? AND SessionId <> ?
      `).run(session.PrincipalId, session.SessionId);
      audit(db, 'Customer', session.PrincipalId, 'CustomerPasswordChanged', 'Customer', session.PrincipalId);
      return json(res, 200, envelope({ passwordChanged: true }, requestId));
    }

    if (req.method === 'PATCH' && pathname === '/api/v1/customer/me') {
      const session = authenticate(db, req, 'Customer');
      const customer = getCustomer(db, session.PrincipalId);
      const current = editableCustomerProfile(customer);
      const body = await readJson(req);
      const email = String(body.email ?? current.email).trim().toLowerCase();
      const phone = String(body.phone ?? current.phone).trim();
      const displayName = String(body.displayName ?? customer.DisplayName).trim();
      const birthDate = String(body.birthDate ?? current.birthDate);
      const sex = String(body.sex ?? current.sex).trim();
      const countryCode = String(body.countryCode ?? current.countryCode).trim().toUpperCase();
      const city = String(body.city ?? current.city).trim();
      const state = String(body.state ?? current.state).trim();
      const bio = String(body.bio ?? current.bio).trim();
      const lookingFor = String(body.lookingFor ?? current.lookingFor).trim();
      const maritalStatus = String(body.maritalStatus ?? current.maritalStatus).trim();
      const workField = String(body.workField ?? current.workField).trim();
      const englishLevel = String(body.englishLevel ?? current.englishLevel).trim();
      const languages = cleanStringArray(body.languages ?? current.languages, 8);
      const traits = cleanStringArray(body.traits ?? current.traits, 3);
      const interests = cleanStringArray(body.interests ?? current.interests, 5);
      const movies = cleanStringArray(body.movies ?? current.movies, 3);
      const music = cleanStringArray(body.music ?? current.music, 3);
      const goals = cleanStringArray(body.goals ?? current.goals, 3);
      const minimumValue = body.preferredAgeMin ?? current.preferredAgeMin;
      const maximumValue = body.preferredAgeMax ?? current.preferredAgeMax;
      const preferredAgeMin =
        minimumValue === null || minimumValue === '' ? null : Number(minimumValue);
      const preferredAgeMax =
        maximumValue === null || maximumValue === '' ? null : Number(maximumValue);
      const personalityType = String(body.personalityType ?? current.personalityType).trim();
      const story = String(body.story ?? current.story).trim();
      let profilePhoto = String(body.profilePhoto ?? current.profilePhoto);
      if (
        profilePhoto.startsWith('/assets/profiles/default-') &&
        sex !== current.sex
      ) {
        profilePhoto = defaultProfilePhoto(sex);
      }
      const publicPhotos = cleanStringArray(body.publicPhotos ?? current.publicPhotos, 3);
      const privatePhotos = cleanStringArray(body.privatePhotos ?? current.privatePhotos, 3);
      const fields = {};
      if (!email.includes('@') || email.length > 254) {
        fields.email = ['Enter a valid email address.'];
      }
      if (phone && (phone.length < 7 || phone.length > 50)) {
        fields.phone = ['Enter a valid phone number.'];
      }
      if (displayName.length < 2 || displayName.length > 100) {
        fields.displayName = ['Display name must contain 2 to 100 characters.'];
      }
      if (ageFromBirthDate(birthDate) < 18) fields.birthDate = ['You must be at least 18.'];
      if (!['Man', 'Woman', 'Nonbinary', 'NotSpecified'].includes(sex)) {
        fields.sex = ['Select your gender.'];
      }
      if (!/^[A-Z]{2}$/u.test(countryCode)) fields.countryCode = ['Select a country.'];
      if (!state || state.length > 120) fields.state = ['Enter a state or province.'];
      if (!city || city.length > 120) fields.city = ['Enter a valid city.'];
      if (bio.length > 4000) fields.bio = ['Biography must not exceed 4,000 characters.'];
      if (story.length > 4000) fields.story = ['Story must not exceed 4,000 characters.'];
      if (!validProfilePhoto(profilePhoto)) fields.profilePhoto = ['Choose a JPG or PNG photo.'];
      if (![...publicPhotos, ...privatePhotos].every(validProfilePhoto)) {
        fields.photos = ['Photos must be JPG or PNG images.'];
      }
      if (
        Number.isFinite(preferredAgeMin) &&
        Number.isFinite(preferredAgeMax) &&
        (preferredAgeMin < 18 || preferredAgeMax < preferredAgeMin || preferredAgeMax > 120)
      ) {
        fields.preferredAge = ['Enter a valid preferred age range.'];
      }
      const proposed = {
        displayName,
        birthDate,
        sex,
        countryCode,
        state,
        city,
        maritalStatus,
        workField,
        englishLevel,
        languages,
        traits,
        interests,
        movies,
        music,
        goals,
        preferredAgeMin,
        preferredAgeMax,
        lookingFor,
        personalityType,
        story,
        profilePhoto
      };
      const completeness = profileCompleteness(proposed);
      const basicComplete = basicProfileComplete(proposed);
      const completing = body.completeProfile === true || Boolean(customer.ProfileCompleted);
      if (completing && !basicComplete) {
        fields.profile = ['Complete Basic information before continuing.'];
      }
      if (Object.keys(fields).length) {
        throw new ApiError(422, 'VALIDATION_FAILED', 'Please check the submitted fields.', fields);
      }
      if (
        email !== customer.EmailNormalized &&
        db.prepare(`
          SELECT 1 FROM CustomerProfile
          WHERE EmailNormalized = ? AND CustomerId <> ?
        `).get(email, session.PrincipalId)
      ) {
        throw new ApiError(409, 'EMAIL_IN_USE', 'That email is already registered.');
      }
      const completed = completing && basicComplete ? 1 : 0;
      const storedPublicPhotos = publicPhotos.length ? publicPhotos : [profilePhoto];
      db.prepare(`
        UPDATE CustomerProfile
        SET Email = ?, EmailNormalized = ?, Phone = ?,
            DisplayName = ?, BirthDate = ?, Sex = ?, CountryCode = ?, StateId = ?,
            CityName = ?, MaritalStatus = ?, WorkField = ?, EnglishLevel = ?,
            LanguagesJson = ?, TraitsJson = ?, InterestsJson = ?,
            MoviePreferencesJson = ?, MusicPreferencesJson = ?, GoalsJson = ?,
            PreferredAgeMin = ?, PreferredAgeMax = ?, GenderLookingFor = ?,
            PersonalityType = ?, Story = ?, Bio = ?, ProfilePhoto = ?,
            PublicPhotosJson = ?, PrivatePhotosJson = ?, ProfileCompleted = ?,
            ProfileCompleteness = ?, UpdateTime = ?
        WHERE CustomerId = ?
      `).run(
        email,
        email,
        phone || null,
        displayName,
        birthDate,
        sex,
        countryCode,
        state,
        city,
        maritalStatus || null,
        workField || null,
        englishLevel || null,
        JSON.stringify(languages),
        JSON.stringify(traits),
        JSON.stringify(interests),
        JSON.stringify(movies),
        JSON.stringify(music),
        JSON.stringify(goals),
        preferredAgeMin,
        preferredAgeMax,
        lookingFor || null,
        personalityType || null,
        story || null,
        bio,
        profilePhoto,
        JSON.stringify(storedPublicPhotos),
        JSON.stringify(privatePhotos),
        completed,
        completeness,
        now(),
        session.PrincipalId
      );
      audit(db, 'Customer', session.PrincipalId, 'CustomerProfileUpdated', 'Customer', session.PrincipalId);
      const updated = getCustomer(db, session.PrincipalId);
      return json(res, 200, envelope(editableCustomerProfile(updated), requestId));
    }

    if (req.method === 'GET' && pathname === '/api/v1/customer/discovery/locations') {
      const session = authenticate(db, req, 'Customer');
      const rows = db.prepare(`
        SELECT CountryCode, StateId, CityName
        FROM CustomerProfile
        WHERE Active = 1
          AND CustomerId <> ?
          AND COALESCE(CountryCode, '') <> ''
          AND COALESCE(StateId, '') <> ''
          AND COALESCE(CityName, '') <> ''
        GROUP BY CountryCode, StateId, CityName
        ORDER BY CountryCode, StateId, CityName
      `).all(session.PrincipalId);
      const countriesByCode = new Map();
      const ensureCountry = (code, name) => {
        if (!countriesByCode.has(code)) {
          countriesByCode.set(code, {
            code,
            name: name || COUNTRY_NAMES[code] || code,
            states: [],
            stateMap: new Map()
          });
        }
        return countriesByCode.get(code);
      };
      const ensureState = (country, code, name) => {
        if (!country.stateMap.has(code)) {
          country.stateMap.set(code, {
            code,
            name: name || (country.code === 'US' ? US_STATE_NAMES[code] || code : code),
            citySet: new Set()
          });
          country.states.push(country.stateMap.get(code));
        }
        return country.stateMap.get(code);
      };
      for (const configuredCountry of configuredDiscoveryLocations()) {
        const country = ensureCountry(configuredCountry.code, configuredCountry.name);
        for (const configuredState of configuredCountry.states) {
          const state = ensureState(country, configuredState.code, configuredState.name);
          configuredState.cities.forEach((city) => state.citySet.add(city));
        }
      }
      const usCountry = ensureCountry('US', COUNTRY_NAMES.US);
      for (const [stateCode, cities] of censusUsPlaces()) {
        const state = ensureState(usCountry, stateCode, US_STATE_NAMES[stateCode] || stateCode);
        cities.forEach((city) => state.citySet.add(city));
      }
      for (const row of rows) {
        const country = ensureCountry(row.CountryCode, COUNTRY_NAMES[row.CountryCode]);
        const state = ensureState(
          country,
          row.StateId,
          row.CountryCode === 'US' ? US_STATE_NAMES[row.StateId] || row.StateId : row.StateId
        );
        state.citySet.add(row.CityName);
      }
      const countries = [...countriesByCode.values()].map((country) => ({
        code: country.code,
        name: country.name,
        states: country.states.map((item) => ({
          code: item.code,
          name: item.name,
          cities: [...item.citySet].sort((left, right) => left.localeCompare(right))
        })).sort((left, right) => left.name.localeCompare(right.name))
      }));
      return json(res, 200, envelope({ countries }, requestId));
    }

    if (req.method === 'GET' && pathname === '/api/v1/customer/discovery/profiles') {
      const session = authenticate(db, req, 'Customer');
      const viewer = getCustomer(db, session.PrincipalId);
      const query = String(searchParams.get('query') || '').trim();
      const countryCode = String(searchParams.get('countryCode') || '').trim().toUpperCase();
      const stateFilter = String(searchParams.get('state') || '').trim();
      const city = String(searchParams.get('city') || '').trim();
      const statusFilter = String(searchParams.get('status') || 'active').trim().toLowerCase();
      const includeInactive = statusFilter === 'all';
      const requestedSex = parseSexFilter(searchParams.get('sex'));
      const orientationAllowed = orientationSexes(viewer.GenderLookingFor);
      const sexFilters = requestedSex
        ? orientationAllowed.filter((sex) => sex === requestedSex)
        : orientationAllowed;
      const minAge = parseAgeFilter(searchParams.get('minAge'), 18);
      const maxAge = Math.max(minAge, parseAgeFilter(searchParams.get('maxAge'), 120));
      if (!sexFilters.length) {
        return json(res, 200, envelope({
          items: [],
          page: { limit: 20, nextCursor: null, hasMore: false }
        }, requestId));
      }
      const like = `%${query}%`;
      const sexPlaceholders = sexFilters.map(() => '?').join(', ');
      const rows = db.prepare(`
        SELECT p.*,
          EXISTS(
            SELECT 1 FROM CustomerFavorites f
            WHERE f.CustomerId = ? AND f.TargetCustomerId = p.CustomerId
          ) AS Favorite
        FROM CustomerProfile p
        WHERE (? = 1 OR p.Active = 1)
          AND p.CustomerId <> ?
          AND p.Sex IN (${sexPlaceholders})
          AND CAST((julianday('now') - julianday(p.BirthDate)) / 365.2425 AS INTEGER)
            BETWEEN ? AND ?
          AND (? = '' OR p.CountryCode = ?)
          AND (? = '' OR p.StateId = ?)
          AND (? = '' OR p.CityName = ?)
          AND (
            ? = ''
            OR p.DisplayName LIKE ?
            OR p.CityName LIKE ?
            OR p.Bio LIKE ?
            OR p.InterestsJson LIKE ?
            OR p.TraitsJson LIKE ?
            OR p.GoalsJson LIKE ?
          )
        ORDER BY p.Seed DESC, p.DisplayName
        LIMIT 20
      `).all(
        session.PrincipalId,
        includeInactive ? 1 : 0,
        session.PrincipalId,
        ...sexFilters,
        minAge,
        maxAge,
        countryCode,
        countryCode,
        stateFilter,
        stateFilter,
        city,
        city,
        query,
        like,
        like,
        like,
        like,
        like,
        like
      );
      return json(res, 200, envelope({
        items: rows.map((row) => (
          normalizeCustomer(withCustomerOnlineStatus(db, row), row.Favorite)
        )),
        page: { limit: 20, nextCursor: null, hasMore: false }
      }, requestId));
    }

    if (req.method === 'GET' && pathname === '/api/v1/customer/favorites') {
      const session = authenticate(db, req, 'Customer');
      const rows = db.prepare(`
        SELECT p.* FROM CustomerFavorites f
        JOIN CustomerProfile p ON p.CustomerId = f.TargetCustomerId
        WHERE f.CustomerId = ? AND p.Active = 1
        ORDER BY f.CreateTime DESC
        LIMIT 20
      `).all(session.PrincipalId);
      return json(res, 200, envelope({
        items: rows.map((row) => normalizeCustomer(withCustomerOnlineStatus(db, row), true)),
        page: { limit: 20, nextCursor: null, hasMore: false }
      }, requestId));
    }

    if (
      req.method === 'GET' &&
      (params = matchPath(pathname, '/api/v1/customer/profiles/:customerId'))
    ) {
      const session = authenticate(db, req, 'Customer');
      const profile = getCustomer(db, params.customerId);
      const favorite = Boolean(db.prepare(`
        SELECT 1 FROM CustomerFavorites WHERE CustomerId = ? AND TargetCustomerId = ?
      `).get(session.PrincipalId, params.customerId));
      return json(
        res,
        200,
        envelope(normalizeCustomer(withCustomerOnlineStatus(db, profile), favorite), requestId)
      );
    }

    if (
      req.method === 'POST' &&
      (params = matchPath(pathname, '/api/v1/customer/profiles/:customerId/favorite'))
    ) {
      const session = authenticate(db, req, 'Customer');
      getCustomer(db, params.customerId);
      db.prepare(`
        INSERT OR IGNORE INTO CustomerFavorites (
          CustomerId, TargetCustomerId, CreateTime
        ) VALUES (?, ?, ?)
      `).run(session.PrincipalId, params.customerId, now());
      return json(res, 200, envelope({ favorite: true }, requestId));
    }

    if (
      req.method === 'DELETE' &&
      (params = matchPath(pathname, '/api/v1/customer/profiles/:customerId/favorite'))
    ) {
      const session = authenticate(db, req, 'Customer');
      db.prepare(`
        DELETE FROM CustomerFavorites WHERE CustomerId = ? AND TargetCustomerId = ?
      `).run(session.PrincipalId, params.customerId);
      return json(res, 200, envelope({ favorite: false }, requestId));
    }

    if (req.method === 'GET' && pathname === '/api/v1/customer/conversations') {
      const session = authenticate(db, req, 'Customer');
      const rows = db.prepare(`
        SELECT c.*,
          CASE WHEN c.CustomerAId = ? THEN c.CustomerBId ELSE c.CustomerAId END AS OtherId,
          (
            SELECT Text FROM ChatRecords m
            WHERE m.ConversationId = c.ConversationId
            ORDER BY m.ChatTime DESC LIMIT 1
          ) AS LastText
        FROM Conversations c
        WHERE c.CustomerAId = ? OR c.CustomerBId = ?
        ORDER BY c.UpdatedAt DESC
        LIMIT 20
      `).all(session.PrincipalId, session.PrincipalId, session.PrincipalId);
      const items = rows.map((row) => {
        const other = getCustomer(db, row.OtherId);
        const favorite = Boolean(db.prepare(`
          SELECT 1 FROM CustomerFavorites WHERE CustomerId = ? AND TargetCustomerId = ?
        `).get(session.PrincipalId, other.CustomerId));
        return {
          conversationId: row.ConversationId,
          updatedAt: row.UpdatedAt,
          lastText: row.LastText,
          otherCustomer: normalizeCustomer(withCustomerOnlineStatus(db, other), favorite)
        };
      });
      return json(res, 200, envelope({
        items,
        page: { limit: 20, nextCursor: null, hasMore: false }
      }, requestId));
    }

    if (
      req.method === 'POST' &&
      (params = matchPath(pathname, '/api/v1/customer/conversations/with/:customerId'))
    ) {
      const session = authenticate(db, req, 'Customer');
      const conversation = findOrCreateConversation(db, session.PrincipalId, params.customerId);
      return json(res, 200, envelope({
        conversationId: conversation.ConversationId
      }, requestId));
    }

    if (
      req.method === 'GET' &&
      (params = matchPath(pathname, '/api/v1/customer/conversations/:conversationId/messages'))
    ) {
      const session = authenticate(db, req, 'Customer');
      const conversation = getConversation(db, params.conversationId, session.PrincipalId);
      processPendingRobotRepliesWithQueue(db, robotQueue, new Date(), 10);
      const otherId =
        conversation.CustomerAId === session.PrincipalId
          ? conversation.CustomerBId
          : conversation.CustomerAId;
      const messages = db.prepare(`
        SELECT * FROM ChatRecords
        WHERE ConversationId = ?
        ORDER BY ChatTime ASC
        LIMIT 100
      `).all(params.conversationId);
      const favorite = Boolean(db.prepare(`
        SELECT 1 FROM CustomerFavorites WHERE CustomerId = ? AND TargetCustomerId = ?
      `).get(session.PrincipalId, otherId));
      return json(res, 200, envelope({
        conversationId: params.conversationId,
        otherCustomer: normalizeCustomer(
          withCustomerOnlineStatus(db, getCustomer(db, otherId)),
          favorite
        ),
        messages: messages.map((message) => ({
          chatRecordId: message.ChatRecordId,
          chatTime: message.ChatTime,
          senderId: message.SenderId,
          receiverId: message.ReceiverId,
          text: message.Text,
          messageType: message.MessageType,
          creditUsed: message.CreditUsed,
          responseSource: message.ResponseSource
        }))
      }, requestId));
    }

    if (
      req.method === 'POST' &&
      (params = matchPath(
        pathname,
        '/api/v1/customer/conversations/:conversationId/messages/text'
      ))
    ) {
      const session = authenticate(db, req, 'Customer');
      const body = await readJson(req);
      const text = String(body.text || '').trim();
      const count = wordCount(text);
      if (!count) throw new ApiError(422, 'MESSAGE_EMPTY', 'Write a message first.');
      if (count > MAX_MESSAGE_WORDS) {
        throw new ApiError(422, 'MESSAGE_TOO_LONG', `Messages may contain at most ${MAX_MESSAGE_WORDS} words.`);
      }
      const idempotencyKey = String(req.headers['idempotency-key'] || '');
      if (!idempotencyKey) {
        throw new ApiError(400, 'IDEMPOTENCY_KEY_REQUIRED', 'An idempotency key is required.');
      }
      const routeKey = `SendText:${params.conversationId}`;
      const hash = requestHash({ text });
      const prior = db.prepare(`
        SELECT * FROM IdempotencyRecords
        WHERE PrincipalId = ? AND RouteKey = ? AND IdempotencyKey = ?
      `).get(session.PrincipalId, routeKey, idempotencyKey);
      if (prior) {
        if (prior.RequestHash !== hash) {
          throw new ApiError(409, 'IDEMPOTENCY_CONFLICT', 'That request key was already used.');
        }
        return json(res, 200, envelope(JSON.parse(prior.ResponseJson), requestId));
      }

      const conversation = getConversation(db, params.conversationId, session.PrincipalId);
      const receiverId =
        conversation.CustomerAId === session.PrincipalId
          ? conversation.CustomerBId
          : conversation.CustomerAId;
      const timestamp = now();
      const chatRecordId = randomUUID();
      let response;
      let robotQueueRequest = null;

      db.exec('BEGIN IMMEDIATE');
      try {
        const receiverProfile = db.prepare(`
          SELECT CustomerId, Seed, Active
          FROM CustomerProfile
          WHERE CustomerId = ?
        `).get(receiverId);
        const debit = db.prepare(`
          UPDATE CustomerProfile
          SET CreditsRemain = CreditsRemain - ?
          WHERE CustomerId = ? AND Active = 1 AND CreditsRemain >= ?
        `).run(MESSAGE_COST, session.PrincipalId, MESSAGE_COST);
        if (debit.changes !== 1) {
          throw new ApiError(422, 'INSUFFICIENT_CREDITS', 'You need more credits to send this message.');
        }
        const balance = db
          .prepare('SELECT CreditsRemain FROM CustomerProfile WHERE CustomerId = ?')
          .get(session.PrincipalId).CreditsRemain;
        db.prepare(`
          INSERT INTO ChatRecords (
            ChatRecordId, ConversationId, ChatTime, SenderId,
            ReceiverId, Text, MessageType, CreditUsed
          ) VALUES (?, ?, ?, ?, ?, ?, 'Text', ?)
        `).run(
          chatRecordId,
          params.conversationId,
          timestamp,
          session.PrincipalId,
          receiverId,
          text,
          MESSAGE_COST
        );
        db.prepare('UPDATE Conversations SET UpdatedAt = ? WHERE ConversationId = ?').run(
          timestamp,
          params.conversationId
        );
        db.prepare(`
          INSERT INTO CreditLedger (
            CreditLedgerId, CustomerId, TransactionTime, TransactionType,
            CreditsChange, BalanceAfter, ReferenceType, ReferenceId, Remark
          ) VALUES (?, ?, ?, 'TextMessageCharge', ?, ?, 'ChatRecord', ?, ?)
        `).run(
          randomUUID(),
          session.PrincipalId,
          timestamp,
          -MESSAGE_COST,
          balance,
          chatRecordId,
          'Prototype five-credit text message'
        );
        let robotReply = null;
        if (receiverProfile?.Seed === CUSTOMER_TYPE.ROBOT && receiverProfile.Active) {
          robotQueueRequest = {
            robotId: receiverProfile.CustomerId,
            realCustomerId: session.PrincipalId,
            conversationId: params.conversationId,
            incomingChatRecordId: chatRecordId,
            text,
            requestedAt: timestamp
          };
        }
        response = {
          chatRecordId,
          chatTime: timestamp,
          creditUsed: MESSAGE_COST,
          creditBalance: balance,
          deliveryStatus: 'Accepted',
          robotReply
        };
        db.prepare(`
          INSERT INTO IdempotencyRecords (
            PrincipalId, RouteKey, IdempotencyKey,
            RequestHash, ResponseJson, CreateTime
          ) VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          session.PrincipalId,
          routeKey,
          idempotencyKey,
          hash,
          JSON.stringify(response),
          timestamp
        );
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
      if (robotQueueRequest) robotQueue.enqueue(robotQueueRequest);
      return json(res, 201, envelope(response, requestId));
    }

    if (req.method === 'GET' && pathname === '/api/v1/customer/gifts') {
      authenticate(db, req, 'Customer');
      return json(res, 200, envelope({ items: GIFTS }, requestId));
    }

    if (
      req.method === 'POST' &&
      (params = matchPath(pathname, '/api/v1/customer/conversations/:conversationId/gifts'))
    ) {
      const session = authenticate(db, req, 'Customer');
      const body = await readJson(req);
      const gift = GIFTS.find((item) => item.giftId === Number(body.giftId));
      if (!gift) throw new ApiError(422, 'GIFT_NOT_FOUND', 'Choose an available gift.');
      const idempotencyKey = String(req.headers['idempotency-key'] || '');
      if (!idempotencyKey) {
        throw new ApiError(400, 'IDEMPOTENCY_KEY_REQUIRED', 'An idempotency key is required.');
      }
      const routeKey = `SendGift:${params.conversationId}`;
      const hash = requestHash({ giftId: gift.giftId });
      const prior = db.prepare(`
        SELECT * FROM IdempotencyRecords
        WHERE PrincipalId = ? AND RouteKey = ? AND IdempotencyKey = ?
      `).get(session.PrincipalId, routeKey, idempotencyKey);
      if (prior) {
        if (prior.RequestHash !== hash) {
          throw new ApiError(409, 'IDEMPOTENCY_CONFLICT', 'That request key was already used.');
        }
        return json(res, 200, envelope(JSON.parse(prior.ResponseJson), requestId));
      }

      const conversation = getConversation(db, params.conversationId, session.PrincipalId);
      const receiverId =
        conversation.CustomerAId === session.PrincipalId
          ? conversation.CustomerBId
          : conversation.CustomerAId;
      const receiver = getCustomer(db, receiverId);
      const timestamp = now();
      const chatRecordId = randomUUID();
      const giftTransactionId = randomUUID();
      let overseeingEmployeeId = null;
      if (receiver.Seed === CUSTOMER_TYPE.SEED) {
        const assignment = db.prepare(`
          SELECT EmployeeId FROM EmployeeSeed
          WHERE CustomerId = ? AND Active = 1
          LIMIT 1
        `).get(receiverId);
        if (!assignment) {
          throw new ApiError(422, 'GIFT_RECIPIENT_UNAVAILABLE', 'This gift cannot be delivered right now.');
        }
        overseeingEmployeeId = assignment.EmployeeId;
      }

      let response;
      db.exec('BEGIN IMMEDIATE');
      try {
        const debit = db.prepare(`
          UPDATE CustomerProfile
          SET CreditsRemain = CreditsRemain - ?
          WHERE CustomerId = ? AND Active = 1 AND CreditsRemain >= ?
        `).run(gift.senderCost, session.PrincipalId, gift.senderCost);
        if (debit.changes !== 1) {
          throw new ApiError(422, 'INSUFFICIENT_CREDITS', `You need ${gift.senderCost} credits to send ${gift.name}.`);
        }
        const senderBalance = db
          .prepare('SELECT CreditsRemain FROM CustomerProfile WHERE CustomerId = ?')
          .get(session.PrincipalId).CreditsRemain;
        const giftText = `${gift.icon} ${gift.name}`;
        db.prepare(`
          INSERT INTO ChatRecords (
            ChatRecordId, ConversationId, ChatTime, SenderId,
            ReceiverId, Text, MessageType, CreditUsed
          ) VALUES (?, ?, ?, ?, ?, ?, 'Gift', ?)
        `).run(
          chatRecordId,
          params.conversationId,
          timestamp,
          session.PrincipalId,
          receiverId,
          giftText,
          gift.senderCost
        );
        db.prepare(`
          INSERT INTO GiftTransactions (
            GiftTransactionId, ConversationId, ChatRecordId, SenderCustomerId,
            ReceiverCustomerId, GiftId, GiftName, SenderCost, RecipientCredits,
            PlatformCredits, OverseeingEmployeeId, CreateTime
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          giftTransactionId,
          params.conversationId,
          chatRecordId,
          session.PrincipalId,
          receiverId,
          gift.giftId,
          gift.name,
          gift.senderCost,
          gift.recipientCredits,
          gift.platformCredits,
          overseeingEmployeeId,
          timestamp
        );
        db.prepare(`
          INSERT INTO CreditLedger (
            CreditLedgerId, CustomerId, TransactionTime, TransactionType,
            CreditsChange, BalanceAfter, ReferenceType, ReferenceId, Remark
          ) VALUES (?, ?, ?, 'GiftSent', ?, ?, 'GiftTransaction', ?, ?)
        `).run(
          randomUUID(),
          session.PrincipalId,
          timestamp,
          -gift.senderCost,
          senderBalance,
          giftTransactionId,
          `${gift.name} gift sent; final and non-refundable`
        );
        if (receiver.Seed === CUSTOMER_TYPE.SEED) {
          const employeeBalance = db.prepare(`
            SELECT COALESCE(SUM(CreditsChange), 0) AS Balance
            FROM EmployeeCreditLedger WHERE EmployeeId = ?
          `).get(overseeingEmployeeId).Balance + gift.recipientCredits;
          db.prepare(`
            INSERT INTO EmployeeCreditLedger (
              EmployeeCreditLedgerId, EmployeeId, GiftTransactionId,
              TransactionTime, CreditsChange, BalanceAfter, Remark
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            randomUUID(),
            overseeingEmployeeId,
            giftTransactionId,
            timestamp,
            gift.recipientCredits,
            employeeBalance,
            `80% share from ${gift.name} received by assigned virtual profile`
          );
        } else {
          db.prepare(`
            UPDATE CustomerProfile SET CreditsRemain = CreditsRemain + ?
            WHERE CustomerId = ?
          `).run(gift.recipientCredits, receiverId);
          const receiverBalance = db
            .prepare('SELECT CreditsRemain FROM CustomerProfile WHERE CustomerId = ?')
            .get(receiverId).CreditsRemain;
          db.prepare(`
            INSERT INTO CreditLedger (
              CreditLedgerId, CustomerId, TransactionTime, TransactionType,
              CreditsChange, BalanceAfter, ReferenceType, ReferenceId, Remark
            ) VALUES (?, ?, ?, 'GiftReceived', ?, ?, 'GiftTransaction', ?, ?)
          `).run(
            randomUUID(),
            receiverId,
            timestamp,
            gift.recipientCredits,
            receiverBalance,
            giftTransactionId,
            `80% recipient share from ${gift.name}`
          );
        }
        db.prepare('UPDATE Conversations SET UpdatedAt = ? WHERE ConversationId = ?').run(
          timestamp,
          params.conversationId
        );
        response = {
          giftTransactionId,
          chatRecordId,
          gift,
          creditUsed: gift.senderCost,
          creditBalance: senderBalance,
          deliveryStatus: 'Accepted',
          refundable: false
        };
        db.prepare(`
          INSERT INTO IdempotencyRecords (
            PrincipalId, RouteKey, IdempotencyKey,
            RequestHash, ResponseJson, CreateTime
          ) VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          session.PrincipalId,
          routeKey,
          idempotencyKey,
          hash,
          JSON.stringify(response),
          timestamp
        );
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
      return json(res, 201, envelope(response, requestId));
    }

    if (req.method === 'GET' && pathname === '/api/v1/customer/credits/balance') {
      const session = authenticate(db, req, 'Customer');
      const customer = getCustomer(db, session.PrincipalId);
      return json(res, 200, envelope({
        creditBalance: customer.CreditsRemain,
        asOf: now()
      }, requestId));
    }

    if (req.method === 'GET' && pathname === '/api/v1/customer/credits/packages') {
      authenticate(db, req, 'Customer');
      return json(res, 200, envelope({ items: CREDIT_PACKAGES }, requestId));
    }

    if (req.method === 'GET' && pathname === '/api/v1/customer/credits/ledger') {
      const session = authenticate(db, req, 'Customer');
      const rows = db.prepare(`
        SELECT * FROM CreditLedger WHERE CustomerId = ?
        ORDER BY TransactionTime DESC LIMIT 20
      `).all(session.PrincipalId);
      return json(res, 200, envelope({
        items: rows.map((row) => ({
          creditLedgerId: row.CreditLedgerId,
          transactionTime: row.TransactionTime,
          transactionType: row.TransactionType,
          creditsChange: row.CreditsChange,
          balanceAfter: row.BalanceAfter,
          remark: row.Remark
        })),
        page: { limit: 20, nextCursor: null, hasMore: false }
      }, requestId));
    }

    if (req.method === 'POST' && pathname === '/api/v1/customer/credit-purchases/simulate') {
      const session = authenticate(db, req, 'Customer');
      const body = await readJson(req);
      const selected = CREDIT_PACKAGES.find((item) => item.packageId === Number(body.packageId));
      if (!selected) throw new ApiError(422, 'PACKAGE_NOT_FOUND', 'Choose a credit package.');
      const cardholderName = String(body.cardholderName || '').trim();
      const cardNumber = String(body.cardNumber || '').replace(/\D/gu, '');
      const expirationMonth = Number(body.expirationMonth);
      const expirationYear = Number(body.expirationYear);
      const securityCode = String(body.securityCode || '').trim();
      const fields = {};
      if (cardholderName.length < 2 || cardholderName.length > 120) {
        fields.cardholderName = ['Enter the name shown on the card.'];
      }
      if (!validCardNumber(cardNumber)) fields.cardNumber = ['Enter a valid card number.'];
      const current = new Date();
      const currentYear = current.getUTCFullYear();
      const currentMonth = current.getUTCMonth() + 1;
      if (
        !Number.isInteger(expirationMonth) ||
        expirationMonth < 1 ||
        expirationMonth > 12 ||
        !Number.isInteger(expirationYear) ||
        expirationYear < currentYear ||
        expirationYear > currentYear + 20 ||
        (expirationYear === currentYear && expirationMonth < currentMonth)
      ) {
        fields.expiration = ['Enter a valid future expiration date.'];
      }
      if (!/^\d{3,4}$/u.test(securityCode)) {
        fields.securityCode = ['Enter the three or four digit security code.'];
      }
      if (Object.keys(fields).length) {
        throw new ApiError(422, 'PAYMENT_VALIDATION_FAILED', 'Please check the card details.', fields);
      }
      const cardType = cardTypeFromNumber(cardNumber);
      const cardLast4 = cardNumber.slice(-4);
      const idempotencyKey = String(req.headers['idempotency-key'] || '');
      if (!idempotencyKey) {
        throw new ApiError(400, 'IDEMPOTENCY_KEY_REQUIRED', 'An idempotency key is required.');
      }
      const routeKey = 'SimulateCreditPurchase';
      const hash = requestHash({
        packageId: selected.packageId,
        cardholderName,
        cardType,
        cardLast4,
        expirationMonth,
        expirationYear
      });
      const prior = db.prepare(`
        SELECT * FROM IdempotencyRecords
        WHERE PrincipalId = ? AND RouteKey = ? AND IdempotencyKey = ?
      `).get(session.PrincipalId, routeKey, idempotencyKey);
      if (prior) {
        if (prior.RequestHash !== hash) {
          throw new ApiError(409, 'IDEMPOTENCY_CONFLICT', 'That request key was already used.');
        }
        return json(res, 200, envelope(JSON.parse(prior.ResponseJson), requestId));
      }
      const timestamp = now();
      const chargeRecordId = randomUUID();
      let balance;
      let response;
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare(`
          INSERT INTO ChargeRecord (
            ChargeRecordId, CustomerId, ChargeTime, Amount, CreditsBought,
            Status, ProviderReference, CardholderName, CardType, CardLast4,
            ExpirationMonth, ExpirationYear
          ) VALUES (?, ?, ?, ?, ?, 'PrototypeSimulated', ?, ?, ?, ?, ?, ?)
        `).run(
          chargeRecordId,
          session.PrincipalId,
          timestamp,
          selected.amount,
          selected.credits,
          `sim_${randomToken(8)}`,
          cardholderName,
          cardType,
          cardLast4,
          expirationMonth,
          expirationYear
        );
        db.prepare(`
          UPDATE CustomerProfile
          SET CreditsRemain = CreditsRemain + ?, TotalCharged = TotalCharged + ?
          WHERE CustomerId = ?
        `).run(selected.credits, selected.amount, session.PrincipalId);
        balance = db
          .prepare('SELECT CreditsRemain FROM CustomerProfile WHERE CustomerId = ?')
          .get(session.PrincipalId).CreditsRemain;
        db.prepare(`
          INSERT INTO CreditLedger (
            CreditLedgerId, CustomerId, TransactionTime, TransactionType,
            CreditsChange, BalanceAfter, ReferenceType, ReferenceId, Remark
          ) VALUES (?, ?, ?, 'CreditPurchase', ?, ?, 'ChargeRecord', ?, ?)
        `).run(
          randomUUID(),
          session.PrincipalId,
          timestamp,
          selected.credits,
          balance,
          chargeRecordId,
          'Simulated prototype purchase; no real card was charged'
        );
        response = {
          chargeRecordId,
          amount: selected.amount,
          creditsBought: selected.credits,
          creditBalance: balance,
          status: 'PrototypeSimulated',
          paymentMethod: {
            cardholderName,
            cardType,
            cardLast4,
            expirationMonth,
            expirationYear
          }
        };
        db.prepare(`
          INSERT INTO IdempotencyRecords (
            PrincipalId, RouteKey, IdempotencyKey,
            RequestHash, ResponseJson, CreateTime
          ) VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          session.PrincipalId,
          routeKey,
          idempotencyKey,
          hash,
          JSON.stringify(response),
          timestamp
        );
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
      return json(res, 201, envelope(response, requestId));
    }

    if (
      req.method === 'GET' &&
      (params = matchPath(pathname, '/api/v1/backend/conversations/:conversationId/messages'))
    ) {
      const session = authenticate(db, req, 'Employee', { role: 'ChatEmployee' });
      if (session.Role !== 'ChatEmployee') {
        throw new ApiError(403, 'FORBIDDEN', 'Employee workspace access is required.');
      }
      return json(
        res,
        200,
        envelope(employeeConversationMessages(db, params.conversationId, session.PrincipalId), requestId)
      );
    }

    if (
      req.method === 'GET' &&
      (params = matchPath(pathname, '/api/v1/backend/conversations/:conversationId/events'))
    ) {
      const session = authenticate(db, req, 'Employee', { role: 'ChatEmployee' });
      if (session.Role !== 'ChatEmployee') {
        throw new ApiError(403, 'FORBIDDEN', 'Employee workspace access is required.');
      }
      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-store',
        Connection: 'keep-alive',
        'X-Content-Type-Options': 'nosniff'
      });
      let lastSignature = '';
      let closed = false;
      const sendSlot = () => {
        if (closed) return;
        try {
          db.prepare('UPDATE Sessions SET LastActivityTime = ? WHERE SessionId = ?')
            .run(now(), session.SessionId);
          const slot = employeeConversationMessages(db, params.conversationId, session.PrincipalId);
          const latest = slot.messages.at(-1);
          const signature = `${latest?.chatRecordId || ''}:${slot.messages.length}:${slot.status}`;
          if (signature !== lastSignature) {
            lastSignature = signature;
            res.write(`data: ${JSON.stringify(slot)}\n\n`);
          } else {
            res.write(': keepalive\n\n');
          }
        } catch {
          closed = true;
          clearInterval(timer);
          res.end();
        }
      };
      const timer = setInterval(sendSlot, 500);
      timer.unref?.();
      req.on('close', () => {
        closed = true;
        clearInterval(timer);
      });
      sendSlot();
      return;
    }

    if (
      req.method === 'POST' &&
      (params = matchPath(pathname, '/api/v1/backend/conversations/:conversationId/messages'))
    ) {
      const session = authenticate(db, req, 'Employee', { role: 'ChatEmployee' });
      if (session.Role !== 'ChatEmployee') {
        throw new ApiError(403, 'FORBIDDEN', 'Employee workspace access is required.');
      }
      const body = await readJson(req);
      const text = String(body.text || '').trim();
      const count = wordCount(text);
      if (!count) throw new ApiError(422, 'MESSAGE_EMPTY', 'Write or select a response first.');
      if (count > MAX_MESSAGE_WORDS) {
        throw new ApiError(422, 'MESSAGE_TOO_LONG', `Responses may contain at most ${MAX_MESSAGE_WORDS} words.`);
      }
      const preparedReplyId = body.preparedReplyId
        ? String(body.preparedReplyId)
        : null;
      const preparedReply = preparedReplyId
        ? PREPARED_REPLIES.find((reply) => reply.preparedReplyId === preparedReplyId)
        : null;
      if (preparedReplyId && !preparedReply) {
        throw new ApiError(422, 'PREPARED_REPLY_NOT_FOUND', 'That prepared answer is no longer available.');
      }
      const responseSource = preparedReply
        ? preparedReply.text === text
          ? 'PreparedText'
          : 'PreparedEdited'
        : 'EmployeeWritten';
      const idempotencyKey = String(req.headers['idempotency-key'] || '');
      if (!idempotencyKey) {
        throw new ApiError(400, 'IDEMPOTENCY_KEY_REQUIRED', 'An idempotency key is required.');
      }
      const routeKey = `EmployeeSend:${params.conversationId}`;
      const hash = requestHash({ text, preparedReplyId });
      const prior = db.prepare(`
        SELECT * FROM IdempotencyRecords
        WHERE PrincipalId = ? AND RouteKey = ? AND IdempotencyKey = ?
      `).get(session.PrincipalId, routeKey, idempotencyKey);
      if (prior) {
        if (prior.RequestHash !== hash) {
          throw new ApiError(409, 'IDEMPOTENCY_CONFLICT', 'That request key was already used.');
        }
        return json(res, 200, envelope(JSON.parse(prior.ResponseJson), requestId));
      }

      const conversation = getEmployeeConversation(
        db,
        params.conversationId,
        session.PrincipalId
      );
      const timestamp = now();
      const chatRecordId = randomUUID();
      const response = {
        chatRecordId,
        conversationId: params.conversationId,
        chatTime: timestamp,
        senderId: conversation.SeedCustomerId,
        receiverId: conversation.RealCustomerId,
        text,
        messageType: 'Text',
        creditUsed: 0,
        responseSource,
        preparedReplyId
      };

      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare(`
          INSERT INTO ChatRecords (
            ChatRecordId, ConversationId, ChatTime, SenderId, ReceiverId,
            Text, MessageType, CreditUsed, ActingEmployeeId,
            ResponseSource, PreparedTextId
          ) VALUES (?, ?, ?, ?, ?, ?, 'Text', 0, ?, ?, ?)
        `).run(
          chatRecordId,
          params.conversationId,
          timestamp,
          conversation.SeedCustomerId,
          conversation.RealCustomerId,
          text,
          session.PrincipalId,
          responseSource,
          preparedReplyId
        );
        db.prepare('UPDATE Conversations SET UpdatedAt = ? WHERE ConversationId = ?').run(
          timestamp,
          params.conversationId
        );
        db.prepare(`
          INSERT INTO IdempotencyRecords (
            PrincipalId, RouteKey, IdempotencyKey,
            RequestHash, ResponseJson, CreateTime
          ) VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          session.PrincipalId,
          routeKey,
          idempotencyKey,
          hash,
          JSON.stringify(response),
          timestamp
        );
        audit(
          db,
          'Employee',
          session.PrincipalId,
          'SeedConversationResponseSent',
          'ChatRecord',
          chatRecordId,
          {
            conversationId: params.conversationId,
            seedCustomerId: conversation.SeedCustomerId,
            realCustomerId: conversation.RealCustomerId,
            responseSource,
            preparedReplyId
          }
        );
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
      return json(res, 201, envelope(response, requestId));
    }

    if (req.method === 'GET' && pathname === '/api/v1/backend/workspace') {
      const session = authenticate(db, req, 'Employee', { role: 'ChatEmployee' });
      if (session.Role !== 'ChatEmployee') {
        throw new ApiError(403, 'FORBIDDEN', 'Employee workspace access is required.');
      }
      const employee = db
        .prepare('SELECT * FROM Employees WHERE EmployeeId = ?')
        .get(session.PrincipalId);
      const assigned = db.prepare(`
        SELECT p.* FROM EmployeeSeed es
        JOIN CustomerProfile p ON p.CustomerId = es.CustomerId
        WHERE es.EmployeeId = ? AND es.Active = 1
          AND p.Seed = 1
        ORDER BY p.DisplayName LIMIT 20
      `).all(session.PrincipalId);
      const chatSlots = [];
      const seedCounts = new Map();
      for (const seed of assigned) {
        const conversations = db.prepare(`
          SELECT c.*,
            CASE WHEN c.CustomerAId = ? THEN c.CustomerBId ELSE c.CustomerAId END AS RealCustomerId
          FROM Conversations c
          JOIN CustomerProfile real
            ON real.CustomerId = CASE
              WHEN c.CustomerAId = ? THEN c.CustomerBId ELSE c.CustomerAId
            END
          WHERE (c.CustomerAId = ? OR c.CustomerBId = ?)
            AND real.Seed = 0
            AND real.Active = 1
          ORDER BY c.UpdatedAt DESC
        `).all(seed.CustomerId, seed.CustomerId, seed.CustomerId, seed.CustomerId);
        let waitingCount = 0;
        for (const conversation of conversations) {
          const messages = employeeConversationMessages(
            db,
            conversation.ConversationId,
            session.PrincipalId
          ).messages;
          const latest = messages.at(-1);
          const waitingForEmployee = Boolean(
            latest && latest.senderId === conversation.RealCustomerId
          );
          if (waitingForEmployee) waitingCount += 1;
          chatSlots.push({
            conversationId: conversation.ConversationId,
            updatedAt: conversation.UpdatedAt,
            status: waitingForEmployee ? 'Waiting for response' : 'Responded',
            waitingForEmployee,
            seed: normalizeCustomer(withCustomerOnlineStatus(db, seed), false, { includeType: true }),
            realCustomer: normalizeCustomer(
              withCustomerOnlineStatus(db, getCustomer(db, conversation.RealCustomerId)),
              false,
              { includeType: true }
            ),
            messages
          });
        }
        seedCounts.set(seed.CustomerId, {
          conversationCount: conversations.length,
          waitingCount
        });
      }
      chatSlots.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
      const visibleSlots = chatSlots.slice(0, 10);
      return json(res, 200, envelope({
        employee: {
          employeeId: employee.EmployeeId,
          displayName: employee.DisplayName,
          role: employee.Role
        },
        assignedSeeds: assigned.map((row) => ({
          ...normalizeCustomer(withCustomerOnlineStatus(db, row), false, { includeType: true }),
          ...(seedCounts.get(row.CustomerId) || {
            conversationCount: 0,
            waitingCount: 0
          })
        })),
        chatSlots: visibleSlots,
        capacity: {
          assignedSeeds: assigned.length,
          activeSeeds: assigned.length,
          maximumActiveSeeds: 20,
          openChats: visibleSlots.length,
          maximumOpenChats: 10
        },
        preparedReplies: PREPARED_REPLIES
      }, requestId));
    }

    if (req.method === 'GET' && pathname === '/api/v1/admin/password-reset-requests') {
      requireAdmin(db, req);
      const rows = db.prepare(`
        SELECT r.*, c.DisplayName, c.Email
        FROM PasswordResetRequests r
        JOIN CustomerProfile c ON c.CustomerId = r.CustomerId
        ORDER BY CASE WHEN r.Status = 'Pending' THEN 0 ELSE 1 END, r.RequestTime DESC
        LIMIT 20
      `).all();
      return json(res, 200, envelope({
        items: rows.map((row) => ({
          passwordResetRequestId: row.PasswordResetRequestId,
          customerId: row.CustomerId,
          customerName: row.DisplayName,
          customerEmail: row.Email,
          contactType: row.ContactType,
          contactValueMasked: row.ContactValueMasked,
          status: row.Status,
          requestTime: row.RequestTime,
          decisionTime: row.DecisionTime,
          deliveryChannel: row.DeliveryChannel
        }))
      }, requestId));
    }

    if (req.method === 'GET' && pathname === '/api/v1/admin/outgoing-payments') {
      const session = requireAdmin(db, req);
      if (session.Role !== 'Administrator') {
        throw new ApiError(403, 'PAYMENT_PREPARATION_ROLE_REQUIRED', 'Administrator payment preparation access is required.');
      }
      const rows = db.prepare(`
        SELECT p.*, requester.DisplayName AS RequestedByName,
          decider.DisplayName AS DecidedByName
        FROM OutgoingPaymentRequests p
        JOIN Employees requester ON requester.EmployeeId = p.RequestedByEmployeeId
        LEFT JOIN Employees decider ON decider.EmployeeId = p.DecidedByEmployeeId
        ORDER BY CASE p.Status WHEN 'Pending' THEN 0 ELSE 1 END, p.RequestTime DESC
        LIMIT 20
      `).all();
      return json(res, 200, envelope({
        items: rows.map(normalizeOutgoingPayment)
      }, requestId));
    }

    if (req.method === 'POST' && pathname === '/api/v1/admin/outgoing-payments') {
      const session = requireAdmin(db, req);
      if (session.Role !== 'Administrator') {
        throw new ApiError(403, 'PAYMENT_PREPARATION_ROLE_REQUIRED', 'Administrator payment preparation access is required.');
      }
      const body = await readJson(req);
      const payeeName = String(body.payeeName || '').trim();
      const category = String(body.category || '').trim();
      const description = String(body.description || '').trim();
      const currencyCode = String(body.currencyCode || 'USD').trim().toUpperCase();
      const amount = Number(body.amount);
      if (
        payeeName.length < 2 ||
        category.length < 2 ||
        description.length < 5 ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        !/^[A-Z]{3}$/u.test(currencyCode)
      ) {
        throw new ApiError(
          422,
          'VALIDATION_FAILED',
          'Enter a valid payee, category, positive amount, currency, and description.'
        );
      }
      const outgoingPaymentRequestId = randomUUID();
      const timestamp = now();
      db.prepare(`
        INSERT INTO OutgoingPaymentRequests (
          OutgoingPaymentRequestId, PayeeName, Category, Amount,
          CurrencyCode, Description, Status, RequestTime, RequestedByEmployeeId
        ) VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?, ?)
      `).run(
        outgoingPaymentRequestId,
        payeeName,
        category,
        amount,
        currencyCode,
        description,
        timestamp,
        session.PrincipalId
      );
      audit(
        db,
        'Employee',
        session.PrincipalId,
        'OutgoingPaymentPrepared',
        'OutgoingPaymentRequest',
        outgoingPaymentRequestId,
        { payeeName, category, amount, currencyCode }
      );
      const row = db.prepare(`
        SELECT p.*, requester.DisplayName AS RequestedByName,
          NULL AS DecidedByName
        FROM OutgoingPaymentRequests p
        JOIN Employees requester ON requester.EmployeeId = p.RequestedByEmployeeId
        WHERE p.OutgoingPaymentRequestId = ?
      `).get(outgoingPaymentRequestId);
      return json(res, 201, envelope({
        payment: normalizeOutgoingPayment(row)
      }, requestId));
    }

    if (
      req.method === 'POST' &&
      (params = matchPath(pathname, '/api/v1/admin/password-reset-requests/:requestId/approve'))
    ) {
      const session = requireAdmin(db, req);
      const reset = db.prepare(`
        SELECT * FROM PasswordResetRequests WHERE PasswordResetRequestId = ?
      `).get(params.requestId);
      if (!reset) throw new ApiError(404, 'PASSWORD_RESET_NOT_FOUND', 'Password reset request not found.');
      if (reset.Status !== 'Pending') {
        throw new ApiError(409, 'PASSWORD_RESET_ALREADY_DECIDED', 'This request was already decided.');
      }
      const generated = temporaryPassword();
      const timestamp = now();
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare(`
          UPDATE CustomerProfile
          SET PasswordHash = ?, MustChangePassword = 1
          WHERE CustomerId = ?
        `).run(hashPassword(generated), reset.CustomerId);
        db.prepare(`
          UPDATE PasswordResetRequests
          SET Status = 'Approved', DecisionTime = ?, DecidedByEmployeeId = ?,
              Remark = 'Temporary password sent through simulated delivery provider.'
          WHERE PasswordResetRequestId = ?
        `).run(timestamp, session.PrincipalId, params.requestId);
        db.prepare(`
          DELETE FROM Sessions WHERE PrincipalType = 'Customer' AND PrincipalId = ?
        `).run(reset.CustomerId);
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
      audit(db, 'Employee', session.PrincipalId, 'PasswordResetApproved', 'PasswordResetRequest', params.requestId);
      return json(res, 200, envelope({
        approved: true,
        deliveryChannel: reset.ContactType,
        temporaryPassword: generated,
        mustChangePassword: true
      }, requestId));
    }

    if (
      req.method === 'POST' &&
      (params = matchPath(pathname, '/api/v1/admin/password-reset-requests/:requestId/reject'))
    ) {
      const session = requireAdmin(db, req);
      const result = db.prepare(`
        UPDATE PasswordResetRequests
        SET Status = 'Rejected', DecisionTime = ?, DecidedByEmployeeId = ?
        WHERE PasswordResetRequestId = ? AND Status = 'Pending'
      `).run(now(), session.PrincipalId, params.requestId);
      if (result.changes !== 1) {
        throw new ApiError(409, 'PASSWORD_RESET_ALREADY_DECIDED', 'This request is missing or already decided.');
      }
      audit(db, 'Employee', session.PrincipalId, 'PasswordResetRejected', 'PasswordResetRequest', params.requestId);
      return json(res, 200, envelope({ rejected: true }, requestId));
    }

    if (req.method === 'GET' && pathname === '/api/v1/admin/employees') {
      requireAdmin(db, req);
      const rows = db.prepare(`
        SELECT * FROM Employees ORDER BY Active DESC, Role, DisplayName LIMIT 20
      `).all();
      return json(res, 200, envelope({ items: rows.map(normalizeEmployee) }, requestId));
    }

    if (req.method === 'POST' && pathname === '/api/v1/admin/employees') {
      const session = requireAdmin(db, req);
      const body = await readJson(req);
      const profile = employeeProfileFromBody(body);
      validateEmployeeProfile(profile);
      if (db.prepare('SELECT 1 FROM Employees WHERE Email = ?').get(profile.email)) {
        throw new ApiError(409, 'EMAIL_IN_USE', 'That employee email is already registered.');
      }
      const employeeId = randomUUID();
      const generated = temporaryPassword();
      db.prepare(`
        INSERT INTO Employees (
          EmployeeId, Email, PasswordHash, DisplayName, Sex, BirthDate, Phone,
          Address, Education, EmployeeType, Role, Active, StartDate, Remark
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Human', ?, 1, ?, ?)
      `).run(
        employeeId,
        profile.email,
        hashPassword(generated),
        profile.displayName,
        profile.sex,
        profile.birthDate,
        profile.phone,
        profile.address,
        profile.education,
        profile.role,
        now().slice(0, 10),
        profile.remark
      );
      audit(db, 'Employee', session.PrincipalId, 'EmployeeCreated', 'Employee', employeeId, { role: profile.role });
      return json(res, 201, envelope({
        employee: normalizeEmployee(db.prepare('SELECT * FROM Employees WHERE EmployeeId = ?').get(employeeId)),
        temporaryPassword: generated
      }, requestId));
    }

    if (
      req.method === 'PATCH' &&
      (params = matchPath(pathname, '/api/v1/admin/employees/:employeeId'))
    ) {
      const session = requireAdmin(db, req);
      const employee = db.prepare('SELECT * FROM Employees WHERE EmployeeId = ?').get(params.employeeId);
      if (!employee) throw new ApiError(404, 'EMPLOYEE_NOT_FOUND', 'Employee not found.');
      const body = await readJson(req);
      const profile = employeeProfileFromBody(body, employee);
      const active = body.active === undefined ? employee.Active : Number(Boolean(body.active));
      validateEmployeeProfile(profile);
      if (session.PrincipalId === employee.EmployeeId && !active) {
        throw new ApiError(422, 'CANNOT_DEACTIVATE_SELF', 'You cannot deactivate your own account.');
      }
      const matchingEmail = db.prepare('SELECT EmployeeId FROM Employees WHERE Email = ?')
        .get(profile.email);
      if (matchingEmail && matchingEmail.EmployeeId !== employee.EmployeeId) {
        throw new ApiError(409, 'EMAIL_IN_USE', 'That employee email is already registered.');
      }
      db.prepare(`
        UPDATE Employees
        SET DisplayName = ?, Email = ?, Sex = ?, BirthDate = ?, Phone = ?,
            Address = ?, Education = ?, Role = ?, Active = ?, Remark = ?
        WHERE EmployeeId = ?
      `).run(
        profile.displayName,
        profile.email,
        profile.sex,
        profile.birthDate,
        profile.phone,
        profile.address,
        profile.education,
        profile.role,
        active,
        profile.remark,
        employee.EmployeeId
      );
      if (!active) {
        db.prepare(`DELETE FROM Sessions WHERE PrincipalType = 'Employee' AND PrincipalId = ?`)
          .run(employee.EmployeeId);
      }
      audit(db, 'Employee', session.PrincipalId, 'EmployeeUpdated', 'Employee', employee.EmployeeId, {
        role: profile.role,
        active: Boolean(active)
      });
      return json(res, 200, envelope({
        employee: normalizeEmployee(db.prepare('SELECT * FROM Employees WHERE EmployeeId = ?').get(employee.EmployeeId))
      }, requestId));
    }

    if (
      req.method === 'DELETE' &&
      (params = matchPath(pathname, '/api/v1/admin/employees/:employeeId'))
    ) {
      const session = requireAdmin(db, req);
      if (session.PrincipalId === params.employeeId) {
        throw new ApiError(422, 'CANNOT_DEACTIVATE_SELF', 'You cannot remove your own account.');
      }
      const result = db.prepare('UPDATE Employees SET Active = 0 WHERE EmployeeId = ?')
        .run(params.employeeId);
      if (result.changes !== 1) throw new ApiError(404, 'EMPLOYEE_NOT_FOUND', 'Employee not found.');
      db.prepare(`DELETE FROM Sessions WHERE PrincipalType = 'Employee' AND PrincipalId = ?`)
        .run(params.employeeId);
      audit(db, 'Employee', session.PrincipalId, 'EmployeeDeactivated', 'Employee', params.employeeId);
      return json(res, 200, envelope({ removed: true }, requestId));
    }

    if (req.method === 'GET' && pathname === '/api/v1/admin/policies') {
      requireAdmin(db, req);
      const rows = db.prepare('SELECT * FROM PolicyDefinitions ORDER BY Title LIMIT 20').all();
      return json(res, 200, envelope({
        items: rows.map((row) => ({
          policyId: row.PolicyId,
          policyKey: row.PolicyKey,
          title: row.Title,
          description: row.Description,
          value: row.PolicyValue,
          active: Boolean(row.Active),
          version: row.Version,
          updateTime: row.UpdateTime
        }))
      }, requestId));
    }

    if (req.method === 'POST' && pathname === '/api/v1/admin/policies') {
      const session = requireAdmin(db, req);
      const body = await readJson(req);
      const key = String(body.policyKey || '').trim().toLowerCase().replace(/\s+/gu, '_');
      const title = String(body.title || '').trim();
      const description = String(body.description || '').trim();
      const value = String(body.value ?? '').trim();
      if (!/^[a-z][a-z0-9_]{2,60}$/u.test(key) || title.length < 3 || !value) {
        throw new ApiError(422, 'VALIDATION_FAILED', 'Enter a valid policy key, title, and value.');
      }
      const policyId = randomUUID();
      const timestamp = now();
      db.prepare(`
        INSERT INTO PolicyDefinitions (
          PolicyId, PolicyKey, Title, Description, PolicyValue,
          Active, Version, CreateTime, UpdateTime, UpdatedByEmployeeId
        ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
      `).run(
        policyId,
        key,
        title,
        description,
        value,
        body.active === false ? 0 : 1,
        timestamp,
        timestamp,
        session.PrincipalId
      );
      audit(db, 'Employee', session.PrincipalId, 'PolicyCreated', 'Policy', policyId, { key });
      return json(res, 201, envelope({ policyId }, requestId));
    }

    if (req.method === 'POST' && pathname === '/api/v1/admin/robot-customers') {
      const session = requireAdmin(db, req);
      const body = await readJson(req);
      const creationMode = String(body.creationMode || '');
      const displayName = String(body.displayName || '').trim();
      const age = Number(body.age);
      const sex = String(body.sex || '').trim();
      const countryCode = String(body.countryCode || '').trim().toUpperCase();
      const state = String(body.state || '').trim();
      const city = String(body.city || '').trim();
      const fields = {};
      if (!['AutoFill', 'FullProfile'].includes(creationMode)) {
        fields.creationMode = ['Choose auto-fill or full profile.'];
      }
      if (displayName.length < 2 || displayName.length > 100) {
        fields.displayName = ['Name must contain 2 to 100 characters.'];
      }
      if (!Number.isInteger(age) || age < 21 || age > 100) {
        fields.age = ['Robot age must be between 21 and 100.'];
      }
      if (!['Man', 'Woman', 'Nonbinary', 'NotSpecified'].includes(sex)) {
        fields.sex = ['Select a supported sex value.'];
      }
      if (!/^[A-Z]{2}$/u.test(countryCode)) fields.countryCode = ['Enter a two-letter country code.'];
      if (!state || state.length > 120) fields.state = ['Enter a state or province.'];
      if (!city || city.length > 120) fields.city = ['Enter a city.'];
      if (Object.keys(fields).length) {
        throw new ApiError(422, 'VALIDATION_FAILED', 'Please check the submitted fields.', fields);
      }

      const base = { displayName, age, sex, countryCode, state, city };
      const profile = creationMode === 'AutoFill'
        ? generatedRobotProfile(base)
        : {
            ...base,
            birthDate: birthDateForAge(age),
            lookingFor: String(body.lookingFor || '').trim(),
            maritalStatus: String(body.maritalStatus || '').trim(),
            workField: String(body.workField || '').trim(),
            englishLevel: String(body.englishLevel || '').trim(),
            languages: cleanStringArray(body.languages, 8),
            traits: cleanStringArray(body.traits, 3),
            interests: cleanStringArray(body.interests, 5),
            movies: cleanStringArray(body.movies, 3),
            music: cleanStringArray(body.music, 3),
            goals: cleanStringArray(body.goals, 3),
            preferredAgeMin: Number(body.preferredAgeMin),
            preferredAgeMax: Number(body.preferredAgeMax),
            personalityType: String(body.personalityType || '').trim(),
            bio: String(body.bio || '').trim(),
            story: String(body.story || '').trim(),
            profilePhoto: String(body.profilePhoto || defaultProfilePhoto(sex)).trim(),
            publicPhotos: cleanStringArray(body.publicPhotos, 3),
            privatePhotos: cleanStringArray(body.privatePhotos, 3)
          };

      if (creationMode === 'FullProfile') {
        if (!profile.publicPhotos.length) profile.publicPhotos = [profile.profilePhoto];
        const requiredText = [
          'lookingFor',
          'maritalStatus',
          'workField',
          'englishLevel',
          'personalityType',
          'bio',
          'story'
        ];
        for (const key of requiredText) {
          if (!profile[key]) fields[key] = ['This profile field is required in full-profile mode.'];
        }
        for (const key of ['languages', 'traits', 'interests', 'movies', 'music', 'goals']) {
          if (!profile[key].length) fields[key] = ['Add at least one value.'];
        }
        if (
          !Number.isInteger(profile.preferredAgeMin) ||
          !Number.isInteger(profile.preferredAgeMax) ||
          profile.preferredAgeMin < 18 ||
          profile.preferredAgeMax < profile.preferredAgeMin ||
          profile.preferredAgeMax > 120
        ) {
          fields.preferredAge = ['Enter a valid preferred age range.'];
        }
        if (profile.bio.length > 4000) fields.bio = ['Biography must not exceed 4,000 characters.'];
        if (profile.story.length > 4000) fields.story = ['Story must not exceed 4,000 characters.'];
        if (!validProfilePhoto(profile.profilePhoto)) {
          fields.profilePhoto = ['Use an approved profile asset or JPG/PNG image.'];
        }
        if (![...profile.publicPhotos, ...profile.privatePhotos].every(validProfilePhoto)) {
          fields.photos = ['Every public and private photo must use an approved JPG or PNG asset.'];
        }
        if (Object.keys(fields).length) {
          throw new ApiError(422, 'VALIDATION_FAILED', 'Complete every required robot profile field.', fields);
        }
      }

      const customerId = randomUUID();
      const provenanceId = randomUUID();
      const timestamp = now();
      const internalEmail = `robot-${displayName.toLowerCase()
        .replace(/[^a-z0-9]+/gu, '-')
        .replace(/^-|-$/gu, '')
        .slice(0, 40) || 'profile'}-${customerId.slice(0, 8)}@virtual.datingeasy.test`;
      const autoFilledFields = creationMode === 'AutoFill'
        ? [
            'birthDate', 'lookingFor', 'maritalStatus', 'workField',
            'englishLevel', 'languages', 'traits', 'interests', 'movies',
            'music', 'goals', 'preferredAgeMin', 'preferredAgeMax',
            'personalityType', 'bio', 'story', 'profilePhoto',
            'publicPhotos', 'privatePhotos'
          ]
        : ['birthDate'];
      const completeness = profileCompleteness(profile);
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare(`
          INSERT INTO CustomerProfile (
            CustomerId, Email, EmailNormalized, Phone, PasswordHash, DisplayName,
            BirthDate, Sex, GenderLookingFor, CountryCode, StateId, CityName,
            MaritalStatus, WorkField, EnglishLevel, LanguagesJson, TraitsJson,
            InterestsJson, MoviePreferencesJson, MusicPreferencesJson, GoalsJson,
            PreferredAgeMin, PreferredAgeMax, PersonalityType, Story, Bio,
            ProfilePhoto, PublicPhotosJson, PrivatePhotosJson, ProfileCompleted,
            ProfileCompleteness, CreateTime, UpdateTime, Active, Seed,
            CreditsRemain, TotalCharged, Remark
          ) VALUES (
            ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, 0, 2, 0, 0, ?
          )
        `).run(
          customerId,
          internalEmail,
          internalEmail,
          hashPassword(randomUUID()),
          profile.displayName,
          profile.birthDate,
          profile.sex,
          profile.lookingFor,
          profile.countryCode,
          profile.state,
          profile.city,
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
          profile.bio,
          profile.profilePhoto,
          JSON.stringify(profile.publicPhotos),
          JSON.stringify(profile.privatePhotos),
          completeness,
          timestamp,
          timestamp,
          `Admin-created robot draft (${creationMode})`
        );
        db.prepare(`
          INSERT INTO SeedProfileProvenance (
            SeedProfileProvenanceId, CustomerId, CreationSource,
            CreatedByEmployeeId, AutoFilledFieldsJson, GenerationBatchId, AssetSourceType,
            CharacterSpecVersion, TextModelVersion, ImageModelVersion,
            PromptPolicyVersion, OriginalityCheckStatus,
            AdultAppearanceCheckStatus, HumanReviewStatus, GeneratedTime, Remark
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 'Pending', 'Pending', ?, ?)
        `).run(
          provenanceId,
          customerId,
          creationMode === 'AutoFill' ? 'AdminAssisted' : 'AdminFull',
          session.PrincipalId,
          JSON.stringify(autoFilledFields),
          randomUUID(),
          creationMode === 'AutoFill' ? 'SystemGenerated' : 'AdminProvided',
          'robot-profile-v1',
          creationMode === 'AutoFill' ? 'PrototypeRulesV1' : null,
          creationMode === 'AutoFill' ? 'DefaultIllustrationV1' : null,
          'robot-profile-policy-v1',
          timestamp,
          'Inactive until originality, adult-appearance, and human review pass.'
        );
        audit(db, 'Employee', session.PrincipalId, 'RobotCustomerCreated', 'Customer', customerId, {
          creationMode,
          autoFilledFields,
          active: false,
          reviewStatus: 'Pending'
        });
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
      return json(res, 201, envelope({
        customerId,
        displayName: profile.displayName,
        creationMode,
        autoFilledFields,
        profileCompleteness: completeness,
        active: false,
        reviewStatus: 'Pending'
      }, requestId));
    }

    if (
      req.method === 'PATCH' &&
      (params = matchPath(pathname, '/api/v1/admin/robot-customers/:customerId'))
    ) {
      const session = requireAdmin(db, req);
      const body = await readJson(req);
      const robot = db.prepare(`
        SELECT * FROM CustomerProfile WHERE CustomerId = ? AND Seed = 2
      `).get(params.customerId);
      if (!robot) throw new ApiError(404, 'ROBOT_CUSTOMER_NOT_FOUND', 'Robot customer not found.');

      const profileKeys = [
        'displayName', 'age', 'sex', 'countryCode', 'state', 'city',
        'lookingFor', 'maritalStatus', 'workField', 'englishLevel',
        'languages', 'traits', 'interests', 'movies', 'music', 'goals',
        'preferredAgeMin', 'preferredAgeMax', 'personalityType', 'bio',
        'story', 'profilePhoto', 'publicPhotos', 'privatePhotos'
      ];
      const profileChanged = profileKeys.some((key) => Object.prototype.hasOwnProperty.call(body, key));
      const active = body.active === undefined ? Number(robot.Active) : Number(Boolean(body.active));
      const timestamp = now();
      let displayName = robot.DisplayName;

      db.exec('BEGIN IMMEDIATE');
      try {
        if (profileChanged) {
          const age = body.age === undefined ? ageFromBirthDate(robot.BirthDate) : Number(body.age);
          const profile = {
            displayName: String(body.displayName ?? robot.DisplayName).trim(),
            birthDate: birthDateForAge(age),
            sex: String(body.sex ?? robot.Sex).trim(),
            lookingFor: String(body.lookingFor ?? robot.GenderLookingFor).trim(),
            countryCode: String(body.countryCode ?? robot.CountryCode).trim().toUpperCase(),
            state: String(body.state ?? robot.StateId).trim(),
            city: String(body.city ?? robot.CityName).trim(),
            maritalStatus: String(body.maritalStatus ?? robot.MaritalStatus).trim(),
            workField: String(body.workField ?? robot.WorkField).trim(),
            englishLevel: String(body.englishLevel ?? robot.EnglishLevel).trim(),
            languages: body.languages === undefined ? parseJsonArray(robot.LanguagesJson) : cleanStringArray(body.languages, 8),
            traits: body.traits === undefined ? parseJsonArray(robot.TraitsJson) : cleanStringArray(body.traits, 3),
            interests: body.interests === undefined ? parseJsonArray(robot.InterestsJson) : cleanStringArray(body.interests, 5),
            movies: body.movies === undefined ? parseJsonArray(robot.MoviePreferencesJson) : cleanStringArray(body.movies, 3),
            music: body.music === undefined ? parseJsonArray(robot.MusicPreferencesJson) : cleanStringArray(body.music, 3),
            goals: body.goals === undefined ? parseJsonArray(robot.GoalsJson) : cleanStringArray(body.goals, 3),
            preferredAgeMin: body.preferredAgeMin === undefined ? robot.PreferredAgeMin : Number(body.preferredAgeMin),
            preferredAgeMax: body.preferredAgeMax === undefined ? robot.PreferredAgeMax : Number(body.preferredAgeMax),
            personalityType: String(body.personalityType ?? robot.PersonalityType).trim(),
            bio: String(body.bio ?? robot.Bio).trim(),
            story: String(body.story ?? robot.Story).trim(),
            profilePhoto: String(body.profilePhoto ?? robot.ProfilePhoto).trim(),
            publicPhotos: body.publicPhotos === undefined ? parseJsonArray(robot.PublicPhotosJson) : cleanStringArray(body.publicPhotos, 3),
            privatePhotos: body.privatePhotos === undefined ? parseJsonArray(robot.PrivatePhotosJson) : cleanStringArray(body.privatePhotos, 3)
          };
          if (!profile.publicPhotos.length) profile.publicPhotos = [profile.profilePhoto];

          const fields = {};
          if (profile.displayName.length < 2 || profile.displayName.length > 100) {
            fields.displayName = ['Name must contain 2 to 100 characters.'];
          }
          if (!Number.isInteger(age) || age < 21 || age > 100) {
            fields.age = ['Robot age must be between 21 and 100.'];
          }
          if (!['Man', 'Woman', 'Nonbinary', 'NotSpecified'].includes(profile.sex)) {
            fields.sex = ['Select a supported sex value.'];
          }
          if (!/^[A-Z]{2}$/u.test(profile.countryCode)) fields.countryCode = ['Enter a two-letter country code.'];
          if (!profile.state || profile.state.length > 120) fields.state = ['Enter a state or province.'];
          if (!profile.city || profile.city.length > 120) fields.city = ['Enter a city.'];
          for (const key of ['lookingFor', 'maritalStatus', 'workField', 'englishLevel', 'personalityType', 'bio', 'story']) {
            if (!profile[key]) fields[key] = ['This profile field is required.'];
          }
          for (const key of ['languages', 'traits', 'interests', 'movies', 'music', 'goals']) {
            if (!profile[key].length) fields[key] = ['Add at least one value.'];
          }
          if (
            !Number.isInteger(profile.preferredAgeMin) ||
            !Number.isInteger(profile.preferredAgeMax) ||
            profile.preferredAgeMin < 18 ||
            profile.preferredAgeMax < profile.preferredAgeMin ||
            profile.preferredAgeMax > 120
          ) {
            fields.preferredAge = ['Enter a valid preferred age range.'];
          }
          if (profile.bio.length > 4000) fields.bio = ['Biography must not exceed 4,000 characters.'];
          if (profile.story.length > 4000) fields.story = ['Story must not exceed 4,000 characters.'];
          if (!validProfilePhoto(profile.profilePhoto)) {
            fields.profilePhoto = ['Use an approved profile asset or JPG/PNG image.'];
          }
          if (![...profile.publicPhotos, ...profile.privatePhotos].every(validProfilePhoto)) {
            fields.photos = ['Every public and private photo must use an approved JPG or PNG asset.'];
          }
          if (Object.keys(fields).length) {
            throw new ApiError(422, 'VALIDATION_FAILED', 'Complete every required robot profile field.', fields);
          }

          const completeness = profileCompleteness(profile);
          db.prepare(`
            UPDATE CustomerProfile
            SET DisplayName = ?, BirthDate = ?, Sex = ?, GenderLookingFor = ?,
                CountryCode = ?, StateId = ?, CityName = ?, MaritalStatus = ?,
                WorkField = ?, EnglishLevel = ?, LanguagesJson = ?, TraitsJson = ?,
                InterestsJson = ?, MoviePreferencesJson = ?, MusicPreferencesJson = ?,
                GoalsJson = ?, PreferredAgeMin = ?, PreferredAgeMax = ?,
                PersonalityType = ?, Story = ?, Bio = ?, ProfilePhoto = ?,
                PublicPhotosJson = ?, PrivatePhotosJson = ?,
                ProfileCompleted = 1, ProfileCompleteness = ?, UpdateTime = ?
            WHERE CustomerId = ?
          `).run(
            profile.displayName,
            profile.birthDate,
            profile.sex,
            profile.lookingFor,
            profile.countryCode,
            profile.state,
            profile.city,
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
            profile.bio,
            profile.profilePhoto,
            JSON.stringify(profile.publicPhotos),
            JSON.stringify(profile.privatePhotos),
            completeness,
            timestamp,
            robot.CustomerId
          );
          displayName = profile.displayName;
        }

        db.prepare(`
          UPDATE CustomerProfile SET Active = ?, UpdateTime = ? WHERE CustomerId = ?
        `).run(active, timestamp, robot.CustomerId);

        if (active) {
          db.prepare(`
            UPDATE SeedProfileProvenance
            SET HumanReviewStatus = 'Approved',
                OriginalityCheckStatus = CASE WHEN OriginalityCheckStatus = 'Pending' THEN 'Passed' ELSE OriginalityCheckStatus END,
                AdultAppearanceCheckStatus = CASE WHEN AdultAppearanceCheckStatus = 'Pending' THEN 'Passed' ELSE AdultAppearanceCheckStatus END
            WHERE CustomerId = ?
          `).run(robot.CustomerId);
        } else {
          db.prepare(`
            UPDATE RobotShiftSchedule
            SET ShiftStatus = 'Failed', FailureCode = 'ADMIN_DEACTIVATED',
                ActualEndTime = COALESCE(ActualEndTime, ?), UpdateTime = ?
            WHERE RobotCustomerId = ? AND ShiftStatus = 'Active'
          `).run(timestamp, timestamp, robot.CustomerId);
          db.prepare(`
            UPDATE RobotDailyActivity
            SET Active = 0, LastOfflineTime = COALESCE(LastOfflineTime, ?), UpdateTime = ?
            WHERE RobotCustomerId = ? AND Active = 1
          `).run(timestamp, timestamp, robot.CustomerId);
        }

        audit(
          db,
          'Employee',
          session.PrincipalId,
          profileChanged ? 'RobotCustomerProfileUpdated' : active ? 'RobotCustomerActivated' : 'RobotCustomerDeactivated',
          'Customer',
          robot.CustomerId,
          { active: Boolean(active), profileChanged }
        );
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }

      return json(res, 200, envelope({
        customerId: robot.CustomerId,
        displayName,
        active: Boolean(active),
        updated: true
      }, requestId));
    }

    if (
      req.method === 'PATCH' &&
      (params = matchPath(pathname, '/api/v1/admin/policies/:policyId'))
    ) {
      const session = requireAdmin(db, req);
      const policy = db.prepare('SELECT * FROM PolicyDefinitions WHERE PolicyId = ?').get(params.policyId);
      if (!policy) throw new ApiError(404, 'POLICY_NOT_FOUND', 'Policy not found.');
      const body = await readJson(req);
      const title = String(body.title ?? policy.Title).trim();
      const description = String(body.description ?? policy.Description).trim();
      const value = String(body.value ?? policy.PolicyValue).trim();
      const active = body.active === undefined ? policy.Active : Number(Boolean(body.active));
      if (title.length < 3 || !value) {
        throw new ApiError(422, 'VALIDATION_FAILED', 'Policy title and value are required.');
      }
      db.prepare(`
        UPDATE PolicyDefinitions
        SET Title = ?, Description = ?, PolicyValue = ?, Active = ?,
            Version = Version + 1, UpdateTime = ?, UpdatedByEmployeeId = ?
        WHERE PolicyId = ?
      `).run(title, description, value, active, now(), session.PrincipalId, policy.PolicyId);
      audit(db, 'Employee', session.PrincipalId, active ? 'PolicyEnabledOrUpdated' : 'PolicyDisabled', 'Policy', policy.PolicyId);
      return json(res, 200, envelope({ updated: true, version: policy.Version + 1 }, requestId));
    }

    if (req.method === 'GET' && pathname === '/api/v1/admin/robot-operations') {
      requireAdmin(db, req);
      const timestamp = new Date();
      const coverage = reconcileRobotOperations(db, timestamp);
      const current = timestamp.toISOString();
      const robotFilters = [];
      const robotFilterValues = [];
      const countryCodeFilter = String(searchParams.get('countryCode') || '').trim().toUpperCase();
      const stateFilter = String(searchParams.get('state') || '').trim();
      const cityFilter = String(searchParams.get('city') || '').trim();
      const activeFilter = String(searchParams.get('active') || '').trim().toLowerCase();
      if (countryCodeFilter) {
        robotFilters.push('p.CountryCode = ?');
        robotFilterValues.push(countryCodeFilter);
      }
      if (stateFilter) {
        robotFilters.push('p.StateId = ?');
        robotFilterValues.push(stateFilter);
      }
      if (cityFilter) {
        robotFilters.push('p.CityName = ?');
        robotFilterValues.push(cityFilter);
      }
      const robotWhere = robotFilters.length ? `AND ${robotFilters.join(' AND ')}` : '';
      const robotOnlineWhere = activeFilter === 'true'
        ? 'AND p.Active = 1 AND s.RobotShiftScheduleId IS NOT NULL'
        : activeFilter === 'false'
          ? 'AND (p.Active <> 1 OR s.RobotShiftScheduleId IS NULL)'
          : '';
      const robots = db.prepare(`
        SELECT p.CustomerId, p.DisplayName, p.BirthDate, p.Sex,
          p.GenderLookingFor, p.CountryCode, p.StateId, p.CityName,
          p.MaritalStatus, p.WorkField, p.EnglishLevel, p.LanguagesJson,
          p.TraitsJson, p.InterestsJson, p.MoviePreferencesJson,
          p.MusicPreferencesJson, p.GoalsJson, p.PreferredAgeMin,
          p.PreferredAgeMax, p.PersonalityType, p.Story, p.Bio,
          p.ProfilePhoto, p.PublicPhotosJson, p.PrivatePhotosJson, p.Active,
          s.RobotShiftScheduleId, s.PlannedStartTime, s.PlannedEndTime,
          s.ShiftStatus, s.IsReserve, provenance.CreationSource,
          provenance.HumanReviewStatus, provenance.AutoFilledFieldsJson
        FROM CustomerProfile p
        LEFT JOIN SeedProfileProvenance provenance
          ON provenance.CustomerId = p.CustomerId
        LEFT JOIN RobotShiftSchedule s
          ON s.RobotCustomerId = p.CustomerId
          AND s.ShiftStatus = 'Active'
          AND s.PlannedStartTime <= ? AND s.PlannedEndTime > ?
        WHERE p.Seed = 2
          ${robotWhere}
          ${robotOnlineWhere}
        ORDER BY p.Sex, p.DisplayName
      `).all(current, current, ...robotFilterValues);
      const shifts = db.prepare(`
        SELECT s.*, p.DisplayName
        FROM RobotShiftSchedule s
        JOIN CustomerProfile p ON p.CustomerId = s.RobotCustomerId
        WHERE s.RobotCityCoverageId = ?
          AND s.PlannedEndTime > ?
        ORDER BY s.PlannedStartTime, s.SexSnapshot, p.DisplayName
        LIMIT 20
      `).all(coverage.RobotCityCoverageId, current);
      const usageFor = (prefix) => db.prepare(`
        SELECT COUNT(*) AS requests,
          COALESCE(SUM(InputTokens), 0) AS inputTokens,
          COALESCE(SUM(OutputTokens), 0) AS outputTokens,
          COALESCE(SUM(EstimatedCost), 0) AS estimatedCost
        FROM RobotAIUsage
        WHERE UsageStatus = 'Accepted' AND substr(CreateTime, 1, ?) = ?
      `).get(prefix.length, prefix);
      const day = current.slice(0, 10);
      const month = current.slice(0, 7);
      return json(res, 200, envelope({
        checkedAt: current,
        coverage: {
          robotCityCoverageId: coverage.RobotCityCoverageId,
          countryCode: coverage.CountryCode,
          state: coverage.StateId,
          city: coverage.CityName,
          timeZone: coverage.TimeZoneId,
          status: coverage.CoverageStatus,
          minimumMen: coverage.MinimumManProfiles,
          minimumWomen: coverage.MinimumWomanProfiles,
          requiredOnlineMen: coverage.RequiredOnlineMan,
          requiredOnlineWomen: coverage.RequiredOnlineWoman
        },
        robots: robots.map((robot) => ({
          customerId: robot.CustomerId,
          displayName: robot.DisplayName,
          birthDate: robot.BirthDate,
          sex: robot.Sex,
          lookingFor: robot.GenderLookingFor,
          countryCode: robot.CountryCode,
          state: robot.StateId,
          city: robot.CityName,
          maritalStatus: robot.MaritalStatus,
          workField: robot.WorkField,
          englishLevel: robot.EnglishLevel,
          languages: parseJsonArray(robot.LanguagesJson),
          traits: parseJsonArray(robot.TraitsJson),
          interests: parseJsonArray(robot.InterestsJson),
          movies: parseJsonArray(robot.MoviePreferencesJson),
          music: parseJsonArray(robot.MusicPreferencesJson),
          goals: parseJsonArray(robot.GoalsJson),
          preferredAgeMin: robot.PreferredAgeMin,
          preferredAgeMax: robot.PreferredAgeMax,
          personalityType: robot.PersonalityType,
          story: robot.Story,
          bio: robot.Bio,
          profilePhoto: robot.ProfilePhoto,
          publicPhotos: parseJsonArray(robot.PublicPhotosJson),
          privatePhotos: parseJsonArray(robot.PrivatePhotosJson),
          active: Boolean(robot.Active),
          online: Boolean(robot.Active) && robot.ShiftStatus === 'Active',
          shiftId: robot.RobotShiftScheduleId,
          shiftStart: robot.PlannedStartTime,
          shiftEnd: robot.PlannedEndTime,
          reserve: Boolean(robot.IsReserve),
          creationSource: robot.CreationSource || 'SystemAutomatic',
          reviewStatus: robot.HumanReviewStatus || 'Approved',
          autoFilledFields: parseJsonArray(robot.AutoFilledFieldsJson)
        })),
        shifts: shifts.map((shift) => ({
          shiftId: shift.RobotShiftScheduleId,
          robotCustomerId: shift.RobotCustomerId,
          displayName: shift.DisplayName,
          sex: shift.SexSnapshot,
          businessDate: shift.BusinessDate,
          startTime: shift.PlannedStartTime,
          endTime: shift.PlannedEndTime,
          status: shift.ShiftStatus,
          reserve: Boolean(shift.IsReserve)
        })),
        ai: {
          mode: getPolicy(db, 'robot_ai_mode', 'LocalOnly').value,
          provider: 'OpenAI',
          model: EXTERNAL_MODEL,
          providerStatus: 'Simulated',
          dailyBudget: Number(getPolicy(db, 'robot_ai_daily_budget_usd', '25').value),
          monthlyBudget: Number(getPolicy(db, 'robot_ai_monthly_budget_usd', '500').value),
          today: usageFor(day),
          month: usageFor(month)
        }
      }, requestId));
    }

    if (req.method === 'PUT' && pathname === '/api/v1/admin/robot-ai-policy') {
      const session = requireAdmin(db, req);
      const body = await readJson(req);
      const mode = String(body.mode || '');
      const dailyBudget = Number(body.dailyBudget);
      const monthlyBudget = Number(body.monthlyBudget);
      if (!['LocalOnly', 'HybridExternalAllowed'].includes(mode)) {
        throw new ApiError(422, 'ROBOT_AI_MODE_INVALID', 'Choose LocalOnly or HybridExternalAllowed.');
      }
      if (
        !Number.isFinite(dailyBudget) || dailyBudget < 0 ||
        !Number.isFinite(monthlyBudget) || monthlyBudget < dailyBudget
      ) {
        throw new ApiError(
          422,
          'ROBOT_AI_BUDGET_INVALID',
          'Budgets must be non-negative and the monthly budget must cover the daily budget.'
        );
      }
      const timestamp = now();
      const updatePolicy = db.prepare(`
        UPDATE PolicyDefinitions
        SET PolicyValue = ?, Active = 1, Version = Version + 1,
          UpdateTime = ?, UpdatedByEmployeeId = ?
        WHERE PolicyKey = ?
      `);
      db.exec('BEGIN IMMEDIATE');
      try {
        updatePolicy.run(mode, timestamp, session.PrincipalId, 'robot_ai_mode');
        updatePolicy.run(String(dailyBudget), timestamp, session.PrincipalId, 'robot_ai_daily_budget_usd');
        updatePolicy.run(String(monthlyBudget), timestamp, session.PrincipalId, 'robot_ai_monthly_budget_usd');
        audit(db, 'Employee', session.PrincipalId, 'RobotAIPolicyUpdated', 'Policy', null, {
          mode,
          dailyBudget,
          monthlyBudget
        });
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
      return json(res, 200, envelope({ mode, dailyBudget, monthlyBudget }, requestId));
    }

    if (
      req.method === 'POST' &&
      (params = matchPath(pathname, '/api/v1/admin/robot-city-coverage/:coverageId/shifts/regenerate'))
    ) {
      const session = requireAdmin(db, req);
      const body = await readJson(req);
      const coverage = db.prepare(`
        SELECT * FROM RobotCityCoverage WHERE RobotCityCoverageId = ?
      `).get(params.coverageId);
      if (!coverage) {
        throw new ApiError(404, 'ROBOT_COVERAGE_NOT_FOUND', 'Robot city coverage was not found.');
      }
      const businessDate = String(body.businessDate || '').trim();
      if (!/^\d{4}-\d{2}-\d{2}$/u.test(businessDate)) {
        throw new ApiError(422, 'BUSINESS_DATE_REQUIRED', 'Provide a business date in YYYY-MM-DD format.');
      }
      const active = db.prepare(`
        SELECT COUNT(*) AS value FROM RobotShiftSchedule
        WHERE RobotCityCoverageId = ? AND BusinessDate = ?
          AND ShiftStatus IN ('Active', 'Completed', 'Replaced')
      `).get(coverage.RobotCityCoverageId, businessDate).value;
      if (active) {
        throw new ApiError(
          409,
          'ROBOT_SHIFT_DAY_STARTED',
          'A started shift day cannot be regenerated.'
        );
      }
      db.prepare(`
        DELETE FROM RobotShiftSchedule
        WHERE RobotCityCoverageId = ? AND BusinessDate = ?
      `).run(coverage.RobotCityCoverageId, businessDate);
      planDailyShifts(db, coverage, businessDate, new Date());
      const count = db.prepare(`
        SELECT COUNT(*) AS value FROM RobotShiftSchedule
        WHERE RobotCityCoverageId = ? AND BusinessDate = ?
      `).get(coverage.RobotCityCoverageId, businessDate).value;
      audit(db, 'Employee', session.PrincipalId, 'RobotShiftsRegenerated', 'RobotCityCoverage', coverage.RobotCityCoverageId, {
        businessDate,
        shiftCount: count
      });
      return json(res, 200, envelope({ businessDate, shiftCount: count }, requestId));
    }

    if (req.method === 'GET' && pathname === '/api/v1/admin/health') {
      requireAdmin(db, req);
      const coverage = reconcileRobotOperations(db);
      const databaseCheck = db.prepare('SELECT 1 AS ok').get().ok === 1;
      return json(res, 200, envelope({
        checkedAt: now(),
        services: [
          { name: 'API', status: 'Healthy', detail: `Uptime ${Math.floor(process.uptime())} seconds` },
          { name: 'Database', status: databaseCheck ? 'Healthy' : 'Unavailable', detail: 'SQLite prototype connection' },
          { name: 'Payment provider', status: 'Simulated', detail: 'No real cards are charged' },
          { name: 'Notification provider', status: 'Simulated', detail: 'Email and SMS delivery are logged' },
          {
            name: 'Robot service',
            status: coverage.CoverageStatus === 'CoverageDegraded' ? 'Degraded' : 'Healthy',
            detail: `${coverage.CityName} background engine · ${getPolicy(db, 'robot_ai_mode', 'LocalOnly').value}`
          }
        ]
      }, requestId));
    }

    if (req.method === 'GET' && pathname === '/api/v1/admin/dashboard') {
      requireAdmin(db, req);
      const timestamp = now();
      const robotCoverage = reconcileRobotOperations(db, new Date(timestamp));
      const businessDate = timestamp.slice(0, 10);
      const customerCutoff = new Date(Date.now() - CUSTOMER_IDLE_MS).toISOString();
      const metrics = {
        realCustomers: {
          total: db.prepare('SELECT COUNT(*) AS value FROM CustomerProfile WHERE Seed = 0 AND Active = 1').get().value,
          online: db.prepare(`
            SELECT COUNT(DISTINCT s.PrincipalId) AS value
            FROM Sessions s
            JOIN CustomerProfile c ON c.CustomerId = s.PrincipalId
            WHERE s.PrincipalType = 'Customer' AND c.Seed = 0 AND c.Active = 1
              AND s.ExpireTime > ? AND s.LastActivityTime > ?
          `).get(timestamp, customerCutoff).value
        },
        seedCustomers: {
          total: db.prepare('SELECT COUNT(*) AS value FROM CustomerProfile WHERE Seed = 1 AND Active = 1').get().value,
          online: db.prepare(`
            SELECT COUNT(DISTINCT es.CustomerId) AS value
            FROM EmployeeSeed es
            JOIN CustomerProfile c ON c.CustomerId = es.CustomerId
            WHERE es.Active = 1 AND c.Active = 1 AND c.Seed = 1
              AND (es.ActiveEndTime IS NULL OR es.ActiveEndTime > ?)
          `).get(timestamp).value
        },
        robotCustomers: {
          total: db.prepare('SELECT COUNT(*) AS value FROM CustomerProfile WHERE Seed = 2 AND Active = 1').get().value,
          online: db.prepare(`
            SELECT COUNT(DISTINCT RobotCustomerId) AS value
            FROM RobotShiftSchedule
            WHERE ShiftStatus = 'Active'
              AND PlannedStartTime <= ? AND PlannedEndTime > ?
          `).get(timestamp, timestamp).value
        },
        messagesToday: db.prepare(`
          SELECT COUNT(*) AS value FROM ChatRecords WHERE substr(ChatTime, 1, 10) = ?
        `).get(businessDate).value,
        creditsConsumedToday: db.prepare(`
          SELECT COALESCE(SUM(-CreditsChange), 0) AS value
          FROM CreditLedger
          WHERE CreditsChange < 0 AND substr(TransactionTime, 1, 10) = ?
        `).get(businessDate).value,
        revenueToday: db.prepare(`
          SELECT COALESCE(SUM(Amount), 0) AS value FROM ChargeRecord
          WHERE substr(ChargeTime, 1, 10) = ?
            AND Status IN ('Succeeded', 'PrototypeSimulated')
        `).get(businessDate).value
      };
      const operations = {
        pendingPasswordResets: db.prepare(`
          SELECT COUNT(*) AS value FROM PasswordResetRequests WHERE Status = 'Pending'
        `).get().value,
        pendingOutgoingPayments: db.prepare(`
          SELECT COUNT(*) AS value FROM OutgoingPaymentRequests WHERE Status = 'Pending'
        `).get().value,
        activeEmployees: db.prepare(`
          SELECT COUNT(*) AS value FROM Employees WHERE Active = 1
        `).get().value,
        openConversations: db.prepare('SELECT COUNT(*) AS value FROM Conversations').get().value,
        waitingSeedConversations: db.prepare(`
          SELECT COUNT(*) AS value
          FROM Conversations c
          JOIN CustomerProfile a ON a.CustomerId = c.CustomerAId
          JOIN CustomerProfile b ON b.CustomerId = c.CustomerBId
          WHERE (a.Seed = 1 OR b.Seed = 1)
            AND (
              SELECT m.SenderId FROM ChatRecords m
              WHERE m.ConversationId = c.ConversationId
              ORDER BY m.ChatTime DESC LIMIT 1
            ) = CASE WHEN a.Seed = 0 THEN a.CustomerId ELSE b.CustomerId END
        `).get().value
      };
      const auditRows = db.prepare(`
        SELECT * FROM AuditLog ORDER BY CreateTime DESC LIMIT 20
      `).all();
      return json(res, 200, envelope({
        metrics,
        operations,
        businessDate,
        system: {
          api: 'Healthy',
          database: 'Healthy',
          paymentProvider: 'Prototype simulation',
          notificationProvider: 'Prototype simulation',
          robotCoverage: robotCoverage.CoverageStatus,
          robotAIMode: getPolicy(db, 'robot_ai_mode', 'LocalOnly').value,
          policyVersion: db.prepare('SELECT MAX(Version) AS value FROM PolicyDefinitions').get().value || 1
        },
        recentAudit: auditRows.map((row) => ({
          action: row.Action,
          actorType: row.ActorType,
          targetType: row.TargetType,
          createTime: row.CreateTime
        }))
      }, requestId));
    }

    if (req.method === 'GET' && pathname === '/api/v1/ceo/dashboard') {
      const session = requireCEO(db, req);
      const timestamp = now();
      const robotCoverage = reconcileRobotOperations(db, new Date(timestamp));
      const year = timestamp.slice(0, 4);
      const month = timestamp.slice(0, 7);
      const day = timestamp.slice(0, 10);
      const employeeCutoff = new Date(Date.now() - EMPLOYEE_IDLE_MS).toISOString();
      const revenueFor = (prefix) => db.prepare(`
        SELECT COALESCE(SUM(Amount), 0) AS value
        FROM ChargeRecord
        WHERE substr(ChargeTime, 1, ?) = ?
          AND Status IN ('Succeeded', 'PrototypeSimulated')
      `).get(prefix.length, prefix).value;
      const expenseFor = (prefix) => db.prepare(`
        SELECT COALESCE(SUM(Amount), 0) AS value
        FROM OutgoingPaymentRequests
        WHERE Status = 'Approved'
          AND substr(DecisionTime, 1, ?) = ?
      `).get(prefix.length, prefix).value;
      const paymentRows = db.prepare(`
        SELECT p.*, e.DisplayName AS RequestedByName
        FROM OutgoingPaymentRequests p
        JOIN Employees e ON e.EmployeeId = p.RequestedByEmployeeId
        WHERE p.Status = 'Pending'
        ORDER BY p.RequestTime ASC
        LIMIT 20
      `).all();
      const databaseCheck = db.prepare('SELECT 1 AS ok').get().ok === 1;
      return json(res, 200, envelope({
        ceo: {
          employeeId: session.PrincipalId,
          role: session.Role
        },
        finance: {
          revenue: {
            year: revenueFor(year),
            month: revenueFor(month),
            day: revenueFor(day)
          },
          expense: {
            year: expenseFor(year),
            month: expenseFor(month),
            day: expenseFor(day)
          },
          currencyCode: 'USD',
          asOf: timestamp
        },
        online: {
          realCustomers: db.prepare(`
            SELECT COUNT(DISTINCT s.PrincipalId) AS value
            FROM Sessions s
            JOIN CustomerProfile c ON c.CustomerId = s.PrincipalId
            WHERE s.PrincipalType = 'Customer' AND c.Seed = 0 AND c.Active = 1
              AND s.ExpireTime > ?
              AND s.LastActivityTime > ?
          `).get(timestamp, new Date(Date.now() - CUSTOMER_IDLE_MS).toISOString()).value,
          employees: db.prepare(`
            SELECT COUNT(DISTINCT s.PrincipalId) AS value
            FROM Sessions s
            JOIN Employees e ON e.EmployeeId = s.PrincipalId
            WHERE s.PrincipalType = 'Employee' AND e.Active = 1
              AND s.ExpireTime > ?
              AND s.LastActivityTime > ?
          `).get(timestamp, employeeCutoff).value,
          seedCustomers: db.prepare(`
            SELECT COUNT(DISTINCT es.CustomerId) AS value
            FROM EmployeeSeed es
            JOIN CustomerProfile c ON c.CustomerId = es.CustomerId
            WHERE es.Active = 1 AND c.Active = 1 AND c.Seed = 1
              AND (es.ActiveEndTime IS NULL OR es.ActiveEndTime > ?)
          `).get(timestamp).value,
          robotCustomers: db.prepare(`
            SELECT COUNT(DISTINCT RobotCustomerId) AS value
            FROM RobotShiftSchedule
            WHERE ShiftStatus = 'Active'
              AND PlannedStartTime <= ? AND PlannedEndTime > ?
          `).get(timestamp, timestamp).value
        },
        health: {
          checkedAt: timestamp,
          services: [
            { name: 'API', status: 'Healthy', detail: `Uptime ${Math.floor(process.uptime())} seconds` },
            { name: 'Database', status: databaseCheck ? 'Healthy' : 'Unavailable', detail: 'SQLite prototype connection' },
            { name: 'Payment provider', status: 'Simulated', detail: 'No real cards or outgoing payments are processed' },
            { name: 'Notification provider', status: 'Simulated', detail: 'Email and SMS delivery are logged' },
            {
              name: 'Robot service',
              status: robotCoverage.CoverageStatus === 'CoverageDegraded' ? 'Degraded' : 'Healthy',
              detail: `${robotCoverage.CityName} background engine · ${getPolicy(db, 'robot_ai_mode', 'LocalOnly').value}`
            }
          ]
        },
        approvals: paymentRows.map(normalizeOutgoingPayment)
      }, requestId));
    }

    if (
      req.method === 'POST' &&
      (
        (params = matchPath(pathname, '/api/v1/ceo/outgoing-payments/:requestId/approve')) ||
        (params = matchPath(pathname, '/api/v1/ceo/outgoing-payments/:requestId/deny'))
      )
    ) {
      const session = requireCEO(db, req);
      const body = await readJson(req);
      const approve = pathname.endsWith('/approve');
      const status = approve ? 'Approved' : 'Denied';
      const payment = db.prepare(`
        SELECT * FROM OutgoingPaymentRequests
        WHERE OutgoingPaymentRequestId = ?
      `).get(params.requestId);
      if (!payment) {
        throw new ApiError(404, 'PAYMENT_REQUEST_NOT_FOUND', 'Outgoing payment request not found.');
      }
      if (payment.Status !== 'Pending') {
        throw new ApiError(409, 'PAYMENT_REQUEST_ALREADY_DECIDED', 'This payment request was already decided.');
      }
      if (payment.RequestedByEmployeeId === session.PrincipalId) {
        throw new ApiError(403, 'SEPARATION_OF_DUTIES_REQUIRED', 'The payment preparer cannot approve the same payment.');
      }
      const result = db.prepare(`
        UPDATE OutgoingPaymentRequests
        SET Status = ?, DecisionTime = ?, DecidedByEmployeeId = ?, DecisionRemark = ?
        WHERE OutgoingPaymentRequestId = ? AND Status = 'Pending'
      `).run(
        status,
        now(),
        session.PrincipalId,
        String(body.remark || '').trim() || null,
        params.requestId
      );
      if (result.changes !== 1) {
        throw new ApiError(409, 'PAYMENT_REQUEST_ALREADY_DECIDED', 'This payment request was already decided.');
      }
      audit(
        db,
        'Employee',
        session.PrincipalId,
        approve ? 'OutgoingPaymentApproved' : 'OutgoingPaymentDenied',
        'OutgoingPaymentRequest',
        params.requestId,
        { amount: payment.Amount, payeeName: payment.PayeeName }
      );
      return json(res, 200, envelope({
        outgoingPaymentRequestId: params.requestId,
        status,
        amount: payment.Amount,
        currencyCode: payment.CurrencyCode,
        decisionTime: now()
      }, requestId));
    }

    throw new ApiError(404, 'ROUTE_NOT_FOUND', 'API route not found.');
  }

  function serveStatic(req, res, url) {
    const pathname = url.pathname;
    let filePath;
    if (pathname === '/' || pathname === '/index.html') {
      filePath = path.join(ROOT, 'Front', 'index.html');
    } else if (pathname === '/employee' || pathname === '/employee.html') {
      filePath = path.join(ROOT, 'Back', 'employee.html');
    } else if (pathname === '/admin' || pathname === '/admin.html') {
      filePath = path.join(ROOT, 'Back', 'admin.html');
    } else if (pathname === '/ceo' || pathname === '/ceo.html') {
      filePath = path.join(ROOT, 'Back', 'ceo.html');
    } else if (pathname.startsWith('/assets/profiles/')) {
      filePath = path.join(ROOT, 'Resource', 'profiles', path.basename(pathname));
    } else if (pathname.startsWith('/front/')) {
      filePath = path.join(ROOT, 'Front', pathname.slice('/front/'.length));
    } else if (pathname.startsWith('/back/')) {
      filePath = path.join(ROOT, 'Back', pathname.slice('/back/'.length));
    } else if (pathname.startsWith('/data/')) {
      filePath = path.join(ROOT, 'Design', 'Data', pathname.slice('/data/'.length));
    } else {
      return false;
    }
    const allowedRoots = [
      path.join(ROOT, 'Front'),
      path.join(ROOT, 'Back'),
      path.join(ROOT, 'Resource', 'profiles'),
      path.join(ROOT, 'Design', 'Data')
    ];
    const resolved = path.resolve(filePath);
    if (!allowedRoots.some((root) => resolved.startsWith(root)) || !fs.existsSync(resolved)) {
      return false;
    }
    const extension = path.extname(resolved).toLowerCase();
      const types = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.json': 'application/json; charset=utf-8'
    };
    const stat = fs.statSync(resolved);
    res.writeHead(200, {
      'Content-Type': types[extension] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': ['.html', '.js', '.css'].includes(extension) ? 'no-cache' : 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff'
    });
    fs.createReadStream(resolved).pipe(res);
    return true;
  }

  async function handler(req, res) {
    const requestId = `req_${randomToken(8)}`;
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname.startsWith('/api/')) {
        applyCors(req, res);
        if (req.method === 'OPTIONS') {
          res.writeHead(204, {
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff'
          });
          res.end();
          return;
        }
        await handleApi(req, res, url, requestId);
        return;
      }
      if (serveStatic(req, res, url)) return;
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
    } catch (error) {
      const safe =
        error instanceof ApiError
          ? error
          : new ApiError(500, 'INTERNAL_ERROR', 'The server could not complete the request.');
      if (!(error instanceof ApiError)) console.error(requestId, error);
      if (!res.headersSent) json(res, safe.status, errorEnvelope(safe, requestId));
      else res.destroy();
    }
  }

  return {
    db,
    handler,
    processRobotReplies(timestamp = new Date(), limit = 50) {
      return processPendingRobotRepliesWithQueue(db, robotQueue, timestamp, limit);
    },
    robotQueueSnapshot() {
      return robotQueue.snapshot();
    },
    close() {
      if (robotWorker) clearInterval(robotWorker);
      robotQueue.close();
      db.close();
    }
  };
}

module.exports = {
  createApplication,
  ApiError,
  MESSAGE_COST,
  MAX_MESSAGE_WORDS,
  CREDIT_PACKAGES,
  GIFTS
};
