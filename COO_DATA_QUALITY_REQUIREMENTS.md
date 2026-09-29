# COO Data Quality Requirements

**Phase**: 1.2E-D Operational Data Integration & Data Reality Layer  
**Date**: June 24, 2026  
**Role**: Data Governance Lead, Operations Intelligence Engineer  
**Status**: ✅ **REQUIREMENTS COMPLETE**  

---

## Executive Summary

**Mission**: Define data quality standards for operational intelligence

**Focus**: Completeness, reliability, timeliness, accuracy

**Approach**: Measurable, enforceable, auditable

---

## Data Quality Dimensions

### Dimension 1: Completeness

**Definition**: All required fields are populated

**Target**: >95% completeness

**Measurement**: Field population rate

---

### Dimension 2: Reliability

**Definition**: Data is consistent and trustworthy

**Target**: >95% reliability

**Measurement**: Validation pass rate

---

### Dimension 3: Timeliness

**Definition**: Data is updated within SLA

**Target**: >95% on-time

**Measurement**: Update lag time

---

### Dimension 4: Accuracy

**Definition**: Data reflects operational reality

**Target**: >98% accuracy

**Measurement**: Validation error rate

---

### Dimension 5: Consistency

**Definition**: Data is consistent across systems

**Target**: 100% consistency

**Measurement**: Cross-system reconciliation

---

## Data Quality Requirements by Domain

### Domain 1: Scheduling Data (Shift)

#### Completeness Requirements

**Required Fields** (100% population):
- `branchId` ✅
- `scheduledDate` ✅
- `startTime` ✅
- `endTime` ✅
- `status` ✅

**Optional Fields** (acceptable <100%):
- `assignedStaffId` (nullable for OPEN shifts)
- `roleId` (optional)
- `notes` (optional)

**Measurement**:
```sql
SELECT 
  COUNT(*) as total_shifts,
  COUNT(branchId) as has_branch,
  COUNT(scheduledDate) as has_date,
  COUNT(startTime) as has_start,
  COUNT(endTime) as has_end,
  COUNT(status) as has_status,
  (COUNT(branchId) * 100.0 / COUNT(*)) as branch_completeness,
  (COUNT(scheduledDate) * 100.0 / COUNT(*)) as date_completeness,
  (COUNT(startTime) * 100.0 / COUNT(*)) as start_completeness,
  (COUNT(endTime) * 100.0 / COUNT(*)) as end_completeness,
  (COUNT(status) * 100.0 / COUNT(*)) as status_completeness
FROM Shift
WHERE scheduledDate >= CURRENT_DATE - INTERVAL '7 days';
```

**Target**: 100% for required fields

---

#### Reliability Requirements

**Validation Rules**:
1. ✅ `endTime` MUST be after `startTime`
2. ✅ `assignedStaffId` MUST reference valid User (if not null)
3. ✅ `branchId` MUST reference valid Branch
4. ✅ No overlapping shifts for same staff
5. ✅ Valid status transitions only

**Measurement**:
```sql
-- Validation pass rate
SELECT 
  COUNT(*) as total_shifts,
  COUNT(CASE WHEN endTime > startTime THEN 1 END) as valid_time,
  COUNT(CASE WHEN status IN ('OPEN', 'ASSIGNED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW') THEN 1 END) as valid_status,
  (COUNT(CASE WHEN endTime > startTime THEN 1 END) * 100.0 / COUNT(*)) as time_validity_rate,
  (COUNT(CASE WHEN status IN ('OPEN', 'ASSIGNED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW') THEN 1 END) * 100.0 / COUNT(*)) as status_validity_rate
FROM Shift
WHERE scheduledDate >= CURRENT_DATE - INTERVAL '7 days';
```

**Target**: >98% validation pass rate

---

#### Timeliness Requirements

