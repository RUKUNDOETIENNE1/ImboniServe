# COMMERCIAL CONSTITUTION

**Product:** ImboniServe  
**Version:** RC1  
**Effective Date:** 2026-07-02  
**Last Amended:** 2026-07-03  
**Status:** Authoritative Commercial Reference  
**Governance:** All commercial implementation must derive from this document

---

## PREAMBLE

This document establishes the **Commercial Constitution** for ImboniServe—the permanent, authoritative reference for all commercial decisions, pricing, subscriptions, feature access, billing, onboarding, and entitlements.

**Purpose:**  
To ensure that every customer receives exactly what they purchased, that every promise matches reality, and that commercial behavior remains consistent across all system layers—frontend, backend, APIs, billing, and onboarding.

**Authority:**  
No engineer, product manager, or system may make commercial decisions independently. All commercial implementation must derive from this constitution. Any proposed change to pricing, plans, features, or policies must first update this document and receive Founder approval.

**Scope:**  
This constitution governs ImboniServe's commercial architecture for the next 5+ years, across all countries, currencies, payment providers, hospitality segments, and subscription models.

---

## SECTION 1 — COMMERCIAL PHILOSOPHY

### 1.1 Commercial Truth

**Commercial Truth** is the foundational principle that governs all commercial behavior in ImboniServe.

**Definition:**  
Commercial Truth means that every feature promised must exist, every feature included in a subscription must be available, and every feature excluded must be consistently restricted. The commercial model is the single source of truth across all system layers.

### 1.2 Core Principles

**Principle 1: Exact Entitlement**  
Every customer receives exactly what they purchased. No more. No less.

**Principle 2: Promise = Reality (Only Sell What Exists)**  
The pricing page is a commercial contract, not a product roadmap. Only production-ready capabilities may be advertised in commercial packaging. Future capabilities belong in roadmaps, release notes, and product announcements—never in pricing materials. If a capability is usable but still evolving, it may be labeled "Early Access." If a capability is not operational, it must be removed from pricing until ready.

**Principle 3: Consistent Enforcement**  
No feature may be available outside its approved commercial policy unless intentionally granted (e.g., trial, promotion, grandfather clause). Enforcement must be consistent across:
- Backend APIs
- Frontend UI
- Dashboard visibility
- Billing systems
- Onboarding flows
- Documentation

**Principle 4: Single Source of Truth**  
Commercial decisions belong to one authoritative source: this constitution. Implementation follows policy—not the reverse.

**Principle 5: Customer-First Transparency**  
Customers must clearly understand what they're purchasing, what they're receiving, and how to access more value. Confusion is a commercial failure. Customers should never feel restricted—they should feel that the platform grows together with their business.

**Principle 6: Business Maturity Alignment**  
Features exist in specific plans because they support specific stages of business maturity—not because of arbitrary pricing differentiation.

**Principle 7: Global Consistency**  
Localization affects currency, taxation, payment providers, and language. Localization does not redefine the commercial platform. The commercial architecture remains globally consistent.

### 1.3 Anti-Patterns

The following practices violate Commercial Truth and are prohibited:

❌ **Revenue Leakage** — Customers receiving features they didn't pay for  
❌ **Broken Promises** — Features advertised but not functional  
❌ **Roadmap as Pricing** — Advertising future capabilities in commercial packaging  
❌ **Inconsistent Enforcement** — Features accessible in UI but blocked in API (or vice versa)  
❌ **Commercial Drift** — Implementation diverging from approved commercial model  
❌ **Hidden Policies** — Commercial decisions made in code without documentation  
❌ **Arbitrary Gating** — Features restricted based on non-commercial criteria (e.g., client count, usage metrics) instead of subscription tier  
❌ **Mock Features in Production** — Placeholder implementations presented as real capabilities  
❌ **Restrictive UX** — Making customers feel limited rather than supported in their growth journey

### 1.4 Commercial Truth Hierarchy

When conflicts arise, the following hierarchy applies:

1. **This Constitution** — Authoritative commercial reference
2. **Founder Approval** — Explicit written approval for exceptions or changes
3. **Entitlement System** — Technical implementation of commercial policy
4. **Pricing Page** — Public commercial promise
5. **Implementation** — Code must conform to policy

If implementation contradicts this constitution, implementation is wrong and must be corrected.

### 1.5 Product Demonstration Principle

**Demonstrations are educational experiences, not commercial entitlements.**

ImboniServe's customer journey includes distinct phases:

1. **Public Website** — Marketing and information
2. **Product Demonstration** — Educational showcase
3. **Guided Trial** — Hands-on learning journey
4. **Commercial Subscription** — Purchased entitlements

**Demonstration Philosophy:**  
Sales demonstrations may showcase any capability to educate prospects about the platform's potential—including OCR Menu Builder, AI Menu Builder, QR Ordering, Inventory, Analytics, and Premium workflows. Showing a capability during a demonstration does not imply that every subscription includes that capability.

**Commercial Access:**  
Only purchased subscriptions govern actual feature access. Demonstrations are educational; subscriptions are contractual.

---

## SECTION 2 — APPROVED COMMERCIAL PLANS

### 2.1 Official Plan Ladder

The official ImboniServe commercial ladder consists of five (5) plans:

1. **Starter**
2. **Professional**
3. **Business**
4. **Premium**
5. **Enterprise**

These names are **frozen** as of RC1 and replace all legacy naming conventions.

### 2.2 Legacy Naming (DEPRECATED)

The following plan names are **deprecated** and must not be used in any new implementation:

- ❌ Essentials
- ❌ Basic
- ❌ Standard
- ❌ Growth
- ❌ Advanced
- ❌ Ultimate

