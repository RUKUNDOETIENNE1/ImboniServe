/**
 * Kitchen Intelligence™ API - Generate Report
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createKitchenIntelligenceService, createDashboardBuilder } from '@/lib/kitchen-intelligence'

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Authorization - Kitchen Managers, Managers, and Owners
    if (!['KITCHEN_MANAGER', 'MANAGER', 'OWNER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { reportingPeriod, includeHistorical, includeIngredients } = body

    // Get business ID from session
    const businessId = session.user.businessId
    if (!businessId) {
      return NextResponse.json({ error: 'Business ID not found' }, { status: 400 })
    }

    // Generate report
    const service = createKitchenIntelligenceService()
    const response = await service.generateReport({
      businessId,
      reportingPeriod,
      includeHistorical: includeHistorical ?? true,
      includeIngredients: includeIngredients ?? true,
    })

    if (!response.success || !response.report) {
      return NextResponse.json({
        success: false,
        error: response.error || 'Failed to generate report',
      })
    }

    // Build dashboard view model
    const dashboardBuilder = createDashboardBuilder()
    const dashboard = dashboardBuilder.build(response.report)

    return NextResponse.json({
      success: true,
      dashboard,
      diagnostics: response.diagnostics,
    })
  } catch (error) {
    console.error('Kitchen intelligence generation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
