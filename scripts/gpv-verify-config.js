const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const businessId = 'cmsk4x4c900026gygb3x5f8r6';
  const userId = 'cmsk4x2p900006gygp5iknc6b';

  // 1. Business record
  const business = await p.business.findUnique({
    where: { id: businessId },
    include: { plan: true }
  });
  console.log('=== BUSINESS ===');
  console.log(JSON.stringify({
    id: business.id, name: business.name, country: business.country,
    currency: business.currency, timezone: business.timezone,
    taxRate: business.taxRate, taxMode: business.taxMode,
    businessType: business.businessType, isActive: business.isActive,
    isFoundingMember: business.isFoundingMember, approvalStatus: business.approvalStatus,
    trialStartDate: business.trialStartDate, trialEndDate: business.trialEndDate,
    defaultLanguage: business.defaultLanguage,
    plan: business.plan ? { name: business.plan.name, code: business.plan.code, priceCents: business.plan.priceCents, currency: business.plan.currency } : null,
  }, null, 2));

  // 2. User
  const user = await p.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true, roles: true, isActive: true, lastLoginAt: true, businessId: true }
  });
  console.log('\n=== USER ===');
  console.log(JSON.stringify(user, null, 2));

  // 3. Tables
  const tables = await p.table.count({ where: { businessId } });
  console.log(`\n=== TABLES: ${tables} ===`);

  // 4. Menu Items
  const menuItems = await p.menuItem.count({ where: { businessId } });
  console.log(`=== MENU ITEMS: ${menuItems} ===`);

  // 5. Inventory Items
  const invItems = await p.inventoryItem.count({ where: { businessId } });
  console.log(`=== INVENTORY ITEMS: ${invItems} ===`);

  // 6. Suppliers (global marketplace, not business-scoped)
  const supplierOrders = await p.supplierOrder.count({ where: { businessId } });
  console.log(`=== SUPPLIER ORDERS: ${supplierOrders} ===`);

  // 7. Sales
  const sales = await p.sale.count({ where: { businessId } });
  console.log(`=== SALES: ${sales} ===`);

  // 8. Reservations
  const reservations = await p.reservation.count({ where: { businessId } });
  console.log(`=== RESERVATIONS: ${reservations} ===`);

  // 9. Customers
  const customers = await p.customer.count({ where: { businessId } });
  console.log(`=== CUSTOMERS: ${customers} ===`);

  // 10. Subscription
  const subscription = await p.subscription.findFirst({ where: { businessId }, include: { plan: true } });
  console.log('\n=== SUBSCRIPTION ===');
  console.log(JSON.stringify(subscription, null, 2));

  // 11. Payment transactions
  const payments = await p.paymentTransaction.count({ where: { businessId } });
  console.log(`\n=== PAYMENT TRANSACTIONS: ${payments} ===`);

  // 12. QR Codes
  try {
    const qrCodes = await p.qrCode.count({ where: { businessId } });
    console.log(`=== QR CODES: ${qrCodes} ===`);
  } catch (e) {
    console.log(`=== QR CODES: (model check failed: ${e.message.substring(0, 60)}) ===`);
  }

  // 13. Tax configurations
  try {
    const taxConfigs = await p.taxConfiguration.findMany({ where: { businessId } });
    console.log('\n=== TAX CONFIGURATIONS ===');
    console.log(`Count: ${taxConfigs.length}`);
    if (taxConfigs.length > 0) console.log(JSON.stringify(taxConfigs, null, 2));
  } catch (e) {
    console.log(`\n=== TAX CONFIGURATIONS: (check failed: ${e.message.substring(0, 60)}) ===`);
  }

  await p.$disconnect();
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
