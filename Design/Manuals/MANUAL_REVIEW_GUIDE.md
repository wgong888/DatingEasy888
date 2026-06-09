# Manual Review Guide

Version: Consolidation Draft 1.0  
Purpose: organize the next discussion before the three manuals are approved.

## 1. Manual Set
- `CUSTOMER_MANUAL.md`: what customers see, understand, and do
- `EMPLOYEE_MANUAL.md`: how human employees operate virtual conversations
- `ADMIN_MANUAL.md`: how authorized staff govern accounts, safety, money, systems, and evidence

All manuals rely on `Product/PRODUCT_OPERATING_MODEL.md`.

## 2. Manual Status Labels
- Confirmed: directly supported by a recorded decision
- Recommended: design improvement proposed for approval
- Pending: cannot be published or trained as final
- Prohibited: must not be enabled
- Post-V1: intentionally outside the first-version boundary

## 3. Review Principles
During manual review, ask:
1. Can the reader complete the task without guessing?
2. Does the screen provide every control the manual requires?
3. Does the API have a corresponding operation?
4. Does the database preserve the required state and audit history?
5. Is cost shown before action?
6. Is profile identity clear?
7. Can the reader stop, recover, appeal, or escalate?
8. Does the behavior remain acceptable if it produces no revenue?

## 4. Highest-Priority Customer Decisions

### Customer Access
Confirmed:
- Customers must be at least 18 years old
- An eligible signed-in customer needs no employee or administrator approval
- Every enabled customer UI action may be used immediately
- Automatic balance, block, consent, rate-limit, account-state, and safety checks still apply
- Another customer's acceptance or consent is never bypassed
- Customer sessions automatically log out after twenty minutes without customer interaction
- Background refresh and incoming notifications do not keep an inactive customer session alive

### Navigation
Recommended:
- Discover
- Messages
- Feed
- Activity
- Me

Decision:
- Keep separate primary `Messages` and `Mail`, or combine them?
- Replace `People` with `Me`?
- Is Feed included in V1?

### Social Actions
Recommended:
- Like = visible interest signal
- Favorite = private bookmark
- Follow = Feed subscription

Decision:
- Confirm recipient notification behavior.

### Pricing
Decision required:
- Free versus paid message conditions
- Interaction-request costs
- Above-$100 formula
- Voice duration, processed byte limit, codec, and accepted source formats
- Refund/chargeback treatment
- Credit expiry

Confirmed media processing:
- Stored and delivered pictures use JPG or PNG
- Other safely readable image formats are automatically converted
- Customer profile and conversation pictures fit within 100 x 100 pixels
- Larger pictures are resized and compressed with aspect ratio preserved
- Conversation voice is automatically transcoded and compressed
- Failed processing consumes no credits

Confirmed gift handling:
- Successfully sent gifts are non-refundable
- Seed-recipient 80% credits go to the overseeing employee at gift time
- Attribution is snapshotted and does not change after reassignment

### Privacy
Decision required:
- Visitor visibility and retention
- Invisible browsing
- Presence visibility
- Read receipts
- Chat/mail deletion
- Data export and deletion

### Safety And Support
Decision required:
- Verification level
- Moderation response times and appeals
- Customer-support channels and hours
- Emergency disclaimer and escalation

## 5. Highest-Priority Employee Decisions

### Login
Confirmed:
- Every human employee enters a password and then a one-time code
- The code is sent to verified work email or verified mobile text
- At least one verified channel is mandatory
- Robot and service identities do not use this human login flow
- Successful login immediately authorizes normal assigned work
- No additional manager or administrator approval is required after login
- Employee must log out before leaving or going offline
- Ten minutes without employee interaction causes automatic logout

### Workload
Decision required:
- Resolve 20 cities x 100 seeds versus 1,000 seeds
- Transfer behavior at two-hour limit
- Whether one seed can hold multiple active customer chats
- Shift and response-time expectations

### Initiation
Decision required:
- Can virtual profiles initiate?
- If yes, frequency, cost, and profile-presentation rules

### AI And Robot
Decision required:
- Which categories may auto-send?
- Which always require employee approval?
- Which always transfer to safety/moderation?

### Compensation
Recommended:
- Base pay plus quality, safety, profile-integrity, and service measures
- Revenue share calculated only on net eligible revenue after refunds and policy exclusions
- Employees do not see customer spending targets

Decision:
- Whether the proposed 30% remains, and how it is calculated.

## 6. Highest-Priority Administrator Decisions

### Roles
Confirmed:
- Administrator can perform all operational Admin Backend functions
- Administrator cannot approve or release outgoing company payments
- Every outgoing company payment requires separate CEO approval

Decision required:
- Delegated specialist roles and exact permissions
- Super-admin boundaries
- CEO absence and emergency continuity procedure

### Moderation
Decision required:
- Severity levels
- Response and appeal times
- Evidence retention
- Legal reporting by launch jurisdiction

### Finance
Decision required:
- Reporting timezone
- Currency handling
- Refund and chargeback periods
- Report finalization and correction ownership
- CEO payment approval continuity when the CEO is unavailable

### Operations
Decision required:
- Task owners and retry limits
- On-call coverage
- Cloud and backup ownership
- Security-exception authority

### Policy Maintenance
Confirmed:
- Admin Backend has a dedicated Policy Maintenance UI
- Administrators can publish, schedule, retire, and roll back policies
- Policies are immutable, versioned, audited, and effective-dated
- Historical actions retain their original policy version
- Policies cannot contain secrets or bypass CEO outgoing-payment approval

Decision required:
- Final policy catalog and safe value ranges
- Which changes require advance customer notice
- Which emergency toggles are available

## 7. Cross-Manual Consistency Checklist
- Same profile-type names
- Same credit prices
- Same request types
- Same consent meaning
- Same account and conversation states
- Same block/report behavior
- Same employee limits
- Same customer-classification visibility rule
- Same privacy-access rule
- Same incident categories
- Same unresolved-policy labels

## 8. Proposed Discussion Sequence
1. Product positioning and customer navigation
2. Internal profile types, customer-facing presentation, and company-operated
   initiation
3. Social actions, messages, Mailbox, Visitors, and Feed
4. Credits, requests, media, gifts, refunds, and spending protections
5. Employee assignment, transfer, AI, robot, and compensation
6. Admin roles, moderation, privacy, and legal response
7. Reports, timezone, cloud operations, and incident response
8. Final manual wording and publication/training approval

## 9. Approval Result
When the manuals are settled:
- Move confirmed recommendations into `DECISIONS.md`.
- Remove resolved items from `OPEN_QUESTIONS.md`.
- Replace pending text in each manual with final instructions.
- Assign manual owner, approver, version, and effective date.
- Freeze the manual version used for API contract review.
