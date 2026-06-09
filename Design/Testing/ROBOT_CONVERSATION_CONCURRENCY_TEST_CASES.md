# Robot Conversation Concurrency Test Cases

Version: Design Draft 1.0  
Status: Core LocalOnly scenario automated in Arfa 0.4; real-time soak and
failure-injection variants remain Beta work  
Policy sources:
- `Product/ROBOT_CUSTOMER_WORK_POLICY.md`
- `Product/ROBOT_CONVERSATION_AI_SERVICE_POLICY.md`

## RC-001: One Robot Chats With Ten Real Customers For 25 Minutes

### Purpose
Verify that one robot customer can maintain ten independent, context-aware
conversations concurrently for longer than the twenty-minute customer idle
session limit without mixing histories, losing messages, duplicating replies,
overspending credits, or violating robot capacity and work-time rules.

### Required Variants
Run the same scenario in:
1. `LocalOnly` mode using the internal prepared-text and rule engine.
2. `HybridExternalAllowed` mode using a deterministic simulated outside-AI
   adapter in normal automated testing.

A separately approved staging evaluation may use the real outside provider
with synthetic conversations and a hard test budget. The standard automated
suite must not depend on external network availability or incur uncontrolled
provider cost.

### Test Fixture
- One healthy, approved robot customer `R1`
- `R1` is inside an active scheduled shift
- `R1` has zero active conversations before the test
- `R1` has at least 1,800 daily work seconds remaining
- Ten registered real customers: `C01` through `C10`
- Every customer has an authenticated session and 500 credits
- Every customer has a separate conversation with `R1`
- No customer is blocked, suspended, or in an incompatible consent state
- Controlled test duration: 25 minutes
- Message rounds: every two minutes at elapsed minutes
  `0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24`

Thirteen rounds create:
- 130 real-customer messages
- 130 robot replies
- 260 total ChatRecords
- 65 credits consumed by each customer
- 650 total customer credits consumed

### Distinct Conversation Context
Assign a unique topic and memory marker to each customer:

| Customer | Topic | Memory marker |
|---|---|---|
| `C01` | Work | Starts a new nursing shift Monday |
| `C02` | Travel | Wants to visit Kyoto in spring |
| `C03` | Cooking | Is learning to make sourdough |
| `C04` | Sports | Follows the Lakers |
| `C05` | Art | Enjoys watercolor landscapes |
| `C06` | Weather | Likes walking after summer rain |
| `C07` | City living | Prefers late-night cafes |
| `C08` | Countryside | Maintains a small vegetable garden |
| `C09` | Beach | Collects sea glass |
| `C10` | Mountains | Plans an easy hiking trip |

Messages in later rounds refer naturally to the customer's own marker. At
minute 22, each customer asks the robot to recall or continue the earlier
detail without repeating it in the latest message.

### Execution
1. Authenticate all ten customers and create ten distinct conversations with
   `R1`.
2. Confirm `R1` reports ten active conversations and no more.
3. At each scheduled round, release all ten customer sends from a concurrency
   barrier so they reach the service at approximately the same time.
4. Give every send a unique idempotency key containing customer and round.
5. Wait for exactly one robot reply in each corresponding conversation.
6. Validate each reply before starting that customer's next round.
7. Continue through minute 24 and complete final verification after minute 25.

The Arfa CI version runs the thirteen rounds as an accelerated duration
equivalent. A
nightly or release-candidate soak test also runs for at least 25 real elapsed
minutes to detect timer, connection-pool, queue, and resource-leak defects.

### Expected Conversation Results
- Every customer message is followed by exactly one reply from `R1`.
- Replies are committed in order within each conversation.
- Different conversations may be processed concurrently.
- No response contains another customer's memory marker or private context.
- At minute 22, each response correctly uses only that customer's earlier
  marker or gives a safe clarification when the local engine lacks confidence.
- Replies remain relevant to the latest message and prior history.
- No response fabricates offline identity, location, meetings, employment,
  family, or personal history.
- No response pressures the customer to buy credits or send a gift.
- Every response remains within the configured output and 60-word limits.

### Expected Session And Presence Results
- All ten sessions remain authenticated after 25 minutes because each customer
  performs meaningful send actions at intervals below twenty minutes.
- Background robot replies alone are not treated as customer activity.
- Customer presence and conversation unread/read state remain isolated.
- `R1` remains customer-visible online for the test duration unless the test
  intentionally injects a shift or health failure.

### Expected Capacity And Scheduling Results
- `R1` never reports more than ten active real-customer conversations.
- `R1` chats only with the ten real customers.
- No employee seed assignment is created for `R1`.
- The test contributes approximately 1,500 customer-visible online seconds,
  measured authoritatively rather than from the client.
- `R1` remains below the 28,800-second daily limit.
- Shift, policy, or health ineligibility prevents a new reply from committing.

### Expected Credit And Data Results
- Each accepted customer message consumes exactly five credits.
- Every customer ends with 435 credits when starting from 500.
- Robot replies do not deduct a second customer message charge.
- Exactly 130 debit ledger rows link to the 130 accepted customer messages.
- Retry of any idempotency key returns the original result and creates no
  duplicate ChatRecord or credit deduction.
- Database conversation, sender, receiver, and robot identifiers remain correct
  for all 260 ChatRecords.

### Expected AI-Mode Results
In `LocalOnly`:
- No outside-provider request or `RobotAIUsage` provider-attempt row exists.
- All replies use approved local response sources.

In simulated `HybridExternalAllowed`:
- Every provider request contains only one customer's bounded context.
- Provider calls may execute concurrently across conversations but remain
  sequential within one conversation.
- Token and cost records match the simulated provider usage.
- If all 130 rounds used the normal 2,000-input/120-output cap, the estimated
  maximum model cost is approximately `$0.128960` at the June 9, 2026 pricing
  snapshot.
- Local answers reduce the actual estimated cost below that maximum.

### Failure Injections
During additional runs, inject one condition at minute 12:
- Duplicate delivery of one customer message
- Delayed reply that returns after that conversation's next version
- Outside-provider timeout for three conversations
- Disable outside AI while calls are in flight
- Robot heartbeat failure
- Database transient error before reply commit

Expected:
- Duplicate input creates no duplicate charge or reply.
- Stale results are discarded.
- Provider timeout or global disable uses local fallback or escalation.
- In-flight outside results from an inactive policy version are not sent.
- Robot failure follows shift failover rules without transferring a
  conversation to a different customer-facing robot profile.
- Retried database work commits once or fails without partial records.

### Measurements
Capture:
- Per-round send-to-reply latency
- Queue wait and processing duration
- Maximum simultaneous response jobs
- Reply success, fallback, escalation, and rejection counts
- Duplicate and stale-result counts
- Token use and estimated cost by mode
- Database connection and lock wait
- Memory and CPU before, during, and after the soak
- Customer and robot online seconds

### Acceptance Criteria
- All 130 customer messages and 130 robot replies reconcile.
- Zero lost, duplicate, crossed, or out-of-order committed replies.
- Zero cross-customer context leakage.
- Ten of ten customer sessions remain valid through the final round.
- Credit and ledger totals reconcile exactly.
- Robot capacity and daily work-time limits remain valid.
- `LocalOnly` creates zero outside calls.
- Hybrid failures produce controlled fallback without corrupting conversation
  or financial state.
- The real-time 25-minute soak shows no sustained resource leak or worsening
  latency trend.
