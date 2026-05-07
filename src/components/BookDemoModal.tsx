import { useState } from 'react'
import { X, Calendar, Building2, Phone, MessageSquare } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

interface BookDemoModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function BookDemoModal({ isOpen, onClose }: BookDemoModalProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    contact: '',
    message: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/growth/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit request')
      }

      setSuccess(true)
      setTimeout(() => {
        onClose()
        setSuccess(false)
        setFormData({ name: '', businessName: '', contact: '', message: '' })
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-imboni-blue to-blue-600 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {t('growth.book_demo', 'Book a Demo')}
              </h2>
              <p className="text-sm text-slate-500">
                {t('growth.demo_subtitle', 'Let\'s explore ImboniServe together')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="m-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-green-800 font-medium text-center">
              ✅ {t('growth.demo_success', 'Request submitted! We\'ll contact you soon.')}
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        {!success && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('common.name', 'Your Name')} *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue focus:border-transparent"
                placeholder={t('growth.name_placeholder', 'John Doe')}
              />
            </div>

            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                {t('growth.business_name', 'Business Name')} *
              </label>
              <input
                type="text"
                required
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue focus:border-transparent"
                placeholder={t('growth.business_placeholder', 'My Restaurant')}
              />
            </div>

            {/* Contact */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {t('growth.contact', 'Phone / WhatsApp')} *
              </label>
              <input
                type="text"
                required
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue focus:border-transparent"
                placeholder="+250 XXX XXX XXX"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                {t('growth.message', 'Message (Optional)')}
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue focus:border-transparent resize-none"
                placeholder={t('growth.message_placeholder', 'Tell us about your needs...')}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-imboni-blue to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('common.loading', 'Loading...') : t('growth.submit_request', 'Submit Request')}
            </button>

            <p className="text-xs text-slate-500 text-center">
              {t('growth.demo_privacy', 'We respect your privacy. Your information will only be used to contact you about the demo.')}
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
