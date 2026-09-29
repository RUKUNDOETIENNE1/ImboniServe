# ImboniServe Currency & BNR — Phase 2
## Target Architecture + Migration Plan (Planning Only)

**Task type:** architecture + migration planning (no implementation)  
**Repository:** `C:\Dev\ImboniResto`  
**Reference audit:** `C:\Dev\ImboniResto\CURRENCY-BNR-PHASE-1-AUDIT.md`  
**Date:** 2026-09-20

---

## 1) Executive Summary

ImboniServe needs a **single, auditable currency architecture** centered on:

1. **Canonical currency identity** (ISO code, precision, status, usage scope).
2. **Canonical exchange-rate source** (BNR) with historical persistence.
3. **Separation of concerns** between display, order/transaction, payment-provider, and settlement currencies.
4. **Money-safe failure behavior** (no silent 1:1 fallback).
5. **Transaction-level FX traceability** so historical records can be reconstructed without recalculating from current rates.

Phase 1 established that currency behavior is fragmented, with conflicting rate tables and incomplete FX persistence. This plan defines a target model and staged migration path that preserves existing RWF-first behavior while enabling BNR-backed FX as the authoritative source.

---

## 2) Current-State Problems

From Phase 1 (treated as established facts):

- Multiple conflicting rate sources (`currency.ts`, `currency.service.ts`, `currency-conversion.service.ts`, `exchange-rates.ts`).
- DB-backed `currency-exchange.service.ts` exists but is effectively dead code.
- Silent 1:1 conversion fallback exists.
- Backend payment flows are effectively RWF-based.
- `PaymentTransaction` does not preserve structured FX context for historical reconstruction.
- Tap & Leave can store non-RWF `currency` while amount remains RWF-denominated.
- `/api/currency/default` is a no-op.
- No exchange-rate refresh cron.
- Dashboard/checkout display can relabel RWF amounts as non-RWF without conversion.
- `intouch/initiate.ts` hardcodes VAT=0.

Implication: current state is not safe for regulated or auditable multi-currency payment handling.

---

## 3) Target Currency Architecture

### 3.1 Guiding principles

- **Currency identity is explicit** at each money boundary.
- **No implicit conversion** in payment-critical paths.
- **BNR is authoritative FX source** for BNR-supported currencies (subject to unresolved BNR auth/operational confirmations).
- **Historical immutability**: once a transaction is completed, its FX context is frozen.
- **Fail closed** for payment-critical FX failures.

### 3.2 Currency domains (must be distinct)

- **Display Currency**: UX formatting only (user/session preference).
- **Order Currency**: currency in which cart/order/subtotal/tax/total are computed and persisted for commercial truth.
- **Payment Currency**: currency sent to payment provider for collection.
- **Settlement Currency**: currency in which provider settles to platform/business ledger.

These may differ legitimately (example):
- Customer sees USD (display),
- Order is priced in RWF (order),
- Provider charges RWF (payment),
- Provider settles RWF (settlement).

The architecture must persist all four where relevant.

---

## 4) Canonical Currency Model

### 4.1 Canonical entity (target)

Use `SupportedCurrency` (already in schema conceptually) as the canonical definition source:

- `code` (ISO 4217, PK, uppercase)
- `name`
- `symbol`
- `minorUnit` (decimal precision, e.g., RWF=0, USD=2)
- `isActive`
- `displayEnabled`
- `transactionEnabled`
- `providerSupport` (by provider and capability; modeled via relation/table or structured metadata)
- `countries` (optional, informational)
- `effectiveFrom`, `effectiveTo` (optional for historical changes in metadata)

### 4.2 Capability distinctions

Each currency must have explicit capability flags:

- **Display-supported** (can be shown in UI conversions).
- **Order-supported** (can be used for order pricing and tax).
- **Payment-supported** by provider (InTouch, IremboPay, etc.).
- **Settlement-supported** (currency accepted in ledger settlement logic).

### 4.3 Current-to-target policy

Immediate compatibility policy:

- Keep **RWF as mandatory transaction/payment baseline** unless provider contracts confirm other currencies.
- Permit non-RWF display where FX is available and fresh.
- Do not infer payment support from display support.

---

## 5) Canonical Exchange-Rate Model

BNR provides fields: `id`, `currency_name`, `average_rate`, `buying_rate`, `selling_rate`, `post_date`, `created_at` (strings for rates).

