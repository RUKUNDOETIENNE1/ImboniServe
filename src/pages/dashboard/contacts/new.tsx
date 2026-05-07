import { useState } from 'react'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/DashboardLayout'
import { useTranslation } from '@/lib/i18n'
import { ArrowLeft, Save, X } from 'lucide-react'
import Card from '@/components/ui/Card'
import Link from 'next/link'

export default function NewContactPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    alternatePhone: '',
    whatsappNumber: '',
    type: 'CLIENT',
    status: 'ACTIVE',
    role: '',
    jobTitle: '',
    address: '',
    city: '',
    district: '',
    country: 'RW',
    tags: '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const payload = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
      }

      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create contact')
      }

      const contact = await res.json()
      router.push(`/dashboard/contacts/${contact.id}`)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/contacts"
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {t('cms.contact.add', 'Add Contact')}
              </h1>
              <p className="text-sm text-slate-600">
                {t('cms.subtitle', 'Create a new contact in your network')}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              {t('cms.contact.profile', 'Basic Information')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('cms.contact.name', 'Contact Name')} *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('cms.contact.email', 'Email')}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('cms.contact.phone', 'Phone')} *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+250788123456"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('cms.contact.alternate_phone', 'Alternate Phone')}
                </label>
                <input
                  type="tel"
                  name="alternatePhone"
                  value={formData.alternatePhone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+250788999888"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('cms.contact.whatsapp', 'WhatsApp Number')}
                </label>
                <input
                  type="tel"
                  name="whatsappNumber"
                  value={formData.whatsappNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+250788123456"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('cms.contact.type', 'Contact Type')} *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="CLIENT">{t('cms.types.CLIENT', 'Client')}</option>
                  <option value="SUPPLIER">{t('cms.types.SUPPLIER', 'Supplier')}</option>
                  <option value="STAFF">{t('cms.types.STAFF', 'Staff')}</option>
                  <option value="CUSTOMER">{t('cms.types.CUSTOMER', 'Customer')}</option>
                  <option value="PARTNER">{t('cms.types.PARTNER', 'Partner')}</option>
                  <option value="LEAD">{t('cms.types.LEAD', 'Lead')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('cms.contact.status', 'Status')}
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ACTIVE">{t('cms.status.ACTIVE', 'Active')}</option>
                  <option value="INACTIVE">{t('cms.status.INACTIVE', 'Inactive')}</option>
                  <option value="LEAD">{t('cms.status.LEAD', 'Lead')}</option>
                  <option value="BLOCKED">{t('cms.status.BLOCKED', 'Blocked')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('cms.contact.role', 'Role')}
                </label>
                <input
                  type="text"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Manager, Owner, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('cms.contact.job_title', 'Job Title')}
                </label>
                <input
                  type="text"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Procurement Manager"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              {t('cms.contact.address', 'Location Information')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('cms.contact.address', 'Address')}
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="KG 123 St, Kimihurura"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('cms.contact.city', 'City')}
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Kigali"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('cms.contact.district', 'District')}
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Gasabo"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              {t('cms.contact.notes', 'Additional Information')}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('cms.contact.tags', 'Tags')}
                  <span className="text-xs text-slate-500 ml-2">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="vip, kigali, restaurant"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('cms.contact.notes', 'Notes')}
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional notes about this contact..."
                />
              </div>
            </div>
          </Card>

          <div className="flex items-center justify-end gap-4">
            <Link
              href="/dashboard/contacts"
              className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              <X className="w-5 h-5" />
              {t('cancel', 'Cancel')}
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-imboni-blue text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {loading ? t('loading', 'Loading...') : t('save', 'Save Contact')}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
