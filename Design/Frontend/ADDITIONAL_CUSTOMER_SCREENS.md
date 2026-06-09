# Additional Customer Screen Design

Status: design draft based on five screenshots added to `ScreenCopy/` on June 7, 2026.

These references expand the existing customer UI with:
1. Public profile detail and action area
2. Flirt/request template picker
3. Active conversation detail
4. Customer account drawer
5. Profile visitors

The references guide layout and workflow only. DatingEasy888 uses its own brand,
safer language, hidden internal customer classifications, and the visual
direction between Horizon Singles and Best Dates.

## 1. Shared Customer Header
The five screens use a consistent customer header:
- Menu button at the left
- DatingEasy888 logo/wordmark
- Credit balance control at the right
- Thin divider below the header

DatingEasy888 adaptation:
- Use restrained white, charcoal, coral, and orange rather than a nearly black purple-dominant screen.
- Keep the header compact and sticky when useful.
- The credit control shows a coin icon, current balance, and accessible label such as `Credits: 120`.
- Selecting credits opens the credit purchase/history area.
- Credit changes update without shifting the header layout.
- Internal real, seed, and robot classification must not appear in the header
  or other customer-facing UI.

Mobile:
- Header height remains compact.
- Logo may use a shortened wordmark.
- Menu and credit controls remain at least 44 by 44 CSS pixels.

## 2. Screen 22: Public Profile Detail

Reference:
`Screenshot 2026-06-07 at 10.00.12 AM.png`

### Purpose
Inspect a customer profile and choose the next social action.

### Layout
1. Shared customer header
2. Profile identity summary
3. Photo carousel
4. Primary actions
5. About section
6. Interaction-request actions
7. Additional profile facts/interests
8. Safety/profile menu

### Photo Carousel
- Customer-uploaded photos use the processed version within 100 x 100 pixels
- Processed photos are JPG or PNG regardless of the safely readable source format
- Display at natural size or smaller; do not upscale and blur the image
- Previous/next icon buttons
- Position indicators
- Swipe support on touch devices
- Keyboard arrow support when focused
- Stable aspect ratio to prevent layout movement
- Image count and meaningful alt text where appropriate
- No automatic rapid slideshow

For company-operated profiles:
- All photos must depict the same approved synthetic/licensed identity.
- Internal profile classification is omitted from the customer-facing screen.

### Identity Summary
Show:
- Display name
- Age
- General city/region, subject to privacy
- Online/presence state
- Verification state
- Customer-visible verification state only

Do not imply exact location or physical availability.

### Primary Actions
- `Message`: opens or creates a conversation. The composer displays the send
  cost and sends directly without a separate confirmation.
- `Add to Favorites`: saves the profile and changes to `Favorited`.

Secondary profile menu:
- Block
- Report
- Share approved public profile link, if later enabled
- Hide from results

### About Section
- Biography text with a sensible collapsed/expanded state
- Maximum seed biography remains under 500 words and 4,000 characters
- Profile facts and interests appear in scannable groups below
- Long text must not obscure the action controls

### Interaction Requests
Present the six approved request types:
- Hello
- Cuddle
- Hug
- Flirt
- Teasing
- Intimate Chat (`SexRequest`)

Desktop may show the most common actions directly and place the remainder under
`More`. Mobile uses a compact action row or bottom sheet.

`Intimate Chat`:
- Uses respectful wording
- Requires verified eligible adults
- Requires confirmation
- Is a request to begin mutual consent, not consent itself

### States
- Loading skeleton
- Profile unavailable
- Blocked relationship
- Already favorited
- Existing conversation
- Pending request
- Profile presentation unavailable
- Insufficient credits, only when the selected action is approved as paid

## 3. Screen 23: Interaction Template Picker

Reference:
`Screenshot 2026-06-07 at 10.00.38 AM.png`

### Purpose
Select an approved short invitation after choosing a profile interaction action.

### Layout
- Modal on desktop
- Bottom sheet or full-height sheet on small mobile
- Title reflecting the selected request, such as `Send a Flirt`
- Brief instruction
- List/grid of approved templates
- Close button
- Final confirmation when required

Each template row includes:
- Familiar icon
- Short text
- Optional tone label
- Send icon/button
- Cost label if the action is paid

### Initial Safe Template Examples

Hello:
- `Hello, I'd enjoy getting to know you.`
- `Hi! Your profile caught my attention.`

Cuddle:
- `Sending you a warm virtual cuddle.`
- `Would a cozy virtual cuddle brighten your day?`

Hug:
- `Sending you a warm hug.`
- `You seem lovely. May I offer a virtual hug?`

Flirt:
- `You caught my eye.`
- `You have a wonderful smile.`
- `Would you enjoy a little light flirting?`

Teasing:
- `Up for a little playful teasing?`
- `I have a playful question for you.`

Intimate Chat:
- `Would you be comfortable talking more intimately?`
- `Would you like to open an adult intimate conversation?`

### Reference Text Not Adopted
- `Marry Me!` is not used as a first-contact template because it can create false commitment or pressure.
- `I'm nearby` is prohibited unless current location is truthful, permitted, and verified; DatingEasy888 does not use it as a template.
- Explicit or coercive invitations are not sent before mutual adult consent.

### Behavior
- Selecting a normal template shows the final text and cost, then sends once.
- Duplicate taps are idempotent.
- The recipient can accept, decline, ignore, block, or report.
- A virtual-profile request retains the company-operated label.
- `Intimate Chat` opens the verified-adult consent request flow.

## 4. Screen 24: Active Conversation Detail

Reference:
`Screenshot 2026-06-07 at 10.01.15 AM.png`

### Purpose
Read and continue a specific chat while retaining fast access to the other profile.

