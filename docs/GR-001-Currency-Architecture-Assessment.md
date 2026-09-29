# GR-001 — Currency Architecture Assessment

**Phase:** GR-001 — Global Readiness & Localization Certification
**Date:** 2026-08-07
**Status:** Complete

---

## Executive Summary

**Total RWF occurrences in source files:** 836
**Architecture Status:** MIXED — Data model supports multi-currency; service layer frequently bypasses it.
**Risk Level:** HIGH for international expansion; NONE for Rwanda operations.

---

## 1. Data Model Assessment

### 1.1 Business Model (✅ Configurable)
```prisma
// prisma/schema.prisma line 121
currency String @default("RWF")
```
The Business model has a currency field with RWF as default. This is the correct pattern — default to the primary market, configurable per business.

### 1.2 Financial Models (⚠️ Mixed)
| Model | Has Currency Field | Default |
|-------|-------------------|---------|
| PaymentTransaction | ✅ Yes | "RWF" |
| Plan | ✅ Yes | "RWF" |
| Subscription | ✅ Yes | "RWF" |
| Invoice | ✅ Yes | "RWF" |
| Sale | ❌ NO | — (inherits from business implicitly) |
| MarketplaceOrder | ❌ NO | — (inherits from business implicitly) |
| BusinessInsightReport | ✅ Yes | "USD" (hardcoded to USD) |

**Risk:** Sale and MarketplaceOrder models lack explicit currency fields. If a business changes currency, historical records have no currency context.

### 1.3 Currency Configuration (✅ Good)
```typescript
// src/lib/utils/currency.ts lines 35-85
export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  RWF: { code: 'RWF', symbol: 'FRw', decimalDigits: 0, symbolPosition: 'after' },
  USD: { code: 'USD', symbol: '$', decimalDigits: 2, symbolPosition: 'before' },
  EUR: { code: 'EUR', symbol: '€', decimalDigits: 2, symbolPosition: 'before' },
  GBP: { code: 'GBP', symbol: '£', decimalDigits: 2, symbolPosition: 'before' },
  KES: { code: 'KES', symbol: 'KSh', decimalDigits: 2, symbolPosition: 'before' },
  TZS: { code: 'TZS', symbol: 'TSh', decimalDigits: 0, symbolPosition: 'before' },
  UGX: { code: 'UGX', symbol: 'USh', decimalDigits: 0, symbolPosition: 'before' }
};
```
7 currencies supported with correct decimal places and symbol positions.

---

## 2. Display Layer Assessment

### 2.1 CurrencyDisplay Component (✅ Properly Implemented)
```typescript
// src/components/CurrencyDisplay.tsx
const { currency } = useCurrency();
const targetCurrency = currencyOverride || currency;
```
The component correctly uses LocaleContext for per-business currency. This is the right pattern.

### 2.2 LocaleContext (✅ Properly Implemented)
```typescript
// src/contexts/LocaleContext.tsx
setCurrencyState(settings.currency || 'RWF');
```
Context properly loads business currency and allows runtime changes.

### 2.3 Currency Exchange Service (✅ Good)
```typescript
// src/lib/services/currency-exchange.service.ts
// DB-backed exchange rates with fallback to static rates
```
Properly implemented with DB-backed rates and fallback.

### 2.4 Deprecated Currency Utility (⚠️ Migration Incomplete)
```typescript
// src/lib/utils/currency.ts
// ⚠️ DEPRECATED: This static currency utility is being phased out.
// Use currency-exchange.service.ts as the SINGLE SOURCE OF TRUTH
```
The deprecated utility is still widely used. Migration to CurrencyExchangeService is incomplete.

---

## 3. Hardcoded RWF Classification

