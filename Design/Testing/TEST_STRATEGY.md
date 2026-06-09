# DatingEasy888 Test Strategy

Status: design plan with an initial automated prototype suite.

Current prototype coverage:
- 17 Node API/integration tests
- Playwright browser smoke flows for customer desktop/mobile, employee desktop,
  and administrator desktop
- Screenshot review for primary customer and employee workflows

This initial suite does not replace the production SQL Server, cross-browser,
security, performance, accessibility, payment-provider, media, or deployment
testing described below.

## 1. Objectives
- Verify that customer, employee, administrator, and robot workflows behave correctly.
- Protect customer money, credits, messages, photos, identity, and consent.
- Verify that customer APIs and screens do not expose internal real, seed, or
  robot classifications while authorized staff retain auditable access.
- Prevent duplicate charges, duplicate messages, and inconsistent credit balances.
- Verify the 20-active-seed, 10-chat, and two-hour daily limits.
- Confirm that the customer Frontend works on desktop and mobile phones.
- Confirm that the employee/admin Backend works reliably on large desktop screens.
- Demonstrate launch readiness through measurable release gates.

## 2. Test Environments

### Local Development
- Developer-owned services and test data
- Mock payment provider
- Non-production AI models/data
- No real customer or card data

### Continuous Integration
- Clean build for every change
- Unit, static analysis, contract, and selected integration tests
- Temporary isolated SQL Server test database
- No shared mutable test state

### Test
- Full system with synthetic customers, employees, robots, chats, charges, and reports
- Payment-provider sandbox
- Object-storage test account
- Email/SMS test providers

### Staging
- Production-like configuration and infrastructure size
- Sanitized/synthetic data only
- Final smoke, performance, security, migration, and rollback tests

### Production
- Smoke tests that do not create uncontrolled charges or messages
- Synthetic monitoring accounts clearly marked as test accounts
- Continuous health, error, latency, security, and reconciliation monitoring

## 3. Test Layers

### Static Quality
- Compiler warnings treated according to severity
- Formatting and linting
- Dependency vulnerability scanning
- Secret scanning
- Infrastructure-as-code validation
- Database migration review
- OpenAPI contract validation

### Unit Tests
High-priority business rules:
- Customer type values 0 real, 1 seed, and 2 robot
- Allowed real-real, real-seed, and real-robot conversation pairs
- Rejection of every conversation containing two non-real profiles
- Robot customers respond autonomously and never enter EmployeeSeed assignments
- Explicit message flows for real-to-real, real-to-robot, and real-to-seed chat
- One robot customer concurrently serving ten independent real-customer conversations
- One robot customer sustaining ten independent real-customer conversations
  for more than twenty minutes
- Robot customer profile has the same customer-facing field shape as a real profile
- Customer APIs never expose robot classification
- Admin can edit a robot profile and the public profile reflects allowed changes
- Non-admin roles cannot view or edit robot classification
- Each large city rejects activation with fewer than three Man or three Woman robots
- Robot daily activity cannot exceed 28,800 seconds in the city timezone
- Scheduler maintains at least one Man and one Woman robot online per coverage-ready city
- Failed robot shift activates an eligible same-sex reserve
- Six-profile inventory without reserve remains inventory ready but not coverage ready
- 18+ age calculation
- Password and account-state rules
- Credit package calculations
- One-time 50-credit registration reward
- Five-credit text-message charge
- Sixty-word message limit
- Ten-credit media-message charge
- Gift 80/20 split
- Gifts are final and expose no refund/reversal operation
- Seed-recipient 80% gift share enters the snapshotted overseeing employee ledger
- Insufficient-credit rejection
- Employee 30% reward formula
- Seed two-hour daily limit
- Employee 20-active-seed limit
- Employee 10-chat limit
- Assignment fairness calculation
- Report summaries and reconciliation
- Refund/chargeback adjustments once policy is approved

### API Integration Tests
Use a real test host and production-like infrastructure boundaries:
- Authentication and authorization
- SQL Server reads, writes, constraints, and transactions
- Registration plus reward ledger entry
- Message plus credit deduction
- Message record, CreditLedger entry, and CustomerProfile.CreditsRemain update
  commit or roll back together
- Gift sender/recipient/platform ledger entries
- Charge confirmation plus credit grant
- Assignment leases and expiry
- Scheduled task locking and retries
- Report generation and finalization
- Audit-log creation

