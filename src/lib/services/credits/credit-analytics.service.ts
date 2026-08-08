/**
 * AI Credit Analytics Service
 * Business-level and platform-level analytics for AI credit consumption.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'credit-analytics' });

export interface BusinessAnalytics {
  balance: number;
  reservedBalance: number;
  availableBalance: number;
  monthlyAllocation: number;
  purchasedCredits: number;
  bonusCredits: number;
  lifetimeConsumed: number;
  lifetimePurchased: number;
  lifetimeAllocated: number;
  nextRenewalAt: Date | null;
  usageThisMonth: {
    totalCredits: number;
    byFeature: Array<{ feature: string; count: number; credits: number }>;
  };
  usageTrend: Array<{ date: string; credits: number; count: number }>;
  topFeatures: Array<{ feature: string; count: number; credits: number }>;
}

export interface PlatformAnalytics {
  totalBusinesses: number;
  totalCreditsConsumed: number;
  totalCreditsPurchased: number;
  totalCreditsAllocated: number;
  totalRevenueFromCredits: number;
  avgConsumptionPerBusiness: number;
  topFeatures: Array<{ feature: string; count: number; credits: number }>;
  topBusinesses: Array<{ businessId: string; businessName: string; creditsConsumed: number; planCode: string }>;
  dailyTrend: Array<{ date: string; credits: number; count: number }>;
  consumptionByPlan: Array<{ planCode: string; businessCount: number; totalCredits: number; avgCredits: number }>;
}

/**
 * Get analytics for a specific business
 */
