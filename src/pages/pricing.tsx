import React from 'react'
import { Check } from 'lucide-react'
import { useRouter } from 'next/router'
import PublicLayout from '@/components/PublicLayout'
import { useTranslation } from '@/lib/i18n'
import { formatCurrency, detectCurrencyFromLocale } from '@/lib/utils/currency'
import { PRICING_PLANS } from '@/config/pricing'
import CurrencySelector from '@/components/CurrencySelector'

export default function Pricing() {
  const router = useRouter()
  const { t, locale } = useTranslation()
  const [billingPeriod, setBillingPeriod] = React.useState<'monthly' | 'annual'>('annual')
  const [currency, setCurrency] = React.useState('RWF')
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    // Detect user's currency on mount
    const detectedCurrency = detectCurrencyFromLocale(navigator.language)
    setCurrency(detectedCurrency)
  }, [])

  // Use unified pricing config
  const plans = PRICING_PLANS.map(p => ({
    ...p,
    monthlyPrice: p.monthlyPriceRWF,
    annualMonthly: p.annualMonthlyRWF,
    annualTotal: p.annualTotalRWF,
    customPrice: p.monthlyPriceRWF === null ? 'Custom' : undefined
  }))

  return (
    <PublicLayout title={t('pricing.title_page', 'Pricing — Imboni Serve')}>
    <div key={locale} className="bg-imboni-light py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-imboni-blue mb-4" suppressHydrationWarning>
            {t('pricing.heading', 'Simple Pricing for Every Hospitality Business')}
          </h1>
          <p className="text-lg text-gray-700 mb-2" suppressHydrationWarning>{t('pricing.tagline', 'Unified. Intelligent. Reliable.')}</p>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-4">
            {t('pricing.subheading', 'Choose the perfect plan for your hospitality business. All plans include WhatsApp integration and mobile money support.')}
          </p>
          <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-full font-semibold mb-8">
            🎉 {t('pricing.launch_badge', 'Launch Special: 50% OFF All Plans!')}
          </div>

          {/* Currency Selector */}
          <div className="flex justify-center mb-6">
            <CurrencySelector value={currency} onChange={setCurrency} />
          </div>
          
          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white rounded-lg p-1 shadow-md">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-md font-medium transition ${
                billingPeriod === 'monthly'
                  ? 'bg-imboni-blue text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('pricing.monthly', 'Monthly')}
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-6 py-2 rounded-md font-medium transition ${
                billingPeriod === 'annual'
                  ? 'bg-imboni-blue text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('pricing.annual', 'Annual')}
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                {t('pricing.save_25', 'Save 25%')}
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.code}
              className={`bg-white rounded-2xl shadow-xl p-8 ${
                plan.popular ? 'ring-2 ring-imboni-orange relative' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-imboni-orange text-white px-4 py-1 rounded-full text-sm font-medium" suppressHydrationWarning>
                    {t('pricing.most_popular', '⭐ Most Popular')}
                  </span>
                </div>
              )}
              {plan.badge && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-imboni-blue text-white px-4 py-1 rounded-full text-sm font-medium" suppressHydrationWarning>
                    {t('pricing.multi_branch', '🏢 Multi-Branch')}
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2" suppressHydrationWarning>
                  {t(`pricing.plan_${plan.code.toLowerCase()}_name`, plan.name)}
                </h3>
                <p className="text-gray-600 text-sm mb-4" suppressHydrationWarning>
                  {t(`pricing.plan_${plan.code.toLowerCase()}_desc`, plan.description)}
                </p>
                <div className="mb-4">
                  {(plan as any).customPrice ? (
                    <>
                      <span className="text-4xl font-bold text-gray-900">
                        {t('pricing.custom_pricing', (plan as any).customPrice || 'Custom Pricing')}
                      </span>
                      <div className="text-sm text-gray-600 mt-2" suppressHydrationWarning>
                        {t('pricing.starting_from', 'Starting from')} {formatCurrency(150000, currency)}{t('pricing.per_month', ' / month')}
                      </div>
                    </>
                  ) : billingPeriod === 'monthly' ? (
                    <>
                      <span className="text-4xl font-bold text-gray-900">
                        {formatCurrency(plan.monthlyPrice || 0, currency, { showSymbol: false })}
                      </span>
                      <span className="text-gray-600"> {currency}{t('pricing.per_month', ' / month')}</span>
                    </>
                  ) : (
                    <>
                      <div className="mb-1">
                        <span className="text-4xl font-bold text-gray-900">
                          {formatCurrency(plan.annualMonthly || 0, currency, { showSymbol: false })}
                        </span>
                        <span className="text-gray-600"> {currency}{t('pricing.per_month', ' / month')}</span>
                      </div>
                      <div className="text-sm text-gray-500" suppressHydrationWarning>
                        {t('pricing.billed_annually', 'Billed annually')}: {formatCurrency(plan.annualTotal || 0, currency)}
                      </div>
                      {plan.monthlyPrice && plan.annualMonthly && (
                        <div className="text-xs text-green-600 font-medium mt-1" suppressHydrationWarning>
                          {t('pricing.save_25', 'Save 25%')} ({formatCurrency((plan.monthlyPrice - plan.annualMonthly) * 12, currency)}{t('pricing.per_year', ' / year')})
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700" suppressHydrationWarning>
                      {t(
                        `pricing.feature_${feature
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '_')
                          .replace(/_+/g, '_')
                          .replace(/^_|_$/g, '')}`,
                        feature
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => router.push(`/signup?plan=${plan.code}`)}
                className={`w-full py-3 px-4 rounded-xl font-medium transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-imboni-orange to-orange-500 text-white hover:shadow-lg hover:shadow-orange-200'
                    : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                }`}
              >
                {t('pricing.choose', 'Choose')} {t(`pricing.plan_${plan.code.toLowerCase()}_name`, plan.name)}
              </button>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-gray-600 mb-4">
            {t('pricing.all_plans_include', 'All plans include a')} <strong>{t('pricing.trial_14', '14-day free trial')}</strong>. {t('pricing.no_card', 'No credit card required.')} 
          </p>
          <p className="text-sm text-gray-500">
            {t('pricing.need_help', 'Need help choosing?')} <a href="https://wa.me/250735214496" className="text-imboni-blue hover:text-imboni-orange">{t('pricing.chat_whatsapp', 'Chat with us on WhatsApp')}</a>
          </p>
        </div>
      </div>
    </div>
    </PublicLayout>
  )
}
