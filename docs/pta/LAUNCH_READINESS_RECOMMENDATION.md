# ImboniServe Version 1.0 Launch Readiness Recommendation

**Platform:** ImboniServe  
**Date:** July 26, 2026  
**Sprint:** Marketing Alignment Sprint (MAS)  
**Document Type:** FINAL RECOMMENDATION  

---

## The Question

> Is ImboniServe ready to begin onboarding its first paying hospitality businesses?

---

## The Answer

**Not yet — but close.**

ImboniServe is **2 weeks away** from launch readiness. The core product is production-ready. The engineering is solid. The dashboard is truthful. The gap is between what the public website promises and what the product actually delivers.

With ~2 weeks of focused engineering effort on 6 specific features, and ~2 days of marketing content changes, ImboniServe will be ready to onboard its first paying hospitality businesses with confidence.

---

## 1. Is the public website now aligned with the actual product?

**No.** The public website currently overstates the product in 3 critical ways:

### Critical Misalignments

| # | Misalignment | Impact | Fix |
|---|-------------|--------|-----|
| 1 | **Fabricated statistics** — "500+ Businesses served", "10,000+ Orders processed" | Customer trust destroyed on first contact | Replace with honest messaging (30 min) |
| 2 | **Founding 50% discount not applied in billing** — Homepage promises 50% lifetime discount, but `initiate-payment.ts` charges full price | First paying customer discovers they were overcharged | Add backend logic (1–3 days) |
| 3 | **Plan feature lists include non-existent features** — WhatsApp campaigns, Site Builder, A/B testing, white-label, API access, SSO | Customer signs up for a plan expecting features that don't exist | Rewrite all 5 plan lists (2 hours) |

### Additional Misalignments

- "Auto-Growth Engines" carousel markets 5 features that are not production-ready
- "Card / POS" listed in payment methods but not implemented
- "How It Works" Step 2 references AI Menu Builder which is not ready
- "Advanced Features" section markets Hotel Mode, Site Builder, and AI Menu Builder
- Navigation links to Site Builder and Store (marketplace)

### After Changes Are Implemented

Once the 17 marketing changes in `PUBLIC_MARKETING_CHANGES.md` are applied, the public website will be fully aligned with the actual product. Every feature shown will be a promise we can keep.

---

## 2. Which features should be completed before launch?

**6 features** — Total estimated effort: ~2 weeks

| # | Feature | Effort | Why It Must Be Completed |
|---|---------|--------|--------------------------|
| 1 | **Founding Restaurant Program (backend)** | 1–3 days | The homepage promises 50% lifetime discount to first 100 restaurants. The billing system does not apply this discount. This is a broken promise that will be discovered at the moment of payment — the worst possible time. |
| 2 | **Pricing Plan feature lists (rewrite)** | < 1 day | Every plan's feature list includes features that don't exist. A customer comparing plans will see "WhatsApp campaigns", "Site Builder", "A/B testing" and expect them to work. This is a trust issue that affects every potential customer. |
| 3 | **Customer Referral Program (fix + signup field)** | < 1 day | The referral reward is set to 50 RWF instead of the advertised 1,000 RWF — a 95% shortfall. Additionally, there is no visible referral code input on the signup form, making the referral program effectively invisible. |
| 4 | **Discovery Page polish** | < 1 day | The discovery page works but lacks logo display, city filtering, and sort options. Quick polish that significantly improves first impression for customers browsing restaurants. |
| 5 | **Promotions & Happy Hours (complete flow)** | 1 week | Promotions are a core daily restaurant need. The page and API exist, but promotions are not applied in the QR ordering flow. This is the highest-effort item but also the highest business value — restaurants use promotions to drive traffic. |
| 6 | **AI Draft PO (sidebar visibility)** | < 1 day | The ORRS auto-reorder system is fully verified and production-ready, but it's hidden from the sidebar. Adding it to navigation is a 30-minute task that unlocks a Premium plan differentiator. |

### Why These 6 and Not Others?

- **Founding discount, pricing lists, referral bug** — These are trust issues. A customer will discover the gap at the worst possible moment (payment, plan comparison, referral payout).
- **Promotions** — This is a competitive gap. Restaurants use promotions daily. Without this, ImboniServe is missing a core operational tool.
- **Discovery polish, AI Draft PO** — Quick wins that improve first impression and unlock Premium value.

