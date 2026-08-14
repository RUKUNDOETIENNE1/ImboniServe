// GPV-001 Phase 9: Reservation Verification
// Tests: create, list, status transitions, table linkage, customer auto-creation, close-day link
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
  const record = await p.userLoginOtp.findFirst({
    where: { userId: USER_ID, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
    select: { hashedOtp: true },
  });
  if (!record) return null;
  for (let i = 100000; i <= 999999; i++) {
    if (hashOTP(i.toString()) === record.hashedOtp) return i.toString();
  }
  return null;
}

async function getSession() {
  let resp = await request('GET', '/api/auth/csrf');
  let allCookies = extractCookies(resp.cookies);
  const csrfToken = JSON.parse(resp.body).csrfToken;

  resp = await request('POST', '/api/auth/pre-login', JSON.stringify({ email: EMAIL, password: PASSWORD, debugRequestId: 'GPV-P9' }), allCookies);
  if (resp.status !== 200) throw new Error(`Pre-login failed: ${resp.body}`);
  const newC1 = extractCookies(resp.cookies); if (newC1) allCookies += '; ' + newC1;

  await new Promise(r => setTimeout(r, 1500));
  const otp = await getOTP();
  if (!otp) throw new Error('No OTP found');

  resp = await request('POST', '/api/auth/verify-mfa-otp', JSON.stringify({ email: EMAIL, otp, debugRequestId: 'GPV-P9' }), allCookies);
  if (resp.status !== 200) throw new Error(`MFA verify failed: ${resp.body}`);
  const newC2 = extractCookies(resp.cookies); if (newC2) allCookies += '; ' + newC2;
  const confirmToken = JSON.parse(resp.body).confirmToken;

  resp = await request('POST', '/api/auth/callback/mfa-confirm', `csrfToken=${csrfToken}&email=${EMAIL}&confirmToken=${confirmToken}&json=true`, allCookies, true);
  const newC3 = extractCookies(resp.cookies); if (newC3) allCookies += '; ' + newC3;
  return allCookies;
}

