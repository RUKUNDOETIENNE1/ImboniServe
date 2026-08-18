# Public Marketing Changes

**Platform:** ImboniServe  
**Date:** July 26, 2026  
**Sprint:** Marketing Alignment Sprint (MAS)  

---

## Purpose

Every marketing change required before launch, organized by surface area. Each change includes the current content, the problem, and the required action.

---

## 1. Homepage (`src/pages/index.tsx`)

### 1.1 Hero Carousel (lines 320–420)

| Slide | Current | Problem | Required Action |
|-------|---------|---------|-----------------|
| Slide 3 | "AI-Powered Insights — Data-Driven Growth" | AI Insights is Early Access, not production-ready | **REWRITE** — Change to "Smart Analytics — Data-Driven Growth" or add "Early Access" label |

**All other slides: KEEP** — Slides 1, 2, and 4 are accurate.

---

### 1.2 Real-Time OS Carousel (lines 422–461)

**KEEP ENTIRE SECTION** — All 5 cards (Every Sale Live, QR Performance, Tables & Sections, Peak Hours, Unified Orders) are production-ready.

---

### 1.3 Auto-Growth Engines Carousel (lines 463–501)

| Card | Current | Problem | Required Action |
|------|---------|---------|-----------------|
| Customer CRM (RFM) | "Segment customers into Champions, Loyal, and At-Risk" | Feature-flagged, not in V1 sidebar | **HIDE** — Remove from carousel |
| Automated WhatsApp Campaigns | "Target segments with personalized messages" | Not production-ready, no automation | **HIDE** — Remove from carousel |
| Menu A/B Testing | "Test price, copy, and visuals. Pick winners with data." | UI only, no backend | **HIDE** — Remove from carousel |
| Voice Ordering (WhatsApp AI) | "Let customers order by voice in EN / FR / RW" | Not production-ready | **HIDE** — Remove from carousel |
| Low-Stock Push Alerts | "Never run out. Get alerted before you do." | ✅ Production-ready | **KEEP** — Move to Features grid |
| Deposits & Reservations | "Cut no-shows with smart deposits & confirmations" | Deposits not implemented | **HIDE** — Remove from carousel |

**Required Action: REMOVE ENTIRE "Auto-Growth Engines" CAROUSEL.** Only 1 of 6 cards is production-ready. Move Low-Stock Push Alerts to the Features grid. Replace this section with a "Coming Soon" teaser or remove entirely.

---

### 1.4 Supplier Marketplace Section (lines 504–526)

**KEEP** — Already correctly labeled "Coming Soon — Early Access."

---

### 1.5 Video Demo (lines 528–561)

**KEEP** — Video demo is accurate.

---

### 1.6 How It Works (lines 563–662)

| Step | Current | Problem | Required Action |
|------|---------|---------|-----------------|
| Step 2 | "Use our AI Menu Builder to upload a photo or PDF" | AI Menu Builder is not production-ready | **REWRITE** — Change to "Add your dishes, drinks, and prices manually. Upload photos to make your menu shine." |
| All other steps | — | — | **KEEP** |

---

### 1.7 Stats Section (lines 664–696)

| Stat | Current | Problem | Required Action |
|------|---------|---------|-----------------|
| "500+ Businesses served" | Fabricated | No data supports this | **REMOVE** — Replace with "Built for Rwanda" |
| "10,000+ Orders processed" | Fabricated | No data supports this | **REMOVE** — Replace with "14-Day Free Trial" |
| "14 days free trial, no card needed" | ✅ Accurate | — | **KEEP** |
| "50+ Features included" | Misleading | Count is inflated | **REPLACE** — Change to "30+ Features Included" or "All-in-One Platform" |

**Required Action: REWRITE ENTIRE STATS SECTION** with honest messaging:
- "14-Day Free Trial"
- "No Credit Card Needed"
- "Built for Rwanda"
- "Founding Program Available"

---

### 1.8 Features Grid (lines 698–801)

