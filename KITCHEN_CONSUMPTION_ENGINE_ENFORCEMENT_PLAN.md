# Kitchen Consumption Engine - Architectural Enforcement Plan

**Document Type:** Build-Grade Architecture Review
**Scope:** Mutation Surface Audit, Ownership Boundaries, Bypass Prevention
**Status:** Pre-Implementation Enforcement Blueprint
**Date:** 2026-06-28

---

## Executive Summary

This document answers one question:

> **After the Kitchen Consumption Engine is implemented exactly as designed, can any existing or future code path still bypass the engine and mutate operational state directly?**

**Answer: YES - without enforcement changes.**

The current codebase has **37 direct Prisma mutations** to consumption-critical models spread across **25+ files**. Of these:

- **3 are CRITICAL BYPASS risks** that would silently circumvent the consumption engine
- **12 require REFACTOR** to route through the new service layer
- **22 are SAFE** (read-only, non-kitchen paths, or already service-wrapped)

This plan defines the architectural guardrails required to make bypass impossible.

---

# Part 1 - Critical Bypass Summary

## CRITICAL BYPASS #1: /api/station/update-item-status

**Location:** `src/pages/api/station/update-item-status.ts:170`

```typescript
const updatedItem = await prisma.saleItem.update({
  where: { id: itemId },
  data: updateData,
})
```

**Risk:** Primary KDS item status transition endpoint. Directly updates `SaleItem.itemStatus` without:
- Calling any consumption service
- Checking for recipe existence
- Deducting inventory
- Creating consumption audit records

**Impact:** Every `NEW -> PREPARING` transition bypasses the consumption engine.

---

## CRITICAL BYPASS #2: /api/kitchen/update-status

**Location:** `src/pages/api/kitchen/update-status.ts:134`

```typescript
await tx.saleItem.updateMany({
  where: { saleId: orderId },
  data: {
    itemStatus,
    ...(itemStatus === 'PREPARING' && { prepStartedAt: now }),
    ...(itemStatus === 'READY' && { readyAt: now }),
    ...(itemStatus === 'DELIVERED' && { deliveredAt: now }),
  },
})
```

**Risk:** Bulk-updates ALL items in an order via `updateMany`. When `itemStatus = PREPARING`:
- No item-level consumption occurs
- No recipe lookup per item
- No inventory deduction
- No consumption audit

**Impact:** Order-level kitchen updates silently skip consumption for every item.

---

## CRITICAL BYPASS #3: OrderMutationService.cancelItem

**Location:** `src/lib/services/order-mutation.service.ts:133`

```typescript
const cancelledItem = await prisma.saleItem.update({
  where: { id: itemId },
  data: {
    mutationType: 'CANCELLED',
    itemStatus: 'CANCELED',
  },
})
```

**Risk:** Cancels item without checking if already consumed. If item was `PREPARING` (consumed):
- No consumption reversal
- No inventory restoration
- No reversal audit records

**Impact:** Cancelled items after prep leave inventory permanently deducted.

---

# Part 2 - Single Source of Truth Audit

## 2.1 Current State: Multiple Owners

| Responsibility | Current Owners | Conflict |
|----------------|----------------|----------|
| Inventory deduction | `InventoryService.recordUpdate`, OCR apply, **none for consumption** | No consumption owner exists |
| SaleItem state transitions | `/api/station/update-item-status`, `/api/kitchen/update-status`, `OrderMutationService` | 3 independent paths |
| Recipe execution | **None** | No recipe system exists |
| Inventory ledger writes | `InventoryService`, OCR apply | 2 paths, no consumption path |
| Consumption ledger writes | **None** | No consumption audit exists |
| Kitchen lifecycle transitions | `/api/station/*`, `/api/kitchen/*`, `KitchenDispatchService` | 3+ paths |
| Ticket event creation | `TicketEventService` | Single owner (good) |
| Plugin publication | `PluginEventBus` | Single owner (good) |

## 2.2 Required State: Single Canonical Owner

