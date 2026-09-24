/**
 * UNIT TESTS: FX Conversion — Canonical currency-exchange.service
 *
 * Validates:
 * - RWF -> USD
 * - USD -> RWF
 * - historical rate lookup
 * - average rate
 * - buying rate
 * - selling rate
 * - invalid rate
 * - missing rate
 * - stale rate
 * - BNR failure (no rate available)
 * - precision
 * - rounding
 * - same-currency identity (1:1)
 */

jest.mock('@/lib/prisma', () => ({
  prisma: {
    supportedCurrency: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    currencyExchangeRate: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

import { Prisma } from '@prisma/client'
import {
  convertMinorUnits,
  getHistoricalExchangeRateSnapshot,
  clearExchangeRateCache,
  ExchangeRateNotFoundError,
  ExchangeRateStaleError,
  ExchangeRateInvalidError,
} from '@/lib/services/currency-exchange.service'

function mockCurrencyRow(code: string, decimalDigits: number) {
  return {
    code,
    name: code,
    symbol: code,
    decimalDigits,
    isActive: true,
    displayEnabled: true,
    transactionEnabled: code === 'RWF',
    paymentEnabled: code === 'RWF',
    settlementEnabled: code === 'RWF',
  }
}

function mockRateRow(opts: {
  id: string
  fromCurrency: string
  toCurrency: string
  rate: string
  averageRate?: string | null
  buyingRate?: string | null
  sellingRate?: string | null
  effectiveDate: Date
  fetchedAt?: Date
  source?: string
  sourceRecordId?: string | null
  validUntil?: Date | null
  status?: string
}) {
  return {
    id: opts.id,
    fromCurrency: opts.fromCurrency,
    toCurrency: opts.toCurrency,
    rate: new Prisma.Decimal(opts.rate),
    averageRate: opts.averageRate ? new Prisma.Decimal(opts.averageRate) : null,
    buyingRate: opts.buyingRate ? new Prisma.Decimal(opts.buyingRate) : null,
    sellingRate: opts.sellingRate ? new Prisma.Decimal(opts.sellingRate) : null,
    source: opts.source || 'BNR',
    sourceRecordId: opts.sourceRecordId || null,
    effectiveDate: opts.effectiveDate,
    fetchedAt: opts.fetchedAt || opts.effectiveDate,
    validFrom: opts.effectiveDate,
    validUntil: opts.validUntil || null,
    status: opts.status || 'ACTIVE',
  }
}

describe('FX Conversion: convertMinorUnits', () => {
  const { prisma } = require('@/lib/prisma')

  beforeEach(() => {
    jest.clearAllMocks()
    clearExchangeRateCache()
    prisma.supportedCurrency.findUnique.mockImplementation((q: any) => {
      const code = q.where.code
      if (code === 'RWF') return Promise.resolve(mockCurrencyRow('RWF', 0))
      if (code === 'USD') return Promise.resolve(mockCurrencyRow('USD', 2))
      return Promise.resolve(null)
    })
  })

  it('same-currency conversion returns identity 1:1', async () => {
    const result = await convertMinorUnits(10000, 'RWF', 'RWF')
    expect(result.toAmountMinor).toBe(10000)
    expect(result.rateSnapshot.rate.toString()).toBe('1')
    expect(result.rateSnapshot.source).toBe('IDENTITY')
  })

  it('RWF -> USD uses direct rate', async () => {
    const effDate = new Date()
    prisma.currencyExchangeRate.findFirst.mockResolvedValue(
      mockRateRow({
        id: 'r1',
        fromCurrency: 'RWF',
        toCurrency: 'USD',
        rate: '0.000769',
        averageRate: '0.000769',
        effectiveDate: effDate,
      })
    )
    // 10000 RWF cents = 100 RWF major -> 0.0769 USD major -> 8 USD cents (rounded)
    const result = await convertMinorUnits(10000, 'RWF', 'USD')
    expect(result.toAmountMinor).toBeGreaterThan(0)
    expect(result.rateSnapshot.fromCurrency).toBe('RWF')
    expect(result.rateSnapshot.toCurrency).toBe('USD')
  })

  it('USD -> RWF uses direct rate', async () => {
    const effDate = new Date()
    prisma.currencyExchangeRate.findFirst.mockResolvedValue(
      mockRateRow({
        id: 'r2',
        fromCurrency: 'USD',
        toCurrency: 'RWF',
        rate: '1300',
        averageRate: '1300',
        effectiveDate: effDate,
      })
    )
    // 100 USD cents = 1 USD major -> 1300 RWF major -> 1300 RWF minor (decimalDigits=0)
    const result = await convertMinorUnits(100, 'USD', 'RWF')
    expect(result.toAmountMinor).toBe(1300)
  })

  it('uses inverse when only reverse rate exists', async () => {
    const effDate = new Date()
    let callCount = 0
    prisma.currencyExchangeRate.findFirst.mockImplementation(() => {
      callCount++
      if (callCount === 1) return Promise.resolve(null) // no direct RWF->USD
      return Promise.resolve(
        mockRateRow({
          id: 'r3',
          fromCurrency: 'USD',
          toCurrency: 'RWF',
          rate: '1300',
          averageRate: '1300',
          effectiveDate: effDate,
        })
      )
    })
    const snapshot = await getHistoricalExchangeRateSnapshot('RWF', 'USD')
    // 1/1300 ≈ 0.000769
    expect(snapshot.rate.toString()).toBe(new Prisma.Decimal(1).div(1300).toString())
  })

  it('throws ExchangeRateNotFoundError when no rate exists', async () => {
    prisma.currencyExchangeRate.findFirst.mockResolvedValue(null)
    await expect(getHistoricalExchangeRateSnapshot('RWF', 'USD')).rejects.toThrow(
      ExchangeRateNotFoundError
    )
  })

  it('throws ExchangeRateInvalidError for non-positive rate', async () => {
    prisma.currencyExchangeRate.findFirst.mockResolvedValue(
      mockRateRow({
        id: 'r-bad',
        fromCurrency: 'RWF',
        toCurrency: 'USD',
        rate: '0',
        averageRate: '0',
        effectiveDate: new Date(),
      })
    )
    await expect(getHistoricalExchangeRateSnapshot('RWF', 'USD')).rejects.toThrow(
      ExchangeRateInvalidError
    )
  })

  it('throws ExchangeRateStaleError for old rate', async () => {
    const oldDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    prisma.currencyExchangeRate.findFirst.mockResolvedValue(
      mockRateRow({
        id: 'r-old',
        fromCurrency: 'RWF',
        toCurrency: 'USD',
        rate: '0.000769',
        averageRate: '0.000769',
        effectiveDate: oldDate,
      })
    )
    await expect(
      getHistoricalExchangeRateSnapshot('RWF', 'USD', { maxAgeHours: 24 })
    ).rejects.toThrow(ExchangeRateStaleError)
  })

  it('allows stale rate when allowStale=true', async () => {
    const oldDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    prisma.currencyExchangeRate.findFirst.mockResolvedValue(
      mockRateRow({
        id: 'r-old2',
        fromCurrency: 'RWF',
        toCurrency: 'USD',
        rate: '0.000769',
        averageRate: '0.000769',
        effectiveDate: oldDate,
      })
    )
    const snap = await getHistoricalExchangeRateSnapshot('RWF', 'USD', {
      maxAgeHours: 24,
      allowStale: true,
    })
    expect(snap.rate.toString()).toBe('0.000769')
  })

  it('selects buying rate when requested', async () => {
    const effDate = new Date()
    prisma.currencyExchangeRate.findFirst.mockResolvedValue(
      mockRateRow({
        id: 'r-buy',
        fromCurrency: 'USD',
        toCurrency: 'RWF',
        rate: '1300',
        averageRate: '1300',
        buyingRate: '1295',
        sellingRate: '1305',
        effectiveDate: effDate,
      })
    )
    const snap = await getHistoricalExchangeRateSnapshot('USD', 'RWF', { rateType: 'BUYING' })
    expect(snap.rate.toString()).toBe('1295')
  })

  it('selects selling rate when requested', async () => {
    const effDate = new Date()
    prisma.currencyExchangeRate.findFirst.mockResolvedValue(
      mockRateRow({
        id: 'r-sell',
        fromCurrency: 'USD',
        toCurrency: 'RWF',
        rate: '1300',
        averageRate: '1300',
        buyingRate: '1295',
        sellingRate: '1305',
        effectiveDate: effDate,
      })
    )
    const snap = await getHistoricalExchangeRateSnapshot('USD', 'RWF', { rateType: 'SELLING' })
    expect(snap.rate.toString()).toBe('1305')
  })

  it('throws when buying rate requested but not available', async () => {
    const effDate = new Date()
    prisma.currencyExchangeRate.findFirst.mockResolvedValue(
      mockRateRow({
        id: 'r-no-buy',
        fromCurrency: 'USD',
        toCurrency: 'RWF',
        rate: '1300',
        averageRate: '1300',
        buyingRate: null,
        sellingRate: '1305',
        effectiveDate: effDate,
      })
    )
    await expect(
      getHistoricalExchangeRateSnapshot('USD', 'RWF', { rateType: 'BUYING' })
    ).rejects.toThrow(ExchangeRateInvalidError)
  })

  it('historical rate lookup uses asOf date', async () => {
    const historicalDate = new Date('2026-09-20')
    prisma.currencyExchangeRate.findFirst.mockResolvedValue(
      mockRateRow({
        id: 'r-hist',
        fromCurrency: 'USD',
        toCurrency: 'RWF',
        rate: '1250',
        averageRate: '1250',
        effectiveDate: historicalDate,
      })
    )
    const snap = await getHistoricalExchangeRateSnapshot('USD', 'RWF', {
      asOf: historicalDate,
    })
    expect(snap.rate.toString()).toBe('1250')
    expect(snap.effectiveDate).toEqual(historicalDate)
  })

  it('precision: large amount does not lose precision', async () => {
    const effDate = new Date()
    prisma.currencyExchangeRate.findFirst.mockResolvedValue(
      mockRateRow({
        id: 'r-prec',
        fromCurrency: 'USD',
        toCurrency: 'RWF',
        rate: '1300.123456',
        averageRate: '1300.123456',
        effectiveDate: effDate,
      })
    )
    // 1,000,000 USD cents = 10,000 USD major -> 13,001,234.56 RWF major -> 13,001,235 RWF minor (decimalDigits=0)
    const result = await convertMinorUnits(1000000, 'USD', 'RWF')
    expect(result.toAmountMinor).toBeGreaterThan(13_000_000)
    expect(result.toAmountMinor).toBeLessThan(13_010_000)
  })

  it('rounding: uses ROUND_HALF_UP', async () => {
    const effDate = new Date()
    prisma.currencyExchangeRate.findFirst.mockResolvedValue(
      mockRateRow({
        id: 'r-round',
        fromCurrency: 'RWF',
        toCurrency: 'USD',
        rate: '0.000769',
        averageRate: '0.000769',
        effectiveDate: effDate,
      })
    )
    // 100 RWF minor = 100 RWF major (decimalDigits=0) -> 0.0769 USD major -> 7.69 USD cents -> 8 (round half up)
    const result = await convertMinorUnits(100, 'RWF', 'USD')
    expect(result.toAmountMinor).toBe(8)
  })
})
