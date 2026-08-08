/**
 * Partnership Event Service
 * Append-only event log for the entire Partnership & Acquisition domain.
 * All partner lifecycle, code, attribution, commission, campaign, and payout
 * actions emit events through this service.
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { PartnershipEventType } from '@prisma/client'

const log = logger.child({ service: 'partnership-event' })

export class PartnershipEventService {
  static async emit(params: {
    type: PartnershipEventType
    entityType: string
    entityId: string
    payload?: Record<string, unknown>
    triggeredBy?: string
    ipAddress?: string
  }): Promise<void> {
    try {
      await prisma.partnershipEvent.create({
        data: {
          type: params.type,
          entityType: params.entityType,
          entityId: params.entityId,
          payload: (params.payload as any) ?? undefined,
          triggeredBy: params.triggeredBy,
          ipAddress: params.ipAddress,
        },
      })

      log.info('Partnership event emitted', {
        type: params.type,
        entityType: params.entityType,
        entityId: params.entityId,
      })
    } catch (error) {
      log.error('Failed to emit partnership event', {
        error,
        type: params.type,
        entityId: params.entityId,
      })
    }
  }

  static async getEventsForEntity(
    entityType: string,
    entityId: string,
    limit: number = 50,
  ) {
    return prisma.partnershipEvent.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  static async getRecentEvents(limit: number = 100) {
    return prisma.partnershipEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  static async getEventsByType(
    type: PartnershipEventType,
    limit: number = 50,
  ) {
    return prisma.partnershipEvent.findMany({
      where: { type },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  static async getEventsInRange(
    startDate: Date,
    endDate: Date,
    type?: PartnershipEventType,
  ) {
    return prisma.partnershipEvent.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        ...(type && { type }),
      },
      orderBy: { createdAt: 'desc' },
    })
  }
}
