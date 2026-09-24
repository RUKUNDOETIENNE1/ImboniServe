# Hospitality Intelligence Engine (HIE)

**Domain-agnostic intelligence platform for hospitality operations.**

## Overview

The Hospitality Intelligence Engine (HIE) is a modular, reusable intelligence platform designed to analyze operational data and generate actionable insights. It is **not** coupled to any specific feature—instead, it serves as the foundation for multiple intelligence capabilities.

### Design Principles

1. **Domain-Agnostic**: Works with any operational event stream, not tied to specific business logic
2. **Pluggable Architecture**: All analysis modules can be configured, extended, or replaced
3. **Evidence-Based**: Every insight is traceable back to raw events via Service Replay™
4. **Consumer-Driven**: Multiple features can consume the same engine without architectural changes

## Architecture

```
lib/intelligence/
├── types.ts              // Core type definitions (domain-agnostic)
├── engine.ts             // Main orchestrator
├── evidence.ts           // Evidence collection & replay linking
├── scoring.ts            // Pluggable scoring system
├── highlights.ts         // Positive insight detection
├── problems.ts           // Problem detection framework
├── root-causes.ts        // Root cause analysis
├── recommendations.ts    // Recommendation engine
├── patterns.ts           // Pattern detection
├── comparisons.ts        // Historical comparisons
├── staff.ts              // Staff intelligence
├── kitchen.ts            // Kitchen intelligence
├── customer-journey.ts   // Customer journey analysis
└── index.ts              // Public API
```

## Consumers

The HIE is designed to be consumed by multiple features:

### 1. **Service Intelligence™** (First Consumer)
Real-time operational intelligence for service periods.
- **Scope**: Single service period analysis (lunch, dinner)
- **Focus**: Immediate operational insights
- **Output**: Service Intelligence Report

### 2. **Daily Briefings** (Planned)
End-of-day summaries for managers.
- **Scope**: Full day analysis
- **Focus**: Daily performance summary
- **Output**: Daily Briefing Report

### 3. **Kitchen Intelligence** (Planned)
Kitchen-specific performance analysis.
- **Scope**: Kitchen operations only
- **Focus**: Station efficiency, prep times, queue management
- **Output**: Kitchen Performance Report

### 4. **Menu Intelligence** (Planned)
Menu item performance and optimization.
- **Scope**: Menu-level analysis
- **Focus**: Item popularity, profitability, prep efficiency
- **Output**: Menu Optimization Report

### 5. **Multi-location Intelligence** (Planned)
Cross-venue performance comparison.
- **Scope**: Multiple locations
- **Focus**: Comparative analysis, best practices
- **Output**: Multi-location Comparison Report

### 6. **AI Copilot** (Planned)
Conversational intelligence interface.
- **Scope**: On-demand queries
- **Focus**: Natural language insights
- **Output**: Conversational responses

## Core Concepts

### Operational Events

The engine consumes **OperationalEvent** objects—a normalized abstraction over Heart Pulse events:

```typescript
interface OperationalEvent {
  id: string
  timestamp: string
  type: string
  category: string
  orderId?: string
  staffId?: string
  stationId?: string
  data?: Record<string, unknown>
}
```

### Intelligence Report

The engine produces **IntelligenceReport** objects:

```typescript
interface IntelligenceReport {
  id: string
  businessId: string
  timeRange: TimeRange
  score?: Score
  highlights?: Highlight[]
  problems?: Problem[]
  recommendations?: Recommendation[]
  patterns?: Pattern[]
  staffAnalysis?: StaffAnalysis
  kitchenAnalysis?: KitchenAnalysis
  customerJourneyAnalysis?: CustomerJourneyAnalysis
  comparison?: ComparisonResult
  metadata: ReportMetadata
}
```

### Analysis Scope

Consumers can request only the analysis they need:

```typescript
const scope: AnalysisScope = {
  scoring: true,
  problems: true,
  highlights: true,
  rootCauses: false,  // Skip root cause analysis
  recommendations: true,
  patterns: false,    // Skip pattern detection
  staff: true,
  kitchen: true,
  customerJourney: false,
  comparisons: false,
}
```

## Usage Example

### Basic Usage

```typescript
import { 
  createIntelligenceEngine,
  ScoringEngine,
  ProblemDetectionEngine,
  HighlightDetectionEngine,
  StaffAnalyzer,
  KitchenAnalyzer,
} from '@/lib/intelligence'

// Create and configure the engine
const engine = createIntelligenceEngine({
  scoring: {
    dimensions: [
      {
        id: 'prep_time',
        name: 'Preparation Time',
        weight: 0.3,
        benchmark: 720, // 12 minutes
        unit: 'seconds',
        description: 'Average order preparation time',
        higherIsBetter: false,
      },
      // ... more dimensions
    ],
  },
})

// Register modules
const scoringEngine = new ScoringEngine(config.scoring)
scoringEngine.registerCalculator('prep_time', new AverageTimeCalculator('preparing', 'ready'))
engine.setScoringEngine(scoringEngine)

const problemEngine = new ProblemDetectionEngine()
problemEngine.registerDetector(new DelayDetector('preparing', 'ready', 900, 'prep_delay'))
engine.setProblemDetectionEngine(problemEngine)

engine.setStaffAnalyzer(new StaffAnalyzer())
engine.setKitchenAnalyzer(new KitchenAnalyzer())

// Run analysis
const context: IntelligenceContext = {
  businessId: 'biz_123',
  timeRange: {
    start: '2026-07-14T11:00:00Z',
    end: '2026-07-14T15:00:00Z',
    label: 'Lunch Service',
    durationMinutes: 240,
  },
  timezone: 'Africa/Kigali',
  scope: {
    scoring: true,
    problems: true,
    highlights: true,
    staff: true,
    kitchen: true,
  },
}

const result = await engine.analyze(context, events)

if (result.success) {
  console.log('Report:', result.data)
} else {
  console.error('Analysis failed:', result.error)
}
```

