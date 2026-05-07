import type { NextApiRequest, NextApiResponse } from 'next';
import { processReservationReminders } from '@/lib/services/reservation-reminder.service';

/**
 * Cron job endpoint for processing reservation reminders
 * Should be called every 5 minutes via external cron service (e.g., Vercel Cron, GitHub Actions)
 * 
 * Example cron schedule: star-slash-5 star star star star (every 5 minutes)
 * 
 * Security: Verify cron secret to prevent unauthorized access
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify cron secret for security
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  const expectedSecret = process.env.CRON_SECRET;

  if (expectedSecret && cronSecret !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await processReservationReminders();

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      result: {
        processed: result.processed,
        sent: result.sent,
        failed: result.failed
      }
    });
  } catch (error) {
    console.error('Error processing reservation reminders:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}
