# Deployment And Launch Plan

Status: design plan. No cloud infrastructure or application has been deployed.

The ordered product roadmap and release gates are defined in
`Design/Operations/LAUNCH_TIMELINE.md`.

## 1. Recommended Hosting Direction
Because the Web Service is ASP.NET Core and the database is SQL Server, Azure is the simplest default platform:

- Frontend web application: Azure App Service or equivalent
- C# Web Service: Azure App Service initially
- SQL Server: Azure SQL Database or managed SQL Server
- Photos/media: Azure Blob Storage
- Real-time messaging: Azure SignalR Service or self-hosted SignalR initially
- Secrets: Azure Key Vault
- Monitoring: Application Insights and centralized logs
- Scheduled tasks: WebJobs, Functions, or a controlled worker service
- CDN/WAF/DDoS: Azure Front Door or equivalent

This remains a recommendation, not a final vendor decision. AWS, another cloud, or qualified managed hosting can be used if it satisfies the same controls.

The current Arfa Node.js/SQLite prototype is suitable for local product review,
not direct public deployment. Beta must either implement the approved
ASP.NET Core/SQL Server architecture or record an explicit reviewed
architecture change.

## 1A. Cloud Account Acquisition And Ownership
Do not create a production cloud account merely to make the prototype public.
Create the company-controlled cloud foundation during Beta, after an initial
architecture and cost estimate is approved.

Before account creation:
- Confirm company legal and billing identity.
- Use a company-controlled domain and administrative email.
- Name a billing owner, technical owner, security contact, and recovery contact.
- Require CEO approval for planned outgoing cloud expenditure.
- Ensure no personal account is the sole tenant, subscription, or billing owner.

Initial Azure organization:
- One company Microsoft Entra tenant
- Separate development, test, staging, and production subscriptions/landing zones
- Separate managed identities, secrets, storage, databases, and logs per environment
- Two protected break-glass accounts monitored for use
- Least-privilege RBAC and MFA for every human administrator

Cost controls:
- Produce a monthly low/expected/high cost estimate before provisioning.
- Configure subscription and resource-group budgets.
- Notify billing, technical, and CEO contacts at approved actual and forecast thresholds.
- Review cost daily during online testing and the first public-launch period.
- Remember that Azure budgets alert but do not automatically stop resources;
  service-specific caps, scaling limits, and approved automation are still required.
- Cost data and budget evaluation are delayed, so budgets are not a real-time
  emergency spending brake.
- Free or promotional credit may support experiments but is not a production dependency.

Cloud account creation and paid resource changes are outgoing company
commitments and follow the Admin preparation and CEO approval workflow.

## 2. Environments

### Development
- Fast iteration
- Synthetic data
- Mock/sandbox integrations

### Test
- Automated integration and E2E testing
- Resettable SQL Server test data

### Staging
- Production-like networking, configuration, and services
- Payment sandbox
- Final migration, security, load, smoke, and rollback testing

### Production
- Separate subscription/account and secrets
- Restricted administrator access
- Production payment provider
- Production monitoring, backups, WAF, alerts, and incident response

Production data must never be copied directly into lower environments without approved anonymization.

Recommended first Azure resource map:
- App Service for customer web, Backend web, and Web Service
- Azure SQL Database for relational production data
- Blob Storage for processed profile and conversation media
- Key Vault for secrets and certificates
- Application Insights and Azure Monitor for telemetry and alerts
- SignalR Service when managed real-time scale is required
- Functions, WebJobs, or a worker service for scheduled tasks
- Front Door/WAF before externally accessible real-customer testing
- DNS and managed TLS for the approved DatingEasy domain

Use the smallest approved nonproduction capacity first. Production sizing is
based on staging load tests and availability requirements, not guesswork.

## 3. Infrastructure Principles
- Infrastructure as code
- Separate configuration from code
- Secrets in managed secret store
- Least-privilege service identities
- Private database networking where practical
- Encryption in transit and at rest
- Automated backups and tested restoration
- No direct public SQL Server access
- No Frontend or Backend UI direct database access

## 4. CI/CD Pipeline

Source-control, review, versioning, artifact, and emergency-change requirements are
defined in `VERSION_CONTROL_AND_RELEASE_GOVERNANCE.md`.

On change:
1. Restore dependencies
2. Build
3. Static analysis and secret scan
4. Unit tests
5. API contract validation
6. Integration tests
7. Package immutable release artifacts
8. Vulnerability scan

On release candidate:
1. Deploy database-compatible changes to staging
2. Deploy Frontend, Web Service, workers, and Backend to staging
3. Run migrations
4. Run smoke and E2E tests
5. Run targeted performance/security checks
6. Require release approval
7. Deploy to production slot
8. Run production-safe smoke tests
9. Swap/promote slot
10. Monitor release

Azure deployment slots support staging, smoke testing, blue-green promotion,
and rollback. App Service requires a Standard, Premium, or Isolated plan for
deployment slots, so that tier cost must be included in the estimate.

## 5. Database Deployment
- Use versioned migrations.
- Every migration has forward and rollback/mitigation instructions.
- Prefer backward-compatible expand-and-contract changes.
- Back up before high-risk schema changes.
- Separate schema deployment from irreversible data cleanup.
- Validate ledger/report reconciliation after financial migrations.

