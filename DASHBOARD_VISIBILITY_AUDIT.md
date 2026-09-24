# DASHBOARD_VISIBILITY_AUDIT

**Date:** 2026-07-02  
**Scope:** Dashboard experience by subscription tier  
**Purpose:** Verify that each customer sees an experience appropriate for their subscription

---

## AUDIT METHODOLOGY

Simulated login experience for each subscription tier:
- **Starter** (15,000/month)
- **Professional** (35,000/month)
- **Business** (75,000/month)
- **Premium** (200,000/month)
- **Enterprise** (Custom)

For each tier, evaluated:
1. Navigation visibility
2. Feature accessibility
3. Upgrade prompts
4. Hidden functionality
5. User experience quality

---

## STARTER PLAN EXPERIENCE (15,000/month)

### Expected Experience
**Target Customer:** Small café or food stall starting out

**Should See:**
- Dashboard (overview)
- Orders & Tables
- Basic Kitchen Tickets
- Menu Management
- Basic Inventory
- Basic Reports
- QR Builder (5 codes max)
- Basic CRM
- Discovery Listing
- Payment Processing
- Transactions

**Should NOT See:**
- Reservations (Professional+)
- KDS (Business+)
- Inventory Alerts (Professional+)
- Procurement Workflow (Professional+)
- WhatsApp Campaigns (Professional+)
- Payment Analytics (Professional+)
- Menu Performance (Professional+)
- Staff Management (Professional+)
- Multi-Branch (Business+)
- Advanced Analytics (Business+)
- AI Features (Premium+)

### Actual Experience

**Navigation Visible:** ✅ 22 items (ALL V1 navigation items)

**Issues:**
- ❌ **P0:** Sees "Reservations" (Professional feature)
- ❌ **P0:** Sees "Inventory Alerts" (Professional feature)
- ❌ **P0:** Sees "QR Analytics" (Business feature)
- ❌ **P0:** Sees "Menu Performance" (Professional feature)
- ❌ **P0:** Sees "Peak Hours" (Professional feature)
- ❌ **P0:** Sees "Payment Analytics" (Professional feature)
- ❌ **P0:** Sees "Staff" (Professional feature)

**Upgrade Prompts:** ❌ None visible in navigation

**Hidden Functionality:** ❌ Nothing hidden (all features accessible)

**User Experience Quality:** ⚠️ **CONFUSING**
- User clicks on features they don't have
- No clear indication of what's included vs locked
- Support burden: "Why can't I use this feature I see?"

---

## PROFESSIONAL PLAN EXPERIENCE (35,000/month)

### Expected Experience
**Target Customer:** Established restaurant or café

**Should See:**
- Everything in Starter
- Reservations
- Inventory Alerts
- Procurement Workflow
- WhatsApp Campaigns (Basic)
- Payment Monitor & Analytics
- Menu Performance
- Staff Management
- Role-Based Access
- Site Builder Basic
- 50 AI credits/month
- 20 QR codes

**Should NOT See:**
- KDS (Business+)
- Multi-Branch (Business+)
- Supplier Portal (Business+)
- WhatsApp Segments (Business+)
- QR Analytics Deep-Dive (Business+)
- Payment Analytics Pro (Business+)
- A/B Testing (Business+)
- AI Insights (Premium+)
- Optimization Hub (Premium+)
- Revenue Intelligence (Premium+)

### Actual Experience

**Navigation Visible:** ✅ 22 items (ALL V1 navigation items)

**Issues:**
- ❌ **P0:** Sees "QR Analytics" (Business feature)
- ❌ **P0:** No distinction between features they have vs don't have
- ❌ **P0:** Can access Business/Premium features if no backend enforcement

**Upgrade Prompts:** ❌ None visible

**User Experience Quality:** ⚠️ **UNCLEAR VALUE**
- Unclear what Professional adds over Starter
- No visual differentiation of unlocked features
- Missed upsell opportunity to Business

---

## BUSINESS PLAN EXPERIENCE (75,000/month)

