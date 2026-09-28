/**
 * PHASE 3R — CROSS-CHANNEL STABILITY REMEDIATION regression tests
 *
 * P1-4  /api/public/order/link — anonymous callers cannot mint arbitrary
 *       signed order links; only physical in-venue table links stay public.
 * P1-5  /api/payments/momo/initiate — authenticated/authorized only, real
 *       PaymentStatus guards, no double initiation, no paymentTransaction!
 *       crash.
 * P1-1  SalesService.createSale — server-authoritative pricing, business-
 *       scoped menu item resolution.
 * P1-2  /api/sales/[id] — method-level permissions; payment fields require
 *       payments.create; DELETE requires orders.refund.
 * P1-3  /api/orders/[id]/status — bounded transition model; COMPLETED can
 *       never be written directly.
 * P2-1  /api/kitchen/orders — abandoned QR drafts filtered out.
 * P2-2  Payment completion failures cannot return success (confirm-payment).
 * P2-3  /api/payments/momo/status — bound-token or staff-only polling.
 */

// ─── Shared prisma mock ───────────────────────────────────────────────────
const mockPrisma = {
  business: { findUnique: jest.fn() },
  table: { findFirst: jest.fn() },
  seat: { findFirst: jest.fn() },
  outlet: { findFirst: jest.fn() },
  sale: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  paymentTransaction: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  menuItem: { findMany: jest.fn() },
  orderToken: { findUnique: jest.fn() },
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

const mockResolveBusinessContext = jest.fn()
jest.mock('@/lib/api/business-context', () => ({ resolveBusinessContext: (...a: any[]) => mockResolveBusinessContext(...a) }))
jest.mock('@/lib/middleware/error-handler.middleware', () => ({ withErrorHandler: (h: any) => h }))
jest.mock('@/lib/middleware/withFeatureCheck', () => ({
  requiresFeature: () => (h: any) => h,
  requiresActiveSubscription: (h: any) => h,
}))
jest.mock('@/lib/middleware/withRateLimit', () => ({ withRateLimit: (h: any) => h }))
jest.mock('@/lib/middleware/rateLimit', () => ({ rateLimit: () => (_req: any, _res: any, next: any) => next() }))

const mockVerifyOrderSessionToken = jest.fn()
jest.mock('@/lib/services/qr-token.service', () => ({
  verifyOrderSessionToken: (...a: any[]) => mockVerifyOrderSessionToken(...a),
  validateAccessToken: jest.fn(),
  markTokenUsed: jest.fn(),
}))

jest.mock('@/lib/services/qr-generator.service', () => ({
  QRGeneratorService: { generateURL: jest.fn(() => 'https://app.test/order?signed=1') },
}))

jest.mock('@/lib/services/momo.service', () => ({
  MoMoService: {
    initiateMTNPayment: jest.fn(),
    initiateAirtelPayment: jest.fn(),
    checkMTNStatus: jest.fn(),
    checkAirtelStatus: jest.fn(),
  },
}))

const mockOnPaymentSuccess = jest.fn()
const mockOnPaymentFailure = jest.fn()
jest.mock('@/lib/services/payment-completion.service', () => ({
  PaymentCompletionService: {
    onPaymentSuccess: (...a: any[]) => mockOnPaymentSuccess(...a),
    onPaymentFailure: (...a: any[]) => mockOnPaymentFailure(...a),
  },
}))

jest.mock('@/lib/services/audit-log.service', () => ({
  AuditLogService: { log: jest.fn().mockResolvedValue({}) },
}))
jest.mock('@/lib/services/payment-ledger-events.service', () => ({ ensurePaymentLedgerEvent: jest.fn() }))
jest.mock('@/lib/services/whatsapp-order.service', () => ({
  WhatsAppOrderService: { notifyOrderReady: jest.fn().mockResolvedValue({}) },
}))
jest.mock('@/lib/die/business-as-plugin/delivery/delivery.shadow', () => ({
  ingestDeliveryShadowEvent: jest.fn().mockResolvedValue({}),
}))
jest.mock('@/lib/services/security-event.service', () => ({
  SecurityEventService: { log: jest.fn().mockResolvedValue({}) },
}))
jest.mock('@/lib/pricing/fee-calculator', () => ({
  calculateConvenienceFee: jest.fn(() => ({ feeApplied: false, convenienceFee: 0 })),
}))
jest.mock('@/lib/services/guest-recognition.service', () => ({
  GuestRecognitionService: { registerOrRecognize: jest.fn().mockResolvedValue({ customerId: 'cust-1' }) },
}))
jest.mock('@/lib/services/financial-truth.service', () => ({
  FinancialTruthService: {}, CostSource: {},
}))
jest.mock('@/lib/utils/timezone', () => ({
  getBusinessDayBoundary: jest.fn(() => ({ start: new Date(0), end: new Date() })),
}))

const mockEffectivePerms = jest.fn()
jest.mock('@/lib/permissions/staff', () => ({
  getUserEffectivePermissions: (...a: any[]) => mockEffectivePerms(...a),
  hasPermission: (perms: any, path: string) => {
    if (!perms) return false
    const parts = path.split('.')
    let cur = perms
    for (const p of parts) {
      if (cur == null) return false
      cur = cur[p]
    }
    return cur === true
  },
}))

// ─── Imports under test ───────────────────────────────────────────────────
import linkHandler from '@/pages/api/public/order/link'
import momoInitiateHandler from '@/pages/api/payments/momo/initiate'
import momoStatusHandler from '@/pages/api/payments/momo/status/[transactionId]'
import salesIdHandler from '@/pages/api/sales/[id]'
import orderStatusHandler from '@/pages/api/orders/[id]/status'
import kitchenOrdersHandler from '@/pages/api/kitchen/orders'
import confirmPaymentHandler from '@/pages/api/orders/[id]/confirm-payment'
import { SalesService } from '@/lib/services/sales.service'
import { MoMoService } from '@/lib/services/momo.service'

function reqRes(opts: { method?: string; body?: any; query?: any; headers?: any } = {}) {
  const req: any = {
    method: opts.method || 'GET',
    body: opts.body || {},
    query: opts.query || {},
    headers: opts.headers || {},
    cookies: {},
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

const BIZ = 'biz-1'
const waiterSession = { user: { id: 'u-waiter', businessId: BIZ, roles: ['WAITER'], name: 'W' } }
const managerSession = { user: { id: 'u-mgr', businessId: BIZ, roles: ['MANAGER'], name: 'M' } }
const cashierSession = { user: { id: 'u-cashier', businessId: BIZ, roles: ['CASHIER'], name: 'C' } }

const waiterPerms = { orders: { read: true, create: true, update: true, refund: false }, payments: { read: false, create: false, refund: false } }
const managerPerms = { orders: { read: true, create: true, update: true, refund: false }, payments: { read: true, create: true, refund: false } }
const cashierPerms = { orders: { read: true, create: false, update: false, refund: false }, payments: { read: true, create: true, refund: false } }

const bizRecord = { id: BIZ, enableQRInVenue: true, enableQRRemote: true }

beforeEach(() => {
  jest.clearAllMocks()
})

// ═══════════════════════════════ P1-4 ═══════════════════════════════════
describe('P1-4 /api/public/order/link authorization', () => {
  it('anonymous remote/preorder link mint → 403', async () => {
    mockGetServerSession.mockResolvedValue(null)
    mockPrisma.business.findUnique.mockResolvedValue(bizRecord)
    const { req, res } = reqRes({ query: { branchId: BIZ, mode: 'preorder' } })
    await linkHandler(req, res)
    expect(res.statusCode).toBe(403)
  })

  it('anonymous business-level link (no table) → 403', async () => {
    mockGetServerSession.mockResolvedValue(null)
    mockPrisma.business.findUnique.mockResolvedValue(bizRecord)
    const { req, res } = reqRes({ query: { branchId: BIZ, mode: 'invenue' } })
    await linkHandler(req, res)
    expect(res.statusCode).toBe(403)
  })

  it('anonymous in-venue link with valid business-owned table → 200 (physical QR flow preserved)', async () => {
    mockGetServerSession.mockResolvedValue(null)
    mockPrisma.business.findUnique.mockResolvedValue(bizRecord)
    mockPrisma.table.findFirst.mockResolvedValue({ id: 'tbl-1', businessId: BIZ })
    const { req, res } = reqRes({ query: { branchId: BIZ, tableId: 'tbl-1', mode: 'invenue' } })
    await linkHandler(req, res)
    expect(res.statusCode).toBe(200)
    expect(res.body.url).toContain('/order')
  })

  it('anonymous table from another tenant → 404 (tenant boundary enforced)', async () => {
    mockGetServerSession.mockResolvedValue(null)
    mockPrisma.business.findUnique.mockResolvedValue(bizRecord)
    mockPrisma.table.findFirst.mockResolvedValue(null) // no table under biz-1
    const { req, res } = reqRes({ query: { branchId: BIZ, tableId: 'tbl-foreign' } })
    await linkHandler(req, res)
    expect(res.statusCode).toBe(404)
  })

  it('staff of the same business can still mint remote/builder links → 200', async () => {
    mockGetServerSession.mockResolvedValue(managerSession)
    mockPrisma.business.findUnique.mockResolvedValue(bizRecord)
    const { req, res } = reqRes({ query: { branchId: BIZ, mode: 'preorder' } })
    await linkHandler(req, res)
    expect(res.statusCode).toBe(200)
  })

  it('staff of a DIFFERENT business is treated as anonymous → 403', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'u-x', businessId: 'biz-2', roles: ['MANAGER'] } })
    const { req, res } = reqRes({ query: { branchId: BIZ, mode: 'invenue' } })
    await linkHandler(req, res)
    expect(res.statusCode).toBe(403)
  })
})

