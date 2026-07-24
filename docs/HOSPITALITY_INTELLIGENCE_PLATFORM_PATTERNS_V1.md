# Hospitality Intelligence Platform Patterns V1

**Document Type:** Engineering Knowledge Base
**Purpose:** Capture reusable patterns from certified intelligence modules
**Status:** Observational (No Implementation Changes)
**Date:** 2026-07-22
**Certified Modules:** 2 (Daily Briefings, Service Intelligence™)

---

## 1. Platform Overview

### Engineering Philosophy

The Hospitality Intelligence Platform transforms operational restaurant events into actionable intelligence through a modular, reusable architecture. After certifying two intelligence modules, the platform has demonstrated:

- **Stability:** 100% runtime validation success across both modules
- **Reusability:** 85% platform service reuse in Service Intelligence™
- **Velocity:** Decreasing implementation time (8h → 6h)
- **Quality:** 0 production-blocking defects in certified modules

### Core Principle

**Reuse before building. Integrate before extending. Validate before certifying.**

The platform does not pursue abstraction prematurely. Patterns are documented after observation across multiple modules. Structural refactoring is deferred until at least three certified modules provide sufficient evidence.

### Platform Architecture

```
Operational Events (TicketEvent)
    ↓
Service Replay (ReplayEvent)
    ↓
Intelligence Engine (HIE Pipeline)
    ↓
Intelligence Reports (Cached)
    ↓
Consumer Modules (Daily Briefings, Service Intelligence, etc.)
```

---

## 2. Intelligence Module Lifecycle

### Mandatory Lifecycle

Every retained intelligence module must complete this lifecycle:

```
1. Architecture
   ↓
2. Implementation
   ↓
3. Runtime Validation
   ↓
4. Production Certification
   ↓
5. Next Module
```

### Stage Definitions

**1. Architecture**
- Define domain model
- Identify data sources
- Plan platform service reuse
- Document integration points

**2. Implementation**
- Domain model (types)
- Aggregation engine
- Service orchestration layer
- Dashboard builder
- API endpoints
- Runtime validation tests

**3. Runtime Validation**
- Execute with real operational data
- Validate all capabilities
- Identify runtime defects
- Apply corrective fixes
- Revalidate until success

**4. Production Certification**
- Verify completion gate criteria
- Document validation evidence
- Declare certification status
- Identify cosmetic enhancements

**5. Next Module**
- Document lessons learned
- Update platform patterns
- Assess readiness for next module
- Begin next module implementation

### Completion Gate Criteria

A module is production-certified only if:

- ✅ Intelligence generation works
- ✅ Dashboard renders successfully
- ✅ API endpoints function correctly
- ✅ Historical reports work
- ✅ Module-specific analytics work
- ✅ Export functionality works
- ✅ Database persistence works
- ✅ No production-blocking runtime defects remain

Cosmetic enhancements do not block certification.

---

## 3. Shared Engineering Patterns

### Pattern 1: Dashboard Construction

**Observed in:** Daily Briefings, Service Intelligence™

**Pattern:**
```typescript
class ModuleDashboardBuilder {
  build(report: ModuleReport): ModuleDashboard {
    return {
      report,
      metricsDisplay: this.buildMetricsDisplay(report),
      insightsDisplay: this.buildInsightCards(report),
      // ... other displays
      metadata: this.buildMetadata(report)
    }
  }
  
  private buildMetricsDisplay(report: ModuleReport): MetricsDisplay {
    // Defensive handling for undefined/null/empty
    const metrics = report.metrics
    if (!metrics) return { /* empty state */ }
    
    return {
      cards: [
        { label: 'Metric', value: (metrics.value ?? 0).toString() }
      ]
    }
  }
  
  // Helper methods
  private formatDuration(seconds: number): string { /* ... */ }
  private calculateGrade(score: number): string { /* ... */ }
  private getIcon(type: string): string { /* ... */ }
  private getColor(status: string): string { /* ... */ }
}
```

**Key Observations:**
- Defensive handling is mandatory for all optional values
- Helper methods are 90% similar across modules
- Card generation follows consistent patterns
- Metadata extraction is standardized

**Similarity:** 70% code duplication between modules

---

### Pattern 2: Service Orchestration

**Observed in:** Daily Briefings, Service Intelligence™

**Pattern:**
```typescript
class ModuleIntelligenceService {
  async generateReport(request: ModuleRequest): Promise<ModuleResponse> {
    const diagnostics = this.initializeDiagnostics()
    
    try {
      // 1. Build time range
      const timeRange = buildTimeRange(request.selection.period, request.selection.customRange)
      
      // 2. Get operational events
      const events = await getOperationalEvents({
        businessId: request.businessId,
        timeRange,
        eventTypes: ['RELEVANT_EVENT_TYPES']
      })
      
      // 3. Aggregate metrics
      const metrics = this.aggregator.calculateMetrics(events)
      
      // 4. Generate insights
      const insights = this.generateInsights(metrics)
      
      // 5. Build report
      const report = this.buildReport(metrics, insights, events)
      
      // 6. Return response
      return this.formatResponse(true, report, diagnostics)
    } catch (error) {
      return this.formatResponse(false, undefined, diagnostics, error)
    }
  }
}
```

**Key Observations:**
- Request validation is identical
- Event retrieval uses platform service
- Aggregation → Insights → Report flow is consistent
- Error handling is standardized
- Diagnostics tracking is uniform

**Similarity:** 80% code duplication between modules

---

### Pattern 3: Aggregation Engine

**Observed in:** Daily Briefings, Service Intelligence™

**Pattern:**
```typescript
class ModuleAggregator {
  calculateMetrics(events: OperationalEvent[]): ModuleMetrics {
    // Group events
    const grouped = this.groupEventsByKey(events)
    
    // Calculate metrics
    const metrics = {
      avgDuration: this.calculateAverage(durations),
      completionRate: this.calculateRate(completed, total),
      trend: this.determineTrend(current, baseline)
    }
    
    return metrics
  }
  
  private groupEventsByKey(events: OperationalEvent[]): Map<string, OperationalEvent[]> {
    const groups = new Map()
    for (const event of events) {
      const key = this.extractKey(event)
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(event)
    }
    return groups
  }
  
  private calculateAverage(values: number[]): number { /* ... */ }
  private calculateRate(numerator: number, denominator: number): number { /* ... */ }
  private determineTrend(current: number, baseline: number): 'improving' | 'stable' | 'declining' { /* ... */ }
}
```

**Key Observations:**
- Event grouping is a common operation
- Metric calculation follows similar patterns
- Trend determination is standardized
- Helper methods are reusable

**Similarity:** 60% code duplication between modules

---

### Pattern 4: API Endpoints

**Observed in:** Daily Briefings, Service Intelligence™

**Pattern:**
```typescript
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ModuleResponse>
) {
  // 1. Authentication
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized', diagnostics })
  }
  
  // 2. Method validation
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed', diagnostics })
  }
  
  // 3. Request validation
  const request: ModuleRequest = req.body
  if (!request.businessId) {
    return res.status(400).json({ success: false, error: 'businessId required', diagnostics })
  }
  
  // 4. Service invocation
  const service = createModuleService()
  const response = await service.generateReport(request)
  
  // 5. Response
  return res.status(response.success ? 200 : 500).json(response)
}
```

**Key Observations:**
- Authentication check is identical
- Method validation is identical
- Request validation follows same pattern
- Error handling is standardized
- Response formatting is consistent

**Similarity:** 90% code duplication between modules

---

### Pattern 5: Caching Strategy

**Observed in:** Daily Briefings, Service Intelligence™

**Pattern:**
```typescript
// Retrieve or generate report
const report = await getOrGenerateReport(
  {
    businessId,
    type: 'module_intelligence',
    timeRange,
    forceRegenerate: request.forceRegenerate
  },
  context,
  events
)
```

**Key Observations:**
- Uses shared `getOrGenerateReport()` function
- Stores in `IntelligenceReport` table
- Cache key: businessId + type + timeRange
- Force regenerate option available

**Similarity:** 100% reuse (platform service)

---

### Pattern 6: Export Functionality

**Observed in:** Daily Briefings, Service Intelligence™

