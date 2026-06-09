# DatingEasy888 Customer Manual

Version: Design Draft 1.8  
Audience: DatingEasy888 customers  
Status: Pre-release manual. Screen names and unsettled policies may change before publication.

## How To Read This Draft
This manual uses three decision labels:
- `Confirmed`: already approved for the product design.
- `Recommended`: the current design recommendation to discuss and approve.
- `Pending`: cannot be promised to customers until a final policy is approved.

Shared account, profile, conversation, message, presence, and internal profile
state meanings are defined in `Product/PRODUCT_OPERATING_MODEL.md`.

## 1. About DatingEasy888
DatingEasy888 is an 18+ social dating and conversation service. Customers can create a profile, discover other profiles, exchange messages, follow activity, and purchase credits for paid interactions.

The service internally supports real, seed, and robot customer accounts. The
customer website presents each eligible account as a customer profile and does
not display that internal classification on discovery cards, profile pages,
conversation lists, or chat panels.

## 2. Supported Devices
The customer website is designed for:
- Windows 10 version 22H2 and Windows 11 computers
- Mac computers introduced in 2020 or later running macOS 12 or later
- Mainstream Linux and ChromeOS computers
- iPhone and iPad running iOS/iPadOS 17 or later
- Android phones and tablets
- Current Edge and Chrome, supported Safari, Firefox, and Samsung Internet versions

Other Unix-like systems receive best-effort support through a current standards-compliant browser.

Internet Explorer 11 is not supported. Use Microsoft Edge, Chrome, Firefox, or Safari.

Bing is supported as a search engine for approved public pages. It is not a
browser; Bing results open the website in Edge or another supported browser.

Microsoft ended normal Windows 10 support on October 14, 2025. DatingEasy888
plans legacy compatibility testing through October 13, 2026, but customers
should install applicable security updates or move to Windows 11.

The website supports screens from 320 CSS pixels wide through large desktop displays.

## 3. Create An Account
1. Open the DatingEasy888 website.
2. Select `Sign Up`.
3. Confirm that you are at least 18 years old.
4. Enter the requested account information.
5. Create a strong, unique password.
6. Verify your email or other contact method when requested.
7. Complete the profile wizard.

New eligible real customers receive a one-time 50-credit registration reward. Duplicate, fraudulent, seed, banned, or recreated accounts are not eligible.

Never share your password or verification code. DatingEasy888 employees will not ask for your password.

## 4. Sign In And Account Recovery
To sign in:
1. Select `Login`.
2. Enter your registered email and password.
3. Complete any additional security check.

If you forget your password:
1. Select `Forgot Password`.
2. Enter your account name and registered email or phone number.
3. Wait for administrator approval, or automatic approval when that policy is enabled.
4. Receive a one-time temporary password through the verified email or phone channel.
5. Sign in with the temporary password.
6. Open `Me` and replace it with a new permanent password.

You may also change your password at any time from `Me` by entering the current
password and a new password.

Use the account security area to review and revoke active sessions when available. Password reset, suspension, or a security action may sign you out of other devices.

### Customer Session
- The customer session remains active while the customer continues using the website.
- Twenty consecutive minutes without customer interaction automatically logs out the customer.
- Meaningful keyboard, pointer, touch, navigation, or customer command resets the inactivity timer.
- Background three-minute reconciliation, incoming messages, notifications, timers, and an open browser tab do not reset the timer.
- The interface warns the customer shortly before automatic logout when practical.
- Unsaved text should be preserved locally when safe, but no paid action is submitted automatically.
- After automatic logout, the customer signs in again before continuing.

### Customer Access After Sign-In
DatingEasy888 is available only to customers who are at least 18 years old.
After an eligible customer signs in and is online, no employee or administrator
approval is required to use the actions currently offered by the customer UI.

The UI is the customer's current capability guide:
- An enabled action may be used immediately.
- A hidden action is not currently available.
- A disabled action explains the requirement when it is safe to do so.
- The exact credit cost appears on every paid action before it is selected.
- Sending an ordinary message or selecting a gift does not open a separate
  confirmation dialog.

Automatic checks may still confirm sufficient credits, recipient block state,
adult eligibility, consent state, rate limits, account status, and technical
availability. These are product rules, not requests for staff permission.
Actions involving another customer still require that customer's choices and
consent where applicable.

