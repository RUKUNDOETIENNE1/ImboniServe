-- Block 4G: System Consolidation Layer
-- Canonical lifecycle + observability timeline

CREATE TYPE "DocumentLifecycleState" AS ENUM (
  'UPLOADED',
  'EXTRACTED',
  'INTELLIGENCE_DONE',
  'MATCHED',
  'RECONCILED',
  'ANALYZED',
  'REVIEW_REQUIRED',
  'APPROVED',
  'APPLIED',
  'FAILED'
);

ALTER TABLE "ScannedDocument"
ADD COLUMN "lifecycleState" "DocumentLifecycleState" NOT NULL DEFAULT 'UPLOADED';

UPDATE "ScannedDocument"
SET "lifecycleState" = CASE "status"
  WHEN 'UPLOADED' THEN 'UPLOADED'::"DocumentLifecycleState"
  WHEN 'OCR_PROCESSING' THEN 'UPLOADED'::"DocumentLifecycleState"
  WHEN 'EXTRACTED' THEN 'EXTRACTED'::"DocumentLifecycleState"
  WHEN 'INTELLIGENCE_DONE' THEN 'INTELLIGENCE_DONE'::"DocumentLifecycleState"
  WHEN 'REVIEW' THEN 'REVIEW_REQUIRED'::"DocumentLifecycleState"
  WHEN 'APPROVED' THEN 'APPROVED'::"DocumentLifecycleState"
  WHEN 'APPLIED' THEN 'APPLIED'::"DocumentLifecycleState"
  WHEN 'FAILED' THEN 'FAILED'::"DocumentLifecycleState"
  ELSE 'UPLOADED'::"DocumentLifecycleState"
END;

CREATE TABLE "DocumentEventTimeline" (
  "id" TEXT NOT NULL,
  "scannedDocumentId" TEXT NOT NULL,
  "stage" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DocumentEventTimeline_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "DocumentEventTimeline"
ADD CONSTRAINT "DocumentEventTimeline_scannedDocumentId_fkey"
FOREIGN KEY ("scannedDocumentId") REFERENCES "ScannedDocument"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "DocumentEventTimeline_scannedDocumentId_idx" ON "DocumentEventTimeline"("scannedDocumentId");
CREATE INDEX "DocumentEventTimeline_stage_idx" ON "DocumentEventTimeline"("stage");
CREATE INDEX "DocumentEventTimeline_scannedDocumentId_createdAt_idx" ON "DocumentEventTimeline"("scannedDocumentId", "createdAt");
