// GPV API Test Helper - Node.js version
// Does full MFA flow then calls target API
const http = require('http');

const EMAIL = 'gpv-test@imboniserve-test.com';
const PASSWORD = 'GPV-Test-2026!';
const BASE_HOST = '127.0.0.1';
const BASE_PORT = 3000;

function request(method, path, body, cookies) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
    if (cookies) headers['Cookie'] = cookies;
    const data = body ? JSON.stringify(body) : null;
    if (data) headers['Content-Length'] = Buffer.byteLength(data);

    const req = http.request({ hostname: BASE_HOST, port: BASE_PORT, path, method, headers }, (res) => {
      let chunks = '';
      res.on('data', d => chunks += d);
      res.on('end', () => {
        const setCookies = res.headers['set-cookie'];
        resolve({ status: res.statusCode, body: chunks, cookies: setCookies, headers: res.headers });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function requestForm(method, path, formData, cookies) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    if (cookies) headers['Cookie'] = cookies;
    const data = formData;
    headers['Content-Length'] = Buffer.byteLength(data);

    const req = http.request({ hostname: BASE_HOST, port: BASE_PORT, path, method, headers }, (res) => {
      let chunks = '';
      res.on('data', d => chunks += d);
      res.on('end', () => {
        const setCookies = res.headers['set-cookie'];
        resolve({ status: res.statusCode, body: chunks, cookies: setCookies, headers: res.headers });
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function extractCookies(setCookies) {
  if (!setCookies) return '';
  return setCookies.map(c => c.split(';')[0]).join('; ');
}

async function main() {
  const targetMethod = process.argv[2] || 'GET';
  const targetPath = process.argv[3] || '/api/menu';
  const targetBody = process.argv[4] ? JSON.parse(process.argv[4]) : null;

  // Step 1: Get CSRF
  let resp = await request('GET', '/api/auth/csrf');
  let cookies = extractCookies(resp.cookies);
  const csrfData = JSON.parse(resp.body);
  const csrfToken = csrfData.csrfToken;
  console.log('CSRF:', csrfToken.substring(0, 16) + '...');

  // Step 2: Pre-login
  resp = await request('POST', '/api/auth/pre-login', { email: EMAIL, password: PASSWORD, debugRequestId: 'GPV-NODE' }, cookies);
  cookies = cookies + '; ' + extractCookies(resp.cookies);
  const preData = JSON.parse(resp.body);
  console.log('Pre-login:', resp.status, preData.success);

  // Step 3: Extract OTP from DB
  const { PrismaClient } = require('@prisma/client');
  const crypto = require('crypto');
  const p = new PrismaClient();
  function hashOTP(otp) { return crypto.createHash('sha256').update(otp + (process.env.NEXTAUTH_SECRET || '')).digest('hex'); }
  const record = await p.userLoginOtp.findFirst({
    where: { userId: 'cmsk4x2p900006gygp5iknc6b', used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
    select: { hashedOtp: true },
  });
  let otp = null;
  if (record) {
    for (let i = 100000; i <= 999999; i++) {
      if (hashOTP(i.toString()) === record.hashedOtp) { otp = i.toString(); break; }
    }
  }
  await p.$disconnect();
  console.log('OTP:', otp);

  // Step 4: Verify OTP
  resp = await request('POST', '/api/auth/verify-mfa-otp', { email: EMAIL, otp, debugRequestId: 'GPV-NODE' }, cookies);
  cookies = cookies + '; ' + extractCookies(resp.cookies);
  const verifyData = JSON.parse(resp.body);
  console.log('Verify:', resp.status, verifyData.success);
  const confirmToken = verifyData.confirmToken;

  // Step 5: Create session
  const formData = `csrfToken=${csrfToken}&email=${EMAIL}&confirmToken=${confirmToken}&json=true`;
  resp = await requestForm('POST', '/api/auth/callback/mfa-confirm', formData, cookies);
  cookies = cookies + '; ' + extractCookies(resp.cookies);
  console.log('Session:', resp.status);

  // Step 6: Call target API
  if (targetMethod === 'GET') {
    resp = await request('GET', targetPath, null, cookies);
  } else {
    resp = await request(targetMethod, targetPath, targetBody, cookies);
  }
  console.log(`\n=== ${targetMethod} ${targetPath} ===`);
  console.log('Status:', resp.status);
  console.log('Response:', resp.body.substring(0, 2000));
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
