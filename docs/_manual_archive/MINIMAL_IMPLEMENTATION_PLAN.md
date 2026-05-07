# Minimal Implementation Plan — 4 Game Changers
**Status:** Schema ✅ | Code ❌ (Nothing exists yet)  
**Approach:** Build minimal, additive, zero-disruption implementations

---

## Current State Analysis

**What EXISTS in codebase:**
- ✅ QR ordering flow (`/order` page)
- ✅ IremboPay integration (`/api/payments/irembo/*`)
- ✅ Sale model with `userId` (staff attribution)
- ✅ Smart Dining Slip generation
- ✅ Reservation model (basic)
- ✅ Supplier marketplace tracking

**What DOES NOT EXIST:**
- ❌ Split bill functionality (SalePayment model unused)
- ❌ Digital tipping (StaffTip model unused)
- ❌ Deposit reservations (fields added but no logic)
- ❌ Supplier insights (SupplierInsightsSubscription model unused)

**Conclusion:** We're building from scratch, but using existing patterns.

---

## Implementation Strategy

### Principle: Plug-In Architecture
- Reuse existing `/order` flow, add optional "split" mode
- Reuse existing payment webhook, add split/tip handlers
- Reuse existing reservation flow, add deposit step
- Build new supplier insights as standalone dashboard

### Feature Flags (Optional)
```prisma
// Add to Business model (optional, nullable)
model Business {
  // ... existing fields ...
  enableSplitBill     Boolean @default(false)
  enableDigitalTips   Boolean @default(false)
  enableDepositReserve Boolean @default(false)
  depositAmountCents  Int?    // Per-business deposit amount
}
```

---

## 1. Split Bill (Imboni Pay-at-Table)

### A. Minimal Schema Additions

**No changes needed** — `SalePayment` model already has everything.

Optional enhancement for live state:
```prisma
model SaleItem {
  // ... existing fields ...
  claimedBy    String?  // sessionId or userId who claimed this item
  claimedAt    DateTime?
}
```

### B. API Endpoints (Additive Only)

#### 1. `POST /api/order/split/create`
**Plugs into:** Existing `/order` checkout flow  
**When:** User clicks "Split Bill" instead of "Pay Now"

```typescript
// Input
{
  saleId: string
  splits: [
    { payerName: string, itemIds: string[], amountCents: number },
    { payerName: string, itemIds: string[], amountCents: number }
  ]
}

// Logic
1. Validate saleId exists and isPaid = false
2. Validate sum(amountCents) === sale.totalAmountCents
3. Create SalePayment records (status: PENDING)
4. For each split:
   - Create IremboPay invoice
   - Return paymentUrl
5. Return array of {payerName, paymentUrl, qrCode}
```

#### 2. `PATCH /api/order/items/:itemId/claim`
**Purpose:** Soft-lock items during split assignment

```typescript
// Input
{ sessionId: string }

// Logic
1. Check if item.claimedBy is null or expired (>5 min old)
2. Set claimedBy = sessionId, claimedAt = now()
3. Broadcast via existing real-time mechanism (if any)
```

#### 3. `GET /api/order/:saleId/split-status`
**Purpose:** Check payment progress

```typescript
// Output
{
  totalAmountCents: number,
  paidAmountCents: number,
  pendingAmountCents: number,
  payments: [
    { payerName: string, status: "PAID"|"PENDING", paidAt?: string }
  ]
}
```

#### 4. Webhook Extension (Existing `/api/payments/irembo/webhook`)
**Add to existing webhook handler:**

```typescript
// After existing payment processing...

// Check if this payment belongs to a SalePayment
const salePayment = await prisma.salePayment.findUnique({
  where: { paymentTransactionId: transaction.id }
})

if (salePayment && finalStatus === 'PAID') {
  await prisma.salePayment.update({
    where: { id: salePayment.id },
    data: { status: 'PAID', paidAt: new Date() }
  })
  
  // Check if ALL splits are paid
  const allSplits = await prisma.salePayment.findMany({
    where: { saleId: salePayment.saleId }
  })
  
  const allPaid = allSplits.every(s => s.status === 'PAID')
  
  if (allPaid) {
    // Mark main Sale as paid and release to kitchen
    await prisma.sale.update({
      where: { id: salePayment.saleId },
      data: { 
        paymentStatus: 'PAID',
        isPaid: true,
        kitchenReleasedAt: new Date()
      }
    })
  }
}
```

