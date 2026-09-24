import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { checkDiscoveryAccess, getDiscoveryStats } from '@/lib/services/discovery-subscription.service';
import { successResponse, unauthorizedResponse } from '@/lib/api/response-helpers';
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware';
import { requiresFeature } from '@/lib/middleware/withFeatureCheck';

async function baseHandler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const businessId = (session?.user as any)?.businessId;

  if (!session?.user || !businessId) {
    return res.status(401).json(unauthorizedResponse());
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const access = await checkDiscoveryAccess(businessId);
  const stats = await getDiscoveryStats(businessId);

  return res.status(200).json(successResponse({ access, stats }));
}

// Apply commercial enforcement: Discovery Listing requires Starter plan or higher
const handler = requiresFeature('hasDiscoveryListing')(baseHandler);

export default withErrorHandler(handler);
