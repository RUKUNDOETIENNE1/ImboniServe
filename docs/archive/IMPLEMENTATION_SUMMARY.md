# Imboni Serve V1 Fee Policy - Implementation Summary

## ✅ What Has Been Implemented

### 1. Core Fee Calculation Engine
**Location**: `src/lib/pricing/`

#### `fee-config.ts`
- Digital payment fee configuration (5%, min 100, max 3,500)
- Marketplace commission tiers (10%, 7%, 5%)
- Rwanda tax settings (VAT 18%, WHT 15%)
- Payment method definitions
- Display mode toggles (surcharge vs. cash-discount)

#### `fee-calculator.ts`
- `calculateConvenienceFee()` - VAT-aware digital payment fee calculation
- `calculateMarketplaceCommission()` - Seller commission with WHT support
- `formatRWF()` - Rwanda currency formatting
- `getFeeDescription()` - Bilingual customer messaging (EN/RW)
- `getCashDiscountDescription()` - Fallback compliance mode

#### `ebm-formatter.ts`
- `formatEBMReceipt()` - RRA-compliant receipt structure
- `generateEBMReceiptText()` - Human-readable receipt (EN/RW)
- `generateEBMJSON()` - Machine-readable EBM integration format
- VAT breakdown and line-item formatting

### 2. Marketplace Commission System
**Location**: `src/lib/services/commission.service.ts`

- `getSellerCommissionTier()` - Automatic tier assignment based on volume
- `createCommissionInvoice()` - Generate seller invoices with VAT/WHT
- `generateCommissionInvoiceText()` - Bilingual invoice formatting
- `getSellerCommissionSummary()` - Period-based commission reporting

**Tier Logic**:
- Launch (10%): < 10 orders
- Standard (7%): Default
- High Volume (5%): > RWF 5M GMV/month

### 3. UI Components
**Location**: `src/components/checkout/FeeDisplay.tsx`

- Bilingual fee notice (EN/Kinyarwanda)
- Fee breakdown display
- Cash savings calculator
- Amber-themed alert styling
- Responsive design

### 4. Admin Configuration Panel
**Location**: `src/pages/admin/fee-settings.tsx`

- Digital payment fee controls (rate, min, max, enable/disable)
- Marketplace commission tier management
- Tax configuration (VAT, WHT)
- Cash discount mode toggle
- Save/cancel functionality

**Note**: Has TypeScript errors that need fixing (see below)

### 5. Documentation
**Location**: Root directory

#### `FEE_POLICY_V1.md`
- Complete policy documentation
- Customer communication templates (EN/RW)
- EBM receipt examples
- Compliance fallback options
- Testing scenarios
- FAQ section
- Implementation checklist
- Metrics to track

---

## 🔧 What Needs to Be Done

### Immediate Fixes Required

#### 1. Fix TypeScript Errors in `fee-settings.tsx`
The admin panel has several type errors:
- Missing `DashboardLayout` component (needs to be created or imported from existing layout)
- Session user type doesn't include `role` property (needs type extension)
- Readonly config values causing assignment errors (state should use mutable types)

**Solution**: Create a mutable config state type separate from the readonly FEE_CONFIG.

#### 2. Database Schema Updates
Add these models to `prisma/schema.prisma`:

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
  tier              String
  status            String   @default("pending")
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

### Integration Tasks

#### 3. POS/Checkout Integration
**Files to Update**:
- `src/pages/pos/index.tsx` or checkout page
- `src/pages/api/orders/create.ts`

**Steps**:
1. Import `calculateConvenienceFee` and `FeeDisplay` component
2. Add payment method selector to checkout
3. Calculate fee based on selected payment method
4. Display `<FeeDisplay>` component with breakdown
5. Include fee in order total
6. Pass fee data to order creation API

**Example Integration**:
```typescript
import { calculateConvenienceFee } from '@/lib/pricing/fee-calculator';
import FeeDisplay from '@/components/checkout/FeeDisplay';

// In checkout component
const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
const feeCalc = calculateConvenienceFee(subtotal, paymentMethod, true, tipsAmount);

// In JSX
<FeeDisplay 
  subtotal={subtotal}
  paymentMethod={paymentMethod}
  tipsAmount={tipsAmount}
  language={currentLanguage}
/>
```

#### 4. Receipt Generation
**Files to Update**:
- Order completion handler
- Receipt printing service

**Steps**:
1. Import `formatEBMReceipt` and `generateEBMReceiptText`
2. Format order items with fee calculation
3. Generate EBM-compliant receipt
4. Print or display to customer
5. Store receipt data for compliance

#### 5. Marketplace Order Processing
**Files to Update**:
- `src/pages/api/marketplace/orders/create.ts`
- Seller dashboard pages

**Steps**:
1. Import `createCommissionInvoice` from commission service
2. Calculate commission on order completion
3. Create invoice record
4. Send invoice to seller
5. Display commission summary in seller dashboard

