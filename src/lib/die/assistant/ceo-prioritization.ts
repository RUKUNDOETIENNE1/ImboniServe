import type { BusinessInsight } from '@/lib/die/business-intelligence/reasoning-engine'

export interface CEOFocusItem {
  domain: string
  reason: string
  impactType: 'REVENUE' | 'OPERATIONS' | 'CUSTOMER' | 'SUPPLY'
  confidence: number
  priorityScore: number
}

function clamp01(n: number) { return Math.max(0, Math.min(1, n)) }

function weightForInsight(i: BusinessInsight): { revenue: number; operations: number; customer: number; supply: number; urgency: number; domain: string; reason: string } {
  const baseUrgency = i.severity === 'CRITICAL' ? 1 : i.severity === 'WARN' ? 0.6 : 0.3
  switch (i.type) {
    case 'REVENUE_RISK_DETECTED':
      return { revenue: 1, operations: 0.2, customer: 0.2, supply: 0.2, urgency: baseUrgency, domain: 'payments', reason: i.explanation }
    case 'REVENUE_DECLINE_DETECTED':
      return { revenue: 1, operations: 0.3, customer: 0.2, supply: 0.2, urgency: Math.max(baseUrgency, 0.7), domain: 'finance', reason: i.explanation }
    case 'REVENUE_GROWTH_DETECTED':
      return { revenue: 0.7, operations: 0.2, customer: 0.2, supply: 0.2, urgency: 0.4, domain: 'finance', reason: i.explanation }
    case 'PAYMENT_PROVIDER_DEGRADATION':
      return { revenue: 0.9, operations: 0.3, customer: 0.3, supply: 0.2, urgency: Math.max(baseUrgency, 0.7), domain: 'payments', reason: i.explanation }
    case 'REFUND_SPIKE_DETECTED':
      return { revenue: 0.8, operations: 0.3, customer: 0.6, supply: 0.2, urgency: baseUrgency, domain: 'finance', reason: i.explanation }
    case 'COLLECTION_RISK_DETECTED':
      return { revenue: 1, operations: 0.4, customer: 0.3, supply: 0.2, urgency: Math.max(baseUrgency, 0.8), domain: 'payments', reason: i.explanation }
    case 'FINANCIAL_HEALTH_WARNING':
      return { revenue: 0.9, operations: 0.4, customer: 0.3, supply: 0.2, urgency: baseUrgency, domain: 'finance', reason: i.explanation }
    case 'KITCHEN_BOTTLENECK_IDENTIFIED':
    case 'OPERATIONAL_CONGESTION':
      return { revenue: 0.3, operations: 1, customer: 0.4, supply: 0.2, urgency: baseUrgency, domain: 'kds', reason: i.explanation }
    case 'SUPPLY_CHAIN_DEGRADATION':
      return { revenue: 0.4, operations: 0.4, customer: 0.2, supply: 1, urgency: baseUrgency, domain: 'suppliers', reason: i.explanation }
    case 'CUSTOMER_CHURN_RISK':
    case 'TABLE_TURNOVER_INEFFICIENCY':
      return { revenue: 0.4, operations: 0.3, customer: 1, supply: 0.2, urgency: baseUrgency, domain: 'dining-slips', reason: i.explanation }
    case 'DEMAND_SURGE_DETECTED':
      return { revenue: 0.5, operations: 0.7, customer: 0.3, supply: 0.2, urgency: baseUrgency, domain: 'reservations', reason: i.explanation }
    case 'CAMPAIGN_EFFECTIVENESS_DROP':
      return { revenue: 0.5, operations: 0.2, customer: 0.5, supply: 0.2, urgency: baseUrgency, domain: 'campaigns', reason: i.explanation }
    default:
      return { revenue: 0.2, operations: 0.2, customer: 0.2, supply: 0.2, urgency: baseUrgency, domain: 'core', reason: i.explanation }
  }
}

export function prioritizeForCEO(insights: BusinessInsight[]): CEOFocusItem[] {
  const items: CEOFocusItem[] = []
  for (const i of insights) {
    const w = weightForInsight(i)
    const baseScore = (w.revenue * 0.4) + (w.operations * 0.3) + (w.customer * 0.2) + (w.urgency * 0.1)
    const trust = typeof (i as any).trustScore === 'number' ? Math.max(0, Math.min(100, (i as any).trustScore)) / 100 : 0.5
    const score = Math.max(0, Math.min(1, baseScore * 0.6 + trust * 0.4))
    const impactType: CEOFocusItem['impactType'] =
      w.revenue >= w.operations && w.revenue >= w.customer && w.revenue >= w.supply ? 'REVENUE'
      : w.operations >= w.customer && w.operations >= w.supply ? 'OPERATIONS'
      : w.customer >= w.supply ? 'CUSTOMER' : 'SUPPLY'
    items.push({
      domain: w.domain,
      reason: w.reason,
      impactType,
      confidence: clamp01(i.confidence),
      priorityScore: clamp01(score),
    })
  }
  return items
    .sort((a, b) => b.priorityScore - a.priorityScore || b.confidence - a.confidence)
    .slice(0, 5)
}
