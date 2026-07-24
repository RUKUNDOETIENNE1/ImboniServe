import React from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Image from 'next/image'
import { Utensils, MessageCircle, ChevronDown, Moon, Sun } from 'lucide-react'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useTranslation } from '@/lib/i18n'
import CookieConsentBanner from '@/components/CookieConsentBanner'
import { useTheme } from '@/hooks/useTheme'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import InstallAppButton from '@/components/InstallAppButton'
import PublicSupportWidget from '@/components/PublicSupportWidget'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import NewsletterSignup from '@/components/NewsletterSignup'
import SocialShare from '@/components/SocialShare'

interface PublicLayoutProps {
  children: React.ReactNode
  title?: string
}

export default function PublicLayout({ children, title }: PublicLayoutProps) {
  const pageTitle = title ?? 'Imboni Serve'
  const [solutionsOpen, setSolutionsOpen] = React.useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const { t } = useTranslation()
  const router = useRouter()
  const { darkMode, toggleDarkMode } = useTheme()
  const { isInstalled } = usePWAInstall()

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
    <div className="min-h-screen bg-imboni-light dark:bg-gray-900 font-sans flex flex-col transition-colors">
      {/* NAV */}
      <nav className="bg-imboni-blue/95 dark:bg-gray-800/95 backdrop-blur-sm sticky top-0 z-50 border-b border-white/10 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/imgs/logo2.png" alt="Imboni Serve" className="h-8 w-auto" />
          </Link>
          <div className="hidden md:flex items-center gap-5 xl:gap-7 text-[13px] xl:text-sm text-white/80 whitespace-nowrap">
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
              className="whitespace-nowrap inline-flex items-center rounded-full bg-imboni-orange text-white px-4 py-2 shadow hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/50 transition"
              suppressHydrationWarning
            >
              <span className="hidden xl:inline">{t('public.nav.share_earn', 'Share & earn rewards')}</span>
              <span className="xl:hidden">{t('public.nav.share_earn_short', 'Share & earn')}</span>
            </Link>
            <Link href="/discover" className="hover:text-white transition" suppressHydrationWarning>{t('public.nav.discover', 'Discover')}</Link>
            <a href="https://wa.me/250735214496" className="hover:text-white transition" suppressHydrationWarning>{t('public.nav.contact', 'Contact')}</a>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-nowrap">
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
            <Link href="/login" className="text-white/80 text-sm hover:text-white transition hidden md:block" suppressHydrationWarning>{t('public.cta.sign_in', 'Sign in')}</Link>
            <Link
              href="/signup"
              className="bg-imboni-orange text-white font-semibold rounded-lg hover:bg-accent-dark transition whitespace-nowrap shrink-0 text-xs px-3 py-1.5 md:text-xs md:px-3.5 md:py-2 lg:text-sm lg:px-4 lg:py-2"
              suppressHydrationWarning
            >
              <span className="hidden sm:inline">{t('public.cta.start_trial', 'Start Free Trial')}</span>
              <span className="sm:hidden">{t('public.cta.trial', 'Trial')}</span>
            </Link>
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

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10">
            <div className="px-4 py-3 space-y-2">
              <Link href="/#features" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-white/80 hover:text-white transition" suppressHydrationWarning>{t('public.nav.features', 'Features')}</Link>
              <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-white/80 hover:text-white transition" suppressHydrationWarning>{t('public.nav.pricing', 'Pricing')}</Link>
              <div className="py-2">
                <div className="text-white/80 font-medium mb-2" suppressHydrationWarning>{t('public.nav.solutions', 'Solutions')}</div>
                <div className="pl-4 space-y-1">
                  <Link href="/discover" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-white/60 hover:text-white text-sm" suppressHydrationWarning>{t('public.nav.discover', 'Discover')}</Link>
                  <Link href="/store" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-white/60 hover:text-white text-sm" suppressHydrationWarning>{t('public.nav.store', 'Store')}</Link>
                  <Link href="/refer" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-white/60 hover:text-white text-sm" suppressHydrationWarning>{t('public.nav.referral', 'Referral Program')}</Link>
                </div>
              </div>
              <Link href="/discover" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-white/80 hover:text-white transition" suppressHydrationWarning>{t('public.nav.discover', 'Discover')}</Link>
              <a href="https://wa.me/250735214496" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-white/80 hover:text-white transition" suppressHydrationWarning>{t('public.nav.contact', 'Contact')}</a>
              <div className="pt-3 mt-3 border-t border-white/10 space-y-2">
                <InstallAppButton className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/30 text-white bg-white/10 hover:bg-white/20 transition-colors text-sm" label={t('public.cta.install', 'Install App')} />
                <Link href="/login" className="block w-full text-center py-2 text-white/80 hover:text-white transition text-sm" suppressHydrationWarning>{t('public.cta.sign_in', 'Sign in')}</Link>
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

      {/* PAGE CONTENT */}
      <main className="flex-1">
        {children}
      </main>

      {/* FOOTER */}
      <footer className="bg-imboni-dark text-white/50 text-sm py-8 px-4 mt-auto">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 pb-8 border-b border-white/10">
            <div>
              <NewsletterSignup sourcePage="public-footer" variant="footer" />
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
              {isInstalled ? (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm">
                  {t('public.cta.installed', 'Installed')}
                </span>
              ) : (
                <span className="inline-flex">
                  <InstallAppButton className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/30 text-white bg-white/10 hover:bg-white/20 transition-colors text-sm" label={t('public.cta.install', 'Install App')} />
                </span>
              )}
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
      <PublicSupportWidget />
      <PWAInstallPrompt />
    </div>
    </>
  )
}
