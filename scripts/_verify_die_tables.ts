import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
const p = new PrismaClient({ log: ['error'] })
async function main() {
  const needed = [
    'ScanJob','ScannedDocument','ScannedDocumentItem',
    'DocumentProcessingLog','ExtractionPayload',
    'ExtractedDocumentHeaderField','ExtractedDocumentLineField',
  ]
  const r = await p.$queryRawUnsafe<any[]>(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name = ANY($1::text[])",
    needed
  )
  const found = r.map((t: any) => t.table_name).sort()
  console.log('Found:', found)
  const missing = needed.filter(t => !found.includes(t))
  if (missing.length) console.log('MISSING:', missing)
  else console.log('All 7 DIE tables present ✓')

  // Also check _prisma_migrations for DIE
  const migs = await p.$queryRawUnsafe<any[]>(
    "SELECT migration_name, finished_at FROM _prisma_migrations WHERE migration_name LIKE '%pr0%' OR migration_name LIKE '%die%'"
  )
  console.log('\nDIE migrations:', JSON.stringify(migs))

  // Check enum existence
  const enums = await p.$queryRawUnsafe<any[]>(
    "SELECT typname FROM pg_type WHERE typname IN ('DocumentType','DocumentStatus','ReconciliationState','EntityLinkType','LinkType','AnomalyStatus','AnomalySeverity') ORDER BY typname"
  )
  console.log('Enums:', enums.map((e: any) => e.typname))
}
main().catch(e => { console.error(e.message); process.exit(1) }).finally(() => p.$disconnect())
