/**
 * Hospitality Knowledge™ module exports.
 *
 * The Understanding Layer of the Hospitality Intelligence Platform.
 *
 * Architecture:
 *   Heart Pulse Events → Hospitality Memory → Hospitality Knowledge → Hospitality AI Copilot
 */

// Service
export { HospitalityKnowledgeService } from './service'

// Dashboard
export { HospitalityKnowledgeDashboardBuilder } from './dashboard-builder'

// Repository
export { HospitalityKnowledgeRepository } from './repository'
export type { KnowledgeState } from './repository'

// Aggregator
export { HospitalityKnowledgeAggregator } from './aggregator'

// Discovery Engine
export {
  runDiscoveryPipeline,
  ingestMemories,
  clusterMemories,
  detectPatterns,
  evaluateEvidence,
  formCandidates,
} from './discovery-engine'
export type {
  DiscoveryPipelineResult,
  IngestionResult,
  ClusteringResult,
  PatternDetectionResult,
  EvidenceEvaluationResult,
  CandidateFormationResult,
} from './discovery-engine'

// Validation Engine
export { validateAndEstablish } from './validation-engine'
export type { ValidationContext, ValidationResult } from './validation-engine'

// Graph Engine
export {
  buildKnowledgeGraph,
  queryGraph,
  findPath,
  graphDensity,
  getConnectedComponents,
} from './graph-engine'
export type { GraphBuildResult } from './graph-engine'

// Governance Engine
export {
  explainKnowledge,
  auditKnowledge,
  logConsumerAccess,
  createVersionSnapshot,
  diffKnowledgeVersions,
  reconstructEvolution,
  validateProvenance,
  createTimelineEntry,
} from './governance-engine'
export type {
  KnowledgeExplanation,
  KnowledgeAuditRecord,
} from './governance-engine'

// Consumer Interfaces
export {
  getKnowledgeForConsumer,
  getKnowledgeForAICopilot,
  getKnowledgeForDailyBriefings,
  getKnowledgeForServiceIntelligence,
  getKnowledgeForKitchenIntelligence,
  getKnowledgeForMenuIntelligence,
  searchKnowledge,
  summarizeForConsumer,
  CONSUMER_PROFILES,
} from './consumer-interfaces'
export type {
  ConsumerProfile,
  KnowledgeSummaryForConsumer,
  KnowledgeSearchResultInternal,
} from './consumer-interfaces'

// Confidence Engine
export {
  computeKnowledgeConfidence,
  buildKnowledgeConfidenceSnapshot,
  scoreToLevel as scoreToKnowledgeLevel,
  computeEvidenceDiversity,
  computeEvidenceVolume,
  computeEvidenceConsistency,
  computeContradictionPenalty,
  computeCrossValidation,
  computeEvidenceRecency,
} from './confidence-engine'

// Lifecycle Engine
export {
  evaluateLifecycle,
  applyTransition,
  isValidTransition,
} from './lifecycle-engine'
export type { LifecycleEvaluation } from './lifecycle-engine'

// Types
export type {
  KnowledgeCategory,
  KnowledgeStatus,
  KnowledgeConfidenceLevel,
  KnowledgeConfidenceSnapshot,
  KnowledgeConfidenceFactors,
  KnowledgeMemoryRef,
  KnowledgeCrossRef,
  KnowledgeProvenance,
  KnowledgeFormationStage,
  KnowledgeLifecycleTransition,
  KnowledgeConsumerAccess,
  KnowledgeEntity,
  KnowledgeApplicability,
  KnowledgeRecommendedAction,
  KnowledgeRelationshipType,
  KnowledgeRelationship,
  KnowledgeConflict,
  KnowledgeTimelineEntry,
  MemoryCluster,
  KnowledgePattern,
  KnowledgeCandidate,
  KnowledgeRequest,
  KnowledgeReport,
  KnowledgePipelineStats,
  KnowledgeConsumerViews,
  KnowledgeInsight,
  KnowledgeResponse,
  KnowledgeSearchRequest,
  KnowledgeSearchResult,
  KnowledgeSearchResponse,
  KnowledgeGraphResponse,
  KnowledgeTimelineResponse,
  KnowledgeConsumerRequest,
  KnowledgeConsumerResponse,
  KnowledgeDashboard,
} from './types'

// Utils
export {
  hashId,
  uniqueStrings,
  nowIso,
  clamp01,
  average,
  median,
  standardDeviation,
  timeOfDay,
  dayOfWeek,
  daysBetween,
  daysSince,
  tokenize,
  jaccardSimilarity,
  textSimilarity,
} from './utils'
