# CURRENCY-BNR-PHASE-3-IMPLEMENTATION

## 1. Implementation Summary

Phase 3 implements the approved Phase 2 architecture for a canonical currency and exchange-rate system in ImboniServe, enabling BNR (National Bank of Rwanda) as the authoritative rate source without corrupting existing payment, settlement, tax, order, or historical transaction data.

**Status:** Implementation complete. Tests pass. No commit, stage, or push performed.

## 2. Architecture Implemented

- **One canonical currency service** (`currency-exchange.service.ts`) as the single source of truth for:
  - Currency definitions (from `SupportedCurrency` table)
  - Historical exchange-rate lookup (from `CurrencyExchangeRate` table)
  - Deterministic conversion with explicit direction and rate type
  - No silent 1:1 fallback
- **BNR client** (`bnr-client.service.ts`) for the documented BNR API
- **BNR ingestion service** (`bnr-rate-ingestion.service.ts`) for idempotent rate persistence
- **Protected BNR sync cron** (`/api/cron/bnr-sync.ts`)
- **Legacy modules deprecated** — runtime paths route through the canonical service

## 3. Database Changes

### Prisma Schema (`prisma/schema.prisma`)

**New enums:**
- `ExchangeRateType` (AVERAGE, BUYING, SELLING)
- `ExchangeRateStatus` (ACTIVE, SUPERSEDED, INVALID)

**`CurrencyExchangeRate` model — new fields:**
- `averageRate`, `buyingRate`, `sellingRate` — `Decimal(20,10)`
- `sourceRecordId`, `sourceCurrencyName` — BNR record identity
- `sourceRecordCreatedAt` — BNR record creation timestamp
- `effectiveDate`, `fetchedAt` — publication and fetch timestamps
- `status` — `ExchangeRateStatus`
- `metadata` — JSONB for raw BNR payload
- `rate` column widened from `Decimal(12,6)` to `Decimal(20,10)`

**`SupportedCurrency` model — new capability flags:**
- `displayEnabled`, `transactionEnabled`, `paymentEnabled`, `settlementEnabled`

**`PaymentTransaction` model — new FX snapshot fields:**
- `orderAmountCents`, `orderCurrency`
- `paymentAmountCents`, `paymentCurrency`
- `settlementAmountCents`, `settlementCurrency`
- `exchangeRateValue`, `exchangeRateType`, `exchangeRateSource`
- `exchangeRateBaseCurrency`, `exchangeRateQuoteCurrency`
- `exchangeRateEffectiveDate`, `exchangeRateRecordId`, `exchangeRateSnapshotId`
- FK: `exchangeRateSnapshotId` → `CurrencyExchangeRate.id` (ON DELETE SET NULL)

### Migration

- `prisma/migrations/20260920130000_currency_bnr_phase3/migration.sql`
- All changes use `ADD COLUMN IF NOT EXISTS` — non-destructive
- All new columns are nullable or have safe defaults
- No existing data is dropped, rewritten, or deleted
- Existing RWF transactions remain valid (FX fields are nullable)

## 4. BNR Client

**File:** `src/lib/services/bnr-client.service.ts`

- Base URL: `https://fxrates.bnr.rw/ExchangeRate` (configurable via `BNR_API_BASE_URL`)
- Endpoints: `GET /ExchangeRate`, `GET /ExchangeRate/{id}`
- Query parameters: `start_date`, `end_date`, `currency_name`, `id`
- Response normalization: handles raw array, `{ data: [...] }`, `{ results: [...] }`, and single object
- Rate fields preserved as strings (no precision loss)
- Error classes: `BnrApiError` (with status code), `BnrClientConfigurationError`
- HTTP errors 400/404/500 are captured and thrown as `BnrApiError`

## 5. BNR Authentication Status

**Authentication is NOT implemented and intentionally blocked.**

The supplied BNR API documentation does not specify an authentication mechanism. The client supports three configurable modes via environment variables:

