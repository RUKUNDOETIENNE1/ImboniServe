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
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'PaymentTransactionStatus') THEN CREATE TYPE "PaymentTransactionStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED'); END IF; END $$;

-- CreateEnum
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'SubscriptionStatus') THEN CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'GRACE_PERIOD', 'EXPIRED', 'SUSPENDED', 'CANCELLED'); END IF; END $$;

-- CreateEnum
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'BillingEventType') THEN CREATE TYPE "BillingEventType" AS ENUM ('PAYMENT_INITIATED', 'PAYMENT_PROCESSING', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'PAYMENT_CANCELLED', 'PAYMENT_REFUNDED', 'SUBSCRIPTION_ACTIVATED', 'SUBSCRIPTION_RENEWED', 'SUBSCRIPTION_EXPIRED', 'SUBSCRIPTION_CANCELLED', 'REMINDER_SENT'); END IF; END $$;

-- CreateEnum
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'ABTestStatus') THEN CREATE TYPE "ABTestStatus" AS ENUM ('DRAFT', 'RUNNING', 'PAUSED', 'COMPLETED'); END IF; END $$;

-- CreateEnum
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'ABEventType') THEN CREATE TYPE "ABEventType" AS ENUM ('VIEW', 'CLICK', 'ORDER', 'REVENUE', 'CUSTOM'); END IF; END $$;

-- CreateEnum
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'ContactType') THEN CREATE TYPE "ContactType" AS ENUM ('CLIENT', 'SUPPLIER', 'STAFF', 'CUSTOMER', 'PARTNER', 'LEAD'); END IF; END $$;

-- CreateEnum
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'ContactStatus') THEN CREATE TYPE "ContactStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'LEAD', 'BLOCKED', 'ARCHIVED'); END IF; END $$;

-- CreateEnum
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'OrganizationType') THEN CREATE TYPE "OrganizationType" AS ENUM ('RESTAURANT', 'HOTEL', 'SUPPLIER', 'DISTRIBUTOR', 'MANUFACTURER', 'SERVICE_PROVIDER', 'OTHER'); END IF; END $$;

-- CreateEnum
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'RelationshipType') THEN CREATE TYPE "RelationshipType" AS ENUM ('WORKS_AT', 'OWNS', 'MANAGES', 'SUPPLIES_TO', 'PARTNERS_WITH', 'REPORTS_TO', 'CONTACTS', 'REFERRED_BY', 'CUSTOMER_OF'); END IF; END $$;

-- CreateEnum
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'ActivityType') THEN CREATE TYPE "ActivityType" AS ENUM ('CALL', 'EMAIL', 'MEETING', 'NOTE', 'ORDER_PLACED', 'ORDER_DELIVERED', 'PAYMENT_RECEIVED', 'WHATSAPP_MESSAGE', 'SYSTEM_EVENT', 'TASK_CREATED', 'TASK_COMPLETED', 'CONTRACT_SIGNED', 'COMPLAINT', 'FEEDBACK'); END IF; END $$;

-- CreateEnum
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'SupportStatus') THEN CREATE TYPE "SupportStatus" AS ENUM ('OPEN', 'PENDING', 'RESOLVED'); END IF; END $$;

-- CreateEnum
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'SupportPriority') THEN CREATE TYPE "SupportPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH'); END IF; END $$;

-- CreateEnum
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'SupportSenderType') THEN CREATE TYPE "SupportSenderType" AS ENUM ('USER', 'STAFF', 'SYSTEM'); END IF; END $$;

-- CreateEnum
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'MarketerStatus') THEN CREATE TYPE "MarketerStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'INACTIVE'); END IF; END $$;

-- CreateEnum
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'MarketerCommissionType') THEN CREATE TYPE "MarketerCommissionType" AS ENUM ('SIGNUP_BONUS', 'RECURRING_REVENUE'); END IF; END $$;

-- CreateEnum
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'MarketerCommissionStatus') THEN CREATE TYPE "MarketerCommissionStatus" AS ENUM ('PENDING', 'VALIDATED', 'PAID', 'VOID'); END IF; END $$;

-- CreateEnum
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'PayoutMethod') THEN CREATE TYPE "PayoutMethod" AS ENUM ('MTN_MOBILE_MONEY', 'AIRTEL_MONEY', 'BANK_TRANSFER'); END IF; END $$;

-- CreateEnum
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'PayoutStatus') THEN CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'APPROVED', 'PROCESSING', 'PAID', 'FAILED', 'REJECTED'); END IF; END $$;

-- CreateEnum
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'RiskLevel') THEN CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'); END IF; END $$;

-- CreateEnum
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'RevenueEventType') THEN CREATE TYPE "RevenueEventType" AS ENUM ('MARKETER_CREATED', 'MARKETER_SUSPENDED', 'ATTRIBUTION_RECORDED', 'COMMISSION_CREATED', 'COMMISSION_VALIDATED', 'COMMISSION_PAID', 'WALLET_UPDATED', 'PAYOUT_REQUESTED', 'PAYOUT_APPROVED', 'PAYOUT_REJECTED', 'PAYOUT_PROCESSING', 'PAYOUT_PAID', 'PAYOUT_FAILED', 'RISK_SCORE_UPDATED', 'ALERT_TRIGGERED'); END IF; END $$;

-- CreateEnum
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'AlertSeverity') THEN CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL'); END IF; END $$;

-- CreateEnum
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'DemoRequestStatus') THEN CREATE TYPE "DemoRequestStatus" AS ENUM ('PENDING', 'CONTACTED', 'COMPLETED', 'CANCELLED'); END IF; END $$;

-- CreateEnum
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'StationType') THEN CREATE TYPE "StationType" AS ENUM ('KITCHEN', 'BAR', 'GRILL', 'FRYER', 'PASTRY', 'EXPO', 'OTHER'); END IF; END $$;

-- CreateEnum
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'ItemStatus') THEN CREATE TYPE "ItemStatus" AS ENUM ('NEW', 'PREPARING', 'READY', 'DELIVERED', 'CANCELED'); END IF; END $$;

