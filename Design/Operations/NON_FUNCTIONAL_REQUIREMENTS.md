# Non-Functional Requirements

## Performance
- Landing page should load quickly on mobile connections.
- Search and discovery endpoints should support pagination.
- Message list and conversation history should load incrementally.
- Images should be optimized and lazy-loaded.

## Availability
- Production services should be restartable without data loss.
- Database backups are required.
- Payment callbacks/webhooks must be recoverable.

## Scalability
- API should be stateless where possible.
- Chat and notifications can be separated from normal REST API later.
- Media storage should support migration from local/dev storage to cloud/object storage.

## Observability
- Structured application logs
- Request IDs across frontend/API
- Error tracking
- Payment event logging
- Admin audit logging
- Basic analytics dashboards

## Reliability
- Payment confirmation must be idempotent.
- Credit ledger updates must be transactional.
- Sending a message should not duplicate on retry.
- Uploads should handle partial failures cleanly.
- Scheduled tasks must prevent overlapping execution unless explicitly allowed.
- Scheduled tasks must record start, completion, failure, retry, and final outcome.
- Monthly and year-end report jobs must be idempotent and safely recalculable before finalization.

## Accessibility
- Touch targets at least 44px.
- Keyboard-accessible forms and modals.
- Proper labels for inputs.
- Color contrast suitable for primary flows.

## Supported UI Surfaces
- Customer Frontend supports Windows 10 22H2 as a time-limited legacy target, Windows 11, 2020-or-newer Macs on macOS 12+, iOS/iPadOS 17+, mainstream Linux, Android, and ChromeOS according to `Frontend/BROWSER_AND_OS_COMPATIBILITY.md`.
- Edge and Chrome are the primary desktop browsers; Safari is required on Apple mobile devices.
- Bing search compatibility covers safe public-page indexing and opening results in supported browsers; Bing is not a browser.
- Other Unix/Unix-like desktops receive best-effort support when they run a standards-compliant current browser.
- Internet Explorer 11 and Microsoft Edge IE mode are not supported customer targets.
- Customer Frontend must be responsive from 320px mobile width upward.
- Employee/Admin Backend supports large desktop displays only.
- Backend minimum resolution and supported browser list must be finalized before implementation.
- Backend workflows should be optimized for keyboard and mouse use.

## Robustness
- Forms preserve entered data after recoverable errors.
- Network failures show retry options without duplicating financial or chat actions.
- Live data updates must not unexpectedly resize or reorder active work panels.
- Long-running employee/admin operations show progress and final status.
- Customer and employee sessions must recover safely after temporary connection loss.
- Customer sessions automatically terminate after 1,200 consecutive seconds
  without meaningful customer interaction.
- Employee sessions automatically terminate after 600 consecutive seconds
  without meaningful employee interaction.
- Background polling, incoming events, timers, and open pages must not extend an
  inactive customer or employee session.
- Idle termination must block sends, preserve eligible drafts, and release or
  transfer active assignment leases without duplicate messages.
- Policy activation must be atomic for a policy scope and effective time.
- Consuming services must report the active policy version; propagation
  disagreement raises an operational alert.
- Policy rollback must restore known values without rewriting completed
  transactions or historical audit records.

## Internationalization
- Store timestamps in UTC.
- Prepare profile/location data for multiple countries.
- Keep UI text centralized when implementation begins.

## Data Retention
- Decide retention for deleted accounts, messages, payment records, reports, and audit logs.
- Some financial and safety records may need to remain after account deletion.
- Retention policy requires legal/product decision before launch.
