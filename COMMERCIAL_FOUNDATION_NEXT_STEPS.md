# COMMERCIAL_FOUNDATION_NEXT_STEPS

**Current Milestone:** 1 — Commercial Foundation (✅ Complete)  
**Next Milestone:** 2 — API Enforcement & Dashboard Discovery  
**Date:** 2026-07-03

---

## MILESTONE 1 COMPLETION STATUS

✅ **Complete:** Commercial Foundation  
✅ **Certified:** Constitutionally compliant  
✅ **Tested:** Regression-free  
✅ **Ready:** Awaiting Founder approval

---

## MILESTONE 2 SCOPE

**Title:** API Enforcement & Dashboard Progressive Discovery

**Objective:** Implement backend enforcement and frontend discovery according to Constitution

**Duration:** 2-3 weeks

---

### MILESTONE 2 DELIVERABLES

#### 1. Database Migration
**Priority:** P0 (Critical)

**Tasks:**
- [ ] Create migration script to update `plan.code = 'ESSENTIALS'` → `plan.code = 'STARTER'`
- [ ] Verify all existing users migrated successfully
- [ ] Test entitlement checks work for migrated users
- [ ] Backup database before migration

**Effort:** 1 day  
**Risk:** Medium (data migration)

---

#### 2. API Entitlement Middleware
**Priority:** P0 (Critical)

**Tasks:**
- [ ] Create `src/lib/middleware/withFeatureCheck.ts`
- [ ] Implement `requiresFeature()` middleware
- [ ] Add trial detection (grant Professional entitlements during trial)
- [ ] Add entitlement checking logic
- [ ] Return 402 with upgrade info if locked
- [ ] Add logging for analytics

**Effort:** 2-3 hours  
**Risk:** Low (new file, doesn't break existing)

---

#### 3. API Endpoint Protection
**Priority:** P0 (Critical)

**Tasks:**
- [ ] Apply `requiresFeature()` to ~100 API endpoints
- [ ] Test each endpoint individually
- [ ] Verify Starter users get 402 for Professional features
- [ ] Verify Professional users get 200 for Professional features
- [ ] Verify trial users get 200 for Professional features

**Effort:** 1-2 weeks  
**Risk:** High (affects all API calls, requires thorough testing)

**Recommended Approach:**
- Apply to 10 endpoints per day
- Test each endpoint before moving to next
- Deploy behind feature flag initially
- Gradual rollout (10% → 50% → 100%)

---

#### 4. Dashboard Progressive Discovery
**Priority:** P0 (Critical)

**Tasks:**
- [ ] Add `requiredFeature` and `minPlan` metadata to navigation items
- [ ] Implement Progressive Discovery logic
- [ ] Create "Grow Your Business" section
- [ ] Create upgrade prompt cards
- [ ] Test for each plan tier

**Effort:** 2-3 days  
**Risk:** Medium (affects all users)

---

#### 5. Session Extension
**Priority:** P0 (Critical)

**Tasks:**
- [ ] Add `planCode` to session
- [ ] Add `trialEndDate` to session
- [ ] Add `subscriptionStatus` to session
- [ ] Test session serialization

**Effort:** 1 hour  
**Risk:** Low

---

#### 6. Feature Flag Cleanup
**Priority:** P1 (High)

**Tasks:**
- [ ] Replace `advanced_analytics` (10 clients) with `hasAdvancedReports` entitlement
- [ ] Replace `multi_branch` (15 clients) with `hasMultiBranchDashboard` entitlement
- [ ] Replace `ai_menu_builder` (20 clients) with entitlement or remove
- [ ] Replace `promotions_engine` (25 clients) with entitlement or remove
- [ ] Remove client-count gating logic
- [ ] Test feature availability for each plan tier

**Effort:** 1-2 days  
**Risk:** Medium (changes feature availability)

---

#### 7. Pricing Page Update
**Priority:** P1 (High)

**Tasks:**
- [ ] Add transparent annual savings presentation
- [ ] Show monthly price
- [ ] Show regular annual value (monthly × 12)
- [ ] Show discounted annual value
- [ ] Show savings amount
- [ ] Add standard language: "Pay annually and save 25% — equivalent to 3 free months"
- [ ] Visual regression testing

**Effort:** 2-3 hours  
**Risk:** Low

---

### MILESTONE 2 SUCCESS CRITERIA

**Must Complete:**
1. ✅ Database migration successful (all ESSENTIALS → STARTER)
2. ✅ API middleware created and tested
3. ✅ 100% of API endpoints protected
4. ✅ Dashboard Progressive Discovery implemented
5. ✅ Session includes plan data
6. ✅ Feature flags cleaned up
7. ✅ Pricing page updated
8. ✅ Full regression testing passed
9. ✅ No revenue leakage (Starter users cannot access Professional features)

**Testing Requirements:**
- Unit tests for middleware
- Integration tests for each API endpoint
- E2E tests for critical flows
- Manual testing for each plan tier
- Performance testing (session size, API response time)

---

## MILESTONE 3 SCOPE (PREVIEW)

**Title:** Guided Professional Trial

**Objective:** Implement progressive trial onboarding and usage-based recommendations

**Key Deliverables:**
- Progressive onboarding (Days 1-3, 4-7, 8-11, 12-14)
- Usage tracking service
- Recommendation engine
- Trial conversion flow
- Usage-based plan recommendations

**Duration:** 1-2 weeks

---

## MILESTONE 4 SCOPE (PREVIEW)

**Title:** Upgrade & Downgrade Flows

**Objective:** Implement subscription lifecycle management

**Key Deliverables:**
- Upgrade API with proration
- Downgrade API with data retention warnings
- Upgrade/downgrade UI
- Contextual upgrade prompts

**Duration:** 1-2 weeks

---

## MILESTONE 5 SCOPE (PREVIEW)

**Title:** Lifecycle Management

**Objective:** Implement renewal, cancellation, expiry, and reactivation flows

**Key Deliverables:**
- Renewal reminders
- Cancellation UI with retention flow
- Expiry warnings
- Reactivation flow

**Duration:** 1 week

---

## MILESTONE 6 SCOPE (PREVIEW)

**Title:** Polish & Celebration

**Objective:** Add polish features and celebration moments

**Key Deliverables:**
- Plan indicators
- Usage indicators
- Lifecycle emails
- Celebration moments

**Duration:** 1 week

---

## IMPLEMENTATION TIMELINE

**Total Estimated Timeline:** 6-8 weeks

- **Week 1:** ✅ Milestone 1 Complete
- **Week 2-4:** Milestone 2 (API Enforcement & Dashboard Discovery)
- **Week 5:** Milestone 3 (Guided Professional Trial)
- **Week 6:** Milestone 4 (Upgrade & Downgrade)
- **Week 7:** Milestone 5 (Lifecycle Management)
- **Week 8:** Milestone 6 (Polish & Celebration)

---

## DEPENDENCIES FOR MILESTONE 2

**Must Complete Before Starting:**
1. ✅ Milestone 1 approved by Founder
2. ✅ Database backup created
3. ✅ Staging environment ready for testing

**External Dependencies:**
- None

---

## RISKS FOR MILESTONE 2

### Risk 1: API Endpoint Protection Breaks Functionality
**Probability:** Medium  
**Impact:** High  
**Mitigation:**
- Test each endpoint individually
- Deploy behind feature flag
- Gradual rollout (10% → 50% → 100%)
- Monitor error rates closely

### Risk 2: Revenue Leakage During Transition
**Probability:** Medium  
**Impact:** High  
**Mitigation:**
- Implement API protection first
- Update dashboard immediately after
- Monitor feature usage by plan tier
- Alert on anomalies

### Risk 3: Database Migration Failures
**Probability:** Low  
**Impact:** High  
**Mitigation:**
- Backup database before migration
- Test migration in staging first
- Have rollback plan ready
- Monitor migration progress

---

## RECOMMENDED SEQUENCE FOR MILESTONE 2

**Week 1:**
- Day 1: Database migration + Session extension
- Day 2-3: API middleware creation
- Day 4-5: API endpoint protection (start with 10-20 endpoints)

**Week 2:**
- Day 1-3: API endpoint protection (continue, 50-70 endpoints)
- Day 4-5: Dashboard Progressive Discovery

**Week 3:**
- Day 1-2: API endpoint protection (complete, remaining endpoints)
- Day 3: Feature flag cleanup
- Day 4: Pricing page update
- Day 5: Full regression testing

---

## DEPLOYMENT STRATEGY FOR MILESTONE 2

**Recommended:** Gradual Rollout

**Phase 1 (10% of users):**
- Deploy API protection + Dashboard Discovery
- Monitor for 24 hours
- Check error rates, revenue metrics, customer complaints

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

---

## OPEN QUESTIONS FOR FOUNDER

1. **Database Migration Timing:** Should migration happen during off-peak hours?
2. **Gradual Rollout:** Approve gradual rollout strategy (10% → 50% → 100%)?
3. **Feature Flag Approach:** Deploy API protection behind feature flag initially?
4. **Milestone 2 Scope:** Approve recommended scope for Milestone 2?

---

## CONCLUSION

Milestone 1 (Commercial Foundation) is complete and ready for Founder review. Upon approval, engineering will proceed with Milestone 2 (API Enforcement & Dashboard Discovery) following the recommended sequence and deployment strategy.

**Current Status:** ✅ Milestone 1 Complete  
**Next Action:** Founder review and approval  
**Next Milestone:** Milestone 2 (2-3 weeks)

---

**Prepared By:** Engineering  
**Date:** 2026-07-03  
**Status:** Ready for Founder Review

---

**END OF NEXT STEPS**
