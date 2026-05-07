import type { NextApiRequest, NextApiResponse } from 'next'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { withRateLimit } from '@/lib/middleware/withRateLimit'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  const { type, data, offlineId } = req.body || {}

  return res.status(200).json({
    success: true,
    type,
    offlineId,
    received: !!data,
    businessId: ctx.businessId,
  })
}

export default withRateLimit(requirePermission('orders.create')(handler), { windowMs: 60 * 1000, maxRequests: 30 })
