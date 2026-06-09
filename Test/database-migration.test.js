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
  db.close();

  db = openDatabase(databasePath);
  assert.equal(
    db.prepare('SELECT COUNT(*) AS value FROM CustomerProfile WHERE Seed = 2').get().value,
    8
  );
  assert.equal(
    db.prepare(`
      SELECT COUNT(*) AS value FROM CustomerProfile
      WHERE Seed = 2 AND StateId = 'CA' AND CityName = 'Los Angeles'
    `).get().value,
    8
  );
  assert.equal(
    db.prepare(`
      SELECT COUNT(*) AS value FROM PolicyDefinitions
      WHERE PolicyKey LIKE 'robot_ai_%'
    `).get().value,
    3
  );
  db.close();
  fs.rmSync(directory, { recursive: true, force: true });
});
