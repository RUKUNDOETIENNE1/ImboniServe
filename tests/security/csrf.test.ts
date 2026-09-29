import { withCsrf } from '@/lib/middleware/csrf'
import type { NextApiRequest, NextApiResponse } from 'next'

// Mock environment variables
const originalEnv = { ...process.env }

function createMockReq(
  method: string,
  headers: Record<string, string | string[]> = {},
  body: any = {}
): NextApiRequest {
  return {
    method,
    headers,
    body,
    socket: { remoteAddress: '127.0.0.1' },
  } as any
}

function createMockRes(): NextApiResponse & { statusCode: number; body: any } {
  const res: any = {
    statusCode: 200,
    body: null,
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(data: any) {
      this.body = data
      return this
    },
    setHeader() {
      return this
    },
  }
  return res
}

describe('CSRF Middleware', () => {
  beforeEach(() => {
    process.env = { ...originalEnv }
    process.env.NEXTAUTH_URL = 'https://app.imboniserve.com'
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('allows GET requests without origin check', async () => {
    const handler = jest.fn(async (req, res) => res.status(200).json({ ok: true }))
    const wrapped = withCsrf(handler)

    const req = createMockReq('GET', {})
    const res = createMockRes()

    await wrapped(req, res)

    expect(handler).toHaveBeenCalled()
    expect(res.statusCode).toBe(200)
  })

  it('allows POST requests with matching Origin header', async () => {
    const handler = jest.fn(async (req, res) => res.status(200).json({ ok: true }))
    const wrapped = withCsrf(handler)

    const req = createMockReq('POST', {
      origin: 'https://app.imboniserve.com',
    })
    const res = createMockRes()

    await wrapped(req, res)

    expect(handler).toHaveBeenCalled()
    expect(res.statusCode).toBe(200)
  })

  it('blocks POST requests with mismatched Origin header', async () => {
    const handler = jest.fn(async (req, res) => res.status(200).json({ ok: true }))
    const wrapped = withCsrf(handler)

    const req = createMockReq('POST', {
      origin: 'https://evil.com',
    })
    const res = createMockRes()

    await wrapped(req, res)

    expect(handler.mock.calls.length).toBe(0)
    expect(res.statusCode).toBe(403)
    expect(res.body.code).toBe('CSRF_VALIDATION_FAILED')
  })

  it('blocks POST requests with no Origin or Referer header', async () => {
    const handler = jest.fn(async (req, res) => res.status(200).json({ ok: true }))
    const wrapped = withCsrf(handler)

    const req = createMockReq('POST', {})
    const res = createMockRes()

    await wrapped(req, res)

    expect(handler.mock.calls.length).toBe(0)
    expect(res.statusCode).toBe(403)
  })

  it('allows POST requests with matching Referer header when Origin is missing', async () => {
    const handler = jest.fn(async (req, res) => res.status(200).json({ ok: true }))
    const wrapped = withCsrf(handler)

    const req = createMockReq('POST', {
      referer: 'https://app.imboniserve.com/dashboard',
    })
    const res = createMockRes()

    await wrapped(req, res)

    expect(handler).toHaveBeenCalled()
    expect(res.statusCode).toBe(200)
  })

  it('blocks POST requests with mismatched Referer header', async () => {
    const handler = jest.fn(async (req, res) => res.status(200).json({ ok: true }))
    const wrapped = withCsrf(handler)

    const req = createMockReq('POST', {
      referer: 'https://evil.com/attack',
    })
    const res = createMockRes()

    await wrapped(req, res)

    expect(handler.mock.calls.length).toBe(0)
    expect(res.statusCode).toBe(403)
  })

  it('allows DELETE requests with matching Origin', async () => {
    const handler = jest.fn(async (req, res) => res.status(200).json({ ok: true }))
    const wrapped = withCsrf(handler)

    const req = createMockReq('DELETE', {
      origin: 'https://app.imboniserve.com',
    })
    const res = createMockRes()

    await wrapped(req, res)

    expect(handler).toHaveBeenCalled()
    expect(res.statusCode).toBe(200)
  })

  it('allows PUT requests with matching Origin', async () => {
    const handler = jest.fn(async (req, res) => res.status(200).json({ ok: true }))
    const wrapped = withCsrf(handler)

    const req = createMockReq('PUT', {
      origin: 'https://app.imboniserve.com',
    })
    const res = createMockRes()

    await wrapped(req, res)

    expect(handler).toHaveBeenCalled()
    expect(res.statusCode).toBe(200)
  })

  it('allows PATCH requests with matching Origin', async () => {
    const handler = jest.fn(async (req, res) => res.status(200).json({ ok: true }))
    const wrapped = withCsrf(handler)

    const req = createMockReq('PATCH', {
      origin: 'https://app.imboniserve.com',
    })
    const res = createMockRes()

    await wrapped(req, res)

    expect(handler).toHaveBeenCalled()
    expect(res.statusCode).toBe(200)
  })

  it('normalizes trailing slash in origin comparison', async () => {
    const handler = jest.fn(async (req, res) => res.status(200).json({ ok: true }))
    const wrapped = withCsrf(handler)

    const req = createMockReq('POST', {
      origin: 'https://app.imboniserve.com/',
    })
    const res = createMockRes()

    await wrapped(req, res)

    expect(handler).toHaveBeenCalled()
    expect(res.statusCode).toBe(200)
  })

  it('is case-insensitive for origin comparison', async () => {
    const handler = jest.fn(async (req, res) => res.status(200).json({ ok: true }))
    const wrapped = withCsrf(handler)

    const req = createMockReq('POST', {
      origin: 'HTTPS://APP.IMBONISERVE.COM',
    })
    const res = createMockRes()

    await wrapped(req, res)

    expect(handler).toHaveBeenCalled()
    expect(res.statusCode).toBe(200)
  })
})
