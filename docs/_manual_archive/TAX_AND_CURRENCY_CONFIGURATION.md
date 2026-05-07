# Tax and Currency Configuration Guide

**Version:** 1.0  
**Date:** March 22, 2026  
**Status:** ✅ IMPLEMENTED

---

## Overview

The platform now supports **configurable tax (VAT) handling** and **multi-country currency support** to reduce customer friction, maintain legal compliance, and enable clean multi-country expansion.

---

## Core Features

### 1. Tax Display Modes

Businesses can choose how VAT is displayed to customers:

| Mode | Description | Customer Sees | Backend Calculation |
|------|-------------|---------------|---------------------|
| **INCLUSIVE** | Menu prices include VAT | "Total: RWF 11,800<br>*VAT included*" | VAT extracted from total |
| **EXCLUSIVE** | VAT added at checkout | "Subtotal: RWF 10,000<br>VAT (18%): RWF 1,800<br>**Total: RWF 11,800**" | VAT added to subtotal |

### 2. Configurable Tax Rate

Tax rate is **no longer hardcoded** at 18%. Each business can set their own rate based on country:

| Country | Default Tax Rate | Currency |
|---------|------------------|----------|
| **Rwanda** | 18% | RWF |
| **Kenya** | 16% | KES |
| **Uganda** | 18% | UGX |
| **Tanzania** | 18% | TZS |
| **Other** | Configurable | Configurable |

### 3. Multi-Currency Support

All UI displays use the business's configured currency. No forced conversion to RWF.

---

## Database Schema

### Business Model

```prisma
model Business {
  // ... existing fields
  
  currency  String   @default("RWF")  // RWF, KES, UGX, TZS, etc.
  taxMode   TaxMode  @default(EXCLUSIVE)
  taxRate   Float    @default(18.0)
  
  // ... other fields
}

enum TaxMode {
  INCLUSIVE
  EXCLUSIVE
}
```

### SmartDiningSlip Model

```prisma
model SmartDiningSlip {
  // ... existing fields
  
  vatRate   Float   @default(18.0)
  taxMode   String  @default("EXCLUSIVE")
  
  // ... other fields
}
```

---

## Tax Calculation Logic

### INCLUSIVE Mode

**Concept:** Menu prices already include VAT. Extract the VAT portion for reporting.

**Formula:**
```
Total = Menu Price Sum
VAT = Total × (rate / (100 + rate))
Subtotal = Total - VAT
```

**Example (18% VAT):**
```
Menu Price Sum: RWF 11,800
VAT = 11,800 × (18 / 118) = RWF 1,800
Subtotal = 11,800 - 1,800 = RWF 10,000
```

**Customer sees:**
```
Total: RWF 11,800
VAT included
```

### EXCLUSIVE Mode

**Concept:** VAT is added on top of menu prices at checkout.

**Formula:**
```
Subtotal = Menu Price Sum
VAT = Subtotal × (rate / 100)
Total = Subtotal + VAT
```

**Example (18% VAT):**
```
Menu Price Sum: RWF 10,000
VAT = 10,000 × 0.18 = RWF 1,800
Total = 10,000 + 1,800 = RWF 11,800
```

**Customer sees:**
```
Subtotal: RWF 10,000
VAT (18%): RWF 1,800
Total: RWF 11,800
```

---

## Implementation Details

### 1. Order Pricing Service

**File:** `src/lib/services/qr-order.service.ts`

```typescript
export async function calculateOrderPricing(
  branchId: string,
  items: OrderItem[],
  paymentMethod: 'DIGITAL' | 'CASH',
  isRemote: boolean,
  requireDeposit: boolean,
  depositPercent: number = 50,
  taxMode: 'INCLUSIVE' | 'EXCLUSIVE' = 'EXCLUSIVE',
  taxRate: number = 18.0
): Promise<OrderPricing> {
  // ... fetch menu items
  
  const menuPriceSumCents = /* sum of item prices */;
  
  if (taxMode === 'INCLUSIVE') {
    // Extract VAT from total
    totalCents = menuPriceSumCents;
    vatCents = Math.round(totalCents * (taxRate / (100 + taxRate)));
    subtotalCents = totalCents - vatCents;
  } else {
    // Add VAT on top
    subtotalCents = menuPriceSumCents;
    vatCents = Math.round(subtotalCents * (taxRate / 100));
    totalCents = subtotalCents + vatCents;
  }
  
  return {
    subtotalCents,
    vatCents,
    totalCents,
    taxMode,
    taxRate,
    // ... other fields
  };
}
```

