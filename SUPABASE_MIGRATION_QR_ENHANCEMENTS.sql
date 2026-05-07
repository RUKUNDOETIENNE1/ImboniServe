-- ============================================================
-- QR ORDERING ENHANCEMENTS MIGRATION
-- ============================================================
-- This migration adds:
-- 1. Waiter Call System
-- 2. Add-to-Order Support
-- 3. Enhanced Event Tracking
-- ============================================================

-- Step 1: Create WaiterCall table for service requests
CREATE TABLE IF NOT EXISTS "WaiterCall" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tableId" TEXT NOT NULL,
  "sessionId" TEXT,
  "businessId" TEXT NOT NULL,
  "reason" TEXT NOT NULL, -- 'water', 'assistance', 'bill', 'other'
  "customMessage" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'acknowledged', 'resolved'
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "acknowledgedAt" TIMESTAMP(3),
  "acknowledgedBy" TEXT, -- Staff user ID
  "resolvedAt" TIMESTAMP(3),
  "resolvedBy" TEXT, -- Staff user ID
  "priority" INTEGER DEFAULT 1, -- 1=normal, 2=urgent
  
  CONSTRAINT "WaiterCall_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE CASCADE,
  CONSTRAINT "WaiterCall_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TableSession"("id") ON DELETE SET NULL,
  CONSTRAINT "WaiterCall_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE
);

-- Step 2: Create indexes for WaiterCall
CREATE INDEX IF NOT EXISTS "WaiterCall_tableId_status_idx" ON "WaiterCall"("tableId", "status");
CREATE INDEX IF NOT EXISTS "WaiterCall_businessId_status_idx" ON "WaiterCall"("businessId", "status");
CREATE INDEX IF NOT EXISTS "WaiterCall_createdAt_idx" ON "WaiterCall"("createdAt");
CREATE INDEX IF NOT EXISTS "WaiterCall_status_createdAt_idx" ON "WaiterCall"("status", "createdAt");

-- Step 3: Add Add-to-Order support to Sale table
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "isAddon" BOOLEAN DEFAULT false;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "parentOrderId" TEXT;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "addedAt" TIMESTAMP(3);

-- Step 4: Create indexes for addon orders
CREATE INDEX IF NOT EXISTS "Sale_parentOrderId_idx" ON "Sale"("parentOrderId");
CREATE INDEX IF NOT EXISTS "Sale_isAddon_idx" ON "Sale"("isAddon");
CREATE INDEX IF NOT EXISTS "Sale_businessId_isAddon_idx" ON "Sale"("businessId", "isAddon");

-- Step 5: Add foreign key for parentOrderId
ALTER TABLE "Sale" 
  DROP CONSTRAINT IF EXISTS "Sale_parentOrderId_fkey";
ALTER TABLE "Sale" 
  ADD CONSTRAINT "Sale_parentOrderId_fkey" 
  FOREIGN KEY ("parentOrderId") REFERENCES "Sale"("id") ON DELETE SET NULL;

-- Step 6: Enhance EventLog for network tracking
ALTER TABLE "EventLog" ADD COLUMN IF NOT EXISTS "networkStatus" TEXT; -- 'online', 'offline', 'slow'
CREATE INDEX IF NOT EXISTS "EventLog_type_createdAt_idx" ON "EventLog"("type", "createdAt");
CREATE INDEX IF NOT EXISTS "EventLog_networkStatus_idx" ON "EventLog"("networkStatus");

-- Step 7: Add outbox support for waiter calls
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "syncedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Sale_syncedAt_idx" ON "Sale"("syncedAt");

-- ============================================================
-- VERIFICATION QUERIES (Run these after migration)
-- ============================================================

-- Check WaiterCall table exists
SELECT 'WaiterCall table exists' as check_name, COUNT(*) as count FROM "WaiterCall";

-- Check Sale table has new columns
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'Sale' 
  AND column_name IN ('isAddon', 'parentOrderId', 'addedAt', 'syncedAt');

-- Check EventLog has networkStatus
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'EventLog' 
  AND column_name = 'networkStatus';

-- Check indexes created
SELECT 
  indexname, 
  tablename 
FROM pg_indexes 
WHERE tablename IN ('WaiterCall', 'Sale', 'EventLog')
  AND indexname LIKE '%Call%' OR indexname LIKE '%addon%' OR indexname LIKE '%network%'
ORDER BY tablename, indexname;

-- ============================================================
-- SAMPLE QUERIES FOR ANALYTICS
-- ============================================================

-- Most frequent waiter call reasons
-- SELECT 
--   "reason",
--   COUNT(*) as frequency,
--   AVG(EXTRACT(EPOCH FROM ("acknowledgedAt" - "createdAt"))) as avg_response_seconds
-- FROM "WaiterCall"
-- WHERE "acknowledgedAt" IS NOT NULL
-- GROUP BY "reason"
-- ORDER BY frequency DESC;

-- Tables with most add-on orders
-- SELECT 
--   t."number" as table_number,
--   COUNT(s.id) as addon_count,
--   SUM(s."totalCents") as addon_revenue
-- FROM "Sale" s
-- JOIN "Table" t ON s."tableId" = t."id"
-- WHERE s."isAddon" = true
-- GROUP BY t."id", t."number"
-- ORDER BY addon_count DESC
-- LIMIT 10;

-- Average time between original order and add-ons
-- SELECT 
--   AVG(EXTRACT(EPOCH FROM (addon."createdAt" - original."createdAt")) / 60) as avg_minutes
-- FROM "Sale" addon
-- JOIN "Sale" original ON addon."parentOrderId" = original."id"
-- WHERE addon."isAddon" = true;

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
