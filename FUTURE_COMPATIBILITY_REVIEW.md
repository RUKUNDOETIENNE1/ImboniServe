# Future Compatibility Review

**Question**: Will the Kitchen Consumption Engine, as designed, support AI Coach, Benchmark Network, Demand Forecasting, Recipe Optimization, Automatic Purchasing, Hotel Kitchens, Multi-location Consumption, and Digital Twin — **without redesign**?

**Test method**: For each future module, identify (a) the data it needs, (b) the integration seam it would use, (c) what schema or service changes the seam requires. Anything requiring schema change to the engine fails the test.

---

## 1. AI Coach

**Data needed**: 
- Per-dish food cost over time
- Per-ingredient consumption trends
- Recipe drift (sold × expected vs actually consumed)
- Anomalies in cook-level consumption

**Integration seam**: 
- Subscribe to `DIE_PLUGIN_EVENTS.INGREDIENTS_CONSUMED` via existing `pluginRunner` (<ref_snippet file="C:/Dev/ImboniResto/src/lib/die/plugins/core/plugin-events.ts" lines="1-10" />).
- Query `InventoryConsumption` rows with `(businessId, createdAt)` index.
- Query `MenuItem.costCents` + `Sale.totalAmountCents` for margin context.

**Schema changes to engine**: **NONE**.

**Will AI Coach require redesign of the engine?** **NO**.

---

## 2. Benchmark Network

**Data needed** (anonymized, cross-business): 
- Average food cost % per cuisine
- Yield factors per ingredient
- Recipe cost distribution
- Consumption velocity per category

**Integration seam**: 
- A new "benchmark export" service reads `InventoryConsumption` and `Recipe` rows nightly, de-identifies, and ships to the benchmark store.
- The benchmark store can be a separate database, or an external service. It does not write back into ImboniServe.

**Schema changes to engine**: **NONE**. The engine produces the raw event stream; benchmark consumes it offline.

**Will Benchmark Network require redesign of the engine?** **NO**.

---

## 3. Demand Forecasting

**Data needed**: 
- Time series of consumption per ingredient
- Time series of sales per MenuItem
- Weather / seasonality (external)
- Reorder lead times per supplier

**Integration seam**: 
- Read `InventoryConsumption` group by `(inventoryItemId, day)` for the time series.
- Read `InventoryUpdate type='ADD'` for receive events.
- Combine with existing `Supplier`, `PurchaseOrder` data already in the system.

**Schema changes to engine**: **NONE**.

**Will demand forecasting require redesign of the engine?** **NO**.

---

## 4. Recipe Optimization

**Data needed**: 
- Cost contribution per ingredient per recipe
- Ingredient substitution candidates
- Margin sensitivity to recipe changes
- Drift between expected and actual consumption

**Integration seam**: 
- Read `RecipeIngredient` + `InventoryItem.unitCostCents` + `InventoryConsumption` history.
- Write recommendations to a new domain table (out of scope).
- Recipe edits go through existing `RecipeService.publishVersion(...)` — engine handles versioning automatically.

**Schema changes to engine**: **NONE**.

**Will recipe optimization require redesign of the engine?** **NO**.

---

## 5. Automatic Purchasing

**Data needed**: 
- Real `currentStock` (now accurate after engine)
- Real consumption velocity (now derivable from `InventoryConsumption`)
- Reorder points (already on `InventoryItem.minStockLevel`)
- Lead times (out of scope — supplier table extension)

**Integration seam**: 
- Existing `SmartReorderService` <ref_file file="C:/Dev/ImboniResto/src/lib/services/smart-reorder.service.ts" /> and `ReorderAutopilotService` <ref_file file="C:/Dev/ImboniResto/src/lib/services/reorder-autopilot.service.ts" /> already exist.
- They read `InventoryItem.currentStock` — once the engine ships, that value is for the first time *accurate*, so these services suddenly produce reliable suggestions.

**Schema changes to engine**: **NONE**. The change is that *upstream services that already exist now have trustworthy inputs*.

**Will automatic purchasing require redesign of the engine?** **NO**.

---

## 6. Hotel Kitchens

**Data needed**: 
- Mother sauces and sub-recipes (often 3-4 levels deep in hotel kitchens)
- Banquet pre-production (one large yield, drawn down over a service)
- Room service vs restaurant vs banquet attribution
- Department-level cost (F&B vs Banquet vs Room Service)

**Integration seam**: 
- Sub-recipes are already a first-class concept (<ref_file file="C:/Dev/ImboniResto/RECIPE_ENGINE_REALITY_REVIEW.md" /> §5). Hotels just use more of them.
- `Sale.outletId` already exists <ref_snippet file="C:/Dev/ImboniResto/prisma/schema.prisma" lines="357-357" />. Reports can group consumption by outlet via `InventoryConsumption.saleItemId → SaleItem.saleId → Sale.outletId`.
- Banquet pre-production: a recipe with `yieldQuantity=200, yieldUnit='PORTION'` is created once and consumed in bulk. Each portion serving fires a separate consumption. Already supported.
- Department-level cost is a `GROUP BY outletId` on existing data. No engine change.

**Schema changes to engine**:
- Recursion depth limit (currently architecturally bounded at 2) → bumped via config to 4 for hotel-grade BOMs. Configuration value, not schema.
- Eventually: a `Recipe.departmentTag` column for hotel reporting convenience. Additive, optional, no impact on engine logic.

