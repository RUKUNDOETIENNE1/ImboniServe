# COMMERCIAL_IMPLEMENTATION_BLUEPRINT

**Document:** Commercial Constitution v1.1  
**Initial Draft:** 2026-07-02  
**Updated:** 2026-07-03  
**Purpose:** Engineering implementation architecture for Commercial Truth  
**Status:** ✅ Ready for Implementation (Constitution Approved)

---

## OVERVIEW

This document describes **how** engineering will implement the Commercial Constitution v1.1 (Founder-approved). It is an architectural blueprint incorporating all six Founder decisions.

**Important:**  
- ✅ This document describes architecture and approach
- ❌ This document does NOT modify code, config, or systems
- ✅ Constitution v1.1 is approved—implementation may now proceed
- ✅ All Founder decisions incorporated into this blueprint

---

## FOUNDER DECISIONS INCORPORATED

This blueprint incorporates all six Founder decisions from the constitutional review:

**Decision 1: Progressive Commercial Discovery** ✅  
- Show what they own, expose next step, hide distant future
- Implemented in Layer 4 (Dashboard Visibility)

**Decision 2: Only Sell What Exists** ✅  
- Pricing page is a contract, not a roadmap
- Production-ready features only; "Early Access" allowed for evolving features
- Implemented in Layer 2 (Pricing Configuration) and content verification

**Decision 3: Guided Professional Trial** ✅  
- Professional features with progressive introduction
- Usage-based recommendations at expiry
- Implemented in Layer 6 (Trial Implementation)

**Decision 4: Global Commercial Model (3 Layers)** ✅  
- Canonical pricing (RWF), localized display, regional policy (future)
- Implemented in Layer 2 (Pricing Configuration)

**Decision 5: Transparent Annual Savings** ✅  
- "Pay annually and save 25% — equivalent to 3 free months"
- Always display all pricing elements
- Implemented in pricing page updates

**Decision 6: Strategic Partnership Model (Enterprise)** ✅  
- No minimums, operational complexity focus, consultation-based
- Implemented in pricing configuration and sales process

---

## IMPLEMENTATION PHILOSOPHY

### Principle 1: Constitution-First

**Implementation follows policy.**  
Every code change must trace back to a specific section of the Commercial Constitution.

**Anti-Pattern:**  
Do not implement commercial logic and then update documentation. Policy comes first.

### Principle 2: Layered Enforcement

**Commercial Truth requires enforcement at multiple layers:**

1. **Entitlement Layer** — Define what each plan includes
2. **API Layer** — Enforce entitlements at backend
3. **UI Layer** — Respect entitlements in frontend
4. **Dashboard Layer** — Show/hide features based on entitlements
5. **Billing Layer** — Charge correct amounts
6. **Lifecycle Layer** — Handle trial, upgrade, downgrade, cancellation correctly

**All layers must be consistent.**

### Principle 3: Single Source of Truth

**Commercial configuration lives in one place:**  
`src/config/pricing.ts` (canonical pricing)  
`src/lib/plan-entitlements.ts` (feature-to-plan mapping)

**All other systems derive from these sources.**

### Principle 4: Fail Secure

**When in doubt, restrict access.**  
If entitlement check fails or is unclear, deny access and log error.

**Anti-Pattern:**  
Do not fail open (granting access when check fails). This causes revenue leakage.

### Principle 5: Audit Everything

**All commercial events must be logged:**
- Subscription created
- Plan changed
- Feature accessed
- Entitlement checked
- Payment processed

**Audit trail enables:**
- Debugging
- Compliance
- Revenue analysis
- Customer support

---

## IMPLEMENTATION LAYERS

### LAYER 1: ENTITLEMENT DEFINITIONS

**File:** `src/lib/plan-entitlements.ts`

**Current State:**  
- ✅ Well-designed interface (60 entitlements)
- ✅ Helper functions (`hasFeatureAccess`, `getUpgradePlanForFeature`)
- ⚠️ Supports both `ESSENTIALS` and `STARTER` (alias)

**Required Changes:**

#### Change 1.1: Remove ESSENTIALS Alias

**Before:**
```typescript
case 'ESSENTIALS':
case 'STARTER':
  return { ... }
```

**After:**
```typescript
case 'STARTER':
  return { ... }
```

**Rationale:** Constitution freezes `STARTER` as official name

**Effort:** 10 minutes  
**Risk:** Low (backward compatibility handled by migration)

---

#### Change 1.2: Align Entitlements with Constitution

**Action:** Verify that entitlements in code match Section 6 of constitution

**Checklist:**
- ✅ Starter features match constitution
- ✅ Professional features match constitution
- ✅ Business features match constitution
- ✅ Premium features match constitution
- ✅ Enterprise features match constitution

**If discrepancies found:**  
Update `plan-entitlements.ts` to match constitution (constitution is authoritative)

**Effort:** 1-2 hours  
**Risk:** Low (alignment only)

---

### LAYER 2: PRICING CONFIGURATION

**File:** `src/config/pricing.ts`

**Current State:**  
- ⚠️ Uses `ESSENTIALS` (deprecated)
- ⚠️ Pricing: 12,500/month (wrong)
- ✅ Annual pricing logic correct (25% savings)

**Required Changes:**

#### Change 2.1: Rename ESSENTIALS → STARTER

**Before:**
```typescript
{
  code: 'ESSENTIALS',
  name: 'Essentials',
  monthlyPriceRWF: 12500,
  annualMonthlyRWF: 10000,
  annualTotalRWF: 120000,
  // ...
}
```

**After:**
```typescript
{
  code: 'STARTER',
  name: 'Starter',
  monthlyPriceRWF: 18750, // 15,000 × 1.25
  annualMonthlyRWF: 15000,
  annualTotalRWF: 180000,
  // ...
}
```

**Rationale:**  
- Constitution Section 2: Official plan name is `STARTER`
- Constitution Section 3: Starter monthly price is 15,000 RWF

**Effort:** 15 minutes  
**Risk:** Low (rename + price update)

---

#### Change 2.2: Update Feature Lists

**Action:** Verify that feature lists in pricing config match Section 6 of constitution

**Example:**
```typescript
features: [
  'Unlimited users',
  'Orders & Tables management',
  'Kitchen tickets',
  'Basic Inventory tracking',
  'Basic Supplier orders',
  'Mobile Money payments',
  'Daily & weekly reports',
  'Basic CRM',
  'Discovery basic listing',
  'QR Menu Builder (5 codes)',
  'Site Builder preview',
  '20 AI credits/month',
  '1 branch, 1 outlet',
]
```

**Verify against:** Constitution Section 6.2 (Starter Plan Features)

**Effort:** 1 hour  
**Risk:** Low (alignment only)

---

### LAYER 3: API ENFORCEMENT

**Current State:**  
- ❌ Only ~5% of API endpoints enforce entitlements
- ✅ Subscription expiry checks exist (`withSubscriptionCheck`)
- ❌ No feature-level entitlement checks

**Required Changes:**

#### Change 3.1: Create Feature-Level Middleware

**New File:** `src/lib/middleware/withFeatureCheck.ts`

