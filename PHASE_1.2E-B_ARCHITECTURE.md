# Phase 1.2E-B Architecture — Operational Intelligence Core

**Phase**: 1.2E-B Foundation (Operational Intelligence Core)  
**Date**: June 24, 2026  
**Role**: Hospitality Operations Director, COO, Decision Intelligence Architect, Enterprise Systems Engineer  
**Status**: ✅ **ARCHITECTURE COMPLETE**  

---

## Executive Summary

**Mission**: Build minimum operational intelligence foundation capable of generating measurable operational value

**Scope**: 3 operational watchdogs only (Staffing, Service Quality, Incident)

**Approach**: Deterministic rules, trust safeguards built-in, operational focus

**Status**: ✅ **IMPLEMENTATION COMPLETE**

---

## Architecture Principles

### Principle 1: Minimum Viable Intelligence

**Rule**: Build only what's needed to prove operational value

**Implementation**: 3 watchdogs (not 7)
- Staffing (CRITICAL priority)
- Service Quality (CRITICAL priority)
- Incident (CRITICAL priority)

**Rationale**: Prove value before expanding scope

---

### Principle 2: Trust-First Design

**Rule**: Trust safeguards built-in from day one

**Implementation**:
- Alert budget (max 10/day)
- Cooldown logic (prevent duplicates)
- Urgency validation (avoid false CRITICAL)
- Explainability (why, evidence, impact, action)

**Rationale**: Prevent alert fatigue before it starts

---

### Principle 3: Operational Focus

**Rule**: Operational metrics only (NOT financial, NOT strategic)

**Implementation**:
- Staffing: shift coverage, absenteeism, overtime
- Service Quality: response time, complaints, unresolved issues
- Incident: frequency, recurrence, critical events

**Rationale**: Strict separation from CEO/CFO dashboards

---

### Principle 4: Deterministic Intelligence

**Rule**: No ML, no forecasting, no AI

**Implementation**:
- Rule-based thresholds
- Simple arithmetic
- Pattern detection (count-based)
- Fully explainable logic

**Rationale**: Auditability and trust

---

### Principle 5: Actionable Insights

**Rule**: Every alert must answer "What operational action must happen today?"

**Implementation**:
- Recommended actions (specific, not generic)
- Operational impact (why it matters)
- Evidence (what triggered alert)
- Deadline (when to act)

**Rationale**: COO needs to know WHAT to do, not just THAT there's a problem

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 OPERATIONAL INTELLIGENCE CORE                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              OPERATIONAL ALERT ENGINE                        │
│  • Orchestrates watchdog execution                          │
│  • Enforces alert budget                                    │
│  • Prioritizes alerts                                       │
│  • Delivers actionable insights                             │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ STAFFING         │ │ SERVICE QUALITY  │ │ INCIDENT         │
│ WATCHDOG         │ │ WATCHDOG         │ │ WATCHDOG         │
│                  │ │                  │ │                  │
│ • Shift coverage │ │ • Response time  │ │ • Frequency      │
│ • Absenteeism    │ │ • Complaints     │ │ • Recurrence     │
│ • Overtime       │ │ • Unresolved     │ │ • Critical       │
└──────────────────┘ └──────────────────┘ └──────────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              ALERT BUDGET MANAGER                            │
│  • Enforces 10 alerts/day limit                             │
│  • Enforces 3 CRITICAL/week limit                           │
│  • Filters by priority                                      │
│  • Progressive disclosure                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              ALERT DELIVERY                                  │
│  • Cooldown service (prevent duplicates)                    │
│  • Suppression service (root cause filtering)               │
│  • Delivery channels (email, Slack, dashboard)              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              DATA SOURCES                                    │
│  • Branch (locations)                                       │
│  • MarketplaceOrder (service delivery proxy)                │
│  • Scheduling system (placeholder)                          │
│  • Incident tracking (placeholder)                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Specifications

### Component 1: Staffing Watchdog

**Purpose**: Detect staffing risks before operational degradation

**File**: `src/lib/services/watchdog/operational/staffing-watchdog.service.ts`

