import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

async function main() {
  const types = await p.$queryRawUnsafe<any[]>(
    `SELECT typname FROM pg_type WHERE typname IN ('DocumentType','DocumentStatus','ReconciliationState','EntityLinkType','LinkType','AnomalyStatus','AnomalySeverity') ORDER BY typname`
  )
  console.log('Existing enums:', types.map((t: any) => t.typname))

  const tables = await p.$queryRawUnsafe<any[]>(
    `SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('ScanJob','ScannedDocument','ScannedDocumentItem','DocumentProcessingLog','ExtractionPayload','ExtractedDocumentHeaderField','ExtractedDocumentLineField','ProcurementReconciliation','AnomalyAlert') ORDER BY tablename`
  )
  console.log('Existing tables:', tables.map((t: any) => t.tablename))

  const migration = await p.$queryRawUnsafe<any[]>(
    `SELECT migration_name, finished_at FROM "_prisma_migrations" WHERE migration_name LIKE '%die%' OR migration_name LIKE '%pr01%' OR migration_name LIKE '%pr02%' ORDER BY started_at`
  )
  console.log('DIE migrations in _prisma_migrations:', JSON.stringify(migration))
}

main().catch(e => console.error('ERR:', e.message)).finally(() => p.$disconnect())
