/**
 * Hospitality Knowledge™ Consumer Interfaces.
 *
 * Stable retrieval APIs for all platform consumers:
 * - Hospitality AI Copilot™ (reasoning & decision support)
 * - Daily Briefings (executive summaries)
 * - Service Intelligence (service quality optimization)
 * - Kitchen Intelligence (kitchen operations)
 * - Menu Intelligence (menu performance)
 * - Future Intelligence modules (extensible)
 *
 * Each consumer gets a curated view of knowledge filtered by:
 * - Relevance to consumer's domain
 * - Confidence level appropriate for consumer
 * - Status (only established/canonical/provisional for most consumers)
 * - Category mapping
 */

import type { KnowledgeEntity, KnowledgeConsumerRequest } from './types'
import { logConsumerAccess } from './governance-engine'

// ============================================================================
// Consumer Profiles
// ============================================================================

export interface ConsumerProfile {
  name: string
  description: string
  relevantCategories: string[]
  minConfidence: 'low' | 'medium' | 'high' | 'very_high' | 'certain'
  allowedStatuses: string[]
  maxResults: number
  purpose: string
}

export const CONSUMER_PROFILES: Record<string, ConsumerProfile> = {
  'hospitality-ai-copilot': {
    name: 'Hospitality AI Copilot',
    description: 'Reasoning and decision support — needs all established knowledge',
    relevantCategories: [
      'operational', 'customer', 'staff', 'menu', 'financial', 'business',
      'kitchen', 'service', 'inventory', 'supplier', 'environmental',
      'marketing', 'competitive', 'regulatory',
    ],
    minConfidence: 'medium',
    allowedStatuses: ['provisional', 'established', 'canonical'],
    maxResults: 100,
    purpose: 'Reasoning and decision support',
  },
  'daily-briefings': {
    name: 'Daily Briefings',
    description: 'Executive summaries — needs high-impact canonical knowledge',
    relevantCategories: [
      'operational', 'business', 'financial', 'staff', 'customer',
    ],
    minConfidence: 'high',
    allowedStatuses: ['established', 'canonical'],
    maxResults: 20,
    purpose: 'Executive briefing preparation',
  },
  'service-intelligence': {
    name: 'Service Intelligence',
    description: 'Service quality optimization — needs service/customer/staff knowledge',
    relevantCategories: ['service', 'customer', 'staff', 'operational'],
    minConfidence: 'medium',
    allowedStatuses: ['provisional', 'established', 'canonical'],
    maxResults: 30,
    purpose: 'Service quality optimization',
  },
  'kitchen-intelligence': {
    name: 'Kitchen Intelligence',
    description: 'Kitchen operations — needs kitchen/inventory/menu knowledge',
    relevantCategories: ['kitchen', 'inventory', 'menu', 'supplier', 'operational'],
    minConfidence: 'medium',
    allowedStatuses: ['provisional', 'established', 'canonical'],
    maxResults: 30,
    purpose: 'Kitchen operations optimization',
  },
  'menu-intelligence': {
    name: 'Menu Intelligence',
    description: 'Menu performance — needs menu/customer/financial knowledge',
    relevantCategories: ['menu', 'customer', 'financial', 'marketing'],
    minConfidence: 'medium',
    allowedStatuses: ['provisional', 'established', 'canonical'],
    maxResults: 30,
    purpose: 'Menu performance optimization',
  },
  'future-modules': {
    name: 'Future Intelligence Modules',
    description: 'Extensible interface for future platform modules',
    relevantCategories: [
      'operational', 'customer', 'staff', 'menu', 'financial', 'business',
      'kitchen', 'service', 'inventory', 'supplier', 'environmental',
      'marketing', 'competitive', 'regulatory',
    ],
    minConfidence: 'medium',
    allowedStatuses: ['provisional', 'established', 'canonical'],
    maxResults: 50,
    purpose: 'Future module integration',
  },
}

const CONFIDENCE_ORDER = {
  low: 1,
  medium: 2,
  high: 3,
  very_high: 4,
  certain: 5,
} as const

// ============================================================================
// Consumer Retrieval
// ============================================================================

/**
 * Retrieve knowledge for a specific consumer.
 * Logs access for audit trail.
 */
