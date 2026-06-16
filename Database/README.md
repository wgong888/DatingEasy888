# Database Folder Map

Purpose: SQLite schema and database-level constraints.

Main file:
- `schema.sql`: tables, indexes, triggers, and constraints.

Important rules:
- `CustomerProfile.Seed`: `0` real customer, `1` employee-operated seed, `2` autonomous robot.
- Conversations are allowed only when at least one side is a real customer.
- `EmployeeSeed` may reference only seed customers.

Common tasks:
- Add a column: update `schema.sql`, add a migration in `Service/database.js`, and update seed data/tests.
- Change a relationship rule: update triggers here and matching API validation in `Service/app.js`.
- Change test data volume: update `Service/database.js`; do not hardcode rows directly in `schema.sql`.

Before changing:
- Run database migration tests: `node --test Test/database-migration.test.js`.
- Run `npm run verify` before release.
