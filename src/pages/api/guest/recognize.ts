/**
 * Guest Recognition API
 * Canonical entry point for guest recognition across all channels.
 *
 * POST /api/guest/recognize
 *   Body: { phone, businessId, name? }
 *   Returns: { recognized, intelligence } | { recognized: false, customerId }
 *
 * GET /api/guest/recognize?phone=...&businessId=...
 *   Returns: { recognized, intelligence } | { recognized: false }
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { GuestRecognitionService } from '@/lib/services/guest-recognition.service'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'
import { successResponse, errorResponse } from '@/lib/api/response-helpers'
import { extractOrderAccessToken } from '@/lib/api/public-order-auth'
import { verifyQRSessionForBusiness } from '@/lib/services/qr-token.service'
import { logger } from '@/lib/logger'

const log = logger.child({ api: 'guest-recognize' })

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json(errorResponse('Method not allowed'))
  }

  const phone = req.method === 'POST' ? req.body.phone : req.query.phone
  const businessId = req.method === 'POST' ? req.body.businessId : req.query.businessId
  const name = req.method === 'POST' ? req.body.name : undefined

  if (!phone || typeof phone !== 'string') {
    return res.status(400).json(errorResponse('Phone number is required'))
  }

  if (!businessId || typeof businessId !== 'string') {
    return res.status(400).json(errorResponse('Business ID is required'))
  }

  // Authorization: guest intelligence is PII (history, loyalty, allergies).
  // Requires either a QR order token bound to this business (customer in an
  // active QR session) or a staff session for the same business.
  const token = extractOrderAccessToken(req)
  let authorized = false

  if (token) {
    authorized = Boolean(await verifyQRSessionForBusiness(token, businessId))
  }

  if (!authorized) {
    const session = await getServerSession(req, res, authOptions)
    const sessionBusinessId = (session?.user as any)?.businessId
    authorized = Boolean(session?.user && sessionBusinessId === businessId)
  }

  if (!authorized) {
    return res.status(401).json(errorResponse('Unauthorized'))
  }

  try {
    // POST can register a new guest if not found
    if (req.method === 'POST' && name) {
      const result = await GuestRecognitionService.registerOrRecognize(
        phone,
        businessId,
        name
      )

      log.info('Guest registered/recognized', {
        businessId,
        isNew: result.isNew,
        visitCount: result.intelligence.customer.visitCount,
      })

      return res.status(200).json(
        successResponse(
          {
            recognized: !result.isNew,
            isNew: result.isNew,
            customerId: result.customerId,
            intelligence: result.intelligence,
          },
          result.isNew ? 'New guest registered' : 'Returning guest recognized'
        )
      )
    }

    // GET or POST without name — recognize only, don't create
    const result = await GuestRecognitionService.recognize(phone, businessId)

    if (!result.intelligence) {
      return res.status(200).json(
        successResponse(
          { recognized: false, intelligence: null },
          'Guest not found — new customer'
        )
      )
    }

    log.info('Guest recognized', {
      businessId,
      visitCount: result.intelligence.customer.visitCount,
      vipTier: result.intelligence.loyalty.tier,
    })

    return res.status(200).json(
      successResponse(
        { recognized: true, intelligence: result.intelligence },
        'Returning guest recognized'
      )
    )
  } catch (error: any) {
    log.error('Recognition failed', { error: error.message, businessId })
    return res.status(500).json(errorResponse('Failed to recognize guest'))
  }
}

export default withErrorHandler(handler)
