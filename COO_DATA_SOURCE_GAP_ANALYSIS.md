# COO Data Source Gap Analysis

**Phase**: 1.2E-C Reality Validation Review  
**Date**: June 24, 2026  
**Role**: Decision Intelligence Auditor  
**Status**: ✅ **ANALYSIS COMPLETE**  

---

## Executive Summary

**Mission**: Identify which signals use real data vs. placeholder data

**Finding**: **1 of 9 checks functional** (11% operational)

**Data Source Status**: 🔴 **CRITICAL GAPS**

**Recommendation**: Prioritize data source integration before dashboard UI

---

## Data Source Classification

### GREEN: Real Data Available ✅

**Definition**: Signal uses existing database tables, no placeholder

**Characteristics**:
- Data source exists today
- No integration required
- Watchdog can function immediately
- Operational value delivered now

---

### YELLOW: Partial Data Available ⚠️

**Definition**: Signal uses proxy data or incomplete data source

**Characteristics**:
- Data source exists but not ideal
- Integration would improve accuracy
- Watchdog can function with limitations
- Operational value delivered but suboptimal

---

### RED: No Data Available ❌

**Definition**: Signal requires data source that doesn't exist

**Characteristics**:
- Data source missing entirely
- Watchdog returns null (no alerts)
- No operational value until integrated
- Integration required for functionality

---

## Watchdog 1: Staffing Watchdog

### Check 1.1: Shift Coverage Gaps

**Status**: 🔴 **RED** (No Data Available)

**Required Data**:
- Scheduled shifts per location per day
- Filled shifts per location per day
- Open shifts per location per day
- Staff assignments

**Current Data Source**: ❌ **NONE** (placeholder returns null)

**Placeholder Implementation**:
```typescript
private static async getShiftCoverageData(locationId: string): Promise<ShiftCoverageData | null> {
  // Placeholder implementation
  // In production, query actual scheduling system
  return null // Prevents false alerts
}
```

**Required Integration**:
- **System**: Scheduling/workforce management system
- **Examples**: When I Work, Deputy, 7shifts, Homebase, Shiftboard
- **Data Needed**:
  - Shift schedule (date, time, location, role)
  - Shift assignments (staff assigned to shift)
  - Shift status (filled, open, pending)
  - Staff availability

**Integration Complexity**: 🟡 **MEDIUM**
- Most scheduling systems have APIs
- Standard data model (shifts, assignments, staff)
- Real-time or near-real-time data available

**Alternative**: Build internal scheduling system
- **Complexity**: 🔴 **HIGH**
- **Timeline**: 8-12 weeks
- **Recommendation**: Integrate with existing system (faster)

**Operational Impact if Missing**: 🔴 **CRITICAL**
- Cannot detect staffing shortages
- Cannot prevent service degradation
- Manual monitoring required

**Priority**: 🔴 **CRITICAL** (P0)

---

### Check 1.2: Absenteeism Patterns

**Status**: 🔴 **RED** (No Data Available)

**Required Data**:
- Scheduled staff per location per day
- Actual attendance per location per day
- Last-minute callouts
- Absence reasons (optional)

**Current Data Source**: ❌ **NONE** (placeholder returns null)

**Placeholder Implementation**:
```typescript
private static async getAbsenteeismData(locationId: string): Promise<AbsenteeismData | null> {
  // Placeholder implementation
  return null
}
```

**Required Integration**:
- **System**: Time tracking/attendance system
- **Examples**: ADP, Paychex, Kronos, TimeClock Plus, BambooHR
- **Data Needed**:
  - Scheduled shifts (from scheduling system)
  - Clock-in/clock-out records
  - Absence records (callouts, no-shows)
  - Absence timestamps (last-minute vs. advance notice)

**Integration Complexity**: 🟡 **MEDIUM**
- Most time tracking systems have APIs
- May require combining scheduling + time tracking data
- Data may be delayed (not real-time)

**Alternative**: Use scheduling system absence tracking
- **Complexity**: 🟢 **LOW**
- **Timeline**: 2-3 weeks
- **Limitation**: May not capture no-shows (only scheduled absences)

**Operational Impact if Missing**: 🔴 **CRITICAL**
- Cannot detect absenteeism patterns
- Cannot identify staffing instability
- Manual monitoring required

**Priority**: 🔴 **CRITICAL** (P0)

---

### Check 1.3: Overtime Pressure

**Status**: 🔴 **RED** (No Data Available)

**Required Data**:
- Total hours worked per location per week
- Overtime hours per location per week
- Staff count per location
- Regular vs. overtime classification

**Current Data Source**: ❌ **NONE** (placeholder returns null)

