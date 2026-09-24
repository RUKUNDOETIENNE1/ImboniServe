import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Table count
  const tables = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT count(*) as count FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  `;
  console.log(`TABLES: ${tables[0].count}`);

  // Enum count
  const enums = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT count(*) as count FROM pg_type t
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public' AND t.typtype = 'e'
  `;
  console.log(`ENUMS: ${enums[0].count}`);

  // FK count
  const fks = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT count(*) as count FROM pg_constraint WHERE contype = 'f'
  `;
  console.log(`FOREIGN KEYS: ${fks[0].count}`);

  // Index count
  const indexes = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT count(*) as count FROM pg_indexes WHERE schemaname = 'public'
  `;
  console.log(`INDEXES: ${indexes[0].count}`);

  // Check no FKs reference "Business" table (will error if table doesn't exist — that's good)
  try {
    const badFks = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT count(*) as count FROM pg_constraint 
      WHERE contype = 'f' AND confrelid = '"Business"'::regclass
    `;
    console.log(`FKs referencing "Business": ${badFks[0].count} (should be 0)`);
  } catch (e: any) {
    console.log(`FKs referencing "Business": TABLE DOES NOT EXIST (confirmed no FKs can reference it)`);
  }

  // Check CostAnomalyAlert exists
  const caa = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT to_regclass('"CostAnomalyAlert"') IS NOT NULL as exists
  `;
  console.log(`CostAnomalyAlert exists: ${caa[0].exists}`);

  // Check RLS
  const rlsTables = await prisma.$queryRaw<{ relname: string }[]>`
    SELECT relname FROM pg_class
    WHERE relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND relkind = 'r' AND relrowsecurity = true
  `;
  console.log(`RLS ENABLED TABLES (${rlsTables.length}):`);
  rlsTables.forEach(t => console.log(`  - ${t.relname}`));

  // Migration count
  const migrations = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT count(*) as count FROM "_prisma_migrations" WHERE finished_at IS NOT NULL
  `;
  console.log(`\nAPPLIED MIGRATIONS: ${migrations[0].count}`);

  // Check key tables
  const keyTables = ['Restaurant', 'User', 'Plan', 'MenuItem', 'Sale', 'PaymentTransaction', 
    'FinancialLedgerEntry', 'ScannedDocument', 'Recipe', 'IntelligenceReport', 
    'CostAnomalyAlert', 'AcquisitionAttribution'];
  for (const t of keyTables) {
    const result = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT to_regclass('"${t}"') IS NOT NULL as exists
    `;
    console.log(`  ${t}: ${result[0].exists ? 'EXISTS' : 'MISSING'}`);
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error('ERROR:', e);
  process.exit(1);
});
