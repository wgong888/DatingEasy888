# DatingEasy888 Product Operating Model

Status: consolidation draft for manual review. Confirmed policies remain authoritative; recommendations in this document require approval before implementation.

## 1. Purpose
This document gives the Customer, Employee, and Administrator manuals one shared model of how DatingEasy888 works.

It defines:
- Product language
- Customer information architecture
- Account and workflow states
- Cross-role responsibilities
- Recommended first-version boundaries
- Decisions that must be settled before the manuals are approved

## 2. Product Promise
DatingEasy888 is an 18+ social dating and conversation website supporting:
- Real members operating their own profiles
- Seed customers operated through assigned company employees
- Robot customers that respond through approved autonomous systems

Customers should always understand:
- Whether an interaction is free or paid
- What an action will do
- How to stop, block, report, or withdraw consent
- When company staff or automation may be involved

## 2A. Customer Self-Service Authority
An authenticated customer who is at least 18 years old does not wait for an
employee or administrator to approve normal product use. The customer may
immediately use every enabled action displayed by the customer UI.

The UI exposes only actions currently allowed by automatic product rules. An
action may depend on credits, account state, recipient block state, consent,
rate limits, verification, or service availability. Another customer's consent
or acceptance is never replaced by platform access.

Customer sessions use a twenty-minute inactivity timeout. Meaningful customer
interaction resets the timer; background refresh and incoming activity do not.
This is separate from the ten-minute employee inactivity timeout.

## 2B. Customer Credit Balance
`CustomerProfile.CreditsRemain` is the customer's authoritative current
spendable balance and is the number displayed by the customer UI.

For every credit purchase, reward, paid message, media message, gift, refund,
chargeback, or approved correction, the business record, `CreditLedger` entry,
and `CreditsRemain` change commit in one database transaction. A successful API
response returns the newly committed balance so the current UI updates
immediately. Real-time events and the three-minute reconciliation keep other
open customer sessions consistent. A failed or rejected action changes neither
the business record nor the balance.

## 3. Shared Terminology

| Term | Meaning |
|---|---|
| Customer | A registered platform account |
| Real member | A customer operating their own profile |
| Seed customer | `CustomerProfile.Seed = 1`; internally classified profile operated through an assigned employee |
| Robot customer | `CustomerProfile.Seed = 2`; internally classified profile that responds autonomously to real customers |
| Employee | A human company worker |
| Robot employee | A managed service identity performing approved automated work |
| Administrator | An employee with controlled administrative permissions |
| CEO payment approver | Separate authenticated authority required to approve every outgoing company payment |
| Conversation | The durable relationship/thread between two profiles |
| Chat | Short conversational messages inside a conversation |
| Mailbox | Optional longer-form messages inside the same Messages area |
| Interaction request | Hello, Cuddle, Hug, Flirt, Teasing, or Intimate Chat invitation |
| Intimate Chat | Customer-facing name for internal `SexRequest` |
| Favorite | A private saved-profile bookmark |
| Like | A lightweight interest signal that may notify the recipient |
| Follow | Subscription to eligible public feed/activity updates |
| Visitor | An eligible customer whose full-profile view may be shown under privacy rules |
| Credit | Non-cash platform unit used for approved paid actions |

Customer-type conversation matrix:
- Real to real: allowed
- Real to seed: allowed; the seed side is handled through its employee
- Real to robot: allowed; the robot side responds autonomously
- Seed to seed, seed to robot, and robot to robot: prohibited

A robot customer is not a robot employee. Robot customers live in
`CustomerProfile`; robot employees live in `Employees`.

## 4. Recommended Customer Information Architecture
The current references contain overlapping navigation labels. The recommended structure is:

### Primary Navigation
1. `Discover`
   - All
   - Online
   - Following
   - Search filters
2. `Messages`
   - Chats
   - Mailbox
   - Requests
3. `Feed`
   - All posts
   - Following
4. `Activity`
   - Visitors
   - Likes
   - Favorites
   - Notifications
5. `Me`
   - Profile
   - Credits
   - Settings
   - Security
   - Help

On smaller screens, only the five primary destinations appear in bottom navigation. The header account drawer provides alternate access to Profile, Visitors, Credits, Settings, Logout, and Home.

