# Recipe Engine — Reality Review

**Question**: What does a *real* restaurant recipe model look like, and what is the minimum schema that supports it without re-design when Cafés, Bars, Bakeries, Cloud Kitchens and Hotels arrive?

---

## 1. The Current State (Evidence)

- The Recipe Management page is a **client-side mockup** with hardcoded data — <ref_snippet file="C:/Dev/ImboniResto/src/pages/dashboard/recipe-management.tsx" lines="44-74" />.
- There is **no `Recipe` / `RecipeIngredient` / `Ingredient` model** anywhere in `prisma/schema.prisma`.
- `MenuItem.ingredients` is a free-text `String[]` <ref_snippet file="C:/Dev/ImboniResto/prisma/schema.prisma" lines="315-315" />. Useful for allergens and dietary display. **Not machine-readable for consumption.**
- `MenuItem.costCents` exists <ref_snippet file="C:/Dev/ImboniResto/prisma/schema.prisma" lines="308-308" /> but is currently unmanaged.
- Plan entitlement `hasRecipeManagement` is already declared <ref_snippet file="C:/Dev/ImboniResto/src/lib/plan-entitlements.ts" lines="16-16" /> so we can gate the feature without UI changes.

Conclusion: this is a greenfield model in a codebase that has already left placeholders for it.

---

## 2. Recipe Concept — What Real Kitchens Need

A "recipe" in restaurant operations is not just a list. It is:

1. **A bill of materials** — what goes into the dish.
2. **A yield statement** — what comes out (one plate, four cocktails, 20 cookies).
3. **A version** — recipes change weekly; old data must not change with them.
4. **A loss factor** — trim, peel, evaporation. 1 kg whole chicken yields ~800 g usable.
5. **A modifier system** — "no cheese", "extra patty". Must affect consumption.
6. **A cost rollup** — derivable, refreshable, snapshotted.
7. **A scope** — some recipes are sub-recipes (a sauce used in five dishes).

Each of these maps to a schema element below. None of them is exotic; every mid-market F&B ERP supports them. The win is that we model them in **simple, additive tables** — no special syntax, no jsonb-as-database.

---

## 3. Proposed Schema (Minimal, Additive, Migration-Safe)

All new tables. Field types match codebase conventions (cuid IDs, `Float` for quantity, `Int` cents for cost, `DateTime @updatedAt`, businessId scoping consistent with <ref_snippet file="C:/Dev/ImboniResto/prisma/schema.prisma" lines="463-480" />).

### 3.1 `Recipe`

| Field | Type | Notes |
|---|---|---|
| `id` | String @id @default(cuid()) | |
| `businessId` | String | Multi-tenant scope — required by all routes via `resolveBusinessContext`. |
| `menuItemId` | String? | Optional. NULL when the recipe is a *sub-recipe* (e.g. tomato sauce) reused by other recipes. |
| `name` | String | Human display ("Chicken Burger — Standard"). |
| `yieldQuantity` | Float | How many portions one execution produces. 1 for a burger, 4 for a sauce batch. |
| `yieldUnit` | String | Normalized via `UnitNormalizationService`. Usually "PORTION" or matches an InventoryItem unit for sub-recipes. |
| `version` | Int @default(1) | Monotonically increasing within a `menuItemId`. |
| `isActive` | Boolean @default(true) | Exactly one active version per `menuItemId` enforced at the service layer (unique partial index is the better long-term answer). |
| `costCentsCached` | Int? | Last computed rollup. Refreshed on publish + on InventoryItem cost change (see §6). |
| `costCalculatedAt` | DateTime? | When the rollup was last computed. |
| `notes` | String? | Free text (prep instructions for the kitchen). |
| `createdAt`/`updatedAt` | DateTime | Standard. |

**Indexes**: `(businessId, menuItemId, isActive)`, `(businessId, isActive)`.

**Why versioning is a counter, not a separate `RecipeVersion` table**: Recipes are not deeply audited objects like financial transactions. A monotonically-increasing version on the row plus the rule "never delete, only deactivate and replace" is sufficient. The audit comes from `InventoryConsumption.recipeId` pointing at the immutable historical row.

### 3.2 `RecipeIngredient`

The join: Recipe → InventoryItem.

