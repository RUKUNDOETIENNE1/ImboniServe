/**
 * Phase 2: Updated Plan Seeds with New Feature Limits
 * Run after migration to populate plan feature limits
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedPhase2Plans() {
  console.log('🌱 Seeding Phase 2 plans...');

  // STARTER (Essentials)
  await prisma.plan.upsert({
    where: { code: 'ESSENTIALS' },
    update: {
      priceCents: 1250000, // 12,500 RWF monthly (10,000 × 1.25)
      annualPriceCents: 1000000, // 10,000 RWF monthly (120,000 annual)
      aiCreditsMonthly: 20,
      qrCodesLimit: 5,
      cmsPostsLimit: 0, // Not available
      storageGBLimit: 2,
      siteBuilderIncluded: false,
      discoveryFeatured: false,
      features: {
        users: 'unlimited',
        menuItems: 100,
        sales: true,
        inventory: true,
        reports: 'daily',
        whatsapp: true,
        mobileMoney: true,
        qrCodes: 5,
        aiCredits: 20,
        siteBuilder: 'preview_only',
        discovery: 'basic_listing',
        cms: false,
        analytics: 'basic',
        support: 'basic'
      }
    },
    create: {
      name: 'Essentials',
      code: 'ESSENTIALS',
      description: 'Perfect for small cafés and food stalls getting started',
      priceCents: 1250000,
      annualPriceCents: 1000000,
      currency: 'RWF',
      aiCreditsMonthly: 20,
      qrCodesLimit: 5,
      cmsPostsLimit: 0,
      storageGBLimit: 2,
      siteBuilderIncluded: false,
      discoveryFeatured: false,
      maxUsers: null, // Unlimited
      maxMenuItems: 100,
      whatsappIncluded: true,
      supportLevel: 'BASIC',
      isActive: true,
      features: {
        users: 'unlimited',
        menuItems: 100,
        sales: true,
        inventory: true,
        reports: 'daily',
        whatsapp: true,
        mobileMoney: true,
        qrCodes: 5,
        aiCredits: 20,
        siteBuilder: 'preview_only',
        discovery: 'basic_listing',
        cms: false,
        analytics: 'basic',
        support: 'basic'
      }
    }
  });

  // PROFESSIONAL (updated)
  await prisma.plan.upsert({
    where: { code: 'PROFESSIONAL' },
    update: {
      priceCents: 2500000, // 25,000 RWF monthly
      annualPriceCents: 2000000, // 20,000 RWF monthly (240,000 annual)
      aiCreditsMonthly: 50,
      qrCodesLimit: 20,
      cmsPostsLimit: 10,
      storageGBLimit: 5,
      siteBuilderIncluded: false, // Available as add-on
      discoveryFeatured: false, // Available as add-on
      features: {
        users: 'unlimited',
        menuItems: 500,
        sales: true,
        inventory: true,
        reports: 'weekly_monthly',
        whatsapp: true,
        mobileMoney: true,
        qrCodes: 20,
        aiCredits: 50,
        siteBuilder: 'preview_only',
        discovery: 'basic_listing',
        cms: true,
        cmsPostsLimit: 10,
        analytics: 'standard',
        procurement: true,
        lowStockAlerts: true,
        support: 'priority'
      }
    },
    create: {
      name: 'Professional',
      code: 'PROFESSIONAL',
      description: 'For established restaurants and cafés',
      priceCents: 2500000,
      annualPriceCents: 2000000,
      currency: 'RWF',
      aiCreditsMonthly: 50,
      qrCodesLimit: 20,
      cmsPostsLimit: 10,
      storageGBLimit: 5,
      siteBuilderIncluded: false,
      discoveryFeatured: false,
      maxUsers: null,
      maxMenuItems: 500,
      whatsappIncluded: true,
      supportLevel: 'PRIORITY',
      isActive: true,
      features: {
        users: 'unlimited',
        menuItems: 500,
        sales: true,
        inventory: true,
        reports: 'weekly_monthly',
        whatsapp: true,
        mobileMoney: true,
        qrCodes: 20,
        aiCredits: 50,
        siteBuilder: 'preview_only',
        discovery: 'basic_listing',
        cms: true,
        cmsPostsLimit: 10,
        analytics: 'standard',
        procurement: true,
        lowStockAlerts: true,
        support: 'priority'
      }
    }
  });

  // BUSINESS (updated with included features)
  await prisma.plan.upsert({
    where: { code: 'BUSINESS' },
    update: {
      priceCents: 6250000, // 62,500 RWF monthly (50,000 × 1.25)
      annualPriceCents: 5000000, // 50,000 RWF monthly (600,000 annual)
      aiCreditsMonthly: 200,
      qrCodesLimit: null, // Unlimited
      cmsPostsLimit: null, // Unlimited
      storageGBLimit: 20,
      siteBuilderIncluded: true, // INCLUDED
      discoveryFeatured: true, // INCLUDED
      features: {
        users: 'unlimited',
        menuItems: 'unlimited',
        sales: true,
        inventory: true,
        reports: 'all',
        whatsapp: true,
        mobileMoney: true,
        qrCodes: 'unlimited',
        aiCredits: 200,
        siteBuilder: 'pro_included',
        discovery: 'featured_included',
        cms: true,
        cmsPostsLimit: 'unlimited',
        analytics: 'advanced',
        procurement: true,
        lowStockAlerts: true,
        multiBranch: true,
        profitLeakDetection: true,
        governance: true,
        support: 'dedicated_manager'
      }
    },
    create: {
      name: 'Business',
      code: 'BUSINESS',
      description: 'For hotels, chains, and high-volume restaurants',
      priceCents: 6250000,
      annualPriceCents: 5000000,
      currency: 'RWF',
      aiCreditsMonthly: 200,
      qrCodesLimit: null,
      cmsPostsLimit: null,
      storageGBLimit: 20,
      siteBuilderIncluded: true,
      discoveryFeatured: true,
      maxUsers: null,
      maxMenuItems: null,
      whatsappIncluded: true,
      supportLevel: 'DEDICATED',
      isActive: true,
      features: {
        users: 'unlimited',
        menuItems: 'unlimited',
        sales: true,
        inventory: true,
        reports: 'all',
        whatsapp: true,
        mobileMoney: true,
        qrCodes: 'unlimited',
        aiCredits: 200,
        siteBuilder: 'pro_included',
        discovery: 'featured_included',
        cms: true,
        cmsPostsLimit: 'unlimited',
        analytics: 'advanced',
        procurement: true,
        lowStockAlerts: true,
        multiBranch: true,
        profitLeakDetection: true,
        governance: true,
        support: 'dedicated_manager'
      }
    }
  });

  // ENTERPRISE (custom pricing)
  await prisma.plan.upsert({
    where: { code: 'ENTERPRISE' },
    update: {
      priceCents: 15000000, // 150,000 RWF starting
      annualPriceCents: 12500000, // 125,000 RWF monthly
      aiCreditsMonthly: 999999, // Unlimited
      qrCodesLimit: null,
      cmsPostsLimit: null,
      storageGBLimit: 100,
      siteBuilderIncluded: true,
      discoveryFeatured: true,
      features: {
        users: 'unlimited',
        menuItems: 'unlimited',
        sales: true,
        inventory: true,
        reports: 'all',
        whatsapp: true,
        mobileMoney: true,
        qrCodes: 'unlimited',
        aiCredits: 'unlimited',
        siteBuilder: 'pro_included',
        discovery: 'premium_included',
        cms: true,
        cmsPostsLimit: 'unlimited',
        analytics: 'enterprise',
        procurement: true,
        lowStockAlerts: true,
        multiBranch: true,
        profitLeakDetection: true,
        governance: true,
        whiteLabel: true,
        apiAccess: true,
        dedicatedInfrastructure: true,
        support: 'enterprise'
      }
    },
    create: {
      name: 'Enterprise',
      code: 'ENTERPRISE',
      description: 'Custom solutions for large organizations',
      priceCents: 15000000,
      annualPriceCents: 12500000,
      currency: 'RWF',
      aiCreditsMonthly: 999999,
      qrCodesLimit: null,
      cmsPostsLimit: null,
      storageGBLimit: 100,
      siteBuilderIncluded: true,
      discoveryFeatured: true,
      maxUsers: null,
      maxMenuItems: null,
      whatsappIncluded: true,
      supportLevel: 'ENTERPRISE',
      isActive: true,
      features: {
        users: 'unlimited',
        menuItems: 'unlimited',
        sales: true,
        inventory: true,
        reports: 'all',
        whatsapp: true,
        mobileMoney: true,
        qrCodes: 'unlimited',
        aiCredits: 'unlimited',
        siteBuilder: 'pro_included',
        discovery: 'premium_included',
        cms: true,
        cmsPostsLimit: 'unlimited',
        analytics: 'enterprise',
        procurement: true,
        lowStockAlerts: true,
        multiBranch: true,
        profitLeakDetection: true,
        governance: true,
        whiteLabel: true,
        apiAccess: true,
        dedicatedInfrastructure: true,
        support: 'enterprise'
      }
    }
  });

  // Keep legacy ESSENTIALS for existing customers (grandfather period)
  await prisma.plan.updateMany({
    where: { code: 'STARTER' },
    data: {
      isActive: false, // Not available for new signups
      aiCreditsMonthly: 20,
      qrCodesLimit: 3,
      cmsPostsLimit: 0,
      storageGBLimit: 1,
      siteBuilderIncluded: false,
      discoveryFeatured: false
    }
  });

  // Keep legacy GROWTH for existing customers
  await prisma.plan.updateMany({
    where: { code: 'GROWTH' },
    data: {
      isActive: false, // Not available for new signups
      aiCreditsMonthly: 100,
      qrCodesLimit: 50,
      cmsPostsLimit: 30,
      storageGBLimit: 10,
      siteBuilderIncluded: false,
      discoveryFeatured: false
    }
  });

  console.log('✅ Phase 2 plans seeded successfully');
}

// Run if called directly
if (require.main === module) {
  seedPhase2Plans()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}

export default seedPhase2Plans;
