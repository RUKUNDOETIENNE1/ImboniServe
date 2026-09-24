# Roadmap Parking Lot

**Platform:** ImboniServe  
**Date:** July 26, 2026  
**Document Type:** Deferred Features Registry  

---

## 1. Purpose

This document collects every feature that has been deferred from Version 1.0. These features are NOT cancelled — they are intentionally deferred until validated by customer demand and the post-launch roadmap.

---

## 2. Deferred Features

### 2.1 Conversational Hospitality

**Current State:** Voice ordering webhook exists (`/api/webhooks/twilio/voice-order.ts`) with GPT-4 integration for AI-powered conversation. Staff-assisted WhatsApp ordering exists (`WhatsAppOrderService`) with text-format order parsing.

**What's Missing:**
- No production-ready customer onboarding for WhatsApp ordering
- Requires Twilio configuration per business
- Requires OpenAI API integration
- No conversation state management
- No multi-turn ordering flow
- No menu browsing via WhatsApp
- Customer must be pre-registered with phone number

**Why Deferred:** Requires significant engineering to make self-service for new restaurants. Twilio and OpenAI costs make it impractical for all plan tiers.

**Dependencies:** Twilio account setup, OpenAI API, customer registration flow

**Target:** Version 2.0 — Post-launch, validated by customer demand

---

### 2.2 WhatsApp Ordering (Full)

**Current State:** Two implementations exist:
1. Staff-assisted ordering via `WhatsAppOrderService` — staff send formatted messages (`ORDER T5 2x Brochette`)
2. AI-powered customer ordering via `voice-order.ts` — GPT-4 extracts order intent from natural language

**What's Missing:**
- No self-service setup wizard for restaurants
- No WhatsApp Business API onboarding flow
- No menu synchronization to WhatsApp
- No payment integration within WhatsApp
- No order status updates to customers via WhatsApp
- No conversation persistence

**Why Deferred:** Full WhatsApp ordering requires WhatsApp Business API approval, Twilio setup, and significant UX work. Not feasible for V1 self-service onboarding.

**Dependencies:** WhatsApp Business API, Twilio configuration, conversation state management

**Target:** Version 2.0 — Post-launch, based on customer demand

---

### 2.3 Website Builder

**Current State:** Dashboard page exists at `/dashboard/site-builder` with:
- Template selection (multiple templates)
- Color customization (primary, secondary, accent)
- Font selection
- Section toggles (hero, menu, about, gallery, contact, reviews)
- Logo and cover image upload

**What's Missing:**
- No publishing flow — sites cannot be deployed to a custom domain
- No live preview
- No menu synchronization to website
- No SEO optimization
- No mobile-responsive rendering of published site
- Hidden from V1 sidebar

**Why Deferred:** Builder UI exists but publishing pipeline is not implemented. Cannot deliver a live website to a restaurant.

**Dependencies:** Domain management, hosting infrastructure, template rendering engine

**Target:** Version 1.5 or 2.0 — Based on customer demand for independent websites

---

### 2.4 Supplier Marketplace

**Current State:**
- Store page at `/store` with product browsing, search, and cart
- Supplier pages at `/supplier/*` with orders, deliveries, payments, products
- AI supplier recommendations component
- Supplier map with geographic proximity
- Homepage section labeled "Coming Soon — Early Access"

**What's Missing:**
- No supplier self-service onboarding
- No automated supplier verification
- No integrated payment processing for marketplace orders
- No delivery tracking integration
- No inventory integration from marketplace orders
- Limited supplier catalog

**Why Deferred:** Marketplace infrastructure exists but lacks the supplier-side onboarding and operational workflow needed for a self-service marketplace.

**Dependencies:** Supplier onboarding flow, payment escrow, delivery integration, inventory sync

**Target:** Version 1.5 — Early access with manually onboarded suppliers, full marketplace in Version 2.0

---

### 2.5 Advanced CRM

**Current State:**
- CRM dashboard at `/dashboard/crm` with RFM segmentation (Champions, Loyal, At Risk, Lost, New, Promising)
- Customer list with search and segment filtering
- Contacts page at `/dashboard/contacts`
- API endpoints for customer data

**What's Missing:**
- No automated campaign triggers based on segments
- No customer journey mapping
- No integration with loyalty program
- No customer feedback collection
- No automated re-engagement flows
- Feature-flagged — not in V1 sidebar

**Why Deferred:** RFM segmentation works but the full CRM workflow (automated actions, campaigns, journey mapping) is incomplete.

**Dependencies:** Campaign automation, loyalty integration, feedback system

**Target:** Version 1.5 — Early Access with manual segmentation, full CRM in Version 2.0

---

### 2.6 Menu A/B Testing

**Current State:**
- Dashboard page at `/dashboard/ab-testing` with test creation UI
- Variant configuration (price, description, image changes)
- Traffic splitting percentages
- Metrics display (views, orders, revenue, conversion rate)
- Winner declaration

**What's Missing:**
- No API integration — tests are UI-only, no backend persistence
- No actual traffic splitting implementation
- No variant serving in the QR ordering flow
- No statistical significance calculation
- Hidden from V1 sidebar

**Why Deferred:** UI is built but the core engine (traffic splitting, variant serving, metrics collection) does not exist. This is a UI shell without backend implementation.

**Dependencies:** Variant serving engine, metrics collection, statistical analysis

**Target:** Version 2.0 — Requires significant backend engineering

---

### 2.7 Hotel Mode

**Current State:**
- Dashboard page at `/dashboard/hotel` with room management interface
- Feature-flagged `hotel_mode`

