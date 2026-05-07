import { NextApiRequest, NextApiResponse } from 'next'
import { rateLimit } from './rateLimit'

type ApiHandler = (req: NextApiRequest, res: NextApiResponse) => void | Promise<void>

/**
 * Higher-order function to wrap API handlers with rate limiting
 */
export function withRateLimit(
  handler: ApiHandler,
  options?: {
    windowMs?: number
    maxRequests?: number
  }
): ApiHandler {
  const limiter = rateLimit(options)

  return async (req: NextApiRequest, res: NextApiResponse) => {
    await limiter(req, res, async () => {
      await Promise.resolve(handler(req, res))
    })
  }
}
