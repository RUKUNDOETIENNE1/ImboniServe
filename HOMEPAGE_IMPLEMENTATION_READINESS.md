# HOMEPAGE_IMPLEMENTATION_READINESS — Status & Next Steps

**Date:** 2026-06-30  
**Current Status:** Engineering STOPPED — Awaiting Founder Decisions  
**Repository Status:** Clean

---

## OVERVIEW

This document clearly separates:
1. **Already Implemented** — Engineering fixes completed and committed
2. **Ready After Founder Approval** — Awaiting business/marketing decisions
3. **Blocked Pending Founder Decision** — Cannot proceed without strategic direction
4. **Future RC1+** — Out of scope for current Homepage certification

---

## 1. ALREADY IMPLEMENTED ✅

**Status:** Committed to repository (commits `f0fe2a0` and `698208c`)  
**Branch:** main  
**Verification:** Local testing complete

### Group 1: Engineering-Owned Fixes

| Fix | File(s) Changed | Status | Commit |
|---|---|---|---|
| **Remove dashboard links from public navigation** | `src/pages/index.tsx` | ✅ Complete | `698208c` |
| - Removed `/dashboard/site-builder` from Solutions dropdown | Lines 418-433 | ✅ Complete | `698208c` |
| - Removed `/dashboard/profile` from Solutions dropdown | Lines 430-433 | ✅ Complete | `698208c` |
| - Removed dashboard links from mobile navigation | Lines 514-518 | ✅ Complete | `698208c` |
| **Increase hero carousel interval** | `src/pages/index.tsx` | ✅ Complete | `698208c` |
| - Changed from 5000ms to 7000ms | Line 223 | ✅ Complete | `698208c` |
| **Remove hardcoded provider wording** | `src/locales/*.json` | ✅ Complete | `698208c` |
| - De-localized "MTN MoMo / Airtel Money" references | `en.json`, `fr.json`, `rw.json` | ✅ Complete | `698208c` |
| - Replaced with "mobile money payments" | All locale files | ✅ Complete | `698208c` |
| **Make WhatsApp contact configurable** | `.env.example`, `src/pages/index.tsx` | ✅ Complete | `698208c` |
| - Added `NEXT_PUBLIC_SUPPORT_WHATSAPP_URL` | `.env.example` | ✅ Complete | `698208c` |
| - Updated homepage WhatsApp links | `src/pages/index.tsx` | ✅ Complete | `698208c` |
| **Make currency display configurable** | `.env.example`, `src/pages/index.tsx` | ✅ Complete | `698208c` |
| - Added `NEXT_PUBLIC_DISPLAY_CURRENCY` | `.env.example` | ✅ Complete | `698208c` |
| - Updated pricing display to use env var | `src/pages/index.tsx` | ✅ Complete | `698208c` |
| - Updated schema `priceCurrency` | `src/pages/index.tsx` | ✅ Complete | `698208c` |
| **Remove dashboard click-throughs** | `src/pages/index.tsx` | ✅ Complete | `698208c` |
| - Removed auth-wall links from Real-Time OS carousel | Lines 247-283 | ✅ Complete | `698208c` |
| - Removed auth-wall links from Growth carousel | Lines 285-327 | ✅ Complete | `698208c` |
| **Improve "Built for restaurants..." readability** | `src/pages/index.tsx` | ✅ Complete | `698208c` |
| - Increased font size and contrast | Hero section | ✅ Complete | `698208c` |

### Documentation Deliverables

| Document | Status | Commit |
|---|---|---|
| `HOMEPAGE_CERTIFICATION_REPORT.md` | ✅ Complete | `f0fe2a0` |
| `HOMEPAGE_CHANGE_RECOMMENDATIONS.md` | ✅ Complete | `f0fe2a0` |
| `HOMEPAGE_CONTENT_REVIEW.md` | ✅ Complete | `f0fe2a0` |
| `HOMEPAGE_NAVIGATION_REVIEW.md` | ✅ Complete | `f0fe2a0` |
| `HOMEPAGE_FOUNDER_APPROVAL.md` | ✅ Complete | `f0fe2a0` |
| `HOMEPAGE_DECISION_MATRIX.md` | ✅ Complete | `f0fe2a0` |
| `HOMEPAGE_FOUNDER_DECISIONS.md` | ✅ Complete | `f0fe2a0` |
| `HOMEPAGE_IMPLEMENTATION_PLAN.md` | ✅ Complete | `f0fe2a0` |
| `HOMEPAGE_IMPLEMENTATION_CHECKLIST.md` | ✅ Complete | `f0fe2a0` |

