// GPV-001 Phase 10: Inventory Verification
// Tests: create item, list, update, stock adjustments (ADD/REMOVE/WASTE/ADJUSTMENT),
//        low stock alerts, negative stock prevention, audit trail, close-day link
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
  resp = await request('POST', '/api/auth/pre-login', JSON.stringify({ email: EMAIL, password: PASSWORD, debugRequestId: 'GPV-P10' }), allCookies);
  if (resp.status !== 200) throw new Error(`Pre-login failed: ${resp.body}`);
  const newC1 = extractCookies(resp.cookies); if (newC1) allCookies += '; ' + newC1;
  await new Promise(r => setTimeout(r, 1500));
  const otp = await getOTP();
  if (!otp) throw new Error('No OTP found');
  resp = await request('POST', '/api/auth/verify-mfa-otp', JSON.stringify({ email: EMAIL, otp, debugRequestId: 'GPV-P10' }), allCookies);
  if (resp.status !== 200) throw new Error(`MFA verify failed: ${resp.body}`);
  const newC2 = extractCookies(resp.cookies); if (newC2) allCookies += '; ' + newC2;
  const confirmToken = JSON.parse(resp.body).confirmToken;
  resp = await request('POST', '/api/auth/callback/mfa-confirm', `csrfToken=${csrfToken}&email=${EMAIL}&confirmToken=${confirmToken}&json=true`, allCookies, true);
  const newC3 = extractCookies(resp.cookies); if (newC3) allCookies += '; ' + newC3;
  return allCookies;
}

