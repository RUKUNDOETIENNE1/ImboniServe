/**
 * PHASE A — FIRST-CUSTOMER READINESS LOCK regression tests
 *
 * P0-1  QR draft: MoMo payment methods map to valid PaymentGateway enum
 *       (previously 'MTN_MONEY'/'AIRTEL_MONEY' → Prisma throw → 500).
 * P1-5  WEB payment: when IremboPay produces no payment link the order must
 *       flag manual staff confirmation instead of a dead-end.
 * P0-2  /api/dashboard/{ceo,cfo}: platform-wide aggregates require executive
 *       roles — tenant OWNER denied.
 * P1-1  DIE intelligence/control-plane endpoints: unauthenticated → 401.
 * P1-2  /api/guest/*: guest PII requires bound QR token or same-business staff.
 * P1-3  Cross-tenant mutations rejected on reservations, CMS, POs, supplier
 *       orders, loyalty issue.
 * P1-4  PaymentCompletionService reaches settlement-intelligence step
 *       (effectiveTxnId scope fix).
 */

// ─── Shared prisma mock ───────────────────────────────────────────────────────
const mockPrisma = {
  business: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
  customer: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
  paymentTransaction: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn(), updateMany: jest.fn() },
  sale: { update: jest.fn(), count: jest.fn(), updateMany: jest.fn(), findUnique: jest.fn() },
  seatSession: { findUnique: jest.fn(), update: jest.fn() },
  postAttribution: { create: jest.fn() },
  orderToken: { findUnique: jest.fn() },
  reservation: { findUnique: jest.fn() },
  purchaseOrder: { findUnique: jest.fn() },
  supplierOrder: { findUnique: jest.fn(), update: jest.fn() },
  contentPost: { findFirst: jest.fn(), delete: jest.fn() },
  user: { findUnique: jest.fn(), update: jest.fn() },
  $transaction: jest.fn((fn: any) => fn(mockPrisma)),
}

jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))
jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), child: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }) },
}))

const mockGetServerSession = jest.fn()
jest.mock('next-auth/next', () => ({ __esModule: true, getServerSession: (...a: any[]) => mockGetServerSession(...a) }))
jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(() => () => {}),
  getServerSession: (...a: any[]) => mockGetServerSession(...a),
}))

jest.mock('@/lib/api/business-context', () => ({ resolveBusinessContext: jest.fn() }))
jest.mock('@/lib/middleware/error-handler.middleware', () => ({ withErrorHandler: (h: any) => h }))
jest.mock('@/lib/middleware/withFeatureCheck', () => ({
  requiresFeature: () => (h: any) => h,
  requiresActiveSubscription: (h: any) => h,
  requiresResourceLimit: () => () => (h: any) => h,
}))

