-- Safe Migration (Steps 1-4 only): Business columns, tables, and indexes
-- Idempotent: uses IF NOT EXISTS and WHERE IS NULL guards

-- Step 1: Add businessId columns with restaurantId as default (temporary)
ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "businessId" TEXT;
UPDATE "MenuItem" SET "businessId" = "restaurantId" WHERE "businessId" IS NULL;
ALTER TABLE "MenuItem" ALTER COLUMN "businessId" SET NOT NULL;

ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "businessId" TEXT;
UPDATE "Sale" SET "businessId" = "restaurantId" WHERE "businessId" IS NULL;
ALTER TABLE "Sale" ALTER COLUMN "businessId" SET NOT NULL;

ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "businessId" TEXT;
UPDATE "InventoryItem" SET "businessId" = "restaurantId" WHERE "businessId" IS NULL;
ALTER TABLE "InventoryItem" ALTER COLUMN "businessId" SET NOT NULL;

ALTER TABLE "InventoryUpdate" ADD COLUMN IF NOT EXISTS "businessId" TEXT;
UPDATE "InventoryUpdate" SET "businessId" = "restaurantId" WHERE "businessId" IS NULL;
ALTER TABLE "InventoryUpdate" ALTER COLUMN "businessId" SET NOT NULL;

ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "businessId" TEXT;
UPDATE "Subscription" SET "businessId" = "restaurantId" WHERE "businessId" IS NULL;
ALTER TABLE "Subscription" ALTER COLUMN "businessId" SET NOT NULL;

ALTER TABLE "WhatsAppMessage" ADD COLUMN IF NOT EXISTS "businessId" TEXT;
UPDATE "WhatsAppMessage" SET "businessId" = "restaurantId" WHERE "businessId" IS NULL;
ALTER TABLE "WhatsAppMessage" ALTER COLUMN "businessId" SET NOT NULL;

ALTER TABLE "SupplierOrder" ADD COLUMN IF NOT EXISTS "businessId" TEXT;
UPDATE "SupplierOrder" SET "businessId" = "restaurantId" WHERE "businessId" IS NULL;
ALTER TABLE "SupplierOrder" ALTER COLUMN "businessId" SET NOT NULL;

ALTER TABLE "MarketplaceOrder" ADD COLUMN IF NOT EXISTS "businessId" TEXT;
UPDATE "MarketplaceOrder" SET "businessId" = "restaurantId" WHERE "businessId" IS NULL;
ALTER TABLE "MarketplaceOrder" ALTER COLUMN "businessId" SET NOT NULL;

ALTER TABLE "Table" ADD COLUMN IF NOT EXISTS "businessId" TEXT;
UPDATE "Table" SET "businessId" = "restaurantId" WHERE "businessId" IS NULL;
ALTER TABLE "Table" ALTER COLUMN "businessId" SET NOT NULL;

ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "businessId" TEXT;
UPDATE "Customer" SET "businessId" = "restaurantId" WHERE "businessId" IS NULL;
ALTER TABLE "Customer" ALTER COLUMN "businessId" SET NOT NULL;

ALTER TABLE "AffiliateCommission" ADD COLUMN IF NOT EXISTS "businessId" TEXT;
UPDATE "AffiliateCommission" SET "businessId" = "restaurantId" WHERE "businessId" IS NULL;
ALTER TABLE "AffiliateCommission" ALTER COLUMN "businessId" SET NOT NULL;

ALTER TABLE "SmartDiningSlip" ADD COLUMN IF NOT EXISTS "businessId" TEXT;
UPDATE "SmartDiningSlip" SET "businessId" = "restaurantId" WHERE "businessId" IS NULL;
ALTER TABLE "SmartDiningSlip" ALTER COLUMN "businessId" SET NOT NULL;

ALTER TABLE "SmartDiningSlip" ADD COLUMN IF NOT EXISTS "businessName" TEXT;
UPDATE "SmartDiningSlip" SET "businessName" = "restaurantName" WHERE "businessName" IS NULL;

ALTER TABLE "SmartDiningSlip" ADD COLUMN IF NOT EXISTS "businessLogo" TEXT;
UPDATE "SmartDiningSlip" SET "businessLogo" = "restaurantLogo" WHERE "businessLogo" IS NULL;

ALTER TABLE "SmartDiningSlip" ADD COLUMN IF NOT EXISTS "buyerBusinessId" TEXT;
UPDATE "SmartDiningSlip" SET "buyerBusinessId" = "buyerRestaurantId" WHERE "buyerBusinessId" IS NULL;

ALTER TABLE "ReferralLink" ADD COLUMN IF NOT EXISTS "businessId" TEXT;
UPDATE "ReferralLink" SET "businessId" = "restaurantId" WHERE "businessId" IS NULL;
ALTER TABLE "ReferralLink" ALTER COLUMN "businessId" SET NOT NULL;

ALTER TABLE "DiningCredit" ADD COLUMN IF NOT EXISTS "redeemedBusinessId" TEXT;
UPDATE "DiningCredit" SET "redeemedBusinessId" = "redeemedRestaurantId" WHERE "redeemedBusinessId" IS NULL;

ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "businessId" TEXT;
UPDATE "PurchaseOrder" SET "businessId" = "restaurantId" WHERE "businessId" IS NULL;
ALTER TABLE "PurchaseOrder" ALTER COLUMN "businessId" SET NOT NULL;

