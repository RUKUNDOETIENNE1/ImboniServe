import type { NextApiRequest, NextApiResponse } from 'next'
import { ReconciliationService } from '@/lib/services/reconciliation.service'
import { logger } from '@/lib/logger'

const log = logger.child({ service: 'cron-reconciliation' })

/**
 * Nightly payment reconciliation cron job.
 * Checks PaymentTransaction vs Sale status for the last 24 h and fixes mismatches.
 *
 * Vercel Cron: 0 0 * * *  (00:00 UTC = 02:00 CAT)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.authorization

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    log.warn('Unauthorized cron attempt on reconciliation')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    log.info('Running nightly reconciliation')
    const result = await ReconciliationService.runNightlyReconciliation()
    log.info('Reconciliation complete', result)
    return res.status(200).json({ ok: true, ...result })
  } catch (error: any) {
    log.error('Reconciliation cron failed', { error: String(error) })
    return res.status(500).json({ error: 'Reconciliation failed', message: error.message })
  }
}
