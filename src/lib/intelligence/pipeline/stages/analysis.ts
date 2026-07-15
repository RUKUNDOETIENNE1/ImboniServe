/**
 * Hospitality Intelligence Engine (HIE) - Analysis Stage
 * 
 * Stage 2: Run all analysis modules (staff, kitchen, journey, patterns, problems, highlights).
 */

import type {
  PipelineContext,
  IPipelineStage,
  StageResult,
  NormalizationOutput,
  AnalysisOutput,
  RawMetrics,
} from '../types'
import type { OperationalEvent } from '../../types'
import { StaffAnalyzer } from '../../staff'
import { KitchenAnalyzer } from '../../kitchen'
import { CustomerJourneyAnalyzer } from '../../customer-journey'
import { PatternDetectionEngine } from '../../patterns'
import { ProblemDetectionEngine } from '../../problems'
import { HighlightDetectionEngine } from '../../highlights'
import { ComparisonEngine, calculatePreviousTimeRange } from '../../comparisons'

export class AnalysisStage implements IPipelineStage<NormalizationOutput, AnalysisOutput> {
  name = 'analysis' as const

  constructor(
    private staffAnalyzer?: StaffAnalyzer,
    private kitchenAnalyzer?: KitchenAnalyzer,
    private journeyAnalyzer?: CustomerJourneyAnalyzer,
    private patternEngine?: PatternDetectionEngine,
    private problemEngine?: ProblemDetectionEngine,
    private highlightEngine?: HighlightDetectionEngine,
    private comparisonEngine?: ComparisonEngine
  ) {}

