# Public Product Definition

**Platform:** ImboniServe  
**Date:** July 26, 2026  
**Document Type:** Source of Truth for Marketing, Sales, Product, and Engineering  

---

## 1. Purpose

This document defines exactly what ImboniServe publicly offers today. It is the authoritative reference for what may be marketed, sold, and promised to customers. Any feature not listed here as "Available" must not appear on public-facing surfaces as a production-ready capability.

---

## 2. ImboniServe Public Product — Available Today

### Core Operations

| Feature | Description | Available Since |
|---------|-------------|-----------------|
| **QR Code Ordering** | Customers scan a QR code at their table, browse the menu, and place orders directly from their phone — no app download required. | Platform Validation |
| **Unified Orders** | Track dine-in, takeaway, and delivery orders in a single unified feed. | Platform Validation |
| **Kitchen Display** | Real-time kitchen order display with station routing and status tracking. | Platform Validation |
| **Tables Management** | Create tables, sections, and zones. Track occupancy status in real-time. | Platform Validation |
| **Reservations** | Manage restaurant reservations with confirmation and no-show tracking. | Platform Validation |
| **Waiter Station** | Mobile-optimized waiter interface for order taking and table management. | Platform Validation |
| **Service Replay** | Replay service events for operational review and training. | Platform Validation |

### Menu & Inventory

| Feature | Description | Available Since |
|---------|-------------|-----------------|
| **Menu Management** | Create and manage menu items with categories, prices, photos, and availability toggles. | Platform Validation |
| **Inventory Tracking** | Track stock levels, unit costs, and movements with full audit trails. | Platform Validation |
| **Inventory Alerts** | Four-level alert system (CRITICAL, HIGH, MEDIUM, LOW) with configurable reorder levels and min stock thresholds. | ORRS |
| **OCR Documents** | Upload and process supplier invoices and inventory documents via OCR. | Platform Validation |
| **AI Auto-Reorder** | AI-powered reorder detection with automatic draft purchase order generation grouped by supplier. | ORRS |

### QR & Digital

| Feature | Description | Available Since |
|---------|-------------|-----------------|
| **QR Builder** | Generate branded QR codes for tables, ordering, and reservations. | Platform Validation |
| **QR Analytics** | Track scan counts, orders per QR, and revenue attribution by table/section. | Platform Validation |

### Reports

| Feature | Description | Available Since |
|---------|-------------|-----------------|
| **Reports & Analytics** | Daily, weekly, and monthly reports covering revenue, costs, and margins. | Platform Validation |
| **Close Day / Z-Report** | End-of-day closing with Z-Report generation and reconciliation. | Platform Validation |
| **Menu Performance** | Analytics on item popularity, revenue contribution, and profitability. | Platform Validation |
| **Peak Hours** | Hourly demand patterns for staffing and capacity planning. | Platform Validation |
| **Payment Analytics** | Payment method breakdown, success rates, and transaction history. | Platform Validation |

### Team

| Feature | Description | Available Since |
|---------|-------------|-----------------|
| **Staff Management** | Add and manage staff with role assignments and performance tracking. | Platform Validation |
| **Role-Based Access Control** | Granular permissions: Owner, Admin, Manager, Chef, Kitchen Staff, Waiter, Cashier, Supervisor, Front Desk. | Platform Validation |

### Financial

| Feature | Description | Available Since |
|---------|-------------|-----------------|
| **Mobile Money Payments** | Accept MTN MoMo, Airtel Money, and IremboPay payments natively. 20-minute payment timeout. Cash payments also supported. | ORRS |
| **Transactions** | View and manage all payment transactions with status tracking. | Platform Validation |
| **Payout Summary** | Summary of payouts and payment processing fees. | Platform Validation |
| **Payment Settings** | Configure payment providers, API keys, and payment methods. | Platform Validation |

### Customer Experience

