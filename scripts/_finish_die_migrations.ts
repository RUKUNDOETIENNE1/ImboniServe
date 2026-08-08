/**
 * Finish applying DIE migrations
 *
 * PR01 already created tables + enums + indexes but failed at FK stage
 * because the Prisma schema uses "Business" while the actual table is "Restaurant".
 *
 * This script:
 *  1. Adds all missing FK constraints (with Business → Restaurant remapping)
 *  2. Creates the 3 missing PR02 tables (ExtractionPayload, ExtractedDocument*Field)
 *  3. Marks all 3 migrations as applied in _prisma_migrations
 *
 * Run: npx tsx scripts/_finish_die_migrations.ts
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const p = new PrismaClient({ log: ['error'] })

async function exec(label: string, sql: string): Promise<void> {
  try {
    await p.$executeRawUnsafe(sql)
    console.log(`  ✓ ${label}`)
  } catch (e: any) {
    const msg: string = e.message ?? ''
    if (msg.includes('already exists') || msg.includes('duplicate key') || msg.includes('already been created')) {
      console.log(`  ~ ${label} (already exists)`)
      return
    }
    console.error(`  ✗ ${label}`)
    console.error(`    SQL: ${sql.slice(0, 150)}`)
    console.error(`    Err: ${msg.slice(0, 200)}`)
    throw e
  }
}

async function main() {
  console.log('Step 1: Complete PR01 FK constraints (Business→Restaurant remapping)\n')

  // ScanJob FKs
  await exec('ScanJob_businessId_fkey → Restaurant',
    `ALTER TABLE "ScanJob" ADD CONSTRAINT "ScanJob_businessId_fkey"
     FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE`)
  await exec('ScanJob_createdByUserId_fkey',
    `ALTER TABLE "ScanJob" ADD CONSTRAINT "ScanJob_createdByUserId_fkey"
     FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`)

  // ScannedDocument FKs
  await exec('ScannedDocument_scanJobId_fkey',
    `ALTER TABLE "ScannedDocument" ADD CONSTRAINT "ScannedDocument_scanJobId_fkey"
     FOREIGN KEY ("scanJobId") REFERENCES "ScanJob"("id") ON DELETE CASCADE ON UPDATE CASCADE`)
  await exec('ScannedDocument_businessId_fkey → Restaurant',
    `ALTER TABLE "ScannedDocument" ADD CONSTRAINT "ScannedDocument_businessId_fkey"
     FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE`)
  await exec('ScannedDocument_supplierId_fkey',
    `ALTER TABLE "ScannedDocument" ADD CONSTRAINT "ScannedDocument_supplierId_fkey"
     FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE`)
  await exec('ScannedDocument_matchedPurchaseOrderId_fkey',
    `ALTER TABLE "ScannedDocument" ADD CONSTRAINT "ScannedDocument_matchedPurchaseOrderId_fkey"
     FOREIGN KEY ("matchedPurchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE`)
  await exec('ScannedDocument_matchedGoodsReceivedNoteId_fkey',
    `ALTER TABLE "ScannedDocument" ADD CONSTRAINT "ScannedDocument_matchedGoodsReceivedNoteId_fkey"
     FOREIGN KEY ("matchedGoodsReceivedNoteId") REFERENCES "GoodsReceivedNote"("id") ON DELETE SET NULL ON UPDATE CASCADE`)

  // ScannedDocumentItem FKs
  await exec('ScannedDocumentItem_scannedDocumentId_fkey',
    `ALTER TABLE "ScannedDocumentItem" ADD CONSTRAINT "ScannedDocumentItem_scannedDocumentId_fkey"
     FOREIGN KEY ("scannedDocumentId") REFERENCES "ScannedDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE`)
  await exec('ScannedDocumentItem_productId_fkey',
    `ALTER TABLE "ScannedDocumentItem" ADD CONSTRAINT "ScannedDocumentItem_productId_fkey"
     FOREIGN KEY ("productId") REFERENCES "InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE`)
  await exec('ScannedDocumentItem_supplierProductId_fkey',
    `ALTER TABLE "ScannedDocumentItem" ADD CONSTRAINT "ScannedDocumentItem_supplierProductId_fkey"
     FOREIGN KEY ("supplierProductId") REFERENCES "SupplierProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE`)

  // DocumentProcessingLog FK
  await exec('DocumentProcessingLog_scanJobId_fkey',
    `ALTER TABLE "DocumentProcessingLog" ADD CONSTRAINT "DocumentProcessingLog_scanJobId_fkey"
     FOREIGN KEY ("scanJobId") REFERENCES "ScanJob"("id") ON DELETE CASCADE ON UPDATE CASCADE`)

  // ProcurementReconciliation FKs
  await exec('ProcurementReconciliation_scannedDocumentId_fkey',
    `ALTER TABLE "ProcurementReconciliation" ADD CONSTRAINT "ProcurementReconciliation_scannedDocumentId_fkey"
     FOREIGN KEY ("scannedDocumentId") REFERENCES "ScannedDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE`)
  await exec('ProcurementReconciliation_matchedPurchaseOrderId_fkey',
    `ALTER TABLE "ProcurementReconciliation" ADD CONSTRAINT "ProcurementReconciliation_matchedPurchaseOrderId_fkey"
     FOREIGN KEY ("matchedPurchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE`)
  await exec('ProcurementReconciliation_matchedGoodsReceivedNoteId_fkey',
    `ALTER TABLE "ProcurementReconciliation" ADD CONSTRAINT "ProcurementReconciliation_matchedGoodsReceivedNoteId_fkey"
     FOREIGN KEY ("matchedGoodsReceivedNoteId") REFERENCES "GoodsReceivedNote"("id") ON DELETE SET NULL ON UPDATE CASCADE`)

  // DocumentEntityLink FK
  await exec('DocumentEntityLink_scannedDocumentId_fkey',
    `ALTER TABLE "DocumentEntityLink" ADD CONSTRAINT "DocumentEntityLink_scannedDocumentId_fkey"
     FOREIGN KEY ("scannedDocumentId") REFERENCES "ScannedDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE`)

  // SupplierAlias FK
  await exec('SupplierAlias_supplierId_fkey',
    `ALTER TABLE "SupplierAlias" ADD CONSTRAINT "SupplierAlias_supplierId_fkey"
     FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE`)

  // ProductAlias FKs
  await exec('ProductAlias_inventoryItemId_fkey',
    `ALTER TABLE "ProductAlias" ADD CONSTRAINT "ProductAlias_inventoryItemId_fkey"
     FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE`)
  await exec('ProductAlias_supplierProductId_fkey',
    `ALTER TABLE "ProductAlias" ADD CONSTRAINT "ProductAlias_supplierProductId_fkey"
     FOREIGN KEY ("supplierProductId") REFERENCES "SupplierProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE`)

  // AnomalyAlert FKs
  await exec('AnomalyAlert_businessId_fkey → Restaurant',
    `ALTER TABLE "AnomalyAlert" ADD CONSTRAINT "AnomalyAlert_businessId_fkey"
     FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE`)
  await exec('AnomalyAlert_supplierId_fkey',
    `ALTER TABLE "AnomalyAlert" ADD CONSTRAINT "AnomalyAlert_supplierId_fkey"
     FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE`)
  await exec('AnomalyAlert_scannedDocumentId_fkey',
    `ALTER TABLE "AnomalyAlert" ADD CONSTRAINT "AnomalyAlert_scannedDocumentId_fkey"
     FOREIGN KEY ("scannedDocumentId") REFERENCES "ScannedDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE`)
  await exec('AnomalyAlert_scannedDocumentItemId_fkey',
    `ALTER TABLE "AnomalyAlert" ADD CONSTRAINT "AnomalyAlert_scannedDocumentItemId_fkey"
     FOREIGN KEY ("scannedDocumentItemId") REFERENCES "ScannedDocumentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE`)

  console.log('\nStep 2: Create PR02 tables\n')

  // ExtractedDocumentHeaderField
  await exec('CREATE ExtractedDocumentHeaderField',
    `CREATE TABLE "ExtractedDocumentHeaderField" (
      "id" TEXT NOT NULL,
      "scannedDocumentId" TEXT NOT NULL,
      "fieldName" TEXT NOT NULL,
      "fieldValue" TEXT NOT NULL,
      "confidence" DOUBLE PRECISION,
      "source" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ExtractedDocumentHeaderField_pkey" PRIMARY KEY ("id")
    )`)
  await exec('INDEX ExtractedDocumentHeaderField_scannedDocumentId_idx',
    `CREATE INDEX IF NOT EXISTS "ExtractedDocumentHeaderField_scannedDocumentId_idx"
     ON "ExtractedDocumentHeaderField" ("scannedDocumentId")`)
  await exec('INDEX ExtractedDocumentHeaderField_fieldName_idx',
    `CREATE INDEX IF NOT EXISTS "ExtractedDocumentHeaderField_fieldName_idx"
     ON "ExtractedDocumentHeaderField" ("fieldName")`)
  await exec('FK ExtractedDocumentHeaderField_scannedDocumentId_fkey',
    `ALTER TABLE "ExtractedDocumentHeaderField"
      ADD CONSTRAINT "ExtractedDocumentHeaderField_scannedDocumentId_fkey"
      FOREIGN KEY ("scannedDocumentId") REFERENCES "ScannedDocument"("id")
      ON DELETE CASCADE ON UPDATE CASCADE`)

  // ExtractedDocumentLineField
  await exec('CREATE ExtractedDocumentLineField',
    `CREATE TABLE "ExtractedDocumentLineField" (
      "id" TEXT NOT NULL,
      "scannedDocumentItemId" TEXT NOT NULL,
      "fieldName" TEXT NOT NULL,
      "fieldValue" TEXT NOT NULL,
      "confidence" DOUBLE PRECISION,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ExtractedDocumentLineField_pkey" PRIMARY KEY ("id")
    )`)
  await exec('INDEX ExtractedDocumentLineField_scannedDocumentItemId_idx',
    `CREATE INDEX IF NOT EXISTS "ExtractedDocumentLineField_scannedDocumentItemId_idx"
     ON "ExtractedDocumentLineField" ("scannedDocumentItemId")`)
  await exec('FK ExtractedDocumentLineField_scannedDocumentItemId_fkey',
    `ALTER TABLE "ExtractedDocumentLineField"
      ADD CONSTRAINT "ExtractedDocumentLineField_scannedDocumentItemId_fkey"
      FOREIGN KEY ("scannedDocumentItemId") REFERENCES "ScannedDocumentItem"("id")
      ON DELETE CASCADE ON UPDATE CASCADE`)

  // ExtractionPayload
  await exec('CREATE ExtractionPayload',
    `CREATE TABLE "ExtractionPayload" (
      "id" TEXT NOT NULL,
      "scanJobId" TEXT NOT NULL,
      "provider" TEXT NOT NULL,
      "rawPayload" JSONB NOT NULL,
      "pageStructure" JSONB,
      "extractedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "ExtractionPayload_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "ExtractionPayload_scanJobId_key" UNIQUE ("scanJobId")
    )`)
  await exec('FK ExtractionPayload_scanJobId_fkey',
    `ALTER TABLE "ExtractionPayload"
      ADD CONSTRAINT "ExtractionPayload_scanJobId_fkey"
      FOREIGN KEY ("scanJobId") REFERENCES "ScanJob"("id")
      ON DELETE CASCADE ON UPDATE CASCADE`)

  console.log('\nStep 3: Mark migrations as applied\n')

  // PR01 — mark as done
  await p.$executeRawUnsafe(
    `UPDATE "_prisma_migrations" SET finished_at = NOW(), applied_steps_count = 67
     WHERE migration_name = '20260614_pr01_die_database_foundation'`
  )
  console.log('  ✓ 20260614_pr01_die_database_foundation marked applied')

  // PR02 (empty)
  const pr02 = await p.$queryRawUnsafe<any[]>(
    `SELECT migration_name FROM "_prisma_migrations" WHERE migration_name = '20260614_pr02_extraction_layer'`
  )
  if (pr02.length === 0) {
    await p.$executeRawUnsafe(
      `INSERT INTO "_prisma_migrations" (id, checksum, started_at, finished_at, migration_name, applied_steps_count)
       VALUES (gen_random_uuid()::text, 'manual', NOW(), NOW(), '20260614_pr02_extraction_layer', 0)`
    )
  } else {
    await p.$executeRawUnsafe(
      `UPDATE "_prisma_migrations" SET finished_at = NOW() WHERE migration_name = '20260614_pr02_extraction_layer'`
    )
  }
  console.log('  ✓ 20260614_pr02_extraction_layer marked applied')

  // PR02b
  const pr02b = await p.$queryRawUnsafe<any[]>(
    `SELECT migration_name FROM "_prisma_migrations" WHERE migration_name = '20260614b_pr02_extraction_layer'`
  )
  if (pr02b.length === 0) {
    await p.$executeRawUnsafe(
      `INSERT INTO "_prisma_migrations" (id, checksum, started_at, finished_at, migration_name, applied_steps_count)
       VALUES (gen_random_uuid()::text, 'manual', NOW(), NOW(), '20260614b_pr02_extraction_layer', 7)`
    )
  } else {
    await p.$executeRawUnsafe(
      `UPDATE "_prisma_migrations" SET finished_at = NOW() WHERE migration_name = '20260614b_pr02_extraction_layer'`
    )
  }
  console.log('  ✓ 20260614b_pr02_extraction_layer marked applied')

  // Final verify
  console.log('\nVerification:\n')
  const tables = await p.$queryRawUnsafe<any[]>(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public'
     AND table_name IN ('ScanJob','ScannedDocument','ScannedDocumentItem','DocumentProcessingLog',
                        'ExtractionPayload','ExtractedDocumentHeaderField','ExtractedDocumentLineField')
     ORDER BY table_name`
  )
  console.log('Tables:', tables.map((t: any) => t.table_name))
  if (tables.length === 7) {
    console.log('\n✓ All 7 DIE tables present — migrations complete')
  } else {
    throw new Error(`Only ${tables.length}/7 tables found`)
  }
}

main()
  .catch(e => { console.error('\nFATAL:', e.message); process.exit(1) })
  .finally(() => p.$disconnect())
