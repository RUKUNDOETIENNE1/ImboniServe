-- CreateEnums (must come before CreateTable statements)
CREATE TYPE "AttributionSourceType" AS ENUM ('FOUNDER_CODE', 'AFFILIATE', 'PROFESSIONAL_MARKETER', 'REFERRAL_LINK', 'CUSTOMER_REFERRAL', 'BUSINESS_INVITE', 'DIRECT_ORGANIC', 'OTHER');
CREATE TYPE "AttributionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'SUPERSEDED', 'REJECTED');
CREATE TYPE "PartnerStatus" AS ENUM ('PROSPECT', 'APPLIED', 'ACTIVE', 'SUSPENDED', 'TERMINATED');
CREATE TYPE "PartnerType" AS ENUM ('FOUNDER', 'STRATEGIC', 'CHANNEL');
CREATE TYPE "FounderCodeStatus" AS ENUM ('ACTIVE', 'PAUSED', 'EXPIRED', 'REVOKED');
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "FounderCommissionType" AS ENUM ('SIGNUP_BONUS', 'RECURRING_REVENUE', 'CAMPAIGN_BONUS');
CREATE TYPE "FounderCommissionStatus" AS ENUM ('PENDING', 'VALIDATED', 'PAID', 'VOID');
CREATE TYPE "ApplicationStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN');
CREATE TYPE "AgreementStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'TERMINATED');
CREATE TYPE "PartnershipEventType" AS ENUM ('PARTNER_CREATED', 'PARTNER_APPLIED', 'PARTNER_APPROVED', 'PARTNER_SUSPENDED', 'PARTNER_TERMINATED', 'AGREEMENT_SENT', 'AGREEMENT_SIGNED', 'AGREEMENT_EXPIRED', 'CODE_CREATED', 'CODE_PAUSED', 'CODE_REVOKED', 'CODE_REDEEMED', 'ATTRIBUTION_RECORDED', 'ATTRIBUTION_SUPERSEDED', 'CAMPAIGN_LAUNCHED', 'CAMPAIGN_PAUSED', 'CAMPAIGN_COMPLETED', 'COMMISSION_ACCRUED', 'COMMISSION_VALIDATED', 'COMMISSION_PAID', 'COMMISSION_VOIDED', 'PAYOUT_REQUESTED', 'PAYOUT_APPROVED', 'PAYOUT_PAID', 'PAYOUT_FAILED', 'RISK_SCORE_UPDATED', 'RISK_FLAG_ADDED', 'QBR_CREATED', 'QBR_REVIEWED');