jest.mock('@/lib/services/qr-token.service', () => ({
  validateAccessToken: jest.fn(),
  markTokenUsed: jest.fn(),
  verifyQRSessionForBusiness: jest.fn(),
}))
jest.mock('@/lib/services/qr-order.service', () => ({
  calculateOrderPricing: jest.fn(),
  createDraftOrder: jest.fn(),
  checkSlotCapacity: jest.fn(),
}))
jest.mock('@/lib/services/irembopay.service', () => ({ IremboPayService: { createInvoice: jest.fn() } }))
jest.mock('@/lib/services/idempotency.service', () => ({
  IdempotencyService: { checkAndLock: jest.fn(), storeResponse: jest.fn() },
}))
jest.mock('@/lib/utils/phone', () => ({ normalizePhone: (p: string) => p }))
jest.mock('@/lib/services/guest-recognition.service', () => ({
  GuestRecognitionService: {
    recognize: jest.fn(),
    registerOrRecognize: jest.fn(),
    getStaffIntelligence: jest.fn(),
    onOrderCompleted: jest.fn(),
  },
}))
jest.mock('@/lib/services/reservation.service', () => ({
  ReservationService: { cancelReservation: jest.fn().mockResolvedValue({}) },
}))
jest.mock('@/lib/services/purchase-order.service', () => ({
  PurchaseOrderService: {
    getPurchaseOrderById: jest.fn(),
    submitPurchaseOrder: jest.fn(),
  },
}))
jest.mock('@/lib/services/cms.service', () => ({
  CmsService: { updatePost: jest.fn(), submitForReview: jest.fn() },
}))
jest.mock('@/lib/services/intouch.service', () => ({
  InTouchService: { generateRequestTransactionId: jest.fn(() => 'req-1'), requestPayment: jest.fn() },
}))
jest.mock('@/lib/services/payment-ledger-events.service', () => ({ ensurePaymentLedgerEvent: jest.fn() }))
jest.mock('@/lib/die/business-as-plugin/reservations/reservations.shadow', () => ({ ingestReservationShadowEvent: jest.fn().mockResolvedValue({}) }))
jest.mock('@/lib/die/business-as-plugin/suppliers/suppliers.shadow', () => ({ ingestSuppliersShadowEvent: jest.fn().mockResolvedValue({}) }))
jest.mock('@/lib/die/business-as-plugin/procurement/procurement.shadow', () => ({ ingestProcurementShadowEvent: jest.fn().mockResolvedValue({}) }))
jest.mock('@/lib/die/business-as-plugin/loyalty/loyalty.shadow', () => ({ ingestLoyaltyShadowEvent: jest.fn().mockResolvedValue({}) }))
jest.mock('@/lib/die/intelligence-core/intelligence-snapshot.builder', () => ({
  intelligenceSnapshotBuilder: { buildSnapshot: jest.fn().mockResolvedValue({ ok: true }) },
}))
jest.mock('@/lib/die/control-plane/background/ecosystem-monitor', () => ({
  ecosystemMonitor: { getPluginHealthSummary: jest.fn().mockResolvedValue({ ok: true }) },
}))

// Payment-completion dependencies
jest.mock('@/lib/services/smart-dining-slip.service', () => ({
  SmartDiningSlipService: { generateSlip: jest.fn().mockResolvedValue({}) },
}))
jest.mock('@/lib/services/notification.service', () => ({
  NotificationService: { sendOrderNotification: jest.fn().mockResolvedValue({}) },
}))
jest.mock('@/lib/services/audit-log.service', () => ({
  AuditLogService: { log: jest.fn().mockResolvedValue({}) },
}))
jest.mock('@/lib/services/billing-ledger.service', () => ({ logBillingEvent: jest.fn() }))
jest.mock('@/lib/services/kitchen-dispatch.service', () => ({
  KitchenDispatchService: { dispatchToKitchen: jest.fn().mockResolvedValue({}) },
}))
jest.mock('@/lib/realtime', () => ({ broadcast: jest.fn().mockResolvedValue({}) }))
jest.mock('@/lib/settlement', () => ({
  SettlementIntelligenceService: { onPaymentSuccess: jest.fn().mockResolvedValue({}) },
}))

// ─── Imports under test ───────────────────────────────────────────────────────
import draftHandler from '@/pages/api/public/order/draft'
import recognizeHandler from '@/pages/api/guest/recognize'
import staffIntelHandler from '@/pages/api/guest/staff-intelligence'
import reservationCancelHandler from '@/pages/api/reservations/[id]/cancel'
import purchaseOrderHandler from '@/pages/api/purchase-orders/[id]'
import supplierStatusHandler from '@/pages/api/supplier/orders/[id]/status'
import loyaltyIssueHandler from '@/pages/api/loyalty/issue'
import dieOverviewHandler from '@/pages/api/die/intelligence/overview'
import dieEcosystemHandler from '@/pages/api/die/control-plane/ecosystem-health'
import { PaymentCompletionService } from '@/lib/services/payment-completion.service'
import { validateAccessToken, verifyQRSessionForBusiness } from '@/lib/services/qr-token.service'
import { calculateOrderPricing, createDraftOrder } from '@/lib/services/qr-order.service'
import { IremboPayService } from '@/lib/services/irembopay.service'
import { IdempotencyService } from '@/lib/services/idempotency.service'
import { GuestRecognitionService } from '@/lib/services/guest-recognition.service'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { ReservationService } from '@/lib/services/reservation.service'
import { PurchaseOrderService } from '@/lib/services/purchase-order.service'
import { CmsService } from '@/lib/services/cms.service'
import { SettlementIntelligenceService } from '@/lib/settlement'

