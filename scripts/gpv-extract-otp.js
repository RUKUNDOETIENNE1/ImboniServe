const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const p = new PrismaClient();

function hashOTP(otp) {
  return crypto.createHash('sha256').update(otp + (process.env.NEXTAUTH_SECRET || '')).digest('hex');
}

async function main() {
  // Get the latest unused OTP for our test user
  const record = await p.userLoginOtp.findFirst({
    where: {
      userId: 'cmsk4x2p900006gygp5iknc6b',
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true, hashedOtp: true, expiresAt: true },
  });

  if (!record) {
    console.log('No unused OTP record found');
    await p.$disconnect();
    return;
  }

  console.log('Found OTP record:', record.id, 'expires:', record.expiresAt.toISOString());

  // Brute-force the 6-digit code
  const targetHash = record.hashedOtp;
  for (let i = 100000; i <= 999999; i++) {
    const otp = i.toString();
    if (hashOTP(otp) === targetHash) {
      console.log('FOUND OTP:', otp);
      await p.$disconnect();
      return;
    }
    if (i % 100000 === 0) {
      console.log(`Checking... ${i}`);
    }
  }

  console.log('OTP not found in range');
  await p.$disconnect();
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