**Placeholder Implementation**:
```typescript
private static async getOvertimeData(locationId: string): Promise<{...} | null> {
  // Placeholder implementation
  return null
}
```

**Required Integration**:
- **System**: Time tracking or payroll system
- **Examples**: ADP, Paychex, Kronos, Gusto, QuickBooks Payroll
- **Data Needed**:
  - Clock-in/clock-out records
  - Hours worked (regular + overtime)
  - Staff count
  - Overtime classification rules

**Integration Complexity**: 🟡 **MEDIUM**
- Payroll systems have APIs but may be restricted (PII concerns)
- Time tracking systems easier to integrate
- Data may be delayed (weekly batch)

**Alternative**: Calculate from time tracking data
- **Complexity**: 🟢 **LOW**
- **Timeline**: 2-3 weeks
- **Limitation**: Requires overtime classification logic

**Operational Impact if Missing**: 🟡 **HIGH**
- Cannot detect overtime pressure
- Cannot prevent staff burnout
- Manual monitoring required

**Priority**: 🟡 **HIGH** (P1)

---

### Staffing Watchdog Summary

| Check | Status | Priority | Integration Complexity |
|-------|--------|----------|------------------------|
| Shift Coverage | 🔴 RED | P0 CRITICAL | MEDIUM |
| Absenteeism | 🔴 RED | P0 CRITICAL | MEDIUM |
| Overtime | 🔴 RED | P1 HIGH | MEDIUM |

**Overall Status**: 🔴 **RED** (0/3 checks functional)

**Recommended Integration**:
1. Scheduling system (enables shift coverage + absenteeism)
2. Time tracking system (enables absenteeism + overtime)

**Timeline**: 4-6 weeks (both integrations)

---

## Watchdog 2: Service Quality Watchdog

### Check 2.1: Service Response Time Degradation

**Status**: 🟢 **GREEN** (Real Data Available)

**Required Data**:
- Order creation time
- Order completion time
- Order status
- Location

**Current Data Source**: ✅ **MarketplaceOrder** (existing table)

**Implementation**:
```typescript
const orders = await prisma.marketplaceOrder.findMany({
  where: {
    branchId: location.id,
    createdAt: { gte: fourHoursAgo },
    status: { in: ['COMPLETED', 'DELIVERED'] },
  },
  select: {
    createdAt: true,
    updatedAt: true,
  },
})
```

**Data Quality**: ✅ **GOOD**
- Real-time data (orders created/updated immediately)
- Accurate timestamps
- Location-specific
- Status filtering prevents incomplete orders

**Limitations**:
- ⚠️ Standard response time hardcoded (15 minutes)
- ⚠️ Assumes updatedAt = completion time (may not be exact)
- ⚠️ Minimum 5 orders required (low-volume locations may not trigger)

**Operational Impact**: ✅ **FUNCTIONAL**
- Can detect service delays today
- Provides immediate operational value
- No integration required

**Priority**: ✅ **COMPLETE** (P0)

**Improvements Needed**:
1. Make standard response time configurable per location type
2. Add explicit completion timestamp (not just updatedAt)
3. Lower minimum sample size for low-volume locations (optional)

---

### Check 2.2: Customer Complaint Velocity

**Status**: 🔴 **RED** (No Data Available)

**Required Data**:
- Complaint count per location per day
- Complaint timestamps
- Complaint severity (optional)
- Complaint trends (today vs. yesterday vs. 2 days ago)

**Current Data Source**: ❌ **NONE** (placeholder returns null)

**Placeholder Implementation**:
```typescript
// In production, query complaint tracking system
// For now, skip to avoid false alerts
```

**Required Integration**:
- **System**: Complaint/feedback tracking system
- **Examples**: Zendesk, Freshdesk, Help Scout, custom CRM
- **Data Needed**:
  - Complaint records (date, location, type, severity)
  - Complaint source (in-person, phone, email, review sites)
  - Complaint status (open, resolved)

**Integration Complexity**: 🟡 **MEDIUM**
- May require multiple integrations (review sites, CRM, feedback forms)
- Data may be fragmented across systems
- Manual complaints may not be tracked

**Alternative**: Build internal complaint tracking
- **Complexity**: 🟢 **LOW**
- **Timeline**: 2-3 weeks
- **Recommendation**: Start simple (manual entry), integrate later

**Operational Impact if Missing**: 🟡 **MEDIUM**
- Cannot detect complaint surges
- Service response time check provides early warning (compensates)
- Manual monitoring required

**Priority**: 🟡 **MEDIUM** (P2)

**Note**: Complaints are lagging indicators (damage may already be done). Service response time is a better leading indicator.

