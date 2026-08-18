import type { BusinessInsightType, BusinessInsight } from '@/lib/die/business-intelligence/reasoning-engine'
import { InsightDictionary, EventCodeDictionary, FinanceMetricDictionary, TemporalMetricDictionary, type CanonicalDomain } from './semantic-dictionary'
import { getThresholds } from './threshold-engine'
import { computeTrustScore as computeUnifiedTrustScore, computeTruthScore as computeUnifiedTruthScore, computeConsensusScore, computeRealityScore, computeMetaScore } from './score-engine'
import { getTemporalComparisons, getFeedHistoryWithin } from '@/lib/die/assistant/context-cache'
import { correlationEngine } from '@/lib/die/intelligence-core/correlation-engine.service'
import { computeFinanceSnapshot } from '@/lib/die/finance/finance-intelligence'
import { computeAccuracyMetrics } from '@/lib/die/evaluation/prediction-validator'

export interface EvidenceContext { windowMs?: number }

export interface StandardizedEvidence {
  temporal?: {
    direction?: 'RISING'|'FALLING'|'STABLE'
    value?: number
  }
  finance?: any // snapshot subset; kept loose to avoid schema coupling
  evaluation?: {
    total: number
    correct: number
    accuracy: number // 0..1
  }
  correlation?: { signals: string[] }
  feed?: { counts: Record<string, number> }
  supports?: {
    finance: number
    temporal: number
    evaluation: number
    correlation: number
    feedEvent: number
  }
}

export const UIK_FLAGS = {
  enabled: () => process.env.DIE_INTELLIGENCE_KERNEL_ENABLED === 'true',
  shadow: () => process.env.DIE_INTELLIGENCE_KERNEL_SHADOW === 'true',
}

export function getInsightDefinition(t: BusinessInsightType){
  return InsightDictionary[t]
}

export function getSemanticDictionaries(){
  return { InsightDictionary, EventCodeDictionary, FinanceMetricDictionary, TemporalMetricDictionary }
}

// -----------------
// Lazy resolvers API (optional) to avoid static deps back to evaluation engine
// -----------------
type EvalRecordLite = { insightType: string; predictionCorrect?: boolean; trustScore?: number }
type CeoBatchLite = { predictedOrder: Array<{ insightType: string }> }
interface UIKResolvers {
  getEvaluatedRecords?: () => EvalRecordLite[]
  getRecords?: () => EvalRecordLite[]
  getCeoBatches?: () => CeoBatchLite[]
}
const resolvers: UIKResolvers = {}
export function registerUIKResolvers(r: UIKResolvers){ Object.assign(resolvers, r) }

// ---------------
// Tiny in-memory cache with short TTL to dedupe shadow reads
// ---------------
const ttlMs = 2000
let finCache: { at: number; val: any | null; p?: Promise<any|null> } | null = null
let corrCache: { at: number; val: { riskSignals: Array<{signal: string}> }; p?: Promise<any> } | null = null
const feedCache = new Map<number, { at: number; val: Record<string, number> }>()

async function getCachedFinance(): Promise<any|null> {
  if (process.env.DIE_FINANCE_INTELLIGENCE_ENABLED !== 'true') return null
  const now = Date.now()
  if (finCache && (now - finCache.at) < ttlMs && finCache.val !== undefined) return finCache.val
  if (finCache?.p) return finCache.p
  finCache = { at: now, val: null }
  finCache.p = computeFinanceSnapshot().then(v => { finCache = { at: Date.now(), val: v }; return v }).catch(()=>{ finCache = { at: Date.now(), val: null }; return null })
  return finCache.p
}

async function getCachedCorrelation(): Promise<{ riskSignals: Array<{ signal: string }> }>{
  const now = Date.now()
  if (corrCache && (now - corrCache.at) < ttlMs && corrCache.val) return corrCache.val
  if (corrCache?.p) return corrCache.p as any
  corrCache = { at: now, val: { riskSignals: [] } as any }
  corrCache.p = correlationEngine.generateReport().then(v=>{ corrCache = { at: Date.now(), val: v as any }; return v as any }).catch(()=>{ corrCache = { at: Date.now(), val: { riskSignals: [] } as any }; return { riskSignals: [] } as any })
  return corrCache.p as any
}

function getCachedFeed(windowMs: number): Record<string, number> {
  const now = Date.now()
  const ex = feedCache.get(windowMs)
  if (ex && (now - ex.at) < ttlMs) return ex.val
  const feed = getFeedHistoryWithin(windowMs)
  const byCode: Record<string, number> = {}
  for (const f of feed) if (EventCodeDictionary[f.code]) byCode[f.code] = (byCode[f.code]||0)+1
  feedCache.set(windowMs, { at: now, val: byCode })
  return byCode
}

function temporalSliceFor(type: BusinessInsightType, t: any): any | undefined {
  switch (type) {
    case 'KITCHEN_BOTTLENECK_IDENTIFIED':
    case 'OPERATIONAL_CONGESTION': return t.hour?.operationalPressure
    case 'SUPPLY_CHAIN_DEGRADATION': return t.hour?.supplyRisk
    case 'DEMAND_SURGE_DETECTED': return t.hour?.demand
    case 'CUSTOMER_CHURN_RISK':
    case 'TABLE_TURNOVER_INEFFICIENCY': return t.hour?.customerActivity
    default: return undefined
  }
}

