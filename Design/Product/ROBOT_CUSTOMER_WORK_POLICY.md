# Robot Customer Work Policy

Version: Design Draft 1.0  
Status: Approved product direction; implementation pending  
Scope: autonomous robot customers stored as `CustomerProfile.Seed = 2`

## 1. Purpose
Robot customers provide autonomous conversation coverage for real customers.
They are customer-profile identities, not employees, and never enter the
employee seed-work queue.

## 2. Profile Policy
- A robot profile uses the same customer-visible fields, validation, photo
  rules, profile layout, and chat controls as a real customer profile.
- The system generates every robot profile from original synthetic or properly
  licensed material and records its provenance.
- An authorized administrator may also create a robot customer through the
  Robot Customers UI in either of two modes:
  - `Full profile`: the administrator supplies every customer-visible profile
    field.
  - `Auto-fill`: the administrator supplies name, age, sex, country,
    state/province, and city; the system generates the remaining profile fields.
- An administrator-supplied age is converted to an internal birth date while
  preserving the entered age at creation time.
- The system creates the internal robot email, password hash, UUID, and
  `Seed = 2` classification. Robot login credentials are not given to the
  administrator because robot conversation work is headless.
- Every admin-created robot begins inactive with pending originality,
  adult-appearance, rights, profile-quality, and human review.
- Auto-filled fields are shown for administrator review and recorded in
  immutable provenance. An administrator may edit them before approval.
- Customer-facing UI and APIs do not expose whether a profile is real, seed, or
  robot. The robot classification is restricted to authorized administrators,
  system services, audit records, and operational reports.
- An authorized administrator may review and edit a robot's name, photos,
  location, biography, story, preferences, interests, and other profile fields.
- Administrators cannot silently replace `CustomerId`, erase provenance, or
  convert a robot into a real customer. A classification change requires a
  separately authorized, audited lifecycle command.
- Every robot-profile edit records administrator identity, reason, before and
  after values, time, and affected profile version.
- A robot profile cannot be published until adult-appearance, originality,
  rights, profile-quality, and safety reviews pass.

## 3. Conversation Boundaries
- A robot customer may chat only with real customers.
- Robot-to-robot, robot-to-seed, and seed-to-robot conversations are rejected.
- Robot responses are autonomous and do not appear in an employee workspace.
- Robot language generation follows
  `ROBOT_CONVERSATION_AI_SERVICE_POLICY.md`, including the global administrator
  choice between local-only and hybrid outside-AI operation.
- A robot may serve up to ten active real-customer conversations concurrently,
  subject to later performance and safety limits.
- At shift end, the robot stops accepting new work. An in-flight response may
  finish only within the robot's remaining daily time. Existing conversations
  remain attached to that robot profile and wait until it is next eligible;
  they are never silently moved to another profile.

## 4. Large-City Inventory
- Only an administrator-approved large city may receive scheduled robot coverage.
- Each approved large city has at least six active, approved robot profiles:
  at least three marked Man and at least three marked Woman.
- Additional profiles of any gender may be added, but they do not reduce the
  minimum three-Man and three-Woman inventory.
- Robot profile country, state/province, city, and city timezone must match its
  assigned coverage city.
- A city is `InventoryReady` only when all six required profiles are active,
  healthy, approved, and schedulable.

## 5. Daily Work Limit
- One robot profile may work no more than 28,800 seconds, or eight hours, during
  one local business day in its assigned city's timezone.
- Work time starts when the robot becomes customer-visible online and eligible
  to receive or answer chats.
- Offline health checks, model warm-up, and standby readiness do not count as
  work time because the profile is not customer-visible or chat-eligible.
- Active time is accumulated from authoritative online intervals, not from a
  client or robot-reported total.
- At 28,800 seconds the service atomically marks the robot offline, rejects new
  work, and prevents additional outgoing messages until the next local day.
- Changing a robot's city or timezone does not reset or reduce already consumed
  daily time.

