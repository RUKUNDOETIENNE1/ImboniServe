import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
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
      const subscriptions = await prisma.subscription.findMany({
        include: {
          business: {
            select: {
              id: true,
              name: true,
              city: true
            }
          },
          plan: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return res.status(200).json({ subscriptions })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Admin subscriptions error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
