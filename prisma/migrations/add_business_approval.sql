-- Add business approval fields to Business (Restaurant) table
-- Migration: add_business_approval
-- Date: 2026-04-26

ALTER TABLE "Restaurant" 
ADD COLUMN IF NOT EXISTS "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS "approvedBy" TEXT,
ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT,
ADD COLUMN IF NOT EXISTS "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
ADD COLUMN IF NOT EXISTS "duplicateFlags" JSONB;

-- Create index for faster approval queue queries
CREATE INDEX IF NOT EXISTS "Restaurant_approvalStatus_riskLevel_idx" 
ON "Restaurant"("approvalStatus", "riskLevel");

-- Auto-approve existing businesses (grandfather clause)
UPDATE "Restaurant" 
SET "approvalStatus" = 'APPROVED',
    "approvedAt" = NOW()
WHERE "approvalStatus" = 'PENDING' 
  AND "createdAt" < NOW();

-- Add comment
COMMENT ON COLUMN "Restaurant"."approvalStatus" IS 'Business approval status: PENDING, APPROVED, REJECTED, NEEDS_INFO';
COMMENT ON COLUMN "Restaurant"."riskLevel" IS 'Risk assessment: LOW, MEDIUM, HIGH';
COMMENT ON COLUMN "Restaurant"."duplicateFlags" IS 'JSON array of detected duplicate patterns';
