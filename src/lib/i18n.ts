import { useState, useEffect } from 'react'
import enTranslations from '@/locales/en.json'
import frTranslations from '@/locales/fr.json'
import rwTranslations from '@/locales/rw.json'

export type Locale = 'en' | 'rw' | 'fr'

const translations: Record<Locale, any> = {
  en: enTranslations as any,
  rw: rwTranslations as any,
  fr: frTranslations as any,
}

let currentLocale: Locale = 'en'
const listeners: Set<(locale: Locale) => void> = new Set()

export async function loadTranslations(locale: Locale): Promise<void> {
  try {
    if (locale === 'en') translations.en = enTranslations as any
    else if (locale === 'fr') translations.fr = frTranslations as any
    else if (locale === 'rw') translations.rw = rwTranslations as any
  } catch (error) {
    console.error(`Failed to load translations for ${locale}:`, error)
  }
}

export function setLocale(locale: Locale): void {
  currentLocale = locale
  if (typeof window !== 'undefined') {
    localStorage.setItem('locale', locale)
    try {
      if (document?.documentElement) {
        document.documentElement.lang = locale
      }
    } catch {}
  }
  // Notify all listeners about locale change
  listeners.forEach(listener => listener(locale))
}

export function getLocale(): Locale {
  if (typeof window !== 'undefined') {
    // 1) Prefer the <html lang> attribute which we keep in sync via setLocale
    try {
      const htmlLang = document?.documentElement?.getAttribute('lang') as Locale | null
      if (htmlLang && (htmlLang === 'en' || htmlLang === 'rw' || htmlLang === 'fr')) {
        return htmlLang
      }
    } catch {}

    // 2) Fallback to user's last choice
    try {
      const stored = localStorage.getItem('locale') as Locale | null
      if (stored && (stored === 'en' || stored === 'rw' || stored === 'fr')) {
        return stored
      }
    } catch {}

    // 3) As a last resort on first load, read Next.js' initial SSR locale
    const nextDataLocale = (window as any)?.__NEXT_DATA__?.locale as Locale | undefined
    if (nextDataLocale && (nextDataLocale === 'en' || nextDataLocale === 'rw' || nextDataLocale === 'fr')) {
      return nextDataLocale
    }
  }
  return currentLocale
}

function translateFor(locale: Locale, key: string, fallback?: string): string {
  const keys = key.split('.')
  let value: any = translations[locale]
  
  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k]
    } else {
      if (process.env.NODE_ENV === 'production') {
        try { console.warn(`[i18n] Missing translation path: ${key} for locale: ${locale}`) } catch {}
      }
      return fallback || key
    }
  }
  
  if (typeof value === 'string') return value
  if (process.env.NODE_ENV === 'production') {
    try { console.warn(`[i18n] Missing translation key: ${key} for locale: ${locale}`) } catch {}
  }
  return fallback || key
}

export function t(key: string, fallback?: string): string {
  // Backward-compatible global translation using the effective locale
  const locale = getLocale()
  return translateFor(locale, key, fallback)
}

export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>(() => getLocale())
  const [, forceUpdate] = useState(0)

  // Load translations on mount and when locale changes
  useEffect(() => {
    const currentLocale = getLocale()
    if (currentLocale !== locale) {
      setLocaleState(currentLocale)
    }
    loadTranslations(currentLocale)
  }, [locale])

  useEffect(() => {
    // Subscribe to locale changes
    const listener = (newLocale: Locale) => {
      setLocaleState(newLocale)
      forceUpdate(prev => prev + 1)
    }
    listeners.add(listener)

    // Load initial translations with SSR-safe locale
    const initialLocale = getLocale()
    loadTranslations(initialLocale)

    return () => {
      listeners.delete(listener)
    }
  }, [])

  const changeLocale = (newLocale: Locale) => {
    setLocale(newLocale)
    loadTranslations(newLocale)
  }

  return {
    // Bind t() to the current hook locale so client language switches work
    t: (key: string, fallback?: string) => translateFor(locale, key, fallback),
    locale,
    changeLocale
  }
}
