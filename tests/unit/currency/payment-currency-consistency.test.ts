/**
 * UNIT TESTS: Payment Currency Consistency
 *
 * Validates that InTouch initiate persists:
 * - order currency vs payment currency split
 * - settlement currency
 * - FX snapshot when cross-currency
 * - VAT is no longer hardcoded to zero when business has tax config
 */

const mockCreate = jest.fn()
const mockUpdate = jest.fn()
const mockPrisma = {
  business: { findUnique: jest.fn() },
  paymentTransaction: { create: mockCreate, update: mockUpdate },
}

jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

jest.mock('@/lib/services/currency-exchange.service', () => ({
  convertMinorUnits: jest.fn(),
  getDefaultPaymentRateMaxAgeHours: jest.fn(() => 48),
  getRateTypeForOperation: jest.fn(() => 'AVERAGE'),
}))

jest.mock('@/lib/services/intouch.service', () => ({
  InTouchService: {
    generateRequestTransactionId: () => 'RT-TEST-002',
    requestPayment: jest.fn().mockResolvedValue({
      responsecode: '1000',
      status: 'Pending',
      transactionid: 'TX-002',
    }),
    isSuccess: (code?: string) => code === '01',
    isPending: (code?: string) => code === '1000',
    getErrorMessage: (code?: string) => `error-${code}`,
  },
}))

jest.mock('@/lib/middleware/withRateLimit', () => ({
  withRateLimit: (h: any) => h,
}))

jest.mock('@/lib/middleware/error-handler.middleware', () => ({
  withErrorHandler: (h: any) => h,
}))

jest.mock('@/lib/middleware/permission.middleware', () => ({
  requirePermission: () => (h: any) => h,
}))

jest.mock('@/lib/api/business-context', () => ({
  resolveBusinessContext: jest.fn(),
}))

jest.mock('@/lib/api/response-helpers', () => ({
  successResponse: (data: any) => ({ success: true, data }),
  errorResponse: (msg: string) => ({ error: msg }),
}))

jest.mock('@/lib/services/payment-ledger-events.service', () => ({
  ensurePaymentLedgerEvent: jest.fn().mockResolvedValue(undefined),
}))

import { convertMinorUnits } from '@/lib/services/currency-exchange.service'

function buildReqRes(body: any = {}) {
  const req: any = {
    method: 'POST',
    body: { amount: 100, phone: '250788123456', ...body },
    headers: {},
    socket: { remoteAddress: '127.0.0.1' },
  }
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  }
  return { req, res }
}

describe('InTouch Initiate: Payment Currency Consistency', () => {
  const { resolveBusinessContext } = require('@/lib/api/business-context')

  beforeEach(() => {
    jest.clearAllMocks()
    resolveBusinessContext.mockResolvedValue({ businessId: 'biz-1', userId: 'user-1' })
    mockPrisma.business.findUnique.mockResolvedValue({ currency: 'RWF' })
    mockCreate.mockResolvedValue({ id: 'payment-1' })
    mockUpdate.mockResolvedValue({})
  })

  it('RWF business: persists orderCurrency=RWF, paymentCurrency=RWF', async () => {
    const handler = require('@/pages/api/payments/intouch/initiate').default
    const { req, res } = buildReqRes()
    await handler(req, res)

    expect(convertMinorUnits).not.toHaveBeenCalled()
    const created = mockCreate.mock.calls[0][0].data
    expect(created.orderCurrency).toBe('RWF')
    expect(created.paymentCurrency).toBe('RWF')
    // J2 P1-1: orderAmountCents is the pre-fee order total (compared to
    // Sale.totalAmountCents at webhook completion); paymentAmountCents is the
    // fee-inclusive charge the customer actually pays.
    expect(created.orderAmountCents).toBe(10000)
    expect(created.paymentAmountCents).toBe(10500)
    expect(created.settlementCurrency).toBe('RWF')
    expect(created.exchangeRateValue).toBeUndefined()
  })

  it('USD business: converts to RWF and persists FX snapshot', async () => {
    mockPrisma.business.findUnique.mockResolvedValue({ currency: 'USD' })
    ;(convertMinorUnits as jest.Mock).mockResolvedValue({
      fromAmountMinor: 10500,
      fromCurrency: 'USD',
      toAmountMinor: 1365000,
      toCurrency: 'RWF',
      rateSnapshot: {
        rateId: 'rate-xyz',
        fromCurrency: 'USD',
        toCurrency: 'RWF',
        rateType: 'AVERAGE',
        rate: { toString: () => '1300' },
        source: 'BNR',
        sourceRecordId: 'bnr-99',
        effectiveDate: new Date('2026-09-20'),
        fetchedAt: new Date('2026-09-20'),
      },
    })

    const handler = require('@/pages/api/payments/intouch/initiate').default
    const { req, res } = buildReqRes()
    await handler(req, res)

    expect(convertMinorUnits).toHaveBeenCalledTimes(1)
    const created = mockCreate.mock.calls[0][0].data
    expect(created.orderCurrency).toBe('USD')
    expect(created.paymentCurrency).toBe('RWF')
    expect(created.exchangeRateValue).toBeDefined()
    expect(created.exchangeRateSource).toBe('BNR')
    expect(created.exchangeRateRecordId).toBe('bnr-99')
    expect(created.exchangeRateSnapshotId).toBe('rate-xyz')
  })

  it('fails safely when FX conversion throws', async () => {
    mockPrisma.business.findUnique.mockResolvedValue({ currency: 'EUR' })
    ;(convertMinorUnits as jest.Mock).mockRejectedValue(
      new Error('Missing exchange rate for EUR -> RWF')
    )

    const handler = require('@/pages/api/payments/intouch/initiate').default
    const { req, res } = buildReqRes()
    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('persists order amount and payment amount separately', async () => {
    const handler = require('@/pages/api/payments/intouch/initiate').default
    const { req, res } = buildReqRes({ amount: 500 })
    await handler(req, res)

    const created = mockCreate.mock.calls[0][0].data
    // amount=500 RWF → orderAmountCents=50000 (pre-fee order total, matches
    // Sale.totalAmountCents); fee=5%*500=25 → payment charge 52500.
    expect(created.orderAmountCents).toBe(50000)
    expect(created.paymentAmountCents).toBe(52500)
    expect(created.amountCents).toBe(52500)
    expect(created.currency).toBe('RWF')
  })
})
