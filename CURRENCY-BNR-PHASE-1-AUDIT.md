# ImboniServe Currency & BNR Integration — Phase 1 Audit

**Audit type:** Discovery / read-only (no code, schema, env, or git changes)
**Date:** 2026-09-20
**Repository:** `C:\Dev\ImboniResto`
**Branch:** `main`
**HEAD at audit start:** `7bcd1db0b2050054c27bba597296741c334122af`
**Working-tree state:** Uncommitted branding/locale/test changes (NOT touched by this audit)

---

## 1. Executive Summary

ImboniServe has a **fragmented, partially-implemented currency system** with at least **four independent currency modules** that disagree on supported currencies, exchange rates, decimal precision, and source of truth. The database schema defines `CurrencyExchangeRate` and `SupportedCurrency` tables, but **no application code reads or writes those tables** — they are dead schema.

All monetary amounts are stored as integer **cents** (`*Cents` fields, Prisma `Int`), which is good for precision. RWF is the de-facto base currency and the only currency actually supported end-to-end by the payment providers (InTouch, IremboPay, MTN MoMo). Non-RWF business currencies exist as a `Business.currency` string field but are **only used for display labels and transaction-record metadata** — no real multi-currency settlement, conversion-at-payment, or FX-rate preservation exists in the transaction record.

**There is no BNR integration, no BNR API key, and no BNR references anywhere in the repository.** The supplied BNR documentation cannot be consumed by any current code path without new integration work.

The most material risk: **the Tap & Leave checkout (`/api/checkout/tap-and-leave.ts`) performs a live FX conversion from business currency to RWF before calling InTouch, stores the business currency on the `PaymentTransaction`, but does NOT persist the exchange rate, the rate source, or the rate timestamp.** A completed transaction therefore cannot be reconstructed to show what rate was applied at payment time.

---

## 2. Current Currency Architecture

### 2.1 Four competing currency modules

| # | File | Status | Rates source | Used by |
|---|------|--------|--------------|---------|
| 1 | `src/lib/utils/currency.ts` | Marked DEPRECATED | Hardcoded `EXCHANGE_RATES` (7 pairs) | `CurrencyDisplay.tsx`, `LocaleContext`, order page, checkout |
| 2 | `src/lib/services/currency.service.ts` | Marked DEPRECATED | Hardcoded `rates` map (10 pairs, different values) | `ebm-formatter.ts` (EBM receipts) |
| 3 | `src/lib/services/currency-exchange.service.ts` | Declared "SINGLE SOURCE OF TRUTH" | DB `CurrencyExchangeRate` table → fallback to module #1's hardcoded rates | **No callers found in source** (orphaned) |
| 4 | `src/lib/services/currency-conversion.service.ts` | Marked DEPRECATED for runtime | External API Ninjas (`api.api-ninjas.com`) → hardcoded fallback (6 pairs, different values) | `tap-and-leave.ts`, `/api/currency/convert` |
| 5 | `src/lib/currency/exchange-rates.ts` | Active | External `api.exchangerate.host` → hardcoded fallback (different values again) | `/api/currency/rates` |

**Five** modules, **five** different sets of hardcoded rates, **two** different external APIs, and a DB-backed service that nothing calls. The "single source of truth" service (`currency-exchange.service.ts`) is effectively dead code.

### 2.2 Country defaults

`src/lib/utils/country-config.ts` defines `COUNTRY_DEFAULTS` for 27 countries (currency, timezone, taxRate, taxMode). Used at signup to initialize a new business. This is the only place where currency is derived from geography. It is a **defaults seed**, not a runtime conversion source.

### 2.3 Frontend currency context

`src/contexts/LocaleContext.tsx` — `LocaleProvider` holds `currency` in React state, persisted to `localStorage` (`imboni_currency`). For authenticated users it fetches `Business.currency` via `/api/business/{id}/settings`. For anonymous users it calls `detectCurrencyFromLocale()` from module #1.

`useCurrency()` hook returns `{ currency, setCurrency }`. `setCurrency` PUTs to business settings — so the **display currency is user-mutable and persists to the business record**.

### 2.4 Display components

- `src/components/CurrencyDisplay.tsx` — uses `formatCurrency`/`formatCurrencyFromCents` from module #1 (deprecated, hardcoded rates). Treats input as RWF and converts to the context currency for display only.
- `src/components/CurrencySelector.tsx`, `src/components/CurrencyRatesWidget.tsx` — exist (not deeply inspected; UI-only).
- `src/pages/dashboard/currency-settings.tsx` — admin UI with **hardcoded initial state** of only 3 currencies (RWF/USD/EUR) with hardcoded rates `0.00077`/`0.00071`; calls `/api/currency/rates` which returns module #5 data. The "Set as Default" button calls `/api/currency/default` which is a **stub** (`return res.status(200).json({ success: true, defaultCurrency: code })` — does NOT actually update the business).

### 2.5 API endpoints

| Endpoint | Module | Purpose |
|----------|--------|---------|
| `GET /api/currency/rates` | #5 (`exchange-rates.ts`) | Returns rates for a base currency (exchangerate.host or fallback) |
| `GET /api/currency/convert` | #4 (`currency-conversion.service.ts`) | Converts RWF amount to target currency (API Ninjas or fallback) |
| `POST /api/currency/default` | stub | **No-op** — returns success without persisting |

### 2.6 Scheduled jobs / cron

`src/lib/cron.ts` was inspected for exchange-rate refresh jobs. **None exist.** No cron task updates `CurrencyExchangeRate` rows, calls any FX API, or refreshes fallback rates. The DB-backed rates, if ever populated, will go stale indefinitely.

---

## 3. Current Supported Currencies

### 3.1 Module #1 — `src/lib/utils/currency.ts` (`SUPPORTED_CURRENCIES`)

| ISO | Name | Symbol | Decimals | Symbol pos |
|-----|------|--------|----------|------------|
| RWF | Rwandan Franc | FRw | 0 | after |
| USD | US Dollar | $ | 2 | before |
| EUR | Euro | € | 2 | before |
| GBP | British Pound | £ | 2 | before |
| KES | Kenyan Shilling | KSh | 2 | before |
| TZS | Tanzanian Shilling | TSh | 0 | before |
| UGX | Ugandan Shilling | USh | 0 | before |

### 3.2 Module #2 — `src/lib/services/currency.service.ts` (`SUPPORTED_CURRENCIES`)