function reqRes(opts: { method?: string; body?: any; query?: any; headers?: any; cookies?: any } = {}) {
  const req: any = {
    method: opts.method || 'POST',
    body: opts.body || {},
    query: opts.query || {},
    headers: opts.headers || {},
    cookies: opts.cookies || {},
    socket: { remoteAddress: '10.0.0.9' },
  }
  const res: any = {
    statusCode: 200, body: null,
    status(c: number) { res.statusCode = c; return res },
    json(d: any) { res.body = d; return res },
    setHeader() { return res },
    end() { return res },
  }
  return { req, res }
}

const BUSINESS = {
  id: 'biz-1', name: 'Test Co', enableQRInVenue: true, enableQRRemote: true,
  requireDepositRemote: false, defaultDepositPercent: 0, maxRemoteOrdersPerSlot: 5,
  slotDurationMinutes: 15, taxMode: 'INCLUSIVE', taxRate: 18, currency: 'RWF',
}
const PRICING = {
  totalCents: 1000, subtotalCents: 847, vatCents: 153, depositCents: 0,
  remainingCents: 0, platformFeeCents: 0, taxMode: 'INCLUSIVE', taxRate: 18,
}
const CUID_ITEM = 'cltest00000000000000000a1'

function draftBody(paymentMethod: string) {
  return {
    accessToken: 'valid-token-12345',
    items: [{ menuItemId: CUID_ITEM, quantity: 2 }],
    paymentMethod,
    mode: 'invenue',
  }
}

function setupDraft() {
  mockPrisma.business.findUnique.mockResolvedValue(BUSINESS)
  mockPrisma.paymentTransaction.create.mockResolvedValue({ id: 'pt-1' })
  mockPrisma.sale.update.mockResolvedValue({})
  mockPrisma.sale.count.mockResolvedValue(0)
  mockPrisma.customer.findUnique.mockResolvedValue(null)
  ;(validateAccessToken as jest.Mock).mockResolvedValue({ jti: 'jti-1', branchId: 'biz-1', tableId: 'tbl-1' })
  ;(calculateOrderPricing as jest.Mock).mockResolvedValue(PRICING)
  ;(createDraftOrder as jest.Mock).mockResolvedValue({ saleId: 'sale-1', orderNumber: 'ORD-1' })
  ;(IdempotencyService.checkAndLock as jest.Mock).mockResolvedValue({ isNew: true })
}

// ─── P0-1 + P1-5: draft gateway + WEB manual-confirmation ────────────────────
describe('QR draft — payment gateway correctness', () => {
  beforeEach(() => { jest.clearAllMocks(); setupDraft() })

  it.each(['MTN_MOBILE_MONEY', 'AIRTEL_MONEY'])('%s maps to MOBILE_MONEY gateway and succeeds', async (method) => {
    const { req, res } = reqRes({ body: draftBody(method) })
    await draftHandler(req, res)
    expect(res.statusCode).toBe(201)
    expect(mockPrisma.paymentTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ gateway: 'MOBILE_MONEY' }) })
    )
  })

  it('CASH keeps CASH gateway', async () => {
    const { req, res } = reqRes({ body: draftBody('CASH') })
    await draftHandler(req, res)
    expect(res.statusCode).toBe(201)
    expect(mockPrisma.paymentTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ gateway: 'CASH' }) })
    )
  })

  it('WEB without an IremboPay link flags manual confirmation (no dead-end)', async () => {
    ;(IremboPayService.createInvoice as jest.Mock).mockRejectedValue(new Error('no creds'))
    const { req, res } = reqRes({ body: draftBody('WEB') })
    await draftHandler(req, res)
    expect(res.statusCode).toBe(201)
    expect(res.body.paymentLinkUrl).toBeNull()
    expect(res.body.requiresManualConfirmation).toBe(true)
  })

  it('WEB with a working IremboPay link does not flag manual confirmation', async () => {
    ;(IremboPayService.createInvoice as jest.Mock).mockResolvedValue({
      invoiceNumber: 'INV-1', paymentLinkUrl: 'https://pay.example/1', expiryAt: null,
    })
    const { req, res } = reqRes({ body: draftBody('WEB') })
    await draftHandler(req, res)
    expect(res.statusCode).toBe(201)
    expect(res.body.paymentLinkUrl).toBe('https://pay.example/1')
    expect(res.body.requiresManualConfirmation).toBe(false)
  })
})

