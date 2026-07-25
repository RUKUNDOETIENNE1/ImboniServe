/**
 * Staff Guest Intelligence API
 * Returns concise guest context for waiter POS display.
 *
 * GET /api/guest/staff-intelligence?phone=...&businessId=...
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { GuestRecognitionService } from '@/lib/services/guest-recognition.service'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'
import { successResponse, errorResponse } from '@/lib/api/response-helpers'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json(errorResponse('Method not allowed'))
  }

  const { phone, businessId } = req.query

  if (!phone || typeof phone !== 'string') {
    return res.status(400).json(errorResponse('Phone number is required'))
  }

  if (!businessId || typeof businessId !== 'string') {
    return res.status(400).json(errorResponse('Business ID is required'))
  }

  try {
    const intelligence = await GuestRecognitionService.getStaffIntelligence(phone, businessId)

    if (!intelligence) {
      return res.status(200).json(
        successResponse({ isReturning: false }, 'New customer — no history available')
      )
    }

    return res.status(200).json(successResponse(intelligence, 'Guest intelligence retrieved'))
  } catch (error: any) {
    return res.status(500).json(errorResponse('Failed to retrieve guest intelligence'))
  }
}

export default withErrorHandler(handler)
