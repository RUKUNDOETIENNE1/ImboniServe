import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
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
    const page = parseInt(String(req.query.page)) || 1;
    const limit = Math.min(parseInt(String(req.query.limit)) || 50, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (req.query.search) {
      where.business = {
        name: { contains: String(req.query.search), mode: 'insensitive' },
      };
    }

    const [wallets, total] = await Promise.all([
      prisma.aICreditWallet.findMany({
        where,
        include: {
          business: {
            select: { id: true, name: true, plan: { select: { code: true, name: true } } },
          },
        },
        orderBy: { balance: 'desc' },
        skip,
        take: limit,
      }),
      prisma.aICreditWallet.count({ where }),
    ]);

    return res.status(200).json(successResponse({
      wallets: wallets.map((w) => ({
        id: w.id,
        businessId: w.businessId,
        businessName: w.business.name,
        planCode: w.business.plan?.code || 'NONE',
        planName: w.business.plan?.name || 'No Plan',
        balance: w.balance,
        reservedBalance: w.reservedBalance,
        monthlyAllocation: w.monthlyAllocation,
        purchasedCredits: w.purchasedCredits,
        bonusCredits: w.bonusCredits,
        lifetimeConsumed: w.lifetimeConsumed,
        lifetimePurchased: w.lifetimePurchased,
        nextRenewalAt: w.nextRenewalAt,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    }));
  }

  return res.status(405).json(errorResponse('Method not allowed'));
}

export default withErrorHandler(handler);
