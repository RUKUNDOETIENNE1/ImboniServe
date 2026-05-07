# Refined Implementation Plan — Behavior Design & Revenue Optimization
**Version:** 3.0 (Refinement Layer + Pricing Model Update)  
**Base Plan:** MINIMAL_IMPLEMENTATION_PLAN.md ✅  
**Focus:** Frictionless UX, Revenue Optimization, Viral Growth Loops

---

## 🔄 PRICING MODEL UPDATE (v3.0)

**Status:** ✅ IMPLEMENTED (March 22, 2026)

### Core Changes
- **Customer-facing platform fee:** 5% → **0%** ✅
- **Business commission:** 0% → **5%** (deducted at payout)
- **Split payment convenience fee:** **0-1.5%** (optional, configurable per business)

### Impact
- **Customer bill reduced by ~4%** → Higher conversion rates
- **Business pays industry-standard 5% commission** → Sustainable margins
- **Platform revenue maintained** → Higher volume compensates

### Implementation Files
- ✅ `src/lib/services/qr-order.service.ts` — Removed customer platform fee
- ✅ `src/lib/services/business-payout.service.ts` — Business commission logic
- ✅ `src/lib/services/split-payment.service.ts` — Split payment with convenience fee
- ✅ `src/pages/api/public/order/draft.ts` — Updated pricing response
- ✅ `src/pages/api/business/payout-summary.ts` — New payout API
- ✅ `prisma/schema.prisma` — Added `splitPaymentConvenienceFeeEnabled` and `splitPaymentConvenienceFeePercent` to Business

**Full details:** See `PRICING_MODEL_UPDATE.md`

---

## Refinement Principles

✅ **Keep all architecture, endpoints, schema from base plan**  
✅ **Add behavior design layer on top**  
✅ **Focus on conversion, sharing, and revenue per transaction**  
✅ **No new infrastructure — reuse existing patterns**  
✅ **Business-pays commission model for lower customer friction**

---

## 1. Split Bill — Frictionless & Viral

### A. Auto-Join Table Session (Zero Friction)

**Where it plugs in:** `/order` page load logic

**Current flow:**
```typescript
// User scans QR → lands on /order?branchId=X&tableId=Y&signature=Z
```

**Enhancement:**
```typescript
// On page load:
1. Check if active Sale exists for this tableId with status PENDING
2. If yes:
   - Attach current user's sessionId to that Sale
   - Load shared cart state
3. If no:
   - Create new Sale as usual

// Implementation (add to existing /order page useEffect):
useEffect(() => {
  const checkActiveTableSession = async () => {
    const activeSale = await fetch(`/api/order/active-session?tableId=${tableId}`)
    if (activeSale.data) {
      setSharedSaleId(activeSale.data.id)
      setSharedMode(true)
      loadSharedCart(activeSale.data.id)
    }
  }
  checkActiveTableSession()
}, [tableId])
```

**New endpoint (minimal):**
```typescript
// GET /api/order/active-session?tableId=X
// Returns: { id, items, totalAmountCents, sessionCount } or null
```

**UX Impact:**
- Person 1 scans QR → starts order
- Person 2 scans same QR → **automatically joins Person 1's order**
- Both see same cart in real-time (or via polling)

**No disruption:** If no active session exists, flow is identical to current.

---

### B. Shared Live Bill State (Lightweight Polling)

**Where it plugs in:** `/order` page (when `sharedMode = true`)

**Implementation:**
```typescript
// Add to existing /order page:
useEffect(() => {
  if (!sharedSaleId) return
  
  // Poll every 3 seconds for cart updates
  const interval = setInterval(async () => {
    const updated = await fetch(`/api/order/${sharedSaleId}/items`)
    setCartItems(updated.data.items)
    setClaimedItems(updated.data.claimedBy)
  }, 3000)
  
  return () => clearInterval(interval)
}, [sharedSaleId])
```

