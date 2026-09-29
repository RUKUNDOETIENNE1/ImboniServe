import type { NextApiRequest, NextApiResponse } from 'next'
import { buildTruthAuditSnapshot } from '@/lib/die/audit/truth-audit-engine'
import { resolveBusinessContext } from '@/lib/api/business-context'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    if (process.env.DIE_INTELLIGENCE_TRUTH_AUDIT_ENABLED !== 'true') {
      return res.status(200).json({
        contradictionReport: { contradictionScore: 0, contradictionTypes: [], notes: [] },
        biasReport: { biasScore: 0, biasPatterns: [] },
        overconfidenceReport: { overconfidenceRisk: 0, notes: [] },
        truthStabilityIndex: { truthStabilityScore: 0, systemTruthGrade: 'F' },
        recommendations: [],
      })
    }

    const snapshot = await buildTruthAuditSnapshot()
    return res.status(200).json(snapshot)
  } catch (e: any) {
    console.debug('[DIE][Truth Audit API] error (ignored):', e?.message)
    return res.status(200).json({ error: 'disabled or unavailable' })
  }
}
