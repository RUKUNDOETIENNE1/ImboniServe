# Consumption Audit Architecture

**Question**: For every gram of ingredient that leaves inventory, can the system answer *who, when, why, for which order, at what cost, with which recipe version, against which inventory batch* — without ambiguity?

---

## 1. The Eight Audit Questions

Every consumption event must answer all eight, all from durable rows, all queryable in O(1) per question with appropriate indexes:

| Question | Answered by | Field |
|---|---|---|
| **Who** consumed it? | `InventoryConsumption.actorUserId` (cook who tapped Start) | + `User.name` joinable |
| **Which order**? | `InventoryConsumption.saleItemId → SaleItem.saleId → Sale.orderNumber` | |
| **Which recipe**? | `InventoryConsumption.recipeId` (immutable; old versions retained) | + `Recipe.version` |
| **Which ingredients**? | `InventoryConsumption.inventoryItemId` (one row per ingredient) | + `recipeIngredientId` for the precise line |
| **Which inventory batch**? (FIFO future) | `InventoryConsumption.inventoryBatchId` (V2 column, NULL today) | Backwards compatible |
| **Previous stock**? | `InventoryUpdate.notes` already carries `beforeStock=...` per today's OCR audit pattern | Reused convention |
| **New stock**? | `InventoryUpdate.notes` carries `afterStock=...` | Same |
| **Cost at consumption**? | `InventoryConsumption.unitCostAtConsumptionCents` + `totalCostCents` | Snapshotted |
| **Timestamp**? | `InventoryConsumption.createdAt` | Index-supported |
| **Reason** (sale prep / reverse / kitchen waste)? | `InventoryConsumption.reasonCode` | |

The architecture's promise: **none of these are derivations or joins-through-three-tables. They are columns or one-hop joins.**

---

## 2. The Audit Tables in Concert

For one Chicken Burger sold, the audit writes:

```
SaleItem (existing)
   id = si_42
   menuItemId = chicken_burger
   itemStatus = NEW → PREPARING                ← state transition
   consumptionState = PENDING → CONSUMED       ← engine guard
   prepStartedAt = 2026-06-27T12:34:56Z

InventoryUpdate (existing audit table)         ← 4 rows (one per ingredient)
   id = iu_1...4
   type = 'CONSUMPTION'
   quantity = 0.15  /  1  /  0.02  /  0.03
   userId = the cook
   reason = 'Receipt OCR' style: 'Sale prep (ORD-7392)'
   notes = 'saleItemId=si_42 | beforeStock=10 | afterStock=9.85 | recipe=rcpA v3 | reason=SALE_PREP'

InventoryConsumption (NEW)                      ← 4 rows (one per ingredient)
   id = ic_1...4
   saleItemId = si_42
   inventoryItemId = chicken | bun | cheese | tomato
   recipeId = rcpA
   recipeIngredientId = ing_1...4
   quantityConsumed = 0.15 | 1 | 0.02 | 0.03
   unit = 'KG' | 'UNIT' | 'KG' | 'KG'
   unitCostAtConsumptionCents = 8000 | 150 | 12000 | 2000
   totalCostCents = 1200 | 150 | 240 | 60
   inventoryUpdateId = iu_1...4         (1:1 join)
   state = 'ACTIVE'
   reasonCode = 'SALE_PREP'
   actorUserId = the cook
   createdAt = ts

TicketEvent (existing event log)                ← 1 row summarizing the consume
   eventType = 'INGREDIENTS_CONSUMED'
   saleItemId = si_42
   actorId = the cook
   metadata = { totalCostCents: 1650, lines: [...], recipeVersion: 3 }
   idempotencyKey = 'consume-si_42-prep'
   sequenceNumber = (next after ITEM_PREPARING)

DIE plugin event (existing bus)                 ← out-of-tx, fire-and-forget
   type = DIE_PLUGIN_EVENTS.INGREDIENTS_CONSUMED
   payload as above
```

**Five tables tell one story**. Each table has a clear, single responsibility. No duplication of facts (a fact appears in at most one canonical place; everywhere else is a foreign key or a denormalized cache marked as such).

---

## 3. Append-Only Discipline

