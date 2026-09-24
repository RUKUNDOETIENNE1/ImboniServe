/**
 * Hospitality Intelligence Engine (HIE) - Kitchen Analysis Module
 * 
 * Analyzes kitchen performance, station efficiency, and queue dynamics.
 */

import type {
  KitchenAnalysis,
  StationMetric,
  PeakLoad,
  QueueAnalysis,
  RecoveryEvent,
  OperationalEvent,
  TimeRange,
} from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Kitchen Analyzer
// ─────────────────────────────────────────────────────────────────────────────

export class KitchenAnalyzer {
  async analyze(events: OperationalEvent[], timeRange: TimeRange): Promise<KitchenAnalysis> {
    const stationData = this.aggregateStationData(events)
    const stationMetrics = this.calculateStationMetrics(stationData, timeRange)
    const overallUtilization = this.calculateOverallUtilization(stationMetrics)
    const peakLoad = this.findPeakLoad(events)
    const queueAnalysis = this.analyzeQueue(events)
    const recoveryEvents = this.detectRecoveryEvents(events)

    const summary = this.generateSummary(stationMetrics, overallUtilization, peakLoad)

    return {
      summary,
      overallUtilization,
      stationMetrics,
      peakLoad,
      queueAnalysis,
      recoveryEvents,
    }
  }

  private aggregateStationData(events: OperationalEvent[]): Map<string, StationData> {
    const stationMap = new Map<string, StationData>()

    for (const event of events) {
      if (!event.stationId || !event.stationName) continue

      const data = stationMap.get(event.stationId) || {
        stationId: event.stationId,
        stationName: event.stationName,
        events: [],
        itemsProcessed: 0,
        prepTimes: [],
        queueSizes: [],
      }

      data.events.push(event)

      if (event.type.includes('completed') || event.type.includes('ready')) {
        data.itemsProcessed++
      }

      if (event.data?.prepTimeSeconds) {
        data.prepTimes.push(event.data.prepTimeSeconds as number)
      }

      if (event.data?.queueSize !== undefined) {
        data.queueSizes.push(event.data.queueSize as number)
      }

      stationMap.set(event.stationId, data)
    }

    return stationMap
  }

  private calculateStationMetrics(stationData: Map<string, StationData>, timeRange: TimeRange): StationMetric[] {
    const metrics: StationMetric[] = []
    const totalDuration = (new Date(timeRange.end).getTime() - new Date(timeRange.start).getTime()) / 1000

    for (const data of stationData.values()) {
      const avgPrepTime = data.prepTimes.length > 0
        ? data.prepTimes.reduce((a, b) => a + b, 0) / data.prepTimes.length
        : 0

      const peakQueueSize = data.queueSizes.length > 0 ? Math.max(...data.queueSizes) : 0

      const activeTime = data.events.filter(e => 
        e.type.includes('preparing') || e.type.includes('processing')
      ).length * avgPrepTime

      const utilizationPercent = totalDuration > 0 ? Math.min(100, (activeTime / totalDuration) * 100) : 0
      const idleTimePercent = 100 - utilizationPercent

      const efficiency = this.calculateStationEfficiency(utilizationPercent, avgPrepTime, peakQueueSize)

      metrics.push({
        stationId: data.stationId,
        stationName: data.stationName,
        itemsProcessed: data.itemsProcessed,
        averagePrepTimeSeconds: avgPrepTime,
        utilizationPercent,
        peakQueueSize,
        idleTimePercent,
        efficiency,
      })
    }

    return metrics.sort((a, b) => b.itemsProcessed - a.itemsProcessed)
  }

  private calculateStationEfficiency(utilization: number, avgPrepTime: number, peakQueue: number): number {
    const utilizationScore = Math.min(100, utilization)
    const prepTimeScore = avgPrepTime > 0 ? Math.max(0, 100 - (avgPrepTime / 600) * 50) : 100
    const queueScore = Math.max(0, 100 - peakQueue * 5)
    return Math.round((utilizationScore * 0.4 + prepTimeScore * 0.4 + queueScore * 0.2))
  }

  private calculateOverallUtilization(metrics: StationMetric[]): number {
    if (metrics.length === 0) return 0
    const totalUtilization = metrics.reduce((sum, m) => sum + m.utilizationPercent, 0)
    return Math.round(totalUtilization / metrics.length)
  }

