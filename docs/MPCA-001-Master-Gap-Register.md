# MPCA-001 Master Gap Register

| Field | Value |
|---|---|
| Audit Date | 2026-08-12 |
| Purpose | Every unresolved item with evidence |

## Gap Summary

| Severity | Count |
|---|---|
| P0 — Must fix before Customer #1 | 6 |
| P1 — Should fix before Customer #1 | 8 |
| P2 — Non-blocking | 4 |
| POST-LAUNCH | 2 |
| LONG-TERM | 1 |

---

## P0 Gaps

### GAP-001: Production environment not established

| Field | Value |
|---|---|
| ID | GAP-001 |
| Description | No production Vercel, Supabase, Redis, Pusher, Sentry, SMTP, or payment provider infrastructure exists |
| Source | PE-001, PE-001A |
| Evidence | docs/PE-001-Production-Readiness-Matrix.md — 0 components VERIFIED |
| Status | F — FOUNDER ACTION REQUIRED |
| Severity | P0 |
| Customer #1 Impact | Cannot go live |
| Dependency | D1-D7 founder decisions |
| Recommended Next Action | Founder makes 7 decisions; establish production infrastructure |
| Owner | Founder |
| Founder Decision Required | YES |

### GAP-002: Vercel deployment not verified

| Field | Value |
|---|---|
| ID | GAP-002 |
| Description | Build succeeds locally but no evidence of successful Vercel deployment |
| Source | PE-001A, post-commit 4763153 |
| Evidence | "should now succeed" is not evidence; Vercel not accessible from audit |
| Status | E — NOT DEPLOYMENT VERIFIED |
| Severity | P0 |
| Customer #1 Impact | Cannot go live without verified deployment |
| Dependency | GAP-001 (Vercel project) |
| Recommended Next Action | Deploy to Vercel; verify build, runtime, and smoke test |
| Owner | Founder + Engineering |
| Founder Decision Required | YES (D7) |

### GAP-003: Backup and recovery not configured

| Field | Value |
|---|---|
| ID | GAP-003 |
| Description | No production database backup or recovery test |
| Source | PE-001 |
| Evidence | docs/PE-001-Backup-Recovery-Readiness.md; RB-001 runbook exists but untested |
| Status | F — FOUNDER ACTION REQUIRED |
| Severity | P0 |
| Customer #1 Impact | Data loss risk |
| Dependency | GAP-001 (D1 — Supabase Pro includes backups) |
| Recommended Next Action | Establish production Supabase; test backup and recovery |
| Owner | Founder |
| Founder Decision Required | YES (D1) |

### GAP-004: InTouch webhook bypasses canonical payment completion

| Field | Value |
|---|---|
| ID | GAP-004 |
| Description | InTouch webhook does NOT call PaymentCompletionService — sales paid via InTouch may not get ledger entries |
| Source | MPCA-001 Financial Truth audit |
| Evidence | src/pages/api/webhooks/intouch.ts — updates PaymentTransaction but does not call PaymentCompletionService.onPaymentSuccess |
| Status | D — KNOWN DEFECT |
| Severity | P0 |
| Customer #1 Impact | Revenue from InTouch payments may not appear in financial reports |
| Dependency | None |
| Recommended Next Action | Add PaymentCompletionService.onPaymentSuccess call to InTouch webhook for sales |
| Owner | Engineering |
| Founder Decision Required | NO |

### GAP-005: Production secrets not set

| Field | Value |
|---|---|
| ID | GAP-005 |
| Description | NEXTAUTH_SECRET, IMBONI_QR_SECRET, TRIAL_HASH_SECRET, CRON_SECRET must be regenerated for production |
| Source | PE-001, PE-001A |
| Evidence | .env has dev secrets; fail-closed code will throw in production without proper secrets |
| Status | F — FOUNDER ACTION REQUIRED |
| Severity | P0 |
| Customer #1 Impact | Application will crash in production without secrets |
| Dependency | GAP-001 (production environment) |
| Recommended Next Action | Generate and set production secrets in Vercel environment |
| Owner | Founder |
| Founder Decision Required | YES |

### GAP-006: Payment provider configuration

| Field | Value |
|---|---|
| ID | GAP-006 |
| Description | IremboPay integration approach (Set A vs Set B) and InTouch webhook auth not configured |
| Source | PE-001, PE-001A |
| Evidence | INTOUCH_WEBHOOK_USERNAME/PASSWORD NOT SET; IremboPay Set B credentials NOT SET |
| Status | F — FOUNDER ACTION REQUIRED |
| Severity | P0 |
| Customer #1 Impact | Payments cannot be processed securely |
| Dependency | D2 (IremboPay decision) |
| Recommended Next Action | Founder confirms IremboPay approach; configure InTouch webhook auth |
| Owner | Founder |
| Founder Decision Required | YES (D2) |

---

## P1 Gaps

### GAP-007: Referral code generation endpoint lacks authentication

