import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { VendorSettlementService } from '@/lib/services/vendor-settlement.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })
  const user = session.user as any
  if (!user.roles?.includes('ADMIN')) return res.status(403).json({ error: 'Forbidden' })

  try {
    const balances = await VendorSettlementService.getAllVendorBalances()
    res.status(200).json({ balances })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
}
