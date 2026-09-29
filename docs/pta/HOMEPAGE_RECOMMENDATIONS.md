# Homepage Recommendations

**Platform:** ImboniServe  
**Date:** July 26, 2026  
**File Audited:** `src/pages/index.tsx` (1248 lines)  

---

## 1. Section-by-Section Review

### 1.1 Hero Carousel (lines 320-420)

**Content:** 4 rotating slides — "The Operating System for Hospitality", "Smart QR Ordering", "AI-Powered Insights", "All-in-One Platform"

| Slide | Claim | Verdict | Recommendation |
|-------|-------|---------|----------------|
| Slide 1 | "The Operating System for Hospitality" | ✅ Accurate | **Keep** |
| Slide 2 | "Smart QR Ordering — Zero Wait Time" | ✅ Accurate | **Keep** |
| Slide 3 | "AI-Powered Insights — Data-Driven Growth" | 🟡 Partial — AI insights are Early Access | **Rewrite** — change to "AI-Powered Insights — Coming Soon" or remove AI reference |
| Slide 4 | "All-in-One Platform — POS, QR, Inventory, Analytics" | ✅ Accurate | **Keep** |

**CTAs:** "Start Free 14-Day Trial" ✅ | "Talk to Our Team" ✅ | "View Pricing" ✅

**Recommendation:** Keep hero carousel. Minor rewrite on Slide 3 to soften AI claims.

---

### 1.2 Real-Time OS Carousel (lines 422-461)

**Content:** 5 cards — Every Sale Live, QR Performance by Table, Tables & Sections Status, Peak Hours & Flow, Unified Orders

| Card | Claim | Verdict | Recommendation |
|------|-------|---------|----------------|
| Every Sale, Live | "Watch revenue tick in real-time" | ✅ Accurate | **Keep** |
| QR Performance by Table | "See which table or QR drives the most orders" | ✅ Accurate | **Keep** |
| Tables & Sections Status | "Know what's occupied, waiting, or free" | ✅ Accurate | **Keep** |
| Peak Hours & Flow | "Plan staffing with hourly demand patterns" | ✅ Accurate | **Keep** |
| Unified Orders | "Track dine-in, takeaway, and delivery in one feed" | ✅ Accurate | **Keep** |

**Recommendation:** **Keep entire section.** All claims are production-ready.

---

### 1.3 Auto-Growth Engines Carousel (lines 463-501)

**Content:** 6 cards — Customer CRM (RFM), Automated WhatsApp Campaigns, Menu A/B Testing, Voice Ordering (WhatsApp AI), Low-Stock Push Alerts, Deposits & Reservations

| Card | Claim | Verdict | Recommendation |
|------|-------|---------|----------------|
| Customer CRM (RFM) | "Segment customers into Champions, Loyal, and At-Risk" | 🟡 Feature-flagged, not in V1 sidebar | **Hide** — move to "Coming Soon" |
| Automated WhatsApp Campaigns | "Target segments with personalized messages" | 🔵 Not production-ready | **Hide** — move to roadmap |
| Menu A/B Testing | "Test price, copy, and visuals. Pick winners with data." | 🔵 Not production-ready | **Hide** — move to roadmap |
| Voice Ordering (WhatsApp AI) | "Let customers order by voice in EN / FR / RW" | 🔵 Not production-ready | **Hide** — move to roadmap |
| Low-Stock Push Alerts | "Never run out. Get alerted before you do." | ✅ Production-ready | **Keep** |
| Deposits & Reservations | "Cut no-shows with smart deposits & confirmations" | 🔴 Deposits not implemented | **Remove** — reservations work, deposits don't |

**Recommendation:** **Remove entire "Auto-Growth Engines" carousel.** Only 1 of 6 cards is production-ready. Replace with a "Coming Soon" section or remove entirely.

---

### 1.4 Supplier Marketplace Section (lines 504-526)

**Content:** "Connect with trusted suppliers — all in one place" with "Coming Soon — Early Access" badge

| Claim | Verdict | Recommendation |
|-------|---------|----------------|
| "Discover verified suppliers, compare prices, and streamline procurement" | 🟡 Partial — store exists but no supplier onboarding | **Keep** — already labeled "Coming Soon" |
| "Coming Soon — Early Access" badge | ✅ Honest | **Keep** |

**Recommendation:** **Keep.** Already correctly labeled as coming soon.

---

### 1.5 Video Demo (lines 528-561)

