import type { NextApiRequest, NextApiResponse } from 'next'
import { requireRole } from '@/lib/middleware/auth.middleware'
import { PaymentMetricsService } from '@/lib/services/payment-metrics.service'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    const [summary, sourceBreakdown, stuckPayments, recentFailures] = await Promise.all([
      PaymentMetricsService.getDailyPaymentMetrics(),
      PaymentMetricsService.getFinalizationSourceBreakdown(),
      PaymentMetricsService.getStuckPayments(),
      PaymentMetricsService.getRecentFailures(),
    ])

    return res.status(200).json({ summary, sourceBreakdown, stuckPayments, recentFailures })
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to load metrics' })
  }
}

export default requireRole(['ADMIN'], true)(handler)
