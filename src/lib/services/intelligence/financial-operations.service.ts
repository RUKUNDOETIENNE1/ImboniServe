/**
 * Financial Operations Service
 * 
 * Purpose: Operational efficiency and money leakage detection
 * Governance: Delegates to existing watchdog services
 * 
 * Answers: "Where are we losing money operationally?"
 */

import { PaymentWatchdogService } from '../watchdog/payment-watchdog.service'
import { ReconciliationWatchdogService } from '../watchdog/reconciliation-watchdog.service'
import { prisma } from '@/lib/prisma'
import { subDays } from 'date-fns'

export interface FinancialOperationsIntelligence {
  reconciliation: {
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL'
    unreconciledItems: number
    settlementDelayDays: number
    available: boolean // False until schema supports
  }
  payments: {
    successRate: number
    successRateStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL'
    providerHealth: {
      mtn: 'HEALTHY' | 'WARNING' | 'CRITICAL'
      airtel: 'HEALTHY' | 'WARNING' | 'CRITICAL'
    }
    revenueProtection: {
      failedPaymentImpact: number
      retrySuccessRate: number
    }
  }
}

export class FinancialOperationsService {
  /**
   * Get comprehensive financial operations intelligence
   */
  static async getIntelligence(): Promise<FinancialOperationsIntelligence> {
    const [reconciliationHealth, paymentHealth, paymentMetrics] = await Promise.all([
      ReconciliationWatchdogService.getHealth(),
      PaymentWatchdogService.getHealth(),
      this.getPaymentMetrics()
    ])

    // Reconciliation metrics require schema updates
    const reconciliation = {
      status: reconciliationHealth.status,
      unreconciledItems: 0,
      settlementDelayDays: 0,
      available: false
    }

    // Payment operations
    const payments = {
      successRate: paymentMetrics.successRate,
      successRateStatus: this.getPaymentSuccessStatus(paymentMetrics.successRate),
      providerHealth: {
        mtn: paymentHealth.status, // Simplified - would need provider-specific health
        airtel: paymentHealth.status
      },
      revenueProtection: {
        failedPaymentImpact: paymentMetrics.failedPaymentImpact,
        retrySuccessRate: paymentMetrics.retrySuccessRate
      }
    }

    return {
      reconciliation,
      payments
    }
  }

  /**
   * Get payment metrics (success rate, failed payment impact)
   * Per KPI_CATALOG_V2.md line 381-406
   */
  private static async getPaymentMetrics(): Promise<{
    successRate: number
    failedPaymentImpact: number
    retrySuccessRate: number
  }> {
    const last30Days = subDays(new Date(), 30)

    // Get payment success rate from FinancialLedgerEntry
    const [successfulPayments, totalPayments] = await Promise.all([
      prisma.financialLedgerEntry.count({
        where: {
          eventType: 'PAYMENT_SUCCESS',
          occurredAt: { gte: last30Days }
        }
      }),
      prisma.financialLedgerEntry.count({
        where: {
          eventType: { in: ['PAYMENT_SUCCESS', 'PAYMENT_FAILED'] },
          occurredAt: { gte: last30Days }
        }
      })
    ])

    const successRate = totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 100

    // Get failed payment revenue impact
    const failedPaymentsResult = await prisma.financialLedgerEntry.aggregate({
      where: {
        eventType: 'PAYMENT_FAILED',
        occurredAt: { gte: last30Days }
      },
      _sum: { amountCents: true }
    })

    const failedPaymentImpact = (failedPaymentsResult._sum.amountCents || 0) / 100

    // Retry success rate (simplified - would need retry tracking)
    const retrySuccessRate = 0

    return {
      successRate,
      failedPaymentImpact,
      retrySuccessRate
    }
  }

  /**
   * Determine payment success rate status
   * Per KPI_CATALOG_V2.md: WARN < 95%, CRITICAL < 90%
   */
  private static getPaymentSuccessStatus(rate: number): 'HEALTHY' | 'WARNING' | 'CRITICAL' {
    if (rate < 90) return 'CRITICAL'
    if (rate < 95) return 'WARNING'
    return 'HEALTHY'
  }
}
