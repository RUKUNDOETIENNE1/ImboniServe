# Hospitality Intelligence Platform v1.0 â€” Architecture Specification

**Version:** 1.0.0  
**Release Date:** 2026-07-22  
**Status:** ðŸŸ¢ **ARCHITECTURE FROZEN**  
**Authority:** Official Architecture Specification

---

## Table of Contents

1. [Architecture Principles](#architecture-principles)
2. [Platform Vision](#platform-vision)
3. [Platform Architecture](#platform-architecture)
4. [Intelligence Module Contract](#intelligence-module-contract)
5. [Engineering Lifecycle](#engineering-lifecycle)
6. [Production Certification Standard](#production-certification-standard)
7. [Platform Extension Guide](#platform-extension-guide)
8. [Engineering Boundaries](#engineering-boundaries)
9. [Platform Versioning](#platform-versioning)
10. [Engineering Governance](#engineering-governance)

---

## Architecture Principles

The following principles govern all engineering decisions on the Hospitality Intelligence Platform. These are not guidelinesâ€”they are mandatory engineering standards.

### 1. Reality Before Assumptions

**Principle:** All engineering decisions must be based on observed reality, not theoretical assumptions.

**Rationale:**
- Daily Briefings revealed 6 runtime defects that compilation missed
- Service Intelligence and Kitchen Intelligence had 0 defects because patterns were proven
- Assumptions about "what should work" led to production issues
- Runtime validation catches what type systems cannot

**Application:**
- Never assume code worksâ€”validate it
- Never assume patterns are reusableâ€”prove it with 3+ modules
- Never assume abstractions are neededâ€”wait for evidence
- Runtime validation is mandatory, not optional

### 2. Runtime Validation Before Certification

**Principle:** No intelligence module may be certified for production without passing complete runtime validation.

**Rationale:**
- Compilation proves syntax, not behavior
- Type checking proves structure, not correctness
- Runtime validation proves operational readiness
- Production defects are discovered at runtime, not compile-time

**Application:**
- Every module must execute successfully
- Every module must generate valid reports
- Every module must build dashboards without errors
- Every module must handle empty data gracefully
- Validation must use actual operational events

### 3. Certification Before Expansion

**Principle:** No new intelligence module may begin until the previous module is production-certified.

**Rationale:**
- Uncertified modules create technical debt
- Incomplete modules block pattern discovery
- Sequential certification enables learning
- Platform maturity requires proven modules

**Application:**
- Daily Briefings certified â†’ Service Intelligence began
- Service Intelligence certified â†’ Kitchen Intelligence began
- Kitchen Intelligence certified â†’ Platform refactoring began
- Platform certified â†’ Menu Intelligence may begin

### 4. Reuse Before Building

**Principle:** Always use existing platform services before creating new implementations.

**Rationale:**
- Platform services are tested and proven
- Duplication creates maintenance burden
- Reuse accelerates development
- Consistency improves quality

**Application:**
- Use `getOperationalEvents()` for event retrieval
- Use `buildTimeRange()` for time range construction
- Use `BaseIntelligenceService` for orchestration
- Use `BaseDashboardBuilder` for formatting
- Use `createIntelligenceEndpoint()` for APIs

### 5. Integrate Before Extending

**Principle:** Integrate with existing platform infrastructure before creating parallel systems.

**Rationale:**
- Parallel systems create fragmentation
- Integration leverages existing capabilities
- Platform coherence requires integration
- Maintenance burden increases with fragmentation

**Application:**
- Use Heart Pulse for operational events
- Use IntelligenceReport table for caching
- Use NextAuth for authentication
- Use existing export infrastructure
- Extend platform, don't replace it

### 6. Evidence-Driven Engineering

**Principle:** Create abstractions only after observing patterns across 3+ production-certified modules.

**Rationale:**
- 1 module shows possibility
- 2 modules show coincidence
- 3 modules show pattern
- Premature abstraction creates wrong abstractions

**Application:**
- BaseIntelligenceService created after 3 modules (80% similarity)
- BaseDashboardBuilder created after 3 modules (70% similarity)
- API Endpoint Factory created after 2 modules (95% similarity)
- BaseAggregator NOT created (only 60% similarityâ€”needs more evidence)

### 7. Behavioral Equivalence During Refactoring

**Principle:** Refactoring must preserve 100% of existing behavior. Any behavioral change is a regression.

**Rationale:**
- Production systems depend on exact behavior
- Subtle changes break user workflows
- Regression testing validates equivalence
- Trust requires predictability

**Application:**
- Service Intelligence v2: 5/5 validation tests passed, 0 regressions
- Kitchen Intelligence v2: 5/5 validation tests passed, 0 regressions
- Report structure: Identical
- Dashboard sections: Identical
- API responses: Identical

### 8. Stable Platform Before Rapid Expansion

**Principle:** Platform architecture must be frozen before accelerating module development.

**Rationale:**
- Unstable platforms create rework
- Architecture changes invalidate modules
- Stability enables confidence
- Frozen architecture enables parallelization

**Application:**
- 3 modules certified before platform refactoring
- Platform refactored with 0 regressions
- Architecture frozen before Menu Intelligence
- Future modules build on stable foundation

### 9. No Premature Abstraction

**Principle:** Do not create shared abstractions until duplication is proven across multiple modules.

**Rationale:**
- Early abstraction creates wrong abstractions
- Duplication reveals true patterns
- Premature abstraction is harder to fix than duplication
- Evidence prevents mistakes

**Application:**
- Aggregation logic remains module-specific (60% similarityâ€”insufficient)
- Insight generation remains module-specific (40% similarityâ€”insufficient)
- Dashboard sections remain module-specific (domain-specific)
- Only 70%+ similarity justifies abstraction

### 10. Intelligence Modules Extend the Platform

**Principle:** Intelligence modules extend platform base classes rather than reimplementing common logic.

**Rationale:**
- Extension promotes reuse
- Extension ensures consistency
- Extension reduces code volume
- Extension accelerates development

**Application:**
- `ServiceIntelligenceServiceV2 extends BaseIntelligenceService`
- `KitchenIntelligenceServiceV2 extends BaseIntelligenceService`
- `ServiceDashboardBuilderV2 extends BaseDashboardBuilder`
- `KitchenDashboardBuilderV2 extends BaseDashboardBuilder`

---

## Platform Vision

### Purpose

The Hospitality Intelligence Platform is a **reusable engineering foundation** for building operational intelligence modules within ImboniServe.

The platform provides:
- **Common orchestration** for intelligence generation
- **Shared utilities** for dashboard building
- **Standardized APIs** for intelligence endpoints
- **Automated validation** for quality assurance
- **Proven infrastructure** for operational data

### Responsibilities

The platform is responsible for:

1. **Service Orchestration**
   - Request validation
   - Event retrieval
   - Time range construction
   - Error handling
   - Diagnostics tracking

2. **Dashboard Utilities**
   - Duration formatting
   - Grade calculation
   - Icon/color mapping
   - Defensive null handling
   - Metadata extraction

3. **API Standardization**
   - Authentication
   - Request validation
   - Error responses
   - Logging

4. **Validation Framework**
   - Automated testing
   - Regression detection
   - Result reporting

5. **Infrastructure Integration**
   - Heart Pulse integration
   - Event retrieval
   - Caching
   - Persistence
   - Authentication

### Long-term Role

The platform serves as the **permanent engineering foundation** for all operational intelligence within ImboniServe.

**What the platform is:**
- A reusable base for intelligence modules
- A proven set of common services
- An engineering standard for quality
- A framework for consistency

**What the platform is not:**
- A generic intelligence engine
- A one-size-fits-all solution
- A replacement for domain expertise
- A constraint on innovation

### Difference from Intelligence Modules

| Aspect | Platform | Intelligence Modules |
|--------|----------|---------------------|
| **Purpose** | Provide common infrastructure | Generate domain-specific intelligence |
| **Scope** | Orchestration, utilities, standards | Aggregation, insights, analysis |
| **Stability** | Frozen architecture | Evolving algorithms |
| **Reusability** | 100% reused by all modules | Module-specific |
| **Ownership** | Platform team | Module teams |
| **Change Frequency** | Rare (versioned) | Frequent (continuous improvement) |

---

## Platform Architecture

### Core Platform Components

#### 1. BaseIntelligenceService

**File:** `src/lib/intelligence/base-service.ts` (222 lines)

**Responsibility:** Provides shared orchestration for all intelligence modules.

**Capabilities:**
- Request validation (businessId, selection)
- Time range construction
- Event retrieval with filtering
- Error handling
- Diagnostics tracking
- Confidence calculation
- Duration formatting

**Extension Points:**
```typescript
abstract class BaseIntelligenceService<TRequest, TReport, TResponse> {
  // Subclass implements:
  protected abstract getEventTypes(): string[]
  protected abstract buildReport(request, events, timeRange): Promise<TReport>
  protected abstract createSuccessResponse(report, diagnostics): TResponse
  protected abstract createErrorResponse(error, diagnostics): TResponse
}
```

**Rationale:**
- 80% similarity across 3 certified modules
- Orchestration flow identical
- Event retrieval 100% identical
- Error handling 90% identical

#### 2. BaseDashboardBuilder

**File:** `src/lib/intelligence/base-dashboard-builder.ts` (243 lines)

**Responsibility:** Provides shared presentation utilities for all intelligence dashboards.

**Capabilities:**
- Duration formatting (`formatDuration`)
- Grade calculation (`calculateGrade`)
- Icon mapping (`getIcon`, `getInsightIcon`, `getTrendIcon`)
- Color mapping (`getColor`, `getSeverityColor`, `getTrendColor`)
- Defensive operations (`safeMap`, `safeFilter`, `safeSlice`, `safeValue`)
- Formatting (`formatPercentage`, `formatNumber`)
- Metadata building (`buildMetadata`)

**Extension Points:**
```typescript
abstract class BaseDashboardBuilder<TReport, TDashboard> {
  // Subclass implements:
  abstract build(report: TReport): TDashboard
  
  // Subclass uses inherited utilities:
  protected formatDuration(seconds: number): string
  protected calculateGrade(score: number): string
  protected getIcon(type, mapping, default): string
  protected safeMap<T, U>(array, mapper): U[]
  // ... and more
}
```

**Rationale:**
- 70% similarity across 3 certified modules
- Helper methods 95% identical
- Defensive handling 100% identical
- Formatting utilities 90% identical

#### 3. API Endpoint Factory

**File:** `src/lib/intelligence/api-endpoint-factory.ts` (201 lines)

**Responsibility:** Creates standardized API endpoints for intelligence modules.

**Capabilities:**
- Authentication check (NextAuth)
- Method validation (POST only)
- Request validation (businessId, selection)
- Error handling with diagnostics
- Response formatting
- Logging

**Usage:**
```typescript
export default createIntelligenceEndpoint<TRequest, TResponse>(
  'Module Name',
  createModuleService
)
```

**Rationale:**
- 95% similarity across 2 certified modules
- Authentication 100% identical
- Validation 90% identical
- Error handling 95% identical

#### 4. Runtime Validation Framework

**File:** `src/lib/intelligence/validation-framework.ts` (292 lines)

**Responsibility:** Provides automated validation for all intelligence modules.

**Capabilities:**
- Business lookup validation
- Service creation validation
- Report generation validation
- Dashboard building validation
- Export validation
- Result aggregation and reporting

**Usage:**
```typescript
const validator = createIntelligenceValidator(
  'Module Name',
  createService,
  createDashboardBuilder
)
const results = await validator.validate()
```

**Rationale:**
- 85% similarity across 3 certified modules
- Validation flow 90% identical
- Output format 95% identical

### Platform Infrastructure

#### 5. Heart Pulse

**Responsibility:** Operational event tracking system.

**Capabilities:**
- Real-time event capture
- Event persistence
- Event replay
- Operational timeline

**Integration:**
- All intelligence modules consume Heart Pulse events
- No intelligence module modifies Heart Pulse
- Heart Pulse is platform infrastructure

#### 6. ReplayEvent

**Responsibility:** Replayable operational event structure.

**Capabilities:**
- Standardized event format
- Event categorization
- Event metadata
- Temporal ordering

**Integration:**
- Intelligence modules consume ReplayEvents
- Event retrieval returns ReplayEvents
- Aggregators process ReplayEvents

#### 7. TicketEvent

**Responsibility:** Order-specific operational events.

**Capabilities:**
- Order lifecycle tracking
- Kitchen status tracking
- Payment tracking
- Service tracking

**Integration:**
- Subset of ReplayEvents
- Used by Service Intelligence and Kitchen Intelligence
- Standardized across modules

#### 8. Operational Event Retrieval

**Function:** `getOperationalEvents()`

**File:** `src/lib/intelligence/integration-helper.ts`

**Responsibility:** Retrieve operational events from Heart Pulse.

**Capabilities:**
- Business filtering
- Time range filtering
- Event type filtering
- Efficient querying

**Integration:**
- 100% reuse across all modules
- No module reimplements event retrieval
- Single source of truth

#### 9. Time Range Utilities

**Function:** `buildTimeRange()`

**File:** `src/lib/intelligence/integration-helper.ts`

**Responsibility:** Construct time ranges from period selections.

**Capabilities:**
- Predefined periods (today, yesterday, last_7_days, etc.)
- Custom date ranges
- Timezone handling
- Label generation

**Integration:**
- 100% reuse across all modules
- Consistent time range semantics
- Single implementation

#### 10. Caching

**Table:** `IntelligenceReport`

**Responsibility:** Cache generated intelligence reports.

**Capabilities:**
- Report persistence
- Duplicate prevention
- Historical retrieval
- Export support

**Integration:**
- All modules use IntelligenceReport table
- Consistent caching strategy
- Automatic duplicate prevention

#### 11. Persistence

**Database:** PostgreSQL via Prisma

**Responsibility:** Persistent storage for all intelligence data.

**Capabilities:**
- Report storage
- Event storage
- Metadata storage
- Historical queries

**Integration:**
- All modules use Prisma
- Consistent data model
- Transactional integrity

#### 12. Authentication

**System:** NextAuth

**Responsibility:** User authentication and authorization.

**Capabilities:**
- Session management
- User identification
- Role-based access (future)
- Business access control (future)

**Integration:**
- All API endpoints use NextAuth
- Consistent authentication
- Single sign-on

---

## Intelligence Module Contract

Every intelligence module **MUST** implement the following contract.

### Module Ownership

An intelligence module **OWNS** only:

1. **Aggregation Logic**
   - Event grouping (domain-specific)
   - Metric calculation (domain-specific)
   - Statistical analysis (domain-specific)

2. **Intelligence Calculations**
   - Insight generation (domain-specific)
   - Bottleneck detection (domain-specific)
   - Improvement identification (domain-specific)
   - Trend analysis (domain-specific)

3. **Dashboard Sections**
   - Module-specific displays
   - Domain-specific visualizations
   - Custom card types

4. **Validation Rules**
   - Module-specific assertions
   - Domain-specific test cases

### Module Responsibilities

An intelligence module **MUST**:

1. **Extend BaseIntelligenceService**
   ```typescript
   class ModuleService extends BaseIntelligenceService<
     ModuleRequest,
     ModuleReport,
     ModuleResponse
   > {
     protected getEventTypes(): string[] { /* ... */ }
     protected async buildReport(request, events, timeRange): Promise<ModuleReport> { /* ... */ }
     protected createSuccessResponse(report, diagnostics): ModuleResponse { /* ... */ }
     protected createErrorResponse(error, diagnostics): ModuleResponse { /* ... */ }
   }
   ```

2. **Extend BaseDashboardBuilder**
   ```typescript
   class ModuleDashboardBuilder extends BaseDashboardBuilder<
     ModuleReport,
     ModuleDashboard
   > {
     build(report: ModuleReport): ModuleDashboard { /* ... */ }
     // Use inherited utilities: formatDuration, calculateGrade, etc.
   }
   ```

3. **Use API Endpoint Factory**
   ```typescript
   export default createIntelligenceEndpoint<ModuleRequest, ModuleResponse>(
     'Module Name',
     createModuleService
   )
   ```

4. **Use Validation Framework**
   ```typescript
   const validator = createIntelligenceValidator(
     'Module Name',
     createModuleService,
     createModuleDashboardBuilder
   )
   ```

5. **Follow Type Contracts**
   - Request extends `BaseIntelligenceRequest`
   - Response extends `BaseIntelligenceResponse<TReport>`
   - Report includes required fields (id, businessId, reportingPeriod, generatedAt, confidence, eventsAnalyzed)

### Module Prohibitions

An intelligence module **MUST NOT**:

1. **Reimplement Platform Services**
   - âŒ Do not create custom event retrieval
   - âŒ Do not create custom time range logic
   - âŒ Do not create custom authentication
   - âŒ Do not create custom caching
   - âœ… Use platform services

2. **Modify Platform Infrastructure**
   - âŒ Do not modify BaseIntelligenceService
   - âŒ Do not modify BaseDashboardBuilder
   - âŒ Do not modify API Endpoint Factory
   - âŒ Do not modify Heart Pulse
   - âœ… Extend, don't modify

3. **Skip Lifecycle Stages**
   - âŒ Do not skip runtime validation
   - âŒ Do not skip production certification
   - âŒ Do not deploy without certification
   - âœ… Follow mandatory lifecycle

4. **Create Parallel Systems**
   - âŒ Do not create alternative event systems
   - âŒ Do not create alternative caching
   - âŒ Do not create alternative authentication
   - âœ… Integrate with platform

---

## Engineering Lifecycle

Every intelligence module **MUST** complete the following lifecycle stages in order.

### Stage 1: Architecture

**Objective:** Define the intelligence module's domain and capabilities.

**Activities:**
- Define module purpose
- Identify data sources
- Design report structure
- Plan dashboard sections
- Document expected insights

**Deliverables:**
- Architecture document
- Type definitions
- Interface contracts

**Completion Criteria:**
- Architecture reviewed
- Types defined
- Contracts documented

**Do NOT proceed to implementation without architecture approval.**

---

### Stage 2: Implementation

**Objective:** Implement the intelligence module using the platform.

**Activities:**
- Create aggregator (module-specific logic)
- Extend BaseIntelligenceService
- Extend BaseDashboardBuilder
- Create API endpoint using factory
- Create validation script using framework

**Deliverables:**
- Service implementation
- Dashboard builder implementation
- API endpoint
- Validation script

**Completion Criteria:**
- Code compiles without errors
- TypeScript type checking passes
- All platform contracts satisfied

**Do NOT proceed to validation without successful compilation.**

---

### Stage 3: Runtime Validation

**Objective:** Prove the module works with actual operational data.

**Activities:**
- Run validation script
- Generate intelligence reports
- Build dashboards
- Test export functionality
- Verify persistence
- Test historical reports

**Deliverables:**
- Validation results
- Runtime evidence
- Test reports

**Completion Criteria:**
- All validation tests pass
- Reports generate successfully
- Dashboards render without errors
- Export works
- No runtime exceptions

**Do NOT proceed to certification without 100% validation success.**

---

### Stage 4: Production Certification

**Objective:** Certify the module is production-ready.

**Activities:**
- Review validation results
- Verify completion gate criteria
- Document any cosmetic enhancements (non-blocking)
- Create certification report

**Deliverables:**
- Certification report
- Completion gate results
- Known issues (if any)

**Completion Criteria:**
- All completion gate criteria met
- Zero production-blocking defects
- Certification report approved

**Do NOT proceed to platform integration without certification.**

---

### Stage 5: Platform Integration

**Objective:** Integrate the certified module into the platform.

**Activities:**
- Update platform documentation
- Add module to supported modules list
- Update version compatibility
- Document platform reuse metrics

**Deliverables:**
- Updated platform documentation
- Integration metrics
- Reuse analysis

**Completion Criteria:**
- Module listed in platform documentation
- Metrics documented
- Integration complete

**Do NOT proceed to release without platform integration.**

---

### Stage 6: Release

**Objective:** Deploy the certified module to production.

**Activities:**
- Deploy to production environment
- Monitor initial usage
- Verify production behavior
- Document production metrics

**Deliverables:**
- Production deployment
- Monitoring dashboards
- Production metrics

**Completion Criteria:**
- Module deployed successfully
- Production behavior matches validation
- No production incidents

**Module is now production-certified and released.**

---

## Production Certification Standard

Every intelligence module **MUST** pass the following certification checklist before production deployment.

### Certification Checklist

#### 1. Runtime Execution âœ…

**Requirement:** The module must execute successfully with actual operational data.

**Validation:**
- Service creates without errors
- Report generation succeeds
- No runtime exceptions
- Handles empty data gracefully

**Evidence Required:**
- Validation script output
- Report generation logs
- Error handling verification

---

#### 2. Dashboard Rendering âœ…

**Requirement:** The dashboard must render without errors.

**Validation:**
- Dashboard builds successfully
- All sections present
- No null reference errors
- Defensive handling verified

**Evidence Required:**
- Dashboard build logs
- Section count verification
- Null handling tests

---

#### 3. API Validation âœ…

**Requirement:** API endpoints must function correctly.

**Validation:**
- Authentication works
- Request validation works
- Response formatting correct
- Error handling works

**Evidence Required:**
- API endpoint tests
- Authentication verification
- Error response tests

---

#### 4. Persistence âœ…

**Requirement:** Reports must persist to database correctly.

**Validation:**
- Reports save to IntelligenceReport table
- Report retrieval works
- Data integrity maintained

**Evidence Required:**
- Database queries
- Persistence verification
- Data integrity checks

---

#### 5. Export âœ…

**Requirement:** Reports must export successfully.

**Validation:**
- JSON serialization works
- Export size reasonable
- Data completeness verified

**Evidence Required:**
- Export tests
- Size verification
- Completeness checks

---

#### 6. Historical Reporting âœ…

**Requirement:** Historical reports must work for any date range.

**Validation:**
- Custom date ranges work
- Predefined periods work
- Time range logic correct

**Evidence Required:**
- Historical report tests
- Date range verification
- Time zone handling

---

#### 7. Duplicate Prevention âœ…

**Requirement:** Duplicate reports must not be generated.

**Validation:**
- Caching works correctly
- Duplicate detection works
- Cache invalidation works

**Evidence Required:**
- Duplicate prevention tests
- Cache verification
- Invalidation tests

---

#### 8. Regression Testing âœ…

**Requirement:** No behavioral regressions from previous versions.

**Validation:**
- All previous tests still pass
- Behavior identical to previous version
- No unexpected changes

**Evidence Required:**
- Regression test results
- Behavior comparison
- Change documentation

---

#### 9. Zero Production-Blocking Defects âœ…

**Requirement:** No defects that prevent production use.

**Validation:**
- All critical paths work
- Error handling complete
- Edge cases handled

**Evidence Required:**
- Defect log (empty or cosmetic only)
- Critical path verification
- Edge case tests

---

### Certification Decision

**A module is certified for production if and only if:**

âœ… All 9 certification criteria are met  
âœ… Validation success rate is 100%  
âœ… Zero production-blocking defects exist  
âœ… Certification report is approved  

**Certification Declaration:**

```
ðŸŸ¢ [MODULE NAME] â€” PRODUCTION CERTIFIED
```

**Cosmetic enhancements** (non-blocking issues) may be documented but do not prevent certification.

---

## Platform Extension Guide

This section documents how future intelligence modules must integrate with the platform.

### Menu Intelligenceâ„¢

**Domain:** Menu performance, dish analytics, profitability

**Expected Integration:**

1. **Service:**
   ```typescript
   class MenuIntelligenceService extends BaseIntelligenceService<
     MenuIntelligenceRequest,
     MenuIntelligenceReport,
     MenuIntelligenceResponse
   > {
     protected getEventTypes() {
       return ['ORDER_CREATED', 'MENU_ITEM_ORDERED']
     }
     
     protected async buildReport(request, events, timeRange) {
       // Menu-specific aggregation
       const aggregator = new MenuMetricsAggregator()
       const metrics = aggregator.calculateMetrics(events)
       const dishPerformance = aggregator.analyzeDishPerformance(events)
       const profitability = aggregator.calculateProfitability(events)
       
       return { /* menu report */ }
     }
   }
   ```

2. **Dashboard:**
   ```typescript
   class MenuDashboardBuilder extends BaseDashboardBuilder<
     MenuIntelligenceReport,
     MenuDashboard
   > {
     build(report) {
       return {
         report,
         dishDisplay: this.buildDishDisplay(report),
         profitabilityDisplay: this.buildProfitabilityDisplay(report),
         // Use inherited: formatDuration, calculateGrade, etc.
       }
     }
   }
   ```

3. **API:**
   ```typescript
   export default createIntelligenceEndpoint(
     'Menu Intelligence',
     createMenuIntelligenceService
   )
   ```

**Expected Implementation Time:** 3-4 hours (40-50% faster than pre-platform)

---

### Hospitality Memoryâ„¢

**Domain:** Historical intelligence synthesis, pattern recognition, predictive insights

**Expected Integration:**

1. **Service:**
   ```typescript
   class RestaurantMemoryService extends BaseIntelligenceService<
     RestaurantMemoryRequest,
     RestaurantMemoryReport,
     RestaurantMemoryResponse
   > {
     protected getEventTypes() {
       return undefined // All event types
     }
     
     protected async buildReport(request, events, timeRange) {
       // Historical pattern analysis
       const aggregator = new MemoryAggregator()
       const patterns = aggregator.identifyPatterns(events)
       const predictions = aggregator.generatePredictions(patterns)
       
       return { /* memory report */ }
     }
   }
   ```

2. **Dashboard:**
   ```typescript
   class MemoryDashboardBuilder extends BaseDashboardBuilder<
     RestaurantMemoryReport,
     RestaurantMemoryDashboard
   > {
     build(report) {
       return {
         report,
         patternsDisplay: this.buildPatternsDisplay(report),
         predictionsDisplay: this.buildPredictionsDisplay(report),
         // Use inherited utilities
       }
     }
   }
   ```

**Expected Implementation Time:** 4-5 hours (historical analysis complexity)

---

### Hospitality Knowledgeâ„¢

**Domain:** Cross-module knowledge integration, institutional learning, best practices

**Expected Integration:**

1. **Service:**
   ```typescript
   class RestaurantKnowledgeService extends BaseIntelligenceService<
     RestaurantKnowledgeRequest,
     RestaurantKnowledgeReport,
     RestaurantKnowledgeResponse
   > {
     protected async buildReport(request, events, timeRange) {
       // Cross-module knowledge synthesis
       const dailyBriefings = await this.getHistoricalBriefings()
       const serviceIntel = await this.getHistoricalServiceIntel()
       const kitchenIntel = await this.getHistoricalKitchenIntel()
       
       const aggregator = new KnowledgeAggregator()
       const knowledge = aggregator.synthesize(dailyBriefings, serviceIntel, kitchenIntel)
       
       return { /* knowledge report */ }
     }
   }
   ```

**Expected Implementation Time:** 5-6 hours (cross-module integration complexity)

---

### AI Copilotâ„¢

**Domain:** Natural language intelligence queries, automated insight generation, proactive recommendations

**Expected Integration:**

1. **Service:**
   ```typescript
   class AICopilotService extends BaseIntelligenceService<
     AICopilotRequest,
     AICopilotReport,
     AICopilotResponse
   > {
     protected async buildReport(request, events, timeRange) {
       // Natural language processing
       const query = request.naturalLanguageQuery
       const aggregator = new CopilotAggregator()
       const insights = await aggregator.processQuery(query, events)
       
       return { /* copilot report */ }
     }
   }
   ```

**Expected Implementation Time:** 6-8 hours (AI integration complexity)

---

### Multi-Restaurant Intelligenceâ„¢

**Domain:** Cross-restaurant analytics, benchmark comparisons, network effects

**Expected Integration:**

1. **Service:**
   ```typescript
   class MultiRestaurantService extends BaseIntelligenceService<
     MultiRestaurantRequest,
     MultiRestaurantReport,
     MultiRestaurantResponse
   > {
     protected async buildReport(request, events, timeRange) {
       // Multi-business aggregation
       const businesses = request.businessIds
       const aggregator = new MultiRestaurantAggregator()
       const comparison = aggregator.compareBusinesses(businesses, events)
       
       return { /* multi-restaurant report */ }
     }
   }
   ```

**Expected Implementation Time:** 5-6 hours (multi-business complexity)

---

## Engineering Boundaries

### What Future Modules May NOT Modify

The following components are **FROZEN** and may not be modified by intelligence modules:

#### 1. Platform Infrastructure

**Frozen Components:**
- BaseIntelligenceService
- BaseDashboardBuilder
- API Endpoint Factory
- Runtime Validation Framework
- Platform exports

**Rationale:**
- Platform stability requires frozen interfaces
- Changes affect all modules
- Modifications require platform versioning

**Change Process:**
- Propose change via ADR
- Demonstrate need across 3+ modules
- Create platform v1.1 or v2.0
- Migrate all modules

---

#### 2. Certified Modules

**Frozen Components:**
- Daily Briefings Intelligence Engine
- Service Intelligenceâ„¢
- Kitchen Intelligenceâ„¢

**Rationale:**
- Production-certified modules are stable
- Changes require recertification
- Behavioral equivalence must be maintained

**Change Process:**
- Bug fixes only (preserve behavior)
- Enhancements require new version
- Recertification required
- Regression testing mandatory

---

#### 3. Shared Services

**Frozen Components:**
- `getOperationalEvents()`
- `buildTimeRange()`
- Heart Pulse
- ReplayEvent structure
- TicketEvent structure

**Rationale:**
- Shared services have multiple consumers
- Changes affect all modules
- Consistency requires stability

**Change Process:**
- Propose change via ADR
- Assess impact on all modules
- Backward compatibility required
- Migration plan required

---

#### 4. Runtime Framework

**Frozen Components:**
- Validation framework
- Certification checklist
- Lifecycle stages

**Rationale:**
- Quality standards must be consistent
- All modules must meet same bar
- Framework changes affect governance

**Change Process:**
- Propose change via ADR
- Demonstrate improvement
- Apply to all future modules
- Retroactive application optional

---

#### 5. Certification Framework

**Frozen Components:**
- Production certification standard
- Completion gate criteria
- Regression testing requirements

**Rationale:**
- Quality bar must be consistent
- Certification must be objective
- Standards must be stable

**Change Process:**
- Propose change via ADR
- Demonstrate need
- Apply to all future modules
- Existing certifications remain valid

---

### Platform Modification Process

If platform modifications are required:

1. **Create ADR**
   - Document context
   - Propose decision
   - Analyze consequences
   - Consider alternatives
   - Provide rationale

2. **Assess Impact**
   - Identify affected modules
   - Estimate migration effort
   - Plan backward compatibility
   - Document breaking changes

3. **Version Decision**
   - Patch (1.0.x): Bug fixes, no breaking changes
   - Minor (1.x.0): New features, backward compatible
   - Major (x.0.0): Breaking changes, migration required

4. **Implementation**
   - Implement changes
   - Update documentation
   - Migrate affected modules
   - Validate no regressions

5. **Release**
   - Update platform version
   - Document changes
   - Communicate to teams
   - Monitor adoption

---

## Platform Versioning

### Version 1.0.0 Declaration

**Official Declaration:**

```
ðŸŸ¢ HOSPITALITY INTELLIGENCE PLATFORM v1.0.0 â€” PRODUCTION READY
```

**Release Date:** 2026-07-22

**Supported Intelligence Modules:**
- Daily Briefings Intelligence Engine (v1.0)
- Service Intelligenceâ„¢ (v1.0, v2.0)
- Kitchen Intelligenceâ„¢ (v1.0, v2.0)

**Platform Capabilities:**
- Service orchestration (BaseIntelligenceService)
- Dashboard utilities (BaseDashboardBuilder)
- API standardization (API Endpoint Factory)
- Automated validation (Runtime Validation Framework)
- Infrastructure integration (Heart Pulse, Events, Caching, Auth)

**Compatibility Expectations:**
- All future modules must extend platform base classes
- All future modules must use platform services
- All future modules must follow engineering lifecycle
- All future modules must pass certification standard

---

### Versioning Strategy

**Semantic Versioning:** MAJOR.MINOR.PATCH

#### Patch Releases (1.0.x)

**Purpose:** Bug fixes, documentation updates, non-breaking changes

**Examples:**
- Fix bug in formatDuration
- Update documentation
- Improve error messages
- Performance optimizations

**Impact:** No module changes required

**Frequency:** As needed

---

#### Minor Releases (1.x.0)

**Purpose:** New features, backward-compatible enhancements

**Examples:**
- Add new utility methods to BaseDashboardBuilder
- Add new validation checks to framework
- Add new helper functions
- Extend API factory capabilities

**Impact:** Optional adoption by modules

**Frequency:** Quarterly

---

#### Major Releases (x.0.0)

**Purpose:** Breaking changes, architecture changes

**Examples:**
- Change BaseIntelligenceService interface
- Modify platform contracts
- Remove deprecated features
- Restructure architecture

**Impact:** Module migration required

**Frequency:** Annually (or as needed)

---

### Version Compatibility

**Platform v1.0.0 supports:**
- Service Intelligence v2.0
- Kitchen Intelligence v2.0
- Menu Intelligence v1.0 (future)
- Hospitality Memory v1.0 (future)
- Hospitality Knowledge v1.0 (future)
- AI Copilot v1.0 (future)
- Multi-Restaurant Intelligence v1.0 (future)

**Platform v1.0.0 does NOT support:**
- Service Intelligence v1.0 (pre-platform)
- Kitchen Intelligence v1.0 (pre-platform)

**Backward Compatibility:**
- v1.0 modules remain functional
- v2.0 modules use platform
- Both versions coexist
- Migration optional

---

## Engineering Governance

### Architecture Decision Records (ADR)

**Requirement:** All significant architecture decisions must be documented in an ADR.

**When to Create an ADR:**
- Platform architecture changes
- New shared abstractions
- Breaking changes
- Governance changes
- Certification standard changes

**ADR Template:**
```markdown
# ADR-XXX: [Title]

## Context
[Describe the situation and problem]

## Decision
[State the decision clearly]

## Consequences
[Describe the impact of the decision]

## Alternatives Considered
[List alternatives and why they were rejected]

## Rationale
[Explain why this decision is correct]
```

**ADR Directory:** `docs/adr/`

**ADR Index:** Maintained in `docs/adr/README.md`

---

### Platform Refactoring Policy

**Requirement:** Platform refactoring must preserve 100% behavioral equivalence.

**When Refactoring is Permitted:**
- After 3+ modules demonstrate pattern (evidence-driven)
- Zero behavioral changes
- 100% regression testing
- Backward compatibility maintained

**When Refactoring is Prohibited:**
- Based on assumptions (no evidence)
- Breaking changes without version bump
- Without regression testing
- Without migration plan

**Refactoring Process:**
1. Document pattern evidence (3+ modules)
2. Create ADR
3. Implement refactoring
4. Run regression tests (100% pass required)
5. Migrate modules
6. Update documentation

---

### New Shared Abstractions Policy

**Requirement:** New shared abstractions require evidence from 3+ production-certified modules.

**Evaluation Criteria:**
- Similarity â‰¥ 70% across modules
- Clear responsibilities
- Stable interface
- Proven value

**Approval Process:**
1. Demonstrate pattern across 3+ modules
2. Measure similarity percentage
3. Create ADR
4. Implement abstraction
5. Migrate modules
6. Validate no regressions

**Examples:**
- BaseIntelligenceService: 80% similarity â†’ Approved
- BaseDashboardBuilder: 70% similarity â†’ Approved
- API Endpoint Factory: 95% similarity â†’ Approved
- BaseAggregator: 60% similarity â†’ Rejected (needs more evidence)

---

### Regression Testing Requirements

**Requirement:** All platform changes must pass 100% regression testing.

**Regression Test Suite:**
- All certified modules must pass validation
- All API endpoints must function
- All dashboards must render
- All exports must work
- No behavioral changes

**Regression Testing Process:**
1. Run validation for all certified modules
2. Compare behavior before/after
3. Document any differences
4. Fix regressions (or reject change)
5. Rerun tests until 100% pass

**Acceptance Criteria:**
- 100% test pass rate
- Zero behavioral regressions
- Identical output for identical input

---

### Platform Review Process

**Requirement:** Platform changes require review and approval.

**Review Triggers:**
- New platform components
- Platform refactoring
- Breaking changes
- Governance changes

**Review Process:**
1. Create ADR
2. Submit for review
3. Address feedback
4. Obtain approval
5. Implement change
6. Validate results

**Reviewers:**
- Platform architect
- Module owners (affected modules)
- Engineering lead

---

### Deprecation Policy

**Requirement:** Deprecated features must be supported for at least one major version.

**Deprecation Process:**
1. Mark feature as deprecated
2. Document replacement
3. Provide migration guide
4. Support for 1 major version
5. Remove in next major version

**Example:**
- v1.0: Feature X available
- v1.5: Feature X deprecated, Feature Y introduced
- v2.0: Feature X removed, Feature Y required

**Communication:**
- Deprecation warnings in code
- Documentation updates
- Migration guides
- Release notes

---

### Change Approval Matrix

| Change Type | ADR Required | Review Required | Regression Testing | Version Impact |
|-------------|-------------|-----------------|-------------------|----------------|
| Bug fix | No | No | Yes | Patch |
| New utility | No | No | Yes | Minor |
| New abstraction | Yes | Yes | Yes | Minor |
| Breaking change | Yes | Yes | Yes | Major |
| Architecture change | Yes | Yes | Yes | Major |
| Governance change | Yes | Yes | N/A | N/A |

---

**END OF ARCHITECTURE SPECIFICATION**

**Status:** ðŸŸ¢ **ARCHITECTURE FROZEN**  
**Version:** 1.0.0  
**Effective Date:** 2026-07-22  
**Next Review:** After Menu Intelligenceâ„¢ certification or upon major change proposal

