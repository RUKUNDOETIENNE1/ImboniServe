-- Service Intelligence™ Schema
-- Tables for storing replay events and intelligence reports

-- Replay Events Table
CREATE TABLE IF NOT EXISTS "ReplayEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "eventType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "orderId" TEXT,
    "orderNumber" TEXT,
    "waiterId" TEXT,
    "waiterName" TEXT,
    "stationId" TEXT,
    "stationName" TEXT,
    "tableId" TEXT,
    "duration" INTEGER,
    "metadata" JSONB,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "ReplayEvent_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE
);

CREATE INDEX "ReplayEvent_businessId_timestamp_idx" ON "ReplayEvent"("businessId", "timestamp");
CREATE INDEX "ReplayEvent_orderId_idx" ON "ReplayEvent"("orderId");
CREATE INDEX "ReplayEvent_eventType_idx" ON "ReplayEvent"("eventType");

-- Service Intelligence Reports Table (Cache)
CREATE TABLE IF NOT EXISTS "ServiceIntelligenceReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL,
    "timeRangeStart" TIMESTAMP(3) NOT NULL,
    "timeRangeEnd" TIMESTAMP(3) NOT NULL,
    "reportData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "ServiceIntelligenceReport_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE
);

CREATE INDEX "ServiceIntelligenceReport_businessId_generatedAt_idx" ON "ServiceIntelligenceReport"("businessId", "generatedAt");
CREATE INDEX "ServiceIntelligenceReport_timeRange_idx" ON "ServiceIntelligenceReport"("timeRangeStart", "timeRangeEnd");
