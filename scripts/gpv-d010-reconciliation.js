// GPV-D010: Reconciliation verification with actual observed values
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const BUSINESS_ID = 'cmsk4x4c900026gygb3x5f8r6';
const OLD_ORDER_ID = 'cmsk9r3nh001ecwhftmyhepts'; // The original broken order

async function main() {
  console.log('=== GPV-D010: RECONCILIATION VERIFICATION ===\n');

  // 1. All sales for business
  console.log('--- 1. ALL SALES ---');
  const sales = await p.sale.findMany({
    where: { businessId: BUSINESS_ID },
    select: { id: true, orderNumber: true, status: true, paymentStatus: true, isPaid: true, totalAmountCents: true, createdAt: true, paymentTransactionId: true },
    orderBy: { createdAt: 'asc' }
  });
  let saleRevenue = 0;
  for (const s of sales) {
    console.log(`  ${s.orderNumber}: status=${s.status}, paymentStatus=${s.paymentStatus}, isPaid=${s.isPaid}, total=${s.totalAmountCents} cents`);
    if (s.paymentStatus === 'COMPLETED' && s.isPaid) {
      saleRevenue += s.totalAmountCents;
    }
  }
  console.log(`\n  Total sale revenue (paymentStatus=COMPLETED): ${saleRevenue} cents`);

  // 2. All ledger entries for business
  console.log('\n--- 2. FINANCIAL LEDGER ENTRIES ---');
  const ledgerEntries = await p.financialLedgerEntry.findMany({
    where: { businessId: BUSINESS_ID, eventType: 'PAYMENT_SUCCESS' },
    select: { id: true, domain: true, eventType: true, amountCents: true, currency: true, paymentTransactionId: true, occurredAt: true },
    orderBy: { occurredAt: 'asc' }
  });
  let ledgerRevenue = 0;
  for (const e of ledgerEntries) {
    console.log(`  domain=${e.domain}, amount=${e.amountCents} cents, currency=${e.currency}, txnId=${e.paymentTransactionId}`);
    ledgerRevenue += e.amountCents;
  }
  console.log(`\n  Total ledger revenue (PAYMENT_SUCCESS): ${ledgerRevenue} cents`);

  // 3. Dashboard revenue (simulate the query)
  console.log('\n--- 3. DASHBOARD REVENUE (status=COMPLETED) ---');
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const dashboardRevenue = await p.sale.aggregate({
    where: {
      businessId: BUSINESS_ID,
      status: 'COMPLETED',
      createdAt: { gte: todayStart, lte: todayEnd }
    },
    _sum: { totalAmountCents: true },
    _count: true
  });
  const dashboardRevenueCents = dashboardRevenue._sum.totalAmountCents || 0;
  console.log(`  Dashboard revenue: ${dashboardRevenueCents} cents (${dashboardRevenue._count} orders)`);

  // 4. Close-day revenue (simulate the query — uses paymentStatus=COMPLETED)
  console.log('\n--- 4. CLOSE-DAY REVENUE (paymentStatus=COMPLETED) ---');
  const closeDayRevenue = await p.sale.aggregate({
    where: {
      businessId: BUSINESS_ID,
      paymentStatus: 'COMPLETED',
      createdAt: { gte: todayStart, lte: todayEnd }
    },
    _sum: { totalAmountCents: true },
    _count: true
  });
  const closeDayRevenueCents = closeDayRevenue._sum.totalAmountCents || 0;
  console.log(`  Close-day revenue: ${closeDayRevenueCents} cents (${closeDayRevenue._count} orders)`);

  // 5. CEO dashboard revenue (uses FinancialLedgerEntry with PAYMENT_SUCCESS)
  console.log('\n--- 5. CEO DASHBOARD REVENUE (Ledger PAYMENT_SUCCESS) ---');
  const ceoRevenue = await p.financialLedgerEntry.aggregate({
    where: {
      businessId: BUSINESS_ID,
      eventType: 'PAYMENT_SUCCESS',
      occurredAt: { gte: todayStart, lte: todayEnd }
    },
    _sum: { amountCents: true },
    _count: true
  });
  const ceoRevenueCents = ceoRevenue._sum.amountCents || 0;
  console.log(`  CEO dashboard revenue: ${ceoRevenueCents} cents (${ceoRevenue._count} entries)`);

  // 6. Reconciliation
  console.log('\n=== RECONCILIATION ===');
  console.log(`Sale Revenue (paymentStatus=COMPLETED):     ${saleRevenue} cents`);
  console.log(`Ledger Revenue (PAYMENT_SUCCESS):           ${ledgerRevenue} cents`);
  console.log(`Dashboard Revenue (status=COMPLETED):       ${dashboardRevenueCents} cents`);
  console.log(`Close-Day Revenue (paymentStatus=COMPLETED): ${closeDayRevenueCents} cents`);
  console.log(`CEO Dashboard Revenue (Ledger):             ${ceoRevenueCents} cents`);

  const allMatch = saleRevenue === ledgerRevenue && ledgerRevenue === dashboardRevenueCents && dashboardRevenueCents === closeDayRevenueCents && closeDayRevenueCents === ceoRevenueCents;
  console.log(`\nAll sources reconcile: ${allMatch ? '✓ PASS' : '✗ FAIL'}`);

  if (!allMatch) {
    console.log('\nVariances:');
    console.log(`  Sale vs Ledger:       ${saleRevenue - ledgerRevenue} cents`);
    console.log(`  Ledger vs Dashboard:  ${ledgerRevenue - dashboardRevenueCents} cents`);
    console.log(`  Dashboard vs CloseDay: ${dashboardRevenueCents - closeDayRevenueCents} cents`);
    console.log(`  CloseDay vs CEO:      ${closeDayRevenueCents - ceoRevenueCents} cents`);
  }

  // 7. Check old broken order
  console.log('\n--- 6. OLD BROKEN ORDER (Scenario G) ---');
  const oldOrder = await p.sale.findUnique({
    where: { id: OLD_ORDER_ID },
    select: { id: true, orderNumber: true, status: true, paymentStatus: true, isPaid: true, totalAmountCents: true }
  });
  console.log(`Old order: status=${oldOrder.status}, paymentStatus=${oldOrder.paymentStatus}, isPaid=${oldOrder.isPaid}`);
  console.log(`Old order status is COMPLETED: ${oldOrder.status === 'COMPLETED' ? '✓' : '✗ (pre-fix order, not retroactively fixed)'}`);
  console.log(`Old order appears in dashboard: ${oldOrder.status === 'COMPLETED' ? '✓' : '✗ (excluded by status filter)'}`);

  // Note: The old order was created BEFORE the fix. Its status is still ACTIVE.
  // The fix only applies to NEW orders. This is expected — the fix is not retroactive.
  // The old order's paymentStatus is COMPLETED, so it appears in close-day reports.

  await p.$disconnect();
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
