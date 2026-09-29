# COMMERCIAL_IMPLEMENTATION_CHECKLIST

**Document:** Commercial Constitution v1.1 Implementation Checklist  
**Date:** 2026-07-03  
**Purpose:** Detailed engineering checklist for Commercial Truth implementation

---

## HOW TO USE THIS CHECKLIST

**Format:** Each item is implementation-ready with no ambiguity

**Checkboxes:**
- [ ] Not started
- [~] In progress
- [x] Complete

**Testing:** Each item includes testing requirements

**Dependencies:** Listed where applicable

---

## WEEK 1: FOUNDATION

### Day 1 — Pricing Configuration

- [ ] **PRICING-001:** Update `src/config/pricing.ts`
  - [ ] Rename `code: 'ESSENTIALS'` → `code: 'STARTER'`
  - [ ] Rename `name: 'Essentials'` → `name: 'Starter'`
  - [ ] Update `monthlyPriceRWF: 12500` → `monthlyPriceRWF: 18750`
  - [ ] Update `annualMonthlyRWF: 10000` → `annualMonthlyRWF: 15000`
  - [ ] Update `annualTotalRWF: 120000` → `annualTotalRWF: 180000`
  - [ ] Update `description` to match Constitution
  - [ ] Update `features` array to match Constitution Section 6.2
  - [ ] **Test:** Run `npm test -- pricing.test.ts`
  - [ ] **Test:** Verify `getPlanByCode('STARTER')` returns correct plan
  - [ ] **Test:** Verify `calculateAnnualSavings()` returns 45,000 RWF for Starter

- [ ] **ENTITLEMENT-001:** Update `src/lib/plan-entitlements.ts`
  - [ ] Remove `case 'ESSENTIALS':` from `getPlanEntitlements()` switch statement
  - [ ] Keep only `case 'STARTER':` (remove alias)
  - [ ] Verify STARTER entitlements match Constitution Section 6.2
  - [ ] **Test:** Run `npm test -- plan-entitlements.test.ts`
  - [ ] **Test:** Verify `getPlanEntitlements('STARTER')` returns correct entitlements
  - [ ] **Test:** Verify `hasFeatureAccess('STARTER', 'hasReservations')` returns `false`
  - [ ] **Test:** Verify `hasFeatureAccess('PROFESSIONAL', 'hasReservations')` returns `true`

- [ ] **MIDDLEWARE-001:** Create `src/lib/middleware/withFeatureCheck.ts`
  - [ ] Create file with imports
  - [ ] Implement `requiresFeature()` function
  - [ ] Add session retrieval logic
  - [ ] Add business lookup logic
  - [ ] Add trial detection: `inTrial ? 'PROFESSIONAL' : planCode`
  - [ ] Add entitlement check: `hasFeatureAccess(planCode, feature)`
  - [ ] Return 402 with upgrade info if locked
  - [ ] Return 401 if unauthorized
  - [ ] Log access granted/denied for analytics
  - [ ] **Test:** Create `withFeatureCheck.test.ts`
  - [ ] **Test:** Mock session, business, verify Professional entitlements during trial
  - [ ] **Test:** Verify 402 response for locked features
  - [ ] **Test:** Verify handler called for unlocked features

- [ ] **SESSION-001:** Extend session with plan data
  - [ ] Update `src/pages/api/auth/[...nextauth].ts`
  - [ ] Add `planCode` to session callback
  - [ ] Add `trialEndDate` to session callback
  - [ ] Add `subscriptionStatus` to session callback
  - [ ] **Test:** Sign in and verify session includes plan data
  - [ ] **Test:** Verify trial users have `trialEndDate`
  - [ ] **Test:** Verify active subscribers have `subscriptionStatus: 'ACTIVE'`

---

### Days 2-5 — API Protection & Dashboard

