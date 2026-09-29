import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { getBusinessLedger } from '@/lib/services/credits/credit-ledger.service';
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

  const page = parseInt(String(req.query.page)) || 1;
  const limit = parseInt(String(req.query.limit)) || 50;
  const entryType = req.query.entryType as any;
  const feature = req.query.feature as string | undefined;

  const result = await getBusinessLedger(businessId, {
    page,
    limit,
    entryType,
    feature,
  });

  return res.status(200).json(successResponse(result.entries, undefined));
}

export default withErrorHandler(handler);
