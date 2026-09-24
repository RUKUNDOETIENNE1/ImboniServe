# HOMEPAGE_CERTIFICATION_REPORT — Founder Acceptance

**Date:** 2026-06-30  
**Production URL:** https://imboniserve.com  
**Review Method:** Production screenshots + repository code analysis  
**Reviewer Role:** First-time restaurant owner discovering ImboniServe

---

## Executive Summary

The Homepage **successfully communicates the core value proposition** but has **7 P0 issues** and **12 P1 issues** that must be addressed before certification.

### Certification Verdict

**Status:** ❌ **NOT CERTIFIED** (P0 issues present)

### Core Question: Would a restaurant owner immediately understand?

| Question | Answer | Evidence |
|---|---|---|
| What ImboniServe is | ✅ YES | "Turn Every Table Into Faster Revenue" + "Restaurant & Hotel Management Platform" |
| Who it is for | ✅ YES | "Built for restaurants, hotels, bars, and cafés" |
| Why it is different | ⚠️ PARTIAL | Strong feature list, but lacks differentiation from competitors |
| Why they should trust it | ❌ NO | No testimonials, no customer logos, no social proof |
| What they should do next | ✅ YES | Clear CTAs: "Start 14-Day Free Trial" + "Book a Demo" |

---

## P0 Issues (Must-Fix Before Certification)

### 1. **Solutions Dropdown Links to Dashboard-Only Routes**
**Evidence:** Production screenshot shows "Solutions" dropdown in navigation. Repository confirms it links to `/dashboard/site-builder` and `/dashboard/profile`.

**Issue:**  
First-time visitors click "Site Builder" or "List Your Business" and hit authentication walls. This breaks trust immediately.

**Impact:** High — creates confusion and friction at the top of the funnel.

**Recommendation:** Remove dashboard links from public navigation or replace with public landing pages.

---

### 2. **Hardcoded Rwanda-Specific Content (Localization Bug)**
**Evidence:** Repository shows:
- "1,000 RWF per referral" (line 99, 164)
- "MTN MoMo and Airtel Money" (line 123)
- Hardcoded WhatsApp number: `wa.me/250735214496` (line 449)

**Issue:**  
Violates Global-by-Design philosophy. These are localization concerns, not platform constants.

**Impact:** High — implies geographic restriction where none exists.

**Recommendation:**  
- Replace "1,000 RWF" with configurable reward amounts or remove currency reference
- Replace "MTN/Airtel" with "Mobile Money" (generic)
- Make contact information configurable

---

### 3. **No Trust Signals (Social Proof Missing)**
**Evidence:** Production screenshots show no testimonials, customer logos, case studies, or trust badges.

**Issue:**  
Restaurant owners are risk-averse. Without social proof, conversion rates will suffer.

**Impact:** High — directly affects trial signup rates.

**Recommendation:**  
Add one of:
- Customer testimonials (even 1-2 pilot customers)
- "Trusted by X restaurants" (if true)
- Security/compliance badges
- "14-day free trial, no credit card required" trust statement

---

### 4. **Hero Carousel Auto-Advances Too Fast**
**Evidence:** Repository shows 5-second interval (line 223).

**Issue:**  
Users may not finish reading slide 1 before it advances. This creates cognitive friction.

**Impact:** Medium-High — reduces message comprehension.

**Recommendation:** Increase interval to 7-8 seconds or add manual pause on hover.

---

### 5. **"Launch Special — 50% OFF All Plans" Lacks Urgency/Clarity**
**Evidence:** Production screenshot shows badge but no expiration date or terms.

**Issue:**  
Visitors don't know if this is a limited-time offer or permanent pricing. Reduces urgency.

**Impact:** Medium-High — affects conversion optimization.

**Recommendation:**  
- Add expiration date: "Launch Special — 50% OFF Until July 31"
- Or clarify: "Launch Special — 50% OFF for First 100 Customers"

---

### 6. **"Book a Demo" CTA May Not Be Appropriate for RC1**
**Evidence:** Production screenshot shows "Book a Demo" button prominently.

**Issue:**  
If demos are not yet operationally supported (no demo team, no demo script, no demo calendar), this creates a broken promise.

**Impact:** High — if clicked and leads nowhere or to a broken flow.

**Recommendation:**  
- If demos are supported: Keep it.
- If demos are not supported: Replace with "Contact Sales" or "Chat with Us" or remove entirely.

---

### 7. **"Explore Businesses Near You" CTA Links to Discover (Hardcoded Cities)**
**Evidence:** Production screenshot shows CTA. Repository confirms `/discover` hardcodes Rwanda cities.

