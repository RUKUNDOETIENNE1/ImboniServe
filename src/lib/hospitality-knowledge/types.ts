/**
 * Hospitality Knowledge™
 *
 * The Understanding Layer of the Hospitality Intelligence Platform.
 *
 * Architectural Separation:
 *   Heart Pulse Events → Hospitality Memory → Hospitality Knowledge → Hospitality AI Copilot
 *
 * Knowledge is NOT:
 *   - raw events (that's Heart Pulse)
 *   - observations/patterns (that's Hospitality Memory)
 *   - reasoning/decisions (that's Hospitality AI Copilot)
 *
 * Knowledge IS:
 *   - validated, synthesized understanding derived from multiple memories
 *   - evidence-backed conclusions about how the business operates
 *   - durable business truths that survive staff turnover and time
 *
 * Platform: Hospitality Intelligence Platform v2.2.0
 * Module: Hospitality Knowledge™ v1.0
 */

import type { BaseIntelligenceRequest, BaseIntelligenceResponse } from '@/lib/intelligence/base-service'
import type { HospitalityMemoryEntity } from '@/lib/hospitality-memory/types'

// ============================================================================
// Knowledge Categories
// ============================================================================

/**
 * Knowledge categories represent domains of business understanding.
 * Each category maps to a domain of operational truth.
 */
export type KnowledgeCategory =
  | 'operational'      // How the business runs day-to-day
  | 'customer'         // Who customers are and what they want
  | 'staff'            // Workforce patterns and performance truths
  | 'menu'             // Product/menu performance understanding
  | 'financial'        // Revenue, cost, and margin truths
  | 'business'         // Strategic business-level understanding
  | 'kitchen'          // Kitchen operational truths
  | 'service'          // Service quality truths
  | 'inventory'        // Supply chain and stock truths
  | 'supplier'         // Supplier relationship truths
  | 'environmental'    // External factor impacts (weather, events, season)
  | 'marketing'        // Campaign and promotion effectiveness truths
  | 'competitive'      // Market position understanding
  | 'regulatory'       // Compliance and regulatory truths

// ============================================================================
// Knowledge Lifecycle
// ============================================================================

/**
 * Knowledge lifecycle states.
 *
 * Knowledge progresses through a stricter lifecycle than memory:
 * - candidate: proposed by discovery engine, not yet validated
 * - provisional: passed initial validation, awaiting more evidence
 * - established: validated with sufficient multi-memory evidence
 * - canonical: elevated as a core business truth
 * - deprecated: superseded by newer knowledge
 * - retired: no longer relevant, preserved for history
 * - disputed: contradictory evidence detected, under review
 * - refuted: invalidated by stronger contradictory evidence
 */
export type KnowledgeStatus =
  | 'candidate'
  | 'provisional'
  | 'established'
  | 'canonical'
  | 'deprecated'
  | 'retired'
  | 'disputed'
  | 'refuted'

// ============================================================================
// Knowledge Confidence
// ============================================================================

export type KnowledgeConfidenceLevel = 'low' | 'medium' | 'high' | 'very_high' | 'certain'

/**
 * Knowledge confidence is stricter than memory confidence.
 * Knowledge must be backed by multiple independent memory sources.
 */
export interface KnowledgeConfidenceSnapshot {
  timestamp: string
  score: number // 0..1
  level: KnowledgeConfidenceLevel
  factors: KnowledgeConfidenceFactors
  reason: string
}

export interface KnowledgeConfidenceFactors {
  evidenceDiversity: number    // 0..1 — how many distinct memory sources
  evidenceConsistency: number  // 0..1 — agreement across sources
  evidenceRecency: number      // 0..1 — freshness of supporting evidence
  evidenceVolume: number       // 0..1 — total observation count behind knowledge
  memoryConfidence: number     // 0..1 — avg confidence of supporting memories
  crossValidation: number      // 0..1 — validated across time/context windows
  contradictionPenalty: number // 0..1 — penalty for contradictory evidence
  relationshipSupport: number  // 0..1 — support from knowledge graph
}

// ============================================================================
// Knowledge Evidence
// ============================================================================

/**
 * A reference to a memory that supports this knowledge.
 */
export interface KnowledgeMemoryRef {
  memoryId: string
  memoryTitle: string
  memoryCategory: string
  memoryConfidence: number
  memoryStatus: string
  contribution: string  // How this memory supports the knowledge
  weight: number        // 0..1 — how strongly this memory supports the knowledge
  firstContributed: string
  lastContributed: string
}

/**
 * A reference to another knowledge object that supports or relates to this one.
 */
