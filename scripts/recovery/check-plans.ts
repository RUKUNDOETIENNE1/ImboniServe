import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const plans = await prisma.plan.findMany({ select: { id: true, name: true, code: true, isActive: true }, orderBy: { name: 'asc' } });
  console.log(`PLANS (${plans.length}):`);
  plans.forEach(p => console.log(`  - ${p.code}: ${p.name} (active: ${p.isActive})`));
  await prisma.$disconnect();
}

main().catch(e => { console.error('ERROR:', e); process.exit(1); });
