export type ConsentPrefs = {
  functional: boolean
  analytics: boolean
  marketing: boolean
}

const PREFS_COOKIE = 'im_cookie_prefs'
const LEGACY_COOKIE = 'im_cookie_consent'

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const m = document.cookie.split('; ').find((c) => c.startsWith(name + '='))
  return m ? decodeURIComponent(m.split('=')[1]) : null
}

function writeCookie(name: string, value: string, maxAgeSec: number) {
  if (typeof document === 'undefined') return
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `max-age=${maxAgeSec}`,
    'path=/',
    'SameSite=Lax',
  ]
  if (isHttps) parts.push('Secure')
  document.cookie = parts.join('; ')
}

export function isDNTEnabled(): boolean {
  if (typeof window === 'undefined') return false
  const w: any = window
  const n: any = navigator
  return n?.doNotTrack === '1' || w?.doNotTrack === '1' || n?.msDoNotTrack === '1'
}

export function getConsent(): ConsentPrefs | null {
  try {
    const raw = readCookie(PREFS_COOKIE)
    if (raw) {
      const parsed = JSON.parse(raw)
      const prefs: ConsentPrefs = {
        functional: parsed.functional !== false, // default true
        analytics: !!parsed.analytics,
        marketing: !!parsed.marketing,
      }
      return prefs
    }
    const legacy = readCookie(LEGACY_COOKIE)
    if (legacy) {
      const all = legacy === 'accepted'
      return { functional: true, analytics: all, marketing: all }
    }
    return null
  } catch {
    return null
  }
}

export function setConsent(prefs: ConsentPrefs) {
  const maxAge = 60 * 60 * 24 * 180
  writeCookie(PREFS_COOKIE, JSON.stringify(prefs), maxAge)
  const legacy = prefs.analytics && prefs.marketing ? 'accepted' : 'rejected'
  writeCookie(LEGACY_COOKIE, legacy, maxAge)
  if (typeof window !== 'undefined') {
    ;(window as any).__im_consent = prefs
    window.dispatchEvent(new CustomEvent('im:consent:updated', { detail: prefs }))
  }
}

export function hasConsent(category: keyof ConsentPrefs): boolean {
  const prefs = (typeof window !== 'undefined' && (window as any).__im_consent) || getConsent()
  return !!prefs && !!prefs[category]
}

export function ensureGlobalConsentCached() {
  if (typeof window === 'undefined') return
  if (!(window as any).__im_consent) {
    const prefs = getConsent()
    if (prefs) (window as any).__im_consent = prefs
  }
}