**Content:** YouTube video embed with "See Imboni Serve in Action"

**Recommendation:** **Keep.** Video demo is accurate.

---

### 1.6 How It Works (lines 563-662)

**Content:** 6 steps — Create Account, Build Menu, Set Up Tables & QR, Connect WhatsApp & Payments, Track Inventory & Costs, Go Live & Grow

| Step | Claim | Verdict | Recommendation |
|------|-------|---------|----------------|
| Step 1: Create Your Account | "Sign up in 2 minutes" | ✅ Accurate | **Keep** |
| Step 2: Build Your Menu | "Use our AI Menu Builder to upload a photo or PDF" | 🔵 AI Menu Builder is roadmap | **Rewrite** — remove AI Menu Builder reference, keep manual menu building |
| Step 3: Set Up Tables & QR Codes | "Generate unique QR codes for each table" | ✅ Accurate | **Keep** |
| Step 4: Connect WhatsApp & Payments | "Link your WhatsApp number... Enable payment methods" | ✅ Accurate | **Keep** |
| Step 5: Track Inventory & Costs | "Set reorder points... AI-powered alerts" | ✅ Accurate (ORRS verified) | **Keep** |
| Step 6: Go Live & Grow | "Customers scan QR codes to order, kitchen gets real-time alerts" | ✅ Accurate | **Keep** |

**Recommendation:** **Rewrite Step 2** to remove AI Menu Builder reference.

---

### 1.7 Stats Section (lines 664-696)

**Content:** 4 stats — "500+ Businesses served", "10,000+ Orders processed", "14 days free trial", "50+ Features included"

| Stat | Verdict | Recommendation |
|------|---------|----------------|
| "500+ Businesses served" | 🔴 Fabricated | **Remove** |
| "10,000+ Orders processed" | 🔴 Fabricated | **Remove** |
| "14 days free trial, no card needed" | ✅ Accurate | **Keep** |
| "50+ Features included" | 🟡 Misleading count | **Remove** or change to "30+ features" |

**Recommendation:** **Remove fabricated stats.** Replace with: "14-Day Free Trial", "No Credit Card Needed", "Built for Rwanda", "Founding Program Available".

---

### 1.8 Features Grid (lines 698-801)

**Content:** 12 feature cards

| Feature Card | Verdict | Recommendation |
|-------------|---------|----------------|
| QR Code Ordering | ✅ Production-ready | **Keep** |
| Inventory & Procurement | ✅ Production-ready | **Keep** |
| Reports & Analytics | ✅ Production-ready | **Keep** |
| AI-Powered Insights | 🟡 Early Access | **Rewrite** — add "Early Access" label |
| Content & Discovery Feed | 🟡 Partial — discovery works, content feed limited | **Rewrite** — focus on discovery listing |
| Smart Dining Slips™ | ✅ Production-ready | **Keep** |
| Loyalty & Rewards | 🟡 Feature-flagged | **Rewrite** — add "Early Access" label or remove |
| Promotions & Happy Hours | 🟡 Feature-flagged | **Rewrite** — add "Early Access" label or remove |
| WhatsApp Integration | ✅ Production-ready (notifications) | **Keep** |
| Mobile Money Payments | ✅ Production-ready | **Keep** |
| Multi-Branch Control | ✅ Production-ready | **Keep** |
| Role-Based Access | ✅ Production-ready | **Keep** |

**Recommendation:** **Rewrite** — remove or label Loyalty, Promotions, AI Insights, and Content Feed as "Early Access." Keep the 8 production-ready cards.

---

### 1.9 Pricing Preview (lines 804-889)

**Content:** Starting at price, all plans include, enterprise note, founding program note

| Claim | Verdict | Recommendation |
|-------|---------|----------------|
| "Starting at 15,000 RWF / month" | ✅ Accurate | **Keep** |
| "Annual billing saves 25%" | ✅ Accurate | **Keep** |
| "QR ordering, POS, and kitchen operations" | ✅ Accurate | **Keep** |
| "Inventory and procurement management" | ✅ Accurate | **Keep** |
| "WhatsApp integration and mobile money payments" | ✅ Accurate | **Keep** |
| "AI-powered insights and reporting" | 🟡 Partial | **Rewrite** — "Reporting and early-access AI insights" |
| "Founding Restaurant Program members receive 50% lifetime discount" | ✅ Accurate | **Keep** |

**Recommendation:** **Keep with minor rewrite** on AI-powered insights claim.

---

