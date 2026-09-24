# COMMERCIAL CONSTITUTION — COMPLETION REPORT

**Date:** 2026-07-02  
**Status:** ✅ Complete (Documentation Only, No Implementation)  
**Next Step:** Founder Review and Approval

---

## EXECUTIVE SUMMARY

The **Commercial Constitution** for ImboniServe has been completed. This constitutional framework establishes the permanent, authoritative reference for all commercial decisions—pricing, plans, features, subscriptions, entitlements, and policies—for the next 5+ years.

**Key Achievement:**  
Created a single source of truth that will prevent commercial drift, ensure consistency across all system layers, and scale globally as ImboniServe expands to new countries and markets.

---

## WHAT WAS DELIVERED

### 4 Constitutional Documents (3,535 lines total)

#### 1. COMMERCIAL_CONSTITUTION.md (1,316 lines)
**The permanent commercial reference document**

**12 Comprehensive Sections:**
1. Commercial Philosophy (Commercial Truth principles)
2. Approved Commercial Plans (5-tier structure frozen)
3. Official Pricing (RWF canonical pricing)
4. Canonical vs Display Pricing (Global-by-Design)
5. Business Maturity Philosophy (feature alignment)
6. Feature-to-Plan Mapping (90+ features mapped)
7. Dashboard Visibility Philosophy (discovery over frustration)
8. Trial Policy (14 days, Professional features)
9. Upgrade & Downgrade Philosophy (lifecycle behavior)
10. Localization & Commercial Expansion (global consistency)
11. Future Governance (amendment process, annual review)
12. Implementation Authority (technical files, compliance)

**Key Principles Established:**
- Commercial Truth: Every customer receives exactly what they purchased
- Implementation follows policy (not the reverse)
- Single source of truth for all commercial decisions
- Global consistency with local presentation
- 5+ year governance horizon

---

#### 2. COMMERCIAL_CONSTITUTION_SUMMARY.md (421 lines)
**Executive summary for Founder review**

**Contents:**
- What the constitution is and why it's needed
- Summary of all 12 sections
- Key decisions required
- Benefits of this approach
- Comparison to existing documents (Homepage Constitution, Operational Truth, Financial Truth)
- Risks of not approving
- Questions for Founder
- Next steps

**Purpose:**  
Provide Founder with quick understanding of constitutional framework without reading full 1,316-line document.

---

#### 3. COMMERCIAL_OPEN_DECISIONS.md (705 lines)
**6 strategic decisions requiring Founder approval**

**Decisions:**
1. **Locked Feature Visibility** — Show with lock icons vs hide vs hybrid?
2. **Mock Features** — Complete vs remove vs mark "Coming Soon" vs launch as-is?
3. **Trial Plan Entitlements** — Professional vs Starter vs Business features?
4. **Market-Specific Pricing** — Global consistency vs market adjustments?
5. **Annual Billing Messaging** — "Save 25%" vs "3 free months" vs both?
6. **Enterprise Minimum** — Annual contract vs quarterly vs no minimum?

**For Each Decision:**
- Context and background
- 2-4 detailed options with pros/cons
- Recommendation with rationale
- Approval checkbox for Founder

**Purpose:**  
Ensure Founder makes explicit decisions on strategic commercial questions rather than leaving them to engineering interpretation.

---

#### 4. COMMERCIAL_IMPLEMENTATION_BLUEPRINT.md (1,093 lines)
**Complete engineering implementation architecture**

**Contents:**
- Implementation philosophy (5 core principles)
- 8 implementation layers with detailed specifications
- 6-week implementation timeline
- Testing strategy (unit, integration, E2E, manual)
- Rollout strategy (staging → gradual → full production)
- Monitoring & metrics
- Rollback plan
- Compliance verification (quarterly audits)
- Success criteria (P0, P1, P2)

**8 Implementation Layers:**
1. Entitlement Definitions
2. Pricing Configuration
3. API Enforcement (~100 endpoints)
4. Dashboard Visibility
5. UI Feature Gates
6. Trial Implementation
7. Upgrade/Downgrade Flows
8. Feature Flags Cleanup

**Purpose:**  
Provide engineering with complete architectural blueprint for implementing Commercial Truth after constitution approval.

---

## CONSTITUTIONAL HIGHLIGHTS

### Commercial Truth Principle

**Definition:**  
Every feature promised must exist, every feature included in a subscription must be available, and every feature excluded must be consistently restricted.

**7 Core Principles:**
1. **Exact Entitlement** — Customers receive exactly what they purchased
2. **Promise = Reality** — No feature advertised unless it exists
3. **Consistent Enforcement** — Enforcement across all layers (API, UI, dashboard, billing)
4. **Single Source of Truth** — Constitution is authoritative
5. **Customer-First Transparency** — Clear understanding of what they're buying
6. **Business Maturity Alignment** — Features support growth stages
7. **Global Consistency** — Commercial model scales globally

---

### Official Commercial Plans (Frozen for RC1)

**5-Tier Structure:**
1. **Starter** — Small cafés getting started (15,000 RWF/month)
2. **Professional** — Established restaurants growing (35,000 RWF/month)
3. **Business** — Hotels and chains scaling (75,000 RWF/month)
4. **Premium** — Advanced businesses optimizing (200,000 RWF/month)
5. **Enterprise** — Large organizations (Custom pricing)

**Deprecated Names:**  
❌ Essentials, Basic, Standard, Growth, Advanced, Ultimate

**Annual Billing:**  
25% savings (equivalent to 3 free months)

---

### Global-by-Design Architecture

**Canonical Pricing (RWF):**  
Internal commercial source of truth for billing, subscriptions, reporting

**Display Pricing (Local Currency):**  
Customer-facing prices in local currency (€10, $12, ₹800)

**Philosophy:**  
Localization affects presentation (currency, tax, payment, language). Localization does NOT redefine commercial architecture (plans, features, entitlements).

**Benefit:**  
ImboniServe can expand to any country without redesigning the commercial model.

---

### Business Maturity Philosophy

**Plans represent business growth stages:**

| Stage | Plan | Business Profile | Key Needs |
|-------|------|------------------|-----------|
| Starting | Starter | Small café, new business | Get operational, serve customers |
| Growing | Professional | Established restaurant | Improve efficiency, scale operations |
| Scaling | Business | Hotel, chain, high-volume | Multi-location coordination |
| Optimizing | Premium | Advanced business | AI insights, automation |
| Enterprise | Enterprise | Large organization | Custom infrastructure, governance |

**Principle:**  
Features exist in specific plans because they support specific stages of business maturity—not because of arbitrary pricing differentiation.

---

### Trial Strategy (Recommended)

**Duration:** 14 days  
**Entitlements:** Professional plan features  
**Rationale:** Showcase value beyond basic Starter, drive conversions

**Conversion Flow:**
- 7 days before expiry: Email + in-app countdown
- 3 days before expiry: Banner + upgrade prompt
- 1 day before expiry: Push notification
- On expiry: Redirect to pricing page

**Data Retention:**
- 0-3 days: Full access (grace period)
- 4-30 days: Read-only access
- 31-90 days: Data archived
- 91+ days: Data deleted (with notice)

---

### Upgrade & Downgrade Policies

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

---

### Future Governance

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

**Promotional Pricing:**  
Allowed but must be time-limited, documented, and Founder-approved

**A/B Testing:**  
Allowed for optimization but must not violate Commercial Truth

---

## RELATIONSHIP TO EXISTING DOCUMENTS

### Homepage Constitution
**Scope:** Homepage content, messaging, narrative  
**Relationship:** Defines how to present commercial model

### Operational Truth
**Scope:** Kitchen operations, inventory, consumption, COGS  
**Relationship:** Defines operational accuracy

### Financial Truth
**Scope:** Financial reporting, revenue recognition, cost tracking  
**Relationship:** Defines financial accuracy

### Commercial Constitution (NEW)
**Scope:** Pricing, plans, features, subscriptions, entitlements  
**Relationship:** Highest authority for commercial architecture

**Together, these 4 documents form the constitutional foundation of ImboniServe.**

---

## OPEN DECISIONS SUMMARY

| # | Decision | Options | Recommendation |
|---|----------|---------|----------------|
| 1 | Locked Feature Visibility | A: Visible with locks<br>B: Hidden<br>C: Hybrid | A (discovery-focused) |
| 2 | Mock Features | A: Complete first<br>B: Remove<br>C: Mark "Coming Soon"<br>D: Launch as-is | C (maintain value, set expectations) |
| 3 | Trial Plan | A: Professional<br>B: Starter<br>C: Business | A (balance value and expectations) |
| 4 | Market Pricing | A: Global consistency<br>B: Market-specific | A (simplicity, fairness) |
| 5 | Annual Messaging | A: "Save 25%"<br>B: "3 free months"<br>C: Both | C (maximize clarity) |
| 6 | Enterprise Minimum | A: Annual, 300K/month<br>B: Quarterly, 250K/month<br>C: No minimum | A (justify resources) |

**All decisions include detailed analysis in `COMMERCIAL_OPEN_DECISIONS.md`**

---

## IMPLEMENTATION TIMELINE

### Week 1-2: P0 Critical Fixes
- Fix plan naming (ESSENTIALS → STARTER)
- Update pricing (12,500 → 15,000)
- Implement dashboard visibility control
- Remove client-count gating
- Create feature-level API middleware
- Apply middleware to ~100 endpoints

### Week 3: P0 Subscription Lifecycle
- Implement upgrade API and UI
- Implement downgrade API and UI

### Week 4-5: P1 Improvements
- Trial conversion flow
- Feature gates on pages
- Renewal reminders
- Cancellation UI
- Expiry warnings
- Reactivation flow

### Week 6: P2 Polish
- Plan indicators and branding
- Upgrade CTAs
- Usage indicators
- Lifecycle emails
- Celebration moments

**Total Timeline:** 4-6 weeks from approval to full implementation

---

## SUCCESS CRITERIA

### P0 Success (Required)
- ✅ All plans use correct naming (STARTER, not ESSENTIALS)
- ✅ All plans use correct pricing (15K, 35K, 75K, 200K, Custom)
- ✅ Dashboard navigation filtered by subscription tier
- ✅ All commercial API endpoints enforce entitlements
- ✅ No client-count gating for commercial features
- ✅ Trial grants Professional entitlements
- ✅ Users can upgrade and downgrade plans
- ✅ Data retention policy documented and enforced

### P1 Success (Recommended)
- ✅ Trial conversion rate increases by 20%+
- ✅ Feature gates prevent unauthorized access
- ✅ Renewal reminders reduce churn by 10%+
- ✅ Cancellation UI captures reasons
- ✅ Expiry warnings reduce surprise cancellations
- ✅ Reactivation flow reduces friction

### P2 Success (Optimization)
- ✅ Plan indicators improve brand perception
- ✅ Upgrade CTAs increase upgrade rate by 15%+
- ✅ Usage indicators drive feature adoption
- ✅ Lifecycle emails improve engagement
- ✅ Celebration moments increase retention

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

### 6. Revenue Protection
**Before:** Revenue leakage (30-50% of potential upgrades lost)  
**After:** Consistent enforcement across all layers

---

## RISKS OF NOT APPROVING

### Risk 1: Revenue Leakage Continues
**Current State:** Customers get Premium features on Starter plan  
**Impact:** 30-50% of potential upgrades lost  
**Without Constitution:** No authoritative reference to fix against

### Risk 2: Commercial Drift
**Current State:** Implementation diverges from intent  
**Impact:** Pricing page promises don't match reality  
**Without Constitution:** Drift continues unchecked

### Risk 3: Scaling Challenges
**Current State:** Every new country requires rethinking commercial model  
**Impact:** Slow international expansion  
**Without Constitution:** No global framework

### Risk 4: Engineering Confusion
**Current State:** Engineers make commercial decisions independently  
**Impact:** Inconsistent enforcement, support burden  
**Without Constitution:** No clear authority to reference

---

## NEXT STEPS

### Step 1: Founder Review (This Week)

**Review Documents:**
1. `COMMERCIAL_CONSTITUTION.md` — Full constitution (1,316 lines)
2. `COMMERCIAL_CONSTITUTION_SUMMARY.md` — Executive summary (421 lines)
3. `COMMERCIAL_OPEN_DECISIONS.md` — 6 decisions required (705 lines)
4. `COMMERCIAL_IMPLEMENTATION_BLUEPRINT.md` — Engineering plan (1,093 lines)

**Estimated Review Time:** 2-3 hours

---

### Step 2: Founder Decisions

**Make 6 Strategic Decisions:**
1. Locked feature visibility strategy
2. Mock features approach
3. Trial plan entitlements
4. Market-specific pricing policy
5. Annual billing messaging
6. Enterprise minimum commitment

**Use:** `COMMERCIAL_OPEN_DECISIONS.md` (detailed analysis for each)

---

### Step 3: Founder Approval

**Options:**
- [ ] **APPROVE** — Constitution becomes authoritative reference
- [ ] **APPROVE WITH AMENDMENTS** — Specify required changes
- [ ] **DO NOT APPROVE** — Specify concerns

**Sign:** `COMMERCIAL_CONSTITUTION.md` (Appendix B signature section)

---

