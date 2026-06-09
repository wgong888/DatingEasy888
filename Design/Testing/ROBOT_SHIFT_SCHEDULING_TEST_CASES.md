# Robot Customer Shift Scheduling Test Cases

Version: Design Draft 1.0  
Status: Normal scheduling, active coverage, eight-hour windows, admin
regeneration, and same-sex reserve failover automated in Arfa 0.4; boundary,
DST, heartbeat, and distributed-lock variants remain Beta work  
Policy source: `Product/ROBOT_CUSTOMER_WORK_POLICY.md`

## 1. Purpose
Verify that the system schedules robot customers in shifts while:
- Keeping at least one Man and one Woman robot online in every
  `CoverageReady` large city
- Limiting each robot to 28,800 customer-visible online seconds per city-local
  business day
- Selecting only healthy, approved, active, city-eligible robot profiles
- Performing atomic handoffs and automatic same-sex failover
- Producing accurate schedule, activity, alert, and audit records

## 2. Standard Test Fixture
Unless a case states otherwise, use:

City:
- Country: United States
- State: California
- City: Los Angeles
- Timezone: `America/Los_Angeles`
- Coverage status: `CoverageReady`
- Required online: one Man and one Woman

Eligible robot profiles:

| Robot | Sex | Role |
|---|---|---|
| `M1` | Man | Shift 1 primary |
| `M2` | Man | Shift 2 primary |
| `M3` | Man | Shift 3 primary |
| `M4` | Man | Reserve |
| `W1` | Woman | Shift 1 primary |
| `W2` | Woman | Shift 2 primary |
| `W3` | Woman | Shift 3 primary |
| `W4` | Woman | Reserve |

All eight profiles initially have:
- `CustomerProfile.Seed = 2`
- Active, approved, healthy, and schedulable status
- Los Angeles profile location and timezone
- Zero online seconds for the test business date
- No overlapping shift or city assignment

Baseline local schedule:

| Local period | Man | Woman |
|---|---|---|
| `00:00-08:00` | `M1` | `W1` |
| `08:00-16:00` | `M2` | `W2` |
| `16:00-24:00` | `M3` | `W3` |

`M4` and `W4` remain healthy standby profiles and are not customer-visible
unless failover is required.

## 3. Test Cases

### RS-001: Generate A Normal Daily Schedule
Preconditions:
- Standard fixture is loaded before the planning cutoff.
- No schedule exists for the next city-local business date.

Steps:
1. Run `RobotCityShiftPlanner`.
2. Read the next day's `RobotShiftSchedule` rows.
3. Run the planner again with the same task identity.

Expected:
- Six primary rows are created: three Man shifts and three Woman shifts.
- Together, each sex covers the full local day.
- `M4` and `W4` remain eligible reserves without primary overlap.
- No robot is planned for more than 28,800 elapsed seconds.
- Every row contains the city, business date, sex snapshot, planned UTC times,
  local-time interpretation, and scheduled-task run reference.
- The second run creates no duplicate or conflicting shifts.
- The city remains `CoverageReady`.

### RS-002: Activate The First Shift
Preconditions:
- RS-001 schedule exists.
- `M1` and `W1` pass health and eligibility checks.

Steps:
1. Advance the controlled clock to local `00:00`.
2. Run `RobotShiftActivator`.
3. Query city coverage and robot activity.

Expected:
- `M1` and `W1` become customer-visible online and chat-eligible.
- Their shifts become `Active` with authoritative actual start times.
- Exactly one Man and one Woman primary are online.
- Reserves remain offline and accumulate no online seconds.
- The customer API exposes normal profiles and presence but not robot
  classification.
- The admin API displays the internal robot, shift, and coverage details.

### RS-003: Perform An Atomic Scheduled Handoff
Preconditions:
- `M1` and `W1` are active through the first period.
- `M2` and `W2` are healthy and eligible.

Steps:
1. Advance the controlled clock to the `08:00` boundary.
2. Run `RobotShiftActivator`.
3. Observe status changes and coverage events at the boundary.

Expected:
- `M2` and `W2` pass validation before `M1` and `W1` are taken offline.
- There is no sampled interval with zero online Man or zero online Woman.
- Outgoing shifts become `Completed`; incoming shifts become `Active`.
- `M1` and `W1` each record no more than 28,800 online seconds.
- New chats route only to `M2` and `W2` after the handoff.
- Existing conversations remain attached to `M1` or `W1` and are not silently
  reassigned to the new profiles.
- One audited handoff event exists for each coverage group.

### RS-004: Reject An Ineligible Incoming Primary And Use Reserve
Preconditions:
- `M1` and `W1` are active.
- Before `08:00`, mark `M2` unhealthy.
- `M4` remains healthy with sufficient daily time.

Steps:
1. Advance to the `08:00` boundary.
2. Run shift activation and failover.

