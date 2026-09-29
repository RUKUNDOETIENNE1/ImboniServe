/**
 * UNIT TESTS: Currency Model — Canonical currency definitions
 *
 * Validates the canonical currency-exchange.service getCurrencyDefinition:
 * - valid ISO currency
 * - invalid currency
 * - unsupported currency
 * - RWF
 * - supported foreign currencies
 */

jest.mock('@/lib/prisma', () => ({
  prisma: {
    supportedCurrency: {
      findUnique: jest.fn(),
    },
    currencyExchangeRate: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

import { getCurrencyDefinition, clearExchangeRateCache } from '@/lib/services/currency-exchange.service'

describe('Currency Model: getCurrencyDefinition', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    clearExchangeRateCache()
  })

  it('rejects empty currency code', async () => {
    await expect(getCurrencyDefinition('')).rejects.toThrow(/required/i)
  })

  it('rejects unsupported currency', async () => {
    const { prisma } = require('@/lib/prisma')
    prisma.supportedCurrency.findUnique.mockResolvedValue(null)
    await expect(getCurrencyDefinition('XYZ')).rejects.toThrow(/Unsupported currency: XYZ/i)
  })

  it('returns RWF even when DB row is missing (RWF fallback)', async () => {
    const { prisma } = require('@/lib/prisma')
    prisma.supportedCurrency.findUnique.mockResolvedValue(null)
    const def = await getCurrencyDefinition('RWF')
    expect(def.code).toBe('RWF')
    expect(def.name).toBe('Rwandan Franc')
    expect(def.decimalDigits).toBe(0)
    expect(def.isActive).toBe(true)
  })

  it('returns supported foreign currency from DB', async () => {
    const { prisma } = require('@/lib/prisma')
    prisma.supportedCurrency.findUnique.mockResolvedValue({
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      decimalDigits: 2,
      isActive: true,
      displayEnabled: true,
      transactionEnabled: false,
      paymentEnabled: false,
      settlementEnabled: false,
    })
    const def = await getCurrencyDefinition('USD')
    expect(def.code).toBe('USD')
    expect(def.decimalDigits).toBe(2)
  })

  it('rejects inactive currency', async () => {
    const { prisma } = require('@/lib/prisma')
    prisma.supportedCurrency.findUnique.mockResolvedValue({
      code: 'EUR',
      name: 'Euro',
      symbol: '€',
      decimalDigits: 2,
      isActive: false,
      displayEnabled: true,
      transactionEnabled: false,
      paymentEnabled: false,
      settlementEnabled: false,
    })
    await expect(getCurrencyDefinition('EUR')).rejects.toThrow(/Inactive currency/i)
  })

  it('normalizes lowercase input to uppercase', async () => {
    const { prisma } = require('@/lib/prisma')
    prisma.supportedCurrency.findUnique.mockResolvedValue(null)
    await expect(getCurrencyDefinition('rwf')).resolves.toMatchObject({ code: 'RWF' })
  })
})
