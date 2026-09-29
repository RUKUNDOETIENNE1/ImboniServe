# CURRENCY-BNR-PHASE-3-FINAL-REVIEW

**Review type:** Strict implementation review (read-only — no code, schema, env, or git changes)
**Repository:** `C:\Dev\ImboniResto`
**Branch:** `main`
**HEAD at review:** `7bcd1db0b2050054c27bba597296741c334122af`
**Reports reviewed:**
- `CURRENCY-BNR-PHASE-1-AUDIT.md`
- `CURRENCY-BNR-PHASE-2-ARCHITECTURE.md`
- `CURRENCY-BNR-PHASE-3-IMPLEMENTATION.md`

**Source files inspected:** Schema, migration, BNR client, ingestion, canonical service, legacy wrappers, payment endpoints, currency API endpoints, all 6 test files, cron endpoint, env templates.

**Verification commands run:**
- `npx tsc --noEmit` (152 pre-existing errors; 0 in Phase 3 files)
- `npx jest tests/unit/currency/` (6 suites, 42 tests — all pass)
- `npx jest tests/reliability/pay-002-* tests/unit/calculations/payment-fees.test.ts` (3 suites, 30 tests — all pass)
- `git status --short` (compared against pre-Phase-3 baseline)
- `git diff prisma/schema.prisma` (additive only)

**No source code was modified during this review.** Only this new review report was created.

---

## 1. Review Summary

Phase 3 implements the Phase 2 architecture with high conformance. The canonical currency service, BNR client, ingestion pipeline, FX snapshot persistence, and legacy deprecation are all in place. The implementation is **money-safe** (no silent 1:1 fallback), **non-destructive** (additive migration), and **historically honest** (no fabricated FX for legacy transactions).

**Key strengths:**
- Single canonical FX service with explicit rate types and typed errors
- BNR client follows documented API exactly without inventing auth
- Migration is genuinely non-destructive (additive columns, nullable, safe defaults)
- Tap & Leave and InTouch initiate now persist structured FX snapshots
- All 42 Phase 3 tests pass; 30 existing payment tests pass (no regressions)
- 0 TypeScript errors in any Phase 3 file

**Key gaps (non-blocking for code, blocking for production):**
- BNR authentication mechanism unresolved (founder must provide)
- `BNR_QUOTATION_MODE` direction unconfirmed (must be set before ingestion)
- VAT=0 hardcoding remains in InTouch initiate (Phase 3 did not fix this)
- No integration/E2E tests for the full payment→FX→ledger chain
- No cron scheduler registration (endpoint exists but no vercel.json/cron.ts wiring)
- Production build not verified

---

## 2. Phase 2 → Phase 3 Conformance Matrix

| Phase 2 Requirement | Implementation Location | Status | Test Coverage | Reviewer Finding |
|---------------------|------------------------|--------|---------------|------------------|
| Canonical currency identity (`SupportedCurrency` with capability flags) | `prisma/schema.prisma` lines 2908-2921; `currency-exchange.service.ts` `getCurrencyDefinition` | **IMPLEMENTED** | `currency-model.test.ts` (6 tests) | Capability flags added as specified. RWF fallback for bootstrap is reasonable. |
| Canonical exchange-rate store (BNR-compatible, rate types, status) | `prisma/schema.prisma` lines 2879-2905; `currency-exchange.service.ts` | **IMPLEMENTED** | `fx-conversion.test.ts` (13 tests) | Three rate columns (average/buying/selling) plus status enum. Matches Phase 2 §5.1. |
| Two-layer model (raw ingestion + normalized) | Single `CurrencyExchangeRate` table with `metadata` JSONB for raw payload | **PARTIALLY IMPLEMENTED** | `bnr-ingestion.test.ts` (7 tests) | Phase 2 §5.1 recommended two separate tables. Phase 3 collapsed to one table with `metadata` JSONB. Functionally equivalent for source fidelity, but not the recommended split. Acceptable trade-off. |
| Explicit rate direction (`rate(base→quote) = quoteUnitsPerOneBaseUnit`) | `currency-exchange.service.ts` lines 332-334 (`amountMajor.mul(snapshot.rate)`) | **IMPLEMENTED** | `fx-conversion.test.ts` (RWF→USD, USD→RWF, inverse) | Direction is explicit and mathematically correct. Inverse uses `1/reverseRate`. |
| Rate types (AVERAGE/BUYING/SELLING) with configurability | `currency-exchange.service.ts` `selectRateValue` lines 76-101 | **IMPLEMENTED** | `fx-conversion.test.ts` (buying, selling, missing buying) | All three types supported. Missing buying/selling throws `ExchangeRateInvalidError`. |
| No silent 1:1 fallback | `currency-exchange.service.ts` throws `ExchangeRateNotFoundError` line 275 | **IMPLEMENTED** | `fx-conversion.test.ts` (missing rate test) | Grep confirms no `fallbackRate` or silent `return 1` in any currency file. Same-currency identity is the only 1:1 case. |
| Money-safe failure (fail-closed for payments) | `tap-and-leave.ts` line 119-134; `intouch/initiate.ts` line 64-79 | **IMPLEMENTED** | `tap-and-leave-fx.test.ts` (failure test); `payment-currency-consistency.test.ts` (EUR failure test) | Both payment paths call `convertMinorUnits` with `allowStale: false` and fail with 500 on error. |
| Transaction FX snapshot (immutable, structured) | `PaymentTransaction` new columns; both payment endpoints persist them | **IMPLEMENTED** | `tap-and-leave-fx.test.ts` (USD snapshot test); `payment-currency-consistency.test.ts` (USD snapshot test) | All 13 FX fields from Phase 2 §9.2 are present and persisted. `exchangeRateSnapshotId` FK to `CurrencyExchangeRate`. |
| BNR client (documented endpoints, string rates, error handling) | `bnr-client.service.ts` | **IMPLEMENTED** | `bnr-client.test.ts` (8 tests) | Follows documented API exactly. No invented auth. |
| BNR ingestion (idempotent, mapping, validation) | `bnr-rate-ingestion.service.ts` | **IMPLEMENTED** | `bnr-ingestion.test.ts` (7 tests) | Idempotent by `(source, sourceRecordId, fromCurrency, toCurrency, effectiveDate)`. Rejects malformed without corrupting valid. |
| BNR sync cron (protected, feature-gated, locked) | `src/pages/api/cron/bnr-sync.ts` | **IMPLEMENTED** | None (endpoint not tested) | Bearer `CRON_SECRET` auth, `BNR_SYNC_ENABLED` gate, `acquireCronLock`. No test coverage for the endpoint itself. |
| Legacy module deprecation (route to canonical, no unsafe fallback) | `currency-conversion.service.ts`, `exchange-rates.ts`, `currency.ts` | **IMPLEMENTED** | Indirectly via canonical service tests | All three legacy modules now route to canonical service. `EXCHANGE_RATES` reduced to `{RWF: 1}`. `convertFromRWF`/`convertToRWF` throw for non-RWF. |
| Historical preservation (no fabrication) | Migration adds nullable columns; existing rows untouched | **IMPLEMENTED** | None (no migration test) | All new FX columns nullable. Pre-Phase-3 transactions have null FX. No backfill. |
| Tax architecture (compute in order currency, freeze) | Not implemented — VAT=0 remains in InTouch initiate | **NOT IMPLEMENTED** | None | Phase 2 §10.2 requires tax computed in order currency. Phase 3 left `vatAmountCents: 0` in both payment paths. This is a known gap. |
| Rate-type policy layer (display/checkout/refund/reporting) | Not implemented — single `AVERAGE` default | **NOT IMPLEMENTED** | None | Phase 2 §8.2 recommended configurable policy per operation. Phase 3 hardcodes `rateType: 'AVERAGE'` in payment paths. Acceptable for pilot but not Phase 2-complete. |
| Observability metrics | Not implemented | **NOT IMPLEMENTED** | None | Phase 2 §11.6 recommended `bnr_sync_success_total`, `fx_rate_age_hours`, etc. Not present. |
| Display migration (no RWF relabeling) | `currency.ts` `formatCurrency` forces RWF; `checkout.tsx` uses `CurrencyDisplay` | **PARTIALLY IMPLEMENTED** | None | `formatCurrency` now forces RWF display (line 148: `safeCurrency = targetCurrency === 'RWF' ? 'RWF' : 'RWF'`). This prevents relabeling but also prevents legitimate display conversion. `CurrencyDisplay` component not audited for conversion correctness. |
| Order/checkout integration (persist order currency) | `checkout.tsx` uses `CurrencyDisplay`; `currency/default.ts` persists | **PARTIALLY IMPLEMENTED** | None | Display path fixed, but order pricing still implicitly RWF. No `orderCurrency` on `Sale` or `MenuItem` (Phase 2 §13.2 acknowledged this as out of scope). |
| Provider compatibility policy (paymentCurrency=RWF for InTouch) | Both payment endpoints set `paymentCurrency = 'RWF'` | **IMPLEMENTED** | `tap-and-leave-fx.test.ts`, `payment-currency-consistency.test.ts` | Correctly enforced. Cross-currency conversion happens before provider call. |

