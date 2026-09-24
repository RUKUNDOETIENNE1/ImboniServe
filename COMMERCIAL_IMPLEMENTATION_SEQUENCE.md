# COMMERCIAL_IMPLEMENTATION_SEQUENCE

**Document:** Recommended Implementation Order  
**Date:** 2026-07-03  
**Purpose:** Define safest engineering execution sequence for Commercial Constitution v1.1

---

## EXECUTIVE SUMMARY

**Recommended Timeline:** 4-6 weeks

**Strategy:** Dependency-first with parallel execution where safe

**Optimization:** Minimize regressions, merge conflicts, and customer impact

---

## WEEK 1: FOUNDATION & CORE SYSTEMS

### Day 1 (Monday)

**Morning:**
- ✅ Update Pricing Configuration (`src/config/pricing.ts`)
  - Rename ESSENTIALS → STARTER
  - Update pricing: 12,500 → 18,750 (monthly), 10,000 → 15,000 (annual monthly)
  - Update feature lists
  - **Effort:** 30 minutes
  - **Test:** Unit tests for pricing calculations

- ✅ Update Plan Entitlement Definitions (`src/lib/plan-entitlements.ts`)
  - Remove ESSENTIALS alias
  - Update STARTER entitlements
  - **Effort:** 1 hour
  - **Test:** Unit tests for entitlement mapping

**Afternoon:**
- ✅ Create API Entitlement Middleware (`src/lib/middleware/withFeatureCheck.ts`)
  - Implement `requiresFeature()` middleware
  - Trial detection (grant Professional entitlements)
  - **Effort:** 2-3 hours
  - **Test:** Unit tests for middleware logic

- ✅ Extend Session with Plan Data
  - Add `planCode`, `trialEndDate`, `subscriptionStatus` to session
  - **Effort:** 1 hour
  - **Test:** Verify session serialization

**End of Day 1:** Foundation complete, ready for parallel work

---

### Days 2-5 (Tuesday-Friday)

**Parallel Track A: API Protection (High Priority)**
- Apply `requiresFeature()` to ~100 API endpoints
- **Effort:** 4 days (25 endpoints/day)
- **Test:** Integration tests for each endpoint
- **Risk Mitigation:** Test each endpoint before moving to next

**Parallel Track B: Dashboard Progressive Discovery**
- Add metadata to navigation items
- Implement Progressive Discovery logic
- Create "Grow Your Business" section
- **Effort:** 2-3 days
- **Test:** Manual testing for each plan tier

**Parallel Track C: Pricing Page Update**
- Update plan names and pricing
- Add transparent annual savings presentation
- **Effort:** 2-3 hours
- **Test:** Visual regression testing

**Parallel Track D: Trial Onboarding System**
- Fix trial plan in signup
- Create progressive onboarding component
- Implement usage tracking
- **Effort:** 3-4 days
- **Test:** E2E trial flow testing

**End of Week 1:**
- ✅ Foundation complete
- ✅ API Protection: 50% complete (~50 endpoints)
- ✅ Dashboard Progressive Discovery: 80% complete
- ✅ Pricing Page: Complete
- ✅ Trial Onboarding: 60% complete

---

## WEEK 2: ENFORCEMENT & DISCOVERY COMPLETION

### Days 6-10 (Monday-Friday)

**Continue Parallel Track A: API Protection**
- Complete remaining ~50 endpoints
- **Effort:** 2-3 days
- **Test:** Full integration test suite

**Continue Parallel Track D: Trial Onboarding**
- Complete usage tracking service
- Implement recommendation engine
- **Effort:** 1-2 days
- **Test:** Usage tracking verification

**New Track E: Feature Flag Cleanup**
- Replace commercial feature flags with entitlement checks
- Remove client-count gating
- **Effort:** 1-2 days
- **Dependencies:** API Protection must be complete
- **Test:** Feature availability testing

**End of Week 2:**
- ✅ API Protection: Complete (~100 endpoints)
- ✅ Dashboard Progressive Discovery: Complete
- ✅ Trial Onboarding: Complete
- ✅ Feature Flag Cleanup: Complete

---

## WEEK 3: LIFECYCLE FLOWS

### Days 11-15 (Monday-Friday)

**Track F: Upgrade API & UI**
- Create upgrade API with proration
- Create upgrade UI modal
- Add "Upgrade" button
- **Effort:** 3-4 days
- **Test:** Payment flow testing, proration verification

**Track G: Downgrade API & UI**
- Create downgrade API (scheduled)
- Create downgrade UI with data retention warnings
- **Effort:** 3-4 days
- **Test:** Data retention logic testing

**Track H: Trial Conversion Flow**
- Implement usage-based recommendations
- Create conversion prompts (7, 3, 1 day)
- Email reminders
- **Effort:** 2-3 days
- **Test:** Conversion flow E2E testing

**Track I: Contextual Upgrade Prompts**
- Create contextual prompt component
- Surface in relevant workflows
- **Effort:** 1-2 days
- **Test:** Prompt display testing

**End of Week 3:**
- ✅ Upgrade API & UI: Complete
- ✅ Downgrade API & UI: Complete
- ✅ Trial Conversion: Complete
- ✅ Contextual Prompts: Complete

---

## WEEK 4-5: LIFECYCLE MANAGEMENT

### Days 16-25 (Monday-Friday, 2 weeks)

**Track J: Renewal Reminders**
- Email 7 days before renewal
- Retry logic on payment failure
- **Effort:** 1-2 days
- **Test:** Email delivery, retry logic

**Track K: Cancellation UI**
- Create cancellation flow
- Retention flow
- Capture cancellation reason
- **Effort:** 2-3 days
- **Test:** Cancellation flow E2E

**Track L: Expiry Warnings**
- Show warning approaching expiry
- Grace period indicator
- **Effort:** 1 day
- **Test:** Warning display

**Track M: Reactivation Flow**
- "Reactivate" button for expired subscriptions
- One-click reactivation
- Data restoration
- **Effort:** 1-2 days
- **Test:** Reactivation flow

**End of Week 4-5:**
- ✅ All P0 and P1 features complete
- ✅ Commercial Truth fully enforced
- ✅ Ready for polish phase

---

## WEEK 6: POLISH & VERIFICATION

### Days 26-30 (Monday-Friday)

**Track N: Plan Indicators**
- Show current plan in topbar
- Styling for each tier
- **Effort:** 2-3 hours

**Track O: Usage Indicators**
- QR codes, AI credits, storage indicators
- Upgrade prompts at limits
- **Effort:** 1-2 days

**Track P: Lifecycle Emails**
- Welcome, conversion, upgrade, downgrade, renewal, cancellation, reactivation emails
- **Effort:** 2-3 days

**Track Q: Celebration Moments**
- Welcome after upgrade
- Feature unlock celebrations
- Milestone celebrations
- **Effort:** 1-2 days

**Track R: Final Verification**
- Full regression testing
- Manual testing for all plan tiers
- Commercial Truth audit
- **Effort:** 2-3 days

**End of Week 6:**
- ✅ All features complete (P0, P1, P2)
- ✅ Full Commercial Truth compliance
- ✅ Ready for production deployment

---

## PARALLEL EXECUTION STRATEGY

**Weeks 1-2:**
- API Protection (Track A) — High priority, sequential
- Dashboard Discovery (Track B) — Parallel with A
- Pricing Page (Track C) — Parallel with A
- Trial Onboarding (Track D) — Parallel with A

**Week 3:**
- Upgrade/Downgrade (Tracks F, G) — Parallel with each other
- Trial Conversion (Track H) — Parallel with F, G
- Contextual Prompts (Track I) — Parallel with F, G, H

**Weeks 4-5:**
- Renewal/Cancellation/Expiry/Reactivation (Tracks J, K, L, M) — All parallel

**Week 6:**
- Polish (Tracks N, O, P, Q) — All parallel
- Final Verification (Track R) — Sequential at end

---

## RISK MITIGATION SEQUENCE

**High-Risk Items (Do First):**
1. API Protection (~100 endpoints) — Week 1-2
2. Upgrade/Downgrade APIs — Week 3

**Medium-Risk Items (Do Second):**
3. Dashboard Progressive Discovery — Week 1
4. Trial Onboarding — Week 1-2
5. Feature Flag Cleanup — Week 2

**Low-Risk Items (Do Last):**
6. Polish features — Week 6

---

## TESTING SEQUENCE

**After Each Day:**
- Unit tests for code written that day
- Integration tests for completed features

**After Each Week:**
- Full regression test suite
- Manual testing for affected areas
- Commercial Truth spot check

**After Week 3 (P0 Complete):**
- Full E2E testing
- Commercial Truth comprehensive audit
- User acceptance testing

**After Week 6 (All Complete):**
- Final regression testing
- Commercial Truth certification
- Production readiness review

---

## DEPLOYMENT STRATEGY

**Option A: Big Bang (Not Recommended)**
- Deploy all changes at once after Week 6
- **Risk:** High (all changes at once)

**Option B: Incremental (Recommended)**
- Week 2: Deploy API Protection + Dashboard Discovery (behind feature flag)
- Week 3: Deploy Upgrade/Downgrade + Trial Conversion
- Week 5: Deploy Lifecycle Management
- Week 6: Deploy Polish + Remove feature flags
- **Risk:** Low (gradual rollout)

**Option C: Gradual Rollout (Most Conservative)**
- Deploy to 10% of users after Week 3
- Monitor metrics and errors
- Increase to 50% after Week 4
- Increase to 100% after Week 5
- **Risk:** Lowest (controlled rollout)

**Recommendation:** Option B (Incremental) or Option C (Gradual Rollout)

---

## SUCCESS CRITERIA BY WEEK

**Week 1:**
- ✅ Pricing configuration updated
- ✅ API middleware created
- ✅ 50% of API endpoints protected

**Week 2:**
- ✅ 100% of API endpoints protected
- ✅ Dashboard Progressive Discovery complete
- ✅ Trial onboarding complete

**Week 3:**
- ✅ Upgrade/downgrade flows complete
- ✅ Trial conversion complete
- ✅ P0 features complete

**Week 4-5:**
- ✅ All lifecycle management complete
- ✅ P1 features complete

**Week 6:**
- ✅ All polish complete
- ✅ P2 features complete
- ✅ Commercial Truth fully enforced

---

## ROLLBACK PLAN

**If Critical Issues Arise:**

**Week 1-2:** Rollback API Protection via feature flag  
**Week 3:** Rollback Upgrade/Downgrade APIs  
**Week 4-5:** Rollback individual lifecycle features  
**Week 6:** Rollback polish features

**Rollback Triggers:**
- Error rate > 5%
- Revenue drop > 20%
- Customer complaints > 10/day
- Founder decision

---

**Prepared By:** Engineering Architecture Review  
**Date:** 2026-07-03  
**Status:** Recommended sequence for implementation

---

**END OF IMPLEMENTATION SEQUENCE**
