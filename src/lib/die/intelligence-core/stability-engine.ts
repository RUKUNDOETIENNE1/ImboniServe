import { getTemporalComparisons } from '@/lib/die/assistant/context-cache'
import type { BusinessInsight } from '@/lib/die/business-intelligence/reasoning-engine'

export type StabilityLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export interface StabilityScore {
  level: StabilityLevel
  score: number // 0..1
}

function pickMetricForInsight(i: BusinessInsight): keyof ReturnType<typeof getTemporalComparisons>['hour'] | null {
  switch (i.type) {
    case 'DEMAND_SURGE_DETECTED': return 'demand'
    case 'KITCHEN_BOTTLENECK_IDENTIFIED':
    case 'OPERATIONAL_CONGESTION': return 'operationalPressure'
    case 'SUPPLY_CHAIN_DEGRADATION': return 'supplyRisk'
    case 'REVENUE_RISK_DETECTED':
    case 'REVENUE_DECLINE_DETECTED':
    case 'REVENUE_GROWTH_DETECTED': return 'risk' // proxy
    default: return null
  }
}

export function scoreStability(i: BusinessInsight): StabilityScore {
  try {
    const t = getTemporalComparisons()
    const key = pickMetricForInsight(i)
    if (!key) return { level: 'LOW', score: 0.3 }
    // @ts-ignore
    const h = t.hour[key]
    // @ts-ignore
    const d = t.day[key]
    // @ts-ignore
    const w = t.week[key]
    let score = 0
    if (h?.direction === d?.direction && (h?.direction === 'RISING' || h?.direction === 'FALLING')) score += 0.4
    if (d?.direction === w?.direction && (d?.direction === 'RISING' || d?.direction === 'FALLING')) score += 0.4
    if ((h?.momentum || 0) !== 0) score += 0.1
    if ((d?.momentum || 0) !== 0) score += 0.1
    const level: StabilityLevel = score > 0.7 ? 'HIGH' : score > 0.45 ? 'MEDIUM' : 'LOW'
    return { level, score: Math.min(1, score) }
  } catch {
    return { level: 'LOW', score: 0.3 }
  }
}
