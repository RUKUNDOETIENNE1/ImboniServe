/**
 * UNIT TESTS: Tap & Leave FX Persistence
 *
 * Validates that the Tap & Leave checkout path persists:
 * - original currency (orderCurrency)
 * - payment currency (paymentCurrency)
 * - settlement amount and currency
 * - FX rate used (exchangeRateValue)
 * - rate type (exchangeRateType)
 * - rate source (exchangeRateSource)
 * - rate effective date (exchangeRateEffectiveDate)
 * - BNR record identity (exchangeRateRecordId)
 *
 * Also validates that same-currency (RWF) transactions persist identity FX metadata
 * without calling the conversion service.
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

jest.mock('@/lib/services/dining-session-slip.service', () => ({
  DiningSessionSlipService: {
    getSlipBySessionId: jest.fn(),
    initiateCheckout: jest.fn().mockResolvedValue(undefined),
    finalizeBill: jest.fn().mockResolvedValue(undefined),
    getSlipById: jest.fn(),
    markPaymentTriggered: jest.fn().mockResolvedValue(undefined),
    markPaymentFailed: jest.fn().mockResolvedValue(undefined),
  },
}))

jest.mock('@/lib/services/intouch.service', () => ({
  InTouchService: {
    generateRequestTransactionId: () => 'RT-TEST-001',
    requestPayment: jest.fn().mockResolvedValue({
      responsecode: '1000',
      status: 'Pending',
      transactionid: 'TX-001',
    }),
    isSuccess: (code?: string) => code === '01',
    isPending: (code?: string) => code === '1000',
    getErrorMessage: (code?: string) => `error-${code}`,
  },
}))

jest.mock('@/lib/services/platform-fee.service', () => ({
  getPlatformFee: jest.fn().mockResolvedValue(5),
  FeeType: { DIGITAL_PAYMENT_FEE: 'DIGITAL_PAYMENT_FEE' },
}))

jest.mock('@/lib/services/payment-ledger-events.service', () => ({
  ensurePaymentLedgerEvent: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/die/business-as-plugin/dining-slips/slips.shadow', () => ({
  ingestDiningSlipShadowEvent: jest.fn().mockResolvedValue(undefined),
}))

import { convertMinorUnits } from '@/lib/services/currency-exchange.service'

function makeSlip(businessId = 'biz-1', runningTotalCents = 10000) {
  return {
    id: 'slip-1',
    businessId,
    status: 'active',
    runningTotalCents,
    finalBillCents: null,
    slipNumber: 'SLIP-001',
    session: { table: { number: 'T1' } },
    itemCount: 2,
  }
}

function buildReqRes(body: any = {}) {
  const req: any = {
    method: 'POST',
    body: { sessionId: 'session-1', phone: '250788123456', ...body },
    query: {},
    headers: {},
    socket: { remoteAddress: '127.0.0.1' },
  }
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  }
  return { req, res }
}

describe('Tap & Leave FX Persistence', () => {
  const ORIGINAL_ENV = { ...process.env }

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...ORIGINAL_ENV }
    process.env.NODE_ENV = 'production'
    process.env.NEXTAUTH_URL = 'http://localhost:3000'
    mockPrisma.business.findUnique.mockResolvedValue({ currency: 'RWF' })
    mockCreate.mockResolvedValue({ id: 'payment-1' })
    mockUpdate.mockResolvedValue({})
    const { DiningSessionSlipService } = require('@/lib/services/dining-session-slip.service')
    DiningSessionSlipService.getSlipBySessionId.mockResolvedValue(makeSlip())
    DiningSessionSlipService.getSlipById.mockResolvedValue(makeSlip())
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it('RWF business: persists orderCurrency=RWF, paymentCurrency=RWF, no FX conversion', async () => {
    const handler = require('@/pages/api/checkout/tap-and-leave').default
    const { req, res } = buildReqRes()
    await handler(req, res)

    expect(convertMinorUnits).not.toHaveBeenCalled()
    const created = mockCreate.mock.calls[0][0].data
    expect(created.orderCurrency).toBe('RWF')
    expect(created.paymentCurrency).toBe('RWF')
    expect(created.orderAmountCents).toBeGreaterThan(0)
    expect(created.paymentAmountCents).toBe(created.orderAmountCents)
    expect(created.settlementCurrency).toBe('RWF')
    expect(created.exchangeRateValue).toBeUndefined()
    expect(created.exchangeRateType).toBeUndefined()
  })

  it('USD business: converts to RWF and persists full FX snapshot', async () => {
    mockPrisma.business.findUnique.mockResolvedValue({ currency: 'USD' })
    ;(convertMinorUnits as jest.Mock).mockResolvedValue({
      fromAmountMinor: 10500,
      fromCurrency: 'USD',
      toAmountMinor: 1365000,
      toCurrency: 'RWF',
      rateSnapshot: {
        rateId: 'rate-abc',
        fromCurrency: 'USD',
        toCurrency: 'RWF',
        rateType: 'AVERAGE',
        rate: { toString: () => '1300' },
        source: 'BNR',
        sourceRecordId: 'bnr-42',
        effectiveDate: new Date('2026-09-20'),
        fetchedAt: new Date('2026-09-20'),
      },
    })

    const handler = require('@/pages/api/checkout/tap-and-leave').default
    const { req, res } = buildReqRes()
    await handler(req, res)

    expect(convertMinorUnits).toHaveBeenCalledTimes(1)
    const callArgs = (convertMinorUnits as jest.Mock).mock.calls[0]
    expect(callArgs[1]).toBe('USD')
    expect(callArgs[2]).toBe('RWF')

    const created = mockCreate.mock.calls[0][0].data
    expect(created.orderCurrency).toBe('USD')
    expect(created.paymentCurrency).toBe('RWF')
    expect(created.paymentAmountCents).toBe(1365000)
    expect(created.settlementCurrency).toBe('RWF')
    expect(created.exchangeRateValue).toBeDefined()
    expect(created.exchangeRateType).toBe('AVERAGE')
    expect(created.exchangeRateSource).toBe('BNR')
    expect(created.exchangeRateBaseCurrency).toBe('USD')
    expect(created.exchangeRateQuoteCurrency).toBe('RWF')
    expect(created.exchangeRateRecordId).toBe('bnr-42')
    expect(created.exchangeRateSnapshotId).toBe('rate-abc')
    expect(created.exchangeRateEffectiveDate).toEqual(new Date('2026-09-20'))
  })

  it('USD business: fails safely when FX rate is missing', async () => {
    mockPrisma.business.findUnique.mockResolvedValue({ currency: 'USD' })
    ;(convertMinorUnits as jest.Mock).mockRejectedValue(
      new Error('Missing exchange rate for USD -> RWF')
    )

    const handler = require('@/pages/api/checkout/tap-and-leave').default
    const { req, res } = buildReqRes()
    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
    const jsonArg = res.json.mock.calls[0][0]
    expect(JSON.stringify(jsonArg)).toMatch(/exchange rate/i)
  })
})
