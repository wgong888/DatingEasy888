# Backend Employee, Admin, And Robot Design

## Terminology
In the DatingEasy888 project, Backend means:
- Employee UI
- Admin UI
- Finance and moderation workspaces
- Robot automatic jobs

The C# middle layer is called Web Service and is documented separately.

## Backend Purpose
The Backend gives company workers and authorized robot employees controlled tools for operating the platform. It retrieves and saves data only through the Web Service.

## Backend UI Direction
- The Backend is designed only for large desktop displays.
- It does not require a mobile-phone layout.
- It should be convenient, robust, and easy to operate during long work sessions.
- It should favor information density, keyboard efficiency, predictable placement, and fast repeated actions.
- It must remain readable and organized even when many conversations, alerts, tables, or reports are visible.
- Critical controls must have clear state, confirmation, error recovery, and audit feedback.
- Main workspaces should avoid unnecessary page changes and preserve employee context.

## Backend User Types
- Human employee
- Robot employee
- Moderator
- Finance employee
- Administrator
- Super administrator

## Administrator Responsibilities

### Employee Account Management
- Create human employee accounts.
- Create and register robot employee identities.
- Assign employee type, role, permissions, work field, start date, and initial status.
- Activate, suspend, reactivate, or close employee accounts.
- Start password activation and reset workflows for human employees.
- Assign or remove seed-customer responsibilities.
- Review employee workload, contribution, earnings, security events, and audit history.
- Administrators cannot view original employee passwords.

### Cloud Service Maintenance
- Create and update CloudService records.
- Maintain cloud provider, service period, capacity, backup, cost, invoice, and status.
- Record renewals, upgrades, cancellations, and service changes.
- Receive warnings before cloud services or backup periods expire.
- Never store cloud passwords, API keys, private keys, or connection strings in CloudService records.

### Security Administration
- Manage employee roles and permissions.
- Review login, access, robot-job, and security events.
- Suspend compromised customer, employee, or robot accounts.
- Revoke active sessions and service credentials.
- Review unusual chat, payment, workload, or administrative activity.
- Escalate high-risk incidents to a super administrator.
- Record a reason and audit entry for every security-sensitive action.

### Scheduled Task Management
- Create, configure, enable, disable, pause, resume, and monitor timed tasks.
- Define task name, task type, schedule, timezone, owner, retry policy, and timeout.
- Configure daily midnight reporting tasks.
- Configure monthly employee and company reporting tasks.
- Configure year-end reporting tasks.
- Configure seed activation, online-time enforcement, and robot conversation tasks.
- View last run, next run, duration, result, retry count, and failure details.
- Retry failed tasks manually when permitted.
- Require administrator reauthentication, reason, confirmation, and audit for
  financial, security, and high-impact robot task changes.

### Policy Maintenance
- Provide a dedicated large-desktop Policy Maintenance workspace.
- Organize policies by customer, credits, media, messaging, employee, seed,
  robot, safety, reporting, session, and feature categories.
- Use typed controls, validation ranges, impact warnings, and before/after comparison.
- Support draft, immediate or scheduled activation, retirement, emergency disable, and rollback.
- Version every publication and preserve the exact policy used by completed transactions and messages.
- Show propagation health so administrators can confirm all services loaded the active version.
- Never store secrets or executable code in policy values.

### Monthly Report Generation
- Generate and review EmployeeMonthReport.
- Generate and review CompanyMonthReport.
- Validate source daily reports and employee attribution.
- Identify missing, duplicate, or inconsistent source data.
- Recalculate draft reports.
- Finalize and lock approved reports.
- Record corrections through an auditable process.

### Year-End Report Generation
- Generate an annual company report from finalized monthly reports.
- Summarize revenue, employee payments, advertising costs, cloud-service costs, credits purchased, and credits consumed.
- Include approved adjustments, refunds, chargebacks, corrections, and outstanding obligations.
- Compare monthly results and provide annual totals.
- Finalize and lock the report after review.
- Preserve source references and complete audit history.

## Administrator UI Modules
- Admin dashboard
- Employee accounts
- Robot employees
- Roles and permissions
- Cloud services
- Security center
- Policy maintenance
- Scheduled tasks
- Robot-job monitor
- Monthly reports
- Year-end reports
- Audit logs

