/**
 * Redis-based Rate Limiter
 * Production-ready rate limiting using Redis for distributed systems
 * Replaces in-memory rate limiting to work across multiple server instances
 */

import { NextApiRequest, NextApiResponse } from 'next'
import Redis from 'ioredis'

let redis: Redis | null = null

// Initialize Redis connection
function getRedisClient(): Redis | null {
  if (!process.env.REDIS_URL) {
    console.warn('⚠️  REDIS_URL not configured. Falling back to in-memory rate limiting.')
    return null
  }

  if (!redis) {
    try {
      redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true,
      })

      redis.on('error', (err) => {
        console.error('Redis connection error:', err)
      })

      redis.on('connect', () => {
        console.log('✅ Redis connected for rate limiting')
      })
    } catch (error) {
      console.error('Failed to initialize Redis:', error)
      return null
    }
  }

  return redis
}

export interface RateLimitOptions {
  windowMs?: number // Time window in milliseconds
  maxRequests?: number // Max requests per window
  message?: string
  skipSuccessfulRequests?: boolean
  keyPrefix?: string // Prefix for Redis keys
}

/**
 * Redis-based rate limiter middleware
 * Falls back to in-memory if Redis is unavailable
 */
export function rateLimitRedis(options: RateLimitOptions = {}) {
  const {
    windowMs = 60 * 1000, // 1 minute default
    maxRequests = 100, // 100 requests per minute default
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false,
    keyPrefix = 'ratelimit',
  } = options

  const redisClient = getRedisClient()

  // Fallback to in-memory if Redis unavailable
  if (!redisClient) {
    return inMemoryRateLimit(options)
  }

  return async (
    req: NextApiRequest,
    res: NextApiResponse,
    next: () => void | Promise<void>
  ) => {
    try {
      const identifier = getClientIdentifier(req)
      const key = `${keyPrefix}:${identifier}`
      const now = Date.now()
      const windowStart = now - windowMs

      // Use Redis pipeline for atomic operations
      const pipeline = redisClient.pipeline()

      // Remove old entries outside the window
      pipeline.zremrangebyscore(key, 0, windowStart)

      // Count requests in current window
      pipeline.zcard(key)

      // Add current request
      pipeline.zadd(key, now, `${now}-${Math.random()}`)

      // Set expiry on the key
      pipeline.expire(key, Math.ceil(windowMs / 1000))

      const results = await pipeline.exec()

      if (!results) {
        throw new Error('Redis pipeline failed')
      }

      // Get count from pipeline results (index 1 is zcard result)
      const count = results[1][1] as number

      // Check if limit exceeded
      if (count > maxRequests) {
        const retryAfter = Math.ceil(windowMs / 1000)

        res.setHeader('X-RateLimit-Limit', maxRequests.toString())
        res.setHeader('X-RateLimit-Remaining', '0')
        res.setHeader('X-RateLimit-Reset', (now + windowMs).toString())
        res.setHeader('Retry-After', retryAfter.toString())

        return res.status(429).json({
          error: message,
          retryAfter,
        })
      }

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests.toString())
      res.setHeader('X-RateLimit-Remaining', (maxRequests - count).toString())
      res.setHeader('X-RateLimit-Reset', (now + windowMs).toString())

      // Continue to next middleware/handler
      await next()
    } catch (error) {
      console.error('Rate limit error:', error)
      // On error, allow the request through (fail open)
      await next()
    }
  }
}

/**
 * In-memory fallback rate limiter
 * Used when Redis is not available
 */
interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const memoryStore: RateLimitStore = {}

function inMemoryRateLimit(options: RateLimitOptions = {}) {
  const {
    windowMs = 60 * 1000,
    maxRequests = 100,
    message = 'Too many requests, please try again later.',
  } = options

  return async (
    req: NextApiRequest,
    res: NextApiResponse,
    next: () => void | Promise<void>
  ) => {
    const identifier = getClientIdentifier(req)
    const now = Date.now()

    // Initialize or get existing record
    if (!memoryStore[identifier] || memoryStore[identifier].resetTime < now) {
      memoryStore[identifier] = {
        count: 0,
        resetTime: now + windowMs,
      }
    }

    const record = memoryStore[identifier]

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
 * Cleanup old entries periodically (for in-memory store)
 */
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    Object.keys(memoryStore).forEach((key) => {
      if (memoryStore[key].resetTime < now) {
        delete memoryStore[key]
      }
    })
  }, 60 * 1000) // Cleanup every minute
}

/**
 * Close Redis connection gracefully
 */
export async function closeRedisConnection(): Promise<void> {
  if (redis) {
    await redis.quit()
    redis = null
  }
}

type ApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<any> | any

/**
 * Handler-wrapping rate limiter.
 * Composes like requirePermission — wraps a Next.js API handler and
 * rejects with 429 before the handler runs if the limit is exceeded.
 *
 * Usage:
 *   export default withRateLimit({ maxRequests: 20, windowMs: 60_000 })(handler)
 *   export default withRateLimit({ maxRequests: 5, windowMs: 60_000, keyPrefix: 'staff-mut' })(requirePermission('staff.manage')(handler))
 */
export function withRateLimit(options: RateLimitOptions = {}) {
  return (handler: ApiHandler): ApiHandler => {
    const limiter = rateLimitRedis(options)
    return async (req: NextApiRequest, res: NextApiResponse) => {
      let proceeded = false
      let result: any
      await limiter(req, res, async () => {
        proceeded = true
        result = await handler(req, res)
      })
      if (!proceeded) return // rate limit response already sent
      return result
    }
  }
}
