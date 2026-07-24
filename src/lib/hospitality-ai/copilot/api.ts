/**
 * Hospitality AI Copilot™ — Consumer Interfaces / API (Phase 12).
 *
 * Exposes the Copilot through well-defined APIs:
 *   1. Operational recommendation requests (query)
 *   2. Context-aware assistance (query with context hints)
 *   3. Multi-step operational analysis
 *   4. Explainability retrieval
 *   5. Recommendation history
 *   6. Reasoning trace inspection
 *   7. Confidence inspection
 *
 * The API wraps the Copilot orchestrator and maintains an in-memory
 * history of responses for audit and retrieval.
 */

import type {
  CopilotRequest,
  CopilotResponse,
  CopilotQueryRequest,
  CopilotQueryResponse,
  CopilotExplainabilityRequest,
  CopilotExplainabilityResponse,
  CopilotHistoryRequest,
  CopilotHistoryResponse,
  CopilotHistoryEntry,
  CopilotConfidenceRequest,
  CopilotConfidenceResponse,
  CopilotMultiStepRequest,
  CopilotMultiStepResponse,
  UserRole,
  ShiftType,
} from './types'
import type { IntentType, OperationalDomain } from '../skill-registry/types'
import type { KnowledgeEntity } from '@/lib/hospitality-knowledge/types'
import type { HospitalityMemoryEntity } from '@/lib/hospitality-memory/types'
import type { OperationalEvent } from '@/lib/intelligence/types'

import { HospitalityAICopilot, getCopilot, DEFAULT_COPILOT_CONFIG, type CopilotConfig } from './copilot'
import { hashId, nowIso } from './utils'

// ============================================================================
// Copilot API
// ============================================================================

export class CopilotAPI {
  private copilot: HospitalityAICopilot
  private history: Map<string, CopilotResponse> = new Map()
  private businessHistory: Map<string, string[]> = new Map()  // businessId → requestIds

  constructor(config?: CopilotConfig) {
    this.copilot = config ? new HospitalityAICopilot(config) : getCopilot()
  }

  // --------------------------------------------------------------------------
  // 1. Operational Recommendation Request
  // --------------------------------------------------------------------------

