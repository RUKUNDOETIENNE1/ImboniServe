/**
 * Hospitality AI Copilot™ — Explainability Engine (Phase 10).
 *
 * Every recommendation includes a complete reasoning trace.
 *
 * Required trace structure:
 *   User Question → Intent Classification → Operational Domain →
 *   Expertise Profile → Operational Skills Used → Context →
 *   Knowledge Objects → Supporting Memories → Supporting Events →
 *   Evidence Evaluation → Reasoning Strategy → Alternative Options →
 *   Recommendation → Confidence Assessment → Explanation → Final Response
 *
 * Users must always be able to understand why a recommendation was made.
 */

import type {
  CopilotRequest,
  OperationalContext,
  IntentClassification,
  DomainDetection,
  ExpertiseSelection,
  KnowledgeRetrievalResult,
  EvidenceEvaluation,
  ReasoningResult,
  CopilotRecommendation,
  ExplainabilityTrace,
} from './types'
import type { SkillOrchestrationResult } from '../skill-registry/types'
import { nowIso, clamp01 } from './utils'

// ============================================================================
// Explainability Engine
// ============================================================================

const EXPLAINABILITY_VERSION = '1.0.0'

export class ExplainabilityEngine {
  /**
   * Build a complete explainability trace for a single recommendation.
   *
   * The trace captures every stage of the reasoning pipeline so users
   * can inspect why a recommendation was made.
   */
  buildTrace(
    request: CopilotRequest,
    intentClassification: IntentClassification,
    domainDetection: DomainDetection,
    expertiseSelection: ExpertiseSelection,
    context: OperationalContext,
    retrieval: KnowledgeRetrievalResult,
    evaluation: EvidenceEvaluation,
    reasoning: ReasoningResult,
    recommendation: CopilotRecommendation,
    skillResult?: SkillOrchestrationResult,
    level: 'brief' | 'standard' | 'full' = 'standard'
  ): ExplainabilityTrace {
    const skillsUsed = this.extractSkillsUsed(skillResult, recommendation)
    const knowledgeObjects = this.extractKnowledgeObjects(retrieval, recommendation, level)
    const supportingMemories = this.extractSupportingMemories(retrieval, recommendation, level)
    const supportingEvents = this.extractSupportingEvents(retrieval, recommendation, level)

    const explanation = this.generateNarrative(
      request,
      intentClassification,
      domainDetection,
      expertiseSelection,
      context,
      evaluation,
      reasoning,
      recommendation,
      skillsUsed.length,
      level
    )

    const traceWarnings: string[] = []
    if (evaluation.overallSufficiency !== 'sufficient') {
      traceWarnings.push(`Evidence sufficiency is '${evaluation.overallSufficiency}' — confidence is reduced`)
    }
    if (evaluation.conflictingEvidence.length > 0) {
      traceWarnings.push(`${evaluation.conflictingEvidence.length} evidence conflict(s) detected`)
    }
    if (recommendation.evidenceRefs.length === 0) {
      traceWarnings.push('Recommendation has no evidence references — provenance incomplete')
    }

    const traceComplete =
      recommendation.evidenceRefs.length > 0 &&
      knowledgeObjects.length > 0 &&
      evaluation.overallSufficiency !== 'absent'

    return {
      requestId: request.requestId,
      recommendationId: recommendation.id,
      userQuestion: request.question,
      intentClassification,
      domainDetection,
      expertiseSelection,
      skillsUsed,
      context,
      knowledgeObjects,
      supportingMemories,
      supportingEvents,
      evidenceEvaluation: evaluation,
      reasoningStrategy: reasoning.strategy,
      reasoningSteps: reasoning.reasoningTrace,
      alternativeOptions: recommendation.alternativeOptions,
      recommendation,
      confidenceAssessment: recommendation.confidenceFactors,
      explanation,
      generatedAt: nowIso(),
      traceVersion: EXPLAINABILITY_VERSION,
      traceComplete,
      traceWarnings,
    }
  }