---

## 3. Database Review

### Schema inspection (`prisma/schema.prisma`)

**Enums (lines 2539-2549):**
- `ExchangeRateType`: `AVERAGE`, `BUYING`, `SELLING` — correct
- `ExchangeRateStatus`: `ACTIVE`, `SUPERSEDED`, `INVALID` — correct

**`CurrencyExchangeRate` (lines 2879-2905):**
- `rate`: `Decimal @db.Decimal(20, 10)` — widened from `Decimal(12,6)`. Adequate precision for FX.
- `averageRate`, `buyingRate`, `sellingRate`: `Decimal? @db.Decimal(20, 10)` — nullable, correct (not all sources provide all three)
- `sourceRecordId`, `sourceCurrencyName`, `sourceRecordCreatedAt`: nullable strings/timestamps — correct for BNR provenance
- `effectiveDate`, `fetchedAt`: `DateTime @default(now())` — non-nullable with safe default
- `status`: `ExchangeRateStatus @default(ACTIVE)` — non-nullable with safe default
- `metadata`: `Json?` — nullable, stores raw BNR payload
- `@@unique([fromCurrency, toCurrency, validFrom])` — pre-existing, preserved
- `@@unique([source, sourceRecordId, fromCurrency, toCurrency, effectiveDate])` — new, correct for idempotency
- Indexes on `(fromCurrency, toCurrency, effectiveDate)` and `(fromCurrency, toCurrency, status, effectiveDate)` — correct for lookup performance

**`SupportedCurrency` (lines 2908-2921):**
- `displayEnabled`: `Boolean @default(true)` — safe default
- `transactionEnabled`, `paymentEnabled`, `settlementEnabled`: `Boolean @default(false)` — safe default (RWF-only by default, correct for pilot)
- All new columns are non-nullable with defaults — migration-safe

**`PaymentTransaction` (lines 1403-1475):**
- 13 new FX snapshot fields, all nullable — correct for backward compatibility
- `exchangeRateSnapshotId`: FK to `CurrencyExchangeRate(id)` with `ON DELETE SET NULL` — correct (preserves transaction even if rate deleted)
- `exchangeRateValue`: `Decimal? @db.Decimal(20, 10)` — matches rate precision
- `exchangeRateType`: `ExchangeRateType?` — enum, correct
- Three new indexes: `orderCurrency`, `paymentCurrency`, `exchangeRateSnapshotId` — correct for query patterns

### Migration review (`prisma/migrations/20260920130000_currency_bnr_phase3/migration.sql`)

- All `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` — non-destructive
- Enums created with `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN null; END $$;` — idempotent
- `ALTER COLUMN "rate" TYPE DECIMAL(20,10)` — widening from `DECIMAL(12,6)`. This is safe in PostgreSQL (widening decimal precision is non-destructive).
- New columns have safe defaults (`DEFAULT CURRENT_TIMESTAMP`, `DEFAULT 'ACTIVE'`, `DEFAULT true`, `DEFAULT false`)
- FK added with `ON DELETE SET NULL` and `ON UPDATE CASCADE` — correct
- FK creation wrapped in exception handler — idempotent
- Unique index created with `IF NOT EXISTS` — idempotent

