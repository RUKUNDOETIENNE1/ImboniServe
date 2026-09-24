# Deployment Day Checklist

**Phase**: Final Deployment Preparation  
**Date**: June 24, 2026  
**Status**: ✅ **CHECKLIST READY**  

---

## Pre-Deployment (Day -2 to Day -1)

### Day -2 Morning: Fix Critical Blockers

**Duration**: 2.25 hours

#### BLOCKER #1: Menu Builder UI Order (15 minutes)

- [ ] Open `c:\Dev\ImboniResto\src\pages\dashboard\menu-builder.tsx`
- [ ] Locate lines 98-174 (AI Builder + Manual sections)
- [ ] Cut manual menu section (starts with `<div className="bg-gradient-to-br from-white to-blue-50...">`)
- [ ] Paste ABOVE AI Builder section
- [ ] Save file
- [ ] Run local dev server: `npm run dev`
- [ ] Navigate to `/dashboard/menu-builder`
- [ ] **Verify**: Manual option shown FIRST
- [ ] **Verify**: AI Builder shown SECOND (below)
- [ ] **Verify**: "Add Menu Items Now" button works
- [ ] **Verify**: AI Builder still shows lock message
- [ ] Stop dev server
- [ ] Commit: `git add . && git commit -m "fix: swap menu builder UI order - show manual option first"`

**Completion Time**: ___:___ (15 min)

---

#### BLOCKER #2: Role Descriptions (2 hours)

- [ ] Open `c:\Dev\ImboniResto\src\pages\dashboard\staff.tsx`
- [ ] Add role descriptions constant:
```typescript
const ROLE_DESCRIPTIONS = {
  OWNER: "Full access to all features, revenue, analytics, and settings",
  MANAGER: "Can manage staff, view analytics, and configure business settings",
  WAITER: "Can create orders, view menu, and manage tables. Cannot view revenue",
  CASHIER: "Can process payments and view transactions. Limited analytics access",
  KITCHEN_MANAGER: "Can view orders and manage kitchen operations",
  ADMIN: "Platform administrator with full system access"
}
```
- [ ] Install tooltip library (if not exists): `npm install @radix-ui/react-tooltip` or use existing
- [ ] Import tooltip component
- [ ] Wrap role dropdown with tooltip
- [ ] Add tooltip content from `ROLE_DESCRIPTIONS`
- [ ] Save file
- [ ] Run local dev server: `npm run dev`
- [ ] Navigate to `/dashboard/staff`
- [ ] Click "Invite Staff" or similar
- [ ] **Verify**: Hover over role dropdown shows tooltip
- [ ] **Verify**: All roles have descriptions
- [ ] **Verify**: Descriptions are accurate
- [ ] **Verify**: Tooltip works on mobile (tap to show)
- [ ] Stop dev server
- [ ] Commit: `git add . && git commit -m "feat: add role descriptions with tooltips for staff invitation"`

**Completion Time**: ___:___ (2 hours)

---

### Day -2 Afternoon: Deploy to Staging

**Duration**: 30 minutes

- [ ] Push changes to Git: `git push origin main`
- [ ] Trigger staging deployment (or manual deploy)
- [ ] Wait for deployment to complete
- [ ] Verify staging URL is live
- [ ] **Smoke Test**: Sign up flow works
- [ ] **Smoke Test**: Login flow works
- [ ] **Smoke Test**: Setup wizard appears
- [ ] **Smoke Test**: Menu Builder shows manual option first
- [ ] **Smoke Test**: Role descriptions show tooltips
- [ ] **Smoke Test**: Create first sale works
- [ ] **Smoke Test**: Dashboard loads correctly
- [ ] If any test fails → fix and redeploy
- [ ] If all tests pass → proceed to Day -1

**Completion Time**: ___:___ (30 min)

---

### Day -1 Morning: Final Testing

**Duration**: 2 hours

#### Full User Journey Test (30 min)

