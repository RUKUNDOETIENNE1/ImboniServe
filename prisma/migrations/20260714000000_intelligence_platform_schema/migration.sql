-- Intelligence Platform Schema Migration
-- Creates tables for Hospitality Intelligence Platform data persistence

-- IntelligenceReport: Stores generated intelligence reports from all consumers
CREATE TABLE "IntelligenceReport" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "reportingPeriod" JSONB NOT NULL,
    "data" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "evidenceCount" INTEGER NOT NULL DEFAULT 0,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntelligenceReport_pkey" PRIMARY KEY ("id")
);

-- KnowledgeEntry: Stores historical knowledge in Intelligence Knowledge Base (IKB)
CREATE TABLE "KnowledgeEntry" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "sources" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeEntry_pkey" PRIMARY KEY ("id")
);

-- ReplayEvent: Stores events for Service Replay™
CREATE TABLE "ReplayEvent" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventData" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "replayable" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReplayEvent_pkey" PRIMARY KEY ("id")
);

-- ConversationHistory: Stores AI Copilot™ conversations
CREATE TABLE "ConversationHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "messages" JSONB NOT NULL,
    "context" JSONB NOT NULL,
    "metadata" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessageAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversationHistory_pkey" PRIMARY KEY ("id")
);

-- Indexes for IntelligenceReport
CREATE INDEX "IntelligenceReport_businessId_type_generatedAt_idx" ON "IntelligenceReport"("businessId", "type", "generatedAt" DESC);
CREATE INDEX "IntelligenceReport_type_generatedAt_idx" ON "IntelligenceReport"("type", "generatedAt" DESC);
CREATE INDEX "IntelligenceReport_businessId_generatedAt_idx" ON "IntelligenceReport"("businessId", "generatedAt" DESC);

-- Indexes for KnowledgeEntry
CREATE INDEX "KnowledgeEntry_businessId_category_createdAt_idx" ON "KnowledgeEntry"("businessId", "category", "createdAt" DESC);
CREATE INDEX "KnowledgeEntry_category_createdAt_idx" ON "KnowledgeEntry"("category", "createdAt" DESC);
CREATE INDEX "KnowledgeEntry_businessId_createdAt_idx" ON "KnowledgeEntry"("businessId", "createdAt" DESC);

-- Indexes for ReplayEvent
CREATE INDEX "ReplayEvent_businessId_timestamp_idx" ON "ReplayEvent"("businessId", "timestamp" DESC);
CREATE INDEX "ReplayEvent_eventType_timestamp_idx" ON "ReplayEvent"("eventType", "timestamp" DESC);
CREATE INDEX "ReplayEvent_businessId_eventType_timestamp_idx" ON "ReplayEvent"("businessId", "eventType", "timestamp" DESC);
CREATE INDEX "ReplayEvent_replayable_timestamp_idx" ON "ReplayEvent"("replayable", "timestamp" DESC);

-- Indexes for ConversationHistory
CREATE INDEX "ConversationHistory_userId_lastMessageAt_idx" ON "ConversationHistory"("userId", "lastMessageAt" DESC);
CREATE INDEX "ConversationHistory_businessId_lastMessageAt_idx" ON "ConversationHistory"("businessId", "lastMessageAt" DESC);
CREATE INDEX "ConversationHistory_userId_businessId_idx" ON "ConversationHistory"("userId", "businessId");
