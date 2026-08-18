# Kitchen Consumption Engine — Architecture Blueprint

**Status**: Architectural blueprint only. No implementation. No code. No UI.  
**Audience**: Implementation team (next sprint).  
**Constraint**: Build only on existing ImboniServe architecture. No replacement systems.

---

## 1. Purpose

Connect five existing modules into one deterministic consumption chain:

```
Supplier Receipts (OCR V1)         already exists
        │
        ▼
Inventory (InventoryItem)          already exists
        │
        ▼
[ NEW: Recipe + RecipeIngredient ] ←── this blueprint
        │
        ▼
Kitchen Production (SaleItem)      already exists
        │
        ▼
Sales (Sale)                       already exists
        │
        ▼
[ NEW: Inventory Consumption ]     ←── this blueprint
        │
        ▼
[ NEW: Food Cost on Sale ]         ←── this blueprint
        │
        ▼
Profitability dashboards           already exist (need a real input)
```

The engine has **one job**: when a sale fires, the correct quantities leave inventory exactly once, with a full audit trail, at a deterministic cost.

---

## 2. Existing Components the Engine Will Use (NOT Replace)

| Component | Where | Used by Engine for |
|---|---|---|
| `InventoryItem` | <ref_snippet file="C:/Dev/ImboniResto/prisma/schema.prisma" lines="463-480" /> | The "what's in stock" anchor. Engine reads `currentStock`, `unit`, `unitCostCents`, decrements via existing service. |
| `InventoryUpdate` | <ref_snippet file="C:/Dev/ImboniResto/prisma/schema.prisma" lines="482-495" /> | Engine reuses the existing audit row with `type='CONSUMPTION'` (string field, already free-form). No schema change required for this. |
| `InventoryService.recordUpdate` | <ref_snippet file="C:/Dev/ImboniResto/src/lib/services/inventory.service.ts" lines="77-131" /> | Engine calls this internally. The negative-stock guard at line 102 is reused — DO NOT bypass. |
| `MenuItem` | <ref_snippet file="C:/Dev/ImboniResto/prisma/schema.prisma" lines="302-328" /> | Recipe attaches here. Existing `ingredients String[]` field at line 315 stays for free-text display; the new `Recipe` relation supplies the **machine-readable** ingredient list. |
| `MenuItem.costCents` | line 308 | Engine writes the rolled-up recipe cost back to this field on every recipe save. Existing reports already read it. |
| `SaleItem` + `ItemStatus` state machine | <ref_snippet file="C:/Dev/ImboniResto/prisma/schema.prisma" lines="425-461" /> + <ref_snippet file="C:/Dev/ImboniResto/src/pages/api/station/update-item-status.ts" lines="91-99" /> | The state transition `NEW → PREPARING` is the trigger point. The state machine is already enforced. |
| `TicketEvent` (append-only event log) | <ref_snippet file="C:/Dev/ImboniResto/prisma/schema.prisma" lines="3874-3896" /> | Engine emits `INGREDIENTS_CONSUMED` events here — append-only, has `idempotencyKey` and `sequenceNumber`. |
| `IdempotencyKey` + `IdempotencyService` | <ref_snippet file="C:/Dev/ImboniResto/src/pages/api/station/update-item-status.ts" lines="29-43" /> | Engine wraps consumption in idempotency to defend against double-fires (Pusher reconnect, retried requests). |
| `UnitNormalizationService` | <ref_file file="C:/Dev/ImboniResto/src/lib/services/unit-normalization.service.ts" /> | Already validates units in OCR apply. Engine reuses for recipe→inventory unit reconciliation. |
| `prisma.$transaction` pattern | used throughout, e.g. <ref_snippet file="C:/Dev/ImboniResto/src/pages/api/die/documents/[id]/apply.ts" lines="214-264" /> | Engine wraps each consumption in a single tx: read stock → write update → write audit → emit event. |
| `DIE_PLUGIN_EVENTS` | <ref_snippet file="C:/Dev/ImboniResto/src/lib/die/plugins/core/plugin-events.ts" lines="1-10" /> | Engine adds two new event names so future AI Coach, Benchmark Network, Forecasting can subscribe without touching the engine. |
| `pluginRunner.emit` | <ref_file file="C:/Dev/ImboniResto/src/lib/die/plugins/runtime/plugin-runner.ts" /> | The hook for downstream listeners. |

**Hard rule**: The engine does NOT add a second inventory ledger. It does NOT add a parallel sales table. It does NOT replace `InventoryUpdate`.

---

## 3. New Models Required (Minimal Schema Delta)

The engine needs exactly **four** new tables. Detailed field design lives in <ref_file file="C:/Dev/ImboniResto/RECIPE_ENGINE_REALITY_REVIEW.md" />.

