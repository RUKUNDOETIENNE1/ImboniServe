import type { NextApiRequest, NextApiResponse } from 'next';
import { getBusinessPayoutSummary } from '@/lib/services/business-payout.service';
import { requirePermission } from '@/lib/middleware/permission.middleware';
import { resolveBusinessContext } from '@/lib/api/business-context';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
  }

  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  const { businessId } = ctx

  try {
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date required' });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    const payoutSummary = await getBusinessPayoutSummary(businessId, start, end);

    return res.status(200).json(payoutSummary);
  } catch (error: any) {
    console.error('Error fetching payout summary:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default requirePermission('reports.view')(handler)
