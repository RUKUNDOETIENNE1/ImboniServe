/**
 * REGRESSION: P0-1 — in-venue QR order mode contract
 *
 * Bug: /order/index.tsx sends mode:'invenue' (the canonical URL-layer value
 * used by qr-generator.service.ts, link.ts, token.ts, seats/outlets) but
 * draft.ts only accepted ['dine-in','preorder','pickup'] → ZodError → HTTP 500
 * on EVERY in-venue QR order.
 *
 * Proves: 'invenue' now reaches Sale creation with orderSource QR_IN_VENUE;
 * 'dine-in' remains a valid alias; remote modes still work; invalid modes
 * are still rejected before any order is created.
 */

const mockPrisma = {
  business: { findUnique: jest.fn() },
  customer: { findUnique: jest.fn() },
  paymentTransaction: { create: jest.fn(), update: jest.fn() },
  sale: { update: jest.fn(), count: jest.fn() },
  seatSession: { findUnique: jest.fn(), update: jest.fn() },
  postAttribution: { create: jest.fn() },
  $transaction: jest.fn(),
}

jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))
jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), child: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }) },
}))
jest.mock('@/lib/services/qr-token.service', () => ({
  validateAccessToken: jest.fn(),
  markTokenUsed: jest.fn(),
}))
jest.mock('@/lib/services/qr-order.service', () => ({
  calculateOrderPricing: jest.fn(),
  createDraftOrder: jest.fn(),
  checkSlotCapacity: jest.fn(),
}))
jest.mock('@/lib/services/irembopay.service', () => ({
  IremboPayService: { createInvoice: jest.fn() },
}))
jest.mock('@/lib/services/idempotency.service', () => ({
  IdempotencyService: { checkAndLock: jest.fn(), storeResponse: jest.fn() },
}))
jest.mock('@/lib/utils/phone', () => ({ normalizePhone: (p: string) => p }))

import handler from '@/pages/api/public/order/draft'
import { validateAccessToken } from '@/lib/services/qr-token.service'
import { calculateOrderPricing, createDraftOrder } from '@/lib/services/qr-order.service'
import { IdempotencyService } from '@/lib/services/idempotency.service'

const BUSINESS = {
  id: 'biz-1', name: 'Test Co', enableQRInVenue: true, enableQRRemote: true,
  requireDepositRemote: false, defaultDepositPercent: 0, maxRemoteOrdersPerSlot: 5,
  slotDurationMinutes: 15, taxMode: 'INCLUSIVE', taxRate: 18, currency: 'RWF',
}

const PRICING = {
  totalCents: 1000, subtotalCents: 847, vatCents: 153, depositCents: 0,
  remainingCents: 0, platformFeeCents: 0, taxMode: 'INCLUSIVE', taxRate: 18,
}

function reqRes(body: any) {
  const req: any = {
    method: 'POST', body, headers: {}, cookies: {},
    socket: { remoteAddress: '10.0.0.9' },
  }
  const res: any = {
    statusCode: 200, body: null,
    status(c: number) { res.statusCode = c; return res },
    json(d: any) { res.body = d; return res },
    setHeader() { return res },
  }
  return { req, res }
}

const CUID_ITEM = 'cltest00000000000000000a1'

function baseBody(mode?: string) {
  return {
    accessToken: 'valid-token-12345',
    items: [{ menuItemId: CUID_ITEM, quantity: 2 }],
    paymentMethod: 'CASH',
    ...(mode !== undefined ? { mode } : {}),
  }
}

describe('POST /api/public/order/draft — order-mode contract (P0-1)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.business.findUnique.mockResolvedValue(BUSINESS)
    mockPrisma.$transaction.mockImplementation((fn: any) => fn(mockPrisma))
    mockPrisma.paymentTransaction.create.mockResolvedValue({ id: 'pt-1' })
    mockPrisma.sale.update.mockResolvedValue({})
    mockPrisma.sale.count.mockResolvedValue(0)
    ;(validateAccessToken as jest.Mock).mockResolvedValue({ jti: 'jti-1', branchId: 'biz-1', tableId: 'tbl-1' })
    ;(calculateOrderPricing as jest.Mock).mockResolvedValue(PRICING)
    ;(createDraftOrder as jest.Mock).mockResolvedValue({ saleId: 'sale-1', orderNumber: 'ORD-1' })
    ;(IdempotencyService.checkAndLock as jest.Mock).mockResolvedValue({ isNew: true })
  })

  it("accepts mode:'invenue' and creates the Sale (previous 500 path)", async () => {
    const { req, res } = reqRes(baseBody('invenue'))
    await handler(req, res)
    expect(res.statusCode).toBe(201)
    expect(createDraftOrder).toHaveBeenCalledWith(
      expect.objectContaining({ orderSource: 'QR_IN_VENUE', tableId: 'tbl-1' }),
      PRICING,
      mockPrisma
    )
    expect(res.body.orderId).toBe('sale-1')
  })

  it("accepts legacy alias mode:'dine-in' as in-venue", async () => {
    const { req, res } = reqRes(baseBody('dine-in'))
    await handler(req, res)
    expect(res.statusCode).toBe(201)
    expect(createDraftOrder).toHaveBeenCalledWith(
      expect.objectContaining({ orderSource: 'QR_IN_VENUE' }),
      PRICING,
      mockPrisma
    )
  })

  it("mode:'preorder' still maps to QR_REMOTE (requires verified phone)", async () => {
    mockPrisma.customer.findUnique.mockResolvedValue({ phoneVerified: true })
    const { req, res } = reqRes({ ...baseBody('preorder'), phone: '+250788000001' })
    await handler(req, res)
    expect(res.statusCode).toBe(201)
    expect(createDraftOrder).toHaveBeenCalledWith(
      expect.objectContaining({ orderSource: 'QR_REMOTE' }),
      PRICING,
      mockPrisma
    )
  })

  it('rejects an unsupported mode before creating any order', async () => {
    const { req, res } = reqRes(baseBody('delivery-now'))
    await handler(req, res)
    expect(res.statusCode).toBeGreaterThanOrEqual(400)
    expect(createDraftOrder).not.toHaveBeenCalled()
    expect(mockPrisma.paymentTransaction.create).not.toHaveBeenCalled()
  })

  it('in-venue order is blocked when enableQRInVenue is false', async () => {
    mockPrisma.business.findUnique.mockResolvedValue({ ...BUSINESS, enableQRInVenue: false })
    const { req, res } = reqRes(baseBody('invenue'))
    await handler(req, res)
    expect(res.statusCode).toBe(403)
    expect(createDraftOrder).not.toHaveBeenCalled()
  })
})
