# Game Changer Features — Implementation Specification
**Version:** 1.0  
**Date:** March 22, 2026  
**Status:** Schema Complete ✅ | Implementation Pending

---

## Overview

This document specifies 4 high-leverage features that can turn Imboni Serve into a $100M company. All features leverage existing infrastructure with minimal code additions.

**Revenue Potential:**
- Feature 1 (Split Bill): 4-6× transaction multiplier = **+RWF 16M/day**
- Feature 2 (Digital Tipping): New revenue stream = **+RWF 225K/day**
- Feature 3 (Deposit Reservations): No-show prevention = **+RWF 200K/day**
- Feature 4 (Supplier Insights): Pure SaaS margin = **+RWF 90M/year**

**Total Additional Revenue:** ~RWF 500M/month at scale

---

## Feature 1: Split Bill QR Payments

### Business Logic

**Problem:** Groups pay as one transaction → you earn 5% fee once  
**Solution:** Each person pays their share → you earn 5% fee per person (4-6× multiplier)

### Schema (Already Added ✅)

```prisma
model SalePayment {
  id                   String             @id
  saleId               String
  payerName            String?
  payerPhone           String?
  payerEmail           String?
  amountCents          Int
  itemIds              String[]           // SaleItem IDs assigned to this payer
  status               SalePaymentStatus  // PENDING, PAID, FAILED, REFUNDED
  paymentTransactionId String?
  paidAt               DateTime?
  
  sale                 Sale               @relation(...)
  paymentTransaction   PaymentTransaction?
}
```

### API Endpoints to Build

#### 1. `POST /api/order/split/create`
**Purpose:** Create split payment structure for a sale  
**Input:**
```json
{
  "saleId": "sale_123",
  "splits": [
    {
      "payerName": "John",
      "payerPhone": "+250788123456",
      "itemIds": ["item_1", "item_2"],
      "amountCents": 8000
    },
    {
      "payerName": "Jane",
      "itemIds": ["item_3"],
      "amountCents": 5000
    }
  ]
}
```

**Logic:**
1. Validate `saleId` exists and is PENDING payment
2. Validate sum of `amountCents` = `sale.totalAmountCents`
3. Validate all `itemIds` belong to the sale
4. Create `SalePayment` records for each split
5. Return payment URLs for each person

**Output:**
```json
{
  "saleId": "sale_123",
  "payments": [
    {
      "id": "sp_1",
      "payerName": "John",
      "amountCents": 8000,
      "paymentUrl": "https://pay.irembopay.com/..."
    },
    {
      "id": "sp_2",
      "payerName": "Jane",
      "amountCents": 5000,
      "paymentUrl": "https://pay.irembopay.com/..."
    }
  ]
}
```

#### 2. `POST /api/order/split/pay`
**Purpose:** Process individual split payment  
**Input:**
```json
{
  "salePaymentId": "sp_1",
  "payerPhone": "+250788123456",
  "payerEmail": "john@example.com"
}
```

**Logic:**
1. Create IremboPay invoice for `salePayment.amountCents`
2. Store `paymentTransactionId` on `SalePayment`
3. Return payment URL
4. On webhook success → mark `SalePayment` as PAID
5. When ALL `SalePayment` records for a `saleId` are PAID → mark `Sale` as PAID and release to kitchen

#### 3. `GET /api/order/split/status/:saleId`
**Purpose:** Check split payment status  
**Output:**
```json
{
  "saleId": "sale_123",
  "totalAmountCents": 13000,
  "paidAmountCents": 8000,
  "pendingAmountCents": 5000,
  "allPaid": false,
  "payments": [
    {"payerName": "John", "status": "PAID", "paidAt": "2026-03-22T10:00:00Z"},
    {"payerName": "Jane", "status": "PENDING"}
  ]
}
```

### UI Flow (QR Order)

**Location:** `/order` page (after cart review, before payment)

**Screen 1: Payment Method**
```
┌─────────────────────────────────┐
│ How would you like to pay?      │
├─────────────────────────────────┤
│ ○ Pay Together (RWF 13,000)     │
│ ● Split Bill                    │
└─────────────────────────────────┘
         [Continue]
```

