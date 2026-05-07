/**
 * Security Event Service
 * Logs authentication and abuse events for audit and monitoring.
 * Events are append-only; no update/delete.
 */

import { prisma } from '@/lib/prisma'

export type SecurityEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'MFA_OTP_SENT'
  | 'MFA_OTP_VERIFIED'
  | 'MFA_OTP_FAILED'
  | 'MFA_OTP_EXPIRED'
  | 'SESSION_REVOKED'
  | 'NEW_DEVICE_DETECTED'
  | 'DEVICE_TRUSTED'
  | 'SIGNUP_BLOCKED'
  | 'SUBSCRIPTION_EXPIRED_BLOCK'
  | 'STAFF_CREATE'
  | 'STAFF_UPDATE'
  | 'STAFF_SUSPEND'
  | 'PERMISSION_DENIED'
  | 'BRUTE_FORCE_DETECTED'

export const SecurityEventService = {
  async log(opts: {
    userId?: string | null
    eventType: SecurityEventType
    ip?: string | null
    userAgent?: string | null
    metadata?: Record<string, unknown>
  }): Promise<void> {
    try {
      await prisma.securityEvent.create({
        data: {
          userId: opts.userId ?? null,
          eventType: opts.eventType,
          ip: opts.ip ?? null,
          userAgent: opts.userAgent ?? null,
          metadata: opts.metadata ?? {},
        },
      })
    } catch (err) {
      // Non-fatal: security log failures must never break the auth flow
      console.error('[SecurityEvent] Failed to log event:', opts.eventType, err)
    }
  },

  async getRecentForUser(userId: string, limit = 50) {
    return prisma.securityEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        eventType: true,
        ip: true,
        userAgent: true,
        metadata: true,
        createdAt: true,
      },
    })
  },

  async getRecentAll(limit = 200) {
    return prisma.securityEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        userId: true,
        eventType: true,
        ip: true,
        userAgent: true,
        metadata: true,
        createdAt: true,
      },
    })
  },

  /** Count failed login attempts in a window to detect brute force */
  async countRecentFailures(opts: {
    userId?: string
    ip?: string
    windowMinutes?: number
  }): Promise<number> {
    const { userId, ip, windowMinutes = 15 } = opts
    const since = new Date(Date.now() - windowMinutes * 60 * 1000)

    const where: any = {
      eventType: { in: ['LOGIN_FAILED', 'MFA_OTP_FAILED'] },
      createdAt: { gte: since },
    }
    if (userId) where.userId = userId
    if (ip) where.ip = ip

    return prisma.securityEvent.count({ where })
  },
}
