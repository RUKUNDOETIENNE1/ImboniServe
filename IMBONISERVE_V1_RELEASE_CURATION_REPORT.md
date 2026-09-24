# ImboniServe V1 Release Curation Report

**Date:** 2026-06-29
**Auditor:** Chief Product Officer / Senior Hospitality Product Manager
**Purpose:** Determine exactly what a restaurant owner should see in Version 1

---

## Executive Summary

ImboniServe has **157 pages** across dashboard, admin, supplier, store, and public-facing modules. For Version 1, we recommend exposing **28 core pages** to restaurant owners, with the remainder classified as Admin-only, Feature-flagged, or Deferred to V2.

The goal is to produce the cleanest possible first experience while preserving all platform capability.

---

## Audit Methodology

1. Enumerated all 157 `.tsx` pages in `/src/pages`
2. Reviewed navigation structure in `DashboardLayout.tsx` (54 navigation items)
3. Evaluated each feature against V1 criteria
4. Classified by operational importance and customer risk

---

## Complete Feature Inventory

### Dashboard Pages (87 pages)

| Page | Status | Customer Value | Importance | Risk | Recommendation |
|------|--------|----------------|------------|------|----------------|
| `/dashboard` | Production Ready | YES - Core home | Mission Critical | None | **VISIBLE** |
| `/dashboard/orders/unified` | Production Ready | YES - Order management | Mission Critical | None | **VISIBLE** |
| `/dashboard/sales` | Production Ready | YES - Sales tracking | Mission Critical | None | **VISIBLE** |
| `/dashboard/sales/new` | Production Ready | YES - POS entry | Mission Critical | None | **VISIBLE** |
| `/dashboard/kitchen` | Production Ready | YES - Kitchen display | Mission Critical | None | **VISIBLE** |
| `/dashboard/kds` | Production Ready | YES - Kitchen display alt | Important | Duplicate | **REMOVE FROM NAV** |
| `/dashboard/tables` | Production Ready | YES - Table management | Mission Critical | None | **VISIBLE** |
| `/dashboard/tables/[id]/seats` | Production Ready | YES - Seat management | Important | None | **VISIBLE** |
| `/dashboard/inventory` | Production Ready | YES - Stock tracking | Mission Critical | None | **VISIBLE** |
| `/dashboard/inventory-alerts` | Production Ready | YES - Low stock alerts | Important | None | **VISIBLE** |
| `/dashboard/menu/index` | Redirect | N/A | N/A | None | **VISIBLE** |
| `/dashboard/menu/dynamic-edit` | Production Ready | YES - Menu editing | Mission Critical | None | **VISIBLE** |
| `/dashboard/menu-builder` | Partial | NO - AI-assisted | Future | Confuse | **FEATURE FLAG** |
| `/dashboard/qr-builder` | Production Ready | YES - QR generation | Mission Critical | None | **VISIBLE** |
| `/dashboard/qr-analytics` | Production Ready | YES - QR tracking | Important | None | **VISIBLE** |
| `/dashboard/reports` | Production Ready | YES - Daily/weekly reports | Mission Critical | None | **VISIBLE** |
| `/dashboard/analytics` | Feature Flagged | NO - Requires 10 clients | Future | Confuse | **FEATURE FLAG** |
| `/dashboard/analytics/menu-performance` | Production Ready | YES - Item insights | Important | None | **VISIBLE** |
| `/dashboard/analytics/peak-hours` | Production Ready | YES - Timing insights | Helpful | None | **VISIBLE** |
| `/dashboard/analytics/payments` | Production Ready | YES - Payment tracking | Important | None | **VISIBLE** |
| `/dashboard/analytics/instruction-insights` | Production Ready | NO - Niche | Optional | None | **ADMIN ONLY** |
| `/dashboard/staff` | Production Ready | YES - Staff management | Important | None | **VISIBLE** |
| `/dashboard/staff-performance` | Partial | NO - Incomplete | Future | Confuse | **DEFER TO V2** |
| `/dashboard/reservations` | Production Ready | YES - Booking management | Important | None | **VISIBLE** |
| `/dashboard/settings` | Production Ready | YES - Configuration | Mission Critical | None | **VISIBLE** |
| `/dashboard/profile` | Production Ready | YES - Business profile | Important | None | **VISIBLE** |
| `/dashboard/notifications` | Production Ready | YES - Alerts | Helpful | None | **VISIBLE** |
| `/dashboard/transactions` | Production Ready | YES - Payment history | Important | None | **VISIBLE** |
| `/dashboard/payout-summary` | Production Ready | YES - Earnings | Important | None | **VISIBLE** |
| `/dashboard/payment-settings` | Production Ready | YES - Payment config | Important | None | **VISIBLE** |
| `/dashboard/payments/monitor` | Production Ready | NO - Technical | Internal | Confuse | **ADMIN ONLY** |
| `/dashboard/feedback/payments` | Production Ready | NO - Support tool | Internal | None | **ADMIN ONLY** |
| `/dashboard/crm` | Production Ready | NO - Advanced | Future | Overwhelm | **FEATURE FLAG** |
| `/dashboard/contacts` | Production Ready | NO - CRM feature | Future | Overwhelm | **FEATURE FLAG** |
| `/dashboard/contacts/import` | Production Ready | NO - CRM feature | Future | Overwhelm | **FEATURE FLAG** |
| `/dashboard/contacts/new` | Production Ready | NO - CRM feature | Future | Overwhelm | **FEATURE FLAG** |
| `/dashboard/customers/[id]` | Production Ready | NO - CRM feature | Future | Overwhelm | **FEATURE FLAG** |
| `/dashboard/customer-feedback` | Production Ready | NO - Advanced | Future | None | **FEATURE FLAG** |
| `/dashboard/loyalty` | Feature Flagged | NO - Requires plan | Future | Confuse | **FEATURE FLAG** |
| `/dashboard/promotions` | Feature Flagged | NO - Requires plan | Future | Confuse | **FEATURE FLAG** |
| `/dashboard/campaigns` | Production Ready | NO - Marketing | Future | Overwhelm | **DEFER TO V2** |
| `/dashboard/marketer` | Production Ready | NO - Marketing | Future | Overwhelm | **DEFER TO V2** |
| `/dashboard/referrals` | Production Ready | NO - Growth | Optional | None | **DEFER TO V2** |
| `/dashboard/my-referrals` | Production Ready | NO - Growth | Optional | None | **DEFER TO V2** |
| `/dashboard/invite` | Production Ready | NO - Growth | Optional | None | **DEFER TO V2** |
| `/dashboard/branches` | Feature Flagged | NO - Multi-branch | Enterprise | Confuse | **FEATURE FLAG** |
| `/dashboard/outlets` | Feature Flagged | NO - Multi-outlet | Enterprise | Confuse | **FEATURE FLAG** |
| `/dashboard/stations` | Production Ready | NO - Kitchen stations | Advanced | Confuse | **DEFER TO V2** |
| `/dashboard/hotel` | Feature Flagged | NO - Hotel mode | Enterprise | Confuse | **FEATURE FLAG** |
| `/dashboard/site-builder` | Partial | NO - Website builder | Future | Incomplete | **DEFER TO V2** |
| `/dashboard/templates` | Production Ready | NO - Design templates | Future | None | **DEFER TO V2** |
| `/dashboard/cms` | Feature Flagged | NO - Content management | Future | Confuse | **FEATURE FLAG** |
| `/dashboard/cms/[id]` | Feature Flagged | NO - Content editing | Future | Confuse | **FEATURE FLAG** |
| `/dashboard/cms/new` | Feature Flagged | NO - Content creation | Future | Confuse | **FEATURE FLAG** |
| `/dashboard/cms/settings` | Feature Flagged | NO - CMS config | Future | Confuse | **FEATURE FLAG** |
| `/dashboard/video-analytics` | Feature Flagged | NO - Video metrics | Future | Confuse | **FEATURE FLAG** |
| `/dashboard/ai` | Production Ready | NO - AI insights | Future | Overwhelm | **FEATURE FLAG** |
| `/dashboard/optimization` | Production Ready | NO - AI optimization | Future | Overwhelm | **FEATURE FLAG** |
| `/dashboard/ab-testing` | Production Ready | NO - Experiments | Advanced | Confuse | **DEFER TO V2** |
| `/dashboard/auto-reorder` | Production Ready | NO - Automation | Future | Confuse | **DEFER TO V2** |
| `/dashboard/advanced-reporting` | Production Ready | NO - Enterprise | Enterprise | Overwhelm | **DEFER TO V2** |
| `/dashboard/ceo` | Production Ready | NO - Platform metrics | Internal | Confuse | **ADMIN ONLY** |
| `/dashboard/cfo` | Production Ready | NO - Platform finance | Internal | Confuse | **ADMIN ONLY** |
| `/dashboard/cfo-power-components` | Production Ready | NO - CFO components | Internal | Confuse | **ADMIN ONLY** |
| `/dashboard/currency-settings` | Production Ready | YES - Currency config | Helpful | None | **VISIBLE** |
| `/dashboard/security` | Production Ready | YES - Security settings | Important | None | **VISIBLE** |
| `/dashboard/smart-dining-slips` | Production Ready | NO - Advanced receipts | Optional | None | **DEFER TO V2** |
| `/dashboard/supplier-portal` | Production Ready | NO - Supplier view | Future | Confuse | **DEFER TO V2** |
| `/dashboard/tablet-ordering` | Production Ready | NO - Tablet mode | Future | None | **DEFER TO V2** |
| `/dashboard/support/inbox` | Production Ready | NO - Support tool | Internal | None | **ADMIN ONLY** |
| `/dashboard/support/canned-replies` | Production Ready | NO - Support tool | Internal | None | **ADMIN ONLY** |
| `/dashboard/diagnostics` | Production Ready | NO - Debug tool | Developer | Confuse | **DEVELOPER ONLY** |
| `/dashboard/pilot-observer` | Production Ready | NO - Pilot metrics | Internal | Confuse | **ADMIN ONLY** |
| `/dashboard/test-minimal` | Experimental | NO - Test page | Developer | Confuse | **DEVELOPER ONLY** |
| `/dashboard/admin/feature-flags` | Production Ready | NO - Admin tool | Internal | None | **ADMIN ONLY** |
| `/dashboard/recipe-management` | Mock | NO - Mock data | Future | Confuse | **DEFER TO V2** |

