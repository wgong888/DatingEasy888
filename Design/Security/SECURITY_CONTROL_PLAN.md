# Security Control Plan

Status: design baseline. Controls must be validated during implementation and before launch.

## 1. Security Objectives
DatingEasy888 must protect:
- Customer and employee identities
- Adult profile, chat, photo, consent, and moderation data
- Credits, charges, gifts, refunds, payouts, and reports
- Employee/admin tools and robot operations
- Source code, infrastructure, secrets, backups, and audit evidence

The control program follows defense in depth and uses:
- NIST Secure Software Development Framework for development practices
- OWASP ASVS 5.0.0 Level 2 as the public application baseline
- Stronger risk-based controls for admin, payment, robot, and production surfaces
- PCI DSS 4.0.1 obligations as determined with the payment provider/acquirer

## 2. Data Classification

### Restricted
- Password hashes and authentication secrets
- Payment tokens and payout details
- Government ID/age-verification evidence
- Private photos and intimate chat content
- Moderation evidence and safety reports
- Encryption keys, production secrets, and database backups

### Confidential
- Customer contact and profile data
- Employee records
- Chat metadata
- Credit and transaction history
- Internal prepared text, AI prompts, and operating procedures

### Internal
- Architecture, source code, non-public policies, and operational metrics

### Public
- Approved public profiles and published website content

Access, logging, encryption, retention, export, and deletion rules must follow classification.

## 3. Identity And Access Control

Customer:
- Unique account and verified contact channel
- At least 18 years old before authenticated product use
- Successful login permits immediate use of all server-enabled customer UI actions
- No employee or administrator approval is required for normal customer actions
- Modern password hashing
- Rate-limited login and password reset
- Optional MFA initially, with step-up verification for risky activity
- Session listing and revocation
- Risk response for credential stuffing, account takeover, and unusual location/device changes

Customer self-service does not bypass recipient consent, block state, available
credits, account restrictions, rate limits, or safety and legal enforcement.

Employee and administrator:
- Individual company accounts; shared accounts prohibited
- Human employee login requires password plus a short-lived, single-use code
  sent to a verified work email address or verified mobile number by SMS
- At least one verified employee channel is mandatory; channel changes require
  audited recovery, new-channel verification, and session revocation
- Codes are rate-limited, attempt-limited, never logged, and invalidated after
  successful use, expiry, resend, password reset, or account suspension
- Successful employee login authorizes normal role-permitted work without a
  second manager or administrator approval
- Employee sessions terminate after ten consecutive minutes without employee
  interaction; background requests, incoming events, timers, and open pages do
  not count as activity
- Employees must explicitly log out before leaving or going offline; automatic
  logout is a protective fallback
- Automatic logout blocks sends and releases or transfers active assignment leases
- Stronger phishing-resistant MFA is required for privileged access where supported
- Role-based and policy-based authorization
- Separate employee and administrator privileges
- Step-up authentication for high-risk actions
- Shorter sessions and reauthentication for financial/security changes
- Immediate access removal upon departure or role change

Robot and service identities:
- Managed workload identity where possible
- No interactive human login
- Narrow permissions per service
- Short-lived credentials and automatic rotation
- Independent pause/revoke control

Privileged production access:
- Just-in-time, time-limited approval
- Named reason or incident
- Complete audit trail
- Break-glass accounts stored securely, tested, and alerted on use
- Quarterly access certification

## 4. Authorization And Separation Of Duties
- Default deny.
- Customer, employee, administrator, robot, support, finance, security, and deployment roles are separate.
- Employees access only assigned conversations and required profile context.
- Robots access only leased tasks and approved context.
- Support cannot silently change credit balances.
- Financial adjustments require administrator reauthentication, reason,
  confirmation, and audit. Outgoing company payments additionally require CEO approval.
- Administrators cannot read restricted chat/photo content without an approved support, moderation, safety, or legal purpose.
- Developers have no routine production database access.
- The person authoring a sensitive change cannot be its only reviewer or production approver.