export function getKnowledgeForConsumer(
  allKnowledge: KnowledgeEntity[],
  consumer: KnowledgeConsumerRequest['consumer'],
  limit?: number
): KnowledgeEntity[] {
  const profile = CONSUMER_PROFILES[consumer]
  if (!profile) return []

  const filtered = allKnowledge
    .filter((k) => profile.allowedStatuses.includes(k.status))
    .filter((k) => CONFIDENCE_ORDER[k.confidence as keyof typeof CONFIDENCE_ORDER] >= CONFIDENCE_ORDER[profile.minConfidence])
    .filter((k) => profile.relevantCategories.includes(k.category))
    .sort((a, b) => {
      // Sort by confidence score descending, then by impact level
      if (b.confidenceScore !== a.confidenceScore) {
        return b.confidenceScore - a.confidenceScore
      }
      const impactOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return impactOrder[b.impactLevel] - impactOrder[a.impactLevel]
    })

  const maxResults = limit ?? profile.maxResults
  const result = filtered.slice(0, maxResults)

  // Log consumer access for audit (return copies with access logged)
  return result.map((k) =>
    logConsumerAccess(k, consumer, profile.purpose, 'used')
  )
}

/**
 * Get knowledge specifically formatted for Hospitality AI Copilot.
 * Returns the broadest view including disputed knowledge (for awareness).
 */
export function getKnowledgeForAICopilot(
  allKnowledge: KnowledgeEntity[]
): KnowledgeEntity[] {
  const profile = CONSUMER_PROFILES['hospitality-ai-copilot']
  return allKnowledge
    .filter((k) => [...profile.allowedStatuses, 'disputed'].includes(k.status))
    .filter((k) => CONFIDENCE_ORDER[k.confidence as keyof typeof CONFIDENCE_ORDER] >= CONFIDENCE_ORDER[profile.minConfidence])
    .sort((a, b) => b.confidenceScore - a.confidenceScore)
    .slice(0, profile.maxResults)
    .map((k) => logConsumerAccess(k, 'hospitality-ai-copilot', profile.purpose, 'used'))
}

/**
 * Get knowledge for Daily Briefings — only canonical, high-impact.
 */
export function getKnowledgeForDailyBriefings(
  allKnowledge: KnowledgeEntity[]
): KnowledgeEntity[] {
  return getKnowledgeForConsumer(allKnowledge, 'daily-briefings')
}

/**
 * Get knowledge for Service Intelligence.
 */
export function getKnowledgeForServiceIntelligence(
  allKnowledge: KnowledgeEntity[]
): KnowledgeEntity[] {
  return getKnowledgeForConsumer(allKnowledge, 'service-intelligence')
}

/**
 * Get knowledge for Kitchen Intelligence.
 */
export function getKnowledgeForKitchenIntelligence(
  allKnowledge: KnowledgeEntity[]
): KnowledgeEntity[] {
  return getKnowledgeForConsumer(allKnowledge, 'kitchen-intelligence')
}

/**
 * Get knowledge for Menu Intelligence.
 */
export function getKnowledgeForMenuIntelligence(
  allKnowledge: KnowledgeEntity[]
): KnowledgeEntity[] {
  return getKnowledgeForConsumer(allKnowledge, 'menu-intelligence')
}

// ============================================================================
// Knowledge Search
// ============================================================================

export interface KnowledgeSearchResultInternal {
  knowledge: KnowledgeEntity
  relevanceScore: number
  matchedFields: string[]
}

/**
 * Search knowledge by query string.
 */