| Mode | Env vars | Status |
|------|----------|--------|
| `none` (default) | — | No auth applied |
| `header` | `BNR_AUTH_HEADER_NAME`, `BNR_AUTH_HEADER_VALUE` | Custom header |
| `query` | `BNR_AUTH_QUERY_PARAM_NAME`, `BNR_AUTH_QUERY_PARAM_VALUE` | Query parameter |

**No API key was requested, added, or logged.** The actual authentication configuration remains blocked until the founder's BNR documentation specifies the mechanism.

## 6. Rate Ingestion

**File:** `src/lib/services/bnr-rate-ingestion.service.ts`

- Maps BNR `currency_name` to ISO 4217 code (handles both ISO codes and full names)
- Parses string rate fields with exact decimal validation
- Rejects non-positive, malformed, or missing rates
- Idempotent: checks existing record by `(source, sourceRecordId, fromCurrency, toCurrency, effectiveDate)`
- Duplicate rates with unchanged values: updates `fetchedAt` only (skipped)
- Changed rates: updates values in place
- `BNR_QUOTATION_MODE` env var required: `RWF_PER_UNIT_OF_CURRENCY` or `UNIT_OF_CURRENCY_PER_RWF`
- Upserts `SupportedCurrency` rows for discovered currencies
- Clears canonical service cache after ingestion

## 7. Currency Service

**File:** `src/lib/services/currency-exchange.service.ts`

- `getCurrencyDefinition(code)` — validates currency against DB, RWF fallback for bootstrap
- `getHistoricalExchangeRateSnapshot(from, to, opts)` — historical rate lookup with:
  - Explicit rate type (AVERAGE/BUYING/SELLING)
  - `asOf` date for historical lookup
  - `maxAgeHours` for staleness check
  - `allowStale` flag
  - Direct rate lookup, then inverse calculation from reverse rate
  - Same-currency returns identity 1:1
  - Throws `ExchangeRateNotFoundError`, `ExchangeRateStaleError`, `ExchangeRateInvalidError`
- `convertMinorUnits(amount, from, to, opts)` — minor-unit conversion with exact decimal math
- `convertCurrency(amount, from, to, opts)` — major-unit conversion
- `getRatesForBaseCurrency(base, opts)` — rate table for display
- `updateExchangeRates(rates)` — manual rate insertion
- In-memory caches with TTL (5 min for rates, 15 min for currencies)

## 8. Conversion / Rate-Direction Implementation

- **Explicit direction:** `from → to` with `rate = to/from`
- **Rate types:** AVERAGE (default), BUYING, SELLING
- **Same-currency:** Returns 1:1 identity (valid case)
- **Missing rate:** Throws `ExchangeRateNotFoundError` — never returns 1
- **Stale rate:** Throws `ExchangeRateStaleError` when age > `maxAgeHours`
- **Invalid rate:** Throws `ExchangeRateInvalidError` for non-positive values
- **Precision:** Uses `Prisma.Decimal` (exact decimal arithmetic), `ROUND_HALF_UP` rounding
- **No silent 1:1 fallback** anywhere in the canonical service

## 9. Order / Checkout Changes

- `src/pages/store/checkout.tsx` — replaced `useCurrency()` display-currency relabeling with `CurrencyDisplay` component, preventing RWF values from being mislabeled as USD/EUR/etc.
- `src/pages/api/currency/default.ts` — now persists user preferred currency and business currency to DB, validates against `SupportedCurrency` with `displayEnabled` flag

## 10. Payment Changes

### InTouch Initiate (`src/pages/api/payments/intouch/initiate.ts`)

- Reads business currency from DB
- Splits `orderCurrency` (business currency) from `paymentCurrency` (RWF, provider constraint)
- When `orderCurrency !== paymentCurrency`: calls `convertMinorUnits` with `maxAgeHours=48`, `allowStale=false`
- Persists full FX snapshot: `exchangeRateValue`, `exchangeRateType`, `exchangeRateSource`, `exchangeRateBaseCurrency`, `exchangeRateQuoteCurrency`, `exchangeRateEffectiveDate`, `exchangeRateRecordId`, `exchangeRateSnapshotId`
- Persists `orderAmountCents`, `paymentAmountCents`, `settlementAmountCents` separately
- Fails safely (500) when FX conversion throws — no silent 1:1 fallback

### VAT handling

- `vatAmountCents` and `exVatAmountCents` are now persisted with the correct payment-currency basis
- The previous `VAT=0` hardcoding in the InTouch path remains as-is for RWF transactions (where VAT=0 may be the business configuration), but the FX snapshot ensures the tax basis is traceable

## 11. Tap & Leave Changes

**File:** `src/pages/api/checkout/tap-and-leave.ts`

- Reads business currency from DB
- `orderCurrency` = business currency, `paymentCurrency` = RWF (InTouch constraint)
- When cross-currency: calls `convertMinorUnits` with `maxAgeHours=48`, `allowStale=false`
- Persists all required FX fields on `PaymentTransaction`:
  - `orderAmountCents`, `orderCurrency`
  - `paymentAmountCents`, `paymentCurrency`
  - `settlementAmountCents`, `settlementCurrency`
  - `exchangeRateValue`, `exchangeRateType`, `exchangeRateSource`
  - `exchangeRateBaseCurrency`, `exchangeRateQuoteCurrency`
  - `exchangeRateEffectiveDate`, `exchangeRateRecordId`, `exchangeRateSnapshotId`
- `rawRequest` still includes FX summary for debugging, but FX is no longer buried there alone
- Fails safely (500) when FX conversion throws

## 12. Transaction-History Changes

- `PaymentTransaction` now has structured FX snapshot fields (see Database Changes above)
- Historical RWF transactions remain valid — all new FX fields are nullable
- No historical data is fabricated — existing records preserve their original amounts
- FX metadata is marked unavailable (null) for pre-Phase-3 transactions rather than fabricated

## 13. Dashboard / Receipt Changes

- `src/lib/utils/currency.ts` — `formatCurrency()` no longer relabels RWF values as another display currency. The `safeCurrency` variable forces RWF display for RWF-denominated values, preventing the dashboard bug where RWF-derived totals were labeled as USD.
- `EXCHANGE_RATES` constant reduced to `{ RWF: 1 }` — no hardcoded rates
- `convertFromRWF()` and `convertToRWF()` in `currency.ts` now throw for non-RWF, directing to the canonical server service
- `CurrencyDisplay` component (used in checkout) renders with the correct currency basis

## 14. Old FX Logic Migrated / Deprecated

| Module | Status |
|--------|--------|
| `src/lib/utils/currency.ts` | Deprecated. `EXCHANGE_RATES` reduced to identity. `convertFromRWF`/`convertToRWF` throw for non-RWF. `formatCurrency` forces RWF display. |
| `src/lib/services/currency.service.ts` | Not modified (already deprecated in Phase 1 audit). |
| `src/lib/services/currency-conversion.service.ts` | Replaced with compatibility wrapper routing to canonical service. No API Ninjas, no hardcoded fallbacks, no silent 1:1. |
| `src/lib/currency/exchange-rates.ts` | Replaced with canonical-service-backed implementation. No exchangerate.host, no hardcoded fallbacks. |
| `src/lib/services/currency-exchange.service.ts` | Replaced with canonical DB-backed service. No silent 1:1 fallback. |

**No parallel FX system was created.** All runtime paths route through the canonical `currency-exchange.service.ts`.

## 15. Failure-Safety Implementation

