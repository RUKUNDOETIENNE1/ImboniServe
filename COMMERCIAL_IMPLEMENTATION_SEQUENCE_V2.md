# COMMERCIAL_IMPLEMENTATION_SEQUENCE_V2

**Document:** Commercial Truth Implementation Sequence (Revised)  
**Date:** 2026-07-03  
**Purpose:** Define engineering execution sequence for revised milestone structure

---

## OVERVIEW

This document defines the recommended engineering execution sequence for Commercial Truth implementation, organized by the revised milestone structure. Technical dependencies remain unchanged—only milestone grouping has been improved.

**Key Principle:** Implement one business capability at a time, following the standard milestone process.

---

## STANDARD MILESTONE PROCESS

Every milestone follows this exact workflow:

```
1. Implementation
   ↓
2. Regression Testing
   ↓
3. Certification
   ↓
4. Founder Review
   ↓
5. Git Commit
   ↓
6. Git Push
   ↓
7. Repository Clean
   ↓
8. HARD STOP (await next milestone approval)
```

---

## ✅ MILESTONE 1: COMMERCIAL FOUNDATION (COMPLETE)

**Duration:** 1 day (actual)  
**Status:** ✅ Complete and certified

**Sequence:**
1. ✅ Update pricing configuration (`src/config/pricing.ts`)
2. ✅ Update entitlement definitions (`src/lib/plan-entitlements.ts`)
3. ✅ Remove legacy ESSENTIALS references (8 files)
4. ✅ Run build verification
5. ✅ Generate implementation report
6. ✅ Generate regression report
7. ✅ Generate certification
8. ✅ Git commit and push
9. ✅ HARD STOP

**Result:** Constitutional commercial configuration in place

---

## MILESTONE 2: COMMERCIAL ENFORCEMENT (BACKEND)

**Duration:** 2-3 weeks  
**Status:** ⏳ Awaiting Founder approval

### Week 1: Foundation & Migration

**Day 1 (Monday):**
- **Morning:** Database migration
  - Backup production database
  - Create migration script: `ESSENTIALS` → `STARTER`
  - Test migration in staging
  - Execute migration in production
  - Verify all users migrated successfully
  - **Effort:** 4-6 hours
  - **Test:** Query database, verify zero ESSENTIALS records

- **Afternoon:** Session extension
  - Add `planCode` to session callback
  - Add `trialEndDate` to session callback
  - Add `subscriptionStatus` to session callback
  - **Effort:** 1 hour
  - **Test:** Sign in, verify session includes plan data

**Day 2 (Tuesday):**
- **Morning:** API entitlement middleware creation
  - Create `src/lib/middleware/withFeatureCheck.ts`
  - Implement `requiresFeature()` function
  - Add trial detection logic
  - Add entitlement checking logic
  - Return 402 with upgrade info if locked
  - **Effort:** 2-3 hours
  - **Test:** Unit tests for middleware

- **Afternoon:** API endpoint protection (start)
  - Apply `requiresFeature()` to first 10 endpoints
  - Test each endpoint individually
  - **Effort:** 4 hours
  - **Test:** Integration tests for each endpoint

**Days 3-5 (Wed-Fri):**
- **Continue API endpoint protection**
  - Apply to 20-30 endpoints per day
  - Test each endpoint before moving to next
  - **Effort:** 6-8 hours/day
  - **Test:** Integration tests, manual testing

**End of Week 1:**
- ✅ Database migration complete
- ✅ Session extension complete
- ✅ API middleware created
- ✅ ~50-70 endpoints protected

---

### Week 2: API Protection Completion

**Days 6-10 (Mon-Fri):**
- **Continue API endpoint protection**
  - Complete remaining ~30-50 endpoints
  - Full integration test suite
  - E2E testing for critical flows
  - **Effort:** 6-8 hours/day
  - **Test:** Full test suite

**End of Week 2:**
- ✅ 100% of API endpoints protected
- ✅ All tests passing

---