**What's Missing:**
- Not operationally verified
- Limited room management features
- No integration with reservations
- No front desk operations
- No service area management
- Hidden from V1 sidebar

**Why Deferred:** Page exists but has not been validated through Platform Integrity Certification or IOS. Hotel operations require different workflows than restaurant operations.

**Dependencies:** Room management, reservation integration, front desk POS, service area routing

**Target:** Version 2.0 — Post-launch, based on hotel customer demand

---

### 2.8 AI Menu Builder

**Current State:**
- Dashboard page at `/dashboard/menu-builder` with upload flow
- API endpoint for extraction (`/api/menu-builder/extract`)
- Candidate review system
- Feature-flagged `ai_menu_builder`

**What's Missing:**
- Requires OpenAI API configuration
- Extraction quality not verified across diverse menu formats
- No bulk import from PDF
- No menu structure inference (categories, modifiers)
- Hidden from V1 sidebar

**Why Deferred:** Works but requires OpenAI credits and configuration. Extraction quality varies. Not suitable for self-service onboarding without quality guarantees.

**Dependencies:** OpenAI API, quality assurance, menu structure inference

**Target:** Version 1.5 — Early Access with manual review, full automation in Version 2.0

---

### 2.9 WhatsApp Campaigns

**Current State:**
- Dashboard page at `/dashboard/campaigns` with campaign creation UI
- Campaign scheduling, segment targeting, message composition
- Campaign metrics (sent, delivered, read, clicked)
- API endpoints for campaign management

**What's Missing:**
- No campaign automation (triggered campaigns)
- No template message approval flow (WhatsApp Business API requirement)
- No A/B testing for campaign messages
- No segment synchronization from CRM
- Hidden from V1 sidebar

**Why Deferred:** Campaign creation UI exists but lacks automation and WhatsApp Business API template compliance. Cannot deliver automated campaigns.

**Dependencies:** WhatsApp Business API, template approval, CRM segment sync, automation engine

**Target:** Version 2.0 — Post-launch, integrated with CRM and loyalty

---

### 2.10 Additional AI Initiatives

**Current State:**
- AI Insights Dashboard at `/dashboard/ai` with reorder suggestions, cost anomaly alerts, and insight reports
- Optimization Hub at `/dashboard/optimization`
- Feature-flagged `ai_insights_v1`

**What's Missing:**
- No predictive demand forecasting
- No automated pricing recommendations
- No customer lifetime value prediction
- No churn prediction
- No automated menu optimization
- Limited to reactive insights, not proactive recommendations

**Why Deferred:** Current AI features are reactive (alerts, suggestions). Proactive AI (forecasting, prediction, automation) requires more training data and model development.

**Dependencies:** Historical data accumulation, model training, AI credit system maturation

**Target:** Version 2.0+ — Progressive rollout as data and models mature

---

### 2.11 Reservation Deposits

**Current State:**
- Reservations work without deposits
- No deposit collection or refund mechanism
- No payment integration for reservation holds

**What's Missing:**
- No deposit amount configuration
- No payment authorization hold
- No automatic refund on cancellation
- No deposit forfeiture on no-show

**Why Deferred:** Payment infrastructure exists but deposit-specific flows (authorization holds, conditional refunds) are not implemented.

**Dependencies:** Payment authorization holds, refund automation, no-show policy engine

**Target:** Version 1.5 — Based on customer demand for no-show reduction

---

### 2.12 Card / POS Payments

**Current State:** Listed on homepage payment methods section but not implemented.

**What's Missing:** No card payment gateway integration, no POS terminal integration.

**Why Deferred:** Mobile money is the dominant payment method in Rwanda. Card/POS is secondary.

**Dependencies:** Card payment gateway (Stripe, Flutterwave, or local processor), POS hardware integration

**Target:** Version 2.0 — Based on customer demand for card payments

---

## 3. Priority Ranking

| Priority | Feature | Target Version | Effort | Customer Demand |
|----------|---------|---------------|--------|-----------------|
| 1 | Supplier Marketplace (Early Access) | V1.5 | Medium | High — procurement is core |
| 2 | AI Menu Builder (Early Access) | V1.5 | Low | Medium — onboarding acceleration |
| 3 | CRM (Early Access) | V1.5 | Low | Medium — customer retention |
| 4 | Loyalty & Rewards (Early Access) | V1.5 | Low | Medium — customer retention |
| 5 | Promotions (Early Access) | V1.5 | Low | High — daily operations |
| 6 | Reservation Deposits | V1.5 | Medium | Medium — no-show reduction |
| 7 | Website Builder | V2.0 | High | Unknown |
| 8 | WhatsApp Campaigns | V2.0 | High | Unknown |
| 9 | Menu A/B Testing | V2.0 | High | Unknown |
| 10 | Hotel Mode | V2.0 | High | Unknown |
| 11 | Voice Ordering / WhatsApp AI | V2.0 | High | Unknown |
| 12 | Card / POS Payments | V2.0 | Medium | Low (Rwanda market) |
| 13 | Advanced AI (Forecasting) | V2.0+ | High | Unknown |

---

## 4. Re-Entry Criteria

A deferred feature may re-enter the active product scope when ALL of the following are met:

1. **Customer demand is validated** — At least 3 paying customers request the feature
2. **Implementation is complete** — Feature passes Platform Integrity Certification
3. **Operational verification passes** — Feature passes IOS or equivalent testing
4. **Marketing is updated** — Feature is added to PUBLIC_PRODUCT_DEFINITION.md
5. **Pricing is updated** — Feature is added to appropriate plan tiers in `pricing.ts`

---

*Document effective date: July 26, 2026*  
*Next review: 90 days post-launch or upon Version 1.5 planning*
