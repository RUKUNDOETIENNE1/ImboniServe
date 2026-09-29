/**
 * Hospitality Intelligence Engine (HIE) - Scoring Stage
 * 
 * Stage 3: Calculate deterministic performance scores.
 */

import type {
  PipelineContext,
  IPipelineStage,
  StageResult,
  AnalysisOutput,
  ScoringOutput,
  DimensionScore,
  BenchmarkComparison,
} from '../types'
import type { OperationalEvent, Score } from '../../types'
import { ScoringEngine } from '../../scoring'

export class ScoringStage implements IPipelineStage<AnalysisOutput, ScoringOutput> {
  name = 'scoring' as const

  constructor(private scoringEngine?: ScoringEngine) {}

  async execute(
    input: AnalysisOutput,
    context: PipelineContext
  ): Promise<StageResult<ScoringOutput>> {
    const startTime = Date.now()

    try {
      if (!this.scoringEngine || !context.config.scoring) {
        context.diagnostics.skippedAnalyses.push('scoring')
        return {
          success: true,
          data: this.createDefaultScoring(),
          warnings: ['Scoring engine not configured'],
        }
      }

      const events = context.cache.get('normalizedEvents') as OperationalEvent[]
      const previousEvents = context.cache.get('previousEvents') as OperationalEvent[] | undefined

      // Calculate scores
      const previousScore = previousEvents
        ? (await this.scoringEngine.calculateScore(previousEvents)).overall
        : undefined

      const overallScore = await this.scoringEngine.calculateScore(events, previousScore)

      // Build dimension scores map
      const dimensionScores = new Map<string, DimensionScore>()
      for (const dim of overallScore.dimensions) {
        const deviation = dim.value - dim.benchmark
        dimensionScores.set(dim.id, {
          id: dim.id,
          name: dim.name,
          score: dim.score,
          value: dim.value,
          benchmark: dim.benchmark,
          unit: dim.unit,
          deviation,
        })
      }

      // Calculate confidence
      const confidence = this.calculateConfidence(overallScore, input, context)

      // Determine trend
      const trend = overallScore.trend

      // Benchmark comparison
      const benchmarkComparison = this.compareToBenchmarks(dimensionScores)

      const output: ScoringOutput = {
        overallScore,
        dimensionScores,
        confidence,
        trend,
        benchmarkComparison,
      }

      // Cache for later stages
      context.cache.set('scoringOutput', output)

      // Record diagnostics
      context.diagnostics.stages.push({
        stage: 'scoring',
        startTime,
        endTime: Date.now(),
        durationMs: Date.now() - startTime,
        status: 'success',
        modulesExecuted: ['score_calculation', 'benchmark_comparison'],
      })

      return { success: true, data: output }
    } catch (error) {
      context.diagnostics.errors.push({
        stage: 'scoring',
        code: 'SCORING_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
        error: error instanceof Error ? error : undefined,
        recoverable: true,
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Scoring failed',
      }
    }
  }

  private calculateConfidence(
    score: Score,
    analysis: AnalysisOutput,
    context: PipelineContext
  ): number {
    let confidence = 0.5

    // Event count factor
    const eventCount = analysis.rawMetrics.totalEvents as number || 0
    if (eventCount > 100) confidence += 0.15
    if (eventCount > 500) confidence += 0.1
    if (eventCount > 1000) confidence += 0.1

    // Analysis depth factor
    if (analysis.staff) confidence += 0.05
    if (analysis.kitchen) confidence += 0.05
    if (analysis.customerJourney) confidence += 0.05

    // Evidence factor
    if (analysis.problems && analysis.problems.length > 0) confidence += 0.05
    if (analysis.patterns && analysis.patterns.length > 0) confidence += 0.05

    // Data quality factor
    const normalizedContext = context.cache.get('normalizedContext')
    if (normalizedContext) {
      const dataQuality = (normalizedContext as any).dataQuality
      if (dataQuality) {
        const avgQuality = (dataQuality.completeness + dataQuality.consistency + dataQuality.validity) / 3
        confidence *= avgQuality
      }
    }

    return Math.min(1, confidence)
  }

  private compareToBenchmarks(dimensionScores: Map<string, DimensionScore>): BenchmarkComparison {
    const aboveBenchmark: string[] = []
    const belowBenchmark: string[] = []
    const atBenchmark: string[] = []

    for (const [id, score] of dimensionScores) {
      const deviation = Math.abs(score.deviation)
      if (deviation < score.benchmark * 0.05) {
        atBenchmark.push(id)
      } else if (score.deviation > 0) {
        aboveBenchmark.push(id)
      } else {
        belowBenchmark.push(id)
      }
    }

    return { aboveBenchmark, belowBenchmark, atBenchmark }
  }

  private createDefaultScoring(): ScoringOutput {
    return {
      overallScore: {
        overall: 0,
        dimensions: [],
        trend: 'stable',
      },
      dimensionScores: new Map(),
      confidence: 0,
      trend: 'stable',
      benchmarkComparison: {
        aboveBenchmark: [],
        belowBenchmark: [],
        atBenchmark: [],
      },
    }
  }
}
