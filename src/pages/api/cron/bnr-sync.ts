import type { NextApiRequest, NextApiResponse } from 'next';
import { ingestBnrExchangeRates } from '@/lib/services/bnr-rate-ingestion.service';
import { acquireCronLock } from '@/lib/scheduler/cron-lock';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'cron-bnr-sync' });

/**
 * BNR FX Synchronization Cron
 *
 * Pulls today's exchange rates from the BNR API and persists them into the
 * canonical CurrencyExchangeRate table (idempotent, supersession-aware).
 *
 * Scheduler: Vercel daily cron (see vercel.json). Ingestion itself is
 * idempotent, so safe retry across multiple scheduler mechanisms is handled
 * by the Redis/in-memory cron lock.
 *
 * Authentication: CRON_SECRET Bearer token (fail-closed)
 * Feature gate:  BNR_SYNC_ENABLED=true
 * Concurrency:   cron lock (180s TTL) prevents duplicate execution
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    log.warn('Unauthorized cron attempt on BNR sync');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const enabled = String(process.env.BNR_SYNC_ENABLED || 'false').toLowerCase() === 'true';
  if (!enabled) {
    return res.status(200).json({ success: true, skipped: true, reason: 'BNR_SYNC_ENABLED=false' });
  }

  const source = process.env.VERCEL === '1' ? 'vercel-cron' : 'manual';
  const lock = await acquireCronLock('bnr-rate-sync', 180);
  if (!lock) {
    log.info('BNR sync skipped (lock held)');
    return res.status(200).json({ success: true, skipped: true, reason: 'lock_held' });
  }

  const startTime = Date.now();
  try {
    const today = new Date().toISOString().slice(0, 10);
    const summary = await ingestBnrExchangeRates({
      start_date: today,
      end_date: today,
    });
    const durationMs = Date.now() - startTime;

    log.info('BNR sync complete', {
      ...summary,
      durationMs,
      source,
    });

    return res.status(200).json({ success: true, summary, durationMs, source });
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    log.error('BNR sync failed', { error: error?.message || String(error), durationMs, source });
    return res.status(500).json({
      success: false,
      error: error?.message || 'BNR sync failed',
    });
  } finally {
    await lock.release();
  }
}
