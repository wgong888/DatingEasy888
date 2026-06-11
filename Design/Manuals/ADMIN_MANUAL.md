# DatingEasy888 Administrator Manual

Version: Design Draft 1.6  
Audience: Authorized administrators, moderators, support, finance, security, and operations staff  
Status: Pre-release manual. Final specialist-role permissions remain pending.

## How To Read This Draft
- `Confirmed` controls apply to the current design.
- `Recommended` controls are proposed for manual approval.
- `Pending` controls require business, legal, security, or operations decisions.

This manual governs role behavior. The Product Operating Model defines shared
state meanings, while security and finance documents govern stricter specialist
controls.

## 1. Administrator Purpose
The Admin Backend provides controlled tools to operate and protect DatingEasy888.

Administrative responsibilities include:
- Employee and robot accounts
- Customer support and moderation
- Roles and permissions
- Security and incident response
- Credits, payments, gifts, and reconciliation
- Cloud-service records
- Scheduled tasks
- Product and operating policy maintenance
- Monthly and year-end reports
- Audit and compliance evidence

Administrative access is privileged. Use it only for an approved business purpose.

## 2. Administrator Roles
Planned roles:
- Super administrator
- Administrator
- Support agent
- Moderator
- Finance or payment analyst
- Security administrator
- Read-only analyst

The `Administrator` role may perform every operational function in the Admin
Backend, subject to audit, reauthentication, and required workflow approvals.
The one authority it does not have is final approval or release of an outgoing
company payment.

Every outgoing company payment requires separate CEO approval. The system must
not let an administrator approve a payment on the CEO's behalf or combine
payment preparation and CEO approval into one action.

Delegated specialist roles receive only the permissions needed for their duties.
A role title alone does not authorize access to private conversation evidence
without an approved business purpose.

### Role Boundaries
| Role | Primary access | Must not do alone |
|---|---|---|
| Administrator | All operational Admin Backend functions | Approve or release outgoing company payment |
| Support | Customer cases, recovery, permitted history | Read unrelated chats or change ledger balances |
| Moderator | Reports and minimum necessary evidence | Change payments or grant roles |
| Finance | Charges, ledger, refunds, reconciliation | Moderate content or expand own permissions |
| Security | Sessions, access, incidents, emergency controls | Finalize ordinary payroll alone |
| Operations | Jobs, cloud records, service health | View private chats without an approved case |
| Read-only analyst | Approved aggregate and masked data | Export identifiable data or execute commands |
| CEO payment approver | Review and approve or reject outgoing payments | Prepare the same payment or bypass payment audit |
| Super administrator | Exceptional approved administration | Bypass audit or substitute for CEO payment approval |

Named permissions should enforce these boundaries; menu visibility alone is not
authorization.

## 3. Security Rules
- Use an individual company-managed account.
- Complete mandatory multi-factor authentication.
- Never share credentials or sessions.
- Use approved devices and networks.
- Reauthenticate for sensitive actions.
- Request time-limited production access only when required.
- Record a reason for every security-sensitive action.
- Do not store secrets in remarks, tickets, screenshots, or cloud-service records.
- Report suspicious login, privilege, or data access immediately.

Break-glass access is for emergencies, is alerted, and requires retrospective review.

## 4. Separation Of Duties
- Developers do not have routine production database access.
- Support cannot silently alter credit balances.
- Delegated specialists cannot expand their own access.
- The author of a sensitive code or configuration change is not its sole approver or deployer.
- Sensitive financial adjustments require administrator reauthentication, reason, confirmation, and audit.
- Administrators may prepare outgoing payments but cannot approve or release them.
- The CEO must approve every outgoing company payment as a separate authenticated action.
- Finalized reports are corrected through adjustments, not silent edits.
- Seed publication requires the configured quality review, which an authorized administrator may complete.

