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
 * TODO: Implement based on Pesapal documentation
 */
export function validatePesapalWebhook(
  signature: string,
  rawBody: string
): boolean {
  // TODO: Implement Pesapal signature verification
  console.warn('[WebhookAuth] Pesapal signature validation not implemented')
  return false
}

/**
 * Validate MTN MoMo callback signature
 * TODO: Implement based on MTN MoMo documentation
 */
export function validateMTNMoMoWebhook(
  signature: string,
  rawBody: string
): boolean {
  // TODO: Implement MTN MoMo X-Callback-Signature validation
  console.warn('[WebhookAuth] MTN MoMo signature validation not implemented')
  return false
}

/**
 * Validate Airtel Money webhook
 * TODO: Implement when Airtel Money integration is added
 */
export function validateAirtelMoneyWebhook(
  signature: string,
  rawBody: string
): boolean {
  // TODO: Implement Airtel Money signature validation
  console.warn('[WebhookAuth] Airtel Money signature validation not implemented')
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
 * TODO: Use Redis for distributed rate limiting in production
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
 * TODO: Configure provider IP ranges in environment
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
  
  // Step 2: IP allowlist (optional)
  // TODO: Configure IP allowlists per provider
  
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
      // TODO: Implement Pesapal signature extraction and validation
      signatureValid = false
      break
      
    case 'mtn-momo':
      signature = req.headers['x-callback-signature'] as string
      if (signature) {
        signatureValid = validateMTNMoMoWebhook(signature, rawBody)
      }
      break
      
    case 'airtel-money':
      // TODO: Implement Airtel Money signature extraction and validation
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
