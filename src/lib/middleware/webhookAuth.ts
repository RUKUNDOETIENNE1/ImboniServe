/**
 * Payment Webhook Authentication & Validation
 * 
 * Provides utilities for validating payment provider webhooks
 */

import crypto from 'crypto'
import { NextApiRequest } from 'next'

export interface WebhookValidationResult {
  valid: boolean
  error?: string
  payload?: any
}

/**
 * Validate IremboPay webhook signature
 */
export function validateIremboPayWebhook(
  signature: string,
  rawBody: string
): boolean {
  const secret = process.env.IREMBOPAY_SECRET_KEY
  if (!secret) {
    console.error('[WebhookAuth] IREMBOPAY_SECRET_KEY not configured')
    return false
  }

  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computedSignature)
  )
}

/**
 * Validate Pesapal IPN signature
 * Pesapal is not an active payment provider in v1. Signature validation
 * will be implemented when Pesapal integration is added post-v1.
 */
export function validatePesapalWebhook(
  signature: string,
  rawBody: string
): boolean {
  // Pesapal not integrated in v1 — safe to defer
  console.warn('[WebhookAuth] Pesapal not integrated in v1')
  return false
}

/**
 * Validate MTN MoMo callback signature
 * MTN MoMo callback validation uses HMAC-SHA256 with the API secret.
 * In v1, MTN MoMo payments are processed via IremboPay gateway which handles
 * callback validation at the gateway level.
 */
export function validateMTNMoMoWebhook(
  signature: string,
  rawBody: string
): boolean {
  // v1: MTN MoMo callbacks come through IremboPay gateway validation.
  // Direct MTN MoMo callback validation deferred post-v1.
  console.warn('[WebhookAuth] MTN MoMo direct callback validation deferred (processed via IremboPay gateway in v1)')
  return false
}

/**
 * Validate Airtel Money webhook
 * Airtel Money is not an active payment provider in v1.
 */
export function validateAirtelMoneyWebhook(
  signature: string,
  rawBody: string
): boolean {
  // Airtel Money not integrated in v1 — safe to defer
  console.warn('[WebhookAuth] Airtel Money not integrated in v1')
  return false
}

/**
 * Generic webhook timestamp validation
 * Prevents replay attacks by checking webhook age
 */
export function validateWebhookTimestamp(
  timestamp: number,
  toleranceSeconds: number = 300
): boolean {
  const now = Math.floor(Date.now() / 1000)
  const diff = Math.abs(now - timestamp)
  
  if (diff > toleranceSeconds) {
    console.warn('[WebhookAuth] Webhook timestamp outside tolerance', {
      timestamp,
      now,
      diff,
      toleranceSeconds
    })
    return false
  }
  
  return true
}

/**
 * Rate limit check for webhooks (basic in-memory)
 * v1 uses in-memory rate limiting. Redis-based distributed rate limiting
 * is deferred post-v1 for multi-instance deployments.
 */
const webhookRateLimits = new Map<string, { count: number; resetAt: number }>()

export function checkWebhookRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowSeconds: number = 60
): boolean {
  const now = Math.floor(Date.now() / 1000)
  const existing = webhookRateLimits.get(identifier)
  
  if (!existing || existing.resetAt < now) {
    webhookRateLimits.set(identifier, {
      count: 1,
      resetAt: now + windowSeconds
    })
    return true
  }
  
  if (existing.count >= maxRequests) {
    console.warn('[WebhookAuth] Rate limit exceeded', {
      identifier,
      count: existing.count,
      maxRequests
    })
    return false
  }
  
  existing.count++
  return true
}

/**
 * Extract client IP from request
 */
export function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim()
  }
  return req.socket.remoteAddress || 'unknown'
}

/**
 * Validate IP allowlist
 * Provider IP ranges can be configured via WEBHOOK_ALLOWED_IPS env var.
 * Empty allowlist allows all (suitable for v1 single-instance deployment).
 */
export function validateIPAllowlist(
  ip: string,
  allowedIPs: string[] = []
): boolean {
  if (allowedIPs.length === 0) {
    // No allowlist configured, allow all (dev mode)
    return true
  }
  
  const allowed = allowedIPs.includes(ip)
  if (!allowed) {
    console.warn('[WebhookAuth] IP not in allowlist', { ip, allowedIPs })
  }
  
  return allowed
}

/**
 * Comprehensive webhook validation wrapper
 */
export async function validatePaymentWebhook(
  req: NextApiRequest,
  provider: 'irembo' | 'pesapal' | 'mtn-momo' | 'airtel-money',
  rawBody: string
): Promise<WebhookValidationResult> {
  // Step 1: Rate limiting
  const ip = getClientIP(req)
  if (!checkWebhookRateLimit(ip)) {
    return { valid: false, error: 'Rate limit exceeded' }
  }
  
  // Step 2: IP allowlist (optional, configurable via env)
  const allowedIPs = process.env.WEBHOOK_ALLOWED_IPS?.split(',').map(ip => ip.trim()) || []
  if (allowedIPs.length > 0 && !validateIPAllowlist(ip, allowedIPs)) {
    return { valid: false, error: 'IP not in allowlist' }
  }
  
  // Step 3: Signature validation
  let signatureValid = false
  let signature: string | undefined
  
  switch (provider) {
    case 'irembo':
      signature = req.headers['irembopay-signature'] as string
      if (!signature) {
        return { valid: false, error: 'Missing signature header' }
      }
      signatureValid = validateIremboPayWebhook(signature, rawBody)
      break
      
    case 'pesapal':
      // Pesapal not integrated in v1
      signatureValid = false
      break
      
    case 'mtn-momo':
      signature = req.headers['x-callback-signature'] as string
      if (signature) {
        signatureValid = validateMTNMoMoWebhook(signature, rawBody)
      }
      break
      
    case 'airtel-money':
      // Airtel Money not integrated in v1
      signatureValid = false
      break
  }
  
  if (!signatureValid) {
    return { valid: false, error: 'Invalid signature' }
  }
  
  // Step 4: Parse and return payload
  try {
    const payload = JSON.parse(rawBody)
    return { valid: true, payload }
  } catch (error) {
    return { valid: false, error: 'Invalid JSON payload' }
  }
}