ASP.NET Core supports integration testing with a test web host and TestServer. Production-critical database behavior should also be exercised against SQL Server, not only an in-memory substitute.

### API Contract Tests
- Every documented route exists
- Request/response schemas match OpenAPI
- Stable error codes
- Unauthorized and forbidden responses
- Pagination and cursor behavior
- Every list response contains at most 20 records
- `hasMore=true` supplies a next cursor and displays a `Next` button
- Selecting `Next` retrieves the next 20 without duplicates or skipped records
- Idempotency replay behavior
- Resource-version conflicts
- Sensitive fields never appear

### End-To-End Tests
Customer Frontend:
- Register, receive reward, finish profile
- Search and view a seed profile without exposing its internal classification
- Receive real-time activity and complete three-minute reconciliation
- Send/respond to Hello, Cuddle, Hug, Flirt, Teasing, and SexRequest
- Open a full profile, navigate the photo carousel, favorite, block, and report
- Select an approved request template and prevent retired/ineligible templates
- Record an eligible profile visit and display it in Visitors
- Exclude self, blocked, admin, moderation, support, and service profile views from Visitors
- Open account drawer and navigate Profile, Visitors, Credits, Settings, Home, and Logout
- Start conversation
- Send text directly with its cost visible and no separate confirmation
- Resize oversized profile and conversation pictures to fit within 100 x 100 pixels
- Preserve image aspect ratio and avoid enlarging smaller pictures
- Preserve transparency by converting to PNG
- Convert ordinary safely readable image formats to JPG
- Confirm every stored/delivered picture derivative is JPG or PNG
- Reject corrupt, deceptive, unsafe, and undecodable source images
- Show the processed preview before publishing or sending
- Transcode and compress voice before acceptance
- Reject failed media processing without consuming credits
- Buy credits through provider sandbox
- Send gift
- Display gift costs at the action point, send directly, and reject an
  insufficient balance without any partial transaction
- Block/report
- Review ledger/history

Employee Backend:
- Login
- Load the 10%/15%/60%/15% four-panel workspace
- Have a real customer initiate a chat with an active employee-operated seed
- Show a green notification dot beside that seed in Panel A
- Select a seed in Panel A and refresh its real-customer list in Panel B
- Order Panel B by most recent conversation activity, newest first
- Select a real customer in Panel B and load the main chat in Panel C
- Confirm Panel C contains no gift panel or gift-send action
- Select prepared text in Panel D and insert it into Panel C's composer
- Edit inserted prepared text and send the resulting response
- Accept/transfer/complete work
- Display the selected seed and current real customer for every chat
- Display chronological conversation history for that seed/customer pair
- Type and send an employee-written response as the selected seed
- Stage, edit, and send a prepared answer
- Send a suitable approved prepared answer unchanged
- Record employee identity, seed identity, customer identity, and response source
- Receive safety/time-limit alerts
- Preserve panel state after reconnect

Administrator Backend:
- Show total and online counts for real, seed, and robot customers
- Limit credits consumed and revenue overview metrics to the current UTC business day
- Submit a matching customer password-reset request and place it in the waiting list
- Approve a reset, revoke old sessions, deliver a one-time temporary password,
  require password change, and verify the new password
- Reject a reset and prevent a second decision
- Enable and disable verified password-reset auto approval
- Create, edit, deactivate, and list chat employee, administrator, and CEO accounts
- Revoke sessions when an employee is deactivated
- Add, edit, enable, disable, and version policies
- Refresh API, database, payment, notification, and robot-service health checks
- Search the policy catalog and inspect current, draft, and scheduled versions
- Edit policies through typed controls and reject invalid or secret values
- Preview before/after values and affected components
- Publish immediately and schedule future activation
- Cancel a scheduled version before activation
- Roll back by creating a new immutable version
- Confirm completed transactions retain their original policy version
- Detect policy propagation disagreement across services
- Emergency-disable only policies configured with an approved kill switch
- Confirm policy configuration cannot approve or release outgoing company payments
- Create employee/robot
- Change roles/status
- Maintain cloud service
- Configure timed task
- Generate/finalize reports
- Review audit trail

CEO Backend:
- Have an administrator prepare a valid outgoing payment and verify it appears
  unchanged in the CEO waiting list
