// GPV Kitchen Workflow Test
// Advance order through: pending -> accepted -> preparing -> ready -> served
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

async function getSession() {
  let resp = await request('GET', '/api/auth/csrf');
  let cookies = extractCookies(resp.cookies);
  const csrfToken = JSON.parse(resp.body).csrfToken;
  resp = await request('POST', '/api/auth/pre-login', { email: EMAIL, password: PASSWORD, debugRequestId: 'GPV-KITCHEN' }, cookies);
  cookies += '; ' + extractCookies(resp.cookies);
  const otp = await getOTP();
  resp = await request('POST', '/api/auth/verify-mfa-otp', { email: EMAIL, otp, debugRequestId: 'GPV-KITCHEN' }, cookies);
  cookies += '; ' + extractCookies(resp.cookies);
  const confirmToken = JSON.parse(resp.body).confirmToken;
  resp = await requestForm('/api/auth/callback/mfa-confirm', `csrfToken=${csrfToken}&email=${EMAIL}&confirmToken=${confirmToken}&json=true`, cookies);
  cookies += '; ' + extractCookies(resp.cookies);
  return cookies;
}

async function main() {
  const cookies = await getSession();
  console.log('Session established');

  const transitions = ['accepted', 'preparing', 'ready', 'served'];
  for (const status of transitions) {
    console.log(`\n=== Kitchen: ${status} ===`);
    const resp = await request('POST', '/api/kitchen/update-status', { orderId: ORDER_ID, newStatus: status }, cookies);
    console.log(`Status: ${resp.status}`);
    console.log(`Response: ${resp.body.substring(0, 500)}`);
    if (resp.status !== 200) break;
  }

  // Verify final order state
  console.log('\n=== Final Kitchen Orders ===');
  const resp = await request('GET', '/api/kitchen/orders', null, cookies);
  const data = JSON.parse(resp.body);
  const order = data.orders?.find(o => o.id === ORDER_ID);
  if (order) {
    console.log('Order kitchenStatus:', order.kitchenStatus);
    console.log('Order status:', order.status);
    console.log('Order isPaid:', order.isPaid);
    console.log('Order paymentStatus:', order.paymentStatus);
  }

  await p.$disconnect();
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
