-- Add Block 4D procurement reconciliation support

ALTER TABLE "ScannedDocument"
  ADD COLUMN IF NOT EXISTS "reconciliationStatus" TEXT,
  ADD COLUMN IF NOT EXISTS "confidenceScore" DOUBLE PRECISION;

ALTER TABLE "ProcurementReconciliation"
  ADD COLUMN IF NOT EXISTS "businessId" TEXT,
  ADD COLUMN IF NOT EXISTS "matchType" TEXT NOT NULL DEFAULT 'NO_MATCH';

UPDATE "ProcurementReconciliation" pr
SET
  "businessId" = sd."businessId",
  "matchType" = CASE
    WHEN pr."state" = 'MATCHED_GRN' THEN 'GRN_MATCH'
    WHEN pr."state" = 'MATCHED_PO' THEN 'FUZZY_PO'
    WHEN pr."state" = 'CONFLICT' THEN 'CONFLICT'
    ELSE 'NO_MATCH'
  END
FROM "ScannedDocument" sd
WHERE pr."scannedDocumentId" = sd."id"
  AND pr."businessId" IS NULL;

ALTER TABLE "ProcurementReconciliation"
  ALTER COLUMN "businessId" SET NOT NULL;

DO $$
BEGIN
  ALTER TABLE "ProcurementReconciliation"
    ADD CONSTRAINT "ProcurementReconciliation_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "ProcurementReconciliation_businessId_idx"
  ON "ProcurementReconciliation"("businessId");

CREATE INDEX IF NOT EXISTS "ProcurementReconciliation_businessId_matchType_idx"
  ON "ProcurementReconciliation"("businessId", "matchType");

CREATE INDEX IF NOT EXISTS "ProcurementReconciliation_purchaseOrderId_idx"
  ON "ProcurementReconciliation"("matchedPurchaseOrderId");

CREATE INDEX IF NOT EXISTS "ProcurementReconciliation_goodsReceivedNoteId_idx"
  ON "ProcurementReconciliation"("matchedGoodsReceivedNoteId");

CREATE UNIQUE INDEX IF NOT EXISTS "DocumentEntityLink_scannedDocumentId_entityType_entityId_key"
  ON "DocumentEntityLink"("scannedDocumentId", "entityType", "entityId");
