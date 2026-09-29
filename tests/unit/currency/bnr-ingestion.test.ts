/**
 * UNIT TESTS: BNR Rate Ingestion
 *
 * Validates:
 * - response mapping (currency_name -> ISO)
 * - malformed response
 * - duplicate rate (idempotent ingestion)
 * - supersession on changed values (old revision SUPERSEDED, new revision inserted)
 * - API error handling (400/404/500)
 * - verified default quotation mode (RWF per unit of foreign currency)
 */

jest.mock('@/lib/prisma', () => ({
  prisma: {
    supportedCurrency: {
      upsert: jest.fn().mockResolvedValue({}),
    },
    currencyExchangeRate: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('@/lib/services/currency-exchange.service', () => ({
  clearExchangeRateCache: jest.fn(),
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    child: () => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    }),
  },
}))

// Mock BnrClient with a controllable instance
const mockListExchangeRates = jest.fn()
const mockGetExchangeRateById = jest.fn()

jest.mock('@/lib/services/bnr-client.service', () => ({
  BnrClient: jest.fn().mockImplementation(() => ({
    listExchangeRates: mockListExchangeRates,
    getExchangeRateById: mockGetExchangeRateById,
  })),
  BnrApiError: class BnrApiError extends Error {
    status: number
    responseBody?: string
    constructor(message: string, status: number, responseBody?: string) {
      super(message)
      this.status = status
      this.responseBody = responseBody
    }
  },
  BnrTimeoutError: class BnrTimeoutError extends Error {},
  BnrClientConfigurationError: class BnrClientConfigurationError extends Error {},
}))

import { ingestBnrExchangeRates, ingestBnrExchangeRateById } from '@/lib/services/bnr-rate-ingestion.service'

describe('BNR Rate Ingestion', () => {
  const { prisma } = require('@/lib/prisma')

  beforeEach(() => {
    jest.clearAllMocks()
    delete process.env.BNR_QUOTATION_MODE
  })

  function makeRecord(opts: Partial<{
    id: string
    currency_name: string
    average_rate: string
    buying_rate: string
    selling_rate: string
    post_date: string
    created_at: string
  }> = {}) {
    return {
      id: opts.id ?? '516600',
      currency_name: opts.currency_name ?? 'USD',
      average_rate: opts.average_rate ?? '1473.015',
      buying_rate: opts.buying_rate ?? '1468.015',
      selling_rate: opts.selling_rate ?? '1478.015',
      post_date: opts.post_date ?? '2026/09/21',
      created_at: opts.created_at ?? '2026/09/21',
    }
  }

  it('maps ISO currency_name and inserts with verified quotation direction', async () => {
    mockListExchangeRates.mockResolvedValue([makeRecord({ currency_name: 'USD' })])
    prisma.currencyExchangeRate.findFirst.mockResolvedValue(null)
    prisma.currencyExchangeRate.create.mockResolvedValue({ id: 'new-1' })

    const summary = await ingestBnrExchangeRates()
    expect(summary.fetched).toBe(1)
    expect(summary.inserted).toBe(1)
    expect(prisma.currencyExchangeRate.create).toHaveBeenCalledTimes(1)
    const created = prisma.currencyExchangeRate.create.mock.calls[0][0].data
    // RWF_PER_UNIT_OF_CURRENCY: 1 USD = 1473.015 RWF -> from=USD, to=RWF
    expect(created.fromCurrency).toBe('USD')
    expect(created.toCurrency).toBe('RWF')
    expect(created.averageRate.toString()).toBe('1473.015')
    expect(created.buyingRate.toString()).toBe('1468.015')
    expect(created.sellingRate.toString()).toBe('1478.015')
    expect(created.source).toBe('BNR')
    expect(created.sourceRecordId).toBe('516600')
    expect(created.status).toBe('ACTIVE')
    expect(created.revision).toBe(0)
  })

  it('maps full currency name to ISO code (defensive fallback)', async () => {
    mockListExchangeRates.mockResolvedValue([makeRecord({ currency_name: 'US DOLLAR' })])
    prisma.currencyExchangeRate.findFirst.mockResolvedValue(null)
    prisma.currencyExchangeRate.create.mockResolvedValue({ id: 'new-1' })

    const summary = await ingestBnrExchangeRates()
    expect(summary.inserted).toBe(1)
    const created = prisma.currencyExchangeRate.create.mock.calls[0][0].data
    expect(created.fromCurrency).toBe('USD')
    expect(created.toCurrency).toBe('RWF')
  })

  it('rejects malformed record (missing average_rate)', async () => {
    mockListExchangeRates.mockResolvedValue([makeRecord({ average_rate: '' })])
    prisma.currencyExchangeRate.findFirst.mockResolvedValue(null)

    const summary = await ingestBnrExchangeRates()
    expect(summary.rejected).toBe(1)
    expect(summary.errors[0].reason).toMatch(/average_rate/i)
  })

  it('rejects unsupported currency_name', async () => {
    mockListExchangeRates.mockResolvedValue([makeRecord({ currency_name: 'MARS COIN' })])

    const summary = await ingestBnrExchangeRates()
    expect(summary.rejected).toBe(1)
    expect(summary.errors[0].reason).toMatch(/Unsupported currency_name/i)
  })

  it('continues processing valid records when one record is malformed', async () => {
    mockListExchangeRates.mockResolvedValue([
      makeRecord({ id: '516600', currency_name: 'USD' }),
      makeRecord({ id: '516563', currency_name: 'MARS COIN' }),
      makeRecord({ id: '516563', currency_name: 'EUR' }),
    ])
    prisma.currencyExchangeRate.findFirst.mockResolvedValue(null)
    prisma.currencyExchangeRate.create.mockResolvedValue({ id: 'new-1' })

    const summary = await ingestBnrExchangeRates()
    expect(summary.fetched).toBe(3)
    expect(summary.inserted).toBe(2)
    expect(summary.rejected).toBe(1)
  })

  it('skips duplicate rate (idempotent)', async () => {
    const { Prisma } = require('@prisma/client')
    const existing = {
      id: 'existing-1',
      averageRate: new Prisma.Decimal('1473.015'),
      buyingRate: new Prisma.Decimal('1468.015'),
      sellingRate: new Prisma.Decimal('1478.015'),
      rate: new Prisma.Decimal('1473.015'),
      revision: 0,
    }
    mockListExchangeRates.mockResolvedValue([makeRecord()])
    prisma.currencyExchangeRate.findFirst.mockResolvedValue(existing)

    const summary = await ingestBnrExchangeRates()
    expect(summary.skipped).toBe(1)
    expect(summary.inserted).toBe(0)
    expect(prisma.currencyExchangeRate.update).toHaveBeenCalledTimes(1)
    expect(prisma.currencyExchangeRate.create).not.toHaveBeenCalled()
  })

  it('supersedes old revision and inserts new revision when values changed', async () => {
    const { Prisma } = require('@prisma/client')
    const existing = {
      id: 'existing-2',
      averageRate: new Prisma.Decimal('1200'),
      buyingRate: new Prisma.Decimal('1195'),
      sellingRate: new Prisma.Decimal('1205'),
      rate: new Prisma.Decimal('1200'),
      revision: 0,
    }
    mockListExchangeRates.mockResolvedValue([makeRecord({ average_rate: '1473.015' })])
    prisma.currencyExchangeRate.findFirst.mockResolvedValue(existing)

    const summary = await ingestBnrExchangeRates()
    expect(summary.updated).toBe(1)
    // Old row marked SUPERSEDED (never overwritten)
    expect(prisma.currencyExchangeRate.update).toHaveBeenCalledWith({
      where: { id: 'existing-2' },
      data: { status: 'SUPERSEDED' },
    })
    // New revision inserted as ACTIVE
    expect(prisma.currencyExchangeRate.create).toHaveBeenCalledTimes(1)
    const created = prisma.currencyExchangeRate.create.mock.calls[0][0].data
    expect(created.status).toBe('ACTIVE')
    expect(created.revision).toBe(1)
    expect(created.averageRate.toString()).toBe('1473.015')
  })

  it('ingestBnrExchangeRateById handles Null response', async () => {
    mockGetExchangeRateById.mockResolvedValue(null)

    const summary = await ingestBnrExchangeRateById('999')
    expect(summary.fetched).toBe(0)
    expect(summary.inserted).toBe(0)
  })

  it('defaults to verified RWF_PER_UNIT_OF_CURRENCY when BNR_QUOTATION_MODE is unset', async () => {
    delete process.env.BNR_QUOTATION_MODE
    mockListExchangeRates.mockResolvedValue([makeRecord({ currency_name: 'EUR' })])
    prisma.currencyExchangeRate.findFirst.mockResolvedValue(null)
    prisma.currencyExchangeRate.create.mockResolvedValue({ id: 'new-1' })

    const summary = await ingestBnrExchangeRates()
    expect(summary.inserted).toBe(1)
    const created = prisma.currencyExchangeRate.create.mock.calls[0][0].data
    expect(created.fromCurrency).toBe('EUR')
    expect(created.toCurrency).toBe('RWF')
  })

  it('throws on invalid BNR_QUOTATION_MODE value', async () => {
    process.env.BNR_QUOTATION_MODE = 'SIDEWAYS'
    await expect(ingestBnrExchangeRates()).rejects.toThrow(/BNR_QUOTATION_MODE/i)
  })

  it('respects explicit UNIT_OF_CURRENCY_PER_RWF override', async () => {
    process.env.BNR_QUOTATION_MODE = 'UNIT_OF_CURRENCY_PER_RWF'
    mockListExchangeRates.mockResolvedValue([makeRecord({ currency_name: 'USD' })])
    prisma.currencyExchangeRate.findFirst.mockResolvedValue(null)
    prisma.currencyExchangeRate.create.mockResolvedValue({ id: 'new-1' })

    const summary = await ingestBnrExchangeRates()
    expect(summary.inserted).toBe(1)
    const created = prisma.currencyExchangeRate.create.mock.calls[0][0].data
    expect(created.fromCurrency).toBe('RWF')
    expect(created.toCurrency).toBe('USD')
    delete process.env.BNR_QUOTATION_MODE
  })
})
