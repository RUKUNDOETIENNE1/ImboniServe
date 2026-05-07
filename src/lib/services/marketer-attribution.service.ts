/**
 * Marketer Attribution Service
 * Handles business-to-marketer attribution
 * IMMUTABLE: Once attributed, cannot be changed
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { RevenueEventService } from './revenue-event.service';

const log = logger.child({ service: 'marketer-attribution' });

export class MarketerAttributionService {
  /**
   * Record attribution when business signs up via marketer link
   * IMMUTABLE: Can only be called once per business
   */
  static async recordAttribution(params: {
    marketerId: string;
    businessId: string;
    ipAddress?: string;
    deviceId?: string;
    utmSource?: string;
    utmCampaign?: string;
    utmMedium?: string;
    utmContent?: string;
  }) {
    // Check if business is already attributed
    const existing = await prisma.marketerAttribution.findUnique({
      where: { businessId: params.businessId }
    });

    if (existing) {
      log.warn('Business already attributed', {
        businessId: params.businessId,
        existingMarketerId: existing.marketerId,
        attemptedMarketerId: params.marketerId
      });
      return existing;
    }

    // Create attribution
    const attribution = await prisma.marketerAttribution.create({
      data: {
        marketerId: params.marketerId,
        businessId: params.businessId,
        ipAddress: params.ipAddress,
        deviceId: params.deviceId,
        utmSource: params.utmSource,
        utmCampaign: params.utmCampaign,
        utmMedium: params.utmMedium,
        utmContent: params.utmContent
      }
    });

    // Emit event
    await RevenueEventService.emit({
      type: 'ATTRIBUTION_RECORDED',
      entityType: 'attribution',
      entityId: attribution.id,
      payload: {
        marketerId: params.marketerId,
        businessId: params.businessId,
        utmSource: params.utmSource,
        utmCampaign: params.utmCampaign
      }
    });

    log.info('Attribution recorded', {
      attributionId: attribution.id,
      marketerId: params.marketerId,
      businessId: params.businessId
    });

    return attribution;
  }

  /**
   * Get attribution for a business
   */
  static async getAttributionForBusiness(businessId: string) {
    return prisma.marketerAttribution.findUnique({
      where: { businessId },
      include: {
        marketer: {
          include: {
            wallet: true
          }
        }
      }
    });
  }

  /**
   * Get all businesses attributed to a marketer
   */
  static async getAttributedBusinesses(marketerId: string) {
    return prisma.marketerAttribution.findMany({
      where: { marketerId },
      orderBy: { attributedAt: 'desc' }
    });
  }

  /**
   * Check if business is attributed to any marketer
   */
  static async isBusinessAttributed(businessId: string): Promise<boolean> {
    const attribution = await prisma.marketerAttribution.findUnique({
      where: { businessId }
    });
    return !!attribution;
  }

  /**
   * Get attribution stats for a marketer
   */
  static async getAttributionStats(marketerId: string) {
    const attributions = await prisma.marketerAttribution.findMany({
      where: { marketerId }
    });

    // Group by UTM source
    const bySource = attributions.reduce((acc, attr) => {
      const source = attr.utmSource || 'direct';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by UTM campaign
    const byCampaign = attributions.reduce((acc, attr) => {
      const campaign = attr.utmCampaign || 'none';
      acc[campaign] = (acc[campaign] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: attributions.length,
      bySource,
      byCampaign,
      recent: attributions.slice(0, 10)
    };
  }
}