### 1.10 Product Trust Section (lines 891-971)

**Content:** 6 trust cards — Fully Auditable Inventory, Accurate Food Costs, Role-Based Protection, Fully Integrated Operations, Global Platform, AI Built on Real Data

| Card | Verdict | Recommendation |
|------|---------|----------------|
| Fully Auditable Inventory | ✅ Accurate | **Keep** |
| Accurate Food Costs | ✅ Accurate | **Keep** |
| Role-Based Protection | ✅ Accurate | **Keep** |
| Fully Integrated Operations | ✅ Accurate | **Keep** |
| Global Platform, Local Configuration | ✅ Accurate | **Keep** |
| AI Built on Real Data | 🟡 Partial — AI is Early Access | **Rewrite** — soften to "Data-Driven Recommendations" |

**Recommendation:** **Keep with minor rewrite** on AI card.

---

### 1.11 Founding Restaurant Program (lines 973-1079)

**Content:** 4 benefits — 50% Lifetime Discount, Direct Founder Support, Early Access to New Capabilities, Shape Platform Development

**Recommendation:** **Keep.** All claims are accurate and honest.

---

### 1.12 Advanced Features Section (lines 1081-1149)

**Content:** 6 cards — Hotel Mode, Site Builder, AI Menu Builder, Discovery Marketplace, Referral Program, Staff & Roles

| Card | Verdict | Recommendation |
|------|---------|----------------|
| Hotel Mode | 🔵 Roadmap | **Remove** from this section |
| Site Builder | 🔵 Roadmap | **Remove** from this section |
| AI Menu Builder | 🔵 Roadmap | **Remove** from this section |
| Discovery Marketplace | 🟡 Partial | **Rewrite** — label as "Early Access" |
| Referral Program | 🟢 Production-ready (minor polish) | **Keep** |
| Staff & Roles | ✅ Production-ready | **Keep** |

**Recommendation:** **Rewrite** — keep only Referral Program, Staff & Roles, and Discovery (with Early Access label). Move Hotel Mode, Site Builder, and AI Menu Builder to a "Coming Soon" section or remove.

---

### 1.13 Discovery Marketplace Section (lines 1151-1201)

**Content:** "Get discovered by customers looking for great experiences" with browse and claim CTAs

**Recommendation:** **Keep.** Discovery page works and businesses can be listed.

---

### 1.14 Payment Methods Section (lines 1203-1219)

**Content:** "Rwanda-Ready Payments" — MTN MoMo, Airtel Money, Cash, Card / POS, IremboPay

| Method | Verdict | Recommendation |
|--------|---------|----------------|
| MTN MoMo | ✅ Production-ready | **Keep** |
| Airtel Money | ✅ Production-ready | **Keep** |
| Cash | ✅ Production-ready | **Keep** |
| Card / POS | 🟡 Not fully implemented | **Remove** or label as "Coming Soon" |
| IremboPay | ✅ Production-ready | **Keep** |

**Recommendation:** **Remove "Card / POS"** or label as "Coming Soon."

---

### 1.15 Final CTA (lines 1221-1244)

**Content:** "Ready to grow your business? Join 500+ hospitality businesses across Rwanda"

**Recommendation:** **Rewrite** — remove "500+" claim. Change to "Ready to grow your business? Start your free 14-day trial today."

---

## 2. Summary of Required Changes

| Priority | Section | Action | Lines |
|----------|---------|--------|-------|
| **CRITICAL** | Stats Section | Remove fabricated stats | 664-696 |
| **CRITICAL** | Auto-Growth Engines Carousel | Remove entire section | 463-501 |
| **CRITICAL** | Final CTA | Remove "500+" claim | 1226 |
| **HIGH** | Advanced Features | Remove Hotel Mode, Site Builder, AI Menu Builder | 1081-1149 |
| **HIGH** | Features Grid | Remove or label Loyalty, Promotions, AI Insights | 698-801 |
| **HIGH** | How It Works Step 2 | Remove AI Menu Builder reference | 596-598 |
| **HIGH** | Payment Methods | Remove "Card / POS" | 1209 |
| **MEDIUM** | Hero Slide 3 | Soften AI claims | 350-356 |
| **MEDIUM** | Pricing Preview | Soften AI insights claim | 856 |
| **MEDIUM** | Product Trust | Soften AI card | 960-967 |
| **LOW** | Features Grid | Label Content & Discovery as "Early Access" | 744-750 |

---

*Recommendations generated: July 26, 2026*
