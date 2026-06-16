-- Block 4E: Add confidence field to AnomalyAlert

ALTER TABLE "AnomalyAlert"
  ADD COLUMN IF NOT EXISTS "confidence" DOUBLE PRECISION;

-- Add index for confidence-based queries
CREATE INDEX IF NOT EXISTS "AnomalyAlert_confidence_idx"
  ON "AnomalyAlert"("confidence");

-- Add composite index for type + status queries (common in dashboards)
CREATE INDEX IF NOT EXISTS "AnomalyAlert_type_status_idx"
  ON "AnomalyAlert"("type", "status");