Expected:
- `M2` is not activated.
- `M4` is atomically activated as the replacement Man.
- `W2` starts normally.
- `M4`'s row has `IsReserve = 1` and references the replaced `M2` shift.
- `M2` records a failed or replaced state and a health failure code.
- Man and Woman coverage remains uninterrupted.
- The replacement and reason are visible to admins and recorded in audit.

### RS-005: Recover From A Mid-Shift Heartbeat Failure
Preconditions:
- `M2` and `W2` are active during `08:00-16:00`.
- `M4` and `W4` are eligible reserves.

Steps:
1. Stop `W2` heartbeats at local `11:15`.
2. Allow the approved missed-heartbeat threshold to expire.
3. Run `RobotCoverageMonitor` and `RobotCoverageFailover`.

Expected:
- `W2` becomes unhealthy and stops accepting or sending new work.
- `W4` becomes online within the configured failover service target.
- Woman coverage is restored without extending `W2`'s time.
- `W2`'s actual online interval closes at the authoritative failure time.
- `W4` accumulates only its actual customer-visible replacement time.
- The failure, detection time, failover latency, replacement, and task run are
  audited.

### RS-006: Enter Degraded State When No Replacement Exists
Preconditions:
- The active Woman robot fails.
- No healthy Woman reserve or approved regional overflow is available.

Steps:
1. Run coverage monitoring and failover.
2. Query city coverage and active alerts.

Expected:
- The system does not substitute a Man robot for required Woman coverage.
- The city changes to `CoverageDegraded`.
- A critical no-Woman-coverage alert is created once and remains open.
- Coverage metrics show the real gap rather than a healthy result.
- Retry attempts are bounded, idempotent, and audited.
- Man coverage continues if its robot remains healthy.

### RS-007: Enforce The Eight-Hour Daily Limit
Preconditions:
- A robot has accumulated 28,799 online seconds for the city-local date.

Steps:
1. Keep the robot online for one additional second.
2. Attempt to keep the robot online and send another response.
3. Run `RobotDailyTimeReconciler`.

Expected:
- The activity total reaches exactly 28,800 seconds and never exceeds it.
- The robot is atomically made offline and ineligible for additional work.
- The outgoing response after the limit is rejected.
- The scheduler activates an eligible same-sex replacement when coverage
  requires one.
- Admin manual controls cannot extend the exhausted robot.
- A daily-limit enforcement event is audited.

### RS-008: Prevent Overlap And Double Activation
Preconditions:
- Two scheduler instances attempt to activate the same shift concurrently.

Steps:
1. Start both activator runs at the same boundary.
2. Retry both commands using their original idempotency identities.

Expected:
- Distributed locking or equivalent concurrency control permits one effective
  activation.
- One active shift and one online interval exist for the robot.
- No duplicate activity seconds, alerts, or audit business events are created.
- The losing or replayed command returns the existing result safely.

### RS-009: Reject Invalid Schedule Candidates
Run the planner separately with a candidate that is:
- Inactive
- Suspended
- Unhealthy
- Unapproved
- Assigned to another city
- Already scheduled for an overlapping shift
- Already at the daily limit
- Not a robot customer (`Seed != 2`)

Expected for every variation:
- The candidate is not scheduled or activated.
- Another eligible same-sex robot is selected when available.
- Otherwise the plan fails validation and the city cannot be marked
  `CoverageReady`.
- The rejection reason is structured and auditable.

### RS-010: Six Profiles Without Reserve Cannot Start Coverage
Preconditions:
- The city has exactly three healthy Man and three healthy Woman robots.
- No regional overflow is approved.

Steps:
1. Run inventory and coverage-readiness evaluation.
2. Attempt to activate customer-facing city coverage.

Expected:
- The city may become `InventoryReady`.
- The city does not become `CoverageReady`.
- Live robot coverage is not activated.
- Admin UI explains that same-sex reserve or approved overflow is missing.
- Adding one eligible reserve for only one sex is still insufficient.
- Adding eligible reserve capacity for both required groups permits
  `CoverageReady`.

### RS-011: Preserve Conversations At Shift End
Preconditions:
- `M1` has an active conversation with real customer `R1`.
- The `08:00` handoff is due.

Steps:
1. Start one response just before the boundary.
2. Complete the handoff.
3. Have `R1` send another message after `M1` is offline.

Expected:
- The in-flight response may finish only if it completes within `M1`'s
  remaining daily time.
- `M1` accepts no new conversation work after shift end.
- The conversation remains associated with `M1`; it is not moved to `M2` or a
  reserve profile.
- `R1`'s new message remains queued for `M1` until `M1` is next eligible.
- No duplicate robot response is produced.

### RS-012: Reconcile A Missed Activation
Preconditions:
- The scheduler service is unavailable across one planned boundary.
- The next `RobotCoverageMonitor` run starts after service recovery.

