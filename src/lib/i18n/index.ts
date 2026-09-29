/**
 * i18n Configuration
 * Manages translations for English, French, and Kinyarwanda
 */

import en from '@/locales/en.json'
import fr from '@/locales/fr.json'
import rw from '@/locales/rw.json'

export type Locale = 'en' | 'fr' | 'rw'

export const locales: Locale[] = ['en', 'fr', 'rw']

export const translations = {
  en,
  fr,
  rw
}

export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  rw: 'Kinyarwanda'
}

/**
 * Get translation for a given key and locale
 * Supports nested keys using dot notation (e.g., 'homepage.hero.title')
 */
export function getTranslation(
  locale: Locale,
  key: string,
  paramsOrFallback?: Record<string, string> | string,
  maybeParams?: Record<string, string>
): string {
  const keys = key.split('.')
  let value: any = translations[locale]

  for (const k of keys) {
    value = value?.[k]
  }

  // If translation not found, try fallback to English
  if (value === undefined && locale !== 'en') {
    let fb: any = translations.en
    for (const k of keys) {
      fb = fb?.[k]
    }
    value = fb
  }

  // If still not found, use explicit fallback string if provided
  const explicitFallback = typeof paramsOrFallback === 'string' ? paramsOrFallback : undefined
  if (value === undefined && explicitFallback !== undefined) {
    return explicitFallback
  }

  // If still not found, return the key itself
  if (value === undefined) {
    return key
  }

  // Replace parameters if provided
  const params = (typeof paramsOrFallback === 'object' && paramsOrFallback !== null)
    ? paramsOrFallback
    : (maybeParams || undefined)
  if (params && typeof value === 'string') {
    Object.entries(params).forEach(([pkey, val]) => {
      value = value.replace(`{{${pkey}}}`, String(val))
    })
  }

  return value
}
