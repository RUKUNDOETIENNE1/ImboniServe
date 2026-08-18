# Phase 0 Implementation Report

**Date:** 2026-06-28  
**Implementation:** Kitchen Consumption Engine Phase 0 (Schema Migration)  
**Status:** COMPLETE

---

## Executive Summary

Phase 0 of the Kitchen Consumption Engine has been successfully implemented. This phase introduces the additive Prisma schema foundation required for recipe management, ingredient tracking, and inventory consumption auditing.

**Key Results:**
- All new models created successfully
- All existing model extensions added
- All indexes created
- Prisma validation passed
- Prisma client generated successfully
- Application build succeeded
- Zero breaking changes to existing code

---

## Files Changed

### Modified Files

| File | Change Type | Description |
|------|-------------|-------------|
| `prisma/schema.prisma` | Modified | Added Phase 0 schema changes |

### New Files

| File | Description |
|------|-------------|
| `prisma/migrations/20260628000000_kitchen_consumption_phase0/migration.sql` | Phase 0 migration SQL |

---

## Models Added

### 1. Recipe

```prisma
model Recipe {
  id               String    @id @default(cuid())
  businessId       String
  name             String
  yieldQuantity    Float
  yieldUnit        String
  version          Int       @default(1)
  isActive         Boolean   @default(true)
  costCentsCached  Int?
  costCalculatedAt DateTime?
  costStale        Boolean   @default(true)
  notes            String?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  // Relations
  business             Business
  menuItem             MenuItem?
  ingredients          RecipeIngredient[]
  subRecipeUsages      RecipeIngredient[]
  inventoryConsumption InventoryConsumption[]
}
```

**Purpose:** Defines ingredient composition for menu items with versioning and cost caching.

### 2. RecipeIngredient

```prisma
model RecipeIngredient {
  id              String  @id @default(cuid())
  recipeId        String
  inventoryItemId String?
  subRecipeId     String?
  quantity        Float
  unit            String
  yieldFactor     Float   @default(1.0)
  isOptional      Boolean @default(false)
  displayOrder    Int     @default(0)

  // Relations
  recipe               Recipe
  inventoryItem        InventoryItem?
  subRecipe            Recipe?
  inventoryConsumption InventoryConsumption[]
}
```

**Purpose:** Links recipes to inventory items or sub-recipes with quantity and yield tracking.

### 3. InventoryConsumption

```prisma
model InventoryConsumption {
  id                         String   @id @default(cuid())
  businessId                 String
  saleItemId                 String
  inventoryItemId            String
  recipeId                   String?
  recipeIngredientId         String?
  quantityConsumed           Float
  unit                       String
  unitCostAtConsumptionCents Int
  totalCostCents             Int
  inventoryUpdateId          String?  @unique
  state                      String   @default("ACTIVE")
  reversedByConsumptionId    String?  @unique
  reasonCode                 String?
  actorUserId                String?
  createdAt                  DateTime @default(now())

  // Relations
  business         Business
  saleItem         SaleItem
  inventoryItem    InventoryItem
  recipe           Recipe?
  recipeIngredient RecipeIngredient?
  inventoryUpdate  InventoryUpdate?
  reversedBy       InventoryConsumption?
  reversalOf       InventoryConsumption?
}
```

**Purpose:** Audit trail for inventory deductions from sales with reversal support.

---

## Relations Added

### New Relations

