import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { MarketerAttributionService } from '@/lib/services/marketer-attribution.service';
import { ProfessionalMarketerService } from '@/lib/services/professional-marketer.service';
import { prisma } from '@/lib/prisma';
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

    // Get attributed businesses
    const attributions = await MarketerAttributionService.getAttributedBusinesses(marketer.id);

    // Get business details for each attribution
    const businessIds = attributions.map(a => a.businessId);
    const businesses = await prisma.business.findMany({
      where: { id: { in: businessIds } },
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true
      }
    });

    // Merge attribution data with business data
    const merged = attributions.map(attr => {
      const business = businesses.find(b => b.id === attr.businessId);
      return {
        attribution: attr,
        business
      };
    });

    logger.info('Marketer businesses accessed', {
      marketerId: marketer.id
    });

    return res.status(200).json({
      success: true,
      businesses: merged
    });
  } catch (error: any) {
    logger.error('Businesses fetch failed', { error });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