### Verification Status

| Test | Status | Notes |
|---|---|---|
| Local build | ✅ Pass | `npm run build` successful |
| TypeScript compilation | ✅ Pass | No type errors |
| Lint | ✅ Pass | No lint errors |
| Unit tests | ⚠️ Pre-existing failures | Unrelated to Homepage changes (commission calc, edge cases) |
| Manual testing | ✅ Pass | Homepage loads correctly |
| Git status | ✅ Clean | No uncommitted changes |

---

## 2. READY AFTER FOUNDER APPROVAL ⏳

**Status:** Awaiting Founder decisions from `FOUNDER_DECISION_QUEUE.md`  
**Implementation Time:** 30 minutes to 8 hours (depending on decisions)

### Business Decisions (See HOMEPAGE_BUSINESS_DECISIONS.md)

| Decision | Effort if Approved | Blocks |
|---|---|---|
| **Trust Signals** | 30 min to 4 hours | Homepage certification |
| - Trust statement only | 30 minutes | Low priority |
| - Customer testimonials | 2-4 hours (if content ready) | Medium priority |
| - "Trusted by X restaurants" | 30 minutes | Low priority |
| - Security/compliance badges | 1 hour | Low priority |
| **Launch Special Terms** | 10 minutes | Homepage certification |
| - Add expiration date | 10 minutes | High priority |
| - Add customer limit | 10 minutes | High priority |
| - Convert to free trial emphasis | 30 minutes | Medium priority |
| - Remove entirely | 10 minutes | Low priority |
| **Book Demo CTA** | 15 min to 1 hour | Homepage certification |
| - Keep as-is | 0 minutes | N/A |
| - Remove button | 15 minutes | High priority |
| - Replace with "Contact Sales" | 30 minutes | Medium priority |
| - Replace with "Chat with Us" | 30 minutes | Medium priority |
| **Business Discovery Visibility** | 30 min to 8 hours | Homepage certification |
| - Keep visible — fix localization | 4-8 hours | High priority |
| - Hide from RC1 | 30 minutes | High priority |
| - Keep as-is (Rwanda pilot) | 0 minutes | N/A |
| **Store Visibility** | 15 minutes | Homepage certification |
| - Keep visible | 0 minutes | N/A |
| - Hide from RC1 | 15 minutes | Medium priority |
| **Referral Program Visibility** | 30 minutes | Homepage certification |
| - Keep visible | 0 minutes | N/A |
| - Hide from RC1 | 30 minutes | Medium priority |
| **Pricing Preview Strategy** | 30 min to 2 hours | Homepage certification |
| - Keep as-is | 0 minutes | N/A |
| - Simplify to "Plans starting from..." | 30 minutes | Low priority |
| - Remove from Homepage | 30 minutes | Low priority |
| - Defer to Pricing page review | 0 minutes | N/A |

### Marketing Decisions (See HOMEPAGE_MARKETING_DECISIONS.md)

| Decision | Effort if Approved | Blocks |
|---|---|---|
| **Hero Headline** | 1-2 hours | Homepage certification |
| - Keep current | 0 minutes | N/A |
| - Change to new headline | 1-2 hours | Medium priority |
| **Hero Subheadline** | 10 minutes | Homepage certification |
| - Keep current | 0 minutes | N/A |
| - Change to new subheadline | 10 minutes | Low priority |
| **Target Audience Emphasis** | 10 min to 30 min | Homepage certification |
| - Already improved (no changes) | 0 minutes | N/A |
| - Move to headline area | 30 minutes | Low priority |
| - Expand target audience list | 10 minutes | Low priority |
| **Homepage Story Flow** | 30 min to 10 hours | Homepage certification |
| - Keep current flow | 0 minutes | N/A |
| - Add problem section | 2-3 hours | Medium priority |
| - Move "How It Works" earlier | 30 minutes | Low priority |
| - Add trust/proof section | 2-4 hours (if content ready) | Medium priority |
| - Comprehensive restructure | 6-10 hours | High priority |
| **Feature Emphasis** | 1-6 hours | Homepage certification |
| - Keep all 12 features | 0 minutes | N/A |
| - Reduce to 6-8 core features | 1-2 hours | Medium priority |
| - Group features by category | 4-6 hours | High priority |
| - Progressive disclosure | 2-3 hours | Medium priority |
| **Advanced Features Messaging** | 30 min to 3 hours | Homepage certification |
| - Keep as-is (all ready) | 0 minutes | N/A |
| - Add "Beta" labels | 30 minutes | Low priority |
| - Add "Coming Soon" labels | 30 minutes | Low priority |
| - Remove unready features | 1 hour | Medium priority |
| - Move to "Roadmap" section | 2-3 hours | Medium priority |

