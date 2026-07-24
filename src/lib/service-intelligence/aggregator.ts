/**
 * Service Intelligence™ - Metrics Aggregator
 * 
 * Calculates service-specific metrics from operational events
 */

import type { OperationalEvent } from '../intelligence/types'
import type {
  ServiceMetrics,
  WaiterMetrics,
  StationMetrics,
  FlowPattern,
  PeakPeriod,
} from './types'

export class ServiceMetricsAggregator {
  /**
   * Calculate comprehensive service metrics from events
   */
  calculateMetrics(events: OperationalEvent[]): ServiceMetrics {
    const orderEvents = this.groupEventsByOrder(events)
    
    // Duration metrics
    const durations = this.calculateDurations(orderEvents)
    
    // Throughput metrics
    const throughput = this.calculateThroughput(events, orderEvents)
    
    // Quality metrics
    const quality = this.calculateQuality(orderEvents)
    
    return {
      // Duration (in seconds)
      avgServiceDuration: durations.avgServiceDuration,
      avgWaitTime: durations.avgWaitTime,
      avgPreparationTime: durations.avgPreparationTime,
      avgPaymentTime: durations.avgPaymentTime,
      
      // Throughput
      totalOrders: throughput.totalOrders,
      completedOrders: throughput.completedOrders,
      cancelledOrders: throughput.cancelledOrders,
      orderThroughput: throughput.ordersPerHour,
      
      // Performance
      completionRate: quality.completionRate,
      cancellationRate: quality.cancellationRate,
      onTimeDeliveryRate: quality.onTimeDeliveryRate,
      
      // Quality
      serviceQualityScore: quality.serviceQualityScore,
      operationalEfficiency: quality.operationalEfficiency,
      customerSatisfactionProxy: quality.customerSatisfactionProxy,
    }
  }

  /**
   * Calculate waiter performance metrics
   */
  calculateWaiterMetrics(events: OperationalEvent[]): WaiterMetrics[] {
    const waiterEvents = this.groupEventsByWaiter(events)
    const waiterMetrics: WaiterMetrics[] = []
    
    for (const [waiterId, waiterEventList] of waiterEvents.entries()) {
      const orders = this.groupEventsByOrder(waiterEventList)
      const completedOrders = Array.from(orders.values()).filter(
        orderEvents => orderEvents.some(e => e.eventType === 'PAYMENT_CONFIRMED')
      )
      
      const avgServiceTime = this.calculateAvgServiceTime(orders)
      const ordersHandled = orders.size
      const completionRate = ordersHandled > 0 ? (completedOrders.length / ordersHandled) * 100 : 0
      
      // Get waiter name from first event
      const firstEvent = waiterEventList[0]
      const waiterName = (firstEvent.eventData as any)?.actorName ?? `Waiter ${waiterId}`
      
      waiterMetrics.push({
        waiterId,
        waiterName,
        ordersHandled,
        avgServiceTime,
        completionRate,
        ordersPerHour: this.calculateOrdersPerHour(waiterEventList),
        multitaskingScore: this.calculateMultitaskingScore(orders),
        errorRate: this.calculateErrorRate(waiterEventList),
        trend: this.determineTrend(completionRate, 85), // 85% baseline
        trendPercent: 0, // Would need historical data
      })
    }
    
    return waiterMetrics.sort((a, b) => b.ordersHandled - a.ordersHandled)
  }