## 5. Start Of Day
1. Sign in and review security notices.
2. Open the Admin Dashboard.
3. Review critical security and safety alerts.
4. Review failed payments, reconciliation issues, and chargebacks.
5. Review failed or delayed scheduled tasks.
6. Review open high-priority moderation reports.
7. Check cloud-service and backup warnings.
8. Check reports awaiting generation, review, approval, or payment.
9. Confirm incident ownership.

Critical safety, security, financial-integrity, or availability issues take priority over routine maintenance.

## 6. Dashboard
The operational overview shows:
- Total and currently online real customers
- Total and currently online seed customers
- Total and currently online robot customers
- Messages for the current UTC business day
- Credits consumed for the current UTC business day
- Successful-charge revenue for the current UTC business day
- Pending customer password resets
- Active employees
- Open conversations and seed conversations waiting for a response
- Current service health and recent audit activity

Later dashboard information includes:
- Messages and active seed conversations
- Active human and robot employees
- Suspended or locked accounts
- Open reports
- Failed payments, refunds, and chargebacks
- Credit reconciliation status
- Robot-job failures
- Scheduled-task failures
- Draft and scheduled policy changes
- Policy activation or propagation failures
- Cloud services nearing expiration
- Monthly and year-end report status

Dashboard summaries are operational indicators. Confirm source records before taking a high-impact action.

All Admin Backend tables and result lists return at most 20 records per page.
Use `Next` to retrieve the next 20 when more records exist. Bulk work uses an
explicit export or batch operation, not automatic infinite scrolling.

### Robot Customer Operations
Robot customers are `CustomerProfile.Seed = 2` profiles. This classification is
visible only in authorized company tools.

Administrators may:
1. Create a robot in `Full profile` mode by entering every profile field.
2. Create a robot in `Auto-fill` mode by entering name, age, sex, country,
   state/province, and city and reviewing the generated remainder.
3. Search and open a robot profile.
4. Edit normal profile fields and preview the customer-visible result.
5. Review provenance, approval, health, city, shift, and daily online time.
6. Activate, suspend, retire, restore, or request replacement with a reason.
7. Review city inventory and confirm at least three Man and three Woman robots.
8. Review whether at least one Man and one Woman robot are currently online.
9. Regenerate future shifts or trigger an eligible emergency replacement.

To create a robot:
1. Select `Add robot customer`.
2. Choose `Enter basics and auto-fill the rest` or `Enter the full profile`.
3. Enter name, age, sex, country, state/province, and city.
4. In full-profile mode, complete every remaining field.
5. Submit and review the inactive draft.
6. Confirm which fields were auto-filled and edit them where necessary.
7. Complete originality, adult-appearance, rights, quality, and human review
   before activation.

The system generates the UUID and internal non-login credentials. The robot is
not scheduled, shown online, or allowed to chat while its review is pending.

Administrators must not:
- Convert a robot into a real customer through ordinary profile editing.
- Remove or falsify provenance.
- schedule or keep a robot online beyond eight hours in its city-local day.
- report a city as coverage ready when same-sex reserve or approved overflow
  capacity is unavailable.

All robot-profile and scheduling changes are audited.

### Robot Outside-AI Mode
The robot language policy has two global values:
- `LocalOnly`: all robots use the internal topic, history, prepared-text, and
  clarification engine; no outside model call is permitted.
- `HybridExternalAllowed`: every eligible robot may use the approved outside
  language service when local confidence is insufficient.

Enabling hybrid mode does not force an outside call for simple messages.
Disabling it blocks new calls immediately. Results returning under an older
enabled policy version are discarded.

Before changing mode:
1. Review current provider health, model, daily/monthly usage, estimated cost,
   remaining budget, fallback rate, and safety exceptions.
2. Reauthenticate.
3. Enter a reason and confirm the global impact.
4. Verify propagation to every robot worker.
5. Monitor response errors and local fallback after activation.

Provider credentials never appear in this screen. Budget exhaustion or provider
failure automatically returns all robots to local behavior without changing
customer message pricing.

### Customer Password Reset Queue
1. The customer selects `Forgot Password`.
2. The customer enters the account name and registered email or phone.
3. The server verifies the values without revealing whether a mismatched
   account exists.
4. A verified request enters the waiting list unless auto approval is enabled.
5. The administrator approves or rejects the request.
6. Approval generates a one-time temporary password, revokes existing customer
   sessions, and sends the temporary password through the verified channel.
7. The customer signs in and must replace the temporary password.

The temporary password is shown to the approving administrator only once in
the prototype. Production delivery belongs to the email/SMS provider and the
plaintext value must not be stored.

The `Password reset auto approval` policy may enable automatic approval after
the same identity match. Every request and decision remains audited.

## 7. Employee Accounts
To create a human employee:
1. Open `Employee Accounts`.
2. Select `Create Employee`.
3. Enter approved identity, work field, start date, and employment details.
4. Enter at least one company-approved work email or mobile number for sign-in verification.
5. Verify ownership of the selected email or mobile number during activation.
6. Assign the minimum required role and permissions.
7. Start the secure account-activation process.
8. Require password setup and email/text verification enrollment.
9. Assign seed responsibility only when training and access are approved.
10. Review and confirm the audit record.

The supported employee roles are:
- `Chat employee`: seed-conversation workspace only
- `Administrator`: operational administration except outgoing-payment approval
- `CEO`: administration plus the separate outgoing-payment approval authority

New accounts receive a one-time temporary password. Administrators never view
or set a recoverable permanent plain-text password.

An administrator may update an employee verification channel only through an
audited identity-recovery workflow. Changing the channel revokes active sessions
and requires the new email address or mobile number to be verified before the
next login.

Available lifecycle actions:
- Activate
- Suspend
- Reactivate
- Start password reset
- Revoke sessions
- Change role with approval
- Change assignment
- Record leave date
- Close account

`Remove` is a soft deactivation. Historical chat ownership, audit records, and
report references remain intact, while active sessions are revoked.

On departure or role change, remove access immediately and review active sessions, credentials, assignments, and owned tasks.

Normal employee work does not require administrator approval after successful
password-and-code login. Administrators may suspend, revoke, or investigate
access only through an authorized account or security workflow.

Employee sessions automatically end after ten consecutive minutes without
employee interaction. Administrators may review the logout reason and assignment
handoff result but cannot silently keep an inactive employee session alive.

## 8. Robot Employees
Robot employees use managed service identities rather than human passwords where possible.

Administration includes:
- Register service identity
- Assign narrow robot permissions
- Set eligible task types
- Configure capacity and safety limits
- Enable observation mode
- Pause or revoke robot work
- Review failures, transfers, and audit history

Robot controls:
- One active worker per seed and conversation
- Expiring assignment leases
- Approved prepared-text versions
- Mandatory safety transfers
- Capacity and seed-time limits
- Immediate kill switch
- No auto-send until separately approved

Do not grant robot access to unrelated customer context or unrestricted administrative APIs.

## 9. Roles And Permissions
For every role change:
1. Confirm the business need.
2. Select the minimum permission set.
3. Check conflicts with separation of duties.
4. Reauthenticate and confirm the change.
5. Apply the change.
6. Revoke sessions if the risk requires it.
7. Verify the audit record.

Review privileged, repository, and production access quarterly. Remove dormant and expired contractor access.

## 10. Seed Profile Governance
Seed profiles must be original synthetic characters or use explicitly licensed or commissioned material.

Before publication, confirm:
- Source type and rights reference
- Character specification and model versions
- Three-photo identity consistency
- Adult appearance
- Original biography and first sentence
- Location and age consistency
- Internal duplicate checks
- Human approval independent of generation
- Profile-presentation policy version

Do not approve copied or lightly altered real profiles, photos, biographies, ages, or locations.

Complaints that a seed resembles a real person receive priority review. Disable the profile while rights and originality are investigated when appropriate.

## 11. Customer Accounts
Authorized administrators may:
- Search by customer ID, email, or display name
- Filter by account status, verification, country, and registration date
- Review permitted profile fields
- Review account security and report history
- Warn, suspend, ban, restore, verify, or force logout according to permission

Use clear reason codes. Do not expose restricted customer information to unauthorized staff.

Account status changes should revoke or restrict sessions according to risk.

### Customer Support Case Lifecycle
- `New`: received but not yet triaged.
- `Assigned`: owned by one support queue or agent.
- `Waiting for customer`: a specific response is needed.
- `Waiting internal`: another authorized team must act.
- `Resolved`: an action or answer was provided.
- `Closed`: complete after the approved reopen period.

Each case records category, priority, owner, customer-visible messages, internal
notes, related transactions or reports, and an audit trail. Internal notes must
be factual and must never hide a customer-facing decision.

### Account Recovery
Support may start an approved recovery process but does not ask for passwords,
CVV, or full card numbers. High-risk recovery should require step-up identity
checks, session revocation, and a cooling period before sensitive changes.

## 12. Customer Chat Privacy
Real-customer chat is private and open by default. Administrators do not steer, rewrite, or routinely read lawful adult conversations.

Private conversation evidence may be opened only for:
- A customer report
- Approved support need
- Moderation or safety investigation
- Security incident
- Legal obligation

Access requirements:
- Correct permission
- Approved purpose and reason code
- Minimum necessary context
- Audit record
- No copying into unsecured systems

Browsing private conversation for curiosity, entertainment, employee performance unrelated to assigned seed work, or personal reasons is prohibited.

## 13. Moderation Queue
Report types include:
- Profile
- Message
- Conversation
- Photo or media
- Feed content
- Payment or fraud concern

Initial reasons include:
- Harassment
- Racist or discriminatory abuse
- Threat or violence
- Unwanted sexual content
- Non-consensual intimate image
- Minor-safety concern
- Scam, fraud, or extortion
- Impersonation
- Privacy or doxxing
- Spam
- Other safety concern

Review process:
1. Accept or assign the case.
2. Confirm priority and possible immediate danger.
3. Open only necessary evidence.
4. Review context, target, intent, history, and credible risk.
5. Select the appropriate action.
6. Record evidence, reason, action, duration, and notes.
7. Notify the customer when policy permits.
8. Preserve appeal and legal status.

Possible actions:
- Dismiss
- Warn
- Restrict or remove content
- Temporarily restrict messaging
- Suspend
- Ban
- Restore
- Escalate

Good-faith discussion of politics, religion, identity, discrimination, history, or violence in news or fiction is not automatically a violation. Moderate behavior and credible harm, not viewpoint.

### Recommended Case Priorities
- `Critical`: credible immediate danger, child safety, active exploitation, or severe account compromise.
- `High`: non-consensual intimate imagery, credible threats, extortion, doxxing with danger, or coordinated fraud.
- `Normal`: harassment, discrimination, impersonation, spam, or ordinary policy disputes without immediate danger.
- `Low`: incomplete or duplicate reports and questions requiring no immediate restriction.

The final SLA and jurisdiction playbooks determine exact response times. A
priority is not a finding of guilt.

### Appeals
Appeals preserve the original decision and evidence, create a separate review
record, and identify the reviewer. The reviewer should be independent of the
original decision when feasible. Restorations, changed durations, and upheld
decisions all require a reason and customer notification when permitted.

## 14. Urgent Safety Cases
Escalate immediately according to the final incident playbook for:
- Credible imminent threats
- Child sexual exploitation or enticement
- Human trafficking or coercion
- Non-consensual intimate imagery
- Serious self-harm concern
- Doxxing tied to credible danger
- Extortion or blackmail
- Active account compromise affecting safety

Preserve evidence, restrict access, and follow legal reporting requirements. Do not promise secrecy or a specific law-enforcement result.

## 15. Payment Review
Authorized finance staff can review:
- Charge status
- Provider transaction reference
- Customer transaction history
- Masked payment metadata
- Credits granted
- Refund or chargeback state
- Reconciliation status

Never store or request:
- CVV/CVC/SecCode
- Card PIN or password
- Full raw card number
- Customer platform password

Credits are granted only after confirmed payment. Replayed provider callbacks must not grant credits twice.

### Refund And Chargeback Cases
Finance links every refund, reversal, or chargeback to the original charge and
its ledger effects. The system must show whether credits were unused, partly
used, gifted, or already reversed. Administrators do not create a negative
balance or close an account through an undocumented database edit.

## 16. Credit Ledger And Adjustments
`CustomerProfile.CreditsRemain` is the authoritative current spendable balance
shown to the customer. `CreditLedger` is the immutable history that explains
and reconciles every balance change. The adjustment, ledger row, and balance
update must commit in one transaction.

Before an adjustment:
1. Confirm the business reason.
2. Review related charge, message, gift, refund, or incident.
3. Enter the adjustment through the approved command.
4. Reauthenticate and confirm the adjustment.
5. Confirm the ledger entry and resulting balance.
6. Verify the audit record.

Never edit a balance silently or directly in the database.

## 17. Gifts And Unusual Spending
Review:
- High-value gifts
- Rapid repeat purchases
- Spending inconsistent with account history
- Spending by a distressed or vulnerable customer
- Employee or seed conversations linked to unusual purchase pressure
- Refund and chargeback patterns

Available controls may include:
- Confirmation
- Cooling-off period
- Spending limit
- Temporary purchase restriction
- Manual review
- Fraud escalation

All successfully sent gifts are final and non-refundable. The Admin Backend has
no normal gift-refund or gift-reversal action.

For a gift sent to a seed profile:
- 80% is credited to the employee assigned to oversee the seed at gift time.
- 20% remains the platform share.
- The transaction snapshots the overseeing `EmployeeId`.
- Later seed reassignment does not move prior employee credits.
- The sender, recipient seed, employee attribution, assignment, policy version,
  and ledger entries must reconcile.

## 18. Employee Earnings
The provisional employee reward is 30% of eligible attributed revenue.

Before report approval, exclude or adjust:
- Fraudulent transactions
- Refunded or charged-back transactions
- Company-operated-profile presentation or integrity violations
- Policy-violating pressure or manipulation
- Incorrect assignments

Whether the 30% basis is gross or net remains pending. Do not finalize salary calculations until the approved formula is configured.

### Outgoing Company Payments
Outgoing company payments include:
- Employee salary, reward, commission, and reimbursement
- Vendor, cloud-service, advertising, and contractor invoices
- Customer cash refunds
- Taxes, fees, and other transfers from company-controlled funds

Credit grants and ledger corrections that do not move cash are not outgoing
payments, but they retain their own approval and audit controls.

The required workflow is:
1. An administrator opens `Outgoing payments` and selects `Prepare payment`.
2. Enter the payee, category, amount, currency, and business description.
3. Submit the immutable request to the CEO waiting list.
4. The system validates the payee, source obligation, amount, currency, and payment destination.
5. The payment enters `Awaiting CEO Approval`.
6. The CEO signs in with an individual MFA-protected account.
7. The CEO reviews the payment and selects `Approve` or `Reject`.
8. Only an approved payment may be released to the bank or payout provider.
9. Provider confirmation, failure, cancellation, and reconciliation are recorded.

The preparer cannot perform CEO approval. CEO approval records the payment
version, approver, decision time, amount, payee, and reason. Any material change
after approval invalidates that approval and returns the payment for new CEO
review.

## 19. Cloud Services
Cloud-service records may include:
- Provider
- Service and invoice period
- Amount paid
- CPU, memory, storage, network, and IP allocation
- Database and backup services
- Renewal and expiration status
- Invoice reference

