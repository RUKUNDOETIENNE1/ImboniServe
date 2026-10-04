/**
 * P0 REGRESSION: Customer #1 business currency integrity (C1-001)
 *
 * Verifies the BNR-CURRENCY-INTEGRITY-AUDIT remediation:
 * - PUT /api/business/[id]/settings only accepts transaction-enabled
 *   supported currencies (RWF yes, USD/display-only no, arbitrary strings no)
 * - POST /api/currency/default writes User.preferredCurrency only and can
 *   never mutate business.currency
 */

const mockPrisma = {
  business: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  supportedCurrency: {
    findUnique: jest.fn(),
  },
  taxConfiguration: {
    updateMany: jest.fn(() => Promise.resolve({ count: 0 })),
  },
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
}

jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

const mockSession = {
  user: { email: 'owner@test.com', id: 'user-1', businessId: 'biz-c1-1' },
}
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(() => Promise.resolve(mockSession)),
}))

jest.mock('@/pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))

jest.mock('@/lib/middleware/permission.middleware', () => ({
  requirePermission: () => (fn: any) => fn,
}))

const makeRes = () => {
  const res: any = {}
  res.status = jest.fn(() => res)
  res.json = jest.fn(() => res)
  res.end = jest.fn(() => res)
  res.setHeader = jest.fn(() => res)
  return res
}

describe('Business settings currency validation', () => {
  let handler: any
  let mockRes: any

  beforeEach(() => {
    jest.clearAllMocks()
    jest.isolateModules(() => {
      handler = require('@/pages/api/business/[id]/settings').default
    })
    mockRes = makeRes()
    mockPrisma.business.update.mockResolvedValue({ id: 'biz-c1-1' })
  })

  const put = (body: any) =>
    handler(
      { method: 'PUT', query: { id: 'biz-c1-1' }, headers: {}, cookies: {}, body },
      mockRes
    )

  it('TEST 1: accepts transaction-enabled RWF', async () => {
    mockPrisma.supportedCurrency.findUnique.mockResolvedValue({
      isActive: true,
      transactionEnabled: true,
    })
    await put({ currency: 'RWF' })
    expect(mockPrisma.supportedCurrency.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { code: 'RWF' } })
    )
    expect(mockPrisma.business.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ currency: 'RWF' }),
      })
    )
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it('accepts lowercase input normalized to uppercase', async () => {
    mockPrisma.supportedCurrency.findUnique.mockResolvedValue({
      isActive: true,
      transactionEnabled: true,
    })
    await put({ currency: 'rwf' })
    expect(mockPrisma.business.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ currency: 'RWF' }),
      })
    )
  })

  it('TEST 2: rejects display-only non-transaction currencies (USD)', async () => {
    mockPrisma.supportedCurrency.findUnique.mockResolvedValue({
      isActive: true,
      transactionEnabled: false,
    })
    await put({ currency: 'USD' })
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockPrisma.business.update).not.toHaveBeenCalled()
  })

  it('TEST 2: rejects arbitrary unsupported currency strings', async () => {
    mockPrisma.supportedCurrency.findUnique.mockResolvedValue(null)
    await put({ currency: 'FAKE123' })
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockPrisma.business.update).not.toHaveBeenCalled()
  })

  it('TEST 2: rejects inactive supported currencies', async () => {
    mockPrisma.supportedCurrency.findUnique.mockResolvedValue({
      isActive: false,
      transactionEnabled: true,
    })
    await put({ currency: 'RWF' })
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockPrisma.business.update).not.toHaveBeenCalled()
  })

  it('leaves currency untouched when not provided', async () => {
    await put({ taxRate: 8 })
    expect(mockPrisma.supportedCurrency.findUnique).not.toHaveBeenCalled()
    expect(mockPrisma.business.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.not.objectContaining({ currency: expect.anything() }) })
    )
  })
})

describe('/api/currency/default user preference isolation', () => {
  let handler: any
  let mockRes: any

  beforeEach(() => {
    jest.clearAllMocks()
    jest.isolateModules(() => {
      handler = require('@/pages/api/currency/default').default
    })
    mockRes = makeRes()
    mockPrisma.supportedCurrency.findUnique.mockResolvedValue({
      code: 'USD',
      isActive: true,
      displayEnabled: true,
    })
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' })
    mockPrisma.user.update.mockResolvedValue({ id: 'user-1' })
  })

  const post = (body: any) =>
    handler({ method: 'POST', headers: {}, cookies: {}, body }, mockRes)

  it('TEST 3/4/5: writes User.preferredCurrency and never business.currency', async () => {
    await post({ code: 'USD' })
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: { preferredCurrency: 'USD' },
      })
    )
    expect(mockPrisma.business.update).not.toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it('rejects non-display-enabled currencies', async () => {
    mockPrisma.supportedCurrency.findUnique.mockResolvedValue({
      code: 'XYZ',
      isActive: true,
      displayEnabled: false,
    })
    await post({ code: 'XYZ' })
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockPrisma.user.update).not.toHaveBeenCalled()
  })

  it('rejects empty currency code', async () => {
    await post({ code: '' })
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockPrisma.user.update).not.toHaveBeenCalled()
  })
})
