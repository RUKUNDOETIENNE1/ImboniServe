/**
 * Initialize Dining Session API
 * Called when QR code is scanned to create TableSession + DiningSessionSlip
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { DiningSessionSlipService } from '@/lib/services/dining-session-slip.service'
import { successResponse, errorResponse } from '@/lib/api/response-helpers'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'
import { withRateLimit } from '@/lib/middleware/withRateLimit'
import { ingestDiningSlipShadowEvent } from '@/lib/die/business-as-plugin/dining-slips/slips.shadow'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json(errorResponse('Method not allowed'))
  }

  const { tableId, businessId, participantName } = req.body

  if (!tableId || !businessId) {
    return res.status(400).json(errorResponse('Table ID and Business ID are required'))
  }

  try {
    // Check if there's already an active session for this table
    const existingSession = await prisma.tableSession.findFirst({
      where: {
        tableId,
        status: 'active',
      },
      include: {
        diningSessionSlip: true,
      },
    })

    if (existingSession) {
      // Return existing session
      return res.status(200).json(
        successResponse({
          sessionId: existingSession.id,
          slipId: existingSession.diningSessionSlip?.id,
          isNew: false,
          message: 'Joined existing session',
        })
      )
    }

    // Get table details
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      select: { number: true, businessId: true },
    })

    if (!table) {
      return res.status(404).json(errorResponse('Table not found'))
    }

    if (table.businessId !== businessId) {
      return res.status(403).json(errorResponse('Table does not belong to this business'))
    }

    // Get business tax settings
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { taxMode: true, taxRate: true },
    })

    if (!business) {
      return res.status(404).json(errorResponse('Business not found'))
    }

    // Create new session in transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create TableSession
      const session = await tx.tableSession.create({
        data: {
          tableId,
          businessId,
          status: 'active',
          checkoutMode: 'tap_and_leave',
          checkoutStatus: 'active',
        },
      })

      // Create participant if name provided
      let participantId: string | undefined
      if (participantName) {
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`
        const participant = await tx.sessionParticipant.create({
          data: {
            sessionId: session.id,
            tempId,
            name: participantName,
          },
        })
        participantId = participant.id
      }

      return { session, participantId }
    })

    // Create DiningSessionSlip (outside transaction for better error handling)
    const slip = await DiningSessionSlipService.createSlip({
      sessionId: result.session.id,
      businessId,
      tableId,
      taxMode: business.taxMode as 'INCLUSIVE' | 'EXCLUSIVE',
      taxRate: business.taxRate,
    })

    // Shadow taps (feature-flagged inside ingestor)
    try {
      const nowTs = new Date().toISOString()
      await ingestDiningSlipShadowEvent({ type: 'SESSION_STARTED', businessId, sessionId: result.session.id }).catch(() => {})
      await ingestDiningSlipShadowEvent({ type: 'SLIP_CREATED', businessId, sessionId: result.session.id, slipId: slip.id }).catch(() => {})
    } catch {}

    return res.status(201).json(
      successResponse({
        sessionId: result.session.id,
        slipId: slip.id,
        participantId: result.participantId,
        isNew: true,
        message: 'Session created successfully',
      })
    )
  } catch (error: any) {
    console.error('[Session Initialize] Error:', error)
    return res.status(500).json(errorResponse(error.message || 'Failed to initialize session'))
  }
}

export default withRateLimit(withErrorHandler(handler), {
  maxRequests: 10,
  windowMs: 60 * 1000, // 10 requests per minute
})
