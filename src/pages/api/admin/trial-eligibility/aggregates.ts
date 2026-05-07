import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireRole } from '@/lib/middleware/auth.middleware'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const start = (req.query.start as string) || ''
  const end = (req.query.end as string) || ''
  const topN = parseInt((req.query.topN as string) || '10', 10)
  const blockedParam = (req.query.blocked as string) || ''

  const where: any = {}
  const dateFilter: any = {}
  if (start) dateFilter.gte = new Date(start)
  if (end) dateFilter.lte = new Date(end)
  if (Object.keys(dateFilter).length) where.createdAt = dateFilter

  if (blockedParam === 'true') where.blocked = true
  else if (blockedParam === 'false') where.blocked = false

  const [totalTrials, blockedTrials, topIpRangesRaw, topDeviceFingerprintsRaw] = await Promise.all([
    prisma.trialEligibility.count({ where }),
    prisma.trialEligibility.count({ where: { ...where, blocked: true } }),
    prisma.trialEligibility.groupBy({
      by: ['ipRange'],
      where,
      _count: { _all: true },
    }),
    prisma.trialEligibility.groupBy({
      by: ['deviceFingerprint'],
      where: { ...where, deviceFingerprint: { not: null } },
      _count: { _all: true },
    }),
  ])

  const topIpRanges = topIpRangesRaw
    .sort((a: any, b: any) => (b as any)._count._all - (a as any)._count._all)
    .slice(0, topN)
  const topDeviceFingerprints = topDeviceFingerprintsRaw
    .sort((a: any, b: any) => (b as any)._count._all - (a as any)._count._all)
    .slice(0, topN)

  return res.status(200).json({
    totalTrials,
    blockedTrials,
    topIpRanges: topIpRanges.map((r) => ({ ipRange: r.ipRange, count: (r as any)._count._all })),
    topDeviceFingerprints: topDeviceFingerprints.map((r) => ({ deviceFingerprint: r.deviceFingerprint, count: (r as any)._count._all })),
  })
}

export default requireAuth(requireRole(['ADMIN'])(handler))