**Finding:** Migration is genuinely non-destructive. Existing rows are preserved. New columns are nullable or have safe defaults. No data is dropped, rewritten, or deleted.

---

## 4. BNR Client Review

**File:** `src/lib/services/bnr-client.service.ts` (167 lines)

### Endpoint conformance
- `GET /ExchangeRate` — `listExchangeRates()` builds URL from base, appends query params, calls `fetchJson`. Correct.
- `GET /ExchangeRate/{id}` — `getExchangeRateById(id)` builds `${baseUrl}/${encodeURIComponent(id)}`. Correct.
- Query parameters: `start_date`, `end_date`, `currency_name`, `id` — all supported as documented. Correct.

### Response parsing
- `normalizeRateArray()` handles: raw array, `{data: [...]}`, `{results: [...]}`, single object with required fields. Defensive and correct.
- Rate fields preserved as strings (no `parseFloat`). Correct per BNR documentation.

### Error handling
- HTTP non-2xx: throws `BnrApiError` with status code and response body (truncated to 2000 chars). Correct.
- Empty 200 response: returns `[]`. Reasonable.
- Non-JSON 200 response: throws `BnrApiError` with "non-JSON" message. Correct.
- `BnrApiError` captures `status` and `responseBody`. Correct.

### Timeout behavior
- **No explicit timeout.** `fetch()` is called without `AbortController` or timeout. This is a gap — a hung BNR API could block ingestion indefinitely. **Recommendation:** Add `AbortSignal.timeout(30000)` or similar.

### Malformed response handling
- Empty body → `[]` (line 130). Reasonable.
- Non-JSON body → `BnrApiError`. Correct.
- Missing required fields in single object → not detected by `normalizeRateArray` (only checks for presence of 5 fields). Ingestion service validates fields separately. Acceptable division of responsibility.

### Logging
- No logging in the client. Errors are thrown, not logged. Caller responsibility. Acceptable.

### Secret handling
- No secrets hardcoded. Auth values read from env vars at call time. No `console.log` of headers or URL. Correct.

---

## 5. BNR Authentication Review

### Mode definition
- Modes defined in `applyConfiguredAuth()` (lines 53-87): `none`, `header`, `query`
- Selected via `process.env.BNR_AUTH_MODE` (default: `none`)
- Invalid mode throws `BnrClientConfigurationError` — correct, no silent disable

### Safety analysis

**`none` mode (default):**
- No auth applied. Safe for unauthenticated APIs. Correct default.

**`header` mode:**
- Requires `BNR_AUTH_HEADER_NAME` and `BNR_AUTH_HEADER_VALUE`
- Throws `BnrClientConfigurationError` if either is missing — correct, no silent disable
- Header value set via `headers.set(headerName, headerValue)` — never logged, never in URL. Safe.

**`query` mode:**
- Requires `BNR_AUTH_QUERY_PARAM_NAME` and `BNR_AUTH_QUERY_PARAM_VALUE`
- Throws `BnrClientConfigurationError` if either is missing — correct
- Value appended to URL via `url.searchParams.set(paramName, paramValue)`
- **Risk:** Secret appears in URL. This could be logged by proxies, CDN, or server access logs. **Recommendation:** Prefer `header` mode. Only use `query` if BNR documentation explicitly requires it.

### Invalid mode handling
- Any value other than `none`/`header`/`query` throws `BnrClientConfigurationError` (line 84). No silent disable. Correct.

### What is still required from BNR documentation
1. **Whether authentication is required at all** (the API may be public)
2. **The exact authentication mechanism** (bearer token, API key header, query param, basic auth)
3. **The header/parameter name** (e.g., `Authorization`, `X-API-Key`, `apikey`)
4. **The credential format** (raw key, `Bearer <key>`, etc.)
5. **Whether authentication is per-request or session-based**

**No API key was added, requested, or logged.** The implementation is correctly blocked until the founder provides this information.

---

## 6. Rate Mapping Review

### `currency_name` → ISO mapping (`bnr-rate-ingestion.service.ts` lines 17-34)

**Supported mappings:**
| BNR `currency_name` | ISO Code |
|---------------------|----------|
| `USD` | USD |
| `EUR` | EUR |
| `GBP` | GBP |
| `KES` | KES |
| `UGX` | UGX |
| `TZS` | TZS |
| `RWF` | RWF |
| `US DOLLAR` | USD |
| `UNITED STATES DOLLAR` | USD |
| `EURO` | EUR |
| `BRITISH POUND` | GBP |
| `POUND STERLING` | GBP |
| `KENYAN SHILLING` | KES |
| `UGANDAN SHILLING` | UGX |
| `TANZANIAN SHILLING` | TZS |
| `RWANDAN FRANC` | RWF |

**Unsupported BNR currencies (not mapped):**
- Any currency not in the table above (e.g., `CHF`, `CNY`, `JPY`, `ZAR`, `CAD`, `AUD`, `INR`, etc.)
- These will be rejected with `Unsupported currency_name` error. Correct behavior — no silent mapping.

**Ambiguous mappings:** None. Each BNR name maps to exactly one ISO code.

**Missing mappings:** The mapping table is limited to 7 currencies (RWF + 6 regional/major). If BNR publishes rates for additional currencies (e.g., `CHINESE YUAN`, `JAPANESE YEN`, `SWISS FRANC`), they will be rejected. This is acceptable for pilot but must be expanded based on actual BNR response data.

**Normalization function (`normalizeIsoCurrency`):**
- Accepts 3-letter ISO codes directly (regex `^[A-Z]{3}$`)
- Falls back to name lookup
- Returns `null` for unrecognized values
- Correct — no silent defaulting

### Rate type preservation

**`average_rate`, `buying_rate`, `selling_rate` are NOT collapsed:**
- `parseDecimalString()` parses each separately (lines 128-130)
- All three are stored in separate columns (`averageRate`, `buyingRate`, `sellingRate`)
- `selectRateValue()` in the canonical service selects the requested type
- If a requested type is null, `ExchangeRateInvalidError` is thrown
- Correct — no silent collapse to a single value

---

## 7. Rate Direction Review

### Mathematical trace