| New model | Replaces | Why it's necessary |
|---|---|---|
| `Recipe` | nothing (currently a UI mockup at <ref_snippet file="C:/Dev/ImboniResto/src/pages/dashboard/recipe-management.tsx" lines="44-74" />) | Container for one or many ingredient lines per `MenuItem`; supports versioning. |
| `RecipeIngredient` | nothing | The link: Recipe → InventoryItem with `quantity` + `unit` + optional `yield`/`waste` factor. |
| `RecipeVersion` (or `Recipe.version` + `effectiveFrom`) | nothing | Snapshot of a recipe at the moment it was used, so re-priced recipes don't rewrite history. |
| `InventoryConsumption` | nothing | The lineage row: SaleItem → InventoryItem with consumed qty + cost-at-consumption. Distinct from `InventoryUpdate` because it must carry recipe-level context. **OR** option B: extend `InventoryUpdate.notes` is rejected — see Risk R7. A dedicated table wins. |

Existing models that get **one optional new field each** (no breaking change):
- `MenuItem.recipeId String?` — points at the active recipe.
- `SaleItem.consumptionState String? @default("PENDING")` — values: `PENDING` | `CONSUMED` | `REVERSED` | `SKIPPED`. Enables idempotency without a separate lookup.
- `InventoryItem.costingMethod String @default("WAVG")` — values: `WAVG` | `FIFO`. Lets per-item override the business default. Default keeps every existing row identical to today's behaviour.

No existing column is dropped. No existing index is changed.

---

## 4. The Consumption Trigger — When Does Stock Leave?

Possible trigger points (only ONE may be chosen):

| Trigger | Pros | Cons | Verdict |
|---|---|---|---|
| Order CREATED | Pre-deducts; KDS instantly accurate | Voids, walk-aways force re-credit. Idempotency complicated by add-items flow. | ❌ |
| Payment CONFIRMED | Cleanly tied to money | Cash POS auto-completes payment *before* kitchen sees order; QR-paid orders deduct twice the moment of dispatch. Doesn't match physical reality. | ❌ |
| **`NEW → PREPARING` (item-level)** | The moment the cook physically takes ingredients from the storeroom. Matches restaurant reality. Naturally bounded to one item, not a whole order. State machine already enforces this transition. | Requires a CANCELED→reverse path. | ✅ **Chosen** |
| `READY` or `DELIVERED` | Safest from a finance angle | Stock appears full while cooking — KDS lies. Cancellation handling becomes weirder. | ❌ |

**Chosen trigger**: `SaleItem.itemStatus: NEW → PREPARING` transition emitted from `/api/station/update-item-status` <ref_snippet file="C:/Dev/ImboniResto/src/pages/api/station/update-item-status.ts" lines="157-167" />.

**Reverse trigger**: `PREPARING → CANCELED` issues a compensating `InventoryConsumption` row of opposite sign and a matching `InventoryUpdate` ADD with `reason='Consumption reversed'`.

**Why item-level, not order-level**: A single Sale can hold both kitchen and bar items, with different stations starting prep at different times. Per-item triggering is the only way to keep KDS, books, and bar in sync.

**Edge cases mapped to this rule**:

| Scenario | Engine response |
|---|---|
| Item cancelled before PREPARING | No consumption to reverse — nothing to do. |
| Item cancelled after PREPARING | Reverse via REVERSED consumption + InventoryUpdate ADD. |
| Item cancelled after READY | Same — reverse. Plus emit `KITCHEN_WASTE` event for analytics. |
| Item cancelled after DELIVERED | Refund flow, NOT a consumption reversal (food was eaten / removed). |
| Add-on Sale (parentOrderId) | Each add-on Sale's items go through the same trigger independently. |
| Kitchen remake (item replaced) | Original item stays CONSUMED; new item triggers its own consumption. `mutationType=REPLACED` makes this visible. |
| Voided whole sale before any item PREPARING | No consumption — already idempotent because each SaleItem starts at `consumptionState=PENDING`. |

---

## 5. Component Map (Logical Architecture)

