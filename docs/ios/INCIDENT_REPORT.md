# Incident Report

> **Internal Operational Simulation (IOS)**  
> **Period:** July 27 – August 2, 2026

---

## Incident Summary

| Severity | Count | Days Affected | Operations Stopped? |
|----------|-------|---------------|---------------------|
| P0 (cannot operate) | 0 | 0 | ❌ Never |
| P1 (major disruption) | 2 | Day 6, Day 7 | No |
| P2 (workflow friction) | 7 | Day 5 (×4), Day 6 (×2), Day 5 (×1) | No |
| P3 (minor usability) | 8 | Various | No |
| **Total** | **17** | | |

**Critical finding: Zero P0 incidents. Restaurant operations never stopped.**

---

## Incident Detail Log

### INC-001: Cheese Approaching Minimum (Day 2)
| Field | Value |
|-------|-------|
| ID | INC-001 |
| Day | 2 |
| Time | 14:30 (close) |
| Severity | P3 |
| Category | Inventory |
| Description | Cheese stock at 2.5kg, approaching minimum of 2kg |
| Business impact | Warning only — no items unavailable yet |
| Frequency | 1x |
| Reproducibility | High consumption rate triggers alert |
| Root cause | High pizza demand during lunch rush |
| System response | `/api/inventory/alerts` triggered correctly |
| AI response | `/api/ai/reorder` recommended 4kg cheese |
| Resolution | Restocked overnight |
| Recommended action | Increase cheese minimum threshold from 2kg to 4kg |

### INC-002: Beef at Minimum (Day 3)
| Field | Value |
|-------|-------|
| ID | INC-002 |
| Day | 3 |
| Time | 22:00 (close) |
| Severity | P3 |
| Category | Inventory |
| Description | Beef stock at 5kg (minimum level) |
| Business impact | Warning — no items unavailable |
| Root cause | High brochette demand across lunch + VIP dinner |
| System response | Alert triggered, AI reorder recommended 15kg |
| Resolution | Restocked overnight |
| Recommended action | Increase beef minimum threshold from 5kg to 8kg |

### INC-003: Cheese Out of Stock (Day 4)
| Field | Value |
|-------|-------|
| ID | INC-003 |
| Day | 4 |
| Time | 20:00 (dinner) |
| Severity | P2 |
| Category | Inventory |
| Description | Cheese completely out of stock during dinner rush |
| Business impact | 2 pizza orders affected — customers offered alternatives |
| Frequency | 1x |
| Reproducibility | High pizza demand + insufficient reorder threshold |
| Root cause | Cheese consumption exceeded expected rate; minimum threshold too low |
| System response | Menu items marked unavailable via `PUT /api/menu/[id]` |
| Customer impact | Minimal — alternatives offered, customers understanding |
| Resolution | Restocked Day 5 (6kg delivered) |
| Recommended action | Increase cheese minimum threshold to 4kg; set auto-reorder at 5kg |

### INC-004: Goat Below Minimum (Day 4)
| Field | Value |
|-------|-------|
| ID | INC-004 |
| Day | 4 |
| Time | 23:00 (close) |
| Severity | P3 |
| Category | Inventory |
| Description | Goat stock at 3kg (below 4kg minimum) |
| Business impact | Warning only |
| Root cause | High brochette demand |
| Resolution | Restocked overnight (12kg) |
| Recommended action | Increase goat minimum threshold to 6kg |

### INC-005: Late Arrival (Day 5)
| Field | Value |
|-------|-------|
| ID | INC-005 |
| Day | 5 |
| Time | 12:00–12:40 |
| Severity | P3 |
| Category | Reservation |
| Description | C36 arrived 40 minutes late for reservation |
| Business impact | Table T3 held empty for 40 minutes during lunch |
| Root cause | Customer behavior |
| System response | Reservation status remained CONFIRMED; table held |
| Resolution | Customer seated at 12:40 |
| Recommended action | Implement 15-minute grace period with automatic table release option |

### INC-006: No-Show (Day 5)
| Field | Value |
|-------|-------|
| ID | INC-006 |
| Day | 5 |
| Time | 13:00–13:30 |
| Severity | P3 |
| Category | Reservation |
| Description | C37 did not arrive for 13:00 reservation (party of 4) |
| Business impact | Table T7 held for 30 minutes, then released |
| Root cause | Customer no-show |
| System response | `PATCH /api/reservations/[id]` — status: NO_SHOW |
| Resolution | Table released after 30-min grace period, walk-in seated |
| Recommended action | Consider deposit requirement for new customers |