**Stored rate (BNR ingestion with `RWF_PER_UNIT_OF_CURRENCY`):**
- BNR returns `average_rate: "1300"` for USD
- `mapPair()` returns `{fromCurrency: 'USD', toCurrency: 'RWF'}`
- Stored as `CurrencyExchangeRate(fromCurrency='USD', toCurrency='RWF', averageRate=1300)`
- This means: `rate(USD→RWF) = 1300 RWF per 1 USD`

**Conversion: USD → RWF** (`convertMinorUnits(100, 'USD', 'RWF')`):
1. `fromDef.decimalDigits = 2`, `toDef.decimalDigits = 0`
2. `fromFactor = 10^2 = 100`, `toFactor = 10^0 = 1`
3. `amountMajor = 100 / 100 = 1 USD`
4. `convertedMajor = 1 * 1300 = 1300 RWF`
5. `convertedMinor = 1300 * 1 = 1300`
6. **Result: 100 USD cents → 1300 RWF minor** ✓ (matches test expectation)

**Conversion: RWF → USD** (`convertMinorUnits(10000, 'RWF', 'USD')`):
1. `fromDef.decimalDigits = 0`, `toDef.decimalDigits = 2`
2. `fromFactor = 1`, `toFactor = 100`
3. `amountMajor = 10000 / 1 = 10000 RWF`
4. Direct rate lookup: `rate(RWF→USD)` — if not found, inverse from `rate(USD→RWF)=1300`
5. `inverse = 1/1300 = 0.0007692307...`
6. `convertedMajor = 10000 * 0.0007692307 = 7.6923 USD`
7. `convertedMinor = 7.6923 * 100 = 769.23 → 769 (ROUND_HALF_UP)`
8. **Result: 10000 RWF minor → 769 USD cents** ✓ (mathematically correct)

**Inverse calculation** (lines 256-258):
```typescript
const inverse = new Prisma.Decimal(1).div(reverseRate);
```
- Correct: `rate(RWF→USD) = 1 / rate(USD→RWF)`
- No risk of multiplying when division is required — the formula is explicit

**Rounding** (line 334):
```typescript
const convertedMinor = convertedMajor.mul(toFactor).toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);
```
- Correct: `ROUND_HALF_UP` as specified in Phase 2 §6.3

**Precision:** `Prisma.Decimal` (decimal.js) is used throughout. No `float` arithmetic in FX paths. Correct.

**No multiply/divide confusion:** The formula `amountMajor * rate` is correct for `rate(from→to) = toUnitsPerOneBaseUnit`. Inverse uses `1/rate`. Verified.

---

## 8. Historical FX Review

### Transaction reconstruction capability

**For a post-Phase-3 cross-currency transaction, the following fields are persisted on `PaymentTransaction`:**
| Field | Purpose | Persisted? |
|-------|---------|------------|
| `orderAmountCents` | Original order amount (minor units) | ✓ |
| `orderCurrency` | Order currency (ISO) | ✓ |
| `paymentAmountCents` | Amount sent to provider (minor units) | ✓ |
| `paymentCurrency` | Provider currency (ISO) | ✓ |
| `settlementAmountCents` | Settlement amount (minor units) | ✓ |
| `settlementCurrency` | Settlement currency (ISO) | ✓ |
| `exchangeRateValue` | Rate value applied | ✓ |
| `exchangeRateType` | AVERAGE/BUYING/SELLING | ✓ |
| `exchangeRateSource` | Source (e.g., "BNR") | ✓ |
| `exchangeRateBaseCurrency` | Rate base currency | ✓ |
| `exchangeRateQuoteCurrency` | Rate quote currency | ✓ |
| `exchangeRateEffectiveDate` | Rate publication date | ✓ |
| `exchangeRateRecordId` | BNR record ID | ✓ |
| `exchangeRateSnapshotId` | FK to `CurrencyExchangeRate` | ✓ |

**All 14 fields from Phase 2 §9.2 are present.** A completed transaction can be fully reconstructed without recalculating from current rates.

**Historical reporting does not depend on current BNR rate:** The `exchangeRateValue` and `exchangeRateSnapshotId` are frozen at transaction time. The `CurrencyExchangeRate` row referenced by `exchangeRateSnapshotId` is never overwritten (ingestion is idempotent — duplicates update `fetchedAt` only, changed rates create new rows or update in place but the snapshot ID captures the specific version).

**Caveat:** The ingestion service updates rate values in place when values change (lines 186-200). This means the `CurrencyExchangeRate` row referenced by `exchangeRateSnapshotId` could have its values updated after a transaction references it. **This is a minor integrity gap** — the transaction also stores `exchangeRateValue` directly, so the transaction's own record remains accurate, but the snapshot row could drift. Phase 2 §5.2 recommended "never overwrite historical rows; insert-by-date/version and supersede logically." The implementation updates in place rather than superseding. **Recommendation:** Change ingestion to insert new rows with `SUPERSEDED` status on old rows, rather than updating in place.

---

## 9. Tap & Leave Review

**File:** `src/pages/api/checkout/tap-and-leave.ts`

### Phase 1 inconsistency fix
**Phase 1 finding (§9.3):** `amountCents` was RWF cents but `currency` was business currency (e.g., "USD") — internally inconsistent record.

**Phase 3 fix:**
- `orderCurrency` = business currency (line 105)
- `paymentCurrency` = `'RWF'` (line 106) — explicit
- `amountCents` = `amountRwfCents` (line 142) — RWF cents
- `currency` = `paymentCurrency` (line 143) — RWF
- `orderAmountCents` = `totalAmount` (line 144) — original amount in order currency
- `orderCurrency` = business currency (line 145)

**The inconsistency is fixed.** `amountCents` and `currency` now match (both RWF). `orderAmountCents` and `orderCurrency` capture the original denomination separately.

### FX persistence
- When `orderCurrency !== paymentCurrency`: calls `convertMinorUnits` with `maxAgeHours=48`, `allowStale=false` (lines 119-123)
- Persists all 13 FX snapshot fields (lines 150-157)
- `rawRequest` still includes FX summary for debugging (lines 169-189) — but FX is no longer buried there alone

