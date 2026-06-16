const { randomUUID } = require('node:crypto');

const ROBOT_DAILY_LIMIT_SECONDS = 28_800;
const ROBOT_MAX_CONVERSATIONS = 10;
const EXTERNAL_MODEL = 'gpt-4.1-mini-2025-04-14';
const EXTERNAL_INPUT_RATE = 0.40 / 1_000_000;
const EXTERNAL_OUTPUT_RATE = 1.60 / 1_000_000;

function dateTimeParts(value, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(value);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function businessDate(value, timeZone) {
  const parts = dateTimeParts(value, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function localDateTimeToUtc(date, hour, timeZone) {
  const [year, month, day] = date.split('-').map(Number);
  const target = Date.UTC(year, month - 1, day, hour, 0, 0);
  let candidate = target;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = dateTimeParts(new Date(candidate), timeZone);
    const observed = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second)
    );
    candidate += target - observed;
  }
  return new Date(candidate);
}

function nextLocalDate(date) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
}

function utcOffsetMinutes(value, timeZone) {
  const parts = dateTimeParts(value, timeZone);
  const localAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return Math.round((localAsUtc - value.getTime()) / 60_000);
}

function buildShiftWindows(date, timeZone) {
  const start = localDateTimeToUtc(date, 0, timeZone);
  const end = localDateTimeToUtc(nextLocalDate(date), 0, timeZone);
  const windows = [];
  let cursor = start.getTime();
  while (cursor < end.getTime()) {
    const next = Math.min(cursor + ROBOT_DAILY_LIMIT_SECONDS * 1000, end.getTime());
    windows.push({
      start: new Date(cursor),
      end: new Date(next)
    });
    cursor = next;
  }
  return windows;
}

function getPolicy(db, key, fallback = '') {
  const row = db.prepare(`
    SELECT PolicyValue, Version FROM PolicyDefinitions
    WHERE PolicyKey = ? AND Active = 1
  `).get(key);
  return {
    value: row ? String(row.PolicyValue) : String(fallback),
    version: row?.Version || 1
  };
}

function ensureCoverageRows(db, timestamp = new Date()) {
  const existing = db.prepare(`
    SELECT * FROM RobotCityCoverage
    WHERE CountryCode = 'US' AND StateId = 'CA' AND CityName = 'Los Angeles'
  `).get();
  const current = timestamp.toISOString();
  let coverageId = existing?.RobotCityCoverageId;
  if (!existing) {
    coverageId = randomUUID();
    db.prepare(`
      INSERT INTO RobotCityCoverage (
        RobotCityCoverageId, CountryCode, StateId, CityName, TimeZoneId,
        MinimumManProfiles, MinimumWomanProfiles, RequiredOnlineMan,
        RequiredOnlineWoman, CoverageStatus, Active, CreateTime, UpdateTime
      ) VALUES (?, 'US', 'CA', 'Los Angeles', 'America/Los_Angeles',
        3, 3, 1, 1, 'Draft', 1, ?, ?)
    `).run(coverageId, current, current);
  }
  return db.prepare('SELECT * FROM RobotCityCoverage WHERE RobotCityCoverageId = ?')
    .get(coverageId);
}

function eligibleRobots(db, coverage, sex) {
  return db.prepare(`
    SELECT * FROM CustomerProfile
    WHERE Seed = 2 AND Active = 1 AND Sex = ?
      AND CountryCode = ? AND StateId = ? AND CityName = ?
    ORDER BY DisplayName
  `).all(sex, coverage.CountryCode, coverage.StateId, coverage.CityName);
}

function updateCoverageReadiness(db, coverage, timestamp = new Date()) {
  const men = eligibleRobots(db, coverage, 'Man');
  const women = eligibleRobots(db, coverage, 'Woman');
  let status = 'Draft';
  if (men.length >= 3 && women.length >= 3) status = 'InventoryReady';
  if (men.length >= 4 && women.length >= 4) status = 'CoverageReady';
  db.prepare(`
    UPDATE RobotCityCoverage SET CoverageStatus = ?, UpdateTime = ?
    WHERE RobotCityCoverageId = ?
  `).run(status, timestamp.toISOString(), coverage.RobotCityCoverageId);
  return { status, men, women };
}

