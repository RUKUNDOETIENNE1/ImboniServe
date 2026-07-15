/**
 * Hospitality Intelligence Engine (HIE) - Normalization Stage
 * 
 * Stage 1: Normalize, validate, and prepare operational events for analysis.
 */

import type {
  PipelineContext,
  IPipelineStage,
  StageResult,
  NormalizationOutput,
  NormalizedContext,
  DataQuality,
  DataQualityIssue,
  NormalizationStatistics,
} from '../types'
import type { OperationalEvent } from '../../types'

export class NormalizationStage implements IPipelineStage<OperationalEvent[], NormalizationOutput> {
  name = 'normalization' as const

  async execute(
    events: OperationalEvent[],
    context: PipelineContext
  ): Promise<StageResult<NormalizationOutput>> {
    const startTime = Date.now()

    try {
      const originalCount = events.length
      const issues: DataQualityIssue[] = []

      // Remove duplicates
      const uniqueEvents = this.removeDuplicates(events)
      const duplicatesRemoved = originalCount - uniqueEvents.length

      if (duplicatesRemoved > 0) {
        issues.push({
          type: 'duplicate',
          severity: 'low',
          description: `${duplicatesRemoved} duplicate events removed`,
          affectedCount: duplicatesRemoved,
        })
      }

      // Validate events
      const validEvents = this.validateEvents(uniqueEvents, issues)
      const invalidRemoved = uniqueEvents.length - validEvents.length

      // Resolve relationships
      const normalizedEvents = this.resolveRelationships(validEvents)
      const relationshipsResolved = this.countRelationships(normalizedEvents)

      // Sort by timestamp
      normalizedEvents.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )

      // Build normalized context
      const normalizedContext = this.buildContext(normalizedEvents, context)

      // Calculate data quality
      const dataQuality = this.calculateDataQuality(normalizedEvents, issues)

      const statistics: NormalizationStatistics = {
        originalEventCount: originalCount,
        normalizedEventCount: normalizedEvents.length,
        duplicatesRemoved,
        invalidEventsRemoved: invalidRemoved,
        relationshipsResolved,
      }

      const output: NormalizationOutput = {
        events: normalizedEvents,
        normalizedContext,
        statistics,
      }

      // Record diagnostics
      context.diagnostics.stages.push({
        stage: 'normalization',
        startTime,
        endTime: Date.now(),
        durationMs: Date.now() - startTime,
        status: 'success',
        modulesExecuted: ['deduplication', 'validation', 'relationship_resolution'],
        warnings: issues.filter(i => i.severity === 'low').map(i => i.description),
      })

      return { success: true, data: output }
    } catch (error) {
      context.diagnostics.errors.push({
        stage: 'normalization',
        code: 'NORMALIZATION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
        error: error instanceof Error ? error : undefined,
        recoverable: false,
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Normalization failed',
      }
    }
  }

  private removeDuplicates(events: OperationalEvent[]): OperationalEvent[] {
    const seen = new Set<string>()
    return events.filter(event => {
      const key = `${event.id}_${event.timestamp}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  private validateEvents(
    events: OperationalEvent[],
    issues: DataQualityIssue[]
  ): OperationalEvent[] {
    const valid: OperationalEvent[] = []
    let missingData = 0
    let invalidData = 0

    for (const event of events) {
      // Required fields
      if (!event.id || !event.timestamp || !event.type) {
        invalidData++
        continue
      }

      // Validate timestamp
      const timestamp = new Date(event.timestamp)
      if (isNaN(timestamp.getTime())) {
        invalidData++
        continue
      }

      // Check for missing critical data
      if (!event.category) {
        missingData++
      }

      valid.push(event)
    }

    if (missingData > 0) {
      issues.push({
        type: 'missing_data',
        severity: 'medium',
        description: `${missingData} events missing category`,
        affectedCount: missingData,
      })
    }

    if (invalidData > 0) {
      issues.push({
        type: 'invalid_data',
        severity: 'high',
        description: `${invalidData} events with invalid data removed`,
        affectedCount: invalidData,
      })
    }

    return valid
  }

  private resolveRelationships(events: OperationalEvent[]): OperationalEvent[] {
    const orderMap = new Map<string, string>()
    const staffMap = new Map<string, string>()
    const stationMap = new Map<string, string>()

    // First pass: collect IDs
    for (const event of events) {
      if (event.orderId && event.orderNumber) {
        orderMap.set(event.orderId, event.orderNumber)
      }
      if (event.staffId && event.staffName) {
        staffMap.set(event.staffId, event.staffName)
      }
      if (event.stationId && event.stationName) {
        stationMap.set(event.stationId, event.stationName)
      }
    }

    // Second pass: fill in missing names
    return events.map(event => {
      const normalized = { ...event }

      if (event.orderId && !event.orderNumber) {
        normalized.orderNumber = orderMap.get(event.orderId)
      }
      if (event.staffId && !event.staffName) {
        normalized.staffName = staffMap.get(event.staffId)
      }
      if (event.stationId && !event.stationName) {
        normalized.stationName = stationMap.get(event.stationId)
      }

      return normalized
    })
  }

  private countRelationships(events: OperationalEvent[]): number {
    let count = 0
    for (const event of events) {
      if (event.orderId) count++
      if (event.staffId) count++
      if (event.stationId) count++
      if (event.tableId) count++
    }
    return count
  }

  private buildContext(
    events: OperationalEvent[],
    context: PipelineContext
  ): NormalizedContext {
    const orderIds = new Set<string>()
    const staffIds = new Set<string>()
    const stationIds = new Set<string>()
    const tableIds = new Set<string>()
    const eventTypes = new Set<string>()

    for (const event of events) {
      if (event.orderId) orderIds.add(event.orderId)
      if (event.staffId) staffIds.add(event.staffId)
      if (event.stationId) stationIds.add(event.stationId)
      if (event.tableId) tableIds.add(event.tableId)
      eventTypes.add(event.type)
    }

    const timeSpan = events.length > 0
      ? (new Date(events[events.length - 1].timestamp).getTime() - 
         new Date(events[0].timestamp).getTime()) / 60000
      : 0

    return {
      totalEvents: events.length,
      totalOrders: orderIds.size,
      uniqueStaff: staffIds.size,
      uniqueStations: stationIds.size,
      uniqueTables: tableIds.size,
      timeSpanMinutes: timeSpan,
      eventTypes: Array.from(eventTypes),
      dataQuality: { completeness: 0, consistency: 0, validity: 0, issues: [] },
    }
  }

  private calculateDataQuality(
    events: OperationalEvent[],
    issues: DataQualityIssue[]
  ): DataQuality {
    const total = events.length
    if (total === 0) {
      return { completeness: 0, consistency: 0, validity: 1, issues }
    }

    // Completeness: percentage of events with all optional fields
    let complete = 0
    for (const event of events) {
      const hasOrder = !!event.orderId
      const hasStaff = !!event.staffId
      const hasStation = !!event.stationId
      const hasCategory = !!event.category
      if (hasOrder && hasStaff && hasStation && hasCategory) complete++
    }
    const completeness = complete / total

    // Consistency: percentage of events with matching IDs and names
    let consistent = 0
    for (const event of events) {
      const orderMatch = !event.orderId || !!event.orderNumber
      const staffMatch = !event.staffId || !!event.staffName
      const stationMatch = !event.stationId || !!event.stationName
      if (orderMatch && staffMatch && stationMatch) consistent++
    }
    const consistency = consistent / total

    // Validity: 100% since invalid events were removed
    const validity = 1.0

    return { completeness, consistency, validity, issues }
  }
}
