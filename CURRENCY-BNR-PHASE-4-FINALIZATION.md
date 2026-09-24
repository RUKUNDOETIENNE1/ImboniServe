# CURRENCY-BNR-PHASE-4-FINALIZATION

**Repository:** `C:\Dev\ImboniResto`
**Branch:** `main`
**HEAD:** `7bcd1db0b2050054c27bba597296741c334122af` (unchanged — no commits made)
**Reference:** `CURRENCY-BNR-PHASE-3-FINAL-REVIEW.md` (blocker list addressed here)

This pass resolves the blockers identified in the Phase 3 Final Review. No commit, stage, or push was performed. The actual BNR API key is not present in any tracked file, test, log, or this report.

---

## 1. BNR Authentication Implementation

**Confirmed mechanism (founder-provided):** `X-API-KEY: <secret>` header on `https://fxrates.bnr.rw/ExchangeRate`.

**Implementation** (`src/lib/services/bnr-client.service.ts`):
- The configurable `none`/`header`/`query` auth abstraction was **removed** and replaced with a single explicit mechanism: `headers.set('X-API-KEY', resolveApiKey())`.
- `resolveApiKey()` reads `process.env.BNR_API_KEY` at request time and throws `BnrClientConfigurationError` if unset — missing auth fails closed, never silently sends an unauthenticated request.
- The key is **never** placed in the URL, never logged, never hardcoded.
- Verified live: an authenticated `GET /ExchangeRate` returned HTTP 200 with 57 currency records.

**Security incident handled during this pass:** the actual API key was found committed-able inside `.env.example` (a tracked file). It was removed and replaced with `BNR_API_KEY=""`. The real value now lives only in `.env` (gitignored). `git grep` confirms the key is absent from all tracked content.

## 2. Actual BNR Response Verification

An authenticated `GET /ExchangeRate` was executed against the live API. Verified facts:

- Response is a raw JSON array of records.
- Fields: `id`, `currency_name`, `buying_rate`, `average_rate`, `selling_rate`, `post_date`, `created_at` — all rates are **strings**.
- `currency_name` is already an **ISO 4217 code** (USD, EUR, GBP, KES, …). 57 currencies published. RWF is absent — it is always the counter currency.
- `post_date`/`created_at` use `YYYY/MM/DD` format (e.g. `2026/09/21`).
- USD: buying `1468.015`, average `1473.015`, selling `1478.015` (buying < average < selling — bank quote convention).
- EUR: average `1690.579316`.

The defensive `currency_name → ISO` map remains for full-name fallbacks, but BNR currently emits ISO codes directly.

## 3. Verified Quotation Direction

**Verified (not guessed):** BNR rates are **RWF per unit of the named foreign currency**.

Evidence: USD average `1473.015` matches the real-world USD→RWF market rate (~1473). If the rate were units-of-USD-per-RWF it would be ≈ 0.000679.

Consequences:
- Stored canonical pair: `fromCurrency = <foreign ISO>`, `toCurrency = 'RWF'`, `rate(USD→RWF) = 1473.015`.
- Foreign → RWF conversion: `amountMajor * rate` (multiplication).
- RWF → foreign: inverse lookup `1 / rate(foreign→RWF)` (division) — handled by the canonical service's reverse-pair logic.
- `BNR_QUOTATION_MODE` now defaults to `RWF_PER_UNIT_OF_CURRENCY` (verified default) while still accepting an explicit override; an unrecognized value throws rather than guessing.

## 4. Rate-Type Policy

Implemented `getRateTypeForOperation(operation)` in `currency-exchange.service.ts` with per-operation env overrides:

| Operation | Env var | Default |
|-----------|---------|---------|
| display | `FX_RATE_TYPE_DISPLAY` | AVERAGE |
| payment | `FX_RATE_TYPE_PAYMENT` | AVERAGE |
| refund | `FX_RATE_TYPE_REFUND` | AVERAGE |
| reporting | `FX_RATE_TYPE_REPORTING` | AVERAGE |

Both payment paths (`tap-and-leave.ts`, `payments/intouch/initiate.ts`) now call `getRateTypeForOperation('payment')` instead of hardcoding `'AVERAGE'`. `getRatesForBaseCurrency` defaults to the `display` policy.

**Remaining business decision (documented, not guessed):** whether payment checkout should legally/accountingly use BUYING or SELLING instead of AVERAGE. Set `FX_RATE_TYPE_PAYMENT` once accounting confirms. Until then AVERAGE is the explicit, auditable default.

## 5. Historical Rate Handling (Supersession)

The Phase 3 ingestion updated rows in place on corrected values — superseded by Phase 4:

