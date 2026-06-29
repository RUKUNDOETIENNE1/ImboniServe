import { nanoid } from 'nanoid'
import type { UnifiedFeedItem, UnifiedSeverity, UnifiedSource } from '@/lib/die/unified-intelligence/types'

class ShadowObservabilityBuffer {
  private buffer: UnifiedFeedItem[] = []
  private max = 500
  private lastEmitAt: Map<string, number> = new Map()

  // Basic per-code suppression windows (ms)
  private suppressionMs: Record<string, number> = {
    CAMPAIGN_SCHEDULED: 60_000,
    SESSION_UPDATED: 20_000,
    KDS_BACKLOG_ALERT: 15_000,
    WAITER_CALL_CREATED: 10_000,
  }

  private makeKey(code: string, data?: Record<string, unknown>): string {
    const parts = [code]
    const d = data || {}
    const ids = [
      (d as any)?.pluginId,
      (d as any)?.sourceTag,
      (d as any)?.campaignId,
      (d as any)?.slipId,
      (d as any)?.sessionId,
      (d as any)?.orderId,
      (d as any)?.inventoryItemId,
      (d as any)?.supplierId,
    ].filter(Boolean)
    if (ids.length) parts.push(ids.join('|'))
    return parts.join('#')
  }

  emit(source: UnifiedSource, code: string, message: string, severity: UnifiedSeverity, data?: Record<string, unknown>) {
    const key = this.makeKey(code, data)
    const now = Date.now()
    const suppressFor = this.suppressionMs[code] ?? 0
    const last = this.lastEmitAt.get(key) || 0
    if (suppressFor > 0 && now - last < suppressFor) {
      return // suppress duplicate within window
    }
    const item: UnifiedFeedItem = {
      id: nanoid(12),
      timestamp: new Date().toISOString(),
      source,
      severity,
      code,
      message,
      data,
    }
    this.buffer.unshift(item)
    if (this.buffer.length > this.max) this.buffer.pop()
    this.lastEmitAt.set(key, now)
  }

  list(limit = 50): UnifiedFeedItem[] {
    return this.buffer.slice(0, limit)
  }

  clear() {
    this.buffer = []
  }
}

export const shadowObservability = new ShadowObservabilityBuffer()
