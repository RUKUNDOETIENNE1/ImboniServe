import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'monthly-usage-reset' });

/**
 * Monthly cron job to reset usage counters
 * Should run on 1st of each month at 00:00 UTC
 * 
 * Vercel Cron: 0 0 1 * *
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    log.warn('Unauthorized cron attempt');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    log.info('Starting monthly usage reset');

    // Reset CMS post counter for all businesses
    const cmsResult = await prisma.business.updateMany({
      data: {
        cmsPostsThisMonth: 0
      }
    });

    log.info('CMS post counters reset', { count: cmsResult.count });

    // AI credits are already handled by reset date logic in ai-credit.service.ts
    // But we can log businesses approaching their AI reset date
    const aiResetDue = await prisma.business.count({
      where: {
        aiResetDate: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
        }
      }
    });

    log.info('AI credits reset check', { businessesResetDue: aiResetDue });

    return res.status(200).json({
      success: true,
      message: 'Monthly usage reset completed',
      stats: {
        cmsPostsReset: cmsResult.count,
        aiCreditsResetDue: aiResetDue,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    log.error('Monthly usage reset failed', { error: error.message });
    return res.status(500).json({ 
      error: 'Reset failed',
      message: error.message 
    });
  }
}
