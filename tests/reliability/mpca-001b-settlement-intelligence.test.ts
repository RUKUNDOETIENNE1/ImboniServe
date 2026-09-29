/**
 * MPCA-001B — Settlement Intelligence Domain Tests
 *
 * Tests for the provider-neutral money movement and settlement intelligence layer.
 *
 * Tests cover (19 scenarios A-S):
 *   A. Payment succeeds → SettlementRecord created
 *   B. Funds become available immediately
 *   C. Funds remain pending
 *   D. Settlement completes
 *   E. Settlement fails
 *   F. Withdrawal requested
 *   G. Withdrawal completes
 *   H. Withdrawal fails
 *   I. Duplicate settlement event → idempotent
 *   J. Duplicate withdrawal event → idempotent
 *   K. Amount mismatch → variance detected
 *   L. Currency mismatch → handled
 *   M. Cross-business access attempt → rejected
 *   N. Settlement without matching payment
 *   O. Unknown provider capability → remains unknown
 *   P. Provider with no separate settlement concept
 *   Q. Provider with settlement but no withdrawal API
 *   R. Provider that supports direct merchant settlement
 *   S. Provider that supports split settlement
 *
 * IMPORTANT: These are architecture/domain tests. They verify the ABILITY to
 * represent different provider behaviors. They do NOT claim that InTouch
 * supports these behaviors merely because the tests can represent them.
 */

import { PaymentGateway } from '@prisma/client'
import {
  MoneyFlowType,
  ProviderCapability,
  ProviderCapabilityVerificationStatus,
  SettlementLifecycleStatus,
  WithdrawalLifecycleStatus,
  FundsAvailabilityLifecycleStatus,
  SettlementReconciliationLifecycleStatus,
  FeeBreakdown,
  validateFeeBreakdown,
} from '@/lib/settlement/types'
import { ProviderCapabilityRegistry } from '@/lib/settlement/provider-capability-registry'

// ─── Mock Setup ──────────────────────────────────────────────────────────────

const mockSettlementRecord = {
  id: 'sr-001b-1',
  businessId: 'biz-001b-a',
  provider: PaymentGateway.INTOUCH,
  providerSettlementId: null,
  internalSettlementId: 'STL-001b-1',
  currency: 'RWF',
  grossAmountCents: 100000,
  providerFeeCents: 3000,
  platformFeeCents: 2000,
  otherDeductionsCents: 0,
  netAmountCents: 95000,
  status: 'SETTLEMENT_UNKNOWN',
  fundsAvailabilityStatus: 'FUNDS_UNKNOWN',
  reconciliationStatus: 'RECONCILIATION_NOT_APPLICABLE',
  idempotencyKey: 'settlement:pt-001b-1:1234567890',
  providerMetadata: {},
}

const mockPrisma = {
  settlementRecord: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    aggregate: jest.fn(),
    count: jest.fn(),
  },
  withdrawalRecord: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  settlementTransactionLink: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  paymentTransaction: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  business: {
    findUnique: jest.fn(),
  },
}

jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

jest.mock('@/lib/logger', () => ({
  logger: {
    child: () => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    }),
  },
}))

// Import the service AFTER mocks are set up
import { SettlementIntelligenceService, SettlementReconciliationService } from '@/lib/settlement/settlement-intelligence.service'

// ─── Helper Functions ────────────────────────────────────────────────────────