// ═══════════════════════════════ P1-5 ═══════════════════════════════════
const ORDER_CUID = 'corder1234567890123456789'

const momoOrder = (over: any = {}) => ({
  id: ORDER_CUID,
  businessId: BIZ,
  orderNumber: 'ORD-1',
  paymentMethod: 'MTN_MOBILE_MONEY',
  paymentStatus: 'PENDING',
  totalAmountCents: 5000,
  customerName: null,
  business: { id: BIZ, name: 'B', currency: 'RWF' },
  paymentTransaction: { id: 'pt-1', status: 'PENDING', amountCents: 5000, transactionId: null },
  ...over,
})

// sale.findUnique is called once by the handler (full include) and once by
// requireOrderAccess (select on token-binding fields). Route by args.
function mockSaleLookup(order: any, boundJti: string | null) {
  mockPrisma.sale.findUnique.mockImplementation((args: any) => {
    if (args?.select) {
      return Promise.resolve({
        id: order.id, businessId: order.businessId,
        orderTokenJti: boundJti, isAddon: false, parentOrderId: null,
      })
    }
    return Promise.resolve(order)
  })
}

describe('P1-5 /api/payments/momo/initiate', () => {
  const body = { orderId: ORDER_CUID, provider: 'MTN', phoneNumber: '250788123456' }

  it('unauthenticated (no session, no token) → 401', async () => {
    mockGetServerSession.mockResolvedValue(null)
    mockSaleLookup(momoOrder(), 'jti-order')
    const { req, res } = reqRes({ method: 'POST', body })
    await momoInitiateHandler(req, res)
    expect(res.statusCode).toBe(401)
  })

  it('token not bound to this order → 403 (tenant/order boundary)', async () => {
    mockGetServerSession.mockResolvedValue(null)
    mockVerifyOrderSessionToken.mockResolvedValue({ jti: 'jti-other', branchId: BIZ, source: 'QR_IN_VENUE' })
    mockSaleLookup(momoOrder(), 'jti-order')
    const { req, res } = reqRes({ method: 'POST', body, headers: { authorization: 'Bearer tok' } })
    await momoInitiateHandler(req, res)
    expect(res.statusCode).toBe(403)
    expect(MoMoService.initiateMTNPayment).not.toHaveBeenCalled()
  })

  it('authorized staff → successful initiation → 200', async () => {
    mockGetServerSession.mockResolvedValue(managerSession)
    mockSaleLookup(momoOrder(), 'jti-order')
    ;(MoMoService.initiateMTNPayment as jest.Mock).mockResolvedValue({
      success: true, transactionId: 'tx-1', reference: 'ref-1', statusCheckUrl: '/status',
    })
    const { req, res } = reqRes({ method: 'POST', body })
    await momoInitiateHandler(req, res)
    expect(res.statusCode).toBe(200)
    expect(MoMoService.initiateMTNPayment).toHaveBeenCalledWith(
      expect.objectContaining({ amountCents: 5000 })
    )
  })

  it('order-bound customer token → initiation allowed', async () => {
    mockGetServerSession.mockResolvedValue(null)
    mockVerifyOrderSessionToken.mockResolvedValue({ jti: 'jti-order', branchId: BIZ, source: 'QR_IN_VENUE' })
    mockSaleLookup(momoOrder(), 'jti-order')
    ;(MoMoService.initiateMTNPayment as jest.Mock).mockResolvedValue({
      success: true, transactionId: 'tx-2', reference: 'ref-2', statusCheckUrl: '/status',
    })
    const { req, res } = reqRes({ method: 'POST', body, headers: { authorization: 'Bearer tok' } })
    await momoInitiateHandler(req, res)
    expect(res.statusCode).toBe(200)
  })

  it('already-paid order (COMPLETED) → 409', async () => {
    mockGetServerSession.mockResolvedValue(managerSession)
    mockPrisma.sale.findUnique.mockResolvedValue(momoOrder({ paymentStatus: 'COMPLETED' }))
    const { req, res } = reqRes({ method: 'POST', body })
    await momoInitiateHandler(req, res)
    expect(res.statusCode).toBe(409)
    expect(MoMoService.initiateMTNPayment).not.toHaveBeenCalled()
  })

  it('already-paid order (PAID) → 409', async () => {
    mockGetServerSession.mockResolvedValue(managerSession)
    mockPrisma.sale.findUnique.mockResolvedValue(momoOrder({ paymentStatus: 'PAID' }))
    const { req, res } = reqRes({ method: 'POST', body })
    await momoInitiateHandler(req, res)
    expect(res.statusCode).toBe(409)
  })

  it('active PROCESSING transaction → 409 (no double initiation)', async () => {
    mockGetServerSession.mockResolvedValue(managerSession)
    mockPrisma.sale.findUnique.mockResolvedValue(
      momoOrder({ paymentTransaction: { id: 'pt-1', status: 'PROCESSING', amountCents: 5000 } })
    )
    const { req, res } = reqRes({ method: 'POST', body })
    await momoInitiateHandler(req, res)
    expect(res.statusCode).toBe(409)
    expect(MoMoService.initiateMTNPayment).not.toHaveBeenCalled()
  })

  it('missing PaymentTransaction → safe 409 (no crash)', async () => {
    mockGetServerSession.mockResolvedValue(managerSession)
    mockPrisma.sale.findUnique.mockResolvedValue(momoOrder({ paymentTransaction: null }))
    const { req, res } = reqRes({ method: 'POST', body })
    await momoInitiateHandler(req, res)
    expect(res.statusCode).toBe(409)
    expect(res.body.error).toMatch(/payment transaction/i)
  })

  it('nonexistent order → 404', async () => {
    mockGetServerSession.mockResolvedValue(managerSession)
    mockPrisma.sale.findUnique.mockResolvedValue(null)
    const { req, res } = reqRes({ method: 'POST', body })
    await momoInitiateHandler(req, res)
    expect(res.statusCode).toBe(404)
  })
})

