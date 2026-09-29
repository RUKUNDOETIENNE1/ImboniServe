# Food Cost Architecture

**Question**: When does the system compute "the cost of this dish", which inventory cost basis does it use, and how does it stay correct as supplier prices fluctuate?

---

## 1. The Two Cost Numbers a Restaurant Needs

| Number | Purpose | When computed | Storage |
|---|---|---|---|
| **Recipe rollup cost** | Menu engineering, price-setting, margin display | Recipe publish / supplier price update | `Recipe.costCentsCached`, mirrored to `MenuItem.costCents` |
| **Consumption cost** (the *real* food cost) | Daily food cost %, COGS, profitability dashboards | Moment of consumption (NEW → PREPARING) | `InventoryConsumption.unitCostAtConsumptionCents` + `totalCostCents` |

The two are independent. The rollup is a *display* number that can drift. The consumption cost is the *book-of-record* number that must NEVER drift. Conflating them is the most common mistake in F&B systems.

---

## 2. Costing Strategy — Weighted Average for V1, FIFO Ready

`InventoryItem.unitCostCents` currently holds a single number (the OCR-apply path overwrites it with the latest invoice price <ref_snippet file="C:/Dev/ImboniResto/src/pages/api/die/documents/[id]/apply.ts" lines="221-246" />).

### V1 Default: Weighted Average Cost (WAVG)

Definition: on every inventory increase (OCR apply OR manual ADD), recompute:

```
new_unit_cost = ((old_stock × old_unit_cost) + (delivered_qty × delivered_unit_cost))
                / (old_stock + delivered_qty)
```

This number lives in `InventoryItem.unitCostCents`. The engine reads it at consumption time. No new table needed.

**Why WAVG for V1**:
- Single number per item. Reports and dashboards already read `unitCostCents`.
- Deterministic. Same input → same number.
- Reflects reality well enough for daily food cost % in a market with weekly supplier deliveries.
- Implementable inside the OCR apply transaction with a tiny change: read old stock+cost, compute new, write both, on the same atomic transaction that already runs there.

**Limitation acknowledged**: WAVG smooths sudden price spikes. A supplier doubling their price next week will show up gradually rather than in a one-day shock. For most ImboniServe customers this is the right tradeoff.

### V2 / Future: FIFO via InventoryBatch

When (and only when) a customer needs strict FIFO costing, introduce `InventoryBatch`:

| Field | Type |
|---|---|
| `id` | String @id |
| `inventoryItemId` | String FK |
| `receivedAt` | DateTime |
| `quantityReceived` | Float |
| `quantityRemaining` | Float |
| `unitCostCents` | Int |
| `sourceUpdateId` | String FK InventoryUpdate (the receive that created it) |

Consumption goes "oldest batch first". `unitCostAtConsumptionCents` is the batch's cost. `quantityRemaining` decreases until zero, then move to next batch.

**Why deferred**: it doubles the inventory write path (now two tables to update) and adds a join to every consumption read. WAVG handles 90% of operators just fine; FIFO becomes valuable only for inventory-heavy operations like central kitchens.

**Critically**: switching from WAVG to FIFO requires NO schema change to `Recipe`, `RecipeIngredient`, `InventoryConsumption`. They all just record whatever cost the strategy returns. **The CostingStrategy interface is the pluggable seam.**

### The Strategy Seam

```
interface CostingStrategy {
  getUnitCost(inventoryItemId, businessId, tx): Promise<number>      // for consumption
  onInventoryIncrease(inventoryItemId, deltaQty, deltaCost, tx): void // for recipe rollup refresh
}
```

V1 implementation: `WeightedAverageStrategy` — calls already happen inside the inventory update tx, so this is mostly a refactor of two existing call sites (OCR apply + manual updates). Selected via `Business.inventoryDefaultCostingMethod` with per-`InventoryItem.costingMethod` override.

Future implementations: `FifoStrategy`, `LifoStrategy`, `StandardCostStrategy` — pluggable without touching the consumption engine.

