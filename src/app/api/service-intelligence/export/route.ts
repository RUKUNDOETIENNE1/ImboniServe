/**
 * Service Intelligence™ API - Export Report
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createExporter, createDashboardBuilder } from '@/lib/service-intelligence/v2'

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reportId, format, sections, includeEvidence, includeReplayLinks } = body

    // Fetch report from cache
    const cachedReport = await prisma.serviceIntelligenceReport.findUnique({
      where: { id: reportId },
    })

    if (!cachedReport) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Verify business access
    if (cachedReport.businessId !== session.user.businessId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const report = cachedReport.reportData as any

    // Build dashboard
    const builder = createDashboardBuilder()
    const dashboard = builder.build(report)

    // Export
    const exporter = createExporter()
    const result = await exporter.export(dashboard, report, {
      reportId,
      format,
      sections,
      includeEvidence,
      includeReplayLinks,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Return file
    const headers = new Headers()
    headers.set('Content-Type', getContentType(format))
    headers.set('Content-Disposition', `attachment; filename="${result.filename}"`)

    return new NextResponse(result.data, { headers })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    )
  }
}

function getContentType(format: string): string {
  switch (format) {
    case 'json':
      return 'application/json'
    case 'markdown':
      return 'text/markdown'
    case 'csv':
      return 'text/csv'
    case 'pdf':
      return 'application/pdf'
    default:
      return 'application/octet-stream'
  }
}