// ═══════════════════════════════ P1-1 ═══════════════════════════════════
describe('P1-1 SalesService.createSale server-authoritative pricing', () => {
  const baseInput: any = {
    businessId: BIZ,
    items: [{ menuItemId: 'mi-1', quantity: 2, unitPriceCents: 1 }], // manipulated price
    paymentMethod: 'OTHER',
  }

  it('uses DB priceCents, not client unitPriceCents', async () => {
    mockPrisma.menuItem.findMany.mockResolvedValue([{ id: 'mi-1', priceCents: 3000 }])
    mockPrisma.sale.create.mockResolvedValue({ id: 'sale-1' })
    await SalesService.createSale('u-1', baseInput)
    const createArg = mockPrisma.sale.create.mock.calls[0][0]
    expect(createArg.data.totalAmountCents).toBe(6000) // 3000*2, not 1*2
    expect(createArg.data.items.create[0].unitPriceCents).toBe(3000)
    expect(createArg.data.items.create[0].totalPriceCents).toBe(6000)
  })

  it('cross-tenant / unknown menu item → rejected', async () => {
    mockPrisma.menuItem.findMany.mockResolvedValue([]) // no item under this business
    await expect(SalesService.createSale('u-1', baseInput)).rejects.toThrow(/menu items/i)
    expect(mockPrisma.sale.create).not.toHaveBeenCalled()
  })

  it('multiple line items each get their own server price', async () => {
    mockPrisma.menuItem.findMany.mockResolvedValue([
      { id: 'mi-1', priceCents: 3000 },
      { id: 'mi-2', priceCents: 1500 },
    ])
    mockPrisma.sale.create.mockResolvedValue({ id: 'sale-1' })
    await SalesService.createSale('u-1', {
      ...baseInput,
      items: [
        { menuItemId: 'mi-1', quantity: 1, unitPriceCents: 1 },
        { menuItemId: 'mi-2', quantity: 2, unitPriceCents: 999999 },
      ],
    })
    const createArg = mockPrisma.sale.create.mock.calls[0][0]
    expect(createArg.data.totalAmountCents).toBe(6000) // 3000 + 2*1500
  })
})