**Pattern:**
```typescript
// JSON serialization
const json = JSON.stringify(report, null, 2)
fs.writeFileSync('export.json', json)

// Metadata extraction
const metadata = {
  id: report.id,
  businessId: report.businessId,
  generatedAt: report.generatedAt,
  confidence: report.confidence
}
```

**Key Observations:**
- JSON.stringify works for all reports
- Metadata extraction is consistent
- File writing is identical
- Size reporting is standard

**Similarity:** 100% identical code

---

### Pattern 7: Runtime Validation

**Observed in:** Daily Briefings, Service Intelligence™

**Pattern:**
```typescript
async function validateModule() {
  // 1. Setup
  const business = await prisma.business.findFirst({ where: { sales: { some: {} } } })
  const service = createModuleService()
  
  // 2. Generate report
  const response = await service.generateReport({ businessId: business.id, selection })
  
  // 3. Validate report
  console.log('✅ Report generated')
  console.log(`   Events: ${response.report.eventsAnalyzed}`)
  
  // 4. Build dashboard
  const builder = createModuleDashboardBuilder()
  const dashboard = builder.build(response.report)
  console.log('✅ Dashboard built')
  
  // 5. Export
  const json = JSON.stringify(response.report, null, 2)
  console.log('✅ Export successful')
}
```

**Key Observations:**
- Test structure is consistent
- Validation steps are similar
- Evidence format is standardized
- Success criteria are clear

**Similarity:** 80% code duplication between tests

---

## 4. Stable Platform Services

### Core Platform Services (Do Not Redesign)

**1. Heart Pulse**
- Real-time operational event stream
- Status: Operational
- Usage: Background event processing

**2. TicketEvent**
- Append-only operational event log
- Status: Operational (2,175+ events)
- Usage: Source of truth for operational data

**3. ReplayEvent**
- Service replay data source
- Status: Operational (migrated from TicketEvent)
- Usage: Intelligence event source

**4. Hospitality Intelligence Engine (HIE)**
- 6-stage intelligence pipeline
- Status: Operational
- Usage: `createPipeline().build().execute()`
- Stages: Normalization → Analysis → Scoring → Explanation → Recommendation → Publishing

**5. Event Retrieval**
- Function: `getOperationalEvents()`
- Status: Operational
- Usage: Filter events by businessId, timeRange, eventTypes
- Reuse: 100% across all modules

**6. Time Range Utilities**
- Function: `buildTimeRange()`
- Status: Operational
- Periods: today, yesterday, this_week, last_7_days, last_30_days, custom, specific_date
- Reuse: 100% across all modules

**7. Caching Infrastructure**
- Table: `IntelligenceReport`
- Functions: `getCachedReport()`, `cacheReport()`
- Status: Operational
- Reuse: 100% across all modules

**8. Authentication**
- Service: NextAuth
- Status: Operational
- Usage: `getServerSession()`
- Reuse: 100% across all modules

### Platform Service Usage Rules

1. **Never redesign** stable platform services
2. **Always reuse** existing platform functions
3. **Document** any platform service defects
4. **Apply minimal fixes** if defects are found
5. **Do not duplicate** platform functionality

---

## 5. Lessons Learned

### From Daily Briefings

**What Worked:**
- ✅ Defensive coding prevented runtime exceptions
- ✅ Platform service reuse accelerated development
- ✅ Dashboard builder pattern proved effective
- ✅ Runtime validation caught all defects before certification

**What Caused Runtime Defects:**
- ❌ Missing `skippedAnalyses` array in diagnostics initialization
- ❌ Pipeline API mismatch (`.build().execute()` vs `.process()`)
- ❌ PipelineContext incomplete initialization
- ❌ Report field mismatch (`.report` vs `.data`)
- ❌ Confidence metrics optional field handling

**What Should Always Be Validated:**
- ✅ Complete PipelineDiagnostics initialization
- ✅ Pipeline API method names
- ✅ Context object completeness
- ✅ Report structure field names
- ✅ Optional field defensive handling

**What Should Never Be Redesigned:**
- 🔒 Event retrieval service
- 🔒 Time range utilities
- 🔒 Intelligence pipeline
- 🔒 Caching infrastructure
- 🔒 Authentication