### 5.1 Two-layer model (recommended)

#### A) Raw ingestion table (verbatim source fidelity)
- `source` = `BNR`
- `sourceRecordId` (BNR `id`)
- `currencyNameRaw` (BNR `currency_name`)
- `averageRateRaw`, `buyingRateRaw`, `sellingRateRaw` (string)
- `postDateRaw`
- `createdAtRaw`
- `fetchedAt`
- `ingestionRunId`
- `rawPayload` (JSON)
- uniqueness key: (`source`, `sourceRecordId`) or (`source`,`currencyNameRaw`,`postDateRaw`) depending BNR guarantees.

#### B) Normalized FX table (application use)
- `baseCurrency` (ISO)
- `quoteCurrency` (ISO)
- `rateType` (`AVERAGE` | `BUYING` | `SELLING`)
- `rateValue` (`Decimal`, never float)
- `effectiveDate` (BNR publication date)
- `source` (`BNR`)
- `sourceRecordId`
- `fetchedAt`
- `status` (`ACTIVE`/`SUPERSEDED`/`INVALID`)
- uniqueness: (`baseCurrency`, `quoteCurrency`, `rateType`, `effectiveDate`, `source`)

This split allows strict source fidelity plus deterministic application usage.

### 5.2 Historical preservation

Never overwrite historical rows. Insert-by-date/version and supersede logically.

Transaction records should reference either:
- `exchangeRateSnapshotId` (preferred), or
- full copied rate fields (if denormalized for speed) plus source metadata.

---

## 6) Money Representation

### 6.1 Storage

- Store monetary amounts as **integer minor units** in DB for transactional entities (`amountMinor`, currently `amountCents` naming can be retained for backward compatibility).
- For currencies with minor unit 0 (RWF), minor-unit integer still works (1 minor unit = 1 major unit).

### 6.2 Calculation precision

- **No JS float** in authoritative money/FX calculations.
- Use decimal arithmetic library or DB decimal ops for FX multiplication/division.
- Keep exchange rates as `Decimal` parsed from BNR strings.

### 6.3 Rounding policy

Define explicit policy (single utility, reusable):

- Internal conversion intermediate precision: high (e.g., 12+ decimal places).
- Final persisted monetary values: rounded to target currency minor unit.
- Provider payload rounding: per provider contract.
- Recommended default: **ROUND_HALF_UP** unless accounting mandates otherwise.

### 6.4 Naming modernization (non-breaking plan)

Long term: prefer `amountMinor` terminology over `amountCents`.  
Near term: keep existing fields to avoid breaking code; document that `*Cents` means minor units.

---

## 7) Rate Direction

### 7.1 Canonical mathematical representation

Use explicit pair semantics:

`rate(base -> quote) = quoteUnitsPerOneBaseUnit`

Conversion formula:

`amountQuote = amountBase * rate(base -> quote)`

Reverse:

`rate(quote -> base) = 1 / rate(base -> quote)`

### 7.2 RWF/USD example

If canonical stored rate is:

`rate(USD -> RWF) = 1300.00`

Then:

- `100 USD -> RWF = 100 * 1300 = 130,000 RWF`
- `rate(RWF -> USD) = 1 / 1300 = 0.0007692307...`
- `65,000 RWF -> USD = 65,000 * 0.0007692307... = 50 USD`

### 7.3 BNR direction handling

Because BNR direction semantics are not fully confirmed in supplied docs, ingestion must:

1. Preserve raw fields exactly.
2. Normalize only with an explicit configured interpretation rule.
3. Block production conversion if direction mapping is unresolved.

---

## 8) Rate Types

BNR provides `average_rate`, `buying_rate`, `selling_rate`. The architecture must not hardcode one globally without policy.

### 8.1 Operation-to-rate-type mapping (target)

- **Display/analytics conversion**: likely `AVERAGE` (pending accounting approval).
- **Customer payment quote**: may require `SELLING` or `BUYING` depending legal/commercial interpretation of who is buying/selling FX.
- **Refund/reversal**: may require same captured transaction rate (not current market rate).
- **Settlement projections**: may use `AVERAGE`, but realized settlement should use provider actuals where available.

### 8.2 Required configurability

Introduce policy layer:

- `rateTypePolicy.display`
- `rateTypePolicy.checkout`
- `rateTypePolicy.refund`
- `rateTypePolicy.reporting`

Each policy references a rate type and fallback rules.

### 8.3 Required confirmations (blocking)

- Which BNR rate type is legally/accountingly correct for each operation.
- Whether one universal rate type is acceptable for pilot phase.
- Whether payment providers require a specific rate convention.

---

## 9) Payment Architecture

### 9.1 Canonical money chain

`Order (order currency)`  
→ `Tax/discount/total computed in order currency`  
→ `Payment intent in payment currency`  
→ `Provider collection`  
→ `Settlement in settlement currency`  
→ `Ledger + transaction snapshot`

### 9.2 Required transaction snapshot fields (target)

For each completed payment transaction, persist immutable fields:

- `orderAmountMinor`
- `orderCurrency`
- `paymentAmountMinor`
- `paymentCurrency`
- `settlementAmountMinor` (if known at completion or later update with versioning)
- `settlementCurrency`
- `exchangeRateSnapshotId` (or equivalent immutable copy)
- `exchangeRateBaseCurrency`
- `exchangeRateQuoteCurrency`
- `exchangeRateValue`
- `exchangeRateType`
- `exchangeRateSource` (`BNR`, provider, legacy)
- `exchangeRateEffectiveDate`
- `fxComputationTimestamp`
- `fxComputationVersion` (optional)

### 9.3 Provider compatibility policy (current reality)

- InTouch currently expects RWF major units.
- Until provider contracts confirm otherwise, set:
  - `paymentCurrency = RWF` for InTouch flows.
  - If order currency differs, conversion is required and must be persisted.

### 9.4 Tap & Leave target handling

Tap & Leave must stop expressing transaction currency ambiguously. Target behavior:

- Compute order totals in `orderCurrency`.
- Convert to provider `paymentCurrency` using selected BNR snapshot.
- Persist both amounts + FX metadata in structured fields.
- Ensure `paymentAmountMinor` denomination matches `paymentCurrency` exactly.

### 9.5 InTouch initiate target handling

Even if legacy path remains:

- Tax fields should be derived from canonical order/payment model (not hardcoded VAT=0).
- Currency-denomination consistency rules should be enforced before provider call.

---

## 10) Tax Architecture

### 10.1 Current behavior (documented)

- Most checkout pricing computes tax in RWF minor units using `Business.taxMode` + `taxRate`.
- One legacy path (`intouch/initiate.ts`) hardcodes VAT=0.

### 10.2 Target rule

Tax should be computed in **order currency** at order finalization time, then frozen.

Persist:

- `subtotalMinor`, `discountMinor`, `taxMinor`, `totalMinor`, all with `orderCurrency`.
- If payment currency differs, store converted payment-side equivalents:
  - `subtotalPaymentMinor`, `taxPaymentMinor`, `totalPaymentMinor` + FX snapshot reference.

### 10.3 Conversion sequence

Recommended sequence for multi-currency:

1. Compute subtotal/discount/tax/total in order currency.
2. Convert final payable components to payment currency using selected FX snapshot.
3. Round per payment currency minor units.
4. Persist both sides.

Never recalculate tax from converted totals after-the-fact for ledger truth.

---

## 11) BNR Integration Architecture

### 11.1 Components

1. **BNR Client**
   - Calls `GET /ExchangeRate` and `GET /ExchangeRate/{id}`.
   - Handles date filters for backfill (`start_date`, `end_date`).
2. **BNR Ingestion Service**
   - Parses/validates rate strings.
   - Writes raw ingest records + normalized records.
3. **FX Repository / Store**
   - Query latest valid rate by pair + type + effective date.
4. **FX Application Service (SSOT)**
   - All conversion requests go through this service only.
5. **Scheduler**
   - Periodic pull + retries + backfill jobs.
6. **Observability**
   - Metrics, logs, alerts, freshness dashboards.

### 11.2 Synchronization strategy

Because BNR publication cadence is not yet confirmed:

- Baseline plan: scheduled sync at least daily.
- Retry window on failure (e.g., bounded exponential retry).
- Keep prior valid rates for display analytics, but enforce stricter freshness for payment conversions.

### 11.3 Caching strategy

- L1: in-process cache with short TTL for hot lookups.
- L2: database snapshot as canonical persistent source.
- No direct provider/API calls in checkout hot path; checkout reads persisted DB rates.

