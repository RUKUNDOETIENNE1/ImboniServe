# PUBLIC_PAGE_REVIEW_MATRIX — Phase 1 (Public Website)

**Date:** 2026-06-30

---

## Architectural Principle (Global-by-Design)

ImboniServe is a **global hospitality platform** with configurable localization.

- **Core Platform:** Universal restaurant operations — work anywhere, no country assumptions.
- **Localization Layer:** Taxes, fiscal compliance, currencies, payment providers, languages — these are **configuration**.
- **Deployment Availability:** Current operational integrations — distinct from platform capability.

All recommendations in this matrix align with this principle.

---

## Legend

- **Decision:** Keep | Hide | Admin Only | Feature Flag | Merge | Remove from navigation (route preserved)
- **Priority:** P0 (blocker), P1, P2
- **Layer:** Core (universal capability) | Localization (configurable) | Deployment (current availability)

---

## Public Pages Matrix

| Route | Source | Decision | Priority | Layer | Required updates | Reasoning / evidence |
|---|---|---:|---:|---|---|---|
| `/` | <ref_file file="C:/Dev/ImboniResto/src/pages/index.tsx" /> | Keep | P1 | Core | Verify feature claims match RC1 deployment availability; ensure messaging reflects global platform with configurable localization | Home is the first impression; should communicate global platform story.
| `/pricing` | <ref_file file="C:/Dev/ImboniResto/src/pages/pricing.tsx" /> | Keep | P1 | Core + Localization | Confirm pricing copy aligns with unified config; currency display should respect localization | Pricing uses unified config. <ref_file file="C:/Dev/ImboniResto/src/config/pricing.ts" />
| `/faq` | <ref_file file="C:/Dev/ImboniResto/src/pages/faq.tsx" /> | Keep | **P0** | Core | Fix rendering (currently uses missing translation keys for Q/A); update fee/commission/tax wording to reflect configurable localization | Likely displays `faq.items.X.q` keys. <ref_snippet file="C:/Dev/ImboniResto/src/pages/faq.tsx" lines="118-146" />
| `/terms` | <ref_file file="C:/Dev/ImboniResto/src/pages/terms.tsx" /> | Keep | **P0** | Localization | Replace hardcoded tax/EBM claims with configurable localization wording; replace single-provider payment references with configurable provider wording | Hardcoded localization. <ref_snippet file="C:/Dev/ImboniResto/src/pages/terms.tsx" lines="79-113" />
| `/privacy` | <ref_file file="C:/Dev/ImboniResto/src/pages/privacy.tsx" /> | Keep | **P0** | Localization | Replace hardcoded retention period with jurisdiction-agnostic wording; replace hardcoded provider names with configurable provider wording | Hardcoded localization. <ref_snippet file="C:/Dev/ImboniResto/src/pages/privacy.tsx" lines="64-108" />
| `/cookies` | <ref_file file="C:/Dev/ImboniResto/src/pages/cookies.tsx" /> | Keep | P1 | Core | Ensure listed analytics/marketing cookies match actual instrumentation | Cookie list includes FB Pixel, but code instrumentation not found.
| `/service-terms` | <ref_file file="C:/Dev/ImboniResto/src/pages/service-terms.tsx" /> | Keep | **P0** | Localization | Replace hardcoded compliance claims with configurable localization wording; audit refund/fee statements for accuracy | Contains hardcoded compliance assertions.
| `/discover` | <ref_file file="C:/Dev/ImboniResto/src/pages/discover/index.tsx" /> | Remove from navigation (route preserved) | P1 | Core + Localization | Replace hardcoded city list with dynamic data from business profiles; align nav/footer with PublicLayout | Hardcoded cities is a localization bug. <ref_snippet file="C:/Dev/ImboniResto/src/pages/discover/index.tsx" lines="17-20" />
| `/discover/map` | <ref_file file="C:/Dev/ImboniResto/src/pages/discover/map.tsx" /> | Hidden / Remove from navigation | P1 | Core | Decide whether "nearby map" is part of RC1 deployment availability; align chrome and messaging | Separate chrome; consumer-facing.
| `/discover/[slug]` | <ref_file file="C:/Dev/ImboniResto/src/pages/discover/[slug].tsx" /> | Hidden / Remove from navigation | P1 | Core + Localization | Align nav/footer; currency display should respect localization; ensure CTA is accurate | Separate chrome; hardcoded currency.
| `/discover/feed` | <ref_file file="C:/Dev/ImboniResto/src/pages/discover/feed.tsx" /> | Feature Flag / Hidden | P1 | Core | Replace native `alert()`; align nav; ensure content moderation & purpose in RC1 | Uses `alert`. <ref_snippet file="C:/Dev/ImboniResto/src/pages/discover/feed.tsx" lines="86-94" />
| `/store` | <ref_file file="C:/Dev/ImboniResto/src/pages/store/index.tsx" /> | Feature Flag / Remove from navigation | P1 | Core | Decide if procurement marketplace is part of RC1 deployment availability; align header with public brand | Marketplace is a core capability; visibility is deployment decision.
| `/store/cart` | <ref_file file="C:/Dev/ImboniResto/src/pages/store/cart.tsx" /> | Feature Flag / Hidden | P1 | Core | Same as store | Part of store flow.
| `/store/checkout` | <ref_file file="C:/Dev/ImboniResto/src/pages/store/checkout.tsx" /> | Feature Flag / Hidden | P1 | Core | Same as store | Part of store flow.
| `/store/orders` | <ref_file file="C:/Dev/ImboniResto/src/pages/store/orders.tsx" /> | Feature Flag / Hidden | P1 | Core | Same as store | Part of store flow.
| `/refer` | <ref_file file="C:/Dev/ImboniResto/src/pages/refer/index.tsx" /> | Keep (optional) | P1 | Core + Localization | Remove native `alert()`; reward amounts should be configurable localization; fix SSR usage of `window` | Uses alert; hardcoded reward amounts. <ref_snippet file="C:/Dev/ImboniResto/src/pages/refer/index.tsx" lines="42-57" />
| `/affiliate/program` | <ref_file file="C:/Dev/ImboniResto/src/pages/affiliate/program.tsx" /> | Hidden (route preserved) | **P0** | Core | Page currently implies functionality but apply is TODO; either implement later or mark "coming soon" | Non-functional submit. <ref_snippet file="C:/Dev/ImboniResto/src/pages/affiliate/program.tsx" lines="16-25" />
| `/affiliate` | <ref_file file="C:/Dev/ImboniResto/src/pages/affiliate/index.tsx" /> | Admin Only | P2 | Core | Remove native alerts/confirm when reviewed later; keep behind auth | Not a marketing page.
| `/unsubscribe` | <ref_file file="C:/Dev/ImboniResto/src/pages/unsubscribe.tsx" /> | Keep | P2 | Core | Confirm copy + support channels | Needed for compliance.
| `/404`, `/500` | <ref_file file="C:/Dev/ImboniResto/src/pages/404.tsx" /> | Keep | P2 | Core | Ensure tone consistent | Standard.

---

## Summary by Layer

### Core Platform Issues (Universal Capabilities)
- FAQ rendering bug
- Native `alert()` usage
- Non-functional affiliate apply flow
- Inconsistent chrome across discovery/store pages

### Localization Issues (Should Be Configuration)
- Hardcoded tax rates (18% VAT)
- Hardcoded fiscal compliance claims (RRA/EBM)
- Hardcoded payment provider names (IremboPay)
- Hardcoded data retention periods (7 years per RRA)
- Hardcoded city list (Rwanda cities)
- Hardcoded currency display (RWF)
- Hardcoded contact information (WhatsApp number)

### Deployment Availability Decisions (Founder Choice)
- Store/marketplace visibility
- Discover directory visibility
- Discovery feed visibility
- Referral program visibility

---

*Matrix complete for Phase 1 (aligned with Global-by-Design philosophy).*
