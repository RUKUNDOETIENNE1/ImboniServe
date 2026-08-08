import type { NextApiRequest, NextApiResponse } from 'next'
import { SubscriptionWatchdogService } from '@/lib/services/watchdog/subscription-watchdog.service'
import { logger } from '@/lib/logger'

const log = logger.child({ service: 'cron-watchdog-subscription' })

/**
 * Subscription Watchdog Cron Job
 * Monitors subscription health, grace period aging, and churn risks
 * 
 * Runs: Daily at 8:00 AM
 * Vercel Cron: 0 8 * * *
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.authorization

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    log.warn('Unauthorized cron attempt on subscription watchdog')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    log.info('Running Subscription Watchdog')
    const result = await SubscriptionWatchdogService.run()
    log.info('Subscription Watchdog complete', result)

    return res.status(200).json({
      success: true,
      watchdog: 'SUBSCRIPTION',
      result,
    })
  } catch (error: any) {
    log.error('Subscription Watchdog failed', { error: error?.message || String(error) })
    return res.status(500).json({
      success: false,
      error: error?.message || 'Subscription Watchdog execution failed',
    })
  }
}