  /**
   * Calculate station performance metrics
   */
  calculateStationMetrics(events: OperationalEvent[]): StationMetrics[] {
    const stationEvents = this.groupEventsByStation(events)
    const stationMetrics: StationMetrics[] = []
    
    for (const [stationId, stationEventList] of stationEvents.entries()) {
      const orders = this.groupEventsByOrder(stationEventList)
      const avgProcessingTime = this.calculateAvgProcessingTime(orders)
      const ordersProcessed = orders.size
      
      // Bottleneck detection
      const isBottleneck = avgProcessingTime > 600 // > 10 minutes
      const bottleneckSeverity = this.determineBottleneckSeverity(avgProcessingTime)
      
      // Get station name
      const firstEvent = stationEventList[0]
      const stationName = (firstEvent.eventData as any)?.stationName ?? `Station ${stationId}`
      
      stationMetrics.push({
        stationId,
        stationName,
        ordersProcessed,
        avgProcessingTime,
        queueLength: this.estimateQueueLength(stationEventList),
        isBottleneck,
        bottleneckSeverity,
        delayImpact: isBottleneck ? avgProcessingTime - 600 : 0,
        trend: this.determineTrend(avgProcessingTime, 600),
      })
    }
    
    return stationMetrics.sort((a, b) => b.ordersProcessed - a.ordersProcessed)
  }

