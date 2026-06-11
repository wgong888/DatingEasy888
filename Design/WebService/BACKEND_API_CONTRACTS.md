# Employee And Admin Backend API Contracts

Status: version 1 design draft.

Base routes:
- Employee authentication: `/api/v1/auth/backend`
- Employee workspace: `/api/v1/backend`
- Administration: `/api/v1/admin`

## 1. Employee Authentication

### Login
`POST /api/v1/auth/backend/login`

Request:
```json
{
  "employeeIdOrLogin": "employee@example.com",
  "password": "submitted-over-tls",
  "deviceName": "Operations Desktop"
}
```

Response:
```json
{
  "verificationRequired": true,
  "challengeId": "uuid",
  "delivery": {
    "channel": "Email",
    "maskedDestination": "e***@company.example",
    "status": "Sent"
  },
  "availableChannels": [
    {
      "channel": "Email",
      "maskedDestination": "e***@company.example"
    },
    {
      "channel": "Sms",
      "maskedDestination": "***-***-0194"
    }
  ],
  "expiresAt": "2026-06-07T18:35:00Z"
}
```

This response does not create an authenticated employee session.

The login command sends a code to the employee's preferred verified channel.

### Select Or Resend Verification Channel
`POST /api/v1/auth/backend/login/verification/send`

Request:
```json
{
  "challengeId": "uuid",
  "channel": "Email"
}
```

The response never reveals the complete email address or mobile number and does
not reveal whether an unrelated account exists.

### Verify Login Code
`POST /api/v1/auth/backend/login/verification/confirm`

Request:
```json
{
  "challengeId": "uuid",
  "code": "123456",
  "deviceName": "Operations Desktop"
}
```

Successful response:
```json
{
  "employee": {
    "employeeId": "uuid",
    "employeeType": "Human",
    "roles": ["Employee"],
    "active": true
  },
  "session": {
    "expiresAt": "2026-06-07T20:00:00Z",
    "idleTimeoutSeconds": 600,
    "workApprovalRequired": false
  }
}
```

Rules:
- A human employee must have at least one verified email or SMS channel.
- Codes are short-lived, single-use, rate-limited, and attempt-limited.
- Resending invalidates the preceding code for that challenge.
- Codes and complete destinations are never logged.
- Password reset, suspension, channel change, or security action invalidates outstanding challenges.
- Robot and service identities cannot use these routes.
- Successful confirmation immediately permits normal role-authorized work.
- No separate manager or administrator work approval is required.

### Logout
`POST /api/v1/auth/backend/logout`

Logout revokes the session, changes the employee to `Offline`, blocks new sends,
releases or transfers active assignment leases, and records `ManualLogout`.
Employees must call logout before ending work or going offline.

### Refresh Session
`POST /api/v1/auth/backend/session/refresh`

Refresh never bypasses the ten-minute inactivity timeout. Background refresh,
polling, incoming messages, timers, and open tabs do not count as employee
activity.

### Session Activity And Idle Logout
The server maintains the authoritative last meaningful employee-interaction
time. Before timeout, the Frontend displays an inactivity warning.

After 600 consecutive seconds without employee interaction, the server:
- Revokes the session with reason `IdleTimeout`
- Rejects pending and new send commands from that session
- Changes the employee to `Offline`
- Preserves eligible drafts
- Releases or transfers active assignment leases
- Requires complete password-and-code login to return

### Activate Account
`POST /api/v1/auth/backend/activate`

### Forgot/Reset Password
- `POST /api/v1/auth/backend/password/forgot`
- `POST /api/v1/auth/backend/password/reset`

## 2. Employee Workspace

### Get Workspace Snapshot
`GET /api/v1/backend/workspace`

Response:
```json
{
  "employee": {
    "employeeId": "uuid",
    "displayName": "Employee A",
    "employeeType": "Human"
  },
  "capacity": {
    "assignedSeeds": 1000,
    "activeSeeds": 20,
    "maximumActiveSeeds": 20,
    "activeChats": 8,
    "maximumActiveChats": 10
  },
  "activeSeeds": [],
  "chatSlots": [],
  "alerts": [],
  "serverTime": "2026-06-07T18:30:00Z"
}
```

The response supports the four-panel workspace:
- Panel A derives from `activeSeeds`.
- Panel B filters `chatSlots` by the selected seed.
- Panel C displays the selected `chatSlots` conversation and composer.
- Panel D derives from approved prepared-text results.

Each `chatSlots` item identifies the assigned seed, current real customer,
waiting/responded state, and recent conversation history. The employee
represents the selected seed. No employee API exposes a gift-send command.