### Step 4: Implementation (After Approval)

**Timeline:** 4-6 weeks

**Process:**
1. Engineering implements per blueprint
2. Staging deployment and testing
3. Gradual production rollout
4. Full production deployment
5. Quarterly compliance audits

**Blueprint:** `COMMERCIAL_IMPLEMENTATION_BLUEPRINT.md`

---

## QUESTIONS FOR FOUNDER

### Constitutional Approval
1. Do you approve the 5-tier plan structure (Starter → Professional → Business → Premium → Enterprise)?
2. Do you approve the pricing (15K, 35K, 75K, 200K, Custom)?
3. Do you approve the business maturity philosophy (features aligned to growth stages)?
4. Do you approve the trial strategy (14 days, Professional features)?
5. Do you approve the upgrade/downgrade policies (immediate upgrade, next-cycle downgrade)?
6. Do you approve the Global-by-Design approach (canonical pricing in RWF, display pricing localized)?
7. Do you approve the governance model (constitutional amendments required for changes)?

### Open Decisions
8. Which locked feature visibility strategy? (A: Visible with locks, B: Hidden, C: Hybrid)
9. How to handle mock features? (A: Complete first, B: Remove, C: Mark "Coming Soon", D: Launch as-is)
10. What trial entitlements? (A: Professional, B: Starter, C: Business)
11. Market-specific pricing? (A: Global consistency, B: Market adjustments)
12. Annual billing messaging? (A: "Save 25%", B: "3 free months", C: Both)
13. Enterprise minimum? (A: Annual/300K, B: Quarterly/250K, C: No minimum)

---

## RECOMMENDATION

**✅ APPROVE COMMERCIAL CONSTITUTION**

**Rationale:**
1. Establishes permanent commercial reference (5+ year horizon)
2. Prevents commercial drift and inconsistency
3. Scales globally with localization
4. Provides clear implementation blueprint
5. Ensures Commercial Truth compliance
6. Protects revenue (closes 30-50% leakage)
7. Enables confident international expansion

**Timeline:**
- **This Week:** Founder review and approval
- **Next 4-6 Weeks:** Engineering implementation
- **Quarterly:** Compliance audits
- **Annually:** Constitutional review

**Impact:**
- ✅ Commercial Truth achieved
- ✅ Revenue leakage closed
- ✅ Global scalability enabled
- ✅ Engineering clarity established
- ✅ Customer trust maintained

---

## APPENDIX: DOCUMENT LOCATIONS

All constitutional documents are in the project root:

1. <ref_file file="C:/Dev/ImboniResto/COMMERCIAL_CONSTITUTION.md" />
2. <ref_file file="C:/Dev/ImboniResto/COMMERCIAL_CONSTITUTION_SUMMARY.md" />
3. <ref_file file="C:/Dev/ImboniResto/COMMERCIAL_OPEN_DECISIONS.md" />
4. <ref_file file="C:/Dev/ImboniResto/COMMERCIAL_IMPLEMENTATION_BLUEPRINT.md" />

**Related Documents:**
- <ref_file file="C:/Dev/ImboniResto/COMMERCIAL_FEATURE_MATRIX.md" />
- <ref_file file="C:/Dev/ImboniResto/COMMERCIAL_ENTITLEMENT_AUDIT.md" />
- <ref_file file="C:/Dev/ImboniResto/DASHBOARD_VISIBILITY_AUDIT.md" />
- <ref_file file="C:/Dev/ImboniResto/SUBSCRIPTION_LIFECYCLE_AUDIT.md" />
- <ref_file file="C:/Dev/ImboniResto/COMMERCIAL_RECOMMENDATIONS.md" />
- <ref_file file="C:/Dev/ImboniResto/COMMERCIAL_TRUTH_CERTIFICATION.md" />
- <ref_file file="C:/Dev/ImboniResto/RC1_COMMERCIAL_TRUTH_CERTIFICATE.md" />

**Acceptance Log:**
- <ref_file file="C:/Dev/ImboniResto/RC1_FOUNDER_ACCEPTANCE_LOG.md" />

---

**Prepared By:** Chief Product Architect / Commercial Systems Architect  
**Date:** 2026-07-02  
**Status:** ✅ Complete (Documentation Only, No Implementation)

---

## HARD STOP

**Commercial Constitution is complete.**

**No implementation has been performed.**

**Awaiting Founder review and approval.**

**After approval, engineering will implement per blueprint over 4-6 weeks.**

---

**END OF COMPLETION REPORT**
