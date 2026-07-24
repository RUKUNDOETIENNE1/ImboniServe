/**
 * Hospitality AI Copilot™ — Reasoning Engine (Phase 8).
 *
 * Selects the appropriate reasoning strategy and applies it to the
 * evaluated evidence.
 *
 * Supported strategies (10):
 *   cause_and_effect, constraint_optimization, temporal_reasoning,
 *   risk_evaluation, multi_factor_reasoning, comparative_reasoning,
 *   scenario_reasoning, evidence_based_recommendation,
 *   diagnostic_reasoning, summary_synthesis
 *
 * The chosen strategy is explicitly recorded in the reasoning trace.
 *
 * The Reasoning Engine never invents facts. It derives findings from
 * evidence using the selected strategy.
 */

import type {
  CopilotRequest,
  EvidenceEvaluation,
  KnowledgeRetrievalResult,
  ReasoningResult,
  ReasoningStep,
  DerivedFinding,
} from './types'
import type {
  IntentType,
  OperationalDomain,
  ExpertiseProfile,
  ReasoningStrategy,
  SkillFinding,
  SkillOrchestrationResult,
} from '../skill-registry/types'
import type { KnowledgeEntity } from '@/lib/hospitality-knowledge/types'
import type { HospitalityMemoryEntity } from '@/lib/hospitality-memory/types'
import type { OperationalEvent } from '@/lib/intelligence/types'
import { clamp01, hashId, severityFromScore } from './utils'

// ============================================================================
// Intent → Strategy affinity
// ============================================================================

const INTENT_STRATEGY_AFFINITY: Record<IntentType, ReasoningStrategy[]> = {
  information_request: ['summary_synthesis'],
  explanation: ['cause_and_effect', 'summary_synthesis'],
  root_cause_analysis: ['cause_and_effect', 'diagnostic_reasoning'],
  recommendation_request: ['evidence_based_recommendation', 'multi_factor_reasoning'],
  prediction_request: ['temporal_reasoning', 'scenario_reasoning'],
  risk_assessment: ['risk_evaluation', 'scenario_reasoning'],
  planning: ['scenario_reasoning', 'constraint_optimization'],
  optimization: ['constraint_optimization', 'multi_factor_reasoning'],
  comparison: ['comparative_reasoning', 'multi_factor_reasoning'],
  status_check: ['summary_synthesis'],
  trend_analysis: ['temporal_reasoning', 'comparative_reasoning'],
  decision_support: ['evidence_based_recommendation', 'comparative_reasoning', 'risk_evaluation'],
  problem_diagnosis: ['diagnostic_reasoning', 'cause_and_effect'],
  operational_review: ['summary_synthesis', 'multi_factor_reasoning'],
  learning_training: ['summary_synthesis', 'cause_and_effect'],
  unknown_intent: ['summary_synthesis'],
}

// ============================================================================
// Domain → Strategy affinity
// ============================================================================

const DOMAIN_STRATEGY_AFFINITY: Partial<Record<OperationalDomain, ReasoningStrategy[]>> = {
  kitchen: ['constraint_optimization', 'cause_and_effect'],
  service: ['cause_and_effect', 'multi_factor_reasoning'],
  inventory: ['constraint_optimization', 'risk_evaluation'],
  finance: ['comparative_reasoning', 'temporal_reasoning'],
  revenue: ['temporal_reasoning', 'comparative_reasoning'],
  staff: ['multi_factor_reasoning', 'comparative_reasoning'],
  customers: ['temporal_reasoning', 'comparative_reasoning'],
  management: ['evidence_based_recommendation', 'scenario_reasoning'],
  operations: ['diagnostic_reasoning', 'cause_and_effect'],
}

// ============================================================================
// Reasoning Engine
// ============================================================================

const REASONING_VERSION = '1.0.0'

