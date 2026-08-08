# HOMEPAGE_DECISION_MATRIX — Founder Acceptance

**Date:** 2026-06-30  
**Purpose:** Classify every Homepage recommendation by decision owner

---

## Classification Categories

| Category | Owner | Requires Founder Approval | Examples |
|---|---|:---:|---|
| **A - Engineering Fix** | Engineering | No | Broken links, routing errors, technical bugs |
| **B - Product Decision** | Founder | Yes | Navigation visibility, feature emphasis, UX flow |
| **C - Marketing Decision** | Founder | Yes | Headlines, messaging, value propositions |
| **D - Business Strategy** | Founder | Yes | Pricing, launch offers, sales process, market positioning |

---

## P0 Recommendations (Must-Fix Before Certification)

### P0-1: Remove Dashboard Links from Public Navigation

**Recommendation:** Remove `/dashboard/site-builder` and `/dashboard/profile` from Solutions dropdown.

**Evidence:** First-time visitors click these links and hit authentication walls.

**Classification:** **A - Engineering Fix**

**Reasoning:**  
This is an objective implementation error. Public navigation should never link to authenticated-only routes. This is not a product decision about "should we have a Solutions dropdown?" — it's a fix for broken links.

**Owner:** Engineering  
**Requires Founder Approval:** No  
**Priority:** P0  
**Risk:** Low (removes broken links)  
**Complexity:** Low (1-2 hours)  
**Implementation:** Remove two links from navigation dropdown

---

### P0-2: Fix Hardcoded Rwanda-Specific Content

**Recommendation:** Replace hardcoded "1,000 RWF", "MTN MoMo and Airtel Money", and WhatsApp number with configurable values.

**Evidence:** Violates Global-by-Design philosophy.

**Classification:** **Mixed**
- Hardcoded currency/providers: **A - Engineering Fix** (architectural violation)
- Specific wording choices: **C - Marketing Decision** (how to phrase it)

**Breakdown:**

#### P0-2a: Remove Hardcoded Currency
**Classification:** A - Engineering Fix  
**Owner:** Engineering  
**Requires Founder Approval:** No (architectural requirement)  
**Priority:** P0  
**Risk:** Low  
**Complexity:** Medium (2-3 hours)

#### P0-2b: Remove Hardcoded Payment Providers
**Classification:** A - Engineering Fix  
**Owner:** Engineering  
**Requires Founder Approval:** No (architectural requirement)  
**Priority:** P0  
**Risk:** Low  
**Complexity:** Low (1 hour)

#### P0-2c: Make Contact Information Configurable
**Classification:** A - Engineering Fix  
**Owner:** Engineering  
**Requires Founder Approval:** No (architectural requirement)  
**Priority:** P0  
**Risk:** Low  
**Complexity:** Low (1 hour)

---

### P0-3: Add Trust Signals (Social Proof)

**Recommendation:** Add testimonials, customer logos, or trust statements.

**Evidence:** No social proof visible; reduces conversion.

**Classification:** **B - Product Decision** + **C - Marketing Decision**

**Breakdown:**

#### P0-3a: Add Trust Statement
**Example:** "14-day free trial • No credit card required • Cancel anytime"  
**Classification:** C - Marketing Decision  
**Owner:** Founder  
**Requires Founder Approval:** Yes  
**Priority:** P0  
**Risk:** Low  
**Complexity:** Trivial (10 minutes)

#### P0-3b: Add Customer Testimonials
**Classification:** B - Product Decision + C - Marketing Decision  
**Owner:** Founder  
**Requires Founder Approval:** Yes (content + placement)  
**Priority:** P0  
**Risk:** Medium (requires real testimonials)  
**Complexity:** Medium (2-4 hours, depends on content availability)

#### P0-3c: Add "Trusted by X restaurants"
**Classification:** C - Marketing Decision  
**Owner:** Founder  
**Requires Founder Approval:** Yes (must be factually true)  
**Priority:** P0  
**Risk:** High (if number is inaccurate)  
**Complexity:** Trivial (if true)

