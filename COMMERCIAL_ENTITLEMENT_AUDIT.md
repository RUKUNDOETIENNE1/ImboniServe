# COMMERCIAL_ENTITLEMENT_AUDIT

**Date:** 2026-07-02  
**Scope:** Backend enforcement audit for ImboniServe RC1  
**Purpose:** Verify that subscription entitlements are consistently enforced across all system layers

---

## EXECUTIVE SUMMARY

**Status:** ⚠️ **PARTIAL ENFORCEMENT**

The platform has a well-designed entitlement system (`plan-entitlements.ts`) but **inconsistent enforcement** across the stack.

### Enforcement Layers

| Layer | Status | Coverage | Issues |
|-------|--------|----------|--------|
| **Entitlement Definitions** | ✅ Complete | 100% | None - well-structured |
| **API Middleware** | ⚠️ Partial | ~15% | Most APIs lack subscription checks |
| **Dashboard Visibility** | ❌ Missing | 0% | All features visible to all users |
| **Feature Gates (UI)** | ⚠️ Partial | ~20% | Exists but rarely used |
| **Feature Flags** | ⚠️ Misused | N/A | Used for commercial gating (anti-pattern) |

---

## LAYER 1: ENTITLEMENT DEFINITIONS

### ✅ Status: COMPLETE

**File:** `src/lib/plan-entitlements.ts`

**Strengths:**
- Comprehensive `PlanEntitlements` interface covering all major features
- Clear plan hierarchy (ESSENTIALS/STARTER → PROFESSIONAL → BUSINESS → PREMIUM → ENTERPRISE)
- Typed entitlement checks with `getPlanEntitlements(planCode)`
- Helper functions: `hasFeatureAccess()`, `getUpgradePlanForFeature()`

**Issues:**
- ❌ **P0:** Plan naming inconsistency - supports both `ESSENTIALS` and `STARTER` (aliased)
- ⚠️ **P1:** No versioning or migration strategy for entitlement changes

**Entitlements Defined:**
- Core Operations: 8 entitlements
- Supplier & Procurement: 4 entitlements
- Growth & Marketing: 6 entitlements
- Online Presence: 6 entitlements
- Payments & Finance: 4 entitlements
- Intelligence & Automation: 3 entitlements
- Multi-location: 3 entitlements
- Support & Reliability: 3 entitlements
- QR & Codes: 1 entitlement
- Storage: 1 entitlement
- Advanced Features: 6 entitlements
- Staff & Access: 3 entitlements
- Reports & Analytics: 9 entitlements
- Customer: 2 entitlements
- Concurrent limits: 1 entitlement

**Total:** 60 distinct entitlements defined

---

## LAYER 2: API MIDDLEWARE

### ⚠️ Status: PARTIAL ENFORCEMENT

**File:** `src/lib/middleware/withSubscriptionCheck.ts`

**What Exists:**
- Middleware wrapper `withSubscriptionCheck()` for API routes
- Checks subscription expiry (including grace period)
- Checks trial expiry
- Returns 402 Payment Required for expired subscriptions
- Exempts admin users from checks

**What's Missing:**
- ❌ **P0:** No feature-level entitlement checks (only checks if subscription is active, not what features it includes)
- ❌ **P0:** Not applied to most API endpoints (estimated <15% coverage)
- ❌ **P0:** No helper for checking specific feature entitlements in API handlers

**Current Implementation:**
```typescript
// Only checks: Is subscription active?
// Does NOT check: Does this subscription include feature X?
export function withSubscriptionCheck(handler, options) {
  // Checks expiry only, not feature access
}
```

**What's Needed:**
```typescript
// Should also support:
export function requiresFeature(feature: keyof PlanEntitlements) {
  return (handler) => async (req, res) => {
    const userPlan = await getUserPlan(req)
    if (!hasFeatureAccess(userPlan, feature)) {
      return res.status(402).json({
        error: 'feature_locked',
        feature,
        upgradePlan: getUpgradePlanForFeature(feature),
        upgradeUrl: '/pricing'
      })
    }
    return handler(req, res)
  }
}
```

### API Endpoint Audit

#### ✅ Endpoints WITH Subscription Checks

**Subscription Management:**
- `/api/billing/subscription` - Checks subscription status
- `/api/subscriptions/*` - Subscription CRUD operations

**Total:** ~5 endpoints (< 5% of API surface)

#### ❌ Endpoints WITHOUT Subscription Checks (Sample)

