-- Phase 3: Currency / BNR canonical architecture
-- Adds structured FX metadata for transactions and BNR-compatible rate history fields.

-- ============================================================================
-- Enums
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE "ExchangeRateType" AS ENUM ('AVERAGE', 'BUYING', 'SELLING');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ExchangeRateStatus" AS ENUM ('ACTIVE', 'SUPERSEDED', 'INVALID');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- PaymentTransaction: structured historical FX snapshot fields
-- ============================================================================
ALTER TABLE "PaymentTransaction"
  ADD COLUMN IF NOT EXISTS "orderAmountCents" INTEGER,
  ADD COLUMN IF NOT EXISTS "orderCurrency" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentAmountCents" INTEGER,
  ADD COLUMN IF NOT EXISTS "paymentCurrency" TEXT,
  ADD COLUMN IF NOT EXISTS "settlementAmountCents" INTEGER,
  ADD COLUMN IF NOT EXISTS "settlementCurrency" TEXT,
  ADD COLUMN IF NOT EXISTS "exchangeRateValue" DECIMAL(20,10),
  ADD COLUMN IF NOT EXISTS "exchangeRateType" "ExchangeRateType",
  ADD COLUMN IF NOT EXISTS "exchangeRateSource" TEXT,
  ADD COLUMN IF NOT EXISTS "exchangeRateBaseCurrency" TEXT,
  ADD COLUMN IF NOT EXISTS "exchangeRateQuoteCurrency" TEXT,
  ADD COLUMN IF NOT EXISTS "exchangeRateEffectiveDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "exchangeRateRecordId" TEXT,
  ADD COLUMN IF NOT EXISTS "exchangeRateSnapshotId" TEXT;

CREATE INDEX IF NOT EXISTS "PaymentTransaction_orderCurrency_idx"
  ON "PaymentTransaction"("orderCurrency");

CREATE INDEX IF NOT EXISTS "PaymentTransaction_paymentCurrency_idx"
  ON "PaymentTransaction"("paymentCurrency");

CREATE INDEX IF NOT EXISTS "PaymentTransaction_exchangeRateSnapshotId_idx"
  ON "PaymentTransaction"("exchangeRateSnapshotId");

-- ============================================================================
-- CurrencyExchangeRate: BNR-compatible persisted history fields
-- ============================================================================
ALTER TABLE "CurrencyExchangeRate"
  ALTER COLUMN "rate" TYPE DECIMAL(20,10);

ALTER TABLE "CurrencyExchangeRate"
  ADD COLUMN IF NOT EXISTS "averageRate" DECIMAL(20,10),
  ADD COLUMN IF NOT EXISTS "buyingRate" DECIMAL(20,10),
  ADD COLUMN IF NOT EXISTS "sellingRate" DECIMAL(20,10),
  ADD COLUMN IF NOT EXISTS "sourceRecordId" TEXT,
  ADD COLUMN IF NOT EXISTS "sourceCurrencyName" TEXT,
  ADD COLUMN IF NOT EXISTS "sourceRecordCreatedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "status" "ExchangeRateStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS "metadata" JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS "CurrencyExchangeRate_source_sourceRecordId_from_to_effectiveDate_key"
  ON "CurrencyExchangeRate"("source", "sourceRecordId", "fromCurrency", "toCurrency", "effectiveDate");

CREATE INDEX IF NOT EXISTS "CurrencyExchangeRate_from_to_effectiveDate_idx"
  ON "CurrencyExchangeRate"("fromCurrency", "toCurrency", "effectiveDate");

CREATE INDEX IF NOT EXISTS "CurrencyExchangeRate_from_to_status_effectiveDate_idx"
  ON "CurrencyExchangeRate"("fromCurrency", "toCurrency", "status", "effectiveDate");

-- ============================================================================
-- SupportedCurrency: explicit capability flags
-- ============================================================================
ALTER TABLE "SupportedCurrency"
  ADD COLUMN IF NOT EXISTS "displayEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "transactionEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "paymentEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "settlementEnabled" BOOLEAN NOT NULL DEFAULT false;

-- ============================================================================
-- Foreign key
-- ============================================================================
DO $$ BEGIN
  ALTER TABLE "PaymentTransaction"
    ADD CONSTRAINT "PaymentTransaction_exchangeRateSnapshotId_fkey"
    FOREIGN KEY ("exchangeRateSnapshotId")
    REFERENCES "CurrencyExchangeRate"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
