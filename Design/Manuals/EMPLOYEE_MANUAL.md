# DatingEasy888 Employee Manual

Version: Design Draft 1.5  
Audience: Human employees operating internally classified seed profiles  
Status: Pre-release training manual. Final role permissions and escalation procedures remain subject to approval.

## How To Read This Draft
- `Confirmed` rules must be followed.
- `Recommended` workflows are the proposed operating design.
- `Pending` items require approval before training or production use.

Use this manual with `Product/PRODUCT_OPERATING_MODEL.md`, the prepared-text
policy, and final safety playbooks. When documents conflict, follow the stricter
current safety rule and report the conflict.

## 1. Employee Role
Employees provide safe, enjoyable conversations through approved,
company-operated seed profiles.

Your purpose is to:
- Help customers feel heard and respected
- Provide warmth, appropriate romance, mood support, relaxation, happiness, fun, and humor
- Keep conversations natural and relevant
- Follow consent, safety, privacy, and credit rules
- Escalate situations that require specialized review

Your purpose is not to fabricate offline identity or pressure customers to spend.

## 2. Core Rules
Always:
- Operate only assigned virtual profiles and conversations.
- Keep internal customer classifications confidential in the customer UI.
- Read recent context before responding.
- Respect the customer's mood, consent, topic, and wish to stop.
- Use approved prepared text and AI assistance responsibly.
- Protect customer information.
- Record and escalate safety concerns.

Never:
- Make explicit false claims about offline identity, physical presence, exact
  location, or real-world availability.
- Promise an offline meeting, marriage, relocation, or exclusive relationship.
- Invent real employment, family, travel, location, or personal experiences.
- Ask a customer to prove love by buying credits or gifts.
- Use guilt, jealousy, fear, abandonment, or false urgency.
- Split a useful answer into unnecessary paid messages.
- Browse conversations outside your assignment.
- Share customer data outside approved systems.

## 3. Access And Security
1. Use only your individual company account.
2. Enter your password.
3. Receive a one-time verification code through your verified work email or verified mobile-phone text message.
4. Enter the code before it expires to complete sign-in.
5. Work only on an approved device and network.
6. Never share your password, verification code, or session.
7. Lock the workstation whenever you step away.
8. Report suspicious login prompts, unexpected codes, or account activity immediately.

At least one verified employee channel is required. When both are enrolled, the
employee may choose email or text. Codes are short-lived, single-use,
rate-limited, and never written to application logs. A code request that the
employee did not initiate may indicate an attempted account takeover.

You may access only assigned conversations and the minimum customer context necessary for work. All sensitive access and actions may be audited.

Robot identities do not use human accounts. Never allow automation to operate through your personal login.

After password and verification-code login succeeds, the employee may
immediately perform all normal work allowed by the employee role and current
assignments. No manager or administrator approval is required to begin work.

### Session And Automatic Logout
- Log out before leaving the workstation, ending the shift, going offline, or allowing another person to use the device.
- The system warns the employee shortly before an inactivity logout.
- Ten consecutive minutes without employee interaction automatically logs out the employee.
- Background polling, incoming messages, timers, automated refresh, and an open browser tab do not count as employee interaction.
- Meaningful keyboard, pointer, touch, or approved workspace action resets the inactivity timer.
- Automatic logout blocks sending, preserves eligible drafts, releases or transfers active assignment leases, and records the logout reason.
- Returning after automatic logout requires password and email/text verification again.

## 4. Start Of Shift
1. Sign in to the Employee Backend with your password and email/text verification code.
2. Review security, policy, and service notices.
3. Confirm that your status is `Available`.
4. Check assigned seed profiles and active workload.
5. Review unresolved transfers or safety escalations.
6. Confirm chat, alert, and connection status.
7. Begin accepting system-approved assignments.

Successful sign-in is sufficient authorization to start normal assigned work.
Do not wait for separate supervisor approval.

Do not begin work if:
- Your account or device may be compromised.
- Internal seed classification or profile-integrity controls are unavailable.
- Credit pricing is not displayed correctly.
- The workspace shows another employee's unauthorized assignment.
- Required safety or consent controls are unavailable.

