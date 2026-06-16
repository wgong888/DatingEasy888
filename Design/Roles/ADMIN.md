# Administrator Role Map

Purpose: administrator manages daily operations, employees, policies, payments, password resets, health, audit, and robot operations.

Core UI:
- `Back/admin.html`
- `Back/admin.js`
- `Back/staff.css`

Core APIs:
- `/api/v1/admin/dashboard`
- `/api/v1/admin/password-reset-requests`
- `/api/v1/admin/employees`
- `/api/v1/admin/outgoing-payments`
- `/api/v1/admin/policies`
- `/api/v1/admin/robot-operations`
- `/api/v1/admin/health`

Key rules:
- Admin cannot use employee-only backend workspace.
- Employee create/edit must include complete employee profile fields.
- Robot creation uses country/state/city dropdowns and creates inactive drafts.
- Policy saves must persist and version.

Primary tests:
- Admin API tests in `Test/prototype.test.js`.
- Admin browser flow in `Test/browser-smoke.js`.