## 6. Shift And Coverage Policy
- The scheduler maintains at least one Man robot and one Woman robot online in
  every `CoverageReady` large city at all times.
- An approved city cannot activate customer-facing robot coverage until it is
  `CoverageReady`; active coverage must not operate in `InventoryReady` alone.
- The baseline schedule uses three eight-hour coverage periods per local day:
  `00:00-08:00`, `08:00-16:00`, and `16:00-24:00`.
- Eight hours is always measured as 28,800 elapsed seconds. On a
  daylight-saving transition day, the scheduler adjusts handoffs or adds a
  reserve interval so local clock changes never extend one robot beyond the
  elapsed-time limit or interrupt required coverage.
- Handoffs are atomic: the incoming robot passes health and eligibility checks
  before the outgoing robot is marked offline at the same boundary.
- The scheduler, not an administrator or robot process, selects the active
  profile for each coverage slot.
- The scheduler checks coverage continuously and reconciles it at least once
  per minute.
- A robot cannot be scheduled when inactive, suspended, unhealthy, unapproved,
  outside its city, already at eight hours, or already assigned to an
  overlapping shift.

## 7. Coverage Guarantee And Reserve Capacity
Three robots of one sex multiplied by eight hours supplies exactly 24 hours,
leaving no failure or maintenance reserve. Therefore:
- Six profiles, three Man and three Woman, are the minimum city inventory.
- A city is `CoverageReady` only when it also has an eligible same-sex reserve
  or approved regional overflow capacity for both required coverage groups.
- The recommended production inventory is at least eight profiles per city:
  four Man and four Woman. Six remains valid for prototype testing.
- If primary coverage fails, the scheduler immediately activates an eligible
  same-sex reserve with remaining daily time.
- If no replacement exists, the city enters `CoverageDegraded`, administrators
  receive a critical alert, the gap is audited, and the system must not falsely
  report that required coverage is online.

## 8. Scheduled Tasks
The following system tasks are required:
- `RobotCityShiftPlanner`: creates the next local day's shifts.
- `RobotShiftActivator`: validates and activates the next shift.
- `RobotCoverageMonitor`: verifies Man/Woman online coverage at least each minute.
- `RobotCoverageFailover`: activates a reserve after failure or missed heartbeat.
- `RobotDailyTimeReconciler`: closes intervals and enforces the 28,800-second cap.
- `RobotProfileHealthReview`: removes unhealthy or unapproved profiles from the
  eligible scheduling pool.

Each task uses a distributed lock, idempotent commands, bounded retries, and an
audited failure state.

## 9. Administrator Controls
The Robot Customers admin area provides:
- Create a robot using full-profile or basic-details-plus-auto-fill mode.
- Search and filter by city, sex, profile status, health, current shift, daily
  seconds, and coverage eligibility.
- Open and edit the full robot profile.
- Preview the customer-visible profile before publication.
- Activate, suspend, retire, or restore a robot profile.
- View generated-profile provenance and approval history.
- View city inventory and the next 24 hours of shifts.
- Request shift regeneration or emergency replacement with a required reason.
- Pause one robot or one city's robot coverage.
- View coverage gaps, failed handoffs, daily-limit violations, and audit history.

Manual controls cannot extend a robot beyond eight hours or remove the minimum
coverage requirement without an emergency policy override and full audit.

## 10. Metrics And Alerts
Monitor:
- Online seconds per robot and city-local day
- Planned versus actual shift start/end
- Man and Woman coverage percentage by city
- Coverage gaps and failover latency
- Active conversations and response latency
- Health-check and model failures
- Daily-limit rejection count
- Administrator profile changes

Critical alerts include no eligible Man coverage, no eligible Woman coverage,
daily time exceeding 28,800 seconds, overlapping shifts, and a published robot
without completed approval.

## 11. Launch Gate
Because the customer-facing classification is intentionally hidden, legal,
consumer-protection, payment-provider, and marketplace review of profile
presentation and automated conversation practices is required before
production launch. Approval must be documented; an administrator setting alone
cannot waive this launch gate.
