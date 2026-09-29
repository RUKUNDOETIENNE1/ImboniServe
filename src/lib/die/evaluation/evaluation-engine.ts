import type { BusinessInsight, BusinessInsightType } from '@/lib/die/business-intelligence/reasoning-engine'
import { getTemporalComparisons, getFeedHistoryWithin } from '@/lib/die/assistant/context-cache'
import { prioritizeForCEO, type CEOFocusItem } from '@/lib/die/assistant/ceo-prioritization'
import { measureEvaluationConvergence } from '@/lib/die/convergence/convergence-engine'

/**
 * PHASE 7 — Intelligence Evaluation & Self-Validation Layer
 *
 * This module is strictly:
 *  - additive
 *  - read-only (no writes to production entities, no schema changes)
 *  - non-blocking (capture is fire-and-forget; evaluation is lazy on read)
 *  - in-memory only (bounded ring buffers, no persistence)
 *  - feature-flagged OFF by default (DIE_INTELLIGENCE_EVALUATION_ENABLED)
 *
 * It measures whether previously generated intelligence was actually correct
 * by comparing insight snapshots (T0) against observed outcomes (T0 + window).
 */

export type EvaluationDomain =
  | 'Finance'
  | 'Operations'
  | 'Supply Chain'
  | 'Marketing'
  | 'Customer Experience'
  | 'Dining Operations'
  | 'Delivery'
  | 'Reservations'
  | 'Core'

export type NarrativeCategory = 'Finance' | 'Operations' | 'Supply Chain' | 'Customer'

// What outcome direction proves the insight was correct.
//  UP      -> metric should rise vs baseline
//  DOWN    -> metric should fall vs baseline
//  PERSIST -> a flagged problem should persist (not vanish immediately)
type Expectation = 'UP' | 'DOWN' | 'PERSIST'

interface InsightMapping {
  metricKey: MetricKey
  expectation: Expectation
  domain: EvaluationDomain
  narrative: NarrativeCategory
}

type MetricKey =
  | 'finance.revenue'
  | 'finance.refunds'
  | 'finance.providerFailures'
  | 'finance.collectionEfficiency'
  | 'finance.healthScore'
  | 'finance.paymentExceptions'
  | 'temporal.demand'
  | 'temporal.operationalPressure'
  | 'temporal.supplyRisk'
  | 'temporal.customerActivity'
  | 'feed.campaignWeak'

const INSIGHT_MAP: Record<BusinessInsightType, InsightMapping> = {
  REVENUE_GROWTH_DETECTED: { metricKey: 'finance.revenue', expectation: 'UP', domain: 'Finance', narrative: 'Finance' },
  REVENUE_DECLINE_DETECTED: { metricKey: 'finance.revenue', expectation: 'DOWN', domain: 'Finance', narrative: 'Finance' },
  REVENUE_RISK_DETECTED: { metricKey: 'finance.paymentExceptions', expectation: 'UP', domain: 'Finance', narrative: 'Finance' },
  REFUND_SPIKE_DETECTED: { metricKey: 'finance.refunds', expectation: 'UP', domain: 'Finance', narrative: 'Finance' },
  PAYMENT_PROVIDER_DEGRADATION: { metricKey: 'finance.providerFailures', expectation: 'UP', domain: 'Finance', narrative: 'Finance' },
  COLLECTION_RISK_DETECTED: { metricKey: 'finance.collectionEfficiency', expectation: 'DOWN', domain: 'Finance', narrative: 'Finance' },
  FINANCIAL_HEALTH_WARNING: { metricKey: 'finance.healthScore', expectation: 'DOWN', domain: 'Finance', narrative: 'Finance' },
  KITCHEN_BOTTLENECK_IDENTIFIED: { metricKey: 'temporal.operationalPressure', expectation: 'PERSIST', domain: 'Operations', narrative: 'Operations' },
  OPERATIONAL_CONGESTION: { metricKey: 'temporal.operationalPressure', expectation: 'PERSIST', domain: 'Operations', narrative: 'Operations' },
  SUPPLY_CHAIN_DEGRADATION: { metricKey: 'temporal.supplyRisk', expectation: 'PERSIST', domain: 'Supply Chain', narrative: 'Supply Chain' },
  DEMAND_SURGE_DETECTED: { metricKey: 'temporal.demand', expectation: 'PERSIST', domain: 'Reservations', narrative: 'Operations' },
  CUSTOMER_CHURN_RISK: { metricKey: 'temporal.customerActivity', expectation: 'DOWN', domain: 'Customer Experience', narrative: 'Customer' },
  TABLE_TURNOVER_INEFFICIENCY: { metricKey: 'temporal.customerActivity', expectation: 'PERSIST', domain: 'Dining Operations', narrative: 'Customer' },
  CAMPAIGN_EFFECTIVENESS_DROP: { metricKey: 'feed.campaignWeak', expectation: 'DOWN', domain: 'Marketing', narrative: 'Customer' },
}