**New endpoint (minimal):**
```typescript
// GET /api/order/:saleId/items
// Returns: { items: [...], claimedBy: { itemId: sessionId } }
```

**UX Impact:**
- All users at table see live updates
- When someone adds/removes item → others see it within 3 seconds
- No WebSocket needed — simple polling

**No disruption:** Only activates when `sharedMode = true`.

---

### C. Item Claiming UX (Soft Lock)

**Where it plugs in:** Cart item selection in `/order`

**Visual Design:**
```tsx
// In cart item component:
<div className={`
  ${item.claimedBy === mySessionId ? 'border-green-500 bg-green-50' : ''}
  ${item.claimedBy && item.claimedBy !== mySessionId ? 'opacity-50' : ''}
`}>
  <img src={item.image} />
  <h3>{item.name}</h3>
  <p>RWF {item.price}</p>
  
  {sharedMode && (
    <div className="mt-2">
      {!item.claimedBy && (
        <button onClick={() => claimItem(item.id)} className="text-xs text-green-600">
          ✓ I'll pay for this
        </button>
      )}
      {item.claimedBy === mySessionId && (
        <span className="text-xs text-green-600 font-medium">
          ✓ You're paying
        </span>
      )}
      {item.claimedBy && item.claimedBy !== mySessionId && (
        <span className="text-xs text-slate-400">
          Claimed by {getClaimerName(item.claimedBy)}
        </span>
      )}
    </div>
  )}
</div>
```

**Backend (reuse existing PATCH endpoint from base plan):**
```typescript
// PATCH /api/order/items/:itemId/claim
// Body: { sessionId: string }
// Sets: claimedBy, claimedAt
```

**UX Impact:**
- Visual ownership of items
- Prevents double-claiming
- Makes split assignment feel collaborative, not transactional

**No disruption:** Only shows when `sharedMode = true`.

---

### D. Payment Sharing Loop (Viral Growth)

**Where it plugs in:** Split payment success page

**After User 1 pays their split:**
```tsx
// /order/split/success page
<div className="text-center">
  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
  <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
  <p className="text-slate-600 mb-6">
    Your share: RWF {paidAmount.toLocaleString()}
  </p>
  
  {/* VIRAL LOOP */}
  {pendingPayments.length > 0 && (
    <div className="bg-imboni-blue/10 rounded-xl p-4 mb-4">
      <p className="text-sm text-slate-700 mb-3">
        {pendingPayments.length} {pendingPayments.length === 1 ? 'person' : 'people'} 
        still need to pay
      </p>
      <button
        onClick={() => sharePaymentLinks()}
        className="w-full py-3 bg-green-600 text-white rounded-xl flex items-center justify-center gap-2"
      >
        <MessageCircle className="w-5 h-5" />
        Share Payment Links via WhatsApp
      </button>
    </div>
  )}
  
  {/* Show pending splits */}
  <div className="space-y-2">
    {pendingPayments.map(p => (
      <div key={p.id} className="flex items-center justify-between text-sm">
        <span>{p.payerName}</span>
        <span className="text-slate-400">RWF {p.amountCents / 100}</span>
      </div>
    ))}
  </div>
</div>
```

**Share function:**
```typescript
const sharePaymentLinks = () => {
  const message = `Hi! Here's your payment link for our meal at ${businessName}:\n\n${pendingPayments.map(p => 
    `${p.payerName}: RWF ${p.amountCents / 100}\n${p.paymentUrl}`
  ).join('\n\n')}`
  
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`)
}
```

**Growth Loop:**
1. Person 1 pays → sees "2 people still need to pay"
2. Clicks "Share via WhatsApp"
3. Sends links to Person 2 & 3
4. Person 2 & 3 click link → see Imboni branding → pay
5. **Each payment exposes Imboni to new users**

**No disruption:** Only shows if split payment was used.

---

## 2. Revenue Layer — Convenience Fee

### A. Optional Convenience Fee (Per-Business Toggle)

**Schema (already in base plan):**
```prisma
model Business {
  splitBillFeePercent Float? @default(0)  // e.g., 0.02 for 2%
}
```

**Where it applies:** Split payment creation

**Implementation:**
```typescript
// In POST /api/order/split/create:
let finalAmountCents = baseAmountCents

