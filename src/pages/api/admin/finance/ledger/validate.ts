import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth/[...nextauth]'
import { LedgerIntegrityService } from '@/lib/services/ledger-integrity.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })
  const user = session.user as any
  if (!user.roles?.includes('ADMIN')) return res.status(403).json({ error: 'Forbidden' })

  try {
    const hours = req.method === 'POST' && req.body?.hours ? Number(req.body.hours) : 48
    const tx = await LedgerIntegrityService.validateRecentTransactions(hours)
    const subs = await LedgerIntegrityService.validateSubscriptionLifecycle(168)
    res.status(200).json({ ok: true, tx, subs })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
}
