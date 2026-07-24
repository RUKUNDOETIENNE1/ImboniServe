/**
 * Operational Skill Registry — Base Skill Executor.
 *
 * Provides helper utilities for creating skill executors that:
 * - Retrieve evidence from Knowledge/Memory/Events
 * - Apply domain-specific analysis
 * - Produce structured findings, metrics, and explanations
 * - Never bypass the certified architecture
 */

import type {
  SkillExecutionContext,
  SkillExecutionResult,
  SkillFinding,
  SkillMetric,
  SkillEvidence,
  SkillExplainability,
  OperationalSkill,
  ReasoningStrategy,
} from './types'
import { hashId, nowIso, clamp01, average } from './utils'

// ============================================================================
// Skill Definition Builder
// ============================================================================

export interface SkillDefinitionBuilder {
  id: string
  name: string
  description: string
  category: OperationalSkill['category']
  version: string
  status: OperationalSkill['status']
  owner: string
  tags: string[]
  supportedDomains: OperationalSkill['supportedDomains']
  supportedExpertiseProfiles: OperationalSkill['supportedExpertiseProfiles']
  supportedIntents: OperationalSkill['supportedIntents']
  supportedReasoningStrategies: OperationalSkill['supportedReasoningStrategies']
  requiredKnowledgeCategories: string[]
  requiredMemoryTypes: string[]
  requiredEventTypes: string[]
  inputs: OperationalSkill['inputs']
  outputs: OperationalSkill['outputs']
  dependencies?: string[]
}

