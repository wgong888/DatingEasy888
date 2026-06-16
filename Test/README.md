# Test Folder Map

Purpose: automated API, database, robot, and browser coverage for Arfa review.

Main files:
- `prototype.test.js`: broad API/integration behavior across roles.
- `robot-operations.test.js`: robot scheduling and robot conversation behavior.
- `database-migration.test.js`: existing database upgrade checks.
- `browser-smoke.js`: customer, employee, admin, and CEO browser flows.
- `run-browser-smoke.js`: starts an isolated server and runs browser smoke.

Common commands:
- Full verification: `npm run verify`.
- API/integration only: `npm test`.
- Browser only: `npm run test:browser`.
- Target one test name: `node --test --test-name-pattern "name" Test/prototype.test.js`.

Coverage expectations:
- Every visible critical button should have browser coverage.
- Every business rule should have API/integration coverage.
- Test data baseline is 200 real customers, 1,005 seed customers, and 412 robot customers.
- Permanent platform baseline includes 50 US major cities with 300 female robots,
  100 male robots, 750 female seed customers, and 250 male seed customers.
