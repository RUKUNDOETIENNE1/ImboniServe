/**
 * Hospitality Intelligence Platform v1.0
 * API Endpoint Factory
 * 
 * Creates standardized API endpoints for intelligence modules.
 * Provides consistent authentication, validation, and error handling.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

/**
 * Intelligence service interface
 */
export interface IntelligenceService<TRequest, TResponse> {
  generateReport(request: TRequest): Promise<TResponse>
}

/**
 * Standard error diagnostics
 */
interface ErrorDiagnostics {
  reportsRetrieved: number
  historicalQueriesExecuted: number
  comparisonPerformed: boolean
  totalTime: number
  reportRetrievalTime: number
  historicalRetrievalTime: number
  comparisonTime: number
  buildTime: number
}

/**
 * Create a standardized intelligence API endpoint
 * 
 * Provides:
 * - Authentication check
 * - Method validation (POST only)
 * - Request validation (businessId, selection)
 * - Service invocation
 * - Error handling
 * - Standardized responses
 * 
 * @param serviceName - Name of the intelligence module (for logging)
 * @param createService - Factory function to create service instance
 * @param validateRequest - Optional custom request validation
 */
export function createIntelligenceEndpoint<TRequest, TResponse>(
  serviceName: string,
  createService: () => IntelligenceService<TRequest, TResponse>,
  validateRequest?: (request: TRequest) => void
) {
  return async function handler(
    req: NextApiRequest,
    res: NextApiResponse<TResponse | { success: false; error: string; diagnostics: ErrorDiagnostics }>
  ) {
    const startTime = Date.now()

    // Step 1: Authentication
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        diagnostics: createEmptyDiagnostics(),
      } as any)
    }

    // Step 2: Method validation
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed',
        diagnostics: createEmptyDiagnostics(),
      } as any)
    }

    try {
      // Step 3: Request validation
      const request: TRequest = req.body

      // Standard validation
      if (!request || typeof request !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Invalid request body',
          diagnostics: createEmptyDiagnostics(),
        } as any)
      }

      // Check for businessId
      if (!(request as any).businessId) {
        return res.status(400).json({
          success: false,
          error: 'businessId is required',
          diagnostics: createEmptyDiagnostics(),
        } as any)
      }

      // Check for selection
      if (!(request as any).selection) {
        return res.status(400).json({
          success: false,
          error: 'selection is required',
          diagnostics: createEmptyDiagnostics(),
        } as any)
      }

      // Custom validation (if provided)
      if (validateRequest) {
        try {
          validateRequest(request)
        } catch (error) {
          return res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Validation failed',
            diagnostics: createEmptyDiagnostics(),
          } as any)
        }
      }

      // Step 4: Service invocation
      const service = createService()
      const response = await service.generateReport(request)

      // Step 5: Response
      const statusCode = (response as any).success ? 200 : 500
      return res.status(statusCode).json(response)
    } catch (error) {
      // Step 6: Error handling
      console.error(`${serviceName} API error:`, error)
      
      const diagnostics = createEmptyDiagnostics()
      diagnostics.totalTime = Date.now() - startTime

      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        diagnostics,
      } as any)
    }
  }
}

/**
 * Create empty diagnostics for error responses
 */
function createEmptyDiagnostics(): ErrorDiagnostics {
  return {
    reportsRetrieved: 0,
    historicalQueriesExecuted: 0,
    comparisonPerformed: false,
    totalTime: 0,
    reportRetrievalTime: 0,
    historicalRetrievalTime: 0,
    comparisonTime: 0,
    buildTime: 0,
  }
}

/**
 * Utility: Validate time range selection
 */
export function validateTimeRangeSelection(selection: any): void {
  if (!selection) {
    throw new Error('selection is required')
  }

  if (!selection.period) {
    throw new Error('selection.period is required')
  }

  if (selection.period === 'custom' && !selection.customRange) {
    throw new Error('customRange is required for custom period')
  }

  if (selection.customRange) {
    if (!selection.customRange.start || !selection.customRange.end) {
      throw new Error('customRange must include start and end dates')
    }
  }
}

/**
 * Utility: Validate business access (can be extended for authorization)
 */
export function validateBusinessAccess(
  session: any,
  businessId: string
): void {
  // Basic validation - can be extended with actual authorization logic
  if (!businessId) {
    throw new Error('businessId is required')
  }

  // Future: Check if user has access to this business
  // if (!session.user.businesses?.includes(businessId)) {
  //   throw new Error('Access denied to this business')
  // }
}