**Implementation:**
```typescript
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { 
  getPlanEntitlements, 
  hasFeatureAccess, 
  getUpgradePlanForFeature, 
  type PlanCode, 
  type PlanEntitlements 
} from '@/lib/plan-entitlements'

type ApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<any> | any

export function requiresFeature(feature: keyof PlanEntitlements) {
  return (handler: ApiHandler): ApiHandler => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      // Get session
      const session = await getServerSession(req, res, authOptions)
      if (!session?.user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      
      // Get business
      const businessId = (session.user as any).businessId
      if (!businessId) {
        return res.status(403).json({ error: 'No business associated' })
      }
      
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
      
      // Determine plan (trial gets Professional features per constitution Section 8)
      const inTrial = business.trialEndDate && new Date() < new Date(business.trialEndDate)
      const planCode = inTrial ? 'PROFESSIONAL' : (business.plan.code as PlanCode)
      
      // Check feature access
      if (!hasFeatureAccess(planCode, feature)) {
        const upgradePlan = getUpgradePlanForFeature(feature)
        
        // Log denied access for analytics
        console.warn('[FeatureCheck] Access denied', {
          feature,
          currentPlan: planCode,
          upgradePlan,
          businessId,
          userId: (session.user as any).id
        })
        
        return res.status(402).json({
          error: 'feature_locked',
          message: `This feature requires ${upgradePlan} plan or higher`,
          feature,
          currentPlan: planCode,
          upgradePlan,
          upgradeUrl: '/pricing'
        })
      }
      
      // Log successful access for analytics
      console.log('[FeatureCheck] Access granted', {
        feature,
        plan: planCode,
        businessId
      })
      
      return handler(req, res)
    }
  }
}
```