function ensureDailyActivity(db, robotId, coverageId, date, timestamp) {
  let activity = db.prepare(`
    SELECT * FROM RobotDailyActivity
    WHERE RobotCustomerId = ? AND RobotCityCoverageId = ? AND BusinessDate = ?
  `).get(robotId, coverageId, date);
  if (!activity) {
    const id = randomUUID();
    const current = timestamp.toISOString();
    db.prepare(`
      INSERT INTO RobotDailyActivity (
        RobotDailyActivityId, RobotCustomerId, RobotCityCoverageId,
        BusinessDate, OnlineSeconds, Active, CreateTime, UpdateTime
      ) VALUES (?, ?, ?, ?, 0, 0, ?, ?)
    `).run(id, robotId, coverageId, date, current, current);
    activity = db.prepare('SELECT * FROM RobotDailyActivity WHERE RobotDailyActivityId = ?')
      .get(id);
  }
  return activity;
}

function planDailyShifts(db, coverage, date, timestamp = new Date(), force = false) {
  if (force) {
    db.prepare(`
      DELETE FROM RobotShiftSchedule
      WHERE RobotCityCoverageId = ? AND BusinessDate = ? AND ShiftStatus = 'Planned'
    `).run(coverage.RobotCityCoverageId, date);
  }
  const existing = db.prepare(`
    SELECT COUNT(*) AS value FROM RobotShiftSchedule
    WHERE RobotCityCoverageId = ? AND BusinessDate = ?
  `).get(coverage.RobotCityCoverageId, date).value;
  if (existing) return;

  const readiness = updateCoverageReadiness(db, coverage, timestamp);
  if (readiness.status !== 'CoverageReady') return;
  const windows = buildShiftWindows(date, coverage.TimeZoneId);
  const current = timestamp.toISOString();
  for (const [sex, robots] of [['Man', readiness.men], ['Woman', readiness.women]]) {
    windows.forEach((window, index) => {
      const robot = robots[index % robots.length];
      db.prepare(`
        INSERT OR IGNORE INTO RobotShiftSchedule (
          RobotShiftScheduleId, RobotCityCoverageId, RobotCustomerId,
          BusinessDate, SexSnapshot, TimeZoneIdSnapshot,
          StartUtcOffsetMinutes, EndUtcOffsetMinutes,
          PlannedStartTime, PlannedEndTime, ShiftStatus, IsReserve,
          CreateTime, UpdateTime
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Planned', 0, ?, ?)
      `).run(
        randomUUID(),
        coverage.RobotCityCoverageId,
        robot.CustomerId,
        date,
        sex,
        coverage.TimeZoneId,
        utcOffsetMinutes(window.start, coverage.TimeZoneId),
        utcOffsetMinutes(new Date(window.end.getTime() - 1), coverage.TimeZoneId),
        window.start.toISOString(),
        window.end.toISOString(),
        current,
        current
      );
      ensureDailyActivity(
        db,
        robot.CustomerId,
        coverage.RobotCityCoverageId,
        date,
        timestamp
      );
    });
  }
}

function closeExpiredShifts(db, coverage, timestamp) {
  const rows = db.prepare(`
    SELECT * FROM RobotShiftSchedule
    WHERE RobotCityCoverageId = ? AND ShiftStatus = 'Active'
      AND PlannedEndTime <= ?
  `).all(coverage.RobotCityCoverageId, timestamp.toISOString());
  for (const shift of rows) {
    const actualStart = Date.parse(shift.ActualStartTime || shift.PlannedStartTime);
    const actualEnd = Math.min(timestamp.getTime(), Date.parse(shift.PlannedEndTime));
    const seconds = Math.max(0, Math.floor((actualEnd - actualStart) / 1000));
    db.prepare(`
      UPDATE RobotShiftSchedule
      SET ShiftStatus = 'Completed', ActualEndTime = ?, UpdateTime = ?
      WHERE RobotShiftScheduleId = ?
    `).run(new Date(actualEnd).toISOString(), timestamp.toISOString(), shift.RobotShiftScheduleId);
    db.prepare(`
      UPDATE RobotDailyActivity
      SET OnlineSeconds = MIN(28800, OnlineSeconds + ?),
          LastOfflineTime = ?, Active = 0, UpdateTime = ?
      WHERE RobotCustomerId = ? AND RobotCityCoverageId = ? AND BusinessDate = ?
    `).run(
      seconds,
      new Date(actualEnd).toISOString(),
      timestamp.toISOString(),
      shift.RobotCustomerId,
      coverage.RobotCityCoverageId,
      shift.BusinessDate
    );
  }
}

