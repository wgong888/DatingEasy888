# Finance, Reports, Expenses, And Operations API Contracts

## CEO Executive Dashboard

`GET /api/v1/admin/outgoing-payments`

Lists pending and decided outgoing-payment requests for administrators.

`POST /api/v1/admin/outgoing-payments`

Creates an immutable pending request with payee, category, positive amount,
three-letter currency code, and business description. The authenticated
administrator is recorded as preparer and cannot perform the CEO decision.

`GET /api/v1/ceo/dashboard`

Returns current UTC year/month/day revenue and expense, online counts, system
health, and up to 20 pending outgoing-payment requests.

Revenue includes successful customer charges. Expense includes only outgoing
payments with a completed CEO approval.

`POST /api/v1/ceo/outgoing-payments/{requestId}/approve`

`POST /api/v1/ceo/outgoing-payments/{requestId}/deny`

Both commands require an authenticated CEO session. The preparer cannot decide
the same payment, and a completed decision is immutable.

Status: version 1 design draft.

Base routes:
- Finance/admin: `/api/v1/admin`
- Provider callbacks: `/api/v1/integrations`

## 1. Charge Records

### List Charges
`GET /api/v1/admin/charges`

Required role: Finance or authorized administrator.

Filters:
- `customerId`
- `chargeStatus`
- `paymentProvider`
- `from`
- `to`
- `currencyCode`
- `providerTransactionId`
- `cursor`

List responses follow the global fixed 20-record cursor page.

### Get Charge
`GET /api/v1/admin/charges/{chargeRecordId}`

Response includes masked card metadata only.

### Payment Provider Callback
`POST /api/v1/integrations/payments/{provider}/events`

Requirements:
- Verify provider signature
- Require provider event ID
- Process idempotently
- Persist event status
- Finalize ChargeRecord and credits atomically
- Never trust customer-provided payment success

### Refund Charge
`POST /api/v1/admin/charges/{chargeRecordId}/refund`

Requires:
- Finance permission
- Reason
- Idempotency key
- Policy-defined credit adjustment

The endpoint remains disabled until refund/credit policy is approved.

### Resolve Dispute
`POST /api/v1/admin/charges/{chargeRecordId}/dispute-resolution`

## 2. Credit Ledger

### Search Customer Ledger
`GET /api/v1/admin/credits/ledger`

Filters:
- `customerId`
- `transactionType`
- `relatedCustomerId`
- `employeeId`
- `from`
- `to`

### Get Ledger Entry
`GET /api/v1/admin/credits/ledger/{creditLedgerId}`

### Create Correction
`POST /api/v1/admin/credits/corrections`

Request:
```json
{
  "customerId": "uuid",
  "creditsChange": 25,
  "reasonCode": "ApprovedCorrection",
  "comments": "Required explanation",
  "approvalReference": "optional"
}
```

Rules:
- Never edit existing ledger entries.
- Correction creates a new append-only entry.
- Large or sensitive corrections require administrator reauthentication,
  reason, explicit confirmation, and audit.

### Reconcile Customer Balance
`POST /api/v1/admin/credits/customers/{customerId}/reconcile`

Returns asynchronous operation if full history is large.

## 3. Gifts

### Search Gift Transactions
`GET /api/v1/admin/gift-transactions`

### Get Gift Transaction
`GET /api/v1/admin/gift-transactions/{giftTransactionId}`

The response includes sender, recipient, seed flag, snapshotted overseeing
employee, sender cost, employee/customer recipient credits, platform share,
policy version, and ledger references.

No gift refund or reversal endpoint exists. Successfully sent gifts are final.
External fraud disputes and provider chargebacks are recorded through charge
and reconciliation workflows without creating a customer gift refund.

### Search Employee Gift-Credit Ledger
`GET /api/v1/admin/credits/employees`

Filters:
- `employeeId`
- `giftTransactionId`
- `employeeType`
- `from`
- `to`
- `cursor`

Returns at most 20 records and uses the global `Next` cursor rule.

### Get Employee Gift-Credit Entry
`GET /api/v1/admin/credits/employees/{employeeCreditLedgerId}`

### Reconcile Employee Gift-Credit Balance
`POST /api/v1/admin/credits/employees/{employeeId}/reconcile`

Reconciliation never changes the overseeing employee snapshotted by a completed
gift transaction.

