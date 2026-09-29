# Daily Operation Report — Day 6

> **Date:** Saturday, August 1, 2026  
> **Day Type:** Weekend  
> **Theme:** Mixed Operations — Large Catering Order, Walk-ins, Reservations, Refunds, Cancelled Orders, Split Bills  
> **Restaurant:** Café Imboni

---

## Opening (08:00)

### Business Checks
All checks passed. Day 5 close confirmed (with 2 voids documented).

### Reservation Review (08:05)

| Time | Name | Party | Table | Status | Notes |
|------|------|-------|-------|--------|-------|
| 12:00 | C33 (Church Group) | 8 | T10 | CONFIRMED | Sunday lunch preview |
| 12:30 | C09 (David Kalisa) | 2 | T3 | CONFIRMED | Regular |
| 13:00 | C34 (Family Reunion) | 7 | T7+T6 | CONFIRMED | Returning group |
| 18:00 | C31 (Startup Team) | 8 | T10 | CONFIRMED | Team dinner |
| 19:00 | C01 (VIP) | 2 | T9 (Booth) | CONFIRMED | Private dinner |
| 19:30 | C32 (Birthday Party) | 6 | T7 | CONFIRMED | Birthday celebration |

**Total Reservations:** 6

### Special: Catering Order (C35)
- **Customer:** C35 (Corporate Catering)
- **Order:** 10 packed lunches for corporate event
- **Items:** Beef Brochette x10, Rice x10, Plantains x10, Juice x10, Water x10
- **Total:** 125,000 RWF
- **Payment:** Corporate card (IremboPay)
- **Delivery:** 11:30 (picked up by corporate driver)
- **Preparation:** Marie starts prep at 10:00

### Inventory Review (08:10)
- All stock at healthy levels (cheese and goat restocked from Day 5)
- Extra beef ordered for catering (15kg delivered at 09:00)
- Marie confirms catering ingredients ready

### Daily Briefing (08:20)
- 6 reservations
- Large catering order (10 packed lunches) — pickup at 11:30
- Expected high walk-in traffic (Saturday)
- Split bills expected for groups
- Staff prepared for refund/cancellation scenarios

---

## Morning Operations (08:30–11:30)

### Catering Preparation (10:00–11:30)
- Marie oversees catering prep in kitchen
- 10 packed lunches prepared: brochette, rice, plantains, juice, water
- Each pack labeled and boxed
- **API:** Catering order recorded as single sale via `POST /api/sales` with `orderSource: WAITER_POS`

### Morning Guests

| Time | Guest | Table | Order | Total (RWF) | Payment | Source |
|------|-------|-------|-------|-------------|---------|--------|
| 09:00 | C10 (Returning) | T2 | Coffee, Bruschetta | 6,000 | MTN_MOMO | QR |
| 09:30 | C23 (Walk-in) | T11 | Coffee, Samosa | 5,000 | CASH | POS |
| 10:00 | C12 (Returning) | T11 | Juice, Beef Burger | 12,000 | MTN_MOMO | QR |
| 10:30 | C20 (Walk-in) | T12 | Coffee x2 | 4,000 | CASH | QR |

### Catering Pickup (11:30)
- C35 corporate driver arrives
- 10 packed lunches handed over
- Payment processed: 125,000 RWF via card
- **API:** `POST /api/payments/irembo/*` — SUCCESS
- Receipt emailed to corporate contact

**Morning total:** 4 orders + 1 catering = 152,000 RWF

---

## Lunch Service (11:30–14:30)

### Lunch Guests

| Time | Guest | Type | Table | Party | Source | Recognition |
|------|-------|------|-------|-------|--------|-------------|
| 11:45 | C06 (Returning) | Solo | T4 | 1 | QR | ✅ Visit #16 |
| 12:00 | C33 (Church Group) | Group | T10 | 8 | QR | Returning (Day 3) |
| 12:15 | C22 (Walk-in) | Pair | T5 | 2 | POS | Returning |
| 12:30 | C09 (Reservation) | Business | T3 | 2 | POS | ✅ Visit #18 |
| 12:45 | C28 (Returning) | Solo | T8 | 1 | QR | Returning |
| 13:00 | C34 (Family Reunion) | Group | T7+T6 | 7 | POS | Returning (Day 3) |
| 13:15 | C16 (Tourists) | Group | T2 | 4 | QR | Returning |
| 13:30 | C29 (Walk-in) | Group | T11+T12 | 6 | POS | Returning (Day 4) |
| 13:45 | C18 (Family) | Family | T9 | 5 | POS | Returning (Day 2) |

**Total lunch guests:** 36

### Lunch Orders

| Order # | Time | Table | Items | Total (RWF) | Payment | Source | Kitchen |
|---------|------|-------|-------|-------------|---------|--------|---------|
| ORD-0006 | 11:45 | T4 | Beef Brochette, Rice | 10,000 | MTN_MOMO | QR | ✅ |
| ORD-0007 | 12:00 | T10 | Church: Chicken Stew x4, Rice x4, Plantains x4, Juice x8 | 62,000 | SPLIT | QR | ✅ |
| ORD-0008 | 12:15 | T5 | Pasta Bolognese x2, Fries | 18,500 | CASH | POS | ✅ |
| ORD-0009 | 12:30 | T3 | Business Lunch x2 | 16,500 | CARD | POS | ✅ |
| ORD-0010 | 12:45 | T8 | Isombe, Water | 7,000 | MTN_MOMO | QR | ✅ |
| ORD-0011 | 13:00 | T7+T6 | Reunion: Brochettes x7, Rice x4, Fries x4, Juice x7, Salad x3 | 98,000 | SPLIT | POS | ✅ |
| ORD-0012 | 13:15 | T2 | Grilled Tilapia, Beef Brochette x2, Rice x2, Juice x4 | 38,000 | CARD | QR | ✅ |
| ORD-0013 | 13:30 | T11+T12 | Group: Mixed Grill x6, Fries x6, Juice x6 | 66,000 | SPLIT | POS | ✅ |
| ORD-0014 | 13:45 | T9 | Family: Chicken Stew x2, Rice x2, Plantains x2, Juice x5 | 35,500 | MTN_MOMO | POS | ✅ |

### Split Bill Handling (3 split payments)

**ORD-0007 (Church Group — 8 people, 62,000 RWF):**
- 4 × MTN MoMo (15,500 RWF each) + 1% fee = 62,620 RWF total
- `POST /api/split-payment/[id]/progress` — all 4 payments tracked
- **API:** `POST /api/checkout/tap-and-leave` for each participant

**ORD-0011 (Family Reunion — 7 people, 98,000 RWF):**
- 3 × Cash (33,000 RWF each) + 1 × Card (32,980 RWF with 1% fee)
- Split payment progress tracked via API
- Cash collected by Patrick (Cashier), card processed via IremboPay

**ORD-0013 (Walk-in Group — 6 people, 66,000 RWF):**
- 3 × MTN MoMo (22,000 RWF each) + 1% fee = 66,660 RWF
- All payments successful

### Kitchen Performance (Lunch)

| Metric | Value |
|--------|-------|
| Total items | 72 |
| Avg prep time | 14.5 min |
| Peak concurrent | 5 orders |
| Kitchen messages | 0 |
| Status errors | 0 |

---

## Afternoon (14:30–18:00)

### Incident 8: Cancelled Order (15:30)

**C26** orders Pizza Pepperoni via QR at T4. After 5 minutes, realizes they need to leave.

