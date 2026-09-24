/**
 * AI Credit Management Service (Legacy Adapter)
 * 
 * This file now delegates to the unified AI Credits Platform.
 * All existing exports are preserved for backward compatibility.
 * New code should import from '@/lib/services/credits' directly.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getOrCreateWallet, getAvailableBalance, renewMonthlyAllocation, adjustBalance } from './credits/credit-wallet.service';
import { getFeatureCost } from './credits/feature-cost-registry.service';
import { reserveCredits, commitReservation } from './credits/credit-consumption-engine.service';
import { getBusinessAnalytics } from './credits/credit-analytics.service';
import { AICreditLedgerEntryType } from '@prisma/client';
import { getBusinessDayBoundary } from '@/lib/utils/timezone';

const log = logger.child({ service: 'ai-credit-adapter' });

export enum AIFeature {
  BUSINESS_SCANNER = 'scanner',
  SITE_BUILDER = 'site_builder',
  MENU_DESCRIPTION = 'menu_description',
  TAGLINE_GENERATOR = 'tagline',
  PROMO_TEXT = 'promo',
  SMART_INSIGHTS = 'insights'
}

/** Legacy cost map — kept for backward compat. Actual costs come from the registry. */
export const AI_CREDIT_COSTS: Record<AIFeature, number> = {
  [AIFeature.BUSINESS_SCANNER]: 5,
  [AIFeature.SITE_BUILDER]: 3,
  [AIFeature.MENU_DESCRIPTION]: 3,
  [AIFeature.TAGLINE_GENERATOR]: 3,
  [AIFeature.PROMO_TEXT]: 3,
  [AIFeature.SMART_INSIGHTS]: 2
};

export interface CreditCheckResult {
  allowed: boolean;
  creditsAvailable: number;
  creditsRequired: number;
  creditsRemaining: number;
  resetDate: Date | null;
  message?: string;
}

export interface UsageStats {
  creditsUsed: number;
  creditsLimit: number;
  creditsRemaining: number;
  resetDate: Date | null;
  usageByFeature: {
    feature: string;
    count: number;
    totalCredits: number;
  }[];
}

/**
 * Check if business has sufficient AI credits.
 * Delegates to the new credits platform.
 */
export async function checkAICredits(
  businessId: string,
  feature: AIFeature
): Promise<CreditCheckResult> {
  const wallet = await getOrCreateWallet(businessId);

  if (wallet.nextRenewalAt && wallet.nextRenewalAt <= new Date()) {
    await renewMonthlyAllocation(businessId);
  }

  const creditsRequired = await getFeatureCost(feature);
  const creditsAvailable = await getAvailableBalance(businessId);
  const allowed = creditsAvailable >= creditsRequired;

  const updatedWallet = await getOrCreateWallet(businessId);

  return {
    allowed,
    creditsAvailable,
    creditsRequired,
    creditsRemaining: allowed ? creditsAvailable - creditsRequired : creditsAvailable,
    resetDate: updatedWallet.nextRenewalAt,
    message: allowed
      ? undefined
      : `Insufficient AI credits. You need ${creditsRequired} credits but only have ${creditsAvailable} available. Credits reset on ${updatedWallet.nextRenewalAt?.toLocaleDateString()}.`
  };
}

/**
 * Consume AI credits and log usage.
 * Delegates to the new consumption engine with reserve/commit lifecycle.
 * For backward compatibility, this is a synchronous reserve+commit.
 */
export async function consumeAICredits(
  businessId: string,
  feature: AIFeature,
  metadata?: {
    tokensUsed?: number;
    costUSD?: number;
    [key: string]: any;
  }
): Promise<void> {
  const reservation = await reserveCredits(businessId, feature, {
    operation: `Legacy consume: ${feature}`,
    metadata: metadata as any,
  });

  await commitReservation(reservation.requestId, {
    tokensUsed: metadata?.tokensUsed,
    costUSD: metadata?.costUSD,
    aiProvider: metadata?.model ? String(metadata.model) : undefined,
    metadata: metadata as any,
  });

  // Also write to the legacy AIUsageLog for backward compat with existing dashboards
  const creditsUsed = await getFeatureCost(feature);
  await prisma.aIUsageLog.create({
    data: {
      businessId,
      feature,
      creditsUsed,
      tokensUsed: metadata?.tokensUsed,
      costUSD: metadata?.costUSD,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined
    }
  });

  log.info('AI credits consumed (legacy adapter)', {
    businessId,
    feature,
    creditsUsed,
    tokensUsed: metadata?.tokensUsed
  });
}

