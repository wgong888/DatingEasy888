# API Error Catalog

Stable error codes are machine-readable and must not expose secrets.

## Common
| Code | HTTP | Meaning |
|---|---:|---|
| `VALIDATION_FAILED` | 422 | One or more fields failed validation |
| `INVALID_QUERY` | 400 | Filter, sort, cursor, or query is invalid |
| `AUTHENTICATION_REQUIRED` | 401 | Valid session is required |
| `INVALID_CREDENTIALS` | 401 | Login credentials are invalid |
| `SESSION_EXPIRED` | 401 | Session must be refreshed or reauthenticated |
| `FORBIDDEN` | 403 | Principal lacks permission |
| `RESOURCE_NOT_FOUND` | 404 | Resource is missing or hidden |
| `RESOURCE_VERSION_CONFLICT` | 409 | Stale update version |
| `IDEMPOTENCY_CONFLICT` | 409 | Idempotency key reused with different input |
| `RATE_LIMITED` | 429 | Request limit exceeded |
| `DEPENDENCY_UNAVAILABLE` | 503 | Required external service unavailable |

## Customer And Profile
| Code | HTTP | Meaning |
|---|---:|---|
| `EMAIL_ALREADY_REGISTERED` | 409 | Email is already used |
| `AGE_NOT_ELIGIBLE` | 422 | Customer is not 18+ |
| `PROFILE_INCOMPLETE` | 409 | Action requires completed profile |
| `CUSTOMER_INACTIVE` | 403 | Customer account is not active |
| `PHOTO_REJECTED` | 422 | Photo violates type, size, or moderation rules |

## Messaging And Safety
| Code | HTTP | Meaning |
|---|---:|---|
| `MESSAGE_TOO_LONG` | 422 | Text exceeds 60 words |
| `MEDIA_TOO_LARGE` | 413 | Media exceeds configured policy |
| `MEDIA_TYPE_NOT_ALLOWED` | 422 | Media format is not allowed |
| `CUSTOMER_BLOCKED` | 403 | Conversation is blocked |
| `CONVERSATION_CLOSED` | 409 | Conversation cannot accept messages |
| `PROFILE_PRESENTATION_POLICY_REQUIRED` | 409 | Required profile-presentation policy is unavailable |
| `INTIMATE_CONSENT_REQUIRED` | 409 | Adult intimate topic needs consent |
| `INTERACTION_REQUEST_ALREADY_PENDING` | 409 | A request is already pending for this customer pair |
| `INTERACTION_REQUEST_NOT_ELIGIBLE` | 403 | Account, preference, block, or safety state prevents the request |
| `INTERACTION_REQUEST_COOLDOWN` | 429 | A declined or expired request cannot yet be repeated |
| `ADULT_REQUEST_VERIFICATION_REQUIRED` | 403 | SexRequest requires verified eligible adults |
| `INTERACTION_TEMPLATE_NOT_AVAILABLE` | 422 | Selected request template is inactive or ineligible |
| `SAFETY_ESCALATION_REQUIRED` | 409 | Human safety review is required |

## Credits, Gifts, And Payments
| Code | HTTP | Meaning |
|---|---:|---|
| `INSUFFICIENT_CREDITS` | 409 | Balance is too low |
| `CREDIT_POLICY_UNAVAILABLE` | 503 | Policy dependency is unresolved/unavailable |
| `PAYMENT_METHOD_REQUIRED` | 422 | No usable payment method supplied |
| `PAYMENT_FAILED` | 422 | Provider rejected the charge |
| `PAYMENT_PENDING` | 409 | Charge is not final |
| `PAYMENT_DUPLICATE` | 409 | Provider transaction already processed |
| `GIFT_NOT_AVAILABLE` | 422 | Gift is inactive or invalid |
| `GIFT_EMPLOYEE_ATTRIBUTION_UNAVAILABLE` | 409 | Seed has no eligible overseeing employee for gift credit |
| `GIFT_FINAL_NON_REFUNDABLE` | 409 | Successfully sent gift cannot be refunded or reversed |

## Employee And Robot Work
| Code | HTTP | Meaning |
|---|---:|---|
| `ASSIGNMENT_NOT_OWNED` | 403 | Worker does not own active assignment |
| `ASSIGNMENT_LEASE_EXPIRED` | 409 | Work lease expired |
| `WORKER_CAPACITY_REACHED` | 409 | 20-seed or 10-chat limit reached |
| `SEED_DAILY_LIMIT_REACHED` | 409 | Seed reached two-hour daily limit |
| `ASSIGNMENT_ALREADY_ACTIVE` | 409 | Seed/conversation already assigned |
| `ROBOT_PAUSED` | 409 | Robot cannot accept work |
| `HUMAN_REVIEW_REQUIRED` | 409 | Robot must transfer to human |

## Admin, Reports, And Tasks
| Code | HTTP | Meaning |
|---|---:|---|
| `REASON_REQUIRED` | 422 | Sensitive action requires reason |
| `APPROVAL_REQUIRED` | 409 | Elevated approval is required |
| `REPORT_SOURCE_INCOMPLETE` | 409 | Source data cannot produce report |
| `REPORT_FINALIZED` | 409 | Final report cannot be directly edited |
| `TASK_ALREADY_RUNNING` | 409 | Concurrent run is prohibited |
| `TASK_DISABLED` | 409 | Disabled task cannot run |
| `OPERATION_IN_PROGRESS` | 409 | Conflicting asynchronous operation exists |