### 11.4 API failure behavior

- On BNR failure:
  - Ingestion job fails and alerts.
  - Existing valid rates remain queryable if within policy freshness window.
- For payment-critical conversion:
  - If no policy-compliant rate available, block conversion-required payment initiation.

### 11.5 Duplicate prevention & idempotency

- Ingestion idempotency key based on source identifiers (`source`, `sourceRecordId`, date/rateType as needed).
- Upsert semantics should not overwrite historical data; only append/new-version.

### 11.6 Observability

Minimum metrics:

- `bnr_sync_success_total`
- `bnr_sync_failure_total`
- `bnr_sync_latency_ms`
- `fx_rate_age_hours{pair,rateType}`
- `fx_conversion_failure_total{reason}`
- `payments_blocked_fx_total`

---

## 12) Failure-Safety Model

### 12.1 Hard rules

- **No silent 1:1 fallback** for unknown/missing rates in any payment-critical path.
- **No implicit currency relabeling** (amount and currency must always match denomination).
- **No conversion without explicit rate snapshot**.

### 12.2 Failure cases and policy

1. **BNR unavailable**
   - Ingestion: retry + alert.
   - Runtime conversion:
     - Display/reporting may use last-known-valid within freshness threshold.
     - Payment-critical conversion fails closed if stale/missing.

2. **Stale rate**
   - Rate age policy per operation (display vs payment).
   - Payment operation blocked when exceeding allowed age.

3. **Missing currency pair**
   - Reject conversion-required operation; prompt supported-currency fallback.

4. **Malformed rate**
   - Reject ingestion row; record validation error; do not publish normalized entry.

5. **Unsupported currency**
   - Validate against capability matrix before order/payment.

6. **Provider currency mismatch**
   - Preflight validation before provider call.
   - Persist mismatch error and fail initiation.

---

## 13) Historical Data Strategy

### 13.1 Principles

- Do not fabricate historical FX data.
- Preserve existing records exactly.
- Add provenance tags for migrated interpretations.

### 13.2 Existing data categories

1. **Legacy RWF transactions**
   - Treat as reliable RWF-denominated records.
   - No backfilled FX required.

2. **Legacy records with non-RWF `currency` but RWF-like amounts**
   - Mark as `legacy_currency_label_inconsistent`.
   - Do not infer exchange rate.
   - Keep for audit with explicit migration note.

3. **Tap & Leave records with `rawRequest.fxRateRwfPerUnit`**
   - Extract as optional legacy evidence into structured migration columns/side table.
   - Mark provenance as `legacy_raw_request_unverified`.
   - Do not treat as BNR-authoritative.

### 13.3 Orders/invoices/receipts/analytics

- Orders/Sales lacking currency column remain legacy; infer via business-at-time only if provable.
- Invoices/receipts should retain original rendered values; do not retroactively recompute from current FX.
- Analytics should segment:
  - legacy-unreconstructable vs
  - post-migration fully-traceable FX transactions.

---

## 14) Migration/Deprecation Strategy

### 14.1 Single Source of Truth targets

- **Currency definitions SSOT**: `SupportedCurrency` (DB).
- **FX rates SSOT**: normalized BNR-backed rate store (DB).
- **Conversion SSOT**: one FX service (evolution of `currency-exchange.service.ts`).
- **Transaction FX SSOT**: structured fields on transaction/ledger records.

### 14.2 Existing modules disposition plan

1. `src/lib/utils/currency.ts`
   - Keep temporarily for UI compatibility.
   - Remove hardcoded rates usage; route formatting and conversion calls to SSOT service adapters.
2. `src/lib/services/currency.service.ts`
   - Legacy compatibility only; deprecate fully after callers removed.
3. `src/lib/services/currency-conversion.service.ts`
   - Remove from runtime conversion.
   - Optional emergency/manual admin-only backfill tool if governance permits.
4. `src/lib/currency/exchange-rates.ts`
   - Retire as runtime rate source after BNR integration.
5. `src/lib/services/currency-exchange.service.ts`
   - Promote to canonical runtime service (or replace with new `fx.service.ts` and deprecate old wrapper).

### 14.3 Backward compatibility

- Introduce compatibility layer so existing callers continue functioning during phased rollout.
- Feature flag conversion path per domain (display first, then checkout, then provider integration).
- Keep legacy endpoints alive temporarily with clear deprecation warnings.

