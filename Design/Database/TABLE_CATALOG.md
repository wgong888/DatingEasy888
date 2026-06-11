# Database Table Catalog

Status: design draft. This is a logical data dictionary, not executable SQL.

## General Conventions
- Database engine: SQL Server
- UUID columns: proposed SQL Server type `uniqueidentifier`
- Money columns: proposed type `decimal(19,4)`
- Credit columns: proposed type `bigint`
- Timestamps: proposed type `datetime2`, stored in UTC
- Boolean flags: proposed type `bit`
- Primary keys are system-generated.
- Foreign-key values must match the same UUID type as their referenced primary key.

## Table 1: CustomerProfile

Purpose: stores the main platform customer account and profile, including frequently read financial summary values.

| Column | Draft type | Null | Key/default | Description |
|---|---|---:|---|---|
| CustomerId | uniqueidentifier | No | PK, system-generated | Customer identifier |
| Email | nvarchar(320) | No |  | Login/contact email |
| EmailNormalized | nvarchar(320) | No | Unique | Normalized email for lookup |
| PasswordHash | nvarchar(512) | No |  | Safely represents requested Password; never plain text |
| PhoneNumber | nvarchar(32) | Yes |  | Customer phone |
| DisplayName | nvarchar(100) | No |  | Public profile name |
| Sex | nvarchar(32) | No |  | Customer sex/gender value |
| BirthDate | date | No |  | Used to calculate age and enforce 18+ |
| GenderLookingFor | nvarchar(64) | Yes |  | Dating preference |
| CountryCode | char(2) | No |  | Country code |
| StateId | nvarchar(20) | Yes |  | State/province code |
| CityName | nvarchar(120) | No |  | Customer city |
| MaritalStatus | nvarchar(32) | Yes |  | Marital status |
| WorkField | nvarchar(64) | Yes |  | Work category |
| EnglishLevel | nvarchar(32) | Yes |  | English level |
| LanguagesJson | nvarchar(max) | No | Default `[]` | Selected spoken languages |
| TraitsJson | nvarchar(max) | No | Default `[]` | Up to three selected traits |
| InterestsJson | nvarchar(max) | No | Default `[]` | Up to five selected interests |
| MoviePreferencesJson | nvarchar(max) | No | Default `[]` | Up to three movie preferences |
| MusicPreferencesJson | nvarchar(max) | No | Default `[]` | Up to three music preferences |
| GoalsJson | nvarchar(max) | No | Default `[]` | Up to three relationship/conversation goals |
| PreferredAgeMin | tinyint | Yes |  | Minimum preferred age, at least 18 |
| PreferredAgeMax | tinyint | Yes |  | Maximum preferred age |
| PersonalityType | nvarchar(64) | Yes |  | Personality category |
| Story | nvarchar(max) | Yes |  | Customer story |
| Bio | nvarchar(4000) | Yes |  | Public profile biography; seed maximum is under 500 words and 4,000 characters |
| ProfilePhoto | nvarchar(max) | No | Default portrait | Main public photo reference or processed prototype image |
| PublicPhotosJson | nvarchar(max) | No | Default `[]` | Public photo references |
| PrivatePhotosJson | nvarchar(max) | No | Default `[]` | Private photo references; never returned on public profile APIs |
| ProfileCompleted | bit | No | Default 0 | Required profile workflow completed |
| ProfileCompleteness | tinyint | No | Default 0 | Percentage from 0 to 100 |
| VerificationStatus | nvarchar(32) | No | Default Pending | Verification state |
| VisibilityStatus | nvarchar(32) | No | Default Visible | Profile visibility |
| CreateTime | datetime2 | No | UTC default | Registration time |
| UpdateTime | datetime2 | No | UTC default | Last profile update |
| LastLoginTime | datetime2 | Yes |  | Last successful login |
| Active | bit | No | Default 1 | Account may use platform |
| Seed | tinyint | No | Default 0 | 0 real, 1 employee-operated seed, 2 autonomous robot customer |
| PrimaryPaymentMethodId | uniqueidentifier | Yes | FK | Preferred CustomerPaymentMethods row |
| CreditsRemain | bigint | No | Default 0 | Authoritative current spendable credit balance shown to the customer |
| TotalCharged | decimal(19,4) | No | Default 0 | Cached total successful charges |
| Remark | nvarchar(max) | Yes |  | Internal/admin notes |

Constraints:
- `ProfileCompleteness` must be between 0 and 100.
- Registration requires `CountryCode`, `StateId`, and `CityName`.
- A missing uploaded photo is replaced with a sex-based illustrated default,
  so `ProfilePhoto` is always populated.
- `ProfileCompleted` becomes 1 only when every required profile section is valid.
- Trait, interest, movie, music, and goal arrays enforce their UI selection limits.
- `CreditsRemain` cannot be negative unless future credit/debt rules explicitly allow it.
- Every credit grant or deduction updates `CreditsRemain` and appends its
  `CreditLedger` row in the same SQL transaction.
- A deduction succeeds only when the committed balance is sufficient. Failed,
  rejected, or rolled-back actions do not change the balance.
- Logout and session expiry do not update `CreditsRemain`. Client-provided
  balances are never written to this column.
- `TotalCharged` cannot be negative.
- Customer must be at least 18 years old.
- `EmailNormalized` must be unique for normal customer accounts.
- Only `Seed = 0` uses normal customer login. `Seed = 1` is operated through an
  assigned employee; `Seed = 2` uses the autonomous robot-customer runtime.
- Card details are not stored directly in this table.
- `PasswordHash` is the platform login credential hash; no plain `Password` value is stored.

