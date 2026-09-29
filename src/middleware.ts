import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

// Capture referral params and set a 30-day cookie (last-click attribution)
// Canonical: ?ref=  | Aliases: ?aff=, ?partner=, ?m=, ?invite=, ?inv=
// Also add request ID for observability
const REFERRAL_PARAM_ALIASES = ['ref', 'aff', 'partner', 'm', 'invite', 'inv'] as const
const REFERRAL_CODE_REGEX = /^[a-zA-Z0-9_-]{3,32}$/

export function middleware(req: NextRequest) {
  const url = req.nextUrl

  // Add request ID for correlation and debugging
  const requestId = req.headers.get('x-request-id') || uuidv4()
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-request-id', requestId)

  // Always continue the request
  const res = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Add request ID to response headers for debugging
  res.headers.set('x-request-id', requestId)

  // Unified referral cookie: first matching alias wins
  for (const param of REFERRAL_PARAM_ALIASES) {
    const code = url.searchParams.get(param)
    if (code && REFERRAL_CODE_REGEX.test(code)) {
      const maxAge = 60 * 60 * 24 * 30 // 30 days
      res.cookies.set('im_ref', code, {
        maxAge,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      })
      // Also set im_inv for BusinessInvite backward compat when param is inv/invite
      if (param === 'inv' || param === 'invite') {
        res.cookies.set('im_inv', code, {
          maxAge,
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          path: '/',
        })
      }
      break
    }
  }

  // UTM parameter capture (CONTENT-002 — additive to referral logic)
  const UTM_PARAMS = [
    { param: 'utm_source', cookie: 'im_utm_source' },
    { param: 'utm_medium', cookie: 'im_utm_medium' },
    { param: 'utm_campaign', cookie: 'im_utm_campaign' },
    { param: 'utm_content', cookie: 'im_utm_content' },
    { param: 'utm_term', cookie: 'im_utm_term' },
  ] as const

  for (const { param, cookie } of UTM_PARAMS) {
    const value = url.searchParams.get(param)
    if (value) {
      res.cookies.set(cookie, value, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      })
    }
  }

  return res
}

// Apply to all routes except Next.js internals and static assets
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)$).*)',
  ],
}
