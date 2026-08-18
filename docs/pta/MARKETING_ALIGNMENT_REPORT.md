# Marketing Alignment Report

**Platform:** ImboniServe  
**Date:** July 26, 2026  
**Sprint:** Marketing Alignment Sprint (MAS)  
**Status:** FINAL  

---

## Executive Summary

The Product Truth Audit (PTA) identified 52 features across all public-facing surfaces. Of those, 29 are production-ready, 7 need minor polish, 6 are beta/limited access, 6 are roadmap, and 3 are fabricated or misleading.

The Marketing Alignment Sprint (MAS) reviewed every non-production feature against four guiding principles: Customer Trust, Evidence First, Finish Before Hiding, and Protect the Long-Term Vision.

### Key Findings

1. **3 critical trust issues** — Fabricated statistics, broken founding discount, and referral reward bug
2. **6 features should be completed before launch** — Total effort ~2 weeks
3. **6 features should be hidden until ready** — Keep implementation, remove from marketing
4. **6 features should move to Long-Term Vision** — Documented with re-entry criteria
5. **Imboni Partnership Program requires 4–8 days** to reach production quality — mandatory before launch
6. **17 marketing changes required** — 9 critical, 8 high priority

### Alignment Status

| Surface | Current State | Required Action |
|---------|--------------|-----------------|
| Homepage | 12 sections need changes | Rewrite 7, hide 3, keep 5 |
| Pricing | All 5 plan feature lists inaccurate | Rewrite all 5 |
| Navigation | 2 links to non-production features | Remove 2 |
| Footer | 1 link to non-production feature | Remove 1 |
| Service Terms | 1 code bug, 1 unverified claim | Fix code, verify claim |
| Dashboard | 1 verified feature hidden | Add to sidebar |
| Onboarding | No referral code field | Add field |
| Empty States | All accurate | No changes |

---

## Overall Findings

### Trust Issues (Critical)

| Issue | Impact | Fix |
|-------|--------|-----|
| "500+ Businesses served" | Fabricated — no data | Replace with honest messaging |
| "10,000+ Orders processed" | Fabricated — no data | Replace with honest messaging |
| Founding 50% discount not applied in billing | Promise broken at checkout | Add backend logic (1–3 days) |
| Referral reward 50 RWF instead of 1,000 RWF | 95% less than promised | Fix 1 line of code |
| Plan feature lists include non-existent features | Customer expectations mismatched | Rewrite all 5 lists |
| "Card / POS" in payment methods | Not implemented | Remove from homepage |

### Features to Complete Before Launch

| Feature | Effort | Why |
|---------|--------|-----|
| Founding Restaurant Program (backend) | 1–3 days | 50% discount promise is broken |
| Pricing Plan feature lists (rewrite) | < 1 day | Lists include non-existent features |
| Referral Program (fix + signup field) | < 1 day | Reward bug + no visible input |
| Discovery Page polish | < 1 day | Logo display, city filter, sort |
| Promotions & Happy Hours (complete flow) | 1 week | Core restaurant need |
| AI Draft PO (sidebar visibility) | < 1 day | Already verified, needs visibility |

**Total effort: ~2 weeks**

### Features to Hide Until Ready

| Feature | Current | Action |
|---------|---------|--------|
| CRM (RFM) | Feature-flagged | Remove from homepage, keep flag |
| Loyalty & Rewards | Feature-flagged | Remove from homepage, keep flag |
| Supplier Marketplace | "Coming Soon" | Keep label, remove from nav |
| WhatsApp Staff Ordering | Implemented but no setup | Remove from marketing |
| AI Insights Dashboard | Feature-flagged | Remove from homepage, keep flag |
| AI Menu Builder | Feature-flagged | Remove from "How It Works" |

### Features Moved to Long-Term Vision

| Feature | Target Version | Strategic Value |
|---------|---------------|-----------------|
| Site Builder | V2.0 | MEDIUM |
| Hotel Mode | V2.5 | HIGH |
| WhatsApp Campaigns | V2.0 | HIGH |
| Menu A/B Testing | V2.5 | LOW |
| Voice Ordering (WhatsApp AI) | V2.0 | MEDIUM |
| Card / POS Payments | V2.5 | MEDIUM |
| API Access | V2.0 | MEDIUM |
| White-Label | V3.0 | LOW |
| SSO | V3.0 | LOW |
| Reservation Deposits | V2.0 | MEDIUM |

---

## Imboni Partnership Program Audit

The Imboni Partnership Program consists of 5 interconnected programs:

