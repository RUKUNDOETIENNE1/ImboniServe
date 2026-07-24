/**
 * Hospitality AI Copilot™ — Domain Model.
 *
 * The Reasoning & Operational Expertise Layer of the Hospitality Intelligence Platform.
 *
 * Architectural Position:
 *   Heart Pulse™ → Hospitality Memory™ → Hospitality Knowledge™ →
 *   Hospitality AI Copilot™ → Hospitality Operating System™
 *
 * The Copilot is NOT:
 *   - a chatbot
 *   - an LLM wrapper
 *   - a knowledge base
 *   - a rule engine
 *
 * The Copilot IS:
 *   - an evidence-driven Operational Expertise Engine
 *   - a reasoning system over validated organizational knowledge
 *   - an orchestrator of reusable operational skills
 *   - a producer of explainable, trustworthy recommendations
 *
 * The Copilot may consume information from the certified layers below it,
 * but it must NEVER bypass, duplicate, or replace them.
 *
 * Platform: Hospitality Intelligence Platform v2.3.0
 * Module: Hospitality AI Copilot™ v1.0
 */

import type { KnowledgeEntity } from '@/lib/hospitality-knowledge/types'
import type { HospitalityMemoryEntity } from '@/lib/hospitality-memory/types'
import type { OperationalEvent } from '@/lib/intelligence/types'
import type {
  IntentType,
  OperationalDomain,
  ExpertiseProfile,
  ReasoningStrategy,
  SkillExecutionContext,
  SkillExecutionResult,
  SkillFinding,
  SkillMetric,
  SkillEvidence,
  SkillOrchestrationResult,
  OperationalSkill,
} from '../skill-registry/types'

// ============================================================================
// Re-exports — The Copilot reuses the certified Skill Registry vocabulary.
// ============================================================================

export type {
  IntentType,
  OperationalDomain,
  ExpertiseProfile,
  ReasoningStrategy,
  OperationalSkill,
  SkillExecutionContext,
  SkillExecutionResult,
  SkillFinding,
  SkillMetric,
  SkillEvidence,
  SkillOrchestrationResult,
}

// ============================================================================
// Copilot Request — the entry point
// ============================================================================

/**
 * A request to the Hospitality AI Copilot.
 *
 * Every request must carry enough context to:
 *  - classify intent
 *  - detect operational domain(s)
 *  - select an expertise profile
 *  - construct operational context
 *  - retrieve validated knowledge
 *
 * The Copilot never invents missing context — it asks for it or surfaces
 * uncertainty.
 */
export interface CopilotRequest {
  // Identity
  requestId: string
  businessId: string
  businessName?: string

  // The user's natural-language question
  question: string

  // User context
  userId?: string
  userRole?: UserRole
  userDepartment?: string

  // Operational context hints (optional — Context Engine fills gaps)
  shift?: ShiftType
  outletId?: string
  location?: string

  // Time context
  timeRange?: { start: string; end: string; label?: string }
  asOf?: string  // ISO timestamp; defaults to now

  // Business objectives / active alerts supplied by caller
  businessObjectives?: string[]
  activeAlerts?: ActiveAlert[]
  activeWorkflows?: ActiveWorkflow[]

  // Behavioral flags
  includeAlternatives?: boolean
  maxRecommendations?: number
  explainabilityLevel?: 'brief' | 'standard' | 'full'

  // Conversation continuity (optional)
  conversationId?: string
  previousRequestId?: string
}

export type UserRole =
  | 'owner'
  | 'general_manager'
  | 'kitchen_manager'
  | 'service_manager'
  | 'floor_manager'
  | 'inventory_manager'
  | 'shift_lead'
  | 'server'
  | 'cook'
  | 'host'
  | 'bartender'
  | 'analyst'
  | 'executive'
  | 'unknown'

export type ShiftType = 'morning' | 'lunch' | 'afternoon' | 'dinner' | 'evening' | 'night' | 'closing' | 'all_day'

// ============================================================================
// Active operational signals (provided by caller or platform state)
// ============================================================================

export interface ActiveAlert {
  id: string
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical'
  domain: OperationalDomain
  title: string
  description: string
  raisedAt: string
}

export interface ActiveWorkflow {
  id: string
  name: string
  domain: OperationalDomain
  status: 'running' | 'paused' | 'blocked' | 'completed'
  startedAt: string
}

// ============================================================================
// Intent Classification (Phase 1)
// ============================================================================

/**
 * The result of classifying a user's question.
 *
 * Reasoning never begins before intent classification is complete.
 */
