import * as Sentry from '@sentry/nextjs'
import { hasConsent, ensureGlobalConsentCached } from '@/lib/consent'

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
  const initIfAllowed = () => {
    ensureGlobalConsentCached()
    if (!(window as any).__SENTRY_INIT_DONE && hasConsent('analytics')) {
      Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
        tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || '0'),
      })
      ;(window as any).__SENTRY_INIT_DONE = true
    }
  }
  initIfAllowed()
  window.addEventListener('im:consent:updated', initIfAllowed)
}
