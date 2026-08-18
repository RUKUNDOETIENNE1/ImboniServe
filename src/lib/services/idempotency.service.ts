/**
 * Idempotency Service
 * Prevents duplicate request processing and ensures consistent state
 * Phase 3: Operational Hardening
 */

import { prisma } from '@/lib/prisma'
import type { NextApiRequest, NextApiResponse } from 'next'

export interface IdempotencyResult {
  isNew: boolean
  existingResponse?: {
    statusCode: number
    body: any
  }
}

export class IdempotencyService {
  /**
   * Check if request is duplicate and return cached response if exists
   * Otherwise, mark as processing
   */
  static async checkAndLock(
    key: string,
    businessId: string,
    endpoint: string,
    requestBody?: any
  ): Promise<IdempotencyResult> {
    try {
      // Check if key already exists
      const existing = await prisma.idempotencyKey.findUnique({
        where: { key },
      })

      if (existing) {
        // Request already processed
        if (existing.responseBody && existing.statusCode) {
          return {
            isNew: false,
            existingResponse: {
              statusCode: existing.statusCode,
              body: existing.responseBody,
            },
          }
        }

        // Request is being processed (race condition)
        // Return the existing response or wait briefly
        return {
          isNew: false,
          existingResponse: {
            statusCode: 409,
            body: { error: 'Request is being processed' },
          },
        }
      }

      // Create new idempotency record (24 hour expiry)
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24)

      await prisma.idempotencyKey.create({
        data: {
          key,
          businessId,
          endpoint,
          requestBody: requestBody || null,
          expiresAt,
        },
      })

      return { isNew: true }
    } catch (error: any) {
      // Unique constraint violation means another request created it
      if (error.code === 'P2002') {
        // Retry check
        const existing = await prisma.idempotencyKey.findUnique({
          where: { key },
        })

        if (existing?.responseBody && existing.statusCode) {
          return {
            isNew: false,
            existingResponse: {
              statusCode: existing.statusCode,
              body: existing.responseBody,
            },
          }
        }

        return {
          isNew: false,
          existingResponse: {
            statusCode: 409,
            body: { error: 'Concurrent request detected' },
          },
        }
      }

      throw error
    }
  }

  /**
   * Store response for idempotency key
   */
  static async storeResponse(
    key: string,
    statusCode: number,
    responseBody: any
  ): Promise<void> {
    try {
      await prisma.idempotencyKey.update({
        where: { key },
        data: {
          statusCode,
          responseBody,
        },
      })
    } catch (error) {
      console.error('[Idempotency] Failed to store response:', error)
    }
  }

  /**
   * Generate idempotency key from request
   */
  static generateKey(
    businessId: string,
    endpoint: string,
    uniqueId: string
  ): string {
    return `${businessId}:${endpoint}:${uniqueId}`
  }

  /**
   * Extract idempotency key from request headers or body
   */
  static extractKey(req: NextApiRequest): string | null {
    // Check header first (recommended)
    const headerKey = req.headers['idempotency-key'] as string
    if (headerKey) return headerKey

    // Check body as fallback
    const bodyKey = (req.body as any)?.idempotencyKey
    if (bodyKey) return bodyKey

    return null
  }

  /**
   * Cleanup expired idempotency keys (run periodically)
   */
  static async cleanupExpired(): Promise<number> {
    try {
      const result = await prisma.idempotencyKey.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      })

      return result.count
    } catch (error) {
      console.error('[Idempotency] Cleanup failed:', error)
      return 0
    }
  }
}

/**
 * Middleware wrapper for idempotent endpoints
 */
export function withIdempotency(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Only apply to mutation methods
    if (req.method !== 'POST' && req.method !== 'PATCH' && req.method !== 'PUT') {
      return handler(req, res)
    }

    const idempotencyKey = IdempotencyService.extractKey(req)

    if (!idempotencyKey) {
      // No idempotency key provided - proceed normally
      return handler(req, res)
    }

    // Extract business context (assumes it's in session or body)
    const businessId =
      (req as any).businessId ||
      req.body?.businessId ||
      ((req as any).session?.user as any)?.businessId

    if (!businessId) {
      return res.status(400).json({ error: 'Business context required for idempotency' })
    }

    const endpoint = req.url || 'unknown'

    // Check idempotency
    const result = await IdempotencyService.checkAndLock(
      idempotencyKey,
      businessId,
      endpoint,
      req.body
    )

    if (!result.isNew && result.existingResponse) {
      // Return cached response
      return res.status(result.existingResponse.statusCode).json(result.existingResponse.body)
    }

    // Intercept response to store it
    const originalJson = res.json.bind(res)
    const originalStatus = res.status.bind(res)

    let statusCode = 200
    let responseBody: any = null

    res.status = function (code: number) {
      statusCode = code
      return originalStatus(code)
    }

    res.json = function (body: any) {
      responseBody = body

      // Store response asynchronously
      IdempotencyService.storeResponse(idempotencyKey, statusCode, responseBody).catch(
        (err) => console.error('[Idempotency] Store failed:', err)
      )

      return originalJson(body)
    }

    // Execute handler
    return handler(req, res)
  }
}
