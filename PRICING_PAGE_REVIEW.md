# PRICING_PAGE_REVIEW

**Date:** 2026-07-02  
**Page Reviewed:** Pricing (`/pricing`)  
**Review Lens:** First-time restaurant owner deciding whether to subscribe  
**Scope:** Certification review only (no implementation changes)

---

## Executive Assessment

The Pricing page communicates real product breadth and supports multiple business sizes, but it is not yet founder-certification ready in current form. The core commercial model can be understood, yet confidence and clarity are reduced by mixed messages, inconsistent naming, and heavy cognitive load.

**Overall Read:** Strong potential, currently needs targeted messaging cleanup and structure clarity before full approval.

---

## 1) First Impression

### What works
- The page has clear visual hierarchy at the top (headline, billing toggle, plan cards).
- Prices are visible early.
- Currency selector supports localized display expectations.

### What hurts confidence
- “Launch Special: 50% OFF All Plans” dominates above the plans and conflicts with premium/trust posture.
- “Unified. Intelligent. Reliable.” reads like generic marketing jargon rather than purchase guidance.
- The page is dense: first-time owners must parse too many feature bullets before understanding fit.

**Customer effect:** “I can see prices, but I’m not fully sure what I should choose or what is truly included for my business stage.”

---

## 2) Plan Structure and Progression

## Current commercial model requested for review
- Starter — 15,000/month
- Professional — 35,000/month
- Business — 75,000/month
- Premium — 200,000/month
- Enterprise — Custom

## What the page currently communicates
- Plan labels and progression are visually present.
- “Most Popular” and “Multi-Branch” badges attempt to guide movement upward.

## Gaps in progression clarity
- Plan naming is inconsistent across code and copy (e.g., Essentials appears where Starter framing is expected).
- Descriptions do not consistently answer “who is this for right now?”
- Upgrades read as long feature accumulation, not clear business-stage transitions.

**Customer effect:** perceived progression exists, but selection confidence is weaker than it should be.

---

## 3) Annual Billing Clarity (“Save 25% = 3 free months”)

### Current status
- “Save 25%” appears in the annual toggle and per-plan annual states.
- Savings are shown as a currency delta per year.

### Clarity issue
- The explicit equivalence “3 free months” is not made primary in the decision moment.

**Customer effect:** some owners understand savings mathematically, but many miss the simpler mental model.

---

## 4) Plan Comparison UX

### What works
- Full feature lists provide transparency.

### Friction points
- Feature lists are too long for first-pass decision-making.
- Several features are technical and read like implementation detail, not outcomes.
- “Why upgrade” is implied, not clearly narrated in plain owner language.

**Customer effect:** comparison is possible but tiring; selection may stall or default to cheapest plan without confidence.

---

## 5) Messaging Quality (Headlines, CTAs, Explanations)

### Strengths
- Core CTA (“Choose [Plan]”) is direct.
- Trial/no-card reassurance appears at bottom.

### Issues
- Promotional voice and premium voice are mixed on the same screen.
- Some phrasing is generic or jargon-heavy.
- Minor translation artifacts/emojis in labels reduce polish and trust tone.

**Customer effect:** page feels partly enterprise-ready, partly campaign-ready; this inconsistency can reduce conversion confidence.

---

## 6) Global-by-Design Consistency

### Positive
- Currency selector exists.
- Currency conversion/display model is configurable.

### Misalignment
- Public pricing copy still includes country-specific references (e.g., “for Rwanda”) in pricing locale content.
- Some feature and promo language implies market-specific assumptions.

**Customer effect:** global positioning is partially credible, but not consistently expressed in pricing messaging.

---

## 7) Commercial Accuracy (Presentation only)

### Positive
- Pricing structure is present and tiered.
- Annual and monthly display logic is implemented.

### Risks in communication
- Conflicting plan terminology and duplicated/legacy copy can confuse source-of-truth interpretation.
- Promotional overlays may distract from base pricing understanding.

**Customer effect:** model can be interpreted, but buyers may question whether what they see is stable and final.

---

## Founder Certification Summary

From a first-time owner perspective:
- I can find plans and prices.
- I cannot quickly and confidently map “my business stage” to “my best plan” without extra effort.
- I receive mixed signals (premium product vs campaign-heavy language).

**Conclusion:** close to approval quality, but not yet at the same narrative clarity standard as the finalized Homepage.

---

## Evidence References (code/content reviewed)

- `src/pages/pricing.tsx` (headline, promo badge, billing toggle, plan cards, CTA, footer reassurance)
- `src/config/pricing.ts` (plan structure and pricing data source)
- `src/locales/en.json` (`pricing` blocks including legacy/country-specific and promotional strings)
- `src/locales/rw.json` (`pricing` blocks and messaging variants)
- `src/locales/fr.json` (`pricing` blocks and messaging variants)
