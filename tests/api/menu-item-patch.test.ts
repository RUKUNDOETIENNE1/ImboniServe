/**
 * P0 REGRESSION: Menu item PATCH must not crash on `isSpecial`
 *
 * MenuItem has no `isSpecial` column — the endpoint previously wrote it into
 * the update payload, causing a Prisma "Unknown argument" crash whenever the
 * dashboard "Mark as Special" toggle fired.
 */

const mockPrisma = {
  menuItem: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
}

jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(() =>
    Promise.resolve({ user: { email: 'o@t.com', id: 'u1', businessId: 'biz-1' } })
  ),
}))

jest.mock('@/pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))

jest.mock('@/lib/middleware/withFeatureCheck', () => ({
  requiresFeature: () => (fn: any) => fn,
}))

describe('Menu item PATCH — isSpecial regression', () => {
  let handler: any
  let mockReq: any
  let mockRes: any

  beforeEach(() => {
    jest.clearAllMocks()
    jest.isolateModules(() => {
      handler = require('@/pages/api/menu/[id]').default
    })
    mockReq = { method: 'PATCH', query: { id: 'item-1' }, headers: {}, cookies: {}, body: {} }
    mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(() => mockRes),
      setHeader: jest.fn(() => mockRes),
    }
    mockPrisma.menuItem.findUnique.mockResolvedValue({ id: 'item-1', businessId: 'biz-1' })
    mockPrisma.menuItem.update.mockResolvedValue({ id: 'item-1', name: 'X' })
  })

  it('does not write isSpecial into the Prisma update (no crash)', async () => {
    mockReq.body = { isSpecial: true }
    await handler(mockReq, mockRes)
    // isSpecial-only payload now yields "no valid fields" — must NOT crash
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockPrisma.menuItem.update).not.toHaveBeenCalled()
  })

  it('isSpecial is ignored when sent alongside valid fields', async () => {
    mockReq.body = { name: 'Brochettes', isSpecial: true }
    await handler(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
    const dataArg = mockPrisma.menuItem.update.mock.calls[0][0].data
    expect(dataArg).toEqual({ name: 'Brochettes' })
    expect('isSpecial' in dataArg).toBe(false)
  })

  it('updates valid fields normally', async () => {
    mockReq.body = { name: 'New', priceCents: 500, isAvailable: false }
    await handler(mockReq, mockRes)
    expect(mockPrisma.menuItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { name: 'New', priceCents: 500, isAvailable: false },
      })
    )
  })

  it('enforces tenant isolation', async () => {
    mockPrisma.menuItem.findUnique.mockResolvedValue({ id: 'item-1', businessId: 'biz-OTHER' })
    mockReq.body = { name: 'X' }
    await handler(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(404)
    expect(mockPrisma.menuItem.update).not.toHaveBeenCalled()
  })
})
