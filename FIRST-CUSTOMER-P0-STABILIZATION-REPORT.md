# FIRST-CUSTOMER P0 STABILIZATION REPORT

**Date:** 2026-09-21
**Repo:** C:\Dev\ImboniResto (main)
**Scope:** P0 stabilization, DB sync, deployment prep only. No unrelated workstreams touched.

---

## 1. DATABASE MIGRATION RESULT

**Pre-existing blocker found and resolved (documented procedure, not improvised):**

- `20260812130000_mpca_001b_settlement_intelligence` had failed on 2026-09-07 in Supabase (`P3009`, error `42P01` — `relation "Business" does not exist`; the Prisma model maps to `"Restaurant"`).
- The migration rolled back cleanly — no settlement objects existed.
- Recovery per Prisma's documented procedure:
  1. `prisma migrate resolve --rolled-back` on the failed record
  2. Fixed the two FK references `"Business"` → `"Restaurant"` in `migration.sql` (the file could never have applied anywhere — no checksum divergence risk)
  3. `prisma migrate deploy` — migration applied successfully

**Second blocker — editorial drift:**

- `20260815100000_editorial_content_phase_a` failed with `42P07` — `relation "Topic" already exists`.
- Verification showed **all** editorial objects already exist in Supabase (8 tables, all indexes, `User.editorialRoles`, all 9 NewsletterSubscriber columns) — the migration had been applied manually outside Prisma.
- Resolved with `prisma migrate resolve --applied` (baselining).

**Final state — verified directly against `DIRECT_URL`:**

- 34 migrations applied, `prisma migrate status` → "Database schema is up to date!"
- `CurrencyExchangeRate` columns verified: `averageRate, buyingRate, sellingRate, revision, status, sourceRecordId, effectiveDate, fetchedAt, metadata`
- `PaymentTransaction` FX columns verified: `orderCurrency, paymentCurrency, settlementCurrency, exchangeRateValue, exchangeRateType, exchangeRateSnapshotId`
- Enums verified: `ExchangeRateType`, `ExchangeRateStatus`, `SettlementStatus`
- `SupportedCurrency` capability columns verified
- All 8 editorial tables present

**No destructive operation was performed.** No `migrate reset`, no `db push`, no loose SQL executed.

---

## 2. P0 FIXES IMPLEMENTED

| # | Fix | Files |
|---|-----|-------|
| 1 | **Addon payment-success webhook secured** — now requires `Bearer CRON_SECRET` (existing internal auth mechanism); additionally refuses to activate unless the transaction is already `SUCCESS` via the real provider webhook; idempotent replay returns 200 without re-fulfilling | `src/pages/api/webhooks/addons/payment-success.ts` |
| 2 | **QR ordering enablement** — `enableQRInVenue`/`enableQRRemote` added to existing `PUT /api/business/[id]/settings` (tenant-scoped, `settings.manage` permission) + toggles in `dashboard/settings` | `src/pages/api/business/[id]/settings.ts`, `src/pages/dashboard/settings.tsx` |
| 3 | **`/order` mobile responsive** — menu+cart grid and item grid collapse to single column ≤768px (styled-jsx); header wraps | `src/pages/order/index.tsx` |
| 4 | **`isSpecial` crash fixed** — phantom field removed from PATCH whitelist (MenuItem has no such column); PATCH no longer crashes | `src/pages/api/menu/[id].ts` |
| 5 | **VAT=0 fixed** — InTouch initiate + reservation deposit now extract VAT from `business.taxRate` via `IremboPayService.calculateVATAmounts` (VAT-inclusive gross). `taxRate` 0/null → 0 VAT (legitimate, configured path preserved) | `src/pages/api/payments/intouch/initiate.ts`, `src/pages/api/reservations/[id]/deposit/initiate.ts` |
| 6 | **QR signing fixed** — token endpoint validates signature over `tableId \|\| seatId \|\| outletId` matching generation precedence; seat/outlet ownership verified (seat via `table.businessId`); `/order` forwards `seatId`/`outletId`; QR builder now encodes the **signed** URL from `/api/public/order/link` instead of an unsigned relative path | `src/pages/api/public/order/token.ts`, `src/pages/order/index.tsx`, `src/pages/dashboard/qr-builder.tsx` |