// ─── P0-2: exec-only dashboards ──────────────────────────────────────────────
describe('Executive dashboard authorization (platform-wide data)', () => {
  it('tenant OWNER is denied from /api/dashboard/ceo', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'u1', role: 'OWNER', roles: ['OWNER'], businessId: 'biz-1' } })
    const ceoHandler = (await import('@/pages/api/dashboard/ceo')).default
    const { req, res } = reqRes({ method: 'GET' })
    await ceoHandler(req, res)
    expect(res.statusCode).toBe(403)
  })

  it('tenant OWNER is denied from /api/dashboard/cfo', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'u1', role: 'OWNER', roles: ['OWNER'], businessId: 'biz-1' } })
    const cfoHandler = (await import('@/pages/api/dashboard/cfo')).default
    const { req, res } = reqRes({ method: 'GET' })
    await cfoHandler(req, res)
    expect(res.statusCode).toBe(403)
  })

  it('ADMIN passes the role gate on /api/dashboard/ceo (may fail downstream, never 401/403)', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'a1', role: 'ADMIN', roles: ['ADMIN'], businessId: 'biz-1' } })
    const ceoHandler = (await import('@/pages/api/dashboard/ceo')).default
    const { req, res } = reqRes({ method: 'GET' })
    await ceoHandler(req, res)
    expect([401, 403]).not.toContain(res.statusCode)
  })

  it('unauthenticated request is rejected on /api/dashboard/ceo', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const ceoHandler = (await import('@/pages/api/dashboard/ceo')).default
    const { req, res } = reqRes({ method: 'GET' })
    await ceoHandler(req, res)
    expect(res.statusCode).toBe(401)
  })
})

// ─── P1-1: DIE endpoints require auth ────────────────────────────────────────
describe('DIE endpoints — authentication required', () => {
  beforeEach(() => jest.clearAllMocks())

  it.each([
    ['intelligence/overview', () => dieOverviewHandler],
    ['control-plane/ecosystem-health', () => dieEcosystemHandler],
  ])('GET /api/die/%s returns 401 without a session', async (_name, getHandler) => {
    ;(resolveBusinessContext as jest.Mock).mockImplementation(async (_req: any, res: any) => {
      res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' })
      return null
    })
    const { req, res } = reqRes({ method: 'GET' })
    await getHandler()(req, res)
    expect(res.statusCode).toBe(401)
  })

  it('authenticated business context reaches the handler', async () => {
    ;(resolveBusinessContext as jest.Mock).mockResolvedValue({ userId: 'u1', businessId: 'biz-1', roles: ['OWNER'], email: 'x' })
    const { req, res } = reqRes({ method: 'GET' })
    await dieOverviewHandler(req, res)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })
})

