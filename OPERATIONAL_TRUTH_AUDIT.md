# Operational Truth Audit

**Audit Date:** 2026-06-29
**Auditor:** Independent Certification Board
**Platform:** ImboniServe v2.0.1

---

## Audit Objective

Verify that the following chain remains consistent:

```
Physical Reality → Inventory → Consumption → Ledger → Reports
```

---

## Chain Link 1: Physical Reality → Inventory

### Supplier Deliveries (OCR Path)

| Stage | Mechanism | Audit Trail | Status |
|-------|-----------|-------------|--------|
| Receipt uploaded | `ScannedDocument` created | `DocumentEventTimeline` | VERIFIED |
| OCR extraction | Items parsed | `ScannedDocumentItem` | VERIFIED |
| Product matching | Linked to `InventoryItem` | `ProductAlias` | VERIFIED |
| Human review | Manager approval | `lifecycleState` transition | VERIFIED |
| Apply to inventory | Stock increased | `InventoryUpdate` | VERIFIED |

**Evidence:**
```typescript
// src/pages/api/die/documents/[id]/apply.ts
await tx.inventoryItem.update({
  where: { id: item.inventoryItemId },
  data: { currentStock: { increment: item.quantity } }
})
await tx.inventoryUpdate.create({
  data: {
    inventoryItemId: item.inventoryItemId,
    type: 'ADD',
    quantity: item.quantity,
    reason: `OCR Document ${documentId}`,
    ...
  }
})
```

**Verdict:** CONSISTENT

### Manual Adjustments

| Stage | Mechanism | Audit Trail | Status |
|-------|-----------|-------------|--------|
| Manager adjustment | `InventoryService.recordUpdate()` | `InventoryUpdate` | VERIFIED |
| Stock correction | `currentStock` updated | `InventoryUpdate` | VERIFIED |
| Waste recording | `currentStock` decremented | `InventoryUpdate` | VERIFIED |

**Evidence:**
```typescript
// src/lib/services/inventory.service.ts
await prisma.inventoryUpdate.create({
  data: {
    inventoryItemId,
    userId,
    type,
    quantity,
    reason,
    businessId,
  }
})
```

**Gap Identified:** No reason code enumeration - free text allows inconsistent categorization.

**Verdict:** CONSISTENT (with documentation gap)

---

## Chain Link 2: Inventory → Consumption

### Kitchen Consumption Trigger

| Trigger | Mechanism | Audit Trail | Status |
|---------|-----------|-------------|--------|
| NEW → PREPARING | `ConsumptionEngineService.consumeForSaleItem()` | `InventoryConsumption` | VERIFIED |
| PREPARING/READY → CANCELED | `ConsumptionEngineService.reverseForSaleItem()` | `InventoryConsumption` (reversal) | VERIFIED |

**Evidence:**
```typescript
// src/lib/services/sale-item-status.service.ts
if (shouldTriggerConsumption(fromStatus, toStatus)) {
  await ConsumptionEngineService.consumeForSaleItem(tx, saleItemId)
}
if (shouldTriggerReversal(fromStatus, toStatus)) {
  await ConsumptionEngineService.reverseForSaleItem(tx, saleItemId)
}
```

**Idempotency Guard:**
```typescript
// src/lib/services/consumption-engine.service.ts
if (saleItem.consumptionState === 'CONSUMED') {
  return { alreadyConsumed: true }
}
```

**Verdict:** CONSISTENT

### Recipe Expansion

| Stage | Mechanism | Audit Trail | Status |
|-------|-----------|-------------|--------|
| Recipe lookup | `MenuItem.recipeId` → `Recipe` | N/A (reference) | VERIFIED |
| Ingredient expansion | `RecipeIngredient` traversal | N/A (calculation) | VERIFIED |
| Sub-recipe expansion | Recursive with depth limit | N/A (calculation) | VERIFIED |
| Quantity calculation | `yieldFactor` applied | `InventoryConsumption.quantityConsumed` | VERIFIED |
| Cost calculation | `unitCostCents` at consumption time | `InventoryConsumption.unitCostAtConsumptionCents` | VERIFIED |

**Evidence:**
```typescript
// src/lib/services/consumption-engine.service.ts
const ingredients = await RecipeService.expandIngredients(tx, recipe.id, businessId)
for (const ingredient of ingredients) {
  const quantityNeeded = ingredient.quantity * saleItem.quantity
  await InventoryLedgerService.deduct(tx, {
    inventoryItemId: ingredient.inventoryItemId,
    quantity: quantityNeeded,
    ...
  })
}
```

**Verdict:** CONSISTENT

---

## Chain Link 3: Consumption → Ledger