## SeedProfileProvenance

Purpose: records generation rights, originality review, and publication approval for each seed profile.

| Column | Draft type | Null | Key/default | Description |
|---|---|---:|---|---|
| SeedProfileProvenanceId | uniqueidentifier | No | PK | Provenance record |
| CustomerId | uniqueidentifier | No | FK, unique | Seed CustomerProfile |
| CreationSource | nvarchar(30) | No |  | SystemAutomatic/AdminFull/AdminAssisted |
| CreatedByEmployeeId | uniqueidentifier | Yes | FK | Administrator who initiated manual or assisted creation |
| AutoFilledFieldsJson | nvarchar(max) | No | Default `[]` | Exact profile fields generated by the system |
| GenerationBatchId | uniqueidentifier | No |  | Generation batch |
| AssetSourceType | nvarchar(30) | No |  | SystemGenerated/AdminProvided/Synthetic/LicensedModel/Commissioned |
| CharacterSpecVersion | nvarchar(50) | No |  | Structured character version |
| TextModelVersion | nvarchar(100) | Yes |  | Text generator/model |
| ImageModelVersion | nvarchar(100) | Yes |  | Image generator/model |
| PromptPolicyVersion | nvarchar(50) | No |  | Approved generation policy |
| RightsReference | nvarchar(500) | Yes |  | Restricted license/model-release reference |
| OriginalityCheckStatus | nvarchar(30) | No |  | Pending/Passed/Failed |
| AdultAppearanceCheckStatus | nvarchar(30) | No |  | Pending/Passed/Failed |
| HumanReviewStatus | nvarchar(30) | No |  | Pending/Approved/Rejected |
| ApprovedByEmployeeId | uniqueidentifier | Yes | FK | Independent reviewer |
| ApprovedTime | datetime2 | Yes | UTC | Approval time |
| ProfilePresentationVersion | nvarchar(50) | Yes |  | Published profile-presentation policy |
| GeneratedTime | datetime2 | No | UTC | Generation time |
| RetiredTime | datetime2 | Yes | UTC | Identity retirement time |
| Remark | nvarchar(1000) | Yes |  | Restricted review note |

Constraints:
- `CustomerId` may reference a generated customer with `Seed IN (1, 2)`.
- Admin-created robot profiles use `AdminFull` or `AdminAssisted`; automatic
  system creation uses `SystemAutomatic`.
- `AdminAssisted` provenance records every auto-filled field. `AdminFull`
  records any system-derived technical field, including birth date derived
  from entered age.
- Admin-created robot profiles begin inactive with pending reviews.
- A seed cannot be published until originality, adult-appearance, and human review statuses pass.
- Licensed or commissioned assets require a valid `RightsReference`.
- The generator cannot be the sole approving reviewer.
- Provenance does not permit copied or lightly altered real-person content.

## CustomerPaymentMethods

Purpose: stores tokenized customer payment methods without retaining prohibited card secrets.

| Column | Draft type | Null | Key/default | Description |
|---|---|---:|---|---|
| CustomerPaymentMethodId | uniqueidentifier | No | PK, system-generated | Saved payment method identifier |
| CustomerId | uniqueidentifier | No | FK | References CustomerProfile.CustomerId |
| PaymentProvider | nvarchar(50) | No |  | Payment processor |
| ProviderPaymentMethodToken | nvarchar(255) | No | Unique | Provider-issued token, not card number |
| BankName | nvarchar(150) | Yes |  | Card issuing bank |
| CardType | nvarchar(50) | Yes |  | Visa, Mastercard, etc. |
| CardLast4 | char(4) | Yes |  | Masked display digits |
| ExpirationMonth | tinyint | Yes |  | Month 1 through 12 |
| ExpirationYear | smallint | Yes |  | Four-digit expiration year |
| ExpireDue | date | Yes |  | Optional normalized expiration date |
| IsPrimary | bit | No | Default 0 | Preferred payment method |
| Active | bit | No | Default 1 | Method available for use |
| CreateTime | datetime2 | No | UTC default | Creation time |
| UpdateTime | datetime2 | No | UTC default | Last update |
| Remark | nvarchar(500) | Yes |  | Restricted internal note |

Constraints:
- Payment method belongs to exactly one customer.
- At most one active primary payment method per customer.
- Expiration month must be between 1 and 12.
- Expired cards cannot be used for new charges.
- Provider token must be unique when present.

Never stored:
- Full raw card number
- Security code, CVV, CVC, or `SecCode`
- Card PIN or card password
- Plain customer login password

## Table 2: Employees

Purpose: stores company workers and system/robot employees.

| Column | Draft type | Null | Key/default | Description |
|---|---|---:|---|---|
| EmployeeId | uniqueidentifier | No | PK, system-generated | Employee identifier |
| EmployeeType | nvarchar(20) | No | Human or Robot | Employee classification |
| PasswordHash | nvarchar(512) | Conditional |  | Human login password hash; robot credentials preferably managed externally |
| Sex | nvarchar(32) | Yes |  | Employee sex/gender |
| BirthDate | date | Yes |  | Human employee birth date |
| Education | nvarchar(250) | Yes |  | Education summary |
| WorkField | nvarchar(100) | Yes |  | Work department/category |
| StartDate | date | No |  | Employment/service start |
| LeaveDate | date | Yes |  | Employment/service end |
| Active | bit | No | Default 1 | Employee currently active |
| Remark | nvarchar(max) | Yes |  | Internal notes |
| Contribute | decimal(19,4) | No | Default 0 | Meaning/formula pending |
| TotalEarn | decimal(19,4) | No | Default 0 | Cached total employee earnings |
| GiftCreditsBalance | bigint | No | Default 0 | Cached employee gift-credit balance |
| Profile | nvarchar(max) | Yes |  | Employee profile/description |
| CreateTime | datetime2 | No | UTC default | Row creation time |
| UpdateTime | datetime2 | No | UTC default | Last update |

