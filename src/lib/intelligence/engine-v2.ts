/**
 * Hospitality Intelligence Engine (HIE) - V2 Engine with Pipeline
 * 
 * Simplified public API that uses the Intelligence Pipeline internally.
 */

import type {
  IntelligenceContext,
  OperationalEvent,
  EngineConfig,
} from './types'
import type {
  PipelineContext,
  PipelineConfig,
  PipelineDiagnostics,
  StructuredIntelligenceReport,
} from './pipeline/types'
import { IntelligencePipeline, createPipeline } from './pipeline'
import { NormalizationStage } from './pipeline/stages/normalization'
import { AnalysisStage } from './pipeline/stages/analysis'
import { ScoringStage } from './pipeline/stages/scoring'
import { ExplanationStage } from './pipeline/stages/explanation'
import { RecommendationStage } from './pipeline/stages/recommendation'
import { PublishingStage } from './pipeline/stages/publishing'
import { ScoringEngine } from './scoring'
import { ProblemDetectionEngine } from './problems'
import { HighlightDetectionEngine } from './highlights'
import { RootCauseEngine } from './root-causes'
import { RecommendationEngine } from './recommendations'
import { PatternDetectionEngine } from './patterns'
import { ComparisonEngine } from './comparisons'
import { StaffAnalyzer } from './staff'
import { KitchenAnalyzer } from './kitchen'
import { CustomerJourneyAnalyzer } from './customer-journey'

// ─────────────────────────────────────────────────────────────────────────────
// Main Engine V2
// ─────────────────────────────────────────────────────────────────────────────

export class HospitalityIntelligenceEngineV2 {
  private pipeline: IntelligencePipeline
  private config: EngineConfig

  constructor(config: EngineConfig = {}) {
    this.config = config
    this.pipeline = this.buildPipeline()
  }

  /**
   * Generate a Structured Intelligence Report.
   * 
   * This is the primary public API.
   * Returns structured data only - NO natural language prose.
   */
  async generateReport(
    context: IntelligenceContext,
    events: OperationalEvent[],
    previousEvents?: OperationalEvent[]
  ): Promise<IntelligenceResult> {
    try {
      // Build pipeline context
      const pipelineContext = this.buildPipelineContext(context)

      // Execute pipeline
      const result = await this.pipeline.execute(events, pipelineContext, previousEvents)

      if (!result.success || !result.report) {
        return {
          success: false,
          error: result.error || 'Report generation failed',
        }
      }

      return {
        success: true,
        report: result.report,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Serialize report to JSON.
   */
  serializeReport(report: StructuredIntelligenceReport): string {
    return JSON.stringify(report, this.jsonReplacer, 2)
  }

  /**
   * Deserialize report from JSON.
   */
  deserializeReport(json: string): StructuredIntelligenceReport {
    return JSON.parse(json, this.jsonReviver)
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Private Methods
  // ───────────────────────────────────────────────────────────────────────────

  private buildPipeline(): IntelligencePipeline {
    // Create analysis modules
    const scoringEngine = this.config.scoring
      ? new ScoringEngine(this.config.scoring)
      : undefined

    const problemEngine = new ProblemDetectionEngine()
    const highlightEngine = new HighlightDetectionEngine()
    const rootCauseEngine = new RootCauseEngine()
    const recommendationEngine = new RecommendationEngine()
    const patternEngine = new PatternDetectionEngine()
    const comparisonEngine = new ComparisonEngine()
    const staffAnalyzer = new StaffAnalyzer()
    const kitchenAnalyzer = new KitchenAnalyzer()
    const journeyAnalyzer = new CustomerJourneyAnalyzer()

    // Create stages
    const normalizationStage = new NormalizationStage()
    const analysisStage = new AnalysisStage(
      staffAnalyzer,
      kitchenAnalyzer,
      journeyAnalyzer,
      patternEngine,
      problemEngine,
      highlightEngine,
      comparisonEngine
    )
    const scoringStage = new ScoringStage(scoringEngine)
    const explanationStage = new ExplanationStage(rootCauseEngine)
    const recommendationStage = new RecommendationStage(recommendationEngine)
    const publishingStage = new PublishingStage()

    // Build pipeline
    return createPipeline()
      .withNormalizationStage(normalizationStage)
      .withAnalysisStage(analysisStage)
      .withScoringStage(scoringStage)
      .withExplanationStage(explanationStage)
      .withRecommendationStage(recommendationStage)
      .withPublishingStage(publishingStage)
      .build()
  }

  private buildPipelineContext(context: IntelligenceContext): PipelineContext {
    const pipelineConfig: PipelineConfig = {
      scoring: this.config.scoring,
      problemThresholds: this.config.problemThresholds?.byType,
      patternDetection: this.config.patternDetection,
      comparison: this.config.comparison,
    }

    const diagnostics: PipelineDiagnostics = {
      startTime: Date.now(),
      stages: [],
      warnings: [],
      errors: [],
      skippedAnalyses: [],
      confidenceDegradations: [],
    }

    return {
      businessId: context.businessId,
      timeRange: context.timeRange,
      timezone: context.timezone,
      locale: context.locale,
      scope: context.scope || {},
      comparisonPeriod: context.comparisonPeriod,
      cache: new Map(),
      config: pipelineConfig,
      diagnostics,
      metadata: context.consumerConfig,
    }
  }

  private jsonReplacer(key: string, value: any): any {
    // Convert Maps to objects for JSON serialization
    if (value instanceof Map) {
      return {
        __type: 'Map',
        value: Array.from(value.entries()),
      }
    }
    return value
  }

  private jsonReviver(key: string, value: any): any {
    // Restore Maps from JSON
    if (value && value.__type === 'Map') {
      return new Map(value.value)
    }
    return value
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Result Type
// ─────────────────────────────────────────────────────────────────────────────

export interface IntelligenceResult {
  success: boolean
  report?: StructuredIntelligenceReport
  error?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory Function
// ─────────────────────────────────────────────────────────────────────────────

export function createIntelligenceEngineV2(config?: EngineConfig): HospitalityIntelligenceEngineV2 {
  return new HospitalityIntelligenceEngineV2(config)
}
