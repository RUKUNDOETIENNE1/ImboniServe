/**
 * Hospitality Intelligence Platform v1.0
 * Base Intelligence Service
 * 
 * Provides shared orchestration for all intelligence modules.
 * Extracts common responsibilities while preserving module-specific logic.
 */

import { getOperationalEvents, buildTimeRange } from './integration-helper'
import type { TimeRange, OperationalEvent } from './types'

/**
 * Standard diagnostics structure for all intelligence services
 */
export interface IntelligenceDiagnostics {
  reportsRetrieved: number
  historicalQueriesExecuted: number
  comparisonPerformed: boolean
  totalTime: number
  reportRetrievalTime: number
  historicalRetrievalTime: number
  comparisonTime: number
  buildTime: number
}

/**
 * Standard request structure
 */
export interface BaseIntelligenceRequest {
  businessId: string
  selection: {
    period: string
    customRange?: {
      start: Date
      end: Date
    }
  }
}

/**
 * Standard response structure
 */
export interface BaseIntelligenceResponse<TReport> {
  success: boolean
  report?: TReport
  error?: string
  diagnostics: IntelligenceDiagnostics
}

/**
 * Base Intelligence Service
 * 
 * Provides shared orchestration logic:
 * - Request validation
 * - Time range construction
 * - Event retrieval
 * - Error handling
 * - Diagnostics tracking
 * 
 * Delegates to subclasses:
 * - Aggregation logic
 * - Insight generation
 * - Report building
 */
export abstract class BaseIntelligenceService<TRequest extends BaseIntelligenceRequest, TReport, TResponse extends BaseIntelligenceResponse<TReport>> {
  
  /**
   * Generate intelligence report
   * 
   * Template method that orchestrates the intelligence generation flow
   */
  async generateReport(request: TRequest): Promise<TResponse> {
    const startTime = Date.now()
    const diagnostics = this.createDiagnostics()

    try {
      // Step 1: Validate request
      this.validateRequest(request)

      // Step 2: Build time range
      const timeRange = this.buildTimeRangeForRequest(request)

      // Step 3: Retrieve events
      const events = await this.retrieveEvents(request, timeRange)

      // Note: We allow empty event arrays - modules can handle them appropriately
      // This matches the behavior of certified modules

      // Step 4: Build report (delegated to subclass)
      const buildStart = Date.now()
      const report = await this.buildReport(request, events, timeRange)
      diagnostics.buildTime = Date.now() - buildStart

      // Step 5: Calculate total time
      diagnostics.totalTime = Date.now() - startTime

      // Step 6: Return success response
      return this.createSuccessResponse(report, diagnostics)
    } catch (error) {
      diagnostics.totalTime = Date.now() - startTime
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Unknown error',
        diagnostics
      )
    }
  }

  /**
   * Create initial diagnostics object
   */
  protected createDiagnostics(): IntelligenceDiagnostics {
    return {
      reportsRetrieved: 0,
      historicalQueriesExecuted: 0,
      comparisonPerformed: false,
      totalTime: 0,
      reportRetrievalTime: 0,
      historicalRetrievalTime: 0,
      comparisonTime: 0,
      buildTime: 0,
    }
  }

  /**
   * Validate request (can be overridden for custom validation)
   */
  protected validateRequest(request: TRequest): void {
    if (!request.businessId) {
      throw new Error('businessId is required')
    }
    if (!request.selection) {
      throw new Error('selection is required')
    }
  }

  /**
   * Build time range from request
   */
  protected buildTimeRangeForRequest(request: TRequest): TimeRange {
    return buildTimeRange(request.selection.period, request.selection.customRange)
  }

  /**
   * Retrieve operational events
   * Can be overridden to filter by specific event types
   */
  protected async retrieveEvents(
    request: TRequest,
    timeRange: TimeRange
  ): Promise<OperationalEvent[]> {
    const eventTypes = this.getEventTypes()
    
    return await getOperationalEvents({
      businessId: request.businessId,
      timeRange: {
        start: timeRange.start,
        end: timeRange.end,
      },
      eventTypes,
    })
  }

  /**
   * Get event types to filter (override in subclass)
   */
  protected getEventTypes(): string[] | undefined {
    return undefined // No filtering by default
  }

  /**
   * Build report from events (must be implemented by subclass)
   * 
   * This is where module-specific logic lives:
   * - Aggregation
   * - Insight generation
   * - Report structure
   */
  protected abstract buildReport(
    request: TRequest,
    events: OperationalEvent[],
    timeRange: TimeRange
  ): Promise<TReport>

  /**
   * Create success response (must be implemented by subclass)
   */
  protected abstract createSuccessResponse(
    report: TReport,
    diagnostics: IntelligenceDiagnostics
  ): TResponse

  /**
   * Create error response (must be implemented by subclass)
   */
  protected abstract createErrorResponse(
    error: string,
    diagnostics: IntelligenceDiagnostics
  ): TResponse

  /**
   * Calculate confidence score (shared logic)
   */
  protected calculateConfidence(eventCount: number, hasMetrics: boolean): number {
    const eventConfidence = Math.min(1, eventCount / 100)
    const metricConfidence = hasMetrics ? 0.8 : 0.5
    return (eventConfidence + metricConfidence) / 2
  }

  /**
   * Format duration for display (shared utility)
   */
  protected formatDuration(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  }
}