## 5. Authentication And Session Controls
- Passwords are never stored or logged in plain text.
- Authentication cookies use `Secure`, `HttpOnly`, and appropriate `SameSite` settings.
- Tokens have limited lifetime, audience, issuer, and purpose.
- Refresh tokens are rotated and replay is detected.
- Customer sessions terminate after twenty consecutive minutes without
  meaningful customer interaction.
- Employee sessions terminate after ten consecutive minutes without meaningful
  employee interaction.
- Background reconciliation, incoming events, timers, automated refresh, and
  open pages do not reset either inactivity timer.
- Logout, applicable inactivity timeout, suspension, password reset, and role
  change revoke applicable sessions.
- CSRF protection is required for cookie-authenticated commands.
- Sensitive operations require recent authentication.
- Authentication failures use non-enumerating responses.

## 6. Application And API Controls
- Validate requests against explicit schemas and business rules.
- Use parameterized database access.
- Encode untrusted output by context.
- Enforce authorization at every API operation and object boundary.
- Validate policy values against typed schemas and safe ranges.
- Reject secrets, executable code, unknown fields, conflicting effective times,
  and invalid cross-policy combinations.
- Make published policy versions immutable and preserve before/after audit data.
- Alert when consuming services report different active policy versions.
- Rate limit by account, device, IP/network risk, and operation where appropriate.
- Require idempotency for financial, message, gift, and robot commands.
- Restrict CORS to approved origins.
- Apply security headers and a restrictive Content Security Policy.
- Return stable public errors without stack traces or secrets.
- Set request, upload, pagination, and query-complexity limits.
- Maintain an inventory of public, employee, admin, robot, and integration endpoints.

## 7. Data Protection
- Encrypt all network traffic with current approved TLS configuration.
- Encrypt databases, object storage, queues, logs, and backups at rest.
- Use managed key storage; keys do not live in source code or ordinary configuration.
- Rotate keys and secrets on schedule and after suspected exposure.
- Store UTC timestamps and attributable audit events.
- Separate public profile data from private account and payment data.
- Mask restricted data in UI, support tools, logs, analytics, and exports.
- Define retention and secure deletion by data category before launch.
- Production data is never copied to lower environments without approved anonymization.

## 8. Payment And Credit Controls
- Use provider-hosted/tokenized card collection to minimize PCI scope.
- Never store CVV, card PIN/password, or full raw card number.
- Verify payment webhook signatures and prevent replay.
- Grant credits only after confirmed provider events.
- Maintain an append-only credit ledger with transactional balance updates.
- Treat `CustomerProfile.CreditsRemain` as the authoritative spendable balance;
  update it only through approved credit commands.
- Never accept a browser-supplied balance, balance delta, or changed-status flag
  as authority for a database update, including during logout or session expiry.
- Use an atomic sufficient-balance update for deductions so concurrent requests
  cannot overspend, create a negative balance, or charge without completing
  the related business action.
- Reconcile provider charges, charge records, credits, gifts, refunds, and chargebacks.
- Treat successful gifts as non-refundable and expose no gift-reversal command.
- Snapshot seed-to-employee gift attribution and protect EmployeeCreditLedger
  with the same append-only and audit controls as customer credits.
- Alert on duplicate callbacks, abnormal failure rates, balance mismatches, and unusual spending.
- Log repeated client/server balance mismatches as possible stale-session,
  integration, or tampering signals without copying the client value into SQL.
- Apply spending limits, confirmation, cooling-off, and manual review to high-value gifts.
- Restrict and audit refunds, balance adjustments, report finalization, and payout changes.

## 9. Chat, Media, And Adult-Safety Controls
- Enforce 18+ eligibility and approved consent rules.
- Do not steer, rewrite, or suppress lawful customer-to-customer conversation based only on viewpoint or controversial subject.
- Detect and respond narrowly to racist/discriminatory harassment, credible violent threats, exploitation, non-consensual intimate content, child-safety concerns, malware, fraud, and spam.
- Provide block, report, mute, and consent-withdrawal actions.
- Validate media by content, not filename alone.
- Quarantine and validate original uploads before processing.
- Convert safely decodable pictures to a controlled JPG or PNG derivative;
  preserve transparency with PNG and use JPG for ordinary photographs.
