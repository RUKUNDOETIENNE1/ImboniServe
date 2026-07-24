# Service Intelligence™ Architecture

## Mission
Transform operational service events into actionable intelligence for restaurant managers.

## Platform Reuse Strategy

Service Intelligence™ is built on the existing Hospitality Intelligence Platform:

### Reused Components
- **Heart Pulse** - Real-time operational event stream
- **TicketEvent** - Append-only event log
- **ReplayEvent** - Service replay data source
- **Hospitality Intelligence Engine (HIE)** - Intelligence pipeline
- **Institutional Knowledge Base (IKB)** - Historical intelligence storage
- **Daily Briefings Infrastructure** - Aggregation patterns, service layer, dashboard builder

### New Components
- **Service Metrics Aggregator** - Service-specific metric calculation
- **Service Intelligence Dashboard** - Service-focused UI
- **Service Intelligence API** - Service-specific endpoints

## Domain Model

### Service Metrics
```typescript
interface ServiceMetrics {
  // Duration Metrics
  avgServiceDuration: number
  avgWaitTime: number
  avgPreparationTime: number
  avgPaymentTime: number
  
  // Performance Metrics
  orderThroughput: number
  completionRate: number
  cancellationRate: number
  
  // Staff Metrics
  waiterPerformance: WaiterMetrics[]
  stationBottlenecks: StationMetrics[]
  
  // Customer Journey
  customerFlowPatterns: FlowPattern[]
  peakServicePeriods: PeakPeriod[]
  
  // Quality Indicators
  serviceQualityScore: number
  operationalEfficiency: number
}
```

### Service Intelligence Report
```typescript
interface ServiceIntelligenceReport {
  id: string
  businessId: string
  reportingPeriod: TimeRange
  
  // Core Metrics
  metrics: ServiceMetrics
  
  // Insights
  insights: ServiceInsight[]
  bottlenecks: ServiceBottleneck[]
  improvements: ServiceImprovement[]
  
  // Trends
  trends: ServiceTrend[]
  comparisons: ServiceComparison[]
  
  // Evidence
  evidenceRegistry: Record<string, Evidence>
  confidence: number
}
```

## Data Flow

```
TicketEvent (Database)
    ↓
ReplayEvent (Service Replay)
    ↓
Service Metrics Aggregator
    ↓
Hospitality Intelligence Engine
    ↓
Service Intelligence Report
    ↓
Service Intelligence Dashboard
```

## Integration Points

### 1. Event Source
- **Source:** ReplayEvent table (populated from TicketEvent)
- **Filter:** Service-related event types (ORDER_CREATED, PAYMENT_CONFIRMED, KITCHEN_STATUS_CHANGED)
- **Reuse:** `getOperationalEvents()` from integration-helper

### 2. Intelligence Generation
- **Pipeline:** Existing HIE pipeline
- **Stages:** Normalization → Analysis → Scoring → Explanation → Recommendation → Publishing
- **Reuse:** `createPipeline().build().execute()`

### 3. Aggregation
- **Pattern:** Same as Daily Briefings
- **Service:** ServiceIntelligenceService (similar to DailyBriefingService)
- **Builder:** ServiceDashboardBuilder (similar to DashboardBuilder)

### 4. Storage
- **Cache:** IntelligenceReport table (type: 'service_intelligence')
- **Knowledge:** IKB ingestion for historical learning
- **Reuse:** `cacheReport()`, `getCachedReport()`

## Implementation Phases

### Phase 1: Service Metrics Aggregator
- Extract service-specific metrics from ReplayEvents
- Calculate duration, throughput, quality metrics
- Identify bottlenecks and patterns

### Phase 2: Service Intelligence Service
- Integrate with HIE pipeline
- Generate service intelligence reports
- Cache and retrieve reports

### Phase 3: Service Intelligence Dashboard
- Build UI components for service metrics
- Visualize bottlenecks, trends, staff performance
- Provide actionable insights

### Phase 4: API Integration
- Create service intelligence endpoints
- Enable real-time service monitoring
- Support historical analysis

## Deliverables

1. **Domain Model** - Service metrics types
2. **Aggregator** - Service metrics calculation
3. **Service Layer** - ServiceIntelligenceService
4. **Dashboard** - Service Intelligence UI
5. **API** - Service intelligence endpoints
6. **Tests** - Runtime validation
7. **Documentation** - Usage guide

## Success Criteria

- ✅ Service metrics calculated from operational events
- ✅ Intelligence reports generated
- ✅ Dashboard renders service insights
- ✅ Bottlenecks identified
- ✅ Staff performance tracked
- ✅ Historical trends analyzed
- ✅ No runtime exceptions
- ✅ End-to-end validation complete
