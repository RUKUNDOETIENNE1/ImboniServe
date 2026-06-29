# COO Priority Engine Architecture

**Document Version**: 1.0  
**Phase**: 1.2E-A COO Intelligence Architecture & Reality Design Review  
**Date**: June 24, 2026  
**Role**: Decision Intelligence Architect  

---

## Executive Summary

**Mission**: Design a COO equivalent of Financial Priorities for operations

**Approach**: Deterministic priority engine (NO ML/AI)

**Finding**: Operational priorities differ fundamentally from financial priorities

**Status**: Architecture only (no implementation)

---

## Priority Engine Philosophy

### CFO Priority Engine (Existing)

**Focus**: Financial materiality

**Inputs**: Revenue impact, financial risk, compliance

**Output**: Ranked financial issues

**Sorting**: By dollar impact + severity

**Example**:
1. Payment failure ($90K/month revenue loss) - CRITICAL
2. MRR decline ($52K/year impact) - WARNING
3. Concentration risk ($780K catastrophic) - CRITICAL

---

### COO Priority Engine (Proposed)

**Focus**: Operational impact

**Inputs**: Service impact, customer impact, staff impact, brand risk

**Output**: Ranked operational issues

**Sorting**: By operational severity + urgency + scope

**Example**:
1. Shift coverage gap (immediate service impact) - CRITICAL
2. Recurring safety incidents (brand risk) - CRITICAL
3. Location performance decline (quality issue) - WARNING

**Key Difference**: COO priorities are time-sensitive, CFO priorities are impact-sized

---

## Priority Dimensions

### Dimension 1: Operational Severity

**Definition**: How badly does this impact operations?

**Levels**:
- **CRITICAL**: Service stopped or severe quality degradation
- **WARNING**: Service degraded or quality at risk
- **INFO**: Minor issue or early warning
- **POSITIVE**: Opportunity for improvement

**Examples**:
- CRITICAL: Kitchen equipment failure, no backup
- WARNING: Service response time 1.5x standard
- INFO: Compliance checklist completion 88%
- POSITIVE: Location exceeding quality standards

---

### Dimension 2: Urgency (Time Sensitivity)

**Definition**: How quickly must COO act?