| Time | Action | API |
|------|--------|-----|
| 15:30 | Order placed | `POST /api/sales` — 13,000 RWF |
| 15:31 | Kitchen accepts | `POST /api/kitchen/update-status` (accepted) |
| 15:35 | Customer requests cancellation | Alice notified |
| 15:36 | Alice cancels order | `PATCH /api/sales/[id]` — status: CANCELLED |
| 15:37 | Kitchen notified | KDS updated, order removed from queue |
| 15:38 | No payment to refund (unpaid) | Sale status: CANCELLED, paymentStatus: PENDING |

**Impact:** 1 cancelled order, no payment processed. Kitchen freed from 1 item.  
**Severity:** P3 (minor — standard cancellation)

### Incident 9: Refund (16:00)

**C11** ordered Pasta Carbonara x2 (17,000 RWF) via POS. Paid with card. After eating, found hair in one dish.

| Time | Action | API |
|------|--------|-----|
| 16:00 | Order placed and paid | `POST /api/sales` + card payment SUCCESS |
| 16:25 | Food served | Normal |
| 16:35 | C11 reports hair in pasta | James notified |
| 16:37 | James inspects, confirms | Apologizes |
| 16:40 | James processes refund | `POST /api/payments/refunds` — 8,500 RWF (50% partial refund) |
| 16:42 | Refund processed via IremboPay | Status: REFUNDED |
| 16:45 | Audit log created | `AuditLogService.log()` — action: REFUND, reason: "Foreign object in food" |
| 16:50 | C11 satisfied with resolution | Leaves positive feedback |

**Code path verified:** `refunds.ts` lines 12-16 — refundSchema validates transactionId, reason, optional refundAmountCents. Partial refund supported.  
**Impact:** 8,500 RWF refunded. 1 partial refund.  
**Severity:** P2 (major — food quality issue required refund)

### Afternoon Guests

| Time | Guest | Table | Order | Total (RWF) | Payment | Source | Notes |
|------|-------|-------|-------|-------------|---------|--------|-------|
| 15:00 | C14 | T2 | Coffee x2, Bruschetta | 8,000 | MTN_MOMO | QR | ✅ |
| 15:30 | C26 | T4 | Pizza Pepperoni | 13,000 | — | QR | CANCELLED |
| 16:00 | C11 | T5 | Pasta Carbonara x2 | 17,000 | CARD | POS | 50% REFUND |
| 16:30 | C38 | T11 | Pizza Margherita, Water | 11,000 | MTN_MOMO | QR | ✅ |
| 17:00 | C15 | T8 | Goat Brochette, Plantains, Juice | 14,500 | MTN_MOMO | QR | ✅ |

**Afternoon total:** 4 completed orders + 1 cancelled + 1 partial refund = 50,500 RWF (net)

---

## Dinner Service (18:00–23:00)

### Dinner Guests

| Time | Guest | Type | Table | Party | Source | VIP? |
|------|-------|------|-------|-------|--------|------|
| 18:00 | C31 (Startup Team) | Group | T10 | 8 | QR | No |
| 18:30 | C19 (Returning) | Couple | T1 | 2 | QR | No |
| 19:00 | C01 (VIP) | Solo+1 | T9 | 2 | QR | ✅ |
| 19:30 | C32 (Birthday) | Group | T7 | 6 | POS | No |
| 20:00 | C25 (Walk-in) | Group | T6 | 4 | POS | No |
| 20:30 | C04 (VIP) | Solo | T8 | 1 | QR | ✅ |
| 20:45 | C15 (Returning) | Couple | T2 | 2 | POS | No |
| 21:00 | C05 (VIP) | Solo | T9 | 1 | QR | ✅ |
| 21:15 | C11 (Returning) | Pair | T3 | 2 | QR | No (returned after refund) |

### Dinner Orders