### Why This Is Recommended
- `Search` becomes the broader and clearer `Discover`.
- Chats and Mailbox remain available without consuming two primary navigation positions.
- Requests, Visitors, Likes, and notifications have one understandable home.
- `People` becomes `Me`, avoiding confusion with discovery.
- Favorites and Following receive distinct meanings.

This recommendation requires manual discussion before it becomes confirmed.

## 5. Social Action Definitions

### Like
- One-time expression of interest
- Recipient may receive a notification
- Does not start a conversation
- Can be removed

### Favorite
- Private bookmark for the customer
- Used to quickly return to a profile
- Does not notify the other customer by default

### Follow
- Subscribes to eligible public feed/activity updates
- Does not grant access to private information
- Can be removed without blocking

### Interaction Request
- Structured invitation with an approved template
- Recipient can accept, decline, ignore, block, or report
- No response is not consent
- Intimate Chat starts a separate mutual-consent flow

### Message
- User-authored communication
- May consume credits
- Requires an existing or newly created conversation

## 6. Customer Account State Model
Recommended states:

| State | Customer Experience |
|---|---|
| PendingVerification | Account exists but required contact/age checks are incomplete |
| ProfileIncomplete | Customer can finish setup but has limited discovery/messaging |
| Active | Immediate use of every enabled customer UI action without staff approval |
| Limited | Selected features restricted because of risk, verification, spending, or policy state |
| Suspended | Temporary sign-in or interaction restriction |
| Banned | Indefinite platform prohibition |
| Deactivated | Customer voluntarily disables account; restoration may be possible |
| DeletionPending | Deletion requested; retention/legal checks in progress |
| Deleted | Customer-facing account removed, with required records retained separately |

One `Active` Boolean is not sufficient for the finished product.

## 7. Profile State Model
Recommended states:
- Draft
- PendingReview
- Visible
- HiddenByCustomer
- Restricted
- Suspended
- Retired

Virtual profiles also require:
- Provenance approved
- Profile-presentation policy version active
- Assigned/Unassigned
- Eligible/Ineligible for activation

## 8. Conversation State Model
Recommended states:
- Requested
- Active
- Muted
- Archived
- Blocked
- SafetyHold
- Closed

Conversation state is separate from:
- Presence
- Intimate-consent state
- Employee/robot assignment
- Credit balance

## 9. Message And Delivery States
Recommended message states:
- Draft, local only
- Pending
- Accepted
- Delivered
- Read, only if policy permits
- Failed
- Restricted
- RemovedByModeration

Retries must never create duplicate charges or duplicate messages.

## 10. Presence Model
Customer-visible presence:
- Online
- Recently Active
- Offline
- Hidden

Presence is approximate. It does not promise that the person is reading, available to reply, or physically near the listed city.

## 11. Profile Visit Model
- Only opening an eligible full profile creates a visit.
- Search-card impressions do not create visits.
- Repeated visits may collapse into one record.
- Internal employee, admin, moderation, robot, safety, and automated-service access does not create visible visits.
- Blocked relationships do not expose visits.
- Customers must be informed before visit visibility is enabled.

## 12. Customer Interaction Lifecycle
1. Discover profile
2. Review public profile information
3. Like, favorite, follow, request, or message
4. See the exact cost before a paid action
5. Receive or send response
6. Continue, mute, archive, block, report, or withdraw consent
7. Review history, credits, and account controls

### Customer Media Processing
- Stored and delivered picture derivatives use JPG or PNG.
- Safely readable source formats are automatically converted; transparent
  images use PNG and ordinary photographs use JPG.
- Customer-uploaded profile and conversation pictures are resized and compressed
  to fit within 100 x 100 pixels while preserving aspect ratio.
- Smaller pictures are not enlarged.
- Conversation voice files are automatically transcoded and compressed.
- Failed processing does not publish, send, or consume credits.
- Voice duration, codec, and processed byte limit still require approval.

### Gift Allocation
- A successfully sent gift is final and non-refundable.
- A real-member recipient receives the 80% recipient credit share.
- For a seed recipient, the 80% share is credited to the employee overseeing the
  seed at gift time.
- Gift attribution snapshots the overseeing employee and is not changed by
  later reassignment.
- The platform retains 20%.

## 13. Virtual-Profile Conversation Lifecycle
1. Virtual profile is approved and assigned.
2. System activates it within employee/robot limits.
3. Customer sees the standard customer profile without internal classification.
4. Customer or virtual profile initiates only under the approved initiation policy.
5. Work is leased to one human or robot.
6. Reply uses employee-written, prepared, AI-assisted, or robot source metadata.
7. Safety, consent, quality, and time limits are checked.
8. Conversation closes, pauses, or transfers without losing context.
9. Quality and customer-profile presentation are reviewed independently of revenue.

