/**
 * Hospitality AI Copilot™ — Operational Domain Engine (Phase 2).
 *
 * Determines which operational domain(s) a question belongs to.
 *
 * Supported domains (13):
 *   kitchen, service, reservations, inventory, finance, revenue,
 *   customers, staff, management, marketing, suppliers, operations,
 *   cross_domain
 *
 * Supports multi-domain reasoning where appropriate.
 *
 * The detector is deterministic and explainable. It does not use an LLM.
 */

import type { CopilotRequest, DomainDetection } from './types'
import type { OperationalDomain, IntentType } from '../skill-registry/types'
import {
  tokenize,
  countKeywordMatches,
  clamp01,
} from './utils'

// ============================================================================
// Domain Signal Matrix
// ============================================================================

interface DomainSignal {
  domain: OperationalDomain
  keywords: string[]
  weight: number
  description: string
}

const DOMAIN_SIGNALS: DomainSignal[] = [
  {
    domain: 'kitchen',
    keywords: [
      'kitchen', 'cook', 'cooking', 'chef', 'ticket', 'prep', 'station',
      'line', 'pass', 'fire', 'order fire', 'expo', 'grill', 'fryer',
      'oven', 'dish', 'recipe', 'cook time', 'prep time', 'food cost',
      'waste', 'kitchen display', 'kds', 'burner', 'sauté', 'plating',
    ],
    weight: 1.0,
    description: 'Kitchen operations and food preparation',
  },
  {
    domain: 'service',
    keywords: [
      'service', 'server', 'waiter', 'waitress', 'floor', 'table', 'guest',
      'host', 'hostess', 'greeting', 'seating', 'order taking', 'upsell',
      'checkback', 'bussing', 'tip', 'service quality', 'service time',
      'turn time', 'dwell time', 'greeting time',
    ],
    weight: 1.0,
    description: 'Front-of-house service operations',
  },
  {
    domain: 'reservations',
    keywords: [
      'reservation', 'booking', 'reserve', 'walk-in', 'waitlist', 'no-show',
      'party size', 'cover', 'covers', 'booked', 'occupancy', 'slot',
      'availability', 'cancel', 'confirmation',
    ],
    weight: 1.0,
    description: 'Reservation and seating management',
  },
  {
    domain: 'inventory',
    keywords: [
      'inventory', 'stock', 'par level', 'reorder', 'supply', 'ingredient',
      'count', 'variance', 'shrinkage', 'fifo', 'spoilage', 'stockout',
      'on hand', 'inventory count', 'stock take', 'wac', 'valuation',
    ],
    weight: 1.0,
    description: 'Inventory and stock management',
  },
  {
    domain: 'finance',
    keywords: [
      'finance', 'cost', 'expense', 'budget', 'p&l', 'profit', 'loss',
      'margin', 'overhead', 'labor cost', 'rent', 'utility', 'capex',
      'opex', 'cash flow', 'ebitda', 'break-even', 'fixed cost', 'variable cost',
    ],
    weight: 1.0,
    description: 'Financial performance and cost management',
  },
  {
    domain: 'revenue',
    keywords: [
      'revenue', 'sales', 'income', 'topline', 'average check', 'check average',
      'cover count', 'sales per labor hour', 'splh', 'upsell', 'promotion',
      'discount', 'pricing', 'menu price', 'happy hour', 'bundle',
    ],
    weight: 1.0,
    description: 'Revenue generation and sales performance',
  },
  {
    domain: 'customers',
    keywords: [
      'customer', 'guest', 'loyalty', 'repeat', 'vip', 'regular', 'feedback',
      'review', 'satisfaction', 'nps', 'csat', 'complaint', 'compliment',
      'preference', 'allergy', 'anniversary', 'birthday', 'retention',
    ],
    weight: 1.0,
    description: 'Customer intelligence and experience',
  },
  {
    domain: 'staff',
    keywords: [
      'staff', 'employee', 'team', 'schedule', 'scheduling', 'shift',
      'labor', 'roster', 'training', 'performance', 'turnover', 'retention',
      'absenteeism', 'productivity', 'punctuality', 'overtime', 'tip pool',
    ],
    weight: 1.0,
    description: 'Staff performance and workforce management',
  },
  {
    domain: 'management',
    keywords: [
      'management', 'manager', 'strategy', 'goal', 'kpi', 'okr', 'objective',
      'priority', 'decision', 'report', 'dashboard', 'overview', 'executive',
      'owner', 'business plan', 'performance review',
    ],
    weight: 1.0,
    description: 'Strategic management and oversight',
  },
  {
    domain: 'marketing',
    keywords: [
      'marketing', 'campaign', 'promotion', 'social media', 'advertising',
      'email', 'newsletter', 'instagram', 'facebook', 'influencer',
      'brand', 'reach', 'engagement', 'follower', 'conversion',
    ],
    weight: 1.0,
    description: 'Marketing and customer acquisition',
  },
  {
    domain: 'suppliers',
    keywords: [
      'supplier', 'vendor', 'delivery', 'lead time', 'purchase order',
      'po', 'reorder point', 'cost per unit', 'quality issue', 'substitute',
      'sourcing', 'procurement', 'invoice', 'receiving',
    ],
    weight: 1.0,
    description: 'Supplier and procurement management',
  },
  {
    domain: 'operations',
    keywords: [
      'operations', 'operational', 'workflow', 'process', 'procedure',
      'efficiency', 'bottleneck', 'throughput', 'capacity', 'standard',
      'sop', 'checklist', 'opening', 'closing', 'handover',
    ],
    weight: 1.0,
    description: 'Day-to-day operational execution',
  },
]

