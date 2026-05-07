/**
 * Request ID Middleware
 * 
 * Adds a unique request ID to each API request for correlation and debugging.
 * The ID is available via req.headers['x-request-id'] in API routes.
 */

import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export function addRequestId(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || uuidv4()
  
  // Clone request with new header
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-request-id', requestId)
  
  // Store in response headers too for debugging
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
  
  response.headers.set('x-request-id', requestId)
  
  return response
}

/**
 * Extract request ID from Next.js API request
 */
export function getRequestId(req: any): string {
  return req.headers['x-request-id'] || 'unknown'
}

/**
 * Logger helper that includes request ID
 */
export function createLogger(requestId: string) {
  const prefix = `[${requestId.slice(0, 8)}]`
  
  return {
    info: (...args: any[]) => console.log(prefix, ...args),
    warn: (...args: any[]) => console.warn(prefix, ...args),
    error: (...args: any[]) => console.error(prefix, ...args),
    debug: (...args: any[]) => console.debug(prefix, ...args),
  }
}