// ═══════════════════════════════ P1-2 ═══════════════════════════════════
describe('P1-2 /api/sales/[id] method-level permissions', () => {
  beforeEach(() => {
    mockResolveBusinessContext.mockImplementation(async (req: any, res: any) => {
      const s = await mockGetServerSession(req, res)
      if (!s?.user) { res.status(401).json({ error: 'Unauthorized' }); return null }
      return { userId: s.user.id, businessId: s.user.businessId, roles: s.user.roles, email: 'x@x' }
    })
  })

  it('waiter cannot mark a sale paid (orders.update but no payments.create) → 403', async () => {
    mockGetServerSession.mockResolvedValue(waiterSession)
    mockEffectivePerms.mockResolvedValue(waiterPerms)
    mockPrisma.sale.findUnique.mockResolvedValue({ businessId: BIZ })
    const { req, res } = reqRes({
      method: 'PUT', query: { id: 'sale-1' },
      body: { paymentStatus: 'COMPLETED', isPaid: true },
    })
    await salesIdHandler(req, res)
    expect(res.statusCode).toBe(403)
    expect(mockPrisma.sale.update).not.toHaveBeenCalled()
  })

  it('waiter CAN update non-payment fields (orders.update) → updateSale invoked', async () => {
    mockGetServerSession.mockResolvedValue(waiterSession)
    mockEffectivePerms.mockResolvedValue(waiterPerms)
    mockPrisma.sale.findUnique.mockResolvedValue({ businessId: BIZ })
    mockPrisma.sale.update.mockResolvedValue({ id: 'sale-1' })
    const { req, res } = reqRes({
      method: 'PUT', query: { id: 'sale-1' }, body: { notes: 'table moved' },
    })
    await salesIdHandler(req, res)
    expect(res.statusCode).toBe(200)
  })

  it('manager (payments.create) can mark paid → 200 via canonical completion', async () => {
    mockGetServerSession.mockResolvedValue(managerSession)
    mockEffectivePerms.mockResolvedValue(managerPerms)
    mockPrisma.sale.findUnique.mockResolvedValue({ businessId: BIZ })
    mockPrisma.sale.update.mockResolvedValue({ id: 'sale-1', paymentTransactionId: 'pt-1' })
    mockOnPaymentSuccess.mockResolvedValue({})
    const { req, res } = reqRes({
      method: 'PUT', query: { id: 'sale-1' },
      body: { paymentStatus: 'COMPLETED', isPaid: true },
    })
    await salesIdHandler(req, res)
    expect(res.statusCode).toBe(200)
    expect(mockOnPaymentSuccess).toHaveBeenCalled()
  })

  it('manager cannot DELETE (no orders.refund) → 403', async () => {
    mockGetServerSession.mockResolvedValue(managerSession)
    mockEffectivePerms.mockResolvedValue(managerPerms)
    const { req, res } = reqRes({ method: 'DELETE', query: { id: 'sale-1' } })
    await salesIdHandler(req, res)
    expect(res.statusCode).toBe(403)
  })

  it('cashier (orders.read, no update) GET works but PUT rejected', async () => {
    mockGetServerSession.mockResolvedValue(cashierSession)
    mockEffectivePerms.mockResolvedValue(cashierPerms)
    // GET → orders.read allowed (getSaleById uses findFirst)
    mockPrisma.sale.findFirst.mockResolvedValue({ id: 'sale-1', businessId: BIZ })
    const g = reqRes({ method: 'GET', query: { id: 'sale-1' } })
    await salesIdHandler(g.req, g.res)
    expect(g.res.statusCode).toBe(200)
    // PUT → orders.update required
    const p = reqRes({ method: 'PUT', query: { id: 'sale-1' }, body: { notes: 'x' } })
    await salesIdHandler(p.req, p.res)
    expect(p.res.statusCode).toBe(403)
  })
})

