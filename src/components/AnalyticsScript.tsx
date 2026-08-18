import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function AnalyticsScript() {
  const router = useRouter()

  useEffect(() => {
    let sessionId = getCookie('im_session_id')
    if (!sessionId) {
      sessionId = `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      document.cookie = `im_session_id=${sessionId}; max-age=${60 * 30}; path=/; SameSite=Lax`
    }
  }, [])

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      trackEvent('PAGE_VIEW', { path: url })
    }

    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])

  return null
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`))
  return match ? match[2] : null
}

export function trackEvent(eventType: string, metadata?: Record<string, any>) {
  if (typeof window === 'undefined') return

  const articleId = (window as any).__articleId || null

  fetch('/api/public/content/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      articleId,
      eventType,
      metadata: metadata || {},
    }),
  }).catch(() => {})
}

export function trackReadComplete(articleId: string) {
  trackEvent('READ_COMPLETE', { articleId })
}

export function trackShare(articleId: string, platform: string) {
  trackEvent('SHARE', { articleId, platform })
}

export function trackCtaClick(articleId: string, ctaLabel: string) {
  trackEvent('CTA_CLICK', { articleId, ctaLabel })
}