### Get Assigned Seeds
`GET /api/v1/backend/seeds`

Filters:
- `status=active|inactive|all`
- `countryCode`
- `state`
- `city`
- `cursor`

The response contains at most 20 records and follows the global `Next` cursor rule.

### Get Active Seed
`GET /api/v1/backend/seeds/{seedCustomerId}`

Includes internal profile classification and integrity status, daily online
seconds, remaining seconds, active conversation count, and assignment ownership.

### Request Seed Activation Refresh
`POST /api/v1/backend/workspace/active-seeds/refresh`

The scheduler, not the employee, chooses eligible seeds unless a later policy permits choice.

### Set Employee Availability
`PATCH /api/v1/backend/workspace/availability`

Request:
```json
{
  "status": "Available"
}
```

Values: `Available`, `Busy`, `Break`, `Offline`.

## 3. Work Assignments

### List Active Assignments
`GET /api/v1/backend/work-assignments`

### Accept Assignment
`POST /api/v1/backend/work-assignments/{assignmentId}/accept`

Request includes assignment version and lease token.

### Heartbeat Assignment
`POST /api/v1/backend/work-assignments/{assignmentId}/heartbeat`

Keeps the lease active and reports current UI/chat state.

### Transfer Assignment
`POST /api/v1/backend/work-assignments/{assignmentId}/transfer`

Request:
```json
{
  "reasonCode": "ShiftEnding",
  "comments": "Conversation is active."
}
```

### Complete Assignment
`POST /api/v1/backend/work-assignments/{assignmentId}/complete`

### Decline Assignment
`POST /api/v1/backend/work-assignments/{assignmentId}/decline`

Reason is required.

Rules:
- Employee cannot exceed 20 active seeds or 10 simultaneous chats.
- Lease ownership is checked on every conversation action.
- Seed daily online time cannot exceed 7,200 seconds.
- Transfers and time-limit closures are audited.

## 4. Employee Conversation Workspace

### Get Assignment Conversation
`GET /api/v1/backend/work-assignments/{assignmentId}/conversation`

Returns:
- Seed profile
- Real customer public/support context
- Internal profile classification and integrity state
- Conversation history
- Current adult-topic consent state
- Credits consumed
- Prepared-text suggestions
- Safety flags
- Lease expiry

Conversation history contains messages only for the assigned seed and current
real customer. The full permitted history is available through pagination; the
workspace snapshot includes the latest context needed to answer.

### Get New Messages
`GET /api/v1/backend/work-assignments/{assignmentId}/messages`

Cursor pagination.

### Send Employee Message
`POST /api/v1/backend/work-assignments/{assignmentId}/messages`

Idempotency required.

Request:
```json
{
  "text": "Suggested or edited response",
  "preparedTextId": "uuid-or-null",
  "leaseToken": "opaque-token"
}
```

Rules:
- Active assignment ownership is required.
- The customer-facing profile-presentation policy must be active.
- Without `preparedTextId`, the response is recorded as `EmployeeWritten`.
- With `preparedTextId`, the server compares the submitted text with the
  approved version and records `PreparedText` when unchanged or
  `PreparedEdited` when edited.
- Text passes safety, consent, and persona-integrity checks.
- Message audit identifies employee, seed, customer, prepared text, and AI-assistance state.

### Send Prepared Text
`POST /api/v1/backend/work-assignments/{assignmentId}/prepared-text/{preparedTextId}/send`

The employee may send the approved answer unchanged or submit edited final
text. The server records the resulting response source. Both paths require
current assignment ownership and conversation-context validation.

### Close Or Change Topic
`POST /api/v1/backend/work-assignments/{assignmentId}/conversation-action`

Actions:
- `ChangeTopic`
- `EndConversation`
- `Pause`
- `EscalateSafety`
- `TransferToHuman`

## 5. Prepared Text And AI Assistance

### Search Prepared Text
`GET /api/v1/backend/prepared-text`

Filters:
- `category`
- `subcategory`
- `tone`
- `relationshipStage`
- `language`
- `robotAllowed`
- `keyword`

Only approved and effective versions are returned to normal employees.

### Get Context Suggestions
`POST /api/v1/backend/work-assignments/{assignmentId}/suggestions`

Request:
```json
{
  "maximumSuggestions": 5,
  "preferredCategories": ["Greetings", "Travel"]
}
```

Response identifies:
- Prepared text
- AI-assisted suggestion
- Safety level
- Required consent
- Current-data requirement
- Human approval requirement