---

## 3. The Cost Computation Path at Consumption Time

```
ConsumptionService.consumeForSaleItem(saleItemId, tx)
  1. Load SaleItem + MenuItem + Recipe (active version) + RecipeIngredients
  2. For each RecipeIngredient:
       a. Resolve target InventoryItem (or recursively resolve sub-recipe)
       b. quantityToConsume = SaleItem.quantity × RecipeIngredient.quantity / yieldFactor
          (normalized via UnitNormalizationService to InventoryItem.unit)
       c. unitCost = CostingStrategy.getUnitCost(inventoryItem, tx)   ← strategy seam
       d. totalCost = quantityToConsume × unitCost
       e. Call InventoryService.recordUpdate({
            type: 'CONSUMPTION',
            quantity: quantityToConsume,
            reason: 'Sale prep',
            notes: `saleItemId=… recipe=… version=…`
          }) within the same tx
       f. Insert InventoryConsumption row with snapshotted cost
  3. Sum totalCost across all RecipeIngredients
  4. (Optional) Cache rolled cost on SaleItem.foodCostCents (new optional column)
  5. Flip SaleItem.consumptionState = 'CONSUMED'
  6. Write TicketEvent INGREDIENTS_CONSUMED
  7. Emit DIE_PLUGIN_EVENTS.INGREDIENTS_CONSUMED
```

**Cost snapshotting**: `unitCostAtConsumptionCents` is recorded on the `InventoryConsumption` row. Reports that compute "food cost % for Q1" sum from these snapshots and are stable against later supplier price changes. Reports that compute "current menu cost" use the live rollup. Different questions, different sources.

---

## 4. How Supplier Price Changes Propagate

The path is already wired by today's OCR V1 apply flow at <ref_snippet file="C:/Dev/ImboniResto/src/pages/api/die/documents/[id]/apply.ts" lines="221-246" />. The engine extends it minimally:

1. OCR receives a new supplier delivery (e.g. chicken now costs 9,500/kg instead of 8,000).
2. Inside the existing apply tx, `WeightedAverageStrategy.onInventoryIncrease` runs and recomputes `InventoryItem.unitCostCents`.
3. The same tx marks all `Recipe` rows containing this `InventoryItem` as `costStale = true`.
4. A background job (existing BullMQ worker; new queue `recipe-cost-refresh`) sweeps stale recipes every 5 minutes, recomputes `Recipe.costCentsCached` and `MenuItem.costCents`.
5. Future sales consume at the new average. Past sales' `InventoryConsumption` rows are untouched.

This is the entire propagation. No schema changes to OCR. No new endpoints. The audit trail naturally records the price change because `InventoryUpdate.notes` already captures `beforeCostCents` and `afterCostCents` (you implemented this today).

---

## 5. Historical Pricing

The system answers four classes of historical questions, each from a different source:

| Question | Source |
|---|---|
| "What did this dish cost on April 12?" | Sum `InventoryConsumption.totalCostCents` for that dish on that date. |
| "What was the unit cost of chicken on April 12?" | Latest `InventoryUpdate` for chicken on or before April 12 with `notes` containing `afterCostCents`. |
| "What does this dish cost today?" | `Recipe.costCentsCached` after the latest refresh. |
| "How has chicken cost moved over 90 days?" | Time-series query against `InventoryUpdate` rows. |

No new history tables are needed. The existing `InventoryUpdate` row already captures cost transitions thanks to the OCR audit work you completed.

---

## 6. Margin Calculations

Margin and food cost % become computable for the first time:

```
For a period [t1, t2]:
  revenue        = SUM(SaleItem.totalPriceCents) where Sale.paymentStatus IN (...) and createdAt in range
  foodCost       = SUM(InventoryConsumption.totalCostCents) where state='ACTIVE' and createdAt in range
  foodCostPct    = foodCost / revenue
  gross_margin   = revenue - foodCost
```

