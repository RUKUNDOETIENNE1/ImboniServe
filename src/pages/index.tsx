import React from 'react'
import Head from 'next/head'
import Image from 'next/image'
import { useRouter } from 'next/router'
import Link from 'next/link'
import PublicLayout from '@/components/PublicLayout'
import { useTranslation } from '@/lib/i18n'
import {
  Check,
  BarChart3,
  ShoppingCart,
  Utensils,
  Package,
  BrainCircuit,
  MessageCircle,
  Smartphone,
  Shield,
  Star,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Users,
  Clock,
  Receipt,
  Gift,
  Tag,
  Palette,
  Sparkles,
  Rss,
  Globe,
  MapPin,
  QrCode,
  Calendar,
  Megaphone,
  Beaker,
  Play,
  DollarSign,
  AlertTriangle,
  Target,
  ChevronLeft,
  Bell,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import { PRICING_PLANS } from '@/config/pricing'

// Use unified pricing config (show all plans on homepage)
const plans = PRICING_PLANS.map(p => ({
  ...p,
  monthlyPrice: p.monthlyPriceRWF,
  annualMonthly: p.annualMonthlyRWF,
  annualTotal: p.annualTotalRWF
}))

const features = [
  {
    icon: <ShoppingCart className="w-6 h-6" />,
    title: 'QR Code Ordering',
    desc: 'Customers scan, browse your menu, and order directly from their phones — no app needed.',
    color: 'bg-blue-50 text-imboni-blue',
  },
  {
    icon: <Package className="w-6 h-6" />,
    title: 'Inventory & Procurement',
    desc: 'Track stock levels, set reorder points, and manage purchase orders with full audit trails.',
    color: 'bg-orange-50 text-imboni-orange',
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'Reports & Analytics',
    desc: 'Daily, weekly, and monthly reports. Understand your revenue, costs, and margins at a glance.',
    color: 'bg-green-50 text-imboni-green',
  },
  {
    icon: <BrainCircuit className="w-6 h-6" />,
    title: 'Smart Analytics',
    desc: 'Reorder recommendations and cost anomaly alerts that protect your profit margins.',
    color: 'bg-yellow-50 text-imboni-gold',
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: 'Discovery Listing',
    desc: 'Get listed on our public directory where customers find hospitality businesses near them.',
    color: 'bg-indigo-50 text-indigo-700',
  },
  {
    icon: <Receipt className="w-6 h-6" />,
    title: 'Smart Dining Slips™',
    desc: 'Auto-generated digital receipts with shareable links for seamless customer experience.',
    color: 'bg-cyan-50 text-cyan-700',
  },
  {
    icon: <Bell className="w-6 h-6" />,
    title: 'Low-Stock Push Alerts',
    desc: 'Never run out. Get automatic alerts before inventory drops below reorder points.',
    color: 'bg-amber-50 text-amber-700',
  },
  {
    icon: <MessageCircle className="w-6 h-6" />,
    title: 'WhatsApp Integration',
    desc: 'Receive order alerts, daily summaries, and low-stock notifications directly on WhatsApp.',
    color: 'bg-emerald-50 text-emerald-700',
  },
  {
    icon: <Smartphone className="w-6 h-6" />,
    title: 'Mobile Money Payments',
    desc: 'Accept mobile money payments natively — no POS terminal required.',
    color: 'bg-purple-50 text-purple-700',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Role-Based Access',
    desc: 'Cashier, waiter, supervisor, manager — each role sees only what they need.',
    color: 'bg-red-50 text-red-700',
  },
]

const advancedFeatures = [
  {
    icon: <Sparkles className="w-5 h-5" />,
    title: 'AI Menu Builder',
    desc: 'Upload a photo or document and let AI build your menu for you.',
  },
  {
    icon: <Globe className="w-5 h-5" />,
    title: 'Business Discovery',
    desc: 'Get discovered by customers searching for hospitality businesses powered by ImboniServe.',
  },
  {
    icon: <Gift className="w-5 h-5" />,
    title: 'Referral Program',
    desc: 'Customers earn rewards for every referral. No limits, no caps — just instant rewards.',
  },
  {
    icon: <Play className="w-5 h-5" />,
    title: 'Service Replay™',
    desc: 'Replay any service period event-by-event — like a football match. Understand exactly what happened.',
  },
  {
    icon: <Package className="w-5 h-5" />,
    title: 'Inventory Alerts & Auto-Reorder',
    desc: 'Automatic stock alerts and AI-powered draft purchase orders for your suppliers.',
  },
  {
    icon: <Receipt className="w-5 h-5" />,
    title: 'Smart Dining Slips',
    desc: 'Auto-generated digital receipts with shareable links for seamless customer experience.',
  },
]

// Stats will be rendered with translations inline

const heroSlides = [
  {
    title: 'The Operating System',
    highlight: 'for Hospitality.',
    subtitle: 'Run your café, hotel, bar, or hospitality business from one intelligent platform.',
    description: 'Everything you need to run your business — from orders and inventory to payments and insights — in one platform built for hospitality.',
    image: '/imgs/ideogr1.jpg'
  },
  {
    title: 'Service Replay™',
    highlight: 'See What Really Happened',
    subtitle: 'Rewind Any Service Period',
    description: 'Replay events like a match—every order, table, station, and hand-off. Diagnose issues fast, coach teams, and prevent loss.',
    image: '/imgs/ideogr 3.jpg'
  },
  {
    title: 'Smart QR Ordering',
    highlight: 'Zero Wait Time',
    subtitle: 'Customers Order from Their Phones',
    description: 'Scan, browse menu, and place orders instantly. No app downloads. No staff interruptions. Pure efficiency.',
    image: '/imgs/ideogr 2.jpg'
  },
  {
    title: 'Smart Analytics',
    highlight: 'Data-Driven Growth',
    subtitle: 'Know Your Business Inside Out',
    description: 'Track sales, optimize inventory, and make smarter decisions with actionable recommendations based on your real data.',
    image: '/imgs/ideogr 3.jpg'
  },
  {
    title: 'All-in-One Platform',
    highlight: 'Complete Control',
    subtitle: 'POS, QR, Inventory, Analytics',
    description: 'Stop juggling multiple systems. Manage orders, inventory, staff, and reports from one powerful dashboard.',
    image: '/imgs/ideogr 4.jpg'
  }
]

export default function HomePage() {
  const router = useRouter()
  const { t, locale } = useTranslation()
  const [billing, setBilling] = React.useState<'monthly' | 'annual'>('annual')
  const [currentSlide, setCurrentSlide] = React.useState(0)
  const rtRef = React.useRef<HTMLDivElement>(null)
  const growthRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 10000)
    return () => clearInterval(timer)
  }, [])

  const scrollCarousel = (ref: React.RefObject<HTMLDivElement>, dir: -1 | 1) => {
    const el = ref.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' })
  }

  const realTimeSlides = [
    {
      icon: <TrendingUp className="w-6 h-6" />, 
      title: t('homepage.rt.sales_title', 'Every Sale, Live'),
      desc: t('homepage.rt.sales_desc', 'Watch revenue tick in real-time and react instantly.'),
      href: '/dashboard',
      cta: t('homepage.rt.sales_cta', 'Open Live Dashboard')
    },
    {
      icon: <QrCode className="w-6 h-6" />,
      title: t('homepage.rt.qr_title', 'QR Performance by Table'),
      desc: t('homepage.rt.qr_desc', 'See which table or QR drives the most orders and revenue.'),
      href: '/dashboard/qr-analytics',
      cta: t('homepage.rt.qr_cta', 'View QR Analytics')
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: t('homepage.rt.tables_title', 'Tables & Sections Status'),
      desc: t('homepage.rt.tables_desc', 'Know what’s occupied, waiting, or free at a glance.'),
      href: '/dashboard/tables',
      cta: t('homepage.rt.tables_cta', 'Manage Tables')
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: t('homepage.rt.peak_title', 'Peak Hours & Flow'),
      desc: t('homepage.rt.peak_desc', 'Plan staffing with hourly demand patterns.'),
      href: '/dashboard/analytics/peak-hours',
      cta: t('homepage.rt.peak_cta', 'See Peak Hours')
    },
    {
      icon: <Receipt className="w-6 h-6" />,
      title: t('homepage.rt.orders_title', 'Unified Orders'),
      desc: t('homepage.rt.orders_desc', 'Track dine-in, takeaway, and delivery in one feed.'),
      href: '/dashboard/orders/unified',
      cta: t('homepage.rt.orders_cta', 'Open Orders')
    }
  ]

  const growthSlides = [
    {
      icon: <Users className="w-6 h-6" />, 
      title: t('homepage.growth.crm_title', 'Customer CRM (RFM)'),
      desc: t('homepage.growth.crm_desc', 'Segment customers into Champions, Loyal, and At-Risk.'),
      href: '/dashboard/crm',
      cta: t('homepage.growth.crm_cta', 'Open CRM')
    },
    {
      icon: <Megaphone className="w-6 h-6" />, 
      title: t('homepage.growth.campaigns_title', 'Automated WhatsApp Campaigns'),
      desc: t('homepage.growth.campaigns_desc', 'Target segments with personalized messages.'),
      href: '/dashboard/campaigns',
      cta: t('homepage.growth.campaigns_cta', 'Create Campaign')
    },
    {
      icon: <Beaker className="w-6 h-6" />, 
      title: t('homepage.growth.ab_title', 'Menu A/B Testing'),
      desc: t('homepage.growth.ab_desc', 'Test price, copy, and visuals. Pick winners with data.'),
      href: '/dashboard/ab-testing',
      cta: t('homepage.growth.ab_cta', 'Run a Test')
    },
    {
      icon: <Play className="w-6 h-6" />, 
      title: t('homepage.growth.replay_title', 'Service Replay™'),
      desc: t('homepage.growth.replay_desc', 'Replay any service period event-by-event — like a football match.'),
      href: '/dashboard/operations/service-replay',
      cta: t('homepage.growth.replay_cta', 'Try Service Replay')
    },
    {
      icon: <Bell className="w-6 h-6" />, 
      title: t('homepage.growth.alerts_title', 'Low‑Stock Push Alerts'),
      desc: t('homepage.growth.alerts_desc', 'Never run out. Get alerted before you do.'),
      href: '/dashboard/inventory-alerts',
      cta: t('homepage.growth.alerts_cta', 'Configure Alerts')
    },
    {
      icon: <Calendar className="w-6 h-6" />, 
      title: t('homepage.growth.resv_title', 'Deposits & Reservations'),
      desc: t('homepage.growth.resv_desc', 'Cut no‑shows with smart deposits & confirmations.'),
      href: '/dashboard/reservations',
      cta: t('homepage.growth.resv_cta', 'Manage Reservations')
    }
  ]

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://imboniserve.com'
  const displayCurrency = process.env.NEXT_PUBLIC_DISPLAY_CURRENCY || 'RWF'
  const supportWhatsAppUrl = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_URL || 'https://wa.me/250735214496'

  return (
    <PublicLayout title="Imboni Serve — Hospitality Operating System">
    <Head>
      <meta name="robots" content="index,follow" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Imboni Serve',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          offers: {
            '@type': 'Offer',
            price: '15000',
            priceCurrency: displayCurrency,
          },
          url: `${siteUrl}/`,
        }) }}
      />
    </Head>
    <div key={locale}>

      {/* ── HERO WITH CAROUSEL ── */}
      <section className="bg-gradient-imboni text-white py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(231,111,81,0.2),_transparent_60%)]" />
        
        {/* Carousel Background Images */}
        {heroSlides.map((s, index) => {
          const slide = {
            ...s,
            title: t(`homepage.hero.slides.${index}.title`, s.title),
            highlight: t(`homepage.hero.slides.${index}.highlight`, s.highlight),
            subtitle: t(`homepage.hero.slides.${index}.subtitle`, s.subtitle),
            description: t(`homepage.hero.slides.${index}.description`, s.description),
          }
          return (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-20' : 'opacity-0'
              }`}
            >
              <div className="absolute top-10 right-10 hidden lg:block animate-float">
                <Image src={slide.image} alt="" width={256} height={256} className="w-64 h-64 object-cover rounded-3xl" />
              </div>
            </div>
          )
        })}
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Carousel Content */}
          <div className="relative min-h-[400px]">
            {heroSlides.map((s, index) => {
              const slide = {
                ...s,
                title: t(`homepage.hero.slides.${index}.title`, s.title),
                highlight: t(`homepage.hero.slides.${index}.highlight`, s.highlight),
                subtitle: t(`homepage.hero.slides.${index}.subtitle`, s.subtitle),
                description: t(`homepage.hero.slides.${index}.description`, s.description),
              }
              return (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-700 ${
                    index === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                  }`}
                >
                  <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-4 tracking-tight">
                    {slide.title}<br />
                    <span className="text-imboni-orange">{slide.highlight}</span>
                  </h1>
                  <p className="text-lg text-white/80 mb-2 font-medium">
                    {slide.subtitle}
                  </p>
                  <p className="text-xl text-white/90 mb-4 max-w-3xl mx-auto">
                    {slide.description}
                  </p>
                  <p className="text-base text-white/80 font-medium" suppressHydrationWarning>
                    {t('homepage.hero.description', 'Built for cafés, hotels, bars, and hospitality businesses.')}
                  </p>
                  <p className="text-sm text-white/80 mb-8" suppressHydrationWarning>
                    {t('homepage.hero.rt_os', 'Real-time OS: see every sale, every table, every customer action — and grow revenue automatically.')}
                  </p>
                </div>
              )
            })}
          </div>
          
          {/* Carousel Indicators */}
          <div className="flex justify-center gap-2 mb-8">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentSlide ? 'bg-white w-8' : 'bg-white/40'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="bg-imboni-orange text-white px-8 py-3.5 rounded-xl font-semibold text-base hover:bg-accent-dark hover:scale-105 transition-all shadow-lg shadow-orange-900/30 flex items-center gap-2"
            >
              {t('homepage.hero.cta_primary', 'Start Free 14-Day Trial')} <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href={supportWhatsAppUrl}
              className="bg-white text-imboni-blue px-8 py-3.5 rounded-xl font-semibold text-base hover:bg-slate-100 hover:scale-105 transition-all shadow-lg flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" /> {t('homepage.hero.cta_talk_to_team', 'Talk to Our Team')}
            </a>
            <Link
              href="#pricing"
              className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white px-8 py-3.5 rounded-xl font-semibold text-base hover:bg-white/20 hover:scale-105 transition-all"
            >
              {t('homepage.hero.cta_secondary', 'View Pricing')}
            </Link>
          </div>
        </div>
      </section>

      {/* ── REAL-TIME OS CAROUSEL ── */}
      <section className="py-12 px-4 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="inline-block bg-imboni-blue/10 text-imboni-blue text-xs font-semibold px-3 py-1 rounded-full mb-2" suppressHydrationWarning>
                {t('homepage.rt.badge', 'Real‑Time Operating System')}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-imboni-blue" suppressHydrationWarning>
                {t('homepage.rt.title', 'Every Sale. Every Table. Every Action — Live')}
              </h2>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <button onClick={() => scrollCarousel(rtRef, -1)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50">
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <button onClick={() => scrollCarousel(rtRef, 1)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50">
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>

          <div ref={rtRef} className="snap-x snap-mandatory overflow-x-auto no-scrollbar -mx-4 px-4">
            <div className="flex gap-4 min-w-full">
              {realTimeSlides.map((s, i) => (
                <div key={i} className="snap-start shrink-0 w-80 bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
                  <div className="w-10 h-10 rounded-xl bg-imboni-blue/10 text-imboni-blue flex items-center justify-center mb-3">
                    {s.icon}
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">{s.title}</h3>
                  <p className="text-sm text-slate-600 mb-4">{s.desc}</p>
                  <span className="inline-flex items-center gap-2 text-slate-500 font-medium text-sm" aria-label={s.cta}>
                    {s.cta}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY SWITCH? — Capabilities That Solve Problems Competitors Ignore ── */}
      <section className="py-20 px-4 bg-gradient-to-br from-slate-50 to-blue-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-block bg-imboni-orange/10 text-imboni-orange text-xs font-semibold px-3 py-1 rounded-full mb-3" suppressHydrationWarning>
              {t('homepage.why_switch.badge', 'Why Switch?')}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-imboni-blue mb-4" suppressHydrationWarning>
              {t('homepage.why_switch.title', "You're not just getting a POS. You're getting intelligence.")}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg" suppressHydrationWarning>
              {t('homepage.why_switch.subtitle', 'Capabilities that solve problems competitors ignore.')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 hover:shadow-xl transition">
              <div className="w-14 h-14 rounded-2xl bg-imboni-blue/10 text-imboni-blue flex items-center justify-center mb-5">
                <Play className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3" suppressHydrationWarning>
                {t('homepage.why_switch.replay_title', 'Service Replay™')}
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4" suppressHydrationWarning>
                {t('homepage.why_switch.replay_desc', 'Replay any service period like a football match. Every order, every station, every table — event by event. Understand exactly what happened and why.')}
              </p>
              <Link href="/dashboard/operations/service-replay" className="text-imboni-blue font-medium text-sm hover:text-imboni-orange transition inline-flex items-center gap-1">
                {t('homepage.why_switch.replay_cta', 'See it in action')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 hover:shadow-xl transition">
              <div className="w-14 h-14 rounded-2xl bg-imboni-orange/10 text-imboni-orange flex items-center justify-center mb-5">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3" suppressHydrationWarning>
                {t('homepage.why_switch.crm_title', 'Know Your Customers')}
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4" suppressHydrationWarning>
                {t('homepage.why_switch.crm_desc', 'Automatic RFM segmentation: Champions, Loyal, At Risk, Lost. Lifetime value and spend analysis — know your customers like an e-commerce brand does.')}
              </p>
              <Link href="/dashboard/crm" className="text-imboni-blue font-medium text-sm hover:text-imboni-orange transition inline-flex items-center gap-1">
                {t('homepage.why_switch.crm_cta', 'Explore CRM')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 hover:shadow-xl transition">
              <div className="w-14 h-14 rounded-2xl bg-imboni-green/10 text-imboni-green flex items-center justify-center mb-5">
                <Target className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3" suppressHydrationWarning>
                {t('homepage.why_switch.ab_title', 'Test Menu Prices')}
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4" suppressHydrationWarning>
                {t('homepage.why_switch.ab_desc', 'Stop guessing. Start testing. Create price variants, split traffic, measure conversion. Pick winners with real data, not gut feeling.')}
              </p>
              <Link href="/dashboard/ab-testing" className="text-imboni-blue font-medium text-sm hover:text-imboni-orange transition inline-flex items-center gap-1">
                {t('homepage.why_switch.ab_cta', 'Run a Test')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY AI? — Where AI Creates Unfair Advantage ── */}
      <section className="py-20 px-4 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-block bg-imboni-blue/10 text-imboni-blue text-xs font-semibold px-3 py-1 rounded-full mb-3" suppressHydrationWarning>
              {t('homepage.why_ai.badge', 'Why AI?')}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-imboni-blue mb-4" suppressHydrationWarning>
              {t('homepage.why_ai.title', "AI isn't a buzzword. It's working right now in your dashboard.")}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg" suppressHydrationWarning>
              {t('homepage.why_ai.subtitle', 'AI that does real work — not just displays data.')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-imboni-blue/5 to-imboni-orange/5 rounded-2xl p-8 border border-slate-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-imboni-blue/10 text-imboni-blue flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2" suppressHydrationWarning>
                    {t('homepage.why_ai.menu_builder_title', 'AI Menu Builder')}
                  </h3>
                  <p className="text-gray-600 leading-relaxed" suppressHydrationWarning>
                    {t('homepage.why_ai.menu_builder_desc', 'Upload a photo or PDF of your existing menu. AI extracts items, prices, and descriptions. No manual entry — from hours to minutes.')}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-imboni-blue/5 to-imboni-orange/5 rounded-2xl p-8 border border-slate-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-imboni-orange/10 text-imboni-orange flex items-center justify-center flex-shrink-0">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2" suppressHydrationWarning>
                    {t('homepage.why_ai.auto_reorder_title', 'Auto-Reorder AI')}
                  </h3>
                  <p className="text-gray-600 leading-relaxed" suppressHydrationWarning>
                    {t('homepage.why_ai.auto_reorder_desc', 'AI analyzes demand patterns, lead times, and safety stock to suggest reorders with confidence scores. One click to approve. Never run out again.')}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-imboni-blue/5 to-imboni-orange/5 rounded-2xl p-8 border border-slate-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-imboni-green/10 text-imboni-green flex items-center justify-center flex-shrink-0">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2" suppressHydrationWarning>
                    {t('homepage.why_ai.insight_reports_title', 'AI Insight Reports')}
                  </h3>
                  <p className="text-gray-600 leading-relaxed" suppressHydrationWarning>
                    {t('homepage.why_ai.insight_reports_desc', 'Weekly and monthly AI-generated reports with KPI snapshots, narrative analysis, and priority recommendations. Your AI business analyst.')}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-imboni-blue/5 to-imboni-orange/5 rounded-2xl p-8 border border-slate-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2" suppressHydrationWarning>
                    {t('homepage.why_ai.cost_anomaly_title', 'Cost Anomaly Alerts')}
                  </h3>
                  <p className="text-gray-600 leading-relaxed" suppressHydrationWarning>
                    {t('homepage.why_ai.cost_anomaly_desc', 'Automatic detection of supplier price increases with statistical analysis and severity scoring. Catch price creep before it hurts your margins.')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VIDEO DEMO ── */}
      <section className="py-16 px-4 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-imboni-blue mb-3" suppressHydrationWarning>
            {t('homepage.video.title', 'See Imboni Serve in Action')}
          </h2>
          <p className="text-gray-600 mb-8 text-lg" suppressHydrationWarning>
            {t('homepage.video.subtitle', 'Watch how hospitality businesses streamline operations with our all-in-one platform.')}
          </p>
          <a 
            href="https://www.youtube.com/watch?v=Pdh2D6uWXQo" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block relative aspect-video rounded-2xl overflow-hidden shadow-2xl border border-slate-200 group cursor-pointer"
          >
            <img 
              src={`https://img.youtube.com/vi/Pdh2D6uWXQo/maxresdefault.jpg`}
              alt="Imboni Serve Demo Video"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-all flex items-center justify-center">
              <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl">
                <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
            <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg px-4 py-3 text-left">
              <p className="text-sm font-semibold text-slate-800" suppressHydrationWarning>{t('homepage.video.cta', 'Click to watch on YouTube')}</p>
              <p className="text-xs text-slate-500 mt-0.5" suppressHydrationWarning>{t('homepage.video.description', 'See how Imboni Serve transforms hospitality operations')}</p>
            </div>
          </a>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 px-4 bg-gradient-to-br from-imboni-blue to-blue-700 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-block bg-white/10 border border-white/20 text-white/90 text-sm font-semibold px-4 py-1.5 rounded-full mb-4" suppressHydrationWarning>
              🚀 {t('homepage.how_it_works.badge', 'Getting Started')}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" suppressHydrationWarning>
              {t('homepage.how_it_works.title', 'How It Works')}
            </h2>
            <p className="text-white/80 text-lg max-w-2xl mx-auto" suppressHydrationWarning>
              {t('homepage.how_it_works.subtitle', '6 simple steps to digitize your hospitality business & start serving smarter')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition">
              <div className="w-14 h-14 bg-imboni-orange rounded-xl flex items-center justify-center text-white font-bold text-2xl mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-3" suppressHydrationWarning>{t('homepage.how_it_works.step1_title', 'Create Your Account')}</h3>
              <p className="text-white/80 text-sm leading-relaxed" suppressHydrationWarning>
                {t('homepage.how_it_works.step1_desc', 'Sign up in 2 minutes. Fill in your business name, location, and owner details. Get instant access to your private dashboard.')}
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition">
              <div className="w-14 h-14 bg-imboni-green rounded-xl flex items-center justify-center text-white font-bold text-2xl mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-3" suppressHydrationWarning>{t('homepage.how_it_works.step2_title', 'Build Your Menu')}</h3>
              <p className="text-white/80 text-sm leading-relaxed" suppressHydrationWarning>
                {t('homepage.how_it_works.step2_desc', 'Add dishes and drinks with photos, prices, and descriptions. Use our AI Menu Builder to upload a photo or PDF and auto-generate your menu in seconds.')}
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition">
              <div className="w-14 h-14 bg-yellow-500 rounded-xl flex items-center justify-center text-white font-bold text-2xl mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-3" suppressHydrationWarning>{t('homepage.how_it_works.step3_title', 'Set Up Tables & QR Codes')}</h3>
              <p className="text-white/80 text-sm leading-relaxed" suppressHydrationWarning>
                {t('homepage.how_it_works.step3_desc', 'Create your tables (Table 1, VIP Section, Terrace, etc.) and generate unique QR codes for each — all from your dashboard. Print and place them on tables.')}
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition">
              <div className="w-14 h-14 bg-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-2xl mb-4">
                4
              </div>
              <h3 className="text-xl font-bold mb-3" suppressHydrationWarning>{t('homepage.how_it_works.step4_title', 'Connect WhatsApp & Payments')}</h3>
              <p className="text-white/80 text-sm leading-relaxed" suppressHydrationWarning>
                {t('homepage.how_it_works.step4_desc', 'Link your WhatsApp number to receive instant order alerts and daily reports. Enable your preferred payment methods for seamless digital payments.')}
              </p>
            </div>

            {/* Step 5 */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition">
              <div className="w-14 h-14 bg-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-2xl mb-4">
                5
              </div>
              <h3 className="text-xl font-bold mb-3" suppressHydrationWarning>{t('homepage.how_it_works.step5_title', 'Track Inventory & Costs')}</h3>
              <p className="text-white/80 text-sm leading-relaxed" suppressHydrationWarning>
                {t('homepage.how_it_works.step5_desc', 'Add your stock items, set reorder points, and track every purchase. Get AI-powered alerts when costs spike or stock runs low.')}
              </p>
            </div>

            {/* Step 6 */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition">
              <div className="w-14 h-14 bg-red-500 rounded-xl flex items-center justify-center text-white font-bold text-2xl mb-4">
                6
              </div>
              <h3 className="text-xl font-bold mb-3" suppressHydrationWarning>{t('homepage.how_it_works.step6_title', 'Go Live & Grow!')}</h3>
              <p className="text-white/80 text-sm leading-relaxed" suppressHydrationWarning>
                {t('homepage.how_it_works.step6_desc', 'Customers scan QR codes to order, kitchen gets real-time alerts, payments flow automatically. Track analytics, manage promotions, and scale with confidence.')}
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-6 py-4">
              <Clock className="w-5 h-5 text-imboni-orange" />
              <div className="text-left">
                <div className="font-bold text-lg" suppressHydrationWarning>{t('homepage.how_it_works.cta_ready', 'Ready to get started?')}</div>
                <div className="text-white/70 text-sm" suppressHydrationWarning>{t('homepage.how_it_works.cta_subtitle', 'Create your account — it only takes 2 minutes!')}</div>
              </div>
              <a
                href="/signup"
                className="bg-imboni-orange text-white px-6 py-3 rounded-lg font-semibold hover:bg-accent-dark transition flex items-center gap-2"
              >
                {t('homepage.how_it_works.cta_button', 'Create Account')} <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-imboni-blue/10 text-imboni-blue flex items-center justify-center mb-2">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-imboni-blue">14 days</div>
            <div className="text-sm text-gray-500" suppressHydrationWarning>{t('homepage.stats.trial', 'Free trial, no card needed')}</div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-imboni-blue/10 text-imboni-blue flex items-center justify-center mb-2">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-imboni-blue">No card</div>
            <div className="text-sm text-gray-500" suppressHydrationWarning>{t('homepage.stats.orders', 'needed to start')}</div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-imboni-blue/10 text-imboni-blue flex items-center justify-center mb-2">
              <Shield className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-imboni-blue">5 plans</div>
            <div className="text-sm text-gray-500" suppressHydrationWarning>{t('homepage.stats.plans', 'From Starter to Enterprise')}</div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-imboni-blue/10 text-imboni-blue flex items-center justify-center mb-2">
              <Star className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-imboni-blue">38+</div>
            <div className="text-sm text-gray-500" suppressHydrationWarning>{t('homepage.stats.features', 'Verified capabilities')}</div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-20 px-4 bg-imboni-light relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-5 hidden xl:block">
          <Image src="/imgs/ideogr 3.jpg" alt="" width={384} height={384} className="w-96 h-96 object-cover" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-imboni-blue mb-4" suppressHydrationWarning>
              {t('homepage.features.title', 'Everything you need to run a tight operation')}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg mb-2" suppressHydrationWarning>
              {t('homepage.features.subtitle', 'From orders to procurement, analytics to multi-branch — Imboni Serve covers every part of your hospitality business.')}
            </p>
            <p className="text-sm text-imboni-blue/80 font-medium tracking-wide">
              Unified. Intelligent. Reliable.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-blue-50 text-imboni-blue">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2" suppressHydrationWarning>{t('homepage.features.qr_ordering', 'QR Code Ordering')}</h3>
              <p className="text-sm text-gray-500 leading-relaxed" suppressHydrationWarning>{t('homepage.features.qr_ordering_desc', 'Customers scan, browse your menu, and order directly from their phones — no app needed.')}</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-orange-50 text-imboni-orange">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2" suppressHydrationWarning>{t('homepage.features.inventory', 'Inventory & Procurement')}</h3>
              <p className="text-sm text-gray-500 leading-relaxed" suppressHydrationWarning>{t('homepage.features.inventory_desc', 'Track stock levels, set reorder points, and manage purchase orders with full audit trails.')}</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-green-50 text-imboni-green">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2" suppressHydrationWarning>{t('homepage.features.reports', 'Reports & Analytics')}</h3>
              <p className="text-sm text-gray-500 leading-relaxed" suppressHydrationWarning>{t('homepage.features.reports_desc', 'Daily, weekly, and monthly reports. Understand your revenue, costs, and margins at a glance.')}</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-yellow-50 text-imboni-gold">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2" suppressHydrationWarning>{t('homepage.features.ai_insights', 'AI-Powered Insights')}</h3>
              <p className="text-sm text-gray-500 leading-relaxed" suppressHydrationWarning>{t('homepage.features.ai_insights_desc', 'Smart reorder recommendations and cost anomaly alerts that protect your profit margins.')}</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-indigo-50 text-indigo-700">
                <Rss className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2" suppressHydrationWarning>{t('homepage.features.discovery_feed', 'Content & Discovery Feed')}</h3>
              <p className="text-sm text-gray-500 leading-relaxed" suppressHydrationWarning>{t('homepage.features.discovery_feed_desc', 'Publish posts, promos, and photos. Let customers discover and order directly from your feed.')}</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-cyan-50 text-cyan-700">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2" suppressHydrationWarning>{t('homepage.features.smart_slips', 'Smart Dining Slips™')}</h3>
              <p className="text-sm text-gray-500 leading-relaxed" suppressHydrationWarning>{t('homepage.features.smart_slips_desc', 'Auto-generated digital receipts with referral links — share & earn rewards for every friend.')}</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-amber-50 text-amber-700">
                <Tag className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2" suppressHydrationWarning>{t('homepage.features.promotions', 'Promotions & Happy Hours')}</h3>
              <p className="text-sm text-gray-500 leading-relaxed" suppressHydrationWarning>{t('homepage.features.promotions_desc', 'Set time-based discounts and combo deals that activate and expire automatically.')}</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-emerald-50 text-emerald-700">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2" suppressHydrationWarning>{t('homepage.features.whatsapp', 'WhatsApp Integration')}</h3>
              <p className="text-sm text-gray-500 leading-relaxed" suppressHydrationWarning>{t('homepage.features.whatsapp_desc', 'Receive order alerts, daily summaries, and low-stock notifications directly on WhatsApp.')}</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-purple-50 text-purple-700">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2" suppressHydrationWarning>{t('homepage.features.mobile_money', 'Mobile Money Payments')}</h3>
              <p className="text-sm text-gray-500 leading-relaxed" suppressHydrationWarning>{t('homepage.features.mobile_money_desc', 'Accept mobile money payments natively — no POS terminal required.')}</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-red-50 text-red-700">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2" suppressHydrationWarning>{t('homepage.features.roles', 'Role-Based Access')}</h3>
              <p className="text-sm text-gray-500 leading-relaxed" suppressHydrationWarning>{t('homepage.features.roles_desc', 'Cashier, waiter, supervisor, manager — each role sees only what they need.')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING PREVIEW ── */}
      <section id="pricing" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-imboni-blue mb-4" suppressHydrationWarning>
              {t('homepage.pricing_preview.heading', 'Transparent Pricing for Every Business Size')}
            </h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto leading-relaxed" suppressHydrationWarning>
              {t('homepage.pricing_preview.subtitle', 'ImboniServe offers flexible plans designed for hospitality businesses of all sizes.')}
            </p>
          </div>

          <div className="bg-imboni-light rounded-3xl p-8 md:p-12 border border-slate-200 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-block bg-imboni-blue/10 text-imboni-blue text-sm font-semibold px-3 py-1 rounded-full mb-4">
                  {t('homepage.pricing_preview.starting_at', 'Starting at')}
                </div>
                <div className="mb-4">
                  <span className="text-5xl md:text-6xl font-extrabold text-imboni-blue">{formatCurrency(plans[0].monthlyPrice || 15000, displayCurrency, { showSymbol: false })}</span>
                  <span className="text-gray-600 text-xl ml-2" suppressHydrationWarning>{displayCurrency}{t('homepage.pricing_preview.per_month', ' / month')}</span>
                </div>
                <p className="text-gray-600 text-lg mb-6" suppressHydrationWarning>
                  {t('homepage.pricing_preview.starter_desc', 'Perfect for single-location hospitality businesses getting started with modern operations.')}
                </p>
                <div className="flex items-center gap-2 text-green-600 font-medium mb-2">
                  <Check className="w-5 h-5" />
                  <span suppressHydrationWarning>{t('homepage.pricing_preview.annual_savings', 'Annual billing saves 25% (equivalent to 3 free months)')}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <TrendingUp className="w-5 h-5" />
                  <span suppressHydrationWarning>{t('homepage.pricing_preview.scale', 'Plans scale from single locations to multi-branch enterprises')}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                  <h4 className="font-semibold text-gray-900 mb-2" suppressHydrationWarning>{t('homepage.pricing_preview.all_plans_include', 'All Plans Include')}</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span suppressHydrationWarning>{t('homepage.pricing_preview.feature_1', 'QR ordering, POS, and kitchen operations')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span suppressHydrationWarning>{t('homepage.pricing_preview.feature_2', 'Inventory and procurement management')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span suppressHydrationWarning>{t('homepage.pricing_preview.feature_3', 'WhatsApp integration and mobile money payments')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span suppressHydrationWarning>{t('homepage.pricing_preview.feature_4', 'Reporting and analytics')}</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-gradient-to-br from-imboni-blue/5 to-imboni-orange/5 rounded-xl p-5 border border-imboni-blue/20">
                  <p className="text-sm text-gray-700 font-medium" suppressHydrationWarning>
                    {t('homepage.pricing_preview.enterprise_note', 'Enterprise plans available with custom pricing for multi-branch operations and advanced requirements.')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-gradient-to-r from-imboni-orange/10 to-imboni-blue/10 border border-imboni-orange/20 rounded-2xl p-6 mb-8 max-w-3xl mx-auto">
              <p className="text-gray-700 font-medium text-lg" suppressHydrationWarning>
                {t('homepage.pricing_preview.founding_note', '🎉 Founding Hospitality Business Program members receive 50% lifetime discount on all plans')} — <a href="#founding-program" className="text-imboni-orange hover:text-imboni-blue transition font-semibold">{t('homepage.pricing_preview.founding_link', 'Learn more below ↓')}</a>
              </p>
            </div>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 bg-imboni-blue text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-imboni-blue/90 hover:scale-105 transition-all shadow-lg"
            >
              {t('homepage.pricing_preview.view_full_pricing', 'View Full Pricing')} <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-gray-500 text-sm mt-6" suppressHydrationWarning>
              {t('homepage.pricing_preview.help', 'Need help choosing?')}{' '}
              <a href={supportWhatsAppUrl} className="text-imboni-blue font-medium hover:text-imboni-orange transition">
                {t('homepage.pricing_preview.chat', 'Chat with us on WhatsApp')}
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ── WHY TRUST US? — Executive-Grade Intelligence ── */}
      <section className="py-20 px-4 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-block bg-imboni-blue/10 text-imboni-blue text-xs font-semibold px-3 py-1 rounded-full mb-3" suppressHydrationWarning>
              {t('homepage.why_trust.badge', 'Why Trust Us?')}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-imboni-blue mb-4" suppressHydrationWarning>
              {t('homepage.why_trust.title', "This isn't a basic POS with pretty charts. This is enterprise-grade intelligence.")}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg" suppressHydrationWarning>
              {t('homepage.why_trust.subtitle', 'Built for decision-makers, not just order-takers.')}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-imboni-blue/5 to-blue-50 rounded-2xl p-8 border border-slate-100">
                  <div className="w-14 h-14 rounded-2xl bg-imboni-blue/10 text-imboni-blue flex items-center justify-center mb-5">
                    <DollarSign className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3" suppressHydrationWarning>
                    {t('homepage.why_trust.cfo_title', 'CFO Dashboard')}
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-4" suppressHydrationWarning>
                    {t('homepage.why_trust.cfo_desc', 'Financial health, revenue intelligence, subscription metrics — with AI-generated narratives and correlation analysis. Cached for sub-1s load times.')}
                  </p>
                  <Link href="/dashboard/cfo" className="text-imboni-blue font-medium text-sm hover:text-imboni-orange transition inline-flex items-center gap-1">
                    {t('homepage.why_trust.cfo_cta', 'View CFO Dashboard')} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="bg-gradient-to-br from-imboni-orange/5 to-orange-50 rounded-2xl p-8 border border-slate-100">
                  <div className="w-14 h-14 rounded-2xl bg-imboni-orange/10 text-imboni-orange flex items-center justify-center mb-5">
                    <TrendingUp className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3" suppressHydrationWarning>
                    {t('homepage.why_trust.ceo_title', 'CEO Dashboard')}
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-4" suppressHydrationWarning>
                    {t('homepage.why_trust.ceo_desc', 'Business health, revenue, customers, operations, and hospitality data — aggregated from multiple intelligence services. Auto-refreshing every 5 minutes.')}
                  </p>
                  <Link href="/dashboard/ceo" className="text-imboni-blue font-medium text-sm hover:text-imboni-orange transition inline-flex items-center gap-1">
                    {t('homepage.why_trust.ceo_cta', 'View CEO Dashboard')} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
        </div>
      </section>

      {/* ── WHY NOW? — The Cost of Waiting ── */}
      <section className="py-16 px-4 bg-gradient-to-br from-slate-50 to-imboni-light border-t border-slate-100">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block bg-red-50 text-red-600 text-xs font-semibold px-3 py-1 rounded-full mb-3" suppressHydrationWarning>
            {t('homepage.why_now.badge', 'Why Now?')}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-imboni-blue mb-4" suppressHydrationWarning>
            {t('homepage.why_now.title', 'Every day without intelligence is a day of lost revenue.')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10 text-left">
            <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700" suppressHydrationWarning>
                {t('homepage.why_now.stockouts', 'Stockouts cost you customers today. AI prevents them before they happen.')}
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex items-start gap-3">
              <Target className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700" suppressHydrationWarning>
                {t('homepage.why_now.pricing', "You're pricing your menu blind. Test prices with real conversion data.")}
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex items-start gap-3">
              <Users className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700" suppressHydrationWarning>
                {t('homepage.why_now.churn', "You don't know who's about to churn. RFM segmentation reveals it automatically.")}
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700" suppressHydrationWarning>
                {t('homepage.why_now.supplier', 'Supplier prices are creeping up unnoticed. Cost anomaly alerts catch them early.')}
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex items-start gap-3 md:col-span-2">
              <Play className="w-5 h-5 text-imboni-blue flex-shrink-0 mt-0.5" />
              <p className="text-gray-700" suppressHydrationWarning>
                {t('homepage.why_now.replay', "You can't reconstruct what went wrong last Friday. Service Replay™ lets you replay any service period event-by-event.")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOUNDING HOSPITALITY BUSINESS PROGRAM ── */}
      <section id="founding-program" className="py-20 px-4 bg-gradient-to-br from-imboni-blue via-imboni-blue to-indigo-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(231,111,81,0.15),_transparent_60%)]" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="inline-block bg-imboni-orange/20 border border-imboni-orange/30 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Star className="w-4 h-4 inline mr-2" />
              {t('homepage.founding_program.badge', 'Limited Early-Adopter Program')}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4" suppressHydrationWarning>
              {t('homepage.founding_program.title', 'Founding Hospitality Business Program')}
            </h2>
            <p className="text-white/90 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed" suppressHydrationWarning>
              {t('homepage.founding_program.subtitle', 'Join the first 100 hospitality businesses to shape the future of hospitality operations.')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-imboni-orange flex items-center justify-center flex-shrink-0">
                  <Tag className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-2" suppressHydrationWarning>
                    {t('homepage.founding_program.benefit_1_title', '50% Lifetime Discount')}
                  </h3>
                  <p className="text-white/80 leading-relaxed" suppressHydrationWarning>
                    {t('homepage.founding_program.benefit_1_desc', 'Lock in 50% off your subscription for as long as you remain a customer. No expiration.')}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-imboni-orange flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-2" suppressHydrationWarning>
                    {t('homepage.founding_program.benefit_2_title', 'Direct Founder Support')}
                  </h3>
                  <p className="text-white/80 leading-relaxed" suppressHydrationWarning>
                    {t('homepage.founding_program.benefit_2_desc', 'Get priority onboarding and direct access to the founding team for support and guidance.')}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-imboni-orange flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-2" suppressHydrationWarning>
                    {t('homepage.founding_program.benefit_3_title', 'Early Access to New Capabilities')}
                  </h3>
                  <p className="text-white/80 leading-relaxed" suppressHydrationWarning>
                    {t('homepage.founding_program.benefit_3_desc', 'Be the first to access selected new features and capabilities as they launch.')}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-imboni-orange flex items-center justify-center flex-shrink-0">
                  <Megaphone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-2" suppressHydrationWarning>
                    {t('homepage.founding_program.benefit_4_title', 'Shape Platform Development')}
                  </h3>
                  <p className="text-white/80 leading-relaxed" suppressHydrationWarning>
                    {t('homepage.founding_program.benefit_4_desc', 'Direct input on roadmap priorities — your operational needs help guide what we build next.')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-lg mb-6">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium" suppressHydrationWarning>
                {t('homepage.founding_program.limited', 'Limited to first 100 hospitality businesses')}
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/signup"
                className="bg-imboni-orange text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-accent-dark hover:scale-105 transition-all shadow-lg flex items-center gap-2"
              >
                {t('homepage.founding_program.cta', 'Join Founding Program')} <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href={supportWhatsAppUrl}
                className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/20 hover:scale-105 transition-all flex items-center gap-2"
              >
                <MessageCircle className="w-5 h-5" /> {t('homepage.founding_program.learn_more', 'Learn More')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── ADVANCED FEATURES ── */}
      <section className="py-16 px-4 bg-imboni-light border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-imboni-blue mb-3" suppressHydrationWarning>
              {t('homepage.advanced.title', 'Even more in the box')}
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto" suppressHydrationWarning>
              {t('homepage.advanced.subtitle', 'Advanced capabilities available on higher plans — all built-in, no third-party tools required.')}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {advancedFeatures.map((f, i) => (
              <div key={i} className="flex items-start gap-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition">
                <div className="w-10 h-10 rounded-xl bg-imboni-blue/10 text-imboni-blue flex items-center justify-center flex-shrink-0">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DISCOVERY MARKETPLACE ── */}
      <section id="discover" className="py-16 px-4 bg-gradient-to-br from-imboni-blue to-primary-700 text-white relative overflow-hidden">
        <div className="absolute bottom-0 left-0 opacity-10 hidden lg:block">
          <Image src="/imgs/ideogr1.jpg" alt="" width={288} height={288} className="w-72 h-72 object-cover rounded-tr-3xl" />
        </div>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-10 relative z-10">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-block bg-white/10 border border-white/20 text-white/90 text-xs font-semibold px-3 py-1 rounded-full mb-4" suppressHydrationWarning>
              {t('homepage.discovery.badge', 'NEW — Discovery Feed')}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" suppressHydrationWarning>
              {t('homepage.discovery.title', 'Get discovered by customers looking for great experiences')}
            </h2>
            <p className="text-white/75 text-lg mb-6" suppressHydrationWarning>
              {t('homepage.discovery.subtitle', 'List your business on the Imboni Serve discovery marketplace. Publish content, promotions, and daily specials — customers find you and order directly.')}
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <a
                href="/discover"
                className="bg-white text-imboni-blue px-6 py-3 rounded-xl font-semibold text-sm hover:bg-slate-100 transition flex items-center gap-2"
              >
                <Globe className="w-4 h-4" /> {t('homepage.discovery.cta_browse', 'Browse the Marketplace')}
              </a>
              <a
                href="/signup"
                className="bg-imboni-orange text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-accent-dark transition flex items-center gap-2"
              >
                <Rss className="w-4 h-4" /> {t('homepage.discovery.cta_claim', 'Claim Your Free Listing')}
              </a>
            </div>
          </div>
          <div className="flex-shrink-0 grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-4 py-3">
              <span className="text-imboni-orange"><Rss className="w-4 h-4" /></span>
              <span className="font-medium text-white/90" suppressHydrationWarning>{t('homepage.discovery.feature_posts', 'Shoppable Posts')}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-4 py-3">
              <span className="text-imboni-orange"><Palette className="w-4 h-4" /></span>
              <span className="font-medium text-white/90" suppressHydrationWarning>{t('homepage.discovery.feature_media', 'Photo & Video')}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-4 py-3">
              <span className="text-imboni-orange"><Tag className="w-4 h-4" /></span>
              <span className="font-medium text-white/90" suppressHydrationWarning>{t('homepage.discovery.feature_promos', 'Promos & Combos')}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-4 py-3">
              <span className="text-imboni-orange"><Receipt className="w-4 h-4" /></span>
              <span className="font-medium text-white/90" suppressHydrationWarning>{t('homepage.discovery.feature_attribution', 'Order Attribution')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── PAYMENT METHODS ── */}
      <section className="py-14 px-4 bg-imboni-light border-t border-slate-100">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-imboni-blue mb-2" suppressHydrationWarning>{t('homepage.payments.title', '🇷🇼 Rwanda-Ready Payments')}</h2>
          <p className="text-gray-600 mb-6" suppressHydrationWarning>{t('homepage.payments.subtitle', 'Accept all major payment methods your customers use every day.')}</p>
          <div className="flex flex-wrap justify-center gap-4">
            {['MTN MoMo', 'Airtel Money', 'Cash', 'IremboPay'].map((m) => (
              <span
                key={m}
                className="bg-white border border-slate-200 text-gray-700 text-sm font-medium px-5 py-2.5 rounded-full shadow-sm"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="bg-gradient-imboni text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" suppressHydrationWarning>{t('homepage.final_cta.title', 'Ready to grow your business?')}</h2>
          <p className="text-white/80 text-lg mb-8" suppressHydrationWarning>
            {t('homepage.final_cta.subtitle', 'Start your free 14-day trial today — no credit card needed. Join the Imboni Serve community of hospitality businesses across Rwanda.')}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/signup"
              className="bg-white text-imboni-blue px-8 py-3.5 rounded-xl font-semibold text-base hover:bg-slate-100 transition shadow-lg flex items-center gap-2"
            >
              {t('homepage.final_cta.cta_start', 'Get Started Free')} <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href={supportWhatsAppUrl}
              className="bg-imboni-green text-white px-8 py-3.5 rounded-xl font-semibold text-base hover:opacity-90 transition flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" /> {t('homepage.final_cta.cta_whatsapp', 'Chat on WhatsApp')}
            </a>
          </div>
        </div>
      </section>
    </div>
    </PublicLayout>
  )
}
