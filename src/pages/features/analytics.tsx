import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import PublicLayout from '@/components/PublicLayout'
import { useTranslation } from '@/lib/i18n'
import {
  DollarSign,
  TrendingUp,
  Users,
  QrCode,
  BarChart3,
  Clock,
  MessageSquare,
  Video,
  CreditCard,
  Receipt,
  ArrowRight,
} from 'lucide-react'

const heroCapabilities = [
  {
    icon: <DollarSign className="w-8 h-8" />,
    title: 'CFO Dashboard',
    desc: 'Financial health, revenue intelligence, subscription metrics — with AI-generated narratives and correlation analysis. Cached for sub-1s load times.',
  },
  {
    icon: <TrendingUp className="w-8 h-8" />,
    title: 'CEO Dashboard',
    desc: 'Business health, revenue, customers, operations, and hospitality data — aggregated from multiple intelligence services. Auto-refreshing every 5 minutes.',
  },
]

const featuredCapabilities = [
  {
    icon: <Users className="w-6 h-6" />,
    title: 'CRM with RFM Segmentation',
    desc: 'Automatic customer segmentation: Champions, Loyal, At Risk, Lost, New, Promising. Lifetime value, visit frequency, and spend analysis.',
  },
  {
    icon: <QrCode className="w-6 h-6" />,
    title: 'QR Analytics',
    desc: 'Scan-to-revenue conversion tracking. Know which QRs perform best by hour, device, and location.',
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'Menu Performance Analytics',
    desc: 'Item-level revenue, quantity, and trend analysis. Know your best and worst performers.',
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: 'Peak Hours Analytics',
    desc: 'Hourly and daily demand patterns. Plan staffing with data, not guesswork.',
  },
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: 'Instruction Insights',
    desc: 'Customer order instruction patterns. Understand preferences and special requests.',
  },
  {
    icon: <Video className="w-6 h-6" />,
    title: 'Video Analytics',
    desc: 'Video content performance: views, watch time, and engagement tracking.',
  },
]

const standardCapabilities = [
  { icon: <CreditCard className="w-5 h-5" />, title: 'Payment Monitor', desc: 'Real-time payment tracking with method breakdown and auto-refresh.' },
  { icon: <Receipt className="w-5 h-5" />, title: 'Transactions', desc: 'Full transaction history with status filters and export.' },
]

export default function AnalyticsFeaturesPage() {
  const { t, locale } = useTranslation()

  return (
    <PublicLayout title="Analytics Features — Imboni Serve">
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>
      <div key={locale} className="bg-imboni-light min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <Link href="/features" className="text-imboni-blue text-sm font-medium hover:text-imboni-orange mb-6 inline-flex items-center gap-1">
            ← All Features
          </Link>

          <div className="text-center mb-14">
            <div className="inline-block bg-imboni-green/10 text-imboni-green text-xs font-semibold px-3 py-1 rounded-full mb-3">
              Analytics
            </div>
            <h1 className="text-4xl font-bold text-imboni-blue mb-4">Know Your Business Inside Out</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Data you can act on, not just admire.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {heroCapabilities.map((c, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100">
                <div className="w-16 h-16 rounded-2xl bg-imboni-blue/10 text-imboni-blue flex items-center justify-center mb-5">
                  {c.icon}
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">{c.title}</h2>
                <p className="text-gray-600 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {featuredCapabilities.map((c, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition">
                <div className="w-12 h-12 rounded-xl bg-imboni-green/10 text-imboni-green flex items-center justify-center mb-4">
                  {c.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{c.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-6">Standard Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            {standardCapabilities.map((c, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-slate-100 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center flex-shrink-0">
                  {c.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{c.title}</h3>
                  <p className="text-xs text-gray-500">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/signup" className="inline-flex items-center gap-2 bg-imboni-blue text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-imboni-blue/90 transition shadow-lg">
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
