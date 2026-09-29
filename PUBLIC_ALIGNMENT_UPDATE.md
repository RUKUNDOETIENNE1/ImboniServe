# PUBLIC ALIGNMENT UPDATE — Revised Positioning Plan

**Audit Date:** 2025  
**Version:** 1.0  
**Auditor:** Cascade AI (PRVPAS Sprint)  
**Supersedes:** `PUBLIC_POSITIONING_PLAN.md` (previous audit)

This document revises the public positioning plan using **only VERIFIED capabilities**. All assumptions from the previous audit have been removed. Only capabilities that have been personally verified as production-ready in the current V1.0 deployment are included.

---

## Guiding Principle

> Every capability shown on the public website must be something we would confidently demonstrate live to a prospective paying hospitality business.

If we cannot demo it end-to-end, it does not appear publicly.

---

## 1. Homepage Restructuring

### Current Homepage Issues

The homepage (`src/pages/index.tsx`) currently promotes:
- **"Multi-Branch Control"** in the main features grid → **PARTIAL** (feature-flagged, not universally available)
- **"Voice Ordering (WhatsApp AI)"** in the growth slides → **ROADMAP** (does not exist)
- **"Advanced Analytics"** implied in growth slides → **PARTIAL** (feature-flagged)

### Revised Homepage Features Grid

Keep these **VERIFIED** features in the main grid (currently present):

| # | Feature | Icon | Description |
|---|---------|------|-------------|
| 1 | QR Code Ordering | ShoppingCart | Customers scan, browse your menu, and order directly from their phones — no app needed. |
| 2 | Inventory & Procurement | Package | Track stock levels, set reorder points, and manage purchase orders with full audit trails. |
| 3 | Reports & Analytics | BarChart3 | Daily, weekly, and monthly reports. Understand your revenue, costs, and margins at a glance. |
| 4 | Smart Analytics | BrainCircuit | Reorder recommendations and cost anomaly alerts that protect your profit margins. |
| 5 | Discovery Listing | Globe | Get listed on our public directory where customers find hospitality businesses near them. |
| 6 | Smart Dining Slips™ | Receipt | Auto-generated digital receipts with shareable links for seamless customer experience. |
| 7 | Low-Stock Push Alerts | Bell | Never run out. Get automatic alerts before inventory drops below reorder points. |
| 8 | WhatsApp Integration | MessageCircle | Receive order alerts, daily summaries, and low-stock notifications directly on WhatsApp. |
| 9 | Mobile Money Payments | Smartphone | Accept mobile money payments natively — no POS terminal required. |
| 10 | Role-Based Access | Shield | Cashier, waiter, supervisor, manager — each role sees only what they need. |

### Remove from Homepage Features Grid

- **"Multi-Branch Control"** → Move to pricing page as a plan-specific feature

### Revised Advanced Features Section

Keep these **VERIFIED** advanced features:

| # | Feature | Icon | Description |
|---|---------|------|-------------|
| 1 | AI Menu Builder | Sparkles | Upload a photo or document and let AI build your menu for you. |
| 2 | Business Discovery | Globe | Get discovered by customers searching for hospitality businesses powered by ImboniServe. |
| 3 | Referral Program | Gift | Customers earn rewards for every referral. No limits, no caps — just instant rewards. |
| 4 | Staff & Roles | Users | Granular role permissions: waiter, cashier, supervisor, manager, and more. |
| 5 | Inventory Alerts & Auto-Reorder | Package | Automatic stock alerts and AI-powered draft purchase orders for your suppliers. |
| 6 | Smart Dining Slips | Receipt | Auto-generated digital receipts with shareable links for seamless customer experience. |

### Revised Growth Slides (Carousel)

Keep these **VERIFIED** growth slides:

| # | Slide | Link |
|---|-------|------|
| 1 | Customer CRM (RFM) | `/dashboard/crm` |
| 2 | Automated WhatsApp Campaigns | `/dashboard/campaigns` |
| 3 | Menu A/B Testing | `/dashboard/ab-testing` |
| 4 | Low-Stock Push Alerts | `/dashboard/inventory-alerts` |
| 5 | Deposits & Reservations | `/dashboard/reservations` |

### Remove from Growth Slides

