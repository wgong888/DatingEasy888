# DatingEasy888 Arfa Version 0.4

This is the completed runnable prototype for product review.

## Run

```bash
npm start
```

For a clean demonstration database:

```bash
npm run demo
```

Open:

- Customer: `http://127.0.0.1:4173`
- Employee: `http://127.0.0.1:4173/employee`
- Administrator: `http://127.0.0.1:4173/admin`
- CEO: `http://127.0.0.1:4173/ceo`

From another computer on the same trusted local network, replace `127.0.0.1`
with the development Mac's current LAN address. For example:

- Customer: `http://192.168.1.5:4173`
- Employee: `http://192.168.1.5:4173/employee`
- Administrator: `http://192.168.1.5:4173/admin`
- CEO: `http://192.168.1.5:4173/ceo`

The Mac must remain awake and the prototype server must remain running. Its LAN
address may change after reconnecting to Wi-Fi.

## Prototype Accounts

| Area | Email | Password |
|---|---|---|
| Customer | `demo@datingeasy.test` | `Demo123!` |
| Employee | `operator@datingeasy.test` | `Demo123!` |
| Administrator | `admin@datingeasy.test` | `Demo123!` |
| CEO | `ceo@datingeasy.test` | `Demo123!` |

## Included

- Customer registration, sign-in, logout, and 18+ validation
- Required country, state/province, and city during registration
- First-login profile completion through Me
- Full profile fields from the nine profile-reference screens
- Required main photo with sex-based illustrated fallback portraits
- JPG/PNG profile-photo resizing to a 100 x 100 pixel boundary
- One-time 50-credit registration reward
- Responsive profile discovery using original synthetic portraits
- Customer-facing profiles hide internal real, seed, and robot classifications
- Three customer types: real, employee-operated seed, and autonomous robot
- Enforced real-real, real-seed, and real-robot conversation matrix
- Immediate prototype robot-customer responses with no employee assignment,
  including direct chats with non-scheduled robot profiles such as Grace
- Profile detail and favorites
- Double-click conversation avatars to open the partner profile
- Add or remove the active chat partner from Favorites in the chat header
- Messages-first login with newest conversation activity first
- Own-profile review and editing through Me
- Discover/search/favorites profile-to-chat navigation with city, age, sex,
  and orientation-aware filtering
- Conversations and five-credit text messages
- Direct message sending without confirmation dialogs
- Send messages with the Send button or Enter; Shift+Enter creates a new line
- Immediate button press/busy feedback for slower customer actions
- Phone-sized chat layout with easy-tap composer and Send button
- In-chat gift panel below the message composer with atomic credit checks and
  recipient allocation
- Atomic message, balance, and ledger transaction
- Idempotent message retry protection
- Working Arfa credit checkout with package selection and masked card metadata
- Card validation without storing full card numbers or security codes
- Employee four-panel desktop workspace with 20 active-seed and 10-conversation capacity
- 10% seed list, 15% real-customer list, 60% main chat, and 15% prepared-text files
- Single focused employee composer with no gift controls
- Assigned seed-to-real-customer histories with waiting/responded status
- Green incoming-message indicators on active seeds and newest-first customer queues
- Employee-written, prepared-edited, and prepared-unchanged response paths
- Internal employee/source audit while the selected seed remains the sender
- Administrator total/online customer metrics and current-day credits/revenue
- Customer password-reset request, approval queue, temporary password, and forced change
- Chat employee, administrator, and CEO account create/edit/remove workflows
- Role-specific review sessions so customer, employee, administrator, and CEO
  tabs can remain signed in in the same browser during Arfa review
- Policy add/edit/enable/disable with version increments
- Refreshable system health, operation status, and audit activity
- Four-panel CEO dashboard with period finance, online presence, health, and outgoing-payment decisions
- Administrator outgoing-payment preparation and audited handoff to the CEO queue
- SQLite prototype database following the approved relational design
- Automated API and browser smoke tests

The current automated suite contains 39 API/integration tests, including
explicit real-to-real, real-to-robot, and real-to-seed chat cases plus robot
shift scheduling, robot failure replacement, administrator robot creation,
outside-AI policy simulation, same-browser four-role review sessions,
orientation-aware Discover filtering, direct Grace robot chat, and one robot
customer handling ten real-customer conversations concurrently. It also
reconciles a real customer's simulated Visa purchase across customer credits,
charge history, credit ledger, and company income.

## Deliberately Simulated

- Payment-provider checkout
- Email/SMS employee verification
- Real-time SignalR delivery
- Production AI-quality robot replies (the prototype uses governed deterministic responses)
- Cloud media processing/storage
- SQL Server and ASP.NET Core deployment

The public API paths and business boundaries follow the approved `/api/v1`
contracts so the production C#/SQL Server implementation can replace the local
Node.js/SQLite prototype without redesigning the customer workflow.

## Verify

```bash
npm run verify
```

`verify` runs API/integration tests and a full isolated customer, employee,
administrator, and CEO browser suite against a temporary database.

Reset local data:

```bash
npm run reset
```

## Suggested Review

Customer:
1. Sign in and confirm Messages opens first.
2. Open Discover, review a profile, then start Chat.
3. Send a five-credit message from the profile chat and from an existing
   conversation in Messages, then send a Flower gift.
4. Try a gift that costs more than the remaining balance.
5. Open Favorites and edit the profile under Me.

Employee:
1. Send a customer message to an employee-operated seed such as Maya.
2. Confirm Maya shows a green notification dot in Panel A and select her.
3. Confirm the newest customer is first in Panel B and select that customer.
4. Review the complete seed/customer conversation in Panel C.
5. Select a prepared-text file in Panel D and confirm it enters the composer.
6. Send it unchanged or edit it first, then confirm it appears as the selected seed.

Administrator:
1. Review total/online customer metrics and current-day credits/revenue.
2. Submit a customer recovery request, then approve it in Password resets.
3. Create, edit, and remove an employee account.
4. Add, edit, enable, and disable a policy.
5. Prepare an outgoing payment and confirm it enters the CEO queue.
6. Refresh system health and review operation status and audit activity.

CEO:
1. Review current-year, month, and day revenue, expense, and net values.
2. Review online real customers, employees, seeds, and robots.
3. Review system health.
4. Select a pending outgoing payment, inspect its details, and approve or deny it.

Record anything confusing, missing, slow, or visually awkward. Screenshots and
the exact role/action make the next improvement pass especially useful.