### Layout
1. Shared customer header
2. Segmented control: `Chats` and `Mailbox`
3. Conversation identity bar
4. Message history
5. Composer

### Chats/Mailbox Segmented Control
- Shows unread badges without changing tab width
- `Chats` contains conversational threads
- `Mailbox` contains longer-form inbox/outbox items if the product retains both concepts
- The final distinction between chat and mailbox must be understandable; duplicate systems should be merged if user testing shows confusion

### Conversation Identity Bar
Show:
- Back button
- Avatar
- Name and age
- Presence state
- `View Profile` command
- Favorite toggle
- More menu

More menu:
- Mute
- Archive
- Block
- Report
- Withdraw intimate consent, when active

Do not use a large destructive-looking profile button that competes with the conversation itself. `View Profile` is a compact command.

### Message History
- Date separators
- Sender distinction
- Delivery/read state when policy permits
- Media and gift presentation
- Interaction-request events
- Consent and customer-visible policy events
- Incremental history loading
- Stable scroll position when older messages load

New messages:
- Appear immediately through real-time delivery when available
- Are reconciled within the three-minute update cycle
- Do not pull the customer away from an older message they are reading
- Show a `New messages` control when the reader is scrolled upward

### Composer
- Multiline text input
- 60-word counter
- Media picker
- Emoji/reaction picker
- Gift panel below the chat area with icons and exact credit costs
- Send icon button
- Exact message cost displayed beside Send

The composer preserves unsent text during a recoverable disconnect. Send is
disabled for blocked, closed, expired-consent, or insufficient-credit states.
Selecting an affordable gift sends it immediately. An unaffordable gift is not
sent and does not change the balance.

## 5. Screen 25: Customer Account Drawer

Reference:
`Screenshot 2026-06-07 at 10.02.41 AM.png`

### Purpose
Provide a compact path to account-level functions without replacing primary bottom navigation.

### Menu Items
- `Profile`: view completion and edit profile
- `Visitors`: see eligible profile visitors
- `Credits`: balance, packages, and ledger
- `Settings`: account, password, privacy, presence, photos, notifications, and consent preferences
- `Log Out`
- `Back to Home`

Additional settings groups may include:
- Security and active sessions
- Blocked customers
- Data export/deactivation
- Browser/device support
- Help and policy links

### Behavior
- Opens from the left on desktop and mobile
- Traps keyboard focus while open
- Escape/back closes it
- Close button has a clear accessible name
- Selecting a destination closes the drawer
- Logout requires confirmation when unsent text or an active checkout exists

The drawer must not advertise spending as the main account purpose. Credits are
one peer navigation item, not a dominant pressure element.

## 6. Screen 26: Profile Visitors

Reference:
`Screenshot 2026-06-07 at 10.03.07 AM.png`

### Purpose
Show customers who recently opened their profile, subject to privacy and safety rules.

### Layout
- Title: `Your Visitors`
- Optional filter: All/Recent/Online
- Responsive profile-card grid
- Show the first 20 visitor records
- Display a `Next` button when more records exist
- `Next` retrieves the next 20 records; do not auto-load or infinite-scroll
- Empty state

Visitor card:
- Approved profile photo
- Display name
- Age
- Presence indicator, subject to visibility setting
- Relative visit time such as `Visited recently`
- Open-profile action
- Favorite or interaction action under the card menu

### Privacy And Safety
- Opening an eligible profile records a profile visit.
- The visitor must be informed that visits may be visible before the feature is enabled.
- Blocked relationships do not appear.
- Admin, moderation, safety, and support access never creates a customer-visible visit.
- Exact timestamps may be reduced to relative time to limit monitoring behavior.
- No fake visitors or fabricated visitor notifications.
- Virtual visitors remain clearly labeled.
- Customers can report or block from the visitor profile.

Pending product decisions:
- Whether customers can browse invisibly
- Whether Visitors is free or premium
- Visit retention period
- Whether repeated visits collapse into one card with a count

### Empty State
Use a quiet message such as:
`No eligible profile visits yet. New visitors will appear here.`

Do not generate fake activity to avoid an empty screen.

## 7. Responsive Composition

Desktop:
- Content max width approximately 1100-1280px
- Profile carousel and content may use a two-column layout when it improves inspection
- Request modal uses two columns only when text fits comfortably
- Visitors use 3-4 columns depending on card minimum width

Tablet:
- One or two profile columns
- Visitors use 2-3 columns
- Chat remains a single focused conversation

Mobile:
- One-column profile
- Full-width carousel
- Sticky bottom action bar may contain Message and Favorite
- Remaining requests open in a bottom sheet
- Visitors use one or two columns according to available width
- Account drawer uses nearly full width but leaves a visible dismiss region when practical

## 8. Visual Adaptation
Keep from the references:
- Strong hierarchy
- Large inspectable profile media
- Simple action choices
- Clear unread badges
- Scannable menu rows
- Image-led visitor cards

Change for DatingEasy888:
- Replace the reference brand
- Reduce neon saturation, glow, and near-black purple dominance
- Use the established warm orange/coral accents with neutral surfaces
- Use compact controls and 8px-or-less card radii
- Avoid oversized buttons when a familiar icon or compact command is enough
- Preserve text contrast and visible focus
- Keep internal customer classification absent from customer-facing screens

## 9. Functional Dependencies
These screens require:
- Profile detail and photo APIs
- Favorites
- Profile interaction requests and approved templates
- Adult-intimate consent
- Conversations and mailbox
- Real-time events plus three-minute reconciliation
- Profile visits
- Presence privacy
- Credits and costs displayed at each action point
- Block/report/moderation
- Notification preferences
