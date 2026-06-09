# Arfa To Public Launch Roadmap

Current date: June 9, 2026  
Status: milestone plan; dates will be estimated after the Arfa review

## 1. Current Position
- Arfa `0.4.0` is a runnable local Node.js and SQLite prototype.
- Customer, employee, administrator, and CEO prototype screens exist.
- Automated API tests and browser smoke tests exist, but the full product,
  production database, production Web Service, security assessment, payment
  integration, and cloud infrastructure are not complete.
- The approved production direction remains C#/ASP.NET Core Web API and SQL
  Server unless a later architecture decision explicitly changes it.
- No cloud account or public environment has been created.

Calendar promises are intentionally deferred. Each stage begins only after the
previous stage's evidence and review gate pass.

## 2. Stage A: Complete Arfa Coding And Testing
Goal: produce the most complete local prototype needed to review all four
roles and core business workflows.

Work:
- Finish agreed customer, employee, administrator, CEO, robot, credit, gift,
  profile, reporting, policy, and scheduling prototype workflows.
- Resolve known broken or placeholder actions.
- Add the approved robot shift-scheduling behavior and tests.
- Keep design, API, database, manuals, and test cases synchronized.
- Run API/integration, browser, responsive, financial, role, and scheduler tests.
- Record known prototype limitations separately from defects.

Exit gate:
- No open critical defect in an agreed Arfa workflow.
- Automated checks pass from a clean reset.
- All four roles can complete their agreed review scenarios.
- Arfa is tagged with a reproducible version and review notes.

## 3. Stage B: Joint Arfa Review
Goal: review the whole prototype before Beta work begins.

Review:
- Customer desktop and mobile workflows
- Employee four-panel work process
- Administrator operations and policy maintenance
- CEO overview and payment approval
- Robot profile, conversation, city, shift, failover, and time-limit behavior
- Credits, gifts, charging, reports, security, and audit behavior
- Manuals, API contracts, database design, and unresolved policies

Outputs:
- Accepted Arfa features
- Defect list
- Beta backlog ordered by risk and customer value
- Explicitly deferred features
- Approved Beta architecture and scope

Exit gate:
- Product owner approves the Arfa review record.
- Critical policy and architecture questions needed for Beta are resolved.

## 4. Stage C: Build The Beta Version
Goal: convert the accepted prototype into a cloud-deployable, supportable
product candidate.

Required Beta engineering:
- Implement or approve the production C#/ASP.NET Core Web Service.
- Implement versioned SQL Server schema and migrations.
- Replace prototype-only persistence and test shortcuts.
- Add production authentication, authorization, audit, secrets, rate limits,
  and employee MFA.
- Add tokenized payment-provider sandbox integration.
- Implement authoritative financial ledger and reconciliation.
- Implement durable chat, media storage, SignalR/reconnect, scheduled jobs, and
  robot shift orchestration.
- Add feature flags and kill switches.
- Add structured logging, health endpoints, metrics, alerts, backup, and
  restore procedures.
- Expand automated unit, SQL integration, API contract, browser, security,
  accessibility, load, and recovery tests.

Beta exit gate:
- Beta release candidate passes CI from a clean environment.
- No unresolved critical security, privacy, financial, safety, or data-loss defect.
- Database migration and restore tests pass.
- Staging deployment and rollback instructions are executable.
- Legal and payment feasibility have not identified a blocking redesign.

## 5. Stage D: Prepare The Cloud Account And Landing Zone
Goal: create a company-controlled, cost-governed cloud foundation.

The working recommendation is Microsoft Azure because it directly supports the
planned ASP.NET Core and SQL Server stack. The cloud provider remains a review
decision until the Beta architecture and cost estimate are approved.

Account prerequisites:
- Company legal/billing name and billing address
- Company-controlled domain and administrative email accounts
- Authorized billing method
- Named billing owner and technical owner
- At least two trusted cloud administrators
- CEO approval for the expected outgoing cloud spend
- Recovery contacts and secured break-glass credentials

