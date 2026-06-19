# DatingEasy888 Arfa Full Pre-Deploy Test Plan

Status: required release gate before every deploy  
Product version: Arfa 0.4 and later  
Primary command gate: `npm run verify`

## 1. Purpose

This plan is the full test checklist to run before any deploy to Render or any
other public test environment. A deploy is not ready until all five major
parties pass:

1. Real customer
2. Robot customer
3. Employee
4. Admin
5. Service online and system health

All tests use synthetic data only. No real customer card, phone, email, photo,
or private content should be used in local, test, staging, or Render public
test environments.

## 2. Release Gate

Before deploy, all of these must pass:

- `npm run verify`
- Manual role tests in this document
- Health endpoint check
- No open P0 or P1 defect
- No open P2 defect in login, chat, search, credits, robot reply, employee
  seed chat, admin robot operations, or service health
- Test evidence saved in the release notes or issue tracker

Suggested local command sequence:

```bash
npm ci
npm run reset
npm run verify
curl http://127.0.0.1:4173/api/v1/health
```

Suggested public smoke after deploy:

```bash
curl https://datingeasy.onrender.com/api/v1/health
PROTOTYPE_URL=https://datingeasy.onrender.com npm run test:browser
```

## 3. Test Evidence

For each deploy candidate, record:

- Git commit hash
- Test date and tester name
- Local test URL and public test URL
- `npm run verify` result
- Health check result
- Browser names and screen sizes used
- Pass/fail status for each major party
- Defect list with severity and retest result

Minimum browser coverage:

- Desktop Chrome or Edge
- Mobile width browser test around iPhone size
- Admin and employee large desktop width

## 4. Defect Severity

P0 blocks deploy:

- Service cannot start
- Login broken for any required role
- Chat cannot send or persist messages
- Credits can be lost, duplicated, or incorrectly increased
- Customer sees another customer's private session or chat history
- Admin/employee/CEO protected data is exposed to customers
- Online robot cannot reply at all

P1 blocks deploy:

- Search returns materially wrong results
- Add credits does not update balance or revenue
- Robot online/offline status does not match shift/admin state
- Employee cannot represent seed customers in chat
- Admin cannot activate/deactivate or edit robot profiles
- Health check fails or server becomes unavailable during normal testing

P2 blocks deploy when it affects a core flow:

- UI scroll, layout, or mobile usability prevents normal use
- Repeated robot phrases make the robot obviously broken
- Profile view hides required public fields or exposes private fields
- Admin overview counts are wrong

P3 can ship with approval:

- Text typo
- Minor style issue
- Non-critical report formatting issue

## 5. Party One: Real Customer

### RC-001: Register, Login, Logout, And Fresh Session

Purpose: verify that a real customer owns only their own session and data.

Steps:

1. Open the customer entry page in a clean browser session.
2. Create a new real customer account.
3. Fill country, state, city, sex, age, and required basic profile fields.
4. Save the profile.
5. Logout.
6. Confirm the UI returns to the initial login state.
7. Login as the same customer.
8. Confirm own profile, balance, and chat history are correct.

Expected:

- New account receives the registration credit reward.
- Profile save succeeds with required basic information.
- Optional profile fields can remain empty.
- The logout action clears customer state from the UI.
- New login does not show another customer's profile or chat history.

### RC-002: Profile View And Edit

Steps:

1. Click `ME`.
2. Review own profile.
3. Edit email and phone.
4. Edit at least one public field such as bio, short story, or about.
5. Save and reload.

Expected:

- `ME` opens the customer's own profile.
- Customer can edit email and phone on their own profile.
- Customer can edit public profile fields.
- Save persists after reload.
- Customer type, robot type, or seed type is never displayed.

### RC-003: View Another Customer Profile

Steps:

1. Open Discover.
2. Select a customer from the list.
3. Double click or open the selected profile.
4. Review public fields.
5. Go back to the list.

Expected:

- Public profile shows allowed content such as photo, display name, age,
  location, bio, short story, about, interests, and public profile details.
- Email, phone, payment data, password data, and internal type are hidden.
- Customer can choose chat or back after profile review.

### RC-004: Search And Discover Filters

Steps:

1. Search United States, California, Los Angeles, Woman.
2. Confirm only Los Angeles women are returned.
3. Change city from all cities to Los Angeles and run search again.
4. Toggle active only.
5. Toggle all.
6. Repeat with at least one other state and city.

Expected:

