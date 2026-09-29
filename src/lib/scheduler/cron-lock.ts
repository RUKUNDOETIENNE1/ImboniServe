/**
 * Cron Lock — Redis/in-memory concurrency protection for cron endpoints.
 *
 * Prevents duplicate or overlapping execution when multiple scheduler
 * mechanisms (Railway in-process, Vercel daily cron, external) trigger
 * the same endpoint concurrently.
 *
 * Pattern follows document-replay.service.ts: Redis SET NX EX with
 * in-memory Set fallback when REDIS_URL is unavailable.
 */

import type Redis from 'ioredis'

const inMemoryLocks = new Map<string, { token: string; expiresAt: number }>()
let redisClient: Redis | null | undefined

function getRedisClient(): Redis | null {
  if (redisClient !== undefined) return redisClient
  if (!process.env.REDIS_URL) {
    redisClient = null
    return redisClient
  }
  // Lazy import to avoid loading ioredis in environments without Redis
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const IORedis = require('ioredis') as typeof import('ioredis')
  redisClient = new IORedis.default(process.env.REDIS_URL!, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    tls: { rejectUnauthorized: true },
  })
  return redisClient
}

export interface CronLock {
  release: () => Promise<void>
}

/**
 * Attempt to acquire a named cron lock.
 * Returns null if the lock is already held (caller should skip execution).
 * Returns a CronLock with release() if acquired.
 *
 * The lock auto-expires after ttlSeconds (safety net for crashed processes).
 */
export async function acquireCronLock(
  name: string,
  ttlSeconds: number
): Promise<CronLock | null> {
  const key = `cron:lock:${name}`
  const token = `${Date.now()}:${Math.random().toString(36).slice(2)}`
  const redis = getRedisClient()

  if (redis) {
    try {
      const ok = await (redis as any).set(key, token, 'EX', ttlSeconds, 'NX')
      if (!ok) return null
      return {
        release: async () => {
          try {
            const current = await redis.get(key)
            if (current === token) {
              await redis.del(key)
            }
          } catch {
            // best-effort release; lock will expire via TTL
          }
        },
      }
    } catch {
      // Redis error — fall through to in-memory
    }
  }

  // In-memory fallback
  const now = Date.now()
  const existing = inMemoryLocks.get(key)
  if (existing && existing.expiresAt > now) {
    return null
  }
  inMemoryLocks.set(key, { token, expiresAt: now + ttlSeconds * 1000 })
  return {
    release: async () => {
      const current = inMemoryLocks.get(key)
      if (current && current.token === token) {
        inMemoryLocks.delete(key)
      }
    },
  }
}