| Feature | Description | Available Since |
|---------|-------------|-----------------|
| **Smart Dining Slips™** | Auto-generated digital receipts with shareable links for customers. | Platform Validation |
| **WhatsApp Notifications** | Receive order alerts, daily summaries, and low-stock notifications via WhatsApp. | Platform Validation |
| **Multi-Branch Control** | Manage multiple locations from one dashboard with consolidated and per-branch reporting. | Platform Validation |

### Settings & Configuration

| Feature | Description | Available Since |
|---------|-------------|-----------------|
| **Settings** | Configure business details, currency, tax rates, and operational preferences. | Platform Validation |
| **Profile** | Manage business profile, logo, and public listing information. | Platform Validation |
| **Security** | Password management, 2FA, and session control. | Platform Validation |

### Growth Features

| Feature | Description | Available Since |
|---------|-------------|-----------------|
| **Referral Program** | Customers generate referral codes, share with friends, and earn rewards. Leaderboard tracks top referrers. | Platform Validation |
| **Discovery Listing** | Business listed on public `/discover` directory for customer discovery. | Platform Validation |
| **Founding Restaurant Program** | First 100 restaurants get 50% lifetime discount, direct founder support, and early access to new features. | Platform Validation |

### Platform

| Feature | Description | Available Since |
|---------|-------------|-----------------|
| **PWA / Installable App** | Install ImboniServe as a Progressive Web App on any device. | Platform Validation |
| **Pricing Plans** | 5 tiers: Starter (15,000 RWF/mo), Professional (35,000 RWF/mo), Business (75,000 RWF/mo), Premium (200,000 RWF/mo), Enterprise (custom). 14-day free trial. | Platform Validation |
| **Multi-Language** | English, French, and Kinyarwanda support. | Platform Validation |
| **Dark Mode** | Light and dark theme support across dashboard and public pages. | Platform Validation |

---

## 3. Early Access Features (Available but not marketed as production-ready)

These features exist in the platform and can be enabled by request, but require manual configuration or have limited testing:

| Feature | Status | How to Enable |
|---------|--------|---------------|
| **CRM (RFM Segmentation)** | Feature-flagged `crm_v1` — customer segmentation with RFM scoring | Contact support to enable |
| **Loyalty & Rewards** | Feature-flagged `loyalty_system` — points, tiers, and redemption | Contact support to enable |
| **Promotions & Happy Hours** | Feature-flagged `promotions_engine` — time-based discounts and combo deals | Contact support to enable |
| **AI Insights Dashboard** | Feature-flagged `ai_insights_v1` — reorder suggestions, cost anomaly alerts, insight reports | Contact support to enable + AI credits |
| **WhatsApp Staff Ordering** | Requires Twilio configuration — staff send formatted messages to place orders | Requires Twilio setup + staff phone registration |
| **Supplier Marketplace** | Store page functional, products browsable — supplier onboarding is manual | "Coming Soon" — early access available |

---

## 4. Not Available (Roadmap)

These features are NOT available today and must not be marketed as production-ready:

- Site Builder
- Hotel Mode
- AI Menu Builder
- WhatsApp Campaigns
- Menu A/B Testing
- Voice Ordering (WhatsApp AI)
- Reservation Deposits
- Recipe Management with Costing (full workflow)
- Prep Plans & Forecasting
- White-Label Options
- API Access
- Custom Integrations
- SSO (Single Sign-On)
- On-Premise Deployment
- Regional Data Residency

---

## 5. Marketing Rules

1. **Only features in Section 2 may be marketed as production-ready.**
2. **Features in Section 3 may be mentioned as "Early Access" or "Available by request."**
3. **Features in Section 4 must not appear on any public-facing surface as available.**
4. **Statistics used in marketing must be factual and backed by real data.**
5. **Pricing plan feature lists must only include features from Sections 2 and 3.**
6. **Any new feature added to Section 2 requires Platform Validation or equivalent verification.**

---

*Document effective date: July 26, 2026*  
*Next review: Upon first paying customer onboarding or next platform release*