| Field | Type | Notes |
|---|---|---|
| `id` | String @id @default(cuid()) | |
| `recipeId` | String | FK Recipe. |
| `inventoryItemId` | String? | FK InventoryItem. NULL allowed only when `subRecipeId` is set. |
| `subRecipeId` | String? | FK Recipe (self-relation). For "150 g of house-made BBQ sauce". |
| `quantity` | Float | Amount per yield. |
| `unit` | String | Normalized. Must reconcile to either `inventoryItem.unit` or `subRecipe.yieldUnit` (validation rule). |
| `yieldFactor` | Float @default(1.0) | Trim/loss multiplier. 1.0 = no loss. 0.8 means we lose 20% from raw to plated; engine multiplies `quantity / yieldFactor` to get raw consumption. |
| `isOptional` | Boolean @default(false) | Modifier-eligible (e.g. "no cheese"). |
| `displayOrder` | Int @default(0) | UI ordering. |

**Indexes**: `(recipeId)`, `(inventoryItemId)`, `(subRecipeId)`.

**Constraint enforced at service level**: exactly one of `inventoryItemId` or `subRecipeId` is set. CHECK constraint via Prisma `@@check` if Prisma version allows; otherwise service validation.

### 3.3 `InventoryConsumption` (the lineage / audit row)

This is the *new* event table that records every gram consumed by a SaleItem.

| Field | Type | Notes |
|---|---|---|
| `id` | String @id @default(cuid()) | |
| `businessId` | String | Multi-tenant scope. |
| `saleItemId` | String | FK SaleItem. The triggering item. |
| `inventoryItemId` | String | FK InventoryItem. |
| `recipeId` | String? | FK Recipe at the time of consumption (snapshot). |
| `recipeIngredientId` | String? | FK RecipeIngredient at the time of consumption (snapshot). |
| `quantityConsumed` | Float | Computed: SaleItem.quantity × RecipeIngredient.quantity / yieldFactor, normalized to `inventoryItem.unit`. |
| `unit` | String | Same as `inventoryItem.unit` (post-normalization). |
| `unitCostAtConsumptionCents` | Int | Captured from the costing strategy at the moment of consumption. |
| `totalCostCents` | Int | quantityConsumed × unitCostAtConsumptionCents, rounded. |
| `inventoryUpdateId` | String? @unique | FK InventoryUpdate — the existing audit row this consumption produced. 1:1 link. |
| `state` | String @default("ACTIVE") | `ACTIVE` \| `REVERSED`. Reverse adds a new ACTIVE row with negative qty AND flips original to REVERSED. |
| `reversedByConsumptionId` | String? @unique | Self-link. |
| `reasonCode` | String? | `SALE_PREP`, `SALE_PREP_REVERSED`, `KITCHEN_WASTE_AFTER_PREP`, `RECIPE_MANUAL_ADJUST`. |
| `actorUserId` | String? | Who triggered (cook, manager). |
| `createdAt` | DateTime @default(now()) | |

**Indexes**: `(businessId, createdAt)`, `(saleItemId)`, `(inventoryItemId, createdAt)`, `(recipeId)`, `(state)`.

**Why distinct from InventoryUpdate**: `InventoryUpdate` is the inventory's perspective ("stock went down by 0.15"). `InventoryConsumption` is the sale's perspective ("Chicken Burger #4719 consumed 0.15 kg chicken using recipe v3 at cost 1,200 RWF"). They share a `1:1` link via `inventoryUpdateId`. Reports needing food cost % join from `Sale → SaleItem → InventoryConsumption`; reports needing stock history use `InventoryItem → InventoryUpdate`. Both views are first-class.

### 3.4 Touches to Existing Models

| Model | New column | Default | Breaking? |
|---|---|---|---|
| `MenuItem` | `recipeId String?` | NULL | No — old items unaffected; engine treats NULL as "no recipe, skip consumption with reasonCode=NO_RECIPE". |
| `SaleItem` | `consumptionState String? @default("PENDING")` | "PENDING" | No — every row pre-existing becomes PENDING; engine sees them all and skips with `NO_RECIPE` if MenuItem has no recipe. |
| `InventoryItem` | `costingMethod String @default("WAVG")` | "WAVG" | No — see <ref_file file="C:/Dev/ImboniResto/FOOD_COST_ARCHITECTURE.md" />. |
| `Business` | `inventoryDefaultCostingMethod String @default("WAVG")` | "WAVG" | No. |