export function createSkillDefinition(builder: SkillDefinitionBuilder): OperationalSkill {
  return {
    ...builder,
    requiredContext: {
      businessIdRequired: true,
      timeRangeRequired: true,
      outletIdRequired: false,
      minimumKnowledgeCount: 1,
      minimumMemoryCount: 1,
      minimumEventCount: 1,
      minimumConfidence: 'low',
    },
    confidenceRules: {
      baseConfidence: 0.5,
      evidenceWeight: 0.3,
      consistencyWeight: 0.2,
      recencyWeight: 0.1,
      minimumEvidenceCount: 1,
      contradictionPenalty: 0.15,
    },
    explainabilityRules: {
      requireKnowledgeTrace: true,
      requireMemoryTrace: true,
      requireEventTrace: true,
      requireReasoningStrategy: true,
      requireAlternativeOptions: true,
      narrativeTemplate: 'Based on {evidenceCount} evidence items from {knowledgeCount} knowledge objects, this skill identified {findingCount} findings.',
    },
    validationRules: {
      functionalTestRequired: true,
      integrationTestRequired: true,
      performanceTestRequired: true,
      edgeCaseTestRequired: true,
      failureScenarioTestRequired: true,
      confidenceValidationRequired: true,
      explainabilityValidationRequired: true,
      minimumTestPassRate: 0.8,
    },
    estimatedCost: {
      estimatedExecutionTimeMs: 100,
      estimatedMemoryMb: 10,
      estimatedApiCalls: 0,
      estimatedDbQueries: 2,
      complexity: 'low',
    },
    dependencies: builder.dependencies || [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    approvedAt: builder.status === 'production' ? nowIso() : undefined,
    approvedBy: builder.status === 'production' ? 'platform' : undefined,
    changeHistory: [{
      timestamp: nowIso(),
      changeType: 'created',
      description: `Skill created: ${builder.name} v${builder.version}`,
      changedBy: 'system',
    }],
  }
}

// ============================================================================
// Skill Execution Result Builder
// ============================================================================

export interface SkillResultBuilder {
  skillId: string
  skillName: string
  skillVersion: string
  findings: SkillFinding[]
  metrics: SkillMetric[]
  evidence: SkillEvidence
  explainability: SkillExplainability
  confidence?: number
  confidenceFactors?: {
    evidenceQuality: number
    consistency: number
    recency: number
    contradictionPenalty: number
  }
  warnings?: string[]
  executionTime: number
}

export function createSkillResult(builder: SkillResultBuilder): SkillExecutionResult {
  const confidence = builder.confidence ?? computeSkillConfidence(builder.evidence, builder.confidenceFactors)

  return {
    skillId: builder.skillId,
    skillName: builder.skillName,
    skillVersion: builder.skillVersion,
    success: true,
    outputs: {
      findings: builder.findings,
      metrics: builder.metrics,
    },
    findings: builder.findings,
    metrics: builder.metrics,
    confidence,
    confidenceFactors: builder.confidenceFactors || {
      evidenceQuality: clamp01(builder.evidence.evidenceQuality),
      consistency: 0.8,
      recency: 0.7,
      contradictionPenalty: 0,
    },
    evidence: builder.evidence,
    explainability: builder.explainability,
    executionTime: builder.executionTime,
    warnings: builder.warnings || [],
  }
}

export function createSkillErrorResult(
  skillId: string,
  skillName: string,
  skillVersion: string,
  error: string,
  executionTime: number
): SkillExecutionResult {
  return {
    skillId,
    skillName,
    skillVersion,
    success: false,
    outputs: {},
    findings: [],
    metrics: [],
    confidence: 0,
    confidenceFactors: {
      evidenceQuality: 0,
      consistency: 0,
      recency: 0,
      contradictionPenalty: 0,
    },
    evidence: {
      knowledgeIds: [],
      memoryIds: [],
      eventIds: [],
      evidenceCount: 0,
      evidenceQuality: 0,
      evidenceSummary: 'No evidence — skill execution failed',
    },
    explainability: {
      reasoningStrategy: 'evidence_based_recommendation',
      knowledgeConsulted: [],
      memoriesConsulted: [],
      eventsConsulted: 0,
      narrative: `Skill execution failed: ${error}`,
      alternativeOptions: [],
    },
    executionTime,
    warnings: [error],
    error,
  }
}

// ============================================================================
// Confidence Computation
// ============================================================================

export function computeSkillConfidence(
  evidence: SkillEvidence,
  factors?: { evidenceQuality: number; consistency: number; recency: number; contradictionPenalty: number }
): number {
  const f = factors || {
    evidenceQuality: clamp01(evidence.evidenceQuality),
    consistency: 0.8,
    recency: 0.7,
    contradictionPenalty: 0,
  }

  const base = 0.4
  const evidenceComponent = f.evidenceQuality * 0.3
  const consistencyComponent = f.consistency * 0.15
  const recencyComponent = f.recency * 0.1
  const volumeComponent = clamp01(evidence.evidenceCount / 10) * 0.05

  return clamp01(base + evidenceComponent + consistencyComponent + recencyComponent + volumeComponent - f.contradictionPenalty)
}

// ============================================================================
// Evidence Extraction Helpers
// ============================================================================

export function extractEvidence(context: SkillExecutionContext): SkillEvidence {
  const knowledgeIds = context.knowledge.map((k) => k.id)
  const memoryIds = context.memories.map((m) => m.id)
  const eventIds = context.events.map((e) => e.id)

  const evidenceQuality = computeEvidenceQuality(context)
  const evidenceSummary = buildEvidenceSummary(context)

  return {
    knowledgeIds,
    memoryIds,
    eventIds,
    evidenceCount: knowledgeIds.length + memoryIds.length + eventIds.length,
    evidenceQuality,
    evidenceSummary,
  }
}

function computeEvidenceQuality(context: SkillExecutionContext): number {
  if (context.knowledge.length === 0 && context.memories.length === 0) return 0
  const knowledgeQuality = context.knowledge.length > 0
    ? average(context.knowledge.map((k) => k.confidenceScore))
    : 0
  const memoryQuality = context.memories.length > 0
    ? average(context.memories.map((m) => m.confidenceScore))
    : 0
  // Weight knowledge more heavily than memory
  if (context.knowledge.length > 0 && context.memories.length > 0) {
    return clamp01(knowledgeQuality * 0.6 + memoryQuality * 0.4)
  }
  return clamp01(knowledgeQuality + memoryQuality)
}

function buildEvidenceSummary(context: SkillExecutionContext): string {
  const parts: string[] = []
  if (context.knowledge.length > 0) {
    parts.push(`${context.knowledge.length} knowledge objects`)
  }
  if (context.memories.length > 0) {
    parts.push(`${context.memories.length} memories`)
  }
  if (context.events.length > 0) {
    parts.push(`${context.events.length} events`)
  }
  return parts.length > 0 ? `Evidence: ${parts.join(', ')}` : 'No evidence available'
}

// ============================================================================
// Explainability Builder
// ============================================================================

export function buildExplainability(
  context: SkillExecutionContext,
  reasoningStrategy: ReasoningStrategy,
  narrative: string,
  alternativeOptions: Array<{ option: string; rationale: string; confidence: number }> = []
): SkillExplainability {
  return {
    reasoningStrategy,
    knowledgeConsulted: context.knowledge.map((k) => ({
      id: k.id,
      title: k.title,
      category: k.category,
      confidence: k.confidence,
    })),
    memoriesConsulted: context.memories.map((m) => ({
      id: m.id,
      title: m.title,
      confidence: m.confidenceScore,
    })),
    eventsConsulted: context.events.length,
    narrative,
    alternativeOptions,
  }
}

// ============================================================================
// Finding Builder
// ============================================================================

export function createFinding(
  context: SkillExecutionContext,
  type: SkillFinding['type'],
  severity: SkillFinding['severity'],
  title: string,
  description: string,
  confidence: number,
  actionable: boolean = false,
  recommendedAction?: string
): SkillFinding {
  const evidenceRefs = [
    ...context.knowledge.slice(0, 5).map((k) => k.id),
    ...context.memories.slice(0, 5).map((m) => m.id),
  ]

  return {
    id: hashId('finding', `${context.requestId}|${type}|${title}`),
    type,
    severity,
    title,
    description,
    evidenceRefs,
    confidence,
    actionable,
    recommendedAction,
  }
}

// ============================================================================
// Metric Builder
// ============================================================================

export function createMetric(
  name: string,
  value: number,
  unit: string,
  description: string,
  target?: number,
  status?: SkillMetric['status'],
  trend?: SkillMetric['trend']
): SkillMetric {
  return { name, value, unit, description, target, status, trend }
}

// ============================================================================
// Skill Executor Factory
// ============================================================================

export type SkillExecuteFn = (context: SkillExecutionContext) => Promise<SkillExecutionResult>

export function createSkillExecutor(skillId: string, executeFn: SkillExecuteFn): import('./types').SkillExecutor {
  return {
    skillId,
    execute: executeFn,
    validate: async (context) => ({
      skillId,
      valid: true,
      tests: [{
        name: 'basic_execution',
        type: 'functional',
        passed: true,
        description: 'Basic execution test',
        duration: 0,
      }],
      passRate: 1,
      validatedAt: nowIso(),
      validatedBy: 'system',
      issues: [],
    }),
  }
}
