// GPV-D010: Complete financial path trace for existing paid order
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const ORDER_ID = 'cmsk9r3nh001ecwhftmyhepts';
const BUSINESS_ID = 'cmsk4x4c900026gygb3x5f8r6';
const PAY_TXN_ID = 'cmsk9r4nn001icwhfw7tvj4xb';

async function main() {
  console.log('=== GPV-D010: COMPLETE FINANCIAL PATH TRACE ===\n');

  // 1. SALE
  console.log('--- 1. SALE ---');
  const sale = await p.sale.findUnique({
    where: { id: ORDER_ID },
    select: {
      id: true, orderNumber: true, status: true, paymentStatus: true, isPaid: true,
      totalAmountCents: true, paymentMethod: true, paymentReference: true,
      businessId: true, kitchenStatus: true, kitchenReleasedAt: true,
      createdAt: true, updatedAt: true, paymentTransactionId: true,
      orderSource: true, tableId: true
    }
  });
  console.log(JSON.stringify(sale, null, 2));

  // 2. SALE ITEMS
  console.log('\n--- 2. SALE ITEMS ---');
  const items = await p.saleItem.findMany({
    where: { saleId: ORDER_ID },
    select: { id: true, menuItemId: true, quantity: true, unitPriceCents: true, totalPriceCents: true, itemStatus: true, consumptionState: true }
  });
  console.log(JSON.stringify(items, null, 2));

  // 3. PAYMENT TRANSACTION
  console.log('\n--- 3. PAYMENT TRANSACTION ---');
  const payTxn = await p.paymentTransaction.findUnique({
    where: { id: PAY_TXN_ID },
    select: {
      id: true, transactionId: true, status: true, amountCents: true, currency: true,
      vatAmountCents: true, exVatAmountCents: true, platformFeeCents: true,
      netToBusinessCents: true, paymentMethod: true, gateway: true,
      paidAt: true, referenceId: true, businessId: true, createdAt: true
    }
  });
  console.log(JSON.stringify(payTxn, null, 2));

  // 4. FINANCIAL LEDGER ENTRIES (by paymentTransactionId)
  console.log('\n--- 4. FINANCIAL LEDGER ENTRIES (by paymentTransactionId) ---');
  let ledgerEntries = await p.financialLedgerEntry.findMany({
    where: { paymentTransactionId: PAY_TXN_ID },
    select: {
      id: true, businessId: true, domain: true, eventType: true,
      amountCents: true, currency: true, vatAmountCents: true, exVatAmountCents: true,
      gatewayFeeCents: true, platformFeeCents: true, netAmountCents: true,
      gateway: true, paymentMethod: true, status: true,
      paymentTransactionId: true, invoiceNumber: true, providerReference: true,
      occurredAt: true, createdAt: true
    }
  });
  console.log(`Ledger entries linked to payment txn: ${ledgerEntries.length}`);
  if (ledgerEntries.length > 0) {
    console.log(JSON.stringify(ledgerEntries, null, 2));
  } else {
    console.log('NO LEDGER ENTRIES FOUND FOR THIS PAYMENT TRANSACTION');
  }

  // 4b. ALL ledger entries for business
  console.log('\n--- 4b. ALL FINANCIAL LEDGER ENTRIES FOR BUSINESS ---');
  const allLedger = await p.financialLedgerEntry.findMany({
    where: { businessId: BUSINESS_ID },
    select: { id: true, domain: true, eventType: true, amountCents: true, currency: true, occurredAt: true, paymentTransactionId: true },
    orderBy: { occurredAt: 'desc' },
    take: 20
  });
  console.log(`Total ledger entries for business: ${allLedger.length}`);
  if (allLedger.length > 0) console.log(JSON.stringify(allLedger, null, 2));

  // 5. DASHBOARD STATS QUERY SIMULATION
  console.log('\n--- 5. DASHBOARD STATS QUERY SIMULATION ---');
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Query 1: status = 'COMPLETED' (what dashboard actually does)
  const byStatus = await p.sale.aggregate({
    where: { businessId: BUSINESS_ID, status: 'COMPLETED', createdAt: { gte: todayStart, lte: todayEnd } },
    _sum: { totalAmountCents: true }, _count: true
  });
  console.log('Query 1 (status=COMPLETED):', JSON.stringify(byStatus));

  // Query 2: paymentStatus = 'COMPLETED' AND isPaid = true
  const byPayStatus = await p.sale.aggregate({
    where: { businessId: BUSINESS_ID, paymentStatus: 'COMPLETED', isPaid: true, createdAt: { gte: todayStart, lte: todayEnd } },
    _sum: { totalAmountCents: true }, _count: true
  });
  console.log('Query 2 (paymentStatus=COMPLETED, isPaid=true):', JSON.stringify(byPayStatus));

  // Query 3: isPaid = true
  const byIsPaid = await p.sale.aggregate({
    where: { businessId: BUSINESS_ID, isPaid: true, createdAt: { gte: todayStart, lte: todayEnd } },
    _sum: { totalAmountCents: true }, _count: true
  });
  console.log('Query 3 (isPaid=true):', JSON.stringify(byIsPaid));

  // 6. ALL SALES FOR BUSINESS
  console.log('\n--- 6. ALL SALES FOR BUSINESS ---');
  const allSales = await p.sale.findMany({
    where: { businessId: BUSINESS_ID },
    select: { id: true, orderNumber: true, status: true, paymentStatus: true, isPaid: true, totalAmountCents: true, createdAt: true }
  });
  console.log(JSON.stringify(allSales, null, 2));

  // 7. LEDGER REVENUE AGGREGATION
  console.log('\n--- 7. LEDGER REVENUE AGGREGATION ---');
  const ledgerRevenue = await p.financialLedgerEntry.aggregate({
    where: { businessId: BUSINESS_ID, domain: 'SALES', eventType: 'PAYMENT_SUCCESS', occurredAt: { gte: todayStart, lte: todayEnd } },
    _sum: { amountCents: true }, _count: true
  });
  console.log('Ledger revenue (SALES/PAYMENT_SUCCESS):', JSON.stringify(ledgerRevenue));

  // 7b. Ledger revenue by any domain/eventType
  const ledgerAll = await p.financialLedgerEntry.aggregate({
    where: { businessId: BUSINESS_ID, occurredAt: { gte: todayStart, lte: todayEnd } },
    _sum: { amountCents: true }, _count: true
  });
  console.log('Ledger revenue (all):', JSON.stringify(ledgerAll));

  await p.$disconnect();
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
