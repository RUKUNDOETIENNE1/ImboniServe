import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
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

    const userRole = session.user?.role || (session.user?.roles?.[0]);
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const csv = await RevenueExportService.exportMarketersCSV();

    logger.info('Marketers CSV exported by admin', { adminId: session.user?.id });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="marketers-${new Date().toISOString().split('T')[0]}.csv"`);
    
    return res.status(200).send(csv);
  } catch (error: any) {
    logger.error('Failed to export marketers CSV', { error });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
