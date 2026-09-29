-- Migration: ESSENTIALS → STARTER
-- Date: 2026-07-03
-- Purpose: Align database with Commercial Constitution v1.1
-- Milestone: 2 (Commercial Enforcement - Backend)

-- IMPORTANT: This migration should be executed during off-peak hours
-- IMPORTANT: Database backup should be created before execution

BEGIN;

-- Step 1: Update Plan table (rename ESSENTIALS → STARTER)
UPDATE "Plan"
SET 
  code = 'STARTER',
  name = 'Starter',
  "updatedAt" = NOW()
WHERE code = 'ESSENTIALS';

-- Step 2: Verify Plan update
DO $$
DECLARE
  essentials_count INTEGER;
  starter_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO essentials_count FROM "Plan" WHERE code = 'ESSENTIALS';
  SELECT COUNT(*) INTO starter_count FROM "Plan" WHERE code = 'STARTER';
  
  IF essentials_count > 0 THEN
    RAISE EXCEPTION 'Migration failed: ESSENTIALS plans still exist (count: %)', essentials_count;
  END IF;
  
  IF starter_count = 0 THEN
    RAISE EXCEPTION 'Migration failed: No STARTER plan found after migration';
  END IF;
  
  RAISE NOTICE 'Plan migration successful: % STARTER plan(s) exist', starter_count;
END $$;

-- Step 3: Update any references in Business table (if plan code is stored there)
-- Note: Based on schema, Business has planId (foreign key), not planCode
-- So no update needed in Business table

-- Step 4: Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: ESSENTIALS → STARTER';
  RAISE NOTICE 'Timestamp: %', NOW();
END $$;

COMMIT;

-- Verification queries (run after migration):
-- SELECT code, name, COUNT(*) as count FROM "Plan" GROUP BY code, name;
-- SELECT p.code, COUNT(b.id) as business_count FROM "Plan" p LEFT JOIN "Business" b ON p.id = b."planId" GROUP BY p.code;