| From Model | To Model | Relation Type | Description |
|------------|----------|---------------|-------------|
| MenuItem | Recipe | One-to-One (optional) | Menu item can have one recipe |
| Recipe | Business | Many-to-One | Recipe belongs to a business |
| Recipe | MenuItem | One-to-One (optional) | Back-reference from recipe |
| Recipe | RecipeIngredient | One-to-Many | Recipe has many ingredients |
| RecipeIngredient | Recipe | Many-to-One | Ingredient belongs to recipe |
| RecipeIngredient | InventoryItem | Many-to-One (optional) | Links to inventory item |
| RecipeIngredient | Recipe (subRecipe) | Many-to-One (optional) | Sub-recipe support |
| InventoryConsumption | Business | Many-to-One | Consumption belongs to business |
| InventoryConsumption | SaleItem | Many-to-One | Consumption linked to sale item |
| InventoryConsumption | InventoryItem | Many-to-One | Consumption linked to inventory |
| InventoryConsumption | Recipe | Many-to-One (optional) | Optional recipe reference |
| InventoryConsumption | RecipeIngredient | Many-to-One (optional) | Optional ingredient reference |
| InventoryConsumption | InventoryUpdate | One-to-One (optional) | Links to inventory update |
| InventoryConsumption | InventoryConsumption | Self-reference | Reversal linking |

---

## Indexes Added

### Recipe Indexes

| Index | Columns | Purpose |
|-------|---------|---------|
| `Recipe_businessId_isActive_idx` | `businessId`, `isActive` | Query active recipes by business |

### RecipeIngredient Indexes

| Index | Columns | Purpose |
|-------|---------|---------|
| `RecipeIngredient_recipeId_idx` | `recipeId` | Query ingredients by recipe |
| `RecipeIngredient_inventoryItemId_idx` | `inventoryItemId` | Query ingredients by inventory item |
| `RecipeIngredient_subRecipeId_idx` | `subRecipeId` | Query sub-recipe usages |

### InventoryConsumption Indexes

| Index | Columns | Purpose |
|-------|---------|---------|
| `InventoryConsumption_businessId_createdAt_idx` | `businessId`, `createdAt` | Time-series queries by business |
| `InventoryConsumption_saleItemId_idx` | `saleItemId` | Query consumption by sale item |
| `InventoryConsumption_inventoryItemId_createdAt_idx` | `inventoryItemId`, `createdAt` | Inventory item history |
| `InventoryConsumption_recipeId_idx` | `recipeId` | Query consumption by recipe |
| `InventoryConsumption_state_idx` | `state` | Filter by consumption state |

### Existing Model Indexes

| Model | Index | Columns | Purpose |
|-------|-------|---------|---------|
| MenuItem | `MenuItem_recipeId_idx` | `recipeId` | Query menu items by recipe |
| SaleItem | `SaleItem_consumptionState_idx` | `consumptionState` | Filter by consumption state |

---

## Enums Updated

### TicketEventType

Added values:
- `INGREDIENTS_CONSUMED` - Fired when ingredients are deducted from inventory
- `CONSUMPTION_REVERSED` - Fired when a consumption is reversed

---

## Migration Summary

**Migration Name:** `20260628000000_kitchen_consumption_phase0`

**Migration Type:** Additive only

**Operations:**
1. Add columns to existing tables (MenuItem, SaleItem, InventoryItem, Business)
2. Create new tables (Recipe, RecipeIngredient, InventoryConsumption)
3. Create indexes
4. Create unique constraints
5. Create foreign key constraints
6. Add enum values to TicketEventType

**Zero Destructive Operations:**
- No tables dropped
- No columns removed
- No data deleted
- No constraints removed

---

## Verification Results

| Check | Result |
|-------|--------|
| `npx prisma format` | PASSED |
| `npx prisma validate` | PASSED |
| `npx prisma generate` | PASSED |
| `npm run build` | PASSED |
| Prisma client types generated | VERIFIED |
| New model types present | VERIFIED |
| New field types present | VERIFIED |

---

## Notes

1. **MenuItem.recipeId** is marked as `@unique` to enforce one-to-one relationship with Recipe
2. **Recipe.menuItemId** was removed in favor of the back-reference from MenuItem to avoid bidirectional FK conflicts
3. **InventoryConsumption** has self-referential relation for reversal tracking
4. All new columns have sensible defaults for backward compatibility
5. All foreign keys use appropriate `onDelete` behaviors (CASCADE for ownership, SET NULL for optional references)
