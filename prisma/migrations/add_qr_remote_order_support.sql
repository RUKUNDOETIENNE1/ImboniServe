-- Add OrderSource enum
CREATE TYPE "OrderSource" AS ENUM ('WAITER_POS', 'QR_IN_VENUE', 'QR_REMOTE');

-- Add QR & Remote Order fields to Sale
ALTER TABLE "Sale" ADD COLUMN "orderSource" "OrderSource" NOT NULL DEFAULT 'WAITER_POS';
ALTER TABLE "Sale" ADD COLUMN "scheduledAt" TIMESTAMP(3);
ALTER TABLE "Sale" ADD COLUMN "depositCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Sale" ADD COLUMN "customerPhone" TEXT;
ALTER TABLE "Sale" ADD COLUMN "customerName" TEXT;
ALTER TABLE "Sale" ADD COLUMN "prepStartedAt" TIMESTAMP(3);
ALTER TABLE "Sale" ADD COLUMN "kitchenReleasedAt" TIMESTAMP(3);
ALTER TABLE "Sale" ADD COLUMN "readyAt" TIMESTAMP(3);
ALTER TABLE "Sale" ADD COLUMN "paymentTransactionId" TEXT;

-- Add indexes for QR orders
CREATE INDEX "Sale_orderSource_idx" ON "Sale"("orderSource");
CREATE INDEX "Sale_scheduledAt_idx" ON "Sale"("scheduledAt");
CREATE INDEX "Sale_businessId_orderSource_idx" ON "Sale"("businessId", "orderSource");

-- Add unique constraint for paymentTransactionId
CREATE UNIQUE INDEX "Sale_paymentTransactionId_key" ON "Sale"("paymentTransactionId");

-- Add QR configuration to Business
ALTER TABLE "Business" ADD COLUMN "enableQRInVenue" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Business" ADD COLUMN "enableQRRemote" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Business" ADD COLUMN "requireDepositRemote" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Business" ADD COLUMN "defaultDepositPercent" DOUBLE PRECISION NOT NULL DEFAULT 50.0;
ALTER TABLE "Business" ADD COLUMN "maxRemoteOrdersPerSlot" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "Business" ADD COLUMN "slotDurationMinutes" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "Business" ADD COLUMN "prepBufferMinutes" INTEGER NOT NULL DEFAULT 10;

-- Add phone verification to Customer
ALTER TABLE "Customer" ADD COLUMN "phoneVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Customer" ADD COLUMN "phoneVerifiedAt" TIMESTAMP(3);
ALTER TABLE "Customer" ADD COLUMN "otpAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Customer" ADD COLUMN "lastOtpRequestAt" TIMESTAMP(3);

-- Create OrderToken table for replay prevention
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

CREATE UNIQUE INDEX "OrderToken_jti_key" ON "OrderToken"("jti");
CREATE INDEX "OrderToken_jti_idx" ON "OrderToken"("jti");
CREATE INDEX "OrderToken_expiresAt_idx" ON "OrderToken"("expiresAt");

-- Add foreign key for Sale.paymentTransactionId
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_paymentTransactionId_fkey" FOREIGN KEY ("paymentTransactionId") REFERENCES "PaymentTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add Sale relation to PaymentTransaction
ALTER TABLE "PaymentTransaction" ADD COLUMN "saleId" TEXT;
CREATE UNIQUE INDEX "PaymentTransaction_saleId_key" ON "PaymentTransaction"("saleId");
