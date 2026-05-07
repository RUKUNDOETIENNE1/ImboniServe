-- AI Features: Cost Anomaly Alerts and Reorder Suggestion Logs

-- Create CostAnomalyAlert table
CREATE TABLE IF NOT EXISTS "CostAnomalyAlert" (
  "id" TEXT PRIMARY KEY NOT NULL DEFAULT md5(random()::text || clock_timestamp()::text),
  "restaurantId" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "grnItemId" TEXT,
  "productName" TEXT NOT NULL,
  "unit" TEXT NOT NULL,
  "observedUnitPriceCents" INTEGER NOT NULL,
  "trailingAvgUnitPriceCents" INTEGER NOT NULL,
  "trailingStdDevCents" REAL,
  "deltaPercent" REAL NOT NULL,
  "zScore" REAL,
  "thresholdPercent" REAL NOT NULL DEFAULT 10,
  "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "CostAnomalyAlert_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CostAnomalyAlert_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CostAnomalyAlert_grnItemId_fkey" FOREIGN KEY ("grnItemId") REFERENCES "GoodsReceivedNoteItem"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "CostAnomalyAlert_restaurant_status_idx" ON "CostAnomalyAlert"("restaurantId", "status");
CREATE INDEX IF NOT EXISTS "CostAnomalyAlert_supplier_status_idx" ON "CostAnomalyAlert"("supplierId", "status");

-- Create ReorderSuggestionLog table
CREATE TABLE IF NOT EXISTS "ReorderSuggestionLog" (
  "id" TEXT PRIMARY KEY NOT NULL DEFAULT md5(random()::text || clock_timestamp()::text),
  "restaurantId" TEXT NOT NULL,
  "inventoryItemId" TEXT NOT NULL,
  "userId" TEXT,
  "suggestedQty" REAL NOT NULL,
  "chosenQty" REAL NOT NULL,
  "action" TEXT NOT NULL,
  "explanation" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReorderSuggestionLog_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ReorderSuggestionLog_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ReorderSuggestionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ReorderSuggestionLog_restaurant_idx" ON "ReorderSuggestionLog"("restaurantId");
CREATE INDEX IF NOT EXISTS "ReorderSuggestionLog_inventoryItem_idx" ON "ReorderSuggestionLog"("inventoryItemId");