| Feature Card | Current | Problem | Required Action |
|-------------|---------|---------|-----------------|
| QR Code Ordering | ✅ | — | **KEEP** |
| Inventory & Procurement | ✅ | — | **KEEP** |
| Reports & Analytics | ✅ | — | **KEEP** |
| AI-Powered Insights | Markets AI as production-ready | Early Access | **REWRITE** — Add "Early Access" label or change to "Smart Analytics" |
| Content & Discovery Feed | Implies content feed is production-ready | Limited | **REWRITE** — Focus on "Discovery Listing" — "Get listed on our public restaurant directory" |
| Smart Dining Slips™ | ✅ | — | **KEEP** |
| Loyalty & Rewards | Markets as production-ready | Feature-flagged | **HIDE** — Remove from features grid |
| Promotions & Happy Hours | Markets as production-ready | Feature-flagged | **HIDE** — Remove from features grid (or add "Coming Soon" label if completing before launch) |
| WhatsApp Integration | ✅ (notifications) | — | **KEEP** |
| Mobile Money Payments | ✅ | — | **KEEP** |
| Multi-Branch Control | ✅ | — | **KEEP** |
| Role-Based Access | ✅ | — | **KEEP** |

**Additional: ADD "Low-Stock Push Alerts" card** (moved from Auto-Growth carousel).

---

### 1.9 Pricing Preview (lines 804–889)

| Element | Current | Problem | Required Action |
|---------|---------|---------|-----------------|
| "Starting at 15,000 RWF / month" | ✅ | — | **KEEP** |
| "Annual billing saves 25%" | ✅ | — | **KEEP** |
| "AI-powered insights and reporting" | AI is Early Access | — | **REWRITE** — Change to "Reporting and analytics" |
| Founding program note | ✅ | — | **KEEP** — But ensure backend applies the discount |

---

### 1.10 Product Trust Section (lines 891–971)

| Card | Current | Problem | Required Action |
|------|---------|---------|-----------------|
| Fully Auditable Inventory | ✅ | — | **KEEP** |
| Accurate Food Costs | ✅ | — | **KEEP** |
| Role-Based Protection | ✅ | — | **KEEP** |
| Fully Integrated Operations | ✅ | — | **KEEP** |
| Global Platform, Local Configuration | ✅ | — | **KEEP** |
| AI Built on Real Data | AI is Early Access | — | **REWRITE** — Change to "Data-Driven Recommendations" or "Built on Real Operational Data" |

---

### 1.11 Founding Restaurant Program (lines 973–1079)

**KEEP ENTIRE SECTION** — All claims are accurate (50% lifetime discount, direct founder support, early access, shape platform development).

**CRITICAL:** Ensure backend applies the 50% discount. See Feature Completion Recommendations.

---

### 1.12 Advanced Features Section (lines 1081–1149)

| Card | Current | Problem | Required Action |
|------|---------|---------|-----------------|
| Hotel Mode | Markets as available | Roadmap | **HIDE** — Remove from this section |
| Site Builder | Markets as available | Roadmap | **HIDE** — Remove from this section |
| AI Menu Builder | Markets as available | Roadmap | **HIDE** — Remove from this section |
| Discovery Marketplace | Markets as available | Partial | **REWRITE** — Label as "Early Access" |
| Referral Program | ✅ (minor polish) | — | **KEEP** |
| Staff & Roles | ✅ | — | **KEEP** |

**Required Action: REWRITE SECTION** — Keep only Referral Program, Staff & Roles, and Discovery (with Early Access label). Replace removed cards with: "Inventory Alerts & Auto-Reorder", "Smart Dining Slips", "Multi-Branch Control".

---

### 1.13 Discovery Marketplace Section (lines 1151–1201)

**KEEP** — Discovery page works and businesses can be listed.

---

### 1.14 Payment Methods Section (lines 1203–1219)

| Method | Current | Problem | Required Action |
|--------|---------|---------|-----------------|
| MTN MoMo | ✅ | — | **KEEP** |
| Airtel Money | ✅ | — | **KEEP** |
| Cash | ✅ | — | **KEEP** |
| Card / POS | Listed as available | Not implemented | **REMOVE** — Remove "Card / POS" from payment methods |
| IremboPay | ✅ | — | **KEEP** |

---

### 1.15 Final CTA (lines 1221–1244)

