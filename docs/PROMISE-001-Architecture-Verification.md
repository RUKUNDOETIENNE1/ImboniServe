# PROMISE-001 — Architecture Verification

**Document Type:** Architecture Design Verification
**Subject:** Promise Engine — Architectural Compliance Against Intended Design
**Status:** VERIFIED — Architecture matches intended design
**Date:** 2026-08-13

---

## 1. Executive Summary

This document verifies that the Promise Engine implementation conforms to the intended architectural design. The verification examines the core design question, lifecycle flow, additive/non-blocking properties, integration paths, threshold resolution, auto-fail logic, cancellation handling, and the preservation of the financial truth chain. All architectural invariants are confirmed present in the codebase.

---

## 2. The Core Design Question

The Promise Engine was designed to answer a single, critical operational question:

> **"What is becoming at risk right now, and can we intervene before the promise is broken?"**

This question distinguishes the Promise Engine from conventional reporting:

| Capability | Conventional Reporting | Promise Engine |
|---|---|---|
| Tells you what happened | Yes (after the fact) | Yes |
| Tells you what is becoming at risk | No | **Yes** |
| Provides intervention window | No | **Yes** (WARNING → CRITICAL gap) |
| Enables real-time staff alerts | No | **Yes** (WhatsApp, email, Slack) |
| Tracks recovery after breach | No | **Yes** (RECOVERED state) |

Conventional reporting can tell you "Order #001 was fulfilled at 09:22" — but only after the fact. The Promise Engine tells you "Order #001 is becoming at risk RIGHT NOW at 09:09" — 7 minutes before the breach — giving staff an intervention window.

---

## 3. Lifecycle Flow

The complete promise lifecycle from order creation to terminal state:

```
ORDER CREATED
    │
    ▼
KITCHEN DISPATCH
    │
    ▼
PROMISE CREATED (state: ON_TRACK)
    │
    ├─── elapsed >= warningAfterMinutes ──→ WARNING
    │         │
    │         ├─── elapsed >= breachAfterMinutes ──→ CRITICAL
    │         │         │
    │         │         ├─── fulfilled after breach ──→ RECOVERED (terminal)
    │         │         ├─── 60 min without fulfillment ──→ FAILED (terminal)
    │         │         └─── order cancelled ──→ FAILED (terminal)
    │         │
    │         └─── fulfilled before breach ──→ FULFILLED (terminal)
    │
    ├─── fulfilled before warning ──→ FULFILLED (terminal)
    │
    └─── order cancelled ──→ FAILED (terminal)
```

### Lifecycle Stages

| Stage | Trigger | State | Active? |
|---|---|---|---|
| Order Created | Customer places order | — | — |
| Kitchen Dispatch | Order sent to kitchen | `ON_TRACK` | Yes |
| Warning | Elapsed >= warning threshold | `WARNING` | Yes |
| Critical | Elapsed >= breach threshold | `CRITICAL` | Yes |
| Fulfilled | Order completed before breach | `FULFILLED` | No (terminal) |
| Recovered | Order completed after breach | `RECOVERED` | No (terminal) |
| Failed | Cancelled or auto-failed | `FAILED` | No (terminal) |

---

## 4. Additive and Resilient Design

The Promise Engine is architecturally additive — it enhances the system without introducing new failure modes. This is a non-negotiable design invariant.

### 4.1 Non-Blocking Guarantee

Promise Engine failures **never** block critical business operations:

| Operation | Blocking? | Mechanism |
|---|---|---|
| Order creation | No | Promise creation wrapped in `.catch()` |
| Payment | No | Promise Engine not in payment path |
| Sale completion | No | Promise Engine not in sale completion path |
| Ledger entry | No | Promise Engine not in ledger path |
| Close-day | No | Promise Engine not in close-day path |
| Kitchen dispatch | No | `.catch()` wrapper on promise creation (line 194) |

### 4.2 Integration Point: Kitchen Dispatch

**File:** `src/lib/services/kitchen-dispatch.service.ts`, line 190

```typescript
// 4. Create service promise for SLA monitoring
await PromiseEngine.createOrUpdatePromise({
  businessId: input.businessId,
  saleId: input.saleId,
  orderNumber: input.orderNumber,
}).catch((err) => console.warn('[Kitchen Dispatch] Promise creation failed:', err))
```

The `.catch()` ensures that:
- Database failures do not block dispatch
- Network errors do not block dispatch
- SLAProfile lookup failures do not block dispatch
- The dispatch returns `{ success: true }` regardless

### 4.3 Error Isolation in Cron

**File:** `src/lib/cron.ts`, line 773