- Search button triggers every time after changing filters.
- Country, state, city, sex, and active filters all apply together.
- Active only shows only online/active customers for the selected filters.
- All shows active and inactive matching customers.
- Results are paged with top 20 records per request.

### RC-005: Chat With Real, Seed, And Robot Customers

Steps:

1. Start a chat with a real customer.
2. Send a text message.
3. Start a chat with a seed customer.
4. Send a text message.
5. Start a chat with an online robot customer.
6. Send a text message.
7. Send another message before receiving a reply.
8. Try sending when the other side is offline.

Expected:

- Sending a customer message costs five credits.
- No confirmation dialog interrupts sending.
- Message appears immediately in the sender's chat history after successful
  server save.
- Message saves even when the other side is offline.
- Customer can keep sending messages without waiting for an answer.
- If credits are insufficient, the message is not sent and the UI asks the
  customer to add credits.
- Return/Enter send behavior works according to the current UI rule.
- Chat panel is fixed size and scrollable.
- Chat people list is fixed size and scrollable.
- Partner type is never displayed to the real customer.

### RC-006: Gifts

Steps:

1. Open a chat.
2. Confirm gift icons are visible under the chat box in compact form.
3. Send a flower gift.
4. Send a higher-cost gift.
5. Try sending a gift that costs more credits than the customer has.

Expected:

- Gift costs are visible before sending.
- Gift send does not require confirmation.
- Customer balance reduces immediately after successful send.
- Gift appears in chat history.
- Gift is not sent when credits are insufficient.
- Gifts are not refundable.

### RC-007: Add Credits

Steps:

1. Open Add Credits.
2. Buy credits with a test Visa card.
3. Check customer balance.
4. Check company daily revenue and credits sold.
5. Logout and login again.

Expected:

- Add Credits button works.
- Credit package calculation is correct.
- Customer balance updates in UI.
- Customer balance persists after logout/login.
- Charge record is created.
- Company revenue summary includes the charge.
- No real card network is used in Arfa.

### RC-008: Mobile First Customer UI

Steps:

1. Open customer UI at mobile width.
2. Login.
3. Search.
4. View profile.
5. Chat.
6. Add credits.
7. Edit own profile.

Expected:

- Core customer workflows are usable on mobile browser.
- No required action depends on desktop-only hover behavior.
- Text, buttons, chat, lists, and profile fields do not overlap.
- Fixed chat areas remain scrollable.

## 6. Party Two: Robot Customer

### RB-001: Online Robot Always Ready For Chat

Steps:

1. In Admin Robot Operations, search online robots.
2. Select one online robot in Los Angeles.
3. Login as a real customer.
4. Chat with that robot.
5. Send a normal greeting, a question, and a follow-up.

Expected:

- Online robot appears active/online to customers.
- Online robot replies without employee UI.
- Reply delay is close to the configured value.
- Reply is saved in chat history.
- Reply is relevant to the latest message and recent history.
- Robot does not reveal that it is a robot.

### RB-002: Robot Uses Recent Chat History

Steps:

1. Tell an online robot a detail, such as work, travel, cooking, or mood.
2. Send a short follow-up such as `yes`, `tell me more`, or `what about you`.
3. Continue for several rounds.

Expected:

- Robot response uses the current topic and recent history.
- Robot does not answer every follow-up with the same generic phrase.
- Robot avoids repeating the same phrase too near in the conversation.
- Robot does not mix one customer's details into another customer's chat.

### RB-003: One Robot Chats With Ten Customers In Turn

Steps:

1. Use ten real customer sessions.
2. Select one online robot.
3. Send messages from all ten customers.
4. Continue multiple rounds for at least twenty minutes in a release soak test.
5. For normal local testing, use the accelerated automated version.

Expected:

- Robot handles all ten conversations independently.
- Every customer receives only their own replies.
- No duplicate robot replies are created.
- No message is lost.
- Robot stays within configured capacity and daily work policy.
- Customer credits are deducted only for customer messages, not robot replies.

Reference:

- `Design/Testing/ROBOT_CONVERSATION_CONCURRENCY_TEST_CASES.md`

### RB-004: Shift And Offline Behavior

Steps:

1. Check robot shift schedule for a coverage-ready city.
2. Confirm at least one male and one female robot are online.
3. Confirm off-shift robots are not shown as online.
4. Advance or simulate shift handoff.
5. Confirm outgoing robot goes offline and incoming robot goes online.

Expected:

- Every coverage-ready big city has online robot coverage according to policy.
- Each robot works no more than eight hours per day.
- Off-shift robots are not returned by active-only online robot search.
- Shift handoff does not leave the city without required coverage.
- Existing chat history remains attached to the original robot profile.

