-- ─────────────────────────────────────────────────────────────────────────────
-- Schema Reconciliation Migration v1.0
-- ─────────────────────────────────────────────────────────────────────────────
-- Purpose: Synchronize schema.prisma, Prisma migration history, and production
--          Supabase database to the same logical state for Version 1.0 release.
--
-- This migration is IDEMPOTENT — safe to run on:
--   1. Fresh environments (all statements execute, creating objects)
--   2. Existing production (IF NOT EXISTS guards skip already-applied changes)
--   3. Existing development databases (same as production)
--
-- Part A: Missing Database Changes (3 columns not yet in production)
-- Part B: Manual Database Changes (already in production, missing from history)
-- ─────────────────────────────────────────────────────────────────────────────

-- ═════════════════════════════════════════════════════════════════════════════
-- Part A: Add Missing Columns to Restaurant Table
-- ═════════════════════════════════════════════════════════════════════════════
-- These columns do NOT exist in production and must be added.
-- Used by: signup.ts, initiate-payment.ts (Founding Hospitality Business Program)

ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "isFoundingMember" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "foundingJoinedAt" TIMESTAMP(3);
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "foundingDiscountPercent" DOUBLE PRECISION NOT NULL DEFAULT 50.0;

-- ═════════════════════════════════════════════════════════════════════════════
-- Part B.1: InventoryItem.reorderLevel
-- ═════════════════════════════════════════════════════════════════════════════
-- Already exists in production (applied manually). Missing from migration history.
-- Used by: inventory.tsx, reorder-autopilot.service.ts, inventory.service.ts, etc.

ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "reorderLevel" DOUBLE PRECISION DEFAULT 0;

-- ═════════════════════════════════════════════════════════════════════════════
-- Part B.2: Customer.contactId + FK to Contact
-- ═════════════════════════════════════════════════════════════════════════════
-- Already exists in production (applied manually). Missing from migration history.
-- Used by: contact-customer-bridge.service.ts, contact.service.ts, etc.

ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "contactId" TEXT;

-- Add unique constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Customer_contactId_key'
  ) THEN
    ALTER TABLE "Customer" ADD CONSTRAINT "Customer_contactId_key" UNIQUE ("contactId");
  END IF;
END $$;

-- Add FK to Contact if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Customer_contactId_fkey'
  ) THEN
    ALTER TABLE "Customer" ADD CONSTRAINT "Customer_contactId_fkey"
      FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- ═════════════════════════════════════════════════════════════════════════════
-- Part B.3: Room.customerId + FK to Customer + Index
-- ═════════════════════════════════════════════════════════════════════════════
-- Already exists in production (applied manually). Missing from migration history.
-- Not directly used by code but part of Guest Recognition schema.

ALTER TABLE "Room" ADD COLUMN IF NOT EXISTS "customerId" TEXT;

-- Add FK to Customer if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Room_customerId_fkey'
  ) THEN
    ALTER TABLE "Room" ADD CONSTRAINT "Room_customerId_fkey"
      FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Add index on customerId if not exists
CREATE INDEX IF NOT EXISTS "Room_customerId_idx" ON "Room"("customerId");

-- ═════════════════════════════════════════════════════════════════════════════
-- Part B.4 & B.5: Reservation.customerId FK change (User → Customer)
-- ═════════════════════════════════════════════════════════════════════════════
-- In production: old FK to User was dropped, new FK to Customer was created.
-- In fresh environments: migration 20260324075113 creates FK to User, which
-- we need to drop and replace with FK to Customer.
-- Used by: reservation-reminder.service.ts (reservation.customer?.name, .phone)

-- Drop old FK to User if it still exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Reservation_customerId_fkey'
    AND conrelid = '"Reservation"'::regclass
    AND confrelid = '"User"'::regclass
  ) THEN
    ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_customerId_fkey";
  END IF;
END $$;

-- Add new FK to Customer if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Reservation_customerId_fkey'
    AND conrelid = '"Reservation"'::regclass
    AND confrelid = '"Customer"'::regclass
  ) THEN
    ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_customerId_fkey"
      FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- ═════════════════════════════════════════════════════════════════════════════
-- Part B.6: LedgerDomain.SALES enum value
-- ═════════════════════════════════════════════════════════════════════════════
-- Already exists in production (applied manually). Missing from migration history.
-- Not currently used by code but kept for future sales revenue ledger entries.

ALTER TYPE "LedgerDomain" ADD VALUE IF NOT EXISTS 'SALES';

-- ═════════════════════════════════════════════════════════════════════════════
-- End of Schema Reconciliation Migration
-- ═════════════════════════════════════════════════════════════════════════════
