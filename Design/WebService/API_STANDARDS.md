# Web Service API Standards

## 1. Protocol
- Base URL: `/api/v1`
- Transport: HTTPS in non-local environments
- Request and response format: JSON UTF-8
- Media upload: multipart form data or direct provider upload flow
- Timestamps: ISO 8601 UTC, for example `2026-06-07T18:30:00Z`
- IDs: UUID strings
- Currency: uppercase ISO 4217 code, initially `USD`
- Money: JSON decimal number with no floating-point calculation in business logic
- Credits: JSON integer

## 2. Authentication

### Customer And Human Employee Sessions
Proposed design:
- Short-lived access token
- Revocable refresh session
- Separate customer and employee login routes
- Session records include principal type, device, creation, expiry, revocation, and last activity

The final token transport decision remains open:
- Secure HTTP-only cookie, recommended for browser applications
- Bearer token, suitable for API clients

### Robot Authentication
- Robot employees use service identity credentials, not human passwords.
- Credentials are scoped, revocable, rotated, and never returned after creation.
- Robot requests include a stable robot employee ID and authenticated service principal.

### Provider Callbacks
- Payment-provider callbacks require signature verification.
- Callback body and provider event ID are stored for idempotent processing.

## 3. Authorization Roles
- `Customer`
- `Employee`
- `Moderator`
- `Finance`
- `Administrator`
- `SuperAdministrator`
- `RobotService`

Authorization is policy-based. A role name alone does not grant access to every route in that area.

## 4. Response Envelope

### Success
```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "req_01J..."
  },
  "error": null
}
```

### Failure
```json
{
  "success": false,
  "data": null,
  "meta": {
    "requestId": "req_01J..."
  },
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Please check the submitted fields.",
    "fields": {
      "displayName": ["Display name is required."]
    }
  }
}
```

## 5. HTTP Methods
- `GET`: retrieve without changing business state
- `POST`: create or execute a command
- `PUT`: replace/update a complete editable resource
- `PATCH`: update selected fields or state
- `DELETE`: remove, deactivate, or hide according to the resource policy

Financial and audit records are not physically deleted through normal APIs.

## 6. HTTP Status Codes
- `200 OK`: successful read or command
- `201 Created`: resource created
- `202 Accepted`: asynchronous job accepted
- `204 No Content`: successful command with no body
- `400 Bad Request`: malformed input
- `401 Unauthorized`: missing or invalid authentication
- `403 Forbidden`: authenticated but not allowed
- `404 Not Found`: resource missing or intentionally hidden
- `409 Conflict`: state, concurrency, or duplicate conflict
- `410 Gone`: expired one-time token or unavailable resource
- `413 Content Too Large`: upload exceeds policy
- `422 Unprocessable Content`: valid JSON but failed business validation
- `429 Too Many Requests`: rate limit
- `500 Internal Server Error`: unexpected failure
- `503 Service Unavailable`: dependency or maintenance outage

## 7. Pagination
Every API operation that returns a list uses cursor pagination and returns no
more than 20 records in one response.

Request:
```text
?cursor=opaque-token
```

Response metadata:
```json
{
  "page": {
    "limit": 20,
    "nextCursor": "opaque-token",
    "hasMore": true
  }
}
```

Rules:
- First request returns the first 20 records according to the endpoint's defined sort order.
- Page size is fixed at 20 for normal list requests.
- `hasMore=true` and `nextCursor` mean the UI displays a `Next` button.
- Selecting `Next` sends the opaque `nextCursor` and retrieves the next 20 records.
- If `hasMore=false`, the `Next` button is hidden or disabled.
- Normal UI lists do not automatically load the next page.
- Larger exports use asynchronous export jobs
- Cursor contents are opaque to clients

## 8. Filtering And Sorting
- Query parameter names use camelCase.
- Repeated filters use comma-separated values only when ordering is irrelevant.
- Sort uses `sort=field` or `sort=-field`.
- Unsupported filters or sort fields return `INVALID_QUERY`.

## 9. Idempotency
Required for:
- Credit checkout creation
- Charge confirmation
- Payment-provider callbacks
- Message send
- Gift send
- Registration reward grant
- Report generation/finalization
- Scheduled-task manual run
- Robot response submission

