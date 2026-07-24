/**
 * Intelligence Platform Integration Helper
 * 
 * Shared utilities for intelligence consumers to integrate with HIE, IKB, and database.
 * Handles caching, event retrieval, and report generation.
 */

import { prisma } from '@/lib/prisma'
import { createIntelligenceEngineV2, createKnowledgeBase, createPipeline } from '@/lib/intelligence'
import type {
  IntelligenceContext,
  OperationalEvent,
  StructuredIntelligenceReport,
  PipelineContext,
} from '@/lib/intelligence'

export interface ReportCacheOptions {
  businessId: string
  type: string
  timeRange: {
    start: string
    end: string
  }
  forceRegenerate?: boolean
}

export interface EventRetrievalOptions {
  businessId: string
  timeRange: {
    start: string
    end: string
  }
  eventTypes?: string[]
}

/**
 * Retrieve or generate an intelligence report.
 * 
 * 1. Check cache (IntelligenceReport table)
 * 2. If not cached or forceRegenerate, generate new report
 * 3. Cache the report
 * 4. Ingest into IKB
 * 5. Return report
 */
export async function getOrGenerateReport(
  options: ReportCacheOptions,
  context: PipelineContext,
  events: OperationalEvent[]
): Promise<StructuredIntelligenceReport | null> {
  try {
    // Step 1: Check cache (unless force regenerate)
    if (!options.forceRegenerate) {
      const cached = await getCachedReport(options)
      if (cached) {
        return cached
      }
    }

    // Step 2: Generate new report using Intelligence Pipeline
    const pipelineBuilder = createPipeline()
    const pipeline = pipelineBuilder.build()
    const result = await pipeline.execute(events, context)

    if (!result.success || !result.report) {
      console.error('Failed to generate intelligence report:', result.error)
      return null
    }

    const report = result.report

    // Step 3: Cache the report
    await cacheReport(options, report)

    // Step 4: Ingest into IKB
    const ikb = createKnowledgeBase()
    await ikb.ingest(report)

    return report
  } catch (error) {
    console.error('Error in getOrGenerateReport:', error)
    return null
  }
}

/**
 * Get cached report from database
 */
export async function getCachedReport(
  options: ReportCacheOptions
): Promise<StructuredIntelligenceReport | null> {
  try {
    const report = await prisma.intelligenceReport.findFirst({
      where: {
        businessId: options.businessId,
        type: options.type,
        reportingPeriod: {
          path: ['start'],
          gte: options.timeRange.start,
        },
      },
      orderBy: {
        generatedAt: 'desc',
      },
    })

    if (!report) return null

    return report.data as StructuredIntelligenceReport
  } catch (error) {
    console.error('Error retrieving cached report:', error)
    return null
  }
}

/**
 * Cache report in database
 */
export async function cacheReport(
  options: ReportCacheOptions,
  report: StructuredIntelligenceReport
): Promise<void> {
  try {
    await prisma.intelligenceReport.create({
      data: {
        id: report.metadata?.id ?? `report_${Date.now()}`,
        businessId: options.businessId,
        type: options.type,
        reportingPeriod: {
          start: options.timeRange.start,
          end: options.timeRange.end,
        },
        data: report as any,
        confidence: report.confidenceMetrics?.overall ?? 0,
        evidenceCount: report.evidenceRegistry ? Object.keys(report.evidenceRegistry).length : 0,
        generatedAt: report.metadata?.generatedAt ? new Date(report.metadata.generatedAt) : new Date(),
      },
    })
  } catch (error) {
    // Ignore duplicate errors (report already cached)
    if (error instanceof Error && !error.message.includes('Unique constraint')) {
      console.error('Error caching report:', error)
    }
  }
}

/**
 * Retrieve operational events from ReplayEvent table
 */
