import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check PostgreSQL version
  const version = await prisma.$queryRaw<{ version: string }[]>`SELECT version()`;
  console.log(`POSTGRESQL VERSION: ${version[0].version}`);

  // Check extensions
  const extensions = await prisma.$queryRaw<{ extname: string }[]>`
    SELECT extname FROM pg_extension ORDER BY extname
  `;
  console.log(`\nEXTENSIONS (${extensions.length}):`);
  extensions.forEach(e => console.log(`  - ${e.extname}`));

  // Check schemas
  const schemas = await prisma.$queryRaw<{ schema_name: string }[]>`
    SELECT schema_name FROM information_schema.schemata ORDER BY schema_name
  `;
  console.log(`\nSCHEMAS (${schemas.length}):`);
  schemas.forEach(s => console.log(`  - ${s.schema_name}`));

  // Check Supabase-specific tables in other schemas
  const nonPublicTables = await prisma.$queryRaw<{ table_schema: string; table_name: string }[]>`
    SELECT table_schema, table_name FROM information_schema.tables
    WHERE table_schema NOT IN ('public', 'information_schema', 'pg_catalog', 'pgsodium', 'pgsodium_masks')
    AND table_type = 'BASE TABLE'
    ORDER BY table_schema, table_name
    LIMIT 20
  `;
  console.log(`\nNON-PUBLIC TABLES (${nonPublicTables.length} shown):`);
  nonPublicTables.forEach(t => console.log(`  - ${t.table_schema}.${t.table_name}`));

  await prisma.$disconnect();
}

main().catch(e => {
  console.error('ERROR:', e);
  process.exit(1);
});
