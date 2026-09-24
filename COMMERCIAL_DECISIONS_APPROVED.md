# COMMERCIAL_DECISIONS_APPROVED

**Document:** Commercial Constitution v1.1  
**Date:** 2026-07-03  
**Purpose:** Permanent record of Founder commercial decisions  
**Status:** ✅ Approved and Incorporated into Constitution

---

## OVERVIEW

This document records the six strategic commercial decisions made by the Founder during the Commercial Constitution review process. These decisions have been incorporated into the Commercial Constitution v1.1 and now govern all commercial implementation.

**Supersedes:** `COMMERCIAL_OPEN_DECISIONS.md` (recommendations document)

**Authority:** These are Founder-approved decisions, not recommendations. Engineering must implement commercial behavior according to these decisions as codified in the Commercial Constitution.

---

## DECISION 1: PROGRESSIVE COMMERCIAL DISCOVERY

**Question:** How should locked features be presented in the dashboard navigation?

**Decision:** ✅ **Progressive Commercial Discovery**

### Approved Philosophy

Customers should never feel restricted. Customers should feel that the platform grows together with their business.

### Core Principles

1. **Show What They Own** — Always display features included in the customer's current subscription
2. **Expose the Next Logical Step** — Surface features from the next subscription tier only
3. **Hide Distant Future Capabilities** — Do not show features multiple tiers away
4. **Surface Upgrades Inside Workflows** — Present upgrade opportunities contextually
5. **Avoid Dashboard Clutter** — Keep navigation clean and relevant
6. **Administrative Functionality is Never Upgrade Marketing** — Admin tools remain hidden

### Examples

- **Starter users** discover Professional capabilities (not Business/Premium/Enterprise)
- **Professional users** discover Business capabilities (not Premium/Enterprise)
- **Business users** discover Premium capabilities (not Enterprise)
- **Premium users** discover Enterprise engagement opportunities

### Implementation Guidance

**Visibility Tiers:**
1. **Owned Features** — Fully accessible, shown in navigation
2. **Next-Tier Features** — Contextually discoverable within workflows
3. **Distant Features** — Hidden (only visible on pricing page)
4. **Administrative Features** — Always hidden from regular users

**Upgrade Prompts:**
- Supportive and encouraging (not restrictive)
- Growth-focused (platform grows with you)
- Contextual (relevant to current workflow)
- Aspirational (next step in your journey)

### Rationale

This approach balances discovery with clarity. Customers understand their growth path without feeling overwhelmed or limited.

### Constitutional Reference

Section 7: Progressive Commercial Discovery

---

## DECISION 2: ONLY SELL WHAT EXISTS

**Question:** What should be done with features that have partial or mock implementations?

**Decision:** ✅ **Only Sell What Exists**

### Approved Philosophy

The pricing page is a commercial contract, not a product roadmap.

### Core Principles

1. **Production-Ready Only** — Only production-ready capabilities belong in commercial packaging
2. **Future Capabilities Belong Elsewhere** — Roadmaps, release notes, Founder updates, product announcements
3. **Early Access Labeling** — If a capability is usable but still evolving, label it "Early Access"
4. **Remove if Not Operational** — If a capability is not operational, remove it from pricing until ready

### Implementation Guidance

**Allowed in Commercial Packaging:**
- ✅ Production-ready features
- ✅ Features labeled "Early Access" (if usable)

**NOT Allowed in Commercial Packaging:**
- ❌ Features labeled "Coming Soon"
- ❌ Mock implementations
- ❌ Placeholder features
- ❌ Roadmap items

**Where Future Features Belong:**
- Product roadmap page
- Release notes
- Founder updates
- Product announcements
- Engineering backlog

### Specific Features Affected

The following features were identified as having partial implementations:
- Recipe Management (Premium)
- Inventory Auto-Reorder (Premium)
- Supplier Portal (Business)
- Customer Feedback System (Premium)
- Advanced Reporting (Premium)

**Action Required:**  
These features must be either:
1. Completed to production-ready status, OR
2. Removed from pricing page until ready

### Rationale

This maintains Commercial Truth (Principle 2: Promise = Reality). Customers purchase based on what exists today, not what might exist tomorrow.

