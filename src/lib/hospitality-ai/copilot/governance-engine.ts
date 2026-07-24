/**
 * Hospitality AI Copilot™ — Safety & Governance Engine (Phase 11).
 *
 * Enforces the Safety & Governance principles:
 *   - The Copilot must never invent business facts
 *   - The Copilot must never bypass evidence
 *   - The Copilot must never bypass Hospitality Memory™
 *   - The Copilot must never bypass Hospitality Knowledge™
 *   - The Copilot must never bypass Heart Pulse™
 *   - The Copilot must never hide reasoning state
 *   - The Copilot must never make irreversible decisions without human approval
 *
 * All reasoning must remain fully auditable.
 *
 * The Governance Engine attaches a compliance record to every Copilot response.
 */

import type {
  CopilotRequest,
  CopilotResponse,
  CopilotRecommendation,
  ExplainabilityTrace,
  KnowledgeRetrievalResult,
  EvidenceEvaluation,
  ReasoningResult,
  CopilotGovernanceRecord,
  GovernanceViolation,
} from './types'
import { hashId, nowIso, clamp01 } from './utils'

// ============================================================================
// Governance Engine
// ============================================================================

const GOVERNANCE_VERSION = '1.0.0'

export class GovernanceEngine {
  /**
   * Evaluate a Copilot response for compliance with all governance principles.
   *
   * Returns a governance record that is attached to the response.
   */
  evaluate(
    request: CopilotRequest,
    response: CopilotResponse
  ): CopilotGovernanceRecord {
    const violations: GovernanceViolation[] = []

    // Principle 1: Evidence Before Intelligence
    const evidenceFirstPrinciple = this.checkEvidenceFirst(response, violations)

    // Principle 2: Explainability by Design
    const explainabilityByDesignPrinciple = this.checkExplainabilityByDesign(response, violations)

    // Principle 3: No Hidden State
    const noHiddenStatePrinciple = this.checkNoHiddenState(response, violations)

    // Principle 4: Human Decision Support (never autonomous)
    const humanDecisionSupportPrinciple = this.checkHumanDecisionSupport(response, violations)

    // Principle 5: Complete Auditability
    const completeAuditabilityPrinciple = this.checkCompleteAuditability(response, violations)

    // Principle 6: Provenance Intact
    const provenanceIntactPrinciple = this.checkProvenanceIntact(response, violations)

    // Composite checks
    const allRecommendationsRequireHumanApproval = response.recommendations.every((r) => r.requiresHumanApproval)
    const allRecommendationsHaveEvidence = response.recommendations.every((r) => r.evidenceRefs.length > 0)
    const allRecommendationsHaveExplainability = response.recommendations.every((r) =>
      response.explainabilityTraces.some((t) => t.recommendationId === r.id)
    )
    const noInventedFacts = this.checkNoInventedFacts(response, violations)
    const noBypassedArchitecture = this.checkNoBypassedArchitecture(response, violations)

    if (!allRecommendationsRequireHumanApproval) {
      violations.push({
        principle: 'Human Decision Support',
        severity: 'critical',
        description: 'One or more recommendations do not require human approval',
        remediation: 'All recommendations must set requiresHumanApproval=true',
      })
    }

    if (!allRecommendationsHaveEvidence && response.recommendations.length > 0) {
      violations.push({
        principle: 'Evidence Before Intelligence',
        severity: 'high',
        description: 'One or more recommendations have no evidence references',
        remediation: 'Every recommendation must reference at least one evidence item',
      })
    }

    if (!allRecommendationsHaveExplainability && response.recommendations.length > 0) {
      violations.push({
        principle: 'Explainability by Design',
        severity: 'high',
        description: 'One or more recommendations lack explainability traces',
        remediation: 'Every recommendation must have an explainability trace',
      })
    }

    // Compliance score
    const totalChecks = 11
    const passedChecks = [
      evidenceFirstPrinciple,
      explainabilityByDesignPrinciple,
      noHiddenStatePrinciple,
      humanDecisionSupportPrinciple,
      completeAuditabilityPrinciple,
      provenanceIntactPrinciple,
      allRecommendationsRequireHumanApproval,
      allRecommendationsHaveEvidence,
      allRecommendationsHaveExplainability,
      noInventedFacts,
      noBypassedArchitecture,
    ].filter(Boolean).length

    const complianceScore = clamp01(passedChecks / totalChecks)
    const compliant = violations.filter((v) => v.severity === 'critical' || v.severity === 'high').length === 0

    return {
      requestId: request.requestId,
      responseId: hashId('resp', request.requestId),
      generatedAt: nowIso(),
      evidenceFirstPrinciple,
      explainabilityByDesignPrinciple,
      noHiddenStatePrinciple,
      humanDecisionSupportPrinciple,
      completeAuditabilityPrinciple,
      provenanceIntactPrinciple,
      allRecommendationsRequireHumanApproval,
      allRecommendationsHaveEvidence,
      allRecommendationsHaveExplainability,
      noInventedFacts,
      noBypassedArchitecture,
      violations,
      compliant,
      complianceScore,
    }
  }

