import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const user = session.user as any
  if (!user.roles?.includes('ADMIN')) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  try {
    if (req.method === 'GET') {
      const orders = await prisma.marketplaceOrder.findMany({
        include: {
          business: {
            select: {
              id: true,
              name: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  unit: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      })

      return res.status(200).json({ orders })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Admin marketplace orders error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
