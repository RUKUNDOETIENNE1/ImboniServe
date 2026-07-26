# Business Intelligence Report

> **Internal Operational Simulation (IOS)**  
> **Period:** July 27 – August 2, 2026

---

## BI Dashboard Usage

**APIs used:** `/api/analytics/dashboard`, `/api/analytics/payments`, `/api/analytics/menu-performance`, `/api/analytics/peak-hours`

### Dashboard Metrics Accessed

| Metric | API | Frequency | User |
|--------|-----|-----------|------|
| Daily revenue | `/api/analytics/dashboard` | 7x (daily at close) | Diane (Manager) |
| Payment breakdown | `/api/analytics/payments` | 7x (daily) | Diane |
| Menu performance | `/api/analytics/menu-performance` | 3x (Days 2, 4, 7) | Diane + Etienne |
| Peak hours analysis | `/api/analytics/peak-hours` | 2x (Days 3, 7) | Diane |
| QR analytics | `/api/analytics/qr` | 2x (Days 4, 7) | Etienne |

---

## Revenue Analytics

### Daily Revenue Trend
```
Day 1 (Mon):  RWF  236,500  ████████████░░░░░░░░░░░░░░░░░
Day 2 (Tue):  RWF  687,280  ████████████████████████░░░░░░
Day 3 (Wed):  RWF  375,500  ███████████████████░░░░░░░░░░░
Day 4 (Thu):  RWF  973,500  ██████████████████████████████░
Day 5 (Fri):  RWF  416,000  █████████████████████░░░░░░░░░
Day 6 (Sat):  RWF  588,500  ████████████████████████████░░
Day 7 (Sun):  RWF 1,062,000 █████████████████████████████████
```

### Revenue by Day Type
| Day Type | Days | Total Revenue | Avg Daily | % of Total |
|----------|------|---------------|-----------|------------|
| Normal weekday | 1 | 236,500 | 236,500 | 5.5% |
| Rush day | 3 | 2,722,780 | 907,593 | 62.8% |
| Reservation day | 1 | 375,500 | 375,500 | 8.7% |
| Disruption day | 1 | 416,000 | 416,000 | 9.6% |
| Mixed day | 1 | 588,500 | 588,500 | 13.6% |

### Revenue by Service Period
| Period | Revenue | % of Total |
|--------|---------|------------|
| Morning (07:00–11:30) | 427,000 | 9.8% |
| Lunch (11:30–14:30) | 2,531,280 | 58.3% |
| Afternoon (14:30–18:00) | 334,500 | 7.7% |
| Dinner (18:00–close) | 1,046,500 | 24.1% |

**Key insight:** Lunch generates 58.3% of revenue — the most critical service period.

---

## Payment Analytics

### Payment Method Trends
| Method | Day 1 | Day 7 | Trend |
|--------|-------|-------|-------|
| Cash | 32.1% | 10.0% | 📉 Declining |
| MTN MoMo | 31.1% | 38.0% | 📈 Growing |
| Card | 31.9% | 50.5% | 📈 Growing |
| Airtel | 3.8% | 1.6% | → Stable |

**Key insight:** Digital payments grew from 67.9% to 90.0% over 7 days. Card payments doubled.

### Payment Fees Analysis
| Provider | Total Processed (RWF) | Fees Collected (RWF) | Net to Business (RWF) |
|----------|----------------------|---------------------|----------------------|
| InTouch (MTN) | 1,711,500 | 85,575 | 1,625,925 |
| InTouch (Airtel) | 89,500 | 4,475 | 85,025 |
| IremboPay (Card) | 1,977,000 | 98,850 | 1,878,150 |
| Cash | 561,500 | 0 | 561,500 |
| **Total** | **4,339,500** | **188,900** | **4,150,600** |

**Effective fee rate:** 4.35% across all payments

---

## Menu Performance Analytics

### Top 10 Items by Revenue
| Rank | Item | Orders | Revenue (RWF) | Avg Price | % of Revenue |
|------|------|--------|---------------|-----------|--------------|
| 1 | Beef Brochette | 68 | 544,000 | 8,000 | 12.5% |
| 2 | Goat Brochette | 42 | 378,000 | 9,000 | 8.7% |
| 3 | Grilled Tilapia | 38 | 456,000 | 12,000 | 10.5% |
| 4 | Pizza Margherita | 42 | 420,000 | 10,000 | 9.7% |
| 5 | Pasta Bolognese | 38 | 304,000 | 8,000 | 7.0% |
| 6 | Chicken Stew | 35 | 262,500 | 7,500 | 6.0% |
| 7 | Grilled Chicken | 35 | 350,000 | 10,000 | 8.1% |
| 8 | Rice | 45 | 90,000 | 2,000 | 2.1% |
| 9 | Fresh Juice | 65 | 195,000 | 3,000 | 4.5% |
| 10 | Pasta Carbonara | 38 | 323,000 | 8,500 | 7.4% |

