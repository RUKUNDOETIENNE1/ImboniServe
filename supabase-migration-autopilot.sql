-- ========================================
-- AI Procurement Autopilot Migration
-- Run this in Supabase SQL Editor
-- ========================================

-- Step 1: Create SupplierRecommendationLog table
CREATE TABLE IF NOT EXISTS "SupplierRecommendationLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "businessId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "productName" TEXT,
  "action" TEXT NOT NULL,
  "recommendationScore" DOUBLE PRECISION,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "SupplierRecommendationLog_businessId_fkey" 
    FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupplierRecommendationLog_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupplierRecommendationLog_supplierId_fkey" 
    FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create indexes for SupplierRecommendationLog
CREATE INDEX IF NOT EXISTS "SupplierRecommendationLog_businessId_supplierId_idx" 
  ON "SupplierRecommendationLog"("businessId", "supplierId");

CREATE INDEX IF NOT EXISTS "SupplierRecommendationLog_userId_action_idx" 
  ON "SupplierRecommendationLog"("userId", "action");

CREATE INDEX IF NOT EXISTS "SupplierRecommendationLog_createdAt_idx" 
  ON "SupplierRecommendationLog"("createdAt");

-- Step 2: Create SupplierPerformanceCache table
CREATE TABLE IF NOT EXISTS "SupplierPerformanceCache" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "supplierId" TEXT NOT NULL UNIQUE,
  "avgDeliveryDays" DOUBLE PRECISION,
  "orderCompletionRate" DOUBLE PRECISION,
  "avgRating" DOUBLE PRECISION,
  "totalOrders" INTEGER NOT NULL DEFAULT 0,
  "lastCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "SupplierPerformanceCache_supplierId_fkey" 
    FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create index for SupplierPerformanceCache
CREATE INDEX IF NOT EXISTS "SupplierPerformanceCache_lastCalculated_idx" 
  ON "SupplierPerformanceCache"("lastCalculated");

-- ========================================
-- Verification Queries
-- ========================================

-- Check if tables were created successfully
SELECT 
  'SupplierRecommendationLog' as table_name,
  COUNT(*) as row_count
FROM "SupplierRecommendationLog"
UNION ALL
SELECT 
  'SupplierPerformanceCache' as table_name,
  COUNT(*) as row_count
FROM "SupplierPerformanceCache";

-- ========================================
-- Success!
-- ========================================
-- If you see the verification results above,
-- the migration was successful!
-- 
-- Next steps:
-- 1. Run: npx prisma generate
-- 2. Run: npm run dev
-- 3. Test the autopilot features
-- ========================================
