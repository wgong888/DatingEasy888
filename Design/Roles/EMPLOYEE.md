# Employee Role Map

Purpose: chat employee operates assigned seed customer profiles and responds to real customers.

Core UI:
- `Back/employee.html`
- `Back/employee.js`
- `Back/staff.css`

Core APIs:
- `/api/v1/auth/staff/login`
- `/api/v1/backend/workspace`
- `/api/v1/backend/conversations/:conversationId/messages`

Key rules:
- Employee replies only as assigned seed customers.
- Employee workspace should not show gift controls.
- Seed outgoing replies must keep the selected seed as sender.

Primary tests:
- Employee response tests in `Test/prototype.test.js`.
- Employee browser flow in `Test/browser-smoke.js`.
