# OEC-001F Business Operations Improvement Matrix

## Prioritized Improvements for Operational Excellence

---

## Improvement Priority Matrix

### Tier 1: Customer #1 Blockers (COMPLETED)

| # | Improvement | Effort | Impact | Status |
|---|-------------|--------|--------|--------|
| 1 | Synchronize reservation-table status (confirm→RESERVED, cancel/complete/no-show→AVAILABLE) | Low | Critical | ✅ Complete |

### Tier 2: Pre-Launch Improvements

| # | Improvement | Effort | Impact | Priority |
|---|-------------|--------|--------|----------|
| 2 | Automatic commission reversal on order refund | Medium | High | HIGH |
| 3 | Automatic table release after payment + grace period | Medium | Medium | MEDIUM |
| 4 | Payment retry logic for failed payments | Medium | Medium | MEDIUM |
| 5 | Refund support for IremboPay (card payments) | Medium | Medium | MEDIUM |
| 6 | Auto-block menu items when inventory out of stock | Medium | Medium | MEDIUM |
| 7 | Shift scheduling for staff | High | Low | LOW |

### Tier 3: Post-Launch Evolution

| # | Improvement | Effort | Impact | Priority |
|---|-------------|--------|--------|----------|
| 8 | Predictive demand forecasting | High | High | MEDIUM |
| 9 | Automatic supplier reorder from low stock | High | Medium | LOW |
| 10 | Double-entry accounting system | Very High | Medium | LOW |
| 11 | Closed-loop action tracking | High | Medium | LOW |
| 12 | Context preservation on drill-down | Medium | Low | LOW |
| 13 | Visual floor map for tables | Medium | Low | LOW |

---

## Effort vs Impact Analysis

```
Impact
  High  │  ✅(1)     (2,8)    
        │
  Med   │            (3,4,5,6)     (9,11)
        │
  Low   │            (7)           (12,13)
        └──────────────────────────────────
          Low      Medium      High
                    Effort
```

---

## Recommended Implementation Order

### Phase 1: Quick Wins (Low Effort, Critical Impact) — COMPLETED
1. ✅ Reservation-table synchronization — **COMPLETED in OEC-001F**

### Phase 2: Financial Integrity (Medium Effort, High Impact)
2. Automatic commission reversal on order refund
3. Payment retry logic for failed payments
4. Refund support for IremboPay

### Phase 3: Operational Automation (Medium Effort, Medium Impact)
5. Automatic table release after payment + grace period
6. Auto-block menu items when inventory out of stock

### Phase 4: Staff Enhancement (High Effort, Low Impact)
7. Shift scheduling for staff

### Phase 5: Intelligence Evolution (High Effort, High Impact)
8. Predictive demand forecasting
9. Automatic supplier reorder from low stock

---

## EGR-007 Evaluation

Per EGR-007: "Every operational event must strengthen business continuity. No feature should optimize one workflow while degrading another."

| Feature | Strengthens Continuity? | Degrades Another? | Verdict |
|---------|------------------------|-------------------|---------|
| Order creation | ✅ Starts kitchen workflow | No | Keep |
| Kitchen dispatch | ✅ Notifies kitchen | No | Keep |
| Inventory consumption | ✅ Tracks stock | No | Keep |
| Payment completion | ✅ Records revenue | No | Keep |
| Refund processing | ✅ Reverses sale | No | Keep |
| Reservation confirm | ✅ Reserves table (FIXED) | No | Keep (Fixed) |
| Reservation cancel | ✅ Releases table (FIXED) | No | Keep (Fixed) |
| Daily closing | ✅ Finalizes records | No | Keep |
| Commission accrual | ✅ Tracks partner earnings | No | Keep |
| Payout processing | ✅ Pays partners | No | Keep |

**All operational features pass EGR-007 — every event strengthens business continuity.**

---

## OPS-CRIT-001 Impact Analysis

### Before Fix

| Scenario | What Happened | Risk |
|----------|--------------|------|
| Confirm reservation with table | Table stays AVAILABLE | Walk-in customer seated at reserved table |
| Cancel reservation | Table stays RESERVED | Table unavailable for walk-ins |
| No-show | Table stays RESERVED | Table unavailable for hours |
| Complete reservation | Table stays RESERVED | Table unavailable for next guests |

### After Fix

| Scenario | What Happens | Benefit |
|----------|-------------|---------|
| Confirm reservation with table | Table → RESERVED | No double-booking |
| Cancel reservation | Table → AVAILABLE | Table available for walk-ins |
| No-show | Table → AVAILABLE | Table available immediately |
| Complete reservation | Table → AVAILABLE | Table available for next guests |
| Forfeit deposit (cron) | Table → AVAILABLE | Table available for walk-ins |

**Impact: Eliminates double-booking risk and stuck-table scenarios. Strengthens table management continuity.**
