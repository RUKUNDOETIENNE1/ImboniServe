import { useTranslation, type Locale } from '@/lib/i18n'
import { Globe } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/router'

export default function LanguageSwitcher() {
  const router = useRouter()
  const { locale, changeLocale, t } = useTranslation()
  const [open, setOpen] = useState(false)

  const languages: { code: Locale; name: string; flag: string }[] = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'rw', name: 'Kinyarwanda', flag: '🇷🇼' },
  ]

  const onChange = (code: Locale) => {
    changeLocale(code)
    // Navigate to same route with new locale; let Next compute the URL
    router.push({ pathname: router.pathname, query: router.query }, undefined, { locale: code })
    setOpen(false)
  }

  const current = languages.find(l => l.code === locale) || languages[0]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 min-w-[100px] rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title={t('topbar.language', 'Language')}
      >
        <Globe className="w-5 h-5" />
        <span className="text-sm font-medium">{current.code.toUpperCase()}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          {languages.map(l => (
            <button
              key={l.code}
              onClick={() => onChange(l.code)}
              className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white flex items-center gap-2 ${l.code === locale ? 'bg-teal-50 dark:bg-gray-700/60' : ''}`}
            >
              <span>{l.flag}</span>
              <span className="text-sm">{l.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
