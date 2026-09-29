import type { NextApiRequest, NextApiResponse } from 'next'
import { GuardianService } from '@/lib/guardian'
import { acquireCronLock } from '@/lib/scheduler/cron-lock'
import { publishHeartPulseEvent, HeartPulseEventType, HeartPulseChannel } from '@/lib/heart-pulse'
import { logger } from '@/lib/logger'

const log = logger.child({ service: 'cron-guardian' })

/**
 * Guardian Cron Job
 * Evaluates active Promise Engine signals and verifies active Guardian cases.
 *
 * Primary scheduler: Railway worker in-process (every 2 minutes)
 * Fallback scheduler: Vercel daily cron (0 1 * * *)
 *
 * Authentication: CRON_SECRET Bearer token (fail-closed)
 * Concurrency: Redis lock (120s TTL) prevents duplicate execution
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

  const source = process.env.VERCEL === '1' ? 'vercel-cron' : 'railway'
  const lock = await acquireCronLock('guardian-evaluation', 120)
  if (!lock) {
    log.info('Guardian cron skipped (lock held)')
    return res.status(200).json({ success: true, skipped: true, reason: 'lock_held' })
  }

  const startTime = Date.now()
  try {
    log.info('Running Guardian evaluation tick', { source })
    const signalsProcessed = await GuardianService.evaluateActiveSignals()
    const casesVerified = await GuardianService.verifyActiveCases()
    const durationMs = Date.now() - startTime

    log.info('Guardian evaluation complete', {
      signalsProcessed,
      casesVerified,
      durationMs,
      source,
    })

    // Observability: Heart Pulse event
    await publishHeartPulseEvent(
      HeartPulseChannel.system(),
      HeartPulseEventType.SCHEDULER_TICK,
      'system',
      {
        scheduler: 'guardian-evaluation',
        source,
        signalsProcessed,
        casesVerified,
        durationMs,
      }
    ).catch((e: any) => {
      log.warn('Heart Pulse publish failed (non-fatal)', { error: e.message })
    })

    return res.status(200).json({
      success: true,
      signalsProcessed,
      casesVerified,
      durationMs,
      source,
    })
  } catch (error: any) {
    const durationMs = Date.now() - startTime
    log.error('Guardian cron failed', { error: error?.message || String(error), durationMs })

    await publishHeartPulseEvent(
      HeartPulseChannel.system(),
      HeartPulseEventType.SCHEDULER_ERROR,
      'system',
      {
        scheduler: 'guardian-evaluation',
        source,
        error: error?.message || String(error),
        durationMs,
      }
    ).catch(() => {})

    return res.status(500).json({
      success: false,
      error: error?.message || 'Guardian cron execution failed',
    })
  } finally {
    await lock.release()
  }
}
