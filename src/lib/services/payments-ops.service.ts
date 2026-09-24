import { prisma } from '@/lib/prisma'
import { PaymentGateway, PaymentTransactionStatus, BillingEventType, LedgerDomain } from '@prisma/client'

export class PaymentsOpsService {
  static async getRevenueMetrics() {
    // Use FinancialLedgerEntry SUCCESS events as the truth for revenue
    const [marketplaceSum, subscriptionSum] = await Promise.all([
      prisma.financialLedgerEntry.aggregate({
        _sum: { amountCents: true },
        where: { domain: LedgerDomain.MARKETPLACE, eventType: BillingEventType.PAYMENT_SUCCESS },
      }),
      prisma.financialLedgerEntry.aggregate({
        _sum: { amountCents: true },
        where: { domain: LedgerDomain.SUBSCRIPTION, eventType: BillingEventType.PAYMENT_SUCCESS },
      }),
    ])

    return {
      salesRevenueCents: 0, // not yet modeled in ledger; can be added later under PLATFORM or dedicated domain
      marketplaceRevenueCents: marketplaceSum._sum.amountCents || 0,
      subscriptionRevenueCents: subscriptionSum._sum.amountCents || 0,
    }
  }

  static async getPaymentMetrics(hours: number = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000)

    const statuses: PaymentTransactionStatus[] = [PaymentTransactionStatus.PENDING, PaymentTransactionStatus.PROCESSING, PaymentTransactionStatus.SUCCESS, PaymentTransactionStatus.FAILED, PaymentTransactionStatus.CANCELLED, PaymentTransactionStatus.REFUNDED]
    const gateways: PaymentGateway[] = [PaymentGateway.INTOUCH, PaymentGateway.IREMBO_PAY]

    // Derive from ledger entries that reflect payments
    const countsByStatus: Record<string, number> = {}
    for (const s of statuses) {
      countsByStatus[s] = await prisma.financialLedgerEntry.count({ where: { status: s, occurredAt: { gte: since } } })
    }

    const countsByGateway: Record<string, number> = {}
    for (const g of gateways) {
      countsByGateway[g] = await prisma.financialLedgerEntry.count({ where: { gateway: g, occurredAt: { gte: since } } })
    }

    return { since, countsByStatus, countsByGateway }
  }

  static async getProviderHealth() {
    const providers: PaymentGateway[] = [PaymentGateway.INTOUCH, PaymentGateway.IREMBO_PAY]
    const now = Date.now()
    const oneDayMs = 24 * 60 * 60 * 1000
    const oneHourAgo = new Date(now - 60 * 60 * 1000)

    const health = [] as Array<{
      provider: PaymentGateway
      lastWebhookAt?: Date
      healthy: boolean
      failureRate1h: number
      totals1h: { total: number; failed: number }
    }>

    for (const p of providers) {
      // Only consider webhook-driven events: processing/success/failed/cancelled/refunded
      const webhookEventFilter = {
        in: [
          BillingEventType.PAYMENT_PROCESSING,
          BillingEventType.PAYMENT_SUCCESS,
          BillingEventType.PAYMENT_FAILED,
          BillingEventType.PAYMENT_CANCELLED,
          BillingEventType.PAYMENT_REFUNDED,
        ],
      }
      const lastLedger = await prisma.financialLedgerEntry.findFirst({
        where: { gateway: p, eventType: webhookEventFilter },
        orderBy: { occurredAt: 'desc' },
        select: { occurredAt: true },
      })

      const [total1h, failed1h] = await Promise.all([
        prisma.financialLedgerEntry.count({ where: { gateway: p, occurredAt: { gte: oneHourAgo }, eventType: webhookEventFilter } }),
        prisma.financialLedgerEntry.count({ where: { gateway: p, occurredAt: { gte: oneHourAgo }, status: PaymentTransactionStatus.FAILED, eventType: webhookEventFilter } }),
      ])

      const fr = total1h > 0 ? failed1h / total1h : 0
      const healthy = !!lastLedger && now - lastLedger.occurredAt.getTime() < oneDayMs && fr < 0.5

      health.push({
        provider: p,
        lastWebhookAt: lastLedger?.occurredAt,
        healthy,
        failureRate1h: fr,
        totals1h: { total: total1h, failed: failed1h },
      })
    }

    return { providers: health }
  }

  static async getRecentWebhooks(limit: number = 100) {
    return prisma.paymentTransaction.findMany({
      where: { webhookVerified: true },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        transactionId: true,
        referenceId: true,
        gateway: true,
        status: true,
        webhookTimestamp: true,
        updatedAt: true,
        marketplaceOrderId: true,
        subscriptionId: true,
      },
    })
  }

  static async getBillingEventStream(limit: number = 200) {
    return prisma.billingEvent.findMany({ orderBy: { occurredAt: 'desc' }, take: limit })
  }

  static async getAlerts() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    const [failed1h, total1h, processingAged] = await Promise.all([
      prisma.financialLedgerEntry.count({ where: { status: PaymentTransactionStatus.FAILED, occurredAt: { gte: oneHourAgo } } }),
      prisma.financialLedgerEntry.count({ where: { occurredAt: { gte: oneHourAgo } } }),
      prisma.financialLedgerEntry.findMany({
        where: { status: PaymentTransactionStatus.PROCESSING, occurredAt: { lt: new Date(Date.now() - 30 * 60 * 1000) } },
        select: { id: true, paymentTransactionId: true, gateway: true, occurredAt: true },
        take: 50,
      }),
    ])

    const alerts: Array<{ severity: 'info' | 'warn' | 'error'; title: string; details?: any }> = []

    if (failed1h > 10) {
      alerts.push({ severity: 'warn', title: 'High payment failure volume in last hour', details: { failed1h } })
    }
    const failureRate = total1h > 0 ? failed1h / total1h : 0
    if (failureRate >= 0.5 && total1h >= 10) {
      alerts.push({ severity: 'error', title: 'High payment failure rate in last hour', details: { failed1h, total1h, failureRate } })
    }
    if (processingAged.length > 0) {
      alerts.push({ severity: 'warn', title: 'Stuck processing transactions (>30m)', details: { count: processingAged.length, examples: processingAged } })
    }

    const health = await this.getProviderHealth()
    for (const h of health.providers) {
      if (!h.healthy) {
        alerts.push({ severity: 'error', title: `Provider ${h.provider} health degraded`, details: h })
      }
    }

    return { alerts }
  }
}