- [ ] Clear browser cache
- [ ] Navigate to staging URL
- [ ] **Test**: Sign up with new account
- [ ] **Test**: Receive MFA OTP
- [ ] **Test**: Enter OTP and login
- [ ] **Test**: Redirected to `/setup` wizard
- [ ] **Test**: Setup wizard shows 0% progress
- [ ] **Test**: Click "Get Started"
- [ ] **Test**: Navigate to Menu Builder
- [ ] **Verify**: Manual option shown FIRST ✅
- [ ] **Verify**: AI Builder shown SECOND ✅
- [ ] **Test**: Click "Add Menu Items Now"
- [ ] **Test**: Add 3 menu items
- [ ] **Test**: Navigate to Tables
- [ ] **Test**: Add 2 tables
- [ ] **Test**: Navigate to Staff
- [ ] **Test**: Hover over role dropdown
- [ ] **Verify**: Role descriptions appear ✅
- [ ] **Test**: Invite 1 staff member
- [ ] **Test**: Navigate to Sales
- [ ] **Test**: Create first sale
- [ ] **Verify**: Sale created successfully ✅
- [ ] **Test**: Navigate to Dashboard
- [ ] **Verify**: Daily sales shows revenue ✅
- [ ] **Verify**: Sales chart shows data point ✅
- [ ] **Verify**: Recent transactions shows sale ✅
- [ ] **Verify**: Setup progress banner shows 100% ✅
- [ ] If any test fails → fix and redeploy
- [ ] If all tests pass → continue

**Completion Time**: ___:___ (30 min)

---

#### API Error Handling Test (15 min)

- [ ] Open browser DevTools → Network tab
- [ ] Navigate to Dashboard
- [ ] **Verify**: `/api/dashboard/stats` returns 200 (success)
- [ ] **Verify**: `/api/dashboard/sales-chart` returns 200 (success)
- [ ] **Verify**: `/api/dashboard/recent-transactions` returns 200 (success)
- [ ] **Verify**: `/api/business/setup-status` returns 200 (success)
- [ ] Simulate API failure (disconnect internet or block API)
- [ ] Refresh Dashboard
- [ ] **Verify**: Error banner appears ✅
- [ ] **Verify**: "Try Again" button visible ✅
- [ ] Restore internet
- [ ] Click "Try Again"
- [ ] **Verify**: Dashboard loads successfully ✅

**Completion Time**: ___:___ (15 min)

---

#### Multi-User Test (30 min)

- [ ] Sign up as Restaurant Owner (Account A)
- [ ] Add menu items, tables
- [ ] Invite staff member (use different email)
- [ ] Log out
- [ ] Check staff email for invitation
- [ ] Click invitation link
- [ ] Set password for staff account
- [ ] Log in as staff (Account B)
- [ ] **Verify**: Staff sees dashboard ✅
- [ ] **Verify**: Staff can create orders ✅
- [ ] **Test**: Create order as staff
- [ ] Log out
- [ ] Log in as owner (Account A)
- [ ] **Verify**: Order created by staff appears ✅
- [ ] **Verify**: Dashboard shows correct data ✅

**Completion Time**: ___:___ (30 min)

---

#### Late-Night Business Test (15 min)

- [ ] Sign up as Bar Owner
- [ ] Add menu items (drinks)
- [ ] Add tables
- [ ] Create sales at different times:
  - [ ] 6:00 PM
  - [ ] 10:00 PM
  - [ ] 12:00 AM (midnight)
  - [ ] 2:00 AM
- [ ] Navigate to Dashboard
- [ ] **Verify**: Sales chart shows 24 hours (12am-11pm) ✅
- [ ] **Verify**: All sales visible (including 12am-2am) ✅
- [ ] **Verify**: No sales hidden ✅

**Completion Time**: ___:___ (15 min)

---

#### Mobile Responsiveness Test (15 min)

- [ ] Open staging URL on mobile device (or DevTools mobile view)
- [ ] **Test**: Sign up flow works on mobile
- [ ] **Test**: Login flow works on mobile
- [ ] **Test**: Setup wizard readable on mobile
- [ ] **Test**: Menu Builder usable on mobile
- [ ] **Test**: Role tooltips work on mobile (tap to show)
- [ ] **Test**: Sales creation works on mobile
- [ ] **Test**: Dashboard readable on mobile
- [ ] **Verify**: No horizontal scrolling ✅
- [ ] **Verify**: All buttons tappable ✅
- [ ] **Verify**: Text readable ✅