- **"Voice Ordering (WhatsApp AI)"** → Does not exist. Remove immediately.
- Replace with a verified capability, e.g., **"Service Replay™"** linking to `/dashboard/operations/service-replay` — "Replay any service period like a football match."

### Revised Real-Time Slides

Keep all current real-time slides (all link to verified capabilities):

| # | Slide | Link |
|---|-------|------|
| 1 | Every Sale, Live | `/dashboard` |
| 2 | QR Performance by Table | `/dashboard/qr-analytics` |
| 3 | Tables & Sections Status | `/dashboard/tables` |
| 4 | Peak Hours & Flow | `/dashboard/analytics/peak-hours` |
| 5 | Unified Orders | `/dashboard/orders/unified` |

---

## 2. New Homepage Sections to Add

### "Intelligence Layer" Section

Showcase verified AI and analytics capabilities:

| Feature | Description | Demo Link |
|---------|-------------|-----------|
| AI Insight Reports | Weekly/monthly AI-generated business summaries with KPI snapshots | `/dashboard/ai` |
| Cost Anomaly Alerts | Automatic detection of supplier price increases | `/dashboard/ai` |
| Menu Performance | Know your best and worst selling items by revenue and trend | `/dashboard/analytics/menu-performance` |
| Service Replay™ | Replay any service period to understand exactly what happened | `/dashboard/operations/service-replay` |
| Optimization Hub | AI-driven recommendations with measured impact tracking | `/dashboard/optimization` |

### "Executive Dashboards" Section

| Feature | Description | Demo Link |
|---------|-------------|-----------|
| CEO Dashboard | Business health, revenue, customers, operations in one view | `/dashboard/ceo` |
| CFO Dashboard | Financial health, revenue intelligence, subscription metrics | `/dashboard/cfo` |

### "Content & Discovery" Section

| Feature | Description | Demo Link |
|---------|-------------|-----------|
| Site Builder | Create your own website with AI-assisted content generation | `/dashboard/site-builder` |
| Content Management | Publish posts and videos to your discovery feed | `/dashboard/cms` |
| Video Analytics | Track views, watch time, and engagement on your videos | `/dashboard/video-analytics` |

---

## 3. Pricing Page Alignment

### Plan-Specific Features (Only in Relevant Tiers)

These features are **VERIFIED** but only available on specific plans. They should appear in the pricing comparison table, not in the general features grid:

| Feature | Plan Gate | Evidence |
|---------|-----------|----------|
| Multi-Branch Control | Business plan+ (15 active clients threshold) | `useFeatureFlag('multi_branch')` |
| Hotel Management | Business plan+ | `useFeatureFlag('hotel_mode')` |
| Loyalty Program | Business plan+ | `useFeatureFlag('loyalty_system')` |
| Advanced Analytics | 10+ active clients | `useFeatureFlag('advanced_analytics')` |
| Site Builder Publishing | Pro tier | `publishSiteSubscription(businessId)` check |

### Universal Features (All Plans)

All 38 VERIFIED capabilities that are not plan-gated should be listed as included in all plans. See `VERIFIED_CAPABILITIES.md` for the complete list.

---

## 4. Features Page (New)

Create a dedicated `/features` page that organizes verified capabilities into categories:

### Operations
- QR Code Ordering
- Kitchen Display System (KDS)
- Waiter Dashboard
- Stations Management
- Reservations with Deposits
- Close Day (Z-Report)
- Service Replay™
- Outlets Management

### Menu & Inventory
- AI Menu Builder
- Inventory Management
- Auto-Reorder (AI)
- Low-Stock Push Alerts
- Promotions & Happy Hours
- A/B Testing

### Analytics & AI
- Reports & Analytics
- Menu Performance Analytics
- Peak Hours Analytics
- Instruction Insights
- AI Insight Reports
- Cost Anomaly Alerts
- Optimization Hub
- QR Analytics
- Video Analytics

### Finance & Payments
- Mobile Money Payments
- Payment Monitor
- Transactions
- Payout Summary
- Currency Settings
- CEO Dashboard
- CFO Dashboard

### Customer & Marketing
- CRM with RFM Segmentation
- WhatsApp Campaigns
- Contacts Management
- Referral Program
- Marketer Dashboard
- Smart Dining Slips™

### Infrastructure
- Staff & Role Management
- Security & Sessions
- Notifications Settings
- Content Management (CMS)
- Site Builder
- Discovery Listing

