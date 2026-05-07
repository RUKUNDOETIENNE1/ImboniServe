/**
 * Revenue Event Service
 * Append-only event log for Revenue Operations Layer
 * All financial actions emit events through this service
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { RevenueEventType } from '@prisma/client';

const log = logger.child({ service: 'revenue-event' });

export class RevenueEventService {
  /**
   * Emit a revenue event
   */
  static async emit(params: {
    type: RevenueEventType;
    entityType: string;
    entityId: string;
    payload: Record<string, any>;
    triggeredBy?: string;
    ipAddress?: string;
  }): Promise<void> {
    try {
      await prisma.revenueEvent.create({
        data: {
          type: params.type,
          entityType: params.entityType,
          entityId: params.entityId,
          payload: params.payload,
          triggeredBy: params.triggeredBy,
          ipAddress: params.ipAddress
        }
      });

      log.info('Revenue event emitted', {
        type: params.type,
        entityType: params.entityType,
        entityId: params.entityId
      });
    } catch (error) {
      // Event emission failures should not break core flows
      log.error('Failed to emit revenue event', {
        error,
        type: params.type,
        entityId: params.entityId
      });
    }
  }

  /**
   * Get events for an entity
   */
  static async getEventsForEntity(
    entityType: string,
    entityId: string,
    limit: number = 50
  ) {
    return prisma.revenueEvent.findMany({
      where: {
        entityType,
        entityId
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  /**
   * Get recent events (for admin dashboard)
   */
  static async getRecentEvents(limit: number = 100) {
    return prisma.revenueEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  /**
   * Get events by type
   */
  static async getEventsByType(
    type: RevenueEventType,
    limit: number = 50
  ) {
    return prisma.revenueEvent.findMany({
      where: { type },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  /**
   * Get events in time range
   */
  static async getEventsInRange(
    startDate: Date,
    endDate: Date,
    type?: RevenueEventType
  ) {
    return prisma.revenueEvent.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        ...(type && { type })
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
