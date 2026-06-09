# Customer Frontend API Contracts

Status: version 1 design draft.

Base routes:
- Public authentication: `/api/v1/auth/customer`
- Authenticated customer: `/api/v1/customer`

## 1. Customer Authentication

### Register
`POST /api/v1/auth/customer/register`

Idempotency required.

Request:
```json
{
  "email": "customer@example.com",
  "password": "submitted-over-tls",
  "displayName": "Alex",
  "birthDate": "1990-04-12",
  "sex": "Man",
  "countryCode": "US",
  "state": "CA",
  "city": "Los Angeles",
  "acceptedTermsVersion": "terms-2026-01",
  "acceptedPrivacyVersion": "privacy-2026-01",
  "ageConfirmed": true
}
```

Response `201`:
```json
{
  "customerId": "uuid",
  "profileStatus": "Incomplete",
  "registrationReward": {
    "creditsGranted": 50,
    "granted": true
  },
  "creditBalance": 50,
  "nextStep": "CompleteProfile"
}
```

Rules:
- Customer must be 18+.
- Country, state/province, and city are required.
- Email is normalized and unique.
- Password is hashed and never returned.
- Eligible real customer receives the one-time 50-credit reward.
- Seed accounts cannot be created through this route.
- Duplicate/fraud eligibility checks may delay reward grant.

### Login
`POST /api/v1/auth/customer/login`

Request:
```json
{
  "email": "customer@example.com",
  "password": "submitted-over-tls",
  "deviceName": "Mobile Safari"
}
```

Response:
```json
{
  "customer": {
    "customerId": "uuid",
    "displayName": "Alex",
    "profileStatus": "Complete",
    "active": true
  },
  "session": {
    "expiresAt": "2026-06-07T20:00:00Z",
    "idleTimeoutSeconds": 1200,
    "manualApprovalRequired": false
  }
}
```

Rules:
- The authenticated customer must be at least 18 years old.
- Successful login immediately permits every action exposed as enabled by the customer UI.
- No employee or administrator approval endpoint exists for normal customer use.
- Each command still enforces current balance, block, consent, rate-limit,
  account-state, legal, safety, and service rules on the server.
- UI availability never overrides another customer's acceptance or consent.
- The customer session ends after 1,200 consecutive seconds without meaningful customer interaction.
- Background reconciliation, incoming events, timers, and open pages do not count as customer activity.
- After successful login, the Frontend opens Messages and requests the
  conversation list in latest-activity-first order.

### Logout
`POST /api/v1/auth/customer/logout`

Rules:
- Logout revokes the session and performs no credit-balance settlement.
- The request contains no customer credit total or balance-changed flag.
- Closing the browser, losing connectivity, or idle timeout produces the same
  financial result: already committed transactions remain durable and no
  uncommitted Frontend balance is written to SQL Server.

### Refresh Session
`POST /api/v1/auth/customer/session/refresh`

Refreshing credentials does not bypass the twenty-minute inactivity timeout.
After an idle timeout, the server rejects authenticated commands and requires a
new login. Pending paid commands are not submitted automatically.

### Forgot Password
`POST /api/v1/auth/customer/password-reset-requests`

Always returns a neutral response to avoid account enumeration.

Request includes the account full name plus either the registered email or
registered phone. A verified request is queued for administrator approval
unless the active policy enables automatic approval.

Approval revokes existing sessions and sends a one-time temporary password
through the verified channel. The temporary password is stored only as a hash
and requires replacement after sign-in.

### Change Password
`POST /api/v1/customer/me/password`

Request includes the current password and new password. Customers may use this
at any time; temporary-password sessions must use it before continuing normal
account use.

### Verify Email
`POST /api/v1/auth/customer/email/verify`

## 2. Current Customer

### Get Current Customer
`GET /api/v1/customer/me`

Response:
```json
{
  "customerId": "uuid",
  "email": "customer@example.com",
  "displayName": "Alex",
  "active": true,
  "profileCompleteness": 80,
  "creditBalance": 50,
  "unread": {
    "messages": 3,
    "mail": 1,
    "notifications": 2
  },
  "verificationStatus": "EmailVerified",
  "capabilities": {
    "discover": true,
    "sendMessage": true,
    "sendProfileRequest": true,
    "buyCredits": true,
    "sendGift": true
  }
}
```

`capabilities` tells the Frontend which actions to enable. A capability is
calculated by the server and does not require manual staff approval.

### Deactivate Account
`POST /api/v1/customer/me/deactivate`

Request requires password confirmation or recent authentication.

### Request Data Export
`POST /api/v1/customer/me/data-export`

