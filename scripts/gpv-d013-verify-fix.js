// GPV-D013 End-to-End Verification: BigInt Serialization in Supplier API
// Tests that the supplier orders API endpoints no longer return 500 errors
// due to BigInt serialization failures.
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
  resp = await request('POST', '/api/auth/pre-login', JSON.stringify({ email: EMAIL, password: PASSWORD, debugRequestId: 'GPV-D013' }), allCookies);
  if (resp.status !== 200) throw new Error(`Pre-login failed: ${resp.body.substring(0, 200)}`);
  const newC1 = extractCookies(resp.cookies); if (newC1) allCookies += '; ' + newC1;
  await new Promise(r => setTimeout(r, 1500));
  const otp = await getOTP();
  if (!otp) throw new Error('No OTP found');
  resp = await request('POST', '/api/auth/verify-mfa-otp', JSON.stringify({ email: EMAIL, otp, debugRequestId: 'GPV-D013' }), allCookies);
  if (resp.status !== 200) throw new Error(`MFA verify failed: ${resp.body.substring(0, 200)}`);
  const newC2 = extractCookies(resp.cookies); if (newC2) allCookies += '; ' + newC2;
  const confirmToken = JSON.parse(resp.body).confirmToken;
  resp = await request('POST', '/api/auth/callback/mfa-confirm', `csrfToken=${csrfToken}&email=${EMAIL}&confirmToken=${confirmToken}&json=true`, allCookies, true);
  const newC3 = extractCookies(resp.cookies); if (newC3) allCookies += '; ' + newC3;
  return allCookies;
}