---

## 3. BLOCKED PENDING FOUNDER DECISION 🚫

**Status:** Cannot proceed without strategic direction  
**Blocker:** Awaiting Founder decisions from `FOUNDER_DECISION_QUEUE.md`

### Blocked Work Items

| Item | Blocker | Required Decision |
|---|---|---|
| **Homepage final certification** | All decisions | Complete `FOUNDER_DECISION_QUEUE.md` |
| **Pricing page review** | Homepage certification | Homepage must be certified first |
| **Authentication page review** | Homepage certification | Homepage must be certified first |
| **Dashboard page review** | Homepage certification | Homepage must be certified first |
| **Store page review** | Store visibility decision | Decision 5 in `HOMEPAGE_BUSINESS_DECISIONS.md` |
| **Discover page review** | Discover visibility decision | Decision 4 in `HOMEPAGE_BUSINESS_DECISIONS.md` |
| **Referral page review** | Referral visibility decision | Decision 6 in `HOMEPAGE_BUSINESS_DECISIONS.md` |

### Critical Path

```
Founder Decisions
    ↓
Homepage Group 2 Implementation
    ↓
Homepage Final Certification
    ↓
Pricing Page Review
    ↓
Authentication Page Review
    ↓
Dashboard Page Review
    ↓
RC1 Public Website Certification Complete
```

---

## 4. FUTURE RC1+ (Out of Scope) 🔮

**Status:** Not part of current Homepage certification  
**Timeline:** Post-RC1

### Deferred Items

| Item | Reasoning | Timeline |
|---|---|---|
| **Mobile device testing** | Requires physical devices | Post-RC1 or separate task |
| **A/B testing setup** | Requires traffic data | Post-launch |
| **Conversion optimization** | Requires baseline metrics | Post-launch |
| **SEO optimization** | Separate workstream | Post-RC1 |
| **Performance optimization** | Separate workstream | Post-RC1 |
| **Accessibility audit** | Separate workstream | Post-RC1 |
| **Multi-language content review** | Requires native speakers | Post-RC1 |
| **Video demo creation** | Requires video production | Post-RC1 |
| **Customer testimonial gathering** | Requires customer coordination | Ongoing |

---

## IMPLEMENTATION WORKFLOW

### Step 1: Founder Reviews Decision Queue
**Document:** `FOUNDER_DECISION_QUEUE.md`  
**Action:** Founder marks decisions and provides required information  
**Timeline:** Founder-dependent

---

### Step 2: Engineering Implements Approved Changes
**Input:** Completed `FOUNDER_DECISION_QUEUE.md`  
**Action:** Engineering implements only approved changes  
**Timeline:** 30 minutes to 8 hours (depending on decisions)

**Implementation Order:**
1. **Quick wins first** (< 1 hour each)
   - Trust statement
   - Launch Special terms
   - Demo CTA changes
   - Visibility toggles (Store, Discover, Referral)
   - Beta/Coming Soon labels

2. **Medium effort** (2-4 hours each)
   - Headline/subheadline changes
   - Feature reduction
   - Add problem section
   - Add trust section (if content ready)

3. **Larger effort** (4-8 hours each)
   - Business Discovery localization fix
   - Feature categorization
   - Homepage story flow restructure

---

### Step 3: Verification & Testing
**Action:** Engineering verifies all changes  
**Timeline:** 1-2 hours