**Checks**:
1. **Shift Coverage Gaps** (real-time)
   - CRITICAL: <80% coverage OR >3 open shifts
   - WARN: 80-90% coverage OR 1-2 open shifts
   - Cooldown: 6 hours (CRITICAL), 12 hours (WARN)

2. **Absenteeism Patterns** (daily)
   - CRITICAL: >20% absenteeism OR >3 last-minute callouts
   - WARN: 10-20% absenteeism OR 1-2 callouts
   - Cooldown: 24 hours (CRITICAL), 48 hours (WARN)

3. **Overtime Pressure** (weekly)
   - CRITICAL: >30% of hours are overtime
   - WARN: 20-30% overtime
   - Cooldown: 48 hours (CRITICAL), 72 hours (WARN)

**Data Sources**:
- Scheduling system (placeholder)
- Time tracking system (placeholder)
- Branch table (locations)

**Output**:
```typescript
{
  severity: 'CRITICAL' | 'WARN' | 'INFO',
  locationId: string,
  locationName: string,
  operationalImpact: string,
  why: string,
  evidence: string[],
  recommendedAction: string,
  threshold: number,
  currentValue: number,
  cooldownMinutes: number
}
```

---

### Component 2: Service Quality Watchdog

**Purpose**: Detect customer experience deterioration before reputation damage

**File**: `src/lib/services/watchdog/operational/service-quality-watchdog.service.ts`

**Checks**:
1. **Service Response Time Degradation** (real-time)
   - CRITICAL: >2x standard response time
   - WARN: 1.5-2x standard response time
   - Cooldown: 2 hours (CRITICAL), 4 hours (WARN)
   - Data: MarketplaceOrder (createdAt → updatedAt)

2. **Customer Complaint Velocity** (daily)
   - CRITICAL: >10 complaints/day OR accelerating trend
   - WARN: 5-10 complaints/day
   - Cooldown: 6 hours (CRITICAL), 12 hours (WARN)
   - Data: Complaint tracking system (placeholder)

3. **Unresolved Issue Backlog** (weekly)
   - CRITICAL: >20 unresolved OR >48 hour avg resolution
   - WARN: 10-20 unresolved OR >24 hour avg resolution
   - Cooldown: 24 hours (CRITICAL), 48 hours (WARN)
   - Data: Issue tracking system (placeholder)

**Data Sources**:
- MarketplaceOrder (service delivery proxy)
- Complaint tracking system (placeholder)
- Issue tracking system (placeholder)
- Branch table (locations)

**Output**:
```typescript
{
  severity: 'CRITICAL' | 'WARN' | 'INFO',
  locationId: string,
  locationName: string,
  customerImpact: string,
  why: string,
  evidence: string[],
  recommendedAction: string,
  threshold: number,
  currentValue: number,
  cooldownMinutes: number
}
```

---

### Component 3: Incident Watchdog

**Purpose**: Create operational visibility into recurring failures

**File**: `src/lib/services/watchdog/operational/incident-watchdog.service.ts`

**Checks**:
1. **Incident Frequency** (daily)
   - CRITICAL: >5 incidents/day OR any critical incident
   - WARN: 2-5 incidents/day
   - Cooldown: 1 hour (critical incident), 6 hours (high volume)

2. **Recurring Incident Patterns** (weekly)
   - CRITICAL: Same incident type >3x in 7 days
   - WARN: Same incident type >2x in 7 days
   - Cooldown: 48 hours (CRITICAL), 72 hours (WARN)

3. **Critical Incident Detection** (immediate)
   - CRITICAL: Safety, legal, or severe quality incidents
   - Cooldown: 1 hour

**Data Sources**:
- Incident tracking system (placeholder)
- Safety reporting system (placeholder)
- Branch table (locations)

**Output**:
```typescript
{
  severity: 'CRITICAL' | 'WARN' | 'INFO',
  locationId: string,
  locationName: string,
  operationalRisk: string,
  why: string,
  evidence: string[],
  recommendedAction: string,
  threshold: number,
  currentValue: number,
  cooldownMinutes: number
}
```

---

### Component 4: Operational Alert Engine

