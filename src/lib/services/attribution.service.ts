/**
 * AttributionService — persists canonical acquisition attribution.
 *
 * One AcquisitionAttribution row per business (unique businessId).
 * Records the source channel, resolved code, UTM metadata, and trial override.
 * Append-only: once confirmed, the attribution is immutable.
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { PartnershipEventService } from './partnership-event.service'
import type { AttributionResult } from './attribution-resolver.service'

const log = logger.child({ service: 'attribution-service' })

// Prisma generates the enum as AttributionSourceType
import { AttributionSourceType, AttributionStatus } from '@prisma/client'

/**
 * Map AttributionResolver source strings to Prisma AttributionSourceType enum values.
 */
const SOURCE_TYPE_MAP: Record<string, AttributionSourceType> = {
  FOUNDER_CODE: AttributionSourceType.FOUNDER_CODE,
  PARTNERSHIP_CODE: AttributionSourceType.PARTNERSHIP_CODE,
  AFFILIATE: AttributionSourceType.AFFILIATE,
  PROFESSIONAL_MARKETER: AttributionSourceType.PROFESSIONAL_MARKETER,
  REFERRAL_LINK: AttributionSourceType.REFERRAL_LINK,
  CUSTOMER_REFERRAL: AttributionSourceType.CUSTOMER_REFERRAL,
  BUSINESS_INVITE: AttributionSourceType.BUSINESS_INVITE,
}

export class AttributionService {
  /**
   * Persist attribution for a newly created business.
   * Idempotent: if an attribution row already exists for this business, return it.
   */
  static async recordAttribution(params: {
    businessId: string
    attribution: AttributionResult | null
    ipAddress?: string
    userAgent?: string
    utmSource?: string
    utmCampaign?: string
    utmMedium?: string
  }) {
    const { businessId, attribution } = params

    // Check if business already has an attribution row
    const existing = await prisma.acquisitionAttribution.findUnique({
      where: { businessId },
    })
    if (existing) {
      log.warn('Business already has attribution', { businessId, existingId: existing.id })
      return existing
    }

    // If no attribution resolved, record a DIRECT_ORGANIC entry
    const sourceType = attribution
      ? SOURCE_TYPE_MAP[attribution.source] ?? AttributionSourceType.OTHER
      : AttributionSourceType.DIRECT_ORGANIC

    const row = await prisma.acquisitionAttribution.create({
      data: {
        businessId,
        sourceType,
        sourceId: attribution?.entityId ?? null,
        sourceCode: attribution?.code ?? null,
        status: AttributionStatus.CONFIRMED,
        resolvedAt: new Date(),
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        utmSource: params.utmSource ?? null,
        utmCampaign: params.utmCampaign ?? null,
        utmMedium: params.utmMedium ?? null,
        trialDaysOverride: attribution?.trialDaysOverride ?? null,
      },
    })

    // Emit partnership event
    await PartnershipEventService.emit({
      type: 'ATTRIBUTION_RECORDED',
      entityType: 'attribution',
      entityId: row.id,
      payload: {
        businessId,
        sourceType: row.sourceType,
        sourceCode: row.sourceCode,
        sourceId: row.sourceId,
      },
    })

    log.info('Attribution recorded', {
      attributionId: row.id,
      businessId,
      sourceType: row.sourceType,
    })

    return row
  }

  /**
   * Get the canonical attribution for a business.
   */
  static async getAttributionForBusiness(businessId: string) {
    return prisma.acquisitionAttribution.findUnique({
      where: { businessId },
    })
  }

  /**
   * Get all businesses attributed to a specific source entity.
   */
  static async getAttributionsBySource(
    sourceType: AttributionSourceType,
    sourceId?: string,
  ) {
    return prisma.acquisitionAttribution.findMany({
      where: {
        sourceType,
        ...(sourceId && { sourceId }),
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Get attribution stats grouped by source type.
   */
  static async getAttributionStats() {
    const all = await prisma.acquisitionAttribution.groupBy({
      by: ['sourceType'],
      _count: { _all: true },
    })
    return all
  }
}
