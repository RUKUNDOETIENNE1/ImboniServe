# Product Value Gap Report
## ImboniServe — Dashboard Capabilities vs. Public-Facing Communication

**Audit Date:** 2025
**Scope:** Full comparison of production-ready dashboard capabilities against public website messaging

---

## Executive Summary

ImboniServe's dashboard contains **74 pages** spanning operations, analytics, AI, finance, marketing, and infrastructure. The public-facing website (homepage + pricing + FAQ + discover + order + referral + affiliate) communicates approximately **65%** of the platform's capabilities. The remaining **35%** represents production-ready features that could drive signups and differentiation but are currently invisible to prospective customers.

**Critical finding:** Several high-value features that would appeal to enterprise and multi-branch customers — CFO/CEO dashboards, hotel management, site builder, recipe management, staff performance analytics, payment monitoring — are completely absent from public messaging.

---

## 1. Complete Dashboard Capability Inventory (74 Pages)

### Operations (17 pages)
| Page | Capability | Public Visibility |
|------|-----------|-------------------|
| `dashboard/index` | Overview dashboard with KPIs, charts, recent orders | ✅ Mentioned |
| `dashboard/kitchen` | Kitchen Display System (KDS) — real-time order status | ✅ Pricing features |
| `dashboard/kds` | KDS alternative/advanced view | ⚠️ Not separately mentioned |
| `dashboard/waiter` | Waiter operational queue — pickup/delivery tracking | ❌ Not mentioned |
| `dashboard/orders/unified` | Unified orders (dine-in, takeaway, delivery) | ✅ Homepage carousel |
| `dashboard/tables` | Table & section management | ✅ Homepage carousel |
| `dashboard/tables/[id]/seats` | Seat-level management | ❌ Not mentioned |
| `dashboard/stations` | Kitchen station configuration | ❌ Not mentioned |
| `dashboard/reservations` | Reservations with deposits & confirmations | ✅ Homepage carousel |
| `dashboard/sales/index` | POS sales interface | ⚠️ Generic "POS" mention only |
| `dashboard/sales/new` | New POS sale | ⚠️ Generic "POS" mention only |
| `dashboard/tablet-ordering` | Tablet-based ordering | ❌ Not mentioned |
| `dashboard/close-day` | Z-Report / end-of-day reconciliation | ⚠️ Implied via "reports" |
| `dashboard/operations/service-replay` | Service replay for operations review | ❌ Not mentioned |
| `dashboard/hotel` | Hotel-specific management | ❌ Not mentioned |
| `dashboard/smart-dining-slips` | Digital receipt generation | ✅ Features section |
| `dashboard/dynamic-edit` | Dynamic menu editing | ❌ Not mentioned |

### Menu & Inventory (8 pages)
| Page | Capability | Public Visibility |
|------|-----------|-------------------|
| `dashboard/menu/index` | Menu management | ✅ How It Works |
| `dashboard/menu-builder` | AI Menu Builder (photo/PDF → menu) | ✅ Advanced features |
| `dashboard/inventory` | Inventory & procurement management | ✅ Features section |
| `dashboard/inventory-alerts` | Low-stock push alerts | ✅ Features + growth carousel |
| `dashboard/auto-reorder` | AI-powered auto-reorder suggestions | ✅ Advanced features |
| `dashboard/recipe-management` | Recipe & ingredient management | ❌ Not mentioned |
| `dashboard/templates` | Menu/item templates | ❌ Not mentioned |
| `dashboard/promotions` | Promotions & happy hours | ✅ Features section |

### Analytics & Intelligence (11 pages)
| Page | Capability | Public Visibility |
|------|-----------|-------------------|
| `dashboard/analytics` | Analytics overview | ✅ Features section |
| `dashboard/analytics/menu-performance` | Menu item performance | ✅ Pricing features |
| `dashboard/analytics/payments` | Payment analytics & fee savings | ✅ Pricing features |
| `dashboard/analytics/peak-hours` | Peak hours & demand patterns | ✅ Homepage carousel |
| `dashboard/analytics/instruction-insights` | Order instruction analytics | ❌ Not mentioned |
| `dashboard/advanced-reporting` | Advanced reports & analytics | ⚠️ Generic "reports" only |
| `dashboard/optimization` | AI Optimization Hub | ✅ Pricing features |
| `dashboard/ai` | AI capabilities (voice ordering, etc.) | ✅ Growth carousel |
| `dashboard/video-analytics` | Video-based analytics | ❌ Not mentioned |
| `dashboard/ab-testing` | Menu A/B testing | ✅ Growth carousel |
| `dashboard/staff-performance` | Staff performance analytics | ❌ Not mentioned |

