-- AlterEnum
ALTER TYPE "TicketEventType" ADD VALUE IF NOT EXISTS 'PROMISE_CREATED';
ALTER TYPE "TicketEventType" ADD VALUE IF NOT EXISTS 'PROMISE_WARNING';
ALTER TYPE "TicketEventType" ADD VALUE IF NOT EXISTS 'PROMISE_CRITICAL';
ALTER TYPE "TicketEventType" ADD VALUE IF NOT EXISTS 'PROMISE_FULFILLED';
ALTER TYPE "TicketEventType" ADD VALUE IF NOT EXISTS 'PROMISE_RECOVERED';
ALTER TYPE "TicketEventType" ADD VALUE IF NOT EXISTS 'PROMISE_FAILED';

-- CreateEnum
CREATE TYPE "PromiseState" AS ENUM ('ON_TRACK', 'WARNING', 'CRITICAL', 'FULFILLED', 'FAILED', 'RECOVERED');

-- CreateTable
CREATE TABLE "ServicePromise" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "promiseType" TEXT NOT NULL DEFAULT 'ORDER_PREPARATION',
    "state" "PromiseState" NOT NULL DEFAULT 'ON_TRACK',
    "startedAt" TIMESTAMP(3) NOT NULL,
    "expectedAt" TIMESTAMP(3) NOT NULL,
    "warningAt" TIMESTAMP(3) NOT NULL,
    "criticalAt" TIMESTAMP(3) NOT NULL,
    "warningTriggeredAt" TIMESTAMP(3),
    "criticalTriggeredAt" TIMESTAMP(3),
    "fulfilledAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "recoveredAt" TIMESTAMP(3),
    "warningAfterMinutes" INTEGER NOT NULL,
    "breachAfterMinutes" INTEGER NOT NULL,
    "actualMinutes" INTEGER,
    "idempotencyKey" TEXT NOT NULL,
    "lastEvaluatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicePromise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServicePromise_idempotencyKey_key" ON "ServicePromise"("idempotencyKey");
CREATE INDEX "ServicePromise_businessId_state_idx" ON "ServicePromise"("businessId", "state");
CREATE INDEX "ServicePromise_saleId_idx" ON "ServicePromise"("saleId");
CREATE INDEX "ServicePromise_businessId_saleId_idx" ON "ServicePromise"("businessId", "saleId");
CREATE INDEX "ServicePromise_state_expectedAt_idx" ON "ServicePromise"("state", "expectedAt");

-- AddForeignKey
ALTER TABLE "ServicePromise" ADD CONSTRAINT "ServicePromise_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE;
ALTER TABLE "ServicePromise" ADD CONSTRAINT "ServicePromise_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE;
