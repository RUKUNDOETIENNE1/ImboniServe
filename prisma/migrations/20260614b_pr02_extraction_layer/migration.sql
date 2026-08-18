-- PR02 — Extraction Result Layer (Schema-Only)
-- Adds provider-agnostic extraction tables for headers, line fields, and raw payloads

BEGIN;

-- 1) ExtractedDocumentHeaderField
CREATE TABLE "ExtractedDocumentHeaderField" (
  "id" TEXT NOT NULL,
  "scannedDocumentId" TEXT NOT NULL,
  "fieldName" TEXT NOT NULL,
  "fieldValue" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION,
  "source" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExtractedDocumentHeaderField_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ExtractedDocumentHeaderField_scannedDocumentId_idx" ON "ExtractedDocumentHeaderField" ("scannedDocumentId");
CREATE INDEX "ExtractedDocumentHeaderField_fieldName_idx" ON "ExtractedDocumentHeaderField" ("fieldName");

ALTER TABLE "ExtractedDocumentHeaderField"
  ADD CONSTRAINT "ExtractedDocumentHeaderField_scannedDocumentId_fkey"
  FOREIGN KEY ("scannedDocumentId") REFERENCES "ScannedDocument" ("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 2) ExtractedDocumentLineField
CREATE TABLE "ExtractedDocumentLineField" (
  "id" TEXT NOT NULL,
  "scannedDocumentItemId" TEXT NOT NULL,
  "fieldName" TEXT NOT NULL,
  "fieldValue" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExtractedDocumentLineField_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ExtractedDocumentLineField_scannedDocumentItemId_idx" ON "ExtractedDocumentLineField" ("scannedDocumentItemId");

ALTER TABLE "ExtractedDocumentLineField"
  ADD CONSTRAINT "ExtractedDocumentLineField_scannedDocumentItemId_fkey"
  FOREIGN KEY ("scannedDocumentItemId") REFERENCES "ScannedDocumentItem" ("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 3) ExtractionPayload (immutable raw layer)
CREATE TABLE "ExtractionPayload" (
  "id" TEXT NOT NULL,
  "scanJobId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "rawPayload" JSONB NOT NULL,
  "pageStructure" JSONB,
  "extractedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExtractionPayload_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ExtractionPayload_scanJobId_key" UNIQUE ("scanJobId")
);

ALTER TABLE "ExtractionPayload"
  ADD CONSTRAINT "ExtractionPayload_scanJobId_fkey"
  FOREIGN KEY ("scanJobId") REFERENCES "ScanJob" ("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
