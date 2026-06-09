# Admin Backoffice Design

## Admin Purpose
The admin system gives company staff tools to manage users, review reports, verify accounts, investigate payments, and monitor platform health.

## Admin Roles
- Administrator
- Super admin
- Support agent
- Moderator
- Payment analyst
- Read-only analyst

## Main Admin Sections
- Dashboard
- Employee Accounts
- Robot Employees
- Robot Customers
- Users
- Profiles
- Photos
- Reports
- Messages review
- Payments
- Credits ledger
- Verification
- Audit logs
- Cloud Services
- Security Center
- Policy Maintenance
- Scheduled Tasks
- Monthly Reports
- Year-End Reports
- Settings/reference data

The Administrator may use every operational section. Only outgoing company
payment approval is excluded and requires the CEO.

## Dashboard Widgets
- New users today
- Active users today
- Messages sent today
- Open reports
- Suspended users
- Payment volume
- Failed payments
- Chargebacks/refunds

## User Management
- Search by user ID, email, display name
- Filter by status, verification, country, signup date
- View profile details
- View photos
- View credit balance and ledger
- View report history
- View login/security events
- Actions: warn, suspend, ban, restore, verify, reset password, force logout

## Employee Account Management
- Create human or robot employee accounts
- Assign roles and permissions
- Set work field, start date, and status
- Activate, suspend, reactivate, or close accounts
- Start password activation/reset for human employees
- Assign seed-customer responsibility
- Review workload, activity, contribution, earnings, and security history

## Robot Customer Management
- Search robot profiles by city, sex, status, health, shift, and daily time
- Open and edit the same profile fields presented for real customers
- Preview the customer-visible profile without exposing internal classification
- Review provenance, originality, rights, adult-appearance, and approval history
- Activate, suspend, retire, restore, or replace a robot profile
- Maintain approved large-city coverage and timezone
- Require at least three Man and three Woman robots per active large city
- Review current and next shifts, reserves, and daily remaining time
- Show whether one Man and one Woman are currently online in each city
- Alert when coverage is degraded or no eligible same-sex reserve exists
- Prevent manual controls from exceeding eight hours per robot per local day
- Audit every profile, status, city, shift, and emergency replacement change
- Display the global robot language mode: `LocalOnly` or
  `HybridExternalAllowed`
- Show outside-AI provider/model health, calls, token use, estimated daily and
  monthly cost, budget remaining, fallback count, and rejection count
- Permit a reasoned, reauthenticated global mode change without exposing the
  provider credential

## Cloud Service Maintenance
- Maintain CloudService records
- Track provider, service dates, capacity, backup, cost, invoice, and status
- Show expiration and renewal alerts
- Record upgrades, renewals, cancellations, and service-history notes
- Keep credentials and secrets outside CloudService records

## Security Center
- Review login and access events
- Review robot-job and administrative security events
- Revoke sessions or service credentials
- Suspend compromised accounts
- Review unusual chat, payment, or workload patterns
- Track incident severity, owner, status, resolution, and audit history

## Scheduled Tasks
- Create and update timed-task definitions
- Configure schedule and timezone
- Enable, disable, pause, or resume tasks
- View last run, next run, duration, status, retry count, and failure details
- Retry eligible failed tasks
- Plan and activate robot-customer city shifts
- Monitor one-Man/one-Woman city coverage at least once per minute
- Activate eligible same-sex reserves after failed handoffs
- Reconcile robot daily online time and enforce the eight-hour limit
- Require administrator reauthentication, reason, confirmation, and audit for
  financial, security, and high-impact robot tasks

## Policy Maintenance
- Search a categorized policy catalog
- Edit policies through typed controls rather than unrestricted raw configuration
- Validate safe ranges and cross-policy rules
- Compare current and proposed values
- Publish immediately or schedule activation
- Retire, emergency-disable, or roll back configured policies
- View immutable version and audit history
- Monitor active-version propagation across services and jobs
- Preserve the policy version used by completed messages, charges, gifts, reports, and assignments
- Prohibit secrets, executable code, and any setting that bypasses CEO outgoing-payment approval
- Maintain typed controls for robot outside-AI mode, pinned provider/model,
  token limits, timeout, retry limits, and daily/monthly budgets

## Monthly Reports
- Generate EmployeeMonthReport and CompanyMonthReport
- Validate source records and review exceptions
- Recalculate drafts
- Finalize and lock approved reports
- Record corrections without silently replacing finalized history

## Year-End Reports
- Generate annual company reports from finalized monthly reports
- Summarize revenue, employee payments, advertising, cloud services, credits, and adjustments
- Review source months and exceptions
- Finalize and lock approved annual reports

## Report Queue
- Report type: profile, message, photo, feed, payment, other
- Priority
- Reporter
- Reported user
- Evidence/context
- Status: open, in review, resolved, dismissed
- Resolution notes
- Assigned admin

## Payment Review
- Payments list
- User transaction history
- Payment status
- Refund/chargeback markers
- Credit ledger reconciliation
- Prepare outgoing company payments for separate CEO approval
- Never approve or release outgoing company payments from an administrator session

## Audit Requirements
- Every admin action records actor, target, action, before/after values, timestamp, IP/device where available.
- Sensitive views may also write audit entries.
- Audit log should not be editable by normal admins.
- Employee creation, role changes, cloud-service changes, security actions, timed-task changes, and report finalization must always be audited.

## Admin UX Principles
- Large-desktop-only interface
- Dense, searchable, table-first layout
- Clear user status labels
- Fast moderation workflow
- Robust behavior with clear loading, error, retry, and recovery states
- Keyboard-efficient navigation for frequent actions
- Stable layouts that do not shift when data refreshes
- Preserve filters, sorting, pagination, and work context
- No destructive action without confirmation
- Every action needs reason/notes for audit-sensitive changes