### Expected Experience
**Target Customer:** Hotel, chain, or high-volume restaurant

**Should See:**
- Everything in Professional
- Multi-Branch (up to 3)
- Kitchen Display System
- Supplier Portal
- WhatsApp Campaigns Pro (segments)
- A/B Testing Lite (1 concurrent)
- QR Analytics Deep-Dive
- Menu Performance by Branch
- Payment Analytics Pro
- Payout & Reconciliation
- Site Builder Pro
- Discovery Featured
- 200 AI credits/month
- Unlimited QR codes

**Should NOT See:**
- KDS Advanced (Premium+)
- Recipe Management (Premium+)
- Inventory Auto-Reorder (Premium+)
- WhatsApp Automation (Premium+)
- A/B Testing Unlimited (Premium+)
- Optimization Hub (Premium+)
- Revenue Intelligence (Premium+)
- API Access (Premium+)
- White Label (Premium+)

### Actual Experience

**Navigation Visible:** ✅ 22 items (ALL V1 navigation items)

**Issues:**
- ❌ **P0:** No visual indication of Business-tier features
- ❌ **P0:** Can access Premium features if no backend enforcement
- ❌ **P0:** Multi-Branch may be hidden behind feature flag + client count

**Upgrade Prompts:** ❌ None visible

**User Experience Quality:** ⚠️ **UNCLEAR DIFFERENTIATION**
- Unclear what Business adds over Professional
- No celebration of unlocked features
- Missed upsell opportunity to Premium

---

## PREMIUM PLAN EXPERIENCE (200,000/month)

### Expected Experience
**Target Customer:** Complete solution, all features

**Should See:**
- Everything in Business
- Unlimited Branches & Outlets
- KDS Advanced
- Recipe Management with Costing
- Inventory Auto-Reorder
- Prep Plans & Forecasting
- WhatsApp Campaign Automation
- A/B Testing Unlimited
- Optimization Hub
- Customer Feedback System
- Advanced Reports & BI Connectors
- Revenue Intelligence
- White-Label Options
- API Access
- Priority Support
- Unlimited AI credits
- 100 GB storage

**Should NOT See:**
- Enterprise-only features (SSO, on-premise, custom integrations)

### Actual Experience

**Navigation Visible:** ✅ 22 items (ALL V1 navigation items)

**Issues:**
- ❌ **P0:** Same navigation as Starter user
- ❌ **P0:** No visual celebration of Premium status
- ❌ **P0:** No clear indication of "all features unlocked"

**Upgrade Prompts:** ❌ None (correct, but no Premium badge either)

**User Experience Quality:** ⚠️ **UNDERWHELMING**
- Premium customer sees same interface as Starter
- No premium branding or status indicators
- No sense of "I'm getting the best experience"

---

## ENTERPRISE PLAN EXPERIENCE (Custom)

### Expected Experience
**Target Customer:** Large organization with custom needs

**Should See:**
- Everything in Premium
- Dedicated Infrastructure
- Custom Integrations
- Training & Onboarding
- Enterprise SLA
- Custom Development
- Dedicated Account Manager
- On-Premise Deployment
- SSO & Custom Roles
- Regional Data Residency
- Custom Workflows
- Audit Exports

**Should NOT See:**
- Standard support options (should have dedicated manager)

### Actual Experience

**Navigation Visible:** ✅ 22 items (ALL V1 navigation items)

**Issues:**
- ❌ **P0:** Same navigation as all other tiers
- ❌ **P0:** No enterprise branding
- ❌ **P0:** No dedicated manager contact visible
- ❌ **P0:** No custom features visible (SSO, audit exports, etc.)

**User Experience Quality:** ❌ **INADEQUATE**
- Enterprise customer sees same interface as Starter
- No white-glove experience
- No custom features visible

---

## NAVIGATION VISIBILITY MATRIX

