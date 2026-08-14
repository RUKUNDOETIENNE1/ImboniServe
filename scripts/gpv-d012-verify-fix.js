// GPV-D012 End-to-End Verification: Reservation Lifecycle Integrity
// Tests the actual API endpoints to verify that PATCH status changes
// now route through domain methods (confirmReservation, completeReservation, etc.)
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
  resp = await request('POST', '/api/auth/pre-login', JSON.stringify({ email: EMAIL, password: PASSWORD, debugRequestId: 'GPV-D012' }), allCookies);
  if (resp.status !== 200) throw new Error(`Pre-login failed: ${resp.body.substring(0, 200)}`);
  const newC1 = extractCookies(resp.cookies); if (newC1) allCookies += '; ' + newC1;
  await new Promise(r => setTimeout(r, 1500));
  const otp = await getOTP();
  if (!otp) throw new Error('No OTP found');
  resp = await request('POST', '/api/auth/verify-mfa-otp', JSON.stringify({ email: EMAIL, otp, debugRequestId: 'GPV-D012' }), allCookies);
  if (resp.status !== 200) throw new Error(`MFA verify failed: ${resp.body.substring(0, 200)}`);
  const newC2 = extractCookies(resp.cookies); if (newC2) allCookies += '; ' + newC2;
  const confirmToken = JSON.parse(resp.body).confirmToken;
  resp = await request('POST', '/api/auth/callback/mfa-confirm', `csrfToken=${csrfToken}&email=${EMAIL}&confirmToken=${confirmToken}&json=true`, allCookies, true);
  const newC3 = extractCookies(resp.cookies); if (newC3) allCookies += '; ' + newC3;
  return allCookies;
}

