import { useState } from 'react'
import { Mail, Send, Check } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

interface NewsletterSignupProps {
  sourcePage?: string
  variant?: 'footer' | 'inline'
}

export default function NewsletterSignup({ sourcePage = 'unknown', variant = 'footer' }: NewsletterSignupProps) {
  const { t } = useTranslation()
  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/growth/newsletter-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone, sourcePage })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to subscribe')
      }

      setSuccess(true)
      setEmailOrPhone('')
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (variant === 'footer') {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-imboni-blue" />
          <h3 className="font-semibold text-slate-800">
            {t('growth.newsletter_title', 'Stay Updated')}
          </h3>
        </div>
        <p className="text-sm text-slate-600">
          {t('growth.newsletter_subtitle', 'Get the latest updates and offers')}
        </p>
        
        {success ? (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-800 font-medium">
              {t('growth.newsletter_success', 'Subscribed successfully!')}
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder={t('growth.newsletter_placeholder', 'Email or phone')}
                className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue focus:border-transparent text-sm"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2.5 bg-gradient-to-r from-imboni-blue to-blue-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            {error && (
              <p className="text-xs text-red-600">{error}</p>
            )}
          </form>
        )}
      </div>
    )
  }

  // Inline variant
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-imboni-blue to-blue-600 flex items-center justify-center">
          <Mail className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-lg">
            {t('growth.newsletter_title', 'Stay Updated')}
          </h3>
          <p className="text-sm text-slate-600">
            {t('growth.newsletter_subtitle', 'Get the latest updates and offers')}
          </p>
        </div>
      </div>

      {success ? (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl">
          <Check className="w-5 h-5 text-green-600" />
          <span className="text-sm text-green-800 font-medium">
            {t('growth.newsletter_success', 'Subscribed successfully!')}
          </span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={emailOrPhone}
            onChange={(e) => setEmailOrPhone(e.target.value)}
            placeholder={t('growth.newsletter_placeholder', 'Email or phone')}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue focus:border-transparent"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-imboni-blue to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {loading ? t('common.loading', 'Loading...') : t('growth.subscribe', 'Subscribe')}
          </button>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </form>
      )}
    </div>
  )
}