---

### P0-4: Increase Hero Carousel Interval

**Recommendation:** Increase from 5 seconds to 7-8 seconds.

**Evidence:** Users may not finish reading before auto-advance.

**Classification:** **A - Engineering Fix**

**Reasoning:**  
This is a UX best practice. 5 seconds is objectively too fast for reading comprehension. This is not a product decision about "should we have a carousel?" — it's a fix for poor timing.

**Owner:** Engineering  
**Requires Founder Approval:** No  
**Priority:** P0  
**Risk:** None  
**Complexity:** Trivial (5 minutes)  
**Implementation:** Change interval from 5000ms to 7000ms

---

### P0-5: Add Urgency to "Launch Special" Badge

**Recommendation:** Add expiration date or customer limit.

**Evidence:** No urgency; reduces conversion.

**Classification:** **D - Business Strategy Decision**

**Reasoning:**  
This is a commercial decision about launch pricing strategy. Engineering cannot decide:
- When the launch special ends
- How many customers qualify
- Whether to show urgency at all

**Owner:** Founder  
**Requires Founder Approval:** Yes  
**Priority:** P0  
**Risk:** Medium (if deadline is missed or inaccurate)  
**Complexity:** Trivial (10 minutes, once decision is made)

**Founder Must Decide:**
- [ ] Add expiration date (when?)
- [ ] Add customer limit (how many?)
- [ ] Add both
- [ ] Remove launch special entirely
- [ ] Keep as-is

---

### P0-6: Verify "Book a Demo" CTA is Supported

**Recommendation:** Verify demo booking is operational or remove CTA.

**Evidence:** If demos are not supported, this creates a broken promise.

**Classification:** **D - Business Strategy Decision**

**Reasoning:**  
This is a sales process decision. Engineering cannot decide:
- Whether demos should be offered
- Who handles demos
- What the demo booking flow should be

**Owner:** Founder  
**Requires Founder Approval:** Yes  
**Priority:** P0  
**Risk:** High (if CTA leads nowhere)  
**Complexity:** Low (1 hour to remove) or High (to implement booking system)

**Founder Must Decide:**
- [ ] Demos ARE supported — keep button
- [ ] Demos are NOT supported — remove button
- [ ] Replace with "Contact Sales"
- [ ] Replace with "Chat with Us"

---

### P0-7: Remove or Fix "Explore Businesses Near You" CTA

**Recommendation:** Remove CTA or fix Discover page localization bugs.

**Evidence:** Discover page hardcodes Rwanda cities.

**Classification:** **B - Product Decision** + **A - Engineering Fix**

**Breakdown:**

#### P0-7a: Decide Discover Visibility
**Classification:** B - Product Decision  
**Owner:** Founder  
**Requires Founder Approval:** Yes  
**Priority:** P0  
**Risk:** Medium  
**Complexity:** N/A (decision only)

**Founder Must Decide:**
- [ ] Keep Discover visible — fix bugs first
- [ ] Hide Discover from RC1
- [ ] Keep as-is (acceptable for RC1)

#### P0-7b: Fix Discover Localization Bugs
**Classification:** A - Engineering Fix  
**Owner:** Engineering  
**Requires Founder Approval:** No (if Discover is kept visible)  
**Priority:** P0 (if Discover is visible)  
**Risk:** Medium  
**Complexity:** High (4-8 hours)

---

## P1 Recommendations (Should-Fix for Credible RC1)

### P1-1: Improve Hero Messaging Differentiation

**Recommendation:** Revise "Turn Every Table Into Faster Revenue" for stronger differentiation.

**Evidence:** Generic; competitors say similar things.

**Classification:** **C - Marketing Decision**

**Owner:** Founder  
**Requires Founder Approval:** Yes  
**Priority:** P1  
**Risk:** Medium (messaging is subjective)  
**Complexity:** Low (1-2 hours copywriting + implementation)

---

### P1-2: Clarify Subheadline

