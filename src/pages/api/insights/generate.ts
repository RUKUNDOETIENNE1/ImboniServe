import type { NextApiRequest, NextApiResponse } from 'next'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { getOrGenerateInsight } from '../../../lib/services/insight.service'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).end('Method Not Allowed')
    return
  }

  try {
    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return

    const isAdmin = (ctx.roles || []).includes('ADMIN')
    const { businessId, period, language, force } = req.body || {}
    const effectiveBusinessId = isAdmin ? businessId : ctx.businessId

    if (!effectiveBusinessId || (period !== 'WEEKLY' && period !== 'MONTHLY')) {
      res.status(400).json({ error: 'Invalid input' })
      return
    }
    if (!isAdmin && businessId && businessId !== effectiveBusinessId) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const insight = await getOrGenerateInsight({
      businessId: effectiveBusinessId,
      period,
      language: language || 'en',
      trigger: 'MANUAL',
      force: !!force,
      quota: 4,
    })

    res.status(200).json(insight)
  } catch (e: any) {
    const msg = String(e?.message || e)
    if (msg.includes('Manual quota exceeded')) {
      res.status(429).json({ error: msg })
      return
    }
    res.status(500).json({ error: msg })
  }
}

export default requirePermission('reports.view')(handler)
