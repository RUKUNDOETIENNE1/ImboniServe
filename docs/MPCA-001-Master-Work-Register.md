# MPCA-001 Master Work Register

| Field | Value |
|---|---|
| Audit Date | 2026-08-12 |
| Purpose | Master inventory of every meaningful work item discovered |

## Status Categories

- **A** — CERTIFIED COMPLETE
- **B** — IMPLEMENTED / NOT FULLY VERIFIED
- **C** — PARTIALLY IMPLEMENTED
- **D** — KNOWN DEFECT
- **E** — IMPLEMENTED / NOT DEPLOYMENT VERIFIED
- **F** — FOUNDER ACTION REQUIRED
- **G** — BLOCKED
- **H** — DEFERRED BY DESIGN
- **I** — LONG-TERM VISION
- **J** — UNKNOWN

## Priority Categories

- **P0** — MUST COMPLETE BEFORE CUSTOMER #1
- **P1** — SHOULD COMPLETE BEFORE CUSTOMER #1
- **P2** — NON-BLOCKING PRE-LAUNCH
- **POST-LAUNCH** — After initial real-world validation
- **LONG-TERM** — Not part of Customer #1 readiness

---

## Work Items

### W-001: Order Lifecycle (OEC-001)

| Field | Value |
|---|---|
| Work ID | W-001 |
| Feature/System | Order lifecycle: QR scan → Order → Kitchen → Payment |
| Source Phase | OEC-001 |
| Original Claim | Certified complete |
| Current Repository Evidence | OEC-001c through 001h remediation tests pass (418 reliability tests) |
| Implementation Status | A — CERTIFIED COMPLETE |
| Test Status | PASS (reliability suites) |
| Integration Status | Verified in GPV-001 workflow verification |
| Deployment Verification | NOT VERIFIED (no production) |
| Production Relevance | P0 — Core business operation |
| Customer #1 Impact | Required for daily operation |
| Founder Decision Required | No |
| Recommended Action | None (engineering complete) |
| Priority | P0 |
| Evidence | tests/reliability/oec-001c through oec-001h test suites |

### W-002: Kitchen Dispatch (OEC-001)

| Field | Value |
|---|---|
| Work ID | W-002 |
| Feature/System | Kitchen dispatch, station routing, KDS |
| Source Phase | OEC-001, GPV-001 |
| Original Claim | Certified complete |
| Current Repository Evidence | KitchenDispatchService exists; Promise Engine integration added (uncommitted) |
| Implementation Status | A — CERTIFIED COMPLETE (Promise Engine integration is B) |
| Test Status | PASS (oec-001h simulation) |
| Integration Status | Verified |
| Deployment Verification | NOT VERIFIED |
| Production Relevance | P0 |
| Customer #1 Impact | Required for kitchen operations |
| Founder Decision Required | No |
| Recommended Action | None |
| Priority | P0 |
| Evidence | src/lib/services/kitchen-dispatch.service.ts, tests/reliability/oec-001h-simulation.test.ts |

### W-003: Payment Processing (OEC-001, GPV-001, CR-001A)

| Field | Value |
|---|---|
| Work ID | W-003 |
| Feature/System | Payment processing: IremboPay, InTouch, cash |
| Source Phase | OEC-001, GPV-001, CR-001A, PE-001A |
| Original Claim | Transactional payment completion (CR-001A) |
| Current Repository Evidence | PaymentCompletionService atomic transaction; IremboPay webhook delegates to canonical path; InTouch webhook does NOT |
| Implementation Status | B — InTouch webhook bypasses canonical path |
| Test Status | GPV-D010 financial truth chain tests pass |
| Integration Status | IremboPay: VERIFIED; InTouch: GAP |
| Deployment Verification | NOT VERIFIED |
| Production Relevance | P0 |
| Customer #1 Impact | Payments must work correctly |
| Founder Decision Required | D2 (IremboPay), D3 (MTN MoMo) |
| Recommended Action | Fix InTouch webhook to call PaymentCompletionService |
| Priority | P0 |
| Evidence | src/lib/services/payment-completion.service.ts, src/pages/api/webhooks/intouch.ts, src/pages/api/payments/irembo/webhook.ts |