- Reject corrupt, polyglot, deceptive, unsupported, or unsafe files rather than
  trusting their extension or attempting unrestricted conversion.
- Resize and compress profile and conversation pictures to a maximum 100 x 100
  pixel bounding box while preserving aspect ratio; do not enlarge smaller files.
- Transcode and compress voice uploads to the approved codec, duration, and byte limits.
- Reject malformed files, decompression bombs, and media that cannot be safely processed.
- Scan files for malware and prohibited content.
- Strip unnecessary metadata and use non-guessable object identifiers.
- Use short-lived authorized media URLs.
- Separate public and private media permissions.
- Limit unsolicited intimate content and repeated contact.
- Preserve only the investigation context permitted by policy and law.
- Require an approved purpose and audit record whenever an employee or administrator accesses private conversation evidence.
- Treat SexRequest only as an invitation to begin mutual consent; require verified eligible adults, recipient preference, confirmation, rate limits, cooldown, and immediate withdrawal support.
- Prevent blocked customers and intimate-feature-restricted accounts from exchanging profile interaction requests.
- Keep presence approximate and privacy-controlled; do not expose exact device activity, message-reading state, IP address, or precise location.
- Inform customers before eligible profile visits become visible to profile owners.
- Exclude blocked relationships and internal admin, moderation, support, safety, robot, and service access from customer-visible visit history.
- Do not fabricate profile visits or visitor notifications.

## 10. Seed, AI, And Robot Controls
- Prohibit scraping, copying, or lightly modifying real profiles, photos, biographies, or identities for seed generation.
- Require synthetic or explicitly licensed seed assets with documented provenance and consent.
- Clearly label AI-generated/company-operated profiles on discovery, profile, chat, and paid-action screens.
- Record customer acknowledgement before paid seed interaction.
- Record whether each message is human-written, prepared, AI-assisted, or robot-generated.
- Prevent explicit false claims about offline identity, physical presence,
  exact location, or real-world availability.
- Prevent fabricated offline meetings, identity, location, employment, family, or personal experiences.
- Approved prepared-text versions only.
- Mandatory human transfer for safety, exploitation, self-harm, coercion, legal threats, payment disputes, and other defined topics.
- Prompt and retrieved context must exclude unrelated customer data.
- Robot work uses expiring leases, capacity limits, and an immediate kill switch.
- Robot auto-send remains disabled until safety evaluation and explicit launch approval.
- Monitor for spending pressure, repetitive scripts, profile-presentation
  confusion, and attempts to bypass controls.
- Prohibit engagement tactics based on jealousy, guilt, abandonment, exclusivity, fabricated urgency, emotional dependency, or deliberate message fragmentation.
- Respect customer pause, stop, topic-change, and consent-withdrawal requests immediately.

## 11. Infrastructure And Network Controls
- Separate development, test, staging, and production accounts/subscriptions.
- Do not expose SQL Server directly to the public internet.
- Use private service connectivity where practical.
- Place public traffic behind WAF, DDoS protection, and rate limiting.
- Restrict administrative interfaces by identity and additional network controls where practical.
- Harden operating systems, containers, databases, and cloud services against approved baselines.
- Disable unused services, ports, accounts, and default credentials.
- Use infrastructure as code and reviewed configuration changes.
- Continuously inventory internet-facing assets and certificates.

## 12. Secrets And Cryptography
- Store secrets in a managed vault.
- Use separate secrets per environment and service.
- Grant secret access to workload identities, not broad teams.
- Never place secrets in source control, tickets, chat, screenshots, or logs.
- Automate rotation where possible.
- Maintain a cryptographic inventory and approved algorithm/key-length policy.
- Password hashing, encryption, signing, and random identifiers use established platform libraries.
- A suspected secret exposure triggers immediate revocation and rotation.