### 2. Split Payment Service

**File:** `src/lib/services/split-payment.service.ts`

```typescript
export async function calculateSplitPaymentPricing(
  businessId: string,
  items: SplitPaymentItem[]
): Promise<SplitPaymentPricing> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      taxMode: true,
      taxRate: true,
      splitPaymentConvenienceFeeEnabled: true,
      splitPaymentConvenienceFeePercent: true
    }
  });
  
  // Calculate item subtotal
  const itemSubtotalCents = /* sum of items */;
  
  // Add convenience fee if enabled
  const convenienceFeeCents = business.splitPaymentConvenienceFeeEnabled
    ? Math.round(itemSubtotalCents * (business.splitPaymentConvenienceFeePercent / 100))
    : 0;
  
  // Calculate VAT based on tax mode
  if (business.taxMode === 'INCLUSIVE') {
    const itemsWithConvenienceCents = itemSubtotalCents + convenienceFeeCents;
    vatCents = Math.round(itemsWithConvenienceCents * (business.taxRate / (100 + business.taxRate)));
    totalCents = itemsWithConvenienceCents;
  } else {
    vatCents = Math.round(itemSubtotalCents * (business.taxRate / 100));
    totalCents = itemSubtotalCents + convenienceFeeCents + vatCents;
  }
  
  return {
    itemSubtotalCents,
    convenienceFeeCents,
    vatCents,
    totalCents,
    taxMode: business.taxMode,
    taxRate: business.taxRate
  };
}
```

### 3. Smart Dining Slip Service

**File:** `src/lib/services/smart-dining-slip.service.ts`

```typescript
static async generateSlip(input: GenerateSlipInput) {
  const sale = await prisma.sale.findUnique({
    where: { id: input.saleId },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          district: true,
          taxMode: true,
          taxRate: true
        }
      },
      // ... other includes
    }
  });
  
  // Calculate totals based on tax mode
  const itemsTotalCents = sale.items.reduce((sum, item) => sum + item.totalPriceCents, 0);
  
  if (sale.business.taxMode === 'INCLUSIVE') {
    grandTotalCents = itemsTotalCents;
    vatCents = Math.round(grandTotalCents * (sale.business.taxRate / (100 + sale.business.taxRate)));
    subtotalCents = grandTotalCents - vatCents;
  } else {
    subtotalCents = itemsTotalCents;
    vatCents = Math.round(subtotalCents * (sale.business.taxRate / 100));
    grandTotalCents = subtotalCents + vatCents;
  }
  
  const slip = await prisma.smartDiningSlip.create({
    data: {
      // ... other fields
      subtotalCents,
      vatCents,
      vatRate: sale.business.taxRate,
      grandTotalCents,
      taxMode: sale.business.taxMode
    }
  });
}
```

### 4. Draft Order API

**File:** `src/pages/api/public/order/draft.ts`

```typescript
// Fetch business tax configuration
const business = await prisma.business.findUnique({
  where: { id: claims.branchId },
  select: {
    // ... other fields
    taxMode: true,
    taxRate: true,
    currency: true
  }
});

// Pass to pricing calculation
const pricing = await calculateOrderPricing(
  business.id,
  items,
  'DIGITAL',
  isRemote,
  business.requireDepositRemote,
  business.defaultDepositPercent,
  business.taxMode,
  business.taxRate
);

// Include in response
return res.status(201).json({
  // ... other fields
  summary: {
    subtotalCents: pricing.subtotalCents,
    vatCents: pricing.vatCents,
    totalCents: pricing.totalCents,
    taxMode: pricing.taxMode,
    taxRate: pricing.taxRate,
    currency: business.currency
  }
});
```

