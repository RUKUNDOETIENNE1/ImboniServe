# COMMERCIAL_FEATURE_MATRIX

**Date:** 2026-07-02  
**Scope:** Complete feature-to-plan mapping for ImboniServe RC1  
**Purpose:** Establish commercial source of truth for all platform capabilities

---

## APPROVED COMMERCIAL MODEL (Reference)

| Plan | Monthly Price | Annual Price (monthly) | Target Customer |
|------|--------------|----------------------|-----------------|
| **Starter** | 15,000 RWF | 12,000 RWF | Small cafés, food stalls starting out |
| **Professional** | 35,000 RWF | 28,000 RWF | Established restaurants and cafés |
| **Business** | 75,000 RWF | 60,000 RWF | Hotels, chains, high-volume operations |
| **Premium** | 200,000 RWF | 160,000 RWF | Complete solution, all features |
| **Enterprise** | Custom | Custom | Large organizations, custom needs |

**Annual Billing:** 25% savings = 3 free months

---

## BUSINESS MATURITY FRAMEWORK

Features should align to business growth stages:

1. **Starting** (Starter) — Essential operations to open and run
2. **Growing** (Professional) — Tools to scale operations and improve efficiency
3. **Scaling** (Business) — Multi-location, advanced operations, team coordination
4. **Optimizing** (Premium) — AI-driven insights, automation, revenue intelligence
5. **Enterprise** (Enterprise) — Custom infrastructure, integrations, governance

---

## FEATURE MATRIX

### CORE OPERATIONS

| Feature | Current Impl | Recommended Plan | Business Justification | Backend Enforcement | Dashboard Visibility |
|---------|-------------|------------------|----------------------|-------------------|---------------------|
| **Dashboard** | All plans | Starter+ | Essential for any business | ❌ None | ✅ All users |
| **Orders Management** | All plans | Starter+ | Core revenue-generating capability | ❌ None | ✅ All users |
| **Tables Management** | All plans | Starter+ | Essential for dine-in operations | ❌ None | ✅ All users |
| **Kitchen Tickets** | Essentials+ | Starter+ | Basic kitchen communication | ✅ Entitlement check | ✅ All users |
| **Kitchen Display System (KDS)** | Business+ | Business+ | Real-time kitchen coordination for high volume | ✅ Entitlement check (`hasKDS`) | ✅ All users (should be gated) |
| **KDS Advanced** | Premium+ | Premium+ | Course firing, expo mode for fine dining | ✅ Entitlement check (`hasKDSAdvanced`) | ✅ All users (should be gated) |
| **Reservations** | Professional+ | Professional+ | Customer experience enhancement for growing businesses | ✅ Entitlement check | ✅ All users (should be gated) |
| **Multi-Branch** | Business+ (15 clients) | Business+ | Scaling to multiple locations | ⚠️ Feature flag + client count | ✅ All users (should be gated) |
| **Outlets** | Professional+ | Professional+ | Multiple service points within location | ✅ Entitlement check (`maxOutlets`) | ✅ All users |
| **Hotel/Room Management** | Business+ | Business+ | Hospitality-specific operations | ⚠️ Feature flag only | ✅ All users (should be gated) |

---

### MENU & INVENTORY

| Feature | Current Impl | Recommended Plan | Business Justification | Backend Enforcement | Dashboard Visibility |
|---------|-------------|------------------|----------------------|-------------------|---------------------|
| **Menu Management** | All plans | Starter+ | Essential capability | ❌ None | ✅ All users |
| **Basic Inventory** | Essentials+ | Starter+ | Track stock for cost control | ✅ Entitlement check | ✅ All users |
| **Inventory Alerts** | Professional+ | Professional+ | Proactive stock management for growing operations | ✅ Entitlement check | ✅ All users (should be gated) |
| **Inventory Auto-Reorder** | Premium+ | Premium+ | AI-driven inventory optimization | ✅ Entitlement check | ✅ All users (mock/placeholder) |
| **Recipe Management** | Premium+ | Premium+ | Cost control and margin optimization | ✅ Entitlement check | ✅ All users (mock/placeholder) |
| **Prep Plans & Forecasting** | Premium+ | Premium+ | Advanced kitchen planning | ✅ Entitlement check | ✅ All users (mock/placeholder) |
| **AI Menu Builder** | Professional+ (20 clients) | Professional+ | AI-powered menu creation for efficiency | ⚠️ Feature flag + client count | ✅ All users (should be gated) |
| **OCR Documents (DIE)** | All plans | Starter+ | Document digitization for all | ❌ None (internal tool) | ✅ All users |

