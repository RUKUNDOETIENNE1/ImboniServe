# COO Data Governance Framework

**Phase**: 1.2E-D Operational Data Integration & Data Reality Layer  
**Date**: June 24, 2026  
**Role**: Data Governance Lead, Operations Intelligence Engineer  
**Status**: ✅ **FRAMEWORK COMPLETE**  

---

## Executive Summary

**Mission**: Define ownership, responsibilities, validation, and handling for operational data

**Focus**: Operational data governance (not enterprise-wide governance)

**Scope**: 6 operational data domains (Scheduling, Time Tracking, Incident, Complaint, AlertBudgetLog, MarketplaceOrder)

---

## Governance Principles

### Principle 1: Clear Ownership

**Rule**: Every data domain MUST have a single owner

**Rationale**: Accountability for data quality

**Implementation**: Owner defined per branch (Operations Manager, Customer Service Manager, etc.)

---

### Principle 2: Defined Responsibilities

**Rule**: Update, validation, and audit responsibilities MUST be explicit

**Rationale**: Prevent data quality degradation

**Implementation**: Responsibility matrix (RACI)

---

### Principle 3: Automated Validation

**Rule**: Validation rules MUST be enforced by system (not manual)

**Rationale**: Prevent invalid data entry

**Implementation**: Database constraints, application validation, API validation

---

### Principle 4: Graceful Degradation

**Rule**: Missing or stale data MUST NOT break intelligence

**Rationale**: Operational resilience

**Implementation**: Placeholder pattern (return null), stale data detection, fallback logic

---

### Principle 5: Auditability

**Rule**: All data changes MUST be auditable

**Rationale**: Trust and compliance

**Implementation**: Audit logs, timestamps, user tracking

---

## Ownership Model

### Data Domain: Scheduling (Shift, ShiftRole)

**Data Owner**: Operations Manager (per branch)

**Responsibilities**:

| Role | Responsibility | Frequency |
|------|----------------|-----------|
| **Operations Manager** | Approve shift schedules | Weekly |
| **Scheduling Manager** | Create shifts, assign staff | Daily |
| **Staff** | Confirm shifts, request changes | As needed |
| **System** | Auto-update shift status | Real-time |
| **Data Governance Lead** | Monitor data quality | Weekly |

**RACI Matrix**:

| Activity | Operations Mgr | Scheduling Mgr | Staff | System |
|----------|----------------|----------------|-------|--------|
| Create shifts | A | R | I | I |
| Assign staff | A | R | C | I |
| Confirm shifts | I | I | R | A |
| Update status | I | I | I | R/A |
| Validate data | R/A | C | I | I |

**R** = Responsible, **A** = Accountable, **C** = Consulted, **I** = Informed

---

### Data Domain: Time Tracking (TimeEntry, AbsenceRecord)

**Data Owner**: Operations Manager (per branch)

**Responsibilities**:

| Role | Responsibility | Frequency |
|------|----------------|-----------|
| **Operations Manager** | Approve overtime, validate attendance | Daily |
| **Staff** | Clock-in, clock-out, notify absences | Real-time |
| **System** | Calculate overtime, detect no-shows | Real-time |
| **Payroll** | Audit time entries | Weekly |
| **Data Governance Lead** | Monitor data quality | Weekly |

**RACI Matrix**:

| Activity | Operations Mgr | Staff | System | Payroll |
|----------|----------------|-------|--------|---------|
| Clock-in/out | I | R | A | I |
| Calculate overtime | A | I | R | C |
| Approve overtime | R/A | I | I | C |
| Detect no-shows | I | I | R/A | I |
| Audit time entries | C | I | I | R/A |

---

### Data Domain: Incident Tracking (Incident, IncidentType)

**Data Owner**: Operations Manager (per branch)

**Responsibilities**:

| Role | Responsibility | Frequency |
|------|----------------|-----------|
| **Operations Manager** | Root cause analysis, preventive actions | Per incident |
| **Staff** | Report incidents | Real-time |
| **Assignee** | Resolve incidents, document resolution | Per incident |
| **Safety Officer** | Review CRITICAL incidents | Real-time |
| **Data Governance Lead** | Monitor data quality | Weekly |

**RACI Matrix**:

| Activity | Operations Mgr | Staff | Assignee | Safety Officer |
|----------|----------------|-------|----------|----------------|
| Report incident | I | R | I | I |
| Assign incident | R/A | I | C | I |
| Resolve incident | C | I | R | I |
| Root cause analysis | R/A | I | C | C |
| Review CRITICAL | C | I | I | R/A |

