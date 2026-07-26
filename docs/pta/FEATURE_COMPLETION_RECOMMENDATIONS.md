# Feature Completion Recommendations

**Platform:** ImboniServe  
**Date:** July 26, 2026  
**Sprint:** Marketing Alignment Sprint (MAS)  

---

## Methodology

For every feature classified outside Category A (Production Ready) in the PTA, this document evaluates:

1. **Current Status** — What exists in the codebase today
2. **Remaining Work** — Every missing component
3. **Engineering Estimate** — Effort to complete
4. **Business Value** — Impact on Version 1 launch
5. **Final Recommendation** — KEEP / COMPLETE BEFORE LAUNCH / HIDE UNTIL READY / MOVE TO LONG-TERM VISION

---

## Category B — Production Ready (Minor Polish)

### B1. Referral Program (Customer Referrals — Tier 2)

**Current Status:** Fully implemented. `CustomerReferral` model, `/refer` page with code generation and sharing, `/api/customer-referrals/generate` and `/api/customer-referrals/track` APIs, leaderboard at `/api/referrals/leaderboard`, dashboard at `/dashboard/referrals`.

**Remaining Work:**
- Reward amount mismatch: Service terms say 1,000 RWF (100,000 cents) but `track.ts` sets `rewardCents = 5000` (50 RWF) — must fix
- No automated reward distribution to Mobile Money — tracking only, no payout
- No referral code input field on signup form — cookie-based attribution only
- No WhatsApp share message localization (currently English only)

**Engineering Estimate:** Less than 1 day — fix reward amount, add referral code input to signup, add WhatsApp share localization

**Business Value:** HIGH — directly drives customer acquisition. Customers sharing with friends is the cheapest growth channel.

**Recommendation: COMPLETE BEFORE LAUNCH** — The reward amount bug is a 1-line fix. Adding a visible referral code field to signup is straightforward.

---

### B2. Discovery / Discover Page

**Current Status:** Fully implemented. `/discover` page with search, category/city/price filters, business profile cards. `/api/discover` endpoint returns profiles.

