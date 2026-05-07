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
    code: 'ESSENTIALS',
    name: 'Essentials',
    monthlyPriceRWF: 12500,
    annualMonthlyRWF: 10000,
    annualTotalRWF: 120000,
    description: 'Perfect for small cafés and food stalls',
    features: [
      'Unlimited users',
      'Orders & Tables management',
      'Kitchen tickets',
      'Basic Inventory tracking',
      'Basic Supplier orders',
      'Mobile Money payments',
      'Daily & weekly reports',
      'Basic CRM',
      'Discovery basic listing',
      'QR Menu Builder (5 codes)',
      'Site Builder preview',
      '20 AI credits/month',
      '1 branch, 1 outlet',
    ],
    popular: false,
  },
  {
    code: 'PROFESSIONAL',
    name: 'Professional',
    monthlyPriceRWF: 25000,
    annualMonthlyRWF: 20000,
    annualTotalRWF: 240000,
    description: 'For established restaurants and cafés',
    popular: true,
    features: [
      'Everything in Essentials',
      'Procurement workflow',
      'Reservations',
      'Staff management',
      'Role-based access',
      'Inventory alerts (basic)',
      'WhatsApp Campaigns (basic)',
      'Payment Monitor & Feedback',
      'Payment Analytics',
      'Menu performance overview',
      'Site Builder Basic',
      '50 AI credits/month',
      '20 QR codes',
      'Multiple outlets',
    ]
  },
  {
    code: 'BUSINESS',
    name: 'Business',
    monthlyPriceRWF: 62500,
    annualMonthlyRWF: 50000,
    annualTotalRWF: 600000,
    description: 'For hotels, chains, and high-volume restaurants',
    popular: false,
    badge: '🏢 Multi-Branch',
    features: [
      'Everything in Professional',
      'Multi-branch (up to 3)',
      'Kitchen Display System',
      'Supplier Portal with delivery confirmation',
      'WhatsApp Campaigns Pro (segments)',
      'Campaign scheduling & templates',
      'A/B Testing Lite (1 concurrent)',
      'QR Analytics deep-dive',
      'Menu performance by branch',
      'Payment Analytics Pro',
      'Payout & reconciliation',
      '✓ Site Builder Pro INCLUDED',
      '✓ Discovery Featured INCLUDED',
      '200 AI credits/month',
      'Unlimited QR codes',
    ]
  },
  {
    code: 'PREMIUM',
    name: 'Premium',
    monthlyPriceRWF: 208334,
    annualMonthlyRWF: 166667,
    annualTotalRWF: 2000000,
    description: 'Complete solution with all features included',
    popular: false,
    badge: '🏢 All Features',
    features: [
      'Everything in Business',
      'Unlimited branches & outlets',
      'KDS Advanced (course firing, expo)',
      'Recipe Management with costing',
      'Inventory auto-reorder',
      'Prep plans & forecasting',
      'WhatsApp Campaign Automation',
      'A/B Testing Unlimited',
      'Optimization Hub',
      'Customer Feedback System',
      'Advanced Reports & BI connectors',
      'Revenue intelligence',
      'White-label options',
      'API access',
      'Priority support',
      'Unlimited AI credits',
      '100 GB storage',
    ]
  },
  {
    code: 'ENTERPRISE',
    name: 'Enterprise',
    monthlyPriceRWF: null,
    annualMonthlyRWF: null,
    annualTotalRWF: null,
    description: 'Custom solutions for large organizations',
    features: [
      'Everything in Premium',
      'Dedicated infrastructure',
      'Custom integrations',
      'Training & Onboarding',
      'Enterprise SLA',
      'Custom development',
      'Dedicated account manager',
      'On-premise deployment',
      'SSO & custom roles',
      'Regional data residency',
      'Custom workflows',
      'Audit exports',
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
