# COMMERCIAL_RECOMMENDATIONS

**Date:** 2026-07-02  
**Scope:** Prioritized recommendations for achieving Commercial Truth  
**Purpose:** Actionable roadmap to align commercial promises with product behavior

---

## EXECUTIVE SUMMARY

The ImboniServe platform has **strong commercial infrastructure** (entitlements, subscription engine, pricing config) but **weak enforcement** (API, UI, dashboard visibility).

**Gap:** Commercial promises (pricing page) do not match actual access control (dashboard experience).

**Impact:**
- Revenue leakage (customers get features they didn't pay for)
- Confusion (customers see features they can't use)
- Poor conversion (unclear value proposition)
- Support burden (customers don't understand their plan)

**Path to Commercial Truth:** 4-6 weeks of focused implementation across 3 priority tiers.

---

## PRIORITY FRAMEWORK

### P0 — Must Fix Before RC1 Launch (BLOCKING)
**Criteria:** Breaks commercial model, causes revenue leakage, or creates severe user confusion

**Timeline:** 2-3 weeks  
**Effort:** High  
**Impact:** Critical

### P1 — Should Fix for Production Quality (HIGH PRIORITY)
**Criteria:** Significantly improves user experience, conversion, or reduces support burden

**Timeline:** 1-2 weeks  
**Effort:** Medium  
**Impact:** High

### P2 — Nice to Have for Optimization (ENHANCEMENT)
**Criteria:** Improves polish, adds delight, or optimizes conversion

**Timeline:** 1 week  
**Effort:** Low  
**Impact:** Medium

---

## P0 RECOMMENDATIONS (Must Fix)

### 1. Fix Plan Naming and Pricing Discrepancy

**Issue:** Pricing config uses `ESSENTIALS` (12,500/month) but approved model specifies `STARTER` (15,000/month)

**Impact:**
- Commercial model inconsistency
- Trial defaults to wrong plan
- Pricing confusion
- Entitlement system supports both (technical debt)

**Files Affected:**
- `src/config/pricing.ts`
- `src/lib/plan-entitlements.ts`
- `src/pages/api/auth/signup.ts`
- `src/locales/*.json`

**Implementation:**

```typescript
// src/config/pricing.ts
// BEFORE:
{
  code: 'ESSENTIALS',
  name: 'Essentials',
  monthlyPriceRWF: 12500,
  annualMonthlyRWF: 10000,
  annualTotalRWF: 120000,
  // ...
}

// AFTER:
{
  code: 'STARTER',
  name: 'Starter',
  monthlyPriceRWF: 18750, // 15,000 × 1.25
  annualMonthlyRWF: 15000,
  annualTotalRWF: 180000,
  // ...
}
```

```typescript
// src/lib/plan-entitlements.ts
// BEFORE:
case 'ESSENTIALS':
case 'STARTER':
  return { ... }

// AFTER:
case 'STARTER':
  return { ... }
// Remove ESSENTIALS alias
```

```typescript
// src/pages/api/auth/signup.ts
// BEFORE:
planCode: 'ESSENTIALS'

// AFTER:
planCode: 'STARTER'
```

**Effort:** 4-6 hours  
**Risk:** Low (rename only, no logic changes)  
**Dependencies:** None

---

### 2. Implement Dashboard Visibility Control

**Issue:** All features visible in navigation regardless of subscription tier

**Impact:**
- Starter users see Premium features
- Confusion and support burden
- Poor user experience
- Unclear value proposition

**Files Affected:**
- `src/components/DashboardLayout.tsx`

**Implementation:**

```typescript
// src/components/DashboardLayout.tsx

// Add required feature to navigation items
const navigation: V1NavigationItem[] = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: LayoutDashboard, 
    v1Visible: true, 
    v1Section: 'OPERATIONS', 
    v1Order: 1 
  },
  { 
    name: 'Reservations', 
    href: '/dashboard/reservations', 
    icon: Calendar, 
    v1Visible: true, 
    v1Section: 'OPERATIONS', 
    v1Order: 5,
    requiredFeature: 'hasReservations' // ADD THIS
  },
  // ... add requiredFeature to all gated items
]

// Filter navigation based on user's plan
const userPlan = (session?.user as any)?.planCode as PlanCode
const entitlements = getPlanEntitlements(userPlan)

const visibleNavigation = navigation.filter(item => {
  // Always show items without required feature
  if (!item.requiredFeature) return true
  
  // Check if user has access to required feature
  return entitlements[item.requiredFeature] === true
})

// Render filtered navigation
{visibleNavigation.map(item => (
  <NavigationItem key={item.href} {...item} />
))}
```

**Effort:** 1-2 days  
**Risk:** Medium (affects all users, needs testing)  
**Dependencies:** None

---

### 3. Add API-Level Entitlement Enforcement

**Issue:** Most API endpoints lack subscription checks

**Impact:**
- Customers receive features they didn't pay for
- Revenue leakage
- Security risk (subscription checks can be bypassed)

**Files Affected:**
- `src/lib/middleware/withFeatureCheck.ts` (new file)
- ~100 API endpoints

**Implementation:**

```typescript
// src/lib/middleware/withFeatureCheck.ts (NEW FILE)

import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { getPlanEntitlements, hasFeatureAccess, getUpgradePlanForFeature, type PlanCode, type PlanEntitlements } from '@/lib/plan-entitlements'

type ApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<any> | any

export function requiresFeature(feature: keyof PlanEntitlements) {
  return (handler: ApiHandler): ApiHandler => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      const session = await getServerSession(req, res, authOptions)
      
      if (!session?.user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      
      const businessId = (session.user as any).businessId
      if (!businessId) {
        return res.status(403).json({ error: 'No business associated' })
      }
      
      // Get business plan
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { 
          plan: { select: { code: true } },
          trialEndDate: true
        }
      })
      
      if (!business) {
        return res.status(404).json({ error: 'Business not found' })
      }
      
      // Check if in trial (grant Professional features)
      const inTrial = business.trialEndDate && new Date() < new Date(business.trialEndDate)
      const planCode = inTrial ? 'PROFESSIONAL' : (business.plan.code as PlanCode)
      
      // Check feature access
      if (!hasFeatureAccess(planCode, feature)) {
        const upgradePlan = getUpgradePlanForFeature(feature)
        return res.status(402).json({
          error: 'feature_locked',
          message: `This feature requires ${upgradePlan} plan or higher`,
          feature,
          currentPlan: planCode,
          upgradePlan,
          upgradeUrl: '/pricing'
        })
      }
      
      return handler(req, res)
    }
  }
}
```

**Usage:**
```typescript
// src/pages/api/reservations.ts
import { requiresFeature } from '@/lib/middleware/withFeatureCheck'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle reservations
}

export default requiresFeature('hasReservations')(handler)
```

**Apply to:**
- `/api/reservations` → `requiresFeature('hasReservations')`
- `/api/inventory/alerts` → `requiresFeature('hasInventoryAlerts')`
- `/api/campaigns` → `requiresFeature('hasWhatsAppCampaigns')`
- `/api/analytics/payments` → `requiresFeature('hasPaymentAnalytics')`
- `/api/analytics/menu-performance` → `requiresFeature('hasMenuPerformance')`
- `/api/analytics/qr` → `requiresFeature('hasQRAnalytics')`
- `/api/staff` → `requiresFeature('hasStaffManagement')`
- `/api/branches` → `requiresFeature('hasMultiBranchDashboard')`
- `/api/ab-testing` → `requiresFeature('hasABTesting')`
- `/api/optimization` → `requiresFeature('hasOptimizationHub')`
- `/api/insights` → `requiresFeature('hasOptimizationInsights')`
- ... and ~90 more endpoints

**Effort:** 1-2 weeks (create middleware + apply to all endpoints)  
**Risk:** High (affects all API calls, needs thorough testing)  
**Dependencies:** None

---

### 4. Remove Client-Count Gating from Feature Flags

**Issue:** Feature flags used for commercial gating (anti-pattern)

**Impact:**
- Starter customers can access Premium features if they have enough clients
- Bypasses subscription model
- Inconsistent with entitlement system

**Files Affected:**
- Feature flag system (location TBD)
- Dashboard pages using feature flags

**Implementation:**

```typescript
// BEFORE:
if (clientCount >= 10 && isFeatureFlagEnabled('advanced_analytics')) {
  // Show advanced analytics
}

// AFTER:
if (hasFeatureAccess(userPlan, 'hasAdvancedReports')) {
  // Show advanced analytics
}
```

**Remove client-count thresholds:**
- `advanced_analytics` (10 clients) → Use `hasAdvancedReports` entitlement
- `multi_branch` (15 clients) → Use `hasMultiBranchDashboard` entitlement
- `ai_menu_builder` (20 clients) → Use `hasSiteBuilderPro` or new entitlement
- `promotions_engine` (25 clients) → Add `hasPromotions` entitlement

**Keep feature flags for:**
- Gradual rollout (e.g., "enable for 10% of users")
- A/B testing (e.g., "test new UI")
- Kill switches (e.g., "disable if service down")

**Effort:** 1-2 days  
**Risk:** Medium (changes feature availability logic)  
**Dependencies:** None

---

### 5. Define and Implement Trial Strategy

**Issue:** Trial entitlements undefined, defaults to wrong plan

**Impact:**
- Trial may not showcase enough value
- Poor conversion rates
- Unclear trial experience

**Files Affected:**
- `src/pages/api/auth/signup.ts`
- `src/lib/middleware/withFeatureCheck.ts`
- `src/lib/middleware/withSubscriptionCheck.ts`

**Recommendation:**
- **Trial Duration:** 14 days (current)
- **Trial Plan:** Professional features (upgrade from current Starter)
- **Trial Entitlements:** All Professional features unlocked

**Rationale:**
- Showcase value beyond basic Starter features
- Drive conversions to Professional or higher
- Industry standard (show premium experience in trial)

**Implementation:**

```typescript
// src/pages/api/auth/signup.ts
// BEFORE:
planCode: 'ESSENTIALS'

// AFTER:
planCode: 'STARTER' // Base plan after trial

// Trial grants Professional entitlements
const trialStartDate = shouldAutoApprove && isHospitality ? new Date() : null
const trialEndDate = shouldAutoApprove && isHospitality 
  ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) 
  : null
```

```typescript
// src/lib/middleware/withFeatureCheck.ts
// Check if in trial (grant Professional features)
const inTrial = business.trialEndDate && new Date() < new Date(business.trialEndDate)
const planCode = inTrial ? 'PROFESSIONAL' : (business.plan.code as PlanCode)
```

**Effort:** 4-6 hours  
**Risk:** Low (improves trial experience)  
**Dependencies:** P0.1 (plan naming fix)

---

### 6. Implement Upgrade Flow

**Issue:** Users cannot upgrade their plan

**Impact:**
- Revenue loss (users want to upgrade but can't)
- Manual workarounds required
- Poor user experience

**Files Affected:**
- `src/pages/api/subscriptions/upgrade.ts` (new file)
- `src/pages/settings.tsx` or `src/pages/pricing.tsx`
- `src/lib/payments/subscription.engine.ts`

**Implementation:**

```typescript
// src/pages/api/subscriptions/upgrade.ts (NEW FILE)

import { requireAuth } from '@/lib/middleware/withAuth'
import { prisma } from '@/lib/prisma'
import { getPlanByCode } from '@/config/pricing'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  const { newPlanCode, billingCycle } = req.body
  const businessId = (req.session.user as any).businessId
  
  // Get current subscription
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      subscriptions: {
        where: { status: 'ACTIVE' },
        orderBy: { endDate: 'desc' },
        take: 1
      },
      plan: true
    }
  })
  
  const currentSub = business.subscriptions[0]
  const newPlan = getPlanByCode(newPlanCode)
  
  // Calculate proration
  const now = new Date()
  const endDate = new Date(currentSub.endDate)
  const totalDays = 30 // Assume 30-day month
  const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  const currentDailyRate = currentSub.amountCents / totalDays
  const newDailyRate = (billingCycle === 'annual' ? newPlan.annualMonthlyRWF : newPlan.monthlyPriceRWF) * 100 / totalDays
  const proratedAmount = Math.round((newDailyRate - currentDailyRate) * daysRemaining)
  
  return res.json({
    proratedAmount: proratedAmount / 100,
    newPlanPrice: billingCycle === 'annual' ? newPlan.annualMonthlyRWF : newPlan.monthlyPriceRWF,
    effectiveDate: now.toISOString(),
    nextBillingDate: endDate.toISOString(),
    nextBillingAmount: billingCycle === 'annual' ? newPlan.annualMonthlyRWF : newPlan.monthlyPriceRWF
  })
}

export default requireAuth(handler)
```

**UI:**
- "Upgrade" button in topbar
- Upgrade modal with plan comparison
- Show proration calculation
- Payment flow
- Immediate feature unlock

**Effort:** 3-5 days  
**Risk:** Medium (payment flow, proration logic)  
**Dependencies:** None

---

### 7. Implement Downgrade Flow

**Issue:** Users cannot downgrade their plan

**Impact:**
- Users cancel instead of downgrading (revenue loss)
- No graceful downgrade path
- Data retention unclear

**Files Affected:**
- `src/pages/api/subscriptions/downgrade.ts` (new file)
- `src/pages/settings.tsx`
- `src/lib/payments/subscription.engine.ts`

**Implementation:**

```typescript
// src/pages/api/subscriptions/downgrade.ts (NEW FILE)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { newPlanCode } = req.body
  const businessId = (req.session.user as any).businessId
  
  // Get current subscription and data
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      subscriptions: { where: { status: 'ACTIVE' }, take: 1 },
      branches: true,
      qrCodes: true
    }
  })
  
  const currentSub = business.subscriptions[0]
  const newPlan = getPlanByCode(newPlanCode)
  const newEntitlements = getPlanEntitlements(newPlanCode)
  
  // Check data retention warnings
  const warnings = []
  if (typeof newEntitlements.maxBranches === 'number' && business.branches.length > newEntitlements.maxBranches) {
    warnings.push(`You have ${business.branches.length} branches. ${newPlan.name} plan includes ${newEntitlements.maxBranches} branch. Please select which branch to keep.`)
  }
  if (typeof newEntitlements.maxQRCodes === 'number' && business.qrCodes.length > newEntitlements.maxQRCodes) {
    warnings.push(`You have ${business.qrCodes.length} QR codes. ${newPlan.name} plan includes ${newEntitlements.maxQRCodes} QR codes. Please select which codes to keep.`)
  }
  
  // Schedule downgrade for next billing cycle (no refund)
  const effectiveDate = new Date(currentSub.endDate)
  
  return res.json({
    effectiveDate: effectiveDate.toISOString(),
    newPlanPrice: newPlan.monthlyPriceRWF,
    currentPlanExpiryDate: effectiveDate.toISOString(),
    dataRetentionWarnings: warnings
  })
}

export default requireAuth(handler)
```

**Data Retention Policy:**
- Branches: User selects which to keep before downgrade
- QR Codes: User selects which to keep if over limit
- AI Credits: Reset to new plan limit at next billing cycle
- Storage: Keep all data, prevent new uploads if over limit
- Staff: Keep all staff, prevent new additions if over limit

**Downgrade Timing:**
- Takes effect at next billing cycle (user paid for current cycle)
- Show "Downgrade scheduled for [date]" message
- Allow cancellation of scheduled downgrade

**Effort:** 3-5 days  
**Risk:** Medium (data retention logic)  
**Dependencies:** None

---

## P0 SUMMARY

| # | Recommendation | Effort | Risk | Dependencies |
|---|---------------|--------|------|--------------|
| 1 | Fix Plan Naming | 4-6 hours | Low | None |
| 2 | Dashboard Visibility Control | 1-2 days | Medium | None |
| 3 | API Entitlement Enforcement | 1-2 weeks | High | None |
| 4 | Remove Client-Count Gating | 1-2 days | Medium | None |
| 5 | Define Trial Strategy | 4-6 hours | Low | P0.1 |
| 6 | Implement Upgrade Flow | 3-5 days | Medium | None |
| 7 | Implement Downgrade Flow | 3-5 days | Medium | None |

**Total P0 Effort:** 2-3 weeks  
**Total P0 Impact:** Critical (enables Commercial Truth)

---

## P1 RECOMMENDATIONS (Should Fix)

### 8. Add Trial Conversion Flow

**Issue:** Trials expire without conversion prompts

**Impact:** Low conversion rates, missed revenue

**Implementation:**
- 7 days before expiry: Email reminder with upgrade link
- 3 days before expiry: In-app banner "Trial ending soon"
- 1 day before expiry: Push notification + email
- On expiry: Redirect to pricing page with "Trial ended" message
- In-app countdown in topbar: "7 days left in trial"

**Effort:** 2-3 days  
**Risk:** Low

---

### 9. Add Feature Gates to Dashboard Pages

**Issue:** Locked features accessible without UI gates

**Impact:** Users can interact with features they shouldn't have

**Implementation:**

```typescript
// Example: src/pages/dashboard/reservations.tsx

import FeatureGate from '@/components/FeatureGate'

export default function Reservations() {
  const { data: session } = useSession()
  const userPlan = (session?.user as any)?.planCode
  
  return (
    <DashboardLayout>
      <FeatureGate 
        feature="hasReservations" 
        userPlan={userPlan}
        customMessage="Reservations unlock on Professional plan"
      >
        <ReservationsContent />
      </FeatureGate>
    </DashboardLayout>
  )
}
```

**Apply to:**
- Reservations, Inventory Alerts, QR Analytics, Menu Performance, Payment Analytics, Staff, Multi-Branch, AI features, Optimization features

**Effort:** 3-5 days  
**Risk:** Low

---

### 10. Add Renewal Reminders and Failed Payment Handling

**Issue:** Users surprised by renewal charges, no failed payment recovery

**Implementation:**
- 7 days before renewal: Email reminder of upcoming charge
- Failed payment: Retry 3 times over 7 days
- Email notification after each failed attempt
- Grace period (3 days) after final failure
- Downgrade to free tier or suspend after grace period

**Effort:** 2-3 days  
**Risk:** Low

---

### 11. Add Cancellation UI and Retention Flow

**Issue:** No UI for cancelling, no retention attempt

**Implementation:**
- "Cancel Subscription" button in settings
- Cancellation modal with retention offer
- "What can we do to keep you?" prompt
- Offer discount (e.g., "Stay for 50% off next 3 months")
- Offer downgrade instead of cancellation
- Capture cancellation reason
- Cancel at end of current billing cycle

**Effort:** 2-3 days  
**Risk:** Low

---

### 12. Add Expiry Warnings and Dashboard Banner

**Issue:** Users surprised by expiry

**Implementation:**
- 7 days before expiry: Email reminder
- 3 days before expiry: Email + in-app banner
- 1 day before expiry: Email + push notification
- Red banner at top of dashboard: "Your subscription expires in [X] days"
- "Renew Now" button

**Effort:** 1-2 days  
**Risk:** Low

---

### 13. Add Reactivation Flow

**Issue:** Friction for returning customers

**Implementation:**
- "Reactivate Subscription" button in dashboard (if expired)
- One-click reactivation (use saved payment method)
- Show data restoration confirmation
- Immediate access after payment
- Optional: "Welcome back! Get 25% off your first month"

**Effort:** 1-2 days  
**Risk:** Low

---

### 14. Complete or Remove Mock Features

**Issue:** Pricing page promises features that don't fully exist

**Features:**
- Recipe Management
- Auto-Reorder
- Supplier Portal
- Customer Feedback
- Advanced Reporting

**Implementation:**
- Audit each feature
- Decision: Complete implementation OR remove from pricing page
- If removing: Update pricing config, entitlements, pricing page

**Effort:** 1-2 weeks (if completing) OR 1-2 days (if removing)  
**Risk:** Medium

---

## P1 SUMMARY

| # | Recommendation | Effort | Risk |
|---|---------------|--------|------|
| 8 | Trial Conversion Flow | 2-3 days | Low |
| 9 | Feature Gates on Pages | 3-5 days | Low |
| 10 | Renewal Reminders | 2-3 days | Low |
| 11 | Cancellation UI | 2-3 days | Low |
| 12 | Expiry Warnings | 1-2 days | Low |
| 13 | Reactivation Flow | 1-2 days | Low |
| 14 | Complete/Remove Mocks | 1-2 weeks | Medium |

**Total P1 Effort:** 1-2 weeks  
**Total P1 Impact:** High (improves UX and conversion)

---

## P2 RECOMMENDATIONS (Nice to Have)

### 15. Add Plan Indicators and Branding

**Implementation:**
- Plan badge in topbar (Starter, Professional, Business, Premium, Enterprise)
- Plan-specific branding (colors, icons)
- Premium: Gold theme, crown icon
- Enterprise: Custom branding

**Effort:** 1-2 days

---

### 16. Add Upgrade CTAs and Messaging

**Implementation:**
- "Upgrade" button in topbar
- Contextual "Why upgrade" prompts
- Feature comparison tooltips
- "Unlock 15 more features with Professional"

**Effort:** 1-2 days

---

### 17. Add Usage Indicators

**Implementation:**
- QR codes used: 3/5 (Starter)
- AI credits used: 15/50 (Professional)
- Branches used: 2/3 (Business)
- Storage used: 1.2GB / 5GB

**Effort:** 2-3 days

---

### 18. Add Lifecycle Emails

**Implementation:**
- Activation confirmation
- Renewal confirmation
- Cancellation confirmation
- Upgrade confirmation
- Downgrade confirmation
- Trial expiry warning

**Effort:** 2-3 days

---

### 19. Add Celebration Moments

**Implementation:**
- Welcome message after activation
- "Unlocked" badges on newly available features
- Milestone celebrations (100 orders, 1000 customers, etc.)
- Anniversary messages

**Effort:** 1-2 days

---

## P2 SUMMARY

| # | Recommendation | Effort |
|---|---------------|--------|
| 15 | Plan Indicators | 1-2 days |
| 16 | Upgrade CTAs | 1-2 days |
| 17 | Usage Indicators | 2-3 days |
| 18 | Lifecycle Emails | 2-3 days |
| 19 | Celebration Moments | 1-2 days |

**Total P2 Effort:** 1 week  
**Total P2 Impact:** Medium (polish and optimization)

---

## IMPLEMENTATION ROADMAP

### Week 1-2: P0 Critical Fixes
- Day 1: Fix plan naming (P0.1)
- Day 2-3: Dashboard visibility control (P0.2)
- Day 4: Remove client-count gating (P0.4)
- Day 5: Define trial strategy (P0.5)
- Day 6-10: API entitlement enforcement (P0.3)

### Week 3: P0 Subscription Lifecycle
- Day 11-13: Implement upgrade flow (P0.6)
- Day 14-15: Implement downgrade flow (P0.7)

### Week 4: P1 User Experience
- Day 16-17: Trial conversion flow (P1.8)
- Day 18-20: Feature gates on pages (P1.9)
- Day 21-22: Renewal reminders (P1.10)

### Week 5: P1 Lifecycle Improvements
- Day 23-24: Cancellation UI (P1.11)
- Day 25: Expiry warnings (P1.12)
- Day 26: Reactivation flow (P1.13)
- Day 27-30: Complete/remove mocks (P1.14)

### Week 6: P2 Polish
- Day 31-32: Plan indicators (P2.15)
- Day 33-34: Upgrade CTAs (P2.16)
- Day 35-36: Usage indicators (P2.17)
- Day 37-38: Lifecycle emails (P2.18)
- Day 39-40: Celebration moments (P2.19)

---

## TESTING STRATEGY

### P0 Testing (Critical)
- **Unit Tests:** Entitlement checks, proration calculations
- **Integration Tests:** API enforcement, subscription lifecycle
- **E2E Tests:** Upgrade/downgrade flows, trial conversion
- **Manual Testing:** Dashboard visibility for each plan tier

### P1 Testing (High Priority)
- **Integration Tests:** Renewal reminders, cancellation flow
- **E2E Tests:** Trial conversion, reactivation
- **Manual Testing:** Feature gates, expiry warnings

### P2 Testing (Enhancement)
- **Manual Testing:** Plan indicators, upgrade CTAs, usage indicators
- **A/B Testing:** Lifecycle emails, celebration moments

---

## SUCCESS METRICS

### P0 Success Criteria
- ✅ All plans use correct naming and pricing
- ✅ Dashboard navigation filtered by subscription tier
- ✅ All commercial API endpoints enforce entitlements
- ✅ No client-count gating for commercial features
- ✅ Trial grants Professional entitlements
- ✅ Users can upgrade and downgrade plans
- ✅ Data retention policy documented and enforced

### P1 Success Criteria
- ✅ Trial conversion rate increases by 20%+
- ✅ Feature gates prevent unauthorized access
- ✅ Renewal reminders reduce churn by 10%+
- ✅ Cancellation UI captures reasons and offers retention
- ✅ Expiry warnings reduce surprise cancellations
- ✅ Reactivation flow reduces friction for returning customers

### P2 Success Criteria
- ✅ Plan indicators improve brand perception
- ✅ Upgrade CTAs increase upgrade rate by 15%+
- ✅ Usage indicators drive feature adoption
- ✅ Lifecycle emails improve engagement
- ✅ Celebration moments increase retention

---

## RISK MITIGATION

### High-Risk Changes
1. **API Entitlement Enforcement (P0.3)**
   - Risk: Breaking existing API calls
   - Mitigation: Gradual rollout, feature flag, comprehensive testing

2. **Dashboard Visibility Control (P0.2)**
   - Risk: Hiding features users expect to see
   - Mitigation: Clear upgrade prompts, user communication

3. **Upgrade/Downgrade Flows (P0.6, P0.7)**
   - Risk: Payment failures, data loss
   - Mitigation: Thorough testing, rollback plan, user communication

### Medium-Risk Changes
1. **Trial Strategy Change (P0.5)**
   - Risk: Changing trial experience mid-flight
   - Mitigation: Apply to new signups only, grandfather existing trials

2. **Feature Gates (P1.9)**
   - Risk: Blocking legitimate users
   - Mitigation: Backend enforcement as primary, UI gates as secondary

### Low-Risk Changes
- All P2 recommendations (polish and optimization)
- Lifecycle emails (can be disabled if issues arise)
- UI improvements (can be reverted easily)

---

## CONCLUSION

**Path to Commercial Truth:** 4-6 weeks of focused implementation

**Priority:**
1. **Week 1-3:** P0 fixes (critical, blocking)
2. **Week 4-5:** P1 improvements (high priority, user experience)
3. **Week 6:** P2 enhancements (polish, optimization)

**Impact:**
- Eliminate revenue leakage
- Improve user experience and clarity
- Increase conversion and retention
- Reduce support burden
- Establish commercial source of truth

**Next Steps:**
1. Review and approve recommendations
2. Assign engineering resources
3. Begin Week 1 implementation (P0 critical fixes)
4. Track progress against success metrics

---

**Final Document:** Review `RC1_COMMERCIAL_TRUTH_CERTIFICATE.md` for final certification recommendation.