---

### PROCUREMENT & SUPPLIERS

| Feature | Current Impl | Recommended Plan | Business Justification | Backend Enforcement | Dashboard Visibility |
|---------|-------------|------------------|----------------------|-------------------|---------------------|
| **Basic Supplier Orders** | Essentials+ | Starter+ | Essential purchasing capability | ✅ Entitlement check | ✅ All users |
| **Procurement Workflow** | Professional+ | Professional+ | Structured purchasing for growing operations | ✅ Entitlement check | ✅ All users (should be gated) |
| **Supplier Portal** | Business+ | Business+ | Supplier collaboration for scale | ✅ Entitlement check | ✅ All users (mock/placeholder) |
| **Delivery Confirmation** | Business+ | Business+ | Goods received tracking for multi-location | ✅ Entitlement check | ✅ All users (should be gated) |

---

### PAYMENTS & FINANCIAL

| Feature | Current Impl | Recommended Plan | Business Justification | Backend Enforcement | Dashboard Visibility |
|---------|-------------|------------------|----------------------|-------------------|---------------------|
| **Payment Processing** | All plans | Starter+ | Core revenue capability | ❌ None | ✅ All users |
| **Payment Settings** | All plans | Starter+ | Essential configuration | ❌ None | ✅ All users |
| **Transactions** | All plans | Starter+ | Basic financial tracking | ❌ None | ✅ All users |
| **Payment Monitor** | Professional+ | Professional+ | Real-time payment tracking for growing businesses | ✅ Entitlement check | ⚠️ Admin only (should be plan-gated) |
| **Payment Analytics** | Professional+ | Professional+ | Payment method insights | ✅ Entitlement check | ✅ All users (should be gated) |
| **Payment Analytics Pro** | Business+ | Business+ | Advanced payment intelligence | ✅ Entitlement check | ✅ All users (should be gated) |
| **Payout Summary** | All plans | Starter+ | Basic payout tracking | ❌ None | ✅ All users |
| **Revenue Intelligence** | Premium+ | Premium+ | AI-driven financial insights | ✅ Entitlement check | ✅ All users (should be gated) |

---

### REPORTS & ANALYTICS

| Feature | Current Impl | Recommended Plan | Business Justification | Backend Enforcement | Dashboard Visibility |
|---------|-------------|------------------|----------------------|-------------------|---------------------|
| **Basic Reports** | Essentials+ | Starter+ | Daily/weekly/monthly summaries | ✅ Entitlement check | ✅ All users |
| **Menu Performance** | Professional+ | Professional+ | Item-level insights for optimization | ✅ Entitlement check | ✅ All users (should be gated) |
| **Menu Performance by Branch** | Business+ | Business+ | Multi-location performance comparison | ✅ Entitlement check | ✅ All users (should be gated) |
| **Peak Hours Analytics** | Professional+ | Professional+ | Staffing and inventory optimization | ❌ None | ✅ All users (should be gated) |
| **Advanced Analytics** | Business+ (10 clients) | Business+ | Deep business intelligence | ⚠️ Feature flag + client count | ✅ All users (should be gated) |
| **Advanced Reports** | Premium+ | Premium+ | Custom report templates | ✅ Entitlement check | ✅ All users (mock/placeholder) |
| **BI Connectors** | Premium+ | Premium+ | Data warehouse integration | ✅ Entitlement check | ✅ All users (should be gated) |
| **Staff Performance** | Professional+ | Professional+ | Team productivity tracking | ❌ None | ✅ All users (should be gated) |

---

### MARKETING & GROWTH

| Feature | Current Impl | Recommended Plan | Business Justification | Backend Enforcement | Dashboard Visibility |
|---------|-------------|------------------|----------------------|-------------------|---------------------|
| **Basic CRM** | Essentials+ | Starter+ | Customer contact management | ✅ Entitlement check | ✅ All users |
| **Contact Management** | All plans | Starter+ | Unified contact database | ❌ None | ✅ All users |
| **WhatsApp Campaigns (Basic)** | Professional+ | Professional+ | Customer engagement for growth | ✅ Entitlement check | ✅ All users (should be gated) |
| **WhatsApp Campaigns (Segments)** | Business+ | Business+ | Targeted marketing for scale | ✅ Entitlement check | ✅ All users (should be gated) |
| **WhatsApp Campaigns (Automation)** | Premium+ | Premium+ | Marketing automation | ✅ Entitlement check | ✅ All users (should be gated) |
| **Promotions Engine** | Professional+ (25 clients) | Professional+ | Discount and promotion management | ⚠️ Feature flag + client count | ✅ All users (should be gated) |
| **Loyalty Program** | Business+ | Business+ | Customer retention for established businesses | ⚠️ Feature flag only | ✅ All users (should be gated) |
| **Customer Feedback** | Premium+ | Premium+ | Sentiment analysis and surveys | ✅ Entitlement check | ✅ All users (mock/placeholder) |
| **Referrals** | All plans | Starter+ | Word-of-mouth growth | ❌ None | ✅ All users |

