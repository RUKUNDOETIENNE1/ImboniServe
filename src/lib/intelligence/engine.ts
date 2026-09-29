/**
 * Hospitality Intelligence Engine (HIE) - Main Orchestrator
 * 
 * Coordinates all analysis modules to generate comprehensive intelligence reports.
 * Domain-agnostic design allows multiple consumers (Service Intelligence, Daily Briefings, etc.)
 */

import type {
  IntelligenceContext,
  IntelligenceReport,
  OperationalEvent,
  EngineConfig,
  IntelligencePlugin,
  EngineResult,
} from './types'
import { calculateGrade } from './types'
import { EvidenceCollector } from './evidence'
import { ScoringEngine } from './scoring'
import { ProblemDetectionEngine } from './problems'
import { HighlightDetectionEngine } from './highlights'
import { RootCauseEngine } from './root-causes'
import { RecommendationEngine } from './recommendations'
import { PatternDetectionEngine } from './patterns'
import { ComparisonEngine, calculatePreviousTimeRange } from './comparisons'
import { StaffAnalyzer } from './staff'
import { KitchenAnalyzer } from './kitchen'
import { CustomerJourneyAnalyzer } from './customer-journey'

// ─────────────────────────────────────────────────────────────────────────────
// Main Intelligence Engine
// ─────────────────────────────────────────────────────────────────────────────

export class HospitalityIntelligenceEngine {
  private config: EngineConfig
  private plugins: IntelligencePlugin[] = []

  private scoringEngine?: ScoringEngine
  private problemEngine?: ProblemDetectionEngine
  private highlightEngine?: HighlightDetectionEngine
  private rootCauseEngine?: RootCauseEngine
  private recommendationEngine?: RecommendationEngine
  private patternEngine?: PatternDetectionEngine
  private comparisonEngine?: ComparisonEngine
  private staffAnalyzer?: StaffAnalyzer
  private kitchenAnalyzer?: KitchenAnalyzer
  private journeyAnalyzer?: CustomerJourneyAnalyzer

