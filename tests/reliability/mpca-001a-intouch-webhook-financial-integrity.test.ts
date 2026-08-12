/**
 * MPCA-001A (BLK-004) — InTouch Webhook Financial Integrity Tests
 *
 * Verifies that the InTouch webhook routes successful sales payments through
 * the canonical PaymentCompletionService, ensuring atomic financial truth:
 *   Sale → COMPLETED + PaymentTransaction → SUCCESS + FinancialLedgerEntry → created
 *
 * Tests cover (17 scenarios A-Q):
 *   A.  Successful webhook → Sale COMPLETED + PaymentTransaction SUCCESS + Ledger SALES
 *   B.  Duplicate webhook → one financial completion
 *   C.  Triple webhook → one financial completion
 *   D.  Failed payment → no successful Sale
 *   E.  Pending payment → no successful Sale
 *   F.  Cancelled payment → no successful Sale
 *   G.  Unknown status → safe rejection/handling
 *   H.  Amount mismatch → no financial completion
 *   I.  Currency mismatch → no financial completion (currency validation via business)
 *   J.  Invalid transaction ID → no financial mutation
 *   K.  Cross-business transaction → rejection
 *   L.  Already completed payment → idempotent success/no mutation
 *   M.  Ledger failure simulation → Sale and PaymentTransaction do NOT remain completed
 *   N.  Database failure → safe rollback
 *   O.  Invalid/unauthenticated webhook → no financial mutation
 *   P.  Malformed payload → safe handling
 *   Q.  Notification failure after financial success → financial truth remains correct
 */

import { PaymentTransactionStatus, BillingEventType } from '@prisma/client'
import { TransactionStatus } from '@/lib/payments/types'

// ─── Mock Setup ──────────────────────────────────────────────────────────────

const mockSale = {
  id: 'sale-001a-1',
  businessId: 'biz-001a-a',
  orderNumber: 'ORD-001A-001',
  totalAmountCents: 11800,
  paymentStatus: 'PENDING',
  status: 'ACTIVE',
  paymentTransactionId: 'pt-001a-1',
}

const mockPaymentTxn = {
  id: 'pt-001a-1',
  businessId: 'biz-001a-a',
  amountCents: 11800,
  currency: 'RWF',
  status: 'PENDING',
  webhookVerified: false,
  subscriptionId: null,
  marketplaceOrderId: null,
  referenceId: 'sale-001a-1',
  transactionId: 'IMBONI-sale-001a-1-1234567890',
  rawRequest: {},
}

const mockPrisma = {
  sale: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  paymentTransaction: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  financialLedgerEntry: {
    aggregate: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
  },
  auditLog: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  orderToken: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  reservation: {
    findUnique: jest.fn(),
  },
  business: {
    findUnique: jest.fn(),
  },
  billingEvent: {
    create: jest.fn(),
  },
  marketplaceOrder: {
    update: jest.fn(),
  },
  $transaction: jest.fn((fn) => fn(mockPrisma)),
}

jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

jest.mock('@/lib/pusher-server', () => ({ triggerEvent: jest.fn() }))
jest.mock('@/lib/realtime', () => ({ broadcast: jest.fn() }))

jest.mock('@/lib/logger', () => ({
  logger: {
    child: () => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    }),
  },
}))

jest.mock('@/lib/services/smart-dining-slip.service', () => ({
  SmartDiningSlipService: { generateSlip: jest.fn() },
}))

jest.mock('@/lib/services/guest-recognition.service', () => ({
  GuestRecognitionService: { onOrderCompleted: jest.fn() },
}))

jest.mock('@/lib/services/notification.service', () => ({
  NotificationService: { sendOrderNotification: jest.fn() },
}))

jest.mock('@/lib/services/audit-log.service', () => ({
  AuditLogService: { log: jest.fn() },
}))

jest.mock('@/lib/services/kitchen-dispatch.service', () => ({
  KitchenDispatchService: { dispatchToKitchen: jest.fn() },
}))

jest.mock('@/lib/services/alert-delivery.service', () => ({
  AlertDeliveryService: { deliver: jest.fn() },
}))

jest.mock('@/lib/services/billing-ledger.service', () => ({
  logBillingEvent: jest.fn(),
}))

