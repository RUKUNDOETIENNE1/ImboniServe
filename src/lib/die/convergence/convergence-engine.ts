import { logDrift, type DriftMetrics } from '@/lib/die/convergence/drift-logger'
import { scoring } from '@/lib/die/kernel/unified-intelligence-kernel'

export interface LegacyVsUIK<T> {
  legacy: T
  uik: T
}

export interface ConvergenceReport {
  at: string
  module: 'arbitration' | 'meta' | 'reality' | 'truth-audit' | 'calibration' | 'evaluation'
  metrics: DriftMetrics
  notes?: string[]
}

function clamp01(n: number){ return Math.max(0, Math.min(1, n)) }
function pct(a: number){ return Math.round(clamp01(a)*100) }
function jaccard(a: string[] = [], b: string[] = []): number {
  const A = new Set(a)
  const B = new Set(b)
  const union = new Set<string>([...A, ...B])
  let inter = 0
  for (const x of A) if (B.has(x)) inter += 1
  return union.size ? inter / union.size : 1
}

// Simple absolute-difference scoring helpers (0..100, higher = more drift)
function drift01(a?: number, b?: number){ if (a===undefined || b===undefined) return 0; return Math.abs(a-b) }

// Spearman rho rank correlation over union(top-K); convert to drift (0..1 -> 0..100)
function rankCorrelationDrift(a: Array<{key:string;score:number}>, b: Array<{key:string;score:number}>, K = 5): number {
  const topA = a.slice(0, K).map((x, i) => ({ key: x.key, r: i+1 }))
  const topB = b.slice(0, K).map((x, i) => ({ key: x.key, r: i+1 }))
  const set = new Set<string>([...topA.map(x=>x.key), ...topB.map(x=>x.key)])
  const maxRank = K + 1
  const ranksA = new Map<string, number>(topA.map(x => [x.key, x.r]))
  const ranksB = new Map<string, number>(topB.map(x => [x.key, x.r]))
  const n = set.size
  if (n === 0) return 0
  let sumDiffSq = 0
  for (const k of set) {
    const ra = ranksA.get(k) ?? maxRank
    const rb = ranksB.get(k) ?? maxRank
    const d = ra - rb
    sumDiffSq += d*d
  }
  // Spearman rho formula: 1 - (6 * sum(d^2)) / (n*(n^2-1))
  const denom = n*(n*n - 1)
  const rho = denom ? 1 - (6 * sumDiffSq) / denom : 0
  // Map rho [-1,1] to drift [0,1]
  const drift = (1 - ((rho + 1) / 2)) // 0 when rho=1, 1 when rho=-1
  return clamp01(drift)
}

export function reportConvergence(input: ConvergenceReport): void {
  logDrift({ at: Date.now(), module: input.module, metrics: input.metrics, details: input })
}

export function measureArbitrationConvergence(args: {
  legacyConsensus: Array<{ key: string; confidence: number }>
  uikConsensus: Array<{ key: string; confidence: number }>
  legacyOverall: number
  uikOverall: number
  // optional expanded inputs
  legacyConflictScore?: number
  uikConflictScore?: number
  legacyConflictTypes?: string[]
  uikConflictTypes?: string[]
  legacyDisagreementIndex?: number
  uikDisagreementIndex?: number
  legacyFinalSystemState?: string
  uikFinalSystemState?: string
  legacyCeoWeight?: number
  uikCeoWeight?: number
  legacyCeoInfluence?: number // correlation 0..1
  uikCeoInfluence?: number // correlation 0..1
}): ConvergenceReport {
  const scoringDriftScore = pct(drift01(args.legacyOverall, args.uikOverall))
  const rankingCorrelationDrift = pct(rankCorrelationDrift(
    args.legacyConsensus.map(c=>({key:c.key, score:c.confidence})),
    args.uikConsensus.map(c=>({key:c.key, score:c.confidence})),
  ))

  const metrics: DriftMetrics = { scoringDriftScore, rankingCorrelationDrift, rankingDriftScore: rankingCorrelationDrift }

  if (args.legacyConflictScore !== undefined || args.uikConflictScore !== undefined) {
    metrics.conflictScoreDrift = pct(drift01(args.legacyConflictScore, args.uikConflictScore))
  }
  if (args.legacyConflictTypes || args.uikConflictTypes) {
    const jac = jaccard(args.legacyConflictTypes || [], args.uikConflictTypes || [])
    metrics.conflictTypesJaccardDrift = pct(1 - jac)
  }
  if (args.legacyDisagreementIndex !== undefined || args.uikDisagreementIndex !== undefined) {
    const a = (args.legacyDisagreementIndex ?? 0) / 100
    const b = (args.uikDisagreementIndex ?? 0) / 100
    metrics.disagreementIndexDrift = pct(drift01(a, b))
  }
  if (args.legacyFinalSystemState || args.uikFinalSystemState) {
    metrics.finalSystemStateMismatch = (args.legacyFinalSystemState && args.uikFinalSystemState && args.legacyFinalSystemState !== args.uikFinalSystemState) ? 100 : 0
  }
  if (args.legacyCeoWeight !== undefined || args.uikCeoWeight !== undefined) {
    const a = args.legacyCeoWeight ?? 0
    const b = args.uikCeoWeight ?? 0
    metrics.ceoWeightDrift = pct(drift01(a, b))
  }
  if (args.legacyCeoInfluence !== undefined || args.uikCeoInfluence !== undefined) {
    const a = args.legacyCeoInfluence ?? 0
    const b = args.uikCeoInfluence ?? 0
    metrics.ceoInfluenceDrift = pct(drift01(a, b))
  }

  const report: ConvergenceReport = { at: new Date().toISOString(), module: 'arbitration', metrics }
  reportConvergence(report)
  return report
}

