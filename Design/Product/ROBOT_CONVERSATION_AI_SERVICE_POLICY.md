# Robot Conversation AI Service Policy

Version: Design Draft 1.0  
Status: Approved product direction; implementation pending  
Scope: autonomous robot customers stored as `CustomerProfile.Seed = 2`

## 1. Service Choice
The initial outside language service is the OpenAI API using the pinned
`gpt-4.1-mini-2025-04-14` model snapshot.

Reasons:
- Strong instruction following and natural English understanding
- Adequate quality for short conversational intent, mood, and response drafting
- Low latency and substantially lower cost than flagship models
- Structured JSON output support for controlled response decisions
- Simple HTTPS integration from the planned ASP.NET Core Web Service

DatingEasy888 may run on Azure while calling the OpenAI API. The model provider
is hidden behind an internal interface so Azure OpenAI or another approved
provider can replace it later without changing robot conversation rules.

Provider approval is required before production use, especially for an adult
social product and intimate-topic conversations. The system must not assume
that every topic is accepted by the outside provider.

## 2. Global Administrator Mode
The administrator controls one global versioned policy:

| Value | Meaning |
|---|---|
| `LocalOnly` | No robot may call an outside AI provider |
| `HybridExternalAllowed` | Every eligible robot may use the approved outside service |

Rules:
- The policy applies to all robot customers; there is no hidden per-robot
  external-AI override.
- Enabling outside AI does not require every message to call the provider.
  Simple greetings and high-confidence prepared responses may stay local.
- Disabling outside AI prevents every new provider call immediately.
- A provider result is sent only if the same enabled policy version remains
  active when the result returns. Otherwise the result is discarded.
- Provider timeout, rejection, outage, budget exhaustion, or safety failure
  automatically uses the local engine or human escalation.
- Changing mode requires administrator reauthentication, reason, confirmation,
  policy versioning, propagation verification, and audit.
- Provider API keys remain in the managed secret vault and never appear in the
  Policy Maintenance UI or database policy values.

The initial Arfa and Beta default is `LocalOnly` until provider, legal,
privacy, safety, and cost reviews approve external use.

## 3. Internal Robot Engine
`LocalOnly` does not mean random replies. The Web Service supplies an internal
conversation engine that:
- Detects basic topic, mood, question type, greeting, stop request, and consent state
- Reads the current robot/customer conversation history
- Ranks approved prepared text by category, language, profile, and context
- Inserts approved profile facts and safe conversational variables
- Rejects repeated, irrelevant, manipulative, or policy-ineligible answers
- Uses a clarification response when confidence is low
- Escalates defined safety, legal, payment, exploitation, and crisis topics

The local engine is deterministic and inexpensive but less capable than the
outside model. It must never pretend to understand a complex message when it
does not.

## 4. Hybrid Routing
When `HybridExternalAllowed` is active:
1. The local engine first classifies the message.
2. A high-confidence prepared response may be sent locally.
3. Ambiguous, emotional, multi-topic, or context-dependent messages may call
   the outside service.
4. The outside service returns structured intent, mood, confidence, response
   mode, candidate response, and escalation flag.
5. DatingEasy888 validates the response locally before saving or sending it.

The outside model recommends language; it does not control credits, gifts,
customer state, shifts, assignments, policy, or database commands.

## 5. Bounded Context
One outside request contains only:
- Approved robot profile facts and conversational style
- Current real-customer message
- Bounded recent history for this exact conversation
- A short older-history summary
- Current consent, block, safety, and topic state
- A small set of relevant approved prepared-text candidates
- Current robot response rules

It excludes:
- Another customer's messages or profile
- Email, phone, account credentials, payment data, or government identifiers
- Employee or administrator private information
- Full unbounded chat history
- Secrets, system credentials, or internal security configuration

Obvious unnecessary personal data is redacted before transmission. Provider
retention and training settings must satisfy the approved privacy agreement.

## 6. Initial Token And Reply Limits
Initial normal budget per outside call:
- Maximum input target: 2,000 tokens
- Maximum output: 120 tokens
- Customer-visible reply: no more than the product's 60-word message limit

The context builder summarizes or drops older material before exceeding the
input target. It never silently includes unrelated conversation history.

## 7. Estimated Cost Per Chat Round
A chat round means one real-customer message followed by one robot reply.
Customer platform-credit consumption is separate from the company's AI cost.

Pricing snapshot on June 9, 2026 for GPT-4.1 mini:
- Input: `$0.40` per 1 million tokens
- Cached input: `$0.10` per 1 million tokens
- Output: `$1.60` per 1 million tokens

Estimated uncached costs:

| Round size | Input | Output | Estimated cost |
|---|---:|---:|---:|
| Lean | 1,000 tokens | 80 tokens | `$0.000528` |
| Normal cap | 2,000 tokens | 120 tokens | `$0.000992` |
| Heavy exception | 4,000 tokens | 150 tokens | `$0.001840` |

At the normal cap:
- 1,000 outside-assisted rounds cost about `$0.99`
- 10,000 rounds cost about `$9.92`
- 100,000 rounds cost about `$99.20`

These estimates exclude network, storage, monitoring, taxes, and any provider
price change. Local-only and locally answered hybrid rounds have no outside
model-token cost.

Pricing source:
`https://openai.com/api/pricing/`

## 8. Budget Controls
Administrators maintain:
- Daily outside-AI budget
- Monthly outside-AI budget
- Per-call input and output limits
- Timeout and retry limits
- Allowed provider and pinned model
- External-call percentage warning thresholds

When a budget is exhausted:
- No new outside calls begin.
- Robots continue in `LocalOnly` behavior.
- Admins receive an alert.
- The system never interrupts an accepted customer message or charges the
  customer differently because outside AI was unavailable.

## 9. Concurrency And Ordering
- Each robot may serve up to ten real-customer conversations concurrently.
- Each conversation has its own ordered work queue and context.
- Only one response job for a conversation may commit at a time.
- Different conversations may run concurrently.
- Every job carries conversation version, incoming ChatRecordId, robot ID,
  active policy version, shift eligibility, and idempotency key.
- A stale, duplicated, out-of-order, wrong-customer, or post-shift result is
  discarded.

## 10. Validation Before Send
Every local or outside-assisted response must pass:
- Robot-to-real conversation eligibility
- Active shift, eight-hour daily limit, and ten-chat capacity
- Conversation ownership and version check
- Relevance to the latest message and history
- Approved robot-profile consistency
- Consent, stop, block, safety, and adult-topic rules
- No fabricated offline identity, meeting, location, employment, family, or
  personal-history claim
- No pressure to buy credits or gifts
- No unnecessary fragmentation into multiple paid messages
- Repetition, length, and prepared-text-version checks

Low-confidence or rejected responses use a safe clarification, local fallback,
or human escalation according to topic.

## 11. Usage Record
Every outside attempt records:
- Provider and pinned model
- Robot, conversation, and incoming message identifiers
- Policy version and response source
- Input, cached-input, and output token counts
- Estimated cost and currency
- Latency, result status, and error category
- Safety and local-validation outcome
- Create time and correlation ID

Raw secrets are never logged. Full prompts and provider responses are not placed
in general application logs.

