import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const results: { test: string; status: 'PASS' | 'FAIL'; detail: string }[] = [];

async function test(name: string, fn: () => Promise<string>) {
  try {
    const detail = await fn();
    results.push({ test: name, status: 'PASS', detail });
    console.log(`✅ PASS: ${name} — ${detail}`);
  } catch (e: any) {
    results.push({ test: name, status: 'FAIL', detail: e.message });
    console.log(`❌ FAIL: ${name} — ${e.message}`);
  }
}

async function main() {
  console.log('=== STAGE 9: FUNCTIONAL SMOKE TESTS ===\n');

  // 1. Authentication — verify seeded users exist with correct roles
  await test('Authentication — Admin user', async () => {
    const user = await prisma.user.findUnique({ where: { email: 'admin@imboni.resto' } });
    if (!user) throw new Error('Admin user not found');
    const hasAdmin = user.roles.includes('ADMIN');
    if (!hasAdmin) throw new Error(`User roles: ${user.roles.join(', ')}`);
    return `roles=${user.roles.join(',')}`;
  });

  await test('Authentication — Owner user', async () => {
    const user = await prisma.user.findUnique({ where: { email: 'jean@nyamacafe.rw' } });
    if (!user) throw new Error('Owner user not found');
    const hasOwner = user.roles.includes('OWNER');
    if (!hasOwner) throw new Error(`User roles: ${user.roles.join(', ')}`);
    return `roles=${user.roles.join(',')}`;
  });

  await test('Authentication — All 5 roles present', async () => {
    const users = await prisma.user.findMany({
      select: { roles: true }
    });
    const roleSet = new Set<string>();
    users.forEach(u => u.roles.forEach(r => roleSet.add(r)));
    const expected = ['ADMIN', 'OWNER', 'CASHIER', 'KITCHEN_MANAGER', 'SUPPLIER'];
    const missing = expected.filter(r => !roleSet.has(r as any));
    if (missing.length > 0) throw new Error(`Missing roles: ${missing.join(', ')}`);
    return `${roleSet.size} roles found`;
  });

  // 2. Restaurant Management — verify business exists with plan
  await test('Restaurant Management — Business exists', async () => {
    const business = await prisma.business.findFirst({
      include: { plan: true }
    });
    if (!business) throw new Error('No business found');
    if (!business.plan) throw new Error('Business has no plan');
    return `business=${business.name}, plan=${business.plan.name}`;
  });

  // 3. Menu Management — verify menu items exist
  await test('Menu Management — Menu items exist', async () => {
    const items = await prisma.menuItem.findMany({
      take: 5,
      include: { business: true }
    });
    if (items.length === 0) throw new Error('No menu items found');
    return `${items.length} items, sample: ${items[0].name} (${items[0].business?.name || 'no business'})`;
  });

  // 4. QR Ordering — verify QR codes/templates exist
  await test('QR Ordering — QR templates exist', async () => {
    const templates = await prisma.qrTemplate.count();
    if (templates < 3) throw new Error(`Only ${templates} templates (expected >= 3)`);
    return `${templates} templates`;
  });

  // 5. Kitchen Operations — verify kitchen-related tables are accessible
  await test('Kitchen Operations — Station/ItemStatus tables', async () => {
    const stations = await prisma.station.count();
    const tickets = await prisma.ticketEvent.count();
    return `stations=${stations}, tickets=${tickets}`;
  });

  // 6. Inventory — verify inventory items and suppliers
  await test('Inventory — Inventory items accessible', async () => {
    const items = await prisma.inventoryItem.count();
    const suppliers = await prisma.supplier.count();
    return `inventoryItems=${items}, suppliers=${suppliers}`;
  });

  // 7. Reservations — verify reservation table accessible
  await test('Reservations — Table accessible', async () => {
    const count = await prisma.reservation.count();
    return `reservations=${count}`;
  });

  // 8. Supplier Features — verify purchase orders accessible
  await test('Supplier Features — Purchase orders accessible', async () => {
    const pos = await prisma.purchaseOrder.count();
    const products = await prisma.supplierProduct.count();
    return `purchaseOrders=${pos}, supplierProducts=${products}`;
  });

  // 9. Partnership Foundation — verify affiliate/referral tables
  await test('Partnership Foundation — Affiliate tables accessible', async () => {
    const affiliates = await prisma.affiliate.count();
    const referralLinks = await prisma.referralLink.count();
    return `affiliates=${affiliates}, referralLinks=${referralLinks}`;
  });

  // 10. Financial Ledger — verify FinancialLedgerEntry accessible
  await test('Financial Ledger — Table accessible', async () => {
    const count = await prisma.financialLedgerEntry.count();
    return `entries=${count}`;
  });

  // 11. CostAnomalyAlert (raw SQL table) — verify accessible via raw query
  await test('CostAnomalyAlert — Raw SQL table accessible', async () => {
    const result = await prisma.$queryRaw<{ count: bigint }[]>`SELECT count(*) as count FROM "CostAnomalyAlert"`;
    return `alerts=${result[0].count}`;
  });

  // 12. Feature Flags — verify all 20 flags
  await test('Feature Flags — All flags accessible', async () => {
    const flags = await prisma.featureFlag.count();
    if (flags < 20) throw new Error(`Only ${flags} flags (expected >= 20)`);
    return `${flags} flags`;
  });

  // Summary
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`\n=== SMOKE TEST SUMMARY ===`);
  console.log(`PASS: ${passed}/${results.length}`);
  console.log(`FAIL: ${failed}/${results.length}`);
  if (failed === 0) {
    console.log(`RESULT: ALL SMOKE TESTS PASS`);
  } else {
    console.log(`RESULT: ${failed} TEST(S) FAILED`);
    results.filter(r => r.status === 'FAIL').forEach(r => console.log(`  - ${r.test}: ${r.detail}`));
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
