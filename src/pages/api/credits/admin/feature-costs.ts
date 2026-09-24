import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { listAllFeatureCosts, updateFeatureCost, createFeatureCost } from '@/lib/services/credits/feature-cost-registry.service';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse } from '@/lib/api/response-helpers';
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const roles: string[] = (session?.user as any)?.roles || [];

  if (!session?.user) {
    return res.status(401).json(unauthorizedResponse());
  }

  if (!roles.includes('PLATFORM_ADMIN')) {
    return res.status(403).json(forbiddenResponse());
  }

  if (req.method === 'GET') {
    const costs = await listAllFeatureCosts();
    return res.status(200).json(successResponse(costs));
  }

  if (req.method === 'POST') {
    const { featureKey, featureName, description, creditsCost, isDynamic, minCredits, maxCredits, category } = req.body;

    if (!featureKey || !featureName || creditsCost === undefined) {
      return res.status(400).json(errorResponse('featureKey, featureName, and creditsCost are required'));
    }

    await createFeatureCost({ featureKey, featureName, description, creditsCost, isDynamic, minCredits, maxCredits, category });
    return res.status(201).json(successResponse({ featureKey }, 'Feature cost created'));
  }

  if (req.method === 'PUT') {
    const { featureKey, creditsCost, isDynamic, minCredits, maxCredits, isActive } = req.body;

    if (!featureKey || creditsCost === undefined) {
      return res.status(400).json(errorResponse('featureKey and creditsCost are required'));
    }

    await updateFeatureCost(featureKey, creditsCost, { isDynamic, minCredits, maxCredits, isActive });
    return res.status(200).json(successResponse({ featureKey }, 'Feature cost updated'));
  }

  return res.status(405).json(errorResponse('Method not allowed'));
}

export default withErrorHandler(handler);
