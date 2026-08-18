import { getTemporalComparisons } from '@/lib/die/assistant/context-cache'
import { computeFinanceSnapshot } from '@/lib/die/finance/finance-intelligence'
import { buildTruthAuditSnapshot } from '@/lib/die/audit/truth-audit-engine'
import { evaluateDue, getEvaluatedRecords, getRecords, getCeoBatches } from '@/lib/die/evaluation/evaluation-engine'
import { computeAccuracyMetrics } from '@/lib/die/evaluation/prediction-validator'
import { getEvidence } from '@/lib/die/kernel/unified-intelligence-kernel'
import { scoring } from '@/lib/die/kernel/unified-intelligence-kernel'
import { measureArbitrationConvergence } from '@/lib/die/convergence/convergence-engine'

export type ConflictType = 'semantic_conflict' | 'temporal_conflict' | 'financial_conflict' | 'priority_conflict' | 'trust_conflict'

export interface ConflictItem {
  type: ConflictType
  severity: number // 0..1
  note: string
}

export interface ConflictReport {
  conflicts: ConflictItem[]
  conflictScore: number // 0..1
}

export interface ConsensusInsight {
  key: string // usually an insightType or domain key
  consensus: 'AGREE' | 'DISAGREE' | 'UNCLEAR'
  confidence: number // 0..1
  layers: {
    finance?: number // 0..1 support
    evaluation?: number // 0..1 support (correctness probability)
    temporal?: number // 0..1 support
    ceo?: number // 0..1 support (priority presence)
    auditPenalty?: number // 0..1 penalty
    reasoning?: number // reserved, 0 (we do not read reasoning here)
  }
}

export interface ArbitrationSnapshot {
  consensusInsights: ConsensusInsight[]
  consensusConfidence: number // 0..1 (overall)
  conflictReport: ConflictReport
  disagreementIndex: number // 0..100
  finalSystemState: 'HEALTHY' | 'DEGRADED' | 'UNSTABLE' | 'CONFLICTED'
  explanation: string
}

const WEIGHTS = {
  finance: 0.30,
  evaluation: 0.25,
  temporal: 0.20,
  auditPenalty: -0.15,
  ceo: 0.10,
  reasoning: 0.10,
}

function clamp01(n: number) { return Math.max(0, Math.min(1, n)) }

function pickIssuesFromEvaluations(): string[] {
  const recs = getEvaluatedRecords()
  const counts = new Map<string, number>()
  for (const r of recs) {
    const k = String(r.insightType)
    counts.set(k, (counts.get(k) || 0) + 1)
  }
  return [...counts.entries()].sort((a,b) => b[1]-a[1]).slice(0, 3).map(([k]) => k)
}

function pickIssuesFromCEO(): string[] {
  const batches = getCeoBatches()
  const last = batches[0]
  if (!last) return []
  return last.predictedOrder.slice(0, 3).map((p) => String(p.insightType))
}

function uniqueIssues(): string[] {
  const set = new Set<string>([...pickIssuesFromEvaluations(), ...pickIssuesFromCEO()])
  return Array.from(set)
}

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

function evaluationSupportFor(key: string): number {
  const recs = getEvaluatedRecords().filter((r) => String(r.insightType) === key)
  if (recs.length === 0) return 0
  const correct = recs.filter((r) => r.predictionCorrect).length
  return correct / recs.length
}

function ceoSupportFor(key: string): number {
  const batches = getCeoBatches()
  const last = batches[0]
  if (!last) return 0
  const idx = last.predictedOrder.findIndex((p) => String(p.insightType) === key)
  if (idx === -1) return 0
  if (idx === 0) return 1
  if (idx === 1) return 0.7
  if (idx === 2) return 0.5
  return 0.3
}

function buildConsensusForKey(key: string, fin: Awaited<ReturnType<typeof computeFinanceSnapshot>> | null, auditPenalty: number): ConsensusInsight {
  const layers = {
    finance: financeSupportFor(key, fin),
    evaluation: evaluationSupportFor(key),
    temporal: temporalSupportFor(key),
    ceo: ceoSupportFor(key),
    auditPenalty: auditPenalty,
    reasoning: 0,
  }
  const base = WEIGHTS.finance * (layers.finance || 0)
    + WEIGHTS.evaluation * (layers.evaluation || 0)
    + WEIGHTS.temporal * (layers.temporal || 0)
    + WEIGHTS.ceo * (layers.ceo || 0)
    + WEIGHTS.reasoning * (layers.reasoning || 0)
    + WEIGHTS.auditPenalty * (layers.auditPenalty || 0)
  const confidence = clamp01(base)
  const consensus: ConsensusInsight['consensus'] = confidence >= 0.6 ? 'AGREE' : confidence <= 0.3 ? 'DISAGREE' : 'UNCLEAR'
  return { key, consensus, confidence, layers }
}

