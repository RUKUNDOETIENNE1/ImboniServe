import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireRole } from '@/lib/middleware/auth.middleware'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const page = parseInt((req.query.page as string) || '1', 10)
  const pageSize = parseInt((req.query.pageSize as string) || '20', 10)
  const blockedParam = (req.query.blocked as string) || ''
  const minRiskScore = parseInt((req.query.minRiskScore as string) || '0', 10)
  const start = (req.query.start as string) || ''
  const end = (req.query.end as string) || ''

  const where: any = {}
  if (blockedParam === 'true') where.blocked = true
  else if (blockedParam === 'false') where.blocked = false

  if (minRiskScore > 0) where.riskScore = { gte: minRiskScore }

  const dateFilter: any = {}
  if (start) dateFilter.gte = new Date(start)
  if (end) dateFilter.lte = new Date(end)
  if (Object.keys(dateFilter).length) where.createdAt = dateFilter

  const [items, total] = await Promise.all([
    prisma.trialEligibility.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        riskScore: true,
        blocked: true,
        blockReason: true,
        ipRange: true,
        deviceFingerprint: true,
        trialUsedAt: true,
        createdAt: true,
      },
    }),
    prisma.trialEligibility.count({ where }),
  ])

  return res.status(200).json({ data: items, page, pageSize, total })
}

export default requireAuth(requireRole(['ADMIN'])(handler))