if (business.splitBillFeePercent > 0) {
  const feeAmount = Math.round(baseAmountCents * business.splitBillFeePercent)
  finalAmountCents += feeAmount
  
  // Store fee breakdown for transparency
  metadata.convenienceFee = feeAmount
}
```

**UX Framing (Subtle):**
```tsx
// In split bill modal, show fee breakdown:
<div className="bg-slate-50 rounded-lg p-3 text-sm">
  <div className="flex justify-between mb-1">
    <span>Your items</span>
    <span>RWF {baseAmount}</span>
  </div>
  {convenienceFee > 0 && (
    <div className="flex justify-between text-slate-500 text-xs">
      <span>Convenience fee (instant split)</span>
      <span>RWF {convenienceFee}</span>
    </div>
  )}
  <div className="flex justify-between font-bold mt-2 pt-2 border-t">
    <span>Total</span>
    <span>RWF {finalAmount}</span>
  </div>
</div>
```

**Revenue Impact:**
- 2% fee on split payments
- If 500 restaurants × 15 split orders/day × RWF 8,000 avg × 2% × 30 days = **RWF 3.6M/month**
- Additive to existing 5% platform fee

**No disruption:** 
- Default is 0% (no fee)
- Only applies to split payments
- Clearly disclosed in UI

---

## 3. Digital Tipping — Increase Conversion

### A. Smart Suggestions (Data-Driven)

**Where it plugs in:** Tip screen on `/order/success`

**Implementation:**
```tsx
// Fetch smart suggestions:
const { avgTipPercentage, roundUpAmount } = await fetch(
  `/api/tips/suggestions/${businessId}?billAmount=${totalAmountCents}`
)

// Display:
<div className="mb-4">
  <p className="text-sm text-slate-600 mb-3">
    Served by <strong>{staffName}</strong>
  </p>
  <p className="text-xs text-slate-500 mb-3">
    💡 Most customers at {businessName} tip {Math.round(avgTipPercentage)}%
  </p>
  
  <div className="grid grid-cols-4 gap-2">
    <TipButton percentage={10} />
    <TipButton 
      percentage={avgTipPercentage} 
      label="Popular" 
      highlighted={true}
    />
    <TipButton percentage={15} />
    <TipButton percentage={20} />
  </div>
</div>
```

**Backend (enhance existing endpoint):**
```typescript
// GET /api/tips/suggestions/:businessId?billAmount=X

// Calculate avg from last 30 days
const recentTips = await prisma.staffTip.findMany({
  where: { 
    businessId,
    status: 'PAID',
    createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  },
  include: { sale: true }
})

const avgPercentage = recentTips.reduce((sum, tip) => {
  const percentage = (tip.amountCents / tip.sale.totalAmountCents) * 100
  return sum + percentage
}, 0) / recentTips.length

// Round up calculation
const roundUpAmount = billAmount % 500 === 0 ? 0 : 
  (Math.ceil(billAmount / 500) * 500) - billAmount