| Responsibility | Canonical Owner | Status |
|----------------|-----------------|--------|
| Inventory deduction (consumption) | `ConsumptionEngineService` | **TO CREATE** |
| Inventory deduction (receiving) | `InventoryLedgerService` (OCR path) | **TO CREATE** |
| Inventory deduction (manual) | `InventoryLedgerService` (via `InventoryService`) | **TO REFACTOR** |
| SaleItem state transitions | `SaleItemStatusService` | **TO CREATE** |
| Recipe execution | `ConsumptionEngineService` | **TO CREATE** |
| Consumption ledger writes | `ConsumptionEngineService` | **TO CREATE** |
| Kitchen lifecycle transitions | `SaleItemStatusService` | **TO CREATE** |
| Ticket event creation | `TicketEventService` | EXISTS |
| Plugin publication | `PluginEventBus` | EXISTS |

---

# Part 3 - Service Ownership Map

## 3.1 SaleItemStatusService (TO CREATE)

**Responsibilities:**
- ALL `SaleItem.itemStatus` transitions
- State machine validation
- Consumption trigger coordination
- Cancellation/reversal coordination
- Ticket event creation (transactional)
- Idempotency enforcement

**Permitted Dependencies:**
- `ConsumptionEngineService`
- `StateMachineService`
- `TicketEventService`
- `IdempotencyService`
- `PluginEventBus`
- Prisma (via transaction client only)

**Forbidden Dependencies:**
- Direct `prisma.saleItem.update` outside transaction
- `InventoryService` directly
- Any API route logic

## 3.2 ConsumptionEngineService (TO CREATE)

**Responsibilities:**
- Recipe resolution for sale items
- Ingredient expansion (including sub-recipes)
- Inventory deduction calculation
- Consumption record creation
- Cost snapshot capture
- Reversal logic

**Permitted Dependencies:**
- `RecipeService`
- `RecipeCostService`
- `InventoryLedgerService`
- Prisma (via transaction client only)

**Forbidden Dependencies:**
- `SaleItemStatusService` (circular)
- Direct `prisma.inventoryItem.update`

## 3.3 InventoryLedgerService (TO CREATE)

**Responsibilities:**
- Transaction-safe inventory stock mutations
- Atomic stock + audit record creation
- Negative stock prevention
- Cost snapshot capture

**Permitted Dependencies:**
- Prisma (via transaction client only)

**Forbidden Dependencies:**
- `ConsumptionEngineService` (would be circular)
- `SaleItemStatusService`
- Any service with business logic

## 3.4 Existing Services (NEEDS REFACTOR)

| Service | Required Changes |
|---------|------------------|
| `InventoryService` | Extract `recordUpdate` stock mutation logic into `InventoryLedgerService.applyTx` |
| `KitchenDispatchService` | Remove direct `prisma.saleItem.update` for status changes, use `SaleItemStatusService` |
| `OrderMutationService` | `cancelItem` must call `SaleItemStatusService.transitionItemStatus` with `CANCELED` |

---

# Part 4 - Direct Prisma Access Audit

## 4.1 Must Move to SaleItemStatusService

| File | Line | Current Code | Action |
|------|------|--------------|--------|
| `src/pages/api/station/update-item-status.ts` | 170 | `prisma.saleItem.update` | Replace with `SaleItemStatusService.transitionItemStatus` |
| `src/pages/api/kitchen/update-status.ts` | 134 | `tx.saleItem.updateMany` | Replace with loop calling `SaleItemStatusService.transitionItemStatusTx` |
| `src/lib/services/order-mutation.service.ts` | 133 | `prisma.saleItem.update` (cancel) | Replace with `SaleItemStatusService.transitionItemStatus` |

## 4.2 Must Initialize Consumption State

