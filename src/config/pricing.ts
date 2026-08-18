/**
 * Unified Pricing Configuration
 * Single source of truth for all pricing across the platform
 * All prices in RWF (base currency)
 * 
 * PRICING LOGIC:
 * - annualMonthlyRWF = Base rate (when paid annually)
 * - monthlyPriceRWF = Base rate + 25% convenience premium
 * - Formula: monthlyPriceRWF = annualMonthlyRWF × 1.25
 * - annualTotalRWF = annualMonthlyRWF × 12
 */

export interface PlanConfig {
  code: string
  name: string
  monthlyPriceRWF: number | null // Monthly billing price (base + 25% premium)
  annualMonthlyRWF: number | null // Monthly equivalent when billed annually (base rate)
  annualTotalRWF: number | null // Total annual price (annualMonthlyRWF × 12)
  description: string
  popular?: boolean
  badge?: string
  features: string[]
}

/**
 * Official pricing plans
 * Base currency: RWF
 * Monthly billing includes 25% convenience premium over annual rate
 */
export const PRICING_PLANS: PlanConfig[] = [
  {
    code: 'STARTER',
    name: 'Starter',
    monthlyPriceRWF: 18750,
    annualMonthlyRWF: 15000,
    annualTotalRWF: 180000,
    description: 'Perfect for small cafés and food stalls getting started',
    features: [
      'Unlimited users',
      'Orders & Tables management',
      'Kitchen tickets',
      'Basic Inventory tracking',
      'Basic Supplier orders',
      'Mobile Money payments',
      'Daily & weekly reports',
      'Referrals',
      'Discovery basic listing',
      'QR Menu Builder (5 codes)',
      'Smart Dining Slips',
      '20 AI credits/month',
      '2 GB storage',
      '1 branch, 1 outlet',
      'Standard support',
    ],
    popular: false,
  },
  {
    code: 'PROFESSIONAL',
    name: 'Professional',
    monthlyPriceRWF: 43750,
    annualMonthlyRWF: 35000,
    annualTotalRWF: 420000,
    description: 'For established hospitality businesses growing operations',
    popular: true,
    features: [
      'Everything in Starter',
      'Reservations',
      'Inventory alerts',
      'Procurement workflow',
      'Staff management',
      'Role-based access control',
      'Payment monitor',
      'Payment analytics',
      'Menu performance analytics',
      'Peak hours analytics',
      'CRM with RFM segmentation',
      'QR Builder (20 codes)',
      '50 AI credits/month',
      '5 GB storage',
      '1 branch, unlimited outlets',
      'Priority support',
    ]
  },
  {
    code: 'BUSINESS',
    name: 'Business',
    monthlyPriceRWF: 93750,
    annualMonthlyRWF: 75000,
    annualTotalRWF: 900000,
    description: 'For hotels, chains, and high-volume hospitality businesses scaling operations',
    popular: false,
    badge: '🏢 Multi-Branch',
    features: [
      'Everything in Professional',
      'Multi-branch (up to 3 branches)',
      'Multi-branch dashboard',
      'Kitchen Display System (KDS)',
      'Supplier orders (enhanced)',
      'Delivery confirmation',
      'QR analytics',
      'QR analytics deep-dive',
      'Menu performance by branch',
      'Payment analytics pro',
      'Payout reconciliation',
      'QR Builder (unlimited codes)',
      'Discovery (featured listing)',
      'WhatsApp Campaigns',
      '200 AI credits/month',
      '20 GB storage',
      'Priority support',
    ]
  },
  {
    code: 'PREMIUM',
    name: 'Premium',
    monthlyPriceRWF: 250000,
    annualMonthlyRWF: 200000,
    annualTotalRWF: 2400000,
    description: 'Advanced hospitality businesses requiring optimization and intelligence',
    popular: false,
    badge: '👑 Premium',
    features: [
      'Everything in Business',
      'Unlimited branches & outlets',
      'KDS Advanced (course firing, expo mode)',
      'Inventory auto-reorder',
      'AI draft purchase orders',
      'Optimization hub',
      'Service Replay™',
      'A/B Testing for menus',
      'CFO Dashboard',
      'CEO Dashboard',
      'Revenue intelligence',
      'Unlimited AI credits',
      '100 GB storage',
      'Priority support',
    ]
  },
  {
    code: 'ENTERPRISE',
    name: 'Enterprise',
    monthlyPriceRWF: null,
    annualMonthlyRWF: null,
    annualTotalRWF: null,
    description: 'Strategic partnership for large hospitality organizations with specialized requirements',
    features: [
      'Everything in Premium',
      'Custom roles and permissions',
      'Audit exports',
      'Enterprise SLA (guaranteed uptime)',
      'Dedicated account manager',
      'Training and onboarding',
    ],
    popular: false,
  }
]

/**
 * Get plan by code
 */
export function getPlanByCode(code: string): PlanConfig | undefined {
  return PRICING_PLANS.find(p => p.code === code)
}

/**
 * Calculate savings for annual billing
 */
export function calculateAnnualSavings(plan: PlanConfig): number {
  if (!plan.monthlyPriceRWF || !plan.annualMonthlyRWF) return 0
  return (plan.monthlyPriceRWF - plan.annualMonthlyRWF) * 12
}

/**
 * Get discount percentage for annual billing
 */
export function getAnnualDiscountPercent(plan: PlanConfig): number {
  if (!plan.monthlyPriceRWF || !plan.annualMonthlyRWF) return 0
  return Math.round(((plan.monthlyPriceRWF - plan.annualMonthlyRWF) / plan.monthlyPriceRWF) * 100)
}

/**
 * Pricing display configuration
 */
export const PRICING_CONFIG = {
  baseCurrency: 'RWF',
  trialDays: 14,
  launchDiscountPercent: 50, // Launch special: 50% OFF all plans
  supportWhatsApp: '250735214496',
  annualDiscountPercent: 25
}
