# COO Operational Data Architecture

**Phase**: 1.2E-D Operational Data Integration & Data Reality Layer  
**Date**: June 24, 2026  
**Role**: Hospitality Systems Architect, Enterprise Integration Architect, Data Governance Lead  
**Status**: ✅ **ARCHITECTURE COMPLETE**  

---

## Executive Summary

**Mission**: Define exactly how ImboniServe will obtain, store, validate, govern, and monitor operational data

**Focus**: DATA REALITY (not dashboards, not intelligence, not UI)

**Objective**: Enable 80%+ of COO intelligence to function in production

**Approach**: Pragmatic, incremental, production-ready

---

## Current State Assessment

### Existing Operational Data

**Available** ✅:
- `Business` (organization data)
- `Branch` (location data)
- `MarketplaceOrder` (service delivery proxy)
- `User` (staff data - partial)

**Missing** ❌:
- Scheduling data (shifts, assignments, coverage)
- Time tracking data (attendance, clock-in/out, overtime)
- Incident tracking data (incidents, severity, resolution)
- Complaint tracking data (complaints, escalation, resolution)
- Alert budget tracking (alert history, budget enforcement)

**Functional Coverage**: 11% (1 of 9 COO intelligence checks)

---

## Data Domain 1: Scheduling Data

### Purpose

Enable shift coverage and absenteeism detection

**Enables**:
- Shift coverage gaps detection (CRITICAL)
- Absenteeism pattern detection (CRITICAL)

**Impact**: 22% of COO intelligence (2 of 9 checks)

---

### Required Entities

#### Entity 1.1: Shift

**Purpose**: Define scheduled work periods

**Schema**:
```prisma
model Shift {
  id                String          @id @default(cuid())
  branchId          String
  roleId            String?         // Optional: Server, Cook, Manager, etc.
  scheduledDate     DateTime        // Date of shift
  startTime         DateTime        // Shift start time
  endTime           DateTime        // Shift end time
  status            ShiftStatus     @default(OPEN)
  assignedStaffId   String?         // User assigned to shift
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  notes             String?         // Special instructions
  
  branch            Branch          @relation(fields: [branchId], references: [id])
  assignedStaff     User?           @relation("ShiftAssignments", fields: [assignedStaffId], references: [id])
  
  @@index([branchId, scheduledDate])
  @@index([assignedStaffId, scheduledDate])
  @@index([status, scheduledDate])
}

enum ShiftStatus {
  OPEN           // Not yet assigned
  ASSIGNED       // Assigned to staff
  CONFIRMED      // Staff confirmed availability
  IN_PROGRESS    // Shift currently active
  COMPLETED      // Shift completed
  CANCELLED      // Shift cancelled
  NO_SHOW        // Staff didn't show up
}
```

**Required Fields**:
- `branchId` ✅ (location)
- `scheduledDate` ✅ (when)
- `startTime` ✅ (shift start)
- `endTime` ✅ (shift end)
- `status` ✅ (OPEN, ASSIGNED, etc.)
- `assignedStaffId` ⚠️ (nullable - shifts can be unassigned)

**Optional Fields**:
- `roleId` (for role-specific scheduling)
- `notes` (special instructions)

---

#### Entity 1.2: ShiftRole

**Purpose**: Define shift role requirements (optional but recommended)

**Schema**:
```prisma
model ShiftRole {
  id          String   @id @default(cuid())
  branchId    String
  name        String   // "Server", "Cook", "Manager", "Bartender"
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  branch      Branch   @relation(fields: [branchId], references: [id])
  
  @@unique([branchId, name])
}
```

**Purpose**: Allow role-specific shift scheduling and coverage tracking

---

### Update Frequency

**Real-Time** (required):
- Shift assignment changes
- Shift status changes (ASSIGNED → NO_SHOW)
- Shift cancellations

**Daily** (acceptable):
- Shift schedule creation (weekly schedules)
- Shift confirmations

**Rationale**: Shift coverage detection requires near-real-time data to alert before service impact

---

### Data Quality Rules

**Completeness**:
- ✅ Every shift MUST have: branchId, scheduledDate, startTime, endTime
- ✅ Shifts MUST NOT overlap for same staff
- ✅ Shift end time MUST be after start time

**Consistency**:
- ✅ assignedStaffId MUST reference valid User
- ✅ branchId MUST reference valid Branch
- ✅ scheduledDate MUST be within reasonable range (not >1 year future)

**Timeliness**:
- ✅ Shift status MUST be updated within 15 minutes of actual change
- ✅ NO_SHOW status MUST be set within 1 hour of shift start

**Accuracy**:
- ✅ Shift times MUST match actual business hours
- ✅ Staff assignments MUST reflect actual staff availability

---

### Ownership

**Data Owner**: Operations Manager (per branch)

**Update Responsibility**:
- **Scheduling Manager**: Create shifts, assign staff
- **Staff**: Confirm shifts, request changes
- **System**: Auto-update status (IN_PROGRESS, COMPLETED)

**Validation Responsibility**: Operations Manager

---

### Integration Options

#### Option 1: External Scheduling System Integration

**Systems**: When I Work, Deputy, 7shifts, Homebase, Shiftboard

**Approach**: API integration