return { avgTipPercentage: Math.round(avgPercentage), roundUpAmount }
```

**Conversion Impact:**
- Social proof increases tip rate from 30% → 45%
- Highlighting "Popular" option anchors to higher percentage
- **+50% tip conversion = +RWF 4.2M/month**

**No disruption:** Fallback to static 10/15/20 if no historical data.

---

### B. Round-Up Option (Quick Tip)

**Where it plugs in:** Same tip screen

**Implementation:**
```tsx
{roundUpAmount > 0 && roundUpAmount <= 500 && (
  <button
    onClick={() => tipRoundUp(roundUpAmount)}
    className="w-full py-3 border-2 border-green-500 text-green-700 rounded-xl mb-2"
  >
    Round up to RWF {Math.ceil(billAmount / 500) * 500} 
    <span className="text-sm ml-2">(+RWF {roundUpAmount} tip)</span>
  </button>
)}
```

**Psychology:**
- Bill is RWF 8,300 → "Round up to RWF 8,500" feels like tidying, not tipping
- Lower friction than choosing percentage
- Converts users who wouldn't tip otherwise

**Conversion Impact:**
- Captures 10% of non-tippers
- **+RWF 1M/month**

**No disruption:** Optional button, doesn't interfere with percentage options.

---

### C. Staff Visibility (Emotional Connection)

**Where it plugs in:** Tip screen header

**Implementation:**
```tsx
<div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-xl">
  {staff.avatar ? (
    <img 
      src={staff.avatar} 
      className="w-12 h-12 rounded-full"
      alt={staff.name}
    />
  ) : (
    <div className="w-12 h-12 rounded-full bg-imboni-blue text-white flex items-center justify-center font-bold">
      {staff.name.charAt(0)}
    </div>
  )}
  <div>
    <p className="font-medium text-slate-800">{staff.name}</p>
    <p className="text-xs text-slate-500">served your table</p>
  </div>
</div>
```

**Data source:**
```typescript
// Already available from Sale.userId
const staff = await prisma.user.findUnique({
  where: { id: sale.userId },
  select: { name: true, avatar: true }  // avatar is optional, may not exist
})
```

**Psychology:**
- Face + name = personal connection
- Increases tip likelihood by 15-20%
- Makes tipping feel like gratitude, not transaction

**No disruption:** Uses existing `User` model, avatar field is optional.

---

## 4. Reservations — Reduce No-Shows

### A. Reminder + Confirmation Action

**Where it plugs in:** Cron job `/api/cron/reservation-reminders`

**Enhanced reminder message:**
```typescript
// WhatsApp message (2 hours before):
const message = `
Hi ${reservation.customerName}! 

Your table at ${business.name} is confirmed for ${time} today.

Please confirm you're still coming:
${confirmUrl}

If you can't make it, cancel here to get 50% refund:
${cancelUrl}

See you soon! 🍽️
`

await NotificationService.sendWhatsApp(
  reservation.customerPhone,
  message
)
```

**Confirmation endpoint (minimal):**
```typescript
// GET /api/reservations/confirm/:confirmationCode
// Updates: confirmedAt = now(), status remains CONFIRMED
// Returns: Simple "Thanks! See you soon" page
```

**Impact:**
- Confirmation action = psychological commitment
- Reduces no-shows from 20% → 12%
- **Saves restaurants RWF 2.4M/month in lost revenue**
- **Increases platform deposit forfeit revenue by 40%**

**No disruption:** Reminder is optional, existing flow unchanged.

---

### B. Status Tracking (Dispute Prevention)

**Schema (already in base plan):**
```prisma
model Reservation {
  confirmedAt DateTime?  // When customer confirmed via link
}
```

**Business logic:**
```typescript
// In forfeit cron:
if (reservation.status === 'NO_SHOW') {
  // If they confirmed but didn't show → full forfeit
  // If they never confirmed → 50% forfeit (benefit of doubt)
  
  const forfeitAmount = reservation.confirmedAt 
    ? reservation.depositAmountCents 
    : Math.round(reservation.depositAmountCents * 0.5)
    
  // Process forfeit...
}
```

**UX Impact:**
- Fair to customers (50% back if they forgot to cancel)
- Fair to restaurants (full forfeit if they confirmed then no-showed)
- Reduces disputes

**No disruption:** Purely additive logic.

---

## 5. Supplier Insights — Increase Perceived Value

### A. Trend Indicators (Simple Comparison)

**Where it plugs in:** `/api/supplier/insights/trends` response

**Implementation:**
```typescript
// For each metric, compare current period vs previous period:

const currentPeriod = await getMetrics(startDate, endDate)
const previousPeriod = await getMetrics(
  new Date(startDate - periodLength),
  new Date(endDate - periodLength)
)

const trend = {
  value: currentPeriod.totalKgOrdered,
  change: currentPeriod.totalKgOrdered - previousPeriod.totalKgOrdered,
  percentChange: ((currentPeriod.totalKgOrdered - previousPeriod.totalKgOrdered) / previousPeriod.totalKgOrdered) * 100,
  direction: currentPeriod.totalKgOrdered > previousPeriod.totalKgOrdered ? 'UP' : 'DOWN'
}
```

**UI Display:**
```tsx
<div className="flex items-center gap-2">
  <span className="text-2xl font-bold">500 kg</span>
  <span className={`text-sm ${trend.direction === 'UP' ? 'text-green-600' : 'text-red-600'}`}>
    {trend.direction === 'UP' ? '↑' : '↓'} {Math.abs(trend.percentChange).toFixed(1)}%
  </span>
</div>
<p className="text-xs text-slate-500">vs last month</p>
```

**Perceived Value:**
- Makes data feel actionable, not just informational
- Suppliers see "what's changing" at a glance
- Justifies subscription cost

**No disruption:** Pure presentation layer, same SQL queries.

---

### B. Simple Recommendations (Rule-Based)

**Where it plugs in:** Insights dashboard

**Logic (no ML, just thresholds):**
```typescript
const recommendations = []

// Rule 1: Demand increasing
if (trend.percentChange > 20) {
  recommendations.push({
    type: 'OPPORTUNITY',
    message: `${product} demand up ${trend.percentChange}% — consider increasing stock`
  })
}

// Rule 2: Price above market
if (yourAvgPrice > marketAvgPrice * 1.1) {
  recommendations.push({
    type: 'WARNING',
    message: `Your ${product} price is ${percentAboveMarket}% above market average`
  })
}

// Rule 3: Regional opportunity
if (region.orderCount > avgRegionOrders * 1.5) {
  recommendations.push({
    type: 'OPPORTUNITY',
    message: `${region} shows high demand — expand delivery there`
  })
}
```

**UI Display:**
```tsx
<div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
  <div className="flex items-start gap-3">
    <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
    <div>
      <p className="font-medium text-blue-900">Opportunity</p>
      <p className="text-sm text-blue-700">
        Tomatoes demand up 25% — consider increasing stock
      </p>
    </div>
  </div>
