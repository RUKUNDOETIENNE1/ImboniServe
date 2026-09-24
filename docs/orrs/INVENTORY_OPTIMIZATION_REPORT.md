# Inventory Optimization Report

**Platform:** ImboniServe  
**Restaurant:** Café Imboni, Kigali, Rwanda  
**Sprint:** Operational Readiness Remediation Sprint (ORRS)  
**Date:** July 26, 2026  

---

## 1. IOS Finding

The IOS identified that inventory thresholds were too simplistic:
- Only a single `minStockLevel` triggered alerts
- No early warning system existed before items hit critical minimum
- Category-specific reorder thresholds were not available
- Managers had no configurable reorder point separate from minimum stock

**IOS Recommendation:** Implement improved minimum stock thresholds, better low-stock warning levels, and category-specific reorder thresholds.

---

## 2. Implementation Details

### 2.1 Database Schema Change

Added `reorderLevel` field to the `InventoryItem` model:

```prisma
model InventoryItem {
  ...
  currentStock        Float                 @default(0)
  minStockLevel       Float                 @default(10)
  reorderLevel        Float?                @default(0)    // NEW
  unitCostCents       Int
  ...
}
```

**Migration:** Direct SQL via `prisma db execute`:
```sql
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "reorderLevel" DOUBLE PRECISION DEFAULT 0;
```

**Design Decision:** `reorderLevel` is nullable with default 0 to ensure backward compatibility. Items without a configured reorder level fall back to existing `minStockLevel`-only behavior.

### 2.2 Validation Schema Updates

Updated `src/lib/validations/inventory.schema.ts`:
- `createInventoryItemSchema`: Added `reorderLevel: z.number().nonnegative().optional()`
- `updateInventoryItemSchema`: Added `reorderLevel: z.number().nonnegative().optional()`

### 2.3 Alert System Updates

#### `InventoryService.getStockAlerts()` — `src/lib/services/inventory.service.ts`

**Before:** Queried items where `currentStock <= minStockLevel` only. Alert levels: CRITICAL, HIGH, MEDIUM.

**After:** Queries items where `currentStock <= minStockLevel` OR (`reorderLevel > 0` AND `currentStock <= reorderLevel`). Alert levels expanded:
- **CRITICAL:** `currentStock === 0`
- **HIGH:** `currentStock < minStockLevel * 0.5`
- **MEDIUM:** `currentStock <= minStockLevel`
- **LOW:** `currentStock <= reorderLevel` (but above minStockLevel)

SQL query updated with `COALESCE("reorderLevel", 0)` and tiered ORDER BY for priority sorting.

#### `ReorderAutopilotService.detectLowStock()` — `src/lib/services/reorder-autopilot.service.ts`

**Before:** Filtered items where `currentStock <= minStockLevel`. Urgency based on percentage of minStockLevel.

**After:** Filters items where `currentStock <= reorderLevel` (if set) or `currentStock <= minStockLevel` (fallback). Urgency logic updated:
- **critical:** `currentStock === 0` OR `stockPercentage <= CRITICAL_THRESHOLD (20%)`
- **low:** `currentStock <= minStockLevel` OR `stockPercentage <= LOW_THRESHOLD (50%)`
- **warning:** `stockPercentage <= WARNING_THRESHOLD (80%)`

Stock percentage now calculated against `reorderLevel` (or `minStockLevel` fallback).

#### `SmartReorderService.getSuggestions()` — `src/lib/services/smart-reorder.service.ts`

Added `reorderLevel: true` to the Prisma select clause. The smart reorder calculation (demand-based reorder point) remains unchanged — the `reorderLevel` field is available for future integration but the existing demand-based logic is preserved.

### 2.4 Inventory Updates API

Updated `src/pages/api/inventory/updates.ts`:
- Added `reorderLevel: true` to the pre-item select query
- Added new alert condition: when `reorderLevel > 0` and `newStock <= reorderLevel` (but above minStockLevel), emits a `STOCK_LOW` shadow event with `alertLevel: 'LOW'`
- This provides real-time early warning when stock crosses the reorder threshold

### 2.5 Shadow Event Type Update

Updated `src/lib/die/business-as-plugin/inventory/inventory.shadow.ts`:
- Extended `alertLevel` union type from `'MEDIUM' | 'HIGH' | 'CRITICAL'` to `'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'`

### 2.6 Dashboard UI Updates

Updated `src/pages/dashboard/inventory.tsx`:
- Added `reorderLevel` to form state (default 0)
- Added reorder level input field to Add modal with descriptive placeholder and help text
- Added reorder level input field to Edit modal with same UX
- Updated form reset and edit modal population to include `reorderLevel`

---

## 3. Alert Level System

| Level | Condition | Action |
|-------|-----------|--------|
| CRITICAL | Stock = 0 | Immediate reorder required |
| HIGH | Stock < 50% of minStockLevel | Urgent reorder |
| MEDIUM | Stock ≤ minStockLevel | Reorder needed |
| LOW | Stock ≤ reorderLevel (above min) | Early warning — prepare reorder |

---

## 4. Backward Compatibility

- Items with `reorderLevel = 0` (default) behave exactly as before
- All existing alert queries include the same `currentStock <= minStockLevel` condition
- No breaking changes to API contracts
- No data migration required for existing inventory items

---

## 5. Verification

- **Alert accuracy:** Items at reorder level (above min) now appear in alerts with LOW status ✅
- **Reorder recommendations:** Reorder autopilot detects items at reorder level and generates suggestions ✅
- **Inventory reconciliation:** No changes to consumption engine or ledger — reconciliation unaffected ✅
- **UI functionality:** Add/Edit modals correctly save and display reorderLevel ✅
- **No regressions:** Existing CRITICAL/HIGH/MEDIUM alerts continue to function ✅

---

## 6. Configuration Guidance

Managers should set `reorderLevel` above `minStockLevel` for each inventory item. Recommended values:

| Category | Suggested reorderLevel (× minStockLevel) |
|----------|------------------------------------------|
| Perishables (vegetables, dairy) | 1.5× minStockLevel |
| Dry goods (flour, rice, spices) | 1.3× minStockLevel |
| Beverages | 1.4× minStockLevel |
| Cleaning supplies | 1.2× minStockLevel |

---

*Report generated: July 26, 2026*
