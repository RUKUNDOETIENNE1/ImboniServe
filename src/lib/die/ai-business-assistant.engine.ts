import { businessReasoning } from '@/lib/die/business-intelligence/reasoning-engine'
import { correlationEngine } from '@/lib/die/intelligence-core/correlation-engine.service'
import { shadowObservability } from '@/lib/die/business-as-plugin/shadow/shadow-observability'
import type { BusinessInsight } from '@/lib/die/business-intelligence/reasoning-engine'
import { recordInsightsSnapshot, setCorrelationSnapshot, setFeedSnapshot, getInsightsHistory, getLastTwoSnapshots, recordTemporalSample, getTemporalComparisons } from '@/lib/die/assistant/context-cache'
import { buildDailySummary, buildOperationalRiskExplanation, buildRevenuePressureExplanation, buildSupplyChainExplanation, buildCustomerExperienceExplanation, selectRisks, selectOpportunities, recommendFocusAreas, buildTemporalChangeNarratives, buildFinanceNarrative } from '@/lib/die/assistant/reasoning-to-language'
import { whatsHappeningNow } from '@/lib/die/assistant/realtime-narrator'
import { prioritizeForCEO } from '@/lib/die/assistant/ceo-prioritization'
import { buildStrategicShiftSummary } from '@/lib/die/assistant/executive-evolution'

export interface AssistantOverview {
  summary: string
  keyInsights: BusinessInsight[]
  risks: string[]
  opportunities: string[]
  systemHealthNarrative: string
  recommendedFocusAreas: string[]
}

export async function generateAssistantOverview(): Promise<AssistantOverview> {
  if (process.env.DIE_AI_ASSISTANT_ENABLED !== 'true') {
    return { summary: '', keyInsights: [], risks: [], opportunities: [], systemHealthNarrative: '', recommendedFocusAreas: [] }
  }

  const [insights, report] = await Promise.all([
    businessReasoning.generateInsights(),
    correlationEngine.generateReport(),
  ])
  const feed = shadowObservability.list(200)

  // record to read-only in-memory cache
  recordInsightsSnapshot(insights)
  setCorrelationSnapshot(report)
  setFeedSnapshot(feed)
  recordTemporalSample(insights, report, feed)

  const keyInsights = insights
    .slice()
    .sort((a, b) => (a.severity === 'CRITICAL' ? 1 : 0) - (b.severity === 'CRITICAL' ? 1 : 0) || b.confidence - a.confidence)
    .slice(0, 7)

  const summary = buildDailySummary(insights)
  const revenue = buildRevenuePressureExplanation(insights)
  const operational = buildOperationalRiskExplanation(insights)
  const supply = buildSupplyChainExplanation(insights)
  const cx = buildCustomerExperienceExplanation(insights)

  const nowNarrative = whatsHappeningNow(feed, insights, report)

  const risks = [revenue, operational, supply, cx].filter(Boolean)
  const opportunities = selectOpportunities(insights)

  // include some system health flavor text from correlation hotspots/inefficiencies
  const healthParts: string[] = []
  const hs = report.hotspots.length
  const inef = report.inefficiencies.length
  if (hs > 0) healthParts.push(`${hs} hotspots observed in plugin lifecycle and anomalies.`)
  if (inef > 0) healthParts.push(`${inef} inefficiency areas detected across marketplace or stability metrics.`)
  if (healthParts.length === 0) healthParts.push('Overall system health appears steady based on current signals.')
  healthParts.push(nowNarrative)

  // Temporal change narratives (read-only, from rolling windows)
  const temporal = getTemporalComparisons()
  const temporalNarratives = buildTemporalChangeNarratives(temporal)
  let systemHealthNarrative = [healthParts.join(' '), temporalNarratives.whatChanged, temporalNarratives.improving, temporalNarratives.worsening, temporalNarratives.stable]
    .filter(Boolean)
    .join(' ')

  // Append finance perspective if enabled
  if (process.env.DIE_FINANCE_INTELLIGENCE_ENABLED === 'true') {
    try {
      const { computeFinanceSnapshot } = await import('@/lib/die/finance/finance-intelligence')
      const fin = await computeFinanceSnapshot()
      const financeNarrative = buildFinanceNarrative(fin)
      systemHealthNarrative = [systemHealthNarrative, financeNarrative].filter(Boolean).join(' ')
    } catch {}
  }

  const recommendedFocusAreas = recommendFocusAreas(insights)

  return {
    summary,
    keyInsights,
    risks,
    opportunities,
    systemHealthNarrative,
    recommendedFocusAreas,
  }
}

// CEO Intelligence Evolution Layer
export interface CEOExecutiveOverview {
  currentSnapshot: AssistantOverview
  previousSnapshot?: AssistantOverview
  delta: {
    addedInsights: string[]
    resolvedInsights: string[]
    confidenceShift: Array<{ type: string; delta: number }>
  }
  ceoFocus: ReturnType<typeof prioritizeForCEO>
  strategicShift: ReturnType<typeof buildStrategicShiftSummary>
}

export async function generateExecutiveOverview(): Promise<CEOExecutiveOverview> {
  if (process.env.DIE_AI_CEO_LAYER_ENABLED !== 'true') {
    return {
      currentSnapshot: { summary: '', keyInsights: [], risks: [], opportunities: [], systemHealthNarrative: '', recommendedFocusAreas: [] },
      previousSnapshot: undefined,
      delta: { addedInsights: [], resolvedInsights: [], confidenceShift: [] },
      ceoFocus: [],
      strategicShift: { narrative: '', changingDirection: [], emergingTrends: [], systemicRisks: [], compoundingOpportunities: [] },
    }
  }

  const current = await generateAssistantOverview()

  // Compare to previous in-memory snapshot (if any)
  const lastTwo = getLastTwoSnapshots()
  const prev = lastTwo[1]?.insights || []
  const now = current.keyInsights

  const prevMap = new Map(prev.map((i) => [i.type, i]))
  const nowMap = new Map(now.map((i) => [i.type, i]))
  const added: string[] = []
  const resolved: string[] = []
  const confShift: Array<{ type: string; delta: number }> = []
  for (const i of now) if (!prevMap.has(i.type)) added.push(i.type)
  for (const i of prev) if (!nowMap.has(i.type)) resolved.push(i.type)
  for (const i of now) {
    const p = prevMap.get(i.type)
    if (p) confShift.push({ type: i.type, delta: Number((i.confidence - p.confidence).toFixed(2)) })
  }

  const ceoFocus = prioritizeForCEO(current.keyInsights)
  const strategicShift = buildStrategicShiftSummary(current.keyInsights)

  return {
    currentSnapshot: current,
    previousSnapshot: prev.length ? {
      summary: '', keyInsights: prev, risks: [], opportunities: [], systemHealthNarrative: '', recommendedFocusAreas: []
    } : undefined,
    delta: { addedInsights: added, resolvedInsights: resolved, confidenceShift: confShift },
    ceoFocus,
    strategicShift,
  }
}