### W-004: Financial Ledger (OEC-001, GPV-D010, CR-001A)

| Field | Value |
|---|---|
| Work ID | W-004 |
| Feature/System | FinancialLedgerEntry — canonical financial source |
| Source Phase | OEC-001, GPV-D010, CR-001A |
| Original Claim | Canonical ledger, atomic creation |
| Current Repository Evidence | PaymentCompletionService creates ledger atomically; CEO/CFO use ledger; dashboard stats uses Sale table |
| Implementation Status | B — Dashboard stats API uses wrong data source |
| Test Status | GPV-D010 tests pass |
| Integration Status | Inconsistent (CEO/CFO correct, stats API incorrect) |
| Deployment Verification | NOT VERIFIED |
| Production Relevance | P0 |
| Customer #1 Impact | Financial reporting accuracy |
| Founder Decision Required | No |
| Recommended Action | Fix /api/dashboard/stats.ts to use FinancialLedgerEntry |
| Priority | P1 |
| Evidence | src/pages/api/dashboard/stats.ts, src/pages/api/dashboard/ceo.ts, src/pages/api/dashboard/cfo.ts |

### W-005: Close-Day / Z-Report (OEC-001, GPV-D011, CR-001A)

| Field | Value |
|---|---|
| Work ID | W-005 |
| Feature/System | Z-Report, close-day, outstanding liabilities |
| Source Phase | OEC-001, GPV-D011, CR-001A |
| Original Claim | Atomic close-day with liabilities and pending order warning |
| Current Repository Evidence | Close-day uses atomic transaction; ledger cross-check; liabilities calculated; pending orders counted but not blocking |
| Implementation Status | B — Pending order warning non-blocking |
| Test Status | GPV-D011 tests pass (16 unit + 18 e2e) |
| Integration Status | Verified |
| Deployment Verification | NOT VERIFIED |
| Production Relevance | P0 |
| Customer #1 Impact | End-of-day reconciliation |
| Founder Decision Required | No |
| Recommended Action | Consider making pending order warning blockable (with override) |
| Priority | P1 |
| Evidence | src/pages/api/reports/close-day.ts, tests/reliability/gpv-d011-zreport-reservation.test.ts |

### W-006: Inventory Management (OEC-001)

| Field | Value |
|---|---|
| Work ID | W-006 |
| Feature/System | Inventory CRUD, stock adjustments, low stock alerts |
| Source Phase | OEC-001, GPV-001 |
| Original Claim | Certified complete |
| Current Repository Evidence | Inventory services exist; GPV-001 verified CRUD |
| Implementation Status | A — CERTIFIED COMPLETE |
| Test Status | PASS (reliability suites) |
| Integration Status | Verified |
| Deployment Verification | NOT VERIFIED |
| Production Relevance | P1 |
| Customer #1 Impact | Useful but not blocking |
| Founder Decision Required | No |
| Recommended Action | None |
| Priority | P1 |
| Evidence | GPV-001 Phase 10 verification |

### W-007: Reservations (OEC-001, GPV-D012)

| Field | Value |
|---|---|
| Work ID | W-007 |
| Feature/System | Reservation lifecycle, table management |
| Source Phase | OEC-001, GPV-D012 |
| Original Claim | Remediated (GPV-D012) |
| Current Repository Evidence | PATCH routes to domain methods; 34 tests pass |
| Implementation Status | A — CERTIFIED COMPLETE |
| Test Status | PASS (gpv-d012-reservation-lifecycle.test.ts) |
| Integration Status | Verified |
| Deployment Verification | NOT VERIFIED |
| Production Relevance | P1 |
| Customer #1 Impact | Table management |
| Founder Decision Required | No |
| Recommended Action | None |
| Priority | P1 |
| Evidence | src/pages/api/reservations/[id].ts, tests/reliability/gpv-d012-reservation-lifecycle.test.ts |

### W-008: Supplier Orders (OEC-001, GPV-D013)