---

### QR & DIGITAL PRESENCE

| Feature | Current Impl | Recommended Plan | Business Justification | Backend Enforcement | Dashboard Visibility |
|---------|-------------|------------------|----------------------|-------------------|---------------------|
| **QR Builder** | All plans | Starter+ | Essential for contactless ordering | ✅ Entitlement check (`maxQRCodes: 5`) | ✅ All users |
| **QR Analytics** | Business+ | Business+ | QR performance tracking | ✅ Entitlement check | ✅ All users (should be gated) |
| **QR Analytics Deep-Dive** | Business+ | Business+ | Advanced QR intelligence | ✅ Entitlement check | ✅ All users (should be gated) |
| **Site Builder Preview** | Essentials+ | Starter+ | Basic web presence | ✅ Entitlement check | ✅ All users |
| **Site Builder Basic** | Professional+ | Professional+ | Professional website | ✅ Entitlement check | ✅ All users (should be gated) |
| **Site Builder Pro** | Business+ | Business+ | Advanced website features | ✅ Entitlement check | ✅ All users (should be gated) |
| **Discovery Listing** | Essentials+ | Starter+ | Basic marketplace presence | ✅ Entitlement check | ✅ All users |
| **Discovery Featured** | Business+ | Business+ | Premium marketplace placement | ✅ Entitlement check | ✅ All users (should be gated) |
| **White Label** | Premium+ | Premium+ | Brand customization | ✅ Entitlement check | ✅ All users (should be gated) |
| **CMS/Content** | All plans | Professional+ | Content marketing capability | ❌ None | ✅ All users (should be gated) |
| **Video Analytics** | Professional+ | Professional+ | Content performance tracking | ❌ None | ✅ All users (should be gated) |

---

### AI & OPTIMIZATION

| Feature | Current Impl | Recommended Plan | Business Justification | Backend Enforcement | Dashboard Visibility |
|---------|-------------|------------------|----------------------|-------------------|---------------------|
| **AI Credits** | All plans (tiered) | Starter+ (20), Pro (50), Business (200), Premium (unlimited) | AI-powered features consumption | ✅ Entitlement check | N/A (usage-based) |
| **AI Business Insights** | Premium+ | Premium+ | AI-generated business intelligence | ❌ None | ✅ All users (should be gated) |
| **A/B Testing (Lite)** | Business+ | Business+ | Menu optimization (1 concurrent test) | ✅ Entitlement check (`maxConcurrentABTests: 1`) | ✅ All users (should be gated) |
| **A/B Testing (Unlimited)** | Premium+ | Premium+ | Unlimited concurrent tests | ✅ Entitlement check | ✅ All users (should be gated) |
| **Optimization Hub** | Premium+ | Premium+ | Centralized optimization recommendations | ✅ Entitlement check | ✅ All users (should be gated) |
| **Optimization Insights** | Premium+ | Premium+ | AI-driven business optimization | ✅ Entitlement check | ✅ All users (should be gated) |
| **Forecasting** | Premium+ | Premium+ | Demand and inventory forecasting | ✅ Entitlement check | ✅ All users (should be gated) |

---

### STAFF & TEAM

| Feature | Current Impl | Recommended Plan | Business Justification | Backend Enforcement | Dashboard Visibility |
|---------|-------------|------------------|----------------------|-------------------|---------------------|
| **Staff Management** | Professional+ | Professional+ | Team coordination for growing businesses | ✅ Entitlement check | ✅ All users (should be gated) |
| **Role-Based Access** | Professional+ | Professional+ | Security and delegation | ✅ Entitlement check | ✅ All users (should be gated) |
| **Staff Performance** | Professional+ | Professional+ | Team productivity insights | ❌ None | ✅ All users (should be gated) |

---

### ENTERPRISE FEATURES

