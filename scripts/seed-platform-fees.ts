/**
 * Seed Script: Initialize Platform Fee Configurations
 * Run this once to populate the PlatformFeeConfig table with default values
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPlatformFees() {
  console.log('🌱 Seeding platform fee configurations...');

  const fees = [
    {
      feeType: 'BUSINESS_COMMISSION',
      feePercent: 5.0,
      description: 'Platform commission on restaurant revenue (deducted at payout)',
      isActive: true
    },
    {
      feeType: 'SUPPLIER_PLATFORM_FEE',
      feePercent: 7.5,
      description: 'Platform fee on supplier payouts',
      isActive: true
    },
    {
      feeType: 'MARKETPLACE_COMMISSION',
      feePercent: 7.0,
      description: 'Default marketplace seller commission',
      isActive: true
    },
    {
      feeType: 'DIGITAL_PAYMENT_FEE',
      feePercent: 5.0,
      description: 'Customer digital payment convenience fee',
      isActive: true
    },
    {
      feeType: 'SPLIT_PAYMENT_FEE',
      feePercent: 1.5,
      description: 'Split bill convenience fee (configurable per business)',
      isActive: true
    },
    {
      feeType: 'DIGITAL_TIPPING_FEE',
      feePercent: 2.5,
      description: 'Platform fee on digital tips',
      isActive: true
    }
  ];

  for (const fee of fees) {
    // Check if fee already exists
    const existing = await prisma.platformFeeConfig.findFirst({
      where: {
        feeType: fee.feeType,
        isActive: true
      }
    });

    if (existing) {
      console.log(`✓ ${fee.feeType} already exists (${existing.feePercent}%)`);
    } else {
      await prisma.platformFeeConfig.create({
        data: fee
      });
      console.log(`✓ Created ${fee.feeType} (${fee.feePercent}%)`);
    }
  }

  console.log('✅ Platform fee configurations seeded successfully!');
}

seedPlatformFees()
  .catch((error) => {
    console.error('❌ Error seeding platform fees:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