Do not store cloud passwords, API keys, private keys, or connection strings in these records. Secrets belong in the managed vault.

Review expiration and backup alerts. Confirm service changes against invoices and infrastructure ownership.

## 20. Scheduled Tasks
Planned task types include:
- Daily company summary
- Monthly employee reports
- Monthly company reports
- Year-end reports
- Seed activation
- Seed online-time enforcement
- Robot conversation tasks
- Robot city shift planning and activation
- Robot Man/Woman coverage monitoring and failover
- Robot eight-hour daily-time reconciliation
- Reconciliation and maintenance jobs

For each task, maintain:
- Name and type
- Schedule and timezone
- Owner
- Enabled or paused state
- Timeout and retry policy
- Last and next run
- Result and failure details

High-impact financial, security, or robot-task changes require
reauthentication, a reason, strong confirmation, and audit.

Before manually retrying:
1. Determine whether the task is idempotent.
2. Confirm that another run is not active.
3. Review partial results.
4. Record the reason.
5. Monitor the retry through completion.

### Change Control
Schedule, retry, robot scope, pricing, credit, profile-presentation, moderation, and
security-control changes require:
1. A documented owner and reason
2. Risk and rollback review
3. Administrator reauthentication and explicit confirmation
4. Staging or controlled validation
5. Versioned deployment
6. Production verification
7. Audit and customer communication when applicable

Normal policy publication does not require another administrator's approval.
Outgoing company payments remain the only confirmed action requiring CEO
approval.

## 21. Policy Maintenance
The `Policy Maintenance` workspace controls versioned business and operating
rules without requiring a software deployment.

Administrators may create, edit, validate, schedule, publish, retire, and roll
back policies. No additional approval is required for ordinary policy
maintenance. Outgoing company-payment approval remains a separate CEO action
and cannot be created or bypassed through policy configuration.

### Policy Categories
- Customer eligibility and session timing
- Credits, packages, message costs, gifts, and promotional rewards
- Text, picture, voice, and upload limits
- Profile requests, Visitors, presence, and notification behavior
- Employee workload, seed activation, leases, and inactivity timing
- Prepared-text, AI, and robot operating limits
- Global robot outside-AI mode, provider/model pin, token limits, timeouts, and
  daily/monthly provider budgets
- Moderation, safety, spending, and rate-limit controls
- Reporting timezone, schedules, and operational thresholds
- Feature availability and controlled rollout

Secrets, passwords, provider credentials, and private keys are not policies and
must never be entered in this workspace.

### Screen Layout
The large-desktop workspace contains:
- Left navigation: category tree, search, and status filters
- Center editor: typed controls such as toggles, numeric inputs, selectors, and time settings
- Right impact panel: affected roles, screens, APIs, jobs, and warnings
- Bottom comparison: current versus proposed values
- History tab: versions, actor, reason, effective time, and rollback source

The editor must use domain controls rather than requiring administrators to
write raw JSON. Advanced structured values may provide a validated JSON preview
but not an unrestricted executable configuration.

### Policy Lifecycle
Policy states are:
- `Draft`
- `Scheduled`
- `Active`
- `Superseded`
- `Retired`
- `RolledBack`

To publish a policy:
1. Select the category and policy.
2. Review the currently active version.
3. Create a draft from the active version.
4. Change values using validated controls.
5. Enter a required business reason.
6. Review validation errors, warnings, and affected workflows.
7. Review the before/after comparison.
8. Choose immediate activation or a future effective time.
9. Publish the policy.
10. Verify the new active version and health indicators.

### Publishing Rules
- Every publication creates a new immutable version.
- Published versions are never edited in place.
- A future version may be cancelled before it becomes active.
- Only one version of a policy is active for a scope and time.
- Completed messages, charges, gifts, reports, and assignments retain the policy version used at execution.
- A material change cannot silently alter an in-progress confirmed payment or already accepted paid action.
- Invalid combinations are blocked before publication.
- High-impact changes display a stronger confirmation and affected-customer estimate.
- Customer-visible pricing or terms changes require the configured notice before activation when applicable.