### Why Not CRM, Loyalty, or AI Insights?

These features are valuable but:
- They require 1–2 weeks each to reach production quality
- They are not day-one needs for a restaurant just starting with the platform
- They can be offered as Early Access to interested customers post-launch
- Completing them would delay launch by 4–6 weeks for marginal benefit

---

## 3. Which features should be hidden until ready?

**6 features** — Keep implementation, remove from all marketing

| Feature | Where It's Marketed | Action |
|---------|---------------------|--------|
| CRM (RFM Segmentation) | Homepage features grid, Auto-Growth carousel | Remove from all public surfaces. Keep feature flag. Enable per-customer on request. |
| Loyalty & Rewards | Homepage features grid | Remove from all public surfaces. Keep feature flag. Enable per-customer on request. |
| Supplier Marketplace | Homepage "Coming Soon", navigation, footer | Keep "Coming Soon" label. Remove from navigation and footer. |
| WhatsApp Staff Ordering | Implied by WhatsApp marketing | Remove from marketing. Offer as setup service post-launch. |
| AI Insights Dashboard | Homepage features grid, Hero carousel, pricing | Remove from all public surfaces. Keep feature flag. Enable for Premium customers with AI credits. |
| AI Menu Builder | Homepage "How It Works" Step 2, Advanced Features | Remove from "How It Works". Remove from Advanced Features. Keep feature flag. Offer as onboarding service. |

---

## 4. Which features have been moved to the Long-Term Vision?

**10 features** — Each documented in `LONG_TERM_VISION.md` with re-entry criteria

| Feature | Target Version | Strategic Value | Re-entry Trigger |
|---------|---------------|-----------------|------------------|
| Site Builder | V2.0 | MEDIUM | 20+ customers request it |
| Hotel Mode | V2.5 | HIGH | 5+ hotel businesses request it |
| WhatsApp Campaigns | V2.0 | HIGH | CRM production-ready + Meta template approval |
| Menu A/B Testing | V2.5 | LOW | 1,000+ daily orders platform-wide |
| Voice Ordering (WhatsApp AI) | V2.0 | MEDIUM | WhatsApp Staff Ordering production-ready |
| Card / POS Payments | V2.5 | MEDIUM | 10+ customers request card payments |
| API Access | V2.0 | MEDIUM | API spec documented + 3 integration partners |
| White-Label | V3.0 | LOW | 3+ enterprise customers request it |
| SSO | V3.0 | LOW | 2+ enterprise customers require it |
| Reservation Deposits | V2.0 | MEDIUM | 10+ customers request deposit feature |

**No feature is abandoned.** Every deferred feature has a future version target, documented dependencies, and specific re-entry criteria based on customer demand and technical readiness.

---

## 5. Imboni Partnership Program Readiness

The Imboni Partnership Program is **mandatory for Version 1** and must reach production quality before launch.

### Current State

| Program | Backend | Frontend | Critical Missing |
|---------|---------|----------|-----------------|
| Founding Restaurant Program | ❌ | ✅ Homepage | No discount logic, no database fields |
| Customer Referral (Tier 2) | ✅ (bug) | ✅ | Reward amount bug, no signup field |
| B2B Affiliate (Tier 1) | ✅ | ✅ | Application form non-functional, no commission trigger |
| Business Invite (Peer) | ✅ | ✅ | Not in sidebar, no cron jobs |
| Professional Marketer | ✅ | ✅ | No public registration, no attribution |

### Completion Plan

| Phase | Description | Effort | Priority |
|-------|-------------|--------|----------|
| Phase 1 | Founding Restaurant Program Backend | 1–3 days | CRITICAL |
| Phase 2 | Customer Referral Fixes | < 1 day | CRITICAL |
| Phase 3 | B2B Affiliate Application | 1–2 days | HIGH |
| Phase 4 | Business Invite Visibility | < 1 day | MEDIUM |
| Phase 5 | Professional Marketer Integration | 1–2 days | MEDIUM |

**Total: 4–8 days** (2–4 days critical path)

See `IMBONI_PARTNERSHIP_PROGRAM_COMPLETION_PLAN.md` for the complete execution roadmap including database changes, backend code, frontend changes, testing checklist, and launch checklist.

---

## 6. Final Assessment

### What's Ready

