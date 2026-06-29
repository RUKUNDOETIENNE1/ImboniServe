/**
 * Cache Service
 * 
 * Purpose: Redis caching wrapper for dashboard performance optimization
 * Target: Dashboard load time < 1 second
 * 
 * Cache Strategy:
 * - Financial Health: 5 min TTL (executive view, not real-time)
 * - Revenue Intelligence: 10 min TTL (composition changes slowly)
 * - Subscription Intelligence: 5 min TTL (moderate urgency)
 * - Operations Intelligence: 2 min TTL (operational data)
 * - Financial Priorities: 1 min TTL (most dynamic)
 * - Insight Strip: 1 min TTL (executive summary)
 * 
 * What NOT to cache:
 * - Alert states (real-time required)
 * - Reconciliation exceptions (operational)
 * - Payment failures (operational)
 * - Watchdog health status (real-time)
 */

import Redis from 'ioredis'

// Redis client singleton
let redisClient: Redis | null = null

/**
 * Get or create Redis client
 */
function getRedisClient(): Redis {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
      // Graceful degradation - if Redis is down, don't crash
      lazyConnect: true
    })

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err)
    })

    redisClient.on('connect', () => {
      console.log('Redis Client Connected')
    })
  }

  return redisClient
}

export class CacheService {
  private static client = getRedisClient()

  /**
   * Get value from cache
   * Returns null if key doesn't exist or Redis is unavailable
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key)
      if (!value) return null
      
      return JSON.parse(value) as T
    } catch (error) {
      console.error(`Cache GET error for key ${key}:`, error)
      return null // Graceful degradation
    }
  }

  /**
   * Set value in cache with TTL (in seconds)
   */
  static async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value)
      await this.client.setex(key, ttlSeconds, serialized)
    } catch (error) {
      console.error(`Cache SET error for key ${key}:`, error)
      // Don't throw - graceful degradation
    }
  }

  /**
   * Delete value from cache
   */
  static async del(key: string): Promise<void> {
    try {
      await this.client.del(key)
    } catch (error) {
      console.error(`Cache DEL error for key ${key}:`, error)
    }
  }

  /**
   * Check if key exists in cache
   */
  static async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key)
      return result === 1
    } catch (error) {
      console.error(`Cache EXISTS error for key ${key}:`, error)
      return false
    }
  }

  /**
   * Get or compute value (cache-aside pattern)
   * If value exists in cache, return it
   * Otherwise, compute it, cache it, and return it
   */
  static async getOrCompute<T>(
    key: string,
    computeFn: () => Promise<T>,
    ttlSeconds: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    // Compute value
    const value = await computeFn()

    // Cache it (fire and forget - don't wait)
    this.set(key, value, ttlSeconds).catch(err => {
      console.error(`Failed to cache key ${key}:`, err)
    })

    return value
  }

  /**
   * Invalidate all dashboard caches
   * Use sparingly - only on critical financial events
   */
  static async invalidateDashboardCaches(): Promise<void> {
    try {
      const pattern = 'cfo:*'
      const keys = await this.client.keys(pattern)
      
      if (keys.length > 0) {
        await this.client.del(...keys)
        console.log(`Invalidated ${keys.length} dashboard cache keys`)
      }
    } catch (error) {
      console.error('Cache invalidation error:', error)
    }
  }

  /**
   * Get cache statistics
   * Useful for monitoring cache effectiveness
   */
  static async getStats(): Promise<{
    connected: boolean
    keyCount: number
    memoryUsed: string
  }> {
    try {
      const info = await this.client.info('memory')
      const keyCount = await this.client.dbsize()
      
      // Parse memory usage from info string
      const memoryMatch = info.match(/used_memory_human:(.+)/)
      const memoryUsed = memoryMatch ? memoryMatch[1].trim() : 'Unknown'

      return {
        connected: this.client.status === 'ready',
        keyCount,
        memoryUsed
      }
    } catch (error) {
      console.error('Cache stats error:', error)
      return {
        connected: false,
        keyCount: 0,
        memoryUsed: 'Unknown'
      }
    }
  }

  /**
   * Close Redis connection
   * Call this on application shutdown
   */
  static async close(): Promise<void> {
    if (redisClient) {
      await redisClient.quit()
      redisClient = null
    }
  }
}

/**
 * Cache key generators for CFO Dashboard
 */
export class CacheKeys {
  /**
   * Financial Health cache key
   * TTL: 5 minutes
   */
  static financialHealth(date: Date = new Date()): string {
    const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD
    return `cfo:financial-health:${dateStr}`
  }

  /**
   * Revenue Intelligence cache key
   * TTL: 10 minutes
   */
  static revenueIntelligence(period: string, date: Date = new Date()): string {
    const dateStr = date.toISOString().split('T')[0]
    return `cfo:revenue-intelligence:${period}:${dateStr}`
  }

  /**
   * Subscription Intelligence cache key
   * TTL: 5 minutes
   */
  static subscriptionIntelligence(date: Date = new Date()): string {
    const dateStr = date.toISOString().split('T')[0]
    return `cfo:subscription-intelligence:${dateStr}`
  }

  /**
   * Operations Intelligence cache key
   * TTL: 2 minutes
   */
  static operationsIntelligence(timestamp: Date = new Date()): string {
    // Round to nearest 2 minutes for cache efficiency
    const roundedMinutes = Math.floor(timestamp.getMinutes() / 2) * 2
    const roundedTime = new Date(timestamp)
    roundedTime.setMinutes(roundedMinutes, 0, 0)
    return `cfo:operations-intelligence:${roundedTime.toISOString()}`
  }

  /**
   * Financial Priorities cache key
   * TTL: 1 minute
   */
  static financialPriorities(timestamp: Date = new Date()): string {
    // Round to nearest minute
    const roundedTime = new Date(timestamp)
    roundedTime.setSeconds(0, 0)
    return `cfo:priorities:${roundedTime.toISOString()}`
  }

  /**
   * Financial Insight Strip cache key
   * TTL: 1 minute
   */
  static insightStrip(timestamp: Date = new Date()): string {
    // Round to nearest minute
    const roundedTime = new Date(timestamp)
    roundedTime.setSeconds(0, 0)
    return `cfo:insight-strip:${roundedTime.toISOString()}`
  }
}

/**
 * Cache TTL constants (in seconds)
 */
export const CacheTTL = {
  FINANCIAL_HEALTH: 5 * 60,        // 5 minutes
  REVENUE_INTELLIGENCE: 10 * 60,   // 10 minutes
  SUBSCRIPTION_INTELLIGENCE: 5 * 60, // 5 minutes
  OPERATIONS_INTELLIGENCE: 2 * 60,  // 2 minutes
  FINANCIAL_PRIORITIES: 1 * 60,     // 1 minute
  INSIGHT_STRIP: 1 * 60             // 1 minute
}