| File | Action |
|------|--------|
| `src/lib/services/order-mutation.service.ts` | Add `consumptionState: 'PENDING'` to item creation |
| `src/lib/services/qr-order.service.ts` | Add `consumptionState: 'PENDING'` to items |
| `src/lib/services/whatsapp-order.service.ts` | Add `consumptionState: 'PENDING'` to items |
| `src/pages/api/webhooks/twilio/voice-order.ts` | Add `consumptionState: 'PENDING'` to items |
| `src/pages/api/orders/[id]/add-items.ts` | Add `consumptionState: 'PENDING'` to items |
| `src/pages/api/pre-order/schedule.ts` | Add `consumptionState: 'PENDING'` to items |

## 4.3 Must Call Kitchen Dispatch

| File | Action |
|------|--------|
| `src/lib/services/qr-order.service.ts` | Call `KitchenDispatchService.dispatchToKitchen` after creation |
| `src/lib/services/whatsapp-order.service.ts` | Call `KitchenDispatchService.dispatchToKitchen` after creation |
| `src/pages/api/webhooks/twilio/voice-order.ts` | Call `KitchenDispatchService.dispatchToKitchen` after creation |
| `src/pages/api/orders/[id]/add-items.ts` | Call `KitchenDispatchService.dispatchToKitchen` after creation |

## 4.4 Safe - No Changes Required

| File | Reason |
|------|--------|
| `src/lib/services/sales.service.ts` | Order-level operations, not item status |
| `src/lib/services/expo-finalization.service.ts` | Expo status only, not item status |
| `src/lib/services/tap-leave-finalization.service.ts` | Payment status only |
| `src/lib/services/reconciliation.service.ts` | Payment auto-fix only |
| `src/lib/cron.ts` | Kitchen release timing only |
| `src/pages/api/kitchen/order/[id]/start.ts` | Timestamp only |
| `src/pages/api/kitchen/order/[id]/ready.ts` | Timestamp only |
| `src/pages/api/dev/bootstrap-tap-leave.ts` | Dev only, blocked in prod |
| All payment webhooks | Payment status only |

---

# Part 5 - Transaction Boundary Audit

## 5.1 Ideal Transaction Ownership Model

### Consumption Transaction (NEW)

**Owner:** `SaleItemStatusService.transitionItemStatusTx`

**Contents (single transaction):**
1. State machine validation
2. Recipe resolution
3. Inventory deduction (via `InventoryLedgerService.applyTx`)
4. `InventoryUpdate` creation
5. `InventoryConsumption` creation
6. `SaleItem` status update
7. `TicketEvent` creation

**After Commit:**
- Plugin event publication
- Pusher notifications
- Shadow event ingestion

**Isolation Level:** `Serializable` for stock safety

**Retry:** Yes, for serialization failures

---

# Part 6 - Architectural Bypass Analysis

## 6.1 Attempted Bypasses and Prevention

| Bypass Attempt | Current State | Prevention |
|----------------|---------------|------------|
| Bulk `updateMany` for PREPARING | Allowed - kitchen/update-status.ts does this | Remove `updateMany`, iterate items with service calls |
| Direct Status Update in New Endpoint | No prevention | Export `SaleItemStatusService` as ONLY way to change `itemStatus` |
| Admin Override | No such endpoint exists | Admin fixes must also go through `SaleItemStatusService` |
| Cancel Without Reversal | `OrderMutationService.cancelItem` does this | `SaleItemStatusService` handles CANCELED transition with reversal |
| Refund Without Inventory Consideration | `/api/payments/refunds.ts` sets REFUNDED | Refund does NOT reverse consumption by default (food was made) |
| QR/WhatsApp Order Without Dispatch | Multiple paths don't call dispatch | All order creation must call `KitchenDispatchService` |
| Background Job Direct Mutation | No such jobs exist | Architectural rule: background jobs must use service layer |
| Plugin Writes Back | Plugin event bus is read-only | Plugin context provides read-only Prisma client |
| Test Helper Pollution | No test helpers exist | Test helpers must use service layer |
| Seed Script Inconsistency | `prisma/seed.ts` creates basic data only | Seed scripts must use service layer for operational data |

---

# Part 7 - Runtime Guardrails

## 7.1 Preventative Controls