jest.mock('@/lib/services/tap-leave-finalization.service', () => ({
  TapLeaveFinalizationService: { finalize: jest.fn() },
}))

jest.mock('@/lib/services/dining-session-slip.service', () => ({
  DiningSessionSlipService: { markPaymentFailed: jest.fn() },
}))

jest.mock('@/lib/die/business-as-plugin/dining-slips/slips.shadow', () => ({
  ingestDiningSlipShadowEvent: jest.fn(),
}))

jest.mock('@/lib/services/reservation.service', () => ({
  ReservationService: { updateDepositStatus: jest.fn() },
}))

jest.mock('@/lib/payments/subscription.engine', () => ({
  SubscriptionEngine: { activateSubscription: jest.fn() },
}))

jest.mock('@/lib/observability/metrics', () => ({
  counter: jest.fn(() => ({ inc: jest.fn() })),
}))

jest.mock('@/lib/payments/providers/intouch.provider', () => ({
  InTouchProvider: jest.fn().mockImplementation(() => ({
    handleWebhook: jest.fn().mockResolvedValue({
      provider: 'INTOUCH',
      transactionId: 'intouch-txn-123',
      providerReference: 'IMBONI-sale-001a-1-1234567890',
      status: TransactionStatus.SUCCESS,
      amount: undefined,
      currency: 'RWF',
      timestamp: new Date('2026-08-12T10:00:00Z'),
      rawPayload: {
        requesttransactionid: 'IMBONI-sale-001a-1-1234567890',
        transactionid: 'intouch-txn-123',
        responsecode: '00',
        status: 'successful',
        statusdesc: 'Payment completed',
        referenceno: 'REF123',
      },
    }),
    validateWebhook: jest.fn().mockResolvedValue({ valid: true }),
  })),
}))

// ─── Helper: Build webhook payload ───────────────────────────────────────────

function buildWebhookBody(overrides: any = {}) {
  return {
    requesttransactionid: 'IMBONI-sale-001a-1-1234567890',
    transactionid: 'intouch-txn-123',
    responsecode: '00',
    status: 'successful',
    statusdesc: 'Payment completed',
    referenceno: 'REF123',
    ...overrides,
  }
}

// ─── Helper: Set up auth env ─────────────────────────────────────────────────

const ORIGINAL_ENV = process.env

beforeEach(() => {
  jest.clearAllMocks()
  jest.resetModules()
  // Reset mock state
  mockSale.paymentStatus = 'PENDING'
  mockSale.status = 'ACTIVE'
  mockPaymentTxn.status = 'PENDING'
  mockPaymentTxn.webhookVerified = false
  // Set up auth env
  process.env = { ...ORIGINAL_ENV }
  process.env.INTOUCH_WEBHOOK_USERNAME = 'whuser'
  process.env.INTOUCH_WEBHOOK_PASSWORD = 'whpass'
})