**Will hotel kitchens require redesign of the engine?** **NO**. Configuration only.

---

## 7. Multi-Location Consumption

**Data needed**: 
- Inventory per branch
- Recipe consistency across branches
- Inter-branch transfers
- Aggregated business view

**Integration seam**: 
- Today `InventoryItem.businessId` scopes inventory to a single business; a future `branchId` column on `InventoryItem` adds the second scope.
- `Recipe` is already business-scoped; same `Recipe` can refer to whichever `InventoryItem` matches the branch.
- Transfers are two `InventoryUpdate` rows (REMOVE on source + ADD on destination) tied by a new `transferId` — additive.

**Schema changes to engine**: 
- One nullable `branchId` on `InventoryItem` and `InventoryConsumption` is enough; the engine's consume logic doesn't change (it reads whichever InventoryItem is referenced).

**Will multi-location require redesign of the engine?** **NO** — additive column only.

---

## 8. Digital Twin

**Data needed**: 
- Complete, replayable history of every state change
- Deterministic recomputation of any past state
- Ability to simulate "what if we'd changed this recipe a week ago"

**Integration seam**: 
- The audit architecture (<ref_file file="C:/Dev/ImboniResto/CONSUMPTION_AUDIT_ARCHITECTURE.md" />) is already append-only with immutable history. Recipe versioning means any historical state can be reconstructed.
- A simulation service replays `InventoryConsumption` rows against alternative `Recipe` versions to estimate counterfactual cost. No write to canonical tables.

**Schema changes to engine**: **NONE**.

**Will digital twin require redesign of the engine?** **NO**. The engine is, by construction, twin-compatible.

---

## 9. New POS / Kitchen Surfaces (e.g. native mobile, kiosk, voice)

**Data needed**: 
- The same `SaleItem` state machine, the same `update-item-status` endpoint.

**Integration seam**: 
- Engine sits behind the endpoint, not in front of it. Any new UI calling the same endpoint inherits the engine for free.

**Schema changes to engine**: **NONE**.

---

## 10. Plug-Point Inventory (the only seam the future may extend)

The single conceptual seam where future modules touch the engine itself is:

**The `DIE_PLUGIN_EVENTS` event bus**, currently at <ref_snippet file="C:/Dev/ImboniResto/src/lib/die/plugins/core/plugin-events.ts" lines="1-10" />.

After engine ships:

```
DIE_PLUGIN_EVENTS = {
  ...existing events...,
  INGREDIENTS_CONSUMED:  'consumption.ingredients_consumed',
  CONSUMPTION_REVERSED:  'consumption.reversed',
}
```

Every future module (AI Coach, Benchmark, Forecaster, Optimizer, Twin) subscribes here. Subscribers cannot mutate engine state. Subscribers are append-only consumers of engine output. **This is the firewall** that makes "no redesign needed" true.

The pattern is exactly the same as today's OCR plugins (`qr-menu.plugin.ts` listens to `MENU_UPLOADED`, etc.). The engine inherits the existing architecture's plugin philosophy and applies it to consumption.

---

## 11. Summary Compatibility Matrix

| Future module | Engine schema change? | Engine code change? | Where it connects |
|---|---|---|---|
| AI Coach | ❌ None | ❌ None | Subscribes to `INGREDIENTS_CONSUMED` event |
| Benchmark Network | ❌ None | ❌ None | Reads `InventoryConsumption` offline |
| Demand Forecasting | ❌ None | ❌ None | Reads time series from existing tables |
| Recipe Optimization | ❌ None | ❌ None | Reads recipes + consumption history |
| Automatic Purchasing | ❌ None | ❌ None | Existing services consume now-accurate stock |
| Hotel Kitchens | ❌ None (config only) | ❌ None | Sub-recipe depth config; outlet grouping in reports |
| Multi-location | 🟡 Additive `branchId` columns | ❌ None | Engine reads whichever InventoryItem is referenced |
| Digital Twin | ❌ None | ❌ None | Replays append-only history |
| Native mobile POS | ❌ None | ❌ None | Same `update-item-status` endpoint |
| New cuisine type (vegan, kosher) | ❌ None | ❌ None | Just menu data |

Only **one** entry has any schema delta at all, and it is a single nullable column — the universal "branches" requirement.

---

## 12. Verdict

The Kitchen Consumption Engine, as designed in:
- <ref_file file="C:/Dev/ImboniResto/KITCHEN_CONSUMPTION_ENGINE_ARCHITECTURE.md" />
- <ref_file file="C:/Dev/ImboniResto/RECIPE_ENGINE_REALITY_REVIEW.md" />
- <ref_file file="C:/Dev/ImboniResto/FOOD_COST_ARCHITECTURE.md" />
- <ref_file file="C:/Dev/ImboniResto/INVENTORY_CONSUMPTION_MODEL.md" />
- <ref_file file="C:/Dev/ImboniResto/CONSUMPTION_AUDIT_ARCHITECTURE.md" />

…is a **terminal architecture** for inventory consumption in ImboniServe. Every named future module slots in *without modifying the engine*. The only architectural change ever expected is the universal `branchId` column for multi-tenant location scope, which is additive and matches the same pattern as today's `businessId`.

This is the permanent inventory foundation.
