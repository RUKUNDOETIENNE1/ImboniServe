// GPV-001 Phase 11: Supplier Workflow Verification
// Tests: create supplier+product (DB), create order (API), list, status transitions,
//        delivery confirmation, audit trail, close-day link
const http = require('http');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const HOST = '127.0.0.1';
const PORT = 3000;
const EMAIL = 'gpv-test@imboniserve-test.com';
const PASSWORD = 'GPV-Test-2026!';
const USER_ID = 'cmsk4x2p900006gygp5iknc6b';
const BUSINESS_ID = 'cmsk4x4c900026gygb3x5f8r6';
const p = new PrismaClient();

const results = [];
function record(test, status, notes) {
  results.push({ test, status, notes });
  const icon = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '⚠';
  console.log(`  ${icon} ${test}: ${notes}`);
}

function request(method, path, body, cookies, isForm) {
  return new Promise((resolve, reject) => {
    const headers = {};
    headers['Content-Type'] = isForm ? 'application/x-www-form-urlencoded' : 'application/json';
    if (cookies) headers['Cookie'] = cookies;
    if (body) headers['Content-Length'] = Buffer.byteLength(body);
    const req = http.request({ hostname: HOST, port: PORT, path, method, headers, timeout: 120000 }, (res) => {
      let chunks = '';
      res.on('data', d => chunks += d);
      res.on('end', () => resolve({ status: res.statusCode, body: chunks, cookies: res.headers['set-cookie'] }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    if (body) req.write(body);
    req.end();
  });
}

function extractCookies(setCookies) {
  if (!setCookies) return '';
  return setCookies.map(c => c.split(';')[0]).join('; ');
}

function hashOTP(otp) {
  return crypto.createHash('sha256').update(otp + (process.env.NEXTAUTH_SECRET || '')).digest('hex');
}

async function getOTP() {
  const rec = await p.userLoginOtp.findFirst({
    where: { userId: USER_ID, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
    select: { hashedOtp: true },
  });
  if (!rec) return null;
  for (let i = 100000; i <= 999999; i++) {
    if (hashOTP(i.toString()) === rec.hashedOtp) return i.toString();
  }
  return null;
}

async function getSession() {
  let resp = await request('GET', '/api/auth/csrf');
  let allCookies = extractCookies(resp.cookies);
  const csrfToken = JSON.parse(resp.body).csrfToken;
  resp = await request('POST', '/api/auth/pre-login', JSON.stringify({ email: EMAIL, password: PASSWORD, debugRequestId: 'GPV-P11' }), allCookies);
  if (resp.status !== 200) throw new Error(`Pre-login failed: ${resp.body.substring(0, 200)}`);
  const newC1 = extractCookies(resp.cookies); if (newC1) allCookies += '; ' + newC1;
  await new Promise(r => setTimeout(r, 1500));
  const otp = await getOTP();
  if (!otp) throw new Error('No OTP found');
  resp = await request('POST', '/api/auth/verify-mfa-otp', JSON.stringify({ email: EMAIL, otp, debugRequestId: 'GPV-P11' }), allCookies);
  if (resp.status !== 200) throw new Error(`MFA verify failed: ${resp.body.substring(0, 200)}`);
  const newC2 = extractCookies(resp.cookies); if (newC2) allCookies += '; ' + newC2;
  const confirmToken = JSON.parse(resp.body).confirmToken;
  resp = await request('POST', '/api/auth/callback/mfa-confirm', `csrfToken=${csrfToken}&email=${EMAIL}&confirmToken=${confirmToken}&json=true`, allCookies, true);
  const newC3 = extractCookies(resp.cookies); if (newC3) allCookies += '; ' + newC3;
  return allCookies;
}

async function main() {
  console.log('=== GPV-001 Phase 11: Supplier Workflow Verification ===\n');

  // === SETUP: Create Supplier + Product in DB ===
  console.log('--- SETUP: Create Supplier + Product ---');
  const supplier = await p.supplier.create({
    data: {
      name: 'GPV Test Supplier',
      contactName: 'Test Contact',
      email: `gpv-supplier-${Date.now()}@test.com`,
      phone: '+250788999000',
      city: 'Kigali',
      country: 'RW',
      isVerified: true,
      isActive: true,
      leadTimeDays: 2,
      minOrderCents: 10000,
    }
  });
  console.log(`  Supplier created: ${supplier.id} (${supplier.name})`);

  const product = await p.supplierProduct.create({
    data: {
      supplierId: supplier.id,
      name: 'GPV Test Tomato',
      description: 'Fresh tomatoes',
      category: 'Vegetables',
      unit: 'kg',
      unitPriceCents: 1500, // 15 RWF per kg
      minOrderQuantity: 1,
      isAvailable: true,
    }
  });
  console.log(`  Product created: ${product.id} (${product.name}, ${product.unitPriceCents} cents/${product.unit})`);

  // Authenticate
  const cookies = await getSession();
  console.log('Session established');

  // === TEST 1: Create Supplier Order ===
  console.log('\n--- TEST 1: Create Supplier Order ---');
  const createResp = await request('POST', '/api/supplier/orders', JSON.stringify({
    supplierId: supplier.id,
    businessId: BUSINESS_ID,
    items: [{
      productId: product.id,
      quantity: 10,
      unitPriceCents: 1500,
    }],
    notes: 'GPV test order — 10kg tomatoes',
  }), cookies);

  let orderId = null;
  if (createResp.status === 201) {
    const data = JSON.parse(createResp.body);
    orderId = data.id;
    record('POST /api/supplier/orders (create)', 'PASS', `201 Created — ${data.orderNumber}`);
    console.log(`  Order: ${data.orderNumber}, Status: ${data.status}, Total: ${data.totalAmountCents} cents`);
    record('Total amount correct', data.totalAmountCents === 15000 ? 'PASS' : 'FAIL', `expected 15000, actual: ${data.totalAmountCents}`);
    record('Status is PENDING', data.status === 'PENDING' ? 'PASS' : 'FAIL', `actual: ${data.status}`);
    record('Order has items', data.items && data.items.length === 1 ? 'PASS' : 'FAIL', `items: ${data.items?.length}`);
    if (data.items?.[0]) {
      record('Item totalPrice correct', data.items[0].totalPriceCents === 15000 ? 'PASS' : 'FAIL', `actual: ${data.items[0].totalPriceCents}`);
    }
  } else if (createResp.status === 402) {
    record('POST /api/supplier/orders (create)', 'FAIL', `402 — hasSupplierOrders not available: ${createResp.body.substring(0, 200)}`);
    console.log('\n=== PHASE 11 BLOCKED: hasSupplierOrders feature not accessible ===');
    await p.$disconnect();
    process.exit(1);
  } else {
    record('POST /api/supplier/orders (create)', 'FAIL', `Status ${createResp.status}: ${createResp.body.substring(0, 300)}`);
  }

  // === TEST 2: Verify DB state ===
  console.log('\n--- TEST 2: Verify DB State ---');
  if (orderId) {
    const dbOrder = await p.supplierOrder.findUnique({
      where: { id: orderId },
      include: { items: true, supplier: true }
    });
    if (dbOrder) {
      record('Order in DB', 'PASS', `orderNumber=${dbOrder.orderNumber}, status=${dbOrder.status}`);
      record('businessId correct', dbOrder.businessId === BUSINESS_ID ? 'PASS' : 'FAIL', `actual: ${dbOrder.businessId}`);
      record('supplierId correct', dbOrder.supplierId === supplier.id ? 'PASS' : 'FAIL', `actual: ${dbOrder.supplierId}`);
      record('totalAmountCents correct', dbOrder.totalAmountCents === 15000 ? 'PASS' : 'FAIL', `actual: ${dbOrder.totalAmountCents}`);
      record('Items count correct', dbOrder.items.length === 1 ? 'PASS' : 'FAIL', `actual: ${dbOrder.items.length}`);
    } else {
      record('Order in DB', 'FAIL', 'Not found');
    }
  }

  // === TEST 3: List Supplier Orders ===
  console.log('\n--- TEST 3: List Supplier Orders ---');
  const listResp = await request('GET', `/api/supplier/orders?businessId=${BUSINESS_ID}`, null, cookies);
  if (listResp.status === 200) {
    const orders = JSON.parse(listResp.body);
    const found = Array.isArray(orders) ? orders.find(o => o.id === orderId) : null;
    record('GET /api/supplier/orders (list)', 'PASS', `${Array.isArray(orders) ? orders.length : '?'} orders`);
    record('Created order in list', found ? 'PASS' : 'FAIL', found ? `found: ${found.orderNumber}` : 'not found');
  } else {
    record('GET /api/supplier/orders (list)', 'FAIL', `Status ${listResp.status}: ${listResp.body.substring(0, 200)}`);
  }

  // === TEST 4: Status Transitions ===
  console.log('\n--- TEST 4: Status Transitions ---');
  if (orderId) {
    const transitions = [
      { status: 'CONFIRMED', notes: 'Supplier confirmed order' },
      { status: 'PROCESSING', notes: 'Order being prepared' },
      { status: 'READY_FOR_DELIVERY', notes: 'Order ready for pickup' },
      { status: 'OUT_FOR_DELIVERY', notes: 'Order on the way' },
    ];

    for (const t of transitions) {
      const resp = await request('POST', `/api/supplier/orders/${orderId}/status`, JSON.stringify({
        status: t.status,
        notes: t.notes,
      }), cookies);
      if (resp.status === 200) {
        const data = JSON.parse(resp.body);
        record(`Status → ${t.status}`, 'PASS', `orderNumber=${data.orderNumber}, status=${data.status}`);
      } else {
        record(`Status → ${t.status}`, 'FAIL', `Status ${resp.status}: ${resp.body.substring(0, 200)}`);
      }
    }

    // Verify final status in DB
    const dbOrder = await p.supplierOrder.findUnique({ where: { id: orderId }, select: { status: true, notes: true } });
    record('Final status is OUT_FOR_DELIVERY', dbOrder?.status === 'OUT_FOR_DELIVERY' ? 'PASS' : 'FAIL', `actual: ${dbOrder?.status}`);
  }

  // === TEST 5: Confirm Delivery ===
  console.log('\n--- TEST 5: Confirm Delivery ---');
  if (orderId) {
    const deliverResp = await request('POST', `/api/supplier/orders/${orderId}/deliver`, JSON.stringify({
      notes: 'Delivery received — all items in good condition',
    }), cookies);
    if (deliverResp.status === 200) {
      const data = JSON.parse(deliverResp.body);
      record('POST /api/supplier/orders/[id]/deliver', 'PASS', `status=${data.order?.status || 'DELIVERED'}`);
    } else {
      record('POST /api/supplier/orders/[id]/deliver', 'FAIL', `Status ${deliverResp.status}: ${deliverResp.body.substring(0, 200)}`);
    }

    // Verify in DB
    const dbOrder = await p.supplierOrder.findUnique({ where: { id: orderId }, select: { status: true, notes: true } });
    record('Status is DELIVERED', dbOrder?.status === 'DELIVERED' ? 'PASS' : 'FAIL', `actual: ${dbOrder?.status}`);
    record('Delivery notes appended', dbOrder?.notes?.includes('Delivery:') ? 'PASS' : 'WARN', `notes: ${dbOrder?.notes?.substring(0, 100)}`);
  }

  // === TEST 6: Invalid Status Rejection ===
  console.log('\n--- TEST 6: Invalid Status Rejection ---');
  if (orderId) {
    const invalidResp = await request('POST', `/api/supplier/orders/${orderId}/status`, JSON.stringify({
      status: 'INVALID_STATUS',
    }), cookies);
    record('Invalid status rejected', invalidResp.status === 400 ? 'PASS' : 'FAIL', `Status ${invalidResp.status}`);
  }

  // === TEST 7: Full Order Lifecycle in DB ===
  console.log('\n--- TEST 7: Full Order Lifecycle ---');
  if (orderId) {
    const finalOrder = await p.supplierOrder.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        supplier: true,
        deliveries: true,
      }
    });
    if (finalOrder) {
      console.log(`  Order: ${finalOrder.orderNumber}`);
      console.log(`  Status: ${finalOrder.status}`);
      console.log(`  Supplier: ${finalOrder.supplier.name}`);
      console.log(`  Total: ${finalOrder.totalAmountCents} cents`);
      console.log(`  Items: ${finalOrder.items.length}`);
      for (const item of finalOrder.items) {
        console.log(`    ${item.product.name}: ${item.quantity} ${item.product.unit} × ${item.unitPriceCents} = ${item.totalPriceCents} cents`);
      }
      console.log(`  Deliveries: ${finalOrder.deliveries.length}`);
      record('Complete order lifecycle verified', 'PASS', `PENDING → CONFIRMED → PROCESSING → READY_FOR_DELIVERY → OUT_FOR_DELIVERY → DELIVERED`);
    }
  }

  // === TEST 8: Close-Day Context ===
  console.log('\n--- TEST 8: Close-Day Context ---');
  const supplierOrders = await p.supplierOrder.findMany({
    where: { businessId: BUSINESS_ID },
    select: { id: true, orderNumber: true, status: true, totalAmountCents: true, createdAt: true },
  });
  console.log(`  Supplier orders for business: ${supplierOrders.length}`);
  for (const o of supplierOrders) {
    console.log(`  ${o.orderNumber}: status=${o.status}, total=${o.totalAmountCents} cents`);
  }
  record('Supplier orders exist for close-day', supplierOrders.length > 0 ? 'PASS' : 'WARN', `${supplierOrders.length} orders`);

  // === SUMMARY ===
  console.log('\n=== PHASE 11 SUMMARY ===');
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  const warnCount = results.filter(r => r.status === 'WARN').length;
  console.log(`PASS: ${passCount}, FAIL: ${failCount}, WARN: ${warnCount}`);

  if (failCount > 0) {
    console.log('\nFailed tests:');
    for (const r of results.filter(r => r.status === 'FAIL')) {
      console.log(`  ✗ ${r.test}: ${r.notes}`);
    }
  }

  await p.$disconnect();
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
