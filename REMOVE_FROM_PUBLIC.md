# REMOVE FROM PUBLIC — Failed Verification

**Audit Date:** 2025  
**Version:** 1.0  
**Auditor:** Cascade AI (PRVPAS Sprint)

These capabilities were previously proposed for public marketing but **failed verification**. They must not appear in any public-facing materials (Homepage, Features page, Pricing, Product Tour, Marketing materials, Sales presentations).

---

## PARTIAL — Mostly Implemented, Missing Important Functionality

### 1. Recipe Management

**Classification:** PARTIAL  
**Previous Recommendation:** Promote as "Recipe Management with cost analysis and profit margins"

**Why it failed:**
- **UI uses hardcoded data.** The dashboard page (`src/pages/dashboard/recipe-management.tsx`) defines `ingredients` and `recipes` as static arrays within the component (lines 44-112). No API calls are made.
- **Backend exists but is disconnected.** A full API exists at `/api/recipes` with `RecipeService`, `createRecipeSchema`, `listRecipesQuerySchema`, and permission middleware. However, the UI does not call this API.
- **Workflow incomplete.** A user cannot create, edit, or persist recipes through the dashboard. They can only view static sample data.
- **Customer value not realized.** Businesses cannot manage their actual recipes.

**Evidence:** `recipe-management.tsx:44-112` — hardcoded `ingredients` and `recipes` arrays. No `fetch()` calls to `/api/recipes`.

**Recommendation:** Wire the UI to the existing API. Do not advertise until the UI fetches and persists real data.

---

### 2. Staff Performance

**Classification:** PARTIAL  
**Previous Recommendation:** Promote as "Staff Performance Analytics with customer ratings"

**Why it failed:**
- **Customer ratings are mocked.** The API (`src/pages/api/staff/performance.ts`) generates customer ratings with `Math.random()` (line 97: `const customerRating = 4.0 + Math.random() * 1.0`).
- **Sales and tips data are real.** The API queries Prisma for actual sales, orders, average order value, service time, and tips.
- **Workflow partially complete.** Sales metrics work; customer ratings do not reflect real feedback.
- **Customer value partially realized.** Businesses get accurate sales performance but fake customer satisfaction scores.

**Evidence:** `staff-performance.tsx:96-98` — `// Mock customer rating (would come from feedback system)` followed by `Math.random()`.

**Recommendation:** Integrate with a real customer feedback system. Do not advertise customer ratings until real data is used.

---

### 3. Hotel Management

**Classification:** PARTIAL  
**Previous Recommendation:** Promote as "Hotel Management with room tracking and guest recognition"

**Why it failed:**
- **Gated by feature flag.** The UI (`src/pages/dashboard/hotel.tsx`) checks `useFeatureFlag('hotel_mode')` and displays "require business plan" message when disabled.
- **API is functional.** `/api/hotel/rooms` supports GET (fetch rooms) and POST (create room) with Prisma and CustomerService integration.
- **Workflow conditionally complete.** Only works when `hotel_mode` is enabled for the business.
- **Customer value not universally realized.** Businesses without the feature flag cannot use it.

**Evidence:** `hotel.tsx:64-74` — feature flag check returns "require business plan" message.

**Recommendation:** Only advertise to businesses on plans that include hotel mode. Do not promote as a general feature.

---

### 4. Loyalty Program

**Classification:** PARTIAL  
**Previous Recommendation:** Promote as "Customer Loyalty Program with points and rewards"

**Why it failed:**
- **Gated by feature flag.** The UI (`src/pages/dashboard/loyalty.tsx`) checks `useFeatureFlag('loyalty_system')` and displays disabled state when inactive.
- **API is functional.** `/api/loyalty/balance` and `/api/loyalty/issue` work with real data.
- **Workflow conditionally complete.** Only works when `loyalty_system` is enabled.
- **Customer value not universally realized.**

**Evidence:** `loyalty.tsx:28` — `const loyaltyEnabled = useFeatureFlag('loyalty_system')`.

**Recommendation:** Only advertise to businesses on plans that include loyalty. Do not promote as a general feature.

---

### 5. Multi-Branch Control

**Classification:** PARTIAL  
**Previous Recommendation:** Promoted on homepage as "Multi-Branch Control — Manage multiple locations from one dashboard"

**Why it failed:**
- **Gated by feature flag.** The UI (`src/pages/dashboard/branches.tsx`) checks `useFeatureFlag('multi_branch')` and displays "unlocks at 15 active clients" when disabled.
- **API is functional.** `/api/branches` supports GET and POST.
- **Workflow conditionally complete.** Only works when `multi_branch` is enabled.
- **Customer value not universally realized.**

**Evidence:** `branches.tsx:21` — `const multiBranchEnabled = useFeatureFlag('multi_branch')`. Line 52: "Multi-Branch unlocks at 15 active clients on Business plan+".

**Recommendation:** Remove from homepage general features. Only mention in pricing/plan comparison where the feature is included.

---

### 6. Advanced Analytics

**Classification:** PARTIAL  
**Previous Recommendation:** Promote as "Advanced Analytics with sales, customer, and inventory insights"

**Why it failed:**
- **Gated by feature flag.** The UI (`src/pages/dashboard/analytics.tsx`) checks `useFeatureFlag('advanced_analytics')` and displays "unlocks at 10 active clients" when disabled.
- **API is functional.** `/api/analytics/dashboard?days=...` returns real data.
- **Workflow conditionally complete.** Only works when `advanced_analytics` is enabled.
- **Customer value not universally realized.**

**Evidence:** `analytics.tsx:35` — `const analyticsEnabled = useFeatureFlag('advanced_analytics')`. Line 60: "Advanced Analytics unlocks at 10 active clients".