// ═══════════════════════════════ P1-3 ═══════════════════════════════════
describe('P1-3 /api/orders/[id]/status state machine', () => {
  it('COMPLETED write → 400 (financial completion cannot be forced)', async () => {
    mockGetServerSession.mockResolvedValue(waiterSession)
    mockEffectivePerms.mockResolvedValue(waiterPerms)
    mockPrisma.sale.findFirst.mockResolvedValue({ id: 'o-1', status: 'ACTIVE', businessId: BIZ })
    const { req, res } = reqRes({ method: 'PUT', query: { id: 'o-1' }, body: { status: 'COMPLETED' } })
    await orderStatusHandler(req, res)
    expect(res.statusCode).toBe(400)
    expect(mockPrisma.sale.update).not.toHaveBeenCalled()
  })

  it('arbitrary status string → 400', async () => {
    mockGetServerSession.mockResolvedValue(waiterSession)
    mockEffectivePerms.mockResolvedValue(waiterPerms)
    mockPrisma.sale.findFirst.mockResolvedValue({ id: 'o-1', status: 'ACTIVE', businessId: BIZ })
    const { req, res } = reqRes({ method: 'PUT', query: { id: 'o-1' }, body: { status: 'NOT_A_STATUS' } })
    await orderStatusHandler(req, res)
    expect(res.statusCode).toBe(400)
  })

  it('illegal transition PREPARING → DELIVERED → 409', async () => {
    mockGetServerSession.mockResolvedValue(waiterSession)
    mockEffectivePerms.mockResolvedValue(waiterPerms)
    mockPrisma.sale.findFirst.mockResolvedValue({ id: 'o-1', status: 'PREPARING', businessId: BIZ })
    const { req, res } = reqRes({ method: 'PUT', query: { id: 'o-1' }, body: { status: 'DELIVERED' } })
    await orderStatusHandler(req, res)
    expect(res.statusCode).toBe(409)
  })

  it('legitimate ACTIVE → PREPARING → 200', async () => {
    mockGetServerSession.mockResolvedValue(waiterSession)
    mockEffectivePerms.mockResolvedValue(waiterPerms)
    mockPrisma.sale.findFirst.mockResolvedValue({ id: 'o-1', status: 'ACTIVE', businessId: BIZ, orderSource: 'QR_IN_VENUE' })
    mockPrisma.sale.update.mockResolvedValue({ id: 'o-1', status: 'PREPARING' })
    const { req, res } = reqRes({ method: 'PUT', query: { id: 'o-1' }, body: { status: 'PREPARING' } })
    await orderStatusHandler(req, res)
    expect(res.statusCode).toBe(200)
    expect(mockPrisma.sale.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'PREPARING' } })
    )
  })

  it('cashier without orders.update → 403', async () => {
    mockGetServerSession.mockResolvedValue(cashierSession)
    mockEffectivePerms.mockResolvedValue(cashierPerms)
    const { req, res } = reqRes({ method: 'PUT', query: { id: 'o-1' }, body: { status: 'PREPARING' } })
    await orderStatusHandler(req, res)
    expect(res.statusCode).toBe(403)
    expect(mockPrisma.sale.findFirst).not.toHaveBeenCalled()
  })

  it('COMPLETED order is terminal — no further transitions', async () => {
    mockGetServerSession.mockResolvedValue(waiterSession)
    mockEffectivePerms.mockResolvedValue(waiterPerms)
    mockPrisma.sale.findFirst.mockResolvedValue({ id: 'o-1', status: 'COMPLETED', businessId: BIZ })
    const { req, res } = reqRes({ method: 'PUT', query: { id: 'o-1' }, body: { status: 'CANCELLED' } })
    await orderStatusHandler(req, res)
    expect(res.statusCode).toBe(409)
  })
})