| Control | Location | Behavior |
|---------|----------|----------|
| State Machine Validation | `StateMachineService.validateAndExplain` | Rejects invalid state transitions before any mutation |
| Idempotency Enforcement | `IdempotencyService.checkAndLock` | Prevents duplicate consumption for same item |
| Conditional Stock Decrement | `InventoryLedgerService.applyTx` | Prevents double-deduction under concurrent requests |
| Consumption State Check | `ConsumptionEngineService.consumeSaleItemForPrepTx` | Prevents re-consumption of already-consumed items |

## 7.2 Detective Controls (Watchdog)

| Check | Alert |
|-------|-------|
| Missing Consumption | Items in PREPARING/READY/DELIVERED with `consumptionState = PENDING` and `activeRecipeId IS NOT NULL` |
| Orphaned Consumption | `InventoryConsumption` without corresponding `InventoryUpdate` |
| Double Consumption | Multiple active consumption records for same `saleItemId + recipeIngredientId` |
| Ledger Drift | `InventoryItem.currentStock` != SUM(`InventoryUpdate`) |
| Unreversed Cancellation | `itemStatus = CANCELED` + `consumptionState = CONSUMED` without reversal record |

## 7.3 Recovery Controls

| Control | Capability |
|---------|------------|
| Consumption Reconciliation Service | Detect missing consumption records, create backfill consumption (with audit flag) |
| Feature Flag Rollback | `KITCHEN_CONSUMPTION_ENGINE_MODE` = `off` / `shadow` / `enforce` |

---

# Part 8 - Enforcement Matrix

| Operation | Authorized Service | Inventory Mutation | Event Published | Audit Required |
|-----------|-------------------|-------------------|-----------------|----------------|
| `NEW -> PREPARING` | `SaleItemStatusService` | **YES** (deduct) | `INGREDIENTS_CONSUMED` | `InventoryConsumption` + `InventoryUpdate` + `TicketEvent` |
| `PREPARING -> READY` | `SaleItemStatusService` | No | `ITEM_READY` | `TicketEvent` |
| `READY -> DELIVERED` | `SaleItemStatusService` | No | `ITEM_DELIVERED` | `TicketEvent` |
| `PREPARING -> CANCELED` | `SaleItemStatusService` | **YES** (reverse) | `CONSUMPTION_REVERSED` | `InventoryConsumption` (reversal) + `TicketEvent` |
| `NEW -> CANCELED` | `SaleItemStatusService` | No | `ITEM_CANCELED` | `TicketEvent` |
| `REFUND` | `PaymentService` | **NO** (food consumed) | `PAYMENT_REFUNDED` | `PaymentTransaction` |
| `OCR RECEIVE` | OCR Apply Endpoint | **YES** (add) | `EXTRACTION_COMPLETED` | `InventoryUpdate` |
| `MANUAL ADJUSTMENT` | `InventoryService` | **YES** | `INVENTORY_ADJUSTMENT` | `InventoryUpdate` |
| `WASTE RECORD` | `InventoryService` | **YES** (deduct) | `INVENTORY_WASTE` | `InventoryUpdate` |
| `REMAKE` | `SaleItemStatusService` | **YES** (new consumption) | `INGREDIENTS_CONSUMED` (remake) | `InventoryConsumption` (reasonCode=REMAKE) |

---

# Part 9 - Risk Assessment

## 9.1 Critical Risks

| Risk | Likelihood | Impact | Mitigation | Residual Risk |
|------|------------|--------|------------|---------------|
| Order-Level Kitchen Update Bypasses Item Consumption | HIGH (code exists) | CRITICAL | Replace `updateMany` with item-level service calls | LOW after mitigation |
| Cancel After Prep Without Reversal | HIGH (code exists) | HIGH | Route cancellation through `SaleItemStatusService` | LOW after mitigation |
| Multiple Order Creation Paths Without Dispatch | MEDIUM (5+ paths) | MEDIUM | Centralize order creation or add dispatch to all paths | LOW after mitigation |

## 9.2 High Risks

