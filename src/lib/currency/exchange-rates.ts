import { getRatesForBaseCurrency } from '@/lib/services/currency-exchange.service';

type Rates = { [code: string]: number };

const cache = new Map<string, { rates: Rates; fetchedAt: number }>();
const TTL_MS = 5 * 60 * 1000; // 5 minutes

export function getFallbackRates(base: string): { base: string; rates: Rates; fetchedAt: number } {
  // Canonical policy: no hardcoded fallback rates.
  // If rates are unavailable, return base=1 and empty others.
  const key = base.toUpperCase();
  const fallback: Rates = { [key]: 1 };
  const fetchedAt = Date.now();
  cache.set(key, { rates: fallback, fetchedAt });
  return { base: key, rates: fallback, fetchedAt };
}

export async function fetchRates(base: string): Promise<{ base: string; rates: Rates; fetchedAt: number }> {
  const key = base.toUpperCase();
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && now - hit.fetchedAt < TTL_MS) {
    return { base: key, rates: hit.rates, fetchedAt: hit.fetchedAt };
  }

  const payload = await getRatesForBaseCurrency(key, {
    rateType: 'AVERAGE',
    maxAgeHours: parseInt(process.env.FX_MAX_RATE_AGE_HOURS || '168', 10),
    allowStale: false,
  });
  cache.set(key, { rates: payload.rates, fetchedAt: now });
  return { base: key, rates: payload.rates, fetchedAt: now };
}

export function convert(amount: number, from: string, to: string, rates: Rates): number {
  const f = from.toUpperCase();
  const t = to.toUpperCase();
  if (f === t) return amount;
  if (!rates[t]) {
    throw new Error(`Missing conversion rate for ${f} -> ${t}`);
  }
  if (f !== 'BASE' && !rates[f]) {
    throw new Error(`Missing base reference rate for ${f}`);
  }
  if (f === 'BASE') return amount * rates[t];
  return amount * (rates[t] / rates[f]);
}
