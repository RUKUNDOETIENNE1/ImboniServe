# HOMEPAGE_FOUNDER_DECISIONS — Decision Queue

**Date:** 2026-06-30  
**Purpose:** Isolated list of decisions requiring Founder judgment

---

## Instructions

This document contains **only** the decisions that require your judgment.

Engineering **cannot** make these decisions.

Each decision is independent — you can approve some and reject others.

**Implementation will not begin until you provide answers.**

---

## Decision 1: Trust Signals (P0)

**Context:** The Homepage currently has no testimonials, customer logos, or social proof. This reduces conversion rates.

**Question:** Which trust signals should we add?

### Option A: Trust Statement Only (Minimal)
Add below hero CTA:
> "14-day free trial • No credit card required • Cancel anytime"

- [ ] **Approve Option A**
- [ ] **Reject Option A**

---

### Option B: Customer Testimonials (Better)
Add testimonial section after features.

**Required from you:**
- 2-3 customer testimonials (name, restaurant name, quote)
- Permission to use their names/restaurants publicly

- [ ] **Approve Option B** (I will provide testimonials)
- [ ] **Reject Option B** (not ready yet)

**If approved, provide testimonials here:**

Testimonial 1:
- Customer Name: _______________
- Restaurant Name: _______________
- Quote: _______________

Testimonial 2:
- Customer Name: _______________
- Restaurant Name: _______________
- Quote: _______________

Testimonial 3 (optional):
- Customer Name: _______________
- Restaurant Name: _______________
- Quote: _______________

---

### Option C: "Trusted by X restaurants" (Best, if true)
Add statement:
> "Trusted by [X] restaurants across [region/globally]"

**Required from you:**
- Accurate number of active customers
- Geographic scope (if any)

- [ ] **Approve Option C**
- [ ] **Reject Option C**

**If approved, provide:**
- Number of restaurants: _______________
- Geographic scope: _______________ (or "globally")

---

### Option D: All of the Above
Add trust statement + testimonials + "Trusted by X"

- [ ] **Approve Option D** (I will provide all content)
- [ ] **Reject Option D**

---

### Option E: None
Do not add trust signals yet.

- [ ] **Approve Option E** (no trust signals for now)

---

## Decision 2: Launch Special Urgency (P0)

**Context:** The "Launch Special — 50% OFF All Plans" badge has no expiration or limit. This reduces urgency.

**Question:** How should we add urgency?

### Option A: Add Expiration Date
> "Launch Special — 50% OFF Until [Date]"

- [ ] **Approve Option A**
- [ ] **Reject Option A**

**If approved, provide expiration date:** _______________

---

### Option B: Add Customer Limit
> "Launch Special — 50% OFF for First [X] Customers"

- [ ] **Approve Option B**
- [ ] **Reject Option B**

**If approved, provide customer limit:** _______________

---

### Option C: Add Both
> "Launch Special — 50% OFF • First [X] Customers • Ends [Date]"

- [ ] **Approve Option C**
- [ ] **Reject Option C**

**If approved, provide:**
- Customer limit: _______________
- Expiration date: _______________

---

### Option D: Remove Launch Special Entirely
Remove the badge and revert to regular pricing.

- [ ] **Approve Option D**
- [ ] **Reject Option D**

---

### Option E: Keep As-Is
No changes to Launch Special badge.

- [ ] **Approve Option E**
- [ ] **Reject Option E**

---

## Decision 3: Book Demo CTA (P0)

**Context:** The Homepage prominently displays a "Book Demo" button.

**Question:** Is demo booking operationally supported in RC1?

### Option A: Demos ARE Supported — Keep Button
We have:
- [ ] Demo booking system
- [ ] Demo team/person assigned
- [ ] Demo script/flow

**Action:** Keep "Book Demo" button as-is.

- [ ] **Approve Option A** (demos are supported)

---

### Option B: Demos are NOT Supported — Remove Button
We do not have demo infrastructure yet.

**Action:** Remove "Book Demo" button entirely.

- [ ] **Approve Option B** (remove button)

---

### Option C: Replace with "Contact Sales"
We want sales contact but not formal demos.

**Action:** Replace "Book Demo" with "Contact Sales" button.

- [ ] **Approve Option C** (replace with Contact Sales)

