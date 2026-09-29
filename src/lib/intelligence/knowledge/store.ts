/**
 * Intelligence Knowledge Base (IKB) - Knowledge Store
 * 
 * Storage and retrieval of knowledge records.
 */

import type {
  KnowledgeRecord,
  KnowledgeQuery,
  KnowledgeQueryResult,
  KnowledgeTimeline,
  TimelineEntry,
  StorageStatistics,
  IntegrityStatus,
  IntegrityIssue,
  InsightHistory,
  InsightSnapshot,
  KnowledgeCategory,
} from './types'

export class KnowledgeStore {
  private records: Map<string, KnowledgeRecord> = new Map()
  private businessIndex: Map<string, Set<string>> = new Map()
  private categoryIndex: Map<KnowledgeCategory, Set<string>> = new Map()
  private typeIndex: Map<string, Set<string>> = new Map()
  private timelineIndex: Map<string, TimelineEntry[]> = new Map()
  private insightHistories: Map<string, InsightHistory> = new Map()

  /**
   * Store a knowledge record.
   */
  async store(record: KnowledgeRecord): Promise<void> {
    // Store record
    this.records.set(record.id, record)

    // Update business index
    const businessRecords = this.businessIndex.get(record.businessId) || new Set()
    businessRecords.add(record.id)
    this.businessIndex.set(record.businessId, businessRecords)

    // Update category index
    const categoryRecords = this.categoryIndex.get(record.category) || new Set()
    categoryRecords.add(record.id)
    this.categoryIndex.set(record.category, categoryRecords)

    // Update type index
    const typeRecords = this.typeIndex.get(record.type) || new Set()
    typeRecords.add(record.id)
    this.typeIndex.set(record.type, typeRecords)

    // Update timeline
    this.updateTimeline(record)

    // Update insight history
    if (record.category === 'insight' || record.category === 'observation') {
      this.updateInsightHistory(record)
    }
  }

  /**
   * Store multiple records.
   */
  async storeMany(records: KnowledgeRecord[]): Promise<void> {
    for (const record of records) {
      await this.store(record)
    }
  }

  /**
   * Query knowledge records.
   */
  async query(query: KnowledgeQuery): Promise<KnowledgeQueryResult> {
    let candidateIds = new Set<string>()

    // Filter by business
    const businessRecords = this.businessIndex.get(query.businessId)
    if (!businessRecords || businessRecords.size === 0) {
      return {
        records: [],
        total: 0,
        hasMore: false,
        query,
      }
    }
    candidateIds = new Set(businessRecords)

    // Filter by categories
    if (query.categories && query.categories.length > 0) {
      const categoryMatches = new Set<string>()
      for (const category of query.categories) {
        const categoryRecords = this.categoryIndex.get(category)
        if (categoryRecords) {
          categoryRecords.forEach(id => categoryMatches.add(id))
        }
      }
      candidateIds = new Set([...candidateIds].filter(id => categoryMatches.has(id)))
    }

    // Filter by types
    if (query.types && query.types.length > 0) {
      const typeMatches = new Set<string>()
      for (const type of query.types) {
        const typeRecords = this.typeIndex.get(type)
        if (typeRecords) {
          typeRecords.forEach(id => typeMatches.add(id))
        }
      }
      candidateIds = new Set([...candidateIds].filter(id => typeMatches.has(id)))
    }

    // Get records
    let records = Array.from(candidateIds)
      .map(id => this.records.get(id))
      .filter((r): r is KnowledgeRecord => r !== undefined)

    // Filter by time range
    if (query.timeRange) {
      const start = new Date(query.timeRange.start).getTime()
      const end = new Date(query.timeRange.end).getTime()
      records = records.filter(r => {
        const timestamp = new Date(r.timestamp).getTime()
        return timestamp >= start && timestamp <= end
      })
    }

    // Filter by confidence
    if (query.minConfidence !== undefined) {
      records = records.filter(r => r.confidence >= query.minConfidence!)
    }

    // Filter by tags
    if (query.tags && query.tags.length > 0) {
      records = records.filter(r => {
        const recordTags = r.context.tags || []
        return query.tags!.some(tag => recordTags.includes(tag))
      })
    }

    // Sort
    const sortBy = query.sortBy || 'timestamp'
    const sortOrder = query.sortOrder || 'desc'
    records.sort((a, b) => {
      let comparison = 0
      if (sortBy === 'timestamp') {
        comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      } else if (sortBy === 'confidence') {
        comparison = a.confidence - b.confidence
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    // Paginate
    const total = records.length
    const offset = query.offset || 0
    const limit = query.limit || 100
    const paginatedRecords = records.slice(offset, offset + limit)
    const hasMore = offset + limit < total

    return {
      records: paginatedRecords,
      total,
      hasMore,
      query,
    }
  }

  /**
   * Get timeline for a business.
   */
  async getTimeline(businessId: string, limit?: number): Promise<KnowledgeTimeline> {
    const entries = this.timelineIndex.get(businessId) || []
    const limitedEntries = limit ? entries.slice(0, limit) : entries

    const timeSpan = entries.length > 0
      ? {
          start: entries[entries.length - 1].timestamp,
          end: entries[0].timestamp,
        }
      : {
          start: new Date().toISOString(),
          end: new Date().toISOString(),
        }

    return {
      businessId,
      entries: limitedEntries,
      totalEntries: entries.length,
      timeSpan,
    }
  }

  /**
   * Get insight history.
   */
  async getInsightHistory(businessId: string, insightType: string): Promise<InsightHistory | null> {
    const key = `${businessId}_${insightType}`
    return this.insightHistories.get(key) || null
  }

  /**
   * Get all insight histories for a business.
   */
  async getInsightHistories(businessId: string): Promise<InsightHistory[]> {
    const histories: InsightHistory[] = []
    for (const [key, history] of this.insightHistories) {
      if (history.businessId === businessId) {
        histories.push(history)
      }
    }
    return histories
  }

  /**
   * Get storage statistics.
   */
  async getStatistics(): Promise<StorageStatistics> {
    const recordsByCategory: Record<KnowledgeCategory, number> = {
      observation: 0,
      trend: 0,
      pattern: 0,
      issue: 0,
      success: 0,
      recommendation: 0,
      insight: 0,
      comparison: 0,
    }

    for (const [category, ids] of this.categoryIndex) {
      recordsByCategory[category] = ids.size
    }

    const timestamps = Array.from(this.records.values()).map(r => r.timestamp).sort()
    const confidences = Array.from(this.records.values()).map(r => r.confidence)
    const avgConfidence = confidences.length > 0
      ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length
      : 0

    return {
      totalRecords: this.records.size,
      recordsByCategory,
      totalBusinesses: this.businessIndex.size,
      oldestRecord: timestamps[0] || new Date().toISOString(),
      newestRecord: timestamps[timestamps.length - 1] || new Date().toISOString(),
      totalSize: 0, // Would be calculated based on actual storage
      avgConfidence,
    }
  }

  /**
   * Check integrity.
   */
  async checkIntegrity(): Promise<IntegrityStatus> {
    const issues: IntegrityIssue[] = []

    // Check for missing evidence
    for (const record of this.records.values()) {
      if (!record.evidence || record.evidence.evidenceRefs.length === 0) {
        issues.push({
          severity: 'low',
          type: 'missing_evidence',
          description: `Record ${record.id} has no evidence`,
          affectedRecords: [record.id],
          recoverable: true,
        })
      }
    }

    // Check for broken references
    for (const record of this.records.values()) {
      if (record.content.relatedKnowledge) {
        for (const relatedId of record.content.relatedKnowledge) {
          if (!this.records.has(relatedId)) {
            issues.push({
              severity: 'medium',
              type: 'broken_reference',
              description: `Record ${record.id} references non-existent record ${relatedId}`,
              affectedRecords: [record.id],
              recoverable: true,
            })
          }
        }
      }
    }

    return {
      healthy: issues.length === 0,
      issues,
      lastChecked: new Date().toISOString(),
    }
  }

  /**
   * Clear all records (for testing).
   */
  async clear(): Promise<void> {
    this.records.clear()
    this.businessIndex.clear()
    this.categoryIndex.clear()
    this.typeIndex.clear()
    this.timelineIndex.clear()
    this.insightHistories.clear()
  }

  /**
   * Export all records.
   */
  async export(): Promise<KnowledgeRecord[]> {
    return Array.from(this.records.values())
  }

  /**
   * Import records.
   */
  async import(records: KnowledgeRecord[]): Promise<void> {
    await this.storeMany(records)
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Private Methods
  // ───────────────────────────────────────────────────────────────────────────

  private updateTimeline(record: KnowledgeRecord): void {
    const timeline = this.timelineIndex.get(record.businessId) || []
    
    const entry: TimelineEntry = {
      id: record.id,
      timestamp: record.timestamp,
      category: record.category,
      type: record.type,
      title: record.content.title,
      reportId: record.sourceReport.reportId,
      confidence: record.confidence,
      replayLink: record.evidence.replayLinks[0],
      tags: record.context.tags,
    }

    // Insert in chronological order (newest first)
    const insertIndex = timeline.findIndex(e => 
      new Date(e.timestamp).getTime() < new Date(entry.timestamp).getTime()
    )

    if (insertIndex === -1) {
      timeline.push(entry)
    } else {
      timeline.splice(insertIndex, 0, entry)
    }

    this.timelineIndex.set(record.businessId, timeline)
  }

  private updateInsightHistory(record: KnowledgeRecord): void {
    const key = `${record.businessId}_${record.type}`
    let history = this.insightHistories.get(key)

    const snapshot: InsightSnapshot = {
      timestamp: record.timestamp,
      reportId: record.sourceReport.reportId,
      value: record.content.value || 0,
      confidence: record.confidence,
      evidence: record.evidence.evidenceRefs,
      replayLink: record.evidence.replayLinks[0],
    }

    if (!history) {
      history = {
        id: key,
        businessId: record.businessId,
        insightType: record.type,
        category: record.category,
        timeline: [snapshot],
        firstSeen: record.timestamp,
        lastSeen: record.timestamp,
        occurrenceCount: 1,
        trend: 'stable',
        avgConfidence: record.confidence,
      }
    } else {
      history.timeline.push(snapshot)
      history.lastSeen = record.timestamp
      history.occurrenceCount++
      history.avgConfidence = history.timeline.reduce((sum, s) => sum + s.confidence, 0) / history.timeline.length
      history.trend = this.calculateTrend(history.timeline)
    }

    this.insightHistories.set(key, history)
  }

  private calculateTrend(timeline: InsightSnapshot[]): 'increasing' | 'stable' | 'decreasing' {
    if (timeline.length < 3) return 'stable'

    const values = timeline
      .filter(s => typeof s.value === 'number')
      .map(s => s.value as number)

    if (values.length < 3) return 'stable'

    const firstHalf = values.slice(0, Math.floor(values.length / 2))
    const secondHalf = values.slice(Math.floor(values.length / 2))

    const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length

    const change = ((secondAvg - firstAvg) / firstAvg) * 100

    if (change > 10) return 'increasing'
    if (change < -10) return 'decreasing'
    return 'stable'
  }
}
