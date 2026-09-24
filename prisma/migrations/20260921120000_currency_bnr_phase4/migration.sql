-- Phase 4: Currency / BNR finalization
-- Adds revision tracking to CurrencyExchangeRate so corrected BNR records
-- are stored as new versions (supersession) instead of overwriting history.

-- ============================================================================
-- CurrencyExchangeRate: revision column + supersession-aware uniqueness
-- ============================================================================
ALTER TABLE "CurrencyExchangeRate"
  ADD COLUMN IF NOT EXISTS "revision" INTEGER NOT NULL DEFAULT 0;

-- Replace the Phase 3 uniqueness (which prevented storing a corrected
-- version of the same BNR record) with a revision-aware key.
DROP INDEX IF EXISTS "CurrencyExchangeRate_source_sourceRecordId_from_to_effectiveDate_key";

CREATE UNIQUE INDEX IF NOT EXISTS "CurrencyExchangeRate_source_sourceRecordId_from_to_effectiveDate_revision_key"
  ON "CurrencyExchangeRate"("source", "sourceRecordId", "fromCurrency", "toCurrency", "effectiveDate", "revision");