export interface PredictionRecord {
  insightId: string
  insightType: BusinessInsightType
  domain: EvaluationDomain
  narrative: NarrativeCategory
  expectation: Expectation
  metricKey: MetricKey
  generatedAt: string
  confidence: number
  calibratedConfidence?: number
  trustScore?: number
  contributingSignals: Array<{ code: string; count?: number }>
  baselineValue: number
  evaluationWindowMs: number
  dueAt: number
  // populated on evaluation
  evaluatedAt?: string
  outcomeValue?: number
  predictionCorrect?: boolean
  // classification for precision/recall (problem-predicting insights are "positives")
  isPositivePrediction: boolean
}

export interface CEOPredictionBatch {
  batchId: string
  generatedAt: string
  predictedOrder: Array<{ domain: string; insightType: BusinessInsightType; priorityScore: number; metricKey: MetricKey; baselineValue: number; expectation: Expectation }>
  dueAt: number
  evaluationWindowMs: number
  evaluatedAt?: string
  actualOrder?: Array<{ domain: string; insightType: BusinessInsightType; realizedImpact: number }>
}

const RECORD_LIMIT = 2000
const CEO_BATCH_LIMIT = 500

let records: PredictionRecord[] = []
let ceoBatches: CEOPredictionBatch[] = []
let idCounter = 0

function defaultWindowMs(): number {
  const env = Number(process.env.DIE_EVALUATION_WINDOW_MS)
  if (Number.isFinite(env) && env > 0) return env
  return 24 * 60 * 60 * 1000 // 24h
}

// Problem-predicting insight types count as "positive" predictions for precision/recall.
const POSITIVE_TYPES = new Set<BusinessInsightType>([
  'REVENUE_DECLINE_DETECTED',
  'REVENUE_RISK_DETECTED',
  'REFUND_SPIKE_DETECTED',
  'PAYMENT_PROVIDER_DEGRADATION',
  'COLLECTION_RISK_DETECTED',
  'FINANCIAL_HEALTH_WARNING',
  'KITCHEN_BOTTLENECK_IDENTIFIED',
  'OPERATIONAL_CONGESTION',
  'SUPPLY_CHAIN_DEGRADATION',
  'CUSTOMER_CHURN_RISK',
  'TABLE_TURNOVER_INEFFICIENCY',
  'CAMPAIGN_EFFECTIVENESS_DROP',
])