| Feature | Current Impl | Recommended Plan | Business Justification | Backend Enforcement | Dashboard Visibility |
|---------|-------------|------------------|----------------------|-------------------|---------------------|
| **API Access** | Premium+ | Premium+ | Custom integrations | ✅ Entitlement check | ✅ All users (should be gated) |
| **Custom Integrations** | Enterprise | Enterprise | Bespoke system connections | ✅ Entitlement check | ✅ All users (should be gated) |
| **SSO** | Enterprise | Enterprise | Enterprise authentication | ✅ Entitlement check | ✅ All users (should be gated) |
| **Custom Workflows** | Enterprise | Enterprise | Business-specific processes | ✅ Entitlement check | ✅ All users (should be gated) |
| **Audit Exports** | Enterprise | Enterprise | Compliance and governance | ✅ Entitlement check | ✅ All users (should be gated) |
| **On-Premise Deployment** | Enterprise | Enterprise | Data residency requirements | ✅ Entitlement check | ✅ All users (should be gated) |
| **Dedicated Manager** | Enterprise | Enterprise | White-glove support | ✅ Entitlement check | N/A (service-level) |
| **Enterprise SLA** | Enterprise | Enterprise | Guaranteed uptime | ✅ Entitlement check | N/A (service-level) |

---

### SUPPORT & INFRASTRUCTURE

| Feature | Current Impl | Recommended Plan | Business Justification | Backend Enforcement | Dashboard Visibility |
|---------|-------------|------------------|----------------------|-------------------|---------------------|
| **Standard Support** | Essentials+ | Starter+ | Email/chat support | ✅ Entitlement check | N/A (service-level) |
| **Priority Support** | Professional+ | Professional+ | Faster response times | ✅ Entitlement check | N/A (service-level) |
| **Premium Support** | Premium+ | Premium+ | Dedicated support channel | ✅ Entitlement check | N/A (service-level) |
| **Storage (2GB)** | Essentials+ | Starter+ | Basic storage | ✅ Entitlement check | N/A (infrastructure) |
| **Storage (5GB)** | Professional+ | Professional+ | Increased storage | ✅ Entitlement check | N/A (infrastructure) |
| **Storage (20GB)** | Business+ | Business+ | High-volume storage | ✅ Entitlement check | N/A (infrastructure) |
| **Storage (100GB)** | Premium+ | Premium+ | Enterprise-grade storage | ✅ Entitlement check | N/A (infrastructure) |

---

## CRITICAL FINDINGS

### ❌ P0 Issues (Must Fix)

1. **Plan Naming Mismatch**
   - **Issue:** Pricing config uses `ESSENTIALS` (12,500/month) but approved model specifies `STARTER` (15,000/month)
   - **Impact:** Commercial model inconsistency, pricing confusion, trial defaults to wrong plan
   - **Files:** `src/config/pricing.ts`, `src/lib/plan-entitlements.ts`, `src/pages/api/auth/signup.ts`

2. **Dashboard Visibility Not Subscription-Aware**
   - **Issue:** All features visible in navigation regardless of subscription tier
   - **Impact:** Starter users see Premium features, creating confusion and support burden
   - **Files:** `src/components/DashboardLayout.tsx` (navigation has no plan checks)

3. **Feature Gating Uses Client Count Instead of Subscription Tier**
   - **Issue:** Advanced features gate on "active clients" not subscription plan
   - **Impact:** Starter customers can access Premium features if they have enough clients
   - **Examples:** `advanced_analytics` (10 clients), `multi_branch` (15 clients), `ai_menu_builder` (20 clients), `promotions_engine` (25 clients)
   - **Files:** Feature flag system

4. **Many Advanced Features Have No Backend Enforcement**
   - **Issue:** Features visible and accessible without entitlement checks
   - **Impact:** Customers receive features they didn't pay for
   - **Examples:** AI insights, staff performance, peak hours analytics, CMS, video analytics

### ⚠️ P1 Issues (Should Fix)

1. **Trial Experience Undefined**
   - **Issue:** Trial defaults to ESSENTIALS plan, but what features should trial receive?
   - **Impact:** Conversion strategy unclear, trial may over-promise or under-deliver

2. **Mock/Placeholder Features in Production**
   - **Issue:** Several "advanced" features use mock data (recipe management, auto-reorder, supplier portal, customer feedback, advanced reporting)
   - **Impact:** Pricing page promises features that don't fully exist

3. **Upgrade/Downgrade Behavior Undefined**
   - **Issue:** No clear rules for what happens to data when changing plans
   - **Impact:** Customer confusion, potential data loss, support burden

