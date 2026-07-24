/**
 * Hospitality AI Copilot™ — Recommendation Engine (Phase 9).
 *
 * Produces recommendations that are:
 *   - Evidence-backed
 *   - Actionable
 *   - Operationally practical
 *   - Role-aware
 *   - Prioritized
 *   - Confidence scored
 *
 * Where appropriate, provides alternative options with associated trade-offs.
 *
 * Architectural constraints:
 *   - No recommendation is generated from unsupported evidence
 *   - All recommendations require human approval before action
 *   - All recommendations are reversible unless explicitly flagged
 */

import type {
  CopilotRequest,
  OperationalContext,
  EvidenceEvaluation,
  ReasoningResult,
  KnowledgeRetrievalResult,
  CopilotRecommendation,
  RecommendedAction,
  AlternativeOption,
  RecommendationConfidenceFactors,
  UserRole,
} from './types'
import type {
  IntentType,
  OperationalDomain,
  ExpertiseProfile,
  ReasoningStrategy,
  SkillOrchestrationResult,
  SkillFinding,
} from '../skill-registry/types'
import type { KnowledgeEntity } from '@/lib/hospitality-knowledge/types'
import { clamp01, hashId, priorityFromScore, nowIso } from './utils'

// ============================================================================
// Recommendation Engine
// ============================================================================

const RECOMMENDATION_VERSION = '1.0.0'