function detectConflicts(fin: Awaited<ReturnType<typeof computeFinanceSnapshot>> | null, audit: Awaited<ReturnType<typeof buildTruthAuditSnapshot>>, accuracy: number): ConflictReport {
  const conflicts: ConflictItem[] = []

  // trust_conflict: Evaluation vs Truth Audit disagree materially
  const trustGap = Math.abs(accuracy - (1 - audit.truthStabilityIndex.truthStabilityScore / 100))
  if (trustGap > 0.25 || audit.contradictionReport.contradictionScore > 0.4) {
    conflicts.push({ type: 'trust_conflict', severity: clamp01(0.5 * trustGap + 0.5 * audit.contradictionReport.contradictionScore), note: 'Evaluation correctness disagrees with adversarial contradictions' })
  }

  // temporal_conflict: Truth audit flagged temporal mismatch
  if (audit.contradictionReport.contradictionTypes.includes('temporal mismatch')) {
    conflicts.push({ type: 'temporal_conflict', severity: Math.max(0.5, audit.contradictionReport.contradictionScore), note: 'Reasoning vs temporal trends mismatch' })
  }

  // financial_conflict: Finance disagrees with operational signals
  try {
    const t = getTemporalComparisons()
    const opRising = t.hour.operationalPressure.direction === 'RISING'
    const supplyRising = t.hour.supplyRisk.direction === 'RISING'
    const financeHealthy = !!fin && fin.health.revenueHealthScore >= 75 && fin.health.paymentFailureRate <= 10 && fin.health.refundRate <= 10
    if ((opRising || supplyRising) && financeHealthy) {
      const sev = (opRising ? 0.6 : 0) + (supplyRising ? 0.4 : 0)
      conflicts.push({ type: 'financial_conflict', severity: clamp01(sev), note: 'Operational stress rising while finance appears healthy' })
    }
  } catch {}

  // priority_conflict: CEO top priority vs Finance signals
  try {
    const batches = getCeoBatches()
    const last = batches[0]
    if (last) {
      const top = last.predictedOrder[0]
      const financeUrgent = !!fin && (fin.trends.day.revenue.direction === 'FALLING' || fin.health.revenueHealthScore < 60 || fin.health.paymentFailureRate > 20 || fin.health.refundRate > 15)
      const topIsFinance = top && (String(top.insightType).includes('REVENUE') || String(top.insightType).includes('PAYMENT') || String(top.insightType).includes('FINANC'))
      if ((financeUrgent && !topIsFinance) || (!financeUrgent && topIsFinance)) {
        conflicts.push({ type: 'priority_conflict', severity: 0.7, note: 'CEO priority misaligned with finance conditions' })
      }
    }
  } catch {}

  // semantic_conflict: audit flagged cross-domain inconsistency
  if (audit.contradictionReport.contradictionTypes.includes('cross-domain inconsistency')) {
    conflicts.push({ type: 'semantic_conflict', severity: Math.max(0.5, audit.contradictionReport.contradictionScore), note: 'Cross-domain inconsistency detected' })
  }

  const conflictScore = conflicts.length ? clamp01(conflicts.reduce((s, c) => s + c.severity, 0) / conflicts.length) : 0
  return { conflicts, conflictScore }
}

function computeDisagreementIndex(conflicts: ConflictReport, accuracy: number, evaluatedTrustAvg: number): number {
  const conflictFactor = conflicts.conflictScore
  const countFactor = Math.min(1, conflicts.conflicts.length / 5)
  const trustDivergence = Math.abs(evaluatedTrustAvg - accuracy)
  const idx = clamp01(0.4 * conflictFactor + 0.3 * countFactor + 0.3 * trustDivergence)
  return Math.round(idx * 100)
}

function deriveFinalState(consensusConfidence: number, disagreementIndex: number, truthScore: number): ArbitrationSnapshot['finalSystemState'] {
  if (consensusConfidence >= 0.75 && disagreementIndex < 30 && truthScore >= 80) return 'HEALTHY'
  if (consensusConfidence >= 0.6 && disagreementIndex < 50 && truthScore >= 70) return 'DEGRADED'
  if (disagreementIndex >= 50 || truthScore < 60) return 'UNSTABLE'
  return 'CONFLICTED'
}