**Update SLA**:
- Shift creation: Within 7 days of scheduled date
- Shift assignment: Within 24 hours of creation
- Status update (IN_PROGRESS): Within 15 minutes of shift start
- Status update (COMPLETED): Within 15 minutes of shift end
- Status update (NO_SHOW): Within 1 hour of shift start

**Measurement**:
```sql
-- Status update timeliness (IN_PROGRESS)
SELECT 
  COUNT(*) as total_in_progress,
  COUNT(CASE WHEN (updatedAt - startTime) < INTERVAL '15 minutes' THEN 1 END) as on_time,
  (COUNT(CASE WHEN (updatedAt - startTime) < INTERVAL '15 minutes' THEN 1 END) * 100.0 / COUNT(*)) as on_time_rate
FROM Shift
WHERE status = 'IN_PROGRESS'
  AND scheduledDate >= CURRENT_DATE - INTERVAL '7 days';
```

**Target**: >95% on-time

---

#### Accuracy Requirements

**Accuracy Checks**:
1. ✅ Shift times match actual business hours
2. ✅ Staff assignments match actual staff availability
3. ✅ Status reflects actual shift state

**Measurement**: Manual audit (sample 10 shifts/week)

**Target**: >98% accuracy

---

### Domain 2: Time Tracking Data (TimeEntry, AbsenceRecord)

#### Completeness Requirements

**Required Fields** (100% population):
- `userId` ✅
- `branchId` ✅
- `clockInTime` ✅
- `clockOutTime` ✅ (for COMPLETED entries)
- `totalMinutes` ✅ (for COMPLETED entries)

**Optional Fields**:
- `shiftId` (nullable)
- `overtimeMinutes` (calculated)
- `clockInMethod` (optional)
- `approvedBy` (nullable)

**Measurement**:
```sql
SELECT 
  COUNT(*) as total_entries,
  COUNT(userId) as has_user,
  COUNT(branchId) as has_branch,
  COUNT(clockInTime) as has_clock_in,
  COUNT(clockOutTime) as has_clock_out,
  COUNT(totalMinutes) as has_total_minutes,
  (COUNT(clockOutTime) * 100.0 / COUNT(*)) as clock_out_completeness,
  (COUNT(totalMinutes) * 100.0 / COUNT(*)) as total_minutes_completeness
FROM TimeEntry
WHERE clockInTime >= CURRENT_DATE - INTERVAL '7 days';
```

**Target**: 100% for required fields

---

#### Reliability Requirements

**Validation Rules**:
1. ✅ `clockOutTime` MUST be after `clockInTime`
2. ✅ `totalMinutes` MUST match `clockOutTime - clockInTime`
3. ✅ `overtimeMinutes` MUST be calculated correctly
4. ✅ No duplicate active clock-ins for same user
5. ✅ Shift duration MUST be reasonable (<16 hours)

**Measurement**:
```sql
-- Validation pass rate
SELECT 
  COUNT(*) as total_entries,
  COUNT(CASE WHEN clockOutTime > clockInTime THEN 1 END) as valid_time,
  COUNT(CASE WHEN totalMinutes = EXTRACT(EPOCH FROM (clockOutTime - clockInTime)) / 60 THEN 1 END) as valid_total_minutes,
  (COUNT(CASE WHEN clockOutTime > clockInTime THEN 1 END) * 100.0 / COUNT(*)) as time_validity_rate,
  (COUNT(CASE WHEN totalMinutes = EXTRACT(EPOCH FROM (clockOutTime - clockInTime)) / 60 THEN 1 END) * 100.0 / COUNT(*)) as calculation_accuracy_rate
FROM TimeEntry
WHERE clockOutTime IS NOT NULL
  AND clockInTime >= CURRENT_DATE - INTERVAL '7 days';
```

**Target**: >99% validation pass rate

---

#### Timeliness Requirements

**Update SLA**:
- Clock-in: Within 5 minutes of actual clock-in
- Clock-out: Within 5 minutes of actual clock-out
- Overtime calculation: Immediate (on clock-out)
- No-show detection: Within 1 hour of shift start