The cron tick is wrapped in try/catch at two levels:
1. **Outer level:** The entire tick function — prevents cron crashes
2. **Per-promise level:** Each promise in `evaluateActivePromises` is evaluated in its own try/catch — one failure doesn't stop others

### 4.4 Error Isolation in Events

- **TicketEvent recording:** Wrapped in `.catch()` — failures are logged as warnings, not thrown
- **Heart Pulse publishing:** `publishPromiseEvent` catches errors internally and logs warnings
- **Notification sending:** `notifyStaff` calls are wrapped in `.catch()`

---

## 5. Integration Path

### 5.1 Creation Path

```
Customer Order
    │
    ▼
Sale created in database
    │
    ▼
KitchenDispatchService.dispatchToKitchen()
    │
    ├─── Route items to stations
    ├─── Record ORDER_CREATED TicketEvent
    ├─── Log success
    └─── PromiseEngine.createOrUpdatePromise()  ← .catch() wrapped
              │
              ├─── Check idempotencyKey (findUnique)
              ├─── Resolve thresholds (SLAProfile or defaults)
              ├─── Create ServicePromise record
              ├─── Record PROMISE_CREATED TicketEvent
              └─── Publish PROMISE_CREATED Heart Pulse event
```

### 5.2 Evaluation Path

```
CronService (every 2 minutes)
    │
    ▼
PromiseEngine.evaluateActivePromises()
    │
    ├─── Fetch active promises (ON_TRACK, WARNING, CRITICAL) — batch limit 200
    │
    └─── For each promise (with error isolation):
              │
              ├─── PromiseEngine.evaluateOne(promiseId, now?)
              │         │
              │         ├─── Fetch promise + sale relations
              │         ├─── Skip if terminal (FULFILLED/FAILED/RECOVERED)
              │         ├─── Check cancellation → FAILED
              │         ├─── Check auto-fail (60 min) → FAILED
              │         ├─── Resolve fulfillment time
              │         ├─── Call evaluatePromise() (pure function)
              │         └─── If state changed → transitionTo()
              │                   │
              │                   ├─── Update DB record
              │                   ├─── Record TicketEvent
              │                   ├─── Publish Heart Pulse event
              │                   └─── Trigger interventions
              │
              └─── Continue to next promise (even if this one threw)
```

---

## 6. Threshold Resolution

**File:** `src/lib/promise-engine/promise-engine.service.ts`, `resolveThresholds` method (line 492)

Thresholds are resolved in priority order:

| Priority | Source | Warning (min) | Breach (min) |
|---|---|---|---|
| 1 | Explicit overrides in `CreatePromiseInput` | As provided | As provided |
| 2 | SLAProfile (business-level, active, no station/category) | From profile | From profile |
| 3 | Built-in defaults | 8 | 15 |

### Resolution Logic

```typescript
private static async resolveThresholds(businessId, overrideWarning?, overrideBreach?) {
  // 1. If both overrides provided, use them
  if (overrideWarning != null && overrideBreach != null) {
    return { warningAfterMinutes: overrideWarning, breachAfterMinutes: overrideBreach }
  }

  // 2. Try SLAProfile (business-level default, no station/category filter)
  const slaProfile = await prisma.sLAProfile.findFirst({
    where: { businessId, isActive: true, stationId: null, category: null },
  })

  // 3. Fall back to defaults
  return {
    warningAfterMinutes: overrideWarning ?? slaProfile?.warningAfterMinutes ?? 8,
    breachAfterMinutes: overrideBreach ?? slaProfile?.breachAfterMinutes ?? 15,
  }
}
```

The SLAProfile lookup specifically filters for `stationId: null` and `category: null` to find the business-level default profile. Station-specific and category-specific profiles are not used for promise threshold resolution in the current implementation.

---

## 7. Auto-Fail Logic

**File:** `src/lib/promise-engine/promise-engine.service.ts`, line 213

```typescript
const AUTO_FAIL_MINUTES = 60

// Auto-fail if way past breach and still not fulfilled
const elapsedMinutes = Math.floor((evalTime.getTime() - promise.startedAt.getTime()) / 60000)
if (!fulfilledAt && elapsedMinutes >= AUTO_FAIL_MINUTES) {
  await this.transitionTo(promise, 'FAILED', elapsedMinutes,
    `Auto-failed after ${elapsedMinutes}min without fulfillment`)
  return 'FAILED'
}
```

| Property | Value |
|---|---|
| Threshold | 60 minutes from `startedAt` |
| Condition | No fulfillment detected AND elapsed >= 60 min |
| Result | `FAILED` (terminal) |
| Notification | AlertDeliveryService email escalation to management |

