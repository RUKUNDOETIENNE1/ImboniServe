# IMPLEMENTATION_DEPENDENCY_MATRIX

**Document:** Commercial Constitution v1.1 Implementation Dependencies  
**Date:** 2026-07-03  
**Purpose:** Map all implementation dependencies to determine safe execution order

---

## OVERVIEW

This document maps every commercial implementation area to its dependencies. Implementation must proceed in dependency order to avoid:
- Breaking changes
- Merge conflicts
- Commercial inconsistencies
- Regression bugs

**Key Principle:** Dependencies must be resolved before dependents can be implemented.

---

## DEPENDENCY GRAPH

```
LEVEL 0 (Foundation - No Dependencies)
├── Pricing Configuration Update
└── Plan Entitlement Definitions Update

LEVEL 1 (Depends on Level 0)
├── API Entitlement Middleware Creation
├── Session Extension (Plan Data)
└── Pricing Page Content Update

LEVEL 2 (Depends on Level 1)
├── API Endpoint Protection (~100 endpoints)
├── Dashboard Progressive Discovery
├── Trial Onboarding System
└── Feature Flag Cleanup

LEVEL 3 (Depends on Level 2)
├── Upgrade API & UI
├── Downgrade API & UI
├── Trial Conversion Flow
└── Contextual Upgrade Prompts

LEVEL 4 (Depends on Level 3)
├── Renewal Reminders
├── Cancellation UI
├── Expiry Warnings
└── Reactivation Flow

LEVEL 5 (Polish - Depends on Level 4)
├── Plan Indicators
├── Usage Indicators
├── Lifecycle Emails
└── Celebration Moments
```

---

## DETAILED DEPENDENCY MAPPING

### LEVEL 0: FOUNDATION (No Dependencies)

#### 1. Pricing Configuration Update

**File:** `src/config/pricing.ts`

**Changes:**
- Rename `ESSENTIALS` → `STARTER`
- Update pricing: 12,500 → 18,750 (monthly), 10,000 → 15,000 (annual monthly)
- Update feature lists to match Constitution

**Dependencies:** None

**Dependents:**
- All other commercial implementation
- Pricing page
- Entitlement system
- Dashboard
- Trial system

**Must Complete Before:** Everything else

**Effort:** 30 minutes

**Risk:** Low

---

#### 2. Plan Entitlement Definitions Update

**File:** `src/lib/plan-entitlements.ts`

**Changes:**
- Remove `ESSENTIALS` alias
- Update `STARTER` entitlements to match Constitution Section 6.2
- Verify all 60 entitlements are correctly mapped

**Dependencies:** None

**Dependents:**
- API middleware
- Dashboard visibility
- Feature gates
- Trial system

**Must Complete Before:** API middleware creation

**Effort:** 1 hour

**Risk:** Low

---

### LEVEL 1: CORE SYSTEMS (Depends on Level 0)

#### 3. API Entitlement Middleware Creation

**File:** `src/lib/middleware/withFeatureCheck.ts` (new)

**Changes:**
- Create `requiresFeature()` middleware
- Implement trial detection (grant Professional entitlements)
- Implement entitlement checking
- Return 402 with upgrade info if locked

**Dependencies:**
- ✅ Pricing Configuration (Level 0)
- ✅ Plan Entitlement Definitions (Level 0)

**Dependents:**
- All API endpoint protection
- Trial system
- Dashboard visibility

**Must Complete Before:** API endpoint protection

**Effort:** 2-3 hours

**Risk:** Low (new file, doesn't break existing)

---

#### 4. Session Extension (Plan Data)

**Files:**
- `src/pages/api/auth/[...nextauth].ts`
- Session serialization

**Changes:**
- Add `planCode` to session
- Add `trialEndDate` to session
- Add `subscriptionStatus` to session

**Dependencies:**
- ✅ Pricing Configuration (Level 0)

**Dependents:**
- Dashboard visibility
- API middleware
- Trial system

**Must Complete Before:** Dashboard Progressive Discovery

**Effort:** 1 hour

**Risk:** Low

---

#### 5. Pricing Page Content Update

**File:** `src/pages/pricing.tsx`

**Changes:**
- Update plan names (ESSENTIALS → STARTER)
- Update pricing (12,500 → 15,000)
- Add transparent annual savings presentation:
  - Monthly price
  - Regular annual value
  - Discounted annual value
  - Savings amount
- Add standard language: "Pay annually and save 25% — equivalent to 3 free months"

**Dependencies:**
- ✅ Pricing Configuration (Level 0)

**Dependents:**
- Trial conversion flow
- Upgrade/downgrade UI

**Must Complete Before:** Trial conversion flow

**Effort:** 2-3 hours

**Risk:** Low

---

### LEVEL 2: ENFORCEMENT & DISCOVERY (Depends on Level 1)

#### 6. API Endpoint Protection

**Files:** ~100 API endpoints in `src/pages/api/`

**Changes:**
- Wrap each commercial endpoint with `requiresFeature()`
- Examples:
  - `/api/reservations` → `requiresFeature('hasReservations')`
  - `/api/inventory/alerts` → `requiresFeature('hasInventoryAlerts')`
  - `/api/campaigns` → `requiresFeature('hasWhatsAppCampaigns')`

**Dependencies:**
- ✅ API Entitlement Middleware (Level 1)
- ✅ Plan Entitlement Definitions (Level 0)

**Dependents:**
- Commercial Truth enforcement
- Revenue protection

**Must Complete Before:** Feature flag cleanup

**Effort:** 1-2 weeks

**Risk:** High (affects all API calls, requires thorough testing)

---

#### 7. Dashboard Progressive Discovery

**Files:**
- `src/components/DashboardLayout.tsx`
- `src/components/GrowYourBusinessSection.tsx` (new)
- `src/components/UpgradePromptCard.tsx` (new)

**Changes:**
- Add `requiredFeature` and `minPlan` metadata to navigation items
- Implement Progressive Discovery logic:
  - Show owned features
  - Expose next-tier features in "Grow Your Business" section
  - Hide distant features
- Create "Grow Your Business" section
- Create upgrade prompt cards

**Dependencies:**
- ✅ Session Extension (Level 1)
- ✅ Plan Entitlement Definitions (Level 0)

**Dependents:**
- Contextual upgrade prompts
- Plan indicators

**Must Complete Before:** Contextual upgrade prompts

**Effort:** 2-3 days

**Risk:** Medium (affects all users)

---

#### 8. Trial Onboarding System

**Files:**
- `src/components/TrialOnboarding.tsx` (new)
- `src/lib/services/trial-analytics.ts` (new)
- `src/pages/api/auth/signup.ts`

**Changes:**
- Fix trial plan: `ESSENTIALS` → `STARTER`
- Create progressive onboarding component
- Implement Days 1-3, 4-7, 8-11, 12-14 feature introduction
- Create usage tracking service
- Track features used during trial

**Dependencies:**
- ✅ API Entitlement Middleware (Level 1) — for Professional entitlements during trial
- ✅ Plan Entitlement Definitions (Level 0)

**Dependents:**
- Trial conversion flow
- Usage-based recommendations

**Must Complete Before:** Trial conversion flow

**Effort:** 3-5 days

**Risk:** Medium (new onboarding flow)

---

#### 9. Feature Flag Cleanup

**Files:**
- All files using `useFeatureFlags()` for commercial gating
- `src/hooks/useFeatureFlag.ts`

**Changes:**
- Replace commercial feature flags with entitlement checks
- Remove client-count gating
- Retain feature flags only for:
  - Gradual rollout
  - A/B testing
  - Kill switches

**Dependencies:**
- ✅ API Endpoint Protection (Level 2) — entitlements must be enforced first
- ✅ Dashboard Progressive Discovery (Level 2) — dashboard must use entitlements

**Dependents:**
- None (cleanup)

**Must Complete Before:** N/A

**Effort:** 1-2 days

**Risk:** Medium (changes feature availability)

---

### LEVEL 3: LIFECYCLE FLOWS (Depends on Level 2)

#### 10. Upgrade API & UI

**Files:**
- `src/pages/api/subscriptions/upgrade.ts` (new)
- `src/components/UpgradeModal.tsx` (new)
- `src/pages/settings.tsx` or `src/pages/pricing.tsx`

**Changes:**
- Create upgrade API with proration calculation
- Create upgrade UI modal
- Add "Upgrade" button in topbar or settings
- Show pricing comparison
- Process payment and update subscription

**Dependencies:**
- ✅ API Endpoint Protection (Level 2) — must enforce new entitlements after upgrade
- ✅ Dashboard Progressive Discovery (Level 2) — must show new features after upgrade
- ✅ Pricing Page (Level 1) — for pricing display

**Dependents:**
- Contextual upgrade prompts
- Revenue growth

**Must Complete Before:** Contextual upgrade prompts

**Effort:** 3-5 days

**Risk:** Medium (payment logic)

---

#### 11. Downgrade API & UI

**Files:**
- `src/pages/api/subscriptions/downgrade.ts` (new)
- `src/components/DowngradeModal.tsx` (new)
- `src/pages/settings.tsx`

**Changes:**
- Create downgrade API (scheduled for next billing cycle)
- Create downgrade UI with data retention warnings
- Handle data over new limits (user selects what to keep)
- Schedule downgrade for next billing date

**Dependencies:**
- ✅ API Endpoint Protection (Level 2) — must enforce reduced entitlements after downgrade
- ✅ Dashboard Progressive Discovery (Level 2) — must hide features after downgrade

**Dependents:**
- Cancellation UI

**Must Complete Before:** Cancellation UI

**Effort:** 3-5 days

**Risk:** Medium (data retention complexity)

---

#### 12. Trial Conversion Flow

**Files:**
- `src/components/TrialConversionPrompt.tsx` (new)
- `src/lib/services/trial-recommendation.ts` (new)
- Email templates

**Changes:**
- Implement usage-based recommendation engine
- Create conversion prompts (7 days, 3 days, 1 day before expiry)
- Show recommended plan (not all plans)
- One-click subscribe to recommended plan
- Email reminders

**Dependencies:**
- ✅ Trial Onboarding System (Level 2) — for usage tracking
- ✅ Pricing Page (Level 1) — for pricing display
- ✅ Upgrade API (Level 3) — for subscription activation

**Dependents:**
- Trial conversion rate improvement

**Must Complete Before:** N/A

**Effort:** 2-3 days

**Risk:** Low

---

#### 13. Contextual Upgrade Prompts

**Files:**
- `src/components/ContextualUpgradePrompt.tsx` (new)
- Various workflow pages

**Changes:**
- Create contextual upgrade prompt component
- Surface in relevant workflows:
  - "Unlock Reservations in Professional" (in Tables workflow)
  - "Growing to multiple locations? Upgrade to Business" (when approaching 1 branch limit)
- Supportive tone (not restrictive)

**Dependencies:**
- ✅ Dashboard Progressive Discovery (Level 2) — for discovery philosophy
- ✅ Upgrade API (Level 3) — for upgrade flow

**Dependents:**
- Upgrade conversion rate

**Must Complete Before:** N/A

**Effort:** 1-2 days

**Risk:** Low

---

### LEVEL 4: LIFECYCLE MANAGEMENT (Depends on Level 3)

#### 14. Renewal Reminders

**Files:**
- Scheduled job or cron
- Email templates

**Changes:**
- Send email 7 days before renewal
- Include: amount, date, payment method, option to update or cancel
- Retry payment on failure (3 attempts)
- Email after each failure

**Dependencies:**
- ✅ Upgrade/Downgrade APIs (Level 3) — for subscription management

**Dependents:**
- Churn reduction

**Must Complete Before:** N/A

**Effort:** 1-2 days

**Risk:** Low

---

#### 15. Cancellation UI

**Files:**
- `src/components/CancellationFlow.tsx` (new)
- `src/pages/api/subscriptions/cancel.ts` (new)
- `src/pages/settings.tsx`

**Changes:**
- Create cancellation UI
- Retention flow: "What can we do to keep you?"
- Offer discount or downgrade instead
- Capture cancellation reason
- Schedule cancellation for end of cycle

**Dependencies:**
- ✅ Downgrade API (Level 3) — for offering downgrade instead

**Dependents:**
- Churn management

**Must Complete Before:** N/A

**Effort:** 2-3 days

**Risk:** Low

---

#### 16. Expiry Warnings

**Files:**
- `src/components/ExpiryWarning.tsx` (new)
- Dashboard topbar

**Changes:**
- Show warning when subscription approaching expiry
- Grace period indicator (3 days)
- "Renew Now" CTA

**Dependencies:**
- ✅ Renewal Reminders (Level 4) — for renewal flow

**Dependents:**
- Churn reduction

**Must Complete Before:** N/A

**Effort:** 1 day

**Risk:** Low

---

#### 17. Reactivation Flow

**Files:**
- `src/components/ReactivationPrompt.tsx` (new)
- `src/pages/api/subscriptions/reactivate.ts` (new)

**Changes:**
- Show "Reactivate" button for expired subscriptions
- One-click reactivation (use saved payment method)
- Restore data (if within 90 days)
- Optional: "Welcome back! Get 25% off your first month"

**Dependencies:**
- ✅ Upgrade API (Level 3) — for subscription activation

**Dependents:**
- Revenue recovery

**Must Complete Before:** N/A

**Effort:** 1-2 days

**Risk:** Low

---

### LEVEL 5: POLISH (Depends on Level 4)

#### 18. Plan Indicators

**Files:**
- `src/components/DashboardLayout.tsx`
- Topbar

**Changes:**
- Show current plan in topbar badge
- Styling: Starter (blue), Professional (purple), Business (orange), Premium (gold), Enterprise (custom)
- Celebratory tone: "You're on Professional" (not "You're only on Professional")

**Dependencies:**
- ✅ Dashboard Progressive Discovery (Level 2)

**Dependents:**
- Brand perception

**Must Complete Before:** N/A

**Effort:** 2-3 hours

**Risk:** Low

---

#### 19. Usage Indicators

**Files:**
- Various dashboard pages

**Changes:**
- Show usage indicators:
  - QR codes: "5/5 used" (Starter)
  - AI credits: "15/20 used this month"
  - Storage: "1.2 GB / 2 GB"
- Upgrade prompt when approaching limit

**Dependencies:**
- ✅ Contextual Upgrade Prompts (Level 3)

**Dependents:**
- Feature adoption

**Must Complete Before:** N/A

**Effort:** 1-2 days

**Risk:** Low

---

#### 20. Lifecycle Emails

**Files:**
- Email templates
- Email service

**Changes:**
- Welcome email (trial activation)
- Trial conversion reminders
- Upgrade confirmation
- Downgrade confirmation
- Renewal confirmation
- Cancellation confirmation
- Reactivation confirmation

**Dependencies:**
- ✅ All lifecycle flows (Level 3-4)

**Dependents:**
- Customer engagement

**Must Complete Before:** N/A

**Effort:** 2-3 days

**Risk:** Low

---

#### 21. Celebration Moments

**Files:**
- Various dashboard pages

**Changes:**
- Welcome message after upgrade
- Feature unlock celebration
- Milestone celebrations (e.g., "You've processed 1,000 orders!")

**Dependencies:**
- ✅ Upgrade API (Level 3)

**Dependents:**
- Customer delight

**Must Complete Before:** N/A

**Effort:** 1-2 days

**Risk:** Low

---

## DEPENDENCY SUMMARY

| Level | Components | Dependencies | Effort | Risk |
|-------|-----------|--------------|--------|------|
| 0 | Pricing Config, Entitlement Definitions | None | 1.5 hours | Low |
| 1 | API Middleware, Session, Pricing Page | Level 0 | 1 day | Low |
| 2 | API Protection, Dashboard Discovery, Trial Onboarding, Feature Cleanup | Level 0, 1 | 2-3 weeks | Medium-High |
| 3 | Upgrade/Downgrade, Trial Conversion, Contextual Prompts | Level 0, 1, 2 | 1-2 weeks | Medium |
| 4 | Renewal, Cancellation, Expiry, Reactivation | Level 0, 1, 2, 3 | 1 week | Low |
| 5 | Plan Indicators, Usage Indicators, Emails, Celebrations | Level 0, 1, 2, 3, 4 | 1 week | Low |

**Total:** 4-6 weeks

---

## CRITICAL PATH

The critical path (longest dependency chain) is:

```
Pricing Config (30 min)
  ↓
API Middleware (2-3 hours)
  ↓
API Endpoint Protection (1-2 weeks) ← CRITICAL PATH BOTTLENECK
  ↓
Upgrade API (3-5 days)
  ↓
Trial Conversion (2-3 days)
```

**Critical Path Duration:** ~3 weeks

**Parallelizable Work:**
- Dashboard Progressive Discovery (parallel with API Protection)
- Trial Onboarding (parallel with API Protection)
- Pricing Page (parallel with API Protection)

**Optimization:** Start parallelizable work while API Protection is in progress

---

## IMPLEMENTATION SEQUENCE RECOMMENDATION

See `COMMERCIAL_IMPLEMENTATION_SEQUENCE.md` for recommended execution order that optimizes for:
- Dependency resolution
- Parallel work
- Risk mitigation
- Customer impact minimization

---

**Prepared By:** Engineering Architecture Review  
**Date:** 2026-07-03  
**Status:** Dependency mapping complete

---

**END OF DEPENDENCY MATRIX**
