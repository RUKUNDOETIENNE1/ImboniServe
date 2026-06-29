# Phase 2 Mutation Migration Report

**Date:** 2026-06-29
**Status:** COMPLETE
**Phase:** Kitchen Consumption Engine - Phase 2 (Repository Mutation Migration)

---

## Executive Summary

Phase 2 has successfully migrated all production `SaleItem.itemStatus` mutations to flow through the authoritative `SaleItemStatusService`. This ensures that:

1. Every status transition is validated by `StateMachineService`
2. Consumption is triggered on `NEW → PREPARING`
3. Reversal is triggered on `PREPARING/READY → CANCELED`
4. All mutations are atomic and audited

---

## Files Changed

### Migrated to SaleItemStatusService

| File | Change | Lines |
|------|--------|-------|
| `src/pages/api/station/update-item-status.ts` | Full migration to `SaleItemStatusService.transition()` | ~301 |
| `src/pages/api/kitchen/update-status.ts` | Bulk item updates via `SaleItemStatusService.transitionTx()` | ~283 |
| `src/lib/services/order-mutation.service.ts` | `cancelItem()` now uses `SaleItemStatusService.transitionTx()` | +30 |

### Documented as Intentional Exceptions

| File | Reason | Documentation Added |
|------|--------|---------------------|
| `src/lib/services/kitchen-dispatch.service.ts` | Initial state assignment (`itemStatus: 'NEW'`) - not a transition | Yes |
| `src/lib/services/inventory.service.ts` | Manual inventory adjustments - not kitchen consumption | Yes |
| `src/pages/api/die/documents/[id]/apply.ts` | OCR/supplier deliveries - not kitchen consumption | Yes |

---

## Mutation Paths Migrated

### 1. `/api/station/update-item-status`

**Before:**
```typescript
const updatedItem = await prisma.saleItem.update({
  where: { id: itemId },
  data: { itemStatus: newStatus, ... },
})
```

**After:**
```typescript
const result = await SaleItemStatusService.transition({
  saleItemId: itemId,
  newStatus,
  stationId,
  actorUserId: ctx.userId,
  idempotencyKey,
})
```

### 2. `/api/kitchen/update-status`

**Before:**
```typescript
await tx.saleItem.updateMany({
  where: { saleId: orderId },
  data: { itemStatus, ... },
})
```

**After:**
```typescript
for (const item of orderResult.items) {
  await SaleItemStatusService.transitionTx(tx, {
    saleItemId: item.id,
    newStatus: itemStatus,
    actorUserId: ctx.userId,
  })
}
```

### 3. `OrderMutationService.cancelItem`

**Before:**
```typescript
const cancelledItem = await prisma.saleItem.update({
  where: { id: itemId },
  data: {
    mutationType: 'CANCELLED',
    itemStatus: 'CANCELED',
  },
})
```

**After:**
```typescript
const cancelledItem = await prisma.$transaction(async (tx) => {
  await SaleItemStatusService.transitionTx(tx, {
    saleItemId: itemId,
    newStatus: 'CANCELED',
    actorUserId: actorId,
  })
  
  return tx.saleItem.update({
    where: { id: itemId },
    data: { mutationType: 'CANCELLED' },
  })
})
```

---

## Services Now Used

| Service | Role | Triggered By |
|---------|------|--------------|
| `SaleItemStatusService` | Status transition owner | API endpoints, OrderMutationService |
| `StateMachineService` | Transition validation | SaleItemStatusService |
| `ConsumptionEngineService` | Recipe consumption | SaleItemStatusService (NEW → PREPARING) |
| `InventoryLedgerService` | Stock mutations | ConsumptionEngineService |
| `TicketEventService` | Audit trail | SaleItemStatusService |

---

## Legacy Paths Preserved

These paths are intentionally NOT migrated because they serve different purposes:

### 1. Manual Inventory Adjustments (`InventoryService.recordUpdate`)

- **Purpose:** Manual stock management (deliveries, waste, corrections)
- **Trigger:** Staff action via inventory UI
- **NOT kitchen consumption**

### 2. OCR Document Apply (`/api/die/documents/[id]/apply`)

- **Purpose:** Applying scanned supplier invoices
- **Trigger:** Document approval workflow
- **NOT kitchen consumption**

### 3. Initial State Assignment (`KitchenDispatchService`)

- **Purpose:** Setting `itemStatus: 'NEW'` during order dispatch
- **Trigger:** Order creation
- **NOT a state transition** (initial assignment)

---

## Backward Compatibility

All existing API contracts are preserved:

| Endpoint | Request Format | Response Format |
|----------|----------------|-----------------|
| `/api/station/update-item-status` | Unchanged | Enhanced with `consumptionResult` |
| `/api/kitchen/update-status` | Unchanged | Unchanged |

New response fields (optional):
- `consumptionResult.state`
- `consumptionResult.totalCostCents`
- `consumptionResult.lineCount`
- `reversalResult.totalReversedCostCents`

---

## Feature Flag Support

The migration preserves feature flag support:

| Flag | Effect |
|------|--------|
| `KITCHEN_CONSUMPTION_ENGINE_MODE=off` | No consumption calculation |
| `KITCHEN_CONSUMPTION_ENGINE_MODE=shadow` | Dry-run only, logs results |
| `KITCHEN_CONSUMPTION_ENGINE_MODE=enforce` | Full consumption with audit |
| `KITCHEN_CONSUMPTION_PILOT_BUSINESS_IDS` | Limits to specific businesses |

---

## Sign-off

| Checkpoint | Status |
|------------|--------|
| All production itemStatus mutations migrated | COMPLETE |
| Legacy paths documented | COMPLETE |
| Backward compatibility preserved | COMPLETE |
| Feature flags respected | COMPLETE |
| Build passes | COMPLETE |
| Tests pass | COMPLETE |

**Phase 2 Mutation Migration: COMPLETE**