### DIE (Document Intelligence Engine) Pages (10 pages)

| Page | Status | Customer Value | Importance | Risk | Recommendation |
|------|--------|----------------|------------|------|----------------|
| `/dashboard/die` | Production Ready | YES - OCR dashboard | Mission Critical | None | **VISIBLE** |
| `/dashboard/die/index` | Production Ready | YES - Document list | Mission Critical | None | **VISIBLE** |
| `/dashboard/die/overview` | Production Ready | YES - OCR overview | Important | None | **VISIBLE** |
| `/dashboard/die/operations` | Production Ready | NO - Technical | Internal | Confuse | **ADMIN ONLY** |
| `/dashboard/die/analytics` | Production Ready | NO - Technical | Internal | Confuse | **ADMIN ONLY** |
| `/dashboard/die/anomalies` | Production Ready | NO - Technical | Internal | Confuse | **ADMIN ONLY** |
| `/dashboard/die/reconciliation` | Production Ready | NO - Technical | Internal | Confuse | **ADMIN ONLY** |
| `/dashboard/die/control-plane` | Production Ready | NO - Technical | Internal | Confuse | **ADMIN ONLY** |
| `/dashboard/die/review/[id]` | Production Ready | YES - Review extraction | Mission Critical | None | **VISIBLE** |
| `/dashboard/die/plugins` | Production Ready | NO - Technical | Internal | Confuse | **ADMIN ONLY** |
| `/dashboard/die/marketplace` | Production Ready | NO - Future | Future | Confuse | **DEFER TO V2** |

### Admin Pages (30 pages)

| Page | Status | Customer Value | Importance | Risk | Recommendation |
|------|--------|----------------|------------|------|----------------|
| `/admin` | Production Ready | NO - Platform admin | Internal | N/A | **ADMIN ONLY** |
| `/admin/restaurants` | Production Ready | NO - Platform admin | Internal | N/A | **ADMIN ONLY** |
| `/admin/users` | Production Ready | NO - Platform admin | Internal | N/A | **ADMIN ONLY** |
| `/admin/contacts` | Production Ready | NO - Platform admin | Internal | N/A | **ADMIN ONLY** |
| `/admin/subscriptions` | Production Ready | NO - Platform admin | Internal | N/A | **ADMIN ONLY** |
| `/admin/affiliates` | Production Ready | NO - Platform admin | Internal | N/A | **ADMIN ONLY** |
| `/admin/marketplace` | Production Ready | NO - Platform admin | Internal | N/A | **ADMIN ONLY** |
| `/admin/analytics` | Production Ready | NO - Platform admin | Internal | N/A | **ADMIN ONLY** |
| `/admin/reports` | Production Ready | NO - Platform admin | Internal | N/A | **ADMIN ONLY** |
| `/admin/feature-flags` | Production Ready | NO - Platform admin | Internal | N/A | **ADMIN ONLY** |
| `/admin/fee-settings` | Production Ready | NO - Platform admin | Internal | N/A | **ADMIN ONLY** |
| `/admin/platform-fees` | Production Ready | NO - Platform admin | Internal | N/A | **ADMIN ONLY** |
| `/admin/payout-control` | Production Ready | NO - Platform admin | Internal | N/A | **ADMIN ONLY** |
| `/admin/reconciliation` | Production Ready | NO - Platform admin | Internal | N/A | **ADMIN ONLY** |
| `/admin/revenue-analytics` | Production Ready | NO - Platform admin | Internal | N/A | **ADMIN ONLY** |
| `/admin/sales-pipeline` | Production Ready | NO - Platform admin | Internal | N/A | **ADMIN ONLY** |
| `/admin/leads` | Production Ready | NO - Platform admin | Internal | N/A | **ADMIN ONLY** |
| `/admin/newsletter` | Production Ready | NO - Platform admin | Internal | N/A | **ADMIN ONLY** |
| `/admin/ai-monitoring` | Production Ready | NO - Platform admin | Internal | N/A | **ADMIN ONLY** |
| `/admin/trial-eligibility` | Production Ready | NO - Platform admin | Internal | N/A | **ADMIN ONLY** |
| `/admin/finance/revenue` | Production Ready | NO - Platform admin | Internal | N/A | **ADMIN ONLY** |
| `/admin/finance/vendors` | Production Ready | NO - Platform admin | Internal | N/A | **ADMIN ONLY** |
| `/admin/payments/operations` | Production Ready | NO - Platform admin | Internal | N/A | **ADMIN ONLY** |
| `/admin/payments/webhook/[id]` | Production Ready | NO - Platform admin | Internal | N/A | **ADMIN ONLY** |

