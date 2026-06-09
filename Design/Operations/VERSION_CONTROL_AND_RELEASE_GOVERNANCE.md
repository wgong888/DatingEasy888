# Version Control And Release Governance

Status: design plan. The source-control hosting provider has not been selected.

## 1. Objectives
- Preserve a complete, attributable history of product, infrastructure, database, and design changes.
- Prevent unreviewed or untested changes from reaching production.
- Make every production release reproducible from an immutable source revision.
- Support urgent fixes without bypassing security, financial, or audit controls.
- Protect source code, credentials, customer data, and intellectual property.

## 1A. Agile Delivery Model
DatingEasy888 uses Agile delivery throughout product discovery, design,
database review, implementation, testing, security work, deployment, and
post-launch operation.

- Maintain one prioritized product backlog with clear acceptance criteria.
- Deliver work in short, reviewable increments rather than waiting for one
  complete final release.
- Review each increment with the relevant product, design, engineering,
  security, finance, operations, or legal owner.
- Keep API contracts, database design, migrations, tests, manuals, and
  operational documentation synchronized with the increment.
- Use retrospectives and production evidence to improve later iterations.
- A feature is not done until its applicable tests, security controls,
  documentation, observability, and rollback considerations are complete.
- Iteration speed does not waive separation of duties, CEO payment approval,
  financial integrity, safety, privacy, or production release gates.

## 2. Repository Strategy
Begin with one private repository unless team or deployment boundaries later require separation.

Recommended top-level ownership areas:
- Customer Frontend
- Employee/Admin Backend
- C# Web Service
- Robot and scheduled workers
- SQL Server migrations
- Infrastructure as code
- Automated tests
- Product and architecture documentation

Keep database migrations, API contracts, and the application version that consumes them traceable to the same release.

Do not commit:
- Passwords, tokens, certificates, connection strings, or private keys
- Raw customer, employee, payment, chat, or moderation data
- Production database backups
- Unapproved generated binaries or large media assets
- Local developer configuration containing secrets

## 3. Branching Model
Use a protected, trunk-based model:
- `main` is always releasable and cannot be pushed to directly.
- Work is performed in short-lived branches.
- Every change enters `main` through a pull request.
- Long-lived environment branches are avoided; environments receive immutable builds from `main`.
- Temporary release branches are allowed only when a supported production release needs stabilization.
- Urgent fixes use a short-lived hotfix branch from the production tag and are merged back into `main`.

Feature flags should separate incomplete features from source branches when practical.

## 4. Pull Request Controls
Every pull request requires:
- A linked requirement, issue, incident, or documented reason
- Description of behavior and risk
- Tests or an explanation of why tests are not applicable
- Successful required CI checks
- Review by at least one qualified person other than the author
- Resolution of review comments before merge

Two independent approvals are required for:
- Authentication, authorization, encryption, and secrets
- Credits, payments, gifts, refunds, payouts, and financial reports
- Database migrations that alter or delete production data
- Employee/admin privileges
- Robot auto-send, safety, profile presentation, or moderation behavior
- Infrastructure, networking, production access, and audit logging

Use code ownership rules so security, finance, database, robot-safety, and infrastructure changes automatically request the correct reviewers.

## 5. Protected Branch Rules
For `main` and supported release branches:
- Disable direct pushes and force pushes.
- Require pull requests and required approvals.
- Require current branch and successful CI.
- Require resolved review conversations.
- Prevent branch deletion except by repository administrators.
- Restrict bypass permission to a small, audited emergency group.
- Dismiss stale approvals after security-sensitive changes.
- Record all administrative rule changes.

The author of a change must not be its only approver or production deployer.

## 6. Commit And Merge Policy
- Commits must identify their author through individual company accounts.
- Shared developer accounts are prohibited.
- Squash merge is recommended for ordinary feature branches.
- Commit messages should state the meaningful change and reference the work item.
- Security-sensitive release tags and artifacts should be cryptographically signed where the selected platform supports it.
- History must not be rewritten on protected branches.

## 7. Versioning
Use semantic product versions:
- Major: incompatible API, data, or product contract change
- Minor: backward-compatible feature release
- Patch: backward-compatible defect or security fix

Also record:
- Source commit SHA
- Build number
- UTC build time
- Database schema/migration version
- API contract version
- Frontend/Backend asset version
- Infrastructure revision

Public APIs remain under `/api/v1` until an intentionally incompatible contract requires `/api/v2`. Product version and API version are related but not required to have the same number.

## 8. Release Artifacts
CI creates immutable artifacts once. The same tested artifact is promoted through test, staging, and production; production must not be rebuilt from a working directory.

Each release bundle includes:
- Application artifacts
- Dependency lock files
- Software bill of materials
- Vulnerability scan results
- Database migration package and recovery instructions
- Infrastructure revision
- Automated test evidence
- Release notes
- Source commit and signed release tag

Retain enough evidence to reproduce and investigate every supported production release.

## 9. Database And Configuration Changes
- Database schema changes use reviewed, versioned migrations.
- Migrations are forward-compatible where practical.
- Destructive cleanup is separated from application rollout.
- Every high-risk migration includes backup, verification, and mitigation steps.
- Environment configuration is versioned as templates or infrastructure code.
- Secret values remain in the managed secret store and never in source control.
- Production configuration changes follow the same review and audit process as code.

## 10. CI/CD And Promotion
Required pre-merge checks:
- Build and lint
- Unit and integration tests
- API contract validation
- Secret scanning
- Dependency and source vulnerability scanning
- Infrastructure and migration validation

Production promotion requires:
- Approved release candidate
- Passing staging smoke/E2E tests
- Security and financial release gates
- Migration and rollback readiness
- Named release approver
- Recorded deployment result

Only the deployment service identity may publish normal production releases. Human production access is reserved for approved operational or emergency work.

## 11. Repository Access
- Company-managed individual accounts only
- Mandatory multi-factor authentication for all contributors
- Least-privilege repository roles
- Quarterly access review
- Immediate access removal on employee departure or role change
- Separate administrator group with at least two trusted members
- Recovery codes and break-glass credentials secured and audited
- Third-party contractor access must expire automatically

## 12. Dependency And Supply-Chain Control
- Pin direct dependencies and commit lock files.
- Use approved package registries and trusted publishers.
- Review new dependencies for license, maintenance, security, and necessity.
- Generate an SBOM for production releases.
- Automate dependency alerts and update proposals.
- Block known critical vulnerabilities unless a documented, time-limited exception is approved.
- Protect CI workflows from untrusted pull-request code and excessive token permissions.

## 13. Emergency Changes
Emergency changes may shorten normal timing, but must still:
- Be linked to an incident
- Receive an independent approval
- Pass the minimum safe automated checks
- Use an immutable tagged artifact
- Record who approved and deployed it
- Be reviewed retrospectively within two business days

Emergency access must not become a routine release path.

## 14. Retention And Recovery
- Use the hosting provider's repository backup/export capability.
- Maintain an encrypted independent repository backup.
- Test repository restoration at least annually.
- Retain release tags and production evidence according to the audit and legal retention policy.
- Never delete history to conceal an exposed secret; revoke and rotate the secret, then perform an approved history-cleanup procedure if required.

## 15. Initial Decision
Adopt protected trunk-based development with pull requests, independent review, immutable CI-built artifacts, semantic product versions, versioned database migrations, and production releases tied to a source commit and release tag.
