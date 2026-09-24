/**
 * SECURITY TESTS: Twilio WhatsApp webhook — fail-closed signature validation
 *
 * api/webhooks/twilio/whatsapp.ts must reject when:
 * - TWILIO_AUTH_TOKEN is not configured (503)
 * - x-twilio-signature header is absent (403)
 * - the signature fails twilio.validateRequest (403)
 * and accept only fully-validated requests.
 */

const mockValidateRequest = jest.fn()
jest.mock('twilio', () => {
  const fn: any = jest.fn(() => ({}))
  fn.validateRequest = mockValidateRequest
  return fn
})

jest.mock('@/lib/prisma', () => ({
  prisma: {
    whatsAppMessage: { findFirst: jest.fn(), create: jest.fn() },
    user: { findFirst: jest.fn() },
    table: { findFirst: jest.fn() },
    menuItem: { findFirst: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
    sale: { create: jest.fn(), findUnique: jest.fn() },
  },
}))

jest.mock('@/lib/logger', () => ({
  logger: { child: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }) },
}))

jest.mock('@/lib/services/kitchen-dispatch.service', () => ({
  KitchenDispatchService: { dispatchToKitchen: jest.fn().mockResolvedValue({}) },
}))

import handler from '@/pages/api/webhooks/twilio/whatsapp'

function makeReq(body: string, headers: Record<string, string> = {}) {
  const listeners: Record<string, (d?: any) => void> = {}
  return {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers },
    socket: { remoteAddress: '10.0.0.1' },
    on(event: string, cb: (d?: any) => void) {
      listeners[event] = cb
      if (event === 'data') cb(body)
      if (event === 'end') cb()
      return this
    },
  } as any
}

function makeRes() {
  const r: any = {
    statusCode: 200, body: null, headers: {} as Record<string, string>,
    status(c: number) { r.statusCode = c; return r },
    json(d: any) { r.body = d; return r },
    send(d: any) { r.body = d; return r },
    setHeader(k: string, v: string) { r.headers[k] = v; return r },
  }
  return r
}

const AUTH = 'test-auth-token'

describe('Twilio WhatsApp webhook — fail closed', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.TWILIO_AUTH_TOKEN = AUTH
    process.env.NEXTAUTH_URL = 'https://app.test'
  })

  afterEach(() => {
    delete process.env.TWILIO_AUTH_TOKEN
  })

  it('rejects with 503 when TWILIO_AUTH_TOKEN is not configured', async () => {
    delete process.env.TWILIO_AUTH_TOKEN
    const res = makeRes()
    await handler(makeReq('From=whatsapp%3A%2B250788000001&Body=ORDER+T1+1x+Tea&MessageSid=SM1', { 'x-twilio-signature': 'sig' }), res)
    expect(res.statusCode).toBe(503)
    expect(mockValidateRequest).not.toHaveBeenCalled()
  })

  it('rejects with 403 when signature header is missing', async () => {
    const res = makeRes()
    await handler(makeReq('From=whatsapp%3A%2B250788000001&Body=ORDER+T1+1x+Tea'), res)
    expect(res.statusCode).toBe(403)
    expect(mockValidateRequest).not.toHaveBeenCalled()
  })

  it('rejects with 403 when signature is invalid', async () => {
    mockValidateRequest.mockReturnValue(false)
    const res = makeRes()
    await handler(makeReq('From=whatsapp%3A%2B250788000001&Body=ORDER+T1+1x+Tea', { 'x-twilio-signature': 'bad' }), res)
    expect(res.statusCode).toBe(403)
    expect(mockValidateRequest).toHaveBeenCalledWith(AUTH, 'bad', 'https://app.test/api/webhooks/twilio/whatsapp', expect.any(Object))
  })

  it('processes a request with a valid signature and returns escaped TwiML', async () => {
    mockValidateRequest.mockReturnValue(true)
    const { prisma } = require('@/lib/prisma')
    prisma.whatsAppMessage.findFirst.mockResolvedValue(null)
    prisma.user.findFirst.mockResolvedValue({ id: 'u1', businessId: 'b1', business: { id: 'b1' } })
    prisma.table.findFirst.mockResolvedValue({ id: 't1', number: 'T1' })
    prisma.menuItem.findFirst.mockResolvedValue({ id: 'm1', name: 'Tea & Biscuits', priceCents: 500 })
    prisma.sale.create.mockResolvedValue({
      id: 's1', businessId: 'b1', orderNumber: 'ORD-1', orderSource: 'WHATSAPP',
      tableId: 't1', totalAmountCents: 500,
      table: { number: 'T1' },
      business: { currency: 'RWF' },
      items: [{ menuItem: { name: 'Tea & Biscuits' }, quantity: 1, unitPriceCents: 500 }],
    })
    prisma.whatsAppMessage.create.mockResolvedValue({})

    const res = makeRes()
    await handler(
      makeReq('From=whatsapp%3A%2B250788000001&Body=ORDER+T1+1x+Tea+%26+Biscuits&MessageSid=SM_OK', { 'x-twilio-signature': 'good' }),
      res
    )
    expect(res.statusCode).toBe(200)
    expect(res.headers['Content-Type']).toBe('text/xml')
    // TwiML must escape the ampersand from the item name
    expect(String(res.body)).toContain('&amp;')
    expect(String(res.body)).not.toContain('Tea & Biscuits')
  })

  it('spoofed staff number yields Unauthorized reply, not an order', async () => {
    mockValidateRequest.mockReturnValue(true)
    const { prisma } = require('@/lib/prisma')
    prisma.whatsAppMessage.findFirst.mockResolvedValue(null)
    prisma.user.findFirst.mockResolvedValue(null) // no staff match

    const res = makeRes()
    await handler(makeReq('From=whatsapp%3A%2B1999999999&Body=ORDER+T1+1x+Tea', { 'x-twilio-signature': 'good' }), res)
    expect(res.statusCode).toBe(200)
    expect(String(res.body)).toContain('Unauthorized')
    expect(prisma.sale.create).not.toHaveBeenCalled()
  })
})
