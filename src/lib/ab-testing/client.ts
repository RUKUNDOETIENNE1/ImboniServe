export async function abServeForMenuItem(params: {
  businessId: string
  menuItemId: string
  visitorId: string
  userId?: string
}): Promise<{
  testId?: string
  variantId?: string
  variantName?: string
  changes?: Record<string, any>
} | null> {
  try {
    if (typeof window !== 'undefined') {
      try {
        const { hasConsent, ensureGlobalConsentCached } = await import('@/lib/consent')
        ensureGlobalConsentCached()
        if (!hasConsent('analytics')) return null
      } catch {}
    }
    const res = await fetch('/api/ab-testing/serve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    if (res.status === 204) return null
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function abTrackEvent(params: {
  testId: string
  variantId: string
  type: 'VIEW' | 'CLICK' | 'ORDER' | 'REVENUE' | 'CUSTOM'
  valueCents?: number
  metadata?: any
  visitorId?: string
  userId?: string
}): Promise<boolean> {
  try {
    if (typeof window !== 'undefined') {
      try {
        const { hasConsent, ensureGlobalConsentCached } = await import('@/lib/consent')
        ensureGlobalConsentCached()
        if (!hasConsent('analytics')) return true // treat as no-op success
      } catch {}
    }
    const res = await fetch('/api/ab-testing/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    return res.ok
  } catch {
    return false
  }
}
