/**
 * Guardian API — Acknowledge case
 * POST /api/guardian/[caseId]/acknowledge → mark case as acknowledged by user
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { GuardianService } from '@/lib/guardian'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return

    const { caseId } = req.query
    if (!caseId || typeof caseId !== 'string') {
      return res.status(400).json({ error: 'caseId is required' })
    }

    const acknowledged = await GuardianService.acknowledgeCase(
      caseId,
      ctx.businessId,
      ctx.userId
    )

    if (!acknowledged) {
      return res.status(404).json({ error: 'Case not found or not in an acknowledgeable state' })
    }

    return res.status(200).json({ success: true, caseId, state: 'VERIFYING' })
  } catch (error: any) {
    console.error('[Guardian Acknowledge API] Error:', error)
    return res.status(500).json({ error: 'Failed to acknowledge case' })
  }
}

export default handler
