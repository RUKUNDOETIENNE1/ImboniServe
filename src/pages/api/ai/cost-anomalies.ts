import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { CostAnomalyService } from '@/lib/services/cost-anomaly.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const user = session.user as any
  const sessionBusinessId: string | null | undefined = user.businessId

  try {
    if (req.method === 'GET') {
      const { businessId, status, limit } = req.query

      const resolvedBusinessId = (businessId ? String(businessId) : sessionBusinessId)
      if (!resolvedBusinessId) return res.status(400).json({ error: 'businessId required' })
      if (businessId && sessionBusinessId && resolvedBusinessId !== sessionBusinessId) {
        return res.status(403).json({ error: 'Forbidden' })
      }

      try {
        const alerts = await CostAnomalyService.listAlerts(
          resolvedBusinessId,
          status ? String(status) : undefined,
          limit ? Number(limit) : undefined
        )
        return res.status(200).json(alerts)
      } catch (dbError) {
        console.error('AI cost anomalies DB error:', dbError)
        return res.status(200).json([])
      }
    }

    if (req.method === 'PATCH') {
      const { id, businessId, status, notes } = req.body || {}

      const resolvedBusinessId = businessId ? String(businessId) : sessionBusinessId
      if (!id || !resolvedBusinessId || !status) {
        return res.status(400).json({ error: 'id, businessId and status are required' })
      }
      if (businessId && sessionBusinessId && resolvedBusinessId !== sessionBusinessId) {
        return res.status(403).json({ error: 'Forbidden' })
      }

      const result = await CostAnomalyService.updateAlertStatus(id, resolvedBusinessId, status, notes)
      return res.status(200).json(result)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('AI cost anomalies API error:', error)
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' })
  }
}
