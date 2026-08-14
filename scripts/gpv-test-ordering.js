// GPV Ordering Flow Test
// 1. Create a table
// 2. Create a QR code for the table
// 3. Place an order via public API
// 4. Verify order appears in kitchen
const http = require('http');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const p = new PrismaClient();

const EMAIL = 'gpv-test@imboniserve-test.com';
const PASSWORD = 'GPV-Test-2026!';
const HOST = '127.0.0.1';
const PORT = 3000;
const BUSINESS_ID = 'cmsk4x4c900026gygb3x5f8r6';
const USER_ID = 'cmsk4x2p900006gygp5iknc6b';
const MENU_ITEM_ID = 'cmsk92nrb000lcwhfcwy1gu3c';

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

  resp = await request('POST', '/api/auth/pre-login', { email: EMAIL, password: PASSWORD, debugRequestId: 'GPV-ORDER' }, cookies);
  cookies += '; ' + extractCookies(resp.cookies);

  const otp = await getOTP();
  resp = await request('POST', '/api/auth/verify-mfa-otp', { email: EMAIL, otp, debugRequestId: 'GPV-ORDER' }, cookies);
  cookies += '; ' + extractCookies(resp.cookies);
  const confirmToken = JSON.parse(resp.body).confirmToken;

  resp = await requestForm('/api/auth/callback/mfa-confirm', `csrfToken=${csrfToken}&email=${EMAIL}&confirmToken=${confirmToken}&json=true`, cookies);
  cookies += '; ' + extractCookies(resp.cookies);

  return cookies;
}

async function main() {
  console.log('=== Getting authenticated session ===');
  const cookies = await getAuthenticatedSession();
  console.log('Session established');

  // Step 1: Create a table
  console.log('\n=== Step 1: Create Table ===');
  let resp = await request('POST', '/api/tables', { number: 1, capacity: 4, status: 'AVAILABLE' }, cookies);
  console.log('POST /api/tables:', resp.status, resp.body);
  let tableId = null;
  if (resp.status === 201) {
    tableId = JSON.parse(resp.body).table.id;
    console.log('Table ID:', tableId);
  } else if (resp.status === 400) {
    // Table might already exist, try to get it
    resp = await request('GET', '/api/tables', null, cookies);
    console.log('GET /api/tables:', resp.status, resp.body.substring(0, 500));
    const tablesData = JSON.parse(resp.body);
    if (tablesData.tables && tablesData.tables.length > 0) {
      tableId = tablesData.tables[0].id;
      console.log('Using existing table:', tableId);
    }
  }

  // Step 2: Check public order draft endpoint
  console.log('\n=== Step 2: Create Order Draft ===');
  resp = await request('POST', '/api/public/order/draft', {
    branchId: BUSINESS_ID,
    tableId: tableId,
    items: [{ menuItemId: MENU_ITEM_ID, quantity: 2, notes: 'No onions' }]
  }, '');
  console.log('POST /api/public/order/draft:', resp.status, resp.body.substring(0, 1000));

  // Step 3: Check kitchen orders
  console.log('\n=== Step 3: Kitchen Orders ===');
  resp = await request('GET', '/api/kitchen/orders', null, cookies);
  console.log('GET /api/kitchen/orders:', resp.status, resp.body.substring(0, 1000));

  // Step 4: Check dashboard stats
  console.log('\n=== Step 4: Dashboard Stats ===');
  resp = await request('GET', '/api/dashboard/stats', null, cookies);
  console.log('GET /api/dashboard/stats:', resp.status, resp.body);

  await p.$disconnect();
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
