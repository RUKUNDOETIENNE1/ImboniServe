-- Migration: Rename restaurantId to businessId in raw SQL tables
-- Date: 2026-02-16
-- Description: Updates CostAnomalyAlert and ReorderSuggestionLog tables to use businessId

-- Step 1: Rename column in CostAnomalyAlert table
ALTER TABLE "CostAnomalyAlert" RENAME COLUMN "restaurantId" TO "businessId";

-- Step 2: Rename column in ReorderSuggestionLog table
ALTER TABLE "ReorderSuggestionLog" RENAME COLUMN "restaurantId" TO "businessId";

-- Step 3: Rename column in SlipTemplate table (Prisma-managed)
ALTER TABLE "SlipTemplate" RENAME COLUMN "restaurantId" TO "businessId";

-- Step 4: Rename column in FeeConfiguration table (Prisma-managed)
ALTER TABLE "FeeConfiguration" RENAME COLUMN "restaurantId" TO "businessId";

-- Migration complete!
-- Note: These are the final tables to be migrated from restaurantId to businessId
