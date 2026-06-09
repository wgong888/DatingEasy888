PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS CustomerProfile (
    CustomerId TEXT PRIMARY KEY,
    Email TEXT NOT NULL UNIQUE,
    EmailNormalized TEXT NOT NULL UNIQUE,
    Phone TEXT,
    PasswordHash TEXT NOT NULL,
    MustChangePassword INTEGER NOT NULL DEFAULT 0 CHECK (MustChangePassword IN (0, 1)),
    DisplayName TEXT NOT NULL,
    BirthDate TEXT NOT NULL,
    Sex TEXT NOT NULL,
    GenderLookingFor TEXT,
    CountryCode TEXT NOT NULL DEFAULT 'US',
    StateId TEXT,
    CityName TEXT NOT NULL,
    MaritalStatus TEXT,
    WorkField TEXT,
    EnglishLevel TEXT,
    LanguagesJson TEXT NOT NULL DEFAULT '[]',
    TraitsJson TEXT NOT NULL DEFAULT '[]',
    InterestsJson TEXT NOT NULL DEFAULT '[]',
    MoviePreferencesJson TEXT NOT NULL DEFAULT '[]',
    MusicPreferencesJson TEXT NOT NULL DEFAULT '[]',
    GoalsJson TEXT NOT NULL DEFAULT '[]',
    PreferredAgeMin INTEGER CHECK (PreferredAgeMin IS NULL OR PreferredAgeMin >= 18),
    PreferredAgeMax INTEGER CHECK (PreferredAgeMax IS NULL OR PreferredAgeMax >= 18),
    PersonalityType TEXT,
    Story TEXT,
    Bio TEXT,
    ProfilePhoto TEXT NOT NULL DEFAULT '/assets/profiles/default-neutral.svg',
    PublicPhotosJson TEXT NOT NULL DEFAULT '[]',
    PrivatePhotosJson TEXT NOT NULL DEFAULT '[]',
    ProfileCompleted INTEGER NOT NULL DEFAULT 0 CHECK (ProfileCompleted IN (0, 1)),
    ProfileCompleteness INTEGER NOT NULL DEFAULT 0 CHECK (ProfileCompleteness BETWEEN 0 AND 100),
    CreateTime TEXT NOT NULL,
    UpdateTime TEXT NOT NULL,
    LastLoginTime TEXT,
    Active INTEGER NOT NULL DEFAULT 1 CHECK (Active IN (0, 1)),
    Seed INTEGER NOT NULL DEFAULT 0 CHECK (Seed IN (0, 1, 2)),
    CreditsRemain INTEGER NOT NULL DEFAULT 0 CHECK (CreditsRemain >= 0),
    TotalCharged REAL NOT NULL DEFAULT 0 CHECK (TotalCharged >= 0),
    Remark TEXT
);

CREATE TABLE IF NOT EXISTS Employees (
    EmployeeId TEXT PRIMARY KEY,
    Email TEXT NOT NULL UNIQUE,
    PasswordHash TEXT NOT NULL,
    DisplayName TEXT NOT NULL,
    EmployeeType TEXT NOT NULL DEFAULT 'Human',
    Role TEXT NOT NULL,
    Active INTEGER NOT NULL DEFAULT 1 CHECK (Active IN (0, 1)),
    StartDate TEXT NOT NULL,
    LastLoginTime TEXT,
    Remark TEXT
);

CREATE TABLE IF NOT EXISTS PasswordResetRequests (
    PasswordResetRequestId TEXT PRIMARY KEY,
    CustomerId TEXT NOT NULL REFERENCES CustomerProfile(CustomerId),
    RequestedName TEXT NOT NULL,
    ContactType TEXT NOT NULL CHECK (ContactType IN ('Email', 'Phone')),
    ContactValueMasked TEXT NOT NULL,
    Status TEXT NOT NULL CHECK (Status IN ('Pending', 'Approved', 'Rejected', 'AutoApproved')),
    RequestTime TEXT NOT NULL,
    DecisionTime TEXT,
    DecidedByEmployeeId TEXT REFERENCES Employees(EmployeeId),
    DeliveryChannel TEXT,
    Remark TEXT
);