  /**
   * Build explainability traces for all recommendations in a response.
   */
  buildTraces(
    request: CopilotRequest,
    intentClassification: IntentClassification,
    domainDetection: DomainDetection,
    expertiseSelection: ExpertiseSelection,
    context: OperationalContext,
    retrieval: KnowledgeRetrievalResult,
    evaluation: EvidenceEvaluation,
    reasoning: ReasoningResult,
    recommendations: CopilotRecommendation[],
    skillResult?: SkillOrchestrationResult,
    level: 'brief' | 'standard' | 'full' = 'standard'
  ): ExplainabilityTrace[] {
    return recommendations.map((rec) =>
      this.buildTrace(
        request,
        intentClassification,
        domainDetection,
        expertiseSelection,
        context,
        retrieval,
        evaluation,
        reasoning,
        rec,
        skillResult,
        level
      )
    )
  }

  // --------------------------------------------------------------------------
  // Skill extraction
  // --------------------------------------------------------------------------

  private extractSkillsUsed(
    skillResult: SkillOrchestrationResult | undefined,
    recommendation: CopilotRecommendation
  ): Array<{ skillId: string; skillName: string; relevance: number }> {
    if (!skillResult) return []
    return skillResult.stepResults
      .filter((r) => r.success && recommendation.skillIds.includes(r.skillId))
      .map((r) => ({
        skillId: r.skillId,
        skillName: r.skillName,
        relevance: clamp01(r.confidence),
      }))
  }

  // --------------------------------------------------------------------------
  // Knowledge/Memory/Event extraction
  // --------------------------------------------------------------------------

  private extractKnowledgeObjects(
    retrieval: KnowledgeRetrievalResult,
    recommendation: CopilotRecommendation,
    level: 'brief' | 'standard' | 'full'
  ): Array<{ id: string; title: string; category: string; confidence: string }> {
    const referenced = retrieval.knowledge.filter((k) =>
      recommendation.evidenceRefs.includes(k.id)
    )
    const limit = level === 'brief' ? 3 : level === 'standard' ? 5 : 10
    return referenced.slice(0, limit).map((k) => ({
      id: k.id,
      title: k.title,
      category: k.category,
      confidence: k.confidence,
    }))
  }

  private extractSupportingMemories(
    retrieval: KnowledgeRetrievalResult,
    recommendation: CopilotRecommendation,
    level: 'brief' | 'standard' | 'full'
  ): Array<{ id: string; title: string; confidence: number }> {
    // Find memories that support the referenced knowledge
    const referencedKnowledge = retrieval.knowledge.filter((k) =>
      recommendation.evidenceRefs.includes(k.id)
    )
    const memoryIds = new Set<string>()
    for (const k of referencedKnowledge) {
      for (const ref of k.provenance?.memoryRefs || []) {
        memoryIds.add(ref.memoryId)
      }
    }
    // Also include directly referenced memories
    for (const memId of recommendation.evidenceRefs) {
      memoryIds.add(memId)
    }

    const referenced = retrieval.relatedMemories.filter((m) => memoryIds.has(m.id))
    const limit = level === 'brief' ? 2 : level === 'standard' ? 5 : 10
    return referenced.slice(0, limit).map((m) => ({
      id: m.id,
      title: m.title,
      confidence: m.confidenceScore,
    }))
  }

  private extractSupportingEvents(
    retrieval: KnowledgeRetrievalResult,
    recommendation: CopilotRecommendation,
    level: 'brief' | 'standard' | 'full'
  ): Array<{ id: string; type: string; timestamp: string }> {
    // Find events that support the referenced memories
    const referencedKnowledge = retrieval.knowledge.filter((k) =>
      recommendation.evidenceRefs.includes(k.id)
    )
    const memoryIds = new Set<string>()
    for (const k of referencedKnowledge) {
      for (const ref of k.provenance?.memoryRefs || []) {
        memoryIds.add(ref.memoryId)
      }
    }
    const referencedMemories = retrieval.relatedMemories.filter((m) => memoryIds.has(m.id))
    const eventIds = new Set<string>()
    for (const m of referencedMemories) {
      for (const obs of m.provenance?.observationRefs || []) {
        eventIds.add(obs.eventId)
      }
    }
    // Also include directly referenced events
    for (const eventId of recommendation.evidenceRefs) {
      eventIds.add(eventId)
    }

    const referenced = retrieval.relatedEvents.filter((e) => eventIds.has(e.id))
    const limit = level === 'brief' ? 2 : level === 'standard' ? 5 : 10
    return referenced.slice(0, limit).map((e) => ({
      id: e.id,
      type: e.type,
      timestamp: e.timestamp,
    }))
  }

