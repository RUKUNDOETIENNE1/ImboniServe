-- PP-001: Partnership Platform Foundation
-- Additive migration: creates new tables and enums only.
-- No existing tables are altered. Zero-downtime, backward compatible.

-- ─── New Enums ────────────────────────────────────────────────────────────

CREATE TYPE "PartnershipLifecycleStatus" AS ENUM (
  'PROSPECT',
  'APPLIED',
  'ONBOARDED',
  'ACTIVE',
  'SUSPENDED',
  'TERMINATED'
);

CREATE TYPE "PartnershipCodeStatus" AS ENUM (
  'ACTIVE',
  'PAUSED',
  'EXPIRED',
  'REVOKED',
  'EXHAUSTED'
);

CREATE TYPE "PartnershipCommissionType" AS ENUM (
  'SIGNUP_BONUS',
  'RECURRING_REVENUE',
  'CAMPAIGN_BONUS',
  'TIER_BONUS',
  'REFERRAL_FEE',
  'CUSTOM'
);

CREATE TYPE "PartnershipCommissionStatus" AS ENUM (
  'PENDING',
  'VALIDATED',
  'APPROVED',
  'PAID',
  'VOID',
  'CLAWED_BACK'
);

CREATE TYPE "PartnershipPayoutStatus" AS ENUM (
  'PENDING',
  'APPROVED',
  'PROCESSING',
  'PAID',
  'FAILED',
  'REJECTED'
);

CREATE TYPE "PartnershipAgreementStatus" AS ENUM (
  'DRAFT',
  'SENT',
  'SIGNED',
  'ACTIVE',
  'EXPIRED',
  'TERMINATED',
  'AMENDED'
);

CREATE TYPE "PartnershipCampaignStatus" AS ENUM (
  'DRAFT',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'CANCELLED'
);

CREATE TYPE "AttributionTouchType" AS ENUM (
  'FIRST_TOUCH',
  'LAST_TOUCH',
  'ASSIST'
);

CREATE TYPE "PartnershipHealthGrade" AS ENUM (
  'A',
  'B',
  'C',
  'D',
  'F'
);

-- ─── Extend Existing Enums (additive — safe) ──────────────────────────────

ALTER TYPE "PartnerType" ADD VALUE IF NOT EXISTS 'AFFILIATE';
ALTER TYPE "PartnerType" ADD VALUE IF NOT EXISTS 'PROFESSIONAL_MARKETER';
ALTER TYPE "PartnerType" ADD VALUE IF NOT EXISTS 'CUSTOMER_REFERRAL';
ALTER TYPE "PartnerType" ADD VALUE IF NOT EXISTS 'BUSINESS_INVITE';
ALTER TYPE "PartnerType" ADD VALUE IF NOT EXISTS 'HOSPITALITY_ASSOCIATION';
ALTER TYPE "PartnerType" ADD VALUE IF NOT EXISTS 'TOURISM_BOARD';
ALTER TYPE "PartnerType" ADD VALUE IF NOT EXISTS 'GOVERNMENT_PROGRAM';
ALTER TYPE "PartnerType" ADD VALUE IF NOT EXISTS 'POS_PARTNER';
ALTER TYPE "PartnerType" ADD VALUE IF NOT EXISTS 'MARKETPLACE_PARTNER';
ALTER TYPE "PartnerType" ADD VALUE IF NOT EXISTS 'HARDWARE_RESELLER';
ALTER TYPE "PartnerType" ADD VALUE IF NOT EXISTS 'TECHNOLOGY_INTEGRATOR';
ALTER TYPE "PartnerType" ADD VALUE IF NOT EXISTS 'AI_CAMPAIGN_PARTNER';

ALTER TYPE "AttributionSourceType" ADD VALUE IF NOT EXISTS 'PARTNERSHIP_CODE';
ALTER TYPE "AttributionSourceType" ADD VALUE IF NOT EXISTS 'PARTNERSHIP_CAMPAIGN';

-- Note: PartnershipEventType new values cannot be added via ALTER TYPE ADD VALUE
-- in a transaction if the enum was used in a table. They must be added separately.
-- The new enum values (PARTNER_REACTIVATED, AGREEMENT_TERMINATED, etc.) will be
-- applied via a separate script or Prisma migrate when the DB is accessible.
-- For now, the Prisma client includes them; the DB migration for enum values
-- should be run before deploying code that emits these new event types.