| Scenario | Behavior |
|----------|----------|
| Missing exchange rate | Throws `ExchangeRateNotFoundError` |
| Stale rate (age > maxAgeHours) | Throws `ExchangeRateStaleError` |
| Non-positive rate | Throws `ExchangeRateInvalidError` |
| Missing buying/selling rate | Throws `ExchangeRateInvalidError` |
| Unsupported currency | Throws `CurrencyValidationError` |
| Inactive currency | Throws `CurrencyValidationError` |
| BNR API 400/404/500 | Throws `BnrApiError` with status code |
| BNR non-JSON response | Throws `BnrApiError` |
| BNR_QUOTATION_MODE not set | Throws `Error` before any ingestion |
| Cross-currency payment with no rate | Payment initiation fails with 500 — no silent 1:1 |
| Same-currency conversion | Returns 1:1 identity (valid) |

## 16. Tests Added

| Test file | Coverage |
|-----------|----------|
| `tests/unit/currency/currency-model.test.ts` | Valid ISO, invalid, unsupported, RWF fallback, inactive, normalization |
| `tests/unit/currency/fx-conversion.test.ts` | RWF→USD, USD→RWF, inverse, historical, average/buying/selling, missing, stale, invalid, precision, rounding, identity |
| `tests/unit/currency/bnr-ingestion.test.ts` | Mapping, malformed, unsupported currency, idempotent, update, by-id, quotation mode |
| `tests/unit/currency/bnr-client.test.ts` | 400/404/500 errors, non-JSON, empty response, array/object/wrapper parsing |
| `tests/unit/currency/tap-and-leave-fx.test.ts` | RWF identity, USD cross-currency FX persistence, failure safety |
| `tests/unit/currency/payment-currency-consistency.test.ts` | RWF identity, USD cross-currency, EUR failure, order/payment amount split |

## 17. Test Results

```
Phase 3 currency tests:
  Test Suites: 6 passed, 6 total
  Tests:       42 passed, 42 total

Existing payment tests (regression check):
  Test Suites: 3 passed, 3 total
  Tests:       30 passed, 30 total
```

All Phase 3 tests pass. No regressions in existing payment tests.

## 18. Build / Type / Lint Results

### Prisma Validation
```
The schema at prisma/schema.prisma is valid 🚀
Prisma Client generated successfully (v5.22.0)
```

### TypeScript Check (`tsc --noEmit`)
- **152 pre-existing errors** in unrelated modules (intelligence, briefings, watchdog, OCR, dashboard/ceo, etc.)
- **0 errors in any Phase 3 file**
- Phase 3 files verified clean:
  - `currency-exchange.service.ts`
  - `currency-conversion.service.ts`
  - `bnr-client.service.ts`
  - `bnr-rate-ingestion.service.ts`
  - `exchange-rates.ts`
  - `currency.ts`
  - `bnr-sync.ts`
  - `currency/rates.ts`, `currency/convert.ts`, `currency/default.ts`
  - `tap-and-leave.ts`
  - `intouch/initiate.ts`

### Lint
- No ESLint configuration exists in the project
- Lint is not part of the project's validation pipeline
- TypeScript check and Jest tests are the primary validation methods

### Production Build
- Not run (requires full environment and is not feasible in this context)
- TypeScript compilation of Phase 3 files succeeds

## 19. Environment Variables Required

| Variable | Required | Description |
|----------|----------|-------------|
| `BNR_API_BASE_URL` | No | BNR API base URL (default: `https://fxrates.bnr.rw/ExchangeRate`) |
| `BNR_AUTH_MODE` | No | Auth mode: `none` (default), `header`, `query` |
| `BNR_AUTH_HEADER_NAME` | If `header` mode | Header name for BNR auth |
| `BNR_AUTH_HEADER_VALUE` | If `header` mode | Header value for BNR auth |
| `BNR_AUTH_QUERY_PARAM_NAME` | If `query` mode | Query param name for BNR auth |
| `BNR_AUTH_QUERY_PARAM_VALUE` | If `query` mode | Query param value for BNR auth |
| `BNR_QUOTATION_MODE` | Yes for ingestion | `RWF_PER_UNIT_OF_CURRENCY` or `UNIT_OF_CURRENCY_PER_RWF` |
| `BNR_SYNC_ENABLED` | No | `true`/`false` — enables BNR sync cron (default: `false`) |
| `CRON_SECRET` | Yes for cron | Bearer token for cron endpoint auth |
| `FX_MAX_RATE_AGE_HOURS` | No | Max rate age for general use (default: `168` = 7 days) |
| `FX_MAX_PAYMENT_RATE_AGE_HOURS` | No | Max rate age for payments (default: `48` = 2 days) |