### Finance & Payments (8 pages)
| Page | Capability | Public Visibility |
|------|-----------|-------------------|
| `dashboard/payout-summary` | Payout summary & commission breakdown | ✅ Pricing features |
| `dashboard/payments/monitor` | Real-time payment monitoring | ❌ Not mentioned |
| `dashboard/payment-settings` | Payment configuration (VAT, currency, split) | ⚠️ Implied |
| `dashboard/transactions` | Transaction management | ❌ Not mentioned |
| `dashboard/cfo` | CFO financial intelligence dashboard | ❌ Not mentioned |
| `dashboard/cfo-power-components` | CFO advanced components | ❌ Not mentioned |
| `dashboard/ceo` | CEO executive dashboard | ❌ Not mentioned |
| `dashboard/currency-settings` | Multi-currency configuration | ❌ Not mentioned |

### Customer & Marketing (10 pages)
| Page | Capability | Public Visibility |
|------|-----------|-------------------|
| `dashboard/crm` | Customer CRM with RFM segmentation | ✅ Growth carousel |
| `dashboard/customers/[id]` | Customer detail view | ⚠️ Implied via CRM |
| `dashboard/campaigns` | WhatsApp marketing campaigns | ✅ Growth carousel |
| `dashboard/loyalty` | Loyalty & rewards program | ✅ Features section |
| `dashboard/contacts` | Contact management | ❌ Not mentioned |
| `dashboard/contacts/import` | Bulk contact import | ❌ Not mentioned |
| `dashboard/contacts/new` | New contact creation | ❌ Not mentioned |
| `dashboard/customer-feedback` | Customer feedback management | ❌ Not mentioned |
| `dashboard/referrals` | Referral management | ✅ Advanced features |
| `dashboard/my-referrals` | Personal referral tracking | ⚠️ Implied |

### Infrastructure & Content (12 pages)
| Page | Capability | Public Visibility |
|------|-----------|-------------------|
| `dashboard/branches` | Multi-branch management | ✅ Features section |
| `dashboard/outlets` | Outlet management | ❌ Not mentioned |
| `dashboard/staff` | Staff management & roles | ✅ Advanced features |
| `dashboard/invite` | Staff invitations | ⚠️ Implied via staff |
| `dashboard/profile` | Business profile | ⚠️ Implied |
| `dashboard/settings` | General settings | ⚠️ Implied |
| `dashboard/security` | Security settings | ❌ Not mentioned |
| `dashboard/notifications` | Notification center | ❌ Not mentioned |
| `dashboard/site-builder` | Website builder for businesses | ❌ Not mentioned |
| `dashboard/cms/index` | CMS page listing | ❌ Not mentioned |
| `dashboard/cms/[id]` | CMS page editor | ❌ Not mentioned |
| `dashboard/cms/new` | New CMS page | ❌ Not mentioned |
| `dashboard/cms/settings` | CMS settings | ❌ Not mentioned |

### Supplier & Marketplace (5 pages)
| Page | Capability | Public Visibility |
|------|-----------|-------------------|
| `dashboard/supplier-portal` | Supplier portal | ⚠️ "Coming Soon" |
| `store/index` | Supplier marketplace | ⚠️ "Coming Soon" |
| `store/cart` | Marketplace cart | ⚠️ "Coming Soon" |
| `store/checkout` | Marketplace checkout | ⚠️ "Coming Soon" |
| `store/supplier/[id]` | Supplier detail | ⚠️ "Coming Soon" |