  constructor(config: EngineConfig = {}) {
    this.config = config
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Module Registration
  // ───────────────────────────────────────────────────────────────────────────

  setScoringEngine(engine: ScoringEngine): void {
    this.scoringEngine = engine
  }

  setProblemDetectionEngine(engine: ProblemDetectionEngine): void {
    this.problemEngine = engine
  }

  setHighlightDetectionEngine(engine: HighlightDetectionEngine): void {
    this.highlightEngine = engine
  }

  setRootCauseEngine(engine: RootCauseEngine): void {
    this.rootCauseEngine = engine
  }

  setRecommendationEngine(engine: RecommendationEngine): void {
    this.recommendationEngine = engine
  }

  setPatternDetectionEngine(engine: PatternDetectionEngine): void {
    this.patternEngine = engine
  }

  setComparisonEngine(engine: ComparisonEngine): void {
    this.comparisonEngine = engine
  }

  setStaffAnalyzer(analyzer: StaffAnalyzer): void {
    this.staffAnalyzer = analyzer
  }

  setKitchenAnalyzer(analyzer: KitchenAnalyzer): void {
    this.kitchenAnalyzer = analyzer
  }

  setCustomerJourneyAnalyzer(analyzer: CustomerJourneyAnalyzer): void {
    this.journeyAnalyzer = analyzer
  }

  registerPlugin(plugin: IntelligencePlugin): void {
    this.plugins.push(plugin)
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Main Analysis Method
  // ───────────────────────────────────────────────────────────────────────────

  async analyze(
    context: IntelligenceContext,
    events: OperationalEvent[],
    previousEvents?: OperationalEvent[]
  ): Promise<EngineResult<IntelligenceReport>> {
    const startTime = Date.now()

    try {
      const evidence = new EvidenceCollector(events)
      const scope = context.scope || {}
      const modulesRun: string[] = []

      let report: Partial<IntelligenceReport> = {
        id: `intel_${context.businessId}_${Date.now()}`,
        businessId: context.businessId,
        generatedAt: new Date().toISOString(),
        timeRange: context.timeRange,
      }

      // Scoring
      if (scope.scoring !== false && this.scoringEngine) {
        const previousScore = previousEvents ? 
          (await this.scoringEngine.calculateScore(previousEvents)).overall : undefined
        report.score = await this.scoringEngine.calculateScore(events, previousScore)
        report.grade = calculateGrade(report.score.overall)
        modulesRun.push('scoring')
      }

      // Problem Detection
      if (scope.problems !== false && this.problemEngine) {
        let problems = await this.problemEngine.detectProblems(events, {
          businessId: context.businessId,
          timeRange: context.timeRange,
          thresholds: this.config.problemThresholds?.byType,
        })

        // Root Cause Analysis
        if (scope.rootCauses !== false && this.rootCauseEngine) {
          problems = await this.rootCauseEngine.analyzeProblems(problems, events)
          modulesRun.push('root_causes')
        }

        report.problems = problems
        modulesRun.push('problems')
      }

      // Highlight Detection
      if (scope.highlights !== false && this.highlightEngine) {
        report.highlights = await this.highlightEngine.detectHighlights(events, {
          businessId: context.businessId,
          timeRange: context.timeRange,
          benchmarks: this.config.scoring?.dimensions.reduce((acc, d) => {
            acc[d.id] = d.benchmark
            return acc
          }, {} as Record<string, number>),
        })
        modulesRun.push('highlights')
      }

      // Pattern Detection
      if (scope.patterns !== false && this.patternEngine) {
        report.patterns = await this.patternEngine.detectPatterns(events, {
          businessId: context.businessId,
          timeRange: context.timeRange,
          minOccurrences: this.config.patternDetection?.minOccurrences,
          minConfidence: this.config.patternDetection?.minConfidence,
        })
        modulesRun.push('patterns')
      }

      // Recommendations
      if (scope.recommendations !== false && this.recommendationEngine) {
        report.recommendations = await this.recommendationEngine.generateRecommendations({
          problems: report.problems || [],
          patterns: report.patterns || [],
          events,
          businessId: context.businessId,
        })
        modulesRun.push('recommendations')
      }

      // Staff Analysis
      if (scope.staff !== false && this.staffAnalyzer) {
        report.staffAnalysis = await this.staffAnalyzer.analyze(events)
        modulesRun.push('staff')
      }

      // Kitchen Analysis
      if (scope.kitchen !== false && this.kitchenAnalyzer) {
        report.kitchenAnalysis = await this.kitchenAnalyzer.analyze(events, context.timeRange)
        modulesRun.push('kitchen')
      }

      // Customer Journey Analysis
      if (scope.customerJourney !== false && this.journeyAnalyzer) {
        report.customerJourneyAnalysis = await this.journeyAnalyzer.analyze(events)
        modulesRun.push('customer_journey')
      }

      // Comparison
      if (scope.comparisons !== false && context.comparisonPeriod && previousEvents && this.comparisonEngine) {
        const previousRange = calculatePreviousTimeRange(context.timeRange, context.comparisonPeriod)
        report.comparison = await this.comparisonEngine.compare(
          events,
          previousEvents,
          context.comparisonPeriod,
          context.timeRange,
          previousRange
        )
        modulesRun.push('comparisons')
      }

      // Run plugins
      for (const plugin of this.plugins) {
        report = await plugin.analyze(context, events, report)
        modulesRun.push(`plugin:${plugin.id}`)
      }

      // Generate summary
      if (!report.summary) {
        report.summary = this.generateSummary(report)
      }

      // Add metadata
      const processingTime = Date.now() - startTime
      report.metadata = {
        eventCount: evidence.totalEvents,
        orderCount: evidence.totalOrders,
        confidence: this.calculateConfidence(report, evidence.totalEvents),
        processingTimeMs: processingTime,
        analysisVersion: '1.0.0',
        modulesRun,
      }

      return {
        success: true,
        data: report as IntelligenceReport,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'ANALYSIS_FAILED',
      }
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Helper Methods
  // ───────────────────────────────────────────────────────────────────────────

  private generateSummary(report: Partial<IntelligenceReport>): string {
    const parts: string[] = []

    if (report.score) {
      parts.push(`Overall score: ${report.score.overall}/100 (${report.grade})`)
    }

    if (report.problems && report.problems.length > 0) {
      const critical = report.problems.filter(p => p.severity === 'critical').length
      if (critical > 0) {
        parts.push(`${critical} critical issue${critical > 1 ? 's' : ''}`)
      } else {
        parts.push(`${report.problems.length} issue${report.problems.length > 1 ? 's' : ''} detected`)
      }
    }

    if (report.highlights && report.highlights.length > 0) {
      parts.push(`${report.highlights.length} highlight${report.highlights.length > 1 ? 's' : ''}`)
    }

    if (report.recommendations && report.recommendations.length > 0) {
      parts.push(`${report.recommendations.length} recommendation${report.recommendations.length > 1 ? 's' : ''}`)
    }

    return parts.length > 0 ? parts.join('. ') : 'Analysis complete'
  }

  private calculateConfidence(report: Partial<IntelligenceReport>, eventCount: number): number {
    let confidence = 0.5

    if (eventCount > 100) confidence += 0.2
    if (eventCount > 500) confidence += 0.1
    if (eventCount > 1000) confidence += 0.1

    if (report.problems && report.problems.length > 0) confidence += 0.05
    if (report.patterns && report.patterns.length > 0) confidence += 0.05

    return Math.min(1, confidence)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory Function
// ─────────────────────────────────────────────────────────────────────────────

export function createIntelligenceEngine(config?: EngineConfig): HospitalityIntelligenceEngine {
  return new HospitalityIntelligenceEngine(config)
}
