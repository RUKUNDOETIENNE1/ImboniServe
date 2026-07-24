/**
 * Hospitality Memory™
 *
 * Hospitality Operational Memory Engine domain model.
 * This module is platform-internal and hospitality-wide (not restaurant-only).
 */

import type { BaseIntelligenceRequest, BaseIntelligenceResponse } from '@/lib/intelligence/base-service'

export type HospitalityMemoryCategory =
  | 'operational'
  | 'product'
  | 'customer'
  | 'kitchen'
  | 'service'
  | 'inventory'
  | 'financial'
  | 'strategic'
  | 'supplier'
  | 'reservation'
  | 'environmental'
  | 'staff'
  | 'marketing'

export type HospitalityMemoryStatus =
  | 'observation'
  | 'emerging'
  | 'confirmed'
  | 'business_rule'
  | 'historical'
  | 'archived'
  | 'regression'
  | 'reconfirmed'
  | 'retired'
  | 'conflict_review'

export type HospitalityMemoryConfidenceLevel = 'low' | 'medium' | 'high' | 'very_high'

export interface MemoryObservationRef {
  id: string
  eventId: string
  eventType: string
  timestamp: string
  sourceModule: string
  evidence: string
  polarity: -1 | 0 | 1
  impactScore: number // 0..1
  context: HospitalityMemoryContext
}

export interface MemoryConfidenceSnapshot {
  timestamp: string
  score: number // 0..1
  level: HospitalityMemoryConfidenceLevel
  factors: {
    frequency: number
    consistency: number
    recency: number
    impact: number
    evidence: number
    relationship: number
    contradictionPenalty: number
  }
  reason: string
}

export interface MemoryLifecycleTransition {
  timestamp: string
  from: HospitalityMemoryStatus
  to: HospitalityMemoryStatus
  reason: string
  triggeredByObservationIds: string[]
}

export interface MemoryConsumerAccess {
  consumer: string
  timestamp: string
  purpose: string
}

export interface HospitalityMemoryProvenance {
  originEventIds: string[]
  originModules: string[]
  formationRule: string
  formationRuleVersion: string
  observationRefs: MemoryObservationRef[]
  confidenceHistory: MemoryConfidenceSnapshot[]
  lifecycleHistory: MemoryLifecycleTransition[]
  consumerAccessHistory: MemoryConsumerAccess[]
}

export interface HospitalityMemoryContext {
  dayOfWeek?: string[]
  timeOfDay?: string[]
  season?: string[]
  weather?: string[]
  outletId?: string[]
  tags?: string[]
}

export interface HospitalityMemoryEntity {
  id: string
  businessId: string
  version: number
  fingerprint: string
  title: string
  description: string
  category: HospitalityMemoryCategory
  status: HospitalityMemoryStatus
  confidence: HospitalityMemoryConfidenceLevel
  confidenceScore: number // 0..1
  firstObserved: string
  lastObserved: string
  observationCount: number
  reinforcementCount: number
  contradictionCount: number
  businessImpact: string
  impactLevel: 'low' | 'medium' | 'high' | 'critical'
  recommendedAction: string
  actionTaken?: boolean
  actionResult?: string
  supersedesMemoryId?: string
  supersededByMemoryId?: string
  relatedMemoryIds: string[]
  context: HospitalityMemoryContext
  tags: string[]
  provenance: HospitalityMemoryProvenance
  createdAt: string
  updatedAt: string
}

export type HospitalityMemoryRelationshipType =
  | 'causes'
  | 'correlates'
  | 'enables'
  | 'prevents'
  | 'similar'

export interface HospitalityMemoryRelationship {
  id: string
  businessId: string
  fromMemoryId: string
  toMemoryId: string
  type: HospitalityMemoryRelationshipType
  strength: number // 0..1
  evidence: string
  firstObserved: string
  lastObserved: string
  observationCount: number
  createdAt: string
  updatedAt: string
}

export interface HospitalityMemoryConflict {
  id: string
  businessId: string
  memoryAId: string
  memoryBId: string
  reason: string
  status: 'open' | 'resolved' | 'dismissed'
  resolution?: string
  createdAt: string
  updatedAt: string
}

export interface HospitalityMemoryTimelineEntry {
  id: string
  businessId: string
  memoryId: string
  event:
    | 'created'
    | 'observed'
    | 'confirmed'
    | 'elevated'
    | 'historical'
    | 'archived'
    | 'regression'
    | 'reconfirmed'
    | 'retired'
    | 'conflict_review'
  timestamp: string
  description: string
  metadata?: Record<string, unknown>
}

export interface HospitalityObservationCandidate {
  key: string
  title: string
  description: string
  category: HospitalityMemoryCategory
  impactLevel: 'low' | 'medium' | 'high' | 'critical'
  impactScore: number // 0..1
  recommendedAction: string
  polarity: -1 | 0 | 1
  tags: string[]
  context: HospitalityMemoryContext
  sourceModule: string
  eventRefs: Array<{
    eventId: string
    eventType: string
    timestamp: string
    evidence: string
  }>
}

export interface HospitalityMemoryRequest extends BaseIntelligenceRequest {
  category?: HospitalityMemoryCategory
  status?: HospitalityMemoryStatus
  minConfidence?: HospitalityMemoryConfidenceLevel
  searchQuery?: string
  contextual?: boolean
  includeTimeline?: boolean
  includeRelationships?: boolean
  includeConflicts?: boolean
  includeProvenance?: boolean
}

export interface HospitalityMemoryReport {
  id: string
  businessId: string
  businessName: string
  reportingPeriod: {
    start: Date
    end: Date
    label: string
  }
  generatedAt: Date
  totalMemories: number
  newMemories: number
  confirmedMemories: number
  businessRules: number
  conflictsOpen: number
  memoriesByCategory: Record<string, number>
  memoriesByStatus: Record<string, number>
  memories: HospitalityMemoryEntity[]
  relationships: HospitalityMemoryRelationship[]
  conflicts: HospitalityMemoryConflict[]
  timeline: HospitalityMemoryTimelineEntry[]
  contextualMemories: HospitalityMemoryEntity[]
  morningRecall: {
    whatToRemember: string[]
    lessonsFromSimilarDays: string[]
    mistakesToAvoid: string[]
    provenBestPractices: string[]
    opportunitiesBasedOnExperience: string[]
  }
  retrievalHints: {
    dailyBriefings: string[]
    serviceIntelligence: string[]
    kitchenIntelligence: string[]
    menuIntelligence: string[]
    hospitalityKnowledge: string[]
    hospitalityAICopilot: string[]
  }
  insights: Array<{
    type: 'success' | 'warning' | 'info' | 'action'
    category: string
    message: string
    priority: 'high' | 'medium' | 'low'
    relatedMemories: string[]
  }>
  confidence: number
  eventsAnalyzed: number
  memoriesFormed: number
  memoriesEvolved: number
  diagnostics: {
    processingTime: number
    dataQuality: string
    warnings: string[]
  }
}

export interface HospitalityMemoryResponse extends BaseIntelligenceResponse<HospitalityMemoryReport> {
  success: boolean
  report?: HospitalityMemoryReport
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
    eventsAnalyzed: number
    memoriesFormed: number
    warnings: string[]
  }
}

export interface HospitalityMemorySearchRequest {
  businessId: string
  query: string
  category?: HospitalityMemoryCategory
  status?: HospitalityMemoryStatus
  minConfidence?: HospitalityMemoryConfidenceLevel
  limit?: number
}

export interface HospitalityMemorySearchResult {
  memory: HospitalityMemoryEntity
  relevanceScore: number
  matchedFields: string[]
}

export interface HospitalityMemorySearchResponse {
  success: boolean
  query: string
  totalResults: number
  results: HospitalityMemorySearchResult[]
  error?: string
}

export interface HospitalityMemoryTimelineResponse {
  success: boolean
  businessId: string
  entries: HospitalityMemoryTimelineEntry[]
  total: number
  error?: string
}
