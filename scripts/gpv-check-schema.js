const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Check if pendingToken column exists
  const result = await p.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'UserLoginOtp' ORDER BY ordinal_position`;
  console.log('UserLoginOtp columns:', JSON.stringify(result, null, 2));
  await p.$disconnect();
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
