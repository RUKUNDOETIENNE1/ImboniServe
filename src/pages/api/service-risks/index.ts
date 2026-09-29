/**
 * Service Risks API
 * Returns active service promise risks (WARNING / CRITICAL) for a business.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { PromiseEngine } from '@/lib/promise-engine'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return

    const risks = await PromiseEngine.getActiveRisks(ctx.businessId)

    return res.status(200).json({
      risks,
      total: risks.length,
      criticalCount: risks.filter((r) => r.state === 'CRITICAL').length,
      warningCount: risks.filter((r) => r.state === 'WARNING').length,
    })
  } catch (error: any) {
    console.error('[Service Risks API] Error:', error)
    return res.status(500).json({ error: 'Failed to fetch service risks' })
  }
}

export default handler