| Table | Mutation policy |
|---|---|
| `InventoryConsumption` | **Append-only**. Reverses are NEW rows. The original row's `state` flips `ACTIVE → REVERSED`, but the historical values never change. `reversedByConsumptionId` links forward to the reverse row. |
| `InventoryUpdate` | **Append-only**. Already is — codebase pattern at <ref_snippet file="C:/Dev/ImboniResto/src/lib/services/inventory.service.ts" lines="104-128" />. |
| `TicketEvent` | **Append-only** by name and contract. |
| `Recipe` | Old versions stay `isActive=false` forever once they have any `InventoryConsumption` reference. |

The only fields ever updated post-creation are:
- `InventoryItem.currentStock` (computed)
- `Recipe.isActive`, `Recipe.costCentsCached`, `Recipe.costCalculatedAt`
- `SaleItem.consumptionState`, `SaleItem.itemStatus`, lifecycle timestamps

Everything else is write-once. **This is what makes the audit defensible**.

---

## 4. Reverse Audit Detail

When a CANCEL after PREPARING happens, the engine writes:

```
NEW InventoryConsumption row:
   state = 'ACTIVE'
   quantityConsumed = -0.15  (negative)
   reasonCode = 'SALE_PREP_REVERSED'
   linkedReverseOf = ic_1   (FK to original)
   inventoryUpdateId = iu_reverse_1 (new InventoryUpdate ADD row)

UPDATE original InventoryConsumption row:
   state: 'ACTIVE' → 'REVERSED'
   reversedByConsumptionId: ic_reverse_1

NEW InventoryUpdate row:
   type = 'CONSUMPTION_REVERSAL'   (or reuse 'ADD' with reason flag)
   quantity = 0.15 (positive)
   reason = 'Sale prep reversed (ORD-7392)'
   notes = ' originalConsumptionId=ic_1 | beforeStock=9.85 | afterStock=10 '
```

Both rows have the same `recipeId`, same `recipeIngredientId`, so a query "what did we actually consume in March?" sums `state='ACTIVE'` rows and the reverse cancels the original cleanly.

---

## 5. Query Patterns Made Trivial

Each common operational question maps to a one-shot query:

| Question | Query |
|---|---|
| "All consumption for table 4 last night" | `SELECT * FROM InventoryConsumption ic JOIN SaleItem si ON ic.saleItemId=si.id JOIN Sale s ON si.saleId=s.id WHERE s.tableId='t_4' AND ic.createdAt BETWEEN ? AND ?` |
| "Food cost % for last week" | See <ref_file file="C:/Dev/ImboniResto/FOOD_COST_ARCHITECTURE.md" /> §6 |
| "How much chicken did cook #5 use yesterday?" | `SUM(quantityConsumed) WHERE inventoryItemId=chicken AND actorUserId='u_5' AND createdAt BETWEEN ...` |
| "Show me every ingredient that left stock between 2pm and 3pm" | `SELECT * FROM InventoryConsumption WHERE createdAt BETWEEN ...` |
| "Variance: sold dishes vs actual consumption" | LEFT JOIN MenuItem→Recipe→RecipeIngredient (expected) against `InventoryConsumption` (actual). Variance per ingredient is a single GROUP BY. |

All queries are O(rows-in-window) with the index plan in <ref_file file="C:/Dev/ImboniResto/RECIPE_ENGINE_REALITY_REVIEW.md" /> §3.3.

---

## 6. Cross-References to Existing Audit Surfaces

The engine **does not duplicate** the audit surfaces ImboniServe already has:

| Existing surface | Used by engine for |
|---|---|
| `DocumentProcessingLog` (DIE) | Receiving-side audit only. Engine doesn't write here. |
| `DocumentEventTimeline` | Receiving-side lifecycle only. |
| `AuditLog` (admin) | Manager-action audit (recipe published, recipe deactivated). Engine writes here only for *configuration changes*, never for routine consumption. |
| `SecurityEvent` | Auth events. Engine doesn't touch. |
| `FinancialLedgerEntry` | Money-side. Engine doesn't touch. The link from food cost into finance is *aggregated* nightly, not row-level. |
| `TicketEvent` | The operational kitchen log. Engine writes the `INGREDIENTS_CONSUMED` summary here. |
| `InventoryUpdate` | The inventory-side audit. Engine writes one row per consumed ingredient. |
| `InventoryConsumption` (new) | The sale-side / lineage audit. Engine writes one row per consumed ingredient. |

