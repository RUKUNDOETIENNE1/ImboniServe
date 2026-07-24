/**
 * Hospitality AI Copilot™ — Operational Expertise Engine (Phase 3).
 *
 * Implements dynamic expertise profile selection.
 *
 * Required expertise profiles (8):
 *   executive_advisor, kitchen_advisor, service_advisor, inventory_advisor,
 *   revenue_advisor, staff_performance_advisor, customer_experience_advisor,
 *   operational_excellence_advisor
 *
 * Profiles are reasoning personas — NOT separate AI models.
 * All profiles consume the same certified platform architecture.
 *
 * Selection is driven by:
 *   - User role
 *   - Operational domain
 *   - Intent
 *   - Question content
 *
 * The selector is deterministic and explainable.
 */

import type {
  CopilotRequest,
  ExpertiseSelection,
  UserRole,
} from './types'
import type {
  ExpertiseProfile,
  OperationalDomain,
  IntentType,
} from '../skill-registry/types'
import { clamp01, countKeywordMatches } from './utils'

// ============================================================================
// Expertise Profile Definitions
// ============================================================================

interface ExpertiseProfileDefinition {
  profile: ExpertiseProfile
  name: string
  description: string
  primaryDomains: OperationalDomain[]
  secondaryDomains: OperationalDomain[]
  primaryIntents: IntentType[]
  primaryRoles: UserRole[]
  keywords: string[]
  reasoningBias: string  // describes the persona's reasoning emphasis
}

const EXPERTISE_PROFILES: ExpertiseProfileDefinition[] = [
  {
    profile: 'executive_advisor',
    name: 'Executive Advisor',
    description: 'Strategic, business-wide perspective. Focuses on P&L, growth, and long-term performance.',
    primaryDomains: ['management', 'finance', 'revenue'],
    secondaryDomains: ['operations', 'staff', 'customers', 'marketing'],
    primaryIntents: ['operational_review', 'decision_support', 'planning', 'trend_analysis', 'comparison'],
    primaryRoles: ['owner', 'executive', 'general_manager', 'analyst'],
    keywords: ['strategy', 'business', 'overall', 'performance', 'growth', 'profit', 'kpi', 'objective', 'portfolio'],
    reasoningBias: 'Strategic trade-off analysis with emphasis on long-term value and risk',
  },
  {
    profile: 'kitchen_advisor',
    name: 'Kitchen Advisor',
    description: 'Kitchen operations expert. Focuses on ticket times, food cost, prep, and kitchen throughput.',
    primaryDomains: ['kitchen', 'inventory'],
    secondaryDomains: ['operations', 'suppliers'],
    primaryIntents: ['problem_diagnosis', 'optimization', 'root_cause_analysis', 'status_check'],
    primaryRoles: ['kitchen_manager', 'cook'],
    keywords: ['kitchen', 'ticket', 'cook', 'prep', 'food cost', 'waste', 'throughput', 'expo'],
    reasoningBias: 'Operational throughput and quality with emphasis on kitchen constraints',
  },
  {
    profile: 'service_advisor',
    name: 'Service Advisor',
    description: 'Front-of-house service expert. Focuses on service quality, guest experience, and floor flow.',
    primaryDomains: ['service', 'reservations'],
    secondaryDomains: ['customers', 'operations', 'staff'],
    primaryIntents: ['problem_diagnosis', 'optimization', 'status_check', 'recommendation_request'],
    primaryRoles: ['service_manager', 'floor_manager', 'server', 'host', 'bartender'],
    keywords: ['service', 'guest', 'table', 'floor', 'greeting', 'upsell', 'service time', 'turn time'],
    reasoningBias: 'Guest experience and service flow with emphasis on speed and warmth',
  },
  {
    profile: 'inventory_advisor',
    name: 'Inventory Advisor',
    description: 'Inventory and supply chain expert. Focuses on par levels, variance, and supplier performance.',
    primaryDomains: ['inventory', 'suppliers'],
    secondaryDomains: ['kitchen', 'finance', 'operations'],
    primaryIntents: ['optimization', 'planning', 'risk_assessment', 'problem_diagnosis'],
    primaryRoles: ['inventory_manager', 'general_manager'],
    keywords: ['inventory', 'stock', 'par', 'reorder', 'variance', 'supplier', 'shrinkage', 'spoilage'],
    reasoningBias: 'Supply continuity and cost control with emphasis on variance reduction',
  },
  {
    profile: 'revenue_advisor',
    name: 'Revenue Advisor',
    description: 'Revenue and sales performance expert. Focuses on average check, covers, and topline growth.',
    primaryDomains: ['revenue', 'finance'],
    secondaryDomains: ['marketing', 'customers', 'operations'],
    primaryIntents: ['optimization', 'trend_analysis', 'prediction_request', 'comparison'],
    primaryRoles: ['general_manager', 'owner', 'analyst', 'executive'],
    keywords: ['revenue', 'sales', 'average check', 'cover', 'upsell', 'promotion', 'pricing', 'splh'],
    reasoningBias: 'Topline growth with emphasis on pricing, mix, and conversion',
  },
  {
    profile: 'staff_performance_advisor',
    name: 'Staff Performance Advisor',
    description: 'Workforce performance expert. Focuses on scheduling, productivity, and retention.',
    primaryDomains: ['staff'],
    secondaryDomains: ['operations', 'service', 'kitchen'],
    primaryIntents: ['optimization', 'trend_analysis', 'planning', 'problem_diagnosis'],
    primaryRoles: ['general_manager', 'service_manager', 'kitchen_manager', 'shift_lead'],
    keywords: ['staff', 'schedule', 'labor', 'productivity', 'turnover', 'training', 'shift', 'roster'],
    reasoningBias: 'Workforce productivity and well-being with emphasis on sustainable scheduling',
  },
  {
    profile: 'customer_experience_advisor',
    name: 'Customer Experience Advisor',
    description: 'Customer intelligence expert. Focuses on satisfaction, loyalty, and feedback.',
    primaryDomains: ['customers', 'service'],
    secondaryDomains: ['marketing', 'reservations', 'revenue'],
    primaryIntents: ['trend_analysis', 'problem_diagnosis', 'recommendation_request', 'optimization'],
    primaryRoles: ['service_manager', 'general_manager', 'host'],
    keywords: ['customer', 'guest', 'loyalty', 'feedback', 'satisfaction', 'nps', 'complaint', 'review', 'retention'],
    reasoningBias: 'Customer lifetime value with emphasis on experience consistency',
  },
  {
    profile: 'operational_excellence_advisor',
    name: 'Operational Excellence Advisor',
    description: 'Process and efficiency expert. Focuses on workflows, bottlenecks, and standards.',
    primaryDomains: ['operations'],
    secondaryDomains: ['kitchen', 'service', 'inventory', 'staff'],
    primaryIntents: ['optimization', 'problem_diagnosis', 'root_cause_analysis', 'operational_review'],
    primaryRoles: ['general_manager', 'shift_lead', 'floor_manager', 'kitchen_manager'],
    keywords: ['workflow', 'process', 'efficiency', 'bottleneck', 'throughput', 'sop', 'checklist', 'standard'],
    reasoningBias: 'Process improvement with emphasis on bottleneck removal and standardization',
  },
]

