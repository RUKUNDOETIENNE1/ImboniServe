/**
 * P0 REGRESSION: QR Ordering Enablement
 *
 * Verifies that the business settings endpoint can enable/disable
 * enableQRInVenue and enableQRRemote — previously only settable via a
 * dev-only bootstrap endpoint, making QR ordering unreachable in production.
 *
 * Covers:
 * - authorized business can enable QR modes
 * - unauthorized/cross-tenant attempts are rejected
 * - invalid values rejected
 * - GET returns the flags so the settings UI can render current state
 */

const mockPrisma = {
  business: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  taxConfiguration: {
    updateMany: jest.fn(() => Promise.resolve({ count: 0 })),
  },
}

jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

const mockSession = {
  user: { email: 'owner@test.com', id: 'user-1', businessId: 'biz-qr-1' },
}
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(() => Promise.resolve(mockSession)),
}))

jest.mock('@/pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))

jest.mock('@/lib/middleware/permission.middleware', () => ({
  requirePermission: () => (fn: any) => fn,
}))

describe('QR Ordering Enablement via Business Settings', () => {
  let handler: any
  let mockReq: any
  let mockRes: any

  beforeEach(() => {
    jest.clearAllMocks()
    jest.isolateModules(() => {
      handler = require('@/pages/api/business/[id]/settings').default
    })
    mockReq = { method: 'PUT', query: { id: 'biz-qr-1' }, headers: {}, cookies: {}, body: {} }
    mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(() => mockRes),
      end: jest.fn(() => mockRes),
      setHeader: jest.fn(() => mockRes),
    }
    mockPrisma.business.update.mockResolvedValue({
      id: 'biz-qr-1',
      enableQRInVenue: true,
      enableQRRemote: false,
    })
  })

  it('enables enableQRInVenue for the session business', async () => {
    mockReq.body = { enableQRInVenue: true }
    await handler(mockReq, mockRes)
    expect(mockPrisma.business.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'biz-qr-1' },
        data: expect.objectContaining({ enableQRInVenue: true }),
      })
    )
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it('enables enableQRRemote for the session business', async () => {
    mockReq.body = { enableQRRemote: true }
    await handler(mockReq, mockRes)
    expect(mockPrisma.business.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ enableQRRemote: true }),
      })
    )
  })

  it('disables a QR mode when explicitly false', async () => {
    mockReq.body = { enableQRInVenue: false }
    await handler(mockReq, mockRes)
    expect(mockPrisma.business.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ enableQRInVenue: false }),
      })
    )
  })

  it('rejects non-boolean enableQRInVenue', async () => {
    mockReq.body = { enableQRInVenue: 'yes' }
    await handler(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockPrisma.business.update).not.toHaveBeenCalled()
  })

  it('rejects non-boolean enableQRRemote', async () => {
    mockReq.body = { enableQRRemote: 1 }
    await handler(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
  })

  it('rejects cross-tenant update (different business id)', async () => {
    mockReq.query = { id: 'biz-OTHER' }
    mockReq.body = { enableQRInVenue: true }
    await handler(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(403)
    expect(mockPrisma.business.update).not.toHaveBeenCalled()
  })

  it('GET returns the QR flags', async () => {
    mockReq.method = 'GET'
    mockPrisma.business.findUnique.mockResolvedValue({
      id: 'biz-qr-1',
      taxMode: 'INCLUSIVE',
      taxRate: 18,
      currency: 'RWF',
      enableQRInVenue: true,
      enableQRRemote: false,
    })
    await handler(mockReq, mockRes)
    expect(mockPrisma.business.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({ enableQRInVenue: true, enableQRRemote: true }),
      })
    )
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it('does not touch QR flags when omitted from the update', async () => {
    mockReq.body = { taxRate: 15 }
    await handler(mockReq, mockRes)
    const dataArg = mockPrisma.business.update.mock.calls[0][0].data
    expect('enableQRInVenue' in dataArg).toBe(false)
    expect('enableQRRemote' in dataArg).toBe(false)
  })
})
