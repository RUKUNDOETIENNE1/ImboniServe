# FOUNDER_DECISION_QUEUE — Homepage Business Decisions

**Date:** 2026-06-30  
**Status:** Engineering STOPPED — Awaiting Founder Decisions  
**Repository Status:** Clean (all Group 1 engineering fixes committed)

---

## PURPOSE

This document organizes **every remaining Homepage decision** into independent business topics.

**Engineering has completed all objective fixes:**
- ✅ Dashboard links removed from public navigation
- ✅ Homepage carousel timing improved (5s → 7s)
- ✅ Hardcoded provider wording de-localized
- ✅ WhatsApp link made configurable
- ✅ Currency display made configurable
- ✅ Dashboard click-throughs removed from feature carousels
- ✅ "Built for restaurants..." readability improved

**No further engineering work will begin until you make the following business decisions.**

---

## DECISION FRAMEWORK

Each decision below is:
- **Independent** — you can approve some and reject others
- **Self-contained** — no mixed topics
- **Business-focused** — not engineering problems
- **Truthful** — no fake social proof or unsupported promises

**After each decision, implementation can proceed for that specific topic only.**

---

## DECISION 1: Trust Signals & Social Proof

### Context
The Homepage currently has **no testimonials, customer logos, case studies, or trust badges**.

Restaurant owners are risk-averse. Without social proof, conversion rates suffer.

### Business Question
**What truthful trust signals should we add to the Homepage?**

### Options

#### Option A: Trust Statement Only (Minimal)
Add below hero CTA:
> "14-day free trial • No credit card required • Cancel anytime"

**Pros:**
- Truthful
- No content gathering required
- Reduces friction
- Industry standard

**Cons:**
- Minimal differentiation
- Doesn't prove track record

**Effort:** 30 minutes  
**Risk:** None

---

#### Option B: Customer Testimonials
Add testimonial section after features (2-3 testimonials).

**Requirements:**
- Real customer quotes
- Permission to use names/restaurants publicly
- Truthful representation of customer experience

**Pros:**
- Strongest trust signal
- Demonstrates real-world success
- Builds credibility

**Cons:**
- Requires customer coordination
- May not be available yet for RC1

**Effort:** 2-4 hours (if content is ready)  
**Risk:** Medium (requires real testimonials)

**If you choose this option, provide:**
1. Customer Name: _______________
2. Restaurant Name: _______________
3. Quote: _______________
4. Permission obtained: [ ] Yes

---

#### Option C: "Trusted by X restaurants"
Add statement:
> "Trusted by [X] restaurants across [region/globally]"

**Requirements:**
- Accurate count of active paying customers
- Geographic scope (if applicable)

**Pros:**
- Quantifiable proof
- Simple to implement
- Builds confidence

**Cons:**
- Must be factually accurate
- May be too early for impressive numbers

**Effort:** 30 minutes  
**Risk:** High if number is inaccurate

**If you choose this option, provide:**
- Number of active restaurants: _______________
- Geographic scope: _______________ (or "globally")
- Verification: [ ] This number is accurate as of [date]

---

#### Option D: Security & Compliance Badges
Add badges for:
- "Bank-level encryption"
- "PCI compliant" (if applicable)
- "GDPR compliant" (if applicable)
- "ISO certified" (if applicable)

**Requirements:**
- Must be factually true
- Must have actual certifications/compliance

**Pros:**
- Builds technical trust
- Differentiates from informal competitors

**Cons:**
- Only relevant if certifications exist

**Effort:** 1 hour  
**Risk:** High if claims are false

**If you choose this option, confirm:**
- [ ] We have bank-level encryption
- [ ] We are PCI compliant
- [ ] We are GDPR compliant
- [ ] We have ISO certification
- [ ] Other: _______________

---

#### Option E: All of the Above
Combine trust statement + testimonials + "Trusted by X" + badges.

**Effort:** 3-6 hours  
**Risk:** Medium (requires all content)

---

#### Option F: None (Not Yet)
Do not add trust signals for RC1.

**Reasoning:** We're not ready to make public claims yet.

---

### Your Decision

- [ ] **Option A:** Trust statement only
- [ ] **Option B:** Customer testimonials (provide content above)
- [ ] **Option C:** "Trusted by X restaurants" (provide number above)
- [ ] **Option D:** Security/compliance badges (confirm above)
- [ ] **Option E:** All of the above
- [ ] **Option F:** None for now

**Additional notes:**
_______________________________________________________________________________

---

## DECISION 2: Launch Special Terms & Urgency

### Context
The Homepage displays:
> "Launch Special — 50% OFF All Plans"