| Field | Value |
|---|---|
| ID | GAP-007 |
| Description | src/pages/api/customer-referrals/generate.ts has no auth middleware — anyone can generate referral codes |
| Source | MPCA-001 Security audit |
| Evidence | Code inspection shows no requirePermission or auth check |
| Status | D — KNOWN DEFECT |
| Severity | P1 |
| Customer #1 Impact | Unauthorized referral code generation |
| Dependency | None |
| Recommended Next Action | Add requirePermission middleware |
| Owner | Engineering |
| Founder Decision Required | NO |

### GAP-008: Dashboard stats API uses wrong data source

| Field | Value |
|---|---|
| ID | GAP-008 |
| Description | /api/dashboard/stats.ts queries Sale table instead of FinancialLedgerEntry |
| Source | MPCA-001 Financial Truth audit |
| Evidence | src/pages/api/dashboard/stats.ts uses prisma.sale.aggregate; CEO/CFO use prisma.financialLedgerEntry.aggregate |
| Status | D — KNOWN DEFECT |
| Severity | P1 |
| Customer #1 Impact | Dashboard may show different numbers than CEO/CFO reports |
| Dependency | None |
| Recommended Next Action | Change stats API to query FinancialLedgerEntry |
| Owner | Engineering |
| Founder Decision Required | NO |

### GAP-009: 7 cron jobs unscheduled

| Field | Value |
|---|---|
| ID | GAP-009 |
| Description | 7 of 16 cron endpoints have no schedule in vercel.json |
| Source | GPV-D002 |
| Evidence | vercel.json has 9 entries; src/pages/api/cron/ has 16 files |
| Status | C — PARTIALLY IMPLEMENTED |
| Severity | P1 |
| Customer #1 Impact | Reservation reminders, subscription reminders, invite cleanup, watchdogs won't run |
| Dependency | None |
| Recommended Next Action | Add 7 missing cron entries to vercel.json |
| Owner | Engineering |
| Founder Decision Required | NO |

### GAP-010: Monitoring not configured

| Field | Value |
|---|---|
| ID | GAP-010 |
| Description | Sentry DSN, Slack webhook, alert email not configured |
| Source | GPV-D004, PE-001 |
| Evidence | .env missing SENTRY_DSN, SLACK_WEBHOOK_URL, ALERT_EMAIL_TO |
| Status | F — FOUNDER ACTION REQUIRED |
| Severity | P1 |
| Customer #1 Impact | Production issues will be invisible |
| Dependency | GAP-001 |
| Recommended Next Action | Configure Sentry, Slack, email alerts |
| Owner | Founder |
| Founder Decision Required | YES |

### GAP-011: WhatsApp notifications broken

| Field | Value |
|---|---|
| ID | GAP-011 |
| Description | Twilio WhatsApp returns error 63007 |
| Source | PE-001 |
| Evidence | docs/PE-001-Production-Readiness-Matrix.md — BLOCKED |
| Status | G — BLOCKED |
| Severity | P1 |
| Customer #1 Impact | Staff notifications via WhatsApp won't work |
| Dependency | Twilio WhatsApp business account |
| Recommended Next Action | Resolve Twilio WhatsApp setup |
| Owner | Founder |
| Founder Decision Required | YES |

### GAP-012: Reconciliation missing ledger checks

| Field | Value |
|---|---|
| ID | GAP-012 |
| Description | ReconciliationService checks PaymentTransaction ↔ Sale but not FinancialLedgerEntry |
| Source | MPCA-001 Financial Truth audit |
| Evidence | src/lib/services/reconciliation.service.ts — no FinancialLedgerEntry queries |
| Status | C — PARTIALLY IMPLEMENTED |
| Severity | P1 |
| Customer #1 Impact | Financial discrepancies between sale and ledger may go undetected |
| Dependency | None |
| Recommended Next Action | Extend ReconciliationService to check ledger |
| Owner | Engineering |
| Founder Decision Required | NO |

### GAP-013: Production email not configured

| Field | Value |
|---|---|
| ID | GAP-013 |
| Description | SMTP uses personal Gmail; not production-grade |
| Source | PE-001, PE-001A |
| Evidence | .env: smtp.gmail.com, personal email, SMTP_SECURE not set |
| Status | F — FOUNDER ACTION REQUIRED |
| Severity | P1 |
| Customer #1 Impact | OTP emails may fail or be marked as spam |
| Dependency | D4 (email provider decision) |
| Recommended Next Action | Choose Postmark/SES/SendGrid; configure domain auth |
| Owner | Founder |
| Founder Decision Required | YES (D4) |

### GAP-014: Pending order warning non-blocking in close-day

| Field | Value |
|---|---|
| ID | GAP-014 |
| Description | Z-Report counts pending orders but does not warn or block closing |
| Source | MPCA-001 Financial Truth audit |
| Evidence | src/pages/api/reports/close-day.ts — counts pending orders but only reports count |
| Status | C — PARTIALLY IMPLEMENTED |
| Severity | P1 |
| Customer #1 Impact | Day can be closed with pending orders, causing revenue leakage |
| Dependency | None |
| Recommended Next Action | Add blocking warning with override option |
| Owner | Engineering |
| Founder Decision Required | NO |