function activateCurrentShifts(db, coverage, timestamp) {
  const rows = db.prepare(`
    SELECT s.*, p.Active AS ProfileActive
    FROM RobotShiftSchedule s
    JOIN CustomerProfile p ON p.CustomerId = s.RobotCustomerId
    WHERE s.RobotCityCoverageId = ?
      AND s.PlannedStartTime <= ? AND s.PlannedEndTime > ?
      AND s.ShiftStatus IN ('Planned', 'Active')
  `).all(coverage.RobotCityCoverageId, timestamp.toISOString(), timestamp.toISOString());
  for (const shift of rows) {
    const activity = ensureDailyActivity(
      db,
      shift.RobotCustomerId,
      coverage.RobotCityCoverageId,
      shift.BusinessDate,
      timestamp
    );
    if (!shift.ProfileActive || activity.OnlineSeconds >= ROBOT_DAILY_LIMIT_SECONDS) {
      db.prepare(`
        UPDATE RobotShiftSchedule
        SET ShiftStatus = 'Failed', FailureCode = 'ROBOT_INELIGIBLE', UpdateTime = ?
        WHERE RobotShiftScheduleId = ?
      `).run(timestamp.toISOString(), shift.RobotShiftScheduleId);
      activateReserve(db, coverage, shift, timestamp);
      continue;
    }
    if (shift.ShiftStatus === 'Planned') {
      db.prepare(`
        UPDATE RobotShiftSchedule
        SET ShiftStatus = 'Active', ActualStartTime = ?, UpdateTime = ?
        WHERE RobotShiftScheduleId = ?
      `).run(timestamp.toISOString(), timestamp.toISOString(), shift.RobotShiftScheduleId);
      db.prepare(`
        UPDATE RobotDailyActivity
        SET Active = 1, FirstOnlineTime = COALESCE(FirstOnlineTime, ?), UpdateTime = ?
        WHERE RobotCustomerId = ? AND RobotCityCoverageId = ? AND BusinessDate = ?
      `).run(
        timestamp.toISOString(),
        timestamp.toISOString(),
        shift.RobotCustomerId,
        coverage.RobotCityCoverageId,
        shift.BusinessDate
      );
    }
  }
}

function activateReserve(db, coverage, failedShift, timestamp) {
  const replacement = db.prepare(`
    SELECT p.*
    FROM CustomerProfile p
    WHERE p.Seed = 2 AND p.Active = 1 AND p.Sex = ?
      AND p.CountryCode = ? AND p.StateId = ? AND p.CityName = ?
      AND p.CustomerId <> ?
      AND NOT EXISTS (
        SELECT 1 FROM RobotShiftSchedule s
        WHERE s.RobotCustomerId = p.CustomerId
          AND s.ShiftStatus IN ('Planned', 'Active')
          AND s.PlannedStartTime < ?
          AND s.PlannedEndTime > ?
      )
    ORDER BY p.DisplayName
    LIMIT 1
  `).get(
    failedShift.SexSnapshot,
    coverage.CountryCode,
    coverage.StateId,
    coverage.CityName,
    failedShift.RobotCustomerId,
    failedShift.PlannedEndTime,
    timestamp.toISOString()
  );
  if (!replacement) return null;
  const activity = ensureDailyActivity(
    db,
    replacement.CustomerId,
    coverage.RobotCityCoverageId,
    failedShift.BusinessDate,
    timestamp
  );
  const availableSeconds = ROBOT_DAILY_LIMIT_SECONDS - Number(activity.OnlineSeconds || 0);
  if (availableSeconds <= 0) return null;
  const plannedEnd = new Date(
    Math.min(
      Date.parse(failedShift.PlannedEndTime),
      timestamp.getTime() + availableSeconds * 1000
    )
  );
  const replacementId = randomUUID();
  db.prepare(`
    INSERT INTO RobotShiftSchedule (
      RobotShiftScheduleId, RobotCityCoverageId, RobotCustomerId,
      BusinessDate, SexSnapshot, TimeZoneIdSnapshot,
      StartUtcOffsetMinutes, EndUtcOffsetMinutes,
      PlannedStartTime, PlannedEndTime, ActualStartTime, ShiftStatus,
      IsReserve, ReplacedShiftId, CreateTime, UpdateTime
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', 1, ?, ?, ?)
  `).run(
    replacementId,
    coverage.RobotCityCoverageId,
    replacement.CustomerId,
    failedShift.BusinessDate,
    failedShift.SexSnapshot,
    coverage.TimeZoneId,
    utcOffsetMinutes(timestamp, coverage.TimeZoneId),
    utcOffsetMinutes(new Date(plannedEnd.getTime() - 1), coverage.TimeZoneId),
    timestamp.toISOString(),
    plannedEnd.toISOString(),
    timestamp.toISOString(),
    failedShift.RobotShiftScheduleId,
    timestamp.toISOString(),
    timestamp.toISOString()
  );
  db.prepare(`
    UPDATE RobotDailyActivity
    SET Active = 1, FirstOnlineTime = COALESCE(FirstOnlineTime, ?), UpdateTime = ?
    WHERE RobotCustomerId = ? AND RobotCityCoverageId = ? AND BusinessDate = ?
  `).run(
    timestamp.toISOString(),
    timestamp.toISOString(),
    replacement.CustomerId,
    coverage.RobotCityCoverageId,
    failedShift.BusinessDate
  );
  db.prepare(`
    UPDATE RobotShiftSchedule SET ShiftStatus = 'Replaced', UpdateTime = ?
    WHERE RobotShiftScheduleId = ?
  `).run(timestamp.toISOString(), failedShift.RobotShiftScheduleId);
  return replacementId;
}