### C. UI Changes (Minimal, Additive)

**Location:** `/order` page (existing QR order flow)

**Change 1:** Add split option at checkout
```tsx
// In existing checkout screen, BEFORE payment button
{business.enableSplitBill && (
  <div className="mb-4">
    <button
      onClick={() => setShowSplitModal(true)}
      className="w-full py-3 border-2 border-imboni-blue text-imboni-blue rounded-xl"
    >
      Split Bill ({cartItems.length} items)
    </button>
  </div>
)}
```

**Change 2:** Split modal (new component)
```tsx
// components/SplitBillModal.tsx
// Shows:
// - List of cart items
// - "Assign to Person 1/2/3" buttons per item
// - Running totals per person
// - "Generate Payment Links" button
// - WhatsApp share buttons for each link
```

**Change 3:** Split status page (new)
```tsx
// /order/split/[saleId]
// Shows:
// - Total bill
// - Each person's share (paid/pending)
// - "Pay My Share" button if not paid
// - Real-time updates when others pay
```

### D. Real-Time Updates (Optional, Use Existing Mechanism)

If you already have WebSocket/polling:
- Broadcast `sale:${saleId}:payment-update` when any split is paid
- Clients refresh split status

If not:
- Use simple polling (refresh every 5s on split status page)

---

## 2. Digital Tipping (Imboni Tip)

### A. Schema Additions

**No changes needed** — `StaffTip` model is complete.

Optional for smart suggestions:
```prisma
model Business {
  // ... existing ...
  avgTipPercentage Float? // Auto-calculated from historical tips
}
```

### B. API Endpoints

#### 1. `POST /api/tips/create`
```typescript
// Input
{
  saleId: string,
  tipPercentage?: number,  // e.g., 15
  customAmountCents?: number,  // or custom amount
  payerPhone?: string
}

// Logic
1. Get sale and sale.userId (staff who served)
2. Calculate amountCents from percentage or use custom
3. Calculate platformFeeCents = amountCents * 0.025
4. Calculate netToStaffCents = amountCents - platformFeeCents
5. Create StaffTip record (status: PENDING)
6. Create IremboPay invoice
7. Return paymentUrl
```

#### 2. `GET /api/tips/suggestions/:businessId`
```typescript
// Output
{
  avgTipPercentage: 12.5,  // From historical data
  roundUpAmount: 500,      // If bill is RWF 8,300 → suggest +200 to round to 8,500
  quickOptions: [10, 12, 15, 20]
}

// Logic
const recentTips = await prisma.staffTip.findMany({
  where: { 
    businessId,
    status: 'PAID',
    createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  }
})

const avgPercentage = calculateAverage(recentTips)
```

#### 3. `GET /api/tips/my-earnings`
**Auth:** Requires logged-in staff user

```typescript
// Output
{
  totalEarnedCents: number,
  pendingPayoutCents: number,
  paidOutCents: number,
  tips: [
    { id, amountCents, netToStaffCents, paidAt, payoutAt, status }
  ]
}
```

#### 4. Webhook Extension (Add to existing webhook)
```typescript
// In existing webhook, after payment processing...

const staffTip = await prisma.staffTip.findUnique({
  where: { paymentTransactionId: transaction.id }
})

if (staffTip && finalStatus === 'PAID') {
  await prisma.staffTip.update({
    where: { id: staffTip.id },
    data: { status: 'PAID', paidAt: new Date() }
  })
  
  // Update business avg tip percentage (async, non-blocking)
  updateBusinessAvgTip(staffTip.businessId)
}
```

### C. UI Changes

**Location 1:** `/order/success` (existing payment success page)

