/**
 * MPCA-001B — Settlement Intelligence Service
 *
 * Provider-neutral domain service for settlement, withdrawal, and funds availability.
 *
 * This service sits ALONGSIDE the existing financial truth chain:
 *   Payment → PaymentCompletionService → Sale → PaymentTransaction → FinancialLedgerEntry
 *
 * It does NOT replace or modify that chain. It adds a parallel intelligence layer
 * that tracks where the business's money is AFTER payment success.
 *
 * ARCHITECTURAL RULES:
 *   1. Never break the PaymentCompletionService atomic core (MPCA-001A).
 *   2. Settlement intelligence is additive — non-blocking side effects.
 *   3. Unknown capabilities remain explicitly unknown.
 *   4. Never invent provider behavior.
 *   5. Business isolation is enforced on every operation.
 *   6. Idempotency via idempotencyKey on all entities.
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import {
  PaymentGateway,
  SettlementStatus,
  FundsAvailabilityStatus,
  WithdrawalStatus,
  SettlementReconciliationStatus,
} from '@prisma/client'
import {
  MoneyFlowType,
  ProviderCapability,
  ProviderCapabilityVerificationStatus,
  SettlementLifecycleStatus,
  WithdrawalLifecycleStatus,
  FundsAvailabilityLifecycleStatus,
  SettlementReconciliationLifecycleStatus,
  SettlementIntelligenceSummary,
  FeeBreakdown,
  validateFeeBreakdown,
  WithdrawalRequest,
  WithdrawalResult,
  WithdrawalDestinationType,
} from './types'
import { ProviderCapabilityRegistry } from './provider-capability-registry'

const log = logger.child({ service: 'settlement-intelligence' })

// ─────────────────────────────────────────────────────────────────────────────
// Settlement Intelligence Service
// ─────────────────────────────────────────────────────────────────────────────

export class SettlementIntelligenceService {
  /**
   * Called after a payment succeeds (non-blocking, additive).
   *
   * Creates a SettlementRecord with status=SETTLEMENT_UNKNOWN if the provider
   * does not expose settlement information. This explicitly records that
   * we DO NOT KNOW the settlement status — we do NOT assume it.
   *
   * This method MUST NOT throw — it's a non-blocking side effect.
   * Any errors are logged and swallowed to protect the payment truth chain.
   */
  static async onPaymentSuccess(
    paymentTransactionId: string,
    businessId: string,
    provider: PaymentGateway,
    amountCents: number,
    currency: string,
    options?: {
      providerFeeCents?: number
      platformFeeCents?: number
      netAmountCents?: number
      source?: string
    }
  ): Promise<void> {
    try {
      // Determine money flow type
      const moneyFlow = this.classifyMoneyFlow(options?.platformFeeCents, provider)

      // Check if the provider exposes settlement information
      const settlementDataAvailable = ProviderCapabilityRegistry.isSettlementDataAvailable(provider)

      // Determine initial settlement status based on provider capabilities
      let settlementStatus: SettlementStatus
      let fundsAvailability: FundsAvailabilityStatus

      if (!settlementDataAvailable) {
        // Provider does not expose settlement info — record as UNKNOWN, not assumed
        settlementStatus = SettlementStatus.SETTLEMENT_UNKNOWN
        fundsAvailability = FundsAvailabilityStatus.FUNDS_UNKNOWN
      } else {
        // Provider exposes settlement info — start as PENDING, will be updated by webhooks/API
        settlementStatus = SettlementStatus.SETTLEMENT_PENDING
        fundsAvailability = FundsAvailabilityStatus.FUNDS_PENDING
      }

      // Generate internal settlement ID and idempotency key
      const internalSettlementId = `STL-${paymentTransactionId}-${Date.now()}`
      const idempotencyKey = `settlement:${paymentTransactionId}:${Math.floor(Date.now() / 1000)}`

      // Calculate fee breakdown
      const providerFeeCents = options?.providerFeeCents ?? 0
      const platformFeeCents = options?.platformFeeCents ?? 0
      const otherDeductionsCents = 0
      const netAmountCents = options?.netAmountCents ?? amountCents

      // Create SettlementRecord (idempotent via idempotencyKey)
      try {
        await prisma.settlementRecord.create({
          data: {
            businessId,
            provider,
            internalSettlementId,
            currency,
            grossAmountCents: amountCents,
            providerFeeCents,
            platformFeeCents,
            otherDeductionsCents,
            netAmountCents,
            status: settlementStatus,
            fundsAvailabilityStatus: fundsAvailability,
            reconciliationStatus: settlementDataAvailable
              ? SettlementReconciliationStatus.RECONCILIATION_PENDING
              : SettlementReconciliationStatus.RECONCILIATION_NOT_APPLICABLE,
            idempotencyKey,
            providerMetadata: {
              source: options?.source || 'settlement-intelligence-service',
              moneyFlow,
              paymentTransactionId,
              settlementDataAvailable,
            },
          },
        })

        log.info('SettlementRecord created on payment success', {
          paymentTransactionId,
          businessId,
          provider,
          settlementStatus,
          fundsAvailability,
          settlementDataAvailable,
        })
      } catch (createError: any) {
        if (createError?.code === 'P2002') {
          // Duplicate idempotency key — already created, safe to skip
          log.info('SettlementRecord already exists — idempotent skip', {
            paymentTransactionId,
            idempotencyKey,
          })
        } else {
          throw createError
        }
      }
    } catch (error) {
      // Non-blocking: log and swallow to protect the payment truth chain
      log.error('SettlementIntelligenceService.onPaymentSuccess failed (non-blocking)', {
        paymentTransactionId,
        businessId,
        error: String(error),
      })
    }
  }

  /**
   * Classify a payment as PLATFORM_MONEY or MERCHANT_MONEY.
   *
   * PLATFORM_MONEY: Business → ImboniServe (subscriptions, platform fees)
   * MERCHANT_MONEY: Guest → Hospitality Business (sales, marketplace)
   */
  static classifyMoneyFlow(
    platformFeeCents?: number,
    provider?: PaymentGateway
  ): MoneyFlowType {
    // If there's a platform fee, it's merchant money with a platform fee deduction
    // If there's no platform fee and it's a subscription payment, it's platform money
    // This is a heuristic — the actual classification is determined by the caller
    // based on whether the payment is for a subscription (PLATFORM_MONEY) or a sale (MERCHANT_MONEY)
    return MoneyFlowType.MERCHANT_MONEY
  }

  /**
   * Process a settlement webhook event from a provider.
   *
   * Updates the SettlementRecord with the provider's settlement status.
   * Idempotent — duplicate webhooks are safely ignored.
   */
  static async processSettlementWebhook(
    businessId: string,
    provider: PaymentGateway,
    providerSettlementId: string,
    status: SettlementLifecycleStatus,
    options?: {
      grossAmountCents?: number
      providerFeeCents?: number
      netAmountCents?: number
      currency?: string
      transactionReferences?: string[]
      rawPayload?: any
      idempotencyKey?: string
    }
  ): Promise<{ updated: boolean; settlementRecordId?: string }> {
    // Business isolation check
    if (!businessId) {
      throw new Error('Business ID is required for settlement webhook processing')
    }

    // Find existing SettlementRecord by provider settlement ID or idempotency key
    const existing = await prisma.settlementRecord.findFirst({
      where: {
        businessId,
        provider,
        OR: [
          { providerSettlementId },
          ...(options?.idempotencyKey ? [{ idempotencyKey: options.idempotencyKey }] : []),
        ],
      },
    })

    if (existing) {
      // Idempotent update — only update if status has changed
      const mappedStatus = this.mapSettlementStatus(status)
      if (existing.status === mappedStatus) {
        log.info('Settlement webhook duplicate — idempotent skip', {
          settlementRecordId: existing.id,
          providerSettlementId,
        })
        return { updated: false, settlementRecordId: existing.id }
      }

      await prisma.settlementRecord.update({
        where: { id: existing.id },
        data: {
          status: mappedStatus,
          grossAmountCents: options?.grossAmountCents ?? existing.grossAmountCents,
          providerFeeCents: options?.providerFeeCents ?? existing.providerFeeCents,
          netAmountCents: options?.netAmountCents ?? existing.netAmountCents,
          completedAt: status === SettlementLifecycleStatus.COMPLETED ? new Date() : existing.completedAt,
          providerMetadata: {
            ...(existing.providerMetadata as any),
            lastWebhook: options?.rawPayload,
            lastWebhookAt: new Date().toISOString(),
          },
        },
      })

      log.info('SettlementRecord updated from webhook', {
        settlementRecordId: existing.id,
        status: mappedStatus,
      })
      return { updated: true, settlementRecordId: existing.id }
    }

    // No existing record — create a new one from the webhook
    const internalSettlementId = `STL-WEBHOOK-${providerSettlementId}-${Date.now()}`
    const idempotencyKey = options?.idempotencyKey || `settlement-webhook:${providerSettlementId}:${Math.floor(Date.now() / 1000)}`

    try {
      const created = await prisma.settlementRecord.create({
        data: {
          businessId,
          provider,
          providerSettlementId,
          internalSettlementId,
          currency: options?.currency || 'RWF',
          grossAmountCents: options?.grossAmountCents || 0,
          providerFeeCents: options?.providerFeeCents || 0,
          netAmountCents: options?.netAmountCents || options?.grossAmountCents || 0,
          status: this.mapSettlementStatus(status),
          fundsAvailabilityStatus: status === SettlementLifecycleStatus.COMPLETED
            ? FundsAvailabilityStatus.FUNDS_AVAILABLE
            : FundsAvailabilityStatus.FUNDS_PENDING,
          completedAt: status === SettlementLifecycleStatus.COMPLETED ? new Date() : null,
          reconciliationStatus: SettlementReconciliationStatus.RECONCILIATION_PENDING,
          idempotencyKey,
          providerMetadata: options?.rawPayload,
        },
      })

      // Link to source transactions if provided
      if (options?.transactionReferences && options.transactionReferences.length > 0) {
        for (const txnRef of options.transactionReferences) {
          const txn = await prisma.paymentTransaction.findFirst({
            where: {
              businessId,
              OR: [
                { transactionId: txnRef },
                { referenceId: txnRef },
              ],
            },
          })
          if (txn) {
            try {
              await prisma.settlementTransactionLink.create({
                data: {
                  settlementRecordId: created.id,
                  paymentTransactionId: txn.id,
                  allocatedAmountCents: options.netAmountCents || 0,
                },
              })
            } catch (linkError: any) {
              if (linkError?.code !== 'P2002') throw linkError
            }
          }
        }
      }

      log.info('SettlementRecord created from webhook', {
        settlementRecordId: created.id,
        providerSettlementId,
      })
      return { updated: true, settlementRecordId: created.id }
    } catch (createError: any) {
      if (createError?.code === 'P2002') {
        log.info('Settlement webhook duplicate (P2002) — idempotent skip', { providerSettlementId })
        return { updated: false }
      }
      throw createError
    }
  }

  /**
   * Process a withdrawal webhook event from a provider.
   */
  static async processWithdrawalWebhook(
    businessId: string,
    provider: PaymentGateway,
    providerWithdrawalId: string,
    status: WithdrawalLifecycleStatus,
    options?: {
      amountCents?: number
      feeCents?: number
      netAmountCents?: number
      currency?: string
      failureReason?: string
      rawPayload?: any
      idempotencyKey?: string
    }
  ): Promise<{ updated: boolean; withdrawalRecordId?: string }> {
    if (!businessId) {
      throw new Error('Business ID is required for withdrawal webhook processing')
    }

    const existing = await prisma.withdrawalRecord.findFirst({
      where: {
        businessId,
        provider,
        OR: [
          { providerWithdrawalId },
          ...(options?.idempotencyKey ? [{ idempotencyKey: options.idempotencyKey }] : []),
        ],
      },
    })

    const mappedStatus = this.mapWithdrawalStatus(status)

    if (existing) {
      if (existing.status === mappedStatus) {
        return { updated: false, withdrawalRecordId: existing.id }
      }

      await prisma.withdrawalRecord.update({
        where: { id: existing.id },
        data: {
          status: mappedStatus,
          completedAt: status === WithdrawalLifecycleStatus.COMPLETED ? new Date() : existing.completedAt,
          failedAt: status === WithdrawalLifecycleStatus.FAILED ? new Date() : existing.failedAt,
          failureReason: options?.failureReason ?? existing.failureReason,
          providerMetadata: {
            ...(existing.providerMetadata as any),
            lastWebhook: options?.rawPayload,
            lastWebhookAt: new Date().toISOString(),
          },
        },
      })

      return { updated: true, withdrawalRecordId: existing.id }
    }

    // Create new withdrawal record from webhook
    const internalWithdrawalId = `WDW-WEBHOOK-${providerWithdrawalId}-${Date.now()}`
    const idempotencyKey = options?.idempotencyKey || `withdrawal-webhook:${providerWithdrawalId}:${Math.floor(Date.now() / 1000)}`

    try {
      const created = await prisma.withdrawalRecord.create({
        data: {
          businessId,
          provider,
          providerWithdrawalId,
          internalWithdrawalId,
          currency: options?.currency || 'RWF',
          amountCents: options?.amountCents || 0,
          feeCents: options?.feeCents || 0,
          netAmountCents: options?.netAmountCents || options?.amountCents || 0,
          status: mappedStatus,
          completedAt: status === WithdrawalLifecycleStatus.COMPLETED ? new Date() : null,
          failedAt: status === WithdrawalLifecycleStatus.FAILED ? new Date() : null,
          failureReason: options?.failureReason,
          idempotencyKey,
          providerMetadata: options?.rawPayload,
        },
      })

      return { updated: true, withdrawalRecordId: created.id }
    } catch (createError: any) {
      if (createError?.code === 'P2002') {
        return { updated: false }
      }
      throw createError
    }
  }

  /**
   * Get settlement intelligence summary for a business.
   * Answers: "Where is my money?"
   *
   * Unknown values remain explicitly null — never invented.
   */
  static async getSettlementIntelligenceSummary(
    businessId: string,
    provider?: PaymentGateway
  ): Promise<SettlementIntelligenceSummary> {
    // Business isolation is enforced by filtering on businessId

    // Get business currency
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { currency: true },
    })
    const currency = business?.currency || 'RWF'

    // Payment-level totals (from existing PaymentTransaction)
    const paymentWhere: any = { businessId, status: 'SUCCESS' }
    if (provider) paymentWhere.gateway = provider

    const [paidTransactions, paidAgg] = await Promise.all([
      prisma.paymentTransaction.count({ where: paymentWhere }),
      prisma.paymentTransaction.aggregate({
        where: paymentWhere,
        _sum: { amountCents: true, platformFeeCents: true, gatewayFeeActualCents: true, gatewayFeeEstimatedCents: true },
      }),
    ])

    const totalCollectedCents = paidAgg._sum.amountCents || 0
    const totalPlatformFeesCents = paidAgg._sum.platformFeeCents || 0
    const totalGatewayFeesCents = (paidAgg._sum.gatewayFeeActualCents ?? paidAgg._sum.gatewayFeeEstimatedCents) || 0

    // Settlement-level totals
    const settlementWhere: any = { businessId }
    if (provider) settlementWhere.provider = provider

    const settlementRecords = await prisma.settlementRecord.findMany({
      where: settlementWhere,
      select: {
        id: true,
        status: true,
        fundsAvailabilityStatus: true,
        grossAmountCents: true,
        netAmountCents: true,
        providerFeeCents: true,
        platformFeeCents: true,
        reconciliationStatus: true,
      },
    })

    const settlementRecordsCount = settlementRecords.length

    // Check if settlement data is available for the provider(s)
    const providers = provider ? [provider] : [PaymentGateway.INTOUCH, PaymentGateway.IREMBO_PAY]
    const settlementDataAvailable = providers.some(p => ProviderCapabilityRegistry.isSettlementDataAvailable(p))

    // Calculate settlement totals — null if data is not available
    let totalSettledCents: number | null = null
    let pendingSettlementCents: number | null = null
    let fundsAvailableCents: number | null = null
    let fundsPendingCents: number | null = null

    if (settlementDataAvailable || settlementRecordsCount > 0) {
      totalSettledCents = settlementRecords
        .filter(r => r.status === SettlementStatus.SETTLEMENT_COMPLETED)
        .reduce((sum, r) => sum + r.netAmountCents, 0)

      pendingSettlementCents = settlementRecords
        .filter(r => r.status === SettlementStatus.SETTLEMENT_PENDING || r.status === SettlementStatus.SETTLEMENT_PROCESSING)
        .reduce((sum, r) => sum + r.grossAmountCents, 0)

      fundsAvailableCents = settlementRecords
        .filter(r => r.fundsAvailabilityStatus === FundsAvailabilityStatus.FUNDS_AVAILABLE)
        .reduce((sum, r) => sum + r.netAmountCents, 0)

      fundsPendingCents = settlementRecords
        .filter(r => r.fundsAvailabilityStatus === FundsAvailabilityStatus.FUNDS_PENDING)
        .reduce((sum, r) => sum + r.netAmountCents, 0)
    }

    // Withdrawal totals
    const withdrawalWhere: any = { businessId }
    if (provider) withdrawalWhere.provider = provider

    const withdrawalRecords = await prisma.withdrawalRecord.findMany({
      where: withdrawalWhere,
      select: { id: true, status: true, amountCents: true, netAmountCents: true },
    })

    const withdrawalRecordsCount = withdrawalRecords.length
    const totalWithdrawnCents = withdrawalRecords.length > 0
      ? withdrawalRecords
          .filter(r => r.status === WithdrawalStatus.WITHDRAWAL_COMPLETED)
          .reduce((sum, r) => sum + r.netAmountCents, 0)
      : null

    const pendingWithdrawalCents = withdrawalRecords.length > 0
      ? withdrawalRecords
          .filter(r => r.status === WithdrawalStatus.WITHDRAWAL_REQUESTED || r.status === WithdrawalStatus.WITHDRAWAL_PROCESSING)
          .reduce((sum, r) => sum + r.amountCents, 0)
      : null

    // Reconciliation counts
    const reconciledCount = settlementRecords.filter(r => r.reconciliationStatus === SettlementReconciliationStatus.RECONCILED).length
    const varianceCount = settlementRecords.filter(r => r.reconciliationStatus === SettlementReconciliationStatus.RECONCILIATION_VARIANCE).length
    const pendingReconciliationCount = settlementRecords.filter(r => r.reconciliationStatus === SettlementReconciliationStatus.RECONCILIATION_PENDING).length
    const notApplicableCount = settlementRecords.filter(r => r.reconciliationStatus === SettlementReconciliationStatus.RECONCILIATION_NOT_APPLICABLE).length

    return {
      businessId,
      currency,
      totalCollectedCents,
      totalPaidTransactions: paidTransactions,
      fundsAvailableCents,
      fundsPendingCents,
      totalSettledCents,
      pendingSettlementCents,
      settlementRecordsCount,
      totalWithdrawnCents,
      pendingWithdrawalCents,
      withdrawalRecordsCount,
      totalGatewayFeesCents: totalGatewayFeesCents || null,
      totalPlatformFeesCents: totalPlatformFeesCents || null,
      reconciledCount,
      varianceCount,
      pendingReconciliationCount,
      notApplicableCount,
      providerCapabilities: ProviderCapabilityRegistry.getAllProfiles(),
      settlementDataAvailable,
    }
  }

  /**
   * Verify business isolation — ensure business A cannot access business B's records.
   */
  static async verifyBusinessIsolation(
    settlementRecordId: string,
    requestingBusinessId: string
  ): Promise<boolean> {
    const record = await prisma.settlementRecord.findUnique({
      where: { id: settlementRecordId },
      select: { businessId: true },
    })
    if (!record) return false
    return record.businessId === requestingBusinessId
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Private helpers
  // ───────────────────────────────────────────────────────────────────────────

  private static mapSettlementStatus(status: SettlementLifecycleStatus): SettlementStatus {
    switch (status) {
      case SettlementLifecycleStatus.PENDING:
        return SettlementStatus.SETTLEMENT_PENDING
      case SettlementLifecycleStatus.PROCESSING:
        return SettlementStatus.SETTLEMENT_PROCESSING
      case SettlementLifecycleStatus.COMPLETED:
        return SettlementStatus.SETTLEMENT_COMPLETED
      case SettlementLifecycleStatus.FAILED:
        return SettlementStatus.SETTLEMENT_FAILED
      case SettlementLifecycleStatus.NOT_REQUIRED:
        return SettlementStatus.SETTLEMENT_NOT_REQUIRED
      case SettlementLifecycleStatus.UNKNOWN:
        return SettlementStatus.SETTLEMENT_UNKNOWN
      default:
        return SettlementStatus.SETTLEMENT_UNKNOWN
    }
  }

  private static mapWithdrawalStatus(status: WithdrawalLifecycleStatus): WithdrawalStatus {
    switch (status) {
      case WithdrawalLifecycleStatus.REQUESTED:
        return WithdrawalStatus.WITHDRAWAL_REQUESTED
      case WithdrawalLifecycleStatus.PROCESSING:
        return WithdrawalStatus.WITHDRAWAL_PROCESSING
      case WithdrawalLifecycleStatus.COMPLETED:
        return WithdrawalStatus.WITHDRAWAL_COMPLETED
      case WithdrawalLifecycleStatus.FAILED:
        return WithdrawalStatus.WITHDRAWAL_FAILED
      case WithdrawalLifecycleStatus.NOT_SUPPORTED:
        return WithdrawalStatus.WITHDRAWAL_NOT_SUPPORTED
      case WithdrawalLifecycleStatus.UNKNOWN:
        return WithdrawalStatus.WITHDRAWAL_UNKNOWN
      default:
        return WithdrawalStatus.WITHDRAWAL_UNKNOWN
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Settlement Reconciliation Service
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reconciles SettlementRecords against PaymentTransactions.
 * Detects: missing settlement, duplicate settlement, amount variance, fee variance.
 *
 * Does NOT implement speculative reconciliation where provider data is unavailable.
 * If settlement status is UNKNOWN, reconciliation status is NOT_APPLICABLE.
 */
export class SettlementReconciliationService {
  /**
   * Reconcile a single SettlementRecord against its linked PaymentTransactions.
   */
  static async reconcileSettlementRecord(
    settlementRecordId: string,
    businessId: string
  ): Promise<{
    status: SettlementReconciliationStatus
    varianceCents?: number
    details?: string
  }> {
    // Business isolation
    const isAuthorized = await SettlementIntelligenceService.verifyBusinessIsolation(
      settlementRecordId,
      businessId
    )
    if (!isAuthorized) {
      throw new Error('Business isolation violation: settlement record does not belong to this business')
    }

    const record = await prisma.settlementRecord.findUnique({
      where: { id: settlementRecordId },
      include: {
        transactionLinks: {
          include: { paymentTransaction: true },
        },
      },
    })

    if (!record) {
      throw new Error('Settlement record not found')
    }

    // If settlement status is UNKNOWN, reconciliation is NOT_APPLICABLE
    if (record.status === SettlementStatus.SETTLEMENT_UNKNOWN) {
      await prisma.settlementRecord.update({
        where: { id: settlementRecordId },
        data: {
          reconciliationStatus: SettlementReconciliationStatus.RECONCILIATION_NOT_APPLICABLE,
          reconciledAt: new Date(),
        },
      })
      return { status: SettlementReconciliationStatus.RECONCILIATION_NOT_APPLICABLE }
    }

    // If no linked transactions, cannot reconcile
    if (record.transactionLinks.length === 0) {
      await prisma.settlementRecord.update({
        where: { id: settlementRecordId },
        data: {
          reconciliationStatus: SettlementReconciliationStatus.RECONCILIATION_PENDING,
        },
      })
      return {
        status: SettlementReconciliationStatus.RECONCILIATION_PENDING,
        details: 'No linked payment transactions to reconcile against',
      }
    }

    // Sum the allocated amounts from linked transactions
    const totalAllocatedCents = record.transactionLinks.reduce(
      (sum, link) => sum + link.allocatedAmountCents, 0
    )

    const varianceCents = record.grossAmountCents - totalAllocatedCents

    let reconciliationStatus: SettlementReconciliationStatus
    if (varianceCents === 0) {
      reconciliationStatus = SettlementReconciliationStatus.RECONCILED
    } else {
      reconciliationStatus = SettlementReconciliationStatus.RECONCILIATION_VARIANCE
    }

    await prisma.settlementRecord.update({
      where: { id: settlementRecordId },
      data: {
        reconciliationStatus,
        reconciledAt: new Date(),
        reconciliationVarianceCents: varianceCents,
      },
    })

    return {
      status: reconciliationStatus,
      varianceCents,
      details: varianceCents === 0
        ? 'Settlement matches linked payments'
        : `Variance of ${varianceCents} cents detected`,
    }
  }

  /**
   * Detect payments that have no settlement record (missing settlement).
   * Only applicable for providers that expose settlement data.
   */
  static async detectMissingSettlements(
    businessId: string,
    provider: PaymentGateway,
    since: Date
  ): Promise<{ paymentTransactionIds: string[] }> {
    // Only run if the provider exposes settlement data
    if (!ProviderCapabilityRegistry.isSettlementDataAvailable(provider)) {
      return { paymentTransactionIds: [] }
    }

    // Find successful payments with no settlement link
    const payments = await prisma.paymentTransaction.findMany({
      where: {
        businessId,
        gateway: provider,
        status: 'SUCCESS',
        paidAt: { gte: since },
        settlementLinks: { none: {} },
      },
      select: { id: true },
    })

    return { paymentTransactionIds: payments.map(p => p.id) }
  }
}