export async function getOperationalEvents(
  options: EventRetrievalOptions
): Promise<OperationalEvent[]> {
  try {
    const events = await prisma.replayEvent.findMany({
      where: {
        businessId: options.businessId,
        timestamp: {
          gte: new Date(options.timeRange.start),
          lte: new Date(options.timeRange.end),
        },
        replayable: true,
        ...(options.eventTypes && {
          eventType: {
            in: options.eventTypes,
          },
        }),
      },
      orderBy: {
        timestamp: 'asc',
      },
    })

    // Transform ReplayEvent to OperationalEvent
    return events.map((event) => ({
      id: event.id,
      type: event.eventType,
      timestamp: event.timestamp.toISOString(),
      data: event.eventData as any,
      businessId: event.businessId,
    }))
  } catch (error) {
    console.error('Error retrieving operational events:', error)
    return []
  }
}

/**
 * Query historical knowledge from IKB
 */
export async function queryHistoricalKnowledge(
  businessId: string,
  categories?: string[],
  limit: number = 100
) {
  const ikb = createKnowledgeBase()
  return ikb.query({
    businessId,
    categories,
    limit,
    sortBy: 'timestamp',
    sortOrder: 'desc',
  })
}

/**
 * Get knowledge timeline from IKB
 */
export async function getKnowledgeTimeline(businessId: string, limit: number = 100) {
  const ikb = createKnowledgeBase()
  return ikb.getTimeline(businessId, limit)
}

/**
 * Check if something has happened before
 */
export async function hasHappenedBefore(businessId: string, type: string): Promise<boolean> {
  const ikb = createKnowledgeBase()
  return ikb.hasHappenedBefore(businessId, type)
}

/**
 * Get occurrence frequency
 */
export async function getOccurrenceFrequency(businessId: string, type: string): Promise<number> {
  const ikb = createKnowledgeBase()
  return ikb.getOccurrenceFrequency(businessId, type)
}

/**
 * Check if metric is improving
 */
export async function isImproving(businessId: string, insightType: string): Promise<boolean> {
  const ikb = createKnowledgeBase()
  return ikb.isImproving(businessId, insightType)
}

/**
 * Get historical evidence
 */
export async function getHistoricalEvidence(businessId: string, type: string) {
  const ikb = createKnowledgeBase()
  return ikb.getHistoricalEvidence(businessId, type)
}

/**
 * Build time range from period selection
 */
export function buildTimeRange(period: string, customRange?: { start: string; end: string }): {
  start: string
  end: string
  label: string
} {
  const now = new Date()

  switch (period) {
    case 'today':
      const todayStart = new Date(now)
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date(now)
      todayEnd.setHours(23, 59, 59, 999)
      return {
        start: todayStart.toISOString(),
        end: todayEnd.toISOString(),
        label: 'Today',
      }

    case 'yesterday':
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStart = new Date(yesterday)
      yesterdayStart.setHours(0, 0, 0, 0)
      const yesterdayEnd = new Date(yesterday)
      yesterdayEnd.setHours(23, 59, 59, 999)
      return {
        start: yesterdayStart.toISOString(),
        end: yesterdayEnd.toISOString(),
        label: 'Yesterday',
      }

    case 'this_week':
      const weekStart = new Date(now)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      weekStart.setHours(0, 0, 0, 0)
      return {
        start: weekStart.toISOString(),
        end: now.toISOString(),
        label: 'This Week',
      }

    case 'last_7_days':
      const sevenDaysAgo = new Date(now)
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      return {
        start: sevenDaysAgo.toISOString(),
        end: now.toISOString(),
        label: 'Last 7 Days',
      }

    case 'last_30_days':
      const thirtyDaysAgo = new Date(now)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return {
        start: thirtyDaysAgo.toISOString(),
        end: now.toISOString(),
        label: 'Last 30 Days',
      }

    case 'specific_date':
      if (!customRange || !customRange.start) {
        throw new Error('Specific date required for specific_date period')
      }
      const specificDate = new Date(customRange.start)
      const specificStart = new Date(specificDate)
      specificStart.setHours(0, 0, 0, 0)
      const specificEnd = new Date(specificDate)
      specificEnd.setHours(23, 59, 59, 999)
      return {
        start: specificStart.toISOString(),
        end: specificEnd.toISOString(),
        label: `Specific Date (${customRange.start})`,
      }

    case 'custom':
      if (!customRange) {
        throw new Error('Custom range required for custom period')
      }
      return {
        start: customRange.start,
        end: customRange.end,
        label: 'Custom Range',
      }

    default:
      throw new Error(`Unknown period: ${period}`)
  }
}
