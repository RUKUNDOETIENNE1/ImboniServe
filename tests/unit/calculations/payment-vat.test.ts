/**
 * P0 REGRESSION: VAT must not be hardcoded to 0 on payment paths
 *
 * api/payments/intouch/initiate.ts and api/reservations/[id]/deposit/initiate.ts
 * previously wrote `vatAmountCents: 0` regardless of the business's configured
 * taxRate/taxMode. They now use IremboPayService.calculateVATAmounts on the
 * VAT-inclusive gross with business.taxRate.
 */

jest.mock('@/lib/prisma', () => ({
  prisma: {
    business: { findUnique: jest.fn() },
    paymentTransaction: { create: jest.fn(), update: jest.fn() },
    reservation: { findUnique: jest.fn() },
  },
}))

jest.mock('@/lib/services/intouch.service', () => ({
  InTouchService: {
    generateRequestTransactionId: jest.fn(() => 'IMBONI_TEST_1'),
    requestPayment: jest.fn().mockResolvedValue({ responsecode: '1000', transactionid: 'P1' }),
    isSuccess: jest.fn((c: string) => c === '01'),
    isPending: jest.fn((c: string) => c === '1000'),
    getErrorMessage: jest.fn(() => 'err'),
  },
}))

jest.mock('@/lib/services/payment-ledger-events.service', () => ({
  ensurePaymentLedgerEvent: jest.fn().mockResolvedValue({}),
}))

jest.mock('@/lib/api/business-context', () => ({
  resolveBusinessContext: jest.fn(() => Promise.resolve({ userId: 'u1', businessId: 'biz-1', roles: ['OWNER'] })),
}))

jest.mock('@/lib/middleware/withRateLimit', () => ({ withRateLimit: (fn: any) => fn }))
jest.mock('@/lib/middleware/error-handler.middleware', () => ({ withErrorHandler: (fn: any) => fn }))
jest.mock('@/lib/middleware/permission.middleware', () => ({ requirePermission: () => (fn: any) => fn }))
jest.mock('@/lib/middleware/withFeatureCheck', () => ({ requiresFeature: () => (fn: any) => fn }))

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(() => Promise.resolve({ user: { email: 'o@t.com', id: 'u1', businessId: 'biz-1' } })),
}))
jest.mock('@/pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))

const realVat = jest.requireActual('@/lib/services/irembopay.service')

describe('VAT on payment paths', () => {
  const { prisma } = require('@/lib/prisma')

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXTAUTH_URL = 'https://test.local'
    prisma.paymentTransaction.create.mockResolvedValue({ id: 'pay-1' })
    prisma.paymentTransaction.update.mockResolvedValue({})
  })

  function reqRes(body: any = {}, query: any = {}) {
    const req: any = { method: 'POST', headers: {}, cookies: {}, body, query }
    const res: any = {
      statusCode: 200, body: null,
      status(c: number) { res.statusCode = c; return res },
      json(d: any) { res.body = d; return res },
      setHeader() { return res },
    }
    return { req, res }
  }

  it('InTouch initiate records 18% VAT for a configured RW business', async () => {
    prisma.business.findUnique.mockResolvedValue({ currency: 'RWF', taxRate: 18 })
    const handler = require('@/pages/api/payments/intouch/initiate').default
    const { req, res } = reqRes({ amount: 1000, phone: '0780000000', orderId: 'o1' })
    await handler(req, res)

    const data = prisma.paymentTransaction.create.mock.calls[0][0].data
    // gross = 1000*1.05 = 1050 RWF = 105000 cents; VAT-inclusive extraction:
    // vat = round(105000 * 18/118) = 16017
    expect(data.vatAmountCents).toBe(Math.round(105000 * 18 / 118))
    expect(data.exVatAmountCents).toBe(data.paymentAmountCents - data.vatAmountCents)
    expect(data.vatAmountCents).toBeGreaterThan(0)
  })

  it('InTouch initiate records 0 VAT only when business has no configured rate', async () => {
    prisma.business.findUnique.mockResolvedValue({ currency: 'RWF', taxRate: null })
    const handler = require('@/pages/api/payments/intouch/initiate').default
    const { req, res } = reqRes({ amount: 1000, phone: '0780000000', orderId: 'o1' })
    await handler(req, res)
    const data = prisma.paymentTransaction.create.mock.calls[0][0].data
    expect(data.vatAmountCents).toBe(0)
    expect(data.exVatAmountCents).toBe(data.paymentAmountCents)
  })

  it('reservation deposit records VAT from business taxRate', async () => {
    prisma.reservation.findUnique.mockResolvedValue({ id: 'res-1', businessId: 'biz-1', depositCents: 11800 })
    prisma.business.findUnique.mockResolvedValue({ currency: 'RWF', taxRate: 18 })
    const handler = require('@/pages/api/reservations/[id]/deposit/initiate').default
    const { req, res } = reqRes({ phone: '0780000000' }, { id: 'res-1' })
    await handler(req, res)

    const data = prisma.paymentTransaction.create.mock.calls[0][0].data
    // 11800 inclusive at 18%: vat = round(11800*18/118) = 1800
    expect(data.vatAmountCents).toBe(1800)
    expect(data.exVatAmountCents).toBe(10000)
  })
})
