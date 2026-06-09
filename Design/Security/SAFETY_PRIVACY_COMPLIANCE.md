# Safety, Privacy, And Compliance Design

## Purpose
DatingEasy888 handles adult user profiles, conversations, photos, payments, and moderation data. The system must be designed with safety, privacy, and abuse prevention from the beginning.

## Age And Eligibility
- Users must be 18+.
- Registration should include age confirmation.
- Stronger ID/age verification can be added for higher-trust states, payments, or flagged accounts.
- Final legal requirements must be reviewed with qualified counsel before launch.

## Account Security
- Passwords must be hashed with a modern password hashing algorithm.
- Both customer and employee passwords are represented in SQL Server only by `PasswordHash`.
- Password hashing must use a unique salt and an approved modern password-hashing configuration.
- Plain passwords must never be persisted, logged, returned by APIs, or placed in remarks.
- Login attempts must be rate limited.
- Password reset links must expire.
- Sessions/tokens must be revocable.
- Suspended/banned users cannot continue active sessions.

## Privacy
- Public profile fields must be clearly separated from private/account fields.
- Private photos must not appear in public discovery.
- Email, phone, payment identifiers, and verification data are never public.
- Users need account deletion/deactivation flow.
- Data export and retention policy should be decided before launch.

## Messaging Safety
- Customer-to-customer chat is open and private by default; the service does not routinely steer, rewrite, or manually read lawful adult conversations.
- Racist or discriminatory harassment, credible threats, violent intimidation, exploitation, non-consensual intimate content, and child sexual exploitation are prohibited.
- Discussion of controversial topics or violence in news, history, fiction, recovery, or prevention is not automatically prohibited; context and credible risk matter.
- Users can block other users.
- Users can report messages.
- Blocked users cannot send new messages.
- Admin review must be limited to enough context to investigate an approved report, safety event, support need, or legal obligation.
- Every human access to private conversation evidence must be permission-controlled and audited.
- Rate limits should prevent spam messaging.

## Photo Safety
- Validate file type and size.
- Strip metadata where possible.
- Mark photos as pending/reviewed/rejected if moderation is required.
- Separate public and private photo permission rules.

## Payment Safety
- Do not store raw card numbers in the application database.
- Do not store card security code/CVV/SecCode in the application database.
- Do not store card PINs or card passwords.
- Do not store a customer's platform password in plain text; store only a modern password hash.
- Use payment provider tokens for saved payment methods.
- Store only necessary display metadata such as issuing bank, card type, last four digits, and expiration.
- Record payment events and credit ledger entries separately.
- Support refund/chargeback investigation.
- Employee payout/payment details should be stored separately from general employee profile data with restricted access and audit logging.

## Moderation
- Report queue for users, profiles, photos, messages, and feed items.
- Admin actions: dismiss, warn, remove content, suspend, ban, verify.
- Every moderation action needs an audit record.

## Abuse Prevention
- Rate limit registration, login, messaging, search, uploads, reports, and payments.
- Detect repeated failed payments.
- Detect mass messaging.
- Detect duplicate accounts where possible.
- Provide manual admin review tools before building heavy automation.

## AI-Generated Seed Customers
- AI-generated or company-operated customer profiles require a clear product, safety, and legal policy before launch.
- Internal real, seed, and robot classifications are not exposed through the
  customer UI or customer-facing APIs.
- The design must prohibit explicit false claims about offline identity,
  location, availability, or relationship commitments.
- Employee and robot access to seed conversations must be permission-controlled and audited.
- AI-generated photos, profile text, and messages require moderation rules.
- Seed profiles must not be created by copying or lightly modifying a real person's profile, photos, biography, age, or location.
- Seed assets must be fully synthetic, commissioned, or commercially licensed with appropriate model consent.
- Every seed profile requires provenance, originality review, adult-appearance review, and human approval before publication.
- Credit charges involving seed conversations must be transparent to the paying customer.
- The system must record whether each message was employee-written, prepared text, AI-assisted, or robot-generated.
- Prepared text and AI responses must not fabricate real-world identity, location, availability, or personal experiences.

## Compliance Notes
- Legal, privacy, payment, and age-verification requirements vary by jurisdiction and can change.
- This document is a product/security design draft, not legal advice.
- Before production launch, review terms, privacy policy, refund policy, arbitration/consumer clauses, and age/identity verification requirements with legal counsel.
