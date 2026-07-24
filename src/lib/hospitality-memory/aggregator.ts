/**
 * Hospitality Memory™ aggregation and retrieval utilities.
 */

import type { OperationalEvent } from '@/lib/intelligence/integration-helper'
import type {
  HospitalityMemoryCategory,
  HospitalityMemoryContext,
  HospitalityMemoryEntity,
  HospitalityMemoryRelationship,
  HospitalityMemoryRelationshipType,
  HospitalityMemorySearchResult,
  HospitalityObservationCandidate,
} from './types'
import { dayOfWeekFromIso, hashId, seasonFromIso, timeOfDayFromIso, uniqueStrings } from './utils'

function categoryForEventType(eventType: string): HospitalityMemoryCategory {
  if (eventType.includes('KITCHEN')) return 'kitchen'
  if (eventType.includes('PAYMENT')) return 'financial'
  if (eventType.includes('TABLE') || eventType.includes('WAITER')) return 'service'
  if (eventType.includes('RESERVATION')) return 'reservation'
  if (eventType.includes('INVENTORY') || eventType.includes('STOCK')) return 'inventory'
  if (eventType.includes('SUPPLIER') || eventType.includes('DELIVERY')) return 'supplier'
  if (eventType.includes('CUSTOMER')) return 'customer'
  if (eventType.includes('CAMPAIGN') || eventType.includes('PROMOTION')) return 'marketing'
  return 'operational'
}

function actionForCategory(category: HospitalityMemoryCategory): string {
  switch (category) {
    case 'kitchen':
      return 'Review station load balancing and prep sequencing'
    case 'service':
      return 'Adjust floor staffing and table assignment strategy'
    case 'inventory':
      return 'Pre-check stock levels and replenishment cadence'
    case 'financial':
      return 'Review margin and payment flow anomalies'
    case 'product':
      return 'Adjust placement/promotion for high-opportunity items'
    default:
      return 'Document pattern and operationalize preventive action'
  }
}

export class HospitalityMemoryAggregator {
  extractObservationCandidates(events: OperationalEvent[]): HospitalityObservationCandidate[] {
    if (events.length === 0) return []

    const byType = new Map<string, OperationalEvent[]>()
    for (const event of events) {
      const type = event.type || 'UNKNOWN'
      const bucket = byType.get(type) || []
      bucket.push(event)
      byType.set(type, bucket)
    }

    const results: HospitalityObservationCandidate[] = []

    for (const [eventType, bucket] of byType.entries()) {
      const category = categoryForEventType(eventType)
      const context = this.buildContext(bucket)
      const polarity = this.derivePolarity(bucket)

      // Frequency candidate
      if (bucket.length >= 3) {
        const key = `freq:${eventType}:${context.dayOfWeek?.[0] ?? 'any'}:${context.timeOfDay?.[0] ?? 'any'}`
        results.push({
          key,
          title: `${eventType} recurring pattern`,
          description: `${eventType} observed ${bucket.length} times in period`,
          category,
          impactLevel: bucket.length > 30 ? 'high' : bucket.length > 10 ? 'medium' : 'low',
          impactScore: bucket.length > 30 ? 0.9 : bucket.length > 10 ? 0.65 : 0.5,
          recommendedAction: actionForCategory(category),
          polarity,
          tags: uniqueStrings([eventType, category, ...(context.dayOfWeek ?? []), ...(context.timeOfDay ?? [])]),
          context,
          sourceModule: 'heart-pulse',
          eventRefs: bucket.map((evt) => ({
            eventId: evt.id,
            eventType: evt.type,
            timestamp: evt.timestamp,
            evidence: `${evt.type} at ${evt.timestamp}`,
          })),
        })
      }

      // Peak-hour candidate
      const peak = this.findPeakHour(bucket)
      if (peak && peak.ratio >= 0.4) {
        const key = `peak:${eventType}:${peak.hour}`
        results.push({
          key,
          title: `${eventType} peaks around ${peak.hour}:00`,
          description: `${Math.round(peak.ratio * 100)}% of ${eventType} happens near ${peak.hour}:00`,
          category,
          impactLevel: 'medium',
          impactScore: 0.6,
          recommendedAction: 'Pre-stage team and inventory before peak period',
          polarity,
          tags: uniqueStrings([eventType, 'peak', String(peak.hour), category]),
          context: {
            ...context,
            timeOfDay: [peak.hour < 12 ? 'morning' : peak.hour < 17 ? 'afternoon' : peak.hour < 21 ? 'evening' : 'night'],
          },
          sourceModule: 'heart-pulse',
          eventRefs: bucket.map((evt) => ({
            eventId: evt.id,
            eventType: evt.type,
            timestamp: evt.timestamp,
            evidence: `${evt.type} timestamp ${evt.timestamp}`,
          })),
        })
      }
    }

    return results
  }

