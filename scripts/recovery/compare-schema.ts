import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';

const prisma = new PrismaClient();

async function main() {
  // Parse canonical schema for model names
  const canonicalSchema = readFileSync('prisma/schema.prisma', 'utf8');
  const canonicalModels = new Set<string>();
  const modelRegex = /^model\s+(\w+)\s+{/gm;
  let match;
  while ((match = modelRegex.exec(canonicalSchema)) !== null) {
    canonicalModels.add(match[1]);
  }
  console.log(`Canonical schema models: ${canonicalModels.size}`);

  // Get actual tables from database
  const tables = await prisma.$queryRaw<{ table_name: string }[]>`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;
  const dbTables = new Set(tables.map(t => t.table_name));
  console.log(`Database tables: ${dbTables.size}`);

  // Find models in schema but not in DB (missing tables)
  const missingFromDb = [...canonicalModels].filter(m => !dbTables.has(m));
  console.log(`\nModels in schema but NOT in database (${missingFromDb.length}):`);
  missingFromDb.forEach(m => console.log(`  - ${m}`));

  // Find tables in DB but not in schema (extra tables)
  const extraInDb = [...dbTables].filter(t => !canonicalModels.has(t));
  console.log(`\nTables in database but NOT in schema (${extraInDb.length}):`);
  extraInDb.forEach(t => console.log(`  - ${t}`));

  // Check enums
  const canonicalEnums = new Set<string>();
  const enumRegex = /^enum\s+(\w+)\s+{/gm;
  while ((match = enumRegex.exec(canonicalSchema)) !== null) {
    canonicalEnums.add(match[1]);
  }
  console.log(`\nCanonical schema enums: ${canonicalEnums.size}`);

  const dbEnums = await prisma.$queryRaw<{ typname: string }[]>`
    SELECT t.typname FROM pg_type t
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public' AND t.typtype = 'e'
    ORDER BY t.typname
  `;
  const dbEnumSet = new Set(dbEnums.map(e => e.typname));
  console.log(`Database enums: ${dbEnumSet.size}`);

  const missingEnums = [...canonicalEnums].filter(e => !dbEnumSet.has(e));
  console.log(`\nEnums in schema but NOT in database (${missingEnums.length}):`);
  missingEnums.forEach(e => console.log(`  - ${e}`));

  const extraEnums = [...dbEnumSet].filter(e => !canonicalEnums.has(e));
  console.log(`\nEnums in database but NOT in schema (${extraEnums.length}):`);
  extraEnums.forEach(e => console.log(`  - ${e}`));

  // Summary
  const totalMismatches = missingFromDb.length + extraInDb.length + missingEnums.length + extraEnums.length;
  console.log(`\n=== SCHEMA DRIFT ANALYSIS ===`);
  console.log(`Total mismatches: ${totalMismatches}`);
  if (totalMismatches === 0) {
    console.log(`RESULT: NO SCHEMA DRIFT - Database matches canonical schema`);
  } else {
    console.log(`RESULT: SCHEMA DRIFT DETECTED - See details above`);
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error('ERROR:', e);
  process.exit(1);
});
