# Design Decisions

This file records important decisions so we do not lose context as the design grows.

## Confirmed

### Brand
- Use DatingEasy888 as the working brand.
- Use www.DatingEasy888.com as the working domain.

### Architecture
- Frontend: HTML/CSS/JavaScript served by Python.
- Frontend means the customer-facing website.
- Backend means the employee/admin UI and robot automatic jobs.
- Web Service means the C#/.NET middle layer used by Frontend and Backend.
- Database: SQL Server.
- Design first, code later.
- Use Agile product development across design, database review, implementation,
  testing, security, deployment, and post-launch improvement.
- Work is organized into a prioritized backlog and short, reviewable
  iterations. Each increment updates its requirements, contracts, database
  design, tests, and documentation together.
- Agile iteration does not bypass required financial, privacy, security,
  safety, legal, or release approval controls.
- The design approval sequence is manuals, Web Service API contracts, database
  table review, and then first-version implementation.
- The three role manuals use `Product/PRODUCT_OPERATING_MODEL.md` as their shared
  terminology and state reference.
- Recommendations inside manuals remain proposals until moved into this file as
  confirmed decisions.
- Detailed API contracts will be designed after Backend requirements are developed further.
- Web Service contract draft uses versioned `/api/v1` routes separated into customer, backend, admin, robot, and integration areas.
- Financial/message/gift/robot commands require idempotency.
- Runtime seed work uses expiring assignment leases.
- Every list API response returns at most 20 records using cursor pagination.
- Customer, employee, and admin UIs display an explicit `Next` button when
  `hasMore=true`; selecting it retrieves the next 20 records.
- Normal UI lists do not use automatic infinite scrolling.
- Deployment planning uses separate development, test, staging, and production environments.
- Release progression is Arfa completion and review, Beta implementation,
  deployment rehearsal, internal online test, closed real-customer test, and
  gradual public launch.
- Release dates are milestone-driven and will be estimated after the Arfa
  review defines the accepted Beta scope, staffing, cloud cost, and legal and
  payment dependencies.
- Arfa is a local functional prototype. It is not deployed directly as the
  public production application.
- The cloud account must be company-controlled with MFA, least privilege,
  multiple trusted administrators, cost budgets, infrastructure as code, and
  separate production and nonproduction boundaries.
- Paid cloud provisioning and material cost increases require the established
  Admin preparation and CEO outgoing-payment approval workflow.
- Source control uses a private repository with protected trunk-based development.
- `main` is releasable, direct pushes are prohibited, and changes require pull requests, successful checks, and independent review.
- Source-code, database-migration, and production-release changes require
  independent engineering review. Admin Backend operations do not require a
  second administrator; sensitive actions require reauthentication, reason,
  confirmation, and audit.
- Production deployments use immutable CI-built artifacts tied to a source commit and release tag.
- Product releases use semantic versioning; APIs retain independent path versions such as `/api/v1`.
- Database migrations, infrastructure, API contracts, tests, and design documents are version-controlled.
- Every human employee login requires a password followed by a short-lived,
  single-use verification code sent to a verified work email address or verified
  mobile number by text message.
- At least one employee verification channel is mandatory; an employee with
  both enrolled may choose email or text during sign-in.
- Employee login codes are rate-limited, never logged, and cannot be used by
  robot or service identities.
- Successful employee password-and-code login immediately authorizes normal
  work within the employee role and assigned workload; no further manager or
  administrator approval is required.
- Employees must explicitly log out before ending work, going offline, leaving
  the workstation, or transferring device control.
- Ten consecutive minutes without employee interaction automatically logs out
  the employee. Background polling, incoming events, timers, automated refresh,
  and open tabs do not reset the inactivity timer.
- Automatic logout requires full password-and-code login to return and safely
  releases or transfers active assignment leases.
- Administrator and privileged production access may require stronger
  phishing-resistant authentication in addition to the employee email/text
  verification flow; production access remains time-limited, approved, and audited.
- OWASP ASVS 5.0.0 Level 2 is the baseline for applicable public application security controls.
- Payment card handling minimizes PCI scope through provider-hosted/tokenized collection.

### Product
- Adult 18+ dating/social chat website.
- A customer must be at least 18 years old to register or use the authenticated product.
- After an eligible customer signs in and is online, the customer requires no
  employee, administrator, or manual approval to use any enabled action offered
  by the customer UI.
