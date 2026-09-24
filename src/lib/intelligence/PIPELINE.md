# Intelligence Pipeline Architecture

**Status:** ✅ Complete  
**Version:** 1.0.0

## Overview

The Intelligence Pipeline is the core of the Hospitality Intelligence Engine (HIE). It transforms raw operational events into structured intelligence reports through a deterministic, 6-stage process.

## Core Principle

**HIE produces facts. Applications present those facts. LLMs explain those facts.**

This separation is mandatory. The pipeline generates **structured data only** - NO natural language prose.

## Pipeline Flow

```
Heart Pulse Events
        ↓
Operational Events
        ↓
┌─────────────────────┐
│ 1. Normalization    │ → Clean, validate, prepare
└─────────────────────┘
        ↓
┌─────────────────────┐
│ 2. Analysis         │ → Run all analysis modules
└─────────────────────┘
        ↓
┌─────────────────────┐
│ 3. Scoring          │ → Calculate performance scores
└─────────────────────┘
        ↓
┌─────────────────────┐
│ 4. Explanation      │ → Generate structured explanations
└─────────────────────┘
        ↓
┌─────────────────────┐
│ 5. Recommendation   │ → Generate actionable recommendations
└─────────────────────┘
        ↓
┌─────────────────────┐
│ 6. Publishing       │ → Combine into final report
└─────────────────────┘
        ↓
Structured Intelligence Report
        ↓
┌──────┬───────────┬───────────┬───────────┐
│      │           │           │           │
▼      ▼           ▼           ▼           ▼
Service Daily      Kitchen    Menu        AI
Intel™  Briefings  Intel      Intel       Copilot
```

## Stage Details

### Stage 1: Normalization

**Purpose:** Clean and prepare data for analysis

**Input:** `OperationalEvent[]`

**Output:** `NormalizationOutput`

**Responsibilities:**
- Remove duplicate events
- Validate data integrity
- Resolve relationships (order IDs → order numbers, etc.)
- Sort events by timestamp
- Calculate data quality metrics

**Example:**
```typescript
{
  events: OperationalEvent[],
  normalizedContext: {
    totalEvents: 1247,
    totalOrders: 156,
    uniqueStaff: 8,
    uniqueStations: 5,
    dataQuality: {
      completeness: 0.95,
      consistency: 0.98,
      validity: 1.0
    }
  },
  statistics: {
    originalEventCount: 1250,
    normalizedEventCount: 1247,
    duplicatesRemoved: 3,
    invalidEventsRemoved: 0
  }
}
```

### Stage 2: Analysis

**Purpose:** Run all analysis modules

**Input:** `NormalizationOutput`

**Output:** `AnalysisOutput`

**Modules Executed:**
- Staff Analysis
- Kitchen Analysis
- Customer Journey Analysis
- Pattern Detection
- Problem Detection
- Highlight Detection
- Historical Comparison (if previous data provided)

**Example:**
```typescript
{
  staff: StaffAnalysis,
  kitchen: KitchenAnalysis,
  customerJourney: CustomerJourneyAnalysis,
  patterns: Pattern[],
  problems: Problem[],
  highlights: Highlight[],
  rawMetrics: {
    totalEvents: 1247,
    totalOrders: 156,
    avgJourneyMinutes: 42.3,
    kitchenUtilization: 78
  }
}
```

### Stage 3: Scoring

**Purpose:** Calculate deterministic performance scores

**Input:** `AnalysisOutput`

**Output:** `ScoringOutput`

**Responsibilities:**
- Calculate overall score (0-100)
- Calculate dimension scores
- Determine trend (improving/stable/declining)
- Compare to benchmarks
- Calculate confidence

**Example:**
```typescript
{
  overallScore: {
    overall: 87,
    dimensions: [...],
    trend: 'improving'
  },
  dimensionScores: Map<string, DimensionScore>,
  confidence: 0.92,
  benchmarkComparison: {
    aboveBenchmark: ['prep_time', 'service_time'],
    belowBenchmark: ['kitchen_utilization'],
    atBenchmark: ['completion_rate']
  }
}
```

### Stage 4: Explanation

**Purpose:** Generate structured explanations (NO prose)

**Input:** `{ scoring: ScoringOutput, analysis: AnalysisOutput }`

**Output:** `ExplanationOutput`

**Responsibilities:**
- Create structured explanations for problems
- Create structured explanations for highlights
- Create structured explanations for patterns
- Extract structured insights from scoring
- Build causality graph

