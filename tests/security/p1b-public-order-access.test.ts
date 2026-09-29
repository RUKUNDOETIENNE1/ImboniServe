/**
 * P1-B/C CUSTOMER-FACING SECURITY HARDENING — Regression Tests
 *
 * 1. confirm/status/messages previously accepted a bare orderId with no
 *    authorization — any caller could confirm/cancel/read any order (IDOR +
 *    data leak). Fix: QR access token bound per-order via Sale.orderTokenJti.
 * 2. waiter/deliver-order force-set all items to DELIVERED, bypassing the
 *    canonical SaleItemStatusService state machine (READY → DELIVERED only).
 * 3. menu-builder candidates publish/reject and menu-item translations were
 *    not scoped to the caller's business (cross-tenant IDOR).
 */

// ─── Shared mock prisma ──────────────────────────────────────────────────────
const mockPrisma = {
  orderToken: {
    create: jest.fn().mockResolvedValue({}),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  sale: {
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  saleItem: {
    updateMany: jest.fn(),
  },
  waiterCall: {
    findMany: jest.fn(),
  },
  menuItem: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  menuItemCandidate: {
    findFirst: jest.fn(),
    updateMany: jest.fn(),
    update: jest.fn(),
  },
  menuItemTranslation: {
    findMany: jest.fn(),
  },
  $transaction: jest.fn(async (cb: any) => cb(mockPrisma)),
}

jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))
jest.mock('@/lib/middleware/withRateLimit', () => ({ withRateLimit: (h: any) => h }))
jest.mock('@/lib/middleware/csrf', () => ({ withCsrf: (h: any) => h }))
jest.mock('@/lib/middleware/withFeatureCheck', () => ({ requiresFeature: () => (h: any) => h }))
jest.mock('@/lib/middleware/permission.middleware', () => ({
  requirePermission: () => (h: any) => h,
}))
jest.mock('@/lib/api/business-context', () => ({ resolveBusinessContext: jest.fn() }))
jest.mock('next-auth/next', () => ({
  __esModule: true,
  default: jest.fn(() => () => {}),
  getServerSession: jest.fn(),
}))
jest.mock('@/lib/services/kitchen-dispatch.service', () => ({
  KitchenDispatchService: { dispatchToKitchen: jest.fn().mockResolvedValue({}) },
}))
jest.mock('@/lib/die/business-as-plugin/delivery/delivery.shadow', () => ({
  ingestDeliveryShadowEvent: jest.fn().mockResolvedValue({}),
}))
jest.mock('@/lib/heart-pulse', () => ({
  publishHeartPulseEvent: jest.fn().mockResolvedValue({}),
  generateCorrelationId: () => 'corr-test',
  HeartPulseEventType: { ORDER_DELIVERED: 'ORDER_DELIVERED' },
  HeartPulseChannel: {
    business: (id: string) => `biz:${id}`,
    order: (id: string) => `order:${id}`,
    kitchen: (id: string) => `kitchen:${id}`,
  },
}))
jest.mock('@/lib/services/sale-item-status.service', () => {
  const actual = jest.requireActual('@/lib/services/sale-item-status.service')
  return {
    ...actual,
    SaleItemStatusService: {
      ...actual.SaleItemStatusService,
      transitionTx: jest.fn().mockResolvedValue({ success: true }),
      transitionBatch: jest.fn(),
    },
  }
})

import { generateAccessToken } from '@/lib/services/qr-token.service'
import confirmHandler from '@/pages/api/public/order/confirm'
import statusHandler from '@/pages/api/public/order/status'
import messagesHandler from '@/pages/api/public/order/messages'
import deliverOrderHandler from '@/pages/api/waiter/deliver-order'
import candidatesHandler from '@/pages/api/menu-builder/candidates'
import translationsHandler from '@/pages/api/menu-items/[id]/translations'
import { SmartMenuBuilderService } from '@/lib/services/smart-menu-builder.service'
import { SaleItemStatusService, InvalidTransitionError } from '@/lib/services/sale-item-status.service'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { getServerSession } from 'next-auth/next'

function mockRes() {
  const res: any = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.end = jest.fn().mockReturnValue(res)
  return res
}

const TOKEN_JTI_MATCH = /[a-f0-9]{32}/

/** Issue a real QR access token via the service (orderToken.create is mocked). */
async function issueToken(branchId = 'biz-a', tableId?: string) {
  return generateAccessToken(branchId, 'QR_IN_VENUE', tableId)
}

/** Mock the orderToken row as consumed (draft already happened). */
function consumeToken(jti: string) {
  mockPrisma.orderToken.findUnique.mockResolvedValue({
    jti, branchId: 'biz-a', used: true, expiresAt: new Date(Date.now() + 60000),
  })
}

function boundSale(jti: string, extra: any = {}) {
  return {
    id: 'sale-1', businessId: 'biz-a', orderTokenJti: jti,
    isAddon: false, parentOrderId: null, ...extra,
  }
}

beforeEach(() => jest.clearAllMocks())

// ─── 1. Public order access: status / messages / confirm ────────────────────

describe('P1-B: public order token binding', () => {
  const statusOf = (res: any) => res.status.mock.calls[0]?.[0]

  it('status: missing token → 401', async () => {
    const res = mockRes()
    await statusHandler({ method: 'GET', query: { orderId: 'sale-1' }, headers: {} } as any, res)
    expect(statusOf(res)).toBe(401)
  })

  it('status: malformed token → 401', async () => {
    const res = mockRes()
    await statusHandler({
      method: 'GET', query: { orderId: 'sale-1' },
      headers: { authorization: 'Bearer not-a-jwt' },
    } as any, res)
    expect(statusOf(res)).toBe(401)
  })

  it('status: token never consumed by a draft → 401', async () => {
    const token = await issueToken()
    mockPrisma.orderToken.findUnique.mockResolvedValue({ jti: 'x', used: false })
    const res = mockRes()
    await statusHandler({
      method: 'GET', query: { orderId: 'sale-1' },
      headers: { authorization: `Bearer ${token}` },
    } as any, res)
    expect(statusOf(res)).toBe(401)
  })

  it('status: token bound to a different order → 403 (unrelated order)', async () => {
    const token = await issueToken()
    const jti = (JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())).jti
    consumeToken(jti)
    mockPrisma.sale.findUnique.mockResolvedValue(boundSale('other-jti'))
    const res = mockRes()
    await statusHandler({
      method: 'GET', query: { orderId: 'sale-1' },
      headers: { authorization: `Bearer ${token}` },
    } as any, res)
    expect(statusOf(res)).toBe(403)
  })

  it('status: token from a foreign business cannot read its orders → 403', async () => {
    // Token's jti happens to match (cross-tenant collision is impossible in
    // practice, but the defense-in-depth branchId check must also hold)
    const foreignToken = await issueToken('biz-b')
    const jti = JSON.parse(Buffer.from(foreignToken.split('.')[1], 'base64').toString()).jti
    mockPrisma.orderToken.findUnique.mockResolvedValue({
      jti, branchId: 'biz-b', used: true, expiresAt: new Date(Date.now() + 60000),
    })
    mockPrisma.sale.findUnique.mockResolvedValue({
      ...boundSale(jti), businessId: 'biz-a',
    })
    const res = mockRes()
    await statusHandler({
      method: 'GET', query: { orderId: 'sale-1' },
      headers: { authorization: `Bearer ${foreignToken}` },
    } as any, res)
    expect(statusOf(res)).toBe(403)
  })

  it('status: order with no token binding → 403 (non-QR/legacy orders)', async () => {
    const token = await issueToken()
    const jti = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).jti
    consumeToken(jti)
    mockPrisma.sale.findUnique.mockResolvedValue(boundSale(null as any))
    const res = mockRes()
    await statusHandler({
      method: 'GET', query: { orderId: 'sale-1' },
      headers: { authorization: `Bearer ${token}` },
    } as any, res)
    expect(statusOf(res)).toBe(403)
  })

  it('status: legitimate bound token → 200 with order data', async () => {
    const token = await issueToken()
    const jti = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).jti
    consumeToken(jti)
    mockPrisma.sale.findUnique
      .mockResolvedValueOnce(boundSale(jti)) // auth guard
      .mockResolvedValueOnce({             // endpoint payload query
        id: 'sale-1', orderNumber: 'ORD-1', status: 'ACTIVE', orderSource: 'QR_IN_VENUE',
        paymentStatus: 'PENDING', scheduledAt: null, kitchenReleasedAt: null,
        readyAt: null, prepStartedAt: null, totalAmountCents: 5000, depositCents: 0,
        paymentTransaction: null, business: { name: 'B', address: 'A', phone: 'P' },
        table: { number: 'T1' }, items: [],
      })
    const res = mockRes()
    await statusHandler({
      method: 'GET', query: { orderId: 'sale-1' },
      headers: { authorization: `Bearer ${token}` },
    } as any, res)
    expect(statusOf(res)).toBe(200)
    expect(res.json.mock.calls[0][0].orderNumber).toBe('ORD-1')
  })

  it('status: addon order inherits parent order token binding → 200', async () => {
    const token = await issueToken()
    const jti = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).jti
    consumeToken(jti)
    mockPrisma.sale.findUnique
      .mockResolvedValueOnce(boundSale(null as any, { isAddon: true, parentOrderId: 'sale-parent' }))
      .mockResolvedValueOnce({ orderTokenJti: jti }) // parent binding lookup
      .mockResolvedValueOnce({
        id: 'sale-1', orderNumber: 'ORD-2', status: 'ACTIVE', orderSource: 'QR_IN_VENUE',
        paymentStatus: 'PENDING', scheduledAt: null, kitchenReleasedAt: null,
        readyAt: null, prepStartedAt: null, totalAmountCents: 1000, depositCents: 0,
        paymentTransaction: null, business: { name: 'B', address: 'A', phone: 'P' },
        table: { number: 'T1' }, items: [],
      })
    const res = mockRes()
    await statusHandler({
      method: 'GET', query: { orderId: 'sale-1' },
      headers: { authorization: `Bearer ${token}` },
    } as any, res)
    expect(statusOf(res)).toBe(200)
  })

  it('messages: wrong order token → 403', async () => {
    const token = await issueToken()
    const jti = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).jti
    consumeToken(jti)
    mockPrisma.sale.findUnique.mockResolvedValue(boundSale('other-jti'))
    const res = mockRes()
    await messagesHandler({
      method: 'GET', query: { orderId: 'sale-1' },
      headers: { authorization: `Bearer ${token}` },
    } as any, res)
    expect(statusOf(res)).toBe(403)
  })

  it('messages: legitimate bound token → 200 with messages', async () => {
    const token = await issueToken()
    const jti = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).jti
    consumeToken(jti)
    mockPrisma.sale.findUnique.mockResolvedValue(boundSale(jti))
    mockPrisma.waiterCall.findMany.mockResolvedValue([
      { id: 'm1', customMessage: 'Order received', createdAt: new Date() },
    ])
    const res = mockRes()
    await messagesHandler({
      method: 'GET', query: { orderId: 'sale-1' },
      headers: { authorization: `Bearer ${token}` },
    } as any, res)
    expect(statusOf(res)).toBe(200)
    expect(res.json.mock.calls[0][0].messages).toHaveLength(1)
  })

  it('confirm: missing token → 401', async () => {
    const res = mockRes()
    await confirmHandler({
      method: 'POST', body: { orderId: 'sale-1', confirmed: true }, headers: {},
    } as any, res)
    expect(statusOf(res)).toBe(401)
  })

  it('confirm: legitimate confirmation → 200, sets customerConfirmedAt', async () => {
    const token = await issueToken()
    const jti = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).jti
    consumeToken(jti)
    mockPrisma.sale.findUnique
      .mockResolvedValueOnce(boundSale(jti))
      .mockResolvedValueOnce({ id: 'sale-1', status: 'ACTIVE', customerConfirmedAt: null })
      .mockResolvedValue(null)
    mockPrisma.sale.update.mockResolvedValue({
      id: 'sale-1', orderNumber: 'ORD-1', status: 'ACTIVE',
      customerConfirmedAt: new Date(), items: [],
    })
    const res = mockRes()
    await confirmHandler({
      method: 'POST',
      body: { orderId: 'sale-1', confirmed: true, accessToken: token },
      headers: {},
    } as any, res)
    expect(statusOf(res)).toBe(200)
    expect(mockPrisma.sale.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ customerConfirmedAt: expect.any(Date) }) })
    )
  })

  it('confirm: legitimate cancellation → 200, sets CANCELLED', async () => {
    const token = await issueToken()
    const jti = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).jti
    consumeToken(jti)
    mockPrisma.sale.findUnique
      .mockResolvedValueOnce(boundSale(jti))
      .mockResolvedValueOnce({ id: 'sale-1', status: 'ACTIVE', customerConfirmedAt: null })
    mockPrisma.sale.update.mockResolvedValue({ id: 'sale-1', status: 'CANCELLED' })
    const res = mockRes()
    await confirmHandler({
      method: 'POST',
      body: { orderId: 'sale-1', confirmed: false, accessToken: token },
      headers: {},
    } as any, res)
    expect(statusOf(res)).toBe(200)
    expect(mockPrisma.sale.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'CANCELLED' } })
    )
  })

  it('confirm: foreign/unrelated order → 403, no mutation', async () => {
    const token = await issueToken()
    const jti = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).jti
    consumeToken(jti)
    mockPrisma.sale.findUnique.mockResolvedValue(boundSale('other-jti'))
    const res = mockRes()
    await confirmHandler({
      method: 'POST',
      body: { orderId: 'sale-1', confirmed: false, accessToken: token },
      headers: {},
    } as any, res)
    expect(statusOf(res)).toBe(403)
    expect(mockPrisma.sale.update).not.toHaveBeenCalled()
  })

  it('confirm: replay on already-confirmed order → 400 (idempotent guard intact)', async () => {
    const token = await issueToken()
    const jti = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).jti
    consumeToken(jti)
    mockPrisma.sale.findUnique
      .mockResolvedValueOnce(boundSale(jti))
      .mockResolvedValueOnce({ id: 'sale-1', status: 'ACTIVE', customerConfirmedAt: new Date() })
    const res = mockRes()
    await confirmHandler({
      method: 'POST',
      body: { orderId: 'sale-1', confirmed: true, accessToken: token },
      headers: {},
    } as any, res)
    expect(statusOf(res)).toBe(400)
    expect(mockPrisma.sale.update).not.toHaveBeenCalled()
  })
})

// ─── 2. deliver-order state-machine compliance ───────────────────────────────

describe('P1-C: deliver-order uses canonical item lifecycle', () => {
  const ctx = { businessId: 'biz-a', userId: 'user-1', roles: ['WAITER'] }
  const orderWith = (items: any[], extra: any = {}) => ({
    id: 'sale-1', orderNumber: 'ORD-1', businessId: 'biz-a',
    kitchenStatus: 'ready', expoStatus: 'EXPO_CONFIRMED',
    table: { number: 'T1' }, items, ...extra,
  })

  beforeEach(() => {
    ;(resolveBusinessContext as jest.Mock).mockResolvedValue(ctx)
    mockPrisma.sale.update.mockResolvedValue({ id: 'sale-1', table: { number: 'T1' } })
  })

  it('READY items → transitioned through SaleItemStatusService → 200', async () => {
    mockPrisma.sale.findUnique.mockResolvedValue(orderWith([
      { id: 'i1', itemStatus: 'READY' },
      { id: 'i2', itemStatus: 'READY' },
      { id: 'i3', itemStatus: 'DELIVERED' },
    ]))
    const res = mockRes()
    await deliverOrderHandler({ method: 'POST', body: { orderId: 'sale-1' } } as any, res)
    expect(res.status.mock.calls[0]?.[0]).toBe(200)
    expect(SaleItemStatusService.transitionTx).toHaveBeenCalledTimes(2)
    expect(SaleItemStatusService.transitionTx).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ saleItemId: 'i1', newStatus: 'DELIVERED', actorUserId: 'user-1' })
    )
  })

  it('items still NEW/PREPARING → 409, no transition, no order update', async () => {
    mockPrisma.sale.findUnique.mockResolvedValue(orderWith([
      { id: 'i1', itemStatus: 'READY' },
      { id: 'i2', itemStatus: 'PREPARING' },
    ]))
    const res = mockRes()
    await deliverOrderHandler({ method: 'POST', body: { orderId: 'sale-1' } } as any, res)
    expect(res.status.mock.calls[0]?.[0]).toBe(409)
    expect(SaleItemStatusService.transitionTx).not.toHaveBeenCalled()
    expect(mockPrisma.sale.update).not.toHaveBeenCalled()
  })

  it('invalid transition surfaced by state machine → 409', async () => {
    mockPrisma.sale.findUnique.mockResolvedValue(orderWith([{ id: 'i1', itemStatus: 'READY' }]))
    ;(SaleItemStatusService.transitionTx as jest.Mock).mockRejectedValueOnce(
      new InvalidTransitionError('READY' as any, 'DELIVERED' as any, [])
    )
    const res = mockRes()
    await deliverOrderHandler({ method: 'POST', body: { orderId: 'sale-1' } } as any, res)
    expect(res.status.mock.calls[0]?.[0]).toBe(409)
  })

  it('foreign-business order → 403, nothing transitioned', async () => {
    mockPrisma.sale.findUnique.mockResolvedValue(orderWith(
      [{ id: 'i1', itemStatus: 'READY' }], { businessId: 'biz-b' }
    ))
    const res = mockRes()
    await deliverOrderHandler({ method: 'POST', body: { orderId: 'sale-1' } } as any, res)
    expect(res.status.mock.calls[0]?.[0]).toBe(403)
    expect(SaleItemStatusService.transitionTx).not.toHaveBeenCalled()
  })
})

// ─── 3. Menu-builder + translations tenant isolation ────────────────────────

describe('P1-C: menu-builder / translation tenant isolation', () => {
  beforeEach(() => {
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', businessId: 'biz-a' },
    })
  })

  it('candidates: publish scopes lookup to caller business', async () => {
    mockPrisma.menuItemCandidate.findFirst.mockResolvedValue({
      id: 'cand-1', businessId: 'biz-a', status: 'PENDING',
      name: 'Item', description: 'd', category: 'c', priceCents: 100,
    })
    mockPrisma.menuItem.create.mockResolvedValue({ id: 'mi-1' })
    mockPrisma.menuItemCandidate.update.mockResolvedValue({})
    const res = mockRes()
    await candidatesHandler({
      method: 'POST', body: { action: 'publish', candidateId: 'cand-1' },
    } as any, res)
    expect(mockPrisma.menuItemCandidate.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'cand-1', businessId: 'biz-a' } })
    )
    expect(res.status.mock.calls[0]?.[0]).toBe(200)
  })

  it('candidates: foreign-business candidate cannot be published', async () => {
    mockPrisma.menuItemCandidate.findFirst.mockResolvedValue(null) // scoped lookup misses
    const res = mockRes()
    await expect(
      candidatesHandler({
        method: 'POST', body: { action: 'publish', candidateId: 'cand-foreign' },
      } as any, res)
    ).rejects.toThrow('Candidate not found')
    expect(mockPrisma.menuItem.create).not.toHaveBeenCalled()
  })

  it('candidates: foreign-business candidate cannot be rejected', async () => {
    mockPrisma.menuItemCandidate.updateMany.mockResolvedValue({ count: 0 })
    const res = mockRes()
    await expect(
      candidatesHandler({
        method: 'POST', body: { action: 'reject', candidateId: 'cand-foreign' },
      } as any, res)
    ).rejects.toThrow('Candidate not found')
    expect(mockPrisma.menuItemCandidate.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ businessId: 'biz-a' }) })
    )
  })

  it('translations: foreign-business menu item → 404 (GET/PUT/DELETE)', async () => {
    mockPrisma.menuItem.findFirst.mockResolvedValue(null)
    for (const method of ['GET', 'PUT', 'DELETE']) {
      const res = mockRes()
      await translationsHandler({
        method, query: { id: 'mi-foreign', locale: 'fr' },
        body: { locale: 'fr', name: 'x' }, headers: {},
      } as any, res)
      expect(res.status.mock.calls[0]?.[0]).toBe(404)
    }
  })

  it('translations: same-tenant GET → 200', async () => {
    mockPrisma.menuItem.findFirst.mockResolvedValue({ id: 'mi-1' })
    mockPrisma.menuItemTranslation.findMany.mockResolvedValue([{ locale: 'fr', name: 'Poulet' }])
    const res = mockRes()
    await translationsHandler({ method: 'GET', query: { id: 'mi-1' }, headers: {} } as any, res)
    expect(res.status.mock.calls[0]?.[0]).toBe(200)
    expect(mockPrisma.menuItem.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'mi-1', businessId: 'biz-a' } })
    )
  })
})