  /**
   * Identify customer flow patterns
   */
  identifyFlowPatterns(events: OperationalEvent[]): FlowPattern[] {
    // Group by order to track journey
    const orderJourneys = this.groupEventsByOrder(events)
    const patterns = new Map<string, { count: number; totalDuration: number; efficiency: number }>()
    
    for (const [orderId, orderEvents] of orderJourneys.entries()) {
      const pattern = this.extractFlowPattern(orderEvents)
      const duration = this.calculateOrderDuration(orderEvents)
      const efficiency = this.calculateFlowEfficiency(orderEvents)
      
      if (!patterns.has(pattern)) {
        patterns.set(pattern, { count: 0, totalDuration: 0, efficiency: 0 })
      }
      
      const p = patterns.get(pattern)!
      p.count++
      p.totalDuration += duration
      p.efficiency += efficiency
    }
    
    return Array.from(patterns.entries())
      .map(([pattern, data]) => ({
        pattern,
        description: this.describePattern(pattern),
        frequency: data.count,
        avgDuration: data.totalDuration / data.count,
        efficiency: data.efficiency / data.count,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5) // Top 5 patterns
  }

  /**
   * Identify peak service periods
   */
  identifyPeakPeriods(events: OperationalEvent[]): PeakPeriod[] {
    // Group events by hour
    const hourlyBuckets = new Map<number, OperationalEvent[]>()
    
    for (const event of events) {
      const hour = new Date(event.timestamp).getHours()
      if (!hourlyBuckets.has(hour)) {
        hourlyBuckets.set(hour, [])
      }
      hourlyBuckets.get(hour)!.push(event)
    }
    
    // Calculate metrics for each hour
    const hourlyMetrics = Array.from(hourlyBuckets.entries()).map(([hour, hourEvents]) => {
      const orders = this.groupEventsByOrder(hourEvents)
      const avgServiceTime = this.calculateAvgServiceTime(orders)
      const staffUtilization = this.estimateStaffUtilization(hourEvents)
      
      return {
        hour,
        orderVolume: orders.size,
        avgServiceTime,
        staffUtilization,
      }
    })
    
    // Identify peaks (top 3 hours by volume)
    return hourlyMetrics
      .sort((a, b) => b.orderVolume - a.orderVolume)
      .slice(0, 3)
      .map(h => ({
        startTime: `${h.hour.toString().padStart(2, '0')}:00`,
        endTime: `${(h.hour + 1).toString().padStart(2, '0')}:00`,
        orderVolume: h.orderVolume,
        avgServiceTime: h.avgServiceTime,
        staffUtilization: h.staffUtilization,
      }))
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Helper Methods
  // ─────────────────────────────────────────────────────────────────────────────

  private groupEventsByOrder(events: OperationalEvent[]): Map<string, OperationalEvent[]> {
    const groups = new Map<string, OperationalEvent[]>()
    for (const event of events) {
      const orderId = (event.eventData as any)?.saleId ?? event.eventData?.orderId
      if (!orderId) continue
      if (!groups.has(orderId)) {
        groups.set(orderId, [])
      }
      groups.get(orderId)!.push(event)
    }
    return groups
  }

  private groupEventsByWaiter(events: OperationalEvent[]): Map<string, OperationalEvent[]> {
    const groups = new Map<string, OperationalEvent[]>()
    for (const event of events) {
      const waiterId = (event.eventData as any)?.actorId
      if (!waiterId) continue
      if (!groups.has(waiterId)) {
        groups.set(waiterId, [])
      }
      groups.get(waiterId)!.push(event)
    }
    return groups
  }

  private groupEventsByStation(events: OperationalEvent[]): Map<string, OperationalEvent[]> {
    const groups = new Map<string, OperationalEvent[]>()
    for (const event of events) {
      const stationId = (event.eventData as any)?.stationId
      if (!stationId) continue
      if (!groups.has(stationId)) {
        groups.set(stationId, [])
      }
      groups.get(stationId)!.push(event)
    }
    return groups
  }

  private calculateDurations(orders: Map<string, OperationalEvent[]>) {
    let totalServiceDuration = 0
    let totalWaitTime = 0
    let totalPrepTime = 0
    let totalPaymentTime = 0
    let count = 0

    for (const orderEvents of orders.values()) {
      const sorted = orderEvents.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
      
      if (sorted.length < 2) continue
      
      const start = new Date(sorted[0].timestamp).getTime()
      const end = new Date(sorted[sorted.length - 1].timestamp).getTime()
      
      totalServiceDuration += (end - start) / 1000
      count++
    }

    return {
      avgServiceDuration: count > 0 ? totalServiceDuration / count : 0,
      avgWaitTime: count > 0 ? totalWaitTime / count : 0,
      avgPreparationTime: count > 0 ? totalPrepTime / count : 0,
      avgPaymentTime: count > 0 ? totalPaymentTime / count : 0,
    }
  }

  private calculateThroughput(events: OperationalEvent[], orders: Map<string, OperationalEvent[]>) {
    const completedOrders = Array.from(orders.values()).filter(
      orderEvents => orderEvents.some(e => e.eventType === 'PAYMENT_CONFIRMED')
    ).length
    
    const cancelledOrders = Array.from(orders.values()).filter(
      orderEvents => orderEvents.some(e => (e.eventData as any)?.newState === 'cancelled')
    ).length
    
    // Calculate time span
    const timestamps = events.map(e => new Date(e.timestamp).getTime())
    const timeSpanHours = timestamps.length > 0 
      ? (Math.max(...timestamps) - Math.min(...timestamps)) / (1000 * 60 * 60)
      : 1
    
    return {
      totalOrders: orders.size,
      completedOrders,
      cancelledOrders,
      ordersPerHour: timeSpanHours > 0 ? orders.size / timeSpanHours : 0,
    }
  }

  private calculateQuality(orders: Map<string, OperationalEvent[]>) {
    const totalOrders = orders.size
    if (totalOrders === 0) {
      return {
        completionRate: 0,
        cancellationRate: 0,
        onTimeDeliveryRate: 0,
        serviceQualityScore: 0,
        operationalEfficiency: 0,
        customerSatisfactionProxy: 0,
      }
    }

    const completedOrders = Array.from(orders.values()).filter(
      orderEvents => orderEvents.some(e => e.eventType === 'PAYMENT_CONFIRMED')
    ).length
    
    const cancelledOrders = Array.from(orders.values()).filter(
      orderEvents => orderEvents.some(e => (e.eventData as any)?.newState === 'cancelled')
    ).length

    const completionRate = (completedOrders / totalOrders) * 100
    const cancellationRate = (cancelledOrders / totalOrders) * 100
    
    // Proxy metrics
    const serviceQualityScore = Math.max(0, 100 - cancellationRate * 2)
    const operationalEfficiency = completionRate
    const customerSatisfactionProxy = (completionRate + serviceQualityScore) / 2

    return {
      completionRate,
      cancellationRate,
      onTimeDeliveryRate: completionRate, // Proxy
      serviceQualityScore,
      operationalEfficiency,
      customerSatisfactionProxy,
    }
  }

  private calculateAvgServiceTime(orders: Map<string, OperationalEvent[]>): number {
    let total = 0
    let count = 0
    
    for (const orderEvents of orders.values()) {
      if (orderEvents.length < 2) continue
      const sorted = orderEvents.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
      const duration = (new Date(sorted[sorted.length - 1].timestamp).getTime() - 
                       new Date(sorted[0].timestamp).getTime()) / 1000
      total += duration
      count++
    }
    
    return count > 0 ? total / count : 0
  }

  private calculateAvgProcessingTime(orders: Map<string, OperationalEvent[]>): number {
    return this.calculateAvgServiceTime(orders)
  }

  private calculateOrdersPerHour(events: OperationalEvent[]): number {
    if (events.length === 0) return 0
    const timestamps = events.map(e => new Date(e.timestamp).getTime())
    const timeSpanHours = (Math.max(...timestamps) - Math.min(...timestamps)) / (1000 * 60 * 60)
    const uniqueOrders = new Set(events.map(e => (e.eventData as any)?.saleId)).size
    return timeSpanHours > 0 ? uniqueOrders / timeSpanHours : 0
  }

  private calculateMultitaskingScore(orders: Map<string, OperationalEvent[]>): number {
    // Simple proxy: more concurrent orders = higher score
    return Math.min(100, orders.size * 10)
  }

  private calculateErrorRate(events: OperationalEvent[]): number {
    const errorEvents = events.filter(e => 
      (e.eventData as any)?.newState === 'cancelled' || 
      (e.eventData as any)?.error
    )
    return events.length > 0 ? (errorEvents.length / events.length) * 100 : 0
  }

  private estimateQueueLength(events: OperationalEvent[]): number {
    // Proxy: count of pending/in-progress orders
    const pendingStates = events.filter(e => 
      (e.eventData as any)?.newState === 'pending' || 
      (e.eventData as any)?.newState === 'in_progress'
    )
    return pendingStates.length
  }

  private determineBottleneckSeverity(avgTime: number): 'low' | 'medium' | 'high' | 'critical' | undefined {
    if (avgTime < 600) return undefined
    if (avgTime < 900) return 'low'
    if (avgTime < 1200) return 'medium'
    if (avgTime < 1800) return 'high'
    return 'critical'
  }

  private determineTrend(value: number, baseline: number): 'improving' | 'stable' | 'declining' {
    const diff = ((value - baseline) / baseline) * 100
    if (Math.abs(diff) < 5) return 'stable'
    return diff < 0 ? 'improving' : 'declining'
  }

  private extractFlowPattern(events: OperationalEvent[]): string {
    const states = events
      .map(e => (e.eventData as any)?.newState ?? e.eventType)
      .filter(Boolean)
    return states.join(' → ')
  }

  private describePattern(pattern: string): string {
    return `Order flow: ${pattern}`
  }

  private calculateOrderDuration(events: OperationalEvent[]): number {
    if (events.length < 2) return 0
    const sorted = events.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
    return (new Date(sorted[sorted.length - 1].timestamp).getTime() - 
            new Date(sorted[0].timestamp).getTime()) / 1000
  }

  private calculateFlowEfficiency(events: OperationalEvent[]): number {
    // Proxy: fewer events = more efficient
    const duration = this.calculateOrderDuration(events)
    return duration > 0 ? Math.max(0, 100 - events.length * 5) : 0
  }

  private estimateStaffUtilization(events: OperationalEvent[]): number {
    const uniqueStaff = new Set(events.map(e => (e.eventData as any)?.actorId)).size
    return Math.min(100, uniqueStaff * 20) // Proxy
  }
}
