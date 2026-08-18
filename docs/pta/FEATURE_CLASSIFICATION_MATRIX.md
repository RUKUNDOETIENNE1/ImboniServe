# Feature Classification Matrix

**Platform:** ImboniServe  
**Date:** July 26, 2026  
**Audit:** Product Truth Audit (PTA)  

---

## Classification Legend

| Category | Symbol | Meaning |
|----------|--------|---------|
| A | ✅ | Production Ready — fully implemented, verified, available immediately |
| B | 🟢 | Production Ready (Minor Polish) — works, minor improvements remain |
| C | 🟡 | Beta / Limited Access — exists, requires manual config or incomplete |
| D | 🔵 | Roadmap — architecture exists, implementation incomplete |
| E | 🔴 | Remove — does not exist, abandoned, or misleading |

---

## Core Operations

| # | Feature | Where Advertised | Exists? | Usable Today? | Verified? | Category | Recommendation |
|---|---------|-----------------|---------|---------------|-----------|----------|----------------|
| 1 | QR Code Ordering | Homepage, Features, Pricing | Yes | Yes — scan, browse, order | Platform + IOS | ✅ A | Keep |
| 2 | Unified Orders (Dine-in, Takeaway, Delivery) | Homepage RT carousel | Yes | Yes — `/dashboard/orders/unified` | Platform + IOS | ✅ A | Keep |
| 3 | Kitchen Display | Dashboard sidebar | Yes | Yes — `/dashboard/kitchen` | Platform + IOS | ✅ A | Keep |
| 4 | Tables Management | Homepage RT carousel, Sidebar | Yes | Yes — `/dashboard/tables` | Platform + IOS | ✅ A | Keep |
| 5 | Reservations | Homepage growth carousel, Sidebar | Yes | Yes (without deposits) — `/dashboard/reservations` | Platform + IOS | ✅ A | Keep — remove "deposits" claim |
| 6 | Waiter Station | Sidebar | Yes | Yes — `/dashboard/waiter` | Platform + IOS | ✅ A | Keep |
| 7 | Service Replay | Sidebar | Yes | Yes — `/dashboard/operations/service-replay` | Platform | ✅ A | Keep |

## Menu & Inventory

| # | Feature | Where Advertised | Exists? | Usable Today? | Verified? | Category | Recommendation |
|---|---------|-----------------|---------|---------------|-----------|----------|----------------|
| 8 | Menu Management | Sidebar | Yes | Yes — `/dashboard/menu` | Platform + IOS | ✅ A | Keep |
| 9 | Inventory Tracking | Homepage, Features, Pricing | Yes | Yes — `/dashboard/inventory` with reorderLevel | Platform + IOS + ORRS | ✅ A | Keep |
| 10 | Inventory Alerts | Homepage growth carousel, Sidebar | Yes | Yes — `/dashboard/inventory-alerts` with LOW/MEDIUM/HIGH/CRITICAL | Platform + IOS + ORRS | ✅ A | Keep |
| 11 | OCR Documents | Sidebar | Yes | Yes — `/dashboard/die` | Platform | ✅ A | Keep |
| 12 | Auto-Reorder (AI) | Pricing (Premium) | Yes | Yes — `ReorderAutopilotService` with draft PO generation | ORRS | ✅ A | Keep |
| 13 | Recipe Management with Costing | Pricing (Premium) | Partial | Page exists but not verified | None | 🟡 C | Relabel as "Early Access" |

## QR & Digital

| # | Feature | Where Advertised | Exists? | Usable Today? | Verified? | Category | Recommendation |
|---|---------|-----------------|---------|---------------|-----------|----------|----------------|
| 14 | QR Builder | Sidebar | Yes | Yes — `/dashboard/qr-builder` | Platform + IOS | ✅ A | Keep |
| 15 | QR Analytics | Sidebar, Homepage RT carousel | Yes | Yes — `/dashboard/qr-analytics` | Platform | ✅ A | Keep |

## Reports

| # | Feature | Where Advertised | Exists? | Usable Today? | Verified? | Category | Recommendation |
|---|---------|-----------------|---------|---------------|-----------|----------|----------------|
| 16 | Reports & Analytics | Homepage, Features, Pricing, Sidebar | Yes | Yes — `/dashboard/reports` | Platform + IOS | ✅ A | Keep |
| 17 | Close Day / Z-Report | Sidebar | Yes | Yes — `/dashboard/close-day` | Platform + IOS | ✅ A | Keep |
| 18 | Menu Performance Analytics | Sidebar | Yes | Yes — `/dashboard/analytics/menu-performance` | Platform | ✅ A | Keep |
| 19 | Peak Hours Analytics | Homepage RT carousel, Sidebar | Yes | Yes — `/dashboard/analytics/peak-hours` | Platform | ✅ A | Keep |
| 20 | Payment Analytics | Sidebar | Yes | Yes — `/dashboard/analytics/payments` | Platform | ✅ A | Keep |