async function main() {
  console.log('=== GPV-001 Phase 10: Inventory Verification ===\n');

  const cookies = await getSession();
  console.log('Session established');

  // === TEST 1: Create Inventory Item ===
  console.log('\n--- TEST 1: Create Inventory Item ---');
  const createResp = await request('POST', '/api/inventory', JSON.stringify({
    name: 'GPV Test Flour',
    description: 'All-purpose flour for testing',
    category: 'Baking',
    unit: 'kg',
    currentStock: 50,
    minStockLevel: 10,
    reorderLevel: 15,
    unitCostCents: 200, // 2 RWF per kg
  }), cookies);

  let itemId = null;
  if (createResp.status === 201) {
    const data = JSON.parse(createResp.body);
    itemId = data.id;
    record('POST /api/inventory (create)', 'PASS', `201 Created — ID: ${itemId}`);
    console.log(`  Name: ${data.name}, Stock: ${data.currentStock} ${data.unit}, Min: ${data.minStockLevel}`);
  } else if (createResp.status === 402) {
    record('POST /api/inventory (create)', 'FAIL', `402 — feature not available: ${createResp.body.substring(0, 200)}`);
    console.log('\n=== PHASE 10 BLOCKED: hasInventory feature not accessible ===');
    await p.$disconnect();
    process.exit(1);
  } else {
    record('POST /api/inventory (create)', 'FAIL', `Status ${createResp.status}: ${createResp.body.substring(0, 300)}`);
  }

  // === TEST 2: Verify DB state ===
  console.log('\n--- TEST 2: Verify DB State ---');
  if (itemId) {
    const dbItem = await p.inventoryItem.findUnique({ where: { id: itemId } });
    if (dbItem) {
      record('Item in DB', 'PASS', `name=${dbItem.name}, stock=${dbItem.currentStock}, unit=${dbItem.unit}`);
      record('businessId correct', dbItem.businessId === BUSINESS_ID ? 'PASS' : 'FAIL', `actual: ${dbItem.businessId}`);
      record('currentStock correct', dbItem.currentStock === 50 ? 'PASS' : 'FAIL', `actual: ${dbItem.currentStock}`);
      record('minStockLevel correct', dbItem.minStockLevel === 10 ? 'PASS' : 'FAIL', `actual: ${dbItem.minStockLevel}`);
      record('reorderLevel correct', dbItem.reorderLevel === 15 ? 'PASS' : 'FAIL', `actual: ${dbItem.reorderLevel}`);
      record('unitCostCents correct', dbItem.unitCostCents === 200 ? 'PASS' : 'FAIL', `actual: ${dbItem.unitCostCents}`);
      record('isActive default', dbItem.isActive === true ? 'PASS' : 'FAIL', `actual: ${dbItem.isActive}`);
      record('costingMethod default', dbItem.costingMethod === 'WAVG' ? 'PASS' : 'FAIL', `actual: ${dbItem.costingMethod}`);
    } else {
      record('Item in DB', 'FAIL', 'Not found');
    }
  }

  // === TEST 3: List Inventory Items ===
  console.log('\n--- TEST 3: List Inventory Items ---');
  const listResp = await request('GET', '/api/inventory', null, cookies);
  if (listResp.status === 200) {
    const data = JSON.parse(listResp.body);
    const items = data.data || data.items || data;
    const found = Array.isArray(items) ? items.find(i => i.id === itemId) : null;
    record('GET /api/inventory (list)', 'PASS', `${Array.isArray(items) ? items.length : '?'} items returned`);
    record('Created item in list', found ? 'PASS' : 'FAIL', found ? `found: ${found.name}` : 'not found');
  } else {
    record('GET /api/inventory (list)', 'FAIL', `Status ${listResp.status}: ${listResp.body.substring(0, 200)}`);
  }

  // === TEST 4: Get Item by ID ===
  console.log('\n--- TEST 4: Get Item by ID ---');
  if (itemId) {
    const getResp = await request('GET', `/api/inventory/${itemId}`, null, cookies);
    if (getResp.status === 200) {
      const data = JSON.parse(getResp.body);
      record('GET /api/inventory/[id]', 'PASS', `name=${data.name}, stock=${data.currentStock}`);
      record('Includes updates history', Array.isArray(data.updates) ? 'PASS' : 'WARN', `updates: ${Array.isArray(data.updates) ? data.updates.length : 'N/A'}`);
    } else {
      record('GET /api/inventory/[id]', 'FAIL', `Status ${getResp.status}`);
    }
  }

  // === TEST 5: Stock Adjustment — ADD ===
  console.log('\n--- TEST 5: Stock Adjustment — ADD ---');
  if (itemId) {
    const addResp = await request('POST', '/api/inventory/updates', JSON.stringify({
      inventoryItemId: itemId,
      type: 'ADD',
      quantity: 20,
      reason: 'New delivery',
      notes: 'GPV test — restocked 20kg',
    }), cookies);
    if (addResp.status === 201) {
      const data = JSON.parse(addResp.body);
      record('POST /api/inventory/updates (ADD)', 'PASS', `stock: ${data.updatedItem.currentStock}`);
      record('Stock increased by 20', data.updatedItem.currentStock === 70 ? 'PASS' : 'FAIL', `expected 70, actual: ${data.updatedItem.currentStock}`);
    } else {
      record('POST /api/inventory/updates (ADD)', 'FAIL', `Status ${addResp.status}: ${addResp.body.substring(0, 200)}`);
    }

    // Verify InventoryUpdate record created
    const updates = await p.inventoryUpdate.findMany({
      where: { inventoryItemId: itemId },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });
    if (updates.length > 0) {
      record('InventoryUpdate record created', 'PASS', `type=${updates[0].type}, qty=${updates[0].quantity}`);
      record('InventoryUpdate userId set', updates[0].userId ? 'PASS' : 'FAIL', `userId: ${updates[0].userId}`);
      record('InventoryUpdate businessId set', updates[0].businessId === BUSINESS_ID ? 'PASS' : 'FAIL', `businessId: ${updates[0].businessId}`);
    } else {
      record('InventoryUpdate record created', 'FAIL', 'No update record found');
    }
  }

  // === TEST 6: Stock Adjustment — REMOVE ===
  console.log('\n--- TEST 6: Stock Adjustment — REMOVE ---');
  if (itemId) {
    const removeResp = await request('POST', '/api/inventory/updates', JSON.stringify({
      inventoryItemId: itemId,
      type: 'REMOVE',
      quantity: 15,
      reason: 'Used in kitchen',
      notes: 'GPV test — removed 15kg',
    }), cookies);
    if (removeResp.status === 201) {
      const data = JSON.parse(removeResp.body);
      record('POST /api/inventory/updates (REMOVE)', 'PASS', `stock: ${data.updatedItem.currentStock}`);
      record('Stock decreased by 15', data.updatedItem.currentStock === 55 ? 'PASS' : 'FAIL', `expected 55, actual: ${data.updatedItem.currentStock}`);
    } else {
      record('POST /api/inventory/updates (REMOVE)', 'FAIL', `Status ${removeResp.status}: ${removeResp.body.substring(0, 200)}`);
    }
  }

  // === TEST 7: Stock Adjustment — WASTE ===
  console.log('\n--- TEST 7: Stock Adjustment — WASTE ---');
  if (itemId) {
    const wasteResp = await request('POST', '/api/inventory/updates', JSON.stringify({
      inventoryItemId: itemId,
      type: 'WASTE',
      quantity: 5,
      reason: 'Spoiled',
      notes: 'GPV test — wasted 5kg',
    }), cookies);
    if (wasteResp.status === 201) {
      const data = JSON.parse(wasteResp.body);
      record('POST /api/inventory/updates (WASTE)', 'PASS', `stock: ${data.updatedItem.currentStock}`);
      record('Stock decreased by 5', data.updatedItem.currentStock === 50 ? 'PASS' : 'FAIL', `expected 50, actual: ${data.updatedItem.currentStock}`);
    } else {
      record('POST /api/inventory/updates (WASTE)', 'FAIL', `Status ${wasteResp.status}: ${wasteResp.body.substring(0, 200)}`);
    }
  }

  // === TEST 8: Stock Adjustment — ADJUSTMENT (set exact value) ===
  console.log('\n--- TEST 8: Stock Adjustment — ADJUSTMENT ---');
  if (itemId) {
    const adjustResp = await request('POST', '/api/inventory/updates', JSON.stringify({
      inventoryItemId: itemId,
      type: 'ADJUSTMENT',
      quantity: 8, // Set stock to exactly 8 (below min of 10)
      reason: 'Stock count correction',
      notes: 'GPV test — adjusted to 8kg',
    }), cookies);
    if (adjustResp.status === 201) {
      const data = JSON.parse(adjustResp.body);
      record('POST /api/inventory/updates (ADJUSTMENT)', 'PASS', `stock: ${data.updatedItem.currentStock}`);
      record('Stock set to 8', data.updatedItem.currentStock === 8 ? 'PASS' : 'FAIL', `expected 8, actual: ${data.updatedItem.currentStock}`);
    } else {
      record('POST /api/inventory/updates (ADJUSTMENT)', 'FAIL', `Status ${adjustResp.status}: ${adjustResp.body.substring(0, 200)}`);
    }
  }

  // === TEST 9: Negative Stock Prevention ===
  console.log('\n--- TEST 9: Negative Stock Prevention ---');
  if (itemId) {
    const overRemoveResp = await request('POST', '/api/inventory/updates', JSON.stringify({
      inventoryItemId: itemId,
      type: 'REMOVE',
      quantity: 100, // More than current stock (8)
      reason: 'Test negative',
    }), cookies);
    if (overRemoveResp.status === 400) {
      record('Negative stock prevented', 'PASS', `400 Bad Request (stock cannot be negative)`);
    } else {
      record('Negative stock prevented', 'FAIL', `Status ${overRemoveResp.status}: ${overRemoveResp.body.substring(0, 200)}`);
    }
  }

  // === TEST 10: Low Stock Alerts ===
  console.log('\n--- TEST 10: Low Stock Alerts ---');
  if (itemId) {
    const alertsResp = await request('GET', '/api/inventory/alerts', null, cookies);
    if (alertsResp.status === 200) {
      const alerts = JSON.parse(alertsResp.body);
      const found = Array.isArray(alerts) ? alerts.find(a => a.id === itemId) : null;
      record('GET /api/inventory/alerts', 'PASS', `${Array.isArray(alerts) ? alerts.length : '?'} alerts`);
      if (found) {
        record('Low stock item in alerts', 'PASS', `name=${found.name}, stock=${found.currentStock}, alertLevel=${found.alertLevel}`);
        record('Alert level is CRITICAL or HIGH/MEDIUM', ['CRITICAL', 'HIGH', 'MEDIUM'].includes(found.alertLevel) ? 'PASS' : 'FAIL', `actual: ${found.alertLevel}`);
      } else {
        record('Low stock item in alerts', 'FAIL', 'Item with stock=8, min=10 not found in alerts');
      }
    } else if (alertsResp.status === 402) {
      record('GET /api/inventory/alerts', 'WARN', `402 — hasInventoryAlerts not available: ${alertsResp.body.substring(0, 100)}`);
    } else {
      record('GET /api/inventory/alerts', 'FAIL', `Status ${alertsResp.status}: ${alertsResp.body.substring(0, 200)}`);
    }
  }

  // === TEST 11: Update Item ===
  console.log('\n--- TEST 11: Update Item ---');
  if (itemId) {
    const updateResp = await request('PATCH', `/api/inventory/${itemId}`, JSON.stringify({
      minStockLevel: 5,
      reorderLevel: 8,
    }), cookies);
    if (updateResp.status === 200) {
      const data = JSON.parse(updateResp.body);
      record('PATCH /api/inventory/[id] (update)', 'PASS', `minStock=${data.minStockLevel}, reorder=${data.reorderLevel}`);
    } else {
      record('PATCH /api/inventory/[id] (update)', 'FAIL', `Status ${updateResp.status}: ${updateResp.body.substring(0, 200)}`);
    }
  }

  // === TEST 12: Verify full audit trail ===
  console.log('\n--- TEST 12: Verify Audit Trail ---');
  if (itemId) {
    const allUpdates = await p.inventoryUpdate.findMany({
      where: { inventoryItemId: itemId },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { name: true } } },
    });
    console.log(`  Total updates: ${allUpdates.length}`);
    for (const u of allUpdates) {
      console.log(`  ${u.type} ${u.quantity} — reason: ${u.reason || 'N/A'} — user: ${u.user?.name || 'N/A'}`);
    }
    record('Audit trail has 4 updates', allUpdates.length === 4 ? 'PASS' : 'FAIL', `expected 4, actual: ${allUpdates.length}`);
    const types = allUpdates.map(u => u.type);
    record('Update types correct', JSON.stringify(types) === JSON.stringify(['ADD', 'REMOVE', 'WASTE', 'ADJUSTMENT']) ? 'PASS' : 'FAIL', `actual: ${JSON.stringify(types)}`);
  }

  // === TEST 13: Close-day context ===
  console.log('\n--- TEST 13: Close-Day Context ---');
  const invItems = await p.inventoryItem.findMany({
    where: { businessId: BUSINESS_ID, isActive: true },
    select: { id: true, name: true, currentStock: true, minStockLevel: true, unit: true },
  });
  console.log(`  Active inventory items: ${invItems.length}`);
  for (const i of invItems) {
    const status = i.currentStock <= i.minStockLevel ? 'LOW STOCK' : 'OK';
    console.log(`  ${i.name}: ${i.currentStock} ${i.unit} (min: ${i.minStockLevel}) — ${status}`);
  }
  record('Inventory items exist for close-day', invItems.length > 0 ? 'PASS' : 'WARN', `${invItems.length} items`);

  // === SUMMARY ===
  console.log('\n=== PHASE 10 SUMMARY ===');
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
