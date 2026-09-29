# CONTENT CHANGELOG — All Additions, Removals, and Wording Changes

**Sprint:** Product Experience Implementation Sprint (PEIS)  
**Date:** 2025

---

## File: `src/pages/index.tsx` (Homepage)

### Removals

| # | Location | Removed Content | Reason |
|---|----------|----------------|--------|
| 1 | Growth slides (line ~270) | "Voice Ordering (WhatsApp AI)" — title, desc, href, cta | ROADMAP — phantom feature does not exist in codebase |
| 2 | Features array (line ~109) | "Multi-Branch Control" — icon, title, desc, color | PARTIAL — feature-flagged, not universally available |
| 3 | Features grid (line ~745) | Multi-Branch Control card (Building2 icon, title, desc) | PARTIAL — feature-flagged |
| 4 | Features grid (line ~717) | "Loyalty & Rewards" card (Gift icon, title, desc) | PARTIAL — feature-flagged |
| 5 | Homepage section (lines 462-484) | Entire Supplier Marketplace section | PARTIAL — hardcoded data, not production-ready |
| 6 | Advanced features (line ~134) | "Staff & Roles" — icon, title, desc | Tier 3 — expected functionality, not a differentiator |
| 7 | Import (line ~28) | `Hotel` icon import | Unused after removing Loyalty section |
| 8 | Import (line ~38) | `Mic` icon import | Unused after removing Voice Ordering |

### Additions

| # | Location | Added Content | Reason |
|---|----------|--------------|--------|
| 1 | Growth slides (line ~265) | "Service Replay™" — Play icon, title, desc, href, cta | VERIFIED Tier 1 — replaces phantom Voice Ordering |
| 2 | New section (lines 458-517) | "Why Switch?" section — Service Replay™, CRM with RFM, A/B Testing | Tier 1 differentiators per HOMEPAGE_PRIORITY.md |
| 3 | New section (lines 519-596) | "Why AI?" section — AI Menu Builder, Auto-Reorder, AI Insight Reports, Cost Anomaly Alerts | Tier 1 differentiators per HOMEPAGE_PRIORITY.md |
| 4 | New section (lines 954-998) | "Why Trust Us?" section — CFO Dashboard, CEO Dashboard | Tier 1 differentiators replacing generic Product Trust section |
| 5 | New section (lines 1001-1043) | "Why Now?" section — 5 urgency lines backed by verified capabilities | Creates urgency per FINAL_POSITIONING_DECISION.md |
| 6 | Advanced features (line ~134) | "Service Replay™" — Play icon, title, desc | Tier 1 — replaces Tier 3 Staff & Roles |
| 7 | Imports (lines 37-40) | `Play`, `DollarSign`, `AlertTriangle`, `Target` icons | Support new homepage sections |

### Updates

| # | Location | Old Content | New Content | Reason |
|---|----------|------------|------------|--------|
| 1 | Stats (line ~762) | "30+" / "Features included" | "38+" / "Verified capabilities" | Accurate count from VERIFIED_CAPABILITIES.md |

---

## File: `src/components/PublicLayout.tsx` (Navigation)

### Updates

| # | Location | Old Content | New Content | Reason |
|---|----------|------------|------------|--------|
| 1 | Desktop nav (line 98) | `href="/#features"` | `href="/features"` | New dedicated features page created |
| 2 | Mobile nav (line 186) | `href="/#features"` | `href="/features"` | New dedicated features page created |

### Removals

| # | Location | Removed Content | Reason |
|---|----------|----------------|--------|
| 1 | Mobile menu solutions (line ~192) | `/store` link ("Store") | Supplier Marketplace is PARTIAL, should not be in public nav |

### Additions

| # | Location | Added Content | Reason |
|---|----------|--------------|--------|
| 1 | Footer (line 241) | `<Link href="/features">Features</Link>` | New features page should be accessible from footer |

---

## File: `src/config/pricing.ts` (Pricing Configuration)

### Additions

