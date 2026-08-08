import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check if PaymentTransactionStatus enum exists
  const enums = await prisma.$queryRaw<{ typname: string }[]>`
    SELECT t.typname FROM pg_type t
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public' AND t.typtype = 'e'
    ORDER BY t.typname
  `;
  console.log(`ENUMS (${enums.length}):`);
  enums.forEach(e => console.log(`  - ${e.typname}`));

  // Check _prisma_migrations state
  const migrations = await prisma.$queryRaw<{ migration_name: string; finished_at: Date | null; rolled_back_at: Date | null }[]>`
    SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations"
    ORDER BY migration_name
  `;
  console.log(`\nMIGRATIONS (${migrations.length}):`);
  migrations.forEach(m => console.log(`  - ${m.migration_name} | finished: ${m.finished_at ? 'YES' : 'NO'} | rolled_back: ${m.rolled_back_at ? 'YES' : 'NO'}`));

  // Check tables
  const tables = await prisma.$queryRaw<{ table_name: string }[]>`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;
  console.log(`\nTABLES (${tables.length}):`);
  tables.forEach(t => console.log(`  - ${t.table_name}`));

  await prisma.$disconnect();
}

main().catch(e => {
  console.error('ERROR:', e);
  process.exit(1);
});
