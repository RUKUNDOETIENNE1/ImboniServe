/**
 * API: Get Payment History
 * Returns all payment transactions for the authenticated user's business
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const userId = (session.user as any).id

    // Get user's business
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { ownedBusinesses: true },
    })

    if (!user || user.ownedBusinesses.length === 0) {
      return res.status(404).json({ error: 'No business found' })
    }

    const businessId = user.ownedBusinesses[0].id

    // Get payment transactions
    const payments = await prisma.paymentTransaction.findMany({
      where: {
        businessId,
        subscriptionId: { not: null }, // Only subscription payments
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return res.status(200).json({ payments })
  } catch (error: any) {
    console.error('[Billing API] Error fetching payments:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