**Remaining Work:**
- No business profile photos (logo upload exists but not displayed in cards)
- City filter is client-side only (API doesn't support city filtering)
- No sorting options (rating, newest, popular)
- Empty state is generic — should suggest popular categories

**Engineering Estimate:** Less than 1 day — add logo display, API city filter, sort options

**Business Value:** MEDIUM — helps with customer discovery but not a primary acquisition channel for V1

**Recommendation: COMPLETE BEFORE LAUNCH** — Quick polish that improves first impression

---

### B3. Founding Restaurant Program

**Current Status:** Marketed on homepage with 50% lifetime discount. `PRICING_CONFIG.launchDiscountPercent = 50` exists in config. However, **no backend logic applies this discount** — the `initiate-payment.ts` endpoint calculates `amountCents = plan.priceCents` with no founding discount check. No `isFounding` field on Business model. No founding member counter (first 100).

**Remaining Work:**
- Add `isFoundingMember` and `foundingJoinedAt` fields to Business model
- Add founding member check in `initiate-payment.ts` to apply 50% discount
- Add founding member counter (limit to 100)
- Add founding member badge on dashboard
- Add founding member tracking in admin panel

**Engineering Estimate:** 1–3 days — database migration, payment logic, admin tracking, dashboard badge

**Business Value:** HIGH — this is the primary acquisition incentive for early customers. Without backend logic, the promise of "50% lifetime discount" is broken.

**Recommendation: COMPLETE BEFORE LAUNCH** — This is a critical trust issue. The homepage promises 50% but the billing system doesn't apply it.

---

### B4. Pricing Plans (Structure)

**Current Status:** 5 plans defined in `pricing.ts` and mirrored in Prisma `Plan` model. Subscription, invoice, and payment systems work. 14-day trial with auto-approval.

**Remaining Work:**
- Plan feature lists in `pricing.ts` include non-production features (WhatsApp campaigns, Site Builder, A/B testing, etc.) — must be rewritten
- No plan upgrade/downgrade flow — only initial subscription
- No proration logic for plan changes
- No trial-to-paid conversion reminder emails (cron exists but no email sending)

**Engineering Estimate:** 1–3 days — rewrite feature lists, add upgrade/downgrade, add email reminders

**Business Value:** HIGH — pricing accuracy is essential for customer trust

**Recommendation: COMPLETE BEFORE LAUNCH** — Feature list rewrite is a 2-hour task. Upgrade/downgrade can be deferred but feature lists must be accurate.

---

### B5. PWA / Install App

**Current Status:** Fully implemented. `usePWAInstall` hook, `InstallAppButton` component, `PWAInstallPrompt` component, manifest.json, service worker.

**Remaining Work:**
- iOS install instructions not shown (only Android prompt)
- No offline page when network is lost
- Service worker cache strategy could be improved for menu images

**Engineering Estimate:** Less than 1 day — add iOS instructions, offline page

**Business Value:** LOW — PWA works, polish is nice-to-have

**Recommendation: KEEP** — Already production-ready. Polish can come post-launch.

---

### B6. AI Draft PO Generation (ORRS)

**Current Status:** Fully implemented and verified through ORRS. `ReorderAutopilotService` generates draft purchase orders grouped by supplier.

**Remaining Work:**
- Not visible in V1 sidebar — hidden from navigation
- Should be accessible from Inventory Alerts page

**Engineering Estimate:** Less than 1 day — add to sidebar or link from inventory alerts

**Business Value:** MEDIUM — valuable for Premium plan customers but not a launch blocker

**Recommendation: COMPLETE BEFORE LAUNCH** — Add to sidebar. Already verified, just needs visibility.

---

## Category C — Beta / Limited Access

### C1. CRM (RFM Segmentation)

**Current Status:** Page exists at `/dashboard/crm` with RFM segmentation (Champions, Loyal, At Risk, Lost, New, Promising). API at `/api/crm/customers` returns customer data with RFM scores. Feature-flagged `crm_v1`.

**Remaining Work:**
- No automated segment-based actions (e.g., "send WhatsApp to At-Risk customers")
- No customer journey timeline
- No integration with loyalty program
- No export functionality
- No segment-based campaign creation (requires WhatsApp Campaigns which is also not ready)
- Not in V1 sidebar

**Engineering Estimate:** 1–2 weeks — to make it production-ready with segment actions, export, and sidebar integration

**Business Value:** MEDIUM — customer retention is important but not a day-one need for first customers

**Recommendation: HIDE UNTIL READY** — Keep feature flag, remove from homepage marketing. Can be enabled per-customer on request.

---

### C2. Loyalty & Rewards

**Current Status:** Page exists at `/dashboard/loyalty` with balance lookup, manual credit/debit. API at `/api/loyalty/balance`. Feature-flagged `loyalty_system`.

**Remaining Work:**
- No automatic points accrual on orders
- No tier system (Bronze/Silver/Gold)
- No redemption flow (points → discount)
- No customer-facing loyalty display
- Not in V1 sidebar

**Engineering Estimate:** 1–2 weeks — automatic accrual, tiers, redemption, customer display

**Business Value:** MEDIUM — customer retention tool, but first customers won't have enough order history for it to matter

**Recommendation: HIDE UNTIL READY** — Keep feature flag, remove from homepage features grid.

---

### C3. Promotions & Happy Hours

**Current Status:** Page exists at `/dashboard/promotions` with creation form (DISCOUNT_PERCENT, DISCOUNT_FIXED, HAPPY_HOUR). API at `/api/promotions`. Feature-flagged `promotions_engine`.

**Remaining Work:**
- No automatic promotion application at checkout/QR ordering
- No promotion validation (time window, usage limits)
- No promotion analytics (redemption count, revenue impact)
- No promotion display on customer-facing QR menu
- Not in V1 sidebar

**Engineering Estimate:** 1 week — promotion application in order flow, validation, analytics, menu display

**Business Value:** HIGH — restaurants use promotions daily to drive traffic. This is a competitive feature.

**Recommendation: COMPLETE BEFORE LAUNCH** — Promotions are a core restaurant need. The page and API exist; the missing piece is applying promotions in the QR ordering flow. 1 week of effort is justified.

---

### C4. Supplier Marketplace / Store

**Current Status:** Store page at `/store` with product browsing, search, cart, AI recommendations, supplier map. Supplier pages with orders, deliveries, payments. Homepage labeled "Coming Soon — Early Access."

**Remaining Work:**
- No supplier self-service onboarding
- No automated supplier verification
- No integrated payment processing for marketplace orders
- No delivery tracking
- No inventory sync from marketplace purchases
- Limited supplier catalog (empty or test data)

**Engineering Estimate:** Multi-week project — full marketplace requires supplier onboarding, payment escrow, delivery integration

**Business Value:** MEDIUM — procurement is valuable but restaurants can use manual ordering for V1

**Recommendation: HIDE UNTIL READY** — Keep "Coming Soon" label. Remove from public navigation. Can launch as Early Access with manually onboarded suppliers post-launch.

---

### C5. WhatsApp Staff Ordering

**Current Status:** `WhatsAppOrderService` fully implemented with message parsing, menu matching, order creation, confirmation. Webhook at `/api/webhooks/twilio/whatsapp`. Requires Twilio configuration.

**Remaining Work:**
- No self-service setup wizard for restaurants
- No Twilio configuration UI in dashboard settings
- No staff phone registration UI
- No error handling for unconfigured Twilio (graceful degradation)
- No documentation for restaurant owners

**Engineering Estimate:** 1–3 days — Twilio config UI in settings, staff phone registration, setup wizard, documentation

**Business Value:** LOW for V1 — most restaurants won't configure Twilio on day one. QR ordering covers the primary use case.

**Recommendation: HIDE UNTIL READY** — Keep implementation, remove from any marketing. Can be offered as a setup service post-launch.

---

### C6. AI Insights Dashboard

**Current Status:** Page exists at `/dashboard/ai` with reorder suggestions, cost anomaly alerts, insight reports. Feature-flagged `ai_insights_v1`. Requires OpenAI API credits.

**Remaining Work:**
- Insight report generation requires OpenAI API (cost per report)
- No automated report scheduling
- No report email/WhatsApp delivery
- Not in V1 sidebar
- AI credit system exists but no clear pricing for insights

**Engineering Estimate:** 1–3 days — add to sidebar, add scheduling, add delivery, clarify pricing

**Business Value:** MEDIUM — AI insights are a differentiator but require AI credits and OpenAI configuration

**Recommendation: HIDE UNTIL READY** — Keep feature flag. Can be enabled for Premium customers who purchase AI credits. Remove from homepage marketing as production-ready.

---

## Category D — Roadmap

### D1. Site Builder

**Current Status:** Page at `/dashboard/site-builder` with template selection, color/font customization, section toggles. No publishing pipeline.

**Remaining Work:**
- No domain management
- No hosting infrastructure
- No live preview
- No template rendering engine
- No SEO optimization
- No mobile-responsive published site
- No menu synchronization
- Hidden from V1 sidebar

**Engineering Estimate:** Multi-week project — requires hosting infrastructure, domain management, rendering engine

**Business Value:** LOW for V1 — restaurants don't need a website builder on day one. Discovery page covers online presence.

**Recommendation: MOVE TO LONG-TERM VISION** — Remove from homepage and navigation. Revisit for Version 2.0.

---

### D2. Hotel Mode

**Current Status:** Page at `/dashboard/hotel` with room management interface. Feature-flagged `hotel_mode`.

**Remaining Work:**
- Not operationally verified
- No integration with reservations
- No front desk operations
- No service area management
- Hidden from V1 sidebar

**Engineering Estimate:** Multi-week project — hotel operations require different workflows

**Business Value:** LOW for V1 — first customers are restaurants, not hotels

**Recommendation: MOVE TO LONG-TERM VISION** — Remove from homepage. Revisit when hotel customers express interest.

---

### D3. AI Menu Builder

**Current Status:** Page at `/dashboard/menu-builder` with upload flow, extraction API. Feature-flagged `ai_menu_builder`. Requires OpenAI.

**Remaining Work:**
- Extraction quality not verified across diverse menu formats
- No bulk import from PDF
- No menu structure inference (categories, modifiers)
- No candidate review workflow completion
- Hidden from V1 sidebar

**Engineering Estimate:** 1–2 weeks — quality assurance, structure inference, workflow completion

**Business Value:** MEDIUM — accelerates onboarding but manual menu entry works for V1

**Recommendation: HIDE UNTIL READY** — Keep feature flag. Can be offered as an onboarding service. Remove from homepage "How It Works" step 2.

---

### D4. WhatsApp Campaigns

**Current Status:** Page at `/dashboard/campaigns` with campaign creation, scheduling, segment targeting. API exists. No automation.

**Remaining Work:**
- No campaign automation (triggered campaigns)
- No WhatsApp Business API template approval flow
- No A/B testing for campaign messages
- No segment synchronization from CRM
- Hidden from V1 sidebar

**Engineering Estimate:** 1–2 weeks — template approval, automation, CRM sync

**Business Value:** MEDIUM — marketing automation is valuable but requires CRM to be production-ready first

**Recommendation: MOVE TO LONG-TERM VISION** — Remove from homepage. Depends on CRM being production-ready first.

---

### D5. Menu A/B Testing

**Current Status:** Page at `/dashboard/ab-testing` with test creation UI, variant configuration, metrics display. No backend.

**Remaining Work:**
- No API integration — tests are UI-only
- No traffic splitting implementation
- No variant serving in QR ordering flow
- No statistical significance calculation
- No metrics collection
- Hidden from V1 sidebar

**Engineering Estimate:** 1–2 weeks — traffic splitting engine, variant serving, metrics collection, statistical analysis

**Business Value:** LOW for V1 — A/B testing is an optimization tool, not a core operations need

**Recommendation: MOVE TO LONG-TERM VISION** — Remove from homepage. Revisit for Version 2.0.

---

### D6. Voice Ordering (WhatsApp AI)

**Current Status:** Webhook at `/api/webhooks/twilio/voice-order.ts` with GPT-4 integration for natural language order extraction. Requires Twilio + OpenAI + customer registration.

**Remaining Work:**
- No production-ready customer onboarding for WhatsApp ordering
- No conversation state management
- No multi-turn ordering flow
- No menu browsing via WhatsApp
- No payment integration within WhatsApp
- No conversation persistence

**Engineering Estimate:** Multi-week project — conversation engine, state management, payment integration

**Business Value:** LOW for V1 — QR ordering covers the primary use case. Voice ordering is a nice-to-have.

**Recommendation: MOVE TO LONG-TERM VISION** — Remove from homepage. Revisit for Version 2.0.

---

## Category E — Remove

### E1. Fabricated Statistics

**Current Status:** Homepage displays "500+ Businesses served" and "10,000+ Orders processed" with no data backing.

**Recommendation: REMOVE** — Replace with honest messaging. No engineering effort required.

---

### E2. "Deposits & Reservations" (deposits claim)

**Current Status:** Homepage markets "deposits" as part of reservations. Deposits are not implemented.

**Recommendation: REMOVE** — Change to "Reservations & Confirmations" (drop "deposits"). No engineering effort required.

---

### E3. Conversational Hospitality / WhatsApp AI Conversation

**Current Status:** Implied by voice ordering marketing. GPT-4 handler exists but not production-ready.

**Recommendation: REMOVE** from all marketing. Move to Long-Term Vision.

---

## Summary Table

| Feature | Category | Recommendation | Effort | Launch Impact |
|---------|----------|---------------|--------|---------------|
| Referral Program (Tier 2) | B | **COMPLETE BEFORE LAUNCH** | < 1 day | HIGH — fixes broken reward + adds visibility |
| Discovery Page | B | **COMPLETE BEFORE LAUNCH** | < 1 day | MEDIUM — quick polish |
| Founding Restaurant Program | B | **COMPLETE BEFORE LAUNCH** | 1–3 days | CRITICAL — 50% discount not applied in billing |
| Pricing Plans (feature lists) | B | **COMPLETE BEFORE LAUNCH** | < 1 day | CRITICAL — trust issue |
| PWA / Install App | B | **KEEP** | — | Already ready |
| AI Draft PO (ORRS) | B | **COMPLETE BEFORE LAUNCH** | < 1 day | MEDIUM — add to sidebar |
| CRM (RFM) | C | **HIDE UNTIL READY** | 1–2 weeks | MEDIUM |
| Loyalty & Rewards | C | **HIDE UNTIL READY** | 1–2 weeks | MEDIUM |
| Promotions & Happy Hours | C | **COMPLETE BEFORE LAUNCH** | 1 week | HIGH — core restaurant need |
| Supplier Marketplace | C | **HIDE UNTIL READY** | Multi-week | MEDIUM |
| WhatsApp Staff Ordering | C | **HIDE UNTIL READY** | 1–3 days | LOW |
| AI Insights Dashboard | C | **HIDE UNTIL READY** | 1–3 days | MEDIUM |
| Site Builder | D | **MOVE TO LONG-TERM VISION** | Multi-week | LOW |
| Hotel Mode | D | **MOVE TO LONG-TERM VISION** | Multi-week | LOW |
| AI Menu Builder | D | **HIDE UNTIL READY** | 1–2 weeks | MEDIUM |
| WhatsApp Campaigns | D | **MOVE TO LONG-TERM VISION** | 1–2 weeks | MEDIUM |
| Menu A/B Testing | D | **MOVE TO LONG-TERM VISION** | 1–2 weeks | LOW |
| Voice Ordering (WhatsApp AI) | D | **MOVE TO LONG-TERM VISION** | Multi-week | LOW |
| Fabricated Statistics | E | **REMOVE** | 0 | CRITICAL — trust |
| Deposits claim | E | **REMOVE** | 0 | Trust |
| WhatsApp AI Conversation | E | **REMOVE** | 0 | Trust |

---

## Features to Complete Before Launch (6 items)

| # | Feature | Effort | Why |
|---|---------|--------|-----|
| 1 | Founding Restaurant Program (backend) | 1–3 days | 50% discount promise is broken — billing doesn't apply it |
| 2 | Pricing Plan feature lists (rewrite) | < 1 day | Lists include non-existent features — trust issue |
| 3 | Referral Program (fix reward + signup field) | < 1 day | Reward amount bug (50 RWF vs 1,000 RWF), no visible referral input |
| 4 | Discovery Page polish | < 1 day | Logo display, city filter, sort options |
| 5 | Promotions & Happy Hours (complete flow) | 1 week | Core restaurant need — promotion application in QR ordering |
| 6 | AI Draft PO (sidebar visibility) | < 1 day | Already verified, just needs to be visible |

**Total estimated effort:** ~2 weeks for all 6 items

---

*Document generated: July 26, 2026*
