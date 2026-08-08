# Customer Journey Report

> **Internal Operational Simulation (IOS)**  
> **Period:** July 27 – August 2, 2026

---

## Customer Overview

| Category | Count | Revenue (RWF) | % of Revenue |
|----------|-------|---------------|--------------|
| VIP Guests | 23 visits | 1,118,000 | 25.8% |
| Returning Guests | 47 visits | 1,452,000 | 33.5% |
| New/Walk-in Guests | 29 visits | 896,000 | 20.7% |
| Large Groups | 14 visits | 873,280 | 20.1% |
| **Total** | **305 visits** | **4,339,280** | **100%** |

---

## VIP Guest Journeys

### C01 — Dr. Paul Kagame
| Metric | Value |
|--------|-------|
| Visits during simulation | 4 (Days 3, 4, 6, 7) |
| Total spend | 170,500 RWF |
| Avg spend | 42,625 RWF |
| Recognition accuracy | 100% (4/4) |
| Loyalty points earned | 1,705 |
| Favorite table | T10 (Private) |
| Favorite dish | Grilled Tilapia |
| Journey | Reservation → VIP recognition → Private table → QR order → Card payment → Loyalty points |

### C02 — Mrs. Jeanne d'Arc
| Metric | Value |
|--------|-------|
| Visits | 4 (Days 3, 4, 6, 7) |
| Total spend | 114,000 RWF |
| Recognition accuracy | 100% |
| Favorite table | T1 (Window) |
| Favorite dish | Fish Stew with Cassava |

### C04 — Claire Habimana
| Metric | Value |
|--------|-------|
| Visits | 5 (Days 1, 3, 4, 6, 7) |
| Total spend | 52,500 RWF |
| Recognition accuracy | 100% |
| Favorite table | T8/T9 (Booth) |
| Favorite dish | Pasta Carbonara |
| Notes | Most frequent VIP — visit #47 by Day 7 |

### C05 — Hon. James Musoni
| Metric | Value |
|--------|-------|
| Visits | 4 (Days 3, 4, 6, 7) |
| Total spend | 63,500 RWF |
| Recognition accuracy | 100% |
| Favorite dish | Grilled Tilapia |

### C40 — VIP Walk-in
| Metric | Value |
|--------|-------|
| Visits | 3 (Days 4, 6, 7) |
| Total spend | 35,500 RWF |
| Recognition | New VIP (referred by C01) |
| Notes | First visit Day 4, recognized as VIP from referral data |

---

## Returning Guest Journeys

### C06 — Alice Mutesi (Lunch Regular)
| Day | Visit | Order | Spend | Payment | Recognition |
|-----|-------|-------|-------|---------|-------------|
| 1 | Lunch | Beef Brochette, Rice | 10,000 | MTN MoMo | ✅ Visit #13 |
| 2 | Lunch | Beef Brochette, Rice | 10,000 | MTN MoMo | ✅ Visit #14 |
| 3 | Lunch | Beef Brochette, Rice | 10,000 | MTN MoMo | ✅ Visit #15 |
| 4 | — | — | — | — | — |
| 5 | — | — | — | — | — |
| 6 | Lunch | Beef Brochette, Rice | 10,000 | MTN MoMo | ✅ Visit #16 |
| 7 | Lunch | Beef Brochette, Rice | 10,000 | MTN MoMo | ✅ Visit #17 |

**Journey consistency:** C06 orders the same meal every visit. System recognizes her immediately and suggests her usual order. Loyalty points accumulate (850 total).

### C08 — Nadia Uwamahoro (Coffee Meetings)
- 7 visits (every day)
- Total spend: 42,000 RWF
- Always orders: African Tea + Avocado Salad
- Always pays: MTN MoMo
- Always source: QR_IN_VENUE
- Recognition: 100% (7/7)
- Loyalty points: 420

### C12 — Joy Tuyisenge (Quick Lunch)
- 7 visits
- Total spend: 84,000 RWF
- Favorite: Beef Burger + Orange Juice
- Recognition: 100%
- Loyalty points: 840

---

## New Customer Journey (C28 — First QR Order)

| Step | Day | Action | Platform Response |
|------|-----|--------|-------------------|
| 1 | Day 1 | Scans QR at T9 | Redirected to `/order` page |
| 2 | Day 1 | OTP verification | Phone verified via `/components/order/OTPVerification` |
| 3 | Day 1 | Browses menu | Menu displayed with categories, translations |
| 4 | Day 1 | Selects Isombe with Rice | Item detail modal shows description, prep time |
| 5 | Day 1 | Recommendation shown | "Customers also ordered: Plantains" — declined |
| 6 | Day 1 | Places order | Order sent to kitchen, KDS shows new ticket |
| 7 | Day 1 | Kitchen accepts → prepares → ready | Pusher events update order status |
| 8 | Day 1 | Served | Waiter delivers to table |
| 9 | Day 1 | MTN MoMo payment | Payment successful, receipt generated |
| 10 | Day 1 | Guest registered | `POST /api/guest/recognize` — new customer created |
| 11 | Day 1 | Loyalty points | 70 points issued |
| 12 | Day 2 | Returns — recognized | "Welcome back!" banner shown via `WelcomeBackBanner` |
| 13 | Day 3 | Returns — recognized | Visit #3, loyalty points: 210 |
| 14 | Day 5 | Returns — payment timeout | Payment retry succeeded |
| 15 | Day 7 | Returns — recognized | Visit #6, loyalty points: 420 |