## 6. Release Strategy

### Arfa
- Local runnable prototype
- Complete agreed workflows and automated prototype tests
- Joint product review before Beta begins
- No production account, real payments, or public advertising

### Beta
- Production architecture and durable data layer
- Production-quality security, audit, monitoring, migration, and recovery
- Payment sandbox and synthetic test data
- Cloud-deployable immutable release artifact
- No open critical release defect

### Deployment Rehearsal
- Repeatable test and staging provisioning from infrastructure code
- Staging deployment, migration, smoke, load, restore, and rollback exercises
- Restricted internal online test with synthetic accounts

### Closed Real-Customer Test
- Invitation only in one approved geography/language
- Small customer and spending caps
- Production payments only after acquirer and legal approval
- Limited robot autonomy and strong kill switches
- Daily safety, cost, and financial reconciliation review

### General Availability
- Only after deployment and controlled online-test gates pass
- Expand geography and acquisition gradually
- Preserve feature flags and kill switches

The product naming sequence is:
1. Arfa: local functional prototype and review
2. Beta: production-architecture release candidate
3. Deployment rehearsal: repeatable staging install and rollback
4. Controlled online test: internal, then invitation-only real customers
5. Public launch: gradual general availability

## 7. Feature Flags And Kill Switches
Independent controls for:
- New registration
- Customer charging
- Gifts
- Media messages
- Company-operated-profile availability
- Robot assignment
- Robot auto-send
- Adult intimate category
- Prepared-text category
- New geography
- Scheduled financial reports

Emergency controls must allow:
- Stop all new charges
- Stop robot messaging
- Stop seed activation
- Revoke sessions
- Disable uploads

## 8. Monitoring And Alerts

Platform:
- Availability
- Error rate
- Latency
- CPU/memory/storage
- SQL connections and failures
- SignalR connection health

Business integrity:
- Charge success/failure
- Duplicate callback prevention
- Credit reconciliation
- Message/gift transaction failures
- Daily/monthly report failures

Safety:
- Reports and blocks
- Robot escalations
- Company-operated-profile presentation or integrity failures
- Unusual spending
- Mass messaging
- Prohibited-content detections

## 9. Backup And Recovery
Proposed initial objectives:
- Financial/chat database recovery point objective: 15 minutes or better
- Recovery time objective: 4 hours or better
- Daily full backup plus point-in-time recovery where available
- Media versioning/soft deletion
- Quarterly restore test
- Annual full disaster-recovery exercise, plus one before public launch

Final targets require cost and business approval.

## 10. Incident Response
Incident classes:
- Security/privacy
- Payment/credit integrity
- Messaging/safety
- Availability
- Data loss/corruption
- AI/robot behavior

Each class needs:
- Severity definitions
- On-call owner
- Escalation contacts
- Customer communication template
- Evidence retention
- Regulatory/legal notification decision process
- Post-incident review

## 11. Launch Blockers
- No payment processor/acquirer approval
- No legal, consumer-protection, payment-provider, and marketplace approval for
  the customer-type-hidden company-operated-profile model
- Employee compensation creates unmitigated incentive to pressure customer spending
- Refund/chargeback policy incomplete
- Gift-to-seed allocation unresolved
- Media-size policy unresolved
- Critical security or financial defects
- Inability to restore backups
- Inadequate moderation/on-call staffing

## 12. Rollback
- Use previous immutable application artifact.
- Prefer deployment-slot swap rollback.
- Database rollback must avoid losing post-release customer/financial data.
- Disable affected feature by flag when full rollback is unsafe.
- Verify credits, charges, messages, assignments, and reports after rollback.

## 13. Deployment Runbook
Every deployment records:
- Release version, source commit, build, and approver
- Database migration version and compatibility check
- Infrastructure revision
- Feature-flag state
- Backup/restore point
- Deployment start/end and operator/service identity
- Smoke-test result
- Monitoring observation period
- Promotion or rollback decision

Production sequence:
1. Confirm launch gate and current backup.
2. Deploy the immutable artifact to the nonproduction production slot.
3. Apply only compatible reviewed migrations.
4. Warm the slot and run health, auth, message, credit, and read-only financial checks.
5. Verify slot-specific secrets, identities, networking, and diagnostics.
6. Promote by slot swap or equivalent blue-green mechanism.
7. Run production-safe smoke tests.
8. Observe agreed technical and business metrics.
9. Continue, disable a feature, or swap back according to the release thresholds.

Database changes that cannot be reversed without losing post-deployment data
must use forward correction rather than destructive rollback.

## 14. Current Azure References
- Azure landing zones:
  `https://learn.microsoft.com/azure/cloud-adoption-framework/ready/landing-zone/`
- Azure Cost Management budgets:
  `https://learn.microsoft.com/azure/cost-management-billing/costs/tutorial-acm-create-budgets`
- Azure App Service deployment slots:
  `https://learn.microsoft.com/azure/app-service/deploy-staging-slots`
- Azure SQL backup recovery:
  `https://learn.microsoft.com/azure/azure-sql/database/recovery-using-backups`