---

### Data Domain: Complaint Tracking (Complaint)

**Data Owner**: Customer Service Manager (per branch)

**Responsibilities**:

| Role | Responsibility | Frequency |
|------|----------------|-----------|
| **Customer Service Manager** | Follow-up, satisfaction tracking | Per complaint |
| **Staff** | Log complaints | Real-time |
| **Assignee** | Resolve complaints, document resolution | Per complaint |
| **Operations Manager** | Review complaint trends | Weekly |
| **Data Governance Lead** | Monitor data quality | Weekly |

**RACI Matrix**:

| Activity | CS Manager | Staff | Assignee | Operations Mgr |
|----------|------------|-------|----------|----------------|
| Log complaint | I | R | I | I |
| Assign complaint | R/A | I | C | I |
| Resolve complaint | C | I | R | I |
| Follow-up | R/A | I | I | I |
| Review trends | C | I | I | R/A |

---

### Data Domain: AlertBudgetLog

**Data Owner**: Data Governance Lead (global)

**Responsibilities**:

| Role | Responsibility | Frequency |
|------|----------------|-----------|
| **Data Governance Lead** | Monitor budget usage, adjust limits | Weekly |
| **System** | Log alerts, enforce budget | Real-time |
| **COO** | Review alert volume, provide feedback | Weekly |

**RACI Matrix**:

| Activity | Data Governance Lead | System | COO |
|----------|---------------------|--------|-----|
| Log alerts | I | R/A | I |
| Enforce budget | A | R | I |
| Monitor usage | R/A | I | C |
| Adjust limits | R/A | I | C |

---

## Update Responsibilities

### Scheduling Data

**Who Updates**:
- **Scheduling Manager**: Creates shifts, assigns staff
- **Staff**: Confirms shifts, requests changes
- **System**: Auto-updates shift status (IN_PROGRESS, COMPLETED, NO_SHOW)

**Update Frequency**:
- Shift creation: Weekly (for upcoming week)
- Shift assignment: Daily (as needed)
- Shift status: Real-time (auto-update)

**Update Method**:
- Manual: Scheduling manager creates shifts via UI
- Automated: System updates status based on time tracking

**Validation**:
- Shift times MUST NOT overlap for same staff
- Shift end time MUST be after start time
- Assigned staff MUST be valid User

---

### Time Tracking Data

**Who Updates**:
- **Staff**: Clocks in, clocks out, notifies absences
- **System**: Calculates overtime, detects no-shows
- **Operations Manager**: Approves overtime

**Update Frequency**:
- Clock-in/out: Real-time
- Overtime calculation: Real-time (on clock-out)
- No-show detection: Hourly (1 hour after shift start)

**Update Method**:
- Manual: Staff clocks in/out via mobile/kiosk
- Automated: System calculates overtime, detects no-shows

**Validation**:
- Clock-out time MUST be after clock-in time
- Total minutes MUST match clock-out - clock-in
- Overtime MUST be calculated correctly

---

### Incident Tracking Data

**Who Updates**:
- **Staff**: Reports incidents
- **Assignee**: Updates status, documents resolution
- **Operations Manager**: Root cause analysis, preventive actions

**Update Frequency**:
- Incident creation: Real-time (within 15 min for CRITICAL)
- Status updates: Hourly (as resolution progresses)
- Root cause analysis: Daily (after resolution)

**Update Method**:
- Manual: Staff reports via form, assignee updates status
- Automated: System escalates CRITICAL incidents

**Validation**:
- Incident type MUST be from standardized list
- Severity MUST match impact (CRITICAL = safety/legal)
- Resolved incidents MUST have resolution notes

---

### Complaint Tracking Data

**Who Updates**:
- **Staff**: Logs complaints
- **Assignee**: Updates status, documents resolution
- **Customer Service Manager**: Follow-up, satisfaction tracking

**Update Frequency**:
- Complaint creation: Real-time (within 1 hour)
- Status updates: Hourly (as resolution progresses)
- Follow-up: Daily (after resolution)

**Update Method**:
- Manual: Staff logs via form, assignee updates status
- Automated: System escalates CRITICAL complaints

**Validation**:
- Complaint type MUST be from standardized list
- Severity MUST match impact
- Resolved complaints MUST have resolution notes

---

### AlertBudgetLog

**Who Updates**:
- **System**: Logs every alert sent