**Add after "Payment Successful" message:**
```tsx
{business.enableDigitalTips && (
  <div className="mt-6 p-4 bg-slate-50 rounded-xl">
    <p className="text-sm text-slate-600 mb-2">
      Served by: <strong>{sale.user.name}</strong>
    </p>
    <p className="text-sm text-slate-500 mb-3">
      Leave a tip? Most customers tip {avgTipPercentage}%
    </p>
    <div className="grid grid-cols-4 gap-2 mb-2">
      <TipButton percentage={10} />
      <TipButton percentage={avgTipPercentage} label="Avg" />
      <TipButton percentage={15} />
      <TipButton percentage={20} />
    </div>
    {roundUpAmount > 0 && (
      <button className="w-full py-2 border rounded-lg text-sm">
        Round up (+RWF {roundUpAmount})
      </button>
    )}
    <button className="text-sm text-slate-400 mt-2">Skip</button>
  </div>
)}
```

**Location 2:** `/dashboard/my-tips` (new page for staff)

```tsx
// Simple dashboard showing:
// - Total earned
// - Pending payout
// - List of recent tips
// - "Request Payout" button (future feature)
```

---

## 3. Deposit Reservations (Imboni Reserve)

### A. Schema Additions

**Already added** — `Reservation` model has all deposit fields.

Optional for reminders:
```prisma
model Reservation {
  // ... existing ...
  reminderSentAt DateTime?
  confirmedAt    DateTime?
}
```

### B. API Endpoints

#### 1. `POST /api/reservations/create`
**Extend existing reservation endpoint** (if it exists) or create new

```typescript
// Input
{
  businessId: string,
  customerName: string,
  customerPhone: string,
  reservationDate: string,
  reservationTime: string,
  partySize: number,
  tableId?: string
}

// Logic
1. Get business.depositAmountCents (or default RWF 3,000)
2. Generate confirmationCode
3. Create Reservation (depositStatus: 'PENDING')
4. If depositAmountCents > 0:
   - Create IremboPay invoice
   - Return paymentUrl
5. Else:
   - Mark as CONFIRMED immediately
```

#### 2. `POST /api/reservations/check-in`
```typescript
// Input
{ confirmationCode: string }

// Logic
1. Find reservation
2. Update status = 'SEATED'
3. If depositPaidAt exists:
   - Create refund OR apply to bill
   - Update depositStatus = 'REFUNDED'
```

#### 3. Cron: `POST /api/cron/reservation-reminders`
**Schedule:** Every hour

```typescript
const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000)

const upcomingReservations = await prisma.reservation.findMany({
  where: {
    status: 'CONFIRMED',
    reminderSentAt: null,
    reservationDate: { lte: twoHoursFromNow }
  }
})

for (const res of upcomingReservations) {
  // Send WhatsApp reminder (use existing NotificationService)
  await NotificationService.sendReservationReminder(res)
  
  await prisma.reservation.update({
    where: { id: res.id },
    data: { reminderSentAt: new Date() }
  })
}
```

#### 4. Cron: `POST /api/cron/forfeit-no-shows`
**Schedule:** Every hour

```typescript
const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)

const noShows = await prisma.reservation.findMany({
  where: {
    status: 'CONFIRMED',
    depositStatus: 'PAID',
    reservationDate: { lte: twoHoursAgo }
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
  
  // Platform keeps 10% fee
  const platformFeeCents = Math.round(res.depositAmountCents * 0.10)
  // Credit restaurant (implement payout logic)
}
```

### C. UI Changes

**Location:** `/discover/[slug]` (existing business profile page)