**Levels**:
- **IMMEDIATE**: <1 hour (service impact happening now)
- **SAME_DAY**: 1-8 hours (will impact today's service)
- **THIS_WEEK**: 1-7 days (will impact this week)
- **THIS_MONTH**: 1-30 days (will impact this month)

**Examples**:
- IMMEDIATE: Shift coverage gap for current shift
- SAME_DAY: Equipment failure during service hours
- THIS_WEEK: Recurring incident pattern detected
- THIS_MONTH: Location performance declining

---

### Dimension 3: Scope (Impact Breadth)

**Definition**: How many customers/locations affected?

**Levels**:
- **SYSTEM_WIDE**: All locations affected
- **MULTI_LOCATION**: 2+ locations affected
- **SINGLE_LOCATION**: One location affected
- **SINGLE_INCIDENT**: Isolated issue

**Examples**:
- SYSTEM_WIDE: Payment provider outage
- MULTI_LOCATION: Vendor delivery failure to 3 locations
- SINGLE_LOCATION: Location A staffing shortage
- SINGLE_INCIDENT: One customer complaint

---

### Dimension 4: Customer Impact

**Definition**: How does this affect customer experience?

**Levels**:
- **SEVERE**: Service stopped or major quality failure
- **MODERATE**: Service delayed or quality degraded
- **MINOR**: Slight inconvenience
- **NONE**: Internal issue, no customer impact

**Examples**:
- SEVERE: Kitchen closed, can't serve food
- MODERATE: 30-minute wait time
- MINOR: Slight service delay
- NONE: Reconciliation backlog (internal)

---

### Dimension 5: Brand Risk

**Definition**: What is the reputation/legal risk?

**Levels**:
- **CRITICAL**: Legal liability or severe brand damage
- **HIGH**: Significant reputation risk
- **MEDIUM**: Moderate reputation risk
- **LOW**: Minimal reputation risk

**Examples**:
- CRITICAL: Safety incident, health violation
- HIGH: Multiple negative reviews, social media escalation
- MEDIUM: Customer complaints, service failures
- LOW: Internal process issues

---

### Dimension 6: Staff Impact

**Definition**: How does this affect staff?

**Levels**:
- **SEVERE**: Staff safety risk or mass burnout
- **MODERATE**: Staff stress or morale impact
- **MINOR**: Slight inconvenience
- **NONE**: No staff impact

**Examples**:
- SEVERE: Unsafe working conditions
- MODERATE: Excessive overtime, understaffing
- MINOR: Schedule adjustment needed
- NONE: Equipment maintenance (no staff impact)

---

## Priority Calculation Algorithm

### Step 1: Calculate Base Priority Score (0-100)

**Formula**:
```
Base Priority = (Severity Weight × Severity Score) +
                (Urgency Weight × Urgency Score) +
                (Scope Weight × Scope Score) +
                (Customer Impact Weight × Customer Score) +
                (Brand Risk Weight × Brand Score) +
                (Staff Impact Weight × Staff Score)
```

**Weights** (total = 100):
- Severity: 25
- Urgency: 25
- Scope: 15
- Customer Impact: 20
- Brand Risk: 10
- Staff Impact: 5

**Scores** (0-100 per dimension):
- CRITICAL/IMMEDIATE/SEVERE: 100
- WARNING/SAME_DAY/HIGH/MODERATE: 70
- INFO/THIS_WEEK/MEDIUM/MINOR: 40
- POSITIVE/THIS_MONTH/LOW/NONE: 10

---

### Step 2: Apply Urgency Multiplier

**Rule**: Time-sensitive issues get priority boost

**Multiplier**:
- IMMEDIATE: 1.3x
- SAME_DAY: 1.15x
- THIS_WEEK: 1.0x
- THIS_MONTH: 0.9x

**Rationale**: COO must handle immediate issues first, even if lower severity

---

### Step 3: Apply Scope Multiplier

**Rule**: Wider impact gets priority boost

**Multiplier**:
- SYSTEM_WIDE: 1.2x
- MULTI_LOCATION: 1.1x
- SINGLE_LOCATION: 1.0x
- SINGLE_INCIDENT: 0.95x

**Rationale**: Issues affecting multiple locations require faster intervention

---

### Step 4: Apply Brand Risk Boost

**Rule**: Legal/brand risk issues get immediate elevation

**Boost**:
- CRITICAL brand risk: +20 points
- HIGH brand risk: +10 points
- MEDIUM brand risk: +5 points
- LOW brand risk: +0 points

**Rationale**: Brand damage is irreversible, must prevent

---

### Step 5: Normalize to 0-100 Scale

**Formula**:
```
Final Priority = min(100, Base Priority × Urgency Multiplier × Scope Multiplier + Brand Boost)
```

---

## Priority Calculation Examples

### Example 1: Shift Coverage Gap

**Inputs**:
- Severity: CRITICAL (100)
- Urgency: IMMEDIATE (100)
- Scope: SINGLE_LOCATION (50)
- Customer Impact: SEVERE (100)
- Brand Risk: MEDIUM (40)
- Staff Impact: MODERATE (70)

**Calculation**:
```
Base = (25×100) + (25×100) + (15×50) + (20×100) + (10×40) + (5×70)
     = 2500 + 2500 + 750 + 2000 + 400 + 350
     = 8500 / 100 = 85

Urgency Multiplier = 1.3 (IMMEDIATE)
Scope Multiplier = 1.0 (SINGLE_LOCATION)
Brand Boost = +5 (MEDIUM)

Final = min(100, 85 × 1.3 × 1.0 + 5)
      = min(100, 110.5 + 5)
      = 100
```

**Priority**: 100 (CRITICAL)

**Rationale**: Immediate service impact, must act now

---

### Example 2: Recurring Incident Pattern

**Inputs**:
- Severity: WARNING (70)
- Urgency: THIS_WEEK (40)
- Scope: SINGLE_LOCATION (50)
- Customer Impact: MODERATE (70)
- Brand Risk: HIGH (70)
- Staff Impact: MINOR (40)

**Calculation**:
```
Base = (25×70) + (25×40) + (15×50) + (20×70) + (10×70) + (5×40)
     = 1750 + 1000 + 750 + 1400 + 700 + 200
     = 5800 / 100 = 58

Urgency Multiplier = 1.0 (THIS_WEEK)
Scope Multiplier = 1.0 (SINGLE_LOCATION)
Brand Boost = +10 (HIGH)

Final = min(100, 58 × 1.0 × 1.0 + 10)
      = 68
```

**Priority**: 68 (WARNING)

**Rationale**: Not immediate, but brand risk requires attention this week

---

### Example 3: Equipment Maintenance Due

**Inputs**:
- Severity: INFO (40)
- Urgency: THIS_MONTH (10)
- Scope: SINGLE_LOCATION (50)
- Customer Impact: NONE (10)
- Brand Risk: LOW (10)
- Staff Impact: NONE (10)

**Calculation**:
```
Base = (25×40) + (25×10) + (15×50) + (20×10) + (10×10) + (5×10)
     = 1000 + 250 + 750 + 200 + 100 + 50
     = 2350 / 100 = 23.5

Urgency Multiplier = 0.9 (THIS_MONTH)
Scope Multiplier = 1.0 (SINGLE_LOCATION)
Brand Boost = +0 (LOW)

Final = min(100, 23.5 × 0.9 × 1.0 + 0)
      = 21
```

**Priority**: 21 (INFO)

**Rationale**: Low priority, schedule when convenient

---

### Example 4: System-Wide Payment Outage

**Inputs**:
- Severity: CRITICAL (100)
- Urgency: IMMEDIATE (100)
- Scope: SYSTEM_WIDE (100)
- Customer Impact: SEVERE (100)
- Brand Risk: CRITICAL (100)
- Staff Impact: MODERATE (70)

**Calculation**:
```
Base = (25×100) + (25×100) + (15×100) + (20×100) + (10×100) + (5×70)
     = 2500 + 2500 + 1500 + 2000 + 1000 + 350
     = 9850 / 100 = 98.5

Urgency Multiplier = 1.3 (IMMEDIATE)
Scope Multiplier = 1.2 (SYSTEM_WIDE)
Brand Boost = +20 (CRITICAL)

Final = min(100, 98.5 × 1.3 × 1.2 + 20)
      = min(100, 153.66 + 20)
      = 100
```

**Priority**: 100 (CRITICAL)

**Rationale**: Maximum priority, all-hands response

---

## Priority Categories

### Category 1: Emergency Response (95-100)

**Characteristics**:
- CRITICAL severity
- IMMEDIATE urgency
- Significant customer/brand impact

**COO Action**: Drop everything, respond immediately

**Examples**:
- Shift coverage gap (current shift)
- Safety incident
- System-wide outage
- Health violation

**Response Time**: <15 minutes

**Escalation**: May require CEO/CFO involvement

---

### Category 2: Urgent Intervention (80-94)

**Characteristics**:
- CRITICAL or WARNING severity
- IMMEDIATE or SAME_DAY urgency
- Moderate to high impact

**COO Action**: Prioritize today, delegate if needed

**Examples**:
- Equipment failure during service
- Multiple customer complaints
- Location performance crisis
- Recurring incident pattern

**Response Time**: <1 hour

**Escalation**: COO handles, may inform CEO/CFO

---

### Category 3: Proactive Management (60-79)

**Characteristics**:
- WARNING severity
- THIS_WEEK urgency
- Moderate impact

**COO Action**: Address this week, plan intervention

**Examples**:
- Quality trend deterioration
- Staffing shortage (not immediate)
- Vendor performance issues
- Compliance gaps

**Response Time**: <1 day

**Escalation**: COO handles independently

---

### Category 4: Continuous Improvement (40-59)

**Characteristics**:
- INFO severity
- THIS_WEEK or THIS_MONTH urgency
- Minor impact

**COO Action**: Schedule for improvement, not urgent

**Examples**:
- Process optimization opportunities
- Training needs
- Equipment maintenance
- Standard updates

**Response Time**: <1 week

**Escalation**: Delegate to managers

---

### Category 5: Monitoring (0-39)

**Characteristics**:
- INFO or POSITIVE severity
- THIS_MONTH urgency
- Minimal impact

**COO Action**: Monitor, no immediate action

**Examples**:
- Positive performance trends
- Early warning signals
- Long-term improvement opportunities

**Response Time**: <1 month

**Escalation**: Track, no action needed

---

## Priority Engine Architecture

### Component 1: Issue Detection

**Responsibility**: Detect operational issues from watchdogs

**Inputs**:
- Watchdog statuses
- Operational metrics
- Incident logs
- Performance data

**Output**: List of detected issues

---

### Component 2: Issue Scoring

**Responsibility**: Calculate priority score for each issue

**Process**:
1. Determine severity level
2. Determine urgency level
3. Determine scope level
4. Determine customer impact
5. Determine brand risk
6. Determine staff impact
7. Calculate base priority
8. Apply multipliers and boosts
9. Normalize to 0-100

**Output**: Scored issues

---

### Component 3: Issue Ranking

**Responsibility**: Sort issues by priority

**Sorting**:
1. Primary: Priority score (descending)
2. Secondary: Urgency (IMMEDIATE first)
3. Tertiary: Scope (SYSTEM_WIDE first)

**Output**: Ranked priority list

---

### Component 4: Action Recommendation

**Responsibility**: Suggest actions for each issue

**Logic**:
- Map issue type to action playbook
- Consider context (location, time, resources)
- Provide specific, actionable recommendations

**Output**: Issue + recommended action

---

### Component 5: Escalation Routing

**Responsibility**: Determine if issue requires escalation

**Rules**:
- Priority >95 + Brand Risk CRITICAL → CEO
- Priority >90 + Financial Impact >$100K → CFO
- Priority >80 → COO immediate attention
- Priority <80 → COO dashboard only

**Output**: Escalation notifications

---

## Priority Engine Data Model

### OperationalIssue Interface

```typescript
interface OperationalIssue {
  id: string
  type: IssueType
  title: string
  description: string
  
  // Dimensions
  severity: 'CRITICAL' | 'WARNING' | 'INFO' | 'POSITIVE'
  urgency: 'IMMEDIATE' | 'SAME_DAY' | 'THIS_WEEK' | 'THIS_MONTH'
  scope: 'SYSTEM_WIDE' | 'MULTI_LOCATION' | 'SINGLE_LOCATION' | 'SINGLE_INCIDENT'
  customerImpact: 'SEVERE' | 'MODERATE' | 'MINOR' | 'NONE'
  brandRisk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  staffImpact: 'SEVERE' | 'MODERATE' | 'MINOR' | 'NONE'
  
  // Priority calculation
  basePriority: number  // 0-100
  urgencyMultiplier: number
  scopeMultiplier: number
  brandBoost: number
  finalPriority: number  // 0-100
  
  // Context
  affectedLocations?: string[]
  affectedCustomers?: number
  detectedAt: Date
  
  // Action
  recommendedAction: string
  actionPlaybook?: string
  estimatedResolutionTime?: string
  
  // Escalation
  requiresEscalation: boolean
  escalateTo?: 'CEO' | 'CFO' | 'COO'
}
```

---

### IssueType Enum

```typescript
type IssueType =
  | 'SHIFT_COVERAGE_GAP'
  | 'SERVICE_QUALITY_DECLINE'
  | 'INCIDENT_FREQUENCY_HIGH'
  | 'EQUIPMENT_FAILURE'
  | 'COMPLIANCE_VIOLATION'
  | 'LOCATION_PERFORMANCE_DECLINE'
  | 'RECURRING_INCIDENT_PATTERN'
  | 'QUEUE_BOTTLENECK'
  | 'INVENTORY_STOCKOUT'
  | 'STAFF_TURNOVER_RISK'
  | 'VENDOR_PERFORMANCE_ISSUE'
  | 'PAYMENT_SYSTEM_DEGRADATION'
```

---

## Action Playbooks

### Playbook 1: Shift Coverage Gap

**Trigger**: Shift coverage <80% or >3 open shifts

**Immediate Actions**:
1. Check staff availability at other locations
2. Approve overtime for current staff
3. Call emergency backup staff
4. Reduce service scope if necessary

**Same-Day Actions**:
1. Post shift to staff pool
2. Offer shift incentives
3. Adjust schedule for tomorrow

**This-Week Actions**:
1. Review scheduling process
2. Identify chronic coverage gaps
3. Hire additional staff if needed

---

### Playbook 2: Equipment Failure

**Trigger**: Critical equipment down

**Immediate Actions**:
1. Assess service impact
2. Activate backup equipment if available
3. Call maintenance/vendor
4. Communicate to customers if needed

**Same-Day Actions**:
1. Arrange repair or replacement
2. Adjust service offering
3. Document incident

**This-Week Actions**:
1. Review equipment maintenance schedule
2. Identify preventive maintenance needs
3. Consider equipment redundancy

---

### Playbook 3: Recurring Incident Pattern

**Trigger**: Same incident type >3x in 30 days

**Immediate Actions**:
1. Document pattern
2. Identify common factors
3. Alert location manager

**Same-Day Actions**:
1. Conduct root cause analysis
2. Develop corrective action plan
3. Assign owner

**This-Week Actions**:
1. Implement corrective actions
2. Monitor for recurrence
3. Update procedures if needed

---

## Priority Engine Integration

### Integration 1: Watchdog Services

**Flow**:
1. Watchdog detects issue
2. Watchdog creates OperationalIssue
3. Priority Engine scores issue
4. Priority Engine ranks issue
5. Priority Engine recommends action

---

### Integration 2: COO Dashboard

**Display**:
- Top 10 priorities (sorted by score)
- Category breakdown (Emergency, Urgent, Proactive, etc.)
- Location-specific priorities
- Trend: priorities increasing/decreasing

---

### Integration 3: Alert System

**Routing**:
- Priority >95 → Push notification + SMS
- Priority 80-94 → Push notification
- Priority 60-79 → Dashboard alert
- Priority <60 → Dashboard only

---

## Summary

### Priority Engine Architecture: COMPLETE ✅

**Components**: 5
1. ✅ Issue Detection
2. ✅ Issue Scoring
3. ✅ Issue Ranking
4. ✅ Action Recommendation
5. ✅ Escalation Routing

**Dimensions**: 6
1. ✅ Operational Severity
2. ✅ Urgency (Time Sensitivity)
3. ✅ Scope (Impact Breadth)
4. ✅ Customer Impact
5. ✅ Brand Risk
6. ✅ Staff Impact

**Priority Categories**: 5
1. ✅ Emergency Response (95-100)
2. ✅ Urgent Intervention (80-94)
3. ✅ Proactive Management (60-79)
4. ✅ Continuous Improvement (40-59)
5. ✅ Monitoring (0-39)

---

### Key Differences from CFO Priority Engine

| Aspect | CFO Engine | COO Engine |
|--------|------------|------------|
| **Focus** | Financial impact | Operational impact |
| **Primary Dimension** | Dollar amount | Time sensitivity |
| **Sorting** | Revenue at risk | Urgency + severity |
| **Horizon** | Weeks to months | Minutes to days |
| **Escalation** | Financial threshold | Brand/safety risk |

---

### Key Insights

**Insight 1**: COO priorities are time-sensitive
- Urgency multiplier is critical
- Immediate issues get priority boost
- Can't wait for monthly review

**Insight 2**: COO priorities are multi-dimensional
- Not just severity
- Customer impact, brand risk, staff impact all matter
- Holistic operational view

**Insight 3**: COO priorities require action playbooks
- Not enough to know priority
- Must know what to do
- Context-specific recommendations

---

**COO Priority Engine Architecture: COMPLETE** ✅

**Status**: Architecture defined, ready for implementation

**Next**: COO Trustworthiness Review