**Recommendation:** Replace "Be Seen. Get Orders. Grow Fast." with more concrete value.

**Evidence:** Too abstract.

**Classification:** **C - Marketing Decision**

**Owner:** Founder  
**Requires Founder Approval:** Yes  
**Priority:** P1  
**Risk:** Low  
**Complexity:** Trivial (10 minutes)

---

### P1-3: Make "Built for restaurants..." More Prominent

**Recommendation:** Increase font size and contrast.

**Evidence:** Critical positioning is buried.

**Classification:** **A - Engineering Fix** (UX improvement)

**Owner:** Engineering  
**Requires Founder Approval:** No  
**Priority:** P1  
**Risk:** None  
**Complexity:** Trivial (5 minutes)

---

### P1-4: Reduce Features Section to 6-8 Core Features

**Recommendation:** Show only 6-8 features instead of 12.

**Evidence:** Cognitive overload.

**Classification:** **B - Product Decision**

**Owner:** Founder  
**Requires Founder Approval:** Yes (which features to keep?)  
**Priority:** P1  
**Risk:** Low  
**Complexity:** Low (1 hour)

---

### P1-5: Remove or Label Unready "Advanced Features"

**Recommendation:** Verify each advanced feature is ready for RC1 or label as "Beta"/"Coming Soon".

**Evidence:** May overpromise if features are not functional.

**Classification:** **B - Product Decision**

**Owner:** Founder  
**Requires Founder Approval:** Yes (which features are ready?)  
**Priority:** P1  
**Risk:** High (if features are not ready)  
**Complexity:** Medium (2-4 hours, depends on verification)

**Founder Must Verify:**
- [ ] Hotel Mode: Ready for RC1?
- [ ] Site Builder: Ready for RC1?
- [ ] AI Menu Builder: Ready for RC1?
- [ ] Discovery Marketplace: Ready for RC1?
- [ ] Referral Program: Ready for RC1?

---

### P1-6: Make Pricing Currency Configurable

**Recommendation:** Display currency based on locale or add currency selector.

**Evidence:** Hardcoded RWF violates Global-by-Design.

**Classification:** **A - Engineering Fix** (architectural requirement)

**Owner:** Engineering  
**Requires Founder Approval:** No  
**Priority:** P1  
**Risk:** Medium (affects pricing display)  
**Complexity:** Medium (3-5 hours)

---

### P1-7 & P1-8: Replace Dashboard Links in Feature Sections

**Recommendation:** Remove links from "Real-Time OS" and "Growth & Retention" cards.

**Evidence:** First-time visitors hit authentication walls.

**Classification:** **A - Engineering Fix**

**Owner:** Engineering  
**Requires Founder Approval:** No  
**Priority:** P1  
**Risk:** Low  
**Complexity:** Low (1-2 hours)

---

### P1-9: Decide Store/Discover Visibility for RC1

**Recommendation:** Decide if Store and Discover should be visible in RC1.

**Evidence:** Deployment availability decision.

**Classification:** **B - Product Decision** + **D - Business Strategy Decision**

**Owner:** Founder  
**Requires Founder Approval:** Yes  
**Priority:** P1  
**Risk:** Medium  
**Complexity:** Low (1 hour to hide) or High (to fix)

**Founder Must Decide:**
- [ ] Store: Keep visible or hide?
- [ ] Discover: Keep visible or hide?

---

### P1-10: Verify Mobile Responsiveness

**Recommendation:** Test Homepage on actual mobile devices.

**Evidence:** Not verified yet.

**Classification:** **A - Engineering Fix** (QA/testing)

**Owner:** Engineering  
**Requires Founder Approval:** No  
**Priority:** P1  
**Risk:** Medium (mobile UX issues)  
**Complexity:** Medium (2-4 hours)

---

### P1-11: PWA Install Button Placement

**Recommendation:** Show PWA install only after signup or make less prominent.

**Evidence:** May distract from trial signup.

**Classification:** **B - Product Decision**

**Owner:** Founder  
**Requires Founder Approval:** Yes  
**Priority:** P1  
**Risk:** Low  
**Complexity:** Low (1 hour)

