import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { upgradeToFeatured, upgradeToPremium, DiscoveryTier } from '@/lib/services/discovery-subscription.service';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api/response-helpers';
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const businessId = (session?.user as any)?.businessId;

  if (!session?.user || !businessId) {
    return res.status(401).json(unauthorizedResponse());
  }

  const roles: string[] = (session?.user as any)?.roles || [];
  if (!roles.some(r => ['OWNER', 'ADMIN'].includes(r))) {
    return res.status(403).json(forbiddenResponse());
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tier } = req.body;

  if (!tier || !Object.values(DiscoveryTier).includes(tier)) {
    return res.status(400).json(errorResponse('Invalid tier specified'));
  }

  try {
    if (tier === DiscoveryTier.FEATURED) {
      await upgradeToFeatured(businessId);
      return res.status(200).json(successResponse(
        { tier: DiscoveryTier.FEATURED },
        'Upgraded to Featured tier successfully'
      ));
    }

    if (tier === DiscoveryTier.PREMIUM) {
      await upgradeToPremium(businessId);
      return res.status(200).json(successResponse(
        { tier: DiscoveryTier.PREMIUM },
        'Upgraded to Premium Partner tier successfully'
      ));
    }

    return res.status(400).json(errorResponse('Invalid upgrade target'));
  } catch (error: any) {
    throw error;
  }
}

export default withErrorHandler(handler);