**Customer retention:** C28 returned 5 times after first visit. QR ordering journey was smooth every time.

---

## Group Ordering Journey (C31 — Startup Team, 8 people)

| Step | Action | Platform Feature |
|------|--------|-----------------|
| 1 | Table T10 QR scanned by first arrival | QR code → `/order` page |
| 2 | Table session created | `joinTableSession()` — session ID generated |
| 3 | 7 more colleagues join session | Session participants tracked via `SessionParticipant` |
| 4 | Each person browses menu independently | Individual cart per participant |
| 5 | Orders placed independently | All orders consolidated under single table session |
| 6 | Kitchen sees consolidated ticket | KDS shows all items from all participants |
| 7 | Kitchen prepares in batches | Kitchen messages sent for batch updates |
| 8 | Group order summary visible | `getGroupOrderSummary()` — running total shown |
| 9 | Split payment initiated | Each participant pays their share |
| 10 | 4 × MTN MoMo payments | `POST /api/checkout/tap-and-leave` per participant |
| 11 | Split payment progress tracked | `GET /api/split-payment/[id]/progress` |
| 12 | All payments confirmed | Session closed, receipt generated |

**Group ordering occurred:** 4 times (Days 2, 4, 6, 7) — all successful.

---

## Customer Complaint Journey (C39 — Day 5)

| Step | Time | Action | Platform Response |
|------|------|--------|-------------------|
| 1 | 20:00 | Reservation arrives | Seated at T1 |
| 2 | 20:05 | Orders Grilled Tilapia | Order sent to kitchen |
| 3 | 20:25 | Food served | Normal 20 min prep |
| 4 | 20:30 | Complains: "Fish overcooked" | Waiter (James) notified |
| 5 | 20:32 | James informs kitchen manager | Marie inspects fish |
| 6 | 20:35 | Marie confirms overcooked | Acknowledges kitchen error |
| 7 | 20:37 | James offers replacement | C39 accepts |
| 8 | 20:40 | New tilapia ordered | Marie personally oversees preparation |
| 9 | 20:55 | Replacement served | C39 satisfied |
| 10 | 21:00 | Complimentary coffee offered | C39 accepts |
| 11 | 21:05 | Original order voided | `PATCH /api/sales/[id]` — status: VOIDED |
| 12 | 21:10 | Replacement sale recorded | New sale created |
| 13 | 21:15 | Complimentary coffee | No charge (0 RWF) |

**Resolution time:** 30 minutes  
**Customer satisfaction:** Satisfied with resolution  
**System handling:** Void + replacement + comp workflow worked correctly  
**Gap identified:** No dedicated complaint tracking system — handled manually via void/replacement

---

## Customer Experience Metrics

| Metric | Value | Assessment |
|--------|-------|------------|
| Guest recognition accuracy | 100% (99/99) | Excellent |
| VIP identification accuracy | 100% (23/23) | Excellent |
| New customer registration | 29 | All registered via guest recognition API |
| Customer retention (new→returning) | 45% (13/29 returned) | Good |
| Loyalty points issuance accuracy | 100% (99/99) | Excellent |
| QR order completion rate | 100% (122/122) | Excellent |
| OTP verification success | 100% (122/122) | Excellent |
| Upsell acceptance rate | 61% (17/28) | Good |
| Menu recommendation acceptance | 57% (28/49) | Good |
| Complaint resolution time | 30 min | Acceptable |
| Avg wait time (order→serve) | 15.1 min | Good |
| Payment processing time | 2.0 min avg | Excellent |

---

## Customer Journey Gaps Identified

| # | Gap | Severity | Impact | Recommendation |
|---|-----|----------|--------|----------------|
| 1 | No dedicated complaint tracking | P2 | Complaints handled via void/replacement manually | Add complaint management module (P1) |
| 2 | No customer feedback collection post-meal | P3 | No structured way to collect satisfaction scores | Add post-meal feedback form (P2) |
| 3 | No waitlist management for walk-ins during peak | P3 | Walk-ins turned away when at capacity | Add digital waitlist (P2) |
| 4 | No birthday/anniversary automated recognition | P3 | Birthday handled manually by manager | Add automated special occasion alerts (P3) |