- Schema: `CurrencyExchangeRate.revision Int @default(0)` added; unique key changed to `(source, sourceRecordId, fromCurrency, toCurrency, effectiveDate, revision)` so a corrected BNR record can coexist with its prior version.
- Ingestion behavior:
  - Identical re-ingest → update `fetchedAt` only (`skipped`).
  - Changed values → existing row marked `SUPERSEDED` (values frozen) and a **new row** inserted as `ACTIVE` with `revision + 1`. Nothing is overwritten.
- Rate lookup only ever selects `status = 'ACTIVE'` and orders by `effectiveDate`/`revision` desc, so the latest revision wins while history remains intact.
- Transactions also store a denormalized `exchangeRateValue`, so reconstruction is doubly safe even if the referenced snapshot row is superseded.

## 6. BNR Timeout

`fetchJson` now uses `AbortSignal.timeout(timeoutMs)` (default `30000`, override via `BNR_TIMEOUT_MS`). Abort/timeout errors throw `BnrTimeoutError`; network failures throw `BnrApiError` with status 0. Timeout events are logged with elapsed time — no secrets included.

## 7. Scheduler Integration

Wired into the **existing** Vercel cron infrastructure (no competing scheduler created):

- `vercel.json` → added `{ "path": "/api/cron/bnr-sync", "schedule": "30 6 * * *" }` (daily 06:30 UTC, after BNR's morning publication window and clear of the existing 05:00/06:00/07:00 slots) plus `maxDuration: 120` for the function.
- `src/pages/api/cron/bnr-sync.ts` rewritten to match the Guardian cron convention exactly: Bearer `CRON_SECRET` (fail-closed), GET-only, `BNR_SYNC_ENABLED` feature gate, `acquireCronLock('bnr-rate-sync', 180)`, structured `logger.child` logging, and lock release in `finally`.
- Ingestion is idempotent (dedupe + supersession), so retry and overlapping schedulers are safe.

## 8. Integration Tests

New file: `tests/unit/currency/bnr-integration.test.ts` — exercises the full pipeline with real BNR-derived values (`1473.015` etc.) and a mocked prisma layer:

- ingest real-shape BNR USD record → USD→RWF conversion produces `1473` RWF minor
- RWF→USD conversion through the same ingested rate (`1473015` RWF → `100000` USD cents)
- BUYING / SELLING / AVERAGE each return their own stored value (no silent collapse)
- re-ingesting identical data is idempotent (`skipped`, no new rows)
- a corrected BNR record produces a new ACTIVE revision and marks the old SUPERSEDED
- a transaction-referenced snapshot remains reconstructable after supersession

Client tests now additionally assert: `X-API-KEY` header is sent, the key never appears in the URL, missing `BNR_API_KEY` fails closed, `AbortSignal` is attached, and timeout produces `BnrTimeoutError`.

Ingestion tests updated for supersession and the verified default quotation mode, plus a mixed-batch test (valid records still ingest when a sibling record is rejected).

No real API key is required or referenced by any test.

## 9. Currency Conversion Verification

Using the real BNR value `USD→RWF average = 1473.015`:

- `convertMinorUnits(100, 'USD', 'RWF')` → `1473` (1 USD × 1473.015, rounded to 0 decimals) ✓
- `convertMinorUnits(1473015, 'RWF', 'USD')` → `100000` USD cents via inverse `1/1473.015` ✓
- ROUND_HALF_UP: `convertMinorUnits(100, 'RWF', 'USD')` at rate `0.000769` → `8` cents ✓
- Historical `asOf` lookup returns the correct effective-dated row ✓

## 10. Payment Safety

Verified in `tap-and-leave.ts` and `payments/intouch/initiate.ts`:

- `orderCurrency`/`orderAmountCents` and `paymentCurrency`/`paymentAmountCents` are separate persisted fields — `currency`/`amountCents` on the transaction now always describe the payment (RWF) denomination; no path writes `currency='USD'` with an RWF amount.
- Cross-currency conversion happens **before** `PaymentTransaction.create` and uses `getRateTypeForOperation('payment')` + `maxAgeHours=48` + `allowStale=false`; any FX failure returns 500 — fail-closed.
- `exchangeRateValue`, `exchangeRateType`, `exchangeRateSource`, `exchangeRateBaseCurrency`, `exchangeRateQuoteCurrency`, `exchangeRateEffectiveDate`, `exchangeRateRecordId`, `exchangeRateSnapshotId` all persisted.
- InTouch call signature, webhook behavior, and callbacks were not modified.
- **VAT=0 remains unchanged** in `intouch/initiate.ts` (`vatAmountCents: 0`, `exVatAmountCents: paymentAmountCents`). This is a pre-existing tax-config gap reported separately — out of scope for the currency workstream and intentionally left for a business decision.

## 11. Legacy FX Verification

- `src/lib/utils/currency.ts`: `EXCHANGE_RATES` is `{ RWF: 1 }` only; `convertFromRWF`/`convertToRWF`/`parseCurrencyInput` throw for non-RWF; `formatCurrency` displays RWF denomination only.
- `src/lib/services/currency-conversion.service.ts`: pure compatibility wrapper → canonical service; `getCachedRate` returns `null`.
- `src/lib/currency/exchange-rates.ts`: `fetchRates` → `getRatesForBaseCurrency` (canonical); `convert()` throws on missing rate.
- Grep across `src/`: zero matches for `api-ninjas`, `exchangerate.host`, `API_NINJAS_KEY`, `EXCHANGE_RATES_API_KEY`. Zero `fallbackRate`-style silent 1:1 in currency code.

## 12. Failure Safety

| Scenario | Behavior |
|----------|----------|
| BNR unavailable / network error | `BnrApiError` (status 0), logged |
| Timeout | `BnrTimeoutError` after `BNR_TIMEOUT_MS`, logged |
| HTTP 400/404/500 | `BnrApiError` with status |
| Non-JSON body | `BnrApiError` |
| Missing `BNR_API_KEY` | `BnrClientConfigurationError` before request |
| Invalid `BNR_QUOTATION_MODE` | `Error` before ingestion |
| Missing/stale/invalid rate | `ExchangeRateNotFoundError` / `ExchangeRateStaleError` / `ExchangeRateInvalidError` |
| Unsupported/inactive currency | `CurrencyValidationError` |
| Cross-currency payment, no rate | HTTP 500, no transaction amount corruption |
| Same currency | Identity 1:1 (the only legal 1:1) |

No silent 1:1 fallback exists anywhere.

## 13. Observability

Structured logging via the existing `logger.child({service})` convention:

- `bnr-client`: timeout (`warn`, elapsed/timeoutMs), HTTP error status (`warn`), network failure (`error`), non-JSON (`warn`)
- `bnr-ingestion`: start (`info`, query+mode), completion summary (`info`, fetched/inserted/updated/skipped/rejected), rejected-record detail (`warn`, truncated to 10 errors)
- `cron-bnr-sync`: unauthorized attempts (`warn`), lock-held skips (`info`), completion with duration/source (`info`), failure (`error`)

No API key, Authorization header, or sensitive payload is ever logged. No new observability platform introduced.

## 14. Environment Variables

`.env.example` now documents (names only, no secrets):

```
BNR_API_KEY=""
BNR_API_BASE_URL="https://fxrates.bnr.rw/ExchangeRate"
BNR_TIMEOUT_MS="30000"
BNR_QUOTATION_MODE="RWF_PER_UNIT_OF_CURRENCY"   # verified 2026-09-21
BNR_SYNC_ENABLED="false"
CRON_SECRET=""
FX_MAX_RATE_AGE_HOURS="168"
FX_MAX_PAYMENT_RATE_AGE_HOURS="48"
FX_RATE_TYPE_DISPLAY="AVERAGE"
FX_RATE_TYPE_PAYMENT="AVERAGE"
FX_RATE_TYPE_REFUND="AVERAGE"
FX_RATE_TYPE_REPORTING="AVERAGE"
```

Removed env vars (superseded by the simplified auth): `BNR_AUTH_MODE`, `BNR_AUTH_HEADER_NAME`, `BNR_AUTH_HEADER_VALUE`, `BNR_AUTH_QUERY_PARAM_NAME`, `BNR_AUTH_QUERY_PARAM_VALUE`.

## 15. Test Results

```
Currency suite (tests/unit/currency/):  7 suites, 56 tests — all pass
  currency-model.test.ts                 6
  fx-conversion.test.ts                 13
  bnr-client.test.ts                    12
  bnr-ingestion.test.ts                 11
  bnr-integration.test.ts                6   (new)
  tap-and-leave-fx.test.ts               3
  payment-currency-consistency.test.ts   4

Payment regression suite:               3 suites, 30 tests — all pass
Prisma validate:                        PASS
Prisma generate:                        PASS (client regenerated with revision field)
TypeScript (tsc --noEmit):              152 errors — all pre-existing in unrelated modules;
                                        zero errors in any Currency/BNR file (unchanged count)
Lint:                                   no ESLint config in project (not part of pipeline)
Production build:                       not run (same constraint as Phase 3)
```

## 16. Remaining Issues

1. **Rate-type business decision** — payments default to AVERAGE pending accounting confirmation; set `FX_RATE_TYPE_PAYMENT` to BUYING/SELLING if required.
2. **VAT=0 in `intouch/initiate.ts`** — pre-existing tax gap, unchanged, reported separately.
3. **Production build not executed** — `next build` not feasible in this environment; Phase 4 files are tsc-clean.
4. **Migration not yet applied** — apply `20260920130000_currency_bnr_phase3` + `20260921120000_currency_bnr_phase4` via `prisma migrate deploy` on a snapshot first.
5. **Cron goes live only when `BNR_SYNC_ENABLED=true` and `CRON_SECRET`/`BNR_API_KEY` are set** in the deployment environment.
6. **BNR currency map** — BNR currently emits ISO codes (57 currencies); the name map is a defensive fallback only.

## 17. Files Changed in Phase 4

Modified:
- `prisma/schema.prisma` (revision column, revised unique key)
- `src/lib/services/bnr-client.service.ts` (X-API-KEY auth, timeout, logging)
- `src/lib/services/bnr-rate-ingestion.service.ts` (supersession, verified direction, logging)
- `src/lib/services/currency-exchange.service.ts` (rate-type policy)
- `src/pages/api/cron/bnr-sync.ts` (Guardian-convention cron)
- `src/pages/api/checkout/tap-and-leave.ts` (policy rate type)
- `src/pages/api/payments/intouch/initiate.ts` (policy rate type)
- `vercel.json` (bnr-sync cron + maxDuration)
- `.env.example` (BNR config names only; secret removed)
- `tests/unit/currency/bnr-client.test.ts` (auth/timeout tests)
- `tests/unit/currency/bnr-ingestion.test.ts` (supersession/default-mode tests)
- `tests/unit/currency/tap-and-leave-fx.test.ts` (mock update)
- `tests/unit/currency/payment-currency-consistency.test.ts` (mock update)

New:
- `prisma/migrations/20260921120000_currency_bnr_phase4/migration.sql`
- `tests/unit/currency/bnr-integration.test.ts`
- `CURRENCY-BNR-PHASE-4-FINALIZATION.md`

## 18. Git Before/After State

Baseline (pre-Phase-4): 72 status lines. Delta introduced by Phase 4:
- `vercel.json` newly modified (was clean)
- `.env.example` — already modified pre-Phase-4 (user edit containing the key); Phase 4 replaced it with safe placeholders — **the file must be diff-checked before any commit to confirm the key is absent**
- `prisma/migrations/20260921120000_currency_bnr_phase4/` new
- `tests/unit/currency/bnr-integration.test.ts` new (inside the existing untracked `tests/unit/currency/` dir)
- All other Currency/BNR files were already modified/untracked from Phase 3

No unrelated files were touched. Nothing staged, committed, or pushed.

## 19. Proposed Logical Commit Groups

1. `currency-bnr-001` — schema + both migrations (`schema.prisma`, `migrations/2026…phase3/`, `migrations/2026…phase4/`)
2. `currency-bnr-002` — canonical service + BNR client + ingestion + policy (`currency-exchange.service.ts`, `bnr-client.service.ts`, `bnr-rate-ingestion.service.ts`)
3. `currency-bnr-003` — legacy wrappers (`currency-conversion.service.ts`, `exchange-rates.ts`, `utils/currency.ts`)
4. `currency-bnr-004` — payment/checkout wiring (`tap-and-leave.ts`, `intouch/initiate.ts`, `currency/rates.ts`, `currency/convert.ts`, `currency/default.ts`, `store/checkout.tsx`)
5. `currency-bnr-005` — cron + infra (`api/cron/bnr-sync.ts`, `vercel.json`, `.env.example`)
6. `currency-bnr-006` — tests (`tests/unit/currency/`)
7. `currency-bnr-007` — reports (`CURRENCY-BNR-PHASE-*.md`)

**Commit precondition:** verify `git diff .env.example` contains no secret before staging.

## Readiness Statement

Currency/BNR is **ready for controlled commit** pending two operational preconditions:

1. The `.env.example` diff must be reviewed before staging to confirm the secret is absent (it currently is).
2. Before enabling `BNR_SYNC_ENABLED=true` in production: apply both migrations on a database snapshot, set `BNR_API_KEY` and `CRON_SECRET` in the deployment environment.

Accounting should separately decide `FX_RATE_TYPE_PAYMENT` and the VAT=0 question in `intouch/initiate.ts`; neither blocks this workstream's commit.