### INC-007: Payment Timeout (Day 5)
| Field | Value |
|-------|-------|
| ID | INC-007 |
| Day | 5 |
| Time | 12:43–13:02 |
| Severity | P2 |
| Category | Payment |
| Description | MTN MoMo payment timed out after 16 minutes |
| Business impact | 20-minute delay for C28's payment |
| Frequency | 1x in 213 payments (0.5%) |
| Reproducibility | Low — requires customer to delay MoMo approval |
| Root cause | Customer delayed approving MoMo prompt; InTouch timeout threshold reached |
| System response | `GET /api/payments/intouch/status/[id]` correctly detected PENDING → FAILED |
| Recovery | Retry initiated, second attempt succeeded in 2 minutes |
| Code path verified | `intouch/status/[id].ts` lines 62-80 — polling, status update, completion service |
| Recommended action | Consider extending timeout threshold from 15 to 20 minutes; add customer notification before timeout |

### INC-008: Kitchen Grill Delay (Day 5)
| Field | Value |
|-------|-------|
| ID | INC-008 |
| Day | 5 |
| Time | 19:30–19:55 |
| Severity | P2 |
| Category | Kitchen |
| Description | 4 concurrent brochette orders exceeded single grill capacity |
| Business impact | T6 waited 25 minutes (normal: 15 min) |
| Root cause | Physical grill capacity limitation, not system error |
| System response | Kitchen message sent via `POST /api/kitchen/messages` |
| Resolution | Customer informed, brochettes served in 2 batches |
| Recommended action | Consider 2nd grill station for peak hours (AI optimization also recommended this) |

### INC-009: Customer Complaint — Overcooked Fish (Day 5)
| Field | Value |
|-------|-------|
| ID | INC-009 |
| Day | 5 |
| Time | 20:25–21:15 |
| Severity | P2 |
| Category | Kitchen / Customer Service |
| Description | C39 complained that Grilled Tilapia was overcooked |
| Business impact | 30-min resolution time; 1 voided order; 1 replacement; 1 complimentary coffee |
| Root cause | Human error — kitchen staff left fish on grill too long |
| System response | Void via `PATCH /api/sales/[id]`; replacement sale created; comp item added |
| Resolution | Customer satisfied with replacement and comp |
| Recommended action | Add complaint tracking module; review kitchen cooking procedures |

### INC-010: Staff Mistake — Wrong Order (Day 5)
| Field | Value |
|-------|-------|
| ID | INC-010 |
| Day | 5 |
| Time | 19:15–19:42 |
| Severity | P2 |
| Category | Kitchen / Staff Error |
| Description | Kitchen prepared goat brochette instead of beef brochette |
| Business impact | 17-min delay; 1 item voided; 1 item remade |
| Root cause | Human error — kitchen staff misread KDS ticket |
| System response | KDS displayed correct order; void processed; remake ordered |
| Resolution | Correct item prepared and served |
| Recommended action | Consider larger KDS font; add item images to KDS tickets |

### INC-011: Rice Critical (Day 6)
| Field | Value |
|-------|-------|
| ID | INC-011 |
| Day | 6 |
| Time | 23:00 (close) |
| Severity | P1 |
| Category | Inventory |
| Description | Rice stock at 1kg (critical — minimum 10kg) |
| Business impact | Cannot operate lunch service next day without rice |
| Root cause | High consumption (catering order + large groups) exceeded expectations |
| System response | `/api/inventory/alerts` triggered; AI reorder recommended 30kg URGENT |
| Resolution | Emergency delivery arranged for 08:30 next morning |
| Recommended action | Increase rice minimum threshold to 15kg; set auto-reorder at 20kg |

### INC-012: Partial Refund — Foreign Object (Day 6)
| Field | Value |
|-------|-------|
| ID | INC-012 |
| Day | 6 |
| Time | 16:35–16:50 |
| Severity | P2 |
| Category | Kitchen / Payment |
| Description | Hair found in pasta; 50% partial refund processed |
| Business impact | 8,500 RWF refunded; 16,000 RWF complimentary order; customer retention at risk |
| Root cause | Kitchen hygiene lapse |
| System response | `POST /api/payments/refunds` — partial refund processed; audit log created |
| Code path verified | `refunds.ts` — schema validation, ownership check, partial refund, audit log |
| Resolution | Customer returned for dinner (complimentary), retained |
| Recommended action | Review kitchen hygiene protocols; add hairnet requirement |

### INC-013: Order Cancellation (Day 6)
| Field | Value |
|-------|-------|
| ID | INC-013 |
| Day | 6 |
| Time | 15:35 |
| Severity | P3 |
| Category | Order |
| Description | Customer cancelled order after kitchen accepted (had to leave) |
| Business impact | 1 cancelled order; no payment to refund |
| Root cause | Customer urgency |
| System response | `PATCH /api/sales/[id]` — status: CANCELLED; kitchen notified via KDS |
| Resolution | Order removed from kitchen queue |
| Recommended action | None — standard cancellation workflow |