- [ ] **API-001 to API-100:** Apply `requiresFeature()` to API endpoints
  - [ ] `/api/reservations` → `requiresFeature('hasReservations')`
  - [ ] `/api/inventory/alerts` → `requiresFeature('hasInventoryAlerts')`
  - [ ] `/api/procurement` → `requiresFeature('hasProcurementWorkflow')`
  - [ ] `/api/campaigns` → `requiresFeature('hasWhatsAppCampaigns')`
  - [ ] `/api/analytics/payments` → `requiresFeature('hasPaymentAnalytics')`
  - [ ] `/api/analytics/menu-performance` → `requiresFeature('hasMenuPerformance')`
  - [ ] `/api/analytics/qr` → `requiresFeature('hasQRAnalytics')`
  - [ ] `/api/staff` → `requiresFeature('hasStaffManagement')`
  - [ ] `/api/branches` → `requiresFeature('hasMultiBranchDashboard')`
  - [ ] `/api/ab-testing` → `requiresFeature('hasABTesting')`
  - [ ] ... (continue for all ~100 endpoints)
  - [ ] **Test:** Integration test for each endpoint
  - [ ] **Test:** Verify Starter user gets 402 for Professional features
  - [ ] **Test:** Verify Professional user gets 200 for Professional features
  - [ ] **Test:** Verify trial user gets 200 for Professional features

- [ ] **DASHBOARD-001:** Update `src/components/DashboardLayout.tsx`
  - [ ] Add `requiredFeature: string` to `V1NavigationItem` interface
  - [ ] Add `minPlan: PlanCode` to `V1NavigationItem` interface
  - [ ] Add `isAdminOnly: boolean` to `V1NavigationItem` interface
  - [ ] Add metadata to all navigation items
  - [ ] Implement Progressive Discovery logic
  - [ ] Filter navigation: owned / next-tier / distant / admin
  - [ ] **Test:** Manual testing for each plan tier
  - [ ] **Test:** Starter user sees only Starter features in main nav
  - [ ] **Test:** Starter user sees Professional features in "Grow Your Business"
  - [ ] **Test:** Starter user does NOT see Business/Premium/Enterprise features

- [ ] **DASHBOARD-002:** Create `src/components/GrowYourBusinessSection.tsx`
  - [ ] Create component file
  - [ ] Accept `nextTierFeatures` prop
  - [ ] Render upgrade prompt cards for each next-tier feature
  - [ ] Link to pricing page or upgrade modal
  - [ ] **Test:** Verify section appears for Starter users
  - [ ] **Test:** Verify section shows Professional features only
  - [ ] **Test:** Verify section does NOT appear for Premium users (no next tier)

- [ ] **PRICING-002:** Update `src/pages/pricing.tsx`
  - [ ] Update plan names (ESSENTIALS → STARTER)
  - [ ] Update pricing (12,500 → 15,000)
  - [ ] Add transparent annual savings presentation:
    - [ ] Show monthly price
    - [ ] Show regular annual value (monthly × 12)
    - [ ] Show discounted annual value
    - [ ] Show savings amount
  - [ ] Add standard language: "Pay annually and save 25% — equivalent to 3 free months"
  - [ ] **Test:** Visual regression testing
  - [ ] **Test:** Verify all pricing elements displayed
  - [ ] **Test:** Verify savings calculation correct

- [ ] **TRIAL-001:** Update `src/pages/api/auth/signup.ts`
  - [ ] Change `planCode: 'ESSENTIALS'` → `planCode: 'STARTER'`
  - [ ] Set `trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)`
  - [ ] **Test:** Sign up new user, verify plan is STARTER
  - [ ] **Test:** Verify trial end date is 14 days from now

- [ ] **TRIAL-002:** Create `src/components/TrialOnboarding.tsx`
  - [ ] Create component file
  - [ ] Implement progressive introduction logic (Days 1-3, 4-7, 8-11, 12-14)
  - [ ] Create onboarding prompts for each feature set
  - [ ] Track which features have been introduced
  - [ ] **Test:** Manual testing for each day of trial
  - [ ] **Test:** Verify Day 1 shows only core features
  - [ ] **Test:** Verify Day 7 shows growth features

