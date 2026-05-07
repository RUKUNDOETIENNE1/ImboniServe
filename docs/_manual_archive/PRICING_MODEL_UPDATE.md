# Pricing Model Update — Business Commission Model

**Version:** 3.0  
**Date:** March 22, 2026  
**Status:** ✅ IMPLEMENTED

---

## Overview

The platform has transitioned from a **customer-pays platform fee** model to a **business-pays commission** model for better conversion rates and competitive positioning.

---

## New Pricing Structure

### Core Model

| Payment Type | Customer Fee | Business Commission |
|-------------|--------------|---------------------|
| **Standard Digital Payment** | 0% | 5% |
| **Split Bill Payment** | 0-1.5% (optional, configurable) | 5% |
| **Cash Payment** | 0% | 0% |

### Key Changes

**Before:**
- Customer paid 5% platform fee on digital orders
- Visible line item on bill
- Higher cart abandonment
- Business received full menu price

**After:**
- Customer pays 0% platform fee (only menu price + VAT)
- Business pays 5% commission at payout/settlement
- Optional 1-1.5% convenience fee for split bills only
- Lower friction, higher conversion

---

## Implementation Details

### 1. Customer-Facing Calculations

**File:** `src/lib/services/qr-order.service.ts`

```typescript
// OLD (removed):
const platformFeeCents = paymentMethod === 'DIGITAL' 
  ? Math.round(subtotalCents * 0.05) 
  : 0;

// NEW:
const platformFeeCents = 0; // No customer-facing fee

// Total calculation:
const totalCents = subtotalCents + vatCents; // Platform fee removed
```

**Customer sees:**
```
Subtotal: RWF 10,000
VAT (18%): RWF 1,800
Total: RWF 11,800  ✅ No platform fee
```

---

### 2. Business Commission (Payout Level)

**File:** `src/lib/services/business-payout.service.ts`

```typescript
const PLATFORM_COMMISSION_PERCENT = 5.0;

export function calculateBusinessPayout(grossAmountCents: number) {
  const platformCommissionCents = Math.round(
    grossAmountCents * (PLATFORM_COMMISSION_PERCENT / 100)
  );
  const netPayoutCents = grossAmountCents - platformCommissionCents;

  return {
    grossAmountCents,      // What customer paid
    platformCommissionCents, // 5% platform takes
    netPayoutCents,        // What business receives
    commissionPercent: 5.0
  };
}
```

**Business receives:**
```
Gross Revenue: RWF 10,000
Platform Commission (5%): -RWF 500
Net Payout: RWF 9,500
```

---

### 3. Split Payment Convenience Fee

**File:** `src/lib/services/split-payment.service.ts`

**Schema Fields (Business model):**
```prisma
model Business {
  // ...
  splitPaymentConvenienceFeeEnabled Boolean @default(false)
  splitPaymentConvenienceFeePercent Float   @default(1.0)
}
```

**Calculation:**
```typescript
export async function calculateSplitPaymentPricing(
  businessId: string,
  items: SplitPaymentItem[]
): Promise<SplitPaymentPricing> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      splitPaymentConvenienceFeeEnabled: true,
      splitPaymentConvenienceFeePercent: true
    }
  });

  // Calculate item subtotal
  const itemSubtotalCents = /* sum of items */;

  // Apply convenience fee ONLY if enabled
  const convenienceFeeCents = business.splitPaymentConvenienceFeeEnabled
    ? Math.round(itemSubtotalCents * (business.splitPaymentConvenienceFeePercent / 100))
    : 0;

  // VAT on subtotal only (not on convenience fee)
  const vatCents = Math.round(itemSubtotalCents * 0.18);

  // Total
  const totalCents = itemSubtotalCents + convenienceFeeCents + vatCents;

  return {
    itemSubtotalCents,
    convenienceFeeCents,
    vatCents,
    totalCents,
    convenienceFeePercent: business.splitPaymentConvenienceFeePercent,
    convenienceFeeEnabled: business.splitPaymentConvenienceFeeEnabled
  };
}
```

**Split bill customer sees:**
```
Your Items: RWF 2,500
Convenience Fee (1%): RWF 25  ← Optional, configurable
VAT (18%): RWF 450
Your Total: RWF 2,975
```

---

## API Changes

### Updated Endpoints

#### 1. `/api/public/order/draft` (Modified)
**Change:** Removed `platformFeeCents` from customer bill

**Before:**
```json
{
  "summary": {
    "subtotalCents": 10000,
    "platformFeeCents": 500,  ← Removed
    "vatCents": 1800,
    "totalCents": 12300
  }
}
```

**After:**
```json
{
  "summary": {
    "subtotalCents": 10000,
    "platformFeeCents": 0,
    "vatCents": 1800,
    "totalCents": 11800
  }
}
```

#### 2. `/api/business/payout-summary` (New)
**Purpose:** Show business commission breakdown

**Request:**
```
GET /api/business/payout-summary?businessId=X&startDate=2026-03-01&endDate=2026-03-31
```

**Response:**
```json
{
  "sales": [
    {
      "id": "sale_123",
      "orderNumber": "ORD-123",
      "totalAmountCents": 10000,
      "payout": {
        "grossAmountCents": 10000,
        "platformCommissionCents": 500,
        "netPayoutCents": 9500,
        "commissionPercent": 5.0
      }
    }
  ],
  "summary": {
    "totalGrossCents": 100000,
    "totalCommissionCents": 5000,
    "totalNetPayoutCents": 95000,
    "commissionPercent": 5.0,
    "salesCount": 10
  }
}
```