**Measurement**:
```sql
-- Clock-in timeliness (assume createdAt = log time)
SELECT 
  COUNT(*) as total_entries,
  COUNT(CASE WHEN (createdAt - clockInTime) < INTERVAL '5 minutes' THEN 1 END) as on_time,
  (COUNT(CASE WHEN (createdAt - clockInTime) < INTERVAL '5 minutes' THEN 1 END) * 100.0 / COUNT(*)) as on_time_rate
FROM TimeEntry
WHERE clockInTime >= CURRENT_DATE - INTERVAL '7 days';
```

**Target**: >98% on-time

---

#### Accuracy Requirements

**Accuracy Checks**:
1. ✅ Clock-in/out times match actual times
2. ✅ Overtime calculations match labor law rules
3. ✅ No-show detection is accurate

**Measurement**: Manual audit (sample 10 entries/week)

**Target**: >99% accuracy

---

### Domain 3: Incident Tracking Data (Incident)

#### Completeness Requirements

**Required Fields** (100% population):
- `branchId` ✅
- `incidentType` ✅
- `severity` ✅
- `title` ✅
- `description` ✅
- `occurredAt` ✅
- `reportedBy` ✅

**Required for RESOLVED** (100% population):
- `resolvedAt` ✅
- `resolutionNotes` ✅

**Recommended for CLOSED** (>80% population):
- `rootCause` ⚠️ (for pattern detection)
- `correctiveAction` ⚠️
- `preventiveAction` ⚠️

**Measurement**:
```sql
SELECT 
  COUNT(*) as total_incidents,
  COUNT(CASE WHEN status = 'RESOLVED' AND resolvedAt IS NOT NULL THEN 1 END) as resolved_with_date,
  COUNT(CASE WHEN status = 'RESOLVED' AND resolutionNotes IS NOT NULL THEN 1 END) as resolved_with_notes,
  COUNT(CASE WHEN status = 'CLOSED' AND rootCause IS NOT NULL THEN 1 END) as closed_with_root_cause,
  (COUNT(CASE WHEN status = 'RESOLVED' AND resolvedAt IS NOT NULL THEN 1 END) * 100.0 / COUNT(CASE WHEN status = 'RESOLVED' THEN 1 END)) as resolved_date_completeness,
  (COUNT(CASE WHEN status = 'CLOSED' AND rootCause IS NOT NULL THEN 1 END) * 100.0 / COUNT(CASE WHEN status = 'CLOSED' THEN 1 END)) as root_cause_completeness
FROM Incident
WHERE occurredAt >= CURRENT_DATE - INTERVAL '30 days';
```

**Target**: 100% for required, >80% for recommended

---

#### Reliability Requirements

**Validation Rules**:
1. ✅ `incidentType` MUST be from standardized list
2. ✅ `severity` MUST match impact (CRITICAL = safety/legal)
3. ✅ `resolvedAt` MUST be after `occurredAt`
4. ✅ `description` MUST be specific (>20 characters)
5. ✅ CRITICAL incidents MUST be escalated immediately

**Measurement**:
```sql
-- Validation pass rate
SELECT 
  COUNT(*) as total_incidents,
  COUNT(CASE WHEN resolvedAt > occurredAt THEN 1 END) as valid_time,
  COUNT(CASE WHEN LENGTH(description) >= 20 THEN 1 END) as valid_description,
  (COUNT(CASE WHEN resolvedAt > occurredAt THEN 1 END) * 100.0 / COUNT(CASE WHEN resolvedAt IS NOT NULL THEN 1 END)) as time_validity_rate,
  (COUNT(CASE WHEN LENGTH(description) >= 20 THEN 1 END) * 100.0 / COUNT(*)) as description_validity_rate
FROM Incident
WHERE occurredAt >= CURRENT_DATE - INTERVAL '30 days';
```

