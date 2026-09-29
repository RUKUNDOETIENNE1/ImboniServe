/**
 * Apply CostAnomalyAlert table migration.
 * This table was dropped in 20260324_add_smart_menu_intelligence and needs
 * to be recreated with the current businessId schema.
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient() as any

async function main() {
  console.log('Applying CostAnomalyAlert migration...')

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CostAnomalyAlert" (
      "id"                        TEXT         PRIMARY KEY NOT NULL DEFAULT gen_random_uuid()::text,
      "businessId"                TEXT         NOT NULL,
      "supplierId"                TEXT         NOT NULL,
      "grnItemId"                 TEXT,
      "productName"               TEXT         NOT NULL,
      "unit"                      TEXT         NOT NULL,
      "observedUnitPriceCents"    INTEGER      NOT NULL,
      "trailingAvgUnitPriceCents" INTEGER      NOT NULL,
      "trailingStdDevCents"       REAL,
      "deltaPercent"              REAL         NOT NULL,
      "zScore"                    REAL,
      "thresholdPercent"          REAL         NOT NULL DEFAULT 10,
      "severity"                  TEXT         NOT NULL DEFAULT 'MEDIUM',
      "status"                    TEXT         NOT NULL DEFAULT 'OPEN',
      "notes"                     TEXT,
      "createdAt"                 TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "resolvedAt"                TIMESTAMP(3)
    )
  `)
  console.log('Table created (or already exists).')

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "CostAnomalyAlert_business_status_idx"
    ON "CostAnomalyAlert"("businessId", "status")
  `)
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "CostAnomalyAlert_supplier_status_idx"
    ON "CostAnomalyAlert"("supplierId", "status")
  `)
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "CostAnomalyAlert_business_created_idx"
    ON "CostAnomalyAlert"("businessId", "createdAt" DESC)
  `)
  console.log('Indexes created.')

  // Verify
  const exists: any[] = await prisma.$queryRaw`
    SELECT EXISTS(
      SELECT 1 FROM information_schema.tables WHERE table_name = 'CostAnomalyAlert'
    ) as exists
  `
  console.log(`Verification: CostAnomalyAlert exists = ${exists[0].exists}`)

  await prisma.$disconnect()
  process.exit(0)
}

main().catch(e => {
  console.error('Error:', e.message)
  prisma.$disconnect().finally(() => process.exit(1))
})