-- CreateEnum
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'MutationType') THEN CREATE TYPE "MutationType" AS ENUM ('CREATED', 'MODIFIED', 'REPLACED', 'CANCELLED'); END IF; END $$;

-- CreateEnum
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'ExpoStatus') THEN CREATE TYPE "ExpoStatus" AS ENUM ('PENDING', 'READY_FOR_EXPO', 'EXPO_CONFIRMED', 'SERVED_CONFIRMED'); END IF; END $$;

-- CreateEnum
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'TicketEventType') THEN CREATE TYPE "TicketEventType" AS ENUM ('ORDER_CREATED', 'ORDER_UPDATED', 'ITEM_ROUTED', 'ITEM_ACCEPTED', 'ITEM_PREPARING', 'ITEM_READY', 'ITEM_DELIVERED', 'ITEM_CANCELED', 'SLA_WARNING', 'SLA_BREACH', 'ORDER_COMPLETED', 'ORDER_CANCELED', 'STATION_CHANGED', 'MANUAL_OVERRIDE', 'RECONCILIATION', 'CONFLICT_DETECTED', 'INVALID_TRANSITION'); END IF; END $$;

-- AlterEnum (idempotent: skip if already swapped)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'PaymentGateway' AND e.enumlabel = 'INTOUCH') THEN
    CREATE TYPE "PaymentGateway_new" AS ENUM ('IREMBO_PAY', 'PESAPAL', 'INTOUCH', 'CASH', 'MOBILE_MONEY', 'CARD', 'BANK_TRANSFER');
    ALTER TABLE "PaymentTransaction" ALTER COLUMN "gateway" TYPE "PaymentGateway_new" USING ("gateway"::text::"PaymentGateway_new");
    ALTER TYPE "PaymentGateway" RENAME TO "PaymentGateway_old";
    ALTER TYPE "PaymentGateway_new" RENAME TO "PaymentGateway";
    DROP TYPE "PaymentGateway_old";
  END IF;
END $$;

-- DropForeignKey
ALTER TABLE "CheckoutEvent" DROP CONSTRAINT IF EXISTS "CheckoutEvent_businessId_fkey";

-- DropForeignKey
ALTER TABLE "CheckoutEvent" DROP CONSTRAINT IF EXISTS "CheckoutEvent_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "CheckoutEvent" DROP CONSTRAINT IF EXISTS "CheckoutEvent_slipId_fkey";

-- DropForeignKey
ALTER TABLE "DiningSessionSlip" DROP CONSTRAINT IF EXISTS "DiningSessionSlip_businessId_fkey";

-- DropForeignKey
ALTER TABLE "DiningSessionSlip" DROP CONSTRAINT IF EXISTS "DiningSessionSlip_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "DiningSessionSlip" DROP CONSTRAINT IF EXISTS "DiningSessionSlip_tableId_fkey";

-- DropForeignKey
ALTER TABLE "DiningSessionSlipItem" DROP CONSTRAINT IF EXISTS "DiningSessionSlipItem_saleId_fkey";

-- DropForeignKey
ALTER TABLE "DiningSessionSlipItem" DROP CONSTRAINT IF EXISTS "DiningSessionSlipItem_saleItemId_fkey";

-- DropForeignKey
ALTER TABLE "DiningSessionSlipItem" DROP CONSTRAINT IF EXISTS "DiningSessionSlipItem_slipId_fkey";

-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT IF EXISTS "Sale_businessId_fkey";

-- DropForeignKey
ALTER TABLE "StaffRole" DROP CONSTRAINT IF EXISTS "StaffRole_businessId_fkey";

-- DropForeignKey
ALTER TABLE "StaffRole" DROP CONSTRAINT IF EXISTS "StaffRole_createdByUserId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_primaryBranchId_fkey";

-- DropForeignKey
ALTER TABLE "UserStaffRole" DROP CONSTRAINT IF EXISTS "UserStaffRole_businessId_fkey";

-- DropForeignKey
ALTER TABLE "UserStaffRole" DROP CONSTRAINT IF EXISTS "UserStaffRole_staffRoleId_fkey";

-- DropForeignKey
ALTER TABLE "UserStaffRole" DROP CONSTRAINT IF EXISTS "UserStaffRole_userId_fkey";

-- DropForeignKey
ALTER TABLE "business_scans" DROP CONSTRAINT IF EXISTS "business_scans_user_id_fkey";

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
ALTER TABLE "PaymentTransaction" DROP COLUMN IF EXISTS "status",
ADD COLUMN IF NOT EXISTS    "status" "PaymentTransactionStatus" NOT NULL;

-- AlterTable (IF NOT EXISTS: columns may already exist from 20260325000000_phase2a_monetization)
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "aiCreditsMonthly" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN IF NOT EXISTS "cmsPostsLimit" INTEGER,
ADD COLUMN IF NOT EXISTS "discoveryFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "qrCodesLimit" INTEGER,
ADD COLUMN IF NOT EXISTS "siteBuilderIncluded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "storageGBLimit" INTEGER NOT NULL DEFAULT 5;

-- AlterTable
ALTER TABLE "Reservation" DROP COLUMN IF EXISTS "depositAmountCents";

