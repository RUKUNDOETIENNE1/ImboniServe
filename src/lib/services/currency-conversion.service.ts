/**
 * Currency Conversion Service
 * Uses API Ninjas for real-time exchange rates
 * Caches rates to minimize API calls (3000/month limit)
 * 
 * ⚠️ DEPRECATED FOR RUNTIME USE: External API should be fallback only.
 * 
 * ARCHITECTURAL RULE:
 * Use currency-exchange.service.ts (DB-backed) as primary source.
 * This service should ONLY be used for:
 * - Admin rate updates
 * - Backfill operations
 * - Emergency fallback when DB rates unavailable
 * 
 * DO NOT use in hot payment/checkout paths.
 */

const API_KEY = process.env.API_NINJAS_KEY
const API_BASE = 'https://api.api-ninjas.com/v1/convertcurrency'

if (!API_KEY) {
  console.warn('[CurrencyConversion] API_NINJAS_KEY not configured; external FX will use fallback rates only')
}

// Cache exchange rates for 6 hours (optimized for API limit)
const rateCache = new Map<string, { rate: number; timestamp: number }>()
const CACHE_DURATION = 6 * 60 * 60 * 1000 // 6 hours in milliseconds

// Fallback rates (updated periodically, used if API fails)
const FALLBACK_RATES: Record<string, number> = {
  'RWF_USD': 0.00077, // 1 RWF = 0.00077 USD
  'RWF_EUR': 0.00071, // 1 RWF = 0.00071 EUR
  'RWF_GBP': 0.00061, // 1 RWF = 0.00061 GBP
  'RWF_KES': 0.10,    // 1 RWF = 0.10 KES
  'RWF_TZS': 1.93,    // 1 RWF = 1.93 TZS
  'RWF_UGX': 2.84,    // 1 RWF = 2.84 UGX
}

/**
 * Get exchange rate from RWF to target currency
 */
export async function getExchangeRate(
  targetCurrency: string
): Promise<number> {
  if (targetCurrency === 'RWF') return 1

  const cacheKey = `RWF_${targetCurrency}`
  
  // Check cache first
  const cached = rateCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.rate
  }

  try {
    // Call API Ninjas (only if key is configured)
    if (!API_KEY) {
      throw new Error('API_NINJAS_KEY not configured')
    }
    
    const response = await fetch(
      `${API_BASE}?have=RWF&want=${targetCurrency}&amount=1`,
      {
        headers: {
          'X-Api-Key': API_KEY as string
        }
      }
    )

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }

    const data = await response.json()
    const rate = data.new_amount

    if (typeof rate !== 'number' || rate <= 0) {
      throw new Error('Invalid rate received')
    }

    // Cache the rate
    rateCache.set(cacheKey, { rate, timestamp: Date.now() })
    
    return rate
  } catch (error) {
    console.error(`Failed to fetch exchange rate for ${targetCurrency}:`, error)
    
    // Use fallback rate if available
    const fallbackRate = FALLBACK_RATES[cacheKey]
    if (fallbackRate) {
      console.log(`Using fallback rate for ${targetCurrency}: ${fallbackRate}`)
      return fallbackRate
    }
    
    // Last resort: return 1 (no conversion)
    console.warn(`No fallback rate available for ${targetCurrency}, using 1:1`)
    return 1
  }
}

/**
 * Convert amount from RWF to target currency
 */
export async function convertFromRWF(
  amountInRWF: number,
  targetCurrency: string
): Promise<number> {
  if (targetCurrency === 'RWF') return amountInRWF
  
  const rate = await getExchangeRate(targetCurrency)
  return amountInRWF * rate
}

/**
 * Convert amount from source currency to RWF
 */
export async function convertToRWF(
  amount: number,
  sourceCurrency: string
): Promise<number> {
  if (sourceCurrency === 'RWF') return amount
  
  const rate = await getExchangeRate(sourceCurrency)
  return amount / rate
}

/**
 * Format currency with proper symbol and conversion
 */
export async function formatCurrencyConverted(
  amountInRWF: number,
  targetCurrency: string,
  options: {
    showSymbol?: boolean
    showCode?: boolean
    compact?: boolean
  } = {}
): Promise<string> {
  const { showSymbol = true, showCode = false, compact = false } = options

  const convertedAmount = await convertFromRWF(amountInRWF, targetCurrency)
  
  const currencyConfig: Record<string, { symbol: string; decimals: number }> = {
    RWF: { symbol: 'FRw', decimals: 0 },
    USD: { symbol: '$', decimals: 2 },
    EUR: { symbol: '€', decimals: 2 },
    GBP: { symbol: '£', decimals: 2 },
    KES: { symbol: 'KSh', decimals: 0 },
    TZS: { symbol: 'TSh', decimals: 0 },
    UGX: { symbol: 'USh', decimals: 0 }
  }

  const config = currencyConfig[targetCurrency] || { symbol: targetCurrency, decimals: 2 }
  
  let formattedNumber: string
  
  if (compact && convertedAmount >= 1000000) {
    const millions = convertedAmount / 1000000
    formattedNumber = `${millions.toFixed(1)}M`
  } else if (compact && convertedAmount >= 1000) {
    const thousands = convertedAmount / 1000
    formattedNumber = `${thousands.toFixed(1)}K`
  } else {
    formattedNumber = convertedAmount.toLocaleString('en-US', {
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals
    })
  }
  
  let result = formattedNumber
  
  if (showSymbol) {
    result = `${config.symbol}${formattedNumber}`
  }
  
  if (showCode) {
    result = `${result} ${targetCurrency}`
  }
  
  return result
}

/**
 * Detect user's currency from browser/location
 */
export function detectUserCurrency(locale?: string): string {
  const countryToCurrency: Record<string, string> = {
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
    NL: 'EUR'
  }
  
  if (locale) {
    const country = locale.split('-')[1]?.toUpperCase()
    if (country && countryToCurrency[country]) {
      return countryToCurrency[country]
    }
  }
  
  // Try to detect from timezone
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (timezone.includes('Africa/Kigali')) return 'RWF'
    if (timezone.includes('Africa/Nairobi')) return 'KES'
    if (timezone.includes('Africa/Dar_es_Salaam')) return 'TZS'
    if (timezone.includes('Africa/Kampala')) return 'UGX'
    if (timezone.includes('America/')) return 'USD'
    if (timezone.includes('Europe/')) return 'EUR'
  } catch (e) {
    // Ignore timezone detection errors
  }
  
  return 'RWF' // Default
}

/**
 * Preload common exchange rates to minimize API calls
 */
export async function preloadExchangeRates() {
  const commonCurrencies = ['USD', 'EUR', 'GBP', 'KES', 'TZS', 'UGX']
  
  await Promise.all(
    commonCurrencies.map(currency => getExchangeRate(currency))
  )
}

/**
 * Get cached rate without API call (for SSR)
 */
export function getCachedRate(targetCurrency: string): number | null {
  if (targetCurrency === 'RWF') return 1
  
  const cacheKey = `RWF_${targetCurrency}`
  const cached = rateCache.get(cacheKey)
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.rate
  }
  
  // Return fallback if available
  return FALLBACK_RATES[cacheKey] || null
}