## Administrator Dashboard
- Active human and robot employees
- Suspended or locked accounts
- Active seed conversations and workload
- Failed or delayed timed tasks
- Cloud services nearing expiration
- Open security alerts
- Draft and scheduled policies
- Policy propagation failures
- Monthly reports awaiting generation, review, or approval
- Current year-end report status

## Backend Areas To Design
- Employee authentication and workspace
- Employee seed-customer assignments
- Seed-customer profile management
- Customer and conversation support workflows
- Robot automatic-job definitions
- Robot job scheduling, monitoring, retry, and failure handling
- Moderation and customer safety
- Charges, credits, and financial reports
- Employee monthly reports and salary
- Advertisement records
- Cloud-service records
- Audit history
- Policy catalog, version history, activation status, and propagation health

## Seed Conversation Operations

### Operating Model
- CustomerProfile type `1` is an employee-operated seed customer. Type `2` is
  an autonomous robot customer and is not part of employee seed operations.
- Human employees and robot employees perform the same general seed-customer conversation role.
- Each employee represents every seed customer currently assigned to that
  employee when responding to real customers. The seed identity, not the
  employee identity, is the customer-facing sender.
- Employee assignment and workspace queries reject robot customers.
- The system assigns conversation work evenly between eligible human and robot employees.
- Each employee is responsible for up to 1,000 seed customer profiles.
- At any one time, the system activates 20 seed profiles for an employee's work queue.
- Each seed profile may be active online for no more than two hours per day.
- The system automatically selects and activates the 20 seed profiles.
- One employee handles up to 10 simultaneous real-customer conversations.
- AI response assistance and approved prepared-text sources support fast replies.

### Profile Presentation And Integrity Requirement
- Customer-facing profile layouts and customer APIs must not expose internal
  real, seed, or robot classifications.
- Company-operated conversations must not make explicit false claims about
  offline identity, physical presence, exact location, or real-world
  availability.
- Credit costs must be disclosed before a customer sends a paid message or gift.
- Employee-assisted, robot-assisted, and AI-generated messages must follow the
  approved profile-presentation and content-integrity policies.
- The platform must preserve an audit trail showing whether each message was sent by a human employee, robot employee, or approved automation.

### Employee Working UI
The employee workspace is designed for focused high-volume conversation work:

- Panel A uses 10% width for 20 active seed profiles; one seed is selected. A
  green dot beside a seed portrait signals that a real customer is waiting.
- Panel B uses 15% width for real customers with requests or history for the
  selected seed; one customer is selected. Conversations are ordered by most
  recent activity first.
- Panel C uses 60% width for one main chat history and response composer.
- Panel D uses 15% width for prepared-text category folders and answer files.
- Large-desktop layout only, with a defined minimum supported screen size still to be selected.
- Panel C represents the selected seed's conversation with the selected real
  customer and shows the latest customer message before reply.
- Panel C contains no gift catalog or gift-send action.
- Selecting prepared text inserts it into the Panel C composer for direct send
  or editing.
- The employee UI must show seed identity, customer identity, internal
  classification status, elapsed online time, daily online-time remaining,
  unread state, credit context, and conversation status.
- The UI may track up to 10 simultaneous conversations while presenting one
  focused conversation in Panel C.
- The UI must warn before a seed profile reaches its two-hour daily online limit.
- When a seed reaches the limit, the system must stop new assignment and safely transfer or close active work according to policy.
- Panels must retain stable dimensions and positions as messages and statuses update.
- Keyboard navigation and shortcuts should support rapid movement between active chats.
- New messages, urgent responses, safety flags, and time-limit warnings need distinct visual priority.

### AI And Prepared Text
- AI may suggest immediate responses based on the current conversation and approved prepared-text sources.
- Prepared-text categories and governance are defined in `PREPARED_CONVERSATION_TEXT.md`.
- Prepared text must be created, reviewed, versioned, and approved before operational use.
- Employees may type an original response, stage and edit an approved prepared
  answer, or send an approved prepared answer unchanged when it properly
  responds to the current customer message.
- Automatic robot replies require separate approval rules, confidence limits, prohibited-topic rules, and escalation rules.
- AI suggestions must not invent personal experiences, identity claims, or
  facts that misrepresent the approved company-operated profile.
