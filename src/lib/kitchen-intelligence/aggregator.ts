/**
 * Kitchen Intelligence™ - Metrics Aggregator
 * 
 * Calculates kitchen-specific metrics from operational events
 */

import type { OperationalEvent } from '../intelligence/types'
import type {
  KitchenMetrics,
  StationPerformance,
  RecipeComplexity,
  KitchenDelay,
  PreparationPattern,
  PeakKitchenPeriod,
} from './types'

export class KitchenMetricsAggregator {
  /**
   * Calculate comprehensive kitchen metrics from events
   */
  calculateMetrics(events: OperationalEvent[]): KitchenMetrics {
    const orderEvents = this.groupEventsByOrder(events)
    
    // Throughput metrics
    const throughput = this.calculateThroughput(events, orderEvents)
    
    // Preparation time metrics
    const timing = this.calculatePreparationTimes(orderEvents)
    
    // Station metrics
    const stations = this.calculateStationMetrics(events)
    
    // Queue metrics
    const queue = this.calculateQueueMetrics(events)
    
    // Efficiency metrics
    const efficiency = this.calculateEfficiency(orderEvents, stations)
    
    // Quality metrics
    const quality = this.calculateQuality(orderEvents)
    
    return {
      // Throughput
      totalOrders: throughput.totalOrders,
      completedOrders: throughput.completedOrders,
      inProgressOrders: throughput.inProgressOrders,
      avgThroughput: throughput.ordersPerHour,
      
      // Preparation Time
      avgPreparationTime: timing.avgPreparationTime,
      minPreparationTime: timing.minPreparationTime,
      maxPreparationTime: timing.maxPreparationTime,
      preparationTimeVariance: timing.variance,
      
      // Station
      activeStations: stations.activeCount,
      bottleneckedStations: stations.bottleneckedCount,
      avgStationLoad: stations.avgLoad,
      
      // Queue
      avgQueueLength: queue.avgLength,
      maxQueueLength: queue.maxLength,
      queueClearanceRate: queue.clearanceRate,
      
      // Efficiency
      kitchenEfficiency: efficiency.overall,
      preparationConsistency: efficiency.consistency,
      kitchenProductivity: efficiency.productivity,
      
      // Quality
      qualityScore: quality.score,
      remakeRate: quality.remakeRate,
      delayRate: quality.delayRate,
    }
  }

  /**
   * Calculate station performance metrics
   */
  calculateStationPerformance(events: OperationalEvent[]): StationPerformance[] {
    const stationEvents = this.groupEventsByStation(events)
    const stationMetrics: StationPerformance[] = []
    
    for (const [stationId, stationEventList] of stationEvents.entries()) {
      const orders = this.groupEventsByOrder(stationEventList)
      const avgProcessingTime = this.calculateAvgProcessingTime(orders)
      const ordersProcessed = orders.size
      
      // Bottleneck detection
      const isBottleneck = avgProcessingTime > 600 // > 10 minutes
      const bottleneckSeverity = this.determineBottleneckSeverity(avgProcessingTime)
      
      // Efficiency calculation
      const efficiency = this.calculateStationEfficiency(avgProcessingTime, ordersProcessed)
      const consistency = this.calculateStationConsistency(orders)
      
      // Get station name
      const firstEvent = stationEventList[0]
      const stationName = (firstEvent.eventData as any)?.stationName ?? `Station ${stationId}`
      
      stationMetrics.push({
        stationId,
        stationName,
        ordersProcessed,
        avgProcessingTime,
        currentQueueLength: this.estimateQueueLength(stationEventList),
        throughput: this.calculateStationThroughput(stationEventList),
        efficiency,
        consistency,
        isBottleneck,
        bottleneckSeverity,
        avgDelay: isBottleneck ? avgProcessingTime - 600 : 0,
        trend: this.determineTrend(avgProcessingTime, 600),
        trendPercent: 0, // Would need historical data
      })
    }
    
    return stationMetrics.sort((a, b) => b.ordersProcessed - a.ordersProcessed)
  }