| Element | Current | Problem | Required Action |
|---------|---------|---------|-----------------|
| "Join 500+ hospitality businesses across Rwanda" | Fabricated | — | **REWRITE** — Change to "Start your free 14-day trial today" |
| "Start Free Trial" button | ✅ | — | **KEEP** |
| "Talk to Our Team" WhatsApp link | ✅ | — | **KEEP** |

---

## 2. Pricing Page (`src/pages/pricing.tsx` and `src/config/pricing.ts`)

### 2.1 Plan Feature Lists

**CRITICAL:** Every plan's feature list must be rewritten to only include production-ready features.

#### Starter Plan — Current vs Required

| Current Feature | Status | Action |
|----------------|--------|--------|
| "QR ordering (5 codes)" | ✅ | KEEP |
| "POS & kitchen tickets" | ✅ | KEEP |
| "Inventory tracking" | ✅ | KEEP |
| "Supplier orders (manual)" | ✅ | KEEP |
| "Mobile Money payments" | ✅ | KEEP |
| "Daily & weekly reports" | ✅ | KEEP |
| "Basic CRM" | ❌ Feature-flagged | REMOVE — or change to "Customer directory" |
| "Site Builder preview" | ❌ Not ready | REMOVE |
| "Referrals" | ✅ | KEEP |
| "Discovery basic listing" | ✅ | KEEP |
| "20 AI credits/month" | ✅ (AI credits system exists) | KEEP |
| "2 GB storage" | ✅ | KEEP |
| "1 branch, unlimited outlets" | ✅ | KEEP |
| "Standard support" | ✅ | KEEP |

#### Professional Plan — Current vs Required

| Current Feature | Status | Action |
|----------------|--------|--------|
| "Everything in Starter" | ✅ | KEEP |
| "Reservations" | ✅ | KEEP |
| "Staff management" | ✅ | KEEP |
| "Role-based access" | ✅ | KEEP |
| "Payment analytics" | ✅ | KEEP |
| "Menu performance" | ✅ | KEEP |
| "Peak hours" | ✅ | KEEP |
| "WhatsApp campaigns (basic)" | ❌ Not ready | REMOVE |
| "QR Builder (20 codes)" | ✅ | KEEP |
| "Site Builder (basic mode)" | ❌ Not ready | REMOVE |
| "50 AI credits/month" | ✅ | KEEP |
| "5 GB storage" | ✅ | KEEP |
| "1 branch, unlimited outlets" | ✅ | KEEP |
| "Priority support" | ✅ | KEEP |

#### Business Plan — Current vs Required

| Current Feature | Status | Action |
|----------------|--------|--------|
| "Everything in Professional" | ✅ | KEEP |
| "Multi-branch dashboard" | ✅ | KEEP |
| "QR analytics" | ✅ | KEEP |
| "Supplier portal" | ❌ Not ready | REMOVE — or change to "Supplier orders (enhanced)" |
| "WhatsApp campaigns pro (segments)" | ❌ Not ready | REMOVE |
| "A/B testing lite" | ❌ Not ready | REMOVE |
| "Discovery featured listing" | ✅ | KEEP |
| "200 AI credits/month" | ✅ | KEEP |
| "20 GB storage" | ✅ | KEEP |
| "3 branches, unlimited outlets" | ✅ | KEEP |
| "Priority support" | ✅ | KEEP |

#### Premium Plan — Current vs Required

| Current Feature | Status | Action |
|----------------|--------|--------|
| "Everything in Business" | ✅ | KEEP |
| "Inventory auto-reorder" | ✅ (ORRS) | KEEP |
| "AI draft PO generation" | ✅ (ORRS) | KEEP |
| "WhatsApp campaign automation" | ❌ Not ready | REMOVE |
| "A/B testing unlimited" | ❌ Not ready | REMOVE |
| "Recipe management with costing" | ❌ Not verified | REMOVE |
| "Prep plans & forecasting" | ❌ Not implemented | REMOVE |
| "Customer feedback system" | ❌ Not verified | REMOVE |
| "White-label options" | ❌ Not implemented | REMOVE |
| "API access" | ❌ Not implemented | REMOVE |
| "Unlimited AI credits" | ✅ | KEEP |
| "100 GB storage" | ✅ | KEEP |
| "Unlimited branches" | ✅ | KEEP |
| "Priority support" | ✅ | KEEP |

