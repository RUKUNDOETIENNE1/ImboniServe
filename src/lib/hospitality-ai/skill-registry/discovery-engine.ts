/**
 * Operational Skill Registry — Discovery Engine.
 *
 * Selects the most relevant skills for a given request based on:
 * - Intent alignment
 * - Operational domain match
 * - Expertise profile compatibility
 * - Reasoning strategy support
 * - Evidence availability
 * - Skill health and performance
 *
 * The Discovery Engine never bypasses the certified architecture.
 * It only selects skills — it does not generate facts or perform reasoning.
 */

import type {
  OperationalSkill,
  SkillDiscoveryRequest,
  SkillDiscoveryResult,
  SkillExecutionContext,
  IntentType,
  OperationalDomain,
  ExpertiseProfile,
  ReasoningStrategy,
  SkillLifecycleStatus,
} from './types'
import { isProductionEligible, clamp01 } from './utils'
import { OperationalSkillRegistry } from './registry'

// ============================================================================
// Skill Discovery Engine
// ============================================================================

export class SkillDiscoveryEngine {
  constructor(private registry: OperationalSkillRegistry) {}

  // --------------------------------------------------------------------------
  // Main Discovery
  // --------------------------------------------------------------------------

  discover(request: SkillDiscoveryRequest): SkillDiscoveryResult {
    const start = Date.now()
    const allSkills = this.registry.getAllSkills()

    // Only consider production-eligible skills
    const eligibleSkills = allSkills.filter((s) => isProductionEligible(s.status))

    const selectedSkills: Array<{ skill: OperationalSkill; relevanceScore: number; selectionReason: string }> = []
    const rejectedSkills: Array<{ skill: OperationalSkill; rejectionReason: string }> = []

    for (const skill of eligibleSkills) {
      const evaluation = this.evaluateSkill(skill, request)

      if (evaluation.eligible) {
        selectedSkills.push({
          skill,
          relevanceScore: evaluation.relevanceScore,
          selectionReason: evaluation.reason,
        })
      } else {
        rejectedSkills.push({
          skill,
          rejectionReason: evaluation.reason,
        })
      }
    }

    // Sort by relevance score descending
    selectedSkills.sort((a, b) => b.relevanceScore - a.relevanceScore)

    return {
      selectedSkills,
      rejectedSkills,
      discoveryTime: Date.now() - start,
    }
  }

  // --------------------------------------------------------------------------
  // Skill Evaluation
  // --------------------------------------------------------------------------

  private evaluateSkill(
    skill: OperationalSkill,
    request: SkillDiscoveryRequest
  ): { eligible: boolean; relevanceScore: number; reason: string } {
    const scores: number[] = []
    const reasons: string[] = []

    // 1. Intent match
    const intentScore = this.scoreIntentMatch(skill, request.intent)
    if (intentScore === 0) {
      return { eligible: false, relevanceScore: 0, reason: `Skill does not support intent '${request.intent}'` }
    }
    scores.push(intentScore * 0.3)
    reasons.push(`intent match: ${(intentScore * 100).toFixed(0)}%`)

    // 2. Domain match
    const domainScore = this.scoreDomainMatch(skill, request.operationalDomain)
    if (domainScore === 0) {
      return { eligible: false, relevanceScore: 0, reason: `Skill does not support domain '${request.operationalDomain}'` }
    }
    scores.push(domainScore * 0.25)
    reasons.push(`domain match: ${(domainScore * 100).toFixed(0)}%`)

    // 3. Expertise profile match
    const profileScore = this.scoreProfileMatch(skill, request.expertiseProfile)
    if (profileScore === 0) {
      return { eligible: false, relevanceScore: 0, reason: `Skill does not support profile '${request.expertiseProfile}'` }
    }
    scores.push(profileScore * 0.2)
    reasons.push(`profile match: ${(profileScore * 100).toFixed(0)}%`)

    // 4. Reasoning strategy match (optional)
    if (request.reasoningStrategy) {
      const strategyScore = this.scoreStrategyMatch(skill, request.reasoningStrategy)
      scores.push(strategyScore * 0.15)
      reasons.push(`strategy match: ${(strategyScore * 100).toFixed(0)}%`)
    }

    // 5. Evidence availability
    const evidenceScore = this.scoreEvidenceAvailability(skill, request.availableKnowledgeCategories)
    scores.push(evidenceScore * 0.1)
    reasons.push(`evidence availability: ${(evidenceScore * 100).toFixed(0)}%`)

    const totalScore = clamp01(scores.reduce((s, v) => s + v, 0))

    return {
      eligible: totalScore > 0.3,
      relevanceScore: totalScore,
      reason: reasons.join('; '),
    }
  }

  // --------------------------------------------------------------------------
  // Scoring Functions
  // --------------------------------------------------------------------------

  private scoreIntentMatch(skill: OperationalSkill, intent: IntentType): number {
    if (skill.supportedIntents.includes(intent)) return 1.0
    // Partial credit for related intents
    const relatedIntents = this.getRelatedIntents(intent)
    const overlap = relatedIntents.filter((i) => skill.supportedIntents.includes(i)).length
    return overlap > 0 ? 0.5 : 0
  }

