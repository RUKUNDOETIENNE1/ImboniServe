const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const businessCount = await p.business.count();
  console.log('Business count:', businessCount);

  const userCount = await p.user.count();
  console.log('User count:', userCount);

  const saleCount = await p.sale.count();
  console.log('Sale count:', saleCount);

  const businesses = await p.business.findMany({
    select: { id: true, name: true, country: true, currency: true, timezone: true, isActive: true, isFoundingMember: true },
    take: 10,
    orderBy: { createdAt: 'desc' }
  });
  console.log('Recent businesses:', JSON.stringify(businesses, null, 2));

  await p.$disconnect();
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
