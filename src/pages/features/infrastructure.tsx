import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import PublicLayout from '@/components/PublicLayout'
import { useTranslation } from '@/lib/i18n'
import {
  Users,
  Package,
  BookUser,
  Shield,
  Bell,
  ArrowRight,
} from 'lucide-react'

const standardCapabilities = [
  { icon: <Users className="w-6 h-6" />, title: 'Staff Management', desc: 'Full CRUD with system roles, custom roles, permissions, and branch assignment. Granular access control: waiter, cashier, supervisor, manager, and more.' },
  { icon: <Package className="w-6 h-6" />, title: 'Inventory Management', desc: 'Stock tracking with min/reorder levels, unit costs, and category filtering. Full audit trail of every movement.' },
  { icon: <BookUser className="w-6 h-6" />, title: 'Contacts', desc: 'Centralized contact management with organization linking. Keep track of suppliers, customers, and partners.' },
]

const operationalCapabilities = [
  { icon: <Shield className="w-5 h-5" />, title: 'Security & Sessions', desc: 'Active session monitoring, MFA status, security events, and session revocation.' },
  { icon: <Bell className="w-5 h-5" />, title: 'Notifications Settings', desc: 'Daily report scheduling, WhatsApp alert configuration, and timezone management.' },
]

export default function InfrastructureFeaturesPage() {
  const { t, locale } = useTranslation()

  return (
    <PublicLayout
      title={t('features_infrastructure.title_page', 'Infrastructure Features — Imboni Serve')}
      metaDescription={t('features_infrastructure.meta_description', 'Team-ready roles, inventory, contacts, security, and notifications — the backbone of your operations.')}
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
            <div className="inline-block bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
              {t('features_infrastructure.badge', 'Infrastructure')}
            </div>
            <h1 className="text-4xl font-bold text-imboni-blue mb-4" suppressHydrationWarning>{t('features_infrastructure.h1', 'Built for Teams')}</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto" suppressHydrationWarning>{t('features_infrastructure.subheading', 'The foundation that makes everything else possible.')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {standardCapabilities.map((c, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition">
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-4">
                  {c.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2" suppressHydrationWarning>{t(`features_infrastructure.standard.${String(c.title).toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/_+/g,'_').replace(/^_|_$/g,'')}.title`, c.title)}</h3>
                <p className="text-sm text-gray-600 leading-relaxed" suppressHydrationWarning>{t(`features_infrastructure.standard.${String(c.title).toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/_+/g,'_').replace(/^_|_$/g,'')}.desc`, c.desc)}</p>
              </div>
            ))}
          </div>

          <h2 className="text-lg font-bold text-gray-500 mb-4" suppressHydrationWarning>{t('features_infrastructure.also_included', 'Also Included')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            {operationalCapabilities.map((c, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-slate-100 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center flex-shrink-0">
                  {c.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700 text-sm mb-1" suppressHydrationWarning>{t(`features_infrastructure.operational.${String(c.title).toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/_+/g,'_').replace(/^_|_$/g,'')}.title`, c.title)}</h3>
                  <p className="text-xs text-gray-500" suppressHydrationWarning>{t(`features_infrastructure.operational.${String(c.title).toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/_+/g,'_').replace(/^_|_$/g,'')}.desc`, c.desc)}</p>
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
