import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export const FEATURE_FLAGS = {
  ADVANCED_ANALYTICS: 'advanced_analytics',
  MULTI_LANGUAGE: 'multi_language',
  MULTI_BRANCH: 'multi_branch',
  AI_MENU_BUILDER: 'ai_menu_builder',
  LOYALTY_SYSTEM: 'loyalty_system',
  DISCOVERY_MARKETPLACE: 'discovery_marketplace',
  PROMOTIONS_ENGINE: 'promotions_engine',
  HOTEL_MODE: 'hotel_mode',
  WHATSAPP_CLOUD_API: 'whatsapp_cloud_api',
  CONFIGURABLE_REPORTS: 'configurable_reports',
  // V1 Release Flags
  CRM_V1: 'crm_v1',
  AI_INSIGHTS_V1: 'ai_insights_v1',
  OPTIMIZATION_V1: 'optimization_v1',
  // Additive CMS/Feed features
  CMS_V1: 'cms_v1',
  CMS_SELF_APPROVE_V1: 'cms_self_approve_v1',
  FEED_V1: 'feed_v1',
  FEED_ENGAGEMENT_V1: 'feed_engagement_v1',
  FEED_RECOMMENDATIONS_V1: 'feed_recommendations_v1',
} as const

export type FeatureFlagKey = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS]

const INITIAL_FLAGS = [
  {
    key: FEATURE_FLAGS.ADVANCED_ANALYTICS,
    name: 'Advanced Analytics',
    description: 'Materialized view-based analytics with trend charts and export',
    enabled: false,
    autoEnableThreshold: 10,
    planGated: false,
    minimumPlan: null,
  },
  {
    key: FEATURE_FLAGS.MULTI_LANGUAGE,
    name: 'Multi-Language Menus',
    description: 'Per-item translations for EN, RW, FR, SW',
    enabled: false,
    autoEnableThreshold: 10,
    planGated: false,
    minimumPlan: null,
  },
  {
    key: FEATURE_FLAGS.MULTI_BRANCH,
    name: 'Multi-Branch Management',
    description: 'Manage multiple branches under one account',
    enabled: false,
    autoEnableThreshold: 15,
    planGated: true,
    minimumPlan: 'BUSINESS',
  },
  {
    key: FEATURE_FLAGS.AI_MENU_BUILDER,
    name: 'AI Smart Menu Builder',
    description: 'Upload menus and let AI extract items for your review',
    enabled: false,
    autoEnableThreshold: 20,
    planGated: false,
    minimumPlan: null,
  },
  {
    key: FEATURE_FLAGS.LOYALTY_SYSTEM,
    name: 'Customer Loyalty Program',
    description: 'Points ledger, earning rules, and redemption for customers',
    enabled: false,
    autoEnableThreshold: 20,
    planGated: true,
    minimumPlan: 'PROFESSIONAL',
  },
  {
    key: FEATURE_FLAGS.DISCOVERY_MARKETPLACE,
    name: 'Restaurant Discovery',
    description: 'Public business profiles and discovery marketplace',
    enabled: false,
    autoEnableThreshold: 20,
    planGated: false,
    minimumPlan: null,
  },
  {
    key: FEATURE_FLAGS.PROMOTIONS_ENGINE,
    name: 'Promotions & Happy Hours',
    description: 'Time-based promotions, discounts, and happy hour pricing',
    enabled: false,
    autoEnableThreshold: 25,
    planGated: true,
    minimumPlan: 'PROFESSIONAL',
  },
  {
    key: FEATURE_FLAGS.HOTEL_MODE,
    name: 'Hotel & Resort Mode',
    description: 'Room service orders, service areas, and bill-to-room',
    enabled: false,
    autoEnableThreshold: null,
    planGated: true,
    minimumPlan: 'BUSINESS',
  },
  {
    key: FEATURE_FLAGS.WHATSAPP_CLOUD_API,
    name: 'WhatsApp Cloud API',
    description: 'Meta Cloud API with templates, inbound messages, and audit logs',
    enabled: true,
    autoEnableThreshold: null,
    planGated: true,
    minimumPlan: 'ESSENTIALS',
  },
  {
    key: FEATURE_FLAGS.CONFIGURABLE_REPORTS,
    name: 'Configurable Daily Reports',
    description: 'Set your own timezone and time for daily WhatsApp summary',
    enabled: true,
    autoEnableThreshold: null,
    planGated: false,
    minimumPlan: null,
  },
  // V1 Release Flags
  {
    key: FEATURE_FLAGS.CRM_V1,
    name: 'Customer CRM',
    description: 'Customer relationship management with RFM segmentation',
    enabled: false,
    autoEnableThreshold: null,
    planGated: false,
    minimumPlan: null,
  },
  {
    key: FEATURE_FLAGS.AI_INSIGHTS_V1,
    name: 'AI Insights',
    description: 'AI-powered business insights and recommendations',
    enabled: false,
    autoEnableThreshold: null,
    planGated: false,
    minimumPlan: null,
  },
  {
    key: FEATURE_FLAGS.OPTIMIZATION_V1,
    name: 'Optimization Hub',
    description: 'AI-powered optimization recommendations',
    enabled: false,
    autoEnableThreshold: null,
    planGated: false,
    minimumPlan: null,
  },
  // CMS / Feed (additive features)
  {
    key: FEATURE_FLAGS.CMS_V1,
    name: 'CMS v1',
    description: 'Business content management: posts, scheduling, analytics',
    enabled: false,
    autoEnableThreshold: null,
    planGated: false,
    minimumPlan: null,
  },
  {
    key: FEATURE_FLAGS.CMS_SELF_APPROVE_V1,
    name: 'CMS Self-Approve v1',
    description: 'Allow BUSINESS_MANAGER to approve posts without admin review',
    enabled: false,
    autoEnableThreshold: null,
    planGated: false,
    minimumPlan: null,
  },
  {
    key: FEATURE_FLAGS.FEED_V1,
    name: 'Discovery Feed v1',
    description: 'Customer content feed at discover/feed (non-disruptive rollout)',
    enabled: false,
    autoEnableThreshold: null,
    planGated: false,
    minimumPlan: null,
  },
  {
    key: FEATURE_FLAGS.FEED_ENGAGEMENT_V1,
    name: 'Feed Engagement v1',
    description: 'Likes, shares, comments, saves on content feed',
    enabled: false,
    autoEnableThreshold: null,
    planGated: false,
    minimumPlan: null,
  },
  {
    key: FEATURE_FLAGS.FEED_RECOMMENDATIONS_V1,
    name: 'Feed Recommendations v1',
    description: 'Personalized ranking; Phase 1: location + popularity only',
    enabled: false,
    autoEnableThreshold: null,
    planGated: false,
    minimumPlan: null,
  },
]

