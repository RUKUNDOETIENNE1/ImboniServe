-- ============================================================
-- PHASE 2: COMPLETE MONETIZATION SYSTEM MIGRATION
-- Copy-paste this entire file into Supabase SQL Editor
-- ============================================================

-- Step 1: Add AI credit tracking to Business
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "aiCreditsUsed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "aiCreditsLimit" INTEGER NOT NULL DEFAULT 20;
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "aiResetDate" TIMESTAMP(3);

-- Step 2: Add feature usage limits to Business
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "qrCodesCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "cmsPostsThisMonth" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "storageUsedBytes" BIGINT NOT NULL DEFAULT 0;

-- Step 3: Add feature limits to Plan
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "aiCreditsMonthly" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "qrCodesLimit" INTEGER;
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "cmsPostsLimit" INTEGER;
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "storageGBLimit" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "siteBuilderIncluded" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "discoveryFeatured" BOOLEAN NOT NULL DEFAULT false;

-- Step 4: Create AI Usage Log table
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

-- Step 5: Create Site Builder Subscription table
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteBuilderSubscription_pkey" PRIMARY KEY ("id")
);

-- Step 6: Create Discovery Subscription table
CREATE TABLE IF NOT EXISTS "DiscoverySubscription" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'FREE',
    "boostedUntil" TIMESTAMP(3),
    "commission" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscoverySubscription_pkey" PRIMARY KEY ("id")
);

-- Step 7: Add unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "SiteBuilderSubscription_businessId_key" ON "SiteBuilderSubscription"("businessId");
CREATE UNIQUE INDEX IF NOT EXISTS "DiscoverySubscription_businessId_key" ON "DiscoverySubscription"("businessId");

-- Step 8: Create indexes for AI Usage Log
CREATE INDEX IF NOT EXISTS "AIUsageLog_businessId_createdAt_idx" ON "AIUsageLog"("businessId", "createdAt");
CREATE INDEX IF NOT EXISTS "AIUsageLog_feature_createdAt_idx" ON "AIUsageLog"("feature", "createdAt");

-- Step 9: Create indexes for subscriptions
CREATE INDEX IF NOT EXISTS "SiteBuilderSubscription_businessId_idx" ON "SiteBuilderSubscription"("businessId");
CREATE INDEX IF NOT EXISTS "DiscoverySubscription_businessId_idx" ON "DiscoverySubscription"("businessId");
CREATE INDEX IF NOT EXISTS "DiscoverySubscription_tier_idx" ON "DiscoverySubscription"("tier");

-- Step 10: Add foreign keys
ALTER TABLE "AIUsageLog" 
  DROP CONSTRAINT IF EXISTS "AIUsageLog_businessId_fkey";
ALTER TABLE "AIUsageLog" 
  ADD CONSTRAINT "AIUsageLog_businessId_fkey" 
  FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SiteBuilderSubscription" 
  DROP CONSTRAINT IF EXISTS "SiteBuilderSubscription_businessId_fkey";
ALTER TABLE "SiteBuilderSubscription" 
  ADD CONSTRAINT "SiteBuilderSubscription_businessId_fkey" 
  FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DiscoverySubscription" 
  DROP CONSTRAINT IF EXISTS "DiscoverySubscription_businessId_fkey";
ALTER TABLE "DiscoverySubscription" 
  ADD CONSTRAINT "DiscoverySubscription_businessId_fkey" 
  FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 11: Initialize AI reset dates for existing businesses
UPDATE "Restaurant" 
SET "aiResetDate" = date_trunc('month', CURRENT_TIMESTAMP + interval '1 month')
WHERE "aiResetDate" IS NULL;

-- Step 12: Create default Site Builder subscriptions for existing businesses
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

-- Step 13: Create default Discovery subscriptions for existing businesses with profiles
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

