# CEO Dashboard Design

Status: implemented prototype direction.

The CEO dashboard is a large-desktop, full-width workspace divided horizontally
into four stacked panels.

## Panel A: Revenue And Expense

Panel A displays current-year, current-month, and current-day values for:

- Revenue from successful customer credit charges
- Expense from outgoing company payments approved by the CEO
- Net value calculated as revenue minus expense

All periods use UTC. Pending and denied payment requests are not expenses.

## Panel B: Online Presence

Panel B displays current online numbers for:

- Real customers with active customer sessions
- Employees with active staff sessions
- Active employee-operated seed customers
- Active robot customers

## Panel C: System Health

Panel C displays API, database, payment-provider, notification-provider, and
robot-service health. Simulated integrations are labeled as simulated.

## Panel D: Approval Waiting List

Panel D lists pending outgoing-payment requests oldest first. The CEO selects
one request, reviews its payee, category, amount, description, preparer, and
request time, and then approves or denies it.

Only the CEO role may call the decision commands. Administrators cannot approve
or deny outgoing payments. A decided request cannot be decided again. Approval
adds the payment to expense summaries; denial does not. Every decision records
the CEO identity, decision time, optional note, and audit event.

Administrators create requests in the Admin Backend `Outgoing payments`
workspace. A request includes payee, category, positive amount, ISO currency,
business description, preparer identity, and request time. Submission sends an
immutable pending version to Panel D; the administrator cannot decide it.