Employee monthly-report responses include `giftCreditsEarned` separately from
salary and eligible attributed revenue.

## 4. Daily Company Reports

### List Daily Reports
`GET /api/v1/admin/reports/company/daily`

### Get Daily Report
`GET /api/v1/admin/reports/company/daily/{businessDate}`

### Generate Daily Report
`POST /api/v1/admin/reports/company/daily/{businessDate}/generate`

Idempotency required. Returns asynchronous operation.

### Recalculate Daily Draft
`POST /api/v1/admin/reports/company/daily/{businessDate}/recalculate`

### Finalize Daily Report
`POST /api/v1/admin/reports/company/daily/{businessDate}/finalize`

Rules:
- Source period and timezone are fixed in the report.
- Finalization validates successful charges and credit consumption.
- Final reports are not directly edited.

## 5. Employee Monthly Reports

### List Employee Monthly Reports
`GET /api/v1/admin/reports/employees/monthly`

Filters:
- `employeeId`
- `reportMonth`
- `reportStatus`
- `currencyCode`

### Get Employee Monthly Report
`GET /api/v1/admin/reports/employees/monthly/{reportId}`

### Generate Employee Monthly Reports
`POST /api/v1/admin/reports/employees/monthly/generate`

Request:
```json
{
  "reportMonth": "2026-06-01",
  "currencyCode": "USD"
}
```

Returns one asynchronous batch operation.

### Recalculate Employee Monthly Draft
`POST /api/v1/admin/reports/employees/monthly/{reportId}/recalculate`

### Finalize Employee Monthly Report
`POST /api/v1/admin/reports/employees/monthly/{reportId}/finalize`

### Mark Employee Report Paid
`POST /api/v1/admin/reports/employees/monthly/{reportId}/mark-paid`

Request:
```json
{
  "paidTime": "2026-07-05T18:00:00Z",
  "employeePaymentAccountId": "uuid",
  "paymentReference": "provider-reference"
}
```

Rules:
- Default reward rate is 30%.
- Revenue basis is marked `PendingPolicy` until gross/net rule is approved.
- Report cannot be paid before finalization.

## 6. Company Monthly Reports

### List Monthly Reports
`GET /api/v1/admin/reports/company/monthly`

### Get Monthly Report
`GET /api/v1/admin/reports/company/monthly/{reportId}`

### Generate Monthly Report
`POST /api/v1/admin/reports/company/monthly/generate`

### Recalculate Monthly Draft
`POST /api/v1/admin/reports/company/monthly/{reportId}/recalculate`

### Finalize Monthly Report
`POST /api/v1/admin/reports/company/monthly/{reportId}/finalize`

Report includes source daily reports and paid employee monthly reports. Expense inclusion remains a policy option.

## 7. Company Year-End Reports

### List Year Reports
`GET /api/v1/admin/reports/company/yearly`

### Get Year Report
`GET /api/v1/admin/reports/company/yearly/{reportId}`

### Generate Year Report
`POST /api/v1/admin/reports/company/yearly/generate`

Request:
```json
{
  "reportYear": 2026,
  "currencyCode": "USD"
}
```

Returns asynchronous operation.

### Validate Year Report Sources
`POST /api/v1/admin/reports/company/yearly/{reportId}/validate`

### Recalculate Year Draft
`POST /api/v1/admin/reports/company/yearly/{reportId}/recalculate`

### Finalize Year Report
`POST /api/v1/admin/reports/company/yearly/{reportId}/finalize`

### Approve Year Report
`POST /api/v1/admin/reports/company/yearly/{reportId}/approve`

Approval may require a different administrator from the generator/finalizer.

## 8. Report Corrections

### Create Report Correction
`POST /api/v1/admin/reports/{reportType}/{reportId}/corrections`

Creates an adjustment/corrected version. It does not overwrite finalized history.

### List Report Source Records
`GET /api/v1/admin/reports/{reportType}/{reportId}/sources`

### Export Report
`POST /api/v1/admin/reports/{reportType}/{reportId}/exports`

Asynchronous export for CSV/PDF or approved formats.

## 9. Advertisement Records

### List Advertisements
`GET /api/v1/admin/advertisements`

### Create Advertisement
`POST /api/v1/admin/advertisements`

