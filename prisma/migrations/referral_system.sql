-- ============================================
-- REFERRAL & REWARDS SYSTEM - DATABASE MIGRATION
-- ============================================
-- Run this in Supabase SQL Editor
-- This creates all tables for the referral system

-- Table 1: ReferralClick - Track every referral link click
CREATE TABLE IF NOT EXISTS "ReferralClick" (
  "id" TEXT PRIMARY KEY,
  "referralLinkId" TEXT NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "deviceId" TEXT,
  "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "convertedAt" TIMESTAMP(3),
  "customerId" TEXT,
  "orderId" TEXT,
  
  CONSTRAINT "ReferralClick_referralLinkId_fkey" 
    FOREIGN KEY ("referralLinkId") 
    REFERENCES "ReferralLink"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
);

-- Indexes for ReferralClick
CREATE INDEX IF NOT EXISTS "ReferralClick_referralLinkId_clickedAt_idx" 
  ON "ReferralClick"("referralLinkId", "clickedAt");
CREATE INDEX IF NOT EXISTS "ReferralClick_deviceId_idx" 
  ON "ReferralClick"("deviceId");
CREATE INDEX IF NOT EXISTS "ReferralClick_ipAddress_idx" 
  ON "ReferralClick"("ipAddress");

-- Table 2: ReferralReward - Track all bonuses and commissions
CREATE TABLE IF NOT EXISTS "ReferralReward" (
  "id" TEXT PRIMARY KEY,
  "referralLinkId" TEXT NOT NULL,
  "customerId" TEXT,
  "tier" TEXT NOT NULL DEFAULT 'TIER_2',
  "type" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'EARNED',
  "triggeredBy" TEXT,
  "description" TEXT,
  "metadata" JSONB,
  "lockUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "validatedAt" TIMESTAMP(3),
  "withdrawableAt" TIMESTAMP(3),
  "approvedAt" TIMESTAMP(3),
  "approvedBy" TEXT,
  "paidAt" TIMESTAMP(3),
  "rejectedAt" TIMESTAMP(3),
  "rejectionReason" TEXT,
  
  CONSTRAINT "ReferralReward_referralLinkId_fkey" 
    FOREIGN KEY ("referralLinkId") 
    REFERENCES "ReferralLink"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
);

-- Indexes for ReferralReward
CREATE INDEX IF NOT EXISTS "ReferralReward_referralLinkId_status_idx" 
  ON "ReferralReward"("referralLinkId", "status");
CREATE INDEX IF NOT EXISTS "ReferralReward_customerId_status_idx" 
  ON "ReferralReward"("customerId", "status");
CREATE INDEX IF NOT EXISTS "ReferralReward_type_status_idx" 
  ON "ReferralReward"("type", "status");
CREATE INDEX IF NOT EXISTS "ReferralReward_tier_status_idx" 
  ON "ReferralReward"("tier", "status");
CREATE INDEX IF NOT EXISTS "ReferralReward_lockUntil_idx" 
  ON "ReferralReward"("lockUntil");
CREATE INDEX IF NOT EXISTS "ReferralReward_createdAt_idx" 
  ON "ReferralReward"("createdAt");

-- Table 3: AffiliateEarnings - Monthly aggregated earnings
CREATE TABLE IF NOT EXISTS "AffiliateEarnings" (
  "id" TEXT PRIMARY KEY,
  "referralLinkId" TEXT NOT NULL,
  "month" TEXT NOT NULL,
  "totalEarnings" INTEGER NOT NULL DEFAULT 0,
  "orderCount" INTEGER NOT NULL DEFAULT 0,
  "conversionCount" INTEGER NOT NULL DEFAULT 0,
  "tier" TEXT NOT NULL DEFAULT 'TIER_2',
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "paidAt" TIMESTAMP(3),
  "paymentMethod" TEXT,
  "paymentRef" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "AffiliateEarnings_referralLinkId_fkey" 
    FOREIGN KEY ("referralLinkId") 
    REFERENCES "ReferralLink"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
  
  CONSTRAINT "AffiliateEarnings_referralLinkId_month_key" 
    UNIQUE ("referralLinkId", "month")
);

-- Indexes for AffiliateEarnings
CREATE INDEX IF NOT EXISTS "AffiliateEarnings_referralLinkId_status_idx" 
  ON "AffiliateEarnings"("referralLinkId", "status");
CREATE INDEX IF NOT EXISTS "AffiliateEarnings_month_idx" 
  ON "AffiliateEarnings"("month");

-- Table 4: TableSessionInvite - Track table sharing invites
CREATE TABLE IF NOT EXISTS "TableSessionInvite" (
  "id" TEXT PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "inviterId" TEXT NOT NULL,
  "inviteeId" TEXT,
  "inviteCode" TEXT NOT NULL UNIQUE,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "rewardCents" INTEGER NOT NULL DEFAULT 50000,
  "rewardStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "acceptedAt" TIMESTAMP(3),
  
  CONSTRAINT "TableSessionInvite_sessionId_fkey" 
    FOREIGN KEY ("sessionId") 
    REFERENCES "TableSession"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
  
  CONSTRAINT "TableSessionInvite_inviterId_fkey" 
    FOREIGN KEY ("inviterId") 
    REFERENCES "SessionParticipant"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
  
  CONSTRAINT "TableSessionInvite_inviteeId_fkey" 
    FOREIGN KEY ("inviteeId") 
    REFERENCES "SessionParticipant"("id") 
    ON DELETE SET NULL 
    ON UPDATE CASCADE
);

-- Indexes for TableSessionInvite
CREATE INDEX IF NOT EXISTS "TableSessionInvite_inviteCode_idx" 
  ON "TableSessionInvite"("inviteCode");
CREATE INDEX IF NOT EXISTS "TableSessionInvite_sessionId_status_idx" 
  ON "TableSessionInvite"("sessionId", "status");
CREATE INDEX IF NOT EXISTS "TableSessionInvite_inviterId_idx" 
  ON "TableSessionInvite"("inviterId");

-- Table 5: FraudDetectionLog - Audit trail for fraud detection
CREATE TABLE IF NOT EXISTS "FraudDetectionLog" (
  "id" TEXT PRIMARY KEY,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "riskScore" DOUBLE PRECISION NOT NULL,
  "riskFactors" JSONB NOT NULL,
  "action" TEXT NOT NULL,
  "ipAddress" TEXT,
  "deviceId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for FraudDetectionLog
CREATE INDEX IF NOT EXISTS "FraudDetectionLog_entityType_entityId_idx" 
  ON "FraudDetectionLog"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "FraudDetectionLog_riskScore_idx" 
  ON "FraudDetectionLog"("riskScore");
CREATE INDEX IF NOT EXISTS "FraudDetectionLog_action_idx" 
  ON "FraudDetectionLog"("action");
CREATE INDEX IF NOT EXISTS "FraudDetectionLog_createdAt_idx" 
  ON "FraudDetectionLog"("createdAt");

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check that all tables were created
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN (
  'ReferralClick',
  'ReferralReward',
  'AffiliateEarnings',
  'TableSessionInvite',
  'FraudDetectionLog'
)
ORDER BY table_name;

-- Expected result: 5 rows
-- ReferralClick (10 columns)
-- ReferralReward (15 columns)
-- AffiliateEarnings (13 columns)
-- TableSessionInvite (11 columns)
-- FraudDetectionLog (9 columns)

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
-- If you see 5 tables above, the migration was successful! ✅
-- Next step: Run `npx prisma generate` in your terminal
