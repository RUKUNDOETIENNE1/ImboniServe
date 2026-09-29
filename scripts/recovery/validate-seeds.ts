import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const planCount = await prisma.plan.count();
  console.log(`Plans: ${planCount} (expected >= 7)`);

  const userCount = await prisma.user.count();
  console.log(`Users: ${userCount} (expected >= 5)`);

  const adminUser = await prisma.user.findFirst({ where: { email: 'admin@imboni.resto' } });
  console.log(`Admin user exists: ${adminUser ? 'YES' : 'NO'}`);

  const restaurantCount = await prisma.business.count();
  console.log(`Businesses (Restaurant): ${restaurantCount} (expected >= 1)`);

  const menuItemCount = await prisma.menuItem.count();
  console.log(`Menu Items: ${menuItemCount} (expected >= 1)`);

  const feeCount = await prisma.platformFeeConfig.count();
  console.log(`Platform Fee Configs: ${feeCount} (expected >= 6)`);

  const qrTemplateCount = await prisma.qrTemplate.count();
  console.log(`QR Templates: ${qrTemplateCount} (expected >= 3)`);

  const featureFlagCount = await prisma.featureFlag.count();
  console.log(`Feature Flags: ${featureFlagCount} (expected >= 20)`);

  const marketplaceProductCount = await prisma.marketplaceProduct.count();
  console.log(`Marketplace Products: ${marketplaceProductCount} (expected >= 6)`);

  const supplierCount = await prisma.supplier.count();
  console.log(`Suppliers: ${supplierCount} (expected >= 3)`);

  await prisma.$disconnect();
}

main().catch(e => {
  console.error('ERROR:', e);
  process.exit(1);
});