---

## 3. TESTS EXECUTED

| Suite | Result |
|-------|--------|
| `tests/security/addon-payment-success-webhook.test.ts` (new, 8 cases) | PASS |
| `tests/reliability/qr-enablement-settings.test.ts` (new, 8 cases) | PASS |
| `tests/api/menu-item-patch.test.ts` (new, 4 cases) | PASS |
| `tests/unit/calculations/payment-vat.test.ts` (new, 3 cases) | PASS |
| `tests/unit/qr-signature.test.ts` (new, 7 cases) | PASS |
| `tests/reliability/gpv-d009-tax-config-consistency.test.ts` (regression) | PASS |
| `tests/unit/currency/` — 7 suites (BNR, FX conversion, payment consistency) | PASS (56 tests) |
| `tests/reliability/pay-002-*.test.ts`, `payment-fees.test.ts` (payment regression) | PASS (30 tests) |
| `tsc --noEmit` on all changed files | 0 errors |

**Total: 140 tests passing across 16 suites.**

---

## 4. PRODUCTION ENVIRONMENT VARIABLES

Required by `env-validator.ts` (with `PAYMENTS_PROVIDER=intouch` default):

| Var | Status |
|-----|--------|
| `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` | Set in Vercel (build got past them) |
| `INTOUCH_API_URL`, `INTOUCH_USERNAME`, `INTOUCH_WEBHOOK_USERNAME`, `INTOUCH_WEBHOOK_PASSWORD`, `INTOUCH_PARTNER_PASSWORD`/`INTOUCH_PASSWORD` | Set (not listed as missing) |
| **`INTOUCH_ACCOUNT_NO`** | **MISSING in Vercel — sole build blocker** |
| `CRON_SECRET` | Required at runtime by BNR cron + secured addon webhook (user to set) |
| `BNR_API_KEY`, `BNR_SYNC_ENABLED=true` | Required for live BNR ingestion (user to set) |

No secrets were written to the repo. `.env.example` retains `BNR_API_KEY=""` placeholder; staged/diff scans show zero secret leakage.

---

## 5. INTOUCHPAY BLOCKERS

- `INTOUCH_ACCOUNT_NO` missing in Vercel → **every production build fails** at env validation.
- InTouch webhook HMAC verification remains a stub (known gap, documented in audit — P1).
- InTouch production credentials/account activation are externally owned.

---

## 6. BNR REQUIREMENTS

- `BNR_API_KEY` — live key verified previously (HTTP 200, USD ≈1473, EUR ≈1690 `post_date` format `YYYY/MM/DD`).
- `BNR_SYNC_ENABLED=true` to activate the daily cron (`/api/cron/bnr-sync`, Vercel cron schedule present in `vercel.json`).
- `CRON_SECRET` — must match between Vercel cron config and any caller of secured internal endpoints.

---

## 7. GIT COMMITS

| Commit | Description |
|--------|-------------|
| `420e154` | feat(currency): canonical BNR exchange-rate architecture (Phases 3-4) |
| `dab06cc` | fix(migration): correct Business→Restaurant table ref in mpca_001b |
| `db38496` | fix(p0): first-customer stabilization blockers |

No `git add .`; 51 unrelated working-tree entries (branding, locales, InTouch/deploy docs, visual tests, loose SQL) intentionally left uncommitted.

## 8. GIT PUSH RESULT

`git push origin main` → `570c32e..db38496 main -> main` ✅ (5 commits pushed incl. 2 prior local commits)

## 9. VERCEL DEPLOYMENT STATUS

- Push triggered two production builds; **both FAILED** at env validation.
- Failure: `Missing required environment variables (production): - INTOUCH_ACCOUNT_NO`
- **This is the only missing variable** — all other required vars are present.
- Action required: user adds `INTOUCH_ACCOUNT_NO` (+ `BNR_API_KEY`, `CRON_SECRET`, `BNR_SYNC_ENABLED=true`) in the Vercel dashboard, then redeploys.