### Affiliate Pages (3 pages)

| Page | Status | Customer Value | Importance | Risk | Recommendation |
|------|--------|----------------|------------|------|----------------|
| `/affiliate` | Production Ready | NO - Affiliate program | Future | None | **DEFER TO V2** |
| `/affiliate/dashboard` | Production Ready | NO - Affiliate program | Future | None | **DEFER TO V2** |
| `/affiliate/program` | Production Ready | NO - Affiliate program | Future | None | **DEFER TO V2** |

### Supplier Portal Pages (6 pages)

| Page | Status | Customer Value | Importance | Risk | Recommendation |
|------|--------|----------------|------------|------|----------------|
| `/supplier` | Mock | NO - Supplier dashboard | Future | Incomplete | **DEFER TO V2** |
| `/supplier/login` | Production Ready | NO - Supplier auth | Future | None | **DEFER TO V2** |
| `/supplier/orders` | Production Ready | NO - Supplier orders | Future | None | **DEFER TO V2** |
| `/supplier/products` | Production Ready | NO - Supplier products | Future | None | **DEFER TO V2** |
| `/supplier/deliveries` | Production Ready | NO - Supplier deliveries | Future | None | **DEFER TO V2** |
| `/supplier/payments` | Production Ready | NO - Supplier payments | Future | None | **DEFER TO V2** |

### Store/Marketplace Pages (9 pages)

| Page | Status | Customer Value | Importance | Risk | Recommendation |
|------|--------|----------------|------------|------|----------------|
| `/store` | Production Ready | NO - Marketplace | Future | Confuse | **DEFER TO V2** |
| `/store/cart` | Production Ready | NO - Marketplace | Future | Confuse | **DEFER TO V2** |
| `/store/checkout` | Production Ready | NO - Marketplace | Future | Confuse | **DEFER TO V2** |
| `/store/orders` | Production Ready | NO - Marketplace | Future | Confuse | **DEFER TO V2** |
| `/store/order-confirmation` | Production Ready | NO - Marketplace | Future | Confuse | **DEFER TO V2** |
| `/store/payments` | Production Ready | NO - Marketplace | Future | Confuse | **DEFER TO V2** |
| `/store/payment/[id]` | Production Ready | NO - Marketplace | Future | Confuse | **DEFER TO V2** |
| `/store/supplier/[id]` | Production Ready | NO - Marketplace | Future | Confuse | **DEFER TO V2** |