- ✅ Core restaurant operations (orders, kitchen, tables, reservations, waiter station)
- ✅ Menu management with full CRUD
- ✅ Inventory tracking with alerts and auto-reorder (ORRS)
- ✅ QR code builder and analytics
- ✅ Reports and analytics (daily, weekly, monthly, menu performance, peak hours, payments)
- ✅ Staff management with 9 roles and role-based access
- ✅ Mobile Money payments (MTN MoMo, Airtel Money, IremboPay)
- ✅ Smart Dining Slips™
- ✅ WhatsApp notifications (order alerts, daily summaries, low-stock warnings)
- ✅ Multi-branch control
- ✅ PWA / installable app
- ✅ Multi-language (EN, FR, RW)
- ✅ Dark mode
- ✅ 14-day free trial with no credit card
- ✅ 5 pricing plans with billing system
- ✅ Discovery / public directory
- ✅ Customer referral program (with fix)
- ✅ Business invite program (with sidebar addition)
- ✅ B2B affiliate program (with application fix)
- ✅ Professional marketer program (with registration)
- ✅ Service replay
- ✅ OCR document processing
- ✅ Dashboard sidebar (22 V1 items, all production-ready)

### What's Not Ready (Being Fixed Before Launch)

- ❌ Founding Restaurant Program backend (1–3 days)
- ❌ Pricing plan feature lists (rewrite, < 1 day)
- ❌ Referral reward bug (5 min fix)
- ❌ Referral code field on signup (1 hour)
- ❌ Promotions in QR ordering flow (1 week)
- ❌ AI Draft PO sidebar visibility (30 min)
- ❌ 17 marketing content changes (2 days)

### What's Deferred (Documented in Long-Term Vision)

- 📋 Site Builder → V2.0
- 📋 Hotel Mode → V2.5
- 📋 WhatsApp Campaigns → V2.0
- 📋 Menu A/B Testing → V2.5
- 📋 Voice Ordering → V2.0
- 📋 Card / POS Payments → V2.5
- 📋 API Access → V2.0
- 📋 White-Label → V3.0
- 📋 SSO → V3.0
- 📋 Reservation Deposits → V2.0

### What's Hidden (Keep Implementation, Remove from Marketing)

- 🔒 CRM (RFM) — Early Access on request
- 🔒 Loyalty & Rewards — Early Access on request
- 🔒 Supplier Marketplace — Coming Soon
- 🔒 WhatsApp Staff Ordering — Setup service post-launch
- 🔒 AI Insights Dashboard — Early Access for Premium
- 🔒 AI Menu Builder — Onboarding service

---

## 7. Recommendation

### ImboniServe is ready to begin onboarding its first paying hospitality businesses after completing the following:

**Engineering (2 weeks):**
1. Founding Restaurant Program backend (1–3 days)
2. Referral reward bug fix + signup field (< 1 day)
3. Pricing plan feature list rewrite (< 1 day)
4. Promotions in QR ordering flow (1 week)
5. AI Draft PO sidebar visibility (30 min)
6. Imboni Partnership Program completion (4–8 days, overlaps with above)

**Marketing (2 days):**
1. Remove fabricated statistics
2. Remove "Auto-Growth Engines" carousel
3. Remove "Card / POS" from payment methods
4. Rewrite "How It Works" Step 2
5. Rewrite "Advanced Features" section
6. Rewrite "Features Grid" (remove 3, add 1)
7. Rewrite "Stats" section
8. Rewrite "Final CTA"
9. Soften AI claims in Hero, Pricing Preview, Product Trust
10. Remove Site Builder and Store from navigation
11. Remove Store from footer
12. Fix service terms multi-branch claim

**Total time to launch readiness: 2 weeks**

### After These Changes:

- ✅ Every public marketing claim will be truthful
- ✅ Every advertised feature will be backed by evidence
- ✅ Every deferred feature will have a documented future home
- ✅ Every "Complete Before Launch" feature will have a clear implementation plan
- ✅ The Imboni Partnership Program will have a complete execution roadmap
- ✅ Marketing, Product, Engineering, and Sales will be fully aligned

### The website will be a promise we can keep.

---

**Final Verdict: CONDITIONALLY READY — Complete the 2-week sprint and launch.**

---

*Document generated: July 26, 2026*  
*Product Truth Audit (PTA) + Marketing Alignment Sprint (MAS) — Complete*
