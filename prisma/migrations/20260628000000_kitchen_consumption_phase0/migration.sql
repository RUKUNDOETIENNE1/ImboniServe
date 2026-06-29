-- Kitchen Consumption Engine Phase 0 Migration
-- Additive schema changes only - zero destructive operations

-- ============================================
-- 1. Add columns to existing tables
-- ============================================

-- MenuItem: Add recipeId (unique, optional FK to Recipe)
ALTER TABLE "MenuItem" ADD COLUMN "recipeId" TEXT;
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_recipeId_key" UNIQUE ("recipeId");

-- SaleItem: Add consumptionState
ALTER TABLE "SaleItem" ADD COLUMN "consumptionState" TEXT DEFAULT 'PENDING';

-- InventoryItem: Add costingMethod
ALTER TABLE "InventoryItem" ADD COLUMN "costingMethod" TEXT NOT NULL DEFAULT 'WAVG';

-- Business (Restaurant): Add inventoryDefaultCostingMethod
ALTER TABLE "Restaurant" ADD COLUMN "inventoryDefaultCostingMethod" TEXT NOT NULL DEFAULT 'WAVG';

-- ============================================
-- 2. Create new tables
-- ============================================

-- Recipe table
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "yieldQuantity" DOUBLE PRECISION NOT NULL,
    "yieldUnit" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "costCentsCached" INTEGER,
    "costCalculatedAt" TIMESTAMP(3),
    "costStale" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- RecipeIngredient table
CREATE TABLE "RecipeIngredient" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "inventoryItemId" TEXT,
    "subRecipeId" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "yieldFactor" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RecipeIngredient_pkey" PRIMARY KEY ("id")
);

-- InventoryConsumption table
CREATE TABLE "InventoryConsumption" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "saleItemId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "recipeId" TEXT,
    "recipeIngredientId" TEXT,
    "quantityConsumed" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "unitCostAtConsumptionCents" INTEGER NOT NULL,
    "totalCostCents" INTEGER NOT NULL,
    "inventoryUpdateId" TEXT,
    "state" TEXT NOT NULL DEFAULT 'ACTIVE',
    "reversedByConsumptionId" TEXT,
    "reasonCode" TEXT,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryConsumption_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- 3. Create indexes
-- ============================================

-- MenuItem indexes
CREATE INDEX "MenuItem_recipeId_idx" ON "MenuItem"("recipeId");

-- SaleItem indexes
CREATE INDEX "SaleItem_consumptionState_idx" ON "SaleItem"("consumptionState");

-- Recipe indexes
CREATE INDEX "Recipe_businessId_isActive_idx" ON "Recipe"("businessId", "isActive");

-- RecipeIngredient indexes
CREATE INDEX "RecipeIngredient_recipeId_idx" ON "RecipeIngredient"("recipeId");
CREATE INDEX "RecipeIngredient_inventoryItemId_idx" ON "RecipeIngredient"("inventoryItemId");
CREATE INDEX "RecipeIngredient_subRecipeId_idx" ON "RecipeIngredient"("subRecipeId");

-- InventoryConsumption indexes
CREATE INDEX "InventoryConsumption_businessId_createdAt_idx" ON "InventoryConsumption"("businessId", "createdAt");
CREATE INDEX "InventoryConsumption_saleItemId_idx" ON "InventoryConsumption"("saleItemId");
CREATE INDEX "InventoryConsumption_inventoryItemId_createdAt_idx" ON "InventoryConsumption"("inventoryItemId", "createdAt");
CREATE INDEX "InventoryConsumption_recipeId_idx" ON "InventoryConsumption"("recipeId");
CREATE INDEX "InventoryConsumption_state_idx" ON "InventoryConsumption"("state");

-- ============================================
-- 4. Create unique constraints
-- ============================================

-- InventoryConsumption unique constraints
ALTER TABLE "InventoryConsumption" ADD CONSTRAINT "InventoryConsumption_inventoryUpdateId_key" UNIQUE ("inventoryUpdateId");
ALTER TABLE "InventoryConsumption" ADD CONSTRAINT "InventoryConsumption_reversedByConsumptionId_key" UNIQUE ("reversedByConsumptionId");

-- ============================================
-- 5. Create foreign key constraints
-- ============================================

-- MenuItem -> Recipe
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Recipe -> Business
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RecipeIngredient -> Recipe
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RecipeIngredient -> InventoryItem
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RecipeIngredient -> Recipe (sub-recipe)
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_subRecipeId_fkey" FOREIGN KEY ("subRecipeId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- InventoryConsumption -> Business
ALTER TABLE "InventoryConsumption" ADD CONSTRAINT "InventoryConsumption_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- InventoryConsumption -> SaleItem
ALTER TABLE "InventoryConsumption" ADD CONSTRAINT "InventoryConsumption_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "SaleItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- InventoryConsumption -> InventoryItem
ALTER TABLE "InventoryConsumption" ADD CONSTRAINT "InventoryConsumption_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- InventoryConsumption -> Recipe
ALTER TABLE "InventoryConsumption" ADD CONSTRAINT "InventoryConsumption_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- InventoryConsumption -> RecipeIngredient
ALTER TABLE "InventoryConsumption" ADD CONSTRAINT "InventoryConsumption_recipeIngredientId_fkey" FOREIGN KEY ("recipeIngredientId") REFERENCES "RecipeIngredient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- InventoryConsumption -> InventoryUpdate
ALTER TABLE "InventoryConsumption" ADD CONSTRAINT "InventoryConsumption_inventoryUpdateId_fkey" FOREIGN KEY ("inventoryUpdateId") REFERENCES "InventoryUpdate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- InventoryConsumption -> InventoryConsumption (reversal self-reference)
ALTER TABLE "InventoryConsumption" ADD CONSTRAINT "InventoryConsumption_reversedByConsumptionId_fkey" FOREIGN KEY ("reversedByConsumptionId") REFERENCES "InventoryConsumption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================
-- 6. Update TicketEventType enum
-- ============================================

-- Add new enum values for Kitchen Consumption Engine
ALTER TYPE "TicketEventType" ADD VALUE 'INGREDIENTS_CONSUMED';
ALTER TYPE "TicketEventType" ADD VALUE 'CONSUMPTION_REVERSED';