---

### Option D: Replace with "Chat with Us"
We want live chat instead of demos.

**Action:** Replace "Book Demo" with "Chat with Us" button.

- [ ] **Approve Option D** (replace with Chat)

---

## Decision 4: Discover Visibility (P0)

**Context:** The Homepage has an "Explore Businesses Near You" CTA that links to `/discover`. However, Discover has localization bugs (hardcoded Rwanda cities).

**Question:** Should Discover be visible in RC1?

### Option A: Keep Discover Visible — Fix Bugs First
We want Discover in RC1.

**Action:** Fix localization bugs (make cities dynamic), then keep CTA.

**Effort:** 4-8 hours to fix bugs.

- [ ] **Approve Option A** (fix bugs, keep visible)

---

### Option B: Hide Discover from RC1
Discover is not part of RC1 deployment availability.

**Action:** Remove "Explore Businesses" CTA and hide Discover from navigation.

**Effort:** 30 minutes to hide.

- [ ] **Approve Option B** (hide from RC1)

---

### Option C: Keep As-Is (Acceptable for RC1)
Hardcoded cities are acceptable for RC1 (Rwanda pilot).

**Action:** No changes.

- [ ] **Approve Option C** (keep as-is)

---

## Decision 5: Store Visibility (P1)

**Context:** The "Store" link is currently visible in navigation.

**Question:** Should Store (procurement marketplace) be visible in RC1?

### Option A: Keep Store Visible
Store is ready for RC1 deployment.

**Action:** No changes.

- [ ] **Approve Option A** (keep visible)

---

### Option B: Hide Store from RC1
Store is not part of RC1 deployment availability.

**Action:** Remove Store from navigation.

**Effort:** 15 minutes.

- [ ] **Approve Option B** (hide from RC1)

---

## Decision 6: Referral Program Visibility (P1)

**Context:** The "Share & earn rewards" button and referral links are currently visible.

**Question:** Should Referral Program be visible in RC1?

### Option A: Keep Referral Program Visible
Referral program is ready for RC1.

**Action:** No changes (but fix hardcoded currency references).

- [ ] **Approve Option A** (keep visible)

---

### Option B: Hide Referral Program from RC1
Referral program is not part of RC1 deployment availability.

**Action:** Remove referral button and links from navigation.

**Effort:** 30 minutes.

- [ ] **Approve Option B** (hide from RC1)

---

## Decision 7: Hero Messaging (P1)

**Context:** Current headline is "Turn Every Table Into Faster Revenue" — generic, competitors say similar things.

**Question:** Should we improve differentiation?

### Option A: Keep Current Headline
No changes to hero messaging.

- [ ] **Approve Option A** (keep current)

---

### Option B: Revise Headline for Differentiation
Replace with stronger differentiation.

**Suggested alternatives:**
- "The Restaurant OS Built for Real-Time Operations"
- "QR Ordering + AI Insights + Mobile Money — All in One"
- "From Order to Profit in Real-Time"
- "The Only Platform That Tracks Every Sale, Every Table, Every Action — Live"

- [ ] **Approve Option B** (revise headline)

**If approved, choose one or provide your own:**
- [ ] Option 1: "The Restaurant OS Built for Real-Time Operations"
- [ ] Option 2: "QR Ordering + AI Insights + Mobile Money — All in One"
- [ ] Option 3: "From Order to Profit in Real-Time"
- [ ] Option 4: "The Only Platform That Tracks Every Sale, Every Table, Every Action — Live"
- [ ] Custom: _______________

---

## Decision 8: Subheadline Clarity (P1)

**Context:** Current subheadline is "Be Seen. Get Orders. Grow Fast." — too abstract.

**Question:** Should we clarify the subheadline?

### Option A: Keep Current Subheadline
No changes.

- [ ] **Approve Option A** (keep current)

---

### Option B: Replace with Concrete Value
Replace with:
> "Reduce wait times, serve more customers, and streamline your operations—QR ordering, POS, and AI insights in one platform."

- [ ] **Approve Option B** (replace with concrete value)

---

### Option C: Custom Subheadline
Provide your own:

- [ ] **Approve Option C** (custom)

**If approved, provide subheadline:** _______________

---

## Decision 9: Features Section Length (P1)