- Customer UI availability is authoritative for normal use: enabled actions may
  be used immediately, while hidden or disabled actions reflect automatic
  eligibility, balance, block, consent, rate-limit, account-state, or service checks.
- No-manual-approval access does not remove another customer's consent or choice
  and does not bypass payment, safety, or legal controls.
- Customer sessions remain active during use and automatically end after twenty
  consecutive minutes without meaningful customer interaction.
- Customer navigation, typing, pointer, touch, and submitted UI commands reset
  the inactivity timer. Background reconciliation, incoming events, timers,
  automated refresh, and open tabs do not.
- Customer and employee inactivity limits are separate: twenty minutes for
  customers and ten minutes for employees.
- Main user modules: registration, profile, discovery, messaging, feed, people/profile, credits/payment.
- After customer login, Messages is the default screen and conversations are
  ordered from newest message activity to oldest.
- Selecting `Me` opens the signed-in customer's own profile for review/edit.
- Discover, search, and Favorites show profile lists; selecting any person
  opens one full profile page with Chat and Back-to-list actions.
- Admin/backoffice is required.
- Registered platform users are called Customers.
- Company workers are called Employees.
- Administrators create employee accounts, maintain cloud services, administer security, manage timed tasks, and generate monthly and year-end reports.
- Administrators may perform every operational Admin Backend function, subject
  to audit and applicable workflow controls.
- The Admin Backend includes a dedicated Policy Maintenance UI.
- The operational overview displays total and online counts separately for
  real, seed, and robot customers. Credits consumed and revenue are current
  UTC-business-day values rather than lifetime values.
- Customer password recovery matches account name plus registered email or
  phone, enters an administrator queue unless auto approval is enabled, sends
  a one-time temporary password, revokes prior sessions, and forces a password
  change after sign-in.
- Employee account roles are Chat employee, Administrator, and CEO. Removing
  an employee soft-deactivates the account and preserves historical records.
- Administrators may draft, validate, publish immediately, schedule, retire, and
  roll back product policies without a software deployment or additional
  ordinary approval.
- Every published policy is immutable and versioned with actor, reason, scope,
  effective time, and before/after values.
- Completed transactions and actions retain the policy version that governed
  them; policy changes do not retroactively rewrite history.
- Policy configuration cannot approve outgoing company payments, store secrets,
  or contain executable code.
- Administrators cannot give final approval for or release an outgoing company
  payment.
- Every outgoing company payment requires a separate authenticated CEO approval
  before release, with no amount threshold.
- The administrator or finance worker who prepares an outgoing payment cannot
  perform the CEO approval action.
- The CEO has a dedicated four-panel dashboard: revenue/expense for current
  UTC year, month, and day; online real customers/employees/seeds/robots;
  system health; and an outgoing-payment approval waiting list.
- Successful customer charges are revenue. Only CEO-approved outgoing payments
  are expenses; pending and denied requests are excluded.
- New eligible real customers receive a one-time 50-credit registration reward.

### Visual Direction
- Use Horizon Singles and Best Dates as visual references.
- DatingEasy888 should be between the two: less shiny/intense than Horizon Singles and less plain than Best Dates.
- The desired UI feeling is warm, polished, readable, trustworthy, adult, and modern.
- Customer Frontend is mobile-first because customers are expected to use
  phones as their primary and most frequent access device.
- Every customer workflow is designed and accepted at supported phone widths
  first, then enhanced for tablet and desktop without removing core features.
- Customers may choose the supported mobile website or a future installed iOS
  or Android application. Application installation is optional.
- The mobile website remains a first-class, complete customer product after
  native applications launch; no core workflow may become app-only.
- Web and native clients use the same authoritative account, profile,
  conversation, credit, purchase, gift, safety, and policy data.
- Native conveniences may differ, but app-install promotion must be
  dismissible and must not obstruct or degrade continued browser use.
- Customer Frontend is simple, compact, robust, and easy to use on desktop and mobile phones.
- Customer Frontend supports Windows 10 22H2 as a time-limited legacy target and fully supports Windows 11.
- Customer Frontend supports Mac computers introduced in 2020 or later running macOS 12 Monterey or later.
- Customer mobile minimum is iOS/iPadOS 17.
- Edge and Chrome are the primary desktop browsers; Safari is required on Apple mobile devices; Firefox remains a secondary supported browser.
- Bing compatibility means approved public-page search indexing and opening results in supported browsers; Bing is not a browser.
- Windows 10 certification must be reviewed after the Consumer ESU period ends on October 13, 2026.
- Other Unix/Unix-like desktops receive best-effort support through standards-compliant current browsers.
- Internet Explorer 11 and Edge IE mode are not supported targets.
- Customer Frontend compatibility is certified from 320 CSS pixels through large desktop layouts.
- After the Arfa review, dedicated customer applications for iOS and Android
  become a planned product track. They reuse the versioned Web Service,
  authentication, chat, profile, credit, gift, safety, and policy contracts
  rather than creating separate business rules.
