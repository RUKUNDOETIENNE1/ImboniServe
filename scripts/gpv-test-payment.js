// GPV Payment Confirmation Test
const http = require('http');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const p = new PrismaClient();

const EMAIL = 'gpv-test@imboniserve-test.com';
const PASSWORD = 'GPV-Test-2026!';
const HOST = '127.0.0.1';
const PORT = 3000;
const USER_ID = 'cmsk4x2p900006gygp5iknc6b';
const ORDER_ID = 'cmsk9r3nh001ecwhftmyhepts';

function request(method, path, body, cookies, isForm) {
  return new Promise((resolve, reject) => {
    const headers = {};
    headers['Content-Type'] = isForm ? 'application/x-www-form-urlencoded' : 'application/json';
    if (cookies) headers['Cookie'] = cookies;
    if (body) headers['Content-Length'] = Buffer.byteLength(body);
    const req = http.request({ hostname: HOST, port: PORT, path, method, headers }, (res) => {
      let chunks = '';
      res.on('data', d => chunks += d);
      res.on('end', () => resolve({ status: res.statusCode, body: chunks, cookies: res.headers['set-cookie'] }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function extractCookies(setCookies) {
  if (!setCookies) return '';
  return setCookies.map(c => c.split(';')[0]).join('; ');
}

function hashOTP(otp) { return crypto.createHash('sha256').update(otp + (process.env.NEXTAUTH_SECRET || '')).digest('hex'); }

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
  // Step 1: CSRF
  let resp = await request('GET', '/api/auth/csrf');
  let allCookies = extractCookies(resp.cookies);
  const csrfToken = JSON.parse(resp.body).csrfToken;

  // Step 2: Pre-login
  resp = await request('POST', '/api/auth/pre-login', JSON.stringify({ email: EMAIL, password: PASSWORD, debugRequestId: 'GPV-PAYMENT' }), allCookies);
  const newCookies1 = extractCookies(resp.cookies);
  if (newCookies1) allCookies += '; ' + newCookies1;

  // Step 3: OTP
  const otp = await getOTP();
  resp = await request('POST', '/api/auth/verify-mfa-otp', JSON.stringify({ email: EMAIL, otp, debugRequestId: 'GPV-PAYMENT' }), allCookies);
  const newCookies2 = extractCookies(resp.cookies);
  if (newCookies2) allCookies += '; ' + newCookies2;
  const confirmToken = JSON.parse(resp.body).confirmToken;

  // Step 4: Session creation
  resp = await request('POST', '/api/auth/callback/mfa-confirm', `csrfToken=${csrfToken}&email=${EMAIL}&confirmToken=${confirmToken}&json=true`, allCookies, true);
  const newCookies3 = extractCookies(resp.cookies);
  if (newCookies3) allCookies += '; ' + newCookies3;

  // Verify session
  resp = await request('GET', '/api/auth/session', null, allCookies);
  console.log('Session check:', resp.status, resp.body.substring(0, 200));

  return allCookies;
}

async function main() {
  const cookies = await getSession();
  console.log('Session established');

  // Confirm payment
  console.log('\n=== Confirm Cash Payment ===');
  let resp = await request('POST', `/api/orders/${ORDER_ID}/confirm-payment`, JSON.stringify({
    paymentMethod: 'CASH',
    reference: 'GPV-TEST-CASH-001'
  }), cookies);
  console.log('Status:', resp.status);
  console.log('Response:', resp.body.substring(0, 1000));

  // Verify payment state in DB
  console.log('\n=== Verify Payment State ===');
  const sale = await p.sale.findUnique({
    where: { id: ORDER_ID },
    select: { id: true, status: true, isPaid: true, paymentStatus: true, paymentMethod: true, paymentReference: true, totalAmountCents: true }
  });
  console.log('Sale:', JSON.stringify(sale, null, 2));

  // Check dashboard stats
  console.log('\n=== Dashboard Stats After Payment ===');
  resp = await request('GET', '/api/dashboard/stats', null, cookies);
  console.log('Stats:', resp.status, resp.body);

  // Check sales chart
  console.log('\n=== Sales Chart After Payment ===');
  resp = await request('GET', '/api/dashboard/sales-chart', null, cookies);
  console.log('Sales chart:', resp.status, resp.body.substring(0, 500));

  // Check if sale was recorded
  console.log('\n=== Sales Records ===');
  const salesCount = await p.sale.count({ where: { businessId: 'cmsk4x4c900026gygb3x5f8r6' } });
  console.log('Total sales:', salesCount);

  await p.$disconnect();
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