Returns asynchronous operation.

## 3. Profile

### Get Own Profile
`GET /api/v1/customer/profile`

### Update Profile
`PUT /api/v1/customer/profile`

Selecting `Me` opens this customer's own profile in review/edit mode. It does
not open discovery or another customer's profile.

Request:
```json
{
  "version": 4,
  "displayName": "Alex",
  "birthDate": "1990-04-12",
  "sex": "Man",
  "genderLookingFor": "Woman",
  "countryCode": "US",
  "stateId": "US-CA",
  "cityName": "Los Angeles",
  "maritalStatus": "Single",
  "workField": "Engineering",
  "englishLevel": "Fluent",
  "personalityType": "CareerChaser",
  "story": "Profile story",
  "bio": "Public biography",
  "languages": ["English", "Mandarin"],
  "traits": ["Honest", "Kind"],
  "interests": ["Traveling", "Cooking"],
  "movies": ["Documentary", "Comedy"],
  "music": ["Jazz", "Folk"],
  "goals": ["Finding a friend"],
  "preferredAgeMin": 35,
  "preferredAgeMax": 55,
  "profilePhoto": "processed-photo-reference",
  "publicPhotos": ["processed-photo-reference"],
  "privatePhotos": [],
  "completeProfile": true
}
```

Rules:
- Customer type (`Seed` value), credits, totals, verification, and internal remarks are not customer-editable.
- Birth date changes may require review.
- Public/private field boundaries are enforced server-side.
- Missing uploads use a sex-based illustrated default photo.
- A newly registered customer remains `ProfileCompleted = false` until every
  required field passes validation.

### Update Profile Preferences
`PUT /api/v1/customer/profile/preferences`

Includes languages, traits, interests, movies, music, dating goals, and age range.

### Get Public Profile
`GET /api/v1/customer/profiles/{customerId}`

Response includes:
```json
{
  "customerId": "uuid",
  "displayName": "Mia",
  "age": 35,
  "cityName": "Los Angeles",
  "isOnline": true,
  "photos": [],
  "interests": []
}
```

Private account/payment/admin fields are never included.

Conversation rules:
- A real authenticated customer may create a conversation with type 0, 1, or 2.
- Type 1 responds only through its assigned employee.
- Type 2 responds only through the autonomous robot-customer service.
- Two non-real customer profiles cannot share a conversation.

Opening another eligible customer's full profile records a profile visit
according to visitor privacy policy. Self-views, blocked relationships, and
admin/moderation/support review do not create a customer-visible visit.

## 4. Photos

### Create Upload Request
`POST /api/v1/customer/photos/upload-request`

Request:
```json
{
  "photoType": "Public",
  "fileName": "profile.jpg",
  "contentType": "image/jpeg",
  "sizeBytes": 200000,
  "sourceWidth": 1200,
  "sourceHeight": 900
}
```

The upload policy states that the processed profile image must fit within
100 x 100 pixels. Source dimensions are hints only and are verified by the
media processor. The source may use any safely decodable image format supported
by the processor; the completed derivative is always JPG or PNG.

### Complete Upload
`POST /api/v1/customer/photos/complete`

Successful completion returns processed dimensions, content type, byte size,
and preview URL. The processed width and height are each at most 100 pixels,
aspect ratio is preserved, and smaller images are not enlarged. Processed
content type is `image/jpeg` or `image/png`; transparency requires PNG and
ordinary photographs normally use JPG.

### Update Photo
`PATCH /api/v1/customer/photos/{photoId}`

Supports primary status, public/private classification, and sort order.

### Delete Photo
`DELETE /api/v1/customer/photos/{photoId}`

Delete behavior follows retention/moderation rules.

## 5. Discovery

### Browse Profiles
`GET /api/v1/customer/discovery/profiles`

Filters:
- `view=all|online|following|active`
- `countryCode`
- `stateId`
- `cityName`
- `ageFrom`
- `ageTo`
- `lookingFor`
- `interests`
- `cursor`

Customer-facing response cards omit internal real, seed, and robot
classification fields. Those fields are available only through authorized
employee and administration contracts.
The response contains at most 20 profiles and returns `nextCursor` when more exist.
Selecting a result opens `GET /api/v1/customer/profiles/{customerId}` as a
full profile page. From that page, the customer may start/continue Chat or
return to the unchanged discovery/search result list.

### List Favorites
`GET /api/v1/customer/favorites`

Returns at most 20 favorited profile cards. Selecting the Favorites navigation
tab opens this list, and selecting a card opens the same full profile page used
by discovery and search.

