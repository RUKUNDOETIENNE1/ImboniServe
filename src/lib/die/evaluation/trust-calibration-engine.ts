import type { PredictionRecord } from './evaluation-engine'

export interface TrustBucket {
  range: string
  min: number
  max: number
  evaluated: number
  correct: number
  correctRate: number // 0..1
}

export interface TrustCalibrationReport {
  buckets: TrustBucket[]
  // Is trustScore meaningful? Positive monotonicity => higher trust, higher correctness.
  monotonic: boolean
  calibrationScore: number // 0..100, how well trust predicts correctness
}

const BUCKET_DEFS: Array<{ range: string; min: number; max: number }> = [
  { range: '90-100', min: 90, max: 100 },
  { range: '80-89', min: 80, max: 89.9999 },
  { range: '70-79', min: 70, max: 79.9999 },
  { range: '<70', min: -Infinity, max: 69.9999 },
]

export function computeTrustCalibration(evaluated: PredictionRecord[]): TrustCalibrationReport {
  const buckets: TrustBucket[] = BUCKET_DEFS.map((d) => ({ ...d, evaluated: 0, correct: 0, correctRate: 0 }))

  for (const r of evaluated) {
    const ts = typeof r.trustScore === 'number' ? r.trustScore : 50
    const b = buckets.find((x) => ts >= x.min && ts <= x.max)
    if (!b) continue
    b.evaluated += 1
    if (r.predictionCorrect) b.correct += 1
  }
  for (const b of buckets) b.correctRate = b.evaluated ? b.correct / b.evaluated : 0

  // Monotonicity: ordered high->low buckets should have non-increasing correctRate.
  const populated = buckets.filter((b) => b.evaluated > 0)
  let monotonic = true
  for (let i = 1; i < populated.length; i++) {
    if (populated[i].correctRate > populated[i - 1].correctRate + 0.05) { monotonic = false; break }
  }

  // Calibration score: correlation-like measure between trust midpoint and correctRate.
  let calibrationScore = 0
  if (populated.length >= 2) {
    const spread = populated[0].correctRate - populated[populated.length - 1].correctRate
    calibrationScore = Math.round(Math.max(0, Math.min(1, (monotonic ? 0.6 : 0.2) + Math.max(0, spread))) * 100)
  } else if (populated.length === 1) {
    calibrationScore = Math.round(populated[0].correctRate * 100)
  }

  return { buckets, monotonic, calibrationScore }
}
