const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const b = await p.business.findUnique({
    where: { id: 'cmsk4x4c900026gygb3x5f8r6' },
    select: { enableQRInVenue: true, enableQRRemote: true, enableWaiterOrdering: true, enableReservations: true }
  });
  console.log('QR/Ordering flags:', JSON.stringify(b, null, 2));
  await p.$disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });
