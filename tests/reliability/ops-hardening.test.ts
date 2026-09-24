/**
 * OPERATIONAL HARDENING — Regression Tests
 *
 * Covers the first-customer operational fixes:
 * 1. station/orders + waiter/queue: scheduled (preorder) orders visible on
 *    their service day; failed-dispatch orders visible to waiters.
 * 2. kitchen/update-status emits 'order.ready' + 'order.ready_for_pickup'
 *    (previously dead events — dashboards listened but nothing emitted).
 * 3. orders/[id]/add-items: requires staff session or bound order token;
 *    addon orders dispatched through canonical KitchenDispatchService.
 * 4. setup-status: stations + QR included in onboarding checklist.
 * 5. env-validator: PAYMENTS_PROVIDER unset → provider vars not required;
 *    explicit provider still validated strictly.
 */

// ─── Shared mock prisma ──────────────────────────────────────────────────────
const mockPrisma = {
  orderToken: {
    create: jest.fn().mockResolvedValue({}),
    findUnique: jest.fn(),
  },
  sale: {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  station: {
    findUnique: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
  },
  business: {
    findUnique: jest.fn(),
  },
  menuItem: {
    findUnique: jest.fn(),
    count: jest.fn(),
  },
  menuItemCandidate: {},
  table: { count: jest.fn() },
  user: { count: jest.fn() },
  $transaction: jest.fn(async (cb: any) => cb(mockPrisma)),
}

jest.mock('nanoid', () => ({ nanoid: () => 'test-nanoid' }))
jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))
jest.mock('@/lib/middleware/permission.middleware', () => ({
  requirePermission: () => (h: any) => h,
}))
jest.mock('@/lib/middleware/withFeatureCheck', () => ({
  requiresFeature: () => (h: any) => h,
  requiresActiveSubscription: (h: any) => h,
}))
jest.mock('@/lib/api/business-context', () => ({ resolveBusinessContext: jest.fn() }))
jest.mock('next-auth/next', () => ({
  __esModule: true,
  default: jest.fn(() => () => {}),
  getServerSession: jest.fn(),
}))
jest.mock('@/lib/pusher-server', () => ({ triggerEvent: jest.fn().mockResolvedValue({}) }))
jest.mock('@/lib/realtime', () => ({ realtimeService: { emit: jest.fn().mockResolvedValue({}) } }))
jest.mock('@/lib/services/kitchen-dispatch.service', () => ({
  KitchenDispatchService: { dispatchToKitchen: jest.fn().mockResolvedValue({}) },
}))
jest.mock('@/lib/services/sale-item-status.service', () => {
  const actual = jest.requireActual('@/lib/services/sale-item-status.service')
  return {
    ...actual,
    SaleItemStatusService: {
      ...actual.SaleItemStatusService,
      transitionTx: jest.fn().mockResolvedValue({ success: true }),
    },
  }
})
jest.mock('@/lib/services/ticket-event.service', () => ({
  TicketEventService: { recordEvent: jest.fn().mockResolvedValue({}) },
}))
jest.mock('@/lib/die/business-as-plugin/delivery/delivery.shadow', () => ({
  ingestDeliveryShadowEvent: jest.fn().mockResolvedValue({}),
}))
jest.mock('@/lib/services/whatsapp-order.service', () => ({
  WhatsAppOrderService: { notifyOrderReady: jest.fn().mockResolvedValue({}) },
}))

import { resolveBusinessContext } from '@/lib/api/business-context'
import { getServerSession } from 'next-auth/next'
import { triggerEvent } from '@/lib/pusher-server'
import { generateAccessToken } from '@/lib/services/qr-token.service'
import { KitchenDispatchService } from '@/lib/services/kitchen-dispatch.service'
import stationOrdersHandler from '@/pages/api/station/orders'
import waiterQueueHandler from '@/pages/api/waiter/queue'
import updateStatusHandler from '@/pages/api/kitchen/update-status'
import addItemsHandler from '@/pages/api/orders/[id]/add-items'
import setupStatusHandler from '@/pages/api/business/setup-status'

