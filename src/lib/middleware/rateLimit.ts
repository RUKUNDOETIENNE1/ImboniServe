import { NextApiRequest, NextApiResponse } from 'next'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

export interface RateLimitOptions {
  windowMs?: number // Time window in milliseconds
  maxRequests?: number // Max requests per window
  message?: string
  skipSuccessfulRequests?: boolean
}

/**
 * Simple in-memory rate limiter
 * For production, use Redis or a dedicated rate limiting service
 */
export function rateLimit(options: RateLimitOptions = {}) {
  const {
    windowMs = 60 * 1000, // 1 minute default
    maxRequests = 100, // 100 requests per minute default
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false,
  } = options

  return async (
    req: NextApiRequest,
    res: NextApiResponse,
    next: () => void | Promise<void>
  ) => {
    // Get client identifier (IP address or user ID)
    const identifier = getClientIdentifier(req)
    const now = Date.now()

    // Initialize or get existing record
    if (!store[identifier] || store[identifier].resetTime < now) {
      store[identifier] = {
        count: 0,
        resetTime: now + windowMs,
      }
    }

    const record = store[identifier]

    // Check if limit exceeded
    if (record.count >= maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000)
      
      res.setHeader('X-RateLimit-Limit', maxRequests.toString())
      res.setHeader('X-RateLimit-Remaining', '0')
      res.setHeader('X-RateLimit-Reset', record.resetTime.toString())
      res.setHeader('Retry-After', retryAfter.toString())

      return res.status(429).json({
        error: message,
        retryAfter,
      })
    }

    // Increment counter
    record.count++

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests.toString())
    res.setHeader('X-RateLimit-Remaining', (maxRequests - record.count).toString())
    res.setHeader('X-RateLimit-Reset', record.resetTime.toString())

    // If skipSuccessfulRequests is true, decrement on successful response
    if (skipSuccessfulRequests) {
      const originalJson = res.json.bind(res)
      res.json = (body: any) => {
        if (res.statusCode < 400) {
          record.count--
        }
        return originalJson(body)
      }
    }

    // Continue to next middleware/handler
    await next()
  }
}

/**
 * Get client identifier from request
 */
function getClientIdentifier(req: NextApiRequest): string {
  // Try to get user ID from session
  const session = (req as any).session
  if (session?.user?.id) {
    return `user:${session.user.id}`
  }

  // Fall back to IP address
  const forwarded = req.headers['x-forwarded-for']
  const ip = forwarded
    ? (typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0])
    : req.socket.remoteAddress

  return `ip:${ip || 'unknown'}`
}

/**
 * Cleanup old entries periodically
 */
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}, 60 * 1000) // Cleanup every minute
