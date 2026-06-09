# System Architecture Design

## Working Architecture
DatingEasy888 uses four clearly named product areas:

- Frontend: customer-facing website
- Backend: employee/admin UI and robot automatic jobs
- Web Service: C#/.NET middle layer used by Frontend and Backend
- Database: SQL Server relational storage

Naming note:
- In this project, `Backend` does not mean the C# API.
- `Backend` specifically means the internal company application and its automated robot jobs.
- The C# API layer is called `Web Service`.

## Logical Components
- Customer Frontend
- Employee/Admin Backend
- Robot Job Backend
- Authentication service
- Profile service
- Discovery/search service
- Messaging service
- Feed/activity service
- Credit/payment service
- Media/photo service
- Notification service
- Moderation/admin service
- Audit/logging service

## Frontend Responsibilities
- Serve customers only.
- Render pages and templates
- Maintain browser session state
- Validate forms before submit
- Call C# API endpoints
- Show loading, error, empty, and success states
- Adapt layout for desktop, tablet, and mobile

## Backend Responsibilities
- Serve employees, administrators, finance staff, moderators, and other authorized company workers.
- Provide employee and admin dashboards.
- Manage seed-customer assignments.
- Support human employee work involving assigned seed customers.
- Run and monitor robot automatic jobs.
- Review customers, chats, charges, reports, advertisements, and cloud-service records according to permissions.
- Display operational and financial reports.
- Call the Web Service for every database read or write.
- Never connect directly to SQL Server from the UI.

## Web Service Responsibilities
- Own business rules
- Validate all input again server-side
- Enforce separate customer, employee, administrator, finance, moderator, and robot-service authorization
- Manage profile, message, credit, payment, report, and admin actions
- Return consistent error responses
- Produce audit events for sensitive actions
- Support both the customer Frontend and company Backend.
- Provide controlled operations for robot automatic jobs.

## Database Responsibilities
- Store user accounts, profiles, messages, credits, payments, reports, and audit logs
- Enforce relational integrity
- Support search/filter queries with indexes
- Preserve immutable transaction and audit history

## Integration Style
- REST API for normal page data and actions
- SignalR/WebSocket-compatible real-time delivery for chat and notifications
- REST reconciliation at least every three minutes while a customer is online
- File upload endpoint for photos
- Payment provider integration through the Web Service only
- Admin APIs separated by role and route prefix

## Design Sequence
1. Review and approve the Customer, Employee, and Administrator manuals.
2. Review Web Service API contracts against the approved manual workflows.
3. Review database tables against approved API states and transactions.
4. Complete implementation planning, tests, deployment, and release scope.
5. Begin implementation only after explicit approval.

## Environments
- Local development
- Test/staging
- Production

## Cross-Cutting Requirements
- HTTPS everywhere in production
- JWT or secure server session authentication
- Role-based authorization
- Rate limiting on auth, messaging, search, uploads, and payments
- Structured logging
- Audit trail for admin and financial operations
- Privacy controls for personal data

## Open Architecture Decisions
- Python framework: Flask vs Django
- C# framework version: ASP.NET Core target version
- Auth style: JWT-only vs cookie session plus API token
- Real-time transport and fallback: SignalR/WebSocket plus controlled polling behavior
- Payment provider: Stripe, PayPal, or other processor
- Photo storage: local storage for dev, cloud object storage for production
