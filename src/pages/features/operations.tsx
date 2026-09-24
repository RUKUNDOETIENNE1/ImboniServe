import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import PublicLayout from '@/components/PublicLayout'
import { useTranslation } from '@/lib/i18n'
import {
  ShoppingCart,
  Play,
  Receipt,
  QrCode,
  Utensils,
  Calendar,
  Tag,
  ClipboardList,
  ArrowRight,
  Bell,
} from 'lucide-react'

const heroCapability = {
  icon: <ShoppingCart className="w-8 h-8" />,
  title: 'QR Code Ordering',
  desc: 'Customers scan, browse your menu, and order directly from their phones — no app needed. Group sessions, OTP verification, upsell recommendations, dietary preferences, seat selection, and call-waiter functionality.',
}

const featuredCapabilities = [
  {
    key: 'service_replay',
    icon: <Play className="w-6 h-6" />,
    title: 'Service Replay™',
    desc: 'Replay any service period event-by-event — like a football match. Every order, every station, every table. Playback controls with speed adjustment and filtering by table, station, waiter, or event type.',
  },
  {
    key: 'smart_dining_slips',
    icon: <Receipt className="w-6 h-6" />,
    title: 'Smart Dining Slips™',
    desc: 'Auto-generated digital receipts with shareable links for seamless customer experience. Paperless, professional, and trackable.',
  },
  {
    key: 'qr_analytics',
    icon: <QrCode className="w-6 h-6" />,
    title: 'QR Analytics',
    desc: 'Track scans, conversion rates, and revenue per QR. Know which tables and QR codes drive the most orders and revenue.',
  },
]

const standardCapabilities = [
  { key: 'kds', icon: <Utensils className="w-5 h-5" />, title: 'Kitchen Display System (KDS)', desc: 'Real-time order display with urgency timers and payment status.' },
  { key: 'waiter_dashboard', icon: <ClipboardList className="w-5 h-5" />, title: 'Waiter Dashboard', desc: '5-stage order queue: waiting → preparing → ready → picked up → delivered.' },
  { key: 'reservations', icon: <Calendar className="w-5 h-5" />, title: 'Reservations', desc: 'Reservation management with deposit tracking and status workflow.' },
  { key: 'close_day', icon: <Tag className="w-5 h-5" />, title: 'Close Day (Z-Report)', desc: 'End-of-day reconciliation with revenue breakdown by payment method and order source.' },
  { key: 'promotions', icon: <Bell className="w-5 h-5" />, title: 'Promotions', desc: 'Percentage discounts, fixed amount off, and happy hour promotions with time-based activation.' },
  { key: 'qr_builder', icon: <QrCode className="w-5 h-5" />, title: 'QR Builder', desc: 'Create branded QR codes with logo embedding, template selection, and short URLs.' },
]

export default function OperationsFeaturesPage() {
  const { t, locale } = useTranslation()

  return (
    <PublicLayout
      title={t('features_operations.title_page', 'Operations Features — Imboni Serve')}
      metaDescription={t('features_operations.meta_description', 'Run your floor with QR ordering, Service Replay™, Smart Dining Slips™, kitchen display, reservations, and more.')}
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
            <div className="inline-block bg-imboni-blue/10 text-imboni-blue text-xs font-semibold px-3 py-1 rounded-full mb-3">
              {t('features_operations.badge', 'Operations')}
            </div>
            <h1 className="text-4xl font-bold text-imboni-blue mb-4" suppressHydrationWarning>{t('features_operations.h1', 'Run Your Floor')}</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto" suppressHydrationWarning>{t('features_operations.subheading', 'From order to delivery, every step visible and controlled.')}</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 mb-12">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-2xl bg-imboni-blue/10 text-imboni-blue flex items-center justify-center flex-shrink-0">
                {heroCapability.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3" suppressHydrationWarning>{t('features_operations.hero.title', heroCapability.title)}</h2>
                <p className="text-gray-600 leading-relaxed" suppressHydrationWarning>{t('features_operations.hero.desc', heroCapability.desc)}</p>
                <Link href="/order" className="text-imboni-blue font-medium text-sm hover:text-imboni-orange mt-3 inline-flex items-center gap-1" aria-label={t('features_operations.hero.cta', 'Try QR Ordering')}>
                  {t('features_operations.hero.cta', 'Try QR Ordering')} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {featuredCapabilities.map((c, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition">
                <div className="w-12 h-12 rounded-xl bg-imboni-blue/10 text-imboni-blue flex items-center justify-center mb-4">
                  {c.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2" suppressHydrationWarning>{t(`features_operations.featured.${(c as any).key}.title`, c.title as any)}</h3>
                <p className="text-sm text-gray-600 leading-relaxed" suppressHydrationWarning>{t(`features_operations.featured.${(c as any).key}.desc`, c.desc as any)}</p>
              </div>
            ))}
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-6" suppressHydrationWarning>{t('features_operations.standard_section_title', 'Standard Operations')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {standardCapabilities.map((c: any, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-slate-100 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center flex-shrink-0">
                  {c.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1" suppressHydrationWarning>{t(`features_operations.standard.${c.key}.title`, c.title)}</h3>
                  <p className="text-xs text-gray-500" suppressHydrationWarning>{t(`features_operations.standard.${c.key}.desc`, c.desc)}</p>
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