export class RecommendationEngine {
  /**
   * Generate recommendations from reasoning results.
   *
   * Recommendations are derived from:
   *   1. Actionable findings from the Reasoning Engine
   *   2. Recommended actions from Knowledge objects
   *   3. Skill-derived recommendations
   *
   * Non-actionable findings (conflicts, missing evidence) are surfaced
   * as uncertainty statements, not recommendations.
   */
  generate(
    request: CopilotRequest,
    intent: IntentType,
    domain: OperationalDomain,
    profile: ExpertiseProfile,
    context: OperationalContext,
    retrieval: KnowledgeRetrievalResult,
    evaluation: EvidenceEvaluation,
    reasoning: ReasoningResult,
    skillResult?: SkillOrchestrationResult
  ): CopilotRecommendation[] {
    // If evidence is absent or insufficient, return no recommendations
    // and let the caller surface an uncertainty statement.
    if (evaluation.overallSufficiency === 'absent' || evaluation.overallSufficiency === 'insufficient') {
      return []
    }

    const maxRecommendations = request.maxRecommendations || 5
    const includeAlternatives = request.includeAlternatives ?? true

    const recommendations: CopilotRecommendation[] = []

    // 1. From actionable derived findings
    for (const finding of reasoning.derivedFindings) {
      if (!finding.actionable) continue
      if (finding.severity === 'info') continue

      const rec = this.buildRecommendationFromFinding(
        finding,
        request,
        intent,
        domain,
        profile,
        context,
        retrieval,
        evaluation,
        reasoning.strategy,
        skillResult,
        includeAlternatives
      )
      if (rec) recommendations.push(rec)
    }

    // 2. From knowledge recommended actions
    for (const k of retrieval.knowledge.slice(0, 5)) {
      if (k.recommendedActions.length === 0) continue
      // Skip if we already have a recommendation from this knowledge
      if (recommendations.some((r) => r.evidenceRefs.includes(k.id))) continue

      const rec = this.buildRecommendationFromKnowledge(
        k,
        request,
        intent,
        domain,
        profile,
        context,
        retrieval,
        evaluation,
        reasoning.strategy,
        skillResult,
        includeAlternatives
      )
      if (rec) recommendations.push(rec)
    }

    // 3. Sort by priority (critical → high → medium → low) then confidence
    recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      const pDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (pDiff !== 0) return pDiff
      return b.confidence - a.confidence
    })

    // 4. Limit to maxRecommendations
    return recommendations.slice(0, maxRecommendations)
  }

  // --------------------------------------------------------------------------
  // Build recommendation from a finding
  // --------------------------------------------------------------------------

  private buildRecommendationFromFinding(
    finding: {
      id: string
      title: string
      description: string
      severity: 'info' | 'low' | 'medium' | 'high' | 'critical'
      confidence: number
      evidenceRefs: string[]
      actionable: boolean
    },
    request: CopilotRequest,
    intent: IntentType,
    domain: OperationalDomain,
    profile: ExpertiseProfile,
    context: OperationalContext,
    retrieval: KnowledgeRetrievalResult,
    evaluation: EvidenceEvaluation,
    strategy: ReasoningStrategy,
    skillResult: SkillOrchestrationResult | undefined,
    includeAlternatives: boolean
  ): CopilotRecommendation | null {
    const confidence = this.calculateConfidence(finding.confidence, evaluation, context, skillResult)
    const priority = priorityFromScore(finding.confidence)

    const recommendedActions = this.deriveActions(
      finding,
      retrieval.knowledge,
      domain,
      context.userRole
    )

    const alternativeOptions = includeAlternatives
      ? this.generateAlternatives(finding, retrieval.knowledge, strategy)
      : []

    return {
      id: hashId('rec', `${request.requestId}|${finding.id}`),
      title: finding.title,
      description: finding.description,
      rationale: `Derived from ${strategy} reasoning over ${finding.evidenceRefs.length} evidence item(s)`,
      priority,
      priorityReason: `Severity=${finding.severity}, confidence=${finding.confidence.toFixed(2)}`,
      confidence: confidence.overall,
      confidenceFactors: confidence.factors,
      evidenceRefs: finding.evidenceRefs,
      skillIds: skillResult?.stepResults.filter((r) => r.success).map((r) => r.skillId) || [],
      reasoningStrategies: [strategy],
      actionable: recommendedActions.length > 0,
      recommendedActions,
      alternativeOptions,
      roleFit: this.determineRoleFit(profile, context.userRole),
      domainFit: [domain],
      expectedImpact: this.estimateImpact(finding, domain),
      risks: this.identifyRisks(finding, evaluation),
      prerequisites: this.identifyPrerequisites(finding, context),
      requiresHumanApproval: true,  // Always — Copilot never decides autonomously
      reversible: true,
    }
  }

  // --------------------------------------------------------------------------
  // Build recommendation from knowledge
  // --------------------------------------------------------------------------

  private buildRecommendationFromKnowledge(
    k: KnowledgeEntity,
    request: CopilotRequest,
    intent: IntentType,
    domain: OperationalDomain,
    profile: ExpertiseProfile,
    context: OperationalContext,
    retrieval: KnowledgeRetrievalResult,
    evaluation: EvidenceEvaluation,
    strategy: ReasoningStrategy,
    skillResult: SkillOrchestrationResult | undefined,
    includeAlternatives: boolean
  ): CopilotRecommendation | null {
    const confidence = this.calculateConfidence(k.confidenceScore, evaluation, context, skillResult)
    const priority = priorityFromScore(k.confidenceScore)

    const recommendedActions = k.recommendedActions.map((a) => ({
      id: hashId('action', `${k.id}|${a.action}`),
      description: a.action,
      owner: this.determineActionOwner(a, context.userRole),
      domain,
      estimatedEffort: this.estimateEffort(a),
      timeframe: this.estimateTimeframe(a),
      expectedOutcome: a.expectedOutcome || a.action,
    }))

    const alternativeOptions = includeAlternatives
      ? this.generateAlternativesFromKnowledge(k, strategy)
      : []

    return {
      id: hashId('rec', `${request.requestId}|${k.id}`),
      title: k.title,
      description: k.summary,
      rationale: `Based on validated knowledge (confidence=${k.confidenceScore.toFixed(2)}, status=${k.status})`,
      priority,
      priorityReason: `Knowledge impact=${k.impactLevel}, confidence=${k.confidenceScore.toFixed(2)}`,
      confidence: confidence.overall,
      confidenceFactors: confidence.factors,
      evidenceRefs: [k.id],
      skillIds: skillResult?.stepResults.filter((r) => r.success).map((r) => r.skillId) || [],
      reasoningStrategies: [strategy],
      actionable: recommendedActions.length > 0,
      recommendedActions,
      alternativeOptions,
      roleFit: this.determineRoleFit(profile, context.userRole),
      domainFit: [domain],
      expectedImpact: k.businessImpact,
      risks: this.identifyRisksFromKnowledge(k, evaluation),
      prerequisites: k.operationalRules.slice(0, 3),
      requiresHumanApproval: true,
      reversible: true,
    }
  }

  // --------------------------------------------------------------------------
  // Confidence calculation
  // --------------------------------------------------------------------------

  private calculateConfidence(
    baseConfidence: number,
    evaluation: EvidenceEvaluation,
    context: OperationalContext,
    skillResult: SkillOrchestrationResult | undefined
  ): { overall: number; factors: RecommendationConfidenceFactors } {
    const evidenceQuality = evaluation.confidence
    const evidenceConsistency = evaluation.consistency
    const evidenceRecency = evaluation.recency
    const skillConfidence = skillResult?.overallConfidence || 0.5
    const contextCompleteness = this.scoreContextCompleteness(context)
    const reasoningStrategyFit = 0.8  // Strategy was selected for this intent/domain

    const factors: RecommendationConfidenceFactors = {
      evidenceQuality: clamp01(evidenceQuality),
      evidenceConsistency: clamp01(evidenceConsistency),
      evidenceRecency: clamp01(evidenceRecency),
      reasoningStrategyFit: clamp01(reasoningStrategyFit),
      skillConfidence: clamp01(skillConfidence),
      contextCompleteness: clamp01(contextCompleteness),
    }

    // Overall confidence is a weighted blend of the factors and base confidence
    const overall = clamp01(
      (baseConfidence * 0.3) +
      (evidenceQuality * 0.2) +
      (evidenceConsistency * 0.15) +
      (evidenceRecency * 0.1) +
      (skillConfidence * 0.15) +
      (contextCompleteness * 0.1)
    )

    return { overall, factors }
  }

  private scoreContextCompleteness(context: OperationalContext): number {
    let score = 0
    if (context.userRole !== 'unknown') score += 0.2
    if (context.shift) score += 0.15
    if (context.outletId) score += 0.1
    if (context.businessObjectives.length > 0) score += 0.2
    if (context.activeAlerts.length > 0) score += 0.1
    if (context.relevantHistoricalContext.length > 0) score += 0.25
    return clamp01(score)
  }

  // --------------------------------------------------------------------------
  // Action derivation
  // --------------------------------------------------------------------------

  private deriveActions(
    finding: { title: string; description: string; severity: string },
    knowledge: KnowledgeEntity[],
    domain: OperationalDomain,
    userRole: UserRole
  ): RecommendedAction[] {
    const actions: RecommendedAction[] = []

    // Look for actions in related knowledge
    for (const k of knowledge) {
      for (const ra of k.recommendedActions) {
        if (ra.action.toLowerCase().includes(finding.title.toLowerCase().split(' ')[0])) {
          actions.push({
            id: hashId('action', `${k.id}|${ra.action}`),
            description: ra.action,
            owner: this.determineActionOwner(ra, userRole),
            domain,
            estimatedEffort: this.estimateEffort(ra),
            timeframe: this.estimateTimeframe(ra),
            expectedOutcome: ra.expectedOutcome || ra.action,
          })
        }
      }
    }

    // If no specific actions found, generate a generic one
    if (actions.length === 0) {
      actions.push({
        id: hashId('action', `generic|${finding.title}`),
        description: `Investigate and address: ${finding.title}`,
        owner: userRole,
        domain,
        estimatedEffort: 'medium',
        timeframe: finding.severity === 'critical' ? 'immediate' : 'this_shift',
        expectedOutcome: `Resolve: ${finding.title}`,
      })
    }

    return actions
  }

  private determineActionOwner(
    action: { owner?: string; priority?: string },
    userRole: UserRole
  ): UserRole {
    if (action.owner) {
      const lower = action.owner.toLowerCase()
      if (lower.includes('kitchen')) return 'kitchen_manager'
      if (lower.includes('service') || lower.includes('floor')) return 'service_manager'
      if (lower.includes('inventory')) return 'inventory_manager'
      if (lower.includes('manager')) return 'general_manager'
    }
    return userRole
  }

  private estimateEffort(action: { action: string }): 'low' | 'medium' | 'high' {
    const lower = action.action.toLowerCase()
    if (lower.includes('review') || lower.includes('check') || lower.includes('monitor')) return 'low'
    if (lower.includes('adjust') || lower.includes('update') || lower.includes('train')) return 'medium'
    if (lower.includes('implement') || lower.includes('redesign') || lower.includes('restructure')) return 'high'
    return 'medium'
  }

  private estimateTimeframe(action: { priority?: string; action: string }): 'immediate' | 'this_shift' | 'today' | 'this_week' | 'planned' {
    if (action.priority === 'critical') return 'immediate'
    if (action.priority === 'high') return 'this_shift'
    const lower = action.action.toLowerCase()
    if (lower.includes('immediately') || lower.includes('now')) return 'immediate'
    if (lower.includes('today')) return 'today'
    if (lower.includes('week')) return 'this_week'
    if (lower.includes('plan') || lower.includes('schedule')) return 'planned'
    return 'today'
  }

  // --------------------------------------------------------------------------
  // Alternative generation
  // --------------------------------------------------------------------------

  private generateAlternatives(
    finding: { title: string; description: string },
    knowledge: KnowledgeEntity[],
    strategy: ReasoningStrategy
  ): AlternativeOption[] {
    const alternatives: AlternativeOption[] = []

    // Look for alternative approaches in knowledge
    for (const k of knowledge.slice(0, 3)) {
      if (k.recommendedActions.length > 1) {
        const altAction = k.recommendedActions[1]
        alternatives.push({
          id: hashId('alt', `${k.id}|${altAction.action}`),
          title: `Alternative: ${altAction.action}`,
          description: altAction.action,
          rationale: `Alternative approach from knowledge: ${k.title}`,
          confidence: k.confidenceScore * 0.8,
          tradeoffs: [
            { advantage: 'Different approach may fit different contexts', disadvantage: 'May require additional resources' },
          ],
        })
      }
    }

    // Generic alternative: monitor and revisit
    if (alternatives.length === 0) {
      alternatives.push({
        id: hashId('alt', `monitor|${finding.title}`),
        title: 'Monitor and revisit',
        description: 'Continue monitoring the situation and revisit when more evidence is available',
        rationale: 'Conservative approach when evidence is limited',
        confidence: 0.5,
        tradeoffs: [
          { advantage: 'No immediate resource commitment', disadvantage: 'Issue may persist or worsen' },
        ],
      })
    }

    return alternatives
  }

  private generateAlternativesFromKnowledge(k: KnowledgeEntity, strategy: ReasoningStrategy): AlternativeOption[] {
    const alternatives: AlternativeOption[] = []

    if (k.recommendedActions.length > 1) {
      for (let i = 1; i < Math.min(k.recommendedActions.length, 3); i++) {
        const altAction = k.recommendedActions[i]
        alternatives.push({
          id: hashId('alt', `${k.id}|${altAction.action}`),
          title: `Alternative ${i}: ${altAction.action}`,
          description: altAction.action,
          rationale: `Alternative approach from knowledge: ${k.title}`,
          confidence: k.confidenceScore * 0.8,
          tradeoffs: [
            { advantage: 'Provides option when primary approach is blocked', disadvantage: 'May have different trade-offs' },
          ],
        })
      }
    }

    return alternatives
  }

  // --------------------------------------------------------------------------
  // Role fit, impact, risks, prerequisites
  // --------------------------------------------------------------------------

  private determineRoleFit(profile: ExpertiseProfile, userRole: UserRole): UserRole[] {
    const profileRoles: Record<ExpertiseProfile, UserRole[]> = {
      executive_advisor: ['owner', 'executive', 'general_manager', 'analyst'],
      kitchen_advisor: ['kitchen_manager', 'cook', 'general_manager'],
      service_advisor: ['service_manager', 'floor_manager', 'server', 'host', 'bartender'],
      inventory_advisor: ['inventory_manager', 'general_manager'],
      revenue_advisor: ['general_manager', 'owner', 'analyst', 'executive'],
      staff_performance_advisor: ['general_manager', 'service_manager', 'kitchen_manager', 'shift_lead'],
      customer_experience_advisor: ['service_manager', 'general_manager', 'host'],
      operational_excellence_advisor: ['general_manager', 'shift_lead', 'floor_manager', 'kitchen_manager'],
    }
    const roles = profileRoles[profile] || ['general_manager']
    return userRole !== 'unknown' ? [...roles, userRole] : roles
  }

  private estimateImpact(
    finding: { severity: string; title: string },
    domain: OperationalDomain
  ): string {
    const severityImpact: Record<string, string> = {
      critical: 'High immediate impact on operations',
      high: 'Significant impact if not addressed',
      medium: 'Moderate impact on operational efficiency',
      low: 'Minor impact, monitor over time',
      info: 'Informational, no immediate impact',
    }
    return severityImpact[finding.severity] || 'Impact under evaluation'
  }

  private identifyRisks(
    finding: { severity: string; description: string },
    evaluation: EvidenceEvaluation
  ): string[] {
    const risks: string[] = []
    if (evaluation.overallSufficiency === 'marginal') {
      risks.push('Evidence sufficiency is marginal — recommendation confidence is reduced')
    }
    if (evaluation.conflictingEvidence.length > 0) {
      risks.push('Conflicting evidence detected — recommendation may need revision')
    }
    if (finding.severity === 'critical' || finding.severity === 'high') {
      risks.push('High severity — inaction may lead to operational disruption')
    }
    return risks
  }

  private identifyRisksFromKnowledge(k: KnowledgeEntity, evaluation: EvidenceEvaluation): string[] {
    const risks: string[] = []
    if (k.status === 'provisional') {
      risks.push('Knowledge is provisional — confidence is limited')
    }
    if (k.contradictingMemoryCount > 0) {
      risks.push(`${k.contradictingMemoryCount} contradicting memories exist`)
    }
    if (evaluation.overallSufficiency === 'marginal') {
      risks.push('Overall evidence sufficiency is marginal')
    }
    return risks
  }

  private identifyPrerequisites(
    finding: { title: string },
    context: OperationalContext
  ): string[] {
    const prereqs: string[] = []
    if (context.shift === 'night' || context.shift === 'closing') {
      prereqs.push('Coordinate with morning shift before implementation')
    }
    if (context.activeAlerts.length > 0) {
      prereqs.push('Review active alerts before acting')
    }
    return prereqs
  }

  // --------------------------------------------------------------------------
  // Introspection
  // --------------------------------------------------------------------------

  getRecommendationVersion(): string {
    return RECOMMENDATION_VERSION
  }
}

// ============================================================================
// Singleton
// ============================================================================

let singleton: RecommendationEngine | null = null

export function getRecommendationEngine(): RecommendationEngine {
  if (!singleton) singleton = new RecommendationEngine()
  return singleton
}

export function resetRecommendationEngine(): void {
  singleton = null
}
