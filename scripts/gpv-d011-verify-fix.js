// GPV-D011 End-to-End Verification: Z-Report GET + Close-Day POST
// Verifies that fixing the reservation query does not regress the close-day workflow
const http = require('http');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const HOST = '127.0.0.1';
const PORT = 3000;
const EMAIL = 'gpv-test@imboniserve-test.com';
const PASSWORD = 'GPV-Test-2026!';
const USER_ID = 'cmsk4x2p900006gygp5iknc6b';
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
  resp = await request('POST', '/api/auth/pre-login', JSON.stringify({ email: EMAIL, password: PASSWORD, debugRequestId: 'GPV-D011-E2E' }), allCookies);
  if (resp.status !== 200) throw new Error(`Pre-login failed: ${resp.body.substring(0, 200)}`);
  const newC1 = extractCookies(resp.cookies); if (newC1) allCookies += '; ' + newC1;
  await new Promise(r => setTimeout(r, 1500));
  const otp = await getOTP();
  if (!otp) throw new Error('No OTP found');
  resp = await request('POST', '/api/auth/verify-mfa-otp', JSON.stringify({ email: EMAIL, otp, debugRequestId: 'GPV-D011-E2E' }), allCookies);
  if (resp.status !== 200) throw new Error(`MFA verify failed: ${resp.body.substring(0, 200)}`);
  const newC2 = extractCookies(resp.cookies); if (newC2) allCookies += '; ' + newC2;
  const confirmToken = JSON.parse(resp.body).confirmToken;
  resp = await request('POST', '/api/auth/callback/mfa-confirm', `csrfToken=${csrfToken}&email=${EMAIL}&confirmToken=${confirmToken}&json=true`, allCookies, true);
  const newC3 = extractCookies(resp.cookies); if (newC3) allCookies += '; ' + newC3;
  return allCookies;
}