**Issue:**  
Discover page has hardcoded city list (Kigali, Musanze, etc.), which is a localization bug.

**Impact:** Medium-High — if this CTA is visible, it implies geographic restriction.

**Recommendation:**  
- Remove "Explore Businesses Near You" CTA until Discover is fixed
- Or fix Discover to derive cities dynamically from business data

---

## P1 Issues (Should-Fix for Credible RC1)

### 8. **Hero Messaging Lacks Differentiation**
**Current:** "Turn Every Table Into Faster Revenue"

**Issue:**  
Generic. Competitors (Toast, Square, Lightspeed) say similar things.

**Recommendation:**  
Add a unique angle:
- "The Only Restaurant OS Built for [specific market]"
- "QR Ordering + AI Insights + Mobile Money — All in One"
- "From Order to Profit in Real-Time"

---

### 9. **Subheadline is Vague**
**Current:** "Be Seen. Get Orders. Grow Fast."

**Issue:**  
Too abstract. Doesn't explain *how* ImboniServe delivers this.

**Recommendation:**  
Replace with concrete value:
- "QR ordering, POS, inventory, and AI insights in one platform"
- "Reduce wait times, serve more customers, streamline operations"

---

### 10. **"Built for restaurants, hotels, bars, and cafés" is Buried**
**Evidence:** Production screenshot shows this text is small and low-contrast.

**Issue:**  
This is critical positioning ("who is this for?") but it's easy to miss.

**Recommendation:**  
Make this more prominent — larger font, higher contrast, or move closer to headline.

---

### 11. **Features Section Lists 12 Features (Overwhelming)**
**Evidence:** Repository shows 12 feature cards (lines 65-138).

**Issue:**  
Cognitive overload. Visitors won't read all 12.

**Recommendation:**  
- Reduce to 6-8 core features
- Or group into categories: "Core Operations" vs "Growth Tools"

---

### 12. **"Advanced Features" Section May Overpromise**
**Evidence:** Repository lists Hotel Mode, Site Builder, AI Menu Builder, Discovery Marketplace, Referral Program (lines 140-171).

**Issue:**  
If these are not fully functional in RC1, this creates broken promises.

**Recommendation:**  
- Remove features not ready for RC1
- Or clearly label as "Coming Soon" or "Beta"

---

### 13. **Pricing Section Shows RWF Currency (Hardcoded)**
**Evidence:** Repository shows `monthlyPriceRWF` and `annualTotalRWF` (lines 58-63).

**Issue:**  
Violates Global-by-Design philosophy. Currency should be configurable.

**Recommendation:**  
- Display currency based on user locale or business configuration
- Or show "Starting from $X" (USD equivalent) with currency selector

---

### 14. **"Real-Time Operating System" Section Links to Dashboard Routes**
**Evidence:** Repository shows links like `/dashboard/qr-analytics`, `/dashboard/tables` (lines 259-281).

**Issue:**  
These links require authentication. First-time visitors will hit login walls.

**Recommendation:**  
- Replace with anchor links to feature explanations
- Or remove links entirely (make cards informational only)

---

### 15. **"Growth & Retention" Section Links to Dashboard Routes**
**Evidence:** Repository shows links like `/dashboard/crm`, `/dashboard/campaigns`, `/dashboard/ab-testing` (lines 289-327).

**Issue:**  
Same as #14 — authentication walls for first-time visitors.

**Recommendation:**  
- Replace with anchor links or remove links
- Or add "Sign up to access" messaging

---

### 16. **Footer Links to "Store" and "Discover" (Deployment Availability Decision)**
**Evidence:** Production screenshot shows these in navigation.

**Issue:**  
If Store/Discover are not part of RC1 deployment availability, they should be hidden.

**Recommendation:**  
- Founder decision: Are Store/Discover visible in RC1?
- If no: Remove from navigation
- If yes: Ensure they work correctly

---

### 17. **No Mobile Screenshot Verification**
**Evidence:** Review based on desktop screenshots only.

**Issue:**  
Mobile experience not verified. Hero, CTAs, navigation may have issues on mobile.

**Recommendation:**  
- Verify mobile responsiveness on actual devices
- Test CTA placement, button sizes, text readability

---

### 18. **"Install App" Button Visibility**
**Evidence:** Repository shows PWA install prompt (line 51).

**Issue:**  
If visible on first visit, this may distract from trial signup.

**Recommendation:**  
- Show PWA install only after signup or after X visits
- Or make it less prominent (small icon vs large button)

---

### 19. **Newsletter Signup Placement**
**Evidence:** Repository shows NewsletterSignup component (line 54).

