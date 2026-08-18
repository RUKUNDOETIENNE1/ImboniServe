const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const sale = await p.sale.findUnique({
    where: { id: 'cmsk9r3nh001ecwhftmyhepts' },
    select: { id: true, status: true, paymentStatus: true, isPaid: true, totalAmountCents: true, kitchenStatus: true }
  });
  console.log('Sale state:', JSON.stringify(sale, null, 2));

  // Check what statuses exist in the SaleStatus enum
  const sales = await p.sale.groupBy({
    by: ['status'],
    _count: true,
    where: { businessId: 'cmsk4x4c900026gygb3x5f8r6' }
  });
  console.log('Sales by status:', JSON.stringify(sales, null, 2));

  const salesByPayStatus = await p.sale.groupBy({
    by: ['paymentStatus'],
    _count: true,
    where: { businessId: 'cmsk4x4c900026gygb3x5f8r6' }
  });
  console.log('Sales by paymentStatus:', JSON.stringify(salesByPayStatus, null, 2));

  await p.$disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });
