/**
 * Shared authorization guard for public customer-facing order endpoints
 * (/api/public/order/status, /messages, /confirm).
 *
 * Model: a QR access token (JWT issued at scan time) is consumed once during
 * draft creation, and its jti is persisted on the Sale it created
 * (Sale.orderTokenJti). Post-draft requests must present that same token;
 * the caller is authorized only when the token's jti matches the order's
 * binding (or the parent order's binding for addon orders).
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyOrderSessionToken, type QRTokenClaims } from '@/lib/services/qr-token.service'

export interface AuthorizedOrder {
  sale: {
    id: string
    businessId: string
    orderTokenJti: string | null
    isAddon: boolean
    parentOrderId: string | null
  }
  claims: QRTokenClaims
}

/**
 * Extract the access token from Authorization: Bearer <token> (preferred for
 * GET requests) or the JSON body's accessToken field (POST requests).
 */
export function extractOrderAccessToken(req: NextApiRequest): string | null {
  const auth = req.headers.authorization
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.slice('Bearer '.length).trim()
    if (token) return token
  }
  const bodyToken = (req.body as any)?.accessToken
  if (typeof bodyToken === 'string' && bodyToken.length >= 10) return bodyToken
  const queryToken = (req.query as any)?.accessToken
  if (typeof queryToken === 'string' && queryToken.length >= 10) return queryToken
  return null
}

/**
 * Authorize a public order request.
 * Returns the authorized Sale (with binding fields) and token claims,
 * or sends the appropriate error response and returns null.
 */
export async function requireOrderAccess(
  req: NextApiRequest,
  res: NextApiResponse,
  orderId: string
): Promise<AuthorizedOrder | null> {
  const token = extractOrderAccessToken(req)
  if (!token) {
    res.status(401).json({ error: 'Access token required' })
    return null
  }

  const claims = await verifyOrderSessionToken(token)
  if (!claims) {
    res.status(401).json({ error: 'Invalid access token' })
    return null
  }

  const sale = await prisma.sale.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      businessId: true,
      orderTokenJti: true,
      isAddon: true,
      parentOrderId: true,
    },
  })

  if (!sale) {
    res.status(404).json({ error: 'Order not found' })
    return null
  }

  // Addon orders inherit the token binding of the order they extend.
  let boundJti = sale.orderTokenJti
  if (!boundJti && sale.isAddon && sale.parentOrderId) {
    const parent = await prisma.sale.findUnique({
      where: { id: sale.parentOrderId },
      select: { orderTokenJti: true },
    })
    boundJti = parent?.orderTokenJti ?? null
  }

  // Deny when the order has no token binding (non-QR sources, legacy rows) or
  // when the presented token is not the credential that created this order.
  if (!boundJti || boundJti !== claims.jti || claims.branchId !== sale.businessId) {
    res.status(403).json({ error: 'Forbidden' })
    return null
  }

  return { sale, claims }
}