| Navigation Item | Starter | Professional | Business | Premium | Enterprise | Current Visibility |
|----------------|---------|--------------|----------|---------|------------|-------------------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ All |
| Orders | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ All |
| Kitchen | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ All |
| Tables | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ All |
| **Reservations** | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ **All (wrong)** |
| Menu | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ All |
| Inventory | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ All |
| **Inventory Alerts** | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ **All (wrong)** |
| OCR Documents | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ All |
| QR Builder | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ All |
| **QR Analytics** | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ **All (wrong)** |
| Reports | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ All |
| **Menu Performance** | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ **All (wrong)** |
| **Peak Hours** | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ **All (wrong)** |
| **Payment Analytics** | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ **All (wrong)** |
| **Staff** | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ **All (wrong)** |
| Transactions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ All |
| Payout Summary | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ All |
| Payment Settings | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ All |
| Settings | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ All |
| Profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ All |
| Security | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ All |

**Summary:**
- **Correctly Visible:** 16/22 items (73%)
- **Incorrectly Visible:** 6/22 items (27%)
- **Upgrade Prompts:** 0/22 items (0%)

---

## UPGRADE PROMPT ANALYSIS

### Current State
**Upgrade Prompts in Navigation:** ❌ None

**Upgrade Prompts in Pages:** ❌ None (FeatureGate component exists but unused)

**Upgrade Prompts in Locked Features:** ❌ None

### Expected Behavior

**Navigation:**
- Locked items should show lock icon 🔒
- Hover should show "Upgrade to Professional" tooltip
- Click should show upgrade modal

**Pages:**
- Locked features should be blurred with overlay
- Overlay should show plan name, price, and "Upgrade" button
- Should include "14-day free trial" messaging

**Feature Interactions:**
- Attempting to use locked feature should show contextual prompt
- Prompt should explain why feature is valuable
- Prompt should show clear upgrade path

---

## HIDDEN FUNCTIONALITY ANALYSIS

### Features Hidden from All Users
**Admin-Only Features:**
- Payment Monitor (should be Professional+, not admin-only)
- Payment Feedback (admin tool)
- Support Inbox (admin tool)
- Canned Replies (admin tool)
- Feature Flags (admin tool)
- Diagnostics (admin tool)

**Developer-Only Features:**
- Pilot Observer (internal tool)
- Test Minimal (test page)

**Issue:** Payment Monitor is admin-only but should be a Professional+ commercial feature.

### Features Visible to All Users (Should Be Gated)
- Reservations (Professional+)
- Inventory Alerts (Professional+)
- QR Analytics (Business+)
- Menu Performance (Professional+)
- Peak Hours (Professional+)
- Payment Analytics (Professional+)
- Staff Management (Professional+)
- All AI features (Premium+)
- All optimization features (Premium+)

---

## USER EXPERIENCE QUALITY ASSESSMENT

### Starter User Experience: ⚠️ CONFUSING (3/10)

**Problems:**
1. Sees features they can't use
2. No clear indication of plan limitations
3. No upgrade prompts or guidance
4. Clicks lead to confusion or errors

**Impact:**
- High support burden
- Poor first impression
- Unclear value proposition
- Low conversion to paid plans

**Recommendations:**
- Hide locked features from navigation
- Show upgrade prompts for locked sections
- Add "Your Plan: Starter" indicator in topbar
- Add "Upgrade" button in topbar

### Professional User Experience: ⚠️ UNCLEAR (5/10)

**Problems:**
1. No visual differentiation from Starter
2. Unclear what features were unlocked
3. No celebration of upgrade
4. No clear path to Business plan

**Impact:**
- Unclear value received
- Low upgrade rate to Business
- Missed upsell opportunities

**Recommendations:**
- Show "Unlocked" badges on newly available features
- Add "Professional" badge in topbar
- Show upgrade prompts for Business features
- Highlight Business benefits

### Business User Experience: ⚠️ UNDIFFERENTIATED (6/10)

**Problems:**
1. Same interface as lower tiers
2. No multi-branch prominence
3. No celebration of Business status
4. No clear path to Premium

**Impact:**
- Unclear value received
- Low upgrade rate to Premium
- Underutilization of Business features

