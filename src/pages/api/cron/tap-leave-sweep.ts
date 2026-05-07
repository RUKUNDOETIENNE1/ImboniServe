import type { NextApiRequest, NextApiResponse } from 'next'
import { TapLeaveFinalizationService } from '@/lib/services/tap-leave-finalization.service'
import { logger } from '@/lib/logger'

const log = logger.child({ service: 'cron-tap-leave-sweep' })

// Tap & Leave finalization sweeper.
// Recovers PAID InTouch transactions that missed finalization.
// Vercel Cron schedule: "0 * * * *" (hourly). On Pro plan use "*/5 * * * *" (every 5 min).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.authorization

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    log.warn('Unauthorized cron attempt on tap-leave-sweep')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    log.info('Running Tap & Leave finalization sweeper')
    const result = await TapLeaveFinalizationService.runSweeper()
    log.info('Tap & Leave sweep complete', result)
    return res.status(200).json({ ok: true, ...result })
  } catch (error: any) {
    log.error('Tap & Leave sweep cron failed', { error: String(error) })
    return res.status(500).json({ error: 'Sweep failed', message: error.message })
  }
}
