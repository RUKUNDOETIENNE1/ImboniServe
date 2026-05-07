import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { LoyaltyService } from '@/lib/services/loyalty.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const session = await getServerSession(req, res, authOptions)
  const businessId = (session?.user as any)?.businessId
  if (!session?.user || !businessId) return res.status(401).json({ error: 'Unauthorized' })

  const { customerId } = req.query
  if (!customerId || typeof customerId !== 'string') return res.status(400).json({ error: 'customerId required' })

  const balance = await LoyaltyService.getBalance(customerId, businessId)
  const history = await LoyaltyService.getHistory(customerId, businessId)
  return res.status(200).json({ balance, history })
}
