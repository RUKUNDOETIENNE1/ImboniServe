import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react'
import { useRouter } from 'next/router'
import { Mail, Lock, Phone, Building, MapPin, Globe } from 'lucide-react'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'
import { PRICING_PLANS } from '@/config/pricing'
import { formatCurrency } from '@/lib/utils/currency'
import LocationAutocomplete from '@/components/LocationAutocomplete'

export default function Signup() {
  const { t, changeLocale } = useTranslation()
  const router = useRouter()
  const [showLangMenu, setShowLangMenu] = useState(false)
  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'rw', name: 'Kinyarwanda', flag: '🇷🇼' }
  ]
  const changeLanguage = async (locale: string) => {
    changeLocale(locale as any)
    setShowLangMenu(false)
    await router.push(router.pathname, router.asPath, { locale })
  }
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    businessName: '',
    city: 'Kigali',
    planCode: 'ESSENTIALS', // Default entry plan for trial (overridden by ?plan=)
    businessType: 'RESTAURANT', // RESTAURANT, HOTEL, CAFE, BAR, SUPPLIER
    latitude: null as number | null,
    longitude: null as number | null,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  useEffect(() => {
    const qp = (router.query.plan as string | undefined)?.toUpperCase()
    const allowed = ['ESSENTIALS', 'PROFESSIONAL', 'BUSINESS', 'PREMIUM', 'ENTERPRISE', 'GROWTH', 'STARTER']
    if (qp && allowed.includes(qp)) {
      setFormData(prev => ({ ...prev, planCode: qp as any }))
    }
  }, [router.query.plan])

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || t('auth.signup_failed', 'Signup failed'))
      }

      await router.push('/login?signup=success')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.signup_failed', 'Signup failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <Head><title>{t('auth.signup_title', 'Sign Up — Imboni Serve')}</title></Head>
    <div className="min-h-screen flex items-center justify-center bg-imboni-light p-4">
      <div className="w-full max-w-2xl">
        {/* Back to home + Language */}
        <div className="mb-4 flex items-center justify-between">
          <Link href="/" className="text-sm text-imboni-blue hover:text-imboni-orange transition inline-flex items-center gap-1">
            ← {t('auth.back_to_home', 'Back to home')}
          </Link>
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
              title={t('topbar.language', 'Language')}
            >
              <Globe className="w-5 h-5 text-gray-600" />
            </button>
            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 ${
                      lang.code === router.locale ? 'bg-teal-50' : ''
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span className="text-sm">{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Trial banner - only for hospitality businesses */}
        {formData.businessType !== 'SUPPLIER' && (
          <div className="bg-gradient-imboni text-white text-center text-sm font-medium px-4 py-2.5 rounded-xl mb-4">
            🎉 {t('auth.trial_banner', '14-day free trial — no credit card required. 50% OFF launch pricing.')}
          </div>
        )}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Image
              src="/imgs/logo2.png"
              alt="Imboni Serve"
              width={256}
              height={96}
              priority
              className="h-24 w-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-imboni-blue">{t('auth.join_title', 'Join Imboni Serve')}</h1>
          <p className="text-gray-600">{t('auth.signup_subtitle', 'Start managing your hospitality business today')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.your_name', 'Your Name')}
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-imboni-blue focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.email_address', 'Email Address')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-imboni-blue focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.phone_number', 'Phone Number')}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+250788123456"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-imboni-blue focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.password', 'Password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-imboni-blue focus:border-transparent"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.business_name', 'Business Name')}
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-imboni-blue focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <LocationAutocomplete
                  value={formData.city}
                  onChange={(location, coordinates) => {
                    setFormData(prev => ({
                      ...prev,
                      city: location,
                      latitude: coordinates?.lat || null,
                      longitude: coordinates?.lon || null,
                    }))
                  }}
                  label={t('auth.city_location', 'City / Location')}
                  placeholder="e.g. Kigali, Nairobi, London"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.business_type', 'Business Type')}
              </label>
              <select
                name="businessType"
                value={formData.businessType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-imboni-blue focus:border-transparent"
                suppressHydrationWarning
              >
                <option value="RESTAURANT">{t('auth.business_type_restaurant', 'Restaurant')}</option>
                <option value="HOTEL">{t('auth.business_type_hotel', 'Hotel')}</option>
                <option value="CAFE">{t('auth.business_type_cafe', 'Café / Coffee Shop')}</option>
                <option value="BAR">{t('auth.business_type_bar', 'Bar / Pub')}</option>
                <option value="SUPPLIER">{t('auth.business_type_supplier', 'Supplier (No free trial)')}</option>
              </select>
              {formData.businessType === 'SUPPLIER' && (
                <p className="mt-2 text-sm text-amber-600">
                  ⚠️ {t('auth.supplier_no_trial', 'Suppliers are not eligible for the 14-day free trial. Paid plan required.')}
                </p>
              )}
            </div>

            {/* Terms and Conditions Agreement */}
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <input
                type="checkbox"
                id="agreedToTerms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-imboni-blue border-gray-300 rounded focus:ring-2 focus:ring-imboni-blue"
                required
              />
              <label htmlFor="agreedToTerms" className="text-sm text-gray-700">
                {t('auth.agree_to_terms_prefix', 'I agree to the')}{' '}
                <Link href="/terms" target="_blank" className="text-imboni-blue hover:text-imboni-orange underline font-medium">
                  {t('auth.terms_and_conditions', 'Terms & Conditions')}
                </Link>
                {', '}
                <Link href="/privacy" target="_blank" className="text-imboni-blue hover:text-imboni-orange underline font-medium">
                  {t('auth.privacy_policy', 'Privacy Policy')}
                </Link>
                {', and '}
                <Link href="/service-terms" target="_blank" className="text-imboni-blue hover:text-imboni-orange underline font-medium">
                  {t('auth.service_terms', 'Service Terms')}
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !agreedToTerms}
              className="w-full bg-imboni-blue text-white font-medium py-3 px-4 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-imboni-blue disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading 
                ? t('auth.creating_account', 'Creating Account...') 
                : formData.businessType === 'SUPPLIER'
                  ? t('auth.create_account', 'Create Account')
                  : t('auth.start_free_trial', 'Start Your 14-Day Free Trial')
              }
            </button>
            {formData.businessType !== 'SUPPLIER' && (
              <p className="text-center text-sm text-gray-500 mt-2">
                {t('auth.no_credit_card', 'No credit card required. Cancel anytime.')}
              </p>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {t('auth.have_account', 'Already have an account?')}{' '}
              <Link href="/login" className="font-medium text-imboni-blue hover:text-imboni-orange">
                {t('auth.login', 'Login')}
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-gray-400">
        <a href="https://www.icthubs.com" target="_blank" rel="noreferrer" className="hover:text-gray-600">
          Powered by ICTHubs
        </a>
      </div>
    </div>
    </>
  )
}