**Screen 2: Split Assignment** (if "Split Bill" selected)
```
┌─────────────────────────────────┐
│ Assign items to each person     │
├─────────────────────────────────┤
│ Person 1: [John ▼]              │
│  ☑ Brochette (RWF 5,000)        │
│  ☑ Primus (RWF 3,000)           │
│  Subtotal: RWF 8,000            │
│                                 │
│ Person 2: [Jane ▼]              │
│  ☑ Salad (RWF 5,000)            │
│  Subtotal: RWF 5,000            │
│                                 │
│ [+ Add Person]                  │
└─────────────────────────────────┘
    [Back]  [Generate Links]
```

**Screen 3: Payment Links**
```
┌─────────────────────────────────┐
│ Share payment links             │
├─────────────────────────────────┤
│ John (RWF 8,000)                │
│ [Copy Link] [WhatsApp]          │
│                                 │
│ Jane (RWF 5,000)                │
│ [Copy Link] [WhatsApp]          │
│                                 │
│ Status: 1/2 paid ⏳             │
└─────────────────────────────────┘
```

Each person clicks their link → pays via IremboPay → order releases to kitchen when all paid.

---

## Feature 2: Digital Tipping

### Business Logic

**Problem:** Tipping is 100% cash-based, tourists have no small bills  
**Solution:** One-tap digital tip after payment, staff see earnings dashboard

### Schema (Already Added ✅)

```prisma
model StaffTip {
  id                   String
  saleId               String
  staffId              String          // User who served
  businessId           String
  amountCents          Int             // Tip amount
  platformFeeCents     Int             // 2-3% platform fee
  netToStaffCents      Int             // Staff receives this
  status               StaffTipStatus  // PENDING, PAID, FAILED
  paymentTransactionId String?
  paidAt               DateTime?
  payoutAt             DateTime?       // When staff withdrew
  
  sale                 Sale
  staff                User
  business             Business
}
```

### API Endpoints to Build

#### 1. `POST /api/tips/create`
**Input:**
```json
{
  "saleId": "sale_123",
  "tipPercentage": 15,  // or "customAmountCents": 2000
  "payerPhone": "+250788123456"
}
```

**Logic:**
1. Get `sale` and `sale.userId` (staff who served)
2. Calculate `amountCents` = `sale.totalAmountCents * (tipPercentage / 100)`
3. Calculate `platformFeeCents` = `amountCents * 0.025` (2.5%)
4. Calculate `netToStaffCents` = `amountCents - platformFeeCents`
5. Create `StaffTip` record
6. Create IremboPay invoice for `amountCents`
7. Return payment URL

**Output:**
```json
{
  "tipId": "tip_123",
  "amountCents": 1500,
  "staffName": "Marie",
  "paymentUrl": "https://pay.irembopay.com/..."
}
```

#### 2. `GET /api/tips/my-earnings`
**Purpose:** Staff dashboard — see tips earned  
**Auth:** Requires logged-in user  
**Output:**
```json
{
  "totalEarnedCents": 45000,
  "pendingPayoutCents": 12000,
  "paidOutCents": 33000,
  "tips": [
    {
      "id": "tip_1",
      "amountCents": 1500,
      "netToStaffCents": 1462,
      "paidAt": "2026-03-22T10:00:00Z",
      "payoutAt": null,
      "status": "PAID"
    }
  ]
}
```

#### 3. `POST /api/tips/request-payout`
**Purpose:** Staff requests weekly payout via mobile money  
**Input:**
```json
{
  "staffId": "user_123",
  "momoNumber": "+250788123456",
  "momoProvider": "MTN"  // or "AIRTEL"
}
```

**Logic:**
1. Sum all `StaffTip` where `staffId = user_123`, `status = PAID`, `payoutAt = null`
2. Create payout transaction via IremboPay (or MTN/Airtel API)
3. Mark all tips as `payoutAt = now()`
4. Send confirmation WhatsApp

### UI Flow

**Location 1:** QR payment success screen (`/order/success`)

**After Payment Success:**
```
┌─────────────────────────────────┐
│ ✓ Payment Successful!           │
│                                 │
│ Your order is being prepared    │
│                                 │
│ Served by: Marie                │
│                                 │
│ Leave a tip? 🙏                 │
│ [10%] [15%] [20%] [Custom]      │
│                                 │
│ [Skip]                          │
└─────────────────────────────────┘
```

**Location 2:** Staff dashboard (`/dashboard/my-tips`)

```
┌─────────────────────────────────┐
│ My Tips                         │
├─────────────────────────────────┤
│ Total Earned: RWF 45,000        │
│ Available: RWF 12,000           │
│ Paid Out: RWF 33,000            │
│                                 │
│ [Request Payout via MTN Momo]   │
│                                 │
│ Recent Tips:                    │
│ • RWF 1,500 - Table 5 (Today)   │
│ • RWF 2,000 - Table 3 (Today)   │
│ • RWF 1,000 - Table 7 (Yesterday)│
└─────────────────────────────────┘
```

