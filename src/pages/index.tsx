import React from 'react'
import Head from 'next/head'
import Image from 'next/image'
import { useRouter } from 'next/router'
import Link from 'next/link'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useTranslation } from '@/lib/i18n'
import {
  Check,
  BarChart3,
  ShoppingCart,
  Utensils,
  Package,
  BrainCircuit,
  Building2,
  MessageCircle,
  Smartphone,
  Shield,
  Star,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  Users,
  Clock,
  Receipt,
  Gift,
  Tag,
  Hotel,
  Palette,
  Sparkles,
  Rss,
  Globe,
  MapPin,
  QrCode,
  Calendar,
  Megaphone,
  Beaker,
  Mic,
  ChevronLeft,
  Bell,
  Moon,
  Sun,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import { PRICING_PLANS } from '@/config/pricing'
import { useTheme } from '@/hooks/useTheme'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import InstallAppButton from '@/components/InstallAppButton'
import PublicSupportWidget from '@/components/PublicSupportWidget'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import CookieConsentBanner from '@/components/CookieConsentBanner'
import BookDemoModal from '@/components/BookDemoModal'
import NewsletterSignup from '@/components/NewsletterSignup'
import SocialShare from '@/components/SocialShare'

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
    title: 'AI-Powered Insights',
    desc: 'Smart reorder recommendations and cost anomaly alerts that protect your profit margins.',
    color: 'bg-yellow-50 text-imboni-gold',
  },
  {
    icon: <Rss className="w-6 h-6" />,
    title: 'Content & Discovery Feed',
    desc: 'Publish posts, promos, and photos. Let customers discover and order directly from your feed.',
    color: 'bg-indigo-50 text-indigo-700',
  },
  {
    icon: <Receipt className="w-6 h-6" />,
    title: 'Smart Dining Slips™',
    desc: 'Auto-generated digital receipts with referral links — share & earn 1,000 RWF per friend.',
    color: 'bg-cyan-50 text-cyan-700',
  },
  {
    icon: <Gift className="w-6 h-6" />,
    title: 'Loyalty & Rewards',
    desc: 'Build customer loyalty with points, tiers, and redemption tracking across visits.',
    color: 'bg-pink-50 text-pink-700',
  },
  {
    icon: <Tag className="w-6 h-6" />,
    title: 'Promotions & Happy Hours',
    desc: 'Set time-based discounts and combo deals that activate and expire automatically.',
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
    desc: 'Accept MTN MoMo and Airtel Money natively — no POS terminal required.',
    color: 'bg-purple-50 text-purple-700',
  },
  {
    icon: <Building2 className="w-6 h-6" />,
    title: 'Multi-Branch Control',
    desc: 'Manage multiple locations from one dashboard with consolidated and per-branch reporting.',
    color: 'bg-slate-50 text-slate-700',
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
    icon: <Hotel className="w-5 h-5" />,
    title: 'Hotel Mode',
    desc: 'Room management, service areas, and front desk operations built-in.',
  },
  {
    icon: <Palette className="w-5 h-5" />,
    title: 'Site Builder',
    desc: 'Launch your own website with customizable templates — no code needed.',
  },
  {
    icon: <Sparkles className="w-5 h-5" />,
    title: 'AI Menu Builder',
    desc: 'Upload a photo or document and let AI build your menu for you.',
  },
  {
    icon: <Globe className="w-5 h-5" />,
    title: 'Discovery Marketplace',
    desc: 'Get listed on a public directory where customers search for places to eat.',
  },
  {
    icon: <Gift className="w-5 h-5" />,
    title: 'Referral Program',
    desc: 'Customers earn 1,000 RWF per referral. No limits, no caps — just instant rewards.',
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: 'Staff & Roles',
    desc: 'Granular role permissions: waiter, cashier, supervisor, manager, and more.',
  },
]

// Stats will be rendered with translations inline

