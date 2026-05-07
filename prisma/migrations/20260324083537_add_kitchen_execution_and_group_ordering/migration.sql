-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "almostReadyAt" TIMESTAMP(3),
ADD COLUMN     "participantId" TEXT,
ADD COLUMN     "preparingAt" TIMESTAMP(3),
ADD COLUMN     "servedAt" TIMESTAMP(3),
ADD COLUMN     "tableSessionId" TEXT;

-- CreateTable
CREATE TABLE "TableSession" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TableSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionParticipant" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "tempId" TEXT NOT NULL,
    "name" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TableSession_tableId_status_idx" ON "TableSession"("tableId", "status");

-- CreateIndex
CREATE INDEX "TableSession_businessId_status_idx" ON "TableSession"("businessId", "status");

-- CreateIndex
CREATE INDEX "TableSession_createdAt_idx" ON "TableSession"("createdAt");

-- CreateIndex
CREATE INDEX "SessionParticipant_sessionId_idx" ON "SessionParticipant"("sessionId");

-- CreateIndex
CREATE INDEX "SessionParticipant_tempId_idx" ON "SessionParticipant"("tempId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionParticipant_sessionId_tempId_key" ON "SessionParticipant"("sessionId", "tempId");

-- CreateIndex
CREATE INDEX "Sale_tableSessionId_idx" ON "Sale"("tableSessionId");

-- CreateIndex
CREATE INDEX "Sale_participantId_idx" ON "Sale"("participantId");

-- CreateIndex
CREATE INDEX "Sale_kitchenStatus_idx" ON "Sale"("kitchenStatus");

-- CreateIndex
CREATE INDEX "Sale_businessId_kitchenStatus_idx" ON "Sale"("businessId", "kitchenStatus");

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_tableSessionId_fkey" FOREIGN KEY ("tableSessionId") REFERENCES "TableSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "SessionParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableSession" ADD CONSTRAINT "TableSession_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableSession" ADD CONSTRAINT "TableSession_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionParticipant" ADD CONSTRAINT "SessionParticipant_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TableSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
