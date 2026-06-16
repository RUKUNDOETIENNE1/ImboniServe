/*
  Warnings:

  - The values [MTN_MONEY,AIRTEL_MONEY] on the enum `PaymentGateway` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `depositAmountCents` on the `Reservation` table. All the data in the column will be lost.
  - The `status` column on the `Subscription` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `business_scans` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `status` on the `PaymentTransaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `checkoutMode` on table `TableSession` required. This step will fail if there are existing NULL values in that column.
  - Made the column `checkoutStatus` on table `TableSession` required. This step will fail if there are existing NULL values in that column.
  - Made the column `runningTotalCents` on table `TableSession` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "PaymentTransactionStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'GRACE_PERIOD', 'EXPIRED', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BillingEventType" AS ENUM ('PAYMENT_INITIATED', 'PAYMENT_PROCESSING', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'PAYMENT_CANCELLED', 'PAYMENT_REFUNDED', 'SUBSCRIPTION_ACTIVATED', 'SUBSCRIPTION_RENEWED', 'SUBSCRIPTION_EXPIRED', 'SUBSCRIPTION_CANCELLED', 'REMINDER_SENT');

-- CreateEnum
CREATE TYPE "ABTestStatus" AS ENUM ('DRAFT', 'RUNNING', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ABEventType" AS ENUM ('VIEW', 'CLICK', 'ORDER', 'REVENUE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('CLIENT', 'SUPPLIER', 'STAFF', 'CUSTOMER', 'PARTNER', 'LEAD');

-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'LEAD', 'BLOCKED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('RESTAURANT', 'HOTEL', 'SUPPLIER', 'DISTRIBUTOR', 'MANUFACTURER', 'SERVICE_PROVIDER', 'OTHER');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('WORKS_AT', 'OWNS', 'MANAGES', 'SUPPLIES_TO', 'PARTNERS_WITH', 'REPORTS_TO', 'CONTACTS', 'REFERRED_BY', 'CUSTOMER_OF');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('CALL', 'EMAIL', 'MEETING', 'NOTE', 'ORDER_PLACED', 'ORDER_DELIVERED', 'PAYMENT_RECEIVED', 'WHATSAPP_MESSAGE', 'SYSTEM_EVENT', 'TASK_CREATED', 'TASK_COMPLETED', 'CONTRACT_SIGNED', 'COMPLAINT', 'FEEDBACK');

-- CreateEnum
CREATE TYPE "SupportStatus" AS ENUM ('OPEN', 'PENDING', 'RESOLVED');

-- CreateEnum
CREATE TYPE "SupportPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH');

-- CreateEnum
CREATE TYPE "SupportSenderType" AS ENUM ('USER', 'STAFF', 'SYSTEM');

-- CreateEnum
CREATE TYPE "MarketerStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "MarketerCommissionType" AS ENUM ('SIGNUP_BONUS', 'RECURRING_REVENUE');

-- CreateEnum
CREATE TYPE "MarketerCommissionStatus" AS ENUM ('PENDING', 'VALIDATED', 'PAID', 'VOID');

-- CreateEnum
CREATE TYPE "PayoutMethod" AS ENUM ('MTN_MOBILE_MONEY', 'AIRTEL_MONEY', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'APPROVED', 'PROCESSING', 'PAID', 'FAILED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RevenueEventType" AS ENUM ('MARKETER_CREATED', 'MARKETER_SUSPENDED', 'ATTRIBUTION_RECORDED', 'COMMISSION_CREATED', 'COMMISSION_VALIDATED', 'COMMISSION_PAID', 'WALLET_UPDATED', 'PAYOUT_REQUESTED', 'PAYOUT_APPROVED', 'PAYOUT_REJECTED', 'PAYOUT_PROCESSING', 'PAYOUT_PAID', 'PAYOUT_FAILED', 'RISK_SCORE_UPDATED', 'ALERT_TRIGGERED');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "DemoRequestStatus" AS ENUM ('PENDING', 'CONTACTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StationType" AS ENUM ('KITCHEN', 'BAR', 'GRILL', 'FRYER', 'PASTRY', 'EXPO', 'OTHER');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('NEW', 'PREPARING', 'READY', 'DELIVERED', 'CANCELED');

-- CreateEnum
CREATE TYPE "MutationType" AS ENUM ('CREATED', 'MODIFIED', 'REPLACED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExpoStatus" AS ENUM ('PENDING', 'READY_FOR_EXPO', 'EXPO_CONFIRMED', 'SERVED_CONFIRMED');

-- CreateEnum
CREATE TYPE "TicketEventType" AS ENUM ('ORDER_CREATED', 'ORDER_UPDATED', 'ITEM_ROUTED', 'ITEM_ACCEPTED', 'ITEM_PREPARING', 'ITEM_READY', 'ITEM_DELIVERED', 'ITEM_CANCELED', 'SLA_WARNING', 'SLA_BREACH', 'ORDER_COMPLETED', 'ORDER_CANCELED', 'STATION_CHANGED', 'MANUAL_OVERRIDE', 'RECONCILIATION', 'CONFLICT_DETECTED', 'INVALID_TRANSITION');

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentGateway_new" AS ENUM ('IREMBO_PAY', 'PESAPAL', 'INTOUCH', 'CASH', 'MOBILE_MONEY', 'CARD', 'BANK_TRANSFER');
ALTER TABLE "PaymentTransaction" ALTER COLUMN "gateway" TYPE "PaymentGateway_new" USING ("gateway"::text::"PaymentGateway_new");
ALTER TYPE "PaymentGateway" RENAME TO "PaymentGateway_old";
ALTER TYPE "PaymentGateway_new" RENAME TO "PaymentGateway";
DROP TYPE "PaymentGateway_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "CheckoutEvent" DROP CONSTRAINT "CheckoutEvent_businessId_fkey";

-- DropForeignKey
ALTER TABLE "CheckoutEvent" DROP CONSTRAINT "CheckoutEvent_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "CheckoutEvent" DROP CONSTRAINT "CheckoutEvent_slipId_fkey";

-- DropForeignKey
ALTER TABLE "DiningSessionSlip" DROP CONSTRAINT "DiningSessionSlip_businessId_fkey";

-- DropForeignKey
ALTER TABLE "DiningSessionSlip" DROP CONSTRAINT "DiningSessionSlip_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "DiningSessionSlip" DROP CONSTRAINT "DiningSessionSlip_tableId_fkey";

-- DropForeignKey
ALTER TABLE "DiningSessionSlipItem" DROP CONSTRAINT "DiningSessionSlipItem_saleId_fkey";

-- DropForeignKey
ALTER TABLE "DiningSessionSlipItem" DROP CONSTRAINT "DiningSessionSlipItem_saleItemId_fkey";

-- DropForeignKey
ALTER TABLE "DiningSessionSlipItem" DROP CONSTRAINT "DiningSessionSlipItem_slipId_fkey";

-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_businessId_fkey";

-- DropForeignKey
ALTER TABLE "StaffRole" DROP CONSTRAINT "StaffRole_businessId_fkey";

-- DropForeignKey
ALTER TABLE "StaffRole" DROP CONSTRAINT "StaffRole_createdByUserId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_primaryBranchId_fkey";

-- DropForeignKey
ALTER TABLE "UserStaffRole" DROP CONSTRAINT "UserStaffRole_businessId_fkey";

-- DropForeignKey
ALTER TABLE "UserStaffRole" DROP CONSTRAINT "UserStaffRole_staffRoleId_fkey";

-- DropForeignKey
ALTER TABLE "UserStaffRole" DROP CONSTRAINT "UserStaffRole_userId_fkey";

-- DropForeignKey
ALTER TABLE "business_scans" DROP CONSTRAINT "business_scans_user_id_fkey";

-- AlterTable
ALTER TABLE "CheckoutEvent" ALTER COLUMN "eventType" SET DEFAULT 'session_started',
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "DiningSessionSlip" ALTER COLUMN "sessionStartedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "lastOrderAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "checkoutInitiatedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "billFinalizedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "paymentTriggeredAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "checkoutCompletedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "closedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "DiningSessionSlipItem" ALTER COLUMN "kitchenReleasedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "kitchenReadyAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "servedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PaymentTransaction" DROP COLUMN "status",
ADD COLUMN     "status" "PaymentTransactionStatus" NOT NULL;

-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "aiCreditsMonthly" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "cmsPostsLimit" INTEGER,
ADD COLUMN     "discoveryFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "qrCodesLimit" INTEGER,
ADD COLUMN     "siteBuilderIncluded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "storageGBLimit" INTEGER NOT NULL DEFAULT 5;

-- AlterTable
ALTER TABLE "Reservation" DROP COLUMN "depositAmountCents";

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "aiCreditsLimit" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "aiCreditsUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "aiResetDate" TIMESTAMP(3),
ADD COLUMN     "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "cmsPostsThisMonth" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "duplicateFlags" JSONB,
ADD COLUMN     "qrCodesCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
ADD COLUMN     "storageUsedBytes" BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "addedAt" TIMESTAMP(3),
ADD COLUMN     "expoConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "expoStatus" "ExpoStatus" DEFAULT 'PENDING',
ADD COLUMN     "isAddon" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parentOrderId" TEXT,
ADD COLUMN     "readyForExpoAt" TIMESTAMP(3),
ADD COLUMN     "servedConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "syncedAt" TIMESTAMP(3),
ALTER COLUMN "kitchenDispatchedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SaleItem" ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "itemStatus" "ItemStatus" DEFAULT 'NEW',
ADD COLUMN     "itemVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "mutationType" "MutationType" NOT NULL DEFAULT 'CREATED',
ADD COLUMN     "parentItemId" TEXT,
ADD COLUMN     "prepStartedAt" TIMESTAMP(3),
ADD COLUMN     "readyAt" TIMESTAMP(3),
ADD COLUMN     "replacedBy" TEXT,
ADD COLUMN     "routedAt" TIMESTAMP(3),
ADD COLUMN     "stationId" TEXT;

-- AlterTable
ALTER TABLE "StaffRole" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "status",
ADD COLUMN     "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "TableSession" ALTER COLUMN "checkoutMode" SET NOT NULL,
ALTER COLUMN "checkoutStatus" SET NOT NULL,
ALTER COLUMN "checkoutInitiatedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "checkoutCompletedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "runningTotalCents" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "preferredCurrency" TEXT NOT NULL DEFAULT 'RWF',
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Africa/Kigali';

-- AlterTable
ALTER TABLE "UserStaffRole" ALTER COLUMN "assignedAt" SET DATA TYPE TIMESTAMP(3);

-- DropTable
DROP TABLE "business_scans";

-- CreateTable
CREATE TABLE "SeatSession" (
    "id" TEXT NOT NULL,
    "seatId" TEXT NOT NULL,
    "tableSessionId" TEXT,
    "participantId" TEXT,
    "state" TEXT NOT NULL DEFAULT 'locked',
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockExpiresAt" TIMESTAMP(3) NOT NULL,
    "lockedByTempId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "occupiedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessView" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "profileId" TEXT,
    "sessionId" TEXT,
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLoginOtp" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hashedOtp" TEXT NOT NULL,
    "confirmToken" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "ip" TEXT,
    "deviceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserLoginOtp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "userAgent" TEXT,
    "ip" TEXT,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trusted" BOOLEAN NOT NULL DEFAULT false,
    "isNew" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingEvent" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "paymentTransactionId" TEXT,
    "eventType" "BillingEventType" NOT NULL,
    "message" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventLog" (
    "id" TEXT NOT NULL,
    "businessId" TEXT,
    "sessionId" TEXT,
    "customerId" TEXT,
    "type" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QrTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "svgTemplate" TEXT NOT NULL,
    "previewUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QrTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QrDesign" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "customData" JSONB NOT NULL,
    "previewUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QrDesign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QrCode" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "designId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "metadata" JSONB,
    "scanCount" INTEGER NOT NULL DEFAULT 0,
    "lastScannedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QrCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaiterCall" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "sessionId" TEXT,
    "businessId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "customMessage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "orderId" TEXT,
    "direction" TEXT NOT NULL DEFAULT 'customer_to_kitchen',

    CONSTRAINT "WaiterCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurrencyExchangeRate" (
    "id" TEXT NOT NULL,
    "fromCurrency" TEXT NOT NULL,
    "toCurrency" TEXT NOT NULL,
    "rate" DECIMAL(12,6) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurrencyExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportedCurrency" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "decimalDigits" INTEGER NOT NULL DEFAULT 2,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "countries" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportedCurrency_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "BusinessScan" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "primaryIssue" TEXT,
    "criticalIssues" JSONB,
    "mediumIssues" JSONB,
    "opportunities" JSONB,
    "quickWins" JSONB,
    "aiCreditsUsed" INTEGER NOT NULL DEFAULT 5,
    "scanDurationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessScan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptimizationRecommendation" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "estimatedImpact" TEXT,
    "effort" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "dismissedReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,

    CONSTRAINT "OptimizationRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptimizationAction" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "beforeState" JSONB,
    "afterState" JSONB,
    "executedBy" TEXT,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isReversible" BOOLEAN NOT NULL DEFAULT true,
    "reversedAt" TIMESTAMP(3),
    "reversedBy" TEXT,
    "metadata" JSONB,

    CONSTRAINT "OptimizationAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptimizationOutcome" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "beforeValue" DOUBLE PRECISION,
    "afterValue" DOUBLE PRECISION,
    "changePercent" DOUBLE PRECISION,
    "measurementPeriod" TEXT NOT NULL,
    "measuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "OptimizationOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportedTimezone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "utcOffset" TEXT NOT NULL,
    "countryCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportedTimezone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralClick" (
    "id" TEXT NOT NULL,
    "referralLinkId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceId" TEXT,
    "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "convertedAt" TIMESTAMP(3),
    "customerId" TEXT,
    "orderId" TEXT,

    CONSTRAINT "ReferralClick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralReward" (
    "id" TEXT NOT NULL,
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

    CONSTRAINT "ReferralReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateEarnings" (
    "id" TEXT NOT NULL,
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

    CONSTRAINT "AffiliateEarnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TableSessionInvite" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "inviteeId" TEXT,
    "inviteCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rewardCents" INTEGER NOT NULL DEFAULT 50000,
    "rewardStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "TableSessionInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudDetectionLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "riskFactors" JSONB NOT NULL,
    "action" TEXT NOT NULL,
    "ipAddress" TEXT,
    "deviceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FraudDetectionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ABTest" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "menuItemId" TEXT,
    "status" "ABTestStatus" NOT NULL DEFAULT 'DRAFT',
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "winnerVariantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ABTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ABVariant" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trafficPercent" INTEGER,
    "changes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ABVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ABAssignment" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ABAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ABEvent" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "type" "ABEventType" NOT NULL,
    "valueCents" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ABEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierRecommendationLog" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "productName" TEXT,
    "action" TEXT NOT NULL,
    "recommendationScore" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierRecommendationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierPerformanceCache" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "avgDeliveryDays" DOUBLE PRECISION,
    "orderCompletionRate" DOUBLE PRECISION,
    "avgRating" DOUBLE PRECISION,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "lastCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierPerformanceCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "alternatePhone" TEXT,
    "whatsappNumber" TEXT,
    "type" "ContactType" NOT NULL,
    "status" "ContactStatus" NOT NULL DEFAULT 'ACTIVE',
    "role" TEXT,
    "jobTitle" TEXT,
    "city" TEXT,
    "district" TEXT,
    "country" TEXT NOT NULL DEFAULT 'RW',
    "address" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "profileImageUrl" TEXT,
    "businessId" TEXT NOT NULL,
    "createdBy" TEXT,
    "assignedTo" TEXT,
    "source" TEXT,
    "sourceId" TEXT,
    "lastContactedAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3),
    "activityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customFields" JSONB,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactOrganization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OrganizationType" NOT NULL,
    "description" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "address" TEXT,
    "city" TEXT,
    "district" TEXT,
    "country" TEXT NOT NULL DEFAULT 'RW',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "industry" TEXT,
    "taxId" TEXT,
    "registrationNumber" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "logoUrl" TEXT,
    "businessId" TEXT NOT NULL,
    "totalRevenue" INTEGER NOT NULL DEFAULT 0,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "lastOrderDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customFields" JSONB,

    CONSTRAINT "ContactOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactRelationship" (
    "id" TEXT NOT NULL,
    "fromContactId" TEXT,
    "toContactId" TEXT,
    "fromOrgId" TEXT,
    "toOrgId" TEXT,
    "relationshipType" "RelationshipType" NOT NULL,
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "businessId" TEXT NOT NULL,
    "organizationId" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactActivity" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "title" TEXT,
    "description" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "sourceId" TEXT,
    "performedBy" TEXT,
    "metadata" JSONB,
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactSegment" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "criteria" JSONB NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "isAutoUpdate" BOOLEAN NOT NULL DEFAULT true,
    "lastUpdated" TIMESTAMP(3),
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactTag" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "description" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportConversation" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "status" "SupportStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "SupportPriority" NOT NULL DEFAULT 'NORMAL',
    "subject" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderUserId" TEXT,
    "senderType" "SupportSenderType" NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "attachmentUrl" TEXT,
    "attachmentMimeType" TEXT,
    "attachmentSizeBytes" INTEGER,

    CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportCannedReply" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "shortcut" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportCannedReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalMarketer" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "referralCode" TEXT NOT NULL,
    "qrCodeUrl" TEXT,
    "status" "MarketerStatus" NOT NULL DEFAULT 'ACTIVE',
    "suspendedAt" TIMESTAMP(3),
    "suspensionReason" TEXT,
    "onboardedBy" TEXT,
    "notes" TEXT,

    CONSTRAINT "ProfessionalMarketer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketerAttribution" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "marketerId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "attributedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "deviceId" TEXT,
    "utmSource" TEXT,
    "utmCampaign" TEXT,
    "utmMedium" TEXT,
    "utmContent" TEXT,

    CONSTRAINT "MarketerAttribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketerWallet" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "marketerId" TEXT NOT NULL,
    "availableBalance" INTEGER NOT NULL DEFAULT 0,
    "pendingBalance" INTEGER NOT NULL DEFAULT 0,
    "lockedBalance" INTEGER NOT NULL DEFAULT 0,
    "totalEarned" INTEGER NOT NULL DEFAULT 0,
    "totalPaidOut" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MarketerWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketerCommission" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "marketerId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "type" "MarketerCommissionType" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RWF',
    "status" "MarketerCommissionStatus" NOT NULL DEFAULT 'PENDING',
    "lockedUntil" TIMESTAMP(3),
    "validatedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "periodMonth" INTEGER,
    "description" TEXT,

    CONSTRAINT "MarketerCommission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketerPayout" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "marketerId" TEXT NOT NULL,
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

    CONSTRAINT "MarketerPayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketerRiskProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "marketerId" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "flags" TEXT[],
    "totalPayouts" INTEGER NOT NULL DEFAULT 0,
    "avgPayoutCents" INTEGER NOT NULL DEFAULT 0,
    "lastPayoutAt" TIMESTAMP(3),

    CONSTRAINT "MarketerRiskProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "RevenueEventType" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "triggeredBy" TEXT,
    "ipAddress" TEXT,

    CONSTRAINT "RevenueEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueAlert" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "severity" "AlertSeverity" NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedBy" TEXT,
    "acknowledgedAt" TIMESTAMP(3),

    CONSTRAINT "RevenueAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemoRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "message" TEXT,
    "status" "DemoRequestStatus" NOT NULL DEFAULT 'PENDING',
    "contactedAt" TIMESTAMP(3),
    "contactedBy" TEXT,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "DemoRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailOrPhone" TEXT NOT NULL,
    "sourcePage" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "unsubscribedAt" TIMESTAMP(3),

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Station" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "StationType" NOT NULL DEFAULT 'KITCHEN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Station_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouteRule" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "menuItemId" TEXT,
    "category" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RouteRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketEvent" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "saleItemId" TEXT,
    "stationId" TEXT,
    "eventType" "TicketEventType" NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT,
    "previousState" TEXT,
    "newState" TEXT,
    "metadata" JSONB,
    "idempotencyKey" TEXT,
    "sequenceNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SLAProfile" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "stationId" TEXT,
    "category" TEXT,
    "warningAfterMinutes" INTEGER NOT NULL DEFAULT 8,
    "breachAfterMinutes" INTEGER NOT NULL DEFAULT 15,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SLAProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyKey" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "requestBody" JSONB,
    "responseBody" JSONB,
    "statusCode" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SeatSession_participantId_key" ON "SeatSession"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "SeatSession_sessionToken_key" ON "SeatSession"("sessionToken");

-- CreateIndex
CREATE INDEX "SeatSession_seatId_state_idx" ON "SeatSession"("seatId", "state");

-- CreateIndex
CREATE INDEX "SeatSession_lockExpiresAt_idx" ON "SeatSession"("lockExpiresAt");

-- CreateIndex
CREATE INDEX "SeatSession_sessionToken_idx" ON "SeatSession"("sessionToken");

-- CreateIndex
CREATE INDEX "SeatSession_lockedByTempId_idx" ON "SeatSession"("lockedByTempId");

-- CreateIndex
CREATE INDEX "BusinessView_businessId_viewedAt_idx" ON "BusinessView"("businessId", "viewedAt");

-- CreateIndex
CREATE INDEX "BusinessView_sessionId_idx" ON "BusinessView"("sessionId");

-- CreateIndex
CREATE INDEX "BusinessView_userId_idx" ON "BusinessView"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserLoginOtp_confirmToken_key" ON "UserLoginOtp"("confirmToken");

-- CreateIndex
CREATE INDEX "UserLoginOtp_userId_idx" ON "UserLoginOtp"("userId");

-- CreateIndex
CREATE INDEX "UserLoginOtp_confirmToken_idx" ON "UserLoginOtp"("confirmToken");

-- CreateIndex
CREATE INDEX "UserLoginOtp_expiresAt_idx" ON "UserLoginOtp"("expiresAt");

-- CreateIndex
CREATE INDEX "UserDevice_userId_idx" ON "UserDevice"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserDevice_userId_fingerprint_key" ON "UserDevice"("userId", "fingerprint");

-- CreateIndex
CREATE INDEX "SecurityEvent_userId_idx" ON "SecurityEvent"("userId");

-- CreateIndex
CREATE INDEX "SecurityEvent_eventType_createdAt_idx" ON "SecurityEvent"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "BillingEvent_businessId_occurredAt_idx" ON "BillingEvent"("businessId", "occurredAt");

-- CreateIndex
CREATE INDEX "BillingEvent_subscriptionId_idx" ON "BillingEvent"("subscriptionId");

-- CreateIndex
CREATE INDEX "BillingEvent_paymentTransactionId_idx" ON "BillingEvent"("paymentTransactionId");

-- CreateIndex
CREATE INDEX "BillingEvent_eventType_occurredAt_idx" ON "BillingEvent"("eventType", "occurredAt");

-- CreateIndex
CREATE INDEX "EventLog_businessId_type_createdAt_idx" ON "EventLog"("businessId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "EventLog_type_createdAt_idx" ON "EventLog"("type", "createdAt");

-- CreateIndex
CREATE INDEX "EventLog_entityType_entityId_idx" ON "EventLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "EventLog_sessionId_idx" ON "EventLog"("sessionId");

-- CreateIndex
CREATE INDEX "QrTemplate_category_idx" ON "QrTemplate"("category");

-- CreateIndex
CREATE INDEX "QrDesign_businessId_idx" ON "QrDesign"("businessId");

-- CreateIndex
CREATE INDEX "QrDesign_templateId_idx" ON "QrDesign"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "QrCode_designId_key" ON "QrCode"("designId");

-- CreateIndex
CREATE UNIQUE INDEX "QrCode_token_key" ON "QrCode"("token");

-- CreateIndex
CREATE INDEX "QrCode_token_idx" ON "QrCode"("token");

-- CreateIndex
CREATE INDEX "QrCode_businessId_idx" ON "QrCode"("businessId");

-- CreateIndex
CREATE INDEX "WaiterCall_tableId_status_idx" ON "WaiterCall"("tableId", "status");

-- CreateIndex
CREATE INDEX "WaiterCall_businessId_status_idx" ON "WaiterCall"("businessId", "status");

-- CreateIndex
CREATE INDEX "WaiterCall_createdAt_idx" ON "WaiterCall"("createdAt");

-- CreateIndex
CREATE INDEX "WaiterCall_status_createdAt_idx" ON "WaiterCall"("status", "createdAt");

-- CreateIndex
CREATE INDEX "WaiterCall_orderId_createdAt_idx" ON "WaiterCall"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "CurrencyExchangeRate_fromCurrency_toCurrency_validFrom_idx" ON "CurrencyExchangeRate"("fromCurrency", "toCurrency", "validFrom");

-- CreateIndex
CREATE UNIQUE INDEX "CurrencyExchangeRate_fromCurrency_toCurrency_validFrom_key" ON "CurrencyExchangeRate"("fromCurrency", "toCurrency", "validFrom");

-- CreateIndex
CREATE INDEX "BusinessScan_businessId_createdAt_idx" ON "BusinessScan"("businessId", "createdAt");

-- CreateIndex
CREATE INDEX "BusinessScan_score_idx" ON "BusinessScan"("score");

-- CreateIndex
CREATE INDEX "OptimizationRecommendation_businessId_status_createdAt_idx" ON "OptimizationRecommendation"("businessId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "OptimizationRecommendation_source_category_idx" ON "OptimizationRecommendation"("source", "category");

-- CreateIndex
CREATE INDEX "OptimizationRecommendation_priority_status_idx" ON "OptimizationRecommendation"("priority", "status");

-- CreateIndex
CREATE INDEX "OptimizationAction_recommendationId_executedAt_idx" ON "OptimizationAction"("recommendationId", "executedAt");

-- CreateIndex
CREATE INDEX "OptimizationAction_actionType_idx" ON "OptimizationAction"("actionType");

-- CreateIndex
CREATE INDEX "OptimizationOutcome_recommendationId_measuredAt_idx" ON "OptimizationOutcome"("recommendationId", "measuredAt");

-- CreateIndex
CREATE INDEX "OptimizationOutcome_businessId_metricType_idx" ON "OptimizationOutcome"("businessId", "metricType");

-- CreateIndex
CREATE INDEX "ReferralClick_referralLinkId_clickedAt_idx" ON "ReferralClick"("referralLinkId", "clickedAt");

-- CreateIndex
CREATE INDEX "ReferralClick_deviceId_idx" ON "ReferralClick"("deviceId");

-- CreateIndex
CREATE INDEX "ReferralClick_ipAddress_idx" ON "ReferralClick"("ipAddress");

-- CreateIndex
CREATE INDEX "ReferralReward_referralLinkId_status_idx" ON "ReferralReward"("referralLinkId", "status");

-- CreateIndex
CREATE INDEX "ReferralReward_customerId_status_idx" ON "ReferralReward"("customerId", "status");

-- CreateIndex
CREATE INDEX "ReferralReward_type_status_idx" ON "ReferralReward"("type", "status");

-- CreateIndex
CREATE INDEX "ReferralReward_tier_status_idx" ON "ReferralReward"("tier", "status");

-- CreateIndex
CREATE INDEX "ReferralReward_lockUntil_idx" ON "ReferralReward"("lockUntil");

-- CreateIndex
CREATE INDEX "ReferralReward_createdAt_idx" ON "ReferralReward"("createdAt");

-- CreateIndex
CREATE INDEX "AffiliateEarnings_referralLinkId_status_idx" ON "AffiliateEarnings"("referralLinkId", "status");

-- CreateIndex
CREATE INDEX "AffiliateEarnings_month_idx" ON "AffiliateEarnings"("month");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateEarnings_referralLinkId_month_key" ON "AffiliateEarnings"("referralLinkId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "TableSessionInvite_inviteCode_key" ON "TableSessionInvite"("inviteCode");

-- CreateIndex
CREATE INDEX "TableSessionInvite_inviteCode_idx" ON "TableSessionInvite"("inviteCode");

-- CreateIndex
CREATE INDEX "TableSessionInvite_sessionId_status_idx" ON "TableSessionInvite"("sessionId", "status");

-- CreateIndex
CREATE INDEX "TableSessionInvite_inviterId_idx" ON "TableSessionInvite"("inviterId");

-- CreateIndex
CREATE INDEX "FraudDetectionLog_entityType_entityId_idx" ON "FraudDetectionLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "FraudDetectionLog_riskScore_idx" ON "FraudDetectionLog"("riskScore");

-- CreateIndex
CREATE INDEX "FraudDetectionLog_action_idx" ON "FraudDetectionLog"("action");

-- CreateIndex
CREATE INDEX "FraudDetectionLog_createdAt_idx" ON "FraudDetectionLog"("createdAt");

-- CreateIndex
CREATE INDEX "ABTest_businessId_status_idx" ON "ABTest"("businessId", "status");

-- CreateIndex
CREATE INDEX "ABTest_menuItemId_idx" ON "ABTest"("menuItemId");

-- CreateIndex
CREATE INDEX "ABVariant_testId_idx" ON "ABVariant"("testId");

-- CreateIndex
CREATE INDEX "ABAssignment_testId_variantId_idx" ON "ABAssignment"("testId", "variantId");

-- CreateIndex
CREATE UNIQUE INDEX "ABAssignment_testId_visitorId_key" ON "ABAssignment"("testId", "visitorId");

-- CreateIndex
CREATE INDEX "ABEvent_testId_variantId_type_idx" ON "ABEvent"("testId", "variantId", "type");

-- CreateIndex
CREATE INDEX "ABEvent_createdAt_idx" ON "ABEvent"("createdAt");

-- CreateIndex
CREATE INDEX "SupplierRecommendationLog_businessId_supplierId_idx" ON "SupplierRecommendationLog"("businessId", "supplierId");

-- CreateIndex
CREATE INDEX "SupplierRecommendationLog_userId_action_idx" ON "SupplierRecommendationLog"("userId", "action");

-- CreateIndex
CREATE INDEX "SupplierRecommendationLog_createdAt_idx" ON "SupplierRecommendationLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierPerformanceCache_supplierId_key" ON "SupplierPerformanceCache"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierPerformanceCache_lastCalculated_idx" ON "SupplierPerformanceCache"("lastCalculated");

-- CreateIndex
CREATE INDEX "Contact_businessId_type_idx" ON "Contact"("businessId", "type");

-- CreateIndex
CREATE INDEX "Contact_businessId_status_idx" ON "Contact"("businessId", "status");

-- CreateIndex
CREATE INDEX "Contact_email_idx" ON "Contact"("email");

-- CreateIndex
CREATE INDEX "Contact_phone_idx" ON "Contact"("phone");

-- CreateIndex
CREATE INDEX "Contact_tags_idx" ON "Contact"("tags");

-- CreateIndex
CREATE INDEX "Contact_lastActivityAt_idx" ON "Contact"("lastActivityAt");

-- CreateIndex
CREATE INDEX "Contact_createdAt_idx" ON "Contact"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_businessId_phone_key" ON "Contact"("businessId", "phone");

-- CreateIndex
CREATE INDEX "ContactOrganization_businessId_type_idx" ON "ContactOrganization"("businessId", "type");

-- CreateIndex
CREATE INDEX "ContactOrganization_businessId_name_idx" ON "ContactOrganization"("businessId", "name");

-- CreateIndex
CREATE INDEX "ContactOrganization_createdAt_idx" ON "ContactOrganization"("createdAt");

-- CreateIndex
CREATE INDEX "OrganizationMember_organizationId_idx" ON "OrganizationMember"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationMember_contactId_idx" ON "OrganizationMember"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_contactId_organizationId_key" ON "OrganizationMember"("contactId", "organizationId");

-- CreateIndex
CREATE INDEX "ContactRelationship_businessId_relationshipType_idx" ON "ContactRelationship"("businessId", "relationshipType");

-- CreateIndex
CREATE INDEX "ContactRelationship_fromContactId_idx" ON "ContactRelationship"("fromContactId");

-- CreateIndex
CREATE INDEX "ContactRelationship_toContactId_idx" ON "ContactRelationship"("toContactId");

-- CreateIndex
CREATE INDEX "ContactRelationship_fromOrgId_idx" ON "ContactRelationship"("fromOrgId");

-- CreateIndex
CREATE INDEX "ContactRelationship_toOrgId_idx" ON "ContactRelationship"("toOrgId");

-- CreateIndex
CREATE INDEX "ContactRelationship_isActive_idx" ON "ContactRelationship"("isActive");

-- CreateIndex
CREATE INDEX "ContactActivity_contactId_timestamp_idx" ON "ContactActivity"("contactId", "timestamp");

-- CreateIndex
CREATE INDEX "ContactActivity_businessId_activityType_idx" ON "ContactActivity"("businessId", "activityType");

-- CreateIndex
CREATE INDEX "ContactActivity_timestamp_idx" ON "ContactActivity"("timestamp");

-- CreateIndex
CREATE INDEX "ContactActivity_source_sourceId_idx" ON "ContactActivity"("source", "sourceId");

-- CreateIndex
CREATE INDEX "ContactSegment_businessId_idx" ON "ContactSegment"("businessId");

-- CreateIndex
CREATE INDEX "ContactTag_businessId_idx" ON "ContactTag"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "ContactTag_businessId_name_key" ON "ContactTag"("businessId", "name");

-- CreateIndex
CREATE INDEX "SupportConversation_businessId_status_updatedAt_idx" ON "SupportConversation"("businessId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "SupportConversation_createdById_updatedAt_idx" ON "SupportConversation"("createdById", "updatedAt");

-- CreateIndex
CREATE INDEX "SupportConversation_assignedToId_status_idx" ON "SupportConversation"("assignedToId", "status");

-- CreateIndex
CREATE INDEX "SupportMessage_conversationId_createdAt_idx" ON "SupportMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "SupportMessage_senderType_createdAt_idx" ON "SupportMessage"("senderType", "createdAt");

-- CreateIndex
CREATE INDEX "SupportCannedReply_businessId_isActive_idx" ON "SupportCannedReply"("businessId", "isActive");

-- CreateIndex
CREATE INDEX "SupportCannedReply_businessId_shortcut_idx" ON "SupportCannedReply"("businessId", "shortcut");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalMarketer_userId_key" ON "ProfessionalMarketer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalMarketer_email_key" ON "ProfessionalMarketer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalMarketer_phone_key" ON "ProfessionalMarketer"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalMarketer_referralCode_key" ON "ProfessionalMarketer"("referralCode");

-- CreateIndex
CREATE INDEX "ProfessionalMarketer_status_idx" ON "ProfessionalMarketer"("status");

-- CreateIndex
CREATE INDEX "ProfessionalMarketer_referralCode_idx" ON "ProfessionalMarketer"("referralCode");

-- CreateIndex
CREATE INDEX "ProfessionalMarketer_email_idx" ON "ProfessionalMarketer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "MarketerAttribution_businessId_key" ON "MarketerAttribution"("businessId");

-- CreateIndex
CREATE INDEX "MarketerAttribution_marketerId_idx" ON "MarketerAttribution"("marketerId");

-- CreateIndex
CREATE INDEX "MarketerAttribution_businessId_idx" ON "MarketerAttribution"("businessId");

-- CreateIndex
CREATE INDEX "MarketerAttribution_attributedAt_idx" ON "MarketerAttribution"("attributedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MarketerWallet_marketerId_key" ON "MarketerWallet"("marketerId");

-- CreateIndex
CREATE INDEX "MarketerWallet_marketerId_idx" ON "MarketerWallet"("marketerId");

-- CreateIndex
CREATE INDEX "MarketerCommission_marketerId_status_idx" ON "MarketerCommission"("marketerId", "status");

-- CreateIndex
CREATE INDEX "MarketerCommission_businessId_idx" ON "MarketerCommission"("businessId");

-- CreateIndex
CREATE INDEX "MarketerCommission_status_idx" ON "MarketerCommission"("status");

-- CreateIndex
CREATE INDEX "MarketerCommission_createdAt_idx" ON "MarketerCommission"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MarketerPayout_referenceId_key" ON "MarketerPayout"("referenceId");

-- CreateIndex
CREATE INDEX "MarketerPayout_marketerId_status_idx" ON "MarketerPayout"("marketerId", "status");

-- CreateIndex
CREATE INDEX "MarketerPayout_status_idx" ON "MarketerPayout"("status");

-- CreateIndex
CREATE INDEX "MarketerPayout_createdAt_idx" ON "MarketerPayout"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MarketerRiskProfile_marketerId_key" ON "MarketerRiskProfile"("marketerId");

-- CreateIndex
CREATE INDEX "MarketerRiskProfile_riskLevel_idx" ON "MarketerRiskProfile"("riskLevel");

-- CreateIndex
CREATE INDEX "MarketerRiskProfile_marketerId_idx" ON "MarketerRiskProfile"("marketerId");

-- CreateIndex
CREATE INDEX "RevenueEvent_type_createdAt_idx" ON "RevenueEvent"("type", "createdAt");

-- CreateIndex
CREATE INDEX "RevenueEvent_entityType_entityId_idx" ON "RevenueEvent"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "RevenueEvent_createdAt_idx" ON "RevenueEvent"("createdAt");

-- CreateIndex
CREATE INDEX "RevenueAlert_severity_acknowledged_idx" ON "RevenueAlert"("severity", "acknowledged");

-- CreateIndex
CREATE INDEX "RevenueAlert_createdAt_idx" ON "RevenueAlert"("createdAt");

-- CreateIndex
CREATE INDEX "RevenueAlert_acknowledged_idx" ON "RevenueAlert"("acknowledged");

-- CreateIndex
CREATE INDEX "DemoRequest_status_createdAt_idx" ON "DemoRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "DemoRequest_createdAt_idx" ON "DemoRequest"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_emailOrPhone_key" ON "NewsletterSubscriber"("emailOrPhone");

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_isActive_createdAt_idx" ON "NewsletterSubscriber"("isActive", "createdAt");

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_createdAt_idx" ON "NewsletterSubscriber"("createdAt");

-- CreateIndex
CREATE INDEX "Station_businessId_isActive_idx" ON "Station"("businessId", "isActive");

-- CreateIndex
CREATE INDEX "Station_businessId_type_idx" ON "Station"("businessId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Station_businessId_code_key" ON "Station"("businessId", "code");

-- CreateIndex
CREATE INDEX "RouteRule_businessId_isActive_idx" ON "RouteRule"("businessId", "isActive");

-- CreateIndex
CREATE INDEX "RouteRule_menuItemId_idx" ON "RouteRule"("menuItemId");

-- CreateIndex
CREATE INDEX "RouteRule_category_idx" ON "RouteRule"("category");

-- CreateIndex
CREATE INDEX "RouteRule_stationId_idx" ON "RouteRule"("stationId");

-- CreateIndex
CREATE INDEX "TicketEvent_saleId_createdAt_idx" ON "TicketEvent"("saleId", "createdAt");

-- CreateIndex
CREATE INDEX "TicketEvent_saleItemId_sequenceNumber_idx" ON "TicketEvent"("saleItemId", "sequenceNumber");

-- CreateIndex
CREATE INDEX "TicketEvent_eventType_idx" ON "TicketEvent"("eventType");

-- CreateIndex
CREATE INDEX "TicketEvent_createdAt_idx" ON "TicketEvent"("createdAt");

-- CreateIndex
CREATE INDEX "TicketEvent_stationId_idx" ON "TicketEvent"("stationId");

-- CreateIndex
CREATE INDEX "TicketEvent_idempotencyKey_idx" ON "TicketEvent"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "TicketEvent_saleItemId_idempotencyKey_key" ON "TicketEvent"("saleItemId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "SLAProfile_businessId_isActive_idx" ON "SLAProfile"("businessId", "isActive");

-- CreateIndex
CREATE INDEX "SLAProfile_stationId_idx" ON "SLAProfile"("stationId");

-- CreateIndex
CREATE INDEX "SLAProfile_category_idx" ON "SLAProfile"("category");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyKey_key_key" ON "IdempotencyKey"("key");

-- CreateIndex
CREATE INDEX "IdempotencyKey_businessId_endpoint_idx" ON "IdempotencyKey"("businessId", "endpoint");

-- CreateIndex
CREATE INDEX "IdempotencyKey_expiresAt_idx" ON "IdempotencyKey"("expiresAt");

-- CreateIndex
CREATE INDEX "AffiliateCommissionNew_status_lockUntil_idx" ON "AffiliateCommissionNew"("status", "lockUntil");

-- CreateIndex
CREATE INDEX "AffiliateCommissionNew_affiliateId_status_idx" ON "AffiliateCommissionNew"("affiliateId", "status");

-- CreateIndex
CREATE INDEX "CheckoutEvent_paymentId_idx" ON "CheckoutEvent"("paymentId");

-- CreateIndex
CREATE INDEX "CheckoutEvent_eventType_createdAt_idx" ON "CheckoutEvent"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentTransaction_status_idx" ON "PaymentTransaction"("status");

-- CreateIndex
CREATE INDEX "PaymentTransaction_updatedAt_idx" ON "PaymentTransaction"("updatedAt");

-- CreateIndex
CREATE INDEX "PaymentTransaction_status_createdAt_idx" ON "PaymentTransaction"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentTransaction_businessId_status_idx" ON "PaymentTransaction"("businessId", "status");

-- CreateIndex
CREATE INDEX "Sale_businessId_createdAt_idx" ON "Sale"("businessId", "createdAt");

-- CreateIndex
CREATE INDEX "Sale_paymentStatus_createdAt_idx" ON "Sale"("paymentStatus", "createdAt");

-- CreateIndex
CREATE INDEX "Sale_parentOrderId_idx" ON "Sale"("parentOrderId");

-- CreateIndex
CREATE INDEX "Sale_isAddon_idx" ON "Sale"("isAddon");

-- CreateIndex
CREATE INDEX "Sale_businessId_isAddon_idx" ON "Sale"("businessId", "isAddon");

-- CreateIndex
CREATE INDEX "SaleItem_itemStatus_idx" ON "SaleItem"("itemStatus");

-- CreateIndex
CREATE INDEX "SaleItem_stationId_idx" ON "SaleItem"("stationId");

-- CreateIndex
CREATE INDEX "SaleItem_saleId_itemStatus_idx" ON "SaleItem"("saleId", "itemStatus");

-- CreateIndex
CREATE INDEX "SaleItem_parentItemId_idx" ON "SaleItem"("parentItemId");

-- CreateIndex
CREATE INDEX "SaleItem_mutationType_idx" ON "SaleItem"("mutationType");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_primaryBranchId_fkey" FOREIGN KEY ("primaryBranchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_parentOrderId_fkey" FOREIGN KEY ("parentOrderId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffRole" ADD CONSTRAINT "StaffRole_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffRole" ADD CONSTRAINT "StaffRole_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStaffRole" ADD CONSTRAINT "UserStaffRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStaffRole" ADD CONSTRAINT "UserStaffRole_staffRoleId_fkey" FOREIGN KEY ("staffRoleId") REFERENCES "StaffRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStaffRole" ADD CONSTRAINT "UserStaffRole_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatSession" ADD CONSTRAINT "SeatSession_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "Seat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatSession" ADD CONSTRAINT "SeatSession_tableSessionId_fkey" FOREIGN KEY ("tableSessionId") REFERENCES "TableSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatSession" ADD CONSTRAINT "SeatSession_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "SessionParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessView" ADD CONSTRAINT "BusinessView_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLoginOtp" ADD CONSTRAINT "UserLoginOtp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDevice" ADD CONSTRAINT "UserDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityEvent" ADD CONSTRAINT "SecurityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingEvent" ADD CONSTRAINT "BillingEvent_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingEvent" ADD CONSTRAINT "BillingEvent_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingEvent" ADD CONSTRAINT "BillingEvent_paymentTransactionId_fkey" FOREIGN KEY ("paymentTransactionId") REFERENCES "PaymentTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrDesign" ADD CONSTRAINT "QrDesign_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrDesign" ADD CONSTRAINT "QrDesign_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "QrTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrCode" ADD CONSTRAINT "QrCode_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrCode" ADD CONSTRAINT "QrCode_designId_fkey" FOREIGN KEY ("designId") REFERENCES "QrDesign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIUsageLog" ADD CONSTRAINT "AIUsageLog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteBuilderSubscription" ADD CONSTRAINT "SiteBuilderSubscription_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscoverySubscription" ADD CONSTRAINT "DiscoverySubscription_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaiterCall" ADD CONSTRAINT "WaiterCall_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaiterCall" ADD CONSTRAINT "WaiterCall_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TableSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaiterCall" ADD CONSTRAINT "WaiterCall_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaiterCall" ADD CONSTRAINT "WaiterCall_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessScan" ADD CONSTRAINT "BusinessScan_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimizationRecommendation" ADD CONSTRAINT "OptimizationRecommendation_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimizationAction" ADD CONSTRAINT "OptimizationAction_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "OptimizationRecommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimizationOutcome" ADD CONSTRAINT "OptimizationOutcome_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimizationOutcome" ADD CONSTRAINT "OptimizationOutcome_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "OptimizationRecommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralClick" ADD CONSTRAINT "ReferralClick_referralLinkId_fkey" FOREIGN KEY ("referralLinkId") REFERENCES "ReferralLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_referralLinkId_fkey" FOREIGN KEY ("referralLinkId") REFERENCES "ReferralLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateEarnings" ADD CONSTRAINT "AffiliateEarnings_referralLinkId_fkey" FOREIGN KEY ("referralLinkId") REFERENCES "ReferralLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableSessionInvite" ADD CONSTRAINT "TableSessionInvite_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TableSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableSessionInvite" ADD CONSTRAINT "TableSessionInvite_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "SessionParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableSessionInvite" ADD CONSTRAINT "TableSessionInvite_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "SessionParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ABTest" ADD CONSTRAINT "ABTest_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ABTest" ADD CONSTRAINT "ABTest_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ABTest" ADD CONSTRAINT "ABTest_winnerVariantId_fkey" FOREIGN KEY ("winnerVariantId") REFERENCES "ABVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ABVariant" ADD CONSTRAINT "ABVariant_testId_fkey" FOREIGN KEY ("testId") REFERENCES "ABTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ABAssignment" ADD CONSTRAINT "ABAssignment_testId_fkey" FOREIGN KEY ("testId") REFERENCES "ABTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ABAssignment" ADD CONSTRAINT "ABAssignment_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ABVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ABEvent" ADD CONSTRAINT "ABEvent_testId_fkey" FOREIGN KEY ("testId") REFERENCES "ABTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ABEvent" ADD CONSTRAINT "ABEvent_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ABVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierRecommendationLog" ADD CONSTRAINT "SupplierRecommendationLog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierRecommendationLog" ADD CONSTRAINT "SupplierRecommendationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierRecommendationLog" ADD CONSTRAINT "SupplierRecommendationLog_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierPerformanceCache" ADD CONSTRAINT "SupplierPerformanceCache_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactOrganization" ADD CONSTRAINT "ContactOrganization_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "ContactOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactRelationship" ADD CONSTRAINT "ContactRelationship_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactRelationship" ADD CONSTRAINT "ContactRelationship_fromContactId_fkey" FOREIGN KEY ("fromContactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactRelationship" ADD CONSTRAINT "ContactRelationship_toContactId_fkey" FOREIGN KEY ("toContactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactRelationship" ADD CONSTRAINT "ContactRelationship_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "ContactOrganization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactActivity" ADD CONSTRAINT "ContactActivity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactActivity" ADD CONSTRAINT "ContactActivity_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactSegment" ADD CONSTRAINT "ContactSegment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactTag" ADD CONSTRAINT "ContactTag_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportConversation" ADD CONSTRAINT "SupportConversation_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportConversation" ADD CONSTRAINT "SupportConversation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportConversation" ADD CONSTRAINT "SupportConversation_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "SupportConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportCannedReply" ADD CONSTRAINT "SupportCannedReply_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningSessionSlip" ADD CONSTRAINT "DiningSessionSlip_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TableSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningSessionSlip" ADD CONSTRAINT "DiningSessionSlip_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningSessionSlip" ADD CONSTRAINT "DiningSessionSlip_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningSessionSlipItem" ADD CONSTRAINT "DiningSessionSlipItem_slipId_fkey" FOREIGN KEY ("slipId") REFERENCES "DiningSessionSlip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningSessionSlipItem" ADD CONSTRAINT "DiningSessionSlipItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningSessionSlipItem" ADD CONSTRAINT "DiningSessionSlipItem_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "SaleItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckoutEvent" ADD CONSTRAINT "CheckoutEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TableSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckoutEvent" ADD CONSTRAINT "CheckoutEvent_slipId_fkey" FOREIGN KEY ("slipId") REFERENCES "DiningSessionSlip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckoutEvent" ADD CONSTRAINT "CheckoutEvent_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketerAttribution" ADD CONSTRAINT "MarketerAttribution_marketerId_fkey" FOREIGN KEY ("marketerId") REFERENCES "ProfessionalMarketer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketerWallet" ADD CONSTRAINT "MarketerWallet_marketerId_fkey" FOREIGN KEY ("marketerId") REFERENCES "ProfessionalMarketer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketerCommission" ADD CONSTRAINT "MarketerCommission_marketerId_fkey" FOREIGN KEY ("marketerId") REFERENCES "ProfessionalMarketer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketerPayout" ADD CONSTRAINT "MarketerPayout_marketerId_fkey" FOREIGN KEY ("marketerId") REFERENCES "ProfessionalMarketer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketerRiskProfile" ADD CONSTRAINT "MarketerRiskProfile_marketerId_fkey" FOREIGN KEY ("marketerId") REFERENCES "ProfessionalMarketer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Station" ADD CONSTRAINT "Station_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteRule" ADD CONSTRAINT "RouteRule_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteRule" ADD CONSTRAINT "RouteRule_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteRule" ADD CONSTRAINT "RouteRule_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketEvent" ADD CONSTRAINT "TicketEvent_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketEvent" ADD CONSTRAINT "TicketEvent_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "SaleItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketEvent" ADD CONSTRAINT "TicketEvent_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketEvent" ADD CONSTRAINT "TicketEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SLAProfile" ADD CONSTRAINT "SLAProfile_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SLAProfile" ADD CONSTRAINT "SLAProfile_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdempotencyKey" ADD CONSTRAINT "IdempotencyKey_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