  // --------------------------------------------------------------------------
  // Principle checks
  // --------------------------------------------------------------------------

  private checkEvidenceFirst(response: CopilotResponse, violations: GovernanceViolation[]): boolean {
    // Every recommendation must have evidence references
    if (response.recommendations.length === 0) return true  // No recommendations = no violation
    const allHaveEvidence = response.recommendations.every((r) => r.evidenceRefs.length > 0)
    if (!allHaveEvidence) {
      violations.push({
        principle: 'Evidence Before Intelligence',
        severity: 'high',
        description: 'Recommendations exist without evidence references',
        remediation: 'Ensure all recommendations reference validated evidence',
      })
    }
    return allHaveEvidence
  }

  private checkExplainabilityByDesign(response: CopilotResponse, violations: GovernanceViolation[]): boolean {
    // Every recommendation must have an explainability trace
    if (response.recommendations.length === 0) return true
    const allHaveTraces = response.recommendations.every((r) =>
      response.explainabilityTraces.some((t) => t.recommendationId === r.id)
    )
    if (!allHaveTraces) {
      violations.push({
        principle: 'Explainability by Design',
        severity: 'high',
        description: 'Recommendations exist without explainability traces',
        remediation: 'Generate explainability traces for all recommendations',
      })
    }

    // Check that traces are complete
    const incompleteTraces = response.explainabilityTraces.filter((t) => !t.traceComplete)
    if (incompleteTraces.length > 0) {
      violations.push({
        principle: 'Explainability by Design',
        severity: 'medium',
        description: `${incompleteTraces.length} explainability trace(s) are incomplete`,
        remediation: 'Ensure all traces have complete provenance',
      })
    }

    return allHaveTraces && incompleteTraces.length === 0
  }

  private checkNoHiddenState(response: CopilotResponse, violations: GovernanceViolation[]): boolean {
    // All reasoning state must be visible in the response
    // Check: reasoning trace exists, evidence evaluation exists, context exists
    const hasReasoning = response.reasoning.reasoningTrace.length > 0
    const hasEvidence = response.evidenceEvaluation !== undefined
    const hasContext = response.context !== undefined

    if (!hasReasoning || !hasEvidence || !hasContext) {
      violations.push({
        principle: 'No Hidden State',
        severity: 'medium',
        description: 'Response is missing reasoning trace, evidence evaluation, or context',
        remediation: 'Ensure all pipeline stages are visible in the response',
      })
      return false
    }
    return true
  }

  private checkHumanDecisionSupport(response: CopilotResponse, violations: GovernanceViolation[]): boolean {
    // All recommendations must require human approval
    if (response.recommendations.length === 0) return true
    const allRequireApproval = response.recommendations.every((r) => r.requiresHumanApproval)
    if (!allRequireApproval) {
      violations.push({
        principle: 'Human Decision Support',
        severity: 'critical',
        description: 'One or more recommendations do not require human approval',
        remediation: 'Set requiresHumanApproval=true on all recommendations',
      })
    }

    // Check: no recommendation is marked as autonomous
    const autonomousRecs = response.recommendations.filter((r) => !r.reversible)
    if (autonomousRecs.length > 0) {
      violations.push({
        principle: 'Human Decision Support',
        severity: 'high',
        description: `${autonomousRecs.length} recommendation(s) are marked as irreversible`,
        remediation: 'All Copilot recommendations must be reversible unless explicitly justified',
      })
    }

    return allRequireApproval && autonomousRecs.length === 0
  }