export function searchKnowledge(
  allKnowledge: KnowledgeEntity[],
  query: string,
  filters?: {
    category?: string
    status?: string
    minConfidence?: string
  },
  limit: number = 25
): KnowledgeSearchResultInternal[] {
  const queryLower = query.toLowerCase()
  const queryTokens = queryLower.split(/\s+/).filter((t) => t.length > 2)

  let filtered = allKnowledge
  if (filters?.category) {
    filtered = filtered.filter((k) => k.category === filters.category)
  }
  if (filters?.status) {
    filtered = filtered.filter((k) => k.status === filters.status)
  }
  if (filters?.minConfidence) {
    const minOrder = CONFIDENCE_ORDER[filters.minConfidence as keyof typeof CONFIDENCE_ORDER]
    filtered = filtered.filter(
      (k) => CONFIDENCE_ORDER[k.confidence as keyof typeof CONFIDENCE_ORDER] >= minOrder
    )
  }

  const results: KnowledgeSearchResultInternal[] = []

  for (const knowledge of filtered) {
    const matchedFields: string[] = []
    let relevanceScore = 0

    // Title match (highest weight)
    if (knowledge.title.toLowerCase().includes(queryLower)) {
      matchedFields.push('title')
      relevanceScore += 0.4
    } else {
      const titleTokens = knowledge.title.toLowerCase().split(/\s+/)
      const titleOverlap = queryTokens.filter((t) => titleTokens.some((tt) => tt.includes(t))).length
      if (titleOverlap > 0) {
        matchedFields.push('title')
        relevanceScore += 0.3 * (titleOverlap / queryTokens.length)
      }
    }

    // Statement match
    if (knowledge.statement.toLowerCase().includes(queryLower)) {
      matchedFields.push('statement')
      relevanceScore += 0.3
    } else {
      const statementTokens = knowledge.statement.toLowerCase().split(/\s+/)
      const statementOverlap = queryTokens.filter((t) => statementTokens.some((st) => st.includes(t))).length
      if (statementOverlap > 0) {
        matchedFields.push('statement')
        relevanceScore += 0.2 * (statementOverlap / queryTokens.length)
      }
    }

    // Summary match
    if (knowledge.summary.toLowerCase().includes(queryLower)) {
      matchedFields.push('summary')
      relevanceScore += 0.2
    }

    // Description match
    if (knowledge.description.toLowerCase().includes(queryLower)) {
      matchedFields.push('description')
      relevanceScore += 0.15
    }

    // Tag match
    for (const tag of knowledge.tags) {
      if (tag.toLowerCase().includes(queryLower)) {
        matchedFields.push('tags')
        relevanceScore += 0.1
        break
      }
    }

    // Category match
    if (knowledge.category.toLowerCase().includes(queryLower)) {
      matchedFields.push('category')
      relevanceScore += 0.1
    }

    // Boost by confidence
    relevanceScore *= (0.5 + knowledge.confidenceScore * 0.5)

    if (relevanceScore > 0) {
      results.push({ knowledge, relevanceScore, matchedFields })
    }
  }

  return results.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, limit)
}

// ============================================================================
// Knowledge Summary for Consumers
// ============================================================================

export interface KnowledgeSummaryForConsumer {
  consumer: string
  totalKnowledge: number
  byCategory: Record<string, number>
  byConfidence: Record<string, number>
  topKnowledge: Array<{
    title: string
    statement: string
    confidence: string
    category: string
    status: string
  }>
  actionableInsights: string[]
}

/**
 * Generate a consumer-specific summary of available knowledge.
 */
export function summarizeForConsumer(
  allKnowledge: KnowledgeEntity[],
  consumer: KnowledgeConsumerRequest['consumer']
): KnowledgeSummaryForConsumer {
  const knowledge = getKnowledgeForConsumer(allKnowledge, consumer)
  const profile = CONSUMER_PROFILES[consumer]

  const byCategory: Record<string, number> = {}
  const byConfidence: Record<string, number> = {}
  for (const k of knowledge) {
    byCategory[k.category] = (byCategory[k.category] || 0) + 1
    byConfidence[k.confidence] = (byConfidence[k.confidence] || 0) + 1
  }

  const topKnowledge = knowledge.slice(0, 5).map((k) => ({
    title: k.title,
    statement: k.statement,
    confidence: k.confidence,
    category: k.category,
    status: k.status,
  }))

  const actionableInsights = knowledge
    .filter((k) => k.recommendedActions.length > 0)
    .slice(0, 10)
    .flatMap((k) => k.recommendedActions.map((a) => `[${k.category}] ${a.action}`))

  return {
    consumer: profile.name,
    totalKnowledge: knowledge.length,
    byCategory,
    byConfidence,
    topKnowledge,
    actionableInsights,
  }
}
