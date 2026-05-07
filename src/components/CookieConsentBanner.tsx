import React from 'react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'
import { getConsent, setConsent, isDNTEnabled, ensureGlobalConsentCached, type ConsentPrefs } from '@/lib/consent'

export default function CookieConsentBanner() {
  const { t } = useTranslation()
  const [visible, setVisible] = React.useState(false)
  const [showPrefs, setShowPrefs] = React.useState(false)
  const [prefs, setPrefs] = React.useState<ConsentPrefs>({ functional: true, analytics: false, marketing: false })

  React.useEffect(() => {
    ensureGlobalConsentCached()
    const existing = getConsent()
    if (existing) {
      setPrefs(existing)
      setVisible(false)
      return
    }
    // Honor Do Not Track: default to all off (no non-essential)
    if (isDNTEnabled()) {
      const dntPrefs: ConsentPrefs = { functional: true, analytics: false, marketing: false }
      setConsent(dntPrefs)
      setPrefs(dntPrefs)
      setVisible(false)
      return
    }
    setVisible(true)
  }, [])

  // Allow opening preferences via global event, even if banner is hidden
  React.useEffect(() => {
    const openPrefs = () => {
      ensureGlobalConsentCached()
      const existing = getConsent()
      if (existing) setPrefs(existing)
      setShowPrefs(true)
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('im:consent:open-preferences', openPrefs)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('im:consent:open-preferences', openPrefs)
      }
    }
  }, [])

  const acceptAll = () => {
    const p: ConsentPrefs = { functional: true, analytics: true, marketing: true }
    setConsent(p)
    setPrefs(p)
    setVisible(false)
    setShowPrefs(false)
  }

  const rejectNonEssential = () => {
    const p: ConsentPrefs = { functional: true, analytics: false, marketing: false }
    setConsent(p)
    setPrefs(p)
    setVisible(false)
    setShowPrefs(false)
  }

  const savePreferences = () => {
    const safe = { ...prefs, functional: true }
    setConsent(safe)
    setPrefs(safe)
    setVisible(false)
    setShowPrefs(false)
  }

  if (!visible && !showPrefs) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4">
      <div className="max-w-5xl mx-auto rounded-2xl border border-slate-200 bg-white shadow-xl dark:bg-gray-900 dark:border-gray-700 p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {t('cookies.banner.text', 'We use cookies to enhance your experience, analyze usage, and show relevant content.')} {' '}
            <Link href="/cookies" className="font-medium text-imboni-blue hover:text-imboni-orange underline">
              {t('cookies.banner.learn_more', 'Learn more')}
            </Link>
            .
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPrefs(true)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-gray-700 bg-white hover:bg-slate-50 text-sm dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
            >
              {t('cookies.banner.manage', 'Manage preferences')}
            </button>
            <button
              onClick={rejectNonEssential}
              className="px-3 py-2 rounded-lg border border-slate-300 text-gray-700 bg-white hover:bg-slate-50 text-sm dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
            >
              {t('cookies.banner.reject', 'Reject non-essential')}
            </button>
            <button
              onClick={acceptAll}
              className="px-4 py-2 rounded-lg bg-imboni-orange text-white hover:bg-accent-dark text-sm"
            >
              {t('cookies.banner.accept', 'Accept all')}
            </button>
          </div>
        </div>
      </div>

      {showPrefs && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white dark:bg-gray-900 dark:border-gray-700 shadow-2xl p-5">
            <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-gray-100">
              {t('cookies.prefs.title', 'Cookie preferences')}
            </h3>
            <p className="text-sm text-slate-600 dark:text-gray-300 mb-4">
              {t('cookies.prefs.subtitle', 'Choose which categories you want to allow. You can change this later.')}
            </p>
            <div className="space-y-3">
              <label className="flex items-start gap-3 opacity-80 cursor-not-allowed">
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                />
                <div>
                  <div className="font-medium text-slate-900 dark:text-gray-100">{t('cookies.prefs.functional', 'Functional')}</div>
                  <div className="text-xs text-slate-500 dark:text-gray-400">{t('cookies.prefs.functional_desc', 'Enhance functionality like language and theme preferences. Always on.')}</div>
                </div>
              </label>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={prefs.analytics}
                  onChange={(e) => setPrefs((p) => ({ ...p, analytics: e.target.checked }))}
                />
                <div>
                  <div className="font-medium text-slate-900 dark:text-gray-100">{t('cookies.prefs.analytics', 'Analytics')}</div>
                  <div className="text-xs text-slate-500 dark:text-gray-400">{t('cookies.prefs.analytics_desc', 'Help us understand usage to improve the product.')}</div>
                </div>
              </label>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={prefs.marketing}
                  onChange={(e) => setPrefs((p) => ({ ...p, marketing: e.target.checked }))}
                />
                <div>
                  <div className="font-medium text-slate-900 dark:text-gray-100">{t('cookies.prefs.marketing', 'Marketing')}</div>
                  <div className="text-xs text-slate-500 dark:text-gray-400">{t('cookies.prefs.marketing_desc', 'Personalized offers and ads across services.')}</div>
                </div>
              </label>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button onClick={() => setShowPrefs(false)} className="px-3 py-2 rounded-lg border border-slate-300 text-gray-700 bg-white hover:bg-slate-50 text-sm dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600">
                {t('common.cancel', 'Cancel')}
              </button>
              <button onClick={savePreferences} className="px-4 py-2 rounded-lg bg-imboni-orange text-white hover:bg-accent-dark text-sm">
                {t('cookies.prefs.save', 'Save preferences')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
