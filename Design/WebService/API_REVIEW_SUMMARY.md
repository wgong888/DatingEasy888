# API Contract Review Summary

Prepared for the next design discussion.

## Draft Completed
- Shared API protocol and security standards
- Stable error catalog
- Customer authentication and registration reward
- Customer profile, photos, discovery, likes, and follows
- Conversations and paid message/media flows
- Internal seed classification and customer-facing profile presentation
- Adult-topic consent
- Credit packages, ledger, payment methods, checkout, and purchase history
- Gifts and 80/20 split
- Customer blocking and reporting
- Three-minute online activity reconciliation with real-time event support
- Profile interaction requests: Hello, Cuddle, Hug, Flirt, Teasing, and SexRequest
- Approved/versioned request templates and profile visitor history
- Employee desktop workspace
- 20 active seed profiles and 10 chat assignments
- Prepared-text and AI-assisted response flows
- Admin policy catalog, validation, publication, scheduling, rollback, and propagation
- Employee/admin account management
- Seed assignment and rebalancing
- Moderation and security operations
- Robot identity, work leases, replies, heartbeat, pause, and escalation
- Charges and credit reconciliation
- Daily, monthly, employee, and year-end reports
- Advertisement and cloud-service records
- Scheduled tasks and asynchronous operations

## Proposed Technical Decisions
- Versioned routes under `/api/v1`
- One C# Web Service with modular route areas
- Customer, Backend, admin, robot, and provider-integration boundaries
- UUID identifiers
- UTC ISO 8601 timestamps
- Fixed 20-record cursor pagination with explicit `Next`
- Idempotency keys for financial, message, gift, report, task, and robot commands
- Resource versions for editable records
- Assignment lease tokens for employee/robot seed work
- SignalR for real-time events, REST for initial state and recovery
- Provider-tokenized payment methods

## Highest-Priority Policy Questions
1. Does above-$100 pricing mean `credits = USD x 16`?
2. What voice duration, processed byte limit, codec, and audio source formats are supported?
3. Is the employee 30% reward based on gross or net eligible revenue?
4. How may human employees redeem gift credits, and how are robot-employee credits represented in company accounting?
5. What happens when a message exceeds 60 words?
6. What is the final refund and chargeback credit policy?
7. What timezone defines daily/monthly reporting?
8. How is revenue attributed to an employee?
9. How should the 20-city/2,000-seed rule reconcile with the newer 1,000-seed limit?
10. Which prepared-text categories can robots send without per-message human approval?

## Safety And Trust Requirements Embedded In Contracts
- Customer APIs omit internal real, seed, and robot classifications.
- Paid actions expose exact cost without exposing internal classification.
- Message source records employee, prepared text, AI assistance, or robot.
- Adult intimate topics require verified adults and consent.
- SexRequest is an invitation into the consent flow and is never consent by itself.
- Robot safety-sensitive conversations transfer to humans.
- Card secrets and plain passwords are never exposed.
- Sensitive admin, security, financial, and moderation actions are audited.

## Not Yet Fully Designed
- Detailed feed/newsfeed contracts
- Social-login provider contracts
- Exact photo/private-photo sharing rules
- Customer notification preference contracts
- Charge refund and chargeback commands remain pending policy; gift reversal is prohibited
- Final export formats
- Exact role/permission matrix
- Exact rate limits

## Recommended Discussion Order
1. Resolve credit/media/gift/reward policy questions
2. Confirm customer chat and customer-classification visibility behavior
3. Confirm employee workspace and assignment behavior
4. Confirm robot autonomy and mandatory human review topics
5. Confirm admin roles and approvals
6. Confirm reporting timezone and financial calculation basis
7. Review route names and payloads