-- ─── New Tables ───────────────────────────────────────────────────────────

-- Partnership (root entity)
CREATE TABLE "Partnership" (
  "id"                      TEXT NOT NULL,
  "createdAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"               TIMESTAMP(3) NOT NULL,
  "userId"                  TEXT,
  "name"                    TEXT NOT NULL,
  "email"                   TEXT NOT NULL,
  "phone"                   TEXT,
  "partnerType"             "PartnerType" NOT NULL,
  "status"                  "PartnershipLifecycleStatus" NOT NULL DEFAULT 'PROSPECT',
  "onboardedBy"             TEXT,
  "onboardedAt"             TIMESTAMP(3),
  "organization"            TEXT,
  "region"                  TEXT,
  "notes"                   TEXT,
  "totalSignups"            INTEGER NOT NULL DEFAULT 0,
  "totalConversions"        INTEGER NOT NULL DEFAULT 0,
  "totalRevenueCents"       INTEGER NOT NULL DEFAULT 0,
  "totalCommissionCents"    INTEGER NOT NULL DEFAULT 0,
  "totalPayoutsCents"       INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "Partnership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Partnership_userId_key" ON "Partnership"("userId");
CREATE INDEX "Partnership_status_idx" ON "Partnership"("status");
CREATE INDEX "Partnership_partnerType_idx" ON "Partnership"("partnerType");
CREATE INDEX "Partnership_email_idx" ON "Partnership"("email");

-- PartnershipApplication
CREATE TABLE "PartnershipApplication" (
  "id"              TEXT NOT NULL,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  "partnershipId"   TEXT NOT NULL,
  "motivation"      TEXT,
  "experience"      TEXT,
  "networkSize"     TEXT,
  "references"      JSONB,
  "status"          "ApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
  "reviewedBy"      TEXT,
  "reviewedAt"      TIMESTAMP(3),
  "reviewNotes"     TEXT,
  CONSTRAINT "PartnershipApplication_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PartnershipApplication_partnershipId_key" ON "PartnershipApplication"("partnershipId");
CREATE INDEX "PartnershipApplication_status_idx" ON "PartnershipApplication"("status");

-- PartnershipAgreement
CREATE TABLE "PartnershipAgreement" (
  "id"                    TEXT NOT NULL,
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3) NOT NULL,
  "partnershipId"         TEXT NOT NULL,
  "version"               TEXT NOT NULL,
  "terms"                 JSONB,
  "signedAt"              TIMESTAMP(3),
  "effectiveAt"           TIMESTAMP(3),
  "expiresAt"             TIMESTAMP(3),
  "status"                "PartnershipAgreementStatus" NOT NULL DEFAULT 'DRAFT',
  "previousAgreementId"   TEXT,
  CONSTRAINT "PartnershipAgreement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PartnershipAgreement_previousAgreementId_key" ON "PartnershipAgreement"("previousAgreementId");
CREATE INDEX "PartnershipAgreement_partnershipId_idx" ON "PartnershipAgreement"("partnershipId");
CREATE INDEX "PartnershipAgreement_status_idx" ON "PartnershipAgreement"("status");
CREATE INDEX "PartnershipAgreement_effectiveAt_idx" ON "PartnershipAgreement"("effectiveAt");

-- PartnershipCampaign
CREATE TABLE "PartnershipCampaign" (
  "id"                    TEXT NOT NULL,
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3) NOT NULL,
  "partnershipId"         TEXT NOT NULL,
  "name"                  TEXT NOT NULL,
  "description"           TEXT,
  "channel"               TEXT,
  "startDate"             TIMESTAMP(3),
  "endDate"               TIMESTAMP(3),
  "targetSignups"         INTEGER,
  "targetConversions"     INTEGER,
  "budgetCents"           INTEGER,
  "status"                "PartnershipCampaignStatus" NOT NULL DEFAULT 'DRAFT',
  "utmSource"             TEXT,
  "utmMedium"             TEXT,
  "utmCampaign"           TEXT,
  "actualSignups"         INTEGER NOT NULL DEFAULT 0,
  "actualConversions"     INTEGER NOT NULL DEFAULT 0,
  "actualRevenueCents"   INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "PartnershipCampaign_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PartnershipCampaign_partnershipId_idx" ON "PartnershipCampaign"("partnershipId");
CREATE INDEX "PartnershipCampaign_status_idx" ON "PartnershipCampaign"("status");
CREATE INDEX "PartnershipCampaign_channel_idx" ON "PartnershipCampaign"("channel");

-- PartnershipCode
CREATE TABLE "PartnershipCode" (
  "id"              TEXT NOT NULL,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  "code"            TEXT NOT NULL,
  "partnershipId"   TEXT NOT NULL,
  "campaignId"      TEXT,
  "trialDays"       INTEGER NOT NULL DEFAULT 0,
  "status"          "PartnershipCodeStatus" NOT NULL DEFAULT 'ACTIVE',
  "expiresAt"       TIMESTAMP(3),
  "maxRedemptions"  INTEGER,
  "redemptionCount" INTEGER NOT NULL DEFAULT 0,
  "label"           TEXT,
  "notes"           TEXT,
  "metadata"        JSONB,
  CONSTRAINT "PartnershipCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PartnershipCode_code_key" ON "PartnershipCode"("code");
CREATE INDEX "PartnershipCode_partnershipId_idx" ON "PartnershipCode"("partnershipId");
CREATE INDEX "PartnershipCode_code_idx" ON "PartnershipCode"("code");
CREATE INDEX "PartnershipCode_status_idx" ON "PartnershipCode"("status");

-- PartnershipCodeRedemption
CREATE TABLE "PartnershipCodeRedemption" (
  "id"               TEXT NOT NULL,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "codeId"           TEXT NOT NULL,
  "businessId"       TEXT NOT NULL,
  "userId"           TEXT,
  "ipAddress"        TEXT,
  "userAgent"        TEXT,
  "trialDaysGranted" INTEGER NOT NULL,
  CONSTRAINT "PartnershipCodeRedemption_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PartnershipCodeRedemption_codeId_businessId_key" ON "PartnershipCodeRedemption"("codeId", "businessId");
CREATE INDEX "PartnershipCodeRedemption_codeId_idx" ON "PartnershipCodeRedemption"("codeId");
CREATE INDEX "PartnershipCodeRedemption_businessId_idx" ON "PartnershipCodeRedemption"("businessId");

-- PartnershipAttribution
CREATE TABLE "PartnershipAttribution" (
  "id"                TEXT NOT NULL,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "partnershipId"     TEXT NOT NULL,
  "businessId"        TEXT NOT NULL,
  "codeId"            TEXT,
  "sourceType"        "AttributionSourceType" NOT NULL,
  "touchType"         "AttributionTouchType" NOT NULL,
  "priority"          INTEGER NOT NULL DEFAULT 0,
  "sourceCode"        TEXT,
  "utmSource"         TEXT,
  "utmMedium"         TEXT,
  "utmCampaign"       TEXT,
  "ipAddress"         TEXT,
  "userAgent"         TEXT,
  "trialDaysOverride" INTEGER,
  "isCanonical"       BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "PartnershipAttribution_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PartnershipAttribution_partnershipId_idx" ON "PartnershipAttribution"("partnershipId");
CREATE INDEX "PartnershipAttribution_businessId_idx" ON "PartnershipAttribution"("businessId");
CREATE INDEX "PartnershipAttribution_sourceType_idx" ON "PartnershipAttribution"("sourceType");
CREATE INDEX "PartnershipAttribution_touchType_idx" ON "PartnershipAttribution"("touchType");
CREATE INDEX "PartnershipAttribution_isCanonical_idx" ON "PartnershipAttribution"("isCanonical");

-- PartnershipCommission
CREATE TABLE "PartnershipCommission" (
  "id"              TEXT NOT NULL,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  "partnershipId"   TEXT NOT NULL,
  "businessId"      TEXT NOT NULL,
  "codeId"          TEXT,
  "campaignId"      TEXT,
  "invoiceId"       TEXT,
  "type"            "PartnershipCommissionType" NOT NULL,
  "amountCents"     INTEGER NOT NULL,
  "currency"        TEXT NOT NULL DEFAULT 'RWF',
  "ratePercent"     DOUBLE PRECISION NOT NULL,
  "status"          "PartnershipCommissionStatus" NOT NULL DEFAULT 'PENDING',
  "lockedUntil"     TIMESTAMP(3),
  "validatedAt"     TIMESTAMP(3),
  "approvedAt"      TIMESTAMP(3),
  "approvedBy"     TEXT,
  "paidAt"          TIMESTAMP(3),
  "payoutId"        TEXT,
  "periodMonth"     INTEGER,
  "description"     TEXT,
  "clawbackReason"  TEXT,
  "clawbackDate"    TIMESTAMP(3),
  CONSTRAINT "PartnershipCommission_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PartnershipCommission_partnershipId_status_idx" ON "PartnershipCommission"("partnershipId", "status");
CREATE INDEX "PartnershipCommission_businessId_idx" ON "PartnershipCommission"("businessId");
CREATE INDEX "PartnershipCommission_status_idx" ON "PartnershipCommission"("status");
CREATE INDEX "PartnershipCommission_createdAt_idx" ON "PartnershipCommission"("createdAt");
CREATE INDEX "PartnershipCommission_type_idx" ON "PartnershipCommission"("type");
CREATE INDEX "PartnershipCommission_payoutId_idx" ON "PartnershipCommission"("payoutId");

-- PartnershipPayout
CREATE TABLE "PartnershipPayout" (
  "id"               TEXT NOT NULL,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,
  "partnershipId"    TEXT NOT NULL,
  "amountCents"      INTEGER NOT NULL,
  "currency"         TEXT NOT NULL DEFAULT 'RWF',
  "method"           "PayoutMethod" NOT NULL,
  "status"           "PartnershipPayoutStatus" NOT NULL DEFAULT 'PENDING',
  "approvedBy"       TEXT,
  "approvedAt"       TIMESTAMP(3),
  "processedAt"      TIMESTAMP(3),
  "paidAt"           TIMESTAMP(3),
  "failedAt"         TIMESTAMP(3),
  "rejectedAt"       TIMESTAMP(3),
  "rejectedBy"       TEXT,
  "rejectReason"     TEXT,
  "referenceId"      TEXT,
  "providerResponse" TEXT,
  "recipientPhone"   TEXT,
  "recipientBank"    TEXT,
  "recipientAccount" TEXT,
  CONSTRAINT "PartnershipPayout_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PartnershipPayout_referenceId_key" ON "PartnershipPayout"("referenceId");
CREATE INDEX "PartnershipPayout_partnershipId_status_idx" ON "PartnershipPayout"("partnershipId", "status");
CREATE INDEX "PartnershipPayout_status_idx" ON "PartnershipPayout"("status");
CREATE INDEX "PartnershipPayout_createdAt_idx" ON "PartnershipPayout"("createdAt");

-- PartnershipActivityLog
CREATE TABLE "PartnershipActivityLog" (
  "id"            TEXT NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "partnershipId" TEXT NOT NULL,
  "type"          TEXT NOT NULL,
  "description"   TEXT,
  "metadata"      JSONB,
  CONSTRAINT "PartnershipActivityLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PartnershipActivityLog_partnershipId_createdAt_idx" ON "PartnershipActivityLog"("partnershipId", "createdAt");
CREATE INDEX "PartnershipActivityLog_type_createdAt_idx" ON "PartnershipActivityLog"("type", "createdAt");

-- PartnershipRiskProfile
CREATE TABLE "PartnershipRiskProfile" (
  "id"            TEXT NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  "partnershipId" TEXT NOT NULL,
  "riskScore"     INTEGER NOT NULL DEFAULT 0,
  "riskLevel"     "RiskLevel" NOT NULL DEFAULT 'LOW',
  "flags"         TEXT[],
  "totalPayouts"  INTEGER NOT NULL DEFAULT 0,
  "avgPayoutCents" INTEGER NOT NULL DEFAULT 0,
  "lastPayoutAt"  TIMESTAMP(3),
  CONSTRAINT "PartnershipRiskProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PartnershipRiskProfile_partnershipId_key" ON "PartnershipRiskProfile"("partnershipId");
CREATE INDEX "PartnershipRiskProfile_riskLevel_idx" ON "PartnershipRiskProfile"("riskLevel");

-- PartnershipHealthScore
CREATE TABLE "PartnershipHealthScore" (
  "id"                TEXT NOT NULL,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL,
  "partnershipId"     TEXT NOT NULL,
  "score"             INTEGER NOT NULL DEFAULT 0,
  "grade"             "PartnershipHealthGrade" NOT NULL DEFAULT 'C',
  "acquisitionScore"  INTEGER NOT NULL DEFAULT 0,
  "conversionScore"   INTEGER NOT NULL DEFAULT 0,
  "revenueScore"      INTEGER NOT NULL DEFAULT 0,
  "engagementScore"   INTEGER NOT NULL DEFAULT 0,
  "riskComponentScore" INTEGER NOT NULL DEFAULT 0,
  "previousScore"     INTEGER,
  "trendDirection"    TEXT,
  "computedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notes"             TEXT,
  CONSTRAINT "PartnershipHealthScore_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PartnershipHealthScore_partnershipId_key" ON "PartnershipHealthScore"("partnershipId");
CREATE INDEX "PartnershipHealthScore_grade_idx" ON "PartnershipHealthScore"("grade");
CREATE INDEX "PartnershipHealthScore_score_idx" ON "PartnershipHealthScore"("score");

-- PartnershipAuditRecord
CREATE TABLE "PartnershipAuditRecord" (
  "id"            TEXT NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "partnershipId" TEXT NOT NULL,
  "action"        TEXT NOT NULL,
  "actorId"       TEXT,
  "oldValue"      TEXT,
  "newValue"      TEXT,
  "metadata"      JSONB,
  CONSTRAINT "PartnershipAuditRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PartnershipAuditRecord_partnershipId_createdAt_idx" ON "PartnershipAuditRecord"("partnershipId", "createdAt");
CREATE INDEX "PartnershipAuditRecord_action_createdAt_idx" ON "PartnershipAuditRecord"("action", "createdAt");

-- ─── Foreign Keys ─────────────────────────────────────────────────────────

ALTER TABLE "Partnership" ADD CONSTRAINT "Partnership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL;

ALTER TABLE "PartnershipApplication" ADD CONSTRAINT "PartnershipApplication_partnershipId_fkey" FOREIGN KEY ("partnershipId") REFERENCES "Partnership"("id") ON DELETE CASCADE;

ALTER TABLE "PartnershipAgreement" ADD CONSTRAINT "PartnershipAgreement_partnershipId_fkey" FOREIGN KEY ("partnershipId") REFERENCES "Partnership"("id") ON DELETE CASCADE;
ALTER TABLE "PartnershipAgreement" ADD CONSTRAINT "PartnershipAgreement_previousAgreementId_fkey" FOREIGN KEY ("previousAgreementId") REFERENCES "PartnershipAgreement"("id") ON DELETE SET NULL;

ALTER TABLE "PartnershipCampaign" ADD CONSTRAINT "PartnershipCampaign_partnershipId_fkey" FOREIGN KEY ("partnershipId") REFERENCES "Partnership"("id") ON DELETE CASCADE;

ALTER TABLE "PartnershipCode" ADD CONSTRAINT "PartnershipCode_partnershipId_fkey" FOREIGN KEY ("partnershipId") REFERENCES "Partnership"("id") ON DELETE CASCADE;
ALTER TABLE "PartnershipCode" ADD CONSTRAINT "PartnershipCode_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "PartnershipCampaign"("id") ON DELETE SET NULL;

ALTER TABLE "PartnershipCodeRedemption" ADD CONSTRAINT "PartnershipCodeRedemption_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "PartnershipCode"("id") ON DELETE CASCADE;

ALTER TABLE "PartnershipAttribution" ADD CONSTRAINT "PartnershipAttribution_partnershipId_fkey" FOREIGN KEY ("partnershipId") REFERENCES "Partnership"("id") ON DELETE CASCADE;
ALTER TABLE "PartnershipAttribution" ADD CONSTRAINT "PartnershipAttribution_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "PartnershipCode"("id") ON DELETE SET NULL;

ALTER TABLE "PartnershipCommission" ADD CONSTRAINT "PartnershipCommission_partnershipId_fkey" FOREIGN KEY ("partnershipId") REFERENCES "Partnership"("id") ON DELETE CASCADE;
ALTER TABLE "PartnershipCommission" ADD CONSTRAINT "PartnershipCommission_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "PartnershipCode"("id") ON DELETE SET NULL;
ALTER TABLE "PartnershipCommission" ADD CONSTRAINT "PartnershipCommission_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "PartnershipCampaign"("id") ON DELETE SET NULL;
ALTER TABLE "PartnershipCommission" ADD CONSTRAINT "PartnershipCommission_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "PartnershipPayout"("id") ON DELETE SET NULL;

ALTER TABLE "PartnershipPayout" ADD CONSTRAINT "PartnershipPayout_partnershipId_fkey" FOREIGN KEY ("partnershipId") REFERENCES "Partnership"("id") ON DELETE CASCADE;

ALTER TABLE "PartnershipActivityLog" ADD CONSTRAINT "PartnershipActivityLog_partnershipId_fkey" FOREIGN KEY ("partnershipId") REFERENCES "Partnership"("id") ON DELETE CASCADE;

ALTER TABLE "PartnershipRiskProfile" ADD CONSTRAINT "PartnershipRiskProfile_partnershipId_fkey" FOREIGN KEY ("partnershipId") REFERENCES "Partnership"("id") ON DELETE CASCADE;

ALTER TABLE "PartnershipHealthScore" ADD CONSTRAINT "PartnershipHealthScore_partnershipId_fkey" FOREIGN KEY ("partnershipId") REFERENCES "Partnership"("id") ON DELETE CASCADE;

ALTER TABLE "PartnershipAuditRecord" ADD CONSTRAINT "PartnershipAuditRecord_partnershipId_fkey" FOREIGN KEY ("partnershipId") REFERENCES "Partnership"("id") ON DELETE CASCADE;

-- ─── Add partnershipId to FounderPartner (additive, nullable) ─────────────

ALTER TABLE "FounderPartner" ADD COLUMN IF NOT EXISTS "partnershipId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "FounderPartner_partnershipId_key" ON "FounderPartner"("partnershipId");
ALTER TABLE "FounderPartner" ADD CONSTRAINT "FounderPartner_partnershipId_fkey" FOREIGN KEY ("partnershipId") REFERENCES "Partnership"("id") ON DELETE SET NULL;

-- ─── Add PartnershipEventType new values ──────────────────────────────────
-- These must be run outside a transaction for PostgreSQL ALTER TYPE ADD VALUE.
-- They are safe and additive.

ALTER TYPE "PartnershipEventType" ADD VALUE IF NOT EXISTS 'PARTNER_REACTIVATED';
ALTER TYPE "PartnershipEventType" ADD VALUE IF NOT EXISTS 'PARTNER_ONBOARDED';
ALTER TYPE "PartnershipEventType" ADD VALUE IF NOT EXISTS 'AGREEMENT_TERMINATED';
ALTER TYPE "PartnershipEventType" ADD VALUE IF NOT EXISTS 'CAMPAIGN_CANCELLED';
ALTER TYPE "PartnershipEventType" ADD VALUE IF NOT EXISTS 'TRIAL_ACTIVATED';
ALTER TYPE "PartnershipEventType" ADD VALUE IF NOT EXISTS 'TRIAL_EXPIRED';
ALTER TYPE "PartnershipEventType" ADD VALUE IF NOT EXISTS 'TRIAL_CONVERTED';
ALTER TYPE "PartnershipEventType" ADD VALUE IF NOT EXISTS 'COMMISSION_APPROVED';
ALTER TYPE "PartnershipEventType" ADD VALUE IF NOT EXISTS 'PAYOUT_REJECTED';
ALTER TYPE "PartnershipEventType" ADD VALUE IF NOT EXISTS 'RISK_FLAG_REMOVED';
ALTER TYPE "PartnershipEventType" ADD VALUE IF NOT EXISTS 'HEALTH_SCORE_UPDATED';
ALTER TYPE "PartnershipEventType" ADD VALUE IF NOT EXISTS 'ATTRIBUTION_RESOLVED';
ALTER TYPE "PartnershipEventType" ADD VALUE IF NOT EXISTS 'COMMISSION_CLAWED_BACK';
ALTER TYPE "PartnershipEventType" ADD VALUE IF NOT EXISTS 'PARTNER_TYPE_CHANGED';
