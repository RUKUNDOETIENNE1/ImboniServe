import type { NextApiRequest, NextApiResponse } from 'next'
import { RevenueWatchdogService } from '@/lib/services/watchdog/revenue-watchdog.service'
import { logger } from '@/lib/logger'

const log = logger.child({ service: 'cron-watchdog-revenue' })

/**
 * Revenue Watchdog Cron Job
 * Monitors revenue trends and anomalies using FinancialLedgerEntry
 * 
 * Runs: Daily at 9:00 AM
 * Vercel Cron: 0 9 * * *
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.authorization

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    log.warn('Unauthorized cron attempt on revenue watchdog')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    log.info('Running Revenue Watchdog')
    const result = await RevenueWatchdogService.run()
    log.info('Revenue Watchdog complete', result)

    return res.status(200).json({
      success: true,
      watchdog: 'REVENUE',
      result,
    })
  } catch (error: any) {
    log.error('Revenue Watchdog failed', { error: error?.message || String(error) })
    return res.status(500).json({
      success: false,
      error: error?.message || 'Revenue Watchdog execution failed',
    })
  }
}
