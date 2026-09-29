# ImboniServe Customer Onboarding Review

**Phase**: 1.2E-E Deployment Readiness & Platform Reality Review  
**Date**: June 24, 2026  
**Role**: Customer Success Architect, Product Adoption Strategist  
**Status**: ✅ **REVIEW COMPLETE**  

---

## Executive Summary

**Question**: Can a new hotel be onboarded today?

**Answer**: ❌ **NO** - Critical onboarding gaps prevent hotel setup

**Onboarding Readiness**: **35/100** (NOT READY)

**Key Finding**: Signup works, but hotel-specific setup is completely missing

---

## Current Onboarding Flow Analysis

### Step 1: Signup ✅

**What Works**:
- User registration (`/api/auth/signup`)
- Business creation
- Email/phone validation
- Password hashing
- Trial eligibility check
- Fraud detection
- Affiliate attribution

**Code Evidence** (`@/pages/api/auth/signup.ts`):
```typescript
// User creation
const user = await prisma.user.create({
  data: {
    name: input.name,
    email: input.email,
    password: hashedPassword,
    phone: input.phone,
    isActive: true,
  },
})

// Business creation
const restaurant = await prisma.business.create({
  data: {
    name: input.businessName,
    city: input.city,
    phone: input.phone,
    ownerId: user.id,
    planId: plan.id,
    businessType, // 'HOTEL' supported
    trialStartDate,
    trialEndDate,
    approvalStatus,
  },
})
```

**Assessment**: ✅ **WORKS** - Signup is production-ready

---

### Step 2: Hotel-Specific Setup ❌

**What's Missing**:
- ❌ Room configuration
- ❌ Department setup
- ❌ Shift pattern configuration
- ❌ Staff role assignment (hotel-specific)
- ❌ Service type configuration
- ❌ Amenity setup

**What Happens After Signup**:
1. User logs in
2. Sees generic dashboard
3. ❌ **No onboarding wizard**
4. ❌ **No setup checklist**
5. ❌ **No guidance on next steps**

**Assessment**: ❌ **MISSING** - Hotels cannot complete setup

---

### Step 3: Branch Configuration ⚠️

**What Works**:
- Branch creation (location)
- Branch name, address, phone
- Branch activation

**What's Missing**:
- ❌ Hotel-specific branch configuration
- ❌ Room count per branch
- ❌ Department structure per branch
- ❌ Operating hours (24/7 for hotels)

**Assessment**: ⚠️ **PARTIAL** - Basic branch setup works, hotel specifics missing

---

### Step 4: User Management ⚠️

**What Works**:
- User creation
- Role assignment (generic roles)
- Branch assignment
- Permission management (basic)

**What's Missing**:
- ❌ Hotel-specific roles (HOUSEKEEPING, CONCIERGE, etc.)
- ❌ Department assignment
- ❌ Shift assignment
- ❌ Multi-branch access (for hotel chains)

**Assessment**: ⚠️ **PARTIAL** - Basic user management works, hotel roles missing

---

### Step 5: Operational Setup ❌

**What's Missing**:
- ❌ Shift schedule creation
- ❌ Time tracking setup
- ❌ Incident tracking setup
- ❌ Complaint tracking setup
- ❌ Room status tracking

**Assessment**: ❌ **MISSING** - No operational setup available

---

### Step 6: Training & Support ❌

**What's Missing**:
- ❌ Welcome email (hotel-specific)
- ❌ Onboarding checklist
- ❌ Quick start guide
- ❌ Video tutorials
- ❌ Live onboarding call

**Assessment**: ❌ **MISSING** - No structured training

---

## Onboarding Steps: What's Manual vs. Automated

### Manual Steps (Require Human Intervention)

**Step 1: Account Approval** (if not auto-approved)
- **Who**: ImboniServe admin
- **When**: After signup, if risk score is high
- **Time**: 1-3 days (manual review)
- **Automation Opportunity**: ✅ **HIGH** (improve risk scoring)