**Recommendations:**
- Show "Business" badge in topbar
- Highlight multi-branch capabilities
- Show upgrade prompts for Premium features
- Add "Branch Selector" in topbar if multi-branch

### Premium User Experience: ⚠️ UNDERWHELMING (7/10)

**Problems:**
1. Same interface as Starter
2. No premium branding
3. No "all features unlocked" celebration
4. No premium support visibility

**Impact:**
- Underwhelming premium experience
- No sense of exclusivity
- Unclear value for 200,000/month

**Recommendations:**
- Add "Premium" badge with gold/crown icon
- Show "All Features Unlocked" message
- Add premium support contact in topbar
- Consider premium theme/branding

### Enterprise User Experience: ❌ INADEQUATE (4/10)

**Problems:**
1. Same interface as all other tiers
2. No enterprise branding
3. No dedicated manager visibility
4. No custom features visible

**Impact:**
- Inadequate for enterprise customers
- No white-glove experience
- Unclear value for custom pricing

**Recommendations:**
- Add "Enterprise" badge with custom branding
- Show dedicated account manager contact
- Add custom features to navigation
- Consider enterprise-specific dashboard

---

## RECOMMENDATIONS

### P0 (Must Fix)

1. **Implement Subscription-Aware Navigation**
   ```typescript
   // Filter navigation based on user's plan
   const visibleNavigation = navigation.filter(item => {
     if (!item.requiredFeature) return true
     return hasFeatureAccess(userPlan, item.requiredFeature)
   })
   ```

2. **Add Plan Indicator in Topbar**
   ```typescript
   <div className="plan-badge">
     <Crown /> {planName}
   </div>
   ```

3. **Show Upgrade Prompts for Locked Features**
   - Add lock icons to hidden navigation items
   - Show upgrade modal on click
   - Include pricing and trial messaging

4. **Wrap Locked Pages in FeatureGate**
   - Use existing `<FeatureGate>` component
   - Apply to all subscription-gated pages
   - Show contextual upgrade prompts

### P1 (Should Fix)

1. **Add Plan-Specific Branding**
   - Professional: Blue badge
   - Business: Purple badge
   - Premium: Gold badge with crown
   - Enterprise: Custom branding

2. **Show Unlocked Features on Upgrade**
   - Highlight newly available features
   - Show "New" or "Unlocked" badges
   - Celebrate upgrade in dashboard

3. **Add Upgrade CTAs**
   - "Upgrade" button in topbar
   - Upgrade prompts in relevant sections
   - Contextual "Why upgrade" messaging

4. **Improve Premium/Enterprise Experience**
   - Premium: Gold theme, priority support visibility
   - Enterprise: Custom branding, dedicated manager contact

### P2 (Nice to Have)

1. **Add Feature Discovery**
   - Show preview of locked features
   - "Try Premium for 14 days" prompts
   - Feature comparison tooltips

2. **Add Usage Indicators**
   - QR codes used: 3/5 (Starter)
   - AI credits used: 15/50 (Professional)
   - Branches used: 2/3 (Business)

3. **Add Upgrade Incentives**
   - "Upgrade and save 25% with annual billing"
   - "Unlock 15 more features with Professional"
   - "Join 500+ businesses on Business plan"

---

## CONCLUSION

**Current State:** All users see the same dashboard regardless of subscription tier.

**Impact:**
- Confusing for Starter users (see features they can't use)
- Unclear value for Professional/Business users (no differentiation)
- Underwhelming for Premium/Enterprise users (no premium experience)

**Gap:** Dashboard visibility is not subscription-aware.

**Path Forward:**
1. Filter navigation based on subscription (P0)
2. Add plan indicators and branding (P0)
3. Show upgrade prompts for locked features (P0)
4. Wrap locked pages in FeatureGate (P0)
5. Improve premium/enterprise experience (P1)

**Estimated Effort:** 1-2 weeks

---

**Next Steps:** Review `SUBSCRIPTION_LIFECYCLE_AUDIT.md` for trial/upgrade/downgrade flow analysis.