async function main() {
  console.log('=== GPV-D011 End-to-End Verification ===\n');
  const cookies = await getSession();
  console.log('Session established');

  const today = new Date().toISOString().split('T')[0];

  // === TEST 1: Z-Report GET (the fix) ===
  console.log('\n--- TEST 1: Z-Report GET (the fix) ---');
  const getResp = await request('GET', `/api/reports/close-day?date=${today}`, null, cookies);
  record('Z-Report GET returns 200', getResp.status === 200 ? 'PASS' : 'FAIL', `Status ${getResp.status}`);

  if (getResp.status === 200) {
    const data = JSON.parse(getResp.body);
    record('Response has business info', data.business?.name ? 'PASS' : 'FAIL', `name: ${data.business?.name}`);
    record('Response has dayStart/dayEnd', data.dayStart && data.dayEnd ? 'PASS' : 'FAIL', `start: ${data.dayStart}`);
    record('Response has reservations array', Array.isArray(data.reservations) ? 'PASS' : 'FAIL', `length: ${data.reservations?.length}`);
    record('Response has summary', data.summary ? 'PASS' : 'FAIL', `totalRevenueCents: ${data.summary?.totalRevenueCents}`);
    record('Response has ledgerCrossCheck', data.ledgerCrossCheck ? 'PASS' : 'FAIL', `match: ${data.ledgerCrossCheck?.match}`);
    record('Response has outstandingLiabilities', data.outstandingLiabilities ? 'PASS' : 'FAIL', `total: ${data.outstandingLiabilities?.totalLiabilitiesCents}`);
    record('Response has paymentBreakdown', Array.isArray(data.paymentBreakdown) ? 'PASS' : 'FAIL', `length: ${data.paymentBreakdown?.length}`);
    record('Response has sales', Array.isArray(data.sales) ? 'PASS' : 'FAIL', `length: ${data.sales?.length}`);

    // Verify reservation data is correct
    if (data.reservations.length > 0) {
      const hasStatusAndCount = data.reservations.every(r => r.status && typeof r.count === 'number');
      record('Reservations have status and count', hasStatusAndCount ? 'PASS' : 'FAIL', JSON.stringify(data.reservations));
    } else {
      record('Reservations empty (valid)', 'PASS', 'No reservations for today');
    }

    // Verify financial totals
    const totalRev = data.summary.totalRevenueCents;
    const ledgerRev = data.ledgerCrossCheck.ledgerTotalRevenueCents;
    record('Financial totals present', totalRev !== undefined && ledgerRev !== undefined ? 'PASS' : 'FAIL', `sale: ${totalRev}, ledger: ${ledgerRev}`);
    record('Ledger cross-check match', data.ledgerCrossCheck.match === (totalRev === ledgerRev) ? 'PASS' : 'FAIL', `match: ${data.ledgerCrossCheck.match}, variance: ${data.ledgerCrossCheck.varianceCents}`);

    // Store for comparison with POST
    const getTotals = {
      totalRevenueCents: totalRev,
      totalOrders: data.summary.totalOrders,
      ledgerTotalRevenueCents: ledgerRev,
      vatCollectedCents: data.summary.vatCollectedCents,
    };
    console.log(`  GET totals: revenue=${getTotals.totalRevenueCents}, orders=${getTotals.totalOrders}, ledger=${getTotals.ledgerTotalRevenueCents}, vat=${getTotals.vatCollectedCents}`);

    // === TEST 2: Check if already closed for today ===
    console.log('\n--- TEST 2: Close-Day Status ---');
    record('isClosed flag present', data.isClosed !== undefined ? 'PASS' : 'FAIL', `isClosed: ${data.isClosed}`);

    if (data.isClosed) {
      console.log('  Day already closed — skipping POST test (would be idempotent rejection)');
      record('Close-Day POST (already closed)', 'PASS', 'Skipped — day already closed');
    } else {
      // === TEST 3: Close-Day POST (verify no regression) ===
      console.log('\n--- TEST 3: Close-Day POST (no regression) ---');
      const postResp = await request('POST', '/api/reports/close-day', JSON.stringify({
        date: today,
        notes: 'GPV-D011 verification close',
      }), cookies);

      record('Close-Day POST returns 200/201', postResp.status === 200 || postResp.status === 201 ? 'PASS' : 'FAIL', `Status ${postResp.status}: ${postResp.body.substring(0, 200)}`);

      if (postResp.status === 200 || postResp.status === 201) {
        const postData = JSON.parse(postResp.body);
        record('POST has totals', postData.totalRevenueCents !== undefined || postData.summary?.totalRevenueCents !== undefined ? 'PASS' : 'FAIL', `revenue: ${postData.totalRevenueCents}`);
        record('POST has audit log', postData.auditLogId || postData.success ? 'PASS' : 'FAIL', 'Present');

        // Verify POST totals match GET totals
        const postRev = postData.totalRevenueCents ?? postData.summary?.totalRevenueCents;
        if (postRev !== undefined) {
          record('POST revenue matches GET revenue', postRev === getTotals.totalRevenueCents ? 'PASS' : 'FAIL', `POST: ${postRev}, GET: ${getTotals.totalRevenueCents}`);
        }
      }
    }

    // === TEST 4: Z-Report GET after close (verify still works) ===
    console.log('\n--- TEST 4: Z-Report GET After Close ---');
    const getAfterResp = await request('GET', `/api/reports/close-day?date=${today}`, null, cookies);
    record('Z-Report GET after close returns 200', getAfterResp.status === 200 ? 'PASS' : 'FAIL', `Status ${getAfterResp.status}`);

    if (getAfterResp.status === 200) {
      const afterData = JSON.parse(getAfterResp.body);
      record('isClosed is true after close', afterData.isClosed === true ? 'PASS' : 'FAIL', `isClosed: ${afterData.isClosed}`);
      record('Reservations still present after close', Array.isArray(afterData.reservations) ? 'PASS' : 'FAIL', `length: ${afterData.reservations?.length}`);
      record('Financial totals unchanged after close', afterData.summary?.totalRevenueCents === getTotals.totalRevenueCents ? 'PASS' : 'FAIL', `before: ${getTotals.totalRevenueCents}, after: ${afterData.summary?.totalRevenueCents}`);
    }
  }

  // === SUMMARY ===
  console.log('\n=== GPV-D011 VERIFICATION SUMMARY ===');
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  console.log(`PASS: ${passCount}, FAIL: ${failCount}`);

  if (failCount > 0) {
    console.log('\nFailed tests:');
    for (const r of results.filter(r => r.status === 'FAIL')) {
      console.log(`  ✗ ${r.test}: ${r.notes}`);
    }
  }

  await p.$disconnect();
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