// ─── P1-2: guest PII authorization ───────────────────────────────────────────
describe('Guest intelligence — PII authorization', () => {
  beforeEach(() => jest.clearAllMocks())

  it('recognize: no token and no session → 401', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const { req, res } = reqRes({ body: { phone: '+250788000001', businessId: 'biz-1' } })
    await recognizeHandler(req, res)
    expect(res.statusCode).toBe(401)
    expect(GuestRecognitionService.recognize).not.toHaveBeenCalled()
  })

  it('recognize: valid QR token bound to business → 200', async () => {
    ;(verifyQRSessionForBusiness as jest.Mock).mockResolvedValue({ jti: 'jti-1', branchId: 'biz-1' })
    ;(GuestRecognitionService.recognize as jest.Mock).mockResolvedValue({ intelligence: null })
    const { req, res } = reqRes({
      headers: { authorization: 'Bearer qr-token' },
      body: { phone: '+250788000001', businessId: 'biz-1' },
    })
    await recognizeHandler(req, res)
    expect(verifyQRSessionForBusiness).toHaveBeenCalledWith('qr-token', 'biz-1')
    expect(res.statusCode).toBe(200)
  })

  it('recognize: foreign-business token rejected', async () => {
    ;(verifyQRSessionForBusiness as jest.Mock).mockResolvedValue(null)
    mockGetServerSession.mockResolvedValue(null)
    const { req, res } = reqRes({
      headers: { authorization: 'Bearer foreign-token' },
      body: { phone: '+250788000001', businessId: 'biz-1' },
    })
    await recognizeHandler(req, res)
    expect(res.statusCode).toBe(401)
  })

  it('recognize: same-business staff session works', async () => {
    ;(verifyQRSessionForBusiness as jest.Mock).mockResolvedValue(null)
    mockGetServerSession.mockResolvedValue({ user: { id: 'u1', roles: ['WAITER'], businessId: 'biz-1' } })
    ;(GuestRecognitionService.recognize as jest.Mock).mockResolvedValue({ intelligence: null })
    const { req, res } = reqRes({ body: { phone: '+250788000001', businessId: 'biz-1' } })
    await recognizeHandler(req, res)
    expect(res.statusCode).toBe(200)
  })

  it('staff-intelligence: cross-business staff → 403', async () => {
    ;(resolveBusinessContext as jest.Mock).mockResolvedValue({ userId: 'u1', businessId: 'biz-2', roles: ['WAITER'], email: 'x' })
    const { req, res } = reqRes({ method: 'GET', query: { phone: '+250788000001', businessId: 'biz-1' } })
    await staffIntelHandler(req, res)
    expect(res.statusCode).toBe(403)
    expect(GuestRecognitionService.getStaffIntelligence).not.toHaveBeenCalled()
  })

  it('staff-intelligence: same-business staff → 200', async () => {
    ;(resolveBusinessContext as jest.Mock).mockResolvedValue({ userId: 'u1', businessId: 'biz-1', roles: ['WAITER'], email: 'x' })
    ;(GuestRecognitionService.getStaffIntelligence as jest.Mock).mockResolvedValue({ isReturning: true })
    const { req, res } = reqRes({ method: 'GET', query: { phone: '+250788000001', businessId: 'biz-1' } })
    await staffIntelHandler(req, res)
    expect(res.statusCode).toBe(200)
  })
})