export function measureRealityConvergence(args: {
  legacyRealityScore: number
  uikRealityScore: number
  legacyExternalGrounding?: number
  uikExternalGrounding?: number
  legacyCausalMatchScore?: number
  uikCausalMatchScore?: number
  legacyOverconfidenceLeakage?: number
  uikOverconfidenceLeakage?: number
  legacyArbitrationPlausible?: boolean
  uikArbitrationPlausible?: boolean
  legacyCeoAlignmentOk?: boolean
  uikCeoAlignmentOk?: boolean
  legacyEvalFinanceShare?: number // 0..100
  uikEvalFinanceShare?: number // 0..100
}): ConvergenceReport {
  const scoringDriftScore = pct(drift01(args.legacyRealityScore/100, args.uikRealityScore/100))
  const financeInterpretationDrift = pct(drift01((args.legacyExternalGrounding||0)/100, (args.uikExternalGrounding||0)/100))
  const metrics: DriftMetrics = { scoringDriftScore, financeInterpretationDrift, financeBackedConfirmationDrift: financeInterpretationDrift }
  const notes: string[] = []

  if (args.legacyCausalMatchScore !== undefined || args.uikCausalMatchScore !== undefined) {
    metrics.causalMatchDrift = pct(drift01((args.legacyCausalMatchScore||0)/100, (args.uikCausalMatchScore||0)/100))
  }
  if (args.legacyOverconfidenceLeakage !== undefined || args.uikOverconfidenceLeakage !== undefined) {
    metrics.overconfidenceLeakageDrift = pct(drift01((args.legacyOverconfidenceLeakage||0)/100, (args.uikOverconfidenceLeakage||0)/100))
  }
  if (args.legacyArbitrationPlausible !== undefined && args.uikArbitrationPlausible !== undefined) {
    metrics.arbitrationPlausibilityMismatch = args.legacyArbitrationPlausible === args.uikArbitrationPlausible ? 0 : 100
  }
  if (args.legacyCeoAlignmentOk !== undefined && args.uikCeoAlignmentOk !== undefined) {
    metrics.ceoAlignmentMismatch = args.legacyCeoAlignmentOk === args.uikCeoAlignmentOk ? 0 : 100
  }
  if (args.legacyEvalFinanceShare !== undefined || args.uikEvalFinanceShare !== undefined) {
    metrics.evalFinanceShareDrift = pct(drift01((args.legacyEvalFinanceShare||0)/100, (args.uikEvalFinanceShare||0)/100))
  }

  // Heuristic: large grounding drift but similar evaluation finance share -> likely semantic source mismatch
  const evalShareDrift = (args.legacyEvalFinanceShare !== undefined || args.uikEvalFinanceShare !== undefined)
    ? pct(drift01((args.legacyEvalFinanceShare||0)/100, (args.uikEvalFinanceShare||0)/100))
    : undefined
  if (financeInterpretationDrift >= 30 && (evalShareDrift !== undefined && evalShareDrift <= 10)) {
    notes.push('source-semantic-mismatch: finance.providerFailures vs finance.paymentExceptions (methodology difference)')
  }

  const report: ConvergenceReport = { at: new Date().toISOString(), module: 'reality', metrics, notes: notes.length ? notes : undefined }
  reportConvergence(report)
  return report
}