async function main() {
  console.log('=== GPV-001 Phase 9: Reservation Verification ===\n');

  // Get a table for testing
  const tables = await p.table.findMany({ where: { businessId: BUSINESS_ID }, select: { id: true, number: true, status: true, capacity: true } });
  console.log(`Tables available: ${tables.length}`);
  for (const t of tables) console.log(`  Table ${t.number}: status=${t.status}, capacity=${t.capacity}`);

  const testTable = tables[0];
  if (!testTable) {
    console.log('No tables found — creating one...');
    const newTable = await p.table.create({
      data: { businessId: BUSINESS_ID, number: 'GPV-9', capacity: 4, status: 'AVAILABLE' }
    });
    testTable.id = newTable.id;
    testTable.number = newTable.number;
    testTable.status = 'AVAILABLE';
  }

  // Authenticate
  console.log('\n--- Authenticating ---');
  const cookies = await getSession();
  console.log('Session established');

  // === TEST 1: Create Reservation ===
  console.log('\n--- TEST 1: Create Reservation ---');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];

  const createResp = await request('POST', '/api/reservations', JSON.stringify({
    customerName: 'GPV Test Guest',
    customerPhone: '+250788123456',
    customerEmail: 'guest@gpv-test.com',
    date: dateStr,
    time: '19:00',
    partySize: 4,
    specialRequests: 'Window table please',
  }), cookies);

  let reservationId = null;
  let confirmationCode = null;
  if (createResp.status === 201) {
    const data = JSON.parse(createResp.body);
    reservationId = data.reservation.id;
    confirmationCode = data.reservation.confirmationCode || 'N/A';
    record('POST /api/reservations (create)', 'PASS', `201 Created — ID: ${reservationId}`);
    console.log(`  Reservation ID: ${reservationId}`);
    console.log(`  Customer: ${data.reservation.customerName}`);
    console.log(`  Date: ${data.reservation.date}`);
    console.log(`  Time: ${data.reservation.time}`);
    console.log(`  Party size: ${data.reservation.partySize}`);
    console.log(`  Status: ${data.reservation.status}`);
  } else if (createResp.status === 402) {
    record('POST /api/reservations (create)', 'FAIL', `402 Payment Required — feature not available: ${createResp.body}`);
    console.log('  Reservations feature not available on current plan. Cannot proceed.');
    console.log('\n=== PHASE 9 BLOCKED: hasReservations feature not accessible ===');
    await p.$disconnect();
    process.exit(1);
  } else {
    record('POST /api/reservations (create)', 'FAIL', `Status ${createResp.status}: ${createResp.body.substring(0, 200)}`);
  }

  // === TEST 2: Verify DB state ===
  console.log('\n--- TEST 2: Verify DB State ---');
  if (reservationId) {
    const dbRes = await p.reservation.findUnique({
      where: { id: reservationId },
      include: { customer: true, table: true }
    });
    if (dbRes) {
      record('Reservation in DB', 'PASS', `status=${dbRes.status}, confirmationCode=${dbRes.confirmationCode}`);
      record('Confirmation code generated', dbRes.confirmationCode ? 'PASS' : 'FAIL', dbRes.confirmationCode || 'missing');
      record('Status is PENDING', dbRes.status === 'PENDING' ? 'PASS' : 'FAIL', `actual: ${dbRes.status}`);
      record('Party size correct', dbRes.partySize === 4 ? 'PASS' : 'FAIL', `actual: ${dbRes.partySize}`);
      record('Customer auto-created', dbRes.customerId ? 'PASS' : 'FAIL', `customerId: ${dbRes.customerId}`);
      if (dbRes.customer) {
        record('Customer name correct', dbRes.customer.name === 'GPV Test Guest' ? 'PASS' : 'FAIL', `actual: ${dbRes.customer.name}`);
      }
      record('reservedAt computed', dbRes.reservedAt ? 'PASS' : 'FAIL', `reservedAt: ${dbRes.reservedAt}`);
    } else {
      record('Reservation in DB', 'FAIL', 'Not found');
    }
  }

  // === TEST 3: List Reservations ===
  console.log('\n--- TEST 3: List Reservations ---');
  const listResp = await request('GET', '/api/reservations', null, cookies);
  if (listResp.status === 200) {
    const data = JSON.parse(listResp.body);
    const found = (data.reservations || []).find(r => r.id === reservationId);
    record('GET /api/reservations (list)', 'PASS', `${data.reservations.length} reservations returned`);
    record('Created reservation in list', found ? 'PASS' : 'FAIL', found ? `found: ${found.customerName}` : 'not found');
  } else {
    record('GET /api/reservations (list)', 'FAIL', `Status ${listResp.status}`);
  }

  // === TEST 4: Assign Table ===
  console.log('\n--- TEST 4: Assign Table ---');
  if (reservationId && testTable) {
    const patchResp = await request('PATCH', `/api/reservations/${reservationId}`, JSON.stringify({
      tableId: testTable.id,
    }), cookies);
    if (patchResp.status === 200) {
      record('PATCH /api/reservations/[id] (assign table)', 'PASS', `Table ${testTable.number} assigned`);
    } else {
      record('PATCH /api/reservations/[id] (assign table)', 'FAIL', `Status ${patchResp.status}: ${patchResp.body.substring(0, 200)}`);
    }

    // Verify table assigned in DB
    const dbRes = await p.reservation.findUnique({ where: { id: reservationId }, select: { tableId: true } });
    record('Table assigned in DB', dbRes?.tableId === testTable.id ? 'PASS' : 'FAIL', `tableId: ${dbRes?.tableId}`);
  }

  // === TEST 5: Confirm Reservation ===
  console.log('\n--- TEST 5: Confirm Reservation ---');
  if (reservationId) {
    const confirmResp = await request('PATCH', `/api/reservations/${reservationId}`, JSON.stringify({
      status: 'CONFIRMED',
    }), cookies);
    if (confirmResp.status === 200) {
      record('PATCH /api/reservations/[id] (confirm)', 'PASS', 'Status set to CONFIRMED');
    } else {
      record('PATCH /api/reservations/[id] (confirm)', 'FAIL', `Status ${confirmResp.status}: ${confirmResp.body.substring(0, 200)}`);
    }

    // Verify status in DB
    const dbRes = await p.reservation.findUnique({ where: { id: reservationId }, select: { status: true, confirmedAt: true, tableId: true } });
    record('Status is CONFIRMED', dbRes?.status === 'CONFIRMED' ? 'PASS' : 'FAIL', `actual: ${dbRes?.status}`);
    record('confirmedAt set', dbRes?.confirmedAt ? 'PASS' : 'FAIL', `confirmedAt: ${dbRes?.confirmedAt}`);

    // CRITICAL: Check if table status was updated to RESERVED
    // The PATCH endpoint calls updateStatus() directly, NOT confirmReservation()
    // confirmReservation() would auto-set table to RESERVED, but updateStatus() does not
    if (dbRes?.tableId) {
      const table = await p.table.findUnique({ where: { id: dbRes.tableId }, select: { status: true, number: true } });
      console.log(`  Table ${table.number} status after confirm: ${table.status}`);
      if (table.status === 'RESERVED') {
        record('Table auto-reserved on confirm', 'PASS', `Table ${table.number} is RESERVED`);
      } else {
        record('Table auto-reserved on confirm', 'FAIL', `Table ${table.number} is ${table.status} (expected RESERVED) — PATCH uses updateStatus() not confirmReservation()`);
      }
    }
  }

  // === TEST 6: Complete Reservation ===
  console.log('\n--- TEST 6: Complete Reservation ---');
  if (reservationId) {
    const completeResp = await request('PATCH', `/api/reservations/${reservationId}`, JSON.stringify({
      status: 'COMPLETED',
    }), cookies);
    if (completeResp.status === 200) {
      record('PATCH /api/reservations/[id] (complete)', 'PASS', 'Status set to COMPLETED');
    } else {
      record('PATCH /api/reservations/[id] (complete)', 'FAIL', `Status ${completeResp.status}: ${completeResp.body.substring(0, 200)}`);
    }

    const dbRes = await p.reservation.findUnique({ where: { id: reservationId }, select: { status: true, completedAt: true, tableId: true } });
    record('Status is COMPLETED', dbRes?.status === 'COMPLETED' ? 'PASS' : 'FAIL', `actual: ${dbRes?.status}`);
    record('completedAt set', dbRes?.completedAt ? 'PASS' : 'FAIL', `completedAt: ${dbRes?.completedAt}`);

    // Check if table was released
    if (dbRes?.tableId) {
      const table = await p.table.findUnique({ where: { id: dbRes.tableId }, select: { status: true, number: true } });
      console.log(`  Table ${table.number} status after complete: ${table.status}`);
      if (table.status === 'AVAILABLE') {
        record('Table released on complete', 'PASS', `Table ${table.number} is AVAILABLE`);
      } else {
        record('Table released on complete', 'FAIL', `Table ${table.number} is ${table.status} (expected AVAILABLE)`);
      }
    }
  }

  // === TEST 7: Create + Cancel via dedicated endpoint ===
  console.log('\n--- TEST 7: Cancel via dedicated endpoint ---');
  const cancelCreateResp = await request('POST', '/api/reservations', JSON.stringify({
    customerName: 'GPV Cancel Test',
    customerPhone: '+250788654321',
    date: dateStr,
    time: '20:00',
    partySize: 2,
  }), cookies);

  if (cancelCreateResp.status === 201) {
    const cancelData = JSON.parse(cancelCreateResp.body);
    const cancelResId = cancelData.reservation.id;
    record('Create reservation for cancel test', 'PASS', `ID: ${cancelResId}`);

    // Assign table
    await request('PATCH', `/api/reservations/${cancelResId}`, JSON.stringify({ tableId: testTable.id }), cookies);
    // Confirm
    await request('PATCH', `/api/reservations/${cancelResId}`, JSON.stringify({ status: 'CONFIRMED' }), cookies);

    // Cancel via dedicated endpoint
    const cancelResp = await request('POST', `/api/reservations/${cancelResId}/cancel`, JSON.stringify({
      reason: 'GPV test cancellation',
    }), cookies);
    if (cancelResp.status === 200) {
      record('POST /api/reservations/[id]/cancel', 'PASS', 'Cancelled successfully');
    } else {
      record('POST /api/reservations/[id]/cancel', 'FAIL', `Status ${cancelResp.status}: ${cancelResp.body.substring(0, 200)}`);
    }

    // Verify cancelled in DB
    const dbRes = await p.reservation.findUnique({ where: { id: cancelResId }, select: { status: true, tableId: true } });
    record('Status is CANCELLED', dbRes?.status === 'CANCELLED' ? 'PASS' : 'FAIL', `actual: ${dbRes?.status}`);

    // Check if table was released (cancelReservation releases the table)
    if (dbRes?.tableId) {
      const table = await p.table.findUnique({ where: { id: dbRes.tableId }, select: { status: true, number: true } });
      console.log(`  Table ${table.number} status after cancel: ${table.status}`);
      if (table.status === 'AVAILABLE') {
        record('Table released on cancel (dedicated endpoint)', 'PASS', `Table ${table.number} is AVAILABLE`);
      } else {
        record('Table released on cancel (dedicated endpoint)', 'FAIL', `Table ${table.number} is ${table.status} (expected AVAILABLE)`);
      }
    }
  } else {
    record('Create reservation for cancel test', 'FAIL', `Status ${cancelCreateResp.status}`);
  }

  // === TEST 8: Reservation in close-day context ===
  console.log('\n--- TEST 8: Reservation in Close-Day Context ---');
  const todayRes = await p.reservation.findMany({
    where: { businessId: BUSINESS_ID },
    select: { id: true, status: true, reservationDate: true, partySize: true, customerName: true },
  });
  console.log(`  Total reservations in DB: ${todayRes.length}`);
  for (const r of todayRes) {
    console.log(`  ${r.id}: status=${r.status}, partySize=${r.partySize}, customer=${r.customerName}, date=${r.reservationDate.toISOString().split('T')[0]}`);
  }
  record('Reservations exist for close-day', todayRes.length > 0 ? 'PASS' : 'WARN', `${todayRes.length} reservations`);

  // === TEST 9: Commercial policy check ===
  console.log('\n--- TEST 9: Commercial Policy ---');
  const business = await p.business.findUnique({
    where: { id: BUSINESS_ID },
    select: { planId: true, trialEndDate: true, plan: { select: { code: true } } },
  });
  console.log(`  Plan: ${business.plan.code}`);
  console.log(`  Trial end: ${business.trialEndDate}`);
  console.log(`  In trial: ${business.trialEndDate && new Date() < business.trialEndDate}`);
  record('Trial active (enables PROFESSIONAL features)', business.trialEndDate && new Date() < business.trialEndDate ? 'PASS' : 'FAIL', `trial ends: ${business.trialEndDate}`);

  // === SUMMARY ===
  console.log('\n=== PHASE 9 SUMMARY ===');
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
