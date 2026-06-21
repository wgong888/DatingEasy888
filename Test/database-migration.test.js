const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { openDatabase } = require('../Service/database');

test('existing prototype data is upgraded with robot inventory and AI policies', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'datingeasy-migration-'));
  const databasePath = path.join(directory, 'migration.sqlite');
  let db = openDatabase(databasePath);
  db.prepare(`
    DELETE FROM SeedProfileProvenance
    WHERE CustomerId IN (
      SELECT p.CustomerId FROM CustomerProfile p
      WHERE p.Seed = 2 AND p.DisplayName <> 'Daniel'
        AND NOT EXISTS (
          SELECT 1 FROM Conversations c
          WHERE c.CustomerAId = p.CustomerId OR c.CustomerBId = p.CustomerId
        )
    )
  `).run();
  db.prepare(`
    DELETE FROM CustomerProfile AS p
    WHERE p.Seed = 2 AND p.DisplayName <> 'Daniel'
      AND NOT EXISTS (
        SELECT 1 FROM Conversations c
        WHERE c.CustomerAId = p.CustomerId OR c.CustomerBId = p.CustomerId
      )
  `).run();
  db.prepare(`
    DELETE FROM PolicyDefinitions
    WHERE PolicyKey IN (
      'robot_ai_mode',
      'robot_ai_daily_budget_usd',
      'robot_ai_monthly_budget_usd'
    )
  `).run();
  db.prepare(`
    UPDATE CustomerProfile SET StateId = 'TX', CityName = 'Austin'
    WHERE Seed = 2
  `).run();
  db.prepare(`
    UPDATE PolicyDefinitions
    SET PolicyValue = '30'
    WHERE PolicyKey = 'robot_response_delay_seconds'
  `).run();
  db.close();

  db = openDatabase(databasePath);
  assert.equal(
    db.prepare('SELECT COUNT(*) AS value FROM CustomerProfile WHERE Seed = 2').get().value,
    412
  );
  assert.equal(
    db.prepare(`
      SELECT COUNT(*) AS value FROM CustomerProfile
      WHERE EmailNormalized LIKE 'platform-robot-%@virtual.datingeasy.test'
    `).get().value,
    400
  );
  assert.equal(
    db.prepare(`
      SELECT COUNT(*) AS value FROM CustomerProfile
      WHERE EmailNormalized LIKE 'platform-seed-%@seed.datingeasy.test'
    `).get().value,
    1000
  );
  assert.equal(
    db.prepare(`
      SELECT COUNT(*) AS value FROM PolicyDefinitions
      WHERE PolicyKey LIKE 'robot_ai_%'
    `).get().value,
    3
  );
  assert.equal(
    db.prepare(`
      SELECT PolicyValue FROM PolicyDefinitions
      WHERE PolicyKey = 'robot_response_delay_seconds'
    `).get().PolicyValue,
    '6'
  );
  db.close();
  fs.rmSync(directory, { recursive: true, force: true });
});

test('production database reset is blocked unless explicitly allowed', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'datingeasy-reset-guard-'));
  const databasePath = path.join(directory, 'guard.sqlite');
  const previousNodeEnv = process.env.NODE_ENV;
  const previousAllowReset = process.env.ALLOW_PRODUCTION_DATABASE_RESET;
  process.env.NODE_ENV = 'production';
  delete process.env.ALLOW_PRODUCTION_DATABASE_RESET;
  try {
    const { resetDatabase } = require('../Service/database');
    assert.throws(
      () => resetDatabase(databasePath),
      /Refusing to reset the production database/
    );
    assert.equal(fs.existsSync(databasePath), false);
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    if (previousAllowReset === undefined) delete process.env.ALLOW_PRODUCTION_DATABASE_RESET;
    else process.env.ALLOW_PRODUCTION_DATABASE_RESET = previousAllowReset;
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
