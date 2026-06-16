# CEO Role Map

Purpose: CEO reviews company status and approves or denies outgoing payments.

Core UI:
- `Back/ceo.html`
- `Back/ceo.js`
- `Back/staff.css`

Core APIs:
- `/api/v1/ceo/dashboard`
- `/api/v1/ceo/outgoing-payments/:requestId/approve`
- `/api/v1/ceo/outgoing-payments/:requestId/deny`

Key rules:
- CEO dashboard has finance, online presence, health, and approval panels.
- CEO exclusively decides outgoing-payment requests.
- Admin prepares outgoing payments but does not approve them.

Primary tests:
- CEO API tests in `Test/prototype.test.js`.
- CEO browser flow in `Test/browser-smoke.js`.
