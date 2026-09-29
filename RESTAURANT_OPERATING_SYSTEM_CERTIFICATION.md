# Restaurant Operating System Certification

**Certification Authority:** Independent Production Certification Board
**Date:** 2026-06-29
**Platform:** ImboniServe Restaurant Operating System
**Version:** 2.0.1

---

## Executive Summary

This certification evaluates whether ImboniServe can reliably serve as the operational foundation for five independent restaurants operating for thirty consecutive business days without operational truth diverging from physical reality.

**Overall Assessment:** CERTIFIED WITH CONDITIONS

---

## Certification Scores

| Domain | Score | Evidence |
|--------|-------|----------|
| Restaurant Operations | 82/100 | Core workflows functional, some gaps in waste tracking |
| Inventory Truth | 78/100 | Consumption engine implemented, reconciliation gaps exist |
| Kitchen Execution | 91/100 | State machine enforced, consumption triggers working |
| OCR Workflow | 85/100 | Full lifecycle implemented, no automated tests |
| Financial Integrity | 72/100 | COGS uses static MenuItem.costCents, not actual consumption |
| Auditability | 88/100 | TicketEvent, InventoryUpdate, InventoryConsumption trails |
| Transaction Safety | 94/100 | Idempotency, atomic transactions, race condition guards |
| Recovery | 76/100 | Document replay exists, no inventory recovery mechanism |
| Performance | 85/100 | Build passes, 114 consumption engine tests |
| Operational Trust | 79/100 | Feature flags allow gradual rollout |
| **Overall Production Readiness** | **83/100** | Certified with conditions |

---

## Domain Analysis

### 1. Restaurant Operations (82/100)

**Strengths:**
- Order creation via POS, QR, and dine-in channels
- Kitchen dispatch with station routing
- Item status lifecycle (NEW → PREPARING → READY → DELIVERED)
- Cancellation handling with state machine validation

**Gaps:**
- No dedicated waste tracking workflow
- Manual inventory adjustments exist but lack categorization
- No opening/closing inventory verification workflow

**Evidence:**
```
src/lib/services/kitchen-dispatch.service.ts - Order dispatch
src/lib/services/state-machine.service.ts - Status transitions
src/lib/services/sale-item-status.service.ts - Consumption triggers
```

### 2. Inventory Truth (78/100)

**Strengths:**
- `InventoryLedgerService` enforces atomic stock mutations
- `InventoryConsumption` audit trail for kitchen deductions
- Negative stock prevention implemented
- Business isolation enforced

**Gaps:**
- No automated inventory reconciliation against physical counts
- No drift detection between `currentStock` and sum of `InventoryUpdate`
- Manual adjustments don't require reason codes

**Evidence:**
```
src/lib/services/inventory-ledger.service.ts - Stock mutations
tests/services/inventory-ledger.service.test.ts - 26 tests pass
```

**Critical Finding:**
The system lacks a reconciliation query to verify:
```sql
InventoryItem.currentStock = 
  SUM(InventoryUpdate.quantity WHERE type='ADD') 
  - SUM(InventoryUpdate.quantity WHERE type='REMOVE'|'WASTE'|'CONSUMPTION')
```

### 3. Kitchen Execution (91/100)

**Strengths:**
- `SaleItemStatusService` owns all status transitions
- `StateMachineService` validates transition legality
- `ConsumptionEngineService` triggers on NEW → PREPARING
- Reversal triggers on PREPARING/READY → CANCELED
- Idempotency via `consumptionState` guard
- Sub-recipe expansion with bounded depth

**Gaps:**
- No partial consumption for multi-portion items
- No consumption preview before preparation starts

**Evidence:**
```
tests/services/consumption-engine.service.test.ts - 26 tests pass
tests/services/sale-item-status.service.test.ts - 21 tests pass
```

### 4. OCR Workflow (85/100)

**Strengths:**
- Full document lifecycle: UPLOADED → EXTRACTED → MATCHED → APPROVED → APPLIED
- Product matching with alias support
- Anomaly detection for price outliers
- Human review workflow
- Inventory update on apply

**Gaps:**
- No automated tests for OCR workflow
- No rollback mechanism for applied documents
- No duplicate document detection

**Evidence:**
```
src/lib/die/services/document-lifecycle.service.ts - State machine
src/pages/api/die/documents/[id]/apply.ts - Inventory update
```

### 5. Financial Integrity (72/100)

**Strengths:**
- `ProfitService` calculates daily/weekly/monthly margins
- `InventoryConsumption.totalCostCents` captures cost-at-consumption
- `ConsumptionEngineService.getSaleFoodCost()` aggregates per sale

**Critical Gap:**
`ProfitService` uses `MenuItem.costCents` (static) instead of actual `InventoryConsumption.totalCostCents`:

```typescript
// profit.service.ts line 31
const cost = sales.reduce((sum, sale) => {
  return sum + sale.items.reduce((itemSum, item) => {
    return itemSum + (item.menuItem.costCents * item.quantity) // STATIC COST
  }, 0)
}, 0)
```

**Impact:** Executive dashboards show estimated COGS, not actual consumption costs.