### Platform / Internal (10 pages)
| Page | Capability | Public Visibility |
|------|-----------|-------------------|
| `dashboard/diagnostics` | System diagnostics | N/A (internal) |
| `dashboard/die/*` | Digital Infrastructure Engine | N/A (internal) |
| `dashboard/pilot-observer` | Pilot observer mode | N/A (internal) |
| `dashboard/admin/feature-flags` | Feature flag management | N/A (internal) |
| `dashboard/support/inbox` | Support inbox | N/A (internal) |
| `dashboard/support/canned-replies` | Canned replies | N/A (internal) |
| `dashboard/marketer` | Marketer intelligence dashboard | ❌ Not mentioned |

---

## 2. Critical Gaps — High-Value Features Not Promoted

### Tier 1: Would Drive Enterprise Signups

| Feature | Dashboard Location | Why It Matters |
|---------|-------------------|----------------|
| **CFO Dashboard** | `dashboard/cfo` | Financial intelligence is a top buying criterion for multi-branch operators. Competitors charge extra for this. |
| **CEO Dashboard** | `dashboard/ceo` | Executive-level overview demonstrates platform maturity. Enterprise buyers expect this. |
| **Hotel Management** | `dashboard/hotel` | Hotel-specific features open an entirely separate market segment. Homepage mentions "hotel" as a target but never explains hotel capabilities. |
| **Site Builder** | `dashboard/site-builder` | Businesses can build their own website — a massive value-add that eliminates a separate Wix/Squarespace subscription. |
| **Recipe Management** | `dashboard/recipe-management` | Recipe-level ingredient tracking is the foundation of accurate food costing — a key trust message already on the homepage. |

### Tier 2: Would Differentiate from Competitors

| Feature | Dashboard Location | Why It Matters |
|---------|-------------------|----------------|
| **Staff Performance Analytics** | `dashboard/staff-performance` | HR insights for hospitality are rare. Shows operational depth. |
| **Payment Monitor** | `dashboard/payments/monitor` | Real-time payment tracking builds trust in the payment system. |
| **Tablet Ordering** | `dashboard/tablet-ordering` | Alternative to QR-only; some venues prefer tablets. Shows flexibility. |
| **Customer Feedback System** | `dashboard/customer-feedback` | Closed-loop feedback management demonstrates customer-centricity. |
| **Marketer Dashboard** | `dashboard/marketer` | Marketing intelligence alongside operations is a unique proposition. |
| **Advanced Reporting** | `dashboard/advanced-reporting` | Beyond "daily/weekly/monthly" — custom reporting is enterprise-grade. |
| **CMS / Site Builder** | `dashboard/cms/*` | Content management for the discovery feed and custom pages. |

### Tier 3: Would Add Depth to Existing Messaging

| Feature | Dashboard Location | Why It Matters |
|---------|-------------------|----------------|
| **Waiter Dashboard** | `dashboard/waiter` | Real-time waiter queue is operational depth beyond "POS." |
| **Stations Management** | `dashboard/stations` | Kitchen station routing shows operational sophistication. |
| **Seat-Level Management** | `dashboard/tables/[id]/seats` | Granular seating control for larger venues. |
| **Multi-Currency** | `dashboard/currency-settings` | Important for cross-border hospitality businesses. |
| **Contacts Management** | `dashboard/contacts` | Contact database for CRM campaigns. |
| **Outlets** | `dashboard/outlets` | Sub-branch outlet management for complex operations. |
| **Transactions** | `dashboard/transactions` | Detailed transaction ledger. |
| **Security Settings** | `dashboard/security` | Security configuration builds enterprise trust. |

---

## 3. Public-Facing Pages Inventory

### Marketing Pages
| Page | Purpose | Status |
|------|---------|--------|
| `/` (index) | Homepage with 11 sections | ✅ Comprehensive |
| `/pricing` | Full pricing with 5 plans | ✅ Complete |
| `/faq` | Payment fee FAQ | ✅ Focused on fees only |
| `/terms` | Terms & conditions | ✅ Legal |
| `/privacy` | Privacy policy | ✅ Legal |
| `/cookies` | Cookie policy | ✅ Legal |
| `/service-terms` | Service terms | ✅ Legal |

### Customer Acquisition
| Page | Purpose | Status |
|------|---------|--------|
| `/signup` | Business registration | ✅ Complete |
| `/login` | Login with MFA/OTP | ✅ Complete |
| `/setup` | Post-signup setup wizard | ✅ Complete |
| `/billing` | Billing management | ✅ Exists |