## 13. Logging, Audit, And Detection
Security logs should include:
- Login, logout, reset, MFA, lockout, and session revocation
- Role, permission, employee, and robot identity changes
- Restricted-data access
- Payment, credit, gift, refund, payout, and report actions
- Seed assignment, robot operation, profile presentation, and safety transfer
- Moderation and account enforcement
- Production deployment and configuration change
- Key, secret, backup, and break-glass operations

Controls:
- UTC time and request/correlation identifiers
- Tamper-resistant centralized storage
- Least-privilege log access
- Alerts for account takeover, privilege escalation, mass access, payment abuse, robot anomalies, and control disablement
- No passwords, CVV, access tokens, full card numbers, or unnecessary intimate content in logs
- Documented alert ownership, severity, and response time

## 14. Vulnerability And Patch Management
- Inventory applications, services, dependencies, cloud assets, and owners.
- Scan source, dependencies, secrets, infrastructure, containers/artifacts, and public endpoints.
- Review new third-party packages before use.
- Proposed remediation targets:
  - Critical actively exploited or internet-exposed issue: mitigate immediately; target 24 hours
  - Other critical issue: target 7 days
  - High issue: target 30 days
  - Medium issue: target 90 days
- Exceptions require owner, justification, compensating controls, approval, and expiration.
- Independent penetration testing is required before public beta and after major high-risk changes.
- Provide a monitored vulnerability-reporting contact and coordinated disclosure process.

## 15. Secure Development And Supply Chain
- Protected source branches and independent pull-request review
- Security design review and threat modeling for high-risk features
- Automated secret, dependency, source, and infrastructure scanning
- Locked dependencies and trusted package sources
- Software bill of materials for production releases
- Immutable signed/tagged release evidence
- CI identities with minimum permissions
- No untrusted pull-request code receives production secrets
- Security defects receive the same tracked ownership as product defects

Detailed source and release rules are defined in `Operations/VERSION_CONTROL_AND_RELEASE_GOVERNANCE.md`.

## 16. Backup, Recovery, And Availability
- Encrypted backups separated from primary production credentials
- Point-in-time database recovery where supported
- Media versioning/soft deletion according to policy
- Quarterly restore tests
- Recovery objectives documented and measured
- Protection against deletion of both live data and backups by one compromised identity
- Disaster-recovery and rollback exercise before public launch
- Reconciliation after recovery for payments, credits, gifts, messages, and reports

## 17. Incident Response
Maintain playbooks for:
- Account takeover
- Customer or employee data exposure
- Payment/credit fraud or ledger mismatch
- Malicious or unsafe robot behavior
- Intimate-media abuse
- Production credential compromise
- Ransomware/destructive access
- Availability attack

Every playbook defines detection, containment, evidence preservation, legal/privacy review, customer communication, recovery, and post-incident corrective action.

## 18. Security Verification Gates
Before public beta:
- Threat models approved for authentication, chat/media, payment/credits, employee/admin, and robots
- OWASP ASVS 5.0.0 Level 2 verification completed for applicable public controls
- Independent penetration test has no unresolved critical/high finding
- Payment provider and PCI responsibilities are documented
- Privileged access and MFA controls are operating
- Central logs and high-priority alerts are tested
- Backup restoration and incident exercises pass
- Company-operated-profile controls and robot kill switches are verified
- Data retention, privacy, and breach-response policies receive legal review

## 19. Control Ownership And Review
Assign a named business and technical owner to every control area. Review:
- High-risk alerts daily
- Vulnerabilities and exceptions weekly
- Privileged/repository access quarterly
- Incident and recovery playbooks twice yearly
- Threat models after material design changes
- Security architecture and policies at least annually

## Sources
- NIST SSDF 1.1: https://csrc.nist.gov/pubs/sp/800/218/final
- OWASP ASVS 5.0.0: https://owasp.org/www-project-application-security-verification-standard/
- CISA Secure by Design guidance: https://www.cisa.gov/securebydesign
- PCI DSS: https://www.pcisecuritystandards.org/standards/pci-dss/