export class FeatureFlagService {
  static async seedFlags(): Promise<void> {
    for (const flag of INITIAL_FLAGS) {
      await prisma.featureFlag.upsert({
        where: { key: flag.key },
        update: {
          name: flag.name,
          description: flag.description,
          autoEnableThreshold: flag.autoEnableThreshold,
          planGated: flag.planGated,
          minimumPlan: flag.minimumPlan,
        },
        create: flag,
      })
    }
    logger.info('Feature flags seeded', { count: INITIAL_FLAGS.length })
  }

  static async getActiveBusinessCount(): Promise<number> {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return prisma.business.count({
      where: {
        isActive: true,
        sales: {
          some: {
            createdAt: { gte: thirtyDaysAgo },
          },
        },
      },
    })
  }

  static async checkAndAutoEnableFlags(): Promise<void> {
    const activeCount = await this.getActiveBusinessCount()

    const flagsToCheck = await prisma.featureFlag.findMany({
      where: {
        enabled: false,
        autoEnableThreshold: { not: null },
      },
    })

    for (const flag of flagsToCheck) {
      if (flag.autoEnableThreshold !== null && activeCount >= flag.autoEnableThreshold) {
        await prisma.featureFlag.update({
          where: { id: flag.id },
          data: { enabled: true },
        })
        logger.info(`Feature flag auto-enabled: ${flag.key}`, {
          flagKey: flag.key,
          threshold: flag.autoEnableThreshold,
          activeBusinessCount: activeCount,
        })
      }
    }

    await prisma.platformMetrics.upsert({
      where: { date: new Date(new Date().toISOString().split('T')[0]) },
      update: { activeBusinessCount: activeCount },
      create: {
        date: new Date(new Date().toISOString().split('T')[0]),
        activeBusinessCount: activeCount,
        totalBusinessCount: await prisma.business.count({ where: { isActive: true } }),
      },
    })
  }

  static async isEnabled(flagKey: string, businessId?: string): Promise<boolean> {
    const flag = await prisma.featureFlag.findUnique({
      where: { key: flagKey },
      include: {
        businessOverrides: businessId
          ? { where: { businessId } }
          : false,
      },
    })

    if (!flag) return false

    if (businessId && flag.businessOverrides && flag.businessOverrides.length > 0) {
      return flag.businessOverrides[0].enabled
    }

    return flag.enabled
  }

  static async getEnabledFlags(businessId: string): Promise<string[]> {
    const flags = await prisma.featureFlag.findMany({
      include: {
        businessOverrides: { where: { businessId } },
      },
    })

    return flags
      .filter(flag => {
        if (flag.businessOverrides.length > 0) {
          return flag.businessOverrides[0].enabled
        }
        return flag.enabled
      })
      .map(f => f.key)
  }

  static async setBusinessOverride(
    businessId: string,
    flagKey: string,
    enabled: boolean
  ): Promise<void> {
    const flag = await prisma.featureFlag.findUnique({ where: { key: flagKey } })
    if (!flag) throw new Error(`Feature flag not found: ${flagKey}`)

    await prisma.businessFeatureOverride.upsert({
      where: { businessId_featureFlagId: { businessId, featureFlagId: flag.id } },
      update: { enabled },
      create: { businessId, featureFlagId: flag.id, enabled },
    })
  }

  static async getAllFlags() {
    return prisma.featureFlag.findMany({
      orderBy: { key: 'asc' },
      include: { _count: { select: { businessOverrides: true } } },
    })
  }
}