#### Enterprise Plan

| Current Feature | Status | Action |
|----------------|--------|--------|
| "Everything in Premium" | ✅ | KEEP |
| "Dedicated infrastructure" | ❌ Not implemented | REMOVE — or change to "Dedicated support" |
| "Custom integrations" | ❌ Not implemented | REMOVE |
| "SSO" | ❌ Not implemented | REMOVE |
| "On-premise deployment" | ❌ Not implemented | REMOVE |
| "Regional data residency" | ❌ Not implemented | REMOVE |
| "Custom SLA" | ✅ (can be negotiated) | KEEP |
| "Dedicated account manager" | ✅ (can be provided) | KEEP |

---

## 3. Public Navigation (`src/components/PublicLayout.tsx`)

### 3.1 Solutions Dropdown (lines 109–132)

| Link | Current | Problem | Required Action |
|------|---------|---------|-----------------|
| Site Builder | Links to `/dashboard/site-builder` | Not production-ready | **REMOVE** from dropdown |
| Marketplace | Links to `/discover` | Works | **KEEP** — Rename to "Discover Restaurants" |
| Store | Links to `/store` | Works but no supplier onboarding | **REMOVE** from dropdown |
| List Your Business | Links to `/dashboard/profile` | ✅ | **KEEP** |
| Referral Program | Links to `/refer` | ✅ | **KEEP** |

### 3.2 Nav Bar Links (lines 97–145)

| Link | Current | Problem | Required Action |
|------|---------|---------|-----------------|
| Features | `/#features` | ✅ | **KEEP** |
| Pricing | `/pricing` | ✅ | **KEEP** |
| Solutions dropdown | See above | — | **REWRITE** — Remove Site Builder and Store |
| Store | `/#store` | Links to marketplace section | **REWRITE** — Change to "Discover" linking to `/discover` |
| Share & Earn | `/refer` | ✅ | **KEEP** |
| Discover | `/discover` | ✅ | **KEEP** |
| Contact | WhatsApp link | ✅ | **KEEP** |

### 3.3 Footer (lines 228–287)

| Link | Current | Problem | Required Action |
|------|---------|---------|-----------------|
| Sign in | `/login` | ✅ | **KEEP** |
| Sign up | `/signup` | ✅ | **KEEP** |
| Pricing | `/pricing` | ✅ | **KEEP** |
| Discover | `/discover` | ✅ | **KEEP** |
| Store | `/#store` | Implies marketplace is ready | **REMOVE** or change to `/discover` |
| FAQs | `/faq` | ✅ | **KEEP** |
| Contact | WhatsApp link | ✅ | **KEEP** |
| Terms | `/terms` | ✅ | **KEEP** |
| Privacy | `/privacy` | ✅ | **KEEP** |
| Cookies | `/cookies` | ✅ | **KEEP** |
| Service Terms | `/service-terms` | ✅ | **KEEP** |

---

## 4. Service Terms Page (`src/pages/service-terms.tsx`)

### 4.1 Referral & Rewards Program (Section 7)

| Element | Current | Problem | Required Action |
|---------|---------|---------|-----------------|
| 7.1 Customer Referral Program | "1,000 RWF per qualified referral" | Code sets 5,000 cents (50 RWF) | **FIX CODE** — Change `rewardCents = 5000` to `rewardCents = 100000` in `track.ts` |
| 7.2 B2B Affiliate Program | "15% for 12 months" | ✅ Service matches code | **KEEP** |
| 7.3 WhatsApp Integration | "Send automated reports and customer receipts" | ✅ | **KEEP** |
| 7.4 Multi-Branch Management | "Inventory Transfer between branches" | Not verified | **REWRITE** — Remove "Inventory Transfer" claim or verify it works |

---

## 5. Onboarding Copy

### 5.1 Signup Page (`src/pages/signup.tsx`)