### Account Status Meanings
- `Pending verification`: sign-in may work, but restricted actions remain unavailable.
- `Profile incomplete`: finish required profile steps before public discovery.
- `Active`: use every currently enabled customer UI action without staff approval.
- `Limited`: selected actions are temporarily restricted.
- `Suspended`: normal use is paused pending time, review, or appeal.
- `Banned`: access is ended for a serious or repeated violation.
- `Deactivated`: the customer voluntarily hid and paused the account.
- `Deletion pending`: deletion has been requested and awaits the approved recovery or retention period.

The interface should show the status, available next action, and appeal or
support route without exposing confidential safety or fraud controls.

## 5. Complete Your Profile
The planned profile wizard contains nine stages:
1. Display name and primary photo
2. Birth date and location
3. Marital status
4. Work field and language
5. Personality traits
6. Interests
7. Movie and music preferences
8. Dating goals and preferred age range
9. Gender, looking-for preference, story, photos, and biography

Profile guidance:
- Registration collects country, state/province, and city.
- On the first sign-in, the service opens Me and asks you to complete every
  required profile section before using Discover or Messages.
- If you do not upload a picture, the service supplies an illustrated default
  portrait based on the gender selected during registration.
- Use information you are allowed to share.
- Do not include passwords, payment details, government identifiers, or another person's private information.
- Upload only photos you have permission to use.
- Public photos may appear in discovery.
- Private photos follow separate access rules.
- Do not impersonate another person.
- Keep your location general; do not publish a home address.

### Profile Picture Processing
- Published pictures use JPG or PNG format.
- If a safely readable upload uses another image format, the system automatically converts it.
- Pictures requiring transparency are converted to PNG; ordinary photographs are converted to JPG.
- Every uploaded profile picture is processed to fit within 100 x 100 pixels.
- Neither the processed width nor height exceeds 100 pixels.
- The system preserves aspect ratio and does not enlarge a smaller picture.
- Larger pictures are automatically resized and compressed.
- The processed preview is shown before the picture is published.
- Unsupported, unsafe, or unreadable files are rejected.
- Select Me at any later time to review or edit these profile fields.

You must remain at least 18 years old to use the service.

## 6. Main Navigation
The launch navigation is:
- `Messages`: chat history, newest activity first.
- `Discover`: search, recommendations, filters, and profile detail.
- `Favorites`: profiles privately saved by the customer.
- `Me`: the customer's own profile in review/edit mode, credits, and settings.

After login, Messages is the first screen. The newest conversation appears at
the top and older conversations follow it.

On phones, primary navigation appears near the bottom of the screen. Notification badges show unread activity.

### Account Menu
Open the header menu for:
- Profile
- Visitors
- Credits
- Settings
- Log Out
- Back to Home

Settings may include password, photos, notifications, presence visibility,
blocked customers, privacy, active sessions, and intimate-request preferences.

### Online Updates
While you remain signed in and online, DatingEasy888 reconciles activity at
least every three minutes. New chat and inbox messages may appear immediately
when real-time delivery is available.

The update includes:
- New chats
- Online status for people in your chat history
- Favorites-list status
- Inbox messages
- Search-result availability
- Profile interaction requests

Search results do not jump into a new order while you are reading them. The
website may show `New results available` so you can refresh deliberately.

### Notification Behavior
Customers should receive one understandable notification for an event, even if
the event arrives through real-time delivery and later reconciliation. Opening
the relevant item marks it read. Settings should separately control messages,
requests, visitors, likes, follows, payments, and security alerts. Critical
security and transaction notices cannot be disabled.

### Lists And Next Page
Search results, messages, visitors, favorites, activity, transaction history,
and every other record list show at most 20 records at one time. When more
records exist, select `Next` to retrieve the next 20. The website does not
automatically load the remaining records.

## 7. Search And Discovery
Use Search to browse profiles and apply available filters such as:
- Age range
- Country, state, or city
- Gender and looking-for preference
- Interests
- Online or activity status

Open a result to view one full profile page. After reviewing it, select `Chat`
to begin or continue a conversation, or use Back to return to the same result
list. Search opens a search result list and Favorites opens the saved-profile
list; both use the same profile review flow.

### Social Action Meanings
The recommended meanings are:
- `Like`: send a lightweight interest signal the other customer may see.
- `Favorite`: save a private bookmark for later.
- `Follow`: subscribe to eligible public Feed activity.
- `Request`: send one named interaction invitation.
- `Message`: begin or continue a conversation.

These actions must not silently perform one another. A Favorite does not notify
the other customer, and a Follow does not create romantic consent.

