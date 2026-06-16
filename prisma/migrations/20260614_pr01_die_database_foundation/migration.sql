-- PR01 — Document Intelligence Engine (DIE) Database Foundation
-- Schema-only migration: enums, tables, relations, indexes, constraints

BEGIN;

-- ====================================================
-- Enums
-- ====================================================
CREATE TYPE "DocumentType" AS ENUM ('SUPPLIER_INVOICE', 'DELIVERY_NOTE', 'GENERIC');
CREATE TYPE "DocumentStatus" AS ENUM ('UPLOADED', 'OCR_PROCESSING', 'EXTRACTED', 'INTELLIGENCE_DONE', 'REVIEW', 'APPROVED', 'APPLIED', 'FAILED');
CREATE TYPE "ReconciliationState" AS ENUM ('UNMATCHED', 'MATCHED_PO', 'MATCHED_GRN', 'CONFLICT');
CREATE TYPE "EntityLinkType" AS ENUM ('SUPPLIER', 'PO', 'GRN', 'INVENTORY_ITEM');
CREATE TYPE "LinkType" AS ENUM ('AUTO_MATCH', 'USER_CONFIRMED', 'REVIEW_SUGGESTION');
CREATE TYPE "AnomalyStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'DISMISSED', 'RESOLVED');
CREATE TYPE "AnomalySeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- ====================================================
-- Tables
-- ====================================================
-- A. ScanJob (core ingestion tracker)
CREATE TABLE "ScanJob" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "documentType" "DocumentType" NOT NULL,
  "sourceFileKey" TEXT NOT NULL,
  "sourceMime" TEXT NOT NULL,
  "sourceHash" TEXT NOT NULL,
  "pageCount" INTEGER,
  "provider" TEXT,
  "status" "DocumentStatus" NOT NULL DEFAULT 'UPLOADED',
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScanJob_pkey" PRIMARY KEY ("id")
);

-- Indexes & constraints for ScanJob
CREATE UNIQUE INDEX "ScanJob_sourceHash_businessId_key" ON "ScanJob"("sourceHash", "businessId");
CREATE INDEX "ScanJob_businessId_createdAt_idx" ON "ScanJob"("businessId", "createdAt");
CREATE INDEX "ScanJob_status_idx" ON "ScanJob"("status");
CREATE INDEX "ScanJob_documentType_idx" ON "ScanJob"("documentType");

-- B. ScannedDocument (normalized document container)
CREATE TABLE "ScannedDocument" (
  "id" TEXT NOT NULL,
  "scanJobId" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "documentType" "DocumentType" NOT NULL,
  "supplierId" TEXT,
  "matchedPurchaseOrderId" TEXT,
  "matchedGoodsReceivedNoteId" TEXT,
  "invoiceNumber" TEXT,
  "purchaseOrderNumber" TEXT,
  "deliveryReference" TEXT,
  "documentDate" TIMESTAMP(3),
  "currency" TEXT DEFAULT 'RWF',
  "subtotalCents" INTEGER,
  "taxCents" INTEGER,
  "totalCents" INTEGER,
  "providerPayload" JSONB,
  "normalizedVersion" TEXT NOT NULL DEFAULT '1.0',
  "confidenceOverall" DOUBLE PRECISION,
  "validationScore" DOUBLE PRECISION,
  "status" "DocumentStatus" NOT NULL DEFAULT 'UPLOADED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScannedDocument_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ScannedDocument_scanJobId_key" UNIQUE ("scanJobId")
);

-- Indexes for ScannedDocument
CREATE INDEX "ScannedDocument_invoiceNumber_idx" ON "ScannedDocument"("invoiceNumber");
CREATE INDEX "ScannedDocument_documentType_idx" ON "ScannedDocument"("documentType");
CREATE INDEX "ScannedDocument_matchedPurchaseOrderId_idx" ON "ScannedDocument"("matchedPurchaseOrderId");
CREATE INDEX "ScannedDocument_matchedGoodsReceivedNoteId_idx" ON "ScannedDocument"("matchedGoodsReceivedNoteId");
CREATE INDEX "ScannedDocument_businessId_status_idx" ON "ScannedDocument"("businessId", "status");
CREATE INDEX "ScannedDocument_supplierId_idx" ON "ScannedDocument"("supplierId");

