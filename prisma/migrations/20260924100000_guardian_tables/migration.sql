-- CreateEnum
CREATE TYPE "GuardianCaseState" AS ENUM ('DETECTED', 'UNDERSTANDING', 'DECISION', 'INTERVENTION_PENDING', 'INTERVENED', 'VERIFYING', 'RESOLVED', 'BREACHED', 'CLEARED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GuardianOutcome" AS ENUM ('PROTECTED_BY_GUARDIAN', 'RECOVERED_NATURALLY', 'INTERVENTION_FAILED', 'BREACHED', 'FALSE_POSITIVE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "GuardianCaseType" AS ENUM ('SERVICE_PROMISE_RISK');

-- CreateEnum
CREATE TYPE "GuardianDecisionLevel" AS ENUM ('OBSERVE', 'RECOMMEND', 'ALERT', 'ESCALATE');

-- CreateEnum
-- CreateTable
CREATE TABLE "GuardianCase" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "promiseId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "caseType" "GuardianCaseType" NOT NULL DEFAULT 'SERVICE_PROMISE_RISK',
    "state" "GuardianCaseState" NOT NULL DEFAULT 'DETECTED',
    "outcome" "GuardianOutcome",
    "triggerSignal" TEXT NOT NULL,
    "triggerState" TEXT NOT NULL,
    "triggerElapsedMinutes" INTEGER NOT NULL,
    "contextSnapshot" JSONB,
    "decisionLevel" "GuardianDecisionLevel",
    "decisionReasoning" TEXT,
    "decisionAt" TIMESTAMP(3),
    "assignedUserId" TEXT,
    "assignedRole" TEXT,
    "interventionCount" INTEGER NOT NULL DEFAULT 0,
    "lastNotifiedAt" TIMESTAMP(3),
    "lastNotificationChannel" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verificationNotes" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuardianCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardianIntervention" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "interventionType" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "recipient" TEXT,
    "messageContent" TEXT NOT NULL,
    "dispatchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedBy" TEXT,
    "result" TEXT,
    "metadata" JSONB,

    CONSTRAINT "GuardianIntervention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardianLearningSignal" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "outcome" "GuardianOutcome" NOT NULL,
    "caseType" "GuardianCaseType" NOT NULL,
    "triggerSignal" TEXT NOT NULL,
    "decisionLevel" "GuardianDecisionLevel",
    "interventionCount" INTEGER NOT NULL,
    "elapsedMinutesFromSignal" INTEGER,
    "contextSummary" JSONB,
    "lessonsLearned" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuardianLearningSignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GuardianCase_idempotencyKey_key" ON "GuardianCase"("idempotencyKey");

-- CreateIndex
CREATE INDEX "GuardianCase_businessId_state_idx" ON "GuardianCase"("businessId", "state");

-- CreateIndex
CREATE INDEX "GuardianCase_promiseId_idx" ON "GuardianCase"("promiseId");

-- CreateIndex
CREATE INDEX "GuardianCase_saleId_idx" ON "GuardianCase"("saleId");

-- CreateIndex
CREATE INDEX "GuardianCase_state_detectedAt_idx" ON "GuardianCase"("state", "detectedAt");

-- CreateIndex
CREATE INDEX "GuardianCase_outcome_idx" ON "GuardianCase"("outcome");

-- CreateIndex
CREATE INDEX "GuardianIntervention_caseId_dispatchedAt_idx" ON "GuardianIntervention"("caseId", "dispatchedAt");

-- CreateIndex
CREATE INDEX "GuardianIntervention_dispatchedAt_idx" ON "GuardianIntervention"("dispatchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GuardianLearningSignal_caseId_key" ON "GuardianLearningSignal"("caseId");

-- CreateIndex
CREATE INDEX "GuardianLearningSignal_businessId_outcome_idx" ON "GuardianLearningSignal"("businessId", "outcome");

-- CreateIndex
CREATE INDEX "GuardianLearningSignal_outcome_createdAt_idx" ON "GuardianLearningSignal"("outcome", "createdAt");

-- AddForeignKey
ALTER TABLE "GuardianCase" ADD CONSTRAINT "GuardianCase_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianCase" ADD CONSTRAINT "GuardianCase_promiseId_fkey" FOREIGN KEY ("promiseId") REFERENCES "ServicePromise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianCase" ADD CONSTRAINT "GuardianCase_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianCase" ADD CONSTRAINT "GuardianCase_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianIntervention" ADD CONSTRAINT "GuardianIntervention_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "GuardianCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianLearningSignal" ADD CONSTRAINT "GuardianLearningSignal_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "GuardianCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianLearningSignal" ADD CONSTRAINT "GuardianLearningSignal_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