Reference:

- `Design/Testing/ROBOT_SHIFT_SCHEDULING_TEST_CASES.md`

### RB-005: Admin Created Robot

Steps:

1. Admin creates a robot with full profile fields.
2. Admin creates another robot with only name, age, living place, and sex.
3. Let the system auto-fill missing fields.
4. Activate a robot through admin workflow.
5. Edit the robot profile.

Expected:

- Full profile values are preserved.
- Auto-filled fields are complete and public-profile safe.
- Admin can edit robot profile.
- Admin can activate/deactivate robot according to policy.
- Customer public profile never exposes robot classification.

## 7. Party Three: Employee

### EM-001: Employee Login And Session

Steps:

1. Login as a chat employee.
2. Complete text or email verification if enabled in the environment.
3. Stay silent for more than ten minutes in a manual session test.
4. Login again.

Expected:

- Employee login requires verification.
- After successful login, no further approval is required for normal work.
- Silent employee workspace auto logs out after configured idle time.
- Employee can logout before going offline.

### EM-002: Four Panel Seed Chat Workspace

Steps:

1. Open employee work UI on a large desktop screen.
2. Confirm the screen is vertically divided into panels A, B, C, and D.
3. Confirm panel A is about 10%, panel B 15%, panel C 60%, and panel D 15%.
4. Confirm panel A lists active seeds.
5. Confirm panel D lists prepared text categories.

Expected:

- Layout is convenient on large desktop.
- Panel A, B, C, and D are visible together.
- No gift panel is shown in employee chat.
- Employee cannot send gifts.

### EM-003: Real Customer Starts Chat With Active Seed

Steps:

1. Login as a real customer.
2. Start a chat with a seed customer that is on an employee active seed list.
3. Login as the employee.
4. Confirm a green dot appears beside that seed in panel A.
5. Select the seed.
6. Confirm panel B shows real customers for that seed, newest first.
7. Select the top real customer.
8. Confirm panel C shows chat history for this seed/customer pair.
9. Select a prepared text from panel D.
10. Edit it.
11. Send it.

Expected:

- Employee is notified when a represented seed receives a message.
- Panel B lists the current seed's real-customer conversations.
- Most recent customer appears on top.
- Panel C displays only the selected seed/customer conversation.
- Prepared text inserts into the chat box.
- Employee can send directly or edit before sending.
- Real customer receives the seed response in chat history.

### EM-004: Manual Response And Prepared Text

Steps:

1. Select a seed and customer conversation.
2. Type a response manually.
3. Send it.
4. Select several prepared text categories.
5. Insert and send a prepared response.

Expected:

- Manual typed response works.
- Prepared text category selection works.
- Response is saved as seed customer chat.
- Customer sees the reply as coming from the seed profile.

### EM-005: Employee Profile Actions

Steps:

1. Select a seed customer.
2. Open the seed customer profile for edit.
3. Edit an allowed field.
4. Select the currently chatting real customer.
5. View the real customer's public profile.

Expected:

- Employee can edit seed profile fields allowed by policy.
- Employee can view current chatting customer's profile.
- Employee view includes needed work context but does not expose payment data.
- All changes are audited.

## 8. Party Four: Admin

### AD-001: Admin Login And Overview

Steps:

1. Login as admin.
2. Open Operation Overview.
3. Check real customer total and online count.
4. Check seed customer total and online count.
5. Check robot customer total and online count.
6. Check current day credits consumed and revenue.

Expected:

- Counts are visible and accurate for the current environment.
- Credits consumed is current day only.
- Revenue is current day only.
- Admin can refresh without stale data.

### AD-002: Customer Password Reset

Steps:

1. Submit a customer forgot-password request with full name and phone or email.
2. Confirm the system checks identity.
3. Confirm a generated password request enters admin waiting list.
4. Approve it manually.
5. Repeat with auto approve enabled.

Expected:

- Matching customer can receive reset.
- Non-matching request is rejected.
- Admin can approve reset.
- Auto approve policy works when enabled.
- New password is delivered through configured test email/SMS channel.
- Customer can later change password.

### AD-003: Employee Account Management

Steps:

1. Create a chat employee.
2. Create an admin.
3. Create a CEO account.
4. Edit each employee.
5. Disable one employee.
6. Try to login as disabled employee.

Expected:

- Admin can create, edit, and remove or disable employee accounts.
- Role values chat employee, admin, and CEO are enforced.
- Disabled employee cannot work.
- CEO approval rights are separate from normal admin rights.

### AD-004: Policy Maintenance

Steps:

1. Open Policy Maintenance.
2. Add a test policy.
3. Edit it.
4. Disable it.
5. Enable it.
6. Confirm policy affects related UI or service behavior.

Expected:

- Admin can add, edit, enable, and disable policies.
- Policy history is auditable.
- Invalid policy values are rejected.

### AD-005: Robot Operations

Steps:

1. Search robots by country, state, city, and online active state.
2. Search active only.
3. Search inactive/offline.
4. Select a robot.
5. Edit robot profile.
6. Activate the robot.
7. Deactivate the robot.
8. Confirm customer-facing visibility.

Expected:

- Robot search button works after every filter change.
- Active only returns only online robots.
- Off-shift but profile-active robots are not shown as online active.
- Admin can edit robot profile.
- Admin can activate/deactivate according to policy.
- Customer profile view does not expose robot classification.

### AD-006: System Health And Operations

Steps:

1. Open admin health view.
2. Check API, database, robot engine, scheduler, storage, and notification
   status.
3. Check recent errors.
4. Check scheduled tasks.
5. Check operation reports.

Expected:

- Admin can overlook system health.
- Admin can overlook operation status.
- Critical dependency failures are visible.
- Scheduled task status is visible.
- Reports load without blocking normal operations.

### AD-007: CEO Payment Boundary

Steps:

1. Login as admin.
2. Try to approve outgoing payment.
3. Login as CEO.
4. Open CEO approval waiting list.
5. Approve or deny an item.

Expected:

- Admin can do all normal admin work except outgoing payment approval.
- CEO can approve or deny outgoing payment items.
- Approval decision is audited.

## 9. Party Five: Service Online And System Health

### SH-001: Local Service Health

Steps:

1. Start local service.
2. Open customer, employee, admin, and CEO entry routes.
3. Run health endpoint.
4. Run `npm run verify`.

Expected:

- Service starts without error.
- Health endpoint returns healthy.
- All role entry pages load.
- Automated tests pass.

### SH-002: Public Service Health After Deploy

Steps:

1. Deploy to Render.
2. Wait for build and startup to finish.
3. Open `https://datingeasy.onrender.com/api/v1/health`.
4. Open customer UI.
5. Run public browser smoke with `PROTOTYPE_URL`.

Expected:

- Render service is reachable.
- Health endpoint returns healthy.
- Customer, employee, admin, and CEO smoke flows work.
- No server unavailable error during normal smoke.

### SH-003: Availability During Normal Use

Steps:

1. Keep several customer sessions open.
2. Send chat messages.
3. Search.
4. Add credits with test payment.
5. Run admin robot search.
6. Run employee seed chat.
7. Monitor logs during the test.

Expected:

- Server remains available.
- No unhandled exception appears in logs.
- No request hangs indefinitely.
- No service restart is required during normal role testing.

### SH-004: Data Safety And Isolation

Steps:

1. Login as customer A.
2. Chat and edit profile.
3. Logout.
4. Login as customer B in the same browser.
5. Check profile, chat history, favorites, and credits.

Expected:

- Customer B never sees customer A's profile, chat history, favorites, or
  credits.
- Logout clears browser state.
- Server APIs return only authenticated customer data.

### SH-005: Observability And Rollback Readiness

Steps:

1. Confirm deploy commit is known.
2. Confirm previous stable commit is known.
3. Confirm logs are available.
4. Confirm health check is configured.
5. Confirm deploy package exists.

Expected:

- Team can identify the running version.
- Team can inspect errors quickly.
- Team can roll back to the previous stable version if needed.
- Deploy package and GitHub source match the tested commit.

## 10. Pre-Deploy Sign-Off Table

| Party | Required result | Status | Notes |
|---|---|---|---|
| Real customer | Register, search, profile, chat, gifts, add credits pass | Pending |  |
| Robot | Online reply, ten-customer turn taking, shift behavior pass | Pending |  |
| Employee | Seed representation, prepared text, profile actions pass | Pending |  |
| Admin | Overview, password reset, employee, policy, robot operations pass | Pending |  |
| Service health | Local verify, public health, data isolation, stability pass | Pending |  |

Release decision:

- `Approved`: all required results pass and no blocking defects remain.
- `Rejected`: any P0/P1 exists or a core P2 remains unresolved.
- `Conditional`: only P3 defects remain and owner approves deployment.