  private scoreDomainMatch(skill: OperationalSkill, domain: OperationalDomain): number {
    if (skill.supportedDomains.includes(domain)) return 1.0
    // Cross-domain skills get partial credit
    if (skill.supportedDomains.includes('cross_domain')) return 0.7
    // Related domains get partial credit
    const relatedDomains = this.getRelatedDomains(domain)
    const overlap = relatedDomains.filter((d) => skill.supportedDomains.includes(d)).length
    return overlap > 0 ? 0.4 : 0
  }

  private scoreProfileMatch(skill: OperationalSkill, profile: ExpertiseProfile): number {
    if (skill.supportedExpertiseProfiles.includes(profile)) return 1.0
    // Executive advisor gets partial credit for all skills (cross-profile)
    if (profile === 'executive_advisor') return 0.5
    return 0
  }

  private scoreStrategyMatch(skill: OperationalSkill, strategy: ReasoningStrategy): number {
    if (skill.supportedReasoningStrategies.includes(strategy)) return 1.0
    return 0.3 // Partial credit — skill may still be useful
  }

  private scoreEvidenceAvailability(
    skill: OperationalSkill,
    availableCategories?: string[]
  ): number {
    if (!availableCategories || availableCategories.length === 0) return 0.5 // Unknown — assume moderate
    const required = skill.requiredKnowledgeCategories
    if (required.length === 0) return 1.0
    const available = required.filter((c) => availableCategories.includes(c)).length
    return available / required.length
  }

  // --------------------------------------------------------------------------
  // Intent/Domain Relationship Maps
  // --------------------------------------------------------------------------

  private getRelatedIntents(intent: IntentType): IntentType[] {
    const relations: Partial<Record<IntentType, IntentType[]>> = {
      status_check: ['operational_review', 'trend_analysis'],
      operational_review: ['status_check', 'trend_analysis', 'decision_support'],
      trend_analysis: ['status_check', 'operational_review'],
      problem_diagnosis: ['root_cause_analysis', 'risk_assessment'],
      root_cause_analysis: ['problem_diagnosis', 'risk_assessment'],
      optimization: ['recommendation_request', 'planning'],
      recommendation_request: ['optimization', 'decision_support', 'planning'],
      prediction_request: ['trend_analysis', 'planning'],
      risk_assessment: ['problem_diagnosis', 'root_cause_analysis'],
      planning: ['prediction_request', 'recommendation_request', 'optimization'],
      decision_support: ['recommendation_request', 'operational_review'],
      comparison: ['trend_analysis', 'operational_review'],
      explanation: ['information_request'],
      information_request: ['explanation', 'status_check'],
      learning_training: ['explanation', 'information_request'],
      unknown_intent: [],
    }
    return relations[intent] || []
  }

  private getRelatedDomains(domain: OperationalDomain): OperationalDomain[] {
    const relations: Partial<Record<OperationalDomain, OperationalDomain[]>> = {
      kitchen: ['operations'],
      service: ['operations', 'customers'],
      reservations: ['service', 'customers'],
      inventory: ['operations', 'suppliers'],
      finance: ['revenue', 'operations'],
      revenue: ['finance', 'operations'],
      customers: ['service', 'marketing'],
      staff: ['operations', 'management'],
      management: ['operations', 'cross_domain'],
      marketing: ['customers'],
      suppliers: ['inventory'],
      operations: ['kitchen', 'service', 'staff'],
      cross_domain: [],
    }
    return relations[domain] || []
  }

  // --------------------------------------------------------------------------
  // Convenience Methods
  // --------------------------------------------------------------------------

  discoverForContext(context: Partial<SkillExecutionContext>): SkillDiscoveryResult {
    return this.discover({
      intent: context.intent || 'status_check',
      operationalDomain: context.operationalDomain || 'operations',
      expertiseProfile: context.expertiseProfile || 'executive_advisor',
      reasoningStrategy: context.reasoningStrategy,
      availableKnowledgeCategories: context.knowledge?.map((k) => k.category),
      context,
    })
  }

  discoverTop(request: SkillDiscoveryRequest, limit: number = 5): SkillDiscoveryResult {
    const result = this.discover(request)
    return {
      ...result,
      selectedSkills: result.selectedSkills.slice(0, limit),
    }
  }
}

// ============================================================================
// Singleton
// ============================================================================

let discoveryEngineInstance: SkillDiscoveryEngine | null = null

export function getSkillDiscoveryEngine(registry?: OperationalSkillRegistry): SkillDiscoveryEngine {
  if (!discoveryEngineInstance) {
    const reg = registry || (require('./registry').getSkillRegistry() as OperationalSkillRegistry)
    discoveryEngineInstance = new SkillDiscoveryEngine(reg)
  }
  return discoveryEngineInstance
}

export function resetSkillDiscoveryEngine(): void {
  discoveryEngineInstance = null
}
