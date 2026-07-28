import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import PublicLayout from '@/components/PublicLayout'
import { useTranslation } from '@/lib/i18n'
import {
  ShoppingCart,
  BrainCircuit,
  BarChart3,
  DollarSign,
  TrendingUp,
  Package,
  ArrowRight,
  Play,
  Sparkles,
  Users,
  Target,
} from 'lucide-react'

const featureCategories = [
  {
    icon: <ShoppingCart className="w-8 h-8" />,
    title: 'Operations',
    desc: 'From order to delivery, every step visible and controlled.',
    href: '/features/operations',
    color: 'bg-blue-50 text-imboni-blue',
    highlights: ['QR Code Ordering', 'Service Replay™', 'Smart Dining Slips™'],
  },
  {
    icon: <BrainCircuit className="w-8 h-8" />,
    title: 'AI',
    desc: 'AI that works while you work — not just dashboards.',
    href: '/features/ai',
    color: 'bg-yellow-50 text-imboni-gold',
    highlights: ['AI Menu Builder', 'Auto-Reorder AI', 'A/B Testing'],
  },
  {
    icon: <BarChart3 className="w-8 h-8" />,
    title: 'Analytics',
    desc: 'Data you can act on, not just admire.',
    href: '/features/analytics',
    color: 'bg-green-50 text-imboni-green',
    highlights: ['CFO Dashboard', 'CEO Dashboard', 'CRM with RFM'],
  },
  {
    icon: <DollarSign className="w-8 h-8" />,
    title: 'Finance',
    desc: 'Every franc tracked — from mobile money to CFO intelligence.',
    href: '/features/finance',
    color: 'bg-purple-50 text-purple-700',
    highlights: ['Payout Summary', 'Payment Monitor', 'Transactions'],
  },
  {
    icon: <TrendingUp className="w-8 h-8" />,
    title: 'Growth',
    desc: 'Switch once. Grow forever.',
    href: '/features/growth',
    color: 'bg-emerald-50 text-emerald-700',
    highlights: ['Discovery Listing', 'WhatsApp Campaigns', 'Site Builder'],
  },
  {
    icon: <Package className="w-8 h-8" />,
    title: 'Infrastructure',
    desc: 'The foundation that makes everything else possible.',
    href: '/features/infrastructure',
    color: 'bg-slate-50 text-slate-700',
    highlights: ['Staff Management', 'Inventory', 'Contacts'],
  },
]

export default function FeaturesPage() {
  const { t, locale } = useTranslation()

  return (
    <PublicLayout title="Features — Imboni Serve">
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>
      <div key={locale} className="bg-imboni-light min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-14">
            <h1 className="text-4xl md:text-5xl font-bold text-imboni-blue mb-4" suppressHydrationWarning>
              {t('features_page.title', 'Everything You Need to Run Your Hospitality Business')}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto" suppressHydrationWarning>
              {t('features_page.subtitle', '38 verified, production-ready capabilities. Organized by what they do for your business — not by internal modules.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featureCategories.map((cat, i) => (
              <Link
                key={i}
                href={cat.href}
                className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-lg hover:border-imboni-blue/20 transition group"
              >
                <div className={`w-16 h-16 rounded-2xl ${cat.color} flex items-center justify-center mb-5`}>
                  {cat.icon}
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{cat.title}</h2>
                <p className="text-gray-600 mb-4">{cat.desc}</p>
                <div className="space-y-1 mb-4">
                  {cat.highlights.map((h, j) => (
                    <div key={j} className="text-sm text-imboni-blue font-medium flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-imboni-orange" />
                      {h}
                    </div>
                  ))}
                </div>
                <span className="text-imboni-blue font-medium text-sm inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  {t('features_page.explore', 'Explore')} <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-16 bg-gradient-to-br from-imboni-blue to-blue-700 rounded-3xl p-10 text-white text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4" suppressHydrationWarning>
              {t('features_page.ready_title', 'Ready to see it in action?')}
            </h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto" suppressHydrationWarning>
              {t('features_page.ready_desc', 'Start your free 14-day trial. No credit card needed. Full access to all capabilities.')}
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-imboni-orange text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-accent-dark transition shadow-lg"
            >
              {t('features_page.cta', 'Start Free Trial')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
