import type { AppProps } from 'next/app'
import dynamic from 'next/dynamic'
import { ToastProvider } from '@/components/Toast'
import { LocaleProvider } from '@/contexts/LocaleContext'
import { CartProvider } from '@/contexts/CartContext'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { setLocale, loadTranslations, type Locale } from '@/lib/i18n'
import '@/styles/globals.css'
import '@/styles/animations.css'
import '@/lib/analytics/pwa-telemetry'
import '@/lib/monitoring/sentry.client'
import InstallOmniboxHint from '@/components/InstallOmniboxHint'
import SWUpdateToast from '@/components/SWUpdateToast'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

// Load NextAuth's SessionProvider on the client to avoid build-time URL parsing
const SessionProviderNoSSR = dynamic(() => import('next-auth/react').then(m => m.SessionProvider), { ssr: false })

type ExtendedAppProps = AppProps & { initialLocale?: Locale }

function MyApp({ Component, pageProps, initialLocale }: ExtendedAppProps) {
  const router = useRouter()
  // Ensure SSR uses the correct locale to avoid hydration mismatches
  const ssrLocale = (initialLocale || router.locale || 'en') as Locale
  if (typeof window === 'undefined') {
    setLocale(ssrLocale)
    loadTranslations(ssrLocale)
  }
  
  // Sync custom i18n with Next.js router locale
  useEffect(() => {
    const routeLocale = (router.locale || 'en') as Locale
    setLocale(routeLocale)
    loadTranslations(routeLocale)
  }, [router.locale, router.asPath])
  
  useEffect(() => {
    // Register service worker for offline PWA support
    const enableDevSW = process.env.NEXT_PUBLIC_ENABLE_SW_DEV === 'true'
    if ('serviceWorker' in navigator && (process.env.NODE_ENV === 'production' || enableDevSW)) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration.scope)
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    }

    // Listen for online/offline events
    const handleOnline = () => {
      console.log('App is online - syncing outbox...')
      import('@/lib/services/outbox.service').then(({ outboxService }) => {
        outboxService.syncAll()
      })
    }

    const handleOffline = () => {
      console.log('App is offline - data will be queued')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <SessionProviderNoSSR session={(pageProps as any).session}>
      <Head>
        <link rel="icon" href="/imgs/imboni-serve-favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/imgs/imboni-serve-favicon.png" />
        <meta name="application-name" content="Imboni Serve" />
        <meta name="description" content="From QR code ordering to AI-powered insights — manage orders, menus, staff, and customers in one seamless system." />
      </Head>
      <LocaleProvider>
        <ToastProvider>
          <CartProvider>
            <div className={inter.className}>
              <Component {...pageProps} />
              <InstallOmniboxHint />
              <SWUpdateToast />
            </div>
          </CartProvider>
        </ToastProvider>
      </LocaleProvider>
    </SessionProviderNoSSR>
  )
}

export default MyApp
