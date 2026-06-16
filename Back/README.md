# Back Folder Map

Purpose: staff browser UIs for employee, administrator, and CEO roles.

Main files:
- `employee.html`, `employee.js`: employee seed-chat workspace.
- `admin.html`, `admin.js`: administrator operations console.
- `ceo.html`, `ceo.js`: CEO dashboard and payment approval.
- `staff.css`: shared staff UI styles.

Primary roles:
- Employee.
- Administrator.
- CEO.

Common tasks:
- Employee seed response issues: start in `employee.js`, then check `/api/v1/backend/*` in `Service/app.js`.
- Admin button/form issues: start in `admin.js` and `admin.html`, then check `/api/v1/admin/*`.
- CEO dashboard/payment issues: start in `ceo.js`, then check `/api/v1/ceo/*`.

Before changing:
- Run syntax checks for changed JS files, for example `node -c Back/admin.js`.
- Run `npm run test:browser` for role UI behavior.
