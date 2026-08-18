// Debug: Check if session works for authenticated API calls
const http = require('http');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const p = new PrismaClient();

const EMAIL = 'gpv-test@imboniserve-test.com';
const PASSWORD = 'GPV-Test-2026!';
const HOST = '127.0.0.1';
const PORT = 3000;
const USER_ID = 'cmsk4x2p900006gygp5iknc6b';

function request(method, path, body, cookies, isForm) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (isForm) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
    } else {
      headers['Content-Type'] = 'application/json';
    }
    if (cookies) headers['Cookie'] = cookies;
    const data = body;
    if (data) headers['Content-Length'] = Buffer.byteLength(data);
    const req = http.request({ hostname: HOST, port: PORT, path, method, headers }, (res) => {
      let chunks = '';
      res.on('data', d => chunks += d);
      res.on('end', () => resolve({ status: res.statusCode, body: chunks, cookies: res.headers['set-cookie'], headers: res.headers }));
    });
    req.on('error', reject);
    if (data) req.write(data);
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

async function main() {
  // Step 1: CSRF
  let resp = await request('GET', '/api/auth/csrf');
  let allCookies = extractCookies(resp.cookies);
  console.log('CSRF cookies:', allCookies);
  const csrfToken = JSON.parse(resp.body).csrfToken;

  // Step 2: Pre-login
  resp = await request('POST', '/api/auth/pre-login', JSON.stringify({ email: EMAIL, password: PASSWORD, debugRequestId: 'GPV-DEBUG' }), allCookies);
  allCookies += '; ' + extractCookies(resp.cookies);
  console.log('After pre-login cookies:', allCookies);

  // Step 3: OTP
  const otp = await getOTP();
  resp = await request('POST', '/api/auth/verify-mfa-otp', JSON.stringify({ email: EMAIL, otp, debugRequestId: 'GPV-DEBUG' }), allCookies);
  allCookies += '; ' + extractCookies(resp.cookies);
  const confirmToken = JSON.parse(resp.body).confirmToken;

  // Step 4: Session
  const formData = `csrfToken=${csrfToken}&email=${EMAIL}&confirmToken=${confirmToken}&json=true`;
  resp = await request('POST', '/api/auth/callback/mfa-confirm', formData, allCookies, true);
  const newCookies = extractCookies(resp.cookies);
  if (newCookies) allCookies += '; ' + newCookies;
  console.log('After callback cookies:', allCookies);
  console.log('Callback response:', resp.body);
  console.log('Callback set-cookie:', resp.cookies);

  // Step 5: Check session
  resp = await request('GET', '/api/auth/session', null, allCookies);
  console.log('\nSession:', resp.status, resp.body);

  // Step 6: Try kitchen update
  resp = await request('POST', '/api/kitchen/update-status', JSON.stringify({ orderId: 'cmsk9r3nh001ecwhftmyhepts', newStatus: 'accepted' }), allCookies);
  console.log('\nKitchen update:', resp.status, resp.body);

  await p.$disconnect();
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
