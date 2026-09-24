# Operational Metrics Dashboard

> **Internal Operational Simulation (IOS)**  
> **Period:** July 27 – August 2, 2026  
> **Restaurant:** Café Imboni

---

## 1. Financial Metrics

### Revenue
| Metric | Value |
|--------|-------|
| Total revenue (7 days) | RWF 4,339,280 |
| Average daily revenue | RWF 619,897 |
| Peak daily revenue | RWF 1,062,000 (Day 7) |
| Lowest daily revenue | RWF 236,500 (Day 1) |
| Revenue growth (Day 1 → Day 7) | +349% |
| Net revenue (after fees) | RWF 4,150,380 |
| Total payment fees | RWF 188,900 |
| Effective fee rate | 4.35% |
| VAT collected (18% inclusive) | RWF 661,275 |
| Net revenue (after VAT) | RWF 3,678,005 |

### Revenue by Day
| Day | Revenue | AOV | Orders | Guests |
|-----|---------|-----|--------|--------|
| 1 | 236,500 | 11,262 | 21 | 25 |
| 2 | 687,280 | 21,477 | 32 | 45 |
| 3 | 375,500 | 18,775 | 20 | 35 |
| 4 | 973,500 | 23,744 | 41 | 55 |
| 5 | 416,000 | 16,640 | 27 | 30 |
| 6 | 588,500 | 22,635 | 28 | 50 |
| 7 | 1,062,000 | 24,136 | 44 | 65 |
| **Avg** | **619,897** | **19,810** | **30.4** | **43.6** |

### Refunds & Voids
| Metric | Value |
|--------|-------|
| Total refunds | 1 (RWF 8,500) |
| Total voids | 2 (RWF 21,000) |
| Total cancellations | 1 (RWF 0 — pre-payment) |
| Total complimentary | 1 (RWF 16,000) |
| Net revenue impact | -RWF 45,500 (1.05% of gross) |

---

## 2. Operational Metrics

### Order Metrics
| Metric | Value |
|--------|-------|
| Total orders | 213 |
| Completed orders | 210 |
| Voided orders | 2 |
| Cancelled orders | 1 |
| Order completion rate | 98.6% |
| Average order value | RWF 20,372 |
| Median order value | RWF 17,000 |
| Max order value | RWF 185,000 (corporate event, Day 4) |
| Min order value | RWF 0 (complimentary, Day 6) |

### Order Source
| Source | Count | % | Revenue (RWF) |
|--------|-------|---|---------------|
| QR_IN_VENUE | 122 | 57.3% | 2,485,000 |
| WAITER_POS | 91 | 42.7% | 1,854,280 |

### Kitchen Metrics
| Metric | Value |
|--------|-------|
| Total kitchen items | 685 |
| Average prep time | 15.1 min |
| Peak concurrent orders | 8 |
| Kitchen messages | 13 |
| Status transition errors | 0 |
| Kitchen error rate | 0.44% (3/685) |
| Station S1 items | 248 (36.2%) |
| Station S2 items | 285 (41.6%) |
| Station S3 items | 152 (22.2%) |

### Service Time
| Period | Avg Order→Serve Time |
|--------|---------------------|
| Morning | 10.5 min |
| Lunch | 14.8 min |
| Afternoon | 8.2 min |
| Dinner | 16.5 min |
| **Overall** | **15.1 min** |

---

## 3. Payment Metrics

### Payment Success
| Metric | Value |
|--------|-------|
| Total payment attempts | 213 |
| Successful payments | 212 |
| Failed payments | 1 (timeout, retried) |
| Payment success rate | 99.5% |
| Retry success rate | 100% (1/1) |
| Average payment processing time | 2.0 min |

### Payment Distribution
| Method | Count | % | Amount (RWF) | Fees (RWF) |
|--------|-------|---|-------------|------------|
| Cash | 26 | 12.2% | 561,500 | 0 |
| MTN MoMo | 90 | 42.3% | 1,711,500 | 85,575 |
| Airtel Money | 7 | 3.3% | 89,500 | 4,475 |
| Card | 71 | 33.3% | 1,977,000 | 98,850 |
| Split Payment | 19 | 8.9% | 921,440 | 9,156 |