4. **Feature Flag System Bypasses Subscription Model**
   - **Issue:** Feature flags can override subscription entitlements
   - **Impact:** Commercial model can be circumvented

### 💡 P2 Issues (Nice to Improve)

1. **No Clear "Why Upgrade" Messaging in Dashboard**
   - **Issue:** Locked features show generic upgrade prompts
   - **Impact:** Missed upsell opportunities

2. **Executive Dashboards (CEO/CFO/Marketer) Have No Gating**
   - **Issue:** All users can access executive views
   - **Impact:** Feature dilution, unclear value proposition

3. **DIE Suite Exposed to All Users**
   - **Issue:** Internal admin tool visible in dashboard
   - **Impact:** Cognitive overload, unclear product scope

---

## RECOMMENDATIONS

### Immediate Actions (P0)

1. **Unify Plan Naming**
   - Rename `ESSENTIALS` → `STARTER` in pricing config
   - Update pricing to 15,000/month (monthly) and 12,000/month (annual)
   - Update all references in codebase

2. **Implement Dashboard Visibility Control**
   - Add subscription-aware navigation filtering in `DashboardLayout.tsx`
   - Hide features user doesn't have access to
   - Show upgrade prompts for locked sections

3. **Replace Client-Count Gating with Subscription-Tier Gating**
   - Remove client-count thresholds from feature flags
   - Enforce features based on subscription plan only
   - Maintain feature flags for gradual rollout, not commercial gating

4. **Add Backend Enforcement for All Commercial Features**
   - Wrap API endpoints with subscription checks
   - Return 402 Payment Required for locked features
   - Provide clear upgrade paths in error responses

### Strategic Recommendations (P1)

1. **Define Trial Strategy**
   - Recommend: Trial receives **Professional** plan features for 14 days
   - Rationale: Showcase value, drive conversions to paid Professional or higher
   - Implementation: Update signup flow to set trial entitlements

2. **Complete or Remove Mock Features**
   - Audit: Recipe management, auto-reorder, supplier portal, customer feedback, advanced reporting
   - Decision: Either complete implementation or remove from pricing page
   - Timeline: Before RC1 public launch

3. **Document Upgrade/Downgrade Rules**
   - Define data retention policies
   - Define feature access changes
   - Define grace periods
   - Implement in subscription engine

4. **Separate Feature Flags from Commercial Gating**
   - Feature flags = gradual rollout, A/B testing, kill switches
   - Subscription entitlements = commercial access control
   - Never mix the two

---

## BUSINESS MATURITY ALIGNMENT ASSESSMENT

### ✅ Well-Aligned Features

- **Starter:** Orders, tables, kitchen tickets, basic inventory, basic reports, QR builder (5 codes)
- **Professional:** Reservations, procurement workflow, staff management, payment analytics, menu performance
- **Business:** Multi-branch, KDS, supplier portal, WhatsApp segments, QR analytics
- **Premium:** KDS advanced, recipe management, automation, optimization hub, revenue intelligence
- **Enterprise:** SSO, custom integrations, on-premise, audit exports

### ⚠️ Misaligned Features

- **CMS/Content:** Currently all plans, should be Professional+ (content marketing is growth-stage activity)
- **AI Insights:** Currently ungated, should be Premium+ (AI intelligence is optimization-stage)
- **Executive Dashboards:** Currently all plans, should be Business+ (multi-stakeholder reporting is scale-stage)
- **Staff Performance:** Currently ungated, should be Professional+ (team optimization is growth-stage)

---

## CONCLUSION

The platform has **strong entitlement infrastructure** (`plan-entitlements.ts`) but **weak enforcement** in practice.

**Key Gap:** Entitlements are defined but not consistently checked at:
- Dashboard navigation level
- API endpoint level
- Feature flag level

**Result:** Commercial promises (pricing page) do not match actual access control (dashboard experience).

**Path to Commercial Truth:**
1. Fix plan naming and pricing discrepancies (P0)
2. Implement dashboard visibility control (P0)
3. Add API-level enforcement for all commercial features (P0)
4. Remove client-count gating in favor of subscription-tier gating (P0)
5. Define and implement trial strategy (P1)
6. Complete or remove mock features (P1)
7. Document and implement upgrade/downgrade rules (P1)

---

**Next Steps:** Review `COMMERCIAL_ENTITLEMENT_AUDIT.md` for detailed backend enforcement findings.