**Purpose**: Orchestrate operational watchdogs and manage alert delivery

**File**: `src/lib/services/watchdog/operational/operational-alert-engine.service.ts`

**Responsibilities**:
1. Run operational watchdogs on schedule
2. Aggregate alerts across watchdogs
3. Apply alert budget constraints
4. Prioritize alerts by urgency and impact
5. Deliver alerts to appropriate channels

**Methods**:
- `runAll()`: Execute all 3 watchdogs
- `runWatchdog(name)`: Execute specific watchdog
- `getOperationalHealthSummary()`: High-level status
- `getActionableInsights()`: Answer "What must happen today?"

**Execution Order**:
1. Reset daily alert budget if needed
2. Check budget remaining
3. Run Staffing Watchdog (Priority 1)
4. Run Service Quality Watchdog (Priority 2)
5. Run Incident Watchdog (Priority 3)
6. Return execution summary

**Output**:
```typescript
{
  executedAt: Date,
  totalDuration: number,
  watchdogsRun: number,
  totalAlertsGenerated: number,
  alertsDelivered: number,
  alertsSuppressed: number,
  budgetRemaining: number,
  errors: string[]
}
```

---

### Component 5: Alert Budget Manager

**Purpose**: Enforce alert budget to prevent alert fatigue

**File**: `src/lib/services/watchdog/operational/alert-budget-manager.service.ts`

**Trust Safeguards**:
1. **Daily Alert Budget**: Maximum 10 alerts/day
2. **Weekly Immediate Budget**: Maximum 3 CRITICAL/ERROR alerts/week
3. **Priority Filtering**: Show highest priority first
4. **Progressive Disclosure**: Summary before details

**Methods**:
- `canSendAlert(severity)`: Check if alert can be sent
- `recordAlert(severity, watchdog, source)`: Record alert sent
- `getBudgetStatus()`: Get current budget status
- `resetIfNewDay()`: Reset budget at midnight
- `calculateAlertPriority()`: Calculate priority score (0-100)
- `filterAlertsByBudget()`: Filter alerts when budget limited

**Budget Logic**:
```typescript
Daily Budget:
- Limit: 10 alerts/day
- Resets: Midnight (startOfDay)
- Enforcement: Reject alerts if budget exhausted

Weekly Immediate Budget:
- Limit: 3 CRITICAL/ERROR alerts/week
- Resets: Rolling 7-day window
- Enforcement: Reject CRITICAL/ERROR if budget exhausted
```

**Priority Calculation**:
```typescript
Priority = Severity (0-40) + Customer Impact (0-30) + Operational Risk (0-30)

Severity:
- CRITICAL: 40 points
- ERROR: 30 points
- WARN: 20 points
- INFO: 10 points

Customer Impact:
- SEVERE: 30 points
- MODERATE: 20 points
- MINOR: 10 points
- NONE: 0 points

Operational Risk:
- CRITICAL: 30 points
- HIGH: 20 points
- MEDIUM: 10 points
- LOW: 0 points

Total: 0-100 scale
```

---

## Trust Safeguards Implementation

### Safeguard 1: Alert Budget ✅

**Implementation**: AlertBudgetManagerService

**Rules**:
- Max 10 alerts/day
- Max 3 CRITICAL/week
- Budget resets daily at midnight
- Highest priority alerts sent first

**Monitoring**: Track budget usage, adjust thresholds if needed

---

### Safeguard 2: Cooldown Logic ✅

**Implementation**: CooldownService (existing)

**Rules**:
- Same alert source: cooldown period varies by severity
- CRITICAL: 1-6 hours
- WARN: 4-12 hours
- INFO: 24-72 hours

**Monitoring**: Track cooldown effectiveness

---

### Safeguard 3: Urgency Validation ✅

**Implementation**: Conservative severity thresholds

**Rules**:
- CRITICAL only for severe operational impact
- Staffing <80% coverage = CRITICAL
- Service response >2x standard = CRITICAL
- >5 incidents/day = CRITICAL

**Monitoring**: Track false CRITICAL rate (target <10%)

---

### Safeguard 4: Progressive Disclosure ✅

