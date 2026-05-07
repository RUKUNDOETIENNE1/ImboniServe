-- Tap & Leave™ System Migration
-- Adds dining session tracking, checkout orchestration, and event logging
-- This is a SAFE, ADDITIVE migration - no breaking changes

-- ============================================
-- 1. EXTEND TableSession for Tap & Leave™
-- ============================================

-- Add checkout tracking fields to TableSession
ALTER TABLE "TableSession" ADD COLUMN IF NOT EXISTS "checkoutMode" TEXT DEFAULT 'standard';
ALTER TABLE "TableSession" ADD COLUMN IF NOT EXISTS "checkoutStatus" TEXT DEFAULT 'active';
ALTER TABLE "TableSession" ADD COLUMN IF NOT EXISTS "checkoutInitiatedAt" TIMESTAMP;
ALTER TABLE "TableSession" ADD COLUMN IF NOT EXISTS "checkoutCompletedAt" TIMESTAMP;
ALTER TABLE "TableSession" ADD COLUMN IF NOT EXISTS "finalBillCents" INTEGER;
ALTER TABLE "TableSession" ADD COLUMN IF NOT EXISTS "runningTotalCents" INTEGER DEFAULT 0;

-- Add index for checkout queries
CREATE INDEX IF NOT EXISTS "TableSession_checkoutStatus_idx" ON "TableSession"("checkoutStatus");
CREATE INDEX IF NOT EXISTS "TableSession_businessId_checkoutStatus_idx" ON "TableSession"("businessId", "checkoutStatus");

-- ============================================
-- 2. CREATE DiningSessionSlip (Live Order Tracker)
-- ============================================

CREATE TABLE IF NOT EXISTS "DiningSessionSlip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slipNumber" TEXT NOT NULL UNIQUE,
    "sessionId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "tableId" TEXT,
    
    -- Session State
    "status" TEXT NOT NULL DEFAULT 'active', -- 'active' | 'checkout_initiated' | 'bill_finalized' | 'payment_triggered' | 'awaiting_confirmation' | 'checkout_completed' | 'closed'
    
    -- Financial Tracking (Live)
    "runningSubtotalCents" INTEGER NOT NULL DEFAULT 0,
    "runningVatCents" INTEGER NOT NULL DEFAULT 0,
    "runningTotalCents" INTEGER NOT NULL DEFAULT 0,
    "finalBillCents" INTEGER,
    
    -- Tax Configuration
    "taxMode" TEXT NOT NULL DEFAULT 'EXCLUSIVE', -- 'INCLUSIVE' | 'EXCLUSIVE'
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 18.0,
    
    -- Timestamps
    "sessionStartedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastOrderAt" TIMESTAMP,
    "checkoutInitiatedAt" TIMESTAMP,
    "billFinalizedAt" TIMESTAMP,
    "paymentTriggeredAt" TIMESTAMP,
    "checkoutCompletedAt" TIMESTAMP,
    "closedAt" TIMESTAMP,
    
    -- Metadata
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "DiningSessionSlip_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TableSession"("id") ON DELETE CASCADE,
    CONSTRAINT "DiningSessionSlip_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE,
    CONSTRAINT "DiningSessionSlip_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE SET NULL
);

-- Indexes for DiningSessionSlip
CREATE UNIQUE INDEX IF NOT EXISTS "DiningSessionSlip_slipNumber_key" ON "DiningSessionSlip"("slipNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "DiningSessionSlip_sessionId_key" ON "DiningSessionSlip"("sessionId");
CREATE INDEX IF NOT EXISTS "DiningSessionSlip_businessId_idx" ON "DiningSessionSlip"("businessId");
CREATE INDEX IF NOT EXISTS "DiningSessionSlip_status_idx" ON "DiningSessionSlip"("status");
CREATE INDEX IF NOT EXISTS "DiningSessionSlip_businessId_status_idx" ON "DiningSessionSlip"("businessId", "status");
CREATE INDEX IF NOT EXISTS "DiningSessionSlip_sessionStartedAt_idx" ON "DiningSessionSlip"("sessionStartedAt");

-- ============================================
-- 3. CREATE DiningSessionSlipItem (Line Items)
-- ============================================

CREATE TABLE IF NOT EXISTS "DiningSessionSlipItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slipId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "saleItemId" TEXT NOT NULL,
    
    -- Item Details (denormalized for speed)
    "itemName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,
    "totalPriceCents" INTEGER NOT NULL,
    
    -- Kitchen Status
    "kitchenStatus" TEXT DEFAULT 'pending', -- 'pending' | 'accepted' | 'preparing' | 'almost_ready' | 'ready' | 'served'
    "kitchenReleasedAt" TIMESTAMP,
    "kitchenReadyAt" TIMESTAMP,
    "servedAt" TIMESTAMP,
    
    -- Metadata
    "notes" TEXT,
    "instructionTags" TEXT[],
    
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "DiningSessionSlipItem_slipId_fkey" FOREIGN KEY ("slipId") REFERENCES "DiningSessionSlip"("id") ON DELETE CASCADE,
    CONSTRAINT "DiningSessionSlipItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE,
    CONSTRAINT "DiningSessionSlipItem_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "SaleItem"("id") ON DELETE CASCADE
);