### Conversation Profiles
Select a profile to review it before chatting. In Messages, select a
conversation to open it, or double-click the conversation avatar to open that
customer's profile. The active chat header includes a Favorite control.

The system internally routes conversations according to account type. This
routing does not change the profile, chat, favorite, gift, or credit controls
presented to a real customer.

### Profile Requests
While reviewing an eligible profile, you may send:
- `Hello`
- `Cuddle`
- `Hug`
- `Flirt`
- `Teasing`
- `Intimate Chat` (internal system code: `SexRequest`)

The recipient may accept, decline, ignore, block, or report a request. No
response is not consent.

`Intimate Chat` is available only to verified eligible adults. Sending or
accepting it begins a separate consent process; it does not itself authorize
sexual conversation or intimate media. Consent can be withdrawn immediately.

The credit price, expiry period, and request cooldown remain pending. The
interface must show `Free` or the exact price before you confirm.

After choosing a request type, you may select an approved short message. Examples
include `You caught my eye` or `Sending you a warm hug`. DatingEasy888 does not
use templates that falsely claim someone is nearby or promise marriage,
meetings, or exclusivity.

### Your Visitors
Open `Visitors` from the account menu to see eligible customers who recently
opened your full profile.

Visitor cards may show:
- Photo
- Display name and age
- Presence, when visible
- Relative visit time

Repeated visits may be combined. Blocked customers and employee/admin/service
reviews do not appear. Visitor visibility, retention, and whether invisible
browsing is available remain pending.

### Profile Availability
A profile may be visible, hidden, paused, under review, or removed. A hidden or
removed profile should not remain in new discovery results. Existing
conversations may retain the display name and transaction history needed for
safety, billing, and record integrity.

## 8. Start A Conversation
1. Open the selected profile.
2. Select the available message or chat action.
3. Review the profile and applicable credit cost.
4. Enter your message.
5. Select `Send` or press Enter. The message is submitted immediately.
6. Use Shift+Enter when you want a new line without sending.

Planned text-message rules:
- Cost: 5 credits
- Maximum: 60 words
- The Send control displays the exact cost before sending.
- No separate confirmation is required.
- A failed or rejected message must not consume credits.

The final handling of messages over 60 words remains pending. The product may reject the message and ask you to shorten it rather than splitting and charging it automatically.

### Conversation Screen
The conversation screen provides:
- Chats/Mailbox switch with unread counts
- Other customer's name, photo, age, and presence
- View Profile
- Add to Favorites or remove from Favorites
- Mute, Archive, Block, and Report
- Message history and interaction-request events
- Text, media, emoji, gift, and Send controls
- Word count and the exact visible send cost
- A gift panel below the chat area showing each gift icon and credit cost

Incoming messages may appear immediately and are reconciled within three
minutes. If you scroll upward, new messages should not pull you away; use the
`New messages` control to return to the latest message.

## 9. Chat With Real Customers
Private conversation between consenting adults is open by default. DatingEasy888 does not steer or rewrite lawful conversation merely because it is intimate, political, emotional, controversial, or critical of the company.

Customers may choose their own topics, disagree, stop replying, mute, block, or report.

Prohibited conduct includes:
- Racist or discriminatory abuse
- Credible threats or violent intimidation
- Exploitation or coercion
- Non-consensual intimate images
- Child sexual exploitation or enticement
- Doxxing or harmful exposure of private information
- Fraud, extortion, malware, or scams
- Repeated unwanted contact after a block or clear request to stop

Personal dating preferences are allowed when expressed respectfully. They do not justify insulting or threatening another person.

## 10. Chat With Seed And Robot Customers
Seed-customer conversations are performed through company employees using
approved prepared text and AI assistance where permitted. Robot customers
generate their own responses through the approved autonomous system and do not
enter an employee's seed work queue.

The conversation should provide genuine value through:
- Feeling heard
- Respectful affection
- Mood support
- Relaxation
- Positive and happy conversation
- Fun and appropriate humor
- Natural, interesting continuity

Company-operated profiles must not:
- Make explicit false claims about offline identity, physical presence, or real-world availability
- Promise an offline meeting, marriage, relocation, or exclusivity
- Ask you to prove affection by buying credits or gifts
- Use jealousy, guilt, fear, or abandonment to keep you talking
- Discourage real relationships, family, friends, or professional support
- Split an answer into unnecessary paid messages

You may change the subject, pause, withdraw intimate consent, or end the conversation at any time.