---

## Feature 3: Deposit-Based Reservations

### Business Logic

**Problem:** 20% no-show rate kills weekend revenue  
**Solution:** RWF 2,000-5,000 deposit → refunded if they show, forfeited if they don't

### Schema (Already Added ✅)

```prisma
model Reservation {
  // ... existing fields ...
  depositAmountCents   Int               @default(0)
  depositPaidAt        DateTime?
  depositRefundedAt    DateTime?
  depositStatus        String?           // PENDING, PAID, REFUNDED, FORFEITED
  paymentTransactionId String?
  
  paymentTransaction   PaymentTransaction?
}
```

### API Endpoints to Build

#### 1. `POST /api/reservations/create-with-deposit`
**Input:**
```json
{
  "businessId": "biz_123",
  "customerName": "John Doe",
  "customerPhone": "+250788123456",
  "customerEmail": "john@example.com",
  "reservationDate": "2026-03-25",
  "reservationTime": "19:00",
  "partySize": 4,
  "tableId": "table_5",
  "specialRequests": "Window seat"
}
```

**Logic:**
1. Get `business.depositAmountCents` (configured per restaurant, default RWF 3,000)
2. Generate unique `confirmationCode`
3. Create `Reservation` with `depositStatus = PENDING`
4. Create IremboPay invoice for deposit
5. Return payment URL

**Output:**
```json
{
  "reservationId": "res_123",
  "confirmationCode": "ABC123",
  "depositAmountCents": 3000,
  "paymentUrl": "https://pay.irembopay.com/...",
  "message": "Pay RWF 3,000 deposit to confirm. Fully refunded if you show up."
}
```

#### 2. `POST /api/reservations/check-in`
**Purpose:** Mark customer as arrived → refund deposit  
**Input:**
```json
{
  "confirmationCode": "ABC123"
}
```

**Logic:**
1. Find reservation
2. Update `status = SEATED`
3. If `depositPaidAt` exists → create refund transaction
4. Update `depositRefundedAt = now()`, `depositStatus = REFUNDED`
5. Apply deposit to their bill (reduce `sale.totalAmountCents` by `depositAmountCents`)

#### 3. Cron Job: `POST /api/cron/forfeit-no-shows`
**Schedule:** Every hour  
**Logic:**
```javascript
const now = new Date()
const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000)

const noShows = await prisma.reservation.findMany({
  where: {
    status: 'CONFIRMED',
    depositStatus: 'PAID',
    reservationDate: { lte: twoHoursAgo },
  }
})

for (const res of noShows) {
  await prisma.reservation.update({
    where: { id: res.id },
    data: {
      status: 'NO_SHOW',
      depositStatus: 'FORFEITED'
    }
  })
  
  // Platform keeps 10% of forfeited deposit
  const platformFeeCents = Math.round(res.depositAmountCents * 0.10)
  const restaurantShareCents = res.depositAmountCents - platformFeeCents
  
  // Credit restaurant account (implement payout logic)
}
```

### UI Flow

**Location:** `/discover/[slug]` (business profile page)

**Reservation Form:**
```
┌─────────────────────────────────┐
│ Reserve a Table                 │
├─────────────────────────────────┤
│ Date: [2026-03-25 ▼]            │
│ Time: [19:00 ▼]                 │
│ Party Size: [4 ▼]               │
│ Name: [John Doe]                │
│ Phone: [+250788123456]          │
│ Email: [john@example.com]       │
│                                 │
│ ⓘ RWF 3,000 deposit required    │
│   (fully refunded when you arrive)│
│                                 │
│ [Pay Deposit & Reserve]         │
└─────────────────────────────────┘
```

**After Payment:**
```
┌─────────────────────────────────┐
│ ✓ Reservation Confirmed!        │
│                                 │
│ Confirmation Code: ABC123       │
│                                 │
│ Date: March 25, 2026            │
│ Time: 7:00 PM                   │
│ Party Size: 4 people            │
│                                 │
│ Your RWF 3,000 deposit will be  │
│ applied to your bill.           │
│                                 │
│ Cancel 24+ hours before for     │
│ 50% refund.                     │
└─────────────────────────────────┘
```

---

## Feature 4: Supplier Insights SaaS

### Business Logic

