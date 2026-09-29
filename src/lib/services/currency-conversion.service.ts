/**
 * Compatibility wrapper around canonical currency exchange service.
 *
 * This file is kept for backward compatibility with existing imports.
 * It no longer calls external FX APIs or hardcoded fallback rate tables.
 */

import {
  convertFromRWF as canonicalConvertFromRWF,
  convertToRWF as canonicalConvertToRWF,
  getExchangeRate as canonicalGetExchangeRate,
} from '@/lib/services/currency-exchange.service';

/**
 * Backward-compatible helper:
 * old signature was getExchangeRate(targetCurrency) with implicit RWF base.
 */
export async function getExchangeRate(targetCurrency: string): Promise<number> {
  return canonicalGetExchangeRate('RWF', targetCurrency, {
    rateType: 'AVERAGE',
    maxAgeHours: parseInt(process.env.FX_MAX_RATE_AGE_HOURS || '168', 10),
    allowStale: false,
  });
}

export async function convertFromRWF(amountInRWF: number, targetCurrency: string): Promise<number> {
  return canonicalConvertFromRWF(amountInRWF, targetCurrency, {
    rateType: 'AVERAGE',
    maxAgeHours: parseInt(process.env.FX_MAX_RATE_AGE_HOURS || '168', 10),
    allowStale: false,
  });
}

export async function convertToRWF(amount: number, sourceCurrency: string): Promise<number> {
  return canonicalConvertToRWF(amount, sourceCurrency, {
    rateType: 'AVERAGE',
    maxAgeHours: parseInt(process.env.FX_MAX_RATE_AGE_HOURS || '168', 10),
    allowStale: false,
  });
}

export async function formatCurrencyConverted(
  amountInRWF: number,
  targetCurrency: string,
  options: {
    showSymbol?: boolean
    showCode?: boolean
    compact?: boolean
  } = {}
): Promise<string> {
  const { showSymbol = true, showCode = false, compact = false } = options;
  const convertedAmount = await convertFromRWF(amountInRWF, targetCurrency);

  const fractionDigits = targetCurrency === 'RWF' ? 0 : 2;
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: compact ? 0 : fractionDigits,
    maximumFractionDigits: compact ? 1 : fractionDigits,
  });

  let displayValue = convertedAmount;
  let suffix = '';
  if (compact && Math.abs(convertedAmount) >= 1_000_000) {
    displayValue = convertedAmount / 1_000_000;
    suffix = 'M';
  } else if (compact && Math.abs(convertedAmount) >= 1_000) {
    displayValue = convertedAmount / 1_000;
    suffix = 'K';
  }

  const numberPart = `${formatter.format(displayValue)}${suffix}`;
  const result = showSymbol ? `${targetCurrency} ${numberPart}` : numberPart;
  return showCode ? `${result} ${targetCurrency}` : result;
}

export function detectUserCurrency(locale?: string): string {
  if (!locale) return 'RWF';
  const country = locale.split('-')[1]?.toUpperCase();
  if (!country) return 'RWF';
  const map: Record<string, string> = {
    RW: 'RWF',
    US: 'USD',
    GB: 'GBP',
    KE: 'KES',
    TZ: 'TZS',
    UG: 'UGX',
    FR: 'EUR',
    DE: 'EUR',
    IT: 'EUR',
    ES: 'EUR',
    BE: 'EUR',
    NL: 'EUR',
  };
  return map[country] || 'RWF';
}

export async function preloadExchangeRates(): Promise<void> {
  // No-op by design: canonical service does DB lookups with internal caching.
}

export function getCachedRate(_targetCurrency: string): number | null {
  // Deprecated synchronous accessor intentionally unsupported.
  return null;
}