function mockRes() {
  const res: any = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.end = jest.fn().mockReturnValue(res)
  return res
}

const ctx = { businessId: 'biz-a', userId: 'user-1', roles: ['WAITER'] }

beforeEach(() => {
  jest.clearAllMocks()
  ;(resolveBusinessContext as jest.Mock).mockResolvedValue(ctx)
  mockPrisma.business.findUnique.mockResolvedValue({ timezone: 'Africa/Kigali' })
})

// ─── 1. Station orders: preorder visibility ──────────────────────────────────

describe('station/orders operational visibility', () => {
  beforeEach(() => {
    mockPrisma.station.findUnique.mockResolvedValue({
      businessId: 'biz-a', isActive: true, name: 'Main', code: 'KITCHEN',
    })
  })

  it('includes scheduled orders due today and unscheduled orders created today', async () => {
    const res = mockRes()
    await stationOrdersHandler({ method: 'GET', query: { stationId: 'st-1' } } as any, res)
    expect(res.status.mock.calls[0]?.[0]).toBe(200)
    const where = mockPrisma.sale.findMany.mock.calls[0][0].where
    // OR: unscheduled created today OR scheduledAt within today
    expect(where.OR).toHaveLength(2)
    expect(where.OR[1].scheduledAt.gte).toBeInstanceOf(Date)
    expect(where.OR[1].scheduledAt.lt).toBeInstanceOf(Date)
    // Item-level isolation: only this station's items are matched/returned
    expect(where.items.some.stationId).toBe('st-1')
  })

  it('denies cross-business station access', async () => {
    mockPrisma.station.findUnique.mockResolvedValue({
      businessId: 'biz-b', isActive: true, name: 'Other', code: 'BAR',
    })
    const res = mockRes()
    await stationOrdersHandler({ method: 'GET', query: { stationId: 'st-foreign' } } as any, res)
    expect(res.status.mock.calls[0]?.[0]).toBe(403)
  })
})

// ─── 2. Waiter queue: failed dispatch + preorder visibility ──────────────────

describe('waiter/queue operational visibility', () => {
  it('surfaces dispatched AND failed-dispatch orders; scheduled orders on service day', async () => {
    const res = mockRes()
    await waiterQueueHandler({ method: 'GET', query: {} } as any, res)
    expect(res.status.mock.calls[0]?.[0]).toBe(200)
    const where = mockPrisma.sale.findMany.mock.calls[0][0].where
    expect(where.kitchenDispatchStatus.in).toEqual(
      expect.arrayContaining(['dispatched', 'failed'])
    )
    expect(where.OR).toHaveLength(2)
    expect(where.OR[1].scheduledAt.lt).toBeInstanceOf(Date)
  })
})

// ─── 3. update-status ready events ──────────────────────────────────────────

describe('kitchen/update-status realtime events', () => {
  it('emits order.ready and order.ready_for_pickup when order becomes ready', async () => {
    mockPrisma.sale.findUnique.mockResolvedValue({
      id: 'sale-1', businessId: 'biz-a', kitchenStatus: 'preparing',
    })
    mockPrisma.sale.update.mockResolvedValue({
      id: 'sale-1', businessId: 'biz-a', orderNumber: 'ORD-1',
      kitchenStatus: 'ready', items: [], table: { number: 'T1' }, participant: null,
    })
    const res = mockRes()
    await updateStatusHandler({
      method: 'POST', body: { orderId: 'sale-1', newStatus: 'ready' },
    } as any, res)

    const events = (triggerEvent as jest.Mock).mock.calls.map(c => ({ channel: c[0], event: c[1] }))
    expect(events).toContainEqual({ channel: 'private-kitchen-biz-a', event: 'order.ready' })
    expect(events).toContainEqual({ channel: 'private-business-biz-a', event: 'order.ready_for_pickup' })
  })

  it('does not emit ready events for non-ready transitions', async () => {
    mockPrisma.sale.findUnique.mockResolvedValue({
      id: 'sale-1', businessId: 'biz-a', kitchenStatus: 'pending',
    })
    mockPrisma.sale.update.mockResolvedValue({
      id: 'sale-1', businessId: 'biz-a', orderNumber: 'ORD-1',
      kitchenStatus: 'preparing', items: [], table: null, participant: null,
    })
    const res = mockRes()
    await updateStatusHandler({
      method: 'POST', body: { orderId: 'sale-1', newStatus: 'preparing' },
    } as any, res)

    const eventNames = (triggerEvent as jest.Mock).mock.calls.map(c => c[1])
    expect(eventNames).not.toContain('order.ready')
    expect(eventNames).not.toContain('order.ready_for_pickup')
  })
})

// ─── 4. add-items auth + dispatch ────────────────────────────────────────────

describe('orders/[id]/add-items', () => {
  const parentOrder = {
    id: 'sale-parent', businessId: 'biz-a', userId: 'u1', tableId: 't1',
    orderNumber: 'ORD-1', totalAmountCents: 5000, paymentMethod: 'CASH',
    status: 'ACTIVE', orderSource: 'QR_IN_VENUE', orderTokenJti: 'jti-parent',
    isAddon: false, parentOrderId: null, customerPhone: null, customerName: null,
    business: {
      id: 'biz-a', name: 'B', currency: 'RWF',
      plan: { code: 'GROWTH' },
      trialEndDate: null,
      subscriptions: [{ status: 'ACTIVE', endDate: null }],
    },
    table: { id: 't1', number: 'T1' },
  }
  const body = {
    items: [{ menuItemId: 'mi-1', quantity: 2 }],
    accessToken: 'tok',
  }

  beforeEach(() => {
    mockPrisma.sale.findUnique.mockImplementation(({ where, select }: any) => {
      if (select && Object.keys(select).length <= 5) {
        // auth-guard lookup (select has binding fields only)
        return Promise.resolve({
          id: 'sale-parent', businessId: 'biz-a', orderTokenJti: 'jti-parent',
          isAddon: false, parentOrderId: null,
        })
      }
      return Promise.resolve(parentOrder)
    })
    mockPrisma.menuItem.findUnique.mockResolvedValue({
      id: 'mi-1', name: 'Item', priceCents: 1000, businessId: 'biz-a',
    })
    mockPrisma.sale.create.mockResolvedValue({
      id: 'sale-addon', orderNumber: 'ADD-ORD-1', totalAmountCents: 2000,
      status: 'ACTIVE', createdAt: new Date(),
      items: [{ menuItem: { name: 'Item', category: 'c' }, quantity: 2, unitPriceCents: 1000 }],
    })
  })

  it('no session and no token → 401, nothing created', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    const res = mockRes()
    await addItemsHandler({
      method: 'POST', query: { id: 'sale-parent' }, body: { items: body.items }, headers: {},
    } as any, res)
    expect(res.status.mock.calls[0]?.[0]).toBe(401)
    expect(mockPrisma.sale.create).not.toHaveBeenCalled()
  })

  it('bound customer order token → addon created + dispatched to stations', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    const token = await generateAccessToken('biz-a', 'QR_IN_VENUE')
    const jti = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).jti
    mockPrisma.orderToken.findUnique.mockResolvedValue({ jti, used: true })
    mockPrisma.sale.findUnique.mockImplementation(({ select }: any) => {
      if (select) {
        return Promise.resolve({
          id: 'sale-parent', businessId: 'biz-a', orderTokenJti: jti,
          isAddon: false, parentOrderId: null,
        })
      }
      return Promise.resolve({ ...parentOrder, orderTokenJti: jti })
    })
    const res = mockRes()
    await addItemsHandler({
      method: 'POST', query: { id: 'sale-parent' },
      body: { ...body, accessToken: token }, headers: {},
    } as any, res)
    expect(res.status.mock.calls[0]?.[0]).toBe(201)
    expect(mockPrisma.sale.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ isAddon: true, parentOrderId: 'sale-parent' }) })
    )
    expect(KitchenDispatchService.dispatchToKitchen).toHaveBeenCalledWith(
      expect.objectContaining({ saleId: 'sale-addon', businessId: 'biz-a' })
    )
  })

  it('same-business staff session → addon created', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1', businessId: 'biz-a' } })
    const res = mockRes()
    await addItemsHandler({
      method: 'POST', query: { id: 'sale-parent' }, body: { items: body.items }, headers: {},
    } as any, res)
    expect(res.status.mock.calls[0]?.[0]).toBe(201)
  })

  it('foreign-business staff session without token → 401', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u2', businessId: 'biz-b' } })
    const res = mockRes()
    await addItemsHandler({
      method: 'POST', query: { id: 'sale-parent' }, body: { items: body.items }, headers: {},
    } as any, res)
    expect(res.status.mock.calls[0]?.[0]).toBe(401)
    expect(mockPrisma.sale.create).not.toHaveBeenCalled()
  })

  it('customer token on a business without hasOrders entitlement → 402', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    const token = await generateAccessToken('biz-a', 'QR_IN_VENUE')
    const jti = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).jti
    mockPrisma.orderToken.findUnique.mockResolvedValue({ jti, used: true })
    mockPrisma.sale.findUnique.mockResolvedValue({
      ...parentOrder,
      orderTokenJti: jti,
      business: { ...parentOrder.business, plan: null },
    })
    const res = mockRes()
    await addItemsHandler({
      method: 'POST', query: { id: 'sale-parent' },
      body: { ...body, accessToken: token }, headers: {},
    } as any, res)
    expect(res.status.mock.calls[0]?.[0]).toBe(402)
    expect(mockPrisma.sale.create).not.toHaveBeenCalled()
  })
})

