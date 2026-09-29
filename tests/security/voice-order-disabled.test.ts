/**
 * SECURITY TEST: voice-order endpoint is disabled (WhatsApp Foundation Phase 1)
 *
 * The endpoint was an unauthenticated order-creation surface with SSRF
 * (MediaUrl0 fetched with Twilio Basic-auth credentials). It must now:
 * - never create orders
 * - never fetch attacker-controlled URLs
 * - never call OpenAI
 * - return a controlled empty TwiML response
 */

jest.mock('@/lib/prisma', () => ({
  prisma: { sale: { create: jest.fn() }, customer: { findFirst: jest.fn() } },
}))
jest.mock('@/lib/logger', () => ({
  logger: { warn: jest.fn(), info: jest.fn(), error: jest.fn(), child: () => ({ warn: jest.fn(), info: jest.fn(), error: jest.fn() }) },
}))

import handler from '@/pages/api/webhooks/twilio/voice-order'

function res() {
  const r: any = {
    statusCode: 200, body: null, headers: {} as Record<string, string>,
    status(c: number) { r.statusCode = c; return r },
    json(d: any) { r.body = d; return r },
    send(d: any) { r.body = d; return r },
    setHeader(k: string, v: string) { r.headers[k] = v; return r },
  }
  return r
}

describe('voice-order endpoint (disabled)', () => {
  const fetchSpy = jest.spyOn(global, 'fetch')

  beforeEach(() => jest.clearAllMocks())

  it('returns controlled empty TwiML for a media message (no fetch, no order)', async () => {
    const { prisma } = require('@/lib/prisma')
    const r = res()
    await handler(
      { method: 'POST', body: { From: 'whatsapp:+250788000001', MediaUrl0: 'https://evil.example/x.ogg' } } as any,
      r
    )
    expect(r.statusCode).toBe(200)
    expect(r.headers['Content-Type']).toBe('text/xml')
    expect(String(r.body)).toContain('<Response/>')
    expect(prisma.sale.create).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('returns controlled response for a text body (no order)', async () => {
    const { prisma } = require('@/lib/prisma')
    const r = res()
    await handler(
      { method: 'POST', body: { From: 'whatsapp:+250788000001', Body: 'ORDER T1 5x Chicken' } } as any,
      r
    )
    expect(r.statusCode).toBe(200)
    expect(prisma.sale.create).not.toHaveBeenCalled()
  })

  it('rejects non-POST methods', async () => {
    const r = res()
    await handler({ method: 'GET', body: {} } as any, r)
    expect(r.statusCode).toBe(405)
  })
})
