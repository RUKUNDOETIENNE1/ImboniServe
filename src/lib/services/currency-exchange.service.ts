/**
 * Currency Exchange Service
 * 
 * Backend service for currency conversion with database-backed exchange rates
 * Provides caching and fallback mechanisms
 */

import { prisma } from '@/lib/prisma';
import { EXCHANGE_RATES } from '@/lib/utils/currency';

interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  validFrom: Date;
  source: string;
}

// In-memory cache for exchange rates
const rateCache = new Map<string, { rate: number; timestamp: number }>();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

/**
 * Get exchange rate from database or fallback to hardcoded rates
 */
export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  // Same currency - no conversion needed
  if (fromCurrency === toCurrency) {
    return 1.0;
  }

  const cacheKey = `${fromCurrency}_${toCurrency}`;
  const now = Date.now();

  // Check cache first
  const cached = rateCache.get(cacheKey);
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.rate;
  }

  try {
    // Try to get from database
    const dbRate = await (prisma as any).currencyExchangeRate.findFirst({
      where: {
        fromCurrency,
        toCurrency,
        validFrom: {
          lte: new Date()
        },
        OR: [
          { validUntil: null },
          { validUntil: { gte: new Date() } }
        ]
      },
      orderBy: {
        validFrom: 'desc'
      }
    });

    if (dbRate) {
      const rate = parseFloat(dbRate.rate.toString());
      rateCache.set(cacheKey, { rate, timestamp: now });
      return rate;
    }
  } catch (error) {
    console.warn('Failed to fetch exchange rate from database:', error);
  }

  // Fallback to hardcoded rates
  if (fromCurrency === 'RWF') {
    const fallbackRate = EXCHANGE_RATES[toCurrency];
    if (fallbackRate) {
      rateCache.set(cacheKey, { rate: fallbackRate, timestamp: now });
      return fallbackRate;
    }
  }

  // Try reverse conversion
  if (toCurrency === 'RWF') {
    const reverseRate = EXCHANGE_RATES[fromCurrency];
    if (reverseRate) {
      const rate = 1 / reverseRate;
      rateCache.set(cacheKey, { rate, timestamp: now });
      return rate;
    }
  }

  console.warn(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
  return 1.0; // Fallback to 1:1
}

/**
 * Convert amount between currencies
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  const rate = await getExchangeRate(fromCurrency, toCurrency);
  return amount * rate;
}

/**
 * Convert from RWF (base currency) to target currency
 */
export async function convertFromRWF(
  amountRWF: number,
  targetCurrency: string
): Promise<number> {
  return convertCurrency(amountRWF, 'RWF', targetCurrency);
}

/**
 * Convert to RWF (base currency) from source currency
 */
export async function convertToRWF(
  amount: number,
  sourceCurrency: string
): Promise<number> {
  return convertCurrency(amount, sourceCurrency, 'RWF');
}

/**
 * Update exchange rates in database
 * Should be called by a cron job or admin action
 */
export async function updateExchangeRates(
  rates: Array<{
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    source?: string;
  }>
): Promise<void> {
  const now = new Date();

  for (const rateData of rates) {
    try {
      // Expire old rates
      await (prisma as any).currencyExchangeRate.updateMany({
        where: {
          fromCurrency: rateData.fromCurrency,
          toCurrency: rateData.toCurrency,
          validUntil: null
        },
        data: {
          validUntil: now
        }
      });

      // Insert new rate
      await (prisma as any).currencyExchangeRate.create({
        data: {
          fromCurrency: rateData.fromCurrency,
          toCurrency: rateData.toCurrency,
          rate: rateData.rate,
          source: rateData.source || 'manual',
          validFrom: now
        }
      });

      // Clear cache for this pair
      const cacheKey = `${rateData.fromCurrency}_${rateData.toCurrency}`;
      rateCache.delete(cacheKey);
    } catch (error) {
      console.error(`Failed to update rate ${rateData.fromCurrency}/${rateData.toCurrency}:`, error);
    }
  }
}

/**
 * Get all active exchange rates
 */
export async function getAllExchangeRates(): Promise<ExchangeRate[]> {
  try {
    const rates = await (prisma as any).currencyExchangeRate.findMany({
      where: {
        validFrom: {
          lte: new Date()
        },
        OR: [
          { validUntil: null },
          { validUntil: { gte: new Date() } }
        ]
      },
      orderBy: [
        { fromCurrency: 'asc' },
        { toCurrency: 'asc' }
      ]
    });

    return rates.map((r: any) => ({
      fromCurrency: r.fromCurrency,
      toCurrency: r.toCurrency,
      rate: parseFloat(r.rate.toString()),
      validFrom: r.validFrom,
      source: r.source
    }));
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    return [];
  }
}

/**
 * Clear the exchange rate cache
 */
export function clearExchangeRateCache(): void {
  rateCache.clear();
}