### Constitutional Reference

Principle 2: Promise = Reality (Only Sell What Exists)  
Section 6.7: Feature Status and Commercial Packaging

---

## DECISION 3: GUIDED PROFESSIONAL TRIAL

**Question:** What features should trial users receive during their 14-day trial?

**Decision:** ✅ **Guided Professional Trial**

### Approved Philosophy

The trial is not simply feature access. It is a **guided learning journey** designed to help customers understand operational value progressively.

### Core Principles

1. **Professional Entitlements** — Trial users receive Professional plan features
2. **Progressive Introduction** — Capabilities introduced gradually through onboarding (not all on Day One)
3. **Guided Learning** — Onboarding guides users through capabilities in logical sequence
4. **Usage-Based Recommendation** — At trial completion, recommend the subscription that best matches actual customer usage

### Progressive Introduction Timeline

**Days 1-3: Core Operations**
- Orders and tables
- Menu management
- Basic inventory
- Payment processing

**Days 4-7: Growth Features**
- Reservations
- Staff management
- Inventory alerts

**Days 8-11: Analytics and Insights**
- Payment analytics
- Menu performance
- Peak hours analysis

**Days 12-14: Marketing and Engagement**
- WhatsApp campaigns
- QR Builder
- Site Builder

### Trial Conversion Approach

**At Trial Expiry:**
- Show usage summary: "Features you've used during trial"
- Provide personalized recommendation: "Based on your usage, we recommend [Plan]"
- Show pricing for recommended plan (not all plans)
- Primary CTA: "Subscribe to [Recommended Plan]"
- Secondary option: "View all plans"

### Rationale

This approach helps customers build operational confidence progressively without overwhelming them with 50+ features on Day One. The usage-based recommendation ensures customers subscribe to the plan that best fits their actual needs.

### Constitutional Reference

Section 8: Guided Professional Trial

---

## DECISION 4: GLOBAL COMMERCIAL MODEL

**Question:** Should ImboniServe offer market-specific pricing adjustments, or maintain global pricing consistency?

**Decision:** ✅ **Three-Layer Global Commercial Model**

### Approved Philosophy

Adopt three commercial layers to support global expansion while maintaining architectural flexibility.

### Layer 1: Canonical Commercial Pricing

**Characteristics:**
- Internal
- Stable
- Authoritative

**Currency:** Initially maintained in RWF (Rwandan Francs)

**Used By:**
- Subscriptions
- Billing
- Reporting
- Analytics
- Entitlement calculations

### Layer 2: Localized Display Pricing

**Characteristics:**
- Customer-facing
- Localized
- Approximate
- Informational

**Purpose:** Provide localized convenience for customers in their preferred currency

**Examples:**
- Rwanda: 15,000 RWF
- Germany: ≈ €10
- Mexico: ≈ MX$210
- United States: ≈ $12

**Important:** Display pricing never changes the commercial model

### Layer 3: Regional Commercial Policy

**Status:** Future capability, not active during RC1

**May be introduced later based on:**
- Market maturity
- Customer demand
- Purchasing power dynamics
- Competitive landscape
- Founder approval

**Governance:** Any regional pricing strategy requires constitutional amendment and Founder approval

### Rationale

This three-layer model provides architectural flexibility for future regional strategies while maintaining global consistency during RC1. The commercial architecture supports regional pricing, but commercial policy remains globally consistent unless explicitly amended.

### Constitutional Reference

Section 4: Global Commercial Model

---

## DECISION 5: TRANSPARENT ANNUAL SAVINGS

**Question:** How should annual billing savings be communicated to customers?

**Decision:** ✅ **Transparent Annual Savings Presentation**

### Approved Philosophy

Customers should never need to calculate savings themselves.

### Required Display Elements

When presenting annual billing options, always display:
1. Monthly price (e.g., 15,000 RWF/month)
2. Regular annual value (e.g., 180,000 RWF/year)
3. Discounted annual value (e.g., 135,000 RWF/year)
4. Savings (e.g., Save 45,000 RWF)

### Standard Language

"Pay annually and save 25% — equivalent to 3 free months."