The auto-fail check runs before the evaluator is called, ensuring that stale promises are cleaned up even if the evaluator would otherwise keep them in `CRITICAL` indefinitely.

---

## 8. Cancellation Handling

**File:** `src/lib/promise-engine/promise-engine.service.ts`, line 206

```typescript
const TERMINAL_ORDER_STATUSES = new Set(['CANCELLED', 'CANCEL'])

// Auto-fail if order is cancelled
if (TERMINAL_ORDER_STATUSES.has(sale.status)) {
  await this.transitionTo(promise, 'FAILED', null, 'Order was cancelled')
  return 'FAILED'
}
```

| Property | Value |
|---|---|
| Trigger statuses | `CANCELLED`, `CANCEL` |
| Applicable from | Any active state (ON_TRACK, WARNING, CRITICAL) |
| Result | `FAILED` (terminal) |
| Notification | AlertDeliveryService email escalation to management |

Cancellation is checked before the evaluator, ensuring that cancelled orders are immediately terminated as `FAILED` regardless of their elapsed time. This prevents phantom active promises from appearing in the Service Risks dashboard.

---

## 9. Financial Truth Chain Preservation

The Promise Engine is architecturally isolated from the financial truth chain. No Promise Engine code touches, modifies, or depends on any financial entity.

### 9.1 The Financial Truth Chain

```
Payment
    │
    ▼
PaymentCompletionService
    │
    ▼
Sale (status: COMPLETED)
    │
    ▼
PaymentTransaction
    │
    ▼
FinancialLedgerEntry
    │
    ▼
Dashboard (revenue metrics)
    │
    ▼
Z-Report (daily reconciliation report)
    │
    ▼
CEO / CFO dashboards
    │
    ▼
Reconciliation (audit trail)
```

### 9.2 Isolation Verification

| Financial Component | Touched by Promise Engine? | Evidence |
|---|---|---|
| Payment | No | Promise Engine has no import of PaymentService |
| PaymentCompletionService | No | Promise Engine has no import of PaymentCompletionService |
| Sale (financial fields) | Read-only | Promise Engine reads `sale.status`, `sale.kitchenStatus`, `sale.readyAt`, `sale.servedAt` — never writes to Sale |
| PaymentTransaction | No | No reference in promise-engine.service.ts |
| FinancialLedgerEntry | No | No reference in promise-engine.service.ts |
| Dashboard (financial) | No | Promise Engine feeds only Service Risks Dashboard |
| Z-Report | No | No reference in promise-engine.service.ts |
| Reconciliation | No | No reference in promise-engine.service.ts |

### 9.3 Read-Only Sale Access

The Promise Engine reads from the `Sale` table to determine fulfillment status. The fields accessed are:

- `sale.id` — for relation
- `sale.orderNumber` — for display in notifications
- `sale.businessId` — for tenant scoping
- `sale.kitchenStatus` — for fulfillment detection
- `sale.status` — for cancellation detection
- `sale.readyAt` — for fulfillment timestamp
- `sale.servedAt` — for fulfillment timestamp

**No financial fields (amountCents, paymentStatus, taxAmount, etc.) are accessed.** The Promise Engine never writes to the Sale table.

---

## 10. Architectural Invariants Summary

| Invariant | Status | Verification |
|---|---|---|
| Additive (non-blocking) | VERIFIED | `.catch()` on all integration points |
| Financial truth chain untouched | VERIFIED | No imports of financial services |
| Idempotent promise creation | VERIFIED | Unique `idempotencyKey` constraint |
| Tenant isolation | VERIFIED | All queries scoped by `businessId` |
| Terminal state immutability | VERIFIED | Evaluator returns early for terminal states |
| Error isolation in cron | VERIFIED | Per-promise try/catch in evaluateActivePromises |
| Event publishing on transitions only | VERIFIED | `stateChanged` flag gates event publishing |
| Deterministic evaluation | VERIFIED | Pure function with optional `now` parameter |
| Auto-fail at 60 minutes | VERIFIED | `AUTO_FAIL_MINUTES` constant + check in evaluateOne |
| Cancellation → FAILED | VERIFIED | `TERMINAL_ORDER_STATUSES` check in evaluateOne |

---

## 11. Architecture Verdict

The Promise Engine implementation fully conforms to the intended architectural design. The system is:

- **Additive:** Enhances operational visibility without introducing failure modes
- **Isolated:** Financial truth chain is completely untouched
- **Resilient:** Error isolation at every integration point
- **Deterministic:** Pure evaluation function with testable clock injection
- **Tenant-safe:** All queries scoped by businessId
- **Idempotent:** Duplicate dispatch produces exactly one promise

**Architecture Verification: PASSED**