### Add Or Remove Favorite
- `POST /api/v1/customer/profiles/{customerId}/favorite`
- `DELETE /api/v1/customer/profiles/{customerId}/favorite`

### Like
- `POST /api/v1/customer/profiles/{customerId}/like`
- `DELETE /api/v1/customer/profiles/{customerId}/like`

### Follow
- `POST /api/v1/customer/profiles/{customerId}/follow`
- `DELETE /api/v1/customer/profiles/{customerId}/follow`

### List Profile Visitors
`GET /api/v1/customer/profile-visitors`

Filters:
- `view=all|recent|online`
- `cursor`

Response items include:
- Visitor public profile card
- Privacy-controlled presence
- Relative last-visit time
- Visit count only if the final privacy policy permits it

Rules:
- Blocked relationships are excluded.
- Internal employee/admin review never appears.
- Exact visit time may be reduced to a relative bucket.
- Fake or generated visitor activity is prohibited.

### List Interaction Request Templates
`GET /api/v1/customer/interaction-request-templates`

Query:
- `requestType`
- `targetCustomerId`

Returns only active templates eligible for the sender, recipient, profile type,
adult verification, language, consent preference, and current policy.

Response item:
```json
{
  "templateCode": "FLIRT_CAUGHT_MY_EYE",
  "requestType": "Flirt",
  "displayText": "You caught my eye.",
  "creditCost": 0,
  "confirmationRequired": false
}
```

Templates that claim an unverified nearby location, offline meeting, marriage,
or real-world availability are not returned for virtual profiles.

### Send Profile Interaction Request
`POST /api/v1/customer/profiles/{customerId}/interaction-requests`

Idempotency required.

Request:
```json
{
  "requestType": "Hug",
  "templateCode": "HUG_WARM"
}
```

Allowed values:
- `Hello`
- `Cuddle`
- `Hug`
- `Flirt`
- `Teasing`
- `SexRequest`

Rules:
- Blocked, suspended, restricted, or ineligible relationships fail.
- Only one pending request exists between the same sender and recipient.
- Customer responses omit internal real, seed, and robot classifications.
- `SexRequest` requires verified adults and recipient preference eligibility.
- `SexRequest` requests an intimate-consent flow; it is not consent.
- Template code must be active and eligible for the selected request type.
- The server stores an approved display-text snapshot for audit and future template changes.
- The UI displays the exact cost, if any, on the request action. Selection sends
  directly without a separate payment confirmation.
- The server calculates cost and rejects an insufficient balance atomically.

### List Interaction Requests
`GET /api/v1/customer/interaction-requests`

Filters:
- `direction=incoming|outgoing`
- `status=Pending|Accepted|Declined|Expired|Cancelled`
- `cursor`

### Respond To Interaction Request
`POST /api/v1/customer/interaction-requests/{requestId}/response`

Request:
```json
{
  "response": "Accept"
}
```

Allowed responses:
- `Accept`
- `Decline`

Accepting `SexRequest` starts the separate mutual intimate-consent workflow. No
response, decline, or expiry is consent.

### Cancel Pending Interaction Request
`DELETE /api/v1/customer/interaction-requests/{requestId}`

## 6. Conversations

### List Conversations
`GET /api/v1/customer/conversations`

Filters:
- `view=all|active|requests|archived`
- `unreadOnly`
- `cursor`

Response item:
```json
{
  "conversationId": "uuid",
  "otherCustomer": {
    "customerId": "uuid",
    "displayName": "Mia"
  },
  "lastMessage": {
    "chatRecordId": "uuid",
    "preview": "Hello...",
    "chatTime": "2026-06-07T18:30:00Z",
    "creditUsed": 5
  },
  "unreadCount": 1
}
```

Default sort is descending by latest conversation activity. The first item is
the conversation with the newest sent or received message.

### Get Conversation
`GET /api/v1/customer/conversations/{conversationId}`

Returns customer-safe conversation metadata, block state, consent state, and
paginated ChatRecords. Internal customer classification is omitted.

### Mark Conversation Read
`POST /api/v1/customer/conversations/{conversationId}/read`

### Archive Conversation
`POST /api/v1/customer/conversations/{conversationId}/archive`

## 7. Message Cost And Send

### Send Text Message
`POST /api/v1/customer/conversations/{conversationId}/messages/text`

Idempotency required.

Request:
```json
{
  "text": "How was your day?"
}
```

Response:
```json
{
  "chatRecordId": "uuid",
  "chatTime": "2026-06-07T18:30:00Z",
  "creditUsed": 5,
  "creditBalance": 45,
  "deliveryStatus": "Accepted",
  "robotReply": null
}
```

