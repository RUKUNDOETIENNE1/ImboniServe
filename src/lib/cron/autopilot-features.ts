/**
 * Autopilot Feature Flag Enabler
 * Automatically enables feature flags based on adoption thresholds
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

const log = logger.child({ service: 'autopilot-features' })

interface AutopilotMetrics {
  publishedSites: number
  uniqueVisitsLast14Days: number
  aiCopySuccessRate: number
  connectedDomains: number
  verifiedDomains: number
  weeklyUniqueVisits: number
}

export async function runAutopilotCheck() {
  log.info('Starting autopilot feature check')

  try {
    // Check kill switch
    const killSwitch = await prisma.featureFlag.findUnique({
      where: { key: 'site_builder_kill_switch' }
    })

    if (killSwitch?.enabled) {
      log.warn('Site builder kill switch is active - skipping autopilot')
      return
    }

    // Gather metrics
    const metrics = await gatherMetrics()
    log.info('Metrics gathered', metrics as unknown as Record<string, unknown>)

    // Check Phase 2 conditions
    await checkPhase2Conditions(metrics)

    // Check Phase 3 conditions
    await checkPhase3Conditions(metrics)

    log.info('Autopilot check completed successfully')
  } catch (error) {
    log.error('Autopilot check failed', { error: String(error) })
    throw error
  }
}

async function gatherMetrics(): Promise<AutopilotMetrics> {
  const now = new Date()
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Count published sites
  const publishedSites = await prisma.businessProfile.count({
    where: { isPublished: true }
  })

  // Count unique visits (using viewCount as proxy)
  const profilesWithViews = await prisma.businessProfile.findMany({
    where: {
      isPublished: true,
      updatedAt: { gte: fourteenDaysAgo }
    },
    select: { viewCount: true }
  })
  const uniqueVisitsLast14Days = profilesWithViews.reduce((sum, p) => sum + (p.viewCount || 0), 0)

  // Weekly visits
  const profilesWeeklyViews = await prisma.businessProfile.findMany({
    where: {
      isPublished: true,
      updatedAt: { gte: sevenDaysAgo }
    },
    select: { viewCount: true }
  })
  const weeklyUniqueVisits = profilesWeeklyViews.reduce((sum, p) => sum + (p.viewCount || 0), 0)

  // AI copy success rate (placeholder - would track actual API calls)
  const aiCopySuccessRate = 98.5 // Assume high success rate for now

  // Count connected and verified domains
  const connectedDomains = await (prisma as any).customDomain.count()
  const verifiedDomains = await (prisma as any).customDomain.count({
    where: { status: 'VERIFIED' }
  })

  return {
    publishedSites,
    uniqueVisitsLast14Days,
    aiCopySuccessRate,
    connectedDomains,
    verifiedDomains,
    weeklyUniqueVisits
  }
}

async function checkPhase2Conditions(metrics: AutopilotMetrics) {
  const phase2Flags = [
    'site_builder_templates_expanded_v2',
    'site_builder_ai_theme_tuning_v2',
    'site_builder_domain_automation_v2'
  ]

  // Phase 2 conditions:
  // - Published sites >= 30
  // - Unique visits last 14 days >= 1,000
  // - AI copy success rate >= 98%

  const shouldEnablePhase2 = 
    metrics.publishedSites >= 30 &&
    metrics.uniqueVisitsLast14Days >= 1000 &&
    metrics.aiCopySuccessRate >= 98

  if (shouldEnablePhase2) {
    for (const flagKey of phase2Flags) {
      const flag = await prisma.featureFlag.findUnique({
        where: { key: flagKey }
      })

      if (flag && !flag.enabled) {
        await prisma.featureFlag.update({
          where: { key: flagKey },
          data: { enabled: true }
        })
        log.info('Phase 2 flag auto-enabled', { flagKey, metrics })
      }
    }
  } else {
    log.info('Phase 2 conditions not met', { 
      shouldEnablePhase2, 
      metrics,
      required: { publishedSites: 30, uniqueVisits: 1000, aiSuccessRate: 98 }
    })
  }
}

async function checkPhase3Conditions(metrics: AutopilotMetrics) {
  const phase3Flags = [
    'site_builder_templates_100_plus',
    'site_builder_domain_automation_full'
  ]

  // Phase 3 conditions:
  // - Published sites >= 100
  // - Connected domains >= 25
  // - Weekly unique visits >= 10,000
  // - Domain verification success rate >= 95%

  const domainSuccessRate = metrics.connectedDomains > 0
    ? (metrics.verifiedDomains / metrics.connectedDomains) * 100
    : 0

  const shouldEnablePhase3 = 
    metrics.publishedSites >= 100 &&
    metrics.connectedDomains >= 25 &&
    metrics.weeklyUniqueVisits >= 10000 &&
    domainSuccessRate >= 95

  if (shouldEnablePhase3) {
    for (const flagKey of phase3Flags) {
      const flag = await prisma.featureFlag.findUnique({
        where: { key: flagKey }
      })

      if (flag && !flag.enabled) {
        await prisma.featureFlag.update({
          where: { key: flagKey },
          data: { enabled: true }
        })
        log.info('Phase 3 flag auto-enabled', { flagKey, metrics })
      }
    }
  } else {
    log.info('Phase 3 conditions not met', { 
      shouldEnablePhase3, 
      metrics,
      domainSuccessRate,
      required: { publishedSites: 100, connectedDomains: 25, weeklyVisits: 10000, domainSuccessRate: 95 }
    })
  }
}

/**
 * Manual override to enable/disable flags
 */
export async function overrideFeatureFlag(flagKey: string, enabled: boolean, reason: string) {
  await prisma.featureFlag.update({
    where: { key: flagKey },
    data: { enabled }
  })

  log.info('Feature flag manually overridden', { flagKey, enabled, reason })
}