**Core Operations:**
- `/api/orders` - No feature check
- `/api/tables` - No feature check
- `/api/kitchen` - No feature check
- `/api/reservations` - No feature check (should require Professional+)
- `/api/branches` - No feature check (should require Business+)

**Inventory & Procurement:**
- `/api/inventory` - No feature check
- `/api/inventory/alerts` - No feature check (should require Professional+)
- `/api/procurement` - No feature check (should require Professional+)

**Payments:**
- `/api/payments/monitor` - No feature check (should require Professional+)
- `/api/analytics/payments` - No feature check (should require Professional+)

**Marketing:**
- `/api/campaigns` - No feature check (should require Professional+)
- `/api/promotions` - No feature check (should require Professional+)
- `/api/loyalty` - No feature check (should require Business+)

**Analytics:**
- `/api/analytics/dashboard` - No feature check (should require Business+)
- `/api/analytics/menu-performance` - No feature check (should require Professional+)
- `/api/analytics/qr` - No feature check (should require Business+)

**AI & Optimization:**
- `/api/insights/generate` - No feature check (should require Premium+)
- `/api/ab-testing` - No feature check (should require Business+)
- `/api/optimization` - No feature check (should require Premium+)

**Staff:**
- `/api/staff` - No feature check (should require Professional+)
- `/api/staff/performance` - No feature check (should require Professional+)

**CMS:**
- `/api/cms/posts` - No feature check (should require Professional+)
- `/api/cms/analytics` - No feature check (should require Professional+)

**Total Estimated:** ~100+ endpoints without proper feature-level checks

---

## LAYER 3: DASHBOARD VISIBILITY

### ❌ Status: MISSING

**File:** `src/components/DashboardLayout.tsx`

**Current Implementation:**
- Navigation items have `v1Visible`, `v1AdminOnly`, `v1DeveloperOnly` flags
- Navigation items have `featureFlag` checks
- **NO subscription-based visibility control**

**Impact:**
- Starter users see all navigation items (Orders, Kitchen, KDS, Reservations, Multi-Branch, etc.)
- Users click on features they don't have access to
- Confusion, support burden, poor user experience

**What's Needed:**
```typescript
// Navigation should filter based on user's plan
const navigation = RAW_NAVIGATION.filter(item => {
  if (item.requiredFeature) {
    return hasFeatureAccess(userPlan, item.requiredFeature)
  }
  return true
})
```

**Recommended Navigation Gating:**

| Navigation Item | Required Feature | Current Visibility |
|----------------|------------------|-------------------|
| Dashboard | None | ✅ All users |
| Orders | None | ✅ All users |
| Kitchen | `hasKitchenTickets` | ❌ All users (should gate) |
| Tables | None | ✅ All users |
| Reservations | `hasReservations` | ❌ All users (should gate) |
| Menu | None | ✅ All users |
| Inventory | `hasBasicInventory` | ❌ All users (should gate) |
| Inventory Alerts | `hasInventoryAlerts` | ❌ All users (should gate) |
| OCR Documents | None | ✅ All users |
| QR Builder | None | ✅ All users (limit via `maxQRCodes`) |
| QR Analytics | `hasQRAnalytics` | ❌ All users (should gate) |
| Reports | `hasBasicReports` | ❌ All users (should gate) |
| Menu Performance | `hasMenuPerformance` | ❌ All users (should gate) |
| Peak Hours | `hasMenuPerformance` | ❌ All users (should gate) |
| Payment Analytics | `hasPaymentAnalytics` | ❌ All users (should gate) |
| Staff | `hasStaffManagement` | ❌ All users (should gate) |
| Transactions | None | ✅ All users |
| Payout Summary | None | ✅ All users |
| Payment Settings | None | ✅ All users |

---

## LAYER 4: FEATURE GATES (UI)

### ⚠️ Status: PARTIAL

**File:** `src/components/FeatureGate.tsx`

**What Exists:**
- `<FeatureGate>` component for wrapping locked features
- `<FeatureLockBadge>` for inline upgrade prompts
- `<FeatureLockButton>` for disabled buttons with upgrade hints
- Uses `hasFeatureAccess()` and `getUpgradePlanForFeature()`

**Usage in Codebase:**
- ❌ **P0:** Feature gates are **NOT used** in dashboard pages
- ❌ **P0:** No grep results for `FeatureGate` in `pages/dashboard/**/*.tsx`
- ⚠️ Only used in `FeatureGate.tsx` itself (examples/tests)