Rules:
- The composer displays `5 credits` beside the Send action.
- Selecting Send submits immediately without a separate confirmation.
- Server counts words.
- More than 60 words returns `MESSAGE_TOO_LONG`.
- Insufficient balance returns `INSUFFICIENT_CREDITS` and creates no message or
  ledger entry.
- ChatRecord, CreditLedger, and CustomerProfile.CreditsRemain commit atomically.
- `creditBalance` is the newly committed `CustomerProfile.CreditsRemain` value.
- Blocked/closed conversations cannot charge or send.
- For a robot-customer recipient, `robotReply` contains the autonomous
  `RobotGenerated` response accepted under the robot profile. It is null for
  real and seed recipients.

### Preview Media Message
`POST /api/v1/customer/conversations/{conversationId}/messages/media/preview`

Returns the 10-credit cost and processing policy:
- Picture: convert to JPG/PNG, fit within 100 x 100 pixels, preserve aspect ratio, compress
- Voice: transcode and compress to the approved audio policy

### Create Media Upload
`POST /api/v1/customer/conversations/{conversationId}/messages/media/upload-request`

### Send Media Message
`POST /api/v1/customer/conversations/{conversationId}/messages/media`

Idempotency required. The customer confirms the processed preview before send.
Charging and message acceptance occur only after processing succeeds.

Successful response:
```json
{
  "chatRecordId": "uuid",
  "chatTime": "2026-06-07T18:31:00Z",
  "creditUsed": 10,
  "creditBalance": 35,
  "deliveryStatus": "Accepted"
}
```

For pictures, both processed dimensions must be at most 100 pixels. For voice,
the exact processed duration and byte limit remain policy-configured. A failed
or unsafe conversion rejects the message without consuming credits.

## 8. Adult Intimate Topic Consent

### Get Consent State
`GET /api/v1/customer/conversations/{conversationId}/consents/intimate`

### Grant Consent
`POST /api/v1/customer/conversations/{conversationId}/consents/intimate`

### Withdraw Consent
`DELETE /api/v1/customer/conversations/{conversationId}/consents/intimate`

Rules:
- Both participants must be verified adults.
- Withdrawal applies immediately.
- Consent events are audited.

## 9. Credits

### Get Balance
`GET /api/v1/customer/credits/balance`

Response:
```json
{
  "creditBalance": 45,
  "asOf": "2026-06-07T18:30:00Z"
}
```

`creditBalance` is read from the committed
`CustomerProfile.CreditsRemain` value.

The Frontend may use this endpoint after login, reload, reconnect, or a detected
mismatch. It cannot submit a replacement balance through this endpoint.

### Get Packages
`GET /api/v1/customer/credits/packages`

Returns the confirmed fixed packages. Above-$100 custom calculation is omitted until policy is confirmed.

### Get Credit Ledger
`GET /api/v1/customer/credits/ledger`

Filters:
- `transactionType`
- `from`
- `to`
- `cursor`

## 10. Payment Methods

### List Payment Methods
`GET /api/v1/customer/payment-methods`

Returns only:
- CustomerPaymentMethodId
- BankName
- CardType
- CardLast4
- ExpirationMonth/Year
- IsPrimary
- Active

### Create Provider Setup
`POST /api/v1/customer/payment-methods/setup`

Returns provider-controlled setup information. Raw card data is not sent through DatingEasy888 Web Service.

### Confirm Saved Method
`POST /api/v1/customer/payment-methods/confirm`

### Set Primary
`POST /api/v1/customer/payment-methods/{paymentMethodId}/primary`

### Remove
`DELETE /api/v1/customer/payment-methods/{paymentMethodId}`

## 11. Credit Purchase

### Create Checkout
`POST /api/v1/customer/credit-purchases/checkout`

Idempotency required.

The Arfa prototype uses
`POST /api/v1/customer/credit-purchases/simulate`. It accepts the selected
package, cardholder name, card number, expiration month/year, and security code
for validation. Only cardholder name, card type, last four digits, and
expiration are stored; full card numbers and security codes are discarded.

Request:
```json
{
  "packageId": 5,
  "paymentMethodId": "uuid",
  "currencyCode": "USD"
}
```

Response:
```json
{
  "checkoutId": "uuid",
  "amount": 100.00,
  "currencyCode": "USD",
  "credits": 1500,
  "status": "RequiresProviderConfirmation"
}
```

### Get Checkout
`GET /api/v1/customer/credit-purchases/{checkoutId}`

### Purchase History
`GET /api/v1/customer/credit-purchases`

