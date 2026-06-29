const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // 1. Table existence
  const tables = await prisma.$queryRawUnsafe(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
      'ScannedDocument','ScannedDocumentItem','DocumentEntityLink',
      'DocumentProcessingLog','DocumentEventTimeline','ProcurementReconciliation',
      'AnomalyAlert','CostAnomalyAlert','ScanJob',
      'ExtractedDocumentHeaderField','ExtractedDocumentLineField','ExtractionPayload'
    )
    ORDER BY table_name
  `);
  console.log("=== TABLE EXISTENCE ===");
  const found = tables.map(r => r.table_name);
  const required = ['AnomalyAlert','CostAnomalyAlert','DocumentEntityLink','DocumentEventTimeline',
    'DocumentProcessingLog','ExtractionPayload','ExtractedDocumentHeaderField',
    'ExtractedDocumentLineField','ProcurementReconciliation','ScannedDocument',
    'ScannedDocumentItem','ScanJob'];
  required.forEach(t => console.log(`  ${found.includes(t) ? "FOUND" : "MISSING"}: ${t}`));

  // 2. Key column existence
  const cols = await prisma.$queryRawUnsafe(`
    SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema = 'public'
    AND (
      (table_name = 'ScannedDocument' AND column_name IN ('lifecycleState','reconciliationStatus','confidenceScore'))
      OR (table_name = 'AnomalyAlert' AND column_name = 'confidenceScore')
      OR (table_name = 'CostAnomalyAlert' AND column_name = 'confidenceScore')
    )
    ORDER BY table_name, column_name
  `);
  console.log("\n=== KEY COLUMNS ===");
  const checks = [
    ['ScannedDocument','lifecycleState'],
    ['ScannedDocument','reconciliationStatus'],
    ['ScannedDocument','confidenceScore'],
  ];
  checks.forEach(([t,c]) => {
    const ok = cols.some(r => r.table_name === t && r.column_name === c);
    console.log(`  ${ok ? "FOUND" : "MISSING"}: ${t}.${c}`);
  });

  // 3. DocumentEntityLink unique constraint
  const constraints = await prisma.$queryRawUnsafe(`
    SELECT constraint_name FROM information_schema.table_constraints
    WHERE table_schema = 'public'
    AND table_name = 'DocumentEntityLink'
    AND constraint_type = 'UNIQUE'
  `);
  console.log("\n=== DocumentEntityLink UNIQUE CONSTRAINTS ===");
  if (constraints.length === 0) {
    console.log("  NONE FOUND");
  } else {
    constraints.forEach(r => console.log("  FOUND:", r.constraint_name));
  }

  // 4. _prisma_migrations count + last 5
  const migs = await prisma.$queryRawUnsafe(`
    SELECT migration_name, applied_steps_count, finished_at
    FROM _prisma_migrations
    ORDER BY finished_at DESC
    LIMIT 6
  `);
  console.log("\n=== LAST 6 _prisma_migrations ENTRIES ===");
  migs.forEach(r => console.log(`  [${r.applied_steps_count > 0 ? "OK" : "FAIL"}] ${r.migration_name}  finished: ${r.finished_at}`));

  // 5. Check for failed/unapplied entries
  const failed = await prisma.$queryRawUnsafe(`
    SELECT migration_name FROM _prisma_migrations
    WHERE finished_at IS NULL OR rolled_back_at IS NOT NULL
  `);
  console.log(`\n=== FAILED/UNAPPLIED MIGRATIONS: ${failed.length} ===`);
  failed.forEach(r => console.log("  PROBLEM:", r.migration_name));
}

main().catch(e => { console.error("ERROR:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