## 14. Cross-Role Handoffs

### Customer To Support
Triggers:
- Account access
- Billing question
- Credit discrepancy
- Product problem
- Privacy request

Support receives only necessary account context.

### Customer To Moderation
Triggers:
- Report
- Harassment
- Discrimination
- Threat
- Unwanted sexual content
- Impersonation

Moderation receives only relevant evidence.

### Employee To Safety/Moderator
Triggers:
- Self-harm
- Abuse
- Exploitation
- Credible threat
- Minor-safety issue
- Doxxing
- Non-consensual intimate media

Employee stops ordinary conversation and transfers through the approved workflow.

### Robot To Human Employee
Triggers:
- Low confidence
- Safety-sensitive topic
- Consent ambiguity
- Payment dispute
- Customer asks for a human
- Policy or persona conflict

### Finance To Security/Moderation
Triggers:
- Fraud
- Extortion
- Unusual spending
- Employee-linked spending pressure
- Chargeback pattern

### Administrator To CEO Payment Approval
Triggers:
- Employee or contractor payout
- Vendor, cloud, advertising, tax, fee, reimbursement, or customer cash refund

Required result:
- Administrator prepares but cannot approve or release the payment
- Payment remains pending until the CEO approves or rejects it
- A material payment change invalidates prior approval
- Release and provider result remain fully auditable

## 15. Recommended First-Version Boundary
This is a recommended scope for discussion, not a confirmed commitment.

### Customer V1
- Registration, login, recovery, 18+ gate
- Profile wizard and photos
- Discover/search and full profile
- Uniform customer-facing profile presentation
- Favorite, Like, and interaction requests
- Messages with text and approved images
- Presence and three-minute reconciliation
- Visitors
- Credits and one approved payment provider
- Block, report, mute, settings, security

### Employee V1
- Password login followed by a code sent to verified work email or mobile text
- Immediate normal work after successful login without further approval
- Explicit logout before leaving and automatic logout after ten minutes of employee inactivity
- Assigned seed list
- Up to 10 simultaneous chats
- Prepared text and employee-approved AI suggestions
- Profile integrity, consent, safety, time-limit, and handoff controls
- No unrestricted robot auto-send

### Administrator V1
- Customer and employee accounts
- Roles
- Moderation and safety cases
- Charges and credit ledger
- Seed approval and assignments
- Robot pause/monitor
- Security center and audit
- Policy Maintenance with versioning, scheduling, impact review, and rollback
- Essential scheduled tasks and reports

### Recommended Post-V1 Candidates
- Newsfeed, unless it is essential to launch positioning
- Separate long-form Mailbox if user testing does not distinguish it from Chat
- Audio messages
- Big Rocket and other very high-value gifts require strong spending protection
- Autonomous intimate robot messages
- Complex advertising analytics
- Multi-language expansion

## 16. Recommended Policy Defaults For Discussion
These recommendations reduce ambiguity and launch risk:

1. Messages above 60 words are rejected with a live word counter; they are never automatically split and charged multiple times.
2. Profile interaction requests are free but rate-limited; monetization begins when a customer chooses a paid message or gift.
3. Visitors is free during pilot so trust and comprehension can be measured.
4. `Favorite` is private; `Like` notifies; `Follow` controls Feed.
5. Use one Messages area with Chats and Mailbox tabs.
6. Use `Me` rather than `People` for the customer's own account.
7. Do not launch Big Rocket during pilot.
8. Disclose that seed-recipient gift credits go to the overseeing employee.
9. Use 10 large cities per employee if each city has 100 seeds and the employee limit remains 1,000.
10. Employee compensation includes base pay and quality/safety measures; no employee sees a live per-customer spending target.
11. Robot auto-send begins disabled and is enabled category by category after evaluation.
12. Feed is optional for V1 unless market validation shows it drives clear customer value.

## 17. Document Authority
When documents disagree:
1. Confirmed decisions and approved policies
2. Security, safety, privacy, and financial controls
3. Approved role manual
4. UI specification
5. API and database draft
6. Screenshot reference

Screenshots never override current safety, profile-presentation, privacy, or
payment policy.
