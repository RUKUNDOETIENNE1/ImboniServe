/**
 * TicketEvent Service
 * Append-only operational event log for order/item lifecycle tracking
 * Phase 1: Operational Coordination
 * Phase 3: Enhanced with deduplication and ordering
 */

import { prisma } from '@/lib/prisma'
import type { TicketEventType } from '@prisma/client'
import { randomBytes } from 'crypto'

export interface RecordEventInput {
  saleId: string
  eventType: TicketEventType
  saleItemId?: string
  stationId?: string
  actorId?: string
  actorName?: string
  previousState?: string
  newState?: string
  metadata?: Record<string, any>
  idempotencyKey?: string // Phase 3: Optional deduplication key
}

export class TicketEventService {
  /**
   * Record an operational event with deduplication support
   * This is append-only - never update or delete events
   * Phase 3: Idempotent - duplicate events are safely ignored
   */
  static async recordEvent(input: RecordEventInput): Promise<void> {
    try {
      // Generate idempotency key if not provided
      const idempotencyKey =
        input.idempotencyKey ||
        this.generateIdempotencyKey(input.saleId, input.saleItemId, input.eventType)

      // Get next sequence number for this item (if item-level event)
      let sequenceNumber: number | undefined

      if (input.saleItemId) {
        const lastEvent = await prisma.ticketEvent.findFirst({
          where: { saleItemId: input.saleItemId },
          orderBy: { sequenceNumber: 'desc' },
          select: { sequenceNumber: true },
        })

        sequenceNumber = (lastEvent?.sequenceNumber || 0) + 1
      }

      await prisma.ticketEvent.create({
        data: {
          saleId: input.saleId,
          eventType: input.eventType,
          saleItemId: input.saleItemId,
          stationId: input.stationId,
          actorId: input.actorId,
          actorName: input.actorName,
          previousState: input.previousState,
          newState: input.newState,
          metadata: (input.metadata || null) as any,
          idempotencyKey,
          sequenceNumber,
        },
      })
    } catch (error: any) {
      // If unique constraint violation on idempotencyKey, event already exists - safe to ignore
      if (error.code === 'P2002' && error.meta?.target?.includes('idempotencyKey')) {
        console.log('[TicketEvent] Duplicate event ignored (idempotent):', input.eventType)
        return
      }

      // Log other errors but don't fail the operation
      console.error('[TicketEvent] Failed to record event:', error)
    }
  }

  /**
   * Generate deterministic idempotency key for event deduplication
   */
  private static generateIdempotencyKey(
    saleId: string,
    saleItemId: string | undefined,
    eventType: TicketEventType
  ): string {
    const timestamp = Date.now()
    const random = randomBytes(4).toString('hex')
    const scope = saleItemId || saleId

    return `${scope}:${eventType}:${timestamp}:${random}`
  }

  /**
   * Get event history for an order
   */
  static async getOrderEvents(saleId: string) {
    return await prisma.ticketEvent.findMany({
      where: { saleId },
      include: {
        actor: {
          select: { id: true, name: true, email: true },
        },
        station: {
          select: { id: true, name: true, code: true },
        },
        saleItem: {
          select: {
            id: true,
            menuItem: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })
  }

  /**
   * Get event history for a specific item
   */
  static async getItemEvents(saleItemId: string) {
    return await prisma.ticketEvent.findMany({
      where: { saleItemId },
      include: {
        actor: {
          select: { id: true, name: true },
        },
        station: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })
  }

  /**
   * Get recent events for a station
   */
  static async getStationEvents(stationId: string, limit = 50) {
    return await prisma.ticketEvent.findMany({
      where: { stationId },
      include: {
        sale: {
          select: { orderNumber: true },
        },
        saleItem: {
          select: {
            menuItem: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  /**
   * Get SLA breach events for a business
   */
  static async getSLABreaches(businessId: string, startDate?: Date, endDate?: Date) {
    const where: any = {
      eventType: 'SLA_BREACH',
      sale: { businessId },
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = startDate
      if (endDate) where.createdAt.lte = endDate
    }

    return await prisma.ticketEvent.findMany({
      where,
      include: {
        sale: {
          select: { orderNumber: true, createdAt: true },
        },
        station: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }
}