**Implementation**: AlertBudgetManagerService.filterAlertsByBudget()

**Rules**:
- Show top 10 alerts (sorted by priority)
- CRITICAL alerts always shown first
- Lower priority alerts hidden if budget limited

**Monitoring**: Track click-through rate on alerts

---

### Safeguard 5: Explainability ✅

**Implementation**: Every alert includes

**Required Fields**:
- `why`: Why alert triggered
- `evidence`: What data triggered it
- `operationalImpact` / `customerImpact` / `operationalRisk`: Why it matters
- `recommendedAction`: What to do (specific, actionable)

**Example**:
```
Why: "Shift coverage at 75% (target: >90%). 4 shifts unfilled."
Evidence: [
  "Scheduled shifts: 16",
  "Filled shifts: 12",
  "Open shifts: 4",
  "Coverage rate: 75%"
]
Operational Impact: "Service quality will degrade immediately. Customer wait times will increase. Staff burnout risk."
Recommended Action: "IMMEDIATE ACTION REQUIRED:
1. Call emergency backup staff from nearby locations
2. Approve overtime for current staff
3. Reduce service scope if necessary"
```

---

## Data Sources

### Existing Data Sources ✅

1. **Branch** (locations)
   - Used by: All watchdogs
   - Fields: id, name, isActive

2. **MarketplaceOrder** (service delivery proxy)
   - Used by: ServiceQualityWatchdog
   - Fields: createdAt, updatedAt, status, branchId
   - Purpose: Calculate service response time

---

### Placeholder Data Sources ⚠️

**Note**: These data sources are placeholders. Watchdogs will not generate false alerts until these systems are available.

1. **Scheduling System**
   - Used by: StaffingWatchdog
   - Purpose: Shift coverage, staff availability
   - Status: PLACEHOLDER (returns null)

2. **Time Tracking System**
   - Used by: StaffingWatchdog
   - Purpose: Attendance, overtime hours
   - Status: PLACEHOLDER (returns null)

3. **Complaint Tracking System**
   - Used by: ServiceQualityWatchdog
   - Purpose: Customer complaints
   - Status: PLACEHOLDER (returns null)

4. **Issue Tracking System**
   - Used by: ServiceQualityWatchdog
   - Purpose: Unresolved customer issues
   - Status: PLACEHOLDER (returns null)

5. **Incident Tracking System**
   - Used by: IncidentWatchdog
   - Purpose: Operational incidents
   - Status: PLACEHOLDER (returns null)

6. **Safety Reporting System**
   - Used by: IncidentWatchdog
   - Purpose: Critical safety incidents
   - Status: PLACEHOLDER (returns null)

---

## Integration Points

### Integration 1: Existing Watchdog Infrastructure ✅

**Services Used**:
- CooldownService (prevent duplicate alerts)
- SuppressionService (root cause filtering)
- AlertDeliveryService (email, Slack, dashboard)

**Pattern**: Operational watchdogs follow same pattern as financial watchdogs

---

### Integration 2: Watchdog Types ✅

**Updated**: `src/lib/services/watchdog/types.ts`

**New Watchdog Names**:
- STAFFING
- SERVICE_QUALITY
- INCIDENT

**Interfaces**: WatchdogAlert, WatchdogResult (reused)

---

### Integration 3: Future COO Dashboard ⏳

**Status**: NOT IMPLEMENTED (per stop condition)

**Planned Integration**:
- COO Dashboard will call OperationalAlertEngineService.getActionableInsights()
- Display top operational actions
- Show operational health summary
- Real-time alert feed

---

## Execution Schedule

### Recommended Schedule

**Real-Time Checks** (every 15 minutes):
- Staffing: Shift coverage
- Service Quality: Response time
- Incident: Critical incidents

**Hourly Checks**:
- Staffing: Absenteeism (if data available)
- Service Quality: Complaint velocity (if data available)

**Daily Checks**:
- Incident: Frequency and patterns

**Weekly Checks**:
- Staffing: Overtime pressure
- Service Quality: Unresolved backlog
- Incident: Recurring patterns

---

## Performance Targets

### Response Time

