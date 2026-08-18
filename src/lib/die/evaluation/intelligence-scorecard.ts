import type { PredictionRecord } from './evaluation-engine'
import { computeAccuracyMetrics, computeDomainAccuracy } from './prediction-validator'
import { computeTrustCalibration } from './trust-calibration-engine'
import { computeNarrativeAccuracy } from './narrative-validator'
import { computeCeoPriorityAccuracy } from './ceo-priority-validator'

export interface ExecutiveScores {
  intelligenceReliability: number
  predictionAccuracy: number
  ceoGuidanceAccuracy: number
  narrativeAccuracy: number
  trustCalibrationScore: number
  overallIntelligenceConfidence: number
}

export interface EvaluationSummary {
  overallAccuracy: number
  falsePositiveRate: number
  falseNegativeRate: number
  precision: number
  recall: number

  trustCalibration: ReturnType<typeof computeTrustCalibration>
  domainAccuracy: ReturnType<typeof computeDomainAccuracy>
  ceoPriorityAccuracy: ReturnType<typeof computeCeoPriorityAccuracy>
  narrativeAccuracy: ReturnType<typeof computeNarrativeAccuracy>

  recentEvaluations: PredictionRecord[]
  recommendations: string[]
  scores: ExecutiveScores
}

export function buildScorecard(evaluated: PredictionRecord[], allRecords: PredictionRecord[]) : EvaluationSummary {
  const accuracy = computeAccuracyMetrics(evaluated, allRecords)
  const domain = computeDomainAccuracy(evaluated)
  const trust = computeTrustCalibration(evaluated)
  const narratives = computeNarrativeAccuracy(evaluated)
  const ceo = computeCeoPriorityAccuracy([]) // filled by API from evaluated CEO batches

  const recs: string[] = []
  const byDomain = new Map(domain.map((d) => [d.domain, d.accuracy]))
  const sorted = [...byDomain.entries()].sort((a,b) => b[1] - a[1])
  if (sorted.length >= 2) {
    const best = sorted[0]
    const worst = sorted[sorted.length - 1]
    if (worst[1] < best[1] - 0.1) {
      recs.push(`${worst[0]} intelligence accuracy is materially lower than other domains. Additional signal quality or calibration may be required.`)
    }
  }

  // Executive scores (0..100)
  const intelligenceReliability = Math.round((accuracy.overallAccuracy) * 100)
  const predictionAccuracy = Math.round((accuracy.precision * 0.6 + accuracy.recall * 0.4) * 100)
  const ceoGuidanceAccuracy = Math.round(((ceo.top1Accuracy * 0.6 + ceo.top3Accuracy * 0.3 + ceo.top5Accuracy * 0.1)) * 100)
  const narrativeAccuracy = narratives.overallScore
  const trustCalibrationScore = trust.calibrationScore
  const overallIntelligenceConfidence = Math.round((intelligenceReliability * 0.4 + predictionAccuracy * 0.3 + ceoGuidanceAccuracy * 0.1 + narrativeAccuracy * 0.1 + trustCalibrationScore * 0.1) / 1)

  return {
    overallAccuracy: accuracy.overallAccuracy,
    falsePositiveRate: accuracy.falsePositiveRate,
    falseNegativeRate: accuracy.falseNegativeRate,
    precision: accuracy.precision,
    recall: accuracy.recall,
    trustCalibration: trust,
    domainAccuracy: domain,
    ceoPriorityAccuracy: ceo,
    narrativeAccuracy: narratives,
    recentEvaluations: evaluated.slice(0, 50),
    recommendations: recs,
    scores: {
      intelligenceReliability,
      predictionAccuracy,
      ceoGuidanceAccuracy,
      narrativeAccuracy,
      trustCalibrationScore,
      overallIntelligenceConfidence,
    },
  }
}