export interface KnowledgeCrossRef {
  knowledgeId: string
  knowledgeTitle: string
  relationship: 'supports' | 'contradicts' | 'extends' | 'depends_on' | 'contextualizes'
  description: string
}

// ============================================================================
// Knowledge Provenance
// ============================================================================

/**
 * Full provenance chain from events to knowledge.
 *
 * This makes the formation pipeline auditable:
 * Heart Pulse Events → Memories → Clusters → Patterns → Candidates → Validation → Knowledge
 */
export interface KnowledgeProvenance {
  // Origin
  originMemoryIds: string[]
  originEventIds: string[]
  originModules: string[]

  // Formation pipeline trace
  formationPipeline: KnowledgeFormationStage[]

  // Evidence
  memoryRefs: KnowledgeMemoryRef[]
  crossRefs: KnowledgeCrossRef[]

  // Confidence evolution
  confidenceHistory: KnowledgeConfidenceSnapshot[]

  // Lifecycle evolution
  lifecycleHistory: KnowledgeLifecycleTransition[]

  // Consumer access log
  consumerAccessHistory: KnowledgeConsumerAccess[]

  // Governance
  formationRule: string
  formationRuleVersion: string
  validationRule: string
  validationRuleVersion: string
}

export interface KnowledgeFormationStage {
  stage:
    | 'memory_ingestion'
    | 'memory_clustering'
    | 'pattern_detection'
    | 'evidence_evaluation'
    | 'candidate_formation'
    | 'knowledge_validation'
    | 'knowledge_establishment'
    | 'graph_integration'
  timestamp: string
  inputCount: number
  outputCount: number
  description: string
  metadata?: Record<string, unknown>
}

export interface KnowledgeLifecycleTransition {
  timestamp: string
  from: KnowledgeStatus
  to: KnowledgeStatus
  reason: string
  evidenceSummary: string
  triggeredBy: string  // rule name or consumer
}

export interface KnowledgeConsumerAccess {
  consumer: string
  timestamp: string
  purpose: string
  result: 'used' | 'referenced' | 'discarded'
}

// ============================================================================
// Knowledge Entity (Aggregate Root)
// ============================================================================

/**
 * A piece of established business understanding.
 *
 * Knowledge is the platform's highest-trust cognitive artifact below
 * AI Copilot reasoning. It represents validated truths about the business.
 */
export interface KnowledgeEntity {
  id: string
  businessId: string
  version: number
  fingerprint: string

  // Identity
  title: string
  summary: string          // One-line truth statement
  description: string      // Detailed explanation
  category: KnowledgeCategory

  // The actual knowledge statement
  statement: string        // e.g., "Friday dinner service requires 3 kitchen staff to maintain 15-minute ticket times"

  // Lifecycle
  status: KnowledgeStatus

  // Confidence
  confidence: KnowledgeConfidenceLevel
  confidenceScore: number  // 0..1

  // Evidence
  supportingMemoryCount: number
  contradictingMemoryCount: number
  totalEvidenceCount: number

  // Temporal
  firstObserved: string    // When the underlying pattern was first seen
  lastValidated: string    // When knowledge was last re-validated
  establishedAt: string    // When knowledge reached 'established' status
  updatedAt: string

  // Business context
  businessImpact: string
  impactLevel: 'low' | 'medium' | 'high' | 'critical'
  applicability: KnowledgeApplicability

  // Actionability
  recommendedActions: KnowledgeRecommendedAction[]
  operationalRules: string[]  // Derived operational rules

  // Graph
  relatedKnowledgeIds: string[]
  supersededKnowledgeId?: string
  supersedingKnowledgeId?: string

  // Tags for retrieval
  tags: string[]

  // Full provenance
  provenance: KnowledgeProvenance

  // Audit
  createdAt: string
}

export interface KnowledgeApplicability {
  scope: 'business' | 'outlet' | 'category' | 'temporal' | 'contextual'
  conditions: string[]  // e.g., ["dayOfWeek:Friday", "timeOfDay:evening"]
  outlets?: string[]
  validDuring?: {
    start?: string
    end?: string
  }
}

export interface KnowledgeRecommendedAction {
  action: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  expectedOutcome: string
  basedOn: string  // evidence summary
}

// ============================================================================
// Knowledge Graph
// ============================================================================

export type KnowledgeRelationshipType =
  | 'causes'          // A causes B
  | 'caused_by'       // A is caused by B
  | 'depends_on'      // A requires B to be true
  | 'enables'         // A makes B possible
  | 'prevents'        // A stops B from happening
  | 'correlates_with' // A and B occur together
  | 'contradicts'     // A and B cannot both be true
  | 'extends'         // A is a broader version of B
  | 'specializes'     // A is a specific case of B
  | 'precedes'        // A happens before B temporally
  | 'hierarchy_parent' // A is parent of B in taxonomy
  | 'hierarchy_child'  // A is child of B in taxonomy
  | 'similar_to'      // A and B are conceptually similar

export interface KnowledgeRelationship {
  id: string
  businessId: string
  fromKnowledgeId: string
  toKnowledgeId: string
  type: KnowledgeRelationshipType
  strength: number  // 0..1
  confidence: number  // 0..1
  evidence: string
  discoveredAt: string
  lastValidated: string
  observationCount: number
  createdAt: string
  updatedAt: string
}

// ============================================================================
// Knowledge Conflicts
// ============================================================================

export interface KnowledgeConflict {
  id: string
  businessId: string
  knowledgeAId: string
  knowledgeBId: string
  conflictType: 'contradiction' | 'temporal' | 'scope' | 'confidence'
  description: string
  status: 'open' | 'resolved_a' | 'resolved_b' | 'resolved_merge' | 'unresolvable'
  resolution?: string
  resolvedAt?: string
  createdAt: string
  updatedAt: string
}

// ============================================================================
// Knowledge Timeline
// ============================================================================

export interface KnowledgeTimelineEntry {
  id: string
  businessId: string
  knowledgeId: string
  event:
    | 'candidate_formed'
    | 'provisional_granted'
    | 'established'
    | 'canonical'
    | 'deprecated'
    | 'retired'
    | 'disputed'
    | 'refuted'
    | 'revalidated'
    | 'updated'
    | 'conflict_detected'
    | 'conflict_resolved'
    | 'graph_updated'
  timestamp: string
  description: string
  metadata?: Record<string, unknown>
}

// ============================================================================
// Formation Pipeline Intermediate Types
// ============================================================================

/**
 * A cluster of related memories that may form the basis of knowledge.
 */
export interface MemoryCluster {
  id: string
  businessId: string
  clusterKey: string
  category: KnowledgeCategory
  memoryIds: string[]
  memories: HospitalityMemoryEntity[]
  clusterTheme: string
  coherenceScore: number  // 0..1 — how well memories align
  size: number
  createdAt: string
}

/**
 * A detected pattern within a memory cluster.
 */
export interface KnowledgePattern {
  id: string
  clusterId: string
  businessId: string
  patternType:
    | 'frequency'
    | 'temporal'
    | 'correlation'
    | 'causal'
    | 'trend'
    | 'threshold'
    | 'anomaly'
    | 'business_rule'
  description: string
  supportingMemoryIds: string[]
  strength: number  // 0..1
  confidence: number  // 0..1
  detectedAt: string
  metadata?: Record<string, unknown>
}

/**
 * An evaluated candidate for knowledge formation.
 */
export interface KnowledgeCandidate {
  id: string
  businessId: string
  fingerprint: string
  title: string
  statement: string
  summary: string
  description: string
  category: KnowledgeCategory
  patternIds: string[]
  supportingMemoryIds: string[]
  contradictingMemoryIds: string[]
  evidenceDiversity: number
  evidenceConsistency: number
  evidenceVolume: number
  preliminaryConfidence: number
  businessImpact: string
  impactLevel: 'low' | 'medium' | 'high' | 'critical'
  tags: string[]
  createdAt: string
}

// ============================================================================
// Request / Response Types
// ============================================================================

export interface KnowledgeRequest extends BaseIntelligenceRequest {
  category?: KnowledgeCategory
  status?: KnowledgeStatus
  minConfidence?: KnowledgeConfidenceLevel
  searchQuery?: string
  includeGraph?: boolean
  includeTimeline?: boolean
  includeConflicts?: boolean
  includeProvenance?: boolean
  includeCandidates?: boolean
  consumer?: string  // Filter for specific consumer perspective
}

export interface KnowledgeReport {
  id: string
  businessId: string
  businessName: string
  reportingPeriod: {
    start: Date
    end: Date
    label: string
  }
  generatedAt: Date

  // Statistics
  totalKnowledge: number
  establishedKnowledge: number
  canonicalKnowledge: number
  candidateKnowledge: number
  disputedKnowledge: number
  openConflicts: number

  // Distributions
  knowledgeByCategory: Record<string, number>
  knowledgeByStatus: Record<string, number>
  knowledgeByConfidence: Record<string, number>

  // Knowledge collections
  knowledge: KnowledgeEntity[]
  candidates: KnowledgeCandidate[]
  relationships: KnowledgeRelationship[]
  conflicts: KnowledgeConflict[]
  timeline: KnowledgeTimelineEntry[]

