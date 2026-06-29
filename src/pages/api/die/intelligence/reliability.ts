import type { NextApiRequest, NextApiResponse } from 'next'
import { businessReasoning } from '@/lib/die/business-intelligence/reasoning-engine'
import { correlationEngine } from '@/lib/die/intelligence-core/correlation-engine.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    if (process.env.DIE_INTELLIGENCE_RELIABILITY_ENABLED !== 'true') {
      return res.status(200).json({ trustScores: [], baselineDeviations: [], calibratedInsights: [], stabilityMetrics: [] })
    }

    const [insights, report] = await Promise.all([
      businessReasoning.generateInsights(),
      correlationEngine.generateReport(),
    ])

    const [{ buildBaselineProfile }, { compareToBaseline }, { calibrateConfidence }, { scoreStability }, { computeTrustScore }, { suppressAndMerge }] = await Promise.all([
      import('@/lib/die/intelligence-core/baseline-engine'),
      import('@/lib/die/intelligence-core/baseline-comparison'),
      import('@/lib/die/intelligence-core/confidence-calibration'),
      import('@/lib/die/intelligence-core/stability-engine'),
      import('@/lib/die/intelligence-core/trust-score'),
      import('@/lib/die/intelligence-core/insight-suppression'),
    ])

    const baseline = await buildBaselineProfile()

    const calibrated = insights.map((ins) => {
      const calib = calibrateConfidence(ins, baseline, report)
      const stab = scoreStability(ins)
      const trust = computeTrustScore({
        insight: ins,
        calibratedConfidence: calib.calibrated,
        stabilityScore: stab.score,
        baselineSignificance: Math.min(1, Math.abs((calib.baselineDeviationPct || 0)) / 100),
        crossDomainSupport: calib.crossDomainSupport || 0,
      })
      const out: any = { ...ins }
      out.calibratedConfidence = calib.calibrated
      out.stabilityScore = stab
      out.trustScore = trust.score
      return out
    })

    const deviations = calibrated
      .filter((i) => i.baselineDeviation)
      .map((i) => i.baselineDeviation)

    const stabilityMetrics = calibrated.map((i) => i.stabilityScore)
    const trustScores = calibrated.map((i) => ({ type: i.type, score: i.trustScore }))

    const suppressed = suppressAndMerge(calibrated)

    return res.status(200).json({
      trustScores,
      baselineDeviations: deviations,
      calibratedInsights: suppressed.insights,
      stabilityMetrics,
      suppressionState: suppressed.state,
    })
  } catch (e: any) {
    console.debug('[DIE][Reliability API] error (ignored):', e?.message)
    return res.status(200).json({ trustScores: [], baselineDeviations: [], calibratedInsights: [], stabilityMetrics: [] })
  }
}