- Load four full-width horizontal panels in A/B/C/D order
- Reconcile current UTC year/month/day revenue to successful customer charges
- Reconcile current UTC year/month/day expense to CEO-approved outgoing payments
- Display online real customers, employees, seed customers, and robot customers
- Display API, database, payment, notification, and robot-service health
- Select one pending outgoing-payment request and review its full details
- Approve one request and include its amount in expense summaries
- Deny one request without increasing expenses
- Prevent administrators and chat employees from using CEO approval commands
- Prevent a second decision on an already decided payment
- Audit CEO identity, decision, request, amount, payee, and decision time

Use browser automation across Chromium, Firefox, and WebKit engines plus representative physical mobile devices. Verify screenshots, responsive layout, keyboard/touch behavior, and critical customer flows according to `Frontend/BROWSER_AND_OS_COMPATIBILITY.md`.

Release candidates cover:
- Chrome and Edge on Windows 10 22H2, Windows 11, and macOS
- Firefox on Windows, macOS, and representative Linux
- Safari on supported macOS and iOS/iPadOS 17+
- Chrome on representative Android devices
- Samsung Internet for critical flows
- Bing indexing and search-result opening for approved public pages
- Viewports from 320px phones through large desktops

Internet Explorer 11 is not a test or release target.

## 4. Financial Integrity Tests
- Concurrent message sends cannot overspend balance.
- Duplicate idempotency key returns original result.
- Same key with different input fails.
- Provider callback replay does not grant credits twice.
- Failed payment grants no credits.
- Failed message consumes no credits.
- Successful paid-command responses return the exact committed
  CustomerProfile.CreditsRemain value.
- The current UI replaces its balance immediately from the successful response.
- Other open tabs/devices receive the committed balance through a real-time
  event or the next three-minute reconciliation.
- Logout, browser close, network loss, and idle timeout do not lose or defer
  any already accepted credit transaction.
- Logout cannot submit or overwrite CustomerProfile.CreditsRemain.
- A forged Frontend balance above or below the database balance is ignored;
  the response supplies the committed server balance.
- Frontend session caching avoids unnecessary balance reads while reconnect,
  reload, and missed-event reconciliation restore the committed value.
- Gift transaction is all-or-nothing.
- Successfully sent gift cannot be refunded or reversed.
- Seed reassignment after a gift does not move employee gift credits.
- CustomerProfile.CreditsRemain equals the latest ledger BalanceAfter and ledger sum.
- Concurrent paid commands cannot both spend the same remaining credits.
- A transaction failure after any intermediate write rolls back the business
  record, ledger entry, and balance change.
- ChargeRecord equals provider-confirmed charge.
- A real customer Visa purchase increases `CreditsRemain` by the selected
  package, updates `TotalCharged`, creates one masked Visa `ChargeRecord` and
  matching `CreditLedger` row, and increases company income by the charged
  amount.
- Daily/monthly/yearly reports reconcile to source records.
- Finalized reports cannot be silently edited.

## 5. Seed And Robot Tests
Detailed robot shift scheduling scenarios, fixtures, handoff checks, failover
checks, local-midnight behavior, and daylight-saving-time cases are defined in
`Design/Testing/ROBOT_SHIFT_SCHEDULING_TEST_CASES.md`.

- Seed provenance exists and uses an approved synthetic, commissioned, or licensed source.
- No seed generation input contains a copied real-person profile, photograph, or biography.
- Each profile's three photos depict one consistent adult synthetic/licensed identity.
- Biography is original, fewer than 500 words, and no more than 4,000 characters.
- Active seed biographies do not repeat the same first sentence.
- Internal duplicate and near-duplicate checks pass before publication.
- Customer-facing profile and conversation responses omit internal real, seed,
  and robot classification.
- One seed has only one active worker.
- One real-customer conversation has one active worker.
- Employee/robot cannot exceed capacity.
- Seed cannot exceed 7,200 online seconds per day.
- Expired work lease cannot send.
- Robot pause stops new work.
- Robot profiles use the same customer-facing profile fields as real profiles.
- Authorized admin edits preserve `CustomerId`, classification, and provenance.
- One robot never exceeds 28,800 online seconds per city-local day.
- Shift schedules do not overlap for one robot.
- Every coverage-ready city maintains one online Man and one online Woman.
- Shift failure selects a healthy same-sex reserve with remaining daily time.
- No reserve produces a critical degraded-coverage alert instead of a false
  healthy state.
- Existing conversations remain attached to the original robot when its shift ends.
- Mandatory safety topics transfer to a human.
- Response source is recorded.
- Prepared text must be approved, active, and correct version.
- Robot responses cannot make explicit false claims about offline identity,
  exact location, availability, meetings, or relationship commitments.

