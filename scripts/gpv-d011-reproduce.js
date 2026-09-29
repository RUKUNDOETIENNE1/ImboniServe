// GPV-D011 Reproduction: Z-Report GET endpoint defect
// Reproduces the bug where reservation.groupBy uses invalid `date` field
const http = require('http');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const HOST = '127.0.0.1';
const PORT = 3000;
const EMAIL = 'gpv-test@imboniserve-test.com';
const PASSWORD = 'GPV-Test-2026!';
const USER_ID = 'cmsk4x2p900006gygp5iknc6b';
const p = new PrismaClient();

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
  resp = await request('POST', '/api/auth/pre-login', JSON.stringify({ email: EMAIL, password: PASSWORD, debugRequestId: 'GPV-D011' }), allCookies);
  if (resp.status !== 200) throw new Error(`Pre-login failed: ${resp.body.substring(0, 200)}`);
  const newC1 = extractCookies(resp.cookies); if (newC1) allCookies += '; ' + newC1;
  await new Promise(r => setTimeout(r, 1500));
  const otp = await getOTP();
  if (!otp) throw new Error('No OTP found');
  resp = await request('POST', '/api/auth/verify-mfa-otp', JSON.stringify({ email: EMAIL, otp, debugRequestId: 'GPV-D011' }), allCookies);
  if (resp.status !== 200) throw new Error(`MFA verify failed: ${resp.body.substring(0, 200)}`);
  const newC2 = extractCookies(resp.cookies); if (newC2) allCookies += '; ' + newC2;
  const confirmToken = JSON.parse(resp.body).confirmToken;
  resp = await request('POST', '/api/auth/callback/mfa-confirm', `csrfToken=${csrfToken}&email=${EMAIL}&confirmToken=${confirmToken}&json=true`, allCookies, true);
  const newC3 = extractCookies(resp.cookies); if (newC3) allCookies += '; ' + newC3;
  return allCookies;
}

async function main() {
  console.log('=== GPV-D011 Reproduction: Z-Report GET ===\n');
  const cookies = await getSession();
  console.log('Session established');

  // Call Z-Report GET endpoint
  const today = new Date().toISOString().split('T')[0];
  const resp = await request('GET', `/api/reports/close-day?date=${today}`, null, cookies);

  console.log(`\nGET /api/reports/close-day?date=${today}`);
  console.log(`Status: ${resp.status}`);

  if (resp.status === 500) {
    console.log('DEFECT REPRODUCED: Z-Report GET returns 500');
    console.log(`Body: ${resp.body.substring(0, 500)}`);

    // Check server logs for the error
    const body = JSON.parse(resp.body);
    console.log(`\nError: ${body.error || body.message || 'Unknown'}`);
  } else if (resp.status === 200) {
    console.log('Z-Report GET returns 200 — no defect');
    const data = JSON.parse(resp.body);
    console.log(`Reservations in report: ${JSON.stringify(data.reservations || data.summary?.reservations || 'N/A')}`);
  } else {
    console.log(`Unexpected status: ${resp.status}`);
    console.log(`Body: ${resp.body.substring(0, 500)}`);
  }

  await p.$disconnect();
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