This is the calculation that the existing CFO dashboard <ref_file file="C:/Dev/ImboniResto/src/pages/api/dashboard/cfo.ts" /> currently cannot answer truthfully. After the engine ships, it can.

**Per-dish margin** for menu engineering:

```
For each MenuItem in [t1, t2]:
  units       = SUM(SaleItem.quantity)
  revenue     = SUM(SaleItem.totalPriceCents)
  foodCost    = SUM(ic.totalCostCents) FROM InventoryConsumption ic JOIN SaleItem si ON ic.saleItemId=si.id WHERE si.menuItemId=…
  contribution = revenue - foodCost
```

Same data, different group-by. No new tables needed.

---

## 7. Substitutions & Recipe Revisions

A substitution is a recipe edit. Versioning rules from <ref_file file="C:/Dev/ImboniResto/RECIPE_ENGINE_REALITY_REVIEW.md" /> §8 apply: a new `Recipe` row with `version+1, isActive=true` is created; the old one stays `isActive=false`. Past `InventoryConsumption` rows still reference the old `recipeId`, so historical reports remain truthful.

---

## 8. Ingredient Cost Volatility

Two protections:

1. **Outlier detection at receive** is already implemented in OCR apply at <ref_snippet file="C:/Dev/ImboniResto/src/pages/api/die/documents/[id]/apply.ts" lines="206-212" />. Extend it: if the new unit cost is >50% different from current `unitCostCents`, surface a warning before applying. (No schema change; same warning array used by OCR.)
2. **DIE anomaly engine** already exists (`DocumentAnomalyService`). Cost-anomaly detection per InventoryItem fits the existing pattern.

---

## 9. Risk Analysis (Food Cost)

| ID | Risk | Class | Mitigation |
|---|---|---|---|
| FC1 | Negative average cost after a WAVG glitch | 🔴 | Strategy guards: refuse to write `unitCostCents < 0`. Existing tests should cover. |
| FC2 | Division-by-zero when stock is 0 at receive | 🟠 | If `old_stock + delivered_qty == 0`, fall back to delivered_unit_cost. Service-level. |
| FC3 | Cost snapshot races (two sales fire at the same time during a price update) | 🟡 | Both consumption rows lock the row; whichever wins the tx commits its `unitCostAtConsumptionCents`. Acceptable variance; both are "correct" for their tx serialization order. |
| FC4 | Cost rollup cache lies between mark-stale and refresh | 🟢 | A 5-minute stale window on a *display* number is acceptable. Documented. |
| FC5 | OCR misread cost (e.g. comma vs decimal) | 🟠 | Existing OCR safety layer already validates price as non-negative integer cents and rejects >1B cents (10M RWF). |
| FC6 | Sub-recipe cost not updated when one of its ingredients changes | 🟠 | Recursive stale propagation: marking an InventoryItem dirty marks the sub-recipe stale, which marks parent recipes stale. Bounded by 2-level depth. |
| FC7 | Reporting query becomes slow once `InventoryConsumption` has millions of rows | 🟡 | Indexes specified in <ref_file file="C:/Dev/ImboniResto/RECIPE_ENGINE_REALITY_REVIEW.md" /> §3.3. Materialized daily roll-up table is a V3 optimization, not a blocker. |
| FC8 | Different currency for ingredient and dish | 🟢 | `Business.currency` is already a single value per business; out of scope for V1. |

---

## 10. Verdict

The architecture answers "what does this dish cost?" three different ways, **each from the right source**:

- Real-time menu cost → `Recipe.costCentsCached`
- Historical book cost → `InventoryConsumption.totalCostCents`
- Live inventory valuation → `InventoryItem.currentStock × unitCostCents`

It scales from WAVG today to FIFO tomorrow via a single `CostingStrategy` seam without rewriting the engine. It preserves immutability of historical costs through recipe versioning and consumption-time snapshotting. It tells the truth even when supplier prices swing 50% week-to-week.

This is a real food-cost system, not a POS pretending to be one.