Pause work and report the problem.

## 5. Employee Workspace
An employee represents all seed customers currently assigned to that employee.
The employee never chats under the employee's own identity. For each work
assignment, the selected seed profile is the customer-facing sender and the
employee is the audited internal operator.

Robot customers (`CustomerProfile.Seed = 2`) are not employee assignments.
They answer real customers through the autonomous robot-customer service and
must never appear in the employee seed queue.

The large-desktop workspace is divided vertically into four panels:
- `Panel A` (10%): up to 20 currently active seed profiles. Select one seed
  identity to represent. A green dot beside the seed portrait means at least
  one real customer is waiting for a response.
- `Panel B` (15%): real customers who have a current request or conversation
  history with the selected seed. The most recently active conversation is at
  the top. Select one real customer.
- `Panel C` (60%): the main conversation history and response composer for the
  selected seed/customer pair. It contains no gift panel and employees cannot
  send gifts.
- `Panel D` (15%): prepared text organized as category folders and answer
  files. Selecting an answer inserts it into Panel C's composer.

Panel C should show:
- Seed identity
- Real customer identity
- Internal profile classification and integrity status
- Conversation and consent state
- Unread or waiting status
- Seed elapsed time and remaining daily time
- Credit context
- Safety alerts
- Assignment and connection state
- The chat history between the selected seed and the selected real customer
- A composer that clearly states which seed will send the response
- No gift controls

The employee may send inserted prepared text unchanged or edit it before
sending. Changing Panel A refreshes Panel B and Panel C; changing Panel B
refreshes Panel C while preserving other conversation drafts where permitted.

The system limits:
- Up to 1,000 assigned seed profiles per employee
- Up to 20 active seed profiles at one time
- Up to 10 simultaneous real-customer conversations
- Up to two hours of online activity per seed profile per day

Do not bypass capacity or time limits.

### Recommended Screen Map
- `Work Queue`: assigned, waiting, transferred, and paused conversations
- `Live Workspace`: four-panel seed, customer, main-chat, and prepared-text desk
- `Conversation Context`: recent messages, mood, consent, profile integrity,
  and notes
- `Response Tools`: prepared text, AI suggestions, approved facts, and drafts
- `Safety`: report, pause, transfer, and emergency guidance
- `Shift`: availability, connection health, notices, and handoff status

Customer payment details, full account history, unrelated conversations, and
administrator controls do not belong in the employee workspace.

Employee lists and history results show at most 20 records per page. Use `Next`
to retrieve the next 20 when available.

### Assignment States
- `Offered`: waiting for the employee to accept.
- `Active`: the employee holds the current lease and may send.
- `Paused`: sending is temporarily disabled while a condition is checked.
- `Transfer pending`: ownership is moving; do not create a second reply.
- `Transferred`: another authorized worker owns the conversation.
- `Closed`: no further work is expected unless reopened by the system.
- `Expired`: the lease or seed daily time ended; sending is prohibited.

## 6. Accepting An Assignment
1. Open the system-assigned conversation.
2. Confirm the seed and customer identities.
3. Confirm that the customer-facing profile is complete and active.
4. Review recent messages, mood, consent, and safety state.
5. Check remaining seed online time.
6. Accept the assignment.
7. Respond within the service target without sacrificing relevance or safety.

A seed profile and a real-customer conversation may have only one active worker at a time.

## 7. Writing A Good Response
A response begins with the real customer's latest message and the preceding
seed/customer history. The employee reads that context, then replies as the
assigned seed with a relevant response.

A useful response usually contains two or three elements:
1. Acknowledge what the customer said or how they feel.
2. Add a relevant, warm, playful, or supportive thought.
3. Ask one natural open question or offer a small topic choice.

Avoid:
- Generic replies unrelated to the message
- Repeated compliments
- Several questions in a row
- Scripted overenthusiasm
- Abrupt intimate escalation
- Claims unsupported by the virtual persona and system context

The response should still be appropriate even if the customer makes no additional purchase.

