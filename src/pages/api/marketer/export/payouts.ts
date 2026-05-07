import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { ProfessionalMarketerService } from '@/lib/services/professional-marketer.service';
import { RevenueExportService } from '@/lib/services/revenue-export.service';
import { logger } from '@/lib/logger';

type AppSession = Session & { user?: Session['user'] & { roles?: string[]; role?: string; businessId?: string | null; id?: string } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions) as AppSession;
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const marketer = await ProfessionalMarketerService.getMarketerByEmail(session.user?.email || '');
    if (!marketer) {
      return res.status(404).json({ error: 'Marketer not found' });
    }

    if (marketer.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Marketer account is not active' });
    }

    const { startDate, endDate, status } = req.query;

    const csv = await RevenueExportService.exportPayoutsCSV({
      marketerId: marketer.id,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      status: status as string | undefined
    });

    logger.info('Payouts CSV exported', { marketerId: marketer.id });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="payouts-${marketer.referralCode}-${new Date().toISOString().split('T')[0]}.csv"`);
    
    return res.status(200).send(csv);
  } catch (error: any) {
    logger.error('Failed to export payouts CSV', { error });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