  async execute(
    input: NormalizationOutput,
    context: PipelineContext
  ): Promise<StageResult<AnalysisOutput>> {
    const startTime = Date.now()
    const modulesExecuted: string[] = []
    const warnings: string[] = []

    try {
      const { events } = input
      const scope = context.scope
      const output: AnalysisOutput = {
        rawMetrics: {},
      }

      // Staff Analysis
      if (scope.staff !== false && this.staffAnalyzer) {
        try {
          output.staff = await this.staffAnalyzer.analyze(events)
          modulesExecuted.push('staff')
        } catch (error) {
          warnings.push(`Staff analysis failed: ${error instanceof Error ? error.message : 'Unknown'}`)
          context.diagnostics.warnings.push({
            stage: 'analysis',
            code: 'STAFF_ANALYSIS_FAILED',
            message: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      // Kitchen Analysis
      if (scope.kitchen !== false && this.kitchenAnalyzer) {
        try {
          output.kitchen = await this.kitchenAnalyzer.analyze(events, context.timeRange)
          modulesExecuted.push('kitchen')
        } catch (error) {
          warnings.push(`Kitchen analysis failed: ${error instanceof Error ? error.message : 'Unknown'}`)
          context.diagnostics.warnings.push({
            stage: 'analysis',
            code: 'KITCHEN_ANALYSIS_FAILED',
            message: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      // Customer Journey Analysis
      if (scope.customerJourney !== false && this.journeyAnalyzer) {
        try {
          output.customerJourney = await this.journeyAnalyzer.analyze(events)
          modulesExecuted.push('customer_journey')
        } catch (error) {
          warnings.push(`Journey analysis failed: ${error instanceof Error ? error.message : 'Unknown'}`)
          context.diagnostics.warnings.push({
            stage: 'analysis',
            code: 'JOURNEY_ANALYSIS_FAILED',
            message: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      // Pattern Detection
      if (scope.patterns !== false && this.patternEngine) {
        try {
          output.patterns = await this.patternEngine.detectPatterns(events, {
            businessId: context.businessId,
            timeRange: context.timeRange,
            minOccurrences: context.config.patternDetection?.minOccurrences,
            minConfidence: context.config.patternDetection?.minConfidence,
          })
          modulesExecuted.push('patterns')
        } catch (error) {
          warnings.push(`Pattern detection failed: ${error instanceof Error ? error.message : 'Unknown'}`)
          context.diagnostics.warnings.push({
            stage: 'analysis',
            code: 'PATTERN_DETECTION_FAILED',
            message: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      // Problem Detection
      if (scope.problems !== false && this.problemEngine) {
        try {
          output.problems = await this.problemEngine.detectProblems(events, {
            businessId: context.businessId,
            timeRange: context.timeRange,
            thresholds: context.config.problemThresholds,
          })
          modulesExecuted.push('problems')
        } catch (error) {
          warnings.push(`Problem detection failed: ${error instanceof Error ? error.message : 'Unknown'}`)
          context.diagnostics.warnings.push({
            stage: 'analysis',
            code: 'PROBLEM_DETECTION_FAILED',
            message: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      // Highlight Detection
      if (scope.highlights !== false && this.highlightEngine) {
        try {
          output.highlights = await this.highlightEngine.detectHighlights(events, {
            businessId: context.businessId,
            timeRange: context.timeRange,
            benchmarks: context.config.scoring?.dimensions.reduce((acc, d) => {
              acc[d.id] = d.benchmark
              return acc
            }, {} as Record<string, number>),
          })
          modulesExecuted.push('highlights')
        } catch (error) {
          warnings.push(`Highlight detection failed: ${error instanceof Error ? error.message : 'Unknown'}`)
          context.diagnostics.warnings.push({
            stage: 'analysis',
            code: 'HIGHLIGHT_DETECTION_FAILED',
            message: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      // Comparison (if previous events provided)
      if (scope.comparisons !== false && context.comparisonPeriod && this.comparisonEngine) {
        const previousEvents = context.cache.get('previousEvents') as OperationalEvent[] | undefined
        if (previousEvents) {
          try {
            const previousRange = calculatePreviousTimeRange(context.timeRange, context.comparisonPeriod)
            output.comparison = await this.comparisonEngine.compare(
              events,
              previousEvents,
              context.comparisonPeriod,
              context.timeRange,
              previousRange
            )
            modulesExecuted.push('comparison')
          } catch (error) {
            warnings.push(`Comparison failed: ${error instanceof Error ? error.message : 'Unknown'}`)
            context.diagnostics.warnings.push({
              stage: 'analysis',
              code: 'COMPARISON_FAILED',
              message: error instanceof Error ? error.message : 'Unknown error',
            })
          }
        }
      }

      // Collect raw metrics
      output.rawMetrics = this.collectRawMetrics(output, input)

      // Record diagnostics
      context.diagnostics.stages.push({
        stage: 'analysis',
        startTime,
        endTime: Date.now(),
        durationMs: Date.now() - startTime,
        status: warnings.length > 0 ? 'partial' : 'success',
        modulesExecuted,
        warnings,
      })

      return {
        success: true,
        data: output,
        warnings: warnings.length > 0 ? warnings : undefined,
        partial: warnings.length > 0,
      }
    } catch (error) {
      context.diagnostics.errors.push({
        stage: 'analysis',
        code: 'ANALYSIS_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
        error: error instanceof Error ? error : undefined,
        recoverable: true,
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
      }
    }
  }

  private collectRawMetrics(output: AnalysisOutput, input: NormalizationOutput): RawMetrics {
    const metrics: RawMetrics = {
      totalEvents: input.normalizedContext.totalEvents,
      totalOrders: input.normalizedContext.totalOrders,
      uniqueStaff: input.normalizedContext.uniqueStaff,
      uniqueStations: input.normalizedContext.uniqueStations,
      timeSpanMinutes: input.normalizedContext.timeSpanMinutes,
    }

    if (output.staff) {
      metrics.staffCount = output.staff.totalStaff
      metrics.topPerformerEfficiency = output.staff.topPerformer?.efficiency ?? null
    }

    if (output.kitchen) {
      metrics.kitchenUtilization = output.kitchen.overallUtilization
      metrics.peakQueueSize = output.kitchen.peakLoad.queueSize
    }

    if (output.customerJourney) {
      metrics.avgJourneyMinutes = output.customerJourney.averageJourneyDurationMinutes
      metrics.bottleneckCount = output.customerJourney.bottlenecks.length
    }

    if (output.patterns) {
      metrics.patternsDetected = output.patterns.length
    }

    if (output.problems) {
      metrics.problemsDetected = output.problems.length
      metrics.criticalProblems = output.problems.filter(p => p.severity === 'critical').length
    }

    if (output.highlights) {
      metrics.highlightsDetected = output.highlights.length
    }

    return metrics
  }
}