**Add "Reserve Table" button** (if doesn't exist):
```tsx
<button onClick={() => setShowReservationModal(true)}>
  Reserve a Table
</button>

{showReservationModal && (
  <ReservationModal
    business={business}
    depositRequired={business.depositAmountCents > 0}
    onSubmit={handleReservation}
  />
)}
```

**Reservation modal shows:**
- Date/time picker
- Party size
- Contact info
- If deposit required: "RWF 3,000 deposit (refunded when you arrive)"
- Pay button → IremboPay

---

## 4. Supplier Insights (Imboni Insights)

### A. Schema Additions

**No changes needed** — `SupplierInsightsSubscription` exists.

### B. API Endpoints

#### 1. `GET /api/supplier/insights/trends`
**Auth:** Requires active subscription

```typescript
// Query params: ?period=WEEKLY|MONTHLY&category=vegetables

// Output
{
  topProducts: [
    {
      product: "Tomatoes",
      totalKgOrdered: 500,
      avgPriceCents: 800,
      priceRange: { min: 600, max: 1000 },
      trend: "UP_15_PERCENT"
    }
  ],
  regionalDemand: [
    { region: "Kimihurura", orderCount: 45, avgOrderSizeCents: 120000 }
  ]
}

// SQL (simplified)
SELECT 
  sp.name,
  SUM(soi.quantity) as total_quantity,
  AVG(soi.unitPriceCents) as avg_price
FROM SupplierOrderItem soi
JOIN SupplierProduct sp ON soi.productId = sp.id
WHERE soi.createdAt >= NOW() - INTERVAL '30 days'
GROUP BY sp.name
ORDER BY total_quantity DESC
LIMIT 10
```

#### 2. `POST /api/supplier/insights/subscribe`
```typescript
// Input
{ supplierId: string, tier: "BASIC"|"PREMIUM"|"ENTERPRISE" }

// Logic
1. Calculate priceCents based on tier
2. Create IremboPay invoice
3. Create SupplierInsightsSubscription (expiresAt = +30 days)
```

### C. UI Changes

**New page:** `/supplier/insights`

```tsx
// Landing page (unauthenticated):
// - Pricing tiers
// - Sample data preview
// - Subscribe button

// Dashboard (authenticated with active subscription):
// - Top products chart
// - Regional demand map
// - Price comparison table
// - Download PDF button
```

---

## 5. Revenue Layer (Non-Intrusive)

### A. Convenience Fee (Optional Field)

```prisma
model Business {
  // ... existing ...
  splitBillFeePercent Float? @default(0)  // e.g., 0.05 for 5%
}
```

**Apply in split bill creation:**
```typescript
if (business.splitBillFeePercent > 0) {
  const feePerSplit = Math.round(amountCents * business.splitBillFeePercent)
  amountCents += feePerSplit
}
```

**Show in UI:**
```tsx
{business.splitBillFeePercent > 0 && (
  <p className="text-xs text-slate-500">
    Includes {business.splitBillFeePercent * 100}% convenience fee
  </p>
)}
```

---

## Implementation Checklist

### Week 1: Split Bill
- [ ] Add `claimedBy` to SaleItem (optional)
- [ ] Build `/api/order/split/create`
- [ ] Build `/api/order/split/status`
- [ ] Extend IremboPay webhook for SalePayment
- [ ] Add split button to `/order` checkout
- [ ] Build SplitBillModal component
- [ ] Build split status page

### Week 2: Digital Tipping
- [ ] Build `/api/tips/create`
- [ ] Build `/api/tips/suggestions`
- [ ] Build `/api/tips/my-earnings`
- [ ] Extend webhook for StaffTip
- [ ] Add tip UI to `/order/success`
- [ ] Build `/dashboard/my-tips` page

### Week 3: Deposit Reservations
- [ ] Add `reminderSentAt`, `confirmedAt` to Reservation
- [ ] Build `/api/reservations/create` (or extend existing)
- [ ] Build `/api/reservations/check-in`
- [ ] Build cron: reservation reminders
- [ ] Build cron: forfeit no-shows
- [ ] Add reservation modal to business profiles

### Week 4: Supplier Insights
- [ ] Build `/api/supplier/insights/trends`
- [ ] Build `/api/supplier/insights/subscribe`
- [ ] Build `/supplier/insights` landing page
- [ ] Build insights dashboard
- [ ] Add cron: renewal reminders

---

## Zero-Disruption Guarantees

✅ **No breaking changes** — All new endpoints, existing ones untouched  
✅ **Feature flags** — Each feature can be toggled per business  
✅ **Backward compatible** — Existing QR orders work unchanged  
✅ **Optional fields** — All schema additions are nullable  
✅ **Additive UI** — New buttons/modals, existing flows intact  
✅ **Reuses infrastructure** — Same IremboPay, same webhooks, same notifications

---

**Next Step:** Await your approval, then I'll code all 4 features systematically.
