/*
  Warnings:

  - You are about to drop the column `restaurantId` on the `AffiliateCommission` table. All the data in the column will be lost.
  - The primary key for the `AuditLog` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `restaurantId` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `redeemedRestaurantId` on the `DiningCredit` table. All the data in the column will be lost.
  - You are about to drop the column `restaurantId` on the `FeeConfiguration` table. All the data in the column will be lost.
  - You are about to drop the column `restaurantId` on the `GoodsReceivedNote` table. All the data in the column will be lost.
  - You are about to drop the column `restaurantId` on the `InventoryItem` table. All the data in the column will be lost.
  - You are about to drop the column `restaurantId` on the `InventoryUpdate` table. All the data in the column will be lost.
  - You are about to drop the column `restaurantId` on the `MarketplaceOrder` table. All the data in the column will be lost.
  - You are about to drop the column `restaurantId` on the `MenuItem` table. All the data in the column will be lost.
  - You are about to drop the column `restaurantId` on the `PurchaseOrder` table. All the data in the column will be lost.
  - You are about to drop the column `restaurantId` on the `ReferralLink` table. All the data in the column will be lost.
  - You are about to drop the column `restaurantId` on the `Sale` table. All the data in the column will be lost.
  - You are about to drop the column `restaurantId` on the `SlipTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `buyerRestaurantId` on the `SmartDiningSlip` table. All the data in the column will be lost.
  - You are about to drop the column `restaurantId` on the `SmartDiningSlip` table. All the data in the column will be lost.
  - You are about to drop the column `restaurantLogo` on the `SmartDiningSlip` table. All the data in the column will be lost.
  - You are about to drop the column `restaurantName` on the `SmartDiningSlip` table. All the data in the column will be lost.
  - You are about to drop the column `restaurantId` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `restaurantId` on the `SupplierOrder` table. All the data in the column will be lost.
  - You are about to drop the column `restaurantId` on the `Table` table. All the data in the column will be lost.
  - You are about to drop the column `restaurantId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `restaurantId` on the `WhatsAppMessage` table. All the data in the column will be lost.
  - You are about to drop the `CostAnomalyAlert` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ReorderSuggestionLog` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[businessId,phone]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[businessId]` on the table `FeeConfiguration` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[paymentTransactionId]` on the table `Sale` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[businessId]` on the table `SlipTemplate` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[qrCode]` on the table `Table` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[businessId,number]` on the table `Table` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[affiliateCode]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `businessId` to the `AffiliateCommission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `GoodsReceivedNote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `InventoryItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `InventoryUpdate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `MarketplaceOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `MenuItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `PurchaseOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `ReferralLink` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `Sale` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `SlipTemplate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `SmartDiningSlip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessName` to the `SmartDiningSlip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `Subscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `SupplierOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `Table` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `WhatsAppMessage` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TaxMode" AS ENUM ('INCLUSIVE', 'EXCLUSIVE');

-- CreateEnum
CREATE TYPE "PaymentGateway" AS ENUM ('IREMBO_PAY', 'PESAPAL', 'CASH', 'MTN_MONEY', 'AIRTEL_MONEY', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('MTN', 'AIRTEL');

-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('RECURRING', 'WELCOME_RECRUITER');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('ACCRUED', 'LOCKED', 'AVAILABLE', 'PAID', 'CLAWBACK');

-- CreateEnum
CREATE TYPE "OrderSource" AS ENUM ('WAITER_POS', 'QR_IN_VENUE', 'QR_REMOTE', 'WHATSAPP', 'POS');

-- CreateEnum
CREATE TYPE "InsightPeriodType" AS ENUM ('WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "OutletType" AS ENUM ('RESTAURANT', 'BAR', 'POOL_BAR', 'CAFE', 'ROOM_SERVICE', 'LOUNGE', 'SPA', 'TERRACE', 'BEACH_BAR');

-- CreateEnum
CREATE TYPE "TaxType" AS ENUM ('VAT', 'SERVICE_CHARGE', 'TOURISM_LEVY', 'SALES_TAX', 'CITY_TAX');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'CONVERTED', 'REWARDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'SEATED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "BusinessInviteStatus" AS ENUM ('PENDING', 'SIGNED_UP', 'QUALIFYING', 'QUALIFIED', 'CREDITED', 'EXPIRED', 'FRAUD_FLAGGED');

-- CreateEnum
CREATE TYPE "InviteCreditStatus" AS ENUM ('PENDING', 'LOCKED', 'ACTIVE', 'APPLIED', 'EXPIRED', 'VOIDED');

-- CreateEnum
CREATE TYPE "SalePaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "StaffTipStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "SupplierInsightsTier" AS ENUM ('BASIC', 'PREMIUM', 'ENTERPRISE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentMethod" ADD VALUE 'WEB';
ALTER TYPE "PaymentMethod" ADD VALUE 'MOMO_PUSH';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentStatus" ADD VALUE 'INITIATED';
ALTER TYPE "PaymentStatus" ADD VALUE 'PAID';
ALTER TYPE "PaymentStatus" ADD VALUE 'EXPIRED';
ALTER TYPE "PaymentStatus" ADD VALUE 'CANCELLED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'SUPERVISOR';
ALTER TYPE "UserRole" ADD VALUE 'MANAGER';
ALTER TYPE "UserRole" ADD VALUE 'FRONT_DESK';
ALTER TYPE "UserRole" ADD VALUE 'WAITER';

-- DropForeignKey
ALTER TABLE "AffiliateCommission" DROP CONSTRAINT "AffiliateCommission_restaurantId_fkey";

-- DropForeignKey
ALTER TABLE "CostAnomalyAlert" DROP CONSTRAINT "CostAnomalyAlert_grnItemId_fkey";

-- DropForeignKey
ALTER TABLE "CostAnomalyAlert" DROP CONSTRAINT "CostAnomalyAlert_restaurantId_fkey";

-- DropForeignKey
ALTER TABLE "CostAnomalyAlert" DROP CONSTRAINT "CostAnomalyAlert_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "Customer" DROP CONSTRAINT "Customer_restaurantId_fkey";

-- DropForeignKey
ALTER TABLE "GoodsReceivedNote" DROP CONSTRAINT "GoodsReceivedNote_restaurantId_fkey";

-- DropForeignKey
ALTER TABLE "InventoryItem" DROP CONSTRAINT "InventoryItem_restaurantId_fkey";

-- DropForeignKey
ALTER TABLE "InventoryUpdate" DROP CONSTRAINT "InventoryUpdate_restaurantId_fkey";

-- DropForeignKey
ALTER TABLE "MarketplaceOrder" DROP CONSTRAINT "MarketplaceOrder_restaurantId_fkey";

-- DropForeignKey
ALTER TABLE "MenuItem" DROP CONSTRAINT "MenuItem_restaurantId_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseOrder" DROP CONSTRAINT "PurchaseOrder_restaurantId_fkey";

-- DropForeignKey
ALTER TABLE "ReorderSuggestionLog" DROP CONSTRAINT "ReorderSuggestionLog_inventoryItemId_fkey";

-- DropForeignKey
ALTER TABLE "ReorderSuggestionLog" DROP CONSTRAINT "ReorderSuggestionLog_restaurantId_fkey";

-- DropForeignKey
ALTER TABLE "ReorderSuggestionLog" DROP CONSTRAINT "ReorderSuggestionLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_restaurantId_fkey";

-- DropForeignKey
ALTER TABLE "SmartDiningSlip" DROP CONSTRAINT "SmartDiningSlip_buyerRestaurantId_fkey";

-- DropForeignKey
ALTER TABLE "SmartDiningSlip" DROP CONSTRAINT "SmartDiningSlip_saleId_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_restaurantId_fkey";

-- DropForeignKey
ALTER TABLE "SupplierOrder" DROP CONSTRAINT "SupplierOrder_restaurantId_fkey";

-- DropForeignKey
ALTER TABLE "Table" DROP CONSTRAINT "Table_restaurantId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_restaurantId_fkey";

-- DropForeignKey
ALTER TABLE "WhatsAppMessage" DROP CONSTRAINT "WhatsAppMessage_restaurantId_fkey";

-- DropIndex
DROP INDEX "AffiliateCommission_affiliateId_restaurantId_idx";

-- DropIndex
DROP INDEX "Customer_restaurantId_phone_key";

-- DropIndex
DROP INDEX "FeeConfiguration_restaurantId_key";

-- DropIndex
DROP INDEX "GoodsReceivedNote_restaurantId_idx";

-- DropIndex
DROP INDEX "PurchaseOrder_restaurantId_idx";

-- DropIndex
DROP INDEX "SlipTemplate_restaurantId_key";

-- DropIndex
DROP INDEX "SmartDiningSlip_domain_idx";

-- DropIndex
DROP INDEX "SmartDiningSlip_purchaseOrderId_idx";

-- DropIndex
DROP INDEX "SmartDiningSlip_restaurantId_idx";

-- DropIndex
DROP INDEX "SmartDiningSlip_supplierId_idx";

-- DropIndex
DROP INDEX "Table_restaurantId_number_key";

-- AlterTable
ALTER TABLE "AffiliateCommission" DROP COLUMN "restaurantId",
ADD COLUMN     "businessId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "restaurantId",
ADD COLUMN     "businessId" TEXT NOT NULL,
ADD COLUMN     "lastOtpRequestAt" TIMESTAMP(3),
ADD COLUMN     "lifetimeSpendCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "otpAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phoneVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "vipTier" TEXT NOT NULL DEFAULT 'NONE';

-- AlterTable
ALTER TABLE "DiningCredit" DROP COLUMN "redeemedRestaurantId",
ADD COLUMN     "redeemedBusinessId" TEXT;

-- AlterTable
ALTER TABLE "FeeConfiguration" DROP COLUMN "restaurantId",
ADD COLUMN     "businessId" TEXT;

-- AlterTable
ALTER TABLE "GoodsReceivedNote" DROP COLUMN "restaurantId",
ADD COLUMN     "businessId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "GoodsReceivedNoteItem" ALTER COLUMN "orderedQuantity" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "receivedQuantity" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "InventoryItem" DROP COLUMN "restaurantId",
ADD COLUMN     "businessId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "InventoryUpdate" DROP COLUMN "restaurantId",
ADD COLUMN     "businessId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "MarketplaceOrder" DROP COLUMN "restaurantId",
ADD COLUMN     "businessId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "MenuItem" DROP COLUMN "restaurantId",
ADD COLUMN     "allergens" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "businessId" TEXT NOT NULL,
ADD COLUMN     "dietaryTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "imageReal" TEXT,
ADD COLUMN     "ingredients" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "portionSize" TEXT DEFAULT 'single',
ADD COLUMN     "prepTimeMinutes" INTEGER,
ADD COLUMN     "spiceLevel" TEXT DEFAULT 'none';

-- AlterTable
ALTER TABLE "PurchaseOrder" DROP COLUMN "restaurantId",
ADD COLUMN     "businessId" TEXT NOT NULL,
ALTER COLUMN "vatRate" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "PurchaseOrderItem" ALTER COLUMN "quantity" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "ReferralLink" DROP COLUMN "restaurantId",
ADD COLUMN     "businessId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "businessType" TEXT,
ADD COLUMN     "cmsNotifyTrending" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dailyReportEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "dailyReportLocalTime" TEXT NOT NULL DEFAULT '07:30',
ADD COLUMN     "defaultDepositPercent" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
ADD COLUMN     "defaultLanguage" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "enableDigitalTipping" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "enableQRInVenue" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "enableQRRemote" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "followUpDay10Done" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "followUpDay13Done" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "followUpDay2Done" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "followUpDay5Done" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "freeMonthsGranted" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastDailyReportSentForDate" TEXT,
ADD COLUMN     "maxRemoteOrdersPerSlot" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "nextAction" TEXT,
ADD COLUMN     "nextActionCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nextActionDate" TIMESTAMP(3),
ADD COLUMN     "prepBufferMinutes" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "requireDepositRemote" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "salesNotes" TEXT,
ADD COLUMN     "salesStatus" TEXT DEFAULT 'LEAD',
ADD COLUMN     "slotDurationMinutes" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "splitPaymentConvenienceFeeEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "splitPaymentConvenienceFeePercent" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
ADD COLUMN     "taxMode" "TaxMode" NOT NULL DEFAULT 'EXCLUSIVE',
ADD COLUMN     "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 18.0,
ADD COLUMN     "trialEndDate" TIMESTAMP(3),
ADD COLUMN     "trialStartDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Sale" DROP COLUMN "restaurantId",
ADD COLUMN     "businessId" TEXT NOT NULL,
ADD COLUMN     "customerConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "customerPhone" TEXT,
ADD COLUMN     "depositCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "kitchenReleasedAt" TIMESTAMP(3),
ADD COLUMN     "kitchenStatus" TEXT DEFAULT 'pending',
ADD COLUMN     "orderSource" "OrderSource" NOT NULL DEFAULT 'WAITER_POS',
ADD COLUMN     "outletId" TEXT,
ADD COLUMN     "paymentTransactionId" TEXT,
ADD COLUMN     "prepStartedAt" TIMESTAMP(3),
ADD COLUMN     "readyAt" TIMESTAMP(3),
ADD COLUMN     "scheduledAt" TIMESTAMP(3),
ADD COLUMN     "seatId" TEXT;

-- AlterTable
ALTER TABLE "SaleItem" ADD COLUMN     "instructionTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "instructions" JSONB;

-- AlterTable
ALTER TABLE "SlipTemplate" DROP COLUMN "restaurantId",
ADD COLUMN     "businessId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SmartDiningSlip" DROP COLUMN "buyerRestaurantId",
DROP COLUMN "restaurantId",
DROP COLUMN "restaurantLogo",
DROP COLUMN "restaurantName",
ADD COLUMN     "businessId" TEXT NOT NULL,
ADD COLUMN     "businessLogo" TEXT,
ADD COLUMN     "businessName" TEXT NOT NULL,
ADD COLUMN     "buyerBusinessId" TEXT,
ADD COLUMN     "taxMode" TEXT NOT NULL DEFAULT 'EXCLUSIVE';

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "restaurantId",
ADD COLUMN     "businessId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SupplierOrder" DROP COLUMN "restaurantId",
ADD COLUMN     "businessId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SupplierPayout" ALTER COLUMN "platformFeePercent" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Table" DROP COLUMN "restaurantId",
ADD COLUMN     "businessId" TEXT NOT NULL,
ADD COLUMN     "outletId" TEXT,
ADD COLUMN     "qrCode" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "restaurantId",
ADD COLUMN     "affiliateCode" TEXT,
ADD COLUMN     "affiliateCookieExpiry" TIMESTAMP(3),
ADD COLUMN     "affiliateEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "businessId" TEXT,
ADD COLUMN     "referredByAffiliateId" TEXT;

-- AlterTable
ALTER TABLE "WhatsAppMessage" DROP COLUMN "restaurantId",
ADD COLUMN     "businessId" TEXT NOT NULL;

-- DropTable
DROP TABLE "CostAnomalyAlert";

-- DropTable
DROP TABLE "ReorderSuggestionLog";

-- CreateTable
CREATE TABLE "ContentPost" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "mediaIds" TEXT[],
    "comboItems" JSONB,
    "promoMeta" JSONB,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishAt" TIMESTAMP(3),
    "expireAt" TIMESTAMP(3),
    "targeting" JSONB,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "durationSec" INTEGER,
    "thumbnailKey" TEXT,
    "sizeBytes" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostEngagement" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostEngagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostAttribution" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "attributedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostAttribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "referenceId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RWF',
    "vatAmountCents" INTEGER NOT NULL,
    "exVatAmountCents" INTEGER NOT NULL,
    "gatewayFeeEstimatedCents" INTEGER NOT NULL,
    "gatewayFeeActualCents" INTEGER,
    "platformFeeCents" INTEGER NOT NULL DEFAULT 0,
    "netToBusinessCents" INTEGER NOT NULL,
    "paymentLinkUrl" TEXT,
    "callbackUrl" TEXT,
    "payerName" TEXT,
    "payerEmail" TEXT,
    "payerPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "expiryAt" TIMESTAMP(3),
    "webhookSignature" TEXT,
    "webhookTimestamp" BIGINT,
    "webhookVerified" BOOLEAN NOT NULL DEFAULT false,
    "rawRequest" JSONB,
    "rawCallback" JSONB,
    "rawStatus" JSONB,
    "subscriptionId" TEXT,
    "gateway" "PaymentGateway" NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentProvider" "PaymentProvider",
    "status" "PaymentStatus" NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateCommissionNew" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "paymentTransactionId" TEXT NOT NULL,
    "commissionRate" DOUBLE PRECISION NOT NULL,
    "baseAmountCents" INTEGER NOT NULL,
    "commissionAmountCents" INTEGER NOT NULL,
    "accrualDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockUntil" TIMESTAMP(3) NOT NULL,
    "payoutDate" TIMESTAMP(3),
    "payoutBatchId" TEXT,
    "clawbackReason" TEXT,
    "clawbackDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "commissionType" "CommissionType" NOT NULL,
    "status" "CommissionStatus" NOT NULL,

    CONSTRAINT "AffiliateCommissionNew_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessInsightReport" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "periodType" "InsightPeriodType" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "kpiSnapshot" JSONB NOT NULL,
    "insightText" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "estimatedCostCents" INTEGER,
    "triggerSource" TEXT NOT NULL DEFAULT 'AUTO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessInsightReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderToken" (
    "id" TEXT NOT NULL,
    "jti" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "tableId" TEXT,
    "source" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisposableEmailDomain" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "domain" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisposableEmailDomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrialEligibility" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "hashedPhone" TEXT NOT NULL,
    "hashedEmail" TEXT NOT NULL,
    "deviceFingerprint" TEXT,
    "ipRange" TEXT,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "blockReason" TEXT,
    "trialUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrialEligibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "autoEnableThreshold" INTEGER,
    "planGated" BOOLEAN NOT NULL DEFAULT false,
    "minimumPlan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessFeatureOverride" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "featureFlagId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessFeatureOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformMetrics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activeBusinessCount" INTEGER NOT NULL DEFAULT 0,
    "totalBusinessCount" INTEGER NOT NULL DEFAULT 0,
    "totalSalesCount" INTEGER NOT NULL DEFAULT 0,
    "totalRevenueCents" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "city" TEXT,
    "district" TEXT,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Outlet" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "branchId" TEXT,
    "name" TEXT NOT NULL,
    "type" "OutletType" NOT NULL DEFAULT 'RESTAURANT',
    "description" TEXT,
    "address" TEXT,
    "city" TEXT,
    "district" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "qrCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Outlet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Seat" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "seatNumber" INTEGER NOT NULL,
    "seatLabel" TEXT,
    "qrCode" TEXT,
    "qrDesign" JSONB,
    "position" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Seat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItemTranslation" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "MenuItemTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointsLedger" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "businessId" TEXT,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "saleId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointsLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyRule" (
    "id" TEXT NOT NULL,
    "businessId" TEXT,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "config" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuSourceDocument" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UPLOADED',
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenuSourceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItemCandidate" (
    "id" TEXT NOT NULL,
    "sourceDocumentId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "priceCents" INTEGER,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "rawData" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "publishedItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenuItemCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "branchId" TEXT,
    "roomNumber" TEXT NOT NULL,
    "floor" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "guestName" TEXT,
    "guestPhone" TEXT,
    "checkInDate" TIMESTAMP(3),
    "checkOutDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceArea" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "branchId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "areaType" TEXT NOT NULL DEFAULT 'TABLE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessProfile" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT,
    "coverImageUrl" TEXT,
    "logoUrl" TEXT,
    "cuisineTypes" TEXT[],
    "priceRange" TEXT,
    "openingHours" JSONB,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessReview" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT,
    "saleId" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "response" TEXT,
    "respondedAt" TIMESTAMP(3),
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profileId" TEXT,

    CONSTRAINT "BusinessReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "daysOfWeek" INTEGER[],
    "timeStart" TEXT,
    "timeEnd" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageLimit" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionRedemption" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "discountCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromotionRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconciliationLog" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "transactionId" TEXT,
    "invoiceNumber" TEXT,
    "status" TEXT NOT NULL,
    "expectedAmountCents" INTEGER,
    "actualAmountCents" INTEGER,
    "discrepancyCents" INTEGER,
    "resolvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReconciliationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppTemplate" (
    "id" TEXT NOT NULL,
    "businessId" TEXT,
    "name" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "components" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxConfiguration" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "taxType" "TaxType" NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "isInclusive" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerReferral" (
    "id" TEXT NOT NULL,
    "referrerPhone" TEXT NOT NULL,
    "referrerName" TEXT,
    "referralCode" TEXT NOT NULL,
    "businessId" TEXT,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "rewardCents" INTEGER NOT NULL DEFAULT 500000,
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerReferral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "reservationDate" TIMESTAMP(3) NOT NULL,
    "reservationTime" TEXT NOT NULL,
    "reservedAt" TIMESTAMP(3) NOT NULL,
    "partySize" INTEGER NOT NULL,
    "tableId" TEXT,
    "specialRequests" TEXT,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "confirmationCode" TEXT NOT NULL,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "reminderSentAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "forfeitCents" INTEGER NOT NULL DEFAULT 0,
    "noShowReason" TEXT,
    "depositAmountCents" INTEGER NOT NULL DEFAULT 0,
    "depositCents" INTEGER NOT NULL DEFAULT 0,
    "depositPaidAt" TIMESTAMP(3),
    "depositRefundedAt" TIMESTAMP(3),
    "depositStatus" TEXT,
    "paymentTransactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomDomain" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "verificationToken" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "lastCheckedAt" TIMESTAMP(3),
    "sslStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "sslExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomDomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessInvite" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "inviteeId" TEXT,
    "status" "BusinessInviteStatus" NOT NULL DEFAULT 'PENDING',
    "qualifiedAt" TIMESTAMP(3),
    "creditLockedUntil" TIMESTAMP(3),
    "creditIssuedAt" TIMESTAMP(3),
    "flaggedForReview" BOOLEAN NOT NULL DEFAULT false,
    "flagReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InviteCredit" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "inviteId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'REFERRER',
    "amountCents" INTEGER NOT NULL,
    "status" "InviteCreditStatus" NOT NULL DEFAULT 'PENDING',
    "lockedUntil" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "appliedToInvoiceId" TEXT,
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InviteCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalePayment" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "payerName" TEXT,
    "payerPhone" TEXT,
    "payerEmail" TEXT,
    "amountCents" INTEGER NOT NULL,
    "itemIds" TEXT[],
    "status" "SalePaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentTransactionId" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SplitPaymentWhatsAppTrigger" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tablePersonCount" INTEGER NOT NULL,
    "unpaidBalanceCents" INTEGER NOT NULL,
    "recipientPhone" TEXT NOT NULL,
    "linkSent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SplitPaymentWhatsAppTrigger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffTip" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "platformFeeCents" INTEGER NOT NULL,
    "netToStaffCents" INTEGER NOT NULL,
    "tipType" TEXT NOT NULL DEFAULT 'ROUND_UP',
    "status" "StaffTipStatus" NOT NULL DEFAULT 'PENDING',
    "paymentTransactionId" TEXT,
    "seatId" TEXT,
    "paidAt" TIMESTAMP(3),
    "payoutAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffTip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipChoice" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL,
    "suggestedAmountCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TipChoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierInsightsSubscription" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "tier" "SupplierInsightsTier" NOT NULL DEFAULT 'BASIC',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierInsightsSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformFeeConfig" (
    "id" TEXT NOT NULL,
    "feeType" TEXT NOT NULL,
    "feePercent" DOUBLE PRECISION NOT NULL,
    "minAmountCents" INTEGER,
    "maxAmountCents" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformFeeConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentPost_businessId_status_publishAt_idx" ON "ContentPost"("businessId", "status", "publishAt");

-- CreateIndex
CREATE INDEX "ContentPost_status_publishAt_idx" ON "ContentPost"("status", "publishAt");

-- CreateIndex
CREATE INDEX "MediaAsset_businessId_type_idx" ON "MediaAsset"("businessId", "type");

-- CreateIndex
CREATE INDEX "PostEngagement_postId_type_idx" ON "PostEngagement"("postId", "type");

-- CreateIndex
CREATE INDEX "PostEngagement_createdAt_idx" ON "PostEngagement"("createdAt");

-- CreateIndex
CREATE INDEX "PostAttribution_postId_orderId_idx" ON "PostAttribution"("postId", "orderId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_invoiceNumber_key" ON "PaymentTransaction"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_transactionId_key" ON "PaymentTransaction"("transactionId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_businessId_idx" ON "PaymentTransaction"("businessId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_invoiceNumber_idx" ON "PaymentTransaction"("invoiceNumber");

-- CreateIndex
CREATE INDEX "PaymentTransaction_status_idx" ON "PaymentTransaction"("status");

-- CreateIndex
CREATE INDEX "PaymentTransaction_gateway_idx" ON "PaymentTransaction"("gateway");

-- CreateIndex
CREATE INDEX "PaymentTransaction_createdAt_idx" ON "PaymentTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "AffiliateCommissionNew_affiliateId_idx" ON "AffiliateCommissionNew"("affiliateId");

-- CreateIndex
CREATE INDEX "AffiliateCommissionNew_businessId_idx" ON "AffiliateCommissionNew"("businessId");

-- CreateIndex
CREATE INDEX "AffiliateCommissionNew_status_idx" ON "AffiliateCommissionNew"("status");

-- CreateIndex
CREATE INDEX "AffiliateCommissionNew_lockUntil_idx" ON "AffiliateCommissionNew"("lockUntil");

-- CreateIndex
CREATE INDEX "BusinessInsightReport_businessId_periodStart_idx" ON "BusinessInsightReport"("businessId", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessInsightReport_businessId_periodType_periodStart_key" ON "BusinessInsightReport"("businessId", "periodType", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "OrderToken_jti_key" ON "OrderToken"("jti");

-- CreateIndex
CREATE INDEX "OrderToken_jti_idx" ON "OrderToken"("jti");

-- CreateIndex
CREATE INDEX "OrderToken_expiresAt_idx" ON "OrderToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "DisposableEmailDomain_domain_key" ON "DisposableEmailDomain"("domain");

-- CreateIndex
CREATE INDEX "DisposableEmailDomain_domain_idx" ON "DisposableEmailDomain"("domain");

-- CreateIndex
CREATE INDEX "TrialEligibility_blocked_idx" ON "TrialEligibility"("blocked");

-- CreateIndex
CREATE INDEX "TrialEligibility_deviceFingerprint_idx" ON "TrialEligibility"("deviceFingerprint");

-- CreateIndex
CREATE INDEX "TrialEligibility_hashedEmail_idx" ON "TrialEligibility"("hashedEmail");

-- CreateIndex
CREATE INDEX "TrialEligibility_hashedPhone_idx" ON "TrialEligibility"("hashedPhone");

-- CreateIndex
CREATE INDEX "TrialEligibility_ipRange_idx" ON "TrialEligibility"("ipRange");

-- CreateIndex
CREATE INDEX "TrialEligibility_riskScore_idx" ON "TrialEligibility"("riskScore");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_key_key" ON "FeatureFlag"("key");

-- CreateIndex
CREATE INDEX "FeatureFlag_key_idx" ON "FeatureFlag"("key");

-- CreateIndex
CREATE INDEX "BusinessFeatureOverride_businessId_idx" ON "BusinessFeatureOverride"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessFeatureOverride_businessId_featureFlagId_key" ON "BusinessFeatureOverride"("businessId", "featureFlagId");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformMetrics_date_key" ON "PlatformMetrics"("date");

-- CreateIndex
CREATE INDEX "PlatformMetrics_date_idx" ON "PlatformMetrics"("date");

-- CreateIndex
CREATE INDEX "Branch_businessId_isActive_idx" ON "Branch"("businessId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_businessId_name_key" ON "Branch"("businessId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Outlet_qrCode_key" ON "Outlet"("qrCode");

-- CreateIndex
CREATE INDEX "Outlet_businessId_isActive_idx" ON "Outlet"("businessId", "isActive");

-- CreateIndex
CREATE INDEX "Outlet_branchId_idx" ON "Outlet"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Outlet_businessId_name_key" ON "Outlet"("businessId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Seat_qrCode_key" ON "Seat"("qrCode");

-- CreateIndex
CREATE INDEX "Seat_tableId_idx" ON "Seat"("tableId");

-- CreateIndex
CREATE INDEX "Seat_qrCode_idx" ON "Seat"("qrCode");

-- CreateIndex
CREATE UNIQUE INDEX "Seat_tableId_seatNumber_key" ON "Seat"("tableId", "seatNumber");

-- CreateIndex
CREATE INDEX "MenuItemTranslation_menuItemId_idx" ON "MenuItemTranslation"("menuItemId");

-- CreateIndex
CREATE INDEX "MenuItemTranslation_businessId_locale_idx" ON "MenuItemTranslation"("businessId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "MenuItemTranslation_menuItemId_locale_key" ON "MenuItemTranslation"("menuItemId", "locale");

-- CreateIndex
CREATE INDEX "PointsLedger_customerId_createdAt_idx" ON "PointsLedger"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "PointsLedger_businessId_createdAt_idx" ON "PointsLedger"("businessId", "createdAt");

-- CreateIndex
CREATE INDEX "LoyaltyRule_businessId_isActive_idx" ON "LoyaltyRule"("businessId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "MenuSourceDocument_fileHash_key" ON "MenuSourceDocument"("fileHash");

-- CreateIndex
CREATE INDEX "MenuSourceDocument_businessId_status_idx" ON "MenuSourceDocument"("businessId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MenuItemCandidate_publishedItemId_key" ON "MenuItemCandidate"("publishedItemId");

-- CreateIndex
CREATE INDEX "MenuItemCandidate_businessId_status_idx" ON "MenuItemCandidate"("businessId", "status");

-- CreateIndex
CREATE INDEX "MenuItemCandidate_sourceDocumentId_idx" ON "MenuItemCandidate"("sourceDocumentId");

-- CreateIndex
CREATE INDEX "Room_businessId_status_idx" ON "Room"("businessId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Room_businessId_roomNumber_key" ON "Room"("businessId", "roomNumber");

-- CreateIndex
CREATE INDEX "ServiceArea_businessId_isActive_idx" ON "ServiceArea"("businessId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessProfile_businessId_key" ON "BusinessProfile"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessProfile_slug_key" ON "BusinessProfile"("slug");

-- CreateIndex
CREATE INDEX "BusinessProfile_isPublished_idx" ON "BusinessProfile"("isPublished");

-- CreateIndex
CREATE INDEX "BusinessProfile_slug_idx" ON "BusinessProfile"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessReview_saleId_key" ON "BusinessReview"("saleId");

-- CreateIndex
CREATE INDEX "BusinessReview_businessId_isPublished_idx" ON "BusinessReview"("businessId", "isPublished");

-- CreateIndex
CREATE INDEX "Promotion_businessId_isActive_idx" ON "Promotion"("businessId", "isActive");

-- CreateIndex
CREATE INDEX "Promotion_startDate_endDate_idx" ON "Promotion"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionRedemption_saleId_key" ON "PromotionRedemption"("saleId");

-- CreateIndex
CREATE INDEX "PromotionRedemption_promotionId_idx" ON "PromotionRedemption"("promotionId");

-- CreateIndex
CREATE INDEX "ReconciliationLog_businessId_createdAt_idx" ON "ReconciliationLog"("businessId", "createdAt");

-- CreateIndex
CREATE INDEX "ReconciliationLog_status_idx" ON "ReconciliationLog"("status");

-- CreateIndex
CREATE INDEX "WhatsAppTemplate_status_idx" ON "WhatsAppTemplate"("status");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppTemplate_name_language_key" ON "WhatsAppTemplate"("name", "language");

-- CreateIndex
CREATE INDEX "TaxConfiguration_businessId_isActive_idx" ON "TaxConfiguration"("businessId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TaxConfiguration_businessId_taxType_name_key" ON "TaxConfiguration"("businessId", "taxType", "name");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerReferral_referralCode_key" ON "CustomerReferral"("referralCode");

-- CreateIndex
CREATE INDEX "CustomerReferral_referralCode_idx" ON "CustomerReferral"("referralCode");

-- CreateIndex
CREATE INDEX "CustomerReferral_referrerPhone_idx" ON "CustomerReferral"("referrerPhone");

-- CreateIndex
CREATE INDEX "CustomerReferral_status_idx" ON "CustomerReferral"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_confirmationCode_key" ON "Reservation"("confirmationCode");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_paymentTransactionId_key" ON "Reservation"("paymentTransactionId");

-- CreateIndex
CREATE INDEX "Reservation_businessId_idx" ON "Reservation"("businessId");

-- CreateIndex
CREATE INDEX "Reservation_customerId_idx" ON "Reservation"("customerId");

-- CreateIndex
CREATE INDEX "Reservation_reservationDate_idx" ON "Reservation"("reservationDate");

-- CreateIndex
CREATE INDEX "Reservation_status_idx" ON "Reservation"("status");

-- CreateIndex
CREATE INDEX "Reservation_confirmationCode_idx" ON "Reservation"("confirmationCode");

-- CreateIndex
CREATE INDEX "Reservation_depositStatus_idx" ON "Reservation"("depositStatus");

-- CreateIndex
CREATE INDEX "ActivityLog_businessId_createdAt_idx" ON "ActivityLog"("businessId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CustomDomain_hostname_key" ON "CustomDomain"("hostname");

-- CreateIndex
CREATE UNIQUE INDEX "CustomDomain_verificationToken_key" ON "CustomDomain"("verificationToken");

-- CreateIndex
CREATE INDEX "CustomDomain_businessId_idx" ON "CustomDomain"("businessId");

-- CreateIndex
CREATE INDEX "CustomDomain_status_idx" ON "CustomDomain"("status");

-- CreateIndex
CREATE INDEX "CustomDomain_hostname_idx" ON "CustomDomain"("hostname");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessInvite_code_key" ON "BusinessInvite"("code");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessInvite_inviteeId_key" ON "BusinessInvite"("inviteeId");

-- CreateIndex
CREATE INDEX "BusinessInvite_referrerId_idx" ON "BusinessInvite"("referrerId");

-- CreateIndex
CREATE INDEX "BusinessInvite_code_idx" ON "BusinessInvite"("code");

-- CreateIndex
CREATE INDEX "BusinessInvite_status_idx" ON "BusinessInvite"("status");

-- CreateIndex
CREATE INDEX "InviteCredit_businessId_status_idx" ON "InviteCredit"("businessId", "status");

-- CreateIndex
CREATE INDEX "InviteCredit_status_idx" ON "InviteCredit"("status");

-- CreateIndex
CREATE UNIQUE INDEX "InviteCredit_inviteId_role_key" ON "InviteCredit"("inviteId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "SalePayment_paymentTransactionId_key" ON "SalePayment"("paymentTransactionId");

-- CreateIndex
CREATE INDEX "SalePayment_saleId_idx" ON "SalePayment"("saleId");

-- CreateIndex
CREATE INDEX "SalePayment_status_idx" ON "SalePayment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SplitPaymentWhatsAppTrigger_saleId_key" ON "SplitPaymentWhatsAppTrigger"("saleId");

-- CreateIndex
CREATE INDEX "SplitPaymentWhatsAppTrigger_saleId_idx" ON "SplitPaymentWhatsAppTrigger"("saleId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffTip_paymentTransactionId_key" ON "StaffTip"("paymentTransactionId");

-- CreateIndex
CREATE INDEX "StaffTip_staffId_status_idx" ON "StaffTip"("staffId", "status");

-- CreateIndex
CREATE INDEX "StaffTip_businessId_idx" ON "StaffTip"("businessId");

-- CreateIndex
CREATE INDEX "StaffTip_saleId_idx" ON "StaffTip"("saleId");

-- CreateIndex
CREATE INDEX "TipChoice_saleId_idx" ON "TipChoice"("saleId");

-- CreateIndex
CREATE INDEX "TipChoice_accepted_idx" ON "TipChoice"("accepted");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierInsightsSubscription_supplierId_key" ON "SupplierInsightsSubscription"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierInsightsSubscription_supplierId_isActive_idx" ON "SupplierInsightsSubscription"("supplierId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformFeeConfig_feeType_key" ON "PlatformFeeConfig"("feeType");

-- CreateIndex
CREATE INDEX "PlatformFeeConfig_feeType_isActive_idx" ON "PlatformFeeConfig"("feeType", "isActive");

-- CreateIndex
CREATE INDEX "PlatformFeeConfig_effectiveFrom_effectiveUntil_idx" ON "PlatformFeeConfig"("effectiveFrom", "effectiveUntil");

-- CreateIndex
CREATE INDEX "AffiliateCommission_affiliateId_businessId_idx" ON "AffiliateCommission"("affiliateId", "businessId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_businessId_phone_key" ON "Customer"("businessId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "FeeConfiguration_businessId_key" ON "FeeConfiguration"("businessId");

-- CreateIndex
CREATE INDEX "GoodsReceivedNote_businessId_idx" ON "GoodsReceivedNote"("businessId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_businessId_idx" ON "PurchaseOrder"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_paymentTransactionId_key" ON "Sale"("paymentTransactionId");

-- CreateIndex
CREATE INDEX "Sale_orderSource_idx" ON "Sale"("orderSource");

-- CreateIndex
CREATE INDEX "Sale_scheduledAt_idx" ON "Sale"("scheduledAt");

-- CreateIndex
CREATE INDEX "Sale_businessId_orderSource_idx" ON "Sale"("businessId", "orderSource");

-- CreateIndex
CREATE INDEX "Sale_outletId_idx" ON "Sale"("outletId");

-- CreateIndex
CREATE INDEX "Sale_seatId_idx" ON "Sale"("seatId");

-- CreateIndex
CREATE UNIQUE INDEX "SlipTemplate_businessId_key" ON "SlipTemplate"("businessId");

-- CreateIndex
CREATE INDEX "SmartDiningSlip_businessId_idx" ON "SmartDiningSlip"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "Table_qrCode_key" ON "Table"("qrCode");

-- CreateIndex
CREATE INDEX "Table_outletId_idx" ON "Table"("outletId");

-- CreateIndex
CREATE UNIQUE INDEX "Table_businessId_number_key" ON "Table"("businessId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "User_affiliateCode_key" ON "User"("affiliateCode");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referredByAffiliateId_fkey" FOREIGN KEY ("referredByAffiliateId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_paymentTransactionId_fkey" FOREIGN KEY ("paymentTransactionId") REFERENCES "PaymentTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "Seat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryUpdate" ADD CONSTRAINT "InventoryUpdate_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierOrder" ADD CONSTRAINT "SupplierOrder_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentPost" ADD CONSTRAINT "ContentPost_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostEngagement" ADD CONSTRAINT "PostEngagement_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ContentPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostAttribution" ADD CONSTRAINT "PostAttribution_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostAttribution" ADD CONSTRAINT "PostAttribution_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostAttribution" ADD CONSTRAINT "PostAttribution_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ContentPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceOrder" ADD CONSTRAINT "MarketplaceOrder_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Table" ADD CONSTRAINT "Table_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Table" ADD CONSTRAINT "Table_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateCommission" ADD CONSTRAINT "AffiliateCommission_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartDiningSlip" ADD CONSTRAINT "SmartDiningSlip_buyerBusinessId_fkey" FOREIGN KEY ("buyerBusinessId") REFERENCES "Restaurant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartDiningSlip" ADD CONSTRAINT "SmartDiningSlip_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceivedNote" ADD CONSTRAINT "GoodsReceivedNote_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceivedNoteItem" ADD CONSTRAINT "GoodsReceivedNoteItem_poItemId_fkey" FOREIGN KEY ("poItemId") REFERENCES "PurchaseOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateCommissionNew" ADD CONSTRAINT "AffiliateCommissionNew_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateCommissionNew" ADD CONSTRAINT "AffiliateCommissionNew_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateCommissionNew" ADD CONSTRAINT "AffiliateCommissionNew_paymentTransactionId_fkey" FOREIGN KEY ("paymentTransactionId") REFERENCES "PaymentTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateCommissionNew" ADD CONSTRAINT "AffiliateCommissionNew_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessInsightReport" ADD CONSTRAINT "BusinessInsightReport_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessFeatureOverride" ADD CONSTRAINT "BusinessFeatureOverride_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessFeatureOverride" ADD CONSTRAINT "BusinessFeatureOverride_featureFlagId_fkey" FOREIGN KEY ("featureFlagId") REFERENCES "FeatureFlag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outlet" ADD CONSTRAINT "Outlet_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outlet" ADD CONSTRAINT "Outlet_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seat" ADD CONSTRAINT "Seat_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItemTranslation" ADD CONSTRAINT "MenuItemTranslation_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItemTranslation" ADD CONSTRAINT "MenuItemTranslation_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsLedger" ADD CONSTRAINT "PointsLedger_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsLedger" ADD CONSTRAINT "PointsLedger_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyRule" ADD CONSTRAINT "LoyaltyRule_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuSourceDocument" ADD CONSTRAINT "MenuSourceDocument_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItemCandidate" ADD CONSTRAINT "MenuItemCandidate_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItemCandidate" ADD CONSTRAINT "MenuItemCandidate_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "MenuSourceDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceArea" ADD CONSTRAINT "ServiceArea_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceArea" ADD CONSTRAINT "ServiceArea_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessProfile" ADD CONSTRAINT "BusinessProfile_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessReview" ADD CONSTRAINT "BusinessReview_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessReview" ADD CONSTRAINT "BusinessReview_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "BusinessProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRedemption" ADD CONSTRAINT "PromotionRedemption_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationLog" ADD CONSTRAINT "ReconciliationLog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxConfiguration" ADD CONSTRAINT "TaxConfiguration_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerReferral" ADD CONSTRAINT "CustomerReferral_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_paymentTransactionId_fkey" FOREIGN KEY ("paymentTransactionId") REFERENCES "PaymentTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomDomain" ADD CONSTRAINT "CustomDomain_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessInvite" ADD CONSTRAINT "BusinessInvite_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessInvite" ADD CONSTRAINT "BusinessInvite_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "Restaurant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteCredit" ADD CONSTRAINT "InviteCredit_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteCredit" ADD CONSTRAINT "InviteCredit_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "BusinessInvite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalePayment" ADD CONSTRAINT "SalePayment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalePayment" ADD CONSTRAINT "SalePayment_paymentTransactionId_fkey" FOREIGN KEY ("paymentTransactionId") REFERENCES "PaymentTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitPaymentWhatsAppTrigger" ADD CONSTRAINT "SplitPaymentWhatsAppTrigger_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffTip" ADD CONSTRAINT "StaffTip_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffTip" ADD CONSTRAINT "StaffTip_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffTip" ADD CONSTRAINT "StaffTip_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffTip" ADD CONSTRAINT "StaffTip_paymentTransactionId_fkey" FOREIGN KEY ("paymentTransactionId") REFERENCES "PaymentTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffTip" ADD CONSTRAINT "StaffTip_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "Seat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TipChoice" ADD CONSTRAINT "TipChoice_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierInsightsSubscription" ADD CONSTRAINT "SupplierInsightsSubscription_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "AuditLog_entity_combo_idx" RENAME TO "AuditLog_entityType_entityId_idx";
