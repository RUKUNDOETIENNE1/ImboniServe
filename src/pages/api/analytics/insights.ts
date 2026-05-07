import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { AnalyticsInsightsService } from '@/lib/services/analytics-insights.service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  const businessId = (session?.user as any)?.businessId;
  if (!session?.user || !businessId) return res.status(401).json({ error: 'Unauthorized' });

  const days = req.query.days ? Math.min(Number(req.query.days), 90) : 30;

  try {
    const [menuInsights, allergenInsights, aiInsights] = await Promise.all([
      AnalyticsInsightsService.getMenuInsights(businessId, days),
      AnalyticsInsightsService.getAllergenInsights(businessId, days),
      AnalyticsInsightsService.getAIUsageInsights(businessId, days),
    ]);

    return res.status(200).json({
      menuInsights,
      allergenInsights,
      aiInsights,
      period: days,
    });
  } catch (error) {
    console.error('Analytics insights error:', error);
    return res.status(500).json({ error: 'Failed to generate insights' });
  }
}
