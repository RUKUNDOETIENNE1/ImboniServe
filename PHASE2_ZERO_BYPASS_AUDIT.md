# Phase 2 Zero Bypass Audit

**Date:** 2026-06-29
**Status:** COMPLETE
**Question:** Can any production code still bypass the Kitchen Consumption Engine?

---

## Answer: NO

After Phase 2 migration, **no production code can bypass the Kitchen Consumption Engine** for kitchen execution flows.

---

## Evidence

### Repository-Wide Search: `saleItem.update` / `saleItem.updateMany`

```
Search: saleItem\.update|saleItem\.updateMany
Path: src/**/*.ts
Results: 8 matches
```

| File | Line | Classification |
|------|------|----------------|
| `sale-item-status.service.ts:267` | `tx.saleItem.update({ itemStatus })` | AUTHORITATIVE |
| `consumption-engine.service.ts:229` | `tx.saleItem.update({ consumptionState })` | AUTHORITATIVE |
| `consumption-engine.service.ts:315` | `tx.saleItem.update({ consumptionState })` | AUTHORITATIVE |
| `consumption-engine.service.ts:388` | `tx.saleItem.update({ consumptionState })` | AUTHORITATIVE |
| `consumption-engine.service.ts:455` | `tx.saleItem.update({ consumptionState })` | AUTHORITATIVE |
| `kitchen-dispatch.service.ts:87` | `itemStatus: 'NEW'` | INITIAL STATE (documented) |
| `order-mutation.service.ts:108` | `mutationType: 'REPLACED'` | NOT itemStatus |
| `order-mutation.service.ts:168` | `mutationType: 'CANCELLED'` | NOT itemStatus |

### Analysis

1. **SaleItemStatusService (line 267):** This IS the authoritative service. Not a bypass.

2. **ConsumptionEngineService (lines 229, 315, 388, 455):** Updates `consumptionState`, NOT `itemStatus`. This is correct behavior - the consumption engine manages consumption state while SaleItemStatusService manages item status.

3. **KitchenDispatchService (line 87):** Sets `itemStatus: 'NEW'` during initial order dispatch. This is the **initial state assignment**, not a state transition. Consumption only triggers on `NEW → PREPARING`, so this does not bypass the engine.

4. **OrderMutationService (lines 108, 168):** Updates `mutationType`, NOT `itemStatus`. The `itemStatus` change is now delegated to `SaleItemStatusService.transitionTx()`.

---

### Repository-Wide Search: `itemStatus` Assignments

```
Search: itemStatus.*=|itemStatus:
Path: src/**/*.ts (excluding tests)
```

| File | Context | Classification |
|------|---------|----------------|
| `sale-item-status.service.ts` | Service implementation | AUTHORITATIVE |
| `consumption-engine.service.ts` | Read-only checks | NOT A MUTATION |
| `kitchen-dispatch.service.ts` | `itemStatus: 'NEW'` | INITIAL STATE |
| `state-machine.service.ts` | Validation logic | NOT A MUTATION |
| `station-load.service.ts` | Query filters | NOT A MUTATION |
| `expo-finalization.service.ts` | Read-only checks | NOT A MUTATION |
| Various API routes | Response mapping | NOT A MUTATION |

---

### Repository-Wide Search: Direct Prisma Writes

```
Search: prisma\.saleItem\.update|tx\.saleItem\.update
Path: src/**/*.ts (excluding tests)
```

All direct writes are now either:
1. Within authoritative services (SaleItemStatusService, ConsumptionEngineService)
2. For non-itemStatus fields (mutationType, stationId, routedAt)
3. Initial state assignment (itemStatus: 'NEW' during dispatch)

---

## Bypass Prevention Mechanisms

### 1. Single Entry Point

All production status transitions MUST go through:
- `SaleItemStatusService.transition()` (for API endpoints)
- `SaleItemStatusService.transitionTx()` (for transactional contexts)

### 2. State Machine Validation

`StateMachineService.validateTransition()` is called for every transition, preventing invalid state changes.

### 3. Consumption State Guard

`consumptionState` field prevents double-deduction:
- `PENDING` → Can consume
- `CONSUMED` → Cannot consume again
- `REVERSED` → Cannot consume again
- `SKIPPED` → No recipe, no consumption

### 4. Transaction Atomicity

All mutations are within Prisma transactions, ensuring all-or-nothing behavior.

---

## Remaining Non-Bypass Paths

These paths exist but do NOT bypass the Kitchen Consumption Engine:

### 1. Initial State Assignment

**File:** `kitchen-dispatch.service.ts`
**Code:** `itemStatus: 'NEW'`
**Why not a bypass:** This is the initial state, not a transition. Consumption only triggers on `NEW → PREPARING`.

### 2. Manual Inventory Adjustments

**File:** `inventory.service.ts`
**Code:** `recordUpdate()` with ADD/REMOVE/WASTE/ADJUSTMENT
**Why not a bypass:** This is for manual stock management, not kitchen consumption. Different purpose, different audit trail.

### 3. OCR Document Apply

**File:** `die/documents/[id]/apply.ts`
**Code:** Direct inventory updates for supplier deliveries
**Why not a bypass:** This is for receiving inventory from suppliers, not kitchen consumption.

---

## Conclusion

**Can any production code still bypass the Kitchen Consumption Engine?**

**NO.**

Every production `SaleItem.itemStatus` transition now flows through `SaleItemStatusService`, which:
1. Validates via `StateMachineService`
2. Triggers consumption via `ConsumptionEngineService` on `NEW → PREPARING`
3. Triggers reversal via `ConsumptionEngineService` on `PREPARING/READY → CANCELED`
4. Records audit via `TicketEventService`

The only remaining direct mutations are:
- Initial state assignment (`NEW`) - not a transition
- Non-itemStatus fields (`mutationType`, `consumptionState`)
- Manual inventory paths (separate from kitchen consumption)

**Zero Bypass Status: VERIFIED**
