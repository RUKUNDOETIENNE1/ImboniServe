# Feature Visibility Matrix

**Date:** 2026-06-29
**Version:** ImboniServe V1 Release
**Purpose:** Classification of every feature by visibility tier

---

## Visibility Tiers

| Tier | Description | Access |
|------|-------------|--------|
| **VISIBLE** | Available to all restaurant users in V1 | Default navigation |
| **ADMIN** | Available only to platform administrators | Admin panel only |
| **FEATURE FLAG** | Architecturally ready but disabled until future release | Controlled by FeatureFlag table |
| **DEVELOPER** | Debug/test tools for development | Hidden, direct URL only |
| **V2** | Intentionally deferred to Version 2 | Not exposed |

---

## Tier 1: VISIBLE (Production V1)

### Core Restaurant Operations

| Feature | Path | Rationale |
|---------|------|-----------|
| Dashboard Home | `/dashboard` | Central command center |
| Unified Orders | `/dashboard/orders/unified` | Order management hub |
| New Sale | `/dashboard/sales/new` | POS entry point |
| Sales History | `/dashboard/sales` | Transaction records |
| Kitchen Display | `/dashboard/kitchen` | Real-time kitchen queue |
| Tables & Seats | `/dashboard/tables` | Table management |
| Seat Management | `/dashboard/tables/[id]/seats` | Per-table seating |
| Menu Editor | `/dashboard/menu/dynamic-edit` | Menu item management |
| Inventory | `/dashboard/inventory` | Stock tracking |
| Inventory Alerts | `/dashboard/inventory-alerts` | Low stock notifications |

### QR & Digital Ordering

| Feature | Path | Rationale |
|---------|------|-----------|
| QR Builder | `/dashboard/qr-builder` | Generate table QR codes |
| QR Analytics | `/dashboard/qr-analytics` | Scan tracking |
| QR Menu View | `/plugins/qr-menu/[menuId]` | Customer menu display |
| QR Entry | `/q/[token]` | Customer QR scan entry |
| Table Link | `/t/[id]` | Direct table access |
| Order Page | `/order` | Customer ordering |
| Checkout | `/order/checkout` | Customer checkout |
| Confirmation | `/order/confirmation` | Order confirmation |
| Pre-Order | `/pre-order` | Advance ordering |

### OCR & Document Intelligence

| Feature | Path | Rationale |
|---------|------|-----------|
| DIE Dashboard | `/dashboard/die` | Document upload & list |
| Document Review | `/dashboard/die/review/[id]` | Review extractions |
| DIE Overview | `/dashboard/die/overview` | Processing summary |

### Reports & Analytics

| Feature | Path | Rationale |
|---------|------|-----------|
| Reports | `/dashboard/reports` | Daily/weekly/monthly reports |
| Menu Performance | `/dashboard/analytics/menu-performance` | Item-level insights |
| Peak Hours | `/dashboard/analytics/peak-hours` | Timing analysis |
| Payment Analytics | `/dashboard/analytics/payments` | Payment breakdown |

### Staff & Operations

| Feature | Path | Rationale |
|---------|------|-----------|
| Staff Management | `/dashboard/staff` | Team management |
| Reservations | `/dashboard/reservations` | Booking management |
| Reservation Confirm | `/reservation/confirm/[id]` | Customer confirmation |

### Settings & Configuration

| Feature | Path | Rationale |
|---------|------|-----------|
| Settings | `/dashboard/settings` | Business configuration |
| Profile | `/dashboard/profile` | Business profile |
| Security | `/dashboard/security` | Security settings |
| Currency Settings | `/dashboard/currency-settings` | Currency configuration |
| Payment Settings | `/dashboard/payment-settings` | Payment configuration |
| Notifications | `/dashboard/notifications` | Alert preferences |

### Financial

| Feature | Path | Rationale |
|---------|------|-----------|
| Transactions | `/dashboard/transactions` | Payment history |
| Payout Summary | `/dashboard/payout-summary` | Earnings overview |
| Billing | `/billing` | Subscription management |

