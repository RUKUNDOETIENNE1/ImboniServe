# MPCA-001 Next-Work Queue

| Field | Value |
|---|---|
| Audit Date | 2026-08-12 |
| Purpose | Ranked queue of unresolved work |

## NOW — Must happen before Customer #1

### NOW-001: Establish production environment

| Field | Value |
|---|---|
| Work | Founder makes 7 decisions (D1-D7); create production Vercel, Supabase, Redis, Pusher |
| Why it matters | Cannot go live without production infrastructure |
| Dependency | Founder action |
| Expected verification | Production environment smoke test |
| Acceptance criteria | All PE-001-Production-Readiness-Matrix items show VERIFIED |

### NOW-002: Deploy to Vercel and verify

| Field | Value |
|---|---|
| Work | Deploy release candidate 4763153 to Vercel; verify build, runtime, DNS, SSL |
| Why it matters | "Build succeeds locally" is not deployment verification |
| Dependency | NOW-001 (Vercel project) |
| Expected verification | Vercel build success + homepage loads + auth flow works |
| Acceptance criteria | Vercel deployment URL returns 200; no runtime errors |

### NOW-003: Configure production secrets

| Field | Value |
|---|---|
| Work | Generate and set NEXTAUTH_SECRET, IMBONI_QR_SECRET, TRIAL_HASH_SECRET, CRON_SECRET in Vercel |
| Why it matters | Fail-closed code will throw SECURITY FATAL without proper secrets |
| Dependency | NOW-001 (Vercel project) |
| Expected verification | Application starts without SECURITY FATAL errors |
| Acceptance criteria | No SECURITY FATAL errors in production logs |

### NOW-004: Fix InTouch webhook to use canonical payment completion

| Field | Value |
|---|---|
| Work | Add PaymentCompletionService.onPaymentSuccess call to src/pages/api/webhooks/intouch.ts for sales |
| Why it matters | Sales paid via InTouch won't get ledger entries, breaking financial reporting |
| Dependency | None (engineering work) |
| Expected verification | Integration test: InTouch payment → ledger entry created → dashboard shows revenue |
| Acceptance criteria | InTouch webhook creates FinancialLedgerEntry for all successful sales payments |

### NOW-005: Confirm payment provider and configure webhook auth

| Field | Value |
|---|---|
| Work | Founder confirms IremboPay Set A; configure INTOUCH_WEBHOOK_USERNAME/PASSWORD |
| Why it matters | Payments cannot be processed securely without confirmed provider and webhook auth |
| Dependency | NOW-001 (production environment) |
| Expected verification | Test payment end-to-end in production |
| Acceptance criteria | Payment flows work; webhooks authenticated |

### NOW-006: Establish backup and recovery

| Field | Value |
|---|---|
| Work | Create production Supabase (Pro tier); verify daily backups + PITR; test recovery |
| Why it matters | Customer data is at risk without backups |
| Dependency | NOW-001 (D1 — Supabase) |
| Expected verification | Backup exists; recovery test succeeds |
| Acceptance criteria | Daily backup verified; point-in-time recovery tested |

---

## NEXT — Should happen immediately after the current gate

### NEXT-001: Add 7 missing cron entries to vercel.json

| Field | Value |
|---|---|
| Work | Add reservation-reminders, subscription-reminders, invite-maintenance, monthly-usage-reset, referral-lifecycle, watchdog-queue, watchdog-reconciliation to vercel.json |
| Why it matters | Reservation reminders, subscription reminders, and watchdogs won't run |
| Dependency | NOW-002 (Vercel deployment) |
| Expected verification | Cron jobs fire at scheduled times |
| Acceptance criteria | All 16 cron endpoints scheduled in vercel.json |

### NEXT-002: Fix referral code generation endpoint authentication

| Field | Value |
|---|---|
| Work | Add requirePermission middleware to src/pages/api/customer-referrals/generate.ts |
| Why it matters | Anyone can generate referral codes without authentication |
| Dependency | None |
| Expected verification | Unauthenticated request returns 401 |
| Acceptance criteria | Endpoint requires authenticated session |

### NEXT-003: Fix dashboard stats API data source

| Field | Value |
|---|---|
| Work | Change /api/dashboard/stats.ts to query FinancialLedgerEntry instead of Sale |
| Why it matters | Dashboard shows different numbers than CEO/CFO reports |
| Dependency | None |
| Expected verification | Dashboard stats match CEO dashboard |
| Acceptance criteria | Stats API uses FinancialLedgerEntry for revenue |

