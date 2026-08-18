# CR-001 — Failure Simulation Report

**Review:** CR-001 — Confidence Readiness Review
**Date:** 2026-08-07
**Status:** Complete
**Approach:** Trace code paths for 10 realistic failure scenarios

---

## Executive Summary

The failure simulation traced 10 realistic failure scenarios through the actual code. 3 scenarios revealed HIGH severity data integrity risks. 4 scenarios revealed MEDIUM severity operational issues. 3 scenarios were well-designed.

**Results:**
- Data Integrity Risk: 3 scenarios (HIGH)
- Operational Issues: 4 scenarios (MEDIUM)
- Well-Designed: 3 scenarios (LOW)

---

## Scenario 1: Network Interruption During Payment — HIGH

**Code Path:** `src/lib/services/payment-completion.service.ts` lines 32-248

**What Happens:**
1. Webhook fires → `onPaymentSuccess()` called
2. Line 50-58: Sale updated to COMPLETED via `updateMany` (idempotent guard)
3. Line 81-89: PaymentTransaction updated to SUCCESS via `updateMany` (idempotent guard)
4. Lines 92-225: Side effects in SEPARATE try-catch blocks:
   - SmartDiningSlip generation (try-catch, failure logged)
   - GuestRecognition (try-catch, failure logged)
   - Notification (try-catch, failure logged)
   - Real-time broadcast (try-catch, failure logged)
   - Kitchen dispatch (try-catch, failure logged)
   - **Billing ledger entry (try-catch, failure logged)** ← CRITICAL
   - Audit log (try-catch, failure logged)

**If Database Write Fails After Sale Update:**
- Sale is marked COMPLETED
- PaymentTransaction is marked SUCCESS
- **FinancialLedgerEntry is NOT created** (if ledger write fails)
- Customer sees "Paid" — order is complete
- But ledger has no record of the revenue
- Z-Report cross-check (SIM-CRIT-002) would show "Ledger Variance Detected" — but only AFTER the fact

**Duplicate Webhook:**
- `updateMany` guards prevent double-processing ✅
- Ledger idempotency key prevents duplicate entries ✅

**Data Integrity Risk:** YES — Sale COMPLETED without ledger entry
**Severity:** HIGH
**Confidence Impact:** This is the exact scenario SIM-CRIT-002 was supposed to prevent. The fix added a DISPLAY cross-check but did NOT make the ledger write transactional with the sale update. The root cause remains.

---

## Scenario 2: Delayed Kitchen (30 min no update) — MEDIUM

**Code Path:** `src/lib/services/watchdog/`, `src/pages/api/kitchen/update-status.ts`

**What Happens:**
1. Order dispatched to kitchen (kitchen-dispatch.service.ts)
2. Kitchen staff don't update status
3. **NO watchdog exists for kitchen order delays**
   - `customer-watchdog.service.ts`: Monitors customer dormancy, NOT kitchen delays
   - `service-quality-watchdog.service.ts`: Monitors MarketplaceOrder response times, NOT restaurant kitchen orders
4. `kitchen/update-status.ts` lines 258-272: 45-minute delay detection logs to shadow events but doesn't alert
5. Customer sees stale "preparing" status indefinitely

**Data Integrity Risk:** NO
**Severity:** MEDIUM
**Confidence Impact:** No escalation for delayed orders. Customer has no visibility into delay. Kitchen staff have no reminder.

---

## Scenario 3: Failed Payment After Order Confirmed — MEDIUM

**Code Path:** `src/lib/services/payment-completion.service.ts` lines 254-324

**What Happens:**
1. Payment fails → `onPaymentFailure()` called
2. Sale updated to `paymentStatus: 'FAILED'` (with guard)
3. PaymentTransaction updated to `status: 'FAILED'`
4. Billing event logged with `PAYMENT_FAILED`
5. Audit log entry created

**Can Order Be Re-paid?**
- Order status is FAILED, not CANCELLED
- **NO explicit retry mechanism found** in code
- Order is stuck in FAILED state
- Ledger has a FAILED entry (correct)

**Data Integrity Risk:** NO — Ledger properly records failure
**Severity:** MEDIUM
**Confidence Impact:** Order stuck with no clear retry path. Customer must contact support or create a new order.

---

## Scenario 4: Cancelled Reservation — LOW (Well-Designed)

**Code Path:** `src/lib/services/reservation.service.ts` lines 368-397

**What Happens:**
1. `cancelReservation()` called
2. Transaction wraps both reservation update AND table release
3. Reservation status → CANCELLED
4. Table status → AVAILABLE (atomic within same transaction)
5. If reservation is for "now" and table is occupied: transaction ensures atomic table management

**Data Integrity Risk:** NO
**Severity:** LOW
**Confidence Impact:** Properly designed with transactional integrity. ✅

---

## Scenario 5: Inventory Goes Negative — LOW (Well-Designed)

**Code Path:** `src/lib/services/inventory-ledger.service.ts` lines 116-193

**What Happens:**
1. `applyMutation()` called with CONSUMPTION type
2. Fetch inventory item with row-level lock
3. Calculate new stock
4. **Negative stock prevention**: throws `InsufficientStockError` if `newStock < 0`
5. Transaction rolls back

**Data Integrity Risk:** NO
**Severity:** LOW
**Confidence Impact:** Properly blocks negative stock. ✅

---

## Scenario 6: Duplicate Webhook (3 times) — LOW (Well-Designed)