## 10. RAILWAY STATUS

- Worker deploys via `Dockerfile.worker` (multi-stage Node 20 Alpine → `node dist/die/orchestrator/worker-start.js`, single process for extraction + intelligence workers — no duplicate scheduler).
- No Railway CLI/config file in repo; runtime status not verifiable from this environment. Image rebuilds on push if the Railway service is connected to `main`.

## 11. REMAINING P0 BLOCKERS

1. `INTOUCH_ACCOUNT_NO` not set in Vercel — production deploys fail until added.
2. BNR cron inactive until `BNR_API_KEY`, `CRON_SECRET`, `BNR_SYNC_ENABLED=true` are set.
3. Both are user-owned secret/configuration steps — no repo action possible.

## 12. P1 FOLLOW-UP

- InTouch webhook HMAC verification stub → real signature check.
- `isSpecial` "specials" UI is a non-functional feature (no column) — decide: add column or remove UI.
- Seat-level ordering: token JWT carries only `tableId`; seat attribution to orders is not persisted end-to-end.
- Menu image upload path absent (read-only image support).
- Email verification not implemented.

## 13. P2 FOLLOW-UP

- Order status endpoint accepts arbitrary strings (no transition validation).
- Auth rate limiting is in-memory only (multi-instance unsafe).
- WhatsApp campaign sender is a stub; Meta inbound incomplete.
- Dashboard pages with mock data should be hidden/labeled.
- Staff role assignment accepts arbitrary role strings.

## 14. DATABASE DRIFT FOLLOW-UP

- 12 loose SQL files in `prisma/migrations/` are historical/manual artifacts — none executed; reconcile separately.
- Editorial schema was manually applied outside Prisma (now baselined); `TrialEligibility` similarly exists via loose SQL with an empty migration dir.
- Recommend a `supabase db diff`/schema-snapshot reconciliation pass before the next migration cycle.

## 15. RECOMMENDED NEXT STEP

User: add `INTOUCH_ACCOUNT_NO` (+ `BNR_API_KEY`, `CRON_SECRET`, `BNR_SYNC_ENABLED=true`) in Vercel → redeploy → smoke-test the QR journey end-to-end on the first business (enable flags → build QR → scan → order → kitchen → payment).

---

```
========================================
P0 STABILIZATION SUMMARY
========================================

DATABASE:
34 migrations applied; mpca_001b failed-record resolved (rolled back →
fixed Business→Restaurant FK → applied); editorial drift baselined;
schema up to date; no destructive ops; 12 loose SQL files untouched.

P0 FIXES:
Addon webhook auth (CRON_SECRET + SUCCESS gate + idempotency), QR
enablement via settings API + UI, /order mobile responsive, isSpecial
crash fixed, VAT=0 → business.taxRate on InTouch + deposit paths,
QR seat/outlet signing + signed builder URLs.

TESTS:
140 passing across 16 suites (54 new+regression, 86 currency/payment);
tsc clean on all changed files.

GIT:
3 commits pushed to origin/main (420e154 currency, dab06cc migration
fix, db38496 P0 fixes); 51 unrelated entries left uncommitted.

VERCEL:
Two production builds triggered; both FAILED — INTOUCH_ACCOUNT_NO
missing in Vercel env. Only blocker found.

RAILWAY:
Dockerfile.worker config correct; runtime status not verifiable
(no Railway CLI/access).

EXTERNAL BLOCKERS:
INTOUCH_ACCOUNT_NO (build), BNR_API_KEY + CRON_SECRET +
BNR_SYNC_ENABLED (BNR cron) — all user-configured in Vercel.

REMAINING P0:
None in code. Deployment blocked solely by missing Vercel env vars.

P1:
InTouch webhook HMAC stub; isSpecial feature decision; seat-order
attribution; menu image upload; email verification.

P2:
Order status validation; distributed rate limiting; WhatsApp stubs;
mock dashboard pages; loose SQL reconciliation.
========================================
```