### Rollback And Emergency Disable
Rollback creates a new version using values from a selected earlier version; it
does not delete history. An administrator may immediately disable a dangerous
feature through an approved emergency toggle. The action requires a reason,
creates a security alert, and triggers follow-up review.

After policy activation or rollback:
1. Monitor validation, API, job, charge, and message errors.
2. Confirm all services loaded the same policy version.
3. Reconcile any action that crossed the effective-time boundary.
4. Notify affected internal teams and customers when required.
5. Record the outcome.

## 22. Monthly Reports

### EmployeeMonthReport
1. Confirm source period and timezone.
2. Generate the draft.
3. Validate employee assignments, eligible revenue, and gift credits earned.
4. Apply approved refunds, chargebacks, fees, or adjustments.
5. Review exceptions.
6. Recalculate if necessary.
7. Obtain approval.
8. Finalize and lock.
9. Mark paid only after payout confirmation.

Gift credits earned are reported separately from salary and must reconcile with
EmployeeCreditLedger. They are not converted to money unless a later approved
redemption or payout policy defines that conversion.

### CompanyMonthReport
1. Confirm finalized daily reports.
2. Confirm finalized or paid employee reports according to policy.
3. Include approved income, payments, and adjustments.
4. Review whether advertising and cloud expenses are included under the final policy.
5. Reconcile totals.
6. Approve, finalize, and lock.

Finalized reports are not silently edited. Corrections use an auditable adjustment workflow.

## 23. Year-End Report
1. Confirm that all source months are finalized.
2. Generate the annual draft.
3. Review revenue, credits, employee payments, advertising, cloud costs, refunds, chargebacks, and adjustments.
4. Investigate missing or inconsistent months.
5. Validate source links.
6. Obtain administrator approval and CEO approval only for any outgoing payment.
7. Finalize and lock.

The year-end report preserves complete source and correction history.

## 24. Security Center
Review and respond to:
- Failed and suspicious logins
- Credential-stuffing indicators
- Privilege changes
- Restricted-data access
- Payment and credit anomalies
- Robot control failures
- Mass messaging
- Company-operated-profile control failures
- Production or configuration changes
- Break-glass access

Actions may include:
- Revoke sessions
- Suspend an account
- Revoke a service identity
- Disable charging
- Stop robot messaging
- Stop seed activation
- Disable uploads
- Escalate an incident

Do not disable logging or evidence preservation while responding.

### Emergency Control Recovery
After using a kill switch or broad restriction:
1. Confirm the harmful action has stopped.
2. Record scope, time, actor, and reason.
3. Reconcile interrupted messages, charges, credits, jobs, and assignments.
4. Notify affected owners and customers when required.
5. Restore service in controlled stages.
6. Review why normal controls did not prevent the incident.

## 25. Audit Logs
Sensitive actions record:
- Actor and effective role
- Target
- Action
- Before and after values or command summary
- Reason
- Request/correlation ID
- UTC timestamp
- Device or network context where available
- Result

Normal administrators cannot edit audit records.

Review audit trails for employee creation, permission changes, private-chat access, financial adjustments, seed approval, cloud changes, scheduled tasks, report finalization, and security actions.

## 26. Incident Response
Incident classes include:
- Security or privacy
- Payment or credit integrity
- Messaging or safety
- Availability
- Data loss or corruption
- AI or robot behavior

For an incident:
1. Identify severity.
2. Assign an owner.
3. Contain harm.
4. Preserve evidence.
5. Engage security, legal, privacy, finance, or safety owners.
6. Communicate through approved templates.
7. Recover and reconcile.
8. Complete a post-incident review.

