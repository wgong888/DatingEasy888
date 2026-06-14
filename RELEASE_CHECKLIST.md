# DatingEasy888 Arfa 0.4 Release Checklist

- [x] Customer, employee, administrator, and CEO workflows implemented
- [x] Customer, employee, administrator, and CEO can stay signed in together for review
- [x] Customer type conversation rules enforced
- [x] Robot scheduling, failover, city coverage, AI-mode, and admin creation workflows implemented
- [x] Atomic and idempotent paid commands covered
- [x] Temporary-password accounts blocked until password change
- [x] Administrator and CEO payment duties separated
- [x] Public health endpoint available
- [x] API/integration suite passes
- [x] Isolated desktop and mobile browser suite passes
- [x] Demo database can be reset deterministically
- [x] Prototype limitations documented

Run the release check:

```bash
npm run verify
```

Start a clean demo:

```bash
npm run demo
```