### Submit Suggestion Feedback
`POST /api/v1/backend/suggestions/{suggestionId}/feedback`

Records used, edited, rejected, unsafe, or irrelevant.

## 6. Employee Profile And Performance

### Get Own Employee Profile
`GET /api/v1/backend/me`

### Get Own Monthly Reports
`GET /api/v1/backend/me/monthly-reports`

Normal employees can view only authorized personal report fields.

### Get Own Work Metrics
`GET /api/v1/backend/me/metrics`

Metrics include workload, response time, seed online time, transfers, safety
escalations, attributed eligible revenue, and employee gift-credit balance.

## 7. Administrator Employee Accounts

Prototype administration roles are `ChatEmployee`, `Administrator`, and `CEO`.
Administrator and CEO accounts may enter the Admin Backend. Only CEO may
perform the separate outgoing-payment approval action.

### Operations Overview
`GET /api/v1/admin/dashboard`

Returns total and online counts for real, seed, and robot customers; current
UTC-business-day messages, credits consumed, and successful-charge revenue;
password-reset and conversation workload; health summary; and recent audit
events.

### Password Reset Queue
`GET /api/v1/admin/password-reset-requests`

`POST /api/v1/admin/password-reset-requests/{requestId}/approve`

`POST /api/v1/admin/password-reset-requests/{requestId}/reject`

Approval revokes customer sessions, installs a hashed one-time temporary
password, records the delivery channel, and requires a password change.

### List Employees
`GET /api/v1/admin/employees`

Filters:
- EmployeeType
- Active
- Role
- WorkField
- Start/leave date
- Search

### Create Employee
`POST /api/v1/admin/employees`

Request:
```json
{
  "employeeType": "Human",
  "loginEmail": "employee@example.com",
  "verificationChannels": [
    {
      "channel": "Email",
      "destination": "employee@example.com",
      "preferred": true
    },
    {
      "channel": "Sms",
      "destination": "+15550100194",
      "preferred": false
    }
  ],
  "sex": "Woman",
  "birthDate": "1990-01-01",
  "education": "Bachelor",
  "workField": "CustomerOperations",
  "startDate": "2026-06-08",
  "roles": ["Employee"]
}
```

Response never includes a password. It returns an activation workflow.

The local prototype returns a generated temporary password once to demonstrate
the activation workflow. Production sends activation through the approved
email/SMS provider and does not return plaintext credentials through the API.

### Create Robot Employee
`POST /api/v1/admin/robot-employees`

Returns service-credential setup metadata. Secret material, if generated, is displayed only once through an approved secure process.

### Get Employee
`GET /api/v1/admin/employees/{employeeId}`

### Update Employee
`PATCH /api/v1/admin/employees/{employeeId}`

### Remove Employee
`DELETE /api/v1/admin/employees/{employeeId}`

Removal is a soft deactivation that revokes sessions while preserving history.

### Change Employee Status
`POST /api/v1/admin/employees/{employeeId}/status`

Reason required.

### Assign Roles
`PUT /api/v1/admin/employees/{employeeId}/roles`

Elevated roles may require super-administrator approval.

### Revoke Sessions
`POST /api/v1/admin/employees/{employeeId}/sessions/revoke`

### Rotate Robot Credential
`POST /api/v1/admin/robot-employees/{employeeId}/credentials/rotate`

## 8. Seed Administration

### List Seed Assignments
`GET /api/v1/admin/seed-assignments`

### Assign Seed Customers
`POST /api/v1/admin/employees/{employeeId}/seed-assignments`

Supports validated batch assignment. Cannot exceed policy capacity.

### End Seed Assignment
`POST /api/v1/admin/seed-assignments/{assignmentId}/end`

### Rebalance Seed Assignments
`POST /api/v1/admin/seed-assignments/rebalance`

Asynchronous and auditable.

### Get Seed Daily Activity
`GET /api/v1/admin/seeds/{seedCustomerId}/daily-activity`

## 8A. Robot Customer Administration

### Create Robot Customer
`POST /api/v1/admin/robot-customers`

Supports:
- `FullProfile`: administrator supplies all customer-visible profile fields.
- `AutoFill`: administrator supplies name, age, sex, country, state/province,
  and city; the service generates the remaining profile fields.

The service generates the UUID and internal non-login credentials, sets
`Seed = 2`, records creation provenance and exact auto-filled fields, and
creates an inactive draft with pending review. Creation does not schedule,
publish, or allow the robot to chat.