**Update Frequency**:
- Real-time (within 1 second of alert sent)

**Update Method**:
- Automated: System logs alert immediately after sending

**Validation**:
- Every alert MUST be logged (no exceptions)
- Alert data MUST match actual alert sent

---

## Validation Rules

### Scheduling Data Validation

**On Create** (Shift):
```typescript
// Required fields
if (!shift.branchId || !shift.scheduledDate || !shift.startTime || !shift.endTime) {
  throw new ValidationError("Missing required fields")
}

// Time validation
if (shift.endTime <= shift.startTime) {
  throw new ValidationError("Shift end time must be after start time")
}

// Date validation
if (shift.scheduledDate < startOfDay(new Date())) {
  throw new ValidationError("Cannot create shifts in the past")
}

// Overlap validation (if assigned)
if (shift.assignedStaffId) {
  const overlapping = await findOverlappingShifts(shift)
  if (overlapping) {
    throw new ValidationError("Staff already assigned to overlapping shift")
  }
}
```

**On Update** (Shift):
```typescript
// Status transition validation
const validTransitions = {
  OPEN: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['CONFIRMED', 'OPEN', 'CANCELLED', 'NO_SHOW'],
  CONFIRMED: ['IN_PROGRESS', 'CANCELLED', 'NO_SHOW'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
}

if (!validTransitions[currentStatus].includes(newStatus)) {
  throw new ValidationError(`Invalid status transition: ${currentStatus} → ${newStatus}`)
}
```

---

### Time Tracking Data Validation

**On Clock-In** (TimeEntry):
```typescript
// Prevent duplicate clock-ins
const activeEntry = await findActiveTimeEntry(userId)
if (activeEntry) {
  throw new ValidationError("User already clocked in")
}

// Time validation
if (clockInTime > new Date()) {
  throw new ValidationError("Cannot clock in for future time")
}

// Branch validation
const branch = await findBranch(branchId)
if (!branch || !branch.isActive) {
  throw new ValidationError("Invalid branch")
}
```

**On Clock-Out** (TimeEntry):
```typescript
// Time validation
if (clockOutTime <= clockInTime) {
  throw new ValidationError("Clock-out time must be after clock-in time")
}

// Calculate total minutes
const totalMinutes = Math.floor((clockOutTime - clockInTime) / (1000 * 60))

// Validate reasonable duration (not >16 hours)
if (totalMinutes > 960) {
  throw new ValidationError("Shift duration exceeds 16 hours. Please verify.")
}

// Calculate overtime
const overtimeMinutes = Math.max(0, totalMinutes - 480) // 8 hours standard
```

---

### Incident Tracking Data Validation

**On Create** (Incident):
```typescript
// Required fields
if (!incident.branchId || !incident.incidentType || !incident.severity || 
    !incident.title || !incident.description || !incident.occurredAt || !incident.reportedBy) {
  throw new ValidationError("Missing required fields")
}

// Incident type validation
const incidentType = await findIncidentType(incident.incidentType)
if (!incidentType || !incidentType.isActive) {
  throw new ValidationError("Invalid incident type")
}

// Time validation
if (incident.occurredAt > new Date()) {
  throw new ValidationError("Incident cannot occur in the future")
}

// Description validation (minimum length)
if (incident.description.length < 20) {
  throw new ValidationError("Incident description too short (minimum 20 characters)")
}

// CRITICAL incident escalation
if (incident.severity === 'CRITICAL') {
  await escalateCriticalIncident(incident)
}
```

**On Resolution** (Incident):
```typescript
// Resolution notes required
if (!incident.resolutionNotes || incident.resolutionNotes.length < 10) {
  throw new ValidationError("Resolution notes required (minimum 10 characters)")
}

// Root cause analysis recommended for recurring incidents
const recentSimilar = await countRecentSimilarIncidents(incident)
if (recentSimilar >= 2 && !incident.rootCause) {
  console.warn("Recurring incident detected. Root cause analysis recommended.")
}
```

---

### Complaint Tracking Data Validation

**On Create** (Complaint):
```typescript
// Required fields
if (!complaint.branchId || !complaint.complaintType || !complaint.severity || 
    !complaint.source || !complaint.title || !complaint.description || 
    !complaint.receivedAt || !complaint.reportedBy) {
  throw new ValidationError("Missing required fields")
}

// Time validation
if (complaint.receivedAt > new Date()) {
  throw new ValidationError("Complaint cannot be received in the future")
}

// Description validation
if (complaint.description.length < 20) {
  throw new ValidationError("Complaint description too short (minimum 20 characters)")
}

// CRITICAL complaint escalation
if (complaint.severity === 'CRITICAL') {
  await escalateCriticalComplaint(complaint)
}
```

