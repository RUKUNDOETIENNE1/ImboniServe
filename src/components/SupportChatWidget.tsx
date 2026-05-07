import { useEffect } from 'react'
import { hasConsent, ensureGlobalConsentCached } from '@/lib/consent'

// Lightweight Crisp chat loader. Set NEXT_PUBLIC_CRISP_WEBSITE_ID in env to enable.
export default function SupportChatWidget() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    ensureGlobalConsentCached()
    const init = () => {
      const websiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID
      if (!websiteId) return
      if (!hasConsent('marketing')) return
      if ((window as any).CRISP_INITIALIZED) return
      ;(window as any).$crisp = (window as any).$crisp || []
      ;(window as any).CRISP_WEBSITE_ID = websiteId
      const s = document.createElement('script')
      s.src = 'https://client.crisp.chat/l.js'
      s.async = true
      document.head.appendChild(s)
      ;(window as any).CRISP_INITIALIZED = true
    }

    const teardown = () => {
      // Best-effort disable Crisp if marketing revoked
      try {
        (window as any).$crisp = []
        ;(window as any).CRISP_INITIALIZED = false
        const scripts = Array.from(document.querySelectorAll('script[src*="crisp.chat"]'))
        scripts.forEach((el) => el.parentElement?.removeChild(el))
      } catch {}
    }

    init()
    const onConsent = (e: any) => {
      if (e?.detail && e.detail.marketing) {
        init()
      } else {
        teardown()
      }
    }
    window.addEventListener('im:consent:updated', onConsent)
    return () => window.removeEventListener('im:consent:updated', onConsent)
  }, [])

  return null
}
