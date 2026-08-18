-- Phase 2A: AI Credits, Storage Limits, and Subscription Models

-- Add AI credit tracking to Business
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "aiCreditsUsed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "aiCreditsLimit" INTEGER NOT NULL DEFAULT 20;
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "aiResetDate" TIMESTAMP(3);

-- Add feature usage limits to Business
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "qrCodesCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "cmsPostsThisMonth" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "storageUsedBytes" BIGINT NOT NULL DEFAULT 0;

-- Add feature limits to Plan
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "aiCreditsMonthly" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "qrCodesLimit" INTEGER;
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "cmsPostsLimit" INTEGER;
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "storageGBLimit" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "siteBuilderIncluded" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "discoveryFeatured" BOOLEAN NOT NULL DEFAULT false;

-- Create AI Usage Log table
CREATE TABLE IF NOT EXISTS "AIUsageLog" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "creditsUsed" INTEGER NOT NULL,
    "tokensUsed" INTEGER,
    "costUSD" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIUsageLog_pkey" PRIMARY KEY ("id")
);

-- Create Site Builder Subscription table
CREATE TABLE IF NOT EXISTS "SiteBuilderSubscription" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'FREE',
    "customDomain" TEXT,
    "customDomainActive" BOOLEAN NOT NULL DEFAULT false,
    "aiGenerationsUsed" INTEGER NOT NULL DEFAULT 0,
    "aiGenerationsLimit" INTEGER NOT NULL DEFAULT 3,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteBuilderSubscription_pkey" PRIMARY KEY ("id")
);

-- Create Discovery Subscription table
CREATE TABLE IF NOT EXISTS "DiscoverySubscription" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'FREE',
    "boostedUntil" TIMESTAMP(3),
    "commission" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscoverySubscription_pkey" PRIMARY KEY ("id")
);

-- Add unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "SiteBuilderSubscription_businessId_key" ON "SiteBuilderSubscription"("businessId");
CREATE UNIQUE INDEX IF NOT EXISTS "DiscoverySubscription_businessId_key" ON "DiscoverySubscription"("businessId");

-- Create indexes for AI Usage Log
CREATE INDEX IF NOT EXISTS "AIUsageLog_businessId_createdAt_idx" ON "AIUsageLog"("businessId", "createdAt");
CREATE INDEX IF NOT EXISTS "AIUsageLog_feature_createdAt_idx" ON "AIUsageLog"("feature", "createdAt");

-- Create indexes for subscriptions
CREATE INDEX IF NOT EXISTS "SiteBuilderSubscription_businessId_idx" ON "SiteBuilderSubscription"("businessId");
CREATE INDEX IF NOT EXISTS "DiscoverySubscription_businessId_idx" ON "DiscoverySubscription"("businessId");
CREATE INDEX IF NOT EXISTS "DiscoverySubscription_tier_idx" ON "DiscoverySubscription"("tier");

-- Add foreign keys
DO $$ BEGIN
  ALTER TABLE "AIUsageLog" ADD CONSTRAINT "AIUsageLog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "SiteBuilderSubscription" ADD CONSTRAINT "SiteBuilderSubscription_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "DiscoverySubscription" ADD CONSTRAINT "DiscoverySubscription_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Update existing businesses to have reset date (1st of next month)
UPDATE "Restaurant" SET "aiResetDate" = date_trunc('month', CURRENT_TIMESTAMP + interval '1 month');

-- Create default Site Builder subscription for existing businesses
INSERT INTO "SiteBuilderSubscription" ("id", "businessId", "tier", "isPublished", "createdAt", "updatedAt")
SELECT 
  'sb_' || "id",
  "id",
  'FREE',
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Restaurant"
ON CONFLICT ("businessId") DO NOTHING;

-- Create default Discovery subscription for existing businesses with profiles
INSERT INTO "DiscoverySubscription" ("id", "businessId", "tier", "commission", "createdAt", "updatedAt")
SELECT 
  'ds_' || bp."businessId",
  bp."businessId",
  'FREE',
  10.0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "BusinessProfile" bp
ON CONFLICT ("businessId") DO NOTHING;