**Problem:** Suppliers guess at demand, pricing, inventory  
**Solution:** Sell aggregated market data as monthly subscription

### Schema (Already Added ✅)

```prisma
model SupplierInsightsSubscription {
  id          String
  supplierId  String                @unique
  tier        SupplierInsightsTier  // BASIC, PREMIUM, ENTERPRISE
  isActive    Boolean
  startDate   DateTime
  expiresAt   DateTime
  priceCents  Int
  
  supplier    Supplier
}

enum SupplierInsightsTier {
  BASIC       // RWF 50,000/month
  PREMIUM     // RWF 100,000/month
  ENTERPRISE  // RWF 200,000/month
}
```

### API Endpoints to Build

#### 1. `POST /api/supplier/insights/subscribe`
**Input:**
```json
{
  "supplierId": "sup_123",
  "tier": "PREMIUM"
}
```

**Logic:**
1. Check if subscription exists → upgrade/downgrade if yes
2. Calculate `priceCents` based on tier
3. Create IremboPay invoice for first month
4. Create `SupplierInsightsSubscription` with `expiresAt = now() + 30 days`

#### 2. `GET /api/supplier/insights/data`
**Auth:** Requires active subscription  
**Query Params:** `?period=WEEKLY|MONTHLY&category=vegetables`

**Output (Example):**
```json
{
  "period": "MONTHLY",
  "category": "vegetables",
  "insights": {
    "topProducts": [
      {
        "product": "Tomatoes",
        "totalKgOrdered": 500,
        "avgPriceCents": 800,
        "priceRange": {"min": 600, "max": 1000},
        "trend": "UP_15_PERCENT"
      },
      {
        "product": "Onions",
        "totalKgOrdered": 300,
        "avgPriceCents": 500,
        "trend": "STABLE"
      }
    ],
    "regionalDemand": [
      {"region": "Kimihurura", "orderCount": 45, "avgOrderSizeCents": 120000},
      {"region": "Nyamirambo", "orderCount": 32, "avgOrderSizeCents": 85000}
    ],
    "competitorPricing": {
      "yourAvgPrice": 800,
      "marketAvgPrice": 750,
      "percentile": 65  // You're in the 65th percentile (more expensive than 65% of market)
    }
  }
}
```

**Data Aggregation Logic:**
```sql
-- Top products by volume
SELECT 
  sp.name,
  SUM(soi.quantity) as total_quantity,
  AVG(soi.unitPriceCents) as avg_price,
  MIN(soi.unitPriceCents) as min_price,
  MAX(soi.unitPriceCents) as max_price
FROM SupplierOrderItem soi
JOIN SupplierProduct sp ON soi.productId = sp.id
WHERE soi.createdAt >= NOW() - INTERVAL '30 days'
  AND sp.category = 'vegetables'
GROUP BY sp.name
ORDER BY total_quantity DESC
LIMIT 10;

-- Regional demand
SELECT 
  b.district as region,
  COUNT(DISTINCT so.id) as order_count,
  AVG(so.totalAmountCents) as avg_order_size
FROM SupplierOrder so
JOIN Business b ON so.businessId = b.id
WHERE so.createdAt >= NOW() - INTERVAL '30 days'
GROUP BY b.district;
```

#### 3. Cron Job: `POST /api/cron/renew-insights-subscriptions`
**Schedule:** Daily  
**Logic:**
```javascript
const expiringSoon = await prisma.supplierInsightsSubscription.findMany({
  where: {
    isActive: true,
    expiresAt: { lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) }  // 3 days
  }
})

for (const sub of expiringSoon) {
  // Send renewal reminder via email/WhatsApp
  // Create invoice for next month
  // On payment → extend expiresAt by 30 days
}
```

### UI Flow

**Location:** `/supplier/insights` (new page)

**Landing Page (Unauthenticated Supplier):**
```
┌─────────────────────────────────┐
│ Supplier Market Insights        │
├─────────────────────────────────┤
│ Make data-driven decisions      │
│                                 │
│ ✓ See what restaurants order    │
│ ✓ Track price trends            │
│ ✓ Optimize your inventory       │
│ ✓ Beat competitors              │
│                                 │
│ [BASIC - RWF 50,000/month]      │
│ [PREMIUM - RWF 100,000/month] ⭐ │
│ [ENTERPRISE - RWF 200,000/month]│
│                                 │
│ [Start Free Trial]              │
└─────────────────────────────────┘
```