### List Robot Customers
`GET /api/v1/admin/robot-customers`

Filters include city, sex, profile status, health, shift status, coverage
eligibility, and remaining daily seconds. This route exposes internal robot
classification only to authorized administrators.

### Get Robot Customer
`GET /api/v1/admin/robot-customers/{customerId}`

Returns the full editable profile, provenance, current city, current/next shift,
daily online seconds, health, and audit summary.

### Update Robot Profile
`PATCH /api/v1/admin/robot-customers/{customerId}/profile`

Reason and optimistic version are required. The command may edit normal profile
fields but cannot replace `CustomerId`, remove provenance, or convert the
profile into a real customer.

### Change Robot Status
`POST /api/v1/admin/robot-customers/{customerId}/status`

Supports activate, suspend, retire, and restore. Reason required.

### List City Coverage
`GET /api/v1/admin/robot-city-coverage`

Returns inventory by sex, current online coverage, reserves, next shifts,
coverage status, and active alerts.

### Create Or Update City Coverage
- `POST /api/v1/admin/robot-city-coverage`
- `PATCH /api/v1/admin/robot-city-coverage/{coverageId}`

Validates the approved large city, timezone, minimum three Man/three Woman
inventory, one-Man/one-Woman online requirement, and reserve readiness.

### Get Or Regenerate Shifts
- `GET /api/v1/admin/robot-city-coverage/{coverageId}/shifts`
- `POST /api/v1/admin/robot-city-coverage/{coverageId}/shifts/regenerate`

Regeneration is idempotent, reasoned, audited, and cannot schedule any robot
beyond 28,800 seconds per local day.

### Emergency Replace Shift
`POST /api/v1/admin/robot-shifts/{shiftId}/replace`

Activates an eligible same-sex reserve or approved overflow profile. It cannot
extend the failed robot's work limit.

### Get Robot Daily Activity
`GET /api/v1/admin/robot-customers/{customerId}/daily-activity`

### Get Robot AI Settings And Usage
`GET /api/v1/admin/robot-ai`

Returns:
- Active policy version
- `LocalOnly` or `HybridExternalAllowed`
- Approved provider and pinned model
- Provider health without credential data
- Input/output limits and timeout
- Daily/monthly call, token, estimated-cost, budget, fallback, and rejection totals

### Update Robot AI Policy
`PUT /api/v1/admin/robot-ai/policy`

Request example:
```json
{
  "mode": "HybridExternalAllowed",
  "provider": "OpenAI",
  "model": "gpt-4.1-mini-2025-04-14",
  "maxInputTokens": 2000,
  "maxOutputTokens": 120,
  "dailyBudgetUsd": 25,
  "monthlyBudgetUsd": 500,
  "timeoutMilliseconds": 8000,
  "reason": "Approved controlled Beta language assistance.",
  "resourceVersion": 4
}
```

Administrator reauthentication and optimistic version are required. Secrets
are prohibited. The command updates one global policy for every robot customer.
Disabling external AI prevents new calls immediately.

### Get Robot AI Usage
`GET /api/v1/admin/robot-ai/usage`

Filters include date range, city, robot, provider result, response source, and
cursor. Customer message content and full provider prompts are omitted.

## 9. Prepared Text Administration

### List All Prepared Text
`GET /api/v1/admin/prepared-text`

### Create Draft
`POST /api/v1/admin/prepared-text`

### Update Draft
`PUT /api/v1/admin/prepared-text/{preparedTextId}`

### Submit For Review
`POST /api/v1/admin/prepared-text/{preparedTextId}/submit`

### Approve Version
`POST /api/v1/admin/prepared-text/{preparedTextId}/approve`

### Retire Version
`POST /api/v1/admin/prepared-text/{preparedTextId}/retire`

Adult intimate, safety-sensitive, and robot-allowed content may require separate approval.

## 10. Moderation

### List Reports
`GET /api/v1/admin/moderation/reports`

### Get Report
`GET /api/v1/admin/moderation/reports/{reportId}`

### Assign Report
`POST /api/v1/admin/moderation/reports/{reportId}/assign`

### Resolve Report
`POST /api/v1/admin/moderation/reports/{reportId}/resolve`

Actions include dismiss, warn, remove content, suspend, ban, restore, or escalate.

### Review Photo
`POST /api/v1/admin/photos/{photoId}/moderation`

### Review Conversation Evidence
`GET /api/v1/admin/moderation/conversations/{conversationId}`

Requires explicit moderation permission, an approved report/safety/support/legal
purpose, a reason code, and a complete audit record. The response should expose
only the minimum conversation context needed for the review.