```
┌─────────────────────────────────────────────────────────────────────┐
│                      CONSUMPTION ENGINE                              │
│                                                                       │
│   ┌──────────────────────┐    ┌──────────────────────────────────┐   │
│   │ RecipeService        │    │ ConsumptionService               │   │
│   │  - resolve(menuItem) │    │  - consumeForSaleItem(itemId)    │   │
│   │  - cost(recipe)      │    │  - reverseForSaleItem(itemId)    │   │
│   │  - publishVersion()  │    │  - dryRun(saleItemId)            │   │
│   └─────────▲────────────┘    └────────────────▲─────────────────┘   │
│             │                                  │                       │
│   ┌─────────┴────────────┐    ┌────────────────┴─────────────────┐   │
│   │ CostingStrategy      │    │ ConsumptionLedger                │   │
│   │  - WAVG (default)    │    │  - writes InventoryConsumption   │   │
│   │  - FIFO (pluggable)  │    │  - writes InventoryUpdate        │   │
│   │  - getUnitCost(item) │    │  - writes TicketEvent            │   │
│   └──────────────────────┘    │  - emits DIE plugin event        │   │
│                                └──────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
              ▲                                          │
              │ called from                              │ emits
              │                                          ▼
   ┌──────────┴──────────────┐         ┌────────────────────────────────┐
   │ Existing endpoint:      │         │ DIE plugin runner               │
   │ POST /api/station/      │         │  - AI Coach listener (later)    │
   │  update-item-status     │         │  - Benchmark Network (later)    │
   │ (NEW→PREPARING)         │         │  - Forecaster (later)           │
   └─────────────────────────┘         └────────────────────────────────┘
```

No new HTTP endpoint is required for the trigger. The existing station endpoint imports `ConsumptionService` and calls `consumeForSaleItem(itemId, { idempotencyKey })` inside the same transaction that flips `itemStatus`.

A small number of NEW admin endpoints are needed for managing recipes — out of scope of this engine but defined in <ref_file file="C:/Dev/ImboniResto/RECIPE_ENGINE_REALITY_REVIEW.md" />.

---

## 6. End-to-End Walkthrough (the burger example, mapped to code)

| Stage | Event in current system | Engine action |
|---|---|---|
| Supplier delivers 10 kg chicken, 20 buns, 3 kg cheese, 2 kg tomato | OCR V1 apply path <ref_snippet file="C:/Dev/ImboniResto/src/pages/api/die/documents/[id]/apply.ts" lines="218-264" /> | None — existing flow already records `InventoryUpdate` rows with before/after. |
| Owner attaches recipe to "Chicken Burger" MenuItem: 150 g chicken, 1 bun, 20 g cheese, 30 g tomato | NEW admin UI calls `RecipeService.publishVersion(menuItemId, ingredients[])` | Recipe + RecipeIngredient rows created. `MenuItem.recipeId` set. `MenuItem.costCents` recomputed from current `InventoryItem.unitCostCents` × qty (unit-normalized). |
| Customer orders Chicken Burger via QR | Existing `/api/public/order/draft` <ref_file file="C:/Dev/ImboniResto/src/pages/api/public/order/draft.ts" /> | None — order in `NEW`, `consumptionState=PENDING`. |
| Customer pays. Kitchen dispatch fires. Item routed to Kitchen station. | `KitchenDispatchService.dispatchToKitchen` | None — still PENDING. |
| Line cook taps "Start" on KDS | `POST /api/station/update-item-status` with `newStatus=PREPARING` | Inside the same tx, engine: ① looks up the recipe version snapshot for this SaleItem (frozen at item creation, see §7), ② for each RecipeIngredient computes qty × portion, ③ asks CostingStrategy for unit cost, ④ calls `InventoryService.recordUpdate` with `type='CONSUMPTION'`, ⑤ writes `InventoryConsumption` row, ⑥ writes `TicketEvent INGREDIENTS_CONSUMED`, ⑦ sets `SaleItem.consumptionState=CONSUMED`, ⑧ emits `DIE_PLUGIN_EVENTS.INGREDIENTS_CONSUMED`. |
| Inventory dashboard refreshes | Existing inventory pages | Reads the now-correct `currentStock` and `InventoryUpdate` history. |
| Owner views food cost report | New report driven by `InventoryConsumption.unitCostAtConsumptionCents` summed per period | See <ref_file file="C:/Dev/ImboniResto/FOOD_COST_ARCHITECTURE.md" />. |
| Customer cancels burger after it's been prepped | `PREPARING → CANCELED` transition | Engine reverses: REVERSED InventoryConsumption row, compensating InventoryUpdate ADD, `consumptionState=REVERSED`. |

Everything is built around existing transitions. The engine is invisible until the cook hits "Start".

---

## 7. Recipe Version Snapshotting (Critical Design Decision)

A recipe edited on Tuesday must NOT rewrite Monday's food cost.

**Rule**: At the moment a SaleItem first transitions to PREPARING, the engine captures the currently active `RecipeVersion` ID onto `InventoryConsumption.recipeVersionId`. From that point on, the SaleItem is bound to that version forever.