/**
 * Get AI usage statistics for a business.
 * Delegates to the new analytics service.
 */
export async function getAIUsageStats(businessId: string): Promise<UsageStats> {
  try {
    const analytics = await getBusinessAnalytics(businessId, 30);
    const wallet = await getOrCreateWallet(businessId);

    return {
      creditsUsed: analytics.usageThisMonth.totalCredits,
      creditsLimit: wallet.monthlyAllocation,
      creditsRemaining: analytics.availableBalance,
      resetDate: wallet.nextRenewalAt,
      usageByFeature: analytics.usageThisMonth.byFeature.map(f => ({
        feature: f.feature,
        count: f.count,
        totalCredits: f.credits,
      })),
    };
  } catch (err: any) {
    log.warn('Failed to get analytics from new platform, falling back to legacy', { error: err.message });

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        aiCreditsUsed: true,
        aiCreditsLimit: true,
        aiResetDate: true,
        plan: { select: { aiCreditsMonthly: true } }
      }
    });

    if (!business) throw new Error('Business not found');

    const creditsLimit = business.plan?.aiCreditsMonthly || business.aiCreditsLimit;
    const resetDate = business.aiResetDate || new Date();
    const monthStart = new Date(resetDate);
    monthStart.setMonth(monthStart.getMonth() - 1);

    const usageLogs = await prisma.aIUsageLog.groupBy({
      by: ['feature'],
      where: { businessId, createdAt: { gte: monthStart } },
      _count: { id: true },
      _sum: { creditsUsed: true }
    });

    return {
      creditsUsed: business.aiCreditsUsed,
      creditsLimit,
      creditsRemaining: Math.max(0, creditsLimit - business.aiCreditsUsed),
      resetDate: business.aiResetDate,
      usageByFeature: usageLogs.map(l => ({
        feature: l.feature,
        count: l._count.id,
        totalCredits: l._sum.creditsUsed || 0
      }))
    };
  }
}

/**
 * Get plan-based credit limit
 */
export async function getPlanCreditLimit(businessId: string): Promise<number> {
  const wallet = await getOrCreateWallet(businessId);
  return wallet.monthlyAllocation;
}

/**
 * Purchase additional AI credits.
 * Delegates to the new credit purchase service.
 */
export async function purchaseExtraCredits(
  businessId: string,
  creditsAmount: number
): Promise<void> {
  const wallet = await getOrCreateWallet(businessId);

  await adjustBalance(
    wallet.id,
    businessId,
    creditsAmount,
    AICreditLedgerEntryType.PURCHASE,
    {
      operation: `Legacy purchase: ${creditsAmount} credits`,
      metadata: { creditsAmount, source: 'legacy' },
      adjustPurchasedCredits: creditsAmount,
      adjustLifetimePurchased: creditsAmount,
    }
  );

  // Also update the legacy business.aiCreditsLimit for backward compat
  await prisma.business.update({
    where: { id: businessId },
    data: {
      aiCreditsLimit: { increment: creditsAmount }
    }
  });

  log.info('Extra AI credits purchased (legacy adapter)', { businessId, creditsAmount });
}

/**
 * Initialize AI credits for a new business.
 * Delegates to wallet creation.
 */
export async function initializeAICredits(businessId: string): Promise<void> {
  await getOrCreateWallet(businessId);

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { timezone: true },
  });

  const nextResetDateRaw = new Date();
  nextResetDateRaw.setMonth(nextResetDateRaw.getMonth() + 1);
  nextResetDateRaw.setDate(1);
  const nextResetDate = getBusinessDayBoundary(nextResetDateRaw, business?.timezone).start;

  await prisma.business.update({
    where: { id: businessId },
    data: {
      aiCreditsUsed: 0,
      aiResetDate: nextResetDate
    }
  });

  log.info('AI credits initialized (legacy adapter)', { businessId, resetDate: nextResetDate });
}
