import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import PublicLayout from '@/components/PublicLayout'
import { useTranslation } from '@/lib/i18n'
import {
  Globe,
  Megaphone,
  Palette,
  Gift,
  Rss,
  Video,
  ArrowRight,
} from 'lucide-react'

const heroCapability = {
  icon: <Globe className="w-8 h-8" />,
  title: 'Discovery Listing',
  desc: 'Get found by customers searching for hospitality businesses near them. Your business listed on our public directory with cuisine type, price range, and location filters.',
}

const featuredCapabilities = [
  {
    icon: <Megaphone className="w-6 h-6" />,
    title: 'WhatsApp Campaigns',
    desc: 'Targeted campaigns to CRM segments — Champions, At Risk, New — directly on WhatsApp. Personalized messages with delivery tracking.',
  },
  {
    icon: <Palette className="w-6 h-6" />,
    title: 'Site Builder',
    desc: 'Create your own website with AI content generation. Template selection, branding customization, and one-click publishing.',
  },
  {
    icon: <Gift className="w-6 h-6" />,
    title: 'Marketer Dashboard',
    desc: 'Referral and affiliate system with wallet, commissions, payouts, and QR code generation. Track referrals and reward advocates.',
  },
  {
    icon: <Rss className="w-6 h-6" />,
    title: 'Content Management (CMS)',
    desc: 'Publish posts and videos to your discovery feed. Full content lifecycle management with media uploads.',
  },
  {
    icon: <Video className="w-6 h-6" />,
    title: 'Video Analytics',
    desc: 'Track views, watch time, and engagement on your video content. Know what resonates with your audience.',
  },
]

export default function GrowthFeaturesPage() {
  const { t, locale } = useTranslation()

  return (
    <PublicLayout
      title={t('features_growth.title_page', 'Growth Features — Imboni Serve')}
      metaDescription={t('features_growth.meta_description', 'Acquire and retain customers with Discovery listings, WhatsApp campaigns, site builder, and content tools.')}
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
            <div className="inline-block bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
              {t('features_growth.badge', 'Growth')}
            </div>
            <h1 className="text-4xl font-bold text-imboni-blue mb-4" suppressHydrationWarning>{t('features_growth.h1', 'Switch Once. Grow Forever.')}</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto" suppressHydrationWarning>{t('features_growth.subheading', 'Operations are just the beginning. ImboniServe helps you find and keep customers.')}</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 mb-12">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                {heroCapability.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3" suppressHydrationWarning>{t('features_growth.hero.title', heroCapability.title)}</h2>
                <p className="text-gray-600 leading-relaxed" suppressHydrationWarning>{t('features_growth.hero.desc', heroCapability.desc)}</p>
                <Link href="/discover" className="text-imboni-blue font-medium text-sm hover:text-imboni-orange mt-3 inline-flex items-center gap-1" aria-label={t('features_growth.hero.cta', 'Browse the Marketplace')}>
                  {t('features_growth.hero.cta', 'Browse the Marketplace')} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {featuredCapabilities.map((c, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                    {c.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2" suppressHydrationWarning>{t(`features_growth.featured.${String(c.title).toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/_+/g,'_').replace(/^_|_$/g,'')}.title`, c.title)}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed" suppressHydrationWarning>{t(`features_growth.featured.${String(c.title).toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/_+/g,'_').replace(/^_|_$/g,'')}.desc`, c.desc)}</p>
                  </div>
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
