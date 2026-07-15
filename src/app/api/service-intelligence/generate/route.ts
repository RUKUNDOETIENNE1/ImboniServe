/**
 * Service Intelligence™ API - Generate Intelligence
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  createServiceIntelligence,
  createDashboardBuilder,
  type ServiceIntelligenceRequest,
} from '@/lib/service-intelligence/v2'
import type { ReplayEvent } from '@/lib/service-replay/types'

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Authorization - Managers and Owners only
    if (session.user.role !== 'MANAGER' && session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { selection, includeHistoricalContext, includeComparison } = body

    // Get business ID from session
    const businessId = session.user.businessId
    if (!businessId) {
      return NextResponse.json({ error: 'Business ID not found' }, { status: 400 })
    }

    // Build request
    const intelligenceRequest: ServiceIntelligenceRequest = {
      businessId,
      selection,
      includeHistoricalContext: includeHistoricalContext ?? true,
      includeComparison: includeComparison ?? true,
    }

    // Fetch replay events from database
    const timeRange = getTimeRangeForSelection(selection)
    const replayEvents = await fetchReplayEvents(businessId, timeRange.start, timeRange.end)

    if (replayEvents.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No events found for the selected period',
      })
    }

    // Generate intelligence
    const service = createServiceIntelligence()
    const response = await service.generateIntelligence(intelligenceRequest, replayEvents)

    if (!response.success || !response.report) {
      return NextResponse.json({
        success: false,
        error: response.error || 'Failed to generate intelligence',
      })
    }

    // Build dashboard view model
    const builder = createDashboardBuilder()
    const dashboard = builder.build(response.report, response.historicalContext)

    // Cache the report (optional)
    await cacheReport(businessId, response.report)

    return NextResponse.json({
      success: true,
      dashboard,
      diagnostics: response.diagnostics,
    })
  } catch (error) {
    console.error('Service Intelligence generation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function getTimeRangeForSelection(selection: any): { start: string; end: string } {
  const now = new Date()

  switch (selection.period) {
    case 'today_lunch': {
      const dateStr = now.toISOString().split('T')[0]
      return {
        start: `${dateStr}T11:00:00.000Z`,
        end: `${dateStr}T15:00:00.000Z`,
      }
    }
    case 'today_dinner': {
      const dateStr = now.toISOString().split('T')[0]
      return {
        start: `${dateStr}T17:00:00.000Z`,
        end: `${dateStr}T22:00:00.000Z`,
      }
    }
    case 'yesterday': {
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      const dateStr = yesterday.toISOString().split('T')[0]
      return {
        start: `${dateStr}T00:00:00.000Z`,
        end: `${dateStr}T23:59:59.999Z`,
      }
    }
    case 'last_7_days': {
      const start = new Date(now)
      start.setDate(start.getDate() - 7)
      return {
        start: start.toISOString(),
        end: now.toISOString(),
      }
    }
    case 'last_30_days': {
      const start = new Date(now)
      start.setDate(start.getDate() - 30)
      return {
        start: start.toISOString(),
        end: now.toISOString(),
      }
    }
    case 'custom': {
      if (!selection.customRange) {
        throw new Error('Custom range required')
      }
      return {
        start: selection.customRange.start,
        end: selection.customRange.end,
      }
    }
    default:
      throw new Error(`Unknown period: ${selection.period}`)
  }
}

async function fetchReplayEvents(
  businessId: string,
  startTime: string,
  endTime: string
): Promise<ReplayEvent[]> {
  // Fetch events from database
  // This would query the actual replay events table
  // For now, return mock data for testing
  
  const events = await prisma.replayEvent.findMany({
    where: {
      businessId,
      timestamp: {
        gte: new Date(startTime),
        lte: new Date(endTime),
      },
    },
    orderBy: {
      timestamp: 'asc',
    },
  })

  return events.map((event) => ({
    id: event.id,
    timestamp: event.timestamp.toISOString(),
    eventType: event.eventType,
    category: event.category as any,
    description: event.description,
    orderId: event.orderId || undefined,
    orderNumber: event.orderNumber || undefined,
    waiterId: event.waiterId || undefined,
    waiterName: event.waiterName || undefined,
    stationId: event.stationId || undefined,
    stationName: event.stationName || undefined,
    tableId: event.tableId || undefined,
    duration: event.duration || undefined,
    metadata: event.metadata as any,
    details: event.details as any,
  }))
}

async function cacheReport(businessId: string, report: any): Promise<void> {
  // Cache the report for quick retrieval
  // This could use Redis or database
  try {
    await prisma.serviceIntelligenceReport.upsert({
      where: {
        id: report.metadata.id,
      },
      create: {
        id: report.metadata.id,
        businessId,
        generatedAt: new Date(report.metadata.generatedAt),
        timeRangeStart: new Date(report.metadata.timeRange.start),
        timeRangeEnd: new Date(report.metadata.timeRange.end),
        reportData: report,
      },
      update: {
        reportData: report,
      },
    })
  } catch (error) {
    console.error('Failed to cache report:', error)
    // Non-critical, continue
  }
}