Constraints:
- `EmployeeType` must be Human or Robot.
- Human-only fields may be null for robot employees.
- Active human employees with direct login access must have a valid `PasswordHash`.
- Robot employees should use managed service credentials or workload identity instead of human passwords where possible.
- `LeaveDate` cannot precede `StartDate`.
- `TotalEarn` must reconcile with the future employee earnings ledger.
- `GiftCreditsBalance` must reconcile with EmployeeCreditLedger.
- Plain passwords must never be stored.

Sensitive bank/payment details are intentionally excluded and belong in `EmployeePaymentAccounts`.

## Table 3: ChatRecords

Purpose: stores every customer-to-customer chat record.

| Column | Draft type | Null | Key/default | Description |
|---|---|---:|---|---|
| ChatRecordId | uniqueidentifier | No | PK, system-generated | Message identifier |
| ChatTime | datetime2 | No | UTC default | Message time |
| SenderId | uniqueidentifier | No | FK | References CustomerProfile.CustomerId |
| ReceiverId | uniqueidentifier | No | FK | References CustomerProfile.CustomerId |
| Text | nvarchar(max) | Yes |  | Message text |
| Image | nvarchar(2048) | Yes |  | Picture URL/media ID or gift icon reference |
| CreditUsed | bigint | No | Default 0 | Credits consumed by this chat record |
| CreateTime | datetime2 | No | UTC default | Database creation time |

Constraints:
- `SenderId` cannot equal `ReceiverId`.
- At least one of `Text` or `Image` must be present.
- `CreditUsed` cannot be negative.
- Sender and receiver must exist in `CustomerProfile`.
- Allowed customer-type pairs are 0-0, 0-1, and 0-2 in either order.
- Conversations between two non-real profiles are prohibited.

Design notes:
- `Image` is a logical name supplied by the product requirement. It should store a reference, not raw image bytes.
- Customer-uploaded conversation pictures reference processed media whose width
  and height are each no greater than 100 pixels.
- Processed picture references use `image/jpeg` or `image/png`; other safely
  readable source formats are converted before the message is accepted.
- Voice messages reference an automatically transcoded and compressed media
  object; final duration and byte limits remain pending.
- A future `MessageType` column may distinguish text, picture, voice, gift, system, and other messages.
- A future `ConversationId` may group records efficiently.
- Credit charging needs an atomic relationship with `CreditLedger`.

## CustomerPresence

Purpose: stores the latest customer presence heartbeat and privacy-controlled online state.

| Column | Draft type | Null | Key/default | Description |
|---|---|---:|---|---|
| CustomerId | uniqueidentifier | No | PK/FK | CustomerProfile |
| PresenceState | nvarchar(20) | No | Offline | Online/RecentlyActive/Offline/Hidden |
| PresenceVisible | bit | No | Default 1 | Customer allows normal presence display |
| LastHeartbeatTime | datetime2 | Yes | UTC | Most recent authenticated activity heartbeat |
| LastOnlineTime | datetime2 | Yes | UTC | Most recent transition to online |
| LastOfflineTime | datetime2 | Yes | UTC | Most recent transition to offline |
| Version | bigint | No | Default 1 | Delta-update version |
| UpdateTime | datetime2 | No | UTC | Last state update |

Constraints:
- Blocked customers cannot see each other's presence.
- Presence is approximate and must not expose exact device activity or location.
- `Hidden` is returned when the customer disables presence visibility.
- A faster cache may serve live presence, but durable state and privacy settings remain controlled.

## ProfileInteractionRequests

Purpose: stores profile-level Hello, Cuddle, Hug, Flirt, Teasing, and SexRequest invitations.

| Column | Draft type | Null | Key/default | Description |
|---|---|---:|---|---|
| ProfileInteractionRequestId | uniqueidentifier | No | PK | Request identifier |
| SenderCustomerId | uniqueidentifier | No | FK | Request sender |
| ReceiverCustomerId | uniqueidentifier | No | FK | Request recipient |
| RequestType | nvarchar(20) | No |  | Hello/Cuddle/Hug/Flirt/Teasing/SexRequest |
| TemplateCode | nvarchar(80) | No |  | Approved request-template code |
| DisplayTextSnapshot | nvarchar(500) | No |  | Text shown/sent at request time |
| RequestStatus | nvarchar(20) | No | Pending | Pending/Accepted/Declined/Expired/Cancelled |
| SentTime | datetime2 | No | UTC | Creation time |
| ResponseTime | datetime2 | Yes | UTC | Accept/decline time |
| ExpireTime | datetime2 | No | UTC | Pending-request expiry |
| ProfilePresentationVersion | nvarchar(50) | Yes |  | Customer-facing presentation policy |
| SenderAdultVerified | bit | No | Default 0 | Snapshot for SexRequest |
| ReceiverAdultVerified | bit | No | Default 0 | Snapshot for SexRequest |
| CreditUsed | bigint | No | Default 0 | Approved request cost, if any |
| CreditLedgerId | uniqueidentifier | Yes | FK | Related ledger entry if charged |
| IdempotencyKey | nvarchar(100) | No | Unique by sender/route | Retry protection |
| CreateTime | datetime2 | No | UTC | Database creation |
| UpdateTime | datetime2 | No | UTC | Last update |