export async function buildArbitrationSnapshot(): Promise<ArbitrationSnapshot> {
  if (process.env.DIE_INTELLIGENCE_ARBITRATION_ENABLED !== 'true') {
    return {
      consensusInsights: [],
      consensusConfidence: 0,
      conflictReport: { conflicts: [], conflictScore: 0 },
      disagreementIndex: 0,
      finalSystemState: 'CONFLICTED',
      explanation: 'Arbitration disabled',
    }
  }

  // Ensure evaluation is up to date (lazy, read-only)
  await evaluateDue()

  const evaluated = getEvaluatedRecords()
  const allRecords = getRecords()
  const accuracy = computeAccuracyMetrics(evaluated, allRecords).overallAccuracy

  // Average trust across evaluated
  const trustAvg = evaluated.length ? evaluated.reduce((s, r) => s + (r.trustScore ?? 50) / 100, 0) / evaluated.length : 0.5

  // Truth audit snapshot
  const audit = await buildTruthAuditSnapshot()

  // Finance (if enabled)
  const fin = process.env.DIE_FINANCE_INTELLIGENCE_ENABLED === 'true' ? await computeFinanceSnapshot() : null

  // Consensus issues
  const auditPenalty = audit.contradictionReport.contradictionScore // 0..1
  const issues = uniqueIssues()
  if (process.env.DIE_INTELLIGENCE_KERNEL_SHADOW === 'true') {
    try { await Promise.all(issues.map((k) => getEvidence(k as any))) } catch {}
  }
  const consensusInsights = issues.map((k) => buildConsensusForKey(k, fin, auditPenalty))
  const consensusConfidence = consensusInsights.length ? clamp01(consensusInsights.reduce((s, c) => s + c.confidence, 0) / consensusInsights.length) : 0

  // Conflicts
  const conflictReport = detectConflicts(fin, audit, accuracy)

  // Disagreement index
  const disagreementIndex = computeDisagreementIndex(conflictReport, accuracy, trustAvg)

  // Final state
  const finalSystemState = deriveFinalState(consensusConfidence, disagreementIndex, audit.truthStabilityIndex.truthStabilityScore)

  const explanation = `Consensus=${(consensusConfidence*100).toFixed(0)}%, DisagreementIndex=${disagreementIndex}, TruthGrade=${audit.truthStabilityIndex.systemTruthGrade}`

  // Dual-read convergence (placed after conflict/state computation for expanded parity metrics)
  if (process.env.DIE_INTELLIGENCE_DUAL_READ_ENABLED === 'true') {
    try {
      const evs = await Promise.all(issues.map((k) => getEvidence(k as any)))
      const uikConsensus = evs.map((e, idx) => {
        const key = issues[idx]
        const conf = scoring.computeConsensusScore({ layerSupports: { finance: e.supports?.finance || 0, evaluation: e.supports?.evaluation || 0, temporal: e.supports?.temporal || 0, ceo: 0, reasoning: 0 }, auditPenalty: audit.contradictionReport.contradictionScore }).confidence
        return { key, confidence: conf }
      })
      const uikOverall = uikConsensus.length ? clamp01(uikConsensus.reduce((s, c) => s + c.confidence, 0) / uikConsensus.length) : 0
      const legacyConsensus = consensusInsights.map((c) => ({ key: c.key, confidence: c.confidence }))

      // CEO observability (legacy side only): weight contribution and influence
      const ceoContribs = consensusInsights.map(c => (c.layers.ceo || 0) * (WEIGHTS.ceo))
      const ceoAvgWeight = ceoContribs.length ? ceoContribs.reduce((s,v)=>s+v,0)/ceoContribs.length : 0
      const xs = consensusInsights.map(c => c.layers.ceo || 0)
      const ys = consensusInsights.map(c => c.confidence)
      const mean = (arr:number[]) => arr.length ? arr.reduce((s,v)=>s+v,0)/arr.length : 0
      const mx = mean(xs), my = mean(ys)
      let num = 0, denx = 0, deny = 0
      for (let i=0;i<xs.length;i++){ const dx = xs[i]-mx; const dy = ys[i]-my; num += dx*dy; denx += dx*dx; deny += dy*dy }
      const legacyCeoInfluence = (denx>0 && deny>0) ? Math.max(0, Math.min(1, num / Math.sqrt(denx*deny))) : 0

      measureArbitrationConvergence({
        legacyConsensus,
        uikConsensus,
        legacyOverall: consensusConfidence,
        uikOverall,
        legacyConflictScore: conflictReport.conflictScore,
        legacyConflictTypes: conflictReport.conflicts.map(c=>c.type),
        legacyDisagreementIndex: disagreementIndex,
        legacyFinalSystemState: finalSystemState,
        legacyCeoWeight: ceoAvgWeight,
        legacyCeoInfluence,
      })
    } catch {}
  }

  return {
    consensusInsights,
    consensusConfidence,
    conflictReport,
    disagreementIndex,
    finalSystemState,
    explanation,
  }
}