// ─── 5. setup-status checklist ───────────────────────────────────────────────

describe('setup-status onboarding checklist', () => {
  it('reports hasStations/hasQR and recommends ADD_STATION when missing', async () => {
    mockPrisma.menuItem.count.mockResolvedValue(3)
    mockPrisma.table.count.mockResolvedValue(2)
    mockPrisma.station.count.mockResolvedValue(0)
    mockPrisma.user.count.mockResolvedValue(1)
    mockPrisma.sale.findFirst.mockResolvedValue(null)
    mockPrisma.business.findUnique.mockResolvedValue({
      taxMode: 'INCLUSIVE', taxRate: 18, currency: 'RWF',
      splitPaymentConvenienceFeeEnabled: false, enableQRInVenue: false,
    })
    const res = mockRes()
    await setupStatusHandler({ method: 'GET', query: {} } as any, res)
    const body = res.json.mock.calls[0][0]
    expect(body.progress.hasStations).toBe(false)
    expect(body.progress.hasQR).toBe(false)
    expect(body.progress.totalSteps).toBe(6)
    expect(body.nextAction.code).toBe('ADD_STATION')
    expect(body.coreSetupComplete).toBe(false)
  })
})

// ─── 6. env-validator provider conditionality ────────────────────────────────

describe('env-validator payment provider conditionality', () => {
  // NOTE: next.config.js loads src/lib/env-validator.js (Node resolves .js
  // first) — that is the validator exercised here. It is production-gated.
  const ORIG = { ...process.env }
  const baseProdEnv = () => {
    process.env.NODE_ENV = 'production'
    process.env.DATABASE_URL = 'postgresql://x'
    process.env.NEXTAUTH_SECRET = 'x'.repeat(40)
  }

  afterEach(() => { process.env = { ...ORIG } })

  it('PAYMENTS_PROVIDER unset → InTouch vars not required in production build', () => {
    delete process.env.PAYMENTS_PROVIDER
    delete process.env.INTOUCH_ACCOUNT_NO
    delete process.env.INTOUCH_API_URL
    baseProdEnv()
    const { validateEnv } = require('@/lib/env-validator')
    expect(() => validateEnv()).not.toThrow()
  })

  it('PAYMENTS_PROVIDER=intouch → missing InTouch vars still fail the build', () => {
    process.env.PAYMENTS_PROVIDER = 'intouch'
    delete process.env.INTOUCH_ACCOUNT_NO
    delete process.env.INTOUCH_API_URL
    baseProdEnv()
    const { validateEnv } = require('@/lib/env-validator')
    expect(() => validateEnv()).toThrow(/INTOUCH_ACCOUNT_NO/)
  })
})
