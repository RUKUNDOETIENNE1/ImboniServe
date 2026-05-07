import type { NextApiRequest } from 'next'
import type { ConsentPrefs } from '@/lib/consent'

const PREFS_COOKIE = 'im_cookie_prefs'
const LEGACY_COOKIE = 'im_cookie_consent'

function parsePrefs(raw: string | undefined | null): ConsentPrefs | null {
  if (!raw) return null
  try {
    const p = JSON.parse(raw as string)
    return {
      functional: p.functional !== false,
      analytics: !!p.analytics,
      marketing: !!p.marketing,
    }
  } catch {
    return null
  }
}

export function isDNTHeaderEnabled(req: NextApiRequest): boolean {
  const dnt = (req.headers as any)['dnt'] || (req.headers as any)['DNT']
  return String(dnt ?? '').trim() === '1'
}

export function getServerConsent(req: NextApiRequest): ConsentPrefs | null {
  try {
    const cookies: Record<string, string> = (req as any).cookies || {}
    // Prefer structured prefs
    const prefs = parsePrefs(cookies[PREFS_COOKIE])
    if (prefs) return prefs

    // Fallback to legacy
    const legacy = cookies[LEGACY_COOKIE]
    if (legacy) {
      const all = legacy === 'accepted'
      return { functional: true, analytics: all, marketing: all }
    }

    // No cookies -> fallback to DNT
    if (isDNTHeaderEnabled(req)) {
      return { functional: true, analytics: false, marketing: false }
    }

    return null
  } catch {
    // On error, be conservative (check DNT; otherwise unknown)
    if (isDNTHeaderEnabled(req)) {
      return { functional: true, analytics: false, marketing: false }
    }
    return null
  }
}

export function hasServerConsent(req: NextApiRequest, category: keyof ConsentPrefs): boolean {
  const prefs = getServerConsent(req)
  return !!prefs && !!(prefs as any)[category]
}
