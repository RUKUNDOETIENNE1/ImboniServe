import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { searchLedger } from '@/lib/services/credits/credit-ledger.service';
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

  const page = parseInt(String(req.query.page)) || 1;
  const limit = Math.min(parseInt(String(req.query.limit)) || 50, 100);
  const businessId = req.query.businessId as string | undefined;
  const entryType = req.query.entryType as any;
  const feature = req.query.feature as string | undefined;

  const result = await searchLedger({
    businessId,
    entryType,
    feature,
    page,
    limit,
  });

  return res.status(200).json(successResponse(result.entries, undefined));
}

export default withErrorHandler(handler);
