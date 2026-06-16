// @ts-nocheck
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({ log: [] })

async function main() {
  const p = prisma as any

  // All columns on the three Block 4D tables
  const cols = await p.$queryRawUnsafe>(
    `SELECT table_name, column_name, data_type, is_nullable
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name IN ('ScannedDocument','ProcurementReconciliation','DocumentEntityLink')
     ORDER BY table_name, ordinal_position`
  )

  const tables: Record<string, typeof cols> = {}
  for (const c of cols) {
    tables[c.table_name] = tables[c.table_name] ?? []
    tables[c.table_name].push(c)
  }

  for (const [tbl, tcols] of Object.entries(tables)) {
    console.log(`\n${tbl}:`)
    for (const c of tcols) {
      console.log(`  ${c.column_name.padEnd(36)} ${c.data_type.padEnd(20)} nullable=${c.is_nullable}`)
    }
  }

  // Row counts
  const [recCount] = await p.$queryRawUnsafe>(
    'SELECT COUNT(*)::text as cnt FROM "ProcurementReconciliation"'
  )
  console.log(`\nProcurementReconciliation row count: ${recCount.cnt}`)

  // Any orphaned rows (PR with no matching ScannedDocument)
  const orphans = await p.$queryRawUnsafe>(
    `SELECT pr.id FROM "ProcurementReconciliation" pr
     LEFT JOIN "ScannedDocument" sd ON pr."scannedDocumentId" = sd.id
     WHERE sd.id IS NULL LIMIT 10`
  )
  console.log(`Orphaned ProcurementReconciliation rows: ${orphans.length}`)

  // DocumentEntityLink indexes
  const idx = await p.$queryRawUnsafe>(
    `SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'DocumentEntityLink'`
  )
  console.log(`\nDocumentEntityLink indexes:`)
  for (const i of idx) console.log(`  ${i.indexname}`)

  await prisma.$disconnect()
}

main().catch((e) => { console.error(String(e)); process.exit(1) })