| Element | Current | Problem | Required Action |
|------|---------|---------|-----------------|
| Plan selector | Shows all 5 plans | ✅ | **KEEP** |
| No referral code field | No visible input for referral/affiliate code | Cookie-based only | **ADD** — Add a "Referral code (optional)" field to the signup form |
| Business type selector | RESTAURANT, HOTEL, CAFE, BAR, SUPPLIER | ✅ | **KEEP** |

### 5.2 Dashboard Index (`src/pages/dashboard/index.tsx`)

| Element | Current | Problem | Required Action |
|------|---------|---------|-----------------|
| Quick actions | Shows primary actions | ✅ | **KEEP** |
| No onboarding checklist | New users may feel lost | Not a PTA finding but improves UX | **ADD** — Consider adding a "Getting Started" checklist (add menu, create tables, generate QR, connect payments) |

---

## 6. Empty States

| Page | Current | Problem | Required Action |
|------|---------|---------|-----------------|
| Orders | "No orders yet" | ✅ | **KEEP** |
| Inventory | "No inventory items" | ✅ | **KEEP** |
| Reports | "No data available" | ✅ | **KEEP** |
| CRM | "No customers" | ✅ | **KEEP** |
| AI Insights | "No suggestions" | ✅ | **KEEP** |
| Referrals | "No referrals yet" | ✅ | **KEEP** |

**No empty state changes required.**

---

## 7. Dashboard Marketing Elements

### 7.1 Dashboard Sidebar (`src/components/DashboardLayout.tsx`)

| Element | Current | Problem | Required Action |
|------|---------|---------|-----------------|
| V1 sidebar (22 items) | ✅ All production-ready | — | **KEEP** |
| Auto-Reorder | Hidden from sidebar | ORRS verified | **ADD** — Add to sidebar under "Menu & Inventory" |
| Referrals | Hidden from sidebar | Works | **CONSIDER** — Add to sidebar under "Growth" section |
| Invite (Business Invite) | Hidden from sidebar | Works | **CONSIDER** — Add to sidebar under "Growth" section |

---

## 8. Summary of All Required Changes

### CRITICAL (Must fix before launch)

| # | Surface | Change | Effort |
|---|---------|--------|--------|
| 1 | Homepage | Remove fabricated stats ("500+", "10,000+") | 30 min |
| 2 | Homepage | Remove "Auto-Growth Engines" carousel | 1 hour |
| 3 | Homepage | Remove "Card / POS" from payment methods | 15 min |
| 4 | Homepage | Rewrite Final CTA (remove "500+") | 15 min |
| 5 | Pricing | Rewrite all 5 plan feature lists | 2 hours |
| 6 | Navigation | Remove Site Builder and Store from solutions dropdown | 30 min |
| 7 | Founding Program | Add backend logic to apply 50% discount | 1–3 days |
| 8 | Referral Code | Fix reward amount bug (50 RWF → 1,000 RWF) | 5 min |
| 9 | Referral Code | Add referral code field to signup form | 1 hour |

### HIGH (Should fix before launch)

| # | Surface | Change | Effort |
|---|---------|--------|--------|
| 10 | Homepage | Rewrite "Advanced Features" section | 1 hour |
| 11 | Homepage | Rewrite "Features Grid" (remove Loyalty, Promotions, AI) | 1 hour |
| 12 | Homepage | Rewrite "How It Works" Step 2 (remove AI Menu Builder) | 15 min |
| 13 | Homepage | Rewrite Hero Slide 3 (soften AI claims) | 15 min |
| 14 | Homepage | Rewrite Pricing Preview (soften AI insights) | 15 min |
| 15 | Homepage | Rewrite Product Trust (soften AI card) | 15 min |
| 16 | Footer | Remove or change "Store" link | 15 min |
| 17 | Dashboard | Add Auto-Reorder to sidebar | 30 min |

### MEDIUM (Nice to have before launch)

| # | Surface | Change | Effort |
|---|---------|--------|--------|
| 18 | Homepage | Add "Low-Stock Push Alerts" to Features grid | 15 min |
| 19 | Discovery | Add logo display, city filter, sort options | < 1 day |
| 20 | Signup | Add referral code field | 1 hour |
| 21 | Service Terms | Fix multi-branch "Inventory Transfer" claim | 15 min |

---

*Document generated: July 26, 2026*