**Target**: Answer "What operational action must happen today?" within 30 seconds

**Measurement**: OperationalAlertEngineService.getActionableInsights() execution time

**Current**: <1 second (with placeholder data)

**Production**: <30 seconds (with real data)

---

### Alert Volume

**Target**: <10 alerts/day (enforced by budget)

**Measurement**: AlertBudgetManagerService.getBudgetStatus()

**Monitoring**: Track daily alert count, adjust thresholds if consistently at limit

---

### Alert Accuracy

**Target**: >80% of alerts are actionable

**Measurement**: COO feedback (future)

**Monitoring**: Track which alerts COO acts on

---

### Urgency Accuracy

**Target**: >90% of CRITICAL alerts require immediate action

**Measurement**: COO response time + feedback (future)

**Monitoring**: Track false CRITICAL rate

---

## Success Criteria

### Criterion 1: Operational Value

**Question**: Does this answer "What operational action must happen today?"

**Measurement**: COO feedback

**Target**: YES (within 30 seconds)

---

### Criterion 2: Trust Score

**Question**: Does COO trust the alerts?

**Measurement**: Monthly survey (future)

**Target**: >85/100

---

### Criterion 3: Alert Accuracy

**Question**: Are alerts actionable?

**Measurement**: Action taken rate

**Target**: >80%

---

### Criterion 4: No Alert Fatigue

**Question**: Is COO overwhelmed by alerts?

**Measurement**: Alert volume, COO feedback

**Target**: <10 alerts/day, no complaints

---

### Criterion 5: Adoption

**Question**: Does COO use the system daily?

**Measurement**: Login frequency (future)

**Target**: Daily usage

---

## Constraints Honored

### ✅ Minimum Scope

- Built only 3 watchdogs (not 7)
- No COO Dashboard UI
- No additional watchdogs
- No Benchmark Network
- No Revenue Coach
- No Digital Twin

---

### ✅ Deterministic Intelligence

- No ML
- No forecasting
- No AI
- No generative recommendations
- Rule-based thresholds only
- Simple arithmetic

---

### ✅ Operational Focus

- No CEO metrics
- No CFO metrics
- No financial metrics
- No strategic metrics
- Operational signals only

---

### ✅ Trust Safeguards

- Alert budget (max 10/day)
- Cooldown logic
- Urgency validation
- Progressive disclosure
- Explainability

---

## Next Steps (NOT PART OF THIS PHASE)

### Stop Condition ✅

**Per mission requirements**:
- ✅ DO NOT proceed to COO Dashboard UI
- ✅ DO NOT proceed to additional watchdogs
- ✅ DO NOT proceed to Benchmark Network
- ✅ DO NOT proceed to Revenue Coach
- ✅ Return for validation review first

---

### Future Phases (After Validation)

**Phase 1.2E-C**: COO Dashboard UI (if approved)
- Real-time operational health widget
- Priority action list
- Location performance matrix
- Incident feed

**Phase 1.2E-D**: Additional Watchdogs (if needed)
- Location Health Watchdog
- Equipment Health Watchdog
- Compliance Watchdog
- Inventory Watchdog

---

## Summary

### Architecture Complete ✅

**Components**: 5
1. ✅ StaffingWatchdog
2. ✅ ServiceQualityWatchdog
3. ✅ IncidentWatchdog
4. ✅ OperationalAlertEngine
5. ✅ AlertBudgetManager

**Trust Safeguards**: 5
1. ✅ Alert Budget
2. ✅ Cooldown Logic
3. ✅ Urgency Validation
4. ✅ Progressive Disclosure
5. ✅ Explainability

**Constraints Honored**: 5
1. ✅ Minimum scope (3 watchdogs only)
2. ✅ Deterministic intelligence (no ML/AI)
3. ✅ Operational focus (no CEO/CFO metrics)
4. ✅ Trust-first design
5. ✅ Stop condition (no UI, no expansion)

---

**Phase 1.2E-B Architecture: COMPLETE** ✅

**Status**: Ready for implementation report and validation review

**Next**: Create PHASE_1.2E-B_IMPLEMENTATION_REPORT.md