// ─── P1-3: cross-tenant mutations ────────────────────────────────────────────
describe('Cross-tenant mutation guards', () => {
  beforeEach(() => jest.clearAllMocks())

  it('reservation cancel: foreign business → 403', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'u1', roles: ['MANAGER'], businessId: 'biz-2' } })
    mockPrisma.reservation.findUnique.mockResolvedValue({ id: 'res-1', businessId: 'biz-1', depositCents: 0 })
    const { req, res } = reqRes({ query: { id: 'res-1' }, body: { reason: 'test' } })
    await reservationCancelHandler(req, res)
    expect(res.statusCode).toBe(403)
    expect(ReservationService.cancelReservation).not.toHaveBeenCalled()
  })

  it('reservation cancel: same business proceeds', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'u1', roles: ['MANAGER'], businessId: 'biz-1' } })
    mockPrisma.reservation.findUnique.mockResolvedValue({ id: 'res-1', businessId: 'biz-1', depositCents: 0 })
    const { req, res } = reqRes({ query: { id: 'res-1' }, body: { reason: 'test' } })
    await reservationCancelHandler(req, res)
    expect(ReservationService.cancelReservation).toHaveBeenCalledWith('res-1', 'test')
    expect(res.statusCode).toBe(200)
  })

  it('purchase-orders/[id]: foreign business → 404, no mutation', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'u1', name: 'M', roles: ['MANAGER'], businessId: 'biz-2' } })
    ;(PurchaseOrderService.getPurchaseOrderById as jest.Mock).mockResolvedValue({ id: 'po-1', businessId: 'biz-1' })
    const { req, res } = reqRes({ query: { id: 'po-1' }, body: { action: 'submit' } })
    await purchaseOrderHandler(req, res)
    expect(res.statusCode).toBe(404)
    expect(PurchaseOrderService.submitPurchaseOrder).not.toHaveBeenCalled()
  })

  it('purchase-orders/[id]: same business can submit', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'u1', name: 'M', roles: ['MANAGER'], businessId: 'biz-1' } })
    ;(PurchaseOrderService.getPurchaseOrderById as jest.Mock).mockResolvedValue({ id: 'po-1', businessId: 'biz-1' })
    ;(PurchaseOrderService.submitPurchaseOrder as jest.Mock).mockResolvedValue({ id: 'po-1', status: 'SUBMITTED' })
    const { req, res } = reqRes({ query: { id: 'po-1' }, body: { action: 'submit' } })
    await purchaseOrderHandler(req, res)
    expect(res.statusCode).toBe(200)
  })

  it('supplier order status: foreign business → 403', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'u1', roles: ['MANAGER'], businessId: 'biz-2' } })
    mockPrisma.supplierOrder.findUnique.mockResolvedValue({ id: 'so-1', businessId: 'biz-1', supplierId: 's1', status: 'PENDING' })
    const { req, res } = reqRes({ query: { id: 'so-1' }, body: { status: 'CONFIRMED' } })
    await supplierStatusHandler(req, res)
    expect(res.statusCode).toBe(403)
    expect(mockPrisma.supplierOrder.update).not.toHaveBeenCalled()
  })

  it('loyalty issue: customer of another business → 403', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'u1', roles: ['MANAGER'], businessId: 'biz-1' } })
    mockPrisma.customer.findUnique.mockResolvedValue({ id: 'c-1', businessId: 'biz-2' })
    const { req, res } = reqRes({ body: { customerId: 'c-1', amount: 100, type: 'MANUAL_CREDIT' } })
    await loyaltyIssueHandler(req, res)
    expect(res.statusCode).toBe(403)
  })

  it('cms post update: foreign-business post → 404', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'u1', roles: ['MANAGER'], businessId: 'biz-1' } })
    mockPrisma.contentPost.findFirst.mockResolvedValue(null)
    const { req, res } = reqRes({ method: 'PUT', query: { id: 'post-1' }, body: { title: 'x' } })
    const cmsHandler = (await import('@/pages/api/cms/posts/[id]')).default
    await cmsHandler(req, res)
    expect(res.statusCode).toBe(404)
    expect(CmsService.updatePost).not.toHaveBeenCalled()
  })
})

// ─── P1-4: settlement intelligence reached on canonical completion ────────────
describe('PaymentCompletionService — settlement record creation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.sale.updateMany.mockResolvedValue({ count: 1 })
    mockPrisma.sale.findUnique.mockResolvedValue({
      id: 'sale-1', businessId: 'biz-1', customerId: 'c-1',
      totalAmountCents: 5000, paymentTransactionId: 'pt-1',
      business: { id: 'biz-1', currency: 'RWF' },
    })
    mockPrisma.paymentTransaction.updateMany.mockResolvedValue({ count: 1 })
    mockPrisma.paymentTransaction.findUnique.mockResolvedValue({
      id: 'pt-1', businessId: 'biz-1', gateway: 'CASH', amountCents: 5000, currency: 'RWF',
      vatAmountCents: 762, exVatAmountCents: 4238, platformFeeCents: 0,
      gatewayFeeActualCents: null, gatewayFeeEstimatedCents: 0, netToBusinessCents: 5000,
      paymentMethod: 'CASH', status: 'SUCCESS', invoiceNumber: 'INV-1',
      subscriptionId: null, marketplaceOrderId: null, referenceId: null,
    })
    mockPrisma.financialLedgerEntry = { create: jest.fn().mockResolvedValue({}) } as any
    mockPrisma.$transaction.mockImplementation((fn: any) => fn(mockPrisma))
  })

  it('canonical completion invokes SettlementIntelligenceService.onPaymentSuccess', async () => {
    await PaymentCompletionService.onPaymentSuccess('pt-1', 'sale-1')
    expect(SettlementIntelligenceService.onPaymentSuccess).toHaveBeenCalledWith(
      'pt-1',
      'biz-1',
      'CASH',
      5000,
      'RWF',
      expect.objectContaining({ source: 'payment-completion-service' })
    )
  })
})
