# User Flows

## New User Registration
1. Landing page
2. Choose sign up
3. Confirm 18+ requirement
4. Create account
5. Complete profile wizard
6. Upload profile photo
7. Land on dashboard
8. Suggested next action: browse profiles or finish verification

## Existing User Login
1. Landing page
2. Login by email/password or social provider
3. System validates account status
4. If profile incomplete, return to wizard
5. If profile complete, open dashboard
6. Confirm the customer remains eligible for the 18+ product
7. Allow immediate use of every enabled UI action without employee or administrator approval

The UI and server still enforce balance, block, consent, rate-limit,
account-state, safety, and technical conditions. Another customer's consent or
acceptance remains required where applicable.

## Profile Wizard
1. Basic identity: name and photo
2. Birthday and location
3. Marital status
4. Work and language
5. Personality traits
6. Interests
7. Movie and music preferences
8. Dating goals and age preference
9. Gender/looking-for, story, photos, bio

## Discovery To Chat
1. User opens Search or Active tab
2. User applies filters
3. System returns the first 20 profile cards
4. User opens a profile
5. User likes, follows, starts a conversation, or sends a profile interaction request
6. Interaction requests are Hello, Cuddle, Hug, Flirt, Teasing, or Intimate Chat
7. Recipient may accept, decline, ignore, block, or report the request
8. Intimate Chat begins a separate verified-adult mutual-consent flow
9. If credits are required, user sees credit requirement before sending
10. Message is sent and conversation appears in Messages/Chats

When more than 20 records exist, the customer selects `Next` to retrieve the
next 20. Record lists do not infinite-scroll.

## Send Gift
1. Customer selects a gift in a conversation.
2. System shows recipient, sender cost, 80/20 allocation, and non-refundable notice.
3. For a seed recipient, the preview states that 80% goes to the overseeing employee.
4. Customer confirms.
5. System atomically records sender deduction, recipient or employee credit,
   platform share, gift event, and policy and assignment snapshots.
6. Successfully sent gift is final and cannot be refunded or reversed.

## Online Activity Refresh
1. Authenticated customer becomes active
2. Real-time events update chat, inbox, presence, and requests when available
3. Frontend reconciles all activity at least every three minutes
4. Missed events are recovered using the last update cursor
5. Visible search results retain their order
6. Customer chooses whether to load newly available search ordering

## Profile Visitors
1. Customer opens another eligible full profile
2. System records or updates a privacy-controlled profile visit
3. Profile owner opens `Visitors` from the account drawer
4. System returns eligible recent visitor cards without internal customer
   classification
5. Owner may open, favorite, greet, block, or report an eligible visitor
6. Blocked relationships and internal staff/service views do not appear

## Account Drawer
1. Customer opens the header menu
2. Drawer shows Profile, Visitors, Credits, Settings, Log Out, and Back to Home
3. Customer selects a destination
4. Drawer closes and preserves current work where appropriate
5. Logout warns before discarding an unsent draft or active checkout

## Inbox And Mail
1. User opens Mail
2. User switches between Inbox, Starred, Outbox, Trash
3. User can show only new messages
4. User opens message detail
5. User replies, stars, deletes, reports, or blocks

## Credit Purchase
1. User opens People/Profile page
2. User clicks add credits
3. User selects package
4. User confirms payment method
5. System records transaction
6. Credit balance updates
7. Receipt/payment history is available

## Report And Block
1. User opens profile, message, or feed item
2. User selects report or block
3. User chooses reason and optional notes
4. System hides/limits future contact
5. Report enters admin queue
6. Admin reviews and takes action

Report reasons include harassment, racist/discriminatory abuse, threats or
violence, unwanted sexual content, non-consensual intimate imagery, minor-safety
concerns, scams/extortion, impersonation, doxxing, spam, and other safety issues.

## Admin Moderation
1. Admin logs into backoffice
2. Admin reviews reports queue
3. Admin opens related user/profile/message/payment context
4. Admin chooses action: warn, remove content, suspend, ban, verify, dismiss
5. System writes audit log
6. User-facing status updates where needed
