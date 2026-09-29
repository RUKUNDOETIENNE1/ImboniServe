import type { NextApiRequest, NextApiResponse } from 'next'
import { PaymentWatchdogService } from '@/lib/services/watchdog/payment-watchdog.service'
import { logger } from '@/lib/logger'

const log = logger.child({ service: 'cron-watchdog-payment' })

/**
 * Payment Watchdog Cron Job
 * Monitors payment provider failures, webhook validation, and processing errors
 * 
 * Runs: Every 5 minutes
 * Vercel Cron: every 5 minutes
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.authorization

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    log.warn('Unauthorized cron attempt on payment watchdog')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    log.info('Running Payment Watchdog')
    const result = await PaymentWatchdogService.run()
    log.info('Payment Watchdog complete', result)

    return res.status(200).json({
      success: true,
      watchdog: 'PAYMENT',
      result,
    })
  } catch (error: any) {
    log.error('Payment Watchdog failed', { error: error?.message || String(error) })
    return res.status(500).json({
      success: false,
      error: error?.message || 'Payment Watchdog execution failed',
    })
  }
}
