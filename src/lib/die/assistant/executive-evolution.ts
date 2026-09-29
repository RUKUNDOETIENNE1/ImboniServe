import type { BusinessInsight } from '@/lib/die/business-intelligence/reasoning-engine'
import { getTemporalComparisons } from '@/lib/die/assistant/context-cache'
import type { TrendDirection } from '@/lib/die/intelligence-core/trend-utils'

export interface StrategicShiftSummary {
  narrative: string
  changingDirection: string[]
  emergingTrends: string[]
  systemicRisks: string[]
  compoundingOpportunities: string[]
}

function delta(a: number, b: number) { return a - b }

export function buildStrategicShiftSummary(_now: BusinessInsight[]): StrategicShiftSummary {
  const t = getTemporalComparisons()

  function dirText(d: TrendDirection) {
    if (d === 'RISING') return 'rising'
    if (d === 'FALLING') return 'falling'
    if (d === 'VOLATILE') return 'volatile'
    return 'stable'
  }

  const hourMsgs: string[] = []
  hourMsgs.push(`Demand is ${dirText(t.hour.demand.direction)} hour-over-hour`)
  hourMsgs.push(`Operational pressure is ${dirText(t.hour.operationalPressure.direction)} hour-over-hour`)
  hourMsgs.push(`Supply risk is ${dirText(t.hour.supplyRisk.direction)} hour-over-hour`)

  const dayMsgs: string[] = []
  dayMsgs.push(`Today vs yesterday: demand ${dirText(t.day.demand.direction)}, ops pressure ${dirText(t.day.operationalPressure.direction)}, supply risk ${dirText(t.day.supplyRisk.direction)}`)

  const weekMsgs: string[] = []
  weekMsgs.push(`Last 7 days vs prior: demand ${dirText(t.week.demand.direction)}, ops pressure ${dirText(t.week.operationalPressure.direction)}, supply risk ${dirText(t.week.supplyRisk.direction)}`)

  const changingDirection: string[] = []
  for (const [k, comp] of Object.entries(t.hour)) {
    // @ts-ignore
    if (comp.direction === 'RISING' || comp.direction === 'FALLING') changingDirection.push(`${k} ${dirText(comp.direction)} (Δ=${comp.momentum})`)
  }

  const emergingTrends: string[] = []
  if (t.week.demand.direction === 'RISING') emergingTrends.push('Sustained demand growth')
  if (t.week.operationalPressure.direction === 'RISING') emergingTrends.push('Operational pressure building')
  if (t.week.supplyRisk.direction === 'RISING') emergingTrends.push('Supply risk mounting')

  const systemicRisks: string[] = []
  if (t.week.anomaly.direction === 'RISING') systemicRisks.push('Incidents trending up week-over-week')
  if (t.day.risk.direction === 'RISING') systemicRisks.push('Risk insights up vs yesterday')

  const opportunities: string[] = []
  if (t.hour.demand.direction === 'RISING' && t.hour.operationalPressure.direction !== 'RISING') opportunities.push('Leverage near-term demand without overloading ops')
  if (t.day.supplyRisk.direction === 'FALLING') opportunities.push('Stabilizing supply chain — resume normal promotions pacing')

  const narrative = [
    hourMsgs.join('. ') + '.',
    dayMsgs.join('. ') + '.',
    weekMsgs.join('. ') + '.',
  ].join(' ')

  return {
    narrative,
    changingDirection,
    emergingTrends,
    systemicRisks,
    compoundingOpportunities: opportunities,
  }
}