  createRelationshipCandidates(
    businessId: string,
    memories: HospitalityMemoryEntity[]
  ): HospitalityMemoryRelationship[] {
    const relationships: HospitalityMemoryRelationship[] = []

    const maybeCause = (a: HospitalityMemoryCategory, b: HospitalityMemoryCategory): HospitalityMemoryRelationshipType | null => {
      if (a === 'supplier' && b === 'inventory') return 'causes'
      if (a === 'inventory' && b === 'kitchen') return 'causes'
      if (a === 'kitchen' && b === 'service') return 'causes'
      if (a === 'service' && b === 'customer') return 'causes'
      if (a === 'customer' && b === 'financial') return 'causes'
      if (a === b) return 'similar'
      return null
    }

    for (let i = 0; i < memories.length; i++) {
      for (let j = i + 1; j < memories.length; j++) {
        const a = memories[i]
        const b = memories[j]

        const direct = maybeCause(a.category, b.category)
        const reverse = maybeCause(b.category, a.category)
        const sharedContext =
          (a.context.dayOfWeek?.some((d) => b.context.dayOfWeek?.includes(d)) ?? false) ||
          (a.context.timeOfDay?.some((d) => b.context.timeOfDay?.includes(d)) ?? false)

        const now = new Date().toISOString()
        if (direct) {
          const id = hashId('hm_rel', `${businessId}|${a.id}|${b.id}|${direct}`)
          relationships.push({
            id,
            businessId,
            fromMemoryId: a.id,
            toMemoryId: b.id,
            type: direct,
            strength: direct === 'causes' ? 0.8 : 0.6,
            evidence: `${a.category} -> ${b.category} heuristic`,
            firstObserved: now,
            lastObserved: now,
            observationCount: 1,
            createdAt: now,
            updatedAt: now,
          })
        } else if (reverse) {
          const id = hashId('hm_rel', `${businessId}|${b.id}|${a.id}|${reverse}`)
          relationships.push({
            id,
            businessId,
            fromMemoryId: b.id,
            toMemoryId: a.id,
            type: reverse,
            strength: reverse === 'causes' ? 0.8 : 0.6,
            evidence: `${b.category} -> ${a.category} heuristic`,
            firstObserved: now,
            lastObserved: now,
            observationCount: 1,
            createdAt: now,
            updatedAt: now,
          })
        }

        if (sharedContext) {
          const id = hashId('hm_rel', `${businessId}|${a.id}|${b.id}|correlates`)
          relationships.push({
            id,
            businessId,
            fromMemoryId: a.id,
            toMemoryId: b.id,
            type: 'correlates',
            strength: 0.65,
            evidence: 'Shared temporal context',
            firstObserved: now,
            lastObserved: now,
            observationCount: 1,
            createdAt: now,
            updatedAt: now,
          })
        }
      }
    }

    // Deduplicate by id
    const byId = new Map<string, HospitalityMemoryRelationship>()
    for (const rel of relationships) byId.set(rel.id, rel)
    return Array.from(byId.values())
  }

  searchMemories(memories: HospitalityMemoryEntity[], query: string, limit: number = 25): HospitalityMemorySearchResult[] {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const results: HospitalityMemorySearchResult[] = []

    for (const memory of memories) {
      let score = 0
      const matched: string[] = []
      if (memory.title.toLowerCase().includes(q)) {
        score += 10
        matched.push('title')
      }
      if (memory.description.toLowerCase().includes(q)) {
        score += 6
        matched.push('description')
      }
      if (memory.category.toLowerCase().includes(q)) {
        score += 4
        matched.push('category')
      }
      if (memory.tags.some((tag) => tag.toLowerCase().includes(q))) {
        score += 3
        matched.push('tags')
      }
      if (score > 0) {
        results.push({ memory, relevanceScore: score, matchedFields: matched })
      }
    }

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, limit)
  }

  selectContextualMemories(
    memories: HospitalityMemoryEntity[],
    context: { dayOfWeek: string; timeOfDay: string }
  ): HospitalityMemoryEntity[] {
    return memories
      .filter((memory) => {
        const dayMatch = memory.context.dayOfWeek?.includes(context.dayOfWeek) ?? false
        const timeMatch = memory.context.timeOfDay?.includes(context.timeOfDay) ?? false
        return dayMatch || timeMatch || memory.status === 'business_rule' || memory.impactLevel === 'critical'
      })
      .sort((a, b) => b.confidenceScore - a.confidenceScore)
      .slice(0, 20)
  }

  private buildContext(events: OperationalEvent[]): HospitalityMemoryContext {
    const day = uniqueStrings(events.map((event) => dayOfWeekFromIso(event.timestamp)))
    const tod = uniqueStrings(events.map((event) => timeOfDayFromIso(event.timestamp)))
    const season = uniqueStrings(events.map((event) => seasonFromIso(event.timestamp)))
    return {
      dayOfWeek: day,
      timeOfDay: tod,
      season,
      tags: uniqueStrings([...day, ...tod, ...season]),
    }
  }

  private findPeakHour(events: OperationalEvent[]): { hour: number; ratio: number } | null {
    if (events.length < 3) return null
    const byHour = new Map<number, number>()
    for (const event of events) {
      const hour = new Date(event.timestamp).getHours()
      byHour.set(hour, (byHour.get(hour) || 0) + 1)
    }
    let topHour = -1
    let topCount = 0
    for (const [hour, count] of byHour.entries()) {
      if (count > topCount) {
        topHour = hour
        topCount = count
      }
    }
    if (topHour < 0) return null
    return { hour: topHour, ratio: topCount / events.length }
  }

  private derivePolarity(events: OperationalEvent[]): -1 | 0 | 1 {
    let score = 0
    for (const event of events) {
      const payload = (event.data || {}) as Record<string, unknown>
      const trend = typeof payload.trend === 'string' ? payload.trend.toLowerCase() : undefined
      const delta = typeof payload.delta === 'number' ? payload.delta : undefined
      if (trend === 'up' || trend === 'increase' || trend === 'improving') score += 1
      if (trend === 'down' || trend === 'decrease' || trend === 'declining') score -= 1
      if (typeof delta === 'number') score += delta > 0 ? 1 : delta < 0 ? -1 : 0
    }
    if (score > 0) return 1
    if (score < 0) return -1
    return 0
  }
}