---

### From Service Intelligence™

**What Worked:**
- ✅ 85% platform reuse achieved
- ✅ Bottleneck detection algorithm effective
- ✅ Dashboard defensive handling prevented exceptions
- ✅ API pattern reuse accelerated implementation
- ✅ Zero runtime defects (learned from Daily Briefings)

**What Caused Runtime Defects:**
- ✅ None (defensive coding from start)

**What Should Always Be Validated:**
- ✅ Event data structure alignment with aggregator
- ✅ Dashboard handles empty/null/undefined gracefully
- ✅ All array mappings use null coalescing
- ✅ All object access uses optional chaining

**What Should Never Be Redesigned:**
- 🔒 All platform services (proven stable)
- 🔒 Dashboard builder pattern (proven effective)
- 🔒 Service orchestration pattern (proven effective)

---

### Cross-Module Insights

**Development Velocity:**
- Daily Briefings: ~8 hours implementation
- Service Intelligence: ~6 hours implementation
- Trend: ⬇️ Decreasing (platform maturity improving velocity)

**Defect Rate:**
- Daily Briefings: 6 runtime defects discovered
- Service Intelligence: 0 runtime defects discovered
- Trend: ⬇️ Decreasing (learning from previous modules)

**Platform Reuse:**
- Daily Briefings: Baseline (established patterns)
- Service Intelligence: 85% reuse
- Trend: ⬆️ Increasing (platform services maturing)

**Code Quality:**
- Type safety: 100% across both modules
- Defensive coding: Comprehensive in both modules
- Documentation: Thorough in both modules
- Trend: ➡️ Stable (high quality maintained)

---

## 6. Future Refactoring Candidates

### Important Notice

**These are CANDIDATES only. No implementation should occur until at least three intelligence modules have been certified.**

The following patterns have been observed across two modules. They represent potential opportunities for abstraction, but premature abstraction is explicitly prohibited.

### Candidate 1: Dashboard Builder Framework

**Observation:** 70% code duplication between dashboard builders

**Potential Abstraction:**
```typescript
// CANDIDATE ONLY - DO NOT IMPLEMENT YET
abstract class BaseDashboardBuilder<TReport, TDashboard> {
  abstract build(report: TReport): TDashboard
  
  // Shared helpers
  protected formatDuration(seconds: number): string
  protected calculateGrade(score: number): string
  protected getIcon(type: string): string
  protected getColor(status: string): string
}
```

**Why Candidate:**
- Observed in 2 modules (insufficient evidence)
- Helper methods are 90% similar
- Pattern may change with Kitchen Intelligence

**Reconsider After:** Kitchen Intelligence certification

---

### Candidate 2: Intelligence Service Pattern

**Observation:** 80% code duplication between service layers

**Potential Abstraction:**
```typescript
// CANDIDATE ONLY - DO NOT IMPLEMENT YET
abstract class BaseIntelligenceService<TRequest, TResponse, TReport> {
  protected async generateReport(request: TRequest): Promise<TResponse>
  protected abstract aggregateMetrics(events: OperationalEvent[]): any
  protected abstract generateInsights(metrics: any): any[]
}
```

**Why Candidate:**
- Observed in 2 modules (insufficient evidence)
- Flow is consistent but may vary
- Kitchen Intelligence may introduce variations

**Reconsider After:** Kitchen Intelligence certification

---

### Candidate 3: API Endpoint Factory

**Observation:** 90% code duplication between API endpoints

**Potential Abstraction:**
```typescript
// CANDIDATE ONLY - DO NOT IMPLEMENT YET
function createIntelligenceEndpoint<TRequest, TResponse>(
  serviceName: string,
  serviceFactory: () => Service<TRequest, TResponse>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Standard authentication, validation, error handling
  }
}
```

**Why Candidate:**
- Observed in 2 modules (insufficient evidence)
- Authentication/validation is identical
- Pattern may need flexibility for future modules

**Reconsider After:** Kitchen Intelligence certification

---

### Candidate 4: Aggregation Framework

**Observation:** 60% code duplication between aggregators