Constraints:
- Sender and receiver must be different active customers.
- Only one pending request may exist for the same sender/receiver pair.
- Blocked customers cannot exchange requests.
- `SexRequest` requires verified eligible adults and recipient preference eligibility.
- Accepting `SexRequest` does not itself create mutual intimate consent.
- No request can deduct an undisclosed credit cost.

## ProfileInteractionRequestTemplates

Purpose: stores approved, versioned customer-facing text choices for each profile request type.

| Column | Draft type | Null | Key/default | Description |
|---|---|---:|---|---|
| ProfileInteractionRequestTemplateId | uniqueidentifier | No | PK | Template identifier |
| TemplateCode | nvarchar(80) | No | Unique | Stable API code |
| RequestType | nvarchar(20) | No |  | Hello/Cuddle/Hug/Flirt/Teasing/SexRequest |
| LanguageCode | nvarchar(10) | No |  | Template language |
| DisplayText | nvarchar(500) | No |  | Approved customer-facing text |
| AdultVerificationRequired | bit | No | Default 0 | Required for intimate request |
| VirtualProfileAllowed | bit | No | Default 1 | May be used by/with virtual profile |
| ConfirmationRequired | bit | No | Default 0 | Additional confirmation |
| CreditCost | bigint | No | Default 0 | Configured cost after policy approval |
| Version | int | No | Default 1 | Template version |
| Active | bit | No | Default 1 | Available for selection |
| ApprovedByEmployeeId | uniqueidentifier | Yes | FK | Content approver |
| ApprovedTime | datetime2 | Yes | UTC | Approval time |
| CreateTime | datetime2 | No | UTC | Creation time |
| UpdateTime | datetime2 | No | UTC | Last update |

Constraints:
- Templates require content/safety approval before activation.
- SexRequest templates require adult verification and confirmation.
- Company-operated-profile templates cannot claim nearby presence, meetings,
  marriage, exclusivity, or false offline identity.
- Retiring a template does not alter historical request snapshots.

## ProfileVisits

Purpose: records eligible customer views of another customer's full profile.

| Column | Draft type | Null | Key/default | Description |
|---|---|---:|---|---|
| ProfileVisitId | uniqueidentifier | No | PK | Visit summary identifier |
| VisitedCustomerId | uniqueidentifier | No | FK | Profile owner |
| VisitorCustomerId | uniqueidentifier | No | FK | Customer who opened profile |
| FirstVisitTime | datetime2 | No | UTC | First eligible visit |
| LastVisitTime | datetime2 | No | UTC | Most recent eligible visit |
| VisitCount | int | No | Default 1 | Collapsed visit count |
| VisitorVisible | bit | No | Default 1 | Visibility under privacy policy |
| LastProfileType | nvarchar(20) | No |  | Real/Virtual snapshot |
| CreateTime | datetime2 | No | UTC | Creation time |
| UpdateTime | datetime2 | No | UTC | Last update |

Constraints:
- Self-views are not recorded.
- Blocked relationships are not visible and may not be recorded.
- Admin, moderation, support, safety, robot, and automated service access never creates a customer-visible visit.
- Repeated views may update one summary row rather than create notification spam.
- Visitor visibility follows customer privacy policy and legal requirements.

## Table 4: EmployeeSeed

Purpose: assigns responsibility for an AI/system-generated seed customer to a human or robot employee.

| Column | Draft type | Null | Key/default | Description |
|---|---|---:|---|---|
| EmployeeSeedId | uniqueidentifier | No | PK, system-generated | Assignment identifier |
| EmployeeId | uniqueidentifier | No | FK | References Employees.EmployeeId |
| CustomerId | uniqueidentifier | No | FK | References CustomerProfile.CustomerId |
| Active | bit | No | Default 1 | Current assignment |
| ActiveEndTime | datetime2 | Yes |  | Time assignment ended |
| Country | nvarchar(100) | No |  | Denormalized country |
| State | nvarchar(100) | Yes |  | Denormalized state/province |
| City | nvarchar(120) | No |  | Denormalized large city |
| CreateTime | datetime2 | No | UTC default | Assignment creation |
| UpdateTime | datetime2 | No | UTC default | Last update |

Constraints:
- Assigned customer must have `CustomerProfile.Seed = 1`.
- Robot customers (`Seed = 2`) cannot be assigned to an employee.
- One seed customer can have only one active assignment.
- `ActiveEndTime` should be null for an active assignment.
- When `Active = 0`, `ActiveEndTime` should be populated.

Capacity rules:
- All seed customer profiles are generated by AI before product deployment.
- Only approved large cities can contain seed customers.
- One employee is assigned up to 1,000 seed customers.
- One large city contains 100 active seed customers.
- Each city contains 80 female and 20 male seed customers.
- At most 20 assigned seed profiles are active online for an employee at one time.
- At most 10 real-customer conversations are handled simultaneously by an employee.
- Each seed profile may be online for at most two hours per day.

Design limitation:
- The earlier rule of 20 cities times 100 seeds equals 2,000 seeds and conflicts with the newer 1,000-seed employee limit.
- The final city-to-employee allocation must be clarified before schema approval.

## SeedWorkAssignments

Purpose: records active and historical employee/robot assignments for
internally classified seed-profile conversations.