- Employee, administrator, CEO, and robot operations remain outside the
  customer mobile apps. Robot conversation work remains headless.
- While a customer is online, activity is reconciled at least every three minutes for chats, chat-history presence, favorites, inbox, search results, and profile interaction requests.
- Real-time events may arrive immediately; the three-minute cycle is the maximum reconciliation interval.
- Profile interaction request types are Hello, Cuddle, Hug, Flirt, Teasing, and SexRequest.
- SexRequest is displayed as an intimate-chat request, requires verified eligible adults, and never constitutes consent by itself.
- Search-result status may update in place, but result ordering does not shift while the customer is actively reviewing the list.
- Five added customer screens define public profile detail, request-template picker, active conversation detail, account drawer, and profile visitors.
- Full profile detail includes a photo carousel, Message, Favorite, About, profile requests, Block, and Report.
- Customer account drawer includes Profile, Visitors, Credits, Settings, Log Out, and Back to Home.
- Eligible full-profile views create privacy-controlled visitor history; self, blocked, admin, moderation, support, safety, robot, and service views do not appear.
- Profile request templates are approved, versioned, localized, and snapshotted when sent.
- Company-operated-profile request templates cannot claim nearby presence,
  meetings, marriage, exclusivity, or false offline identity.
- Employee/Admin Backend is a robust, convenient, desktop-only workspace for large screens.

### Database
- SQL Server stores relational data.
- CustomerProfile is the first customer table.
- CustomerProfile primary key is CustomerId, generated by the system as a UUID.
- `CustomerProfile.Seed` is a required customer-type discriminator:
  `0 = real customer`, `1 = employee-operated seed customer`, and
  `2 = autonomous robot customer`.
- A real customer may chat with another real customer, a seed customer, or a
  robot customer.
- A seed customer may chat only with a real customer, and its outgoing
  conversation is performed through its assigned company employee.
- A robot customer may chat only with a real customer and generates its own
  outgoing responses without entering the employee seed-work queue.
- Robot conversation language uses a hybrid internal/external engine.
- The initial outside service is the OpenAI API with pinned GPT-4.1 mini.
- One global admin policy controls outside-AI availability:
  `LocalOnly` or `HybridExternalAllowed`.
- When outside AI is allowed, all eligible robot customers may use it; when it
  is disabled, no robot customer may call an outside provider.
- Simple messages may still use the local prepared-text engine while outside
  AI is allowed. Provider failure, rejection, timeout, or budget exhaustion
  falls back to the local engine or required human escalation.
- Detailed routing, privacy, cost, budget, and audit rules follow
  `Product/ROBOT_CONVERSATION_AI_SERVICE_POLICY.md`.
- Robot profiles use the same customer-visible profile fields and presentation
  as real customers; only authorized administrators and system services receive
  the internal robot classification.
- Authorized administrators may edit robot profiles, with immutable provenance
  and before/after audit history.
- Each approved large city has at least six robot profiles: at least three Man
  and three Woman.
- A robot profile may be customer-visible online and chat-eligible for no more
  than eight hours per assigned-city local day.
- System scheduled tasks maintain at least one Man and one Woman robot online
  in each coverage-ready large city.
- Six profiles provide no failure reserve. A city is coverage ready only when
  same-sex reserve or approved overflow capacity is available.
- Detailed robot-customer operations follow
  `Product/ROBOT_CUSTOMER_WORK_POLICY.md`.
- Seed-to-seed, seed-to-robot, and robot-to-robot conversations are prohibited.
- A robot customer is a CustomerProfile identity and is distinct from a robot
  employee, which is an Employees/service identity.
