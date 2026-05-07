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
   * @param params - Optional parameters to replace in translation (e.g., { name: 'John' })
   */
  const t = (key: string, params?: Record<string, string>): string => {
    return getTranslation(locale, key, params)
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
