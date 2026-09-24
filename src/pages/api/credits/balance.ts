import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { getOrCreateWallet } from '@/lib/services/credits/credit-wallet.service';
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

  const wallet = await getOrCreateWallet(businessId);

  return res.status(200).json(successResponse({
    balance: wallet.balance,
    reservedBalance: wallet.reservedBalance,
    availableBalance: wallet.balance - wallet.reservedBalance,
    monthlyAllocation: wallet.monthlyAllocation,
    purchasedCredits: wallet.purchasedCredits,
    bonusCredits: wallet.bonusCredits,
    lifetimeConsumed: wallet.lifetimeConsumed,
    lifetimePurchased: wallet.lifetimePurchased,
    lifetimeAllocated: wallet.lifetimeAllocated,
    lastRenewalAt: wallet.lastRenewalAt,
    nextRenewalAt: wallet.nextRenewalAt,
  }));
}

export default withErrorHandler(handler);