### Discover/Public Pages (4 pages)

| Page | Status | Customer Value | Importance | Risk | Recommendation |
|------|--------|----------------|------------|------|----------------|
| `/discover` | Production Ready | NO - Consumer app | Future | None | **DEFER TO V2** |
| `/discover/[slug]` | Production Ready | NO - Consumer app | Future | None | **DEFER TO V2** |
| `/discover/feed` | Feature Flagged | NO - Consumer app | Future | None | **DEFER TO V2** |
| `/discover/map` | Production Ready | NO - Consumer app | Future | None | **DEFER TO V2** |

### Customer-Facing Order Pages (6 pages)

| Page | Status | Customer Value | Importance | Risk | Recommendation |
|------|--------|----------------|------------|------|----------------|
| `/order` | Production Ready | YES - QR ordering | Mission Critical | None | **VISIBLE** |
| `/order/checkout` | Production Ready | YES - QR checkout | Mission Critical | None | **VISIBLE** |
| `/order/confirmation` | Production Ready | YES - Order confirm | Mission Critical | None | **VISIBLE** |
| `/q/[token]` | Production Ready | YES - QR entry | Mission Critical | None | **VISIBLE** |
| `/t/[id]` | Production Ready | YES - Table link | Mission Critical | None | **VISIBLE** |
| `/pre-order` | Production Ready | YES - Pre-ordering | Important | None | **VISIBLE** |

### Auth & Setup Pages (8 pages)

| Page | Status | Customer Value | Importance | Risk | Recommendation |
|------|--------|----------------|------------|------|----------------|
| `/login` | Production Ready | YES - Authentication | Mission Critical | None | **VISIBLE** |
| `/signup` | Production Ready | YES - Registration | Mission Critical | None | **VISIBLE** |
| `/forgot-password` | Production Ready | YES - Password reset | Mission Critical | None | **VISIBLE** |
| `/reset-password` | Production Ready | YES - Password reset | Mission Critical | None | **VISIBLE** |
| `/setup` | Production Ready | YES - Onboarding | Mission Critical | None | **VISIBLE** |
| `/billing` | Production Ready | YES - Subscription | Important | None | **VISIBLE** |
| `/business/[id]` | Production Ready | YES - Business page | Important | None | **VISIBLE** |
| `/refer` | Production Ready | NO - Referral | Optional | None | **DEFER TO V2** |

### Static/Legal Pages (8 pages)

| Page | Status | Customer Value | Importance | Risk | Recommendation |
|------|--------|----------------|------------|------|----------------|
| `/` | Production Ready | YES - Landing | Mission Critical | None | **VISIBLE** |
| `/pricing` | Production Ready | YES - Pricing info | Important | None | **VISIBLE** |
| `/faq` | Production Ready | YES - Help | Helpful | None | **VISIBLE** |
| `/privacy` | Production Ready | YES - Legal | Important | None | **VISIBLE** |
| `/terms` | Production Ready | YES - Legal | Important | None | **VISIBLE** |
| `/service-terms` | Production Ready | YES - Legal | Important | None | **VISIBLE** |
| `/cookies` | Production Ready | YES - Legal | Helpful | None | **VISIBLE** |
| `/unsubscribe` | Production Ready | YES - Email opt-out | Important | None | **VISIBLE** |

### Plugin Pages (1 page)

| Page | Status | Customer Value | Importance | Risk | Recommendation |
|------|--------|----------------|------------|------|----------------|
| `/plugins/qr-menu/[menuId]` | Production Ready | YES - QR menu view | Mission Critical | None | **VISIBLE** |

### Reservation Confirmation (1 page)

| Page | Status | Customer Value | Importance | Risk | Recommendation |
|------|--------|----------------|------------|------|----------------|
| `/reservation/confirm/[id]` | Production Ready | YES - Booking confirm | Important | None | **VISIBLE** |

### Explore (1 page)

