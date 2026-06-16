import { prisma } from '@/lib/prisma'
import { DiningSessionSlipService } from '@/lib/services/dining-session-slip.service'
import { SmartDiningSlipService } from '@/lib/services/smart-dining-slip.service'
import { createTipForSale } from '@/lib/services/digital-tipping.service'
import { InTouchService } from '@/lib/services/intouch.service'
import { logger } from '@/lib/logger'
import { ensurePaymentLedgerEvent } from '@/lib/services/payment-ledger-events.service'

export type FinalizeSource = 'webhook' | 'poll' | 'cron' | 'sweeper'

export class TapLeaveFinalizationService {
  static async finalize(paymentId: string, source: FinalizeSource): Promise<{ alreadyFinalized?: boolean }> {
    const startedAt = Date.now()
    try { logger.info('[Tap&Leave Finalize] start', { paymentId, source }) } catch {}
    // Load payment
    const payment = await prisma.paymentTransaction.findUnique({ where: { id: paymentId } })
    if (!payment) {
      try { logger.warn('[Tap&Leave Finalize] payment not found', { paymentId, source }) } catch {}
      return { alreadyFinalized: true }
    }

    if ((payment.status as any) !== 'SUCCESS') {
      try { logger.info('[Tap&Leave Finalize] skip: not SUCCESS', { paymentId, source, status: payment.status }) } catch {}
      return { alreadyFinalized: true }
    }

    const rawReq: any = payment.rawRequest || {}
    const rawStatus: any = payment.rawStatus || {}

    // Best-effort lock/idempotency: mark finalizedAt once in rawStatus
    if (rawStatus.finalizedAt) {
      try { logger.info('[Tap&Leave Finalize] already finalized', { paymentId }) } catch {}
      return { alreadyFinalized: true }
    }

    const nowIso = new Date().toISOString()
    await prisma.paymentTransaction.update({
      where: { id: payment.id },
      data: { rawStatus: { ...rawStatus, finalizedAt: nowIso, finalizedSource: source } as any },
    })

    const sessionId: string | undefined = rawReq.sessionId
    const slipId: string | undefined = rawReq.slipId
    if (!sessionId || !slipId) return { alreadyFinalized: false }

    // Mark slip paid (idempotent inside service)
    await DiningSessionSlipService.markPaymentConfirmed(slipId, payment.id)

    // Update all orders as paid (idempotent)
    await prisma.sale.updateMany({ where: { tableSessionId: sessionId }, data: { paymentStatus: 'PAID' as any, isPaid: true } })

    // Get slip & orders
    const slip = await DiningSessionSlipService.getSlipById(slipId)
    const orders = await prisma.sale.findMany({ where: { tableSessionId: sessionId }, include: { items: { include: { menuItem: true } } } })

    if (orders.length > 0 && slip) {
      const primary = orders[0]

      // TipChoice + StaffTip idempotent creation based on slip.metadata.tipChoice
      try {
        const tipMeta: any = (slip.metadata as any)?.tipChoice
        if (tipMeta) {
          const accepted: boolean = !!tipMeta.accepted
          const amountCents: number = Math.max(0, Math.round(tipMeta.amountCents || 0))

          const existingChoice = await prisma.tipChoice.findFirst({ where: { saleId: primary.id } })
          if (!existingChoice) {
            await prisma.tipChoice.create({ data: { saleId: primary.id, accepted, suggestedAmountCents: amountCents } })
          }

          if (accepted && amountCents > 0) {
            const staffId: string | null = (slip.session as any)?.table?.assignedWaiterId || (primary as any).userId || null
            if (staffId) {
              const existingByPayment = await prisma.staffTip.findFirst({ where: { paymentTransactionId: payment.id } })
              const existingBySaleAmount = await prisma.staffTip.findFirst({ where: { saleId: primary.id, amountCents } })
              if (!existingByPayment && !existingBySaleAmount) {
                const tip = await createTipForSale(primary.id, staffId, amountCents)
                await prisma.staffTip.update({ where: { id: tip.id }, data: { paymentTransactionId: payment.id } })
              }
            }
          }
        }
      } catch (e) {
        // Non-critical
        try { logger.warn('[Tap&Leave Finalize] tip allocation error', { paymentId: payment.id, err: String(e) }) } catch {}
      }

      // Generate final receipt (idempotent via unique saleId on SmartDiningSlip)
      try {
        await SmartDiningSlipService.generateSlip({
          saleId: primary.id,
          clientPhone: payment.payerPhone || undefined,
          clientEmail: undefined,
          clientConsentedWhatsApp: false,
        })
      } catch (e) {
        // Ignore duplicate generation errors
        try { logger.warn('[Tap&Leave Finalize] receipt generation warning', { paymentId: payment.id, err: String(e) }) } catch {}
      }
    }

    // Close session (idempotent)
    await DiningSessionSlipService.closeSession(slipId)

    // Mark payment finalized (rawStatus already updated above)
    await prisma.checkoutEvent.create({
      data: {
        sessionId,
        slipId,
        businessId: payment.businessId,
        eventType: 'checkout_completed',
        eventStatus: 'success',
        paymentId: payment.id,
        metadata: { finalized_source: source },
      },
    })

    try { logger.info('[Tap&Leave Finalize] success', { paymentId, source, msDuration: Date.now() - startedAt }) } catch {}
    return { alreadyFinalized: false }
  }