### Authentication & Onboarding

| Feature | Path | Rationale |
|---------|------|-----------|
| Login | `/login` | User authentication |
| Signup | `/signup` | New registration |
| Forgot Password | `/forgot-password` | Password recovery |
| Reset Password | `/reset-password` | Password reset |
| Setup Wizard | `/setup` | Onboarding flow |
| Business Page | `/business/[id]` | Public business view |

### Public Pages

| Feature | Path | Rationale |
|---------|------|-----------|
| Landing Page | `/` | Marketing homepage |
| Pricing | `/pricing` | Plan information |
| FAQ | `/faq` | Help center |
| Privacy Policy | `/privacy` | Legal requirement |
| Terms of Service | `/terms` | Legal requirement |
| Service Terms | `/service-terms` | Legal requirement |
| Cookie Policy | `/cookies` | Legal requirement |
| Unsubscribe | `/unsubscribe` | Email opt-out |

---

## Tier 2: ADMIN (Platform Administration)

### Platform Management

| Feature | Path | Rationale |
|---------|------|-----------|
| Admin Overview | `/admin` | Platform dashboard |
| Restaurants | `/admin/restaurants` | Business management |
| Users | `/admin/users` | User management |
| Contacts | `/admin/contacts` | Lead management |
| Subscriptions | `/admin/subscriptions` | Subscription management |
| Affiliates | `/admin/affiliates` | Affiliate program |
| Marketplace | `/admin/marketplace` | Supplier marketplace |
| Analytics | `/admin/analytics` | Platform analytics |
| Reports | `/admin/reports` | Platform reports |
| Feature Flags | `/admin/feature-flags` | Feature control |
| Fee Settings | `/admin/fee-settings` | Platform fees |
| Platform Fees | `/admin/platform-fees` | Fee configuration |
| Payout Control | `/admin/payout-control` | Payout management |
| Reconciliation | `/admin/reconciliation` | Payment reconciliation |
| Revenue Analytics | `/admin/revenue-analytics` | Revenue tracking |
| Sales Pipeline | `/admin/sales-pipeline` | Sales tracking |
| Leads | `/admin/leads` | Demo requests |
| Newsletter | `/admin/newsletter` | Email campaigns |
| AI Monitoring | `/admin/ai-monitoring` | AI usage tracking |
| Trial Eligibility | `/admin/trial-eligibility` | Trial management |
| Finance Revenue | `/admin/finance/revenue` | Revenue details |
| Finance Vendors | `/admin/finance/vendors` | Vendor management |
| Payment Operations | `/admin/payments/operations` | Payment ops |
| Webhook Details | `/admin/payments/webhook/[id]` | Webhook inspection |

### Dashboard Admin Features

| Feature | Path | Rationale |
|---------|------|-----------|
| Dashboard Feature Flags | `/dashboard/admin/feature-flags` | Business-level flags |
| CEO Dashboard | `/dashboard/ceo` | Platform metrics |
| CFO Dashboard | `/dashboard/cfo` | Financial metrics |
| CFO Components | `/dashboard/cfo-power-components` | CFO UI components |
| Pilot Observer | `/dashboard/pilot-observer` | Adoption metrics |
| Payment Monitor | `/dashboard/payments/monitor` | Payment health |
| Payment Feedback | `/dashboard/feedback/payments` | Payment issues |
| Support Inbox | `/dashboard/support/inbox` | Support tickets |
| Canned Replies | `/dashboard/support/canned-replies` | Reply templates |
| Instruction Insights | `/dashboard/analytics/instruction-insights` | Order instructions |

### DIE Admin Features

| Feature | Path | Rationale |
|---------|------|-----------|
| DIE Operations | `/dashboard/die/operations` | Processing queue |
| DIE Analytics | `/dashboard/die/analytics` | OCR metrics |
| DIE Anomalies | `/dashboard/die/anomalies` | Cost anomalies |
| DIE Reconciliation | `/dashboard/die/reconciliation` | Inventory reconciliation |
| DIE Control Plane | `/dashboard/die/control-plane` | System control |
| DIE Plugins | `/dashboard/die/plugins` | Plugin management |