**Current issue:** No expiration date, no customer limit, no terms. Visitors don't know if this is limited-time or permanent.

**Impact:** Reduces urgency and conversion optimization.

### Business Question
**What are the actual terms of the Launch Special?**

### Options

#### Option A: Add Expiration Date
> "Launch Special — 50% OFF Until [Date]"

**Pros:**
- Creates urgency
- Clear deadline
- Industry standard

**Cons:**
- Must honor deadline
- Requires decision on when to end

**If you choose this option, provide:**
- Expiration date: _______________
- What happens after expiration: _______________

---

#### Option B: Add Customer Limit
> "Launch Special — 50% OFF for First [X] Customers"

**Pros:**
- Creates scarcity
- Rewards early adopters
- Flexible timeline

**Cons:**
- Must track customer count
- Must honor limit

**If you choose this option, provide:**
- Customer limit: _______________
- How we track this: _______________

---

#### Option C: Add Both (Date + Limit)
> "Launch Special — 50% OFF • First [X] Customers • Ends [Date]"

**Pros:**
- Maximum urgency
- Dual scarcity signals
- Protects against long tail

**Cons:**
- More complex to track
- Whichever comes first must be honored

**If you choose this option, provide:**
- Customer limit: _______________
- Expiration date: _______________

---

#### Option D: Convert to Free Trial Emphasis
Remove "50% OFF" and emphasize:
> "14-Day Free Trial — No Credit Card Required"

**Pros:**
- Reduces friction
- Industry standard
- Easier to support operationally

**Cons:**
- Loses discount urgency
- May reduce perceived value

---

#### Option E: Remove Launch Special Entirely
Revert to regular pricing with no special offer.

**Pros:**
- Simplifies messaging
- No urgency pressure
- Focuses on product value

**Cons:**
- Loses conversion optimization
- May reduce early signups

---

#### Option F: Keep As-Is (No Changes)
Keep "Launch Special — 50% OFF All Plans" with no additional terms.

**Reasoning:** _______________

---

### Your Decision

- [ ] **Option A:** Add expiration date (provide date above)
- [ ] **Option B:** Add customer limit (provide limit above)
- [ ] **Option C:** Add both (provide both above)
- [ ] **Option D:** Convert to free trial emphasis
- [ ] **Option E:** Remove Launch Special entirely
- [ ] **Option F:** Keep as-is

**Additional notes:**
_______________________________________________________________________________

---

## DECISION 3: Primary Call-to-Action Strategy

### Context
The Homepage currently displays two primary CTAs:
1. **"Start 14-Day Free Trial"**
2. **"Book a Demo"**

### Business Question
**Which CTAs are operationally supported today?**

### Sub-Decision 3A: "Book a Demo" CTA

**Question:** Is demo booking operationally supported in RC1?

**Requirements for "Yes":**
- [ ] Demo booking system exists (calendar, form, etc.)
- [ ] Demo team/person is assigned and available
- [ ] Demo script/flow is prepared
- [ ] Demo leads to working product walkthrough

#### If YES — Keep "Book a Demo"
**Action:** No changes.

#### If NO — Choose Alternative:

**Option 1:** Remove "Book a Demo" entirely  
**Reasoning:** Focus on self-service trial only.

**Option 2:** Replace with "Contact Sales"  
**Reasoning:** We want sales contact but not formal demos.

**Option 3:** Replace with "Chat with Us"  
**Reasoning:** We want live chat instead of scheduled demos.

**Option 4:** Replace with "Watch Video Demo"  
**Reasoning:** We have a demo video but not live demos.

---

### Your Decision

**Is demo booking operationally supported?**
- [ ] **YES** — Keep "Book a Demo" (confirm requirements above)
- [ ] **NO** — Choose alternative:
  - [ ] Remove button entirely
  - [ ] Replace with "Contact Sales"
  - [ ] Replace with "Chat with Us"
  - [ ] Replace with "Watch Video Demo"

**Additional notes:**
_______________________________________________________________________________

---

## DECISION 4: Business Discovery Visibility

### Context
The Homepage includes:
- "Explore Businesses Near You" CTA
- Link to `/discover` page
- Business discovery features in navigation

**Strategic Context (from approved product direction):**
> Business Discovery is strategically important and will become a core capability for both ImboniServe and ImboniTravel.

**Current Technical State:**
- Discover page hardcodes Rwanda city list (Kigali, Musanze, etc.)
- Violates Global-by-Design philosophy
- Would require 4-8 hours to fix (make cities dynamic)

### Business Question
**Should Business Discovery be visible in RC1?**

### Options

