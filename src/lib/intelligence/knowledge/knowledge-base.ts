/**
 * Intelligence Knowledge Base (IKB) - Main API
 * 
 * Public interface for the Intelligence Knowledge Base.
 */

import type {
  StructuredIntelligenceReport,
} from '../pipeline/types'
import type {
  KnowledgeBaseConfig,
  KnowledgeQuery,
  KnowledgeQueryResult,
  KnowledgeTimeline,
  InsightHistory,
  StorageStatistics,
  IntegrityStatus,
  IngestionResult,
  KnowledgeRecord,
} from './types'
import { KnowledgeIngestionPipeline } from './ingestion'
import { KnowledgeStore } from './store'
import { KnowledgeSerializer } from './serializer'

/**
 * Intelligence Knowledge Base
 * 
 * Preserves intelligence over time.
 * Provides organizational memory for restaurants.
 */
export class IntelligenceKnowledgeBase {
  private config: KnowledgeBaseConfig
  private ingestionPipeline: KnowledgeIngestionPipeline
  private store: KnowledgeStore
  private serializer: KnowledgeSerializer
  private version = '1.0.0'

  constructor(config: KnowledgeBaseConfig = {}) {
    this.config = {
      storage: { type: 'memory' },
      retention: {},
      versioning: { enabled: true, schemaVersion: '1.0.0' },
      diagnostics: { enabled: true, verbose: false },
      ...config,
    }

    this.ingestionPipeline = new KnowledgeIngestionPipeline()
    this.store = new KnowledgeStore()
    this.serializer = new KnowledgeSerializer()
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Public API
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Ingest a Structured Intelligence Report.
   * 
   * Extracts knowledge and stores it for future retrieval.
   */
  async ingest(report: StructuredIntelligenceReport): Promise<IngestionResult> {
    const startTime = Date.now()

    try {
      // Run ingestion pipeline
      const result = await this.ingestionPipeline.ingest(report)

      if (!result.success) {
        return result
      }

      // Extract records from ingestion result
      const records = await this.extractRecordsFromReport(report)

      // Store records
      const storageStart = Date.now()
      await this.store.storeMany(records)
      const storageTime = Date.now() - storageStart

      // Update diagnostics
      result.diagnostics.storageTime = storageTime
      result.diagnostics.endTime = Date.now()
      result.diagnostics.durationMs = Date.now() - startTime

      // Apply retention policy
      if (this.config.retention?.autoCleanup) {
        await this.applyRetentionPolicy()
      }

      return result
    } catch (error) {
      return {
        success: false,
        recordsCreated: 0,
        recordsUpdated: 0,
        errors: [{
          code: 'INGESTION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        }],
        warnings: [],
        diagnostics: {
          startTime,
          endTime: Date.now(),
          durationMs: Date.now() - startTime,
          reportId: report.metadata.id,
          reportVersion: report.metadata.version,
          validationTime: 0,
          extractionTime: 0,
          storageTime: 0,
        },
      }
    }
  }

  /**
   * Query knowledge records.
   * 
   * @example
   * const result = await knowledgeBase.query({
   *   businessId: 'biz_123',
   *   categories: ['observation', 'pattern'],
   *   minConfidence: 0.7
   * })
   */
  async query(query: KnowledgeQuery): Promise<KnowledgeQueryResult> {
    return this.store.query(query)
  }

  /**
   * Get knowledge timeline for a business.
   * 
   * Returns chronological history of intelligence.
   */
  async getTimeline(businessId: string, limit?: number): Promise<KnowledgeTimeline> {
    return this.store.getTimeline(businessId, limit)
  }

  /**
   * Get insight history.
   * 
   * Track how a specific insight has evolved over time.
   */
  async getInsightHistory(businessId: string, insightType: string): Promise<InsightHistory | null> {
    return this.store.getInsightHistory(businessId, insightType)
  }

  /**
   * Get all insight histories for a business.
   */
  async getInsightHistories(businessId: string): Promise<InsightHistory[]> {
    return this.store.getInsightHistories(businessId)
  }

  /**
   * Get storage statistics.
   */
  async getStatistics(): Promise<StorageStatistics> {
    return this.store.getStatistics()
  }

  /**
   * Check integrity of knowledge base.
   */
  async checkIntegrity(): Promise<IntegrityStatus> {
    return this.store.checkIntegrity()
  }

  /**
   * Export knowledge base to JSON.
   */
  async export(): Promise<string> {
    const records = await this.store.export()
    return this.serializer.serialize(records)
  }

  /**
   * Import knowledge base from JSON.
   */
  async import(json: string): Promise<void> {
    const records = this.serializer.deserialize(json)
    await this.store.import(records)
  }

  /**
   * Clear all knowledge (for testing).
   */
  async clear(): Promise<void> {
    await this.store.clear()
  }

  /**
   * Get version information.
   */
  getVersion(): string {
    return this.version
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Historical Queries
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Has this happened before?
   */
  async hasHappenedBefore(businessId: string, type: string): Promise<boolean> {
    const result = await this.query({
      businessId,
      types: [type],
      limit: 1,
    })
    return result.total > 0
  }

  /**
   * How often does this happen?
   */
  async getOccurrenceFrequency(businessId: string, type: string): Promise<number> {
    const result = await this.query({
      businessId,
      types: [type],
    })
    return result.total
  }

  /**
   * Is this improving?
   */
  async isImproving(businessId: string, insightType: string): Promise<boolean> {
    const history = await this.getInsightHistory(businessId, insightType)
    return history?.trend === 'increasing'
  }

  /**
   * Is this getting worse?
   */
  async isGettingWorse(businessId: string, insightType: string): Promise<boolean> {
    const history = await this.getInsightHistory(businessId, insightType)
    return history?.trend === 'decreasing'
  }

  /**
   * Get historical evidence for an observation.
   */
  async getHistoricalEvidence(businessId: string, type: string): Promise<KnowledgeRecord[]> {
    const result = await this.query({
      businessId,
      types: [type],
      sortBy: 'timestamp',
      sortOrder: 'desc',
    })
    return result.records
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Private Methods
  // ───────────────────────────────────────────────────────────────────────────

  private async extractRecordsFromReport(report: StructuredIntelligenceReport): Promise<KnowledgeRecord[]> {
    // Re-run ingestion to get records
    // This is a simplified approach - in production, ingestion would return records
    const records: KnowledgeRecord[] = []

    // Extract from problems
    if (report.problems) {
      for (const problem of report.problems) {
        records.push({
          id: `obs_${problem.id}`,
          version: this.version,
          businessId: report.metadata.businessId,
          timestamp: report.metadata.generatedAt,
          category: 'observation',
          type: problem.type,
          sourceReport: {
            reportId: report.metadata.id,
            reportVersion: report.metadata.version,
            generatedAt: report.metadata.generatedAt,
            timeRange: report.metadata.timeRange,
          },
          context: {
            businessId: report.metadata.businessId,
            timeRange: report.metadata.timeRange,
            timezone: report.metadata.timezone,
            scope: Object.keys(report.metadata.scope).filter(k => (report.metadata.scope as any)[k] !== false),
          },
          content: {
            title: problem.title,
            description: problem.description,
            severity: problem.severity,
            impact: problem.impact?.description,
          },
          evidence: {
            evidenceRefs: problem.evidence,
            replayLinks: report.replayLinks.problems.get(problem.id) ? [report.replayLinks.problems.get(problem.id)!] : [],
            eventCount: problem.evidence.length,
          },
          confidence: problem.rootCause?.confidence ?? 0.7,
          metadata: {
            createdAt: new Date().toISOString(),
            source: 'hie_pipeline',
            pipelineVersion: report.metadata.pipelineVersion,
            dataQuality: report.confidence.dataQuality,
            processingTime: report.statistics.performance.totalDurationMs,
          },
        })
      }
    }

    // Extract from highlights
    if (report.highlights) {
      for (const highlight of report.highlights) {
        records.push({
          id: `obs_${highlight.id}`,
          version: this.version,
          businessId: report.metadata.businessId,
          timestamp: report.metadata.generatedAt,
          category: 'observation',
          type: highlight.type,
          sourceReport: {
            reportId: report.metadata.id,
            reportVersion: report.metadata.version,
            generatedAt: report.metadata.generatedAt,
            timeRange: report.metadata.timeRange,
          },
          context: {
            businessId: report.metadata.businessId,
            timeRange: report.metadata.timeRange,
            timezone: report.metadata.timezone,
            scope: Object.keys(report.metadata.scope).filter(k => (report.metadata.scope as any)[k] !== false),
          },
          content: {
            title: highlight.title,
            description: highlight.description,
            value: highlight.value,
            unit: highlight.unit,
          },
          evidence: {
            evidenceRefs: highlight.evidence,
            replayLinks: report.replayLinks.highlights.get(highlight.id) ? [report.replayLinks.highlights.get(highlight.id)!] : [],
            eventCount: highlight.evidence.length,
          },
          confidence: highlight.confidence,
          metadata: {
            createdAt: new Date().toISOString(),
            source: 'hie_pipeline',
            pipelineVersion: report.metadata.pipelineVersion,
            dataQuality: report.confidence.dataQuality,
            processingTime: report.statistics.performance.totalDurationMs,
          },
        })
      }
    }

    return records
  }

  private async applyRetentionPolicy(): Promise<void> {
    if (!this.config.retention) return

    const { maxAge, maxRecords } = this.config.retention

    if (maxAge) {
      // Remove records older than maxAge days
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - maxAge)
      // Implementation would filter and remove old records
    }

    if (maxRecords) {
      // Keep only the most recent maxRecords
      // Implementation would sort and remove excess records
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory Function
// ─────────────────────────────────────────────────────────────────────────────

export function createKnowledgeBase(config?: KnowledgeBaseConfig): IntelligenceKnowledgeBase {
  return new IntelligenceKnowledgeBase(config)
}