**Effort:** 2-3 hours  
**Risk:** Low (new middleware, doesn't break existing)

---

#### Change 3.2: Apply Middleware to API Endpoints

**Action:** Wrap commercial API endpoints with `requiresFeature()`

**Example:**
```typescript
// src/pages/api/reservations.ts
import { requiresFeature } from '@/lib/middleware/withFeatureCheck'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle reservations
}

export default requiresFeature('hasReservations')(handler)
```

**Endpoints to Update (~100):**

| Endpoint | Required Feature |
|----------|------------------|
| `/api/reservations` | `hasReservations` |
| `/api/inventory/alerts` | `hasInventoryAlerts` |
| `/api/procurement` | `hasProcurementWorkflow` |
| `/api/campaigns` | `hasWhatsAppCampaigns` |
| `/api/analytics/payments` | `hasPaymentAnalytics` |
| `/api/analytics/menu-performance` | `hasMenuPerformance` |
| `/api/analytics/qr` | `hasQRAnalytics` |
| `/api/staff` | `hasStaffManagement` |
| `/api/branches` | `hasMultiBranchDashboard` |
| `/api/ab-testing` | `hasABTesting` |
| `/api/optimization` | `hasOptimizationHub` |
| `/api/insights` | `hasOptimizationInsights` |
| ... | ... |

**Effort:** 1-2 weeks (apply to all endpoints, test)  
**Risk:** High (affects all API calls, requires thorough testing)

**Testing Strategy:**
1. Unit tests for middleware
2. Integration tests for each endpoint
3. E2E tests for critical flows
4. Manual testing for each plan tier

---

### LAYER 4: PROGRESSIVE COMMERCIAL DISCOVERY

**File:** `src/components/DashboardLayout.tsx`

**Current State:**  
- ❌ All navigation items visible to all users
- ❌ No subscription-aware filtering
- ❌ No contextual upgrade prompts

**✅ Founder Decision #1: Progressive Commercial Discovery**
- Show what they own
- Expose next logical step only
- Hide distant future capabilities
- Surface upgrades inside workflows (not dashboard clutter)
- Admin functionality never used for upgrade marketing

**Required Changes:**

#### Change 4.1: Add Tier Metadata to Navigation Items

**Before:**
```typescript
{ 
  name: 'Reservations', 
  href: '/dashboard/reservations', 
  icon: Calendar, 
  v1Visible: true, 
  v1Section: 'OPERATIONS', 
  v1Order: 5 
}
```

**After:**
```typescript
{ 
  name: 'Reservations', 
  href: '/dashboard/reservations', 
  icon: Calendar, 
  v1Visible: true, 
  v1Section: 'OPERATIONS', 
  v1Order: 5,
  requiredFeature: 'hasReservations',
  minPlan: 'PROFESSIONAL', // ADD THIS
  isAdminOnly: false // ADD THIS
}
```

**Effort:** 1 hour (add to all gated items)  
**Risk:** Low

---

#### Change 4.2: Implement Progressive Discovery Logic

**✅ Approved Approach: Progressive Discovery (Not Lock Icons, Not Hidden)**

```typescript
const userPlan = (session?.user as any)?.planCode as PlanCode
const entitlements = getPlanEntitlements(userPlan)

// Determine next tier for progressive discovery
const planTiers = ['STARTER', 'PROFESSIONAL', 'BUSINESS', 'PREMIUM', 'ENTERPRISE']
const currentTierIndex = planTiers.indexOf(userPlan)
const nextTier = planTiers[currentTierIndex + 1]

const navigationWithDiscovery = navigation.map(item => {
  // Admin-only items: always hidden from regular users
  if (item.isAdminOnly && !isAdmin) {
    return { ...item, visibility: 'hidden' }
  }
  
  // No required feature: always visible (core features)
  if (!item.requiredFeature) {
    return { ...item, visibility: 'owned', accessible: true }
  }
  
  // Check if user owns this feature
  const hasAccess = entitlements[item.requiredFeature] === true
  if (hasAccess) {
    return { ...item, visibility: 'owned', accessible: true }
  }
  
  // Check if this is next-tier feature (discoverable)
  if (item.minPlan === nextTier) {
    return { ...item, visibility: 'next-tier', accessible: false }
  }
  
  // Distant future feature: hidden
  return { ...item, visibility: 'hidden', accessible: false }
})

// Render based on visibility
{navigationWithDiscovery.map(item => {
  if (item.visibility === 'hidden') return null // Don't render
  
  if (item.visibility === 'owned') {
    return <NavigationItem key={item.href} {...item} /> // Fully accessible
  }
  
  if (item.visibility === 'next-tier') {
    // Shown in "Grow Your Business" section, not main nav
    return null // Don't render in main nav
  }
})}

// Separate "Grow Your Business" section for next-tier features
<GrowYourBusinessSection>
  {navigationWithDiscovery
    .filter(item => item.visibility === 'next-tier')
    .map(item => (
      <UpgradePromptCard
        key={item.href}
        feature={item.name}
        nextPlan={nextTier}
        description={`Unlock ${item.name} in ${nextTier}`}
      />
    ))
  }
</GrowYourBusinessSection>
```

**Effort:** 2-3 days  
**Risk:** Medium (affects all users, needs testing)

**Key Difference from Previous Approach:**
- ❌ Not showing lock icons in main navigation
- ❌ Not hiding everything
- ✅ Showing owned features in main navigation
- ✅ Showing next-tier features in dedicated "Grow Your Business" section
- ✅ Hiding distant features completely

---

#### Change 4.3: Add Plan Indicator in Topbar

**Implementation:**
```typescript
// In DashboardLayout topbar
const userPlan = (session?.user as any)?.planCode as PlanCode
const planNames = {
  STARTER: 'Starter',
  PROFESSIONAL: 'Professional',
  BUSINESS: 'Business',
  PREMIUM: 'Premium',
  ENTERPRISE: 'Enterprise'
}

<div className="plan-badge">
  {planNames[userPlan] || 'Starter'}
</div>
```

**Styling:**
- Starter: Blue badge
- Professional: Purple badge
- Business: Orange badge
- Premium: Gold badge with crown icon
- Enterprise: Custom branding

**Effort:** 2-3 hours  
**Risk:** Low

---

### LAYER 5: UI FEATURE GATES

**File:** `src/components/FeatureGate.tsx`

**Current State:**  
- ✅ Component exists and works well
- ❌ Not used in any dashboard pages

**Required Changes:**

#### Change 5.1: Wrap Locked Pages in FeatureGate

**Example:**
```typescript
// src/pages/dashboard/reservations.tsx
import FeatureGate from '@/components/FeatureGate'
import { useSession } from 'next-auth/react'

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

**Pages to Update:**
- Reservations
- Inventory Alerts
- QR Analytics
- Menu Performance
- Payment Analytics
- Staff Management
- Multi-Branch
- AI features
- Optimization features

**Effort:** 3-5 days  
**Risk:** Low (UI-only, backend enforcement is primary)

---

### LAYER 6: GUIDED PROFESSIONAL TRIAL

**Files:**
- `src/pages/api/auth/signup.ts`
- `src/lib/middleware/withFeatureCheck.ts`
- `src/components/TrialOnboarding.tsx` (new)
- `src/lib/services/trial-analytics.ts` (new)

**Current State:**  
- ⚠️ Trial defaults to `ESSENTIALS` (wrong)
- ⚠️ Trial entitlements undefined
- ⚠️ No progressive onboarding

**✅ Founder Decision #3: Guided Professional Trial**
- Professional entitlements
- Progressive introduction (not all features on Day One)
- Usage-based recommendation at expiry

**Required Changes:**

#### Change 6.1: Fix Trial Plan in Signup

**Before:**
```typescript
planCode: 'ESSENTIALS'
```

**After:**
```typescript
planCode: 'STARTER' // Base plan after trial
trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
```

**Effort:** 5 minutes  
**Risk:** Low

---

#### Change 6.2: Grant Professional Features During Trial

**Implementation (already in Change 3.1):**
```typescript
// In withFeatureCheck.ts
const inTrial = business.trialEndDate && new Date() < new Date(business.trialEndDate)
const planCode = inTrial ? 'PROFESSIONAL' : (business.plan.code as PlanCode)
```

**Rationale:** Constitution Section 8: Guided Professional Trial

**Effort:** Already included in Change 3.1  
**Risk:** Low

---

#### Change 6.3: Implement Progressive Onboarding

**New Component:** `src/components/TrialOnboarding.tsx`

**Progressive Introduction Timeline:**
- **Days 1-3:** Core Operations (orders, tables, menu, inventory, payments)
- **Days 4-7:** Growth Features (reservations, staff, inventory alerts)
- **Days 8-11:** Analytics (payment analytics, menu performance, peak hours)
- **Days 12-14:** Marketing (WhatsApp campaigns, QR Builder, Site Builder)

**Implementation:**
```typescript
// Track which features have been introduced
const getIntroducedFeatures = (trialDay: number) => {
  if (trialDay <= 3) return ['core']
  if (trialDay <= 7) return ['core', 'growth']
  if (trialDay <= 11) return ['core', 'growth', 'analytics']
  return ['core', 'growth', 'analytics', 'marketing']
}

// Show onboarding prompts for newly introduced features
<TrialOnboardingPrompt
  day={trialDay}
  newFeatures={getNewFeatures(trialDay)}
  onComplete={() => markFeatureIntroduced(feature)}
/>
```

**Effort:** 3-5 days  
**Risk:** Medium (new onboarding flow)

---

#### Change 6.4: Track Trial Usage for Recommendations

**New Service:** `src/lib/services/trial-analytics.ts`

**Track:**
- Features used during trial
- Frequency of use
- Business patterns (single location vs multi-location intent)
- Team size (staff added)

**Usage-Based Recommendation Logic:**
```typescript
const recommendPlan = (trialUsage: TrialUsage) => {
  // If used reservations, staff, analytics → Professional
  if (trialUsage.usedReservations || trialUsage.usedStaff) {
    return 'PROFESSIONAL'
  }
  
  // If indicated multi-location intent → Business
  if (trialUsage.exploredMultiBranch || trialUsage.teamSize > 5) {
    return 'BUSINESS'
  }
  
  // If used AI or optimization features → Premium
  if (trialUsage.usedAI || trialUsage.usedOptimization) {
    return 'PREMIUM'
  }
  
  // Default: Starter
  return 'STARTER'
}
```

**Effort:** 2-3 days  
**Risk:** Low

---

#### Change 6.5: Usage-Based Conversion Flow

**✅ Approved Approach: Show Recommended Plan (Not All Plans)**

**7 Days Before Expiry:**
- Email: "Your trial ends in 7 days"
- In-app: Usage summary + recommended plan
- Example: "Based on your usage of Reservations and Staff Management, we recommend Professional"

**3 Days Before Expiry:**
- Email: "Your trial ends in 3 days"
- In-app: Personalized recommendation with pricing
- Show only recommended plan (not all 5 plans)

**1 Day Before Expiry:**
- Email: "Your trial ends tomorrow"
- Push notification
- One-click subscribe to recommended plan

**On Expiry:**
- Email: "Your trial has ended"
- Show recommended plan: "Based on your trial, Professional is the best fit"
- Primary CTA: "Subscribe to Professional"
- Secondary: "View all plans"

**Effort:** 2-3 days  
**Risk:** Low

---

### LAYER 7: UPGRADE/DOWNGRADE FLOWS

**Files:**
- `src/pages/api/subscriptions/upgrade.ts` (new)
- `src/pages/api/subscriptions/downgrade.ts` (new)
- `src/pages/settings.tsx` or `src/pages/pricing.tsx`

**Current State:**  
- ❌ No upgrade flow
- ❌ No downgrade flow

**Required Changes:**

#### Change 7.1: Implement Upgrade API

**New File:** `src/pages/api/subscriptions/upgrade.ts`

**Implementation:**
```typescript
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
  
  // Calculate proration (Constitution Section 9.2)
  const now = new Date()
  const endDate = new Date(currentSub.endDate)
  const totalDays = 30
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

**Effort:** 3-5 days (API + payment flow + testing)  
**Risk:** Medium (payment logic)

---

#### Change 7.2: Implement Downgrade API

**New File:** `src/pages/api/subscriptions/downgrade.ts`

**Implementation:** Similar to upgrade, but:
- Takes effect at next billing cycle (not immediately)
- No refund
- Check data retention warnings
- Schedule downgrade for future date

**Effort:** 3-5 days  
**Risk:** Medium (data retention logic)

---

#### Change 7.3: Add Upgrade/Downgrade UI

**Location:** Settings page or pricing page

**Components:**
- "Upgrade" button in topbar
- Plan comparison modal
- Proration calculation display
- Payment flow
- Confirmation

**Effort:** 2-3 days  
**Risk:** Low

---

### LAYER 8: FEATURE FLAGS CLEANUP

**Current State:**  
- ⚠️ Feature flags used for commercial gating (anti-pattern)
- ⚠️ Client-count thresholds bypass subscription model

**Required Changes:**

#### Change 8.1: Remove Client-Count Gating

**Before:**
```typescript
if (clientCount >= 10 && isFeatureFlagEnabled('advanced_analytics')) {
  // Show advanced analytics
}
```

**After:**
```typescript
if (hasFeatureAccess(userPlan, 'hasAdvancedReports')) {
  // Show advanced analytics
}
```

**Features to Update:**
- `advanced_analytics` (10 clients) → `hasAdvancedReports`
- `multi_branch` (15 clients) → `hasMultiBranchDashboard`
- `ai_menu_builder` (20 clients) → New entitlement or `hasSiteBuilderPro`
- `promotions_engine` (25 clients) → New entitlement `hasPromotions`

**Effort:** 1-2 days  
**Risk:** Medium (changes feature availability)

---

#### Change 8.2: Retain Feature Flags for Rollout Only

**Keep feature flags for:**
- Gradual rollout (e.g., "enable for 10% of users")
- A/B testing (e.g., "test new UI")
- Kill switches (e.g., "disable if service down")

**Remove feature flags for:**
- Commercial gating (use entitlements instead)
- Plan-based access control (use entitlements)

**Effort:** 1 day  
**Risk:** Low

---

## IMPLEMENTATION TIMELINE

### Week 1-2: P0 Critical Fixes

**Day 1:**
- Change 1.1: Remove ESSENTIALS alias
- Change 2.1: Rename ESSENTIALS → STARTER, update pricing
- Change 6.1: Fix trial plan in signup

**Day 2-3:**
- Change 4.1: Add requiredFeature to navigation items
- Change 4.2: Implement dashboard visibility filtering
- Change 4.3: Add plan indicator in topbar

**Day 4:**
- Change 8.1: Remove client-count gating
- Change 8.2: Retain feature flags for rollout only

**Day 5:**
- Change 6.2: Grant Professional features during trial
- Testing and verification

**Day 6-10:**
- Change 3.1: Create feature-level middleware
- Change 3.2: Apply middleware to all API endpoints (~100)
- Comprehensive testing

### Week 3: P0 Subscription Lifecycle

**Day 11-13:**
- Change 7.1: Implement upgrade API
- Change 7.3: Add upgrade UI
- Testing

**Day 14-15:**
- Change 7.2: Implement downgrade API
- Change 7.3: Add downgrade UI
- Testing

### Week 4-5: P1 Improvements

**Day 16-17:**
- Change 6.3: Trial conversion flow
- Testing

**Day 18-20:**
- Change 5.1: Wrap locked pages in FeatureGate
- Testing

**Day 21-22:**
- Renewal reminders
- Failed payment handling

**Day 23-24:**
- Cancellation UI
- Retention flow

**Day 25:**
- Expiry warnings
- Dashboard banners

**Day 26:**
- Reactivation flow

**Day 27-30:**
- Complete or remove mock features (depends on Founder Decision #2)

### Week 6: P2 Polish

**Day 31-32:**
- Plan-specific branding
- Badge styling

**Day 33-34:**
- Upgrade CTAs throughout dashboard
- Contextual messaging

**Day 35-36:**
- Usage indicators (QR codes, AI credits, storage)

**Day 37-38:**
- Lifecycle emails (activation, renewal, cancellation, etc.)

**Day 39-40:**
- Celebration moments (welcome, unlocks, milestones)

---

## TESTING STRATEGY

### Unit Tests

**Coverage:**
- Entitlement checks (`hasFeatureAccess`)
- Proration calculations
- Plan code validation
- Feature flag logic

**Tools:** Jest, React Testing Library

---

### Integration Tests

**Coverage:**
- API middleware (`requiresFeature`)
- Subscription lifecycle (upgrade, downgrade, cancellation)
- Trial flows
- Dashboard visibility

**Tools:** Jest, Supertest

---

### E2E Tests

**Coverage:**
- Complete user journeys:
  - Signup → Trial → Conversion
  - Starter → Upgrade to Professional
  - Business → Downgrade to Professional
  - Active → Cancellation → Reactivation

**Tools:** Playwright or Cypress

---

### Manual Testing

**Test Matrix:**

| Plan | Test Scenario |
|------|--------------|
| Starter | Verify only Starter features accessible |
| Professional | Verify Professional features unlock |
| Business | Verify Business features unlock |
| Premium | Verify Premium features unlock |
| Enterprise | Verify Enterprise features unlock |
| Trial | Verify Professional features during trial |
| Expired | Verify grace period, then lockout |

**For Each Plan:**
- ✅ Dashboard navigation shows correct items
- ✅ Locked features show upgrade prompts
- ✅ API endpoints enforce entitlements
- ✅ Feature gates work correctly
- ✅ Plan indicator shows correct plan

---

## ROLLOUT STRATEGY

### Phase 1: Staging Deployment

**Actions:**
1. Deploy all changes to staging environment
2. Run full test suite
3. Manual testing for all plan tiers
4. Founder review and approval

**Duration:** 1 week

---

### Phase 2: Gradual Production Rollout

**Option A: Feature Flag Rollout**
- Enable for 10% of users
- Monitor metrics and errors
- Increase to 50%
- Increase to 100%

**Option B: Plan-Based Rollout**
- Enable for new signups only
- Enable for Starter users
- Enable for Professional users
- Enable for Business/Premium/Enterprise users

**Recommended:** Option B (plan-based)

**Duration:** 1-2 weeks

---

### Phase 3: Full Production

**Actions:**
1. Enable for all users
2. Monitor metrics
3. Address any issues
4. Celebrate success

**Duration:** Ongoing

---

## MONITORING & METRICS

### Key Metrics

**Revenue Metrics:**
- Revenue per user (by plan)
- Upgrade rate (Starter → Professional, etc.)
- Downgrade rate
- Churn rate
- Trial conversion rate

**Usage Metrics:**
- Feature access attempts (successful vs denied)
- Locked feature clicks
- Upgrade prompt views
- Upgrade prompt conversions

**Technical Metrics:**
- API entitlement check latency
- Entitlement check errors
- Feature gate render time

### Dashboards

**Create dashboards for:**
1. Commercial health (revenue, upgrades, churn)
2. Feature adoption (by plan tier)
3. Entitlement enforcement (access denied events)
4. Trial performance (conversion rates)

---

## ROLLBACK PLAN

### If Critical Issues Arise

**Rollback Triggers:**
- Revenue drop > 20%
- Error rate > 5%
- Customer complaints > 10/day
- Founder decision

**Rollback Process:**
1. Disable feature flags (if using gradual rollout)
2. Revert code changes
3. Restore previous pricing config
4. Communicate with affected customers
5. Investigate root cause
6. Fix and re-deploy

---

## COMPLIANCE VERIFICATION

### Quarterly Audit Checklist

**Pricing:**
- ✅ Pricing matches Constitution Section 3
- ✅ Annual savings = 25% (3 free months)
- ✅ Display pricing calculated correctly

**Plans:**
- ✅ Plan names match Constitution Section 2
- ✅ No deprecated names in use

**Features:**
- ✅ Feature-to-plan mapping matches Constitution Section 6
- ✅ All features have entitlement checks

**Dashboard:**
- ✅ Visibility matches Constitution Section 7
- ✅ Upgrade prompts working

**Trial:**
- ✅ Trial policy matches Constitution Section 8
- ✅ Conversion flow working

**Lifecycle:**
- ✅ Upgrade/downgrade behavior matches Constitution Section 9
- ✅ Data retention policies enforced

---

## SUCCESS CRITERIA

### P0 Success (Required)

- ✅ All plans use correct naming (STARTER, not ESSENTIALS)
- ✅ All plans use correct pricing (15K, 35K, 75K, 200K, Custom)
- ✅ Dashboard navigation filtered by subscription tier
- ✅ All commercial API endpoints enforce entitlements
- ✅ No client-count gating for commercial features
- ✅ Trial grants Professional entitlements
- ✅ Users can upgrade and downgrade plans
- ✅ Data retention policy documented and enforced

### P1 Success (Recommended)

- ✅ Trial conversion rate increases by 20%+
- ✅ Feature gates prevent unauthorized access
- ✅ Renewal reminders reduce churn by 10%+
- ✅ Cancellation UI captures reasons
- ✅ Expiry warnings reduce surprise cancellations
- ✅ Reactivation flow reduces friction

### P2 Success (Optimization)

- ✅ Plan indicators improve brand perception
- ✅ Upgrade CTAs increase upgrade rate by 15%+
- ✅ Usage indicators drive feature adoption
- ✅ Lifecycle emails improve engagement
- ✅ Celebration moments increase retention

---

## CONCLUSION

This blueprint provides a comprehensive implementation plan for achieving Commercial Truth in ImboniServe. The implementation is structured in layers, with clear dependencies, timelines, and success criteria.

**Key Principles:**
1. Constitution-first (policy before implementation)
2. Layered enforcement (consistent across all layers)
3. Single source of truth (pricing config + entitlements)
4. Fail secure (restrict when uncertain)
5. Audit everything (log all commercial events)

**Timeline:** 4-6 weeks from constitution approval to full implementation

**Next Steps:**
1. Founder approves Commercial Constitution
2. Founder decides on open decisions
3. Engineering begins implementation per this blueprint
4. Quarterly audits ensure ongoing compliance

---

**Prepared By:** Chief Product Architect / Commercial Systems Architect  
**Date:** 2026-07-02  
**Status:** Implementation plan (awaiting constitution approval)

**No implementation has been performed. This is architecture only.**