### Reconciliation
| Metric | Value |
|--------|-------|
| Z-Report accuracy | 100% (7/7 days) |
| Cash reconciliation | 100% (7/7 days) |
| Digital payment verification | 100% (7/7 days) |
| Refund reconciliation | 100% (1/1) |

---

## 4. Customer Metrics

### Guest Statistics
| Metric | Value |
|--------|-------|
| Total guest visits | 305 |
| Unique customers | 40 |
| New customers | 29 |
| Returning customers | 47 visits |
| VIP visits | 23 |
| Group visits | 14 |
| Average party size | 2.3 |
| Average spend per guest | RWF 14,226 |

### Guest Recognition
| Metric | Value |
|--------|-------|
| Recognition attempts | 99 |
| Recognition accuracy | 100% |
| VIP identifications | 23 |
| New registrations | 29 |
| Loyalty points issued | 43,393 |

### Customer Retention
| Metric | Value |
|--------|-------|
| New→Returning rate | 45% (13/29) |
| VIP visit frequency | 4.6 avg |
| Most frequent guest | C08 (7 visits), C12 (7 visits) |
| Customer satisfaction (estimated) | 97% (based on complaints: 1/305) |

---

## 5. Inventory Metrics

| Metric | Value |
|--------|-------|
| Items tracked | 20 |
| Total alerts | 12 |
| AI reorder recommendations | 7 |
| Stockouts | 2 (cheese, chicken) |
| Restocking events | 5 |
| Reconciliation accuracy | 100% (7/7) |
| Consumption events | 213 |
| Inventory error rate | 0% |

---

## 6. AI Metrics

| Metric | Value |
|--------|-------|
| Total AI calls | 325 |
| AI success rate | 100% |
| Guest recognitions | 99 |
| Menu recommendations | 49 (57% accepted) |
| Upsell recommendations | 28 (61% accepted) |
| Reorder recommendations | 7 (all acted upon) |
| Daily insights | 7 |
| Optimization recommendations | 5 |
| Cost anomalies | 2 flagged |
| AI credits used | 168 |
| Upsell revenue impact | RWF 84,000 (1.9% of revenue) |

---

## 7. Staff Metrics

| Metric | Value |
|--------|-------|
| Staff roster | 7 |
| Total staff shifts | 49 (7 staff × 7 days) |
| Permission violations | 0 |
| Staff errors | 3 (all corrected) |
| Staff error rate | 0.44% |
| Average staff productivity score | 94.4/100 |

---

## 8. Platform Stability Metrics

| Metric | Value |
|--------|-------|
| Platform uptime | 100% |
| API errors | 0 |
| KDS transition errors | 0 |
| Pusher delivery failures | 0 |
| Database errors | 0 |
| Health check failures | 0 |
| Environment validation failures | 0 |
| PDF export failures | 0 |

---

## 9. Incident Metrics

| Severity | Count | % |
|----------|-------|---|
| P0 (operations stopped) | 0 | 0% |
| P1 (major disruption) | 2 | 11.8% |
| P2 (workflow friction) | 5 | 29.4% |
| P3 (minor usability) | 10 | 58.8% |
| **Total** | **17** | **100%** |

### Mean Time to Resolution (MTTR)
| Severity | MTTR |
|----------|------|
| P1 | 12 hours (restock next day) |
| P2 | 22 minutes (avg) |
| P3 | Immediate (acknowledged) |

---

## 10. Compliance & Audit Metrics

| Metric | Value |
|--------|-------|
| Audit log entries | 213+ (every sale, payment, status change) |
| Z-Reports generated | 7 |
| Weekly report generated | 1 |
| PDF exports | 8 (7 daily + 1 weekly) |
| Refund audit trail | ✅ Complete |
| Void audit trail | ✅ Complete |
| Permission enforcement | ✅ All endpoints |
| Data integrity | ✅ 100% reconciliation |
