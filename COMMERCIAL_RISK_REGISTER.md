# COMMERCIAL_RISK_REGISTER

**Document:** Commercial Constitution v1.1 Implementation Risks  
**Date:** 2026-07-03  
**Purpose:** Identify and mitigate technical implementation risks

---

## RISK ASSESSMENT FRAMEWORK

**Impact:** High / Medium / Low  
**Probability:** High / Medium / Low  
**Priority:** Critical / High / Medium / Low

**Priority Calculation:**
- Critical: High Impact + High Probability
- High: High Impact + Medium Probability OR Medium Impact + High Probability
- Medium: Medium Impact + Medium Probability OR High Impact + Low Probability
- Low: Low Impact + Any Probability

---

## CRITICAL RISKS (Must Mitigate)

### RISK-001: API Endpoint Protection Breaks Existing Functionality

**Category:** Technical  
**Impact:** High (breaks customer workflows)  
**Probability:** Medium (100 endpoints to update)  
**Priority:** ⚠️ **CRITICAL**

**Description:**  
Applying `requiresFeature()` middleware to ~100 API endpoints may inadvertently break existing functionality if entitlement checks are incorrect or too restrictive.

**Mitigation:**
1. Test each endpoint individually before moving to next
2. Maintain comprehensive integration test suite
3. Deploy behind feature flag initially
4. Gradual rollout (10% → 50% → 100%)
5. Monitor error rates closely
6. Have rollback plan ready

**Implementation Timing:** Week 1-2

**Owner:** Backend Engineering

---

### RISK-002: Revenue Leakage During Transition

**Category:** Commercial  
**Impact:** High (lost revenue)  
**Probability:** Medium (transition period)  
**Priority:** ⚠️ **CRITICAL**

**Description:**  
During implementation, there may be periods where entitlement enforcement is inconsistent (e.g., API protected but dashboard not updated), allowing customers to access features they haven't paid for.

**Mitigation:**
1. Implement API protection first (Week 1-2)
2. Update dashboard immediately after (Week 1)
3. Minimize time between API and UI updates
4. Monitor feature usage by plan tier
5. Alert on anomalies (Starter users accessing Premium features)

**Implementation Timing:** Week 1-2

**Owner:** Engineering + Product

---

### RISK-003: Payment Processing Failures in Upgrade/Downgrade

**Category:** Technical  
**Impact:** High (customer frustration, lost revenue)  
**Probability:** Medium (new payment flows)  
**Priority:** ⚠️ **CRITICAL**

**Description:**  
Proration calculations, payment processing, and subscription updates in upgrade/downgrade flows may fail or calculate incorrectly.

**Mitigation:**
1. Comprehensive unit tests for proration logic
2. Test with real payment provider in staging
3. Manual testing with various scenarios
4. Implement idempotency (prevent double-charging)
5. Add detailed logging for debugging
6. Have manual refund process ready

**Implementation Timing:** Week 3

**Owner:** Backend Engineering + Finance

---

## HIGH RISKS (Prioritize Mitigation)

### RISK-004: Dashboard Visibility Confusion

**Category:** UX  
**Impact:** High (customer confusion)  
**Probability:** Low (well-designed)  
**Priority:** 🔶 **HIGH**

**Description:**  
Progressive Commercial Discovery may confuse customers if not implemented clearly. Customers may not understand why they see some features but not others.

**Mitigation:**
1. Clear visual hierarchy (owned vs. next-tier)
2. Contextual explanations ("Unlock in Professional")
3. User testing before full rollout
4. Support documentation
5. In-app help tooltips

**Implementation Timing:** Week 1

**Owner:** Frontend Engineering + UX

---

### RISK-005: Trial Onboarding Overwhelms Users

**Category:** UX  
**Impact:** Medium (poor trial experience)  
**Probability:** Medium (new onboarding)  
**Priority:** 🔶 **HIGH**

**Description:**  
Progressive onboarding may still overwhelm users if not paced correctly, or may under-showcase features if too slow.

**Mitigation:**
1. User testing with real trial users
2. A/B test different pacing (Days 1-3 vs. 1-5)
3. Allow users to skip ahead if desired
4. Monitor trial conversion rates
5. Adjust pacing based on data

**Implementation Timing:** Week 1-2

**Owner:** Frontend Engineering + Product

---

### RISK-006: Data Loss in Downgrade

**Category:** Technical  
**Impact:** High (customer data loss)  
**Probability:** Low (well-designed)  
**Priority:** 🔶 **HIGH**

**Description:**  
Downgrade flow requires customers to address data over new limits (e.g., 3 branches → 1 branch). If not handled correctly, customers may lose data.