### Before-Send Check
Before every response, confirm:
1. `Relevant`: it responds to the customer's latest meaning.
2. `Truthful`: it does not invent offline experiences or identity facts.
3. `Consistent`: it remains consistent with the approved seed profile.
4. `Consensual`: intimacy and teasing match the current consent state.
5. `Useful`: it offers warmth, interest, information, or appropriate fun.
6. `Unpressured`: it does not manipulate continued messaging, credits, or gifts.
7. `Safe`: it contains no prohibited content or exposed private information.

If any answer is no, edit, discard, pause, or escalate.

## 8. Customer Mood Guidance

### Happy
- Celebrate naturally.
- Ask what made the moment meaningful.
- Use playful energy when welcomed.

### Sad Or Lonely
- Listen and acknowledge before trying to cheer them up.
- Do not escalate romance or spending.
- Do not say that the customer needs only the seed.
- Follow the safety workflow for self-harm, abuse, or immediate danger.

### Stressed
- Slow the pace.
- Keep the response calm and clear.
- Offer a lighter topic without forcing it.

### Bored
- Offer an approved game, humorous question, hypothetical choice, or fresh topic.
- Do not create jealousy or a fake emergency.

### Romantic
- Match the tone gradually and with consent.
- Keep the virtual identity clear.
- Do not promise exclusivity or real-world availability.

### Wants To Leave
- Respect the decision immediately.
- Send a brief, warm goodbye if appropriate.
- Do not use guilt or repeated follow-up messages.

## 9. Prepared Text
Prepared text is an approved answer library. The employee remains responsible
for choosing an answer that fits the current message and conversation history.

The employee has three response methods:
1. Type a complete response without prepared text.
2. Select a prepared answer, edit it for the current context, and send it.
3. Send an approved prepared answer unchanged when it already fits the context.

To use a prepared answer:
1. Select a category, subcategory, mood, tone, or keyword.
2. Review the suggested message against the current conversation.
3. Check consent, relationship stage, and virtual-persona consistency.
4. Choose `Use & edit` when adaptation is needed, or `Send unchanged` when the
   approved answer is already proper for the customer's message.
5. Send only if it meets policy.

Approved categories include:
- Love and romance
- Feelings and sympathy
- Greetings
- Adult flirting and intimate conversation
- Sports
- Travel
- Cooking and food
- Weather and seasons
- Art and culture
- Clothing and style
- City and countryside living
- Beach
- Mountains and outdoors
- Work and career
- Jobs and employment
- News and current events

Do not use retired, unapproved, incorrect-language, or outdated current-event text.

## 10. AI Assistance
AI may suggest responses using approved conversation context.

Before sending an AI-assisted response:
- Verify that it addresses the customer's actual message.
- Remove invented facts or experiences.
- Check current facts such as news, sports, and weather through an approved source.
- Confirm that it does not pressure spending.
- Confirm that it respects consent and profile-integrity rules.
- Edit the response when necessary.

Every sent message records the internal employee, customer-facing seed,
real customer, and whether the response was employee-written, prepared
unchanged, prepared then edited, AI-assisted, or robot-generated.

AI suggestions never override employee responsibility. Repeated unsafe,
invented, or manipulative suggestions must be flagged with enough context for
quality review.

### Customer Requests A Human
The virtual profile remains company-operated whether a human employee or robot
helps compose the response. Do not claim to be the customer's personal human
match. If the customer requests support, a safety specialist, or an explanation
of virtual-profile operation, route the request to the proper service channel.

## 11. Love, Humor, And Emotional Value
Provide:
- Respectful compliments
- Warm curiosity
- Gentle encouragement
- Appropriate affection
- Light jokes and playful questions
- Calm conversation
- Interesting continuity

Humor must not target:
- Race, ethnicity, nationality, religion, or another protected characteristic
- Trauma
- Disability
- Appearance or body
- Consent
- Financial condition
- Customer vulnerability

Stop teasing immediately when it is not welcomed.

## 12. Adult Intimate Conversation
Before entering an intimate topic:
1. Confirm adult eligibility state.
2. Confirm affirmative consent.
3. Begin at a lower intensity.
4. Monitor comfort and consent continuously.
5. Stop or change topic immediately when requested.

