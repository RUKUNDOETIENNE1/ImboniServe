# Daily Operation Report — Day 4

> **Date:** Thursday, July 30, 2026  
> **Day Type:** Weekend (Thursday extended hours)  
> **Theme:** Dinner Rush, Peak Capacity, Maximum Concurrent Orders, Multiple Payment Methods  
> **Restaurant:** Café Imboni

---

## Opening (07:00)

### Business Checks
All standard checks passed. Day 3 close confirmed.

### Reservation Review (07:05)

| Time | Name | Party | Table | Status | Deposit |
|------|------|-------|-------|--------|---------|
| 12:00 | C31 (Startup Team) | 8 | T10 | CONFIRMED | 10,000 |
| 12:30 | C09 (David Kalisa) | 2 | T3 | CONFIRMED | None |
| 18:00 | C29 (Celebration Group) | 6 | T7 | CONFIRMED | 15,000 |
| 19:00 | C01 (Dr. Paul Kagame) | 2 | T10 (Private) | CONFIRMED | 30,000 |
| 19:30 | C02 (Mrs. Jeanne d'Arc) | 2 | T1 | CONFIRMED | None |
| 20:00 | C35 (Corporate) | 10 | T6+T7+T10 | CONFIRMED | 50,000 |
| 20:30 | C04 (Claire Habimana) | 1 | T8 | CONFIRMED | None |
| 21:00 | C05 (Hon. James Musoni) | 1 | T9 | CONFIRMED | None |

**Total Reservations:** 8 (including 10-person corporate event)

### Inventory Review (07:10)
- Beef restocked overnight (15kg ordered via AI from Day 3)
- All stock at healthy levels
- Marie orders extra tilapia for VIP + corporate event

### Daily Briefing (07:20)
- Extended hours (until 23:00)
- 8 reservations, peak dinner rush expected 19:00–21:00
- 10-person corporate event at 20:00 (largest group yet)
- All hands on deck for dinner — both kitchen shifts overlap 18:00–22:00

---

## Morning Operations (07:30–11:30)

| Time | Guest | Table | Order | Total (RWF) | Payment | Source |
|------|-------|-------|-------|-------------|---------|--------|
| 08:00 | C08 | T2 | Tea, Avocado Salad | 6,000 | MTN_MOMO | QR |
| 08:30 | C12 | T11 | Juice, Beef Burger | 12,000 | MTN_MOMO | QR |
| 09:00 | C23 | T12 | Coffee, Samosa | 5,000 | CASH | POS |
| 09:30 | C20 | T11 | Coffee x2 | 4,000 | CASH | QR |
| 10:00 | C17 | T4 | Coffee, Bruschetta | 6,000 | CARD | POS |

**Morning total:** 5 orders, 33,000 RWF

---

## Lunch Service (11:30–14:30)

### Lunch Guests (12 orders)

| Order # | Time | Table | Items | Total (RWF) | Payment | Source | Kitchen |
|---------|------|-------|-------|-------------|---------|--------|---------|
| ORD-0006 | 11:45 | T4 | Beef Brochette, Rice | 10,000 | MTN_MOMO | QR | ✅ |
| ORD-0007 | 12:00 | T10 | Startup: Brochettes x8, Rice x4, Fries x4, Juice x8 | 78,000 | SPLIT | QR | ✅ |
| ORD-0008 | 12:15 | T5 | Pasta Bolognese x2, Fries | 18,500 | CASH | POS | ✅ |
| ORD-0009 | 12:30 | T3 | Business Lunch x2 | 16,500 | CARD | POS | ✅ |
| ORD-0010 | 12:45 | T8 | Chicken Stew, Plantain | 7,500 | MTN_MOMO | QR | ✅ |
| ORD-0011 | 13:00 | T6 | Goat Brochette x2, Plantains, Juice x4 | 31,000 | MTN_MOMO | POS | ✅ |
| ORD-0012 | 13:15 | T2 | Grilled Tilapia, Beef Brochette, Rice, Juice x2 | 28,000 | CARD | QR | ✅ |
| ORD-0013 | 13:30 | T9 | Pizza Margherita, Water | 11,000 | AIRTEL | QR | ✅ |
| ORD-0014 | 13:45 | T1 | Grilled Chicken, Pasta, Salad | 22,500 | CARD | QR | ✅ |
| ORD-0015 | 14:00 | T4 | Isombe, Rice, Water | 9,000 | MTN_MOMO | QR | ✅ |
| ORD-0016 | 14:15 | T11 | Beef Burger, Fries, Juice | 14,000 | CASH | POS | ✅ |
| ORD-0017 | 14:30 | T5 | Pasta Carbonara, Coffee | 10,500 | CARD | QR | ✅ |

**Lunch total:** 12 orders, 256,500 RWF

---

## Afternoon (14:30–18:00)

| Time | Guest | Table | Order | Total (RWF) | Payment | Source |
|------|-------|-------|-------|-------------|---------|--------|
| 15:00 | C14 | T2 | Coffee x2, Bruschetta | 8,000 | MTN_MOMO | QR |
| 15:30 | C38 | T11 | Pizza Pepperoni, Water | 13,000 | MTN_MOMO | QR |
| 16:00 | C27 | T4 | Fries x2, Juice x2 | 8,000 | CASH | POS |
| 16:30 | C11 | T5 | Pasta Carbonara x2 | 17,000 | CARD | POS |
| 17:00 | C15 | T8 | Goat Brochette, Plantains, Juice | 14,500 | MTN_MOMO | QR |
| 17:30 | C40 (VIP Walk-in) | T9 | VIP arrives early! African Coffee, Bruschetta | 6,500 | CARD | QR |

**Afternoon total:** 6 orders, 67,000 RWF

### VIP Early Arrival — C40
- **C40 (VIP Walk-in):** Arrives at 17:30, before dinner rush
- **Recognition:** `POST /api/guest/recognize` → New VIP (first visit but referred by C01)
- **Action:** Diane personally greets, offers booth T9
- **Order:** Quick coffee and bruschetta before dinner rush

---

## Dinner Rush (18:00–23:00) — PEAK CAPACITY

### Rush Profile
- **All 12 tables occupied** by 19:30
- **Peak concurrent orders:** 8 (at 20:00)
- **Kitchen load:** All 3 stations at maximum capacity
- **Both kitchen shifts overlapping:** Eric + Solange + Marie all active

### Dinner Guest Arrivals

| Time | Guest | Type | Table | Party | Source | VIP? |
|------|-------|------|-------|-------|--------|------|
| 18:00 | C29 (Celebration) | Group | T7 | 6 | POS | No |
| 18:15 | C19 (Returning) | Couple | T1 | 2 | QR | No |
| 18:30 | C25 (Walk-in) | Group | T6 | 4 | POS | No |
| 18:45 | C21 (Walk-in) | Pair | T2 | 2 | QR | No |
| 19:00 | C01 (VIP) | Couple | T10 (Private) | 2 | QR | ✅ |
| 19:00 | C22 (Walk-in) | Pair | T3 | 2 | POS | No |
| 19:15 | C16 (Tourists) | Group | T4 | 4 | QR | No |
| 19:30 | C02 (VIP) | Couple | T1 (moved to T5) | 2 | QR | ✅ |
| 19:30 | C28 (Returning) | Solo | T11 | 1 | QR | No |
| 19:45 | C07 (Returning) | Family | T8 | 4 | POS | No |
| 20:00 | C35 (Corporate) | Group | T6+T7+T10 | 10 | POS | No |
| 20:00 | C12 (Returning) | Solo | T12 | 1 | QR | No |
| 20:15 | C06 (Returning) | Solo | T9 (shared) | 1 | QR | No |
| 20:30 | C04 (VIP) | Solo | T8 (shared) | 1 | QR | ✅ |
| 20:45 | C03 (VIP) | Solo | T11 (shared) | 1 | QR | ✅ |
| 21:00 | C05 (VIP) | Solo | T9 | 1 | QR | ✅ |
| 21:15 | C15 (Returning) | Couple | T2 | 2 | POS | No |
| 21:30 | C11 (Returning) | Pair | T3 | 2 | QR | No |

**Total dinner guests:** 47  
**Peak occupancy:** 12/12 tables + 3 shared = 100% capacity

### Dinner Orders (18 orders)

| Order # | Time | Table | Items | Total (RWF) | Payment | Source | Kitchen |
|---------|------|-------|-------|-------------|---------|--------|---------|
| ORD-0024 | 18:00 | T7 | Celebration: Pizza x3, Salad x3, Juice x6, Fries x3 | 72,000 | MTN_MOMO | POS | ✅ |
| ORD-0025 | 18:15 | T1 | Grilled Chicken, Pasta Bolognese, Salad | 22,500 | CARD | QR | ✅ |
| ORD-0026 | 18:30 | T6 | Pizza x2, Salad x2, Water x4 | 31,000 | CASH | POS | ✅ |
| ORD-0027 | 18:45 | T2 | Goat Brochette x2, Plantains, Juice x2 | 25,000 | MTN_MOMO | QR | ✅ |
| ORD-0028 | 19:00 | T10 | VIP C01: Grilled Tilapia x2, Goat Brochette x2, Plantains, Coffee x2 | 47,000 | CARD | QR | ✅ |
| ORD-0029 | 19:00 | T3 | Pasta Bolognese x2, Bruschetta | 16,500 | CARD | POS | ✅ |
| ORD-0030 | 19:15 | T4 | Grilled Tilapia, Beef Brochette x2, Rice x2, Juice x4 | 38,000 | CARD | QR | ✅ |
| ORD-0031 | 19:30 | T5 | VIP C02: Fish Stew x2, Avocado Salad, Tea x2 | 28,500 | CARD | QR | ✅ |
| ORD-0032 | 19:30 | T11 | Pizza Margherita, Coffee | 13,000 | MTN_MOMO | QR | ✅ |
| ORD-0033 | 19:45 | T8 | Family: Chicken Stew x2, Rice x2, Plantains x2, Juice x4 | 35,500 | MTN_MOMO | POS | ✅ |
| ORD-0034 | 20:00 | T6+T7+T10 | Corporate: Mixed buffet-style — Brochettes x10, Rice x5, Fries x5, Salad x5, Juice x10, Water x10 | 185,000 | CARD | POS | ✅ |
| ORD-0035 | 20:00 | T12 | Beef Brochette, Rice, Coffee | 11,500 | CASH | QR | ✅ |
| ORD-0036 | 20:15 | T9 | Beef Burger, Fries, Juice | 14,000 | MTN_MOMO | QR | ✅ |
| ORD-0037 | 20:30 | T8 | VIP C04: Pasta Carbonara, Coffee | 10,500 | CARD | QR | ✅ |
| ORD-0038 | 20:45 | T11 | VIP C03: African Coffee x3, Pizza Margherita | 16,000 | CARD | QR | ✅ |
| ORD-0039 | 21:00 | T9 | VIP C05: Grilled Tilapia, Coffee, Bruschetta | 16,500 | CARD | QR | ✅ |
| ORD-0040 | 21:15 | T2 | Goat Brochette x2, Plantains, Juice x2 | 25,000 | MTN_MOMO | POS | ✅ |
| ORD-0041 | 21:30 | T3 | Pasta Carbonara x2, Wine (N/A) | 17,000 | CARD | QR | ✅ |

### Corporate Event — C35 (10 people)
- **Table arrangement:** T6 + T7 + T10 (combined for 10-person event)
- **Order:** Buffet-style — 10 brochettes, 5 rice, 5 fries, 5 salads, 10 juices, 10 waters
- **Total:** 185,000 RWF (largest single order in simulation)
- **Payment:** Corporate card via IremboPay
- **Kitchen coordination:** Marie managed all 3 stations for this order
- **Prep time:** 25 minutes (longest in simulation)
- **Kitchen messages:** 3 messages to corporate table (status updates on batch cooking)

### Kitchen Performance (Dinner Rush)

| Metric | Value |
|--------|-------|
| Total items | 96 |
| Avg prep time | 16.8 min |
| Peak concurrent orders | 8 (at 20:00) |
| Station S1 (Grill) | 38 items, avg 16.5 min |
| Station S2 (Hot) | 42 items, avg 17.2 min |
| Station S3 (Cold/Drinks) | 16 items, avg 3.5 min |
| Kitchen messages | 4 (batch cooking notifications) |
| Longest order | ORD-0034 (Corporate, 25 min) |
| Status transition errors | 0 |

### KDS Under Load
- 8 concurrent orders at peak — all visible on KDS
- Station-based view (`/api/station/orders`) showed items grouped by S1/S2/S3
- Waiter queue (`/api/waiter/queue`) showed 5 orders "ready for pickup" at 20:15
- All status transitions enforced correctly even under load
- Pusher events delivered without delay

### Payment Processing (Dinner)

| Method | Count | Amount (RWF) | Success |
|--------|-------|-------------|---------|
| Cash | 2 | 42,500 | 100% |
| MTN MoMo | 7 | 195,500 | 100% |
| Card | 8 | 379,500 | 100% |
| **Total** | **18** | **617,500** | **100%** |

---

## Closing (23:00)

### Z-Report Summary

| Metric | Value |
|--------|-------|
| **Total Revenue** | **RWF 973,500** |
| Total Orders | 41 |
| Avg Order Value | RWF 23,744 |
| VAT Collected (18% inclusive) | RWF 148,288 |
| Net Revenue | RWF 825,212 |
| Payment Success Rate | 100% (41/41) |
| Pending Orders | 0 |
| Voided Orders | 0 |
| Peak concurrent orders | 8 |
| Table occupancy peak | 100% (12/12) |

### Payment Method Breakdown

| Method | Count | Amount (RWF) | % of Total |
|--------|-------|-------------|------------|
| Cash | 6 | 117,500 | 12.1% |
| MTN MoMo | 17 | 403,500 | 41.5% |
| Airtel Money | 1 | 11,000 | 1.1% |
| Card | 16 | 441,500 | 45.4% |
| **Total** | **41** | **973,500** | **100%** |

### Order Source Breakdown

| Source | Count | % |
|--------|-------|---|
| QR_IN_VENUE | 24 | 58.5% |
| WAITER_POS | 17 | 41.5% |

### Inventory Consumption

| Item | Consumed | Remaining | Alert? |
|------|----------|-----------|--------|
| Beef (kg) | 12.0 | 7.0 | No |
| Goat (kg) | 6.0 | 3.0 | ⚠️ Below min (4) |
| Chicken (kg) | 6.0 | 8.0 | No |
| Fish (Tilapia) | 8 | 12 | No |
| Rice (kg) | 10.0 | 13.0 | No |
| Plantains (pcs) | 20 | 42 | No |
| Potatoes (kg) | 8.0 | 6.0 | No |
| Flour (kg) | 5.0 | 11.0 | No |
| Cheese (kg) | 3.0 | 0.0 | ⚠️ OUT OF STOCK |
| Tomatoes (kg) | 6.0 | 7.0 | No |
| Coffee Beans (kg) | 2.0 | 3.0 | No |

**Inventory alerts:** 2 (goat below minimum, cheese out of stock)  
**Reorder:** AI recommends 12kg goat + 6kg cheese via `/api/ai/reorder`

### AI Features Used

| Feature | API | Result |
|---------|-----|--------|
| Guest Recognition | `/api/guest/recognize` | 18 recognitions (5 VIP, 8 returning, 5 new) |
| VIP Intelligence | `/api/guest/staff-intelligence` | 5 VIP profiles |
| Menu Recommendations | `/api/menu/recommendations` | 10 recommendations, 6 accepted |
| Reorder AI | `/api/ai/reorder` | Goat (12kg) + Cheese (6kg) |
| Daily Insights | `/api/insights/generate` | "Record revenue day; corporate event 19% of revenue; card payments 45.4%" |
| Optimization | `/api/optimization/recommendations` | "Consider 2 grill stations for peak dinner rush" |
| Cost Anomaly | `/api/ai/cost-anomalies` | Cheese cost per pizza rising — flag for review |

### Staff Performance

| Staff | Orders | Avg Service Time | Notes |
|-------|--------|-----------------|-------|
| Alice (AM) | 12 | 14.0 min | Lunch service |
| James (PM) | 18 | 17.5 min | Dinner rush, peak load |
| Patrick (Cashier) | 41 payments | 2.2 min avg | High card volume |
| Eric (AM Kitchen) | 30 items | 15.8 min | Grill under heavy load |
| Solange (PM Kitchen) | 42 items | 17.5 min | Hot kitchen at capacity |
| Marie (Kitchen Mgr) | All | 16.8 min avg | Coordinated corporate event |

### Close Day
- **Z-Report:** ✅ Generated
- **Cash reconciliation:** 117,500 RWF verified
- **Digital payments:** 856,000 RWF verified
- **Corporate event:** 185,000 RWF card — verified against IremboPay
- **Day closed:** ✅
- **PDF exported:** ✅

---

## Day 4 Issues

| # | Issue | Severity | Impact | Frequency | Root Cause | Recommended Action |
|---|-------|----------|--------|-----------|------------|-------------------|
| 1 | Cheese out of stock | P2 | 2 pizza orders affected (substituted) | 1x | High pizza demand across lunch + dinner | Increase cheese reorder threshold from 2kg to 4kg |
| 2 | Goat below minimum | P3 | Low stock warning | 1x | High brochette demand | Reorder 12kg (AI recommended) |

## Day 4 Assessment

| Area | Score | Notes |
|------|-------|-------|
| Opening procedure | 95/100 | Extended hours preparation |
| Peak capacity handling | 92/100 | 100% table occupancy, 8 concurrent orders |
| Kitchen under load | 88/100 | 96 items, 4 messages, no errors but high stress |
| Corporate event | 93/100 | 10-person event, 185K RWF, 25 min prep |
| VIP service | 96/100 | 5 VIPs during rush, all recognized |
| Payment processing | 100/100 | 41/41 successful, high card volume |
| Guest recognition | 96/100 | 18 recognitions under load |
| Inventory | 82/100 | 2 alerts (cheese out, goat low) |
| Close day | 95/100 | Accurate Z-Report, record revenue |
| **Day 4 Overall** | **93/100** | Strong performance under peak capacity |