### Discovery & Ordering
| Page | Purpose | Status |
|------|---------|--------|
| `/discover` | Business directory | ✅ Functional |
| `/discover/[slug]` | Business profile page | ✅ Functional |
| `/discover/feed` | Social-style discovery feed | ✅ Functional |
| `/discover/map` | Nearby businesses map | ✅ Functional |
| `/order` | QR-based customer ordering | ✅ Functional |
| `/order/checkout` | Order checkout | ✅ Functional |
| `/order/confirmation` | Order confirmation | ✅ Functional |
| `/pre-order` | Pre-order page | ✅ Functional |
| `/q/[token]` | QR token redirect | ✅ Functional |
| `/t/[id]` | Table QR redirect | ✅ Functional |

### Referral & Affiliate
| Page | Purpose | Status |
|------|---------|--------|
| `/refer` | Customer referral program | ✅ Functional |
| `/affiliate` | B2B affiliate dashboard | ✅ Functional |
| `/affiliate/program` | Affiliate program info | ✅ Functional |

### Supplier
| Page | Purpose | Status |
|------|---------|--------|
| `/supplier` | Supplier portal | ✅ Functional |
| `/supplier/login` | Supplier login | ✅ Functional |
| `/store` | Marketplace store | ✅ Functional |

---

## 4. Public Homepage Section Analysis

The homepage (`/`) contains these sections in order:

1. **Hero Carousel** (4 slides) — OS positioning, QR ordering, smart analytics, all-in-one
2. **Real-Time OS Carousel** (5 slides) — Live sales, QR performance, tables, peak hours, unified orders
3. **Supplier Marketplace** — "Coming Soon" badge
4. **Video Demo** — YouTube link
5. **How It Works** (6 steps) — Account → Menu → Tables/QR → WhatsApp/Payments → Inventory → Go Live
6. **Stats** — 14 days trial, no card, 5 plans, 30+ features
7. **Features Grid** (12 items) — QR, inventory, reports, AI, discovery, slips, loyalty, promotions, WhatsApp, mobile money, multi-branch, roles
8. **Pricing Preview** — Starting price, all-plans-include, founding program note
9. **Product Trust** (6 items) — Auditable inventory, food costs, role protection, integrated ops, global platform, AI on real data
10. **Founding Program** — 50% lifetime discount, founder support, early access, shape development
11. **Advanced Features** (6 items) — AI menu builder, discovery, referrals, staff & roles, auto-reorder, smart slips
12. **Discovery Marketplace** — Browse marketplace / claim listing
13. **Payment Methods** — MTN MoMo, Airtel Money, Cash, IremboPay
14. **Final CTA** — Start free trial / WhatsApp

### What's Working Well
- Hero messaging is strong and clear
- Real-time OS carousel effectively showcases live capabilities
- Growth carousel covers CRM, campaigns, A/B testing, voice ordering, alerts, reservations
- Pricing page is comprehensive with 5 tiers
- Discovery marketplace is well-promoted
- Founding program creates urgency

### What's Missing from Homepage
- No mention of CFO/CEO/Marketer dashboards
- No mention of hotel-specific capabilities
- No mention of site builder / CMS
- No mention of recipe management / food cost accuracy (despite "accurate food costs" trust message)
- No mention of staff performance analytics
- No mention of payment monitoring
- No mention of tablet ordering
- No mention of customer feedback system
- No mention of advanced reporting beyond "daily/weekly/monthly"
- No mention of waiter dashboard (only generic "POS")
- No mention of stations / kitchen routing
- No mention of multi-currency support
- No mention of security features
- FAQ page only covers payment fees — no product FAQ

---

## 5. Pricing Plan Gap Analysis

The pricing config (`src/config/pricing.ts`) defines 5 plans. Here's what's advertised vs. what exists:

