/**
 * Cron Authentication Middleware
 * 
 * Validates that cron jobs are called with the correct CRON_SECRET.
 * Supports multiple authentication methods for flexibility.
 */

import { NextApiRequest, NextApiResponse } from 'next'

/**
 * Verify that a request is authorized to trigger a cron job
 * 
 * Supports:
 * - Authorization: Bearer <CRON_SECRET> header (recommended)
 * - x-cron-secret header
 * - ?secret=<CRON_SECRET> query parameter (least secure, avoid if possible)
 */
export function verifyCronAuth(req: NextApiRequest): boolean {
  const expectedSecret = process.env.CRON_SECRET
  
  if (!expectedSecret) {
    console.warn('[CronAuth] CRON_SECRET not configured - cron endpoints are unprotected!')
    return false
  }
  
  // Method 1: Authorization Bearer header (preferred for Vercel Cron)
  const authHeader = req.headers.authorization
  if (authHeader === `Bearer ${expectedSecret}`) {
    return true
  }
  
  // Method 2: Custom x-cron-secret header
  const customHeader = req.headers['x-cron-secret']
  if (customHeader === expectedSecret) {
    return true
  }
  
  // Method 3: Query parameter (fallback, less secure)
  const querySecret = req.query.secret
  if (querySecret === expectedSecret) {
    return true
  }
  
  return false
}

/**
 * Middleware wrapper to protect cron endpoints
 * 
 * Usage:
 * ```ts
 * export default withCronAuth(async function handler(req, res) {
 *   // Your cron job logic
 * })
 * ```
 */
export function withCronAuth(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    if (!verifyCronAuth(req)) {
      console.warn('[CronAuth] Unauthorized cron attempt', {
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        path: req.url,
      })
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    return handler(req, res)
  }
}