**Why**: This is how every real kitchen ERP keeps history clean. It's how OCR V1 already keeps `ExtractionPayload` immutable. It's how SaleItem already snapshots `unitPriceCents` rather than joining MenuItem (line 430 — that snapshot pattern is already the codebase's convention).

**Consequence**:
- `RecipeIngredient` rows are versioned (or `Recipe` carries a monotonically increasing `version` integer and old versions are kept).
- The active recipe pointer is `MenuItem.recipeId` → `Recipe.id` where `Recipe.isActive=true` for that MenuItem.
- Republishing a recipe creates a NEW Recipe row; the old one stays for history.

---

## 8. Idempotency & Concurrency

**Threat**: Pusher reconnect causes the station UI to retry the `update-item-status` call. Two cooks tap "Start" at the same time. Worker retries a stale BullMQ job.

**Defences (all reuse existing facilities)**:

1. The existing `IdempotencyKey` model + `IdempotencyService.checkAndLock` already short-circuits repeated POSTs to `/api/station/update-item-status` <ref_snippet file="C:/Dev/ImboniResto/src/pages/api/station/update-item-status.ts" lines="29-43" />. No engine change needed.
2. `SaleItem.consumptionState` enforces "at most once" at the data layer:
   - The engine's update statement is `UPDATE SaleItem SET consumptionState='CONSUMED' WHERE id=? AND consumptionState='PENDING'`. If 0 rows affected → another transition already consumed; abort silently and return existing audit.
   - Reverse path: `WHERE consumptionState='CONSUMED'` → `REVERSED`. Same pattern.
3. The whole consume operation runs inside `prisma.$transaction` (read stock → check guard → write InventoryUpdate → write InventoryConsumption → flip consumptionState → write TicketEvent). Database guarantees atomicity.
4. `TicketEvent.idempotencyKey` (already unique on `(saleItemId, idempotencyKey)`) catches the rare case of an event-only retry.

**Concurrency rule**: One row update per InventoryItem per operation, serialized by Postgres row-level lock (`SELECT ... FOR UPDATE` inside the tx, available via `prisma.$queryRaw` if needed, but the simple read-modify-write pattern used by `InventoryService.recordUpdate` is sufficient under default `READ COMMITTED` because the guard at <ref_snippet file="C:/Dev/ImboniResto/src/lib/services/inventory.service.ts" lines="102-102" /> prevents negative stock if a race lands you below zero — the tx aborts and the engine retries).

---

## 9. Future Plugin Events to Add

Add two entries to `DIE_PLUGIN_EVENTS` at <ref_snippet file="C:/Dev/ImboniResto/src/lib/die/plugins/core/plugin-events.ts" lines="1-10" />:

| Event | When fired | Payload |
|---|---|---|
| `INGREDIENTS_CONSUMED` | After successful consume | `{ businessId, saleId, saleItemId, menuItemId, recipeVersionId, lines: [{ inventoryItemId, qty, unit, unitCostCents }], totalCostCents }` |
| `CONSUMPTION_REVERSED` | After successful reverse | Same shape + `reasonCode` |

That's all the AI Coach, Benchmark Network, Forecaster, and Hotel module will ever need to subscribe to. See <ref_file file="C:/Dev/ImboniResto/FUTURE_COMPATIBILITY_REVIEW.md" />.

---

## 10. What the Engine Does NOT Do (Anti-Scope)

- ❌ It does not introduce a parallel "stock ledger" alongside `InventoryUpdate`.
- ❌ It does not replace `InventoryService.recordUpdate` — it calls it.
- ❌ It does not add a new state machine for items — it hooks the existing `ItemStatus` machine.
- ❌ It does not change how OCR ingests deliveries.
- ❌ It does not implement Recipe UI — that is a separate frontend task.
- ❌ It does not auto-correct historical inventory drift. (Day-1 reset is an operational task, not engine logic.)
- ❌ It does not handle physical waste/spoilage — that uses the existing `InventoryUpdate type='WASTE'` flow. See <ref_file file="C:/Dev/ImboniResto/INVENTORY_CONSUMPTION_MODEL.md" />.

---

## 11. Verdict on the Primary Question

> *"What architecture allows every sale to consume inventory correctly while remaining simple, deterministic, auditable, and scalable?"*

**Answer**: A thin engine of two services (`RecipeService`, `ConsumptionService`) attached to a four-table schema delta, triggered by the existing `NEW → PREPARING` state transition, layered on top of every existing inventory, audit, idempotency, and event-emission facility already present in ImboniServe.

- **Simple**: Two services, four tables, one trigger point.
- **Deterministic**: Recipe version is snapshotted on first consumption; cost is computed from a single pluggable strategy.
- **Auditable**: Every gram is on `InventoryConsumption` + `InventoryUpdate` + `TicketEvent` with `idempotencyKey`.
- **Scalable**: All writes are O(ingredients-per-recipe), bounded; concurrency handled by `consumptionState` guard.

Implementation detail of each piece follows in the companion documents.