-- AlterTable (IF NOT EXISTS for columns from 20260325000000_phase2a_monetization; new columns without guard)
ALTER TABLE "Restaurant" 
ADD COLUMN IF NOT EXISTS "aiCreditsLimit" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN IF NOT EXISTS "aiCreditsUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "aiResetDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS    "approvedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS    "approvedBy" TEXT,
ADD COLUMN IF NOT EXISTS "cmsPostsThisMonth" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS    "duplicateFlags" JSONB,
ADD COLUMN IF NOT EXISTS "qrCodesCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS    "rejectionReason" TEXT,
ADD COLUMN IF NOT EXISTS    "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
ADD COLUMN IF NOT EXISTS "storageUsedBytes" BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS    "addedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS    "expoConfirmedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS    "expoStatus" "ExpoStatus" DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS    "isAddon" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS    "parentOrderId" TEXT,
ADD COLUMN IF NOT EXISTS    "readyForExpoAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS    "servedConfirmedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS    "syncedAt" TIMESTAMP(3),
ALTER COLUMN "kitchenDispatchedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SaleItem" ADD COLUMN IF NOT EXISTS    "deliveredAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS    "itemStatus" "ItemStatus" DEFAULT 'NEW',
ADD COLUMN IF NOT EXISTS    "itemVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS    "mutationType" "MutationType" NOT NULL DEFAULT 'CREATED',
ADD COLUMN IF NOT EXISTS    "parentItemId" TEXT,
ADD COLUMN IF NOT EXISTS    "prepStartedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS    "readyAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS    "replacedBy" TEXT,
ADD COLUMN IF NOT EXISTS    "routedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS    "stationId" TEXT;

-- AlterTable
ALTER TABLE "StaffRole" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN IF EXISTS "status",
ADD COLUMN IF NOT EXISTS    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "TableSession" ALTER COLUMN "checkoutMode" SET NOT NULL,
ALTER COLUMN "checkoutStatus" SET NOT NULL,
ALTER COLUMN "checkoutInitiatedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "checkoutCompletedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "runningTotalCents" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS    "locale" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN IF NOT EXISTS    "preferredCurrency" TEXT NOT NULL DEFAULT 'RWF',
ADD COLUMN IF NOT EXISTS    "timezone" TEXT NOT NULL DEFAULT 'Africa/Kigali';

-- AlterTable
ALTER TABLE "UserStaffRole" ALTER COLUMN "assignedAt" SET DATA TYPE TIMESTAMP(3);

-- DropTable (idempotent)
DROP TABLE IF EXISTS "business_scans";

