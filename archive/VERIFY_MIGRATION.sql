-- ========================================
-- Quick Verification Query
-- Run this in Supabase SQL Editor to confirm migration success
-- ========================================

-- 1. Check if all 3 tables exist
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('OptimizationRecommendation', 'OptimizationAction', 'OptimizationOutcome')
ORDER BY table_name;

-- Expected result: 3 rows showing all tables with their column counts

-- 2. Check indexes were created
SELECT 
    tablename,
    indexname
FROM pg_indexes 
WHERE tablename LIKE 'Optimization%'
ORDER BY tablename, indexname;

-- Expected result: 7 indexes total

-- 3. Check foreign key constraints
SELECT
    tc.table_name, 
    tc.constraint_name,
    ccu.table_name AS references_table
FROM information_schema.table_constraints AS tc 
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name LIKE 'Optimization%'
ORDER BY tc.table_name;

-- Expected result: 4 foreign keys
-- - OptimizationRecommendation → Restaurant (businessId)
-- - OptimizationAction → OptimizationRecommendation (recommendationId)
-- - OptimizationOutcome → Restaurant (businessId)
-- - OptimizationOutcome → OptimizationRecommendation (recommendationId)

-- ========================================
-- If all queries return expected results, migration is SUCCESSFUL! ✅
-- ========================================