-- C. ScannedDocumentItem (line items)
CREATE TABLE "ScannedDocumentItem" (
  "id" TEXT NOT NULL,
  "scannedDocumentId" TEXT NOT NULL,
  "lineNo" INTEGER NOT NULL,
  "productName" TEXT NOT NULL,
  "productId" TEXT,
  "supplierProductId" TEXT,
  "quantity" DOUBLE PRECISION NOT NULL,
  "unit" TEXT NOT NULL,
  "unitPriceCents" INTEGER,
  "totalPriceCents" INTEGER,
  "confidences" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScannedDocumentItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ScannedDocumentItem_scannedDocumentId_lineNo_key" UNIQUE ("scannedDocumentId", "lineNo")
);

-- Indexes for ScannedDocumentItem
CREATE INDEX "ScannedDocumentItem_scannedDocumentId_idx" ON "ScannedDocumentItem"("scannedDocumentId");
CREATE INDEX "ScannedDocumentItem_productId_idx" ON "ScannedDocumentItem"("productId");
CREATE INDEX "ScannedDocumentItem_supplierProductId_idx" ON "ScannedDocumentItem"("supplierProductId");

-- D. DocumentProcessingLog (debug + observability foundation)
CREATE TABLE "DocumentProcessingLog" (
  "id" TEXT NOT NULL,
  "scanJobId" TEXT NOT NULL,
  "stage" TEXT NOT NULL,
  "level" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DocumentProcessingLog_pkey" PRIMARY KEY ("id")
);

-- Indexes for DocumentProcessingLog
CREATE INDEX "DocumentProcessingLog_scanJobId_createdAt_idx" ON "DocumentProcessingLog"("scanJobId", "createdAt");
CREATE INDEX "DocumentProcessingLog_level_idx" ON "DocumentProcessingLog"("level");

-- E. ProcurementReconciliation (structure only)
CREATE TABLE "ProcurementReconciliation" (
  "id" TEXT NOT NULL,
  "scannedDocumentId" TEXT NOT NULL,
  "matchedPurchaseOrderId" TEXT,
  "matchedGoodsReceivedNoteId" TEXT,
  "fingerprint" TEXT NOT NULL,
  "state" "ReconciliationState" NOT NULL DEFAULT 'UNMATCHED',
  "confidence" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProcurementReconciliation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProcurementReconciliation_scannedDocumentId_key" UNIQUE ("scannedDocumentId"),
  CONSTRAINT "ProcurementReconciliation_fingerprint_key" UNIQUE ("fingerprint")
);

-- Indexes for ProcurementReconciliation
CREATE INDEX "ProcurementReconciliation_state_idx" ON "ProcurementReconciliation"("state");
CREATE INDEX "ProcurementReconciliation_matchedPurchaseOrderId_idx" ON "ProcurementReconciliation"("matchedPurchaseOrderId");
CREATE INDEX "ProcurementReconciliation_matchedGoodsReceivedNoteId_idx" ON "ProcurementReconciliation"("matchedGoodsReceivedNoteId");

-- F. DocumentEntityLink (future intelligence support)
CREATE TABLE "DocumentEntityLink" (
  "id" TEXT NOT NULL,
  "scannedDocumentId" TEXT NOT NULL,
  "entityType" "EntityLinkType" NOT NULL,
  "entityId" TEXT NOT NULL,
  "linkType" "LinkType" NOT NULL,
  "confidence" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DocumentEntityLink_pkey" PRIMARY KEY ("id")
);

-- Indexes for DocumentEntityLink
CREATE INDEX "DocumentEntityLink_scannedDocumentId_entityType_idx" ON "DocumentEntityLink"("scannedDocumentId", "entityType");
CREATE INDEX "DocumentEntityLink_entityType_entityId_idx" ON "DocumentEntityLink"("entityType", "entityId");

-- G. SupplierAlias
CREATE TABLE "SupplierAlias" (
  "id" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "alias" TEXT NOT NULL,
  "normalized" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupplierAlias_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SupplierAlias_supplierId_normalized_key" ON "SupplierAlias"("supplierId", "normalized");
CREATE INDEX "SupplierAlias_normalized_idx" ON "SupplierAlias"("normalized");

-- H. ProductAlias
CREATE TABLE "ProductAlias" (
  "id" TEXT NOT NULL,
  "inventoryItemId" TEXT,
  "supplierProductId" TEXT,
  "alias" TEXT NOT NULL,
  "normalized" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductAlias_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductAlias_inventoryItemId_normalized_key" ON "ProductAlias"("inventoryItemId", "normalized");
CREATE UNIQUE INDEX "ProductAlias_supplierProductId_normalized_key" ON "ProductAlias"("supplierProductId", "normalized");
CREATE INDEX "ProductAlias_normalized_idx" ON "ProductAlias"("normalized");

-- I. AnomalyAlert (placeholder only)
CREATE TABLE "AnomalyAlert" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "supplierId" TEXT,
  "scannedDocumentId" TEXT,
  "scannedDocumentItemId" TEXT,
  "type" TEXT NOT NULL,
  "severity" "AnomalySeverity" NOT NULL,
  "title" TEXT NOT NULL,
  "details" JSONB,
  "status" "AnomalyStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "AnomalyAlert_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AnomalyAlert_businessId_type_idx" ON "AnomalyAlert"("businessId", "type");
CREATE INDEX "AnomalyAlert_status_idx" ON "AnomalyAlert"("status");
CREATE INDEX "AnomalyAlert_severity_idx" ON "AnomalyAlert"("severity");
CREATE INDEX "AnomalyAlert_scannedDocumentId_idx" ON "AnomalyAlert"("scannedDocumentId");

-- ====================================================
-- Foreign Keys
-- ====================================================
-- ScanJob
ALTER TABLE "ScanJob" ADD CONSTRAINT "ScanJob_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScanJob" ADD CONSTRAINT "ScanJob_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ScannedDocument
ALTER TABLE "ScannedDocument" ADD CONSTRAINT "ScannedDocument_scanJobId_fkey" FOREIGN KEY ("scanJobId") REFERENCES "ScanJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScannedDocument" ADD CONSTRAINT "ScannedDocument_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScannedDocument" ADD CONSTRAINT "ScannedDocument_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ScannedDocument" ADD CONSTRAINT "ScannedDocument_matchedPurchaseOrderId_fkey" FOREIGN KEY ("matchedPurchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ScannedDocument" ADD CONSTRAINT "ScannedDocument_matchedGoodsReceivedNoteId_fkey" FOREIGN KEY ("matchedGoodsReceivedNoteId") REFERENCES "GoodsReceivedNote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ScannedDocumentItem
ALTER TABLE "ScannedDocumentItem" ADD CONSTRAINT "ScannedDocumentItem_scannedDocumentId_fkey" FOREIGN KEY ("scannedDocumentId") REFERENCES "ScannedDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScannedDocumentItem" ADD CONSTRAINT "ScannedDocumentItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ScannedDocumentItem" ADD CONSTRAINT "ScannedDocumentItem_supplierProductId_fkey" FOREIGN KEY ("supplierProductId") REFERENCES "SupplierProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DocumentProcessingLog
ALTER TABLE "DocumentProcessingLog" ADD CONSTRAINT "DocumentProcessingLog_scanJobId_fkey" FOREIGN KEY ("scanJobId") REFERENCES "ScanJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ProcurementReconciliation
ALTER TABLE "ProcurementReconciliation" ADD CONSTRAINT "ProcurementReconciliation_scannedDocumentId_fkey" FOREIGN KEY ("scannedDocumentId") REFERENCES "ScannedDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProcurementReconciliation" ADD CONSTRAINT "ProcurementReconciliation_matchedPurchaseOrderId_fkey" FOREIGN KEY ("matchedPurchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProcurementReconciliation" ADD CONSTRAINT "ProcurementReconciliation_matchedGoodsReceivedNoteId_fkey" FOREIGN KEY ("matchedGoodsReceivedNoteId") REFERENCES "GoodsReceivedNote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DocumentEntityLink
ALTER TABLE "DocumentEntityLink" ADD CONSTRAINT "DocumentEntityLink_scannedDocumentId_fkey" FOREIGN KEY ("scannedDocumentId") REFERENCES "ScannedDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SupplierAlias
ALTER TABLE "SupplierAlias" ADD CONSTRAINT "SupplierAlias_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ProductAlias
ALTER TABLE "ProductAlias" ADD CONSTRAINT "ProductAlias_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductAlias" ADD CONSTRAINT "ProductAlias_supplierProductId_fkey" FOREIGN KEY ("supplierProductId") REFERENCES "SupplierProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AnomalyAlert
ALTER TABLE "AnomalyAlert" ADD CONSTRAINT "AnomalyAlert_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnomalyAlert" ADD CONSTRAINT "AnomalyAlert_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AnomalyAlert" ADD CONSTRAINT "AnomalyAlert_scannedDocumentId_fkey" FOREIGN KEY ("scannedDocumentId") REFERENCES "ScannedDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AnomalyAlert" ADD CONSTRAINT "AnomalyAlert_scannedDocumentItemId_fkey" FOREIGN KEY ("scannedDocumentItemId") REFERENCES "ScannedDocumentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