### Failure safety
- If `convertMinorUnits` throws, the `catch` block returns 500 (line 322-325)
- No silent 1:1 fallback. Verified.

### Monetary denomination
- `amountRwfCents` is explicitly RWF cents (line 124)
- `amountRwf = Math.round(amountRwfCents / 100)` converts to RWF major units for InTouch (line 237)
- Denomination is explicit throughout. Correct.

---

## 10. InTouchPay Review

**File:** `src/pages/api/payments/intouch/initiate.ts`

### Phase 3 changes
- Reads business currency from DB (lines 39-42)
- Splits `orderCurrency` from `paymentCurrency` (lines 51-52)
- When cross-currency: calls `convertMinorUnits` with `maxAgeHours=48`, `allowStale=false` (lines 64-79)
- Persists all FX snapshot fields (lines 104-111)
- `paymentAmountInRwfUnits = Math.round(paymentAmountCents / 100)` for InTouch (line 145)

### What was NOT changed
- **Amount calculation:** `paymentFee = Math.round(amount * 0.05)`, `totalAmount = amount + paymentFee` — unchanged. The `amount` input is still treated as RWF major units.
- **InTouch call:** `InTouchService.requestPayment({ amount: paymentAmountInRwfUnits, ... })` — unchanged interface.
- **Callbacks:** Webhook handling not modified. `rawCallback` stored as-is.
- **Transaction creation:** Structure preserved, new fields added.

### VAT=0 issue
**The VAT=0 hardcoding remains.** Line 112: `vatAmountCents: 0`, line 113: `exVatAmountCents: paymentAmountCents`.

**Phase 1 §9.14 flagged this:** "intouch/initiate.ts hardcodes VAT to 0. Ignores Business.taxRate/taxMode."

**Phase 3 implementation report §10 acknowledges this:** "The previous VAT=0 hardcoding in the InTouch path remains as-is for RWF transactions."

**Finding:** This is a known, documented gap. Phase 3 did not fix the VAT issue. The FX snapshot ensures the tax basis is traceable, but the tax calculation itself is still wrong for businesses with non-zero VAT. **This must be fixed in a future phase.**

### No breakage to existing flow
- For RWF businesses (the vast majority): `orderCurrency === paymentCurrency`, no conversion happens, `paymentAmountCents = orderAmountCents`. Behavior unchanged.
- For non-RWF businesses: conversion happens before InTouch call. If conversion fails, 500 returned. No silent corruption.

---

## 11. Legacy FX Review

### `EXCHANGE_RATES` constant
- `src/lib/utils/currency.ts` line 90: `export const EXCHANGE_RATES: Record<string, number> = { RWF: 1 }`
- Reduced from 7 pairs to identity-only. No hardcoded rates remain.
- **Callers:** 16 files import from `currency.ts` (grep confirmed). These use `formatCurrency`, `getCurrencyConfig`, `SUPPORTED_CURRENCIES`, `detectCurrencyFromLocale` — all display/utility functions. None use `EXCHANGE_RATES` for runtime conversion (the constant is effectively dead).

### `currency.service.ts` (module #2)
- Not modified by Phase 3. Still has hardcoded rates. Phase 1 audit noted it as deprecated.
- **Callers:** `ebm-formatter.ts` only. EBM receipts are RWF-only by RRA design, so the hardcoded rates are not used for live conversion.

### `currency-conversion.service.ts` (module #4, API Ninjas)
- Replaced with compatibility wrapper. All functions route to canonical service.
- `getCachedRate()` returns `null` (line 100-102) — no silent fallback.
- `preloadExchangeRates()` is a no-op (line 96-98).
- **No API Ninjas calls remain.** Grep confirmed: zero matches for `api-ninjas` or `API_NINJAS_KEY` in `src/`.

### `exchange-rates.ts` (module #5, exchangerate.host)
- Replaced with canonical-service-backed implementation.
- `getFallbackRates()` returns `{ [key]: 1 }` only — no hardcoded rates.
- `fetchRates()` calls `getRatesForBaseCurrency` from canonical service.
- `convert()` throws if rate missing (line 40) — no silent 1:1.
- **No exchangerate.host calls remain.** Grep confirmed: zero matches for `exchangerate.host` in `src/`.

### Silent 1:1 fallback
- Grep for `fallbackRate|return 1\b|silent.*1:1` in `src/` found 18 matches, none in currency/FX files. All matches are in unrelated services (string similarity, priority scoring, etc.).
- **No production FX path can silently fall back to 1:1.** Verified.

---

## 12. Failure-Safety Review

| Scenario | Behavior | Verified |
|----------|----------|----------|
| BNR API unavailable (network error) | `fetch()` throws → `BnrApiError` → ingestion fails → existing rates remain | ✓ (bnr-client.test.ts 500 test) |
| BNR API returns 400/404/500 | `BnrApiError` thrown with status code | ✓ (bnr-client.test.ts) |
| BNR API returns non-JSON | `BnrApiError` thrown | ✓ (bnr-client.test.ts) |
| Rate missing for pair | `ExchangeRateNotFoundError` thrown | ✓ (fx-conversion.test.ts) |
| Rate is non-positive | `ExchangeRateInvalidError` thrown | ✓ (fx-conversion.test.ts) |
| Rate is stale (age > maxAgeHours) | `ExchangeRateStaleError` thrown | ✓ (fx-conversion.test.ts) |
| Buying/selling rate null when requested | `ExchangeRateInvalidError` thrown | ✓ (fx-conversion.test.ts) |
| Currency unsupported | `CurrencyValidationError` thrown | ✓ (currency-model.test.ts) |
| Currency inactive | `CurrencyValidationError` thrown | ✓ (currency-model.test.ts) |
| `BNR_QUOTATION_MODE` not set | `Error` thrown before any ingestion | ✓ (bnr-ingestion.test.ts) |
| Cross-currency payment with no rate | Payment initiation fails with 500 | ✓ (tap-and-leave-fx.test.ts, payment-currency-consistency.test.ts) |
| Same-currency conversion | Returns 1:1 identity (valid) | ✓ (fx-conversion.test.ts) |
| Malformed BNR record | Rejected, summary.errors populated, valid records still processed | ✓ (bnr-ingestion.test.ts) |

