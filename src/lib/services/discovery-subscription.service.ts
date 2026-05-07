/**
 * Discovery Marketplace Subscription Service
 * Manages FREE/FEATURED/PREMIUM tiers with ranking and commission logic
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'discovery-subscription' });

export enum DiscoveryTier {
  FREE = 'FREE',
  FEATURED = 'FEATURED',
  PREMIUM = 'PREMIUM'
}

export interface DiscoveryAccess {
  tier: DiscoveryTier;
  commission: number; // Percentage
  rankingBoost: number; // Multiplier for search ranking
  badges: string[];
  features: {
    basicListing: boolean;
    enhancedProfile: boolean;
    priorityPlacement: boolean;
    homepageCarousel: boolean;
    sponsoredVisibility: boolean;
    performanceReports: boolean;
    accountManager: boolean;
  };
}

/**
 * Get or create Discovery subscription for a business
 */
export async function getDiscoverySubscription(businessId: string) {
  let subscription = await prisma.discoverySubscription.findUnique({
    where: { businessId }
  });

  // Create if doesn't exist
  if (!subscription) {
    subscription = await prisma.discoverySubscription.create({
      data: {
        businessId,
        tier: DiscoveryTier.FREE,
        commission: 10.0
      }
    });
    log.info('Discovery subscription created', { businessId, tier: 'FREE' });
  }

  return subscription;
}

/**
 * Check Discovery Marketplace access level
 */
export async function checkDiscoveryAccess(businessId: string): Promise<DiscoveryAccess> {
  const subscription = await getDiscoverySubscription(businessId);
  
  // Check if business plan includes Discovery Featured
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      plan: {
        select: {
          discoveryFeatured: true
        }
      }
    }
  });

  // Upgrade tier if plan includes it
  let effectiveTier = subscription.tier as DiscoveryTier;
  if (business?.plan?.discoveryFeatured && effectiveTier === DiscoveryTier.FREE) {
    effectiveTier = DiscoveryTier.FEATURED;
  }

  // Commission rates by tier
  const commissionRates = {
    [DiscoveryTier.FREE]: 10.0,
    [DiscoveryTier.FEATURED]: 7.0,
    [DiscoveryTier.PREMIUM]: 5.0
  };

  // Ranking boost multipliers
  const rankingBoosts = {
    [DiscoveryTier.FREE]: 1.0,
    [DiscoveryTier.FEATURED]: 2.5,
    [DiscoveryTier.PREMIUM]: 5.0
  };

  // Badges
  const badges: string[] = [];
  if (effectiveTier === DiscoveryTier.FEATURED) badges.push('featured');
  if (effectiveTier === DiscoveryTier.PREMIUM) badges.push('premium_partner');

  return {
    tier: effectiveTier,
    commission: commissionRates[effectiveTier],
    rankingBoost: rankingBoosts[effectiveTier],
    badges,
    features: {
      basicListing: true, // All tiers
      enhancedProfile: effectiveTier !== DiscoveryTier.FREE,
      priorityPlacement: effectiveTier !== DiscoveryTier.FREE,
      homepageCarousel: effectiveTier === DiscoveryTier.PREMIUM,
      sponsoredVisibility: effectiveTier === DiscoveryTier.PREMIUM,
      performanceReports: effectiveTier === DiscoveryTier.PREMIUM,
      accountManager: effectiveTier === DiscoveryTier.PREMIUM
    }
  };
}

/**
 * Generic upgrade to any tier (used by payment webhooks)
 */
export async function upgradeDiscoveryTier(businessId: string, tier: string): Promise<void> {
  const tierEnum = tier as DiscoveryTier;
  const commissionRates = {
    [DiscoveryTier.FREE]: 10.0,
    [DiscoveryTier.FEATURED]: 7.0,
    [DiscoveryTier.PREMIUM]: 5.0
  };

  await prisma.discoverySubscription.update({
    where: { businessId },
    data: {
      tier: tierEnum,
      commission: commissionRates[tierEnum]
    }
  });

  log.info('Discovery tier upgraded', { businessId, tier: tierEnum });
}

/**
 * Upgrade to Featured tier
 */
export async function upgradeToFeatured(businessId: string): Promise<void> {
  await upgradeDiscoveryTier(businessId, DiscoveryTier.FEATURED);
}

/**
 * Upgrade to Premium tier
 */
export async function upgradeToPremium(businessId: string): Promise<void> {
  await upgradeDiscoveryTier(businessId, DiscoveryTier.PREMIUM);
}

/**
 * Downgrade to Free tier
 */
export async function downgradeToFree(businessId: string): Promise<void> {
  await prisma.discoverySubscription.update({
    where: { businessId },
    data: {
      tier: DiscoveryTier.FREE,
      commission: 10.0,
      boostedUntil: null
    }
  });

  log.info('Discovery downgraded to FREE', { businessId });
}

