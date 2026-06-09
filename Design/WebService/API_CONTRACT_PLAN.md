# DatingEasy888 Web Service API Contract Plan

## Status
Version 1 design draft. This is a contract specification, not implementation code.

The Web Service is the C#/.NET middle layer used by:
- Customer Frontend
- Employee/admin Backend
- Robot automatic jobs

All relational data is stored in SQL Server. Frontend and Backend UIs never connect directly to the database.

## Contract Documents
- `API_STANDARDS.md`: shared protocol, authentication, pagination, errors, idempotency, and audit rules
- `CUSTOMER_API_CONTRACTS.md`: customer registration, profiles, discovery, chat, credits, gifts, payments, and safety
- `BACKEND_API_CONTRACTS.md`: employee workspace, seed operations, administration, moderation, cloud services, and prepared text
- `ROBOT_API_CONTRACTS.md`: robot identity, work leasing, replies, heartbeat, limits, and escalation
- `FINANCE_OPERATIONS_API_CONTRACTS.md`: charges, ledgers, daily/monthly/yearly reports, advertisements, cloud expenses, and timed tasks
- `ERROR_CATALOG.md`: stable error codes and HTTP mappings

## Route Areas

| Area | Base route | Principal |
|---|---|---|
| Public/authentication | `/api/v1/auth` | Anonymous or authenticated |
| Customer | `/api/v1/customer` | Customer |
| Employee workspace | `/api/v1/backend` | Employee |
| Administration | `/api/v1/admin` | Authorized administrator |
| Robot operations | `/api/v1/robot` | Robot service identity |
| Internal provider callbacks | `/api/v1/integrations` | Verified external provider |

## Service Modules
- Authentication and sessions
- Customer profile and preferences
- Photos and media
- Discovery, likes, and follows
- Conversations and chat
- Credits, gifts, charges, and payment methods
- Employee accounts and seed assignments
- Employee conversation workspace
- Prepared conversation text
- Robot work orchestration
- Moderation and security
- Financial reporting
- Advertisement and cloud-service expenses
- Scheduled tasks
- Audit and operations

## Contract Design Principles
- Use customer terminology consistently; do not expose old `User` naming.
- Use UUID strings for all public identifiers.
- Use integer credits and decimal money values.
- Never expose password hashes, card secrets, full card numbers, service secrets, or internal security data.
- Every financial operation is idempotent and auditable.
- Every seed conversation response preserves internal classification,
  profile-integrity, and response-source metadata without exposing the
  classification to customer clients.
- Customer-facing paid actions show cost before confirmation.
- Backend and robot permissions are deny-by-default.
- Finalized reports are immutable except through controlled correction workflows.

## Pending Policy Dependencies
The following contracts are drafted with explicit policy placeholders:
- Purchases above $100
- Voice duration, processed byte limit, codec, and accepted audio source formats
- Gross versus net employee reward basis
- Employee gift-credit redemption and robot-attribution treatment
- Refund and chargeback credit treatment
- Final customer status model
- Final payment provider
- Final reporting timezone
- Final city/seed allocation reconciliation

These dependencies do not prevent contract review, but affected operations cannot become production-ready until resolved.

## Review Order
1. API standards and error catalog
2. Customer authentication/profile/discovery
3. Customer chat, credits, gifts, and payments
4. Employee workspace and seed assignment
5. Robot work protocol
6. Admin, moderation, and security
7. Finance, reports, cloud services, advertisements, and scheduled tasks

## Design Completion
The first complete contract draft now covers all currently described modules. Review and policy confirmation are still required before implementation.