---

## 5. What Must NOT Appear in Public Materials

### Removed from Homepage

| Item | Reason | Action |
|------|--------|--------|
| "Multi-Branch Control" in features grid | Feature-flagged, not universal | Move to pricing comparison only |
| "Voice Ordering (WhatsApp AI)" in growth slides | Does not exist | Remove immediately |
| Any mention of Recipe Management | UI uses hardcoded data | Remove |
| Any mention of Tablet Ordering | UI uses hardcoded data, no order persistence | Remove |
| Any mention of Customer Feedback | UI uses mock data | Remove |
| Any mention of Advanced Reporting | UI uses mock data | Remove |
| Any mention of Supplier Portal | UI uses hardcoded data | Remove |
| Staff Performance with "customer ratings" | Ratings are mocked with Math.random() | Only mention sales/tips metrics |

### Removed from All Public Materials

- Recipe Management
- Tablet Ordering
- Customer Feedback
- Advanced Reporting
- Supplier Portal
- Voice Ordering (WhatsApp AI)

### Only in Plan-Specific Context

- Multi-Branch Control
- Hotel Management
- Loyalty Program
- Advanced Analytics
- Site Builder Publishing (Pro tier)

---

## 6. Sales Presentation Guidance

### Safe to Demo Live

These capabilities can be confidently demonstrated to a prospective paying hospitality business:

1. **QR Ordering** — Scan QR → browse menu → place order → kitchen receives
2. **KDS** — Show live kitchen display with real orders
3. **Waiter Dashboard** — Show 5-stage order queue
4. **Inventory** — Add/edit/delete items, show stock levels
5. **Auto-Reorder** — Show AI suggestions, approve to create draft order
6. **CRM** — Show RFM segments, customer profiles
7. **Campaigns** — Create and send WhatsApp campaign
8. **Reservations** — Create reservation with deposit
9. **Close Day** — Show Z-Report with revenue breakdown
10. **Service Replay™** — Select time range, play back events
11. **AI Insights** — Generate insight report
12. **A/B Testing** — Create test with price variants
13. **Menu Builder** — Upload menu photo, extract items
14. **Site Builder** — Select template, customize, publish
15. **CEO/CFO Dashboard** — Show executive view
16. **QR Analytics** — Show scan/conversion metrics
17. **Peak Hours** — Show hourly demand patterns
18. **Payment Monitor** — Show real-time payment tracking
19. **Security** — Show sessions, revoke, MFA status
20. **Discovery** — Show public directory listing

### Do NOT Demo

- Recipe Management (hardcoded data)
- Tablet Ordering (no order persistence)
- Customer Feedback (mock data)
- Advanced Reporting (mock data)
- Supplier Portal (hardcoded data)
- Voice Ordering (does not exist)
- Staff Performance customer ratings (mocked)

---

## 7. Implementation Priority

### Immediate (Before Next Public Release)

1. **Remove "Voice Ordering (WhatsApp AI)" from homepage** — highest priority, feature does not exist
2. **Remove "Multi-Branch Control" from homepage features grid** — move to pricing only
3. **Add "Service Replay™" to homepage growth slides** — verified, differentiating capability

### Short-term (Next Sprint)

4. **Create dedicated `/features` page** with all 38 verified capabilities organized by category
5. **Update pricing comparison table** to accurately reflect plan-gated features
6. **Add "Intelligence Layer" homepage section** showcasing AI and analytics

### Medium-term (V1.1)

7. **Wire Recipe Management UI to existing API** — backend is ready, UI needs integration
8. **Wire Tablet Ordering to real APIs** — replace hardcoded data and console.log
9. **Build Customer Feedback backend** — wire UI to real API
10. **Build Advanced Reporting backend** — wire UI to real API
11. **Build Supplier Portal backend** — wire UI to real API
12. **Implement Voice Ordering** — or remove all references permanently

---

## Summary

| Category | Count | Action |
|----------|-------|--------|
| VERIFIED — Safe to promote | 38 | Include in all public materials |
| PARTIAL — Do not advertise | 10 | Fix or restrict to plan-specific context |
| ROADMAP — Remove | 1 | Remove from all public materials |
| INTERNAL — Not for marketing | 2 | Keep internal |

**The public website should only show what we can demo live. Everything else waits.**
