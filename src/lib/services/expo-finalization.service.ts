/**
 * Expo Finalization Service
 * Truth confirmation point for multi-station orders
 * Reality Gap Fix: Priority 3
 * 
 * BEHAVIOR:
 * - Expo does NOT modify data
 * - Expo only CONFIRMS final state
 * - Used only in multi-station orders
 * - Prevents conflicting "ready" states across stations
 */

import { prisma } from '@/lib/prisma'
import type { ExpoStatus } from '@prisma/client'

export interface ExpoCheckResult {
  orderId: string
  allStationsReady: boolean
  readyStations: string[]
  pendingStations: string[]
  canMoveToExpo: boolean
  itemsReady: number
  itemsTotal: number
}

export class ExpoFinalizationService {
  /**
   * Check if order is ready for expo
   */
  static async checkExpoReadiness(saleId: string): Promise<ExpoCheckResult> {
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        items: {
          where: {
            mutationType: {
              notIn: ['REPLACED', 'CANCELLED'],
            },
          },
          include: {
            menuItem: true,
          },
        },
      },
    })

    if (!sale) {
      throw new Error('Sale not found')
    }

    const activeItems = sale.items
    const readyItems = activeItems.filter((item) => item.itemStatus === 'READY')
    const stations = new Set(activeItems.map((item) => item.stationId).filter(Boolean))

    const stationReadiness = new Map<string, boolean>()

    for (const stationId of stations) {
      const stationItems = activeItems.filter((item) => item.stationId === stationId)
      const stationReady = stationItems.every((item) => item.itemStatus === 'READY')
      stationReadiness.set(stationId, stationReady)
    }

    const readyStations = Array.from(stationReadiness.entries())
      .filter(([_, ready]) => ready)
      .map(([stationId]) => stationId)

    const pendingStations = Array.from(stationReadiness.entries())
      .filter(([_, ready]) => !ready)
      .map(([stationId]) => stationId)

    const allStationsReady = pendingStations.length === 0

    return {
      orderId: saleId,
      allStationsReady,
      readyStations,
      pendingStations,
      canMoveToExpo: allStationsReady && activeItems.length > 0,
      itemsReady: readyItems.length,
      itemsTotal: activeItems.length,
    }
  }

  /**
   * Mark order as ready for expo (all stations done)
   */
  static async markReadyForExpo(saleId: string, actorId?: string): Promise<void> {
    const readiness = await this.checkExpoReadiness(saleId)

    if (!readiness.canMoveToExpo) {
      throw new Error(
        `Order not ready for expo. Pending stations: ${readiness.pendingStations.join(', ')}`
      )
    }

    await prisma.sale.update({
      where: { id: saleId },
      data: {
        expoStatus: 'READY_FOR_EXPO',
        readyForExpoAt: new Date(),
      },
    })
  }

  /**
   * Expo confirms final state (visual check, plating, etc.)
   */
  static async expoConfirm(saleId: string, actorId?: string): Promise<void> {
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      select: { expoStatus: true },
    })

    if (!sale) {
      throw new Error('Sale not found')
    }

    if (sale.expoStatus !== 'READY_FOR_EXPO') {
      throw new Error('Order must be ready for expo before confirmation')
    }

    await prisma.sale.update({
      where: { id: saleId },
      data: {
        expoStatus: 'EXPO_CONFIRMED',
        expoConfirmedAt: new Date(),
      },
    })
  }

  /**
   * Confirm order served to customer
   */
  static async confirmServed(saleId: string, actorId?: string): Promise<void> {
    await prisma.sale.update({
      where: { id: saleId },
      data: {
        expoStatus: 'SERVED_CONFIRMED',
        servedConfirmedAt: new Date(),
        servedAt: new Date(), // Update legacy field too
      },
    })
  }

  /**
   * Get expo queue (orders ready for expo confirmation)
   */
  static async getExpoQueue(businessId: string): Promise<any[]> {
    const orders = await prisma.sale.findMany({
      where: {
        businessId,
        expoStatus: 'READY_FOR_EXPO',
      },
      include: {
        items: {
          where: {
            mutationType: {
              notIn: ['REPLACED', 'CANCELLED'],
            },
          },
          include: {
            menuItem: true,
          },
        },
        table: {
          select: { number: true },
        },
        participant: {
          select: { name: true },
        },
      },
      orderBy: {
        readyForExpoAt: 'asc',
      },
    })

    return orders
  }

  /**
   * Auto-advance to expo if all stations ready
   */
  static async autoAdvanceToExpo(saleId: string): Promise<boolean> {
    const readiness = await this.checkExpoReadiness(saleId)

    if (readiness.canMoveToExpo) {
      const sale = await prisma.sale.findUnique({
        where: { id: saleId },
        select: { expoStatus: true },
      })

      // Only auto-advance if still pending
      if (sale && sale.expoStatus === 'PENDING') {
        await this.markReadyForExpo(saleId)
        return true
      }
    }

    return false
  }

  /**
   * Get expo status summary for order
   */
  static async getExpoStatusSummary(saleId: string): Promise<{
    expoStatus: ExpoStatus | null
    readyForExpoAt: Date | null
    expoConfirmedAt: Date | null
    servedConfirmedAt: Date | null
    readiness: ExpoCheckResult
  }> {
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      select: {
        expoStatus: true,
        readyForExpoAt: true,
        expoConfirmedAt: true,
        servedConfirmedAt: true,
      },
    })

    if (!sale) {
      throw new Error('Sale not found')
    }

    const readiness = await this.checkExpoReadiness(saleId)

    return {
      expoStatus: sale.expoStatus,
      readyForExpoAt: sale.readyForExpoAt,
      expoConfirmedAt: sale.expoConfirmedAt,
      servedConfirmedAt: sale.servedConfirmedAt,
      readiness,
    }
  }
}
