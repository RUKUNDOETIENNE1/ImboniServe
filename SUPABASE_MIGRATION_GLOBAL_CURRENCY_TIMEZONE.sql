-- ============================================================
-- GLOBAL CURRENCY AND TIMEZONE SYSTEM MIGRATION
-- ============================================================
-- This migration adds currency and timezone support for international expansion
-- All existing data defaults to Rwanda (RWF, Africa/Kigali)
-- ============================================================

-- Step 1: Add currency and timezone fields to User table
ALTER TABLE "User" 
  ADD COLUMN IF NOT EXISTS "timezone" TEXT DEFAULT 'Africa/Kigali',
  ADD COLUMN IF NOT EXISTS "locale" TEXT DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS "preferredCurrency" TEXT DEFAULT 'RWF';

-- Step 2: Add business-level currency and timezone settings to Restaurant table
ALTER TABLE "Restaurant"
  ADD COLUMN IF NOT EXISTS "currencyCode" TEXT DEFAULT 'RWF',
  ADD COLUMN IF NOT EXISTS "currencySymbol" TEXT DEFAULT 'FRw',
  ADD COLUMN IF NOT EXISTS "countryCode" TEXT DEFAULT 'RW',
  ADD COLUMN IF NOT EXISTS "timezone" TEXT DEFAULT 'Africa/Kigali',
  ADD COLUMN IF NOT EXISTS "locale" TEXT DEFAULT 'en';

-- Step 3: Create currency exchange rates table (for future use)
CREATE TABLE IF NOT EXISTS "CurrencyExchangeRate" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "fromCurrency" TEXT NOT NULL,
  "toCurrency" TEXT NOT NULL,
  "rate" DECIMAL(12, 6) NOT NULL,
  "source" TEXT DEFAULT 'manual',
  "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "validUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CurrencyExchangeRate_currency_pair_unique" UNIQUE ("fromCurrency", "toCurrency", "validFrom")
);

-- Step 4: Create index for efficient rate lookups
CREATE INDEX IF NOT EXISTS "CurrencyExchangeRate_lookup_idx" 
  ON "CurrencyExchangeRate"("fromCurrency", "toCurrency", "validFrom" DESC);

-- Step 5: Insert default exchange rates (RWF as base currency)
-- These are approximate rates and should be updated regularly
INSERT INTO "CurrencyExchangeRate" ("fromCurrency", "toCurrency", "rate", "source", "validFrom")
VALUES 
  ('RWF', 'RWF', 1.000000, 'fixed', CURRENT_TIMESTAMP),
  ('RWF', 'USD', 0.000769, 'manual', CURRENT_TIMESTAMP), -- 1 USD ≈ 1,300 RWF
  ('RWF', 'EUR', 0.000714, 'manual', CURRENT_TIMESTAMP), -- 1 EUR ≈ 1,400 RWF
  ('RWF', 'GBP', 0.000625, 'manual', CURRENT_TIMESTAMP), -- 1 GBP ≈ 1,600 RWF
  ('RWF', 'KES', 0.100000, 'manual', CURRENT_TIMESTAMP), -- 1 KES ≈ 10 RWF
  ('RWF', 'TZS', 2.000000, 'manual', CURRENT_TIMESTAMP), -- 1 TZS ≈ 0.5 RWF
  ('RWF', 'UGX', 3.000000, 'manual', CURRENT_TIMESTAMP)  -- 1 UGX ≈ 0.33 RWF
ON CONFLICT ("fromCurrency", "toCurrency", "validFrom") DO NOTHING;

-- Step 6: Add reverse rates for common conversions
INSERT INTO "CurrencyExchangeRate" ("fromCurrency", "toCurrency", "rate", "source", "validFrom")
VALUES 
  ('USD', 'RWF', 1300.000000, 'manual', CURRENT_TIMESTAMP),
  ('EUR', 'RWF', 1400.000000, 'manual', CURRENT_TIMESTAMP),
  ('GBP', 'RWF', 1600.000000, 'manual', CURRENT_TIMESTAMP),
  ('KES', 'RWF', 10.000000, 'manual', CURRENT_TIMESTAMP),
  ('TZS', 'RWF', 0.500000, 'manual', CURRENT_TIMESTAMP),
  ('UGX', 'RWF', 0.333333, 'manual', CURRENT_TIMESTAMP)
ON CONFLICT ("fromCurrency", "toCurrency", "validFrom") DO NOTHING;

-- Step 7: Create supported currencies table
CREATE TABLE IF NOT EXISTS "SupportedCurrency" (
  "code" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "symbol" TEXT NOT NULL,
  "decimalDigits" INTEGER NOT NULL DEFAULT 2,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "countries" TEXT[], -- Countries where this currency is commonly used
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Step 8: Insert supported currencies
INSERT INTO "SupportedCurrency" ("code", "name", "symbol", "decimalDigits", "countries")
VALUES 
  ('RWF', 'Rwandan Franc', 'FRw', 0, ARRAY['RW']),
  ('USD', 'US Dollar', '$', 2, ARRAY['US', 'GLOBAL']),
  ('EUR', 'Euro', '€', 2, ARRAY['EU', 'FR', 'DE', 'IT', 'ES']),
  ('GBP', 'British Pound', '£', 2, ARRAY['GB']),
  ('KES', 'Kenyan Shilling', 'KSh', 2, ARRAY['KE']),
  ('TZS', 'Tanzanian Shilling', 'TSh', 0, ARRAY['TZ']),
  ('UGX', 'Ugandan Shilling', 'USh', 0, ARRAY['UG'])
ON CONFLICT ("code") DO NOTHING;

-- Step 9: Create supported timezones table
CREATE TABLE IF NOT EXISTS "SupportedTimezone" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "utcOffset" TEXT NOT NULL,
  "countryCode" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Step 10: Insert common timezones
INSERT INTO "SupportedTimezone" ("id", "name", "utcOffset", "countryCode")
VALUES 
  ('Africa/Kigali', 'Central Africa Time', '+02:00', 'RW'),
  ('Africa/Nairobi', 'East Africa Time', '+03:00', 'KE'),
  ('Africa/Dar_es_Salaam', 'East Africa Time', '+03:00', 'TZ'),
  ('Africa/Kampala', 'East Africa Time', '+03:00', 'UG'),
  ('Europe/London', 'GMT/BST', '+00:00', 'GB'),
  ('Europe/Paris', 'CET/CEST', '+01:00', 'FR'),
  ('America/New_York', 'EST/EDT', '-05:00', 'US'),
  ('America/Los_Angeles', 'PST/PDT', '-08:00', 'US'),
  ('UTC', 'Coordinated Universal Time', '+00:00', NULL)
ON CONFLICT ("id") DO NOTHING;

-- Step 11: Add constraints for data integrity
ALTER TABLE "Restaurant"
  ADD CONSTRAINT "Restaurant_currencyCode_check" 
    CHECK ("currencyCode" ~ '^[A-Z]{3}$'),
  ADD CONSTRAINT "Restaurant_countryCode_check" 
    CHECK ("countryCode" IS NULL OR "countryCode" ~ '^[A-Z]{2}$');

ALTER TABLE "User"
  ADD CONSTRAINT "User_preferredCurrency_check" 
    CHECK ("preferredCurrency" ~ '^[A-Z]{3}$');

-- Step 12: Update existing businesses to have proper defaults
UPDATE "Restaurant" 
SET 
  "currencyCode" = 'RWF',
  "currencySymbol" = 'FRw',
  "countryCode" = 'RW',
  "timezone" = 'Africa/Kigali',
  "locale" = 'en'
WHERE "currencyCode" IS NULL OR "timezone" IS NULL;

-- Step 13: Update existing users to have proper defaults
UPDATE "User"
SET
  "timezone" = 'Africa/Kigali',
  "locale" = 'en',
  "preferredCurrency" = 'RWF'
WHERE "timezone" IS NULL OR "preferredCurrency" IS NULL;

-- ============================================================
-- VERIFICATION QUERIES (Run these after migration)
-- ============================================================

-- Check currency and timezone fields exist
SELECT 
  "id",
  "name",
  "currencyCode",
  "currencySymbol",
  "countryCode",
  "timezone"
FROM "Restaurant"
LIMIT 5;

-- Check user timezone settings
SELECT 
  "id",
  "email",
  "timezone",
  "preferredCurrency"
FROM "User"
LIMIT 5;

-- Check exchange rates loaded
SELECT * FROM "CurrencyExchangeRate" ORDER BY "fromCurrency", "toCurrency";

-- Check supported currencies
SELECT * FROM "SupportedCurrency" WHERE "isActive" = true;

-- Check supported timezones
SELECT * FROM "SupportedTimezone" WHERE "isActive" = true;

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