**Example:**
```typescript
{
  explanations: [
    {
      id: 'exp_prob_123',
      type: 'problem',
      subject: 'prep_delay',
      issue: '15 orders experienced delays',
      evidence: [...],
      reason: 'Average delay: 180s, Max: 300s',
      confidence: 0.85,
      relatedEvents: ['evt_1', 'evt_2'],
      replayTimestamp: '2026-07-14T12:30:00Z',
      severity: 'high'
    }
  ],
  insights: [
    {
      id: 'insight_prep_time',
      category: 'performance',
      fact: 'Preparation Time: 720 seconds',
      value: 720,
      unit: 'seconds',
      comparison: {
        baseline: 720,
        change: 0,
        changePercent: 0
      },
      confidence: 0.92
    }
  ],
  causality: {
    nodes: [...],
    edges: [...]
  }
}
```

### Stage 5: Recommendation

**Purpose:** Generate actionable recommendations

**Input:** `{ analysis: AnalysisOutput, explanation: ExplanationOutput }`

**Output:** `RecommendationOutput`

**Responsibilities:**
- Generate recommendations from problems
- Generate recommendations from patterns
- Build action plan (immediate/short-term/long-term)
- Build priority matrix (quick wins/major projects/fill-ins/thankless)
- Link to evidence and replay

**Example:**
```typescript
{
  recommendations: [
    {
      id: 'rec_1',
      action: 'Optimize workflow to reduce delays',
      priority: 'high',
      category: 'workflow',
      expectedImpact: {
        description: 'Reduce average order time by 20-30%',
        affectedMetrics: ['prep_time', 'service_time'],
        riskLevel: 'low'
      },
      evidence: [...],
      replayLink: '/dashboard/service-replay?t=...',
      dependencies: ['prob_123'],
      timeframe: 'immediate',
      effort: 'medium',
      confidence: 0.8
    }
  ],
  actionPlan: {
    immediate: ['rec_1', 'rec_3'],
    shortTerm: ['rec_2', 'rec_5'],
    longTerm: ['rec_4']
  },
  priorityMatrix: {
    quickWins: ['rec_1'],
    majorProjects: ['rec_2'],
    fillIns: ['rec_3'],
    thankless: []
  }
}
```

### Stage 6: Publishing

**Purpose:** Combine all outputs into final report

**Input:** All previous stage outputs

**Output:** `StructuredIntelligenceReport`

**Responsibilities:**
- Assemble final report
- Build evidence registry
- Build replay links
- Calculate final confidence metrics
- Generate statistics
- Include diagnostics

## Structured Intelligence Report

The final output is a **fully serializable, structured report**:

```typescript
interface StructuredIntelligenceReport {
  metadata: ReportMetadata
  serviceSummary: ServiceSummary
  overallScore: Score
  dimensionScores: DimensionScore[]
  highlights: Highlight[]
  problems: Problem[]
  rootCauses: StructuredExplanation[]
  patterns: Pattern[]
  staffInsights?: StaffAnalysis
  kitchenInsights?: KitchenAnalysis
  customerJourney?: CustomerJourneyAnalysis
  comparisons?: ComparisonResult
  recommendations: StructuredRecommendation[]
  timeline: CriticalMoment[]
  evidence: EvidenceRegistry
  confidence: ConfidenceMetrics
  replayLinks: ReplayLinks
  statistics: ReportStatistics
  diagnostics: PipelineDiagnostics
}
```

## Usage

### Basic Usage

```typescript
import { createIntelligenceEngineV2 } from '@/lib/intelligence'

const engine = createIntelligenceEngineV2({
  scoring: {
    dimensions: [
      {
        id: 'prep_time',
        name: 'Preparation Time',
        weight: 0.3,
        benchmark: 720,
        unit: 'seconds',
        higherIsBetter: false
      }
    ]
  }
})

const result = await engine.generateReport(
  {
    businessId: 'biz_123',
    timeRange: {
      start: '2026-07-14T11:00:00Z',
      end: '2026-07-14T15:00:00Z',
      label: 'Lunch Service',
      durationMinutes: 240
    },
    timezone: 'Africa/Kigali',
    scope: {
      scoring: true,
      problems: true,
      highlights: true,
      staff: true,
      kitchen: true
    }
  },
  events
)

if (result.success) {
  console.log('Report:', result.report)
}
```

### Serialization

```typescript
// Serialize to JSON
const json = engine.serializeReport(result.report)

// Deserialize from JSON
const report = engine.deserializeReport(json)
```

