type Rates = { [code: string]: number }

const cache = new Map<string, { rates: Rates; fetchedAt: number }>()
const TTL_MS = 6 * 60 * 60 * 1000 // 6 hours

// Minimal fallback rates to avoid breaking the dashboard when
// the external exchange rate API is unavailable or not configured.
// These are approximate and can be adjusted later.
const FALLBACK_RATES: Record<string, Rates> = {
  RWF: {
    USD: 0.0008,
    EUR: 0.00074,
    KES: 0.087,
    UGX: 3.1,
  },
  USD: {
    RWF: 1300,
    EUR: 0.93,
    KES: 130,
    UGX: 3800,
  },
  EUR: {
    RWF: 1400,
    USD: 1.07,
    KES: 140,
    UGX: 4100,
  },
}

export function getFallbackRates(base: string): { base: string; rates: Rates; fetchedAt: number } {
  const key = base.toUpperCase()
  const rates = FALLBACK_RATES[key] || {}
  const fetchedAt = Date.now()
  cache.set(key, { rates, fetchedAt })
  return { base: key, rates, fetchedAt }
}

export async function fetchRates(base: string): Promise<{ base: string; rates: Rates; fetchedAt: number }> {
  const key = base.toUpperCase()
  const now = Date.now()
  const hit = cache.get(key)
  if (hit && now - hit.fetchedAt < TTL_MS) {
    return { base: key, rates: hit.rates, fetchedAt: hit.fetchedAt }
  }

  const apiKey = process.env.EXCHANGE_RATES_API_KEY

  // Try external API first if an API key is configured
  if (apiKey) {
    try {
      const url = `https://api.exchangerate.host/latest?base=${encodeURIComponent(key)}&access_key=${encodeURIComponent(apiKey)}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Failed to fetch rates (${res.status})`)
      const data = await res.json()
      if (!data?.rates) throw new Error('Invalid rates response')

      const rates: Rates = data.rates
      cache.set(key, { rates, fetchedAt: now })
      return { base: key, rates, fetchedAt: now }
    } catch (error) {
      console.warn('Exchange rates API failed, falling back to static rates:', error)
    }
  }

  // If there is no API key or the external request fails, use static fallbacks
  return getFallbackRates(key)
}

export function convert(amount: number, from: string, to: string, rates: Rates): number {
  const f = from.toUpperCase(), t = to.toUpperCase()
  if (f === t) return amount
  if (Object.keys(rates).length === 0) return amount
  if (rates[t] && rates[f]) {
    // Convert via base: amount in base * (t / f)
    return amount * (rates[t] / rates[f])
  }
  if (rates[t] && f === 'BASE') return amount * rates[t]
  return amount
}
