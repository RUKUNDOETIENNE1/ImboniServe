const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  // Get payment transaction directly by ID (from order draft response)
  const payTxn = await p.paymentTransaction.findUnique({
    where: { id: 'cmsk9r4nn001icwhfw7tvj4xb' },
    select: { id: true, status: true, amountCents: true, currency: true, transactionId: true, referenceId: true, paymentMethod: true, gateway: true }
  });
  console.log('Payment transaction:', JSON.stringify(payTxn, null, 2));

  // Check sale
  const sale = await p.sale.findUnique({
    where: { id: 'cmsk9r3nh001ecwhftmyhepts' },
    select: { id: true, status: true, isPaid: true, paymentStatus: true, paymentTransactionId: true, totalAmountCents: true, kitchenStatus: true }
  });
  console.log('Sale:', JSON.stringify(sale, null, 2));

  // Check sale items
  const items = await p.saleItem.findMany({
    where: { saleId: 'cmsk9r3nh001ecwhftmyhepts' },
    select: { id: true, itemStatus: true, quantity: true, unitPriceCents: true, totalPriceCents: true, consumptionState: true }
  });
  console.log('Sale items:', JSON.stringify(items, null, 2));

  await p.$disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });
