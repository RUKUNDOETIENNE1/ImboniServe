import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// --- Valid CUID-format IDs for Zod schema compliance ---
const BIZ1 = 'clhm1q4lk0000ujrogkq6zfkj'
const BIZ2 = 'clhm1q4lk0001ujrogkq6zfkj'
const MENU_ITEM = 'clhm1q4lk0002ujrogkq6zfkj'
const ORDER1 = 'clhm1q4lk0003ujrogkq6zfkj'
const ORDER2 = 'clhm1q4lk0004ujrogkq6zfkj'

// Mocks — set up before any imports that use them
jest.mock('next-auth/next', () => ({ getServerSession: jest.fn() }))
jest.mock('@/pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))

// Prisma mock
const prismaMock: any = {
  sale: { findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), count: jest.fn() },
  business: { findUnique: jest.fn() },
  userStaffRole: { findMany: jest.fn() },
  securityEvent: { create: jest.fn() },
}
jest.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

// Pusher mock
jest.mock('@/lib/pusher-server', () => ({ triggerEvent: jest.fn().mockResolvedValue(undefined) }))

// withRateLimit: passthrough so rate-limit Redis is never touched in tests
jest.mock('@/lib/middleware/withRateLimit', () => ({
  withRateLimit: (handler: any) => handler,
}))

// SalesService mock for POST-path tests
const mockCreateSale = jest.fn()
jest.mock('@/lib/services/sales.service', () => ({
  SalesService: {
    createSale: (...args: any[]) => mockCreateSale(...args),
    getSales: jest.fn(),
  },
}))

// Handlers — imported AFTER all mocks
import kitchenOrdersHandler from '@/pages/api/kitchen/orders'
import kitchenUpdateHandler from '@/pages/api/kitchen/update-status'
import salesHandler from '@/pages/api/sales/index'
import { getServerSession } from 'next-auth/next'
import { SalesService } from '@/lib/services/sales.service'

// Helpers
function mockSession({ roles, businessId, userId = 'u1' }: { roles: string[]; businessId?: string; userId?: string }) {
  ;(getServerSession as jest.Mock).mockResolvedValue({
    user: { id: userId, email: 'u@example.com', roles, businessId: businessId ?? null },
  })
}

function createReqRes({ method, query = {}, body }: { method: string; query?: any; body?: any }) {
  const req: any = { method, query, body, headers: {}, socket: { remoteAddress: '127.0.0.1' }, url: '/api/test' }
  let _statusCode = 200
  let _body: any
  const res: any = {
    status(code: number) { _statusCode = code; return res },
    json(obj: any) { _body = obj; return res },
    end() { return res },
    get statusCode() { return _statusCode },
    get body() { return _body },
    setHeader: jest.fn(),
  }
  return { req, res }
}

