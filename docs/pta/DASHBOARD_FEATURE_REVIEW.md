# Dashboard Feature Review

**Platform:** ImboniServe  
**Date:** July 26, 2026  
**Audited Files:** `src/components/DashboardLayout.tsx`, `src/pages/dashboard/*` (89 pages)  

---

## 1. Dashboard Navigation Architecture

The dashboard uses a V1-curated navigation system defined in `DashboardLayout.tsx`. Navigation items are classified as:

- **`v1Visible: true`** — Always shown in sidebar (subject to role filtering)
- **`v1AdminOnly: true`** — Shown only to admin users
- **`featureFlag: 'flag_name'`** — Shown only if the feature flag is enabled in the database
- **Hidden from nav** — Routes exist but are not shown in the sidebar

### V1 Sidebar Sections (22 visible items)

| Section | Items | Status |
|---------|-------|--------|
| **Operations** (7) | Dashboard, Orders, Kitchen, Tables, Reservations, Waiter, Service Replay | ✅ All production-ready |
| **Menu & Inventory** (4) | Menu, Inventory, Inventory Alerts, OCR Documents | ✅ All production-ready |
| **QR & Digital** (2) | QR Builder, QR Analytics | ✅ All production-ready |
| **Reports** (5) | Reports, Close Day / Z-Report, Menu Performance, Peak Hours, Payment Analytics | ✅ All production-ready |
| **Team** (1) | Staff | ✅ Production-ready |
| **Financial** (3) | Transactions, Payout Summary, Payment Settings | ✅ All production-ready |
| **Settings** (3) | Settings, Profile, Security | ✅ All production-ready |
| **Admin** (6) | Payment Monitor, Payment Feedback, Support Inbox, Canned Replies, Feature Flags, Instruction Insights | ✅ Admin-only, production-ready |

**Assessment:** The V1 sidebar is accurate and truthful. All 22 visible items are production-ready and verified.

---

## 2. Feature-Flagged Dashboard Pages (Not in V1 sidebar)

These pages exist and are accessible if feature flags are enabled, but are NOT shown in the default V1 sidebar:

| Page | Feature Flag | Implementation Status | Marketing Claim | Consistency Issue |
|------|-------------|----------------------|-----------------|-------------------|
| `/dashboard/crm` | `crm_v1` | Page + API exist, RFM segmentation works | Homepage markets as production-ready | ❌ Inconsistent — homepage over-promises |
| `/dashboard/contacts` | `crm_v1` | Customer contacts list | Not marketed separately | ✅ Consistent |
| `/dashboard/loyalty` | `loyalty_system` | Page + API exist, points/tiers work | Homepage features grid markets it | ❌ Inconsistent — homepage over-promises |
| `/dashboard/promotions` | `promotions_engine` | Page + API exist, discount/happy hour types | Homepage features grid markets it | ❌ Inconsistent — homepage over-promises |
| `/dashboard/ai` | `ai_insights_v1` | Page exists with reorder suggestions, cost anomalies, insight reports | Homepage markets AI-powered insights | ❌ Inconsistent — homepage over-promises |
| `/dashboard/optimization` | `ai_insights_v1` | Optimization hub page | Not directly marketed | ✅ Consistent |
| `/dashboard/menu-builder` | `ai_menu_builder` | Page exists, upload/extract flow, requires OpenAI | Homepage markets as "AI Menu Builder" | ❌ Inconsistent — homepage over-promises |
| `/dashboard/cms` | `cms_v1` | CMS page exists | Not directly marketed | ✅ Consistent |
| `/dashboard/video-analytics` | `cms_v1` | Video analytics page | Not directly marketed | ✅ Consistent |
| `/dashboard/hotel` | `hotel_mode` | Hotel mode page | Homepage markets as "Hotel Mode" | ❌ Inconsistent — homepage over-promises |
| `/dashboard/branches` | `multi_branch` | Multi-branch management | Homepage markets as "Multi-Branch Control" | ✅ Consistent — feature is production-ready |
| `/dashboard/outlets` | `multi_branch` | Outlet management | Not separately marketed | ✅ Consistent |

---

## 3. Hidden Dashboard Pages (Routes exist, not in navigation)

These pages have routes but are intentionally hidden from the sidebar:

| Page | Implementation Status | Should It Be Visible? |
|------|----------------------|----------------------|
| `/dashboard/ab-testing` | Page exists, interface built, no API integration | ❌ No — not production-ready |
| `/dashboard/campaigns` | Page exists, campaign creation UI, API exists | ❌ No — not production-ready, no automation |
| `/dashboard/site-builder` | Page exists, template selection, customization | ❌ No — not production-ready, no publishing |
| `/dashboard/referrals` | Referral leaderboard page | 🟡 Could be visible — works but minor polish |
| `/dashboard/my-referrals` | Personal referrals page | 🟡 Could be visible — works |
| `/dashboard/invite` | Invite & earn page | 🟡 Could be visible — works |
| `/dashboard/kds` | Kitchen Display System (advanced) | ❌ No — use `/dashboard/kitchen` instead |
| `/dashboard/staff-performance` | Staff performance metrics | 🟡 Could be visible — works |
| `/dashboard/smart-dining-slips` | Smart dining slip management | 🟡 Could be visible — works |
| `/dashboard/recipe-management` | Recipe management with costing | ❌ No — not verified |
| `/dashboard/auto-reorder` | Auto-reorder dashboard | ✅ Yes — ORRS verified, should be visible |
| `/dashboard/advanced-reporting` | Advanced reporting page | ❌ No — not verified |
| `/dashboard/ceo` | CEO dashboard | ❌ No — not verified |
| `/dashboard/cfo` | CFO dashboard | ❌ No — not verified |
| `/dashboard/marketer` | Marketer dashboard | ❌ No — not verified |
| `/dashboard/customer-feedback` | Customer feedback system | ❌ No — not verified |
| `/dashboard/tablet-ordering` | Tablet ordering interface | ❌ No — not verified |
| `/dashboard/diagnostics` | System diagnostics | ❌ No — admin tool |
| `/dashboard/notifications` | Notification preferences | 🟡 Could be visible |
| `/dashboard/currency-settings` | Currency configuration | 🟡 Could be visible |
| `/dashboard/templates` | Template management | ❌ No — placeholder page |

