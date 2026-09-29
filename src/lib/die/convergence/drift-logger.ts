export type DriftMetrics = {
  semanticDriftScore?: number // 0..100
  scoringDriftScore?: number // 0..100
  rankingDriftScore?: number // 0..100
  financeInterpretationDrift?: number // 0..100
  temporalDrift?: number // 0..100
  // Expanded (observability-only) metrics
  rankingCorrelationDrift?: number // 0..100 (1 - correlation)
  contradictionTypesJaccardDrift?: number // 0..100
  contradictionSeverityDrift?: number // 0..100
  biasScoreDrift?: number // 0..100
  biasPatternJaccardDrift?: number // 0..100
  overconfidenceRiskDrift?: number // 0..100
  overconfidenceCategoryJaccardDrift?: number // 0..100
  conflictScoreDrift?: number // 0..100
  conflictTypesJaccardDrift?: number // 0..100
  disagreementIndexDrift?: number // 0..100
  finalSystemStateMismatch?: number // 0 or 100
  causalMatchDrift?: number // 0..100
  overconfidenceLeakageDrift?: number // 0..100
  arbitrationPlausibilityMismatch?: number // 0 or 100
  ceoAlignmentMismatch?: number // 0 or 100
  financeBackedConfirmationDrift?: number // 0..100
  evalFinanceShareDrift?: number // 0..100
  ceoWeightDrift?: number // 0..100
  ceoInfluenceDrift?: number // 0..100
  ceoCoverageDrift?: number // 0..100
} & { [k: string]: number | undefined }

export interface ConvergenceEntry {
  at: number
  module: 'arbitration' | 'meta' | 'reality' | 'truth-audit' | 'calibration' | 'evaluation'
  metrics: DriftMetrics
  details?: any
}

const LIMIT = 200
let buffer: ConvergenceEntry[] = []

export function logDrift(entry: ConvergenceEntry): void {
  try {
    buffer.unshift(entry)
    if (buffer.length > LIMIT) buffer = buffer.slice(0, LIMIT)
  } catch { /* ignore */ }
}

export function getRecent(limit = 50): ConvergenceEntry[] {
  return buffer.slice(0, Math.max(0, Math.min(limit, LIMIT)))
}

export function getLatest(): ConvergenceEntry | null {
  return buffer[0] || null
}

function avg(nums: number[]): number { return nums.length ? nums.reduce((s,n)=>s+n,0)/nums.length : 0 }

export function getAggregate(): {
  average: DriftMetrics,
  byModule: Record<ConvergenceEntry['module'], DriftMetrics>
} {
  // Per-module, per-metric accumulators: { [metricName]: { sum, count } }
  const modules: Array<ConvergenceEntry['module']> = ['arbitration', 'meta', 'reality', 'truth-audit', 'calibration', 'evaluation']
  const groupAcc: Record<ConvergenceEntry['module'], Record<string, { sum: number; count: number }>> = {
    arbitration: {}, meta: {}, reality: {}, 'truth-audit': {}, calibration: {}, evaluation: {},
  }
  const totalAcc: Record<string, { sum: number; count: number }> = {}

  for (const e of buffer) {
    const m = e.module
    const metrics = e.metrics as Record<string, unknown>
    for (const [k, v] of Object.entries(metrics)) {
      if (typeof v !== 'number' || !Number.isFinite(v)) continue
      const gm = groupAcc[m]
      const gk = gm[k] || { sum: 0, count: 0 }
      gk.sum += v
      gk.count += 1
      gm[k] = gk

      const tk = totalAcc[k] || { sum: 0, count: 0 }
      tk.sum += v
      tk.count += 1
      totalAcc[k] = tk
    }
  }

  const byModule: Record<ConvergenceEntry['module'], DriftMetrics> = {
    arbitration: {}, meta: {}, reality: {}, 'truth-audit': {}, calibration: {}, evaluation: {},
  }
  for (const mod of modules) {
    const acc = groupAcc[mod]
    const out: Record<string, number> = {}
    for (const [k, v] of Object.entries(acc)) {
      out[k] = v.count ? v.sum / v.count : 0
    }
    byModule[mod] = out as DriftMetrics
  }

  const average: DriftMetrics = {}
  for (const [k, v] of Object.entries(totalAcc)) {
    (average as any)[k] = v.count ? v.sum / v.count : 0
  }

  return { average, byModule }
}