- Every sent message records the employee, customer-facing seed, real customer,
  and response source: employee-written, prepared unchanged, prepared edited,
  AI-assisted, or robot-generated.
- Initial categories are love/romance, feelings/sympathy, greetings, adult flirting/intimate conversation, sports, travel, cooking, weather, art, clothing/style, city/countryside living, beach, mountains/outdoors, work/career, jobs/employment, and news/current events.

### Work Assignment
- The scheduler selects eligible employees and robot employees.
- Work should be distributed evenly using active workload, recent assignment count, capacity, availability, and failure state.
- A seed profile cannot be actively controlled by more than one worker at a time.
- A real-customer conversation cannot be assigned to more than one active worker at a time.
- Assignment and reassignment events must be auditable.
- Human supervisors must be able to pause robot work and take over a conversation.

### Operational Metrics
- Active seed profiles per employee
- Simultaneous conversations per employee
- Seed online minutes per day
- First-response time
- Average response time
- Human/robot task distribution
- AI suggestion usage and edit rate
- Conversation transfer count
- Safety escalation count
- Credits consumed in internally classified seed conversations

## Current Design Stage
- Backend requirements and business workflows are being defined first.
- The first detailed Web Service API contract draft has been created from the current Frontend, Backend, robot-job, database, security, and policy requirements.
- Contracts remain design drafts until business-policy questions are reviewed and approved.

## Backend Functional Areas

### Employee Authentication
- Password login followed by verified email or SMS code
- Immediate normal assigned work after successful login; no separate work approval
- Explicit logout before leaving or going offline
- Server-enforced automatic logout after ten minutes without employee interaction
- Idle logout warning, safe draft handling, and assignment release/transfer
- Password reset
- Employee account activation
- Robot/service identity authentication
- Role and permission checks

### Customers And Seed Profiles
- Search and review customer profiles
- View assigned seed customers
- Edit permitted seed-profile information
- Review profile completeness and visibility
- Activate, suspend, or escalate customer accounts according to permission
- Review assignment history

### Photos And Media
- Review public and private photos according to permission
- Approve, reject, hide, or escalate media
- Manage permitted seed-customer media
- View moderation history

### Conversations
- View conversations permitted by assignment and role
- Support employee work involving assigned seed customers
- Review reported conversations
- Send or approve messages only under rules still to be defined
- Record employee or robot responsibility for actions

### Finance
- Review ChargeRecord entries
- Review customer credit balances and ledgers
- Review daily and monthly company reports
- Review employee monthly reports and salary status
- Review advertisement and cloud-service expenses
- Handle refunds, disputes, and reconciliation according to permission

### Safety And Moderation
- Review report queues
- Review profiles, messages, photos, and feed evidence
- Warn, suspend, ban, restore, or escalate according to permission
- Record reasons and audit history

### Robot Automatic Jobs
- Perform the same internally classified seed-customer conversation role as
  human employees
- Receive system assignments through the same workload scheduler
- Respect the same 1,000-profile responsibility, 20-active-seed, two-hour-per-seed, and 10-conversation limits unless a separate approved robot capacity is defined
- Run scheduled financial summaries
- Monitor job status
- Retry recoverable failures
- Pause or escalate jobs when rules require human review
- Write complete job and action audit history

### Administration
- Create and maintain employee and robot accounts
- Maintain cloud-service records
- Manage authorized security operations
- Configure and monitor timed tasks
- Generate, review, finalize, and correct monthly reports
- Generate and finalize year-end reports
- Review audit history for all sensitive administrative actions

## Backend Design Gaps To Fill
- Exact credit spending rules
- Exact free vs paid message rules
- Real payment provider
- Verification vendor
- Message retention policy
- Photo moderation workflow
- Admin role permissions
- Employee pages, workflows, and allowed actions
- Robot jobs, schedules, limits, and approval requirements
- Prepared-chat-text sources, categories, approval, and versioning
- Company-operated-profile presentation and content-integrity rules
- Conversation transfer and timeout behavior
- Administrator role boundaries and approval levels
- Scheduled-task definitions and ownership
- Monthly and year-end report approval workflow