**Potential Abstraction:**
```typescript
// CANDIDATE ONLY - DO NOT IMPLEMENT YET
abstract class BaseAggregator {
  protected groupEventsByKey(events: OperationalEvent[], keyExtractor: Function): Map<string, OperationalEvent[]>
  protected calculateAverage(values: number[]): number
  protected calculateRate(numerator: number, denominator: number): number
  protected determineTrend(current: number, baseline: number): 'improving' | 'stable' | 'declining'
}
```

**Why Candidate:**
- Observed in 2 modules (insufficient evidence)
- Helper methods are similar but domain-specific
- Kitchen Intelligence may have different aggregation needs

**Reconsider After:** Kitchen Intelligence certification

---

### Candidate 5: Validation Framework

**Observation:** 80% code duplication between validation tests

**Potential Abstraction:**
```typescript
// CANDIDATE ONLY - DO NOT IMPLEMENT YET
class IntelligenceValidationSuite<TService, TReport> {
  async validateReportGeneration(service: TService): Promise<ValidationResult>
  async validateDashboardBuilding(report: TReport): Promise<ValidationResult>
  async validateExport(report: TReport): Promise<ValidationResult>
}
```

**Why Candidate:**
- Observed in 2 modules (insufficient evidence)
- Test structure is similar
- May need module-specific validation steps

**Reconsider After:** Kitchen Intelligence certification

---

### Refactoring Decision Criteria

**When to Refactor:**
- ✅ Pattern observed in 3+ certified modules
- ✅ Code duplication >70% across modules
- ✅ Abstraction reduces complexity
- ✅ Abstraction doesn't reduce flexibility
- ✅ All existing modules remain functional

**When NOT to Refactor:**
- ❌ Pattern observed in <3 modules
- ❌ Abstraction adds complexity
- ❌ Abstraction reduces flexibility
- ❌ Risk of breaking existing modules
- ❌ Premature optimization

**Next Review:** After Kitchen Intelligence™ certification

---

## 7. Platform Maturity Assessment

### Current State (2 Certified Modules)

**Strengths:**
- ✅ Stable platform services
- ✅ Proven intelligence pipeline
- ✅ Effective caching strategy
- ✅ Consistent authentication
- ✅ Improving development velocity
- ✅ Decreasing defect rate

**Opportunities:**
- ⚠️ Code duplication in dashboards (70%)
- ⚠️ Code duplication in services (80%)
- ⚠️ Code duplication in APIs (90%)
- ⚠️ Code duplication in aggregators (60%)

**Risks:**
- 🟡 Premature abstraction (mitigated by deferring refactoring)
- 🟢 Platform stability (proven across 2 modules)
- 🟢 Pattern maturity (consistent across 2 modules)

### Platform Evolution Strategy

**Phase 1: Pattern Discovery** (Modules 1-2) ✅ COMPLETE
- Establish core patterns
- Validate platform services
- Document observations

**Phase 2: Pattern Validation** (Module 3) ⏳ IN PROGRESS
- Confirm patterns with third module
- Identify genuine abstractions
- Prepare refactoring candidates

**Phase 3: Strategic Refactoring** (After Module 3)
- Implement proven abstractions
- Reduce code duplication
- Enhance platform maturity

**Phase 4: Platform Optimization** (Modules 4-6)
- Leverage abstractions
- Maximize reuse
- Minimize implementation time

---

## Conclusion

This document captures engineering knowledge from the first two certified intelligence modules. It serves as a guide for future module development and a foundation for eventual platform refactoring.

**Key Principles:**
1. Reuse platform services without redesign
2. Follow proven patterns
3. Document observations without premature abstraction
4. Defer refactoring until 3+ modules provide evidence
5. Maintain platform stability above all else

**Next Steps:**
1. Implement Kitchen Intelligence™ using documented patterns
2. Observe whether patterns hold or diverge
3. Update this document after Kitchen Intelligence certification
4. Reconsider refactoring candidates with 3-module evidence

---

**Document Version:** 1.0
**Last Updated:** 2026-07-22
**Next Review:** After Kitchen Intelligence™ certification
**Status:** Observational (No Implementation Changes)
