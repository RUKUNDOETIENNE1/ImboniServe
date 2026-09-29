# ImboniServe RC1 — Founder Acceptance Review
## Phase 1: Public Website Certification

**Date:** 2026-06-30  
**Scope:** Public-facing marketing + public discovery/marketplace surfaces (no auth/dashboard review)  
**Implementation policy:** Findings + recommendations only. **No code changes** without explicit Founder approval.

**Source of truth note:** This review is based on the RC1 repository implementation. If you provide the deployed public URL, I will spot-check the deployed pages for any drift.

---

## Architectural Principle (Global-by-Design)

ImboniServe is a **global hospitality platform** with configurable localization.

- **Core Platform:** Universal restaurant operations (POS, QR ordering, KDS, inventory, recipes, consumption engine, reporting, AI, CRM, reservations, loyalty, staff management) — these work anywhere, no country assumptions.
- **Localization Layer:** Taxes, fiscal compliance, currencies, payment providers, languages, date/time formats, receipt layouts, regional regulations — these are **configuration**, not hardcoded behavior.
- **Deployment Availability:** Current operational integrations (which payment providers are live, which fiscal integrations are enabled) — this is distinct from platform capability.

All recommendations in this report align with this principle.

---

## Executive Summary (What a restaurant owner sees first)

The public website **communicates a strong "Restaurant Operating System" story**, but it is **not yet certification-clean** for Founder Acceptance due to a small number of **high-impact experience/credibility issues**:

### P0 (Must-fix for Phase 1 certification)
1. **FAQ page likely renders translation keys instead of real questions/answers**, despite having an in-file `faqs` array. <ref_snippet file="C:/Dev/ImboniResto/src/pages/faq.tsx" lines="32-62" /> <ref_snippet file="C:/Dev/ImboniResto/src/pages/faq.tsx" lines="118-146" />
2. **Public navigation exposes dashboard-only links** (Site Builder, List Your Business) in a public "Solutions" dropdown, creating a mismatch between "public marketing" vs "authenticated product." <ref_snippet file="C:/Dev/ImboniResto/src/components/PublicLayout.tsx" lines="86-116" />
3. **Legal pages hardcode country-specific tax/regulatory claims** (RRA/EBM/VAT 18%) instead of treating these as configurable localization. This conflicts with the Global-by-Design architecture. <ref_snippet file="C:/Dev/ImboniResto/src/pages/terms.tsx" lines="79-113" /> <ref_snippet file="C:/Dev/ImboniResto/src/pages/privacy.tsx" lines="64-108" />


### P1 (Should-fix for a credible RC1 public site)
4. **Payments provider references assume a single provider** (IremboPay) instead of describing configurable payment integrations. <ref_snippet file="C:/Dev/ImboniResto/src/pages/terms.tsx" lines="107-113" /> <ref_snippet file="C:/Dev/ImboniResto/src/pages/privacy.tsx" lines="64-74" />
5. **Public pages use native `alert()`** in some flows (referrals, discovery feed), which degrades polish/consistency. <ref_snippet file="C:/Dev/ImboniResto/src/pages/refer/index.tsx" lines="42-57" /> <ref_snippet file="C:/Dev/ImboniResto/src/pages/discover/feed.tsx" lines="86-94" />
6. **Discover page hardcodes a single country's city list** instead of deriving locations dynamically from business data. This is a localization bug, not a positioning choice. <ref_snippet file="C:/Dev/ImboniResto/src/pages/discover/index.tsx" lines="17-20" />
7. **Affiliate Program page has a non-functional apply flow** (TODO; sets submitted state only). This is a credibility risk if visible/marketed. <ref_snippet file="C:/Dev/ImboniResto/src/pages/affiliate/program.tsx" lines="16-25" />

---

## Pages Reviewed (Phase 1)

### Core marketing + legal
- `/` (Home) <ref_file file="C:/Dev/ImboniResto/src/pages/index.tsx" />
- `/pricing` <ref_file file="C:/Dev/ImboniResto/src/pages/pricing.tsx" />
- `/faq` <ref_file file="C:/Dev/ImboniResto/src/pages/faq.tsx" />
- `/terms` <ref_file file="C:/Dev/ImboniResto/src/pages/terms.tsx" />
- `/privacy` <ref_file file="C:/Dev/ImboniResto/src/pages/privacy.tsx" />
- `/cookies` <ref_file file="C:/Dev/ImboniResto/src/pages/cookies.tsx" />
- `/service-terms` <ref_file file="C:/Dev/ImboniResto/src/pages/service-terms.tsx" />

### Public growth / public discovery
- `/discover` <ref_file file="C:/Dev/ImboniResto/src/pages/discover/index.tsx" />
- `/discover/map` <ref_file file="C:/Dev/ImboniResto/src/pages/discover/map.tsx" />
- `/discover/[slug]` <ref_file file="C:/Dev/ImboniResto/src/pages/discover/[slug].tsx" />
- `/discover/feed` <ref_file file="C:/Dev/ImboniResto/src/pages/discover/feed.tsx" />
- `/store` and `/store/*` <ref_file file="C:/Dev/ImboniResto/src/pages/store/index.tsx" />
- `/refer` <ref_file file="C:/Dev/ImboniResto/src/pages/refer/index.tsx" />
- `/affiliate/program` <ref_file file="C:/Dev/ImboniResto/src/pages/affiliate/program.tsx" />
- `/unsubscribe` <ref_file file="C:/Dev/ImboniResto/src/pages/unsubscribe.tsx" />

### Shared public chrome
- Public header/footer: <ref_file file="C:/Dev/ImboniResto/src/components/PublicLayout.tsx" />

---

## Certification Verdict (Phase 1)

**Status:** **NOT CERTIFIED YET (P0 issues present)**

If the Founder approves the recommended changes in the approval checklist, Phase 1 can become certification-clean.

---

## Recommendations Summary (What to do next)

1. Decide what is **publicly visible in RC1** vs **feature-flagged/hidden** (Store, Discover Feed, Affiliate Program).  
2. Update legal pages to use **Global-by-Design wording** — taxes, fiscal compliance, and payment providers are configurable localization, not hardcoded country assumptions.  
3. Fix public navigation to avoid linking to authenticated dashboard surfaces.  
4. Fix translation usage on FAQ so content renders correctly; add missing locale keys for consistent public messaging.

---

*End of Phase 1 certification report (findings + recommendations only).*
