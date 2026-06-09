# Online Refresh And Profile Request Policy

Status: confirmed design direction. Credit cost, expiry duration, and exact rate limits remain pending.

## 1. Purpose
Keep an online customer's important activity current and allow a customer viewing a profile to send a simple, recognizable social request without first composing a full message.

## 2. Online Customer Definition
A customer is considered currently online when:
- The customer has an active authenticated session.
- The website has sent a recent activity heartbeat.
- The account is active and not suspended.

Closing the website, losing the network, signing out, session expiry, or prolonged inactivity eventually changes the status to offline.

Online status is approximate. It must not reveal precise device activity, location, typing behavior, or a guaranteed ability to reply.

## 3. Three-Minute Update Cycle
While an authenticated customer is online, the Frontend performs a complete activity reconciliation at least once every three minutes.

The update covers:
- New chats and unread chat counts
- Online/offline changes for people in chat history
- Online/offline changes and profile availability in the favorites list
- New inbox messages and unread counts
- Search-result status and availability changes
- New profile interaction requests
- Relevant block, suspension, consent, or profile-visibility changes

The three-minute cycle is a maximum reconciliation interval, not an intentional delivery delay.

When real-time delivery is available, new chats, inbox messages, and requests should appear immediately. The three-minute reconciliation repairs missed events after sleep, backgrounding, reconnect, or temporary service interruption.

## 4. Refresh Behavior
- Refresh only while the customer has an active session.
- Reduce unnecessary refresh work when the page is hidden or the device is asleep.
- Reconcile immediately after the page becomes active again.
- Use one compact delta response instead of repeatedly downloading complete lists.
- Use a cursor/version token so missed changes can be recovered.
- Do not duplicate notifications or messages.
- Do not consume credits merely for refreshing.
- Do not replace unsent text or reset the customer's current page.

List behavior:
- Chat and inbox counts may update immediately.
- Online indicators may update in place.
- Favorites may show changed availability without moving unexpectedly.
- Search results must not reorder while the customer is reading or interacting with the list.
- New search ordering may be applied when the customer refreshes, changes a filter, moves page, or accepts a clear `New results available` action.
- A profile removed for safety, privacy, blocking, or suspension disappears or becomes unavailable immediately.

## 5. Presence Privacy
Customers need a setting to control whether others can see their online status, subject to final privacy policy.

Proposed presence states:
- `Online`
- `RecentlyActive`
- `Offline`
- `Hidden`

Do not expose:
- Exact last keystroke
- Exact device state
- IP address
- Precise physical location
- Whether a specific message is currently being read

Blocked customers cannot see each other's presence through normal customer features.

## 6. Profile Interaction Requests
When reviewing an eligible profile, a customer may send one of these requests:

| Code | Display Label | Meaning |
|---|---|---|
| `Hello` | Hello | Friendly greeting or invitation to begin talking |
| `Cuddle` | Cuddle | Affectionate virtual cuddle invitation |
| `Hug` | Hug | Friendly or affectionate virtual hug invitation |
| `Flirt` | Flirt | Invitation for light romantic flirting |
| `Teasing` | Teasing | Invitation for consensual playful teasing |
| `SexRequest` | Intimate Chat | Request to discuss an adult intimate topic |

The customer-facing label should use `Intimate Chat` rather than a blunt system code where that improves clarity and respect. The internal code may remain `SexRequest`.

After selecting a request type, the customer may choose an approved short
template. Templates are versioned and filtered for language, profile type,
adult eligibility, and safety.

Prohibited template claims include:
- Unverified nearby presence
- Guaranteed offline meetings
- Marriage or exclusive commitment as a factual promise
- Explicit false claims about offline identity, physical presence, or
  real-world availability

## 7. Sending A Request
1. Customer opens a profile.
2. Customer selects the request control.
3. The UI explains the request meaning when needed.
4. The UI uses the same customer-facing profile presentation for every
   customer type and omits internal classification.
5. For `SexRequest`, the sender confirms that this is only a request for consent.
6. The system validates eligibility, block state, rate limits, and duplicate state.
7. The request is created and the recipient receives a notification.

The request does not automatically create mutual consent, start an intimate conversation, or permit intimate media.

## 8. Receiving A Request
The recipient can:
- Accept
- Decline
- Ignore until expiry
- Block the sender
- Report the request

An accepted request may open or create the associated conversation.

Response meaning:
- Accepting `Hello`, `Cuddle`, `Hug`, `Flirt`, or `Teasing` permits that social tone but does not remove the recipient's right to stop or change topic.
- Accepting `SexRequest` opens the adult-intimate consent flow; both verified adults must affirm consent before intimate conversation begins.
- Declining sends no insulting or guilt-producing response.
- No response is not consent.
- Consent can be withdrawn immediately at any time.

## 9. SexRequest Safety Rules
`SexRequest` is available only when:
- Sender and recipient are verified as eligible adults.
- Neither account is blocked, suspended, or restricted from intimate features.
- The recipient permits intimate requests in privacy preferences.
- No active rejection, cooldown, or safety restriction applies.

The request must not:
- Contain explicit text or media
- Be sent repeatedly after rejection or no response
- Be treated as permission for sexual content
- Be sent to an age-ambiguous or unverified profile
- Bypass a withdrawn consent state

The recipient may disable all `SexRequest` notifications.

## 10. Request Limits
Proposed controls:
- Only one pending request between the same sender and recipient.
- Duplicate taps return the existing request rather than creating another.
- A declined or expired request creates a cooldown.
- Repeated requests across many profiles trigger spam review.
- Blocked customers cannot create or receive requests from each other.
- Requests use idempotency protection.

Exact per-hour/day limits, expiry duration, and cooldown duration remain pending.

## 11. Credits
The request credit policy is not yet confirmed.

Until approved:
- No request may cause an undisclosed credit deduction.
- Any paid request must use preview-and-confirm.
- Decline, expiry, block, or duplicate submission must follow an explicit refund/non-charge rule.
- The request screen must show `Free` or the exact credit cost before confirmation.

## 12. Notifications And History
Request notifications show:
- Sender display name and approved photo
- Request type
- Sent time
- Accept, decline, block, and report actions

The customer can review pending and recent requests. Sensitive request history follows the privacy and retention policy.

Do not create fake request events or notifications. The displayed sender must
be the actual customer-profile identity that created the request.

## 13. Accessibility And Mobile Behavior
- Request controls use icon plus text or an accessible label.
- Controls remain usable at the 320px minimum layout.
- The six actions may appear in a compact action menu or bottom sheet on mobile.
- A confirmation step prevents accidental `SexRequest`.
- Screen readers announce request type, sender, and state without internal
  customer classification.
- Updates do not steal keyboard focus or interrupt message composition.

## 14. Audit And Abuse Review
Record:
- Request ID and type
- Sender and recipient
- Creation and response time
- State: Pending/Accepted/Declined/Expired/Cancelled
- Profile-presentation policy version when applicable
- Adult eligibility and consent-flow result for `SexRequest`
- Block/report relationship
- Credit cost and ledger reference if later approved

Moderators may access request evidence only for an approved report, safety, support, security, or legal purpose.
