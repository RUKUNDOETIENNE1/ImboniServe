/**
 * Hospitality Intelligence Engine (HIE) - Recommendations Module
 * 
 * Generates actionable recommendations based on problems and patterns.
 */

import type {
  Recommendation,
  RecommendationCategory,
  Priority,
  RecommendationTimeframe,
  Problem,
  Pattern,
  OperationalEvent,
  EvidenceRef,
} from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Recommendation Generator Interface
// ─────────────────────────────────────────────────────────────────────────────

export interface RecommendationGenerator {
  id: string
  name: string
  generate(context: RecommendationContext): Promise<Recommendation[]>
}

export interface RecommendationContext {
  problems: Problem[]
  patterns: Pattern[]
  events: OperationalEvent[]
  businessId: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Recommendation Engine
// ─────────────────────────────────────────────────────────────────────────────

export class RecommendationEngine {
  private generators: RecommendationGenerator[] = []

  registerGenerator(generator: RecommendationGenerator): void {
    this.generators.push(generator)
  }

  async generateRecommendations(context: RecommendationContext): Promise<Recommendation[]> {
    const allRecommendations: Recommendation[] = []

    for (const generator of this.generators) {
      const recommendations = await generator.generate(context)
      allRecommendations.push(...recommendations)
    }

    return this.deduplicateAndPrioritize(allRecommendations)
  }

  private deduplicateAndPrioritize(recommendations: Recommendation[]): Recommendation[] {
    const seen = new Set<string>()
    const unique: Recommendation[] = []

    for (const rec of recommendations) {
      const key = `${rec.type}_${rec.title}`
      if (!seen.has(key)) {
        seen.add(key)
        unique.push(rec)
      }
    }

    return unique.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Built-in Generators
// ─────────────────────────────────────────────────────────────────────────────

export class ProblemBasedRecommendationGenerator implements RecommendationGenerator {
  id = 'problem_based'
  name = 'Problem-Based Recommendation Generator'

  private rules: Map<string, RecommendationRule> = new Map()

  registerRule(problemType: string, rule: RecommendationRule): void {
    this.rules.set(problemType, rule)
  }

  async generate(context: RecommendationContext): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = []

    for (const problem of context.problems) {
      const rule = this.rules.get(problem.type)
      if (rule) {
        const rec = await rule.generate(problem, context)
        if (rec) recommendations.push(rec)
      }
    }

    return recommendations
  }
}

export interface RecommendationRule {
  generate(problem: Problem, context: RecommendationContext): Promise<Recommendation | null>
}

export class DelayRecommendationRule implements RecommendationRule {
  async generate(problem: Problem, context: RecommendationContext): Promise<Recommendation | null> {
    const priority: Priority = problem.severity === 'critical' ? 'critical' : 
                               problem.severity === 'high' ? 'high' : 'medium'

    return {
      id: `rec_${Date.now()}`,
      type: 'reduce_delays',
      category: 'workflow',
      priority,
      title: 'Optimize workflow to reduce delays',
      description: 'Review and streamline the order fulfillment process',
      reasoning: `${problem.impact.affectedOrders} orders experienced delays`,
      expectedImpact: 'Reduce average order time by 20-30%',
      actionable: true,
      timeframe: 'immediate',
      evidence: problem.evidence,
      relatedProblemIds: [problem.id],
    }
  }
}

export class StaffingRecommendationRule implements RecommendationRule {
  async generate(problem: Problem, context: RecommendationContext): Promise<Recommendation | null> {
    if (problem.type.includes('overload') || problem.type.includes('imbalance')) {
      return {
        id: `rec_${Date.now()}`,
        type: 'adjust_staffing',
        category: 'staffing',
        priority: 'high',
        title: 'Adjust staffing levels',
        description: 'Add staff during peak periods or redistribute workload',
        reasoning: problem.description,
        expectedImpact: 'Improve service speed and reduce staff burnout',
        actionable: true,
        timeframe: 'today',
        evidence: problem.evidence,
        relatedProblemIds: [problem.id],
      }
    }
    return null
  }
}

export class PatternBasedRecommendationGenerator implements RecommendationGenerator {
  id = 'pattern_based'
  name = 'Pattern-Based Recommendation Generator'

  async generate(context: RecommendationContext): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = []

    for (const pattern of context.patterns) {
      if (pattern.type.includes('recurring_rush')) {
        recommendations.push({
          id: `rec_${Date.now()}`,
          type: 'schedule_optimization',
          category: 'scheduling',
          priority: 'medium',
          title: 'Optimize scheduling for recurring rush periods',
          description: 'Adjust staff schedules to match demand patterns',
          reasoning: `Recurring pattern detected: ${pattern.description}`,
          expectedImpact: 'Better preparedness during peak times',
          actionable: true,
          timeframe: 'this_week',
          evidence: pattern.evidence,
        })
      }

      if (pattern.type.includes('bottleneck') && pattern.trend === 'increasing') {
        recommendations.push({
          id: `rec_${Date.now()}`,
          type: 'capacity_planning',
          category: 'capacity',
          priority: 'high',
          title: 'Address growing bottleneck',
          description: 'Increase capacity or optimize workflow at bottleneck point',
          reasoning: `Bottleneck pattern is increasing: ${pattern.description}`,
          expectedImpact: 'Prevent future service degradation',
          actionable: true,
          timeframe: 'this_week',
          evidence: pattern.evidence,
        })
      }
    }

    return recommendations
  }
}

export class CustomRecommendationGenerator implements RecommendationGenerator {
  constructor(
    public id: string,
    public name: string,
    private generateFn: (context: RecommendationContext) => Promise<Recommendation[]>
  ) {}

  async generate(context: RecommendationContext): Promise<Recommendation[]> {
    return this.generateFn(context)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

export function createRecommendation(
  type: string,
  category: RecommendationCategory,
  priority: Priority,
  title: string,
  description: string,
  reasoning: string,
  expectedImpact: string,
  evidence: EvidenceRef[],
  options?: {
    actionable?: boolean
    timeframe?: RecommendationTimeframe
    relatedProblemIds?: string[]
  }
): Recommendation {
  return {
    id: `rec_${Date.now()}`,
    type,
    category,
    priority,
    title,
    description,
    reasoning,
    expectedImpact,
    actionable: options?.actionable ?? true,
    timeframe: options?.timeframe,
    evidence,
    relatedProblemIds: options?.relatedProblemIds,
  }
}
