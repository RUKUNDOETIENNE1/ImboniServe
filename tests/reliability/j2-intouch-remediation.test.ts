/**
 * JOURNEY #2 REMEDIATION — InTouch Sale Linkage + Legacy Timeout Tests
 *
 * P1-1: The InTouch webhook previously resolved the Sale ONLY via
 *       sale.paymentTransactionId. Initiate-path transactions carry the Sale
 *       id in referenceId instead — a successful callback marked the
 *       PaymentTransaction SUCCESS while the Sale stayed PENDING (no
 *       completion, no dispatch, no slip, no settlement).
 *       Fix: deterministic fallback — referenceId resolved scoped to
 *       transaction.businessId; amount check uses the order-side amount
 *       (orderAmountCents ?? amountCents). initiate.ts validates that a
 *       client-supplied orderId belongs to the caller's business and derives
 *       the order amount from the Sale.
 *
 * P1-2: The legacy InTouchService (initiate, Tap & Leave, refunds) had no
 *       fetch timeout. Fix: fetchWithTimeout — 30s initiation, 15s queries —
 *       matching the canonical provider's OEC-001C convention.
 */

import { PaymentTransactionStatus } from '@prisma/client'
import { TransactionStatus } from '@/lib/payments/types'

// ─── Mock Setup ──────────────────────────────────────────────────────────────

const mockSale = {
  id: 'sale-j2-1',
  businessId: 'biz-j2-a',
  orderNumber: 'ORD-J2-001',
  totalAmountCents: 11800,
  paymentStatus: 'PENDING',
  status: 'ACTIVE',
  paymentTransactionId: null, // initiate-path: no canonical link (the defect)
}

const mockPaymentTxn = {
  id: 'pt-j2-1',
  businessId: 'biz-j2-a',
  amountCents: 12390, // 11800 + 5% customer fee
  orderAmountCents: 11800, // pre-fee order total — matches Sale.totalAmountCents
  currency: 'RWF',
  status: 'PENDING',
  webhookVerified: false,
  subscriptionId: null,
  marketplaceOrderId: null,
  referenceId: 'sale-j2-1', // initiate path stores Sale id here
  transactionId: 'IMBONI-j2-1-1234567890',
  rawRequest: {},
}

const mockPrisma = {
  sale: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  paymentTransaction: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    create: jest.fn(),
  },
  financialLedgerEntry: { create: jest.fn() },
  orderToken: { findFirst: jest.fn(), update: jest.fn() },
  reservation: { findUnique: jest.fn() },
  business: { findUnique: jest.fn() },
  marketplaceOrder: { update: jest.fn() },
  $transaction: jest.fn((fn) => fn(mockPrisma)),
}

jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

jest.mock('@/lib/logger', () => ({
  logger: { child: () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn() }) },
}))

