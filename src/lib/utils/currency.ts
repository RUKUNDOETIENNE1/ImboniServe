/**
 * Global Currency System
 * 
 * Rules:
 * - All prices stored in RWF (base currency)
 * - Conversion ONLY for display
 * - No hardcoded currency anywhere
 */

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  decimalDigits: number;
  symbolPosition: 'before' | 'after';
}

// Supported currencies configuration
export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  RWF: {
    code: 'RWF',
    symbol: 'FRw',
    name: 'Rwandan Franc',
    decimalDigits: 0,
    symbolPosition: 'after'
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimalDigits: 2,
    symbolPosition: 'before'
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    decimalDigits: 2,
    symbolPosition: 'before'
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    decimalDigits: 2,
    symbolPosition: 'before'
  },
  KES: {
    code: 'KES',
    symbol: 'KSh',
    name: 'Kenyan Shilling',
    decimalDigits: 2,
    symbolPosition: 'before'
  },
  TZS: {
    code: 'TZS',
    symbol: 'TSh',
    name: 'Tanzanian Shilling',
    decimalDigits: 0,
    symbolPosition: 'before'
  },
  UGX: {
    code: 'UGX',
    symbol: 'USh',
    name: 'Ugandan Shilling',
    decimalDigits: 0,
    symbolPosition: 'before'
  }
};

// Exchange rates (RWF as base)
// In production, these should be fetched from database or external API
export const EXCHANGE_RATES: Record<string, number> = {
  RWF: 1,
  USD: 0.000769, // 1 USD ≈ 1,300 RWF
  EUR: 0.000714, // 1 EUR ≈ 1,400 RWF
  GBP: 0.000625, // 1 GBP ≈ 1,600 RWF
  KES: 0.1,      // 1 KES ≈ 10 RWF
  TZS: 2,        // 1 TZS ≈ 0.5 RWF
  UGX: 3         // 1 UGX ≈ 0.33 RWF
};

/**
 * Get currency configuration
 */
export function getCurrencyConfig(currencyCode: string): CurrencyConfig {
  return SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.RWF;
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currencyCode: string): string {
  return getCurrencyConfig(currencyCode).symbol;
}

/**
 * Convert amount from RWF to target currency
 */
export function convertFromRWF(amountRWF: number, targetCurrency: string): number {
  if (targetCurrency === 'RWF') return amountRWF;
  
  const rate = EXCHANGE_RATES[targetCurrency];
  if (!rate) {
    console.warn(`Exchange rate not found for ${targetCurrency}, defaulting to RWF`);
    return amountRWF;
  }
  
  return amountRWF * rate;
}

/**
 * Convert amount from source currency to RWF
 */
export function convertToRWF(amount: number, sourceCurrency: string): number {
  if (sourceCurrency === 'RWF') return amount;
  
  const rate = EXCHANGE_RATES[sourceCurrency];
  if (!rate) {
    console.warn(`Exchange rate not found for ${sourceCurrency}`);
    return amount;
  }
  
  return amount / rate;
}

/**
 * Format currency for display
 * 
 * @param amountInRWF - Amount in base currency (RWF)
 * @param targetCurrency - Target currency code
 * @param options - Formatting options
 */
export function formatCurrency(
  amountInRWF: number,
  targetCurrency: string = 'RWF',
  options: {
    showSymbol?: boolean;
    showCode?: boolean;
    compact?: boolean;
  } = {}
): string {
  const { showSymbol = true, showCode = false, compact = false } = options;
  
  const config = getCurrencyConfig(targetCurrency);
  const convertedAmount = convertFromRWF(amountInRWF, targetCurrency);
  
  // Format number with proper decimal places
  let formattedNumber: string;
  
  if (compact && convertedAmount >= 1000000) {
    // Compact format for large numbers (e.g., 1.2M)
    const millions = convertedAmount / 1000000;
    formattedNumber = `${millions.toFixed(1)}M`;
  } else if (compact && convertedAmount >= 1000) {
    // Compact format for thousands (e.g., 1.2K)
    const thousands = convertedAmount / 1000;
    formattedNumber = `${thousands.toFixed(1)}K`;
  } else {
    formattedNumber = convertedAmount.toLocaleString('en-US', {
      minimumFractionDigits: config.decimalDigits,
      maximumFractionDigits: config.decimalDigits
    });
  }
  
  // Build final string
  let result = '';
  
  if (showSymbol && config.symbolPosition === 'before') {
    result = `${config.symbol}${formattedNumber}`;
  } else if (showSymbol && config.symbolPosition === 'after') {
    result = `${formattedNumber} ${config.symbol}`;
  } else {
    result = formattedNumber;
  }
  
  if (showCode) {
    result = `${result} ${config.code}`;
  }
  
  return result;
}

/**
 * Format currency amount stored in cents to display value
 */
export function formatCurrencyFromCents(
  amountInCents: number,
  targetCurrency: string = 'RWF',
  options?: {
    showSymbol?: boolean;
    showCode?: boolean;
    compact?: boolean;
  }
): string {
  return formatCurrency(amountInCents / 100, targetCurrency, options);
}

/**
 * Parse currency input string to RWF cents
 */
export function parseCurrencyInput(
  input: string,
  sourceCurrency: string = 'RWF'
): number {
  // Remove all non-numeric characters except decimal point
  const cleaned = input.replace(/[^\d.]/g, '');
  const amount = parseFloat(cleaned) || 0;
  
  // Convert to RWF if needed
  const amountInRWF = convertToRWF(amount, sourceCurrency);
  
  // Return in cents
  return Math.round(amountInRWF * 100);
}

/**
 * Detect user's currency based on locale or country
 */
export function detectCurrencyFromLocale(locale?: string, countryCode?: string): string {
  // Country-specific mappings
  const countryToCurrency: Record<string, string> = {
    'RW': 'RWF',
    'US': 'USD',
    'GB': 'GBP',
    'KE': 'KES',
    'TZ': 'TZS',
    'UG': 'UGX',
    'FR': 'EUR',
    'DE': 'EUR',
    'IT': 'EUR',
    'ES': 'EUR',
    'BE': 'EUR',
    'NL': 'EUR'
  };
  
  // Try country code first
  if (countryCode && countryToCurrency[countryCode]) {
    return countryToCurrency[countryCode];
  }
  
  // Try locale
  if (locale) {
    const country = locale.split('-')[1]?.toUpperCase();
    if (country && countryToCurrency[country]) {
      return countryToCurrency[country];
    }
  }
  
  // Default to RWF
  return 'RWF';
}

/**
 * Get all supported currencies
 */
export function getSupportedCurrencies(): CurrencyConfig[] {
  return Object.values(SUPPORTED_CURRENCIES);
}

/**
 * Validate currency code
 */
export function isValidCurrency(currencyCode: string): boolean {
  return currencyCode in SUPPORTED_CURRENCIES;
}

/**
 * Get currency display name
 */
export function getCurrencyName(currencyCode: string): string {
  return getCurrencyConfig(currencyCode).name;
}
