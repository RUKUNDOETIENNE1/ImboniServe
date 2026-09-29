/**
 * Hospitality Intelligence Engine (HIE) - Intelligence Pipeline
 * 
 * Orchestrates the 6-stage intelligence generation process:
 * 1. Normalization → 2. Analysis → 3. Scoring → 4. Explanation → 5. Recommendation → 6. Publishing
 */

import type {
  IIntelligencePipeline,
  PipelineContext,
  PipelineResult,
  PipelineDiagnostics,
  StructuredIntelligenceReport,
} from './types'
import type { OperationalEvent } from '../types'
import { NormalizationStage } from './stages/normalization'
import { AnalysisStage } from './stages/analysis'
import { ScoringStage } from './stages/scoring'
import { ExplanationStage } from './stages/explanation'
import { RecommendationStage } from './stages/recommendation'
import { PublishingStage } from './stages/publishing'

export class IntelligencePipeline implements IIntelligencePipeline {
  private normalizationStage: NormalizationStage
  private analysisStage: AnalysisStage
  private scoringStage: ScoringStage
  private explanationStage: ExplanationStage
  private recommendationStage: RecommendationStage
  private publishingStage: PublishingStage

  constructor(
    normalizationStage: NormalizationStage,
    analysisStage: AnalysisStage,
    scoringStage: ScoringStage,
    explanationStage: ExplanationStage,
    recommendationStage: RecommendationStage,
    publishingStage: PublishingStage
  ) {
    this.normalizationStage = normalizationStage
    this.analysisStage = analysisStage
    this.scoringStage = scoringStage
    this.explanationStage = explanationStage
    this.recommendationStage = recommendationStage
    this.publishingStage = publishingStage
  }

  async execute(
    events: OperationalEvent[],
    context: PipelineContext,
    previousEvents?: OperationalEvent[]
  ): Promise<PipelineResult> {
    try {
      // Initialize diagnostics
      context.diagnostics.startTime = Date.now()

      // Store previous events in cache if provided
      if (previousEvents) {
        context.cache.set('previousEvents', previousEvents)
      }

      // Stage 1: Normalization
      const normalizationResult = await this.normalizationStage.execute(events, context)
      if (!normalizationResult.success || !normalizationResult.data) {
        return {
          success: false,
          error: normalizationResult.error || 'Normalization failed',
        }
      }

      // Cache normalized events
      context.cache.set('normalizedEvents', normalizationResult.data.events)
      context.cache.set('normalizedContext', normalizationResult.data.normalizedContext)

      // Stage 2: Analysis
      const analysisResult = await this.analysisStage.execute(normalizationResult.data, context)
      if (!analysisResult.success || !analysisResult.data) {
        return {
          success: false,
          error: analysisResult.error || 'Analysis failed',
        }
      }

      // Stage 3: Scoring
      const scoringResult = await this.scoringStage.execute(analysisResult.data, context)
      if (!scoringResult.success || !scoringResult.data) {
        return {
          success: false,
          error: scoringResult.error || 'Scoring failed',
        }
      }

      // Stage 4: Explanation
      const explanationResult = await this.explanationStage.execute(
        {
          scoring: scoringResult.data,
          analysis: analysisResult.data,
        },
        context
      )
      if (!explanationResult.success || !explanationResult.data) {
        return {
          success: false,
          error: explanationResult.error || 'Explanation failed',
        }
      }

      // Stage 5: Recommendation
      const recommendationResult = await this.recommendationStage.execute(
        {
          analysis: analysisResult.data,
          explanation: explanationResult.data,
        },
        context
      )
      if (!recommendationResult.success || !recommendationResult.data) {
        return {
          success: false,
          error: recommendationResult.error || 'Recommendation failed',
        }
      }

      // Stage 6: Publishing
      const publishingResult = await this.publishingStage.execute(
        {
          normalization: normalizationResult.data,
          analysis: analysisResult.data,
          scoring: scoringResult.data,
          explanation: explanationResult.data,
          recommendation: recommendationResult.data,
        },
        context
      )

      if (!publishingResult.success || !publishingResult.data) {
        return {
          success: false,
          error: publishingResult.error || 'Publishing failed',
        }
      }

      return {
        success: true,
        report: publishingResult.data,
      }
    } catch (error) {
      context.diagnostics.errors.push({
        stage: 'normalization',
        code: 'PIPELINE_FAILED',
        message: error instanceof Error ? error.message : 'Unknown pipeline error',
        error: error instanceof Error ? error : undefined,
        recoverable: false,
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Pipeline execution failed',
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline Builder
// ─────────────────────────────────────────────────────────────────────────────

export class PipelineBuilder {
  private normalizationStage?: NormalizationStage
  private analysisStage?: AnalysisStage
  private scoringStage?: ScoringStage
  private explanationStage?: ExplanationStage
  private recommendationStage?: RecommendationStage
  private publishingStage?: PublishingStage

  withNormalizationStage(stage: NormalizationStage): this {
    this.normalizationStage = stage
    return this
  }

  withAnalysisStage(stage: AnalysisStage): this {
    this.analysisStage = stage
    return this
  }

  withScoringStage(stage: ScoringStage): this {
    this.scoringStage = stage
    return this
  }

  withExplanationStage(stage: ExplanationStage): this {
    this.explanationStage = stage
    return this
  }

  withRecommendationStage(stage: RecommendationStage): this {
    this.recommendationStage = stage
    return this
  }

  withPublishingStage(stage: PublishingStage): this {
    this.publishingStage = stage
    return this
  }

  build(): IntelligencePipeline {
    if (!this.normalizationStage) {
      this.normalizationStage = new NormalizationStage()
    }
    if (!this.analysisStage) {
      this.analysisStage = new AnalysisStage()
    }
    if (!this.scoringStage) {
      this.scoringStage = new ScoringStage()
    }
    if (!this.explanationStage) {
      this.explanationStage = new ExplanationStage()
    }
    if (!this.recommendationStage) {
      this.recommendationStage = new RecommendationStage()
    }
    if (!this.publishingStage) {
      this.publishingStage = new PublishingStage()
    }

    return new IntelligencePipeline(
      this.normalizationStage,
      this.analysisStage,
      this.scoringStage,
      this.explanationStage,
      this.recommendationStage,
      this.publishingStage
    )
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory Function
// ─────────────────────────────────────────────────────────────────────────────

export function createPipeline(): PipelineBuilder {
  return new PipelineBuilder()
}