-- Step 14: Update plan AI credit limits
UPDATE "Plan" SET "aiCreditsMonthly" = 20 WHERE "code" = 'STARTER' OR "code" = 'ESSENTIALS';
UPDATE "Plan" SET "aiCreditsMonthly" = 50 WHERE "code" = 'PROFESSIONAL';
UPDATE "Plan" SET "aiCreditsMonthly" = 100 WHERE "code" = 'GROWTH';
UPDATE "Plan" SET "aiCreditsMonthly" = 200 WHERE "code" = 'BUSINESS';
UPDATE "Plan" SET "aiCreditsMonthly" = 999999 WHERE "code" = 'ENTERPRISE';

-- Step 15: Update plan QR code limits
UPDATE "Plan" SET "qrCodesLimit" = 5 WHERE "code" = 'STARTER' OR "code" = 'ESSENTIALS';
UPDATE "Plan" SET "qrCodesLimit" = 20 WHERE "code" = 'PROFESSIONAL';
UPDATE "Plan" SET "qrCodesLimit" = 50 WHERE "code" = 'GROWTH';
UPDATE "Plan" SET "qrCodesLimit" = NULL WHERE "code" = 'BUSINESS' OR "code" = 'ENTERPRISE';

-- Step 16: Update plan CMS limits
UPDATE "Plan" SET "cmsPostsLimit" = 0 WHERE "code" = 'STARTER' OR "code" = 'ESSENTIALS';
UPDATE "Plan" SET "cmsPostsLimit" = 10 WHERE "code" = 'PROFESSIONAL';
UPDATE "Plan" SET "cmsPostsLimit" = 30 WHERE "code" = 'GROWTH';
UPDATE "Plan" SET "cmsPostsLimit" = NULL WHERE "code" = 'BUSINESS' OR "code" = 'ENTERPRISE';

-- Step 17: Update plan storage limits
UPDATE "Plan" SET "storageGBLimit" = 2 WHERE "code" = 'STARTER' OR "code" = 'ESSENTIALS';
UPDATE "Plan" SET "storageGBLimit" = 5 WHERE "code" = 'PROFESSIONAL';
UPDATE "Plan" SET "storageGBLimit" = 10 WHERE "code" = 'GROWTH';
UPDATE "Plan" SET "storageGBLimit" = 20 WHERE "code" = 'BUSINESS';
UPDATE "Plan" SET "storageGBLimit" = 100 WHERE "code" = 'ENTERPRISE';

-- Step 18: Mark BUSINESS plan as including Site Builder and Discovery Featured
UPDATE "Plan" SET "siteBuilderIncluded" = true, "discoveryFeatured" = true 
WHERE "code" IN ('BUSINESS', 'ENTERPRISE');