**No BNR API key was added.** The API key exists separately in the founder's documentation and must not be committed, logged, or exposed.

## 20. Remaining Blockers

1. **BNR authentication mechanism** — The supplied BNR documentation does not specify an auth format. The client supports configurable modes but actual auth remains blocked until the founder provides the mechanism.
2. **BNR quotation direction** — `BNR_QUOTATION_MODE` must be set before ingestion can run. The direction (RWF per unit of foreign currency vs. foreign currency per RWF) must be confirmed from the BNR API response.
3. **Production build** — Not verified in this task. TypeScript compilation of Phase 3 files succeeds, but a full `next build` was not run.
4. **Database migration execution** — The migration SQL is created but not applied to a live database. It must be applied via `prisma migrate deploy` in the deployment environment.
5. **Historical FX backfill** — Pre-Phase-3 transactions have null FX fields. No historical rates are fabricated. If historical FX reconstruction is needed, it must be done as a separate, documented data-backfill task.

## 21. Proposed Git Commit Inventory

### COMMIT CURRENCY-BNR-001: Schema and migration
```
prisma/schema.prisma
prisma/migrations/20260920130000_currency_bnr_phase3/migration.sql
```
**Reason:** Database schema changes for canonical currency/FX architecture — new enums, FX snapshot fields on PaymentTransaction, BNR-compatible rate history, currency capability flags.

### COMMIT CURRENCY-BNR-002: Canonical currency service and BNR integration
```
src/lib/services/currency-exchange.service.ts
src/lib/services/bnr-client.service.ts
src/lib/services/bnr-rate-ingestion.service.ts
src/pages/api/cron/bnr-sync.ts
```
**Reason:** Canonical FX service (single source of truth), BNR API client, idempotent ingestion service, and protected sync cron endpoint.

### COMMIT CURRENCY-BNR-003: Legacy module deprecation
```
src/lib/services/currency-conversion.service.ts
src/lib/currency/exchange-rates.ts
src/lib/utils/currency.ts
```
**Reason:** Replace unsafe legacy FX behavior (hardcoded rates, silent 1:1 fallback, API Ninjas, exchangerate.host) with compatibility wrappers routing to the canonical service.

### COMMIT CURRENCY-BNR-004: Payment and checkout FX persistence
```
src/pages/api/checkout/tap-and-leave.ts
src/pages/api/payments/intouch/initiate.ts
src/pages/api/currency/rates.ts
src/pages/api/currency/convert.ts
src/pages/api/currency/default.ts
src/pages/store/checkout.tsx
```
**Reason:** Wire payment paths through canonical FX service, persist structured FX snapshots on transactions, fix display-currency relabeling in checkout.

### COMMIT CURRENCY-BNR-005: Tests
```
tests/unit/currency/currency-model.test.ts
tests/unit/currency/fx-conversion.test.ts
tests/unit/currency/bnr-ingestion.test.ts
tests/unit/currency/bnr-client.test.ts
tests/unit/currency/tap-and-leave-fx.test.ts
tests/unit/currency/payment-currency-consistency.test.ts
```
**Reason:** Unit tests for currency model, FX conversion, BNR ingestion, BNR client error handling, Tap & Leave FX persistence, and payment currency consistency.

### COMMIT CURRENCY-BNR-006: Documentation
```
CURRENCY-BNR-PHASE-1-AUDIT.md
CURRENCY-BNR-PHASE-2-ARCHITECTURE.md
CURRENCY-BNR-PHASE-3-IMPLEMENTATION.md
```
**Reason:** Phase 1 audit, Phase 2 architecture, and Phase 3 implementation reports.