| Column | Draft type | Null | Key/default | Description |
|---|---|---:|---|---|
| SeedWorkAssignmentId | uniqueidentifier | No | PK | Runtime assignment identifier |
| EmployeeId | uniqueidentifier | No | FK | Human or robot employee |
| SeedCustomerId | uniqueidentifier | No | FK | Seed CustomerProfile |
| RealCustomerId | uniqueidentifier | No | FK | Real CustomerProfile |
| ChatRecordId | uniqueidentifier | Yes | FK | Current/starting chat record |
| AssignmentTime | datetime2 | No | UTC | Scheduler assignment time |
| StartTime | datetime2 | Yes | UTC | Work start time |
| EndTime | datetime2 | Yes | UTC | Work end time |
| AssignmentStatus | nvarchar(30) | No | Assigned/Active/Transferred/Completed/Failed | State |
| WorkerType | nvarchar(20) | No | Human/Robot | Worker snapshot |
| ResponseSource | nvarchar(30) | Yes | Employee/PreparedText/AIAssisted/Robot | Last response source |
| DisclosureConfirmed | bit | No | Default 0 | Deprecated; retained for migration compatibility |
| CreateTime | datetime2 | No | UTC | Creation time |
| UpdateTime | datetime2 | No | UTC | Last update |

## SeedDailyActivity

Purpose: tracks one seed profile's daily online duration.

| Column | Draft type | Null | Key/default | Description |
|---|---|---:|---|---|
| SeedDailyActivityId | uniqueidentifier | No | PK | Daily activity identifier |
| SeedCustomerId | uniqueidentifier | No | FK | Seed CustomerProfile |
| BusinessDate | date | No | Unique with seed | Activity date |
| OnlineSeconds | int | No | Default 0 | Maximum 7,200 |
| FirstOnlineTime | datetime2 | Yes | UTC | First online time |
| LastOfflineTime | datetime2 | Yes | UTC | Last offline time |
| Active | bit | No | Default 0 | Currently online |
| CreateTime | datetime2 | No | UTC | Creation time |
| UpdateTime | datetime2 | No | UTC | Last update |

## RobotCityCoverage

Purpose: defines robot-customer inventory and required online coverage for one
administrator-approved large city.

| Column | Draft type | Null | Key/default | Description |
|---|---|---:|---|---|
| RobotCityCoverageId | uniqueidentifier | No | PK | Coverage-city identifier |
| CountryCode | char(2) | No |  | Country |
| StateId | nvarchar(100) | Yes |  | State/province |
| CityName | nvarchar(120) | No | Unique with country/state | Approved large city |
| TimeZoneId | nvarchar(100) | No |  | IANA/Windows-mapped city timezone |
| MinimumManProfiles | tinyint | No | Default 3 | Required Man robot inventory |
| MinimumWomanProfiles | tinyint | No | Default 3 | Required Woman robot inventory |
| RequiredOnlineMan | tinyint | No | Default 1 | Minimum online Man robots |
| RequiredOnlineWoman | tinyint | No | Default 1 | Minimum online Woman robots |
| CoverageStatus | nvarchar(30) | No |  | Draft/InventoryReady/CoverageReady/Degraded/Paused |
| Active | bit | No | Default 1 | City coverage enabled |
| CreateTime | datetime2 | No | UTC | Creation time |
| UpdateTime | datetime2 | No | UTC | Last update |

## RobotShiftSchedule

Purpose: stores planned and actual shifts for autonomous robot customers.

| Column | Draft type | Null | Key/default | Description |
|---|---|---:|---|---|
| RobotShiftScheduleId | uniqueidentifier | No | PK | Shift identifier |
| RobotCityCoverageId | uniqueidentifier | No | FK | Assigned coverage city |
| RobotCustomerId | uniqueidentifier | No | FK | `CustomerProfile.Seed = 2` |
| BusinessDate | date | No | City local date | Shift business date |
| SexSnapshot | nvarchar(32) | No |  | Sex used for coverage calculation |
| TimeZoneIdSnapshot | nvarchar(100) | No |  | City timezone used when planned |
| StartUtcOffsetMinutes | smallint | No |  | Local offset at planned start |
| EndUtcOffsetMinutes | smallint | No |  | Local offset at planned end |
| PlannedStartTime | datetime2 | No | UTC | Planned shift start |
| PlannedEndTime | datetime2 | No | UTC | Planned shift end |
| ActualStartTime | datetime2 | Yes | UTC | Actual online start |
| ActualEndTime | datetime2 | Yes | UTC | Actual offline end |
| ShiftStatus | nvarchar(30) | No |  | Planned/Active/Completed/Failed/Replaced/Cancelled |
| IsReserve | bit | No | Default 0 | Reserve/overflow assignment |
| ReplacedShiftId | uniqueidentifier | Yes | FK | Failed shift replaced |
| ScheduledTaskRunId | uniqueidentifier | Yes | FK | Planner/activation run |
| FailureCode | nvarchar(100) | Yes |  | Failure category |
| CreateTime | datetime2 | No | UTC | Creation time |
| UpdateTime | datetime2 | No | UTC | Last update |

## RobotDailyActivity

Purpose: authoritatively enforces the eight-hour local-day work limit.

| Column | Draft type | Null | Key/default | Description |
|---|---|---:|---|---|
| RobotDailyActivityId | uniqueidentifier | No | PK | Daily activity identifier |
| RobotCustomerId | uniqueidentifier | No | FK, unique with date/city | Robot customer |
| RobotCityCoverageId | uniqueidentifier | No | FK | Coverage city |
| BusinessDate | date | No | City local date | Activity date |
| OnlineSeconds | int | No | Default 0, max 28,800 | Customer-visible work time |
| FirstOnlineTime | datetime2 | Yes | UTC | First online time |
| LastOfflineTime | datetime2 | Yes | UTC | Last offline time |
| Active | bit | No | Default 0 | Currently online and chat-eligible |
| CreateTime | datetime2 | No | UTC | Creation time |
| UpdateTime | datetime2 | No | UTC | Last update |