#### Option A: Keep Visible — Fix Localization First
**Action:** Fix hardcoded cities (make dynamic), then keep Discovery visible.

**Pros:**
- Aligns with strategic vision
- Demonstrates full platform capability
- Supports ImboniServe + ImboniTravel integration

**Cons:**
- Requires 4-8 hours engineering work
- May delay RC1 if prioritized

**Effort:** 4-8 hours  
**Risk:** Medium (technical complexity)

---

#### Option B: Hide from RC1 — Fix Later
**Action:** Remove "Explore Businesses" CTA and hide Discover from navigation temporarily.

**Pros:**
- Faster to RC1
- Allows proper Global-by-Design fix later
- Doesn't expose incomplete workflow

**Cons:**
- Hides strategic capability
- May confuse users who expect it

**Effort:** 30 minutes  
**Risk:** Low

**Note:** This does NOT remove the capability — only hides it from public navigation until ready.

---

#### Option C: Keep As-Is (Acceptable for RC1)
**Action:** Keep Discovery visible with hardcoded Rwanda cities.

**Reasoning:** RC1 is a Rwanda pilot, so hardcoded cities are acceptable.

**Pros:**
- No additional work
- Shows full capability

**Cons:**
- Violates Global-by-Design philosophy
- Creates technical debt
- May confuse non-Rwanda visitors

---

### Your Decision

- [ ] **Option A:** Keep visible — fix localization first (4-8 hours)
- [ ] **Option B:** Hide from RC1 — fix later (30 minutes)
- [ ] **Option C:** Keep as-is (acceptable for RC1)

**Strategic reasoning:**
_______________________________________________________________________________

---

## DECISION 5: Store (Procurement Marketplace) Visibility

### Context
The "Store" link is currently visible in navigation.

**Store = Procurement marketplace for restaurant supplies.**

### Business Question
**Should Store be visible in RC1?**

### Options

#### Option A: Keep Store Visible
**Reasoning:** Store is ready for RC1 deployment.

**Requirements:**
- [ ] Store has active suppliers
- [ ] Store has products listed
- [ ] Store checkout flow works
- [ ] Store fulfillment is operational

---

#### Option B: Hide Store from RC1
**Reasoning:** Store is not part of RC1 deployment availability.

**Action:** Remove Store from navigation.

**Effort:** 15 minutes  
**Risk:** None

---

### Your Decision

- [ ] **Option A:** Keep Store visible (confirm requirements above)
- [ ] **Option B:** Hide Store from RC1

**Additional notes:**
_______________________________________________________________________________

---

## DECISION 6: Referral Program Visibility

### Context
The Homepage includes:
- "Share & earn rewards" button
- Referral program features
- Referral links in navigation

**Note:** Hardcoded currency references ("1,000 RWF") have already been fixed (Group 1).

### Business Question
**Should Referral Program be visible in RC1?**

### Options

#### Option A: Keep Referral Program Visible
**Reasoning:** Referral program is ready for RC1.

**Requirements:**
- [ ] Referral tracking works
- [ ] Referral rewards are operational
- [ ] Referral payout process exists

---

#### Option B: Hide Referral Program from RC1
**Reasoning:** Referral program is not part of RC1 deployment availability.

**Action:** Remove referral button and links from navigation.

**Effort:** 30 minutes  
**Risk:** None

---

### Your Decision

- [ ] **Option A:** Keep Referral Program visible (confirm requirements above)
- [ ] **Option B:** Hide Referral Program from RC1

**Additional notes:**
_______________________________________________________________________________

---

## DECISION 7: Homepage Positioning & Messaging

### Context
**Current hero messaging:**
- Headline: "Turn Every Table Into Faster Revenue"
- Subheadline: "Be Seen. Get Orders. Grow Fast."

**Issue:** Generic. Competitors (Toast, Square, Lightspeed) say similar things.

### Business Question
**Should we strengthen Homepage differentiation?**

### Sub-Decision 7A: Hero Headline

#### Option A: Keep Current Headline
"Turn Every Table Into Faster Revenue"

**Reasoning:** It's clear and benefit-focused.

---

#### Option B: Emphasize "Restaurant OS" Positioning
"The Restaurant Operating System Built for Real-Time Operations"

**Pros:**
- Differentiates as platform, not tool
- Emphasizes real-time capability
- Positions against legacy systems

**Cons:**
- More technical
- Longer headline

---

#### Option C: Emphasize Integration Story
"QR Ordering + AI Insights + Mobile Money — All in One"

**Pros:**
- Shows breadth of capability
- Highlights unique combination
- Concrete features

**Cons:**
- Feature-focused, not benefit-focused
- May overwhelm