describe('Kitchen & Sales API (RBAC smoke)', () => {
  beforeEach(() => {
    // resetAllMocks clears queued mockResolvedValueOnce values between tests
    jest.resetAllMocks()
    // Re-establish persistent mocks after reset
    prismaMock.userStaffRole.findMany.mockResolvedValue([])
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    ;(SalesService.getSales as jest.Mock).mockResolvedValue({ sales: [], total: 0 })
  })

  // ─── Kitchen ──────────────────────────────────────────────────────────────

  it('Kitchen GET /kitchen/orders: MANAGER allowed (200)', async () => {
    mockSession({ roles: ['MANAGER'], businessId: BIZ1 })
    prismaMock.sale.findMany.mockResolvedValueOnce([
      { id: ORDER1, kitchenStatus: 'pending' },
      { id: ORDER2, kitchenStatus: 'ready' },
    ])

    const { req, res } = createReqRes({ method: 'GET' })
    await kitchenOrdersHandler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('orders')
    expect(Array.isArray(res.body.orders)).toBe(true)
  })

  it('Kitchen GET /kitchen/orders: no-role user denied (401/403)', async () => {
    mockSession({ roles: [], businessId: BIZ1 })

    const { req, res } = createReqRes({ method: 'GET' })
    await kitchenOrdersHandler(req, res)

    expect([401, 403]).toContain(res.statusCode)
  })

  it('Kitchen POST /kitchen/update-status: MANAGER can move pending→accepted (200)', async () => {
    mockSession({ roles: ['MANAGER'], businessId: BIZ1 })
    prismaMock.sale.findUnique.mockResolvedValueOnce({ id: ORDER1, kitchenStatus: 'pending', businessId: BIZ1 })
    prismaMock.sale.update.mockResolvedValueOnce({ id: ORDER1, businessId: BIZ1, orderNumber: 'ORD-1' })

    const { req, res } = createReqRes({ method: 'POST', body: { orderId: ORDER1, newStatus: 'accepted' } })
    await kitchenUpdateHandler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('success', true)
  })

  it('Kitchen POST /kitchen/update-status: invalid status returns 400', async () => {
    mockSession({ roles: ['MANAGER'], businessId: BIZ1 })
    // findUnique NOT called because status validation happens first
    const { req, res } = createReqRes({ method: 'POST', body: { orderId: ORDER1, newStatus: 'BLASTOFF' } })
    await kitchenUpdateHandler(req, res)

    expect(res.statusCode).toBe(400)
  })

  it('Kitchen POST /kitchen/update-status: cross-business blocked for non-ADMIN (403)', async () => {
    mockSession({ roles: ['MANAGER'], businessId: BIZ1 })
    // Order belongs to BIZ2, user context is BIZ1
    prismaMock.sale.findUnique.mockResolvedValueOnce({ id: ORDER2, kitchenStatus: 'pending', businessId: BIZ2 })

    const { req, res } = createReqRes({ method: 'POST', body: { orderId: ORDER2, newStatus: 'accepted' } })
    await kitchenUpdateHandler(req, res)

    expect(res.statusCode).toBe(403)
  })

  // ─── Sales ────────────────────────────────────────────────────────────────

  it('Sales GET /sales: MANAGER allowed, returns paginated data (200)', async () => {
    mockSession({ roles: ['MANAGER'], businessId: BIZ1 })
    ;(SalesService.getSales as jest.Mock).mockResolvedValueOnce({ sales: [{ id: ORDER1 }], total: 1 })

    const { req, res } = createReqRes({ method: 'GET', query: { page: '1', limit: '10' } })
    await salesHandler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('data')
    expect(res.body).toHaveProperty('pagination')
  })

  it('Sales GET /sales: no-role user denied (401/403)', async () => {
    mockSession({ roles: [], businessId: BIZ1 })

    const { req, res } = createReqRes({ method: 'GET', query: {} })
    await salesHandler(req, res)

    expect([401, 403]).toContain(res.statusCode)
  })

  it('Sales POST /sales: MANAGER can create sale (201)', async () => {
    mockSession({ roles: ['MANAGER'], businessId: BIZ1, userId: 'u1' })
    const fakeSale = { id: ORDER1, items: [{ quantity: 1, unitPriceCents: 50000, menuItem: { name: 'Burger' } }] }
    mockCreateSale.mockResolvedValueOnce(fakeSale)
    prismaMock.business.findUnique.mockResolvedValueOnce({ currency: 'RWF' })

    const validBody = {
      businessId: BIZ1,
      paymentMethod: 'CASH',
      items: [{ menuItemId: MENU_ITEM, quantity: 1, unitPriceCents: 50000 }],
    }
    const { req, res } = createReqRes({ method: 'POST', body: validBody })
    await salesHandler(req, res)

    expect(res.statusCode).toBe(201)
    expect(res.body).toHaveProperty('sale')
  })

  it('Sales POST /sales: no-role user denied (401/403)', async () => {
    mockSession({ roles: [], businessId: BIZ1 })

    const validBody = {
      businessId: BIZ1,
      paymentMethod: 'CASH',
      items: [{ menuItemId: MENU_ITEM, quantity: 1, unitPriceCents: 50000 }],
    }
    const { req, res } = createReqRes({ method: 'POST', body: validBody })
    await salesHandler(req, res)

    expect([401, 403]).toContain(res.statusCode)
  })

  it('Sales POST /sales: non-ADMIN cannot specify a different businessId (403)', async () => {
    mockSession({ roles: ['MANAGER'], businessId: BIZ1, userId: 'u1' })

    // Body says BIZ2 but session is for BIZ1
    const validBody = {
      businessId: BIZ2,
      paymentMethod: 'CASH',
      items: [{ menuItemId: MENU_ITEM, quantity: 1, unitPriceCents: 50000 }],
    }
    const { req, res } = createReqRes({ method: 'POST', body: validBody })
    await salesHandler(req, res)

    expect(res.statusCode).toBe(403)
  })
})