#### 6. API Endpoints to Create
- `POST /api/admin/fee-config` - Save fee configuration
- `GET /api/admin/fee-config` - Load current configuration
- `GET /api/seller/commissions` - Get seller commission summary
- `GET /api/seller/invoices/:id` - Get specific invoice
- `POST /api/orders/calculate-fee` - Preview fee before checkout

#### 7. Terms & Conditions Update
**File**: `src/pages/terms.tsx` or similar

Add sections covering:
- Digital payment convenience fee policy
- Marketplace commission structure
- VAT and tax treatment
- Payment terms
- Dispute resolution

#### 8. Customer FAQ Page
Create bilingual FAQ covering:
- Why is there a fee?
- How to avoid the fee?
- What is the cap?
- How is VAT handled?
- Marketplace commission explanation

---

## 📊 Testing Checklist

### Digital Payment Fee Tests
- [ ] Standard order (RWF 12,000 → Fee 600)
- [ ] Below minimum (RWF 1,500 → Fee 100)
- [ ] Above maximum (RWF 100,000 → Fee 3,500)
- [ ] With tips excluded (RWF 10,000 + 2,000 tip → Fee 500)
- [ ] Cash payment (RWF 12,000 → Fee 0)
- [ ] Language toggle (EN/RW display)

### Marketplace Commission Tests
- [ ] New seller tier (10%)
- [ ] Standard seller tier (7%)
- [ ] High-volume seller tier (5%)
- [ ] VAT calculation (18%)
- [ ] WHT calculation (15%)
- [ ] Invoice generation (EN/RW)

### EBM Receipt Tests
- [ ] Receipt formatting
- [ ] VAT breakdown
- [ ] Line item accuracy
- [ ] Payment method display
- [ ] Bilingual output

### Admin Panel Tests
- [ ] Load current configuration
- [ ] Update fee percentages
- [ ] Update min/max caps
- [ ] Toggle cash discount mode
- [ ] Save configuration
- [ ] Validation rules

---

## 🚀 Deployment Steps

### 1. Database Migration
```bash
# Add new models to schema
npx prisma db push

# Or create migration
npx prisma migrate dev --name add_fee_models
```

### 2. Environment Variables
No new variables needed - uses existing Pesapal keys.

### 3. Code Deployment
1. Fix TypeScript errors in fee-settings.tsx
2. Complete POS/checkout integration
3. Test all calculations thoroughly
4. Deploy to staging
5. User acceptance testing
6. Deploy to production

### 4. Staff Training
- Train cashiers on fee communication
- Provide FAQ reference cards
- Practice handling customer questions
- Review receipt generation process

### 5. Customer Communication
- Update website with fee policy
- Email existing customers
- In-restaurant signage
- Social media announcement

---

## 📈 Success Metrics (30-day targets)

### Customer Adoption
- Digital payment mix: Target 40-50%
- Checkout abandonment: < 5% increase
- Customer complaints: < 2% of transactions
- Cash discount adoption: Track if enabled

### Financial Performance
- Effective fee rate: 4.5-5.0% (after caps)
- Net margin improvement: +1.5-2.0 pp
- Gateway cost coverage: 100%+
- Marketplace commission revenue: Track GMV × rate

### Operational Excellence
- EBM compliance: 100%
- Receipt generation success: 99.9%
- Commission invoice accuracy: 100%
- Configuration changes: Track frequency

---

## 🔍 Monitoring & Optimization

### Week 1
- Monitor payment method mix hourly
- Track customer feedback/complaints
- Verify EBM receipt accuracy
- Check fee calculation edge cases

### Month 1
- Analyze payment behavior patterns
- Calculate actual vs. expected revenue
- Review customer satisfaction scores
- Adjust caps/rates if needed

### Quarter 1
- Negotiate volume rates with Pesapal
- Optimize fee structure based on data
- Expand payment options
- Launch marketplace commission system

---

## 📞 Support Contacts

**Technical Issues**: dev@imboni.resto  
**Policy Questions**: policy@imboni.resto  
**Seller Support**: sellers@imboni.resto  
**Customer Service**: support@imboni.resto

---

## 📝 Next Actions (Priority Order)

1. **Fix TypeScript errors** in fee-settings.tsx (30 min)
2. **Add database models** to Prisma schema (15 min)
3. **Integrate FeeDisplay** into checkout page (1 hour)
4. **Update order creation** API with fee calculation (1 hour)
5. **Implement receipt generation** with EBM formatting (2 hours)
6. **Create API endpoints** for fee config (1 hour)
7. **Update Terms & Conditions** (1 hour)
8. **Create FAQ page** (1 hour)
9. **Test end-to-end** (2 hours)
10. **Deploy to staging** (30 min)

**Total Estimated Time**: ~10-12 hours of development work

---

**Status**: Core implementation complete, integration pending  
**Version**: 1.0  
**Date**: January 18, 2026  
**Ready for**: Integration and testing phase
