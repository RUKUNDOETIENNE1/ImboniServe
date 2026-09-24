# HOMEPAGE_NAVIGATION_REVIEW — Founder Acceptance

**Date:** 2026-06-30  
**Production URL:** https://imboniserve.com  
**Scope:** All navigation items visible on Homepage

---

## Navigation Structure (Production)

### Top Navigation Bar

| Item | Type | Destination | Visibility Recommendation | Reason |
|---|---|---|---|---|
| **Logo** | Link | `/` (Home) | ✅ Keep | Standard |
| **Features** | Link | `/#features` | ✅ Keep | Core navigation |
| **Pricing** | Link | `/#pricing` | ✅ Keep | Core navigation |
| **Solutions** | Dropdown | (see below) | ⚠️ Modify | Contains dashboard links |
| **Store** | Link | `/#store` | ⚠️ Founder Decision | Deployment availability decision |
| **Share & earn rewards** | Button | `/refer` | ⚠️ Founder Decision | Deployment availability decision |
| **Discover** | Link | `/discover` | ⚠️ Founder Decision | Has localization bugs |
| **Contact** | Link | `https://wa.me/250735214496` | ⚠️ Modify | Hardcoded number |
| **Dark Mode Toggle** | Button | (theme toggle) | ✅ Keep | UX feature |
| **Language Switcher** | Dropdown | (locale change) | ✅ Keep | Localization feature |
| **Sign in** | Link | `/login` | ✅ Keep | Core CTA |
| **Start Free Trial** | Button | `/signup` | ✅ Keep | Primary CTA |

---

## Solutions Dropdown Items

| Item | Destination | Current Status | Visibility Recommendation | Reason |
|---|---|---|---|---|
| **Site Builder** | `/dashboard/site-builder` | ❌ Dashboard-only | **Remove** | Requires authentication |
| **Marketplace** | `/discover` | ⚠️ Public but buggy | **Remove or Fix** | Hardcoded cities |
| **Store** | `/store` | ⚠️ Public | **Founder Decision** | Deployment availability |
| **List Your Business** | `/dashboard/profile` | ❌ Dashboard-only | **Remove** | Requires authentication |
| **Referral Program** | `/refer` | ⚠️ Public | **Founder Decision** | Deployment availability |

---

## Hero Section CTAs

| CTA | Destination | Visibility Recommendation | Reason |
|---|---|---|---|
| **Start 14-Day Free Trial** | `/signup` | ✅ Keep | Primary conversion goal |
| **Book a Demo** | (unknown) | ⚠️ Verify or Remove | May not be supported |
| **Explore Businesses Near You** | `/discover` | ⚠️ Remove or Fix | Discover has bugs |
| **View Pricing** | `/#pricing` | ✅ Keep | Core navigation |
| **Install App** | (PWA install) | ⚠️ Modify | May distract from signup |

---

## Feature Section Links

### "Real-Time Operating System" Cards

| Card | Link | Visibility Recommendation | Reason |
|---|---|---|---|
| Every Sale, Live | `/dashboard` | ❌ Remove Link | Requires authentication |
| QR Performance by Table | `/dashboard/qr-analytics` | ❌ Remove Link | Requires authentication |
| Tables & Sections Status | `/dashboard/tables` | ❌ Remove Link | Requires authentication |
| Peak Hours & Flow | `/dashboard/analytics/peak-hours` | ❌ Remove Link | Requires authentication |
| Unified Orders | `/dashboard/orders/unified` | ❌ Remove Link | Requires authentication |

**Recommendation:** Make these cards informational only (no links) or replace with anchor links to feature explanations.

---

### "Growth & Retention" Cards

| Card | Link | Visibility Recommendation | Reason |
|---|---|---|---|
| Customer CRM (RFM) | `/dashboard/crm` | ❌ Remove Link | Requires authentication |
| Automated WhatsApp Campaigns | `/dashboard/campaigns` | ❌ Remove Link | Requires authentication |
| Menu A/B Testing | `/dashboard/ab-testing` | ❌ Remove Link | Requires authentication |
| Voice Ordering (WhatsApp AI) | `/dashboard/ai` | ❌ Remove Link | Requires authentication |
| Low-Stock Push Alerts | `/dashboard/inventory-alerts` | ❌ Remove Link | Requires authentication |
| Deposits & Reservations | `/dashboard/reservations` | ❌ Remove Link | Requires authentication |

