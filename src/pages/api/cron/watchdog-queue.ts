import type { NextApiRequest, NextApiResponse } from 'next'
import { QueueWatchdogService } from '@/lib/services/watchdog/queue-watchdog.service'
import { logger } from '@/lib/logger'

const log = logger.child({ service: 'cron-watchdog-queue' })

/**
 * Queue Watchdog Cron Job
 * Monitors queue backlog, DLQ events, and worker health
 * 
 * Runs: Every 10 minutes
 * Vercel Cron: every 10 minutes
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.authorization

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    log.warn('Unauthorized cron attempt on queue watchdog')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    log.info('Running Queue Watchdog')
    const result = await QueueWatchdogService.run()
    log.info('Queue Watchdog complete', result)

    return res.status(200).json({
      success: true,
      watchdog: 'QUEUE',
      result,
    })
  } catch (error: any) {
    log.error('Queue Watchdog failed', { error: error?.message || String(error) })
    return res.status(500).json({
      success: false,
      error: error?.message || 'Queue Watchdog execution failed',
    })
  }
}