| Field | Value |
|---|---|
| Work ID | W-008 |
| Feature/System | Supplier orders, BigInt serialization |
| Source Phase | OEC-001, GPV-D013 |
| Original Claim | Remediated (GPV-D013) |
| Current Repository Evidence | BigInt serialization handled; 16 tests pass |
| Implementation Status | A — CERTIFIED COMPLETE |
| Test Status | PASS (gpv-d013-bigint-serialization.test.ts) |
| Integration Status | Verified |
| Deployment Verification | NOT VERIFIED |
| Production Relevance | P2 |
| Customer #1 Impact | Not blocking |
| Founder Decision Required | No |
| Recommended Action | None |
| Priority | P2 |
| Evidence | tests/reliability/gpv-d013-bigint-serialization.test.ts |

### W-009: Tax Configuration (GPV-D009)

| Field | Value |
|---|---|
| Work ID | W-009 |
| Feature/System | Tax config: isInclusive vs taxMode |
| Source Phase | GPV-D009 |
| Original Claim | Remediated |
| Current Repository Evidence | country-config.ts has INCLUSIVE for RW/UG/TZ; settings sync; 24 tests pass |
| Implementation Status | A — CERTIFIED COMPLETE |
| Test Status | PASS (gpv-d009-tax-config-consistency.test.ts) |
| Integration Status | Verified |
| Deployment Verification | NOT VERIFIED |
| Production Relevance | P0 |
| Customer #1 Impact | Correct pricing |
| Founder Decision Required | No |
| Recommended Action | None |
| Priority | P0 |
| Evidence | src/lib/utils/country-config.ts, tests/reliability/gpv-d009-tax-config-consistency.test.ts |

### W-010: Security — Secret Fallbacks (PE-001A)

| Field | Value |
|---|---|
| Work ID | W-010 |
| Feature/System | Fail-closed secret resolution |
| Source Phase | PE-001A |
| Original Claim | 12 security issues fixed |
| Current Repository Evidence | All 7 checked services use fail-closed pattern; pe-001a-secret-fallback.test.ts passes |
| Implementation Status | A — CERTIFIED COMPLETE |
| Test Status | PASS |
| Integration Status | Verified |
| Deployment Verification | NOT VERIFIED |
| Production Relevance | P0 |
| Customer #1 Impact | Security |
| Founder Decision Required | No (but production secrets must be set) |
| Recommended Action | None (engineering complete) |
| Priority | P0 |
| Evidence | src/lib/services/qr-token.service.ts, tests/reliability/pe-001a-secret-fallback.test.ts |

### W-011: Security — Cron Authentication (PE-001A)

