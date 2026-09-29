import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check key tables using information_schema
  const keyTables = ['Restaurant', 'User', 'Plan', 'MenuItem', 'Sale', 'PaymentTransaction', 
    'FinancialLedgerEntry', 'ScannedDocument', 'Recipe', 'IntelligenceReport', 
    'CostAnomalyAlert', 'AcquisitionAttribution'];
  
  for (const t of keyTables) {
    const result = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT count(*) as count FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = ${t}
    `;
    console.log(`  ${t}: ${result[0].count > 0n ? 'EXISTS' : 'MISSING'}`);
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error('ERROR:', e);
  process.exit(1);
});