### 3.1 APIs Using business.currency (✅ Correct Pattern)
| File | Line | Pattern |
|------|------|---------|
| `src/pages/api/reports/close-day.ts` | 194 | `business?.currency \|\| 'RWF'` |
| `src/pages/api/reports/export.ts` | 43 | `business?.currency \|\| 'RWF'` |
| `src/pages/api/sales/index.ts` | 92 | `business?.currency \|\| 'RWF'` |
| `src/pages/api/payments/momo/initiate.ts` | 57 | `order.business?.currency \|\| 'RWF'` |
| `src/pages/api/checkout/tap-and-leave.ts` | 105 | `business?.currency \|\| 'RWF'` |
| `src/pages/api/currency/rates.ts` | 24 | `user?.business?.currency \|\| 'RWF'` |
| `src/pages/api/subscriptions/initiate-payment.ts` | 125, 171 | Uses `plan.currency` |

### 3.2 APIs Hardcoding RWF (❌ Architecture Risk)
| File | Line | Code |
|------|------|------|
| `src/pages/api/auth/signup.ts` | 143 | `currency: 'RWF'` |
| `src/pages/api/reservations/[id]/cancel.ts` | 60 | `currency: 'RWF'` |
| `src/pages/api/reservations/[id]/deposit/initiate.ts` | 54 | `currency: 'RWF'` |
| `src/pages/api/public/order/draft.ts` | 219 | `currency: 'RWF'` |
| `src/pages/api/cron/addon-renewals.ts` | 120 | `currency: 'RWF'` |
| `src/pages/api/credits/purchase.ts` | 71 | `currency: 'RWF'` |
| `src/pages/api/addons/site-builder/purchase.ts` | 71 | `currency: 'RWF'` |
| `src/pages/api/addons/discovery/purchase.ts` | 80 | `currency: 'RWF'` |
| `src/pages/api/addons/ai-credits/purchase.ts` | 76 | `currency: 'RWF'` |
| `src/pages/api/payments/irembo/create-invoice.ts` | 83 | `currency: 'RWF'` |
| `src/pages/api/payments/intouch/initiate.ts` | 58 | `currency: 'RWF'` |
| `src/pages/api/marketplace/orders/pay.ts` | 84, 128 | `currency: 'RWF'` |
| `src/pages/api/admin/finance/revenue.ts` | 100 | `currency: 'RWF'` |

**Count: 15 API endpoints hardcode RWF**

### 3.3 Services Hardcoding RWF (❌ Architecture Risk)
| File | Line | Code |
|------|------|------|
| `src/lib/services/billing-ledger.service.ts` | 79 | `currency: 'RWF'` |
| `src/lib/services/ledger-integrity.service.ts` | 115 | `currency: 'RWF'` |
| `src/lib/services/founder-commission.service.ts` | 20, 272 | `currency = 'RWF'` / `currency: 'RWF'` |
| `src/lib/services/partnership-payout.service.ts` | 78, 94, 103 | `input.currency ?? 'RWF'` |
| `src/lib/services/marketer-payout.service.ts` | 70 | `currency: 'RWF'` |
| `src/lib/services/credits/credit-purchase.service.ts` | 49 | `currency: 'RWF'` |

**Count: 8 service locations hardcode RWF**

### 3.4 UI Components Hardcoding RWF (❌ Architecture Risk)
| File | Pattern |
|------|---------|
| `src/pages/portal/earnings.tsx` | `Intl.NumberFormat('en-RW', { currency: 'RWF' })` |
| `src/pages/portal/growth.tsx` | Same pattern |
| `src/components/portal/FounderCodeCard.tsx` | Same pattern |
| `src/components/portal/CampaignPreview.tsx` | Same pattern |
| `src/components/portal/EarningsCard.tsx` | Same pattern |
| `src/components/portal/SuccessSnapshot.tsx` | Same pattern |
| `src/components/portal/PartnerWelcomeCard.tsx` | Same pattern |
| `src/pages/admin/affiliates.tsx` | `.toLocaleString()} RWF` |
| `src/pages/admin/founder-partners.tsx` | Same pattern |
| `src/pages/admin/reconciliation.tsx` | Same pattern |
| `src/pages/admin/revenue-operations.tsx` | Same pattern |
| `src/pages/store/checkout.tsx` | Same pattern |
| `src/pages/store/cart.tsx` | Same pattern |
| `src/pages/supplier/orders.tsx` | Same pattern |
| `src/pages/dashboard/ceo.tsx` | `RWF ${amount.toLocaleString()}` |
| `src/pages/admin/executive/ceo.tsx` | `.toLocaleString()} RWF` |
| `src/pages/admin/executive/coo.tsx` | Same pattern |
| `src/pages/admin/executive/cfo.tsx` | Same pattern |
| `src/pages/admin/executive/cmo.tsx` | Same pattern |
| `src/pages/admin/executive/partnership-director.tsx` | Same pattern |