CREATE TABLE IF NOT EXISTS PolicyDefinitions (
    PolicyId TEXT PRIMARY KEY,
    PolicyKey TEXT NOT NULL UNIQUE,
    Title TEXT NOT NULL,
    Description TEXT NOT NULL,
    PolicyValue TEXT NOT NULL,
    Active INTEGER NOT NULL DEFAULT 1 CHECK (Active IN (0, 1)),
    Version INTEGER NOT NULL DEFAULT 1 CHECK (Version > 0),
    CreateTime TEXT NOT NULL,
    UpdateTime TEXT NOT NULL,
    UpdatedByEmployeeId TEXT REFERENCES Employees(EmployeeId)
);

CREATE TABLE IF NOT EXISTS OutgoingPaymentRequests (
    OutgoingPaymentRequestId TEXT PRIMARY KEY,
    PayeeName TEXT NOT NULL,
    Category TEXT NOT NULL,
    Amount REAL NOT NULL CHECK (Amount > 0),
    CurrencyCode TEXT NOT NULL DEFAULT 'USD',
    Description TEXT NOT NULL,
    Status TEXT NOT NULL CHECK (Status IN ('Pending', 'Approved', 'Denied')),
    RequestTime TEXT NOT NULL,
    RequestedByEmployeeId TEXT NOT NULL REFERENCES Employees(EmployeeId),
    DecisionTime TEXT,
    DecidedByEmployeeId TEXT REFERENCES Employees(EmployeeId),
    DecisionRemark TEXT
);

