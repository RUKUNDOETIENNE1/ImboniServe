import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { checkSiteBuilderAccess } from '@/lib/services/site-builder-subscription.service';
import { successResponse, unauthorizedResponse } from '@/lib/api/response-helpers';
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const businessId = (session?.user as any)?.businessId;

  if (!session?.user || !businessId) {
    return res.status(401).json(unauthorizedResponse());
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const access = await checkSiteBuilderAccess(businessId);

  return res.status(200).json(successResponse(access));
}

export default withErrorHandler(handler);
