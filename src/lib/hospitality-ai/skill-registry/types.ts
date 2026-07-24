/**
 * Hospitality AI Copilot™ — Operational Skill Registry
 *
 * The Capability Layer of the Hospitality Operational Expertise Engine.
 *
 * Architectural Position:
 *   Heart Pulse™ → Hospitality Memory™ → Hospitality Knowledge™ →
 *   Hospitality AI Copilot™ → [Intent Classification] → [Operational Domain] →
 *   [Operational Expertise] → [Operational Skill Registry] → [Reasoning] →
 *   [Recommendation] → [Explainability] → Final Response
 *
 * The Skill Registry provides reusable operational capabilities.
 * Expertise Profiles decide when to use them.
 * Skills never bypass Knowledge, Memory, or Heart Pulse.
 * Skills never generate business facts — they analyze evidence.
 *
 * Platform: Hospitality Intelligence Platform v2.3.0
 * Module: Operational Skill Registry v1.0
 */

// ============================================================================
// Skill Identity
// ============================================================================

export type SkillCategory =
  | 'operational_analysis'
  | 'financial_analysis'
  | 'customer_intelligence'
  | 'staff_intelligence'
  | 'inventory_intelligence'
  | 'kitchen_intelligence'
  | 'executive_intelligence'
  | 'continuous_improvement'

export type SkillLifecycleStatus =
  | 'draft'
  | 'experimental'
  | 'validated'
  | 'production'
  | 'deprecated'
  | 'retired'

export type OperationalDomain =
  | 'kitchen'
  | 'service'
  | 'reservations'
  | 'inventory'
  | 'finance'
  | 'revenue'
  | 'customers'
  | 'staff'
  | 'management'
  | 'marketing'
  | 'suppliers'
  | 'operations'
  | 'cross_domain'

export type ExpertiseProfile =
  | 'executive_advisor'
  | 'kitchen_advisor'
  | 'service_advisor'
  | 'inventory_advisor'
  | 'revenue_advisor'
  | 'staff_performance_advisor'
  | 'customer_experience_advisor'
  | 'operational_excellence_advisor'

export type IntentType =
  | 'information_request'
  | 'explanation'
  | 'root_cause_analysis'
  | 'recommendation_request'
  | 'prediction_request'
  | 'risk_assessment'
  | 'planning'
  | 'optimization'
  | 'comparison'
  | 'status_check'
  | 'trend_analysis'
  | 'decision_support'
  | 'problem_diagnosis'
  | 'operational_review'
  | 'learning_training'
  | 'unknown_intent'

export type ReasoningStrategy =
  | 'cause_and_effect'
  | 'constraint_optimization'
  | 'temporal_reasoning'
  | 'risk_evaluation'
  | 'multi_factor_reasoning'
  | 'comparative_reasoning'
  | 'scenario_reasoning'
  | 'evidence_based_recommendation'
  | 'diagnostic_reasoning'
  | 'summary_synthesis'

// ============================================================================
// Skill Definition
// ============================================================================

/**
 * A reusable operational capability.
 *
 * Skills are NOT reasoning engines. They are capabilities that:
 * - Retrieve evidence from Knowledge/Memory/Events
 * - Apply domain-specific analysis
 * - Produce structured outputs for reasoning engines
 *
 * Skills never generate business facts. They analyze evidence.
 */
export interface OperationalSkill {
  // Identity
  id: string
  name: string
  description: string
  category: SkillCategory
  version: string  // Semantic versioning (e.g., "1.0.0")

  // Lifecycle
  status: SkillLifecycleStatus

  // Ownership
  owner: string
  tags: string[]

  // Applicability
  supportedDomains: OperationalDomain[]
  supportedExpertiseProfiles: ExpertiseProfile[]
  supportedIntents: IntentType[]
  supportedReasoningStrategies: ReasoningStrategy[]

  // Evidence Requirements
  requiredKnowledgeCategories: string[]
  requiredMemoryTypes: string[]
  requiredEventTypes: string[]
  requiredContext: SkillContextRequirement

  // Interface
  inputs: SkillInput[]
  outputs: SkillOutput[]

  // Quality
  confidenceRules: SkillConfidenceRules
  explainabilityRules: SkillExplainabilityRules
  validationRules: SkillValidationRules

  // Metadata
  estimatedCost: SkillCostEstimate
  dependencies: string[]  // Other skill IDs this skill depends on

  // Audit
  createdAt: string
  updatedAt: string
  approvedAt?: string
  approvedBy?: string

  // Governance
  changeHistory: SkillChangeRecord[]
  performanceMetrics?: SkillPerformanceMetrics
}

// ============================================================================
// Skill Context Requirements
// ============================================================================

export interface SkillContextRequirement {
  businessIdRequired: boolean
  timeRangeRequired: boolean
  outletIdRequired: boolean
  minimumKnowledgeCount: number
  minimumMemoryCount: number
  minimumEventCount: number
  minimumConfidence: 'low' | 'medium' | 'high' | 'very_high' | 'certain'
}

// ============================================================================
// Skill Input/Output
// ============================================================================

export interface SkillInput {
  name: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' | 'knowledge_ref' | 'memory_ref' | 'event_ref'
  required: boolean
  description: string
  defaultValue?: unknown
  validationPattern?: string
}

export interface SkillOutput {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'metric' | 'finding' | 'recommendation'
  description: string
  unit?: string
}

// ============================================================================
// Skill Quality Rules
// ============================================================================

export interface SkillConfidenceRules {
  baseConfidence: number  // 0..1
  evidenceWeight: number  // 0..1 — how much evidence quality affects confidence
  consistencyWeight: number  // 0..1 — how much consistency affects confidence
  recencyWeight: number  // 0..1 — how much recency affects confidence
  minimumEvidenceCount: number  // Minimum evidence items for non-zero confidence
  contradictionPenalty: number  // 0..1 — penalty per contradiction
}

export interface SkillExplainabilityRules {
  requireKnowledgeTrace: boolean
  requireMemoryTrace: boolean
  requireEventTrace: boolean
  requireReasoningStrategy: boolean
  requireAlternativeOptions: boolean
  narrativeTemplate: string  // Template for explanation narrative
}

export interface SkillValidationRules {
  functionalTestRequired: boolean
  integrationTestRequired: boolean
  performanceTestRequired: boolean
  edgeCaseTestRequired: boolean
  failureScenarioTestRequired: boolean
  confidenceValidationRequired: boolean
  explainabilityValidationRequired: boolean
  minimumTestPassRate: number  // 0..1
}

// ============================================================================
// Skill Cost Estimate
// ============================================================================

export interface SkillCostEstimate {
  estimatedExecutionTimeMs: number
  estimatedMemoryMb: number
  estimatedApiCalls: number
  estimatedDbQueries: number
  complexity: 'low' | 'medium' | 'high'
}

// ============================================================================
// Skill Execution
// ============================================================================

export interface SkillExecutionContext {
  businessId: string
  businessName: string
  timeRange?: { start: string; end: string }
  outletId?: string
  expertiseProfile: ExpertiseProfile
  intent: IntentType
  operationalDomain: OperationalDomain
  reasoningStrategy: ReasoningStrategy
  // Evidence retrieved from the certified architecture
  knowledge: import('@/lib/hospitality-knowledge/types').KnowledgeEntity[]
  memories: import('@/lib/hospitality-memory/types').HospitalityMemoryEntity[]
  events: import('@/lib/intelligence/types').OperationalEvent[]
  // User-provided inputs
  inputs: Record<string, unknown>
  // Execution metadata
  requestId: string
  userId?: string
}

export interface SkillExecutionResult {
  skillId: string
  skillName: string
  skillVersion: string
  success: boolean
  outputs: Record<string, unknown>
  findings: SkillFinding[]
  metrics: SkillMetric[]
  confidence: number  // 0..1
  confidenceFactors: {
    evidenceQuality: number
    consistency: number
    recency: number
    contradictionPenalty: number
  }
  evidence: SkillEvidence
  explainability: SkillExplainability
  executionTime: number
  warnings: string[]
  error?: string
}

export interface SkillFinding {
  id: string
  type: 'observation' | 'risk' | 'opportunity' | 'anomaly' | 'trend' | 'threshold' | 'recommendation'
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  evidenceRefs: string[]  // Knowledge/memory/event IDs
  confidence: number
  actionable: boolean
  recommendedAction?: string
}

export interface SkillMetric {
  name: string
  value: number
  unit: string
  target?: number
  status?: 'good' | 'warning' | 'critical'
  trend?: 'up' | 'down' | 'stable'
  description: string
}

export interface SkillEvidence {
  knowledgeIds: string[]
  memoryIds: string[]
  eventIds: string[]
  evidenceCount: number
  evidenceQuality: number  // 0..1
  evidenceSummary: string
}

export interface SkillExplainability {
  reasoningStrategy: ReasoningStrategy
  knowledgeConsulted: Array<{ id: string; title: string; category: string; confidence: string }>
  memoriesConsulted: Array<{ id: string; title: string; confidence: number }>
  eventsConsulted: number
  narrative: string
  alternativeOptions: Array<{ option: string; rationale: string; confidence: number }>
}

// ============================================================================
// Skill Change Records (Governance)
// ============================================================================

export interface SkillChangeRecord {
  timestamp: string
  changeType: 'created' | 'updated' | 'status_changed' | 'version_changed' | 'approved' | 'deprecated' | 'retired'
  description: string
  changedBy: string
  previousVersion?: string
  newVersion?: string
  previousStatus?: SkillLifecycleStatus
  newStatus?: SkillLifecycleStatus
}

export interface SkillPerformanceMetrics {
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  averageExecutionTime: number
  averageConfidence: number
  lastExecutedAt?: string
  failureRate: number
  usageByProfile: Record<string, number>
  usageByDomain: Record<string, number>
}

// ============================================================================
// Skill Discovery
// ============================================================================

export interface SkillDiscoveryRequest {
  intent: IntentType
  operationalDomain: OperationalDomain
  expertiseProfile: ExpertiseProfile
  reasoningStrategy?: ReasoningStrategy
  availableKnowledgeCategories?: string[]
  context?: Partial<SkillExecutionContext>
}

export interface SkillDiscoveryResult {
  selectedSkills: Array<{
    skill: OperationalSkill
    relevanceScore: number
    selectionReason: string
  }>
  rejectedSkills: Array<{
    skill: OperationalSkill
    rejectionReason: string
  }>
  discoveryTime: number
}

// ============================================================================
// Skill Orchestration
// ============================================================================

export interface SkillOrchestrationPlan {
  id: string
  requestId: string
  skills: Array<{
    skillId: string
    skillName: string
    executionOrder: number
    dependsOn: string[]
    inputs: Record<string, unknown>
    inputFromPreviousSteps?: Array<{
      fromSkillId: string
      fromOutput: string
      toInput: string
    }>
  }>
  combinationStrategy: 'sequential' | 'parallel' | 'pipeline' | 'fan_out_fan_in'
  estimatedTotalTime: number
  createdAt: string
}

export interface SkillOrchestrationResult {
  plan: SkillOrchestrationPlan
  stepResults: SkillExecutionResult[]
  combinedFindings: SkillFinding[]
  combinedMetrics: SkillMetric[]
  combinedEvidence: SkillEvidence
  overallConfidence: number
  narrative: string
  totalTime: number
  success: boolean
  warnings: string[]
}

// ============================================================================
// Skill Registry Catalog
// ============================================================================

export interface SkillCatalogEntry {
  skill: OperationalSkill
  registeredAt: string
  executionCount: number
  averageConfidence: number
  healthStatus: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
}

export interface SkillCatalog {
  totalSkills: number
  skillsByCategory: Record<string, number>
  skillsByStatus: Record<string, number>
  skillsByDomain: Record<string, number>
  entries: SkillCatalogEntry[]
}

// ============================================================================
// Skill Validation
// ============================================================================

export interface SkillValidationResult {
  skillId: string
  valid: boolean
  tests: Array<{
    name: string
    type: 'functional' | 'integration' | 'performance' | 'edge_case' | 'failure_scenario' | 'confidence' | 'explainability' | 'reasoning'
    passed: boolean
    description: string
    duration: number
    error?: string
  }>
  passRate: number
  validatedAt: string
  validatedBy: string
  issues: string[]
}

// ============================================================================
// Skill Executor Interface
// ============================================================================

/**
 * Interface that every skill executor must implement.
 * This is the contract between the registry and individual skills.
 */
export interface SkillExecutor {
  skillId: string
  execute(context: SkillExecutionContext): Promise<SkillExecutionResult>
  validate(context: SkillExecutionContext): Promise<SkillValidationResult>
}

// ============================================================================
// Request/Response Types for API
// ============================================================================

export interface SkillRegisterRequest {
  skill: OperationalSkill
}

export interface SkillRegisterResponse {
  success: boolean
  skillId: string
  error?: string
}

export interface SkillSearchRequest {
  query?: string
  category?: SkillCategory
  status?: SkillLifecycleStatus
  domain?: OperationalDomain
  expertiseProfile?: ExpertiseProfile
  intent?: IntentType
  limit?: number
}

export interface SkillSearchResponse {
  success: boolean
  totalResults: number
  results: Array<{
    skill: OperationalSkill
    relevanceScore: number
    matchedFields: string[]
  }>
  error?: string
}

export interface SkillExecuteRequest {
  skillId: string
  context: SkillExecutionContext
}

export interface SkillExecuteResponse {
  success: boolean
  result?: SkillExecutionResult
  error?: string
}

export interface SkillValidateRequest {
  skillId: string
  context: SkillExecutionContext
}

export interface SkillValidateResponse {
  success: boolean
  result?: SkillValidationResult
  error?: string
}

export interface SkillVersionRequest {
  skillId: string
  version?: string
}

export interface SkillVersionResponse {
  success: boolean
  skillId: string
  currentVersion: string
  versions: Array<{
    version: string
    status: SkillLifecycleStatus
    createdAt: string
    changeDescription: string
  }>
  error?: string
}

export interface SkillHistoryRequest {
  skillId: string
  limit?: number
}

export interface SkillHistoryResponse {
  success: boolean
  skillId: string
  history: SkillChangeRecord[]
  performanceMetrics?: SkillPerformanceMetrics
  error?: string
}

export interface SkillCatalogResponse {
  success: boolean
  catalog: SkillCatalog
  error?: string
}
