import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { grantBonusCredits, revokeCredits } from '@/lib/services/credits/credit-purchase.service';
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

  if (req.method !== 'POST') {
    return res.status(405).json(errorResponse('Method not allowed'));
  }

  const { businessId, action, credits, reason } = req.body;

  if (!businessId || !action || !credits || !reason) {
    return res.status(400).json(errorResponse('businessId, action, credits, and reason are required'));
  }

  if (action === 'grant') {
    const result = await grantBonusCredits(businessId, credits, reason, {
      userId: (session.user as any).id,
    });
    return res.status(200).json(successResponse(result, 'Credits granted successfully'));
  } else if (action === 'revoke') {
    const result = await revokeCredits(businessId, credits, reason, {
      userId: (session.user as any).id,
    });
    return res.status(200).json(successResponse(result, 'Credits revoked successfully'));
  } else {
    return res.status(400).json(errorResponse('Action must be "grant" or "revoke"'));
  }
}

export default withErrorHandler(handler);