---

### Check 2.3: Unresolved Issue Backlog

**Status**: 🔴 **RED** (No Data Available)

**Required Data**:
- Unresolved issue count per location
- Average resolution time
- Issue age (oldest unresolved)
- Issue priority

**Current Data Source**: ❌ **NONE** (placeholder returns null)

**Placeholder Implementation**:
```typescript
// In production, query issue tracking system
// For now, skip to avoid false alerts
```

**Required Integration**:
- **System**: Issue/ticket tracking system
- **Examples**: Jira, Linear, Asana, Trello, custom ticketing
- **Data Needed**:
  - Issue records (date created, location, status, priority)
  - Resolution timestamps
  - Issue assignment

**Integration Complexity**: 🟡 **MEDIUM**
- Most issue tracking systems have APIs
- May need to filter for customer-facing issues (not internal tasks)
- Resolution time calculation required

**Alternative**: Use complaint tracking system
- **Complexity**: 🟢 **LOW**
- **Timeline**: 1-2 weeks
- **Limitation**: Only tracks complaints, not all issues

**Operational Impact if Missing**: 🟢 **LOW**
- Backlog is a lagging indicator
- Service response time and complaints provide earlier signals
- Manual monitoring acceptable

**Priority**: 🟢 **LOW** (P3)

---

### Service Quality Watchdog Summary

| Check | Status | Priority | Integration Complexity |
|-------|--------|----------|------------------------|
| Response Time | 🟢 GREEN | COMPLETE | N/A |
| Complaints | 🔴 RED | P2 MEDIUM | MEDIUM |
| Backlog | 🔴 RED | P3 LOW | MEDIUM |

**Overall Status**: 🟡 **YELLOW** (1/3 checks functional)

**Recommended Integration**:
1. ✅ Response time check already functional (no action needed)
2. Complaint tracking system (enables complaint velocity)
3. Issue tracking system (enables backlog detection) - optional

**Timeline**: 2-4 weeks (complaint tracking)

---

## Watchdog 3: Incident Watchdog

### Check 3.1: Incident Frequency

**Status**: 🔴 **RED** (No Data Available)

**Required Data**:
- Incident count per location per day
- Incident severity (critical vs. non-critical)
- Incident type
- Incident timestamps

**Current Data Source**: ❌ **NONE** (placeholder returns null)

**Placeholder Implementation**:
```typescript
private static async getIncidentData(locationId: string, startDate: Date, endDate: Date): Promise<IncidentData | null> {
  // Placeholder implementation
  return null
}
```

**Required Integration**:
- **System**: Incident tracking/reporting system
- **Examples**: Custom incident log, safety reporting system, operations log
- **Data Needed**:
  - Incident records (date, location, type, severity)
  - Incident classification (safety, quality, service, equipment)
  - Incident status (open, resolved)

**Integration Complexity**: 🔴 **HIGH**
- May not exist (many hospitality businesses track manually)
- No standard system (varies by organization)
- May require building custom incident tracking

**Alternative**: Build internal incident tracking
- **Complexity**: 🟡 **MEDIUM**
- **Timeline**: 3-4 weeks
- **Recommendation**: Start with simple form + database

**Operational Impact if Missing**: 🔴 **CRITICAL**
- Cannot detect incident surges
- Cannot identify operational instability
- Manual monitoring required

**Priority**: 🔴 **CRITICAL** (P0)

---

### Check 3.2: Recurring Incident Patterns

**Status**: 🔴 **RED** (No Data Available)

**Required Data**:
- Incident records (7-day window)
- Incident type classification
- Incident count by type
- Incident recurrence detection

**Current Data Source**: ❌ **NONE** (same as incident frequency)

**Required Integration**: Same as incident frequency

**Integration Complexity**: 🔴 **HIGH** (same as incident frequency)

**Operational Impact if Missing**: 🔴 **CRITICAL**
- Cannot detect systemic issues
- Cannot identify recurring failures
- Manual pattern detection required

**Priority**: 🔴 **CRITICAL** (P0)

**Note**: This is the MOST VALUABLE check (world-class operational intelligence). High priority to enable.

---

### Check 3.3: Critical Incident Detection

**Status**: 🔴 **RED** (No Data Available)

**Required Data**:
- Incident severity classification
- Critical incident flags (safety, legal, severe quality)
- Incident escalation status

**Current Data Source**: ❌ **NONE** (same as incident frequency)

**Required Integration**: Same as incident frequency

**Integration Complexity**: 🔴 **HIGH** (same as incident frequency)

**Operational Impact if Missing**: 🔴 **CRITICAL**
- Cannot detect critical incidents
- Safety/legal risks undetected
- Manual escalation required

