-- Apply CostAnomalyAlert using correct live table name "Restaurant" (not "Business")
-- All clauses use IF NOT EXISTS - fully idempotent

CREATE TABLE IF NOT EXISTS "CostAnomalyAlert" (
  "id"                        TEXT      PRIMARY KEY NOT NULL DEFAULT gen_random_uuid()::text,
  "businessId"                TEXT      NOT NULL,
  "supplierId"                TEXT      NOT NULL,
  "grnItemId"                 TEXT,
  "productName"               TEXT      NOT NULL,
  "unit"                      TEXT      NOT NULL,
  "observedUnitPriceCents"    INTEGER   NOT NULL,
  "trailingAvgUnitPriceCents" INTEGER   NOT NULL,
  "trailingStdDevCents"       REAL,
  "deltaPercent"              REAL      NOT NULL,
  "zScore"                    REAL,
  "thresholdPercent"          REAL      NOT NULL DEFAULT 10,
  "severity"                  TEXT      NOT NULL DEFAULT 'MEDIUM',
  "status"                    TEXT      NOT NULL DEFAULT 'OPEN',
  "notes"                     TEXT,
  "createdAt"                 TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt"                TIMESTAMP(3),
  CONSTRAINT "CostAnomalyAlert_businessId_fkey"  FOREIGN KEY ("businessId")  REFERENCES "Restaurant"("id")             ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT "CostAnomalyAlert_supplierId_fkey"  FOREIGN KEY ("supplierId")  REFERENCES "Supplier"("id")               ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CostAnomalyAlert_grnItemId_fkey"   FOREIGN KEY ("grnItemId")   REFERENCES "GoodsReceivedNoteItem"("id")  ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "CostAnomalyAlert_business_status_idx"  ON "CostAnomalyAlert"("businessId", "status");
CREATE INDEX IF NOT EXISTS "CostAnomalyAlert_supplier_status_idx"  ON "CostAnomalyAlert"("supplierId", "status");
CREATE INDEX IF NOT EXISTS "CostAnomalyAlert_business_created_idx" ON "CostAnomalyAlert"("businessId", "createdAt" DESC);