Never support content involving:
- Minors or age ambiguity
- Coercion or non-consent
- Incest
- Exploitation or trafficking
- Intoxicated consent
- Sexual violence
- Requests for illegal content

Do not pressure a customer to send intimate images.

## 13. Customer-To-Customer Chat Privacy
Employees do not monitor ordinary real-customer conversations.

Access to private customer chat requires:
- An assigned support, moderation, safety, security, or legal purpose
- Appropriate permission
- Only the minimum necessary context
- An audit record

Do not browse customer messages out of curiosity or discuss them with coworkers who lack a work need.

## 14. Safety Escalation
Pause normal conversation and follow the approved escalation workflow for:
- Self-harm or suicide risk
- Abuse or immediate danger
- Threats or violent intimidation
- Child-safety concerns
- Exploitation, trafficking, or coercion
- Non-consensual intimate images
- Doxxing or blackmail
- Fraud, extortion, or payment disputes
- Serious privacy or security incidents
- Customer confusion about the virtual identity

Do not investigate beyond your role. Preserve relevant context and transfer to the authorized team.

The final severity levels, response scripts, and emergency contacts remain pending.

### Minimum Escalation Note
Record only work-relevant facts:
- Conversation and assignment ID
- Time and current worker
- Safety category and observed statement or event
- Immediate action already taken
- Whether the customer appears to be in immediate danger
- Consent, block, payment, or account state affecting the case
- Requested receiving team

Do not diagnose the customer, copy unrelated private history, or add insulting
or speculative descriptions.

## 15. Racism, Discrimination, And Violence
Do not participate in or encourage racist, discriminatory, or violent abuse.

Good-faith discussion of culture, religion, politics, discrimination, history, news, or fictional violence may continue when it is not targeted harassment or incitement.

When targeted abuse or a credible threat occurs:
1. Do not mirror or escalate the language.
2. Preserve the relevant message context.
3. Use the correct safety reason.
4. Escalate according to severity.
5. End or pause the conversation when required.

## 16. Credits And Gifts
Customers must see the exact cost before a paid action.

Current planned costs:
- Text message: 5 credits, maximum 60 words
- Image or sound: 10 credits, file-size rule pending
- Gifts: Flower 100, Silver 200, Gold 500, Diamond 1,000, Big Rocket 10,000

Employees must not:
- Hide or minimize cost
- Ask repeatedly for gifts
- Imply gifts prove love
- Target vulnerable or distressed customers for spending
- Promise a benefit not defined by policy

When a customer sends a gift to an assigned seed, 80% of the gift credits are
recorded for the employee who oversees that seed at gift time. The assignment
is snapshotted and later reassignment does not move the credits.

Employees must not ask for gifts or influence assignment transfer to obtain
gift credits. Gift credits are tracked separately from customer credits.
Monthly employee reports show gift credits separately from salary.

## 17. Seed Time Limit And Transfer
The workspace warns before a seed reaches its two-hour daily limit.

Before the limit:
1. Avoid starting a new conversation that cannot be handled safely.
2. Prepare an approved warm close or transfer.
3. Preserve conversation context.
4. Follow system transfer instructions.

After lease expiry or time limit:
- Do not send from the expired assignment.
- Do not attempt to reactivate the seed manually.
- Confirm that transfer or closure was recorded.

Exact transfer wording and timing remain pending.

### Handoff Standard
A handoff should let the next worker continue without making the customer
repeat sensitive information. Include:
- Current topic and mood
- Last meaningful question or promise made in the conversation
- Consent and boundary state
- Unresolved safety, support, or technical issue
- Persona facts already used
- Suggested next action

Handoff notes are internal records. They must be factual, concise, respectful,
and limited to the assigned conversation.

## 18. Ending A Conversation
A conversation may end because:
- The customer chooses to leave.
- The seed reaches its time limit.
- The work assignment transfers.
- A safety or consent rule requires stopping.
- The account or service becomes unavailable.

Use a concise, respectful close. Do not create urgency or pressure the customer to return.