export interface IntentClassification {
  requestId: string
  intent: IntentType
  confidence: number  // 0..1
  alternativeIntents: Array<{ intent: IntentType; confidence: number }>
  matchedSignals: string[]
  rejectedIntents: Array<{ intent: IntentType; reason: string }>
  classificationTime: number
  classifierVersion: string
}

// ============================================================================
// Operational Domain Detection (Phase 2)
// ============================================================================

/**
 * The result of detecting which operational domain(s) a question belongs to.
 *
 * Supports multi-domain reasoning where appropriate.
 */
export interface DomainDetection {
  requestId: string
  primaryDomain: OperationalDomain
  secondaryDomains: Array<{ domain: OperationalDomain; relevance: number }>
  isCrossDomain: boolean
  matchedSignals: string[]
  detectionTime: number
  detectorVersion: string
}

// ============================================================================
// Expertise Profile Selection (Phase 3)
// ============================================================================

/**
 * The result of selecting an expertise profile.
 *
 * Profiles are reasoning personas — not separate AI models.
 * All profiles consume the same certified platform architecture.
 */
export interface ExpertiseSelection {
  requestId: string
  profile: ExpertiseProfile
  confidence: number
  alternativeProfiles: Array<{ profile: ExpertiseProfile; confidence: number }>
  selectionReason: string
  selectionTime: number
  selectorVersion: string
}

// ============================================================================
// Operational Context (Phase 5)
// ============================================================================

/**
 * The complete operational context constructed before reasoning.
 *
 * Context construction is deterministic and explainable.
 */
export interface OperationalContext {
  requestId: string
  businessId: string
  businessName: string

  // User context
  userId?: string
  userRole: UserRole
  userDepartment?: string

  // Operational state
  shift: ShiftType
  outletId?: string
  location?: string

  // Time context
  asOf: string
  timeRange?: { start: string; end: string; label?: string }
  dayOfWeek: string
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
  season: 'dry' | 'wet' | 'holiday' | 'festive' | 'unknown'

  // Business signals
  businessObjectives: string[]
  activeAlerts: ActiveAlert[]
  activeWorkflows: ActiveWorkflow[]

  // Relevant historical context (deterministic summary)
  relevantHistoricalContext: HistoricalContextSummary[]

  // Construction metadata
  constructionTime: number
  contextVersion: string
  determinismProof: string  // hash of inputs that produced this context
}

export interface HistoricalContextSummary {
  source: 'knowledge' | 'memory' | 'events'
  sourceId: string
  title: string
  relevance: number
  summary: string
}

// ============================================================================
// Knowledge Retrieval (Phase 6)
// ============================================================================

/**
 * The result of retrieving validated Hospitality Knowledge™.
 *
 * Every knowledge object remains traceable to:
 *   Knowledge → Supporting Memories → Supporting Heart Pulse Events
 *
 * No recommendation may be generated from unsupported knowledge.
 */
export interface KnowledgeRetrievalResult {
  requestId: string
  knowledge: KnowledgeEntity[]
  relatedMemories: HospitalityMemoryEntity[]
  relatedEvents: OperationalEvent[]
  provenanceGraph: ProvenanceNode[]
  retrievalTime: number
  retrievalVersion: string
  warnings: string[]
}

export interface ProvenanceNode {
  id: string
  type: 'knowledge' | 'memory' | 'event'
  title: string
  confidence: number
  supports: string[]  // IDs of nodes this node supports
  supportedBy: string[]  // IDs of nodes that support this node
  traceComplete: boolean
}

// ============================================================================
// Evidence Evaluation (Phase 7)
// ============================================================================

/**
 * The result of evaluating the quality and sufficiency of retrieved evidence.
 *
 * If evidence is insufficient, the Copilot communicates uncertainty
 * rather than fabricating conclusions.
 */
export interface EvidenceEvaluation {
  requestId: string
  overallSufficiency: 'sufficient' | 'marginal' | 'insufficient' | 'absent'
  overallConfidence: number  // 0..1

  completeness: number  // 0..1
  recency: number  // 0..1
  consistency: number  // 0..1
  confidence: number  // 0..1

  conflictingEvidence: ConflictingEvidence[]
  missingEvidence: MissingEvidence[]
  evidenceGaps: string[]

  evaluationTime: number
  evaluatorVersion: string
}

export interface ConflictingEvidence {
  topic: string
  knowledgeIds: string[]
  description: string
  severity: 'low' | 'medium' | 'high'
}

export interface MissingEvidence {
  description: string
  requiredFor: string
  impactOnConfidence: number  // 0..1 penalty
}

// ============================================================================
// Reasoning (Phase 8)
// ============================================================================