---

## Smart Dining Slip Display Logic

### INCLUSIVE Mode

**Main Bill View:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMBONI RESTAURANT
Kigali, Rwanda
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Beef Brochette x2    RWF 11,800
Chips                RWF  5,900

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL               RWF 17,700
VAT included (18%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Optional Expandable Breakdown (subtle):**
```
[Show breakdown ▼]

Subtotal (ex VAT):  RWF 15,000
VAT (18%):          RWF  2,700
Total:              RWF 17,700
```

### EXCLUSIVE Mode

**Main Bill View:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMBONI RESTAURANT
Kigali, Rwanda
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Beef Brochette x2    RWF 10,000
Chips                RWF  5,000

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Subtotal            RWF 15,000
VAT (18%)           RWF  2,700
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL               RWF 17,700
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Business Configuration

### Default Settings for Existing Businesses

To maintain backward compatibility, all existing businesses default to:

```typescript
{
  taxMode: 'EXCLUSIVE',  // Current behavior
  taxRate: 18.0,         // Rwanda default
  currency: 'RWF'        // Rwanda default
}
```

### Changing Tax Configuration

**Via API (manual):**
```typescript
await prisma.business.update({
  where: { id: businessId },
  data: {
    taxMode: 'INCLUSIVE',  // or 'EXCLUSIVE'
    taxRate: 16.0,         // e.g., Kenya
    currency: 'KES'        // e.g., Kenya Shillings
  }
});
```

**Via Dashboard UI (to be built):**
```
Settings > Tax & Currency

Tax Display Mode:
○ Exclusive (add VAT at checkout)
● Inclusive (prices include VAT)

Tax Rate: [18.0] %

Currency: [RWF ▼]
  - RWF (Rwandan Franc)
  - KES (Kenyan Shilling)
  - UGX (Ugandan Shilling)
  - TZS (Tanzanian Shilling)
```

---

## Multi-Country Support

### Country-Specific Defaults

When a business is created, set defaults based on country:

```typescript
const countryDefaults = {
  RW: { taxRate: 18.0, currency: 'RWF' },
  KE: { taxRate: 16.0, currency: 'KES' },
  UG: { taxRate: 18.0, currency: 'UGX' },
  TZ: { taxRate: 18.0, currency: 'TZS' }
};

const defaults = countryDefaults[business.country] || { taxRate: 18.0, currency: 'RWF' };
```

### Currency Display

All UI components must use `business.currency` for display:

```typescript
// ❌ WRONG: Hardcoded currency
<p>Total: RWF {totalCents / 100}</p>

// ✅ CORRECT: Use business currency
<p>Total: {business.currency} {totalCents / 100}</p>
```

---

## API Response Changes

### Draft Order Response

**Before:**
```json
{
  "summary": {
    "subtotalCents": 10000,
    "vatCents": 1800,
    "totalCents": 11800
  }
}
```

**After:**
```json
{
  "summary": {
    "subtotalCents": 10000,
    "vatCents": 1800,
    "totalCents": 11800,
    "taxMode": "EXCLUSIVE",
    "taxRate": 18.0,
    "currency": "RWF"
  }
}
```

### Split Payment Response

```json
{
  "itemSubtotalCents": 2500,
  "convenienceFeeCents": 25,
  "vatCents": 450,
  "totalCents": 2975,
  "taxMode": "EXCLUSIVE",
  "taxRate": 18.0,
  "convenienceFeeEnabled": true,
  "convenienceFeePercent": 1.0
}
```

---

## Benefits

### 1. Reduced Customer Friction

**INCLUSIVE mode:**
- Customers see final price immediately
- No surprise VAT at checkout
- Matches how most restaurants display prices globally
- **Higher conversion rates**

### 2. Legal Compliance

- VAT still calculated and reported correctly
- Businesses can choose display mode based on local regulations
- Tax rate configurable per country

### 3. Multi-Country Expansion

- No hardcoded tax rates or currencies
- Easy to onboard businesses from different countries
- Proper currency display (no forced RWF conversion)

### 4. Flexibility

- Businesses can switch between INCLUSIVE/EXCLUSIVE modes
- Tax rate adjustable if regulations change
- Future-proof for new countries

---

## Migration Strategy

### Phase 1: Existing Businesses (Automatic)

All existing businesses automatically get:
```sql
UPDATE "Restaurant" 
SET 
  "taxMode" = 'EXCLUSIVE',
  "taxRate" = 18.0
WHERE "taxMode" IS NULL;
```

### Phase 2: New Businesses

Set defaults based on country during onboarding:
```typescript
const business = await prisma.business.create({
  data: {
    // ... other fields
    country: 'KE',
    taxMode: 'EXCLUSIVE',
    taxRate: 16.0,  // Kenya default
    currency: 'KES'
  }
});
```

### Phase 3: Opt-In Migration

Businesses can switch to INCLUSIVE mode via dashboard settings.

---

## Testing Checklist

- [ ] Create order with EXCLUSIVE mode (18% VAT) - verify VAT added on top
- [ ] Create order with INCLUSIVE mode (18% VAT) - verify VAT extracted from total
- [ ] Create order with EXCLUSIVE mode (16% VAT) - verify Kenya tax rate works
- [ ] Create split payment with INCLUSIVE mode - verify convenience fee + VAT calculation
- [ ] Generate Smart Dining Slip with INCLUSIVE mode - verify display shows "VAT included"
- [ ] Generate Smart Dining Slip with EXCLUSIVE mode - verify full breakdown shown
- [ ] Verify currency displays correctly (KES, UGX, TZS)
- [ ] Verify backward compatibility - existing orders still work

---

## Future Enhancements

### 1. Tax Exemptions

Support tax-exempt items (e.g., basic food items in some countries):

```prisma
model MenuItem {
  // ... existing fields
  taxExempt Boolean @default(false)
}
```

### 2. Multiple Tax Rates

Support different tax rates for different item categories:

```prisma
model MenuItem {
  // ... existing fields
  taxRateOverride Float?  // Override business default
}
```

### 3. Tax Holidays

Support temporary tax rate changes (e.g., government tax holidays):

```prisma
model Business {
  // ... existing fields
  taxHolidayStartDate DateTime?
  taxHolidayEndDate   DateTime?
  taxHolidayRate      Float?
}
```

---

## Files Modified

### Core Services
- ✅ `src/lib/services/qr-order.service.ts` — Tax mode support in pricing
- ✅ `src/lib/services/split-payment.service.ts` — Tax mode support in split payments
- ✅ `src/lib/services/smart-dining-slip.service.ts` — Tax mode support in slips

### API Endpoints
- ✅ `src/pages/api/public/order/draft.ts` — Fetch and pass tax config

### Schema
- ✅ `prisma/schema.prisma` — Added `TaxMode` enum, `taxMode` and `taxRate` to Business and SmartDiningSlip

### Documentation
- ✅ `TAX_AND_CURRENCY_CONFIGURATION.md` — This file
- ⏳ `PRICING_MODEL_UPDATE.md` — To be updated with tax mode info

---

## Support & Troubleshooting

### Common Issues

**Q: Existing orders showing wrong VAT calculation**  
A: Existing orders use the old hardcoded 18% rate. New orders will use business.taxRate.

**Q: Can I change tax mode after business is created?**  
A: Yes, via dashboard settings (to be built) or manual database update.

**Q: What if my country has multiple VAT rates?**  
A: Currently, one rate per business. Future enhancement will support item-level overrides.

**Q: How do I set up a business in Kenya?**  
A: Set `country: 'KE'`, `taxRate: 16.0`, `currency: 'KES'` during business creation.

**Q: Will changing taxMode affect existing slips?**  
A: No. Each slip stores its own `taxMode` and `taxRate` at creation time.

---

**Implementation Status:** ✅ COMPLETE  
**Testing Status:** ⏳ PENDING  
**Production Ready:** ⏳ PENDING TESTS & UI
