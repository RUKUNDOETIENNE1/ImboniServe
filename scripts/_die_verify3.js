const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Verify AnomalyAlert.confidence column
  const anomalyCols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_schema='public' AND table_name='AnomalyAlert'
    AND column_name IN ('confidence','type','status','severity')
    ORDER BY column_name
  `);
  console.log("=== AnomalyAlert columns ===");
  anomalyCols.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));

  // AnomalyAlert indexes
  const aidxs = await prisma.$queryRawUnsafe(`
    SELECT indexname FROM pg_indexes
    WHERE schemaname='public' AND tablename='AnomalyAlert'
  `);
  console.log("\n=== AnomalyAlert indexes ===");
  aidxs.forEach(r => console.log(" ", r.indexname));

  // ScannedDocument columns for block4g
  const sdCols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_schema='public' AND table_name='ScannedDocument'
    AND column_name IN ('lifecycleState','reconciliationStatus','confidenceScore','status')
    ORDER BY column_name
  `);
  console.log("\n=== ScannedDocument key columns ===");
  sdCols.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));

  // DocumentEventTimeline existence + columns
  const detCols = await prisma.$queryRawUnsafe(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name='DocumentEventTimeline'
    ORDER BY column_name
  `);
  console.log("\n=== DocumentEventTimeline columns ===");
  if (detCols.length === 0) console.log("  TABLE MISSING");
  else detCols.forEach(r => console.log(" ", r.column_name));

  // DocumentLifecycleState enum
  const enums = await prisma.$queryRawUnsafe(`
    SELECT typname FROM pg_type WHERE typname = 'DocumentLifecycleState'
  `);
  console.log("\n=== DocumentLifecycleState enum:", enums.length > 0 ? "EXISTS" : "MISSING ===");

  // pr01 DIE tables actually in DB
  const dieTables = await prisma.$queryRawUnsafe(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public'
    AND table_name IN (
      'ScanJob','ScannedDocument','ScannedDocumentItem',
      'DocumentProcessingLog','ProcurementReconciliation',
      'DocumentEntityLink','SupplierAlias','ProductAlias','AnomalyAlert'
    )
    ORDER BY table_name
  `);
  console.log("\n=== PR01 DIE tables in DB ===");
  dieTables.forEach(r => console.log(" ", r.table_name));

  // reconciliationStatus on ScannedDocument
  const rsCol = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type, column_default FROM information_schema.columns
    WHERE table_schema='public' AND table_name='ScannedDocument'
    AND column_name='reconciliationStatus'
  `);
  console.log("\n=== ScannedDocument.reconciliationStatus ===");
  if (rsCol.length === 0) console.log("  MISSING");
  else rsCol.forEach(r => console.log(`  ${r.column_name}: ${r.data_type} DEFAULT ${r.column_default}`));

  // CostAnomalyAlert - check if maybe under different schema
  const catAll = await prisma.$queryRawUnsafe(`
    SELECT table_schema, table_name FROM information_schema.tables
    WHERE table_name ILIKE '%CostAnomaly%'
  `);
  console.log("\n=== CostAnomalyAlert in any schema ===");
  if (catAll.length === 0) console.log("  NOT FOUND ANYWHERE");
  else catAll.forEach(r => console.log(` ${r.table_schema}.${r.table_name}`));
}

main().catch(e => { console.error("ERROR:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