function financeSupportFor(key: string, fin: any | null): number {
  if (!fin) return 0
  switch (key) {
    case 'REVENUE_DECLINE_DETECTED': return fin.trends.day.revenue.direction === 'FALLING' ? 1 : 0
    case 'REVENUE_GROWTH_DETECTED': return fin.trends.day.revenue.direction === 'RISING' ? 1 : 0
    case 'PAYMENT_PROVIDER_DEGRADATION': return fin.trends.day.topProvider?.direction === 'RISING' ? 1 : 0
    case 'REFUND_SPIKE_DETECTED': return fin.trends.day.refunds.direction === 'RISING' ? 1 : 0
    case 'COLLECTION_RISK_DETECTED': return fin.health.collectionEfficiencyScore < 70 ? 1 : 0
    case 'FINANCIAL_HEALTH_WARNING': return fin.health.revenueHealthScore < 60 ? 1 : 0
    default: return 0
  }
}

function temporalSupportFor(key: string, t: any): number {
  switch (key) {
    case 'KITCHEN_BOTTLENECK_IDENTIFIED':
    case 'OPERATIONAL_CONGESTION': return t.hour?.operationalPressure?.direction === 'RISING' ? 1 : 0
    case 'SUPPLY_CHAIN_DEGRADATION': return t.hour?.supplyRisk?.direction === 'RISING' ? 1 : 0
    case 'DEMAND_SURGE_DETECTED': return t.hour?.demand?.direction === 'RISING' ? 1 : 0
    case 'CUSTOMER_CHURN_RISK': return t.hour?.customerActivity?.direction === 'FALLING' ? 1 : 0
    default: return 0
  }
}

function evaluationSupportFor(key: string, evaluated: EvalRecordLite[]): number {
  const recs = evaluated.filter(r => String(r.insightType) === key)
  if (!recs.length) return 0
  const correct = recs.filter(r => r.predictionCorrect).length
  return correct / recs.length
}

function correlationSupportFor(key: string, signals: string[]): number {
  const has = (s: string) => signals.some(x => x.includes(s))
  if (key === 'KITCHEN_BOTTLENECK_IDENTIFIED') return has('kitchen') || has('backlog') ? 1 : 0
  if (key === 'SUPPLY_CHAIN_DEGRADATION') return has('supplier') || has('delivery') ? 1 : 0
  if (key === 'DEMAND_SURGE_DETECTED') return has('demand') || has('campaign') ? 1 : 0
  return 0
}

function feedEventSupportFor(key: string, byCode: Record<string, number>): number {
  const codesFor: Record<string, string[]> = {
    DEMAND_SURGE_DETECTED: ['SESSION_STARTED', 'RESERVATION_CREATED'],
    KITCHEN_BOTTLENECK_IDENTIFIED: ['KDS_BACKLOG_ALERT'],
    OPERATIONAL_CONGESTION: ['KDS_BACKLOG_ALERT', 'WAITER_CALL_CREATED'],
    SUPPLY_CHAIN_DEGRADATION: ['DELIVERY_DELAYED', 'SUPPLIER_DELIVERY_DELAYED'],
    REVENUE_RISK_DETECTED: ['PAYMENT_EXCEPTION'],
    CAMPAIGN_EFFECTIVENESS_DROP: ['CAMPAIGN_DELIVERABILITY_WEAK'],
  } as any
  const list = codesFor[key] || []
  const total = list.reduce((s, c) => s + (byCode[c] || 0), 0)
  return total > 0 ? 1 : 0 // presence proxy only (UIK shadow)
}

export async function getEvidence(insightType: BusinessInsightType, ctx: EvidenceContext = {}): Promise<StandardizedEvidence> {
  const windowMs = ctx.windowMs ?? 60*60*1000
  const t = getTemporalComparisons()
  const [fin, corr] = await Promise.all([getCachedFinance(), getCachedCorrelation()])
  const byCode = getCachedFeed(windowMs)

  // evaluation metrics are optional (resolver-based) to avoid static import
  const evaluated = resolvers.getEvaluatedRecords ? resolvers.getEvaluatedRecords() : []
  const all = resolvers.getRecords ? resolvers.getRecords() : []
  const acc = (evaluated && all && all.length) ? computeAccuracyMetrics(evaluated as any, all as any).overallAccuracy : 0

  const tempSlice = temporalSliceFor(insightType, t)
  const signals = (corr?.riskSignals || []).map((r:any)=>String(r.signal).toLowerCase())

  const supports = {
    finance: financeSupportFor(insightType, fin),
    temporal: temporalSupportFor(insightType, t),
    evaluation: evaluationSupportFor(insightType, evaluated || []),
    correlation: correlationSupportFor(insightType, signals),
    feedEvent: feedEventSupportFor(insightType, byCode),
  }

  return {
    temporal: tempSlice ? { direction: tempSlice.direction, value: tempSlice.current } : undefined,
    finance: fin,
    evaluation: { total: evaluated.length || 0, correct: (evaluated || []).filter(r=>r.predictionCorrect).length, accuracy: acc },
    correlation: { signals: (corr?.riskSignals || []).map((r:any)=>String(r.signal)) },
    feed: { counts: byCode },
    supports,
  }
}

// Thresholds accessor (single source of truth)
export { getThresholds }

// Unified scoring wrappers
export const scoring = {
  computeTrustScore: computeUnifiedTrustScore,
  computeTruthScore: computeUnifiedTruthScore,
  computeConsensusScore,
  computeRealityScore,
  computeMetaScore,
}
