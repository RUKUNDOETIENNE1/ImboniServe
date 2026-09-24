import type { NextApiRequest, NextApiResponse } from 'next'
import { ReconciliationWatchdogService } from '@/lib/services/watchdog/reconciliation-watchdog.service'
import { logger } from '@/lib/logger'

const log = logger.child({ service: 'cron-watchdog-reconciliation' })

/**
 * Reconciliation Watchdog Cron Job
 * Monitors financial ledger reconciliation health and accuracy
 * 
 * Runs: Every hour
 * Vercel Cron: 0 * * * *
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.authorization

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    log.warn('Unauthorized cron attempt on reconciliation watchdog')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    log.info('Running Reconciliation Watchdog')
    const result = await ReconciliationWatchdogService.run()
    log.info('Reconciliation Watchdog complete', result)

    return res.status(200).json({
      success: true,
      watchdog: 'RECONCILIATION',
      result,
    })
  } catch (error: any) {
    log.error('Reconciliation Watchdog failed', { error: error?.message || String(error) })
    return res.status(500).json({
      success: false,
      error: error?.message || 'Reconciliation Watchdog execution failed',
    })
  }
}
