/**
 * Hospitality AI Copilot™ — Operational Skill Registry Integration (Phase 4).
 *
 * Integrates the certified Operational Skill Registry (57 skills, 8 categories)
 * into the Copilot's reasoning pipeline.
 *
 * The Copilot dynamically discovers and orchestrates validated operational
 * skills based on:
 *   - Intent
 *   - Operational Domain
 *   - Context
 *   - Available Evidence
 *
 * Supported orchestration strategies:
 *   - Sequential
 *   - Parallel
 *   - Pipeline
 *   - Fan-out / Fan-in
 *   - Multi-skill recommendations
 *
 * Architectural constraint:
 *   No expertise profile contains hard-coded operational logic that
 *   duplicates registered skills. The Copilot delegates analysis to skills.
 */

import type {
  CopilotRequest,
  OperationalContext,
  IntentClassification,
  DomainDetection,
  ExpertiseSelection,
} from './types'
import type {
  IntentType,
  OperationalDomain,
  ExpertiseProfile,
  ReasoningStrategy,
  SkillExecutionContext,
  SkillExecutionResult,
  SkillDiscoveryRequest,
  SkillDiscoveryResult,
  SkillOrchestrationPlan,
  SkillOrchestrationResult,
  OperationalSkill,
  SkillFinding,
  SkillMetric,
  SkillEvidence,
} from '../skill-registry/types'
import type { KnowledgeEntity } from '@/lib/hospitality-knowledge/types'
import type { HospitalityMemoryEntity } from '@/lib/hospitality-memory/types'
import type { OperationalEvent } from '@/lib/intelligence/types'

import {
  getSkillRegistry,
  getSkillDiscoveryEngine,
  getSkillOrchestrationEngine,
} from '../skill-registry/index'
import { initializeSkillRegistry, isSkillRegistryInitialized } from '../skill-registry/skill-registration'
import { clamp01 } from './utils'

// ============================================================================
// Skill Registry Integration
// ============================================================================

const INTEGRATION_VERSION = '1.0.0'

export class SkillRegistryIntegration {
  constructor(
    private registry = getSkillRegistry(),
    private discovery = getSkillDiscoveryEngine(),
    private orchestration = getSkillOrchestrationEngine()
  ) {}

  // --------------------------------------------------------------------------
  // Ensure the registry is initialized with all 57 skills
  // --------------------------------------------------------------------------

  ensureInitialized(): void {
    if (!isSkillRegistryInitialized()) {
      initializeSkillRegistry()
    }
  }

  // --------------------------------------------------------------------------
  // Discover skills relevant to a Copilot request
  // --------------------------------------------------------------------------

  discoverSkills(
    intent: IntentType,
    domain: OperationalDomain,
    profile: ExpertiseProfile,
    reasoningStrategy?: ReasoningStrategy,
    availableKnowledgeCategories?: string[]
  ): SkillDiscoveryResult {
    this.ensureInitialized()
    const request: SkillDiscoveryRequest = {
      intent,
      operationalDomain: domain,
      expertiseProfile: profile,
      reasoningStrategy,
      availableKnowledgeCategories,
    }
    return this.discovery.discover(request)
  }

  // --------------------------------------------------------------------------
  // Orchestrate skills for a Copilot request
  // --------------------------------------------------------------------------

  async orchestrateSkills(
    request: CopilotRequest,
    intent: IntentType,
    domain: OperationalDomain,
    profile: ExpertiseProfile,
    reasoningStrategy: ReasoningStrategy,
    context: OperationalContext,
    evidence: {
      knowledge: KnowledgeEntity[]
      memories: HospitalityMemoryEntity[]
      events: OperationalEvent[]
    },
    options: {
      maxSkills?: number
      combinationStrategy?: SkillOrchestrationPlan['combinationStrategy']
    } = {}
  ): Promise<SkillOrchestrationResult> {
    this.ensureInitialized()

    const skillContext = this.buildSkillContext(
      request,
      intent,
      domain,
      profile,
      reasoningStrategy,
      context,
      evidence
    )

    const discoveryRequest: SkillDiscoveryRequest = {
      intent,
      operationalDomain: domain,
      expertiseProfile: profile,
      reasoningStrategy,
      availableKnowledgeCategories: evidence.knowledge.map((k) => k.category),
    }

    const strategy = options.combinationStrategy || this.selectStrategy(intent, domain)
    const maxSkills = options.maxSkills ?? 5

    return this.orchestration.orchestrate(discoveryRequest, skillContext, {
      maxSkills,
      combinationStrategy: strategy,
    })
  }