| Risk | Likelihood | Impact | Mitigation | Residual Risk |
|------|------------|--------|------------|---------------|
| Future Developer Creates Direct Mutation Endpoint | MEDIUM | HIGH | Architectural documentation, lint rules, code review checklist | MEDIUM (human process) |
| Concurrent Consumption Double-Deduction | LOW | HIGH | Conditional decrement with `updateMany` + `count` check | LOW after mitigation |
| Recipe Cost Stale for Extended Period | MEDIUM | MEDIUM | Cron job to refresh stale recipes | LOW after mitigation |

---

# Part 10 - Definition of "Architecturally Enforced"

## 10.1 The Question

> **Can a future developer accidentally bypass the Kitchen Consumption Engine?**

## 10.2 Current Answer: YES

**Evidence:**

1. **Direct Prisma access is unrestricted.** Any file can import `prisma` and call `prisma.saleItem.update({ data: { itemStatus: 'PREPARING' } })`.

2. **No compile-time enforcement.** TypeScript does not prevent direct mutations.

3. **Existing bypass code exists.** `/api/kitchen/update-status.ts` already bypasses item-level logic with `updateMany`.

4. **No runtime detection.** No watchdog currently checks for missing consumption records.

5. **Documentation is insufficient.** No architectural rules document exists.

## 10.3 Post-Implementation Answer: NO (with guardrails)

**After implementing the guardrails in this document:**

1. **Service layer is mandatory.** All consumption-critical mutations route through `SaleItemStatusService`.

2. **Compile-time hints exist.** ESLint rules flag direct Prisma mutations in routes.

3. **Bypass code is removed.** `updateMany` for item status is replaced with item-level calls.

4. **Runtime detection exists.** Watchdog checks for violations.

5. **Documentation is authoritative.** This document serves as the architectural constitution.

## 10.4 Definition of Success

The Kitchen Consumption Engine is **architecturally enforced** when:

1. Every `SaleItem.itemStatus` mutation goes through `SaleItemStatusService`
2. Every `NEW -> PREPARING` transition triggers consumption (or `SKIPPED` if no recipe)
3. Every `PREPARING/READY -> CANCELED` transition triggers reversal (if consumed)
4. Every `InventoryConsumption` has a corresponding `InventoryUpdate`
5. Every `InventoryUpdate` for consumption has a corresponding `InventoryConsumption`
6. Watchdog detects violations within 5 minutes
7. No direct Prisma mutation to `SaleItem.itemStatus` exists outside `SaleItemStatusService`
8. No `saleItem.updateMany` with `itemStatus` exists anywhere
9. All order creation paths call `KitchenDispatchService`
10. Plugin handlers cannot write to database

---

# Appendix A - Implementation Checklist

## Phase 0: Schema Migration

- [ ] Add `ConsumptionState` enum
- [ ] Add `SaleItem.consumptionState`
- [ ] Add `SaleItem.consumedAt`
- [ ] Add `SaleItem.consumptionError`
- [ ] Add `Recipe` model
- [ ] Add `RecipeIngredient` model
- [ ] Add `InventoryConsumption` model
- [ ] Add `MenuItem.activeRecipeId`
- [ ] Add `TicketEventType.INGREDIENTS_CONSUMED`
- [ ] Add `TicketEventType.CONSUMPTION_REVERSED`
- [ ] Run migration
- [ ] Verify build passes

## Phase 1: Service Layer Creation

- [ ] Create `src/lib/services/consumption/inventory-ledger.service.ts`
- [ ] Create `src/lib/services/consumption/consumption-engine.service.ts`
- [ ] Create `src/lib/services/consumption/sale-item-status.service.ts`
- [ ] Create `src/lib/services/recipe/recipe.service.ts`
- [ ] Create `src/lib/services/recipe/recipe-cost.service.ts`
- [ ] Add `TicketEventService.recordEventTx`
- [ ] Add unit tests for all services

## Phase 2: Route Refactoring

