/**
 * Site Builder Subscription Service
 * Manages FREE vs PRO tier access and feature gating
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'site-builder-subscription' });

export enum SiteBuilderTier {
  FREE = 'FREE',
  PRO = 'PRO'
}

export interface SiteBuilderAccess {
  tier: SiteBuilderTier;
  canPublish: boolean;
  canExport: boolean;
  canUseCustomDomain: boolean;
  hasWatermark: boolean;
  aiGenerationsRemaining: number;
  aiGenerationsLimit: number;
  templatesCount: number;
  features: {
    customColors: boolean;
    customFonts: boolean;
    sslIncluded: boolean;
    seoOptimization: boolean;
    mobileResponsive: boolean;
  };
}

/**
 * Get or create Site Builder subscription for a business
 */
export async function getSiteBuilderSubscription(businessId: string) {
  let subscription = await prisma.siteBuilderSubscription.findUnique({
    where: { businessId }
  });

  // Create if doesn't exist (for existing businesses)
  if (!subscription) {
    subscription = await prisma.siteBuilderSubscription.create({
      data: {
        businessId,
        tier: SiteBuilderTier.FREE,
        aiGenerationsLimit: 3,
        isPublished: false
      }
    });
    log.info('Site Builder subscription created', { businessId, tier: 'FREE' });
  }

  return subscription;
}

/**
 * Check Site Builder access level for a business
 */
export async function checkSiteBuilderAccess(businessId: string): Promise<SiteBuilderAccess> {
  const subscription = await getSiteBuilderSubscription(businessId);
  
  // Check if business plan includes Site Builder Pro
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      plan: {
        select: {
          siteBuilderIncluded: true
        }
      }
    }
  });

  const isPro = subscription.tier === SiteBuilderTier.PRO || business?.plan?.siteBuilderIncluded || false;

  return {
    tier: isPro ? SiteBuilderTier.PRO : SiteBuilderTier.FREE,
    canPublish: isPro,
    canExport: isPro,
    canUseCustomDomain: isPro && subscription.customDomainActive,
    hasWatermark: !isPro,
    aiGenerationsRemaining: Math.max(0, subscription.aiGenerationsLimit - subscription.aiGenerationsUsed),
    aiGenerationsLimit: isPro ? 50 : 3,
    templatesCount: isPro ? 10 : 1,
    features: {
      customColors: isPro,
      customFonts: isPro,
      sslIncluded: isPro,
      seoOptimization: isPro,
      mobileResponsive: true // Always available
    }
  };
}

/**
 * Upgrade to Pro tier
 */
export async function upgradeToPro(businessId: string): Promise<void> {
  await prisma.siteBuilderSubscription.update({
    where: { businessId },
    data: {
      tier: SiteBuilderTier.PRO,
      aiGenerationsLimit: 50
    }
  });

  log.info('Site Builder upgraded to PRO', { businessId });
}

/**
 * Downgrade to Free tier
 */
export async function downgradeToFree(businessId: string): Promise<void> {
  await prisma.siteBuilderSubscription.update({
    where: { businessId },
    data: {
      tier: SiteBuilderTier.FREE,
      aiGenerationsLimit: 3,
      customDomain: null,
      customDomainActive: false,
      isPublished: false // Unpublish when downgrading
    }
  });

  log.info('Site Builder downgraded to FREE', { businessId });
}

/**
 * Publish site (PRO only)
 */
export async function publishSite(businessId: string): Promise<{ success: boolean; error?: string }> {
  const access = await checkSiteBuilderAccess(businessId);

  if (!access.canPublish) {
    return {
      success: false,
      error: 'Site Builder Pro required to publish. Upgrade to publish your site.'
    };
  }

  await prisma.siteBuilderSubscription.update({
    where: { businessId },
    data: { isPublished: true }
  });

  log.info('Site published', { businessId });

  return { success: true };
}

/**
 * Unpublish site
 */
export async function unpublishSite(businessId: string): Promise<void> {
  await prisma.siteBuilderSubscription.update({
    where: { businessId },
    data: { isPublished: false }
  });

  log.info('Site unpublished', { businessId });
}

/**
 * Check if site is published
 */
export async function isSitePublished(businessId: string): Promise<boolean> {
  const subscription = await getSiteBuilderSubscription(businessId);
  return subscription.isPublished;
}

/**
 * Set custom domain (PRO only)
 */
export async function setCustomDomain(
  businessId: string,
  domain: string
): Promise<{ success: boolean; error?: string }> {
  const access = await checkSiteBuilderAccess(businessId);

  if (!access.canUseCustomDomain && access.tier !== SiteBuilderTier.PRO) {
    return {
      success: false,
      error: 'Custom domain requires Site Builder Pro. Upgrade to use custom domains.'
    };
  }

  await prisma.siteBuilderSubscription.update({
    where: { businessId },
    data: {
      customDomain: domain,
      customDomainActive: false // Needs verification
    }
  });

  log.info('Custom domain set (pending verification)', { businessId, domain });

  return { success: true };
}

/**
 * Activate custom domain after verification
 */
export async function activateCustomDomain(businessId: string): Promise<void> {
  await prisma.siteBuilderSubscription.update({
    where: { businessId },
    data: { customDomainActive: true }
  });

  log.info('Custom domain activated', { businessId });
}

/**
 * Track AI generation usage for Site Builder
 */
export async function trackAIGeneration(businessId: string): Promise<{ allowed: boolean; remaining: number }> {
  const subscription = await getSiteBuilderSubscription(businessId);
  
  if (subscription.aiGenerationsUsed >= subscription.aiGenerationsLimit) {
    return {
      allowed: false,
      remaining: 0
    };
  }

  await prisma.siteBuilderSubscription.update({
    where: { businessId },
    data: {
      aiGenerationsUsed: {
        increment: 1
      }
    }
  });

  return {
    allowed: true,
    remaining: subscription.aiGenerationsLimit - subscription.aiGenerationsUsed - 1
  };
}

/**
 * Reset monthly AI generations (called by cron)
 */
export async function resetMonthlyAIGenerations(): Promise<number> {
  const result = await prisma.siteBuilderSubscription.updateMany({
    data: {
      aiGenerationsUsed: 0
    }
  });

  log.info('Site Builder AI generations reset', { count: result.count });
  
  return result.count;
}

/**
 * Get Site Builder usage stats
 */
export async function getSiteBuilderStats(businessId: string) {
  const subscription = await getSiteBuilderSubscription(businessId);
  const access = await checkSiteBuilderAccess(businessId);

  return {
    tier: access.tier,
    isPublished: subscription.isPublished,
    customDomain: subscription.customDomain,
    customDomainActive: subscription.customDomainActive,
    aiGenerationsUsed: subscription.aiGenerationsUsed,
    aiGenerationsLimit: access.aiGenerationsLimit,
    aiGenerationsRemaining: access.aiGenerationsRemaining,
    features: access.features
  };
}