## Team

| # | Feature | Where Advertised | Exists? | Usable Today? | Verified? | Category | Recommendation |
|---|---------|-----------------|---------|---------------|-----------|----------|----------------|
| 21 | Staff Management | Homepage, Features, Pricing, Sidebar | Yes | Yes — `/dashboard/staff` | Platform + IOS | ✅ A | Keep |
| 22 | Role-Based Access Control | Homepage, Features, Pricing | Yes | Yes — roles: OWNER, ADMIN, MANAGER, CHEF, WAITER, CASHIER, etc. | Platform + IOS | ✅ A | Keep |

## Financial

| # | Feature | Where Advertised | Exists? | Usable Today? | Verified? | Category | Recommendation |
|---|---------|-----------------|---------|---------------|-----------|----------|----------------|
| 23 | Transactions | Sidebar | Yes | Yes — `/dashboard/transactions` | Platform + IOS | ✅ A | Keep |
| 24 | Payout Summary | Sidebar | Yes | Yes — `/dashboard/payout-summary` | Platform | ✅ A | Keep |
| 25 | Payment Settings | Sidebar | Yes | Yes — `/dashboard/payment-settings` | Platform | ✅ A | Keep |
| 26 | Mobile Money Payments | Homepage, Features, Pricing | Yes | Yes — MTN MoMo, Airtel Money, IremboPay, Cash | Platform + IOS + ORRS | ✅ A | Keep |

## Settings

| # | Feature | Where Advertised | Exists? | Usable Today? | Verified? | Category | Recommendation |
|---|---------|-----------------|---------|---------------|-----------|----------|----------------|
| 27 | Settings | Sidebar | Yes | Yes — `/dashboard/settings` | Platform | ✅ A | Keep |
| 28 | Profile | Sidebar | Yes | Yes — `/dashboard/profile` | Platform | ✅ A | Keep |
| 29 | Security | Sidebar | Yes | Yes — `/dashboard/security` | Platform | ✅ A | Keep |

## Growth & Customer Features

| # | Feature | Where Advertised | Exists? | Usable Today? | Verified? | Category | Recommendation |
|---|---------|-----------------|---------|---------------|-----------|----------|----------------|
| 30 | Smart Dining Slips | Homepage, Features | Yes | Yes — auto-generated digital receipts | Platform + IOS | ✅ A | Keep |
| 31 | WhatsApp Notifications | Homepage, Features, Pricing | Yes | Yes — order alerts, low-stock, daily summaries | Platform + IOS | ✅ A | Keep |
| 32 | Multi-Branch Control | Homepage, Features, Pricing | Yes | Yes — feature-flagged `multi_branch` | Platform | ✅ A | Keep |
| 33 | Referral Program | Homepage, Nav, `/refer` page | Yes | Yes — code generation, sharing, leaderboard | Platform | 🟢 B | Keep — minor polish needed |
| 34 | Discovery / Discover Page | Homepage, Nav, `/discover` | Yes | Yes — public business directory | Platform | 🟢 B | Keep — limited listings initially |
| 35 | Founding Restaurant Program | Homepage | Yes | Yes — signup flow with 50% discount | Platform | 🟢 B | Keep |
| 36 | Pricing Plans | Homepage, `/pricing` | Yes | Yes — 5 plans with Stripe/billing | Platform | 🟢 B | Keep — rewrite feature lists |
| 37 | PWA / Install App | Nav, Footer | Yes | Yes — installable PWA | Platform | 🟢 B | Keep |

## Beta / Limited Access