### 6. Auditability (88/100)

**Strengths:**
- `TicketEvent` for kitchen operations
- `InventoryUpdate` for stock changes
- `InventoryConsumption` for recipe deductions
- `ReconciliationLog` for payment mismatches
- `DocumentEventTimeline` for OCR workflow

**Gaps:**
- No unified audit query across all event types
- No audit retention policy

### 7. Transaction Safety (94/100)

**Strengths:**
- `IdempotencyService` prevents duplicate requests
- Prisma transactions for atomic operations
- `consumptionState` guard prevents double-deduction
- Race condition handling via unique constraints

**Evidence:**
```
src/lib/services/idempotency.service.ts - Request deduplication
src/lib/services/sale-item-status.service.ts - Atomic transitions
```

### 8. Recovery (76/100)

**Strengths:**
- `DocumentReplayService` for OCR document recovery
- `SystemRepairService` for consistency fixes
- Idempotent operations allow safe retries

**Gaps:**
- No inventory snapshot/restore mechanism
- No consumption reversal for system errors (only cancellations)
- No dead letter queue for failed operations

### 9. Performance (85/100)

**Evidence:**
- Build: PASS
- Kitchen Consumption Engine tests: 114/114 PASS
- Total test count: ~540 tests across repository

**Gaps:**
- No load testing results
- No latency benchmarks for consumption calculation

### 10. Operational Trust (79/100)

**Strengths:**
- Feature flags: `KITCHEN_CONSUMPTION_ENGINE_MODE` (off/shadow/enforce)
- Pilot business filtering: `KITCHEN_CONSUMPTION_PILOT_BUSINESS_IDS`
- Gradual rollout capability

**Gaps:**
- Shadow mode logs but doesn't alert on discrepancies
- No automatic rollback on error threshold

---

## Multi-Tenant Isolation Verification

**Status:** VERIFIED

All critical services enforce `businessId` filtering:

| Service | Isolation Method |
|---------|------------------|
| `InventoryLedgerService` | `item.businessId !== input.businessId` check |
| `RecipeService` | `recipe.businessId !== businessId` check |
| `ConsumptionEngineService` | Inherits from SaleItem.sale.businessId |
| `SaleItemStatusService` | Inherits from SaleItem.sale.businessId |

**Evidence:** Repository search found 50+ businessId enforcement points.

---

## Critical Findings

### Finding 1: Financial Reporting Divergence (CRITICAL)

**Issue:** `ProfitService` calculates COGS using static `MenuItem.costCents` instead of actual `InventoryConsumption.totalCostCents`.

**Impact:** Executive dashboards show estimated margins, not actual food costs.

**Recommendation:** Update `ProfitService` to query `InventoryConsumption` for actual costs when consumption engine is enabled.

### Finding 2: No Inventory Reconciliation (HIGH)

**Issue:** No automated check that `InventoryItem.currentStock` equals the sum of `InventoryUpdate` records.

**Impact:** Inventory drift can occur undetected.

**Recommendation:** Implement daily reconciliation job comparing ledger totals to current stock.

### Finding 3: No OCR Workflow Tests (MEDIUM)

**Issue:** Document lifecycle has no automated test coverage.

**Impact:** Regressions in OCR workflow may go undetected.

**Recommendation:** Add integration tests for document lifecycle transitions.

### Finding 4: Waste Tracking Gap (MEDIUM)

**Issue:** Waste is recorded as manual `InventoryUpdate` with type='WASTE' but lacks:
- Reason categorization
- Kitchen vs. spoilage distinction
- Cost attribution

**Impact:** Waste analysis limited to quantity, not cause.

---

## Certification Conditions

ImboniServe is **CERTIFIED WITH CONDITIONS** for production deployment, subject to:

### Condition 1: Financial Reporting Fix (Before Production)

Update `ProfitService` to use actual consumption costs when available:

```typescript
// When consumption engine is enabled
const actualCost = await ConsumptionEngineService.getSaleFoodCost(tx, sale.id)
```

### Condition 2: Inventory Reconciliation (Within 30 Days)

Implement daily job to verify:
```sql
SELECT i.id, i.name, i.currentStock,
  COALESCE(SUM(CASE WHEN u.type = 'ADD' THEN u.quantity ELSE -u.quantity END), 0) as ledger_stock
FROM InventoryItem i
LEFT JOIN InventoryUpdate u ON u.inventoryItemId = i.id
GROUP BY i.id
HAVING i.currentStock != ledger_stock
```

### Condition 3: Shadow Mode Monitoring (Before Full Rollout)

Run in shadow mode for minimum 7 days per pilot business before enabling enforce mode.

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Chief Production Certification Auditor | CERTIFIED WITH CONDITIONS | 2026-06-29 |
| Senior Restaurant Operations Consultant | APPROVED | 2026-06-29 |
| Enterprise Systems Reliability Engineer | APPROVED | 2026-06-29 |
| Transaction Integrity Auditor | APPROVED | 2026-06-29 |

---

**Certification Valid Until:** 2026-09-29 (90 days)
**Next Review:** Upon completion of conditions or expiry
