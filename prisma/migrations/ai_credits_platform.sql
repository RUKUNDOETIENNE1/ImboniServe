-- AI Credits Platform Migration
-- Adds new tables for the AI Credits Platform without affecting existing schema

-- Create enums
DO $$ BEGIN
  CREATE TYPE "AICreditLedgerEntryType" AS ENUM (
    'ALLOCATION',
    'PURCHASE',
    'BONUS',
    'CONSUMPTION',
    'REFUND',
    'RESERVATION',
    'RESERVATION_RELEASE',
    'ADJUSTMENT',
    'EXPIRY'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "AICreditReservationStatus" AS ENUM (
    'PENDING',
    'COMMITTED',
    'RELEASED',
    'EXPIRED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create tables

-- AICreditWallet
CREATE TABLE IF NOT EXISTS "AICreditWallet" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "reservedBalance" INTEGER NOT NULL DEFAULT 0,
    "monthlyAllocation" INTEGER NOT NULL DEFAULT 0,
    "purchasedCredits" INTEGER NOT NULL DEFAULT 0,
    "bonusCredits" INTEGER NOT NULL DEFAULT 0,
    "lifetimeConsumed" INTEGER NOT NULL DEFAULT 0,
    "lifetimePurchased" INTEGER NOT NULL DEFAULT 0,
    "lifetimeAllocated" INTEGER NOT NULL DEFAULT 0,
    "lastRenewalAt" TIMESTAMP(3),
    "nextRenewalAt" TIMESTAMP(3),
    "maxBalance" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AICreditWallet_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on businessId
DO $$ BEGIN
  ALTER TABLE "AICreditWallet" ADD CONSTRAINT "AICreditWallet_businessId_key" UNIQUE ("businessId");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add foreign key (businessId -> Restaurant id)
DO $$ BEGIN
  ALTER TABLE "AICreditWallet" ADD CONSTRAINT "AICreditWallet_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create index on nextRenewalAt
CREATE INDEX IF NOT EXISTS "AICreditWallet_nextRenewalAt_idx" ON "AICreditWallet"("nextRenewalAt");

-- AICreditLedgerEntry
CREATE TABLE IF NOT EXISTS "AICreditLedgerEntry" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "entryType" "AICreditLedgerEntryType" NOT NULL,
    "feature" TEXT,
    "operation" TEXT,
    "credits" INTEGER NOT NULL,
    "balanceBefore" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "requestId" TEXT,
    "userId" TEXT,
    "aiProvider" TEXT,
    "tokensUsed" INTEGER,
    "costUSD" DOUBLE PRECISION,
    "metadata" JSONB,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AICreditLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- Unique constraint on idempotencyKey
DO $$ BEGIN
  ALTER TABLE "AICreditLedgerEntry" ADD CONSTRAINT "AICreditLedgerEntry_idempotencyKey_key" UNIQUE ("idempotencyKey");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Foreign key to AICreditWallet
DO $$ BEGIN
  ALTER TABLE "AICreditLedgerEntry" ADD CONSTRAINT "AICreditLedgerEntry_walletId_fkey"
    FOREIGN KEY ("walletId") REFERENCES "AICreditWallet"("id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "AICreditLedgerEntry_walletId_createdAt_idx" ON "AICreditLedgerEntry"("walletId", "createdAt");
CREATE INDEX IF NOT EXISTS "AICreditLedgerEntry_businessId_createdAt_idx" ON "AICreditLedgerEntry"("businessId", "createdAt");
CREATE INDEX IF NOT EXISTS "AICreditLedgerEntry_entryType_createdAt_idx" ON "AICreditLedgerEntry"("entryType", "createdAt");
CREATE INDEX IF NOT EXISTS "AICreditLedgerEntry_feature_createdAt_idx" ON "AICreditLedgerEntry"("feature", "createdAt");
CREATE INDEX IF NOT EXISTS "AICreditLedgerEntry_requestId_idx" ON "AICreditLedgerEntry"("requestId");

-- AICreditReservation
CREATE TABLE IF NOT EXISTS "AICreditReservation" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "operation" TEXT,
    "creditsReserved" INTEGER NOT NULL,
    "status" "AICreditReservationStatus" NOT NULL DEFAULT 'PENDING',
    "requestId" TEXT NOT NULL,
    "userId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "committedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AICreditReservation_pkey" PRIMARY KEY ("id")
);

-- Unique constraint on requestId
DO $$ BEGIN
  ALTER TABLE "AICreditReservation" ADD CONSTRAINT "AICreditReservation_requestId_key" UNIQUE ("requestId");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Foreign key to AICreditWallet
DO $$ BEGIN
  ALTER TABLE "AICreditReservation" ADD CONSTRAINT "AICreditReservation_walletId_fkey"
    FOREIGN KEY ("walletId") REFERENCES "AICreditWallet"("id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "AICreditReservation_walletId_status_idx" ON "AICreditReservation"("walletId", "status");
CREATE INDEX IF NOT EXISTS "AICreditReservation_businessId_status_idx" ON "AICreditReservation"("businessId", "status");
CREATE INDEX IF NOT EXISTS "AICreditReservation_status_expiresAt_idx" ON "AICreditReservation"("status", "expiresAt");
CREATE INDEX IF NOT EXISTS "AICreditReservation_feature_idx" ON "AICreditReservation"("feature");

-- AIFeatureCost
CREATE TABLE IF NOT EXISTS "AIFeatureCost" (
    "id" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "featureName" TEXT NOT NULL,
    "description" TEXT,
    "creditsCost" INTEGER NOT NULL DEFAULT 1,
    "isDynamic" BOOLEAN NOT NULL DEFAULT false,
    "minCredits" INTEGER,
    "maxCredits" INTEGER,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIFeatureCost_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "AIFeatureCost" ADD CONSTRAINT "AIFeatureCost_featureKey_key" UNIQUE ("featureKey");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "AIFeatureCost_category_idx" ON "AIFeatureCost"("category");
CREATE INDEX IF NOT EXISTS "AIFeatureCost_isActive_idx" ON "AIFeatureCost"("isActive");

-- AICreditPackage
CREATE TABLE IF NOT EXISTS "AICreditPackage" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "credits" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RWF',
    "bonusCredits" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AICreditPackage_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "AICreditPackage" ADD CONSTRAINT "AICreditPackage_code_key" UNIQUE ("code");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "AICreditPackage_isActive_sortOrder_idx" ON "AICreditPackage"("isActive", "sortOrder");

-- AICreditPolicy
CREATE TABLE IF NOT EXISTS "AICreditPolicy" (
    "id" TEXT NOT NULL,
    "policyKey" TEXT NOT NULL,
    "policyName" TEXT NOT NULL,
    "description" TEXT,
    "value" TEXT NOT NULL,
    "dataType" TEXT NOT NULL DEFAULT 'string',
    "appliesTo" TEXT NOT NULL DEFAULT 'all',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AICreditPolicy_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "AICreditPolicy" ADD CONSTRAINT "AICreditPolicy_policyKey_key" UNIQUE ("policyKey");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "AICreditPolicy_policyKey_idx" ON "AICreditPolicy"("policyKey");
CREATE INDEX IF NOT EXISTS "AICreditPolicy_appliesTo_isActive_idx" ON "AICreditPolicy"("appliesTo", "isActive");