**Impact:**
- UI components don't prevent access to locked features
- Users can interact with features they shouldn't have
- Backend enforcement is the only protection (which is also missing)

**What's Needed:**
```typescript
// Example: Reservations page
export default function Reservations() {
  const { userPlan } = useSession()
  
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

---

## LAYER 5: FEATURE FLAGS

### ⚠️ Status: MISUSED

**File:** `src/hooks/useFeatureFlag.ts` (inferred)

**Current Usage:**
- Feature flags used for **commercial gating** (anti-pattern)
- Examples:
  - `advanced_analytics` - Requires 10 active clients
  - `multi_branch` - Requires 15 active clients + Business plan
  - `ai_menu_builder` - Requires 20 active clients
  - `promotions_engine` - Requires 25 active clients + Professional plan
  - `loyalty_system` - Feature flag gated
  - `hotel_mode` - Feature flag gated
  - `discovery_marketplace` - Feature flag gated

**Issues:**
- ❌ **P0:** Feature flags bypass subscription model
- ❌ **P0:** Client-count gating allows Starter users to access Premium features
- ❌ **P0:** Inconsistent with subscription-based entitlements

**Correct Usage of Feature Flags:**
- ✅ Gradual rollout (e.g., "enable for 10% of users")
- ✅ A/B testing (e.g., "test new UI for 50% of users")
- ✅ Kill switches (e.g., "disable if service is down")
- ❌ Commercial access control (use subscription entitlements instead)

**Recommendation:**
- Remove client-count thresholds from feature flags
- Use feature flags for rollout/testing only
- Use subscription entitlements for commercial gating
- If gradual rollout is needed, combine: `hasFeatureAccess(plan, feature) && isFeatureFlagEnabled(flag)`

---

## LAYER 6: SUBSCRIPTION LIFECYCLE

### ⚠️ Status: PARTIAL

**Files:**
- `src/lib/payments/subscription.engine.ts` - Subscription CRUD
- `src/lib/middleware/withSubscriptionCheck.ts` - Expiry checks
- `src/pages/api/auth/signup.ts` - Trial creation

**What Exists:**
- ✅ Subscription activation after payment
- ✅ Subscription renewal
- ✅ Subscription cancellation
- ✅ Subscription suspension (admin action)
- ✅ Trial expiry checks
- ✅ Grace period (3 days after expiry)

**What's Missing:**
- ❌ **P0:** Upgrade flow (change from Starter → Professional)
- ❌ **P0:** Downgrade flow (change from Business → Professional)
- ❌ **P0:** Data retention policy on downgrade
- ❌ **P0:** Feature access changes on plan change
- ❌ **P1:** Proration logic for mid-cycle changes
- ❌ **P1:** Subscription change history/audit log
- ⚠️ **P1:** Trial strategy undefined (what plan does trial receive?)

**Trial Implementation:**
```typescript
// src/pages/api/auth/signup.ts
const trialEndDate = shouldAutoApprove && isHospitality 
  ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) 
  : null

