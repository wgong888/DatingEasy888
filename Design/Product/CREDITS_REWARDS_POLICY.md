# Credits, Rewards, Consumption, And Gifts Policy

Status: product policy draft based on confirmed business requirements.

## 1. Credit Purchase Policy

| Amount paid | Credits received | Credits per USD |
|---:|---:|---:|
| $10 | 100 | 10.0 |
| $20 | 220 | 11.0 |
| $30 | 360 | 12.0 |
| $50 | 700 | 14.0 |
| $100 | 1,500 | 15.0 |

### Purchases Above $100
The current requirement says purchases above $100 receive "1.6 times the amount."

This requires confirmation before implementation. A likely interpretation is:

```text
Credits = USD amount x 16
```

Examples under that interpretation:
- $110 = 1,760 credits
- $150 = 2,400 credits
- $200 = 3,200 credits

The formula remains pending until explicitly confirmed.

### Purchase Rules
- Credits are added only after payment success is confirmed.
- Each purchase creates a ChargeRecord and CreditLedger entry.
- Credits cannot be granted twice for the same provider transaction.
- Package price and credit amount must be displayed before confirmation.
- Refund and chargeback effects on credits must be defined.
- Currency conversion rules must be defined before accepting currencies other than USD.

## 2. Employee Reward Policy
- An employee receives 30% of eligible money earned through work attributed to that employee.
- Human and robot employee attribution uses approved assignment records.
- EmployeeMonthReport records attributed revenue, the 30% rate, and the calculated reward.
- The calculation must be reproducible from source charges and assignments.
- The calculation basis remains to be confirmed: gross charges or net eligible revenue after refunds, chargebacks, taxes, and payment fees.
- Revenue from profile-integrity violations, refunded or charged-back
  transactions, fraud, or other policy-violating interactions is not eligible.
- Employees must not pressure customers to buy credits, send gifts, or continue paid conversations.

Provisional formula:

```text
Employee reward = Eligible attributed money x 30%
```

## 3. New Customer Registration Reward
- Each newly registered real customer receives 50 credits.
- The product describes this as a $5-equivalent registration reward.
- The reward is granted once per eligible customer account.
- Seed customers do not receive the registration reward.
- Duplicate, fraudulent, banned, or re-created accounts are not eligible.
- The reward creates a CreditLedger entry with reason `RegistrationReward`.
- Promotional credits have no cash value unless a later redemption policy explicitly states otherwise.

## 4. Credit Consumption Policy

### Text Messages
- Each sent text message costs 5 credits.
- Maximum message length is 60 words.
- The UI must show the cost before sending.
- The system must define whether messages over 60 words are rejected, shortened, or split.

### Images And Sound
- Each image or sound message costs 10 credits.
- Processed images are stored and delivered only as JPG or PNG.
- Safely readable source images in other formats are automatically converted;
  transparency uses PNG and ordinary photographs use JPG.
- Images are automatically resized and compressed to fit within 100 x 100 pixels while preserving aspect ratio.
- Smaller images are not enlarged.
- Voice is automatically transcoded and compressed; exact duration and processed byte limit remain pending.
- The UI must validate type and show the processed picture or voice result before charging.
- Credits should be deducted only once when the media message is successfully accepted.

### Consumption Rules
- Credit deduction and message creation must succeed or fail together.
- Customer balance cannot become negative unless a future debt rule is approved.
- Failed, rejected, or duplicate messages must not consume credits.
- Every deduction creates a CreditLedger entry linked to the ChatRecord or GiftTransaction.
- Paid actions must show their exact credit cost before sending. Customer-facing
  screens must not expose internal real, seed, or robot classifications.

## 5. Gift Policy

| Gift | Sender cost | Recipient credit reward | Platform share |
|---|---:|---:|---:|
| Flower | 100 credits | 80 credits | 20 credits |
| Silver | 200 credits | 160 credits | 40 credits |
| Gold | 500 credits | 400 credits | 100 credits |
| Diamond | 1,000 credits | 800 credits | 200 credits |
| Big Rocket | 10,000 credits | 8,000 credits | 2,000 credits |

### Gift Rules
- The sender pays the listed gift cost.
- The receiving eligible customer receives 80% of the gift cost as credits.
- The platform retains 20%.
- Gift transfer, recipient reward, and platform share must be recorded atomically.
- Every successfully sent gift is final and non-refundable, including a gift
  sent to the wrong recipient by customer mistake.
- The product provides no gift-refund or gift-reversal command.
- External fraud disputes and payment-provider chargebacks are recorded and
  reconciled separately; they do not create a customer gift-refund feature.
- Gift credits are platform credits, not cash, unless a later redemption policy is approved.
- The recipient must be identified before confirmation.
- When the recipient is an internally classified seed profile, the 80%
  recipient share is
  credited to the employee assigned to oversee the seed at gift time.
- The transaction snapshots the overseeing `EmployeeId`; later reassignment
  does not move the employee gift credits.

## 6. Customer Display Requirements
- Show current credit balance.
- Read the displayed balance from `CustomerProfile.CreditsRemain`.
- After a paid action or credit grant commits, return and display the new
  committed balance immediately.
- Failed or rejected actions do not reduce the displayed balance.
- Other active customer sessions receive the committed balance through the
  real-time/reconciliation update flow.
- Show exact cost before sending a message, media item, or gift.
- Show package price and credit amount before purchase.
- Show registration reward after it is granted.
- Show gift sender cost and recipient reward policy.
- Provide accessible credit transaction history.
- Do not describe platform credits as withdrawable money unless withdrawal is actually supported.

## 7. Audit And Reconciliation
- `CustomerProfile.CreditsRemain` is the authoritative current spendable balance.
- `CreditLedger` is the immutable history that explains and reconciles every
  increase and decrease.
- The business record, ledger row, and `CreditsRemain` change commit atomically.
- ChargeRecord is the source of truth for credit purchases.
- GiftTransaction is the source of truth for gift transfers.
- EmployeeCreditLedger is the source of truth for seed-recipient gift credits
  awarded to overseeing employee records.
- EmployeeMonthReport records the 30% employee reward calculation.
- EmployeeMonthReport reports gift credits separately from salary.
- CompanyDayMake and CompanyMonthReport reconcile purchase income and consumed credits.