| Program | Backend | Frontend | Missing |
|---------|---------|----------|---------|
| B2B Affiliate (Tier 1) | ✅ Complete | ✅ Complete | Application form non-functional, no commission trigger on payment |
| Customer Referral (Tier 2) | ✅ Complete | ✅ Complete | Reward amount bug, no signup field, no click tracking |
| Business Invite (Peer) | ✅ Complete | ✅ Complete | Not in sidebar, no cron jobs, no credit application |
| Professional Marketer | ✅ Complete | ✅ Complete | No public registration, no signup attribution |
| Founding Restaurant | ❌ None | ✅ Homepage only | No backend logic, no database fields, no discount application |

**Completion effort: 4–8 days** (2–4 days critical path)

See `IMBONI_PARTNERSHIP_PROGRAM_COMPLETION_PLAN.md` for the full execution roadmap.

---

## Homepage Review Summary

| Section | Lines | Verdict | Action |
|---------|-------|---------|--------|
| Hero Carousel | 320–420 | Mostly accurate | Rewrite Slide 3 (soften AI claims) |
| Real-Time OS Carousel | 422–461 | ✅ Accurate | KEEP |
| Auto-Growth Engines | 463–501 | 5 of 6 cards not ready | REMOVE ENTIRE SECTION |
| Supplier Marketplace | 504–526 | Correctly labeled | KEEP |
| Video Demo | 528–561 | ✅ Accurate | KEEP |
| How It Works | 563–662 | Step 2 inaccurate | Rewrite Step 2 |
| Stats | 664–696 | 2 of 4 fabricated | REWRITE ENTIRE SECTION |
| Features Grid | 698–801 | 3 of 12 cards not ready | Remove 3, add 1 |
| Pricing Preview | 804–889 | Mostly accurate | Soften AI claim |
| Product Trust | 891–971 | 1 of 6 cards needs softening | Rewrite AI card |
| Founding Program | 973–1079 | ✅ Accurate | KEEP (fix backend) |
| Advanced Features | 1081–1149 | 3 of 6 not ready | REWRITE SECTION |
| Discovery Marketplace | 1151–1201 | ✅ Accurate | KEEP |
| Payment Methods | 1203–1219 | Card/POS not implemented | Remove Card/POS |
| Final CTA | 1221–1244 | "500+" fabricated | Rewrite CTA |

---

## Marketing Surfaces Alignment

| Surface | Changes Required | Priority |
|---------|-----------------|----------|
| Homepage | 12 section changes | CRITICAL |
| Pricing page | 5 plan rewrites | CRITICAL |
| Public navigation | 2 link removals | HIGH |
| Footer | 1 link change | HIGH |
| Service terms | 1 code fix, 1 claim verification | HIGH |
| Dashboard sidebar | 1 addition (Auto-Reorder) | HIGH |
| Signup form | 1 addition (referral code field) | HIGH |
| Onboarding | Consider getting started checklist | MEDIUM |
| Empty states | No changes | — |
| Demo content | No changes | — |

---

## Success Criteria Assessment

| Criterion | Status |
|-----------|--------|
| Every public marketing claim is truthful | ❌ NOT YET — 9 critical changes required |
| Every advertised feature is backed by evidence | ❌ NOT YET — 6 features need completion or hiding |
| Every deferred feature has a documented future home | ✅ YES — See `LONG_TERM_VISION.md` |
| Every "Complete Before Launch" feature has a clear implementation plan | ✅ YES — See `FEATURE_COMPLETION_RECOMMENDATIONS.md` |
| Imboni Partnership Program has a complete execution roadmap | ✅ YES — See `IMBONI_PARTNERSHIP_PROGRAM_COMPLETION_PLAN.md` |
| Marketing, Product, Engineering, and Sales are fully aligned | ⏳ PENDING — Alignment achieved after changes are implemented |

---

## Deliverables Index

| Document | Purpose |
|----------|---------|
| `MARKETING_ALIGNMENT_REPORT.md` | This document — overall findings and recommendations |
| `PUBLIC_MARKETING_CHANGES.md` | Every marketing change required before launch |
| `FEATURE_COMPLETION_RECOMMENDATIONS.md` | For every non-production feature: remaining work, effort, recommendation |
| `IMBONI_PARTNERSHIP_PROGRAM_COMPLETION_PLAN.md` | Complete implementation roadmap for the partnership program |
| `LONG_TERM_VISION.md` | Every deferred feature with future milestone and re-entry criteria |

---

*Document generated: July 26, 2026*
