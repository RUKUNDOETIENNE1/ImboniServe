-- P0 Consistency Remediation Migration
-- Adds missing enum values and fields identified by LR-A1 audit

-- AlterType: Add missing BillingEventType values
ALTER TYPE "BillingEventType" ADD VALUE IF NOT EXISTS 'SUBSCRIPTION_CHARGE';
ALTER TYPE "BillingEventType" ADD VALUE IF NOT EXISTS 'MARKETPLACE_SALE';

-- AlterType: Add missing SubscriptionStatus value
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'PAST_DUE';

-- Add customerId column to FinancialLedgerEntry
ALTER TABLE "FinancialLedgerEntry" ADD COLUMN IF NOT EXISTS "customerId" TEXT;

-- Create index on customerId
CREATE INDEX IF NOT EXISTS "FinancialLedgerEntry_customerId_idx" ON "FinancialLedgerEntry"("customerId");
