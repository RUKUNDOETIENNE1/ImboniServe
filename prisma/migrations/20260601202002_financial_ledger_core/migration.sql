-- CreateEnum
CREATE TYPE "LedgerDomain" AS ENUM ('SUBSCRIPTION', 'MARKETPLACE', 'PLATFORM', 'OTHER');

-- CreateTable
CREATE TABLE "FinancialLedgerEntry" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "domain" "LedgerDomain" NOT NULL,
    "eventType" "BillingEventType" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RWF',
    "vatAmountCents" INTEGER,
    "exVatAmountCents" INTEGER,
    "gatewayFeeCents" INTEGER,
    "platformFeeCents" INTEGER,
    "netAmountCents" INTEGER,
    "gateway" "PaymentGateway",
    "paymentMethod" "PaymentMethod",
    "status" "PaymentTransactionStatus",
    "paymentTransactionId" TEXT,
    "subscriptionId" TEXT,
    "marketplaceOrderId" TEXT,
    "invoiceNumber" TEXT,
    "providerReference" TEXT,
    "idempotencyKey" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FinancialLedgerEntry_idempotencyKey_key" ON "FinancialLedgerEntry"("idempotencyKey");

-- CreateIndex
CREATE INDEX "FinancialLedgerEntry_businessId_occurredAt_idx" ON "FinancialLedgerEntry"("businessId", "occurredAt");

-- CreateIndex
CREATE INDEX "FinancialLedgerEntry_eventType_occurredAt_idx" ON "FinancialLedgerEntry"("eventType", "occurredAt");

-- CreateIndex
CREATE INDEX "FinancialLedgerEntry_domain_occurredAt_idx" ON "FinancialLedgerEntry"("domain", "occurredAt");

-- CreateIndex
CREATE INDEX "FinancialLedgerEntry_gateway_occurredAt_idx" ON "FinancialLedgerEntry"("gateway", "occurredAt");

-- CreateIndex
CREATE INDEX "FinancialLedgerEntry_paymentTransactionId_idx" ON "FinancialLedgerEntry"("paymentTransactionId");

-- CreateIndex
CREATE INDEX "FinancialLedgerEntry_subscriptionId_idx" ON "FinancialLedgerEntry"("subscriptionId");

-- CreateIndex
CREATE INDEX "FinancialLedgerEntry_marketplaceOrderId_idx" ON "FinancialLedgerEntry"("marketplaceOrderId");

-- CreateIndex
CREATE INDEX "FinancialLedgerEntry_invoiceNumber_idx" ON "FinancialLedgerEntry"("invoiceNumber");