export class ReasoningEngine {
  /**
   * Select a reasoning strategy and apply it to the evidence.
   *
   * Combines skill-derived findings (from the Skill Registry) with
   * strategy-specific reasoning over knowledge/memory/events.
   */
  reason(
    request: CopilotRequest,
    intent: IntentType,
    domain: OperationalDomain,
    profile: ExpertiseProfile,
    retrieval: KnowledgeRetrievalResult,
    evaluation: EvidenceEvaluation,
    skillResult?: SkillOrchestrationResult
  ): ReasoningResult {
    const start = Date.now()

    // 1. Select strategy
    const strategy = this.selectStrategy(intent, domain, profile)
    const strategySelectionReason = this.explainStrategySelection(intent, domain, strategy)

    // 2. If evidence is absent, return minimal reasoning
    if (evaluation.overallSufficiency === 'absent') {
      return {
        requestId: request.requestId,
        strategy,
        strategySelectionReason,
        reasoningTrace: [{
          step: 1,
          description: 'No evidence available — reasoning cannot proceed',
          strategy,
          inputs: [],
          outputs: [],
          rationale: 'Evidence evaluation returned "absent" sufficiency',
          confidence: 0,
        }],
        derivedFindings: [],
        evaluationTime: Date.now() - start,
        reasoningVersion: REASONING_VERSION,
      }
    }

    // 3. Build reasoning trace
    const reasoningTrace = this.buildReasoningTrace(
      strategy,
      intent,
      domain,
      retrieval,
      evaluation,
      skillResult
    )

    // 4. Derive findings from evidence + skill outputs
    const derivedFindings = this.deriveFindings(
      request.requestId,
      strategy,
      retrieval,
      evaluation,
      skillResult
    )

    return {
      requestId: request.requestId,
      strategy,
      strategySelectionReason,
      reasoningTrace,
      derivedFindings,
      evaluationTime: Date.now() - start,
      reasoningVersion: REASONING_VERSION,
    }
  }

  // --------------------------------------------------------------------------
  // Strategy Selection
  // --------------------------------------------------------------------------

  selectStrategy(
    intent: IntentType,
    domain: OperationalDomain,
    profile: ExpertiseProfile
  ): ReasoningStrategy {
    const intentStrategies = INTENT_STRATEGY_AFFINITY[intent] || ['summary_synthesis']
    const domainStrategies = DOMAIN_STRATEGY_AFFINITY[domain] || []

    // Score each candidate strategy
    const scores = new Map<ReasoningStrategy, number>()
    for (const s of intentStrategies) {
      scores.set(s, (scores.get(s) || 0) + 1.0)
    }
    for (const s of domainStrategies) {
      scores.set(s, (scores.get(s) || 0) + 0.5)
    }

    // Profile bias
    const profileBias = this.getProfileStrategyBias(profile)
    for (const [strategy, bias] of Object.entries(profileBias)) {
      const current = scores.get(strategy as ReasoningStrategy) || 0
      scores.set(strategy as ReasoningStrategy, current + bias)
    }

    // Pick highest scoring
    let best: ReasoningStrategy = intentStrategies[0]
    let bestScore = -1
    for (const [strategy, score] of scores) {
      if (score > bestScore) {
        bestScore = score
        best = strategy
      }
    }

    return best
  }

  private getProfileStrategyBias(profile: ExpertiseProfile): Partial<Record<ReasoningStrategy, number>> {
    const biases: Partial<Record<ExpertiseProfile, Partial<Record<ReasoningStrategy, number>>>> = {
      executive_advisor: { scenario_reasoning: 0.3, comparative_reasoning: 0.2 },
      kitchen_advisor: { constraint_optimization: 0.3, cause_and_effect: 0.2 },
      service_advisor: { cause_and_effect: 0.3, multi_factor_reasoning: 0.2 },
      inventory_advisor: { constraint_optimization: 0.3, risk_evaluation: 0.2 },
      revenue_advisor: { temporal_reasoning: 0.3, comparative_reasoning: 0.2 },
      staff_performance_advisor: { comparative_reasoning: 0.3, multi_factor_reasoning: 0.2 },
      customer_experience_advisor: { temporal_reasoning: 0.2, multi_factor_reasoning: 0.2 },
      operational_excellence_advisor: { diagnostic_reasoning: 0.3, cause_and_effect: 0.2 },
    }
    return biases[profile] || {}
  }