  /**
   * Analyze recipe complexity
   */
  analyzeRecipeComplexity(events: OperationalEvent[]): RecipeComplexity[] {
    const menuItemEvents = this.groupEventsByMenuItem(events)
    const complexityMetrics: RecipeComplexity[] = []
    
    for (const [menuItemId, itemEventList] of menuItemEvents.entries()) {
      const orders = this.groupEventsByOrder(itemEventList)
      const preparationTimes = this.extractPreparationTimes(orders)
      
      if (preparationTimes.length === 0) continue
      
      const avgPreparationTime = this.calculateAverage(preparationTimes)
      const variance = this.calculateVariance(preparationTimes, avgPreparationTime)
      const complexityScore = this.calculateComplexityScore(avgPreparationTime, variance)
      
      // Get menu item name
      const firstEvent = itemEventList[0]
      const menuItemName = (firstEvent.eventData as any)?.menuItemName ?? `Item ${menuItemId}`
      
      complexityMetrics.push({
        menuItemId,
        menuItemName,
        avgPreparationTime,
        preparationVariance: variance,
        complexityScore,
        successRate: this.calculateSuccessRate(orders),
        remakeRate: this.calculateRemakeRate(orders),
        avgQuality: this.calculateAvgQuality(orders),
        ordersCompleted: orders.size,
        trend: this.determineVolumeTrend(orders.size, 10), // 10 as baseline
      })
    }
    
    return complexityMetrics.sort((a, b) => b.complexityScore - a.complexityScore)
  }

  /**
   * Identify kitchen delays
   */
  identifyDelays(events: OperationalEvent[]): KitchenDelay[] {
    const delays: KitchenDelay[] = []
    const orderEvents = this.groupEventsByOrder(events)
    
    for (const [orderId, orderEventList] of orderEvents.entries()) {
      const sorted = orderEventList.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
      
      if (sorted.length < 2) continue
      
      const duration = (new Date(sorted[sorted.length - 1].timestamp).getTime() - 
                       new Date(sorted[0].timestamp).getTime()) / 1000
      
      // Delay threshold: > 15 minutes
      if (duration > 900) {
        const stationId = (sorted[0].eventData as any)?.stationId
        const stationName = (sorted[0].eventData as any)?.stationName
        
        delays.push({
          id: `delay_${orderId}_${Date.now()}`,
          timestamp: sorted[0].timestamp,
          orderId,
          stationId,
          stationName,
          delayDuration: duration,
          severity: this.determineDelaySeverity(duration),
          customerImpact: this.determineCustomerImpact(duration),
          cause: this.inferDelayCause(orderEventList),
          category: this.categorizeDelay(orderEventList),
        })
      }
    }
    
    return delays.sort((a, b) => b.delayDuration - a.delayDuration)
  }

