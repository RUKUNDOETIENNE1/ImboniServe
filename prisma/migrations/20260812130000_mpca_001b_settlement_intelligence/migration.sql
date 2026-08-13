-- MPCA-001B: Settlement Intelligence Architecture
-- Provider-neutral money movement: settlement, withdrawal, funds availability, reconciliation

-- Enum: FundsAvailabilityStatus
CREATE TYPE "FundsAvailabilityStatus" AS ENUM ('FUNDS_PENDING', 'FUNDS_AVAILABLE', 'FUNDS_UNKNOWN');

-- Enum: SettlementStatus
CREATE TYPE "SettlementStatus" AS ENUM ('SETTLEMENT_PENDING', 'SETTLEMENT_PROCESSING', 'SETTLEMENT_COMPLETED', 'SETTLEMENT_FAILED', 'SETTLEMENT_NOT_REQUIRED', 'SETTLEMENT_UNKNOWN');

-- Enum: WithdrawalStatus
CREATE TYPE "WithdrawalStatus" AS ENUM ('WITHDRAWAL_REQUESTED', 'WITHDRAWAL_PROCESSING', 'WITHDRAWAL_COMPLETED', 'WITHDRAWAL_FAILED', 'WITHDRAWAL_NOT_SUPPORTED', 'WITHDRAWAL_UNKNOWN');

-- Enum: SettlementReconciliationStatus
CREATE TYPE "SettlementReconciliationStatus" AS ENUM ('RECONCILED', 'RECONCILIATION_VARIANCE', 'RECONCILIATION_PENDING', 'RECONCILIATION_NOT_APPLICABLE');

-- Enum: ProviderCapabilityVerification
CREATE TYPE "ProviderCapabilityVerification" AS ENUM ('UNKNOWN', 'NOT_VERIFIED', 'NOT_SUPPORTED', 'SUPPORTED', 'SUPPORTED_BUT_UNTESTED', 'VERIFIED', 'DOCUMENTED', 'SUPPORT_CONFIRMED');

-- Table: SettlementRecord
CREATE TABLE "SettlementRecord" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "provider" "PaymentGateway" NOT NULL,
    "providerSettlementId" TEXT,
    "internalSettlementId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "grossAmountCents" INTEGER NOT NULL,
    "providerFeeCents" INTEGER NOT NULL DEFAULT 0,
    "platformFeeCents" INTEGER NOT NULL DEFAULT 0,
    "otherDeductionsCents" INTEGER NOT NULL DEFAULT 0,
    "netAmountCents" INTEGER NOT NULL,
    "status" "SettlementStatus" NOT NULL,
    "fundsAvailabilityStatus" "FundsAvailabilityStatus" NOT NULL,
    "requestedAt" TIMESTAMP(3),
    "processingAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expectedAvailabilityAt" TIMESTAMP(3),
    "destinationReference" TEXT,
    "providerMetadata" JSONB,
    "reconciliationStatus" "SettlementReconciliationStatus" NOT NULL DEFAULT 'RECONCILIATION_PENDING',
    "reconciledAt" TIMESTAMP(3),
    "reconciliationVarianceCents" INTEGER,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SettlementRecord_pkey" PRIMARY KEY ("id")
);

-- Create unique index on SettlementRecord.internalSettlementId
CREATE UNIQUE INDEX "SettlementRecord_internalSettlementId_key" ON "SettlementRecord"("internalSettlementId");

-- Create unique index on SettlementRecord.idempotencyKey
CREATE UNIQUE INDEX "SettlementRecord_idempotencyKey_key" ON "SettlementRecord"("idempotencyKey");

-- Create indexes on SettlementRecord
CREATE INDEX "SettlementRecord_businessId_createdAt_idx" ON "SettlementRecord"("businessId", "createdAt");
CREATE INDEX "SettlementRecord_provider_status_idx" ON "SettlementRecord"("provider", "status");
CREATE INDEX "SettlementRecord_reconciliationStatus_idx" ON "SettlementRecord"("reconciliationStatus");
CREATE INDEX "SettlementRecord_fundsAvailabilityStatus_idx" ON "SettlementRecord"("fundsAvailabilityStatus");