### INC-014: Chicken Out of Stock (Day 7)
| Field | Value |
|-------|-------|
| ID | INC-014 |
| Day | 7 |
| Time | 20:00 (dinner) |
| Severity | P1 |
| Category | Inventory |
| Description | Chicken completely out of stock during dinner |
| Business impact | Chicken dishes unavailable for remaining dinner service |
| Root cause | Maximum stress day consumption exceeded all expectations |
| System response | Would mark items unavailable via menu API (end of simulation) |
| Resolution | End of simulation — would restock next day |
| Recommended action | Increase chicken stock for peak days; set auto-reorder at 10kg |

### INC-015: Multiple Items Short (Day 7)
| Field | Value |
|-------|-------|
| ID | INC-015 |
| Day | 7 |
| Time | 21:00 (close) |
| Severity | P1 |
| Category | Inventory |
| Description | 7 items at or below minimum (goat, chicken, fish, plantains, potatoes, flour, cheese) |
| Business impact | Multiple menu items would be unavailable next day |
| Root cause | Maximum stress test consumed more than any previous day |
| System response | AI reorder recommended all 7 items |
| Resolution | End of simulation — comprehensive restock needed |
| Recommended action | Implement automated purchase order generation from AI reorder recommendations |

### INC-016: Flour Below Minimum (Day 7)
| Field | Value |
|-------|-------|
| ID | INC-016 |
| Day | 7 |
| Time | 21:00 (close) |
| Severity | P3 |
| Category | Inventory |
| Description | Flour at 2kg (below 6kg minimum) |
| Business impact | Pizza availability at risk |
| Root cause | High pizza demand on stress test day |
| Recommended action | Increase flour minimum to 8kg |

### INC-017: Beef at Minimum (Day 5)
| Field | Value |
|-------|-------|
| ID | INC-017 |
| Day | 5 |
| Time | 07:00 (opening) |
| Severity | P3 |
| Category | Inventory |
| Description | Beef at 5kg (minimum) at start of day |
| Business impact | Warning — monitored throughout day |
| Resolution | Restocked for Day 6 (15kg) |
| Recommended action | Already addressed — threshold increase recommended |

---

## Incident Analysis by Category

| Category | Count | P0 | P1 | P2 | P3 |
|----------|-------|----|----|----|----|
| Inventory | 10 | 0 | 2 | 1 | 7 |
| Kitchen | 3 | 0 | 0 | 3 | 0 |
| Payment | 1 | 0 | 0 | 1 | 0 |
| Reservation | 2 | 0 | 0 | 0 | 2 |
| Order | 1 | 0 | 0 | 0 | 1 |
| **Total** | **17** | **0** | **2** | **5** | **10** |

---

## Root Cause Analysis

| Root Cause | Count | % |
|------------|-------|---|
| Inventory threshold too low | 7 | 41% |
| Human error (kitchen) | 3 | 18% |
| Customer behavior | 3 | 18% |
| Physical capacity (grill) | 1 | 6% |
| Payment gateway timeout | 1 | 6% |
| Kitchen hygiene | 1 | 6% |
| High demand (catering/stress) | 1 | 6% |

**Primary finding:** 41% of incidents are inventory-related — threshold tuning would eliminate most recurring alerts.

---

## Recommended Actions Summary

| Priority | Action | Incidents Addressed | Effort |
|----------|--------|-------------------|--------|
| P1 | Increase inventory minimum thresholds (beef, goat, cheese, rice, chicken, flour) | 7 | 2 hrs |
| P1 | Implement automated purchase orders from AI reorder | 5 | 8 hrs |
| P1 | Add complaint tracking module | 1 | 6 hrs |
| P2 | Add 2nd grill station for peak hours | 1 | Physical (not software) |
| P2 | Extend payment timeout threshold | 1 | 1 hr |
| P2 | Add customer notification before payment timeout | 1 | 2 hrs |
| P2 | Review kitchen hygiene protocols | 1 | Operational |
| P2 | Add item images to KDS tickets | 1 | 4 hrs |
| P2 | Increase KDS font size | 1 | 1 hr |
| P3 | Implement 15-min grace period with auto-release for reservations | 2 | 4 hrs |
| P3 | Consider deposit requirement for new customer reservations | 1 | 3 hrs |
| P3 | Add post-meal customer feedback form | 1 | 4 hrs |
| P3 | Add digital waitlist for walk-ins during peak | 1 | 6 hrs |
| P3 | Add automated birthday/anniversary alerts | 1 | 3 hrs |
