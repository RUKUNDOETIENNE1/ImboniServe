import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { ProfessionalMarketerService } from '@/lib/services/professional-marketer.service';
import { logger } from '@/lib/logger';

type AppSession = Session & { user?: Session['user'] & { roles?: string[]; role?: string; businessId?: string | null; id?: string } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if user is authenticated and has admin role
    const session = await getServerSession(req, res, authOptions) as AppSession;
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userRoles = session.user?.roles || [];
    if (!userRoles.includes('ADMIN') && !userRoles.includes('OWNER')) {
      return res.status(403).json({ error: 'Forbidden - Admin only' });
    }

    // Get query parameters
    const { status, limit = '50', offset = '0' } = req.query;

    // Get marketers
    const marketers = await ProfessionalMarketerService.listMarketers({
      status: status as any,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

    logger.info('Admin marketers list accessed', {
      accessedBy: session.user?.id
    });

    return res.status(200).json({
      success: true,
      marketers
    });
  } catch (error: any) {
    logger.error('Admin marketers list fetch failed', { error });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