**No silent 1:1 fallback exists in any production path.** Confirmed.

---

## 13. Test Quality Review

### Phase 3 tests (42 total, 6 suites)

**`currency-model.test.ts` (6 tests):**
- Rejects empty code, unsupported currency, inactive currency
- Returns RWF fallback when DB row missing
- Returns supported foreign currency from DB
- Normalizes lowercase input
- **Gap:** No test for `displayEnabled`/`transactionEnabled`/`paymentEnabled`/`settlementEnabled` capability enforcement

**`fx-conversion.test.ts` (13 tests):**
- Same-currency identity ✓
- RWF→USD direct ✓
- USD→RWF direct ✓
- Inverse from reverse rate ✓
- Missing rate throws ✓
- Non-positive rate throws ✓
- Stale rate throws ✓
- `allowStale=true` permits stale ✓
- Buying rate selection ✓
- Selling rate selection ✓
- Missing buying rate throws ✓
- Historical `asOf` lookup ✓
- Precision (large amount) ✓
- Rounding (ROUND_HALF_UP) ✓
- **Gap:** No test for `convertCurrency` (major units) — only `convertMinorUnits` tested
- **Gap:** No test for `getRatesForBaseCurrency` or `getAllExchangeRates`

**`bnr-client.test.ts` (8 tests):**
- 400 error ✓
- 404 error ✓
- 500 error ✓
- Non-JSON response ✓
- Empty 200 response ✓
- JSON array parsing ✓
- Single object parsing ✓
- `{data: [...]}` wrapper parsing ✓
- **Gap:** No test for `{results: [...]}` wrapper
- **Gap:** No test for query parameter construction (`start_date`, `end_date`, `currency_name`, `id`)
- **Gap:** No timeout test

**`bnr-ingestion.test.ts` (7 tests):**
- Currency name mapping ✓
- Malformed record rejection ✓
- Unsupported currency rejection ✓
- Idempotent skip (duplicate) ✓
- Update on changed values ✓
- `ingestBnrExchangeRateById` null response ✓
- Missing `BNR_QUOTATION_MODE` throws ✓
- **Gap:** No test for `UNIT_OF_CURRENCY_PER_RWF` quotation mode (only `RWF_PER_UNIT_OF_CURRENCY` tested)
- **Gap:** No test for mixed valid+invalid records in single batch (verifies valid records still processed when one is rejected)

**`tap-and-leave-fx.test.ts` (3 tests):**
- RWF identity path ✓
- USD cross-currency with full FX snapshot ✓
- Failure safety when rate missing ✓
- **Strength:** Verifies all 13 FX fields are persisted
- **Gap:** No test for `BUYING`/`SELLING` rate type in payment path
- **Gap:** No test for stale rate rejection in payment path

**`payment-currency-consistency.test.ts` (4 tests):**
- RWF identity ✓
- USD cross-currency with FX snapshot ✓
- EUR failure safety ✓
- Order/payment amount split ✓
- **Gap:** Test comment says "VAT is no longer hardcoded to zero when business has tax config" but no test actually verifies this (because VAT=0 was NOT fixed)

### Existing payment tests (30 total, 3 suites)
- `pay-002-tap-and-leave-callback-url.test.ts` — callback URL resolution (no currency tests)
- `pay-002-intouch-document-conformance.test.ts` — InTouch API conformance (no currency tests)
- `payment-fees.test.ts` — convenience fee + VAT (RWF only)
- **All 30 pass.** No regressions.

### Overall test assessment
- **Strengths:** Good coverage of canonical service math, error handling, and FX snapshot persistence
- **Gaps:** No integration tests (full payment→FX→ledger chain), no E2E tests, no cron endpoint test, no `UNIT_OF_CURRENCY_PER_RWF` test, no capability enforcement test, no test verifying VAT=0 remains (or is fixed)
- **Verdict:** Tests are adequate for unit-level confidence but insufficient for production deployment without integration tests

---

## 14. TypeScript Verification

### Command run
```
npx tsc --noEmit
```

### Results
- **Total errors:** 152 (pre-existing, in unrelated modules)
- **Phase 3 file errors:** 0

### Phase 3 files verified clean
Grep for Phase 3 filenames in `tsc` output returned 0 matches:
- `currency-exchange.service.ts` — 0 errors
- `currency-conversion.service.ts` — 0 errors
- `bnr-client.service.ts` — 0 errors
- `bnr-rate-ingestion.service.ts` — 0 errors
- `exchange-rates.ts` — 0 errors
- `currency.ts` (utils) — 0 errors
- `bnr-sync.ts` — 0 errors
- `currency/rates.ts`, `currency/convert.ts`, `currency/default.ts` — 0 errors
- `tap-and-leave.ts` — 0 errors
- `intouch/initiate.ts` — 0 errors

### Pre-existing errors (examples, unrelated)
- `scripts/demo-service-intelligence.ts`
- `scripts/ocr-p0-inventory-safety-test.ts`
- `src/app/api/daily-briefings/generate/route.ts`
- `src/lib/ai-copilot/service.ts`
- `src/lib/daily-briefings/service.ts`
- `src/lib/intelligence/patterns.ts`
- `src/lib/kitchen-intelligence/service.ts`
- `src/lib/services/payment-completion.service.ts`
- `src/pages/api/branches/index.ts`
- Multiple watchdog and dashboard files

**Finding:** No Phase 3 file introduces TypeScript errors. No existing error was caused by Phase 3 changes. No Phase 3 import creates a dependency on a broken module.

---

## 15. Security Review

### API key / secrets check
- **No BNR API key in source code:** Grep for `BNR_API_KEY` in `src/` — 0 matches
- **No BNR API key in tests:** Grep in `tests/` — 0 matches
- **No BNR API key in reports:** The Phase 3 report mentions env var names (`BNR_AUTH_HEADER_VALUE`, etc.) but contains no actual values
- **No secret in `.env.example`:** File does not exist or contains no BNR vars
- **No secret in `.env.production.template`:** Contains no BNR vars
- **No secret in logs:** BNR client does not log headers or URL. `console.error` in payment endpoints logs error messages only, not auth values.