ALTER TABLE "GoodsReceivedNote" ADD COLUMN IF NOT EXISTS "businessId" TEXT;
UPDATE "GoodsReceivedNote" SET "businessId" = "restaurantId" WHERE "businessId" IS NULL;
ALTER TABLE "GoodsReceivedNote" ALTER COLUMN "businessId" SET NOT NULL;

-- Step 2: Update User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "businessId" TEXT;
UPDATE "User" SET "businessId" = "restaurantId" WHERE "businessId" IS NULL;

-- Step 3: Create new tables (PaymentTransaction and AffiliateCommissionNew)
CREATE TABLE IF NOT EXISTS "PaymentTransaction" (
  id TEXT PRIMARY KEY,
  "businessId" TEXT NOT NULL REFERENCES "Restaurant"(id) ON DELETE CASCADE,
  "invoiceNumber" TEXT UNIQUE NOT NULL,
  "transactionId" TEXT UNIQUE NOT NULL,
  "referenceId" TEXT,
  gateway TEXT NOT NULL,
  "paymentMethod" TEXT NOT NULL,
  "paymentProvider" TEXT,
  status TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  currency TEXT DEFAULT 'RWF',
  "vatAmountCents" INTEGER NOT NULL,
  "exVatAmountCents" INTEGER NOT NULL,
  "gatewayFeeEstimatedCents" INTEGER NOT NULL,
  "gatewayFeeActualCents" INTEGER,
  "platformFeeCents" INTEGER DEFAULT 0,
  "netToBusinessCents" INTEGER NOT NULL,
  "paymentLinkUrl" TEXT,
  "callbackUrl" TEXT,
  "payerName" TEXT,
  "payerEmail" TEXT,
  "payerPhone" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  "paidAt" TIMESTAMP,
  "expiryAt" TIMESTAMP,
  "webhookSignature" TEXT,
  "webhookTimestamp" BIGINT,
  "webhookVerified" BOOLEAN DEFAULT false,
  "rawRequest" JSONB,
  "rawCallback" JSONB,
  "rawStatus" JSONB,
  "subscriptionId" TEXT REFERENCES "Subscription"(id)
);

CREATE INDEX IF NOT EXISTS "PaymentTransaction_businessId_idx" ON "PaymentTransaction"("businessId");
CREATE INDEX IF NOT EXISTS "PaymentTransaction_invoiceNumber_idx" ON "PaymentTransaction"("invoiceNumber");
CREATE INDEX IF NOT EXISTS "PaymentTransaction_status_idx" ON "PaymentTransaction"(status);
CREATE INDEX IF NOT EXISTS "PaymentTransaction_gateway_idx" ON "PaymentTransaction"(gateway);
CREATE INDEX IF NOT EXISTS "PaymentTransaction_createdAt_idx" ON "PaymentTransaction"("createdAt");

CREATE TABLE IF NOT EXISTS "AffiliateCommissionNew" (
  id TEXT PRIMARY KEY,
  "affiliateId" TEXT NOT NULL REFERENCES "User"(id),
  "businessId" TEXT NOT NULL REFERENCES "Restaurant"(id),
  "subscriptionId" TEXT NOT NULL REFERENCES "Subscription"(id),
  "paymentTransactionId" TEXT NOT NULL REFERENCES "PaymentTransaction"(id),
  "commissionType" TEXT NOT NULL,
  "commissionRate" DOUBLE PRECISION NOT NULL,
  "baseAmountCents" INTEGER NOT NULL,
  "commissionAmountCents" INTEGER NOT NULL,
  status TEXT NOT NULL,
  "accrualDate" TIMESTAMP DEFAULT NOW(),
  "lockUntil" TIMESTAMP NOT NULL,
  "payoutDate" TIMESTAMP,
  "payoutBatchId" TEXT,
  "clawbackReason" TEXT,
  "clawbackDate" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "AffiliateCommissionNew_affiliateId_idx" ON "AffiliateCommissionNew"("affiliateId");
CREATE INDEX IF NOT EXISTS "AffiliateCommissionNew_businessId_idx" ON "AffiliateCommissionNew"("businessId");
CREATE INDEX IF NOT EXISTS "AffiliateCommissionNew_status_idx" ON "AffiliateCommissionNew"(status);
CREATE INDEX IF NOT EXISTS "AffiliateCommissionNew_lockUntil_idx" ON "AffiliateCommissionNew"("lockUntil");

-- Step 4: Update indexes and constraints (indexes only here)
DROP INDEX IF EXISTS "Table_restaurantId_number_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Table_businessId_number_key" ON "Table"("businessId", number);

DROP INDEX IF EXISTS "Customer_restaurantId_phone_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_businessId_phone_key" ON "Customer"("businessId", phone);

DROP INDEX IF EXISTS "AffiliateCommission_affiliateId_restaurantId_idx";
CREATE INDEX IF NOT EXISTS "AffiliateCommission_affiliateId_businessId_idx" ON "AffiliateCommission"("affiliateId", "businessId");

DROP INDEX IF EXISTS "SmartDiningSlip_restaurantId_idx";
CREATE INDEX IF NOT EXISTS "SmartDiningSlip_businessId_idx" ON "SmartDiningSlip"("businessId");

DROP INDEX IF EXISTS "PurchaseOrder_restaurantId_idx";
CREATE INDEX IF NOT EXISTS "PurchaseOrder_businessId_idx" ON "PurchaseOrder"("businessId");

DROP INDEX IF EXISTS "GoodsReceivedNote_restaurantId_idx";
CREATE INDEX IF NOT EXISTS "GoodsReceivedNote_businessId_idx" ON "GoodsReceivedNote"("businessId");
