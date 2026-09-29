# Intelligence Knowledge Base (IKB)

**Status:** ✅ Complete  
**Version:** 1.0.0

## Overview

The Intelligence Knowledge Base (IKB) is the **organizational memory layer** for restaurants. It preserves intelligence over time, enabling future systems to answer historical questions and track operational evolution.

## Core Principle

**Heart Pulse stores reality.**  
**HIE produces intelligence.**  
**IKB stores accumulated knowledge.**

Each layer has a single responsibility.

## Architecture

```
Restaurant Operations
        ↓
Heart Pulse™ (Reality Layer)
        ↓
Hospitality Intelligence Engine (Intelligence Layer)
        ↓
Structured Intelligence Report
        ↓
Intelligence Knowledge Base (Memory Layer)
        ↓
Future Consumers
(Service Intelligence™, Daily Briefings, AI Copilot, etc.)
```

## Responsibilities

IKB **never** analyzes raw Heart Pulse events.

IKB receives **only** completed Structured Intelligence Reports.

Its responsibility is to:
- Preserve intelligence over time
- Organize knowledge for retrieval
- Maintain historical context
- Track trends and patterns
- Enable historical queries

## Knowledge Model

### Knowledge Record

The fundamental unit of preserved intelligence:

```typescript
interface KnowledgeRecord {
  id: string
  version: string
  businessId: string
  timestamp: string
  category: KnowledgeCategory
  type: string
  
  sourceReport: ReportReference      // Traceability
  context: KnowledgeContext          // Business context
  content: KnowledgeContent          // The knowledge
  evidence: PreservedEvidence        // Evidence preservation
  confidence: number                 // Confidence metric
  metadata: KnowledgeMetadata        // Metadata
}
```

### Knowledge Categories

- **Observation** - Specific operational observation (problem/highlight/anomaly)
- **Trend** - Directional change over time
- **Pattern** - Recurring operational pattern
- **Issue** - Operational problem
- **Success** - Operational achievement
- **Recommendation** - Actionable recommendation
- **Insight** - Analytical insight
- **Comparison** - Historical comparison

### Specialized Knowledge Types

**Observation:**
```typescript
interface Observation extends KnowledgeRecord {
  category: 'observation'
  observationType: 'problem' | 'highlight' | 'anomaly' | 'metric'
  recurrence?: RecurrenceInfo
}
```

**Trend:**
```typescript
interface Trend extends KnowledgeRecord {
  category: 'trend'
  direction: 'improving' | 'stable' | 'declining'
  metric: string
  dataPoints: TrendDataPoint[]
  changePercent: number
  significance: 'low' | 'medium' | 'high'
}
```

**Historical Pattern:**
```typescript
interface HistoricalPattern extends KnowledgeRecord {
  category: 'pattern'
  patternType: 'temporal' | 'behavioral' | 'operational' | 'demand'
  frequency: PatternFrequency
  occurrences: PatternOccurrence[]
  strength: number
  predictability: number
}
```

## Knowledge Lifecycle

### 1. Ingestion

```typescript
const knowledgeBase = createKnowledgeBase()
const result = await knowledgeBase.ingest(report)

if (result.success) {
  console.log(`Created ${result.recordsCreated} knowledge records`)
}
```

**Ingestion Pipeline:**
1. Validate report
2. Extract knowledge from report
3. Update historical records
4. Link evidence
5. Store metadata

### 2. Storage

Knowledge is indexed by:
- Business ID
- Category
- Type
- Timeline
- Insight history

### 3. Retrieval

```typescript
const result = await knowledgeBase.query({
  businessId: 'biz_123',
  categories: ['observation', 'pattern'],
  timeRange: {
    start: '2026-01-01T00:00:00Z',
    end: '2026-12-31T23:59:59Z'
  },
  minConfidence: 0.7,
  limit: 50
})
```

## Public API

### Basic Usage

```typescript
import { createKnowledgeBase } from '@/lib/intelligence'

// Create knowledge base
const knowledgeBase = createKnowledgeBase({
  storage: { type: 'memory' },
  retention: {
    maxAge: 365,  // days
    autoCleanup: true
  },
  versioning: {
    enabled: true,
    schemaVersion: '1.0.0'
  }
})

// Ingest intelligence report
const ingestionResult = await knowledgeBase.ingest(report)

// Query knowledge
const queryResult = await knowledgeBase.query({
  businessId: 'biz_123',
  categories: ['observation'],
  minConfidence: 0.8
})

// Get timeline
const timeline = await knowledgeBase.getTimeline('biz_123', 100)

// Get insight history
const history = await knowledgeBase.getInsightHistory('biz_123', 'prep_delay')
```

