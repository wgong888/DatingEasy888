# Open Questions

## Manual Approval
- Approve or revise the recommended customer navigation: Discover, Messages, Feed, Activity, and Me?
- Should Mailbox remain as a Messages tab or be removed from the first release?
- Approve Like as visible interest, Favorite as private bookmark, and Follow as Feed subscription?
- Which customer-support, moderation-appeal, and account-recovery response targets can be promised?
- Approve the proposed employee assignment states and structured handoff note?
- Must every AI-assisted employee message receive human approval in the first release?
- Should all robot auto-send remain disabled during the first pilot?
- Which non-payment administrator actions require two-person approval?
- Which recommended manual features belong in V1, and which are explicitly post-V1?

## Product
- Is DatingEasy888 the final public brand name?
- Should the site focus on dating, chat, companionship, or broader adult social networking?
- What countries should launch first?
- Which languages are needed at launch?
- Should users be able to browse before registration?
- Which single customer segment and launch geography should be targeted first?
- Is the product primarily dating, company-operated companionship, or two
  clearly separated experiences, and has the chosen presentation been legally
  approved?

## Brand And Theme
- What should the final DatingEasy888 logo look like?
- Should the main accent color stay orange, shift toward coral/pink, or use both?
- Should the landing page keep a dark romantic background or move closer to the lighter Best Dates style?
- How much visual energy should profile cards have: simple cards, soft shadows, or stronger image-forward cards?

## UI Platforms
- What is the minimum mobile-phone width for the customer Frontend?
- Which device-cloud testing provider and physical mobile devices will be used for the confirmed browser matrix?
- What usage threshold and notice period will govern future browser-version retirement?
- Should Windows 10 remain supported after October 13, 2026, and if so, for which customer editions and security-update programs?
- What is the minimum screen resolution for the employee/admin Backend?
- Should the Backend support one monitor only, or also offer a multi-monitor layout?
- Which Backend actions need keyboard shortcuts?

## Registration And Verification
- Is email required at signup?
- Is phone verification required?
- Is ID verification required for all users or only some users?
- What happens if a user does not finish the profile wizard?

## Profiles
- Which fields are required vs optional?
- Which fields are public, private, or admin-only?
- How many public/private photos are allowed?
- Should photos require approval before display?
- Is the Visitors feature free, credit-based, or subscription/premium?
- Can customers browse profiles invisibly, and how is that explained to profile owners?
- How long are profile visits retained and how precise is displayed visit time?
- Are repeated visits shown as a count or only as the most recent visit?
- Which exact fields from registration must live directly in `CustomerProfile`?
- Should `Active` be enough, or do we need detailed customer statuses such as pending, active, suspended, banned, deleted?

## Discovery
- What is the default search result order?
- Should users see only compatible looking-for preferences?
- Should users see inactive profiles?
- Should location be exact city or approximate region?

## Messaging
- Are profile interaction requests free, or does each request type consume credits?
- How long does a profile interaction request remain pending?
- What cooldown and hourly/daily rate limits apply after decline, expiry, or repeated sending?
- What inactivity duration changes Online to RecentlyActive and then Offline?
- Can customers hide online presence from everyone or only selected customers?
- Are messages free, credit-based, or mixed?
- Are mail and chat separate systems or two views of the same conversations?
- Can users send photos in messages?
- Can users delete messages for everyone or only themselves?
- Should `ChatRecords` include a `ConversationId`?
- Can a chat record contain text and an image/gift together?
- Is `CreditUsed` charged to the sender only?

## Seed Customers
- How will customers be informed that a profile is AI-generated or company-operated?
- Which commercially approved AI image and text providers will generate original seed assets?
- Will any licensed human models be used, and does each release expressly permit adult-social/dating profile use and AI transformation?
- What internal text and image near-duplicate thresholds will block publication?
- Who performs and who independently approves seed originality, adult-appearance, and provenance review?
- What is the complaint and takedown SLA when a seed is alleged to resemble a real person?
- Can seed customers initiate conversations, or only reply?
- Are seed conversations written by employees, robots, AI, or a combination?
- What rules prevent misleading customers about seed profile identity?
- What source defines which cities qualify as large cities?
- Can one employee's 20-city assignment change over time?
- Does each seed customer always belong to exactly one employee?

## Credits And Payment
- What are the final credit package prices?
- What actions consume credits?
- Can credits expire?
- Are refunds allowed?
- Which payment provider should be used?
- Should `ExpireDue` be kept, or should expiration be represented only by month and year?
- Should customers be allowed to save multiple payment methods?
- Is `MoneyMake` gross successful charges or net after refunds, chargebacks, taxes, and processing fees?
- Should ChargeRecord include failed and pending attempts, or successful charges only?
- Which customer or billing record supplies FirstName and LastName?
- For purchases above $100, does "1.6 times the amount" mean 16 credits per USD?
- Are credits refundable, transferable, withdrawable, or only usable inside the platform?
- What happens when a customer tries to send a text longer than 60 words?
- What maximum voice-message duration and processed byte limit should apply?
- Which voice source formats are accepted, and which voice codec/quality is produced?
- Does the employee receive 30% of gross attributed charges or net revenue after refunds, chargebacks, taxes, and payment fees?
- Can a customer gift promotional registration credits?
- How may human employees eventually redeem or receive payment for employee gift credits?
- How are robot-employee gift credits represented in company accounting?
- Which payment acquirer has approved the exact dating, AI-profile, credits, gifts, and intimate-chat model?
- What customer spending limits and cooling-off controls are required?

