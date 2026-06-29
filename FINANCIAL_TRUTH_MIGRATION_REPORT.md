# Financial Truth Migration Report

**Date:** 2026-06-29
**Phase:** Financial Truth Migration & Executive Reporting Certification
**Status:** COMPLETE

---

## Executive Summary

This migration replaces estimated food-cost calculations with actual operational cost calculations derived from the Kitchen Consumption Engine. Executive reporting now derives financial truth from actual inventory consumed during restaurant operations.

---

## Files Modified

### New Service

| File | Purpose |
|------|---------|
| `src/lib/services/financial-truth.service.ts` | Authoritative source for actual operational food costs |

### Migrated Services

| File | Change |
|------|--------|
| `src/lib/services/profit.service.ts` | Now uses `FinancialTruthService.getCombinedPeriodCost()` |
| `src/lib/services/sales.service.ts` | `getDailySales()` now uses actual consumption costs |
| `src/lib/services/smart-dining-slip.service.ts` | Margin calculations use actual costs where available |

### New Tests

| File | Tests |
|------|-------|
| `tests/services/financial-truth.service.test.ts` | 13 tests covering all cost calculation scenarios |

---

## Source of Truth Changes

### Before Migration

```
Executive Report
      ↓
ProfitService.calculateDailyProfit()
      ↓
sale.items.reduce((sum, item) => sum + item.menuItem.costCents * item.quantity)
      ↓
MenuItem.costCents (STATIC ESTIMATE)
```

### After Migration

```
Executive Report
      ↓
ProfitService.calculateDailyProfit()
      ↓
FinancialTruthService.getCombinedPeriodCost()
      ↓
┌─────────────────────────────────────────────────────────────────┐
│ Actual Cost Path (when consumption exists)                      │
│                                                                 │
│ InventoryConsumption.totalCostCents                            │
│       ↓                                                         │
│ Aggregated from actual inventory deductions                     │
│       ↓                                                         │
│ Cost-at-consumption using InventoryItem.unitCostCents           │
└─────────────────────────────────────────────────────────────────┘
                              +
┌─────────────────────────────────────────────────────────────────┐
│ Fallback Path (for historical data without consumption)         │
│                                                                 │
│ MenuItem.costCents * quantity                                   │
│       ↓                                                         │
│ Clearly labeled as "ESTIMATED"                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Changes

### ProfitService Return Types

All profit calculation methods now include additional metadata:

```typescript
// Before
{
  date: Date,
  revenue: number,
  cost: number,
  profit: number,
  margin: number,
  salesCount: number,
  averageSale: number,
}

// After
{
  date: Date,
  revenue: number,
  cost: number,
  profit: number,
  margin: number,
  salesCount: number,
  averageSale: number,
  // NEW: Financial truth metadata
  costSource: 'ACTUAL' | 'ESTIMATED' | 'MIXED',
  actualCostCents: number,
  estimatedCostCents: number,
  actualCostPercentage: number,
}
```

### SalesService Return Types

`getDailySales()` now includes cost source metadata:

```typescript
{
  sales: Sale[],
  count: number,
  totalRevenue: number,
  totalCost: number,
  profit: number,
  profitMargin: number,
  // NEW: Financial truth metadata
  costSource: 'ACTUAL' | 'ESTIMATED' | 'MIXED',
  actualCostCents: number,
  estimatedCostCents: number,
  actualCostPercentage: number,
}
```

---

## Backward Compatibility

| Aspect | Status |
|--------|--------|
| Existing API contracts | PRESERVED |
| Return type structure | EXTENDED (additive only) |
| Dashboard compatibility | MAINTAINED |
| Report structure | UNCHANGED |
| Historical data | SUPPORTED (with ESTIMATED label) |

---

## Cost Source Labels

| Label | Meaning |
|-------|---------|
| `ACTUAL` | 100% of costs derived from InventoryConsumption records |
| `ESTIMATED` | 100% of costs derived from MenuItem.costCents (no consumption records) |
| `MIXED` | Some costs from consumption, some from estimates |

---

## Fallback Logic

When a sale item has no `InventoryConsumption` records (historical data or items without recipes):

1. System uses `MenuItem.costCents * quantity` as fallback
2. Cost is clearly labeled as `ESTIMATED`
3. `actualCostCents` is set to `null` for that item
4. Overall sale/period is labeled as `MIXED` or `ESTIMATED`

**No estimated values are ever presented as actual values.**

---

## Performance Considerations

### Query Optimization

The `FinancialTruthService` uses two efficient queries:

1. **Actual costs:** Single aggregate query on `InventoryConsumption`
2. **Estimated costs:** Query for items without consumption records

### Indexed Fields

All queries use indexed fields:
- `InventoryConsumption.businessId`
- `InventoryConsumption.createdAt`
- `InventoryConsumption.state`
- `SaleItem.saleId`

### Caching Opportunity

For high-volume reporting, results can be cached at the daily level since historical consumption data is immutable.

---

## Test Coverage

| Test Suite | Tests | Status |
|------------|-------|--------|
| FinancialTruthService | 13 | PASS |
| ProfitService (integration) | Covered by existing tests | PASS |
| ConsumptionEngineService | 26 | PASS |
| InventoryLedgerService | 26 | PASS |
| RecipeService | 41 | PASS |
| SaleItemStatusService | 21 | PASS |

**Total Kitchen Consumption + Financial Truth Tests:** 127

---

## Migration Verification

### Build Status

| Check | Status |
|-------|--------|
| Prisma Generate | PASS |
| TypeScript Compilation | PASS |
| Next.js Build | PASS |
| Static Generation | PASS |

### Test Status

| Suite | Result |
|-------|--------|
| FinancialTruthService | 13/13 PASS |
| Kitchen Consumption Engine | 114/114 PASS |
| All Services | 143/144 PASS (1 pre-existing failure) |

---

## Conclusion

The Financial Truth Migration is complete. All executive financial metrics that depend on food cost can now be traced back to actual inventory consumed during restaurant operations.

**Migration Status:** COMPLETE
**Production Ready:** YES