function currentCoverageCounts(db, coverage, timestamp) {
  const rows = db.prepare(`
    SELECT SexSnapshot, COUNT(*) AS value
    FROM RobotShiftSchedule
    WHERE RobotCityCoverageId = ? AND ShiftStatus = 'Active'
      AND PlannedStartTime <= ? AND PlannedEndTime > ?
    GROUP BY SexSnapshot
  `).all(coverage.RobotCityCoverageId, timestamp.toISOString(), timestamp.toISOString());
  return Object.fromEntries(rows.map((row) => [row.SexSnapshot, row.value]));
}

function reconcileRobotOperations(db, timestamp = new Date()) {
  const coverage = ensureCoverageRows(db, timestamp);
  const date = businessDate(timestamp, coverage.TimeZoneId);
  planDailyShifts(db, coverage, date, timestamp);
  closeExpiredShifts(db, coverage, timestamp);
  activateCurrentShifts(db, coverage, timestamp);
  const counts = currentCoverageCounts(db, coverage, timestamp);
  if (
    coverage.CoverageStatus !== 'Paused' &&
    (Number(counts.Man || 0) < coverage.RequiredOnlineMan ||
      Number(counts.Woman || 0) < coverage.RequiredOnlineWoman)
  ) {
    db.prepare(`
      UPDATE RobotCityCoverage SET CoverageStatus = 'CoverageDegraded', UpdateTime = ?
      WHERE RobotCityCoverageId = ?
    `).run(timestamp.toISOString(), coverage.RobotCityCoverageId);
  }
  return db.prepare('SELECT * FROM RobotCityCoverage WHERE RobotCityCoverageId = ?')
    .get(coverage.RobotCityCoverageId);
}

function robotRuntimeStatus(db, robotId, timestamp = new Date()) {
  const coverage = reconcileRobotOperations(db, timestamp);
  const shift = db.prepare(`
    SELECT * FROM RobotShiftSchedule
    WHERE RobotCustomerId = ? AND ShiftStatus = 'Active'
      AND PlannedStartTime <= ? AND PlannedEndTime > ?
    ORDER BY PlannedStartTime DESC LIMIT 1
  `).get(robotId, timestamp.toISOString(), timestamp.toISOString());
  const date = businessDate(timestamp, coverage.TimeZoneId);
  const activity = db.prepare(`
    SELECT * FROM RobotDailyActivity
    WHERE RobotCustomerId = ? AND RobotCityCoverageId = ? AND BusinessDate = ?
  `).get(robotId, coverage.RobotCityCoverageId, date);
  const activeIntervalSeconds = shift?.ActualStartTime
    ? Math.max(0, Math.floor((timestamp.getTime() - Date.parse(shift.ActualStartTime)) / 1000))
    : 0;
  const onlineSeconds = Math.min(
    ROBOT_DAILY_LIMIT_SECONDS,
    Number(activity?.OnlineSeconds || 0) + activeIntervalSeconds
  );
  return {
    eligible: Boolean(shift) && onlineSeconds < ROBOT_DAILY_LIMIT_SECONDS,
    coverage,
    shift,
    activity,
    onlineSeconds,
    remainingSeconds: Math.max(
      0,
      ROBOT_DAILY_LIMIT_SECONDS - onlineSeconds
    )
  };
}

function recentHistory(db, conversationId, limit = 20) {
  return db.prepare(`
    SELECT * FROM (
      SELECT * FROM ChatRecords
      WHERE ConversationId = ?
      ORDER BY ChatTime DESC LIMIT ?
    ) ORDER BY ChatTime ASC
  `).all(conversationId, limit);
}

function findMemoryMarker(history) {
  const text = history.map((message) => message.Text).join(' ').toLowerCase();
  const markers = [
    ['nursing', 'your new nursing shift on Monday'],
    ['kyoto', 'your idea of visiting Kyoto in spring'],
    ['sourdough', 'the sourdough you are learning to make'],
    ['lakers', 'following the Lakers'],
    ['watercolor', 'your watercolor landscapes'],
    ['summer rain', 'walking after summer rain'],
    ['late-night cafe', 'the late-night cafes you enjoy'],
    ['vegetable garden', 'your small vegetable garden'],
    ['sea glass', 'collecting sea glass'],
    ['hiking trip', 'your easy hiking trip']
  ];
  return markers.find(([needle]) => text.includes(needle))?.[1] || null;
}

function firstName(customerInfo) {
  return String(customerInfo?.displayName || '').trim().split(/\s+/u)[0] || '';
}

function ageFromBirthDate(birthDate, timestamp = new Date()) {
  if (!birthDate) return null;
  const birth = new Date(`${birthDate}T00:00:00Z`);
  if (Number.isNaN(birth.getTime())) return null;
  let age = timestamp.getUTCFullYear() - birth.getUTCFullYear();
  const monthDifference = timestamp.getUTCMonth() - birth.getUTCMonth();
  if (
    monthDifference < 0 ||
    (monthDifference === 0 && timestamp.getUTCDate() < birth.getUTCDate())
  ) {
    age -= 1;
  }
  return age;
}

function stableIndex(value, length) {
  if (!length) return 0;
  let hash = 0;
  for (const char of String(value)) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash % length;
}

function recentRobotTexts(history) {
  return history
    .filter((message) => message.ResponseSource === 'RobotLocal' || message.ResponseSource === 'ExternalAISimulated')
    .slice(-5)
    .map((message) => String(message.Text || '').trim().toLowerCase());
}

function classifyTopic(value) {
  const topics = [
    ['profileAge', /\b(how old|your age|age are you|age)\b/u],
    ['profileLocation', /\b(where are you from|where do you live|where are you based|your city|from\?)\b/u],
    ['memory', /\b(remember|earlier|before|continue|last time)\b/u],
    ['work', /\b(work|job|office|boss|busy|stress|stressed|tired|shift|career|meeting)\b/u],
    ['feelings', /\b(sad|lonely|alone|upset|hurt|depressed|angry|anxious|worry|worried|mood|bad day)\b/u],
    ['travel', /\b(travel|trip|vacation|city|visit|kyoto|flight|hotel|road)\b/u],
    ['beach', /\b(beach|ocean|sea|coast|waves|sand|sunset)\b/u],
    ['mountain', /\b(mountain|hiking|trail|camping|forest|lake)\b/u],
    ['romance', /\b(love|relationship|dating|heart|miss|together|care|romantic)\b/u],
    ['flirt', /\b(flirt|kiss|cuddle|hug|tease|sexy|touch|desire|naughty)\b/u],
    ['food', /\b(food|cook|cooking|dinner|lunch|breakfast|coffee|sourdough|restaurant|meal)\b/u],
    ['weather', /\b(weather|rain|sunny|hot|cold|wind|cloud|storm)\b/u],
    ['sports', /\b(sport|sports|lakers|game|team|basketball|football|baseball|soccer)\b/u],
    ['art', /\b(art|watercolor|painting|music|movie|book|song|museum|draw|creative)\b/u],
    ['style', /\b(cloth|clothes|dress|style|fashion|outfit|wear)\b/u],
    ['city', /\b(city|downtown|neighborhood|countryside|village|suburb|local)\b/u],
    ['greeting', /\b(hi|hello|hey|good morning|good evening|how are you)\b/u],
    ['question', /\?/u]
  ];
  return topics.find(([, pattern]) => pattern.test(value))?.[0] || 'general';
}