---

### P1-12: Newsletter Signup Placement

**Recommendation:** Place newsletter signup in footer or after pricing.

**Evidence:** May compete with trial signup CTA.

**Classification:** **B - Product Decision**

**Owner:** Founder  
**Requires Founder Approval:** Yes  
**Priority:** P1  
**Risk:** Low  
**Complexity:** Low (1 hour)

---

## P2 Recommendations (Nice-to-Have)

### P2-1: Add Tooltip to Dark Mode Toggle

**Classification:** A - Engineering Fix  
**Owner:** Engineering  
**Requires Founder Approval:** No  
**Priority:** P2  
**Risk:** None  
**Complexity:** Trivial (10 minutes)

---

### P2-2: Improve Language Switcher Visibility

**Classification:** A - Engineering Fix  
**Owner:** Engineering  
**Requires Founder Approval:** No  
**Priority:** P2  
**Risk:** None  
**Complexity:** Low (1 hour)

---

### P2-3: Verify Cookie Consent Banner

**Classification:** A - Engineering Fix (compliance/QA)  
**Owner:** Engineering  
**Requires Founder Approval:** No  
**Priority:** P2  
**Risk:** Low  
**Complexity:** Low (30 minutes)

---

## Summary by Category

| Category | Count | Requires Founder Approval | Can Implement Immediately |
|---|---:|:---:|:---:|
| **A - Engineering Fix** | 12 | No | Yes (after general approval) |
| **B - Product Decision** | 6 | Yes | No |
| **C - Marketing Decision** | 4 | Yes | No |
| **D - Business Strategy** | 3 | Yes | No |
| **Mixed** | 3 | Partial | Partial |

---

## Implementation Groups

### Group 1: Engineering Fixes (Immediately Implementable)

**Can be implemented after general Founder approval:**

| ID | Recommendation | Priority | Effort |
|---|---|---:|---|
| P0-1 | Remove dashboard links from navigation | P0 | 1-2h |
| P0-2a | Remove hardcoded currency | P0 | 2-3h |
| P0-2b | Remove hardcoded payment providers | P0 | 1h |
| P0-2c | Make contact information configurable | P0 | 1h |
| P0-4 | Increase carousel interval | P0 | 5min |
| P1-3 | Make "Built for restaurants..." more prominent | P1 | 5min |
| P1-6 | Make pricing currency configurable | P1 | 3-5h |
| P1-7 | Remove dashboard links from Real-Time OS cards | P1 | 1h |
| P1-8 | Remove dashboard links from Growth cards | P1 | 1h |
| P1-10 | Verify mobile responsiveness | P1 | 2-4h |
| P2-1 | Add tooltip to dark mode toggle | P2 | 10min |
| P2-2 | Improve language switcher visibility | P2 | 1h |
| P2-3 | Verify cookie consent banner | P2 | 30min |

**Total Effort:** 12-20 hours

---

### Group 2: Founder Decisions Required

**Cannot be implemented until Founder decides:**

| ID | Recommendation | Decision Required | Priority |
|---|---|---|---:|
| P0-3 | Add trust signals | Which trust signals? Content? | P0 |
| P0-5 | Add urgency to Launch Special | Expiration date? Customer limit? | P0 |
| P0-6 | Verify Book Demo CTA | Keep or remove? | P0 |
| P0-7a | Decide Discover visibility | Keep or hide? | P0 |
| P1-1 | Improve hero messaging | New headline? | P1 |
| P1-2 | Clarify subheadline | New subheadline? | P1 |
| P1-4 | Reduce features section | Which 6-8 features to keep? | P1 |
| P1-5 | Remove/label unready features | Which features are ready? | P1 |
| P1-9 | Decide Store/Discover visibility | Keep or hide? | P1 |
| P1-11 | PWA install placement | Show when? | P1 |
| P1-12 | Newsletter placement | Where to place? | P1 |

---

*End of Homepage Decision Matrix.*
