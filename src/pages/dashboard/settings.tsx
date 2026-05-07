import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import CurrencyDisplay from '@/components/CurrencyDisplay'
import { Building, User, Bell, CreditCard, Save, Lock, Mail, Phone, MapPin, FileText, MessageCircle } from 'lucide-react'
import { useToast } from '@/components/Toast'
import { useTranslation } from '@/lib/i18n'

export default function Settings() {
  const { t } = useTranslation()
  const { data: session, status } = useSession()
  const { showToast } = useToast()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('profile')
  const [selectedTemplate, setSelectedTemplate] = useState('MINIMAL')
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [whatsappSettings, setWhatsappSettings] = useState({
    ownerReportsEnabled: true,
    clientSlipsEnabled: false,
    dailyCapClient: 50
  })
  const [savingWhatsapp, setSavingWhatsapp] = useState(false)
  const [businessSettings, setBusinessSettings] = useState({
    currency: 'RWF',
    taxMode: 'EXCLUSIVE' as 'INCLUSIVE' | 'EXCLUSIVE',
    taxRate: 18.0
  })
  const [savingBusiness, setSavingBusiness] = useState(false)
  const [businessId, setBusinessId] = useState<string | null>(null)

  useEffect(() => {
    if (activeTab === 'slips') {
      fetchTemplate()
    }
    if (activeTab === 'whatsapp') {
      fetchWhatsappSettings()
    }
    if (activeTab === 'restaurant') {
      fetchBusinessSettings()
    }
  }, [activeTab])

  // Fetch business ID when session is ready
  useEffect(() => {
    const fetchBusinessId = async () => {
      try {
        const response = await fetch('/api/business/current')
        if (response.ok) {
          const data = await response.json()
          setBusinessId(data.id)
        }
      } catch (error) {
        console.error('Failed to fetch business ID:', error)
      }
    }
    if (status === 'authenticated' && session?.user) {
      fetchBusinessId()
    }
  }, [status, session])

  // Read tab from query (?tab=billing) and switch tab on mount/update
  useEffect(() => {
    if (!router.isReady) return
    const tab = String(router.query.tab || '')
    const allowed = ['profile','restaurant','notifications','billing','slips','whatsapp','privacy']
    if (tab && allowed.includes(tab)) {
      setActiveTab(tab)
    }
  }, [router.isReady, router.query.tab])

  // If navigated with #invoices, scroll to section once billing tab is active
  useEffect(() => {
    if (!router.isReady) return
    if (activeTab !== 'billing') return
    if (!router.asPath.includes('#invoices')) return
    // Wait for DOM to paint billing tab content
    const id = setTimeout(() => {
      const el = document.getElementById('invoices')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
    return () => clearTimeout(id)
  }, [activeTab, router.isReady, router.asPath])

  const fetchTemplate = async () => {
    try {
      const response = await fetch('/api/smart-dining-slips/template')
      const data = await response.json()
      setSelectedTemplate(data.template?.templateType || 'MINIMAL')
    } catch (error) {
      console.error('Failed to fetch template')
    }
  }

  const saveTemplate = async () => {
    setSavingTemplate(true)
    try {
      const response = await fetch('/api/smart-dining-slips/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateType: selectedTemplate }),
      })

      if (response.ok) {
        showToast('success', 'Template updated successfully')
      } else {
        showToast('error', 'Failed to update template')
      }
    } catch (error) {
      showToast('error', 'Failed to update template')
    } finally {
      setSavingTemplate(false)
    }
  }

  const fetchWhatsappSettings = async () => {
    try {
      const response = await fetch('/api/settings/whatsapp')
      const data = await response.json()
      if (data.settings) {
        setWhatsappSettings({
          ownerReportsEnabled: data.settings.whatsappOwnerReportsEnabled,
          clientSlipsEnabled: data.settings.whatsappClientSlipsEnabled,
          dailyCapClient: data.settings.whatsappDailyCapClient
        })
      }
    } catch (error) {
      console.error('Failed to fetch WhatsApp settings')
    }
  }

  const saveWhatsappSettings = async () => {
    setSavingWhatsapp(true)
    try {
      const response = await fetch('/api/settings/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(whatsappSettings),
      })

      if (response.ok) {
        showToast('success', 'WhatsApp settings updated successfully')
      } else {
        showToast('error', 'Failed to update WhatsApp settings')
      }
    } catch (error) {
      showToast('error', 'Failed to update WhatsApp settings')
    } finally {
      setSavingWhatsapp(false)
    }
  }

  const fetchBusinessSettings = async () => {
    if (!businessId) return
    try {
      const response = await fetch(`/api/business/${businessId}/settings`)
      if (response.ok) {
        const data = await response.json()
        setBusinessSettings({
          currency: data.currency || 'RWF',
          taxMode: data.taxMode || 'EXCLUSIVE',
          taxRate: data.taxRate || 18.0
        })
      }
    } catch (error) {
      console.error('Failed to fetch business settings:', error)
    }
  }

  const saveBusinessSettings = async () => {
    if (!businessId) {
      showToast('error', 'Business ID not found')
      return
    }
    setSavingBusiness(true)
    try {
      const response = await fetch(`/api/business/${businessId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(businessSettings),
      })

      if (response.ok) {
        showToast('success', 'Business settings updated successfully')
        // Reload page to apply currency changes app-wide
        setTimeout(() => window.location.reload(), 1000)
      } else {
        const data = await response.json()
        showToast('error', data.error || 'Failed to update business settings')
      }
    } catch (error) {
      showToast('error', 'Failed to update business settings')
    } finally {
      setSavingBusiness(false)
    }
  }

  const resetCookieConsent = () => {
    try {
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
      const common = 'path=/; SameSite=Lax'
      document.cookie = `im_cookie_prefs=; max-age=0; ${common}` + (isHttps ? '; Secure' : '')
      document.cookie = `im_cookie_consent=; max-age=0; ${common}` + (isHttps ? '; Secure' : '')
      if (typeof window !== 'undefined') {
        ;(window as any).__im_consent = undefined
        window.dispatchEvent(new CustomEvent('im:consent:updated', { detail: { functional: true, analytics: false, marketing: false } }))
        window.dispatchEvent(new Event('im:consent:open-preferences'))
      }
      showToast('success', 'Cookie consent has been reset')
    } catch {
      showToast('error', 'Failed to reset cookie consent')
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">{t('dashboard.settings.title', 'Settings')}</h1>
        <p className="text-sm text-slate-500 mt-1">{t('dashboard.settings.subtitle', 'Manage your account and business settings')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 space-y-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${
                activeTab === 'profile'
                  ? 'bg-gradient-to-r from-imboni-blue to-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <User className="w-5 h-5 mr-3" />
              {t('dashboard.settings.profile', 'Profile')}
            </button>
            <button
              onClick={() => setActiveTab('restaurant')}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${
                activeTab === 'restaurant'
                  ? 'bg-gradient-to-r from-imboni-blue to-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Building className="w-5 h-5 mr-3" />
              {t('dashboard.settings.business', 'Business')}
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${
                activeTab === 'notifications'
                  ? 'bg-gradient-to-r from-imboni-blue to-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Bell className="w-5 h-5 mr-3" />
              {t('dashboard.settings.notifications', 'Notifications')}
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${
                activeTab === 'billing'
                  ? 'bg-gradient-to-r from-imboni-blue to-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <CreditCard className="w-5 h-5 mr-3" />
              Billing
            </button>
            <button
              onClick={() => setActiveTab('slips')}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${
                activeTab === 'slips'
                  ? 'bg-gradient-to-r from-imboni-blue to-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-5 h-5 mr-3" />
              Smart Dining Slips™
            </button>
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${
                activeTab === 'whatsapp'
                  ? 'bg-gradient-to-r from-imboni-blue to-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <MessageCircle className="w-5 h-5 mr-3" />
              WhatsApp Policy
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${
                activeTab === 'privacy'
                  ? 'bg-gradient-to-r from-imboni-blue to-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Lock className="w-5 h-5 mr-3" />
              {t('dashboard.settings.privacy', 'Privacy')}
            </button>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8">
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-6">{t('dashboard.settings.profile_settings', 'Profile Settings')}</h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">{t('dashboard.settings.full_name', 'Full Name')}</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          defaultValue={session?.user?.name || ''}
                          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">{t('dashboard.settings.email_address', 'Email Address')}</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <input
                          type="email"
                          defaultValue={session?.user?.email || ''}
                          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl bg-slate-50"
                          disabled
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{t('dashboard.settings.email_cannot_change', 'Email cannot be changed')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">{t('dashboard.settings.phone_number', 'Phone Number')}</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <input
                          type="tel"
                          placeholder="+250 788 123 456"
                          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Kigali, Rwanda"
                          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('dashboard.settings.change_password', 'Change Password')}</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t('dashboard.settings.current_password', 'Current Password')}</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                          <input
                            type="password"
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">{t('dashboard.settings.new_password', 'New Password')}</label>
                          <input
                            type="password"
                            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">{t('dashboard.settings.confirm_password', 'Confirm Password')}</label>
                          <input
                            type="password"
                            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button className="bg-gradient-to-r from-imboni-blue to-blue-600 text-white px-6 py-2.5 rounded-xl hover:shadow-lg hover:shadow-blue-200 flex items-center transition-all">
                      <Save className="w-4 h-4 mr-2" />
                      {t('common.save_changes', 'Save Changes')}
                    </button>
                    <button className="bg-slate-100 text-slate-700 px-6 py-2.5 rounded-xl hover:bg-slate-200 transition-colors">
                      {t('common.cancel', 'Cancel')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'restaurant' && (
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-6">{t('dashboard.settings.business_settings', 'Business Settings')}</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('dashboard.settings.business_name', 'Business Name')}</label>
                    <input
                      type="text"
                      placeholder="Nyama Cafe Kigali"
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">{t('dashboard.settings.cuisine_type', 'Cuisine Type')}</label>
                      <select className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue">
                        <option>{t('dashboard.settings.cuisine_african', 'African')}</option>
                        <option>{t('dashboard.settings.cuisine_international', 'International')}</option>
                        <option>{t('dashboard.settings.cuisine_fast_food', 'Fast Food')}</option>
                        <option>{t('dashboard.settings.cuisine_fine_dining', 'Fine Dining')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">{t('dashboard.settings.number_of_tables', 'Number of Tables')}</label>
                      <input
                        type="number"
                        placeholder="8"
                        className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('dashboard.settings.operating_hours', 'Operating Hours')}</label>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="time"
                        defaultValue="08:00"
                        className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
                      />
                      <input
                        type="time"
                        defaultValue="22:00"
                        className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('dashboard.settings.currency_tax', 'Currency & Tax Settings')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t('dashboard.settings.currency', 'Currency')}</label>
                        <select
                          value={businessSettings.currency}
                          onChange={(e) => setBusinessSettings({ ...businessSettings, currency: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
                        >
                          <option value="RWF">RWF - Rwandan Franc</option>
                          <option value="USD">USD - US Dollar</option>
                          <option value="EUR">EUR - Euro</option>
                          <option value="GBP">GBP - British Pound</option>
                          <option value="KES">KES - Kenyan Shilling</option>
                          <option value="UGX">UGX - Ugandan Shilling</option>
                          <option value="TZS">TZS - Tanzanian Shilling</option>
                          <option value="ZAR">ZAR - South African Rand</option>
                        </select>
                        <p className="text-xs text-slate-500 mt-1">{t('dashboard.settings.currency_hint', 'This will be used throughout the application')}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t('dashboard.settings.tax_mode', 'Tax Mode')}</label>
                        <select
                          value={businessSettings.taxMode}
                          onChange={(e) => setBusinessSettings({ ...businessSettings, taxMode: e.target.value as 'INCLUSIVE' | 'EXCLUSIVE' })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
                        >
                          <option value="EXCLUSIVE">{t('dashboard.settings.tax_exclusive', 'Tax Exclusive')}</option>
                          <option value="INCLUSIVE">{t('dashboard.settings.tax_inclusive', 'Tax Inclusive')}</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-slate-700 mb-2">{t('dashboard.settings.tax_rate', 'Tax Rate (%)')}</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={businessSettings.taxRate}
                        onChange={(e) => setBusinessSettings({ ...businessSettings, taxRate: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
                      />
                    </div>
                  </div>

                  <button
                    onClick={saveBusinessSettings}
                    disabled={savingBusiness}
                    className="bg-gradient-to-r from-imboni-blue to-blue-600 text-white px-6 py-2.5 rounded-xl hover:shadow-lg hover:shadow-blue-200 flex items-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {savingBusiness ? t('common.saving', 'Saving...') : t('dashboard.settings.save_business', 'Save Business Settings')}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-6">{t('dashboard.settings.notification_settings', 'Notification Settings')}</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-medium text-slate-800">Low Stock Alerts</p>
                      <p className="text-sm text-slate-500">Get notified when inventory is running low</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-imboni-blue"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-medium text-slate-800">Daily Sales Summary</p>
                      <p className="text-sm text-slate-500">Receive daily sales reports via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-imboni-blue"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-medium text-slate-800">WhatsApp Notifications</p>
                      <p className="text-sm text-slate-500">Get updates via WhatsApp</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-imboni-blue"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Billing & Subscription</h2>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-blue-700 mb-1">Current Plan</p>
                      <p className="text-3xl font-bold text-blue-900">Growth</p>
                    </div>
                    <span className="px-3 py-1 bg-green-500/20 text-green-700 rounded-full text-sm font-medium">Active</span>
                  </div>
                  <p className="text-sm text-blue-800 mb-2"><CurrencyDisplay amount={10000} /> / month (annual billing)</p>
                  <p className="text-xs text-green-700 font-medium">💰 Save 25% with annual billing</p>
                </div>
                <div className="space-y-4" id="invoices">
                  <a href="/pricing" className="inline-block bg-gradient-to-r from-imboni-orange to-orange-500 text-white px-6 py-2.5 rounded-xl hover:shadow-lg hover:shadow-orange-200 transition-all">
                    Upgrade Plan
                  </a>
                  <button className="ml-3 inline-block bg-slate-100 text-slate-700 px-6 py-2.5 rounded-xl hover:bg-slate-200 transition-colors">
                    View Invoices
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'slips' && (
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Smart Dining Slip™ Template</h2>
                <p className="text-slate-600 mb-6">
                  Choose how your Smart Dining Slips™ will look when sent to customers.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div
                    onClick={() => setSelectedTemplate('MINIMAL')}
                    className={`cursor-pointer border-2 rounded-2xl p-6 transition-all ${
                      selectedTemplate === 'MINIMAL'
                        ? 'border-blue-600 bg-blue-50 shadow-lg'
                        : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-slate-800">Minimal</h3>
                      {selectedTemplate === 'MINIMAL' && (
                        <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-medium">
                          Selected
                        </span>
                      )}
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4 text-xs">
                      <div className="font-bold mb-2">Business Name</div>
                      <div className="border-b border-slate-200 mb-2 pb-2">
                        <div className="flex justify-between">
                          <span>Item</span>
                          <span>Price</span>
                        </div>
                      </div>
                      <div className="text-slate-600">Clean, simple design</div>
                    </div>
                    <p className="text-sm text-slate-600">
                      Perfect for cafés, fast food, and high-volume businesses. WhatsApp-friendly.
                    </p>
                  </div>

                  <div
                    onClick={() => setSelectedTemplate('PREMIUM')}
                    className={`cursor-pointer border-2 rounded-2xl p-6 transition-all ${
                      selectedTemplate === 'PREMIUM'
                        ? 'border-blue-600 bg-blue-50 shadow-lg'
                        : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-slate-800">Premium Dining</h3>
                      {selectedTemplate === 'PREMIUM' && (
                        <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-medium">
                          Selected
                        </span>
                      )}
                    </div>
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-yellow-600 rounded-lg p-4 mb-4 text-xs text-white">
                      <div className="font-bold mb-2 text-yellow-500">Business Name</div>
                      <div className="border-b border-yellow-600/30 mb-2 pb-2">
                        <div className="flex justify-between">
                          <span>Item</span>
                          <span className="text-yellow-500">Price</span>
                        </div>
                      </div>
                      <div className="text-slate-300">Elegant design</div>
                    </div>
                    <p className="text-sm text-slate-600">
                      Ideal for hotels, lounges, and fine dining. Dark theme with gold accents.
                    </p>
                  </div>

                  <div
                    onClick={() => setSelectedTemplate('LOCAL')}
                    className={`cursor-pointer border-2 rounded-2xl p-6 transition-all ${
                      selectedTemplate === 'LOCAL'
                        ? 'border-blue-600 bg-blue-50 shadow-lg'
                        : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-slate-800">Local / Casual</h3>
                      {selectedTemplate === 'LOCAL' && (
                        <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-medium">
                          Selected
                        </span>
                      )}
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-500 rounded-lg p-4 mb-4 text-xs">
                      <div className="font-bold mb-2 text-orange-600">Business Name</div>
                      <div className="border-b-2 border-orange-500 mb-2 pb-2">
                        <div className="flex justify-between">
                          <span>Icyariye</span>
                          <span className="text-orange-600 font-bold">Igiciro</span>
                        </div>
                      </div>
                      <div className="text-orange-700">Murakoze 🙏</div>
                    </div>
                    <p className="text-sm text-slate-600">
                      For local businesses and grills. Warm colors, Kinyarwanda support, friendly vibe.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={saveTemplate}
                    disabled={savingTemplate}
                    className="flex items-center gap-2 bg-gradient-to-r from-imboni-blue to-blue-600 text-white px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                    {savingTemplate ? 'Saving...' : 'Save Template'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'whatsapp' && (
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">WhatsApp Messaging Policy</h2>
                <p className="text-sm text-slate-500 mb-6">
                  Control how WhatsApp messaging is used in your business. Owner reports are always enabled by default.
                </p>

                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-slate-800">Owner Reports via WhatsApp</h3>
                          <span className="px-2 py-1 bg-blue-600 text-white rounded-full text-xs font-medium">Recommended</span>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">
                          Receive daily summaries, weekly reports, low stock alerts, and operational notifications.
                          This helps you stay on top of your business.
                        </p>
                        <ul className="text-sm text-slate-600 space-y-1">
                          <li>✓ Daily sales summaries</li>
                          <li>✓ Weekly performance reports</li>
                          <li>✓ Low stock alerts</li>
                          <li>✓ Cash flow notifications</li>
                        </ul>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={whatsappSettings.ownerReportsEnabled}
                          onChange={(e) => setWhatsappSettings({ ...whatsappSettings, ownerReportsEnabled: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-slate-800">Client Smart Dining Slips™ via WhatsApp</h3>
                          <span className="px-2 py-1 bg-slate-600 text-white rounded-full text-xs font-medium">Opt-in</span>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">
                          Send Smart Dining Slips™ to customers via WhatsApp with PDF attachment and referral link.
                          <strong> Requires explicit customer consent at checkout.</strong>
                        </p>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                          <p className="text-xs text-yellow-800">
                            <strong>⚠️ Cost & Compliance:</strong> Each message costs ~<CurrencyDisplay amount={50} />. Consent must be collected and logged.
                            Daily cap prevents runaway costs.
                          </p>
                        </div>
                        <ul className="text-sm text-slate-600 space-y-1">
                          <li>✓ PDF slip with itemized bill</li>
                          <li>✓ Referral link for customer rewards</li>
                          <li>✓ QR code fallback if disabled</li>
                          <li>✓ Consent tracking and audit logs</li>
                        </ul>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={whatsappSettings.clientSlipsEnabled}
                          onChange={(e) => setWhatsappSettings({ ...whatsappSettings, clientSlipsEnabled: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    {whatsappSettings.clientSlipsEnabled && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Daily Client Message Cap
                        </label>
                        <input
                          type="number"
                          min="10"
                          max="500"
                          value={whatsappSettings.dailyCapClient}
                          onChange={(e) => setWhatsappSettings({ ...whatsappSettings, dailyCapClient: parseInt(e.target.value) || 50 })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          Maximum WhatsApp messages to clients per day. Prevents cost overruns. Recommended: 50-100.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Growth Strategy</h3>
                    <p className="text-sm text-slate-600 mb-3">
                      Even with client WhatsApp disabled, you can still drive referrals and growth:
                    </p>
                    <ul className="text-sm text-slate-600 space-y-2">
                      <li>📱 <strong>QR Code on Slips:</strong> Customers scan to download their slip and share</li>
                      <li>🔗 <strong>Referral Links:</strong> Embedded in PDFs and printed slips</li>
                      <li>📊 <strong>Owner Share Pack:</strong> Weekly reports include "Powered by Imboni Serve" with invite CTA</li>
                      <li>💬 <strong>Cashier Share:</strong> Staff can share slip link from POS (no PII collected)</li>
                    </ul>
                  </div>

                  <button
                    onClick={saveWhatsappSettings}
                    disabled={savingWhatsapp}
                    className="flex items-center gap-2 bg-gradient-to-r from-imboni-blue to-blue-600 text-white px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                    {savingWhatsapp ? 'Saving...' : 'Save WhatsApp Policy'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-6">{t('dashboard.settings.privacy_settings', 'Privacy & Cookies')}</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-medium text-slate-800">{t('cookies.prefs.title', 'Cookie preferences')}</p>
                      <p className="text-sm text-slate-500">{t('cookies.prefs.subtitle', 'Choose which categories you want to allow. You can change this later.')}</p>
                    </div>
                    <button
                      onClick={() => typeof window !== 'undefined' && window.dispatchEvent(new Event('im:consent:open-preferences'))}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-sm"
                      title={t('public.footer.cookie_prefs', 'Cookie Preferences')}
                    >
                      {t('public.footer.cookie_prefs', 'Cookie Preferences')}
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-medium text-slate-800">{t('dashboard.settings.reset_consent', 'Reset cookie consent')}</p>
                      <p className="text-sm text-slate-500">{t('dashboard.settings.reset_consent_desc', 'Clear your cookie choices and choose again.')}</p>
                    </div>
                    <button
                      onClick={resetCookieConsent}
                      className="px-4 py-2 rounded-xl bg-imboni-orange text-white hover:bg-accent-dark text-sm"
                    >
                      {t('dashboard.settings.reset_now', 'Reset now')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