- All seed customer profiles are generated by AI before the product is deployed.
- Seed profiles are generated as original virtual characters; copying or lightly modifying real profiles, photos, or biographies is prohibited.
- Seed photos must be fully synthetic, commissioned, or commercially licensed with appropriate model consent.
- Each initial seed profile has three consistent, human-reviewed photos of the same adult synthetic/licensed identity.
- Seed biographies are generated from scratch, target 80-180 words, and must remain below 500 words and 4,000 characters.
- A seed biography's first sentence must be original and cannot duplicate another active seed's opening.
- Seed profiles require documented provenance, originality/safety checks, and independent human approval before publication.
- Seed profiles should be at least 21 years old and must not reasonably appear underage.
- Employees is the first company worker table.
- Employees primary key is EmployeeId.
- ChatRecords stores customer-to-customer conversations.
- ChatRecords.SenderId and ChatRecords.ReceiverId reference CustomerProfile.CustomerId.
- EmployeeSeed assigns seed customers to human or robot employees.
- `EmployeeSeed.CustomerId` may reference only `CustomerProfile.Seed = 1`;
  robot customers (`Seed = 2`) cannot receive EmployeeSeed assignments.
- Only large cities have seed customers.
- Human and robot employees perform the same internally classified
  seed-conversation role.
- An employee represents all seed customers assigned to that employee. Each
  customer-facing reply is sent as the selected seed identity while the actual
  employee remains recorded internally for audit.
- Work is assigned evenly between eligible human and robot employees.
- Each employee is assigned up to 1,000 seed profiles.
- The system activates 20 seed profiles for an employee at one time.
- Each employee handles up to 10 simultaneous real-customer chats.
- Each seed profile may be online for no more than two hours per day.
- Employee UI uses four full-height vertical panels: 10% active seeds, 15%
  real-customer requests/history for the selected seed, 60% focused main chat,
  and 15% classified prepared-text files.
- A green dot beside a Panel A seed portrait means a real customer is waiting
  for a response. Panel B orders the selected seed's conversations newest first.
- The employee selects one seed and one real customer at a time. The main chat
  displays that pair's history and has no gift controls.
- Employees may type a response, edit an approved prepared answer, or send an
  approved prepared answer unchanged when it properly fits the conversation.
- AI assistance and approved prepared text support immediate responses.
- Prepared conversation text is organized into governed categories with review, versioning, consent, safety, and audit rules.
- Seed chat must provide genuine customer value: feeling heard, respectful affection, mood support, relaxation, happiness, fun, humor, and natural continuity.
- Continued conversation must result from quality and customer choice, never deception, dependency, guilt, urgency, jealousy, or spending pressure.
- Customer requests to pause, stop, or change topic are respected immediately.
- Seed-chat quality is measured using satisfaction, relevance, safety,
  boundaries, and natural return interest, not revenue or message count alone.
- Real-customer chat is open and private by default; the platform does not steer, rewrite, or suppress lawful adult conversation based solely on viewpoint or controversial subject.
- Racist/discriminatory abuse, credible threats and violent intimidation, exploitation, non-consensual intimate content, child sexual exploitation, doxxing, fraud, and repeated unwanted contact are prohibited.
- Discussion of violence in news, history, fiction, recovery, or prevention is not automatically prohibited; moderation considers context, target, intent, and credible risk.
- Human access to private customer conversations requires an approved purpose, least necessary context, permission control, and audit history.
- Initial prepared-text categories include romance, emotional support, greetings, adult intimate conversation, sports, travel, food, weather, culture, style, places, work, and news.
- Real, seed, and robot classifications remain available to authorized company
  roles but are hidden from the real-customer UI and customer-facing APIs.
- Some redundant/summary data is allowed for efficiency when reconciliation/source-of-truth rules are documented.
- Card security code/CVV/SecCode must not be stored.
- Customer card information is stored as provider-tokenized metadata in `CustomerPaymentMethods`, not directly in `CustomerProfile`.
- Full raw card numbers, card PIN/password, and plain customer login passwords must not be stored.
- Customer and human employee login passwords are stored only as salted modern password hashes in `PasswordHash`.
- Robot employees should use managed service credentials or workload identity instead of human passwords where possible.
- ChargeRecord records each customer credit-purchase charge using masked card metadata and provider references.
- CompanyDayMake summarizes company money and credits consumed each business day.
- EmployeeMonthReport summarizes employee-attributed money, credits, and salary monthly.
- CompanyMonthReport summarizes monthly company money and employee payments.
- AdvertisementRecord records paid advertisements and their active periods.
- CloudService records paid cloud infrastructure and online-service periods.
- The requested CloudService `Back` field means backup service/capacity and is named `Backup`.
- The CloudService provider column is named `CloudProvider`.
- Fixed credit packages are $10/100, $20/220, $30/360, $50/700, and $100/1,500 credits.
- `CustomerProfile.CreditsRemain` is the authoritative current spendable
  balance displayed in the customer Frontend.
