import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { InTouchService } from '@/lib/services/intouch.service'
import { AuditLogService } from '@/lib/services/audit-log.service'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { withRateLimit } from '@/lib/middleware/rateLimit.redis'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { ensurePaymentLedgerEvent } from '@/lib/services/payment-ledger-events.service'

const refundSchema = z.object({
  transactionId: z.string().min(1),
  reason: z.string().min(1).max(500),
  refundAmountCents: z.number().int().positive().optional(),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' })
  }

  const actorId = (session.user as any).id as string
  const businessId = (session.user as any).businessId as string | null

  if (!businessId) {
    return res.status(400).json({ error: 'No business associated with account', code: 'NO_BUSINESS' })
  }

  const parsed = refundSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', code: 'VALIDATION_ERROR', issues: parsed.error.issues })
  }

  const { transactionId, reason, refundAmountCents } = parsed.data

  try {
    const tx = await prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
      include: { sale: { select: { id: true } } },
    })

    if (!tx) {
      return res.status(404).json({ error: 'Transaction not found', code: 'NOT_FOUND' })
    }

    if (tx.businessId !== businessId) {
      return res.status(403).json({ error: 'Insufficient permissions', code: 'PERMISSION_DENIED' })
    }

    if (tx.status === 'REFUNDED') {
      return res.status(409).json({ error: 'Transaction already refunded', code: 'ALREADY_REFUNDED' })
    }

    if (tx.status !== 'SUCCESS') {
      return res.status(422).json({
        error: `Cannot refund a transaction with status ${tx.status}`,
        code: 'INVALID_STATUS',
      })
    }

    if (tx.gateway !== 'INTOUCH') {
      return res.status(422).json({
        error: 'Automated refunds are only supported for InTouch (Mobile Money) transactions',
        code: 'GATEWAY_NOT_SUPPORTED',
      })
    }

    if (!tx.payerPhone) {
      return res.status(422).json({
        error: 'Payer phone number not recorded on transaction; manual refund required',
        code: 'MISSING_PAYER_PHONE',
      })
    }

    const refundCents = refundAmountCents ?? tx.amountCents
    if (refundCents > tx.amountCents) {
      return res.status(422).json({
        error: 'Refund amount cannot exceed original transaction amount',
        code: 'REFUND_EXCEEDS_ORIGINAL',
      })
    }

    const refundTxId = `REF-${tx.transactionId}-${Date.now()}`

    const depositResult = await InTouchService.requestDeposit({
      amount: Math.round(refundCents / 100),
      mobilePhoneNo: tx.payerPhone,
      requestTransactionId: refundTxId,
    })

    const depositSucceeded = depositResult.responsecode === '200'

    await prisma.$transaction(async (trx) => {
      await trx.paymentTransaction.update({
        where: { id: transactionId },
        data: {
          status: depositSucceeded ? 'REFUNDED' : tx.status,
          rawStatus: { ...((tx.rawStatus as object) ?? {}), refund: depositResult } as any,
        },
      })

      if (depositSucceeded && tx.sale?.id) {
        await trx.sale.update({
          where: { id: tx.sale.id },
          data: { paymentStatus: 'REFUNDED' as any },
        })
      }
    })
    if (depositSucceeded) {
      await ensurePaymentLedgerEvent(transactionId, 'REFUNDED', {
        source: 'payments/refunds',
        refundTxId,
        reason,
      })
    }

    await AuditLogService.log({
      actorId,
      action: 'PAYMENT_REFUND_INITIATED',
      entityType: 'PaymentTransaction',
      entityId: transactionId,
      metadata: {
        reason,
        refundCents,
        refundTxId,
        depositResponseCode: depositResult.responsecode,
        depositMessage: depositResult.responsemsg,
        success: depositSucceeded,
      },
    })

    if (!depositSucceeded) {
      return res.status(502).json({
        error: 'Refund request failed at payment gateway',
        code: 'GATEWAY_ERROR',
        gatewayMessage: depositResult.responsemsg,
      })
    }

    return res.status(200).json({
      success: true,
      refundTxId,
      refundCents,
      gatewayTransactionId: depositResult.transactionid,
    })
  } catch (error: any) {
    console.error('[Refunds API] Error:', error)
    return res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
}

export default withRateLimit({ maxRequests: 10, windowMs: 15 * 60_000, keyPrefix: 'refunds' })(
  requirePermission('payments.refund')(handler)
)
