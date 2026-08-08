import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import PublicLayout from '@/components/PublicLayout'
import { useTranslation } from '@/lib/i18n'
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Receipt,
  ArrowRight,
} from 'lucide-react'

const heroCapability = {
  icon: <DollarSign className="w-8 h-8" />,
  title: 'CFO Dashboard',
  desc: 'Financial health, revenue intelligence, subscription metrics — with AI-generated narratives and correlation analysis. Cached for sub-1s load times.',
}

const featuredCapability = {
  icon: <TrendingUp className="w-8 h-8" />,
  title: 'CEO Dashboard',
  desc: 'Business health, revenue, customers, operations, and hospitality data — aggregated from multiple intelligence services. Auto-refreshing every 5 minutes.',
}

const standardCapabilities = [
  { icon: <Receipt className="w-5 h-5" />, title: 'Payout Summary', desc: 'Gross, commission, and net payout per sale. Date-range selectable.' },
  { icon: <CreditCard className="w-5 h-5" />, title: 'Payment Monitor', desc: 'Real-time payment tracking with method breakdown and auto-refresh.' },
  { icon: <Receipt className="w-5 h-5" />, title: 'Transactions', desc: 'Full transaction history with status filters and export.' },
]

export default function FinanceFeaturesPage() {
  const { t, locale } = useTranslation()

  return (
    <PublicLayout
      title={t('features_finance.title_page', 'Finance Features — Imboni Serve')}
      metaDescription={t('features_finance.meta_description', 'Track payments, payouts, and financial health with CFO/CEO dashboards, real-time monitors, and clear reconciliation.')}
    >
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>
      <div key={locale} className="bg-imboni-light min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <Link href="/features" className="text-imboni-blue text-sm font-medium hover:text-imboni-orange mb-6 inline-flex items-center gap-1">
            ← {t('features_page.back', 'All Features')}
          </Link>

          <div className="text-center mb-14">
            <div className="inline-block bg-purple-50 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
              {t('features_finance.badge', 'Finance')}
            </div>
            <h1 className="text-4xl font-bold text-imboni-blue mb-4" suppressHydrationWarning>{t('features_finance.h1', 'Every Franc Tracked')}</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto" suppressHydrationWarning>{t('features_finance.subheading', 'From mobile money to CFO intelligence — your money, fully visible.')}</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 mb-8">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center flex-shrink-0">
                {heroCapability.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3" suppressHydrationWarning>{t('features_finance.hero.title', heroCapability.title)}</h2>
                <p className="text-gray-600 leading-relaxed" suppressHydrationWarning>{t('features_finance.hero.desc', heroCapability.desc)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 mb-12">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-2xl bg-imboni-orange/10 text-imboni-orange flex items-center justify-center flex-shrink-0">
                {featuredCapability.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3" suppressHydrationWarning>{t('features_finance.featured.title', featuredCapability.title)}</h2>
                <p className="text-gray-600 leading-relaxed" suppressHydrationWarning>{t('features_finance.featured.desc', featuredCapability.desc)}</p>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-6" suppressHydrationWarning>{t('features_finance.standard_section_title', 'Standard Finance')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            {standardCapabilities.map((c, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-slate-100 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center flex-shrink-0">
                  {c.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1" suppressHydrationWarning>{t(`features_finance.standard.${String(c.title).toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/_+/g,'_').replace(/^_|_$/g,'')}.title`, c.title)}</h3>
                  <p className="text-xs text-gray-500" suppressHydrationWarning>{t(`features_finance.standard.${String(c.title).toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/_+/g,'_').replace(/^_|_$/g,'')}.desc`, c.desc)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/signup" className="inline-flex items-center gap-2 bg-imboni-blue text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-imboni-blue/90 transition shadow-lg" aria-label={t('features_page.cta', 'Start Free Trial')}>
              {t('features_page.cta', 'Start Free Trial')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