---

## Tier 3: FEATURE FLAG (Controlled Rollout)

### Advanced Analytics

| Feature | Path | Flag | Rationale |
|---------|------|------|-----------|
| Advanced Analytics | `/dashboard/analytics` | `advanced_analytics` | Requires 10 active clients |

### CRM & Customer Management

| Feature | Path | Flag | Rationale |
|---------|------|------|-----------|
| Customer CRM | `/dashboard/crm` | `crm_v1` (proposed) | Advanced feature |
| Contacts | `/dashboard/contacts` | `crm_v1` (proposed) | CRM dependency |
| Contact Import | `/dashboard/contacts/import` | `crm_v1` (proposed) | CRM dependency |
| New Contact | `/dashboard/contacts/new` | `crm_v1` (proposed) | CRM dependency |
| Customer Detail | `/dashboard/customers/[id]` | `crm_v1` (proposed) | CRM dependency |
| Customer Feedback | `/dashboard/customer-feedback` | `crm_v1` (proposed) | CRM dependency |

### Loyalty & Promotions

| Feature | Path | Flag | Rationale |
|---------|------|------|-----------|
| Loyalty Program | `/dashboard/loyalty` | `loyalty_system` | Plan-gated |
| Promotions | `/dashboard/promotions` | `promotions_engine` | Plan-gated |

### Multi-Location

| Feature | Path | Flag | Rationale |
|---------|------|------|-----------|
| Branches | `/dashboard/branches` | `multi_branch` | Enterprise feature |
| Outlets | `/dashboard/outlets` | `multi_branch` | Enterprise feature |

### Hotel Mode

| Feature | Path | Flag | Rationale |
|---------|------|------|-----------|
| Hotel Dashboard | `/dashboard/hotel` | `hotel_mode` | Vertical-specific |

### Content Management

| Feature | Path | Flag | Rationale |
|---------|------|------|-----------|
| CMS Dashboard | `/dashboard/cms` | `cms_v1` | Content feature |
| CMS Editor | `/dashboard/cms/[id]` | `cms_v1` | Content feature |
| CMS New | `/dashboard/cms/new` | `cms_v1` | Content feature |
| CMS Settings | `/dashboard/cms/settings` | `cms_v1` | Content feature |
| Video Analytics | `/dashboard/video-analytics` | `cms_v1` | Content feature |

### AI Features

| Feature | Path | Flag | Rationale |
|---------|------|------|-----------|
| AI Insights | `/dashboard/ai` | `ai_insights_v1` (proposed) | AI feature |
| Optimization Hub | `/dashboard/optimization` | `ai_insights_v1` (proposed) | AI feature |
| Menu Builder | `/dashboard/menu-builder` | `ai_menu_builder` | AI-assisted |

### Discovery

| Feature | Path | Flag | Rationale |
|---------|------|------|-----------|
| Discover | `/discover` | `discovery_marketplace` | Consumer feature |
| Discover Detail | `/discover/[slug]` | `discovery_marketplace` | Consumer feature |
| Discover Feed | `/discover/feed` | `feed_v1` | Feed feature |
| Discover Map | `/discover/map` | `discovery_marketplace` | Consumer feature |

---

## Tier 4: DEVELOPER (Debug Tools)

| Feature | Path | Rationale |
|---------|------|-----------|
| Diagnostics | `/dashboard/diagnostics` | System health checks |
| Test Minimal | `/dashboard/test-minimal` | Minimal test page |
| Test SWC | `/test-swc` | Compiler test |

---

## Tier 5: V2 (Deferred Features)

### Marketing & Growth