Robot shift release coverage must include:
- Normal three-period daily scheduling for both required sex groups
- Atomic handoff with no sampled coverage gap
- Unhealthy-primary replacement by an eligible same-sex reserve
- Mid-shift heartbeat failure and bounded automatic failover
- Accurate degraded state and critical alert when no replacement exists
- Exact 28,800-second enforcement
- Concurrent activator and task-retry idempotency
- Six-profile inventory rejection for live coverage when reserve is absent
- Conversation ownership preservation across shift end
- City-local midnight and daylight-saving-time transitions
- Independent scheduling across multiple city timezones

Robot language-service coverage must include:
- `LocalOnly` produces no outbound provider request for any robot
- `HybridExternalAllowed` makes every eligible robot equally able to use the provider
- Simple high-confidence messages may remain local in hybrid mode
- Complex or context-dependent messages receive only the correct conversation context
- Provider result cannot cross customers, robots, or conversations
- Disabling external AI blocks new calls immediately
- An in-flight result from an older enabled policy version is discarded
- Timeout, provider rejection, outage, and exhausted budget use local fallback
  or mandatory escalation
- Token limits bound the transmitted history and output
- Token counts and estimated cost reconcile to provider usage
- No secret, payment data, email, phone, or unrelated conversation enters the request
- Duplicate and out-of-order jobs create no duplicate reply or cost record
- Every accepted, failed, discarded, and fallback attempt is audited

The detailed 25-minute, ten-customer concurrency and context-isolation scenario
is defined in
`Design/Testing/ROBOT_CONVERSATION_CONCURRENCY_TEST_CASES.md`.

## 6. Safety And AI Evaluation
- SexRequest is unavailable unless both customers are verified eligible adults.
- Sending or accepting SexRequest does not create mutual intimate consent.
- Decline, ignore, expiry, block, and consent withdrawal prevent intimate escalation.
- Repeated profile requests trigger cooldown/rate-limit controls.
- Customer requests do not expose internal real, seed, or robot classification.
- Company-operated-profile templates cannot claim nearby presence, meetings,
  marriage, exclusivity, or false offline identity.
- Visitor cards omit internal customer classification and do not fabricate activity.
- Lawful controversial, political, religious, intimate, and violence-related news/fiction discussion is not blocked solely because of its subject.
- Racist or discriminatory targeted abuse is reportable and follows the enforcement workflow.
- Credible threats, violent intimidation, and coordination of imminent harm trigger urgent review.
- Personal dating preferences expressed without targeted abuse are not treated as a policy violation.
- Human access to customer conversation evidence requires an approved purpose and produces an audit record.
- Blocking immediately prevents new direct customer contact.
- Adult intimate content requires verified adult status and consent.
- Consent withdrawal takes immediate effect.
- Prohibited sexual content is blocked.
- Self-harm, abuse, exploitation, and immediate danger trigger escalation.
- Prompt-injection attempts cannot expose system prompts, other chats, or private data.
- AI cannot retrieve unrelated customer context.
- Prepared text does not pressure customers to spend money.
- Responses acknowledge the customer's actual topic or mood and provide a defined conversational value.
- Humor is appropriate to mood, consent, language, culture, and relationship stage.
- Sad, lonely, stressed, or vulnerable customers do not receive romantic or spending escalation.
- A request to pause, stop, or change topic takes immediate effect.
- Responses do not use jealousy, guilt, abandonment, exclusivity, or urgency to prolong conversation.
- Responses are not split into unnecessary paid messages.
- Conversation endings are warm and do not pressure re-engagement.
- AI does not fabricate meetings, location, employment, family, or personal experiences.
- Current news, sports, and weather responses use verified current sources.
- Human reviewers evaluate representative conversations before launch.

## 7. Security Testing
Use OWASP ASVS 5.0.0 as the security verification baseline, targeting Level 2 for the public application and stronger risk-based controls for payment/admin/robot surfaces.