---

## 15) Target Architecture Diagram

```text
                    +-------------------------------+
                    |  BNR Exchange Rate API        |
                    |  /ExchangeRate                |
                    |  /ExchangeRate/{id}           |
                    +---------------+---------------+
                                    |
                                    v
                    +-------------------------------+
                    |  BNR Rate Ingestion Service   |
                    |  - fetch/validate             |
                    |  - idempotent upsert          |
                    +---------------+---------------+
                                    |
                +-------------------+-------------------+
                |                                       |
                v                                       v
   +-------------------------------+      +-------------------------------+
   | Raw BNR Rate Store            |      | Normalized FX Rate Store      |
   | (verbatim source payload)     |      | (base, quote, type, value,    |
   | sourceRecordId, raw strings   |      |  effectiveDate, source, status)|
   +-------------------------------+      +---------------+---------------+
                                                          |
                                                          v
                                        +-------------------------------+
                                        | Canonical Currency/FX Service |
                                        | - currency capabilities       |
                                        | - conversion + rounding       |
                                        | - freshness/failure policy    |
                                        +---------------+---------------+
                                                        |
                    +-----------------------------------+-----------------------------------+
                    |                                   |                                   |
                    v                                   v                                   v
         +---------------------+             +---------------------+              +----------------------+
         | Order / Checkout    |             | Payment Orchestration|             | Dashboards/Analytics |
         | (order currency)    |             | (payment currency)   |             | (display currency)   |
         +----------+----------+             +----------+----------+              +----------------------+
                    |                                   |
                    v                                   v
         +---------------------+             +----------------------+
         | Payment Provider    |             | Transaction Ledger   |
         | (InTouch/Irembo)    |             | (order+payment+FX    |
         | provider currency    |             | snapshot immutable)  |
         +---------------------+             +----------------------+
```

---

## 16) Implementation Phases

> Planning only. No implementation performed in this phase.

### Phase A — Data model design (currency + FX + transaction snapshot)
- **Likely files:** `prisma/schema.prisma`, migration files (future), model docs.
- **DB changes:** add/extend currency capability model; add FX snapshot model; add structured FX fields to payment transaction/ledger.
- **Risks:** schema bloat; migration complexity.
- **Dependencies:** finalized direction + rate-type policy.
- **Tests required:** schema migration tests, backward compatibility reads.

### Phase B — BNR client + contract validation
- **Likely files:** new `src/lib/integrations/bnr/*`, env validation modules.
- **DB changes:** none yet.
- **Risks:** unknown auth/header format; undocumented API behavior.
- **Dependencies:** BNR credential mechanism confirmation from Founder email/account docs.
- **Tests required:** client contract tests, error handling for 400/404/500.

### Phase C — BNR ingestion + normalization pipeline
- **Likely files:** new ingestion service, scheduler hooks in `src/lib/cron.ts`.
- **DB changes:** raw + normalized rate tables if separate; indexes for pair/date/type.
- **Risks:** duplicate ingestion, malformed source rows.
- **Dependencies:** Phase A, Phase B.
- **Tests required:** idempotency, duplicate prevention, normalization direction tests.

### Phase D — Canonical currency/FX service
- **Likely files:** `src/lib/services/currency-exchange.service.ts` (or replacement), shared money/rounding utility.
- **DB changes:** none (uses Phase A schema).
- **Risks:** hidden callers still using legacy modules.
- **Dependencies:** Phase C data availability.
- **Tests required:** conversion math, rounding, freshness policy, failure-closed behavior.

### Phase E — Read-only display migration
- **Likely files:** `CurrencyDisplay.tsx`, `LocaleContext.tsx`, dashboard formatters.
- **DB changes:** none.
- **Risks:** UX regressions; performance.
- **Dependencies:** Phase D.
- **Tests required:** UI snapshot tests, conversion correctness tests.

### Phase F — Order/checkout integration
- **Likely files:** `qr-order.service.ts`, `public/order/draft.ts`, checkout endpoints, order APIs.
- **DB changes:** persist order currency context and FX snapshot linkage where needed.
- **Risks:** cart/checkout total drift.
- **Dependencies:** Phase D policy stable.
- **Tests required:** end-to-end menu→cart→order totals across currencies.

