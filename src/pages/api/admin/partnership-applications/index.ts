import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { FounderPartnerApplicationService } from '@/lib/services/founder-partner-application.service'
import { withRateLimit } from '@/lib/middleware/withRateLimit'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user?.roles?.some((r: string) => ['ADMIN', 'PARTNERSHIP_MANAGER', 'SALES', 'SUPPORT', 'LEGAL', 'EXECUTIVE'].includes(r))) {
    return res.status(403).json({ error: 'Insufficient permissions' })
  }

  if (req.method === 'GET') {
    try {
      const {
        status,
        partnerType,
        search,
        reviewer,
        limit = '50',
        offset = '0',
      } = req.query

      const where: Record<string, unknown> = {}
      if (status && status !== 'ALL') {
        where.status = status
      }
      if (reviewer && reviewer !== 'ALL') {
        where.reviewedBy = reviewer
      }
      if (search) {
        where.OR = [
          { partnership: { name: { contains: search as string, mode: 'insensitive' } } },
          { partnership: { email: { contains: search as string, mode: 'insensitive' } } },
          { partnership: { organization: { contains: search as string, mode: 'insensitive' } } },
          { partnership: { phone: { contains: search as string } } },
        ]
      }
      if (partnerType && partnerType !== 'ALL') {
        where.partnership = { partnerType: partnerType as string }
      }

      const [applications, total] = await Promise.all([
        prisma.partnershipApplication.findMany({
          where: where as any,
          include: {
            partnership: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                organization: true,
                region: true,
                partnerType: true,
                status: true,
                notes: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: parseInt(limit as string),
          skip: parseInt(offset as string),
        }),
        prisma.partnershipApplication.count({ where: where as any }),
      ])

      return res.status(200).json({ applications, total })
    } catch (error: any) {
      console.error('List applications error:', error)
      return res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }

  if (req.method === 'POST') {
    try {
      const canCreate = user.roles?.some((r: string) => ['ADMIN', 'PARTNERSHIP_MANAGER', 'SALES'].includes(r))
      if (!canCreate) {
        return res.status(403).json({ error: 'Only admins and partnership managers can submit applications' })
      }

      const { name, email, phone, organization, region, motivation, experience, networkSize, references } = req.body
      const result = await FounderPartnerApplicationService.submit({
        name,
        email,
        phone,
        organization,
        region,
        motivation,
        experience,
        networkSize,
        references,
        userId: user.id,
      })

      return res.status(201).json({ application: result.application, partnership: result.partnership })
    } catch (error: any) {
      console.error('Submit application error:', error)
      return res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default withRateLimit(handler, { windowMs: 60000, maxRequests: 100 })