  // Formation pipeline stats
  pipelineStats: KnowledgePipelineStats

  // Consumer-targeted views
  consumerViews: KnowledgeConsumerViews

  // Insights
  insights: KnowledgeInsight[]

  // Metadata
  confidence: number
  memoriesAnalyzed: number
  knowledgeFormed: number
  knowledgeUpdated: number
  diagnostics: {
    processingTime: number
    dataQuality: string
    warnings: string[]
  }
}

export interface KnowledgePipelineStats {
  memoriesIngested: number
  clustersFormed: number
  patternsDetected: number
  candidatesFormed: number
  candidatesValidated: number
  knowledgeEstablished: number
  knowledgeRetired: number
  graphEdgesCreated: number
  conflictsDetected: number
  conflictsResolved: number
}

export interface KnowledgeConsumerViews {
  hospitalityAICopilot: KnowledgeEntity[]
  dailyBriefings: KnowledgeEntity[]
  serviceIntelligence: KnowledgeEntity[]
  kitchenIntelligence: KnowledgeEntity[]
  menuIntelligence: KnowledgeEntity[]
  futureModules: KnowledgeEntity[]
}

export interface KnowledgeInsight {
  type: 'discovery' | 'validation' | 'conflict' | 'retirement' | 'canonical' | 'graph'
  category: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  relatedKnowledge: string[]
}

export interface KnowledgeResponse extends BaseIntelligenceResponse<KnowledgeReport> {
  success: boolean
  report?: KnowledgeReport
  error?: string
  diagnostics: {
    reportsRetrieved: number
    historicalQueriesExecuted: number
    comparisonPerformed: boolean
    totalTime: number
    reportRetrievalTime: number
    historicalRetrievalTime: number
    comparisonTime: number
    buildTime: number
    timestamp: Date
    processingTime: number
    memoriesAnalyzed: number
    knowledgeFormed: number
    warnings: string[]
  }
}

// ============================================================================
// Search / Retrieval Types
// ============================================================================

export interface KnowledgeSearchRequest {
  businessId: string
  query: string
  category?: KnowledgeCategory
  status?: KnowledgeStatus
  minConfidence?: KnowledgeConfidenceLevel
  limit?: number
}

export interface KnowledgeSearchResult {
  knowledge: KnowledgeEntity
  relevanceScore: number
  matchedFields: string[]
}

export interface KnowledgeSearchResponse {
  success: boolean
  query: string
  totalResults: number
  results: KnowledgeSearchResult[]
  error?: string
}

export interface KnowledgeGraphResponse {
  success: boolean
  businessId: string
  nodes: Array<{
    id: string
    title: string
    category: string
    status: string
    confidence: number
  }>
  edges: KnowledgeRelationship[]
  totalNodes: number
  totalEdges: number
  error?: string
}

export interface KnowledgeTimelineResponse {
  success: boolean
  businessId: string
  entries: KnowledgeTimelineEntry[]
  total: number
  error?: string
}

export interface KnowledgeConsumerRequest {
  businessId: string
  consumer:
    | 'hospitality-ai-copilot'
    | 'daily-briefings'
    | 'service-intelligence'
    | 'kitchen-intelligence'
    | 'menu-intelligence'
    | 'future-modules'
  limit?: number
}

export interface KnowledgeConsumerResponse {
  success: boolean
  consumer: string
  knowledge: KnowledgeEntity[]
  total: number
  error?: string
}

// ============================================================================
// Knowledge Dashboard
// ============================================================================

export interface KnowledgeDashboard {
  report: KnowledgeReport
  executiveSummary: {
    totalKnowledge: number
    establishedKnowledge: number
    canonicalKnowledge: number
    candidateKnowledge: number
    disputedKnowledge: number
    openConflicts: number
  }
  formationPipeline: KnowledgePipelineStats
  categoryDistribution: Array<{ category: string; count: number; percentage: string }>
  statusDistribution: Array<{ status: string; count: number; percentage: string }>
  confidenceDistribution: Array<{ level: string; count: number; percentage: string }>
  canonicalKnowledge: Array<{ title: string; statement: string; confidence: string }>
  recentDiscoveries: Array<{ title: string; category: string; status: string; formedAt: string }>
  activeConflicts: Array<{ knowledgeA: string; knowledgeB: string; type: string; status: string }>
  graphSummary: { type: string; count: number }[]
  consumerReadiness: Array<{ consumer: string; availableKnowledge: number }>
  timelinePreview: Array<{ when: string; event: string; description: string }>
  metadata: {
    generatedAt: string
    period: string
    confidence: string
    memoriesAnalyzed: number
    knowledgeFormed: number
  }
}