**Recommendation:** Same as Real-Time OS cards — remove links or make informational only.

---

## Footer Navigation

| Section | Items | Visibility Recommendation | Reason |
|---|---|---|---|
| **Quick Links** | Sign in, Sign up, Pricing, Discover, Store, FAQs, Contact | ⚠️ Review | Mirror header decisions |
| **Legal** | Terms, Privacy, Cookies, Cookie Preferences, Service Terms | ✅ Keep All | Required for compliance |
| **Social** | (if present) | ✅ Keep | Standard |

---

## Recommended Navigation Structure (RC1)

### Top Navigation (Simplified)

**Desktop:**
```
[Logo] | Features | Pricing | FAQs | Contact | [Language] | [Dark Mode] | Sign in | [Start Free Trial]
```

**Mobile:**
```
[Logo] | [Menu Button]
  └─ Features
  └─ Pricing
  └─ FAQs
  └─ Contact
  └─ Sign in
  └─ Start Free Trial
```

**Removed:**
- Solutions dropdown (contains dashboard links)
- Store (unless approved for RC1)
- Discover (unless fixed)
- Share & earn rewards button (unless approved for RC1)

---

### Hero CTAs (Simplified)

**Primary CTA:** Start 14-Day Free Trial  
**Secondary CTA:** View Pricing  
**Tertiary CTA:** (Optional) Contact Sales or Chat with Us

**Removed:**
- Book a Demo (unless verified as supported)
- Explore Businesses Near You (unless Discover is fixed)
- Install App (move to less prominent position)

---

## Visibility Decision Matrix

| Item | Keep | Hide | Remove | Founder Decision Required |
|---|:---:|:---:|:---:|:---:|
| Features link | ✅ | | | |
| Pricing link | ✅ | | | |
| FAQs link | ✅ | | | |
| Contact link | ✅ (fix hardcoded number) | | | |
| Solutions dropdown | | | ✅ | |
| Site Builder link | | | ✅ | |
| List Your Business link | | | ✅ | |
| Store link | | | | ✅ |
| Discover link | | | | ✅ |
| Referral Program link | | | | ✅ |
| Dashboard feature links | | | ✅ | |
| Book Demo CTA | | | | ✅ |
| Explore Businesses CTA | | | ✅ (unless Discover fixed) | |

---

## Implementation Checklist

### Phase 1: Remove Dashboard Links (P0)
- [ ] Remove `/dashboard/site-builder` from Solutions dropdown
- [ ] Remove `/dashboard/profile` from Solutions dropdown
- [ ] Remove all dashboard links from Real-Time OS cards
- [ ] Remove all dashboard links from Growth & Retention cards

### Phase 2: Fix Hardcoded Localization (P0)
- [ ] Replace hardcoded WhatsApp number with environment variable
- [ ] Make contact information configurable

### Phase 3: Founder Decisions (P0)
- [ ] Decide: Keep or hide Store link?
- [ ] Decide: Keep or hide Discover link?
- [ ] Decide: Keep or hide Referral Program link?
- [ ] Decide: Keep or remove Book Demo CTA?
- [ ] Decide: Keep or remove Explore Businesses CTA?

### Phase 4: Simplify Navigation (P1)
- [ ] Remove Solutions dropdown entirely
- [ ] Add FAQs link to top navigation
- [ ] Ensure mobile navigation mirrors desktop decisions

---

## Global-by-Design Alignment

### ✅ Correct Navigation Items
- Features (universal capability)
- Pricing (universal capability)
- Sign in / Sign up (universal)
- Language switcher (localization feature)

### ❌ Navigation Items Violating Global-by-Design
- Hardcoded WhatsApp contact number (should be configurable)
- Dashboard links in public navigation (architectural error)

### ⚠️ Navigation Items Requiring Founder Decision
- Store (core capability, but deployment availability decision)
- Discover (core capability, but has localization bugs)
- Referral Program (core capability, but deployment availability decision)

---

*End of Homepage Navigation Review.*
