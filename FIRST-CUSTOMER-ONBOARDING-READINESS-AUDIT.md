# FIRST-CUSTOMER-ONBOARDING-READINESS-AUDIT

**Repository:** `C:\Dev\ImboniResto` (ImboniServe)
**Branch:** `main` | **HEAD:** `7bcd1db` (2 commits ahead of `origin/main`)
**Audit type:** READ-ONLY. No code changed, no migrations applied, no DB writes, no commits.
**Method:** Live codebase inspection + parallel domain audits + read-only Supabase query via `DIRECT_URL`.

---

## 1. Executive Summary

ImboniServe is substantially more complete than a typical pre-launch product: the core ordering pipeline (QR → public menu → cart → order → kitchen dispatch → payment → ledger) is implemented with real transactional logic, idempotency, tenant scoping, and a strong payment test suite. A first customer can plausibly run on it — **but not yet**, because of a small number of hard blockers:

**The three most important findings:**

1. **QR ordering is switched off with no way to turn it on.** `Business.enableQRInVenue` / `enableQRRemote` default to `false`, and the only code that sets them is a dev-only endpoint (`src/pages/api/dev/bootstrap-tap-leave.ts`, blocked in production). Every public ordering endpoint returns 403 without them. A customer's first QR scan would fail today.
2. **The customer-facing order page is not mobile-responsive.** `src/pages/order/index.tsx` uses inline styles and fixed multi-column grids with no media queries — this is the page every QR customer lands on.
3. **The Supabase database is 3 migrations behind**, not 2: `20260815100000_editorial_content_phase_a`, `20260920130000_currency_bnr_phase3`, `20260921120000_currency_bnr_phase4` are all pending. CurrencyExchangeRate FX columns and PaymentTransaction FX snapshot columns do not exist in production.

Plus one security finding that must not ship: `src/pages/api/webhooks/addons/payment-success.ts` accepts unauthenticated POSTs that can mark transactions SUCCESS and activate paid entitlements.

---

## 2. First Customer Journey — Status by Step

