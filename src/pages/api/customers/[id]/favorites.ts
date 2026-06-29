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

  const { id } = req.query

  // Get customer's most ordered items
  const favorites = await prisma.saleItem.groupBy({
    by: ['menuItemId'],
    where: {
      sale: {
        businessId,
        customerId: id as string,
        paymentStatus: 'COMPLETED'
      }
    },
    _count: { menuItemId: true },
    _sum: { quantity: true },
    orderBy: {
      _sum: { quantity: 'desc' }
    },
    take: 10
  })

  const menuItemIds = favorites.map(f => f.menuItemId)
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: menuItemIds } },
    select: { id: true, name: true, priceCents: true, category: true }
  })

  const favoritesWithDetails = favorites.map(fav => {
    const menuItem = menuItems.find(mi => mi.id === fav.menuItemId)
    return {
      ...menuItem,
      orderCount: fav._sum.quantity || 0
    }
  })

  return res.status(200).json(successResponse(favoritesWithDetails))
}

export default withErrorHandler(handler)
