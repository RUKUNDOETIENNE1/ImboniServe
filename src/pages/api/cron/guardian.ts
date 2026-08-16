import type { NextApiRequest, NextApiResponse } from 'next'
import { GuardianService } from '@/lib/guardian'
import { logger } from '@/lib/logger'

const log = logger.child({ service: 'cron-guardian' })

/**
 * Guardian Cron Job
 * Evaluates active Promise Engine signals and verifies active Guardian cases.
 *
 * Runs: Every 2 minutes
 * Vercel Cron: every 2 minutes
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.authorization

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    log.warn('Unauthorized cron attempt on Guardian evaluation')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    log.info('Running Guardian evaluation tick')
    const signalsProcessed = await GuardianService.evaluateActiveSignals()
    const casesVerified = await GuardianService.verifyActiveCases()
    log.info('Guardian evaluation complete', { signalsProcessed, casesVerified })

    return res.status(200).json({
      success: true,
      signalsProcessed,
      casesVerified,
    })
  } catch (error: any) {
    log.error('Guardian cron failed', { error: error?.message || String(error) })
    return res.status(500).json({
      success: false,
      error: error?.message || 'Guardian cron execution failed',
    })
  }
}