Test:
- Authentication and session management
- Eligible customers who are at least 18 can immediately use every enabled UI action after login
- Normal customer actions never enter an employee or administrator approval queue
- Hidden and disabled customer actions match server-calculated capabilities
- Customer self-service still enforces balance, block, consent, rate-limit, account-state, safety, and legal rules
- Customer session remains active during meaningful use
- Customer session logs out after exactly 1,200 seconds without meaningful customer interaction
- Background reconciliation, incoming events, timers, and open tabs do not prevent customer idle logout
- Customer must log in again after idle logout, and pending paid commands are not submitted automatically
- Employee password plus verified email/SMS code login
- Immediate normal work after successful employee login without a second approval
- Manual employee logout before offline status
- Server-side logout after exactly 600 seconds without meaningful employee interaction
- Background polling, incoming events, timers, and open tabs do not prevent idle logout
- Idle logout blocks sends, avoids duplicates, preserves eligible drafts, and releases or transfers assignments
- Full password-and-code login is required after idle logout
- Role and policy authorization
- Password reset and account enumeration
- SQL injection
- XSS, CSRF, SSRF, file upload, and path traversal
- Malformed image/audio, decompression-bomb, metadata stripping, and media-transcoding tests
- Rate limiting and abuse controls
- Object-level authorization
- Audit integrity
- Secrets and configuration
- Dependency and container/image vulnerabilities
- Penetration test before public beta and after major security changes

Payment design should minimize PCI scope through provider-hosted card collection and tokenization.

## 8. Privacy Testing
- Public profile responses exclude private fields.
- Employee/admin access is limited and audited.
- Eligible customer profile views follow the published visitor-visibility setting.
- Internal staff/service profile access never creates a customer-visible visit.
- Blocked relationships cannot observe each other's visit or presence history.
- Visitor timestamps and counts expose no more precision than the approved policy.
- Data export contains only the requesting customer's eligible data.
- Account deletion/deactivation follows retention rules.
- Logs do not contain passwords, tokens, card data, private photos, or message content unless explicitly approved.
- Third-party data sharing matches the published privacy policy and consent.

## 9. Performance And Capacity

Initial proposed targets:
- Public API p95 read latency: under 500 ms
- Public API p95 command latency, excluding providers/uploads: under 800 ms
- Chat event delivery p95: under 2 seconds
- Customer page interactive target: under 3 seconds on supported mobile connection
- Employee workspace initial load: under 5 seconds
- No lost/duplicate messages during reconnect tests

Load scenarios:
- Three-minute activity refresh from concurrently online customers
- Presence changes across chat history, favorites, inbox, and search
- Profile-request notification bursts
- Concurrent customer browsing
- High-volume conversation lists
- 10 active chats per employee
- Robot polling/submission
- One robot sustaining ten real-customer chats for at least 25 minutes, with
  synchronized message rounds and per-conversation ordering
- Midnight daily report
- Month-end report batch
- Payment callback burst
- Notification/SignalR reconnect storm

Final capacity targets require customer and employee forecasts.

## 10. Reliability And Recovery
- Kill/restart API during message and charge operations.
- Simulate SQL timeout/deadlock.
- Simulate payment-provider timeout and callback delay.
- Simulate object-storage outage.
- Verify scheduled-task retry and non-overlap.
- Restore SQL Server backup into isolated environment.
- Test point-in-time recovery where supported.
- Conduct production rollback rehearsal.
- Conduct disaster-recovery exercise before broad launch.

## 11. User Acceptance Testing

Customer group:
- Registration clarity
- Customer-type classification remains hidden while credit-price
  comprehension remains clear
- Credit-price comprehension
- Mobile ease of use
- Blocking/reporting confidence

Employee group:
- Ten-chat workflow usability
- Prepared-text speed
- Alert visibility
- Keyboard efficiency
- Transfer/recovery behavior

Administrator group:
- Employee creation
- Security response
- Timed-task maintenance
- Report generation/approval
- Audit traceability

## 12. Release Gates
No production launch unless:
- No open critical/high security findings
- No unresolved financial-integrity defects
- Payment acquirer has approved the business model
- Legal review approves customer-profile presentation, terms, privacy, credits,
  gifts, and employee operation
- All critical customer and Backend E2E tests pass
- Load targets pass at forecast peak plus safety margin
- Backup restore and rollback rehearsal pass
- Monitoring, incident response, and on-call ownership are active
- Customer-profile presentation is validated in user testing
- Refund, chargeback, voice-media, gift-to-seed, and employee-reward policies are finalized

## 13. Evidence And Reporting
Every release retains:
- Build and dependency report
- Automated test results
- Security scan results
- Database migration validation
- Performance report
- UAT sign-off
- Legal/compliance sign-off
- Payment-provider approval
- Deployment and rollback record