---

## Database Schema Changes

### Business Model
```prisma
model Business {
  // ... existing fields
  
  // NEW: Split payment convenience fee configuration
  splitPaymentConvenienceFeeEnabled Boolean @default(false)
  splitPaymentConvenienceFeePercent Float   @default(1.0)
}
```

**Migration:** ✅ Pushed to Supabase via `prisma db push`

---

## Business Configuration

### Enabling Split Payment Convenience Fee

**Dashboard UI (to be built):**
```
Settings > Payments > Split Bill Configuration

☐ Enable convenience fee for split payments
  └─ Fee percentage: [1.0]% (recommended: 1.0-1.5%)
  
Label shown to customers: "Convenience fee for instant split payment"
```

**API (manual configuration):**
```typescript
await prisma.business.update({
  where: { id: businessId },
  data: {
    splitPaymentConvenienceFeeEnabled: true,
    splitPaymentConvenienceFeePercent: 1.0  // 1%
  }
});
```

---

## Revenue Impact Analysis

### Example: RWF 10,000 Order

| Metric | Old Model | New Model | Change |
|--------|-----------|-----------|--------|
| **Customer Pays** | RWF 12,300 | RWF 11,800 | -4.1% ✅ |
| **Business Receives** | RWF 10,000 | RWF 9,500 | -5% |
| **Platform Revenue** | RWF 500 | RWF 500 | 0% |
| **Conversion Rate** | Baseline | +15-25% (est.) | ✅ |

### Net Effect
- **Customer:** Pays 4.1% less → higher conversion
- **Business:** Pays 5% commission → industry standard
- **Platform:** Same revenue per transaction, but **higher volume** due to better conversion

---

## Strategic Benefits

### 1. **Higher Conversion Rates**
- No visible platform fee → less cart abandonment
- Customers only see menu price + VAT
- Competitive with cash pricing

### 2. **Industry Standard**
- Uber Eats, DoorDash, Glovo charge 15-30%
- Our 5% is **highly competitive**
- Businesses expect to pay commission

### 3. **Flexible Revenue Optimization**
- Can negotiate rates per business (volume discounts)
- Premium businesses might pay 7-10%
- High-volume businesses might get 3-4%

### 4. **Split Bill Monetization**
- Optional 1-1.5% convenience fee
- Only applies to split payments
- Clearly labeled and justified
- Additional revenue stream without hurting standard orders

---

## Backward Compatibility

✅ **All changes are backward-compatible:**
- Existing orders still work
- Old `platformFeeCents` field still exists (set to 0)
- No breaking changes to APIs
- VAT calculation unchanged

---

## Testing Checklist

- [x] Schema updated with new Business fields
- [x] Prisma client regenerated
- [x] Database pushed to Supabase
- [x] Customer-facing platform fee removed from calculations
- [x] Business payout service created
- [x] Split payment service with convenience fee created
- [x] Draft order API updated
- [x] Business payout summary API created
- [x] TypeScript compilation clean (0 errors)
- [ ] Manual testing: Create order and verify customer sees no platform fee
- [ ] Manual testing: Verify business payout calculation is correct
- [ ] Manual testing: Enable split payment convenience fee and verify calculation
- [ ] Update dashboard UI to show business commission breakdown
- [ ] Update business settings UI to configure split payment fee

---

## Next Steps

### Immediate (Required for Launch)
1. **Update REFINED_IMPLEMENTATION_PLAN.md** with new pricing model
2. **Test end-to-end flow** with new pricing
3. **Update business onboarding** to explain commission model

### Short-term (Nice to Have)
1. Build dashboard UI for payout summary
2. Build settings UI for split payment fee configuration
3. Add commission breakdown to business reports
4. Create business-facing documentation on commission model

### Long-term (Optimization)
1. Implement tiered commission rates (volume-based)
2. A/B test convenience fee percentages (1% vs 1.5%)
3. Add commission rate negotiation for premium businesses
4. Build automated payout system with commission deduction

---

## Files Modified

### Core Services
- ✅ `src/lib/services/qr-order.service.ts` — Removed customer platform fee
- ✅ `src/lib/services/business-payout.service.ts` — Created (new)
- ✅ `src/lib/services/split-payment.service.ts` — Created (new)

### API Endpoints
- ✅ `src/pages/api/public/order/draft.ts` — Removed platformFeeCents from response
- ✅ `src/pages/api/business/payout-summary.ts` — Created (new)

### Schema
- ✅ `prisma/schema.prisma` — Added split payment fee fields to Business model

### Documentation
- ✅ `PRICING_MODEL_UPDATE.md` — Created (this file)
- ⏳ `REFINED_IMPLEMENTATION_PLAN.md` — To be updated

---

## Support & Troubleshooting

### Common Questions

**Q: Will existing orders be affected?**  
A: No. Existing orders remain unchanged. Only new orders use the new pricing model.

**Q: Can businesses opt out of the 5% commission?**  
A: No. The 5% commission is platform-wide and non-negotiable (for now). Future: tiered rates.

**Q: Is the split payment convenience fee mandatory?**  
A: No. It's optional and disabled by default. Businesses can enable it in settings.

**Q: How do customers know about the convenience fee?**  
A: It's clearly labeled as "Convenience fee for instant split payment" on the payment screen.

**Q: What if a business wants a lower commission rate?**  
A: Contact platform admin for custom rate negotiation (future feature).

---

**Implementation Status:** ✅ COMPLETE  
**Testing Status:** ⏳ PENDING  
**Production Ready:** ⏳ PENDING TESTS
