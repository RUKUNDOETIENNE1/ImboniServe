import type { NextApiRequest, NextApiResponse } from 'next'
import { evaluateDue } from '@/lib/die/evaluation/evaluation-engine'
import { getEvaluatedRecords, getRecords, getEvaluatedCeoBatches } from '@/lib/die/evaluation/evaluation-engine'
import { buildScorecard } from '@/lib/die/evaluation/intelligence-scorecard'
import { computeCeoPriorityAccuracy } from '@/lib/die/evaluation/ceo-priority-validator'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    if (process.env.DIE_INTELLIGENCE_EVALUATION_ENABLED !== 'true') {
      return res.status(200).json({
        overallAccuracy: 0,
        falsePositiveRate: 0,
        falseNegativeRate: 0,
        precision: 0,
        recall: 0,
        trustCalibration: { buckets: [], monotonic: false, calibrationScore: 0 },
        domainAccuracy: [],
        ceoPriorityAccuracy: { batchesEvaluated: 0, top1Accuracy: 0, top3Accuracy: 0, top5Accuracy: 0 },
        narrativeAccuracy: { categories: [], overallScore: 0 },
        recentEvaluations: [],
        recommendations: [],
        scores: {
          intelligenceReliability: 0,
          predictionAccuracy: 0,
          ceoGuidanceAccuracy: 0,
          narrativeAccuracy: 0,
          trustCalibrationScore: 0,
          overallIntelligenceConfidence: 0,
        },
      })
    }

    // Evaluate any due predictions first (lazy, read-only)
    await evaluateDue()

    const evaluated = getEvaluatedRecords()
    const all = getRecords()
    const scorecard = buildScorecard(evaluated, all)

    // CEO batch accuracy uses evaluated CEO batches
    const ceoAcc = computeCeoPriorityAccuracy(getEvaluatedCeoBatches())
    scorecard.ceoPriorityAccuracy = ceoAcc
    scorecard.scores.ceoGuidanceAccuracy = Math.round(((ceoAcc.top1Accuracy * 0.6 + ceoAcc.top3Accuracy * 0.3 + ceoAcc.top5Accuracy * 0.1)) * 100)

    return res.status(200).json(scorecard)
  } catch (e: any) {
    console.debug('[DIE][Evaluation API] error (ignored):', e?.message)
    return res.status(200).json({ error: 'disabled or unavailable' })
  }
}