### Consistency Requirements

This presentation must be maintained consistently across:
- Homepage
- Pricing page
- Checkout flows
- Invoices
- Renewal reminders
- All future commercial materials

### Philosophy

Annual billing should be **recommended**, never **forced**. Customers should clearly understand the value of annual commitment without needing to perform calculations.

### Rationale

Transparency builds trust. Showing both the percentage (25%) and the tangible benefit (3 free months) appeals to different customer decision-making styles.

### Constitutional Reference

Section 3.3: Annual Billing Presentation

---

## DECISION 6: STRATEGIC PARTNERSHIP MODEL

**Question:** What are the minimum requirements for Enterprise plans?

**Decision:** ✅ **Enterprise as Strategic Partnership (No Minimums)**

### Approved Philosophy

Enterprise is not simply another subscription tier. Enterprise represents a **strategic partnership** that begins where the standard platform ends.

### Core Principles

1. **Custom Pricing** — Enterprise pricing remains custom and negotiated
2. **No Constitutional Minimums** — No minimum monthly amount, annual contract, or contract duration
3. **Operational Complexity Focus** — Qualification based on operational complexity, not revenue thresholds
4. **Consultation-Based** — Engagements begin with consultation, not self-service checkout
5. **Founder Approval** — Every Enterprise engagement requires Founder (or delegated commercial leadership) approval

### Qualification Criteria

Enterprise qualification focuses on operational complexity:
- Multi-entity organizations
- Regional operations (multiple countries/markets)
- Custom integrations and workflows
- Dedicated infrastructure requirements
- SSO and advanced security
- Compliance and audit requirements
- Enterprise SLA and uptime guarantees
- Implementation services and training

### Engagement Model

**Not:** Self-service checkout  
**Instead:** Collaborative partnership design

**Process:**
1. Initial consultation
2. Needs assessment
3. Custom solution design
4. Commercial terms negotiation
5. Founder approval
6. Partnership agreement
7. Implementation and onboarding

### Rationale

Enterprise customers have unique needs that cannot be served by standard plans. Removing minimums allows ImboniServe to serve strategic partners of any size, focusing on fit rather than arbitrary thresholds.

### Constitutional Reference

Section 3.4: Enterprise: Strategic Partnership Model

---

## DECISION SUMMARY

| # | Decision | Status | Constitutional Section |
|---|----------|--------|------------------------|
| 1 | Progressive Commercial Discovery | ✅ Approved | Section 7 |
| 2 | Only Sell What Exists | ✅ Approved | Principle 2, Section 6.7 |
| 3 | Guided Professional Trial | ✅ Approved | Section 8 |
| 4 | Global Commercial Model (3 Layers) | ✅ Approved | Section 4 |
| 5 | Transparent Annual Savings | ✅ Approved | Section 3.3 |
| 6 | Strategic Partnership Model (Enterprise) | ✅ Approved | Section 3.4 |

---

## IMPLEMENTATION AUTHORITY

These decisions have been incorporated into the Commercial Constitution v1.1 and are now authoritative.

**Engineering must implement commercial behavior according to these decisions.**

**No further Founder approval is required for implementation** — these decisions are final and binding.

**Any future changes to these decisions require:**
1. Proposal with rationale
2. Founder approval
3. Constitutional amendment
4. Implementation update

---

## RELATED DOCUMENTS

**Constitutional Documents:**
- `COMMERCIAL_CONSTITUTION.md` (v1.1) — Authoritative commercial reference
- `COMMERCIAL_CONSTITUTION_SUMMARY.md` (updated) — Executive summary
- `COMMERCIAL_IMPLEMENTATION_BLUEPRINT.md` (updated) — Engineering implementation plan
- `COMMERCIAL_CONSTITUTION_CHANGELOG.md` — Detailed amendment log

**Superseded Documents:**
- `COMMERCIAL_OPEN_DECISIONS.md` (replaced by this document)

---

**Approved By:** Founder  
**Date:** 2026-07-03  
**Status:** ✅ Final and Binding

---

**END OF APPROVED DECISIONS**

**These decisions are now constitutional law for ImboniServe's commercial architecture.**