// ═══════════════════════════════ P2-1 ═══════════════════════════════════
describe('P2-1 /api/kitchen/orders abandoned-draft filtering', () => {
  it('query excludes unconfirmed QR drafts but keeps dispatched/confirmed orders', async () => {
    mockGetServerSession.mockResolvedValue(managerSession)
    mockEffectivePerms.mockResolvedValue(managerPerms)
    mockResolveBusinessContext.mockResolvedValue({ userId: 'u', businessId: BIZ, roles: ['MANAGER'], email: 'x' })
    mockPrisma.business.findUnique.mockResolvedValue({ timezone: 'Africa/Kigali' })
    mockPrisma.sale.findMany.mockResolvedValue([])
    const { req, res } = reqRes({ method: 'GET', query: {} })
    await kitchenOrdersHandler(req, res)
    expect(res.statusCode).toBe(200)
    const where = mockPrisma.sale.findMany.mock.calls[0][0].where
    expect(where.NOT).toEqual({
      orderSource: { in: ['QR_IN_VENUE', 'QR_REMOTE'] },
      customerConfirmedAt: null,
      kitchenDispatchStatus: 'pending',
    })
  })
})

// ═══════════════════════════════ P2-2 ═══════════════════════════════════
describe('P2-2 payment completion failure cannot look successful', () => {
  it('confirm-payment: PCS failure → non-2xx, no success:true', async () => {
    mockGetServerSession.mockResolvedValue(managerSession)
    mockEffectivePerms.mockResolvedValue(managerPerms)
    mockResolveBusinessContext.mockResolvedValue({ userId: 'u', businessId: BIZ, roles: ['MANAGER'], email: 'x' })
    mockPrisma.sale.findUnique.mockResolvedValue({
      id: 'o-1', businessId: BIZ, paymentStatus: 'PENDING',
      orderNumber: 'ORD-1', totalAmountCents: 1000,
      business: {}, items: [], kitchenReleasedAt: null, paymentTransactionId: null,
    })
    mockPrisma.sale.update.mockResolvedValue({})
    mockOnPaymentSuccess.mockRejectedValue(new Error('ledger write failed'))
    const { req, res } = reqRes({ method: 'POST', query: { id: 'o-1' }, body: { paymentMethod: 'CASH' } })
    await confirmPaymentHandler(req, res)
    expect(res.statusCode).not.toBe(200)
    expect(res.body.success).not.toBe(true)
  })

  it('confirm-payment: PCS success → 200 success:true (unchanged happy path)', async () => {
    mockGetServerSession.mockResolvedValue(managerSession)
    mockEffectivePerms.mockResolvedValue(managerPerms)
    mockResolveBusinessContext.mockResolvedValue({ userId: 'u', businessId: BIZ, roles: ['MANAGER'], email: 'x' })
    mockPrisma.sale.findUnique
      .mockResolvedValueOnce({
        id: 'o-1', businessId: BIZ, paymentStatus: 'PENDING',
        orderNumber: 'ORD-1', totalAmountCents: 1000,
        business: {}, items: [], kitchenReleasedAt: null, paymentTransactionId: null,
      })
      .mockResolvedValueOnce({ id: 'o-1', paymentStatus: 'COMPLETED', isPaid: true })
    mockPrisma.sale.update.mockResolvedValue({})
    mockOnPaymentSuccess.mockResolvedValue({})
    const { req, res } = reqRes({ method: 'POST', query: { id: 'o-1' }, body: { paymentMethod: 'CASH' } })
    await confirmPaymentHandler(req, res)
    expect(res.statusCode).toBe(200)
    expect(res.body.success).toBe(true)
  })
})