async function readMetric(key: MetricKey): Promise<number> {
  try {
    if (key.startsWith('finance.')) {
      if (process.env.DIE_FINANCE_INTELLIGENCE_ENABLED !== 'true') return 0
      const { computeFinanceSnapshot } = await import('@/lib/die/finance/finance-intelligence')
      const fin = await computeFinanceSnapshot()
      switch (key) {
        case 'finance.revenue': return fin.windows.day.revenueCents
        case 'finance.refunds': return fin.windows.day.refundsCents
        case 'finance.providerFailures': return fin.windows.day.failed
        case 'finance.collectionEfficiency': return fin.health.collectionEfficiencyScore
        case 'finance.healthScore': return fin.health.revenueHealthScore
        case 'finance.paymentExceptions': return fin.windows.day.failed
        default: return 0
      }
    }
    if (key.startsWith('temporal.')) {
      const t = getTemporalComparisons()
      switch (key) {
        case 'temporal.demand': return t.hour.demand.current
        case 'temporal.operationalPressure': return t.hour.operationalPressure.current
        case 'temporal.supplyRisk': return t.hour.supplyRisk.current
        case 'temporal.customerActivity': return t.hour.customerActivity.current
        default: return 0
      }
    }
    if (key === 'feed.campaignWeak') {
      const feed = getFeedHistoryWithin(60 * 60 * 1000)
      return feed.filter((f) => f.code === 'CAMPAIGN_DELIVERABILITY_WEAK').length
    }
  } catch {
    return 0
  }
  return 0
}

function judge(expectation: Expectation, baseline: number, outcome: number): boolean {
  const tol = 0.05
  switch (expectation) {
    case 'UP':
      return outcome > baseline * (1 + tol)
    case 'DOWN':
      return outcome < baseline * (1 - tol)
    case 'PERSIST':
      // problem persisted if it did not materially subside
      return outcome >= baseline * (1 - tol)
  }
}

/**
 * Capture an insight batch at T0. Fire-and-forget; never throws.
 * Reads each distinct metric once to minimize DB load.
 */
export async function captureInsights(insights: BusinessInsight[]): Promise<void> {
  if (process.env.DIE_INTELLIGENCE_EVALUATION_ENABLED !== 'true') return
  if (!insights || insights.length === 0) return
  try {
    const windowMs = defaultWindowMs()
    const now = Date.now()
    const nowIso = new Date(now).toISOString()

    // Pre-read distinct metrics for this batch
    const metricKeys = new Set<MetricKey>()
    for (const i of insights) {
      const m = INSIGHT_MAP[i.type]
      if (m) metricKeys.add(m.metricKey)
    }
    const metricValues = new Map<MetricKey, number>()
    for (const k of metricKeys) metricValues.set(k, await readMetric(k))

    for (const i of insights) {
      const m = INSIGHT_MAP[i.type]
      if (!m) continue
      const rec: PredictionRecord = {
        insightId: `eval_${++idCounter}_${now}`,
        insightType: i.type,
        domain: m.domain,
        narrative: m.narrative,
        expectation: m.expectation,
        metricKey: m.metricKey,
        generatedAt: nowIso,
        confidence: i.confidence,
        calibratedConfidence: i.calibratedConfidence,
        trustScore: i.trustScore,
        contributingSignals: (i.contributingSignals || []).map((c) => ({ code: c.code, count: c.count })),
        baselineValue: metricValues.get(m.metricKey) ?? 0,
        evaluationWindowMs: windowMs,
        dueAt: now + windowMs,
        isPositivePrediction: POSITIVE_TYPES.has(i.type),
      }
      records.unshift(rec)
    }
    if (records.length > RECORD_LIMIT) records = records.slice(0, RECORD_LIMIT)

    // Capture CEO predicted ordering (pure function; no DB)
    const ceo: CEOFocusItem[] = prioritizeForCEO(insights)
    const predictedOrder = ceo.map((c) => {
      // map domain back to a representative insight type for outcome lookup
      const match = insights.find((i) => INSIGHT_MAP[i.type]?.domain && c.reason === i.explanation)
      const type = (match?.type) || insights[0]?.type
      const mm = INSIGHT_MAP[type]
      return {
        domain: c.domain,
        insightType: type,
        priorityScore: c.priorityScore,
        metricKey: mm?.metricKey || 'temporal.operationalPressure',
        baselineValue: metricValues.get(mm?.metricKey as MetricKey) ?? 0,
        expectation: mm?.expectation || 'PERSIST',
      }
    })
    if (predictedOrder.length > 0) {
      ceoBatches.unshift({
        batchId: `ceo_${++idCounter}_${now}`,
        generatedAt: nowIso,
        predictedOrder,
        dueAt: now + windowMs,
        evaluationWindowMs: windowMs,
      })
      if (ceoBatches.length > CEO_BATCH_LIMIT) ceoBatches = ceoBatches.slice(0, CEO_BATCH_LIMIT)
    }
  } catch {
    // never throw: evaluation must be non-blocking
  }
}

/**
 * Lazily evaluate all records whose window has elapsed. Read-only.
 */
export async function evaluateDue(): Promise<void> {
  if (process.env.DIE_INTELLIGENCE_EVALUATION_ENABLED !== 'true') return
  const now = Date.now()
  try {
    const dueRecords = records.filter((r) => !r.evaluatedAt && r.dueAt <= now)
    const metricCache = new Map<MetricKey, number>()
    for (const r of dueRecords) {
      if (!metricCache.has(r.metricKey)) metricCache.set(r.metricKey, await readMetric(r.metricKey))
      const outcome = metricCache.get(r.metricKey) ?? 0
      r.outcomeValue = outcome
      r.predictionCorrect = judge(r.expectation, r.baselineValue, outcome)
      r.evaluatedAt = new Date(now).toISOString()
    }

    const dueBatches = ceoBatches.filter((b) => !b.evaluatedAt && b.dueAt <= now)
    for (const b of dueBatches) {
      const actual: Array<{ domain: string; insightType: BusinessInsightType; realizedImpact: number }> = []
      for (const p of b.predictedOrder) {
        if (!metricCache.has(p.metricKey)) metricCache.set(p.metricKey, await readMetric(p.metricKey))
        const outcome = metricCache.get(p.metricKey) ?? 0
        const denom = Math.max(1, Math.abs(p.baselineValue))
        const realizedImpact = Math.abs(outcome - p.baselineValue) / denom
        actual.push({ domain: p.domain, insightType: p.insightType, realizedImpact })
      }
      actual.sort((a, b2) => b2.realizedImpact - a.realizedImpact)
      b.actualOrder = actual
      b.evaluatedAt = new Date(now).toISOString()
    }
    if (process.env.DIE_INTELLIGENCE_DUAL_READ_ENABLED === 'true') {
      try {
        const all = getRecords()
        const evaluatedNow = getEvaluatedRecords()
        const legacyAcc = (() => {
          // recompute for clarity; same as callers
          const { computeAccuracyMetrics } = require('@/lib/die/evaluation/prediction-validator')
          return computeAccuracyMetrics(evaluatedNow, all).overallAccuracy
        })()
        // Independent UIK-side computation is not available in this module without reintroducing
        // a static dependency on the kernel. Avoid forced parity.
        measureEvaluationConvergence({ legacyAccuracy: legacyAcc, unsupported: true })
      } catch {}
    }
  } catch {
    // ignore
  }
}

export function getRecords(): PredictionRecord[] {
  return records.slice()
}

export function getEvaluatedRecords(): PredictionRecord[] {
  return records.filter((r) => !!r.evaluatedAt)
}

export function getCeoBatches(): CEOPredictionBatch[] {
  return ceoBatches.slice()
}

export function getEvaluatedCeoBatches(): CEOPredictionBatch[] {
  return ceoBatches.filter((b) => !!b.evaluatedAt)
}

export function __resetEvaluationStateForTests() {
  records = []
  ceoBatches = []
  idCounter = 0
}

// Register resolvers with UIK at runtime if available, without static import
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const uik = require('@/lib/die/kernel/unified-intelligence-kernel')
  if (uik && typeof uik.registerUIKResolvers === 'function') {
    uik.registerUIKResolvers({
      getEvaluatedRecords: () => getEvaluatedRecords() as any,
      getRecords: () => getRecords() as any,
      getCeoBatches: () => getCeoBatches() as any,
    })
  }
} catch {}