**Migration Policy:**  
Existing code referencing legacy names must be updated to use official names. The entitlement system may temporarily support aliases for backward compatibility, but all new code must use official names only.

### 2.3 Plan Codes

**Official Plan Codes (for internal systems):**

| Plan | Code | Status |
|------|------|--------|
| Starter | `STARTER` | Official |
| Professional | `PROFESSIONAL` | Official |
| Business | `BUSINESS` | Official |
| Premium | `PREMIUM` | Official |
| Enterprise | `ENTERPRISE` | Official |
| Essentials | `ESSENTIALS` | Deprecated (alias to STARTER) |

**Implementation Note:**  
The entitlement system may temporarily support `ESSENTIALS` as an alias to `STARTER` for backward compatibility, but all new subscriptions must use `STARTER`.

### 2.4 Plan Positioning

Each plan represents a distinct stage of business maturity:

**Starter** — Small cafés, food stalls, and new businesses getting started  
**Professional** — Established restaurants and cafés with growing operations  
**Business** — Hotels, chains, and high-volume restaurants scaling operations  
**Premium** — Advanced businesses requiring optimization, automation, and intelligence  
**Enterprise** — Large organizations with specialized operational and governance requirements

---

## SECTION 3 — OFFICIAL PRICING

### 3.1 Canonical Pricing (RWF)

**Canonical pricing** is the internal commercial source of truth, maintained in Rwandan Francs (RWF).

#### Monthly Billing

| Plan | Monthly Price (RWF) |
|------|---------------------|
| Starter | 15,000 |
| Professional | 35,000 |
| Business | 75,000 |
| Premium | 200,000 |
| Enterprise | Custom |

#### Annual Billing

Annual billing provides **25% savings**, equivalent to **three free months**.

**Annual Pricing (per month, billed annually):**

| Plan | Annual Monthly Rate (RWF) | Annual Total (RWF) |
|------|---------------------------|---------------------|
| Starter | 12,000 | 144,000 |
| Professional | 28,000 | 336,000 |
| Business | 60,000 | 720,000 |
| Premium | 160,000 | 1,920,000 |
| Enterprise | Custom | Custom |

**Calculation Formula:**  
- Annual Monthly Rate = Monthly Price × 0.80 (20% discount)
- Annual Total = Annual Monthly Rate × 12
- Savings = Monthly Price × 12 - Annual Total = Monthly Price × 3

**Note:** The 25% savings is calculated as: (Monthly Price - Annual Monthly Rate) / Monthly Price = 0.25

### 3.2 Pricing Philosophy

**Transparency:**  
Pricing is simple, predictable, and transparent. No hidden fees, no surprise charges, no complex tier calculations. Customers should never need to calculate savings themselves.

**Value-Based:**  
Pricing reflects business maturity and value delivered, not arbitrary feature counts.

**Stable:**  
Pricing changes require Founder approval and constitutional amendment. Existing customers may be grandfathered at their original pricing.

**Global:**  
Canonical pricing in RWF serves as the commercial reference for all markets. Display pricing may be localized (see Section 4).

### 3.3 Annual Billing Presentation

**Required Display Elements:**  
When presenting annual billing options, always display:
1. Monthly price (e.g., 15,000 RWF/month)
2. Regular annual value (e.g., 180,000 RWF/year)
3. Discounted annual value (e.g., 135,000 RWF/year)
4. Savings (e.g., Save 45,000 RWF)

**Standard Language:**  
"Pay annually and save 25% — equivalent to 3 free months."

**Consistency:**  
This presentation must be maintained consistently across:
- Homepage
- Pricing page
- Checkout flows
- Invoices
- Renewal reminders
- All future commercial materials

**Philosophy:**  
Annual billing should be recommended, never forced. Customers should clearly understand the value of annual commitment without needing to perform calculations.

### 3.4 Enterprise: Strategic Partnership Model

**Philosophy:**  
Enterprise is not simply another subscription tier. Enterprise represents a **strategic partnership** that begins where the standard platform ends.

**Pricing:**  
Enterprise pricing remains custom and negotiated. Commercial terms are tailored to each partnership.

**No Constitutional Minimums:**  
Unlike standard plans, Enterprise has no minimum:
- Monthly amount
- Annual contract duration
- Commitment period

**Qualification Focus:**  
Enterprise qualification focuses on operational complexity rather than revenue thresholds:
- Multi-entity organizations
- Regional operations (multiple countries/markets)
- Custom integrations and workflows
- Dedicated infrastructure requirements
- SSO and advanced security
- Compliance and audit requirements
- Enterprise SLA and uptime guarantees
- Implementation services and training

**Engagement Model:**  
Enterprise engagements begin with consultation rather than self-service checkout. Each partnership is designed collaboratively.

**Approval:**  
Every Enterprise engagement requires Founder (or delegated commercial leadership) approval.

---

## SECTION 4 — GLOBAL COMMERCIAL MODEL

### 4.1 Global-by-Design Philosophy

ImboniServe is **Global-by-Design**, meaning the platform is architected to serve customers worldwide while maintaining a single, consistent commercial model.

**Three Commercial Layers:**

1. **Canonical Commercial Pricing** — Internal, stable, authoritative
2. **Localized Display Pricing** — Customer-facing, approximate, informational
3. **Regional Commercial Policy** — Future capability for market-specific strategies

### 4.2 Layer 1: Canonical Commercial Pricing

**Definition:**  
Canonical pricing is the internal commercial source of truth.

**Characteristics:**
- Internal (not customer-facing)
- Stable (changes require constitutional amendment)
- Authoritative (governs all billing and entitlements)

**Currency:**  
Initially maintained in **RWF (Rwandan Francs)** as the reference currency.