**Target**: >98% validation pass rate

---

#### Timeliness Requirements

**Update SLA**:
- CRITICAL incident reporting: Within 15 minutes of occurrence
- HIGH incident reporting: Within 1 hour of occurrence
- MEDIUM/LOW incident reporting: Within 24 hours of occurrence
- Incident assignment: Within 1 hour of reporting
- Incident resolution: Within SLA (varies by severity)

**Measurement**:
```sql
-- CRITICAL incident reporting timeliness
SELECT 
  COUNT(*) as total_critical,
  COUNT(CASE WHEN (createdAt - occurredAt) < INTERVAL '15 minutes' THEN 1 END) as on_time,
  (COUNT(CASE WHEN (createdAt - occurredAt) < INTERVAL '15 minutes' THEN 1 END) * 100.0 / COUNT(*)) as on_time_rate
FROM Incident
WHERE severity = 'CRITICAL'
  AND occurredAt >= CURRENT_DATE - INTERVAL '30 days';
```

**Target**: >95% on-time (CRITICAL), >90% on-time (others)

---

#### Accuracy Requirements

**Accuracy Checks**:
1. ✅ Incident type classification is correct
2. ✅ Severity matches actual impact
3. ✅ Root cause analysis identifies actual root cause (not symptom)

**Measurement**: Manual audit (sample 10 incidents/week)

**Target**: >95% accuracy

---

### Domain 4: Complaint Tracking Data (Complaint)

#### Completeness Requirements

**Required Fields** (100% population):
- `branchId` ✅
- `complaintType` ✅
- `severity` ✅
- `source` ✅
- `title` ✅
- `description` ✅
- `receivedAt` ✅
- `reportedBy` ✅

**Required for RESOLVED** (100% population):
- `resolvedAt` ✅
- `resolutionNotes` ✅

**Recommended for CLOSED** (>80% population):
- `customerSatisfied` ⚠️ (for follow-up)

**Measurement**:
```sql
SELECT 
  COUNT(*) as total_complaints,
  COUNT(CASE WHEN status = 'RESOLVED' AND resolvedAt IS NOT NULL THEN 1 END) as resolved_with_date,
  COUNT(CASE WHEN status = 'RESOLVED' AND resolutionNotes IS NOT NULL THEN 1 END) as resolved_with_notes,
  COUNT(CASE WHEN status = 'CLOSED' AND customerSatisfied IS NOT NULL THEN 1 END) as closed_with_satisfaction,
  (COUNT(CASE WHEN status = 'CLOSED' AND customerSatisfied IS NOT NULL THEN 1 END) * 100.0 / COUNT(CASE WHEN status = 'CLOSED' THEN 1 END)) as satisfaction_completeness
FROM Complaint
WHERE receivedAt >= CURRENT_DATE - INTERVAL '30 days';
```

**Target**: 100% for required, >80% for recommended

---

#### Reliability Requirements

**Validation Rules**:
1. ✅ `complaintType` MUST be from standardized list
2. ✅ `severity` MUST match impact
3. ✅ `source` MUST be valid (IN_PERSON, PHONE, EMAIL, REVIEW_SITE)
4. ✅ `resolvedAt` MUST be after `receivedAt`
5. ✅ `description` MUST be specific (>20 characters)

**Measurement**:
```sql
-- Validation pass rate
SELECT 
  COUNT(*) as total_complaints,
  COUNT(CASE WHEN resolvedAt > receivedAt THEN 1 END) as valid_time,
  COUNT(CASE WHEN LENGTH(description) >= 20 THEN 1 END) as valid_description,
  COUNT(CASE WHEN source IN ('IN_PERSON', 'PHONE', 'EMAIL', 'REVIEW_SITE') THEN 1 END) as valid_source,
  (COUNT(CASE WHEN resolvedAt > receivedAt THEN 1 END) * 100.0 / COUNT(CASE WHEN resolvedAt IS NOT NULL THEN 1 END)) as time_validity_rate,
  (COUNT(CASE WHEN LENGTH(description) >= 20 THEN 1 END) * 100.0 / COUNT(*)) as description_validity_rate
FROM Complaint
WHERE receivedAt >= CURRENT_DATE - INTERVAL '30 days';
```