**Context:** The Homepage displays 12 feature cards — cognitive overload.

**Question:** Should we reduce to 6-8 core features?

### Option A: Keep All 12 Features
No changes.

- [ ] **Approve Option A** (keep all 12)

---

### Option B: Reduce to 6-8 Core Features
Show only the most important features.

- [ ] **Approve Option B** (reduce to 6-8)

**If approved, select which features to keep (choose 6-8):**
- [ ] QR Code Ordering
- [ ] Inventory & Procurement
- [ ] Reports & Analytics
- [ ] AI-Powered Insights
- [ ] Content & Discovery Feed
- [ ] Smart Dining Slips™
- [ ] Loyalty & Rewards
- [ ] Promotions & Happy Hours
- [ ] WhatsApp Integration
- [ ] Mobile Money Payments
- [ ] Multi-Branch Control
- [ ] Role-Based Access

---

## Decision 10: Advanced Features Readiness (P1)

**Context:** The "Advanced Features" section lists Hotel Mode, Site Builder, AI Menu Builder, Discovery Marketplace, Referral Program.

**Question:** Which features are ready for RC1?

**For each feature, mark as:**
- ✅ Ready (keep as-is)
- ⚠️ Beta (add "Beta" label)
- 🚧 Coming Soon (add "Coming Soon" label)
- ❌ Remove (hide from Homepage)

| Feature | Ready | Beta | Coming Soon | Remove |
|---|:---:|:---:|:---:|:---:|
| Hotel Mode | [ ] | [ ] | [ ] | [ ] |
| Site Builder | [ ] | [ ] | [ ] | [ ] |
| AI Menu Builder | [ ] | [ ] | [ ] | [ ] |
| Discovery Marketplace | [ ] | [ ] | [ ] | [ ] |
| Referral Program | [ ] | [ ] | [ ] | [ ] |

---

## Decision 11: PWA Install Placement (P1)

**Context:** PWA install prompt may distract from trial signup.

**Question:** When should we show PWA install?

### Option A: Show on First Visit (Current)
No changes.

- [ ] **Approve Option A** (keep current)

---

### Option B: Show After Signup
Only show PWA install to logged-in users.

- [ ] **Approve Option B** (show after signup)

---

### Option C: Show After X Visits
Show after user has visited X times.

- [ ] **Approve Option C** (show after X visits)

**If approved, how many visits?** _______________

---

### Option D: Make Less Prominent
Show as small icon instead of large button.

- [ ] **Approve Option D** (make less prominent)

---

## Decision 12: Newsletter Placement (P1)

**Context:** Newsletter signup may compete with trial signup CTA.

**Question:** Where should newsletter signup be placed?

### Option A: Keep Current Placement
No changes.

- [ ] **Approve Option A** (keep current)

---

### Option B: Move to Footer
Place newsletter signup in footer only.

- [ ] **Approve Option B** (move to footer)

---

### Option C: Move After Pricing
Place newsletter signup after pricing section.

- [ ] **Approve Option C** (move after pricing)

---

### Option D: Remove Entirely
Do not show newsletter signup on Homepage.

- [ ] **Approve Option D** (remove)

---

## Summary of Decisions Required

| Decision | Priority | Blocking Implementation |
|---|---:|:---:|
| 1. Trust Signals | P0 | Yes |
| 2. Launch Special Urgency | P0 | Yes |
| 3. Book Demo CTA | P0 | Yes |
| 4. Discover Visibility | P0 | Yes |
| 5. Store Visibility | P1 | No |
| 6. Referral Program Visibility | P1 | No |
| 7. Hero Messaging | P1 | No |
| 8. Subheadline Clarity | P1 | No |
| 9. Features Section Length | P1 | No |
| 10. Advanced Features Readiness | P1 | No |
| 11. PWA Install Placement | P1 | No |
| 12. Newsletter Placement | P1 | No |

---

## Approval

**Once you have made all decisions above:**

- [ ] **I have completed all P0 decisions** (required for implementation)
- [ ] **I have completed all P1 decisions** (optional but recommended)
- [ ] **I authorize engineering to implement the approved changes**

**Founder Name:** ________________________

**Date:** ________________________

**Signature:** ________________________

---

*End of Homepage Founder Decisions.*