**Used By:**
- Subscription management
- Billing calculations
- Entitlement decisions
- Revenue reporting
- Commercial analytics
- Financial forecasting

**Authority:**  
Canonical pricing is defined in this constitution (Section 3) and implemented in `src/config/pricing.ts`.

### 4.3 Layer 2: Localized Display Pricing

**Definition:**  
Display pricing is the customer-facing price shown on the pricing page, marketing materials, and checkout flows.

**Characteristics:**
- Customer-facing (public)
- Localized (in customer's preferred currency)
- Approximate (calculated from canonical pricing via exchange rates)
- Informational (does not redefine commercial model)

**Purpose:**  
Provide localized convenience for customers in their preferred currency.

**Examples:**

| Market | Display Currency | Starter (Monthly) | Professional (Monthly) |
|--------|-----------------|-------------------|------------------------|
| Rwanda | RWF | 15,000 | 35,000 |
| Germany | EUR | ≈ €10 | ≈ €23 |
| Mexico | MXN | ≈ MX$210 | ≈ MX$490 |
| United States | USD | ≈ $12 | ≈ $28 |

**Important:**  
Display pricing never changes the commercial model. It is a presentation layer only.

### 4.4 Layer 3: Regional Commercial Policy

**Definition:**  
Regional commercial policy allows market-specific pricing strategies in the future.

**Status:**  
Not active during RC1. May be introduced later based on:
- Market maturity
- Customer demand
- Purchasing power dynamics
- Competitive landscape
- Founder approval

**Philosophy:**  
The commercial architecture supports regional pricing capabilities, but commercial policy remains globally consistent unless explicitly amended.

**Governance:**  
Any regional pricing strategy requires:
1. Market analysis and business case
2. Constitutional amendment
3. Founder approval
4. Clear documentation of rationale and duration

### 4.5 Billing Currency

**Final billing currency** depends on:
- Customer's configured billing region
- Supported payment providers in that region
- Currency conversion capabilities
- Regulatory requirements

**Default Behavior:**  
If a customer's region supports direct RWF billing, bill in RWF. Otherwise, bill in the most appropriate supported currency for that region.

### 4.6 Currency Conversion

**Conversion Method:**  
Display prices are calculated using:
1. Canonical price in RWF
2. Current exchange rate (updated daily/weekly)
3. Rounding to customer-friendly values (e.g., $11.73 → $12)

**Conversion Responsibility:**  
Currency conversion is handled by the pricing display layer, not the subscription or billing layer.

**Audit Trail:**  
All subscriptions record both:
- Canonical price (RWF)
- Billing price (customer's currency)
- Exchange rate at time of transaction

---

## SECTION 5 — BUSINESS MATURITY PHILOSOPHY

### 5.1 Maturity-Driven Design

ImboniServe's commercial plans represent **business maturity stages**, not arbitrary feature bundles.

**Philosophy:**  
As a hospitality business grows, its operational needs evolve. Plans should naturally align with these stages, making it obvious when a business has "outgrown" its current plan.

### 5.2 Maturity Stages

#### Stage 1: Starting (Starter Plan)

**Business Profile:**  
- Small café, food stall, or new restaurant
- Single location
- Owner-operated or small team
- Focus: Get operational, serve customers, manage basics

**Operational Needs:**  
- Take orders
- Manage tables
- Track inventory (basic)
- Process payments
- Generate basic reports
- Create QR menus

**Commercial Justification:**  
Starter provides everything needed to open and run a hospitality business. No unnecessary complexity.

---

#### Stage 2: Growing (Professional Plan)

**Business Profile:**  
- Established restaurant or café
- Growing customer base
- Hiring staff
- Focus: Improve efficiency, scale operations, enhance customer experience

**Operational Needs:**  
- Everything in Starter, plus:
- Reservations (customer experience)
- Staff management (delegation)
- Inventory alerts (proactive management)
- Procurement workflow (structured purchasing)
- Payment analytics (financial insights)
- Menu performance (optimization)
- WhatsApp campaigns (customer engagement)

**Commercial Justification:**  
Professional adds tools that help growing businesses operate more efficiently and serve more customers without chaos.

---

#### Stage 3: Scaling (Business Plan)

**Business Profile:**  
- Hotel, chain, or high-volume restaurant
- Multiple locations or outlets
- Larger team with specialized roles
- Focus: Coordinate across locations, maintain consistency, optimize operations

**Operational Needs:**  
- Everything in Professional, plus:
- Multi-branch management (up to 3 locations)
- Kitchen Display System (high-volume coordination)
- Supplier portal (vendor collaboration)
- WhatsApp segments (targeted marketing)
- QR analytics (customer behavior)
- Payment analytics pro (financial intelligence)
- Menu performance by branch (cross-location insights)

**Commercial Justification:**  
Business adds capabilities required to scale beyond a single location while maintaining operational consistency.

---

#### Stage 4: Optimizing (Premium Plan)

**Business Profile:**  
- Advanced hospitality business
- Multiple locations (unlimited)
- Data-driven decision making
- Focus: Maximize efficiency, automate operations, optimize revenue

**Operational Needs:**  
- Everything in Business, plus:
- Unlimited branches and outlets
- KDS Advanced (fine dining coordination)
- Recipe management (cost control)
- Inventory auto-reorder (automation)
- WhatsApp automation (marketing efficiency)
- A/B testing (optimization)
- Optimization hub (AI-driven insights)
- Revenue intelligence (financial optimization)
- API access (custom integrations)
- White-label (brand customization)

**Commercial Justification:**  
Premium provides AI-driven optimization, automation, and intelligence for businesses focused on maximizing performance.

---

#### Stage 5: Enterprise (Enterprise Plan)

**Business Profile:**  
- Large hospitality organization
- Complex operational requirements
- Specialized governance needs
- Focus: Custom infrastructure, compliance, enterprise-grade support

**Operational Needs:**  
- Everything in Premium, plus:
- Dedicated infrastructure
- Custom integrations
- SSO and custom roles
- Regional data residency
- Custom workflows
- Audit exports
- Enterprise SLA
- Dedicated account manager
- Training and onboarding

**Commercial Justification:**  
Enterprise provides custom solutions for organizations with specialized requirements that cannot be met by standard plans.

---

### 5.3 Feature Placement Criteria

When deciding which plan should include a feature, ask:

1. **Business Maturity:** At what stage does a business genuinely need this capability?
2. **Operational Complexity:** Does this feature address complexity that emerges at a specific growth stage?
3. **Value Alignment:** Does the feature's value justify the plan's price point?
4. **Natural Progression:** Does this feature make sense as part of a growth journey?

**Anti-Pattern:**  
Do not distribute features simply to justify pricing tiers. Every feature should have a clear business maturity justification.

---

## SECTION 6 — FEATURE-TO-PLAN MAPPING

### 6.1 Mapping Philosophy

This section defines the **official package contents** for each plan. These mappings are derived from the Commercial Feature Matrix and represent the authoritative feature distribution.

**Important:**  
This mapping is **frozen** for RC1. Any future changes require Founder approval and constitutional amendment.

### 6.2 Starter Plan Features

#### Core Operations
- ✅ Dashboard (overview)
- ✅ Orders management
- ✅ Tables management
- ✅ Kitchen tickets (basic)
- ✅ Menu management

#### Inventory & Procurement
- ✅ Basic inventory tracking
- ✅ Basic supplier orders

#### Payments & Financial
- ✅ Payment processing (all methods)
- ✅ Transactions view
- ✅ Payout summary
- ✅ Payment settings

#### Reports & Analytics
- ✅ Basic reports (daily, weekly, monthly)

#### Marketing & Growth
- ✅ Basic CRM (customer contacts)
- ✅ Referrals

#### QR & Digital
- ✅ QR Builder (5 codes maximum)
- ✅ Site Builder (preview mode)
- ✅ Discovery (basic listing)

#### AI & Resources
- ✅ 20 AI credits per month
- ✅ 2 GB storage

#### Multi-Location
- ✅ 1 branch, 1 outlet

#### Support
- ✅ Standard support (email/chat)

---

### 6.3 Professional Plan Features

**Includes everything in Starter, plus:**

#### Core Operations
- ✅ Reservations

#### Inventory & Procurement
- ✅ Inventory alerts
- ✅ Procurement workflow

#### Payments & Financial
- ✅ Payment monitor
- ✅ Payment analytics

#### Reports & Analytics
- ✅ Menu performance analytics
- ✅ Peak hours analytics

#### Marketing & Growth
- ✅ WhatsApp campaigns (basic)

#### Staff & Team
- ✅ Staff management
- ✅ Role-based access control

#### QR & Digital
- ✅ QR Builder (20 codes maximum)
- ✅ Site Builder (basic mode)

#### AI & Resources
- ✅ 50 AI credits per month
- ✅ 5 GB storage

#### Multi-Location
- ✅ 1 branch, unlimited outlets

#### Support
- ✅ Priority support (faster response)

---

### 6.4 Business Plan Features

**Includes everything in Professional, plus:**

#### Core Operations
- ✅ Kitchen Display System (KDS)

#### Inventory & Procurement
- ✅ Supplier portal
- ✅ Delivery confirmation

#### Payments & Financial
- ✅ Payment analytics pro
- ✅ Payout reconciliation

#### Reports & Analytics
- ✅ Menu performance by branch
- ✅ QR analytics
- ✅ QR analytics deep-dive

#### Marketing & Growth
- ✅ WhatsApp campaigns pro (segments)
- ✅ Campaign scheduling and templates
- ✅ A/B testing lite (1 concurrent test)

#### QR & Digital
- ✅ QR Builder (unlimited codes)
- ✅ Site Builder (pro mode)
- ✅ Discovery (featured listing)

#### AI & Resources
- ✅ 200 AI credits per month
- ✅ 20 GB storage

#### Multi-Location
- ✅ Up to 3 branches, unlimited outlets
- ✅ Multi-branch dashboard

#### Support
- ✅ Priority support

---

### 6.5 Premium Plan Features

**Includes everything in Business, plus:**

#### Core Operations
- ✅ KDS Advanced (course firing, expo mode)

#### Inventory & Procurement
- ✅ Recipe management with costing
- ✅ Inventory auto-reorder
- ✅ Prep plans and forecasting

#### Payments & Financial
- ✅ Revenue intelligence

#### Reports & Analytics
- ✅ Advanced reports and BI connectors

#### Marketing & Growth
- ✅ WhatsApp campaign automation
- ✅ A/B testing unlimited
- ✅ Optimization hub
- ✅ Customer feedback system

#### QR & Digital
- ✅ White-label options

#### AI & Resources
- ✅ Unlimited AI credits
- ✅ 100 GB storage

#### Multi-Location
- ✅ Unlimited branches and outlets

#### Advanced Features
- ✅ API access

#### Support
- ✅ Priority support

---

### 6.6 Enterprise Plan Features

**Includes everything in Premium, plus:**

#### Infrastructure
- ✅ Dedicated infrastructure
- ✅ On-premise deployment option
- ✅ Regional data residency

#### Integrations
- ✅ Custom integrations
- ✅ Custom development

#### Security & Governance
- ✅ SSO (Single Sign-On)
- ✅ Custom roles and permissions
- ✅ Audit exports
- ✅ Custom workflows

#### Support
- ✅ Enterprise SLA (guaranteed uptime)
- ✅ Dedicated account manager
- ✅ Training and onboarding

---

### 6.7 Feature Status and Commercial Packaging

**Production-Ready Features:**  
All features listed in this section (6.2-6.6) are production-ready and may be included in commercial packaging.

**Features Under Development:**  
Features that are not yet production-ready must not appear in commercial packaging (pricing page, plan descriptions, sales materials). They belong in roadmaps, release notes, and product announcements.

**Early Access Features:**  
If a capability is usable but still evolving, it may be included in commercial packaging with an "Early Access" label. This sets appropriate expectations while allowing customers to benefit from emerging capabilities.

**Commercial Truth Compliance:**  
Only production-ready capabilities may be advertised in commercial packaging. This is non-negotiable and enforced by Principle 2 (Promise = Reality).

---

## SECTION 7 — PROGRESSIVE COMMERCIAL DISCOVERY

### 7.1 Discovery Philosophy

**Core Principle:**  
Customers should never feel restricted. Customers should feel that the platform grows together with their business.

**Objective:**  
The dashboard experience should encourage growth, support business maturity, and surface upgrade opportunities naturally—without creating frustration or overwhelming users with distant capabilities.

### 7.2 Progressive Discovery Principles

**Principle 1: Show What They Own**  
Always display features included in the customer's current subscription. Never hide capabilities they've purchased.

**Principle 2: Expose the Next Logical Step**  
Surface features from the next subscription tier that represent the natural progression of their business journey.

**Examples:**
- Starter users discover Professional capabilities
- Professional users discover Business capabilities
- Business users discover Premium capabilities
- Premium users discover Enterprise engagement opportunities

**Principle 3: Hide Distant Future Capabilities**  
Do not show features that are multiple tiers away. A Starter user does not need to see Enterprise features—this creates overwhelm, not aspiration.

**Principle 4: Surface Upgrades Inside Workflows**  
Present upgrade opportunities contextually within relevant workflows, not as generic dashboard clutter.

**Principle 5: Avoid Dashboard Clutter**  
The navigation should remain clean, focused, and relevant to the customer's current business stage.

**Principle 6: Administrative Functionality is Never Upgrade Marketing**  
Internal tools, admin features, and diagnostic capabilities are never used as commercial upgrade prompts. These remain hidden from regular users.

### 7.3 Visibility Tiers

#### Tier 1: Owned Features (Always Visible)
Features included in the customer's current subscription:
- Fully accessible
- Shown in navigation
- No restrictions or prompts

**Examples for Starter:**
- Dashboard
- Orders
- Tables
- Menu
- Basic Inventory
- Transactions
- Settings
- Profile

#### Tier 2: Next-Tier Features (Contextually Discoverable)
Features from the immediately next subscription tier:
- Shown contextually within workflows
- Presented as growth opportunities
- Clear upgrade path provided

**Examples for Starter users (discovering Professional):**
- Reservations (shown when managing tables)
- Inventory Alerts (shown in inventory workflow)
- Staff Management (shown in settings)
- Payment Analytics (shown in transactions)

**Implementation:**
- Not prominently displayed in main navigation
- Surfaced as contextual prompts: "Unlock Reservations in Professional"
- Shown in dedicated "Grow Your Business" section

#### Tier 3: Distant Features (Hidden)
Features from tiers beyond the next level:
- Not shown in navigation
- Not shown in workflows
- Only visible on pricing page or upgrade comparison

**Examples for Starter users (hiding Business/Premium/Enterprise):**
- Multi-Branch Management
- Kitchen Display System
- AI Optimization
- Enterprise SSO

**Rationale:** These capabilities are not relevant to a Starter user's current business stage.

#### Tier 4: Administrative Features (Always Hidden)
Internal tools and admin-only capabilities:
- Never shown to regular users
- Only accessible to admin roles
- Never used for upgrade marketing

**Examples:**
- Payment Monitor (admin tool)
- Support Inbox (admin tool)
- Feature Flags (admin tool)
- Diagnostics (admin tool)

### 7.4 Contextual Upgrade Prompts

**When to Show:**
- User explores a workflow where next-tier features add value
- User reaches a usage limit (e.g., QR codes: 5/5 used)
- User completes a milestone that suggests readiness for next tier

**Prompt Content:**
- Feature name and value proposition
- Current plan vs next plan (not all plans)
- Specific benefit to their business stage
- "Upgrade to [Next Plan]" CTA
- Optional: "Start 14-day trial"

**Prompt Tone:**
- Supportive and encouraging (not restrictive)
- Growth-focused (platform grows with you)
- Contextual (relevant to current workflow)
- Aspirational (next step in your journey)

**Examples:**

**Starter user in Tables workflow:**
> "Ready to accept reservations? Upgrade to Professional to let customers book tables online."

**Professional user reaching 1 branch limit:**
> "Growing to multiple locations? Business plan supports up to 3 branches with centralized management."

### 7.5 Plan Indicators

**Topbar Badge:**  
Show current plan in topbar:
- Starter: Blue badge
- Professional: Purple badge
- Business: Orange badge
- Premium: Gold badge
- Enterprise: Custom branding

**Purpose:**  
Users should always know what plan they're on and feel proud of their current tier.

**Tone:**  
Celebratory, not limiting. "You're on Professional" not "You're only on Professional."

---

## SECTION 8 — GUIDED PROFESSIONAL TRIAL

### 8.1 Trial Philosophy

**Purpose:**  
The trial is not simply feature access. It is a **guided learning journey** designed to help customers understand operational value progressively.

**Principle:**  
Trial users receive Professional entitlements, but capabilities are introduced gradually through onboarding rather than overwhelming users on Day One.

### 8.2 Trial Strategy

**Trial Duration:** 14 days

**Trial Entitlements:** **Professional Plan Features**

**Rationale:**
1. **Showcase Value:** Professional features demonstrate value beyond basic Starter capabilities
2. **Guided Learning:** Capabilities introduced progressively through onboarding
3. **Natural Progression:** Users experience growth-stage features relevant to their business
4. **Usage-Based Recommendation:** At trial completion, recommend the subscription that best matches actual customer usage

**Progressive Introduction:**  
Rather than granting all Professional features immediately, the trial onboarding guides users through capabilities in a logical sequence:

**Days 1-3:** Core Operations
- Orders and tables
- Menu management
- Basic inventory
- Payment processing

**Days 4-7:** Growth Features
- Reservations
- Staff management
- Inventory alerts

**Days 8-11:** Analytics and Insights
- Payment analytics
- Menu performance
- Peak hours analysis

**Days 12-14:** Marketing and Engagement
- WhatsApp campaigns
- QR Builder
- Site Builder

**Objective:**  
Help customers build operational confidence progressively, not overwhelm them with 50+ features on Day One.

### 8.3 Trial Eligibility

**Who Receives Trial:**
- New signups (hospitality businesses only)
- One trial per email address
- One trial per phone number
- Low-risk businesses (auto-approved via risk assessment)

**Who Does NOT Receive Trial:**
- Supplier businesses (different business model)
- High-risk signups (pending manual approval)
- Existing customers (already had trial)
- Fraudulent attempts (blocked by anti-fraud system)

### 8.4 Trial Conversion Flow

**7 Days Before Expiry:**
- Email reminder: "Your trial ends in 7 days"
- In-app countdown in topbar: "7 days left in trial"
- Usage summary: Features you've used during trial
- Recommended plan based on actual usage

**3 Days Before Expiry:**
- Email reminder: "Your trial ends in 3 days"
- In-app banner: "Trial ending soon"
- Personalized recommendation: "Based on your usage, we recommend [Plan]"
- Pricing comparison showing recommended plan

**1 Day Before Expiry:**
- Email reminder: "Your trial ends tomorrow"
- Push notification (if enabled)
- Final recommendation with one-click subscribe

**On Expiry:**
- Email: "Your trial has ended"
- Usage-based recommendation: "Based on your trial, [Plan] is the best fit"
- Show pricing for recommended plan (not all plans)
- "Subscribe to [Recommended Plan]" primary CTA
- "View all plans" secondary option

### 8.5 Trial Expiry Behavior

**Access After Expiry:**
- Dashboard: Read-only access for 3 days (grace period)
- Data: Preserved for 30 days
- Reactivation: One-click reactivation with payment

**Data Retention:**
- 0-3 days: Full access (grace period)
- 4-30 days: Read-only access
- 31-90 days: Data archived (no access)
- 91+ days: Data deleted (with prior notice)

---

## SECTION 9 — UPGRADE & DOWNGRADE PHILOSOPHY

### 9.1 Lifecycle Philosophy

**Principle:**  
Subscription changes should be seamless, safe, and customer-friendly. Data should never be lost. Customers should always understand what's changing.

### 9.2 Upgrade Policy

**When:**  
Customer moves to a higher-tier plan (e.g., Starter → Professional)

**Timing:**  
Upgrade takes effect **immediately** after payment

**Proration:**  
Customer pays prorated amount for remaining days in current billing cycle:

```
Prorated Amount = (New Daily Rate - Current Daily Rate) × Days Remaining
```

**Example:**
- Current: Professional (35,000/month)
- New: Business (75,000/month)
- Days Remaining: 15 of 30
- Prorated Charge: (75,000/30 - 35,000/30) × 15 = 20,000 RWF

**Feature Access:**  
New features unlock immediately after payment

**Data Migration:**  
All existing data preserved. New limits apply immediately (e.g., QR codes: 20 → unlimited)

**Customer Communication:**
- Email confirmation of upgrade
- Receipt for prorated charge
- Welcome to new plan message
- Feature unlock celebration in dashboard

---

### 9.3 Downgrade Policy

**When:**  
Customer moves to a lower-tier plan (e.g., Business → Professional)

**Timing:**  
Downgrade takes effect **at next billing cycle** (not immediately)

**Rationale:**  
Customer paid for current cycle and should receive full value until cycle ends

**Refund Policy:**  
No refunds for downgrades (customer received service)

**Exception:**  
Refund allowed within 7 days of upgrade (buyer's remorse)

**Data Retention:**  
Customer must address data that exceeds new plan limits before downgrade:

**Example:**
- Current: Business (3 branches)
- New: Professional (1 branch)
- Action Required: Customer selects which branch to keep

**Data Retention Rules:**

| Resource | Behavior |
|----------|----------|
| Branches | User selects which to keep |
| QR Codes | User selects which to keep (if over limit) |
| AI Credits | Reset to new plan limit at next billing cycle |
| Storage | Keep all data, prevent new uploads if over limit |
| Staff | Keep all staff, prevent new additions if over limit |

**Customer Communication:**
- Email confirmation of scheduled downgrade
- In-app message: "Downgrade scheduled for [date]"
- Reminder 7 days before downgrade
- Confirmation email after downgrade takes effect
- Option to cancel scheduled downgrade

---

### 9.4 Cancellation Policy

**When:**  
Customer ends subscription (no renewal)

**Timing:**  
Cancellation takes effect **at end of current billing cycle**

**Rationale:**  
Customer paid for current cycle and should receive full value

**Access After Cancellation:**
- Current cycle: Full access until end date
- 0-3 days after: Full access (grace period)
- 4-30 days after: Read-only access
- 31-90 days after: Data archived (no access)
- 91+ days after: Data deleted (with prior notice)

**Retention Flow:**  
Before confirming cancellation, show:
1. "What can we do to keep you?" prompt
2. Offer discount (e.g., "Stay for 50% off next 3 months")
3. Offer downgrade instead of cancellation
4. Capture cancellation reason (dropdown + text)

**Customer Communication:**
- Email confirmation of cancellation
- Subscription active until [date]
- Data retention policy
- Reactivation link
- Feedback survey

---

### 9.5 Renewal Policy

**When:**  
Subscription approaches end date (auto-renewal)

**Timing:**  
Renewal charge 7 days before end date

**Reminder:**  
Email reminder 7 days before renewal:
- Amount to be charged
- Date of charge
- Payment method
- Option to update payment method or cancel

**Failed Renewal:**  
If payment fails:
1. Retry payment immediately
2. Retry after 3 days
3. Retry after 7 days
4. Email notification after each failure
5. Grace period (3 days) after final failure
6. Suspend subscription after grace period

**Customer Communication:**
- Email confirmation after successful renewal
- Receipt/invoice
- Next renewal date
- Thank you message

---

### 9.6 Reactivation Policy

**When:**  
Customer returns after cancellation or expiry

**Timing:**  
Reactivation takes effect immediately after payment

**Data Restoration:**  
If within 90 days, all data restored immediately

**Reactivation Flow:**
1. "Reactivate Subscription" button in dashboard (if expired)
2. Select plan
3. One-click reactivation (use saved payment method)
4. Immediate access after payment

**Reactivation Incentive (Optional):**
- "Welcome back! Get 25% off your first month"
- "Reactivate within 7 days and get 1 month free"

**Customer Communication:**
- Email confirmation of reactivation
- Welcome back message
- Data restoration confirmation

---

### 9.7 Grace Periods

**Standard Grace Period:** 3 days after subscription expiry

**Purpose:**  
Provide buffer for payment issues, customer decision-making, or administrative delays

**Access During Grace Period:**  
Full access to all features (same as active subscription)

**After Grace Period:**  
Subscription suspended, access restricted to read-only

---

## SECTION 10 — LOCALIZATION & COMMERCIAL EXPANSION

### 10.1 Global-by-Design Architecture

**Philosophy:**  
ImboniServe is architected to serve customers worldwide while maintaining a single, consistent commercial model.

**Principle:**  
Localization affects **presentation** (currency, language, payment methods). Localization does not redefine **commercial architecture** (plans, features, entitlements).

### 10.2 What Localization Affects

**Currency:**  
Display pricing in local currency (see Section 4)

**Taxation:**  
Apply local tax rates (VAT, GST, sales tax) as required by law

**Fiscal Compliance:**  
Generate invoices, receipts, and reports per local regulations

**Payment Providers:**  
Integrate local payment methods (mobile money, local cards, bank transfers)

**Language:**  
Translate UI, documentation, and support materials

**Regional Regulations:**  
Comply with data residency, privacy laws, and industry regulations

### 10.3 What Localization Does NOT Affect

**Commercial Plans:**  
The 5-tier plan structure (Starter → Professional → Business → Premium → Enterprise) remains globally consistent

**Feature Distribution:**  
Features included in each plan remain consistent worldwide

**Entitlement Logic:**  
Subscription enforcement remains consistent across all markets

**Business Maturity Philosophy:**  
Feature placement based on business maturity applies universally

### 10.4 Adding New Countries

**Process:**
1. **Market Research:** Assess demand, competition, pricing sensitivity
2. **Currency Mapping:** Determine display pricing in local currency
3. **Payment Integration:** Integrate local payment providers
4. **Regulatory Compliance:** Ensure legal compliance (taxation, data residency, etc.)
5. **Localization:** Translate UI and documentation
6. **Founder Approval:** Approve market entry and pricing
7. **Launch:** Enable country in platform

**Important:**  
Adding a new country does NOT change the commercial model. It only adds a new market for the existing model.

### 10.5 Pricing Adjustments for Markets

**Principle:**  
Canonical pricing (RWF) serves as the reference. Display pricing in other currencies is calculated via exchange rates.

**Market-Specific Pricing (Exception):**  
In rare cases, Founder may approve market-specific pricing adjustments to account for:
- Purchasing power parity
- Competitive landscape
- Market entry strategy

**Example:**
- Rwanda: Starter = 15,000 RWF (~$12 USD)
- India: Starter = ₹800 (~$10 USD, 20% discount for market entry)

**Governance:**  
Market-specific pricing requires:
1. Founder approval
2. Constitutional amendment
3. Documentation of rationale
4. Clear end date or review date

---

## SECTION 11 — FUTURE GOVERNANCE

### 11.1 Constitutional Authority

This document is the **authoritative commercial reference** for ImboniServe. All commercial decisions must derive from this constitution.

### 11.2 Amendment Process

**Any change to:**
- Pricing
- Plans
- Feature distribution
- Subscription policies
- Trial policies
- Upgrade/downgrade rules
- Localization strategy

**Must follow this process:**

1. **Propose Amendment**  
   Document proposed change with rationale

2. **Founder Review**  
   Founder reviews and approves/rejects

3. **Update Constitution**  
   Amend this document with approved change

4. **Implement Change**  
   Engineering implements change per constitutional update

5. **Verify Compliance**  
   Audit implementation to ensure it matches constitution

**Important:**  
Implementation follows policy. Policy does not follow implementation.

### 11.3 Emergency Changes

**In rare cases**, emergency changes may be required (e.g., security issue, legal compliance, critical bug).

**Emergency Process:**
1. Implement emergency fix
2. Document change immediately
3. Update constitution within 7 days
4. Founder retroactive approval within 14 days

**Emergency changes must be:**
- Documented in detail
- Justified with clear rationale
- Reviewed by Founder
- Incorporated into constitution

### 11.4 Grandfather Clauses

**When pricing or policies change**, existing customers may be **grandfathered** at their original terms.

**Grandfather Policy:**
- Existing customers retain original pricing for 12 months
- After 12 months, customers transition to new pricing with 60 days notice
- Customers may opt-in to new pricing earlier if beneficial

**Example:**
- Original: Starter = 15,000 RWF/month
- New: Starter = 18,000 RWF/month
- Existing Starter customers: Pay 15,000 for 12 months, then 18,000

### 11.5 Promotional Pricing

**Temporary promotions** (e.g., "50% off for 3 months") are allowed but must:
- Be time-limited (clear end date)
- Be documented in constitution
- Not contradict core commercial principles
- Be approved by Founder

**Promotional Guidelines:**
- Maximum discount: 50%
- Maximum duration: 6 months
- Clear terms and conditions
- Automatic transition to standard pricing after promotion ends

### 11.6 A/B Testing

**Commercial A/B testing** (e.g., testing different pricing) is allowed for:
- New markets
- New customer segments
- Optimization experiments

**A/B Testing Rules:**
- Must be documented
- Must have clear success criteria
- Must have end date (maximum 90 days)
- Must not violate Commercial Truth (customers get what they're promised)
- Results must be reviewed by Founder

### 11.7 Annual Review

**This constitution must be reviewed annually:**
- Review date: July 1st each year
- Founder reviews commercial performance
- Assess if pricing, plans, or policies need adjustment
- Update constitution as needed
- Communicate changes to customers

---

## SECTION 12 — IMPLEMENTATION AUTHORITY

### 12.1 Technical Implementation

**File:** `src/config/pricing.ts`  
**Authority:** Implements canonical pricing from Section 3

**File:** `src/lib/plan-entitlements.ts`  
**Authority:** Implements feature-to-plan mapping from Section 6

**File:** `src/lib/payments/subscription.engine.ts`  
**Authority:** Implements subscription lifecycle from Section 9

**File:** `src/pages/pricing.tsx`  
**Authority:** Displays pricing per Section 3 and Section 4

### 12.2 Conflict Resolution

**If implementation contradicts this constitution:**
- Constitution is authoritative
- Implementation must be corrected
- File bug report
- Update implementation to match constitution

**If constitution is unclear:**
- Request Founder clarification
- Document clarification
- Update constitution
- Implement per clarified policy

### 12.3 Compliance Verification

**Quarterly Audit:**  
Engineering must audit implementation quarterly to ensure compliance with this constitution.

**Audit Checklist:**
- ✅ Pricing matches Section 3
- ✅ Plans match Section 2
- ✅ Features match Section 6
- ✅ Dashboard visibility matches Section 7
- ✅ Trial policy matches Section 8
- ✅ Lifecycle behavior matches Section 9

**Audit Report:**  
Submit audit report to Founder with:
- Compliance status
- Any discrepancies found
- Corrective actions taken
- Recommendations for constitutional updates

---

## APPENDIX A — GLOSSARY

**Canonical Pricing:** Internal commercial reference pricing in RWF  
**Display Pricing:** Customer-facing pricing in local currency  
**Commercial Truth:** Principle that promises match reality  
**Entitlement:** Feature or capability included in a subscription  
**Grace Period:** Buffer time after subscription expiry (3 days)  
**Grandfather Clause:** Policy allowing existing customers to retain original terms  
**Proration:** Proportional charge for partial billing period  
**Business Maturity:** Stage of business growth (starting → growing → scaling → optimizing → enterprise)

---

## APPENDIX B — CHANGE LOG

| Date | Version | Change | Approved By |
|------|---------|--------|-------------|
| 2026-07-02 | 1.0 | Initial constitution (RC1) | Pending Founder Approval |
| 2026-07-03 | 1.1 | Founder amendments incorporated | Founder Approved |

**Version 1.1 Amendments:**
1. Added Section 1.5: Product Demonstration Principle
2. Updated Principle 2: "Only Sell What Exists" philosophy
3. Updated Principle 5: Customer growth philosophy
4. Updated Section 3.3: Transparent Annual Savings presentation
5. Updated Section 3.4: Enterprise Strategic Partnership Model
6. Updated Section 4: Three-layer Global Commercial Model
7. Updated Section 6.7: Production-ready feature requirements
8. Replaced Section 7: Progressive Commercial Discovery (was Dashboard Visibility Philosophy)
9. Updated Section 8: Guided Professional Trial (was Trial Policy)
10. Updated Anti-Patterns: Added "Roadmap as Pricing" and "Restrictive UX"

See `COMMERCIAL_CONSTITUTION_CHANGELOG.md` for detailed amendment documentation.

---

## APPENDIX C — FOUNDER DECISIONS

See `COMMERCIAL_DECISIONS_APPROVED.md` for complete record of Founder decisions.

---

## SIGNATURE

**Prepared By:** Chief Product Architect / Commercial Systems Architect  
**Initial Draft:** 2026-07-02  
**Amended:** 2026-07-03  
**Status:** ✅ Founder Approved (Version 1.1)

**Founder Approval:**

- [x] APPROVED — This constitution is the authoritative commercial reference for ImboniServe
- [x] AMENDMENTS INCORPORATED — Six strategic decisions integrated into constitution
- [ ] ~~DO NOT APPROVE~~

**Founder Approval Date:** 2026-07-03  
**Approved Version:** 1.1 (with Founder amendments)

---

**END OF COMMERCIAL CONSTITUTION**

**Version:** 1.1  
**Status:** ✅ Approved and Authoritative  
**Next Review:** 2027-07-01 (Annual Review)
