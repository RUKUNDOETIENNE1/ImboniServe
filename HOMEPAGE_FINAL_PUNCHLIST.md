# HOMEPAGE_FINAL_PUNCHLIST — RC1

**Date:** 2026-06-30  
**Status:** Pending Founder Review  
**Version:** RC1 (`release/v1.0.0-rc1`)

---

## PURPOSE

This document lists only the remaining improvements needed before Homepage approval.

**No implementation will occur until Founder explicitly approves each item.**

---

## P0 — MUST FIX BEFORE APPROVAL

### P0-1: Remove "Launch Special" Badge Confusion

**Issue:**
Hero section still shows "Launch Special — 50% OFF All Plans" badge, but the actual offer is the Founding Restaurant Program (50% lifetime discount, limited to 100 restaurants).

**Customer Impact:**
Two different discount messages create confusion. User doesn't know which offer is real.

**Location:**
`src/pages/index.tsx` — Hero section (likely around line 600-650)

**Recommendation:**
Remove the "Launch Special" badge entirely, OR replace with "Founding Restaurant Program — Limited to 100 Restaurants"

**Effort:** 5 minutes

---

### P0-2: Verify Mobile Experience

**Issue:**
Mobile experience has not been verified on actual devices. Code review suggests potential issues:
- Hero carousel may advance too quickly on mobile
- Product Trust section (6 cards) may be too long when stacked vertically
- Founding Program section (4 cards) may be cramped
- Multiple CTAs in hero may have touch target issues
- Navigation dropdown may be difficult to use

**Customer Impact:**
If mobile experience feels cramped, slow, or unpolished, users abandon. Mobile traffic is significant.

**Required Testing:**
Test on actual mobile devices (iPhone, Android) at these widths:
- 320px (iPhone SE)
- 375px (iPhone 12/13)
- 414px (iPhone 12 Pro Max)

**Verification Checklist:**
- [ ] Hero carousel is usable (not too fast, dots are tappable)
- [ ] All CTAs are tappable (44x44px minimum touch targets)
- [ ] Product Trust cards are readable (not cramped)
- [ ] Founding Program section is scannable
- [ ] Navigation works smoothly
- [ ] No horizontal scroll
- [ ] Typography is readable (minimum 16px for body text)
- [ ] Spacing feels premium (not cramped)
- [ ] Page loads quickly (< 3 seconds on 3G)

**Recommendation:**
Deploy to Vercel preview URL and test on actual devices before final approval.

**Effort:** 30-60 minutes (testing + any fixes)

---

### P0-3: Connect Pricing Preview to Founding Program

**Issue:**
Pricing preview shows regular starting price (15,000), but Founding Restaurant Program offers 50% lifetime discount. No connection between the two sections.

**Customer Impact:**
User sees regular pricing, decides it's too expensive, and leaves before discovering the 50% lifetime offer.

**Location:**
`src/pages/index.tsx` — Pricing preview section (likely around line 1000-1100)

**Recommendation:**
Add a subtle note in the pricing preview:

```
Starting at [currency] 15,000/month

[Existing content]

Note: Founding Restaurant Program members receive 50% lifetime discount — see below ↓
```

**Effort:** 10 minutes

---

## P1 — STRONG RECOMMENDATIONS

### P1-1: Change "Built on Operational Truth" Heading

**Issue:**
"Operational Truth" is internal jargon. Customers don't think in these terms.

**Customer Impact:**
Product Trust section heading feels abstract or confusing.

**Location:**
`src/pages/index.tsx` — Product Trust section heading

**Current:**
"Built on Operational Truth"

**Recommended Alternatives:**
- "Why Restaurant Owners Trust ImboniServe"
- "Built for Accuracy and Control"
- "Operational Capabilities You Can Count On"

**Effort:** 2 minutes

---

### P1-2: Increase Hero Slide 1 Timing

**Issue:**
Hero carousel advances every 7 seconds. Slide 1 has the most comprehensive description and the key "Operating System for Hospitality" positioning. Users may not finish reading before it advances.

**Customer Impact:**
Users miss the key differentiation message.

**Location:**
`src/pages/index.tsx` — Hero carousel auto-advance timing

**Current:**
7 seconds for all slides

**Recommendation:**
- Option A: Increase slide 1 to 10 seconds, keep others at 7 seconds
- Option B: Pause auto-advance on first visit (resume after user manually navigates)
- Option C: Increase all slides to 10 seconds

**Effort:** 10 minutes

---

### P1-3: Move Product Trust Section Earlier

**Issue:**
Product Trust section appears after Features section (late in the page). Trust-building happens too late in the customer journey.

**Customer Impact:**
Users may not scroll far enough to see trust signals before deciding to leave.

**Location:**
`src/pages/index.tsx` — Product Trust section placement

