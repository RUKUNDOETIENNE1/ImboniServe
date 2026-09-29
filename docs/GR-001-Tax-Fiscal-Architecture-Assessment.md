# GR-001 — Tax & Fiscal Architecture Assessment

**Phase:** GR-001 — Global Readiness & Localization Certification
**Date:** 2026-08-07
**Status:** Complete

---

## Executive Summary

**Risk Level:** HIGH for international expansion; NONE for Rwanda operations.

The tax architecture has a well-designed `TaxConfiguration` model supporting 5 tax types and a `TaxService` with country-specific presets for 9 countries. However, tax calculation is scattered across multiple services with inconsistent fallback logic, and 15+ locations hardcode 18% VAT.

---

## 1. Data Model Assessment

### 1.1 Business Model Tax Fields (✅ Configurable)
```prisma
// prisma/schema.prisma lines 218-219
taxMode  TaxMode @default(EXCLUSIVE)
taxRate  Float   @default(18.0)
```
- `TaxMode` enum: INCLUSIVE, EXCLUSIVE
- `taxRate`: Float, no minimum constraint (supports zero tax)
- Defaults are Rwanda-specific but configurable per business

### 1.2 TaxConfiguration Model (✅ Well-Designed)
```prisma
// prisma/schema.prisma lines 1991-2006
model TaxConfiguration {
  id          String   @id @default(cuid())
  businessId  String
  taxType     TaxType
  name        String
  rate        Float
  isInclusive Boolean  @default(true)
  isActive    Boolean  @default(true)
  priority    Int      @default(0)
}
```
Supports multiple tax configurations per business with priority ordering. This is the right architecture for multi-tax jurisdictions.

### 1.3 TaxType Enum (✅ Multi-Tax Support)
```prisma
// prisma/schema.prisma lines 2349-2355
enum TaxType {
  VAT
  SERVICE_CHARGE
  TOURISM_LEVY
  SALES_TAX
  CITY_TAX
}
```
Supports VAT (Rwanda, UK, EU), SALES_TAX (US), CITY_TAX, SERVICE_CHARGE, and TOURISM_LEVY.

### 1.4 Tax-Related Fields on Other Models
| Model | Field | Default |
|-------|-------|---------|
| SmartDiningSlip | vatRate | 18.0 |
| DeliveryOrder | vatRate | 18.0 |
| TableSession | taxRate | 18.0 |

All default to 18% but are configurable per record.

---

## 2. TaxService Assessment

### 2.1 Centralized TaxService (✅ Good Architecture)
```typescript
// src/lib/services/tax.service.ts
static async calculateTaxes(businessId: string, subtotalCents: number): Promise<TaxResult>
static async createDefaultTaxConfig(businessId: string, countryCode: string): Promise<void>
```
The service supports multiple tax types with priority ordering and inclusive/exclusive modes.

### 2.2 Country-Specific Presets (✅ Global-Ready)
```typescript
// src/lib/services/tax.service.ts lines 93-120
const configs: Record<string, Array<{...}>> = {
  RW: [{ taxType: 'VAT', name: 'VAT', rate: 18.0, isInclusive: true, priority: 1 }],
  KE: [{ taxType: 'VAT', name: 'VAT', rate: 16.0, isInclusive: true, priority: 1 }],
  UG: [{ taxType: 'VAT', name: 'VAT', rate: 18.0, isInclusive: true, priority: 1 }],
  TZ: [{ taxType: 'VAT', name: 'VAT', rate: 18.0, isInclusive: true, priority: 1 }],
  ZA: [{ taxType: 'VAT', name: 'VAT', rate: 15.0, isInclusive: true, priority: 1 }],
  NG: [{ taxType: 'VAT', name: 'VAT', rate: 7.5, isInclusive: true, priority: 1 }],
  US: [{ taxType: 'SALES_TAX', name: 'Sales Tax', rate: 8.0, isInclusive: false, priority: 1 }],
  GB: [{ taxType: 'VAT', name: 'VAT', rate: 20.0, isInclusive: true, priority: 1 }],
  AE: [{ taxType: 'VAT', name: 'VAT', rate: 5.0, isInclusive: true, priority: 1 }],
}
```
9 countries supported with correct tax types and rates.

