import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { AnalyticsService } from '@/lib/services/analytics.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
    
    const session = await getServerSession(req, res, authOptions)
    const businessId = (session?.user as any)?.businessId
    
    if (!session?.user || !businessId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const days = req.query.days ? Math.min(Number(req.query.days), 90) : 30
    
    const [stats, peakHours, customers] = await Promise.all([
      AnalyticsService.getDashboardStats(businessId, days),
      AnalyticsService.getPeakHours(businessId, days),
      AnalyticsService.getCustomerMetrics(businessId, days),
    ])

    return res.status(200).json({ stats, peakHours, customers })
  } catch (error) {
    console.error('Analytics dashboard error:', error)
    return res.status(500).json({ 
      error: 'Failed to fetch analytics',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
