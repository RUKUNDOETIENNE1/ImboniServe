-- ========================================
-- Optimization Memory System Migration
-- Backup SQL for manual execution if needed
-- ========================================

-- Table 1: OptimizationRecommendation
CREATE TABLE IF NOT EXISTS "OptimizationRecommendation" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "estimatedImpact" TEXT,
    "effort" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "dismissedReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,

    CONSTRAINT "OptimizationRecommendation_pkey" PRIMARY KEY ("id")
);

-- Table 2: OptimizationAction
CREATE TABLE IF NOT EXISTS "OptimizationAction" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "beforeState" JSONB,
    "afterState" JSONB,
    "executedBy" TEXT,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isReversible" BOOLEAN NOT NULL DEFAULT true,
    "reversedAt" TIMESTAMP(3),
    "reversedBy" TEXT,
    "metadata" JSONB,

    CONSTRAINT "OptimizationAction_pkey" PRIMARY KEY ("id")
);

-- Table 3: OptimizationOutcome
CREATE TABLE IF NOT EXISTS "OptimizationOutcome" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "beforeValue" DOUBLE PRECISION,
    "afterValue" DOUBLE PRECISION,
    "changePercent" DOUBLE PRECISION,
    "measurementPeriod" TEXT NOT NULL,
    "measuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "OptimizationOutcome_pkey" PRIMARY KEY ("id")
);

-- Foreign Keys
ALTER TABLE "OptimizationRecommendation" 
    ADD CONSTRAINT "OptimizationRecommendation_businessId_fkey" 
    FOREIGN KEY ("businessId") 
    REFERENCES "Restaurant"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;

ALTER TABLE "OptimizationAction" 
    ADD CONSTRAINT "OptimizationAction_recommendationId_fkey" 
    FOREIGN KEY ("recommendationId") 
    REFERENCES "OptimizationRecommendation"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;

ALTER TABLE "OptimizationOutcome" 
    ADD CONSTRAINT "OptimizationOutcome_businessId_fkey" 
    FOREIGN KEY ("businessId") 
    REFERENCES "Restaurant"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;

ALTER TABLE "OptimizationOutcome" 
    ADD CONSTRAINT "OptimizationOutcome_recommendationId_fkey" 
    FOREIGN KEY ("recommendationId") 
    REFERENCES "OptimizationRecommendation"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;

-- Indexes for OptimizationRecommendation
CREATE INDEX IF NOT EXISTS "OptimizationRecommendation_businessId_status_createdAt_idx" 
    ON "OptimizationRecommendation"("businessId", "status", "createdAt");

CREATE INDEX IF NOT EXISTS "OptimizationRecommendation_source_category_idx" 
    ON "OptimizationRecommendation"("source", "category");

CREATE INDEX IF NOT EXISTS "OptimizationRecommendation_priority_status_idx" 
    ON "OptimizationRecommendation"("priority", "status");

-- Indexes for OptimizationAction
CREATE INDEX IF NOT EXISTS "OptimizationAction_recommendationId_executedAt_idx" 
    ON "OptimizationAction"("recommendationId", "executedAt");

CREATE INDEX IF NOT EXISTS "OptimizationAction_actionType_idx" 
    ON "OptimizationAction"("actionType");

-- Indexes for OptimizationOutcome
CREATE INDEX IF NOT EXISTS "OptimizationOutcome_recommendationId_measuredAt_idx" 
    ON "OptimizationOutcome"("recommendationId", "measuredAt");

CREATE INDEX IF NOT EXISTS "OptimizationOutcome_businessId_metricType_idx" 
    ON "OptimizationOutcome"("businessId", "metricType");

-- ========================================
-- Verification Queries
-- ========================================

-- Check tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'Optimization%';

-- Check indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename LIKE 'Optimization%';

-- Check foreign keys
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name LIKE 'Optimization%';
