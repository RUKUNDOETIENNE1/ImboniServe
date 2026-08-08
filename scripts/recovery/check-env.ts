import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check table count
  const tables = await prisma.$queryRaw<{ table_name: string }[]>`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;
  console.log(`TABLES (${tables.length}):`);
  tables.forEach(t => console.log(`  - ${t.table_name}`));

  // Check enum count
  const enums = await prisma.$queryRaw<{ typname: string }[]>`
    SELECT t.typname FROM pg_type t
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public' AND t.typtype = 'e'
    ORDER BY t.typname
  `;
  console.log(`\nENUMS (${enums.length}):`);
  enums.forEach(e => console.log(`  - ${e.typname}`));

  // Check _prisma_migrations
  const migrationCount = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT count(*) as count FROM "_prisma_migrations"
  `;
  console.log(`\nPRISMA MIGRATIONS: ${migrationCount[0].count}`);

  // Check PostgreSQL version
  const version = await prisma.$queryRaw<{ version: string }[]>`
    SELECT version()
  `;
  console.log(`\nPOSTGRESQL VERSION: ${version[0].version}`);

  // Check extensions
  const extensions = await prisma.$queryRaw<{ extname: string }[]>`
    SELECT extname FROM pg_extension ORDER BY extname
  `;
  console.log(`\nEXTENSIONS (${extensions.length}):`);
  extensions.forEach(e => console.log(`  - ${e.extname}`));

  // Check RLS
  const rlsTables = await prisma.$queryRaw<{ relname: string; relrowsecurity: boolean }[]>`
    SELECT relname, relrowsecurity FROM pg_class
    WHERE relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND relkind = 'r' AND relrowsecurity = true
  `;
  console.log(`\nRLS ENABLED TABLES (${rlsTables.length}):`);
  rlsTables.forEach(t => console.log(`  - ${t.relname}`));

  await prisma.$disconnect();
}

main().catch(e => {
  console.error('ERROR:', e);
  process.exit(1);
});
