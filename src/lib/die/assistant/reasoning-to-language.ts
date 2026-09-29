import type { BusinessInsight } from '@/lib/die/business-intelligence/reasoning-engine'


function pickHighestConfidence(insights: BusinessInsight[], types: BusinessInsight['type'][]): BusinessInsight | undefined {
  return insights
    .filter((i) => types.includes(i.type))
    .sort((a, b) => (b.severity === 'CRITICAL' ? 1 : 0) - (a.severity === 'CRITICAL' ? 1 : 0) || b.confidence - a.confidence)[0]
}

type FinanceSnapshot = Awaited<ReturnType<typeof import('@/lib/die/finance/finance-intelligence').computeFinanceSnapshot>>

export function buildFinanceNarrative(fin: FinanceSnapshot): string {
  if (process.env.DIE_FINANCE_INTELLIGENCE_ENABLED !== 'true') return 'Financial intelligence is disabled.'
  const h = fin.health
  const t = fin.trends
  const parts: string[] = []
  parts.push(`Revenue health score: ${h.revenueHealthScore}.`)
  parts.push(`Failure rate: ${h.paymentFailureRate}%. Refund rate: ${h.refundRate}%. Collection efficiency: ${h.collectionEfficiencyScore}%.`)
  if (t.day.revenue.direction === 'RISING') parts.push('Revenue is improving vs yesterday.')
  if (t.day.revenue.direction === 'FALLING') parts.push('Revenue is declining vs yesterday.')
  if (t.week.revenue.direction === 'RISING') parts.push('Week-over-week revenue trend is rising.')
  if (t.week.revenue.direction === 'FALLING') parts.push('Week-over-week revenue trend is falling.')
  if (t.day.failures.direction === 'RISING') parts.push('Payment failures are increasing today.')
  if (t.day.refunds.direction === 'RISING') parts.push('Refunds are increasing today.')
  if (t.day.topProvider && t.day.topProvider.direction === 'RISING') parts.push(`Provider ${String(t.day.topProvider.gateway)} shows worsening reliability today.`)
  return parts.join(' ')
}

type WindowComparison = ReturnType<typeof import('@/lib/die/assistant/context-cache').getTemporalComparisons>

export function buildTemporalChangeNarratives(t: WindowComparison): { whatChanged: string; improving: string; worsening: string; stable: string } {
  const partsChanged: string[] = []
  const partsImproving: string[] = []
  const partsWorsening: string[] = []
  const partsStable: string[] = []

  const map = [
    ['demand', 'demand'],
    ['operationalPressure', 'operational pressure'],
    ['supplyRisk', 'supply risk'],
    ['customerActivity', 'customer activity'],
  ] as const

  function handle(scope: 'hour' | 'day' | 'week', label: string) {
    // @ts-ignore
    const cmp = t[scope]
    for (const [k, name] of map) {
      // @ts-ignore
      const c = cmp[k]
      if (!c) continue
      if (c.direction === 'RISING') partsWorsening.push(`${label}: ${name} rising (Δ=${c.momentum})`)
      else if (c.direction === 'FALLING') partsImproving.push(`${label}: ${name} improving (Δ=${c.momentum})`)
      else if (c.direction === 'VOLATILE') partsChanged.push(`${label}: ${name} volatile`)
      else partsStable.push(`${label}: ${name} stable`)
    }
  }

  handle('hour', 'last hour')
  handle('day', 'today vs yesterday')
  handle('week', 'last 7 days')

  return {
    whatChanged: partsChanged.length ? `What changed: ${partsChanged.slice(0, 4).join('; ')}.` : '',
    improving: partsImproving.length ? `Improving: ${partsImproving.slice(0, 4).join('; ')}.` : '',
    worsening: partsWorsening.length ? `Worsening: ${partsWorsening.slice(0, 4).join('; ')}.` : '',
    stable: partsStable.length ? `Stable: ${partsStable.slice(0, 4).join('; ')}.` : '',
  }
}

export function insightToExplanation(i: BusinessInsight): string {
  const sev = i.severity.toLowerCase()
  const detail = i.explanation
  return `${i.type.replaceAll('_', ' ')} (${sev}): ${detail}`
}

export function buildRevenuePressureExplanation(insights: BusinessInsight[]): string {
  const hit = pickHighestConfidence(insights, ['REVENUE_RISK_DETECTED'])
  if (!hit) return 'Revenue pressure is currently low with no material payment or fulfillment risks observed.'
  return `Revenue risk rising: ${hit.explanation}`
}

export function buildOperationalRiskExplanation(insights: BusinessInsight[]): string {
  const op = pickHighestConfidence(insights, ['KITCHEN_BOTTLENECK_IDENTIFIED', 'OPERATIONAL_CONGESTION'])
  if (!op) return 'Operational flow is stable; no significant congestion or kitchen bottlenecks detected.'
  return `Operational risk: ${op.explanation}`
}

export function buildSupplyChainExplanation(insights: BusinessInsight[]): string {
  const sc = pickHighestConfidence(insights, ['SUPPLY_CHAIN_DEGRADATION'])
  if (!sc) return 'Supply chain appears stable; no notable supplier or procurement issues in the recent window.'
  return `Supply chain degradation: ${sc.explanation}`
}

export function buildCustomerExperienceExplanation(insights: BusinessInsight[]): string {
  const cx = pickHighestConfidence(insights, ['CUSTOMER_CHURN_RISK', 'TABLE_TURNOVER_INEFFICIENCY'])
  if (!cx) return 'Customer experience signals are steady with no churn or table-turnover concerns flagged.'
  return `Customer experience risk: ${cx.explanation}`
}

export function buildDailySummary(insights: BusinessInsight[]): string {
  const demand = pickHighestConfidence(insights, ['DEMAND_SURGE_DETECTED'])
  const op = pickHighestConfidence(insights, ['KITCHEN_BOTTLENECK_IDENTIFIED', 'OPERATIONAL_CONGESTION'])
  const sc = pickHighestConfidence(insights, ['SUPPLY_CHAIN_DEGRADATION'])
  const rev = pickHighestConfidence(insights, ['REVENUE_RISK_DETECTED'])

  const parts: string[] = []
  if (op) parts.push(op.explanation)
  if (demand) parts.push('Demand is elevated in the recent window.')
  if (sc) parts.push('Supply chain is showing degradation signals.')
  if (rev) parts.push('Revenue risk is rising due to exceptions in payment/fulfillment flows.')
  return parts.length ? parts.join(' ') : 'Operations steady; no major risks detected in the latest interval.'
}

export function selectRisks(insights: BusinessInsight[]): string[] {
  const riskTypes: BusinessInsight['type'][] = [
    'REVENUE_RISK_DETECTED',
    'KITCHEN_BOTTLENECK_IDENTIFIED',
    'SUPPLY_CHAIN_DEGRADATION',
    'CUSTOMER_CHURN_RISK',
    'OPERATIONAL_CONGESTION',
    'TABLE_TURNOVER_INEFFICIENCY',
  ]
  return insights
    .filter((i) => riskTypes.includes(i.type))
    .sort((a, b) => (a.severity === 'CRITICAL' ? 1 : 0) - (b.severity === 'CRITICAL' ? 1 : 0) || b.confidence - a.confidence)
    .slice(0, 5)
    .map(insightToExplanation)
}

export function selectOpportunities(insights: BusinessInsight[]): string[] {
  const opp: string[] = []
  const demand = insights.find((i) => i.type === 'DEMAND_SURGE_DETECTED')
  if (demand) opp.push('Capitalize on current demand surge with staffing alignment and kitchen pacing.')
  const cx = insights.find((i) => i.type === 'CUSTOMER_CHURN_RISK')
  if (cx) opp.push('Re-engage inactive segments and promote loyalty redemption opportunities.')
  const tt = insights.find((i) => i.type === 'TABLE_TURNOVER_INEFFICIENCY')
  if (tt) opp.push('Improve table turnover through proactive bill-ready prompts and service cadence.')
  return opp.slice(0, 5)
}

export function recommendFocusAreas(insights: BusinessInsight[]): string[] {
  const areas: string[] = []
  if (insights.some((i) => i.type === 'REVENUE_RISK_DETECTED')) areas.push('Payments & Fulfillment Reliability')
  if (insights.some((i) => i.type === 'KITCHEN_BOTTLENECK_IDENTIFIED')) areas.push('Kitchen Throughput & Expedite')
  if (insights.some((i) => i.type === 'SUPPLY_CHAIN_DEGRADATION')) areas.push('Supplier SLAs & Procurement Cycle Time')
  if (insights.some((i) => i.type === 'CUSTOMER_CHURN_RISK')) areas.push('Customer Engagement & Loyalty')
  if (insights.some((i) => i.type === 'TABLE_TURNOVER_INEFFICIENCY')) areas.push('Table Turnover Efficiency')
  return areas.slice(0, 5)
}