  // --------------------------------------------------------------------------
  // Execute a single skill by ID (for targeted analysis)
  // --------------------------------------------------------------------------

  async executeSkill(
    skillId: string,
    request: CopilotRequest,
    intent: IntentType,
    domain: OperationalDomain,
    profile: ExpertiseProfile,
    reasoningStrategy: ReasoningStrategy,
    context: OperationalContext,
    evidence: {
      knowledge: KnowledgeEntity[]
      memories: HospitalityMemoryEntity[]
      events: OperationalEvent[]
    }
  ): Promise<SkillExecutionResult> {
    this.ensureInitialized()
    const executor = this.registry.getExecutor(skillId)
    const skillContext = this.buildSkillContext(
      request,
      intent,
      domain,
      profile,
      reasoningStrategy,
      context,
      evidence
    )

    if (!executor) {
      return {
        skillId,
        skillName: 'unknown',
        skillVersion: '0.0.0',
        success: false,
        outputs: {},
        findings: [],
        metrics: [],
        confidence: 0,
        confidenceFactors: { evidenceQuality: 0, consistency: 0, recency: 0, contradictionPenalty: 0 },
        evidence: {
          knowledgeIds: [], memoryIds: [], eventIds: [],
          evidenceCount: 0, evidenceQuality: 0, evidenceSummary: 'No executor found',
        },
        explainability: {
          reasoningStrategy,
          knowledgeConsulted: [], memoriesConsulted: [], eventsConsulted: 0,
          narrative: `No executor registered for skill ${skillId}`,
          alternativeOptions: [],
        },
        executionTime: 0,
        warnings: [`No executor for skill ${skillId}`],
        error: `No executor registered for skill ${skillId}`,
      }
    }

    return executor.execute(skillContext)
  }

  // --------------------------------------------------------------------------
  // Build a SkillExecutionContext from Copilot inputs
  // --------------------------------------------------------------------------

  buildSkillContext(
    request: CopilotRequest,
    intent: IntentType,
    domain: OperationalDomain,
    profile: ExpertiseProfile,
    reasoningStrategy: ReasoningStrategy,
    context: OperationalContext,
    evidence: {
      knowledge: KnowledgeEntity[]
      memories: HospitalityMemoryEntity[]
      events: OperationalEvent[]
    }
  ): SkillExecutionContext {
    return {
      businessId: request.businessId,
      businessName: request.businessName || context.businessName,
      timeRange: context.timeRange,
      outletId: request.outletId || context.outletId,
      expertiseProfile: profile,
      intent,
      operationalDomain: domain,
      reasoningStrategy,
      knowledge: evidence.knowledge,
      memories: evidence.memories,
      events: evidence.events,
      inputs: {
        question: request.question,
        userRole: request.userRole,
        shift: context.shift,
        asOf: context.asOf,
        includeAlternatives: request.includeAlternatives ?? true,
      },
      requestId: request.requestId,
      userId: request.userId,
    }
  }

  // --------------------------------------------------------------------------
  // Strategy selection
  // --------------------------------------------------------------------------

  selectStrategy(
    intent: IntentType,
    domain: OperationalDomain
  ): SkillOrchestrationPlan['combinationStrategy'] {
    // Cross-domain or multi-faceted intents benefit from fan-out/fan-in
    if (domain === 'cross_domain') return 'fan_out_fan_in'
    if (intent === 'operational_review' || intent === 'decision_support') return 'fan_out_fan_in'
    // Sequential reasoning for diagnostic flows
    if (intent === 'root_cause_analysis' || intent === 'problem_diagnosis') return 'sequential'
    // Pipeline for optimization (analyze → recommend)
    if (intent === 'optimization' || intent === 'recommendation_request') return 'pipeline'
    // Parallel for status checks and comparisons
    if (intent === 'status_check' || intent === 'comparison') return 'parallel'
    return 'sequential'
  }