---

#### Option D: Emphasize Speed/Real-Time
"From Order to Profit in Real-Time"

**Pros:**
- Benefit-focused
- Emphasizes speed
- Differentiates from batch systems

**Cons:**
- May overpromise
- Less concrete

---

#### Option E: Custom Headline
Provide your own: _______________

---

### Sub-Decision 7B: Subheadline

#### Option A: Keep Current Subheadline
"Be Seen. Get Orders. Grow Fast."

---

#### Option B: Replace with Concrete Value
"Reduce wait times, serve more customers, and streamline your operations—QR ordering, POS, and AI insights in one platform."

**Pros:**
- Concrete benefits
- Explains "how"
- Addresses pain points

**Cons:**
- Longer
- More feature-focused

---

#### Option C: Custom Subheadline
Provide your own: _______________

---

### Your Decisions

**Headline:**
- [ ] **Option A:** Keep current
- [ ] **Option B:** "The Restaurant Operating System Built for Real-Time Operations"
- [ ] **Option C:** "QR Ordering + AI Insights + Mobile Money — All in One"
- [ ] **Option D:** "From Order to Profit in Real-Time"
- [ ] **Option E:** Custom: _______________

**Subheadline:**
- [ ] **Option A:** Keep current
- [ ] **Option B:** "Reduce wait times, serve more customers, and streamline your operations—QR ordering, POS, and AI insights in one platform."
- [ ] **Option C:** Custom: _______________

**Strategic reasoning:**
_______________________________________________________________________________

---

## DECISION 8: Pricing Preview Strategy

### Context
The Homepage includes a pricing preview section.

**Note:** Currency display has already been made configurable (Group 1).

**This decision is ONLY about the Homepage pricing preview.**  
**Full Pricing page review will happen separately.**

### Business Question
**Should the Homepage pricing preview remain as-is?**

### Options

#### Option A: Keep Pricing Preview As-Is
Current pricing preview is appropriate for Homepage.

---

#### Option B: Simplify Pricing Preview
Show only:
> "Plans starting from [amount]/month"

**Pros:**
- Cleaner Homepage
- Drives traffic to dedicated Pricing page
- Less commitment on Homepage

**Cons:**
- Less transparency
- May reduce conversions

---

#### Option C: Remove Pricing Preview from Homepage
No pricing information on Homepage.

**Pros:**
- Focuses on value, not price
- Drives demo/trial signups
- Allows sales conversation

**Cons:**
- Reduces transparency
- May increase bounce rate

---

#### Option D: Defer to Pricing Page Review
Make no changes now; address during dedicated Pricing page certification.

---

### Your Decision

- [ ] **Option A:** Keep pricing preview as-is
- [ ] **Option B:** Simplify to "Plans starting from..."
- [ ] **Option C:** Remove pricing preview from Homepage
- [ ] **Option D:** Defer to Pricing page review

**Additional notes:**
_______________________________________________________________________________

---

## IMPLEMENTATION READINESS

After you make the above decisions, implementation will proceed in this order:

### Already Implemented (Group 1 — Committed)
✅ Dashboard links removed from public navigation  
✅ Carousel timing improved (5s → 7s)  
✅ Hardcoded provider wording de-localized  
✅ WhatsApp link made configurable  
✅ Currency display made configurable  
✅ Dashboard click-throughs removed  
✅ "Built for restaurants..." readability improved

### Ready After Your Decisions (Group 2)
⏳ Trust signals (Decision 1)  
⏳ Launch Special terms (Decision 2)  
⏳ Book Demo CTA (Decision 3)  
⏳ Business Discovery visibility (Decision 4)  
⏳ Store visibility (Decision 5)  
⏳ Referral Program visibility (Decision 6)  
⏳ Hero messaging (Decision 7)  
⏳ Pricing preview (Decision 8)

### Blocked Pending Decisions
🚫 Homepage final certification  
🚫 Pricing page review  
🚫 Authentication page review  
🚫 Dashboard page review

---

## NEXT STEPS

1. **Review each decision above**
2. **Mark your choices** (checkboxes)
3. **Provide required information** (dates, numbers, content)
4. **Add strategic reasoning** where helpful
5. **Return this document** to engineering

**After your decisions:**
- Engineering will implement approved changes only
- No assumptions will be made
- Each decision will be implemented exactly as specified
- You will review implementation before final certification

---

## HARD STOP

**Engineering is stopped.**

**No Homepage changes will be made until you complete this decision queue.**

**No other pages will be reviewed until Homepage is certified.**

Repository is clean. Test suite is stable (pre-existing failures documented separately). Ready for your decisions.
