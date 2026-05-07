import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/i18n'

interface TranslationCache {
  [key: string]: {
    [lang: string]: string
  }
}

// Simple in-memory cache to avoid repeated API calls
const translationCache: TranslationCache = {}

export function useMenuTranslation() {
  const { locale } = useTranslation()
  const [isTranslating, setIsTranslating] = useState(false)

  /**
   * Translate menu item text to user's preferred language
   * Uses cache to avoid repeated API calls
   * Falls back to original text if translation fails
   */
  const translateText = async (text: string, targetLang: string = locale): Promise<string> => {
    if (!text) return text

    // Return original if already in target language or no translation needed
    if (targetLang === 'en') return text

    // Check cache first
    const cacheKey = `${text}:${targetLang}`
    if (translationCache[text]?.[targetLang]) {
      return translationCache[text][targetLang]
    }

    setIsTranslating(true)
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang })
      })

      if (res.ok) {
        const { translated } = await res.json()
        
        // Cache the result
        if (!translationCache[text]) {
          translationCache[text] = {}
        }
        translationCache[text][targetLang] = translated

        return translated
      }
    } catch (error) {
      console.error('Translation error:', error)
    } finally {
      setIsTranslating(false)
    }

    // Fallback to original text
    return text
  }

  /**
   * Translate menu item object
   * Preserves original data, only translates display fields
   */
  const translateMenuItem = async (item: any) => {
    if (!item) return item

    const translated = { ...item }

    if (item.name) {
      translated.nameTranslated = await translateText(item.name)
    }

    if (item.description) {
      translated.descriptionTranslated = await translateText(item.description)
    }

    if (item.category) {
      translated.categoryTranslated = await translateText(item.category)
    }

    return translated
  }

  /**
   * Batch translate multiple menu items
   * More efficient than translating one by one
   */
  const translateMenuItems = async (items: any[]) => {
    if (!items || items.length === 0) return items

    const promises = items.map(item => translateMenuItem(item))
    return await Promise.all(promises)
  }

  return {
    translateText,
    translateMenuItem,
    translateMenuItems,
    isTranslating,
    currentLanguage: locale
  }
}