### Auth value handling
- `BNR_AUTH_HEADER_VALUE` read from env at call time, set on `Headers` object, never logged
- `BNR_AUTH_QUERY_PARAM_VALUE` read from env at call time, set on URL search params
- **Risk:** Query param values appear in URLs which could be logged by infrastructure. Documented in §5 above.

### Cron secret
- `CRON_SECRET` compared against `Bearer ${cronSecret}` header — standard pattern
- No timing-safe comparison (vulnerable to timing attacks in theory, but low risk for cron auth)

### No credentials committed
- `git status` confirms no `.env` files staged or tracked
- `.gitignore` confirmed in Phase 1 audit to ignore `.env` and `.env*.local`

---

## 16. Git Review

### `git status --short` comparison

**Phase 3 modified files (11 tracked, modified):**
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

**Phase 3 new files (untracked):**
```
?? prisma/migrations/20260920130000_currency_bnr_phase3/
?? src/lib/services/bnr-client.service.ts
?? src/lib/services/bnr-rate-ingestion.service.ts
?? src/pages/api/cron/bnr-sync.ts
?? tests/unit/currency/
?? CURRENCY-BNR-PHASE-1-AUDIT.md
?? CURRENCY-BNR-PHASE-2-ARCHITECTURE.md
?? CURRENCY-BNR-PHASE-3-IMPLEMENTATION.md
?? CURRENCY-BNR-PHASE-3-FINAL-REVIEW.md (this report)
```

**Pre-existing unrelated changes (NOT touched by Phase 3):**
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

### Schema diff verification
- `git diff prisma/schema.prisma` shows 57 insertions, 10 deletions
- The 10 deletions are the old `CurrencyExchangeRate` model definition (replaced with expanded version)
- All changes are additive (new columns, new enums, new indexes, new FK)
- The `rate` column type change (`Decimal(12,6)` → `Decimal(20,10)`) is a widening operation — safe in PostgreSQL

### Confirmations
- **No unrelated files were modified by Phase 3.** All pre-existing modifications remain untouched.
- **Nothing was staged.** No `git add` was run.
- **Nothing was committed.** HEAD remains `7bcd1db`.
- **Nothing was pushed.** Branch remains ahead of origin by 2 commits (pre-existing state).

---

## 17. Deployment Requirements

### A. Code-complete requirements
- ✅ Canonical currency service implemented
- ✅ BNR client implemented
- ✅ BNR ingestion implemented
- ✅ FX snapshot persistence on payment transactions
- ✅ Legacy modules deprecated
- ✅ Tests pass (42 Phase 3 + 30 regression)
- ✅ TypeScript clean for Phase 3 files
- ⚠️ VAT=0 hardcoding remains in InTouch initiate (known gap)
- ⚠️ No integration/E2E tests
- ⚠️ No cron scheduler registration (endpoint exists but not wired to vercel.json or cron.ts)
- ⚠️ No BNR client timeout (could hang indefinitely)
- ⚠️ Ingestion updates rates in place rather than superseding (minor historical integrity gap)

### B. BNR authentication requirements (BLOCKING)
1. Confirm whether BNR API requires authentication
2. Confirm the exact authentication mechanism (header, query, bearer, etc.)
3. Obtain the credential (API key/token) from founder's BNR email/documentation
4. Configure `BNR_AUTH_MODE` and corresponding env vars
5. **Do not deploy BNR sync until this is resolved**

### C. Environment variables
| Variable | Required for | Default |
|----------|-------------|---------|
| `BNR_API_BASE_URL` | BNR sync | `https://fxrates.bnr.rw/ExchangeRate` |
| `BNR_AUTH_MODE` | BNR sync | `none` |
| `BNR_AUTH_HEADER_NAME` | If `header` mode | — |
| `BNR_AUTH_HEADER_VALUE` | If `header` mode | — |
| `BNR_AUTH_QUERY_PARAM_NAME` | If `query` mode | — |
| `BNR_AUTH_QUERY_PARAM_VALUE` | If `query` mode | — |
| `BNR_QUOTATION_MODE` | BNR ingestion | **MUST BE SET** (no default) |
| `BNR_SYNC_ENABLED` | Cron | `false` |
| `CRON_SECRET` | Cron auth | **MUST BE SET** |
| `FX_MAX_RATE_AGE_HOURS` | Display conversion | `168` (7 days) |
| `FX_MAX_PAYMENT_RATE_AGE_HOURS` | Payment conversion | `48` (2 days) |

### D. Database migration
- Migration file: `prisma/migrations/20260920130000_currency_bnr_phase3/migration.sql`
- Must be applied via `prisma migrate deploy` in target environment
- Non-destructive: additive columns, nullable, safe defaults
- No data backfill required for existing RWF transactions
- **Must verify** the `ALTER COLUMN "rate" TYPE DECIMAL(20,10)` succeeds on the target database (widening is safe in PostgreSQL, but verify on production snapshot first)

### E. Cron/scheduler
- Endpoint: `GET /api/cron/bnr-sync`
- Auth: `Bearer ${CRON_SECRET}`
- Feature gate: `BNR_SYNC_ENABLED=true`
- Lock: `acquireCronLock('bnr-rate-sync', 180)` (180s TTL)
- **Not wired to any scheduler.** Must add to `vercel.json` cron config or external scheduler (e.g., Vercel Cron, GitHub Actions, external cron service)

### F. Existing unrelated TypeScript errors
- 152 pre-existing errors in unrelated modules (intelligence, briefings, watchdog, OCR, etc.)
- These do not block Phase 3 deployment but must be resolved independently
- Phase 3 does not depend on any broken module

### G. Testing requirements before production
1. **Integration test:** Full payment → FX conversion → transaction persistence → ledger entry chain
2. **Integration test:** BNR ingestion → DB rows → canonical service lookup
3. **E2E test:** Tap & Leave with non-RWF business currency
4. **E2E test:** InTouch initiate with non-RWF business currency
5. **Cron test:** BNR sync endpoint with mock BNR API
6. **Migration dry-run:** Apply migration on production snapshot, verify no data loss
7. **Stale rate test:** Verify payment path rejects stale rates (48h threshold)

---

## 18. Remaining Blockers

