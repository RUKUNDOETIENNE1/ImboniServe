# Seven-Day Operation Log

> **Internal Operational Simulation (IOS)**  
> **Period:** July 27 – August 2, 2026

---

## Daily Summary

| Day | Date | Theme | Orders | Revenue (RWF) | Guests | VIPs | Incidents | Score |
|-----|------|-------|--------|---------------|--------|------|-----------|-------|
| 1 | Mon Jul 27 | Normal operations | 21 | 236,500 | 25 | 1 | 0 | 96 |
| 2 | Tue Jul 28 | Lunch rush | 32 | 687,280 | 45 | 2 | 1 | 94 |
| 3 | Wed Jul 29 | Reservations + VIP | 20 | 375,500 | 35 | 5 | 1 | 95 |
| 4 | Thu Jul 30 | Dinner rush (peak) | 41 | 973,500 | 55 | 5 | 2 | 93 |
| 5 | Fri Jul 31 | Disruptions | 27 | 416,000 | 30 | 1 | 7 | 88 |
| 6 | Sat Aug 1 | Mixed operations | 28 | 588,500 | 50 | 3 | 3 | 92 |
| 7 | Sun Aug 2 | Maximum stress | 44 | 1,062,000 | 65 | 6 | 3 | 92 |
| **Total** | | | **213** | **4,339,280** | **305** | **23** | **17** | **93 avg** |

---

## Revenue Trend

```
Day 1: ████████████░░░░░░░░░░ 236,500
Day 2: ██████████████████████░ 687,280
Day 3: █████████████████░░░░░░ 375,500
Day 4: ██████████████████████████ 973,500
Day 5: ██████████████████░░░░░░ 416,000
Day 6: ███████████████████████░ 588,500
Day 7: ██████████████████████████████ 1,062,000
```

**Peak revenue:** Day 7 (1,062,000 RWF)  
**Lowest revenue:** Day 1 (236,500 RWF)  
**Average daily revenue:** 619,897 RWF

---

## Order Source Distribution (7 days)

| Source | Count | % |
|--------|-------|---|
| QR_IN_VENUE | 122 | 57.3% |
| WAITER_POS | 91 | 42.7% |

QR adoption grew from 47.6% (Day 1) to 61.4% (Day 7).

---

## Payment Method Distribution (7 days)

| Method | Count | Amount (RWF) | % |
|--------|-------|-------------|---|
| Cash | 26 | 561,500 | 12.9% |
| MTN MoMo | 90 | 1,711,500 | 39.4% |
| Airtel Money | 7 | 89,500 | 2.1% |
| Card | 71 | 1,977,000 | 45.6% |
| **Total** | **213** | **4,339,500** | **100%** |

**Payment success rate:** 99.5% (212/213 — 1 timeout on Day 5, retried successfully)

---

## Kitchen Performance (7 days)

| Metric | Value |
|--------|-------|
| Total items prepared | 685 |
| Average prep time | 15.1 min |
| Peak concurrent orders | 8 (Days 4 and 7) |
| Kitchen messages sent | 13 |
| Status transition errors | 0 |
| Voided kitchen orders | 2 (Day 5) |

---

## Incident Summary (17 total)

| Severity | Count | Days |
|----------|-------|------|
| P0 (operations stopped) | 0 | — |
| P1 (major disruption) | 2 | Day 6 (rice critical), Day 7 (chicken out) |
| P2 (workflow friction) | 7 | Day 5 (×4), Day 6 (×2), Day 5 (×1) |
| P3 (minor usability) | 8 | Various |

**No P0 incidents. Restaurant operations never stopped.**

---

## AI Feature Usage (7 days)

| Feature | Times Used | Impact |
|---------|-----------|--------|
| Guest Recognition | 99 | 23 VIPs, 47 returning, 29 new identified |
| Menu Recommendations | 49 | 28 accepted (57% acceptance) |
| Upsell Recommendations | 28 | 17 accepted (61% acceptance) |
| Loyalty Points Issued | 99 | All successful |
| Reorder AI | 7 | 7 reorder recommendations, all acted upon |
| Daily Insights | 7 | Generated every day at close |
| Optimization Recommendations | 5 | 3 actionable recommendations |
| Cost Anomaly Detection | 7 | 2 anomalies flagged |
| Brand Assistant | 1 | Social media post generated |

---

## Close Day Accuracy (7 days)

| Day | Z-Report Revenue | Actual Revenue | Match? | Cash Reconciled? |
|-----|-----------------|---------------|--------|------------------|
| 1 | 236,500 | 236,500 | ✅ | ✅ |
| 2 | 687,280 | 687,280 | ✅ | ✅ |
| 3 | 375,500 | 375,500 | ✅ | ✅ |
| 4 | 973,500 | 973,500 | ✅ | ✅ |
| 5 | 416,000 | 416,000 | ✅ | ✅ |
| 6 | 588,500 | 588,500 | ✅ | ✅ |
| 7 | 1,062,000 | 1,062,000 | ✅ | ✅ |

**Z-Report accuracy: 100% (7/7 days)**  
**Cash reconciliation accuracy: 100% (7/7 days)**

---

## Platform Stability (7 days)

| Metric | Value |
|--------|-------|
| Uptime | 100% (no platform crashes) |
| API errors | 0 (all endpoints responded correctly) |
| KDS status errors | 0 (all transitions valid) |
| Payment gateway errors | 1 (InTouch timeout, retried) |
| Pusher delivery failures | 0 |
| Database errors | 0 |
| Environment validation | ✅ (ran every startup) |
| Health check failures | 0 |
