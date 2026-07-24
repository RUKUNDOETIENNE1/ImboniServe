/**
 * Service Intelligence™ API - Generate Report
 * 
 * POST /api/service-intelligence/generate
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { createServiceIntelligenceService } from '@/lib/service-intelligence'
import type { ServiceIntelligenceRequest, ServiceIntelligenceResponse } from '@/lib/service-intelligence/types'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ServiceIntelligenceResponse>
) {
  // Authentication
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      diagnostics: {
        reportsRetrieved: 0,
        historicalQueriesExecuted: 0,
        comparisonPerformed: false,
        totalTime: 0,
        reportRetrievalTime: 0,
        historicalRetrievalTime: 0,
        comparisonTime: 0,
        buildTime: 0,
      },
    })
  }

  // Method validation
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      diagnostics: {
        reportsRetrieved: 0,
        historicalQueriesExecuted: 0,
        comparisonPerformed: false,
        totalTime: 0,
        reportRetrievalTime: 0,
        historicalRetrievalTime: 0,
        comparisonTime: 0,
        buildTime: 0,
      },
    })
  }

  try {
    // Validate request
    const request: ServiceIntelligenceRequest = req.body

    if (!request.businessId) {
      return res.status(400).json({
        success: false,
        error: 'businessId is required',
        diagnostics: {
          reportsRetrieved: 0,
          historicalQueriesExecuted: 0,
          comparisonPerformed: false,
          totalTime: 0,
          reportRetrievalTime: 0,
          historicalRetrievalTime: 0,
          comparisonTime: 0,
          buildTime: 0,
        },
      })
    }

    if (!request.selection) {
      return res.status(400).json({
        success: false,
        error: 'selection is required',
        diagnostics: {
          reportsRetrieved: 0,
          historicalQueriesExecuted: 0,
          comparisonPerformed: false,
          totalTime: 0,
          reportRetrievalTime: 0,
          historicalRetrievalTime: 0,
          comparisonTime: 0,
          buildTime: 0,
        },
      })
    }

    // Generate report
    const service = createServiceIntelligenceService()
    const response = await service.generateReport(request)

    // Return response
    return res.status(response.success ? 200 : 500).json(response)
  } catch (error) {
    console.error('Service Intelligence API error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      diagnostics: {
        reportsRetrieved: 0,
        historicalQueriesExecuted: 0,
        comparisonPerformed: false,
        totalTime: 0,
        reportRetrievalTime: 0,
        historicalRetrievalTime: 0,
        comparisonTime: 0,
        buildTime: 0,
      },
    })
  }
}