---

## Missing Data Handling

### Strategy 1: Placeholder Pattern (Preferred)

**Approach**: Return `null` when data is missing

**Implementation**:
```typescript
async function getShiftCoverageData(locationId: string): Promise<ShiftCoverageData | null> {
  // Check if Shift table exists and has data
  const shiftsExist = await prisma.shift.count({ where: { branchId: locationId } })
  
  if (shiftsExist === 0) {
    // No data available - return null to prevent false alerts
    return null
  }
  
  // Data available - calculate coverage
  const scheduledShifts = await prisma.shift.count({
    where: { branchId: locationId, scheduledDate: today },
  })
  
  const filledShifts = await prisma.shift.count({
    where: { branchId: locationId, scheduledDate: today, status: { in: ['ASSIGNED', 'CONFIRMED'] } },
  })
  
  return {
    scheduledShifts,
    filledShifts,
    openShifts: scheduledShifts - filledShifts,
    coverageRate: (filledShifts / scheduledShifts) * 100,
  }
}
```

**Benefits**:
- ✅ No false alerts
- ✅ Graceful degradation
- ✅ Clear signal (null = no data)

**Drawbacks**:
- ⚠️ No operational intelligence until data available

---

### Strategy 2: Default Values (Use Sparingly)

**Approach**: Use safe default values when data is missing

**Implementation**:
```typescript
// Only use defaults for non-critical fields
const standardResponseTime = branch.standardResponseTime || 15 // Default: 15 minutes
```

**Benefits**:
- ✅ System continues to function

**Drawbacks**:
- ❌ May generate false alerts if default is wrong
- ❌ Hides data quality issues

**Recommendation**: ⚠️ **Use only for non-critical fields**

---

### Strategy 3: Partial Data Handling

**Approach**: Use available data, skip missing data

**Implementation**:
```typescript
// Calculate coverage only for locations with shift data
const locations = await prisma.branch.findMany({ where: { isActive: true } })

for (const location of locations) {
  const coverageData = await getShiftCoverageData(location.id)
  
  if (!coverageData) {
    // Skip this location (no shift data)
    console.log(`[StaffingWatchdog] No shift data for ${location.name}`)
    continue
  }
  
  // Process coverage data
  if (coverageData.coverageRate < 80) {
    // Generate alert
  }
}
```

**Benefits**:
- ✅ Partial operational intelligence
- ✅ No false alerts

**Drawbacks**:
- ⚠️ Incomplete coverage

**Recommendation**: ✅ **Preferred for multi-location scenarios**

---

## Stale Data Handling

### Detection