/**
 * The result of selecting and applying a reasoning strategy.
 *
 * The chosen strategy must be explicitly recorded.
 */
export interface ReasoningResult {
  requestId: string
  strategy: ReasoningStrategy
  strategySelectionReason: string
  reasoningTrace: ReasoningStep[]
  derivedFindings: DerivedFinding[]
  evaluationTime: number
  reasoningVersion: string
}

export interface ReasoningStep {
  step: number
  description: string
  strategy: ReasoningStrategy
  inputs: string[]  // IDs of evidence/knowledge/memory consulted
  outputs: string[]  // IDs of findings produced
  rationale: string
  confidence: number
}

export interface DerivedFinding {
  id: string
  title: string
  description: string
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  evidenceRefs: string[]
  derivedFromStrategy: ReasoningStrategy
  actionable: boolean
}

// ============================================================================
// Recommendation (Phase 9)
// ============================================================================

/**
 * A single recommendation produced by the Copilot.
 *
 * Recommendations are:
 *  - evidence-backed
 *  - actionable
 *  - operationally practical
 *  - role-aware
 *  - prioritized
 *  - confidence scored
 */
export interface CopilotRecommendation {
  id: string
  title: string
  description: string
  rationale: string

  priority: 'critical' | 'high' | 'medium' | 'low'
  priorityReason: string

  confidence: number  // 0..1
  confidenceFactors: RecommendationConfidenceFactors

  evidenceRefs: string[]  // knowledge/memory/event IDs
  skillIds: string[]  // skills that contributed
  reasoningStrategies: ReasoningStrategy[]

  actionable: boolean
  recommendedActions: RecommendedAction[]
  alternativeOptions: AlternativeOption[]

  roleFit: UserRole[]
  domainFit: OperationalDomain[]
  expectedImpact: string
  risks: string[]
  prerequisites: string[]

  requiresHumanApproval: boolean
  reversible: boolean
}

export interface RecommendationConfidenceFactors {
  evidenceQuality: number
  evidenceConsistency: number
  evidenceRecency: number
  reasoningStrategyFit: number
  skillConfidence: number
  contextCompleteness: number
}

export interface RecommendedAction {
  id: string
  description: string
  owner: UserRole
  domain: OperationalDomain
  estimatedEffort: 'low' | 'medium' | 'high'
  timeframe: 'immediate' | 'this_shift' | 'today' | 'this_week' | 'planned'
  expectedOutcome: string
}

export interface AlternativeOption {
  id: string
  title: string
  description: string
  rationale: string
  confidence: number
  tradeoffs: { advantage: string; disadvantage: string }[]
}

// ============================================================================
// Explainability (Phase 10)
// ============================================================================

/**
 * A complete reasoning trace accompanying every recommendation.
 *
 * Users must always be able to understand why a recommendation was made.
 */
export interface ExplainabilityTrace {
  requestId: string
  recommendationId: string

  // Full pipeline trace
  userQuestion: string
  intentClassification: IntentClassification
  domainDetection: DomainDetection
  expertiseSelection: ExpertiseSelection
  skillsUsed: Array<{ skillId: string; skillName: string; relevance: number }>
  context: OperationalContext
  knowledgeObjects: Array<{ id: string; title: string; category: string; confidence: string }>
  supportingMemories: Array<{ id: string; title: string; confidence: number }>
  supportingEvents: Array<{ id: string; type: string; timestamp: string }>
  evidenceEvaluation: EvidenceEvaluation
  reasoningStrategy: ReasoningStrategy
  reasoningSteps: ReasoningStep[]
  alternativeOptions: AlternativeOption[]
  recommendation: CopilotRecommendation
  confidenceAssessment: RecommendationConfidenceFactors
  explanation: string  // human-readable narrative

  // Audit
  generatedAt: string
  traceVersion: string
  traceComplete: boolean
  traceWarnings: string[]
}

// ============================================================================
// Final Copilot Response
// ============================================================================

/**
 * The complete response from the Hospitality AI Copilot.
 *
 * Carries the recommendation(s), the full reasoning trace, and audit metadata.
 */
export interface CopilotResponse {
  requestId: string
  conversationId?: string
  success: boolean

  // Pipeline stages (every stage independently inspectable)
  intentClassification: IntentClassification
  domainDetection: DomainDetection
  expertiseSelection: ExpertiseSelection
  context: OperationalContext
  knowledgeRetrieval: KnowledgeRetrievalResult
  evidenceEvaluation: EvidenceEvaluation
  reasoning: ReasoningResult

  // Outputs
  recommendations: CopilotRecommendation[]
  explainabilityTraces: ExplainabilityTrace[]