**Code Path:** `src/pages/api/payments/irembo/webhook.ts`, `src/lib/services/billing-ledger.service.ts`

**What Happens:**
1. First webhook: `updateMany` updates transaction, side effects execute
2. Second webhook: `updateMany` guard prevents update (count=0), returns "Already processed"
3. Third webhook: Same as second
4. Ledger idempotency: Unique key on `{tx.id}:{eventType}:{sec}` catches P2002

**Data Integrity Risk:** NO
**Severity:** LOW
**Confidence Impact:** Properly idempotent at all layers. ✅

---

## Scenario 7: Incomplete Closing (server crash midway) — HIGH

**Code Path:** `src/pages/api/reports/close-day.ts` lines 204-298

**What Happens:**
1. POST request to close-day
2. Check if already closed (query auditLog)
3. Fetch sales data
4. **NO TRANSACTION wraps the entire operation**
5. Create auditLog entry for CLOSE_DAY
6. If server crashes after auditLog: day is marked closed but other operations incomplete
7. **NO ROLLBACK mechanism**
8. Re-close attempt blocked by existing auditLog check

**Data Integrity Risk:** YES — Half-closed day possible
**Severity:** HIGH
**Confidence Impact:** A crash during close-day leaves the system in an inconsistent state that cannot be automatically recovered.

---

## Scenario 8: Executive Acting on Outdated Information — MEDIUM

**Code Path:** `src/pages/api/admin/executive/cfo.ts`, `src/pages/api/admin/executive/executive-intelligence.ts`

**What Happens:**
1. Executive API executes `Promise.all()` of multiple service calls
2. All queries are **real-time database queries** — no caching ✅
3. `DataFreshnessIndicator` component exists but only displays `lastUpdated` timestamp
4. **NOT used in executive dashboard views**
5. If executive makes decision based on stale browser session: no warning

**Data Integrity Risk:** NO
**Severity:** MEDIUM
**Confidence Impact:** Data is real-time but UI doesn't show data age for executive dashboards. Executive could be looking at a stale browser tab.

---

## Scenario 9: Staff Marks Wrong Order as "Served" — HIGH

**Code Path:** `src/lib/services/sale-item-status.service.ts` lines 132-319, `src/lib/services/state-machine.service.ts` lines 20-26

**What Happens:**
1. Staff marks order as DELIVERED
2. State machine: READY → DELIVERED allowed
3. DELIVERED → (any): **NOT ALLOWED** (empty array)
4. Once DELIVERED, **NO REVERSAL MECHANISM**
5. Only PREPARING/READY → CANCELED triggers reversal
6. DELIVERED → CANCELED: **NOT SUPPORTED**
7. No administrative override found

**Data Integrity Risk:** YES — Wrong status cannot be corrected
**Severity:** HIGH
**Confidence Impact:** Staff mistake is permanent. If waiter marks the wrong table as served, there is no way to fix it. This would cause significant operational problems in a busy restaurant.

---

## Scenario 10: Partner Commission Rate Changes Mid-Month — LOW (Well-Designed)

**Code Path:** `src/lib/services/commission.service.ts`, `src/lib/services/founder-commission.service.ts`

**What Happens:**
1. Commission calculated at time of invoice creation
2. Rate fetched from `partnerAgreement.terms.commissionRatePercent` at creation time
3. If rate changes mid-month: new commissions use new rate, existing keep old rate
4. **No retroactive recalculation** — correct behavior

**Data Integrity Risk:** NO
**Severity:** LOW
**Confidence Impact:** Proper point-in-time calculation. ✅

**Note:** Marketer commission rate is hardcoded at 15% (`marketer-commission.service.ts` lines 14-17) — not configurable but consistent.

---

## Summary

| Scenario | Data Integrity | Severity | Status |
|----------|---------------|----------|--------|
| 1. Network interruption during payment | YES | HIGH | ⚠️ Partial state possible |
| 2. Delayed kitchen (30 min) | NO | MEDIUM | ⚠️ No watchdog |
| 3. Failed payment | NO | MEDIUM | ⚠️ No retry mechanism |
| 4. Cancelled reservation | NO | LOW | ✅ Well-designed |
| 5. Inventory negative | NO | LOW | ✅ Properly blocked |
| 6. Duplicate webhook | NO | LOW | ✅ Properly idempotent |
| 7. Incomplete closing | YES | HIGH | ⚠️ No transaction wrapper |
| 8. Executive stale data | NO | MEDIUM | ⚠️ No freshness indicator |
| 9. Staff mistakes | YES | HIGH | ⚠️ No reversal mechanism |
| 10. Partner commission rate change | NO | LOW | ✅ Proper point-in-time |

---

## Critical Issues

1. **Payment completion is not transactional** (Scenario 1) — Sale can be COMPLETED without ledger entry
2. **Close-day is not atomic** (Scenario 7) — Half-closed day possible on crash
3. **DELIVERED status is permanent** (Scenario 9) — Staff mistakes cannot be corrected

These are the same 3 issues identified by the failure simulation subagent. They represent real data integrity risks that could affect Customer #1 on day one.

---

## Board Assessment

The failure simulation revealed that while the platform handles many failure scenarios well (idempotency, negative stock prevention, transactional reservation management), it has 3 HIGH severity data integrity gaps:

1. Payment completion lacks transactional integrity
2. Close-day lacks atomicity
3. Terminal status lacks reversal mechanism

These are correctable. After correction, the platform's failure response will be significantly more robust.