15 currencies: RWF, USD, EUR, GBP, KES, UGX, TZS, ZAR, NGN, GHS, XOF, XAF, MAD, EGP, AED. **Different symbol for RWF** (`RWF` here vs `FRw` in module #1). **Different decimal for KES** (2 here vs 2 in #1 — same; but UGX/TZS decimals differ in spirit across modules).

### 3.3 Module #3 (DB-backed, orphaned) — `prisma/schema.prisma` `SupportedCurrency`

Schema only; no seed in Prisma migrations. The Supabase SQL migration (`SUPABASE_MIGRATION_GLOBAL_CURRENCY_TIMEZONE.sql`) seeds 7 currencies (RWF, USD, EUR, GBP, KES, TZS, UGX) with RWF symbol `FRw`, KES decimals 2.

### 3.4 Country defaults — `src/lib/utils/country-config.ts`

27 country→currency mappings including ZAR, NGN, GHS, EGP, MAD, GBP, EUR (×6), USD, CAD, AED, SAR, QAR, INR, CNY, JPY, AUD, BRL, MXN. These are **signup defaults only**; they do not imply runtime conversion support.

### 3.5 Backend-true support

- **RWF**: fully supported end-to-end (storage, payment providers, receipts, dashboards).
- **USD, EUR, GBP, KES, TZS, UGX**: display-only via deprecated hardcoded rates. No payment provider actually transacts in these. The `PaymentTransaction.currency` field can hold any string (defaults to `RWF`), but providers always receive RWF.
- **All others** (ZAR, NGN, GHS, XOF, XAF, MAD, EGP, AED, CAD, SAR, QAR, INR, CNY, JPY, AUD, BRL, MXN): appear only in country-config defaults. No conversion table, no display formatter, no provider support.

### 3.6 Payment-provider support

- **InTouch** (primary): RWF only. `intouch.service.ts` sends `amount` as a plain number (RWF units, no currency field). Webhook handler hardcodes `currency: 'RWF'` in `intouch.provider.ts` line 275.
- **IremboPay** (cards): passes `request.currency` through to the API, but `IREMBOPAY_PAYMENT_ACCOUNT` env example is `LOYALTECH-RWF`, and `createInvoice` divides `amountCents / 100` assuming RWF (no decimal scaling by currency). Effectively RWF.
- **MTN MoMo** (deprecated direct): `MTN_MOMO_CURRENCY` env defaults to `RWF`; `requestToPay` sends `params.currency || this.CURRENCY`.

---

## 4. Currency Data Flow

### 4.1 Storage convention

All monetary amounts are stored as **integer cents** in Prisma `Int` fields named `*Cents` (e.g., `priceCents`, `totalAmountCents`, `amountCents`, `vatCents`, `subtotalCents`). This is consistent across the schema. RWF has 0 decimals, so "cents" is a misnomer for RWF — it is effectively whole-RWF × 100. No `Decimal`/`Float`/`String` is used for transactional money (with the exception of `MarketerCommission` which uses `Float` for `grossAmount`/`commissionAmount` etc. — a separate inconsistency).

### 4.2 Menu → Cart → Order → Total

1. **Menu price**: `MenuItem.priceCents` (Int, RWF cents). Set by business. No currency field on `MenuItem` — inherits business currency implicitly.
2. **Cart** (`src/pages/order/index.tsx`): `cartTotalCents = sum(priceCents × quantity)`. Pure integer math, no conversion. Displayed via `<CurrencyDisplay amount={...} inCents />` which converts RWF→context currency for display only.
3. **Order draft** (`/api/public/order/draft.ts` → `qr-order.service.ts` `calculateOrderPricing`): server-side pricing from `MenuItem.priceCents`. Computes `subtotalCents`, `vatCents`, `totalCents`, `depositCents` — all in RWF cents. Tax mode (INCLUSIVE/EXCLUSIVE) and rate come from `Business.taxMode`/`Business.taxRate`. **No currency conversion in this path.**
4. **Sale record**: `Sale.totalAmountCents` (Int). `Sale` has **no currency field** — currency is implicit (business currency).

### 4.3 Tax

- `Business.taxMode` (enum `TaxMode`: INCLUSIVE | EXCLUSIVE, default EXCLUSIVE) and `Business.taxRate` (Float, default 18.0).
- `TaxConfiguration` model exists for multiple tax types (VAT, TOURISM_LEVY, SALES_TAX, CITY_TAX) but the checkout path only uses `Business.taxRate`/`taxMode` — `TaxConfiguration` is not consulted by `calculateOrderPricing`.
- VAT is computed in RWF cents on the RWF subtotal. No cross-currency tax computation exists.

### 4.4 Display vs transaction currency

- **Display currency** = `LocaleContext.currency` (user/business preference, mutable, persisted to localStorage + business settings).
- **Transaction currency** = RWF (always, in practice).
- `CurrencyDisplay` converts RWF→display currency using module #1's hardcoded rates **on the client**. The backend never sees the display currency.

---

## 5. Payment / Currency Data Flow

### 5.1 PaymentTransaction model (`prisma/schema.prisma` lines 1403–1457)

Key fields:
- `amountCents Int` — amount charged
- `currency String @default("RWF")` — currency code (string, no FK)
- `vatAmountCents Int`, `exVatAmountCents Int`
- `gatewayFeeEstimatedCents Int`, `gatewayFeeActualCents Int?`
- `platformFeeCents Int @default(0)`
- `netToBusinessCents Int`
- `rawRequest Json?`, `rawCallback Json?`, `rawStatus Json?`

**Missing**: no `originalAmountCents`, no `originalCurrency`, no `convertedAmountCents`, no `convertedCurrency`, no `exchangeRate`, no `exchangeRateDate`, no `exchangeRateSource`. The transaction record cannot reconstruct a cross-currency payment.

### 5.2 Flow A — QR order via IremboPay (`/api/public/order/draft.ts`)

1. `calculateOrderPricing` → RWF cents.
2. `PaymentTransaction.create` with `amountCents = amountToCharge` (RWF cents), `currency = business.currency` (could be non-RWF string but amount is RWF cents).
3. If `paymentMethod === 'WEB'`: `IremboPayService.createInvoice({ amountCents })` → `unitAmount = amountCents / 100` (assumes RWF). No currency passed to IremboPay here.
4. Webhook (separate IremboPay webhook, not inspected in depth) updates status.
5. `PaymentCompletionService.onPaymentSuccess` → creates `FinancialLedgerEntry` copying `tx.currency` and `tx.amountCents`.

**Currency assumption**: RWF throughout. If `business.currency` is "USD", the `PaymentTransaction.currency` field says "USD" but `amountCents` is RWF cents and IremboPay is called with RWF units — **silent mismatch**.

### 5.3 Flow B — Marketplace order (`/api/marketplace/orders/pay.ts`)

1. `PaymentTransaction.create` with `amountCents = order.totalAmountCents`, `currency = order.business.currency`.
2. `provider.createPayment({ amount: order.totalAmountCents, currency: order.business.currency, ... })`.
3. InTouch provider: `amount = Math.round(request.amount / 100)` (RWF units), **ignores `request.currency`**, sends to InTouch (RWF only).
4. IremboPay provider: passes `currency: request.currency` in payload, but `amount = request.amount / 100` (assumes RWF decimals).

**Currency assumption**: amount is always RWF cents; `currency` field is cosmetic metadata passed to IremboPay but not honored for decimal scaling.

### 5.4 Flow C — Tap & Leave (`/api/checkout/tap-and-leave.ts`) — THE CRITICAL PATH

1. `finalAmount` from dining slip (RWF cents).
2. `paymentFee`, `tipCents` added → `totalAmount` (RWF cents).
3. `business.currency` fetched.
4. **If `businessCurrency !== 'RWF'`:**
   - `totalInBusinessUnits = totalAmount / 100` (RWF units)
   - `totalRwfUnits = await convertToRWF(totalInBusinessUnits, businessCurrency)` — uses module #4 (API Ninjas or fallback)
   - `fxRateRwfPerUnit = 1 / rate`
   - `amountRwfCents = Math.round(totalRwfUnits * 100)`
5. `PaymentTransaction.create`:
   - `amountCents = amountRwfCents` (converted RWF cents)
   - `currency = businessCurrency` (e.g., "USD") — **mismatched with amountCents which is RWF**
   - `netToBusinessCents = finalAmount` (original RWF cents, not converted)
   - `rawRequest` stores `originalAmount`, `originalCurrency`, `fxRateRwfPerUnit`, `paymentFee`, etc. as JSON.
6. `InTouchService.requestPayment({ amount: amountRwf })` — RWF units to InTouch.

**Critical issues:**
- `amountCents` is RWF cents but `currency` is the business currency → the record is internally inconsistent.
- `netToBusinessCents = finalAmount` (pre-conversion RWF cents) while `amountCents` is post-conversion RWF cents → fee/net math is broken for non-RWF.
- The exchange rate is only in `rawRequest` JSON, not in queryable columns. No rate date, no rate source, no rate ID.
- `convertToRWF` from module #4 may silently return `1` (no conversion) if API Ninjas fails and no fallback exists for that pair — **silent 1:1 fallback**.

### 5.5 Flow D — Direct InTouch initiate (`/api/payments/intouch/initiate.ts`)

1. `amount` (RWF units) from request body.
2. `paymentFee = amount * 0.05`, `totalAmount = amount + paymentFee`.
3. `PaymentTransaction.create` with `amountCents = totalAmount * 100`, `currency = business?.currency || 'RWF'`.
4. `InTouchService.requestPayment({ amount: totalAmount })` — RWF units.

**Issue**: `amount` is treated as RWF units and multiplied by 100 for cents, but if `business.currency` is non-RWF, the `currency` field is wrong. Also `vatAmountCents: 0` and `exVatAmountCents: totalAmount * 100` — VAT is hardcoded to 0, ignoring business tax config.

### 5.6 Flow E — Manual confirmation (`/api/orders/[id]/confirm-payment.ts`)

No currency logic. Delegates to `PaymentCompletionService`. Amounts already in `Sale.totalAmountCents`.

### 5.7 Webhook handling (`/api/webhooks/intouch.ts`)

- Validates `sale.totalAmountCents === transaction.amountCents` (RWF cents vs RWF cents). For Tap & Leave, `transaction.amountCents` is the converted RWF amount while `sale.totalAmountCents` is the original — **this validation would fail for non-RWF Tap & Leave**, but Tap & Leave sales don't have a linked `Sale` (they use slip), so this branch is skipped.
- Webhook payload `amount` is `undefined` (InTouch doesn't return amount). Currency hardcoded `RWF` in provider.
- No currency reconciliation against provider.

### 5.8 Financial ledger (`PaymentCompletionService` → `FinancialLedgerEntry`)

Copies `tx.amountCents`, `tx.currency`, `tx.vatAmountCents`, `tx.exVatAmountCents`, fees, `netAmountCents` from the `PaymentTransaction`. For CASH sales with no `PaymentTransaction`, uses `sale.business?.currency || 'RWF'` and `sale.totalAmountCents`. **No conversion, no rate preservation.**

### 5.9 Receipts / EBM (`src/lib/pricing/ebm-formatter.ts`)

- Uses module #2 (`CurrencyService.formatAmount`) for receipt text.
- `formatEBMReceipt` accepts a `currency` param defaulting to `RWF` and `vatRate` defaulting to 18.0.
- EBM JSON output has no currency field — assumes RWF.
- Rwanda RRA EBM compliance is RWF-only by design.

### 5.10 Dashboards / analytics

- `src/pages/dashboard/cfo.tsx`: uses `useCurrency()` and `Intl.NumberFormat('en', { style: 'currency', currency })` — **browser-side formatting only**, no conversion. If `currency` is "USD", it formats the RWF-cent-derived number as USD without conversion → **wrong display value**.
- `src/pages/order/index.tsx` line 1088: hardcodes `"RWF"` string literal while using `<CurrencyDisplay>` everywhere else → inconsistent.
- `src/pages/store/checkout.tsx`: uses `useCurrency()` and displays `{(totalCents / 100).toLocaleString()} {currency}` — **divides RWF cents by 100 and labels with display currency** → wrong for non-RWF.

---

## 6. Existing Exchange-Rate Implementation

### 6.1 Sources (all current)

| Source | Type | Where | Freshness | Persistence |
|--------|------|-------|-----------|-------------|
| Hardcoded `EXCHANGE_RATES` (7 pairs) | Static | `src/lib/utils/currency.ts` | Never updates | None |
| Hardcoded `rates` (10 pairs) | Static | `src/lib/services/currency.service.ts` | Never updates | None |
| Hardcoded `FALLBACK_RATES` (6 pairs) | Static | `src/lib/services/currency-conversion.service.ts` | Never updates | None |
| Hardcoded `FALLBACK_RATES` (3 bases × 4 pairs) | Static | `src/lib/currency/exchange-rates.ts` | Never updates | None |
| `CurrencyExchangeRate` DB table | DB | `prisma/schema.prisma` | **Never populated by any code** | DB (if seeded by SQL) |
| API Ninjas (`api.api-ninjas.com/v1/convertcurrency`) | External API | `currency-conversion.service.ts` | 6h cache | In-memory only |
| exchangerate.host (`api.exchangerate.host/latest`) | External API | `currency/exchange-rates.ts` | 6h cache | In-memory only |

### 6.2 DB-backed service (`currency-exchange.service.ts`)

- Declared "SINGLE SOURCE OF TRUTH" in its header comment.
- `getExchangeRate` queries `prisma.currencyExchangeRate.findFirst` → falls back to module #1 hardcoded rates.
- `updateExchangeRates` exists to write rows, but **no caller invokes it** — no cron, no admin endpoint, no manual flow.
- **This service is dead code.** No file imports it.

### 6.3 External API authentication

- API Ninjas: `API_NINJAS_KEY` env var, header `X-Api-Key`. **Not in `.env.example`** → likely unconfigured in all environments → always falls back to hardcoded rates.
- exchangerate.host: `EXCHANGE_RATES_API_KEY` env var, query param `access_key`. **Not in `.env.example`** → likely unconfigured → always falls back.

### 6.4 Caching

- Module #4: in-memory `Map`, 6h TTL.
- Module #5: in-memory `Map`, 6h TTL.
- Module #3: in-memory `Map`, 1h TTL (but never called).
- No Redis/DB cache. Cache resets on server restart.

### 6.5 Fallback behavior

All modules silently fall back to hardcoded rates or `1.0` (1:1) if no rate is found. **No alert, no error, no flag.** A failed FX lookup can silently charge the customer the wrong amount.

### 6.6 Rate freshness

No `lastUpdated` is exposed to users except `currency-settings.tsx` which sets `lastUpdated = new Date()` on every "Update Rates" click regardless of whether rates actually changed.

---

## 7. Database / Data Model Findings

### 7.1 Currency-related fields (Prisma `schema.prisma`)

| Model | Field | Type | Default | Notes |
|-------|-------|------|---------|-------|
| `Business` | `currency` | String | `"RWF"` | Business default currency |
| `User` | `preferredCurrency` | String | `"RWF"` | User display preference |
| `PaymentTransaction` | `amountCents` | Int | — | Charged amount |
| `PaymentTransaction` | `currency` | String | `"RWF"` | Currency code (no FK) |
| `PaymentTransaction` | `vatAmountCents`, `exVatAmountCents` | Int | — | VAT breakdown |
| `PaymentTransaction` | `gatewayFeeEstimatedCents`, `gatewayFeeActualCents` | Int | — | Fees |
| `PaymentTransaction` | `platformFeeCents`, `netToBusinessCents` | Int | — | Net to business |
| `PaymentTransaction` | `rawRequest` | Json? | — | **Only place FX rate is stored** (Tap & Leave) |
| `Sale` | `totalAmountCents` | Int | — | **No currency field** |
| `SaleItem` | `unitPriceCents`, `totalPriceCents` | Int | — | No currency field |
| `MenuItem` | `priceCents` | Int | — | No currency field |
| `FinancialLedgerEntry` | `amountCents`, `currency`, `vatAmountCents`, `exVatAmountCents`, `gatewayFeeCents`, `platformFeeCents`, `netAmountCents` | Int/String | `"RWF"` | Copies from PaymentTransaction |
| `BillingEvent` | `amountCents`, `currency`, `vatAmountCents`, `exVatAmountCents` | Int/String | `"RWF"` | |
| `Subscription` | `amountCents`, `currency` | Int/String | `"RWF"` | |
| `Invoice` | `amountCents`, `currency` | Int/String | `"RWF"` | |
| `SettlementRecord` | `currency`, `grossAmountCents`, `providerFeeCents`, `netAmountCents` | String/Int | — | |
| `Withdrawal` | `currency`, `amountCents`, `feeCents`, `netAmountCents` | String/Int | — | |
| `CurrencyExchangeRate` | `fromCurrency`, `toCurrency`, `rate` (Decimal 12,6), `source`, `validFrom`, `validUntil` | — | — | **Dead schema — no app code uses it** |
| `SupportedCurrency` | `code` (PK), `name`, `symbol`, `decimalDigits`, `isActive`, `countries` | — | — | **Dead schema — no app code uses it** |
| `TaxConfiguration` | `taxType`, `name`, `rate` (Float), `isInclusive` | — | — | Not used by checkout |
| `Business` | `taxMode` (TaxMode enum), `taxRate` (Float) | — | EXCLUSIVE / 18.0 | Used by checkout |

### 7.2 Historical reconstruction capability

**A completed `PaymentTransaction` cannot reconstruct a cross-currency payment because:**
- No `originalAmountCents` / `originalCurrency` columns.
- No `convertedAmountCents` / `convertedCurrency` columns.
- No `exchangeRate` column.
- No `exchangeRateDate` / `exchangeRateSource` columns.
- The only FX metadata (Tap & Leave) is buried in `rawRequest` JSON, unqueryable, with no rate-source provenance.

For RWF-only transactions (the vast majority / all current real transactions), reconstruction is trivial: `amountCents` is RWF cents, `currency` is RWF.

### 7.3 Decimal precision

- Transactional amounts: integer cents (good).
- `CurrencyExchangeRate.rate`: `Decimal @db.Decimal(12, 6)` — 6 decimal precision (adequate for most FX).
- `MarketerCommission`: `Float` for `grossAmount`, `commissionAmount`, `commissionVAT`, `totalCommission`, `whtAmount` — **Float for money is an inconsistency** (not currency-specific but worth flagging).
- `Business.taxRate`, `Subscription.platformFeePercent`, `CommissionTier.percent`: `Float` — acceptable for percentages.

---

## 8. Payment-Provider Findings

### 8.1 InTouch (primary, Mobile Money)

- **File**: `src/lib/services/intouch.service.ts` (legacy), `src/lib/payments/providers/intouch.provider.ts` (factory).
- **Supported currencies as implemented**: RWF only. No currency field in API payload. `amount` is a plain number (RWF units, no cents).
- **Amount passed**: RWF units (divided by 100 from `PaymentTransaction.amountCents` in the provider: `amount = Math.round(request.amount / 100)`).
- **Conversion logic**: caller responsibility. `tap-and-leave.ts` converts business→RWF before calling. `intouch/initiate.ts` assumes RWF.
- **Rounding**: `Math.round` to whole RWF units.
- **Transaction currency**: `PaymentTransaction.currency` set by caller (may be non-RWF string), but provider ignores it.
- **Webhook currency handling**: `intouch.provider.ts` line 275 hardcodes `currency: 'RWF'` in `WebhookPayload`. Webhook `amount` is `undefined` (InTouch doesn't return it).
- **Database persistence**: `rawCallback` JSON stored. No currency reconciliation.
- **Refund**: `requestDeposit` exists in legacy service (credit to customer). No currency handling — RWF assumed.

### 8.2 IremboPay (cards, fallback)

- **File**: `src/lib/services/irembopay.service.ts`, `src/lib/payments/providers/irembopay.provider.ts`.
- **Supported currencies as implemented**: passes `request.currency` through in provider payload. `createInvoice` (service) does NOT send currency — `paymentItems[].unitAmount = amountCents / 100` assumes RWF (no decimal scaling by currency).
- **Amount passed**: RWF units (`amount / 100`). Provider: `amount = Math.round(request.amount / 100)`.
- **Conversion logic**: none. Caller must pre-convert.
- **Rounding**: `Math.round`.
- **Transaction currency**: `PaymentTransaction.currency` from caller.
- **Webhook**: HMAC-SHA256 signature with timestamp tolerance. Currency in webhook response is `data.currency` (provider-returned), stored in `rawCallback`.
- **Database persistence**: `rawCallback`, `paymentLinkUrl`, `invoiceNumber`.
- **Refund**: `refundPayment(transactionId, amount?)` exists in provider — not inspected in depth.
- **VAT**: `IremboPayService.calculateVATAmounts(grossAmountCents, taxRate)` — RWF cents math.

### 8.3 MTN MoMo (deprecated direct)

- **File**: `src/lib/services/mtn-momo.service.ts`.
- **Status**: explicitly DEPRECATED; all flows should use InTouch aggregator.
- **Supported currencies**: `MTN_MOMO_CURRENCY` env defaults to `RWF`. `requestToPay` sends `params.currency || this.CURRENCY`.
- **Amount**: `params.amount.toString()` (string, major units).
- **Conversion**: none.
- **Security guard**: refuses to default to sandbox in production if `MTN_MOMO_ENVIRONMENT` unset.
- **Not used by any active payment flow** (InTouch wraps MTN/Airtel).

### 8.4 CASH

- No provider. `confirm-payment.ts` → `PaymentCompletionService.onPaymentSuccess` with `sale.paymentTransactionId || ''`. `FinancialLedgerEntry` created with `gateway: 'CASH'`, `currency: business.currency || 'RWF'`, `amountCents: sale.totalAmountCents`.

---

## 9. Currency Inconsistencies

### 9.1 Four+ conflicting hardcoded rate tables

- **Files**: `src/lib/utils/currency.ts`, `src/lib/services/currency.service.ts`, `src/lib/services/currency-conversion.service.ts`, `src/lib/currency/exchange-rates.ts`, `SUPABASE_MIGRATION_GLOBAL_CURRENCY_TIMEZONE.sql`.
- **Current behavior**: each module defines its own `RWF→USD` etc. with different values (e.g., USD: 0.000769 vs 0.00077 vs 0.0008 vs 0.00077; UGX: 3 vs 2.9 vs 2.84 vs 3.1).
- **Why inconsistent**: no single source of truth; the declared SSOT (`currency-exchange.service.ts`) is dead code.
- **Affected flow**: any display conversion, Tap & Leave FX, `/api/currency/convert`.
- **Severity**: HIGH — different parts of the app show different converted amounts for the same RWF value.

### 9.2 DB-backed exchange-rate table is dead schema

- **File**: `prisma/schema.prisma` (`CurrencyExchangeRate`, `SupportedCurrency`).
- **Current behavior**: tables exist, migration creates them, Supabase SQL seeds initial rows, but **zero application code reads or writes them**.
- **Why inconsistent**: the architectural intent (DB-backed SSOT) was never wired up. `currency-exchange.service.ts` queries the table but is never imported.
- **Affected flow**: any future BNR integration expecting a populated rate table.
- **Severity**: HIGH (architectural gap).

### 9.3 Tap & Leave stores `currency = businessCurrency` but `amountCents` in RWF

- **File**: `src/pages/api/checkout/tap-and-leave.ts` lines 125–131.
- **Current behavior**: `amountCents: amountRwfCents` (RWF cents), `currency: businessCurrency` (e.g., "USD"), `netToBusinessCents: finalAmount` (original RWF cents).
- **Why inconsistent**: the record says "USD" but the amount is RWF cents. Net-to-business is pre-conversion while amount is post-conversion. Fee math breaks.
- **Affected flow**: Tap & Leave checkout for non-RWF businesses; financial reconciliation; settlement intelligence.
- **Severity**: CRITICAL for non-RWF businesses (currently no non-RWF businesses in production likely, but the bug is latent).

### 9.4 Exchange rate not persisted as queryable data

- **File**: `src/pages/api/checkout/tap-and-leave.ts` line 138–153 (`rawRequest` JSON).
- **Current behavior**: `fxRateRwfPerUnit` stored only inside `rawRequest` JSON blob.
- **Why inconsistent**: cannot query "what rate was applied to transaction X" without parsing JSON. No rate date, no source, no provider rate ID.
- **Affected flow**: audit, reconciliation, refund calculation, dispute resolution.
- **Severity**: HIGH.

### 9.5 Silent 1:1 fallback on FX failure

- **Files**: `src/lib/services/currency-conversion.service.ts` line 97, `src/lib/services/currency-exchange.service.ts` line 92, `src/lib/currency/exchange-rates.ts` line 78.
- **Current behavior**: if no rate found, return `1.0` (or original amount) with only a `console.warn`.
- **Why inconsistent**: a failed FX lookup silently charges the customer the wrong amount (e.g., 1000 RWF treated as 1000 USD).
- **Affected flow**: Tap & Leave for unsupported currency pairs; `/api/currency/convert`.
- **Severity**: CRITICAL (silent money loss).

### 9.6 `Sale` has no currency field

- **File**: `prisma/schema.prisma` `Sale` model.
- **Current behavior**: `Sale.totalAmountCents` exists but no `currency` column. Currency is implicit (business currency).
- **Why inconsistent**: if a business changes currency, historical sales' currency is ambiguous. Cannot mix currencies in one business.
- **Affected flow**: historical reporting, multi-currency businesses (not currently supported but implied by `Business.currency`).
- **Severity**: MEDIUM.

### 9.7 Webhook hardcodes `currency: 'RWF'`

- **File**: `src/lib/payments/providers/intouch.provider.ts` line 275.
- **Current behavior**: `handleWebhook` returns `currency: 'RWF'` regardless of `PaymentTransaction.currency`.
- **Why inconsistent**: if a non-RWF transaction is ever created, the webhook reconciliation would mislabel it.
- **Affected flow**: webhook processing for non-RWF (latent).
- **Severity**: MEDIUM (latent — no non-RWF real transactions today).

### 9.8 CFO dashboard formats RWF cents as display currency without conversion

- **File**: `src/pages/dashboard/cfo.tsx` lines 424–427, 563–566, etc.
- **Current behavior**: `Intl.NumberFormat('en', { style: 'currency', currency })` applied to raw numeric values (which are RWF cents or RWF units) without dividing/scaling by currency decimals.
- **Why inconsistent**: if `currency` is "USD", it shows e.g. `$1,300` for what is actually 1300 RWF cents (≈ $1.00).
- **Affected flow**: CFO dashboard display for non-RWF.
- **Severity**: HIGH (display-only, but misleading to executives).

### 9.9 Store checkout divides RWF cents by 100 and labels with display currency

- **File**: `src/pages/store/checkout.tsx` lines 276, 283, 299, 308.
- **Current behavior**: `{(totalCents / 100).toLocaleString()} {currency}`.
- **Why inconsistent**: `totalCents` is RWF cents; dividing by 100 gives RWF units; labeling with `currency` (e.g., "USD") is wrong.
- **Affected flow**: marketplace checkout display.
- **Severity**: HIGH (customer-facing wrong price label).

### 9.10 Order page hardcodes "RWF" string in one place

- **File**: `src/pages/order/index.tsx` line 1088 (and line 1083).
- **Current behavior**: `RWF {Math.round((summary.totalAmountCents || 0)).toLocaleString()}` while surrounding code uses `<CurrencyDisplay>`.
- **Why inconsistent**: ignores user's display currency in the group-order summary.
- **Affected flow**: group order summary display.
- **Severity**: LOW.

### 9.11 `currency-settings.tsx` "Set as Default" is a no-op stub

- **File**: `src/pages/api/currency/default.ts`.
- **Current behavior**: returns `{ success: true, defaultCurrency: code }` without updating the business.
- **Why inconsistent**: admin UI shows success but business currency is unchanged.
- **Affected flow**: admin currency settings.
- **Severity**: MEDIUM.

### 9.12 `currency-settings.tsx` initializes with only 3 hardcoded currencies

- **File**: `src/pages/dashboard/currency-settings.tsx` lines 18–22.
- **Current behavior**: initial state is RWF/USD/EUR with hardcoded rates `0.00077`/`0.00071` (which match neither module #1's `0.000769`/`0.000714` nor any other module).
- **Why inconsistent**: admin sees a third set of rates distinct from all other modules.
- **Affected flow**: admin currency settings display.
- **Severity**: LOW.

### 9.13 RWF symbol inconsistency: `FRw` vs `RWF`

- **Files**: module #1 uses `FRw`; module #2 uses `RWF`; Supabase seed uses `FRw`; `currency-settings.tsx` uses `RWF`.
- **Why inconsistent**: the same currency is displayed with different symbols depending on which formatter is used.
- **Affected flow**: receipts, dashboards, admin UI.
- **Severity**: LOW (cosmetic but confusing).

### 9.14 `intouch/initiate.ts` hardcodes VAT to 0

- **File**: `src/pages/api/payments/intouch/initiate.ts` lines 67–68.
- **Current behavior**: `vatAmountCents: 0`, `exVatAmountCents: totalAmount * 100`.
- **Why inconsistent**: ignores `Business.taxRate`/`taxMode`. Other paths (`qr-order.service.ts`) compute VAT correctly.
- **Affected flow**: direct InTouch initiate (legacy path).
- **Severity**: MEDIUM (tax reporting inaccuracy for this path).

### 9.15 `MarketerCommission` uses `Float` for money

- **File**: `prisma/schema.prisma` lines 1064–1069.
- **Current behavior**: `grossAmount`, `commissionAmount`, `commissionVAT`, `totalCommission`, `whtAmount` are `Float`.
- **Why inconsistent**: every other money field is integer cents. Float introduces rounding drift.
- **Affected flow**: marketer payouts, commission reporting.
- **Severity**: MEDIUM (not currency-specific but a money-integrity issue).

---

## 10. Existing Test Coverage

### 10.1 Tests touching currency / payments

| Test file | What it verifies | Currency coverage |
|-----------|------------------|-------------------|
| `tests/reliability/mpca-001a-intouch-webhook-financial-integrity.test.ts` | InTouch webhook → Sale completion → ledger entry; business isolation; amount mismatch; **has a case for USD currency on PaymentTransaction** (line 616–656) | Verifies `PaymentCompletionService` uses business currency, not hardcoded RWF. Does NOT verify FX rate preservation. |
| `tests/reliability/mpca-001b-settlement-intelligence.test.ts` | Settlement records created with correct `currency` field | Currency passed through; no conversion tested. |
| `tests/reliability/pay-001-sandbox-payment.test.ts` | Sandbox payment flow | RWF amounts only. |
| `tests/reliability/pay-002-intouch-document-conformance.test.ts` | InTouch API conformance (form encoding, status codes) | No currency tests. |
| `tests/reliability/pay-002-tap-and-leave-callback-url.test.ts` | Tap & Leave callback URL resolution | No currency tests. |
| `tests/reliability/gpv-d009-tax-config-consistency.test.ts` | Tax config consistency | VAT math in RWF cents; no multi-currency. |
| `tests/reliability/gpv-d010-financial-truth-chain.test.ts` | Financial ledger entry creation | RWF only. |
| `tests/unit/calculations/tax-calculations.test.ts` | VAT inclusive/exclusive math | RWF cents; no currency conversion. |
| `tests/unit/calculations/payment-fees.test.ts` | Convenience fee + VAT | RWF; uses `formatRWF` (hardcoded RWF formatter). |
| `tests/unit/calculations/tipping-logic.test.ts` | Tip calculation | RWF cents. |
| `tests/unit/calculations/refund-math.test.ts` | Refund amounts | RWF. |
| `tests/unit/calculations/business-commission.test.ts` | Marketplace commission + WHT | RWF. |
| `tests/integration/payment-lifecycle.test.ts` | Payment lifecycle | RWF. |
| `tests/edge-cases/payment-edge-cases.test.ts` | Payment edge cases | RWF. |
| `tests/components/cfo-operating-center.test.tsx` | CFO dashboard render | Passes `currency` prop; no conversion assertion. |
| `tests/components/ceo-operating-center.test.tsx` | CEO dashboard render | Currency prop only. |
| `tests/components/revenue-operations.test.tsx` | Revenue ops render | Currency prop only. |

### 10.2 Missing test cases

- **No test** verifies that `CurrencyExchangeRate` DB rows are read or written.
- **No test** verifies the Tap & Leave FX conversion math (`convertToRWF` → `amountRwfCents`).
- **No test** verifies that a non-RWF `PaymentTransaction.currency` is preserved end-to-end.
- **No test** verifies the silent 1:1 fallback behavior (it should arguably throw, not silently return 1).
- **No test** verifies that `rawRequest.fxRateRwfPerUnit` is present after a converted transaction.
- **No test** verifies dashboard display conversion correctness for non-RWF.
- **No test** verifies the `currency-settings.tsx` "Set as Default" actually persists (it doesn't).
- **No test** covers the four conflicting hardcoded rate tables agreeing or disagreeing.
- **No test** covers API Ninjas / exchangerate.host failure → fallback behavior.
- **No test** covers IremboPay `createInvoice` with non-RWF currency (it would mis-scale decimals).
- **No test** covers `intouch/initiate.ts` VAT=0 hardcoded vs business tax config.

---

## 11. BNR Compatibility Analysis

### 11.A What current functionality can directly consume BNR data?

**Nothing directly.** No code path reads from an FX API and persists to the DB in a way BNR data could slot into.

The closest candidate is `src/lib/services/currency-exchange.service.ts`:
- It already queries `prisma.currencyExchangeRate.findFirst` with `fromCurrency`/`toCurrency`/`validFrom`/`validUntil`.
- It has `updateExchangeRates(rates)` which expires old rows and inserts new ones with a `source` field.
- The `CurrencyExchangeRate` schema (`fromCurrency`, `toCurrency`, `rate Decimal(12,6)`, `source`, `validFrom`, `validUntil`) is **structurally compatible** with BNR's record shape (`currency_name`, `average_rate`, `buying_rate`, `selling_rate`, `post_date`).

**However**, this service is dead code (no callers). Wiring BNR → `updateExchangeRates` → `getExchangeRate` would require:
1. A new BNR client service.
2. A cron job to call it.
3. Replacing all current callers of modules #1, #4, #5 with calls to this service.
4. Deciding which BNR rate (average/buying/selling) maps to `rate`.

### 11.B What is missing?

- A BNR API client (no code exists).
- A cron/scheduled job to refresh BNR rates (no cron touches currency).
- A mapping from BNR's `currency_name` (string, e.g., "US Dollar") to ISO 4217 codes (`USD`). BNR docs do not specify whether `currency_name` is ISO code or full name.
- A decision on which BNR rate to use (average vs buying vs selling) per business operation (display vs payment vs refund).
- Persistence of the rate type used per transaction (currently no column for this).
- A migration to add FX-rate columns to `PaymentTransaction` (or a side table) for historical reconstruction.
- Replacement of the four hardcoded rate tables with DB-backed reads.
- An admin UI that reads/writes `SupportedCurrency` and `CurrencyExchangeRate` (current `currency-settings.tsx` is a stub).
- Error handling for BNR 400/404/500 responses.
- Caching strategy for BNR responses (current modules use 1–6h in-memory; BNR may publish daily).

### 11.C What assumptions in current code conflict with BNR data model?

| Current assumption | BNR reality | Conflict |
|--------------------|-------------|----------|
| Rates are RWF-base (`fromCurrency='RWF'`) | BNR returns rates per currency vs RWF (post_date, average/buying/selling) — likely RWF is the counter, not the base | Need to confirm direction; may need to invert |
| Single `rate` per pair | BNR has `average_rate`, `buying_rate`, `selling_rate` | Must pick one or store all three |
| `rate Decimal(12,6)` | BNR returns rates as strings (to preserve precision) | Must parse string → Decimal without float drift |
| `source` is free string | BNR is a specific named source | Should set `source='bnr'` |
| No `post_date` column | BNR rates have `post_date` | `validFrom` could map to `post_date`, but semantics differ (validFrom = when we activated it; post_date = when BNR posted it) |
| No `created_at` from BNR | BNR records have `created_at` | Could store in `validFrom` or a new column |
| Hardcoded 7–15 currencies | BNR publishes a specific set (unknown which) | `SupportedCurrency` table should reflect BNR's published set |
| `currency_name` not used anywhere | BNR uses `currency_name` string | Need ISO↔name mapping table |

### 11.D What information would need to be persisted?

For each `PaymentTransaction` involving conversion:
- `originalAmountCents` (in business currency)
- `originalCurrency` (ISO code)
- `convertedAmountCents` (in RWF)
- `convertedCurrency` (always RWF for now)
- `exchangeRate` (Decimal, with direction documented)
- `exchangeRateType` (average / buying / selling)
- `exchangeRateDate` (BNR `post_date`)
- `exchangeRateSource` (e.g., "bnr")
- `exchangeRateRecordId` (BNR `id`, if available)

For the `CurrencyExchangeRate` table (if activated):
- Possibly add `averageRate`, `buyingRate`, `sellingRate` columns (currently only `rate`).
- Possibly add `postDate` column.
- Possibly add `providerRecordId` column (BNR `id`).

### 11.E Questions remaining unanswered by supplied BNR documentation

- **Authentication**: The supplied BNR docs do not specify the API-key header format, whether auth is required on every request, or whether it is a query param, bearer token, or custom header. **No assumptions should be made.**
- **Rate limits**: unknown.
- **Recommended request frequency**: unknown (daily? on-demand?).
- **Official production usage expectations**: unknown (attribution? caching policy?).
- **Whether BNR should be the sole source of truth** vs a fallback: unknown.
- **Which rate (average/buying/selling) to use for**: display, payment, refund, invoice, tax, payout — unknown.
- **`currency_name` format**: ISO 4217 code (`USD`) or full name (`US Dollar`)? The docs say "currency_name" which suggests full name, but unconfirmed.
- **Rate direction**: is the rate expressed as "1 RWF = X USD" or "1 USD = X RWF"? The presence of `buying_rate`/`selling_rate` suggests RWA is quoting RWF per foreign unit (bank buys USD for X RWF), but unconfirmed.
- **Historical data availability**: can we fetch rates for past dates? (`start_date`/`end_date` params suggest yes, but range limits unknown.)
- **Update timing**: when does BNR publish new rates? Daily? Intraday?
- **Error response bodies**: do 400/404/500 return JSON with error details?
- **Pagination**: does `GET /ExchangeRate` paginate?
- **Webhook/push availability**: does BNR push rate updates, or must we poll?
- **SLA/uptime**: unknown.
- **Sandbox/test environment**: unknown if one exists.

---

## 12. Missing Information / Unanswered Questions

### 12.1 BNR-specific (must be resolved before implementation)

1. **Authentication mechanism & header format** — unknown. Do NOT invent.
2. **Whether authentication is required on every request** — unknown.
3. **Rate limits** — unknown.
4. **Recommended request frequency** — unknown.
5. **Official production usage expectations** — unknown.
6. **Whether BNR is the sole source of truth or a fallback** — architectural decision pending.
7. **Which rate (average/buying/selling) for each business operation** — unknown.
8. **`currency_name` format (ISO code vs full name)** — unknown.
9. **Rate direction (RWF-base vs foreign-base)** — unknown.
10. **Historical range limits** — unknown.
11. **Publication schedule** — unknown.
12. **Error response body shape** — unknown.
13. **Pagination** — unknown.
14. **Push/webhook availability** — unknown.

### 12.2 Architecture decisions pending (not BNR-specific)

1. Should the four deprecated currency modules be deleted or consolidated into `currency-exchange.service.ts`?
2. Should `Sale` gain a `currency` column for historical integrity?
3. Should `PaymentTransaction` gain FX-rate columns, or use a side table?
4. Should the silent 1:1 fallback be replaced with a hard error?
5. Should `currency-settings.tsx` "Set as Default" actually persist (currently a stub)?
6. Should `TaxConfiguration` be wired into checkout (currently only `Business.taxRate` is used)?
7. Should `MarketerCommission` money fields migrate from `Float` to `Int` cents?

---

## 13. Recommended Next Investigation Steps

These are factual/architectural next steps. **Do not implement them yet.**

1. **Confirm BNR authentication & rate semantics with the Founder.** The Founder has the BNR API key by email. Before any code, confirm: header format, rate direction, which rate type per operation, publication schedule, and whether BNR is SSOT or fallback. This is a blocking unknown.

2. **Map BNR `currency_name` values to ISO 4217 codes.** Fetch a sample BNR response (via the Founder) and build a deterministic mapping table. Decide where to store it (`SupportedCurrency` table or a static config).

3. **Decide the canonical currency service.** Audit which of the five modules can be retired and which single service should be the SSOT. `currency-exchange.service.ts` is the intended SSOT but is dead code; confirm whether to revive it or build a new one.

4. **Design the FX-rate persistence schema for `PaymentTransaction`.** Propose columns (or a side table) for `originalAmountCents`, `originalCurrency`, `convertedAmountCents`, `exchangeRate`, `exchangeRateType`, `exchangeRateDate`, `exchangeRateSource`. Do not write the migration.

5. **Trace every caller of the four deprecated modules.** Produce a complete call-site inventory so consolidation can be planned without missing a display path.

6. **Audit the `CurrencyExchangeRate` / `SupportedCurrency` tables in the live database.** Confirm whether the Supabase seed migration ran and whether any rows exist. If empty, the DB-backed service will always fall back to hardcoded rates.

7. **Decide on silent-fallback policy.** Concretely: should a missing FX rate fail the transaction (fail-closed) or fall back to 1:1 (current, fail-open)? This is a money-safety decision.

8. **Verify InTouch/IremboPay non-RWF behavior.** Confirm with provider documentation whether non-RWF currencies are accepted and how amounts scale. Current code assumes RWF units for both.

9. **Reconcile `Sale` currency.** Decide whether to add a `currency` column to `Sale` (and `SaleItem`, `MenuItem`) for historical integrity, or document that RWF is the only persistable transaction currency.

10. **Plan a cron job for BNR rate refresh.** Identify the cron framework (`src/lib/cron.ts`), decide frequency (daily after BNR publication?), and design idempotent upsert logic into `CurrencyExchangeRate`.

---

## Appendix A: Files Inspected

### Currency-related files (deeply read)
- `src/lib/utils/currency.ts`
- `src/lib/utils/country-config.ts`
- `src/lib/services/currency.service.ts`
- `src/lib/services/currency-exchange.service.ts`
- `src/lib/services/currency-conversion.service.ts`
- `src/lib/currency/exchange-rates.ts`
- `src/lib/pricing/ebm-formatter.ts`
- `src/lib/pricing/fee-calculator.ts`
- `src/contexts/LocaleContext.tsx`
- `src/components/CurrencyDisplay.tsx`
- `src/pages/api/currency/rates.ts`
- `src/pages/api/currency/convert.ts`
- `src/pages/api/currency/default.ts`
- `src/pages/dashboard/currency-settings.tsx`
- `prisma/schema.prisma` (currency/exchange/amount fields)
- `SUPABASE_MIGRATION_GLOBAL_CURRENCY_TIMEZONE.sql`
- `prisma/migrations/20260601081228_billing_ledger/migration.sql`

### Payment-related files (deeply read)
- `src/lib/services/intouch.service.ts`
- `src/lib/payments/providers/intouch.provider.ts`
- `src/lib/services/irembopay.service.ts`
- `src/lib/payments/providers/irembopay.provider.ts`
- `src/lib/services/mtn-momo.service.ts`
- `src/lib/services/payment-completion.service.ts`
- `src/lib/services/billing-ledger.service.ts` (currency lines)
- `src/lib/services/qr-order.service.ts`
- `src/lib/settlement/types.ts` (currency fields)
- `src/pages/api/payments/intouch/initiate.ts`
- `src/pages/api/checkout/tap-and-leave.ts`
- `src/pages/api/webhooks/intouch.ts`
- `src/pages/api/marketplace/orders/pay.ts`
- `src/pages/api/orders/[id]/confirm-payment.ts`
- `src/pages/api/public/order/draft.ts`
- `src/pages/api/public/order/confirm.ts`
- `src/pages/api/public/order/status.ts`
- `src/pages/api/business/[id]/settings.ts` (currency lines)

### Frontend payment/currency pages (inspected)
- `src/pages/order/index.tsx`
- `src/pages/store/checkout.tsx`
- `src/pages/store/cart.tsx` (matched, not deeply read)
- `src/pages/dashboard/cfo.tsx` (currency lines)

### Test files (matched for currency/payments)
- 34 test files matched; key ones read for currency coverage assessment (see §10).

### Environment / secrets
- `.env.example` (structure only — no values printed)
- `.env.production.template` (structure only)
- `.gitignore` (confirmed `.env` and `.env*.local` ignored)
- `git ls-files` (confirmed `.env` and `.env.local` NOT tracked)

### Cron
- `src/lib/cron.ts` (searched for currency/exchange — none found)

---

## Appendix B: Git State at Audit

- **HEAD**: `7bcd1db0b2050054c27bba597296741c334122af`
- **Branch**: `main` (ahead of `origin/main` by 2 commits)
- **Working-tree changes**: pre-existing uncommitted branding/locale/test changes (NOT modified, staged, stashed, or committed by this audit)
- **Files staged by this audit**: none
- **Commits created by this audit**: none
- **Code modified by this audit**: none
- **New file created by this audit**: `CURRENCY-BNR-PHASE-1-AUDIT.md` (this report)

---

## Appendix C: Summary of Findings

- **Currency-related files inspected**: 17 deeply + ~30 matched via grep
- **Payment-related files inspected**: 18 deeply + ~40 matched via grep
- **Existing exchange-rate sources**: 4 hardcoded tables + 2 external APIs (API Ninjas, exchangerate.host) + 1 DB table (dead) + 1 declared-SSOT service (dead)
- **Current supported currencies (backend-true)**: RWF only
- **Current supported currencies (display-only)**: RWF, USD, EUR, GBP, KES, TZS, UGX (via deprecated hardcoded rates)
- **Current supported currencies (country-default only)**: 27 countries' currencies including ZAR, NGN, GHS, XOF, XAF, MAD, EGP, AED, CAD, SAR, QAR, INR, CNY, JPY, AUD, BRL, MXN
- **Major inconsistencies**: 4 conflicting rate tables; dead DB schema; Tap & Leave currency/amount mismatch; silent 1:1 fallback; no FX persistence on transactions; dashboard display without conversion; no-op currency default endpoint; RWF symbol inconsistency; hardcoded VAT=0 in one path
- **BNR compatibility**: no current code can consume BNR data directly; closest is dead `currency-exchange.service.ts`; schema is structurally close but missing rate-type columns
- **Unanswered BNR questions**: 14 (see §12.1)
- **Whether any code was modified**: NO
- **Whether any files were staged**: NO
- **Whether any commits were created**: NO
