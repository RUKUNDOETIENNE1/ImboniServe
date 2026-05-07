import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { MarketerPayoutService } from '@/lib/services/marketer-payout.service';
import { logger } from '@/lib/logger';

type AppSession = Session & { user?: Session['user'] & { roles?: string[]; role?: string; businessId?: string | null; id?: string } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid payout ID' });
    }

    // Check if user is authenticated and has admin role
    const session = await getServerSession(req, res, authOptions) as AppSession;
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userRoles = session.user?.roles || [];
    if (!userRoles.includes('ADMIN') && !userRoles.includes('OWNER')) {
      return res.status(403).json({ error: 'Forbidden - Admin only' });
    }

    // Approve payout
    const payout = await MarketerPayoutService.approvePayout(
      id,
      session.user?.id || 'unknown'
    );

    logger.info('Payout approved via API', {
      payoutId: id,
      approvedBy: session.user?.id
    });

    return res.status(200).json({
      success: true,
      payout
    });
  } catch (error: any) {
    logger.error('Payout approval failed', { error });
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