No deletes. No renames. No type changes. Zero risk to existing OCR, sales, KDS, or payments flows.

---

## 4. The Burger Example, Modelled

Tables after recipe publication:

```
InventoryItem (already exists):
  chicken          { unit: 'KG', currentStock: 10.0, unitCostCents: 8000 }
  burger_bun       { unit: 'UNIT', currentStock: 20, unitCostCents: 150 }
  cheese           { unit: 'KG', currentStock: 3.0, unitCostCents: 12000 }
  tomato           { unit: 'KG', currentStock: 2.0, unitCostCents: 2000 }

MenuItem:
  chicken_burger   { recipeId: rcpA, costCents: <computed> }

Recipe:
  rcpA  { menuItemId: chicken_burger, version: 1, yieldQty: 1, yieldUnit: 'PORTION',
          isActive: true, costCentsCached: 1656 }

RecipeIngredient:
  ing1  { recipeId: rcpA, inventoryItemId: chicken,    quantity: 0.15, unit: 'KG',   yieldFactor: 1.0 }
  ing2  { recipeId: rcpA, inventoryItemId: burger_bun, quantity: 1,    unit: 'UNIT', yieldFactor: 1.0 }
  ing3  { recipeId: rcpA, inventoryItemId: cheese,     quantity: 0.02, unit: 'KG',   yieldFactor: 1.0 }
  ing4  { recipeId: rcpA, inventoryItemId: tomato,     quantity: 0.03, unit: 'KG',   yieldFactor: 1.0 }
```

Cost rollup at publish time:
```
chicken  : 0.15 × 8000  = 1200
bun      : 1    ×  150  =  150
cheese   : 0.02 × 12000 =  240
tomato   : 0.03 × 2000  =   60
                         ----
                         1650 cents (≈ 16.50 RWF/100 = 0.165 RWF; numbers illustrative)
```

When customer orders 1 Chicken Burger, line cook taps Start:
- 4 `InventoryConsumption` rows written.
- 4 corresponding `InventoryUpdate` rows (`type='CONSUMPTION'`).
- `InventoryItem.currentStock` decreased atomically per row.
- 1 `TicketEvent` of type `INGREDIENTS_CONSUMED`.
- 1 `DIE_PLUGIN_EVENTS.INGREDIENTS_CONSUMED` plugin event.

If unit price was 5,000 RWF and total cost was 1,650 RWF, food cost % = **33%**.

---

## 5. Sub-Recipes (the BBQ-sauce case)

A sub-recipe is just a `Recipe` with `menuItemId = NULL` and `yieldQuantity > 1`. Example:

```
Recipe:        BBQ Sauce        yield: 1.0 KG, version 2
RecipeIngredient(s): tomato paste 0.4 kg, vinegar 0.2 l, sugar 0.15 kg, ...
```

Another Recipe (Chicken Wings) references it:

```
RecipeIngredient: subRecipeId = bbq_sauce_recipe_id, quantity: 0.05, unit: 'KG'
```

At consumption time, the engine recursively resolves the sub-recipe into terminal `InventoryItem` consumption rows. Maximum recursion depth is bounded at **2 levels** in V1 (a sub-recipe of a sub-recipe is rare in practice and cyclical recipes are forbidden). Beyond V1, increase the bound by config — no schema change required.

This is how Bars handle mixers, Bakeries handle doughs, Hotels handle mother sauces. **No new tables needed for any of those segments.**

---

## 6. Cost Rollup Refresh — When and How

`Recipe.costCentsCached` and `MenuItem.costCents` must stay reasonable but cannot recompute on every read.

**Refresh triggers** (deterministic, all event-based, all reuse plugin runner):

| Trigger | Action |
|---|---|
| Recipe published / republished | Synchronous recompute. |
| `InventoryItem.unitCostCents` changes (manual edit OR OCR apply path <ref_snippet file="C:/Dev/ImboniResto/src/pages/api/die/documents/[id]/apply.ts" lines="221-246" />) | Mark all recipes containing this item as `costStale=true` (new column on `Recipe`). Background recompute job runs every N minutes via existing BullMQ + Redis worker. |
| Daily cron | Sweep all `costStale=true` recipes. |

