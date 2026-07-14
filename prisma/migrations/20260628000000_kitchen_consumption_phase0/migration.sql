-- Kitchen Consumption Phase 0: Recipe and Inventory Consumption Tracking
-- Applied to production on 2026-07-08

-- Recipe table for menu item recipes
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

-- Recipe ingredients linking recipes to inventory items or sub-recipes
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

-- Inventory consumption tracking for sales
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
    "state" TEXT NOT NULL DEFAULT 'PENDING',
    "reversedByConsumptionId" TEXT,
    "reasonCode" TEXT,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryConsumption_pkey" PRIMARY KEY ("id")
);

-- Indexes for Recipe
CREATE INDEX "Recipe_businessId_idx" ON "Recipe"("businessId");
CREATE INDEX "Recipe_businessId_isActive_idx" ON "Recipe"("businessId", "isActive");

-- Indexes for RecipeIngredient
CREATE INDEX "RecipeIngredient_recipeId_idx" ON "RecipeIngredient"("recipeId");
CREATE INDEX "RecipeIngredient_inventoryItemId_idx" ON "RecipeIngredient"("inventoryItemId");
CREATE INDEX "RecipeIngredient_subRecipeId_idx" ON "RecipeIngredient"("subRecipeId");

-- Indexes for InventoryConsumption
CREATE INDEX "InventoryConsumption_businessId_idx" ON "InventoryConsumption"("businessId");
CREATE INDEX "InventoryConsumption_saleItemId_idx" ON "InventoryConsumption"("saleItemId");
CREATE INDEX "InventoryConsumption_inventoryItemId_idx" ON "InventoryConsumption"("inventoryItemId");
CREATE INDEX "InventoryConsumption_recipeId_idx" ON "InventoryConsumption"("recipeId");
CREATE INDEX "InventoryConsumption_state_idx" ON "InventoryConsumption"("state");

-- Foreign keys for RecipeIngredient
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_recipeId_fkey" 
    FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_inventoryItemId_fkey" 
    FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_subRecipeId_fkey" 
    FOREIGN KEY ("subRecipeId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Foreign keys for InventoryConsumption
ALTER TABLE "InventoryConsumption" ADD CONSTRAINT "InventoryConsumption_businessId_fkey" 
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryConsumption" ADD CONSTRAINT "InventoryConsumption_saleItemId_fkey" 
    FOREIGN KEY ("saleItemId") REFERENCES "SaleItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryConsumption" ADD CONSTRAINT "InventoryConsumption_inventoryItemId_fkey" 
    FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryConsumption" ADD CONSTRAINT "InventoryConsumption_recipeId_fkey" 
    FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InventoryConsumption" ADD CONSTRAINT "InventoryConsumption_recipeIngredientId_fkey" 
    FOREIGN KEY ("recipeIngredientId") REFERENCES "RecipeIngredient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Enable Row Level Security
ALTER TABLE "Recipe" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RecipeIngredient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InventoryConsumption" ENABLE ROW LEVEL SECURITY;