  /**
   * Finalization sweeper: recover SUCCESS Tap & Leave payments that missed finalization.
   * Safe to call multiple times (idempotent via rawStatus.finalizedAt).
   */
  static async runSweeper(): Promise<{ processed: number; skipped: number }> {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000)
    const candidates = await prisma.paymentTransaction.findMany({
      where: { status: 'SUCCESS' as any, gateway: 'INTOUCH' as any, updatedAt: { lt: twoMinutesAgo } },
      take: 50,
      orderBy: { updatedAt: 'asc' },
    })

    let processed = 0
    let skipped = 0
    for (const p of candidates) {
      if (processed >= 20) break
      const rawReq: any = p.rawRequest || {}
      const rawStatus: any = p.rawStatus || {}
      if (!rawReq.sessionId || !rawReq.slipId) { skipped++; continue }
      if (rawStatus.finalizedAt) { skipped++; continue }
      try {
        await TapLeaveFinalizationService.finalize(p.id, 'sweeper' as any)
        processed++
      } catch (err) {
        logger.error('[Tap&Leave Sweeper] finalization error', { paymentId: p.id, error: String(err) })
        skipped++
      }
    }
    return { processed, skipped }
  }

  /**
   * Reconciler: polls pending InTouch transactions and resolves them.
   * Handles success → finalize, failure → mark failed, timeout → mark failed.
   */
  static async reconcilePendingPayments(): Promise<{ resolved: number; timedOut: number; failed: number }> {
    const now = new Date()
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
    const pending = await prisma.paymentTransaction.findMany({
      where: { status: 'PENDING' as any, gateway: 'INTOUCH' as any, createdAt: { gte: twoHoursAgo } },
    })

    let resolved = 0, timedOut = 0, failed = 0
    for (const p of pending) {
      const meta: any = p.rawRequest || {}
      const slipId: string | undefined = meta.slipId
      const sessionId: string | undefined = meta.sessionId
      if (!slipId || !sessionId) continue

      try {
        const status = await InTouchService.getPaymentStatus(p.transactionId)
        const isSuccess = InTouchService.isSuccess(status.responsecode)
        const isPending = InTouchService.isPending(status.responsecode)

        if (isSuccess) {
          await prisma.paymentTransaction.update({
            where: { id: p.id },
            data: { status: 'SUCCESS' as any, paidAt: new Date(), rawStatus: { ...(p.rawStatus as any), reconciled: status } },
          })
          await ensurePaymentLedgerEvent(p.id, 'SUCCESS', { source: 'tap-leave/reconciler', responsecode: status.responsecode })
          await TapLeaveFinalizationService.finalize(p.id, 'cron')
          resolved++
          continue
        }

        if (!isPending) {
          await prisma.paymentTransaction.update({
            where: { id: p.id },
            data: { status: 'FAILED' as any, rawStatus: { ...(p.rawStatus as any), reconciled: status } },
          })
          await ensurePaymentLedgerEvent(p.id, 'FAILED', { source: 'tap-leave/reconciler', responsecode: status.responsecode })
          await DiningSessionSlipService.markPaymentFailed(slipId, p.id, InTouchService.getErrorMessage(status.responsecode))
          failed++
          continue
        }

        const ageMs = now.getTime() - new Date(p.createdAt).getTime()
        if (ageMs > 5 * 60 * 1000) {
          await prisma.paymentTransaction.update({
            where: { id: p.id },
            data: { status: 'FAILED' as any, rawStatus: { ...(p.rawStatus as any), timeout: true } },
          })
          await ensurePaymentLedgerEvent(p.id, 'FAILED', { source: 'tap-leave/reconciler', timeout: true })
          await DiningSessionSlipService.markPaymentFailed(slipId, p.id, 'Payment timeout (reconciler)')
          timedOut++
        }
      } catch (err) {
        logger.error('[Tap&Leave Reconciler] error', { paymentId: p.id, error: String(err) })
      }
    }
    return { resolved, timedOut, failed }
  }
}
