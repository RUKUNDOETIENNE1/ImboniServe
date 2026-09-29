import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { getPlatformAnalytics } from '@/lib/services/credits/credit-analytics.service';
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

  if (req.method !== 'GET') {
    return res.status(405).json(errorResponse('Method not allowed'));
  }

  const days = parseInt(String(req.query.days)) || 30;
  const analytics = await getPlatformAnalytics(days);

  return res.status(200).json(successResponse(analytics));
}

export default withErrorHandler(handler);