## 11. Adult Intimate Conversation
Adult intimate conversation is allowed only under the approved product policy:
- All participants must be verified as eligible adults.
- Consent must be affirmative.
- Conversation should begin at a lower intensity.
- Any participant may stop or change the topic immediately.
- Unwanted sexual content can be reported.

Content involving minors, coercion, exploitation, intoxicated consent, incest, non-consensual activity, or sexual violence is prohibited.

Do not send intimate media unless you understand the privacy risk and have permission to share it. Never share another person's intimate media without consent.

## 12. Photos, Audio, And Media
The planned media-message cost is 10 credits.

Before sending:
1. Select an approved file.
2. Review the recipient and cost.
3. Confirm that you own or are allowed to share it.
4. Send only when the upload preview is correct.

Files may be checked for type, size, malware, and prohibited content. Metadata may be removed for privacy.

Conversation pictures follow the same rule as profile pictures: the system
automatically resizes and compresses them to fit within 100 x 100 pixels while
preserving aspect ratio. Safely readable non-JPG/PNG pictures are automatically
converted to JPG or PNG. The customer reviews the processed preview before sending.

Voice files are also automatically condensed using an approved audio format and
quality setting. If a picture or voice file cannot be processed safely, it is
rejected and no credits are consumed. The exact voice duration and processed
byte limit remain pending because audio does not have pixel dimensions.

## 13. Credits
Credits are platform units used for eligible messages, media, gifts, or premium actions. They are not cash and are not withdrawable unless a future policy expressly permits it.

Your current spendable balance appears in the customer interface. After a paid
action or confirmed credit grant succeeds, the displayed balance changes
immediately to the balance committed by DatingEasy888. Other open tabs or
devices receive the same balance through live updates or the next activity
reconciliation. A failed, rejected, or cancelled action does not consume
credits. Do not retry a paid action while its result is still pending.

Planned packages:

| Price | Credits |
|---:|---:|
| $10 | 100 |
| $20 | 220 |
| $30 | 360 |
| $50 | 700 |
| $100 | 1,500 |

The formula for purchases over $100 remains pending.

To buy credits:
1. Open `Me`, `Profile`, or the credits area.
2. Select `Add Credits`.
3. Choose a package.
4. Review the price, credits, and payment method.
5. Complete the payment provider's secure checkout.
6. Wait for confirmation before retrying.
7. Review the updated balance and transaction history.

DatingEasy888 does not store your CVV, card PIN, card password, or full raw card number. Saved payment methods use provider tokens and masked details.

## 14. Gifts
Planned gifts:

| Gift | Sender Cost | Eligible Recipient Share |
|---|---:|---:|
| Flower | 100 credits | 80 credits |
| Silver | 200 credits | 160 credits |
| Gold | 500 credits | 400 credits |
| Diamond | 1,000 credits | 800 credits |
| Big Rocket | 10,000 credits | 8,000 credits |

The platform retains 20% of an eligible gift transaction.

The gift panel beneath the chat area shows every gift icon and exact credit
cost. Selecting a gift sends it immediately and deducts its cost; no separate
confirmation appears. If the current balance is below the gift cost, the gift
is not sent and no credits are deducted.

Every successfully sent gift is final and non-refundable. Review the visible
recipient and cost before selecting the gift.

When the recipient is a virtual seed profile, the 80% recipient credit share is
credited to the employee assigned to oversee that seed at the time of the gift.
The interface may explain this allocation in gift information.

## 15. Block, Mute, And Report

### Block
Blocking stops new direct contact through normal customer messaging.

To block:
1. Open the profile or conversation menu.
2. Select `Block`.
3. Confirm the action.

### Mute
Muting stops or reduces notifications without necessarily blocking the person.

### Report
Report reasons include:
- Harassment
- Racist or discriminatory abuse
- Threat or violence
- Unwanted sexual content
- Non-consensual intimate image
- Minor-safety concern
- Scam, fraud, or extortion
- Impersonation
- Privacy or doxxing
- Spam
- Other safety concern

Provide only the details necessary to explain the concern. Internal moderation notes are not shown to the reported customer.

For immediate danger, contact local emergency services. The platform is not an emergency-response service.

### Appeals And Support
When DatingEasy888 takes an account or content action, the affected customer
should receive:
- The action and duration, when disclosure is safe and lawful
- A clear policy category
- Any available corrective step
- An appeal route and submission deadline

An appeal should be reviewed by an authorized person who did not make the
original decision when staffing permits. Filing an appeal does not
automatically restore access. Retaliation against a reporter is prohibited.

## 16. Privacy
Public and private profile information are separated.