-- Pre-existing enums from prior migration (created here with IF NOT EXISTS for safety)
DO $$ BEGIN
    CREATE TYPE "PayoutMethod" AS ENUM ('MTN_MOBILE_MONEY', 'AIRTEL_MONEY', 'BANK_TRANSFER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'APPROVED', 'PROCESSING', 'PAID', 'FAILED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateTable
CREATE TABLE "AcquisitionAttribution" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,
    "sourceType" "AttributionSourceType" NOT NULL,
    "sourceId" TEXT,
    "sourceCode" TEXT,
    "status" "AttributionStatus" NOT NULL DEFAULT 'CONFIRMED',
    "resolvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "utmSource" TEXT,
    "utmCampaign" TEXT,
    "utmMedium" TEXT,
    "trialDaysOverride" INTEGER,
    "sourceName" TEXT,
    "sourceMetadata" JSONB,

    CONSTRAINT "AcquisitionAttribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FounderPartner" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "partnerType" "PartnerType" NOT NULL DEFAULT 'FOUNDER',
    "status" "PartnerStatus" NOT NULL DEFAULT 'PROSPECT',
    "onboardedBy" TEXT,
    "onboardedAt" TIMESTAMP(3),
    "organization" TEXT,
    "region" TEXT,
    "notes" TEXT,

    CONSTRAINT "FounderPartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FounderPartnerApplication" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "partnerId" TEXT NOT NULL,
    "motivation" TEXT,
    "experience" TEXT,
    "networkSize" TEXT,
    "references" JSONB,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,

    CONSTRAINT "FounderPartnerApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerAgreement" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "partnerId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "terms" JSONB,
    "signedAt" TIMESTAMP(3),
    "effectiveAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "status" "AgreementStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "PartnerAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FounderCode" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "code" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "trialDays" INTEGER NOT NULL DEFAULT 30,
    "campaignId" TEXT,
    "status" "FounderCodeStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),
    "maxRedemptions" INTEGER,
    "redemptionCount" INTEGER NOT NULL DEFAULT 0,
    "label" TEXT,
    "notes" TEXT,

    CONSTRAINT "FounderCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FounderCodeRedemption" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "codeId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "trialDaysGranted" INTEGER NOT NULL,

    CONSTRAINT "FounderCodeRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerCampaign" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "partnerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "channel" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "targetSignups" INTEGER,
    "targetConversions" INTEGER,
    "budgetCents" INTEGER,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,

    CONSTRAINT "PartnerCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FounderCommission" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "partnerId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "codeId" TEXT,
    "invoiceId" TEXT,
    "type" "FounderCommissionType" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RWF',
    "ratePercent" DOUBLE PRECISION NOT NULL,
    "status" "FounderCommissionStatus" NOT NULL DEFAULT 'PENDING',
    "lockedUntil" TIMESTAMP(3),
    "validatedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "periodMonth" INTEGER,
    "description" TEXT,

    CONSTRAINT "FounderCommission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FounderPartnerPayout" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "partnerId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RWF',
    "method" "PayoutMethod" NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectReason" TEXT,
    "referenceId" TEXT,
    "providerResponse" TEXT,
    "recipientPhone" TEXT,
    "recipientBank" TEXT,
    "recipientAccount" TEXT,

    CONSTRAINT "FounderPartnerPayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FounderPartnerRiskProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "partnerId" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "flags" TEXT[],
    "totalPayouts" INTEGER NOT NULL DEFAULT 0,
    "avgPayoutCents" INTEGER NOT NULL DEFAULT 0,
    "lastPayoutAt" TIMESTAMP(3),

    CONSTRAINT "FounderPartnerRiskProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerActivity" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "partnerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,

    CONSTRAINT "PartnerActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerQBR" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "partnerId" TEXT NOT NULL,
    "quarter" TEXT NOT NULL,
    "totalSignups" INTEGER NOT NULL DEFAULT 0,
    "totalConversions" INTEGER NOT NULL DEFAULT 0,
    "totalRevenueCents" INTEGER NOT NULL DEFAULT 0,
    "totalCommissionCents" INTEGER NOT NULL DEFAULT 0,
    "highlights" TEXT,
    "challenges" TEXT,
    "actionItems" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "PartnerQBR_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnershipAuditLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "partnerId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "metadata" JSONB,

    CONSTRAINT "PartnershipAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnershipEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "PartnershipEventType" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "payload" JSONB,
    "triggeredBy" TEXT,
    "ipAddress" TEXT,

    CONSTRAINT "PartnershipEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE UNIQUE INDEX "AcquisitionAttribution_businessId_key" ON "AcquisitionAttribution"("businessId");
CREATE INDEX "AcquisitionAttribution_sourceType_sourceId_idx" ON "AcquisitionAttribution"("sourceType", "sourceId");
CREATE INDEX "AcquisitionAttribution_sourceCode_idx" ON "AcquisitionAttribution"("sourceCode");
CREATE INDEX "AcquisitionAttribution_sourceType_idx" ON "AcquisitionAttribution"("sourceType");

CREATE UNIQUE INDEX "FounderPartner_userId_key" ON "FounderPartner"("userId");
CREATE UNIQUE INDEX "FounderPartner_email_key" ON "FounderPartner"("email");
CREATE UNIQUE INDEX "FounderPartner_phone_key" ON "FounderPartner"("phone");
CREATE INDEX "FounderPartner_status_idx" ON "FounderPartner"("status");
CREATE INDEX "FounderPartner_email_idx" ON "FounderPartner"("email");
CREATE INDEX "FounderPartner_partnerType_idx" ON "FounderPartner"("partnerType");

CREATE UNIQUE INDEX "FounderPartnerApplication_partnerId_key" ON "FounderPartnerApplication"("partnerId");
CREATE INDEX "FounderPartnerApplication_status_idx" ON "FounderPartnerApplication"("status");

CREATE UNIQUE INDEX "PartnerAgreement_partnerId_key" ON "PartnerAgreement"("partnerId");
CREATE INDEX "PartnerAgreement_status_idx" ON "PartnerAgreement"("status");

CREATE UNIQUE INDEX "FounderCode_code_key" ON "FounderCode"("code");
CREATE INDEX "FounderCode_partnerId_idx" ON "FounderCode"("partnerId");
CREATE INDEX "FounderCode_code_idx" ON "FounderCode"("code");
CREATE INDEX "FounderCode_status_idx" ON "FounderCode"("status");

CREATE UNIQUE INDEX "FounderCodeRedemption_codeId_businessId_key" ON "FounderCodeRedemption"("codeId", "businessId");
CREATE INDEX "FounderCodeRedemption_codeId_idx" ON "FounderCodeRedemption"("codeId");
CREATE INDEX "FounderCodeRedemption_businessId_idx" ON "FounderCodeRedemption"("businessId");

CREATE INDEX "PartnerCampaign_partnerId_idx" ON "PartnerCampaign"("partnerId");
CREATE INDEX "PartnerCampaign_status_idx" ON "PartnerCampaign"("status");

CREATE INDEX "FounderCommission_partnerId_status_idx" ON "FounderCommission"("partnerId", "status");
CREATE INDEX "FounderCommission_businessId_idx" ON "FounderCommission"("businessId");
CREATE INDEX "FounderCommission_status_idx" ON "FounderCommission"("status");
CREATE INDEX "FounderCommission_createdAt_idx" ON "FounderCommission"("createdAt");

CREATE UNIQUE INDEX "FounderPartnerPayout_referenceId_key" ON "FounderPartnerPayout"("referenceId");
CREATE INDEX "FounderPartnerPayout_partnerId_status_idx" ON "FounderPartnerPayout"("partnerId", "status");
CREATE INDEX "FounderPartnerPayout_status_idx" ON "FounderPartnerPayout"("status");
CREATE INDEX "FounderPartnerPayout_createdAt_idx" ON "FounderPartnerPayout"("createdAt");

CREATE UNIQUE INDEX "FounderPartnerRiskProfile_partnerId_key" ON "FounderPartnerRiskProfile"("partnerId");
CREATE INDEX "FounderPartnerRiskProfile_riskLevel_idx" ON "FounderPartnerRiskProfile"("riskLevel");

CREATE INDEX "PartnerActivity_partnerId_createdAt_idx" ON "PartnerActivity"("partnerId", "createdAt");
CREATE INDEX "PartnerActivity_type_createdAt_idx" ON "PartnerActivity"("type", "createdAt");

CREATE UNIQUE INDEX "PartnerQBR_partnerId_quarter_key" ON "PartnerQBR"("partnerId", "quarter");
CREATE INDEX "PartnerQBR_partnerId_idx" ON "PartnerQBR"("partnerId");

CREATE INDEX "PartnershipAuditLog_partnerId_createdAt_idx" ON "PartnershipAuditLog"("partnerId", "createdAt");
CREATE INDEX "PartnershipAuditLog_action_createdAt_idx" ON "PartnershipAuditLog"("action", "createdAt");

CREATE INDEX "PartnershipEvent_type_createdAt_idx" ON "PartnershipEvent"("type", "createdAt");
CREATE INDEX "PartnershipEvent_entityType_entityId_idx" ON "PartnershipEvent"("entityType", "entityId");
CREATE INDEX "PartnershipEvent_createdAt_idx" ON "PartnershipEvent"("createdAt");

-- AddForeignKey
-- AcquisitionAttribution -> Business (table may be named "Restaurant" or "Business" depending on migration history)
DO $$ BEGIN
    ALTER TABLE "AcquisitionAttribution" ADD CONSTRAINT "AcquisitionAttribution_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN undefined_table THEN
    ALTER TABLE "AcquisitionAttribution" ADD CONSTRAINT "AcquisitionAttribution_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
END $$;

ALTER TABLE "FounderPartner" ADD CONSTRAINT "FounderPartner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FounderPartnerApplication" ADD CONSTRAINT "FounderPartnerApplication_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "FounderPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PartnerAgreement" ADD CONSTRAINT "PartnerAgreement_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "FounderPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FounderCode" ADD CONSTRAINT "FounderCode_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "FounderPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FounderCode" ADD CONSTRAINT "FounderCode_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "PartnerCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FounderCodeRedemption" ADD CONSTRAINT "FounderCodeRedemption_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "FounderCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PartnerCampaign" ADD CONSTRAINT "PartnerCampaign_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "FounderPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FounderCommission" ADD CONSTRAINT "FounderCommission_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "FounderPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FounderPartnerPayout" ADD CONSTRAINT "FounderPartnerPayout_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "FounderPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FounderPartnerRiskProfile" ADD CONSTRAINT "FounderPartnerRiskProfile_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "FounderPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PartnerActivity" ADD CONSTRAINT "PartnerActivity_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "FounderPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PartnerQBR" ADD CONSTRAINT "PartnerQBR_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "FounderPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PartnershipAuditLog" ADD CONSTRAINT "PartnershipAuditLog_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "FounderPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