Robot coverage constraints:
- Every active coverage city requires at least three approved Man and three
  approved Woman robot profiles.
- A robot profile belongs to one coverage city at a time.
- `OnlineSeconds` cannot exceed 28,800.
- Shifts for one robot cannot overlap.
- A `CoverageReady` city requires eligible same-sex reserve or approved
  regional overflow capacity in addition to the six-profile minimum.
- Scheduled handoff and failover commands are idempotent and audited.

## RobotAIUsage

Purpose: records outside language-model use by robot customers without placing
full prompts or provider credentials in operational logs.

| Column | Draft type | Null | Key/default | Description |
|---|---|---:|---|---|
| RobotAIUsageId | uniqueidentifier | No | PK | Usage attempt |
| RobotCustomerId | uniqueidentifier | No | FK | `CustomerProfile.Seed = 2` |
| ConversationId | uniqueidentifier | No | FK | Exact real/robot conversation |
| IncomingChatRecordId | uniqueidentifier | No | FK | Customer message being answered |
| OutgoingChatRecordId | uniqueidentifier | Yes | FK | Accepted robot reply |
| Provider | nvarchar(50) | No |  | Approved provider |
| Model | nvarchar(100) | No |  | Pinned model snapshot |
| RobotAIPolicyVersion | nvarchar(50) | No |  | Active global policy |
| ResponseMode | nvarchar(30) | No |  | Local/Prepared/External/Fallback/Escalated |
| InputTokens | int | No | Default 0 | Provider-reported input |
| CachedInputTokens | int | No | Default 0 | Provider-reported cached input |
| OutputTokens | int | No | Default 0 | Provider-reported output |
| EstimatedCost | decimal(18,6) | No | Default 0 | Snapshotted estimated provider cost |
| CurrencyCode | char(3) | No | Default USD | Cost currency |
| LatencyMilliseconds | int | Yes |  | Outside-call duration |
| UsageStatus | nvarchar(30) | No |  | Accepted/Failed/Rejected/Discarded/Fallback |
| ErrorCode | nvarchar(100) | Yes |  | Structured failure category |
| SafetyResult | nvarchar(30) | No |  | Safety evaluation |
| LocalValidationResult | nvarchar(30) | No |  | Final local validation |
| CorrelationId | nvarchar(100) | No |  | Trace without prompt content |
| CreateTime | datetime2 | No | UTC | Attempt time |

Constraints:
- A robot usage row may reference only a robot customer and a real-customer conversation.
- `LocalOnly` policy rejects outside-provider attempts.
- Stale policy-version or conversation-version results cannot create an outgoing message.
- Provider credentials and full prompts are never stored in this table.

## Table 5: ChargeRecord

Purpose: records each customer credit purchase charge.

| Column | Draft type | Null | Key/default | Description |
|---|---|---:|---|---|
| ChargeRecordId | uniqueidentifier | No | PK, system-generated | Charge identifier |
| ChargeTime | datetime2 | No | UTC | Provider-confirmed charge time |
| Amount | decimal(19,4) | No |  | Charged monetary amount |
| CurrencyCode | char(3) | No |  | ISO currency code |
| CreditsBought | bigint | No |  | Credits purchased |
| CardholderName | nvarchar(120) | Yes |  | Cardholder-name snapshot |
| CardType | nvarchar(50) | Yes |  | Card network/type snapshot |
| CardLast4 | char(4) | Yes |  | Masked card-number snapshot |
| ExpirationMonth | tinyint | Yes |  | Expiration month snapshot |
| ExpirationYear | smallint | Yes |  | Expiration year snapshot |
| BankName | nvarchar(150) | Yes |  | Issuing bank snapshot |
| CustomerId | uniqueidentifier | No | FK | References CustomerProfile.CustomerId |
| CustomerPaymentMethodId | uniqueidentifier | Yes | FK | Saved payment method used |
| FirstName | nvarchar(100) | No |  | Billing-name snapshot |
| LastName | nvarchar(100) | No |  | Billing-name snapshot |
| PaymentProvider | nvarchar(50) | No |  | Payment processor |
| ProviderTransactionId | nvarchar(255) | No | Unique | Provider transaction reference |
| ChargeStatus | nvarchar(30) | No |  | Pending, Succeeded, Failed, Refunded, Disputed |
| CreateTime | datetime2 | No | UTC default | Row creation time |
| Remark | nvarchar(500) | Yes |  | Restricted reconciliation note |

Constraints:
- `Amount` and `CreditsBought` must be greater than zero for a purchase.
- Full card number and card secrets are never stored.
- Security codes are validated for the payment attempt and immediately discarded.
- Credits are granted once for each successfully confirmed provider transaction.
- Provider transaction handling must be idempotent.

## Table 6: CompanyDayMake

Purpose: summarizes daily company money made and credits consumed.

| Column | Draft type | Null | Key/default | Description |
|---|---|---:|---|---|
| CompanyDayMakeId | uniqueidentifier | No | PK, system-generated | Daily summary identifier |
| BusinessDate | date | No | Unique with currency | Date being summarized |
| DateTime | datetime2 | No | UTC | Summary execution time |
| MoneyMake | decimal(19,4) | No | Default 0 | Daily qualifying money made |
| CreditsConsumed | bigint | No | Default 0 | Daily credits consumed |
| CurrencyCode | char(3) | No |  | Reporting currency |
| CalculationStartTime | datetime2 | No |  | Included period start |
| CalculationEndTime | datetime2 | No |  | Included period end |
| CreateTime | datetime2 | No | UTC default | Row creation time |
| RecalculatedTime | datetime2 | Yes |  | Last controlled recalculation |
| Remark | nvarchar(500) | Yes |  | Reconciliation note |