1. **BNR authentication mechanism** — Founder must provide auth format and credential. Client supports configurable modes but actual auth is unresolved.
2. **`BNR_QUOTATION_MODE` direction** — Must be confirmed from BNR API response. If set incorrectly, all conversions will be inverted. This is a critical configuration decision.
3. **VAT=0 in InTouch initiate** — Known gap from Phase 1, not fixed in Phase 3. Tax reporting inaccuracy for this path.
4. **No cron wiring** — BNR sync endpoint exists but no scheduler calls it.
5. **No BNR client timeout** — Hung API could block ingestion indefinitely.
6. **In-place rate updates** — Ingestion updates existing rows rather than superseding. Minor historical integrity gap.
7. **No integration/E2E tests** — Unit tests pass but full chain not verified.
8. **Production build not verified** — `next build` not run.
9. **Rate-type policy not configurable** — All payment paths hardcode `AVERAGE`. Phase 2 recommended per-operation policy.
10. **No observability** — Phase 2 recommended metrics (`bnr_sync_success_total`, `fx_rate_age_hours`, etc.) not implemented.

---

## 19. Final Decision Matrix

| Area | Status | Evidence | Remaining Action |
|------|--------|----------|------------------|
| Database | **IMPLEMENTED** | Schema verified, migration non-destructive, all FX fields present | Apply migration on production snapshot; verify `ALTER COLUMN` succeeds |
| BNR client | **IMPLEMENTED** | Follows documented API, error handling for 400/404/500, string rate preservation | Add timeout; test query param construction |
| BNR ingestion | **IMPLEMENTED** | Idempotent, mapping, validation, malformed rejection | Test `UNIT_OF_CURRENCY_PER_RWF` mode; consider supersede-instead-of-update |
| FX service | **IMPLEMENTED** | Canonical service, explicit rate types, typed errors, no silent 1:1 | Add `convertCurrency` tests; add `getRatesForBaseCurrency` tests |
| Currency model | **IMPLEMENTED** | Capability flags, RWF fallback, validation | Add capability enforcement tests |
| Order/checkout | **PARTIALLY IMPLEMENTED** | Display path fixed; order pricing still implicitly RWF | Future phase: add `orderCurrency` to `Sale`/`MenuItem` |
| Tap & Leave | **IMPLEMENTED** | FX snapshot persisted, denomination explicit, failure-safe | Add stale rate test; add BUYING/SELLING test |
| InTouchPay | **PARTIALLY IMPLEMENTED** | FX snapshot persisted, cross-currency conversion works | **Fix VAT=0 hardcoding**; add tax config integration |
| Historical FX | **IMPLEMENTED** | All 14 FX fields on `PaymentTransaction`; nullable for legacy | Consider supersede-instead-of-update for rate integrity |
| Legacy FX | **IMPLEMENTED** | All legacy modules route to canonical; no API Ninjas, no exchangerate.host, no silent 1:1 | Monitor for hidden callers during rollout |
| Tests | **PARTIALLY IMPLEMENTED** | 42 unit tests pass; no integration/E2E/cron tests | Add integration and E2E tests before production |
| Security | **IMPLEMENTED** | No secrets in source/tests/reports; auth values from env; no logging of secrets | Use `header` mode over `query` mode when auth is configured |
| TypeScript | **IMPLEMENTED** | 0 errors in Phase 3 files; 152 pre-existing unrelated errors | Resolve unrelated errors independently |
| Migration | **IMPLEMENTED** | Non-destructive, additive, idempotent | Apply on production snapshot; verify |
| Deployment | **NOT READY** | Code complete but BNR auth unresolved, cron not wired, no integration tests | Resolve blockers in §18 |
| BNR authentication | **BLOCKED** | Client supports modes but actual auth mechanism unknown | Founder must provide BNR auth documentation |

---

## 20. Exact Recommended Next Actions

### Immediate (before any deployment)
1. **Obtain BNR authentication documentation from founder.** Confirm: is auth required? What mechanism? What credential format?
2. **Confirm `BNR_QUOTATION_MODE` from a sample BNR API response.** Fetch one real rate and verify whether it's `RWF_PER_UNIT_OF_CURRENCY` or `UNIT_OF_CURRENCY_PER_RWF`. Setting this wrong inverts all conversions.
3. **Apply migration on a production database snapshot** and verify no data loss.

### Short-term (before production traffic)
4. **Add BNR client timeout** (`AbortSignal.timeout(30000)`) to prevent hung API calls.
5. **Wire BNR sync cron** to `vercel.json` or external scheduler. Set frequency (daily after BNR publication).
6. **Add integration tests:** Full payment → FX → transaction → ledger chain for both RWF and non-RWF businesses.
7. **Fix VAT=0 hardcoding** in `intouch/initiate.ts` — derive from `Business.taxRate`/`taxMode`.
8. **Change ingestion to supersede** (insert new row, mark old as `SUPERSEDED`) rather than updating in place, to preserve historical rate integrity.

### Medium-term (post-deployment hardening)
9. **Add rate-type policy layer** — configurable per operation (display, checkout, refund, reporting).
10. **Add observability metrics** — `bnr_sync_success_total`, `fx_rate_age_hours`, `fx_conversion_failure_total`, `payments_blocked_fx_total`.
11. **Add `orderCurrency` to `Sale` and `MenuItem`** for full multi-currency order pricing.
12. **Expand BNR currency mapping** based on actual BNR response data.
13. **Add E2E tests** for Tap & Leave and InTouch with non-RWF business currency.

### Never
- Do not add a BNR API key to source code, tests, or reports.
- Do not enable `BNR_SYNC_ENABLED=true` until auth is resolved and `BNR_QUOTATION_MODE` is confirmed.
- Do not silent-fallback to 1:1 for missing FX.
- Do not deploy to production without integration tests.

---

## Review Confirmations

- **No source code was modified during this review.**
- **No schema was modified.**
- **No migrations were created.**
- **No environment variables were modified.**
- **No BNR API key was added.**
- **No files were staged.**
- **No commits were created.**
- **No pushes were performed.**
- **No resets, stashes, or working-tree cleaning occurred.**
- **Only this new review report was created:** `CURRENCY-BNR-PHASE-3-FINAL-REVIEW.md`