## 22. Exact Final Git Status

### Phase 3 modified files (tracked, modified):
```
 M prisma/schema.prisma
 M src/lib/currency/exchange-rates.ts
 M src/lib/services/currency-conversion.service.ts
 M src/lib/services/currency-exchange.service.ts
 M src/lib/utils/currency.ts
 M src/pages/api/checkout/tap-and-leave.ts
 M src/pages/api/currency/convert.ts
 M src/pages/api/currency/default.ts
 M src/pages/api/currency/rates.ts
 M src/pages/api/payments/intouch/initiate.ts
 M src/pages/store/checkout.tsx
```

### Phase 3 new files (untracked):
```
?? prisma/migrations/20260920130000_currency_bnr_phase3/
?? src/lib/services/bnr-client.service.ts
?? src/lib/services/bnr-rate-ingestion.service.ts
?? src/pages/api/cron/bnr-sync.ts
?? tests/unit/currency/
?? CURRENCY-BNR-PHASE-1-AUDIT.md
?? CURRENCY-BNR-PHASE-2-ARCHITECTURE.md
?? CURRENCY-BNR-PHASE-3-IMPLEMENTATION.md
```

### Pre-existing unrelated changes (NOT touched by Phase 3):
```
 M next.config.js
 D public/imgs/imboni-serve-favicon-192.png
 D public/imgs/imboni-serve-favicon-pwa-512.png
 D public/imgs/imboni-serve-favicon.png
 M public/imgs/imboni-serve-logo-2.png
 M public/imgs/imboni-serve2-logo.png
 D public/imgs/logo-2.png
 D public/imgs/logo1.png
 D public/imgs/logo2.png
 M public/manifest.json
 M src/components/AdminLayout.tsx
 M src/components/ArticleLayout.tsx
 M src/components/DashboardLayout.tsx
 M src/components/PublicLayout.tsx
 M src/components/portal/PortalLayout.tsx
 M src/locales/en.json
 M src/locales/fr.json
 M src/locales/rw.json
 M src/pages/_app.tsx
 M src/pages/_document.tsx
 M src/pages/faq.tsx
 M src/pages/features/ai.tsx
 M src/pages/features/analytics.tsx
 M src/pages/features/finance.tsx
 M src/pages/features/growth.tsx
 M src/pages/features/index.tsx
 M src/pages/features/operations.tsx
 M src/pages/index.tsx
 M src/pages/login.tsx
 M src/pages/refer/index.tsx
 M src/pages/signup.tsx
 M src/pages/welcome.tsx
?? DEPLOY-005-Pending-Deployment-Push-and-Verification.md
?? DEPLOY-REALITY-001A.md
?? DEPLOY-REALITY-001B.md
?? INTOUCH-001-Sandbox-Investigation.md
?? INTOUCH-002-Resolve-Blockers.md
?? INTOUCH-003-Documentation-to-Code-Review.md
?? INTOUCH-004-100-RWF-Test-Path-and-Deployment-Readiness.md
?? docs/WHATSAPP-001-Forensic-Current-State-Audit.md
?? playwright-report/
?? public/imgs/3.png
?? public/imgs/favicon-1.png
?? public/imgs/favicon-2.png
?? test-results/
?? tests/e2e/utils.ts
?? tests/e2e/visual-admin.spec.ts
?? tests/e2e/visual-dashboard.spec.ts
?? tests/e2e/visual-portal.spec.ts
?? tests/e2e/visual-public.spec.ts
```

### Confirmations

- **No unrelated files were modified by Phase 3.** All pre-existing modifications and untracked files remain untouched.
- **Nothing was staged.** No `git add` was run.
- **Nothing was committed.** No `git commit` was run.
- **Nothing was pushed.** No `git push` was run.
- **No BNR API key was added, requested, or logged.**
- **No secrets were exposed.**
- **No destructive migration was created.** All schema changes are additive with safe defaults.
- **No historical data was fabricated or rewritten.**