**Issue:**  
If placed too early (above the fold), it competes with trial signup CTA.

**Recommendation:**  
- Place newsletter signup in footer or after pricing section
- Ensure it doesn't distract from primary CTA

---

## P2 Issues (Nice-to-Have)

### 20. **Dark Mode Toggle May Confuse First-Time Visitors**
**Evidence:** Production screenshot shows sun/moon icon in header.

**Issue:**  
First-time visitors may not understand what this icon does.

**Recommendation:**  
- Add tooltip: "Toggle Dark Mode"
- Or hide dark mode toggle until after signup

---

### 21. **Language Switcher Placement**
**Evidence:** Production screenshot shows "EN" dropdown in header.

**Issue:**  
Placement is good, but may be missed by non-English speakers.

**Recommendation:**  
- Add flag icons for visual clarity
- Or make language switcher more prominent

---

### 22. **Cookie Consent Banner Not Visible in Screenshots**
**Evidence:** Repository shows CookieConsentBanner component (line 52).

**Issue:**  
If not visible, this may be a compliance risk (GDPR, etc.).

**Recommendation:**  
- Verify cookie banner shows on first visit
- Ensure it's not blocking CTAs

---

## Global-by-Design Alignment

### ✅ Correct
- Hero messaging does not imply geographic restriction
- Feature descriptions are universal (POS, QR ordering, inventory, etc.)
- No hardcoded tax rates or fiscal compliance claims

### ❌ Violations
- Hardcoded "1,000 RWF" reward amounts
- Hardcoded "MTN/Airtel" payment providers
- Hardcoded Rwanda WhatsApp number
- Hardcoded RWF currency in pricing

### Recommendation
Replace all hardcoded localization with configurable values or generic wording.

---

## Conversion Journey Analysis

### Landing (Hero Section)
**Experience:** ✅ Strong — clear headline, visual appeal, multiple CTAs

**Friction Points:**
- Hero carousel advances too fast (5 seconds)
- No trust signals (social proof missing)

---

### Reading (Features Section)
**Experience:** ⚠️ Overwhelming — 12 features + 6 advanced features

**Friction Points:**
- Too many features to process
- Some features may not be ready for RC1

---

### Understanding (Value Proposition)
**Experience:** ✅ Clear — "Restaurant Operating System" is well-communicated

**Friction Points:**
- Lacks differentiation from competitors
- Subheadline is vague

---

### Interest (Pricing Section)
**Experience:** ✅ Good — pricing is transparent, multiple plans shown

**Friction Points:**
- Hardcoded RWF currency
- "Launch Special" lacks urgency/clarity

---

### Action (CTAs)
**Experience:** ✅ Strong — multiple CTAs (Start Trial, Book Demo, Explore Businesses)

**Friction Points:**
- "Book Demo" may not be supported
- "Explore Businesses" links to broken Discover page
- Dashboard links in feature sections hit auth walls

---

## Mobile Experience (Pending Verification)

**Status:** ⚠️ **NOT VERIFIED** — No mobile screenshots provided

**Required Verification:**
- Hero section readability on mobile
- CTA button sizes and placement
- Navigation menu usability
- Feature cards layout
- Pricing table responsiveness
- Footer link accessibility

**Recommendation:** Test on actual mobile devices before certification.

---

## Summary of Recommendations

| Priority | Count | Category |
|---|---:|---|
| P0 | 7 | Navigation, localization, trust signals, CTAs |
| P1 | 12 | Messaging, features, links, currency |
| P2 | 3 | Dark mode, language switcher, cookie banner |

**Total Issues:** 22

---

## Certification Checklist

- [ ] Remove dashboard links from public navigation (P0)
- [ ] Fix hardcoded localization (RWF, MTN/Airtel, WhatsApp) (P0)
- [ ] Add trust signals (testimonials, social proof) (P0)
- [ ] Increase hero carousel interval to 7-8 seconds (P0)
- [ ] Add urgency to "Launch Special" badge (P0)
- [ ] Verify "Book Demo" CTA is supported or remove (P0)
- [ ] Remove "Explore Businesses" CTA or fix Discover page (P0)
- [ ] Improve hero messaging differentiation (P1)
- [ ] Clarify subheadline (P1)
- [ ] Make "Built for restaurants..." more prominent (P1)
- [ ] Reduce features section to 6-8 core features (P1)
- [ ] Remove/label unready "Advanced Features" (P1)
- [ ] Make pricing currency configurable (P1)
- [ ] Replace dashboard links in feature sections (P1)
- [ ] Verify mobile responsiveness (P1)
- [ ] Decide Store/Discover visibility (P1)

---

*End of Homepage Certification Report.*
