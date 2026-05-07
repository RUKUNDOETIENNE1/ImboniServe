export const SUPPORTED_CURRENCIES = {
  RWF: { code: 'RWF', name: 'Rwandan Franc', symbol: 'RWF', decimals: 0, country: 'RW' },
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2, country: 'US' },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2, country: 'EU' },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', decimals: 2, country: 'GB' },
  KES: { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', decimals: 2, country: 'KE' },
  UGX: { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', decimals: 0, country: 'UG' },
  TZS: { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', decimals: 0, country: 'TZ' },
  ZAR: { code: 'ZAR', name: 'South African Rand', symbol: 'R', decimals: 2, country: 'ZA' },
  NGN: { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', decimals: 2, country: 'NG' },
  GHS: { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵', decimals: 2, country: 'GH' },
  XOF: { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA', decimals: 0, country: 'SN' },
  XAF: { code: 'XAF', name: 'Central African CFA Franc', symbol: 'FCFA', decimals: 0, country: 'CM' },
  MAD: { code: 'MAD', name: 'Moroccan Dirham', symbol: 'DH', decimals: 2, country: 'MA' },
  EGP: { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', decimals: 2, country: 'EG' },
  AED: { code: 'AED', name: 'UAE Dirham', symbol: 'AED', decimals: 2, country: 'AE' },
} as const

export type CurrencyCode = keyof typeof SUPPORTED_CURRENCIES

export interface CurrencyInfo {
  code: string
  name: string
  symbol: string
  decimals: number
  country: string
}

export class CurrencyService {
  static getCurrencyInfo(code: string): CurrencyInfo {
    const currency = SUPPORTED_CURRENCIES[code as CurrencyCode]
    if (!currency) {
      return SUPPORTED_CURRENCIES.RWF
    }
    return currency
  }

  static formatAmount(amountCents: number, currencyCode: string): string {
    const currency = this.getCurrencyInfo(currencyCode)
    const amount = amountCents / Math.pow(10, currency.decimals)
    
    if (currency.decimals === 0) {
      return `${currency.symbol} ${Math.round(amount).toLocaleString()}`
    }
    
    return `${currency.symbol} ${amount.toLocaleString(undefined, {
      minimumFractionDigits: currency.decimals,
      maximumFractionDigits: currency.decimals
    })}`
  }

  static convertCents(amountCents: number, fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) return amountCents
    
    const rates: Record<string, number> = {
      'RWF_USD': 0.00077,
      'USD_RWF': 1300,
      'RWF_EUR': 0.00071,
      'EUR_RWF': 1410,
      'RWF_KES': 0.10,
      'KES_RWF': 10,
      'RWF_UGX': 2.9,
      'UGX_RWF': 0.34,
      'RWF_TZS': 2.0,
      'TZS_RWF': 0.50,
    }
    
    const key = `${fromCurrency}_${toCurrency}`
    const rate = rates[key]
    
    if (!rate) {
      console.warn(`No conversion rate for ${fromCurrency} -> ${toCurrency}`)
      return amountCents
    }
    
    return Math.round(amountCents * rate)
  }

  static getCurrenciesForCountry(countryCode: string): CurrencyCode[] {
    return Object.entries(SUPPORTED_CURRENCIES)
      .filter(([_, info]) => info.country === countryCode)
      .map(([code]) => code as CurrencyCode)
  }

  static getAllCurrencies(): CurrencyInfo[] {
    return Object.values(SUPPORTED_CURRENCIES)
  }

  static parseCentsFromInput(input: string | number, currencyCode: string): number {
    const currency = this.getCurrencyInfo(currencyCode)
    const amount = typeof input === 'string' ? parseFloat(input) : input
    return Math.round(amount * Math.pow(10, currency.decimals))
  }
}
