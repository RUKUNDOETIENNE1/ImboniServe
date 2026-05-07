/**
 * AI Credit Management Service
 * Tracks and enforces AI usage limits across all features
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'ai-credit' });

export enum AIFeature {
  BUSINESS_SCANNER = 'scanner',
  SITE_BUILDER = 'site_builder',
  MENU_DESCRIPTION = 'menu_description',
  TAGLINE_GENERATOR = 'tagline',
  PROMO_TEXT = 'promo',
  SMART_INSIGHTS = 'insights'
}

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
 * Check if business has sufficient AI credits
 */
export async function checkAICredits(
  businessId: string,
  feature: AIFeature
): Promise<CreditCheckResult> {
  const creditsRequired = AI_CREDIT_COSTS[feature];

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      aiCreditsUsed: true,
      aiCreditsLimit: true,
      aiResetDate: true,
      plan: {
        select: {
          aiCreditsMonthly: true
        }
      }
    }
  });

  if (!business) {
    throw new Error('Business not found');
  }

  // Check if credits need to be reset (monthly)
  const now = new Date();
  const needsReset = business.aiResetDate && business.aiResetDate <= now;

  let creditsUsed = business.aiCreditsUsed;
  let resetDate = business.aiResetDate;

  if (needsReset) {
    // Reset credits
    const nextResetDate = new Date(now);
    nextResetDate.setMonth(nextResetDate.getMonth() + 1);
    nextResetDate.setDate(1);
    nextResetDate.setHours(0, 0, 0, 0);

    await prisma.business.update({
      where: { id: businessId },
      data: {
        aiCreditsUsed: 0,
        aiResetDate: nextResetDate
      }
    });

    creditsUsed = 0;
    resetDate = nextResetDate;
    log.info('AI credits reset', { businessId, resetDate: nextResetDate });
  }

  const creditsLimit = business.plan?.aiCreditsMonthly || business.aiCreditsLimit;
  const creditsAvailable = creditsLimit - creditsUsed;
  const allowed = creditsAvailable >= creditsRequired;

  return {
    allowed,
    creditsAvailable,
    creditsRequired,
    creditsRemaining: allowed ? creditsAvailable - creditsRequired : creditsAvailable,
    resetDate,
    message: allowed 
      ? undefined 
      : `Insufficient AI credits. You need ${creditsRequired} credits but only have ${creditsAvailable} available. Credits reset on ${resetDate?.toLocaleDateString()}.`
  };
}

/**
 * Consume AI credits and log usage
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
  const creditsUsed = AI_CREDIT_COSTS[feature];

  // Update business credits (atomic increment prevents race conditions)
  const updated = await prisma.business.update({
    where: { id: businessId },
    data: {
      aiCreditsUsed: {
        increment: creditsUsed
      }
    },
    select: {
      aiCreditsUsed: true,
      aiCreditsLimit: true,
      plan: {
        select: {
          aiCreditsMonthly: true
        }
      }
    }
  });

  // Post-consumption validation: detect overspend
  const creditsLimit = updated.plan?.aiCreditsMonthly || updated.aiCreditsLimit;
  if (updated.aiCreditsUsed > creditsLimit) {
    log.warn('AI credits overspent (race condition)', {
      businessId,
      creditsUsed: updated.aiCreditsUsed,
      creditsLimit,
      overspend: updated.aiCreditsUsed - creditsLimit
    });
  }

  // Log usage
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

  log.info('AI credits consumed', { 
    businessId, 
    feature, 
    creditsUsed,
    tokensUsed: metadata?.tokensUsed 
  });
}

/**
 * Get AI usage statistics for a business
 */
export async function getAIUsageStats(businessId: string): Promise<UsageStats> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      aiCreditsUsed: true,
      aiCreditsLimit: true,
      aiResetDate: true,
      plan: {
        select: {
          aiCreditsMonthly: true
        }
      }
    }
  });

  if (!business) {
    throw new Error('Business not found');
  }

  const creditsLimit = business.plan?.aiCreditsMonthly || business.aiCreditsLimit;

  // Get usage breakdown by feature (current month)
  const resetDate = business.aiResetDate || new Date();
  const monthStart = new Date(resetDate);
  monthStart.setMonth(monthStart.getMonth() - 1);

  const usageLogs = await prisma.aIUsageLog.groupBy({
    by: ['feature'],
    where: {
      businessId,
      createdAt: {
        gte: monthStart
      }
    },
    _count: {
      id: true
    },
    _sum: {
      creditsUsed: true
    }
  });

  const usageByFeature = usageLogs.map(log => ({
    feature: log.feature,
    count: log._count.id,
    totalCredits: log._sum.creditsUsed || 0
  }));

  return {
    creditsUsed: business.aiCreditsUsed,
    creditsLimit,
    creditsRemaining: Math.max(0, creditsLimit - business.aiCreditsUsed),
    resetDate: business.aiResetDate,
    usageByFeature
  };
}

/**
 * Get plan-based credit limit
 */
export async function getPlanCreditLimit(businessId: string): Promise<number> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      plan: {
        select: {
          aiCreditsMonthly: true,
          code: true
        }
      }
    }
  });

  if (!business) {
    throw new Error('Business not found');
  }

  // Default limits by plan if not set in database
  const DEFAULT_LIMITS: Record<string, number> = {
    'ESSENTIALS': 20,
    'STARTER': 20,
    'PROFESSIONAL': 50,
    'GROWTH': 100,
    'BUSINESS': 200,
    'ENTERPRISE': 999999 // Unlimited
  };

  return business.plan?.aiCreditsMonthly || 
         DEFAULT_LIMITS[business.plan?.code || 'STARTER'] || 
         20;
}

/**
 * Purchase additional AI credits
 */
export async function purchaseExtraCredits(
  businessId: string,
  creditsAmount: number
): Promise<void> {
  await prisma.business.update({
    where: { id: businessId },
    data: {
      aiCreditsLimit: {
        increment: creditsAmount
      }
    }
  });

  log.info('Extra AI credits purchased', { businessId, creditsAmount });
}

/**
 * Initialize AI credits for a new business
 */
export async function initializeAICredits(businessId: string): Promise<void> {
  const nextResetDate = new Date();
  nextResetDate.setMonth(nextResetDate.getMonth() + 1);
  nextResetDate.setDate(1);
  nextResetDate.setHours(0, 0, 0, 0);

  await prisma.business.update({
    where: { id: businessId },
    data: {
      aiCreditsUsed: 0,
      aiResetDate: nextResetDate
    }
  });

  log.info('AI credits initialized', { businessId, resetDate: nextResetDate });
}