export function measureTruthAuditConvergence(args: {
  legacyTruthScore: number
  uikTruthScore: number
  legacyContradiction?: number // 0..1
  uikContradiction?: number // 0..1
  legacyContradictionTypes?: string[]
  uikContradictionTypes?: string[]
  legacyBiasScore?: number // 0..1
  uikBiasScore?: number // 0..1
  legacyBiasPatterns?: string[]
  uikBiasPatterns?: string[]
  legacyOverconfidenceRisk?: number // 0..1
  uikOverconfidenceRisk?: number // 0..1
  legacyOverconfidenceCategories?: string[]
  uikOverconfidenceCategories?: string[]
}): ConvergenceReport {
  const scoringDriftScore = pct(drift01(args.legacyTruthScore/100, args.uikTruthScore/100))
  const semanticDriftScore = pct(drift01(args.legacyContradiction||0, args.uikContradiction||0))
  const metrics: DriftMetrics = { scoringDriftScore, semanticDriftScore, contradictionSeverityDrift: semanticDriftScore }

  if (args.legacyContradictionTypes || args.uikContradictionTypes) {
    const jac = jaccard(args.legacyContradictionTypes || [], args.uikContradictionTypes || [])
    metrics.contradictionTypesJaccardDrift = pct(1 - jac)
  }
  if (args.legacyBiasScore !== undefined || args.uikBiasScore !== undefined) {
    metrics.biasScoreDrift = pct(drift01(args.legacyBiasScore || 0, args.uikBiasScore || 0))
  }
  if (args.legacyBiasPatterns || args.uikBiasPatterns) {
    const jac = jaccard(args.legacyBiasPatterns || [], args.uikBiasPatterns || [])
    metrics.biasPatternJaccardDrift = pct(1 - jac)
  }
  if (args.legacyOverconfidenceRisk !== undefined || args.uikOverconfidenceRisk !== undefined) {
    metrics.overconfidenceRiskDrift = pct(drift01(args.legacyOverconfidenceRisk || 0, args.uikOverconfidenceRisk || 0))
  }
  if (args.legacyOverconfidenceCategories || args.uikOverconfidenceCategories) {
    const jac = jaccard(args.legacyOverconfidenceCategories || [], args.uikOverconfidenceCategories || [])
    metrics.overconfidenceCategoryJaccardDrift = pct(1 - jac)
  }

  const report: ConvergenceReport = { at: new Date().toISOString(), module: 'truth-audit', metrics }
  reportConvergence(report)
  return report
}

export function measureCalibrationConvergence(args: {
  legacyTrustScore: number
  uikTrustScore: number
}): ConvergenceReport {
  const scoringDriftScore = pct(drift01(args.legacyTrustScore/100, args.uikTrustScore/100))
  const metrics: DriftMetrics = { scoringDriftScore }
  const report: ConvergenceReport = { at: new Date().toISOString(), module: 'calibration', metrics }
  reportConvergence(report)
  return report
}

export function measureEvaluationConvergence(args: {
  legacyAccuracy: number
  uikAccuracy?: number
  unsupported?: boolean // if true, exclude from scoring to avoid false parity
}): ConvergenceReport {
  const metrics: DriftMetrics = {}
  if (!args.unsupported && args.uikAccuracy !== undefined) {
    metrics.scoringDriftScore = pct(drift01(args.legacyAccuracy, args.uikAccuracy))
  }
  const report: ConvergenceReport = { at: new Date().toISOString(), module: 'evaluation', metrics, notes: args.unsupported ? ['UNSUPPORTED:evaluationAccuracy'] : undefined }
  reportConvergence(report)
  return report
}

export function measureMetaConvergence(args: {
  legacyMetaScore: number
  uikMetaScore: number
}): ConvergenceReport {
  const scoringDriftScore = pct(drift01(args.legacyMetaScore/100, args.uikMetaScore/100))
  const metrics: DriftMetrics = { scoringDriftScore }
  const report: ConvergenceReport = { at: new Date().toISOString(), module: 'meta', metrics }
  reportConvergence(report)
  return report
}