-- Add foreign key from SettlementRecord to Business
ALTER TABLE "SettlementRecord" ADD CONSTRAINT "SettlementRecord_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE;

-- Table: SettlementTransactionLink
CREATE TABLE "SettlementTransactionLink" (
    "id" TEXT NOT NULL,
    "settlementRecordId" TEXT NOT NULL,
    "paymentTransactionId" TEXT NOT NULL,
    "allocatedAmountCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SettlementTransactionLink_pkey" PRIMARY KEY ("id")
);

-- Create unique index on SettlementTransactionLink composite
CREATE UNIQUE INDEX "SettlementTransactionLink_settlementRecordId_paymentTransactionId_key" ON "SettlementTransactionLink"("settlementRecordId", "paymentTransactionId");

-- Create indexes on SettlementTransactionLink
CREATE INDEX "SettlementTransactionLink_settlementRecordId_idx" ON "SettlementTransactionLink"("settlementRecordId");
CREATE INDEX "SettlementTransactionLink_paymentTransactionId_idx" ON "SettlementTransactionLink"("paymentTransactionId");

-- Add foreign keys for SettlementTransactionLink
ALTER TABLE "SettlementTransactionLink" ADD CONSTRAINT "SettlementTransactionLink_settlementRecordId_fkey" FOREIGN KEY ("settlementRecordId") REFERENCES "SettlementRecord"("id") ON DELETE CASCADE;
ALTER TABLE "SettlementTransactionLink" ADD CONSTRAINT "SettlementTransactionLink_paymentTransactionId_fkey" FOREIGN KEY ("paymentTransactionId") REFERENCES "PaymentTransaction"("id");

-- Table: WithdrawalRecord
CREATE TABLE "WithdrawalRecord" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "provider" "PaymentGateway" NOT NULL,
    "providerWithdrawalId" TEXT,
    "internalWithdrawalId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "feeCents" INTEGER NOT NULL DEFAULT 0,
    "netAmountCents" INTEGER NOT NULL,
    "status" "WithdrawalStatus" NOT NULL,
    "destinationType" TEXT,
    "destinationReference" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processingAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "providerMetadata" JSONB,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WithdrawalRecord_pkey" PRIMARY KEY ("id")
);

-- Create unique index on WithdrawalRecord.internalWithdrawalId
CREATE UNIQUE INDEX "WithdrawalRecord_internalWithdrawalId_key" ON "WithdrawalRecord"("internalWithdrawalId");

-- Create unique index on WithdrawalRecord.idempotencyKey
CREATE UNIQUE INDEX "WithdrawalRecord_idempotencyKey_key" ON "WithdrawalRecord"("idempotencyKey");

-- Create indexes on WithdrawalRecord
CREATE INDEX "WithdrawalRecord_businessId_status_idx" ON "WithdrawalRecord"("businessId", "status");
CREATE INDEX "WithdrawalRecord_provider_status_idx" ON "WithdrawalRecord"("provider", "status");

-- Add foreign key from WithdrawalRecord to Business
ALTER TABLE "WithdrawalRecord" ADD CONSTRAINT "WithdrawalRecord_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE;

-- Table: ProviderCapabilityRecord
CREATE TABLE "ProviderCapabilityRecord" (
    "id" TEXT NOT NULL,
    "provider" "PaymentGateway" NOT NULL,
    "capability" TEXT NOT NULL,
    "verificationStatus" "ProviderCapabilityVerification" NOT NULL,
    "evidence" TEXT,
    "lastVerifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderCapabilityRecord_pkey" PRIMARY KEY ("id")
);

-- Create unique index on ProviderCapabilityRecord composite
CREATE UNIQUE INDEX "ProviderCapabilityRecord_provider_capability_key" ON "ProviderCapabilityRecord"("provider", "capability");

-- Create indexes on ProviderCapabilityRecord
CREATE INDEX "ProviderCapabilityRecord_provider_idx" ON "ProviderCapabilityRecord"("provider");
CREATE INDEX "ProviderCapabilityRecord_verificationStatus_idx" ON "ProviderCapabilityRecord"("verificationStatus");