- [ ] **TRIAL-003:** Create `src/lib/services/trial-analytics.ts`
  - [ ] Create service file
  - [ ] Implement usage tracking (features used, frequency)
  - [ ] Implement recommendation engine
  - [ ] **Test:** Unit tests for recommendation logic
  - [ ] **Test:** Verify Professional recommended if used reservations
  - [ ] **Test:** Verify Business recommended if explored multi-branch

---

## WEEK 2: ENFORCEMENT COMPLETION

- [ ] **API-101 to API-200:** Complete remaining API endpoint protection
  - [ ] Continue applying `requiresFeature()` to all commercial endpoints
  - [ ] **Test:** Full integration test suite
  - [ ] **Test:** E2E testing for critical flows

- [ ] **FEATURE-FLAG-001:** Clean up commercial feature flags
  - [ ] Identify all feature flags used for commercial gating
  - [ ] Replace `advanced_analytics` (10 clients) with `hasAdvancedReports` entitlement
  - [ ] Replace `multi_branch` (15 clients) with `hasMultiBranchDashboard` entitlement
  - [ ] Replace `ai_menu_builder` (20 clients) with entitlement or remove
  - [ ] Replace `promotions_engine` (25 clients) with entitlement or remove
  - [ ] Remove client-count gating logic
  - [ ] **Test:** Feature availability testing for each plan tier
  - [ ] **Test:** Verify no client-count checks remain

---

## WEEK 3: LIFECYCLE FLOWS

- [ ] **UPGRADE-001:** Create `src/pages/api/subscriptions/upgrade.ts`
  - [ ] Create API endpoint
  - [ ] Implement proration calculation
  - [ ] Process payment
  - [ ] Update subscription record
  - [ ] Update entitlements immediately
  - [ ] Send confirmation email
  - [ ] **Test:** Unit tests for proration logic
  - [ ] **Test:** Integration test with payment provider
  - [ ] **Test:** Verify entitlements update immediately

- [ ] **UPGRADE-002:** Create `src/components/UpgradeModal.tsx`
  - [ ] Create modal component
  - [ ] Show pricing comparison
  - [ ] Show proration amount
  - [ ] Show "Upgrade Now" CTA
  - [ ] Handle payment flow
  - [ ] **Test:** Manual testing for upgrade flow
  - [ ] **Test:** Verify modal displays correct pricing

- [ ] **DOWNGRADE-001:** Create `src/pages/api/subscriptions/downgrade.ts`
  - [ ] Create API endpoint
  - [ ] Schedule downgrade for next billing cycle
  - [ ] Check data over new limits
  - [ ] Return data retention warnings
  - [ ] **Test:** Unit tests for scheduling logic
  - [ ] **Test:** Verify downgrade scheduled (not immediate)
  - [ ] **Test:** Verify data warnings returned

- [ ] **DOWNGRADE-002:** Create `src/components/DowngradeModal.tsx`
  - [ ] Create modal component
  - [ ] Show data retention warnings
  - [ ] Allow user to select what to keep
  - [ ] Show "Schedule Downgrade" CTA
  - [ ] **Test:** Manual testing for downgrade flow
  - [ ] **Test:** Verify data selection works

- [ ] **TRIAL-CONVERSION-001:** Create `src/components/TrialConversionPrompt.tsx`
  - [ ] Create component for 7-day, 3-day, 1-day prompts
  - [ ] Show usage summary
  - [ ] Show recommended plan (not all plans)
  - [ ] Show "Subscribe to [Plan]" CTA
  - [ ] **Test:** Manual testing for each prompt
  - [ ] **Test:** Verify recommended plan displayed

- [ ] **CONTEXTUAL-001:** Create `src/components/ContextualUpgradePrompt.tsx`
  - [ ] Create prompt component
  - [ ] Surface in relevant workflows
  - [ ] Supportive tone (not restrictive)
  - [ ] **Test:** Manual testing in workflows
  - [ ] **Test:** Verify prompts appear contextually

---

## WEEK 4-5: LIFECYCLE MANAGEMENT

