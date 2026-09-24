# COMMERCIAL CONSTITUTION — EXECUTIVE SUMMARY

**Document:** Commercial Constitution v1.1  
**Initial Draft:** 2026-07-02  
**Amended:** 2026-07-03  
**Purpose:** Permanent commercial reference for ImboniServe  
**Status:** ✅ Founder Approved

---

## WHAT IS THIS?

The **Commercial Constitution** is the authoritative, permanent reference for all commercial decisions in ImboniServe. It defines pricing, plans, features, policies, and principles that will govern the platform for the next 5+ years.

**Think of it as:**
- The "source code" for ImboniServe's commercial model
- The constitution that all implementation must follow
- The single source of truth for subscriptions, pricing, and entitlements

---

## WHY DO WE NEED THIS?

**Problem:**  
Currently, commercial decisions are scattered across code, config files, and tribal knowledge. This leads to:
- Inconsistencies (pricing page says one thing, code does another)
- Revenue leakage (customers get features they didn't pay for)
- Confusion (engineers make commercial decisions independently)
- Drift (implementation diverges from intent over time)

**Solution:**  
One authoritative document that defines the commercial model. Implementation follows policy—not the reverse.

---

## WHAT DOES IT DEFINE?

### 1. Commercial Philosophy (Commercial Truth)

**Core Principle:**  
Every customer receives exactly what they purchased. No more. No less.

**7 Key Principles:**
1. Exact Entitlement
2. Promise = Reality (Only Sell What Exists)
3. Consistent Enforcement
4. Single Source of Truth
5. Customer-First Transparency (Customers Never Feel Restricted)
6. Business Maturity Alignment
7. Global Consistency

**8th Principle Added:**
8. Product Demonstration Principle (Demos are educational, not contractual)

### 2. Official Plans (Frozen for RC1)

**5-Tier Structure:**
- **Starter** — Small cafés getting started
- **Professional** — Established restaurants growing
- **Business** — Hotels and chains scaling
- **Premium** — Advanced businesses optimizing
- **Enterprise** — Large organizations with custom needs

**Deprecated Names:**  
❌ Essentials, Basic, Standard, Growth, Advanced, Ultimate

### 3. Official Pricing (RWF)

**Monthly:**
- Starter: 15,000
- Professional: 35,000
- Business: 75,000
- Premium: 200,000
- Enterprise: Custom

**Annual (25% savings = 3 free months):**
- Starter: 144,000/year (12,000/month)
- Professional: 336,000/year (28,000/month)
- Business: 720,000/year (60,000/month)
- Premium: 1,920,000/year (160,000/month)
- Enterprise: Custom

### 4. Canonical vs Display Pricing

**Canonical Pricing (RWF):**  
Internal commercial source of truth for billing, subscriptions, reporting

**Display Pricing (Local Currency):**  
Customer-facing prices in local currency (e.g., €10, $12, ₹800)

**Philosophy:**  
Display pricing is informational. Canonical pricing is authoritative.

### 5. Business Maturity Philosophy

**Plans represent growth stages, not arbitrary feature bundles:**

- **Starting** (Starter) → Get operational, serve customers
- **Growing** (Professional) → Improve efficiency, scale operations
- **Scaling** (Business) → Multi-location coordination
- **Optimizing** (Premium) → AI-driven insights, automation
- **Enterprise** (Enterprise) → Custom infrastructure, governance

### 6. Feature-to-Plan Mapping

**Complete mapping of all 90+ features to specific plans with business justification.**

**Examples:**
- Reservations → Professional (customer experience for growing businesses)
- Multi-Branch → Business (scaling beyond single location)
- AI Insights → Premium (optimization for advanced businesses)
- SSO → Enterprise (governance for large organizations)

### 7. Progressive Commercial Discovery

**✅ Founder Approved Philosophy:** Customers never feel restricted—platform grows with their business

**Core Principles:**
1. **Show What They Own** — Display all features in current subscription
2. **Expose Next Step** — Surface features from next tier only (Starter sees Professional, not Business/Premium/Enterprise)
3. **Hide Distant Future** — Don't show features multiple tiers away
4. **Contextual Upgrades** — Present opportunities inside workflows, not as dashboard clutter
5. **Admin Never Marketing** — Administrative tools never used for upgrade prompts

**4 Visibility Tiers:**
1. **Owned Features** — Fully accessible, shown in navigation
2. **Next-Tier Features** — Contextually discoverable within workflows
3. **Distant Features** — Hidden (only visible on pricing page)
4. **Administrative Features** — Always hidden from regular users

### 8. Guided Professional Trial

**✅ Founder Approved Strategy:**
- **Duration:** 14 days
- **Entitlements:** Professional plan features
- **Philosophy:** Guided learning journey, not just feature access
- **Progressive Introduction:** Capabilities introduced gradually (Days 1-3: Core, Days 4-7: Growth, Days 8-11: Analytics, Days 12-14: Marketing)

**Conversion Flow:**
- 7 days before: Usage summary + recommended plan based on actual usage
- 3 days before: Personalized recommendation
- 1 day before: One-click subscribe to recommended plan
- On expiry: Show recommended plan (not all plans)

### 9. Upgrade & Downgrade Philosophy

**Upgrade:**
- Takes effect immediately
- Prorated charge for remaining days
- Features unlock immediately
- All data preserved

**Downgrade:**
- Takes effect at next billing cycle
- No refund (customer received service)
- User addresses data over new limits
- Can cancel scheduled downgrade

**Cancellation:**
- Takes effect at end of current cycle
- Retention flow before confirming
- Grace period (3 days)
- Data retained for 90 days

### 10. Global Commercial Model (3 Layers)

**✅ Founder Approved Architecture:**

**Layer 1: Canonical Commercial Pricing**
- Internal, stable, authoritative
- Initially in RWF
- Governs billing, subscriptions, entitlements

**Layer 2: Localized Display Pricing**
- Customer-facing, approximate, informational
- Examples: Rwanda (15,000 RWF), Germany (≈ €10), Mexico (≈ MX$210)
- Never changes commercial model

**Layer 3: Regional Commercial Policy**
- Future capability (not active in RC1)
- May be introduced later with Founder approval
- Architecture supports it, policy remains globally consistent

### 11. Future Governance

**Amendment Process:**
1. Propose change with rationale
2. Founder approval
3. Update constitution
4. Implement change
5. Verify compliance

**Key Rule:**  
Implementation follows policy. Policy does not follow implementation.

**Annual Review:**  
Constitution reviewed every July 1st

---

## ✅ FOUNDER DECISIONS APPROVED

All six strategic commercial decisions have been made and incorporated into Constitution v1.1:

### Decision 1: Progressive Commercial Discovery ✅

**Approved:** Show what they own, expose next step, hide distant future  
**Impact:** Customers never feel restricted—platform grows with their business

### Decision 2: Only Sell What Exists ✅

**Approved:** Pricing page is a contract, not a roadmap  
**Impact:** Only production-ready features in commercial packaging; "Early Access" allowed for evolving features

### Decision 3: Guided Professional Trial ✅

**Approved:** Professional features with progressive introduction  
**Impact:** Trial is guided learning journey; recommend plan based on actual usage

### Decision 4: Global Commercial Model (3 Layers) ✅

**Approved:** Canonical pricing (RWF), localized display, regional policy (future)  
**Impact:** Global consistency with architectural flexibility for future regional strategies

### Decision 5: Transparent Annual Savings ✅

**Approved:** "Pay annually and save 25% — equivalent to 3 free months"  
**Impact:** Customers never calculate savings themselves; consistent presentation everywhere

### Decision 6: Strategic Partnership Model (Enterprise) ✅

**Approved:** No minimums, operational complexity focus, consultation-based  
**Impact:** Enterprise is strategic partnership, not just highest tier

---

See `COMMERCIAL_DECISIONS_APPROVED.md` for complete record of all Founder decisions.

---

## WHAT HAPPENS NEXT?

### ✅ Step 1: Founder Review — COMPLETE

**Reviewed Documents:**
1. `COMMERCIAL_CONSTITUTION.md` (full constitution)
2. `COMMERCIAL_CONSTITUTION_SUMMARY.md` (this document)
3. `COMMERCIAL_OPEN_DECISIONS.md` (decisions required)
4. `COMMERCIAL_IMPLEMENTATION_BLUEPRINT.md` (engineering plan)

### ✅ Step 2: Founder Decisions — COMPLETE

**Six strategic decisions made:**
- Decision 1: Progressive Commercial Discovery
- Decision 2: Only Sell What Exists
- Decision 3: Guided Professional Trial
- Decision 4: Global Commercial Model (3 Layers)
- Decision 5: Transparent Annual Savings
- Decision 6: Strategic Partnership Model (Enterprise)

### ✅ Step 3: Constitutional Amendment — COMPLETE

**Constitution updated to v1.1:**
- All Founder decisions incorporated
- Document reads cohesively
- No conflicts or inconsistencies
- Status: Approved and Authoritative

### ⏳ Step 4: Implementation (Next Phase)

**Timeline:** 4-6 weeks

**Phase 1 (Weeks 1-3): P0 Critical Fixes**
- Fix plan naming (ESSENTIALS → STARTER)
- Implement dashboard visibility control
- Add API-level entitlement enforcement
- Remove client-count gating
- Define trial strategy
- Implement upgrade/downgrade flows

**Phase 2 (Weeks 4-5): P1 Improvements**
- Trial conversion flow
- Feature gates on pages
- Renewal reminders
- Cancellation UI
- Expiry warnings
- Reactivation flow

**Phase 3 (Week 6): P2 Polish**
- Plan indicators
- Upgrade CTAs
- Usage indicators
- Lifecycle emails
- Celebration moments

### Step 4: Verification

**Quarterly Audit:**  
Engineering audits implementation to ensure compliance with constitution

**Annual Review:**  
Founder reviews commercial performance and updates constitution as needed

---

## BENEFITS OF THIS APPROACH

### 1. Clarity

**Before:** Commercial decisions scattered across code, config, tribal knowledge  
**After:** One authoritative document everyone references

### 2. Consistency

**Before:** Pricing page says one thing, code does another  
**After:** Implementation derives from constitution

### 3. Scalability

**Before:** Every new country requires rethinking commercial model  
**After:** Constitution defines global principles, localization is presentation only

### 4. Accountability

**Before:** Engineers make commercial decisions independently  
**After:** All changes require constitutional amendment and Founder approval

### 5. Longevity

**Before:** Commercial model drifts over time  
**After:** Constitution governs for 5+ years with annual reviews

---

## COMPARISON TO EXISTING DOCUMENTS

### Homepage Constitution

**Scope:** Homepage content, messaging, narrative  
**Authority:** Governs homepage only  
**Relationship:** Commercial Constitution defines what to sell, Homepage Constitution defines how to present it

### Operational Truth

**Scope:** Kitchen operations, inventory, consumption, COGS  
**Authority:** Governs operational accuracy  
**Relationship:** Commercial Constitution defines who gets access to operational features

### Financial Truth

**Scope:** Financial reporting, revenue recognition, cost tracking  
**Authority:** Governs financial accuracy  
**Relationship:** Commercial Constitution defines pricing that drives financial truth

### Commercial Constitution (NEW)

**Scope:** Pricing, plans, features, subscriptions, entitlements  
**Authority:** Governs all commercial decisions  
**Relationship:** Highest authority for commercial architecture

---

## ✅ CONSTITUTION APPROVED

**Status:** Founder Approved (Version 1.1)  
**Approval Date:** 2026-07-03

### What Was Approved

1. ✅ **5-tier plan structure** (Starter → Professional → Business → Premium → Enterprise)
2. ✅ **Pricing** (15K, 35K, 75K, 200K, Custom in RWF)
3. ✅ **Business maturity philosophy** (features aligned to growth stages)
4. ✅ **Guided Professional Trial** (14 days, progressive introduction)
5. ✅ **Upgrade/downgrade policies** (immediate upgrade, next-cycle downgrade)
6. ✅ **Global Commercial Model** (3-layer architecture)
7. ✅ **Governance model** (constitutional amendments required for changes)
8. ✅ **Progressive Commercial Discovery** (show owned, expose next step, hide distant)
9. ✅ **Only Sell What Exists** (production-ready features only)
10. ✅ **Transparent Annual Savings** (25% = 3 free months, always displayed)
11. ✅ **Strategic Partnership Model** (Enterprise with no minimums)

### Benefits Achieved

**✅ Clarity** — One authoritative document everyone references  
**✅ Consistency** — Implementation derives from constitution  
**✅ Scalability** — Global framework with local presentation  
**✅ Accountability** — All changes require constitutional amendment  
**✅ Longevity** — Governs for 5+ years with annual reviews  
**✅ Revenue Protection** — Closes 30-50% leakage through consistent enforcement

---

## NEXT STEPS

### ⏳ Implementation Phase (4-6 Weeks)

Engineering will now implement Commercial Truth according to the approved constitution.

**Phase 1 (Weeks 1-3): P0 Critical Fixes**
- Fix plan naming (ESSENTIALS → STARTER)
- Implement Progressive Commercial Discovery
- Add API-level entitlement enforcement
- Remove client-count gating
- Implement Guided Professional Trial
- Implement upgrade/downgrade flows

**Phase 2 (Weeks 4-5): P1 Improvements**
- Trial conversion flow with usage-based recommendations
- Contextual feature gates
- Renewal reminders
- Cancellation UI
- Expiry warnings
- Reactivation flow

**Phase 3 (Week 6): P2 Polish**
- Plan indicators
- Contextual upgrade CTAs
- Usage indicators
- Lifecycle emails
- Celebration moments

### Ongoing Governance

**Quarterly:** Compliance audits to ensure implementation matches constitution  
**Annually:** Constitutional review (next review: 2027-07-01)

---

**Prepared By:** Chief Product Architect / Commercial Systems Architect  
**Initial Draft:** 2026-07-02  
**Amended:** 2026-07-03  
**Status:** ✅ Founder Approved (Version 1.1)

**Constitution is now authoritative. Engineering may proceed with implementation.**