| Step | Status | Evidence / Files |
|------|--------|------------------|
| Owner signup | **B** | `api/auth/signup.ts` — zod-validated, bcrypt(12), creates User+Business, anti-fraud trial check, rate-limited |
| Login | **B** | Mandatory MFA: `pre-login` → `verify-mfa-otp` → `[...nextauth]` confirm-token → JWT (8h) |
| Business setup | **B** | Business created at signup w/ country defaults (currency, taxRate, taxMode); `api/business/[id]/settings.ts` GET/PUT; **gap:** no API to edit profile name/address (`profile.ts` is GET-only) |
| Branch/location | **B** | `Branch` model + `api/tables/*`, `api/seats/*`, `api/outlets/*` CRUD exist |
| Create menu | **C** | `api/menu/*` CRUD works but flat `category` string only — **no Menu/MenuCategory/ModifierGroup models**; `isSpecial` PATCH bug crashes (column doesn't exist); **no image-upload API** (`imageReal` is read but never written) |
| Import menu | **B** | `api/menu-builder/{upload,extract,candidates,import}.ts` GPT-vision OCR pipeline + CSV/Sheets import (`menu-import.service.ts`, `MenuImportWizard.tsx`); depends on `OPENAI_API_KEY`/Azure DI |
| Publish menu | **D** | No publish concept — only per-item `isAvailable` + business QR flags |
| Generate QR | **C** | `qr-generator.service.ts` + `api/qr/generate.ts` + saved designs (`api/qr/designs`) + `/q/[token]` short links; **bugs:** unsaved builder downloads produce unsigned URLs that 401; seat-only/outlet-only QRs fail signature validation |
| Customer scans QR | **E→works after flag fix** | Blocked by `enableQRInVenue=false` with no business-facing toggle |
| View public menu | **B** | `order/index.tsx` → `api/public/order/token` (JWT, 10min, single-use) → `api/public/menu` — works once flags enabled |
| Cart | **B** | Client-side cart on `/order` page |
| Place order | **B** | `api/public/order/draft` — zod, idempotency keys, serializable tx, slot-capacity lock, creates Sale+PaymentTransaction, OTP-verify for remote |
| Confirm | **B** | `api/public/order/confirm` — `withCsrf`, `customerConfirmedAt`, `KitchenDispatchService.dispatchToKitchen` |
| Business receives order | **A** | Kitchen dispatch idempotent, Pusher `order.created` on `private-kitchen-{biz}` + polling, `dashboard/orders/unified.tsx` |
| Kitchen processes | **A** | `dashboard/kitchen.tsx` + `dashboard/kds.tsx` (real, not mock), station routing, `kitchenStatus` state machine `pending→accepted→preparing→almost_ready→ready→served` |
| Payment | **C** | InTouchPay implemented; draft defaults `paymentMethod:'WEB'` → IremboPay invoice; **VAT=0 hardcoded on InTouch initiate + reservation deposit**; sandbox creds blocked by provider |
| Webhook/callback | **B** | `api/webhooks/intouch.ts` — mandatory Basic auth, idempotent, amount+isolation checks, atomic `PaymentCompletionService`; **needs `INTOUCH_WEBHOOK_*` env (currently unset → 503)** |
| Transaction recorded | **A** | `PaymentTransaction` + `FinancialLedgerEntry` atomic, idempotency keys, `dashboard/transactions.tsx` real |
| Order/payment history | **A** | `api/transactions`, `api/orders/unified`, reconciliation cron + admin UI |

---

## 3. Implementation Matrix

| Area | Status | Summary |
|------|--------|---------|
| Auth (signup/login/MFA/reset) | B | Hardened; no email verification; JWT can't be revoked early |
| Business onboarding | B | Signup-coupled; progress tracker exists; no profile-edit API; no wizard |
| Staff/roles/permissions | B | Staff CRUD + custom roles + permission middleware; **role-value escalation bug** |
| Tenant isolation | B | `resolveBusinessContext` convention — clean in spot checks, not enforced globally |
| Menu management | C | Flat category string; no modifiers; no image write path; `isSpecial` bug; no publish flag |
| QR ordering | C | Works via saved designs; enable flags un-settable; unsigned builder downloads; seat-only signature bug |
| Order management | A− | Unified dashboard, lifecycle, cancel rules, notifications; status endpoint accepts arbitrary strings |
| Kitchen/KDS | A | Real, role-gated, realtime, station routing, retry on failed dispatch |
| Payments | B− | InTouch + IremboPay + MoMo; atomic completion; reconciliation; **VAT=0 on 2 paths** |
| InTouchPay | B / **E** | Doc-conformant code; blocked on provider for sandbox accountno/URL + prod creds |
| Currency/BNR | **A** | Phases 1–4 complete; 56/56 + 30/30 tests; pending migrations + prod env only |
| WhatsApp | C | Staff ordering + outbound alerts work; campaign scheduler is a stub; inbound Meta webhook logs-only; conditional signature checks |
| Reservations | B | Full model + service + deposit + dashboard; deposit VAT=0; no double-booking check |
| Analytics | B | Real aggregates for core; 3 pages ship mock data (customer-feedback, advanced-reporting, die/analytics) |
| Security | C | Strong primitives; **unauthenticated payment-success webhook**; role escalation; fail-open webhook sigs; in-memory rate limits |
| Mobile/responsive | C | Dashboard shell good; **`order/index.tsx` not responsive (customer-facing)** |
| Tests | B | ~90 files; strong payments/currency; **no end-to-end journey test; zero WhatsApp tests** |

---

## 4. Business Onboarding (detail)

- Signup → User + Business atomic-ish (not transactional — orphan-user risk between the two inserts), `businessType` enum, country defaults (`getCountryDefaults`), `TaxService.createDefaultTaxConfig`.
- `BusinessApprovalService` → `approvalStatus` PENDING/APPROVED; admin approval endpoints exist.
- Settings API covers taxMode/taxRate/currency/fees with permission checks.
- **Missing for first customer:** business profile edit endpoint (name/address), a real onboarding wizard (welcome page is static), and — critically — **any UI/API to enable QR ordering flags**.

## 5. Authentication & Authorization (detail)

- Mandatory OTP-MFA at every login (compensates for missing email verification).
- `requireAuth` / `requireRole` / `requirePermission` middleware; OWNER bypass convention.
- **Gaps:** `verifyInDb` defaults false (JWT roles trusted up to 8h post-demotion); `requirePermission` skipped on `orders/[id]/status.ts`; session revocation can't invalidate live JWTs.

## 6. Menu (detail)

- `MenuItem`: name/desc/priceCents/costCents/category(string)/isAvailable/allergens/dietaryTags/imageReal — solid flat model, **no modifiers**.
- **`api/menu/[id].ts:30-39` bug:** PATCH accepts `isSpecial`, writes a non-existent column → Prisma throws. Dashboard "Mark as Special" button hits exactly this. Small fix, real breakage.
- OCR/AI import pipeline is substantial and real (upload → storage → GPT extraction → candidates → import), gated OWNER/ADMIN/MANAGER.
- **No API writes `imageReal`** — menu items can't get photos through the product today.

## 7. QR Ordering (detail — first-customer critical)

The pipeline itself is well-built (signed URLs via HMAC `IMBONI_QR_SECRET`, single-use JWT tokens, transactional draft creation, CSRF on confirm, realtime status). Three blockers:

1. **P0** — `enableQRInVenue`/`enableQRRemote` (schema.prisma:140-141) default false; only `api/dev/bootstrap-tap-leave.ts` sets them (403 in prod). → Add a settings toggle or set via DB/admin during onboarding.
2. **P1** — QR Builder unsaved downloads encode unsigned URL → scan → "Invalid or incomplete QR link" (`qr-builder.tsx:178-185` vs `order/index.tsx:168-172`). Saved designs work via `/q/[token]`.
3. **P1** — Seat-only/outlet-only QR: signature computed over seat/outlet id but `/order` → `/token` only forwards `tableId` → permanent 401 (`api/qr/generate.ts` vs `qr-token.service.ts:63`).

## 8. Order Management (detail)

Orders = `Sale` model with `orderSource`, `kitchenStatus`, `expoStatus`, item-level `itemStatus`. Unified dashboard polls `api/orders/unified` (businessId-scoped, 24h). Cancel blocks paid orders. Notifications: kitchen dispatch → Pusher + WhatsApp on payment success. **Gap:** `PUT /api/orders/[id]/status` accepts arbitrary strings (no enum/transition validation).

## 9. Kitchen / KDS (detail)

Genuinely functional: `dashboard/kitchen.tsx` (real data, role-gated, urgency timers, awaiting-payment detection), `dashboard/kds.tsx` (station view, real API), `api/kitchen/*` + `api/station/*` with transactional status machine, station routing via `RoutingService`, failed-dispatch retry. Mobile kanban is responsive. Minor: kitchen card renders `it.notes` but `SaleItem` has `instructions` (P2 display gap).

## 10. Payments (detail)

- **InTouchPay** (primary): legacy `intouch.service.ts` + newer `intouch.provider.ts`; SHA-256 auth hash; initiate/status/webhook routes; `PaymentCompletionService` atomic completion (Sale→COMPLETED + Txn→SUCCESS + ledger, idempotent).
- **IremboPay**: real VAT split, HMAC raw-body verify + server-to-server re-verification, idempotent.
- Reconciliation: nightly cron expires stale txns, mismatch logging, admin UI.
- **⚠️ VAT=0 hardcoded** at `api/payments/intouch/initiate.ts:112-113` and `api/reservations/[id]/deposit/initiate.ts:60-61`. QR-order path computes VAT correctly — inconsistent.
- **⚠️ `INTOUCH_WEBHOOK_USERNAME/PASSWORD` unset → webhook returns 503** (fail-closed, but payments never confirm until configured).
- FX snapshot fields written by both payment paths (Phase 3/4 work) — **blocked at runtime until migrations applied** (columns don't exist in prod DB).

## 11. InTouchPay (detail)

| Area | Status |
|------|--------|
| RequestPayment/RequestDeposit/GetBalance/GetTransactionStatus | IMPLEMENTED (doc-conformant, mocked tests) |
| Webhook Basic Auth + idempotency + status mapping + atomic completion | IMPLEMENTED |
| HMAC webhook verification | NOT IMPLEMENTED (`validateWebhook` stub returns valid:true — Basic Auth is the only real check) |
| Live sandbox (GetBalance, test payment) | **BLOCKED BY INTOUCHPAY** — needs sandbox `accountno`, confirmed sandbox URL, test MSISDN, USSD behavior |
| Callback whitelisting | **BLOCKED BY INTOUCHPAY** — after 100 RWF test; then set `INTOUCH_WEBHOOK_*` |
| Production credentials | **BLOCKED BY INTOUCHPAY** — only sandbox `testa` exists |

Inconsistencies to resolve with provider: `mobilephone` vs `mobilephoneno` field name; `initiate.ts` ignores `INTOUCH_CALLBACK_URL`; `INTOUCH_PASSWORD` vs `INTOUCH_PARTNER_PASSWORD` alias drift.

## 12. Currency / BNR (detail — verified complete)

Phases 1–4 done and verified this session: canonical `currency-exchange.service.ts`, BNR client with real `X-API-KEY` auth (live call returned 200, 57 currencies), verified quotation direction (RWF per unit foreign, USD avg 1473.015), supersession w/ `revision`, timeout, rate-type policy env vars, Guardian-style cron at `vercel.json` `30 6 * * *`, structured logging, 56/56 currency + 30/30 payment tests, zero new TS errors, no secrets in tracked files or git history. **Remaining:** apply 2 migrations + set `BNR_API_KEY`, `CRON_SECRET`, `BNR_SYNC_ENABLED` in Vercel Production.

## 13. WhatsApp (detail)

Staff-assisted ordering (`ORDER T5 2x ...` parser → Sale) and outbound ops alerts via Twilio work and are used by kitchen-ready/OTP/Guardian paths. Not production-ready for customer ordering: campaign scheduler is a stub that fakes sends; Meta inbound webhook logs only; `sendPaymentConfirmation` builds but never sends; signature checks skip silently when secrets unset. **Verdict for customer #1: NOT required for the core package** — enable later.

## 14. Reservations (detail)

Real model + service + deposit + dashboard + reminder cron, plan-gated (`hasReservations`). Gaps: deposit VAT hardcoded 0, no double-booking check on `tableId`, deposit initiation is staff-side only. **P1** — usable, not required for core ordering.

## 15. Analytics (detail)

Real: dashboard aggregates, menu performance, peak hours, payments, QR scans — all businessId-scoped. Mock: `customer-feedback.tsx`, `advanced-reporting.tsx`, `die/analytics.tsx` — hide/gate before showing a customer. Core analytics: **P1-ready**.

## 16. Security (detail — findings)

- **🚨 P0:** `api/webhooks/addons/payment-success.ts` — no auth/signature/secret; POST `{transactionId,status:'SUCCESS'}` forges payment confirmation + entitlements.
- **P1:** Staff creation accepts arbitrary role strings (`api/staff/index.ts:91`, `[id].ts:51`) → privilege escalation to ADMIN by a MANAGER.
- **P1:** Webhook signature checks fail open when secret unset (WhatsApp `WHATSAPP_APP_SECRET`, Twilio `TWILIO_AUTH_TOKEN`); InTouch HMAC-fallback bypassable.
- **P2:** In-memory rate limiting ineffective multi-instance; `withCsrf` applied to only 2 endpoints (SameSite=Lax partially compensates); `orders/[id]/status` no enum validation.
- Good: bcrypt, OTP hashing, fail-closed `NEXTAUTH_SECRET`/`IMBONI_QR_SECRET`/`BNR_API_KEY`, zod on critical public routes, idempotency keys, webhook businessId isolation checks.

## 17. Mobile / Responsive (detail)

Dashboard shell has proper mobile drawer; kitchen board responsive; login/checkout fine. **P0:** `src/pages/order/index.tsx` — the QR customer page — is all inline styles, fixed `2fr 1fr` cart grid, no media queries. Secondary: `menu-builder.tsx` 0 responsive prefixes; a few fixed `grid-cols-2` on confirmation/payment pages.

## 18. Testing (detail)

~90 test files: strong payment (`pay-001/002/003`, `mpca-001a`, lifecycle), currency/BNR (56 tests), tax/fees/refund math, kitchen-sales smoke, edge cases, security (CSRF, SVG), Playwright e2e incl. mobile viewports for dashboard. **Missing:** no test spanning the full QR→order→kitchen→payment journey; zero WhatsApp tests; no onboarding-flow test.

## 19. Production Environment (names only — no values)

**Required unconditionally:** `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET` (≥32 chars), `NEXTAUTH_URL`.
**First-customer required:** `INTOUCH_*` set (API_URL, USERNAME, ACCOUNT_NO, PARTNER_PASSWORD|PASSWORD, WEBHOOK_USERNAME, WEBHOOK_PASSWORD — currently missing → webhook 503), `IMBONI_QR_SECRET`, `CRON_SECRET`, `REDIS_URL` (cron locks).
**Currency/BNR:** `BNR_API_KEY` (secret — manual Vercel config), `BNR_SYNC_ENABLED=true`, optional `BNR_API_BASE_URL`, `BNR_TIMEOUT_MS`, `BNR_QUOTATION_MODE`, `FX_MAX_*_HOURS`, `FX_RATE_TYPE_*` (defaults AVERAGE).
**Optional/feature-gated:** `TWILIO_*` + `WHATSAPP_*` (only if WhatsApp enabled), `OPENAI_API_KEY`/`AZURE_DI_*` (menu OCR, voice), `PUSHER_*` (realtime), `SMTP_*`/`SLACK_WEBHOOK_URL` (email/alerts — **OTP delivery depends on one of these; verify channel**), `SUPABASE_STORAGE_*`, `SENTRY_DSN`, `IREMBOPAY_*` (fallback provider), `VERCEL` (auto-set).
**Validator gaps:** `CRON_SECRET`, `IMBONI_QR_SECRET`, `TRIAL_HASH_SECRET`, `BNR_API_KEY`, `SMTP_*`, Meta `WHATSAPP_*` are not checked by env-validator.

## 20. Database & Supabase Migration Status

**Supabase: REACHABLE via `DIRECT_URL`** (direct Postgres; `DATABASE_URL` pooler handshake failed from this environment, TCP 5432 succeeds).

**Verified read-only query results:**

- `_prisma_migrations`: **31 applied**; latest = `20260812130000_mpca_001b_settlement_intelligence`
- **Pending (local, not applied): 3**
  - `20260815100000_editorial_content_phase_a`
  - `20260920130000_currency_bnr_phase3`
  - `20260921120000_currency_bnr_phase4`
- `CurrencyExchangeRate` + `SupportedCurrency` tables **exist** (from `billing_ledger`) but Phase-3/4 columns absent (`revision/status/averageRate/effectiveDate` = NONE)
- `PaymentTransaction` FX columns absent (`orderCurrency/paymentCurrency/exchangeRateSnapshotId` = NONE)
- `TrialEligibility` table exists in DB **but its migration folder is empty** → created via loose SQL outside Prisma (drift)
- 12 loose `.sql` files sit in `prisma/migrations/` ignored by `migrate` (add_audit_log, add_trial_eligibility, referral_system, etc.) → objects may exist in DB with no migration record
- `npm run db:push` script exists — **never run it against production** (bypasses history)

**Consequence if deployed as-is:** payment FX snapshot writes (`intouch/initiate`, `tap-and-leave`) and BNR ingestion would fail at runtime against prod — fail-closed, no corruption, but payments error until Phase 3 is applied.

## 21. Currency/BNR Migration Synchronization Plan (do not execute)

1. **Snapshot** Supabase DB (dashboard backup or `pg_dump`) before anything.
2. **Verify pending set** — confirmed 3 migrations: editorial_content_phase_a, currency phase3, currency phase4.
3. **Manual review required:** `20260815100000_editorial_content_phase_a` — inspect its SQL for conflicts with the editorial/content tables (it predates the currency work and its intent wasn't part of this workstream — confirm it should ship).
4. **Apply order** (strict timestamp): editorial → phase3 → phase4 via `npx prisma migrate deploy` against `DIRECT_URL`. Phase 4 depends on Phase 3's index name — order matters.
5. **Pre-checks:** confirm `CurrencyExchangeRate`/`SupportedCurrency` exist (verified ✓); confirm Phase-3 columns absent (verified ✓ → no partial application).
6. **Post-checks:** `_prisma_migrations` contains all 3; `CurrencyExchangeRate` has `revision`, `status`, `averageRate`; `PaymentTransaction` has `orderCurrency`, `exchangeRateSnapshotId`; enums `ExchangeRateType`/`ExchangeRateStatus` exist; smoke-test one payment FX write path.
7. **Rollback note:** all three are additive; rollback = drop new columns/indexes manually — keep snapshot regardless.
8. **Drift reconciliation (separate task):** reconcile the 12 loose SQL files and the `TrialEligibility` empty-migration anomaly via `prisma migrate diff`/db pull — do not fold into this deployment.

## 22. Git / Worktree

- Branch `main`, HEAD `7bcd1db`, **2 commits ahead** of origin/main (unpushed).
- **75 status entries** across multiple workstreams:
  - **Currency/BNR:** currency-exchange/conversion/exchange-rates/utils services, tap-and-leave, intouch initiate, currency API routes, bnr-client/ingestion/cron (untracked), 2 migrations, `tests/unit/currency/`, phase reports, `.env.example`, `vercel.json`
  - **Branding:** public/imgs logo/favicon changes, manifest.json, layouts (_app, _document, Admin/Public/Portal/Article/DashboardLayout), index/login/signup/welcome/faq/refer/features pages
  - **Localization:** en/fr/rw.json
  - **InTouch/deployment:** INTOUCH-001..004, DEPLOY-005, DEPLOY-REALITY-001A/B, WHATSAPP-001 reports
  - **Testing:** visual-*.spec.ts e2e + utils.ts, playwright-report/, test-results/
  - `next.config.js`, `store/checkout.tsx`
- Commit logically per `CURRENCY-BNR-PHASE-4-FINALIZATION.md` §19. **Never `git add .`** — `.env.example` must be re-checked for the secret before staging (verified clean at audit time).

## 23. P0 Blockers (must fix before first customer)

1. **QR enable flags unreachable** — add settings toggle or admin-set `enableQRInVenue`/`enableQRRemote`. Without this, ordering is dead.
2. **`src/pages/order/index.tsx` not mobile-responsive** — customer-facing page broken on phones.
3. **3 pending migrations** (editorial + currency 3+4) not applied — payment FX writes + BNR ingestion fail in prod.
4. **Unauthenticated `api/webhooks/addons/payment-success.ts`** — payment/entitlement forgery endpoint.
5. **VAT=0 hardcoded** on InTouch initiate + reservation deposit paths — financial/compliance defect on the primary payment path.
6. **`INTOUCH_WEBHOOK_USERNAME/PASSWORD` + InTouch callback** unset → payment confirmations return 503 (external dependency for credentials/callback whitelisting).
7. **`isSpecial` menu PATCH crash** — breaks a visible menu-UI feature (small fix).

## 24. P1 Items (before/during onboarding)

- QR Builder unsigned downloads; seat/outlet-only QR signature bug
- Menu item image upload (no `imageReal` write path)
- Staff role-value allowlist (escalation); `orders/[id]/status` enum validation
- Unify taxRate defaults (`??18` vs `??0`) across paths
- Business profile-edit API (name/address)
- `INTOUCH_PASSWORD`/`PARTNER_PASSWORD` alias standardization; `initiate.ts` should read `INTOUCH_CALLBACK_URL`
- InTouch `mobilephone` vs `mobilephoneno` confirmation
- Email verification or documented OTP-login reliance; transactional signup
- `INTOUCH_WEBHOOK_*`, `CRON_SECRET`, `BNR_API_KEY`, `BNR_SYNC_ENABLED` set in Vercel
- Hide/gate the 3 mock analytics pages
- OTP delivery channel verification (SMTP/Twilio actually configured)

## 25. P2 / Post-Launch

- Menu/Category/ModifierGroup real models; menu publish flag; `/order/confirmation.tsx` routing
- Redis rate limiter for auth endpoints; broader `withCsrf`; `verifyInDb` on admin routes
- WhatsApp customer ordering/campaigns/voice (not in first package)
- Reservations double-booking check; deposit self-serve
- Full-journey e2e test; WhatsApp tests
- Loose-SQL drift reconciliation; `TrialEligibility` empty-migration cleanup
- `db:push` script guard; env-validator coverage expansion

## 26. First Customer Minimum Product

**MUST HAVE (all exist except noted):**
1. Owner signup/login/MFA ✓
2. Business + currency/tax defaults at signup ✓
3. Menu CRUD (fix `isSpecial`) + CSV/OCR import ✓
4. **QR ordering enabled** (needs flag mechanism — build the toggle or admin-set it)
5. **Mobile-responsive `/order` page** (needs fix)
6. Kitchen dashboard + unified orders ✓
7. InTouchPay payment path — needs prod creds + webhook env + VAT fix
8. PaymentTransaction + ledger + FX snapshots ✓ (needs migrations)
9. Reconciliation cron ✓
10. Transactions/order history ✓

**SHOULD HAVE:**
- Menu item photos, staff accounts, business profile edit, table/seat QR per-table, order status tracking page polish, transaction receipts, tax-consistent VAT everywhere.

**CAN WAIT:** WhatsApp ordering, reservations, campaigns, AI insights, marketplace, loyalty, benchmarking, advanced reporting, multi-location intelligence, editorial content, Guardian automation.

## 27. Recommended Execution Sequence

1. Snapshot Supabase; apply 3 pending migrations in timestamp order via `migrate deploy` (review editorial_content_phase_a first).
2. Secure `api/webhooks/addons/payment-success.ts` (internal secret or remove).
3. Fix `isSpecial` menu PATCH (drop field or add column).
4. Add business setting to enable `enableQRInVenue`/`enableQRRemote` (extend `api/business/[id]/settings.ts` + settings UI, or admin-set for customer #1).
5. Make `src/pages/order/index.tsx` responsive.
6. Fix VAT=0 on `intouch/initiate.ts` + reservation deposit (mirror `qr-order.service.ts` calculation).
7. Fix QR builder unsigned downloads + seat/outlet signature forwarding.
8. Configure production env: `INTOUCH_WEBHOOK_*`, `CRON_SECRET`, `BNR_API_KEY`, `BNR_SYNC_ENABLED`; standardize `INTOUCH_PASSWORD` naming.
9. InTouchPay sandbox handshake (the 6 INTOUCH-002 questions) → 100 RWF test → callback whitelisting → production credentials.
10. Logical commits by workstream (Currency/BNR first — it's verified); never `git add .`.
11. Deploy; smoke-test QR journey end-to-end on a real phone before customer demo.
12. P1 hardening (role allowlist, status enums, profile API, image upload) during onboarding window.
