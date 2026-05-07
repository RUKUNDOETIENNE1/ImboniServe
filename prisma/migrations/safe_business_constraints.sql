-- Guarded foreign key constraints for Business migration
-- Safe to run multiple times; adds constraints only if missing

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MenuItem_businessId_fkey') THEN
    ALTER TABLE "MenuItem"
      ADD CONSTRAINT "MenuItem_businessId_fkey"
      FOREIGN KEY ("businessId") REFERENCES "Restaurant"(id)
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Sale_businessId_fkey') THEN
    ALTER TABLE "Sale"
      ADD CONSTRAINT "Sale_businessId_fkey"
      FOREIGN KEY ("businessId") REFERENCES "Restaurant"(id)
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InventoryItem_businessId_fkey') THEN
    ALTER TABLE "InventoryItem"
      ADD CONSTRAINT "InventoryItem_businessId_fkey"
      FOREIGN KEY ("businessId") REFERENCES "Restaurant"(id)
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InventoryUpdate_businessId_fkey') THEN
    ALTER TABLE "InventoryUpdate"
      ADD CONSTRAINT "InventoryUpdate_businessId_fkey"
      FOREIGN KEY ("businessId") REFERENCES "Restaurant"(id)
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Subscription_businessId_fkey') THEN
    ALTER TABLE "Subscription"
      ADD CONSTRAINT "Subscription_businessId_fkey"
      FOREIGN KEY ("businessId") REFERENCES "Restaurant"(id)
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WhatsAppMessage_businessId_fkey') THEN
    ALTER TABLE "WhatsAppMessage"
      ADD CONSTRAINT "WhatsAppMessage_businessId_fkey"
      FOREIGN KEY ("businessId") REFERENCES "Restaurant"(id)
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SupplierOrder_businessId_fkey') THEN
    ALTER TABLE "SupplierOrder"
      ADD CONSTRAINT "SupplierOrder_businessId_fkey"
      FOREIGN KEY ("businessId") REFERENCES "Restaurant"(id)
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MarketplaceOrder_businessId_fkey') THEN
    ALTER TABLE "MarketplaceOrder"
      ADD CONSTRAINT "MarketplaceOrder_businessId_fkey"
      FOREIGN KEY ("businessId") REFERENCES "Restaurant"(id)
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Table_businessId_fkey') THEN
    ALTER TABLE "Table"
      ADD CONSTRAINT "Table_businessId_fkey"
      FOREIGN KEY ("businessId") REFERENCES "Restaurant"(id)
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Customer_businessId_fkey') THEN
    ALTER TABLE "Customer"
      ADD CONSTRAINT "Customer_businessId_fkey"
      FOREIGN KEY ("businessId") REFERENCES "Restaurant"(id)
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AffiliateCommission_businessId_fkey') THEN
    ALTER TABLE "AffiliateCommission"
      ADD CONSTRAINT "AffiliateCommission_businessId_fkey"
      FOREIGN KEY ("businessId") REFERENCES "Restaurant"(id)
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SmartDiningSlip_buyerBusinessId_fkey') THEN
    ALTER TABLE "SmartDiningSlip"
      ADD CONSTRAINT "SmartDiningSlip_buyerBusinessId_fkey"
      FOREIGN KEY ("buyerBusinessId") REFERENCES "Restaurant"(id)
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PurchaseOrder_businessId_fkey') THEN
    ALTER TABLE "PurchaseOrder"
      ADD CONSTRAINT "PurchaseOrder_businessId_fkey"
      FOREIGN KEY ("businessId") REFERENCES "Restaurant"(id)
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GoodsReceivedNote_businessId_fkey') THEN
    ALTER TABLE "GoodsReceivedNote"
      ADD CONSTRAINT "GoodsReceivedNote_businessId_fkey"
      FOREIGN KEY ("businessId") REFERENCES "Restaurant"(id)
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'User_businessId_fkey') THEN
    ALTER TABLE "User"
      ADD CONSTRAINT "User_businessId_fkey"
      FOREIGN KEY ("businessId") REFERENCES "Restaurant"(id)
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END$$;
