# COMMERCIAL_OPEN_DECISIONS

**Document:** Commercial Constitution v1.0  
**Date:** 2026-07-02  
**Purpose:** Items requiring explicit Founder approval  
**Status:** Pending Founder Decision

---

## OVERVIEW

The Commercial Constitution defines the authoritative commercial model for ImboniServe. However, several strategic decisions require explicit Founder approval before implementation can proceed.

**This document lists ONLY items requiring Founder decision.** It does not include recommendations or implementation details—those are in the constitution and implementation blueprint.

---

## DECISION 1: LOCKED FEATURE VISIBILITY STRATEGY

### Context

The dashboard currently shows all features to all users regardless of subscription tier. The constitution recommends subscription-aware visibility, but the specific approach requires Founder decision.

### Question

**How should locked features be presented in the dashboard navigation?**

### Options

#### Option A: Visible with Lock Icons (Discovery-Focused)

**Behavior:**
- All features shown in navigation
- Locked features have lock icon 🔒
- Click shows upgrade prompt with pricing

**Pros:**
- Encourages discovery ("I didn't know this existed!")
- Drives upgrades (users see what they're missing)
- Transparent (users know what's available)

**Cons:**
- Can feel cluttered
- May frustrate users who see many locked features
- Requires careful UX design to avoid overwhelming

**Example:**
```
Navigation:
✅ Dashboard
✅ Orders
✅ Tables
🔒 Reservations (Professional+)
✅ Menu
✅ Inventory
🔒 Inventory Alerts (Professional+)
```

---

#### Option B: Hidden from Navigation (Clean Interface)

**Behavior:**
- Only show features user has access to
- Locked features completely hidden
- "Upgrade to unlock" section shows what's available

**Pros:**
- Clean, focused interface
- No frustration from seeing locked features
- Easier to navigate (fewer items)

**Cons:**
- Reduces discovery (users don't know what they're missing)
- May reduce upgrades (out of sight, out of mind)
- Requires separate "See all features" page

**Example:**
```
Navigation (Starter user):
✅ Dashboard
✅ Orders
✅ Tables
✅ Menu
✅ Inventory

Separate "Upgrade" page shows:
🔒 Reservations (Professional+)
🔒 Inventory Alerts (Professional+)
🔒 Multi-Branch (Business+)
```

---

#### Option C: Hybrid Approach (Contextual Visibility)

**Behavior:**
- Core locked features visible with lock icons (high-value, next-tier features)
- Advanced locked features hidden (far-future upgrades)
- Contextual upgrade prompts in relevant workflows

**Pros:**
- Balance between discovery and cleanliness
- Shows most relevant upgrade opportunities
- Reduces overwhelm

**Cons:**
- More complex to implement
- Requires defining which features are "core" vs "advanced"
- May still feel inconsistent

**Example:**
```
Navigation (Starter user):
✅ Dashboard
✅ Orders
✅ Tables
🔒 Reservations (Professional+) ← Shown (next tier)
✅ Menu
✅ Inventory
🔒 Inventory Alerts (Professional+) ← Shown (next tier)

Hidden (far-future):
Multi-Branch (Business+)
AI Insights (Premium+)
```

---

### Recommendation

**Option A: Visible with Lock Icons**

**Rationale:**
- Maximizes discovery and upgrade awareness
- Industry standard (most SaaS products show locked features)
- Drives revenue (users see value they're missing)
- Can be refined with good UX (grouping, badges, clear CTAs)

**Implementation Note:**
- Use clear visual hierarchy (locked features slightly dimmed)
- Group locked features by plan tier
- Show upgrade CTA prominently
- Add "Your Plan: Starter" indicator in topbar

---

### Founder Decision Required

- [ ] **Option A** — Visible with lock icons (recommended)
- [ ] **Option B** — Hidden from navigation
- [ ] **Option C** — Hybrid approach (specify which features are "core")
- [ ] **Other** — Specify alternative approach

**Founder Notes:** _________________________

---

## DECISION 2: MOCK FEATURES IN PRODUCTION

### Context

The Commercial Truth Certification identified 5 features that have partial or mock implementations but are listed on the pricing page:

1. **Recipe Management** (Premium)
2. **Inventory Auto-Reorder** (Premium)
3. **Supplier Portal** (Business)
4. **Customer Feedback System** (Premium)
5. **Advanced Reporting** (Premium)

### Question

**What should be done with these features before RC1 launch?**

### Options

#### Option A: Complete Before Launch

**Action:** Delay RC1 launch until all 5 features are fully functional

**Pros:**
- Full Commercial Truth compliance
- No broken promises
- Complete product offering

**Cons:**
- Delays launch by 2-4 weeks
- May not be critical for early customers
- Opportunity cost (market timing)

**Effort:** 2-4 weeks

---

#### Option B: Remove from Pricing Page

**Action:** Remove these features from pricing page and plan descriptions until complete

**Pros:**
- Immediate Commercial Truth compliance
- No broken promises
- Can launch on schedule

**Cons:**
- Reduces perceived value of Premium/Business plans
- May affect upgrade rates
- Competitors may have these features

**Effort:** 2-4 hours (update pricing page and locale files)

---

#### Option C: Mark as "Coming Soon"

**Action:** Keep features on pricing page but clearly mark as "Coming Soon" or "Q3 2026"

**Pros:**
- Maintains perceived value
- Sets clear expectations
- Can launch on schedule

**Cons:**
- May reduce trust if "Coming Soon" drags on
- Requires commitment to delivery timeline
- Still technically violates Commercial Truth

**Effort:** 2-4 hours (update pricing page with badges)

---

#### Option D: Launch with Partial Implementation

**Action:** Launch with current partial implementations, improve iteratively

**Pros:**
- Can launch on schedule
- Early customers provide feedback
- Iterative improvement

**Cons:**
- Violates Commercial Truth
- May disappoint customers
- Support burden for incomplete features

**Effort:** None (current state)

---

### Recommendation

**Option C: Mark as "Coming Soon" with Q3 2026 Delivery**

**Rationale:**
- Maintains perceived value of Premium/Business plans
- Sets clear expectations with customers
- Allows on-schedule launch
- Commits to delivery timeline (accountability)

**Implementation:**
- Add "Coming Soon (Q3 2026)" badge to these features on pricing page
- Update plan descriptions to clarify current vs future features
- Commit to completing features by Q3 2026
- Communicate progress in monthly updates

**Alternative:**  
If Q3 2026 is too aggressive, **Option B (Remove)** is safer and maintains Commercial Truth.

---

### Founder Decision Required

- [ ] **Option A** — Complete before launch (delay RC1 by 2-4 weeks)
- [ ] **Option B** — Remove from pricing page (launch on schedule, reduced value)
- [ ] **Option C** — Mark as "Coming Soon" (launch on schedule, commit to Q3 2026)
- [ ] **Option D** — Launch with partial implementation (violates Commercial Truth)
- [ ] **Other** — Specify alternative approach

**Founder Notes:** _________________________

---

## DECISION 3: TRIAL PLAN ENTITLEMENTS

### Context

The constitution recommends that trials receive **Professional plan features** to showcase value and drive conversions. However, this is a strategic decision that affects trial experience and conversion rates.

### Question

**What features should trial users receive during their 14-day trial?**

### Options

#### Option A: Professional Features (Recommended)

**Entitlements:**
- Everything in Starter
- Reservations
- Inventory Alerts
- Procurement Workflow
- Staff Management
- Payment Analytics
- Menu Performance
- WhatsApp Campaigns (basic)

**Pros:**
- Showcases value beyond basic Starter
- Drives conversions to Professional or higher
- Industry standard (most SaaS trials are premium)
- Users experience growth-stage features

**Cons:**
- May set expectations too high
- Users may be disappointed downgrading to Starter after trial
- Higher support burden during trial

**Expected Conversion:**  
Trial → Professional: 30-40%  
Trial → Business/Premium: 10-15%

---

#### Option B: Starter Features (Basic)

**Entitlements:**
- Core operations (orders, tables, kitchen, menu)
- Basic inventory
- Basic reports
- Payment processing
- QR Builder (5 codes)

**Pros:**
- Sets realistic expectations
- Users know exactly what Starter includes
- Lower support burden

**Cons:**
- May not showcase enough value
- Lower conversion rates
- Competitors may offer more in trials

**Expected Conversion:**  
Trial → Starter: 40-50%  
Trial → Professional+: 5-10%

---

#### Option C: Business Features (Premium Showcase)

**Entitlements:**
- Everything in Professional
- Multi-branch (up to 3)
- Kitchen Display System
- Supplier Portal
- WhatsApp Segments
- QR Analytics

**Pros:**
- Maximum value showcase
- Drives high-tier conversions
- Competitive differentiation

**Cons:**
- Very high expectations
- May overwhelm small businesses
- Difficult to downgrade after trial

**Expected Conversion:**  
Trial → Business/Premium: 20-30%  
Trial → Professional: 10-15%

---

### Recommendation

**Option A: Professional Features**

**Rationale:**
- Balances value showcase with realistic expectations
- Targets most common conversion path (trial → Professional)
- Industry standard approach
- Allows users to experience growth-stage features without overwhelming

**Implementation:**
- Trial receives Professional entitlements for 14 days
- After trial, users select plan (Starter, Professional, Business, Premium)
- Conversion flow highlights Professional features they used during trial

---

### Founder Decision Required

- [ ] **Option A** — Professional features (recommended)
- [ ] **Option B** — Starter features (basic)
- [ ] **Option C** — Business features (premium showcase)
- [ ] **Other** — Specify alternative approach

**Founder Notes:** _________________________

---

## DECISION 4: MARKET-SPECIFIC PRICING

### Context

The constitution defines canonical pricing in RWF and display pricing in local currencies. However, it allows for market-specific pricing adjustments in rare cases (e.g., purchasing power parity, competitive landscape).

### Question

**Should ImboniServe offer market-specific pricing adjustments, or maintain global pricing consistency?**

### Options

#### Option A: Global Pricing Consistency (Recommended)

**Approach:**
- Canonical pricing (RWF) applies to all markets
- Display pricing calculated via exchange rates
- No market-specific discounts or adjustments

**Pros:**
- Simple, transparent, consistent
- Easy to communicate and manage
- No arbitrage opportunities
- Fair to all customers

**Cons:**
- May be expensive in low-income markets
- May be cheap in high-income markets
- Competitors may undercut in specific markets

**Example:**
- Rwanda: 15,000 RWF (~$12 USD)
- India: ~₹1,000 (~$12 USD)
- Germany: ~€10 (~$12 USD)
- United States: ~$12 USD

---

#### Option B: Market-Specific Adjustments

**Approach:**
- Canonical pricing (RWF) as reference
- Market-specific adjustments for purchasing power parity
- Founder approval required for each market

**Pros:**
- More accessible in low-income markets
- Competitive in price-sensitive markets
- Can optimize for local conditions

**Cons:**
- Complex to manage
- Potential arbitrage (buy in cheap market, use globally)
- Fairness concerns (why does India get discount?)
- Operational overhead

**Example:**
- Rwanda: 15,000 RWF (~$12 USD) — Base price
- India: ₹800 (~$10 USD) — 20% discount for market entry
- Germany: €12 (~$14 USD) — 20% premium for high-income market
- United States: $12 USD — Base price

---

### Recommendation

**Option A: Global Pricing Consistency**

**Rationale:**
- Simplicity and transparency
- Easier to scale internationally
- Avoids arbitrage and fairness issues
- Can always introduce market-specific pricing later if needed

**Exception:**  
Allow market-specific pricing for **Enterprise** plans only (custom pricing already)

---

### Founder Decision Required

- [ ] **Option A** — Global pricing consistency (recommended)
- [ ] **Option B** — Market-specific adjustments (specify criteria)
- [ ] **Other** — Specify alternative approach

**Founder Notes:** _________________________

---

## DECISION 5: ANNUAL BILLING INCENTIVE MESSAGING

### Context

The constitution defines annual billing as "25% savings = 3 free months." However, the messaging on the pricing page and in marketing materials requires Founder approval.

### Question

**How should annual billing savings be communicated to customers?**

### Options

#### Option A: "Save 25%"

**Messaging:** "Save 25% with annual billing"

**Pros:**
- Simple percentage
- Industry standard
- Easy to understand

**Cons:**
- Less tangible than "3 free months"
- May not resonate emotionally

---

#### Option B: "3 Free Months"

**Messaging:** "Get 3 months free with annual billing"

**Pros:**
- Tangible benefit
- Emotionally resonant
- Clear value proposition

**Cons:**
- May confuse some users (how is it "free"?)
- Requires explanation

---

#### Option C: Both

**Messaging:** "Save 25% (equivalent to 3 free months) with annual billing"

**Pros:**
- Combines benefits of both
- Clearest communication
- Appeals to different customer types

**Cons:**
- Slightly longer
- May feel redundant

---

### Recommendation

**Option C: Both**

**Rationale:**
- Maximizes clarity and appeal
- Different customers respond to different framings
- Industry best practice (many SaaS companies use both)

**Implementation:**
- Pricing page: "Save 25% with annual billing (3 months free)"
- Marketing: "Get 3 months free when you pay annually"
- Checkout: "Annual billing saves you 25% (equivalent to 3 free months)"

---

### Founder Decision Required

- [ ] **Option A** — "Save 25%" only
- [ ] **Option B** — "3 free months" only
- [ ] **Option C** — Both (recommended)
- [ ] **Other** — Specify alternative messaging

**Founder Notes:** _________________________

---

## DECISION 6: ENTERPRISE PLAN MINIMUM COMMITMENT

### Context

Enterprise plans are custom-priced and negotiated individually. However, the constitution does not specify minimum commitments or contract terms.

### Question

**What are the minimum requirements for Enterprise plans?**

### Options

#### Option A: Minimum Annual Contract

**Requirements:**
- Minimum 12-month commitment
- Minimum monthly value: 300,000 RWF (~$240 USD)
- Custom pricing negotiated case-by-case

**Pros:**
- Predictable revenue
- Justifies dedicated resources
- Industry standard

**Cons:**
- May deter some prospects
- Less flexible

---

#### Option B: Minimum Quarterly Contract

**Requirements:**
- Minimum 3-month commitment
- Minimum monthly value: 250,000 RWF (~$200 USD)
- Custom pricing negotiated case-by-case

**Pros:**
- More flexible
- Easier to close deals
- Lower barrier to entry

**Cons:**
- Less predictable revenue
- Higher churn risk

---

#### Option C: No Minimum (Fully Custom)

**Requirements:**
- No minimum commitment
- No minimum value
- Fully custom terms per customer

**Pros:**
- Maximum flexibility
- Can accommodate any customer

**Cons:**
- Unpredictable
- May attract small customers to Enterprise
- Operational overhead

---

### Recommendation

**Option A: Minimum Annual Contract**

**Rationale:**
- Enterprise features (SSO, custom integrations, dedicated manager) require significant resources
- Annual commitment justifies investment
- Industry standard for enterprise SaaS
- Predictable revenue

**Implementation:**
- Enterprise minimum: 12-month contract, 300,000 RWF/month minimum
- Exceptions require Founder approval

---

### Founder Decision Required

- [ ] **Option A** — Minimum annual contract (recommended)
- [ ] **Option B** — Minimum quarterly contract
- [ ] **Option C** — No minimum (fully custom)
- [ ] **Other** — Specify alternative requirements

**Founder Notes:** _________________________

---

## DECISION SUMMARY

| # | Decision | Recommendation | Status |
|---|----------|---------------|--------|
| 1 | Locked Feature Visibility | Option A: Visible with lock icons | ⏳ Pending |
| 2 | Mock Features | Option C: Mark as "Coming Soon" | ⏳ Pending |
| 3 | Trial Plan | Option A: Professional features | ⏳ Pending |
| 4 | Market-Specific Pricing | Option A: Global consistency | ⏳ Pending |
| 5 | Annual Billing Messaging | Option C: Both ("Save 25%" + "3 free months") | ⏳ Pending |
| 6 | Enterprise Minimum | Option A: Annual contract, 300K/month | ⏳ Pending |

---

## NEXT STEPS

1. **Founder reviews each decision**
2. **Founder selects option for each** (or specifies alternative)
3. **Decisions incorporated into constitution**
4. **Constitution approved and signed**
5. **Engineering implements per approved constitution**

---

**Prepared By:** Chief Product Architect / Commercial Systems Architect  
**Date:** 2026-07-02  
**Status:** Pending Founder Decision

**Founder Approval:**

**Decision 1:** [ ] A [ ] B [ ] C [ ] Other: _________________________  
**Decision 2:** [ ] A [ ] B [ ] C [ ] D [ ] Other: _________________________  
**Decision 3:** [ ] A [ ] B [ ] C [ ] Other: _________________________  
**Decision 4:** [ ] A [ ] B [ ] Other: _________________________  
**Decision 5:** [ ] A [ ] B [ ] C [ ] Other: _________________________  
**Decision 6:** [ ] A [ ] B [ ] C [ ] Other: _________________________

**Founder Signature:** _________________________  
**Date:** _________________________
