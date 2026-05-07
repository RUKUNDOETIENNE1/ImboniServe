import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { ProfessionalMarketerService } from '@/lib/services/professional-marketer.service';
import { MarketerCommissionService } from '@/lib/services/marketer-commission.service';
import { MarketerPayoutService } from '@/lib/services/marketer-payout.service';
import { MarketerWalletService } from '@/lib/services/marketer-wallet.service';
import { MarketerAttributionService } from '@/lib/services/marketer-attribution.service';
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

    // Find marketer by user ID
    const marketer = await ProfessionalMarketerService.getMarketerByEmail(session.user?.email || '');
    if (!marketer) {
      return res.status(404).json({ error: 'Marketer not found' });
    }

    if (marketer.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Marketer account is not active' });
    }

    // Get all dashboard data in parallel
    const [dashboardData, commissionStats, payoutStats, attributionStats, wallet] = await Promise.all([
      ProfessionalMarketerService.getMarketerDashboard(marketer.id),
      MarketerCommissionService.getCommissionStats(marketer.id),
      MarketerPayoutService.getPayoutStats(marketer.id),
      MarketerAttributionService.getAttributionStats(marketer.id),
      MarketerWalletService.getBalanceSummary(marketer.id)
    ]);

    logger.info('Marketer dashboard accessed', {
      marketerId: marketer.id,
      userId: (session.user as any)?.id || 'unknown'
    });

    return res.status(200).json({
      success: true,
      data: {
        marketer: {
          id: marketer.id,
          name: marketer.name,
          email: marketer.email,
          referralCode: marketer.referralCode,
          status: marketer.status,
          createdAt: marketer.createdAt
        },
        wallet,
        commissions: commissionStats,
        payouts: payoutStats,
        attributions: attributionStats,
        recentActivity: dashboardData.recentActivity
      }
    });
  } catch (error: any) {
    logger.error('Marketer dashboard fetch failed', { error });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
