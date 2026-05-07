import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

// Capture ?ref=CODE and set a 30-day referral cookie (last-click attribution)
// Also add request ID for observability
export function middleware(req: NextRequest) {
  const url = req.nextUrl
  const ref = url.searchParams.get('ref')

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

  if (ref && /^[a-zA-Z0-9_-]{3,32}$/.test(ref)) {
    const maxAge = 60 * 60 * 24 * 30 // 30 days
    res.cookies.set('im_ref', ref, {
      maxAge,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    })
  }

  const inv = url.searchParams.get('inv')
  if (inv && /^INV-[A-F0-9]{8}$/.test(inv)) {
    const maxAge = 60 * 60 * 24 * 30 // 30 days
    res.cookies.set('im_inv', inv, {
      maxAge,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    })
  }

  return res
}

// Apply to all routes except Next.js internals and static assets
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)$).*)',
  ],
}