**Step 2: Room Configuration** (currently impossible)
- **Who**: Hotel manager
- **When**: After signup
- **Time**: N/A (feature doesn't exist)
- **Automation Opportunity**: ❌ **NONE** (requires UI development)

**Step 3: Department Setup** (currently impossible)
- **Who**: Hotel manager
- **When**: After signup
- **Time**: N/A (feature doesn't exist)
- **Automation Opportunity**: ❌ **NONE** (requires UI development)

**Step 4: Staff Onboarding** (partially manual)
- **Who**: Hotel manager
- **When**: After setup
- **Time**: 10-30 minutes per staff member
- **Automation Opportunity**: ⚠️ **MEDIUM** (bulk import, CSV upload)

**Step 5: Shift Schedule Creation** (currently impossible)
- **Who**: Hotel manager
- **When**: After staff onboarding
- **Time**: N/A (feature doesn't exist)
- **Automation Opportunity**: ❌ **NONE** (requires UI development)

**Step 6: Training** (currently manual)
- **Who**: ImboniServe customer success
- **When**: After signup
- **Time**: 1-2 hours (live call)
- **Automation Opportunity**: ✅ **HIGH** (video tutorials, documentation)

---

### Automated Steps (No Human Intervention)

**Step 1: Signup**
- ✅ User registration
- ✅ Business creation
- ✅ Trial activation (if auto-approved)
- ✅ Email verification
- ✅ Fraud detection

**Step 2: Login**
- ✅ Authentication
- ✅ Session management
- ✅ Dashboard access

**Step 3: Dashboard Access**
- ✅ CEO Dashboard (revenue, customers)
- ✅ CFO Dashboard (financial ledger)
- ⚠️ COO Dashboard (no data, non-functional)

---

## Onboarding Gaps Analysis

### Gap 1: No Onboarding Wizard ❌

**Current State**: User lands on generic dashboard after signup

**Expected State**: User sees onboarding wizard with step-by-step setup

**Impact**: **HIGH** - Users don't know what to do first

**Example Onboarding Wizard**:
```
Step 1: Configure Your Hotel
- Add rooms (20 rooms)
- Set up departments (Front Desk, Housekeeping, F&B)
- Configure operating hours (24/7)

Step 2: Add Your Team
- Invite managers (2 managers)
- Invite front desk staff (5 staff)
- Invite housekeeping staff (8 staff)

Step 3: Set Up Shifts
- Create shift patterns (Morning, Afternoon, Night)
- Assign staff to shifts
- Configure shift coverage

Step 4: Enable Operational Intelligence
- Connect scheduling data
- Enable time tracking
- Enable incident tracking

Step 5: Start Using ImboniServe
- View COO Dashboard
- Review operational alerts
- Train your team
```

**Effort**: 2-3 weeks (1 developer)

**Priority**: 🔴 **P0 - CRITICAL**

---

### Gap 2: No Setup Checklist ❌

**Current State**: No visual progress indicator

**Expected State**: Interactive checklist showing setup progress

**Impact**: **MEDIUM** - Users don't know how much setup remains

**Example Setup Checklist**:
```
Hotel Setup Progress: 3 of 10 steps complete

✅ Account created
✅ Business profile completed
✅ Branch added
⬜ Rooms configured (0 of 20)
⬜ Departments set up (0 of 4)
⬜ Staff invited (0 of 15)
⬜ Shifts created (0 of 21)
⬜ Operational data connected
⬜ Training completed
⬜ First guest checked in
```

**Effort**: 1 week (1 developer)

**Priority**: 🟡 **P1 - HIGH**

---

### Gap 3: No Welcome Email (Hotel-Specific) ❌

**Current State**: Generic welcome email (if any)

**Expected State**: Hotel-specific welcome email with next steps

**Impact**: **MEDIUM** - Users don't receive guidance after signup

**Example Welcome Email**:
```
Subject: Welcome to ImboniServe! Let's Set Up Your Hotel

Hi [Hotel Manager Name],

Welcome to ImboniServe! We're excited to help you streamline your hotel operations.

Here's what to do next:

1. Configure Your Rooms (5 minutes)
   - Add your 20 rooms
   - Set room types (Standard, Deluxe, Suite)
   - Configure room pricing
   [Start Room Setup →]

2. Set Up Your Departments (3 minutes)
   - Front Desk
   - Housekeeping
   - Food & Beverage
   - Maintenance
   [Start Department Setup →]

3. Invite Your Team (10 minutes)
   - Add managers, front desk, housekeeping
   - Assign roles and permissions
   [Invite Team →]

4. Schedule a Live Onboarding Call (30 minutes)
   - We'll walk you through the platform
   - Answer your questions
   - Ensure you're set up for success
   [Schedule Call →]

Need help? Reply to this email or chat with us in the app.

Best,
The ImboniServe Team
```

**Effort**: 1-2 days (1 developer + 1 copywriter)

**Priority**: 🟡 **P1 - HIGH**

---

### Gap 4: No Quick Start Guide ❌

**Current State**: No documentation for new users

**Expected State**: Hotel-specific quick start guide

**Impact**: **HIGH** - Users struggle to understand platform

**Example Quick Start Guide**:
```
# ImboniServe Quick Start Guide for Hotels

## First 5 Things to Do After Signup

### 1. Configure Your Rooms (5 minutes)
1. Go to Settings → Rooms
2. Click "Add Room"
3. Enter room number (e.g., 101)
4. Select room type (Standard, Deluxe, Suite)
5. Set room price
6. Repeat for all rooms

[Screenshot: Room configuration UI]

### 2. Set Up Departments (3 minutes)
1. Go to Settings → Departments
2. Add Front Desk department
3. Add Housekeeping department
4. Add Food & Beverage department
5. Add Maintenance department

[Screenshot: Department setup UI]

### 3. Invite Your Team (10 minutes)
1. Go to Team → Invite
2. Enter staff email
3. Select role (Front Desk, Housekeeping, etc.)
4. Assign department
5. Click "Send Invite"

[Screenshot: Team invite UI]

### 4. Create Shift Schedules (15 minutes)
1. Go to Operations → Shifts
2. Click "Create Shift"
3. Select department (Front Desk)
4. Set shift time (7am - 3pm)
5. Assign staff
6. Repeat for all shifts

[Screenshot: Shift creation UI]

### 5. View Your COO Dashboard (2 minutes)
1. Go to Dashboard → COO
2. Review operational health
3. Check staffing alerts
4. Monitor service quality

[Screenshot: COO Dashboard]

## Need Help?
- Live chat: Click the chat icon in the bottom right
- Email: support@imboniserve.com
- Phone: +250 XXX XXX XXX
```

**Effort**: 1 week (1 technical writer)

**Priority**: 🔴 **P0 - CRITICAL**

---

### Gap 5: No Video Tutorials ❌

**Current State**: No video content

**Expected State**: 5-10 minute video tutorials for key workflows

**Impact**: **MEDIUM** - Visual learners struggle

**Example Video Tutorials**:
1. "How to Configure Your Hotel Rooms" (5 min)
2. "How to Set Up Departments and Roles" (5 min)
3. "How to Create Shift Schedules" (7 min)
4. "How to Use the COO Dashboard" (8 min)
5. "How to Track Incidents and Complaints" (6 min)

**Effort**: 2-3 weeks (1 video producer)

**Priority**: 🟡 **P1 - HIGH**

---

### Gap 6: No Live Onboarding Call ❌

**Current State**: No proactive outreach

**Expected State**: Scheduled onboarding call within 24 hours of signup

**Impact**: **HIGH** - Users feel abandoned

**Example Onboarding Call Flow**:
```
Day 1 (After Signup):
- Automated email: "Schedule your onboarding call"
- Calendly link for 30-minute call

Onboarding Call (30 minutes):
1. Welcome and introductions (5 min)
2. Platform overview (10 min)
3. Live setup assistance (10 min)
   - Configure rooms together
   - Set up departments together
   - Create first shift together
4. Q&A (5 min)

Follow-Up:
- Email summary of call
- Next steps checklist
- Support contact info
```

**Effort**: 1 week (process definition + calendar integration)

**Priority**: 🔴 **P0 - CRITICAL**

---

## Onboarding Success Metrics

### Metric 1: Onboarding Completion Rate

**Definition**: % of signups that complete all onboarding steps

**Target**: >80%

**Current**: Unknown (no tracking)

**Measurement**:
```sql
SELECT 
  COUNT(DISTINCT b.id) as total_signups,
  COUNT(DISTINCT CASE WHEN onboarding_completed = true THEN b.id END) as completed,
  (COUNT(DISTINCT CASE WHEN onboarding_completed = true THEN b.id END) * 100.0 / COUNT(DISTINCT b.id)) as completion_rate
FROM Business b
WHERE b.createdAt >= CURRENT_DATE - INTERVAL '30 days';
```

**Gap**: ❌ No `onboarding_completed` field in Business table

---

### Metric 2: Time to First Value

**Definition**: Time from signup to first meaningful action

**Target**: <24 hours

**Current**: Unknown (no tracking)

**Meaningful Actions**:
- First room configured
- First shift created
- First staff invited
- First dashboard view
- First alert received

**Measurement**:
```sql
SELECT 
  b.id,
  b.createdAt as signup_time,
  MIN(r.createdAt) as first_room_time,
  EXTRACT(EPOCH FROM (MIN(r.createdAt) - b.createdAt)) / 3600 as hours_to_first_room
FROM Business b
LEFT JOIN Room r ON r.businessId = b.id
WHERE b.createdAt >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY b.id, b.createdAt;
```

**Gap**: ❌ No Room table exists

---

### Metric 3: Onboarding Drop-Off Rate

**Definition**: % of signups that abandon onboarding at each step

**Target**: <20% drop-off per step

**Current**: Unknown (no tracking)

**Measurement**:
```sql
-- Step 1: Signup
SELECT COUNT(*) as signups FROM Business WHERE createdAt >= CURRENT_DATE - INTERVAL '30 days';

-- Step 2: Room configuration
SELECT COUNT(DISTINCT businessId) as room_configured FROM Room WHERE createdAt >= CURRENT_DATE - INTERVAL '30 days';

-- Step 3: Department setup
SELECT COUNT(DISTINCT businessId) as dept_configured FROM Department WHERE createdAt >= CURRENT_DATE - INTERVAL '30 days';

-- Step 4: Staff invited
SELECT COUNT(DISTINCT businessId) as staff_invited FROM User WHERE createdAt >= CURRENT_DATE - INTERVAL '30 days' AND businessId IS NOT NULL;

-- Step 5: Shift created
SELECT COUNT(DISTINCT branchId) as shift_created FROM Shift WHERE createdAt >= CURRENT_DATE - INTERVAL '30 days';
```

**Gap**: ❌ No Room, Department, Shift tables exist

---

### Metric 4: Support Ticket Volume (Onboarding)

**Definition**: Number of support tickets during first 7 days

**Target**: <3 tickets per customer

**Current**: Unknown (no tracking)

**Measurement**:
```sql
SELECT 
  b.id,
  b.name,
  COUNT(st.id) as ticket_count
FROM Business b
LEFT JOIN SupportTicket st ON st.businessId = b.id AND st.createdAt <= b.createdAt + INTERVAL '7 days'
WHERE b.createdAt >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY b.id, b.name
ORDER BY ticket_count DESC;
```

**Gap**: ❌ No SupportTicket table exists

---

### Metric 5: Onboarding NPS

**Definition**: Net Promoter Score during onboarding

**Target**: >50

**Current**: Unknown (no tracking)

**Measurement**: Survey after onboarding completion
- "How likely are you to recommend ImboniServe to a colleague?" (0-10)
- NPS = % Promoters (9-10) - % Detractors (0-6)

**Gap**: ❌ No onboarding survey exists

---

## Onboarding Workflow Recommendations

### Recommended Onboarding Flow (Hotels)

**Day 1: Signup & Initial Setup**

1. **Signup** (5 minutes)
   - User creates account
   - Business profile created
   - Trial activated (if auto-approved)

2. **Welcome Email** (immediate)
   - Hotel-specific welcome
   - Next steps outlined
   - Onboarding call scheduled

3. **Onboarding Wizard** (15-30 minutes)
   - Step 1: Configure rooms (5-10 min)
   - Step 2: Set up departments (3-5 min)
   - Step 3: Invite team (5-10 min)
   - Step 4: Create first shift (5-10 min)

4. **Quick Start Guide** (self-serve)
   - Hotel-specific guide
   - Screenshots + instructions
   - Video tutorials

---

**Day 2: Live Onboarding Call**

1. **Pre-Call Preparation** (customer)
   - Complete onboarding wizard
   - Review quick start guide
   - Prepare questions

2. **Onboarding Call** (30 minutes)
   - Platform overview (10 min)
   - Live setup assistance (10 min)
   - Q&A (10 min)

3. **Post-Call Follow-Up** (immediate)
   - Email summary
   - Next steps checklist
   - Support contact info

---

**Week 1: Operational Setup**

1. **Shift Schedule Creation** (Day 3-5)
   - Create all shifts for Week 1
   - Assign staff to shifts
   - Review shift coverage

2. **Operational Data Connection** (Day 3-5)
   - Enable time tracking
   - Enable incident tracking
   - Enable complaint tracking

3. **Dashboard Training** (Day 5-7)
   - CEO Dashboard walkthrough
   - CFO Dashboard walkthrough
   - COO Dashboard walkthrough

---

**Week 2: First Operations**

1. **First Guest Check-In** (Day 8-10)
   - Use check-in workflow
   - Assign room
   - Collect payment

2. **First Housekeeping Task** (Day 8-10)
   - Update room status
   - Assign cleaning task
   - Complete cleaning

3. **First Operational Alert** (Day 8-14)
   - Receive staffing alert
   - Receive service quality alert
   - Take action on alert

---

**Month 1: Adoption & Optimization**

1. **Weekly Check-Ins** (Week 2, 3, 4)
   - Review usage metrics
   - Address issues
   - Optimize workflows

2. **Feature Adoption** (Week 2-4)
   - Enable additional features
   - Train on advanced workflows
   - Customize dashboards

3. **Success Review** (Day 30)
   - Review 30-day metrics
   - Gather feedback
   - Plan next 60 days

---

## Onboarding Automation Opportunities

### High-Impact Automation (Quick Wins)

**1. Automated Welcome Email** (1-2 days)
- Trigger: User signup
- Content: Hotel-specific welcome + next steps
- Impact: HIGH (sets expectations)

**2. Onboarding Checklist** (1 week)
- Trigger: User login
- Content: Interactive progress tracker
- Impact: HIGH (guides users)

**3. In-App Tooltips** (1 week)
- Trigger: First-time feature access
- Content: Contextual help
- Impact: MEDIUM (reduces confusion)

**4. Automated Follow-Up Emails** (1 week)
- Trigger: Time-based (Day 1, 3, 7, 14, 30)
- Content: Tips, reminders, check-ins
- Impact: MEDIUM (maintains engagement)

---

### Medium-Impact Automation (Longer-Term)

**5. Bulk Staff Import** (2 weeks)
- Trigger: User action (CSV upload)
- Content: Import 10-100 staff at once
- Impact: MEDIUM (saves time for large hotels)

**6. Template Shift Schedules** (2 weeks)
- Trigger: User action (select template)
- Content: Pre-built shift patterns (24/7, business hours, etc.)
- Impact: MEDIUM (accelerates setup)

**7. Automated Health Scoring** (2 weeks)
- Trigger: Daily cron job
- Content: Calculate onboarding health score
- Impact: HIGH (identifies at-risk customers)

**8. Proactive Support Outreach** (1 week)
- Trigger: Health score <50
- Content: Automated email + manual follow-up
- Impact: HIGH (prevents churn)

---

## Onboarding Readiness Scorecard

### Signup & Account Creation: 80/100 ✅

| Component | Score | Status |
|-----------|-------|--------|
| User registration | 90/100 | ✅ WORKS |
| Business creation | 90/100 | ✅ WORKS |
| Email verification | 70/100 | ⚠️ PARTIAL |
| Trial activation | 80/100 | ✅ WORKS |
| Fraud detection | 90/100 | ✅ WORKS |

**Overall**: ✅ **READY** - Signup is production-ready

---

### Hotel-Specific Setup: 0/100 ❌

| Component | Score | Status |
|-----------|-------|--------|
| Room configuration | 0/100 | ❌ MISSING |
| Department setup | 0/100 | ❌ MISSING |
| Shift configuration | 0/100 | ❌ MISSING |
| Hotel role assignment | 0/100 | ❌ MISSING |
| Service type setup | 0/100 | ❌ MISSING |

**Overall**: ❌ **NOT READY** - Hotel setup completely missing

---

### Onboarding Guidance: 10/100 ❌

| Component | Score | Status |
|-----------|-------|--------|
| Onboarding wizard | 0/100 | ❌ MISSING |
| Setup checklist | 0/100 | ❌ MISSING |
| Welcome email | 20/100 | ❌ GENERIC |
| Quick start guide | 0/100 | ❌ MISSING |
| Video tutorials | 0/100 | ❌ MISSING |
| Live onboarding call | 0/100 | ❌ MISSING |

**Overall**: ❌ **NOT READY** - No structured onboarding guidance

---

### Training & Support: 30/100 ❌

| Component | Score | Status |
|-----------|-------|--------|
| Documentation | 10/100 | ❌ MINIMAL |
| Video tutorials | 0/100 | ❌ MISSING |
| Live training | 0/100 | ❌ MISSING |
| Support widget | 80/100 | ✅ EXISTS |
| Support SLA | 0/100 | ❌ UNDEFINED |

**Overall**: ❌ **NOT READY** - Training materials missing

---

## Final Assessment

### Can a New Hotel Be Onboarded Today?

**Answer**: ❌ **NO**

**Onboarding Readiness**: **35/100** (NOT READY)

**Blockers**:
1. 🔴 No room configuration (CRITICAL)
2. 🔴 No department setup (CRITICAL)
3. 🔴 No shift configuration (CRITICAL)
4. 🔴 No onboarding wizard (HIGH)
5. 🔴 No training materials (HIGH)
6. 🟡 Missing hotel roles (MEDIUM)

**Recommendation**: **DO NOT ONBOARD HOTELS** until MVP features built

---

**ImboniServe Customer Onboarding Review: COMPLETE** ✅

**Status**: 🔴 **NOT READY FOR HOTEL ONBOARDING**

**Next**: Build MVP onboarding features (12-14 weeks)

---

**END OF REVIEW**
