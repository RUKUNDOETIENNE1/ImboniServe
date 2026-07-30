/**
 * useTranslation Hook
 * React hook for accessing translations in components
 */

import { useRouter } from 'next/router'
import { getTranslation, type Locale, defaultLocale } from './index'

export function useTranslation() {
  const router = useRouter()
  const locale = (router.locale || defaultLocale) as Locale
  
  /**
   * Translate a key with optional parameters
   * @param key - Translation key (e.g., 'homepage.hero.title')
   * @param paramsOrFallback - Optional params object OR explicit fallback string
   * @param maybeParams - Optional params object when second argument is a fallback string
   */
  const t = (
    key: string,
    paramsOrFallback?: Record<string, string> | string,
    maybeParams?: Record<string, string>
  ): string => {
    return getTranslation(locale, key, paramsOrFallback as any, maybeParams)
  }
  
  /**
   * Change the current locale
   */
  const changeLocale = (newLocale: Locale) => {
    router.push(router.pathname, router.asPath, { locale: newLocale })
  }
  
  return { 
    t, 
    locale, 
    changeLocale 
  }
}