const heroSlides = [
  {
    title: 'Turn Every Table Into',
    highlight: 'Faster Revenue',
    subtitle: 'Be Seen. Get Orders. Grow Fast.',
    description: 'Reduce wait times, serve more customers, and streamline your operations—QR ordering, POS, and AI insights in one platform.',
    image: '/imgs/ideogr1.jpg'
  },
  {
    title: 'Smart QR Ordering',
    highlight: 'Zero Wait Time',
    subtitle: 'Customers Order from Their Phones',
    description: 'Scan, browse menu, and place orders instantly. No app downloads. No staff interruptions. Pure efficiency.',
    image: '/imgs/ideogr 2.jpg'
  },
  {
    title: 'AI-Powered Insights',
    highlight: 'Data-Driven Growth',
    subtitle: 'Know Your Business Inside Out',
    description: 'Track sales, predict demand, optimize inventory, and make smarter decisions with actionable AI recommendations.',
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
  const { darkMode, toggleDarkMode } = useTheme()
  const { isInstalled } = usePWAInstall()
  const [billing, setBilling] = React.useState<'monthly' | 'annual'>('annual')
  const [solutionsOpen, setSolutionsOpen] = React.useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)
  const [currentSlide, setCurrentSlide] = React.useState(0)
  const [showDemo, setShowDemo] = React.useState(false)
  const rtRef = React.useRef<HTMLDivElement>(null)
  const growthRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [])

  React.useEffect(() => {
    const onScroll = () => setScrolled(typeof window !== 'undefined' && window.scrollY > 4)
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', onScroll)
      onScroll()
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('scroll', onScroll)
      }
    }
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
      icon: <Mic className="w-6 h-6" />, 
      title: t('homepage.growth.voice_title', 'Voice Ordering (WhatsApp AI)'),
      desc: t('homepage.growth.voice_desc', 'Let customers order by voice in EN / FR / RW.'),
      href: '/dashboard/ai',
      cta: t('homepage.growth.voice_cta', 'Explore AI')
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
  const navClass = `bg-imboni-blue/95 dark:bg-gray-800/95 backdrop-blur-sm sticky top-0 z-50 border-b border-white/10 dark:border-gray-700 transition-colors transition-shadow ${scrolled ? 'shadow-md' : ''}`

  return (
    <>
    <Head>
      <title>Imboni Serve — Restaurant & Hotel Management Platform</title>
      <meta name="description" content="From QR code ordering to AI-powered insights — manage orders, menus, staff, customers and analytics in one seamless system." />
      <meta name="robots" content="index,follow" />
      {siteUrl && <link rel="canonical" href={`${siteUrl}${router.asPath.split('?')[0]}`} />}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content="Imboni Serve — Restaurant & Hotel Management Platform" />
      <meta property="og:description" content="From QR code ordering to AI-powered insights — manage orders, menus, staff, customers and analytics in one seamless system." />
      {siteUrl && <meta property="og:url" content={`${siteUrl}${router.asPath.split('?')[0]}`} />}
      <meta property="og:image" content={(siteUrl ? `${siteUrl}` : '') + '/imgs/logo2.png'} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Imboni Serve — Restaurant & Hotel Management Platform" />
      <meta name="twitter:description" content="From QR code ordering to AI-powered insights — manage orders, menus, staff, customers and analytics in one seamless system." />
      <meta name="twitter:image" content={(siteUrl ? `${siteUrl}` : '') + '/imgs/logo2.png'} />

      

      {/* JSON-LD: Organization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Imboni Serve',
          url: `${siteUrl}/`,
          logo: `${siteUrl}/imgs/logo2.png`,
          sameAs: [],
        }) }}
      />

      {/* JSON-LD: SoftwareApplication */}
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
    <div key={locale} className="min-h-screen bg-imboni-light dark:bg-gray-900 font-sans transition-colors">

      {/* ── NAV ── */}
      <nav className={navClass}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[56px] md:min-h-[60px] lg:min-h-[64px] py-0.5 md:py-1 flex items-center justify-between md:grid md:grid-cols-[max-content,1fr,max-content] md:items-center md:gap-6">
          <div className="flex items-center gap-3 md:justify-self-start">
            <div className="flex flex-col items-center md:items-start">
              <Image src="/imgs/logo2.png" alt="Imboni Serve" width={120} height={48} className="h-10 w-auto md:h-12" priority />
              <span className="hidden xl:block mt-1 text-xs lg:text-sm text-white/90 font-medium tracking-wide leading-tight" suppressHydrationWarning>
                {t('homepage.nav_tagline', 'Run Smarter. Serve Better.')}
              </span>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center justify-center gap-4 xl:gap-6 text-[13px] xl:text-sm text-white/80 md:justify-self-center" aria-label="Primary">
            <Link href="/#features" className="hover:text-white transition whitespace-nowrap" suppressHydrationWarning>{t('public.nav.features', 'Features')}</Link>
            <Link href="/#pricing" className="hover:text-white transition whitespace-nowrap" suppressHydrationWarning>{t('public.nav.pricing', 'Pricing')}</Link>
            <div className="relative">
              <button
                onClick={() => setSolutionsOpen(!solutionsOpen)}
                onBlur={() => setTimeout(() => setSolutionsOpen(false), 200)}
                className="flex items-center gap-1 hover:text-white transition whitespace-nowrap"
                suppressHydrationWarning
                aria-haspopup="menu"
                aria-expanded={solutionsOpen}
              >
                {t('public.nav.solutions', 'Solutions')} <ChevronDown className="w-3 h-3" />
              </button>
              {solutionsOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50" role="menu">
                  <Link href="/discover" className="block px-4 py-2 text-slate-700 hover:bg-imboni-light transition">
                    <div className="font-medium">{t('public.nav.marketplace', 'Marketplace')}</div>
                    <div className="text-xs text-slate-500">{t('public.nav.find_suppliers', 'Find suppliers & partners')}</div>
                  </Link>
                  <Link href="/store" className="block px-4 py-2 text-slate-700 hover:bg-imboni-light transition">
                    <div className="font-medium">{t('public.nav.store', 'Store')}</div>
                    <div className="text-xs text-slate-500">{t('public.nav.procurement_market', 'Procurement marketplace')}</div>
                  </Link>
                  <Link href="/refer" className="block px-4 py-2 text-slate-700 hover:bg-imboni-light transition">
                    <div className="font-medium">{t('public.nav.referral', 'Referral Program')}</div>
                    <div className="text-xs text-slate-500">{t('public.nav.share_earn', 'Share & earn rewards')}</div>
                  </Link>
                </div>
              )}
            </div>
            <Link href="#store" className="hover:text-white transition whitespace-nowrap">{t('public.nav.store', 'Store')}</Link>
            <Link
              href="/refer"
              className="whitespace-nowrap inline-flex items-center rounded-full bg-imboni-orange text-white px-4 py-2 shadow hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/50 transition"
            >
              {t('public.nav.share_earn', 'Share & earn rewards')}
            </Link>
            <Link href="/discover" className="hover:text-white transition whitespace-nowrap">{t('public.nav.discover', 'Discover')}</Link>
            <a href={supportWhatsAppUrl} className="hover:text-white transition whitespace-nowrap">{t('public.nav.contact', 'Contact')}</a>
          </div>
          
          {/* Right side actions */}
          <div className="flex items-center gap-2 md:gap-3 md:justify-self-end flex-nowrap">
            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-white/20 transition"
              title={darkMode ? 'Light Mode' : 'Dark Mode'}
            >
              {darkMode ? (
                <Sun size={20} className="text-yellow-300" />
              ) : (
                <Moon size={20} className="text-white" />
              )}
            </button>
            <LanguageSwitcher />
            {isInstalled && (
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs">
                {t('public.cta.installed', 'Installed')}
              </span>
            )}
            
            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className="text-white/80 text-sm hover:text-white transition">{t('public.cta.sign_in', 'Sign in')}</Link>
              <Link
                href="/signup"
                className="bg-imboni-orange text-white font-semibold rounded-lg hover:bg-accent-dark transition whitespace-nowrap shrink-0 text-xs px-3 py-1.5 md:text-sm md:px-4 md:py-2"
              >
                <span className="hidden lg:inline">{t('public.cta.start_trial', 'Start Free Trial')}</span>
                <span className="lg:hidden">{t('public.cta.free_trial', 'Free Trial')}</span>
              </Link>
            </div>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/20 transition text-white"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>


        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10">
            <div className="px-4 py-3 space-y-2">
              <Link href="/#features" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-white/80 hover:text-white transition" suppressHydrationWarning>{t('public.nav.features', 'Features')}</Link>
              <Link href="/#pricing" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-white/80 hover:text-white transition" suppressHydrationWarning>{t('public.nav.pricing', 'Pricing')}</Link>
              <div className="py-2">
                <div className="text-white/80 font-medium mb-2">{t('public.nav.solutions', 'Solutions')}</div>
                <div className="pl-4 space-y-1">
                  <Link href="/discover" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-white/60 hover:text-white text-sm">{t('public.nav.marketplace', 'Marketplace')}</Link>
                  <Link href="/store" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-white/60 hover:text-white text-sm">{t('public.nav.store', 'Store')}</Link>
                  <Link href="/refer" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-white/60 hover:text-white text-sm">{t('public.nav.referral', 'Referral Program')}</Link>
                </div>
              </div>
              <Link href="#store" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-white/80 hover:text-white transition">{t('public.nav.store', 'Store')}</Link>
              <Link href="/refer" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-white/80 hover:text-white transition">{t('public.nav.share_earn', 'Share & Earn')}</Link>
              <Link href="/discover" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-white/80 hover:text-white transition">{t('public.nav.discover', 'Discover')}</Link>
              <a href={supportWhatsAppUrl} onClick={() => setMobileMenuOpen(false)} className="block py-2 text-white/80 hover:text-white transition">{t('public.nav.contact', 'Contact')}</a>
              
              <div className="pt-3 mt-3 border-t border-white/10 space-y-2">
                {isInstalled && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs">
                    {t('public.cta.installed', 'Installed')}
                  </span>
                )}
                <InstallAppButton className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/30 text-white bg-white/10 hover:bg-white/20 transition-colors text-sm" label={t('public.cta.install', 'Install App')} />
                <Link href="/login" className="block w-full text-center py-2 text-white/80 hover:text-white transition text-sm">{t('public.cta.sign_in', 'Sign in')}</Link>
                <Link
                  href="/signup"
                  className="block w-full text-center bg-imboni-orange text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-accent-dark transition"
                >
                  {t('public.cta.start_trial', 'Start Free Trial')}
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

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
          <div className="inline-block bg-white/10 border border-white/20 text-white/90 text-sm font-medium px-4 py-1.5 rounded-full mb-6 animate-fade-in-down">
            🎉 {t('homepage.hero.launch_badge', 'Launch Special — 50% OFF All Plans')}
          </div>
          
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
                    {t('homepage.hero.description', 'Built for restaurants, hotels, bars, and cafés.')}
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
              {t('homepage.hero.cta_primary', 'Start 14-Day Free Trial')} <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setShowDemo(true)}
              className="bg-white text-imboni-blue px-8 py-3.5 rounded-xl font-semibold text-base hover:bg-slate-100 hover:scale-105 transition-all shadow-lg flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" /> {t('growth.book_demo', 'Book a Demo')}
            </button>
            <Link
              href="/discover"
              className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white px-8 py-3.5 rounded-xl font-semibold text-base hover:bg-white/20 hover:scale-105 transition-all flex items-center gap-2"
            >
              <MapPin className="w-4 h-4" /> {t('homepage.hero.cta_explore', 'Explore Businesses Near You')}
            </Link>
            <Link
              href="#pricing"
              className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white px-8 py-3.5 rounded-xl font-semibold text-base hover:bg-white/20 hover:scale-105 transition-all"
            >
              {t('homepage.hero.cta_secondary', 'View Pricing')}
            </Link>
            <InstallAppButton className="inline-flex items-center gap-2 px-4 py-3.5 rounded-xl border border-white/30 text-white bg-white/10 hover:bg-white/20 transition-all text-base" label={t('homepage.hero.cta_install', 'Install App')} />
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

      {/* ── AUTO‑GROWTH ENGINES CAROUSEL ── */}
      <section className="py-12 px-4 bg-imboni-light border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="inline-block bg-imboni-orange/10 text-imboni-orange text-xs font-semibold px-3 py-1 rounded-full mb-2" suppressHydrationWarning>
                {t('homepage.growth.badge', 'Auto‑Growth Engines')}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-imboni-blue" suppressHydrationWarning>
                {t('homepage.growth.title', 'Grow Revenue on Autopilot')}
              </h2>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <button onClick={() => scrollCarousel(growthRef, -1)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50">
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <button onClick={() => scrollCarousel(growthRef, 1)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50">
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>

          <div ref={growthRef} className="snap-x snap-mandatory overflow-x-auto no-scrollbar -mx-4 px-4">
            <div className="flex gap-4 min-w-full">
              {growthSlides.map((s, i) => (
                <div key={i} className="snap-start shrink-0 w-80 bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
                  <div className="w-10 h-10 rounded-xl bg-imboni-orange/10 text-imboni-orange flex items-center justify-center mb-3">
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

      {/* ── STORE ── */}
      <section id="store" className="py-16 px-4 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="order-2 md:order-1">
            <div className="inline-block bg-imboni-blue/10 text-imboni-blue text-xs font-semibold px-3 py-1 rounded-full mb-3" suppressHydrationWarning>
              {t('homepage.store.badge', 'Procurement Store')}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-imboni-blue mb-3" suppressHydrationWarning>
              {t('homepage.store.title', 'Buy supplies from trusted suppliers — all in one place')}
            </h2>
            <p className="text-gray-600 mb-6 text-lg" suppressHydrationWarning>
              {t('homepage.store.subtitle', 'Discover verified suppliers, compare prices, and order directly. Track deliveries and keep costs under control.')}
            </p>
            <div className="flex gap-3">
              <a
                href="/store"
                className="bg-imboni-orange text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-accent-dark transition flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" /> {t('homepage.store.cta_browse', 'Browse Store')}
              </a>
              <a
                href="/discover"
                className="bg-slate-100 text-imboni-blue px-6 py-3 rounded-xl font-semibold text-sm hover:bg-slate-200 transition"
              >
                {t('homepage.store.cta_explore', 'Explore Marketplace')}
              </a>
            </div>
          </div>
          <div className="order-1 md:order-2 flex justify-center">
            <Image src="/imgs/imboniserve-marketplace.png" alt="Imboni Serve" width={352} height={176} className="h-32 w-auto md:h-44" />
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
            {t('homepage.video.subtitle', 'Watch how restaurants streamline operations with our all-in-one platform.')}
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
              <p className="text-xs text-slate-500 mt-0.5" suppressHydrationWarning>{t('homepage.video.description', 'See how Imboni Serve transforms restaurant operations')}</p>
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
              {t('homepage.how_it_works.subtitle', '6 simple steps to digitize your business & start serving smarter')}
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
                {t('homepage.how_it_works.step2_desc', 'Add dishes and drinks with photos, prices, and descriptions. Use our AI Menu Builder to upload a photo or PDF and auto-generate your menu instantly.')}
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
            <div className="text-2xl font-bold text-imboni-blue">500+</div>
            <div className="text-sm text-gray-500" suppressHydrationWarning>{t('homepage.stats.businesses', 'Businesses served')}</div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-imboni-blue/10 text-imboni-blue flex items-center justify-center mb-2">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-imboni-blue">10,000+</div>
            <div className="text-sm text-gray-500" suppressHydrationWarning>{t('homepage.stats.orders', 'Orders processed')}</div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-imboni-blue/10 text-imboni-blue flex items-center justify-center mb-2">
              <Clock className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-imboni-blue">14 days</div>
            <div className="text-sm text-gray-500" suppressHydrationWarning>{t('homepage.stats.trial', 'Free trial, no card needed')}</div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-imboni-blue/10 text-imboni-blue flex items-center justify-center mb-2">
              <Star className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-imboni-blue">50+</div>
            <div className="text-sm text-gray-500" suppressHydrationWarning>{t('homepage.stats.features', 'Features included')}</div>
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
              {t('homepage.features.subtitle', 'From orders to procurement, analytics to multi-branch — Imboni Serve covers every part of your business.')}
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
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-pink-50 text-pink-700">
                <Gift className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2" suppressHydrationWarning>{t('homepage.features.loyalty', 'Loyalty & Rewards')}</h3>
              <p className="text-sm text-gray-500 leading-relaxed" suppressHydrationWarning>{t('homepage.features.loyalty_desc', 'Build customer loyalty with points, tiers, and redemption tracking across visits.')}</p>
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
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-slate-50 text-slate-700">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2" suppressHydrationWarning>{t('homepage.features.multi_branch', 'Multi-Branch Control')}</h3>
              <p className="text-sm text-gray-500 leading-relaxed" suppressHydrationWarning>{t('homepage.features.multi_branch_desc', 'Manage multiple locations from one dashboard with consolidated and per-branch reporting.')}</p>
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

      {/* ── PRICING ── */}
      <section id="pricing" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-imboni-blue mb-4" suppressHydrationWarning>
              {t('pricing.heading', 'Simple Pricing for All Hospitality Businesses')}
            </h2>
            <p className="text-gray-600 mb-2 text-lg" suppressHydrationWarning>
              {t('pricing.subheading', 'Choose the perfect plan for your restaurant, hotel, bar, or café. All plans include WhatsApp integration and mobile money support.')}
            </p>
            <p className="text-sm text-imboni-orange font-semibold tracking-wide" suppressHydrationWarning>
              {t('pricing.tagline', 'Unified. Intelligent. Reliable.')}
            </p>
          </div>
          {/* Billing toggle */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center bg-slate-100 rounded-xl p-1 shadow-inner">
              <button
                onClick={() => setBilling('monthly')}
                className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  billing === 'monthly' ? 'bg-imboni-blue text-white shadow' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t('pricing.monthly', 'Monthly')}
              </button>
              <button
                onClick={() => setBilling('annual')}
                className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                  billing === 'annual' ? 'bg-imboni-blue text-white shadow' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t('pricing.annual', 'Annual')}
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold" suppressHydrationWarning>
                  {t('pricing.save_25', 'Save 25%')}
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.code}
                className={`relative bg-white rounded-2xl border p-8 flex flex-col transition-all hover:shadow-xl ${
                  plan.popular
                    ? 'border-imboni-orange ring-2 ring-imboni-orange shadow-lg'
                    : 'border-slate-200 shadow-sm'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-imboni-orange text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow" suppressHydrationWarning>
                      {t('pricing.most_popular', '⭐ Most Popular')}
                    </span>
                  </div>
                )}
                {plan.badge && !plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-imboni-blue text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow" suppressHydrationWarning>
                      {t('pricing.multi_branch', '🏢 Multi-Branch')}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1" suppressHydrationWarning>
                    {t(`pricing.plan_${plan.code.toLowerCase()}_name`, plan.name)}
                  </h3>
                  <p className="text-sm text-gray-500" suppressHydrationWarning>
                    {t(`pricing.plan_${plan.code.toLowerCase()}_desc`, plan.description)}
                  </p>
                </div>

                <div className="mb-6">
                  {billing === 'monthly' ? (
                    typeof plan.monthlyPrice === 'number' ? (
                      <>
                        <div className="text-lg text-gray-400 line-through">{formatCurrency((plan.monthlyPrice || 0) * 2, displayCurrency)}</div>
                        <div>
                          <span className="text-4xl font-extrabold text-gray-900">{formatCurrency(plan.monthlyPrice || 0, displayCurrency, { showSymbol: false })}</span>
                          <span className="text-gray-500 text-sm ml-1" suppressHydrationWarning>{displayCurrency}{t('pricing.per_month', ' / month')}</span>
                        </div>
                        <div className="text-xs text-green-600 font-medium mt-1" suppressHydrationWarning>50% Launch Discount</div>
                      </>
                    ) : (
                      <div>
                        <span className="text-4xl font-extrabold text-gray-900" suppressHydrationWarning>{t('pricing.custom_pricing', 'Custom Pricing')}</span>
                      </div>
                    )
                  ) : (
                    typeof plan.annualMonthly === 'number' ? (
                      <>
                        <div className="text-lg text-gray-400 line-through">{formatCurrency(((plan.annualMonthly as number) || 0) * 2, displayCurrency)}</div>
                        <div>
                          <span className="text-4xl font-extrabold text-gray-900">{formatCurrency((plan.annualMonthly as number) || 0, displayCurrency, { showSymbol: false })}</span>
                          <span className="text-gray-500 text-sm ml-1" suppressHydrationWarning>{displayCurrency}{t('pricing.per_month', ' / month')}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5" suppressHydrationWarning>
                          {t('pricing.billed_annually', 'Billed annually')}: {formatCurrency((plan.annualTotal as number) || 0, displayCurrency)}
                        </div>
                        {typeof plan.monthlyPrice === 'number' && typeof plan.annualMonthly === 'number' && (
                          <div className="text-xs text-green-600 font-medium mt-0.5" suppressHydrationWarning>
                            50% Launch Discount + {t('pricing.save_25', 'Save 25%')} ({formatCurrency(((plan.monthlyPrice as number) - (plan.annualMonthly as number)) * 12, displayCurrency)}{t('pricing.per_year', ' / year')})
                          </div>
                        )}
                      </>
                    ) : (
                      <div>
                        <span className="text-4xl font-extrabold text-gray-900" suppressHydrationWarning>{t('pricing.custom_pricing', 'Custom Pricing')}</span>
                      </div>
                    )
                  )}
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f, i) => {
                    const key = `pricing.feature_${f
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '_')
                      .replace(/_+/g, '_')
                      .replace(/^_|_$/g, '')}`
                    return (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span suppressHydrationWarning>{t(key, f)}</span>
                      </li>
                    )
                  })}
                </ul>

                <button
                  onClick={() => router.push(`/signup?plan=${plan.code}`)}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                    plan.popular
                      ? 'bg-imboni-orange text-white hover:bg-accent-dark shadow-md hover:shadow-orange-200'
                      : 'bg-slate-100 text-imboni-blue hover:bg-primary-100'
                  }`}
                >
                  {t('pricing.choose', 'Choose')} {t(`pricing.plan_${plan.code.toLowerCase()}_name`, plan.name)}
                </button>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-500 text-sm mt-8" suppressHydrationWarning>
            {t('pricing.need_help', 'Need help choosing?')}{' '}
            <a href={supportWhatsAppUrl} className="text-imboni-blue font-medium hover:text-imboni-orange transition">
              {t('pricing.chat_whatsapp', 'Chat with us on WhatsApp')}
            </a>
          </p>
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
            <div className="flex items-start gap-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-imboni-blue/10 text-imboni-blue flex items-center justify-center flex-shrink-0">
                <Hotel className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1" suppressHydrationWarning>{t('homepage.advanced.hotel_mode', 'Hotel Mode')}</h3>
                <p className="text-sm text-gray-500 leading-relaxed" suppressHydrationWarning>{t('homepage.advanced.hotel_mode_desc', 'Room management, service areas, and front desk operations built-in.')}</p>
              </div>
            </div>
            <div className="flex items-start gap-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-imboni-blue/10 text-imboni-blue flex items-center justify-center flex-shrink-0">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1" suppressHydrationWarning>{t('homepage.advanced.site_builder', 'Site Builder')}</h3>
                <p className="text-sm text-gray-500 leading-relaxed" suppressHydrationWarning>{t('homepage.advanced.site_builder_desc', 'Launch your own website with customizable templates — no code needed.')}</p>
              </div>
            </div>
            <div className="flex items-start gap-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-imboni-blue/10 text-imboni-blue flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1" suppressHydrationWarning>{t('homepage.advanced.ai_menu', 'AI Menu Builder')}</h3>
                <p className="text-sm text-gray-500 leading-relaxed" suppressHydrationWarning>{t('homepage.advanced.ai_menu_desc', 'Upload a photo or document and let AI build your menu for you.')}</p>
              </div>
            </div>
            <div className="flex items-start gap-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-imboni-blue/10 text-imboni-blue flex items-center justify-center flex-shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1" suppressHydrationWarning>{t('homepage.advanced.marketplace', 'Discovery Marketplace')}</h3>
                <p className="text-sm text-gray-500 leading-relaxed" suppressHydrationWarning>{t('homepage.advanced.marketplace_desc', 'Get listed on a public directory where customers search for places to eat.')}</p>
              </div>
            </div>
            <div className="flex items-start gap-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-imboni-blue/10 text-imboni-blue flex items-center justify-center flex-shrink-0">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1" suppressHydrationWarning>{t('homepage.advanced.referral', 'Referral Program')}</h3>
                <p className="text-sm text-gray-500 leading-relaxed" suppressHydrationWarning>{t('homepage.advanced.referral_desc', 'Customers earn rewards for every referral. No limits, no caps — just instant rewards.')}</p>
              </div>
            </div>
            <div className="flex items-start gap-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-imboni-blue/10 text-imboni-blue flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1" suppressHydrationWarning>{t('homepage.advanced.staff', 'Staff & Roles')}</h3>
                <p className="text-sm text-gray-500 leading-relaxed" suppressHydrationWarning>{t('homepage.advanced.staff_desc', 'Granular role permissions: waiter, cashier, supervisor, manager, and more.')}</p>
              </div>
            </div>
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
            {['MTN MoMo', 'Airtel Money', 'Cash', 'Card / POS', 'IremboPay'].map((m) => (
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
            {t('homepage.final_cta.subtitle', 'Join 500+ hospitality businesses across Rwanda using Imboni Serve. Start your free 14-day trial today — no credit card needed.')}
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

      {/* ── FOOTER ── */}
      <footer className="bg-imboni-dark text-white/50 text-sm py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Newsletter & Social Share */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 pb-8 border-b border-white/10">
            <div>
              <NewsletterSignup sourcePage="homepage-footer" variant="footer" />
            </div>
            <div>
              <SocialShare 
                title="ImboniServe" 
                text="Discover ImboniServe – Smart Dining for Restaurants in Rwanda"
                variant="compact"
              />
            </div>
          </div>

          <div className="text-center mb-4">
            <div className="flex justify-center mb-3">
              <Image src="/imgs/logo2.png" alt="Imboni Serve Logo" width={100} height={32} className="h-8 w-auto opacity-90" />
            </div>
            <p className="mb-3" suppressHydrationWarning>© {new Date().getFullYear()} {t('homepage.footer.copyright', 'Imboni Serve. Built for the hospitality industry.')}</p>
            <div className="flex justify-center gap-6 flex-wrap">
              <a href="/login" className="hover:text-white transition" suppressHydrationWarning>{t('homepage.footer.sign_in', 'Sign In')}</a>
              <a href="/signup" className="hover:text-white transition" suppressHydrationWarning>{t('homepage.footer.sign_up', 'Sign Up')}</a>
              <a href="#pricing" className="hover:text-white transition" suppressHydrationWarning>{t('homepage.footer.pricing', 'Pricing')}</a>
              {isInstalled ? (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm">
                  {t('homepage.footer.installed', 'Installed')}
                </span>
              ) : (
                <span className="inline-flex">
                  <InstallAppButton className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/30 text-white bg-white/10 hover:bg-white/20 transition-colors text-sm" label={t('homepage.footer.install', 'Install App')} />
                </span>
              )}
              <a href="#store" className="hover:text-white transition" suppressHydrationWarning>{t('homepage.footer.store', 'Store')}</a>
              <a href="/discover" className="hover:text-white transition" suppressHydrationWarning>{t('homepage.footer.discover', 'Discover')}</a>
              <a href="/faq" className="hover:text-white transition" suppressHydrationWarning>{t('homepage.footer.faqs', 'FAQs')}</a>
              <a href={supportWhatsAppUrl} className="hover:text-white transition" suppressHydrationWarning>{t('homepage.footer.contact', 'Contact')}</a>
            </div>
          </div>
          <div className="border-t border-white/10 pt-4 text-center">
            <div className="flex justify-center gap-6 flex-wrap text-xs">
              <a href="/terms" className="hover:text-white transition" suppressHydrationWarning>{t('homepage.footer.terms', 'Terms & Conditions')}</a>
              <a href="/privacy" className="hover:text-white transition" suppressHydrationWarning>{t('homepage.footer.privacy', 'Privacy Policy')}</a>
              <a href="/cookies" className="hover:text-white transition" suppressHydrationWarning>{t('homepage.footer.cookies', 'Cookie Policy')}</a>
              <button
                type="button"
                onClick={() => typeof window !== 'undefined' && window.dispatchEvent(new Event('im:consent:open-preferences'))}
                className="hover:text-white transition underline underline-offset-4"
              >
                {t('public.footer.cookie_prefs', 'Cookie Preferences')}
              </button>
              <a href="/service-terms" className="hover:text-white transition" suppressHydrationWarning>{t('homepage.footer.service_terms', 'Service Terms')}</a>
            </div>
            <div className="mt-3 text-xs text-white/40">
              <a href="https://www.icthubs.com" target="_blank" rel="noreferrer" className="hover:text-white/60">
                Powered by ICTHubs
              </a>
            </div>
          </div>
        </div>
      </footer>

      <PublicSupportWidget />
      <PWAInstallPrompt />
      <CookieConsentBanner />
      <BookDemoModal isOpen={showDemo} onClose={() => setShowDemo(false)} />
    </div>
    </>
  )
}
