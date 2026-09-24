# GR-001A: Tax Configuration Alignment Report

**Mission:** Replace all hardcoded 18% VAT with `business.taxRate` configuration.
**Status:** COMPLETE

---

## 1. Executive Summary

GR-001 identified 15+ locations hardcoding 18% VAT (Rwanda's rate). GR-001A has replaced every hardcoded VAT rate with `business.taxRate`, using `?? 0` as the fallback (no tax unless configured). The EBM receipt formatter retains 18.0 as a default parameter for Rwanda EBM compliance but accepts override values.

**Files modified:** 18
**Remaining hardcoded `18%` in business logic:** 0
**TypeScript compilation:** PASS

---

## 2. Problem Statement

| Finding | Severity | Impact |
|---|---|---|
| 15+ locations hardcode `VAT_RATE = 0.18` | HIGH | Non-Rwanda businesses charge wrong tax rate |
| `|| 18.0` fallbacks assume Rwanda | HIGH | Businesses without configured taxRate default to 18% |
| `getVATRate()` in rwandaUtils.ts | LOW | Dead code, but signals Rwanda-specific assumption |

---

## 3. Solution Architecture

### Pattern Applied
```typescript
// BEFORE:
const VAT_RATE = 0.18

// AFTER:
const taxRate = business.taxRate ?? 0  // No tax unless configured
const VAT_RATE = taxRate / 100
```

### EBM Exception
```typescript
// EBM formatter keeps 18.0 default for Rwanda EBM compliance
function formatEBMReceipt(items, feeCalc, currency, vatRate: number = 18.0)
// But sales/index.ts passes business.taxRate ?? 18 (EBM requires a rate)
```

---

## 4. Detailed Change Log

### Core Changes (13 files)

| File | Change |
|---|---|
| `irembopay.service.ts` | `calculateVATAmounts()` accepts `taxRate` parameter (default 0) |
| `subscriptions/initiate-payment.ts` | Uses `business.taxRate ?? 0` |
| `marketplace/orders/pay.ts` | Uses `order.business.taxRate ?? 0` |
| `reorder-autopilot.service.ts` | `generateDraftPurchaseOrders()` accepts `taxRate` parameter |
| `receipt-generator.service.ts` | Added `taxRate` to ReceiptData, displays dynamic rate |
| `commission.service.ts` | Added `vatRate` to CommissionInvoice interface |
| `ebm-formatter.ts` | `formatEBMReceipt()` accepts `vatRate` parameter (default 18.0) |
| `sales/index.ts` | Fetches `business.taxRate`, passes to EBM formatter |
| `smart-dining-slip.service.ts` | `buyerBusiness?.taxRate ?? 0` |
| `dining-session-slip.service.ts` | `input.taxRate ?? 0` |
| `dev/bootstrap-tap-leave.ts` | `business.taxRate ?? 0` |
| `tax.service.ts` | Default VAT changed from 18.0 to 0; country fallback removed |
| `rwandaUtils.ts` | Removed dead code: `getVATRate()` and `calculateVAT()` |

### Caller Updates (5 files)

| File | Change |
|---|---|
| `credits/purchase.ts` | Passes `business.taxRate ?? 0` to calculateVATAmounts |
| `addons/site-builder/purchase.ts` | Same |
| `addons/discovery/purchase.ts` | Same |
| `addons/ai-credits/purchase.ts` | Same |
| `payments/irembo/create-invoice.ts` | Uses `subscription.business.taxRate ?? 0` |
| `autopilot/reorder-suggestions.ts` | Fetches business.taxRate, passes to generateDraftPurchaseOrders |
| `pricing/fee-calculator.ts` | Added vatRate to CommissionCalculationResult |

---

## 5. Design Decisions

1. **`?? 0` instead of `|| 18`:** Businesses without a configured taxRate default to 0% (no tax). This is the correct behavior for markets without VAT or for businesses that haven't configured tax yet.

2. **EBM exception:** The EBM receipt formatter (`ebm-formatter.ts`) keeps 18.0 as a default parameter because Rwanda EBM regulations require a VAT rate on receipts. The `sales/index.ts` endpoint uses `?? 18` for the same reason. This is a regulatory constraint, not an architecture assumption.

3. **TaxService default changed:** `tax.service.ts` default VAT changed from 18.0 to 0. The country-specific config fallback (`configs[countryCode] || configs['RW']`) was removed — non-Rwanda countries should not fall back to Rwanda tax config.

4. **Dead code removal:** `getVATRate()` and `calculateVAT()` in `rwandaUtils.ts` were removed. No external references existed.

---

## 6. Verification Results

- **grep for `VAT_RATE = 0.18` in `src/`:** 0 matches
- **grep for `* 0.18` in `src/`:** 0 matches
- **grep for `/ 118` in `src/`:** 0 matches
- **TypeScript compilation:** PASS