  // --------------------------------------------------------------------------
  // Narrative generation
  // --------------------------------------------------------------------------

  private generateNarrative(
    request: CopilotRequest,
    intentClassification: IntentClassification,
    domainDetection: DomainDetection,
    expertiseSelection: ExpertiseSelection,
    context: OperationalContext,
    evaluation: EvidenceEvaluation,
    reasoning: ReasoningResult,
    recommendation: CopilotRecommendation,
    skillsUsedCount: number,
    level: 'brief' | 'standard' | 'full'
  ): string {
    const parts: string[] = []

    // Question & intent
    parts.push(`You asked: "${request.question}"`)
    parts.push(`I classified this as a ${intentClassification.intent.replace(/_/g, ' ')} request (confidence: ${(intentClassification.confidence * 100).toFixed(0)}%).`)

    if (level === 'brief') {
      parts.push(`This is a ${domainDetection.primaryDomain} domain question.`)
      parts.push(`Recommendation: ${recommendation.title} — ${recommendation.description}`)
      parts.push(`Confidence: ${(recommendation.confidence * 100).toFixed(0)}%.`)
      return parts.join(' ')
    }

    // Domain
    if (domainDetection.isCrossDomain) {
      parts.push(`This question spans multiple domains: ${domainDetection.primaryDomain}${domainDetection.secondaryDomains.length > 0 ? ` and ${domainDetection.secondaryDomains.map((d) => d.domain).join(', ')}` : ''}.`)
    } else {
      parts.push(`This is a ${domainDetection.primaryDomain} domain question.`)
    }

    // Expertise profile
    parts.push(`I applied the ${expertiseSelection.profile.replace(/_/g, ' ')} perspective.`)

    // Standard/Full level: add context and evidence (brief already returned above)
    parts.push(`Operational context: ${context.shift} shift, ${context.timeOfDay}, ${context.dayOfWeek}.`)
    parts.push(`Evidence evaluation: ${evaluation.overallSufficiency} (overall confidence: ${(evaluation.overallConfidence * 100).toFixed(0)}%).`)
    if (evaluation.conflictingEvidence.length > 0) {
      parts.push(`${evaluation.conflictingEvidence.length} evidence conflict(s) were detected and flagged.`)
    }
    if (evaluation.missingEvidence.length > 0) {
      parts.push(`${evaluation.missingEvidence.length} evidence gap(s) were identified.`)
    }

    // Reasoning
    parts.push(`I used ${reasoning.strategy.replace(/_/g, ' ')} reasoning.`)
    if (skillsUsedCount > 0) {
      parts.push(`${skillsUsedCount} operational skill(s) contributed to this analysis.`)
    }

    // Recommendation
    parts.push(`Recommendation: ${recommendation.title} — ${recommendation.description}`)
    parts.push(`Priority: ${recommendation.priority}. Confidence: ${(recommendation.confidence * 100).toFixed(0)}%.`)

    // Alternatives
    if (recommendation.alternativeOptions.length > 0) {
      parts.push(`${recommendation.alternativeOptions.length} alternative option(s) are available.`)
    }

    // Full level: add detailed reasoning steps
    if (level === 'full') {
      parts.push('Reasoning steps:')
      for (const step of reasoning.reasoningTrace) {
        parts.push(`  ${step.step}. ${step.description}`)
      }
      if (recommendation.risks.length > 0) {
        parts.push(`Risks: ${recommendation.risks.join('; ')}`)
      }
      if (recommendation.prerequisites.length > 0) {
        parts.push(`Prerequisites: ${recommendation.prerequisites.join('; ')}`)
      }
    }

    // Human decision support reminder
    parts.push('This recommendation requires human approval before implementation.')

    return parts.join(' ')
  }

  // --------------------------------------------------------------------------
  // Introspection
  // --------------------------------------------------------------------------

  getExplainabilityVersion(): string {
    return EXPLAINABILITY_VERSION
  }
}

// ============================================================================
// Singleton
// ============================================================================

let singleton: ExplainabilityEngine | null = null

export function getExplainabilityEngine(): ExplainabilityEngine {
  if (!singleton) singleton = new ExplainabilityEngine()
  return singleton
}

export function resetExplainabilityEngine(): void {
  singleton = null
}