### Week 3: Cleanup & Certification

**Day 11 (Monday):**
- **Feature flag cleanup**
  - Replace `advanced_analytics` with `hasAdvancedReports`
  - Replace `multi_branch` with `hasMultiBranchDashboard`
  - Replace `ai_menu_builder` with entitlement or remove
  - Replace `promotions_engine` with entitlement or remove
  - Remove all client-count gating logic
  - **Effort:** 6-8 hours
  - **Test:** Feature availability testing

**Day 12 (Tuesday):**
- **Pricing consistency validation**
  - Grep for hardcoded pricing values
  - Verify all pricing derives from config
  - Verify annual savings calculations
  - **Effort:** 2-3 hours
  - **Test:** Pricing verification

**Day 13 (Wednesday):**
- **Full regression testing**
  - Run full test suite
  - E2E testing for all flows
  - Manual testing for each plan tier
  - Performance testing
  - **Effort:** 6-8 hours

**Day 14 (Thursday):**
- **Generate deliverables**
  - COMMERCIAL_ENFORCEMENT_IMPLEMENTATION_REPORT.md
  - COMMERCIAL_ENFORCEMENT_REGRESSION_REPORT.md
  - COMMERCIAL_ENFORCEMENT_CERTIFICATION.md
  - COMMERCIAL_ENFORCEMENT_NEXT_STEPS.md
  - **Effort:** 4-6 hours

**Day 15 (Friday):**
- **Git commit and push**
  - Commit all changes
  - Push to release branch
  - Verify repository clean
  - **HARD STOP**

**End of Milestone 2:**
- ✅ Backend enforcement complete
- ✅ All deliverables generated
- ✅ Awaiting Founder review

---

## MILESTONE 3: PROGRESSIVE COMMERCIAL EXPERIENCE

**Duration:** 1-2 weeks  
**Status:** ⏳ Awaiting Milestone 2 completion

### Week 1: Progressive Discovery

**Day 1 (Monday):**
- **Navigation metadata**
  - Add `requiredFeature` to navigation items
  - Add `minPlan` to navigation items
  - Add `isAdminOnly` to navigation items
  - **Effort:** 2-3 hours
  - **Test:** Verify metadata correct

- **Progressive Discovery logic**
  - Implement visibility tiers (owned / next-tier / distant / admin)
  - Filter navigation based on subscription
  - **Effort:** 4-6 hours
  - **Test:** Manual testing for each plan tier

**Day 2 (Tuesday):**
- **"Grow Your Business" section**
  - Create `src/components/GrowYourBusinessSection.tsx`
  - Create upgrade prompt cards
  - Link to upgrade flow (placeholder for Milestone 5)
  - **Effort:** 6-8 hours
  - **Test:** Visual testing, manual testing

**Day 3 (Wednesday):**
- **Contextual upgrade prompts**
  - Create `src/components/ContextualUpgradePrompt.tsx`
  - Surface in relevant workflows
  - Supportive tone (not restrictive)
  - **Effort:** 6-8 hours
  - **Test:** Prompt display testing

**Day 4 (Thursday):**
- **Plan indicators**
  - Show current plan in topbar
  - Styling for each tier
  - **Effort:** 2-3 hours
  - **Test:** Visual testing

**Day 5 (Friday):**
- **Dashboard commercial awareness**
  - Update all dashboard components to respect entitlements
  - Gracefully handle locked features
  - **Effort:** 6-8 hours
  - **Test:** Manual testing for each plan tier

---

### Week 2: Testing & Certification

**Day 6 (Monday):**
- **Full regression testing**
  - Manual testing for each plan tier
  - Visual regression testing
  - Cross-browser testing
  - **Effort:** 6-8 hours

**Day 7 (Tuesday):**
- **User testing (optional but recommended)**
  - Test with real customers
  - Gather feedback
  - Adjust based on feedback
  - **Effort:** 4-6 hours

**Day 8 (Wednesday):**
- **Generate deliverables**
  - PROGRESSIVE_EXPERIENCE_IMPLEMENTATION_REPORT.md
  - PROGRESSIVE_EXPERIENCE_REGRESSION_REPORT.md
  - PROGRESSIVE_EXPERIENCE_CERTIFICATION.md
  - PROGRESSIVE_EXPERIENCE_NEXT_STEPS.md
  - **Effort:** 4-6 hours

**Day 9 (Thursday):**
- **Git commit and push**
  - Commit all changes
  - Push to release branch
  - Verify repository clean
  - **HARD STOP**

**End of Milestone 3:**
- ✅ Dashboard experience complete
- ✅ All deliverables generated
- ✅ Awaiting Founder review

---

## MILESTONE 4: GUIDED PROFESSIONAL TRIAL

**Duration:** 1-2 weeks  
**Status:** ⏳ Awaiting Milestone 2 completion

**Note:** Can run parallel with Milestone 3 if resources allow

### Week 1: Onboarding & Tracking

**Day 1 (Monday):**
- **Trial plan configuration**
  - Fix trial plan in signup (already done in M1)
  - Verify trial entitlements work (from M2 middleware)
  - **Effort:** 30 minutes
  - **Test:** Sign up, verify Professional entitlements

- **Progressive onboarding component**
  - Create `src/components/TrialOnboarding.tsx`
  - Implement Days 1-3 introduction
  - **Effort:** 6-8 hours
  - **Test:** Manual testing for Day 1-3

**Day 2 (Tuesday):**
- **Progressive onboarding (continued)**
  - Implement Days 4-7 introduction
  - Implement Days 8-11 introduction
  - Implement Days 12-14 introduction
  - **Effort:** 6-8 hours
  - **Test:** Manual testing for each phase

**Day 3 (Wednesday):**
- **Usage tracking service**
  - Create `src/lib/services/trial-analytics.ts`
  - Track features used
  - Track frequency of use
  - Track business patterns
  - Track team size
  - **Effort:** 6-8 hours
  - **Test:** Usage tracking verification

**Day 4 (Thursday):**
- **Recommendation engine**
  - Implement usage-based recommendation logic
  - Test various usage patterns
  - **Effort:** 4-6 hours
  - **Test:** Recommendation accuracy testing

**Day 5 (Friday):**
- **Trial conversion flow**
  - Create `src/components/TrialConversionPrompt.tsx`
  - Implement 7-day, 3-day, 1-day prompts
  - Implement expiry experience
  - **Effort:** 6-8 hours
  - **Test:** Conversion flow testing

---

### Week 2: Testing & Certification

**Day 6 (Monday):**
- **E2E trial flow testing**
  - Simulate full 14-day trial
  - Test all conversion prompts
  - Test recommendation engine
  - **Effort:** 6-8 hours

**Day 7 (Tuesday):**
- **Generate deliverables**
  - GUIDED_TRIAL_IMPLEMENTATION_REPORT.md
  - GUIDED_TRIAL_REGRESSION_REPORT.md
  - GUIDED_TRIAL_CERTIFICATION.md
  - GUIDED_TRIAL_NEXT_STEPS.md
  - **Effort:** 4-6 hours

**Day 8 (Wednesday):**
- **Git commit and push**
  - Commit all changes
  - Push to release branch
  - Verify repository clean
  - **HARD STOP**

**End of Milestone 4:**
- ✅ Guided trial complete
- ✅ All deliverables generated
- ✅ Awaiting Founder review

---

## MILESTONE 5: SUBSCRIPTION LIFECYCLE

**Duration:** 2-3 weeks  
**Status:** ⏳ Awaiting Milestone 3 completion

### Week 1: Upgrade & Downgrade

**Days 1-2 (Mon-Tue):**
- **Upgrade API**
  - Create `src/pages/api/subscriptions/upgrade.ts`
  - Implement proration calculation
  - Process payment
  - Update subscription
  - Update entitlements immediately
  - **Effort:** 12-16 hours
  - **Test:** Payment flow testing, proration verification

**Day 3 (Wednesday):**
- **Upgrade UI**
  - Create `src/components/UpgradeModal.tsx`
  - Show pricing comparison
  - Show proration amount
  - Handle payment flow
  - **Effort:** 6-8 hours
  - **Test:** Manual testing

**Days 4-5 (Thu-Fri):**
- **Downgrade API**
  - Create `src/pages/api/subscriptions/downgrade.ts`
  - Schedule downgrade for next cycle
  - Check data over limits
  - Return data retention warnings
  - **Effort:** 12-16 hours
  - **Test:** Data retention testing

---

### Week 2: Renewal, Cancellation, Expiry

**Day 6 (Monday):**
- **Downgrade UI**
  - Create `src/components/DowngradeModal.tsx`
  - Show data retention warnings
  - Allow user to select what to keep
  - **Effort:** 6-8 hours
  - **Test:** Manual testing

**Day 7 (Tuesday):**
- **Renewal flow**
  - Implement renewal reminders (7 days before)
  - Retry logic on payment failure
  - **Effort:** 4-6 hours
  - **Test:** Email delivery, retry logic

**Day 8 (Wednesday):**
- **Cancellation flow**
  - Create `src/components/CancellationFlow.tsx`
  - Create `src/pages/api/subscriptions/cancel.ts`
  - Retention flow
  - Capture cancellation reason
  - **Effort:** 6-8 hours
  - **Test:** Cancellation flow testing

**Day 9 (Thursday):**
- **Expiry handling**
  - Create `src/components/ExpiryWarning.tsx`
  - Grace period indicator
  - "Renew Now" CTA
  - **Effort:** 4-6 hours
  - **Test:** Warning display testing

**Day 10 (Friday):**
- **Reactivation flow**
  - Create `src/components/ReactivationPrompt.tsx`
  - Create `src/pages/api/subscriptions/reactivate.ts`
  - One-click reactivation
  - Data restoration
  - **Effort:** 4-6 hours
  - **Test:** Reactivation flow testing

---

### Week 3: Testing & Certification

**Day 11 (Monday):**
- **Full regression testing**
  - Payment processing testing
  - Data retention testing
  - Renewal testing
  - Cancellation testing
  - Expiry testing
  - Reactivation testing
  - **Effort:** 6-8 hours

**Day 12 (Tuesday):**
- **Generate deliverables**
  - SUBSCRIPTION_LIFECYCLE_IMPLEMENTATION_REPORT.md
  - SUBSCRIPTION_LIFECYCLE_REGRESSION_REPORT.md
  - SUBSCRIPTION_LIFECYCLE_CERTIFICATION.md
  - SUBSCRIPTION_LIFECYCLE_NEXT_STEPS.md
  - **Effort:** 4-6 hours

**Day 13 (Wednesday):**
- **Git commit and push**
  - Commit all changes
  - Push to release branch
  - Verify repository clean
  - **HARD STOP**

**End of Milestone 5:**
- ✅ Subscription lifecycle complete
- ✅ All deliverables generated
- ✅ Awaiting Founder review

---

## MILESTONE 6: COMMERCIAL POLISH & FINAL CERTIFICATION

**Duration:** 1-2 weeks  
**Status:** ⏳ Awaiting Milestone 5 completion

### Week 1: Polish Features

**Day 1 (Monday):**
- **Lifecycle emails**
  - Create email templates (7 types)
  - Test email delivery
  - **Effort:** 6-8 hours
  - **Test:** Email delivery testing

**Day 2 (Tuesday):**
- **Usage indicators**
  - QR codes: "5/5 used"
  - AI credits: "15/20 used this month"
  - Storage: "1.2 GB / 2 GB"
  - **Effort:** 4-6 hours
  - **Test:** Manual testing

**Day 3 (Wednesday):**
- **Celebration moments**
  - Welcome after upgrade
  - Feature unlock celebrations
  - Milestone celebrations
  - **Effort:** 4-6 hours
  - **Test:** Manual testing

**Day 4 (Thursday):**
- **Commercial analytics**
  - Track feature usage by plan tier
  - Track conversion rates
  - Alert on anomalies
  - **Effort:** 6-8 hours
  - **Test:** Analytics verification

**Day 5 (Friday):**
- **Final regression testing (start)**
  - Full regression test suite
  - E2E testing for all flows
  - **Effort:** 6-8 hours

---

### Week 2: Final Certification

**Day 6 (Monday):**
- **Final regression testing (continued)**
  - Manual testing for each plan tier
  - Performance testing
  - Security testing
  - **Effort:** 6-8 hours

**Day 7 (Tuesday):**
- **Final Commercial Truth Certification**
  - Comprehensive constitutional compliance audit
  - Verify all pricing matches Constitution
  - Verify all entitlements match Constitution
  - Verify no revenue leakage
  - **Effort:** 6-8 hours

**Day 8 (Wednesday):**
- **Generate deliverables**
  - COMMERCIAL_POLISH_IMPLEMENTATION_REPORT.md
  - COMMERCIAL_POLISH_REGRESSION_REPORT.md
  - COMMERCIAL_TRUTH_FINAL_CERTIFICATION.md
  - COMMERCIAL_TRUTH_COMPLETE.md (final summary)
  - **Effort:** 4-6 hours

**Day 9 (Thursday):**
- **Git commit and push**
  - Commit all changes
  - Push to release branch
  - Verify repository clean
  - **HARD STOP**

**End of Milestone 6:**
- ✅ Commercial Truth fully implemented
- ✅ Final certification complete
- ✅ Awaiting Founder final review

---

## PARALLEL EXECUTION OPPORTUNITIES

**Milestone 3 and Milestone 4 can run in parallel if resources allow:**

```
Milestone 2 (Backend Enforcement)
    ↓
    ├─→ Milestone 3 (Dashboard Experience) — Team A
    │       ↓
    │   Milestone 5 (Subscription Lifecycle)
    │
    └─→ Milestone 4 (Guided Trial) — Team B (parallel)
    
    ↓
Milestone 6 (Polish & Certification)
```

**Benefit:** Reduces total timeline by 1-2 weeks

**Requirement:** Two independent teams (frontend + backend)

---

## DEPLOYMENT STRATEGY

**Milestone 2 (Backend Enforcement):**
- Gradual rollout: 10% → 50% → 100%
- Monitor error rates, revenue metrics
- Rollback if error rate > 5%

**Milestone 3 (Dashboard Experience):**
- Gradual rollout: 10% → 50% → 100%
- Monitor customer confusion, upgrade CTR
- Rollback if confusion > 10%

**Milestone 4 (Guided Trial):**
- Deploy to all new trial users immediately
- Monitor trial completion, conversion rates

**Milestone 5 (Subscription Lifecycle):**
- Deploy to all users immediately
- Monitor upgrade/downgrade success rates

**Milestone 6 (Polish):**
- Deploy to all users immediately
- Monitor email delivery, analytics

---

## CRITICAL PATH

**Longest dependency chain:**

```
M1 (1 day) → M2 (2-3 weeks) → M3 (1-2 weeks) → M5 (2-3 weeks) → M6 (1-2 weeks)
```

**Total:** 6-8 weeks

**Optimization:** Run M4 parallel with M3 (saves 1-2 weeks)

---

## CONCLUSION

This sequence organizes Commercial Truth implementation into 6 focused milestones, each addressing one clear business capability. Technical dependencies remain unchanged—only milestone grouping has been improved for better Founder review and certification.

**Current Status:**
- ✅ Milestone 1 complete
- ⏳ Milestone 2 awaiting Founder approval

**Next Action:** Founder approval to begin Milestone 2

---

**Prepared By:** Engineering Architecture Review  
**Date:** 2026-07-03  
**Status:** Sequence refined and ready for execution

---

**END OF IMPLEMENTATION SEQUENCE V2**