**Mitigation:**
1. Clear warnings before downgrade
2. User explicitly selects what to keep
3. Archive (don't delete) excess data
4. Allow grace period to reverse downgrade
5. Comprehensive testing of data retention logic

**Implementation Timing:** Week 3

**Owner:** Backend Engineering

---

## MEDIUM RISKS (Monitor)

### RISK-007: Feature Flag Cleanup Breaks Functionality

**Category:** Technical  
**Impact:** Medium (feature unavailability)  
**Probability:** Medium (cleanup complexity)  
**Priority:** 🟡 **MEDIUM**

**Description:**  
Removing feature flags used for commercial gating may break functionality if entitlement checks are not correctly in place.

**Mitigation:**
1. Complete API protection before cleanup
2. Test each feature flag removal individually
3. Monitor feature usage after removal
4. Have rollback plan (re-enable flag)

**Implementation Timing:** Week 2

**Owner:** Backend Engineering

---

### RISK-008: Session Size Increase

**Category:** Technical  
**Impact:** Low (performance)  
**Probability:** Medium (session extension)  
**Priority:** 🟡 **MEDIUM**

**Description:**  
Adding `planCode`, `trialEndDate`, `subscriptionStatus` to session may increase session size and affect performance.

**Mitigation:**
1. Keep session data minimal (only essential fields)
2. Monitor session size
3. Consider caching plan data separately if needed
4. Performance testing

**Implementation Timing:** Week 1

**Owner:** Backend Engineering

---

### RISK-009: Email Delivery Failures

**Category:** Technical  
**Impact:** Medium (missed communications)  
**Probability:** Low (email service reliable)  
**Priority:** 🟡 **MEDIUM**

**Description:**  
Lifecycle emails (trial conversion, renewal reminders, etc.) may fail to deliver or be marked as spam.

**Mitigation:**
1. Use reputable email service
2. Proper SPF/DKIM/DMARC configuration
3. Monitor email delivery rates
4. Fallback to in-app notifications
5. Test email templates thoroughly

**Implementation Timing:** Week 4-6

**Owner:** Backend Engineering + DevOps

---

### RISK-010: Proration Calculation Errors

**Category:** Technical  
**Impact:** Medium (incorrect charges)  
**Probability:** Low (well-tested)  
**Priority:** 🟡 **MEDIUM**

**Description:**  
Proration calculations for mid-cycle upgrades may be incorrect, leading to overcharging or undercharging.

**Mitigation:**
1. Comprehensive unit tests for all scenarios
2. Manual verification with spreadsheet
3. Test with various billing cycle positions
4. Add detailed logging
5. Manual refund process ready

**Implementation Timing:** Week 3

**Owner:** Backend Engineering + Finance

---

## LOW RISKS (Accept)

### RISK-011: Usage Tracking Performance Impact

**Category:** Technical  
**Impact:** Low (minor performance)  
**Probability:** Low (lightweight tracking)  
**Priority:** 🟢 **LOW**

**Description:**  
Tracking feature usage during trial may add minor performance overhead.

**Mitigation:**
1. Asynchronous tracking (don't block requests)
2. Batch updates
3. Monitor performance metrics

**Implementation Timing:** Week 1-2

**Owner:** Backend Engineering

---

### RISK-012: Celebration Moments Annoy Users

**Category:** UX  
**Impact:** Low (minor annoyance)  
**Probability:** Low (well-designed)  
**Priority:** 🟢 **LOW**

**Description:**  
Celebration moments (upgrade, milestones) may annoy users if too frequent or intrusive.

**Mitigation:**
1. Keep celebrations brief and dismissible
2. Limit frequency (not every action)
3. Allow users to disable
4. Monitor user feedback

**Implementation Timing:** Week 6

**Owner:** Frontend Engineering + UX

---

### RISK-013: Plan Indicator Styling Inconsistency

**Category:** UX  
**Impact:** Low (minor visual issue)  
**Probability:** Low (simple styling)  
**Priority:** 🟢 **LOW**

**Description:**  
Plan indicator badges may not match brand styling or look inconsistent across devices.

**Mitigation:**
1. Design review before implementation
2. Cross-browser testing
3. Mobile responsive testing

**Implementation Timing:** Week 6

**Owner:** Frontend Engineering + Design

---

## RISK SUMMARY

| Priority | Count | Risks |
|----------|-------|-------|
| ⚠️ Critical | 3 | RISK-001, RISK-002, RISK-003 |
| 🔶 High | 3 | RISK-004, RISK-005, RISK-006 |
| 🟡 Medium | 4 | RISK-007, RISK-008, RISK-009, RISK-010 |
| 🟢 Low | 3 | RISK-011, RISK-012, RISK-013 |

**Total Risks:** 13

---

## MITIGATION TIMELINE

**Week 1:**
- RISK-001: API Protection testing strategy
- RISK-002: Monitor revenue leakage
- RISK-004: Dashboard visibility clarity
- RISK-005: Trial onboarding user testing
- RISK-008: Session size monitoring

**Week 2:**
- RISK-007: Feature flag cleanup testing

**Week 3:**
- RISK-003: Payment processing testing
- RISK-006: Data retention testing
- RISK-010: Proration verification

**Week 4-6:**
- RISK-009: Email delivery monitoring
- RISK-011: Usage tracking performance
- RISK-012: Celebration moments feedback
- RISK-013: Plan indicator styling

---

## MONITORING & ALERTS

**Key Metrics to Monitor:**
1. API error rate (target: < 1%)
2. Revenue per user (by plan)
3. Feature usage by plan tier (detect anomalies)
4. Trial conversion rate (target: > 20%)
5. Upgrade rate (target: > 10%)
6. Churn rate (target: < 5%)
7. Email delivery rate (target: > 95%)
8. Session size (target: < 10KB)

**Alert Thresholds:**
- API error rate > 5% → Critical alert
- Revenue drop > 20% → Critical alert
- Starter users accessing Premium features → Warning alert
- Email delivery rate < 90% → Warning alert

---

## ROLLBACK CRITERIA

**Trigger Rollback If:**
1. API error rate > 5% for > 1 hour
2. Revenue drop > 20% for > 1 day
3. Customer complaints > 10/day
4. Payment processing failure rate > 10%
5. Founder decision

**Rollback Process:**
1. Disable feature flags (if using gradual rollout)
2. Revert code changes
3. Restore previous configuration
4. Communicate with affected customers
5. Investigate root cause
6. Fix and re-deploy

---

**Prepared By:** Engineering Architecture Review  
**Date:** 2026-07-03  
**Status:** Risk assessment complete

---

**END OF RISK REGISTER**
