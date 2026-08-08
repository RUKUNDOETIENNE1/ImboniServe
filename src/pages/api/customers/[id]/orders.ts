import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { successResponse, unauthorizedResponse } from '@/lib/api/response-helpers'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'
import { requiresFeature } from '@/lib/middleware/withFeatureCheck'

async function baseHandler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const businessId = (session?.user as any)?.businessId

  if (!session?.user || !businessId) {
    return res.status(401).json(unauthorizedResponse())
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query

  const orders = await prisma.sale.findMany({
    where: {
      businessId,
      customerId: id as string
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  })

  return res.status(200).json(successResponse(orders))
}

// Apply commercial enforcement: Customer order history requires CRM feature
const handler = requiresFeature('hasCRM')(baseHandler)

export default withErrorHandler(handler)