## Pipeline Context

Shared context passed through all stages:

```typescript
interface PipelineContext {
  businessId: string
  timeRange: TimeRange
  timezone: string
  scope: AnalysisScope
  cache: Map<string, unknown>      // Shared cache
  config: PipelineConfig            // Configuration
  diagnostics: PipelineDiagnostics  // Diagnostics collector
}
```

## Diagnostics

Every stage records execution metrics:

```typescript
interface PipelineDiagnostics {
  startTime: number
  stages: StageExecution[]
  warnings: DiagnosticWarning[]
  errors: DiagnosticError[]
  skippedAnalyses: string[]
  confidenceDegradations: ConfidenceDegradation[]
}
```

Example diagnostics:

```typescript
{
  startTime: 1721000000000,
  stages: [
    {
      stage: 'normalization',
      startTime: 1721000000000,
      endTime: 1721000000050,
      durationMs: 50,
      status: 'success',
      modulesExecuted: ['deduplication', 'validation']
    },
    {
      stage: 'analysis',
      startTime: 1721000000050,
      endTime: 1721000000250,
      durationMs: 200,
      status: 'partial',
      modulesExecuted: ['staff', 'kitchen', 'patterns'],
      warnings: ['Journey analysis failed: insufficient data']
    }
  ],
  warnings: [...],
  errors: [],
  skippedAnalyses: [],
  confidenceDegradations: []
}
```

## Evidence Traceability

Every insight includes evidence:

```typescript
{
  id: 'prob_123',
  type: 'prep_delay',
  evidence: [
    { type: 'event', id: 'evt_1', timestamp: '...' },
    { type: 'order', id: 'ord_1' },
    { type: 'aggregate', id: 'delay_summary', description: '...' }
  ]
}
```

Evidence registry provides fast lookup:

```typescript
{
  events: Map<string, OperationalEvent>,
  eventsByOrder: Map<string, string[]>,
  eventsByStaff: Map<string, string[]>,
  eventsByStation: Map<string, string[]>,
  totalEvidence: 1247
}
```

## Replay Integration

Every insight links to Service Replay™:

```typescript
{
  replayLinks: {
    fullPeriod: '/dashboard/service-replay?start=...&end=...',
    problems: Map<string, string>,
    highlights: Map<string, string>,
    criticalMoments: Map<string, string>
  }
}
```

## AI Independence

**CRITICAL:** The pipeline does NOT depend on any LLM.

Future LLM integration:

```
HIE Pipeline
     ↓
Structured Intelligence Report
     ↓
Optional LLM (presentation layer)
     ↓
Natural Language Summary
     ↓
User
```

The LLM is a **presentation layer**, never the reasoning layer.

## Extensibility

### Adding a New Stage

```typescript
class MyCustomStage implements IPipelineStage<InputType, OutputType> {
  name = 'my_stage' as const

  async execute(
    input: InputType,
    context: PipelineContext
  ): Promise<StageResult<OutputType>> {
    // Your logic
    return { success: true, data: output }
  }
}
```

### Custom Pipeline

```typescript
const pipeline = createPipeline()
  .withNormalizationStage(new NormalizationStage())
  .withAnalysisStage(new AnalysisStage(...))
  .withScoringStage(new ScoringStage(...))
  .withExplanationStage(new ExplanationStage(...))
  .withRecommendationStage(new RecommendationStage(...))
  .withPublishingStage(new PublishingStage())
  .build()
```

## Performance

Typical performance metrics:

| Stage | Duration | % of Total |
|-------|----------|------------|
| Normalization | 50ms | 10% |
| Analysis | 200ms | 40% |
| Scoring | 50ms | 10% |
| Explanation | 100ms | 20% |
| Recommendation | 50ms | 10% |
| Publishing | 50ms | 10% |
| **Total** | **500ms** | **100%** |

## Future Enhancements

- [ ] Streaming pipeline for real-time analysis
- [ ] Parallel stage execution where possible
- [ ] ML-based anomaly detection stage
- [ ] Predictive analytics stage
- [ ] Forecast stage
- [ ] Risk assessment stage
- [ ] Benchmark stage (industry comparisons)

## Related Documentation

- [HIE README](./README.md) - Main documentation
- [Types Documentation](./types.ts) - Core types
- [Service Intelligence™](../service-intelligence/README.md) - First consumer

---

**Architecture Status:** ✅ Complete  
**Version:** 1.0.0  
**Last Updated:** 2026-07-14
