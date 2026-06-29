import type { NextApiRequest, NextApiResponse } from 'next'
import { CustomerWatchdogService } from '@/lib/services/watchdog/customer-watchdog.service'
import { logger } from '@/lib/logger'

const log = logger.child({ service: 'cron-watchdog-customer' })

/**
 * Customer Watchdog Cron Job
 * Monitors customer health, dormancy, and churn risks
 * 
 * Runs: Weekly (Monday 9:00 AM)
 * Vercel Cron: 0 9 * * 1
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.authorization

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    log.warn('Unauthorized cron attempt on customer watchdog')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    log.info('Running Customer Watchdog')
    const result = await CustomerWatchdogService.run()
    log.info('Customer Watchdog complete', result)

    return res.status(200).json({
      success: true,
      watchdog: 'CUSTOMER',
      result,
    })
  } catch (error: any) {
    log.error('Customer Watchdog failed', { error: error?.message || String(error) })
    return res.status(500).json({
      success: false,
      error: error?.message || 'Customer Watchdog execution failed',
    })
  }
}