  // --------------------------------------------------------------------------
  // Aggregate skill results into combined findings/metrics
  // --------------------------------------------------------------------------

  aggregateSkillResults(
    results: SkillExecutionResult[]
  ): {
    findings: SkillFinding[]
    metrics: SkillMetric[]
    evidence: SkillEvidence
    overallConfidence: number
    skillsUsed: Array<{ skillId: string; skillName: string; relevance: number }>
  } {
    const findings: SkillFinding[] = []
    const metrics: SkillMetric[] = []
    const knowledgeIds = new Set<string>()
    const memoryIds = new Set<string>()
    const eventIds = new Set<string>()
    let totalEvidenceQuality = 0
    const skillsUsed: Array<{ skillId: string; skillName: string; relevance: number }> = []
    const confidences: number[] = []

    for (const result of results) {
      if (result.success) {
        findings.push(...result.findings)
        metrics.push(...result.metrics)
        result.evidence.knowledgeIds.forEach((id) => knowledgeIds.add(id))
        result.evidence.memoryIds.forEach((id) => memoryIds.add(id))
        result.evidence.eventIds.forEach((id) => eventIds.add(id))
        totalEvidenceQuality += result.evidence.evidenceQuality
        confidences.push(result.confidence)
        skillsUsed.push({
          skillId: result.skillId,
          skillName: result.skillName,
          relevance: clamp01(result.confidence),
        })
      }
    }

    const evidenceCount = knowledgeIds.size + memoryIds.size + eventIds.size
    const overallConfidence = confidences.length > 0 ? clamp01(confidences.reduce((s, v) => s + v, 0) / confidences.length) : 0

    return {
      findings,
      metrics,
      evidence: {
        knowledgeIds: Array.from(knowledgeIds),
        memoryIds: Array.from(memoryIds),
        eventIds: Array.from(eventIds),
        evidenceCount,
        evidenceQuality: results.length > 0 ? clamp01(totalEvidenceQuality / results.length) : 0,
        evidenceSummary: `${evidenceCount} evidence items from ${results.filter((r) => r.success).length} skills`,
      },
      overallConfidence,
      skillsUsed,
    }
  }

  // --------------------------------------------------------------------------
  // Introspection
  // --------------------------------------------------------------------------

  getCatalogStats(): { totalSkills: number; byCategory: Record<string, number> } {
    this.ensureInitialized()
    const catalog = this.registry.getCatalog()
    return {
      totalSkills: catalog.totalSkills,
      byCategory: catalog.skillsByCategory,
    }
  }

  listAllSkills(): OperationalSkill[] {
    this.ensureInitialized()
    return this.registry.getAllSkills()
  }

  listSkillsForProfile(profile: ExpertiseProfile): OperationalSkill[] {
    this.ensureInitialized()
    return this.registry.getAllSkills().filter((s) => s.supportedExpertiseProfiles.includes(profile))
  }

  listSkillsForDomain(domain: OperationalDomain): OperationalSkill[] {
    this.ensureInitialized()
    return this.registry.getAllSkills().filter((s) => s.supportedDomains.includes(domain))
  }

  listSkillsForIntent(intent: IntentType): OperationalSkill[] {
    this.ensureInitialized()
    return this.registry.getAllSkills().filter((s) => s.supportedIntents.includes(intent))
  }

  getIntegrationVersion(): string {
    return INTEGRATION_VERSION
  }
}

// ============================================================================
// Singleton
// ============================================================================

let singleton: SkillRegistryIntegration | null = null

export function getSkillRegistryIntegration(): SkillRegistryIntegration {
  if (!singleton) singleton = new SkillRegistryIntegration()
  return singleton
}

export function resetSkillRegistryIntegration(): void {
  singleton = null
}