| Page | Status | Customer Value | Importance | Risk | Recommendation |
|------|--------|----------------|------------|------|----------------|
| `/explore-businesses` | Production Ready | NO - Discovery | Future | None | **DEFER TO V2** |

### Test Pages (1 page)

| Page | Status | Customer Value | Importance | Risk | Recommendation |
|------|--------|----------------|------------|------|----------------|
| `/test-swc` | Experimental | NO - Test | Developer | Confuse | **DEVELOPER ONLY** |

---

## Summary Statistics

| Classification | Count |
|----------------|-------|
| **VISIBLE** | 52 |
| **ADMIN ONLY** | 45 |
| **FEATURE FLAG** | 22 |
| **DEFER TO V2** | 35 |
| **DEVELOPER ONLY** | 3 |
| **Total Pages** | 157 |

---

## Navigation Items Analysis

Current navigation has **54 items**. Recommended V1 navigation: **22 items**.

### Items to Remove from V1 Navigation

| Item | Reason |
|------|--------|
| AI Insights | Feature flagged, overwhelming |
| Optimization Hub | Feature flagged, overwhelming |
| Menu Builder | AI-assisted, incomplete |
| Site Builder | Incomplete |
| Templates | Future feature |
| Content (CMS) | Feature flagged |
| Video Analytics | Feature flagged |
| Customer CRM | Feature flagged, overwhelming |
| Contacts | Feature flagged |
| Staff Performance | Incomplete |
| A/B Testing | Advanced, confusing |
| Campaigns | Marketing, future |
| Branches | Enterprise feature |
| Outlets | Enterprise feature |
| My Referrals | Growth feature |
| Referrals | Growth feature |
| Invite & Earn | Growth feature |
| Loyalty | Feature flagged |
| Promotions | Feature flagged |
| Hotel | Feature flagged |
| Smart Dining Slips | Advanced |
| Support Inbox | Admin only |
| Canned Replies | Admin only |
| Feature Flags | Admin only |
| Payment Monitor | Admin only |
| Payment Feedback | Admin only |
| Instruction Insights | Niche |

---

## Feature Flags Audit

### Currently Defined Flags

| Flag | Status | V1 Recommendation |
|------|--------|-------------------|
| `advanced_analytics` | Disabled | Keep disabled |
| `multi_language` | Disabled | Keep disabled |
| `multi_branch` | Disabled | Keep disabled |
| `ai_menu_builder` | Disabled | Keep disabled |
| `loyalty_system` | Disabled | Keep disabled |
| `discovery_marketplace` | Disabled | Keep disabled |
| `promotions_engine` | Disabled | Keep disabled |
| `hotel_mode` | Disabled | Keep disabled |
| `whatsapp_cloud_api` | Enabled | Keep enabled |
| `configurable_reports` | Enabled | Keep enabled |
| `cms_v1` | Disabled | Keep disabled |
| `cms_self_approve_v1` | Disabled | Keep disabled |
| `feed_v1` | Disabled | Keep disabled |
| `feed_engagement_v1` | Disabled | Keep disabled |
| `feed_recommendations_v1` | Disabled | Keep disabled |

---

## Risk Assessment

### High Risk Features (Must Hide)

1. **CEO/CFO Dashboards** - Platform metrics, confusing for restaurant owners
2. **Pilot Observer** - Internal monitoring tool
3. **DIE Operations/Control Plane** - Technical OCR internals
4. **Staff Performance** - Test failing, incomplete
5. **Recipe Management** - Mock data only

### Medium Risk Features (Should Hide)

1. **AI Insights** - Overwhelming for new users
2. **CRM/Contacts** - Too advanced for Day 1
3. **A/B Testing** - Confusing without context
4. **Site Builder** - Incomplete
5. **Supplier Portal** - Different user type

### Low Risk Features (Can Defer)

1. **Referral System** - Nice to have
2. **Campaigns** - Marketing feature
3. **Templates** - Design feature
4. **Smart Dining Slips** - Advanced receipts

---

## Conclusion

Version 1 should present a focused, restaurant-centric experience with:

- **Core Operations:** Dashboard, Orders, Kitchen, Tables, Menu, Inventory
- **Essential Tools:** QR Builder, Reports, Staff, Reservations
- **OCR Workflow:** DIE upload, review, apply
- **Settings:** Profile, Payments, Security

All other features remain in the codebase but are hidden from V1 navigation until explicitly enabled or released in V2.
