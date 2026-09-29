-- Kitchen Consumption Engine Phase 0 Migration
-- Run this in Supabase SQL Editor

BEGIN;

-- ============================================
-- 1. Add columns to existing tables
-- ============================================

-- MenuItem: Add recipeId (unique, optional FK to Recipe)
ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "recipeId" TEXT;

-- SaleItem: Add consumptionState
ALTER TABLE "SaleItem" ADD COLUMN IF NOT EXISTS "consumptionState" TEXT DEFAULT 'PENDING';

-- InventoryItem: Add costingMethod
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "costingMethod" TEXT NOT NULL DEFAULT 'WAVG';

-- Business (Restaurant): Add inventoryDefaultCostingMethod
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "inventoryDefaultCostingMethod" TEXT NOT NULL DEFAULT 'WAVG';

-- ============================================
-- 2. Create new tables
-- ============================================

-- Recipe table
CREATE TABLE IF NOT EXISTS "Recipe" (
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
CREATE TABLE IF NOT EXISTS "RecipeIngredient" (
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
CREATE TABLE IF NOT EXISTS "InventoryConsumption" (
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
CREATE INDEX IF NOT EXISTS "MenuItem_recipeId_idx" ON "MenuItem"("recipeId");

-- SaleItem indexes
CREATE INDEX IF NOT EXISTS "SaleItem_consumptionState_idx" ON "SaleItem"("consumptionState");

-- Recipe indexes
CREATE INDEX IF NOT EXISTS "Recipe_businessId_isActive_idx" ON "Recipe"("businessId", "isActive");

-- RecipeIngredient indexes
CREATE INDEX IF NOT EXISTS "RecipeIngredient_recipeId_idx" ON "RecipeIngredient"("recipeId");
CREATE INDEX IF NOT EXISTS "RecipeIngredient_inventoryItemId_idx" ON "RecipeIngredient"("inventoryItemId");
CREATE INDEX IF NOT EXISTS "RecipeIngredient_subRecipeId_idx" ON "RecipeIngredient"("subRecipeId");

-- InventoryConsumption indexes
CREATE INDEX IF NOT EXISTS "InventoryConsumption_businessId_createdAt_idx" ON "InventoryConsumption"("businessId", "createdAt");
CREATE INDEX IF NOT EXISTS "InventoryConsumption_saleItemId_idx" ON "InventoryConsumption"("saleItemId");
CREATE INDEX IF NOT EXISTS "InventoryConsumption_inventoryItemId_createdAt_idx" ON "InventoryConsumption"("inventoryItemId", "createdAt");
CREATE INDEX IF NOT EXISTS "InventoryConsumption_recipeId_idx" ON "InventoryConsumption"("recipeId");
CREATE INDEX IF NOT EXISTS "InventoryConsumption_state_idx" ON "InventoryConsumption"("state");

-- ============================================
-- 4. Create unique constraints
-- ============================================

-- MenuItem unique constraint
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'MenuItem_recipeId_key'
    ) THEN
        ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_recipeId_key" UNIQUE ("recipeId");
    END IF;
END $$;

-- InventoryConsumption unique constraints
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'InventoryConsumption_inventoryUpdateId_key'
    ) THEN
        ALTER TABLE "InventoryConsumption" ADD CONSTRAINT "InventoryConsumption_inventoryUpdateId_key" UNIQUE ("inventoryUpdateId");
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'InventoryConsumption_reversedByConsumptionId_key'
    ) THEN
        ALTER TABLE "InventoryConsumption" ADD CONSTRAINT "InventoryConsumption_reversedByConsumptionId_key" UNIQUE ("reversedByConsumptionId");
    END IF;
END $$;

-- ============================================
-- 5. Create foreign key constraints
-- ============================================

-- MenuItem -> Recipe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'MenuItem_recipeId_fkey'
    ) THEN
        ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Recipe -> Business
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Recipe_businessId_fkey'
    ) THEN
        ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- RecipeIngredient -> Recipe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'RecipeIngredient_recipeId_fkey'
    ) THEN
        ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- RecipeIngredient -> InventoryItem
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'RecipeIngredient_inventoryItemId_fkey'
    ) THEN
        ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- RecipeIngredient -> Recipe (sub-recipe)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'RecipeIngredient_subRecipeId_fkey'
    ) THEN
        ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_subRecipeId_fkey" FOREIGN KEY ("subRecipeId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- InventoryConsumption -> Business
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'InventoryConsumption_businessId_fkey'
    ) THEN
        ALTER TABLE "InventoryConsumption" ADD CONSTRAINT "InventoryConsumption_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- InventoryConsumption -> SaleItem
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'InventoryConsumption_saleItemId_fkey'
    ) THEN
        ALTER TABLE "InventoryConsumption" ADD CONSTRAINT "InventoryConsumption_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "SaleItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- InventoryConsumption -> InventoryItem
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'InventoryConsumption_inventoryItemId_fkey'
    ) THEN
        ALTER TABLE "InventoryConsumption" ADD CONSTRAINT "InventoryConsumption_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- InventoryConsumption -> Recipe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'InventoryConsumption_recipeId_fkey'
    ) THEN
        ALTER TABLE "InventoryConsumption" ADD CONSTRAINT "InventoryConsumption_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- InventoryConsumption -> RecipeIngredient
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'InventoryConsumption_recipeIngredientId_fkey'
    ) THEN
        ALTER TABLE "InventoryConsumption" ADD CONSTRAINT "InventoryConsumption_recipeIngredientId_fkey" FOREIGN KEY ("recipeIngredientId") REFERENCES "RecipeIngredient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- InventoryConsumption -> InventoryUpdate
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'InventoryConsumption_inventoryUpdateId_fkey'
    ) THEN
        ALTER TABLE "InventoryConsumption" ADD CONSTRAINT "InventoryConsumption_inventoryUpdateId_fkey" FOREIGN KEY ("inventoryUpdateId") REFERENCES "InventoryUpdate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- InventoryConsumption -> InventoryConsumption (reversal self-reference)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'InventoryConsumption_reversedByConsumptionId_fkey'
    ) THEN
        ALTER TABLE "InventoryConsumption" ADD CONSTRAINT "InventoryConsumption_reversedByConsumptionId_fkey" FOREIGN KEY ("reversedByConsumptionId") REFERENCES "InventoryConsumption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- ============================================
-- 6. Update TicketEventType enum
-- ============================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'INGREDIENTS_CONSUMED' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'TicketEventType')
    ) THEN
        ALTER TYPE "TicketEventType" ADD VALUE 'INGREDIENTS_CONSUMED';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'CONSUMPTION_REVERSED' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'TicketEventType')
    ) THEN
        ALTER TYPE "TicketEventType" ADD VALUE 'CONSUMPTION_REVERSED';
    END IF;
END $$;

-- ============================================
-- 7. Record migration in _prisma_migrations
-- ============================================

INSERT INTO "_prisma_migrations" (
    "id",
    "checksum",
    "finished_at",
    "migration_name",
    "logs",
    "rolled_back_at",
    "started_at",
    "applied_steps_count"
) VALUES (
    gen_random_uuid()::text,
    '0',
    NOW(),
    '20260628000000_kitchen_consumption_phase0',
    NULL,
    NULL,
    NOW(),
    1
);

COMMIT;