Provider callbacks atomically finalize the ChargeRecord, CreditLedger, and
`CustomerProfile.CreditsRemain`. The confirmed checkout result and balance
change event contain the new committed balance.

## 12. Gifts

### List Gifts
`GET /api/v1/customer/gifts`

Returns every available gift with its icon, name, sender cost, recipient share,
and non-refundable status. The conversation UI displays this gift panel
directly below the chat area.

### Send Gift
`POST /api/v1/customer/conversations/{conversationId}/gifts`

Idempotency required.

Request:
```json
{
  "giftId": 1
}
```

Response:
```json
{
  "giftTransactionId": "uuid",
  "chatRecordId": "uuid",
  "creditUsed": 100,
  "creditBalance": 400,
  "deliveryStatus": "Accepted",
  "refundable": false
}
```

Rules:
- Selecting a gift sends it immediately without a separate confirmation.
- The gift icon and exact credit cost are visible before selection.
- Insufficient balance returns `INSUFFICIENT_CREDITS`; no gift chat record,
  transaction, balance change, recipient share, or ledger entry is created.
- Every successfully sent gift is final and non-refundable.
- Sender deduction, recipient or employee grant, platform share,
  GiftTransaction, ChatRecord, ledger entries, and affected current balances
  commit atomically.
- `creditBalance` is the sender's newly committed
  `CustomerProfile.CreditsRemain` value.
- For a real-member recipient, the 80% share enters the recipient customer credit ledger.
- For a seed recipient, the 80% share enters the overseeing employee credit ledger.
- The gift snapshots the seed's overseeing `EmployeeId` at send time.
- If no eligible overseeing employee can be resolved, the gift is rejected
  before charging.
- Later seed reassignment does not alter completed gift attribution.

## 13. Blocking And Reporting

### Block Customer
`POST /api/v1/customer/profiles/{customerId}/block`

### Unblock Customer
`DELETE /api/v1/customer/profiles/{customerId}/block`

### List Blocked Customers
`GET /api/v1/customer/blocked-customers`

### Create Report
`POST /api/v1/customer/reports`

Request:
```json
{
  "targetType": "Message",
  "targetId": "uuid",
  "reasonCode": "DiscriminatoryAbuse",
  "comments": "Optional details"
}
```

Initial `reasonCode` values:
- `Harassment`
- `DiscriminatoryAbuse`
- `ThreatOrViolence`
- `UnwantedSexualContent`
- `NonConsensualIntimateImage`
- `MinorSafety`
- `ScamFraudOrExtortion`
- `Impersonation`
- `PrivacyOrDoxxing`
- `Spam`
- `OtherSafety`

### Get Own Report
`GET /api/v1/customer/reports/{reportId}`

Only limited status is returned; internal moderation notes are hidden.

## 14. Notifications And Real-Time

### Reconcile Online Activity
`GET /api/v1/customer/activity/updates`

Query:
- `since`: opaque cursor from the previous response

Response:
```json
{
  "nextCursor": "opaque-cursor",
  "serverTime": "2026-06-07T18:33:00Z",
  "unread": {
    "chats": 2,
    "inbox": 1,
    "interactionRequests": 1
  },
  "changes": {
    "conversations": [],
    "chatHistoryPresence": [],
    "favorites": [],
    "inbox": [],
    "searchProfiles": [],
    "interactionRequests": [],
    "creditBalance": null
  },
  "searchResultsChanged": true
}
```

Rules:
- Frontend calls at least every 180 seconds while the authenticated customer is online.
- Real-time events may arrive earlier.
- Reconcile immediately after reconnect or page foregrounding.
- Cursor replay is safe and produces no duplicate business event.
- Search deltas do not force visible-list reordering during interaction.
- When present, `changes.creditBalance` is the latest committed
  `CustomerProfile.CreditsRemain` value.

### List Notifications
`GET /api/v1/customer/notifications`

### Mark Notification Read
`POST /api/v1/customer/notifications/{notificationId}/read`

Proposed SignalR events:
- `conversation.messageCreated`
- `conversation.readUpdated`
- `conversation.presenceChanged`
- `favorite.presenceChanged`
- `inbox.messageCreated`
- `search.resultsChanged`
- `interactionRequest.created`
- `interactionRequest.responded`
- `credits.balanceChanged`
- `notification.created`
- `profile.statusChanged`
- `session.revoked`

`credits.balanceChanged` payload:
```json
{
  "creditBalance": 45,
  "changedAt": "2026-06-07T18:30:00Z",
  "reason": "TextMessageCharge"
}
```

The event is published only after the database transaction commits. The
Frontend replaces its displayed value with `creditBalance`.