Steps:
1. Restore the scheduler.
2. Run coverage monitoring and activation reconciliation.

Expected:
- The system detects the missing required Man or Woman coverage.
- It activates the currently eligible planned robot or same-sex reserve.
- Actual start time reflects recovery time, not the missed planned time.
- No offline interval is counted as robot work.
- The coverage gap and recovery latency are recorded and alerted.

### RS-013: Regenerate Future Shifts Safely
Preconditions:
- Current shifts are active and future shifts are planned.

Steps:
1. An admin requests regeneration with a reason.
2. Repeat the same request.

Expected:
- Active and completed shifts are not rewritten.
- Only eligible future shifts are replaced.
- Daily limits, sex coverage, reserve readiness, and non-overlap are rechecked.
- Replaying the request does not regenerate twice.
- Before/after schedules, admin identity, reason, and version are audited.

### RS-014: Pause And Resume City Coverage
Preconditions:
- A city is `CoverageReady` with active Man and Woman robots.

Steps:
1. An authorized admin pauses city robot coverage with a reason.
2. Attempt an automatic restart without admin resume.
3. Resume coverage through the authorized command.

Expected:
- Active robots stop taking new work and close online intervals safely.
- Coverage status becomes `Paused`, not `CoverageDegraded`.
- Monitoring does not restart coverage while the intentional pause remains.
- Resume revalidates inventory, reserves, health, daily time, and schedule.
- Coverage restarts only if the city can return to `CoverageReady`.
- Pause and resume actions are audited.

### RS-015: Reset Eligibility At City-Local Midnight
Preconditions:
- A robot reached 28,800 seconds on the prior city-local date.

Steps:
1. Advance the controlled clock across local midnight.
2. Run daily reconciliation and next-shift activation.

Expected:
- The prior `RobotDailyActivity` row remains closed and immutable except for
  controlled reconciliation.
- A new business-date row begins at zero seconds.
- The robot becomes eligible only if it passes all other checks.
- A timezone or city edit cannot retroactively reset the prior day's total.

### RS-016: Handle Daylight-Saving Time Changes
Run once for the Los Angeles spring-forward date and once for the fall-back
date.

Expected:
- Coverage remains continuous in real elapsed time.
- No robot exceeds 28,800 elapsed online seconds.
- Repeated or skipped local clock times do not create duplicate or missing
  schedule rows.
- On a 25-hour fall-back day, the scheduler introduces an additional handoff
  or reserve interval instead of keeping one robot online for nine elapsed
  hours.
- On a 23-hour spring-forward day, actual online seconds reflect 23 hours of
  city coverage rather than fabricating an extra hour.
- UTC timestamps, city-local business date, offset, and timezone version allow
  the schedule to be reconstructed during audit.

### RS-017: Schedule Multiple Cities Independently
Preconditions:
- Los Angeles and New York are both `CoverageReady`.
- Each city has its own eligible inventory and timezone.

Steps:
1. Generate and activate schedules for both cities.
2. Fail one Los Angeles robot.

Expected:
- Each city follows its own local business date and shift boundaries.
- A robot is never assigned to both cities.
- Los Angeles failover does not modify New York schedules or activity.
- Coverage, alerts, and metrics are partitioned by city.
- Regional overflow is used only when explicitly approved and eligible.

## 4. Required Automated Test Layers
- Unit tests: eligibility, daily-limit, readiness, selection, and local-time
  calculations
- SQL Server integration tests: unique schedules, non-overlap, activity
  concurrency, task locks, and transactional handoff
- Scheduled-task tests: planner, activator, monitor, failover, reconciler, and
  health-review idempotency
- API tests: city coverage, shifts, regeneration, replacement, daily activity,
  role authorization, and hidden customer classification
- Admin end-to-end tests: view schedule, inspect failure, regenerate future
  shifts, pause/resume, and verify audit
- Clock-controlled tests: boundaries, midnight, missed activation, and
  daylight-saving transitions

## 5. Timing Values Required Before Automation
The policy behavior is fixed, but these environment-specific values must be
configured and approved before the timing assertions become executable:
- Planner cutoff and how far ahead schedules are generated
- Robot heartbeat interval
- Number or duration of missed heartbeats that marks a robot unhealthy
- Maximum failover service target
- Task retry count, retry delay, and distributed-lock timeout
- Coverage alert deduplication and escalation intervals

Tests use configuration values rather than hard-coded production timing, while
still requiring coverage monitoring at least once per minute.

## 6. Release Acceptance
Robot shift scheduling passes only when:
- All applicable cases above pass repeatedly without timing flakiness.
- No test permits a robot to exceed 28,800 online seconds.
- No healthy `CoverageReady` test city has an unexplained Man or Woman gap.
- Every simulated gap is accurately measured, alerted, and audited.
- Task retries create no duplicate shifts, intervals, replacements, or alerts.
- Customer-facing responses never expose internal robot classification.