- [ ] **RENEWAL-001:** Implement renewal reminders
  - [ ] Create scheduled job (7 days before renewal)
  - [ ] Send email with amount, date, payment method
  - [ ] Implement retry logic on payment failure
  - [ ] **Test:** Email delivery testing
  - [ ] **Test:** Retry logic testing

- [ ] **CANCEL-001:** Create `src/components/CancellationFlow.tsx`
  - [ ] Create cancellation UI
  - [ ] Retention flow: "What can we do to keep you?"
  - [ ] Offer discount or downgrade
  - [ ] Capture cancellation reason
  - [ ] Schedule cancellation for end of cycle
  - [ ] **Test:** E2E cancellation flow testing

- [ ] **EXPIRY-001:** Create `src/components/ExpiryWarning.tsx`
  - [ ] Show warning approaching expiry
  - [ ] Grace period indicator
  - [ ] "Renew Now" CTA
  - [ ] **Test:** Manual testing for warning display

- [ ] **REACTIVATE-001:** Create `src/pages/api/subscriptions/reactivate.ts`
  - [ ] Create reactivation API
  - [ ] One-click reactivation
  - [ ] Restore data (if within 90 days)
  - [ ] **Test:** Reactivation flow testing

---

## WEEK 6: POLISH

- [ ] **POLISH-001:** Add plan indicators
  - [ ] Show current plan in topbar
  - [ ] Style for each tier (blue, purple, orange, gold, custom)
  - [ ] **Test:** Visual testing for each tier

- [ ] **POLISH-002:** Add usage indicators
  - [ ] QR codes: "5/5 used"
  - [ ] AI credits: "15/20 used this month"
  - [ ] Storage: "1.2 GB / 2 GB"
  - [ ] **Test:** Manual testing for indicators

- [ ] **POLISH-003:** Create lifecycle emails
  - [ ] Welcome email (trial activation)
  - [ ] Trial conversion reminders
  - [ ] Upgrade confirmation
  - [ ] Downgrade confirmation
  - [ ] Renewal confirmation
  - [ ] Cancellation confirmation
  - [ ] Reactivation confirmation
  - [ ] **Test:** Email template testing

- [ ] **POLISH-004:** Add celebration moments
  - [ ] Welcome after upgrade
  - [ ] Feature unlock celebration
  - [ ] Milestone celebrations
  - [ ] **Test:** Manual testing for celebrations

---

## FINAL VERIFICATION

- [ ] **VERIFY-001:** Full regression testing
  - [ ] Run full test suite
  - [ ] E2E testing for all critical flows
  - [ ] Manual testing for each plan tier

- [ ] **VERIFY-002:** Commercial Truth audit
  - [ ] Verify pricing matches Constitution
  - [ ] Verify entitlements match Constitution
  - [ ] Verify dashboard visibility matches Constitution
  - [ ] Verify trial policy matches Constitution
  - [ ] Verify lifecycle behavior matches Constitution

- [ ] **VERIFY-003:** Production readiness
  - [ ] All tests passing
  - [ ] No critical bugs
  - [ ] Performance acceptable
  - [ ] Monitoring in place
  - [ ] Rollback plan ready

---

## DEPLOYMENT

- [ ] **DEPLOY-001:** Staging deployment
  - [ ] Deploy to staging
  - [ ] Full testing in staging
  - [ ] Founder review

- [ ] **DEPLOY-002:** Production deployment (gradual)
  - [ ] Deploy to 10% of users
  - [ ] Monitor metrics for 24 hours
  - [ ] Deploy to 50% of users
  - [ ] Monitor metrics for 24 hours
  - [ ] Deploy to 100% of users

- [ ] **DEPLOY-003:** Post-deployment verification
  - [ ] Verify all features working
  - [ ] Monitor error rates
  - [ ] Monitor revenue metrics
  - [ ] Address any issues

---

**Total Checklist Items:** 100+  
**Estimated Completion:** 4-6 weeks

**Prepared By:** Engineering Architecture Review  
**Date:** 2026-07-03  
**Status:** Implementation checklist ready

---

**END OF IMPLEMENTATION CHECKLIST**
