import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import PublicLayout from '@/components/PublicLayout'
import { useTranslation } from '@/lib/i18n'
import {
  Sparkles,
  Package,
  BrainCircuit,
  AlertTriangle,
  Target,
  BarChart3,
  Clock,
  MessageSquare,
  ArrowRight,
} from 'lucide-react'

const heroCapability = {
  icon: <Sparkles className="w-8 h-8" />,
  title: 'AI Menu Builder',
  desc: 'Upload a photo or PDF of your existing menu. AI extracts items, prices, and descriptions automatically. No manual entry — from hours to minutes.',
}

const aiCapabilities = [
  {
    icon: <Package className="w-6 h-6" />,
    title: 'Auto-Reorder AI',
    desc: 'AI analyzes demand patterns, lead times, and safety stock to suggest reorders with confidence scores. One click to approve. Never run out again.',
  },
  {
    icon: <BrainCircuit className="w-6 h-6" />,
    title: 'AI Insight Reports',
    desc: 'Weekly and monthly AI-generated reports with KPI snapshots, narrative analysis, and priority recommendations. Your AI business analyst.',
  },
  {
    icon: <AlertTriangle className="w-6 h-6" />,
    title: 'Cost Anomaly Alerts',
    desc: 'Automatic detection of supplier price increases with z-score statistical analysis and severity scoring. Catch price creep before it hurts.',
  },
  {
    icon: <Target className="w-6 h-6" />,
    title: 'A/B Testing for Menus',
    desc: 'Test price, copy, and visuals. Split traffic. Measure conversion. Pick winners with real data, not gut feeling.',
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: 'Optimization Hub',
    desc: 'AI-driven recommendations from Business Scanner, AI Insights, and Autopilot — with measured impact tracking.',
  },
]

const analyticsCapabilities = [
  { icon: <BarChart3 className="w-5 h-5" />, title: 'Menu Performance Analytics', desc: 'Item-level revenue, quantity, and trend analysis.' },
  { icon: <Clock className="w-5 h-5" />, title: 'Peak Hours Analytics', desc: 'Hourly and daily demand patterns. Plan staffing with data.' },
  { icon: <MessageSquare className="w-5 h-5" />, title: 'Instruction Insights', desc: 'Customer order instruction patterns and preference analysis.' },
]

export default function AIFeaturesPage() {
  const { t, locale } = useTranslation()

  return (
    <PublicLayout
      title={t('features_ai.title_page', 'AI Features — Imboni Serve')}
      metaDescription={t('features_ai.meta_description', 'AI Menu Builder, auto-reorder, insight reports, cost anomaly alerts, A/B testing, and optimization hub — AI that does real work.')}
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
            <div className="inline-block bg-imboni-gold/10 text-imboni-gold text-xs font-semibold px-3 py-1 rounded-full mb-3">
              {t('features_ai.badge', 'AI')}
            </div>
            <h1 className="text-4xl font-bold text-imboni-blue mb-4" suppressHydrationWarning>{t('features_ai.h1', 'AI That Works While You Work')}</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto" suppressHydrationWarning>{t("features_ai.subheading", "AI isn't a feature. It's the foundation. Every AI capability does real work — not just displays data.")}</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 mb-12">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-2xl bg-imboni-gold/10 text-imboni-gold flex items-center justify-center flex-shrink-0">
                {heroCapability.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3" suppressHydrationWarning>{t('features_ai.hero.title', heroCapability.title)}</h2>
                <p className="text-gray-600 leading-relaxed" suppressHydrationWarning>{t('features_ai.hero.desc', heroCapability.desc)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {aiCapabilities.map((c, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-imboni-gold/10 text-imboni-gold flex items-center justify-center flex-shrink-0">
                    {c.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2" suppressHydrationWarning>{t(`features_ai.capabilities.${String(c.title).toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/_+/g,'_').replace(/^_|_$/g,'')}.title`, c.title)}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed" suppressHydrationWarning>{t(`features_ai.capabilities.${String(c.title).toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/_+/g,'_').replace(/^_|_$/g,'')}.desc`, c.desc)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-6" suppressHydrationWarning>{t('features_ai.analytics_section_title', 'AI-Powered Analytics')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            {analyticsCapabilities.map((c, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-slate-100 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center flex-shrink-0">
                  {c.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1" suppressHydrationWarning>{t(`features_ai.analytics.${String(c.title).toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/_+/g,'_').replace(/^_|_$/g,'')}.title`, c.title)}</h3>
                  <p className="text-xs text-gray-500" suppressHydrationWarning>{t(`features_ai.analytics.${String(c.title).toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/_+/g,'_').replace(/^_|_$/g,'')}.desc`, c.desc)}</p>
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
