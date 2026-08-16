/**
 * Guardian API — Case detail
 * GET /api/guardian/[caseId] → full case with interventions and learning signal
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { GuardianService } from '@/lib/guardian'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return

    const { caseId } = req.query
    if (!caseId || typeof caseId !== 'string') {
      return res.status(400).json({ error: 'caseId is required' })
    }

    const caseRecord = await GuardianService.getCaseById(caseId, ctx.businessId)
    if (!caseRecord) {
      return res.status(404).json({ error: 'Case not found' })
    }

    return res.status(200).json({ case: caseRecord })
  } catch (error: any) {
    console.error('[Guardian Case API] Error:', error)
    return res.status(500).json({ error: 'Failed to fetch Guardian case' })
  }
}

export default handler