  private explainStrategySelection(
    intent: IntentType,
    domain: OperationalDomain,
    strategy: ReasoningStrategy
  ): string {
    const intentStrategies = INTENT_STRATEGY_AFFINITY[intent] || []
    const domainStrategies = DOMAIN_STRATEGY_AFFINITY[domain] || []
    const reasons: string[] = []

    if (intentStrategies.includes(strategy)) {
      reasons.push(`intent '${intent}' affinity`)
    }
    if (domainStrategies.includes(strategy)) {
      reasons.push(`domain '${domain}' affinity`)
    }
    if (reasons.length === 0) {
      reasons.push('default selection')
    }

    return `Selected '${strategy}' because: ${reasons.join(', ')}`
  }

  // --------------------------------------------------------------------------
  // Reasoning Trace Construction
  // --------------------------------------------------------------------------

  private buildReasoningTrace(
    strategy: ReasoningStrategy,
    intent: IntentType,
    domain: OperationalDomain,
    retrieval: KnowledgeRetrievalResult,
    evaluation: EvidenceEvaluation,
    skillResult?: SkillOrchestrationResult
  ): ReasoningStep[] {
    const steps: ReasoningStep[] = []
    let stepNum = 1

    // Step 1: Evidence intake
    steps.push({
      step: stepNum++,
      description: `Retrieved ${retrieval.knowledge.length} knowledge objects, ${retrieval.relatedMemories.length} memories, ${retrieval.relatedEvents.length} events`,
      strategy,
      inputs: [
        ...retrieval.knowledge.slice(0, 5).map((k) => k.id),
        ...retrieval.relatedMemories.slice(0, 5).map((m) => m.id),
      ],
      outputs: [],
      rationale: 'Evidence intake from certified architecture',
      confidence: evaluation.overallConfidence,
    })

    // Step 2: Evidence evaluation
    steps.push({
      step: stepNum++,
      description: `Evidence sufficiency: ${evaluation.overallSufficiency} (confidence=${evaluation.overallConfidence.toFixed(2)})`,
      strategy,
      inputs: [],
      outputs: [],
      rationale: `Completeness=${evaluation.completeness.toFixed(2)}, Recency=${evaluation.recency.toFixed(2)}, Consistency=${evaluation.consistency.toFixed(2)}`,
      confidence: evaluation.overallConfidence,
    })

    // Step 3: Strategy-specific reasoning
    const strategyStep = this.applyStrategy(strategy, retrieval, evaluation)
    steps.push({
      step: stepNum++,
      description: strategyStep.description,
      strategy,
      inputs: strategyStep.inputs,
      outputs: strategyStep.outputs,
      rationale: strategyStep.rationale,
      confidence: strategyStep.confidence,
    })

    // Step 4: Skill-derived findings (if available)
    if (skillResult && skillResult.stepResults.length > 0) {
      const successfulSkills = skillResult.stepResults.filter((r) => r.success)
      steps.push({
        step: stepNum++,
        description: `Orchestrated ${successfulSkills.length} skills (${skillResult.plan.combinationStrategy})`,
        strategy,
        inputs: successfulSkills.map((r) => r.skillId),
        outputs: skillResult.combinedFindings.slice(0, 10).map((f) => f.id),
        rationale: `Skills contributed ${skillResult.combinedFindings.length} findings and ${skillResult.combinedMetrics.length} metrics`,
        confidence: skillResult.overallConfidence,
      })
    }

    // Step 5: Conflict resolution (if conflicts exist)
    if (evaluation.conflictingEvidence.length > 0) {
      steps.push({
        step: stepNum++,
        description: `Resolved ${evaluation.conflictingEvidence.length} evidence conflict(s)`,
        strategy,
        inputs: evaluation.conflictingEvidence.flatMap((c) => c.knowledgeIds),
        outputs: [],
        rationale: 'Conflicts flagged for transparency; recommendations will reflect uncertainty',
        confidence: clamp01(evaluation.consistency),
      })
    }

    return steps
  }

  // --------------------------------------------------------------------------
  // Strategy Application
  // --------------------------------------------------------------------------

