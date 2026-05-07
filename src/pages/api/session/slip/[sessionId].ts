/**
 * Get Dining Session Slip API
 * Returns live order tracking data for a session
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { DiningSessionSlipService } from '@/lib/services/dining-session-slip.service'
import { successResponse, errorResponse } from '@/lib/api/response-helpers'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'
import { withRateLimit } from '@/lib/middleware/withRateLimit'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json(errorResponse('Method not allowed'))
  }

  const { sessionId } = req.query

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json(errorResponse('Session ID is required'))
  }

  try {
    const slip = await DiningSessionSlipService.getSlipBySessionId(sessionId)

    if (!slip) {
      return res.status(404).json(errorResponse('Session not found'))
    }

    return res.status(200).json(successResponse(slip))
  } catch (error: any) {
    console.error('[Session Slip] Error:', error)
    return res.status(500).json(errorResponse(error.message || 'Failed to fetch session'))
  }
}

export default withRateLimit(withErrorHandler(handler), {
  maxRequests: 60,
  windowMs: 60 * 1000, // 60 requests per minute
})