  // Summary
  summary: string
  overallConfidence: number
  uncertaintyStatement?: string

  // Diagnostics
  diagnostics: CopilotDiagnostics

  // Governance
  governance: CopilotGovernanceRecord

  // Error handling
  error?: string
  warnings: string[]
}

export interface CopilotDiagnostics {
  totalTime: number
  intentClassificationTime: number
  domainDetectionTime: number
  expertiseSelectionTime: number
  contextConstructionTime: number
  knowledgeRetrievalTime: number
  evidenceEvaluationTime: number
  reasoningTime: number
  recommendationTime: number
  explainabilityTime: number
  governanceTime: number
  skillsExecuted: number
  knowledgeObjectsConsulted: number
  memoriesConsulted: number
  eventsConsulted: number
}

// ============================================================================
// Governance (Phase 11)
// ============================================================================

/**
 * Governance record attached to every Copilot response.
 *
 * Enforces the Safety & Governance principles:
 *  - no invented business facts
 *  - no bypassed evidence
 *  - no hidden reasoning state
 *  - no irreversible decisions without human approval
 *  - fully auditable reasoning
 */
export interface CopilotGovernanceRecord {
  requestId: string
  responseId: string
  generatedAt: string

  // Compliance checks
  evidenceFirstPrinciple: boolean
  explainabilityByDesignPrinciple: boolean
  noHiddenStatePrinciple: boolean
  humanDecisionSupportPrinciple: boolean
  completeAuditabilityPrinciple: boolean
  provenanceIntactPrinciple: boolean

  // Audit
  allRecommendationsRequireHumanApproval: boolean
  allRecommendationsHaveEvidence: boolean
  allRecommendationsHaveExplainability: boolean
  noInventedFacts: boolean
  noBypassedArchitecture: boolean

  // Violations (if any)
  violations: GovernanceViolation[]

  // Verdict
  compliant: boolean
  complianceScore: number  // 0..1
}

export interface GovernanceViolation {
  principle: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  recommendationId?: string
  remediation: string
}

// ============================================================================
// Consumer API Request/Response Types (Phase 12)
// ============================================================================

export interface CopilotQueryRequest {
  businessId: string
  question: string
  userId?: string
  userRole?: UserRole
  shift?: ShiftType
  outletId?: string
  timeRange?: { start: string; end: string; label?: string }
  includeAlternatives?: boolean
  maxRecommendations?: number
  explainabilityLevel?: 'brief' | 'standard' | 'full'
  conversationId?: string
}

export interface CopilotQueryResponse {
  success: boolean
  response?: CopilotResponse
  error?: string
}

export interface CopilotExplainabilityRequest {
  requestId: string
  recommendationId?: string
  level?: 'brief' | 'standard' | 'full'
}

export interface CopilotExplainabilityResponse {
  success: boolean
  trace?: ExplainabilityTrace
  traces?: ExplainabilityTrace[]
  error?: string
}

export interface CopilotHistoryRequest {
  businessId: string
  limit?: number
  since?: string
  domain?: OperationalDomain
  intent?: IntentType
}

export interface CopilotHistoryResponse {
  success: boolean
  history: CopilotHistoryEntry[]
  error?: string
}

export interface CopilotHistoryEntry {
  requestId: string
  question: string
  intent: IntentType
  domain: OperationalDomain
  profile: ExpertiseProfile
  recommendationCount: number
  overallConfidence: number
  generatedAt: string
  compliant: boolean
}

export interface CopilotConfidenceRequest {
  requestId: string
  recommendationId?: string
}

export interface CopilotConfidenceResponse {
  success: boolean
  overallConfidence?: number
  factors?: RecommendationConfidenceFactors
  perRecommendation?: Array<{
    recommendationId: string
    confidence: number
    factors: RecommendationConfidenceFactors
  }>
  error?: string
}

export interface CopilotMultiStepRequest {
  businessId: string
  steps: CopilotQueryRequest[]
  userId?: string
  conversationId?: string
}

export interface CopilotMultiStepResponse {
  success: boolean
  stepResponses: CopilotQueryResponse[]
  combinedSummary?: string
  error?: string
}

// ============================================================================
// Engine Registry (singleton access)
// ============================================================================

export interface CopilotEngineRegistry {
  intentClassificationEngine: unknown  // typed in respective modules
  operationalDomainEngine: unknown
  operationalExpertiseEngine: unknown
  contextEngine: unknown
  knowledgeRetrievalEngine: unknown
  evidenceEvaluationEngine: unknown
  reasoningEngine: unknown
  recommendationEngine: unknown
  explainabilityEngine: unknown
  governanceEngine: unknown
}