Environment model:
- Development subscription
- Automated-test subscription
- Staging subscription
- Production subscription

Each environment receives separate secrets, identities, data, configuration,
and access boundaries within the company tenant.

Account setup gate:
- MFA and role-based access are enforced.
- No personal account is the sole owner.
- Budgets and actual/forecast alerts are configured.
- Audit, activity, security, and billing logs are retained.
- Infrastructure is represented as reviewed Bicep or Terraform code.
- No application is public and no real customer data is loaded yet.

## 6. Stage E: Deployment Preparation And Rehearsal
Goal: prove that the same immutable release can be installed, verified,
promoted, and rolled back safely.

Sequence:
1. Provision test and staging infrastructure from code.
2. Deploy the Beta release artifact and database migrations.
3. Load synthetic test data only.
4. Configure sandbox email, SMS, AI, storage, and payment integrations.
5. Run smoke, E2E, security, accessibility, and load tests.
6. Restore a database backup into an isolated environment.
7. Rehearse application rollback and database-forward recovery.
8. Validate alerts, dashboards, on-call routing, and kill switches.
9. Record deployment duration, failures, fixes, and final runbook.
10. Repeat from a clean environment until the process is reliable.

Exit gate:
- Staging deployment is reproducible from source tag to running system.
- Backup restoration and rollback rehearsal pass.
- Secrets are absent from source, artifacts, logs, and screenshots.
- Operational owners can detect and respond to simulated failures.

## 7. Stage F: Controlled Online Testing

### Internal Online Test
- Company employees and synthetic accounts only
- Public internet hosting with restricted access
- Payment sandbox only
- Robot observation or tightly limited automation
- Daily defect, safety, credit, and infrastructure review

### Closed Real-Customer Test
- Invitation-only verified adults
- One approved geography and language initially
- Published terms, privacy policy, safety rules, and support process
- Small customer and spending caps
- Production payments only after processor and legal approval
- Strong robot, gift, media, and intimate-topic feature flags
- Daily financial reconciliation and safety review
- Immediate suspension capability for charging, robots, uploads, and registration

Exit gate:
- Customer experience and support targets pass.
- Credits, charges, messages, gifts, and reports reconcile.
- No unresolved critical security, privacy, financial, or safety issue.
- Monitoring and incident response work under real traffic.
- Product owner, engineering, operations, security, legal, and payment owners
  approve progression.

## 8. Stage G: Public Launch
Launch gradually:
1. Deploy the approved production artifact to a staging slot.
2. Run production-safe smoke tests and warm-up.
3. Promote using a controlled slot swap or equivalent blue-green release.
4. Open registration to a small percentage or limited geography.
5. Monitor availability, errors, latency, credits, charges, reports, abuse,
   robot behavior, complaints, and cloud cost.
6. Increase traffic only after each observation window passes.
7. Roll back or disable affected features immediately when a gate fails.

Public launch requires:
- Domain, DNS, TLS, email, SMS, payment, privacy, terms, support, moderation,
  security, backup, and incident operations ready
- Legal and commercial approval for the final company-operated-profile model
- Payment processor/acquirer approval
- No critical launch blocker in `DEPLOYMENT_AND_LAUNCH_PLAN.md`
- Named launch commander and rollback owner
- Signed release record tied to source, database, API, and infrastructure versions

## 9. Post-Launch
- Daily operational and financial review during the launch period
- Weekly release and safety review until stable
- Regular dependency, access, backup, restore, security, and cost reviews
- Small controlled releases using the same staging and rollback process
- Beta flags retained until production evidence supports removal

## 10. Scheduling Rule
After the Arfa review, estimate each accepted Beta backlog item and establish
target dates. Public launch dates must not be announced before cloud cost,
staffing, legal, payment, security, and Beta scope are known.
