import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

const log = logger.child({ service: 'reconciliation' })

export class ReconciliationService {
  static async runNightlyReconciliation(): Promise<{ checked: number; mismatches: number; fixed: number }> {
    log.info('Starting nightly reconciliation')
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
    let checked = 0
    let mismatches = 0
    let fixed = 0

    const pending = await prisma.paymentTransaction.findMany({
      where: {
        status: { in: ['PENDING', 'PROCESSING'] },
        createdAt: { lte: cutoff },
      },
      select: {
        id: true,
        businessId: true,
        invoiceNumber: true,
        transactionId: true,
        amountCents: true,
        gateway: true,
        expiryAt: true,
      },
    })

    for (const tx of pending) {
      checked++
      try {
        const isExpired = tx.expiryAt && new Date(tx.expiryAt) < new Date()
        if (isExpired) {
          await prisma.paymentTransaction.update({
            where: { id: tx.id },
            data: { status: 'CANCELLED' },
          })
          await prisma.reconciliationLog.create({
            data: {
              businessId: tx.businessId,
              transactionId: tx.transactionId,
              invoiceNumber: tx.invoiceNumber,
              status: 'EXPIRED',
              expectedAmountCents: tx.amountCents,
              notes: 'Auto-expired by reconciliation job',
            },
          })
          mismatches++
          log.info('Transaction expired', { transactionId: tx.transactionId })
        } else {
          await prisma.reconciliationLog.create({
            data: {
              businessId: tx.businessId,
              transactionId: tx.transactionId,
              invoiceNumber: tx.invoiceNumber,
              status: 'STILL_PENDING',
              expectedAmountCents: tx.amountCents,
              notes: 'Transaction still pending after 24h — manual review required',
            },
          })
          mismatches++
        }
      } catch (err) {
        log.error('Reconciliation error for transaction', { transactionId: tx.transactionId, error: String(err) })
      }
    }

    // Check for payment-order mismatches (CRITICAL)
    const completedPayments = await prisma.paymentTransaction.findMany({
      where: {
        status: 'SUCCESS',
        createdAt: { gte: cutoff },
      },
      select: {
        id: true,
        businessId: true,
        invoiceNumber: true,
        transactionId: true,
        amountCents: true,
      },
    })

    for (const payment of completedPayments) {
      checked++
      try {
        // Extract order number from invoice (format: INV-ORD-XXX)
        const orderNumber = payment.invoiceNumber.replace('INV-', '')
        
        const sale = await prisma.sale.findFirst({
          where: { orderNumber },
          select: {
            id: true,
            paymentStatus: true,
            isPaid: true,
            totalAmountCents: true,
          },
        })

        if (!sale) {
          // Payment exists but no matching order
          await prisma.reconciliationLog.create({
            data: {
              businessId: payment.businessId,
              transactionId: payment.transactionId,
              invoiceNumber: payment.invoiceNumber,
              status: 'AMOUNT_MISMATCH',
              expectedAmountCents: payment.amountCents,
              notes: 'Payment COMPLETED but order not found',
            },
          })
          mismatches++
          log.warn('Payment without order', { transactionId: payment.transactionId })
          continue
        }

        // Check if order is marked as paid
        if (sale.paymentStatus !== 'PAID' || !sale.isPaid) {
          // CRITICAL: Payment succeeded but order not updated
          log.warn('Payment-order mismatch detected - auto-fixing', {
            transactionId: payment.transactionId,
            orderNumber,
          })

          // Auto-fix: Update order to PAID
          await prisma.sale.update({
            where: { id: sale.id },
            data: {
              paymentStatus: 'PAID',
              isPaid: true,
            },
          })

          await prisma.reconciliationLog.create({
            data: {
              businessId: payment.businessId,
              transactionId: payment.transactionId,
              invoiceNumber: payment.invoiceNumber,
              status: 'AMOUNT_MISMATCH',
              expectedAmountCents: payment.amountCents,
              actualAmountCents: sale.totalAmountCents,
              notes: 'Payment COMPLETED but order was PENDING - auto-fixed',
              resolvedAt: new Date(),
            },
          })

          mismatches++
          fixed++
          log.info('Payment-order mismatch auto-fixed', { orderNumber })
        }

        // Check amount matches
        if (sale.totalAmountCents !== payment.amountCents) {
          await prisma.reconciliationLog.create({
            data: {
              businessId: payment.businessId,
              transactionId: payment.transactionId,
              invoiceNumber: payment.invoiceNumber,
              status: 'AMOUNT_MISMATCH',
              expectedAmountCents: payment.amountCents,
              actualAmountCents: sale.totalAmountCents,
              notes: 'Payment amount does not match order total - manual review required',
            },
          })
          mismatches++
          log.warn('Amount mismatch', {
            transactionId: payment.transactionId,
            expected: payment.amountCents,
            actual: sale.totalAmountCents,
          })
        }
      } catch (err) {
        log.error('Reconciliation error for payment', {
          transactionId: payment.transactionId,
          error: String(err),
        })
      }
    }

    log.info('Reconciliation complete', { checked, mismatches, fixed })
    return { checked, mismatches, fixed }
  }

  static async getMismatches(businessId?: string) {
    return prisma.reconciliationLog.findMany({
      where: {
        ...(businessId ? { businessId } : {}),
        resolvedAt: null,
        status: { in: ['STILL_PENDING', 'EXPIRED', 'AMOUNT_MISMATCH'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
  }

  static async resolveLog(logId: string, notes?: string) {
    return prisma.reconciliationLog.update({
      where: { id: logId },
      data: { resolvedAt: new Date(), notes },
    })
  }
}
