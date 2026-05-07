import type { NextApiRequest, NextApiResponse } from 'next'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { prisma } from '../../../lib/prisma'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.status(405).end('Method Not Allowed')
    return
  }

  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  const isAdmin = (ctx.roles || []).includes('ADMIN')
  const { businessId, periodType, limit } = req.query as { businessId?: string; periodType?: string; limit?: string }

  if (businessId && !isAdmin && ctx.businessId && businessId !== ctx.businessId) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const effectiveBusinessId = isAdmin ? (businessId || ctx.businessId) : ctx.businessId

  const where: any = { businessId: effectiveBusinessId }
  if (periodType === 'WEEKLY' || periodType === 'MONTHLY') where.periodType = periodType

  const take = Math.min(100, Math.max(1, parseInt(limit || '20', 10)))

  const items = await prisma.businessInsightReport.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take,
  })

  res.status(200).json(items)
}

export default requirePermission('reports.view')(handler)