**Current Sequence:**
Hero → Real-Time OS → Growth Engines → Supplier Marketplace → Video → How It Works → Features → **Product Trust** → Pricing → Founding Program

**Recommended Sequence:**
Hero → **Product Trust** → Real-Time OS → Growth Engines → Features → How It Works → Pricing → Founding Program

OR

Hero → How It Works → **Product Trust** → Features → Real-Time OS → Growth Engines → Pricing → Founding Program

**Effort:** 5 minutes (cut/paste section)

---

### P1-4: Reduce Feature Overload

**Issue:**
Homepage has 12 features + 3 carousels (Real-Time OS, Growth Engines, Hero) + 5 advanced features = cognitive overload.

**Customer Impact:**
Users feel overwhelmed and may leave without understanding the core value proposition.

**Location:**
`src/pages/index.tsx` — Features section

**Current:**
12 feature cards

**Recommendation:**
- Option A: Reduce to 8 core features (most important)
- Option B: Group into categories (e.g., "Customer Experience", "Operations", "Growth")
- Option C: Show 6 features by default, "See More" button to expand

**Effort:** 15-30 minutes (depending on approach)

---

### P1-5: Simplify Hero Description (Slide 1)

**Issue:**
Hero slide 1 description is comprehensive but potentially overwhelming:

"Bringing together orders, kitchen operations, inventory, procurement, payments, QR ordering, AI, and reporting with configurable localization for every market."

**Customer Impact:**
Too technical. Users may not absorb the message in 7-10 seconds.

**Location:**
`src/pages/index.tsx` — Hero slide 1 description

**Current:**
"Bringing together orders, kitchen operations, inventory, procurement, payments, QR ordering, AI, and reporting with configurable localization for every market."

**Recommendation:**
"Everything you need to run your restaurant — from orders to inventory to payments — in one intelligent platform."

OR

"One platform for orders, inventory, payments, and insights — built for restaurants that want to grow."

**Effort:** 2 minutes

---

### P1-6: Improve Product Trust Card Descriptions

**Issue:**
Some Product Trust card descriptions are slightly technical or feature-focused rather than benefit-focused.

**Customer Impact:**
Reduces emotional connection and trust-building effectiveness.

**Location:**
`src/pages/index.tsx` — Product Trust section card descriptions

**Recommendations:**

**"Fully Auditable Inventory"**
- Current: "Every inventory movement is tracked with timestamps, user attribution, and full audit trails."
- Suggested: "Never lose track of stock. Every movement is recorded with who, what, and when — complete accountability."

**"AI Built on Real Data"**
- Current: "AI insights and recommendations are based on your actual operational data, not generic industry averages."
- Suggested: "Get recommendations that actually work for your business — based on your real sales, not industry guesses."

**Effort:** 5 minutes

---

### P1-7: Add Founding Program Benefit Clarity

**Issue:**
"Shape Platform Development" benefit is slightly vague.

**Customer Impact:**
User doesn't understand what this actually means.

**Location:**
`src/pages/index.tsx` — Founding Restaurant Program section

**Current:**
"Your feedback and operational needs help guide future platform development."

**Recommendation:**
"Monthly feedback sessions with the Founder to prioritize features you need."

**Effort:** 2 minutes

---

## P2 — NICE IMPROVEMENTS

### P2-1: Add Advanced Features Plan Clarity

**Issue:**
"Advanced Features" section doesn't clarify which plans include these features.

**Customer Impact:**
User doesn't know if they need to upgrade to access these.

**Location:**
`src/pages/index.tsx` — Advanced Features section

**Recommendation:**
Add note above or below section:

"Available on Scale and Enterprise plans — see full pricing for details"

**Effort:** 2 minutes

---

### P2-2: Add Supplier Marketplace Timeline

**Issue:**
"Coming Soon — Early Access" doesn't indicate when.

**Customer Impact:**
User doesn't know if this is weeks or years away.

**Location:**
`src/pages/index.tsx` — Supplier Marketplace section

**Current:**
"Coming Soon — Early Access"

**Recommendation:**
If timeline is known, add it:
- "Coming Soon — Q3 2026"
- "Coming Soon — After RC1 Stabilization"

If timeline is unknown, keep as-is.

**Effort:** 2 minutes (if timeline is known)

---

### P2-3: Improve Business Discovery Value Proposition

**Issue:**
"Get discovered by customers searching for restaurants powered by ImboniServe" is vague.

**Customer Impact:**
User doesn't understand how this actually helps their business.

**Location:**
`src/pages/index.tsx` — Advanced Features section, Business Discovery card

**Current:**
"Get discovered by customers searching for restaurants powered by ImboniServe."

**Recommendation:**
"Get discovered by customers searching for restaurants — increase walk-ins and online orders."

**Effort:** 2 minutes

---

### P2-4: Improve Supplier Marketplace Value Proposition