Request:
```json
{
  "dateTime": "2026-06-07T18:00:00Z",
  "feePaid": 1000.00,
  "currencyCode": "USD",
  "mediaName": "Example Media",
  "timeStart": "2026-06-10T00:00:00Z",
  "timeEnd": "2026-07-10T00:00:00Z",
  "providerInvoiceId": "invoice-1",
  "paymentReference": "payment-1",
  "comments": "Campaign notes"
}
```

### Get Advertisement
`GET /api/v1/admin/advertisements/{advertisementRecordId}`

### Update Advertisement
`PUT /api/v1/admin/advertisements/{advertisementRecordId}`

### Change Advertisement Status
`POST /api/v1/admin/advertisements/{advertisementRecordId}/status`

## 10. Cloud Services

### List Cloud Services
`GET /api/v1/admin/cloud-services`

### Create Cloud Service
`POST /api/v1/admin/cloud-services`

Request:
```json
{
  "dateTime": "2026-06-07T18:00:00Z",
  "amountPaid": 500.00,
  "currencyCode": "USD",
  "cloudProvider": "Provider",
  "serviceName": "Production hosting",
  "startTime": "2026-06-01T00:00:00Z",
  "endTime": "2026-07-01T00:00:00Z",
  "cpu": "8 vCPU",
  "memory": "32 GB",
  "diskSpace": "1 TB",
  "netRate": "1 Gbps",
  "ips": "4 allocated",
  "dataBase": "SQL Server service",
  "backup": "Daily, 30-day retention",
  "providerInvoiceId": "invoice-1",
  "paymentReference": "payment-1",
  "serviceStatus": "Active"
}
```

### Get Cloud Service
`GET /api/v1/admin/cloud-services/{cloudServiceId}`

### Update Cloud Service
`PUT /api/v1/admin/cloud-services/{cloudServiceId}`

### Change Status
`POST /api/v1/admin/cloud-services/{cloudServiceId}/status`

### Get Expiration Alerts
`GET /api/v1/admin/cloud-services/alerts`

Secrets, credentials, passwords, keys, and connection strings are rejected.

## 11. Scheduled Tasks

### List Task Definitions
`GET /api/v1/admin/scheduled-tasks`

### Create Task
`POST /api/v1/admin/scheduled-tasks`

Request:
```json
{
  "taskName": "Daily company report",
  "taskType": "CompanyDayReport",
  "scheduleExpression": "0 0 * * *",
  "timeZone": "America/Los_Angeles",
  "enabled": true,
  "allowConcurrentRun": false,
  "retryLimit": 3,
  "retryDelaySeconds": 300,
  "timeoutSeconds": 1800,
  "ownerEmployeeId": "uuid"
}
```

### Get Task
`GET /api/v1/admin/scheduled-tasks/{scheduledTaskId}`

### Update Task
`PUT /api/v1/admin/scheduled-tasks/{scheduledTaskId}`

### Enable/Disable Task
`POST /api/v1/admin/scheduled-tasks/{scheduledTaskId}/status`

### Run Task Now
`POST /api/v1/admin/scheduled-tasks/{scheduledTaskId}/run`

Idempotency required. Returns asynchronous operation.

### List Task Runs
`GET /api/v1/admin/scheduled-tasks/{scheduledTaskId}/runs`

### Get Task Run
`GET /api/v1/admin/scheduled-task-runs/{runId}`

### Retry Task Run
`POST /api/v1/admin/scheduled-task-runs/{runId}/retry`

Financial, security, and high-impact robot tasks may require elevated approval.

## 12. Asynchronous Operations

### List Operations
`GET /api/v1/admin/operations`

### Get Operation
`GET /api/v1/admin/operations/{operationId}`

### Cancel Operation
`POST /api/v1/admin/operations/{operationId}/cancel`

Only cancellable queued/running operations accept cancellation.

## 13. Finance And Operations Dashboard

### Overview
`GET /api/v1/admin/operations-dashboard`

Response sections:
- Charge volume and failures
- Credit reconciliation alerts
- Daily/monthly/yearly report status
- Employee reports awaiting approval/payment
- Advertisement expenses
- Cloud expenses and expirations
- Scheduled-task failures
- Pending corrections

## 14. Real-Time Events
- `finance.chargeUpdated`
- `finance.reconciliationFailed`
- `report.generationStarted`
- `report.generationCompleted`
- `report.validationFailed`
- `task.runStarted`
- `task.runFailed`
- `task.runCompleted`
- `cloud.expirationAlert`
- `operation.statusChanged`
