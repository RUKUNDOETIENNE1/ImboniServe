/**
 * Hospitality Intelligence Engine (HIE) - Recommendation Stage
 * 
 * Stage 5: Generate actionable recommendations with evidence.
 */

import type {
  PipelineContext,
  IPipelineStage,
  StageResult,
  AnalysisOutput,
  ExplanationOutput,
  RecommendationOutput,
  StructuredRecommendation,
  ActionPlan,
  PriorityMatrix,
  ImpactAssessment,
} from '../types'
import { RecommendationEngine } from '../../recommendations'
import { ReplayLinkGenerator } from '../../evidence'

export class RecommendationStage implements IPipelineStage<
  { analysis: AnalysisOutput; explanation: ExplanationOutput },
  RecommendationOutput
> {
  name = 'recommendation' as const

  constructor(private recommendationEngine?: RecommendationEngine) {}

  async execute(
    input: { analysis: AnalysisOutput; explanation: ExplanationOutput },
    context: PipelineContext
  ): Promise<StageResult<RecommendationOutput>> {
    const startTime = Date.now()

    try {
      const recommendations: StructuredRecommendation[] = []

      // Generate recommendations using engine
      if (this.recommendationEngine) {
        const events = context.cache.get('normalizedEvents') as any[]
        const engineRecs = await this.recommendationEngine.generateRecommendations({
          problems: input.analysis.problems || [],
          patterns: input.analysis.patterns || [],
          events,
          businessId: context.businessId,
        })

        // Convert to structured recommendations
        const linkGen = new ReplayLinkGenerator()
        for (const rec of engineRecs) {
          const structured: StructuredRecommendation = {
            id: rec.id,
            action: rec.title,
            priority: rec.priority,
            category: rec.category,
            expectedImpact: {
              description: rec.expectedImpact,
              affectedMetrics: [],
              riskLevel: 'low',
            },
            evidence: rec.evidence,
            replayLink: rec.evidence[0]?.timestamp
              ? linkGen.generateTimestampLink(rec.evidence[0].timestamp, context.businessId)
              : undefined,
            dependencies: rec.relatedProblemIds || [],
            timeframe: rec.timeframe || 'this_week',
            effort: this.estimateEffort(rec.category),
            confidence: 0.8,
          }
          recommendations.push(structured)
        }
      }

      // Generate additional recommendations from explanations
      for (const explanation of input.explanation.explanations) {
        if (explanation.type === 'problem' && explanation.severity === 'critical') {
          const existing = recommendations.find(r => r.dependencies.includes(explanation.id))
          if (!existing) {
            recommendations.push({
              id: `rec_${explanation.id}`,
              action: `Address ${explanation.subject}`,
              priority: 'critical',
              category: 'process',
              expectedImpact: {
                description: `Resolve ${explanation.issue}`,
                affectedMetrics: [],
                riskLevel: 'high',
              },
              evidence: explanation.evidence,
              replayLink: explanation.replayTimestamp
                ? new ReplayLinkGenerator().generateTimestampLink(
                    explanation.replayTimestamp,
                    context.businessId
                  )
                : undefined,
              dependencies: [],
              timeframe: 'immediate',
              effort: 'medium',
              confidence: explanation.confidence,
            })
          }
        }
      }

      // Build action plan
      const actionPlan = this.buildActionPlan(recommendations)

      // Build priority matrix
      const priorityMatrix = this.buildPriorityMatrix(recommendations)

      const output: RecommendationOutput = {
        recommendations,
        actionPlan,
        priorityMatrix,
      }

      // Cache for later stages
      context.cache.set('recommendationOutput', output)

      // Record diagnostics
      context.diagnostics.stages.push({
        stage: 'recommendation',
        startTime,
        endTime: Date.now(),
        durationMs: Date.now() - startTime,
        status: 'success',
        modulesExecuted: ['recommendation_generation', 'action_planning', 'prioritization'],
      })

      return { success: true, data: output }
    } catch (error) {
      context.diagnostics.errors.push({
        stage: 'recommendation',
        code: 'RECOMMENDATION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
        error: error instanceof Error ? error : undefined,
        recoverable: true,
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Recommendation failed',
      }
    }
  }

  private estimateEffort(category: string): 'low' | 'medium' | 'high' {
    const highEffort = ['equipment', 'capacity', 'menu']
    const mediumEffort = ['staffing', 'scheduling', 'training']
    
    if (highEffort.includes(category)) return 'high'
    if (mediumEffort.includes(category)) return 'medium'
    return 'low'
  }

  private buildActionPlan(recommendations: StructuredRecommendation[]): ActionPlan {
    const immediate: string[] = []
    const shortTerm: string[] = []
    const longTerm: string[] = []

    for (const rec of recommendations) {
      switch (rec.timeframe) {
        case 'immediate':
          immediate.push(rec.id)
          break
        case 'today':
        case 'this_week':
          shortTerm.push(rec.id)
          break
        case 'this_month':
        case 'strategic':
          longTerm.push(rec.id)
          break
      }
    }

    return { immediate, shortTerm, longTerm }
  }

  private buildPriorityMatrix(recommendations: StructuredRecommendation[]): PriorityMatrix {
    const quickWins: string[] = []
    const majorProjects: string[] = []
    const fillIns: string[] = []
    const thankless: string[] = []

    for (const rec of recommendations) {
      const highPriority = rec.priority === 'critical' || rec.priority === 'high'
      const lowEffort = rec.effort === 'low'

      if (highPriority && lowEffort) {
        quickWins.push(rec.id)
      } else if (highPriority && !lowEffort) {
        majorProjects.push(rec.id)
      } else if (!highPriority && lowEffort) {
        fillIns.push(rec.id)
      } else {
        thankless.push(rec.id)
      }
    }

    return { quickWins, majorProjects, fillIns, thankless }
  }
}
