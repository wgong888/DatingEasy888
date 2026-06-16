# Customer Role Map

Purpose: real customer can register, complete profile, discover people, chat, buy credits, send gifts, and manage favorites.

Core UI:
- `Front/index.html`
- `Front/app.js`
- `Front/styles.css`

Core APIs:
- `/api/v1/auth/customer/*`
- `/api/v1/customer/me`
- `/api/v1/customer/discovery/profiles`
- `/api/v1/customer/profiles/:customerId`
- `/api/v1/customer/conversations/*`
- `/api/v1/customer/credits/*`

Required chat matrix:
- Real to real: allowed.
- Real to robot: allowed.
- Real to seed: allowed.
- Non-real to non-real: blocked.

Primary tests:
- `Test/prototype.test.js`
- `Test/browser-smoke.js`