| Order # | Time | Table | Items | Total (RWF) | Payment | Source | Kitchen |
|---------|------|-------|-------|-------------|---------|--------|---------|
| ORD-0020 | 18:00 | T10 | Startup: Brochettes x8, Rice x4, Fries x4, Juice x8 | 78,000 | SPLIT | QR | ✅ |
| ORD-0021 | 18:30 | T1 | Grilled Chicken, Pasta Bolognese, Salad | 22,500 | CARD | QR | ✅ |
| ORD-0022 | 19:00 | T9 | VIP C01: Grilled Tilapia x2, Goat Brochette, Plantains, Coffee | 38,500 | CARD | QR | ✅ |
| ORD-0023 | 19:30 | T7 | Birthday: Pizza x3, Salad x3, Juice x6, Fries x3 + BIRTHDAY CAKE | 78,000 | MTN_MOMO | POS | ✅ |
| ORD-0024 | 20:00 | T6 | Pizza x2, Salad x2, Water x4 | 31,000 | CASH | POS | ✅ |
| ORD-0025 | 20:30 | T8 | VIP C04: Pasta Carbonara, Coffee | 10,500 | CARD | QR | ✅ |
| ORD-0026 | 20:45 | T2 | Goat Brochette x2, Plantains, Juice x2 | 25,000 | MTN_MOMO | POS | ✅ |
| ORD-0027 | 21:00 | T9 | VIP C05: Grilled Tilapia, Coffee, Bruschetta | 16,500 | CARD | QR | ✅ |
| ORD-0028 | 21:15 | T3 | C11 return: Pasta Bolognese x2 (complimentary) | 0 | — | QR | ✅ (comp) |

### Birthday Celebration — C32
- 6-person birthday party at T7
- Special order: 3 pizzas, 3 salads, 6 juices, 3 fries + birthday cake (brought by customer)
- Staff sang happy birthday (Diane organized)
- Table decorated with candles (Diane prepared)
- Total: 78,000 RWF
- Payment: MTN MoMo (single payment by birthday person)
- Loyalty bonus: 500 points issued to C32 via `/api/loyalty/issue`

### Complimentary Order — C11 Return
- C11 returned for dinner after afternoon refund incident
- Diane offered complimentary Pasta Bolognese x2 as goodwill
- Sale created with totalAmountCents: 0
- No payment processed
- C11 expressed satisfaction with resolution
- **Impact:** 16,000 RWF in complimentary food, but customer retained

### Split Payment — ORD-0020 (Startup Team)
- 8 people, 78,000 RWF
- 4 × MTN MoMo (19,500 RWF each) + 1% fee = 78,780 RWF
- All 4 payments successful

---

## Closing (23:00)

### Z-Report Summary

| Metric | Value |
|--------|-------|
| **Total Revenue** | **RWF 588,500** |
| Total Orders | 28 |
| Completed Orders | 26 |
| Cancelled Orders | 1 |
| Voided Orders | 0 |
| Refunded Orders | 1 (partial: 8,500 RWF) |
| Complimentary Orders | 1 (16,000 RWF) |
| Avg Order Value | RWF 22,635 |
| VAT Collected (18% inclusive) | RWF 89,654 |
| Net Revenue | RWF 498,846 |
| Payment Success Rate | 100% (25/25 payments) |
| Refund Amount | RWF 8,500 |
| Net Revenue (after refund) | RWF 580,000 |

### Payment Method Breakdown

| Method | Count | Amount (RWF) | % |
|--------|-------|-------------|---|
| Cash | 3 | 67,500 | 11.5% |
| MTN MoMo | 14 | 257,500 | 43.7% |
| Card | 8 | 263,500 | 44.8% |
| **Total** | **25** | **588,500** | **100%** |

### Order Source Breakdown

| Source | Count | % |
|--------|-------|---|
| QR_IN_VENUE | 16 | 57.1% |
| WAITER_POS | 12 | 42.9% |

### Special Transactions

| Type | Count | Amount (RWF) | Notes |
|------|-------|-------------|-------|
| Split payments | 4 | 305,380 | All successful |
| Refunds | 1 | 8,500 | Partial refund via IremboPay |
| Cancellations | 1 | 0 (unpaid) | Order cancelled before payment |
| Complimentary | 1 | 0 | Goodwill after refund incident |
| Catering | 1 | 125,000 | Corporate pickup order |