**Dashboard (Subscribed Supplier):**
```
┌─────────────────────────────────┐
│ Market Insights - March 2026    │
├─────────────────────────────────┤
│ Top 10 Products This Month      │
│ 1. Tomatoes - 500kg ordered     │
│    Avg: RWF 800/kg (↑ 15%)     │
│ 2. Onions - 300kg ordered       │
│    Avg: RWF 500/kg (→ stable)  │
│                                 │
│ Regional Demand                 │
│ • Kimihurura: 45 orders         │
│ • Nyamirambo: 32 orders         │
│                                 │
│ Your Pricing vs Market          │
│ You: RWF 800/kg                 │
│ Market Avg: RWF 750/kg          │
│ ⚠️ You're 7% above average      │
│                                 │
│ [Download Full Report PDF]      │
└─────────────────────────────────┘
```

---

## Implementation Priority

### Phase 1 (Week 1-2): Split Bill
- Highest revenue impact (4-6× multiplier)
- Simplest to build (payment flow already exists)
- Immediate customer delight

### Phase 2 (Week 3): Digital Tipping
- New revenue stream
- Staff incentive creates viral loop
- Builds on Split Bill payment infrastructure

### Phase 3 (Week 4-5): Deposit Reservations
- Solves major restaurant pain point
- Requires cron job for auto-forfeit
- Lower volume but high value per transaction

### Phase 4 (Week 6-8): Supplier Insights
- Pure SaaS margin
- Requires data aggregation logic
- Scales infinitely with no marginal cost

---

## Revenue Projections (Conservative)

### Assumptions
- 500 restaurants on platform
- 50 QR orders/day per restaurant (average)
- 30% of orders are group orders (4 people avg)
- 30% of customers tip after QR payment
- 10 reservations/day per restaurant, 20% no-show rate
- 100 suppliers subscribe to insights (20% of 500 suppliers)

### Monthly Revenue Breakdown

| Feature | Calculation | Monthly Revenue |
|---------|-------------|-----------------|
| **Split Bill** | 500 rest × 15 group orders/day × 3 extra transactions × RWF 400 fee × 30 days | **RWF 270M** |
| **Digital Tipping** | 500 rest × 50 orders/day × 30% tip rate × RWF 1,500 avg tip × 2.5% fee × 30 days | **RWF 8.4M** |
| **Deposit Reservations** | 500 rest × 10 res/day × 20% no-show × RWF 3,000 × 10% fee × 30 days | **RWF 9M** |
| **Supplier Insights** | 100 suppliers × RWF 75,000/month avg | **RWF 7.5M** |
| **TOTAL NEW REVENUE** | | **RWF 294.9M/month** |

**Annual:** RWF 3.5 Billion (~$2.6M USD at current rates)

At 1,000 restaurants → **RWF 7B/year** → approaching $100M valuation territory.

---

## Technical Notes

### Environment Variables Needed
```env
# Already configured
IREMBO_API_BASE=https://api.irembopay.com
IREMBO_PUBLIC_KEY=...
IREMBO_SECRET_KEY=...

# New (for payouts)
MTN_MOMO_API_KEY=...
AIRTEL_MONEY_API_KEY=...
```

### Cron Jobs to Set Up
1. `/api/cron/forfeit-no-shows` - Hourly
2. `/api/cron/renew-insights-subscriptions` - Daily
3. `/api/cron/process-staff-payouts` - Weekly (Fridays)

### Testing Checklist
- [ ] Split bill with 2 people, both pay → order releases
- [ ] Split bill with 1 person pays, 1 doesn't → order stays pending
- [ ] Tip 15% after QR payment → staff sees it in dashboard
- [ ] Request payout → MTN Momo receives funds
- [ ] Make reservation with deposit → show up → deposit refunded to bill
- [ ] Make reservation with deposit → no-show → deposit forfeited
- [ ] Supplier subscribes to PREMIUM → sees aggregated data
- [ ] Supplier subscription expires → data access blocked

---

## Next Steps

1. **Build Split Bill first** (highest ROI, simplest implementation)
2. Test with 10 pilot restaurants for 2 weeks
3. Roll out to all restaurants
4. Add Digital Tipping (builds on split bill infrastructure)
5. Add Deposit Reservations (requires cron setup)
6. Add Supplier Insights last (requires data aggregation optimization)

**Estimated Development Time:** 6-8 weeks for all 4 features with 1 developer

---

**Document Status:** Schema ✅ | Specification Complete ✅ | Implementation Pending