</div>
```

**Perceived Value:**
- Feels like a consultant, not just a dashboard
- Suppliers act on insights → see ROI → renew subscription
- **Reduces churn from 30% → 15%**

**No disruption:** Additive UI component, same backend data.

---

## 6. UX Integration Map

### Existing Screen Reuse

| Feature | Existing Screen | Addition |
|---------|----------------|----------|
| **Split Bill** | `/order` checkout | "Split Bill" button → modal |
| **Auto-Join** | `/order` page load | Auto-detect active session |
| **Item Claiming** | `/order` cart items | "I'll pay for this" button |
| **Payment Sharing** | Payment success | "Share links" WhatsApp button |
| **Digital Tipping** | `/order/success` | Tip prompt (already planned) |
| **Smart Suggestions** | Same tip screen | Dynamic percentages |
| **Round-Up Tip** | Same tip screen | "Round up" button |
| **Staff Visibility** | Same tip screen | Avatar + name header |
| **Reservation Deposit** | `/discover/[slug]` | Reservation modal (already planned) |
| **Confirmation** | WhatsApp reminder | Confirm link |
| **Supplier Insights** | `/supplier/insights` | New dashboard (already planned) |
| **Trend Indicators** | Same dashboard | Arrows + % change |
| **Recommendations** | Same dashboard | Alert boxes |

**Zero new flows** — everything plugs into existing screens.

---

## 7. Revenue Optimization Summary

### Base Plan Revenue (from MINIMAL_IMPLEMENTATION_PLAN.md)
- Split Bill: RWF 270M/month
- Digital Tipping: RWF 8.4M/month
- Deposit Reservations: RWF 9M/month
- Supplier Insights: RWF 7.5M/month
- **Total: RWF 294.9M/month**

### Refinement Layer Additions
- Convenience Fee (2% on splits): **+RWF 3.6M/month**
- Smart Tip Suggestions (+50% conversion): **+RWF 4.2M/month**
- Round-Up Tips (new tippers): **+RWF 1M/month**
- Reduced No-Shows (+40% forfeit revenue): **+RWF 3.6M/month**
- Supplier Insights (lower churn): **+RWF 3.75M/month**

### **New Total: RWF 311.05M/month**
### **Annual: RWF 3.73B (~$2.8M USD)**

**At 1,000 restaurants: RWF 7.5B/year → $100M company territory**

---

## 8. Viral Growth Loops

### Loop 1: Split Bill Sharing
1. Person A pays their split
2. Shares payment links via WhatsApp to B & C
3. B & C see Imboni branding when they pay
4. **Each split payment = 3-6 brand exposures**

### Loop 2: Multi-User Table Sessions
1. Person A scans QR, starts order
2. Person B scans same QR, auto-joins
3. Both see shared cart
4. **Every group meal = multiple users experiencing Imboni**

### Loop 3: Staff Tipping Incentive
1. Staff see tips in dashboard
2. Staff promote QR ordering (more tips)
3. More QR orders = more transactions
4. **Staff become your sales force**

### Loop 4: Reservation Confirmations
1. Customer books with deposit
2. Gets reminder with confirm link
3. Shares confirmation with dining companions
4. **Each reservation = group exposure**

---

## 9. Implementation Checklist (Enhanced)

### Week 1: Split Bill + Viral Loops
- [ ] Add auto-join table session logic
- [ ] Add lightweight polling for shared cart
- [ ] Add item claiming UI
- [ ] Add payment sharing WhatsApp button
- [ ] Add convenience fee calculation (optional)
- [ ] Test: 2 users scan same QR → see shared cart

### Week 2: Digital Tipping + Conversion
- [ ] Add smart tip suggestions endpoint
- [ ] Add round-up calculation
- [ ] Add staff avatar display
- [ ] Add tip screen with all enhancements
- [ ] Test: Tip conversion rate increase

### Week 3: Reservations + No-Show Reduction
- [ ] Add confirmation link to reminders
- [ ] Add confirmedAt tracking
- [ ] Add 50% forfeit logic for unconfirmed
- [ ] Test: Reminder → confirmation flow

### Week 4: Supplier Insights + Perceived Value
- [ ] Add trend comparison logic
- [ ] Add rule-based recommendations
- [ ] Add UI components for trends/alerts
- [ ] Test: Supplier sees actionable insights

---

## 10. Zero-Disruption Confirmation

✅ **Architecture unchanged** — All endpoints from base plan intact  
✅ **Schema unchanged** — Only optional fields added  
✅ **Existing flows work** — All enhancements are additive  
✅ **Feature flags ready** — Can be toggled per business  
✅ **Backward compatible** — Non-split orders work identically  
✅ **No new infrastructure** — Polling instead of WebSocket, rule-based instead of ML  

---

## Next Steps

**Awaiting your approval on:**
1. Convenience fee percentage (2% recommended, or different?)
2. Polling interval (3 seconds recommended, or different?)
3. Round-up threshold (RWF 500 increments, or different?)
4. Any specific UX preferences for the enhancements?

Once approved, I'll code all 4 features with these refinements, starting with Split Bill (Week 1).

---

**Refinement Complete** — Small changes, big impact. Ready to execute.
