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
export function getTranslation(locale: Locale, key: string, params?: Record<string, string>): string {
  const keys = key.split('.')
  let value: any = translations[locale]
  
  for (const k of keys) {
    value = value?.[k]
  }
  
  // If translation not found, try fallback to English
  if (value === undefined && locale !== 'en') {
    let fallback: any = translations.en
    for (const k of keys) {
      fallback = fallback?.[k]
    }
    value = fallback
  }
  
  // If still not found, return the key itself
  if (value === undefined) {
    return key
  }
  
  // Replace parameters if provided
  if (params && typeof value === 'string') {
    Object.entries(params).forEach(([key, val]) => {
      value = value.replace(`{{${key}}}`, val)
    })
  }
  
  return value
}