// ============================================================================
// Intent → Domain affinity map (boosts domain scores based on intent)
// ============================================================================

const INTENT_DOMAIN_AFFINITY: Partial<Record<IntentType, OperationalDomain[]>> = {
  status_check: ['operations', 'kitchen', 'service'],
  operational_review: ['operations', 'management', 'finance'],
  trend_analysis: ['revenue', 'finance', 'operations'],
  problem_diagnosis: ['operations', 'kitchen', 'service'],
  root_cause_analysis: ['operations', 'kitchen', 'service'],
  risk_assessment: ['finance', 'inventory', 'operations'],
  optimization: ['operations', 'kitchen', 'service', 'inventory'],
  recommendation_request: ['operations', 'management', 'kitchen'],
  planning: ['operations', 'staff', 'inventory'],
  prediction_request: ['revenue', 'operations', 'inventory'],
  comparison: ['revenue', 'finance', 'operations'],
  decision_support: ['management', 'finance', 'operations'],
  information_request: ['operations'],
  explanation: ['operations'],
  learning_training: ['operations', 'staff'],
  unknown_intent: [],
}

// ============================================================================
// Operational Domain Engine
// ============================================================================

const DETECTOR_VERSION = '1.0.0'

export class OperationalDomainEngine {
  /**
   * Detect the operational domain(s) of a Copilot request.
   *
   * Returns the primary domain plus secondary domains when multi-domain
   * reasoning is appropriate. Falls back to `operations` if no signal fires.
   */
  detect(
    request: CopilotRequest,
    intent: IntentType,
    contextHints?: { userDepartment?: string; activeAlertsDomain?: OperationalDomain[] }
  ): DomainDetection {
    const start = Date.now()
    const question = request.question
    const tokens = tokenize(question)

    const scores: Array<{ domain: OperationalDomain; score: number; signals: string[] }> = []

    for (const signal of DOMAIN_SIGNALS) {
      const evaluation = this.scoreDomain(question, tokens, signal)
      scores.push(evaluation)
    }

    // Apply intent affinity boost
    const affinityDomains = INTENT_DOMAIN_AFFINITY[intent] || []
    for (const entry of scores) {
      if (affinityDomains.includes(entry.domain)) {
        entry.score = clamp01(entry.score + 0.15)
        entry.signals.push('intent affinity boost: +0.15')
      }
    }

    // Apply context hints
    if (contextHints?.userDepartment) {
      const deptDomain = this.mapDepartmentToDomain(contextHints.userDepartment)
      if (deptDomain) {
        const entry = scores.find((s) => s.domain === deptDomain)
        if (entry) {
          entry.score = clamp01(entry.score + 0.1)
          entry.signals.push('user department hint: +0.1')
        }
      }
    }

    if (contextHints?.activeAlertsDomain && contextHints.activeAlertsDomain.length > 0) {
      for (const alertDomain of contextHints.activeAlertsDomain) {
        const entry = scores.find((s) => s.domain === alertDomain)
        if (entry) {
          entry.score = clamp01(entry.score + 0.1)
          entry.signals.push('active alert hint: +0.1')
        }
      }
    }

    // Sort descending
    scores.sort((a, b) => b.score - a.score)

    const top = scores[0]
    const secondary: Array<{ domain: OperationalDomain; relevance: number }> = []
    const matchedSignals: string[] = []

    if (top && top.score > 0.1) {
      matchedSignals.push(...top.signals)
      for (let i = 1; i < scores.length; i++) {
        if (scores[i].score > 0.15) {
          secondary.push({ domain: scores[i].domain, relevance: clamp01(scores[i].score) })
        }
      }
    }

    const primaryDomain: OperationalDomain = top && top.score > 0.1 ? top.domain : 'operations'
    const isCrossDomain = secondary.length >= 2 || (secondary.length >= 1 && secondary[0].relevance >= 0.5)

    return {
      requestId: request.requestId,
      primaryDomain,
      secondaryDomains: secondary.slice(0, 4),
      isCrossDomain,
      matchedSignals,
      detectionTime: Date.now() - start,
      detectorVersion: DETECTOR_VERSION,
    }
  }