## 19. Quality And Performance
Employee quality should be evaluated through:
- Relevance and warmth
- Customer satisfaction
- Respect for consent and boundaries
- Company-operated-profile integrity compliance
- Safety handling
- Conversation variety
- Appropriate humor
- Low pressure, complaint, and block rates
- Correct transfers and endings

Revenue, gifts, paid-message count, and session length must not be the only quality measures.

The current business proposal awards 30% of eligible attributed revenue. The
gross/net calculation remains pending, and policy-violating, fraudulent,
refunded, charged-back, or profile-integrity-violating interactions are not
eligible.

Employees must never receive a live prompt telling them to extract a spending
target from a customer. Recommended compensation combines stable base pay with
quality, safety, attendance, and approved business measures. Revenue may be one
audited measure only after consumer-protection review.

### Coaching And Review
Quality review should use a sampled, access-controlled process. The reviewer
records the rule or coaching goal, not personal curiosity. Employees receive a
way to explain context and appeal material performance or discipline decisions.

## 20. End Of Shift
1. Finish, close, or transfer active assignments.
2. Resolve unsent drafts.
3. Confirm safety escalations were received.
4. Record required notes.
5. Change status to unavailable.
6. Sign out.
7. Lock or shut down the approved workstation.

Never intentionally rely on automatic logout at the end of a shift. Never leave
active conversations open for another person to operate under your account.

### Weekly Self-Check
- Review coaching and policy changes.
- Check repeated AI or prepared-text problems you flagged.
- Confirm no unresolved safety case remains assigned to you.
- Review profile-integrity, consent, transfer, and duplicate-send errors.
- Request help when workload or emotional strain is affecting safe work.

## 21. Common Problems

### Assignment Conflict
- Stop sending.
- Refresh assignment state.
- Report the conflict if another worker appears active.

### Lost Connection
- Keep drafts until status is known.
- Do not duplicate an acknowledged message.
- Use reconnect or transfer controls.

### Automatic Logout
- Sign in again with password and email/text verification.
- Review whether drafts were preserved and whether assignments transferred.
- Confirm current assignment ownership before sending a pending reply.

### Incorrect AI Suggestion
- Do not send it.
- Edit or discard it.
- Flag repeated quality or safety failures.

### Missing Profile Controls Or Cost
- Stop paid conversation activity.
- Report the issue.
- Resume only after the required information is restored.

### Suspicious Account Activity
- Sign out when safe.
- Contact security.
- Do not enter or share an unexpected verification code.
- Review whether the code arrived by email or text and report the attempted login.

## 22. Quick Glossary
- `Seed`: internal term for an employee-operated company profile.
- `Assignment lease`: expiring authority for one worker to operate one conversation.
- `Prepared text`: approved suggestion that must still fit the live context.
- `AI-assisted`: drafted with an approved model and reviewed before human send.
- `Robot-generated`: created and sent only inside an explicitly approved automation scope.
- `Handoff`: controlled transfer of work and necessary context.
- `Pause`: temporary stop that prevents unsafe or duplicate sending.
- `Escalation`: transfer to an authorized specialist team.

## 23. Required Before Training Approval
- Final employee role and permission matrix
- Minimum Backend screen resolution and browser matrix
- Shift, attendance, and availability rules
- Response-time targets
- Safety severity and emergency playbooks
- Conversation transfer behavior
- Employee compensation basis
- Voice duration, processed byte limit, and supported media formats
- Employee gift-credit redemption or payout treatment
- Robot auto-send approval scope
- Employee discipline and appeal process
- Exact verification-code lifetime, resend limit, and failed-attempt lockout
- Employee verification-channel loss and identity-recovery procedure

## 24. Recommended Operating Decisions For Manual Review
- Require employee approval for every AI-assisted outgoing message in the first release.
- Keep unrestricted robot auto-send disabled during the first pilot.
- Allow proactive seed initiation only through approved, rate-limited campaigns
  after legal and consumer-protection approval.
- Use stable pay plus quality measures instead of a pure spending commission.
- Require a structured handoff note for every transfer involving safety, consent, or unresolved support.
