/**
 * Multi-location Intelligence™ API - Generate Report
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPortfolioIntelligenceService, createDashboardBuilder } from '@/lib/multi-location-intelligence'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['OWNER', 'OPERATIONS_DIRECTOR', 'REGIONAL_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { reportingPeriod, restaurantIds, includeHistorical, includeComparisons } = body

    const organizationId = session.user.organizationId
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID not found' }, { status: 400 })
    }

    const service = createPortfolioIntelligenceService()
    const response = await service.generateReport({
      organizationId,
      restaurantIds,
      reportingPeriod,
      includeHistorical: includeHistorical ?? true,
      includeComparisons: includeComparisons ?? true,
    })

    if (!response.success || !response.report) {
      return NextResponse.json({
        success: false,
        error: response.error || 'Failed to generate report',
      })
    }

    const dashboardBuilder = createDashboardBuilder()
    const dashboard = dashboardBuilder.build(response.report)

    return NextResponse.json({
      success: true,
      dashboard,
      diagnostics: response.diagnostics,
    })
  } catch (error) {
    console.error('Portfolio intelligence generation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