  /**
   * Identify preparation patterns
   */
  identifyPreparationPatterns(events: OperationalEvent[]): PreparationPattern[] {
    const orderJourneys = this.groupEventsByOrder(events)
    const patterns = new Map<string, { count: number; totalDuration: number; durations: number[] }>()
    
    for (const [orderId, orderEvents] of orderJourneys.entries()) {
      const pattern = this.extractPreparationPattern(orderEvents)
      const duration = this.calculateOrderDuration(orderEvents)
      
      if (!patterns.has(pattern)) {
        patterns.set(pattern, { count: 0, totalDuration: 0, durations: [] })
      }
      
      const p = patterns.get(pattern)!
      p.count++
      p.totalDuration += duration
      p.durations.push(duration)
    }
    
    return Array.from(patterns.entries())
      .map(([pattern, data]) => ({
        pattern,
        description: this.describePreparationPattern(pattern),
        frequency: data.count,
        avgDuration: data.totalDuration / data.count,
        efficiency: this.calculatePatternEfficiency(data.durations),
        consistency: this.calculatePatternConsistency(data.durations),
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5) // Top 5 patterns
  }

  /**
   * Identify peak kitchen periods
   */
  identifyPeakPeriods(events: OperationalEvent[]): PeakKitchenPeriod[] {
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
      const avgPreparationTime = this.calculateAvgProcessingTime(orders)
      const stationUtilization = this.estimateStationUtilization(hourEvents)
      const efficiency = this.calculateHourlyEfficiency(orders, hourEvents)
      
      return {
        hour,
        orderVolume: orders.size,
        avgPreparationTime,
        stationUtilization,
        efficiency,
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
        avgPreparationTime: h.avgPreparationTime,
        stationUtilization: h.stationUtilization,
        efficiency: h.efficiency,
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

  private groupEventsByMenuItem(events: OperationalEvent[]): Map<string, OperationalEvent[]> {
    const groups = new Map<string, OperationalEvent[]>()
    for (const event of events) {
      const menuItemId = (event.eventData as any)?.menuItemId
      if (!menuItemId) continue
      if (!groups.has(menuItemId)) {
        groups.set(menuItemId, [])
      }
      groups.get(menuItemId)!.push(event)
    }
    return groups
  }

  private calculateThroughput(events: OperationalEvent[], orders: Map<string, OperationalEvent[]>) {
    const completedOrders = Array.from(orders.values()).filter(
      orderEvents => orderEvents.some(e => (e.eventData as any)?.newState === 'completed')
    ).length
    
    const inProgressOrders = Array.from(orders.values()).filter(
      orderEvents => orderEvents.some(e => (e.eventData as any)?.newState === 'in_progress')
    ).length
    
    // Calculate time span
    const timestamps = events.map(e => new Date(e.timestamp).getTime())
    const timeSpanHours = timestamps.length > 0 
      ? (Math.max(...timestamps) - Math.min(...timestamps)) / (1000 * 60 * 60)
      : 1
    
    return {
      totalOrders: orders.size,
      completedOrders,
      inProgressOrders,
      ordersPerHour: timeSpanHours > 0 ? orders.size / timeSpanHours : 0,
    }
  }

  private calculatePreparationTimes(orders: Map<string, OperationalEvent[]>) {
    const times: number[] = []
    
    for (const orderEvents of orders.values()) {
      if (orderEvents.length < 2) continue
      const sorted = orderEvents.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
      const duration = (new Date(sorted[sorted.length - 1].timestamp).getTime() - 
                       new Date(sorted[0].timestamp).getTime()) / 1000
      times.push(duration)
    }
    
    if (times.length === 0) {
      return {
        avgPreparationTime: 0,
        minPreparationTime: 0,
        maxPreparationTime: 0,
        variance: 0,
      }
    }
    
    const avg = this.calculateAverage(times)
    
    return {
      avgPreparationTime: avg,
      minPreparationTime: Math.min(...times),
      maxPreparationTime: Math.max(...times),
      variance: this.calculateVariance(times, avg),
    }
  }

  private calculateStationMetrics(events: OperationalEvent[]) {
    const stationEvents = this.groupEventsByStation(events)
    const activeCount = stationEvents.size
    
    let bottleneckedCount = 0
    let totalLoad = 0
    
    for (const [stationId, stationEventList] of stationEvents.entries()) {
      const orders = this.groupEventsByOrder(stationEventList)
      const avgTime = this.calculateAvgProcessingTime(orders)
      
      if (avgTime > 600) bottleneckedCount++
      totalLoad += orders.size
    }
    
    return {
      activeCount,
      bottleneckedCount,
      avgLoad: activeCount > 0 ? totalLoad / activeCount : 0,
    }
  }

  private calculateQueueMetrics(events: OperationalEvent[]) {
    const stationEvents = this.groupEventsByStation(events)
    const queueLengths: number[] = []
    
    for (const stationEventList of stationEvents.values()) {
      const queueLength = this.estimateQueueLength(stationEventList)
      queueLengths.push(queueLength)
    }
    
    if (queueLengths.length === 0) {
      return {
        avgLength: 0,
        maxLength: 0,
        clearanceRate: 0,
      }
    }
    
    return {
      avgLength: this.calculateAverage(queueLengths),
      maxLength: Math.max(...queueLengths),
      clearanceRate: 100, // Proxy - would need actual queue clearance data
    }
  }

  private calculateEfficiency(orders: Map<string, OperationalEvent[]>, stations: any) {
    const totalOrders = orders.size
    if (totalOrders === 0) {
      return {
        overall: 0,
        consistency: 0,
        productivity: 0,
      }
    }
    
    const completedOrders = Array.from(orders.values()).filter(
      orderEvents => orderEvents.some(e => (e.eventData as any)?.newState === 'completed')
    ).length
    
    const completionRate = (completedOrders / totalOrders) * 100
    
    return {
      overall: completionRate,
      consistency: Math.max(0, 100 - (stations.bottleneckedCount / Math.max(1, stations.activeCount)) * 100),
      productivity: completionRate,
    }
  }

  private calculateQuality(orders: Map<string, OperationalEvent[]>) {
    const totalOrders = orders.size
    if (totalOrders === 0) {
      return {
        score: 0,
        remakeRate: 0,
        delayRate: 0,
      }
    }
    
    const remakes = Array.from(orders.values()).filter(
      orderEvents => orderEvents.some(e => (e.eventData as any)?.remake === true)
    ).length
    
    const delays = Array.from(orders.values()).filter(
      orderEvents => {
        if (orderEvents.length < 2) return false
        const sorted = orderEvents.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )
        const duration = (new Date(sorted[sorted.length - 1].timestamp).getTime() - 
                         new Date(sorted[0].timestamp).getTime()) / 1000
        return duration > 900 // > 15 minutes
      }
    ).length
    
    const remakeRate = (remakes / totalOrders) * 100
    const delayRate = (delays / totalOrders) * 100
    
    return {
      score: Math.max(0, 100 - remakeRate - delayRate),
      remakeRate,
      delayRate,
    }
  }

  private calculateAvgProcessingTime(orders: Map<string, OperationalEvent[]>): number {
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

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0
    return values.reduce((sum, val) => sum + val, 0) / values.length
  }

  private calculateVariance(values: number[], mean: number): number {
    if (values.length === 0) return 0
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2))
    return Math.sqrt(this.calculateAverage(squaredDiffs))
  }

  private calculateComplexityScore(avgTime: number, variance: number): number {
    // Higher time and variance = higher complexity
    const timeScore = Math.min(100, (avgTime / 1800) * 100) // 30 min = 100
    const varianceScore = Math.min(100, (variance / 600) * 100) // 10 min variance = 100
    return (timeScore + varianceScore) / 2
  }

  private calculateSuccessRate(orders: Map<string, OperationalEvent[]>): number {
    const completed = Array.from(orders.values()).filter(
      orderEvents => orderEvents.some(e => (e.eventData as any)?.newState === 'completed')
    ).length
    return orders.size > 0 ? (completed / orders.size) * 100 : 0
  }

  private calculateRemakeRate(orders: Map<string, OperationalEvent[]>): number {
    const remakes = Array.from(orders.values()).filter(
      orderEvents => orderEvents.some(e => (e.eventData as any)?.remake === true)
    ).length
    return orders.size > 0 ? (remakes / orders.size) * 100 : 0
  }

  private calculateAvgQuality(orders: Map<string, OperationalEvent[]>): number {
    const successRate = this.calculateSuccessRate(orders)
    const remakeRate = this.calculateRemakeRate(orders)
    return Math.max(0, successRate - remakeRate)
  }

  private calculateStationEfficiency(avgTime: number, ordersProcessed: number): number {
    // Lower time and higher volume = higher efficiency
    const timeEfficiency = Math.max(0, 100 - (avgTime / 1800) * 100)
    const volumeBonus = Math.min(20, ordersProcessed * 2)
    return Math.min(100, timeEfficiency + volumeBonus)
  }

  private calculateStationConsistency(orders: Map<string, OperationalEvent[]>): number {
    const times = this.extractPreparationTimes(orders)
    if (times.length < 2) return 100
    
    const avg = this.calculateAverage(times)
    const variance = this.calculateVariance(times, avg)
    
    // Lower variance = higher consistency
    return Math.max(0, 100 - (variance / avg) * 100)
  }

  private calculateStationThroughput(events: OperationalEvent[]): number {
    if (events.length === 0) return 0
    const timestamps = events.map(e => new Date(e.timestamp).getTime())
    const timeSpanHours = (Math.max(...timestamps) - Math.min(...timestamps)) / (1000 * 60 * 60)
    const uniqueOrders = new Set(events.map(e => (e.eventData as any)?.saleId)).size
    return timeSpanHours > 0 ? uniqueOrders / timeSpanHours : 0
  }

  private extractPreparationTimes(orders: Map<string, OperationalEvent[]>): number[] {
    const times: number[] = []
    for (const orderEvents of orders.values()) {
      if (orderEvents.length < 2) continue
      const sorted = orderEvents.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
      const duration = (new Date(sorted[sorted.length - 1].timestamp).getTime() - 
                       new Date(sorted[0].timestamp).getTime()) / 1000
      times.push(duration)
    }
    return times
  }

  private estimateQueueLength(events: OperationalEvent[]): number {
    const pendingStates = events.filter(e => 
      (e.eventData as any)?.newState === 'pending' || 
      (e.eventData as any)?.newState === 'in_progress'
    )
    return pendingStates.length
  }

  private estimateStationUtilization(events: OperationalEvent[]): number {
    const uniqueStations = new Set(events.map(e => (e.eventData as any)?.stationId)).size
    return Math.min(100, uniqueStations * 25) // Proxy
  }

  private calculateHourlyEfficiency(orders: Map<string, OperationalEvent[]>, events: OperationalEvent[]): number {
    const completionRate = this.calculateSuccessRate(orders)
    const avgTime = this.calculateAvgProcessingTime(orders)
    const timeEfficiency = Math.max(0, 100 - (avgTime / 1800) * 100)
    return (completionRate + timeEfficiency) / 2
  }

  private calculatePatternEfficiency(durations: number[]): number {
    const avg = this.calculateAverage(durations)
    return Math.max(0, 100 - (avg / 1800) * 100)
  }

  private calculatePatternConsistency(durations: number[]): number {
    if (durations.length < 2) return 100
    const avg = this.calculateAverage(durations)
    const variance = this.calculateVariance(durations, avg)
    return Math.max(0, 100 - (variance / avg) * 100)
  }

  private determineBottleneckSeverity(avgTime: number): 'low' | 'medium' | 'high' | 'critical' | undefined {
    if (avgTime < 600) return undefined
    if (avgTime < 900) return 'low'
    if (avgTime < 1200) return 'medium'
    if (avgTime < 1800) return 'high'
    return 'critical'
  }

  private determineDelaySeverity(duration: number): 'minor' | 'moderate' | 'major' | 'critical' {
    if (duration < 1200) return 'minor' // < 20 min
    if (duration < 1800) return 'moderate' // < 30 min
    if (duration < 2700) return 'major' // < 45 min
    return 'critical'
  }

  private determineCustomerImpact(duration: number): 'low' | 'medium' | 'high' {
    if (duration < 1800) return 'low'
    if (duration < 2700) return 'medium'
    return 'high'
  }

  private determineTrend(value: number, baseline: number): 'improving' | 'stable' | 'declining' {
    const diff = ((value - baseline) / baseline) * 100
    if (Math.abs(diff) < 5) return 'stable'
    return diff < 0 ? 'improving' : 'declining'
  }

  private determineVolumeTrend(value: number, baseline: number): 'increasing' | 'stable' | 'decreasing' {
    const diff = ((value - baseline) / baseline) * 100
    if (Math.abs(diff) < 10) return 'stable'
    return diff > 0 ? 'increasing' : 'decreasing'
  }

  private inferDelayCause(events: OperationalEvent[]): string {
    // Simple heuristic based on event patterns
    if (events.length > 10) return 'Complex order'
    if (events.some(e => (e.eventData as any)?.queueLength > 5)) return 'High queue volume'
    return 'Unknown'
  }

  private categorizeDelay(events: OperationalEvent[]): 'preparation' | 'queue' | 'equipment' | 'staffing' | 'complexity' {
    // Simple categorization based on event data
    if (events.some(e => (e.eventData as any)?.queueLength > 5)) return 'queue'
    if (events.length > 10) return 'complexity'
    return 'preparation'
  }

  private extractPreparationPattern(events: OperationalEvent[]): string {
    const states = events
      .map(e => (e.eventData as any)?.newState ?? e.eventType)
      .filter(Boolean)
    return states.join(' → ')
  }

  private describePreparationPattern(pattern: string): string {
    return `Kitchen flow: ${pattern}`
  }

  private calculateOrderDuration(events: OperationalEvent[]): number {
    if (events.length < 2) return 0
    const sorted = events.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
    return (new Date(sorted[sorted.length - 1].timestamp).getTime() - 
            new Date(sorted[0].timestamp).getTime()) / 1000
  }
}
