const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const business = await p.business.findUnique({
    where: { id: 'cmsk4x4c900026gygb3x5f8r6' },
    select: {
      id: true, name: true, country: true, currency: true, timezone: true,
      taxRate: true, taxMode: true, isActive: true, isFoundingMember: true,
      approvalStatus: true, businessType: true, planId: true,
      trialStartDate: true, trialEndDate: true
    }
  });
  console.log('Business:', JSON.stringify(business, null, 2));

  const user = await p.user.findUnique({
    where: { id: 'cmsk4x2p900006gygp5iknc6b' },
    select: { id: true, name: true, email: true, roles: true, businessId: true }
  });
  console.log('User:', JSON.stringify(user, null, 2));

  const plan = await p.plan.findUnique({
    where: { id: business?.planId },
    select: { id: true, name: true, code: true, priceCents: true, currency: true }
  });
  console.log('Plan:', JSON.stringify(plan, null, 2));

  const businessCount = await p.business.count();
  console.log('Total businesses now:', businessCount);

  await p.$disconnect();
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