// ============================================================================
// Operational Expertise Engine
// ============================================================================

const SELECTOR_VERSION = '1.0.0'

export class OperationalExpertiseEngine {
  /**
   * Select the most appropriate expertise profile for a request.
   *
   * Selection considers:
   *   - User role (strong signal)
   *   - Operational domain (strong signal)
   *   - Intent (moderate signal)
   *   - Question keywords (moderate signal)
   */
  select(
    request: CopilotRequest,
    domain: OperationalDomain,
    intent: IntentType
  ): ExpertiseSelection {
    const start = Date.now()

    const scores: Array<{ profile: ExpertiseProfile; score: number; reasons: string[] }> = []

    for (const def of EXPERTISE_PROFILES) {
      const evaluation = this.scoreProfile(request, def, domain, intent)
      scores.push(evaluation)
    }

    scores.sort((a, b) => b.score - a.score)

    const top = scores[0]
    const alternatives: Array<{ profile: ExpertiseProfile; confidence: number }> = []
    for (let i = 1; i < scores.length; i++) {
      if (scores[i].score > 0.2) {
        alternatives.push({ profile: scores[i].profile, confidence: clamp01(scores[i].score) })
      }
    }

    const profile = top ? top.profile : 'operational_excellence_advisor'
    const confidence = clamp01(top ? top.score : 0)
    const selectionReason = top ? top.reasons.join('; ') : 'default fallback'

    return {
      requestId: request.requestId,
      profile,
      confidence,
      alternativeProfiles: alternatives.slice(0, 3),
      selectionReason,
      selectionTime: Date.now() - start,
      selectorVersion: SELECTOR_VERSION,
    }
  }

  // --------------------------------------------------------------------------
  // Scoring
  // --------------------------------------------------------------------------

  private scoreProfile(
    request: CopilotRequest,
    def: ExpertiseProfileDefinition,
    domain: OperationalDomain,
    intent: IntentType
  ): { profile: ExpertiseProfile; score: number; reasons: string[] } {
    const reasons: string[] = []
    let score = 0

    // 1. User role match (strongest signal)
    if (request.userRole && def.primaryRoles.includes(request.userRole)) {
      score += 0.4
      reasons.push(`role match: ${request.userRole} (+0.4)`)
    }

    // 2. Primary domain match
    if (def.primaryDomains.includes(domain)) {
      score += 0.35
      reasons.push(`primary domain match: ${domain} (+0.35)`)
    } else if (def.secondaryDomains.includes(domain)) {
      score += 0.15
      reasons.push(`secondary domain match: ${domain} (+0.15)`)
    }

    // 3. Intent match
    if (def.primaryIntents.includes(intent)) {
      score += 0.2
      reasons.push(`intent match: ${intent} (+0.2)`)
    }

    // 4. Keyword match
    const keywordCount = countKeywordMatches(request.question, def.keywords)
    if (keywordCount > 0) {
      score += keywordCount * 0.05
      reasons.push(`keyword match: ${keywordCount} (+${(keywordCount * 0.05).toFixed(2)})`)
    }

    return {
      profile: def.profile,
      score: clamp01(score),
      reasons,
    }
  }

  // --------------------------------------------------------------------------
  // Introspection
  // --------------------------------------------------------------------------

  listProfiles(): ExpertiseProfile[] {
    return EXPERTISE_PROFILES.map((p) => p.profile)
  }

  describeProfile(profile: ExpertiseProfile): { name: string; description: string; reasoningBias: string } | null {
    const def = EXPERTISE_PROFILES.find((p) => p.profile === profile)
    return def ? { name: def.name, description: def.description, reasoningBias: def.reasoningBias } : null
  }

  getProfileDefinition(profile: ExpertiseProfile): ExpertiseProfileDefinition | null {
    return EXPERTISE_PROFILES.find((p) => p.profile === profile) || null
  }
}

// ============================================================================
// Singleton
// ============================================================================

let singleton: OperationalExpertiseEngine | null = null

export function getOperationalExpertiseEngine(): OperationalExpertiseEngine {
  if (!singleton) singleton = new OperationalExpertiseEngine()
  return singleton
}

export function resetOperationalExpertiseEngine(): void {
  singleton = null
}