Clients send:
```text
Idempotency-Key: client-generated-unique-value
```

The same principal, route, and key return the original result. Reuse with a different request body returns `IDEMPOTENCY_CONFLICT`.

## 10. Concurrency
Editable resources expose a version:
```json
{
  "version": 7
}
```

Updates include:
```text
If-Match: "7"
```

A stale update returns `409 RESOURCE_VERSION_CONFLICT`.

Critical runtime assignments use lease tokens and expiry times instead of UI-provided state alone.

## 11. Validation
- Web Service validates every request independently of UI validation.
- Unknown properties may be rejected on financial, security, admin, and robot commands.
- Text-message word count is calculated server-side.
- Credit cost is calculated server-side and is never trusted from the client.
- Employee reward and gift split are calculated server-side.

## 12. Credit Cost Display And Direct Actions
The customer UI displays the exact cost beside each paid action before the
customer selects it. Ordinary message and gift actions do not use a separate
confirmation dialog or preview token. Selecting Send or a gift is the command
to perform the action.

The server always recalculates the current cost and checks the authoritative
balance before committing. The client never submits an authoritative price.
Checkout, account deletion, security changes, and other separately governed
workflows may still require confirmation.

For every command that changes customer credits:
- The business record, `CreditLedger` row, and
  `CustomerProfile.CreditsRemain` update commit in one SQL transaction.
- A deduction uses a database-enforced sufficient-balance condition.
- The successful response includes `creditBalance`, containing the newly
  committed `CustomerProfile.CreditsRemain` value.
- A failed or rejected command returns no speculative balance change.
- Insufficient credit rejects the entire action: no message, gift, recipient
  share, platform share, or ledger row is created.
- Clients replace their displayed balance with the server value; they do not
  calculate or optimistically deduct the authoritative balance.
- The Frontend may retain the latest server-confirmed value in session memory
  and mark it stale after reconnect, but it does not persist a balance to the
  Web Service.
- Logout, browser close, and session expiry are not balance-settlement events.
- If a request includes an optional client-known balance for diagnostics, the
  server never uses it to update SQL Server. A mismatch returns the committed
  balance and may be logged for reconciliation.
- Read caching may reduce repeated balance queries, but cache invalidation
  occurs only from a successfully committed server-side credit transaction.

## 13. Customer Type Visibility
Customer-facing profile and conversation responses omit customer type codes,
type names, seed/robot flags, and internal classification metadata. Authorized
employee and administration responses may include those fields when required
for routing or operations.

Allowed conversation pairs are real-real, real-seed, and real-robot. Any pair
containing two non-real customers fails with `CUSTOMER_TYPE_CHAT_NOT_ALLOWED`.

## 14. Audit
Every sensitive action records:
- Actor type and ID
- Effective role
- Target type and ID
- Action
- Before/after or command summary
- Reason when required
- Request ID
- Timestamp
- IP/device where available
- Result

Audit records are not editable through standard APIs.

## 15. Rate Limiting
Separate rate-limit buckets apply to:
- Registration and login
- Password reset
- Discovery/search
- Message and media send
- Gift send
- Payment checkout
- Reports and exports
- Admin security commands
- Robot polling and submission

Exact limits remain an operations decision.

## 16. Sensitive Data
Never returned by APIs:
- PasswordHash
- Full card number
- CVV/CVC/SecCode
- Card PIN/password
- Payment-provider secrets
- Cloud credentials
- Robot service secrets
- Private security-event evidence without permission

Card display uses only type, bank, expiration, and masked last four digits.

## 17. Asynchronous Operations
Long-running actions return `202 Accepted`:
```json
{
  "operationId": "uuid",
  "status": "Queued",
  "statusUrl": "/api/v1/admin/operations/uuid"
}
```

Operations support `Queued`, `Running`, `Succeeded`, `Failed`, and `Cancelled`.

## 18. Real-Time Events
SignalR is proposed for:
- Customer chat messages
- Read/unread updates
- Credit-balance updates
- Employee assignment changes
- Backend chat-panel updates
- Robot escalation alerts
- Scheduled-task status
- Security alerts

REST remains the source for initial state and recovery after reconnect.