  // --------------------------------------------------------------------------
  // Scoring
  // --------------------------------------------------------------------------

  private scoreDomain(
    question: string,
    tokens: string[],
    signal: DomainSignal
  ): { domain: OperationalDomain; score: number; signals: string[] } {
    const signals: string[] = []
    let score = 0

    const keywordCount = countKeywordMatches(question, signal.keywords)
    if (keywordCount > 0) {
      score += keywordCount * 0.25 * signal.weight
      signals.push(`keywords: ${keywordCount} match(es)`)
    }

    // Token overlap (subtle signal)
    const tokenOverlap = tokens.filter((t) =>
      signal.keywords.some((k) => k.replace(/\s+/g, '').includes(t))
    ).length
    if (tokenOverlap > 0 && keywordCount === 0) {
      score += tokenOverlap * 0.05 * signal.weight
      signals.push(`token overlap: ${tokenOverlap}`)
    }

    return {
      domain: signal.domain,
      score: clamp01(score),
      signals,
    }
  }

  private mapDepartmentToDomain(department: string): OperationalDomain | null {
    const lower = department.toLowerCase()
    if (lower.includes('kitchen')) return 'kitchen'
    if (lower.includes('service') || lower.includes('floor')) return 'service'
    if (lower.includes('inventory') || lower.includes('stock')) return 'inventory'
    if (lower.includes('finance') || lower.includes('accounting')) return 'finance'
    if (lower.includes('marketing')) return 'marketing'
    if (lower.includes('hr') || lower.includes('staff')) return 'staff'
    if (lower.includes('manage')) return 'management'
    if (lower.includes('reservation')) return 'reservations'
    if (lower.includes('supplier') || lower.includes('procure')) return 'suppliers'
    if (lower.includes('revenue') || lower.includes('sales')) return 'revenue'
    return null
  }

  // --------------------------------------------------------------------------
  // Introspection
  // --------------------------------------------------------------------------

  listSupportedDomains(): OperationalDomain[] {
    return [...DOMAIN_SIGNALS.map((s) => s.domain), 'cross_domain']
  }

  describeDomain(domain: OperationalDomain): string | null {
    const signal = DOMAIN_SIGNALS.find((s) => s.domain === domain)
    return signal ? signal.description : null
  }
}

// ============================================================================
// Singleton
// ============================================================================

let singleton: OperationalDomainEngine | null = null

export function getOperationalDomainEngine(): OperationalDomainEngine {
  if (!singleton) singleton = new OperationalDomainEngine()
  return singleton
}

export function resetOperationalDomainEngine(): void {
  singleton = null
}
