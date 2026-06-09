# DatingEasy888 Policy Maintenance UI

Status: design draft for Administrator Manual review  
Audience: administrators maintaining product and operating rules  
Platform: large desktop only

## 1. Purpose
Policy Maintenance lets an administrator change controlled business rules
without editing source code or deploying a new application version.

An administrator can:
- Find the current rule
- Understand where it is used
- Edit through typed controls
- Validate the proposed values
- Compare before and after
- Publish immediately or schedule activation
- Monitor propagation
- Retire, disable, or roll back a rule
- Review complete version and audit history

Policy Maintenance cannot:
- Store passwords, keys, tokens, or connection strings
- Execute scripts or arbitrary code
- Rewrite completed transactions or audit history
- Approve or release outgoing company payments

## 2. Navigation
Admin navigation includes `Policies` between `Security Center` and
`Scheduled Tasks`.

Policy subviews:
1. `Catalog`
2. `Drafts`
3. `Scheduled`
4. `History`
5. `Propagation`

Header indicators show:
- Draft count
- Activations due today
- Validation failures
- Propagation failures
- Emergency-disabled features

## 3. Catalog Screen
The Catalog is a dense, searchable table.

Columns:
- Policy name
- Category
- Current value summary
- Scope
- Active version
- Effective since
- Scheduled change
- Health
- Last changed by

Filters:
- Category
- Active, scheduled, retired, or emergency-disabled
- Customer-visible change
- Service or job
- Changed date
- Changed by

Selecting a row opens the policy editor without losing table position or
filters.

## 4. Policy Editor
The editor uses four stable regions.

### Left: Catalog Navigation
- Category tree
- Search
- Favorite/recent policies
- Unsaved-draft indicator

### Center: Typed Editor
Controls depend on the policy schema:
- Toggle for enabled/disabled
- Numeric input or stepper for counts and credits
- Duration input for minutes, hours, or days
- Select menu for finite choices
- Date/time control for effective time
- Multi-select for country, role, or feature scope
- Structured table editor for credit packages and gift catalog

Raw JSON is not the primary editor. A read-only or validated structured preview
may be available for advanced review.

### Right: Impact Panel
Shows:
- Customer, employee, admin, or robot impact
- Affected UI screens
- Affected API commands and scheduled jobs
- Current active sessions or transactions affected
- Customer-notice requirement
- Validation errors and warnings
- Estimated affected account count when available

### Bottom: Comparison And History
Tabs:
- `Changes`: old value, new value, and semantic explanation
- `History`: version timeline
- `Audit`: actor, reason, request, and result
- `Propagation`: version reported by each service

## 5. V1 Policy Catalog

### Customer
- Minimum age: fixed at 18 and not reducible
- Customer inactivity timeout: 20 minutes
- Registration reward: 50 credits
- Presence and reconciliation timing
- Visitors and notification availability

### Messaging And Media
- Text cost: 5 credits
- Maximum text length: 60 words
- Picture/voice cost: 10 credits
- Processed picture maximum: 100 x 100 pixels
- Processed picture formats: fixed to JPG or PNG and not removable
- Automatic source-image conversion enabled
- Voice duration, codec, and processed byte limit
- Request availability, cooldowns, and rate limits

### Credits And Gifts
- Credit packages
- Above-$100 purchase formula
- Gift catalog and costs
- Recipient/platform allocation
- Spending warning and cooling-off thresholds
- Gift non-refundability is fixed and cannot be disabled
- Seed gift allocation to the overseeing employee is versioned and auditable

### Employee And Seed Operations
- Employee inactivity timeout: 10 minutes
- Maximum assigned seeds
- Active seeds per employee
- Simultaneous chat limit
- Seed daily online-time limit
- Assignment lease and handoff timing

### AI, Robot, And Prepared Text
- Robot enabled/disabled by task type
- Human-approval requirement
- Allowed prepared-text categories
- Confidence and transfer thresholds
- Emergency robot stop

### Safety And Operations
- Rate limits
- Upload and malware-processing limits
- Moderation queue priorities
- Scheduled-report timezone
- Feature flags and rollout percentage

Some policy values have non-configurable safety floors. For example, an
administrator cannot lower the minimum age below 18 or configure policy to
bypass consent, blocks, audit, gift non-refundability, seed gift attribution,
or CEO payment approval.

## 6. Create Or Edit Draft
1. Select a policy.
2. Select `Create Draft`.
3. Edit values.
4. Enter a required reason.
5. Save the draft.
6. Select `Validate`.

Draft autosave is permitted, but publication always requires an explicit
command. Leaving with unsaved changes shows a warning.

## 7. Validation
Validation checks:
- Data type and allowed values
- Safe minimum and maximum
- Cross-policy compatibility
- Effective-time conflicts
- Required customer notice
- Service support for the proposed value
- Current transactions or assignments crossing activation time
- Prohibited secrets or executable content

Errors block publication. Warnings require acknowledgement.

Examples:
- Customer timeout cannot be zero.
- Employee active-chat limit cannot exceed workspace capacity.
- Picture dimensions cannot exceed the approved media-processing boundary.
- Gift allocation cannot create more credits than the sender spends.
- Gift policy cannot enable refund or reversal after successful send.
- Minimum age cannot be lower than 18.

## 8. Publish Or Schedule
The publish drawer shows:
- Policy and scope
- Current and proposed version
- Before/after values
- Reason
- Effective time
- Customer notice
- Warnings

Actions:
- `Publish Now`
- `Schedule`
- `Return To Draft`

An administrator can publish without another ordinary approval. Publication is
blocked only by validation or a confirmed special authority boundary. Policy
configuration cannot perform CEO outgoing-payment approval.

## 9. Activation And Propagation
At effective time:
1. The new version becomes active atomically for its scope.
2. The former version becomes superseded.
3. Services refresh or receive the new version.
4. Each consumer reports its loaded version.
5. The UI shows Healthy, Pending, or Failed propagation.

A propagation failure raises an Admin Dashboard and Security Center alert.

## 10. Rollback
1. Open History.
2. Select a known version.
3. Select `Roll Back To These Values`.
4. Review the comparison.
5. Enter a reason.
6. Publish now or schedule.

Rollback creates a new immutable version. It never deletes the failed version or
changes records already completed under it.

## 11. Emergency Disable
Only predefined kill-switch policies display an emergency-disable control.

The confirmation shows the affected feature and active workload. Activation is
immediate and:
- Requires a reason
- Creates an audit record
- Creates a security alert
- Stops new affected work
- Preserves or reconciles in-progress work
- Requires follow-up review

## 12. UI States
Required states:
- Loading
- Empty catalog
- No search results
- Draft saved
- Unsaved changes
- Validation failed
- Validation passed with warnings
- Scheduled
- Activating
- Active and healthy
- Propagation delayed
- Propagation failed
- Rolled back
- Emergency disabled

## 13. Audit Requirements
Every sensitive policy action records:
- Policy key and scope
- Draft and published version IDs
- Actor
- Before and after values
- Reason
- Effective time
- Validation results and acknowledged warnings
- Request/correlation ID
- Result and propagation state

Normal administrators cannot edit or delete this history.
