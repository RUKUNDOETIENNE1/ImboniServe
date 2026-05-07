import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireRole } from '@/lib/middleware/auth.middleware'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const page = parseInt((req.query.page as string) || '1', 10)
  const pageSize = parseInt((req.query.pageSize as string) || '20', 10)
  const action = (req.query.action as string) || ''
  const entityType = (req.query.entityType as string) || ''
  const entityId = (req.query.entityId as string) || ''
  const actorId = (req.query.actorId as string) || ''
  const start = (req.query.start as string) || ''
  const end = (req.query.end as string) || ''

  const where: any = {}
  if (action) where.action = action
  if (entityType) where.entityType = entityType
  if (entityId) where.entityId = entityId
  if (actorId) where.actorId = actorId

  const dateFilter: any = {}
  if (start) dateFilter.gte = new Date(start)
  if (end) dateFilter.lte = new Date(end)
  if (Object.keys(dateFilter).length) where.createdAt = dateFilter

  const [items, total] = await Promise.all([
    (prisma as any).auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    (prisma as any).auditLog.count({ where }),
  ])

  return res.status(200).json({ data: items, page, pageSize, total })
}

export default requireAuth(requireRole(['ADMIN'])(handler))
