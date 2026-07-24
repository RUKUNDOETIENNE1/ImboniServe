/**
 * Hospitality AI Copilot™ — Context Engine (Phase 5).
 *
 * Builds a complete operational context before reasoning.
 *
 * Context includes, where available:
 *   - Current operational state
 *   - User role
 *   - Shift
 *   - Location
 *   - Department
 *   - Time context
 *   - Business objectives
 *   - Relevant historical context
 *   - Active alerts
 *   - Current workflows
 *
 * Context construction is deterministic and explainable.
 * A determinism proof (hash of inputs) is attached to every context.
 */

import type {
  CopilotRequest,
  OperationalContext,
  UserRole,
  ShiftType,
  ActiveAlert,
  ActiveWorkflow,
  HistoricalContextSummary,
} from './types'
import type { OperationalDomain } from '../skill-registry/types'
import type { KnowledgeEntity } from '@/lib/hospitality-knowledge/types'
import type { HospitalityMemoryEntity } from '@/lib/hospitality-memory/types'
import {
  dayOfWeek,
  timeOfDay,
  season,
  shiftFromHour,
  determinismProof,
  clamp01,
} from './utils'

// ============================================================================
// Context Engine
// ============================================================================

const CONTEXT_VERSION = '1.0.0'

export class ContextEngine {
  /**
   * Construct a complete operational context from a Copilot request.
   *
   * The context engine fills gaps deterministically:
   *   - Missing shift is inferred from current hour
   *   - Missing time range defaults to "today"
   *   - Missing user role defaults to 'unknown'
   *
   * Historical context is summarized from supplied knowledge/memory (the
   * Knowledge Retrieval Engine supplies these in the full pipeline).
   */
  buildContext(
    request: CopilotRequest,
    options: {
      historicalKnowledge?: KnowledgeEntity[]
      historicalMemories?: HospitalityMemoryEntity[]
      domain?: OperationalDomain
    } = {}
  ): OperationalContext {
    const start = Date.now()
    const asOf = request.asOf || new Date().toISOString()

    const userRole: UserRole = request.userRole || 'unknown'
    const shift: ShiftType = request.shift || shiftFromHour(asOf)
    const dow = dayOfWeek(asOf)
    const tod = timeOfDay(asOf)
    const currentSeason = season(asOf)

    // Default time range: today
    const timeRange = request.timeRange || this.defaultTimeRange(asOf)

    // Business signals
    const businessObjectives = request.businessObjectives || this.defaultBusinessObjectives(userRole)
    const activeAlerts: ActiveAlert[] = request.activeAlerts || []
    const activeWorkflows: ActiveWorkflow[] = request.activeWorkflows || []

    // Relevant historical context (deterministic summary)
    const relevantHistoricalContext = this.summarizeHistoricalContext(
      options.historicalKnowledge || [],
      options.historicalMemories || [],
      options.domain
    )

    // Determinism proof — hash of all inputs that produced this context
    const proofInputs = {
      businessId: request.businessId,
      question: request.question,
      userRole,
      shift,
      outletId: request.outletId,
      asOf,
      timeRange,
      businessObjectives,
      activeAlerts: activeAlerts.map((a) => a.id),
      activeWorkflows: activeWorkflows.map((w) => w.id),
      historicalCount: relevantHistoricalContext.length,
    }
    const proof = determinismProof(proofInputs)

    return {
      requestId: request.requestId,
      businessId: request.businessId,
      businessName: request.businessName || request.businessId,
      userId: request.userId,
      userRole,
      userDepartment: request.userDepartment,
      shift,
      outletId: request.outletId,
      location: request.location,
      asOf,
      timeRange,
      dayOfWeek: dow,
      timeOfDay: tod,
      season: currentSeason,
      businessObjectives,
      activeAlerts,
      activeWorkflows,
      relevantHistoricalContext,
      constructionTime: Date.now() - start,
      contextVersion: CONTEXT_VERSION,
      determinismProof: proof,
    }
  }