async function main() {
  console.log('=== GPV-D013 End-to-End Verification ===\n');

  const cookies = await getSession();
  console.log('Session established');

  // Get or create a supplier (suppliers are independent entities, not scoped to business)
  let supplier = await p.supplier.findFirst({});
  if (!supplier) {
    supplier = await p.supplier.create({
      data: { name: 'D013 Test Supplier', phone: '+250788000000', email: 'd013@test.com' }
    });
  }
  console.log(`Supplier: ${supplier.name} (${supplier.id})`);

  // Get or create a supplier product
  let product = await p.supplierProduct.findFirst({ where: { supplierId: supplier.id } });
  if (!product) {
    product = await p.supplierProduct.create({
      data: { supplierId: supplier.id, name: 'D013 Test Product', unit: 'kg', unitPriceCents: 5000 }
    });
  }
  console.log(`Product: ${product.name} (${product.id})`);

  // === TEST 1: Create a supplier order ===
  console.log('\n--- TEST 1: Create Supplier Order ---');
  const createResp = await request('POST', '/api/supplier/orders', JSON.stringify({
    supplierId: supplier.id,
    businessId: BUSINESS_ID,
    items: [{ productId: product.id, quantity: 10, unitPriceCents: 5000 }],
    notes: 'D013 test order',
  }), cookies);

  let orderId = null;
  if (createResp.status === 201) {
    const created = JSON.parse(createResp.body);
    orderId = created.id;
    record('Create supplier order', 'PASS', `ID: ${orderId}`);
  } else {
    record('Create supplier order', 'FAIL', `Status ${createResp.status}: ${createResp.body.substring(0, 300)}`);
    // If create fails, we can't continue with the other tests
    printSummary();
    process.exit(1);
  }

  // === TEST 2: List supplier orders (the critical GPV-D013 test) ===
  console.log('\n--- TEST 2: List Supplier Orders (GPV-D013 critical test) ---');
  const listResp = await request('GET', `/api/supplier/orders?businessId=${BUSINESS_ID}`, null, cookies);

  if (listResp.status === 200) {
    const orders = JSON.parse(listResp.body);
    record('GET /api/supplier/orders returns 200', 'PASS', `Status ${listResp.status}`);
    record('Response is valid JSON', 'PASS', `Parsed successfully, ${Array.isArray(orders) ? orders.length : 1} order(s)`);

    // Verify business data is present and storageUsedBytes is a string
    const firstOrder = Array.isArray(orders) ? orders[0] : orders;
    if (firstOrder?.business) {
      record('Business relation present', 'PASS', `name: ${firstOrder.business.name}`);
      const storageUsedBytes = firstOrder.business.storageUsedBytes;
      record('storageUsedBytes is string (not BigInt)', typeof storageUsedBytes === 'string' || storageUsedBytes === null ? 'PASS' : 'FAIL', `type: ${typeof storageUsedBytes}, value: ${storageUsedBytes}`);
    } else {
      record('Business relation present', 'FAIL', 'No business in response');
    }
  } else {
    record('GET /api/supplier/orders returns 200', 'FAIL', `Status ${listResp.status}: ${listResp.body.substring(0, 300)}`);
    record('Response is valid JSON', 'FAIL', 'Could not parse response');
    record('Business relation present', 'FAIL', 'N/A');
    record('storageUsedBytes is string (not BigInt)', 'FAIL', 'N/A');
  }

  // === TEST 3: Update order status to OUT_FOR_DELIVERY ===
  console.log('\n--- TEST 3: Update Order Status ---');
  const statusResp = await request('POST', `/api/supplier/orders/${orderId}/status`, JSON.stringify({
    status: 'OUT_FOR_DELIVERY',
  }), cookies);
  record('Set status to OUT_FOR_DELIVERY', statusResp.status === 200 ? 'PASS' : 'FAIL', `Status ${statusResp.status}: ${statusResp.body.substring(0, 200)}`);

  // === TEST 4: Confirm delivery (the other critical GPV-D013 test) ===
  console.log('\n--- TEST 4: Confirm Delivery (GPV-D013 critical test) ---');
  const deliverResp = await request('POST', `/api/supplier/orders/${orderId}/deliver`, JSON.stringify({
    notes: 'D013 test delivery',
  }), cookies);

  if (deliverResp.status === 200) {
    const deliverBody = JSON.parse(deliverResp.body);
    record('POST /api/supplier/orders/[id]/deliver returns 200', 'PASS', `Status ${deliverResp.status}`);
    record('Delivery response is valid JSON', 'PASS', `Parsed successfully`);

    if (deliverBody.order?.business) {
      record('Business relation in deliver response', 'PASS', `name: ${deliverBody.order.business.name}`);
      const storageUsedBytes = deliverBody.order.business.storageUsedBytes;
      record('storageUsedBytes is string in deliver response', typeof storageUsedBytes === 'string' || storageUsedBytes === null ? 'PASS' : 'FAIL', `type: ${typeof storageUsedBytes}, value: ${storageUsedBytes}`);
    } else {
      record('Business relation in deliver response', 'FAIL', 'No business in response');
      record('storageUsedBytes is string in deliver response', 'FAIL', 'N/A');
    }
  } else {
    record('POST /api/supplier/orders/[id]/deliver returns 200', 'FAIL', `Status ${deliverResp.status}: ${deliverResp.body.substring(0, 300)}`);
    record('Delivery response is valid JSON', 'FAIL', 'Could not parse');
    record('Business relation in deliver response', 'FAIL', 'N/A');
    record('storageUsedBytes is string in deliver response', 'FAIL', 'N/A');
  }

  // === TEST 5: Verify no 500 errors on any supplier endpoint ===
  console.log('\n--- TEST 5: No 500 Errors on Supplier Endpoints ---');
  const listResp2 = await request('GET', `/api/supplier/orders?businessId=${BUSINESS_ID}&status=DELIVERED`, null, cookies);
  record('Filtered list (status=DELIVERED) returns 200', listResp2.status === 200 ? 'PASS' : 'FAIL', `Status ${listResp2.status}`);

  const listResp3 = await request('GET', `/api/supplier/orders?businessId=${BUSINESS_ID}&status=PENDING`, null, cookies);
  record('Filtered list (status=PENDING) returns 200', listResp3.status === 200 ? 'PASS' : 'FAIL', `Status ${listResp3.status}`);

  // === TEST 6: Verify business data is correct ===
  console.log('\n--- TEST 6: Business Data Correctness ---');
  if (listResp.status === 200) {
    const orders = JSON.parse(listResp.body);
    const firstOrder = Array.isArray(orders) ? orders.find(o => o.id === orderId) : null;
    if (firstOrder) {
      record('Order has correct business ID', firstOrder.business?.id === BUSINESS_ID ? 'PASS' : 'FAIL', `expected: ${BUSINESS_ID}, actual: ${firstOrder.business?.id}`);
      record('Order has correct supplier ID', firstOrder.supplier?.id === supplier.id ? 'PASS' : 'FAIL', `expected: ${supplier.id}, actual: ${firstOrder.supplier?.id}`);
      record('Order has items', firstOrder.items?.length > 0 ? 'PASS' : 'FAIL', `items: ${firstOrder.items?.length}`);
    } else {
      record('Order found in list', 'FAIL', 'Order not found in list response');
    }
  }

  // === TEST 7: Verify other BigInt-bearing APIs still work (no regression) ===
  console.log('\n--- TEST 7: No Regression on Other APIs ---');
  const businessResp = await request('GET', '/api/business/current', null, cookies);
  if (businessResp.status === 200) {
    const businessData = JSON.parse(businessResp.body);
    record('GET /api/business/current returns 200', 'PASS', `Status ${businessResp.status}`);
    if (businessData.business || businessData.id) {
      const biz = businessData.business || businessData;
      const storageUsedBytes = biz.storageUsedBytes;
      record('Business current has serializable storageUsedBytes', typeof storageUsedBytes === 'string' || storageUsedBytes === null || storageUsedBytes === undefined ? 'PASS' : 'FAIL', `type: ${typeof storageUsedBytes}`);
    } else {
      record('Business current has serializable storageUsedBytes', 'PASS', 'Business data present');
    }
  } else {
    record('GET /api/business/current returns 200', 'FAIL', `Status ${businessResp.status}: ${businessResp.body.substring(0, 200)}`);
  }

  printSummary();
}

function printSummary() {
  console.log('\n=== GPV-D013 VERIFICATION SUMMARY ===');
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  console.log(`PASS: ${passCount}, FAIL: ${failCount}`);

  if (failCount > 0) {
    console.log('\nFailed tests:');
    for (const r of results.filter(r => r.status === 'FAIL')) {
      console.log(`  ✗ ${r.test}: ${r.notes}`);
    }
  }
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