const LOCAL_REPLY_BANK = Object.freeze({
  greeting: [
    'Hi{name}. I am here with you. What kind of mood are you bringing into this chat?',
    'Hello{name}. I am glad you stopped by. Do you want something light, sweet, or thoughtful tonight?',
    'Hey{name}. Tell me one small thing about your day before we choose where this conversation goes.',
    'Hi{name}. I like a warm start. What would make this chat feel good for you right now?'
  ],
  feelings: [
    'I hear that this feels heavy{name}. Do you want to talk through what happened, or would a softer distraction help more?',
    'That sounds tender. What part has been sitting with you the most?',
    'I am listening{name}. We can slow down and take it one piece at a time.',
    'It makes sense that your mood would feel crowded. What would help you feel a little steadier tonight?',
    'Thank you for saying it plainly. Do you want comfort, advice, or just someone to stay with the feeling for a minute?'
  ],
  work: [
    'That sounds like a lot to carry{name}. What part of work took the most energy from you today?',
    'A long workday can follow you home. What would help the rest of the evening feel lighter?',
    'I can hear the tiredness in that. Was it the people, the pace, or the pressure that got to you most?',
    'Work stress can make everything feel tight. Tell me the one moment you wish had gone differently.',
    'You deserve a softer landing after that. What kind of conversation would help you unwind?'
  ],
  romance: [
    'That has a sweet feeling to it{name}. What does being cared for look like to you in small everyday ways?',
    'I like when a conversation gets honest about connection. What makes you feel close to someone?',
    'That sounds like your heart is asking for something real. What kind of attention matters most to you?',
    'Romance feels best when it is unhurried. What would make you feel seen tonight?',
    'I can stay with that thought. Do you usually open your heart quickly or carefully?'
  ],
  flirt: [
    'You are making the conversation warmer{name}. Should we keep it playful or turn it a little more intimate?',
    'That is a bold little spark. What kind of teasing makes you smile without rushing things?',
    'I like playful energy when it still feels respectful. Tell me what kind of attention you enjoy most.',
    'You have my attention. Do you want sweet flirting, confident flirting, or something softer?',
    'That made me smile. Let us keep the mood warm and easy. What would you say next if we were sitting close?'
  ],
  travel: [
    'That sounds like a good conversation to wander into{name}. What part of the trip feels most alive in your mind?',
    'Travel says a lot about a person. Do you like plans, surprises, or a mix of both?',
    'I can picture the mood of that. What would you want to do first when you arrive?',
    'A change of place can change the whole heart. What are you hoping to feel there?',
    'That destination has a nice pull. Would you go for food, scenery, quiet, or adventure?'
  ],
  beach: [
    'The ocean has a calming kind of honesty. Do you like the beach more for quiet, walking, or watching the light change?',
    'That beach mood sounds peaceful{name}. What do you notice first: the water, the sky, or the people around you?',
    'Waves can make a conversation slower in a good way. What would you want beside you there?',
    'I like that image. Does the beach make you feel relaxed, playful, or thoughtful?'
  ],
  mountain: [
    'Mountains make people breathe differently. Would you want a quiet trail, a view, or a long easy talk while walking?',
    'That sounds grounding{name}. What kind of place helps your mind settle down?',
    'A simple hike can clear a lot. Do you go for the challenge or for the silence?',
    'I like the feeling of that. What would you pack for a day that was only about peace?'
  ],
  food: [
    'Food can make an ordinary day warmer. What flavor or meal always puts you in a better mood?',
    'That sounds comforting{name}. Do you enjoy cooking more for yourself or for someone you like?',
    'A good meal is a gentle kind of care. What would you want to share across the table?',
    'I like hearing about food because it always leads to memory. What dish feels like home to you?',
    'Coffee and dinner conversations both have their own mood. Which one fits tonight for you?'
  ],
  weather: [
    'Weather changes the whole feeling of a day. Does this kind of day make you want to go out or stay close to home?',
    'I like how weather can shift a mood{name}. What does it make you want tonight?',
    'That sounds like a scene. Would you rather walk through it, watch it from a window, or ignore it with a good chat?',
    'Rain, sun, or wind can all become a memory. What kind of weather makes you feel most alive?'
  ],
  sports: [
    'Following a team can make the week more fun. What keeps you watching even when the game gets tense?',
    'I like the energy in that{name}. Are you more loyal to the team, the players, or the shared excitement?',
    'Sports can turn strangers into instant friends. What is your favorite kind of game night?',
    'That sounds fun. Do you like talking strategy, cheering, or just enjoying the moment?'
  ],
  art: [
    'I like hearing what catches your eye{name}. What feeling do you hope the picture or music keeps?',
    'Creative things tell on us in a beautiful way. What kind of art or music matches your mood lately?',
    'That sounds personal. Do you like art that calms you, surprises you, or says what words cannot?',
    'I would like to know more about that. What made it stay in your mind?'
  ],
  style: [
    'Style is such a quiet form of confidence. What do you wear when you want to feel most like yourself?',
    'That has personality{name}. Do you dress more for comfort, attraction, or the mood of the day?',
    'Clothes can change how a moment feels. What look makes you feel relaxed but noticed?',
    'I like that topic. Is your style simple, playful, polished, or always changing?'
  ],
  city: [
    'Life{place} can have so many small moods. What part of your neighborhood feels most like you?',
    'City and quiet places both have a pull. Which one gives you more energy lately?',
    'I like local details{name}. What place nearby would you choose for an easy first conversation?',
    'That makes me curious about your everyday world. What is one corner of the city you never get tired of?'
  ],
  profileAge: [
    'I am {robotAge}. What age range do you usually feel most comfortable talking with?',
    'My profile age is {robotAge}. Does age matter much to you when the conversation feels easy?',
    'I am {robotAge}. I care more about the rhythm of a conversation than the number, but it is fair to ask.'
  ],
  profileLocation: [
    'I am based in {robotPlace}. What part of your city feels most like home to you?',
    'My profile is in {robotPlace}. Do you like city life, or do you prefer quieter places?',
    'I am from {robotPlace}. What kind of local place would you choose for an easy conversation?'
  ],
  memory: [
    'I remember {memory}. What feels most important about it now?',
    'Yes, {memory} stayed with me. Has anything changed since you mentioned it?',
    'I remember that: {memory}. Do you want to continue from there or tell me the newest part?',
    'That earlier detail mattered: {memory}. What made you think about it again?'
  ],
  question: [
    'That is a good question{name}. My honest answer is that the feeling behind it matters most. What made you ask?',
    'I would answer carefully: start with what feels true, then keep the pressure low. How does it feel to you?',
    'I think the answer depends on what you want from the moment. Are you hoping for comfort, clarity, or a little fun?',
    'Good question. I want to understand your side first, because the details change the answer.'
  ],
  general: [
    'I am glad you shared that{name}. What part would you like to talk about a little more?',
    'There is something interesting in the way you said that. Tell me the part you almost left out.',
    'I want to follow your thread{name}. What should I understand about that first?',
    'That gives us a place to begin. Do you want to keep it light or go a little deeper?',
    'I am here with you. What feeling is underneath that thought?',
    'That sounds worth staying with for a moment. What happened next?'
  ]
});