  async query(request: CopilotQueryRequest): Promise<CopilotQueryResponse> {
    try {
      const copilotRequest = this.toCopilotRequest(request)
      const response = await this.copilot.process(copilotRequest)
      this.recordHistory(request.businessId, response)
      return { success: true, response }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  // --------------------------------------------------------------------------
  // 2. Context-Aware Assistance (query with explicit context hints)
  // --------------------------------------------------------------------------

  async assist(
    request: CopilotQueryRequest & {
      activeAlerts?: CopilotRequest['activeAlerts']
      activeWorkflows?: CopilotRequest['activeWorkflows']
      businessObjectives?: string[]
    }
  ): Promise<CopilotQueryResponse> {
    try {
      const copilotRequest: CopilotRequest = {
        ...this.toCopilotRequest(request),
        activeAlerts: request.activeAlerts,
        activeWorkflows: request.activeWorkflows,
        businessObjectives: request.businessObjectives,
      }
      const response = await this.copilot.process(copilotRequest)
      this.recordHistory(request.businessId, response)
      return { success: true, response }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  // --------------------------------------------------------------------------
  // 3. Multi-Step Operational Analysis
  // --------------------------------------------------------------------------

  async multiStep(request: CopilotMultiStepRequest): Promise<CopilotMultiStepResponse> {
    try {
      const stepResponses: CopilotQueryResponse[] = []
      const summaries: string[] = []

      for (let i = 0; i < request.steps.length; i++) {
        const step = request.steps[i]
        const stepRequest: CopilotQueryRequest = {
          ...step,
          businessId: request.businessId,
          userId: step.userId || request.userId,
          conversationId: request.conversationId,
        }
        const result = await this.query(stepRequest)
        stepResponses.push(result)
        if (result.success && result.response) {
          summaries.push(`Step ${i + 1}: ${result.response.summary}`)
        }
      }

      const combinedSummary = summaries.length > 0
        ? `Completed ${stepResponses.length} step(s):\n${summaries.join('\n')}`
        : `Completed ${stepResponses.length} step(s)`

      return {
        success: stepResponses.every((r) => r.success),
        stepResponses,
        combinedSummary,
      }
    } catch (error) {
      return {
        success: false,
        stepResponses: [],
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  // --------------------------------------------------------------------------
  // 4. Explainability Retrieval
  // --------------------------------------------------------------------------

  async getExplainability(request: CopilotExplainabilityRequest): Promise<CopilotExplainabilityResponse> {
    try {
      const response = this.history.get(request.requestId)
      if (!response) {
        return { success: false, error: `No response found for request ${request.requestId}` }
      }

      if (request.recommendationId) {
        const trace = response.explainabilityTraces.find(
          (t) => t.recommendationId === request.recommendationId
        )
        if (!trace) {
          return { success: false, error: `No trace found for recommendation ${request.recommendationId}` }
        }
        return { success: true, trace }
      }

      return { success: true, traces: response.explainabilityTraces }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  // --------------------------------------------------------------------------
  // 5. Recommendation History
  // --------------------------------------------------------------------------

  async getHistory(request: CopilotHistoryRequest): Promise<CopilotHistoryResponse> {
    try {
      const requestIds = this.businessHistory.get(request.businessId) || []
      let entries: CopilotHistoryEntry[] = []

      for (const reqId of requestIds) {
        const response = this.history.get(reqId)
        if (!response) continue

        // Filter by since
        if (request.since && response.governance.generatedAt < request.since) continue

        // Filter by domain
        if (request.domain && response.domainDetection.primaryDomain !== request.domain) continue

        // Filter by intent
        if (request.intent && response.intentClassification.intent !== request.intent) continue

        entries.push({
          requestId: response.requestId,
          question: response.intentClassification.requestId === response.requestId
            ? this.getQuestionFromHistory(response.requestId)
            : 'unknown',
          intent: response.intentClassification.intent,
          domain: response.domainDetection.primaryDomain,
          profile: response.expertiseSelection.profile,
          recommendationCount: response.recommendations.length,
          overallConfidence: response.overallConfidence,
          generatedAt: response.governance.generatedAt,
          compliant: response.governance.compliant,
        })
      }

      // Sort by generatedAt descending
      entries.sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))

      // Apply limit
      if (request.limit) {
        entries = entries.slice(0, request.limit)
      }

      return { success: true, history: entries }
    } catch (error) {
      return {
        success: false,
        history: [],
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  // --------------------------------------------------------------------------
  // 6. Reasoning Trace Inspection
  // --------------------------------------------------------------------------

  async getReasoningTrace(requestId: string): Promise<{
    success: boolean
    trace?: CopilotResponse['reasoning']
    error?: string
  }> {
    try {
      const response = this.history.get(requestId)
      if (!response) {
        return { success: false, error: `No response found for request ${requestId}` }
      }
      return { success: true, trace: response.reasoning }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  // --------------------------------------------------------------------------
  // 7. Confidence Inspection
  // --------------------------------------------------------------------------

  async getConfidence(request: CopilotConfidenceRequest): Promise<CopilotConfidenceResponse> {
    try {
      const response = this.history.get(request.requestId)
      if (!response) {
        return { success: false, error: `No response found for request ${request.requestId}` }
      }

      if (request.recommendationId) {
        const rec = response.recommendations.find((r) => r.id === request.recommendationId)
        if (!rec) {
          return { success: false, error: `No recommendation found with id ${request.recommendationId}` }
        }
        return {
          success: true,
          overallConfidence: rec.confidence,
          factors: rec.confidenceFactors,
        }
      }

      return {
        success: true,
        overallConfidence: response.overallConfidence,
        perRecommendation: response.recommendations.map((r) => ({
          recommendationId: r.id,
          confidence: r.confidence,
          factors: r.confidenceFactors,
        })),
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  // --------------------------------------------------------------------------
  // Inject evidence (for test/sandbox use)
  // --------------------------------------------------------------------------

  withInjectedEvidence(evidence: {
    knowledge: KnowledgeEntity[]
    memories: HospitalityMemoryEntity[]
    events: OperationalEvent[]
  }): CopilotAPI {
    return new CopilotAPI({
      ...DEFAULT_COPILOT_CONFIG,
      injectedEvidence: evidence,
    })
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  private toCopilotRequest(query: CopilotQueryRequest): CopilotRequest {
    return {
      requestId: hashId('req', `${query.businessId}|${query.question}|${nowIso()}`),
      businessId: query.businessId,
      question: query.question,
      userId: query.userId,
      userRole: query.userRole,
      shift: query.shift,
      outletId: query.outletId,
      timeRange: query.timeRange,
      includeAlternatives: query.includeAlternatives,
      maxRecommendations: query.maxRecommendations,
      explainabilityLevel: query.explainabilityLevel,
      conversationId: query.conversationId,
    }
  }

  private recordHistory(businessId: string, response: CopilotResponse): void {
    this.history.set(response.requestId, response)
    const existing = this.businessHistory.get(businessId) || []
    existing.push(response.requestId)
    // Keep last 100 responses per business
    if (existing.length > 100) {
      const removed = existing.shift()
      if (removed) this.history.delete(removed)
    }
    this.businessHistory.set(businessId, existing)
  }

  private questionMap: Map<string, string> = new Map()

  private getQuestionFromHistory(requestId: string): string {
    return this.questionMap.get(requestId) || 'unknown'
  }

  // --------------------------------------------------------------------------
  // Introspection
  // --------------------------------------------------------------------------

  getVersion(): string {
    return this.copilot.getVersion()
  }

  getHistoryCount(businessId?: string): number {
    if (businessId) {
      return this.businessHistory.get(businessId)?.length || 0
    }
    return this.history.size
  }

  clearHistory(businessId?: string): void {
    if (businessId) {
      const requestIds = this.businessHistory.get(businessId) || []
      for (const reqId of requestIds) {
        this.history.delete(reqId)
      }
      this.businessHistory.delete(businessId)
    } else {
      this.history.clear()
      this.businessHistory.clear()
    }
  }
}

// ============================================================================
// Singleton
// ============================================================================

let apiInstance: CopilotAPI | null = null

export function getCopilotAPI(): CopilotAPI {
  if (!apiInstance) apiInstance = new CopilotAPI()
  return apiInstance
}

export function resetCopilotAPI(): void {
  apiInstance = null
}

// ============================================================================
// Convenience functions
// ============================================================================

export async function queryCopilot(request: CopilotQueryRequest): Promise<CopilotQueryResponse> {
  return getCopilotAPI().query(request)
}

export async function assistCopilot(
  request: CopilotQueryRequest & {
    activeAlerts?: CopilotRequest['activeAlerts']
    activeWorkflows?: CopilotRequest['activeWorkflows']
    businessObjectives?: string[]
  }
): Promise<CopilotQueryResponse> {
  return getCopilotAPI().assist(request)
}

export async function multiStepCopilot(request: CopilotMultiStepRequest): Promise<CopilotMultiStepResponse> {
  return getCopilotAPI().multiStep(request)
}

export async function getExplainability(request: CopilotExplainabilityRequest): Promise<CopilotExplainabilityResponse> {
  return getCopilotAPI().getExplainability(request)
}

export async function getHistory(request: CopilotHistoryRequest): Promise<CopilotHistoryResponse> {
  return getCopilotAPI().getHistory(request)
}

export async function getReasoningTrace(requestId: string): Promise<{ success: boolean; trace?: CopilotResponse['reasoning']; error?: string }> {
  return getCopilotAPI().getReasoningTrace(requestId)
}

export async function getConfidence(request: CopilotConfidenceRequest): Promise<CopilotConfidenceResponse> {
  return getCopilotAPI().getConfidence(request)
}