## 11. Security Administration

### Security Dashboard
`GET /api/v1/admin/security/overview`

### List Security Events
`GET /api/v1/admin/security/events`

### Get Security Event
`GET /api/v1/admin/security/events/{securityEventId}`

### Suspend Principal
`POST /api/v1/admin/security/principals/{principalType}/{principalId}/suspend`

### Revoke Principal Sessions
`POST /api/v1/admin/security/principals/{principalType}/{principalId}/sessions/revoke`

### Resolve Security Event
`POST /api/v1/admin/security/events/{securityEventId}/resolve`

Reason required for every security command.

## 12. Cloud Service Maintenance

### List Cloud Services
`GET /api/v1/admin/cloud-services`

### Create Cloud Service
`POST /api/v1/admin/cloud-services`

Request includes provider, service name, period, CPU, memory, disk, network, IP summary, database, backup, amount, currency, invoice, and status.

### Update Cloud Service
`PUT /api/v1/admin/cloud-services/{cloudServiceId}`

### Change Cloud Service Status
`POST /api/v1/admin/cloud-services/{cloudServiceId}/status`

### Expiration Alerts
`GET /api/v1/admin/cloud-services/alerts`

Credentials and connection secrets are prohibited.

## 13. Policy Maintenance

### List Policy Catalog
`GET /api/v1/admin/policies`

Filters:
- Category
- Status
- Scope
- Search

Returns the active version, scheduled version, data type, safe range, affected
components, customer-notice rule, and propagation health.

### Get Policy
`GET /api/v1/admin/policies/{policyKey}`

Returns:
- Typed schema and allowed values
- Current active version
- Draft and scheduled versions
- Version history
- Affected UI, API, job, and report areas
- Validation and notice requirements

### Create Draft
`POST /api/v1/admin/policies/{policyKey}/drafts`

Creates a draft from the active or selected historical version.

### Update Draft
`PUT /api/v1/admin/policies/{policyKey}/drafts/{policyVersionId}`

Request includes typed values, scope, reason, and expected draft version.
Executable code and secret-shaped fields are rejected.

### Validate Draft
`POST /api/v1/admin/policies/{policyKey}/drafts/{policyVersionId}/validate`

Returns blocking errors, warnings, affected components, estimated customer
impact, required notice, and before/after comparison.

### Publish Draft
`POST /api/v1/admin/policies/{policyKey}/drafts/{policyVersionId}/publish`

Request:
```json
{
  "effectiveAt": "2026-06-08T07:00:00Z",
  "reason": "Increase customer inactivity timeout to 20 minutes",
  "acknowledgedWarnings": []
}
```

An administrator may publish immediately or schedule activation. Publication
creates an immutable version and does not require another ordinary approver.
Outgoing-payment approval cannot be represented by a policy.

### Cancel Scheduled Version
`POST /api/v1/admin/policies/{policyKey}/versions/{policyVersionId}/cancel`

Allowed only before activation.

### Retire Policy
`POST /api/v1/admin/policies/{policyKey}/retire`

Requires a defined fallback or explicit feature disable behavior.

### Roll Back
`POST /api/v1/admin/policies/{policyKey}/rollback`

Request identifies the source historical version and reason. Rollback creates a
new version; it never edits or deletes history.

### Emergency Disable
`POST /api/v1/admin/policies/{policyKey}/emergency-disable`

Available only for pre-authorized kill-switch policies. It activates
immediately, records a security alert, and requires a reason.

### Get Propagation Health
`GET /api/v1/admin/policies/{policyKey}/propagation`

Shows the active policy version reported by each consuming service and job.

Policy commands require idempotency and complete audit records. Completed
transactions retain the policy-version identifier used at execution.

## 14. Audit

### Search Audit Logs
`GET /api/v1/admin/audit-logs`

Filters:
- Actor
- Target
- Action
- Result
- From/to
- Request ID

### Get Audit Record
`GET /api/v1/admin/audit-logs/{auditLogId}`

No update or delete contract exists.

## 15. Backend Real-Time Events
- `workspace.seedActivated`
- `workspace.seedDeactivated`
- `workspace.assignmentCreated`
- `workspace.assignmentTransferred`
- `workspace.messageCreated`
- `workspace.safetyEscalated`
- `workspace.capacityChanged`
- `admin.securityAlert`
- `admin.taskStatusChanged`
- `admin.reportStatusChanged`
- `admin.policyPublished`
- `admin.policyActivated`
- `admin.policyPropagationFailed`