**Why we don't recompute every cost on every consumption**: It's wasted work; the *consumption-time* cost is taken from `CostingStrategy`, not from the cached rollup. The cache is a *display* number for the recipe page and menu engineering, not a transactional one.

---

## 7. Restaurant-Type Coverage (without redesign)

| Segment | What it needs | How the model handles it |
|---|---|---|
| Restaurant (table service) | Multi-ingredient dishes, modifiers | Standard `Recipe` + `RecipeIngredient`. |
| Café | Quick recipes, milk/cup tracking | Same. Sub-recipes for syrups. |
| Bar | Cocktails with sub-recipes, garnishes | Sub-recipe pattern (§5). `RouteRule` already sends to BAR station. |
| Bakery | Yield in mass, batch production | `yieldQuantity` ≠ 1, `yieldUnit='KG'`. Engine multiplies SaleItem.quantity ÷ yieldQuantity. |
| Cloud Kitchen | Multiple brands, same kitchen | Already supported: `MenuItem.businessId` is the scope. |
| Hotel | Mother sauces, banquet menus, room-service menus | Sub-recipes + multiple Recipes per business with different `name`s. Hotel-specific scopes (room service vs banquet) are an **outlet** filter, and `Sale.outletId` already exists at <ref_snippet file="C:/Dev/ImboniResto/prisma/schema.prisma" lines="357-357" />. |
| Multi-location | One business with branches | `RecipeIngredient` references `InventoryItem`; inventory is per-business; if branches have separate inventories that arrives via a `branchId` field on InventoryItem in a future sprint. Recipe model unchanged. |

The single schema covers all six segments. **This is the point**.

---

## 8. Edit/Versioning Rules (Operational Discipline)

- A recipe can never be edited in place once it has at least one `InventoryConsumption` row pointing at it. The UI must "create new version" instead. Service enforces.
- Deactivating a recipe only flips `isActive=false`; it does not delete.
- A new active version is created in a transaction with the old one's deactivation.
- Modifiers (`isOptional=true`) skip their ingredient line at consumption time if the SaleItem has the corresponding modifier flag. Modifier representation lives on `SaleItem.instructions Json?` (already exists at <ref_snippet file="C:/Dev/ImboniResto/prisma/schema.prisma" lines="435-435" />).

---

## 9. Risks Specific to Recipes

| ID | Risk | Class | Mitigation |
|---|---|---|---|
| RR1 | Recipe drift: cook deviates from spec, system shows wrong stock | 🟡 | Variance reports (consumed vs sold actuals) — see <ref_file file="C:/Dev/ImboniResto/CONSUMPTION_AUDIT_ARCHITECTURE.md" />. |
| RR2 | Unit mismatch (recipe in g, inventory in kg) | 🟠 | Reuse `UnitNormalizationService`; reject publish if any ingredient cannot normalize. |
| RR3 | Cyclical sub-recipes | 🟡 | Service-level cycle detection on publish. Hard fail. |
| RR4 | Stale `costCentsCached` after big supplier price jump | 🟡 | Mark-and-sweep + nightly cron. |
| RR5 | Modifier engine misses a "no cheese" → over-deducts | 🟠 | Modifier-aware engine reads `SaleItem.instructions` and skips `isOptional` ingredients flagged off. Tested with explicit cases. |
| RR6 | Owner publishes recipe with `quantity=0` accidentally | 🟢 | Validation on publish: positive quantity required. |

---

## 10. Verdict on Recipe Engine

The model is **four small additive tables plus three nullable columns** on existing models. It is the minimum schema that:

- Reflects real kitchen reality (yields, modifiers, sub-recipes).
- Supports every restaurant segment ImboniServe targets (restaurant, café, bar, bakery, cloud kitchen, hotel) without redesign.
- Preserves immutable consumption history through recipe versioning.
- Stays out of `MenuItem.ingredients String[]` (allergens display) and `InventoryUpdate` (existing audit) — no overlap, no rewrite.
- Plugs into the existing state machine, idempotency framework, and plugin event bus.

It is a **net-new addition with zero migration risk** to existing code paths.