Constraints:
- One row per business date and currency.
- The scheduled job runs at midnight (`12:00 AM`) in the configured reporting timezone.
- Money and credit totals must be reproducible from source records.

## Table 7: EmployeeMonthReport

Purpose: summarizes monthly money, credits, and salary for one employee.

| Column | Draft type | Null | Key/default | Description |
|---|---|---:|---|---|
| EmployeeMonthReportId | uniqueidentifier | No | PK, system-generated | Report identifier |
| ReportMonth | date | No | First day of month | Month being summarized |
| DateTime | datetime2 | No | UTC | Report generation time |
| EmployeeId | uniqueidentifier | No | FK | References Employees.EmployeeId |
| TotalMake | decimal(19,4) | No | Default 0 | Money attributed to employee |
| CreditsUsed | bigint | No | Default 0 | Credits attributed to employee |
| GiftCreditsEarned | bigint | No | Default 0 | Seed-recipient gift credits awarded to employee |
| Salary | decimal(19,4) | No | Default 0 | Calculated salary |
| SalaryRate | decimal(19,6) | No | Default 0.30 | Employee reward rate |
| PaidTime | datetime2 | Yes |  | Salary payment time |
| EmployeePaymentAccountId | uniqueidentifier | Yes | FK | Restricted payout account reference |
| CardLast4 | char(4) | Yes |  | Payment-method snapshot |
| BankName | nvarchar(150) | Yes |  | Payment-bank snapshot |
| CurrencyCode | char(3) | No |  | Report currency |
| ReportStatus | nvarchar(30) | No | Draft/Final/Paid/Corrected | Report lifecycle |
| CreateTime | datetime2 | No | UTC default | Row creation time |
| RecalculatedTime | datetime2 | Yes |  | Last controlled recalculation |
| Remark | nvarchar(500) | Yes |  | Internal report note |

Constraints:
- One official report per employee, month, and currency.
- Full card numbers and card secrets are never stored.
- A report cannot become Paid without `PaidTime`.
- Salary is provisionally 30% of eligible attributed revenue.
- `GiftCreditsEarned` must reconcile with EmployeeCreditLedger for the report month.
- Salary must be reproducible from the approved revenue basis and source totals.

## Table 8: CompanyMonthReport

Purpose: summarizes monthly company money and employee salary payments.

| Column | Draft type | Null | Key/default | Description |
|---|---|---:|---|---|
| CompanyMonthReportId | uniqueidentifier | No | PK, system-generated | Monthly report identifier |
| ReportMonth | date | No | First day of month | Month being summarized |
| DateTime | datetime2 | No | UTC | Report generation time |
| TotalMoney | decimal(19,4) | No | Default 0 | Sum from CompanyDayMake |
| TotalPaid | decimal(19,4) | No | Default 0 | Paid employee salary total |
| CurrencyCode | char(3) | No |  | Report currency |
| CreateTime | datetime2 | No | UTC default | Row creation time |
| RecalculatedTime | datetime2 | Yes |  | Last controlled recalculation |
| Remark | nvarchar(500) | Yes |  | Reconciliation note |

Constraints:
- One report per month and currency.
- `TotalMoney` reconciles to CompanyDayMake rows.
- `TotalPaid` reconciles to EmployeeMonthReport rows with paid status.
- Source reports cannot be silently changed after a monthly report is finalized.

## Table 9: AdvertisementRecord

Purpose: records each paid advertisement or advertising campaign placement.

| Column | Draft type | Null | Key/default | Description |
|---|---|---:|---|---|
| AdvertisementRecordId | uniqueidentifier | No | PK, system-generated | Advertisement payment identifier |
| DateTime | datetime2 | No | UTC | Payment or record time |
| FeePaid | decimal(19,4) | No |  | Advertisement fee paid |
| CurrencyCode | char(3) | No |  | ISO currency code |
| MediaName | nvarchar(200) | No |  | Advertising platform or publisher |
| TimeStart | datetime2 | No | UTC | Advertisement start time |
| TimeEnd | datetime2 | No | UTC | Advertisement end time |
| AdvertisementStatus | nvarchar(30) | No | Planned/Active/Ended/Cancelled | Campaign state |
| ProviderInvoiceId | nvarchar(255) | Yes |  | Media-provider invoice |
| PaymentReference | nvarchar(255) | Yes |  | Payment transaction reference |
| Comments | nvarchar(max) | Yes |  | Advertisement notes |
| CreateTime | datetime2 | No | UTC default | Row creation time |
| UpdateTime | datetime2 | No | UTC default | Last update |

Constraints:
- `FeePaid` cannot be negative.
- `TimeEnd` cannot precede `TimeStart`.
- Paid financial values and references require an audit trail.

## Table 10: CloudService

Purpose: records paid cloud services and infrastructure capacity used by DatingEasy888.

