const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const b = await p.business.update({
    where: { id: 'cmsk4x4c900026gygb3x5f8r6' },
    data: { enableQRInVenue: true, enableQRRemote: true },
    select: { id: true, enableQRInVenue: true, enableQRRemote: true }
  });
  console.log('Updated QR flags:', JSON.stringify(b, null, 2));
  await p.$disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });
