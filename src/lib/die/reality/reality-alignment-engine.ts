import { buildArbitrationSnapshot, type ArbitrationSnapshot, type ConsensusInsight } from '@/lib/die/arbitration/intelligence-arbitrator'
import { computeFinanceSnapshot } from '@/lib/die/finance/finance-intelligence'
import { getTemporalComparisons } from '@/lib/die/assistant/context-cache'
import { evaluateDue, getEvaluatedRecords, getRecords, getCeoBatches } from '@/lib/die/evaluation/evaluation-engine'
import { computeAccuracyMetrics } from '@/lib/die/evaluation/prediction-validator'
import { buildTruthAuditSnapshot } from '@/lib/die/audit/truth-audit-engine'
import { getEvidence } from '@/lib/die/kernel/unified-intelligence-kernel'
import { scoring } from '@/lib/die/kernel/unified-intelligence-kernel'
import { measureRealityConvergence } from '@/lib/die/convergence/convergence-engine'

export interface RealityAlignmentSnapshot {
  realityAlignmentScore: number
  causalMatchScore: number
  externalGroundingScore: number
  overconfidenceLeakageScore: number
  globalTruthAlignmentIndex: number
  recommendations: string[]
  details: {
    ceoAlignmentOk: boolean
    arbitrationStatePlausible: boolean
    causalBreakdowns: Array<{ key: string; correct: number; total: number }>
    highTrustWrongCount: number
    highTrustEvaluated: number
  }
}

function clamp01(n: number) { return Math.max(0, Math.min(1, n)) }

function financeSupportFor(key: string, fin: Awaited<ReturnType<typeof computeFinanceSnapshot>> | null): number {
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

function temporalSupportFor(key: string): number {
  const t = getTemporalComparisons()
  switch (key) {
    case 'KITCHEN_BOTTLENECK_IDENTIFIED':
    case 'OPERATIONAL_CONGESTION': return t.hour.operationalPressure.direction === 'RISING' ? 1 : 0
    case 'SUPPLY_CHAIN_DEGRADATION': return t.hour.supplyRisk.direction === 'RISING' ? 1 : 0
    case 'DEMAND_SURGE_DETECTED': return t.hour.demand.direction === 'RISING' ? 1 : 0
    case 'CUSTOMER_CHURN_RISK': return t.hour.customerActivity.direction === 'FALLING' ? 1 : 0
    default: return 0
  }
}

function judgeArbitrationPlausibility(s: ArbitrationSnapshot, fin: Awaited<ReturnType<typeof computeFinanceSnapshot>> | null, truthScore: number): boolean {
  if (s.finalSystemState === 'HEALTHY') {
    const financeOk = !fin || (fin.trends.day.revenue.direction !== 'FALLING' && fin.health.revenueHealthScore >= 70 && fin.health.paymentFailureRate <= 15 && fin.health.refundRate <= 12)
    return s.consensusConfidence >= 0.7 && s.disagreementIndex < 40 && truthScore >= 80 && financeOk
  }
  if (s.finalSystemState === 'DEGRADED') {
    const financeRisk = !!fin && (fin.trends.day.revenue.direction === 'FALLING' || fin.health.revenueHealthScore < 70)
    return s.consensusConfidence >= 0.55 && s.disagreementIndex < 60 && (financeRisk || s.conflictReport.conflictScore >= 0.3)
  }
  if (s.finalSystemState === 'UNSTABLE' || s.finalSystemState === 'CONFLICTED') {
    return s.disagreementIndex >= 50 || s.conflictReport.conflictScore >= 0.5 || truthScore < 65
  }
  return false
}

async function judgeCeoAgainstFinance(): Promise<boolean> {
  try {
    const batches = getCeoBatches()
    const last = batches[0]
    if (!last) return true
    const top = last.predictedOrder[0]
    const financeEnabled = process.env.DIE_FINANCE_INTELLIGENCE_ENABLED === 'true'
    if (!financeEnabled) return true
    // when finance is enabled, require that top pick agrees with finance urgency (or neutrality if no finance urgency)
    const fin = await computeFinanceSnapshot()
    const financeUrgent = !!fin && (fin.trends.day.revenue.direction === 'FALLING' || fin.health.revenueHealthScore < 60 || fin.health.paymentFailureRate > 20 || fin.health.refundRate > 15)
    const topIsFinance = top && (String(top.insightType).includes('REVENUE') || String(top.insightType).includes('PAYMENT') || String(top.insightType).includes('FINANC'))
    return (financeUrgent && topIsFinance) || (!financeUrgent && !topIsFinance) || (!top)
  } catch {
    return true
  }
}

export async function buildRealityAlignmentSnapshot(): Promise<RealityAlignmentSnapshot> {
  if (process.env.DIE_INTELLIGENCE_REALITY_ALIGNMENT_ENABLED !== 'true') {
    return {
      realityAlignmentScore: 0,
      causalMatchScore: 0,
      externalGroundingScore: 0,
      overconfidenceLeakageScore: 0,
      globalTruthAlignmentIndex: 0,
      recommendations: [],
      details: { ceoAlignmentOk: false, arbitrationStatePlausible: false, causalBreakdowns: [], highTrustWrongCount: 0, highTrustEvaluated: 0 },
    }
  }

  await evaluateDue()

  const evaluated = getEvaluatedRecords()
  const all = getRecords()
  const accuracy = computeAccuracyMetrics(evaluated, all).overallAccuracy // 0..1
  const arb = await buildArbitrationSnapshot()
  const truth = await buildTruthAuditSnapshot()
  const fin = process.env.DIE_FINANCE_INTELLIGENCE_ENABLED === 'true' ? await computeFinanceSnapshot() : null
  if (process.env.DIE_INTELLIGENCE_KERNEL_SHADOW === 'true') {
    try {
      const keys = new Set<string>(arb.consensusInsights.map(c=>c.key))
      const batches = getCeoBatches()
      const top = batches[0]?.predictedOrder?.[0]?.insightType
      if (top) keys.add(String(top))
      await Promise.all(Array.from(keys).map((k)=>getEvidence(k as any)))
    } catch {}
  }

  // CEO vs finance alignment (boolean -> 0/1)
  const ceoAlignOk = await judgeCeoAgainstFinance()

  // Arbitration state plausibility
  const arbPlausible = judgeArbitrationPlausibility(arb, fin, truth.truthStabilityIndex.truthStabilityScore)

  // Reality alignment: combine evaluation accuracy (ground truth-checked), CEO alignment, and arbitration plausibility
  const realityAlignment = clamp01(accuracy * 0.5 + (ceoAlignOk ? 0.25 : 0) + (arbPlausible ? 0.25 : 0))
  const realityAlignmentScore = Math.round(realityAlignment * 100)

  // Causal consistency: among positive predictions, how many were correct (TP-rate)
  const positives = evaluated.filter((r) => r.isPositivePrediction)
  const tp = positives.filter((r) => r.predictionCorrect).length
  const causalMatch = positives.length ? tp / positives.length : accuracy
  const byKeyMap = new Map<string, { correct: number; total: number }>()
  for (const r of positives) {
    const k = String(r.insightType)
    const cur = byKeyMap.get(k) || { correct: 0, total: 0 }
    cur.total += 1
    if (r.predictionCorrect) cur.correct += 1
    byKeyMap.set(k, cur)
  }
  const causalBreakdowns = Array.from(byKeyMap.entries()).map(([key, v]) => ({ key, correct: v.correct, total: v.total }))
  const causalMatchScore = Math.round(clamp01(causalMatch) * 100)

  // External grounding score: finance-backed confirmations across consensus + evaluated
  let financeBacked = 0
  let financeConsidered = 0
  if (fin) {
    for (const c of arb.consensusInsights) {
      financeConsidered += 1
      if (financeSupportFor(c.key, fin) >= 1) financeBacked += 1
    }
  }
  const evalFinanceShare = evaluated.length ? evaluated.filter((r) => String((r as any).metricKey || '').startsWith('finance.')).length / evaluated.length : fin ? 0.5 : 0
  const externalGrounding = clamp01(((financeConsidered ? financeBacked / financeConsidered : 0) * 0.6) + (evalFinanceShare * 0.4))
  const externalGroundingScore = Math.round(externalGrounding * 100)

  // Overconfidence leakage: high arbitration consensus with low correctness + high-trust wrongs
  const highTrust = evaluated.filter((r) => (r.trustScore ?? 0) >= 85)
  const wrongHigh = highTrust.filter((r) => r.predictionCorrect === false)
  const trustLeak = highTrust.length ? wrongHigh.length / highTrust.length : 0
  const arbLeak = arb.consensusConfidence >= 0.75 && !arbPlausible ? 0.7 : 0
  const overconfidenceLeakage = clamp01(0.6 * trustLeak + 0.4 * arbLeak)
  const overconfidenceLeakageScore = Math.round(overconfidenceLeakage * 100)

  // Global index: combine all, penalizing leakage
  const globalTruthAlignmentIndex = Math.round(
    clamp01((realityAlignment * 0.4) + (causalMatch * 0.25) + (externalGrounding * 0.25) + ((1 - overconfidenceLeakage) * 0.1)) * 100
  )

  if (process.env.DIE_INTELLIGENCE_DUAL_READ_ENABLED === 'true') {
    try {
      const evs = await Promise.all(arb.consensusInsights.map(c => getEvidence(c.key as any)))
      const uikFinanceBacked = evs.length ? evs.reduce((s,e)=> s + (e.supports?.finance || 0), 0) / evs.length : 0
      const uikRealityScore = scoring.computeRealityScore({ accuracy, ceoAlignOk, arbPlausible })
      measureRealityConvergence({
        legacyRealityScore: realityAlignmentScore,
        uikRealityScore,
        legacyExternalGrounding: externalGroundingScore,
        uikExternalGrounding: Math.round(uikFinanceBacked * 100),
        legacyCausalMatchScore: causalMatchScore,
        legacyOverconfidenceLeakage: overconfidenceLeakageScore,
        legacyArbitrationPlausible: arbPlausible,
        legacyCeoAlignmentOk: ceoAlignOk,
        legacyEvalFinanceShare: Math.round((evalFinanceShare || 0) * 100),
      })
    } catch {}
  }

  const recommendations: string[] = []
  if (realityAlignmentScore < 75) recommendations.push('Reality alignment is weak; review arbitration plausibility and CEO vs finance alignment.')
  if (causalMatchScore < 70) recommendations.push('Causal signals are weak; ensure predictions consistently precede measured outcomes.')
  if (externalGroundingScore < 60) recommendations.push('Increase reliance on externally verifiable signals (finance) where appropriate.')
  if (overconfidenceLeakageScore > 30) recommendations.push('Detected overconfidence leakage; tighten trust calibration and arbitration thresholds.')

  return {
    realityAlignmentScore,
    causalMatchScore,
    externalGroundingScore,
    overconfidenceLeakageScore,
    globalTruthAlignmentIndex,
    recommendations,
    details: {
      ceoAlignmentOk: ceoAlignOk,
      arbitrationStatePlausible: arbPlausible,
      causalBreakdowns,
      highTrustWrongCount: wrongHigh.length,
      highTrustEvaluated: highTrust.length,
    },
  }
}