| Column | Draft type | Null | Key/default | Description |
|---|---|---:|---|---|
| CloudServiceId | uniqueidentifier | No | PK, system-generated | Cloud-service record identifier |
| DateTime | datetime2 | No | UTC | Payment or record time |
| AmountPaid | decimal(19,4) | No |  | Amount paid for service period |
| CurrencyCode | char(3) | No |  | ISO currency code |
| CloudProvider | nvarchar(150) | No |  | Company supplying the cloud service |
| ServiceName | nvarchar(200) | Yes |  | Plan, product, or resource name |
| StartTime | datetime2 | No | UTC | Paid service-period start |
| EndTime | datetime2 | No | UTC | Paid service-period end |
| CPU | nvarchar(100) | Yes |  | CPU allocation; units pending |
| Memory | nvarchar(100) | Yes |  | Memory allocation; units pending |
| DiskSpace | nvarchar(100) | Yes |  | Storage allocation; units pending |
| NetRate | nvarchar(100) | Yes |  | Network rate; units pending |
| IPs | nvarchar(500) | Yes |  | Allocated IP summary/reference |
| DataBase | nvarchar(250) | Yes |  | Database service/capacity |
| Backup | nvarchar(250) | Yes |  | Backup service or backup capacity |
| ProviderInvoiceId | nvarchar(255) | Yes |  | Cloud-provider invoice |
| PaymentReference | nvarchar(255) | Yes |  | Payment transaction reference |
| ServiceStatus | nvarchar(30) | No | Planned/Active/Ended/Cancelled | Service state |
| Comments | nvarchar(max) | Yes |  | Operational notes |
| CreateTime | datetime2 | No | UTC default | Row creation time |
| UpdateTime | datetime2 | No | UTC default | Last update |

Constraints:
- `AmountPaid` cannot be negative.
- `EndTime` cannot precede `StartTime`.
- Credentials, passwords, access keys, connection strings, and private keys are prohibited.
- Infrastructure units must be standardized before implementation.

## Proposed Supporting Tables

The confirmed administrator workflows require persistent scheduled-task and year-end-report data. Their final table numbers remain pending.

### MediaAsset
- Stores MediaAssetId, owner/reference type, original detected content type,
  processed content type, processed width/height, processed byte size, storage
  reference, processing status, malware/safety result, and timestamps.
- A successfully processed picture has content type `image/jpeg` or `image/png`.
- The original filename or extension is not trusted as the detected type.
- Original uploads are quarantined and removed after processing unless a
  retention rule requires temporary preservation.
- Public and chat records reference the processed derivative, not the original upload.

### ScheduledTask
- Stores task name/type, schedule, timezone, enabled state, concurrency rule, retry policy, timeout, owner, last run, and next run.
- Supports daily, monthly, annual, seed-operation, robot, security, and maintenance jobs.

### ScheduledTaskRun
- Stores every run and retry with start/end times, status, attempt, trigger, error, and result.
- Provides operational history and audit evidence.

### CompanyYearReport
- Stores annual revenue, employee payments, advertising costs, cloud-service costs, credits purchased/consumed, refunds, and chargebacks.
- Is generated from finalized monthly and approved expense records.
- Supports draft, final, corrected, and approved states.

### PolicyDefinition
- Stores stable policy key, category, description, data type, schema, safe
  minimum/maximum or allowed values, scope model, customer-notice rule, emergency
  disable eligibility, and owning module.
- Contains no secret values or executable code.
- Policy key is unique and is not reused for a different meaning.

### PolicyVersion
- Stores immutable policy values, status, version number, scope, author, reason,
  created time, effective time, retired time, source version, and content hash.
- Status values include Draft, Scheduled, Active, Superseded, Retired, RolledBack, and Cancelled.
- Only one version may be active for a policy key and scope at a given time.
- Publishing or rollback creates a new row; published rows are never updated in place.
- Completed transactions and operational records store the applicable
  `PolicyVersionId` when a configurable rule affects their result.

### PolicyPropagationStatus
- Stores policy version, consuming service/job, reported version, status, check
  time, and failure detail.
- Supports the Admin UI propagation-health panel and alerts when services do not
  agree on the active version.

## Credit And Gift Supporting Tables

### CreditLedger
- Append-only transaction history for purchases, registration rewards, message charges, media charges, gifts, refunds, chargebacks, and corrections.
- Links each credit change to its ChargeRecord, ChatRecord, GiftTransaction, related customer, or employee when applicable.
- Stores `CreditsChange` and `BalanceAfter`.
- `BalanceAfter` must equal the `CustomerProfile.CreditsRemain` value committed
  by the same transaction.

### GiftCatalog

| Gift | Cost | Recipient receives | Platform retains |
|---|---:|---:|---:|
| Flower | 100 | 80 | 20 |
| Silver | 200 | 160 | 40 |
| Gold | 500 | 400 | 100 |
| Diamond | 1,000 | 800 | 200 |
| Big Rocket | 10,000 | 8,000 | 2,000 |

### GiftTransactions
- Stores sender, receiver, seed flag, gift, sender cost, recipient 80% credit
  grant, platform 20% share, chat link, snapshotted overseeing EmployeeId,
  EmployeeSeed assignment reference, policy version, final status, and timestamps.
- All related ledger changes must be committed atomically.
- Successfully sent gifts are non-refundable and have no normal reversal state.
- Later seed reassignment does not change `OverseeingEmployeeId`.

### EmployeeCreditLedger
- Append-only source of truth for credits awarded to an employee record.
- Stores EmployeeCreditLedgerId, EmployeeId, GiftTransactionId, CreditsChange,
  BalanceAfter, transaction type, policy version, create time, and remark.
- Seed-recipient gifts add the 80% recipient share to the overseeing employee
  snapshotted by GiftTransactions.
- Human and robot employee attribution can be recorded; future redemption or
  payout eligibility is a separate policy.
- Customer credit balances and employee credit balances are never combined.