### Historical Queries

IKB enables powerful historical questions:

**Has this happened before?**
```typescript
const hasHappened = await knowledgeBase.hasHappenedBefore('biz_123', 'prep_delay')
// → true/false
```

**How often does this happen?**
```typescript
const frequency = await knowledgeBase.getOccurrenceFrequency('biz_123', 'prep_delay')
// → 15 (occurrences)
```

**Is this improving?**
```typescript
const improving = await knowledgeBase.isImproving('biz_123', 'kitchen_utilization')
// → true/false
```

**Is this getting worse?**
```typescript
const worsening = await knowledgeBase.isGettingWorse('biz_123', 'service_time')
// → true/false
```

**What historical evidence supports this?**
```typescript
const evidence = await knowledgeBase.getHistoricalEvidence('biz_123', 'prep_delay')
// → KnowledgeRecord[]
```

## Knowledge Timeline

Chronological intelligence history:

```typescript
const timeline = await knowledgeBase.getTimeline('biz_123')

// Returns:
{
  businessId: 'biz_123',
  entries: [
    {
      id: 'obs_123',
      timestamp: '2026-07-14T15:00:00Z',
      category: 'observation',
      type: 'prep_delay',
      title: '15 orders experienced delays',
      reportId: 'intel_...',
      confidence: 0.85,
      replayLink: '/dashboard/service-replay?t=...'
    },
    // ... more entries
  ],
  totalEntries: 247,
  timeSpan: {
    start: '2026-01-01T00:00:00Z',
    end: '2026-07-14T15:00:00Z'
  }
}
```

## Insight History

Track how insights evolve:

```typescript
const history = await knowledgeBase.getInsightHistory('biz_123', 'kitchen_utilization')

// Returns:
{
  id: 'biz_123_kitchen_utilization',
  businessId: 'biz_123',
  insightType: 'kitchen_utilization',
  category: 'insight',
  timeline: [
    {
      timestamp: '2026-07-14T12:00:00Z',
      reportId: 'intel_1',
      value: 78,
      confidence: 0.92,
      evidence: [...],
      replayLink: '...'
    },
    {
      timestamp: '2026-07-13T12:00:00Z',
      reportId: 'intel_2',
      value: 75,
      confidence: 0.89,
      evidence: [...],
      replayLink: '...'
    }
  ],
  firstSeen: '2026-01-01T12:00:00Z',
  lastSeen: '2026-07-14T12:00:00Z',
  occurrenceCount: 195,
  trend: 'increasing',
  avgConfidence: 0.88
}
```

## Evidence Preservation

Every knowledge record preserves traceability:

```typescript
{
  evidence: {
    evidenceRefs: [
      { type: 'event', id: 'evt_1', timestamp: '...' },
      { type: 'order', id: 'ord_1' },
      { type: 'aggregate', id: 'summary', description: '...' }
    ],
    replayLinks: [
      '/dashboard/service-replay?t=2026-07-14T12:30:00Z&business=biz_123'
    ],
    eventCount: 15,
    orderCount: 15,
    affectedEntities: {
      staff: ['staff_1', 'staff_2'],
      stations: ['station_1'],
      orders: ['ord_1', 'ord_2']
    }
  }
}
```

## Serialization

Full import/export support:

```typescript
// Export
const json = await knowledgeBase.export()
// Save to file or send to API

// Import
await knowledgeBase.import(json)
```

JSON format:
```json
{
  "version": "1.0.0",
  "exportedAt": "2026-07-14T15:00:00Z",
  "recordCount": 247,
  "records": [...]
}
```

## Versioning

Knowledge records are versioned:

```typescript
{
  version: '1.0.0',
  metadata: {
    source: 'hie_pipeline',
    pipelineVersion: '1.0.0',
    createdAt: '2026-07-14T15:00:00Z'
  }
}
```

Future HIE improvements won't invalidate older knowledge.

## Diagnostics

### Ingestion Diagnostics

```typescript
{
  success: true,
  recordsCreated: 25,
  recordsUpdated: 0,
  errors: [],
  warnings: [
    { code: 'VALIDATION_WARNING', message: 'Low confidence report' }
  ],
  diagnostics: {
    startTime: 1721000000000,
    endTime: 1721000000150,
    durationMs: 150,
    reportId: 'intel_123',
    reportVersion: '1.0.0',
    validationTime: 10,
    extractionTime: 100,
    storageTime: 40
  }
}
```