- [ ] Refactor `/api/station/update-item-status.ts` to use `SaleItemStatusService`
- [ ] Refactor `/api/kitchen/update-status.ts` to use item-level calls
- [ ] Refactor `OrderMutationService.cancelItem` to use `SaleItemStatusService`
- [ ] Add `consumptionState: 'PENDING'` to all item creation paths
- [ ] Add `KitchenDispatchService` calls to all order creation paths
- [ ] Add integration tests

## Phase 3: Watchdog Implementation

- [ ] Create `src/pages/api/cron/watchdog-consumption.ts`
- [ ] Implement missing consumption check
- [ ] Implement orphaned consumption check
- [ ] Implement double consumption check
- [ ] Implement ledger drift check
- [ ] Implement unreversed cancellation check
- [ ] Configure alerting

## Phase 4: Recipe API

- [ ] Create recipe CRUD endpoints
- [ ] Create recipe publish endpoint
- [ ] Create recipe cost recalculation endpoint
- [ ] Add OCR cost-stale propagation

## Phase 5: Shadow Mode

- [ ] Add `KITCHEN_CONSUMPTION_ENGINE_MODE` env var
- [ ] Implement shadow logging
- [ ] Deploy to staging
- [ ] Verify shadow logs match expected consumption

## Phase 6: Enforce Mode

- [ ] Enable enforce mode for pilot business
- [ ] Monitor watchdog alerts
- [ ] Verify inventory accuracy
- [ ] Expand to all businesses

---

# Appendix B - Code Review Checklist

When reviewing PRs that touch kitchen/inventory code:

- [ ] Does the PR modify `SaleItem.itemStatus`? If yes, does it use `SaleItemStatusService`?
- [ ] Does the PR use `saleItem.updateMany`? If yes, reject unless justified.
- [ ] Does the PR modify `InventoryItem.currentStock`? If yes, does it use `InventoryLedgerService`?
- [ ] Does the PR create `SaleItem` records? If yes, does it set `consumptionState: 'PENDING'`?
- [ ] Does the PR create `Sale` records? If yes, does it call `KitchenDispatchService`?
- [ ] Does the PR add a new order creation path? If yes, ensure dispatch is called.
- [ ] Does the PR modify cancellation logic? If yes, ensure reversal is handled.
- [ ] Does the PR add a new cron job? If yes, ensure it uses service layer.
- [ ] Does the PR modify plugin handlers? If yes, ensure no writes.

---

# Appendix C - Glossary

| Term | Definition |
|------|------------|
| Consumption | The act of deducting inventory when a recipe-backed item enters PREPARING state |
| Reversal | The act of restoring inventory when a consumed item is cancelled |
| Consumption State | `PENDING`, `CONSUMED`, `REVERSED`, `SKIPPED`, `FAILED` |
| Recipe | A machine-readable definition of ingredients required to produce a menu item |
| Active Recipe | The currently published recipe version linked to a menu item |
| COGS | Cost of Goods Sold - actual ingredient cost at time of consumption |
| Ledger Drift | When `InventoryItem.currentStock` does not match the sum of `InventoryUpdate` records |
| Shadow Mode | Engine calculates consumption but does not mutate inventory |
| Enforce Mode | Engine calculates and mutates inventory, blocking on insufficient stock |

---

# Appendix D - References

| Document | Purpose |
|----------|---------|
| `KITCHEN_CONSUMPTION_ENGINE_ARCHITECTURE.md` | Master blueprint |
| `RECIPE_ENGINE_REALITY_REVIEW.md` | Recipe schema design |
| `FOOD_COST_ARCHITECTURE.md` | Cost calculation strategy |
| `INVENTORY_CONSUMPTION_MODEL.md` | Deduction timing and edge cases |
| `CONSUMPTION_AUDIT_ARCHITECTURE.md` | Audit trail design |
| `FUTURE_COMPATIBILITY_REVIEW.md` | AI/Hotel/Twin compatibility |

---

**Document Status:** COMPLETE  
**Next Action:** Implement Phase 0 (Schema Migration)