**Pros**:
- ✅ Mature scheduling features (swap, availability, notifications)
- ✅ Staff mobile app (clock-in, shift swaps)
- ✅ Existing staff training

**Cons**:
- ❌ Integration complexity (API mapping)
- ❌ Ongoing API maintenance
- ❌ Dependency on external system

**Effort**: 2-3 weeks

**Recommendation**: ✅ **PREFERRED** (if system already in use)

---

#### Option 2: Internal Scheduling System

**Approach**: Build custom scheduling module

**Pros**:
- ✅ Full control over data model
- ✅ No external dependencies
- ✅ Custom business logic

**Cons**:
- ❌ Development effort (4-6 weeks)
- ❌ Maintenance burden
- ❌ Staff training required

**Effort**: 4-6 weeks

**Recommendation**: ⚠️ **FALLBACK** (if no external system exists)

---

#### Option 3: Hybrid Approach

**Approach**: Simple internal shift creation + external system for advanced features

**Pros**:
- ✅ Quick to implement (1-2 weeks)
- ✅ Minimal data model
- ✅ Can migrate to full system later

**Cons**:
- ⚠️ Limited features initially
- ⚠️ Manual shift creation

**Effort**: 1-2 weeks

**Recommendation**: ✅ **FASTEST PATH** (for MVP)

---

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│           SCHEDULING DATA FLOW                          │
└─────────────────────────────────────────────────────────┘

1. SHIFT CREATION
   Operations Manager → Scheduling System → Shift table
   
2. SHIFT ASSIGNMENT
   Scheduling Manager → Assign Staff → Shift.assignedStaffId
   
3. SHIFT CONFIRMATION
   Staff → Confirm Availability → Shift.status = CONFIRMED
   
4. SHIFT START
   System → Auto-detect → Shift.status = IN_PROGRESS
   
5. SHIFT COMPLETION
   System → Auto-detect → Shift.status = COMPLETED
   
6. NO-SHOW DETECTION
   System → 1 hour after start, no clock-in → Shift.status = NO_SHOW
   
7. COO INTELLIGENCE
   StaffingWatchdog → Query Shifts → Detect coverage gaps
```

---

### Validation Rules

**On Create**:
```typescript
// Shift creation validation
if (shift.endTime <= shift.startTime) {
  throw new Error("Shift end time must be after start time")
}

if (shift.scheduledDate < today) {
  throw new Error("Cannot create shifts in the past")
}

// Check for overlapping shifts (same staff)
const overlapping = await prisma.shift.findFirst({
  where: {
    assignedStaffId: shift.assignedStaffId,
    scheduledDate: shift.scheduledDate,
    OR: [
      { startTime: { lte: shift.startTime }, endTime: { gt: shift.startTime } },
      { startTime: { lt: shift.endTime }, endTime: { gte: shift.endTime } },
    ],
  },
})