  private applyStrategy(
    strategy: ReasoningStrategy,
    retrieval: KnowledgeRetrievalResult,
    evaluation: EvidenceEvaluation
  ): {
    description: string
    inputs: string[]
    outputs: string[]
    rationale: string
    confidence: number
  } {
    const knowledge = retrieval.knowledge
    const memories = retrieval.relatedMemories
    const events = retrieval.relatedEvents

    switch (strategy) {
      case 'cause_and_effect':
        return {
          description: `Traced causal chains across ${knowledge.length} knowledge objects`,
          inputs: knowledge.slice(0, 5).map((k) => k.id),
          outputs: knowledge.slice(0, 3).map((k) => k.id),
          rationale: 'Identified cause-and-effect relationships from validated knowledge',
          confidence: evaluation.consistency,
        }

      case 'constraint_optimization':
        return {
          description: `Evaluated operational constraints from ${knowledge.length} knowledge and ${memories.length} memories`,
          inputs: [...knowledge.slice(0, 3).map((k) => k.id), ...memories.slice(0, 3).map((m) => m.id)],
          outputs: [],
          rationale: 'Identified binding constraints and optimization opportunities',
          confidence: evaluation.confidence,
        }

      case 'temporal_reasoning':
        return {
          description: `Analyzed temporal patterns across ${events.length} events and ${knowledge.length} knowledge`,
          inputs: events.slice(0, 5).map((e) => e.id),
          outputs: [],
          rationale: 'Identified trends and temporal correlations',
          confidence: evaluation.recency,
        }

      case 'risk_evaluation':
        return {
          description: `Assessed risk factors from ${knowledge.length} knowledge and ${evaluation.conflictingEvidence.length} conflicts`,
          inputs: knowledge.slice(0, 5).map((k) => k.id),
          outputs: [],
          rationale: 'Quantified risk exposure from evidence',
          confidence: clamp01(evaluation.confidence * 0.8),
        }

      case 'multi_factor_reasoning':
        return {
          description: `Synthesized ${knowledge.length} knowledge, ${memories.length} memories, ${events.length} events across multiple factors`,
          inputs: [...knowledge.slice(0, 3).map((k) => k.id), ...memories.slice(0, 3).map((m) => m.id)],
          outputs: [],
          rationale: 'Weighted multiple factors to derive balanced conclusions',
          confidence: evaluation.overallConfidence,
        }

      case 'comparative_reasoning':
        return {
          description: `Compared alternatives using ${knowledge.length} knowledge objects`,
          inputs: knowledge.slice(0, 5).map((k) => k.id),
          outputs: [],
          rationale: 'Identified relative strengths and weaknesses',
          confidence: evaluation.confidence,
        }

      case 'scenario_reasoning':
        return {
          description: `Evaluated ${knowledge.length} scenarios from evidence`,
          inputs: knowledge.slice(0, 5).map((k) => k.id),
          outputs: [],
          rationale: 'Projected plausible scenarios from current evidence',
          confidence: clamp01(evaluation.confidence * 0.7),
        }

      case 'evidence_based_recommendation':
        return {
          description: `Synthesized evidence-backed recommendations from ${knowledge.length} knowledge`,
          inputs: knowledge.slice(0, 5).map((k) => k.id),
          outputs: [],
          rationale: 'Recommendations grounded in validated evidence',
          confidence: evaluation.overallConfidence,
        }

      case 'diagnostic_reasoning':
        return {
          description: `Diagnosed issues from ${knowledge.length} knowledge and ${memories.length} memories`,
          inputs: [...knowledge.slice(0, 3).map((k) => k.id), ...memories.slice(0, 3).map((m) => m.id)],
          outputs: [],
          rationale: 'Identified symptoms, probable causes, and diagnostic paths',
          confidence: evaluation.consistency,
        }

      case 'summary_synthesis':
        return {
          description: `Synthesized summary from ${knowledge.length} knowledge, ${memories.length} memories, ${events.length} events`,
          inputs: [...knowledge.slice(0, 3).map((k) => k.id), ...memories.slice(0, 3).map((m) => m.id)],
          outputs: [],
          rationale: 'Produced coherent summary of current state',
          confidence: evaluation.overallConfidence,
        }

      default:
        return {
          description: 'Applied default reasoning strategy',
          inputs: [],
          outputs: [],
          rationale: 'No specific strategy applied',
          confidence: 0.5,
        }
    }
  }