**Count: 20+ UI components hardcode RWF**

### 3.5 Executive Dashboard Currency Inconsistency (❌ Critical)
- **CEO dashboard:** Hardcoded `RWF ${amount.toLocaleString()}`
- **CFO dashboard:** Hardcoded `Intl.NumberFormat('en-US', { currency: 'USD' })`
- Neither uses business.currency

---

## 4. Payment Gateway Currency (❌ Architecture Risk)

### 4.1 InTouch Provider
```typescript
// src/lib/payments/providers/intouch.provider.ts line 275
currency: 'RWF',
```
InTouch is configured for RWF only. This is a provider limitation, not an architecture error — but the code should read from business.currency and validate against provider-supported currencies.

### 4.2 IremboPay Provider
```typescript
// src/pages/api/payments/irembo/initiate-momo.ts line 46
if (transaction.currency !== 'RWF') {
  // reject
}
```
IremboPay explicitly rejects non-RWF transactions. This is a provider limitation.

### 4.3 MTN MoMo Service
```typescript
// src/lib/services/mtn-momo.service.ts line 54
private static readonly CURRENCY = process.env.MTN_MOMO_CURRENCY || 'RWF'
```
MTN MoMo currency is configurable via environment variable — good pattern.

---

## 5. Receipt and Invoice Currency (⚠️ Mixed)

### 5.1 Receipt Generator (✅ Currency-Aware)
```typescript
// src/lib/services/receipt-generator.service.ts
const fmt = (cents: number) => `${data.currency} ${(cents / 100).toLocaleString()}`
```
Receipts use the currency from ReceiptData, which is populated from the payment transaction.

### 5.2 Smart Dining Slip (⚠️ Fallback to RWF)
```typescript
// src/lib/services/slip-pdf-generator.service.ts
formatCurrency(slip.subtotalCents / 100, slip.currency || 'RWF')
```
Falls back to RWF if slip.currency is not set. Should always be set from business.currency.

---

## 6. Architecture Classification

| Finding | Classification |
|---------|---------------|
| Business.currency field | Already Global |
| CurrencyDisplay component | Already Global |
| LocaleContext | Already Global |
| CurrencyExchangeService | Already Global |
| 7 supported currencies | Already Global |
| Default "RWF" on schema fields | Configurable |
| `business?.currency \|\| 'RWF'` pattern (7 APIs) | Configurable |
| Hardcoded `currency: 'RWF'` in 15 APIs | Rwanda-Specific Assumption |
| Hardcoded `currency: 'RWF'` in 8 services | Rwanda-Specific Assumption |
| Hardcoded RWF in 20+ UI components | Rwanda-Specific Assumption |
| Executive dashboards hardcoded currency | Immediate Architecture Risk |
| Payment gateways RWF-only | Rwanda-Specific by Design |
| Sale model missing currency field | Immediate Architecture Risk |
| MarketplaceOrder model missing currency field | Immediate Architecture Risk |

---

## 7. Recommendations

### Immediate Actions (Before International Expansion)
1. Add `currency` field to Sale and MarketplaceOrder models
2. Replace hardcoded `currency: 'RWF'` in 15 API endpoints with `business.currency`
3. Replace hardcoded RWF in executive dashboards with business.currency
4. Replace local `formatRwf` functions with CurrencyDisplay component

### Before International Expansion
5. Replace hardcoded RWF in 8 service files with business or transaction currency
6. Replace hardcoded RWF in 20+ UI components with CurrencyDisplay or LocaleContext
7. Complete migration from deprecated currency.ts to CurrencyExchangeService
8. Add currency validation per payment provider (provider-supported currencies)

### Post-Growth Evolution
9. Implement multi-currency payment gateway support
10. Implement automatic currency conversion at checkout
11. Add exchange rate automation from external APIs
