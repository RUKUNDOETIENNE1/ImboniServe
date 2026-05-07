import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { MarketerCommissionService } from '@/lib/services/marketer-commission.service';
import { ProfessionalMarketerService } from '@/lib/services/professional-marketer.service';
import { logger } from '@/lib/logger';

type AppSession = Session & { user?: Session['user'] & { roles?: string[]; role?: string; businessId?: string | null; id?: string } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if user is authenticated
    const session = await getServerSession(req, res, authOptions) as AppSession;
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find marketer by email
    const marketer = await ProfessionalMarketerService.getMarketerByEmail(session.user?.email || '');
    if (!marketer) {
      return res.status(404).json({ error: 'Marketer not found' });
    }

    // Get query parameters
    const { status, type, limit = '50', offset = '0' } = req.query;

    // Get commissions
    const commissions = await MarketerCommissionService.getCommissionsForMarketer(marketer.id, {
      status: status as any,
      type: type as any,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

    logger.info('Marketer commissions accessed', {
      marketerId: marketer.id
    });

    return res.status(200).json({
      success: true,
      commissions
    });
  } catch (error: any) {
    logger.error('Commissions fetch failed', { error });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
