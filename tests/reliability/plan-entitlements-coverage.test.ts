/**
 * Plan Entitlements Coverage — UAT blocker regression
 *
 * The dev/UAT database contains six Plan codes:
 *   STARTER, ESSENTIALS, PROFESSIONAL, GROWTH, BUSINESS, ENTERPRISE
 * (`PREMIUM` is a recognized code not present in the dev DB.)
 *
 * Previously PlanCode/getPlanEntitlements only recognized five codes, so
 * GROWTH and ESSENTIALS fell through to baseEntitlements (nearly all gates
 * false) and legitimate tenants received HTTP 402 on every gated feature.
 *
 * Tier order established by Plan.features JSON + priceCents in the DB:
 *   STARTER < ESSENTIALS < PROFESSIONAL < GROWTH < BUSINESS < ENTERPRISE
 *   - ESSENTIALS: "Everything in Starter plan" + reports, low stock alerts,
 *     improved inventory controls, priority support
 *   - GROWTH: "Everything in Professional plan" + AI Smart Reorder
 *     Recommendations, AI Cost Anomaly Alerts, Insights dashboard
 */

import {
  getPlanEntitlements,
  hasFeatureAccess,
  getUpgradePlanForFeature,
  PlanCode,
  PlanEntitlements,
} from '../../src/lib/plan-entitlements'

// Reference to baseEntitlements: an unrecognized code falls through to default
const BASE = getPlanEntitlements('__UNKNOWN__' as PlanCode)

const DB_PLAN_CODES: PlanCode[] = [
  'STARTER',
  'ESSENTIALS',
  'PROFESSIONAL',
  'GROWTH',
  'BUSINESS',
  'ENTERPRISE',
]

describe('plan-entitlements coverage', () => {
  it('every Plan code present in the database resolves to explicit entitlements', () => {
    for (const code of DB_PLAN_CODES) {
      expect(getPlanEntitlements(code)).not.toEqual(BASE)
    }
  })

  it('unrecognized codes still fall through to baseEntitlements (fail closed)', () => {
    expect(BASE.hasTables).toBe(false)
    expect(BASE.hasQRCodes).toBe(false)
    expect(BASE.hasOrders).toBe(false)
  })

  it('GROWTH does not fall through and inherits Professional-tier gates', () => {
    const growth = getPlanEntitlements('GROWTH')
    const professional = getPlanEntitlements('PROFESSIONAL')

    // Everything in Professional (excluding documented GROWTH additions)
    const growthAdditions: (keyof PlanEntitlements)[] = [
      'hasInventoryAutoReorder',
      'hasAICostAnomalies',
      'hasOptimizationInsights',
    ]
    for (const key of Object.keys(professional) as (keyof PlanEntitlements)[]) {
      if (growthAdditions.includes(key)) continue
      expect(growth[key]).toEqual(professional[key])
    }

    // GROWTH additions per plan features
    expect(growth.hasInventoryAutoReorder).toBe(true)
    expect(growth.hasAICostAnomalies).toBe(true)
    expect(growth.hasOptimizationInsights).toBe(true)
  })

  it('ESSENTIALS does not fall through and inherits Starter-tier gates', () => {
    const essentials = getPlanEntitlements('ESSENTIALS')
    const starter = getPlanEntitlements('STARTER')

    const essentialsAdditions: (keyof PlanEntitlements)[] = [
      'hasInventoryAlerts',
      'supportLevel',
    ]
    for (const key of Object.keys(starter) as (keyof PlanEntitlements)[]) {
      if (essentialsAdditions.includes(key)) continue
      expect(essentials[key]).toEqual(starter[key])
    }

    expect(essentials.hasInventoryAlerts).toBe(true)
    expect(essentials.supportLevel).toBe('priority')
  })

  it('gated first-customer features resolve for GROWTH and ESSENTIALS', () => {
    for (const code of ['GROWTH', 'ESSENTIALS'] as PlanCode[]) {
      expect(hasFeatureAccess(code, 'hasTables')).toBe(true)
      expect(hasFeatureAccess(code, 'hasQRCodes')).toBe(true)
      expect(hasFeatureAccess(code, 'hasOrders')).toBe(true)
      expect(hasFeatureAccess(code, 'hasPayments')).toBe(true)
    }
  })

  it('existing recognized plans retain their current behavior', () => {
    const starter = getPlanEntitlements('STARTER')
    expect(starter.hasTables).toBe(true)
    expect(starter.hasProcurementWorkflow).toBe(false)

    const professional = getPlanEntitlements('PROFESSIONAL')
    expect(professional.hasProcurementWorkflow).toBe(true)
    expect(professional.hasKDS).toBe(false)
    expect(professional.maxBranches).toBe(1)

    const business = getPlanEntitlements('BUSINESS')
    expect(business.hasKDS).toBe(true)
    expect(business.maxBranches).toBe(3)
    expect(business.hasMultiBranchDashboard).toBe(true)

    const premium = getPlanEntitlements('PREMIUM')
    expect(premium.hasKDSAdvanced).toBe(true)
    expect(premium.hasOptimizationHub).toBe(true)
    expect(premium.maxBranches).toBe('unlimited')

    const enterprise = getPlanEntitlements('ENTERPRISE')
    expect(enterprise.hasSSO).toBe(true)
    expect(enterprise.hasDedicatedManager).toBe(true)
  })

  it('upgrade plan suggestions use full tier ordering', () => {
    // Cheapest plan with the feature is suggested
    expect(getUpgradePlanForFeature('hasTables')).toBe('STARTER')
    expect(getUpgradePlanForFeature('hasInventoryAlerts')).toBe('ESSENTIALS')
    expect(getUpgradePlanForFeature('hasProcurementWorkflow')).toBe('PROFESSIONAL')
    expect(getUpgradePlanForFeature('hasOptimizationInsights')).toBe('GROWTH')
    expect(getUpgradePlanForFeature('hasKDS')).toBe('BUSINESS')
  })
})