-- Indexes for DiningSessionSlipItem
CREATE INDEX IF NOT EXISTS "DiningSessionSlipItem_slipId_idx" ON "DiningSessionSlipItem"("slipId");
CREATE INDEX IF NOT EXISTS "DiningSessionSlipItem_saleId_idx" ON "DiningSessionSlipItem"("saleId");
CREATE INDEX IF NOT EXISTS "DiningSessionSlipItem_kitchenStatus_idx" ON "DiningSessionSlipItem"("kitchenStatus");

-- ============================================
-- 4. CREATE CheckoutEvent (Audit Trail)
-- ============================================

CREATE TABLE IF NOT EXISTS "CheckoutEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "slipId" TEXT,
    "businessId" TEXT NOT NULL,
    
    -- Event Details
    "eventType" TEXT NOT NULL, -- 'session_started' | 'order_added' | 'checkout_initiated' | 'bill_finalized' | 'payment_triggered' | 'payment_confirmed' | 'payment_failed' | 'checkout_completed' | 'session_closed'
    "eventStatus" TEXT NOT NULL DEFAULT 'success', -- 'success' | 'failed' | 'pending'
    
    -- Context
    "orderId" TEXT,
    "paymentId" TEXT,
    "userId" TEXT,
    
    -- Metadata
    "metadata" JSONB,
    "errorMessage" TEXT,
    
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "CheckoutEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TableSession"("id") ON DELETE CASCADE,
    CONSTRAINT "CheckoutEvent_slipId_fkey" FOREIGN KEY ("slipId") REFERENCES "DiningSessionSlip"("id") ON DELETE SET NULL,
    CONSTRAINT "CheckoutEvent_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE
);

-- Indexes for CheckoutEvent
CREATE INDEX IF NOT EXISTS "CheckoutEvent_sessionId_idx" ON "CheckoutEvent"("sessionId");
CREATE INDEX IF NOT EXISTS "CheckoutEvent_slipId_idx" ON "CheckoutEvent"("slipId");
CREATE INDEX IF NOT EXISTS "CheckoutEvent_businessId_idx" ON "CheckoutEvent"("businessId");
CREATE INDEX IF NOT EXISTS "CheckoutEvent_eventType_idx" ON "CheckoutEvent"("eventType");
CREATE INDEX IF NOT EXISTS "CheckoutEvent_createdAt_idx" ON "CheckoutEvent"("createdAt");
CREATE INDEX IF NOT EXISTS "CheckoutEvent_businessId_eventType_idx" ON "CheckoutEvent"("businessId", "eventType");

-- ============================================
-- 5. EXTEND Sale for Kitchen Dispatch Tracking
-- ============================================

-- Add kitchen dispatch confirmation (making it mandatory)
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "kitchenDispatchedAt" TIMESTAMP;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "kitchenDispatchStatus" TEXT DEFAULT 'pending'; -- 'pending' | 'dispatched' | 'failed'
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "kitchenDispatchError" TEXT;

-- Add index for kitchen dispatch queries
CREATE INDEX IF NOT EXISTS "Sale_kitchenDispatchStatus_idx" ON "Sale"("kitchenDispatchStatus");
CREATE INDEX IF NOT EXISTS "Sale_businessId_kitchenDispatchStatus_idx" ON "Sale"("businessId", "kitchenDispatchStatus");

-- ============================================
-- 6. ADD COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE "DiningSessionSlip" IS 'Live order tracking system for Tap & Leave™ - tracks running totals during dining session';
COMMENT ON TABLE "DiningSessionSlipItem" IS 'Line items in dining session with kitchen status tracking';
COMMENT ON TABLE "CheckoutEvent" IS 'Audit trail for all checkout and payment events in Tap & Leave™ system';
COMMENT ON COLUMN "TableSession"."checkoutMode" IS 'standard | tap_and_leave';
COMMENT ON COLUMN "TableSession"."checkoutStatus" IS 'active | checkout_initiated | bill_finalized | payment_triggered | awaiting_confirmation | checkout_completed';
COMMENT ON COLUMN "Sale"."kitchenDispatchedAt" IS 'Timestamp when order was successfully dispatched to kitchen system';
COMMENT ON COLUMN "Sale"."kitchenDispatchStatus" IS 'Tracks mandatory kitchen dispatch: pending | dispatched | failed';
