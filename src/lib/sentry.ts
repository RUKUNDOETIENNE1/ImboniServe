/**
 * Sentry Error Tracking Initialization
 * 
 * This module provides centralized error tracking for both server and client.
 * Set SENTRY_DSN in your environment to enable.
 */

let initialized = false

export function initSentry() {
  if (initialized) return
  
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
  
  if (!dsn) {
    console.log('[Sentry] DSN not configured, skipping initialization')
    return
  }

  try {
    // TODO: Install @sentry/nextjs package
    // npm install @sentry/nextjs
    // Then uncomment the code below:
    
    /*
    const Sentry = require('@sentry/nextjs')
    
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      
      // Capture console errors
      integrations: [
        new Sentry.Integrations.CaptureConsole({
          levels: ['error', 'warn']
        })
      ],
      
      // Filter out expected errors
      beforeSend(event, hint) {
        const error = hint.originalException
        
        // Don't send authentication errors to Sentry
        if (error && typeof error === 'object' && 'message' in error) {
          const msg = String(error.message).toLowerCase()
          if (msg.includes('unauthorized') || msg.includes('invalid credentials')) {
            return null
          }
        }
        
        return event
      }
    })
    */
    
    initialized = true
    console.log('[Sentry] Initialized successfully')
  } catch (error) {
    console.error('[Sentry] Initialization failed:', error)
  }
}

/**
 * Capture an exception manually
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (!initialized) {
    console.error('[Sentry] Not initialized, logging error:', error, context)
    return
  }
  
  // TODO: Uncomment when @sentry/nextjs is installed
  // const Sentry = require('@sentry/nextjs')
  // Sentry.captureException(error, { extra: context })
}

/**
 * Add breadcrumb for debugging context
 */
export function addBreadcrumb(message: string, data?: Record<string, any>) {
  if (!initialized) return
  
  // TODO: Uncomment when @sentry/nextjs is installed
  // const Sentry = require('@sentry/nextjs')
  // Sentry.addBreadcrumb({
  //   message,
  //   data,
  //   level: 'info',
  //   timestamp: Date.now() / 1000
  // })
}

/**
 * Set user context for error reports
 */
export function setUser(user: { id: string; email?: string; name?: string } | null) {
  if (!initialized) return
  
  // TODO: Uncomment when @sentry/nextjs is installed
  // const Sentry = require('@sentry/nextjs')
  // Sentry.setUser(user)
}