function fillTemplate(template, context) {
  return template
    .replaceAll('{name}', context.name ? `, ${context.name}` : '')
    .replaceAll('{place}', context.place || '')
    .replaceAll('{robotAge}', context.robotAge || 'in my early thirties')
    .replaceAll('{robotPlace}', context.robotPlace || 'Los Angeles')
    .replaceAll('{memory}', context.memory || 'what you shared earlier');
}

function chooseLocalReply(topic, text, history, context) {
  const bank = LOCAL_REPLY_BANK[topic] || LOCAL_REPLY_BANK.general;
  const used = recentRobotTexts(history);
  const seed = `${topic}|${text}|${history.length}|${context.memory || ''}`;
  for (let offset = 0; offset < bank.length; offset += 1) {
    const candidate = fillTemplate(bank[(stableIndex(seed, bank.length) + offset) % bank.length], context);
    if (!used.includes(candidate.toLowerCase())) return candidate;
  }
  return fillTemplate(bank[stableIndex(`${seed}|fallback`, bank.length)], context);
}

function localResponse(text, history, customerInfo = null, robot = null, timestamp = new Date()) {
  const value = String(text).toLowerCase();
  const memory = findMemoryMarker(history);
  const name = firstName(customerInfo);
  const place = customerInfo?.city ? ` in ${customerInfo.city}` : '';
  const robotAge = ageFromBirthDate(robot?.BirthDate, timestamp);
  const robotPlace = [robot?.CityName, robot?.StateId].filter(Boolean).join(', ');
  const context = {
    name,
    place,
    memory,
    robotAge: robotAge ? String(robotAge) : '',
    robotPlace
  };
  if (/\b(remember|earlier|before|continue)\b/u.test(value) && memory) {
    return chooseLocalReply('memory', text, history, context);
  }
  const topic = classifyTopic(value);
  return chooseLocalReply(topic, text, history, context);
}