// Issue: Trial defaults to ESSENTIALS plan (wrong)
// Should: Trial should receive Professional plan features
```

---

## ENFORCEMENT GAP ANALYSIS

### Critical Gaps

| Feature Category | Entitlement Defined | API Enforced | UI Gated | Dashboard Hidden |
|-----------------|--------------------|--------------|---------|--------------------|
| **Core Operations** | ✅ | ❌ | ❌ | ❌ |
| **Reservations** | ✅ | ❌ | ❌ | ❌ |
| **Multi-Branch** | ✅ | ⚠️ (flag only) | ❌ | ❌ |
| **Inventory Alerts** | ✅ | ❌ | ❌ | ❌ |
| **Procurement** | ✅ | ❌ | ❌ | ❌ |
| **Payment Analytics** | ✅ | ❌ | ❌ | ❌ |
| **WhatsApp Campaigns** | ✅ | ❌ | ❌ | ❌ |
| **QR Analytics** | ✅ | ❌ | ❌ | ❌ |
| **Menu Performance** | ✅ | ❌ | ❌ | ❌ |
| **Advanced Analytics** | ✅ | ⚠️ (flag only) | ❌ | ❌ |
| **Staff Management** | ✅ | ❌ | ❌ | ❌ |
| **A/B Testing** | ✅ | ❌ | ❌ | ❌ |
| **AI Insights** | ✅ | ❌ | ❌ | ❌ |
| **Optimization Hub** | ✅ | ❌ | ❌ | ❌ |
| **Revenue Intelligence** | ✅ | ❌ | ❌ | ❌ |
| **API Access** | ✅ | ❌ | ❌ | ❌ |
| **Enterprise Features** | ✅ | ❌ | ❌ | ❌ |

**Summary:**
- **Entitlements Defined:** 60/60 (100%)
- **API Enforcement:** ~5/100 endpoints (5%)
- **UI Gating:** 0/86 dashboard pages (0%)
- **Dashboard Visibility:** 0/22 navigation items (0%)

---

## SECURITY & REVENUE IMPLICATIONS

### Revenue Leakage

**Current State:** Customers receive features they didn't pay for.

**Examples:**
- Starter customer (15,000/month) can access:
  - Reservations (Professional feature)
  - Payment Analytics (Professional feature)
  - Multi-Branch (Business feature, if 15 clients)
  - Advanced Analytics (Business feature, if 10 clients)
  - AI Insights (Premium feature)
  - Optimization Hub (Premium feature)

**Estimated Revenue Impact:**
- If 30% of Starter customers should be Professional: **~2x revenue loss per customer**
- If 10% of Professional customers should be Business: **~2x revenue loss per customer**

### Security Implications

**Current State:** Subscription checks can be bypassed.

**Attack Vectors:**
- Direct API calls bypass UI (no API enforcement)
- Feature flags can be manipulated (client-side checks)
- Expired subscriptions may still access features (grace period + missing checks)

**Risk Level:** **MEDIUM**
- Not a data breach risk (auth still required)
- Revenue leakage risk (customers get free features)
- Support burden risk (customers confused about what they have)

---

## RECOMMENDATIONS

### P0 (Must Fix Before RC1 Launch)

1. **Add API-Level Enforcement**
   - Create `requiresFeature()` middleware
   - Apply to all commercial feature endpoints
   - Return 402 with upgrade path for locked features

2. **Implement Dashboard Visibility Control**
   - Filter navigation based on user's plan
   - Hide features user doesn't have access to
   - Show upgrade prompts for locked sections

3. **Remove Client-Count Gating**
   - Replace with subscription-tier gating
   - Use feature flags for rollout only, not commercial control

4. **Fix Plan Naming**
   - Rename ESSENTIALS → STARTER
   - Update pricing to match approved model
   - Update trial defaults

### P1 (Should Fix for Production Quality)

1. **Implement Upgrade/Downgrade Flows**
   - Define data retention policies
   - Define feature access changes
   - Implement proration logic
   - Add subscription change audit log

2. **Define Trial Strategy**
   - Recommend: Trial receives Professional plan features
   - Update signup flow
   - Update trial messaging

3. **Add Feature Gates to Dashboard Pages**
   - Wrap locked features in `<FeatureGate>`
   - Show contextual upgrade prompts
   - Improve conversion funnel

4. **Audit and Complete Mock Features**
   - Recipe management
   - Auto-reorder
   - Supplier portal
   - Customer feedback
   - Advanced reporting

### P2 (Nice to Have)

1. **Add Entitlement Versioning**
   - Track entitlement changes over time
   - Support grandfathering for existing customers
   - Migration strategy for plan changes

2. **Improve Upgrade Messaging**
   - Contextual "why upgrade" prompts
   - Feature comparison tooltips
   - In-app upgrade flow

3. **Add Usage Analytics**
   - Track which locked features users attempt to access
   - Identify upsell opportunities
   - Optimize pricing tiers

---

## CONCLUSION

**Current State:** Entitlements are well-defined but poorly enforced.

**Gap:** The platform has a strong commercial model on paper (`plan-entitlements.ts`) but weak implementation in practice (API, UI, dashboard).

**Impact:** Customers receive features they didn't pay for, creating revenue leakage and unclear value proposition.

**Path Forward:**
1. Enforce entitlements at API layer (P0)
2. Control dashboard visibility (P0)
3. Remove commercial feature flags (P0)
4. Implement subscription lifecycle (P1)

**Estimated Effort:**
- P0 fixes: 2-3 weeks (API enforcement, dashboard visibility, plan naming)
- P1 fixes: 1-2 weeks (upgrade/downgrade flows, trial strategy)
- P2 improvements: 1 week (versioning, messaging, analytics)

**Total:** 4-6 weeks to achieve Commercial Truth

---

**Next Steps:** Review `DASHBOARD_VISIBILITY_AUDIT.md` for detailed subscription-specific experience analysis.