### Storage Statistics

```typescript
const stats = await knowledgeBase.getStatistics()

// Returns:
{
  totalRecords: 1247,
  recordsByCategory: {
    observation: 450,
    trend: 120,
    pattern: 85,
    insight: 350,
    comparison: 242
  },
  totalBusinesses: 15,
  oldestRecord: '2026-01-01T00:00:00Z',
  newestRecord: '2026-07-14T15:00:00Z',
  avgConfidence: 0.87
}
```

### Integrity Check

```typescript
const integrity = await knowledgeBase.checkIntegrity()

// Returns:
{
  healthy: true,
  issues: [
    {
      severity: 'low',
      type: 'missing_evidence',
      description: 'Record obs_123 has no evidence',
      affectedRecords: ['obs_123'],
      recoverable: true
    }
  ],
  lastChecked: '2026-07-14T15:00:00Z'
}
```

## Configuration

```typescript
interface KnowledgeBaseConfig {
  storage?: {
    type: 'memory' | 'file' | 'database'
    path?: string
    options?: Record<string, unknown>
  }
  
  retention?: {
    maxAge?: number        // days
    maxRecords?: number
    autoCleanup?: boolean
  }
  
  versioning?: {
    enabled: boolean
    schemaVersion: string
  }
  
  diagnostics?: {
    enabled: boolean
    verbose: boolean
  }
}
```

## Extensibility

IKB is designed for future extensions:

### Custom Knowledge Types

```typescript
interface CustomKnowledge extends KnowledgeRecord {
  category: 'custom'
  customField: string
}
```

### Custom Storage Backend

```typescript
class DatabaseStore extends KnowledgeStore {
  async store(record: KnowledgeRecord): Promise<void> {
    // Custom database logic
  }
}
```

### Custom Ingestion Logic

```typescript
class CustomIngestionPipeline extends KnowledgeIngestionPipeline {
  async ingest(report: StructuredIntelligenceReport): Promise<IngestionResult> {
    // Custom extraction logic
    return super.ingest(report)
  }
}
```

## Use Cases

### Service Intelligence™

```typescript
// After generating a service intelligence report
const report = await engine.generateReport(context, events)

// Preserve the intelligence
await knowledgeBase.ingest(report.report)

// Later: Query historical service patterns
const patterns = await knowledgeBase.query({
  businessId: 'biz_123',
  categories: ['pattern'],
  types: ['recurring_rush']
})
```

### Daily Briefings

```typescript
// Get today's intelligence
const todayReport = await engine.generateReport(todayContext, todayEvents)
await knowledgeBase.ingest(todayReport.report)

// Compare with yesterday
const yesterdayHistory = await knowledgeBase.getInsightHistory('biz_123', 'overall_score')
const trend = yesterdayHistory?.trend
```

### AI Copilot

```typescript
// User asks: "Has this problem happened before?"
const hasHappened = await knowledgeBase.hasHappenedBefore('biz_123', 'prep_delay')
const frequency = await knowledgeBase.getOccurrenceFrequency('biz_123', 'prep_delay')
const evidence = await knowledgeBase.getHistoricalEvidence('biz_123', 'prep_delay')

// AI can now provide informed answer with historical context
```

## Performance

Typical performance metrics:

| Operation | Duration |
|-----------|----------|
| Ingest Report | 150ms |
| Query (simple) | 5ms |
| Query (complex) | 20ms |
| Get Timeline | 10ms |
| Get Insight History | 8ms |
| Export | 100ms |
| Import | 200ms |

## Future Enhancements

- [ ] Persistent storage backends (PostgreSQL, MongoDB)
- [ ] Advanced pattern recognition
- [ ] Predictive analytics based on historical knowledge
- [ ] Cross-business benchmarking
- [ ] Knowledge graph visualization
- [ ] Automated insight correlation
- [ ] ML-based trend prediction

## Related Documentation

- [HIE README](../README.md) - Main intelligence engine
- [Pipeline Documentation](../PIPELINE.md) - Intelligence pipeline
- [Service Intelligence™](../../service-intelligence/README.md) - First consumer

---

**Architecture Status:** ✅ Complete  
**Version:** 1.0.0  
**Last Updated:** 2026-07-14