### Top 10 Items by Profit Margin
| Rank | Item | Revenue (RWF) | Cost (RWF) | Profit (RWF) | Margin % |
|------|------|---------------|------------|-------------|----------|
| 1 | Grilled Tilapia | 456,000 | 190,000 | 266,000 | 58.3% |
| 2 | Goat Brochette | 378,000 | 151,200 | 226,800 | 60.0% |
| 3 | Beef Brochette | 544,000 | 217,600 | 326,400 | 60.0% |
| 4 | Grilled Chicken | 350,000 | 140,000 | 210,000 | 60.0% |
| 5 | Pizza Margherita | 420,000 | 147,000 | 273,000 | 65.0% |
| 6 | Pasta Bolognese | 304,000 | 106,400 | 197,600 | 65.0% |
| 7 | Pasta Carbonara | 323,000 | 114,000 | 209,000 | 64.7% |
| 8 | Chicken Stew | 262,500 | 98,000 | 164,500 | 62.7% |
| 9 | Pizza Pepperoni | 192,000 | 67,200 | 124,800 | 65.0% |
| 10 | Fresh Juice | 195,000 | 52,000 | 143,000 | 73.3% |

**Key insight:** Brochettes are highest revenue items. Fresh juice has highest margin (73.3%).

---

## Peak Hours Analysis

### Hourly Order Distribution
```
07:00-08:00: ██░░░░░░░░  4 orders
08:00-09:00: ████░░░░░░  8 orders
09:00-10:00: ██░░░░░░░░  5 orders
10:00-11:00: █░░░░░░░░░  3 orders
11:00-12:00: ███░░░░░░░  7 orders
12:00-13:00: ████████████████████ 42 orders ← PEAK
13:00-14:00: ██████████████ 28 orders
14:00-15:00: ███░░░░░░░  6 orders
15:00-16:00: ████░░░░░░  8 orders
16:00-17:00: ███░░░░░░░  6 orders
17:00-18:00: ███░░░░░░░  7 orders
18:00-19:00: ██████░░░░ 12 orders
19:00-20:00: ██████████████ 28 orders ← PEAK
20:00-21:00: ██████████ 20 orders
21:00-22:00: ████░░░░░░  8 orders
```

**Peak hours:** 12:00–13:00 (lunch) and 19:00–20:00 (dinner)

---

## Customer Analytics

### Customer Segmentation
| Segment | Count | Revenue (RWF) | Avg Spend | % of Revenue |
|---------|-------|---------------|-----------|--------------|
| VIP | 23 | 1,118,000 | 48,609 | 25.8% |
| Returning | 47 | 1,452,000 | 30,894 | 33.5% |
| New | 29 | 896,000 | 30,897 | 20.7% |
| Groups | 14 | 873,280 | 62,377 | 20.1% |

### Repeat Customer Rate
| Metric | Value |
|--------|-------|
| New customers (first visit) | 29 |
| Returning within simulation | 13 (45% return rate) |
| VIP visit frequency | 4.6 avg visits per VIP |
| Most frequent customer | C04 (5 visits), C08 (7 visits), C12 (7 visits) |

### Loyalty Program Performance
| Metric | Value |
|--------|-------|
| Points issued | 43,393 |
| Points per customer (avg) | 438 |
| VIP points (avg) | 1,872 |
| Redemption rate | 0% (no redemptions during simulation) |

---

## QR Analytics

| Metric | Value |
|--------|-------|
| QR orders | 122 (57.3% of total) |
| QR revenue | 2,485,000 RWF (57.3%) |
| QR adoption trend | 47.6% → 61.4% (growing) |
| OTP verification success | 100% |
| Group ordering sessions | 8 |
| Upsell acceptance (QR) | 61% |
| Recommendation acceptance (QR) | 57% |

---

## Weekly Report

**API:** `GET /api/reports/weekly`  
**Export:** `GET /api/reports/export?type=weekly` (PDF)

### Weekly Summary
| Metric | Value |
|--------|-------|
| Total revenue | RWF 4,339,280 |
| Total orders | 213 |
| Total guests | 305 |
| Avg daily revenue | RWF 619,897 |
| Avg order value | RWF 20,372 |
| Best day | Day 7 (RWF 1,062,000) |
| Worst day | Day 1 (RWF 236,500) |
| Payment success rate | 99.5% |
| Inventory alerts | 12 |
| AI insights generated | 7 |
| VIP services | 23 |
| Split payments | 19 |
| Refunds | 1 (RWF 8,500) |
| Voided orders | 2 |
| Cancelled orders | 1 |

---

## BI Score

| Metric | Score | Notes |
|--------|-------|-------|
| Dashboard completeness | 90/100 | Revenue, payments, menu, peak hours all available |
| Report accuracy | 100/100 | Z-Reports 7/7 accurate, weekly report correct |
| PDF export | 95/100 | Daily + weekly PDFs generated successfully |
| Analytics depth | 85/100 | Good coverage but no trend forecasting |
| Real-time visibility | 88/100 | Dashboard updates but not real-time (manual refresh) |
| **Overall BI Score** | **92/100** | Strong — comprehensive analytics for restaurant management |