**Verification Checklist:**
- [ ] All approved changes implemented
- [ ] No unapproved changes made
- [ ] TypeScript compilation passes
- [ ] Lint passes
- [ ] Build succeeds
- [ ] Manual testing on localhost
- [ ] Git commit with clear message

---

### Step 4: Founder Reviews Implementation
**Action:** Founder reviews implemented changes  
**Timeline:** Founder-dependent

**Review Checklist:**
- [ ] Changes match approved decisions
- [ ] No surprises or assumptions
- [ ] Quality meets expectations
- [ ] Ready for final certification

---

### Step 5: Final Homepage Certification
**Action:** Founder signs off on Homepage  
**Timeline:** Founder-dependent

**Certification Criteria:**
- [ ] All P0 issues resolved
- [ ] All approved changes implemented
- [ ] No broken promises or unsupported claims
- [ ] Global-by-Design philosophy maintained
- [ ] Messaging aligns with strategic positioning
- [ ] CTAs are operationally supported

---

### Step 6: Proceed to Next Page
**Action:** Begin Pricing page review  
**Timeline:** TBD

---

## CURRENT BLOCKERS

### Primary Blocker
**Awaiting Founder decisions from `FOUNDER_DECISION_QUEUE.md`**

**Required Actions:**
1. Review `FOUNDER_DECISION_QUEUE.md`
2. Mark decisions (checkboxes)
3. Provide required information (dates, numbers, content)
4. Add strategic reasoning where helpful
5. Return to engineering

**Until then:**
- ✅ Repository is clean
- ✅ Group 1 engineering fixes are committed
- ✅ Test suite is stable (pre-existing failures documented)
- ✅ Ready for Group 2 implementation

---

## RISK ASSESSMENT

### Low Risk (Already Mitigated)
- ✅ Dashboard links removed (no more auth walls)
- ✅ Hardcoded localization removed (Global-by-Design maintained)
- ✅ Carousel timing improved (better UX)
- ✅ Repository clean (no uncommitted changes)

### Medium Risk (Awaiting Decisions)
- ⏳ Trust signals (requires truthful content)
- ⏳ Launch Special terms (must honor commitments)
- ⏳ Book Demo CTA (must be operationally supported)
- ⏳ Feature visibility (must not overpromise)

### High Risk (Requires Strategic Direction)
- 🚫 Business Discovery positioning (strategic capability vs. RC1 readiness)
- 🚫 Homepage messaging (differentiation vs. clarity)
- 🚫 Story flow (comprehensive restructure vs. quick wins)

---

## SUCCESS CRITERIA

### Homepage Certification Complete When:
- [ ] All Founder decisions made
- [ ] All approved changes implemented
- [ ] All P0 issues resolved
- [ ] No broken promises or unsupported claims
- [ ] Global-by-Design philosophy maintained
- [ ] Messaging aligns with strategic positioning
- [ ] CTAs are operationally supported
- [ ] Founder signs off on final Homepage

### RC1 Public Website Certification Complete When:
- [ ] Homepage certified
- [ ] Pricing page certified
- [ ] Authentication page certified
- [ ] Dashboard page certified (public-facing elements)
- [ ] All public navigation verified
- [ ] All CTAs verified
- [ ] All claims verified as truthful

---

## NEXT STEPS

1. **Founder:** Review and complete `FOUNDER_DECISION_QUEUE.md`
2. **Engineering:** Implement approved changes (Group 2)
3. **Founder:** Review implementation
4. **Engineering:** Final Homepage certification
5. **Proceed:** Pricing page review

---

## HARD STOP

**Engineering is stopped.**

**Repository is clean.**

**Awaiting Founder decisions.**

**No Homepage changes will be made until `FOUNDER_DECISION_QUEUE.md` is completed.**

---

## APPENDIX: Pre-Existing Test Failures

**Status:** Documented but not blocking Homepage work  
**Note:** These failures existed before Homepage changes and are unrelated.

### Failing Tests
1. `tests/services/business-commission.test.ts` — Commission calculation edge cases
2. `tests/integration/seating-conflicts.test.ts` — Seating conflict resolution
3. `tests/integration/order-edge-cases.test.ts` — Order edge case handling

**Recommendation:** Address in separate test stabilization task after Homepage certification.

---

**End of Implementation Readiness Report**
