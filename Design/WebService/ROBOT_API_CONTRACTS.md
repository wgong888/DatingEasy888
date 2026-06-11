# Robot Service API Contracts

Robot employees in this document are `Employees` service identities that may
perform approved company work. They are distinct from robot customers
(`CustomerProfile.Seed = 2`), which converse autonomously only with real
customers and do not receive employee seed assignments.

Robot-customer profile, city inventory, eight-hour work limit, and shift
coverage rules are defined in
`Product/ROBOT_CUSTOMER_WORK_POLICY.md` and administered through
`WebService/BACKEND_API_CONTRACTS.md`.

Status: version 1 design draft. Arfa 0.4 implements robot-customer work as a
headless internal service inside the Web Service; it does not provide a robot
chat UI or expose robot-only routes to customer clients.

## Arfa 0.4 Implemented Administration Contracts

`GET /api/v1/admin/robot-operations`
- Returns internal city coverage, robot inventory, active/upcoming shifts,
  global AI mode, budget limits, simulated usage totals, creation source, and
  review status.

`POST /api/v1/admin/robot-customers`
- Creates an inactive `CustomerProfile.Seed = 2` draft.
- Requires `creationMode`, `displayName`, `age`, `sex`, `countryCode`, `state`,
  and `city`.
- `creationMode = AutoFill` generates the remaining customer-visible fields.
- `creationMode = FullProfile` requires all customer-visible profile fields.
- Generates internal UUID, email, password hash, and provenance.
- Returns the fields that were auto-filled, profile completeness, and pending
  review status.
- Requires Administrator or CEO access and creates an audit event.

Example auto-fill request:
```json
{
  "creationMode": "AutoFill",
  "displayName": "Taylor",
  "age": 39,
  "sex": "Woman",
  "countryCode": "US",
  "state": "CA",
  "city": "Los Angeles"
}
```

Example response:
```json
{
  "customerId": "uuid",
  "displayName": "Taylor",
  "creationMode": "AutoFill",
  "autoFilledFields": ["birthDate", "lookingFor", "bio", "story"],
  "profileCompleteness": 100,
  "active": false,
  "reviewStatus": "Pending"
}
```

`PUT /api/v1/admin/robot-ai-policy`
- Sets the global `LocalOnly` or `HybridExternalAllowed` mode.
- Sets non-negative daily and monthly USD cost limits.
- Requires an administrator session and creates an audit event.

`POST /api/v1/admin/robot-city-coverage/{coverageId}/shifts/regenerate`
- Regenerates a future, unstarted city-local business date.
- Rejects a date whose shifts have started.

The customer message service invokes the background robot engine only when the
recipient is an active, scheduled robot customer. The customer response never
includes the internal customer type.

The remaining `/api/v1/robot` contracts below describe a possible later
standalone worker-service boundary. They are not a robot UI and are not
implemented in the Arfa prototype.

Base route: `/api/v1/robot`

Robot employees perform the same internally classified seed-conversation role
as human employees, under stricter service identity, lease, safety, and
escalation controls.

## 1. Robot Identity

### Get Identity
`GET /api/v1/robot/me`

Response:
```json
{
  "employeeId": "uuid",
  "employeeType": "Robot",
  "active": true,
  "paused": false,
  "capabilities": [
    "SeedConversation",
    "PreparedText",
    "AIAssistedReply"
  ],
  "policyVersion": "robot-policy-1"
}
```

### Heartbeat
`POST /api/v1/robot/heartbeat`

Request:
```json
{
  "status": "Available",
  "activeAssignments": 4,
  "softwareVersion": "1.0.0",
  "health": {
    "database": "NotDirectlyAccessed",
    "model": "Healthy"
  }
}
```

Robot never reports or receives database credentials.

## 2. Work Leasing

### Request Work
`POST /api/v1/robot/work/request`

Request:
```json
{
  "availableChatSlots": 6,
  "maximumAssignments": 6
}
```

Response:
```json
{
  "assignments": [
    {
      "assignmentId": "uuid",
      "leaseToken": "opaque-token",
      "leaseExpiresAt": "2026-06-07T18:31:00Z",
      "seedCustomerId": "uuid",
      "realCustomerId": "uuid",
      "conversationId": "uuid",
      "seedOnlineSecondsToday": 1800,
      "seedOnlineSecondsRemaining": 5400,
      "profilePresentationVersion": "profile-presentation-1"
    }
  ]
}
```

Rules:
- Same 20-active-seed and 10-chat limits apply unless later changed.
- Scheduler distributes work evenly according to approved fairness policy.
- Work is returned only to healthy, active, unpaused robot identities.

### Renew Lease
`POST /api/v1/robot/work/{assignmentId}/renew`

### Release Work
`POST /api/v1/robot/work/{assignmentId}/release`

Reason required.

## 3. Conversation Context

### Get Context
`GET /api/v1/robot/work/{assignmentId}/context`

Returns only data needed for the current assignment:
- Disclosed seed persona
- Real customer public/conversation context
- Recent messages
- Consent state
- Safety flags
- Approved prepared-text candidates
- Current-data requirements
- Remaining online time

Private payment, password, unrelated conversation, and admin data are excluded.

## 4. Response Generation And Submission

### Request Approved Suggestions
`POST /api/v1/robot/work/{assignmentId}/suggestions`

Robot may request only categories and content marked `RobotAllowed`.

### Submit Reply
`POST /api/v1/robot/work/{assignmentId}/messages`

Idempotency required.

Request:
```json
{
  "leaseToken": "opaque-token",
  "text": "Final response",
  "responseSource": "Robot",
  "preparedTextId": "uuid",
  "preparedTextVersion": 3,
  "safetyAssessment": {
    "level": "Low",
    "flags": []
  }
}
```

Server rules:
- Re-check active lease, limits, profile-integrity, consent, safety, and
  prepared-text status.
- Reject fabricated offline identity, physical-presence, and availability claims.
- Record robot identity and response source.
- Message is not allowed after seed daily time expires.

## 5. Escalation

### Escalate To Human
`POST /api/v1/robot/work/{assignmentId}/escalate`

Request:
```json
{
  "reasonCode": "SafetyConcern",
  "summary": "Customer expressed immediate danger.",
  "urgency": "Critical"
}
```

Mandatory escalation areas include:
- Self-harm or immediate danger
- Abuse or exploitation
- Unclear adult status
- Non-consensual or prohibited intimate content
- Legal, medical, or financial high-risk requests
- Repeated safety-filter failure
- Low-confidence identity/persona conflict
- Customer complaint about profile identity or representation

### Report Robot Failure
`POST /api/v1/robot/work/{assignmentId}/failure`

## 6. Pause And Control

### Get Pause State
`GET /api/v1/robot/control`

### Acknowledge Pause
`POST /api/v1/robot/control/pause-acknowledgement`

Only authorized administrators can set pause state through admin APIs.

## 7. Robot Metrics

### Submit Operational Metrics
`POST /api/v1/robot/metrics`

Includes:
- Assignment count
- Response count
- Response latency
- Suggestion usage
- Transfer count
- Safety escalation count
- Error count

No customer message content is included unless specifically required and authorized.

## 8. Robot Error Handling
- Expired lease: stop work and request reassignment.
- Human review required: do not retry message submission.
- Rate limited: honor retry guidance.
- Dependency unavailable: release or preserve lease according to response.
- Paused: stop requesting new work and safely release active assignments.