### Features Listed in Plans but NOT Promoted on Homepage
| Plan Feature | Dashboard Page | Homepage Mention |
|-------------|---------------|-----------------|
| Kitchen Display System (KDS) | `dashboard/kitchen` | ❌ Not in features grid |
| KDS Advanced (course firing, expo mode) | `dashboard/kds` | ❌ Not mentioned |
| Inventory auto-reorder | `dashboard/auto-reorder` | ✅ Advanced features |
| AI draft purchase orders | `dashboard/auto-reorder` | ⚠️ Implied |
| Optimization hub | `dashboard/optimization` | ✅ Pricing features only |
| Advanced reports & analytics | `dashboard/advanced-reporting` | ⚠️ Generic |
| Revenue intelligence | `dashboard/cfo` | ❌ Not mentioned |
| Payout reconciliation | `dashboard/payout-summary` | ⚠️ Pricing features only |
| Payment analytics pro | `dashboard/analytics/payments` | ⚠️ Pricing features only |
| QR analytics deep-dive | `dashboard/qr-analytics` | ⚠️ Homepage carousel only |
| Delivery confirmation | `dashboard/waiter` | ❌ Not mentioned |
| Discovery (featured listing) | `discover/*` | ✅ Discovery section |

### Features That Exist in Dashboard but Aren't in ANY Pricing Plan
- CFO Dashboard (`dashboard/cfo`)
- CEO Dashboard (`dashboard/ceo`)
- Marketer Dashboard (`dashboard/marketer`)
- Hotel Management (`dashboard/hotel`)
- Site Builder (`dashboard/site-builder`)
- CMS (`dashboard/cms/*`)
- Recipe Management (`dashboard/recipe-management`)
- Staff Performance Analytics (`dashboard/staff-performance`)
- Tablet Ordering (`dashboard/tablet-ordering`)
- Customer Feedback (`dashboard/customer-feedback`)
- Video Analytics (`dashboard/video-analytics`)
- Stations Management (`dashboard/stations`)
- Security Settings (`dashboard/security`)
- Contacts Management (`dashboard/contacts`)
- Multi-Currency (`dashboard/currency-settings`)

---

## 6. Summary of Gaps by Priority

### Immediate Action Required (Tier 1)
1. **CFO/CEO Dashboards** — Add to homepage, pricing page, and enterprise messaging
2. **Hotel Management** — Create dedicated section or page for hotel capabilities
3. **Site Builder** — Promote as a value-add that eliminates separate website costs
4. **Recipe Management** — Connect to existing "accurate food costs" trust message

### High Priority (Tier 2)
5. **Staff Performance Analytics** — Add to growth or operations section
6. **Payment Monitor** — Add to real-time OS carousel or trust section
7. **Tablet Ordering** — Add as alternative to QR ordering
8. **Customer Feedback** — Add to customer/growth section
9. **Marketer Dashboard** — Add to growth section
10. **Advanced Reporting** — Expand "reports" messaging beyond basic

### Medium Priority (Tier 3)
11. **Waiter Dashboard** — Expand POS messaging to include waiter workflow
12. **Stations Management** — Add to kitchen/operations section
13. **Multi-Currency** — Add to "global platform" trust message
14. **Security Settings** — Add to trust/enterprise section
15. **Contacts Management** — Add to CRM/marketing section
16. **FAQ Expansion** — Add product FAQ beyond payment fees

### Lower Priority (Internal/Utility)
17. Outlets management
18. Seat-level management
19. Transactions ledger
20. Notifications center
21. Templates
22. Dynamic menu editing

---

## 7. Recommendations

1. **Add a "Platform" or "Capabilities" page** that comprehensively lists all features organized by category, so nothing is hidden
2. **Expand the FAQ** to cover product capabilities, not just payment fees
3. **Add hotel-specific messaging** — the homepage mentions "hotel" as a target but never explains hotel capabilities
4. **Create an enterprise section** highlighting CFO/CEO dashboards, advanced reporting, security, and audit features
5. **Promote the site builder** as a differentiator — "your website + your POS + your inventory, all in one"
6. **Connect recipe management to the food cost trust message** — "accurate food costs" is already a headline; explain HOW
7. **Add staff performance to the growth carousel** — it's a natural fit alongside CRM and campaigns
8. **Update pricing plan features** to include newly identified capabilities (CFO, hotel, site builder, etc.)
9. **Consider a "vs. competitors" comparison** — the depth of features (74 dashboard pages) is a strong differentiator
10. **Add real screenshots/demos** of key dashboards (CFO, KDS, waiter, optimization) to the homepage or a features page