**Stale Data Definition**:
- Scheduling data: >24 hours old (for today's shifts)
- Time tracking data: >1 hour old (for active shifts)
- Incident data: >1 hour old (for CRITICAL incidents)
- Complaint data: >1 hour old (for CRITICAL complaints)
- AlertBudgetLog: >5 minutes old (for budget enforcement)

**Detection Logic**:
```typescript
// Check if data is stale
function isDataStale(lastUpdate: Date, maxAgeMinutes: number): boolean {
  const ageMinutes = (Date.now() - lastUpdate.getTime()) / (1000 * 60)
  return ageMinutes > maxAgeMinutes
}

// Example: Check shift data freshness
const latestShift = await prisma.shift.findFirst({
  where: { branchId: locationId },
  orderBy: { updatedAt: 'desc' },
})

if (!latestShift || isDataStale(latestShift.updatedAt, 1440)) { // 24 hours
  console.warn(`[StaffingWatchdog] Shift data is stale for ${locationId}`)
  return null // Treat as missing data
}
```

---

### Mitigation

**Strategy 1: Alert on Stale Data**

**Approach**: Generate alert when data becomes stale

**Implementation**:
```typescript
// Data quality watchdog (future)
if (isDataStale(latestShift.updatedAt, 1440)) {
  await AlertDeliveryService.deliverWatchdogAlert({
    severity: 'WARN',
    watchdog: 'DATA_QUALITY',
    source: `stale_shift_data_${locationId}`,
    summary: `Shift data is stale for ${locationName}`,
    details: {
      lastUpdate: latestShift.updatedAt,
      ageHours: Math.floor((Date.now() - latestShift.updatedAt.getTime()) / (1000 * 60 * 60)),
    },
    recommendedAction: "Check scheduling system integration. Verify data sync is running.",
  })
}
```

**Benefits**:
- ✅ Proactive data quality monitoring
- ✅ Prevents false negatives (missed issues)

---

**Strategy 2: Use Last Known Good Data (with Warning)**

**Approach**: Use stale data but flag as stale

**Implementation**:
```typescript
// Use stale data with warning
if (isDataStale(latestShift.updatedAt, 1440)) {
  console.warn(`[StaffingWatchdog] Using stale data for ${locationId}`)
  
  // Include staleness warning in alert
  alert.details.dataFreshness = {
    isStale: true,
    lastUpdate: latestShift.updatedAt,
    ageHours: Math.floor((Date.now() - latestShift.updatedAt.getTime()) / (1000 * 60 * 60)),
  }
}
```

**Benefits**:
- ✅ Partial operational intelligence
- ✅ Transparency (staleness flagged)

**Drawbacks**:
- ⚠️ May generate false alerts

**Recommendation**: ⚠️ **Use only for non-critical checks**

---

**Strategy 3: Disable Check Until Data Fresh**

**Approach**: Skip check if data is stale

**Implementation**:
```typescript
// Skip check if data is stale
if (isDataStale(latestShift.updatedAt, 1440)) {
  console.warn(`[StaffingWatchdog] Skipping check for ${locationId} (stale data)`)
  return null
}
```

**Benefits**:
- ✅ No false alerts

**Drawbacks**:
- ❌ No operational intelligence

**Recommendation**: ✅ **Preferred for critical checks**

---

## Data Governance Metrics

### Metric 1: Data Completeness

**Definition**: Percentage of required fields populated

**Target**: >95%

**Measurement**:
```sql
-- Shift data completeness
SELECT 
  COUNT(*) as total_shifts,
  COUNT(assignedStaffId) as assigned_shifts,
  (COUNT(assignedStaffId) * 100.0 / COUNT(*)) as assignment_rate
FROM Shift
WHERE scheduledDate = CURRENT_DATE;
```

---

### Metric 2: Data Timeliness

**Definition**: Percentage of data updated within SLA

**Target**: >95%

**Measurement**:
```sql
-- Incident reporting timeliness (CRITICAL within 15 min)
SELECT 
  COUNT(*) as total_critical,
  COUNT(CASE WHEN (createdAt - occurredAt) < INTERVAL '15 minutes' THEN 1 END) as on_time,
  (COUNT(CASE WHEN (createdAt - occurredAt) < INTERVAL '15 minutes' THEN 1 END) * 100.0 / COUNT(*)) as on_time_rate
FROM Incident
WHERE severity = 'CRITICAL'
  AND occurredAt >= CURRENT_DATE - INTERVAL '7 days';
```

---

### Metric 3: Data Accuracy

**Definition**: Percentage of data passing validation rules

**Target**: >98%

**Measurement**:
```sql
-- Time entry accuracy (clock-out after clock-in)
SELECT 
  COUNT(*) as total_entries,
  COUNT(CASE WHEN clockOutTime > clockInTime THEN 1 END) as valid_entries,
  (COUNT(CASE WHEN clockOutTime > clockInTime THEN 1 END) * 100.0 / COUNT(*)) as accuracy_rate
FROM TimeEntry
WHERE clockOutTime IS NOT NULL;
```

---

### Metric 4: Data Ownership Clarity

**Definition**: Percentage of data domains with defined owner

**Target**: 100%

**Measurement**: Manual review (all 6 domains have owner)

---

### Metric 5: Validation Rule Enforcement

**Definition**: Percentage of validation rules enforced by system

**Target**: 100%

**Measurement**: Code review (all validation rules in code)

---

## Governance Reporting

### Daily Report

**Audience**: Data Governance Lead

**Content**:
- Data completeness by domain
- Data timeliness by domain
- Validation errors (count, type)
- Stale data warnings

---

### Weekly Report

**Audience**: Operations Managers, Data Governance Lead

**Content**:
- Data quality trends (completeness, timeliness, accuracy)
- Data ownership compliance
- Validation rule violations
- Stale data incidents

---

### Monthly Report

**Audience**: COO, Data Governance Lead

**Content**:
- Data governance metrics (completeness, timeliness, accuracy)
- Data quality improvement initiatives
- Data governance policy updates

---

**COO Data Governance Framework: COMPLETE** ✅

**Next**: Data Quality Requirements
