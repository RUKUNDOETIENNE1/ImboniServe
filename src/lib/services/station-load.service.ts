/**
 * Station Load Service
 * Calculates station load index for visual signals only
 * Reality Gap Fix: Priority 5
 * 
 * RULE: DO NOT change routing or logic based on this
 * UI USE ONLY: color intensity, urgency hints
 */

import { prisma } from '@/lib/prisma'

export interface StationLoad {
  stationId: string
  loadIndex: number // 0-100
  queueLength: number
  averageProcessingTimeMs: number
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical'
  colorIntensity: number // 0-1 for UI
}

export class StationLoadService {
  /**
   * Calculate station load index
   */
  static async calculateStationLoad(stationId: string): Promise<StationLoad> {
    // Get active items for this station
    const activeItems = await prisma.saleItem.findMany({
      where: {
        stationId,
        itemStatus: {
          in: ['NEW', 'PREPARING'],
        },
        mutationType: {
          notIn: ['REPLACED', 'CANCELLED'],
        },
      },
      select: {
        id: true,
        itemStatus: true,
        routedAt: true,
        prepStartedAt: true,
        createdAt: true,
      },
    })

    const queueLength = activeItems.length

    // Calculate average processing time from recent completed items
    const recentCompleted = await prisma.saleItem.findMany({
      where: {
        stationId,
        itemStatus: 'READY',
        readyAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        },
      },
      select: {
        routedAt: true,
        readyAt: true,
      },
      take: 20,
    })

    let averageProcessingTimeMs = 0

    if (recentCompleted.length > 0) {
      const processingTimes = recentCompleted
        .filter((item) => item.routedAt && item.readyAt)
        .map((item) => item.readyAt!.getTime() - item.routedAt!.getTime())

      if (processingTimes.length > 0) {
        averageProcessingTimeMs =
          processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
      }
    }

    // Calculate load index (0-100)
    // Factors:
    // - Queue length (0-10 items = 0-50 points)
    // - Processing time vs baseline (50 points max)

    const queueScore = Math.min(50, (queueLength / 10) * 50)

    const baselineProcessingTime = 5 * 60 * 1000 // 5 minutes baseline
    const processingScore =
      averageProcessingTimeMs > 0
        ? Math.min(50, (averageProcessingTimeMs / baselineProcessingTime) * 50)
        : 0

    const loadIndex = Math.min(100, queueScore + processingScore)

    // Determine urgency level
    let urgencyLevel: 'low' | 'medium' | 'high' | 'critical'
    if (loadIndex < 25) urgencyLevel = 'low'
    else if (loadIndex < 50) urgencyLevel = 'medium'
    else if (loadIndex < 75) urgencyLevel = 'high'
    else urgencyLevel = 'critical'

    // Color intensity for UI (0-1)
    const colorIntensity = loadIndex / 100

    return {
      stationId,
      loadIndex,
      queueLength,
      averageProcessingTimeMs,
      urgencyLevel,
      colorIntensity,
    }
  }

  /**
   * Get load for all active stations
   */
  static async getAllStationLoads(businessId: string): Promise<StationLoad[]> {
    const stations = await prisma.station.findMany({
      where: {
        businessId,
        isActive: true,
      },
      select: {
        id: true,
      },
    })

    const loads = await Promise.all(
      stations.map((station) => this.calculateStationLoad(station.id))
    )

    return loads
  }

  /**
   * Get visual indicator for station load
   */
  static getLoadIndicator(load: StationLoad): {
    color: string
    bgColor: string
    label: string
    icon: string
  } {
    switch (load.urgencyLevel) {
      case 'low':
        return {
          color: 'text-green-700',
          bgColor: 'bg-green-100',
          label: 'Light',
          icon: '🟢',
        }

      case 'medium':
        return {
          color: 'text-blue-700',
          bgColor: 'bg-blue-100',
          label: 'Moderate',
          icon: '🔵',
        }

      case 'high':
        return {
          color: 'text-orange-700',
          bgColor: 'bg-orange-100',
          label: 'Busy',
          icon: '🟠',
        }

      case 'critical':
        return {
          color: 'text-red-700',
          bgColor: 'bg-red-100',
          label: 'Overloaded',
          icon: '🔴',
        }

      default:
        return {
          color: 'text-slate-700',
          bgColor: 'bg-slate-100',
          label: 'Unknown',
          icon: '⚪',
        }
    }
  }

  /**
   * Get urgency hint text
   */
  static getUrgencyHint(load: StationLoad): string {
    switch (load.urgencyLevel) {
      case 'low':
        return 'Station running smoothly'

      case 'medium':
        return 'Normal workload'

      case 'high':
        return 'Station is busy - expect delays'

      case 'critical':
        return 'Station overloaded - significant delays likely'

      default:
        return ''
    }
  }

  /**
   * Calculate estimated wait time for new item
   */
  static estimateWaitTime(load: StationLoad): number {
    // Simple estimate: queue length × average processing time
    if (load.averageProcessingTimeMs === 0) {
      // No historical data, use baseline
      return load.queueLength * 5 * 60 * 1000 // 5 min per item
    }

    return load.queueLength * load.averageProcessingTimeMs
  }

  /**
   * Format wait time for display
   */
  static formatWaitTime(ms: number): string {
    const minutes = Math.ceil(ms / 60000)

    if (minutes < 1) return '< 1 min'
    if (minutes === 1) return '1 min'
    if (minutes < 60) return `${minutes} mins`

    const hours = Math.floor(minutes / 60)
    const remainingMins = minutes % 60

    if (remainingMins === 0) return `${hours}h`
    return `${hours}h ${remainingMins}m`
  }
}
