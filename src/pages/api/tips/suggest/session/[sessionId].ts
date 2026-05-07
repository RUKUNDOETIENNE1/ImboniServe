import type { NextApiRequest, NextApiResponse } from 'next'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'
import { withRateLimit } from '@/lib/middleware/withRateLimit'
import { successResponse, errorResponse } from '@/lib/api/response-helpers'
import { DiningSessionSlipService } from '@/lib/services/dining-session-slip.service'
import { isDigitalTippingEnabled, calculateRoundUpTip } from '@/lib/services/digital-tipping.service'

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

    const tippingEnabled = await isDigitalTippingEnabled(slip.businessId)
    if (!tippingEnabled) {
      return res.status(200).json(successResponse({ enabled: false }))
    }

    const suggestion = calculateRoundUpTip(slip.runningTotalCents)

    return res.status(200).json(successResponse({
      enabled: suggestion.enabled,
      billAmountCents: suggestion.originalAmountCents,
      suggestedAmountCents: suggestion.suggestedAmountCents,
      tipAmountCents: suggestion.tipAmountCents,
      currency: 'RWF',
    }))
  } catch (error: any) {
    console.error('[Tip Suggestion Session] Error:', error)
    return res.status(500).json(errorResponse(error.message || 'Failed to fetch tip suggestion'))
  }
}

export default withRateLimit(withErrorHandler(handler), { maxRequests: 60, windowMs: 60 * 1000 })