Use emergency controls only for a documented incident and review their use afterward.

## 27. End Of Day
1. Confirm ownership of unresolved critical cases.
2. Review failed tasks and financial exceptions.
3. Confirm safety and security escalations.
4. Verify that high-risk temporary access has expired.
5. Record shift handoff notes in the approved system.
6. Sign out and secure the workstation.

## 28. Operating Cadence
### Daily
- Safety, security, payment, task, backup, and availability triage
- Ownership of every critical case
- Credit and charge exception review
- Robot and seed routing health

### Weekly
- Privileged access and temporary grant review
- Moderation and support backlog aging
- Refund, complaint, block, and unusual-spending trends
- Prepared-text and AI quality exceptions
- Failed-job and capacity trends

### Monthly
- Financial reconciliation and report approval
- Employee quality and compensation review
- Seed inventory, provenance, profile presentation, and city-allocation review
- Security vulnerability and access review
- Backup restore evidence and incident follow-up

### Quarterly
- Full privileged-access recertification
- Retention and deletion execution review
- Vendor, payment, cloud, and model-provider risk review
- Policy, manual, and training refresh

## 29. Privacy And Data Requests
Authorized staff support access, correction, export, deactivation, and deletion
requests according to the final privacy policy. Every request requires identity
verification proportionate to risk, a due date, recorded searches, approved
exceptions, and secure delivery.

Deletion does not silently remove financial, fraud, safety, audit, or legal-hold
records that must be retained. Retained records should be minimized,
access-controlled, and deleted when their lawful purpose ends.

## 30. Content And Template Governance
Prepared text, request templates, seed biographies, profile-presentation text,
and robot instructions are versioned content. Drafting and approval should be
separated.
Publication records:
- Content type, language, and version
- Author and independent approver
- Safety and legal review where required
- Effective and retirement times
- Products, roles, and robot scopes allowed to use it
- Snapshot used in each sent request or automated action

Emergency retirement stops future use without rewriting historical audit
records.

## 31. Quick Glossary
- `Case`: controlled support, moderation, finance, privacy, or security work item.
- `Reason code`: standardized explanation for a privileged action.
- `Sensitive confirmation`: reauthentication plus an explicit reason and confirmation before a high-risk action.
- `Break glass`: exceptional emergency access with alerting and review.
- `Ledger`: append-only source of truth for credit movement.
- `Reconciliation`: comparison and correction of derived records against source events.
- `Legal hold`: preservation that temporarily overrides ordinary deletion.
- `Kill switch`: emergency stop for a narrowly defined high-risk capability.
- `Policy version`: immutable set of values effective for a defined scope and time.
- `Rollback`: new policy version restored from an earlier version's values.

## 32. Required Before Training Approval
- Final delegated specialist-role permission matrix
- CEO payment approval identity, absence, and emergency continuity procedure
- Moderation severity, SLA, and appeal process
- Jurisdiction-specific legal reporting duties
- Data retention and evidence-preservation periods
- Customer-support escalation contacts
- Refund and chargeback rules
- Employee gift-credit redemption or payout treatment
- Employee 30% gross/net basis
- Company reporting timezone
- Expense treatment in company reports
- Scheduled-task ownership and retry limits
- Final incident playbooks and on-call coverage
- Employee email/SMS delivery providers, code lifetime, rate limits, and recovery procedure
- Final policy catalog, safe validation ranges, and customer-notice rules

## 33. Recommended Operating Decisions For Manual Review
- Use the role boundaries in Section 2 as the approved starting permission model.
- Require CEO approval for every outgoing company payment without an amount threshold.
- Require reauthentication, reason, confirmation, and audit for privileged role grants, production robot auto-send, bulk data export, and other high-risk actions.
- Use append-only case, ledger, audit, and report-correction records.
- Keep autonomous intimate robot conversation disabled for the first pilot.
- Review unusual spending and employee incentives as customer-safety controls, not only fraud controls.