**Recommendation:** Remove from general features. Only mention in pricing/plan comparison.

---

### 7. Tablet Ordering

**Classification:** PARTIAL  
**Previous Recommendation:** Promote as "Tablet Ordering for in-venue tableside ordering"

**Why it failed:**
- **UI uses hardcoded data.** The dashboard page (`src/pages/dashboard/tablet-ordering.tsx`) defines `tables` and `menuItems` as static arrays (lines 39-56). No API calls for menu or table data.
- **Order placement is a console.log.** `handlePlaceOrder` at line 95-101 only logs to console and shows a toast. No API call to create an order.
- **Workflow completely broken.** Orders are not persisted. A business cannot use this for real operations.
- **Customer value not realized.**

**Evidence:** `tablet-ordering.tsx:39-56` — hardcoded data. Line 97: `console.log('Placing order:', { table: selectedTable, items: cart })`.

**Recommendation:** Remove from all public materials. Wire to real APIs before reconsidering.

---

### 8. Customer Feedback

**Classification:** PARTIAL  
**Previous Recommendation:** Promote as "Customer Feedback collection and sentiment analysis"

**Why it failed:**
- **UI uses mock data.** The dashboard page (`src/pages/dashboard/customer-feedback.tsx`) defines `mockFeedback` as a static array (lines 34-83). No API calls.
- **No backend integration.** No fetch calls to any API. Stats are hardcoded.
- **Survey configuration is non-functional.** The "Save Configuration" button has no onClick handler that persists data.
- **Customer value not realized.**

**Evidence:** `customer-feedback.tsx:34` — `const mockFeedback: Feedback[] = [...]`. No `fetch()` calls anywhere in the component.

**Recommendation:** Remove from all public materials. Build backend and wire UI before reconsidering.

---

### 9. Advanced Reporting

**Classification:** PARTIAL  
**Previous Recommendation:** Promote as "Advanced Reporting with custom report builder"

**Why it failed:**
- **UI uses mock data.** The dashboard page (`src/pages/dashboard/advanced-reporting.tsx`) defines `mockReportData` as a static object (lines 78-106). No API calls.
- **Report templates are static.** No backend to generate or persist reports.
- **"Create Custom Report" button is non-functional.** No modal or form appears.
- **Customer value not realized.**

**Evidence:** `advanced-reporting.tsx:78` — `const mockReportData: Record<string, ReportData> = {...}`.

**Recommendation:** Remove from all public materials. Build backend and wire UI before reconsidering.

---

### 10. Supplier Portal

**Classification:** PARTIAL  
**Previous Recommendation:** Promote as "Supplier Portal with order management and catalog"

**Why it failed:**
- **UI uses hardcoded data.** The dashboard page (`src/pages/dashboard/supplier-portal.tsx`) defines `suppliers` as a static array (line 54 onwards). No API calls.
- **No backend integration.** No fetch calls to any API.
- **Supplier items and orders are static.** Cannot be created, edited, or persisted.
- **Customer value not realized.**

**Evidence:** `supplier-portal.tsx:54` — `const suppliers: Supplier[] = [...]`. No `fetch()` calls.

**Recommendation:** Remove from all public materials. Build backend and wire UI before reconsidering.

---

## ROADMAP — Future Functionality, Remove From All Public Recommendations

### 11. Voice Ordering (WhatsApp AI)

**Classification:** ROADMAP  
**Previous Recommendation:** Promoted on homepage as "Voice Ordering (WhatsApp AI) — Let customers order by voice in EN / FR / RW"

**Why it failed:**
- **No implementation found.** The homepage links to `/dashboard/ai` but the AI dashboard shows reorder suggestions, cost anomalies, and insight reports — not voice ordering.
- **No voice-related API endpoints, components, or services found** in the codebase.
- **Customer value not realized.** This feature does not exist.

**Evidence:** `src/pages/index.tsx:270-275` — homepage promotes "Voice Ordering (WhatsApp AI)" linking to `/dashboard/ai`. The AI dashboard (`src/pages/dashboard/ai.tsx`) contains no voice ordering functionality.

**Recommendation:** Remove from homepage immediately. Reserve for future version announcement when implemented.

---

## INTERNAL — Useful Internally, Not for Customer Marketing

### 12. Branches Management

**Classification:** INTERNAL  
**Why:** Feature-flagged admin tool for multi-location management. Only relevant to businesses on specific plans. Not a marketing-worthy feature on its own.

### 13. Profile Settings

**Classification:** INTERNAL  
**Why:** Standard user profile management. Expected baseline functionality, not a differentiating feature.

---

## Summary

| Status | Count | Capabilities |
|--------|-------|-------------|
| PARTIAL | 10 | Recipe Management, Staff Performance, Hotel Management, Loyalty Program, Multi-Branch, Advanced Analytics, Tablet Ordering, Customer Feedback, Advanced Reporting, Supplier Portal |
| ROADMAP | 1 | Voice Ordering (WhatsApp AI) |
| INTERNAL | 2 | Branches Management, Profile Settings |
| **Total to remove from public** | **13** | |

**Critical actions:**
1. **Remove "Voice Ordering" from homepage** — does not exist
2. **Remove "Multi-Branch Control" from homepage features** — feature-flagged, not universally available
3. **Do not promote Recipe Management, Tablet Ordering, Customer Feedback, Advanced Reporting, Supplier Portal** — UI uses hardcoded/mock data
4. **Do not promote Staff Performance with customer ratings** — ratings are mocked
5. **Only mention Hotel, Loyalty, Multi-Branch, Advanced Analytics in plan-specific pricing context**
