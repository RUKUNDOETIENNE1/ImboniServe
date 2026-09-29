# PUBLIC_NAVIGATION_RECOMMENDATIONS — Phase 1

**Date:** 2026-06-30

This document reviews **what is currently visible** in public navigation (header/footer) and recommends what should remain visible in RC1.

---

## Architectural Principle (Global-by-Design)

ImboniServe is a **global hospitality platform** with configurable localization.

Navigation recommendations are based on:
1. **Core platform capabilities** — universally applicable features.
2. **Localization capabilities** — configurable per business/region.
3. **Deployment availability** — what is currently operational.

Navigation should communicate the global platform story while accurately representing current deployment availability.

---

## 1) Current Public Header (PublicLayout)

Evidence: <ref_snippet file="C:/Dev/ImboniResto/src/components/PublicLayout.tsx" lines="80-145" />

Current top-level items:
- Features (`/#features`)
- Pricing (`/pricing`)
- Solutions (dropdown)
- Store anchor (`/#store`)
- Referral CTA (`/refer`)
- Discover (`/discover`)
- Contact (WhatsApp link)
- Sign in (`/login`)
- Start Free Trial (`/signup`)

Solutions dropdown items:
- Site Builder → `/dashboard/site-builder`
- Marketplace → `/discover`
- Store → `/store`
- List Your Business → `/dashboard/profile`
- Referral Program → `/refer`

---

## 2) Recommended RC1 Public Header

**Visible in RC1 (recommended):**
- Home
- Features (scroll)
- Pricing
- FAQs
- Contact
- Sign in
- Start Free Trial

**Remove from navigation only (route preserved):**
- "Solutions" dropdown entries that route into authenticated dashboard: `/dashboard/site-builder`, `/dashboard/profile` (keep feature pages behind auth, but do not surface in public nav).

**Feature Flag / Optional visibility (Founder decision):**
- Discover (`/discover`) — keep only if public directory is part of RC1 story.
- Store (`/store`) — keep only if procurement marketplace is part of RC1 story.
- Referral CTA (`/refer`) — keep only if referral program is ready.

**Contact link:**
- Replace hardcoded WhatsApp number with config-driven value. <ref_snippet file="C:/Dev/ImboniResto/src/components/PublicLayout.tsx" lines="132-134" />
- This is a localization concern — contact channels should be configurable.

---

## 3) Current Public Footer (PublicLayout)

Evidence: <ref_snippet file="C:/Dev/ImboniResto/src/components/PublicLayout.tsx" lines="156-193" />

Footer items:
- Sign in, Sign up, Pricing, Discover, Store anchor, FAQs, Contact
- Terms, Privacy, Cookies, Cookie Preferences, Service Terms

### Recommendation
- Keep legal links visible.
- Mirror header decisions for Discover/Store/Referral.

---

## 4) Pages with Custom Navigation (Inconsistent Chrome)

- `/discover` has its own header and does not use PublicLayout. <ref_file file="C:/Dev/ImboniResto/src/pages/discover/index.tsx" />
- `/discover/feed` has its own header. <ref_file file="C:/Dev/ImboniResto/src/pages/discover/feed.tsx" />
- `/store` has its own header and shows Dashboard CTA. <ref_file file="C:/Dev/ImboniResto/src/pages/store/index.tsx" />

### Recommendation
For RC1 public website consistency:
- Prefer a single public chrome (PublicLayout) **or** explicitly brand these as separate "consumer discovery" surfaces and remove from the main restaurant-owner marketing nav.

---

## 5) Proposed RC1 Public Navigation (Simple)

**Header:** Home | Features | Pricing | FAQs | Contact | Sign in | Start Free Trial  
**Footer:** Same + Terms | Privacy | Cookie Policy | Service Terms | Cookie Preferences

---

## 6) Global-by-Design Alignment Notes

- Navigation should not imply geographic restriction.
- "Discover" and "Store" are **core platform capabilities** (marketplace, discovery) — they are not localization.
- The decision to show/hide them in RC1 is a **deployment availability** decision, not an architectural one.
- Contact information is **localization** — should be configurable, not hardcoded.

---

*End of navigation recommendations (aligned with Global-by-Design philosophy).*