**Target**: >98% validation pass rate

---

#### Timeliness Requirements

**Update SLA**:
- Complaint logging: Within 1 hour of receipt
- CRITICAL complaint escalation: Within 15 minutes
- Complaint assignment: Within 1 hour of logging
- Complaint resolution: Within 24 hours (CRITICAL), 48 hours (HIGH)

**Measurement**:
```sql
-- Complaint logging timeliness
SELECT 
  COUNT(*) as total_complaints,
  COUNT(CASE WHEN (createdAt - receivedAt) < INTERVAL '1 hour' THEN 1 END) as on_time,
  (COUNT(CASE WHEN (createdAt - receivedAt) < INTERVAL '1 hour' THEN 1 END) * 100.0 / COUNT(*)) as on_time_rate
FROM Complaint
WHERE receivedAt >= CURRENT_DATE - INTERVAL '30 days';
```

**Target**: >95% on-time

---

#### Accuracy Requirements

**Accuracy Checks**:
1. ✅ Complaint type classification is correct
2. ✅ Severity matches actual impact
3. ✅ Source is accurate

**Measurement**: Manual audit (sample 10 complaints/week)

**Target**: >95% accuracy

---

### Domain 5: AlertBudgetLog

#### Completeness Requirements

**Required Fields** (100% population):
- `date` ✅
- `watchdog` ✅
- `source` ✅
- `severity` ✅
- `isImmediate` ✅
- `createdAt` ✅

**Optional Fields**:
- `branchId` (nullable)
- `alertData` (optional)

**Measurement**:
```sql
SELECT 
  COUNT(*) as total_logs,
  COUNT(date) as has_date,
  COUNT(watchdog) as has_watchdog,
  COUNT(source) as has_source,
  COUNT(severity) as has_severity,
  COUNT(isImmediate) as has_is_immediate,
  (COUNT(date) * 100.0 / COUNT(*)) as date_completeness,
  (COUNT(watchdog) * 100.0 / COUNT(*)) as watchdog_completeness
FROM AlertBudgetLog
WHERE createdAt >= CURRENT_DATE - INTERVAL '7 days';
```

**Target**: 100% for required fields

---

#### Reliability Requirements

**Validation Rules**:
1. ✅ `watchdog` MUST be valid WatchdogName
2. ✅ `severity` MUST be valid AlertSeverity
3. ✅ `isImmediate` MUST be true if severity = CRITICAL or ERROR
4. ✅ `date` MUST be startOfDay(createdAt)

**Measurement**:
```sql
-- Validation pass rate
SELECT 
  COUNT(*) as total_logs,
  COUNT(CASE WHEN (severity IN ('CRITICAL', 'ERROR') AND isImmediate = true) OR (severity IN ('INFO', 'WARN') AND isImmediate = false) THEN 1 END) as valid_is_immediate,
  COUNT(CASE WHEN date = DATE(createdAt) THEN 1 END) as valid_date,
  (COUNT(CASE WHEN (severity IN ('CRITICAL', 'ERROR') AND isImmediate = true) OR (severity IN ('INFO', 'WARN') AND isImmediate = false) THEN 1 END) * 100.0 / COUNT(*)) as is_immediate_validity_rate,
  (COUNT(CASE WHEN date = DATE(createdAt) THEN 1 END) * 100.0 / COUNT(*)) as date_validity_rate
FROM AlertBudgetLog
WHERE createdAt >= CURRENT_DATE - INTERVAL '7 days';
```

**Target**: 100% validation pass rate

---

#### Timeliness Requirements