CREATE TABLE IF NOT EXISTS Sessions (
    SessionId TEXT PRIMARY KEY,
    PrincipalType TEXT NOT NULL,
    PrincipalId TEXT NOT NULL,
    Role TEXT NOT NULL,
    CreateTime TEXT NOT NULL,
    LastActivityTime TEXT NOT NULL,
    ExpireTime TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS CustomerFavorites (
    CustomerId TEXT NOT NULL REFERENCES CustomerProfile(CustomerId),
    TargetCustomerId TEXT NOT NULL REFERENCES CustomerProfile(CustomerId),
    CreateTime TEXT NOT NULL,
    PRIMARY KEY (CustomerId, TargetCustomerId),
    CHECK (CustomerId <> TargetCustomerId)
);

CREATE TABLE IF NOT EXISTS Conversations (
    ConversationId TEXT PRIMARY KEY,
    CustomerAId TEXT NOT NULL REFERENCES CustomerProfile(CustomerId),
    CustomerBId TEXT NOT NULL REFERENCES CustomerProfile(CustomerId),
    CreateTime TEXT NOT NULL,
    UpdatedAt TEXT NOT NULL,
    UNIQUE (CustomerAId, CustomerBId),
    CHECK (CustomerAId < CustomerBId)
);

CREATE TABLE IF NOT EXISTS ChatRecords (
    ChatRecordId TEXT PRIMARY KEY,
    ConversationId TEXT NOT NULL REFERENCES Conversations(ConversationId),
    ChatTime TEXT NOT NULL,
    SenderId TEXT NOT NULL REFERENCES CustomerProfile(CustomerId),
    ReceiverId TEXT NOT NULL REFERENCES CustomerProfile(CustomerId),
    Text TEXT NOT NULL,
    MessageType TEXT NOT NULL DEFAULT 'Text',
    CreditUsed INTEGER NOT NULL DEFAULT 0 CHECK (CreditUsed >= 0),
    ActingEmployeeId TEXT REFERENCES Employees(EmployeeId),
    ResponseSource TEXT,
    PreparedTextId TEXT,
    CHECK (SenderId <> ReceiverId)
);

CREATE TABLE IF NOT EXISTS CreditLedger (
    CreditLedgerId TEXT PRIMARY KEY,
    CustomerId TEXT NOT NULL REFERENCES CustomerProfile(CustomerId),
    TransactionTime TEXT NOT NULL,
    TransactionType TEXT NOT NULL,
    CreditsChange INTEGER NOT NULL,
    BalanceAfter INTEGER NOT NULL CHECK (BalanceAfter >= 0),
    ReferenceType TEXT,
    ReferenceId TEXT,
    Remark TEXT
);

CREATE TABLE IF NOT EXISTS ChargeRecord (
    ChargeRecordId TEXT PRIMARY KEY,
    CustomerId TEXT NOT NULL REFERENCES CustomerProfile(CustomerId),
    ChargeTime TEXT NOT NULL,
    Amount REAL NOT NULL CHECK (Amount > 0),
    CreditsBought INTEGER NOT NULL CHECK (CreditsBought > 0),
    Status TEXT NOT NULL,
    ProviderReference TEXT,
    CardholderName TEXT,
    CardType TEXT,
    CardLast4 TEXT,
    ExpirationMonth INTEGER CHECK (ExpirationMonth IS NULL OR ExpirationMonth BETWEEN 1 AND 12),
    ExpirationYear INTEGER
);

CREATE TABLE IF NOT EXISTS GiftTransactions (
    GiftTransactionId TEXT PRIMARY KEY,
    ConversationId TEXT NOT NULL REFERENCES Conversations(ConversationId),
    ChatRecordId TEXT NOT NULL UNIQUE REFERENCES ChatRecords(ChatRecordId),
    SenderCustomerId TEXT NOT NULL REFERENCES CustomerProfile(CustomerId),
    ReceiverCustomerId TEXT NOT NULL REFERENCES CustomerProfile(CustomerId),
    GiftId INTEGER NOT NULL,
    GiftName TEXT NOT NULL,
    SenderCost INTEGER NOT NULL CHECK (SenderCost > 0),
    RecipientCredits INTEGER NOT NULL CHECK (RecipientCredits >= 0),
    PlatformCredits INTEGER NOT NULL CHECK (PlatformCredits >= 0),
    OverseeingEmployeeId TEXT REFERENCES Employees(EmployeeId),
    CreateTime TEXT NOT NULL,
    CHECK (SenderCost = RecipientCredits + PlatformCredits)
);

CREATE TABLE IF NOT EXISTS EmployeeCreditLedger (
    EmployeeCreditLedgerId TEXT PRIMARY KEY,
    EmployeeId TEXT NOT NULL REFERENCES Employees(EmployeeId),
    GiftTransactionId TEXT NOT NULL UNIQUE REFERENCES GiftTransactions(GiftTransactionId),
    TransactionTime TEXT NOT NULL,
    CreditsChange INTEGER NOT NULL CHECK (CreditsChange > 0),
    BalanceAfter INTEGER NOT NULL CHECK (BalanceAfter >= 0),
    Remark TEXT
);

CREATE TABLE IF NOT EXISTS EmployeeSeed (
    EmployeeId TEXT NOT NULL REFERENCES Employees(EmployeeId),
    CustomerId TEXT NOT NULL REFERENCES CustomerProfile(CustomerId),
    Active INTEGER NOT NULL DEFAULT 1 CHECK (Active IN (0, 1)),
    ActiveEndTime TEXT,
    Country TEXT,
    State TEXT,
    City TEXT,
    PRIMARY KEY (EmployeeId, CustomerId)
);

CREATE TABLE IF NOT EXISTS RobotCityCoverage (
    RobotCityCoverageId TEXT PRIMARY KEY,
    CountryCode TEXT NOT NULL,
    StateId TEXT,
    CityName TEXT NOT NULL,
    TimeZoneId TEXT NOT NULL,
    MinimumManProfiles INTEGER NOT NULL DEFAULT 3 CHECK (MinimumManProfiles >= 3),
    MinimumWomanProfiles INTEGER NOT NULL DEFAULT 3 CHECK (MinimumWomanProfiles >= 3),
    RequiredOnlineMan INTEGER NOT NULL DEFAULT 1 CHECK (RequiredOnlineMan >= 1),
    RequiredOnlineWoman INTEGER NOT NULL DEFAULT 1 CHECK (RequiredOnlineWoman >= 1),
    CoverageStatus TEXT NOT NULL CHECK (
        CoverageStatus IN ('Draft', 'InventoryReady', 'CoverageReady', 'CoverageDegraded', 'Paused')
    ),
    Active INTEGER NOT NULL DEFAULT 1 CHECK (Active IN (0, 1)),
    CreateTime TEXT NOT NULL,
    UpdateTime TEXT NOT NULL,
    UNIQUE (CountryCode, StateId, CityName)
);

CREATE TABLE IF NOT EXISTS RobotShiftSchedule (
    RobotShiftScheduleId TEXT PRIMARY KEY,
    RobotCityCoverageId TEXT NOT NULL REFERENCES RobotCityCoverage(RobotCityCoverageId),
    RobotCustomerId TEXT NOT NULL REFERENCES CustomerProfile(CustomerId),
    BusinessDate TEXT NOT NULL,
    SexSnapshot TEXT NOT NULL,
    TimeZoneIdSnapshot TEXT NOT NULL,
    StartUtcOffsetMinutes INTEGER NOT NULL,
    EndUtcOffsetMinutes INTEGER NOT NULL,
    PlannedStartTime TEXT NOT NULL,
    PlannedEndTime TEXT NOT NULL,
    ActualStartTime TEXT,
    ActualEndTime TEXT,
    ShiftStatus TEXT NOT NULL CHECK (
        ShiftStatus IN ('Planned', 'Active', 'Completed', 'Failed', 'Replaced', 'Cancelled')
    ),
    IsReserve INTEGER NOT NULL DEFAULT 0 CHECK (IsReserve IN (0, 1)),
    ReplacedShiftId TEXT REFERENCES RobotShiftSchedule(RobotShiftScheduleId),
    FailureCode TEXT,
    CreateTime TEXT NOT NULL,
    UpdateTime TEXT NOT NULL,
    UNIQUE (RobotCustomerId, PlannedStartTime, PlannedEndTime)
);

CREATE TABLE IF NOT EXISTS RobotDailyActivity (
    RobotDailyActivityId TEXT PRIMARY KEY,
    RobotCustomerId TEXT NOT NULL REFERENCES CustomerProfile(CustomerId),
    RobotCityCoverageId TEXT NOT NULL REFERENCES RobotCityCoverage(RobotCityCoverageId),
    BusinessDate TEXT NOT NULL,
    OnlineSeconds INTEGER NOT NULL DEFAULT 0 CHECK (OnlineSeconds BETWEEN 0 AND 28800),
    FirstOnlineTime TEXT,
    LastOfflineTime TEXT,
    Active INTEGER NOT NULL DEFAULT 0 CHECK (Active IN (0, 1)),
    CreateTime TEXT NOT NULL,
    UpdateTime TEXT NOT NULL,
    UNIQUE (RobotCustomerId, RobotCityCoverageId, BusinessDate)
);

CREATE TABLE IF NOT EXISTS RobotAIUsage (
    RobotAIUsageId TEXT PRIMARY KEY,
    RobotCustomerId TEXT NOT NULL REFERENCES CustomerProfile(CustomerId),
    ConversationId TEXT NOT NULL REFERENCES Conversations(ConversationId),
    IncomingChatRecordId TEXT NOT NULL REFERENCES ChatRecords(ChatRecordId),
    OutgoingChatRecordId TEXT REFERENCES ChatRecords(ChatRecordId),
    Provider TEXT NOT NULL,
    Model TEXT NOT NULL,
    RobotAIPolicyVersion INTEGER NOT NULL,
    ResponseMode TEXT NOT NULL,
    InputTokens INTEGER NOT NULL DEFAULT 0,
    CachedInputTokens INTEGER NOT NULL DEFAULT 0,
    OutputTokens INTEGER NOT NULL DEFAULT 0,
    EstimatedCost REAL NOT NULL DEFAULT 0,
    CurrencyCode TEXT NOT NULL DEFAULT 'USD',
    LatencyMilliseconds INTEGER,
    UsageStatus TEXT NOT NULL,
    ErrorCode TEXT,
    SafetyResult TEXT NOT NULL,
    LocalValidationResult TEXT NOT NULL,
    CorrelationId TEXT NOT NULL,
    CreateTime TEXT NOT NULL
);

CREATE TRIGGER IF NOT EXISTS TR_Conversations_AllowedCustomerTypes
BEFORE INSERT ON Conversations
BEGIN
    SELECT CASE
        WHEN (
            SELECT Seed FROM CustomerProfile WHERE CustomerId = NEW.CustomerAId
        ) <> 0
        AND (
            SELECT Seed FROM CustomerProfile WHERE CustomerId = NEW.CustomerBId
        ) <> 0
        THEN RAISE(ABORT, 'CUSTOMER_TYPE_CHAT_NOT_ALLOWED')
    END;
END;

CREATE TRIGGER IF NOT EXISTS TR_EmployeeSeed_SeedCustomersOnly
BEFORE INSERT ON EmployeeSeed
BEGIN
    SELECT CASE
        WHEN (
            SELECT Seed FROM CustomerProfile WHERE CustomerId = NEW.CustomerId
        ) <> 1
        THEN RAISE(ABORT, 'EMPLOYEE_SEED_TYPE_REQUIRED')
    END;
END;

CREATE TABLE IF NOT EXISTS IdempotencyRecords (
    PrincipalId TEXT NOT NULL,
    RouteKey TEXT NOT NULL,
    IdempotencyKey TEXT NOT NULL,
    RequestHash TEXT NOT NULL,
    ResponseJson TEXT NOT NULL,
    CreateTime TEXT NOT NULL,
    PRIMARY KEY (PrincipalId, RouteKey, IdempotencyKey)
);

CREATE TABLE IF NOT EXISTS AuditLog (
    AuditLogId TEXT PRIMARY KEY,
    ActorType TEXT NOT NULL,
    ActorId TEXT NOT NULL,
    Action TEXT NOT NULL,
    TargetType TEXT,
    TargetId TEXT,
    DetailJson TEXT,
    CreateTime TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS IX_CustomerProfile_Discovery
    ON CustomerProfile(Active, Seed, CityName, CreateTime);
CREATE INDEX IF NOT EXISTS IX_ChatRecords_ConversationTime
    ON ChatRecords(ConversationId, ChatTime);
CREATE INDEX IF NOT EXISTS IX_Conversations_CustomerAUpdated
    ON Conversations(CustomerAId, UpdatedAt);
CREATE INDEX IF NOT EXISTS IX_Conversations_CustomerBUpdated
    ON Conversations(CustomerBId, UpdatedAt);
CREATE INDEX IF NOT EXISTS IX_CreditLedger_CustomerTime
    ON CreditLedger(CustomerId, TransactionTime DESC);
CREATE INDEX IF NOT EXISTS IX_PasswordResetRequests_StatusTime
    ON PasswordResetRequests(Status, RequestTime DESC);
CREATE INDEX IF NOT EXISTS IX_OutgoingPaymentRequests_StatusTime
    ON OutgoingPaymentRequests(Status, RequestTime DESC);
CREATE INDEX IF NOT EXISTS IX_GiftTransactions_SenderTime
    ON GiftTransactions(SenderCustomerId, CreateTime DESC);
CREATE INDEX IF NOT EXISTS IX_EmployeeCreditLedger_EmployeeTime
    ON EmployeeCreditLedger(EmployeeId, TransactionTime DESC);
CREATE INDEX IF NOT EXISTS IX_RobotShiftSchedule_CityTime
    ON RobotShiftSchedule(RobotCityCoverageId, PlannedStartTime, PlannedEndTime);
CREATE INDEX IF NOT EXISTS IX_RobotShiftSchedule_RobotTime
    ON RobotShiftSchedule(RobotCustomerId, PlannedStartTime, PlannedEndTime);
CREATE INDEX IF NOT EXISTS IX_RobotDailyActivity_RobotDate
    ON RobotDailyActivity(RobotCustomerId, BusinessDate);
CREATE INDEX IF NOT EXISTS IX_RobotAIUsage_CreateTime
    ON RobotAIUsage(CreateTime DESC);
