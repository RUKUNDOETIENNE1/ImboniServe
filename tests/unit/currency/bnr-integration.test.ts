/**
 * INTEGRATION-STYLE TESTS: BNR → Ingestion → Canonical Conversion
 *
 * Uses REAL BNR-derived values captured from the live API on 2026-09-21:
 *   USD average_rate = "1473.015"  (RWF per 1 USD)
 *   USD buying_rate  = "1468.015"
 *   USD selling_rate = "1478.015"
 *   EUR average_rate = "1690.579316"
 *   post_date format = "2026/09/21"
 *
 * These tests exercise the full pipeline with a mocked prisma layer:
 *   BNR record -> ingestBnrExchangeRates -> CurrencyExchangeRate row
 *   -> getHistoricalExchangeRateSnapshot -> convertMinorUnits
 *
 * No real API key or network is required — the BnrClient is mocked.
 */

jest.mock('@/lib/prisma', () => {
  const rows: any[] = []
  const prisma = {
    supportedCurrency: {
      upsert: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn((q: any) => {
        const code = q.where.code
        const defs: Record<string, any> = {
          RWF: { code: 'RWF', name: 'Rwandan Franc', symbol: 'RWF', decimalDigits: 0, isActive: true, displayEnabled: true, transactionEnabled: true, paymentEnabled: true, settlementEnabled: true },
          USD: { code: 'USD', name: 'US Dollar', symbol: '$', decimalDigits: 2, isActive: true, displayEnabled: true, transactionEnabled: false, paymentEnabled: false, settlementEnabled: false },
          EUR: { code: 'EUR', name: 'Euro', symbol: '€', decimalDigits: 2, isActive: true, displayEnabled: true, transactionEnabled: false, paymentEnabled: false, settlementEnabled: false },
        }
        return Promise.resolve(defs[code] || null)
      }),
    },
    currencyExchangeRate: {
      findFirst: jest.fn((q: any) => {
        const w = q.where
        const effOk = (r: any) => {
          if (w.effectiveDate instanceof Date) {
            return r.effectiveDate.getTime() === w.effectiveDate.getTime()
          }
          return !w.effectiveDate?.lte || r.effectiveDate <= w.effectiveDate.lte
        }
        const candidates = rows.filter(
          (r) =>
            r.fromCurrency === w.fromCurrency &&
            r.toCurrency === w.toCurrency &&
            r.status === (w.status ?? r.status) &&
            effOk(r) &&
            (w.source === undefined || r.source === w.source) &&
            (w.sourceRecordId === undefined || r.sourceRecordId === w.sourceRecordId)
        )
        candidates.sort((a, b) => b.effectiveDate.getTime() - a.effectiveDate.getTime() || (b.revision ?? 0) - (a.revision ?? 0))
        return Promise.resolve(candidates[0] || null)
      }),
      create: jest.fn((args: any) => {
        const row = { id: `row-${rows.length + 1}`, createdAt: new Date(), ...args.data }
        rows.push(row)
        return Promise.resolve(row)
      }),
      update: jest.fn((args: any) => {
        const row = rows.find((r) => r.id === args.where.id)
        if (row) Object.assign(row, args.data)
        return Promise.resolve(row)
      }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    __rows: rows,
  }
  return { prisma }
})

jest.mock('@/lib/logger', () => ({
  logger: {
    child: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }),
  },
}))

const mockListExchangeRates = jest.fn()
const mockGetExchangeRateById = jest.fn()

jest.mock('@/lib/services/bnr-client.service', () => ({
  BnrClient: jest.fn().mockImplementation(() => ({
    listExchangeRates: mockListExchangeRates,
    getExchangeRateById: mockGetExchangeRateById,
  })),
  BnrApiError: class BnrApiError extends Error { status: number; constructor(m: string, s: number) { super(m); this.status = s } },
  BnrTimeoutError: class BnrTimeoutError extends Error {},
  BnrClientConfigurationError: class BnrClientConfigurationError extends Error {},
}))

import { ingestBnrExchangeRates } from '@/lib/services/bnr-rate-ingestion.service'
import {
  convertMinorUnits,
  getHistoricalExchangeRateSnapshot,
  clearExchangeRateCache,
} from '@/lib/services/currency-exchange.service'

// Real BNR payload shape (2026-09-21)
function bnrUsdRecord() {
  return {
    id: '516600',
    currency_name: 'USD',
    buying_rate: '1468.015',
    average_rate: '1473.015',
    selling_rate: '1478.015',
    post_date: '2026/09/21',
    created_at: '2026/09/21',
  }
}