---

## 4. Dashboard vs Marketing Consistency Issues

### 4.1 Features Marketed on Homepage but NOT in V1 Sidebar

| Homepage Claim | Dashboard Reality | Severity |
|---------------|-------------------|----------|
| "Customer CRM (RFM)" | Feature-flagged, not in V1 sidebar | **HIGH** — customer expects CRM, doesn't see it |
| "Automated WhatsApp Campaigns" | Hidden from sidebar, no automation | **HIGH** — customer expects campaigns, doesn't see it |
| "Menu A/B Testing" | Hidden from sidebar, no API | **HIGH** — customer expects A/B testing, doesn't see it |
| "Voice Ordering (WhatsApp AI)" | Not in dashboard at all | **HIGH** — customer expects voice ordering, can't find it |
| "Loyalty & Rewards" | Feature-flagged, not in V1 sidebar | **MEDIUM** — customer expects loyalty, doesn't see it |
| "Promotions & Happy Hours" | Feature-flagged, not in V1 sidebar | **MEDIUM** — customer expects promotions, doesn't see it |
| "AI Menu Builder" | Feature-flagged, not in V1 sidebar | **MEDIUM** — customer expects AI menu builder, doesn't see it |
| "Hotel Mode" | Feature-flagged, not in V1 sidebar | **MEDIUM** — customer expects hotel mode, doesn't see it |
| "Site Builder" | Hidden from sidebar | **MEDIUM** — customer expects site builder, doesn't see it |

### 4.2 Features in V1 Sidebar but NOT Marketed on Homepage

| Dashboard Feature | Homepage Marketing | Recommendation |
|-------------------|-------------------|----------------|
| Service Replay | Not mentioned | Add to homepage — unique feature |
| OCR Documents | Not mentioned | Add to homepage — unique feature |
| Waiter Station | Not mentioned | Add to homepage |
| Payout Summary | Not mentioned | Add to homepage |
| Security | Not mentioned | Not necessary to market |

### 4.3 Pricing Plan Claims vs Dashboard Reality

| Pricing Claim | Dashboard Reality | Severity |
|--------------|-------------------|----------|
| Starter: "Basic CRM" | Feature-flagged `crm_v1` | **HIGH** |
| Starter: "Site Builder preview" | Hidden from sidebar | **HIGH** |
| Professional: "WhatsApp campaigns (basic)" | Hidden, no automation | **HIGH** |
| Professional: "Site Builder (basic mode)" | Hidden from sidebar | **HIGH** |
| Business: "Supplier portal" | Exists but not production-ready | **MEDIUM** |
| Business: "A/B testing lite" | Hidden, no API | **HIGH** |
| Premium: "Recipe management with costing" | Page exists, not verified | **MEDIUM** |
| Premium: "Prep plans & forecasting" | Not implemented | **HIGH** |
| Premium: "White-label options" | Not implemented | **HIGH** |
| Premium: "API access" | Not implemented | **HIGH** |

---

## 5. Recommendations

### 5.1 Dashboard Navigation Changes

1. **Add `/dashboard/auto-reorder` to V1 sidebar** — ORRS verified, production-ready
2. **Consider adding `/dashboard/referrals` to V1 sidebar** — works with minor polish
3. **Consider adding `/dashboard/smart-dining-slips` to V1 sidebar** — production-ready
4. **Keep all feature-flagged items hidden** until they are fully verified

### 5.2 Marketing Alignment Changes

1. **Remove all homepage claims** for features not in the V1 sidebar (see Homepage Recommendations)
2. **Rewrite pricing plan feature lists** to only include V1 sidebar features
3. **Add homepage marketing** for Service Replay, OCR Documents, and Waiter Station — these are unique production-ready features not currently marketed

### 5.3 Feature Flag Policy

- Feature flags should remain off by default for new restaurant onboarding
- Features should only be enabled after full operational verification
- The `ai_insights_v1` flag may be enabled for restaurants that purchase AI credits
- The `multi_branch` flag may be enabled for Business plan and above

---

## 6. Empty States Review

Most dashboard pages have basic loading states and empty states. Key observations:

- **Orders page:** Has empty state with "No orders yet" message ✅
- **Inventory page:** Has empty state with "No inventory items" message ✅
- **Reports page:** Has empty state with "No data available" message ✅
- **Reservations page:** Has empty state ✅
- **Staff page:** Has empty state ✅
- **CRM page:** Has empty state with segment filter ✅
- **AI page:** Has empty states for no suggestions, no anomalies ✅

**Assessment:** Empty states are adequate. No misleading empty states found.

---

## 7. Onboarding Review

The signup flow (`/signup`) creates a business account and redirects to the dashboard. The dashboard index page (`/dashboard/index.tsx`) provides an overview with quick actions.

**Onboarding gaps:**
- No guided onboarding wizard (e.g., "Step 1: Add your menu, Step 2: Create tables, Step 3: Generate QR codes")
- The "How It Works" section on the homepage describes 6 steps but the dashboard doesn't guide users through them
- New restaurants may feel lost without guidance

**Recommendation:** Consider adding an onboarding checklist to the dashboard index page. This is not a PTA finding (no misleading claim) but would improve first-user experience.

---

*Review completed: July 26, 2026*
