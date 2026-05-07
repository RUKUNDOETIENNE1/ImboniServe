import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { successResponse, unauthorizedResponse } from '@/lib/api/response-helpers'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const businessId = (session?.user as any)?.businessId

  if (!session?.user || !businessId) {
    return res.status(401).json(unauthorizedResponse())
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { status, source } = req.query

  const where: any = {
    businessId,
    createdAt: {
      gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    }
  }

  if (status && status !== 'ALL') {
    where.status = status
  }

  if (source && source !== 'ALL') {
    where.orderSource = source
  }

  const orders = await prisma.sale.findMany({
    where,
    include: {
      items: {
        include: {
          menuItem: {
            select: { name: true }
          }
        }
      },
      table: {
        select: { number: true }
      },
      user: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 100
  })

  return res.status(200).json(successResponse(orders))
}

export default withErrorHandler(handler)