### 2.3 Fallback to Rwanda (⚠️ Architecture Risk)
```typescript
// src/lib/services/tax.service.ts line 122
const countryTaxes = configs[countryCode] || configs['RW']
```
If country is not in the preset list, it falls back to Rwanda (18% VAT). Should fall back to zero tax or require explicit configuration.

### 2.4 TaxService Underutilized (❌ Architecture Risk)
TaxService exists but is NOT consistently used. Tax calculation is scattered across:
- `src/lib/services/tax.service.ts` (centralized)
- `src/lib/services/smart-dining-slip.service.ts` (own logic)
- `src/lib/services/qr-order.service.ts` (own logic)
- `src/lib/services/split-payment.service.ts` (own logic)
- `src/pages/api/reports/close-day.ts` (own logic)
- `src/lib/pricing/ebm-formatter.ts` (hardcoded 18%)

---

## 3. Hardcoded 18% VAT Classification

### 3.1 Default Values (⚠️ Acceptable if Configurable)
| File | Line | Code |
|------|------|------|
| `prisma/schema.prisma` | 219 | `taxRate Float @default(18.0)` |
| `prisma/schema.prisma` | 1144 | `vatRate Float @default(18.0)` |
| `prisma/schema.prisma` | 1269 | `vatRate Float @default(18.0)` |
| `prisma/schema.prisma` | 3507 | `taxRate Float @default(18.0)` |
| `src/lib/services/tax.service.ts` | 36 | `const defaultVAT = 18.0` |
| `src/lib/services/qr-order.service.ts` | 54 | `taxRate: number = 18.0` |

### 3.2 Hardcoded Assumptions (❌ Architecture Risk)
| File | Line | Code | Impact |
|------|------|------|--------|
| `src/lib/services/irembopay.service.ts` | 199-200 | `grossAmountCents * 18 / 118` | Platform payment VAT hardcoded |
| `src/pages/api/subscriptions/initiate-payment.ts` | 109-110 | `const VAT_RATE = 0.18` | Subscription invoices always 18% |
| `src/pages/api/marketplace/orders/pay.ts` | 68-69 | `const VAT_RATE = 0.18` | Marketplace orders always 18% |
| `src/lib/services/reorder-autopilot.service.ts` | 362, 382 | `subtotalCents * 0.18` / `vatRate: 18.0` | AI purchase orders always 18% |
| `src/lib/services/receipt-generator.service.ts` | 134 | `<span>VAT (18%)</span>` | Receipt display hardcoded |
| `src/lib/services/commission.service.ts` | 182 | `(18%):` | Commission invoice display hardcoded |
| `src/lib/pricing/ebm-formatter.ts` | 49 | `const vatRate = 18.0` | EBM receipt hardcoded |
| `src/pages/api/sales/index.ts` | 99 | `vatRate: 18` | Sales API EBM hardcoded |

### 3.3 Fallback to 18% (⚠️ Should Fallback to Config)
| File | Line | Code |
|------|------|------|
| `src/pages/api/reports/close-day.ts` | 98 | `business?.taxRate \|\| 18.0` |
| `src/lib/services/smart-dining-slip.service.ts` | 333 | `buyerBusiness?.taxRate \|\| 18.0` |
| `src/lib/services/dining-session-slip.service.ts` | 48 | `input.taxRate \|\| 18.0` |
| `src/pages/api/dev/bootstrap-tap-leave.ts` | 67 | `business.taxRate \|\| 18` |

---

## 4. Tax Capabilities Assessment

| Capability | Supported | Evidence |
|-----------|-----------|----------|
| VAT | ✅ Yes | TaxType enum, TaxService presets |
| GST | ❌ No | Not in TaxType enum (could use VAT) |
| Sales Tax | ✅ Yes | TaxType.SALES_TAX, US preset |
| Zero Tax | ✅ Yes | taxRate can be 0, UI allows min="0" |
| Inclusive Pricing | ✅ Yes | TaxMode.INCLUSIVE |
| Exclusive Pricing | ✅ Yes | TaxMode.EXCLUSIVE |
| Multiple Tax Rates | ✅ Yes | TaxConfiguration with priority |
| Tax Exemptions | ❌ No | No per-item tax exemption |
| Per-Item Tax Rates | ❌ No | MenuItem has no taxRate field |
| Country-Specific Presets | ✅ Yes | 9 countries in TaxService |

