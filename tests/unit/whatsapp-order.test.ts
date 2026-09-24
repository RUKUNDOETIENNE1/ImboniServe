/**
 * WhatsAppOrderService — staff ordering correctness (Foundation Phase 1)
 *
 * Covers: phone normalization, role auth, tenant isolation, ORDER parsing,
 * exact/ambiguous/unmatched menu matching, server-side pricing, Sale
 * creation, MessageSid dedup, kitchen dispatch, currency confirmation.
 */

const mockPrisma = {
  user: { findFirst: jest.fn() },
  table: { findFirst: jest.fn() },
  menuItem: { findFirst: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
  sale: { create: jest.fn(), findUnique: jest.fn() },
  whatsAppMessage: { findFirst: jest.fn(), create: jest.fn(), delete: jest.fn() },
  postAttribution: { create: jest.fn() },
}

jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))
jest.mock('@/lib/logger', () => ({
  logger: { child: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }) },
}))
const mockDispatch = jest.fn().mockResolvedValue({})
jest.mock('@/lib/services/kitchen-dispatch.service', () => ({
  KitchenDispatchService: { dispatchToKitchen: mockDispatch },
}))
jest.mock('twilio', () => {
  const fn: any = jest.fn(() => ({}))
  fn.validateRequest = jest.fn()
  return fn
})

import { WhatsAppOrderService } from '@/lib/services/whatsapp-order.service'
import { normalizePhone, maskPhone } from '@/lib/utils/phone'
import { escapeXml } from '@/lib/utils/xml'

const STAFF = { id: 'u1', phone: '+250788000001', businessId: 'b1', business: { id: 'b1' } }
const TABLE = { id: 't1', number: 'T5', businessId: 'b1' }
const TEA = { id: 'm1', name: 'Tea', priceCents: 500, businessId: 'b1' }

function mockHappyPath() {
  mockPrisma.user.findFirst.mockResolvedValue(STAFF)
  mockPrisma.table.findFirst.mockResolvedValue(TABLE)
  mockPrisma.menuItem.findFirst.mockResolvedValue(TEA)
  mockPrisma.menuItem.findMany.mockResolvedValue([])
  mockPrisma.sale.create.mockResolvedValue({
    id: 'sale-1', businessId: 'b1', orderNumber: 'ORD-X', orderSource: 'WHATSAPP',
    tableId: 't1', table: TABLE, business: { currency: 'USD' },
    totalAmountCents: 1000,
    items: [{ menuItem: TEA, quantity: 2, unitPriceCents: 500, totalPriceCents: 1000 }],
  })
  mockPrisma.whatsAppMessage.findFirst.mockResolvedValue(null)
  mockPrisma.whatsAppMessage.create.mockResolvedValue({})
  mockPrisma.whatsAppMessage.delete.mockResolvedValue({})
}

describe('WhatsAppOrderService.processIncomingMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHappyPath()
  })

  // ── Staff authorization & tenant ──────────────────────────────────
  it('rejects unregistered phone (unauthorized)', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null)
    const r = await WhatsAppOrderService.processIncomingMessage('whatsapp:+250999999999', 'ORDER T5 1x Tea')
    expect(r.success).toBe(false)
    expect(r.reply).toMatch(/Unauthorized/)
    expect(mockPrisma.sale.create).not.toHaveBeenCalled()
  })

  it('normalizes incoming phone before staff lookup (Rwanda variants)', async () => {
    await WhatsAppOrderService.processIncomingMessage('whatsapp:+250788000001', 'ORDER T5 1x Tea')
    const phoneArg = mockPrisma.user.findFirst.mock.calls[0][0].where.phone.in as string[]
    expect(phoneArg).toContain('+250788000001')
    expect(phoneArg).toContain('0788000001')
  })

  it('scopes order to staff business (tenant isolation)', async () => {
    await WhatsAppOrderService.processIncomingMessage('whatsapp:+250788000001', 'ORDER T5 1x Tea')
    expect(mockPrisma.table.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ businessId: 'b1' }) })
    )
    expect(mockPrisma.sale.create.mock.calls[0][0].data.businessId).toBe('b1')
  })

  // ── Parsing ───────────────────────────────────────────────────────
  it('rejects non-ORDER messages with usage hint', async () => {
    const r = await WhatsAppOrderService.processIncomingMessage('whatsapp:+250788000001', 'hello')
    expect(r.reply).toMatch(/Invalid format/)
  })

  it('rejects unknown table', async () => {
    mockPrisma.table.findFirst.mockResolvedValue(null)
    const r = await WhatsAppOrderService.processIncomingMessage('whatsapp:+250788000001', 'ORDER Z9 1x Tea')
    expect(r.reply).toMatch(/Table Z9 not found/)
    expect(mockPrisma.sale.create).not.toHaveBeenCalled()
  })

  // ── Menu matching ─────────────────────────────────────────────────
  it('accepts an exact (case-insensitive) match', async () => {
    const r = await WhatsAppOrderService.processIncomingMessage('whatsapp:+250788000001', 'ORDER T5 2x tea')
    expect(r.success).toBe(true)
    expect(mockPrisma.menuItem.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          businessId: 'b1',
          isAvailable: true,
          name: { equals: 'tea', mode: 'insensitive' },
        }),
      })
    )
  })

  it('rejects order when an item is unmatched — nothing silently dropped', async () => {
    mockPrisma.menuItem.findFirst.mockResolvedValue(null)
    mockPrisma.menuItem.findMany.mockResolvedValue([])
    const r = await WhatsAppOrderService.processIncomingMessage('whatsapp:+250788000001', 'ORDER T5 2x Tea, 1x Nonexistent')
    expect(r.success).toBe(false)
    expect(r.reply).toMatch(/not created/i)
    expect(r.reply).toContain('Tea')
    expect(r.reply).toContain('Nonexistent')
    expect(mockPrisma.sale.create).not.toHaveBeenCalled()
  })

  it('rejects ambiguous matches instead of picking first row', async () => {
    mockPrisma.menuItem.findFirst.mockResolvedValue(null) // no exact
    mockPrisma.menuItem.findMany.mockResolvedValue([
      { id: 'm1', name: 'Primus 50cl', priceCents: 1500 },
      { id: 'm2', name: 'Primus 70cl', priceCents: 2000 },
    ])
    const r = await WhatsAppOrderService.processIncomingMessage('whatsapp:+250788000001', 'ORDER T5 1x Primus')
    expect(r.success).toBe(false)
    expect(r.reply).toMatch(/ambiguous/i)
    expect(r.reply).toContain('Primus 50cl')
    expect(r.reply).toContain('Primus 70cl')
    expect(mockPrisma.sale.create).not.toHaveBeenCalled()
  })

  it('accepts a unique partial match', async () => {
    mockPrisma.menuItem.findFirst.mockResolvedValue(null)
    mockPrisma.menuItem.findMany.mockResolvedValue([{ id: 'm1', name: 'Brochettes Special', priceCents: 3000 }])
    mockPrisma.menuItem.findUnique.mockResolvedValue({ id: 'm1', name: 'Brochettes Special', priceCents: 3000 })
    const r = await WhatsAppOrderService.processIncomingMessage('whatsapp:+250788000001', 'ORDER T5 1x Brochettes')
    expect(r.success).toBe(true)
  })

  // ── Server-side pricing ───────────────────────────────────────────
  it('prices come from MenuItem rows, not the message', async () => {
    await WhatsAppOrderService.processIncomingMessage('whatsapp:+250788000001', 'ORDER T5 3x Tea')
    const items = mockPrisma.sale.create.mock.calls[0][0].data.items.create
    expect(items[0].unitPriceCents).toBe(500) // DB price, message has no price
    expect(items[0].totalPriceCents).toBe(1500)
    expect(mockPrisma.sale.create.mock.calls[0][0].data.totalAmountCents).toBe(1500)
  })

  // ── Sale creation ─────────────────────────────────────────────────
  it('creates Sale with orderSource WHATSAPP and CASH pending', async () => {
    await WhatsAppOrderService.processIncomingMessage('whatsapp:+250788000001', 'ORDER T5 1x Tea')
    const data = mockPrisma.sale.create.mock.calls[0][0].data
    expect(data.orderSource).toBe('WHATSAPP')
    expect(data.paymentMethod).toBe('CASH')
    expect(data.paymentStatus).toBe('PENDING')
    expect(data.userId).toBe('u1')
  })

  // ── MessageSid dedup ──────────────────────────────────────────────
  it('re-delivered MessageSid does not create a second Sale', async () => {
    mockPrisma.whatsAppMessage.findFirst.mockResolvedValue({ id: 'wm-1' })
    const r = await WhatsAppOrderService.processIncomingMessage('whatsapp:+250788000001', 'ORDER T5 1x Tea', { messageSid: 'SM_DUP' })
    expect(r.duplicate).toBe(true)
    expect(mockPrisma.sale.create).not.toHaveBeenCalled()
  })

  it('records inbound message with messageSid BEFORE order creation (dedup gate)', async () => {
    await WhatsAppOrderService.processIncomingMessage('whatsapp:+250788000001', 'ORDER T5 1x Tea', { messageSid: 'SM_NEW' })
    expect(mockPrisma.whatsAppMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          messageSid: 'SM_NEW',
          businessId: 'b1',
          direction: 'INBOUND',
          processed: true,
        }),
      })
    )
    // The unique insert must precede sale.create so a concurrent redelivery
    // loses the race before any order exists.
    const dedupOrder = mockPrisma.whatsAppMessage.create.mock.invocationCallOrder[0]
    const saleOrder = mockPrisma.sale.create.mock.invocationCallOrder[0]
    expect(dedupOrder).toBeLessThan(saleOrder)
  })

  it('treats P2002 unique violation as concurrent duplicate — no second Sale', async () => {
    mockPrisma.whatsAppMessage.create.mockRejectedValue({ code: 'P2002' })
    const r = await WhatsAppOrderService.processIncomingMessage('whatsapp:+250788000001', 'ORDER T5 1x Tea', { messageSid: 'SM_RACE' })
    expect(r.duplicate).toBe(true)
    expect(mockPrisma.sale.create).not.toHaveBeenCalled()
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('releases the dedup record when order creation fails (retry can succeed)', async () => {
    mockPrisma.sale.create.mockRejectedValue(new Error('db down'))
    await expect(
      WhatsAppOrderService.processIncomingMessage('whatsapp:+250788000001', 'ORDER T5 1x Tea', { messageSid: 'SM_FAIL' })
    ).rejects.toThrow('db down')
    expect(mockPrisma.whatsAppMessage.delete).toHaveBeenCalledWith({ where: { messageSid: 'SM_FAIL' } })
  })

  // ── Quantity validation ──────────────────────────────────────────
  it('rejects quantities above the safety bound — no sale created', async () => {
    const r = await WhatsAppOrderService.processIncomingMessage('whatsapp:+250788000001', 'ORDER T5 999x Tea')
    expect(r.success).toBe(false)
    expect(r.reply).toMatch(/invalid quantity/i)
    expect(mockPrisma.sale.create).not.toHaveBeenCalled()
  })

  // ── Kitchen dispatch ──────────────────────────────────────────────
  it('invokes KitchenDispatchService after order creation', async () => {
    await WhatsAppOrderService.processIncomingMessage('whatsapp:+250788000001', 'ORDER T5 2x Tea')
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        saleId: 'sale-1',
        businessId: 'b1',
        orderSource: 'WHATSAPP',
        tableNumber: 'T5',
        items: [{ menuItemName: 'Tea', quantity: 2, unitPriceCents: 500 }],
      })
    )
  })

  it('does not dispatch when order creation is rejected', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null)
    await WhatsAppOrderService.processIncomingMessage('whatsapp:+250788000001', 'ORDER T5 1x Tea')
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('still returns success when dispatch throws (kitchen polls)', async () => {
    mockDispatch.mockRejectedValueOnce(new Error('pusher down'))
    const r = await WhatsAppOrderService.processIncomingMessage('whatsapp:+250788000001', 'ORDER T5 1x Tea')
    expect(r.success).toBe(true)
  })

  // ── Currency confirmation ─────────────────────────────────────────
  it('sale include carries business currency (regression: missing include)', async () => {
    await WhatsAppOrderService.processIncomingMessage('whatsapp:+250788000001', 'ORDER T5 1x Tea')
    const include = mockPrisma.sale.create.mock.calls[0][0].include
    expect(include.business).toEqual({ select: { currency: true } })
    const r = await WhatsAppOrderService.processIncomingMessage('whatsapp:+250788000001', 'ORDER T5 1x Tea')
    // Canonical formatCurrency renders RWF for RWF-denominated totals
    expect(r.reply).toContain('Total')
  })
})

describe('helpers', () => {
  it('normalizePhone handles Rwanda variants', () => {
    expect(normalizePhone('0788123456', 'RW')).toBe('+250788123456')
    expect(normalizePhone('250788123456', 'RW')).toBe('+250788123456')
    expect(normalizePhone('+250788123456')).toBe('+250788123456')
  })

  it('maskPhone hides middle digits', () => {
    expect(maskPhone('whatsapp:+250788123456')).toBe('whatsapp:+250****3456')
    expect(maskPhone('+250788123456')).toBe('+250****3456')
    expect(maskPhone('0788123456')).toBe('****3456')
  })

  it('escapeXml neutralizes all five metacharacters', () => {
    expect(escapeXml(`a & b <c> "d" 'e'`)).toBe('a &amp; b &lt;c&gt; &quot;d&quot; &apos;e&apos;')
  })
})