Every audit surface keeps its single responsibility. No surface duplicates another. Reconciliation across surfaces is by FK, not by joining JSON.

---

## 7. Reconciliation Watchdogs

A nightly watchdog (new, fits the existing `watchdog-*.ts` cron pattern in `src/pages/api/cron/`) verifies invariants:

| Invariant | Detection query |
|---|---|
| Every `SaleItem` with `itemStatus IN (PREPARING, READY, DELIVERED)` and `MenuItem.recipeId IS NOT NULL` has `consumptionState IN (CONSUMED, REVERSED)` | LEFT JOIN against InventoryConsumption; flag if mismatch. |
| Every `InventoryConsumption.state='ACTIVE'` row has a matching `InventoryUpdate` row | INNER JOIN on `inventoryUpdateId`; flag NULLs. |
| `InventoryItem.currentStock == sum(InventoryUpdate.signed_qty)` | Recompute and compare. |
| No `InventoryConsumption.unitCostAtConsumptionCents < 0` | Range check. |
| No `Recipe.isActive=true` with two rows for same `menuItemId` | Per-business check. |

Each invariant becomes a `RECONCILIATION_FAILED` `AlertDeliveryService.deliver(...)` call on breach. This is the **same operational shape** as today's `watchdog-reconciliation.ts`.

---

## 8. Manager-Facing Reports the Audit Makes Possible

Once the engine ships, these reports are *queries*, not new features:

| Report | Source query |
|---|---|
| Daily food cost % | InventoryConsumption GROUP BY date |
| Top-10 high-cost dishes | InventoryConsumption GROUP BY menuItemId |
| Top-5 ingredients by cost burn | InventoryConsumption GROUP BY inventoryItemId |
| Cook-level consumption | InventoryConsumption GROUP BY actorUserId |
| Recipe drift (sold qty × expected vs actual consumed) | Join SaleItem × Recipe expected vs InventoryConsumption actual |
| Shift waste | InventoryConsumption WHERE reasonCode='KITCHEN_WASTE_AFTER_PREP' GROUP BY shift |
| Spoilage | InventoryUpdate WHERE type='WASTE' GROUP BY reason |

The existing CFO/CEO dashboard endpoints at `src/pages/api/dashboard/*` already do similar aggregations on sales. Adding these is **report code, not architecture**.

---

## 9. Risk Matrix (Audit)

| ID | Risk | Class | Mitigation |
|---|---|---|---|
| A1 | Audit row missing due to bug in engine | 🔴 | Inline tx + post-commit invariant tests (item 7) |
| A2 | Cost snapshot wrong if strategy mutates state | 🟠 | Strategies must be pure-functional w.r.t. cost (one read, one number). No DB writes from inside `getUnitCost`. |
| A3 | Plugin event listener writes back into engine tables | 🟠 | Listeners are read-only consumers of the canonical tables. Listener writes go to listener-owned tables only. |
| A4 | Reverse row created without flipping original to REVERSED | 🟠 | Both writes inside one tx. Both required. |
| A5 | Reports drift from inventory math | 🟡 | Nightly watchdog (§7). |
| A6 | Manager edits recipe and history changes | 🔴 | Architecturally impossible: `InventoryConsumption.recipeId` points at the historical Recipe row, which is never mutated. |
| A7 | InventoryConsumption volume blows up the DB | 🟡 | Indexes + monthly partitioning available later without breaking schema. |

---

## 10. Verdict

Every gram of ingredient consumed by every sale produces a write to:
1. `InventoryItem.currentStock` (the live balance)
2. `InventoryUpdate` (the inventory's audit)
3. `InventoryConsumption` (the sale's lineage)
4. `TicketEvent` (the operational log)
5. `DIE plugin event` (the downstream bus)

All five write inside one atomic transaction (1-4) plus one fire-and-forget (5). No fact lives in two writable places. Reverses preserve history. Watchdogs catch invariant breaches nightly. Reports are joins, not new pipelines.

This is the audit a regulator or a forensic accountant can defend, and the audit a real owner can use to find a missing kilogram of cheese.
