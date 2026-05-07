import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { SmartDiningSlipService } from '@/lib/services/smart-dining-slip.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const user = session.user as any
  const businessId = user.businessId

  if (!businessId) {
    return res.status(400).json({ error: 'No business associated with user' })
  }

  try {
    if (req.method === 'GET') {
      const { limit = '50', offset = '0' } = req.query

      const result = await SmartDiningSlipService.getRestaurantSlips(
        businessId,
        parseInt(limit as string),
        parseInt(offset as string)
      )

      return res.status(200).json(result)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Smart Dining Slips API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
