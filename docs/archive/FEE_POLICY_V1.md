# Imboni Serve V1 Fee Policy & Implementation Guide

## Executive Summary
This document outlines the approved V1 pricing policy for Imboni Serve, including digital payment convenience fees, marketplace commissions, and Rwanda tax compliance.

---

## 1. Digital Payment Convenience Fee

### Policy
- **Fee Rate**: 5% (VAT-inclusive)
- **Applies To**: Card payments, mobile money (Pesapal)
- **Does NOT Apply To**: Cash, bank transfers
- **Minimum Fee**: RWF 100
- **Maximum Fee**: RWF 3,500
- **Tips**: Excluded from fee calculation

### Customer Communication

#### English
"Paying by card or mobile money includes a 5% digital payment convenience fee (VAT included). Pay with cash to avoid this fee."

#### Kinyarwanda
"Niwishyura ukoresheje ikarita cyangwa Mobile Money hiyongeraho amafaranga ya serivisi 5% (harimo TVA). Niba wishyuye mu mafaranga (cash) nta kiguzi cyiyongera."

### Examples
- **RWF 10,000 bill**: Fee = RWF 500 → Total = RWF 10,500
- **RWF 2,000 bill**: Fee = RWF 100 (minimum) → Total = RWF 2,100
- **RWF 80,000 bill**: Fee = RWF 3,500 (capped) → Total = RWF 83,500
- **RWF 10,000 + RWF 1,000 tip**: Fee = RWF 500 (on base only) → Total = RWF 11,500

### Financial Impact
- Gateway cost: ~3.5% (RWF 420 on RWF 12,000)
- 5% fee: RWF 600
- Net cushion: ~RWF 180 (covers reconciliation, fraud prevention, support)

---

## 2. Marketplace Commission (Seller-Side)

### Commission Tiers

| Tier | Rate | Condition | Description |
|------|------|-----------|-------------|
| **Launch** | 10% + VAT | < 10 orders OR marketing support | New sellers, promotional campaigns |
| **Standard** | 7% + VAT | Default | Most sellers |
| **High Volume** | 5% + VAT | > RWF 5M GMV/month | Volume partners |

### VAT Treatment
- Commission is subject to 18% VAT
- VAT-registered sellers can claim input VAT credit
- Example: RWF 100,000 order at 7% = RWF 7,000 commission + RWF 1,260 VAT = RWF 8,260 total

### Withholding Tax (WHT)
- Optional WHT capture enabled (15% default rate)
- Applies to B2B commission invoices per RRA rules
- Platform tracks WHT credits for sellers
- Example: RWF 7,000 commission → RWF 1,050 WHT withheld → RWF 5,950 net commission (before VAT)

### Commission Invoice Format
```
========================================
Imboni Serve - COMMISSION INVOICE
========================================
Invoice ID: INV-1234567890
Date: 18/01/2026
Seller: ABC Suppliers Ltd

COMMISSION BREAKDOWN:
----------------------------------------
Gross Order Amount: RWF 100,000
Commission Rate: 7% (standard)
Commission Amount: RWF 7,000
VAT on Commission (18%): RWF 1,260
Total Commission: RWF 8,260
WHT Withheld (15%): RWF 1,050
========================================
NET TO SELLER: RWF 90,690
========================================

Payment Terms: Net 7 days
```

---

## 3. Rwanda Tax Compliance

### VAT (18%)
- All fees and commissions are subject to 18% VAT
- VAT is embedded in customer-facing convenience fee (5% shown is VAT-inclusive)
- Marketplace commission VAT is added separately (7% + VAT = 8.26% effective)

### EBM Receipt Requirements
- Convenience fee shown as separate line item
- VAT breakdown included
- Payment method indicated
- All items properly categorized for RRA reporting

### Sample EBM Receipt
```
========================================
Imboni Serve - OFFICIAL RECEIPT
========================================
Date: 18/01/2026 20:45

ITEMS:
Brochette (Beef Skewers)
  2 x RWF 3,000 = RWF 6,000
  VAT (18%): RWF 915

Isombe (Cassava Leaves)
  1 x RWF 2,500 = RWF 2,500
  VAT (18%): RWF 381

Digital Payment Convenience Fee
  1 x RWF 425 = RWF 425
  VAT (18%): RWF 65

----------------------------------------
Subtotal: RWF 8,500
Convenience Fee: RWF 425
Total VAT: RWF 1,361
========================================
TOTAL: RWF 8,925
========================================
Payment Method: CARD

Thank you for your business!
```

---

## 4. Compliance Fallback Options

### If Surcharging is Restricted
Use **Cash Discount Model** (same economics, different wording):

#### English
"Menu price includes a 5% digital fee. Pay cash to get 5% discount."

#### Kinyarwanda
"Ibiciro birimo amafaranga ya serivisi 5%. Niwishyuye mu mafaranga (cash) uzabona igabanuka rya 5%."

### Alternative: Cost-Based Cap
"Convenience fee is the lower of 5% or our cost of acceptance (currently ~3.5-4%)."

### Alternative: Embedded Pricing
- Raise menu prices by 3-4%
- Remove separate fee line item
- Simplest for compliance but less transparent

---

## 5. Implementation Checklist

### Code Components Created
- ✅ `src/lib/pricing/fee-config.ts` - Configuration constants
- ✅ `src/lib/pricing/fee-calculator.ts` - VAT-aware calculations
- ✅ `src/lib/pricing/ebm-formatter.ts` - EBM receipt formatting
- ✅ `src/lib/services/commission.service.ts` - Marketplace commission logic
- ✅ `src/components/checkout/FeeDisplay.tsx` - Customer-facing fee UI
- ✅ `src/pages/admin/fee-settings.tsx` - Admin configuration panel