### Custom Detectors

```typescript
// Custom problem detector
const customDetector: ProblemDetector = {
  id: 'custom_detector',
  name: 'Custom Problem Detector',
  async detect(events, context) {
    // Your custom logic
    return problems
  },
}

problemEngine.registerDetector(customDetector)
```

### Plugin System

```typescript
// Custom plugin for domain-specific analysis
const myPlugin: IntelligencePlugin = {
  id: 'my_plugin',
  name: 'My Custom Plugin',
  version: '1.0.0',
  async analyze(context, events, partialReport) {
    // Add custom analysis
    return {
      ...partialReport,
      customData: myCustomAnalysis(events),
    }
  },
}

engine.registerPlugin(myPlugin)
```

## Module Details

### Scoring Module
- **Purpose**: Calculate operational performance scores
- **Pluggable**: Custom calculators for any metric
- **Output**: Overall score (0-100), grade (A+ to F), dimension breakdown

### Problem Detection Module
- **Purpose**: Identify operational issues
- **Extensible**: Register custom detectors
- **Output**: Problems with severity, impact, and evidence

### Highlight Detection Module
- **Purpose**: Identify positive achievements
- **Extensible**: Register custom detectors
- **Output**: Highlights with confidence scores

### Root Cause Analysis Module
- **Purpose**: Analyze problems to find root causes
- **Extensible**: Custom analyzers per problem type
- **Output**: Root causes with contributing factors

### Recommendation Module
- **Purpose**: Generate actionable recommendations
- **Rule-Based**: Problem-based and pattern-based rules
- **Output**: Prioritized, actionable recommendations

### Pattern Detection Module
- **Purpose**: Detect recurring patterns
- **Types**: Temporal, behavioral, operational, demand
- **Output**: Patterns with frequency and trend

### Comparison Module
- **Purpose**: Compare with historical periods
- **Flexible**: Custom metric calculators
- **Output**: Metrics with change percentages and trends

### Staff Analysis Module
- **Purpose**: Analyze staff performance
- **Metrics**: Efficiency, workload, response times
- **Output**: Staff metrics, workload distribution

### Kitchen Analysis Module
- **Purpose**: Analyze kitchen operations
- **Metrics**: Utilization, queue, prep times
- **Output**: Station metrics, peak load, recovery events

### Customer Journey Module
- **Purpose**: Analyze customer experience
- **Stages**: Arrival → Ordering → Prep → Serving → Payment → Completion
- **Output**: Stage durations, bottlenecks

## Evidence & Replay Integration

Every insight includes evidence that links back to Service Replay™:

```typescript
const problem: Problem = {
  id: 'prob_123',
  type: 'prep_delay',
  severity: 'high',
  title: '15 orders experienced delays',
  evidence: [
    { type: 'event', id: 'evt_1', timestamp: '...' },
    { type: 'order', id: 'ord_1' },
    { type: 'aggregate', id: 'delay_summary', description: '...' },
  ],
}
```

The `ReplayLinkGenerator` creates clickable links:

```typescript
const linkGen = new ReplayLinkGenerator()
const link = linkGen.generateTimestampLink(problem.evidence[0].timestamp, businessId)
// → /dashboard/service-replay?t=2026-07-14T12:30:00Z&business=biz_123
```

## Extending the Engine

### Adding a New Analysis Module

1. **Create the module file** (e.g., `menu-intelligence.ts`)
2. **Define the analyzer class**
3. **Add types to `types.ts`**
4. **Register in engine** via setter method
5. **Export from `index.ts`**

### Adding a New Detector

```typescript
class MyDetector implements ProblemDetector {
  id = 'my_detector'
  name = 'My Detector'
  
  async detect(events: OperationalEvent[], context: DetectionContext): Promise<Problem[]> {
    // Your detection logic
    return []
  }
}

problemEngine.registerDetector(new MyDetector())
```

## Performance Considerations

- **Lazy Loading**: Only run requested analysis modules
- **Streaming**: Support for streaming results (future)
- **Caching**: Report caching at consumer level
- **Pagination**: Event pagination for large datasets

## Testing Strategy

1. **Unit Tests**: Each module independently
2. **Integration Tests**: Full engine with mock events
3. **Consumer Tests**: Each consumer's specific configuration
4. **Performance Tests**: Large event datasets

## Future Enhancements

- [ ] Streaming analysis for real-time insights
- [ ] ML-based anomaly detection
- [ ] Predictive analytics
- [ ] Multi-language support
- [ ] Custom visualization adapters
- [ ] Export to multiple formats (PDF, Excel, etc.)

## Related Documentation

- [Service Intelligence™](../service-intelligence/README.md) - First consumer
- [Service Replay™](../service-replay/README.md) - Evidence source
- [Heart Pulse](../heart-pulse/README.md) - Event source

---

**Architecture Status**: ✅ Complete  
**First Consumer**: Service Intelligence™ (In Development)  
**Version**: 1.0.0