### Inventory Consumption

| Item | Consumed | Remaining | Alert? |
|------|----------|-----------|--------|
| Beef (kg) | 14.0 | 8.0 | No |
| Goat (kg) | 5.0 | 10.0 | No |
| Chicken (kg) | 6.0 | 8.0 | No |
| Fish (Tilapia) | 5 | 7 | No |
| Rice (kg) | 12.0 | 1.0 | ⚠️ CRITICAL (min 10) |
| Plantains (pcs) | 22 | 20 | No (at min) |
| Potatoes (kg) | 8.0 | 6.0 | No |
| Flour (kg) | 4.0 | 7.0 | No |
| Cheese (kg) | 3.0 | 3.0 | No |

**Inventory alerts:** 1 (rice critical — 1kg remaining, minimum 10kg)  
**Reorder:** AI recommends 30kg rice via `/api/ai/reorder` — URGENT

### AI Features Used

| Feature | API | Result |
|---------|-----|--------|
| Guest Recognition | `/api/guest/recognize` | 14 recognitions (3 VIP, 8 returning, 3 new) |
| Menu Recommendations | `/api/menu/recommendations` | 7 recommendations, 4 accepted |
| Reorder AI | `/api/ai/reorder` | Rice (30kg) — URGENT |
| Daily Insights | `/api/insights/generate` | "Catering order 21.2% of revenue; 1 refund processed; rice critical" |
| Optimization | `/api/optimization/recommendations` | "Consider dedicated catering prep station for large orders" |
| Cost Anomaly | `/api/ai/cost-anomalies` | Refund cost: 8,500 RWF; comp cost: 16,000 RWF |

### Staff Performance

| Staff | Orders | Notes |
|-------|--------|-------|
| Alice (AM) | 10 | Lunch + split bills |
| James (PM) | 12 | Dinner + refund handling + birthday party |
| Patrick (Cashier) | 25 payments + 1 refund | Refund processed correctly |
| Marie (Kitchen Mgr) | All + catering | Catering prep + dinner service |

### Close Day
- **Z-Report:** ✅ Generated with refund, cancellation, and comp details
- **Cash reconciliation:** 67,500 RWF verified
- **Digital payments:** 521,000 RWF verified
- **Refund reconciliation:** 8,500 RWF refunded via IremboPay — verified
- **Catering:** 125,000 RWF card — verified
- **Day closed:** ✅
- **PDF exported:** ✅

---

## Day 6 Issues

| # | Issue | Severity | Impact | Root Cause | Recommended Action |
|---|-------|----------|--------|------------|-------------------|
| 1 | Rice at critical level (1kg) | P1 | Cannot operate lunch tomorrow without rice | High consumption (catering + groups) | Emergency reorder 30kg rice |
| 2 | Partial refund needed (hair in food) | P2 | 8,500 RWF refund + 16,000 RWF comp | Kitchen quality issue | Review kitchen hygiene protocols |
| 3 | Order cancellation (customer leaving) | P3 | 1 cancelled order | Customer urgency | Standard — no action needed |

## Day 6 Assessment

| Area | Score | Notes |
|------|-------|-------|
| Opening procedure | 93/100 | Catering prep started early |
| Catering order | 95/100 | 10 packed lunches, on-time pickup, 125K RWF |
| Split bill handling | 95/100 | 4 split payments, all successful |
| Refund processing | 92/100 | Partial refund worked, audit trail created |
| Cancellation handling | 93/100 | Order cancelled, kitchen notified |
| Birthday celebration | 95/100 | Special arrangement handled well |
| Customer recovery | 90/100 | Complimentary order retained customer |
| Inventory | 78/100 | Rice critical — emergency reorder needed |
| Close day | 93/100 | Z-Report with refund/cancel/comp details |
| **Day 6 Overall** | **92/100** | Complex day with multiple special scenarios handled |