-- Step 19: Update plan pricing (Phase 2 structure)
-- ESSENTIALS (new plan)
INSERT INTO "Plan" (
  "id", "name", "code", "description", 
  "priceCents", "annualPriceCents", "currency",
  "aiCreditsMonthly", "qrCodesLimit", "cmsPostsLimit", "storageGBLimit",
  "siteBuilderIncluded", "discoveryFeatured",
  "maxUsers", "maxMenuItems", "whatsappIncluded", "supportLevel", "isActive",
  "features", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  'Essentials',
  'ESSENTIALS',
  'Perfect for small cafés and food stalls getting started',
  1200000, -- 12,000 RWF monthly
  1000000, -- 10,000 RWF monthly when annual (120,000 total)
  'RWF',
  20, -- AI credits
  5,  -- QR codes
  0,  -- CMS posts
  2,  -- Storage GB
  false, -- Site Builder
  false, -- Discovery Featured
  NULL, -- Unlimited users
  100,  -- Menu items
  true, -- WhatsApp included
  'BASIC',
  true, -- Active
  jsonb_build_object(
    'users', 'unlimited',
    'menuItems', 100,
    'qrCodes', 5,
    'aiCredits', 20,
    'siteBuilder', 'preview_only',
    'discovery', 'basic_listing',
    'cms', false,
    'support', 'basic'
  ),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Plan" WHERE "code" = 'ESSENTIALS');

-- Update PROFESSIONAL pricing
UPDATE "Plan" SET 
  "priceCents" = 2500000,      -- 25,000 RWF monthly
  "annualPriceCents" = 2000000, -- 20,000 RWF monthly when annual
  "aiCreditsMonthly" = 50,
  "qrCodesLimit" = 20,
  "cmsPostsLimit" = 10,
  "storageGBLimit" = 5,
  "siteBuilderIncluded" = false,
  "discoveryFeatured" = false,
  "supportLevel" = 'PRIORITY'
WHERE "code" = 'PROFESSIONAL';

-- Update BUSINESS pricing
UPDATE "Plan" SET 
  "priceCents" = 6250000,      -- 62,500 RWF monthly (50,000 annual monthly × 1.25)
  "annualPriceCents" = 5000000, -- 50,000 RWF monthly when annual
  "aiCreditsMonthly" = 200,
  "qrCodesLimit" = NULL,       -- Unlimited
  "cmsPostsLimit" = NULL,      -- Unlimited
  "storageGBLimit" = 20,
  "siteBuilderIncluded" = true, -- INCLUDED
  "discoveryFeatured" = true,   -- INCLUDED
  "supportLevel" = 'DEDICATED'
WHERE "code" = 'BUSINESS';

-- Update ENTERPRISE pricing
UPDATE "Plan" SET 
  "priceCents" = 15000000,      -- 150,000 RWF monthly (REDUCED from 250,000)
  "annualPriceCents" = 12500000, -- 125,000 RWF monthly when annual
  "aiCreditsMonthly" = 999999,   -- Unlimited
  "qrCodesLimit" = NULL,
  "cmsPostsLimit" = NULL,
  "storageGBLimit" = 100,
  "siteBuilderIncluded" = true,
  "discoveryFeatured" = true,
  "supportLevel" = 'ENTERPRISE'
WHERE "code" = 'ENTERPRISE';

-- Step 20: Mark legacy plans as inactive (grandfather existing customers)
UPDATE "Plan" SET "isActive" = false 
WHERE "code" IN ('STARTER', 'GROWTH') 
  AND "isActive" = true;

-- ============================================================
-- VERIFICATION QUERIES (Run these after migration)
-- ============================================================

-- Check new tables exist
SELECT 'AIUsageLog exists' as check_name, COUNT(*) as count FROM "AIUsageLog";
SELECT 'SiteBuilderSubscription exists' as check_name, COUNT(*) as count FROM "SiteBuilderSubscription";
SELECT 'DiscoverySubscription exists' as check_name, COUNT(*) as count FROM "DiscoverySubscription";

-- Check business columns
SELECT 
  "id",
  "name",
  "aiCreditsUsed",
  "aiCreditsLimit",
  "aiResetDate",
  "qrCodesCount",
  "cmsPostsThisMonth",
  "storageUsedBytes"
FROM "Restaurant" 
LIMIT 5;

-- Check plan configuration
SELECT 
  "code",
  "name",
  "priceCents",
  "annualPriceCents",
  "aiCreditsMonthly",
  "qrCodesLimit",
  "cmsPostsLimit",
  "storageGBLimit",
  "siteBuilderIncluded",
  "discoveryFeatured",
  "isActive"
FROM "Plan"
ORDER BY "priceCents" ASC;

-- Check Site Builder subscriptions created
SELECT 
  COUNT(*) as total_site_builder_subs,
  COUNT(CASE WHEN "tier" = 'FREE' THEN 1 END) as free_tier,
  COUNT(CASE WHEN "tier" = 'PRO' THEN 1 END) as pro_tier
FROM "SiteBuilderSubscription";

-- Check Discovery subscriptions created
SELECT 
  COUNT(*) as total_discovery_subs,
  COUNT(CASE WHEN "tier" = 'FREE' THEN 1 END) as free_tier,
  COUNT(CASE WHEN "tier" = 'FEATURED' THEN 1 END) as featured_tier,
  COUNT(CASE WHEN "tier" = 'PREMIUM' THEN 1 END) as premium_tier
FROM "DiscoverySubscription";

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
-- Next steps:
-- 1. Run: npx prisma db pull (to sync schema)
-- 2. Run: npx prisma generate (to generate new types)
-- 3. Run: npm run dev (to test locally)
-- ============================================================