**Priority**: 🔴 **CRITICAL** (P0)

---

### Incident Watchdog Summary

| Check | Status | Priority | Integration Complexity |
|-------|--------|----------|------------------------|
| Frequency | 🔴 RED | P0 CRITICAL | HIGH |
| Patterns | 🔴 RED | P0 CRITICAL | HIGH |
| Critical | 🔴 RED | P0 CRITICAL | HIGH |

**Overall Status**: 🔴 **RED** (0/3 checks functional)

**Recommended Integration**:
1. Build internal incident tracking system (no existing system available)
2. Start simple: Form + database + basic classification
3. Iterate: Add severity, type, escalation logic

**Timeline**: 3-4 weeks (custom build)

---

## Overall Data Source Status

### Summary by Watchdog

| Watchdog | Functional Checks | Total Checks | Status |
|----------|-------------------|--------------|--------|
| **Staffing** | 0 | 3 | 🔴 RED (0%) |
| **Service Quality** | 1 | 3 | 🟡 YELLOW (33%) |
| **Incident** | 0 | 3 | 🔴 RED (0%) |

**Overall**: 🔴 **RED** (1/9 checks functional = 11%)

---

### Summary by Data Source

| Data Source | Status | Checks Enabled | Priority |
|-------------|--------|----------------|----------|
| **MarketplaceOrder** | 🟢 GREEN | 1 (Response Time) | COMPLETE |
| **Scheduling System** | 🔴 RED | 2 (Shift Coverage, Absenteeism) | P0 CRITICAL |
| **Time Tracking** | 🔴 RED | 2 (Absenteeism, Overtime) | P0 CRITICAL |
| **Incident Tracking** | 🔴 RED | 3 (All Incident checks) | P0 CRITICAL |
| **Complaint Tracking** | 🔴 RED | 1 (Complaint Velocity) | P2 MEDIUM |
| **Issue Tracking** | 🔴 RED | 1 (Backlog) | P3 LOW |

---

## Data Source Integration Priorities

### Priority 0 (CRITICAL) - Blocks Core Functionality

**Must Have Before Production**:

1. **Scheduling System Integration**
   - **Enables**: Shift coverage detection, absenteeism detection
   - **Impact**: 2 checks (22% of total)
   - **Complexity**: MEDIUM
   - **Timeline**: 2-3 weeks
   - **Recommendation**: Integrate with existing system (When I Work, Deputy, 7shifts)

2. **Time Tracking System Integration**
   - **Enables**: Absenteeism detection, overtime detection
   - **Impact**: 2 checks (22% of total)
   - **Complexity**: MEDIUM
   - **Timeline**: 2-3 weeks
   - **Recommendation**: Integrate with existing system (ADP, Kronos, Paychex)

3. **Incident Tracking System**
   - **Enables**: Incident frequency, patterns, critical detection
   - **Impact**: 3 checks (33% of total)
   - **Complexity**: HIGH (likely custom build)
   - **Timeline**: 3-4 weeks
   - **Recommendation**: Build internal system (no standard exists)

**Total P0 Timeline**: 4-6 weeks (parallel development)

**Total P0 Impact**: 7 checks enabled (78% of total)

---

### Priority 1 (HIGH) - Enhances Value

**Should Have for Full Value**:

4. **Complaint Tracking System**
   - **Enables**: Complaint velocity detection
   - **Impact**: 1 check (11% of total)
   - **Complexity**: MEDIUM
   - **Timeline**: 2-3 weeks
   - **Recommendation**: Build simple internal system, integrate with review sites later

**Total P1 Timeline**: 2-3 weeks

**Total P1 Impact**: 1 check enabled (11% of total)

---

### Priority 2 (MEDIUM) - Nice to Have

**Optional Enhancements**:

5. **Issue Tracking System**
   - **Enables**: Backlog detection
   - **Impact**: 1 check (11% of total)
   - **Complexity**: MEDIUM
   - **Timeline**: 2-3 weeks
   - **Recommendation**: Use complaint tracking system, add issue classification

**Total P2 Timeline**: 2-3 weeks

**Total P2 Impact**: 1 check enabled (11% of total)

---

## Data Source Integration Roadmap

### Phase 1: Core Integrations (4-6 weeks)

**Week 1-2**: Scheduling System Integration
- Connect to scheduling API
- Map data model (shifts, assignments, staff)
- Implement shift coverage data helper
- Test with real data
- **Outcome**: Shift coverage check functional

**Week 2-3**: Time Tracking System Integration
- Connect to time tracking API
- Map data model (clock-in/out, hours, overtime)
- Implement absenteeism data helper
- Implement overtime data helper
- Test with real data
- **Outcome**: Absenteeism + overtime checks functional