---

## P2 Gaps

### GAP-015: Promise Engine uncommitted and not integration-tested

| Field | Value |
|---|---|
| ID | GAP-015 |
| Description | Promise Engine exists only in working tree; 0 integration tests |
| Source | MPCA-001 Promise Engine audit |
| Evidence | git status shows untracked src/lib/promise-engine/; 18 unit tests pass but no integration tests |
| Status | B — IMPLEMENTED / NOT FULLY VERIFIED |
| Severity | P2 |
| Customer #1 Impact | Enhances service monitoring; not required for basic operation |
| Dependency | None |
| Recommended Next Action | Commit; add integration tests; verify lifecycle end-to-end |
| Owner | Engineering |
| Founder Decision Required | NO |

### GAP-016: GR-016 regressions in payment services

| Field | Value |
|---|---|
| ID | GAP-016 |
| Description | Payment services hardcode Rwanda phone prefix, country, and timezone |
| Source | MPCA-001 GR-001 audit |
| Evidence | src/lib/services/momo.service.ts hardcodes '250'; src/lib/cron.ts hardcodes 'Africa/Kigali' |
| Status | C — PARTIALLY IMPLEMENTED |
| Severity | P2 (for Rwanda-only Customer #1) |
| Customer #1 Impact | Latent — Customer #1 is in Rwanda so defaults work |
| Dependency | None |
| Recommended Next Action | Fix payment services to use business.country; fix cron to use business.timezone |
| Owner | Engineering |
| Founder Decision Required | NO |

### GAP-017: Service Replay flaky test

| Field | Value |
|---|---|
| ID | GAP-017 |
| Description | 1 of 53 Service Replay tests fails (timing-sensitive performance test) |
| Source | MPCA-001 Service Replay audit |
| Evidence | tests/service-replay/service-replay.test.ts line 771 — expects < 10ms |
| Status | D — KNOWN DEFECT (flaky) |
| Severity | P2 |
| Customer #1 Impact | None (test-only issue) |
| Dependency | None |
| Recommended Next Action | Increase threshold or remove timing assertion |
| Owner | Engineering |
| Founder Decision Required | NO |

### GAP-018: Business commission test cache bug

| Field | Value |
|---|---|
| ID | GAP-018 |
| Description | 3 tests fail in business-commission.test.ts due to cache not clearing between tests |
| Source | MPCA-001 test baseline |
| Evidence | tests/unit/calculations/business-commission.test.ts — getPlatformFee caches result |
| Status | D — KNOWN DEFECT (pre-existing) |
| Severity | P2 |
| Customer #1 Impact | None (test-only issue) |
| Dependency | None |
| Recommended Next Action | Clear feeCache in beforeEach |
| Owner | Engineering |
| Founder Decision Required | NO |

---

## POST-LAUNCH Gaps

### GAP-019: DGS-001B/C backend refactoring

| Field | Value |
|---|---|
| ID | GAP-019 |
| Description | Backend terminology refactoring (restaurant → business) pending approval |
| Source | DGS-001 |
| Evidence | docs/DGS-001-Implementation-Priority-Matrix.md |
| Status | H — DEFERRED BY DESIGN |
| Severity | POST-LAUNCH |
| Customer #1 Impact | None (cosmetic/backend) |
| Dependency | Founder approval |
| Recommended Next Action | Defer until after Customer #1 |
| Owner | Founder |
| Founder Decision Required | YES |

### GAP-020: Database connection pool not configured

| Field | Value |
|---|---|
| ID | GAP-020 |
| Description | DATABASE_URL has no pgbouncer params for serverless |
| Source | GPV-D007 |
| Evidence | .env DATABASE_URL has no query params |
| Status | C — PARTIALLY IMPLEMENTED |
| Severity | P2 (may cause intermittent errors) |
| Customer #1 Impact | Intermittent 500 errors possible |
| Dependency | GAP-001 (production Supabase) |
| Recommended Next Action | Add ?pgbouncer=true&connection_limit=1 to production DATABASE_URL |
| Owner | Engineering |
| Founder Decision Required | NO |

---

## LONG-TERM

### GAP-021: Roadmap parking lot (62 items)

| Field | Value |
|---|---|
| ID | GAP-021 |
| Description | 62 post-launch evolutions including voice ordering, full WhatsApp ordering, website builder, etc. |
| Source | docs/pta/ROADMAP_PARKING_LOT.md |
| Evidence | Roadmap document |
| Status | I — LONG-TERM VISION |
| Severity | LONG-TERM |
| Customer #1 Impact | None |
| Dependency | None |
| Recommended Next Action | Post-launch planning |
| Owner | Founder |
| Founder Decision Required | YES (future prioritization) |