---

## 5. Regulatory Compliance

### 5.1 EBM (Electronic Billing Machine) — Rwanda-Specific by Design
```typescript
// src/lib/pricing/ebm-formatter.ts
// Rwanda RRA-compliant receipt formatting
const vatRate = 18.0; // Rwanda standard VAT
item_ct: line.vatRate === 18 ? 'B' : line.vatRate === 0 ? 'E' : 'A',
```
EBM is Rwanda's fiscal compliance requirement. This is intentionally Rwanda-specific. For other countries, a different fiscal formatter would be needed.

### 5.2 WHT (Withholding Tax) — Rwanda-Specific
```typescript
// src/lib/pricing/fee-config.ts lines 32-36
tax: {
  vatRate: 18.0,
  whtRate: 15.0, // Default WHT rate (confirm with RRA)
  ebmCompliant: true,
}
```
WHT at 15% is a Rwanda B2B requirement. Other countries have different WHT rates or none.

### 5.3 TIN (Tax Identification Number) — ✅ Supported
```prisma
// prisma/schema.prisma line 3214
taxId String? // TIN number
```
TIN field exists and is translatable in locales.

### 5.4 Dead Code
```typescript
// src/utils/rwandaUtils.ts lines 79-82
export function getVATRate(): number {
  return 18 // 18%
}
```
Rwanda-specific utility functions exist but are NOT USED anywhere. Dead code that should be removed.

---

## 6. Signup Flow Tax Default (❌ Architecture Risk)

```typescript
// src/pages/api/auth/signup.ts lines 135-160
const restaurant = await prisma.business.create({
  data: {
    country: 'RW', // HARDCODED
    currency: 'RWF',
    // NO taxRate or taxMode set — relies on schema default (18.0, EXCLUSIVE)
  },
})
```
- Country is hardcoded to 'RW'
- Tax rate is NOT set during signup — relies on Prisma default (18.0)
- No call to `TaxService.createDefaultTaxConfig()` during signup
- Tax defaults are effectively hardcoded to Rwanda because country is hardcoded

---

## 7. Architecture Classification

| Finding | Classification |
|---------|---------------|
| TaxConfiguration model | Already Global |
| TaxType enum (5 types) | Already Global |
| TaxService with 9 country presets | Already Global |
| Inclusive/Exclusive modes | Already Global |
| Zero tax support | Already Global |
| TIN field | Already Global |
| Default 18.0 on schema fields | Configurable |
| `business?.taxRate \|\| 18.0` pattern | Configurable |
| Hardcoded 18% in 8 locations | Rwanda-Specific Assumption |
| Tax calculation scattered (not centralized) | Immediate Architecture Risk |
| EBM formatter | Rwanda-Specific by Design |
| WHT 15% | Rwanda-Specific by Design |
| No per-item tax rates | Future Evolution |
| No tax exemptions | Future Evolution |
| Signup hardcodes country to 'RW' | Rwanda-Specific Assumption |
| TaxService fallback to RW | Rwanda-Specific Assumption |

---

## 8. Recommendations

### Immediate Actions (Before International Expansion)
1. Centralize all tax calculation through TaxService — remove duplicate logic from smart-dining-slip, qr-order, split-payment, close-day
2. Replace hardcoded `VAT_RATE = 0.18` in subscriptions, marketplace, and irembopay with business.taxRate
3. Replace hardcoded `vatRate: 18` in sales API with business.taxRate
4. Remove hardcoded "VAT (18%)" display text in receipts and commission invoices — use dynamic rate
5. Call `TaxService.createDefaultTaxConfig()` during signup based on business country
6. Change TaxService fallback from `configs['RW']` to zero tax or explicit configuration requirement

### Before International Expansion
7. Add per-item tax rate support (taxRate field on MenuItem)
8. Add tax exemption support (isTaxExempt field on MenuItem)
9. Make EBM formatter pluggable — support different fiscal formatters per country
10. Make WHT rate configurable per country

### Post-Growth Evolution
11. Add GST tax type to TaxType enum
12. Implement tax-exempt categories
13. Add compound tax support (e.g., US state + local sales tax)
14. Remove dead code in rwandaUtils.ts