/**
 * Apply temporary boost (e.g., promotional period)
 */
export async function applyTemporaryBoost(
  businessId: string,
  durationDays: number
): Promise<void> {
  const boostedUntil = new Date();
  boostedUntil.setDate(boostedUntil.getDate() + durationDays);

  await prisma.discoverySubscription.update({
    where: { businessId },
    data: { boostedUntil }
  });

  log.info('Temporary boost applied', { businessId, boostedUntil });
}

/**
 * Get ranking score for search results
 * Higher score = better placement
 */
export async function getDiscoveryRankingScore(
  businessId: string,
  baseScore: number // Base score from reviews, ratings, etc.
): Promise<number> {
  const access = await checkDiscoveryAccess(businessId);
  const subscription = await getDiscoverySubscription(businessId);

  let finalScore = baseScore * access.rankingBoost;

  // Additional boost if temporary boost is active
  if (subscription.boostedUntil && subscription.boostedUntil > new Date()) {
    finalScore *= 1.5;
  }

  return finalScore;
}

/**
 * Get featured businesses for homepage
 * Returns businesses sorted by tier and score
 */
export async function getFeaturedBusinesses(limit: number = 10) {
  const businesses = await prisma.business.findMany({
    where: {
      isActive: true,
      businessProfile: {
        isNot: null
      }
    },
    include: {
      discoverySubscription: true,
      businessProfile: {
        include: {
          businessReviews: {
            select: {
              rating: true
            }
          }
        }
      }
    },
    take: 100 // Get more than needed for filtering
  });

  // Calculate scores and filter
  const scored = await Promise.all(
    businesses
      .filter(b => b.businessProfile)
      .map(async (business) => {
        const avgRating = business.businessProfile!.businessReviews.length > 0
          ? business.businessProfile!.businessReviews.reduce((sum, r) => sum + r.rating, 0) / 
            business.businessProfile!.businessReviews.length
          : 0;

        const baseScore = avgRating * 20; // Convert 5-star to 100-point scale
        const rankingScore = await getDiscoveryRankingScore(business.id, baseScore);

        return {
          ...business,
          rankingScore
        };
      })
  );

  // Sort by score and return top results
  return scored
    .sort((a, b) => b.rankingScore - a.rankingScore)
    .slice(0, limit);
}

/**
 * Get Premium Partner businesses for carousel
 */
export async function getPremiumPartners(limit: number = 6) {
  const premiumBusinesses = await prisma.business.findMany({
    where: {
      isActive: true,
      discoverySubscription: {
        tier: DiscoveryTier.PREMIUM
      },
      businessProfile: {
        isNot: null
      }
    },
    include: {
      businessProfile: true,
      discoverySubscription: true
    },
    take: limit
  });

  return premiumBusinesses;
}

/**
 * Calculate commission savings for Featured/Premium tiers
 * Used for ROI messaging
 */
export function calculateCommissionSavings(
  tier: DiscoveryTier,
  monthlyGMV: number
): {
  freeCommission: number;
  tierCommission: number;
  savings: number;
  savingsPercent: number;
} {
  const freeRate = 10.0;
  const tierRates = {
    [DiscoveryTier.FREE]: 10.0,
    [DiscoveryTier.FEATURED]: 7.0,
    [DiscoveryTier.PREMIUM]: 5.0
  };

  const tierRate = tierRates[tier];
  const freeCommission = (monthlyGMV * freeRate) / 100;
  const tierCommission = (monthlyGMV * tierRate) / 100;
  const savings = freeCommission - tierCommission;
  const savingsPercent = ((savings / freeCommission) * 100);

  return {
    freeCommission,
    tierCommission,
    savings,
    savingsPercent
  };
}

/**
 * Get Discovery usage stats
 */
export async function getDiscoveryStats(businessId: string) {
  const subscription = await getDiscoverySubscription(businessId);
  const access = await checkDiscoveryAccess(businessId);

  // Get monthly order count and GMV from marketplace
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const monthlyOrders = await prisma.marketplaceOrder.count({
    where: {
      businessId,
      createdAt: {
        gte: startOfMonth
      }
    }
  });

  const monthlyGMV = await prisma.marketplaceOrder.aggregate({
    where: {
      businessId,
      createdAt: {
        gte: startOfMonth
      }
    },
    _sum: {
      totalAmountCents: true
    }
  });

  const gmv = monthlyGMV._sum.totalAmountCents || 0;
  const savings = calculateCommissionSavings(access.tier, gmv / 100);

  return {
    tier: access.tier,
    commission: access.commission,
    rankingBoost: access.rankingBoost,
    badges: access.badges,
    boostedUntil: subscription.boostedUntil,
    monthlyOrders,
    monthlyGMV: gmv,
    commissionSavings: access.tier !== DiscoveryTier.FREE ? savings.savings : 0,
    features: access.features
  };
}
