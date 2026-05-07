import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'
import { withRateLimit } from '@/lib/middleware/withRateLimit'
import { successResponse, errorResponse } from '@/lib/api/response-helpers'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json(errorResponse('Method not allowed'))
  }

  const { sessionId, accepted, tipAmountCents } = req.body || {}

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json(errorResponse('Session ID is required'))
  }
  if (typeof accepted !== 'boolean') {
    return res.status(400).json(errorResponse('Accepted flag is required'))
  }
  if (accepted && (typeof tipAmountCents !== 'number' || tipAmountCents < 0)) {
    return res.status(400).json(errorResponse('tipAmountCents must be a non-negative number when accepted'))
  }

  try {
    const slip = await prisma.diningSessionSlip.findUnique({ where: { sessionId } })
    if (!slip) {
      return res.status(404).json(errorResponse('Session not found'))
    }

    const metadata: any = (slip.metadata as any) || {}
    metadata.tipChoice = {
      accepted,
      amountCents: accepted ? Math.round(tipAmountCents || 0) : 0,
      recordedAt: new Date().toISOString(),
      source: 'tap_leave_public',
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.diningSessionSlip.update({
        where: { id: slip.id },
        data: { metadata },
      })

      // Audit event for observability
      await tx.checkoutEvent.create({
        data: {
          sessionId: slip.sessionId,
          slipId: slip.id,
          businessId: slip.businessId,
          eventType: 'tip_choice',
          eventStatus: 'success',
          metadata: metadata.tipChoice,
        },
      })
    })

    return res.status(200).json(successResponse({ recorded: true }))
  } catch (error: any) {
    console.error('[Tip Record Session] Error:', error)
    return res.status(500).json(errorResponse(error.message || 'Failed to record tip choice'))
  }
}

export default withRateLimit(withErrorHandler(handler), { maxRequests: 60, windowMs: 60 * 1000 })
