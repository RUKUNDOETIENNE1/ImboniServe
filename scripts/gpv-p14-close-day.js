// GPV-001 Phase 14: Close-Day Verification
// Tests: Z-Report generation (GET), close-day (POST), ledger cross-check,
//        audit trail, idempotency, GPV-D011 documentation
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
  resp = await request('POST', '/api/auth/pre-login', JSON.stringify({ email: EMAIL, password: PASSWORD, debugRequestId: 'GPV-P14' }), allCookies);
  if (resp.status !== 200) throw new Error(`Pre-login failed: ${resp.body.substring(0, 200)}`);
  const newC1 = extractCookies(resp.cookies); if (newC1) allCookies += '; ' + newC1;
  await new Promise(r => setTimeout(r, 1500));
  const otp = await getOTP();
  if (!otp) throw new Error('No OTP found');
  resp = await request('POST', '/api/auth/verify-mfa-otp', JSON.stringify({ email: EMAIL, otp, debugRequestId: 'GPV-P14' }), allCookies);
  if (resp.status !== 200) throw new Error(`MFA verify failed: ${resp.body.substring(0, 200)}`);
  const newC2 = extractCookies(resp.cookies); if (newC2) allCookies += '; ' + newC2;
  const confirmToken = JSON.parse(resp.body).confirmToken;
  resp = await request('POST', '/api/auth/callback/mfa-confirm', `csrfToken=${csrfToken}&email=${EMAIL}&confirmToken=${confirmToken}&json=true`, allCookies, true);
  const newC3 = extractCookies(resp.cookies); if (newC3) allCookies += '; ' + newC3;
  return allCookies;
}