async function main() {
  console.log('=== GPV-D012 End-to-End Verification ===\n');

  const cookies = await getSession();
  console.log('Session established');

  // Get or create a table
  let table = await p.table.findFirst({ where: { businessId: BUSINESS_ID }, select: { id: true, number: true, status: true } });
  if (!table) {
    table = await p.table.create({ data: { businessId: BUSINESS_ID, number: 'D012-T', capacity: 4, status: 'AVAILABLE' } });
  }
  // Ensure table starts AVAILABLE
  await p.table.update({ where: { id: table.id }, data: { status: 'AVAILABLE' } });
  console.log(`Table: ${table.number} (${table.id}), reset to AVAILABLE`);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];

  // === TEST 1: Create reservation ===
  console.log('\n--- TEST 1: Create Reservation ---');
  const createResp = await request('POST', '/api/reservations', JSON.stringify({
    customerName: 'D012 Verify Guest',
    customerPhone: '+250788555666',
    date: dateStr,
    time: '19:30',
    partySize: 3,
  }), cookies);

  let resId = null;
  if (createResp.status === 201) {
    resId = JSON.parse(createResp.body).reservation.id;
    record('Create reservation', 'PASS', `ID: ${resId}`);
  } else {
    record('Create reservation', 'FAIL', `Status ${createResp.status}: ${createResp.body.substring(0, 200)}`);
    process.exit(1);
  }

  // === TEST 2: Assign table ===
  console.log('\n--- TEST 2: Assign Table ---');
  const assignResp = await request('PATCH', `/api/reservations/${resId}`, JSON.stringify({ tableId: table.id }), cookies);
  record('Assign table via PATCH', assignResp.status === 200 ? 'PASS' : 'FAIL', `Status ${assignResp.status}`);

  // Verify tableId in DB
  const dbRes = await p.reservation.findUnique({ where: { id: resId }, select: { tableId: true, status: true } });
  record('Table assigned in DB', dbRes?.tableId === table.id ? 'PASS' : 'FAIL', `tableId: ${dbRes?.tableId}`);

  // === TEST 3: Confirm reservation via PATCH (the critical test) ===
  console.log('\n--- TEST 3: Confirm via PATCH (GPV-D012 critical test) ---');
  const confirmResp = await request('PATCH', `/api/reservations/${resId}`, JSON.stringify({ status: 'CONFIRMED' }), cookies);
  record('PATCH status=CONFIRMED', confirmResp.status === 200 ? 'PASS' : 'FAIL', `Status ${confirmResp.status}: ${confirmResp.body.substring(0, 200)}`);

  // Verify confirmedAt is set (was null before fix)
  const confirmedRes = await p.reservation.findUnique({ where: { id: resId }, select: { status: true, confirmedAt: true, tableId: true } });
  record('Status is CONFIRMED', confirmedRes?.status === 'CONFIRMED' ? 'PASS' : 'FAIL', `actual: ${confirmedRes?.status}`);
  record('confirmedAt is set (was null before fix)', confirmedRes?.confirmedAt ? 'PASS' : 'FAIL', `confirmedAt: ${confirmedRes?.confirmedAt}`);

  // Verify table is RESERVED (was AVAILABLE before fix — THE CRITICAL INVARIANT)
  const confirmedTable = await p.table.findUnique({ where: { id: table.id }, select: { status: true, number: true } });
  console.log(`  Table ${confirmedTable.number} status: ${confirmedTable.status}`);
  record('Table is RESERVED (was AVAILABLE before fix)', confirmedTable.status === 'RESERVED' ? 'PASS' : 'FAIL', `actual: ${confirmedTable.status}`);

  // === TEST 4: Complete reservation via PATCH ===
  console.log('\n--- TEST 4: Complete via PATCH ---');
  const completeResp = await request('PATCH', `/api/reservations/${resId}`, JSON.stringify({ status: 'COMPLETED' }), cookies);
  record('PATCH status=COMPLETED', completeResp.status === 200 ? 'PASS' : 'FAIL', `Status ${completeResp.status}`);

  const completedRes = await p.reservation.findUnique({ where: { id: resId }, select: { status: true, completedAt: true, tableId: true } });
  record('Status is COMPLETED', completedRes?.status === 'COMPLETED' ? 'PASS' : 'FAIL', `actual: ${completedRes?.status}`);
  record('completedAt is set (was null before fix)', completedRes?.completedAt ? 'PASS' : 'FAIL', `completedAt: ${completedRes?.completedAt}`);

  // Verify table is released back to AVAILABLE
  const completedTable = await p.table.findUnique({ where: { id: table.id }, select: { status: true } });
  record('Table released to AVAILABLE on complete', completedTable.status === 'AVAILABLE' ? 'PASS' : 'FAIL', `actual: ${completedTable.status}`);

  // === TEST 5: Cancel via PATCH (new reservation) ===
  console.log('\n--- TEST 5: Cancel via PATCH ---');
  // Create + assign + confirm + cancel
  const cancelCreateResp = await request('POST', '/api/reservations', JSON.stringify({
    customerName: 'D012 Cancel Test',
    customerPhone: '+250788777888',
    date: dateStr,
    time: '20:00',
    partySize: 2,
  }), cookies);
  const cancelResId = JSON.parse(cancelCreateResp.body).reservation.id;

  await request('PATCH', `/api/reservations/${cancelResId}`, JSON.stringify({ tableId: table.id }), cookies);
  // Reset table to AVAILABLE for clean test
  await p.table.update({ where: { id: table.id }, data: { status: 'AVAILABLE' } });
  await request('PATCH', `/api/reservations/${cancelResId}`, JSON.stringify({ status: 'CONFIRMED' }), cookies);

  // Verify table is RESERVED after confirm
  const tableBeforeCancel = await p.table.findUnique({ where: { id: table.id }, select: { status: true } });
  record('Table RESERVED before cancel', tableBeforeCancel.status === 'RESERVED' ? 'PASS' : 'FAIL', `actual: ${tableBeforeCancel.status}`);

  // Now cancel via PATCH
  const cancelResp = await request('PATCH', `/api/reservations/${cancelResId}`, JSON.stringify({ status: 'CANCELLED', reason: 'GPV D012 test cancel' }), cookies);
  record('PATCH status=CANCELLED', cancelResp.status === 200 ? 'PASS' : 'FAIL', `Status ${cancelResp.status}`);

  const cancelledRes = await p.reservation.findUnique({ where: { id: cancelResId }, select: { status: true } });
  record('Status is CANCELLED', cancelledRes?.status === 'CANCELLED' ? 'PASS' : 'FAIL', `actual: ${cancelledRes?.status}`);

  // Verify table is released
  const tableAfterCancel = await p.table.findUnique({ where: { id: table.id }, select: { status: true } });
  record('Table released to AVAILABLE on cancel', tableAfterCancel.status === 'AVAILABLE' ? 'PASS' : 'FAIL', `actual: ${tableAfterCancel.status}`);

  // === TEST 6: No-show via PATCH ===
  console.log('\n--- TEST 6: No-Show via PATCH ---');
  const noshowCreateResp = await request('POST', '/api/reservations', JSON.stringify({
    customerName: 'D012 NoShow Test',
    customerPhone: '+250788999000',
    date: dateStr,
    time: '21:00',
    partySize: 1,
  }), cookies);
  const noshowResId = JSON.parse(noshowCreateResp.body).reservation.id;

  await request('PATCH', `/api/reservations/${noshowResId}`, JSON.stringify({ tableId: table.id }), cookies);
  await p.table.update({ where: { id: table.id }, data: { status: 'AVAILABLE' } });
  await request('PATCH', `/api/reservations/${noshowResId}`, JSON.stringify({ status: 'CONFIRMED' }), cookies);

  const noshowResp = await request('PATCH', `/api/reservations/${noshowResId}`, JSON.stringify({
    status: 'NO_SHOW',
    forfeitCents: 5000,
    reason: 'Did not arrive',
  }), cookies);
  record('PATCH status=NO_SHOW', noshowResp.status === 200 ? 'PASS' : 'FAIL', `Status ${noshowResp.status}: ${noshowResp.body.substring(0, 200)}`);

  const noshowRes = await p.reservation.findUnique({ where: { id: noshowResId }, select: { status: true, forfeitCents: true, noShowReason: true } });
  record('Status is NO_SHOW', noshowRes?.status === 'NO_SHOW' ? 'PASS' : 'FAIL', `actual: ${noshowRes?.status}`);
  record('forfeitCents set', noshowRes?.forfeitCents === 5000 ? 'PASS' : 'FAIL', `actual: ${noshowRes?.forfeitCents}`);
  record('noShowReason set', noshowRes?.noShowReason === 'Did not arrive' ? 'PASS' : 'FAIL', `actual: ${noshowRes?.noShowReason}`);

  const tableAfterNoShow = await p.table.findUnique({ where: { id: table.id }, select: { status: true } });
  record('Table released on no-show', tableAfterNoShow.status === 'AVAILABLE' ? 'PASS' : 'FAIL', `actual: ${tableAfterNoShow.status}`);

  // === TEST 7: Idempotency — confirm already-confirmed ===
  console.log('\n--- TEST 7: Idempotency ---');
  const idempCreateResp = await request('POST', '/api/reservations', JSON.stringify({
    customerName: 'D012 Idempotency Test',
    customerPhone: '+250788111222',
    date: dateStr,
    time: '22:00',
    partySize: 2,
  }), cookies);
  const idempResId = JSON.parse(idempCreateResp.body).reservation.id;

  // Confirm first time
  await request('PATCH', `/api/reservations/${idempResId}`, JSON.stringify({ status: 'CONFIRMED' }), cookies);
  const firstConfirm = await p.reservation.findUnique({ where: { id: idempResId }, select: { confirmedAt: true } });
  const firstConfirmedAt = firstConfirm.confirmedAt;

  // Wait a moment
  await new Promise(r => setTimeout(r, 100));

  // Confirm second time — should be idempotent
  const secondConfirmResp = await request('PATCH', `/api/reservations/${idempResId}`, JSON.stringify({ status: 'CONFIRMED' }), cookies);
  record('Second confirm returns 200 (idempotent)', secondConfirmResp.status === 200 ? 'PASS' : 'FAIL', `Status ${secondConfirmResp.status}`);

  const secondConfirm = await p.reservation.findUnique({ where: { id: idempResId }, select: { confirmedAt: true } });
  record('confirmedAt unchanged on second confirm', secondConfirm.confirmedAt?.getTime() === firstConfirmedAt?.getTime() ? 'PASS' : 'FAIL', `first: ${firstConfirmedAt}, second: ${secondConfirm.confirmedAt}`);

  // === TEST 8: Invalid status rejected ===
  console.log('\n--- TEST 8: Invalid Status Rejected ---');
  const invalidResp = await request('PATCH', `/api/reservations/${idempResId}`, JSON.stringify({ status: 'INVALID_STATUS' }), cookies);
  record('Invalid status rejected with 400', invalidResp.status === 400 ? 'PASS' : 'FAIL', `Status ${invalidResp.status}: ${invalidResp.body.substring(0, 100)}`);

  // === TEST 9: Cancelled reservation cannot be confirmed ===
  console.log('\n--- TEST 9: Cancelled Cannot Be Confirmed ---');
  // Cancel the idempotency test reservation
  await request('PATCH', `/api/reservations/${idempResId}`, JSON.stringify({ status: 'CANCELLED' }), cookies);

  // Try to confirm — should fail
  const confirmCancelledResp = await request('PATCH', `/api/reservations/${idempResId}`, JSON.stringify({ status: 'CONFIRMED' }), cookies);
  record('Confirm on cancelled reservation rejected', confirmCancelledResp.status === 409 ? 'PASS' : 'FAIL', `Status ${confirmCancelledResp.status}: ${confirmCancelledResp.body.substring(0, 100)}`);

  // === SUMMARY ===
  console.log('\n=== GPV-D012 VERIFICATION SUMMARY ===');
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  console.log(`PASS: ${passCount}, FAIL: ${failCount}`);

  if (failCount > 0) {
    console.log('\nFailed tests:');
    for (const r of results.filter(r => r.status === 'FAIL')) {
      console.log(`  ✗ ${r.test}: ${r.notes}`);
    }
  }

  // Reset table to AVAILABLE
  await p.table.update({ where: { id: table.id }, data: { status: 'AVAILABLE' } });
  await p.$disconnect();
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
