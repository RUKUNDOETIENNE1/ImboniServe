import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// Mocks
jest.mock('next-auth/next', () => ({ getServerSession: jest.fn() }))
jest.mock('@/pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))

// Prisma mock (shared across imports)
const prismaMock: any = {
  seat: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  table: {
    findFirst: jest.fn(),
  },
  userStaffRole: {
    findMany: jest.fn(() => Promise.resolve([])),
  },
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  business: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  securityEvent: {
    create: jest.fn(),
  },
}
jest.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

// Service mocks
const generateURL = jest.fn(() => 'qr://mock')
jest.mock('@/lib/services/qr-generator.service', () => ({
  QRGeneratorService: { generateURL },
}))

jest.mock('@/lib/services/seat-detection.service', () => ({
  updateSeatLabel: jest.fn(() => Promise.resolve(undefined)),
  activateSeat: jest.fn(() => Promise.resolve(undefined)),
  deactivateSeat: jest.fn(() => Promise.resolve(undefined)),
  getTableSeats: jest.fn(() => Promise.resolve([{ id: 's1' }, { id: 's2' }])),
}))

// Import handlers under test AFTER mocks
import seatsQrHandler from '@/pages/api/seats/[id]/qr'
import tableSeatsIndexHandler from '@/pages/api/tables/[id]/seats/index'

// Helpers
import { getServerSession } from 'next-auth/next'

function mockSession({ roles, businessId, userId = 'user-1' }: { roles: string[]; businessId?: string; userId?: string }) {
  ;(getServerSession as any).mockResolvedValue({
    user: { id: userId, email: 'u@example.com', roles, businessId: businessId ?? null },
  })
}

function createReqRes({ method, query = {}, body }: { method: string; query?: any; body?: any }) {
  const req: any = { method, query, body, headers: {}, socket: { remoteAddress: '127.0.0.1' }, url: '/api/test' }
  let statusCode = 200
  let jsonBody: any = undefined
  const res: any = {
    status: (code: number) => {
      statusCode = code
      return res
    },
    json: (obj: any) => {
      jsonBody = obj
      return res
    },
    end: () => res,
    get statusCode() {
      return statusCode
    },
    get body() {
      return jsonBody
    },
    setHeader: jest.fn(),
  }
  return { req, res }
}

describe('Seats & Table-Seats API (RBAC smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('GET /api/tables/[id]/seats (tables.read): CASHIER allowed (200)', async () => {
    mockSession({ roles: ['CASHIER'], businessId: 'biz-1' })
    prismaMock.table.findFirst.mockResolvedValue({ id: 't1', businessId: 'biz-1' } as any)

    const { req, res } = createReqRes({ method: 'GET', query: { id: 't1' } })
    await tableSeatsIndexHandler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual(expect.arrayContaining([{ id: 's1' }]))
  })

  it('POST /api/seats/[id]/qr (tables.update): CASHIER forbidden (403)', async () => {
    mockSession({ roles: ['CASHIER'], businessId: 'biz-1' })

    const { req, res } = createReqRes({ method: 'POST', query: { id: 'seat-1' } })
    await seatsQrHandler(req, res)

    expect(res.statusCode).toBe(403)
    expect(res.body).toEqual(expect.objectContaining({ error: expect.any(String) }))
  })

  it('POST /api/seats/[id]/qr (tables.update): WAITER allowed and generates QR (200)', async () => {
    mockSession({ roles: ['WAITER'], businessId: 'biz-1' })
    prismaMock.seat.findUnique.mockResolvedValue({ id: 'seat-1', qrCode: null, table: { id: 't1', businessId: 'biz-1' } } as any)
    prismaMock.seat.update.mockResolvedValue({} as any)

    const { req, res } = createReqRes({ method: 'POST', query: { id: 'seat-1' } })
    await seatsQrHandler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual(expect.objectContaining({ success: true, qrCode: 'qr://mock' }))
    expect(generateURL).toHaveBeenCalledWith(expect.objectContaining({ branchId: 'biz-1', tableId: 't1', seatId: 'seat-1' }))
    expect(prismaMock.seat.update).toHaveBeenCalled()
  })

  it('POST /api/seats/[id]/qr: 404 when seat belongs to another business', async () => {
    mockSession({ roles: ['WAITER'], businessId: 'biz-1' })
    prismaMock.seat.findUnique.mockResolvedValue({ id: 'seat-1', qrCode: null, table: { id: 't1', businessId: 'biz-2' } } as any)

    const { req, res } = createReqRes({ method: 'POST', query: { id: 'seat-1' } })
    await seatsQrHandler(req, res)

    expect(res.statusCode).toBe(404)
  })
})