-- CreateTable
CREATE TABLE IF NOT EXISTS "SeatSession" (
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
CREATE TABLE IF NOT EXISTS "BusinessView" (
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
CREATE TABLE IF NOT EXISTS "UserLoginOtp" (
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
CREATE TABLE IF NOT EXISTS "UserDevice" (
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
CREATE TABLE IF NOT EXISTS "SecurityEvent" (
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
CREATE TABLE IF NOT EXISTS "BillingEvent" (
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
CREATE TABLE IF NOT EXISTS "EventLog" (
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
CREATE TABLE IF NOT EXISTS "QrTemplate" (
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
CREATE TABLE IF NOT EXISTS "QrDesign" (
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
CREATE TABLE IF NOT EXISTS "QrCode" (
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
CREATE TABLE IF NOT EXISTS "WaiterCall" (
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
CREATE TABLE IF NOT EXISTS "CurrencyExchangeRate" (
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
CREATE TABLE IF NOT EXISTS "SupportedCurrency" (
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
CREATE TABLE IF NOT EXISTS "BusinessScan" (
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
CREATE TABLE IF NOT EXISTS "OptimizationRecommendation" (
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
CREATE TABLE IF NOT EXISTS "OptimizationAction" (
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
CREATE TABLE IF NOT EXISTS "OptimizationOutcome" (
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
CREATE TABLE IF NOT EXISTS "SupportedTimezone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "utcOffset" TEXT NOT NULL,
    "countryCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportedTimezone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ReferralClick" (
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
CREATE TABLE IF NOT EXISTS "ReferralReward" (
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
CREATE TABLE IF NOT EXISTS "AffiliateEarnings" (
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
CREATE TABLE IF NOT EXISTS "TableSessionInvite" (
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
CREATE TABLE IF NOT EXISTS "FraudDetectionLog" (
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
CREATE TABLE IF NOT EXISTS "ABTest" (
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
CREATE TABLE IF NOT EXISTS "ABVariant" (
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
CREATE TABLE IF NOT EXISTS "ABAssignment" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ABAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ABEvent" (
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
CREATE TABLE IF NOT EXISTS "SupplierRecommendationLog" (
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
CREATE TABLE IF NOT EXISTS "SupplierPerformanceCache" (
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
CREATE TABLE IF NOT EXISTS "Contact" (
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
CREATE TABLE IF NOT EXISTS "ContactOrganization" (
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
CREATE TABLE IF NOT EXISTS "OrganizationMember" (
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
CREATE TABLE IF NOT EXISTS "ContactRelationship" (
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
CREATE TABLE IF NOT EXISTS "ContactActivity" (
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
CREATE TABLE IF NOT EXISTS "ContactSegment" (
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
CREATE TABLE IF NOT EXISTS "ContactTag" (
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
CREATE TABLE IF NOT EXISTS "SupportConversation" (
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
CREATE TABLE IF NOT EXISTS "SupportMessage" (
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
CREATE TABLE IF NOT EXISTS "SupportCannedReply" (
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
CREATE TABLE IF NOT EXISTS "ProfessionalMarketer" (
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
CREATE TABLE IF NOT EXISTS "MarketerAttribution" (
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
CREATE TABLE IF NOT EXISTS "MarketerWallet" (
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
CREATE TABLE IF NOT EXISTS "MarketerCommission" (
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
CREATE TABLE IF NOT EXISTS "MarketerPayout" (
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
CREATE TABLE IF NOT EXISTS "MarketerRiskProfile" (
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
CREATE TABLE IF NOT EXISTS "RevenueEvent" (
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
CREATE TABLE IF NOT EXISTS "RevenueAlert" (
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
CREATE TABLE IF NOT EXISTS "DemoRequest" (
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
CREATE TABLE IF NOT EXISTS "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailOrPhone" TEXT NOT NULL,
    "sourcePage" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "unsubscribedAt" TIMESTAMP(3),

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Station" (
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
CREATE TABLE IF NOT EXISTS "RouteRule" (
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
CREATE TABLE IF NOT EXISTS "TicketEvent" (
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
CREATE TABLE IF NOT EXISTS "SLAProfile" (
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
CREATE TABLE IF NOT EXISTS "IdempotencyKey" (
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
CREATE UNIQUE INDEX IF NOT EXISTS "SeatSession_participantId_key" ON "SeatSession"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "SeatSession_sessionToken_key" ON "SeatSession"("sessionToken");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SeatSession_seatId_state_idx" ON "SeatSession"("seatId", "state");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SeatSession_lockExpiresAt_idx" ON "SeatSession"("lockExpiresAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SeatSession_sessionToken_idx" ON "SeatSession"("sessionToken");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SeatSession_lockedByTempId_idx" ON "SeatSession"("lockedByTempId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BusinessView_businessId_viewedAt_idx" ON "BusinessView"("businessId", "viewedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BusinessView_sessionId_idx" ON "BusinessView"("sessionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BusinessView_userId_idx" ON "BusinessView"("userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "UserLoginOtp_confirmToken_key" ON "UserLoginOtp"("confirmToken");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserLoginOtp_userId_idx" ON "UserLoginOtp"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserLoginOtp_confirmToken_idx" ON "UserLoginOtp"("confirmToken");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserLoginOtp_expiresAt_idx" ON "UserLoginOtp"("expiresAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserDevice_userId_idx" ON "UserDevice"("userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "UserDevice_userId_fingerprint_key" ON "UserDevice"("userId", "fingerprint");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SecurityEvent_userId_idx" ON "SecurityEvent"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SecurityEvent_eventType_createdAt_idx" ON "SecurityEvent"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BillingEvent_businessId_occurredAt_idx" ON "BillingEvent"("businessId", "occurredAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BillingEvent_subscriptionId_idx" ON "BillingEvent"("subscriptionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BillingEvent_paymentTransactionId_idx" ON "BillingEvent"("paymentTransactionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BillingEvent_eventType_occurredAt_idx" ON "BillingEvent"("eventType", "occurredAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventLog_businessId_type_createdAt_idx" ON "EventLog"("businessId", "type", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventLog_type_createdAt_idx" ON "EventLog"("type", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventLog_entityType_entityId_idx" ON "EventLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventLog_sessionId_idx" ON "EventLog"("sessionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QrTemplate_category_idx" ON "QrTemplate"("category");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QrDesign_businessId_idx" ON "QrDesign"("businessId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QrDesign_templateId_idx" ON "QrDesign"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "QrCode_designId_key" ON "QrCode"("designId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "QrCode_token_key" ON "QrCode"("token");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QrCode_token_idx" ON "QrCode"("token");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QrCode_businessId_idx" ON "QrCode"("businessId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WaiterCall_tableId_status_idx" ON "WaiterCall"("tableId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WaiterCall_businessId_status_idx" ON "WaiterCall"("businessId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WaiterCall_createdAt_idx" ON "WaiterCall"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WaiterCall_status_createdAt_idx" ON "WaiterCall"("status", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WaiterCall_orderId_createdAt_idx" ON "WaiterCall"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CurrencyExchangeRate_fromCurrency_toCurrency_validFrom_idx" ON "CurrencyExchangeRate"("fromCurrency", "toCurrency", "validFrom");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CurrencyExchangeRate_fromCurrency_toCurrency_validFrom_key" ON "CurrencyExchangeRate"("fromCurrency", "toCurrency", "validFrom");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BusinessScan_businessId_createdAt_idx" ON "BusinessScan"("businessId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BusinessScan_score_idx" ON "BusinessScan"("score");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OptimizationRecommendation_businessId_status_createdAt_idx" ON "OptimizationRecommendation"("businessId", "status", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OptimizationRecommendation_source_category_idx" ON "OptimizationRecommendation"("source", "category");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OptimizationRecommendation_priority_status_idx" ON "OptimizationRecommendation"("priority", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OptimizationAction_recommendationId_executedAt_idx" ON "OptimizationAction"("recommendationId", "executedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OptimizationAction_actionType_idx" ON "OptimizationAction"("actionType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OptimizationOutcome_recommendationId_measuredAt_idx" ON "OptimizationOutcome"("recommendationId", "measuredAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OptimizationOutcome_businessId_metricType_idx" ON "OptimizationOutcome"("businessId", "metricType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReferralClick_referralLinkId_clickedAt_idx" ON "ReferralClick"("referralLinkId", "clickedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReferralClick_deviceId_idx" ON "ReferralClick"("deviceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReferralClick_ipAddress_idx" ON "ReferralClick"("ipAddress");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReferralReward_referralLinkId_status_idx" ON "ReferralReward"("referralLinkId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReferralReward_customerId_status_idx" ON "ReferralReward"("customerId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReferralReward_type_status_idx" ON "ReferralReward"("type", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReferralReward_tier_status_idx" ON "ReferralReward"("tier", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReferralReward_lockUntil_idx" ON "ReferralReward"("lockUntil");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReferralReward_createdAt_idx" ON "ReferralReward"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AffiliateEarnings_referralLinkId_status_idx" ON "AffiliateEarnings"("referralLinkId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AffiliateEarnings_month_idx" ON "AffiliateEarnings"("month");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "AffiliateEarnings_referralLinkId_month_key" ON "AffiliateEarnings"("referralLinkId", "month");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "TableSessionInvite_inviteCode_key" ON "TableSessionInvite"("inviteCode");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TableSessionInvite_inviteCode_idx" ON "TableSessionInvite"("inviteCode");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TableSessionInvite_sessionId_status_idx" ON "TableSessionInvite"("sessionId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TableSessionInvite_inviterId_idx" ON "TableSessionInvite"("inviterId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FraudDetectionLog_entityType_entityId_idx" ON "FraudDetectionLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FraudDetectionLog_riskScore_idx" ON "FraudDetectionLog"("riskScore");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FraudDetectionLog_action_idx" ON "FraudDetectionLog"("action");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FraudDetectionLog_createdAt_idx" ON "FraudDetectionLog"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ABTest_businessId_status_idx" ON "ABTest"("businessId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ABTest_menuItemId_idx" ON "ABTest"("menuItemId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ABVariant_testId_idx" ON "ABVariant"("testId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ABAssignment_testId_variantId_idx" ON "ABAssignment"("testId", "variantId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ABAssignment_testId_visitorId_key" ON "ABAssignment"("testId", "visitorId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ABEvent_testId_variantId_type_idx" ON "ABEvent"("testId", "variantId", "type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ABEvent_createdAt_idx" ON "ABEvent"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SupplierRecommendationLog_businessId_supplierId_idx" ON "SupplierRecommendationLog"("businessId", "supplierId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SupplierRecommendationLog_userId_action_idx" ON "SupplierRecommendationLog"("userId", "action");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SupplierRecommendationLog_createdAt_idx" ON "SupplierRecommendationLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "SupplierPerformanceCache_supplierId_key" ON "SupplierPerformanceCache"("supplierId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SupplierPerformanceCache_lastCalculated_idx" ON "SupplierPerformanceCache"("lastCalculated");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Contact_businessId_type_idx" ON "Contact"("businessId", "type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Contact_businessId_status_idx" ON "Contact"("businessId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Contact_email_idx" ON "Contact"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Contact_phone_idx" ON "Contact"("phone");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Contact_tags_idx" ON "Contact"("tags");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Contact_lastActivityAt_idx" ON "Contact"("lastActivityAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Contact_createdAt_idx" ON "Contact"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Contact_businessId_phone_key" ON "Contact"("businessId", "phone");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ContactOrganization_businessId_type_idx" ON "ContactOrganization"("businessId", "type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ContactOrganization_businessId_name_idx" ON "ContactOrganization"("businessId", "name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ContactOrganization_createdAt_idx" ON "ContactOrganization"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OrganizationMember_organizationId_idx" ON "OrganizationMember"("organizationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OrganizationMember_contactId_idx" ON "OrganizationMember"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "OrganizationMember_contactId_organizationId_key" ON "OrganizationMember"("contactId", "organizationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ContactRelationship_businessId_relationshipType_idx" ON "ContactRelationship"("businessId", "relationshipType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ContactRelationship_fromContactId_idx" ON "ContactRelationship"("fromContactId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ContactRelationship_toContactId_idx" ON "ContactRelationship"("toContactId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ContactRelationship_fromOrgId_idx" ON "ContactRelationship"("fromOrgId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ContactRelationship_toOrgId_idx" ON "ContactRelationship"("toOrgId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ContactRelationship_isActive_idx" ON "ContactRelationship"("isActive");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ContactActivity_contactId_timestamp_idx" ON "ContactActivity"("contactId", "timestamp");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ContactActivity_businessId_activityType_idx" ON "ContactActivity"("businessId", "activityType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ContactActivity_timestamp_idx" ON "ContactActivity"("timestamp");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ContactActivity_source_sourceId_idx" ON "ContactActivity"("source", "sourceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ContactSegment_businessId_idx" ON "ContactSegment"("businessId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ContactTag_businessId_idx" ON "ContactTag"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ContactTag_businessId_name_key" ON "ContactTag"("businessId", "name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SupportConversation_businessId_status_updatedAt_idx" ON "SupportConversation"("businessId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SupportConversation_createdById_updatedAt_idx" ON "SupportConversation"("createdById", "updatedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SupportConversation_assignedToId_status_idx" ON "SupportConversation"("assignedToId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SupportMessage_conversationId_createdAt_idx" ON "SupportMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SupportMessage_senderType_createdAt_idx" ON "SupportMessage"("senderType", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SupportCannedReply_businessId_isActive_idx" ON "SupportCannedReply"("businessId", "isActive");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SupportCannedReply_businessId_shortcut_idx" ON "SupportCannedReply"("businessId", "shortcut");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ProfessionalMarketer_userId_key" ON "ProfessionalMarketer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ProfessionalMarketer_email_key" ON "ProfessionalMarketer"("email");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ProfessionalMarketer_phone_key" ON "ProfessionalMarketer"("phone");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ProfessionalMarketer_referralCode_key" ON "ProfessionalMarketer"("referralCode");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProfessionalMarketer_status_idx" ON "ProfessionalMarketer"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProfessionalMarketer_referralCode_idx" ON "ProfessionalMarketer"("referralCode");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProfessionalMarketer_email_idx" ON "ProfessionalMarketer"("email");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "MarketerAttribution_businessId_key" ON "MarketerAttribution"("businessId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MarketerAttribution_marketerId_idx" ON "MarketerAttribution"("marketerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MarketerAttribution_businessId_idx" ON "MarketerAttribution"("businessId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MarketerAttribution_attributedAt_idx" ON "MarketerAttribution"("attributedAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "MarketerWallet_marketerId_key" ON "MarketerWallet"("marketerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MarketerWallet_marketerId_idx" ON "MarketerWallet"("marketerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MarketerCommission_marketerId_status_idx" ON "MarketerCommission"("marketerId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MarketerCommission_businessId_idx" ON "MarketerCommission"("businessId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MarketerCommission_status_idx" ON "MarketerCommission"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MarketerCommission_createdAt_idx" ON "MarketerCommission"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "MarketerPayout_referenceId_key" ON "MarketerPayout"("referenceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MarketerPayout_marketerId_status_idx" ON "MarketerPayout"("marketerId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MarketerPayout_status_idx" ON "MarketerPayout"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MarketerPayout_createdAt_idx" ON "MarketerPayout"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "MarketerRiskProfile_marketerId_key" ON "MarketerRiskProfile"("marketerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MarketerRiskProfile_riskLevel_idx" ON "MarketerRiskProfile"("riskLevel");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MarketerRiskProfile_marketerId_idx" ON "MarketerRiskProfile"("marketerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RevenueEvent_type_createdAt_idx" ON "RevenueEvent"("type", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RevenueEvent_entityType_entityId_idx" ON "RevenueEvent"("entityType", "entityId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RevenueEvent_createdAt_idx" ON "RevenueEvent"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RevenueAlert_severity_acknowledged_idx" ON "RevenueAlert"("severity", "acknowledged");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RevenueAlert_createdAt_idx" ON "RevenueAlert"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RevenueAlert_acknowledged_idx" ON "RevenueAlert"("acknowledged");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DemoRequest_status_createdAt_idx" ON "DemoRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DemoRequest_createdAt_idx" ON "DemoRequest"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "NewsletterSubscriber_emailOrPhone_key" ON "NewsletterSubscriber"("emailOrPhone");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "NewsletterSubscriber_isActive_createdAt_idx" ON "NewsletterSubscriber"("isActive", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "NewsletterSubscriber_createdAt_idx" ON "NewsletterSubscriber"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Station_businessId_isActive_idx" ON "Station"("businessId", "isActive");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Station_businessId_type_idx" ON "Station"("businessId", "type");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Station_businessId_code_key" ON "Station"("businessId", "code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RouteRule_businessId_isActive_idx" ON "RouteRule"("businessId", "isActive");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RouteRule_menuItemId_idx" ON "RouteRule"("menuItemId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RouteRule_category_idx" ON "RouteRule"("category");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RouteRule_stationId_idx" ON "RouteRule"("stationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TicketEvent_saleId_createdAt_idx" ON "TicketEvent"("saleId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TicketEvent_saleItemId_sequenceNumber_idx" ON "TicketEvent"("saleItemId", "sequenceNumber");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TicketEvent_eventType_idx" ON "TicketEvent"("eventType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TicketEvent_createdAt_idx" ON "TicketEvent"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TicketEvent_stationId_idx" ON "TicketEvent"("stationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TicketEvent_idempotencyKey_idx" ON "TicketEvent"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "TicketEvent_saleItemId_idempotencyKey_key" ON "TicketEvent"("saleItemId", "idempotencyKey");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SLAProfile_businessId_isActive_idx" ON "SLAProfile"("businessId", "isActive");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SLAProfile_stationId_idx" ON "SLAProfile"("stationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SLAProfile_category_idx" ON "SLAProfile"("category");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "IdempotencyKey_key_key" ON "IdempotencyKey"("key");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "IdempotencyKey_businessId_endpoint_idx" ON "IdempotencyKey"("businessId", "endpoint");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "IdempotencyKey_expiresAt_idx" ON "IdempotencyKey"("expiresAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AffiliateCommissionNew_status_lockUntil_idx" ON "AffiliateCommissionNew"("status", "lockUntil");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AffiliateCommissionNew_affiliateId_status_idx" ON "AffiliateCommissionNew"("affiliateId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CheckoutEvent_paymentId_idx" ON "CheckoutEvent"("paymentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CheckoutEvent_eventType_createdAt_idx" ON "CheckoutEvent"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PaymentTransaction_status_idx" ON "PaymentTransaction"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PaymentTransaction_updatedAt_idx" ON "PaymentTransaction"("updatedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PaymentTransaction_status_createdAt_idx" ON "PaymentTransaction"("status", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PaymentTransaction_businessId_status_idx" ON "PaymentTransaction"("businessId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Sale_businessId_createdAt_idx" ON "Sale"("businessId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Sale_paymentStatus_createdAt_idx" ON "Sale"("paymentStatus", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Sale_parentOrderId_idx" ON "Sale"("parentOrderId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Sale_isAddon_idx" ON "Sale"("isAddon");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Sale_businessId_isAddon_idx" ON "Sale"("businessId", "isAddon");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SaleItem_itemStatus_idx" ON "SaleItem"("itemStatus");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SaleItem_stationId_idx" ON "SaleItem"("stationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SaleItem_saleId_itemStatus_idx" ON "SaleItem"("saleId", "itemStatus");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SaleItem_parentItemId_idx" ON "SaleItem"("parentItemId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SaleItem_mutationType_idx" ON "SaleItem"("mutationType");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_primaryBranchId_fkey" FOREIGN KEY ("primaryBranchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_parentOrderId_fkey" FOREIGN KEY ("parentOrderId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Sale_businessId_fkey') THEN ALTER TABLE "Sale" ADD CONSTRAINT "Sale_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StaffRole_businessId_fkey') THEN ALTER TABLE "StaffRole" ADD CONSTRAINT "StaffRole_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
ALTER TABLE "StaffRole" ADD CONSTRAINT "StaffRole_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserStaffRole_userId_fkey') THEN ALTER TABLE "UserStaffRole" ADD CONSTRAINT "UserStaffRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserStaffRole_staffRoleId_fkey') THEN ALTER TABLE "UserStaffRole" ADD CONSTRAINT "UserStaffRole_staffRoleId_fkey" FOREIGN KEY ("staffRoleId") REFERENCES "StaffRole"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserStaffRole_businessId_fkey') THEN ALTER TABLE "UserStaffRole" ADD CONSTRAINT "UserStaffRole_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SeatSession_seatId_fkey') THEN ALTER TABLE "SeatSession" ADD CONSTRAINT "SeatSession_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "Seat"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
ALTER TABLE "SeatSession" ADD CONSTRAINT "SeatSession_tableSessionId_fkey" FOREIGN KEY ("tableSessionId") REFERENCES "TableSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatSession" ADD CONSTRAINT "SeatSession_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "SessionParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BusinessView_businessId_fkey') THEN ALTER TABLE "BusinessView" ADD CONSTRAINT "BusinessView_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserLoginOtp_userId_fkey') THEN ALTER TABLE "UserLoginOtp" ADD CONSTRAINT "UserLoginOtp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserDevice_userId_fkey') THEN ALTER TABLE "UserDevice" ADD CONSTRAINT "UserDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
ALTER TABLE "SecurityEvent" ADD CONSTRAINT "SecurityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BillingEvent_businessId_fkey') THEN ALTER TABLE "BillingEvent" ADD CONSTRAINT "BillingEvent_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
ALTER TABLE "BillingEvent" ADD CONSTRAINT "BillingEvent_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingEvent" ADD CONSTRAINT "BillingEvent_paymentTransactionId_fkey" FOREIGN KEY ("paymentTransactionId") REFERENCES "PaymentTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QrDesign_businessId_fkey') THEN ALTER TABLE "QrDesign" ADD CONSTRAINT "QrDesign_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QrDesign_templateId_fkey') THEN ALTER TABLE "QrDesign" ADD CONSTRAINT "QrDesign_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "QrTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QrCode_businessId_fkey') THEN ALTER TABLE "QrCode" ADD CONSTRAINT "QrCode_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QrCode_designId_fkey') THEN ALTER TABLE "QrCode" ADD CONSTRAINT "QrCode_designId_fkey" FOREIGN KEY ("designId") REFERENCES "QrDesign"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AIUsageLog_businessId_fkey') THEN ALTER TABLE "AIUsageLog" ADD CONSTRAINT "AIUsageLog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SiteBuilderSubscription_businessId_fkey') THEN ALTER TABLE "SiteBuilderSubscription" ADD CONSTRAINT "SiteBuilderSubscription_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DiscoverySubscription_businessId_fkey') THEN ALTER TABLE "DiscoverySubscription" ADD CONSTRAINT "DiscoverySubscription_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WaiterCall_tableId_fkey') THEN ALTER TABLE "WaiterCall" ADD CONSTRAINT "WaiterCall_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
ALTER TABLE "WaiterCall" ADD CONSTRAINT "WaiterCall_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TableSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WaiterCall_businessId_fkey') THEN ALTER TABLE "WaiterCall" ADD CONSTRAINT "WaiterCall_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
ALTER TABLE "WaiterCall" ADD CONSTRAINT "WaiterCall_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BusinessScan_businessId_fkey') THEN ALTER TABLE "BusinessScan" ADD CONSTRAINT "BusinessScan_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OptimizationRecommendation_businessId_fkey') THEN ALTER TABLE "OptimizationRecommendation" ADD CONSTRAINT "OptimizationRecommendation_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OptimizationAction_recommendationId_fkey') THEN ALTER TABLE "OptimizationAction" ADD CONSTRAINT "OptimizationAction_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "OptimizationRecommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OptimizationOutcome_businessId_fkey') THEN ALTER TABLE "OptimizationOutcome" ADD CONSTRAINT "OptimizationOutcome_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OptimizationOutcome_recommendationId_fkey') THEN ALTER TABLE "OptimizationOutcome" ADD CONSTRAINT "OptimizationOutcome_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "OptimizationRecommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ReferralClick_referralLinkId_fkey') THEN ALTER TABLE "ReferralClick" ADD CONSTRAINT "ReferralClick_referralLinkId_fkey" FOREIGN KEY ("referralLinkId") REFERENCES "ReferralLink"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ReferralReward_referralLinkId_fkey') THEN ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_referralLinkId_fkey" FOREIGN KEY ("referralLinkId") REFERENCES "ReferralLink"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AffiliateEarnings_referralLinkId_fkey') THEN ALTER TABLE "AffiliateEarnings" ADD CONSTRAINT "AffiliateEarnings_referralLinkId_fkey" FOREIGN KEY ("referralLinkId") REFERENCES "ReferralLink"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TableSessionInvite_sessionId_fkey') THEN ALTER TABLE "TableSessionInvite" ADD CONSTRAINT "TableSessionInvite_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TableSession"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TableSessionInvite_inviterId_fkey') THEN ALTER TABLE "TableSessionInvite" ADD CONSTRAINT "TableSessionInvite_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "SessionParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
ALTER TABLE "TableSessionInvite" ADD CONSTRAINT "TableSessionInvite_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "SessionParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ABTest_businessId_fkey') THEN ALTER TABLE "ABTest" ADD CONSTRAINT "ABTest_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
ALTER TABLE "ABTest" ADD CONSTRAINT "ABTest_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ABTest" ADD CONSTRAINT "ABTest_winnerVariantId_fkey" FOREIGN KEY ("winnerVariantId") REFERENCES "ABVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ABVariant_testId_fkey') THEN ALTER TABLE "ABVariant" ADD CONSTRAINT "ABVariant_testId_fkey" FOREIGN KEY ("testId") REFERENCES "ABTest"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ABAssignment_testId_fkey') THEN ALTER TABLE "ABAssignment" ADD CONSTRAINT "ABAssignment_testId_fkey" FOREIGN KEY ("testId") REFERENCES "ABTest"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ABAssignment_variantId_fkey') THEN ALTER TABLE "ABAssignment" ADD CONSTRAINT "ABAssignment_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ABVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ABEvent_testId_fkey') THEN ALTER TABLE "ABEvent" ADD CONSTRAINT "ABEvent_testId_fkey" FOREIGN KEY ("testId") REFERENCES "ABTest"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ABEvent_variantId_fkey') THEN ALTER TABLE "ABEvent" ADD CONSTRAINT "ABEvent_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ABVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SupplierRecommendationLog_businessId_fkey') THEN ALTER TABLE "SupplierRecommendationLog" ADD CONSTRAINT "SupplierRecommendationLog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SupplierRecommendationLog_userId_fkey') THEN ALTER TABLE "SupplierRecommendationLog" ADD CONSTRAINT "SupplierRecommendationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SupplierRecommendationLog_supplierId_fkey') THEN ALTER TABLE "SupplierRecommendationLog" ADD CONSTRAINT "SupplierRecommendationLog_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SupplierPerformanceCache_supplierId_fkey') THEN ALTER TABLE "SupplierPerformanceCache" ADD CONSTRAINT "SupplierPerformanceCache_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Contact_businessId_fkey') THEN ALTER TABLE "Contact" ADD CONSTRAINT "Contact_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ContactOrganization_businessId_fkey') THEN ALTER TABLE "ContactOrganization" ADD CONSTRAINT "ContactOrganization_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OrganizationMember_contactId_fkey') THEN ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OrganizationMember_organizationId_fkey') THEN ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "ContactOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ContactRelationship_businessId_fkey') THEN ALTER TABLE "ContactRelationship" ADD CONSTRAINT "ContactRelationship_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ContactRelationship_fromContactId_fkey') THEN ALTER TABLE "ContactRelationship" ADD CONSTRAINT "ContactRelationship_fromContactId_fkey" FOREIGN KEY ("fromContactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ContactRelationship_toContactId_fkey') THEN ALTER TABLE "ContactRelationship" ADD CONSTRAINT "ContactRelationship_toContactId_fkey" FOREIGN KEY ("toContactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
ALTER TABLE "ContactRelationship" ADD CONSTRAINT "ContactRelationship_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "ContactOrganization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ContactActivity_contactId_fkey') THEN ALTER TABLE "ContactActivity" ADD CONSTRAINT "ContactActivity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ContactActivity_businessId_fkey') THEN ALTER TABLE "ContactActivity" ADD CONSTRAINT "ContactActivity_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ContactSegment_businessId_fkey') THEN ALTER TABLE "ContactSegment" ADD CONSTRAINT "ContactSegment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ContactTag_businessId_fkey') THEN ALTER TABLE "ContactTag" ADD CONSTRAINT "ContactTag_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SupportConversation_businessId_fkey') THEN ALTER TABLE "SupportConversation" ADD CONSTRAINT "SupportConversation_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SupportConversation_createdById_fkey') THEN ALTER TABLE "SupportConversation" ADD CONSTRAINT "SupportConversation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
ALTER TABLE "SupportConversation" ADD CONSTRAINT "SupportConversation_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SupportMessage_conversationId_fkey') THEN ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "SupportConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SupportCannedReply_businessId_fkey') THEN ALTER TABLE "SupportCannedReply" ADD CONSTRAINT "SupportCannedReply_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DiningSessionSlip_sessionId_fkey') THEN ALTER TABLE "DiningSessionSlip" ADD CONSTRAINT "DiningSessionSlip_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TableSession"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DiningSessionSlip_businessId_fkey') THEN ALTER TABLE "DiningSessionSlip" ADD CONSTRAINT "DiningSessionSlip_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
ALTER TABLE "DiningSessionSlip" ADD CONSTRAINT "DiningSessionSlip_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DiningSessionSlipItem_slipId_fkey') THEN ALTER TABLE "DiningSessionSlipItem" ADD CONSTRAINT "DiningSessionSlipItem_slipId_fkey" FOREIGN KEY ("slipId") REFERENCES "DiningSessionSlip"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DiningSessionSlipItem_saleId_fkey') THEN ALTER TABLE "DiningSessionSlipItem" ADD CONSTRAINT "DiningSessionSlipItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DiningSessionSlipItem_saleItemId_fkey') THEN ALTER TABLE "DiningSessionSlipItem" ADD CONSTRAINT "DiningSessionSlipItem_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "SaleItem"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CheckoutEvent_sessionId_fkey') THEN ALTER TABLE "CheckoutEvent" ADD CONSTRAINT "CheckoutEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TableSession"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
ALTER TABLE "CheckoutEvent" ADD CONSTRAINT "CheckoutEvent_slipId_fkey" FOREIGN KEY ("slipId") REFERENCES "DiningSessionSlip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CheckoutEvent_businessId_fkey') THEN ALTER TABLE "CheckoutEvent" ADD CONSTRAINT "CheckoutEvent_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MarketerAttribution_marketerId_fkey') THEN ALTER TABLE "MarketerAttribution" ADD CONSTRAINT "MarketerAttribution_marketerId_fkey" FOREIGN KEY ("marketerId") REFERENCES "ProfessionalMarketer"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MarketerWallet_marketerId_fkey') THEN ALTER TABLE "MarketerWallet" ADD CONSTRAINT "MarketerWallet_marketerId_fkey" FOREIGN KEY ("marketerId") REFERENCES "ProfessionalMarketer"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MarketerCommission_marketerId_fkey') THEN ALTER TABLE "MarketerCommission" ADD CONSTRAINT "MarketerCommission_marketerId_fkey" FOREIGN KEY ("marketerId") REFERENCES "ProfessionalMarketer"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MarketerPayout_marketerId_fkey') THEN ALTER TABLE "MarketerPayout" ADD CONSTRAINT "MarketerPayout_marketerId_fkey" FOREIGN KEY ("marketerId") REFERENCES "ProfessionalMarketer"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MarketerRiskProfile_marketerId_fkey') THEN ALTER TABLE "MarketerRiskProfile" ADD CONSTRAINT "MarketerRiskProfile_marketerId_fkey" FOREIGN KEY ("marketerId") REFERENCES "ProfessionalMarketer"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Station_businessId_fkey') THEN ALTER TABLE "Station" ADD CONSTRAINT "Station_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RouteRule_businessId_fkey') THEN ALTER TABLE "RouteRule" ADD CONSTRAINT "RouteRule_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RouteRule_stationId_fkey') THEN ALTER TABLE "RouteRule" ADD CONSTRAINT "RouteRule_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RouteRule_menuItemId_fkey') THEN ALTER TABLE "RouteRule" ADD CONSTRAINT "RouteRule_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TicketEvent_saleId_fkey') THEN ALTER TABLE "TicketEvent" ADD CONSTRAINT "TicketEvent_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TicketEvent_saleItemId_fkey') THEN ALTER TABLE "TicketEvent" ADD CONSTRAINT "TicketEvent_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "SaleItem"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
ALTER TABLE "TicketEvent" ADD CONSTRAINT "TicketEvent_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketEvent" ADD CONSTRAINT "TicketEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SLAProfile_businessId_fkey') THEN ALTER TABLE "SLAProfile" ADD CONSTRAINT "SLAProfile_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SLAProfile_stationId_fkey') THEN ALTER TABLE "SLAProfile" ADD CONSTRAINT "SLAProfile_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'IdempotencyKey_businessId_fkey') THEN ALTER TABLE "IdempotencyKey" ADD CONSTRAINT "IdempotencyKey_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;
