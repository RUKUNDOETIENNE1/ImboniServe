// GPV Full Ordering Flow Test
// 1. Generate QR access token
// 2. Create order draft
// 3. Verify in kitchen
const http = require('http');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const p = new PrismaClient();

const EMAIL = 'gpv-test@imboniserve-test.com';
const PASSWORD = 'GPV-Test-2026!';
const HOST = '127.0.0.1';
const PORT = 3000;
const BUSINESS_ID = 'cmsk4x4c900026gygb3x5f8r6';
const USER_ID = 'cmsk4x2p900006gygp5iknc6b';
const MENU_ITEM_ID = 'cmsk92nrb000lcwhfcwy1gu3c';
const TABLE_ID = 'cmsk9iwde0013cwhfahvtumah';
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'dev-secret';

function request(method, path, body, cookies) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
    if (cookies) headers['Cookie'] = cookies;
    const data = body ? JSON.stringify(body) : null;
    if (data) headers['Content-Length'] = Buffer.byteLength(data);
    const req = http.request({ hostname: HOST, port: PORT, path, method, headers }, (res) => {
      let chunks = '';
      res.on('data', d => chunks += d);
      res.on('end', () => resolve({ status: res.statusCode, body: chunks, cookies: res.headers['set-cookie'] }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function requestForm(path, formData, cookies) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    if (cookies) headers['Cookie'] = cookies;
    headers['Content-Length'] = Buffer.byteLength(formData);
    const req = http.request({ hostname: HOST, port: PORT, path, method: 'POST', headers }, (res) => {
      let chunks = '';
      res.on('data', d => chunks += d);
      res.on('end', () => resolve({ status: res.statusCode, body: chunks, cookies: res.headers['set-cookie'] }));
    });
    req.on('error', reject);
    req.write(formData);
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

async function getAuthenticatedSession() {
  let resp = await request('GET', '/api/auth/csrf');
  let cookies = extractCookies(resp.cookies);
  const csrfToken = JSON.parse(resp.body).csrfToken;
  resp = await request('POST', '/api/auth/pre-login', { email: EMAIL, password: PASSWORD, debugRequestId: 'GPV-ORDER2' }, cookies);
  cookies += '; ' + extractCookies(resp.cookies);
  const otp = await getOTP();
  resp = await request('POST', '/api/auth/verify-mfa-otp', { email: EMAIL, otp, debugRequestId: 'GPV-ORDER2' }, cookies);
  cookies += '; ' + extractCookies(resp.cookies);
  const confirmToken = JSON.parse(resp.body).confirmToken;
  resp = await requestForm('/api/auth/callback/mfa-confirm', `csrfToken=${csrfToken}&email=${EMAIL}&confirmToken=${confirmToken}&json=true`, cookies);
  cookies += '; ' + extractCookies(resp.cookies);
  return cookies;
}

async function generateAccessToken(branchId, source, tableId) {
  const jti = crypto.randomBytes(16).toString('hex');
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (30 * 60); // 30 min TTL
  const claims = { jti, branchId, tableId, source, iat: now, exp };
  // Store in DB
  await p.orderToken.create({
    data: { jti, branchId, tableId, source, used: false, expiresAt: new Date(exp * 1000) }
  });
  return jwt.sign(claims, JWT_SECRET);
}

async function main() {
  console.log('=== Getting authenticated session ===');
  const cookies = await getAuthenticatedSession();
  console.log('Session established');

  // Generate QR access token
  console.log('\n=== Generating QR Access Token ===');
  const accessToken = await generateAccessToken(BUSINESS_ID, 'QR_IN_VENUE', TABLE_ID);
  console.log('Access token:', accessToken.substring(0, 40) + '...');

  // Create order draft
  console.log('\n=== Creating Order Draft ===');
  let resp = await request('POST', '/api/public/order/draft', {
    accessToken,
    branchId: BUSINESS_ID,
    items: [{ menuItemId: MENU_ITEM_ID, quantity: 2, notes: 'No onions' }],
    mode: 'dine-in',
    paymentMethod: 'CASH'
  }, '');
  console.log('POST /api/public/order/draft:', resp.status);
  console.log('Response:', resp.body.substring(0, 2000));

  let orderId = null;
  if (resp.status === 200 || resp.status === 201) {
    try {
      const data = JSON.parse(resp.body);
      orderId = data.orderId || data.id || data.order?.id;
      console.log('Order ID:', orderId);
    } catch(e) {}
  }

  // Check kitchen orders
  console.log('\n=== Kitchen Orders After Draft ===');
  resp = await request('GET', '/api/kitchen/orders', null, cookies);
  console.log('GET /api/kitchen/orders:', resp.status);
  console.log('Response:', resp.body.substring(0, 2000));

  // Check dashboard stats
  console.log('\n=== Dashboard Stats After Order ===');
  resp = await request('GET', '/api/dashboard/stats', null, cookies);
  console.log('GET /api/dashboard/stats:', resp.status, resp.body);

  await p.$disconnect();
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
