import type { NextApiRequest, NextApiResponse } from 'next'
import { TapLeaveFinalizationService } from '@/lib/services/tap-leave-finalization.service'
import { logger } from '@/lib/logger'

const log = logger.child({ service: 'cron-tap-leave-reconcile' })

// Tap & Leave payment reconciler.
// Polls pending InTouch transactions and marks them PAID/FAILED.
// Vercel Cron schedule: "*/10 * * * *" (every 10 min on Pro) or "0 * * * *" (hourly on Hobby).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.authorization

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    log.warn('Unauthorized cron attempt on tap-leave-reconcile')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    log.info('Running Tap & Leave payment reconciler')
    const result = await TapLeaveFinalizationService.reconcilePendingPayments()
    log.info('Tap & Leave reconcile complete', result)
    return res.status(200).json({ ok: true, ...result })
  } catch (error: any) {
    log.error('Tap & Leave reconcile cron failed', { error: String(error) })
    return res.status(500).json({ error: 'Reconcile failed', message: error.message })
  }
}