## Financial Reporting
- Which timezone defines the company business day and midnight job?
- Is each report maintained per currency, or converted into one base currency?
- How are refunds and chargebacks assigned to a later day or month?
- How is money attributed to an employee: seed assignment at charge time, chat time, or another rule?
- Does `CreditsUsed` include all customer credit consumption or only conversations involving an employee's seed customers?
- What is the exact employee salary formula based on `TotalMake`?
- Can a finalized daily or monthly report be reopened, or only corrected with an adjustment record?
- Should `CompanyMonthReport` include advertisement, cloud-service, and other operating expenses?
- Should employee compensation remain 30% revenue-based, or use a safer blended quality/salary model?

## Advertisement
- Does one AdvertisementRecord represent one payment, one campaign, or one media placement?
- Should we record impressions, clicks, registrations, and customer acquisition cost?
- Can an advertisement have multiple payments or invoices?

## Cloud Services
- What units should be used for CPU, memory, disk space, and network rate?
- Should individual IP addresses be stored, or only the number of allocated IPs?
- Should database and backend/backup resources be separate child tables when one invoice includes multiple services?
- Do cloud records represent invoices, resource inventory, or both?

## Admin
- Which exact policies are editable in the first-version Policy Maintenance UI?
- What safe minimum and maximum values apply to each configurable policy?
- Which policy changes require advance customer notice and how much notice?
- Which capabilities receive an emergency disable toggle?
- Which admin roles are required at launch?
- Who can view private photos or messages during review?
- Which non-payment actions require two-person approval?
- What analytics does management need?
- What is the meaning of employee `Contribute`?
- How should employee `TotalEarn` be calculated?
- Should employee bank/card details be stored by our system or only by a payout provider?
- What controls apply when an administrator creates or changes another administrator?
- Who may act when the CEO is unavailable, and what legal authorization and audit evidence are required?
- Who reviews and approves monthly and year-end reports?
- Can an administrator edit a finalized report, or only create an adjustment?

## Backend And Robot Jobs
- What exact employee login-code lifetime, resend limit, failed-attempt limit, and lockout period apply?
- Which email and SMS providers deliver employee verification codes?
- How is an employee's identity recovered when both verified channels are unavailable?
- What pages and dashboards does a normal employee see?
- What additional pages and actions does an administrator see?
- Which work can human employees perform for assigned seed customers?
- Which jobs are performed automatically by robot employees?
- How often does each robot job run?
- Which robot actions require human approval?
- How are robot failures, retries, and alerts handled?
- Can employees temporarily pause a robot job or seed-customer assignment?
- What Backend actions require complete audit history?
- How should the scheduler measure "even" distribution between human and robot employees?
- What happens to active chats when a seed reaches its two-hour daily limit?
- Can an employee choose among assigned seed profiles, or only accept system selection?
- The employee may track up to 10 simultaneous conversations, but the confirmed
  four-panel UI focuses on one selected seed/customer conversation at a time.
- What legally approved customer-facing presentation and terms govern
  AI-generated/company-operated profiles while per-profile classification
  remains hidden?
- Should AI-assisted messages require employee approval every time?
- Which topics must always transfer from a robot to a human?
- How are prepared-chat-text sources reviewed, approved, versioned, and retired?
- Which prepared-text languages are required at launch?
- How many approved templates are needed in each category?
- Which roles can draft, approve, revise, or retire prepared text?
- How is customer consent for adult intimate conversation recorded and withdrawn?
- Which prepared-text categories are available to robots without per-message human approval?
- Should work and job remain separate categories, or be combined?
- Which timed tasks are required at launch?
- Which timezone controls each timed task?
- Which tasks may run concurrently?
- How many retries are allowed for each task type?
- Who receives alerts when scheduled tasks fail?

## Safety And Legal
- What jurisdictions will the product operate in?
- What privacy policy and terms are required?
- What age verification level is required?
- Which jurisdiction-specific legal reporting and evidence-preservation duties apply to customer chat?
- What moderation appeal process and response times apply at each severity?
- What exact automated detection is permitted under the privacy policy, and which detections require human confirmation?
- What retention/deletion policy is required?
- Has legal counsel, the payment provider, and each required marketplace
  approved the customer-type-hidden profile presentation and paid interaction
  flow?
- What consumer-vulnerability and unusual-spending protections are required?
