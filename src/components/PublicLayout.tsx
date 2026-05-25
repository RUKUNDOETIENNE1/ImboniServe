import React from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Utensils, MessageCircle, ChevronDown } from 'lucide-react'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useTranslation } from '@/lib/i18n'
import CookieConsentBanner from '@/components/CookieConsentBanner'

interface PublicLayoutProps {
  children: React.ReactNode
  title?: string
}

export default function PublicLayout({ children, title }: PublicLayoutProps) {
  const pageTitle = title ?? 'Imboni Serve'
  const [solutionsOpen, setSolutionsOpen] = React.useState(false)
  const { t } = useTranslation()
  const router = useRouter()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  const pathname = (router && router.asPath ? router.asPath.split('?')[0] : '') || ''
  const canonical = siteUrl ? `${siteUrl}${pathname}` : undefined
  const defaultDesc = t(
    'public.meta.description',
    'Imboni Serve is a modern platform for restaurants and hotels: QR ordering, real-time operations, AI insights, and mobile payments.'
  )
  const shareImage = (siteUrl ? `${siteUrl}` : '') + '/imgs/logo2.png'
  return (
    <>
    <Head>
      <title>{pageTitle}</title>
      <meta name="description" content={defaultDesc} />
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={defaultDesc} />
      {canonical && <meta property="og:url" content={canonical} />}
      <meta property="og:image" content={shareImage} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={defaultDesc} />
      <meta name="twitter:image" content={shareImage} />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Imboni Serve',
            url: siteUrl || undefined,
            logo: siteUrl ? `${siteUrl}/imgs/logo2.png` : '/imgs/logo2.png'
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Imboni Serve',
            url: siteUrl || undefined,
            potentialAction: {
              '@type': 'SearchAction',
              target: `${siteUrl || ''}/search?q={search_term_string}`,
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />
    </Head>
    <div className="min-h-screen bg-imboni-light font-sans flex flex-col">
      {/* NAV */}
      <nav className="bg-imboni-blue/95 backdrop-blur-sm sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/imgs/logo2.png" alt="Imboni Serve" className="h-8 w-auto" />
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/80">
            <Link href="/#features" className="hover:text-white transition" suppressHydrationWarning>{t('public.nav.features', 'Features')}</Link>
            <Link href="/pricing" className="hover:text-white transition" suppressHydrationWarning>{t('public.nav.pricing', 'Pricing')}</Link>
            <div className="relative">
              <button
                onClick={() => setSolutionsOpen(!solutionsOpen)}
                onBlur={() => setTimeout(() => setSolutionsOpen(false), 200)}
                className="flex items-center gap-1 hover:text-white transition"
                suppressHydrationWarning
              >
                {t('public.nav.solutions', 'Solutions')} <ChevronDown className="w-3 h-3" />
              </button>
              {solutionsOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50">
                  <Link href="/dashboard/site-builder" className="block px-4 py-2 text-slate-700 hover:bg-imboni-light transition">
                    <div className="font-medium">{t('public.nav.site_builder', 'Site Builder')}</div>
                    <div className="text-xs text-slate-500">{t('public.nav.create_website', 'Create your website')}</div>
                  </Link>
                  <Link href="/discover" className="block px-4 py-2 text-slate-700 hover:bg-imboni-light transition">
                    <div className="font-medium">{t('public.nav.marketplace', 'Marketplace')}</div>
                    <div className="text-xs text-slate-500">{t('public.nav.find_suppliers', 'Find suppliers & partners')}</div>
                  </Link>
                  <Link href="/store" className="block px-4 py-2 text-slate-700 hover:bg-imboni-light transition">
                    <div className="font-medium">{t('public.nav.store', 'Store')}</div>
                    <div className="text-xs text-slate-500">{t('public.nav.procurement_market', 'Procurement marketplace')}</div>
                  </Link>
                  <Link href="/dashboard/profile" className="block px-4 py-2 text-slate-700 hover:bg-imboni-light transition">
                    <div className="font-medium">{t('public.nav.list_business', 'List Your Business')}</div>
                    <div className="text-xs text-slate-500">{t('public.nav.get_discovered', 'Get discovered by customers')}</div>
                  </Link>
                  <Link href="/refer" className="block px-4 py-2 text-slate-700 hover:bg-imboni-light transition">
                    <div className="font-medium">{t('public.nav.referral', 'Referral Program')}</div>
                    <div className="text-xs text-slate-500">{t('public.nav.share_earn', 'Share & earn rewards')}</div>
                  </Link>
                </div>
              )}
            </div>
            <Link href="/#store" className="hover:text-white transition" suppressHydrationWarning>{t('public.nav.store', 'Store')}</Link>
            <Link
              href="/refer"
              className="whitespace-nowrap inline-flex items-center gap-1.5 rounded-full bg-imboni-orange text-white px-5 py-2.5 shadow hover:bg-imboni-orange/90 focus:outline-none focus:ring-2 focus:ring-white/50 transition"
              suppressHydrationWarning
            >
              <span aria-hidden>💸</span>
              {t('public.nav.share_earn', 'Share & earn rewards')}
            </Link>
            <Link href="/discover" className="hover:text-white transition" suppressHydrationWarning>{t('public.nav.discover', 'Discover')}</Link>
            <a href="https://wa.me/250735214496" className="hover:text-white transition" suppressHydrationWarning>{t('public.nav.contact', 'Contact')}</a>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <Link href="/login" className="text-white/80 text-sm hover:text-white transition hidden md:block" suppressHydrationWarning>{t('public.cta.sign_in', 'Sign in')}</Link>
            <Link
              href="/signup"
              className="bg-imboni-orange text-white font-semibold rounded-lg hover:bg-accent-dark transition whitespace-nowrap text-xs px-3 py-1.5 sm:text-sm sm:px-4 sm:py-2"
              suppressHydrationWarning
            >
              <span className="hidden sm:inline">{t('public.cta.start_trial', 'Start Free Trial')}</span>
              <span className="sm:hidden">{t('public.cta.start_trial_short', 'Free Trial')}</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* PAGE CONTENT */}
      <main className="flex-1">
        {children}
      </main>

      {/* FOOTER */}
      <footer className="bg-imboni-dark text-white/50 text-sm py-8 px-4 mt-auto">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-4">
            <div className="flex justify-center mb-3">
              <img src="/imgs/logo2.png" alt="Imboni Serve Logo" className="h-8 w-auto opacity-90" />
            </div>
            <p className="mb-3" suppressHydrationWarning> {new Date().getFullYear()} Imboni Serve. {t('public.footer.tagline', 'Built for the hospitality industry.')}</p>
            <div className="flex justify-center gap-6 flex-wrap">
              <Link href="/login" className="hover:text-white transition" suppressHydrationWarning>{t('public.cta.sign_in', 'Sign in')}</Link>
              <Link href="/signup" className="hover:text-white transition" suppressHydrationWarning>{t('public.footer.sign_up', 'Sign up')}</Link>
              <Link href="/pricing" className="hover:text-white transition" suppressHydrationWarning>{t('public.nav.pricing', 'Pricing')}</Link>
              <Link href="/discover" className="hover:text-white transition" suppressHydrationWarning>{t('public.nav.discover', 'Discover')}</Link>
              <Link href="/#store" className="hover:text-white transition" suppressHydrationWarning>{t('public.nav.store', 'Store')}</Link>
              <Link href="/faq" className="hover:text-white transition" suppressHydrationWarning>{t('public.footer.faqs', 'FAQs')}</Link>
              <a href="https://wa.me/250735214496" className="hover:text-white transition" suppressHydrationWarning>{t('public.nav.contact', 'Contact')}</a>
            </div>
          </div>
          <div className="border-t border-white/10 pt-4 text-center">
            <div className="flex justify-center gap-6 flex-wrap text-xs">
              <Link href="/terms" className="hover:text-white transition" suppressHydrationWarning>{t('public.footer.terms', 'Terms & Conditions')}</Link>
              <Link href="/privacy" className="hover:text-white transition" suppressHydrationWarning>{t('public.footer.privacy', 'Privacy Policy')}</Link>
              <Link href="/cookies" className="hover:text-white transition" suppressHydrationWarning>{t('public.footer.cookies', 'Cookie Policy')}</Link>
              <button
                type="button"
                onClick={() => typeof window !== 'undefined' && window.dispatchEvent(new Event('im:consent:open-preferences'))}
                className="hover:text-white transition underline underline-offset-4"
                title={t('public.footer.cookie_prefs', 'Cookie Preferences')}
              >
                {t('public.footer.cookie_prefs', 'Cookie Preferences')}
              </button>
              <Link href="/service-terms" className="hover:text-white transition" suppressHydrationWarning>{t('public.footer.service_terms', 'Service Terms')}</Link>
            </div>
            <div className="mt-3 text-xs text-white/40">
              <a href="https://www.icthubs.com" target="_blank" rel="noreferrer" className="hover:text-white/60">
                Powered by ICTHubs
              </a>
            </div>
          </div>
        </div>
      </footer>
      <CookieConsentBanner />
    </div>
    </>
  )
}
