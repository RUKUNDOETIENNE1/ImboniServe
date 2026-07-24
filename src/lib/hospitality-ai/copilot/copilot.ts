/**
 * Hospitality AI Copilot™ — Main Orchestrator.
 *
 * Ties together all internal engines into the full reasoning pipeline:
 *
 *   User Question
 *     ↓
 *   Intent Classification Engine
 *     ↓
 *   Operational Domain Engine
 *     ↓
 *   Operational Expertise Engine
 *     ↓
 *   Operational Skill Registry (discovery + orchestration)
 *     ↓
 *   Context Engine
 *     ↓
 *   Knowledge Retrieval Engine
 *     ↓
 *   Evidence Evaluation Engine
 *     ↓
 *   Reasoning Engine
 *     ↓
 *   Recommendation Engine
 *     ↓
 *   Explainability Engine
 *     ↓
 *   Governance Engine
 *     ↓
 *   Final Response
 *
 * Every stage is independently testable.
 */

import type {
  CopilotRequest,
  CopilotResponse,
  CopilotDiagnostics,
} from './types'
import type {
  KnowledgeEntity,
} from '@/lib/hospitality-knowledge/types'
import type {
  HospitalityMemoryEntity,
} from '@/lib/hospitality-memory/types'
import type {
  OperationalEvent,
} from '@/lib/intelligence/types'

import { getIntentClassificationEngine } from './intent-classification-engine'
import { getOperationalDomainEngine } from './operational-domain-engine'
import { getOperationalExpertiseEngine } from './operational-expertise-engine'
import { getSkillRegistryIntegration } from './skill-registry-integration'
import { getContextEngine } from './context-engine'
import { getKnowledgeRetrievalEngine } from './knowledge-retrieval-engine'
import { getEvidenceEvaluationEngine } from './evidence-evaluation-engine'
import { getReasoningEngine } from './reasoning-engine'
import { getRecommendationEngine } from './recommendation-engine'
import { getExplainabilityEngine } from './explainability-engine'
import { getGovernanceEngine } from './governance-engine'

import { clamp01, average, nowIso, hashId } from './utils'

// ============================================================================
// Copilot Configuration
// ============================================================================

export interface CopilotConfig {
  maxRecommendations: number
  explainabilityLevel: 'brief' | 'standard' | 'full'
  includeAlternatives: boolean
  maxSkills: number
  // Optional: inject pre-fetched evidence (for test/sandbox use)
  injectedEvidence?: {
    knowledge: KnowledgeEntity[]
    memories: HospitalityMemoryEntity[]
    events: OperationalEvent[]
  }
}

export const DEFAULT_COPILOT_CONFIG: CopilotConfig = {
  maxRecommendations: 5,
  explainabilityLevel: 'standard',
  includeAlternatives: true,
  maxSkills: 5,
}

// ============================================================================
// Hospitality AI Copilot
// ============================================================================

const COPILOT_VERSION = '1.0.0'

export class HospitalityAICopilot {
  constructor(private config: CopilotConfig = DEFAULT_COPILOT_CONFIG) {}

  /**
   * Process a Copilot request through the full reasoning pipeline.
   */
  async process(request: CopilotRequest): Promise<CopilotResponse> {
    const totalStart = Date.now()
    const warnings: string[] = []

    try {
      // ── Stage 1: Intent Classification ──────────────────────────────
      const intentStart = Date.now()
      const intentClassification = getIntentClassificationEngine().classify(request)
      const intentClassificationTime = Date.now() - intentStart

      if (intentClassification.intent === 'unknown_intent') {
        warnings.push('Intent could not be confidently classified')
      }

      // ── Stage 2: Operational Domain Detection ───────────────────────
      const domainStart = Date.now()
      const domainDetection = getOperationalDomainEngine().detect(
        request,
        intentClassification.intent,
        {
          userDepartment: request.userDepartment,
          activeAlertsDomain: request.activeAlerts?.map((a) => a.domain),
        }
      )
      const domainDetectionTime = Date.now() - domainStart

      // ── Stage 3: Expertise Profile Selection ────────────────────────
      const expertiseStart = Date.now()
      const expertiseSelection = getOperationalExpertiseEngine().select(
        request,
        domainDetection.primaryDomain,
        intentClassification.intent
      )
      const expertiseSelectionTime = Date.now() - expertiseStart

      // ── Stage 5: Context Construction (before retrieval) ────────────
      const contextStart = Date.now()
      const context = getContextEngine().buildContext(request, {
        historicalKnowledge: this.config.injectedEvidence?.knowledge,
        historicalMemories: this.config.injectedEvidence?.memories,
        domain: domainDetection.primaryDomain,
      })
      const contextConstructionTime = Date.now() - contextStart

      // ── Stage 6: Knowledge Retrieval ────────────────────────────────
      const retrievalStart = Date.now()
      let retrieval
      if (this.config.injectedEvidence) {
        // Use injected evidence (test/sandbox mode)
        retrieval = getKnowledgeRetrievalEngine().retrieveFromSupplied(
          request,
          context,
          domainDetection.primaryDomain,
          this.config.injectedEvidence
        )
      } else {
        // Use live retrieval from certified architecture
        retrieval = await getKnowledgeRetrievalEngine().retrieve(
          request,
          context,
          domainDetection.primaryDomain
        )
      }
      const knowledgeRetrievalTime = Date.now() - retrievalStart
      warnings.push(...retrieval.warnings)

      // ── Stage 7: Evidence Evaluation ────────────────────────────────
      const evaluationStart = Date.now()
      const evidenceEvaluation = getEvidenceEvaluationEngine().evaluate(request, retrieval)
      const evidenceEvaluationTime = Date.now() - evaluationStart

      // ── Stage 4: Skill Registry Orchestration ───────────────────────
      // (Runs after evidence evaluation so skills can use evaluated evidence)
      const skillIntegration = getSkillRegistryIntegration()
      let skillResult = null
      let skillsExecuted = 0

      if (evidenceEvaluation.overallSufficiency !== 'absent') {
        try {
          const reasoningStrategy = getReasoningEngine().selectStrategy(
            intentClassification.intent,
            domainDetection.primaryDomain,
            expertiseSelection.profile
          )
          skillResult = await skillIntegration.orchestrateSkills(
            request,
            intentClassification.intent,
            domainDetection.primaryDomain,
            expertiseSelection.profile,
            reasoningStrategy,
            context,
            {
              knowledge: retrieval.knowledge,
              memories: retrieval.relatedMemories,
              events: retrieval.relatedEvents,
            },
            {
              maxSkills: this.config.maxSkills,
            }
          )
          skillsExecuted = skillResult.stepResults.filter((r) => r.success).length
        } catch (err) {
          warnings.push(`Skill orchestration failed: ${String(err)}`)
        }
      }

      // ── Stage 8: Reasoning ──────────────────────────────────────────
      const reasoningStart = Date.now()
      const reasoning = getReasoningEngine().reason(
        request,
        intentClassification.intent,
        domainDetection.primaryDomain,
        expertiseSelection.profile,
        retrieval,
        evidenceEvaluation,
        skillResult || undefined
      )
      const reasoningTime = Date.now() - reasoningStart

      // ── Stage 9: Recommendation Generation ──────────────────────────
      const recommendationStart = Date.now()
      const recommendations = getRecommendationEngine().generate(
        request,
        intentClassification.intent,
        domainDetection.primaryDomain,
        expertiseSelection.profile,
        context,
        retrieval,
        evidenceEvaluation,
        reasoning,
        skillResult || undefined
      )
      const recommendationTime = Date.now() - recommendationStart

      // ── Stage 10: Explainability ────────────────────────────────────
      const explainabilityStart = Date.now()
      const explainabilityTraces = getExplainabilityEngine().buildTraces(
        request,
        intentClassification,
        domainDetection,
        expertiseSelection,
        context,
        retrieval,
        evidenceEvaluation,
        reasoning,
        recommendations,
        skillResult || undefined,
        request.explainabilityLevel || this.config.explainabilityLevel
      )
      const explainabilityTime = Date.now() - explainabilityStart

      // ── Build response ──────────────────────────────────────────────
      const overallConfidence = this.calculateOverallConfidence(
        evidenceEvaluation,
        recommendations
      )

      const summary = this.generateSummary(
        request,
        intentClassification.intent,
        domainDetection.primaryDomain,
        evidenceEvaluation,
        recommendations
      )

      const uncertaintyStatement = this.generateUncertaintyStatement(
        evidenceEvaluation,
        recommendations
      )

      const diagnostics: CopilotDiagnostics = {
        totalTime: Date.now() - totalStart,
        intentClassificationTime,
        domainDetectionTime,
        expertiseSelectionTime,
        contextConstructionTime,
        knowledgeRetrievalTime,
        evidenceEvaluationTime,
        reasoningTime,
        recommendationTime,
        explainabilityTime,
        governanceTime: 0,  // Filled below
        skillsExecuted,
        knowledgeObjectsConsulted: retrieval.knowledge.length,
        memoriesConsulted: retrieval.relatedMemories.length,
        eventsConsulted: retrieval.relatedEvents.length,
      }

      const response: CopilotResponse = {
        requestId: request.requestId,
        conversationId: request.conversationId,
        success: true,
        intentClassification,
        domainDetection,
        expertiseSelection,
        context,
        knowledgeRetrieval: retrieval,
        evidenceEvaluation,
        reasoning,
        recommendations,
        explainabilityTraces,
        summary,
        overallConfidence,
        uncertaintyStatement,
        diagnostics,
        governance: {} as CopilotResponse['governance'],  // Filled below
        warnings,
      }

      // ── Stage 11: Governance ────────────────────────────────────────
      const governanceStart = Date.now()
      const governance = getGovernanceEngine().evaluate(request, response)
      diagnostics.governanceTime = Date.now() - governanceStart
      response.governance = governance

      if (!governance.compliant) {
        warnings.push(`Governance compliance issues: ${governance.violations.length} violation(s)`)
      }

      return response
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {
        requestId: request.requestId,
        conversationId: request.conversationId,
        success: false,
        intentClassification: this.emptyIntentClassification(request),
        domainDetection: this.emptyDomainDetection(request),
        expertiseSelection: this.emptyExpertiseSelection(request),
        context: this.emptyContext(request),
        knowledgeRetrieval: this.emptyRetrieval(request),
        evidenceEvaluation: this.emptyEvaluation(request),
        reasoning: this.emptyReasoning(request),
        recommendations: [],
        explainabilityTraces: [],
        summary: 'An error occurred while processing your request.',
        overallConfidence: 0,
        diagnostics: {
          totalTime: Date.now() - totalStart,
          intentClassificationTime: 0,
          domainDetectionTime: 0,
          expertiseSelectionTime: 0,
          contextConstructionTime: 0,
          knowledgeRetrievalTime: 0,
          evidenceEvaluationTime: 0,
          reasoningTime: 0,
          recommendationTime: 0,
          explainabilityTime: 0,
          governanceTime: 0,
          skillsExecuted: 0,
          knowledgeObjectsConsulted: 0,
          memoriesConsulted: 0,
          eventsConsulted: 0,
        },
        governance: {
          requestId: request.requestId,
          responseId: hashId('resp', request.requestId),
          generatedAt: nowIso(),
          evidenceFirstPrinciple: false,
          explainabilityByDesignPrinciple: false,
          noHiddenStatePrinciple: false,
          humanDecisionSupportPrinciple: true,
          completeAuditabilityPrinciple: false,
          provenanceIntactPrinciple: false,
          allRecommendationsRequireHumanApproval: true,
          allRecommendationsHaveEvidence: true,
          allRecommendationsHaveExplainability: true,
          noInventedFacts: true,
          noBypassedArchitecture: false,
          violations: [{
            principle: 'System Error',
            severity: 'critical',
            description: errorMessage,
            remediation: 'Investigate the error and retry',
          }],
          compliant: false,
          complianceScore: 0,
        },
        error: errorMessage,
        warnings,
      }
    }
  }

  // --------------------------------------------------------------------------
  // Confidence & Summary
  // --------------------------------------------------------------------------

  private calculateOverallConfidence(
    evaluation: CopilotResponse['evidenceEvaluation'],
    recommendations: CopilotResponse['recommendations']
  ): number {
    if (recommendations.length === 0) {
      return clamp01(evaluation.overallConfidence * 0.5)
    }
    const recConfidences = recommendations.map((r) => r.confidence)
    const avgRecConfidence = average(recConfidences)
    return clamp01(
      (evaluation.overallConfidence * 0.4) +
      (avgRecConfidence * 0.6)
    )
  }

  private generateSummary(
    request: CopilotRequest,
    intent: string,
    domain: string,
    evaluation: CopilotResponse['evidenceEvaluation'],
    recommendations: CopilotResponse['recommendations']
  ): string {
    const parts: string[] = []

    parts.push(`Analyzed your question about ${domain.replace(/_/g, ' ')} from a ${intent.replace(/_/g, ' ')} perspective.`)
    parts.push(`Evidence sufficiency: ${evaluation.overallSufficiency} (confidence: ${(evaluation.overallConfidence * 100).toFixed(0)}%).`)

    if (recommendations.length === 0) {
      if (evaluation.overallSufficiency === 'absent') {
        parts.push('No validated evidence was available to generate recommendations. Please ensure Heart Pulse events, Hospitality Memory, and Hospitality Knowledge are populated for this business.')
      } else if (evaluation.overallSufficiency === 'insufficient') {
        parts.push('Evidence was insufficient to generate confident recommendations. Consider gathering more operational data or refining your question.')
      } else {
        parts.push('No actionable recommendations were derived from the available evidence.')
      }
    } else {
      parts.push(`Generated ${recommendations.length} recommendation(s):`)
      for (const rec of recommendations.slice(0, 3)) {
        parts.push(`  • [${rec.priority}] ${rec.title} (confidence: ${(rec.confidence * 100).toFixed(0)}%)`)
      }
      if (recommendations.length > 3) {
        parts.push(`  ... and ${recommendations.length - 3} more`)
      }
    }

    return parts.join(' ')
  }

  private generateUncertaintyStatement(
    evaluation: CopilotResponse['evidenceEvaluation'],
    recommendations: CopilotResponse['recommendations']
  ): string | undefined {
    if (evaluation.overallSufficiency === 'sufficient' && evaluation.conflictingEvidence.length === 0) {
      return undefined
    }

    const parts: string[] = []
    if (evaluation.overallSufficiency !== 'sufficient') {
      parts.push(`Evidence sufficiency is ${evaluation.overallSufficiency}.`)
    }
    if (evaluation.conflictingEvidence.length > 0) {
      parts.push(`${evaluation.conflictingEvidence.length} evidence conflict(s) were detected.`)
    }
    if (evaluation.missingEvidence.length > 0) {
      parts.push(`${evaluation.missingEvidence.length} evidence gap(s) were identified.`)
    }
    parts.push('Recommendations should be reviewed with appropriate caution and validated against additional evidence where possible.')

    return parts.join(' ')
  }

  // --------------------------------------------------------------------------
  // Empty placeholders (for error responses)
  // --------------------------------------------------------------------------

  private emptyIntentClassification(request: CopilotRequest) {
    return {
      requestId: request.requestId,
      intent: 'unknown_intent' as const,
      confidence: 0,
      alternativeIntents: [],
      matchedSignals: [],
      rejectedIntents: [],
      classificationTime: 0,
      classifierVersion: '0.0.0',
    }
  }

  private emptyDomainDetection(request: CopilotRequest) {
    return {
      requestId: request.requestId,
      primaryDomain: 'operations' as const,
      secondaryDomains: [],
      isCrossDomain: false,
      matchedSignals: [],
      detectionTime: 0,
      detectorVersion: '0.0.0',
    }
  }

  private emptyExpertiseSelection(request: CopilotRequest) {
    return {
      requestId: request.requestId,
      profile: 'operational_excellence_advisor' as const,
      confidence: 0,
      alternativeProfiles: [],
      selectionReason: 'error fallback',
      selectionTime: 0,
      selectorVersion: '0.0.0',
    }
  }

  private emptyContext(request: CopilotRequest) {
    return {
      requestId: request.requestId,
      businessId: request.businessId,
      businessName: request.businessName || request.businessId,
      userId: request.userId,
      userRole: 'unknown' as const,
      shift: 'all_day' as const,
      outletId: request.outletId,
      location: request.location,
      asOf: nowIso(),
      dayOfWeek: 'Unknown',
      timeOfDay: 'morning' as const,
      season: 'unknown' as const,
      businessObjectives: [],
      activeAlerts: [],
      activeWorkflows: [],
      relevantHistoricalContext: [],
      constructionTime: 0,
      contextVersion: '0.0.0',
      determinismProof: '',
    }
  }

  private emptyRetrieval(request: CopilotRequest) {
    return {
      requestId: request.requestId,
      knowledge: [],
      relatedMemories: [],
      relatedEvents: [],
      provenanceGraph: [],
      retrievalTime: 0,
      retrievalVersion: '0.0.0',
      warnings: [],
    }
  }

  private emptyEvaluation(request: CopilotRequest) {
    return {
      requestId: request.requestId,
      overallSufficiency: 'absent' as const,
      overallConfidence: 0,
      completeness: 0,
      recency: 0,
      consistency: 0,
      confidence: 0,
      conflictingEvidence: [],
      missingEvidence: [],
      evidenceGaps: [],
      evaluationTime: 0,
      evaluatorVersion: '0.0.0',
    }
  }

  private emptyReasoning(request: CopilotRequest) {
    return {
      requestId: request.requestId,
      strategy: 'summary_synthesis' as const,
      strategySelectionReason: 'error fallback',
      reasoningTrace: [],
      derivedFindings: [],
      evaluationTime: 0,
      reasoningVersion: '0.0.0',
    }
  }

  // --------------------------------------------------------------------------
  // Introspection
  // --------------------------------------------------------------------------

  getVersion(): string {
    return COPILOT_VERSION
  }
}

// ============================================================================
// Singleton
// ============================================================================

let singleton: HospitalityAICopilot | null = null

export function getCopilot(config?: CopilotConfig): HospitalityAICopilot {
  if (!singleton || config) {
    singleton = new HospitalityAICopilot(config || DEFAULT_COPILOT_CONFIG)
  }
  return singleton
}

export function resetCopilot(): void {
  singleton = null
}
