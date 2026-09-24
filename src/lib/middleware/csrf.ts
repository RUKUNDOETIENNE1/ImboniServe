import { NextApiRequest, NextApiResponse } from 'next'

type ApiHandler = (req: NextApiRequest, res: NextApiResponse) => void | Promise<void>

/**
 * CSRF protection middleware for mutation endpoints.
 *
 * Validates that the Origin or Referer header matches the allowed origin
 * for POST, PUT, PATCH, and DELETE requests. GET and HEAD requests are
 * exempt (they should be side-effect free).
 *
 * This is a defense-in-depth measure. NextAuth already provides CSRF
 * tokens for its own endpoints; this extends protection to all API
 * mutation routes.
 *
 * Usage:
 *   export default withCsrf(handler)
 *   // or combined with other middleware:
 *   export default withCsrf(withRateLimit(handler))
 */
export function withCsrf(handler: ApiHandler): ApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const method = req.method?.toUpperCase() || ''

    // Only protect mutation methods
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const origin = req.headers['origin']
      const referer = req.headers['referer']
      const allowedOrigin = getAllowedOrigin(req)

      if (allowedOrigin) {
        const isValid = isOriginAllowed(origin, referer, allowedOrigin)
        if (!isValid) {
          return res.status(403).json({
            error: 'Cross-site request blocked',
            code: 'CSRF_VALIDATION_FAILED',
          })
        }
      }
      // If allowedOrigin cannot be determined (e.g., env not set in dev),
      // we allow the request but this should be enforced in production.
    }

    return handler(req, res)
  }
}

/**
 * Determine the allowed origin from environment variables or request headers.
 */
function getAllowedOrigin(req: NextApiRequest): string | null {
  // Prefer explicit configuration
  const envUrl = process.env.NEXTAUTH_URL || process.env.APP_URL
  if (envUrl) {
    return normalizeOrigin(envUrl)
  }

  // Fall back to the host header (same-origin requests)
  const protocol = req.headers['x-forwarded-proto'] || 'http'
  const host = req.headers['host']
  if (host) {
    return normalizeOrigin(`${protocol}://${host}`)
  }

  return null
}

/**
 * Check if the request origin matches the allowed origin.
 */
function isOriginAllowed(
  origin: string | string[] | undefined,
  referer: string | string[] | undefined,
  allowedOrigin: string
): boolean {
  // Check Origin header first (primary CSRF defense)
  if (origin) {
    const originStr = Array.isArray(origin) ? origin[0] : origin
    return normalizeOrigin(originStr) === allowedOrigin
  }

  // Fall back to Referer header if Origin is not present
  // (some browsers omit Origin for same-site requests)
  if (referer) {
    const refererStr = Array.isArray(referer) ? referer[0] : referer
    try {
      const refererUrl = new URL(refererStr)
      return normalizeOrigin(refererUrl.origin) === allowedOrigin
    } catch {
      return false
    }
  }

  // No Origin or Referer header on a mutation request — block
  return false
}

/**
 * Normalize an origin URL for comparison (remove trailing slash, lowercase).
 */
function normalizeOrigin(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.origin.toLowerCase().replace(/\/$/, '')
  } catch {
    // If it's not a full URL, just clean it up
    return url.toLowerCase().replace(/\/$/, '')
  }
}
