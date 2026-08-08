const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Full _prisma_migrations dump
  const migs = await prisma.$queryRawUnsafe(`
    SELECT migration_name, applied_steps_count, finished_at, rolled_back_at, logs
    FROM _prisma_migrations
    ORDER BY started_at ASC
  `);
  console.log("=== ALL _prisma_migrations ===");
  migs.forEach(r => {
    const state = r.rolled_back_at ? "ROLLED_BACK"
      : r.finished_at === null ? "NULL_FINISH"
      : r.applied_steps_count === 0 ? "ZERO_STEPS"
      : "OK";
    console.log(`[${state}] ${r.migration_name}  steps=${r.applied_steps_count}  finished=${r.finished_at ? r.finished_at.toISOString().slice(0,19) : "NULL"}`);
    if (r.logs) console.log("       logs:", String(r.logs).slice(0,120));
  });

  // CostAnomalyAlert existence
  const cat = await prisma.$queryRawUnsafe(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public' AND table_name='CostAnomalyAlert'
  `);
  console.log("\n=== CostAnomalyAlert table:", cat.length > 0 ? "EXISTS" : "MISSING ===");

  // Check what block4e migration created
  const block4eTables = await prisma.$queryRawUnsafe(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public'
    AND table_name ILIKE '%anomaly%' OR table_name ILIKE '%cost%'
    ORDER BY table_name
  `);
  console.log("\n=== Tables matching 'anomaly' or 'cost' ===");
  block4eTables.forEach(r => console.log(" ", r.table_name));

  // DocumentEntityLink indexes
  const idxs = await prisma.$queryRawUnsafe(`
    SELECT indexname, indexdef FROM pg_indexes
    WHERE schemaname='public' AND tablename='DocumentEntityLink'
  `);
  console.log("\n=== DocumentEntityLink indexes ===");
  idxs.forEach(r => console.log(" ", r.indexname, ":", r.indexdef));

  // pr01 migration rows detail
  const pr01 = await prisma.$queryRawUnsafe(`
    SELECT id, migration_name, checksum, finished_at, applied_steps_count, rolled_back_at, logs
    FROM _prisma_migrations
    WHERE migration_name = '20260614_pr01_die_database_foundation'
  `);
  console.log("\n=== pr01 rows detail ===");
  pr01.forEach(r => {
    console.log("  id:", r.id);
    console.log("  checksum:", r.checksum);
    console.log("  finished_at:", r.finished_at);
    console.log("  applied_steps_count:", r.applied_steps_count);
    console.log("  rolled_back_at:", r.rolled_back_at);
    console.log("  logs:", r.logs ? String(r.logs).slice(0,200) : "null");
    console.log("---");
  });
}

main().catch(e => { console.error("ERROR:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
