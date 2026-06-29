import type { NextApiRequest, NextApiResponse } from 'next'
import { getAggregate, getLatest, getRecent } from '@/lib/die/convergence/drift-logger'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.DIE_INTELLIGENCE_CONVERGENCE_ENABLED !== 'true') {
    return res.status(200).json({ enabled: false, latest: null, average: null, byModule: null, parity: 'DISABLED' })
  }
  try {
    const latest = getLatest()
    const { average, byModule } = getAggregate()
    const avg = average
    const maxDrift = Math.max(
      avg.semanticDriftScore || 0,
      avg.scoringDriftScore || 0,
      avg.rankingDriftScore || 0,
      avg.financeInterpretationDrift || 0,
      avg.temporalDrift || 0,
    )
    const parity = maxDrift < 15 ? 'PASS' : maxDrift < 35 ? 'WARN' : 'FAIL'

    // Coverage assessment (observability-only; additive)
    const COVERAGE_TARGETS = [
      'semanticDriftScore','scoringDriftScore','rankingDriftScore','financeInterpretationDrift','temporalDrift',
      'rankingCorrelationDrift','contradictionTypesJaccardDrift','contradictionSeverityDrift','biasScoreDrift','biasPatternJaccardDrift',
      'overconfidenceRiskDrift','overconfidenceCategoryJaccardDrift','conflictScoreDrift','conflictTypesJaccardDrift','disagreementIndexDrift','finalSystemStateMismatch',
      'causalMatchDrift','overconfidenceLeakageDrift','arbitrationPlausibilityMismatch','ceoAlignmentMismatch',
      'financeBackedConfirmationDrift','evalFinanceShareDrift','ceoWeightDrift','ceoInfluenceDrift','ceoCoverageDrift',
    ] as const
    const covered = new Set<string>()
    for (const mod of Object.keys(byModule) as Array<keyof typeof byModule>) {
      for (const k of Object.keys(byModule[mod] || {})) covered.add(k)
    }
    const coveredBehaviors = COVERAGE_TARGETS.filter((k)=>covered.has(k as string))
    const uncoveredBehaviors = COVERAGE_TARGETS.filter((k)=>!covered.has(k as string))
    const coverageScore = COVERAGE_TARGETS.length ? Math.round(100 * (coveredBehaviors.length / COVERAGE_TARGETS.length)) : 0

    // False parity warnings & semantic mismatch notes surfaced from recent entries
    const recent = getRecent(100)
    const warnings: string[] = []
    for (const r of recent) {
      const notes = (r as any).details?.notes || r?.details?.notes
      if (Array.isArray(notes)) {
        for (const n of notes) {
          if (typeof n === 'string' && (n.startsWith('UNSUPPORTED') || n.startsWith('source-semantic-mismatch'))) warnings.push(n)
        }
      }
    }
    const uniqueWarnings = Array.from(new Set(warnings))
    const unsupportedCount = uniqueWarnings.filter((w)=>w.startsWith('UNSUPPORTED')).length

    // Confidence indicator: emphasize coverage; penalize unsupported categories slightly
    const confidenceInConvergence = Math.max(0, Math.min(100, Math.round(coverageScore - unsupportedCount * 3)))

    return res.status(200).json({
      enabled: true,
      latest,
      average,
      byModule,
      parity,
      coverage: {
        score: coverageScore,
        coveredBehaviors,
        uncoveredBehaviors,
        falseParityWarnings: uniqueWarnings,
        confidenceInConvergence,
      },
    })
  } catch (e) {
    return res.status(200).json({ enabled: true, latest: null, average: null, byModule: null, parity: 'ERROR' })
  }
}