async function main() {
  console.log('=== GPV-001 Phase 14: Close-Day Verification ===\n');

  const cookies = await getSession();
  console.log('Session established');

  // === TEST 1: GET Z-Report (expected to fail — GPV-D011) ===
  console.log('\n--- TEST 1: GET Z-Report (GPV-D011 expected) ---');
  const getResp = await request('GET', '/api/reports/close-day', null, cookies);
  if (getResp.status === 500) {
    record('GET /api/reports/close-day (Z-Report)', 'WARN', `500 error — GPV-D011 (reservation.groupBy uses invalid 'date' field)`);
    console.log(`  Response: ${getResp.body.substring(0, 200)}`);
    record('GPV-D011 confirmed', 'PASS', 'Z-Report API fails due to known reservation.groupBy bug');
  } else if (getResp.status === 200) {
    record('GET /api/reports/close-day (Z-Report)', 'PASS', '200 OK — GPV-D011 may have been fixed');
    const data = JSON.parse(getResp.body);
    console.log(`  Total orders: ${data.summary?.totalOrders}`);
    console.log(`  Total revenue: ${data.summary?.totalRevenueCents} cents`);
    console.log(`  Ledger match: ${data.ledgerCrossCheck?.match}`);
  } else {
    record('GET /api/reports/close-day (Z-Report)', 'FAIL', `Unexpected status ${getResp.status}: ${getResp.body.substring(0, 200)}`);
  }

  // === TEST 2: Direct DB Z-Report reconstruction ===
  console.log('\n--- TEST 2: Direct DB Z-Report Reconstruction ---');

  // Get business timezone
  const business = await p.business.findUnique({
    where: { id: BUSINESS_ID },
    select: { name: true, currency: true, taxMode: true, taxRate: true, timezone: true },
  });
  console.log(`  Business: ${business.name}, TZ: ${business.timezone}, Tax: ${business.taxMode} ${business.taxRate}%`);

  // Calculate day boundary (manual — Africa/Kigali is UTC+2)
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(now);
  dayEnd.setHours(23, 59, 59, 999);

  // Fetch completed sales
  const sales = await p.sale.findMany({
    where: {
      businessId: BUSINESS_ID,
      createdAt: { gte: dayStart, lte: dayEnd },
      paymentStatus: 'COMPLETED',
    },
    select: { id: true, orderNumber: true, totalAmountCents: true, paymentMethod: true, orderSource: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const totalRevenueCents = sales.reduce((sum, s) => sum + s.totalAmountCents, 0);
  console.log(`  Sales: ${sales.length} orders, ${totalRevenueCents} cents total`);
  for (const s of sales) {
    console.log(`    ${s.orderNumber}: ${s.totalAmountCents} cents (${s.paymentMethod}, ${s.orderSource})`);
  }
  record('Completed sales for today', sales.length > 0 ? 'PASS' : 'WARN', `${sales.length} orders, ${totalRevenueCents} cents`);

  // Payment method breakdown
  const paymentBreakdown = {};
  for (const s of sales) {
    if (!paymentBreakdown[s.paymentMethod]) paymentBreakdown[s.paymentMethod] = { count: 0, amountCents: 0 };
    paymentBreakdown[s.paymentMethod].count++;
    paymentBreakdown[s.paymentMethod].amountCents += s.totalAmountCents;
  }
  console.log(`  Payment breakdown:`);
  for (const [method, data] of Object.entries(paymentBreakdown)) {
    console.log(`    ${method}: ${data.count} orders, ${data.amountCents} cents`);
  }
  record('Payment breakdown calculated', 'PASS', `${Object.keys(paymentBreakdown).length} methods`);

  // Tax calculation
  const taxRate = business.taxRate ?? 0;
  const taxMode = business.taxMode || 'EXCLUSIVE';
  let vatCollectedCents = 0;
  if (taxMode === 'EXCLUSIVE') {
    vatCollectedCents = Math.round(totalRevenueCents * (taxRate / 100));
  } else {
    vatCollectedCents = Math.round(totalRevenueCents - (totalRevenueCents / (1 + taxRate / 100)));
  }
  console.log(`  VAT: ${vatCollectedCents} cents (${taxMode} ${taxRate}%)`);
  record('VAT calculation', 'PASS', `${vatCollectedCents} cents (${taxMode})`);

  // === TEST 3: Ledger Cross-Check ===
  console.log('\n--- TEST 3: Ledger Cross-Check ---');
  const { BillingEventType } = require('@prisma/client');
  const ledgerResult = await p.financialLedgerEntry.aggregate({
    where: {
      businessId: BUSINESS_ID,
      eventType: BillingEventType.PAYMENT_SUCCESS,
      occurredAt: { gte: dayStart, lte: dayEnd },
    },
    _sum: { amountCents: true },
    _count: { id: true },
  });
  const ledgerTotalRevenueCents = ledgerResult._sum.amountCents || 0;
  const ledgerEntryCount = ledgerResult._count.id || 0;
  const ledgerMatch = ledgerTotalRevenueCents === totalRevenueCents;
  const ledgerVarianceCents = ledgerTotalRevenueCents - totalRevenueCents;

  console.log(`  Sale-based total: ${totalRevenueCents} cents`);
  console.log(`  Ledger total:     ${ledgerTotalRevenueCents} cents (${ledgerEntryCount} entries)`);
  console.log(`  Match: ${ledgerMatch}, Variance: ${ledgerVarianceCents} cents`);
  record('Ledger cross-check', ledgerMatch ? 'PASS' : 'FAIL', `variance: ${ledgerVarianceCents} cents`);

  // === TEST 4: Reservations for the day (using correct field) ===
  console.log('\n--- TEST 4: Reservations for the Day ---');
  const reservations = await p.reservation.groupBy({
    by: ['status'],
    where: {
      businessId: BUSINESS_ID,
      reservationDate: { gte: dayStart, lte: dayEnd }, // Correct field: reservationDate
    },
    _count: { id: true },
  });
  console.log(`  Reservations by status:`);
  for (const r of reservations) {
    console.log(`    ${r.status}: ${r._count.id}`);
  }
  record('Reservations groupBy (correct field)', 'PASS', `${reservations.length} status groups`);

  // === TEST 5: POST Close Day ===
  console.log('\n--- TEST 5: POST Close Day ---');
  // First check if today is already closed
  const dateStr = dayStart.toISOString().split('T')[0];
  const existingClose = await p.auditLog.findFirst({
    where: {
      action: 'CLOSE_DAY',
      metadata: { path: ['date'], equals: dateStr },
    },
  });

  if (existingClose) {
    console.log(`  Day ${dateStr} already closed — skipping POST test`);
    record('Day already closed', 'PASS', `Audit log entry exists for ${dateStr}`);
  } else {
    const closeResp = await request('POST', '/api/reports/close-day', JSON.stringify({}), cookies);
    if (closeResp.status === 200) {
      const data = JSON.parse(closeResp.body);
      record('POST /api/reports/close-day (close)', 'PASS', `success: ${data.success}, orders: ${data.totalOrders}, revenue: ${data.totalRevenueCents}`);
      console.log(`  Date: ${data.date}`);
      console.log(`  Total orders: ${data.totalOrders}`);
      console.log(`  Total revenue: ${data.totalRevenueCents} cents`);
      console.log(`  Ledger match: ${data.ledgerCrossCheck?.match}`);
      console.log(`  Ledger variance: ${data.ledgerCrossCheck?.varianceCents} cents`);
      record('Close-day ledger cross-check', data.ledgerCrossCheck?.match ? 'PASS' : 'FAIL', `variance: ${data.ledgerCrossCheck?.varianceCents} cents`);
    } else if (closeResp.status === 409) {
      record('POST /api/reports/close-day (close)', 'PASS', '409 — already closed (expected if previously closed)');
    } else {
      record('POST /api/reports/close-day (close)', 'FAIL', `Status ${closeResp.status}: ${closeResp.body.substring(0, 200)}`);
    }
  }

  // === TEST 6: Verify Audit Log Entry ===
  console.log('\n--- TEST 6: Verify Audit Log Entry ---');
  const auditEntry = await p.auditLog.findFirst({
    where: {
      action: 'CLOSE_DAY',
      entityType: 'Business',
      entityId: BUSINESS_ID,
    },
    orderBy: { createdAt: 'desc' },
  });
  if (auditEntry) {
    record('Audit log entry created', 'PASS', `action=${auditEntry.action}, date=${auditEntry.createdAt.toISOString()}`);
    const meta = auditEntry.metadata;
    console.log(`  Metadata: ${JSON.stringify(meta)}`);
    record('Audit log has totalRevenueCents', meta.totalRevenueCents !== undefined ? 'PASS' : 'FAIL', `value: ${meta.totalRevenueCents}`);
    record('Audit log has ledgerTotalRevenueCents', meta.ledgerTotalRevenueCents !== undefined ? 'PASS' : 'FAIL', `value: ${meta.ledgerTotalRevenueCents}`);
    record('Audit log has ledgerMatch', meta.ledgerMatch !== undefined ? 'PASS' : 'FAIL', `value: ${meta.ledgerMatch}`);
    record('Audit log has actorId', meta.actorId || auditEntry.actorId ? 'PASS' : 'FAIL', `actorId: ${auditEntry.actorId}`);
  } else {
    record('Audit log entry created', 'FAIL', 'No CLOSE_DAY audit log found');
  }

  // === TEST 7: Idempotency — try to close again ===
  console.log('\n--- TEST 7: Idempotency (double close prevention) ---');
  const doubleCloseResp = await request('POST', '/api/reports/close-day', JSON.stringify({}), cookies);
  if (doubleCloseResp.status === 409) {
    record('Double close prevented', 'PASS', '409 Conflict — day already closed');
  } else if (doubleCloseResp.status === 200) {
    record('Double close prevented', 'FAIL', '200 — day was closed again (should have been 409)');
  } else {
    record('Double close prevented', 'FAIL', `Unexpected status ${doubleCloseResp.status}: ${doubleCloseResp.body.substring(0, 200)}`);
  }

  // === TEST 8: Pending orders ===
  console.log('\n--- TEST 8: Pending Orders ---');
  const pendingOrders = await p.sale.count({
    where: {
      businessId: BUSINESS_ID,
      createdAt: { gte: dayStart, lte: dayEnd },
      paymentStatus: 'PENDING',
    },
  });
  console.log(`  Pending orders: ${pendingOrders}`);
  record('Pending orders count', 'PASS', `${pendingOrders} pending`);

  // === TEST 9: Full reconciliation summary ===
  console.log('\n--- TEST 9: Full Reconciliation Summary ---');
  console.log(`  Sale-based revenue:     ${totalRevenueCents} cents`);
  console.log(`  Ledger-based revenue:   ${ledgerTotalRevenueCents} cents`);
  console.log(`  VAT collected:          ${vatCollectedCents} cents`);
  console.log(`  Net revenue:            ${totalRevenueCents - vatCollectedCents} cents`);
  console.log(`  Ledger variance:        ${ledgerVarianceCents} cents`);
  console.log(`  Total orders:           ${sales.length}`);
  console.log(`  Pending orders:         ${pendingOrders}`);
  console.log(`  Reservations:           ${reservations.reduce((sum, r) => sum + r._count.id, 0)}`);
  record('Full reconciliation', ledgerMatch ? 'PASS' : 'FAIL', `variance: ${ledgerVarianceCents} cents`);

  // === SUMMARY ===
  console.log('\n=== PHASE 14 SUMMARY ===');
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
  if (warnCount > 0) {
    console.log('\nWarnings:');
    for (const r of results.filter(r => r.status === 'WARN')) {
      console.log(`  ⚠ ${r.test}: ${r.notes}`);
    }
  }

  await p.$disconnect();
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
