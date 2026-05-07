/**
 * Optimization Memory Service
 * Foundation layer for tracking recommendations, actions, and outcomes
 * Enables measurement and learning for autonomous optimization
 */

import { prisma } from '@/lib/prisma'

export type RecommendationSource = 'BUSINESS_SCANNER' | 'AI_INSIGHTS' | 'AUTOPILOT' | 'MANUAL'
export type RecommendationCategory = 'MENU' | 'PRICING' | 'INVENTORY' | 'MARKETING' | 'OPERATIONS'
export type RecommendationPriority = 'HIGH' | 'MEDIUM' | 'LOW'
export type RecommendationStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DISMISSED' | 'FAILED'
export type ActionType = 'MENU_UPDATE' | 'PRICE_CHANGE' | 'ITEM_HIDE' | 'ITEM_SHOW' | 'MANUAL'
export type MetricType = 'REVENUE' | 'ORDERS' | 'CONVERSION' | 'AOV' | 'CUSTOM'

export interface CreateRecommendationInput {
  businessId: string
  source: RecommendationSource
  category: RecommendationCategory
  title: string
  description: string
  priority?: RecommendationPriority
  estimatedImpact?: string
  effort?: 'LOW' | 'MEDIUM' | 'HIGH'
  metadata?: any
}

export interface RecordActionInput {
  recommendationId: string
  actionType: ActionType
  description: string
  beforeState?: any
  afterState?: any
  executedBy?: string
  isReversible?: boolean
  metadata?: any
}

export interface RecordOutcomeInput {
  recommendationId: string
  businessId: string
  metricType: MetricType
  metricName: string
  beforeValue?: number
  afterValue?: number
  measurementPeriod: '7_DAYS' | '14_DAYS' | '30_DAYS'
  metadata?: any
}

/**
 * Create a new optimization recommendation
 */
export async function createRecommendation(input: CreateRecommendationInput) {
  const recommendation = await prisma.optimizationRecommendation.create({
    data: {
      businessId: input.businessId,
      source: input.source,
      category: input.category,
      title: input.title,
      description: input.description,
      priority: input.priority || 'MEDIUM',
      estimatedImpact: input.estimatedImpact,
      effort: input.effort,
      metadata: input.metadata || {}
    }
  })

  return recommendation
}

/**
 * Get recommendations for a business
 */
export async function getRecommendations(
  businessId: string,
  filters?: {
    status?: RecommendationStatus
    source?: RecommendationSource
    category?: RecommendationCategory
    priority?: RecommendationPriority
    limit?: number
  }
) {
  const where: any = { businessId }

  if (filters?.status) where.status = filters.status
  if (filters?.source) where.source = filters.source
  if (filters?.category) where.category = filters.category
  if (filters?.priority) where.priority = filters.priority

  const recommendations = await prisma.optimizationRecommendation.findMany({
    where,
    include: {
      actions: {
        orderBy: { executedAt: 'desc' },
        take: 5
      },
      outcomes: {
        orderBy: { measuredAt: 'desc' },
        take: 3
      },
      _count: {
        select: {
          actions: true,
          outcomes: true
        }
      }
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'desc' }
    ],
    take: filters?.limit || 50
  })

  return recommendations
}

/**
 * Update recommendation status
 */
export async function updateRecommendationStatus(
  recommendationId: string,
  status: RecommendationStatus,
  completedBy?: string,
  dismissedReason?: string
) {
  const data: any = {
    status,
    updatedAt: new Date()
  }

  if (status === 'COMPLETED') {
    data.completedAt = new Date()
    data.completedBy = completedBy
  }

  if (status === 'DISMISSED' && dismissedReason) {
    data.dismissedReason = dismissedReason
  }

  const updated = await prisma.optimizationRecommendation.update({
    where: { id: recommendationId },
    data
  })

  return updated
}

/**
 * Record an action taken for a recommendation
 */
