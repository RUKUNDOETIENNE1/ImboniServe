/**
 * Hospitality Intelligence Engine (HIE) - Staff Analysis Module
 * 
 * Analyzes staff performance and workload distribution.
 */

import type {
  StaffAnalysis,
  StaffMetric,
  WorkloadDistribution,
  OperationalEvent,
} from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Staff Analyzer
// ─────────────────────────────────────────────────────────────────────────────

export class StaffAnalyzer {
  async analyze(events: OperationalEvent[]): Promise<StaffAnalysis> {
    const staffData = this.aggregateStaffData(events)
    const staffMetrics = this.calculateStaffMetrics(staffData)
    const workloadDistribution = this.analyzeWorkloadDistribution(staffMetrics)

    const topPerformer = this.findTopPerformer(staffMetrics)
    const busiestStaff = this.findBusiestStaff(staffMetrics)
    const potentialOverload = this.findOverloadedStaff(staffMetrics)

    const summary = this.generateSummary(staffMetrics, workloadDistribution, topPerformer)

    return {
      summary,
      totalStaff: staffMetrics.length,
      staffMetrics,
      workloadDistribution,
      topPerformer,
      busiestStaff,
      potentialOverload,
    }
  }

  private aggregateStaffData(events: OperationalEvent[]): Map<string, StaffData> {
    const staffMap = new Map<string, StaffData>()

    for (const event of events) {
      if (!event.staffId || !event.staffName) continue

      const data = staffMap.get(event.staffId) || {
        staffId: event.staffId,
        staffName: event.staffName,
        events: [],
        orderIds: new Set(),
        tableIds: new Set(),
        totalRevenueCents: 0,
      }

      data.events.push(event)
      if (event.orderId) data.orderIds.add(event.orderId)
      if (event.tableId) data.tableIds.add(event.tableId)
      if (event.data?.revenueCents) data.totalRevenueCents += event.data.revenueCents as number

      staffMap.set(event.staffId, data)
    }

    return staffMap
  }

  private calculateStaffMetrics(staffData: Map<string, StaffData>): StaffMetric[] {
    const metrics: StaffMetric[] = []

    for (const data of staffData.values()) {
      const ordersHandled = data.orderIds.size
      const completedOrders = data.events.filter(e => e.type.includes('completed')).length
      const completionRate = ordersHandled > 0 ? (completedOrders / ordersHandled) * 100 : 0

      const responseTimes = this.calculateResponseTimes(data.events)
      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0

      const serviceDurations = this.calculateServiceDurations(data.events)
      const avgServiceDuration = serviceDurations.length > 0
        ? serviceDurations.reduce((a, b) => a + b, 0) / serviceDurations.length
        : 0

      const efficiency = this.calculateEfficiency(completionRate, avgResponseTime, avgServiceDuration)

      metrics.push({
        staffId: data.staffId,
        staffName: data.staffName,
        ordersHandled,
        averageResponseTimeSeconds: avgResponseTime,
        completionRate,
        averageServiceDurationSeconds: avgServiceDuration,
        tableCoverage: data.tableIds.size,
        totalRevenueCents: data.totalRevenueCents,
        efficiency,
      })
    }

    return metrics.sort((a, b) => b.efficiency - a.efficiency)
  }

  private calculateResponseTimes(events: OperationalEvent[]): number[] {
    const times: number[] = []
    const orderTimestamps: Map<string, { created?: string; responded?: string }> = new Map()

    for (const event of events) {
      if (!event.orderId) continue
      const record = orderTimestamps.get(event.orderId) || {}
      if (event.type.includes('created')) record.created = event.timestamp
      if (event.type.includes('accepted') || event.type.includes('started')) record.responded = event.timestamp
      orderTimestamps.set(event.orderId, record)
    }

    for (const record of orderTimestamps.values()) {
      if (record.created && record.responded) {
        const duration = (new Date(record.responded).getTime() - new Date(record.created).getTime()) / 1000
        if (duration > 0 && duration < 3600) times.push(duration)
      }
    }

    return times
  }

  private calculateServiceDurations(events: OperationalEvent[]): number[] {
    const durations: number[] = []
    const orderTimestamps: Map<string, { start?: string; end?: string }> = new Map()

    for (const event of events) {
      if (!event.orderId) continue
      const record = orderTimestamps.get(event.orderId) || {}
      if (event.type.includes('started') || event.type.includes('accepted')) record.start = event.timestamp
      if (event.type.includes('completed') || event.type.includes('delivered')) record.end = event.timestamp
      orderTimestamps.set(event.orderId, record)
    }

    for (const record of orderTimestamps.values()) {
      if (record.start && record.end) {
        const duration = (new Date(record.end).getTime() - new Date(record.start).getTime()) / 1000
        if (duration > 0 && duration < 7200) durations.push(duration)
      }
    }

    return durations
  }

  private calculateEfficiency(completionRate: number, avgResponseTime: number, avgServiceDuration: number): number {
    const completionScore = completionRate
    const responseScore = avgResponseTime > 0 ? Math.max(0, 100 - (avgResponseTime / 60) * 10) : 100
    const durationScore = avgServiceDuration > 0 ? Math.max(0, 100 - (avgServiceDuration / 600) * 10) : 100
    return Math.round((completionScore * 0.5 + responseScore * 0.25 + durationScore * 0.25))
  }

  private analyzeWorkloadDistribution(metrics: StaffMetric[]): WorkloadDistribution {
    if (metrics.length === 0) {
      return { balanced: true, variance: 0 }
    }

    const orders = metrics.map(m => m.ordersHandled)
    const mean = orders.reduce((a, b) => a + b, 0) / orders.length
    const variance = orders.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / orders.length
    const stdDev = Math.sqrt(variance)
    const coefficientOfVariation = mean > 0 ? stdDev / mean : 0

    const balanced = coefficientOfVariation < 0.3
    const recommendation = balanced
      ? undefined
      : 'Consider redistributing workload to balance staff assignments'

    return { balanced, variance, recommendation }
  }

  private findTopPerformer(metrics: StaffMetric[]): StaffMetric | undefined {
    return metrics.length > 0 ? metrics[0] : undefined
  }

  private findBusiestStaff(metrics: StaffMetric[]): StaffMetric | undefined {
    return metrics.length > 0
      ? metrics.reduce((max, curr) => curr.ordersHandled > max.ordersHandled ? curr : max)
      : undefined
  }

  private findOverloadedStaff(metrics: StaffMetric[]): StaffMetric[] {
    if (metrics.length === 0) return []
    const avgOrders = metrics.reduce((sum, m) => sum + m.ordersHandled, 0) / metrics.length
    return metrics.filter(m => m.ordersHandled > avgOrders * 1.5)
  }

  private generateSummary(
    metrics: StaffMetric[],
    distribution: WorkloadDistribution,
    topPerformer?: StaffMetric
  ): string {
    const parts: string[] = []

    parts.push(`${metrics.length} staff members analyzed`)

    if (topPerformer) {
      parts.push(`Top performer: ${topPerformer.staffName} (${topPerformer.efficiency}% efficiency)`)
    }

    if (distribution.balanced) {
      parts.push('Workload is well balanced')
    } else {
      parts.push('Workload imbalance detected')
    }

    return parts.join('. ')
  }
}

interface StaffData {
  staffId: string
  staffName: string
  events: OperationalEvent[]
  orderIds: Set<string>
  tableIds: Set<string>
  totalRevenueCents: number
}