### Integration Points (Pending)
- [ ] Update POS checkout flow to use `calculateConvenienceFee()`
- [ ] Add `FeeDisplay` component to checkout pages
- [ ] Integrate EBM receipt generation in order completion
- [ ] Add commission calculation to marketplace order processing
- [ ] Create commission invoice generation endpoint
- [ ] Update seller dashboard with commission summary
- [ ] Add fee configuration API endpoints
- [ ] Update Terms & Conditions with fee policy
- [ ] Create customer FAQ page

### Database Schema Updates Needed
```prisma
model CommissionInvoice {
  id                String   @id @default(cuid())
  invoiceNumber     String   @unique
  sellerId          String
  seller            User     @relation(fields: [sellerId], references: [id])
  orderId           String
  order             MarketplaceOrder @relation(fields: [orderId], references: [id])
  grossAmount       Float
  commissionPercent Float
  commissionAmount  Float
  commissionVAT     Float
  totalCommission   Float
  whtAmount         Float
  whtApplied        Boolean  @default(false)
  netToSeller       Float
  tier              String   // 'launch', 'standard', 'high_volume'
  status            String   @default("pending") // 'pending', 'paid', 'disputed'
  createdAt         DateTime @default(now())
  paidAt            DateTime?
}

model FeeConfiguration {
  id                    String   @id @default(cuid())
  restaurantId          String?  @unique
  digitalFeeEnabled     Boolean  @default(true)
  digitalFeePercent     Float    @default(5.0)
  digitalFeeMin         Float    @default(100)
  digitalFeeMax         Float    @default(3500)
  cashDiscountMode      Boolean  @default(false)
  marketplaceCommStd    Float    @default(7.0)
  marketplaceCommLaunch Float    @default(10.0)
  marketplaceCommHV     Float    @default(5.0)
  vatRate               Float    @default(18.0)
  whtEnabled            Boolean  @default(true)
  whtRate               Float    @default(15.0)
  updatedAt             DateTime @updatedAt
}
```

---

## 6. Testing Scenarios

### Digital Payment Fee Tests
1. **Standard order**: RWF 12,000 → Fee RWF 600 → Total RWF 12,600
2. **Below minimum**: RWF 1,500 → Fee RWF 100 (min) → Total RWF 1,600
3. **Above maximum**: RWF 100,000 → Fee RWF 3,500 (cap) → Total RWF 103,500
4. **With tips**: RWF 10,000 + RWF 2,000 tip → Fee RWF 500 (on base) → Total RWF 12,500
5. **Cash payment**: RWF 12,000 → Fee RWF 0 → Total RWF 12,000

### Marketplace Commission Tests
1. **New seller (launch tier)**: RWF 50,000 order → 10% = RWF 5,000 + RWF 900 VAT = RWF 5,900
2. **Standard seller**: RWF 100,000 order → 7% = RWF 7,000 + RWF 1,260 VAT = RWF 8,260
3. **High-volume seller**: RWF 200,000 order → 5% = RWF 10,000 + RWF 1,800 VAT = RWF 11,800
4. **With WHT**: RWF 100,000 order, 7% commission → RWF 7,000 - RWF 1,050 WHT = RWF 5,950 net (before VAT)

---

## 7. Customer Support FAQs

### Why is there a convenience fee?
**EN**: The 5% convenience fee covers the cost of secure digital payment processing, fraud prevention, and instant payment confirmation. Cash payments have no fee.

**RW**: Amafaranga ya serivisi 5% akoreshwa mu kwishyura sisitemu y'ubuzima, kurinda uburiganya, no kwemeza kwishyura ako kanya. Kwishyura mu mafaranga nta kiguzi.

### Can I avoid the fee?
**EN**: Yes! Pay with cash to avoid the convenience fee entirely.

**RW**: Yego! Wishyure mu mafaranga (cash) kugira ngo wirinde amafaranga ya serivisi.

### Why is there a cap?
**EN**: We cap the fee at RWF 3,500 to keep it fair on large orders. You'll never pay more than that regardless of order size.

**RW**: Duhagaze amafaranga ya serivisi kuri RWF 3,500 kugira ngo bibeho ubutabera ku matungo manini. Ntuzishyura kuruta ibyo uko itungo ryaba rinini.

---

## 8. Next Steps

### Immediate (Week 1)
1. Complete POS/checkout integration
2. Test all fee calculations with real scenarios
3. Update Terms & Conditions
4. Train staff on fee communication

### Short-term (Month 1)
1. Deploy to production with monitoring
2. Gather customer feedback
3. Monitor payment mix and drop-off rates
4. Adjust if needed based on data

### Medium-term (Quarter 1)
1. Negotiate volume-based rates with Pesapal
2. Expand payment options (MTN Mobile Money, Airtel Money)
3. Implement dynamic fee optimization
4. Launch marketplace commission system

---

## 9. Key Metrics to Track

### Customer Behavior
- Payment method mix (cash vs. digital)
- Checkout abandonment rate by payment method
- Average order value by payment method
- Customer complaints/inquiries about fees

### Financial Performance
- Effective fee rate (after min/max caps)
- Net margin after payment costs
- Gateway cost as % of GMV
- Commission revenue from marketplace

### Operational
- EBM compliance rate
- Receipt generation success rate
- Commission invoice accuracy
- WHT tracking completeness

---

## 10. Contact & Support

**Technical Issues**: dev@imboni.resto
**Policy Questions**: policy@imboni.resto
**Seller Support**: sellers@imboni.resto

---

**Document Version**: 1.0  
**Last Updated**: January 18, 2026  
**Approved By**: Imboni Serve Management  
**Next Review**: April 2026