### InventoryLedgerService

| Operation | Mechanism | Audit Trail | Status |
|-----------|-----------|-------------|--------|
| Deduct stock | `currentStock` decremented | `InventoryUpdate` | VERIFIED |
| Add stock | `currentStock` incremented | `InventoryUpdate` | VERIFIED |
| Negative prevention | Check before deduct | Error thrown | VERIFIED |
| Business isolation | `businessId` validation | Error thrown | VERIFIED |

**Evidence:**
```typescript
// src/lib/services/inventory-ledger.service.ts
if (item.currentStock < input.quantity) {
  throw new InsufficientStockError(...)
}
if (item.businessId !== input.businessId) {
  throw new BusinessMismatchError(...)
}
await tx.inventoryItem.update({
  where: { id: input.inventoryItemId },
  data: { currentStock: { decrement: input.quantity } }
})
await tx.inventoryUpdate.create({
  data: { type: 'CONSUMPTION', ... }
})
```

**Verdict:** CONSISTENT

### Consumption-to-Ledger Link

| Field | Source | Destination | Status |
|-------|--------|-------------|--------|
| `inventoryUpdateId` | `InventoryUpdate.id` | `InventoryConsumption.inventoryUpdateId` | VERIFIED |
| `quantityConsumed` | Calculation | `InventoryConsumption.quantityConsumed` | VERIFIED |
| `unitCostAtConsumptionCents` | `InventoryItem.unitCostCents` | `InventoryConsumption.unitCostAtConsumptionCents` | VERIFIED |
| `totalCostCents` | `quantity * unitCost` | `InventoryConsumption.totalCostCents` | VERIFIED |

**Verdict:** CONSISTENT

---

## Chain Link 4: Ledger → Reports

### Current Implementation

| Report | Data Source | Accurate | Status |
|--------|-------------|----------|--------|
| Daily Revenue | `Sale.totalAmountCents` | Yes | VERIFIED |
| Order Count | `Sale.count()` | Yes | VERIFIED |
| Top Selling Items | `SaleItem.groupBy()` | Yes | VERIFIED |
| **Daily COGS** | `MenuItem.costCents` | **NO** | **DIVERGENCE** |
| **Profit Margin** | `Revenue - MenuItem.costCents` | **NO** | **DIVERGENCE** |

### Critical Divergence

**Expected:**
```typescript
const actualCost = await prisma.inventoryConsumption.aggregate({
  where: { saleItem: { saleId: sale.id } },
  _sum: { totalCostCents: true }
})
```

**Actual:**
```typescript
// src/lib/services/profit.service.ts line 31
const cost = sale.items.reduce((sum, item) => {
  return sum + (item.menuItem.costCents * item.quantity) // STATIC COST
}, 0)
```

**Impact:**
- Executive dashboards show estimated COGS
- Actual ingredient cost fluctuations not reflected
- Margin calculations may be inaccurate by 5-15%

**Verdict:** DIVERGENT

---

## Reconciliation Queries

### Query 1: Inventory Stock Verification

```sql
-- Verify currentStock matches ledger sum
SELECT 
  i.id,
  i.name,
  i.currentStock,
  COALESCE(SUM(
    CASE 
      WHEN u.type IN ('ADD', 'RETURN') THEN u.quantity
      WHEN u.type IN ('CONSUMPTION', 'WASTE', 'ADJUSTMENT') THEN -u.quantity
      ELSE 0
    END
  ), 0) as ledger_stock,
  i.currentStock - COALESCE(SUM(...), 0) as drift
FROM "InventoryItem" i
LEFT JOIN "InventoryUpdate" u ON u."inventoryItemId" = i.id
GROUP BY i.id
HAVING ABS(i."currentStock" - COALESCE(SUM(...), 0)) > 0.001
```

**Status:** Query not implemented in codebase.

### Query 2: Consumption-to-Update Link Verification

```sql
-- Verify every InventoryConsumption has matching InventoryUpdate
SELECT 
  ic.id as consumption_id,
  ic."inventoryUpdateId",
  iu.id as update_id
FROM "InventoryConsumption" ic
LEFT JOIN "InventoryUpdate" iu ON iu.id = ic."inventoryUpdateId"
WHERE ic."inventoryUpdateId" IS NOT NULL
  AND iu.id IS NULL
```

**Expected Result:** 0 rows (all links valid)

### Query 3: Sale-to-Consumption Verification