  private checkCompleteAuditability(response: CopilotResponse, violations: GovernanceViolation[]): boolean {
    // Response must carry full audit trail: intent, domain, expertise, context, evidence, reasoning
    const stages = [
      response.intentClassification,
      response.domainDetection,
      response.expertiseSelection,
      response.context,
      response.knowledgeRetrieval,
      response.evidenceEvaluation,
      response.reasoning,
    ]
    const missingStages = stages.filter((s) => !s).length
    if (missingStages > 0) {
      violations.push({
        principle: 'Complete Auditability',
        severity: 'high',
        description: `${missingStages} pipeline stage(s) are missing from the response`,
        remediation: 'Ensure all pipeline stages are recorded in the response',
      })
      return false
    }
    return true
  }

  private checkProvenanceIntact(response: CopilotResponse, violations: GovernanceViolation[]): boolean {
    // Every recommendation must trace back to knowledge → memory → events
    if (response.recommendations.length === 0) return true

    let allIntact = true
    for (const rec of response.recommendations) {
      const trace = response.explainabilityTraces.find((t) => t.recommendationId === rec.id)
      if (!trace) continue

      if (trace.knowledgeObjects.length === 0 && rec.evidenceRefs.length > 0) {
        violations.push({
          principle: 'Provenance Intact',
          severity: 'high',
          description: `Recommendation '${rec.title}' has evidence refs but no knowledge objects in trace`,
          recommendationId: rec.id,
          remediation: 'Ensure knowledge retrieval populates the provenance graph',
        })
        allIntact = false
      }
    }

    return allIntact
  }

  private checkNoInventedFacts(response: CopilotResponse, violations: GovernanceViolation[]): boolean {
    // The Copilot must not invent facts.
    // Heuristic: recommendations must reference evidence IDs that exist in the retrieval.
    if (response.recommendations.length === 0) return true

    const knownEvidenceIds = new Set([
      ...response.knowledgeRetrieval.knowledge.map((k) => k.id),
      ...response.knowledgeRetrieval.relatedMemories.map((m) => m.id),
      ...response.knowledgeRetrieval.relatedEvents.map((e) => e.id),
    ])

    let noInvented = true
    for (const rec of response.recommendations) {
      const unknownRefs = rec.evidenceRefs.filter((id) => !knownEvidenceIds.has(id))
      if (unknownRefs.length > 0) {
        violations.push({
          principle: 'No Invented Facts',
          severity: 'high',
          description: `Recommendation '${rec.title}' references ${unknownRefs.length} unknown evidence ID(s)`,
          recommendationId: rec.id,
          remediation: 'Ensure all evidence references point to retrieved knowledge/memory/events',
        })
        noInvented = false
      }
    }

    return noInvented
  }

  private checkNoBypassedArchitecture(response: CopilotResponse, violations: GovernanceViolation[]): boolean {
    // The Copilot must not bypass Knowledge, Memory, or Heart Pulse.
    // Check: knowledge retrieval consulted the certified architecture
    const retrieval = response.knowledgeRetrieval
    if (!retrieval) {
      violations.push({
        principle: 'No Bypassed Architecture',
        severity: 'critical',
        description: 'Knowledge retrieval stage is missing',
        remediation: 'Ensure the Knowledge Retrieval Engine runs before reasoning',
      })
      return false
    }

    // If there are recommendations, there should be evidence from the architecture
    if (response.recommendations.length > 0) {
      const hasKnowledge = retrieval.knowledge.length > 0
      const hasMemories = retrieval.relatedMemories.length > 0
      const hasEvents = retrieval.relatedEvents.length > 0

      if (!hasKnowledge && !hasMemories && !hasEvents) {
        violations.push({
          principle: 'No Bypassed Architecture',
          severity: 'critical',
          description: 'Recommendations exist but no evidence was retrieved from Knowledge/Memory/Events',
          remediation: 'Ensure the Knowledge Retrieval Engine consults the certified architecture',
        })
        return false
      }
    }

    return true
  }

  // --------------------------------------------------------------------------
  // Introspection
  // --------------------------------------------------------------------------

  getGovernanceVersion(): string {
    return GOVERNANCE_VERSION
  }

  listPrinciples(): string[] {
    return [
      'Evidence Before Intelligence',
      'Explainability by Design',
      'No Hidden State',
      'Human Decision Support',
      'Complete Auditability',
      'Provenance Intact',
      'No Invented Facts',
      'No Bypassed Architecture',
    ]
  }
}

// ============================================================================
// Singleton
// ============================================================================

let singleton: GovernanceEngine | null = null

export function getGovernanceEngine(): GovernanceEngine {
  if (!singleton) singleton = new GovernanceEngine()
  return singleton
}

export function resetGovernanceEngine(): void {
  singleton = null
}