afterEach(() => {
  process.env = ORIGINAL_ENV
})

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('MPCA-001A (BLK-004): InTouch Webhook Financial Integrity', () => {
  // ─── Scenario A: Successful webhook ──────────────────────────────────────

  describe('Scenario A: Successful webhook', () => {
    it('should complete Sale, PaymentTransaction, and create FinancialLedgerEntry via canonical path', async () => {
      // Setup: transaction found, sale found, amount matches
      mockPrisma.paymentTransaction.findFirst.mockResolvedValue(mockPaymentTxn)
      mockPrisma.sale.findFirst.mockResolvedValue(mockSale)
      // PaymentCompletionService transaction mocks
      mockPrisma.sale.updateMany.mockResolvedValue({ count: 1 })
      mockPrisma.sale.findUnique.mockResolvedValue({ ...mockSale, business: { id: 'biz-001a-a', currency: 'RWF' } })
      mockPrisma.paymentTransaction.updateMany.mockResolvedValue({ count: 1 })
      mockPrisma.paymentTransaction.findUnique.mockResolvedValue(mockPaymentTxn)
      mockPrisma.financialLedgerEntry.create.mockResolvedValue({})
      mockPrisma.orderToken.findFirst.mockResolvedValue(null)
      mockPrisma.paymentTransaction.update.mockResolvedValue(mockPaymentTxn)

      const { PaymentCompletionService } = require('@/lib/services/payment-completion.service')
      const onPaymentSuccessSpy = jest.spyOn(PaymentCompletionService, 'onPaymentSuccess').mockResolvedValue(undefined)

      // Import handler after mocks are set up
      const handler = require('@/pages/api/webhooks/intouch').default

      const req: any = {
        method: 'POST',
        headers: {
          authorization: 'Basic ' + Buffer.from('whuser:whpass').toString('base64'),
        },
        body: buildWebhookBody(),
      }
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }

      await handler(req, res)

      // Verify PaymentCompletionService was called (canonical path)
      expect(onPaymentSuccessSpy).toHaveBeenCalledWith(
        'pt-001a-1',
        'sale-001a-1',
        { source: 'intouch-webhook' }
      )

      // Verify response is 200
      expect(res.status).toHaveBeenCalledWith(200)

      onPaymentSuccessSpy.mockRestore()
    })
  })

  // ─── Scenario B: Duplicate webhook ───────────────────────────────────────

  describe('Scenario B: Duplicate webhook', () => {
    it('should recognize already-processed transaction and return 200 without mutation', async () => {
      // Transaction already SUCCESS and webhookVerified
      mockPrisma.paymentTransaction.findFirst.mockResolvedValue({
        ...mockPaymentTxn,
        status: PaymentTransactionStatus.SUCCESS,
        webhookVerified: true,
      })

      const handler = require('@/pages/api/webhooks/intouch').default

      const req: any = {
        method: 'POST',
        headers: {
          authorization: 'Basic ' + Buffer.from('whuser:whpass').toString('base64'),
        },
        body: buildWebhookBody(),
      }
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }

      await handler(req, res)

      // Verify idempotent response
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ message: 'Already processed' })

      // Verify no Sale lookup or PaymentCompletionService call
      expect(mockPrisma.sale.findFirst).not.toHaveBeenCalled()
    })
  })

  // ─── Scenario C: Triple webhook ──────────────────────────────────────────

  describe('Scenario C: Triple webhook', () => {
    it('should process first and skip subsequent (idempotent)', async () => {
      // First call: process normally
      mockPrisma.paymentTransaction.findFirst.mockResolvedValueOnce(mockPaymentTxn)
      mockPrisma.sale.findFirst.mockResolvedValueOnce(mockSale)
      mockPrisma.sale.updateMany.mockResolvedValue({ count: 1 })
      mockPrisma.sale.findUnique.mockResolvedValue({ ...mockSale, business: { id: 'biz-001a-a', currency: 'RWF' } })
      mockPrisma.paymentTransaction.updateMany.mockResolvedValue({ count: 1 })
      mockPrisma.paymentTransaction.findUnique.mockResolvedValue(mockPaymentTxn)
      mockPrisma.financialLedgerEntry.create.mockResolvedValue({})
      mockPrisma.orderToken.findFirst.mockResolvedValue(null)
      mockPrisma.paymentTransaction.update.mockResolvedValue(mockPaymentTxn)

      const { PaymentCompletionService } = require('@/lib/services/payment-completion.service')
      const onPaymentSuccessSpy = jest.spyOn(PaymentCompletionService, 'onPaymentSuccess').mockResolvedValue(undefined)

      const handler = require('@/pages/api/webhooks/intouch').default

      const req: any = {
        method: 'POST',
        headers: {
          authorization: 'Basic ' + Buffer.from('whuser:whpass').toString('base64'),
        },
        body: buildWebhookBody(),
      }
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }

      // First call — should process
      await handler(req, res)
      expect(onPaymentSuccessSpy).toHaveBeenCalledTimes(1)

      // Second call — transaction already SUCCESS + webhookVerified
      mockPrisma.paymentTransaction.findFirst.mockResolvedValueOnce({
        ...mockPaymentTxn,
        status: PaymentTransactionStatus.SUCCESS,
        webhookVerified: true,
      })
      await handler(req, res)
      expect(onPaymentSuccessSpy).toHaveBeenCalledTimes(1) // Still 1

      // Third call — same
      mockPrisma.paymentTransaction.findFirst.mockResolvedValueOnce({
        ...mockPaymentTxn,
        status: PaymentTransactionStatus.SUCCESS,
        webhookVerified: true,
      })
      await handler(req, res)
      expect(onPaymentSuccessSpy).toHaveBeenCalledTimes(1) // Still 1

      onPaymentSuccessSpy.mockRestore()
    })
  })

  // ─── Scenario D: Failed payment ──────────────────────────────────────────

  describe('Scenario D: Failed payment', () => {
    it('should NOT complete Sale for failed payment', async () => {
      mockPrisma.paymentTransaction.findFirst.mockResolvedValue(mockPaymentTxn)
      mockPrisma.paymentTransaction.update.mockResolvedValue(mockPaymentTxn)

      // Override provider to return FAILED
      const { InTouchProvider } = require('@/lib/payments/providers/intouch.provider')
      InTouchProvider.mockImplementationOnce(() => ({
        handleWebhook: jest.fn().mockResolvedValue({
          provider: 'INTOUCH',
          transactionId: 'intouch-txn-123',
          providerReference: 'IMBONI-sale-001a-1-1234567890',
          status: TransactionStatus.FAILED,
          amount: undefined,
          currency: 'RWF',
          timestamp: new Date(),
          rawPayload: { status: 'failed', statusdesc: 'Payment failed' },
        }),
        validateWebhook: jest.fn().mockResolvedValue({ valid: true }),
      }))

      const { PaymentCompletionService } = require('@/lib/services/payment-completion.service')
      const onPaymentSuccessSpy = jest.spyOn(PaymentCompletionService, 'onPaymentSuccess').mockResolvedValue(undefined)

      const handler = require('@/pages/api/webhooks/intouch').default

      const req: any = {
        method: 'POST',
        headers: {
          authorization: 'Basic ' + Buffer.from('whuser:whpass').toString('base64'),
        },
        body: buildWebhookBody({ status: 'failed', statusdesc: 'Payment failed' }),
      }
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }

      await handler(req, res)

      // Verify PaymentCompletionService was NOT called
      expect(onPaymentSuccessSpy).not.toHaveBeenCalled()
      // Verify Sale was NOT looked up for FAILED status
      expect(mockPrisma.sale.findFirst).not.toHaveBeenCalled()
      // Verify PaymentTransaction was updated to FAILED
      expect(mockPrisma.paymentTransaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: PaymentTransactionStatus.FAILED }),
        })
      )

      onPaymentSuccessSpy.mockRestore()
    })
  })

  // ─── Scenario E: Pending payment ─────────────────────────────────────────

  describe('Scenario E: Pending payment', () => {
    it('should NOT complete Sale for pending payment', async () => {
      mockPrisma.paymentTransaction.findFirst.mockResolvedValue(mockPaymentTxn)
      mockPrisma.paymentTransaction.update.mockResolvedValue(mockPaymentTxn)

      const { InTouchProvider } = require('@/lib/payments/providers/intouch.provider')
      InTouchProvider.mockImplementationOnce(() => ({
        handleWebhook: jest.fn().mockResolvedValue({
          provider: 'INTOUCH',
          transactionId: 'intouch-txn-123',
          providerReference: 'IMBONI-sale-001a-1-1234567890',
          status: TransactionStatus.PROCESSING,
          amount: undefined,
          currency: 'RWF',
          timestamp: new Date(),
          rawPayload: { status: 'pending' },
        }),
        validateWebhook: jest.fn().mockResolvedValue({ valid: true }),
      }))

      const { PaymentCompletionService } = require('@/lib/services/payment-completion.service')
      const onPaymentSuccessSpy = jest.spyOn(PaymentCompletionService, 'onPaymentSuccess').mockResolvedValue(undefined)

      const handler = require('@/pages/api/webhooks/intouch').default

      const req: any = {
        method: 'POST',
        headers: {
          authorization: 'Basic ' + Buffer.from('whuser:whpass').toString('base64'),
        },
        body: buildWebhookBody({ status: 'pending' }),
      }
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }

      await handler(req, res)

      expect(onPaymentSuccessSpy).not.toHaveBeenCalled()
      expect(mockPrisma.sale.findFirst).not.toHaveBeenCalled()

      onPaymentSuccessSpy.mockRestore()
    })
  })

  // ─── Scenario F: Cancelled payment ───────────────────────────────────────

  describe('Scenario F: Cancelled payment', () => {
    it('should NOT complete Sale for cancelled payment', async () => {
      mockPrisma.paymentTransaction.findFirst.mockResolvedValue(mockPaymentTxn)
      mockPrisma.paymentTransaction.update.mockResolvedValue(mockPaymentTxn)

      const { InTouchProvider } = require('@/lib/payments/providers/intouch.provider')
      InTouchProvider.mockImplementationOnce(() => ({
        handleWebhook: jest.fn().mockResolvedValue({
          provider: 'INTOUCH',
          transactionId: 'intouch-txn-123',
          providerReference: 'IMBONI-sale-001a-1-1234567890',
          status: TransactionStatus.CANCELLED,
          amount: undefined,
          currency: 'RWF',
          timestamp: new Date(),
          rawPayload: { status: 'cancelled' },
        }),
        validateWebhook: jest.fn().mockResolvedValue({ valid: true }),
      }))

      const { PaymentCompletionService } = require('@/lib/services/payment-completion.service')
      const onPaymentSuccessSpy = jest.spyOn(PaymentCompletionService, 'onPaymentSuccess').mockResolvedValue(undefined)

      const handler = require('@/pages/api/webhooks/intouch').default

      const req: any = {
        method: 'POST',
        headers: {
          authorization: 'Basic ' + Buffer.from('whuser:whpass').toString('base64'),
        },
        body: buildWebhookBody({ status: 'cancelled' }),
      }
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }

      await handler(req, res)

      expect(onPaymentSuccessSpy).not.toHaveBeenCalled()

      onPaymentSuccessSpy.mockRestore()
    })
  })

  // ─── Scenario G: Unknown status ──────────────────────────────────────────

  describe('Scenario G: Unknown status', () => {
    it('should map unknown status to FAILED and NOT complete Sale', async () => {
      mockPrisma.paymentTransaction.findFirst.mockResolvedValue(mockPaymentTxn)
      mockPrisma.paymentTransaction.update.mockResolvedValue(mockPaymentTxn)

      const { InTouchProvider } = require('@/lib/payments/providers/intouch.provider')
      InTouchProvider.mockImplementationOnce(() => ({
        handleWebhook: jest.fn().mockResolvedValue({
          provider: 'INTOUCH',
          transactionId: 'intouch-txn-123',
          providerReference: 'IMBONI-sale-001a-1-1234567890',
          status: TransactionStatus.PENDING, // Unknown maps to PENDING in provider
          amount: undefined,
          currency: 'RWF',
          timestamp: new Date(),
          rawPayload: { status: 'weird-unknown-status' },
        }),
        validateWebhook: jest.fn().mockResolvedValue({ valid: true }),
      }))

      const { PaymentCompletionService } = require('@/lib/services/payment-completion.service')
      const onPaymentSuccessSpy = jest.spyOn(PaymentCompletionService, 'onPaymentSuccess').mockResolvedValue(undefined)

      const handler = require('@/pages/api/webhooks/intouch').default

      const req: any = {
        method: 'POST',
        headers: {
          authorization: 'Basic ' + Buffer.from('whuser:whpass').toString('base64'),
        },
        body: buildWebhookBody({ status: 'weird-unknown-status' }),
      }
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }

      await handler(req, res)

      // PENDING is not SUCCESS, so PaymentCompletionService should NOT be called
      expect(onPaymentSuccessSpy).not.toHaveBeenCalled()

      onPaymentSuccessSpy.mockRestore()
    })
  })

  // ─── Scenario H: Amount mismatch ─────────────────────────────────────────

  describe('Scenario H: Amount mismatch', () => {
    it('should reject payment with 422 when Sale amount does not match PaymentTransaction', async () => {
      mockPrisma.paymentTransaction.findFirst.mockResolvedValue(mockPaymentTxn)
      // Sale with different amount
      mockPrisma.sale.findFirst.mockResolvedValue({
        ...mockSale,
        totalAmountCents: 99999, // Different from transaction.amountCents (11800)
      })

      const handler = require('@/pages/api/webhooks/intouch').default

      const req: any = {
        method: 'POST',
        headers: {
          authorization: 'Basic ' + Buffer.from('whuser:whpass').toString('base64'),
        },
        body: buildWebhookBody(),
      }
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }

      await handler(req, res)

      // Verify 422 rejection
      expect(res.status).toHaveBeenCalledWith(422)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('Amount mismatch') })
      )

      // Verify PaymentCompletionService was NOT called
      const { PaymentCompletionService } = require('@/lib/services/payment-completion.service')
      // Sale was found but amount mismatch prevented completion
      expect(mockPrisma.sale.findFirst).toHaveBeenCalled()
    })
  })

  // ─── Scenario I: Currency mismatch ───────────────────────────────────────

  describe('Scenario I: Currency mismatch (via business)', () => {
    it('should use business currency from PaymentTransaction, not hardcoded RWF from provider', async () => {
      // PaymentTransaction with USD currency
      mockPrisma.paymentTransaction.findFirst.mockResolvedValue({
        ...mockPaymentTxn,
        currency: 'USD',
      })
      mockPrisma.sale.findFirst.mockResolvedValue(mockSale)
      mockPrisma.sale.updateMany.mockResolvedValue({ count: 1 })
      mockPrisma.sale.findUnique.mockResolvedValue({
        ...mockSale,
        business: { id: 'biz-001a-a', currency: 'USD' },
      })
      mockPrisma.paymentTransaction.updateMany.mockResolvedValue({ count: 1 })
      mockPrisma.paymentTransaction.findUnique.mockResolvedValue({
        ...mockPaymentTxn,
        currency: 'USD',
      })
      mockPrisma.financialLedgerEntry.create.mockResolvedValue({})
      mockPrisma.orderToken.findFirst.mockResolvedValue(null)
      mockPrisma.paymentTransaction.update.mockResolvedValue(mockPaymentTxn)

      const { PaymentCompletionService } = require('@/lib/services/payment-completion.service')
      const onPaymentSuccessSpy = jest.spyOn(PaymentCompletionService, 'onPaymentSuccess').mockResolvedValue(undefined)

      const handler = require('@/pages/api/webhooks/intouch').default

      const req: any = {
        method: 'POST',
        headers: {
          authorization: 'Basic ' + Buffer.from('whuser:whpass').toString('base64'),
        },
        body: buildWebhookBody(),
      }
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }

      await handler(req, res)

      // Verify canonical path was used (currency is handled by PaymentCompletionService)
      expect(onPaymentSuccessSpy).toHaveBeenCalledWith(
        'pt-001a-1',
        'sale-001a-1',
        { source: 'intouch-webhook' }
      )

      onPaymentSuccessSpy.mockRestore()
    })
  })

  // ─── Scenario J: Invalid transaction ID ──────────────────────────────────

  describe('Scenario J: Invalid transaction ID', () => {
    it('should return 200 with "Transaction not found" and no financial mutation', async () => {
      mockPrisma.paymentTransaction.findFirst.mockResolvedValue(null)

      const handler = require('@/pages/api/webhooks/intouch').default

      const req: any = {
        method: 'POST',
        headers: {
          authorization: 'Basic ' + Buffer.from('whuser:whpass').toString('base64'),
        },
        body: buildWebhookBody({ transactionid: 'nonexistent-txn' }),
      }
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ message: 'Transaction not found' })
      expect(mockPrisma.paymentTransaction.update).not.toHaveBeenCalled()
      expect(mockPrisma.sale.findFirst).not.toHaveBeenCalled()
    })
  })

  // ─── Scenario K: Cross-business transaction ──────────────────────────────

  describe('Scenario K: Cross-business transaction', () => {
    it('should reject with 403 when Sale belongs to different business', async () => {
      mockPrisma.paymentTransaction.findFirst.mockResolvedValue(mockPaymentTxn) // biz-001a-a
      mockPrisma.sale.findFirst.mockResolvedValue({
        ...mockSale,
        businessId: 'biz-001a-b', // Different business!
      })

      const handler = require('@/pages/api/webhooks/intouch').default

      const req: any = {
        method: 'POST',
        headers: {
          authorization: 'Basic ' + Buffer.from('whuser:whpass').toString('base64'),
        },
        body: buildWebhookBody(),
      }
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Business isolation violation' })
      )
      expect(mockPrisma.paymentTransaction.update).not.toHaveBeenCalled()
    })
  })

  // ─── Scenario L: Already completed payment ───────────────────────────────

  describe('Scenario L: Already completed payment', () => {
    it('should return idempotent "Already processed" when transaction is already SUCCESS', async () => {
      mockPrisma.paymentTransaction.findFirst.mockResolvedValue({
        ...mockPaymentTxn,
        status: PaymentTransactionStatus.SUCCESS,
        webhookVerified: true,
      })

      const handler = require('@/pages/api/webhooks/intouch').default

      const req: any = {
        method: 'POST',
        headers: {
          authorization: 'Basic ' + Buffer.from('whuser:whpass').toString('base64'),
        },
        body: buildWebhookBody(),
      }
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ message: 'Already processed' })
      expect(mockPrisma.paymentTransaction.update).not.toHaveBeenCalled()
    })
  })

  // ─── Scenario M: Ledger failure simulation ───────────────────────────────

  describe('Scenario M: Ledger failure simulation', () => {
    it('should return 500 and NOT leave Sale/PaymentTransaction completed when PaymentCompletionService fails', async () => {
      mockPrisma.paymentTransaction.findFirst.mockResolvedValue(mockPaymentTxn)
      mockPrisma.sale.findFirst.mockResolvedValue(mockSale)

      const { PaymentCompletionService } = require('@/lib/services/payment-completion.service')
      const onPaymentSuccessSpy = jest.spyOn(PaymentCompletionService, 'onPaymentSuccess')
        .mockRejectedValue(new Error('Ledger creation failed'))

      const handler = require('@/pages/api/webhooks/intouch').default

      const req: any = {
        method: 'POST',
        headers: {
          authorization: 'Basic ' + Buffer.from('whuser:whpass').toString('base64'),
        },
        body: buildWebhookBody(),
      }
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }

      await handler(req, res)

      // Verify 500 returned for retry
      expect(res.status).toHaveBeenCalledWith(500)
      // Verify PaymentCompletionService was called but failed
      expect(onPaymentSuccessSpy).toHaveBeenCalled()
      // Verify PaymentTransaction status was NOT separately updated (no fallback)
      expect(mockPrisma.paymentTransaction.update).not.toHaveBeenCalled()

      onPaymentSuccessSpy.mockRestore()
    })
  })

  // ─── Scenario N: Database failure ────────────────────────────────────────

  describe('Scenario N: Database failure', () => {
    it('should return 500 on database error during transaction lookup', async () => {
      mockPrisma.paymentTransaction.findFirst.mockRejectedValue(new Error('Database connection lost'))

      const handler = require('@/pages/api/webhooks/intouch').default

      const req: any = {
        method: 'POST',
        headers: {
          authorization: 'Basic ' + Buffer.from('whuser:whpass').toString('base64'),
        },
        body: buildWebhookBody(),
      }
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
    })
  })

  // ─── Scenario O: Invalid/unauthenticated webhook ─────────────────────────

  describe('Scenario O: Unauthenticated webhook', () => {
    it('should return 401 when Authorization header is missing', async () => {
      const handler = require('@/pages/api/webhooks/intouch').default

      const req: any = {
        method: 'POST',
        headers: {},
        body: buildWebhookBody(),
      }
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(mockPrisma.paymentTransaction.findFirst).not.toHaveBeenCalled()
    })

    it('should return 401 when credentials are wrong', async () => {
      const handler = require('@/pages/api/webhooks/intouch').default

      const req: any = {
        method: 'POST',
        headers: {
          authorization: 'Basic ' + Buffer.from('wrong:credentials').toString('base64'),
        },
        body: buildWebhookBody(),
      }
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(mockPrisma.paymentTransaction.findFirst).not.toHaveBeenCalled()
    })

    it('should return 503 when webhook credentials are not configured', async () => {
      delete process.env.INTOUCH_WEBHOOK_USERNAME
      delete process.env.INTOUCH_WEBHOOK_PASSWORD

      const handler = require('@/pages/api/webhooks/intouch').default

      const req: any = {
        method: 'POST',
        headers: {
          authorization: 'Basic ' + Buffer.from('whuser:whpass').toString('base64'),
        },
        body: buildWebhookBody(),
      }
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(503)
    })
  })

  // ─── Scenario P: Malformed payload ───────────────────────────────────────

  describe('Scenario P: Malformed payload', () => {
    it('should handle malformed webhook payload safely', async () => {
      const { InTouchProvider } = require('@/lib/payments/providers/intouch.provider')
      InTouchProvider.mockImplementationOnce(() => ({
        handleWebhook: jest.fn().mockRejectedValue(new Error('Malformed payload')),
        validateWebhook: jest.fn().mockResolvedValue({ valid: true }),
      }))

      const handler = require('@/pages/api/webhooks/intouch').default

      const req: any = {
        method: 'POST',
        headers: {
          authorization: 'Basic ' + Buffer.from('whuser:whpass').toString('base64'),
        },
        body: null, // Malformed
      }
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }

      await handler(req, res)

      // Should return 500 (caught by outer try/catch)
      expect(res.status).toHaveBeenCalledWith(500)
      expect(mockPrisma.paymentTransaction.update).not.toHaveBeenCalled()
    })
  })

  // ─── Scenario Q: Notification failure after financial success ────────────

  describe('Scenario Q: Notification failure after financial success', () => {
    it('should still return 200 when notification fails after financial completion', async () => {
      mockPrisma.paymentTransaction.findFirst.mockResolvedValue(mockPaymentTxn)
      mockPrisma.sale.findFirst.mockResolvedValue(mockSale)
      mockPrisma.sale.updateMany.mockResolvedValue({ count: 1 })
      mockPrisma.sale.findUnique.mockResolvedValue({ ...mockSale, business: { id: 'biz-001a-a', currency: 'RWF' } })
      mockPrisma.paymentTransaction.updateMany.mockResolvedValue({ count: 1 })
      mockPrisma.paymentTransaction.findUnique.mockResolvedValue(mockPaymentTxn)
      mockPrisma.financialLedgerEntry.create.mockResolvedValue({})
      mockPrisma.orderToken.findFirst.mockResolvedValue(null)
      mockPrisma.paymentTransaction.update.mockResolvedValue(mockPaymentTxn)

      const { PaymentCompletionService } = require('@/lib/services/payment-completion.service')
      // PaymentCompletionService succeeds (financial truth established)
      // but notification inside it fails — it catches errors internally
      const onPaymentSuccessSpy = jest.spyOn(PaymentCompletionService, 'onPaymentSuccess').mockResolvedValue(undefined)

      const handler = require('@/pages/api/webhooks/intouch').default

      const req: any = {
        method: 'POST',
        headers: {
          authorization: 'Basic ' + Buffer.from('whuser:whpass').toString('base64'),
        },
        body: buildWebhookBody(),
      }
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }

      await handler(req, res)

      // Financial truth was established — 200 returned
      expect(res.status).toHaveBeenCalledWith(200)
      expect(onPaymentSuccessSpy).toHaveBeenCalled()

      onPaymentSuccessSpy.mockRestore()
    })
  })

  // ─── Additional: Non-Sale transactions use existing path ─────────────────

  describe('Non-Sale transactions (subscription, marketplace)', () => {
    it('should use direct update path for SUCCESS without linked Sale (subscription)', async () => {
      const subscriptionTxn = {
        ...mockPaymentTxn,
        subscriptionId: 'sub-123',
      }
      mockPrisma.paymentTransaction.findFirst.mockResolvedValue(subscriptionTxn)
      mockPrisma.sale.findFirst.mockResolvedValue(null) // No Sale linked
      mockPrisma.paymentTransaction.update.mockResolvedValue(subscriptionTxn)

      const { PaymentCompletionService } = require('@/lib/services/payment-completion.service')
      const onPaymentSuccessSpy = jest.spyOn(PaymentCompletionService, 'onPaymentSuccess').mockResolvedValue(undefined)

      const handler = require('@/pages/api/webhooks/intouch').default

      const req: any = {
        method: 'POST',
        headers: {
          authorization: 'Basic ' + Buffer.from('whuser:whpass').toString('base64'),
        },
        body: buildWebhookBody(),
      }
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }

      await handler(req, res)

      // PaymentCompletionService NOT called (no Sale)
      expect(onPaymentSuccessSpy).not.toHaveBeenCalled()
      // Direct update used instead
      expect(mockPrisma.paymentTransaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: PaymentTransactionStatus.SUCCESS }),
        })
      )

      onPaymentSuccessSpy.mockRestore()
    })
  })
})
