/**
 * Hospitality Intelligence Engine (HIE) - Explanation Stage
 * 
 * Stage 4: Generate structured explanations (NO natural language prose).
 */

import type {
  PipelineContext,
  IPipelineStage,
  StageResult,
  ScoringOutput,
  AnalysisOutput,
  ExplanationOutput,
  StructuredExplanation,
  StructuredInsight,
  CausalityGraph,
  CausalNode,
  CausalEdge,
} from '../types'
import type { EvidenceRef } from '../../types'
import { RootCauseEngine } from '../../root-causes'

export class ExplanationStage implements IPipelineStage<
  { scoring: ScoringOutput; analysis: AnalysisOutput },
  ExplanationOutput
> {
  name = 'explanation' as const

  constructor(private rootCauseEngine?: RootCauseEngine) {}

  async execute(
    input: { scoring: ScoringOutput; analysis: AnalysisOutput },
    context: PipelineContext
  ): Promise<StageResult<ExplanationOutput>> {
    const startTime = Date.now()

    try {
      const explanations: StructuredExplanation[] = []
      const insights: StructuredInsight[] = []

      // Generate explanations for problems
      if (input.analysis.problems) {
        for (const problem of input.analysis.problems) {
          const explanation: StructuredExplanation = {
            id: `exp_${problem.id}`,
            type: 'problem',
            subject: problem.type,
            issue: problem.title,
            evidence: problem.evidence,
            reason: problem.description,
            confidence: problem.rootCause?.confidence ?? 0.7,
            relatedEvents: problem.evidence.map(e => e.id),
            replayTimestamp: problem.evidence.find(e => e.timestamp)?.timestamp,
            severity: problem.severity,
          }
          explanations.push(explanation)
        }
      }

      // Generate explanations for highlights
      if (input.analysis.highlights) {
        for (const highlight of input.analysis.highlights) {
          const explanation: StructuredExplanation = {
            id: `exp_${highlight.id}`,
            type: 'highlight',
            subject: highlight.type,
            evidence: highlight.evidence,
            reason: highlight.description,
            confidence: highlight.confidence,
            relatedEvents: highlight.evidence.map(e => e.id),
            replayTimestamp: highlight.timestamp,
          }
          explanations.push(explanation)
        }
      }

      // Generate explanations for patterns
      if (input.analysis.patterns) {
        for (const pattern of input.analysis.patterns) {
          const explanation: StructuredExplanation = {
            id: `exp_${pattern.id}`,
            type: 'pattern',
            subject: pattern.type,
            evidence: pattern.evidence,
            reason: pattern.description,
            confidence: pattern.confidence,
            relatedEvents: pattern.evidence.map(e => e.id),
          }
          explanations.push(explanation)
        }
      }

      // Generate insights from scoring
      if (input.scoring.overallScore) {
        for (const dim of input.scoring.overallScore.dimensions) {
          const dimScore = input.scoring.dimensionScores.get(dim.id)
          if (!dimScore) continue

          const insight: StructuredInsight = {
            id: `insight_${dim.id}`,
            category: 'performance',
            fact: `${dim.name}: ${dim.value} ${dim.unit}`,
            value: dim.value,
            unit: dim.unit,
            comparison: {
              baseline: dim.benchmark,
              change: dimScore.deviation,
              changePercent: (dimScore.deviation / dim.benchmark) * 100,
            },
            evidence: dim.evidence || [],
            confidence: input.scoring.confidence,
          }
          insights.push(insight)
        }
      }

      // Generate insights from analysis
      if (input.analysis.staff) {
        insights.push({
          id: 'insight_staff_count',
          category: 'efficiency',
          fact: `${input.analysis.staff.totalStaff} staff members active`,
          value: input.analysis.staff.totalStaff,
          evidence: [],
          confidence: 1.0,
        })

        if (input.analysis.staff.topPerformer) {
          insights.push({
            id: 'insight_top_performer',
            category: 'performance',
            fact: `Top performer: ${input.analysis.staff.topPerformer.staffName}`,
            value: input.analysis.staff.topPerformer.efficiency,
            unit: 'percent',
            evidence: [],
            confidence: 0.9,
          })
        }
      }

      if (input.analysis.kitchen) {
        insights.push({
          id: 'insight_kitchen_utilization',
          category: 'efficiency',
          fact: `Kitchen utilization: ${input.analysis.kitchen.overallUtilization}%`,
          value: input.analysis.kitchen.overallUtilization,
          unit: 'percent',
          evidence: [],
          confidence: 0.9,
        })
      }

      // Build causality graph
      const causality = this.buildCausalityGraph(explanations, input.analysis)

      const output: ExplanationOutput = {
        explanations,
        insights,
        causality,
      }

      // Cache for later stages
      context.cache.set('explanationOutput', output)

      // Record diagnostics
      context.diagnostics.stages.push({
        stage: 'explanation',
        startTime,
        endTime: Date.now(),
        durationMs: Date.now() - startTime,
        status: 'success',
        modulesExecuted: ['explanation_generation', 'insight_extraction', 'causality_analysis'],
      })

      return { success: true, data: output }
    } catch (error) {
      context.diagnostics.errors.push({
        stage: 'explanation',
        code: 'EXPLANATION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
        error: error instanceof Error ? error : undefined,
        recoverable: true,
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Explanation failed',
      }
    }
  }

  private buildCausalityGraph(
    explanations: StructuredExplanation[],
    analysis: AnalysisOutput
  ): CausalityGraph {
    const nodes: CausalNode[] = []
    const edges: CausalEdge[] = []

    // Create nodes for problems
    if (analysis.problems) {
      for (const problem of analysis.problems) {
        nodes.push({
          id: problem.id,
          type: 'outcome',
          label: problem.title,
          evidence: problem.evidence,
        })

        // If root cause exists, create causal relationship
        if (problem.rootCause) {
          const causeId = `cause_${problem.id}`
          nodes.push({
            id: causeId,
            type: 'condition',
            label: problem.rootCause.description,
            evidence: problem.rootCause.evidence,
          })

          edges.push({
            from: causeId,
            to: problem.id,
            relationship: 'causes',
            strength: problem.rootCause.confidence,
          })
        }
      }
    }

    return { nodes, edges }
  }
}
