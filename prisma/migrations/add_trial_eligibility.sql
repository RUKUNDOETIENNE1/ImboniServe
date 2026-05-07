-- Phase 3: Trial Anti-Fraud Schema
-- TrialEligibility model for tracking trial usage and preventing abuse

CREATE TABLE "TrialEligibility" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "hashedPhone" TEXT NOT NULL,
  "hashedEmail" TEXT NOT NULL,
  "deviceFingerprint" TEXT,
  "ipRange" TEXT,
  "riskScore" INTEGER NOT NULL DEFAULT 0,
  "blocked" BOOLEAN NOT NULL DEFAULT false,
  "blockReason" TEXT,
  "trialUsedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast lookups
CREATE INDEX "TrialEligibility_hashedPhone_idx" ON "TrialEligibility"("hashedPhone");
CREATE INDEX "TrialEligibility_hashedEmail_idx" ON "TrialEligibility"("hashedEmail");
CREATE INDEX "TrialEligibility_deviceFingerprint_idx" ON "TrialEligibility"("deviceFingerprint");
CREATE INDEX "TrialEligibility_ipRange_idx" ON "TrialEligibility"("ipRange");
CREATE INDEX "TrialEligibility_blocked_idx" ON "TrialEligibility"("blocked");
CREATE INDEX "TrialEligibility_riskScore_idx" ON "TrialEligibility"("riskScore");

-- DisposableEmailDomain model for denylist
CREATE TABLE "DisposableEmailDomain" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "domain" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "DisposableEmailDomain_domain_idx" ON "DisposableEmailDomain"("domain");