| # | Plan | Added Feature | Reason |
|---|------|--------------|--------|
| 1 | Starter | "Smart Dining Slips" | VERIFIED capability added to base plan |
| 2 | Professional | "CRM with RFM segmentation" | VERIFIED capability added to mid-tier plan |
| 3 | Business | "WhatsApp Campaigns" | VERIFIED capability added to Business plan |

### Removals

| # | Plan | Removed Feature | Reason |
|---|------|----------------|--------|
| 1 | Premium | "Advanced reports & analytics" | PARTIAL — feature-flagged capability |

### Replacements

| # | Plan | Old Feature | New Features | Reason |
|---|------|------------|-------------|--------|
| 1 | Premium | "Advanced reports & analytics" | "Service Replay™", "A/B Testing for menus", "CFO Dashboard", "CEO Dashboard" | Replaced 1 PARTIAL with 4 VERIFIED Tier 1 capabilities |

---

## New Files Created

| # | File | Purpose |
|---|------|---------|
| 1 | `src/pages/features/index.tsx` | Features overview page with 6 category cards |
| 2 | `src/pages/features/operations.tsx` | Operations feature page (QR Ordering, Service Replay™, KDS, etc.) |
| 3 | `src/pages/features/ai.tsx` | AI feature page (Menu Builder, Auto-Reorder, A/B Testing, etc.) |
| 4 | `src/pages/features/analytics.tsx` | Analytics feature page (CFO/CEO Dashboards, CRM, etc.) |
| 5 | `src/pages/features/finance.tsx` | Finance feature page (CFO Dashboard, Payouts, etc.) |
| 6 | `src/pages/features/growth.tsx` | Growth feature page (Discovery, Campaigns, Site Builder, etc.) |
| 7 | `src/pages/features/infrastructure.tsx` | Infrastructure feature page (Staff, Inventory, Security, etc.) |

---

## Wording Changes Summary

### Outcome-Focused Rewrites

| Location | Old Wording (Technical) | New Wording (Outcome-Focused) |
|----------|------------------------|------------------------------|
| Why Switch? headline | (did not exist) | "You're not just getting a POS. You're getting intelligence." |
| Why AI? headline | (did not exist) | "AI isn't a buzzword. It's working right now in your dashboard." |
| Why Trust Us? headline | "Why Hospitality Businesses Trust ImboniServe" | "This isn't a basic POS with pretty charts. This is enterprise-grade intelligence." |
| Why Now? headline | (did not exist) | "Every day without intelligence is a day of lost revenue." |
| Service Replay™ desc | (not on homepage before) | "Replay any service period like a football match. Every order, every station, every table — event by event." |
| CRM desc | (not on homepage before) | "Automatic RFM segmentation: Champions, Loyal, At Risk, Lost. Lifetime value and spend analysis." |
| A/B Testing desc | (was in growth slides only) | "Stop guessing. Start testing. Create price variants, split traffic, measure conversion. Pick winners with real data." |
| AI Menu Builder desc | "Upload a photo or document and let AI build your menu for you." | "Upload a photo or PDF of your existing menu. AI extracts items, prices, and descriptions. No manual entry — from hours to minutes." |
| Auto-Reorder desc | "Automatic stock alerts and AI-powered draft purchase orders for your suppliers." | "AI analyzes demand patterns, lead times, and safety stock to suggest reorders with confidence scores. One click to approve. Never run out again." |

---

## Change Count Summary

| Type | Count |
|------|-------|
| **Removals** | 8 (homepage) + 1 (nav) + 1 (pricing) = 10 |
| **Additions** | 7 (homepage sections/items) + 1 (nav footer) + 3 (pricing features) + 7 (new files) = 18 |
| **Updates** | 2 (nav links) + 1 (stats) = 3 |
| **Replacements** | 1 (advanced features) + 1 (pricing Premium plan) = 2 |
| **Wording rewrites** | 9 outcome-focused rewrites |
| **Total changes** | 42 |