export async function getBusinessAnalytics(businessId: string, days: number = 30): Promise<BusinessAnalytics> {
  const wallet = await prisma.aICreditWallet.findUnique({
    where: { businessId },
  });

  if (!wallet) {
    throw new Error('Credit wallet not found');
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Usage this month (from last renewal)
  const monthStart = wallet.lastRenewalAt || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [monthUsage, trendData, topFeaturesData] = await Promise.all([
    // Usage by feature this month
    prisma.aICreditLedgerEntry.groupBy({
      by: ['feature'],
      where: {
        businessId,
        entryType: 'CONSUMPTION',
        createdAt: { gte: monthStart },
      },
      _count: { id: true },
      _sum: { credits: true },
    }),

    // Daily usage trend
    prisma.$queryRaw`
      SELECT DATE("createdAt") as date,
             COUNT(*) as count,
             COALESCE(SUM("credits"), 0) as credits
      FROM "AICreditLedgerEntry"
      WHERE "businessId" = ${businessId}
        AND "entryType" = 'CONSUMPTION'
        AND "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `,

    // Top features all-time
    prisma.aICreditLedgerEntry.groupBy({
      by: ['feature'],
      where: {
        businessId,
        entryType: 'CONSUMPTION',
      },
      _count: { id: true },
      _sum: { credits: true },
      orderBy: { _sum: { credits: 'desc' } },
      take: 10,
    }),
  ]);

  const totalMonthCredits = monthUsage.reduce((sum, u) => sum + Math.abs(u._sum.credits || 0), 0);

  return {
    balance: wallet.balance,
    reservedBalance: wallet.reservedBalance,
    availableBalance: wallet.balance - wallet.reservedBalance,
    monthlyAllocation: wallet.monthlyAllocation,
    purchasedCredits: wallet.purchasedCredits,
    bonusCredits: wallet.bonusCredits,
    lifetimeConsumed: wallet.lifetimeConsumed,
    lifetimePurchased: wallet.lifetimePurchased,
    lifetimeAllocated: wallet.lifetimeAllocated,
    nextRenewalAt: wallet.nextRenewalAt,
    usageThisMonth: {
      totalCredits: totalMonthCredits,
      byFeature: monthUsage.map(u => ({
        feature: u.feature || 'unknown',
        count: u._count.id,
        credits: Math.abs(u._sum.credits || 0),
      })),
    },
    usageTrend: (trendData as any[]).map(t => ({
      date: t.date instanceof Date ? t.date.toISOString().split('T')[0] : String(t.date),
      credits: Math.abs(Number(t.credits)),
      count: Number(t.count),
    })),
    topFeatures: topFeaturesData.map(f => ({
      feature: f.feature || 'unknown',
      count: f._count.id,
      credits: Math.abs(f._sum.credits || 0),
    })),
  };
}

/**
 * Get platform-wide analytics (admin only)
 */
export async function getPlatformAnalytics(days: number = 30): Promise<PlatformAnalytics> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [
    walletStats,
    consumptionStats,
    purchaseStats,
    allocationStats,
    topFeatures,
    topBusinesses,
    dailyTrend,
    consumptionByPlan,
  ] = await Promise.all([
    // Total wallet stats
    prisma.aICreditWallet.aggregate({
      _sum: {
        lifetimeConsumed: true,
        lifetimePurchased: true,
        lifetimeAllocated: true,
      },
      _count: { id: true },
    }),

    // Total consumption in period
    prisma.aICreditLedgerEntry.aggregate({
      where: {
        entryType: 'CONSUMPTION',
        createdAt: { gte: startDate },
      },
      _sum: { credits: true },
      _count: { id: true },
    }),

    // Total purchases in period
    prisma.aICreditLedgerEntry.aggregate({
      where: {
        entryType: 'PURCHASE',
        createdAt: { gte: startDate },
      },
      _sum: { credits: true },
    }),

    // Total allocations in period
    prisma.aICreditLedgerEntry.aggregate({
      where: {
        entryType: 'ALLOCATION',
        createdAt: { gte: startDate },
      },
      _sum: { credits: true },
    }),

    // Top features by consumption
    prisma.aICreditLedgerEntry.groupBy({
      by: ['feature'],
      where: {
        entryType: 'CONSUMPTION',
        createdAt: { gte: startDate },
      },
      _count: { id: true },
      _sum: { credits: true },
      orderBy: { _sum: { credits: 'desc' } },
      take: 20,
    }),

    // Top businesses by consumption
    prisma.$queryRaw`
      SELECT w."businessId" as "businessId",
             b.name as "businessName",
             p.code as "planCode",
             w."lifetimeConsumed" as "creditsConsumed"
      FROM "AICreditWallet" w
      JOIN "Restaurant" b ON b.id = w."businessId"
      LEFT JOIN "Plan" p ON p.id = b."planId"
      ORDER BY w."lifetimeConsumed" DESC
      LIMIT 20
    `,

    // Daily trend
    prisma.$queryRaw`
      SELECT DATE("createdAt") as date,
             COUNT(*) as count,
             COALESCE(SUM("credits"), 0) as credits
      FROM "AICreditLedgerEntry"
      WHERE "entryType" = 'CONSUMPTION'
        AND "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `,

    // Consumption by plan
    prisma.$queryRaw`
      SELECT p.code as "planCode",
             COUNT(DISTINCT w."businessId") as "businessCount",
             COALESCE(SUM(w."lifetimeConsumed"), 0) as "totalCredits"
      FROM "AICreditWallet" w
      JOIN "Restaurant" b ON b.id = w."businessId"
      LEFT JOIN "Plan" p ON p.id = b."planId"
      GROUP BY p.code
      ORDER BY "totalCredits" DESC
    `,
  ]);

  const totalBusinesses = walletStats._count.id;
  const totalCreditsConsumed = walletStats._sum.lifetimeConsumed || 0;

  return {
    totalBusinesses,
    totalCreditsConsumed,
    totalCreditsPurchased: walletStats._sum.lifetimePurchased || 0,
    totalCreditsAllocated: walletStats._sum.lifetimeAllocated || 0,
    totalRevenueFromCredits: purchaseStats._sum.credits || 0,
    avgConsumptionPerBusiness: totalBusinesses > 0 ? Math.round(totalCreditsConsumed / totalBusinesses) : 0,
    topFeatures: topFeatures.map(f => ({
      feature: f.feature || 'unknown',
      count: f._count.id,
      credits: Math.abs(f._sum.credits || 0),
    })),
    topBusinesses: (topBusinesses as any[]).map(b => ({
      businessId: b.businessId,
      businessName: b.businessName,
      creditsConsumed: Number(b.creditsConsumed),
      planCode: b.planCode || 'NONE',
    })),
    dailyTrend: (dailyTrend as any[]).map(t => ({
      date: t.date instanceof Date ? t.date.toISOString().split('T')[0] : String(t.date),
      credits: Math.abs(Number(t.credits)),
      count: Number(t.count),
    })),
    consumptionByPlan: (consumptionByPlan as any[]).map(p => ({
      planCode: p.planCode || 'NONE',
      businessCount: Number(p.businessCount),
      totalCredits: Number(p.totalCredits),
      avgCredits: Number(p.businessCount) > 0 ? Math.round(Number(p.totalCredits) / Number(p.businessCount)) : 0,
    })),
  };
}