**Completion Time**: ___:___ (15 min)

---

#### Performance Test (15 min)

- [ ] Open browser DevTools → Performance tab
- [ ] Navigate to Dashboard
- [ ] **Measure**: Page load time (should be <3 seconds)
- [ ] **Measure**: Time to interactive (should be <5 seconds)
- [ ] **Verify**: No console errors ✅
- [ ] **Verify**: No console warnings (critical) ✅
- [ ] Navigate to Menu Builder
- [ ] **Verify**: Page loads quickly ✅
- [ ] Navigate to Sales
- [ ] **Verify**: Page loads quickly ✅

**Completion Time**: ___:___ (15 min)

---

### Day -1 Afternoon: Production Deployment

**Duration**: 1 hour

#### Pre-Deployment Checklist

- [ ] All staging tests passed ✅
- [ ] No critical bugs found ✅
- [ ] Database migrations ready (if any)
- [ ] Environment variables configured
- [ ] Backup database (Supabase automatic backups enabled)
- [ ] Rollback plan documented
- [ ] Support team notified
- [ ] Monitoring enabled

**Completion Time**: ___:___ (15 min)

---

#### Deploy to Production

- [ ] Merge staging branch to main (if separate)
- [ ] Tag release: `git tag -a v1.0.0-pilot -m "Pilot launch with onboarding fixes"`
- [ ] Push tag: `git push origin v1.0.0-pilot`
- [ ] Trigger production deployment
- [ ] Wait for deployment to complete (5-10 min)
- [ ] **Verify**: Production URL is live
- [ ] **Verify**: No deployment errors

**Completion Time**: ___:___ (15 min)

---

#### Post-Deployment Smoke Test

- [ ] Navigate to production URL
- [ ] **Test**: Homepage loads
- [ ] **Test**: Sign up flow works
- [ ] **Test**: Login flow works
- [ ] **Test**: Setup wizard appears
- [ ] **Test**: Menu Builder shows manual option first ✅
- [ ] **Test**: Role descriptions show tooltips ✅
- [ ] **Test**: Create first sale works
- [ ] **Test**: Dashboard loads correctly
- [ ] **Test**: API endpoints return 200
- [ ] **Test**: No console errors
- [ ] If any test fails → rollback immediately
- [ ] If all tests pass → deployment successful ✅

**Completion Time**: ___:___ (15 min)

---

#### Monitoring Setup

- [ ] Open monitoring dashboard (if exists)
- [ ] **Verify**: Error tracking active
- [ ] **Verify**: Performance monitoring active
- [ ] **Verify**: Uptime monitoring active
- [ ] Set up alerts:
  - [ ] Email alert for 500 errors
  - [ ] Email alert for downtime
  - [ ] Email alert for high response time (>5s)
- [ ] Test alerts (trigger test error)
- [ ] **Verify**: Alert received ✅

**Completion Time**: ___:___ (15 min)

---

## Deployment Day (Day 0)

### Morning: Pilot Restaurant Onboarding

**Duration**: 3-4 hours (for 5 restaurants)

#### Restaurant A: Mama Rose's Kitchen

- [ ] **Time**: ___:___
- [ ] Send invitation email with signup link
- [ ] Wait for signup confirmation
- [ ] Monitor onboarding progress (check logs)
- [ ] **Verify**: Signup successful
- [ ] **Verify**: Setup wizard accessed
- [ ] **Verify**: Menu items added
- [ ] **Verify**: Tables added
- [ ] **Verify**: First sale created
- [ ] **Verify**: No support tickets
- [ ] Send welcome email
- [ ] Schedule Week 1 check-in call

**Completion Time**: ___:___ (30-45 min)

---

#### Restaurant B: Kigali Family Grill

- [ ] **Time**: ___:___
- [ ] Send invitation email with signup link
- [ ] Wait for signup confirmation
- [ ] Monitor onboarding progress
- [ ] **Verify**: Signup successful
- [ ] **Verify**: Setup wizard accessed
- [ ] **Verify**: Menu items added
- [ ] **Verify**: Tables added
- [ ] **Verify**: Staff invited
- [ ] **Verify**: First sale created
- [ ] **Verify**: Support tickets (if any) resolved
- [ ] Send welcome email
- [ ] Schedule Week 1 check-in call

