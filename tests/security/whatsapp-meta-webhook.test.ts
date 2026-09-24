/**
 * SECURITY TESTS: Meta WhatsApp Cloud webhook — fail-closed signature validation
 *
 * api/webhooks/whatsapp.ts must reject POSTs when:
 * - WHATSAPP_APP_SECRET is not configured (503)
 * - x-hub-signature-256 is missing (401)
 * - signature does not match (401)
 * and accept valid signatures (200). GET hub challenge must still work.
 */

import crypto from 'crypto'

jest.mock('@/lib/prisma', () => ({ prisma: {} }))
jest.mock('@/lib/logger', () => ({
  logger: Object.assign(
    { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    { child: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }) }
  ),
}))

import handler from '@/pages/api/webhooks/whatsapp'

const SECRET = 'meta-app-secret'

function makeReq(method: string, body: string, headers: Record<string, string> = {}, query: any = {}) {
  return {
    method,
    headers,
    query,
    socket: { remoteAddress: '10.0.0.2' },
    on(event: string, cb: (d?: any) => void) {
      if (event === 'data') cb(body)
      if (event === 'end') cb()
      return this
    },
  } as any
}

function makeRes() {
  const r: any = {
    statusCode: 200, body: null, ended: false,
    status(c: number) { r.statusCode = c; return r },
    json(d: any) { r.body = d; return r },
    send(d: any) { r.body = d; return r },
    end(d?: any) { r.ended = true; if (d !== undefined) r.body = d; return r },
    setHeader() { return r },
  }
  return r
}

function sig(body: string) {
  return `sha256=${crypto.createHmac('sha256', SECRET).update(body).digest('hex')}`
}

const VALID_BODY = JSON.stringify({ entry: [{ changes: [{ value: { messages: [{ from: '+250788000001', type: 'text', id: 'wamid.1' }] } }] }] })

describe('Meta WhatsApp webhook — fail closed', () => {
  beforeEach(() => {
    process.env.WHATSAPP_APP_SECRET = SECRET
    process.env.WHATSAPP_VERIFY_TOKEN = 'verify-me'
  })
  afterEach(() => {
    delete process.env.WHATSAPP_APP_SECRET
    delete process.env.WHATSAPP_VERIFY_TOKEN
  })

  it('GET hub challenge succeeds with correct verify token', async () => {
    const res = makeRes()
    await handler(makeReq('GET', '', {}, { 'hub.mode': 'subscribe', 'hub.verify_token': 'verify-me', 'hub.challenge': 'CH123' }), res)
    expect(res.statusCode).toBe(200)
    expect(res.body).toBe('CH123')
  })

  it('GET hub challenge rejects wrong token', async () => {
    const res = makeRes()
    await handler(makeReq('GET', '', {}, { 'hub.mode': 'subscribe', 'hub.verify_token': 'wrong', 'hub.challenge': 'CH123' }), res)
    expect(res.statusCode).toBe(403)
  })

  it('POST rejects with 503 when WHATSAPP_APP_SECRET is not configured', async () => {
    delete process.env.WHATSAPP_APP_SECRET
    const res = makeRes()
    await handler(makeReq('POST', VALID_BODY, { 'x-hub-signature-256': sig(VALID_BODY) }), res)
    expect(res.statusCode).toBe(503)
  })

  it('POST rejects with 401 when signature header is missing', async () => {
    const res = makeRes()
    await handler(makeReq('POST', VALID_BODY), res)
    expect(res.statusCode).toBe(401)
  })

  it('POST rejects with 401 when signature is invalid', async () => {
    const res = makeRes()
    await handler(makeReq('POST', VALID_BODY, { 'x-hub-signature-256': 'sha256=deadbeef' }), res)
    expect(res.statusCode).toBe(401)
  })

  it('POST accepts a valid signature (log-only processing)', async () => {
    const res = makeRes()
    await handler(makeReq('POST', VALID_BODY, { 'x-hub-signature-256': sig(VALID_BODY) }), res)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })
})
