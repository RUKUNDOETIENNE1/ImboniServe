import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth/[...nextauth]'
import { PaymentsOpsService } from '@/lib/services/payments-ops.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })
  const user = session.user as any
  if (!user.roles?.includes('ADMIN')) return res.status(403).json({ error: 'Forbidden' })

  try {
    const [revenue, payments24h, payments7d, health] = await Promise.all([
      PaymentsOpsService.getRevenueMetrics(),
      PaymentsOpsService.getPaymentMetrics(24),
      PaymentsOpsService.getPaymentMetrics(24 * 7),
      PaymentsOpsService.getProviderHealth(),
    ])
    res.status(200).json({ revenue, payments24h, payments7d, health })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
}
