// GPV-D010: Generate QR access token via API
const http = require('http');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const HOST = '127.0.0.1';
const PORT = 3000;
const BUSINESS_ID = 'cmsk4x4c900026gygb3x5f8r6';
const TABLE_ID = 'cmsk9iwde0013cwhfahvtumah';

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
    if (body) headers['Content-Length'] = Buffer.byteLength(body);
    const req = http.request({ hostname: HOST, port: PORT, path, method, headers }, (res) => {
      let chunks = '';
      res.on('data', d => chunks += d);
      res.on('end', () => resolve({ status: res.statusCode, body: chunks }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  // The signature is HMAC-SHA256 of `${branchId}|${tableId}|1` with QR_SECRET
  const crypto = require('crypto');
  const QR_SECRET = process.env.IMBONI_QR_SECRET || 'gpv-qr-secret-2026';
  const payload = `${BUSINESS_ID}|${TABLE_ID}|1`;
  const signature = crypto.createHmac('sha256', QR_SECRET).update(payload).digest('hex');

  console.log('QR signature:', signature);

  // Call the token API
  const resp = await request('POST', '/api/public/order/token', JSON.stringify({
    branchId: BUSINESS_ID,
    tableId: TABLE_ID,
    version: '1',
    signature,
    mode: 'invenue',
  }));

  console.log('Token API status:', resp.status);
  const data = JSON.parse(resp.body);
  console.log('Access token:', data.accessToken ? data.accessToken.substring(0, 50) + '...' : 'NONE');

  if (data.accessToken) {
    // Save token to file for the test script
    const fs = require('fs');
    fs.writeFileSync('scripts/gpv-qr-token.txt', data.accessToken);
    console.log('Token saved to scripts/gpv-qr-token.txt');
  }

  await p.$disconnect();
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