**Week 3-6**: Incident Tracking System (Custom Build)
- Design incident data model
- Build incident entry form
- Create incident database tables
- Implement incident classification
- Build incident data helper
- Test with real data
- **Outcome**: All incident checks functional

**Phase 1 Result**: 8/9 checks functional (89%)

---

### Phase 2: Enhanced Integrations (2-3 weeks)

**Week 7-9**: Complaint Tracking System
- Build complaint entry form
- Create complaint database tables
- Integrate with review sites (optional)
- Implement complaint data helper
- Test with real data
- **Outcome**: Complaint velocity check functional

**Phase 2 Result**: 9/9 checks functional (100%)

---

### Phase 3: Optimizations (Ongoing)

**Continuous Improvements**:
- Make standard response time configurable
- Add data quality monitoring
- Add data freshness alerts
- Optimize query performance
- Add caching where appropriate

---

## Data Quality Requirements

### Real-Time Data (<5 minutes)

**Required For**:
- Service response time (MarketplaceOrder) ✅
- Shift coverage (scheduling system) ⚠️
- Critical incidents (incident tracking) ⚠️

**Current Status**: 1/3 real-time

**Action Required**: Ensure scheduling and incident systems support real-time or near-real-time data

---

### Hourly Data (<1 hour)

**Required For**:
- Absenteeism (time tracking) ⚠️
- Incident frequency (incident tracking) ⚠️

**Current Status**: 0/2 hourly

**Action Required**: Ensure time tracking and incident systems update hourly

---

### Daily Data (<24 hours)

**Required For**:
- Overtime (time tracking/payroll) ⚠️
- Complaint velocity (complaint tracking) ⚠️
- Incident patterns (incident tracking) ⚠️

**Current Status**: 0/3 daily

**Action Required**: Daily batch updates acceptable for these checks

---

### Weekly Data (<7 days)

**Required For**:
- Backlog (issue tracking) ⚠️

**Current Status**: 0/1 weekly

**Action Required**: Weekly batch updates acceptable

---

## Data Source Gap Summary

### Current State

**Functional**: 1/9 checks (11%)  
**Data Sources Available**: 1/6 (17%)  
**Operational Value**: LOW  

---

### After P0 Integrations

**Functional**: 8/9 checks (89%)  
**Data Sources Available**: 4/6 (67%)  
**Operational Value**: HIGH  

---

### After All Integrations

**Functional**: 9/9 checks (100%)  
**Data Sources Available**: 6/6 (100%)  
**Operational Value**: VERY HIGH  

---

## Recommendations

### Immediate Actions (Before Dashboard UI)

1. ✅ **Prioritize P0 data source integrations** (4-6 weeks)
   - Scheduling system
   - Time tracking system
   - Incident tracking system (custom build)

2. ⚠️ **Build incident tracking system first** (highest value)
   - Enables 3 checks (33% of total)
   - Recurring pattern detection is world-class feature
   - No existing system to integrate with

3. ⚠️ **Integrate scheduling + time tracking in parallel** (fastest path)
   - Both are MEDIUM complexity
   - Both have existing systems to integrate with
   - Enables 4 checks (44% of total)

---

### Medium-Term Actions (After Dashboard UI)

4. ⚠️ **Build complaint tracking system** (P1)
   - Start simple (manual entry)
   - Integrate with review sites later
   - Enables 1 check (11% of total)

5. ⚠️ **Extend complaint tracking to issue tracking** (P2)
   - Add issue classification
   - Add resolution tracking
   - Enables 1 check (11% of total)

---

### Long-Term Actions (Continuous Improvement)

6. ⚠️ **Implement data quality monitoring**
   - Monitor data freshness
   - Alert on stale data
   - Track data source health

7. ⚠️ **Optimize data collection**
   - Cache where appropriate
   - Batch queries where possible
   - Monitor query performance

---

## Final Assessment

**Data Source Status**: 🔴 **CRITICAL GAPS**

**Functional Coverage**: 11% (1/9 checks)

**Blocker for Production**: ✅ **YES** (only 1 check works)

**Recommendation**: **Prioritize data source integration before dashboard UI**

**Rationale**: Dashboard UI without data is useless. Data sources enable 89% of functionality.

**Timeline to Full Functionality**: 4-6 weeks (P0 integrations)

---

**COO Data Source Gap Analysis: COMPLETE** ✅

**Classification**: 🔴 **RED** (critical gaps exist)

**Action Required**: Integrate P0 data sources (scheduling, time tracking, incident tracking)
