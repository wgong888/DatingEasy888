# Service Folder Map

Purpose: Node HTTP service, API routes, database seeding, auth/security helpers, and robot engine.

Main files:
- `server.js`: starts the local HTTP server.
- `app.js`: API routing and business behavior.
- `database.js`: schema bootstrap, migrations, seed/review data.
- `robot-engine.js`: robot shift scheduling and robot reply logic.
- `security.js`: password hashing, token, request hashing helpers.
- `reset-database.js`: local database reset entrypoint.

Common tasks:
- Customer API issue: inspect `/api/v1/customer/*` handlers in `app.js`.
- Employee workspace issue: inspect `/api/v1/backend/*` handlers in `app.js`.
- Admin issue: inspect `/api/v1/admin/*` handlers in `app.js`.
- CEO issue: inspect `/api/v1/ceo/*` handlers in `app.js`.
- Test data issue: inspect `database.js`.
- Robot scheduling/reply issue: inspect `robot-engine.js` and robot routes in `app.js`.

Before changing:
- Run `node -c Service/app.js` and syntax-check any changed service file.
- Run targeted tests when possible, then `npm run verify`.
