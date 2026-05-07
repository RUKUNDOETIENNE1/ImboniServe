import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { getAIUsageStats } from '@/lib/services/ai-credit.service';
import { getSiteBuilderStats } from '@/lib/services/site-builder-subscription.service';
import { getDiscoveryStats } from '@/lib/services/discovery-subscription.service';
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

  try {
    // Get business details including plan
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        plan: {
          select: {
            name: true,
            code: true,
            aiCreditsMonthly: true,
            qrCodesLimit: true,
            cmsPostsLimit: true,
            storageGBLimit: true
          }
        }
      }
    });

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Get AI usage stats
    const aiStats = await getAIUsageStats(businessId);

    // Get Site Builder stats
    const siteBuilderStats = await getSiteBuilderStats(businessId);

    // Get Discovery stats
    const discoveryStats = await getDiscoveryStats(businessId);

    // Compile comprehensive usage statistics
    const stats = {
      aiCredits: {
        used: aiStats.creditsUsed,
        limit: aiStats.creditsLimit,
        remaining: aiStats.creditsRemaining,
        resetDate: aiStats.resetDate
      },
      storage: {
        usedBytes: Number(business.storageUsedBytes),
        limitGB: business.plan?.storageGBLimit || 5,
        usedPercent: (Number(business.storageUsedBytes) / ((business.plan?.storageGBLimit || 5) * 1024 * 1024 * 1024)) * 100
      },
      qrCodes: {
        count: business.qrCodesCount,
        limit: business.plan?.qrCodesLimit || null
      },
      cmsPosts: {
        thisMonth: business.cmsPostsThisMonth,
        limit: business.plan?.cmsPostsLimit || null
      },
      plan: {
        name: business.plan?.name || 'Unknown',
        tier: business.plan?.code || 'STARTER'
      },
      siteBuilder: {
        tier: siteBuilderStats.tier,
        isPublished: siteBuilderStats.isPublished,
        aiGenerationsUsed: siteBuilderStats.aiGenerationsUsed,
        aiGenerationsLimit: siteBuilderStats.aiGenerationsLimit,
        customDomain: siteBuilderStats.customDomain,
        customDomainActive: siteBuilderStats.customDomainActive
      },
      discovery: {
        tier: discoveryStats.tier,
        commission: discoveryStats.commission,
        monthlyOrders: discoveryStats.monthlyOrders,
        monthlyGMV: discoveryStats.monthlyGMV,
        commissionSavings: discoveryStats.commissionSavings,
        badges: discoveryStats.badges
      }
    };

    return res.status(200).json(successResponse(stats));
  } catch (error: any) {
    throw error;
  }
}

export default withErrorHandler(handler);
