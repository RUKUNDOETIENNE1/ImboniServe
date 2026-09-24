import type { EvaluationDomain, PredictionRecord } from './evaluation-engine'

export interface AccuracyMetrics {
  totalPredictions: number
  evaluatedPredictions: number
  correctPredictions: number
  overallAccuracy: number // 0..1
  falsePositiveRate: number // FP / (FP + TN) approximated over positive predictions
  falseNegativeRate: number // estimated
  precision: number // TP / (TP + FP)
  recall: number // TP / (TP + FN) (estimated)
  truePositives: number
  falsePositives: number
  trueNegatives: number
}

export interface DomainAccuracy {
  domain: EvaluationDomain
  evaluated: number
  correct: number
  accuracy: number // 0..1
}

/**
 * Compute accuracy/precision/recall from evaluated prediction records.
 *
 * Classification model (read-only, approximate):
 *  - Positive predictions = problem-predicting insights (isPositivePrediction).
 *      TP = positive prediction that was correct (problem materialized/persisted)
 *      FP = positive prediction that was incorrect (problem did not occur)
 *  - Negative-ish predictions (e.g. growth) contribute to accuracy only.
 *  - FN is estimated: problems observed in outcomes for which no positive
 *    prediction of the same domain existed in the same window.
 */
export function computeAccuracyMetrics(evaluated: PredictionRecord[], allRecords: PredictionRecord[]): AccuracyMetrics {
  const total = allRecords.length
  const evaluatedCount = evaluated.length
  let correct = 0
  let tp = 0
  let fp = 0
  let tn = 0

  for (const r of evaluated) {
    if (r.predictionCorrect) correct += 1
    if (r.isPositivePrediction) {
      if (r.predictionCorrect) tp += 1
      else fp += 1
    } else {
      // non-positive (e.g. growth) correct => true negative-ish
      if (r.predictionCorrect) tn += 1
    }
  }

  // FN estimation: outcomes where metric breached its baseline adversely but
  // no positive prediction recorded for that domain in the window.
  const fn = estimateFalseNegatives(evaluated)

  const overallAccuracy = evaluatedCount ? correct / evaluatedCount : 0
  const precision = (tp + fp) ? tp / (tp + fp) : 0
  const recall = (tp + fn) ? tp / (tp + fn) : 0
  const falsePositiveRate = (fp + tn) ? fp / (fp + tn) : 0
  const falseNegativeRate = (tp + fn) ? fn / (tp + fn) : 0

  return {
    totalPredictions: total,
    evaluatedPredictions: evaluatedCount,
    correctPredictions: correct,
    overallAccuracy,
    falsePositiveRate,
    falseNegativeRate,
    precision,
    recall,
    truePositives: tp,
    falsePositives: fp,
    trueNegatives: tn,
  }
}

function estimateFalseNegatives(evaluated: PredictionRecord[]): number {
  // Heuristic: among evaluated records, find domains where the outcome metric
  // moved adversely beyond baseline but the prediction itself was a non-problem
  // (i.e. the system saw movement but did not flag a problem). This is an
  // approximation given the read-only, in-memory constraints.
  let fn = 0
  for (const r of evaluated) {
    if (r.isPositivePrediction) continue
    if (r.outcomeValue === undefined) continue
    // For a growth prediction (UP) that turned into a decline => a missed problem.
    if (r.expectation === 'UP' && r.outcomeValue < r.baselineValue * 0.9) fn += 1
  }
  return fn
}

export function computeDomainAccuracy(evaluated: PredictionRecord[]): DomainAccuracy[] {
  const map = new Map<EvaluationDomain, { evaluated: number; correct: number }>()
  for (const r of evaluated) {
    const cur = map.get(r.domain) || { evaluated: 0, correct: 0 }
    cur.evaluated += 1
    if (r.predictionCorrect) cur.correct += 1
    map.set(r.domain, cur)
  }
  const out: DomainAccuracy[] = []
  for (const [domain, v] of map.entries()) {
    out.push({ domain, evaluated: v.evaluated, correct: v.correct, accuracy: v.evaluated ? v.correct / v.evaluated : 0 })
  }
  return out.sort((a, b) => b.accuracy - a.accuracy)
}