jest.mock('@/lib/realtime', () => ({ broadcast: jest.fn() }))
jest.mock('@/lib/pusher-server', () => ({ triggerEvent: jest.fn() }))

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
const mockDispatchToKitchen = jest.fn()
jest.mock('@/lib/services/kitchen-dispatch.service', () => ({
  KitchenDispatchService: { dispatchToKitchen: mockDispatchToKitchen },
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
jest.mock('@/lib/settlement', () => ({
  SettlementIntelligenceService: { onPaymentSuccess: jest.fn() },
}))
jest.mock('@/lib/services/payment-ledger-events.service', () => ({
  ensurePaymentLedgerEvent: jest.fn(),
}))
jest.mock('@/lib/services/irembopay.service', () => ({
  IremboPayService: {
    calculateVATAmounts: jest.fn((gross: number) => ({
      vatAmountCents: Math.round(gross * 18 / 118),
      exVatAmountCents: gross - Math.round(gross * 18 / 118),
    })),
  },
}))
jest.mock('@/lib/middleware/withRateLimit', () => ({
  withRateLimit: (h: any) => h,
}))
jest.mock('@/lib/middleware/error-handler.middleware', () => ({
  withErrorHandler: (h: any) => h,
}))
jest.mock('@/lib/middleware/permission.middleware', () => ({
  requirePermission: () => (fn: any) => fn,
}))
jest.mock('@/lib/api/business-context', () => ({
  resolveBusinessContext: jest.fn(() =>
    Promise.resolve({ businessId: 'biz-j2-a', userId: 'user-j2-1', roles: ['OWNER'] })
  ),
}))
jest.mock('@/lib/services/currency-exchange.service', () => ({
  convertMinorUnits: jest.fn(),
  getDefaultPaymentRateMaxAgeHours: jest.fn(() => 24),
  getRateTypeForOperation: jest.fn(() => 'SELLING'),
}))
jest.mock('@/lib/utils/phone', () => ({
  normalizePhoneForProvider: (p: string) => p.replace(/^\+/, ''),
}))
jest.mock('@/lib/services/intouch.service', () => {
  const actual = jest.requireActual('@/lib/services/intouch.service')
  return {
    InTouchService: {
      ...actual.InTouchService,
      requestPayment: jest.fn().mockResolvedValue({ responsecode: '1000', transactionid: 'itp-1' }),
      generateRequestTransactionId: jest.fn(() => 'IMBONI-j2-1-1234567890'),
      getPaymentStatus: actual.InTouchService.getPaymentStatus,
      isSuccess: actual.InTouchService.isSuccess,
      isPending: actual.InTouchService.isPending,
      getErrorMessage: actual.InTouchService.getErrorMessage,
    },
  }
})

// fetchWithTimeout is exercised for the legacy-service timeout tests
jest.mock('@/lib/utils/fetch-with-timeout', () => {
  const actual = jest.requireActual('@/lib/utils/fetch-with-timeout')
  return { ...actual, fetchWithTimeout: jest.fn() }
})

jest.mock('@/lib/payments/providers/intouch.provider', () => ({
  InTouchProvider: jest.fn().mockImplementation(() => ({
    handleWebhook: jest.fn().mockResolvedValue({
      provider: 'INTOUCH',
      transactionId: 'intouch-txn-j2',
      providerReference: 'IMBONI-j2-1-1234567890',
      status: TransactionStatus.SUCCESS,
      amount: undefined,
      currency: 'RWF',
      timestamp: new Date('2026-09-22T10:00:00Z'),
      rawPayload: {
        requesttransactionid: 'IMBONI-j2-1-1234567890',
        transactionid: 'intouch-txn-j2',
        responsecode: '00',
        status: 'successful',
        statusdesc: 'Payment completed',
        referenceno: 'REF-J2',
      },
    }),
    validateWebhook: jest.fn().mockResolvedValue({ valid: true }),
  })),
}))

function buildWebhookBody(overrides: any = {}) {
  return {
    requesttransactionid: 'IMBONI-j2-1-1234567890',
    transactionid: 'intouch-txn-j2',
    responsecode: '00',
    status: 'successful',
    statusdesc: 'Payment completed',
    referenceno: 'REF-J2',
    ...overrides,
  }
}

function buildRes() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() } as any
}

function buildWebhookReq(overrides: any = {}) {
  return {
    method: 'POST',
    headers: {
      authorization: 'Basic ' + Buffer.from('whuser:whpass').toString('base64'),
    },
    body: buildWebhookBody(overrides),
  } as any
}

// Sale resolver mock: paymentTransactionId link misses; referenceId fallback hits.
function mockSaleResolutionViaReferenceId(saleOverride: any = mockSale) {
  mockPrisma.sale.findFirst.mockImplementation((args: any) => {
    if (args.where.paymentTransactionId) return Promise.resolve(null)
    if (args.where.id === saleOverride.id && args.where.businessId === saleOverride.businessId) {
      return Promise.resolve(saleOverride)
    }
    return Promise.resolve(null)
  })
}

const ORIGINAL_ENV = process.env

beforeEach(() => {
  jest.clearAllMocks()
  process.env = { ...ORIGINAL_ENV }
  process.env.INTOUCH_WEBHOOK_USERNAME = 'whuser'
  process.env.INTOUCH_WEBHOOK_PASSWORD = 'whpass'
})

afterEach(() => {
  process.env = ORIGINAL_ENV
})

// ─── P1-1: Webhook → Sale Linkage ────────────────────────────────────────────

describe('J2 P1-1: InTouch webhook resolves Sale via referenceId fallback', () => {
  it('completes an unlinked initiate-path transaction through PaymentCompletionService', async () => {
    mockPrisma.paymentTransaction.findFirst.mockResolvedValue(mockPaymentTxn)
    mockSaleResolutionViaReferenceId()
    mockPrisma.paymentTransaction.update.mockResolvedValue(mockPaymentTxn)

    const { PaymentCompletionService } = require('@/lib/services/payment-completion.service')
    const spy = jest.spyOn(PaymentCompletionService, 'onPaymentSuccess').mockResolvedValue(undefined)

    const handler = require('@/pages/api/webhooks/intouch').default
    const res = buildRes()
    await handler(buildWebhookReq(), res)

    // The referenceId fallback must resolve sale-j2-1 and trigger canonical completion
    expect(spy).toHaveBeenCalledWith('pt-j2-1', 'sale-j2-1', { source: 'intouch-webhook' })
    expect(res.status).toHaveBeenCalledWith(200)
    spy.mockRestore()
  })

  it('reaches the station dispatch boundary on real completion', async () => {
    mockPrisma.paymentTransaction.findFirst.mockResolvedValue(mockPaymentTxn)
    mockSaleResolutionViaReferenceId()
    // Real onPaymentSuccess internals
    mockPrisma.sale.updateMany.mockResolvedValue({ count: 1 })
    mockPrisma.sale.findUnique.mockResolvedValue({
      ...mockSale,
      business: { id: 'biz-j2-a', currency: 'RWF' },
      kitchenDispatchStatus: null,
      table: null,
      participant: null,
      items: [],
    })
    mockPrisma.paymentTransaction.updateMany.mockResolvedValue({ count: 1 })
    mockPrisma.paymentTransaction.findUnique.mockResolvedValue(mockPaymentTxn)
    mockPrisma.financialLedgerEntry.create.mockResolvedValue({})
    mockPrisma.orderToken.findFirst.mockResolvedValue(null)
    mockPrisma.paymentTransaction.update.mockResolvedValue(mockPaymentTxn)

    const handler = require('@/pages/api/webhooks/intouch').default
    const res = buildRes()
    await handler(buildWebhookReq(), res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(mockDispatchToKitchen).toHaveBeenCalled()
  })

  it('remains idempotent on replayed callback', async () => {
    mockPrisma.paymentTransaction.findFirst.mockResolvedValue({
      ...mockPaymentTxn,
      status: PaymentTransactionStatus.SUCCESS,
      webhookVerified: true,
    })

    const { PaymentCompletionService } = require('@/lib/services/payment-completion.service')
    const spy = jest.spyOn(PaymentCompletionService, 'onPaymentSuccess').mockResolvedValue(undefined)

    const handler = require('@/pages/api/webhooks/intouch').default
    const res = buildRes()
    await handler(buildWebhookReq(), res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'Already processed' })
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('does NOT complete a Sale belonging to another business via referenceId', async () => {
    // transaction.referenceId points at a sale of a different business
    const foreignTxn = { ...mockPaymentTxn, referenceId: 'sale-foreign-biz' }
    mockPrisma.paymentTransaction.findFirst.mockResolvedValue(foreignTxn)
    // referenceId exists but resolves to nothing within transaction.businessId
    mockPrisma.sale.findFirst.mockResolvedValue(null)
    mockPrisma.paymentTransaction.update.mockResolvedValue(foreignTxn)

    const { PaymentCompletionService } = require('@/lib/services/payment-completion.service')
    const spy = jest.spyOn(PaymentCompletionService, 'onPaymentSuccess').mockResolvedValue(undefined)

    const handler = require('@/pages/api/webhooks/intouch').default
    const res = buildRes()
    await handler(buildWebhookReq(), res)

    // The tenant-scoped fallback fails to resolve → no completion; txn still
    // gets its status update through the non-sale branch.
    expect(spy).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    // The fallback query must have carried the businessId constraint
    const fallbackCall = mockPrisma.sale.findFirst.mock.calls.find(
      (c: any) => c[0]?.where?.id === 'sale-foreign-biz'
    )
    expect(fallbackCall?.[0].where.businessId).toBe('biz-j2-a')
    spy.mockRestore()
  })

  it('rejects completion when the order-side amount mismatches the Sale total', async () => {
    const mismatched = { ...mockPaymentTxn, orderAmountCents: 999999 }
    mockPrisma.paymentTransaction.findFirst.mockResolvedValue(mismatched)
    mockSaleResolutionViaReferenceId()

    const { PaymentCompletionService } = require('@/lib/services/payment-completion.service')
    const spy = jest.spyOn(PaymentCompletionService, 'onPaymentSuccess').mockResolvedValue(undefined)

    const handler = require('@/pages/api/webhooks/intouch').default
    const res = buildRes()
    await handler(buildWebhookReq(), res)

    expect(res.status).toHaveBeenCalledWith(422)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('does NOT complete the Sale on a failed callback', async () => {
    mockPrisma.paymentTransaction.findFirst.mockResolvedValue(mockPaymentTxn)
    mockPrisma.paymentTransaction.update.mockResolvedValue(mockPaymentTxn)

    const { InTouchProvider } = require('@/lib/payments/providers/intouch.provider')
    InTouchProvider.mockImplementationOnce(() => ({
      handleWebhook: jest.fn().mockResolvedValue({
        provider: 'INTOUCH',
        transactionId: 'intouch-txn-j2',
        providerReference: 'IMBONI-j2-1-1234567890',
        status: TransactionStatus.FAILED,
        amount: undefined,
        currency: 'RWF',
        timestamp: new Date(),
        rawPayload: { status: 'failed' },
      }),
      validateWebhook: jest.fn().mockResolvedValue({ valid: true }),
    }))

    const { PaymentCompletionService } = require('@/lib/services/payment-completion.service')
    const spy = jest.spyOn(PaymentCompletionService, 'onPaymentSuccess').mockResolvedValue(undefined)

    const handler = require('@/pages/api/webhooks/intouch').default
    const res = buildRes()
    await handler(buildWebhookReq({ status: 'failed' }), res)

    expect(spy).not.toHaveBeenCalled()
    expect(mockPrisma.sale.findFirst).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

// ─── P1-1: Initiate → deterministic PaymentTransaction ↔ Sale link ───────────

describe('J2 P1-1: initiate validates and derives the Sale relationship', () => {
  function buildInitiateReq(body: any) {
    return { method: 'POST', body } as any
  }

  it('stores referenceId=sale.id and derives order amount from the Sale', async () => {
    mockPrisma.sale.findFirst.mockResolvedValue({ id: 'sale-j2-1', totalAmountCents: 11800 })
    mockPrisma.business.findUnique.mockResolvedValue({ currency: 'RWF', taxRate: 18 })
    mockPrisma.paymentTransaction.create.mockImplementation(async ({ data }: any) => ({ id: 'pt-new', ...data }))
    mockPrisma.paymentTransaction.update.mockResolvedValue({})

    const handler = require('@/pages/api/payments/intouch/initiate').default
    const res = buildRes()
    await handler(buildInitiateReq({ amount: 999999, phone: '0788123456', orderId: 'sale-j2-1' }), res)

    // Sale lookup must be tenant-scoped
    expect(mockPrisma.sale.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'sale-j2-1', businessId: 'biz-j2-a' } })
    )
    const created = mockPrisma.paymentTransaction.create.mock.calls[0][0].data
    expect(created.referenceId).toBe('sale-j2-1')
    // Order amount derived from Sale (11800), NOT the client-supplied 999999
    expect(created.orderAmountCents).toBe(11800)
    expect(created.netToBusinessCents).toBe(11800)
    // Customer is still charged the fee-inclusive gross:
    // fee rounds in major units (118 * 0.05 = 5.9 → 6) → 124 * 100
    expect(created.amountCents).toBe(12400)
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('rejects an orderId that does not belong to the business', async () => {
    mockPrisma.sale.findFirst.mockResolvedValue(null)
    mockPrisma.business.findUnique.mockResolvedValue({ currency: 'RWF', taxRate: 18 })

    const { InTouchService } = require('@/lib/services/intouch.service')
    const handler = require('@/pages/api/payments/intouch/initiate').default
    const res = buildRes()
    await handler(buildInitiateReq({ amount: 5000, phone: '0788123456', orderId: 'sale-foreign' }), res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(mockPrisma.paymentTransaction.create).not.toHaveBeenCalled()
    expect(InTouchService.requestPayment).not.toHaveBeenCalled()
  })
})

// ─── P1-2: Legacy InTouchService bounded timeout ─────────────────────────────

describe('J2 P1-2: legacy InTouchService uses fetchWithTimeout', () => {
  const env = {
    INTOUCH_API_URL: 'https://api.test',
    INTOUCH_USERNAME: 'u',
    INTOUCH_ACCOUNT_NO: '12345',
    INTOUCH_PASSWORD: 'p',
  }

  function loadService() {
    jest.resetModules()
    process.env = { ...ORIGINAL_ENV, ...env }
    // The file-level factory mocks intouch.service for the webhook tests;
    // here we need the REAL service so its fetch calls reach fetchWithTimeout.
    jest.dontMock('@/lib/services/intouch.service')
    return require('@/lib/services/intouch.service').InTouchService
  }

  it('requestPayment uses a 30s bounded fetch', async () => {
    const Svc = loadService()
    const fwt = require('@/lib/utils/fetch-with-timeout').fetchWithTimeout as jest.Mock
    fwt.mockResolvedValue({ json: async () => ({ responsecode: '1000', transactionid: 'x' }) })

    await Svc.requestPayment({ amount: 100, mobilePhoneNo: '0788123456', requestTransactionId: 'r1' })

    expect(fwt).toHaveBeenCalledWith(
      'https://api.test/requestpayment/',
      expect.objectContaining({ method: 'POST' }),
      30_000
    )
  })

  it('getPaymentStatus uses a 15s bounded fetch', async () => {
    const Svc = loadService()
    const fwt = require('@/lib/utils/fetch-with-timeout').fetchWithTimeout as jest.Mock
    fwt.mockResolvedValue({ json: async () => ({ responsecode: '01' }) })

    await Svc.getPaymentStatus('r1', 't1')

    expect(fwt).toHaveBeenCalledWith(
      'https://api.test/gettransactionstatus/',
      expect.objectContaining({ method: 'POST' }),
      15_000
    )
  })

  it('fails cleanly with a timeout error when InTouch stalls', async () => {
    const Svc = loadService()
    const fwtModule = require('@/lib/utils/fetch-with-timeout')
    const fwt = fwtModule.fetchWithTimeout as jest.Mock
    // Must construct from the post-resetModules class instance the service sees
    fwt.mockRejectedValue(new fwtModule.FetchTimeoutError('https://api.test/requestpayment/', 30_000))

    await expect(
      Svc.requestPayment({ amount: 100, mobilePhoneNo: '0788123456', requestTransactionId: 'r1' })
    ).rejects.toThrow('InTouch API request timed out')
  })

  it('requestDeposit also uses the bounded fetch', async () => {
    const Svc = loadService()
    const fwt = require('@/lib/utils/fetch-with-timeout').fetchWithTimeout as jest.Mock
    fwt.mockResolvedValue({ json: async () => ({ responsecode: '2001' }) })

    await Svc.requestDeposit({ amount: 100, mobilePhoneNo: '0788123456', requestTransactionId: 'r1' })

    expect(fwt).toHaveBeenCalledWith(
      'https://api.test/requestdeposit/',
      expect.objectContaining({ method: 'POST' }),
      30_000
    )
  })
})