// ═══════════════════════════════ P2-3 ═══════════════════════════════════
describe('P2-3 /api/payments/momo/status authorization', () => {
  const tx = {
    id: 'pt-1', businessId: BIZ, paymentMethod: 'MTN_MOBILE_MONEY',
    status: 'PROCESSING', sale: { id: 'o-1', paymentStatus: 'PENDING', business: {} },
  }

  it('anonymous request → 401/403 (no info leak)', async () => {
    mockGetServerSession.mockResolvedValue(null)
    mockPrisma.paymentTransaction.findFirst.mockResolvedValue(tx)
    const { req, res } = reqRes({ method: 'GET', query: { transactionId: 'tx-1' } })
    await momoStatusHandler(req, res)
    expect([401, 403]).toContain(res.statusCode)
    expect(MoMoService.checkMTNStatus).not.toHaveBeenCalled()
  })

  it('staff of a DIFFERENT business → rejected (cross-tenant blocked)', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'u2', businessId: 'biz-2', roles: ['MANAGER'] } })
    mockPrisma.paymentTransaction.findFirst.mockResolvedValue(tx)
    const { req, res } = reqRes({ method: 'GET', query: { transactionId: 'tx-1' } })
    await momoStatusHandler(req, res)
    // Tokenless cross-tenant staff cannot present an order-bound token →
    // rejected before any provider call (401 token-required or 403 forbidden).
    expect([401, 403]).toContain(res.statusCode)
    expect(MoMoService.checkMTNStatus).not.toHaveBeenCalled()
  })

  it('staff of same business → authorized polling works', async () => {
    mockGetServerSession.mockResolvedValue(managerSession)
    mockPrisma.paymentTransaction.findFirst.mockResolvedValue(tx)
    mockPrisma.paymentTransaction.update.mockResolvedValue({})
    ;(MoMoService.checkMTNStatus as jest.Mock).mockResolvedValue({ status: 'PENDING', amount: 100, currency: 'RWF' })
    const { req, res } = reqRes({ method: 'GET', query: { transactionId: 'tx-1' } })
    await momoStatusHandler(req, res)
    expect(res.statusCode).toBe(200)
    expect(res.body.status).toBe('PENDING')
  })

  it('order-bound customer token → authorized polling works', async () => {
    mockGetServerSession.mockResolvedValue(null)
    mockVerifyOrderSessionToken.mockResolvedValue({ jti: 'jti-1', branchId: BIZ, source: 'QR_IN_VENUE' })
    mockPrisma.paymentTransaction.findFirst.mockResolvedValue(tx)
    mockPrisma.sale.findUnique.mockResolvedValue({ id: 'o-1', businessId: BIZ, orderTokenJti: 'jti-1', isAddon: false, parentOrderId: null })
    mockPrisma.paymentTransaction.update.mockResolvedValue({})
    ;(MoMoService.checkMTNStatus as jest.Mock).mockResolvedValue({ status: 'PENDING', amount: 100, currency: 'RWF' })
    const { req, res } = reqRes({ method: 'GET', query: { transactionId: 'tx-1' }, headers: { authorization: 'Bearer tok' } })
    await momoStatusHandler(req, res)
    expect(res.statusCode).toBe(200)
  })
})