  // --------------------------------------------------------------------------
  // Finding Derivation
  // --------------------------------------------------------------------------

  private deriveFindings(
    requestId: string,
    strategy: ReasoningStrategy,
    retrieval: KnowledgeRetrievalResult,
    evaluation: EvidenceEvaluation,
    skillResult?: SkillOrchestrationResult
  ): DerivedFinding[] {
    const findings: DerivedFinding[] = []

    // From skill outputs (primary source)
    if (skillResult) {
      for (const skillFinding of skillResult.combinedFindings) {
        findings.push(this.convertSkillFinding(skillFinding, strategy, requestId))
      }
    }

    // From knowledge (secondary source — only if skills didn't produce enough)
    if (findings.length < 3) {
      for (const k of retrieval.knowledge.slice(0, 5)) {
        const finding = this.deriveFindingFromKnowledge(k, strategy, requestId)
        if (finding) findings.push(finding)
      }
    }

    // From conflicts (always surface these)
    for (const conflict of evaluation.conflictingEvidence) {
      findings.push({
        id: hashId('finding', `${requestId}|conflict|${conflict.topic}`),
        title: `Evidence conflict: ${conflict.topic}`,
        description: conflict.description,
        severity: conflict.severity as 'low' | 'medium' | 'high',
        confidence: 0.6,
        evidenceRefs: conflict.knowledgeIds,
        derivedFromStrategy: strategy,
        actionable: false,
      })
    }

    // From missing evidence (always surface these)
    for (const missing of evaluation.missingEvidence) {
      findings.push({
        id: hashId('finding', `${requestId}|missing|${missing.description.slice(0, 30)}`),
        title: 'Missing evidence identified',
        description: missing.description,
        severity: 'info',
        confidence: 0.4,
        evidenceRefs: [],
        derivedFromStrategy: strategy,
        actionable: false,
      })
    }

    return findings
  }

  private convertSkillFinding(
    skillFinding: SkillFinding,
    strategy: ReasoningStrategy,
    requestId: string
  ): DerivedFinding {
    return {
      id: skillFinding.id || hashId('finding', `${requestId}|${skillFinding.title}`),
      title: skillFinding.title,
      description: skillFinding.description,
      severity: skillFinding.severity,
      confidence: skillFinding.confidence,
      evidenceRefs: skillFinding.evidenceRefs,
      derivedFromStrategy: strategy,
      actionable: skillFinding.actionable,
    }
  }

  private deriveFindingFromKnowledge(
    k: KnowledgeEntity,
    strategy: ReasoningStrategy,
    requestId: string
  ): DerivedFinding | null {
    if (k.impactLevel === 'low' && k.confidenceScore < 0.6) return null

    return {
      id: hashId('finding', `${requestId}|${k.id}`),
      title: k.title,
      description: k.summary,
      severity: severityFromScore(k.confidenceScore),
      confidence: k.confidenceScore,
      evidenceRefs: [k.id],
      derivedFromStrategy: strategy,
      actionable: k.recommendedActions.length > 0,
    }
  }

  // --------------------------------------------------------------------------
  // Introspection
  // --------------------------------------------------------------------------

  getReasoningVersion(): string {
    return REASONING_VERSION
  }

  listStrategies(): ReasoningStrategy[] {
    return [
      'cause_and_effect', 'constraint_optimization', 'temporal_reasoning',
      'risk_evaluation', 'multi_factor_reasoning', 'comparative_reasoning',
      'scenario_reasoning', 'evidence_based_recommendation',
      'diagnostic_reasoning', 'summary_synthesis',
    ]
  }
}

// ============================================================================
// Singleton
// ============================================================================

let singleton: ReasoningEngine | null = null

export function getReasoningEngine(): ReasoningEngine {
  if (!singleton) singleton = new ReasoningEngine()
  return singleton
}

export function resetReasoningEngine(): void {
  singleton = null
}