DatingEasy888 may process chats as needed to:
- Deliver and store messages
- Apply disclosed credit charges
- Enforce blocks and consent
- Detect malware, spam, fraud, exploitation, and serious threats
- Investigate reports
- Meet legal obligations
- Maintain security and reliability

Employees and administrators may not browse private chats out of curiosity. Authorized human access requires a support, moderation, safety, security, or legal purpose and is audited.

Do not assume end-to-end encryption unless the service later states explicitly that it has been implemented and verified.

## 17. Account Safety
- Use a unique password.
- Do not share verification codes.
- Sign out on shared computers.
- Be careful with links and off-platform payment requests.
- Do not send money because another customer claims an emergency.
- Report impersonation, blackmail, or suspicious payment requests.
- Keep your exact address, workplace, and financial information private.
- Review the selected profile and visible credit cost before a paid action.

### Settings And Privacy Controls
The recommended settings areas are:
- Account and contact information
- Password, sessions, and sign-in security
- Public and private photos
- Profile visibility and discovery
- Presence and visitor visibility
- Message, request, and intimate-chat preferences
- Notification channels
- Blocked customers
- Saved payment methods and transaction history
- Data export, deactivation, and deletion

Changes affecting safety, payment, password, or account ownership may require
recent authentication or another verification step.

### Deactivate Or Delete
`Deactivate` pauses public visibility and normal matching while preserving the
account for return. `Delete` begins permanent account deletion under the final
retention policy.

Before confirming deletion, the interface should explain which access stops,
whether a recovery period applies, which records must be retained, what happens
to messages visible to others, and how to download eligible account data.

## 18. Common Problems

### Message Was Not Sent
- Check your connection.
- Confirm that the recipient has not blocked you.
- Confirm that your balance is sufficient.
- Shorten a message that exceeds the word limit.
- Retry only when the interface indicates it is safe.

### Credits Did Not Appear
- Do not repeatedly submit payment.
- Review payment history.
- Wait for provider confirmation.
- Contact support with the transaction reference, never your CVV or password.

### Charge, Refund, Or Gift Dispute
- Open the transaction in credit history.
- Select the available support action.
- Provide the transaction reference and a short explanation.
- Never send card security codes, passwords, or identity documents through chat.
- Keep the support case number until the case is closed.

The interface should distinguish a payment reversal from a credit adjustment.
Gifts are not refundable or reversible after successful send. A payment fraud
or chargeback report may still be investigated separately.

### Chat Disconnected
- Keep the page open while it reconnects.
- Confirm whether the message shows sent, pending, or failed.
- Do not resend an acknowledged message.

### Unsupported Browser
- Update the browser.
- Use current Edge, Chrome, Firefox, or Safari.
- Internet Explorer is not supported.

## 19. Quick Glossary
- `Credit`: internal unit used for an eligible paid action; not cash.
- `Real member`: a customer operating their own profile.
- `Company-operated profile`: an internally classified seed or robot profile
  whose customer-facing layout matches other customer profiles.
- `Request`: a named invitation that may be accepted, declined, ignored, blocked, or reported.
- `Consent`: affirmative and reversible agreement; silence is not consent.
- `Presence`: Online, Recently Active, Offline, or Hidden.
- `Archive`: remove a conversation from the main list without deleting its required record.
- `Block`: stop normal direct contact.
- `Report`: ask the safety or moderation team to review a concern.

## 20. Required Before Publication
These decisions block accurate customer instructions:
- Product domain registration
- Exact verification method
- Treatment of messages over 60 words
- Voice duration, processed byte limit, and supported audio formats
- Purchases above $100
- Refund, chargeback, and credit-expiration rules
- Final payment provider
- Profile-request credit cost, expiry, cooldown, and rate limits
- Online-presence visibility and inactivity timing
- Visitor retention, invisible browsing, visit-count display, and free/premium status
- Data retention and deletion periods
- Final customer support and appeal process

## 21. Recommended Product Decisions For Manual Review
- Keep Messages, Discover, Favorites, and Me as primary navigation.
- Keep Chat and optional Mailbox inside one Messages area.
- Make Like visible, Favorite private, and Follow a Feed subscription.
- Reject text over 60 words without charging or automatic splitting.
- Make profile requests free but rate-limited in the first pilot.
- Keep Visitors free during the first pilot to test customer understanding.
- Keep gift prices persistently visible and reject insufficient-credit sends
  atomically without interrupting ordinary sends with confirmation dialogs.