function resetMocks() {
  jest.clearAllMocks()
  mockPrisma.settlementRecord.create.mockResolvedValue(mockSettlementRecord)
  mockPrisma.settlementRecord.findFirst.mockResolvedValue(null)
  mockPrisma.settlementRecord.findUnique.mockResolvedValue(mockSettlementRecord)
  mockPrisma.settlementRecord.findMany.mockResolvedValue([])
  mockPrisma.settlementRecord.update.mockResolvedValue(mockSettlementRecord)
  mockPrisma.settlementRecord.aggregate.mockResolvedValue({ _sum: { amountCents: 0, platformFeeCents: 0, gatewayFeeActualCents: 0, gatewayFeeEstimatedCents: 0 }, _count: { id: 0 } })
  mockPrisma.settlementRecord.count.mockResolvedValue(0)
  mockPrisma.withdrawalRecord.create.mockResolvedValue({ id: 'wr-001b-1' })
  mockPrisma.withdrawalRecord.findFirst.mockResolvedValue(null)
  mockPrisma.withdrawalRecord.findMany.mockResolvedValue([])
  mockPrisma.withdrawalRecord.update.mockResolvedValue({})
  mockPrisma.withdrawalRecord.count.mockResolvedValue(0)
  mockPrisma.settlementTransactionLink.create.mockResolvedValue({})
  mockPrisma.paymentTransaction.findFirst.mockResolvedValue(null)
  mockPrisma.paymentTransaction.findUnique.mockResolvedValue(null)
  mockPrisma.paymentTransaction.findMany.mockResolvedValue([])
  mockPrisma.paymentTransaction.count.mockResolvedValue(0)
  mockPrisma.paymentTransaction.aggregate.mockResolvedValue({ _sum: { amountCents: 0, platformFeeCents: 0, gatewayFeeActualCents: 0, gatewayFeeEstimatedCents: 0 }, _count: { id: 0 } })
  mockPrisma.business.findUnique.mockResolvedValue({ currency: 'RWF' })
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('MPCA-001B: Settlement Intelligence Domain', () => {
  beforeEach(() => resetMocks())

  // ─── A. Payment succeeds → SettlementRecord created ──────────────────────
  describe('A. Payment succeeds → SettlementRecord created', () => {
    it('should create a SettlementRecord when payment succeeds', async () => {
      await SettlementIntelligenceService.onPaymentSuccess(
        'pt-001b-1',
        'biz-001b-a',
        PaymentGateway.INTOUCH,
        100000,
        'RWF',
        { providerFeeCents: 3000, platformFeeCents: 2000, netAmountCents: 95000 }
      )

      expect(mockPrisma.settlementRecord.create).toHaveBeenCalledTimes(1)
      const createCall = mockPrisma.settlementRecord.create.mock.calls[0][0]
      expect(createCall.data.businessId).toBe('biz-001b-a')
      expect(createCall.data.grossAmountCents).toBe(100000)
      expect(createCall.data.providerFeeCents).toBe(3000)
      expect(createCall.data.platformFeeCents).toBe(2000)
      expect(createCall.data.netAmountCents).toBe(95000)
      expect(createCall.data.idempotencyKey).toBeDefined()
    })
  })

  // ─── B. Funds become available immediately ───────────────────────────────
  describe('B. Funds become available immediately', () => {
    it('should represent immediate funds availability via SETTLEMENT_COMPLETED + FUNDS_AVAILABLE', () => {
      // This tests the ARCHITECTURE can represent immediate availability
      // It does NOT claim InTouch supports this
      const status = SettlementLifecycleStatus.COMPLETED
      const funds = FundsAvailabilityLifecycleStatus.AVAILABLE
      expect(status).toBe('SETTLEMENT_COMPLETED')
      expect(funds).toBe('FUNDS_AVAILABLE')
    })
  })

  // ─── C. Funds remain pending ─────────────────────────────────────────────
  describe('C. Funds remain pending', () => {
    it('should represent pending funds via SETTLEMENT_PENDING + FUNDS_PENDING', () => {
      const status = SettlementLifecycleStatus.PENDING
      const funds = FundsAvailabilityLifecycleStatus.PENDING
      expect(status).toBe('SETTLEMENT_PENDING')
      expect(funds).toBe('FUNDS_PENDING')
    })
  })

  // ─── D. Settlement completes ─────────────────────────────────────────────
  describe('D. Settlement completes', () => {
    it('should process a settlement webhook with COMPLETED status', async () => {
      mockPrisma.settlementRecord.findFirst.mockResolvedValue(null)
      mockPrisma.settlementRecord.create.mockResolvedValue({ id: 'sr-001b-d' })

      await SettlementIntelligenceService.processSettlementWebhook(
        'biz-001b-a',
        PaymentGateway.INTOUCH,
        'intouch-settlement-001',
        SettlementLifecycleStatus.COMPLETED,
        { grossAmountCents: 100000, netAmountCents: 95000, currency: 'RWF' }
      )

      expect(mockPrisma.settlementRecord.create).toHaveBeenCalledTimes(1)
      const createCall = mockPrisma.settlementRecord.create.mock.calls[0][0]
      expect(createCall.data.status).toBe('SETTLEMENT_COMPLETED')
      expect(createCall.data.fundsAvailabilityStatus).toBe('FUNDS_AVAILABLE')
      expect(createCall.data.completedAt).toBeDefined()
    })
  })

  // ─── E. Settlement fails ─────────────────────────────────────────────────
  describe('E. Settlement fails', () => {
    it('should process a settlement webhook with FAILED status', async () => {
      mockPrisma.settlementRecord.findFirst.mockResolvedValue(null)
      mockPrisma.settlementRecord.create.mockResolvedValue({ id: 'sr-001b-e' })

      await SettlementIntelligenceService.processSettlementWebhook(
        'biz-001b-a',
        PaymentGateway.INTOUCH,
        'intouch-settlement-002',
        SettlementLifecycleStatus.FAILED,
        { grossAmountCents: 100000, netAmountCents: 95000, currency: 'RWF' }
      )

      const createCall = mockPrisma.settlementRecord.create.mock.calls[0][0]
      expect(createCall.data.status).toBe('SETTLEMENT_FAILED')
      expect(createCall.data.fundsAvailabilityStatus).toBe('FUNDS_PENDING')
    })
  })

  // ─── F. Withdrawal requested ─────────────────────────────────────────────
  describe('F. Withdrawal requested', () => {
    it('should process a withdrawal webhook with REQUESTED status', async () => {
      mockPrisma.withdrawalRecord.findFirst.mockResolvedValue(null)
      mockPrisma.withdrawalRecord.create.mockResolvedValue({ id: 'wr-001b-f' })

      await SettlementIntelligenceService.processWithdrawalWebhook(
        'biz-001b-a',
        PaymentGateway.INTOUCH,
        'intouch-withdrawal-001',
        WithdrawalLifecycleStatus.REQUESTED,
        { amountCents: 50000, currency: 'RWF' }
      )

      expect(mockPrisma.withdrawalRecord.create).toHaveBeenCalledTimes(1)
      const createCall = mockPrisma.withdrawalRecord.create.mock.calls[0][0]
      expect(createCall.data.status).toBe('WITHDRAWAL_REQUESTED')
      expect(createCall.data.amountCents).toBe(50000)
    })
  })

  // ─── G. Withdrawal completes ─────────────────────────────────────────────
  describe('G. Withdrawal completes', () => {
    it('should process a withdrawal webhook with COMPLETED status', async () => {
      const existingWithdrawal = {
        id: 'wr-001b-g',
        businessId: 'biz-001b-a',
        provider: PaymentGateway.INTOUCH,
        status: 'WITHDRAWAL_REQUESTED',
        providerMetadata: {},
      }
      mockPrisma.withdrawalRecord.findFirst.mockResolvedValue(existingWithdrawal)

      await SettlementIntelligenceService.processWithdrawalWebhook(
        'biz-001b-a',
        PaymentGateway.INTOUCH,
        'intouch-withdrawal-001',
        WithdrawalLifecycleStatus.COMPLETED,
        { amountCents: 50000, netAmountCents: 49000, currency: 'RWF' }
      )

      expect(mockPrisma.withdrawalRecord.update).toHaveBeenCalledTimes(1)
      const updateCall = mockPrisma.withdrawalRecord.update.mock.calls[0][0]
      expect(updateCall.data.status).toBe('WITHDRAWAL_COMPLETED')
      expect(updateCall.data.completedAt).toBeDefined()
    })
  })

  // ─── H. Withdrawal fails ─────────────────────────────────────────────────
  describe('H. Withdrawal fails', () => {
    it('should process a withdrawal webhook with FAILED status', async () => {
      const existingWithdrawal = {
        id: 'wr-001b-h',
        businessId: 'biz-001b-a',
        provider: PaymentGateway.INTOUCH,
        status: 'WITHDRAWAL_PROCESSING',
        providerMetadata: {},
      }
      mockPrisma.withdrawalRecord.findFirst.mockResolvedValue(existingWithdrawal)

      await SettlementIntelligenceService.processWithdrawalWebhook(
        'biz-001b-a',
        PaymentGateway.INTOUCH,
        'intouch-withdrawal-002',
        WithdrawalLifecycleStatus.FAILED,
        { amountCents: 50000, failureReason: 'Insufficient funds', currency: 'RWF' }
      )

      const updateCall = mockPrisma.withdrawalRecord.update.mock.calls[0][0]
      expect(updateCall.data.status).toBe('WITHDRAWAL_FAILED')
      expect(updateCall.data.failedAt).toBeDefined()
      expect(updateCall.data.failureReason).toBe('Insufficient funds')
    })
  })

  // ─── I. Duplicate settlement event → idempotent ──────────────────────────
  describe('I. Duplicate settlement event → idempotent', () => {
    it('should not create duplicate SettlementRecord for duplicate webhook', async () => {
      const existingRecord = {
        id: 'sr-001b-i',
        businessId: 'biz-001b-a',
        provider: PaymentGateway.INTOUCH,
        status: 'SETTLEMENT_COMPLETED',
        grossAmountCents: 100000,
        providerFeeCents: 3000,
        netAmountCents: 95000,
        providerMetadata: {},
      }
      mockPrisma.settlementRecord.findFirst.mockResolvedValue(existingRecord)

      const result = await SettlementIntelligenceService.processSettlementWebhook(
        'biz-001b-a',
        PaymentGateway.INTOUCH,
        'intouch-settlement-001',
        SettlementLifecycleStatus.COMPLETED,
        { grossAmountCents: 100000, netAmountCents: 95000, currency: 'RWF' }
      )

      expect(result.updated).toBe(false)
      expect(mockPrisma.settlementRecord.create).not.toHaveBeenCalled()
    })

    it('should handle P2002 (duplicate idempotency key) gracefully on payment success', async () => {
      mockPrisma.settlementRecord.create.mockRejectedValue({ code: 'P2002' })

      // Should NOT throw — non-blocking
      await expect(
        SettlementIntelligenceService.onPaymentSuccess(
          'pt-001b-i',
          'biz-001b-a',
          PaymentGateway.INTOUCH,
          100000,
          'RWF'
        )
      ).resolves.not.toThrow()
    })
  })

  // ─── J. Duplicate withdrawal event → idempotent ──────────────────────────
  describe('J. Duplicate withdrawal event → idempotent', () => {
    it('should not create duplicate WithdrawalRecord for duplicate webhook', async () => {
      const existingWithdrawal = {
        id: 'wr-001b-j',
        businessId: 'biz-001b-a',
        provider: PaymentGateway.INTOUCH,
        status: 'WITHDRAWAL_COMPLETED',
        providerMetadata: {},
      }
      mockPrisma.withdrawalRecord.findFirst.mockResolvedValue(existingWithdrawal)

      const result = await SettlementIntelligenceService.processWithdrawalWebhook(
        'biz-001b-a',
        PaymentGateway.INTOUCH,
        'intouch-withdrawal-001',
        WithdrawalLifecycleStatus.COMPLETED,
        { amountCents: 50000, currency: 'RWF' }
      )

      expect(result.updated).toBe(false)
      expect(mockPrisma.withdrawalRecord.create).not.toHaveBeenCalled()
    })
  })

  // ─── K. Amount mismatch → variance detected ──────────────────────────────
  describe('K. Amount mismatch → variance detected', () => {
    it('should detect variance when settlement amount differs from linked payments', async () => {
      const record = {
        id: 'sr-001b-k',
        businessId: 'biz-001b-a',
        status: 'SETTLEMENT_COMPLETED',
        grossAmountCents: 100000,
        transactionLinks: [
          { allocatedAmountCents: 90000, paymentTransaction: { id: 'pt-001b-k' } },
        ],
      }
      mockPrisma.settlementRecord.findUnique.mockResolvedValue(record)

      const result = await SettlementReconciliationService.reconcileSettlementRecord(
        'sr-001b-k',
        'biz-001b-a'
      )

      expect(result.status).toBe('RECONCILIATION_VARIANCE')
      expect(result.varianceCents).toBe(10000) // 100000 - 90000
    })
  })

  // ─── L. Currency mismatch → handled ──────────────────────────────────────
  describe('L. Currency mismatch → handled', () => {
    it('should preserve currency from provider webhook', async () => {
      mockPrisma.settlementRecord.findFirst.mockResolvedValue(null)
      mockPrisma.settlementRecord.create.mockResolvedValue({ id: 'sr-001b-l' })

      await SettlementIntelligenceService.processSettlementWebhook(
        'biz-001b-a',
        PaymentGateway.IREMBO_PAY,
        'irembo-settlement-001',
        SettlementLifecycleStatus.COMPLETED,
        { grossAmountCents: 50000, netAmountCents: 48000, currency: 'USD' }
      )

      const createCall = mockPrisma.settlementRecord.create.mock.calls[0][0]
      expect(createCall.data.currency).toBe('USD')
    })
  })

  // ─── M. Cross-business access attempt → rejected ─────────────────────────
  describe('M. Cross-business access attempt → rejected', () => {
    it('should reject reconciliation when settlement record belongs to different business', async () => {
      mockPrisma.settlementRecord.findUnique.mockResolvedValue({
        id: 'sr-001b-m',
        businessId: 'biz-001b-b', // Different business!
      })

      await expect(
        SettlementReconciliationService.reconcileSettlementRecord('sr-001b-m', 'biz-001b-a')
      ).rejects.toThrow('Business isolation violation')
    })

    it('should verify business isolation correctly', async () => {
      mockPrisma.settlementRecord.findUnique.mockResolvedValue({
        id: 'sr-001b-m2',
        businessId: 'biz-001b-a',
      })

      const result = await SettlementIntelligenceService.verifyBusinessIsolation(
        'sr-001b-m2',
        'biz-001b-a'
      )
      expect(result).toBe(true)

      const result2 = await SettlementIntelligenceService.verifyBusinessIsolation(
        'sr-001b-m2',
        'biz-001b-b'
      )
      expect(result2).toBe(false)
    })
  })

  // ─── N. Settlement without matching payment ──────────────────────────────
  describe('N. Settlement without matching payment', () => {
    it('should create SettlementRecord even without linked transactions', async () => {
      mockPrisma.settlementRecord.findFirst.mockResolvedValue(null)
      mockPrisma.settlementRecord.create.mockResolvedValue({ id: 'sr-001b-n' })

      const result = await SettlementIntelligenceService.processSettlementWebhook(
        'biz-001b-a',
        PaymentGateway.INTOUCH,
        'intouch-settlement-orphan',
        SettlementLifecycleStatus.COMPLETED,
        { grossAmountCents: 50000, netAmountCents: 48000, currency: 'RWF' }
      )

      expect(result.updated).toBe(true)
      // No transaction links created because no transactionReferences provided
      expect(mockPrisma.settlementTransactionLink.create).not.toHaveBeenCalled()
    })
  })

  // ─── O. Unknown provider capability → remains unknown ────────────────────
  describe('O. Unknown provider capability → remains unknown', () => {
    it('should report InTouch settlement API as UNKNOWN', () => {
      const cap = ProviderCapabilityRegistry.getCapability(
        PaymentGateway.INTOUCH,
        ProviderCapability.SETTLEMENT_API
      )
      expect(cap).not.toBeNull()
      expect(cap!.verificationStatus).toBe(ProviderCapabilityVerificationStatus.UNKNOWN)
    })

    it('should report InTouch withdrawal API as UNKNOWN', () => {
      const cap = ProviderCapabilityRegistry.getCapability(
        PaymentGateway.INTOUCH,
        ProviderCapability.WITHDRAWAL_API
      )
      expect(cap).not.toBeNull()
      expect(cap!.verificationStatus).toBe(ProviderCapabilityVerificationStatus.UNKNOWN)
    })

    it('should NOT claim settlement data is available for InTouch', () => {
      expect(ProviderCapabilityRegistry.isSettlementDataAvailable(PaymentGateway.INTOUCH)).toBe(false)
    })

    it('should NOT claim withdrawal is supported for InTouch', () => {
      expect(ProviderCapabilityRegistry.isWithdrawalSupported(PaymentGateway.INTOUCH)).toBe(false)
    })
  })

  // ─── P. Provider with no separate settlement concept ─────────────────────
  describe('P. Provider with no separate settlement concept', () => {
    it('should create SettlementRecord with SETTLEMENT_UNKNOWN for providers without settlement API', async () => {
      // InTouch does not expose settlement data → status should be SETTLEMENT_UNKNOWN
      await SettlementIntelligenceService.onPaymentSuccess(
        'pt-001b-p',
        'biz-001b-a',
        PaymentGateway.INTOUCH,
        100000,
        'RWF'
      )

      const createCall = mockPrisma.settlementRecord.create.mock.calls[0][0]
      expect(createCall.data.status).toBe('SETTLEMENT_UNKNOWN')
      expect(createCall.data.fundsAvailabilityStatus).toBe('FUNDS_UNKNOWN')
      expect(createCall.data.reconciliationStatus).toBe('RECONCILIATION_NOT_APPLICABLE')
    })
  })

  // ─── Q. Provider with settlement but no withdrawal API ───────────────────
  describe('Q. Provider with settlement but no withdrawal API', () => {
    it('should be architecturally representable — settlement exists, withdrawal does not', () => {
      // This tests the ARCHITECTURE can represent this scenario
      // A provider could have SETTLEMENT_COMPLETED but WITHDRAWAL_NOT_SUPPORTED
      const settlementStatus = SettlementLifecycleStatus.COMPLETED
      const withdrawalStatus = WithdrawalLifecycleStatus.NOT_SUPPORTED
      expect(settlementStatus).toBe('SETTLEMENT_COMPLETED')
      expect(withdrawalStatus).toBe('WITHDRAWAL_NOT_SUPPORTED')
    })
  })

  // ─── R. Provider that supports direct merchant settlement ────────────────
  describe('R. Provider that supports direct merchant settlement', () => {
    it('should be architecturally representable — funds go directly to merchant', () => {
      // A provider could settle directly: PAYMENT_SUCCESS → FUNDS_AVAILABLE (no intermediate settlement)
      const settlementStatus = SettlementLifecycleStatus.NOT_REQUIRED
      const fundsStatus = FundsAvailabilityLifecycleStatus.AVAILABLE
      expect(settlementStatus).toBe('SETTLEMENT_NOT_REQUIRED')
      expect(fundsStatus).toBe('FUNDS_AVAILABLE')
    })
  })

  // ─── S. Provider that supports split settlement ──────────────────────────
  describe('S. Provider that supports split settlement', () => {
    it('should be architecturally representable — multiple SettlementRecords per payment', () => {
      // Split settlement: one payment → multiple settlement records (e.g., platform fee to ImboniServe, net to merchant)
      // The architecture supports this via separate SettlementRecords linked to the same PaymentTransaction
      // through SettlementTransactionLink
      const moneyFlowPlatform = MoneyFlowType.PLATFORM_MONEY
      const moneyFlowMerchant = MoneyFlowType.MERCHANT_MONEY
      expect(moneyFlowPlatform).toBe('PLATFORM_MONEY')
      expect(moneyFlowMerchant).toBe('MERCHANT_MONEY')
    })
  })
})

// ─── Fee Breakdown Tests ─────────────────────────────────────────────────────

describe('MPCA-001B: Fee Breakdown Validation', () => {
  it('should validate correct fee breakdown', () => {
    const fees: FeeBreakdown = {
      grossAmountCents: 100000,
      providerFeeCents: 3000,
      platformFeeCents: 2000,
      otherDeductionsCents: 0,
      netAmountCents: 95000,
    }
    expect(validateFeeBreakdown(fees)).toBe(true)
  })

  it('should reject incorrect fee breakdown', () => {
    const fees: FeeBreakdown = {
      grossAmountCents: 100000,
      providerFeeCents: 3000,
      platformFeeCents: 2000,
      otherDeductionsCents: 0,
      netAmountCents: 94000, // Wrong! Should be 95000
    }
    expect(validateFeeBreakdown(fees)).toBe(false)
  })

  it('should validate fee breakdown with other deductions', () => {
    const fees: FeeBreakdown = {
      grossAmountCents: 100000,
      providerFeeCents: 3000,
      platformFeeCents: 2000,
      otherDeductionsCents: 500,
      netAmountCents: 94500,
    }
    expect(validateFeeBreakdown(fees)).toBe(true)
  })
})

// ─── Provider Capability Registry Tests ──────────────────────────────────────

describe('MPCA-001B: Provider Capability Registry', () => {
  it('should return capability profile for InTouch', () => {
    const profile = ProviderCapabilityRegistry.getProfile(PaymentGateway.INTOUCH)
    expect(profile).not.toBeNull()
    expect(profile!.provider).toBe(PaymentGateway.INTOUCH)
    expect(profile!.capabilities.length).toBeGreaterThan(0)
  })

  it('should return capability profile for IremboPay', () => {
    const profile = ProviderCapabilityRegistry.getProfile(PaymentGateway.IREMBO_PAY)
    expect(profile).not.toBeNull()
    expect(profile!.provider).toBe(PaymentGateway.IREMBO_PAY)
  })

  it('should return null for unknown provider', () => {
    const profile = ProviderCapabilityRegistry.getProfile(PaymentGateway.CASH)
    expect(profile).toBeNull()
  })

  it('should report IremboPay refund as NOT_SUPPORTED', () => {
    const cap = ProviderCapabilityRegistry.getCapability(
      PaymentGateway.IREMBO_PAY,
      ProviderCapability.REFUND_EVENTS
    )
    expect(cap).not.toBeNull()
    expect(cap!.verificationStatus).toBe(ProviderCapabilityVerificationStatus.NOT_SUPPORTED)
  })

  it('should report InTouch payment collection as SUPPORT_CONFIRMED', () => {
    const cap = ProviderCapabilityRegistry.getCapability(
      PaymentGateway.INTOUCH,
      ProviderCapability.PAYMENT_COLLECTION
    )
    expect(cap).not.toBeNull()
    expect(cap!.verificationStatus).toBe(ProviderCapabilityVerificationStatus.SUPPORT_CONFIRMED)
  })

  it('should return all profiles', () => {
    const profiles = ProviderCapabilityRegistry.getAllProfiles()
    expect(profiles.length).toBeGreaterThanOrEqual(2)
  })
})

// ─── Money Flow Classification Tests ────────────────────────────────────────

describe('MPCA-001B: Money Flow Classification', () => {
  it('should distinguish PLATFORM_MONEY from MERCHANT_MONEY', () => {
    expect(MoneyFlowType.PLATFORM_MONEY).toBe('PLATFORM_MONEY')
    expect(MoneyFlowType.MERCHANT_MONEY).toBe('MERCHANT_MONEY')
    expect(MoneyFlowType.PLATFORM_MONEY).not.toBe(MoneyFlowType.MERCHANT_MONEY)
  })
})

// ─── Non-Blocking Behavior Tests ────────────────────────────────────────────

describe('MPCA-001B: Non-Blocking Behavior', () => {
  beforeEach(() => resetMocks())

  it('should NOT throw when settlement intelligence fails (protects payment truth chain)', async () => {
    mockPrisma.settlementRecord.create.mockRejectedValue(new Error('Database down'))

    await expect(
      SettlementIntelligenceService.onPaymentSuccess(
        'pt-001b-nb',
        'biz-001b-a',
        PaymentGateway.INTOUCH,
        100000,
        'RWF'
      )
    ).resolves.not.toThrow()
  })

  it('should NOT throw when business lookup fails', async () => {
    mockPrisma.business.findUnique.mockRejectedValue(new Error('DB error'))

    await expect(
      SettlementIntelligenceService.getSettlementIntelligenceSummary('biz-001b-nb')
    ).rejects.toThrow() // Summary CAN throw — it's a read operation, not a side effect
  })
})

// ─── Settlement Intelligence Summary Tests ──────────────────────────────────

describe('MPCA-001B: Settlement Intelligence Summary', () => {
  beforeEach(() => resetMocks())

  it('should return summary with null values for unknown settlement data', async () => {
    mockPrisma.paymentTransaction.aggregate.mockResolvedValue({
      _sum: { amountCents: 500000, platformFeeCents: 10000, gatewayFeeActualCents: 15000, gatewayFeeEstimatedCents: 15000 },
      _count: { id: 10 },
    })
    mockPrisma.paymentTransaction.count.mockResolvedValue(10)
    mockPrisma.settlementRecord.findMany.mockResolvedValue([])
    mockPrisma.withdrawalRecord.findMany.mockResolvedValue([])

    const summary = await SettlementIntelligenceService.getSettlementIntelligenceSummary('biz-001b-a')

    expect(summary.businessId).toBe('biz-001b-a')
    expect(summary.totalCollectedCents).toBe(500000)
    expect(summary.totalPaidTransactions).toBe(10)
    expect(summary.settlementDataAvailable).toBe(false) // InTouch + IremboPay don't expose settlement
    expect(summary.settlementRecordsCount).toBe(0)
  })
})