| # | Feature | Where Advertised | Exists? | Usable Today? | Verified? | Category | Recommendation |
|---|---------|-----------------|---------|---------------|-----------|----------|----------------|
| 38 | CRM (RFM Segmentation) | Homepage growth carousel, Pricing | Partial | Feature-flagged `crm_v1` — page exists, API exists, not in V1 sidebar | None | 🟡 C | Remove from primary marketing — "Early Access" |
| 39 | Loyalty & Rewards | Homepage, Features, Pricing | Partial | Feature-flagged `loyalty_system` — page exists, API exists | None | 🟡 C | Remove from primary marketing — "Early Access" |
| 40 | Promotions & Happy Hours | Homepage, Features, Pricing | Partial | Feature-flagged `promotions_engine` — page exists, API exists | None | 🟡 C | Remove from primary marketing — "Early Access" |
| 41 | Supplier Marketplace / Store | Homepage, Nav, `/store` | Partial | Store page works, products browsable, but no supplier onboarding for new restaurants | None | 🟡 C | Keep "Coming Soon" label — remove from nav |
| 42 | WhatsApp Staff Ordering | Not prominently marketed | Yes | Requires Twilio config, staff phone registration | None | 🟡 C | Keep as "Early Access" — requires setup |
| 43 | AI Insights Dashboard | Sidebar (feature-flagged) | Partial | Feature-flagged `ai_insights_v1` — page exists with reorder suggestions, cost anomalies, insight reports | None | 🟡 C | "Early Access" — requires OpenAI credits |

## Roadmap

| # | Feature | Where Advertised | Exists? | Usable Today? | Verified? | Category | Recommendation |
|---|---------|-----------------|---------|---------------|-----------|----------|----------------|
| 44 | Site Builder | Homepage, Nav, Pricing | Partial | Page exists with templates, but hidden from V1 sidebar, no publishing flow | None | 🔵 D | Move to roadmap — remove from homepage and nav |
| 45 | Hotel Mode | Homepage, Pricing | Partial | Feature-flagged `hotel_mode` — page exists but not verified | None | 🔵 D | Move to roadmap — remove from homepage |
| 46 | AI Menu Builder | Homepage, Pricing | Partial | Feature-flagged `ai_menu_builder` — page exists, requires OpenAI | None | 🔵 D | Move to roadmap — remove from homepage |
| 47 | WhatsApp Campaigns | Homepage growth carousel, Pricing | Partial | Page exists, API exists, but no automation, not in V1 sidebar | None | 🔵 D | Move to roadmap — remove from homepage |
| 48 | Menu A/B Testing | Homepage growth carousel, Pricing | Partial | Page exists but hidden from navigation, no API integration found | None | 🔵 D | Move to roadmap — remove from homepage |
| 49 | Voice Ordering (WhatsApp AI) | Homepage growth carousel | Partial | Voice-order webhook exists, requires Twilio + OpenAI + customer registration | None | 🔵 D | Move to roadmap — remove from homepage |

## Remove

| # | Feature | Where Advertised | Exists? | Usable Today? | Verified? | Category | Recommendation |
|---|---------|-----------------|---------|---------------|-----------|----------|----------------|
| 50 | Fabricated Statistics ("500+ Businesses", "10,000+ Orders") | Homepage stats section | No | N/A — no data | N/A | 🔴 E | Remove entirely |
| 51 | "Deposits & Reservations" (deposits claim) | Homepage growth carousel | No | Deposits not implemented — only reservations work | N/A | 🔴 E | Remove "Deposits" from the claim |
| 52 | Conversational Hospitality / WhatsApp AI Conversation | Implied by voice ordering marketing | Partial | GPT-4 conversation handler exists but not production-ready | None | 🔴 E | Remove from all marketing |

---

## Summary by Category

| Category | Count | Features |
|----------|-------|----------|
| ✅ A — Production Ready | 29 | QR Ordering, Orders, Kitchen, Tables, Reservations, Waiter, Service Replay, Menu, Inventory, Inventory Alerts, OCR, Auto-Reorder, QR Builder, QR Analytics, Reports, Close Day, Menu Performance, Peak Hours, Payment Analytics, Staff, RBAC, Transactions, Payout Summary, Payment Settings, Mobile Money, Settings, Profile, Security, Smart Dining Slips, WhatsApp Notifications, Multi-Branch |
| 🟢 B — Production Ready (Minor Polish) | 7 | Referral Program, Discovery, Founding Program, Pricing Plans, PWA Install, AI Draft PO Generation |
| 🟡 C — Beta / Limited Access | 6 | CRM, Loyalty, Promotions, Supplier Marketplace, WhatsApp Staff Ordering, AI Insights |
| 🔵 D — Roadmap | 6 | Site Builder, Hotel Mode, AI Menu Builder, WhatsApp Campaigns, A/B Testing, Voice Ordering |
| 🔴 E — Remove | 3 | Fabricated Stats, Deposits Claim, Conversational Hospitality |

---

*Matrix generated: July 26, 2026*
