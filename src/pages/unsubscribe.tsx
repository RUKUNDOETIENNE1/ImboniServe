import React, { useState } from 'react'
import PublicLayout from '@/components/PublicLayout'
import { useTranslation } from '@/lib/i18n'

export default function UnsubscribePage() {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setError(null)
    try {
      const r = await fetch('/api/growth/newsletter-unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone: value.trim() })
      })
      const data = await r.json()
      if (!r.ok || !data.success) throw new Error(data.error || 'Failed to unsubscribe')
      setMessage(t('newsletter.unsubscribed', 'You have been unsubscribed. Sorry to see you go!'))
      setValue('')
    } catch (err: any) {
      setError(err?.message || t('newsletter.unsubscribe_failed', 'We could not process your request. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <PublicLayout title={t('newsletter.unsubscribe_title', 'Unsubscribe — Imboni Serve')}>
      <div className="bg-imboni-light py-12 px-4">
        <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h1 className="text-2xl font-bold text-imboni-blue mb-2" suppressHydrationWarning>
            {t('newsletter.unsubscribe_heading', 'Unsubscribe from Newsletter')}
          </h1>
          <p className="text-gray-600 mb-4" suppressHydrationWarning>
            {t('newsletter.unsubscribe_sub', 'Enter the email or phone number you used to subscribe.')}
          </p>

          <form onSubmit={onSubmit} className="space-y-3">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={t('newsletter.email_or_phone', 'Email or phone') as string}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-imboni-blue focus:border-transparent"
              required
            />
            <button
              type="submit"
              disabled={loading || !value.trim()}
              className="w-full bg-imboni-blue text-white font-medium py-2.5 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? t('newsletter.processing', 'Processing...') : t('newsletter.unsubscribe_cta', 'Unsubscribe')}
            </button>
          </form>

          {message && (<p className="mt-3 text-green-700 bg-green-50 border border-green-200 rounded-md p-2" suppressHydrationWarning>{message}</p>)}
          {error && (<p className="mt-3 text-red-700 bg-red-50 border border-red-200 rounded-md p-2" suppressHydrationWarning>{error}</p>)}
        </div>
      </div>
    </PublicLayout>
  )
}
