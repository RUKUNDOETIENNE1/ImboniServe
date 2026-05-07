import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, forbiddenResponse } from '@/lib/api/response-helpers';
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const roles: string[] = (session?.user as any)?.roles || [];

  if (!session?.user) {
    return res.status(401).json(errorResponse('Unauthorized'));
  }

  if (!roles.includes('PLATFORM_ADMIN')) {
    return res.status(403).json(forbiddenResponse());
  }

  if (req.method !== 'GET') {
    return res.status(405).json(errorResponse('Method not allowed'));
  }

  try {
    const { period = '30' } = req.query;
    const daysAgo = parseInt(String(period)) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Get AI usage statistics
    const aiUsageLogs = await (prisma as any).aIUsageLog.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            plan: {
              select: {
                name: true,
                code: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Aggregate statistics
    const totalCreditsUsed = aiUsageLogs.reduce((sum: number, log: any) => sum + log.creditsUsed, 0);
    const totalTokensUsed = aiUsageLogs.reduce((sum: number, log: any) => sum + (log.tokensUsed || 0), 0);
    const totalCostUSD = aiUsageLogs.reduce((sum: number, log: any) => sum + (log.costUSD || 0), 0);

    // Usage by feature
    const byFeature = aiUsageLogs.reduce((acc: any, log: any) => {
      if (!acc[log.feature]) {
        acc[log.feature] = {
          feature: log.feature,
          count: 0,
          creditsUsed: 0,
          tokensUsed: 0,
          costUSD: 0
        };
      }
      acc[log.feature].count++;
      acc[log.feature].creditsUsed += log.creditsUsed;
      acc[log.feature].tokensUsed += log.tokensUsed || 0;
      acc[log.feature].costUSD += log.costUSD || 0;
      return acc;
    }, {});

    // Top businesses by usage
    const byBusiness = aiUsageLogs.reduce((acc: any, log: any) => {
      const businessId = log.business.id;
      if (!acc[businessId]) {
        acc[businessId] = {
          businessId,
          businessName: log.business.name,
          planName: log.business.plan?.name || 'No Plan',
          planCode: log.business.plan?.code || 'NONE',
          count: 0,
          creditsUsed: 0,
          tokensUsed: 0,
          costUSD: 0
        };
      }
      acc[businessId].count++;
      acc[businessId].creditsUsed += log.creditsUsed;
      acc[businessId].tokensUsed += log.tokensUsed || 0;
      acc[businessId].costUSD += log.costUSD || 0;
      return acc;
    }, {});

    const topBusinesses = Object.values(byBusiness)
      .sort((a: any, b: any) => b.creditsUsed - a.creditsUsed)
      .slice(0, 20);

    // Businesses approaching limits
    const businessesNearLimit = await prisma.business.findMany({
      where: {
        aiCreditsUsed: {
          gte: prisma.$raw`"aiCreditsLimit" * 0.8` // 80% of limit
        }
      },
      select: {
        id: true,
        name: true,
        aiCreditsUsed: true,
        aiCreditsLimit: true,
        aiResetDate: true,
        plan: {
          select: {
            name: true,
            code: true,
            aiCreditsMonthly: true
          }
        }
      },
      orderBy: {
        aiCreditsUsed: 'desc'
      },
      take: 20
    });

    // Daily usage trend
    const dailyUsage = aiUsageLogs.reduce((acc: any, log: any) => {
      const date = log.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          count: 0,
          creditsUsed: 0,
          tokensUsed: 0,
          costUSD: 0
        };
      }
      acc[date].count++;
      acc[date].creditsUsed += log.creditsUsed;
      acc[date].tokensUsed += log.tokensUsed || 0;
      acc[date].costUSD += log.costUSD || 0;
      return acc;
    }, {});

    const dailyTrend = Object.values(dailyUsage).sort((a: any, b: any) => 
      a.date.localeCompare(b.date)
    );

    // Cost projections
    const avgDailyCredits = totalCreditsUsed / daysAgo;
    const projectedMonthlyCredits = avgDailyCredits * 30;
    const projectedMonthlyCostUSD = (totalCostUSD / daysAgo) * 30;

    return res.status(200).json(successResponse({
      period: {
        days: daysAgo,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      },
      summary: {
        totalCalls: aiUsageLogs.length,
        totalCreditsUsed,
        totalTokensUsed,
        totalCostUSD: totalCostUSD.toFixed(2),
        avgCreditsPerCall: (totalCreditsUsed / aiUsageLogs.length).toFixed(2),
        avgTokensPerCall: (totalTokensUsed / aiUsageLogs.length).toFixed(0)
      },
      projections: {
        avgDailyCredits: avgDailyCredits.toFixed(0),
        projectedMonthlyCredits: projectedMonthlyCredits.toFixed(0),
        projectedMonthlyCostUSD: projectedMonthlyCostUSD.toFixed(2),
        projectedMonthlyCostRWF: (projectedMonthlyCostUSD * 1300).toFixed(0) // Approx USD to RWF
      },
      byFeature: Object.values(byFeature),
      topBusinesses,
      businessesNearLimit,
      dailyTrend
    }));

  } catch (error: any) {
    throw error;
  }
}

export default withErrorHandler(handler);
