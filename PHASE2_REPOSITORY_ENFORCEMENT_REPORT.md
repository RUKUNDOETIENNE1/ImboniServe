# Phase 2 Repository Enforcement Report

**Date:** 2026-06-29
**Status:** COMPLETE
**Phase:** Kitchen Consumption Engine - Phase 2 (Repository Enforcement)

---

## Mutation Path Ownership

### SaleItem.itemStatus Mutations

| Location | Owner | Status |
|----------|-------|--------|
| `SaleItemStatusService.transition()` | Authoritative | ENFORCED |
| `SaleItemStatusService.transitionTx()` | Authoritative | ENFORCED |
| `/api/station/update-item-status` | Delegated to SaleItemStatusService | MIGRATED |
| `/api/kitchen/update-status` | Delegated to SaleItemStatusService | MIGRATED |
| `OrderMutationService.cancelItem` | Delegated to SaleItemStatusService | MIGRATED |
| `KitchenDispatchService` | Initial state only (`NEW`) | DOCUMENTED |

### InventoryItem.currentStock Mutations (Kitchen Consumption)

| Location | Owner | Status |
|----------|-------|--------|
| `InventoryLedgerService.applyMutation()` | Authoritative | ENFORCED |
| `ConsumptionEngineService` | Delegated to InventoryLedgerService | ENFORCED |

### InventoryItem.currentStock Mutations (Manual)

| Location | Owner | Status |
|----------|-------|--------|
| `InventoryService.recordUpdate()` | Manual adjustments | LEGACY (intentional) |
| `/api/die/documents/[id]/apply` | Supplier deliveries | LEGACY (intentional) |

---

## Transaction Ownership

### Kitchen Consumption Chain

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TRANSACTION BOUNDARY                              │
│                                                                       │
│  SaleItemStatusService.transitionTx(tx, ...)                         │
│       │                                                               │
│       ├── StateMachineService.validateTransition()                   │
│       │                                                               │
│       ├── ConsumptionEngineService.consumeForSaleItem(tx, ...)       │
│       │       │                                                       │
│       │       ├── InventoryLedgerService.applyMutation(tx, ...)      │
│       │       │       │                                               │
│       │       │       ├── tx.inventoryItem.update()                  │
│       │       │       └── tx.inventoryUpdate.create()                │
│       │       │                                                       │
│       │       └── tx.inventoryConsumption.create()                   │
│       │                                                               │
│       ├── tx.saleItem.update({ consumptionState })                   │
│       │                                                               │
│       └── TicketEventService.recordEventTx(tx, ...)                  │
│               │                                                       │
│               └── tx.ticketEvent.create()                            │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    COMMIT (all or nothing)
                              │
                              ▼
              Real-time events (Pusher) - POST-COMMIT
```

### Invariants Enforced

1. **Atomicity:** All mutations within a single Prisma transaction
2. **No pre-commit events:** Pusher events only after successful commit
3. **Audit trail:** InventoryUpdate and TicketEvent created within transaction
4. **Idempotency:** consumptionState guard prevents double-deduction

---

## Enforcement Status by Service

### SaleItemStatusService

| Responsibility | Enforcement |
|----------------|-------------|
| State machine validation | ENFORCED via StateMachineService |
| Consumption trigger (NEW → PREPARING) | ENFORCED via ConsumptionEngineService |
| Reversal trigger (PREPARING/READY → CANCELED) | ENFORCED via ConsumptionEngineService |
| TicketEvent recording | ENFORCED via TicketEventService |
| Idempotent transitions | ENFORCED via same-state check |

### ConsumptionEngineService

| Responsibility | Enforcement |
|----------------|-------------|
| Recipe resolution | ENFORCED via MenuItem.recipeId |
| Ingredient expansion | ENFORCED with bounded depth (max 3) |
| Cost calculation | ENFORCED via InventoryItem.unitCostCents |
| Stock deduction | ENFORCED via InventoryLedgerService |
| Audit trail | ENFORCED via InventoryConsumption |

### InventoryLedgerService

| Responsibility | Enforcement |
|----------------|-------------|
| Negative stock prevention | ENFORCED via validation |
| InventoryUpdate creation | ENFORCED within transaction |
| Stock mutation | ENFORCED via atomic update |

---

## Remaining Direct Mutations

### Allowed (Authoritative Services)

| File | Mutation | Reason |
|------|----------|--------|
| `sale-item-status.service.ts` | `tx.saleItem.update({ itemStatus })` | Authoritative owner |
| `consumption-engine.service.ts` | `tx.saleItem.update({ consumptionState })` | Consumption state only |
| `inventory-ledger.service.ts` | `tx.inventoryItem.update({ currentStock })` | Authoritative owner |

### Legacy (Intentional Exceptions)

| File | Mutation | Reason |
|------|----------|--------|
| `kitchen-dispatch.service.ts` | `itemStatus: 'NEW'` | Initial state assignment |
| `inventory.service.ts` | `currentStock` | Manual adjustments |
| `die/documents/[id]/apply.ts` | `currentStock` | Supplier deliveries |
| `order-mutation.service.ts` | `mutationType: 'CANCELLED'` | Separate from itemStatus |

---

## Verification Commands

### Find all itemStatus mutations:
```bash
grep -r "itemStatus.*=" src/ --include="*.ts" | grep -v "test" | grep -v ".d.ts"
```

### Find all saleItem.update calls:
```bash
grep -r "saleItem\.update" src/ --include="*.ts" | grep -v "test"
```

### Find all currentStock mutations:
```bash
grep -r "currentStock" src/ --include="*.ts" | grep -v "test" | grep "update\|="
```

---

## Sign-off

| Checkpoint | Status |
|------------|--------|
| SaleItemStatusService owns all itemStatus transitions | VERIFIED |
| InventoryLedgerService owns all kitchen consumption mutations | VERIFIED |
| ConsumptionEngineService owns all recipe execution | VERIFIED |
| Transaction boundaries enforced | VERIFIED |
| No pre-commit event emission | VERIFIED |
| Legacy paths documented | VERIFIED |

**Phase 2 Repository Enforcement: COMPLETE**