### NEXT-004: Configure monitoring (Sentry, Slack, email)

| Field | Value |
|---|---|
| Work | Set SENTRY_DSN, NEXT_PUBLIC_SENTRY_DSN, SLACK_WEBHOOK_URL, ALERT_EMAIL_TO in production |
| Why it matters | Production issues will be invisible without monitoring |
| Dependency | NOW-001 |
| Expected verification | Sentry receives errors; Slack receives alerts |
| Acceptance criteria | Test error appears in Sentry; test alert appears in Slack |

### NEXT-005: Configure production email

| Field | Value |
|---|---|
| Work | Choose Postmark/SES/SendGrid; configure domain auth; set production SMTP_* env vars |
| Why it matters | OTP emails may fail or be marked as spam with personal Gmail |
| Dependency | NOW-001 (D4) |
| Expected verification | OTP email delivered; not in spam |
| Acceptance criteria | Email deliverability verified |

### NEXT-006: Commit Promise Engine with integration tests

| Field | Value |
|---|---|
| Work | Commit Promise Engine code; write integration tests; verify lifecycle end-to-end |
| Why it matters | Promise Engine is code-complete but not verified |
| Dependency | None |
| Expected verification | Integration tests pass; lifecycle verified |
| Acceptance criteria | All 12 missing verification items from Promise Engine Status report are verified |

### NEXT-007: Extend reconciliation to check ledger

| Field | Value |
|---|---|
| Work | Add FinancialLedgerEntry checks to ReconciliationService |
| Why it matters | Financial discrepancies between sale and ledger may go undetected |
| Dependency | None |
| Expected verification | Reconciliation detects missing ledger entries |
| Acceptance criteria | Reconciliation checks full chain: Payment → Sale → Ledger |

---

## LATER — Can happen after Customer #1

### LATER-001: Fix GR-016 regressions in payment services

| Field | Value |
|---|---|
| Work | Replace hardcoded Rwanda phone/country/timezone in payment services with business configuration |
| Why it matters | Platform won't work correctly outside Rwanda |
| Dependency | None |
| Note | Customer #1 is in Rwanda, so this is latent |

### LATER-002: Make pending order warning blockable in close-day

| Field | Value |
|---|---|
| Work | Add blocking warning with override option for pending orders during close-day |
| Why it matters | Day can be closed with pending orders, causing revenue leakage |
| Dependency | None |

### LATER-003: Fix Service Replay flaky test

| Field | Value |
|---|---|
| Work | Fix timing-sensitive test in service-replay.test.ts |
| Why it matters | Test suite reliability |
| Dependency | None |

### LATER-004: Fix business commission test cache bug

| Field | Value |
|---|---|
| Work | Clear feeCache in beforeEach in business-commission.test.ts |
| Why it matters | Test suite reliability |
| Dependency | None |

### LATER-005: Resolve WhatsApp Twilio error 63007

| Field | Value |
|---|---|
| Work | Resolve Twilio WhatsApp business account configuration |
| Why it matters | Staff notifications via WhatsApp |
| Dependency | Founder action (Twilio account) |

### LATER-006: Add database connection pool params

| Field | Value |
|---|---|
| Work | Add ?pgbouncer=true&connection_limit=1 to production DATABASE_URL |
| Why it matters | Prevent intermittent connection errors in serverless |
| Dependency | NOW-001 (production Supabase) |

---

## LONG-TERM — Strategic vision

### LONG-TERM-001: DGS-001B/C backend refactoring

| Field | Value |
|---|---|
| Work | Rename backend terminology (restaurant → business) |
| Why it matters | Multi-vertical alignment |
| Dependency | Founder approval |

### LONG-TERM-002: Roadmap parking lot (62 items)

| Field | Value |
|---|---|
| Work | Voice ordering, full WhatsApp ordering, website builder, supplier marketplace, etc. |
| Why it matters | Platform evolution |
| Dependency | Post-launch validation |

### LONG-TERM-003: Promise Engine documentation

| Field | Value |
|---|---|
| Work | Create architecture, API, state transition, and troubleshooting documentation |
| Why it matters | Maintainability |
| Dependency | NEXT-006 (commit + integration tests) |
