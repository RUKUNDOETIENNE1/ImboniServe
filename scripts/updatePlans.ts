import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Updating subscription plans...')

  // New pricing model
  const PLANS = [
    {
      code: 'STARTER',
      name: 'Essentials',
      monthlyPriceCents: 1250000,
      annualPriceCents: 1000000,
      description: 'For small hospitality businesses getting started',
      maxUsers: null,
      maxMenuItems: 50,
      supportLevel: 'EMAIL' as const,
      isActive: false as const,
      features: [
        'Unlimited users',
        'Sales tracking',
        'Inventory tracking',
        'Daily reports',
        'WhatsApp notifications',
        'Email support',
        'Mobile money support',
      ],
    },
    {
      code: 'ESSENTIALS',
      name: 'Essentials',
      monthlyPriceCents: 1250000,
      annualPriceCents: 1000000,
      description: 'For stable operations that need tighter control',
      maxUsers: null,
      maxMenuItems: 200,
      supportLevel: 'PRIORITY' as const,
      isActive: true as const,
      features: [
        'Unlimited users',
        'Everything in Starter plan',
        'Weekly & monthly reports',
        'Low-stock alerts',
        'Improved inventory controls',
        'Priority support',
      ],
    },
    {
      code: 'PROFESSIONAL',
      name: 'Professional',
      monthlyPriceCents: 2500000,
      annualPriceCents: 2000000,
      description: 'For teams that run procurement and stock with discipline',
      maxUsers: null,
      maxMenuItems: null,
      supportLevel: 'PRIORITY' as const,
      isActive: true as const,
      features: [
        'Unlimited users',
        'Everything in Essentials plan',
        'Procurement workflow (PO + GRN)',
        'Audit-friendly tracking and exports',
        'Advanced reporting',
        'Phone support',
      ],
    },
    {
      code: 'GROWTH',
      name: 'Growth',
      monthlyPriceCents: 6700000,
      annualPriceCents: 60000000,
      description: 'For growing businesses that want AI-powered insights',
      maxUsers: null,
      maxMenuItems: null,
      supportLevel: 'PRIORITY' as const,
      isActive: false as const,
      features: [
        'Unlimited users',
        'Everything in Professional plan',
        'AI: Smart Reorder Recommendations',
        'AI: Cost Anomaly Alerts',
        'Insights dashboard',
        'Priority support',
      ],
    },
    {
      code: 'BUSINESS',
      name: 'Business',
      monthlyPriceCents: 6250000,
      annualPriceCents: 5000000,
      description: 'For hotel groups and chains that need multi-branch control',
      maxUsers: null,
      maxMenuItems: null,
      supportLevel: '24/7' as const,
      isActive: true as const,
      features: [
        'Unlimited users',
        'Everything in Growth plan',
        'Multi-branch support',
        'Consolidated + per-branch reporting',
        'Profit Leak Detection & Controls',
        'Governance workflows (review, resolve, notes)',
        'Priority support',
      ],
    },
    {
      code: 'ENTERPRISE',
      name: 'Enterprise',
      monthlyPriceCents: 15000000,
      annualPriceCents: 12500000,
      description: 'For enterprise rollout, customization, and priority delivery',
      maxUsers: null,
      maxMenuItems: null,
      supportLevel: '24/7' as const,
      isActive: true as const,
      features: [
        'Unlimited users',
        'Everything in Business plan',
        'Advanced customization and implementation support',
        'Custom reporting and KPIs',
        'Training and onboarding package',
        'Priority support and SLA options',
      ],
    },
  ]

  // Inactivate legacy plans if present
  await prisma.plan.updateMany({
    where: { code: { in: ['SMALL', 'MEDIUM', 'LARGE'] } },
    data: { isActive: false },
  })

  const legacyProUsage = await prisma.business.count({
    where: {
      plan: {
        code: 'PRO',
      },
    },
  })

  if (legacyProUsage === 0) {
    await prisma.plan.updateMany({
      where: { code: 'PRO' },
      data: { isActive: false },
    })
  }

  for (const p of PLANS) {
    const existing = await prisma.plan.findUnique({ where: { code: p.code } })
    if (existing) {
      await prisma.plan.update({
        where: { code: p.code },
        data: {
          name: p.name,
          description: p.description,
          priceCents: p.monthlyPriceCents,
          annualPriceCents: p.annualPriceCents,
          currency: 'RWF',
          maxUsers: p.maxUsers,
          maxMenuItems: p.maxMenuItems,
          whatsappIncluded: true,
          supportLevel: p.supportLevel,
          features: p.features,
          isActive: p.isActive,
        },
      })
      console.log(`✅ Updated plan ${p.code}`)
    } else {
      await prisma.plan.create({
        data: {
          code: p.code,
          name: p.name,
          description: p.description,
          priceCents: p.monthlyPriceCents,
          annualPriceCents: p.annualPriceCents,
          currency: 'RWF',
          maxUsers: p.maxUsers,
          maxMenuItems: p.maxMenuItems,
          whatsappIncluded: true,
          supportLevel: p.supportLevel,
          features: p.features,
          isActive: p.isActive,
        },
      })
      console.log(`✅ Created plan ${p.code}`)
    }
  }

  // If legacy codes exist and map 1:1, optionally rename them to new codes.
  // Skipped to avoid code uniqueness collisions in existing installs.

  console.log('🎉 Plans updated successfully')
}

main()
  .catch((e) => {
    console.error('❌ Failed to update plans:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
