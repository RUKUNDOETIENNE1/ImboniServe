/**
 * Heart Pulse Core - Event Publisher
 * 
 * Standardized event publishing with delivery monitoring and correlation tracking.
 * Wraps Pusher with observability and consistent event contracts.
 * 
 * @see IAS-001 (Observability First, Event-Driven by Default)
 * @see IEC-001 (Every Release Must Earn Trust)
 */

import { triggerEvent as pusherTrigger } from '@/lib/pusher-server'
import { HeartPulseEvent, HeartPulseEventTypeValue } from './event-catalog'
import { v4 as uuidv4 } from 'uuid'

// ─────────────────────────────────────────────────────────────────────────────
// Publisher Configuration
// ─────────────────────────────────────────────────────────────────────────────

const EVENT_VERSION = 1

interface PublishOptions {
  /** Correlation ID for tracking related events (auto-generated if not provided) */
  correlationId?: string
  
  /** Actor who triggered the event */
  actor?: {
    userId?: string
    userName?: string
    source: 'user' | 'system' | 'api' | 'cron'
  }
  
  /** Retry attempts for failed publishes (default: 0) */
  retries?: number
}

interface PublishResult {
  success: boolean
  eventId: string
  error?: string
  retryCount?: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Event Publishing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Publish a standardized Heart Pulse event.
 * 
 * @param channel - Pusher channel name (use HeartPulseChannel helpers)
 * @param eventType - Event type from HeartPulseEventType catalog
 * @param businessId - Business context
 * @param payload - Event-specific payload
 * @param options - Publishing options (correlation, actor, retries)
 * @returns PublishResult with success status and eventId
 */
export async function publishHeartPulseEvent<TPayload = unknown>(
  channel: string,
  eventType: HeartPulseEventTypeValue,
  businessId: string,
  payload: TPayload,
  options: PublishOptions = {}
): Promise<PublishResult> {
  const eventId = uuidv4()
  const correlationId = options.correlationId || uuidv4()
  const timestamp = new Date().toISOString()
  
  const event: HeartPulseEvent<TPayload> = {
    eventId,
    eventType,
    eventVersion: EVENT_VERSION,
    businessId,
    correlationId,
    timestamp,
    actor: options.actor,
    payload,
  }
  
  const maxRetries = options.retries || 0
  let retryCount = 0
  let lastError: string | undefined
  
  while (retryCount <= maxRetries) {
    try {
      // Log publish attempt
      console.log('[HeartPulse] Publishing event', {
        eventId,
        eventType,
        channel,
        correlationId,
        attempt: retryCount + 1,
      })
      
      // Publish via Pusher
      await pusherTrigger(channel, eventType, event)
      
      // Log success
      console.log('[HeartPulse] ✅ Event published successfully', {
        eventId,
        eventType,
        channel,
        correlationId,
      })
      
      return {
        success: true,
        eventId,
        retryCount: retryCount > 0 ? retryCount : undefined,
      }
    } catch (error: any) {
      lastError = error.message || 'Unknown error'
      retryCount++
      
      console.error('[HeartPulse] ❌ Event publish failed', {
        eventId,
        eventType,
        channel,
        correlationId,
        attempt: retryCount,
        error: lastError,
      })
      
      // Wait before retry (exponential backoff)
      if (retryCount <= maxRetries) {
        const delayMs = Math.min(1000 * Math.pow(2, retryCount - 1), 5000)
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    }
  }
  
  // All retries exhausted
  console.error('[HeartPulse] ❌ Event publish failed after retries', {
    eventId,
    eventType,
    channel,
    correlationId,
    totalAttempts: retryCount,
    error: lastError,
  })
  
  return {
    success: false,
    eventId,
    error: lastError,
    retryCount,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Batch Publishing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Publish multiple events with shared correlation ID.
 * Useful for publishing related events in a workflow.
 * 
 * @param events - Array of events to publish
 * @param sharedCorrelationId - Optional shared correlation ID
 * @returns Array of PublishResult for each event
 */
export async function publishHeartPulseEventBatch(
  events: Array<{
    channel: string
    eventType: HeartPulseEventTypeValue
    businessId: string
    payload: unknown
    options?: Omit<PublishOptions, 'correlationId'>
  }>,
  sharedCorrelationId?: string
): Promise<PublishResult[]> {
  const correlationId = sharedCorrelationId || uuidv4()
  
  console.log('[HeartPulse] Publishing event batch', {
    correlationId,
    eventCount: events.length,
  })
  
  const results = await Promise.all(
    events.map(event =>
      publishHeartPulseEvent(
        event.channel,
        event.eventType,
        event.businessId,
        event.payload,
        {
          ...event.options,
          correlationId,
        }
      )
    )
  )
  
  const successCount = results.filter(r => r.success).length
  const failureCount = results.length - successCount
  
  console.log('[HeartPulse] Batch publish complete', {
    correlationId,
    total: results.length,
    success: successCount,
    failed: failureCount,
  })
  
  return results
}

// ─────────────────────────────────────────────────────────────────────────────
// Legacy Compatibility Wrapper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Publish event using legacy format (for backward compatibility).
 * Wraps legacy payload in standard HeartPulse envelope.
 * 
 * @deprecated Use publishHeartPulseEvent for new code
 */
export async function publishLegacyEvent(
  channel: string,
  eventType: string,
  businessId: string,
  legacyPayload: unknown,
  options: PublishOptions = {}
): Promise<PublishResult> {
  console.warn('[HeartPulse] Publishing legacy event (consider migrating)', {
    channel,
    eventType,
  })
  
  return publishHeartPulseEvent(
    channel,
    eventType as HeartPulseEventTypeValue,
    businessId,
    legacyPayload,
    options
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Correlation ID Management
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a new correlation ID for a workflow.
 * Use this at the start of an operational workflow.
 */
export function generateCorrelationId(): string {
  return uuidv4()
}

/**
 * Extract correlation ID from incoming event.
 * Use this to propagate correlation across event chains.
 */
export function extractCorrelationId(event: HeartPulseEvent): string {
  return event.correlationId
}

// ─────────────────────────────────────────────────────────────────────────────
// Delivery Monitoring
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get event publishing statistics (in-memory, resets on restart).
 * Useful for operational dashboards.
 */
const publishStats = {
  totalPublished: 0,
  totalFailed: 0,
  totalRetries: 0,
}

export function getPublishStats() {
  return { ...publishStats }
}

export function resetPublishStats() {
  publishStats.totalPublished = 0
  publishStats.totalFailed = 0
  publishStats.totalRetries = 0
}

// Track stats (called internally)
function trackPublishAttempt(success: boolean, retryCount: number = 0) {
  if (success) {
    publishStats.totalPublished++
  } else {
    publishStats.totalFailed++
  }
  if (retryCount > 0) {
    publishStats.totalRetries += retryCount
  }
}