| Field | Value |
|---|---|
| Work ID | W-011 |
| Feature/System | Cron endpoint Bearer token auth |
| Source Phase | PE-001A |
| Original Claim | All cron endpoints protected |
| Current Repository Evidence | All 16 cron endpoints use `Bearer ${CRON_SECRET}` auth |
| Implementation Status | A — CERTIFIED COMPLETE |
| Test Status | Verified by code inspection |
| Integration Status | Verified |
| Deployment Verification | NOT VERIFIED |
| Production Relevance | P0 |
| Customer #1 Impact | Security |
| Founder Decision Required | No (but CRON_SECRET must be set in production) |
| Recommended Action | None |
| Priority | P0 |
| Evidence | src/pages/api/cron/*.ts (all 16 endpoints) |

### W-012: Security — Referral Code Generation (NEW FINDING)

| Field | Value |
|---|---|
| Work ID | W-012 |
| Feature/System | Customer referral code generation |
| Source Phase | MPCA-001 (new finding) |
| Original Claim | (not previously flagged) |
| Current Repository Evidence | src/pages/api/customer-referrals/generate.ts has NO authentication |
| Implementation Status | D — KNOWN DEFECT |
| Test Status | N/A |
| Integration Status | N/A |
| Deployment Verification | N/A |
| Production Relevance | P1 |
| Customer #1 Impact | Unauthorized referral code generation |
| Founder Decision Required | No |
| Recommended Action | Add requirePermission middleware to generate endpoint |
| Priority | P1 |
| Evidence | src/pages/api/customer-referrals/generate.ts |

### W-013: Promise Engine

| Field | Value |
|---|---|
| Work ID | W-013 |
| Feature/System | Service promise tracking, SLA monitoring, risk dashboard |
| Source Phase | Post-PE-001A (uncommitted) |
| Original Claim | Implemented with 18 unit tests; integration test remaining |
| Current Repository Evidence | 3 source files, 2 API endpoints, 1 dashboard page, 1 test file, 1 migration — ALL UNCOMMITTED |
| Implementation Status | B — IMPLEMENTED / NOT FULLY VERIFIED |
| Test Status | 18 unit tests PASS; 0 integration tests |
| Integration Status | Kitchen Dispatch integration coded but not tested; Heart Pulse events coded but not tested; Service Replay events coded but not tested |
| Deployment Verification | NOT VERIFIED (not committed) |
| Production Relevance | P2 (enhancement, not blocking) |
| Customer #1 Impact | Improves service quality monitoring; not required for basic operation |
| Founder Decision Required | No |
| Recommended Action | Commit, add integration tests, verify lifecycle end-to-end |
| Priority | P2 |
| Evidence | src/lib/promise-engine/, tests/unit/promise-engine/evaluator.test.ts |

### W-014: Service Replay

| Field | Value |
|---|---|
| Work ID | W-014 |
| Feature/System | Operational timeline replay |
| Source Phase | DIE, GPV-001 |
| Original Claim | Production ready |
| Current Repository Evidence | 5 source files; transformer supports Promise events; dashboard page exists; 52/53 tests pass |
| Implementation Status | B — IMPLEMENTED / NOT FULLY VERIFIED |
| Test Status | 52 pass, 1 flaky timing test |
| Integration Status | Promise events mapped in transformer (uncommitted change) |
| Deployment Verification | NOT VERIFIED |
| Production Relevance | P2 (enhancement) |
| Customer #1 Impact | Operational insight; not required for basic operation |
| Founder Decision Required | No |
| Recommended Action | Fix flaky test; verify with real events |
| Priority | P2 |
| Evidence | src/lib/service-replay/, tests/service-replay/service-replay.test.ts |

### W-015: Heart Pulse

| Field | Value |
|---|---|
| Work ID | W-015 |
| Feature/System | Event-driven architecture, Pusher event publishing |
| Source Phase | DIE, Promise Engine |
| Original Claim | Event catalog complete |
| Current Repository Evidence | Event catalog with 6 Promise events (uncommitted); publisher functional; subscribers documented |
| Implementation Status | A — CERTIFIED COMPLETE (catalog); B (Promise events uncommitted) |
| Test Status | N/A (catalog is declarative) |
| Integration Status | Publisher wraps Pusher; subscribers documented |
| Deployment Verification | NOT VERIFIED |
| Production Relevance | P1 |
| Customer #1 Impact | Real-time updates |
| Founder Decision Required | D6 (Pusher cluster) |
| Recommended Action | None (engineering complete) |
| Priority | P1 |
| Evidence | src/lib/heart-pulse/event-catalog.ts, src/lib/heart-pulse/publisher.ts |

### W-016: Global Readiness (GR-001/GR-001A)

| Field | Value |
|---|---|
| Work ID | W-016 |
| Feature/System | Currency, timezone, country, phone, tax configuration |
| Source Phase | GR-001, GR-001A |
| Original Claim | EGR-016 satisfied |
| Current Repository Evidence | Business model has configurable fields; 8 regressions in payment services and cron |
| Implementation Status | C — PARTIALLY IMPLEMENTED (regressions) |
| Test Status | N/A (no GR regression test suite found) |
| Integration Status | Configuration infrastructure exists; payment services bypass it |
| Deployment Verification | NOT VERIFIED |
| Production Relevance | P1 (for Rwanda-only Customer #1: P2; for multi-country: P1) |
| Customer #1 Impact | Customer #1 is in Rwanda, so regressions are latent, not active |
| Founder Decision Required | No |
| Recommended Action | Fix payment service hardcoding; fix cron timezone hardcoding |
| Priority | P2 (for Rwanda-only Customer #1) |
| Evidence | src/lib/services/momo.service.ts, src/lib/cron.ts, src/utils/rwandaUtils.ts |

### W-017: Production Environment (PE-001, PE-001A)

| Field | Value |
|---|---|
| Work ID | W-017 |
| Feature/System | Production infrastructure: Vercel, Supabase, Redis, Pusher, Sentry, SMTP, payments |
| Source Phase | PE-001, PE-001A |
| Original Claim | NOT ESTABLISHED; 7 founder decisions required |
| Current Repository Evidence | No production environment exists; 0 components VERIFIED; 7 decisions unresolved |
| Implementation Status | F — FOUNDER ACTION REQUIRED |
| Test Status | N/A |
| Integration Status | N/A |
| Deployment Verification | NOT VERIFIED |
| Production Relevance | P0 |
| Customer #1 Impact | Cannot go live without production environment |
| Founder Decision Required | YES — D1 through D7 |
| Recommended Action | Founder makes decisions; establish production infrastructure |
| Priority | P0 |
| Evidence | docs/PE-001-Production-Readiness-Matrix.md, docs/PE-001A-Founder-Production-Decision-Record.md |

### W-018: Cron Scheduling (GPV-D002)

| Field | Value |
|---|---|
| Work ID | W-018 |
| Feature/System | Vercel cron job scheduling |
| Source Phase | GPV-D002 |
| Original Claim | 7 cron jobs unscheduled |
| Current Repository Evidence | vercel.json has 9 entries; 16 endpoints exist; 7 unscheduled |
| Implementation Status | C — PARTIALLY IMPLEMENTED |
| Test Status | N/A |
| Integration Status | 9/16 scheduled |
| Deployment Verification | NOT VERIFIED |
| Production Relevance | P1 |
| Customer #1 Impact | Reservation reminders, subscription reminders won't fire |
| Founder Decision Required | No |
| Recommended Action | Add 7 missing cron entries to vercel.json |
| Priority | P1 |
| Evidence | vercel.json, src/pages/api/cron/ |

### W-019: Vercel Deployment

| Field | Value |
|---|---|
| Work ID | W-019 |
| Feature/System | Vercel production deployment |
| Source Phase | PE-001A, post-commit 4763153 |
| Original Claim | "should now succeed" |
| Current Repository Evidence | Build succeeds locally; Vercel NOT ACCESSIBLE from audit |
| Implementation Status | E — NOT DEPLOYMENT VERIFIED |
| Test Status | N/A |
| Integration Status | N/A |
| Deployment Verification | NOT VERIFIED |
| Production Relevance | P0 |
| Customer #1 Impact | Cannot go live without deployment |
| Founder Decision Required | D7 (Vercel billing), D5 (domain) |
| Recommended Action | Deploy to Vercel and verify |
| Priority | P0 |
| Evidence | next build succeeds; no Vercel access |

### W-020: DGS-001B/C Backend Refactoring

| Field | Value |
|---|---|
| Work ID | W-020 |
| Feature/System | Backend terminology refactoring (restaurant → business) |
| Source Phase | DGS-001 |
| Original Claim | Pending executive approval |
| Current Repository Evidence | DGS-001A (customer-facing) complete; DGS-001B/C not started |
| Implementation Status | H — DEFERRED BY DESIGN |
| Test Status | N/A |
| Integration Status | N/A |
| Deployment Verification | N/A |
| Production Relevance | POST-LAUNCH |
| Customer #1 Impact | None (cosmetic/backend) |
| Founder Decision Required | Yes — approve DGS-001B/C |
| Recommended Action | Defer until after Customer #1 |
| Priority | POST-LAUNCH |
| Evidence | docs/DGS-001-Implementation-Priority-Matrix.md |

### W-021: AI Credits Platform

| Field | Value |
|---|---|
| Work ID | W-021 |
| Feature/System | AI credit wallet, ledger, consumption engine |
| Source Phase | AI Credits |
| Original Claim | Sprint status: COMPLETE |
| Current Repository Evidence | 8 services, API endpoints, security documented |
| Implementation Status | A — CERTIFIED COMPLETE |
| Test Status | Documented test plan |
| Integration Status | Verified |
| Deployment Verification | NOT VERIFIED |
| Production Relevance | P1 |
| Customer #1 Impact | AI features require credits |
| Founder Decision Required | No |
| Recommended Action | None |
| Priority | P1 |
| Evidence | docs/AI_CREDITS_IMPLEMENTATION_SUMMARY.md |

### W-022: Monitoring & Alerting (GPV-D004)

| Field | Value |
|---|---|
| Work ID | W-022 |
| Feature/System | Sentry, Slack, email alerts |
| Source Phase | GPV-D004, PE-001 |
| Original Claim | NOT CONFIGURED |
| Current Repository Evidence | SENTRY_DSN not set; SLACK_WEBHOOK_URL not set; ALERT_EMAIL_TO not set |
| Implementation Status | F — FOUNDER ACTION REQUIRED |
| Test Status | N/A |
| Integration Status | Code exists (AlertDeliveryService) |
| Deployment Verification | NOT VERIFIED |
| Production Relevance | P1 |
| Customer #1 Impact | Production issues will be invisible |
| Founder Decision Required | Yes — configure Sentry, Slack, email |
| Recommended Action | Configure monitoring before go-live |
| Priority | P1 |
| Evidence | .env (missing vars), src/lib/services/alert-delivery.service.ts |

### W-023: Backup & Recovery (PE-001)

| Field | Value |
|---|---|
| Work ID | W-023 |
| Feature/System | Database backup, recovery procedures |
| Source Phase | PE-001 |
| Original Claim | NOT CONFIGURED |
| Current Repository Evidence | RB-001 runbook exists; no backup test performed |
| Implementation Status | F — FOUNDER ACTION REQUIRED |
| Test Status | N/A |
| Integration Status | N/A |
| Deployment Verification | NOT VERIFIED |
| Production Relevance | P0 |
| Customer #1 Impact | Data loss risk |
| Founder Decision Required | Yes — D1 (Supabase Pro includes backups) |
| Recommended Action | Establish production Supabase with backups; test recovery |
| Priority | P0 |
| Evidence | docs/PE-001-Backup-Recovery-Readiness.md |

### W-024: Reconciliation Service

| Field | Value |
|---|---|
| Work ID | W-024 |
| Feature/System | Payment-order reconciliation |
| Source Phase | OEC-001, Financial Truth audit |
| Original Claim | Reconciliation exists |
| Current Repository Evidence | ReconciliationService checks PaymentTransaction ↔ Sale; does NOT check FinancialLedgerEntry |
| Implementation Status | C — PARTIALLY IMPLEMENTED |
| Test Status | N/A |
| Integration Status | Missing ledger reconciliation |
| Deployment Verification | NOT VERIFIED |
| Production Relevance | P1 |
| Customer #1 Impact | Financial discrepancies may go undetected |
| Founder Decision Required | No |
| Recommended Action | Extend ReconciliationService to check ledger |
| Priority | P1 |
| Evidence | src/lib/services/reconciliation.service.ts |

### W-025: WhatsApp Notifications (PE-001)

| Field | Value |
|---|---|
| Work ID | W-025 |
| Feature/System | Twilio WhatsApp business messaging |
| Source Phase | PE-001 |
| Original Claim | BLOCKED (error 63007) |
| Current Repository Evidence | Twilio credentials set; WhatsApp broken per PE-001 |
| Implementation Status | G — BLOCKED |
| Test Status | N/A |
| Integration Status | Code exists (NotificationService) |
| Deployment Verification | NOT VERIFIED |
| Production Relevance | P1 |
| Customer #1 Impact | Staff notifications via WhatsApp won't work |
| Founder Decision Required | Yes — resolve Twilio WhatsApp setup |
| Recommended Action | Resolve Twilio WhatsApp business account |
| Priority | P1 |
| Evidence | docs/PE-001-Production-Readiness-Matrix.md |