function estimateTokens(text) {
  return Math.max(1, Math.ceil(String(text).length / 4));
}

function estimatedUsage(db, prefix) {
  return Number(db.prepare(`
    SELECT COALESCE(SUM(EstimatedCost), 0) AS value
    FROM RobotAIUsage
    WHERE UsageStatus = 'Accepted' AND substr(CreateTime, 1, ?) = ?
  `).get(prefix.length, prefix).value || 0);
}

function activeConversationCount(db, robotId, timestamp = new Date()) {
  const cutoff = new Date(timestamp.getTime() - 20 * 60 * 1000).toISOString();
  return db.prepare(`
    SELECT COUNT(*) AS value FROM Conversations
    WHERE (CustomerAId = ? OR CustomerBId = ?) AND UpdatedAt >= ?
  `).get(robotId, robotId, cutoff).value;
}

function generateRobotReply(db, options) {
  const {
    robot,
    realCustomerId,
    conversationId,
    incomingChatRecordId,
    text,
    customerInfo = null,
    timestamp = new Date(),
    allowOffShift = false
  } = options;
  const runtime = robotRuntimeStatus(db, robot.CustomerId, timestamp);
  if (!runtime.eligible && !allowOffShift) {
    return { reply: null, reason: 'ROBOT_NOT_ON_SHIFT' };
  }
  if (activeConversationCount(db, robot.CustomerId, timestamp) > ROBOT_MAX_CONVERSATIONS) {
    return { reply: null, reason: 'ROBOT_CAPACITY_REACHED' };
  }
  const history = recentHistory(db, conversationId);
  const modePolicy = getPolicy(db, 'robot_ai_mode', 'LocalOnly');
  const externalCandidate = modePolicy.value === 'HybridExternalAllowed' &&
    /\b(why|feel|remember|earlier|relationship|confused|meaning|advice)\b/iu.test(text);
  const replyText = localResponse(text, history, customerInfo, robot, timestamp);
  const inputTokens = Math.min(
    2000,
    estimateTokens(JSON.stringify(history.map((item) => item.Text))) + estimateTokens(text) + 180
  );
  const outputTokens = Math.min(120, estimateTokens(replyText));
  const estimatedCost =
    inputTokens * EXTERNAL_INPUT_RATE + outputTokens * EXTERNAL_OUTPUT_RATE;
  const day = timestamp.toISOString().slice(0, 10);
  const month = timestamp.toISOString().slice(0, 7);
  const dailyBudget = Number(getPolicy(db, 'robot_ai_daily_budget_usd', '25').value);
  const monthlyBudget = Number(getPolicy(db, 'robot_ai_monthly_budget_usd', '500').value);
  const withinBudget =
    estimatedUsage(db, day) + estimatedCost <= dailyBudget &&
    estimatedUsage(db, month) + estimatedCost <= monthlyBudget;
  const useExternal = externalCandidate && withinBudget;
  const responseSource = useExternal ? 'ExternalAISimulated' : 'RobotLocal';
  const reply = {
    text: replyText,
    responseSource,
    policyVersion: modePolicy.version,
    fallbackReason: externalCandidate && !withinBudget ? 'AI_BUDGET_EXHAUSTED' : null,
    usage: null
  };
  if (useExternal) {
    reply.usage = {
      robotAIUsageId: randomUUID(),
      provider: 'OpenAI',
      model: EXTERNAL_MODEL,
      inputTokens,
      cachedInputTokens: 0,
      outputTokens,
      estimatedCost,
      policyVersion: modePolicy.version,
      responseMode: responseSource,
      realCustomerId,
      incomingChatRecordId
    };
  }
  return { reply, reason: null, runtime };
}

module.exports = {
  ROBOT_DAILY_LIMIT_SECONDS,
  ROBOT_MAX_CONVERSATIONS,
  EXTERNAL_MODEL,
  buildShiftWindows,
  businessDate,
  ensureCoverageRows,
  planDailyShifts,
  updateCoverageReadiness,
  reconcileRobotOperations,
  robotRuntimeStatus,
  generateRobotReply,
  getPolicy
};
