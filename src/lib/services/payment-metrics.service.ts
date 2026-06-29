import { prisma } from '@/lib/prisma'
import { PaymentTransactionStatus } from '@prisma/client'

type SourceKey = 'webhook' | 'poll' | 'cron' | 'sweeper' | 'unknown'

export class PaymentMetricsService {
  static startOfToday(): Date {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }

  static async getDailyPaymentMetrics() {
    const start = this.startOfToday()
    const now = new Date()
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000)

    const [totalPaidToday, failedToday, pendingOver10] = await Promise.all([
      prisma.paymentTransaction.count({ where: { status: PaymentTransactionStatus.SUCCESS, paidAt: { gte: start } } }),
      prisma.paymentTransaction.count({ where: { status: PaymentTransactionStatus.FAILED, updatedAt: { gte: start } } }),
      prisma.paymentTransaction.count({ where: { status: PaymentTransactionStatus.PENDING, createdAt: { lt: tenMinutesAgo } } }),
    ])

    // Compute average finalize delay for today's SUCCESS payments (ms)
    const paidWithFinalize = await prisma.paymentTransaction.findMany({
      where: { status: PaymentTransactionStatus.SUCCESS, paidAt: { gte: start } },
      select: { paidAt: true, rawStatus: true },
      take: 500,
      orderBy: { paidAt: 'desc' },
    })

    let sum = 0
    let cnt = 0
    for (const p of paidWithFinalize) {
      const rs: any = p.rawStatus || {}
      if (p.paidAt && rs.finalizedAt) {
        const delay = new Date(rs.finalizedAt).getTime() - new Date(p.paidAt).getTime()
        if (Number.isFinite(delay)) {
          sum += Math.max(0, delay)
          cnt += 1
        }
      }
    }
    const avgFinalizeDelayMs = cnt > 0 ? Math.round(sum / cnt) : 0

    return { totalPaidToday, failedToday, pendingOver10, avgFinalizeDelayMs }
  }

  static async getFinalizationSourceBreakdown() {
    const start = this.startOfToday()
    const paid = await prisma.paymentTransaction.findMany({
      where: { status: PaymentTransactionStatus.SUCCESS, paidAt: { gte: start } },
      select: { rawStatus: true },
      take: 1000,
      orderBy: { paidAt: 'desc' },
    })

    const breakdown: Record<SourceKey, number> = { webhook: 0, poll: 0, cron: 0, sweeper: 0, unknown: 0 }
    for (const p of paid) {
      const src = (p.rawStatus as any)?.finalizedSource as SourceKey | undefined
      if (src === 'webhook' || src === 'poll' || src === 'cron' || src === 'sweeper') breakdown[src] += 1
      else breakdown.unknown += 1
    }
    return breakdown
  }

  static async getStuckPayments() {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
    const rows = await prisma.paymentTransaction.findMany({
      where: { status: PaymentTransactionStatus.PENDING, createdAt: { lt: tenMinutesAgo } },
      select: { id: true, transactionId: true, createdAt: true, gateway: true, payerPhone: true },
      orderBy: { createdAt: 'asc' },
      take: 50,
    })

    const now = Date.now()
    return rows.map(r => ({
      id: r.id,
      transactionId: r.transactionId,
      ageMinutes: Math.round((now - new Date(r.createdAt).getTime()) / 60000),
      gateway: r.gateway,
      payerPhone: r.payerPhone,
    }))
  }

  static async getRecentFailures() {
    const start = this.startOfToday()
    const rows = await prisma.paymentTransaction.findMany({
      where: { status: PaymentTransactionStatus.FAILED, updatedAt: { gte: start } },
      select: { id: true, transactionId: true, updatedAt: true, rawStatus: true, payerPhone: true },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    })

    return rows.map(r => ({
      id: r.id,
      transactionId: r.transactionId,
      failedAt: r.updatedAt,
      reason: (r.rawStatus as any)?.reconciled?.responsemsg || (r.rawStatus as any)?.error || null,
      payerPhone: r.payerPhone,
    }))
  }
}
