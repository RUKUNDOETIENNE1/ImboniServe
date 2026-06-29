import type { NextApiRequest, NextApiResponse } from 'next'
import { ExecutiveSummaryService } from '@/lib/services/intelligence/executive-summary.service'
import { logger } from '@/lib/logger'

const log = logger.child({ service: 'cron-summary-daily' })

/**
 * Daily Executive Summary Cron Job
 * Generates daily executive summary and sends to stakeholders
 * 
 * Runs: Daily at 7:00 AM
 * Vercel Cron: 0 7 * * *
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.authorization

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    log.warn('Unauthorized cron attempt on daily summary')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    log.info('Generating Daily Executive Summary')
    const summary = await ExecutiveSummaryService.generateDailySummary()
    log.info('Daily Executive Summary complete', summary)

    // TODO: Send summary via email/Slack
    // await AlertDeliveryService.sendExecutiveSummary(summary)

    return res.status(200).json({
      success: true,
      summary,
    })
  } catch (error: any) {
    log.error('Daily Executive Summary failed', { error: error?.message || String(error) })
    return res.status(500).json({
      success: false,
      error: error?.message || 'Daily Executive Summary generation failed',
    })
  }
}