| Feature | Path | Rationale |
|---------|------|-----------|
| Campaigns | `/dashboard/campaigns` | Marketing automation |
| Marketer | `/dashboard/marketer` | Marketing dashboard |
| Referrals | `/dashboard/referrals` | Referral program |
| My Referrals | `/dashboard/my-referrals` | User referrals |
| Invite & Earn | `/dashboard/invite` | Referral incentives |
| Refer | `/refer` | Referral landing |

### Advanced Operations

| Feature | Path | Rationale |
|---------|------|-----------|
| Stations | `/dashboard/stations` | Kitchen stations |
| A/B Testing | `/dashboard/ab-testing` | Menu experiments |
| Auto Reorder | `/dashboard/auto-reorder` | Inventory automation |
| Advanced Reporting | `/dashboard/advanced-reporting` | Enterprise reports |
| Staff Performance | `/dashboard/staff-performance` | Performance metrics |
| Smart Dining Slips | `/dashboard/smart-dining-slips` | Advanced receipts |
| Recipe Management | `/dashboard/recipe-management` | Recipe costing |

### Website & Design

| Feature | Path | Rationale |
|---------|------|-----------|
| Site Builder | `/dashboard/site-builder` | Website builder |
| Templates | `/dashboard/templates` | Design templates |

### Supplier & Marketplace

| Feature | Path | Rationale |
|---------|------|-----------|
| Supplier Portal | `/dashboard/supplier-portal` | Supplier view |
| Supplier Dashboard | `/supplier` | Supplier home |
| Supplier Login | `/supplier/login` | Supplier auth |
| Supplier Orders | `/supplier/orders` | Supplier orders |
| Supplier Products | `/supplier/products` | Supplier catalog |
| Supplier Deliveries | `/supplier/deliveries` | Delivery tracking |
| Supplier Payments | `/supplier/payments` | Supplier payments |
| Store | `/store` | Marketplace |
| Store Cart | `/store/cart` | Shopping cart |
| Store Checkout | `/store/checkout` | Marketplace checkout |
| Store Orders | `/store/orders` | Order history |
| Store Confirmation | `/store/order-confirmation` | Order confirmation |
| Store Payments | `/store/payments` | Payment history |
| Store Payment | `/store/payment/[id]` | Payment detail |
| Store Supplier | `/store/supplier/[id]` | Supplier profile |

### Affiliate Program

| Feature | Path | Rationale |
|---------|------|-----------|
| Affiliate Home | `/affiliate` | Affiliate landing |
| Affiliate Dashboard | `/affiliate/dashboard` | Affiliate metrics |
| Affiliate Program | `/affiliate/program` | Program details |

### Other

| Feature | Path | Rationale |
|---------|------|-----------|
| Tablet Ordering | `/dashboard/tablet-ordering` | Tablet mode |
| DIE Marketplace | `/dashboard/die/marketplace` | Plugin marketplace |
| Explore Businesses | `/explore-businesses` | Business discovery |
| KDS | `/dashboard/kds` | Duplicate of kitchen |

---

## Implementation Notes

### No Code Changes Required

This matrix is a **classification document only**. Implementation of visibility changes will occur in a separate phase after approval.

### Proposed Implementation Approach

1. **Navigation Filtering:** Add `visibleInV1: boolean` to navigation items
2. **Route Guards:** Add middleware to check visibility tier
3. **Feature Flags:** Use existing `FeatureFlagService` for controlled features
4. **Role-Based Access:** Use existing role system for admin features

### Backward Compatibility

All features remain in the codebase. No deletions. Only visibility changes.

---

## Summary

| Tier | Count | Percentage |
|------|-------|------------|
| VISIBLE | 52 | 33% |
| ADMIN | 45 | 29% |
| FEATURE FLAG | 22 | 14% |
| DEVELOPER | 3 | 2% |
| V2 | 35 | 22% |
| **Total** | **157** | **100%** |

---

## Approval

This matrix requires explicit approval before any implementation begins.

| Role | Status | Date |
|------|--------|------|
| Chief Product Officer | PENDING | - |
| Senior Hospitality Product Manager | PENDING | - |
| Restaurant Operations Consultant | PENDING | - |