  // --------------------------------------------------------------------------
  // Default time range: today (00:00 → 23:59:59 local)
  // --------------------------------------------------------------------------

  private defaultTimeRange(asOf: string): { start: string; end: string; label: string } {
    const now = new Date(asOf)
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    const end = new Date(now)
    end.setHours(23, 59, 59, 999)
    return {
      start: start.toISOString(),
      end: end.toISOString(),
      label: 'Today',
    }
  }

  // --------------------------------------------------------------------------
  // Default business objectives by role
  // --------------------------------------------------------------------------

  private defaultBusinessObjectives(role: UserRole): string[] {
    const base = ['maintain_service_quality', 'control_costs']
    switch (role) {
      case 'owner':
      case 'executive':
        return [...base, 'grow_revenue', 'improve_profitability', 'strategic_growth']
      case 'general_manager':
        return [...base, 'optimize_operations', 'grow_revenue', 'staff_development']
      case 'kitchen_manager':
        return [...base, 'kitchen_efficiency', 'food_cost_control', 'ticket_time_targets']
      case 'service_manager':
      case 'floor_manager':
        return [...base, 'guest_satisfaction', 'service_speed', 'upsell_growth']
      case 'inventory_manager':
        return [...base, 'inventory_accuracy', 'supplier_reliability', 'waste_reduction']
      case 'shift_lead':
        return [...base, 'shift_targets', 'team_coordination']
      default:
        return base
    }
  }

  // --------------------------------------------------------------------------
  // Summarize historical context deterministically
  // --------------------------------------------------------------------------

  private summarizeHistoricalContext(
    knowledge: KnowledgeEntity[],
    memories: HospitalityMemoryEntity[],
    domain?: OperationalDomain
  ): HistoricalContextSummary[] {
    const summaries: HistoricalContextSummary[] = []

    // Take top-N knowledge by confidence, optionally filtered by domain
    const filteredKnowledge = domain
      ? knowledge.filter((k) => this.knowledgeMatchesDomain(k, domain))
      : knowledge

    const sortedKnowledge = [...filteredKnowledge]
      .sort((a, b) => b.confidenceScore - a.confidenceScore)
      .slice(0, 5)

    for (const k of sortedKnowledge) {
      summaries.push({
        source: 'knowledge',
        sourceId: k.id,
        title: k.title,
        relevance: clamp01(k.confidenceScore),
        summary: k.summary,
      })
    }

    // Take top-N memories by confidence
    const sortedMemories = [...memories]
      .sort((a, b) => b.confidenceScore - a.confidenceScore)
      .slice(0, 5)

    for (const m of sortedMemories) {
      summaries.push({
        source: 'memory',
        sourceId: m.id,
        title: m.title,
        relevance: clamp01(m.confidenceScore),
        summary: m.description,
      })
    }

    return summaries
  }

  private knowledgeMatchesDomain(k: KnowledgeEntity, domain: OperationalDomain): boolean {
    // Map knowledge categories to operational domains
    const categoryToDomain: Record<string, OperationalDomain[]> = {
      operational: ['operations'],
      customer: ['customers', 'service'],
      staff: ['staff'],
      menu: ['kitchen', 'revenue'],
      financial: ['finance', 'revenue'],
      business: ['management'],
      kitchen: ['kitchen'],
      service: ['service'],
      inventory: ['inventory'],
      supplier: ['suppliers'],
      environmental: ['operations'],
      marketing: ['marketing'],
      competitive: ['management', 'marketing'],
      regulatory: ['management'],
    }
    const domains = categoryToDomain[k.category] || []
    return domains.includes(domain) || domain === 'cross_domain'
  }

  // --------------------------------------------------------------------------
  // Introspection
  // --------------------------------------------------------------------------

  getContextVersion(): string {
    return CONTEXT_VERSION
  }
}

// ============================================================================
// Singleton
// ============================================================================

let singleton: ContextEngine | null = null

export function getContextEngine(): ContextEngine {
  if (!singleton) singleton = new ContextEngine()
  return singleton
}

export function resetContextEngine(): void {
  singleton = null
}
