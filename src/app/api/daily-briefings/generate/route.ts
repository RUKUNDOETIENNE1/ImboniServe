/**
 * Daily Briefings™ API - Generate Briefing
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDailyBriefingService, createDashboardBuilder } from '@/lib/daily-briefings'

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
    const { selection, includeComparison, includeHistorical } = body

    // Get business ID from session
    const businessId = session.user.businessId
    if (!businessId) {
      return NextResponse.json({ error: 'Business ID not found' }, { status: 400 })
    }

    // Generate briefing
    const service = createDailyBriefingService()
    const response = await service.generateBriefing({
      businessId,
      selection,
      includeComparison: includeComparison ?? true,
      includeHistorical: includeHistorical ?? true,
    })

    if (!response.success || !response.briefing) {
      return NextResponse.json({
        success: false,
        error: response.error || 'Failed to generate briefing',
      })
    }

    // Build dashboard view model
    const dashboardBuilder = createDashboardBuilder()
    const dashboard = dashboardBuilder.build(response.briefing)

    return NextResponse.json({
      success: true,
      dashboard,
      diagnostics: response.diagnostics,
    })
  } catch (error) {
    console.error('Daily briefing generation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