- `CreditLedger` is the immutable history used to explain and reconcile every
  credit change.
- A credit-changing business record, its ledger entry, and `CreditsRemain`
  update commit atomically. The successful API response returns the committed
  balance for immediate UI update.
- Customer logout is not a credit-balance persistence event. The Frontend may
  retain the latest server-confirmed balance in session state to avoid
  unnecessary reads, but it cannot update SQL Server from a client balance.
- If a client-reported or locally displayed balance differs from
  `CustomerProfile.CreditsRemain`, the Web Service returns the committed server
  value and may log a reconciliation event; it never increases or decreases
  the database balance merely to match the client.
- Employee reward rate is 30% of eligible attributed money.
- Text messages cost 5 credits and have a 60-word maximum.
- Message and gift costs are visible at the action point. Selecting Send or a
  gift performs the action immediately without a separate confirmation dialog.
- The conversation screen displays a gift panel with gift icons and costs.
- If the authoritative balance is insufficient, the entire message or gift
  operation is rejected without a ChatRecord, transaction, share, or deduction.
- Profile and conversation pictures are automatically resized and compressed to
  fit within a maximum 100 x 100 pixel bounding box while preserving aspect ratio.
- Images smaller than 100 x 100 pixels are not enlarged.
- All stored and delivered customer/profile/conversation picture derivatives use
  JPG or PNG.
- Safely decodable source images in another format are automatically converted:
  transparency-preserving images become PNG and ordinary photographs become JPG.
- Corrupt, unsafe, deceptive, or unsupported source files are rejected rather
  than converted.
- Voice messages are automatically transcoded and compressed before acceptance;
  the exact duration and processed byte limit remain pending.
- Accepted conversation pictures and voice messages cost 10 credits.
- Gifts cost Flower 100, Silver 200, Gold 500, Diamond 1,000, and Big Rocket 10,000 credits.
- Eligible gift recipients receive 80% of gift credits and the platform retains 20%.
- Every successfully sent gift is final and non-refundable.
- When a gift recipient is a seed profile, the 80% recipient credit share is
  added to the employee assigned to oversee that seed at gift time.
- Gift attribution snapshots the overseeing `EmployeeId`; later seed
  reassignment does not move previously earned gift credits.

## Pending
- Final logo and brand identity.
- Final domain purchase.
- Python frontend framework.
- ASP.NET Core version.
- Payment provider.
- ID/age verification provider.
- Credit prices and spending rules.
- Free vs paid message rules.
- Data retention policy.
- Admin role matrix.
- Real-time chat technology.
- Exact SQL Server UUID storage type.
- Exact CustomerProfile registration field list.
- Employee payment/payout provider and secure storage approach.
- Seed customer safety and conversation policy.
- Approved AI image/text providers and commercial-use terms for seed generation.
- Exact originality, likeness, and near-duplicate review tools and thresholds.
- Definition and source of the large-city list.
- Reconcile the submitted 20-city x 100-seed allocation, including its 80/20
  profile mix, with the newer confirmed limit of up to 1,000 seed profiles per
  employee. The city count and per-city count are not final until reconciled.
- Company reporting timezone and daily cutoff.
- Employee revenue attribution and salary formula.
- Financial report treatment of refunds, chargebacks, fees, taxes, and currencies.
- Whether advertisement and cloud-service expenses are included in monthly company reports.
- Exact above-$100 purchase formula.
- Voice-message duration, processed byte limit, codec, and accepted audio source formats.
- Whether employee 30% reward is calculated from gross or net eligible revenue.
- Delegated specialist administrator-role boundaries and non-payment approval requirements.
- CEO absence, emergency continuity, and legally authorized delegation procedure
  for outgoing payment approval.
- Scheduled-task definitions, timezones, retries, and ownership.
- Monthly and year-end report approval and correction workflow.
- Source-control and work-item hosting provider.
- Customer MFA and step-up verification experience.
- Identity provider for employee/admin phishing-resistant MFA.
- Final vulnerability remediation SLAs and security exception authority.

## Changed From Earlier Chat Design
- Old screenshot brands include Horizon Singles and Best Dates.
- New working brand is DatingEasy888.