```sql
-- Verify every DELIVERED item has consumption record (when engine enabled)
SELECT 
  si.id as sale_item_id,
  si."itemStatus",
  si."consumptionState",
  COUNT(ic.id) as consumption_count
FROM "SaleItem" si
LEFT JOIN "InventoryConsumption" ic ON ic."saleItemId" = si.id
WHERE si."itemStatus" = 'DELIVERED'
  AND si."consumptionState" = 'CONSUMED'
GROUP BY si.id
HAVING COUNT(ic.id) = 0
```

**Expected Result:** 0 rows (all delivered items have consumption)

---

## Audit Trail Completeness

### TicketEvent Coverage

| Event | Recorded | Status |
|-------|----------|--------|
| Item created | Yes | VERIFIED |
| Status transition | Yes | VERIFIED |
| Cancellation | Yes | VERIFIED |
| Consumption triggered | No | GAP |

**Gap:** Consumption trigger not recorded in TicketEvent.

### InventoryUpdate Coverage

| Event | Recorded | Status |
|-------|----------|--------|
| OCR apply | Yes | VERIFIED |
| Manual adjustment | Yes | VERIFIED |
| Kitchen consumption | Yes | VERIFIED |
| Consumption reversal | Yes | VERIFIED |

### InventoryConsumption Coverage

| Event | Recorded | Status |
|-------|----------|--------|
| Recipe deduction | Yes | VERIFIED |
| Cost at consumption | Yes | VERIFIED |
| Reversal link | Yes | VERIFIED |
| Actor user | Yes | VERIFIED |

---

## Truth Consistency Matrix

| Source | Target | Consistent | Evidence |
|--------|--------|------------|----------|
| Physical delivery | InventoryItem.currentStock | YES | OCR → InventoryUpdate |
| Physical waste | InventoryItem.currentStock | YES | Manual → InventoryUpdate |
| Kitchen prep | InventoryItem.currentStock | YES | Consumption → InventoryUpdate |
| InventoryItem.currentStock | SUM(InventoryUpdate) | UNVERIFIED | No reconciliation job |
| InventoryConsumption | InventoryUpdate | YES | Foreign key link |
| InventoryConsumption.totalCostCents | ProfitService | NO | Static MenuItem.costCents used |

---

## Audit Verdict

### Consistent Chains

1. **Physical → Inventory:** VERIFIED
2. **Inventory → Consumption:** VERIFIED
3. **Consumption → Ledger:** VERIFIED

### Divergent Chains

1. **Ledger → Financial Reports:** DIVERGENT
   - COGS uses static costs, not actual consumption costs

### Unverified Chains

1. **currentStock ↔ SUM(InventoryUpdate):** No automated reconciliation

---

## Recommendations

### Immediate (Before Production)

1. **Fix ProfitService** to use `InventoryConsumption.totalCostCents`:
```typescript
static async calculateDailyProfit(businessId: string, date?: Date) {
  // ... existing code ...
  
  // Use actual consumption cost when available
  const consumptionCost = await prisma.inventoryConsumption.aggregate({
    where: {
      businessId,
      createdAt: { gte: startOfDay, lte: endOfDay },
      state: 'ACTIVE'
    },
    _sum: { totalCostCents: true }
  })
  
  const cost = consumptionCost._sum.totalCostCents || 0
  // ... rest of calculation ...
}
```

### Short-term (Within 30 Days)

2. **Implement inventory reconciliation job:**
```typescript
// src/lib/cron.ts
async function reconcileInventory() {
  const drifts = await prisma.$queryRaw`
    SELECT i.id, i.name, i."currentStock", 
      SUM(CASE WHEN u.type = 'ADD' THEN u.quantity ELSE -u.quantity END) as ledger
    FROM "InventoryItem" i
    LEFT JOIN "InventoryUpdate" u ON u."inventoryItemId" = i.id
    GROUP BY i.id
    HAVING ABS(i."currentStock" - SUM(...)) > 0.001
  `
  
  for (const drift of drifts) {
    await alertService.send({
      type: 'INVENTORY_DRIFT',
      severity: 'HIGH',
      data: drift
    })
  }
}
```

### Medium-term

3. **Add consumption event to TicketEvent:**
```typescript
await tx.ticketEvent.create({
  data: {
    saleItemId,
    eventType: 'CONSUMPTION_TRIGGERED',
    metadata: { ingredientCount, totalCostCents }
  }
})
```

---

## Conclusion

**Operational truth is maintained for inventory quantities but diverges for financial reporting.**

The platform accurately tracks:
- What was received (OCR)
- What was consumed (Kitchen)
- What was wasted (Manual)
- What was reversed (Cancellation)

The platform inaccurately reports:
- Actual food cost (uses static MenuItem.costCents)
- True profit margins (derived from inaccurate COGS)

**Audit Status:** CONDITIONAL PASS