**Issue:**
"Connect with trusted suppliers — all in one place" is good but could be more compelling.

**Customer Impact:**
Doesn't emphasize the business benefit.

**Location:**
`src/pages/index.tsx` — Supplier Marketplace section

**Current:**
"Connect with trusted suppliers — all in one place"

**Recommendation:**
"Connect with trusted suppliers — compare prices, track deliveries, and reduce procurement costs"

**Effort:** 2 minutes

---

### P2-5: Remove Trademark Symbol from "Smart Dining Slips™"

**Issue:**
Trademark symbol feels overly promotional and may not be legally registered.

**Customer Impact:**
Reduces trust, feels like marketing hype.

**Location:**
`src/pages/index.tsx` — Features section

**Current:**
"Smart Dining Slips™"

**Recommendation:**
"Smart Dining Slips" (remove ™)

**Effort:** 1 minute

---

### P2-6: Change "Even more in the box" Heading

**Issue:**
Casual and potentially unclear heading for Advanced Features section.

**Customer Impact:**
Doesn't convey professionalism.

**Location:**
`src/pages/index.tsx` — Advanced Features section heading

**Current:**
"Even more in the box"

**Recommendation:**
- "Advanced Capabilities"
- "Enterprise Features"
- "Built for Growth"

**Effort:** 2 minutes

---

### P2-7: Verify WhatsApp Support Operational Readiness

**Issue:**
"Talk to Our Team" CTA links to WhatsApp. If WhatsApp support is not actually staffed and responsive, this creates a broken promise.

**Customer Impact:**
User clicks "Talk to Our Team", gets no response, loses trust.

**Location:**
Operational verification (not code change)

**Recommendation:**
Before launch, verify:
- [ ] WhatsApp number is active
- [ ] Someone is monitoring and responding
- [ ] Response time is reasonable (< 24 hours, ideally < 2 hours during business hours)

If not ready, temporarily replace "Talk to Our Team" with "Contact Us" email form.

**Effort:** Operational verification (no code change unless support not ready)

---

### P2-8: Add Pricing Context

**Issue:**
Pricing preview shows starting price (15,000) but no context for whether this is expensive or affordable.

**Customer Impact:**
User may not know if this is a good deal.

**Location:**
`src/pages/index.tsx` — Pricing preview section

**Recommendation:**
Add subtle context below starting price:

"Less than the cost of one wasted ingredient order per month"

OR

"Pays for itself by reducing food waste and theft"

**Effort:** 5 minutes

---

### P2-9: Reduce Carousel Fatigue

**Issue:**
Three carousels in a row (Hero → Real-Time OS → Growth Engines) may cause carousel fatigue.

**Customer Impact:**
Important information may be skipped.

**Location:**
`src/pages/index.tsx` — Real-Time OS and Growth Engines sections

**Recommendation:**
- Option A: Make Real-Time OS and Growth Engines static sections with 2-3 cards each
- Option B: Add "See More" expansion instead of carousel
- Option C: Keep as-is (carousels are fine if content is compelling)

**Effort:** 30 minutes (if changing to static)

---

### P2-10: Verify Currency Formatting

**Issue:**
Pricing preview uses configured currency. Need to verify currency symbol is displayed correctly according to local conventions.

**Customer Impact:**
Incorrect currency formatting reduces trust.

**Location:**
`src/pages/index.tsx` — Pricing preview section

**Recommendation:**
Verify currency formatting matches local conventions:
- Rwanda: "RWF 15,000" or "15,000 RWF"?
- USD: "$15,000" or "15,000 USD"?
- EUR: "€15,000" or "15,000 EUR"?

Test with different configured currencies.

**Effort:** 10 minutes (testing)

---

## SUMMARY

### P0 (Must Fix Before Approval): 3 items
1. Remove "Launch Special" badge confusion
2. Verify mobile experience
3. Connect pricing preview to Founding Program

### P1 (Strong Recommendations): 7 items
4. Change "Built on Operational Truth" heading
5. Increase hero slide 1 timing
6. Move Product Trust section earlier
7. Reduce feature overload
8. Simplify hero description
9. Improve Product Trust card descriptions
10. Add Founding Program benefit clarity

### P2 (Nice Improvements): 10 items
11. Add advanced features plan clarity
12. Add Supplier Marketplace timeline
13. Improve Business Discovery value proposition
14. Improve Supplier Marketplace value proposition
15. Remove trademark symbol from "Smart Dining Slips™"
16. Change "Even more in the box" heading
17. Verify WhatsApp support operational readiness
18. Add pricing context
19. Reduce carousel fatigue
20. Verify currency formatting

---

## NEXT STEPS

1. **Founder reviews punchlist**
2. **Founder approves/rejects each item**
3. **Engineering implements approved items**
4. **Re-review and final approval**

---

**No implementation will occur until Founder explicitly approves.**