export async function recordAction(input: RecordActionInput) {
  const action = await prisma.optimizationAction.create({
    data: {
      recommendationId: input.recommendationId,
      actionType: input.actionType,
      description: input.description,
      beforeState: input.beforeState || {},
      afterState: input.afterState || {},
      executedBy: input.executedBy,
      isReversible: input.isReversible !== false,
      metadata: input.metadata || {}
    }
  })

  // Auto-update recommendation status to IN_PROGRESS if it was PENDING
  await prisma.optimizationRecommendation.updateMany({
    where: {
      id: input.recommendationId,
      status: 'PENDING'
    },
    data: {
      status: 'IN_PROGRESS'
    }
  })

  return action
}

/**
 * Reverse an action (if reversible)
 */
export async function reverseAction(actionId: string, reversedBy: string) {
  const action = await prisma.optimizationAction.findUnique({
    where: { id: actionId }
  })

  if (!action) {
    throw new Error('Action not found')
  }

  if (!action.isReversible) {
    throw new Error('Action is not reversible')
  }

  if (action.reversedAt) {
    throw new Error('Action already reversed')
  }

  const reversed = await prisma.optimizationAction.update({
    where: { id: actionId },
    data: {
      reversedAt: new Date(),
      reversedBy
    }
  })

  return reversed
}

/**
 * Record outcome measurement for a recommendation
 */
export async function recordOutcome(input: RecordOutcomeInput) {
  const changePercent = input.beforeValue && input.afterValue
    ? ((input.afterValue - input.beforeValue) / input.beforeValue) * 100
    : null

  const outcome = await prisma.optimizationOutcome.create({
    data: {
      recommendationId: input.recommendationId,
      businessId: input.businessId,
      metricType: input.metricType,
      metricName: input.metricName,
      beforeValue: input.beforeValue,
      afterValue: input.afterValue,
      changePercent,
      measurementPeriod: input.measurementPeriod,
      metadata: input.metadata || {}
    }
  })

  return outcome
}

/**
 * Get aggregated impact metrics for a business
 */
export async function getImpactMetrics(businessId: string, days: number = 30) {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const [completedCount, totalActions, avgImpact] = await Promise.all([
    // Count completed recommendations
    prisma.optimizationRecommendation.count({
      where: {
        businessId,
        status: 'COMPLETED',
        completedAt: { gte: since }
      }
    }),

    // Count total actions taken
    prisma.optimizationAction.count({
      where: {
        recommendation: { businessId },
        executedAt: { gte: since }
      }
    }),

    // Calculate average impact from outcomes
    prisma.optimizationOutcome.aggregate({
      where: {
        businessId,
        measuredAt: { gte: since },
        changePercent: { not: null }
      },
      _avg: {
        changePercent: true
      }
    })
  ])

  return {
    completedRecommendations: completedCount,
    totalActions,
    averageImpactPercent: avgImpact._avg.changePercent || 0,
    periodDays: days
  }
}

/**
 * Get top performing recommendations (by outcome)
 */
export async function getTopPerformers(businessId: string, limit: number = 5) {
  const recommendations = await prisma.optimizationRecommendation.findMany({
    where: {
      businessId,
      status: 'COMPLETED',
      outcomes: {
        some: {
          changePercent: { gt: 0 }
        }
      }
    },
    include: {
      outcomes: {
        orderBy: { changePercent: 'desc' },
        take: 1
      }
    },
    take: limit * 2 // Get more to filter
  })

  // Sort by best outcome
  const sorted = recommendations
    .filter(r => r.outcomes.length > 0)
    .sort((a, b) => {
      const aImpact = a.outcomes[0]?.changePercent || 0
      const bImpact = b.outcomes[0]?.changePercent || 0
      return bImpact - aImpact
    })
    .slice(0, limit)

  return sorted
}

/**
 * Batch create recommendations from AI sources
 */
export async function batchCreateFromAI(
  businessId: string,
  source: RecommendationSource,
  recommendations: Array<{
    category: RecommendationCategory
    title: string
    description: string
    priority?: RecommendationPriority
    estimatedImpact?: string
  }>
) {
  const created = await prisma.$transaction(
    recommendations.map(rec =>
      prisma.optimizationRecommendation.create({
        data: {
          businessId,
          source,
          category: rec.category,
          title: rec.title,
          description: rec.description,
          priority: rec.priority || 'MEDIUM',
          estimatedImpact: rec.estimatedImpact
        }
      })
    )
  )

  return created
}
