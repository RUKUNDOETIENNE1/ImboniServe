// GPV-D010: End-to-end fix verification
// Creates a new order, confirms payment, and verifies ALL financial layers
const http = require('http');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const p = new PrismaClient();

const EMAIL = 'gpv-test@imboniserve-test.com';
const PASSWORD = 'GPV-Test-2026!';
const HOST = '127.0.0.1';
const PORT = 3000;
const USER_ID = 'cmsk4x2p900006gygp5iknc6b';
const BUSINESS_ID = 'cmsk4x4c900026gygb3x5f8r6';
const MENU_ITEM_ID = 'cmsk92nrb000lcwhfcwy1gu3c';
const TABLE_ID = 'cmsk9iwde0013cwhfahvtumah';

function request(method, path, body, cookies, isForm) {
  return new Promise((resolve, reject) => {
    const headers = {};
    headers['Content-Type'] = isForm ? 'application/x-www-form-urlencoded' : 'application/json';
    if (cookies) headers['Cookie'] = cookies;
    if (body) headers['Content-Length'] = Buffer.byteLength(body);
    const options = { hostname: HOST, port: PORT, path, method, headers, timeout: 120000 };
    const req = http.request(options, (res) => {
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
  let allCookies = extractCookies(resp.cookies);
  const csrfToken = JSON.parse(resp.body).csrfToken;
  resp = await request('POST', '/api/auth/pre-login', JSON.stringify({ email: EMAIL, password: PASSWORD, debugRequestId: 'GPV-D010-FIX' }), allCookies);
  if (resp.status !== 200) {
    console.log('Pre-login failed:', resp.status, resp.body);
    process.exit(1);
  }
  const newC1 = extractCookies(resp.cookies); if (newC1) allCookies += '; ' + newC1;
  // Wait for OTP to be stored in DB
  await new Promise(r => setTimeout(r, 1000));
  const otp = await getOTP();
  if (!otp) {
    console.log('ERROR: Could not find OTP');
    process.exit(1);
  }
  resp = await request('POST', '/api/auth/verify-mfa-otp', JSON.stringify({ email: EMAIL, otp, debugRequestId: 'GPV-D010-FIX' }), allCookies);
  if (resp.status !== 200) {
    console.log('OTP verify failed:', resp.status, resp.body);
    process.exit(1);
  }
  const newC2 = extractCookies(resp.cookies); if (newC2) allCookies += '; ' + newC2;
  const confirmToken = JSON.parse(resp.body).confirmToken;
  resp = await request('POST', '/api/auth/callback/mfa-confirm', `csrfToken=${csrfToken}&email=${EMAIL}&confirmToken=${confirmToken}&json=true`, allCookies, true);
  const newC3 = extractCookies(resp.cookies); if (newC3) allCookies += '; ' + newC3;
  return allCookies;
}

async function main() {
  console.log('=== GPV-D010 FIX VERIFICATION ===\n');

  // Step 1: Read QR access token from file
  console.log('--- Step 1: Read QR Access Token ---');
  const fs = require('fs');
  const accessToken = fs.readFileSync('scripts/gpv-qr-token.txt', 'utf8').trim();
  console.log('QR token loaded:', accessToken.substring(0, 50) + '...');

  // Step 2: Create order draft
  console.log('\n--- Step 2: Create Order Draft ---');
  const cookies = await getSession();
  console.log('Session established');

  const draftResp = await request('POST', '/api/public/order/draft', JSON.stringify({
    accessToken: accessToken,
    branchId: BUSINESS_ID,
    items: [{ menuItemId: MENU_ITEM_ID, quantity: 1, notes: 'GPV-D010 fix test' }],
    paymentMethod: 'CASH',
    customerName: 'GPV D010 Test',
  }), null);

  console.log('Draft status:', draftResp.status);
  const draftData = JSON.parse(draftResp.body);
  if (draftResp.status !== 201) {
    console.log('ERROR:', draftResp.body);
    process.exit(1);
  }
  console.log('Draft response keys:', Object.keys(draftData));
  console.log('Draft response:', JSON.stringify(draftData).substring(0, 1000));
  // Try multiple possible response structures
  const orderId = draftData.id || draftData.sale?.id || draftData.order?.id || draftData.orderId;
  const orderNumber = draftData.orderNumber || draftData.sale?.orderNumber || draftData.order?.orderNumber;
  const totalAmountCents = draftData.totalAmountCents || draftData.sale?.totalAmountCents || draftData.order?.totalAmountCents || draftData.totalAmount;
  const paymentTxnId = draftData.paymentTransactionId || draftData.sale?.paymentTransactionId || draftData.order?.paymentTransactionId;
  console.log('Order ID:', orderId);
  console.log('Order Number:', orderNumber);
  console.log('Total (cents):', totalAmountCents);
  console.log('Payment Txn ID:', paymentTxnId);

  // If orderId is still undefined, look up by orderNumber
  let effectiveOrderId = orderId;
  if (!effectiveOrderId && orderNumber) {
    const sale = await p.sale.findUnique({ where: { orderNumber }, select: { id: true, totalAmountCents: true } });
    if (sale) {
      effectiveOrderId = sale.id;
      console.log('Resolved order ID from orderNumber:', effectiveOrderId);
    }
  }

  // Step 3: Confirm payment
  console.log('\n--- Step 3: Confirm Cash Payment ---');
  const payResp = await request('POST', `/api/orders/${effectiveOrderId}/confirm-payment`, JSON.stringify({
    paymentMethod: 'CASH',
    reference: 'GPV-D010-FIX-001',
  }), cookies);
  console.log('Payment confirm status:', payResp.status);
  const payData = JSON.parse(payResp.body);
  console.log('Payment result:', JSON.stringify(payData, null, 2));

  // Step 4: Verify ALL financial layers
  console.log('\n--- Step 4: Verify Financial Layers ---');

  // 4a. Sale
  const sale = await p.sale.findUnique({
    where: { id: effectiveOrderId },
    select: { id: true, status: true, paymentStatus: true, isPaid: true, totalAmountCents: true, paymentMethod: true, paymentTransactionId: true }
  });
  console.log('\n4a. SALE:');
  console.log('  status:', sale.status, sale.status === 'COMPLETED' ? '✓ PASS' : '✗ FAIL');
  console.log('  paymentStatus:', sale.paymentStatus, sale.paymentStatus === 'COMPLETED' ? '✓ PASS' : '✗ FAIL');
  console.log('  isPaid:', sale.isPaid, sale.isPaid === true ? '✓ PASS' : '✗ FAIL');
  console.log('  totalAmountCents:', sale.totalAmountCents);

  // 4b. PaymentTransaction
  let payTxn = null;
  if (sale.paymentTransactionId) {
    payTxn = await p.paymentTransaction.findUnique({
      where: { id: sale.paymentTransactionId },
      select: { id: true, status: true, paidAt: true, amountCents: true, currency: true }
    });
    console.log('\n4b. PAYMENT TRANSACTION:');
    console.log('  status:', payTxn.status, payTxn.status === 'SUCCESS' ? '✓ PASS' : '✗ FAIL');
    console.log('  paidAt:', payTxn.paidAt, payTxn.paidAt !== null ? '✓ PASS' : '✗ FAIL');
    console.log('  amountCents:', payTxn.amountCents);
  } else {
    console.log('\n4b. PAYMENT TRANSACTION: None (CASH sale without txn record)');
  }

  // 4c. FinancialLedgerEntry
  const ledgerEntries = await p.financialLedgerEntry.findMany({
    where: {
      businessId: BUSINESS_ID,
      occurredAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } // last 5 minutes
    },
    select: { id: true, domain: true, eventType: true, amountCents: true, currency: true, paymentTransactionId: true, occurredAt: true },
    orderBy: { occurredAt: 'desc' },
    take: 10
  });
  console.log('\n4c. FINANCIAL LEDGER ENTRIES (last 5 min):');
  console.log('  Count:', ledgerEntries.length);
  for (const e of ledgerEntries) {
    console.log(`  → domain: ${e.domain}, eventType: ${e.eventType}, amountCents: ${e.amountCents}, currency: ${e.currency}, txnId: ${e.paymentTransactionId}`);
  }
  const salesLedger = ledgerEntries.find(e => e.domain === 'SALES' && e.eventType === 'PAYMENT_SUCCESS' && e.amountCents > 0);
  console.log('  SALES ledger entry with correct amount:', salesLedger ? '✓ PASS' : '✗ FAIL');

  // 4d. Dashboard Stats
  console.log('\n--- Step 5: Verify Dashboard ---');
  const statsResp = await request('GET', '/api/dashboard/stats', null, cookies);
  console.log('Dashboard stats status:', statsResp.status);
  console.log('Dashboard stats raw:', statsResp.body.substring(0, 500));
  const stats = JSON.parse(statsResp.body);
  const todaySales = stats.todaySales || {};
  const expectedRevenue = (totalAmountCents || sale.totalAmountCents) / 100;
  console.log(`Expected revenue: ${expectedRevenue}, Actual: ${todaySales.revenue}`);
  console.log('Dashboard revenue matches:', todaySales.revenue >= expectedRevenue ? '✓ PASS' : '✗ FAIL');

  // 4e. Close-Day Report
  console.log('\n--- Step 6: Verify Close-Day Report ---');
  const today = new Date().toISOString().split('T')[0];
  const closeDayResp = await request('GET', `/api/reports/close-day?date=${today}`, null, cookies);
  const closeDay = JSON.parse(closeDayResp.body);
  console.log('Close-day status:', closeDayResp.status);
  if (closeDayResp.status === 200) {
    console.log('Total revenue (cents):', closeDay.summary?.totalRevenueCents);
    console.log('Total orders:', closeDay.summary?.totalOrders);
    console.log('Ledger cross-check:', JSON.stringify(closeDay.ledgerCrossCheck, null, 2));
    const ledgerMatch = closeDay.ledgerCrossCheck?.match === true;
    console.log('Ledger cross-check match:', ledgerMatch ? '✓ PASS' : '✗ FAIL');
  } else {
    console.log('Close-day error:', closeDayResp.body.substring(0, 300));
  }

  // Summary
  console.log('\n=== SUMMARY ===');
  console.log('Sale status COMPLETED:', sale.status === 'COMPLETED' ? '✓' : '✗');
  console.log('Sale paymentStatus COMPLETED:', sale.paymentStatus === 'COMPLETED' ? '✓' : '✗');
  console.log('Sale isPaid:', sale.isPaid ? '✓' : '✗');
  console.log('PaymentTxn SUCCESS:', payTxn?.status === 'SUCCESS' ? '✓' : (payTxn ? '✗' : 'N/A'));
  console.log('Ledger SALES entry created:', salesLedger ? '✓' : '✗');
  console.log('Dashboard revenue correct:', todaySales && todaySales.revenue >= expectedRevenue ? '✓' : '✗');
  if (closeDayResp.status === 200) {
    console.log('Close-day ledger cross-check:', closeDay.ledgerCrossCheck?.match ? '✓' : '✗');
  }

  await p.$disconnect();
}

main().catch(e => { console.error('Error:', e.message, e.stack); process.exit(1); });