### Phase G — Payment integration (InTouch, Tap & Leave, IremboPay)
- **Likely files:** `tap-and-leave.ts`, `payments/intouch/initiate.ts`, providers, webhook reconciliation, payment completion service.
- **DB changes:** transaction snapshot fields populated at payment initiation/completion.
- **Risks:** payment failures, mismatch with provider denomination.
- **Dependencies:** Phase F, provider currency contract confirmations.
- **Tests required:** payment denomination invariants, provider preflight mismatch tests, webhook consistency tests.

### Phase H — Tax and ledger harmonization
- **Likely files:** tax calculation services, billing ledger, receipt generation.
- **DB changes:** optional tax-per-currency detail fields.
- **Risks:** accounting regressions.
- **Dependencies:** Phase F/G canonical fields.
- **Tests required:** tax before/after conversion integrity, ledger reconciliation tests.

### Phase I — Historical migration + provenance labeling
- **Likely files:** migration scripts/jobs (one-off), analytics adapters.
- **DB changes:** provenance flags/status fields for legacy records.
- **Risks:** false certainty from inferred FX.
- **Dependencies:** Phase A schema + agreed migration rules.
- **Tests required:** migration dry-run validation, no-fabrication assertions.

### Phase J — Legacy source deprecation/removal
- **Likely files:** `currency.ts`, `currency.service.ts`, `currency-conversion.service.ts`, `exchange-rates.ts`, API endpoints relying on them.
- **DB changes:** none.
- **Risks:** breaking hidden callsites.
- **Dependencies:** all prior phases complete and monitored.
- **Tests required:** no-legacy-caller static checks, regression suite, canary rollout checks.

---

## 17) Testing Strategy

### 17.1 Unit tests

- Currency capability validation.
- Rate direction math and inverse rate derivation.
- Decimal parsing from BNR string rates.
- Rounding by currency precision.
- Failure-closed policies (missing/stale/malformed rate).

### 17.2 Integration tests

- BNR ingestion idempotency and duplicate handling.
- FX service latest-rate selection by effective date and rate type.
- Order pricing + tax + conversion consistency.
- Payment initiation denomination invariants.
- Webhook/ledger reconciliation with structured FX snapshot.

### 17.3 End-to-end tests

- Menu price → cart → order → payment → receipt with non-default display currency.
- Tap & Leave conversion path with explicit FX snapshot.
- Dashboard/analytics rendering uses converted display values, not relabeled RWF.

### 17.4 Data migration tests

- Legacy RWF records remain unchanged.
- Legacy inconsistent non-RWF labels are flagged, not silently “corrected.”
- No fabricated exchange-rate injection.

### 17.5 Operational tests

- Scheduler retry behavior.
- Alerting on stale/missing BNR rates.
- Controlled failover behavior (display-only allowed vs payment blocked).

---

## 18) Open Questions Requiring Confirmation

### 18.1 BNR/API operational unknowns (blocking)

1. Exact authentication mechanism and header/query format.
2. Whether auth is required for every request.
3. Rate limits and throttling policy.
4. Recommended polling/sync frequency.
5. Publication schedule and timezone semantics.
6. Response pagination behavior.
7. Error body format for 400/404/500.
8. Meaning/format of `currency_name` (ISO code or full label).
9. Exact mathematical direction of provided rates.
10. Whether BNR should be sole FX source or if documented fallback is required by policy.

### 18.2 Business/accounting policy unknowns

1. Which BNR rate type is approved for each operation:
   - display,
   - checkout quote,
   - provider conversion,
   - refund,
   - reporting.
2. Maximum acceptable rate staleness for:
   - display/reporting,
   - payment-critical operations.
3. Rounding policy approval (ROUND_HALF_UP vs alternatives).
4. Whether non-RWF transaction currency is required in near-term production.

### 18.3 Provider contract unknowns

1. InTouch supported currencies in production contract (currently treated as RWF).
2. IremboPay supported currency set and denomination requirements.
3. Settlement currency behavior per provider and callback payload guarantees.

---

## Safety / Scope Confirmation (Phase 2 Planning)

- No source code changes were made.
- No Prisma schema changes were made.
- No migrations were created.
- No environment variable files were modified.
- No API key was added.
- No payment logic was modified.
- No checkout/Tap & Leave/InTouch code was modified.
- No files were staged.
- No commits were created.
- No pushes were performed.