**Completion Time**: ___:___ (30-45 min)

---

#### Restaurant C: Urban Eats Kigali

- [ ] **Time**: ___:___
- [ ] Send invitation email with signup link
- [ ] Wait for signup confirmation
- [ ] Monitor onboarding progress (high-touch)
- [ ] **Verify**: Signup successful
- [ ] **Verify**: Setup wizard accessed
- [ ] **Verify**: Menu items added (may be incomplete)
- [ ] **Verify**: Tables added
- [ ] **Verify**: Staff invited (6 members)
- [ ] **Verify**: First sale created
- [ ] **Verify**: Support tickets resolved promptly
- [ ] Send welcome email
- [ ] Schedule proactive check-in call (Day 1)

**Completion Time**: ___:___ (45-60 min)

---

#### Restaurant D: Coffee Corner Kigali

- [ ] **Time**: ___:___
- [ ] Send invitation email with signup link
- [ ] Wait for signup confirmation
- [ ] Monitor onboarding progress
- [ ] **Verify**: Signup successful
- [ ] **Verify**: Setup wizard accessed
- [ ] **Verify**: Menu items added
- [ ] **Verify**: Tables added
- [ ] **Verify**: Staff invited
- [ ] **Verify**: First sale created
- [ ] **Verify**: No support tickets
- [ ] Send welcome email
- [ ] Schedule Week 1 check-in call

**Completion Time**: ___:___ (30-45 min)

---

#### Restaurant E: Nightlife Lounge

- [ ] **Time**: ___:___
- [ ] Send invitation email with signup link
- [ ] Wait for signup confirmation
- [ ] Monitor onboarding progress
- [ ] **Verify**: Signup successful
- [ ] **Verify**: Setup wizard accessed
- [ ] **Verify**: Menu items added
- [ ] **Verify**: Tables added
- [ ] **Verify**: Staff invited
- [ ] **Verify**: First sale created
- [ ] **Verify**: 24-hour chart works for late-night sales
- [ ] **Verify**: No support tickets
- [ ] Send welcome email
- [ ] Schedule Week 1 check-in call

**Completion Time**: ___:___ (30-45 min)

---

### Afternoon: Monitoring & Support

**Duration**: Ongoing

#### Real-Time Monitoring

- [ ] Monitor error logs (every hour)
- [ ] Monitor performance metrics (every hour)
- [ ] Monitor user activity (every 2 hours)
- [ ] **Check**: Any 500 errors? → Investigate immediately
- [ ] **Check**: Any slow API responses (>5s)? → Investigate
- [ ] **Check**: Any user stuck in onboarding? → Reach out proactively

---

#### Support Ticket Handling

- [ ] Check support email every 30 minutes
- [ ] Check WhatsApp every 30 minutes
- [ ] Respond to tickets within 4 hours (target: 1 hour)
- [ ] Log all tickets in spreadsheet:
  - Restaurant name
  - Issue description
  - Severity (🔴🟠🟡🟢)
  - Time to resolve
  - Resolution notes
- [ ] Escalate critical issues immediately

---

#### Proactive Check-Ins

- [ ] Call Restaurant C (high-risk) at end of Day 0
- [ ] **Ask**: "How was onboarding?"
- [ ] **Ask**: "Any confusion or issues?"
- [ ] **Ask**: "Do you need help with anything?"
- [ ] **Ask**: "Are you satisfied so far?"
- [ ] Log feedback

---

## Post-Deployment (Day 1-7)

### Daily Tasks (Week 1)

#### Every Morning (9:00 AM)

- [ ] Check error logs from previous 24 hours
- [ ] Check support tickets from previous 24 hours
- [ ] Review user activity metrics:
  - [ ] How many restaurants active yesterday?
  - [ ] How many sales created?
  - [ ] Any restaurants inactive? → Reach out
- [ ] Check monitoring alerts
- [ ] Plan day's support activities

---

#### Every Afternoon (3:00 PM)

- [ ] Respond to any pending support tickets
- [ ] Check user activity (real-time)
- [ ] Monitor error logs
- [ ] Update pilot progress spreadsheet

---

#### Every Evening (6:00 PM)

- [ ] Final support ticket check
- [ ] Final error log check
- [ ] Send end-of-day summary to team:
  - Restaurants active today: X/5
  - Sales created today: X
  - Support tickets today: X
  - Issues resolved: X
  - Issues pending: X

---

### Weekly Check-In Calls

#### Week 1 (Day 7)

- [ ] Call Restaurant A
- [ ] Call Restaurant B
- [ ] Call Restaurant C (priority)
- [ ] Call Restaurant D
- [ ] Call Restaurant E

**Questions to Ask**:
- "How has your first week been?"
- "Have you encountered any issues?"
- "Is there anything confusing or unclear?"
- "Are you satisfied with the system?"
- "Would you recommend it to other restaurants?"
- "Any feature requests?"

**Log Feedback**: Document all responses

---

#### Week 2 (Day 14)

- [ ] Call all 5 restaurants
- [ ] Same questions as Week 1
- [ ] **Ask**: "Are you still using the system daily?"
- [ ] **Ask**: "Any issues since last week?"

---

#### Week 4 (Day 28)

- [ ] Call all 5 restaurants
- [ ] **Ask**: "How has your first month been?"
- [ ] **Ask**: "Do you plan to continue using ImboniServe?"
- [ ] **Ask**: "What's your NPS score (0-10)?"
- [ ] **Ask**: "Any feedback for improvement?"

---

## Success Metrics Tracking

### Daily Metrics (Track in Spreadsheet)

- [ ] Restaurants active today: ___/5
- [ ] Sales created today: ___
- [ ] Support tickets today: ___
- [ ] Average response time: ___ hours
- [ ] Critical errors today: ___

---

### Weekly Metrics

- [ ] Week 1 retention: ___/5 (target: 5/5)
- [ ] Week 1 support tickets: ___ (target: <8)
- [ ] Week 1 critical errors: ___ (target: 0)
- [ ] Week 1 average sales per restaurant: ___

---

### Month 1 Metrics

- [ ] Month 1 retention: ___/5 (target: 4-5/5)
- [ ] Month 1 support tickets: ___ (target: <12)
- [ ] Month 1 critical errors: ___ (target: 0)
- [ ] Month 1 NPS score: ___ (target: ≥40)
- [ ] Month 1 user satisfaction: ___% (target: ≥70%)

---

## Rollback Plan (If Needed)

### When to Rollback

**Trigger Rollback If**:
- [ ] Critical bug affecting >50% of users
- [ ] Data loss or corruption
- [ ] Security vulnerability discovered
- [ ] System downtime >1 hour
- [ ] >3 restaurants unable to onboard

---

### Rollback Procedure

- [ ] Notify all users (email + WhatsApp)
- [ ] Revert to previous Git tag: `git checkout v0.9.0` (or previous stable)
- [ ] Redeploy previous version
- [ ] Verify previous version works
- [ ] Restore database backup (if needed)
- [ ] Investigate issue
- [ ] Fix issue
- [ ] Redeploy fixed version
- [ ] Notify users of resolution

---

## Final Checklist

### Before Launch

- [ ] All blockers fixed ✅
- [ ] Staging tests passed ✅
- [ ] Production deployed ✅
- [ ] Monitoring enabled ✅
- [ ] Support team ready ✅
- [ ] Rollback plan documented ✅

### Launch Day

- [ ] All 5 restaurants onboarded ✅
- [ ] All 5 restaurants reached first value ✅
- [ ] Support tickets resolved ✅
- [ ] No critical errors ✅

### Week 1

- [ ] 5/5 restaurants active ✅
- [ ] <8 support tickets ✅
- [ ] 0 critical errors ✅

### Month 1

- [ ] 4-5/5 restaurants active ✅
- [ ] <12 support tickets ✅
- [ ] 0 critical errors ✅
- [ ] NPS ≥40 ✅

---

**Deployment Day Checklist: COMPLETE** ✅

**Status**: ✅ **READY FOR EXECUTION**

**Next**: Fix 2 blockers, then execute checklist

---

**END OF CHECKLIST**