**Update SLA**:
- Alert logging: Within 1 second of alert sent

**Measurement**:
```sql
-- Alert logging timeliness (assume alert sent at createdAt)
SELECT 
  COUNT(*) as total_logs,
  AVG(EXTRACT(EPOCH FROM (createdAt - createdAt))) as avg_lag_seconds
FROM AlertBudgetLog
WHERE createdAt >= CURRENT_DATE - INTERVAL '7 days';
```

**Target**: <1 second lag

---

#### Accuracy Requirements

**Accuracy Checks**:
1. ✅ Every alert sent MUST be logged (no missing logs)
2. ✅ Alert data MUST match actual alert sent

**Measurement**: Reconciliation (compare alerts sent vs. logs)

**Target**: 100% accuracy

---

## Data Quality Monitoring

### Real-Time Monitoring

**Metrics**:
- Validation error rate (per domain)
- Data completeness rate (per domain)
- Data staleness (per domain)

**Alerts**:
- Validation error rate >5% → WARN
- Validation error rate >10% → CRITICAL
- Data completeness <90% → WARN
- Data completeness <80% → CRITICAL
- Data stale >24 hours → WARN

---

### Daily Monitoring

**Metrics**:
- Data quality score (per domain)
- Data timeliness (per domain)
- Data accuracy (per domain)

**Reports**:
- Data quality dashboard
- Data quality exceptions
- Data quality trends

---

### Weekly Monitoring

**Metrics**:
- Data quality trends (7-day moving average)
- Data governance compliance
- Data quality improvement initiatives

**Reports**:
- Weekly data quality report
- Data governance scorecard

---

## Data Quality Enforcement

### Enforcement Level 1: Database Constraints

**Approach**: Enforce at database level

**Examples**:
- NOT NULL constraints (required fields)
- UNIQUE constraints (no duplicates)
- FOREIGN KEY constraints (referential integrity)
- CHECK constraints (value ranges)

**Coverage**: ~40% of validation rules

---

### Enforcement Level 2: Application Validation

**Approach**: Enforce at application level (before database)

**Examples**:
- Field validation (length, format, range)
- Business logic validation (status transitions, overlaps)
- Cross-field validation (endTime > startTime)

**Coverage**: ~50% of validation rules

---

### Enforcement Level 3: API Validation

**Approach**: Enforce at API level (before application)

**Examples**:
- Request validation (required fields, types)
- Authentication/authorization
- Rate limiting

**Coverage**: ~10% of validation rules

---

### Enforcement Level 4: Manual Review

**Approach**: Manual audit and review

**Examples**:
- Data accuracy checks (sample audits)
- Root cause analysis quality
- Incident classification accuracy

**Coverage**: ~10% of validation rules (cannot be automated)

---

## Data Quality Improvement

### Continuous Improvement Process

**Step 1: Measure**
- Track data quality metrics daily
- Identify data quality issues
- Prioritize by impact

**Step 2: Analyze**
- Root cause analysis (why is data quality poor?)
- Identify systemic issues
- Identify training needs

**Step 3: Improve**
- Implement fixes (validation rules, training, process changes)
- Monitor improvement
- Iterate

**Step 4: Sustain**
- Maintain data quality standards
- Regular audits
- Continuous monitoring

---

## Data Quality Targets Summary

| Domain | Completeness | Reliability | Timeliness | Accuracy |
|--------|--------------|-------------|------------|----------|
| **Scheduling** | >95% | >98% | >95% | >98% |
| **Time Tracking** | >95% | >99% | >98% | >99% |
| **Incident** | >95% | >98% | >95% | >95% |
| **Complaint** | >95% | >98% | >95% | >95% |
| **AlertBudgetLog** | 100% | 100% | >99% | 100% |

**Overall Target**: >95% data quality across all dimensions

---

**COO Data Quality Requirements: COMPLETE** ✅

**Next**: Integration Roadmap
