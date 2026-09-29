/**
 * Country Configuration Mapping
 *
 * EGR-016: Geography must be configuration, never code.
 *
 * This module provides country-specific defaults for currency, timezone,
 * and tax rate. These are used during signup to initialize a new business
 * with sensible defaults based on its country.
 *
 * IMPORTANT: These are DEFAULTS only. Every value can be overridden by the
 * business through their settings. The business configuration in the
 * database is always the source of truth at runtime.
 */

interface CountryDefaults {
  /** ISO 4217 currency code */
  currency: string
  /** IANA timezone identifier */
  timezone: string
  /** Default VAT/tax rate as a percentage (e.g. 18.0 = 18%) */
  taxRate: number
  /** Tax mode: INCLUSIVE (tax included in price) or EXCLUSIVE (tax added at checkout) */
  taxMode: 'INCLUSIVE' | 'EXCLUSIVE'
}

const COUNTRY_DEFAULTS: Record<string, CountryDefaults> = {
  RW: { currency: 'RWF', timezone: 'Africa/Kigali', taxRate: 18.0, taxMode: 'INCLUSIVE' },
  KE: { currency: 'KES', timezone: 'Africa/Nairobi', taxRate: 16.0, taxMode: 'INCLUSIVE' },
  UG: { currency: 'UGX', timezone: 'Africa/Kampala', taxRate: 18.0, taxMode: 'INCLUSIVE' },
  TZ: { currency: 'TZS', timezone: 'Africa/Dar_es_Salaam', taxRate: 18.0, taxMode: 'INCLUSIVE' },
  ZA: { currency: 'ZAR', timezone: 'Africa/Johannesburg', taxRate: 15.0, taxMode: 'INCLUSIVE' },
  NG: { currency: 'NGN', timezone: 'Africa/Lagos', taxRate: 7.5, taxMode: 'INCLUSIVE' },
  GH: { currency: 'GHS', timezone: 'Africa/Accra', taxRate: 12.5, taxMode: 'INCLUSIVE' },
  EG: { currency: 'EGP', timezone: 'Africa/Cairo', taxRate: 14.0, taxMode: 'INCLUSIVE' },
  MA: { currency: 'MAD', timezone: 'Africa/Casablanca', taxRate: 20.0, taxMode: 'INCLUSIVE' },
  GB: { currency: 'GBP', timezone: 'Europe/London', taxRate: 20.0, taxMode: 'INCLUSIVE' },
  FR: { currency: 'EUR', timezone: 'Europe/Paris', taxRate: 20.0, taxMode: 'INCLUSIVE' },
  DE: { currency: 'EUR', timezone: 'Europe/Berlin', taxRate: 19.0, taxMode: 'INCLUSIVE' },
  IT: { currency: 'EUR', timezone: 'Europe/Rome', taxRate: 22.0, taxMode: 'INCLUSIVE' },
  ES: { currency: 'EUR', timezone: 'Europe/Madrid', taxRate: 21.0, taxMode: 'INCLUSIVE' },
  BE: { currency: 'EUR', timezone: 'Europe/Brussels', taxRate: 21.0, taxMode: 'INCLUSIVE' },
  NL: { currency: 'EUR', timezone: 'Europe/Amsterdam', taxRate: 21.0, taxMode: 'INCLUSIVE' },
  US: { currency: 'USD', timezone: 'America/New_York', taxRate: 0, taxMode: 'EXCLUSIVE' },
  CA: { currency: 'CAD', timezone: 'America/Toronto', taxRate: 5.0, taxMode: 'EXCLUSIVE' },
  AE: { currency: 'AED', timezone: 'Asia/Dubai', taxRate: 5.0, taxMode: 'INCLUSIVE' },
  SA: { currency: 'SAR', timezone: 'Asia/Riyadh', taxRate: 15.0, taxMode: 'INCLUSIVE' },
  QA: { currency: 'QAR', timezone: 'Asia/Qatar', taxRate: 0, taxMode: 'EXCLUSIVE' },
  IN: { currency: 'INR', timezone: 'Asia/Kolkata', taxRate: 18.0, taxMode: 'INCLUSIVE' },
  CN: { currency: 'CNY', timezone: 'Asia/Shanghai', taxRate: 13.0, taxMode: 'INCLUSIVE' },
  JP: { currency: 'JPY', timezone: 'Asia/Tokyo', taxRate: 10.0, taxMode: 'INCLUSIVE' },
  AU: { currency: 'AUD', timezone: 'Australia/Sydney', taxRate: 10.0, taxMode: 'INCLUSIVE' },
  BR: { currency: 'BRL', timezone: 'America/Sao_Paulo', taxRate: 17.0, taxMode: 'INCLUSIVE' },
  MX: { currency: 'MXN', timezone: 'America/Mexico_City', taxRate: 16.0, taxMode: 'INCLUSIVE' },
}

/** Rwanda defaults — used as fallback for unknown countries (backward compatibility) */
const RWANDA_DEFAULTS: CountryDefaults = COUNTRY_DEFAULTS.RW

/**
 * Get country-specific defaults for currency, timezone, and tax rate.
 * @param countryCode - ISO 3166-1 alpha-2 code (e.g. "RW", "KE", "US")
 * @returns CountryDefaults with currency, timezone, taxRate, and taxMode
 */
export function getCountryDefaults(countryCode: string): CountryDefaults {
  return COUNTRY_DEFAULTS[countryCode?.toUpperCase()] || RWANDA_DEFAULTS
}

/**
 * Get the default currency for a country.
 */
export function getCurrencyForCountry(countryCode: string): string {
  return getCountryDefaults(countryCode).currency
}

/**
 * Get the default timezone for a country.
 */
export function getTimezoneForCountry(countryCode: string): string {
  return getCountryDefaults(countryCode).timezone
}

/**
 * Get the default tax rate for a country.
 */
export function getTaxRateForCountry(countryCode: string): number {
  return getCountryDefaults(countryCode).taxRate
}

/**
 * Get the default tax mode for a country.
 */
export function getTaxModeForCountry(countryCode: string): 'INCLUSIVE' | 'EXCLUSIVE' {
  return getCountryDefaults(countryCode).taxMode
}

/**
 * Get all supported country codes.
 */
export function getSupportedCountries(): string[] {
  return Object.keys(COUNTRY_DEFAULTS)
}