describe('BNR Integration: ingestion -> canonical conversion', () => {
  const { prisma } = require('@/lib/prisma')

  beforeEach(() => {
    jest.clearAllMocks()
    prisma.__rows.length = 0
    clearExchangeRateCache()
    delete process.env.BNR_QUOTATION_MODE
    delete process.env.FX_RATE_TYPE_PAYMENT
  })

  it('ingests a real BNR USD record and converts USD -> RWF', async () => {
    mockListExchangeRates.mockResolvedValue([bnrUsdRecord()])

    const summary = await ingestBnrExchangeRates()
    expect(summary.inserted).toBe(1)
    expect(prisma.__rows).toHaveLength(1)
    expect(prisma.__rows[0].fromCurrency).toBe('USD')
    expect(prisma.__rows[0].toCurrency).toBe('RWF')

    // 1 USD (100 cents) -> 1473.015 RWF -> 1473 RWF minor (decimalDigits=0, ROUND_HALF_UP)
    const result = await convertMinorUnits(100, 'USD', 'RWF', { allowStale: true })
    expect(result.toAmountMinor).toBe(1473)
    expect(result.rateSnapshot.source).toBe('BNR')
    expect(result.rateSnapshot.sourceRecordId).toBe('516600')
  })

  it('converts RWF -> USD via the same ingested BNR rate', async () => {
    mockListExchangeRates.mockResolvedValue([bnrUsdRecord()])
    await ingestBnrExchangeRates()

    // 1473015 RWF -> 1473015 * (1/1473.015) = 1000 USD -> 100000 USD cents
    const result = await convertMinorUnits(1473015, 'RWF', 'USD', { allowStale: true })
    expect(result.toAmountMinor).toBe(100000)
  })

  it('uses BUYING/SELLING rates when explicitly requested (no silent collapse)', async () => {
    mockListExchangeRates.mockResolvedValue([bnrUsdRecord()])
    await ingestBnrExchangeRates()

    const buying = await getHistoricalExchangeRateSnapshot('USD', 'RWF', {
      rateType: 'BUYING',
      allowStale: true,
    })
    expect(buying.rate.toString()).toBe('1468.015')

    const selling = await getHistoricalExchangeRateSnapshot('USD', 'RWF', {
      rateType: 'SELLING',
      allowStale: true,
    })
    expect(selling.rate.toString()).toBe('1478.015')

    const average = await getHistoricalExchangeRateSnapshot('USD', 'RWF', {
      rateType: 'AVERAGE',
      allowStale: true,
    })
    expect(average.rate.toString()).toBe('1473.015')
  })

  it('re-ingesting identical BNR data is idempotent (skipped)', async () => {
    mockListExchangeRates.mockResolvedValue([bnrUsdRecord()])
    await ingestBnrExchangeRates()
    const second = await ingestBnrExchangeRates()
    expect(second.skipped).toBe(1)
    expect(prisma.__rows).toHaveLength(1)
  })

  it('a corrected BNR record supersedes rather than overwrites', async () => {
    mockListExchangeRates.mockResolvedValue([bnrUsdRecord()])
    await ingestBnrExchangeRates()

    // BNR republishes the same record id/date with corrected values
    mockListExchangeRates.mockResolvedValue([{ ...bnrUsdRecord(), average_rate: '1475.000' }])
    const second = await ingestBnrExchangeRates()
    expect(second.updated).toBe(1)
    expect(prisma.__rows).toHaveLength(2)

    const old = prisma.__rows[0]
    const next = prisma.__rows[1]
    expect(old.status).toBe('SUPERSEDED')
    expect(old.averageRate.toString()).toBe('1473.015')
    expect(next.status).toBe('ACTIVE')
    expect(next.revision).toBe(1)
    expect(next.averageRate.toString()).toBe('1475')
  })

  it('transaction referencing a superseded snapshot remains reconstructable', async () => {
    mockListExchangeRates.mockResolvedValue([bnrUsdRecord()])
    await ingestBnrExchangeRates()
    const rateRowId = prisma.__rows[0].id
    const frozenRate = prisma.__rows[0].averageRate.toString()

    // Later: BNR corrects the rate
    mockListExchangeRates.mockResolvedValue([{ ...bnrUsdRecord(), average_rate: '1500.000' }])
    await ingestBnrExchangeRates()

    // The row the transaction references is still present with its frozen value
    const referenced = prisma.__rows.find((r: any) => r.id === rateRowId)
    expect(referenced).toBeDefined()
    expect(referenced.averageRate.toString()).toBe(frozenRate)
    expect(referenced.status).toBe('SUPERSEDED')
  })
})
