# Staff Activity Report

> **Internal Operational Simulation (IOS)**  
> **Period:** July 27 – August 2, 2026

---

## Staff Roster & Activity

### S01 — Etienne Rukundo (Owner)
| Metric | Value |
|--------|-------|
| Role | Owner (full control) |
| Days Active | 7 |
| Primary Activities | Business oversight, VIP guest relations, weekly report review |
| Orders Directly Handled | 0 (delegated to staff) |
| Z-Reports Reviewed | 7 (daily) |
| Weekly Report | ✅ Reviewed Day 7 |
| AI Features Used | Brand Assistant (social media), Weekly Insights |
| Assessment | Owner effectively monitored operations through Z-Reports and BI dashboards without needing to be on floor |

### S02 — Diane Uwase (Manager)
| Metric | Value |
|--------|-------|
| Role | Manager (operations, staff, reports) |
| Days Active | 7 |
| Shift | 07:00–22:00 (all day) |
| Primary Activities | Opening checks, reservation management, staff briefing, VIP coordination, close day, Z-Report |
| Reservations Managed | 42 total across 7 days |
| Close Day Operations | 7 (all successful) |
| Z-Reports Generated | 7 |
| PDF Reports Exported | 7 daily + 1 weekly |
| VIP Coordination | 23 VIP services coordinated |
| Incident Management | 17 incidents managed |
| Customer Complaints Handled | 1 (Day 5, C39 — overcooked fish) |
| Assessment | Manager effectively ran daily operations, managed staff, handled all incidents without escalation. Close Day workflow worked flawlessly. |

### S03 — Patrick Mugisha (Cashier)
| Metric | Value |
|--------|-------|
| Role | Cashier (payments, front desk) |
| Days Active | 7 |
| Shift | 10:00–22:00 |
| Payments Processed | 213 total |
| Payment Methods | Cash (26), MTN MoMo (90), Airtel (7), Card (71), Split (19) |
| Payment Success Rate | 99.5% (212/213) |
| Refunds Processed | 1 (Day 6, partial: 8,500 RWF) |
| Avg Payment Processing Time | 2.0 min |
| Cash Reconciliation | 7/7 days accurate |
| Assessment | Cashier handled high payment volume with near-perfect success rate. Refund workflow worked correctly with audit trail. |

### S04 — Alice Iradukunda (Waiter, AM)
| Metric | Value |
|--------|-------|
| Role | Waiter (orders, tables) |
| Days Active | 7 |
| Shift | 07:00–15:00 |
| Orders Taken (POS) | 52 |
| Tables Managed | T1–T6 |
| Avg Service Time | 14.2 min |
| QR Orders Assisted | 15 (customer assistance) |
| Staff Errors | 1 (Day 5 — wrong brochette type, corrected) |
| Assessment | Strong AM waiter performance. 1 human error (misread KDS) was corrected immediately. Table management efficient. |

### S05 — James Kabera (Waiter, PM)
| Metric | Value |
|--------|-------|
| Role | Waiter (orders, tables) |
| Days Active | 7 |
| Shift | 15:00–22:00 |
| Orders Taken (POS) | 39 |
| Tables Managed | T7–T12 |
| Avg Service Time | 16.3 min |
| VIP Services | 12 (handled VIP dinner service) |
| Customer Complaints Resolved | 1 (Day 5, C39) |
| Assessment | Excellent PM waiter. Handled VIP service and complaint resolution professionally. Higher service time reflects dinner rush complexity. |

### S06 — Marie Grace Umutoni (Kitchen Manager)
| Metric | Value |
|--------|-------|
| Role | Kitchen Manager (kitchen, inventory) |
| Days Active | 7 |
| Shift | 07:00–22:00 (all day) |
| Kitchen Items Overseen | 685 total |
| KDS Transitions Managed | All (0 errors) |
| Kitchen Messages Sent | 13 |
| Inventory Alerts Managed | 12 |
| AI Reorder Recommendations | 7 (all acted upon) |
| Catering Orders | 1 (Day 6, 10 packed lunches) |
| VIP Dish Preparation | 23 VIP dishes |
| Kitchen Errors Caught | 2 (Day 5 — overcooked fish, wrong brochette) |
| Assessment | Kitchen manager effectively coordinated all 3 stations, managed inventory proactively, and caught/corrected 2 kitchen errors. AI reorder recommendations were valuable. |

### S07 — Eric Niyonzima (Kitchen, AM — Grill S1)
| Metric | Value |
|--------|-------|
| Role | Kitchen Staff (Grill Station S1) |
| Days Active | 7 |
| Shift | 07:00–15:00 |
| Items Prepared | 248 |
| Avg Prep Time | 15.3 min |
| Peak Concurrent Items | 8 (Day 7 lunch) |
| Kitchen Messages | 8 (batch cooking notifications) |
| Assessment | Grill station performed well under pressure. Batch cooking messages kept waiters informed. |

### S08 — Solange Ingabire (Kitchen, PM — Hot S2)
| Metric | Value |
|--------|-------|
| Role | Kitchen Staff (Hot Kitchen Station S2) |
| Days Active | 7 |
| Shift | 15:00–22:00 |
| Items Prepared | 285 |
| Avg Prep Time | 16.2 min |
| Peak Concurrent Items | 8 (Day 4 dinner) |
| Kitchen Messages | 5 |
| Assessment | Hot kitchen station handled highest item count. Slightly longer prep times during dinner rush (expected). |

---

## Permission System Verification

| Role | Permissions Verified | Issues |
|------|---------------------|--------|
| Owner | Full access — ✅ all operations | None |
| Manager | Operations, staff, reports — ✅ | Cannot process refunds (correct — Owner only) |
| Cashier | Payments, front desk — ✅ | Cannot create orders (correct — uses waiter POS) |
| Waiter | Orders, tables — ✅ | Cannot view payments or reports (correct) |
| Kitchen | Kitchen status, inventory — ✅ | Cannot create orders or process payments (correct) |

**Permission enforcement:** All API endpoints correctly enforce permissions via `requirePermission()` middleware. No permission escalation detected.

---

## Staff Productivity Score

| Staff | Orders/Items | Accuracy | Efficiency | Overall |
|-------|-------------|----------|-----------|---------|
| Diane (Manager) | 42 reservations | 100% | 95% | 95/100 |
| Patrick (Cashier) | 213 payments | 99.5% | 95% | 97/100 |
| Alice (Waiter AM) | 52 orders | 98% | 93% | 94/100 |
| James (Waiter PM) | 39 orders | 97% | 92% | 93/100 |
| Marie (Kitchen Mgr) | 685 items | 99.7% | 93% | 95/100 |
| Eric (Kitchen AM) | 248 items | 100% | 92% | 94/100 |
| Solange (Kitchen PM) | 285 items | 99.6% | 91% | 93/100 |

**Average staff productivity:** 94.4/100
