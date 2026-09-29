import type { NextApiRequest, NextApiResponse } from 'next'
import { PromiseEngine } from '@/lib/promise-engine'
import { acquireCronLock } from '@/lib/scheduler/cron-lock'
import { publishHeartPulseEvent, HeartPulseEventType, HeartPulseChannel } from '@/lib/heart-pulse'
import { logger } from '@/lib/logger'

const log = logger.child({ service: 'cron-promise-evaluation' })

/**
 * Promise Engine Cron Job
 *
 * Evaluates all active service promises (ON_TRACK, WARNING, CRITICAL)
 * and transitions states based on elapsed time vs thresholds.
 *
 * Primary scheduler: Railway worker in-process (every 2 minutes)
 * Fallback scheduler: Vercel daily cron (0 0 * * *)
 *
 * Authentication: CRON_SECRET Bearer token (fail-closed)
 * Concurrency: Redis lock (60s TTL) prevents duplicate execution
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.authorization

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    log.warn('Unauthorized cron attempt on Promise Engine evaluation')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const source = process.env.VERCEL === '1' ? 'vercel-cron' : 'railway'
  const lock = await acquireCronLock('promise-evaluation', 60)
  if (!lock) {
    log.info('Promise Engine cron skipped (lock held)')
    return res.status(200).json({ success: true, skipped: true, reason: 'lock_held' })
  }

  const startTime = Date.now()
  try {
    log.info('Running Promise Engine evaluation tick', { source })
    const result = await PromiseEngine.evaluateActivePromises()
    const durationMs = Date.now() - startTime

    log.info('Promise Engine evaluation complete', {
      ...result,
      durationMs,
      source,
    })

    // Observability: Heart Pulse event
    await publishHeartPulseEvent(
      HeartPulseChannel.system(),
      HeartPulseEventType.SCHEDULER_TICK,
      'system',
      {
        scheduler: 'promise-evaluation',
        source,
        evaluated: result.evaluated,
        transitions: result.transitions,
        durationMs,
      }
    ).catch((e: any) => {
      log.warn('Heart Pulse publish failed (non-fatal)', { error: e.message })
    })

    return res.status(200).json({
      success: true,
      ...result,
      durationMs,
      source,
    })
  } catch (error: any) {
    const durationMs = Date.now() - startTime
    log.error('Promise Engine cron failed', { error: error?.message || String(error), durationMs })

    await publishHeartPulseEvent(
      HeartPulseChannel.system(),
      HeartPulseEventType.SCHEDULER_ERROR,
      'system',
      {
        scheduler: 'promise-evaluation',
        source,
        error: error?.message || String(error),
        durationMs,
      }
    ).catch(() => {})

    return res.status(500).json({
      success: false,
      error: error?.message || 'Promise Engine cron execution failed',
    })
  } finally {
    await lock.release()
  }
}