  private findPeakLoad(events: OperationalEvent[]): PeakLoad {
    const timeWindows = new Map<string, { queueSize: number; activeOrders: number; count: number }>()

    for (const event of events) {
      const timestamp = new Date(event.timestamp)
      timestamp.setMinutes(Math.floor(timestamp.getMinutes() / 5) * 5, 0, 0)
      const windowKey = timestamp.toISOString()

      const window = timeWindows.get(windowKey) || { queueSize: 0, activeOrders: 0, count: 0 }
      window.count++
      if (event.data?.queueSize) window.queueSize = Math.max(window.queueSize, event.data.queueSize as number)
      if (event.type.includes('active') || event.type.includes('preparing')) window.activeOrders++
      timeWindows.set(windowKey, window)
    }

    let peakWindow: { timestamp: string; queueSize: number; activeOrders: number; duration: number } = {
      timestamp: new Date().toISOString(),
      queueSize: 0,
      activeOrders: 0,
      duration: 0,
    }

    for (const [timestamp, window] of timeWindows) {
      if (window.queueSize > peakWindow.queueSize) {
        peakWindow = {
          timestamp,
          queueSize: window.queueSize,
          activeOrders: window.activeOrders,
          duration: 300,
        }
      }
    }

    return peakWindow
  }

  private analyzeQueue(events: OperationalEvent[]): QueueAnalysis {
    const queueSizes: number[] = []
    let growthEvents = 0
    let reductionEvents = 0
    let lastQueueSize = 0

    for (const event of events) {
      if (event.data?.queueSize !== undefined) {
        const size = event.data.queueSize as number
        queueSizes.push(size)

        if (size > lastQueueSize) growthEvents++
        if (size < lastQueueSize) reductionEvents++
        lastQueueSize = size
      }
    }

    const avgQueueSize = queueSizes.length > 0
      ? queueSizes.reduce((a, b) => a + b, 0) / queueSizes.length
      : 0

    const maxQueueSize = queueSizes.length > 0 ? Math.max(...queueSizes) : 0

    const waitTimes = events
      .filter(e => e.data?.waitTimeSeconds !== undefined)
      .map(e => e.data!.waitTimeSeconds as number)

    const avgWaitTime = waitTimes.length > 0
      ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length
      : 0

    return {
      averageQueueSize: avgQueueSize,
      maxQueueSize,
      queueGrowthEvents: growthEvents,
      queueReductionEvents: reductionEvents,
      averageWaitTimeSeconds: avgWaitTime,
    }
  }

  private detectRecoveryEvents(events: OperationalEvent[]): RecoveryEvent[] {
    const recoveries: RecoveryEvent[] = []
    const sortedEvents = events.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    let inCongestion = false
    let congestionStart: string | null = null
    const congestionEventIds: string[] = []

    for (const event of sortedEvents) {
      const isHighLoad = event.data?.queueSize && (event.data.queueSize as number) > 5

      if (isHighLoad && !inCongestion) {
        inCongestion = true
        congestionStart = event.timestamp
        congestionEventIds.push(event.id)
      } else if (inCongestion && isHighLoad) {
        congestionEventIds.push(event.id)
      } else if (inCongestion && !isHighLoad && congestionStart) {
        const recoveryTime = (new Date(event.timestamp).getTime() - new Date(congestionStart).getTime()) / 1000
        recoveries.push({
          timestamp: event.timestamp,
          description: 'Kitchen recovered from high queue',
          recoveryTimeSeconds: recoveryTime,
          eventIds: [...congestionEventIds],
        })
        inCongestion = false
        congestionStart = null
        congestionEventIds.length = 0
      }
    }

    return recoveries
  }

  private generateSummary(metrics: StationMetric[], utilization: number, peakLoad: PeakLoad): string {
    const parts: string[] = []

    parts.push(`${metrics.length} stations analyzed`)
    parts.push(`Overall utilization: ${utilization}%`)

    if (peakLoad.queueSize > 0) {
      parts.push(`Peak queue: ${peakLoad.queueSize} orders`)
    }

    const bottlenecks = metrics.filter(m => m.utilizationPercent > 90)
    if (bottlenecks.length > 0) {
      parts.push(`${bottlenecks.length} station(s) near capacity`)
    }

    return parts.join('. ')
  }
}

interface StationData {
  stationId: string
  stationName: string
  events: OperationalEvent[]
  itemsProcessed: number
  prepTimes: number[]
  queueSizes: number[]
}