if (overlapping) {
  throw new Error("Staff already assigned to overlapping shift")
}
```

**On Update**:
```typescript
// Status transition validation
const validTransitions = {
  OPEN: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['CONFIRMED', 'OPEN', 'CANCELLED', 'NO_SHOW'],
  CONFIRMED: ['IN_PROGRESS', 'CANCELLED', 'NO_SHOW'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: [], // Terminal state
  CANCELLED: [], // Terminal state
  NO_SHOW: [], // Terminal state
}

if (!validTransitions[currentStatus].includes(newStatus)) {
  throw new Error(`Invalid status transition: ${currentStatus} → ${newStatus}`)
}
```

---

## Data Domain 2: Time Tracking Data

### Purpose

Enable attendance and overtime detection

**Enables**:
- Absenteeism pattern detection (CRITICAL)
- Overtime pressure detection (HIGH)

**Impact**: 22% of COO intelligence (2 of 9 checks)

---

### Required Entities

#### Entity 2.1: TimeEntry

**Purpose**: Track actual work hours (clock-in/clock-out)

**Schema**:
```prisma
model TimeEntry {
  id              String          @id @default(cuid())
  userId          String
  branchId        String
  shiftId         String?         // Optional: Link to scheduled shift
  clockInTime     DateTime
  clockOutTime    DateTime?       // Nullable: Still clocked in
  totalMinutes    Int?            // Auto-calculated on clock-out
  overtimeMinutes Int?            // Auto-calculated
  status          TimeEntryStatus @default(ACTIVE)
  clockInMethod   String?         // "MANUAL", "BIOMETRIC", "MOBILE"
  clockOutMethod  String?
  notes           String?
  approvedBy      String?         // Manager approval for overtime
  approvedAt      DateTime?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  user            User            @relation("TimeEntries", fields: [userId], references: [id])
  branch          Branch          @relation(fields: [branchId], references: [id])
  shift           Shift?          @relation(fields: [shiftId], references: [id])
  
  @@index([userId, clockInTime])
  @@index([branchId, clockInTime])
  @@index([shiftId])
}

enum TimeEntryStatus {
  ACTIVE        // Currently clocked in
  COMPLETED     // Clocked out
  APPROVED      // Approved by manager
  DISPUTED      // Time disputed by staff/manager
}
```

**Required Fields**:
- `userId` ✅ (who)
- `branchId` ✅ (where)
- `clockInTime` ✅ (when started)
- `clockOutTime` ⚠️ (nullable - still working)
- `totalMinutes` ⚠️ (calculated on clock-out)

**Optional Fields**:
- `shiftId` (link to scheduled shift)
- `overtimeMinutes` (calculated)
- `clockInMethod` (audit trail)
- `approvedBy` (overtime approval)

---

#### Entity 2.2: AbsenceRecord

**Purpose**: Track absences (callouts, no-shows, planned absences)

**Schema**:
```prisma
model AbsenceRecord {
  id            String        @id @default(cuid())
  userId        String
  branchId      String
  shiftId       String?       // Optional: Link to missed shift
  absenceDate   DateTime
  absenceType   AbsenceType
  reason        String?
  isLastMinute  Boolean       @default(false) // <24 hours notice
  notifiedAt    DateTime?     // When staff notified
  approvedBy    String?       // Manager approval
  approvedAt    DateTime?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  
  user          User          @relation("Absences", fields: [userId], references: [id])
  branch        Branch        @relation(fields: [branchId], references: [id])
  shift         Shift?        @relation(fields: [shiftId], references: [id])
  
  @@index([userId, absenceDate])
  @@index([branchId, absenceDate])
  @@index([absenceType, absenceDate])
}

enum AbsenceType {
  NO_SHOW       // Didn't show up, no notice
  CALLOUT       // Called out sick/emergency
  PLANNED       // Planned absence (vacation, etc.)
  APPROVED      // Manager-approved absence
  UNAPPROVED    // Unapproved absence
}
```

**Required Fields**:
- `userId` ✅ (who)
- `branchId` ✅ (where)
- `absenceDate` ✅ (when)
- `absenceType` ✅ (NO_SHOW, CALLOUT, etc.)
- `isLastMinute` ✅ (urgency indicator)

---

### Update Frequency

**Real-Time** (required):
- Clock-in events
- Clock-out events
- Absence notifications

**Hourly** (acceptable):
- Overtime calculations
- Absence record creation (for no-shows)

**Daily** (acceptable):
- Overtime approval
- Time entry corrections

**Rationale**: Absenteeism detection requires hourly updates to alert same-day

---

### Data Quality Rules

**Completeness**:
- ✅ Every time entry MUST have: userId, branchId, clockInTime
- ✅ Completed time entries MUST have: clockOutTime, totalMinutes
- ✅ Absence records MUST have: userId, branchId, absenceDate, absenceType

**Consistency**:
- ✅ clockOutTime MUST be after clockInTime
- ✅ totalMinutes MUST match clockOutTime - clockInTime
- ✅ overtimeMinutes MUST be calculated correctly (>8 hours/day or >40 hours/week)

**Timeliness**:
- ✅ Clock-in/out MUST be recorded within 5 minutes of actual event
- ✅ Absence records MUST be created within 1 hour of shift start (for no-shows)

**Accuracy**:
- ✅ Time entries MUST match actual work hours
- ✅ Overtime calculations MUST follow labor law rules

---

### Ownership

**Data Owner**: Operations Manager (per branch)

**Update Responsibility**:
- **Staff**: Clock-in, clock-out, notify absences
- **System**: Auto-calculate overtime, detect no-shows
- **Manager**: Approve overtime, approve absences

**Validation Responsibility**: Operations Manager, Payroll

---

### Integration Options

#### Option 1: External Time Tracking System Integration

**Systems**: ADP, Paychex, Kronos, TimeClock Plus, BambooHR

**Approach**: API integration

**Pros**:
- ✅ Mature time tracking features (biometric, mobile, geofencing)
- ✅ Payroll integration
- ✅ Labor law compliance

**Cons**:
- ❌ Integration complexity
- ❌ Payroll system access restrictions (PII concerns)
- ❌ Ongoing API maintenance

**Effort**: 2-3 weeks

**Recommendation**: ✅ **PREFERRED** (if system already in use)

---

#### Option 2: Internal Time Tracking System

**Approach**: Build custom time tracking module

**Pros**:
- ✅ Full control over data model
- ✅ No external dependencies
- ✅ Custom business logic

**Cons**:
- ❌ Development effort (3-4 weeks)
- ❌ Maintenance burden
- ❌ Labor law compliance responsibility

**Effort**: 3-4 weeks

**Recommendation**: ⚠️ **FALLBACK** (if no external system exists)

---

#### Option 3: Hybrid Approach (Shift-Based Attendance)

**Approach**: Use Shift.status to track attendance (no separate time tracking)

**Pros**:
- ✅ Simplest implementation (1 week)
- ✅ No additional tables
- ✅ Good enough for absenteeism detection

**Cons**:
- ❌ No precise clock-in/out times
- ❌ No overtime calculation
- ❌ Limited audit trail

**Effort**: 1 week

**Recommendation**: ✅ **FASTEST PATH** (for MVP, absenteeism only)

---

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│           TIME TRACKING DATA FLOW                       │
└─────────────────────────────────────────────────────────┘

1. CLOCK-IN
   Staff → Mobile/Kiosk → TimeEntry.clockInTime
   
2. CLOCK-OUT
   Staff → Mobile/Kiosk → TimeEntry.clockOutTime
   System → Calculate → TimeEntry.totalMinutes, overtimeMinutes
   
3. NO-SHOW DETECTION
   System → 1 hour after shift start, no clock-in → AbsenceRecord (NO_SHOW)
   
4. CALLOUT
   Staff → Notify Manager → AbsenceRecord (CALLOUT)
   System → Check notice time → AbsenceRecord.isLastMinute
   
5. OVERTIME APPROVAL
   Manager → Review → TimeEntry.approvedBy, approvedAt
   
6. COO INTELLIGENCE
   StaffingWatchdog → Query TimeEntry + AbsenceRecord → Detect absenteeism
   StaffingWatchdog → Query TimeEntry → Detect overtime pressure
```

---

### Validation Rules

**On Clock-In**:
```typescript
// Prevent duplicate clock-ins
const activeEntry = await prisma.timeEntry.findFirst({
  where: {
    userId: userId,
    status: 'ACTIVE',
    clockOutTime: null,
  },
})

if (activeEntry) {
  throw new Error("User already clocked in")
}

// Validate clock-in time (not future)
if (clockInTime > new Date()) {
  throw new Error("Cannot clock in for future time")
}
```

**On Clock-Out**:
```typescript
// Validate clock-out time
if (clockOutTime <= clockInTime) {
  throw new Error("Clock-out time must be after clock-in time")
}

// Calculate total minutes
const totalMinutes = Math.floor((clockOutTime - clockInTime) / (1000 * 60))

// Calculate overtime (>8 hours/day)
const overtimeMinutes = Math.max(0, totalMinutes - 480) // 480 min = 8 hours

// Update time entry
await prisma.timeEntry.update({
  where: { id: timeEntryId },
  data: {
    clockOutTime,
    totalMinutes,
    overtimeMinutes,
    status: overtimeMinutes > 0 ? 'COMPLETED' : 'APPROVED',
  },
})
```

---

## Data Domain 3: Incident Tracking Data

### Purpose

Enable incident frequency, pattern, and critical incident detection

**Enables**:
- Incident frequency detection (CRITICAL)
- Recurring incident pattern detection (CRITICAL - world-class)
- Critical incident detection (CRITICAL)

**Impact**: 33% of COO intelligence (3 of 9 checks)

---

### Required Entities

#### Entity 3.1: Incident

**Purpose**: Track operational incidents

**Schema**:
```prisma
model Incident {
  id                String          @id @default(cuid())
  branchId          String
  incidentType      String          // "SERVICE_DELAY", "EQUIPMENT_FAILURE", "SAFETY", etc.
  severity          IncidentSeverity
  title             String
  description       String
  occurredAt        DateTime
  reportedBy        String          // User ID
  assignedTo        String?         // User ID (for resolution)
  status            IncidentStatus  @default(OPEN)
  resolvedAt        DateTime?
  resolutionNotes   String?
  rootCause         String?         // Root cause analysis
  correctiveAction  String?         // Actions taken
  preventiveAction  String?         // Actions to prevent recurrence
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  
  branch            Branch          @relation(fields: [branchId], references: [id])
  reporter          User            @relation("IncidentsReported", fields: [reportedBy], references: [id])
  assignee          User?           @relation("IncidentsAssigned", fields: [assignedTo], references: [id])
  
  @@index([branchId, occurredAt])
  @@index([incidentType, occurredAt])
  @@index([severity, occurredAt])
  @@index([status, occurredAt])
}

enum IncidentSeverity {
  CRITICAL      // Safety, legal, severe quality (immediate escalation)
  HIGH          // Significant operational impact
  MEDIUM        // Moderate impact
  LOW           // Minor impact
}

enum IncidentStatus {
  OPEN          // Incident reported, not yet assigned
  ASSIGNED      // Assigned to staff for resolution
  IN_PROGRESS   // Resolution in progress
  RESOLVED      // Incident resolved
  CLOSED        // Incident closed (verified resolved)
  RECURRING     // Marked as recurring (systemic issue)
}
```

**Required Fields**:
- `branchId` ✅ (where)
- `incidentType` ✅ (what - for pattern detection)
- `severity` ✅ (urgency)
- `title` ✅ (summary)
- `description` ✅ (details)
- `occurredAt` ✅ (when)
- `reportedBy` ✅ (who reported)

**Optional Fields**:
- `assignedTo` (who's fixing it)
- `rootCause` (root cause analysis - CRITICAL for pattern detection)
- `correctiveAction` (what was done)
- `preventiveAction` (how to prevent recurrence)

---

#### Entity 3.2: IncidentType

**Purpose**: Standardize incident classification (for pattern detection)

**Schema**:
```prisma
model IncidentType {
  id          String   @id @default(cuid())
  branchId    String?  // Nullable: Global or branch-specific
  name        String   // "Service Delay", "Equipment Failure", "Safety Incident"
  category    String   // "SERVICE", "EQUIPMENT", "SAFETY", "QUALITY"
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  branch      Branch?  @relation(fields: [branchId], references: [id])
  
  @@unique([branchId, name])
}
```

**Purpose**: Enable recurring pattern detection by standardizing incident types

**Recommended Types**:
- SERVICE_DELAY (service took too long)
- EQUIPMENT_FAILURE (equipment broke)
- SAFETY_INCIDENT (safety issue)
- QUALITY_COMPLAINT (quality issue)
- STAFF_SHORTAGE (staffing issue)
- SUPPLY_SHORTAGE (inventory issue)
- CUSTOMER_COMPLAINT (customer dissatisfaction)
- HEALTH_VIOLATION (health code violation)

---

### Update Frequency

**Real-Time** (required):
- Incident creation (especially CRITICAL severity)
- Incident status changes

**Hourly** (acceptable):
- Incident assignment
- Resolution updates

**Daily** (acceptable):
- Root cause analysis
- Preventive action documentation

**Rationale**: Critical incidents require immediate escalation. Pattern detection requires daily data.

---

### Data Quality Rules

**Completeness**:
- ✅ Every incident MUST have: branchId, incidentType, severity, title, occurredAt, reportedBy
- ✅ RESOLVED incidents MUST have: resolvedAt, resolutionNotes
- ✅ CLOSED incidents SHOULD have: rootCause, correctiveAction (for pattern detection)

**Consistency**:
- ✅ incidentType MUST be from standardized list (IncidentType table)
- ✅ severity MUST match incident impact (CRITICAL = safety/legal/severe)
- ✅ resolvedAt MUST be after occurredAt

**Timeliness**:
- ✅ CRITICAL incidents MUST be reported within 15 minutes
- ✅ HIGH incidents MUST be reported within 1 hour
- ✅ MEDIUM/LOW incidents MUST be reported within 24 hours

**Accuracy**:
- ✅ Incident descriptions MUST be specific (not generic)
- ✅ Root cause analysis MUST identify actual root cause (not symptom)

---

### Ownership

**Data Owner**: Operations Manager (per branch)

**Update Responsibility**:
- **Staff**: Report incidents
- **Manager**: Assign incidents, approve resolutions
- **Assignee**: Update status, document resolution
- **Operations Manager**: Root cause analysis, preventive actions

**Validation Responsibility**: Operations Manager, Safety Officer (for CRITICAL)

---

### Integration Options

#### Option 1: External Incident Tracking System Integration

**Systems**: Jira, Linear, ServiceNow, Asana (with custom fields)

**Approach**: API integration

**Pros**:
- ✅ Mature incident management features
- ✅ Workflow automation
- ✅ Reporting and analytics

**Cons**:
- ❌ Integration complexity
- ❌ Generic (not hospitality-specific)
- ❌ Ongoing API maintenance

**Effort**: 2-3 weeks

**Recommendation**: ⚠️ **CONDITIONAL** (if system already in use for operations)

---

#### Option 2: Internal Incident Tracking System

**Approach**: Build custom incident tracking module

**Pros**:
- ✅ Full control over data model
- ✅ Hospitality-specific incident types
- ✅ Custom workflow (root cause analysis, preventive actions)
- ✅ Direct integration with COO intelligence

**Cons**:
- ❌ Development effort (3-4 weeks)
- ❌ Maintenance burden

**Effort**: 3-4 weeks

**Recommendation**: ✅ **PREFERRED** (no standard hospitality incident system exists)

---

#### Option 3: Simple Form + Database

**Approach**: Incident entry form → Incident table

**Pros**:
- ✅ Fastest implementation (1-2 weeks)
- ✅ Minimal complexity
- ✅ Good enough for pattern detection

**Cons**:
- ⚠️ Manual workflow
- ⚠️ Limited features initially

**Effort**: 1-2 weeks

**Recommendation**: ✅ **FASTEST PATH** (for MVP)

---

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│           INCIDENT TRACKING DATA FLOW                   │
└─────────────────────────────────────────────────────────┘

1. INCIDENT OCCURS
   Staff → Observe Issue → Incident occurs
   
2. INCIDENT REPORTED
   Staff → Report Form → Incident.create()
   System → Check severity → If CRITICAL, immediate escalation
   
3. INCIDENT ASSIGNED
   Manager → Assign to Staff → Incident.assignedTo
   
4. INCIDENT RESOLUTION
   Assignee → Fix Issue → Incident.status = IN_PROGRESS
   Assignee → Document Fix → Incident.resolutionNotes
   Assignee → Mark Resolved → Incident.status = RESOLVED
   
5. ROOT CAUSE ANALYSIS
   Manager → Analyze → Incident.rootCause
   Manager → Document Actions → Incident.correctiveAction, preventiveAction
   
6. INCIDENT CLOSURE
   Manager → Verify Resolution → Incident.status = CLOSED
   
7. COO INTELLIGENCE
   IncidentWatchdog → Query Incidents → Detect frequency
   IncidentWatchdog → Group by incidentType → Detect recurring patterns
   IncidentWatchdog → Filter severity = CRITICAL → Immediate alert
```

---

### Validation Rules

**On Create**:
```typescript
// Validate incident type
const incidentType = await prisma.incidentType.findFirst({
  where: {
    name: incident.incidentType,
    isActive: true,
  },
})

if (!incidentType) {
  throw new Error("Invalid incident type")
}

// Validate severity for critical incidents
if (incident.severity === 'CRITICAL') {
  // Immediate escalation
  await notifyOperationsManager(incident)
  await notifySafetyOfficer(incident)
}

// Validate occurred time (not future)
if (incident.occurredAt > new Date()) {
  throw new Error("Incident cannot occur in the future")
}
```

**On Resolution**:
```typescript
// Require resolution notes
if (!incident.resolutionNotes || incident.resolutionNotes.length < 10) {
  throw new Error("Resolution notes required (minimum 10 characters)")
}

// Encourage root cause analysis for recurring incidents
const recentSimilar = await prisma.incident.count({
  where: {
    branchId: incident.branchId,
    incidentType: incident.incidentType,
    occurredAt: { gte: subDays(new Date(), 7) },
  },
})

if (recentSimilar >= 2 && !incident.rootCause) {
  console.warn("Recurring incident detected. Root cause analysis recommended.")
}
```

---

## Data Domain 4: Complaint Tracking Data

### Purpose

Enable complaint velocity and escalation pattern detection

**Enables**:
- Complaint velocity detection (MEDIUM priority)

**Impact**: 11% of COO intelligence (1 of 9 checks)

---

### Required Entities

#### Entity 4.1: Complaint

**Purpose**: Track customer complaints

**Schema**:
```prisma
model Complaint {
  id              String           @id @default(cuid())
  branchId        String
  customerId      String?          // Optional: Link to customer
  complaintType   String           // "SERVICE", "QUALITY", "STAFF", "CLEANLINESS"
  severity        ComplaintSeverity
  source          String           // "IN_PERSON", "PHONE", "EMAIL", "REVIEW_SITE"
  title           String
  description     String
  receivedAt      DateTime
  reportedBy      String           // User ID (staff who received complaint)
  assignedTo      String?          // User ID (for resolution)
  status          ComplaintStatus  @default(OPEN)
  resolvedAt      DateTime?
  resolutionNotes String?
  compensationOffered String?      // "REFUND", "DISCOUNT", "FREE_ITEM"
  customerSatisfied Boolean?       // Follow-up satisfaction
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  
  branch          Branch           @relation(fields: [branchId], references: [id])
  customer        Customer?        @relation(fields: [customerId], references: [id])
  reporter        User             @relation("ComplaintsReported", fields: [reportedBy], references: [id])
  assignee        User?            @relation("ComplaintsAssigned", fields: [assignedTo], references: [id])
  
  @@index([branchId, receivedAt])
  @@index([complaintType, receivedAt])
  @@index([severity, receivedAt])
  @@index([status, receivedAt])
}

enum ComplaintSeverity {
  CRITICAL      // Severe dissatisfaction, legal threat, social media
  HIGH          // Significant dissatisfaction
  MEDIUM        // Moderate dissatisfaction
  LOW           // Minor dissatisfaction
}

enum ComplaintStatus {
  OPEN          // Complaint received, not yet assigned
  ASSIGNED      // Assigned to staff for resolution
  IN_PROGRESS   // Resolution in progress
  RESOLVED      // Complaint resolved
  CLOSED        // Complaint closed (customer satisfied)
  ESCALATED     // Escalated to management
}
```

**Required Fields**:
- `branchId` ✅ (where)
- `complaintType` ✅ (what)
- `severity` ✅ (urgency)
- `source` ✅ (how received)
- `title` ✅ (summary)
- `description` ✅ (details)
- `receivedAt` ✅ (when)
- `reportedBy` ✅ (who received)

**Optional Fields**:
- `customerId` (link to customer)
- `compensationOffered` (service recovery)
- `customerSatisfied` (follow-up)

---

### Update Frequency

**Real-Time** (required):
- Complaint creation (especially CRITICAL severity)
- Complaint status changes

**Hourly** (acceptable):
- Complaint assignment
- Resolution updates

**Daily** (acceptable):
- Customer satisfaction follow-up

**Rationale**: Complaint velocity detection requires hourly updates to detect surges

---

### Data Quality Rules

**Completeness**:
- ✅ Every complaint MUST have: branchId, complaintType, severity, source, receivedAt, reportedBy
- ✅ RESOLVED complaints MUST have: resolvedAt, resolutionNotes
- ✅ CLOSED complaints SHOULD have: customerSatisfied (follow-up)

**Consistency**:
- ✅ complaintType MUST be from standardized list
- ✅ severity MUST match complaint impact
- ✅ resolvedAt MUST be after receivedAt

**Timeliness**:
- ✅ Complaints MUST be logged within 1 hour of receipt
- ✅ CRITICAL complaints MUST be escalated within 15 minutes

**Accuracy**:
- ✅ Complaint descriptions MUST be specific
- ✅ Source MUST be accurate (for trend analysis)

---

### Ownership

**Data Owner**: Customer Service Manager (per branch)

**Update Responsibility**:
- **Staff**: Log complaints
- **Manager**: Assign complaints, approve resolutions
- **Assignee**: Update status, document resolution
- **Customer Service Manager**: Follow-up, satisfaction tracking

**Validation Responsibility**: Customer Service Manager

---

### Integration Options

#### Option 1: External CRM/Helpdesk Integration

**Systems**: Zendesk, Freshdesk, Help Scout, Intercom

**Approach**: API integration

**Pros**:
- ✅ Mature complaint management features
- ✅ Multi-channel support (email, chat, phone)
- ✅ Automation and workflows

**Cons**:
- ❌ Integration complexity
- ❌ Generic (not hospitality-specific)
- ❌ Ongoing cost

**Effort**: 2-3 weeks

**Recommendation**: ⚠️ **CONDITIONAL** (if system already in use)

---

#### Option 2: Internal Complaint Tracking System

**Approach**: Build custom complaint tracking module

**Pros**:
- ✅ Full control over data model
- ✅ Hospitality-specific complaint types
- ✅ Direct integration with COO intelligence

**Cons**:
- ❌ Development effort (2-3 weeks)
- ❌ Maintenance burden

**Effort**: 2-3 weeks

**Recommendation**: ✅ **PREFERRED** (for hospitality-specific needs)

---

#### Option 3: Simple Form + Database

**Approach**: Complaint entry form → Complaint table

**Pros**:
- ✅ Fastest implementation (1 week)
- ✅ Minimal complexity
- ✅ Good enough for velocity detection

**Cons**:
- ⚠️ Manual workflow
- ⚠️ Limited features initially

**Effort**: 1 week

**Recommendation**: ✅ **FASTEST PATH** (for MVP)

---

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│           COMPLAINT TRACKING DATA FLOW                  │
└─────────────────────────────────────────────────────────┘

1. COMPLAINT RECEIVED
   Customer → Complain → Staff receives
   
2. COMPLAINT LOGGED
   Staff → Log Form → Complaint.create()
   System → Check severity → If CRITICAL, immediate escalation
   
3. COMPLAINT ASSIGNED
   Manager → Assign to Staff → Complaint.assignedTo
   
4. COMPLAINT RESOLUTION
   Assignee → Resolve Issue → Complaint.status = IN_PROGRESS
   Assignee → Document Resolution → Complaint.resolutionNotes
   Assignee → Offer Compensation → Complaint.compensationOffered
   
5. CUSTOMER FOLLOW-UP
   Manager → Contact Customer → Complaint.customerSatisfied
   
6. COMPLAINT CLOSURE
   Manager → Verify Satisfaction → Complaint.status = CLOSED
   
7. COO INTELLIGENCE
   ServiceQualityWatchdog → Query Complaints → Detect velocity
   ServiceQualityWatchdog → Compare today vs. yesterday → Detect acceleration
```

---

## Data Domain 5: AlertBudgetLog

### Purpose

Track alert budget usage and enforce limits

**Enables**:
- Alert budget enforcement (max 10/day)
- Weekly CRITICAL budget enforcement (max 3/week)
- Alert volume reporting
- Trust safeguard monitoring

**Impact**: Critical for trust (prevents alert fatigue)

---

### Required Entity

#### Entity 5.1: AlertBudgetLog

**Purpose**: Track every alert sent

**Schema**:
```prisma
model AlertBudgetLog {
  id          String        @id @default(cuid())
  date        DateTime      // Date of alert (for daily budget)
  watchdog    WatchdogName  // "STAFFING", "SERVICE_QUALITY", "INCIDENT"
  source      String        // Specific check (e.g., "shift_coverage_branch123")
  severity    AlertSeverity // "INFO", "WARN", "ERROR", "CRITICAL"
  isImmediate Boolean       // true if CRITICAL or ERROR
  branchId    String?       // Optional: Location-specific
  alertData   Json?         // Optional: Full alert data (for audit)
  createdAt   DateTime      @default(now())
  
  @@index([date])
  @@index([watchdog, date])
  @@index([severity, date])
  @@index([isImmediate, createdAt])
}

enum WatchdogName {
  PAYMENT
  QUEUE
  RECONCILIATION
  SUBSCRIPTION
  REVENUE
  CUSTOMER
  EXECUTIVE_KPI
  DATA_QUALITY
  STAFFING
  SERVICE_QUALITY
  INCIDENT
}

enum AlertSeverity {
  INFO
  WARN
  ERROR
  CRITICAL
}
```

**Required Fields**:
- `date` ✅ (for daily budget)
- `watchdog` ✅ (which watchdog)
- `source` ✅ (which check)
- `severity` ✅ (urgency)
- `isImmediate` ✅ (for weekly CRITICAL budget)
- `createdAt` ✅ (timestamp)

**Optional Fields**:
- `branchId` (location-specific alerts)
- `alertData` (full alert for audit)

---

### Update Frequency

**Real-Time** (required):
- Alert sent → Log entry created immediately

**Rationale**: Budget enforcement requires real-time tracking

---

### Data Quality Rules

**Completeness**:
- ✅ Every alert MUST be logged (no exceptions)
- ✅ All required fields MUST be populated

**Consistency**:
- ✅ watchdog MUST be valid WatchdogName
- ✅ severity MUST be valid AlertSeverity
- ✅ isImmediate MUST be true if severity = CRITICAL or ERROR

**Timeliness**:
- ✅ Alert MUST be logged within 1 second of sending

**Accuracy**:
- ✅ date MUST be startOfDay(createdAt)
- ✅ Alert data MUST match actual alert sent

---

### Retention Policy

**Retention**:
- Keep all alert logs for **90 days** (for trend analysis)
- Archive logs >90 days to cold storage
- Purge logs >1 year

**Rationale**: 90 days allows quarterly trend analysis without excessive storage

---

### Auditability

**Audit Requirements**:
- ✅ Every alert MUST be traceable (who, what, when, why)
- ✅ Alert budget enforcement MUST be auditable
- ✅ Alert suppression MUST be logged (for transparency)

**Audit Queries**:
```sql
-- Daily alert volume
SELECT date, COUNT(*) as alert_count
FROM AlertBudgetLog
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY date
ORDER BY date DESC;

-- Alert volume by watchdog
SELECT watchdog, COUNT(*) as alert_count
FROM AlertBudgetLog
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY watchdog
ORDER BY alert_count DESC;

-- CRITICAL alert volume (weekly budget check)
SELECT COUNT(*) as critical_count
FROM AlertBudgetLog
WHERE isImmediate = true
  AND createdAt >= CURRENT_DATE - INTERVAL '7 days';
```

---

### Reporting Requirements

**Daily Report**:
- Alert volume by watchdog
- Alert volume by severity
- Budget usage (X of 10 alerts used)
- CRITICAL budget usage (X of 3 used this week)

**Weekly Report**:
- Alert trends (increasing/decreasing)
- Most frequent alert sources
- Alert accuracy (if feedback available)

**Monthly Report**:
- Alert volume trends
- Budget exhaustion frequency
- Watchdog effectiveness

---

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│           ALERT BUDGET LOG DATA FLOW                    │
└─────────────────────────────────────────────────────────┘

1. WATCHDOG GENERATES ALERT
   Watchdog → Generate Alert → Alert object
   
2. CHECK BUDGET
   AlertBudgetManager → Query AlertBudgetLog → Count today's alerts
   AlertBudgetManager → Check if < 10 → Allow or reject
   
3. CHECK WEEKLY CRITICAL BUDGET
   AlertBudgetManager → Query AlertBudgetLog → Count this week's CRITICAL
   AlertBudgetManager → Check if < 3 → Allow or reject
   
4. LOG ALERT
   AlertDeliveryService → Send Alert → Log to AlertBudgetLog
   
5. REPORTING
   Dashboard → Query AlertBudgetLog → Display budget usage
```

---

## Data Quality Classification

### GREEN: Production-Ready ✅

**Criteria**:
- Data source exists
- Data is complete (>95% fields populated)
- Data is reliable (>95% accuracy)
- Data is timely (<1 hour lag)
- Ownership is clear
- Validation rules enforced

**Current GREEN Sources**:
- `Branch` (location data) ✅
- `MarketplaceOrder` (service delivery proxy) ✅

---

### YELLOW: Usable with Limitations ⚠️

**Criteria**:
- Data source exists
- Data is mostly complete (80-95% fields populated)
- Data is mostly reliable (80-95% accuracy)
- Data is somewhat timely (<24 hour lag)
- Ownership is defined but not enforced
- Validation rules partially enforced

**Current YELLOW Sources**:
- `User` (staff data - partial) ⚠️
  - Missing: Shift assignments, attendance, overtime
  - Limitation: No operational data, only identity

---

### RED: Not Production-Ready ❌

**Criteria**:
- Data source missing
- Data is incomplete (<80% fields populated)
- Data is unreliable (<80% accuracy)
- Data is stale (>24 hour lag)
- Ownership is unclear
- Validation rules not enforced

**Current RED Sources**:
- `Shift` (scheduling data) ❌ - **DOES NOT EXIST**
- `TimeEntry` (time tracking data) ❌ - **DOES NOT EXIST**
- `AbsenceRecord` (absence data) ❌ - **DOES NOT EXIST**
- `Incident` (incident data) ❌ - **DOES NOT EXIST**
- `Complaint` (complaint data) ❌ - **DOES NOT EXIST**
- `AlertBudgetLog` (alert tracking) ❌ - **DOES NOT EXIST**

---

## Summary: Data Source Status

| Data Domain | Status | Completeness | Reliability | Ownership | Auditability | Operational Usefulness |
|-------------|--------|--------------|-------------|-----------|--------------|------------------------|
| **Branch** | 🟢 GREEN | 100% | 100% | Clear | High | High |
| **MarketplaceOrder** | 🟢 GREEN | 95% | 95% | Clear | High | Medium |
| **User** | 🟡 YELLOW | 80% | 90% | Clear | Medium | Low |
| **Shift** | 🔴 RED | 0% | N/A | TBD | None | N/A |
| **TimeEntry** | 🔴 RED | 0% | N/A | TBD | None | N/A |
| **AbsenceRecord** | 🔴 RED | 0% | N/A | TBD | None | N/A |
| **Incident** | 🔴 RED | 0% | N/A | TBD | None | N/A |
| **Complaint** | 🔴 RED | 0% | N/A | TBD | None | N/A |
| **AlertBudgetLog** | 🔴 RED | 0% | N/A | TBD | None | N/A |

**GREEN**: 2/9 (22%)  
**YELLOW**: 1/9 (11%)  
**RED**: 6/9 (67%)  

**Conclusion**: **CRITICAL DATA GAPS** - 67% of required data sources do not exist

---

**COO Operational Data Architecture: COMPLETE** ✅

**Next**: Data Governance Framework
