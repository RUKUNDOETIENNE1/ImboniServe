-- Add PurchaseOrder model for procurement flow
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poNumber" TEXT NOT NULL UNIQUE,
    "restaurantId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "subtotalCents" INTEGER NOT NULL,
    "vatCents" INTEGER NOT NULL,
    "vatRate" REAL NOT NULL DEFAULT 18.0,
    "totalCents" INTEGER NOT NULL,
    "deliveryAddress" TEXT,
    "deliveryCity" TEXT,
    "deliveryDistrict" TEXT,
    "requestedDeliveryDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedById" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PurchaseOrder_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Add PurchaseOrderItem model
CREATE TABLE "PurchaseOrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purchaseOrderId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "productId" TEXT,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,
    "totalPriceCents" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Add PurchaseOrderStatusHistory model
CREATE TABLE "PurchaseOrderStatusHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purchaseOrderId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "changedByName" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PurchaseOrderStatusHistory_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Add GoodsReceivedNote model
CREATE TABLE "GoodsReceivedNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "grnNumber" TEXT NOT NULL UNIQUE,
    "purchaseOrderId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "receivedById" TEXT NOT NULL,
    "receivedByName" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PARTIAL',
    "notes" TEXT,
    "discrepancyNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GoodsReceivedNote_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GoodsReceivedNote_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GoodsReceivedNote_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Add GoodsReceivedNoteItem model
CREATE TABLE "GoodsReceivedNoteItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "grnId" TEXT NOT NULL,
    "poItemId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "orderedQuantity" REAL NOT NULL,
    "receivedQuantity" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,
    "totalPriceCents" INTEGER NOT NULL,
    "condition" TEXT NOT NULL DEFAULT 'GOOD',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GoodsReceivedNoteItem_grnId_fkey" FOREIGN KEY ("grnId") REFERENCES "GoodsReceivedNote" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Add SupplierPayout model
CREATE TABLE "SupplierPayout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplierId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "grossAmountCents" INTEGER NOT NULL,
    "platformFeeCents" INTEGER NOT NULL,
    "platformFeePercent" REAL NOT NULL DEFAULT 7.5,
    "netAmountCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "method" TEXT,
    "reference" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SupplierPayout_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Extend Supplier model with new fields
ALTER TABLE "Supplier" ADD COLUMN "leadTimeDays" INTEGER NOT NULL DEFAULT 2;
ALTER TABLE "Supplier" ADD COLUMN "minOrderCents" INTEGER DEFAULT 0;
ALTER TABLE "Supplier" ADD COLUMN "deliveryCoverageCities" JSONB;
ALTER TABLE "Supplier" ADD COLUMN "payoutMethod" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "payoutDetails" JSONB;

-- Extend SmartDiningSlip to support PROCUREMENT domain
ALTER TABLE "SmartDiningSlip" ADD COLUMN "domain" TEXT NOT NULL DEFAULT 'DINING';
ALTER TABLE "SmartDiningSlip" ADD COLUMN "purchaseOrderId" TEXT UNIQUE;
ALTER TABLE "SmartDiningSlip" ADD COLUMN "goodsReceivedNoteId" TEXT UNIQUE;
ALTER TABLE "SmartDiningSlip" ADD COLUMN "supplierId" TEXT;
ALTER TABLE "SmartDiningSlip" ADD COLUMN "buyerRestaurantId" TEXT;

-- Make saleId nullable for procurement documents
ALTER TABLE "SmartDiningSlip" ALTER COLUMN "saleId" DROP NOT NULL;

-- Add foreign keys for procurement context
ALTER TABLE "SmartDiningSlip" ADD CONSTRAINT "SmartDiningSlip_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SmartDiningSlip" ADD CONSTRAINT "SmartDiningSlip_goodsReceivedNoteId_fkey" FOREIGN KEY ("goodsReceivedNoteId") REFERENCES "GoodsReceivedNote" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SmartDiningSlip" ADD CONSTRAINT "SmartDiningSlip_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SmartDiningSlip" ADD CONSTRAINT "SmartDiningSlip_buyerRestaurantId_fkey" FOREIGN KEY ("buyerRestaurantId") REFERENCES "Restaurant" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add indexes for performance
CREATE INDEX "PurchaseOrder_restaurantId_idx" ON "PurchaseOrder"("restaurantId");
CREATE INDEX "PurchaseOrder_supplierId_idx" ON "PurchaseOrder"("supplierId");
CREATE INDEX "PurchaseOrder_status_idx" ON "PurchaseOrder"("status");
CREATE INDEX "GoodsReceivedNote_purchaseOrderId_idx" ON "GoodsReceivedNote"("purchaseOrderId");
CREATE INDEX "GoodsReceivedNote_restaurantId_idx" ON "GoodsReceivedNote"("restaurantId");
CREATE INDEX "GoodsReceivedNote_supplierId_idx" ON "GoodsReceivedNote"("supplierId");
CREATE INDEX "SupplierPayout_supplierId_status_idx" ON "SupplierPayout"("supplierId", "status");
CREATE INDEX "SmartDiningSlip_domain_idx" ON "SmartDiningSlip"("domain");
CREATE INDEX "SmartDiningSlip_purchaseOrderId_idx" ON "SmartDiningSlip"("purchaseOrderId");
CREATE INDEX "SmartDiningSlip_supplierId_idx" ON "SmartDiningSlip"("supplierId");
