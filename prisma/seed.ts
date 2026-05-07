import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')
  
  // Clear existing data
  await prisma.account.deleteMany()
  await prisma.session.deleteMany()
  await prisma.whatsAppMessage.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.subscription.deleteMany()
  await prisma.marketplaceOrderItem.deleteMany()
  await prisma.marketplaceOrder.deleteMany()
  await prisma.marketplaceProduct.deleteMany()
  await prisma.supplierDelivery.deleteMany()
  await prisma.supplierOrderItem.deleteMany()
  await prisma.supplierOrder.deleteMany()
  await prisma.supplierProduct.deleteMany()
  await prisma.supplier.deleteMany()
  await prisma.inventoryUpdate.deleteMany()
  await prisma.inventoryItem.deleteMany()
  await prisma.saleItem.deleteMany()
  await prisma.sale.deleteMany()
  await prisma.menuItem.deleteMany()
  await prisma.business.deleteMany()
  await prisma.user.deleteMany()
  await prisma.plan.deleteMany()
  
  // Create subscription plans
  const plans = await Promise.all([
    prisma.plan.create({
      data: {
        name: 'Starter',
        code: 'STARTER',
        description: 'For small hospitality businesses getting started',
        priceCents: 1000000, // 10,000 RWF monthly
        annualPriceCents: 9000000, // 90,000 RWF/year (7,500/month)
        currency: 'RWF',
        maxUsers: null,
        maxMenuItems: 50,
        whatsappIncluded: true,
        supportLevel: 'EMAIL',
        features: [
          'Unlimited users',
          'Sales tracking',
          'Inventory tracking',
          'Daily reports',
          'WhatsApp notifications',
          'Email support',
          'Mobile money support'
        ],
        isActive: true
      }
    }),
    prisma.plan.create({
      data: {
        name: 'Essentials',
        code: 'ESSENTIALS',
        description: 'For stable operations that need tighter control',
        priceCents: 1350000, // 13,500 RWF monthly
        annualPriceCents: 12000000, // 120,000 RWF/year (10,000/month)
        currency: 'RWF',
        maxUsers: null,
        maxMenuItems: 200,
        whatsappIncluded: true,
        supportLevel: 'PRIORITY',
        features: [
          'Unlimited users',
          'Everything in Starter plan',
          'Weekly & monthly reports',
          'Low stock alerts',
          'Priority support',
          'Improved inventory controls'
        ],
        isActive: true
      }
    }),
    prisma.plan.create({
      data: {
        name: 'Professional',
        code: 'PROFESSIONAL',
        description: 'For teams that run procurement and stock with discipline',
        priceCents: 2000000, // 20,000 RWF monthly
        annualPriceCents: 18000000, // 180,000 RWF/year (15,000/month)
        currency: 'RWF',
        maxUsers: null,
        maxMenuItems: null,
        whatsappIncluded: true,
        supportLevel: 'PRIORITY',
        features: [
          'Unlimited users',
          'Everything in Essentials plan',
          'Procurement workflow (PO + GRN)',
          'Audit-friendly tracking and exports',
          'Advanced reporting',
          'Phone support'
        ],
        isActive: true
      }
    }),
    prisma.plan.create({
      data: {
        name: 'Growth',
        code: 'GROWTH',
        description: 'For growing businesses that want AI-powered insights',
        priceCents: 6700000, // 67,000 RWF monthly
        annualPriceCents: 60000000, // 600,000 RWF/year (50,000/month)
        currency: 'RWF',
        maxUsers: null,
        maxMenuItems: null,
        whatsappIncluded: true,
        supportLevel: 'PRIORITY',
        features: [
          'Unlimited users',
          'Everything in Professional plan',
          'AI: Smart Reorder Recommendations',
          'AI: Cost Anomaly Alerts',
          'Insights dashboard',
          'Priority support'
        ],
        isActive: true
      }
    }),
    prisma.plan.create({
      data: {
        name: 'Business',
        code: 'BUSINESS',
        description: 'For hotel groups and chains that need multi-branch control',
        priceCents: 13500000, // 135,000 RWF monthly
        annualPriceCents: 120000000, // 1,200,000 RWF/year (100,000/month)
        currency: 'RWF',
        maxUsers: null,
        maxMenuItems: null,
        whatsappIncluded: true,
        supportLevel: '24/7',
        features: [
          'Unlimited users',
          'Everything in Growth plan',
          'Multi-branch support',
          'Consolidated + per-branch reporting',
          'Profit Leak Detection & Controls',
          'Governance workflows (review, resolve, notes)',
          'Priority support'
        ],
        isActive: true
      }
    }),
    prisma.plan.create({
      data: {
        name: 'Enterprise',
        code: 'ENTERPRISE',
        description: 'For enterprise rollout, customization, and priority delivery',
        priceCents: 33500000, // 335,000 RWF monthly
        annualPriceCents: 300000000, // 3,000,000 RWF/year (250,000/month)
        currency: 'RWF',
        maxUsers: null,
        maxMenuItems: null,
        whatsappIncluded: true,
        supportLevel: '24/7',
        features: [
          'Unlimited users',
          'Everything in Business plan',
          'Advanced customization and implementation support',
          'Custom reporting and KPIs',
          'Training and onboarding package',
          'Priority support and SLA options'
        ],
        isActive: true
      }
    })
  ])
  
  // Create admin user
  const adminPassword = await bcrypt.hash('Admin123!', 12)
  const admin = await prisma.user.create({
    data: {
      name: 'System Administrator',
      email: 'admin@imboni.resto',
      password: adminPassword,
      phone: '+250788000001',
      roles: ['ADMIN'],
      whatsappEnabled: true,
      whatsappNumber: '+250788000001',
      isActive: true
    }
  })
  
  // Create restaurant owner
  const ownerPassword = await bcrypt.hash('Owner123!', 12)
  const owner = await prisma.user.create({
    data: {
      name: 'Jean Niyonzima',
      email: 'jean@nyamacafe.rw',
      password: ownerPassword,
      phone: '+250788123456',
      roles: ['OWNER'],
      whatsappEnabled: true,
      whatsappNumber: '+250788123456',
      isActive: true
    }
  })
  
  // Create restaurant
  const restaurant = await prisma.business.create({
    data: {
      name: 'Nyama Cafe Kigali',
      description: 'Best grilled meat in Kigali',
      address: 'KN 4 Ave, Kigali',
      city: 'Kigali',
      district: 'Gasabo',
      country: 'RW',
      latitude: -1.9536,
      longitude: 30.0606,
      phone: '+250788123456',
      whatsappNumber: '+250788123456',
      ownerId: owner.id,
      planId: plans[3].id, // Growth plan
      currency: 'RWF',
      isActive: true
    }
  })
  
  // Update owner with restaurant
  await prisma.user.update({
    where: { id: owner.id },
    data: { businessId: restaurant.id }
  })
  
  // Create staff users
  const cashierPassword = await bcrypt.hash('Cashier123!', 12)
  const cashier = await prisma.user.create({
    data: {
      name: 'Marie Uwimana',
      email: 'marie@nyamacafe.rw',
      password: cashierPassword,
      phone: '+250788123457',
      roles: ['CASHIER'],
      businessId: restaurant.id,
      isActive: true
    }
  })
  
  const kitchenPassword = await bcrypt.hash('Kitchen123!', 12)
  const kitchenManager = await prisma.user.create({
    data: {
      name: 'Eric Tuyishime',
      email: 'eric@nyamacafe.rw',
      password: kitchenPassword,
      phone: '+250788123458',
      roles: ['KITCHEN_MANAGER'],
      businessId: restaurant.id,
      isActive: true
    }
  })
  
  // Create menu items
  const menuItems = await Promise.all([
    prisma.menuItem.create({
      data: {
        name: 'Nyama Choma (Beef)',
        description: 'Grilled beef with Kachumbari',
        priceCents: 800000, // 8,000 RWF
        costCents: 300000, // 3,000 RWF
        category: 'Main Course',
        isAvailable: true,
        businessId: restaurant.id
      }
    }),
    prisma.menuItem.create({
      data: {
        name: 'Grilled Tilapia',
        description: 'Whole grilled fish with vegetables',
        priceCents: 1200000, // 12,000 RWF
        costCents: 500000, // 5,000 RWF
        category: 'Main Course',
        isAvailable: true,
        businessId: restaurant.id
      }
    }),
    prisma.menuItem.create({
      data: {
        name: 'Chicken Brochette',
        description: 'Skewered chicken pieces',
        priceCents: 600000, // 6,000 RWF
        costCents: 250000, // 2,500 RWF
        category: 'Main Course',
        isAvailable: true,
        businessId: restaurant.id
      }
    }),
    prisma.menuItem.create({
      data: {
        name: 'Fanta 500ml',
        description: 'Cold bottle',
        priceCents: 100000, // 1,000 RWF
        costCents: 40000, // 400 RWF
        category: 'Drinks',
        isAvailable: true,
        businessId: restaurant.id
      }
    })
  ])
  
  // Create subscription
  const subscription = await prisma.subscription.create({
    data: {
      businessId: restaurant.id,
      planId: plans[3].id,
      status: 'ACTIVE',
      amountCents: 6700000, // 67,000 RWF
      currency: 'RWF',
      paymentMethod: 'PESAPAL_CARD',
      paymentReference: 'PES-123456',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isAutoRenew: true
    }
  })

  // Create suppliers with locations
  const supplierPassword = await bcrypt.hash('Supplier123!', 12)
  const supplier1User = await prisma.user.create({
    data: {
      name: 'Patrick Mugabo',
      email: 'patrick@freshfoods.rw',
      password: supplierPassword,
      phone: '+250788200001',
      roles: ['SUPPLIER', 'OWNER'],
      whatsappEnabled: true,
      isActive: true
    }
  })

  const supplier1 = await prisma.supplier.create({
    data: {
      name: 'Fresh Foods Rwanda',
      description: 'Premium meat and vegetables supplier',
      contactName: 'Patrick Mugabo',
      email: 'patrick@freshfoods.rw',
      phone: '+250788200001',
      whatsappNumber: '+250788200001',
      address: 'Kimironko Market',
      city: 'Kigali',
      district: 'Gasabo',
      country: 'RW',
      latitude: -1.9442,
      longitude: 30.1056,
      isVerified: true,
      isActive: true
    }
  })

  await prisma.user.update({
    where: { id: supplier1User.id },
    data: { supplierId: supplier1.id }
  })

  const supplier2 = await prisma.supplier.create({
    data: {
      name: 'Kigali Beverages Ltd',
      description: 'Wholesale drinks and beverages',
      contactName: 'Grace Uwera',
      email: 'grace@kigalibev.rw',
      phone: '+250788200002',
      whatsappNumber: '+250788200002',
      address: 'Nyabugogo',
      city: 'Kigali',
      district: 'Nyarugenge',
      country: 'RW',
      latitude: -1.9706,
      longitude: 30.0587,
      isVerified: true,
      isActive: true
    }
  })

  const supplier3 = await prisma.supplier.create({
    data: {
      name: 'Agro Supplies Rwanda',
      description: 'Farm fresh vegetables and spices',
      contactName: 'Emmanuel Habimana',
      email: 'info@agrosupplies.rw',
      phone: '+250788200003',
      address: 'Remera',
      city: 'Kigali',
      district: 'Gasabo',
      country: 'RW',
      isVerified: true,
      isActive: true
    }
  })

  // Create marketplace products
  const marketplaceProducts = await Promise.all([
    prisma.marketplaceProduct.create({
      data: {
        supplierId: supplier1.id,
        name: 'Premium Beef',
        description: 'Grade A beef cuts, perfect for grilling',
        category: 'Meat',
        unit: 'kg',
        unitPriceCents: 1200000, // 12,000 RWF
        minOrderQuantity: 5,
        isAvailable: true,
        isFeatured: true
      }
    }),
    prisma.marketplaceProduct.create({
      data: {
        supplierId: supplier1.id,
        name: 'Fresh Chicken',
        description: 'Locally raised chicken',
        category: 'Meat',
        unit: 'kg',
        unitPriceCents: 800000, // 8,000 RWF
        minOrderQuantity: 3,
        isAvailable: true,
        isFeatured: true
      }
    }),
    prisma.marketplaceProduct.create({
      data: {
        supplierId: supplier2.id,
        name: 'Fanta Orange 500ml (Crate)',
        description: '24 bottles per crate',
        category: 'Beverages',
        unit: 'crate',
        unitPriceCents: 960000, // 9,600 RWF
        minOrderQuantity: 1,
        isAvailable: true,
        isFeatured: true
      }
    }),
    prisma.marketplaceProduct.create({
      data: {
        supplierId: supplier2.id,
        name: 'Coca Cola 500ml (Crate)',
        description: '24 bottles per crate',
        category: 'Beverages',
        unit: 'crate',
        unitPriceCents: 1000000, // 10,000 RWF
        minOrderQuantity: 1,
        isAvailable: true,
        isFeatured: true
      }
    }),
    prisma.marketplaceProduct.create({
      data: {
        supplierId: supplier3.id,
        name: 'Fresh Tomatoes',
        description: 'Locally grown tomatoes',
        category: 'Vegetables',
        unit: 'kg',
        unitPriceCents: 150000, // 1,500 RWF
        minOrderQuantity: 10,
        isAvailable: true,
        isFeatured: false
      }
    }),
    prisma.marketplaceProduct.create({
      data: {
        supplierId: supplier3.id,
        name: 'Onions',
        description: 'Fresh red onions',
        category: 'Vegetables',
        unit: 'kg',
        unitPriceCents: 120000, // 1,200 RWF
        minOrderQuantity: 5,
        isAvailable: true,
        isFeatured: false
      }
    })
  ])

  // Create sample marketplace order
  await prisma.marketplaceOrder.create({
    data: {
      orderNumber: `MKT-${Date.now()}-001`,
      businessId: restaurant.id,
      userId: owner.id,
      totalAmountCents: 6000000, // 60,000 RWF
      paymentMethod: 'MTN_MOBILE_MONEY',
      paymentStatus: 'PENDING',
      status: 'CONFIRMED',
      deliveryAddress: 'KN 4 Ave, Kigali',
      deliveryCity: 'Kigali',
      deliveryDistrict: 'Gasabo',
      items: {
        create: [
          {
            productId: marketplaceProducts[0].id,
            quantity: 5,
            unitPriceCents: 1200000,
            totalPriceCents: 6000000
          }
        ]
      }
    }
  })

  // Create demo affiliate
  const demoAffiliate = await prisma.affiliate.create({
    data: {
      code: 'IMBONI-DEMO',
      name: 'Demo Affiliate Partner',
      status: 'ACTIVE',
      commissionRatePercent: 15.0
    }
  })

  // Seed feature flags (safe upsert — runs every deploy)
  const featureFlags = [
    { key: 'advanced_analytics', name: 'Advanced Analytics', enabled: false, autoEnableThreshold: 10, planGated: false, minimumPlan: null },
    { key: 'multi_language', name: 'Multi-Language Menus', enabled: false, autoEnableThreshold: 10, planGated: false, minimumPlan: null },
    { key: 'multi_branch', name: 'Multi-Branch Management', enabled: false, autoEnableThreshold: 15, planGated: true, minimumPlan: 'BUSINESS' },
    { key: 'ai_menu_builder', name: 'AI Smart Menu Builder', enabled: false, autoEnableThreshold: 20, planGated: false, minimumPlan: null },
    { key: 'loyalty_system', name: 'Customer Loyalty Program', enabled: false, autoEnableThreshold: 20, planGated: true, minimumPlan: 'PROFESSIONAL' },
    { key: 'discovery_marketplace', name: 'Restaurant Discovery', enabled: false, autoEnableThreshold: 20, planGated: false, minimumPlan: null },
    { key: 'promotions_engine', name: 'Promotions & Happy Hours', enabled: false, autoEnableThreshold: 25, planGated: true, minimumPlan: 'PROFESSIONAL' },
    { key: 'hotel_mode', name: 'Hotel & Resort Mode', enabled: false, autoEnableThreshold: null, planGated: true, minimumPlan: 'BUSINESS' },
    { key: 'whatsapp_cloud_api', name: 'WhatsApp Cloud API', enabled: true, autoEnableThreshold: null, planGated: true, minimumPlan: 'ESSENTIALS' },
    { key: 'configurable_reports', name: 'Configurable Daily Reports', enabled: true, autoEnableThreshold: null, planGated: false, minimumPlan: null },
    
    // Site Builder Phase 1 (Active Now)
    { key: 'site_builder_templates_v1', name: 'Site Builder: Templates v1', enabled: true, autoEnableThreshold: null, planGated: false, minimumPlan: null },
    { key: 'site_builder_ai_copy_v1', name: 'Site Builder: AI Copy Assistant v1', enabled: true, autoEnableThreshold: null, planGated: false, minimumPlan: null },
    { key: 'site_builder_custom_domain_v1', name: 'Site Builder: Custom Domain v1', enabled: true, autoEnableThreshold: null, planGated: false, minimumPlan: null },
    { key: 'site_builder_badge_enforcement', name: 'Site Builder: Badge Enforcement', enabled: true, autoEnableThreshold: null, planGated: false, minimumPlan: null },
    
    // Site Builder Phase 2 (Autopilot: 30 sites, 1K visits, 98% AI success)
    { key: 'site_builder_templates_expanded_v2', name: 'Site Builder: Templates Expanded v2', enabled: false, autoEnableThreshold: 30, planGated: false, minimumPlan: null },
    { key: 'site_builder_ai_theme_tuning_v2', name: 'Site Builder: AI Theme Tuning v2', enabled: false, autoEnableThreshold: 30, planGated: false, minimumPlan: null },
    { key: 'site_builder_domain_automation_v2', name: 'Site Builder: Domain Automation v2', enabled: false, autoEnableThreshold: 30, planGated: false, minimumPlan: null },
    
    // Site Builder Phase 3 (Autopilot: 100 sites, 25 domains, 10K visits)
    { key: 'site_builder_templates_100_plus', name: 'Site Builder: 100+ Templates', enabled: false, autoEnableThreshold: 100, planGated: false, minimumPlan: null },
    { key: 'site_builder_domain_automation_full', name: 'Site Builder: Full Domain Automation', enabled: false, autoEnableThreshold: 100, planGated: false, minimumPlan: null },
    
    // Site Builder Kill Switch
    { key: 'site_builder_kill_switch', name: 'Site Builder: Kill Switch', enabled: false, autoEnableThreshold: null, planGated: false, minimumPlan: null },
  ]

  for (const flag of featureFlags) {
    await (prisma as any).featureFlag.upsert({
      where: { key: flag.key },
      update: { name: flag.name, autoEnableThreshold: flag.autoEnableThreshold, planGated: flag.planGated, minimumPlan: flag.minimumPlan },
      create: flag,
    })
  }
  console.log(`🚩 ${featureFlags.length} feature flags seeded`)

  console.log('✅ Database seeded successfully!')
  console.log('🔗 Demo affiliate code: IMBONI-DEMO')
  console.log('================================')
  console.log('📋 Login Credentials:')
  console.log('Admin: admin@imboni.resto / Admin123!')
  console.log('Owner: jean@nyamacafe.rw / Owner123!')
  console.log('Cashier: marie@nyamacafe.rw / Cashier123!')
  console.log('Kitchen: eric@nyamacafe.rw / Kitchen123!')
  console.log('Supplier: patrick@freshfoods.rw / Supplier123!')
  console.log('================================')
  console.log('📦 Marketplace:')
  console.log(`${marketplaceProducts.length} products created`)
  console.log(`${3} suppliers created`)
  console.log('================================')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })