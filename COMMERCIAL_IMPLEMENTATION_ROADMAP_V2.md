# COMMERCIAL_IMPLEMENTATION_ROADMAP_V2

**Document:** Commercial Truth Implementation Roadmap (Revised)  
**Date:** 2026-07-03  
**Constitution Version:** v1.1 (Founder Approved)  
**Purpose:** Organize Commercial Truth implementation by business capability

---

## EXECUTIVE SUMMARY

This roadmap organizes the Commercial Constitution v1.1 implementation into 6 focused milestones, each addressing one clear business capability. Every milestone follows the same disciplined process: Implementation → Testing → Certification → Founder Review → HARD STOP.

**Total Timeline:** 6-8 weeks  
**Milestone 1 Status:** ✅ Complete (Commercial Foundation)  
**Remaining Milestones:** 5 (each awaits Founder approval before starting)

---

## MILESTONE ORGANIZATION PRINCIPLE

**Every milestone answers one simple question:**

- **Milestone 1:** Is the commercial configuration constitutionally correct?
- **Milestone 2:** Does the backend enforce what customers paid for?
- **Milestone 3:** Does the dashboard communicate commercial truth clearly?
- **Milestone 4:** Does the trial deliver the approved guided experience?
- **Milestone 5:** Are subscription lifecycle changes transparent and correct?
- **Milestone 6:** Is Commercial Truth fully implemented and certified?

**If a milestone requires multiple unrelated answers, it's too broad.**

---

## ✅ MILESTONE 1: COMMERCIAL FOUNDATION (COMPLETE)

### Purpose
Establish constitutional commercial configuration.

### Business Question
**"Is the commercial configuration constitutionally correct?"**

### Scope
- ✅ Official commercial plans (STARTER, PROFESSIONAL, BUSINESS, PREMIUM, ENTERPRISE)
- ✅ Pricing configuration (15K, 35K, 75K, 200K, Custom)
- ✅ Canonical pricing model (RWF base currency)
- ✅ Annual billing structure (25% savings = 3 free months)
- ✅ Entitlement alignment (60 entitlements mapped to plans)
- ✅ Legacy commercial cleanup (removed all ESSENTIALS references)

### What Was NOT Included
- ❌ Customer-facing enforcement
- ❌ Dashboard visibility changes
- ❌ API enforcement
- ❌ Trial implementation

### Dependencies
None (foundational work)

### Estimated Effort
✅ **Actual:** 1 day

### Success Criteria
- ✅ Pricing matches Constitution exactly
- ✅ Entitlements match Constitution exactly
- ✅ Plan naming matches Constitution exactly
- ✅ Build successful
- ✅ No regressions

### Certification Criteria
- ✅ Constitutional compliance: 100%
- ✅ Regression-free: Yes
- ✅ Production-ready: Yes

### Status
✅ **COMPLETE** — Certified and approved

### Deliverables
- ✅ COMMERCIAL_FOUNDATION_IMPLEMENTATION_REPORT.md
- ✅ COMMERCIAL_REGRESSION_REPORT.md
- ✅ COMMERCIAL_FOUNDATION_CERTIFICATION.md
- ✅ COMMERCIAL_FOUNDATION_NEXT_STEPS.md

### Git Commit
✅ `d59a769` — Pushed to `release/v1.0.0-rc1`

---

## MILESTONE 2: COMMERCIAL ENFORCEMENT (BACKEND)

### Purpose
Make Commercial Truth technically enforceable at the API layer.

### Business Question
**"Does the backend enforce what customers paid for?"**

### Scope

#### 1. Database Migration
- Migrate existing `plan.code = 'ESSENTIALS'` → `plan.code = 'STARTER'`
- Verify all users migrated successfully
- Test entitlement checks for migrated users

#### 2. API Entitlement Middleware
- Create `src/lib/middleware/withFeatureCheck.ts`
- Implement `requiresFeature()` middleware
- Add trial detection (grant Professional entitlements during trial)
- Return 402 with upgrade info if feature locked
- Add logging for commercial analytics

#### 3. API Endpoint Protection
- Apply `requiresFeature()` to ~100 commercial API endpoints
- Test each endpoint individually
- Verify Starter users get 402 for Professional features
- Verify Professional users get 200 for Professional features
- Verify trial users get 200 for Professional features

#### 4. Session Extension
- Add `planCode` to session
- Add `trialEndDate` to session
- Add `subscriptionStatus` to session

#### 5. Commercial Feature Flag Cleanup
- Replace `advanced_analytics` (10 clients) with `hasAdvancedReports` entitlement
- Replace `multi_branch` (15 clients) with `hasMultiBranchDashboard` entitlement
- Replace `ai_menu_builder` (20 clients) with entitlement or remove
- Replace `promotions_engine` (25 clients) with entitlement or remove
- Remove all client-count gating logic

#### 6. Pricing Consistency Validation
- Verify no hardcoded pricing values remain
- Verify all pricing derives from `src/config/pricing.ts`
- Verify annual savings calculations correct

### What Is NOT Included
- ❌ Dashboard visibility changes (Milestone 3)
- ❌ Progressive Commercial Discovery (Milestone 3)
- ❌ Contextual upgrade prompts (Milestone 3)
- ❌ Trial onboarding (Milestone 4)
- ❌ Upgrade/downgrade UI (Milestone 5)

### Dependencies
- ✅ Milestone 1 complete (pricing configuration ready)

### Estimated Effort
**2-3 weeks**

**Breakdown:**
- Database migration: 1 day
- API middleware creation: 2-3 hours
- API endpoint protection: 1-2 weeks (10-20 endpoints/day)
- Session extension: 1 hour
- Feature flag cleanup: 1-2 days
- Pricing validation: 2-3 hours

### Success Criteria
- Database migration: 100% of ESSENTIALS users migrated to STARTER
- API enforcement: 100% of commercial endpoints protected
- Session data: Plan information available in all requests
- Feature flags: Zero client-count thresholds for commercial gating
- Pricing: Zero hardcoded pricing values
- Regression: No breaking changes

### Certification Criteria
- **Backend Enforcement:** Every API endpoint enforces entitlements correctly
- **Trial Handling:** Trial users receive Professional entitlements
- **Error Responses:** Locked features return 402 with upgrade information
- **Commercial Analytics:** All entitlement checks logged
- **Regression-Free:** Build successful, no breaking changes

### Review Goal
**"Every API returns only what the customer's subscription allows."**

### Deliverables (Required)
- COMMERCIAL_ENFORCEMENT_IMPLEMENTATION_REPORT.md
- COMMERCIAL_ENFORCEMENT_REGRESSION_REPORT.md
- COMMERCIAL_ENFORCEMENT_CERTIFICATION.md
- COMMERCIAL_ENFORCEMENT_NEXT_STEPS.md

### Deployment Strategy
**Gradual Rollout:**
- Phase 1: 10% of users (monitor 24 hours)
- Phase 2: 50% of users (monitor 24 hours)
- Phase 3: 100% of users

**Rollback Criteria:**
- Error rate > 5%
- Revenue drop > 20%
- Customer complaints > 10/day

### Risks
- **RISK-001:** API endpoint protection breaks functionality (Medium probability, High impact)
- **RISK-002:** Revenue leakage during transition (Medium probability, High impact)
- **RISK-003:** Database migration failures (Low probability, High impact)

### Status
⏳ **PENDING** — Awaiting Founder approval to begin

---

## MILESTONE 3: PROGRESSIVE COMMERCIAL EXPERIENCE

### Purpose
Expose Commercial Truth through the dashboard experience.

### Business Question
**"Does the dashboard clearly communicate what the customer owns, what they can grow into, and why?"**

### Scope

#### 1. Progressive Commercial Discovery
- Implement visibility tiers: Owned / Next-Tier / Distant / Administrative
- Show owned features in main navigation
- Expose next-tier features in "Grow Your Business" section
- Hide distant features completely
- Never use admin functionality for upgrade marketing

#### 2. Navigation Visibility
- Add `requiredFeature` and `minPlan` metadata to navigation items
- Filter navigation based on subscription
- Implement tier-based visibility logic

#### 3. "Grow Your Business" Section
- Create dedicated section for next-tier features
- Show upgrade prompt cards for discoverable features
- Link to upgrade flow (when implemented in Milestone 5)

#### 4. Contextual Upgrade Prompts
- Surface upgrade prompts inside relevant workflows
- Supportive tone (not restrictive)
- Examples:
  - "Unlock Reservations in Professional" (in Tables workflow)
  - "Growing to multiple locations? Upgrade to Business" (approaching branch limit)

#### 5. Plan Indicators
- Show current plan in topbar badge
- Styling for each tier:
  - Starter: Blue
  - Professional: Purple
  - Business: Orange
  - Premium: Gold with crown icon
  - Enterprise: Custom branding

#### 6. Dashboard Commercial Awareness
- Respect entitlements in all dashboard components
- Show features customer owns
- Gracefully handle locked features
- Never show "access denied" messages

### What Is NOT Included
- ❌ API enforcement (Milestone 2 — must be complete first)
- ❌ Trial onboarding (Milestone 4)
- ❌ Upgrade/downgrade flows (Milestone 5)
- ❌ Usage indicators (Milestone 6)

### Dependencies
- ✅ Milestone 1 complete (pricing configuration ready)
- ✅ Milestone 2 complete (API enforcement in place)

**Critical:** API enforcement MUST be complete before dashboard changes. Otherwise, dashboard may hide features that are still accessible via API (revenue leakage).

### Estimated Effort
**1-2 weeks**

**Breakdown:**
- Progressive Discovery logic: 2-3 days
- Navigation visibility: 1-2 days
- "Grow Your Business" section: 1-2 days
- Contextual upgrade prompts: 1-2 days
- Plan indicators: 2-3 hours
- Dashboard awareness: 2-3 days

### Success Criteria
- Progressive Discovery: Customers see owned features, next-tier features, no distant features
- Navigation: Subscription-aware filtering works correctly
- "Grow Your Business": Next-tier features displayed with upgrade prompts
- Contextual Prompts: Appear in relevant workflows with supportive tone
- Plan Indicators: Current plan visible in topbar
- Dashboard: All components respect entitlements

### Certification Criteria
- **Customer Clarity:** Dashboard clearly communicates owned vs. next-tier features
- **No Confusion:** Customers understand why they see certain features
- **Supportive Tone:** Upgrade prompts are helpful, not restrictive
- **Visual Hierarchy:** Clear distinction between owned and discoverable features
- **Regression-Free:** No breaking changes

### Review Goal
**"The dashboard clearly communicates what the customer owns, what they can grow into, and why."**

### Deliverables (Required)
- PROGRESSIVE_EXPERIENCE_IMPLEMENTATION_REPORT.md
- PROGRESSIVE_EXPERIENCE_REGRESSION_REPORT.md
- PROGRESSIVE_EXPERIENCE_CERTIFICATION.md
- PROGRESSIVE_EXPERIENCE_NEXT_STEPS.md

### Testing Requirements
- Manual testing for each plan tier (Starter, Professional, Business, Premium, Enterprise)
- User testing with real customers (optional but recommended)
- Visual regression testing
- Cross-browser testing

### Risks
- **RISK-004:** Dashboard visibility confusion (Low probability, High impact)
- **RISK-005:** Upgrade prompts feel restrictive (Low probability, Medium impact)

### Status
⏳ **PENDING** — Awaiting Milestone 2 completion and Founder approval

---

## MILESTONE 4: GUIDED PROFESSIONAL TRIAL

### Purpose
Deliver the approved trial philosophy: guided learning journey with usage-based recommendations.

### Business Question
**"Does the trial deliver the approved guided experience?"**

### Scope

#### 1. Trial Plan Configuration
- Fix trial plan in signup: Default to `STARTER` (post-trial plan)
- Set trial duration: 14 days
- Grant Professional entitlements during trial (via Milestone 2 middleware)

#### 2. Progressive Onboarding
- Create `src/components/TrialOnboarding.tsx`
- Implement progressive introduction timeline:
  - **Days 1-3:** Core Operations (orders, tables, menu, inventory, payments)
  - **Days 4-7:** Growth Features (reservations, staff, inventory alerts)
  - **Days 8-11:** Analytics (payment analytics, menu performance, peak hours)
  - **Days 12-14:** Marketing (WhatsApp campaigns, QR Builder, Site Builder)
- Track which features have been introduced
- Show onboarding prompts for newly introduced features

#### 3. Usage Tracking
- Create `src/lib/services/trial-analytics.ts`
- Track features used during trial
- Track frequency of use
- Track business patterns (single vs. multi-location intent)
- Track team size (staff added)

#### 4. Recommendation Engine
- Implement usage-based recommendation logic
- Examples:
  - Used reservations or staff → Recommend Professional
  - Explored multi-branch or team > 5 → Recommend Business
  - Used AI or optimization → Recommend Premium
  - Default → Recommend Starter

#### 5. Trial Conversion Flow
- Create `src/components/TrialConversionPrompt.tsx`
- Implement conversion prompts:
  - **7 days before expiry:** Usage summary + recommended plan
  - **3 days before expiry:** Personalized recommendation with pricing
  - **1 day before expiry:** One-click subscribe to recommended plan
  - **On expiry:** Show recommended plan (not all plans)
- Email reminders at each milestone

#### 6. Trial Expiration Experience
- Show "Your trial has ended" message
- Display recommended plan based on usage
- Primary CTA: "Subscribe to [Recommended Plan]"
- Secondary CTA: "View all plans"

### What Is NOT Included
- ❌ Upgrade/downgrade flows (Milestone 5)
- ❌ Renewal reminders (Milestone 5)
- ❌ Lifecycle emails (Milestone 6)

### Dependencies
- ✅ Milestone 1 complete (pricing configuration ready)
- ✅ Milestone 2 complete (trial entitlements enforced via middleware)

**Critical:** Trial entitlement enforcement (Professional features during trial) must be implemented in Milestone 2 before trial onboarding begins.

### Estimated Effort
**1-2 weeks**

**Breakdown:**
- Trial plan configuration: 5 minutes
- Progressive onboarding: 3-5 days
- Usage tracking: 2-3 days
- Recommendation engine: 1-2 days
- Trial conversion flow: 2-3 days
- Trial expiration experience: 1 day

### Success Criteria
- Trial Plan: New signups default to STARTER (post-trial)
- Progressive Onboarding: Features introduced progressively over 14 days
- Usage Tracking: All trial usage captured accurately
- Recommendation Engine: Recommends correct plan based on usage
- Trial Conversion: Conversion prompts appear at correct times
- Trial Expiration: Recommended plan displayed (not all plans)

### Certification Criteria
- **Guided Experience:** Trial users experience progressive introduction
- **Usage-Based Recommendations:** Plan recommendations match actual usage
- **Conversion Clarity:** Trial users understand recommended plan and why
- **Educational Tone:** Trial feels like learning journey, not sales pitch
- **Regression-Free:** No breaking changes

### Review Goal
**"Every trial user experiences the platform in a guided, educational way."**

### Deliverables (Required)
- GUIDED_TRIAL_IMPLEMENTATION_REPORT.md
- GUIDED_TRIAL_REGRESSION_REPORT.md
- GUIDED_TRIAL_CERTIFICATION.md
- GUIDED_TRIAL_NEXT_STEPS.md

### Testing Requirements
- E2E trial flow testing (full 14-day simulation)
- Usage tracking verification
- Recommendation engine testing (various usage patterns)
- Conversion flow testing (7-day, 3-day, 1-day, expiry)

### Risks
- **RISK-005:** Trial onboarding overwhelms users (Medium probability, Medium impact)
- **RISK-011:** Usage tracking performance impact (Low probability, Low impact)

### Status
⏳ **PENDING** — Awaiting Milestone 2 completion and Founder approval

---

## MILESTONE 5: SUBSCRIPTION LIFECYCLE

### Purpose
Manage the customer relationship after activation: upgrades, downgrades, renewals, cancellations.

### Business Question
**"Are subscription changes predictable, transparent, and commercially correct?"**

### Scope

#### 1. Upgrade Flow
- Create `src/pages/api/subscriptions/upgrade.ts`
- Implement proration calculation
- Process payment
- Update subscription record
- Update entitlements immediately
- Send confirmation email
- Create `src/components/UpgradeModal.tsx`
- Show pricing comparison
- Show proration amount
- Handle payment flow

#### 2. Downgrade Flow
- Create `src/pages/api/subscriptions/downgrade.ts`
- Schedule downgrade for next billing cycle (not immediate)
- Check data over new limits
- Return data retention warnings
- Create `src/components/DowngradeModal.tsx`
- Show data retention warnings
- Allow user to select what to keep
- Show "Schedule Downgrade" CTA

#### 3. Renewal Flow
- Implement renewal reminders (7 days before renewal)
- Send email with amount, date, payment method
- Retry payment on failure (3 attempts)
- Email after each failure

#### 4. Cancellation Flow
- Create `src/components/CancellationFlow.tsx`
- Retention flow: "What can we do to keep you?"
- Offer discount or downgrade instead
- Capture cancellation reason
- Schedule cancellation for end of cycle
- Create `src/pages/api/subscriptions/cancel.ts`

#### 5. Expiry Handling
- Create `src/components/ExpiryWarning.tsx`
- Show warning when subscription approaching expiry
- Grace period indicator (3 days)
- "Renew Now" CTA

#### 6. Reactivation Flow
- Create `src/components/ReactivationPrompt.tsx`
- Show "Reactivate" button for expired subscriptions
- One-click reactivation (use saved payment method)
- Restore data (if within 90 days)
- Create `src/pages/api/subscriptions/reactivate.ts`

#### 7. Billing Transitions
- Handle proration correctly
- Handle plan changes mid-cycle
- Handle payment method updates
- Handle billing cycle changes

### What Is NOT Included
- ❌ Lifecycle emails (Milestone 6)
- ❌ Usage indicators (Milestone 6)
- ❌ Celebration moments (Milestone 6)

### Dependencies
- ✅ Milestone 1 complete (pricing configuration ready)
- ✅ Milestone 2 complete (API enforcement in place)
- ✅ Milestone 3 complete (upgrade prompts exist)

**Critical:** API enforcement must be complete so that entitlements update immediately after upgrade/downgrade.

### Estimated Effort
**2-3 weeks**

**Breakdown:**
- Upgrade flow: 3-5 days
- Downgrade flow: 3-5 days
- Renewal flow: 1-2 days
- Cancellation flow: 2-3 days
- Expiry handling: 1 day
- Reactivation flow: 1-2 days
- Billing transitions: 2-3 days

### Success Criteria
- Upgrade: Immediate, prorated, features unlock immediately
- Downgrade: Next billing cycle, data retention warnings, user selects what to keep
- Renewal: Auto-renewal with 7-day reminder
- Cancellation: End of cycle, retention flow, reason captured
- Expiry: Warning shown, grace period, renew CTA
- Reactivation: One-click, data restored (if within 90 days)
- Billing: Proration correct, no double-charging

### Certification Criteria
- **Upgrade Transparency:** Customers understand proration and immediate access
- **Downgrade Safety:** Customers warned about data retention, can select what to keep
- **Renewal Predictability:** Customers reminded 7 days before renewal
- **Cancellation Respect:** Customers can cancel easily, retention flow is helpful
- **Expiry Grace:** Customers have grace period to renew
- **Reactivation Ease:** Expired customers can reactivate easily
- **Billing Accuracy:** All proration calculations correct
- **Regression-Free:** No breaking changes

### Review Goal
**"Subscription changes are predictable, transparent, and commercially correct."**

### Deliverables (Required)
- SUBSCRIPTION_LIFECYCLE_IMPLEMENTATION_REPORT.md
- SUBSCRIPTION_LIFECYCLE_REGRESSION_REPORT.md
- SUBSCRIPTION_LIFECYCLE_CERTIFICATION.md
- SUBSCRIPTION_LIFECYCLE_NEXT_STEPS.md

### Testing Requirements
- Payment processing testing (proration verification)
- Data retention testing (downgrade scenarios)
- Renewal testing (auto-renewal, retry logic)
- Cancellation testing (retention flow, end-of-cycle)
- Expiry testing (grace period, warnings)
- Reactivation testing (data restoration)

### Risks
- **RISK-003:** Payment processing failures (Medium probability, High impact)
- **RISK-006:** Data loss in downgrade (Low probability, High impact)
- **RISK-010:** Proration calculation errors (Low probability, Medium impact)

### Status
⏳ **PENDING** — Awaiting Milestone 3 completion and Founder approval

---

## MILESTONE 6: COMMERCIAL POLISH & FINAL CERTIFICATION

### Purpose
Finalize the complete Commercial Truth implementation with polish features and comprehensive certification.

### Business Question
**"Is Commercial Truth fully implemented and certified across the platform?"**

### Scope

#### 1. Lifecycle Emails
- Welcome email (trial activation)
- Trial conversion reminders (7-day, 3-day, 1-day)
- Upgrade confirmation
- Downgrade confirmation
- Renewal confirmation
- Cancellation confirmation
- Reactivation confirmation

#### 2. Usage Indicators
- QR codes: "5/5 used" (Starter)
- AI credits: "15/20 used this month"
- Storage: "1.2 GB / 2 GB"
- Upgrade prompt when approaching limit

#### 3. Celebration Moments
- Welcome message after upgrade
- Feature unlock celebration
- Milestone celebrations (e.g., "You've processed 1,000 orders!")

#### 4. Commercial Analytics
- Track feature usage by plan tier
- Track upgrade conversion rates
- Track trial conversion rates
- Track cancellation reasons
- Alert on anomalies (Starter users accessing Premium features)

#### 5. Final Regression Testing
- Full regression test suite
- E2E testing for all critical flows
- Manual testing for each plan tier
- Performance testing
- Security testing

#### 6. Final Commercial Truth Certification
- Comprehensive constitutional compliance audit
- Verify all pricing matches Constitution
- Verify all entitlements match Constitution
- Verify all lifecycle behavior matches Constitution
- Verify no revenue leakage
- Verify no commercial inconsistencies

### What Is NOT Included
Nothing—this is the final milestone.

### Dependencies
- ✅ Milestone 1 complete (pricing configuration)
- ✅ Milestone 2 complete (API enforcement)
- ✅ Milestone 3 complete (dashboard experience)
- ✅ Milestone 4 complete (guided trial)
- ✅ Milestone 5 complete (subscription lifecycle)

**Critical:** All previous milestones must be complete and certified before final certification.

### Estimated Effort
**1-2 weeks**

**Breakdown:**
- Lifecycle emails: 2-3 days
- Usage indicators: 1-2 days
- Celebration moments: 1-2 days
- Commercial analytics: 2-3 days
- Final regression testing: 2-3 days
- Final certification: 1-2 days

### Success Criteria
- Lifecycle Emails: All emails sent at correct times with correct content
- Usage Indicators: Displayed accurately for all limited resources
- Celebration Moments: Appear at appropriate times, dismissible
- Commercial Analytics: All metrics tracked accurately
- Regression Testing: All tests pass
- Final Certification: 100% constitutional compliance

### Certification Criteria
- **Complete Implementation:** All 6 milestones implemented and certified
- **Constitutional Compliance:** 100% compliance across all sections
- **Revenue Protection:** Zero leakage (customers only access paid features)
- **Customer Experience:** Clear, supportive, growth-focused
- **Technical Quality:** Build successful, no regressions, performant
- **Production Ready:** Fully tested, documented, deployed

### Review Goal
**"Is Commercial Truth fully implemented and certified across the platform?"**

### Deliverables (Required)
- COMMERCIAL_POLISH_IMPLEMENTATION_REPORT.md
- COMMERCIAL_POLISH_REGRESSION_REPORT.md
- COMMERCIAL_TRUTH_FINAL_CERTIFICATION.md
- COMMERCIAL_TRUTH_COMPLETE.md (final summary)

### Testing Requirements
- Full regression test suite
- E2E testing for all flows
- Manual testing for all plan tiers
- Performance testing
- Security testing
- User acceptance testing

### Risks
- **RISK-009:** Email delivery failures (Low probability, Medium impact)
- **RISK-012:** Celebration moments annoy users (Low probability, Low impact)
- **RISK-013:** Plan indicator styling inconsistency (Low probability, Low impact)

### Status
⏳ **PENDING** — Awaiting Milestone 5 completion and Founder approval

---

## IMPLEMENTATION TIMELINE

**Total Estimated Timeline:** 6-8 weeks

| Milestone | Duration | Status |
|-----------|----------|--------|
| 1. Commercial Foundation | 1 day | ✅ Complete |
| 2. Commercial Enforcement (Backend) | 2-3 weeks | ⏳ Pending |
| 3. Progressive Commercial Experience | 1-2 weeks | ⏳ Pending |
| 4. Guided Professional Trial | 1-2 weeks | ⏳ Pending |
| 5. Subscription Lifecycle | 2-3 weeks | ⏳ Pending |
| 6. Commercial Polish & Final Certification | 1-2 weeks | ⏳ Pending |

**Critical Path:** Milestones 2 → 3 → 5 (backend enforcement must precede dashboard changes and lifecycle flows)

**Parallel Opportunities:** Milestone 4 (Guided Trial) can run parallel with Milestone 3 if resources allow

---

## STANDARD MILESTONE PROCESS

Every milestone follows the same disciplined workflow:

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
8. HARD STOP
```

**No milestone may continue into the next milestone without explicit Founder approval.**

---

## DEPLOYMENT STRATEGY

**Recommended:** Gradual rollout for customer-facing milestones

**Phase 1 (10% of users):**
- Deploy changes
- Monitor for 24 hours
- Check error rates, revenue metrics, customer feedback

**Phase 2 (50% of users):**
- If Phase 1 successful, increase to 50%
- Monitor for 24 hours

**Phase 3 (100% of users):**
- If Phase 2 successful, deploy to all users
- Continue monitoring for 1 week

**Rollback Criteria:**
- Error rate > 5%
- Revenue drop > 20%
- Customer complaints > 10/day
- Founder decision

---

## RISK SUMMARY

| Priority | Count | Milestones Affected |
|----------|-------|---------------------|
| ⚠️ Critical | 3 | Milestone 2 |
| 🔶 High | 3 | Milestones 2, 3, 5 |
| 🟡 Medium | 4 | Milestones 2, 3, 4, 6 |
| 🟢 Low | 3 | Milestones 4, 6 |

**Total Risks:** 13 (all documented with mitigation strategies)

See `COMMERCIAL_RISK_REGISTER.md` for complete risk details.

---

## SUCCESS METRICS

**Milestone 2 (Backend Enforcement):**
- API error rate < 1%
- Revenue leakage = 0% (Starter users cannot access Professional features)

**Milestone 3 (Dashboard Experience):**
- Customer confusion rate < 5%
- Upgrade click-through rate > 10%

**Milestone 4 (Guided Trial):**
- Trial completion rate > 60%
- Trial conversion rate > 20%

**Milestone 5 (Subscription Lifecycle):**
- Upgrade success rate > 95%
- Downgrade data retention success rate = 100%
- Cancellation retention rate > 20%

**Milestone 6 (Final Certification):**
- Constitutional compliance = 100%
- Revenue leakage = 0%
- Build success rate = 100%

---

## CONCLUSION

This roadmap organizes Commercial Truth implementation into 6 focused milestones, each addressing one clear business capability. Every milestone follows the same disciplined process established during Homepage implementation and Commercial Foundation.

**Current Status:**
- ✅ Milestone 1 complete and certified
- ⏳ Milestone 2 awaiting Founder approval to begin

**Next Action:** Founder review and approval to proceed with Milestone 2

---

**Prepared By:** Engineering Architecture Review  
**Date:** 2026-07-03  
**Status:** Roadmap refined and ready for execution

---

**END OF ROADMAP V2**
