// GPV Complete Workflow Test
// Kitchen transitions + Payment + Close-day
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
  let resp = await request('GET', '/api/auth/csrf');
  let cookies = extractCookies(resp.cookies);
  const csrfToken = JSON.parse(resp.body).csrfToken;
  resp = await request('POST', '/api/auth/pre-login', JSON.stringify({ email: EMAIL, password: PASSWORD, debugRequestId: 'GPV-WORKFLOW' }), cookies);
  const otp = await getOTP();
  resp = await request('POST', '/api/auth/verify-mfa-otp', JSON.stringify({ email: EMAIL, otp, debugRequestId: 'GPV-WORKFLOW' }), cookies);
  const confirmToken = JSON.parse(resp.body).confirmToken;
  resp = await request('POST', '/api/auth/callback/mfa-confirm', `csrfToken=${csrfToken}&email=${EMAIL}&confirmToken=${confirmToken}&json=true`, cookies, true);
  const sessionCookies = extractCookies(resp.cookies);
  if (sessionCookies) cookies = cookies + '; ' + sessionCookies;
  return cookies;
}

async function main() {
  const cookies = await getSession();
  console.log('Session established');

  // Kitchen transitions: preparing -> ready -> served
  for (const status of ['preparing', 'ready', 'served']) {
    console.log(`\n=== Kitchen: ${status} ===`);
    const resp = await request('POST', '/api/kitchen/update-status', JSON.stringify({ orderId: ORDER_ID, newStatus: status }), cookies);
    console.log(`Status: ${resp.status}`);
    if (resp.status === 200) {
      const data = JSON.parse(resp.body);
      console.log(`kitchenStatus: ${data.order?.kitchenStatus}, acceptedAt: ${data.order?.acceptedAt}, preparingAt: ${data.order?.preparingAt}, readyAt: ${data.order?.readyAt}, servedAt: ${data.order?.servedAt}`);
    } else {
      console.log(`Error: ${resp.body.substring(0, 300)}`);
    }
  }

  // Check payment status
  console.log('\n=== Payment Status ===');
  const order = await p.sale.findUnique({
    where: { id: ORDER_ID },
    select: { id: true, status: true, kitchenStatus: true, isPaid: true, paymentStatus: true, totalAmountCents: true, paymentMethod: true }
  });
  console.log('Order state:', JSON.stringify(order, null, 2));

  // Mark as paid (cash payment)
  console.log('\n=== Mark as Paid (Cash) ===');
  const payTxn = await p.paymentTransaction.findFirst({
    where: { referenceId: ORDER_ID },
    select: { id: true, status: true, amountCents: true, currency: true, transactionId: true }
  });
  console.log('Payment transaction:', JSON.stringify(payTxn, null, 2));

  if (payTxn && payTxn.status === 'PENDING') {
    // Try the payment confirm endpoint
    const resp = await request('POST', '/api/payments/confirm', JSON.stringify({
      transactionId: payTxn.id,
      status: 'SUCCESS',
      method: 'CASH'
    }), cookies);
    console.log('Payment confirm:', resp.status, resp.body.substring(0, 500));
  }

  // Check dashboard stats after payment
  console.log('\n=== Dashboard Stats After Payment ===');
  let resp = await request('GET', '/api/dashboard/stats', null, cookies);
  console.log('Stats:', resp.status, resp.body);

  // Check sales chart
  console.log('\n=== Sales Chart ===');
  resp = await request('GET', '/api/dashboard/sales-chart', null, cookies);
  console.log('Sales chart:', resp.status, resp.body.substring(0, 500));

  await p.$disconnect();
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
