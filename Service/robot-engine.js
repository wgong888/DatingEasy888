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

function localResponse(text, history) {
  const value = String(text).toLowerCase();
  const memory = findMemoryMarker(history);
  if (/\b(remember|earlier|before|continue)\b/u.test(value) && memory) {
    return `I remember ${memory}. What feels most interesting about it now?`;
  }
  if (/\b(work|job|busy|stress|tired|shift)\b/u.test(value)) {
    return 'That sounds like a lot to carry. What would help the rest of your day feel a little lighter?';
  }
  if (/\b(travel|trip|city|beach|mountain|kyoto|hiking)\b/u.test(value)) {
    return 'That is a good conversation to wander into. Which part of that plan feels most inviting to you?';
  }
  if (/\b(food|cook|dinner|coffee|sourdough)\b/u.test(value)) {
    return 'Food can make an ordinary day feel warmer. What part of making it do you enjoy most?';
  }
  if (/\b(sad|lonely|upset|hurt)\b/u.test(value)) {
    return 'I hear that this has been difficult. Would you rather talk about what happened or choose a gentler topic for a while?';
  }
  if (/\b(art|watercolor|painting)\b/u.test(value)) {
    return 'I like hearing what catches your eye. What feeling do you hope the picture keeps?';
  }
  if (/\b(sport|lakers|game)\b/u.test(value)) {
    return 'Following a team can make an ordinary week more fun. What keeps you watching?';
  }
  if (memory) return `I remember ${memory}. Tell me what has changed since you mentioned it.`;
  return 'I am glad you shared that. What part would you like to talk about a little more?';
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
  const replyText = localResponse(text, history);
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
