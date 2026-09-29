# ImboniServe Partnership Program — Evolution V2

**Founder Partner Program — Production Blueprint**

Status: Draft v1.1 (post-UX-review amendments BC-1..BC-6 applied) · Owner: Product / Growth / Platform · Scope: additive, non-breaking

**Companion**: `docs/FOUNDER_PARTNER_PROGRAM_UX_REVIEW.md` — mandatory pre-flight review. Implementation must not begin until the review's Phase 0 bug fixes (B1–B7) have shipped.

---

## 0. Executive Summary

ImboniServe already operates **four** referral / acquisition channels:

| # | Program | Engine | Reward | State |
|---|---|---|---|---|
| 1 | Standard Referral Partner (public) | `Affiliate` + `AffiliateCommission` | 15% recurring × 12 months | **Preserved as-is** |
| 2 | Customer Referral (Smart Dining Slip) | `ReferralLink` + `ReferralReward` + `DiningCredit` (TIER_2) | 1,000 RWF fixed | **Preserved as-is** |
| 2b | Legacy Customer Referral | `CustomerReferral` | 1,000 RWF fixed | **Preserved as-is** |
| 3 | Casual Sharing (Table Invite) | `ReferralReward` (TIER_3) | 500 RWF fixed | **Preserved as-is** |
| 4 | Professional Marketer (B2B agents) | `ProfessionalMarketer` + `MarketerCommission` | 50k RWF + 15% × 12mo | **Preserved as-is** |

**V2 introduces a fifth, premium, non-public tier: the Founder Partner Program.**

It targets TV channels, media, creators, hospitality influencers, consultants, associations, tourism organizations, chambers of commerce and strategic enterprise partners. Delivered via **Founder Codes** (e.g. `ISIMBI30`, `MIE30`, `HOTEL30`) that grant referred businesses a **30-day trial** (vs 14 standard) and pay the partner a **negotiated, private commission** for **12 months** default or custom.

This is a **Partnership Relationship Management (PRM)** layer — not another affiliate program. It coexists with the four existing programs without touching them.

---

## 1. Product Vision

### 1.1 Why not just another affiliate program

Affiliate programs optimize for click volume. That's the wrong objective when:

- Deals close in 2–8 weeks, not clicks.
- Trust is the primary conversion asset.
- LTV is 12–36× the first invoice.
- One association can cover 60% of a market in a single relationship.

PRM optimizes for **partner quality** and **relationship durability**. Commission is a lagging indicator; agreement fit and partner engagement are leading indicators.

### 1.2 Positioning

> The Founder Partner Program turns ImboniServe's most trusted allies into a durable, high-integrity distribution channel that scales customer acquisition without scaling paid advertising.

### 1.3 Strategic goals

1. 60% of net-new hospitality subscribers via partners within 18 months.
2. Reduce blended CAC by 40% vs. paid-social baseline.
3. One anchor partner per Rwandan province + per East African market within 24 months.
4. Partner NPS ≥ 60.

---

## 2. Evolution Strategy — Backward Compatibility Contract

Binding invariants:

1. `Affiliate.code` continues to work at signup (`src/pages/api/auth/signup.ts:69-84`). No behavior change. Default 15% × 12mo when `commissionRatePercent` is null.
2. `Business.referredByAffiliateId` remains the canonical Tier 1 attribution field.
3. `ReferralLink`, `DiningCredit`, `ReferralReward` (TIER_2/TIER_3), `CustomerReferral` unchanged.
4. Trial default remains **14 days** (`src/config/pricing.ts:184-190`, `src/pages/api/auth/signup.ts:117-119`, `src/lib/services/business-approval.service.ts:310-312`).
5. `FinancialLedgerEntry` remains the single source of truth for all finance analytics (unique `idempotencyKey`).
6. `ProfessionalMarketer` engine remains isolated and untouched.

Everything V2 adds is **additive**: new tables, new services, new API namespace (`/api/founder-partners/*`), new event types, new `BillingEventType` values.

---

## 3. Unified Partnership Architecture

### 3.1 Layer model

```
                    ┌───────────────────────────────────────┐
                    │  PRM Layer (NEW — Founder Partner)    │
                    │  Partner CRM · Agreements · Campaigns │
                    └────────────────┬──────────────────────┘
                                     │
     ┌──────────────┬────────────────┼────────────────┬───────────────┐
┌────▼────┐   ┌─────▼─────┐    ┌─────▼─────┐    ┌─────▼─────┐   ┌─────▼─────┐
│ Tier 1  │   │  Tier 2   │    │  Tier 3   │    │ B2B Mktr  │   │  Founder  │
│Affiliate│   │  Customer │    │  Casual   │    │ Marketer  │   │  Partner  │
│(public) │   │  Referral │    │  Sharing  │    │  (agents) │   │ (premium) │
│15% × 12 │   │ 1,000 RWF │    │  500 RWF  │    │50k+15%×12 │   │negotiated │
└────┬────┘   └─────┬─────┘    └─────┬─────┘    └─────┬─────┘   └─────┬─────┘
     └──────────────┴───────┬────────┴────────────────┴───────────────┘
                            ▼
              ┌───────────────────────────────────────┐
              │ Attribution Resolver (deterministic)  │
              └────────────────────┬──────────────────┘
                                   ▼
                    ┌────────────────────────────┐
                    │ FinancialLedgerEntry (T)   │
                    └────────────────────────────┘
```

### 3.2 Attribution Resolver — precedence

At signup, multiple codes may be present. To prevent double payouts, a single-attribution rule applies:

1. `FounderCode` (highest — issued in the context of a private agreement)
2. `Affiliate.code`
3. `ProfessionalMarketer.referralCode`
4. `CustomerReferral` / `ReferralLink.code`

Losing candidates are logged in `PartnershipAttributionAttempt` for audit and dispute resolution. Existing fraud checks (`TrialEligibilityService`, `FraudDetectionService`, `BusinessApprovalService`) apply uniformly across all tiers.

---

## 4. Partnership Categories

| Category | Examples | Default commission band* | Default term |
|---|---|---|---|
| **MEDIA_TV** | TV, radio | 10–15% | 12 mo |
| **MEDIA_DIGITAL** | Publications, blogs | 15–20% | 12 mo |
| **CREATOR** | YouTube, TikTok, IG | 15–25% | 12 mo |
| **CONSULTANT** | F&B advisors | 20–30% | 12 mo renewable |
| **ASSOCIATION** | Hotel/restaurant unions | 10–15% + SLA | 24 mo |
| **TOURISM_ORG** | Tourism boards, DMOs | 10–15% + co-marketing | 24 mo |
| **CHAMBER** | Chambers of commerce | 10–15% | 12 mo |
| **COMMUNITY** | Founder networks | 15–20% | 12 mo |
| **ENTERPRISE** | Hotel groups, franchises, POS resellers | Custom (flat + %) | 24–36 mo |

*Bands are **internal only**; actual rate is negotiated per partner and stored in the signed agreement.

---

## 5. Partner Lifecycle

Both outbound and inbound converge into one canonical lifecycle:

```
PROSPECT ──► APPLIED ──► IN_REVIEW ──► IN_NEGOTIATION ──► APPROVED
                │                            │
                └──► REJECTED                └──► DECLINED
                                                    │
                                                    ▼
                                              ACTIVATED (Founder Code issued)
                                                    │
                                              ┌─────┴─────┐
                                              ▼           ▼
                                          RENEWED     EXPIRED
                                              │           │
                                              ▼           ▼
                                        EXPANDED    OFF_BOARDED
                                                        │
                                                        ▼
                                                   TERMINATED
```

States on `FounderPartner.status`. Each transition emits `founder.partner.status_changed` and is role-gated (§16). Terminal states: `REJECTED`, `EXPIRED`, `OFF_BOARDED`, `TERMINATED`.

---

## 6. Founder Code Architecture

### 6.1 Goals
- Human-memorable and brand-aligned (`ISIMBI30`, `MIE30`).
- Namespace-safe — no collision with `Affiliate.code`, `ReferralLink.code`, `CustomerReferral.referralCode`, `ProfessionalMarketer.referralCode`.
- Rich policy carrier — encodes trial length, campaign, expiration, geo scope.
- Multiple codes per partner (per campaign / creator / region).

### 6.2 Generation
- Admin-mediated only via `POST /api/admin/founder-codes`.
- Format: `^[A-Z]{2,8}[0-9]{0,3}$`, uniqueness enforced case-insensitively.
- Cross-table collision check with the other 4 code tables → 409 on clash.

### 6.3 Validation at signup

```
signup {referralCode}
  ├─ FounderCode.findUnique(code)? active + within window
  │    ├─ ok → trialDays = code.trialDays (default 30)
  │    │       attribution = FOUNDER_PARTNER
  │    │       create FounderCodeRedemption (idempotent by businessId+codeId)
  │    │       emit founder.code.redeemed
  │    └─ not found → fall through to Affiliate resolver (unchanged)
  └─ … Tier 2 / Customer / Marketer resolvers (unchanged)
```

### 6.4 Lifecycle fields
- `activeFrom`, `activeUntil` — campaign window
- `maxRedemptions` (nullable cap)
- `perGeoRestriction` (country/region allowlist)
- `status ∈ { DRAFT, ACTIVE, PAUSED, EXPIRED, REVOKED }`

Expired/revoked → fallback to default 14-day trial + friendly toast. Zero-error UX.

### 6.5 Campaign linkage
`FounderCode.campaignId → PartnerCampaign` (§12) enables campaign-scoped analytics without minting a code per burst.

### 6.6 Analytics per code
Impressions, signups, qualified signups, converted (paid), MRR generated, ARR run-rate, retention @ 3/6/12mo, commission accrued vs paid, fraud rate, refund/chargeback rate.

### 6.7 Administration
Create · edit · pause · revoke · rotate (successor preserving history) · bulk import/export · assign to campaign/partner.

### 6.8 Security
- Stored canonicalized (uppercase), compared case-insensitively.
- Rate-limited lookup (100/min/IP) to prevent enumeration.
- Redemption idempotent per `(businessId, codeId)`.
- Every redemption logs IP, device, attribution attempt trail.

### 6.9 Cookie & Query-Param Contract (BC-2)

**Canonical entry route**: `GET /f/{code}` (new, Phase 0). Resolves code, tracks click, sets cookies, redirects to `/signup?ref={code}`.

**Canonical signup query param**: `?ref={code}`. Aliases accepted for backward compatibility and marketing flexibility: `?partner=`, `?m=`, `?invite=`.

**Canonical cookie**: `im_ref={code}`, `HttpOnly`, `SameSite=Lax`, `Max-Age=30d`. Value uppercased.

**Deprecation**: the legacy `referral_code` cookie set by `/api/r/{code}` continues to be set for a **60-day transition window** alongside `im_ref`. After 60 days, only `im_ref` is written. The signup API reads both during the window.

**Post-signup**: once the business is successfully created and attributed, the signup API expires `im_ref` (`Max-Age=0`) to prevent double-attribution on subsequent signups from the same device (e.g., a household with two businesses). The `referral_code` cookie is expired identically.

**Post-signup application** (Persona D): `POST /api/founder-partners/codes/apply-post-signup` accepts a body `{ code }` and does not depend on cookies.

---

## 7. Customer Journey

### 7.1 Happy path — Founder Code
1. Owner clicks partner link `?ref=ISIMBI30` → lands on `/signup`.
2. Cookie `im_ref=ISIMBI30` set 30 days (already at `src/pages/api/r/[code].ts:42-47`, extended to accept Founder codes).
3. Owner completes signup. Resolver identifies `ISIMBI30` as Founder Code → **30-day trial** → attribution to Founder Partner.
4. Auto-approval path unchanged (`src/pages/api/auth/signup.ts:114-119`); only `trialEndDate` uses `code.trialDays`.
5. Emits `founder.code.redeemed`, `business.trial.started`.

### 7.2 No code
Default 14-day trial. Unchanged.

### 7.3 Invalid / expired code
Silent fallback to 14 days + toast. No error.

### 7.4 Conflict — Founder code + Affiliate cookie
Founder wins (§3.2). Affiliate attempt stored, not paid.

### 7.5 Post-signup extension
A business that signed up on 14 days can extend to 30 days by applying a valid Founder Code via `POST /api/founder-partners/codes/apply-post-signup`, **only while trialing and before any invoice paid**. Once billing has begun, extension is disabled.

### 7.6 Business auto-flagged HIGH_RISK
Trial does not start. Founder sees `PENDING_REVIEW` in their dashboard. Commission accrues only if/when business is later approved.

### 7.7 First subscription payment
Commission engine posts month-1 accrual (§10). Further Founder Code applications on that business are blocked.

---

## 8. Partner Journey

### 8.1 Outbound (ImboniServe-initiated) — CRM stages
```
IDENTIFIED → RESEARCHED → CONTACTED → RESPONDED → MEETING_SCHEDULED
  → MEETING_HELD → PROPOSAL_SENT → NEGOTIATING → AGREEMENT_SIGNED
  → CODE_ISSUED → CAMPAIGN_LIVE → ACTIVELY_PRODUCING → RENEWAL_DUE
```
Each stage has owner, next-action date, notes, expected close date, probability.

### 8.2 Inbound (partner-initiated)
Public landing → `/partners/apply` → `POST /api/founder-partners/applications` → `FounderPartnerApplication` created.

```
SUBMITTED → IN_REVIEW → INFO_REQUESTED (loops)
  ├─ APPROVED → FounderPartner created + draft PartnerAgreement + onboarding checklist
  └─ REJECTED (with reason visible to applicant)
```

### 8.3 Long-term
Dedicated Partnership Manager (`FounderPartner.accountManagerId`), shared workspace (activity timeline, notes, files), and auto-scheduled `PartnerQBR` every 90 days until off-boarding.

---

## 9. Trial Extension Engine

### 9.1 Coexistence contract

| Case | Trial |
|---|---|
| No code | 14 days (default `PRICING_CONFIG.trialDays`) |
| Founder code, `trialDays = 30` | 30 days |
| Founder code, custom (bounded by `PARTNERSHIP_MAX_TRIAL_DAYS=90`) | as configured |
| Affiliate (Tier 1) | 14 days (unchanged) |
| Customer / dining slip | 14 days (unchanged) |
| Multiple codes | Trial days from the code that wins §3.2 |

### 9.2 Implementation (BC-4)

**Server-side (Phase 0)**: Replace the hardcoded `14 * 24 * 60 * 60 * 1000` at exactly two sites:

- `src/pages/api/auth/signup.ts:117-119`
- `src/lib/services/business-approval.service.ts:310-312`

with:

```ts
const trialDays = await TrialPolicyService.resolveTrialDays({
  referralCode: refCode,
  businessType,
  ipAddress,
  deviceFingerprint,
})
const trialEndDate = trialStartDate
  ? new Date(trialStartDate.getTime() + trialDays * 86_400_000)
  : null
```

`TrialPolicyService.resolveTrialDays`:
1. Look up `FounderCode`. Active + valid + within `attributionWindowDays` → return `code.trialDays`.
2. Else return `PRICING_CONFIG.trialDays` (14).

**Client-side (Phase 0)**: `<TrialLengthLabel />` component at `src/components/TrialLengthLabel.tsx` — single source of trial copy.

```tsx
interface TrialLengthLabelProps {
  days?: number                // override; else reads PRICING_CONFIG.trialDays
  source?: 'STANDARD' | 'FOUNDER_CODE'
  partnerName?: string         // e.g. "ISIMBI TV"
  variant?: 'banner' | 'cta' | 'pill' | 'inline'
  className?: string
}
```

**Copy contract**:

| variant | STANDARD | FOUNDER_CODE |
|---|---|---|
| `banner` | 🎉 14-day free trial — no credit card required. | 🎉 30-day Founder Trial — powered by **{partner}** · no credit card required. |
| `cta` | Start Your 14-Day Free Trial | Start Your 30-Day Founder Trial |
| `pill` | Trial · {n} days remaining | Founder Trial · {n} days remaining |
| `inline` | {n}-day free trial | {n}-day Founder Trial |

All strings routed through `t('trial.*', {n})` for i18n (`en`, `fr`, `rw`).

**Copy audit (Phase 0)**: every hardcoded `14-day` / `14 day` / `14-Day` literal in `.tsx` and `.ts` files must be replaced with `<TrialLengthLabel />` or `t()` helper. CI enforces via a lint rule (regex `\b14-?day\b` blocks in `src/**/*.{ts,tsx}`).

Stamp business:
```
Business.trialSource        // "STANDARD" | "FOUNDER_CODE" | "MANUAL_ADMIN"
Business.trialSourceCodeId  // FounderCode.id (nullable)
Business.trialDaysGranted   // int, denormalized
```

### 9.3 Anti-abuse
`TrialEligibilityService.evaluateAndRecord` already blocks duplicate email/phone/device (`src/pages/api/auth/signup.ts:26-36`). Founder Codes **do not override** this — a blocked identity remains blocked. Partner is notified via dashboard event `signup.blocked.fraud`.

---

## 10. Commission Engine

### 10.1 Principles
- Rates are **per agreement**, not per program.
- Duration default 12 months, override per agreement.
- All commissions post to `FinancialLedgerEntry` with a unique `idempotencyKey`.
- Accruals ≠ payouts.

### 10.2 Accrual flow per paid invoice

```
INVOICE_PAID
  → CommissionEngine.processInvoice(invoice)
      ├─ Find attributed FounderPartner via founderCodeRedemption
      ├─ Load active PartnerAgreement — read commissionPercent + termMonths
      ├─ Determine current periodMonth (1..termMonths)
      ├─ If periodMonth > termMonths → EXIT
      ├─ amount = round(invoice.netExVat * rate)
      ├─ Create FounderCommission(status=PENDING, lockedUntil=+7d, idempotencyKey)
      ├─ Post FinancialLedgerEntry(FOUNDER_COMMISSION_ACCRUED, ...)
      └─ Emit founder.commission.accrued
```

### 10.3 Status transitions
```
PENDING ──(7-day lock + invoice not refunded)──► VALIDATED
VALIDATED ──(monthly payout run)──► PAID
PENDING/VALIDATED ──(refund/chargeback)──► REVERSED (inverse ledger entry)
```

### 10.4 Renewals / upgrades / downgrades
- **Renewal**: normal accrual.
- **Upgrade**: applies to new (higher) invoice from that cycle; no backfill.
- **Downgrade**: applies to new (lower) invoice next cycle.
- **Mid-cycle plan switch**: prorated net-exVAT is the base.

### 10.5 Refunds / failed payments / chargebacks
- **Refund** → `FOUNDER_COMMISSION_REVERSED` for exact amount, idempotent by `refundId`.
- **Failed payment** → no accrual (gated on `PAID`).
- **Chargeback** → full reversal + clawback (§10.7) if already paid.

### 10.6 Cancellation
No future accrual after last paid cycle. Already-paid commissions remain valid.

### 10.7 Clawback
`FounderClawback` offsets future payouts. If future accrual is insufficient, remains OPEN and triggers manual settlement.

### 10.8 Custom agreements
`PartnerAgreement` supports:

| Field | Semantics |
|---|---|
| `commissionPercent` | Default rate |
| `termMonths` | Default duration (12) |
| `tieredRates` (JSON) | e.g. `[{months:1-3,pct:25},{months:4-12,pct:15}]` |
| `flatBonusCents` | One-time on first paid invoice |
| `milestoneRules` (JSON) | e.g. "+5% if ≥20 signups in Q1" |
| `perPlanOverrides` (JSON) | Different rate per `Plan.code` |
| `exclusivityBonusCents` | If exclusive in category |

Engine reads agreement per invoice; new deals = pure config, no code changes.

### 10.9 12-month expiration
When `periodMonth > termMonths`, engine logs `FOUNDER_COMMISSION_EXPIRED` (informational) and stops. Business remains attributed for analytics.

### 10.10 Ledger integration (canonical)
New `BillingEventType` values:
- `FOUNDER_COMMISSION_ACCRUED`
- `FOUNDER_COMMISSION_VALIDATED`
- `FOUNDER_COMMISSION_PAID`
- `FOUNDER_COMMISSION_REVERSED`
- `FOUNDER_COMMISSION_CLAWED_BACK`
- `FOUNDER_TRIAL_GRANTED` (informational, `amountCents=0`)
- `FOUNDER_CODE_REDEEMED` (informational)

Each entry: `idempotencyKey = "founder:{commissionId}:{status}"`. Revenue analytics read `FinancialLedgerEntry` exclusively per finance rule.

---

## 11. Partner Dashboard (`/partners/dashboard`)

Sections:
1. **Overview** — Active codes, MTD signups, MTD conversions, MRR generated, next payout date.
2. **Codes** — Per-code stats, share links, QR downloads.
3. **Campaigns** — Active/paused/scheduled with funnel.
4. **Referrals** — Pipeline: `PENDING_REVIEW / TRIALING / CONVERTED / CHURNED`, anonymized business names by default (owner may opt in).
5. **Earnings** — Accrued / validated / paid / next payout; CSV export; per-invoice breakdown.
6. **Payouts** — History, method, status.
7. **Agreement** — Current PDF, term end, renewal ETA.
8. **Marketing kit** — Brand assets, one-liners, embed snippets, video shorts, per-category talking points.
9. **Support** — Direct-line messaging to Partnership Manager, meeting scheduler.
10. **Notifications** — Signup pings, monthly recap, campaign alerts.

Privacy: aggregate + anonymized by default. Individual names revealed only via business-owner opt-in during signup ("Let my referrer see I signed up").

---

## 12. Internal Administration (`/admin/partnerships`)

### 12.1 Modules
- **Pipeline** — Kanban of applications + outbound prospects across CRM stages.
- **Partners** — Directory, filters by category/status/GMV.
- **Agreements** — Draft / active / expiring / expired; template management.
- **Codes** — Create/edit/pause/revoke/bulk; per-code analytics.
- **Campaigns** — Attach codes, set windows, goals, results.
- **Commissions** — Accrual queue, validation queue, payout runs, reversals.
- **Payouts** — Monthly run, method routing (MoMo / bank), export.
- **Fraud** — Flags, holds, forced reviews.
- **QBRs** — Reviews per partner, notes, decisions.
- **Analytics** — §14.

### 12.2 Approval workflows
- New agreement: **Partnerships Manager** proposes + **Finance Lead** approves rates and terms >12mo.
- Rate above `PARTNERSHIP_MAX_STANDARD_RATE` (e.g. 25%) → CFO approval.
- Payout release: dual control (Finance Lead + Partnerships Lead).
- Active-code revocation: assigned Partnership Manager or admin above.

---

## 13. CRM Capabilities

- **Activity timeline** — every email, call, meeting, note, file (`PartnerActivity`).
- **Notes with @mentions** — internal, private.
- **Tasks & next actions** — assign, due dates, reminders.
- **Meetings** — calendar link, log outcomes, attach recordings.
- **Documents** — proposals, agreements, brand kits.
- **Segmentation & lists** — saved filters (e.g. "TV channels not contacted in 90 days").
- **Outreach sequences** — templated multi-step (email + WhatsApp) with per-step throttling.
- **Pipeline forecasting** — expected close date × probability = expected MRR.
- **Deal history** — full negotiation audit trail.

---

## 14. Analytics — KPIs

### 14.1 Partner-level
- Total signups (all-time / MTD / QTD)
- Qualified signups (business approved)
- Conversion to paid (`% signups → paid`)
- MRR generated, ARR run-rate
- Retention @ 3 / 6 / 12 months
- Commission accrued vs paid
- Partner NPS
- Partner ROI (`platform_revenue / commission_paid`)
- Time-to-first-signup (activation lag)

### 14.2 Code-level
- Impressions · clicks · signups · qualified · conversion · fraud rate
- Trials extended, extended-trial paid conversion
- Average LTV per referred business

### 14.3 Campaign-level
- Funnel reach → click → signup → qualified → paid
- Per-campaign CAC and LTV
- Cohort retention

### 14.4 Trial engine
- 14-day vs 30-day paid conversion (baseline vs Founder)
- Trial-to-paid time (median)
- Post-signup trial extensions granted

### 14.5 Platform-level
- Program-level CAC reduction vs paid ads
- Share of net-new MRR from Founder Partner channel
- Concentration risk (top-10 partners as % of channel MRR — target < 60%)
- Geographic coverage (partners per province / country)
- Category diversification index

All metrics computed from `FinancialLedgerEntry` (financials) + `FounderPartner` / `FounderCode` / `FounderCodeRedemption` (attribution). No double-count risk.

---

## 15. Fraud Prevention

Reuse and extend the existing `FraudDetectionService` (already covers device/IP/velocity for referral clicks).

### 15.1 Vectors and mitigations

| Vector | Mitigation |
|---|---|
| Self-referral (partner refers own business) | Compare partner email/phone/domain vs signup — silent block (pattern at `src/pages/api/auth/signup.ts:76-83`) |
| Duplicate accounts / trial cycling | Existing `TrialEligibilityService` — unchanged |
| Code enumeration / brute force | Rate-limit `/api/f/{code}` and signup by IP+code |
| Fake subscriptions (partner + collusion) | 7-day commission hold + refund/chargeback reversal; anomaly detection on signup IP clusters |
| Commission fraud (fake invoices) | Only `INVOICE_PAID` from real providers triggers accrual; no manual invoice path |
| Trial-length abuse | `PARTNERSHIP_MAX_TRIAL_DAYS = 90` capped at creation + redemption; `Business.trialSource` audited |
| Attribution stealing | Founder deterministic precedence; attempts logged |
| Wash / self-purchase | Cross-check card / MoMo phone vs partner phone; distinct KYC per business |
| Payout to compromised account | Dual control + 24h delay on payout-method change |

### 15.2 Risk scoring
Extend `ProfessionalMarketer.riskProfile` pattern to `FounderPartnerRiskProfile`: `riskScore`, `riskLevel`, `flags[]`, updated on anomalies.

Auto-holds:
- Risk ≥ HIGH → payouts held pending manual review.
- 3+ signup fraud flags in 30 days → partner paused, agreement review triggered.

---

## 16. Security

### 16.1 Roles (additive)
- `PARTNERSHIPS_MANAGER` — CRUD partners/codes/campaigns; approve applications; **cannot** approve payouts.
- `PARTNERSHIPS_LEAD` — Above + approve agreements ≤ standard bands.
- `PARTNERSHIPS_FINANCE` — Approve payouts, reversals, custom rates.
- `PARTNER_USER` — External partner login (own dashboard only).
- `PARTNER_OBSERVER` — Read-only partner user (their finance staff).

Existing OWNER / ADMIN roles retain full access.

### 16.2 Audit logs
Every mutation writes `PartnershipAuditLog`: actor, action, before/after JSON, IP, user-agent. Immutable, append-only, exportable.

### 16.3 Access controls
- Partner dashboard tokens scoped to `FounderPartner.id`.
- Signed URLs for agreements / marketing kits.
- MFA required for `PARTNERSHIPS_FINANCE` on payout-run actions.

### 16.4 Approval workflows
Encoded in `PartnershipApprovalPolicy` (JSON per action). Example: `payout.release` → `[PARTNERSHIPS_FINANCE, PARTNERSHIPS_LEAD]`, distinct actors, MFA on both.

---

## 17. Database Architecture (Prisma models)

**All new**. No existing model is renamed or restructured. Only illustrative essentials shown.

```prisma
// ============================================================
// FOUNDER PARTNER PROGRAM (V2) — additive, isolated
// ============================================================

model FounderPartner {
  id                String   @id @default(cuid())
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  legalName         String
  displayName       String
  category          FounderPartnerCategory
  website           String?
  countryCode       String   @default("RW")
  region            String?
  audienceSize      Int?
  audienceNotes     String?

  primaryContactName   String
  primaryContactEmail  String
  primaryContactPhone  String
  userId               String?  @unique

  status               FounderPartnerStatus @default(PROSPECT)
  source               FounderPartnerSource
  crmStage             String?
  accountManagerId     String?

  notes                String?
  brandAssetsUrl       String?
  taxId                String?
  payoutMethod         PayoutMethod?
  payoutDetails        Json?

  // BC-6: additive UX fields
  welcomeMessage       String?                     // Shown to referred businesses on their first login
  publicShowcaseOptIn  Boolean  @default(false)    // Opt in to appear on the public partner-showcase page

  applications         FounderPartnerApplication[]
  agreements           PartnerAgreement[]
  codes                FounderCode[]
  campaigns            PartnerCampaign[]
  redemptions          FounderCodeRedemption[]
  activities           PartnerActivity[]
  commissions          FounderCommission[]
  payouts              FounderPartnerPayout[]
  riskProfile          FounderPartnerRiskProfile?
  qbrs                 PartnerQBR[]

  @@index([status])
  @@index([category])
  @@index([countryCode, region])
}

enum FounderPartnerCategory {
  MEDIA_TV MEDIA_DIGITAL CREATOR CONSULTANT ASSOCIATION
  TOURISM_ORG CHAMBER COMMUNITY ENTERPRISE OTHER
}

enum FounderPartnerStatus {
  PROSPECT APPLIED IN_REVIEW IN_NEGOTIATION APPROVED
  ACTIVATED RENEWED EXPANDED EXPIRED PAUSED OFF_BOARDED
  REJECTED DECLINED TERMINATED
}

enum FounderPartnerSource { OUTBOUND INBOUND }

model FounderPartnerApplication {
  id           String   @id @default(cuid())
  partnerId    String?
  submittedAt  DateTime @default(now())
  status       String   @default("SUBMITTED")   // SUBMITTED IN_REVIEW INFO_REQUESTED APPROVED REJECTED
  formData     Json
  reviewerId   String?
  decisionAt   DateTime?
  decisionNote String?
  partner      FounderPartner? @relation(fields: [partnerId], references: [id])

  @@index([status])
}

model PartnerAgreement {
  id                   String   @id @default(cuid())
  partnerId            String
  version              Int      @default(1)
  status               String   @default("DRAFT")   // DRAFT PENDING_APPROVAL ACTIVE SUPERSEDED EXPIRED TERMINATED
  effectiveFrom        DateTime?
  effectiveUntil       DateTime?

  commissionPercent    Float
  termMonths           Int      @default(12)
  tieredRates          Json?
  flatBonusCents       Int?
  milestoneRules       Json?
  perPlanOverrides     Json?
  exclusivityBonusCents Int?
  clawbackPolicy       String?
  brandUsage           String?
  terminationTerms     String?
  documentUrl          String?

  createdBy            String
  approvedBy           String?
  approvedAt           DateTime?
  supersedesId         String?  @unique
  partner              FounderPartner @relation(fields: [partnerId], references: [id])

  @@index([partnerId, status])
}

model FounderCode {
  id              String   @id @default(cuid())
  code            String   @unique
  partnerId       String
  agreementId     String?

  trialDays              Int      @default(30)
  attributionWindowDays  Int?                       // BC-6: nullable; falls back to platform default (30)
  status          String   @default("ACTIVE")     // DRAFT ACTIVE PAUSED EXPIRED REVOKED
  activeFrom      DateTime @default(now())
  activeUntil     DateTime?
  maxRedemptions  Int?
  redemptionCount Int      @default(0)
  perGeoRestriction Json?

  createdBy       String
  revokedAt       DateTime?
  revokedBy       String?

  partner         FounderPartner   @relation(fields: [partnerId], references: [id])
  campaigns       FounderCodeCampaign[]                        // BC-5: many-to-many
  redemptions     FounderCodeRedemption[]

  @@index([partnerId, status])
}

// BC-5: junction — a single code (e.g. ISIMBI30) can be attached to multiple campaigns
// (e.g. "TV spring push" + "YouTube shorts") for the same partner.
model FounderCodeCampaign {
  id         String   @id @default(cuid())
  codeId     String
  campaignId String
  attachedAt DateTime @default(now())
  attachedBy String?

  code       FounderCode     @relation(fields: [codeId], references: [id], onDelete: Cascade)
  campaign   PartnerCampaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)

  @@unique([codeId, campaignId])
  @@index([campaignId])
}

model FounderCodeRedemption {
  id                String   @id @default(cuid())
  codeId            String
  partnerId         String
  businessId        String
  redeemedAt        DateTime @default(now())
  trialDaysGranted  Int
  ipAddress         String?
  deviceId          String?
  attributionResult String                        // "WON" | "OVERRIDDEN"
  code              FounderCode    @relation(fields: [codeId], references: [id])
  partner           FounderPartner @relation(fields: [partnerId], references: [id])

  @@unique([codeId, businessId])
  @@index([partnerId, redeemedAt])
  @@index([businessId])
}

model PartnerCampaign {
  id           String   @id @default(cuid())
  partnerId    String
  name         String
  channel      String                             // TV | YOUTUBE | INSTAGRAM | EVENT | EMAIL
  status       String   @default("SCHEDULED")     // SCHEDULED LIVE PAUSED ENDED
  startsAt     DateTime
  endsAt       DateTime?
  goals        Json?
  budgetCents  Int?
  notes        String?
  partner      FounderPartner @relation(fields: [partnerId], references: [id])
  codes        FounderCodeCampaign[]              // BC-5: many-to-many

  @@index([partnerId, status])
}

model FounderCommission {
  id             String   @id @default(cuid())
  partnerId      String
  businessId     String
  invoiceId      String?
  agreementId    String
  type           String                            // ACCRUAL | FLAT_BONUS | MILESTONE | REVERSAL | CLAWBACK
  amountCents    Int
  currency       String   @default("RWF")
  status         String   @default("PENDING")      // PENDING VALIDATED PAID REVERSED VOID
  periodMonth    Int?
  lockedUntil    DateTime?
  validatedAt    DateTime?
  paidAt         DateTime?
  reversedAt     DateTime?
  idempotencyKey String   @unique
  ledgerEntryIds Json?
  description    String?
  partner        FounderPartner @relation(fields: [partnerId], references: [id])

  @@index([partnerId, status])
  @@index([businessId])
  @@index([status, lockedUntil])
}

model FounderPartnerPayout {
  id               String   @id @default(cuid())
  partnerId        String
  amountCents      Int
  currency         String   @default("RWF")
  method           PayoutMethod
  status           PayoutStatus @default(PENDING)
  approvedBy       String?
  approvedAt       DateTime?
  paidAt           DateTime?
  failedAt         DateTime?
  reference        String?  @unique
  recipientPhone   String?
  recipientBank    String?
  recipientAccount String?
  partner          FounderPartner @relation(fields: [partnerId], references: [id])

  @@index([partnerId, status])
}

model FounderPartnerRiskProfile {
  id         String   @id @default(cuid())
  partnerId  String   @unique
  riskScore  Int      @default(0)
  riskLevel  String   @default("LOW")             // LOW MEDIUM HIGH
  flags      String[]
  updatedAt  DateTime @updatedAt
  partner    FounderPartner @relation(fields: [partnerId], references: [id])
}

model PartnerActivity {
  id           String   @id @default(cuid())
  partnerId    String
  actorUserId  String
  kind         String                              // EMAIL CALL MEETING NOTE STAGE_CHANGE FILE
  stageBefore  String?
  stageAfter   String?
  subject      String?
  body         String?
  fileUrl      String?
  occurredAt   DateTime @default(now())
  partner      FounderPartner @relation(fields: [partnerId], references: [id])

  @@index([partnerId, occurredAt])
}

model PartnerQBR {
  id           String   @id @default(cuid())
  partnerId    String
  scheduledFor DateTime
  heldAt       DateTime?
  outcomes     Json?
  nextActions  Json?
  partner      FounderPartner @relation(fields: [partnerId], references: [id])
}

model PartnershipAttributionAttempt {
  id            String   @id @default(cuid())
  businessId    String
  codePresented String
  resolvedTier  String                             // FOUNDER | AFFILIATE | MARKETER | CUSTOMER | NONE
  wonBy         String?
  reason        String?
  ipAddress     String?
  deviceId      String?
  createdAt     DateTime @default(now())

  @@index([businessId])
}

model PartnershipAuditLog {
  id         String   @id @default(cuid())
  actorId    String
  action     String
  targetType String
  targetId   String
  beforeJson Json?
  afterJson  Json?
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())

  @@index([targetType, targetId])
  @@index([actorId, createdAt])
}
```

### 17.1 Additions to `Business` (nullable, non-breaking)

```prisma
model Business {
  // ... existing fields unchanged ...
  trialSource            String?  // "STANDARD" | "FOUNDER_CODE" | "MANUAL_ADMIN"
  trialSourceCodeId      String?  // FounderCode.id
  trialDaysGranted       Int?
  founderPartnerId       String?  // denormalized attribution
  referrerRevealConsent  Boolean  @default(false)  // BC-6: business owner opts in to have their name visible to their referrer
}
```

Migration: `ALTER TABLE ... ADD COLUMN` — nullable, no backfill (null = STANDARD).

### 17.2 Extension to `BillingEventType` enum
Add: `FOUNDER_COMMISSION_ACCRUED`, `FOUNDER_COMMISSION_VALIDATED`, `FOUNDER_COMMISSION_PAID`, `FOUNDER_COMMISSION_REVERSED`, `FOUNDER_COMMISSION_CLAWED_BACK`, `FOUNDER_TRIAL_GRANTED`, `FOUNDER_CODE_REDEEMED`.

### 17.3 Hot-path indexes
- `FounderCode.code` unique
- `FounderCodeRedemption(codeId,businessId)` composite unique (idempotency)
- `FounderCommission(partnerId,status)` + `(status,lockedUntil)` for validation cron
- `FinancialLedgerEntry(eventType,occurredAt)` — existing

---

## 18. Event-Driven Architecture

Events flow through the existing `RevenueEventService.emit` pattern (`src/lib/services/marketer-commission.service.ts:72-82`).

### 18.1 Domain events
```
founder.partner.applied
founder.partner.approved
founder.partner.rejected
founder.partner.activated
founder.partner.paused
founder.partner.terminated
founder.agreement.drafted
founder.agreement.approved
founder.agreement.activated
founder.agreement.expired
founder.code.created
founder.code.activated
founder.code.paused
founder.code.revoked
founder.code.redeemed
founder.trial.extended
founder.commission.accrued
founder.commission.validated
founder.commission.paid
founder.commission.reversed
founder.commission.expired
founder.payout.requested
founder.payout.approved
founder.payout.completed
founder.payout.failed
founder.campaign.launched
founder.campaign.paused
founder.campaign.ended
founder.fraud.flagged
founder.clawback.opened
founder.clawback.resolved
```

### 18.2 Consumers
- **Notification service** — emails, dashboard alerts, WhatsApp (§20).
- **Analytics collector** — aggregation tables + `FinancialLedgerEntry` when financial.
- **Alerting** — high-severity (fraud, payout failure) fan out to `AlertDeliveryService`.
- **Audit logger** — writes `PartnershipAuditLog`.

Events idempotent; carry `eventId` + `occurredAt`.

---

## 19. API Design

Namespace: `/api/founder-partners/*` (partner), `/api/admin/founder-partners/*` (admin), `/api/f/{code}` (redirect / QR).

### 19.1 Partner-facing
```
POST   /api/founder-partners/applications                 Inbound application
GET    /api/founder-partners/applications/:id             Applicant polls (token)

POST   /api/founder-partners/session                      Portal login (email + OTP)
GET    /api/founder-partners/me                           Profile + summary
GET    /api/founder-partners/me/codes                     Own codes + stats
GET    /api/founder-partners/me/campaigns
GET    /api/founder-partners/me/referrals                 Anonymized pipeline
GET    /api/founder-partners/me/earnings
GET    /api/founder-partners/me/payouts
POST   /api/founder-partners/me/payout-request
GET    /api/founder-partners/me/agreement
GET    /api/founder-partners/me/marketing-kit

GET    /api/f/:code                                       Track click + set cookie + redirect
GET    /api/founder-partners/codes/:code/preview          Public code metadata
POST   /api/founder-partners/codes/apply-post-signup      Extend trial post-signup (auth)
```

### 19.2 Admin
```
GET    /api/admin/founder-partners
POST   /api/admin/founder-partners                        Create (outbound)
GET    /api/admin/founder-partners/:id
PATCH  /api/admin/founder-partners/:id
POST   /api/admin/founder-partners/:id/status             State transition

GET    /api/admin/founder-partners/applications
POST   /api/admin/founder-partners/applications/:id/approve
POST   /api/admin/founder-partners/applications/:id/reject
POST   /api/admin/founder-partners/applications/:id/request-info

POST   /api/admin/founder-partners/:id/agreements
PATCH  /api/admin/agreements/:id
POST   /api/admin/agreements/:id/approve                  Dual-control
POST   /api/admin/agreements/:id/activate
POST   /api/admin/agreements/:id/terminate

POST   /api/admin/founder-codes                           Cross-namespace uniqueness check
PATCH  /api/admin/founder-codes/:id
POST   /api/admin/founder-codes/:id/revoke
GET    /api/admin/founder-codes/:id/analytics

POST   /api/admin/partner-campaigns
PATCH  /api/admin/partner-campaigns/:id
POST   /api/admin/partner-campaigns/:id/launch
POST   /api/admin/partner-campaigns/:id/end

GET    /api/admin/founder-commissions
POST   /api/admin/founder-commissions/:id/validate
POST   /api/admin/founder-commissions/:id/reverse         Writes ledger

POST   /api/admin/founder-payouts/run                     Monthly run
POST   /api/admin/founder-payouts/:id/approve
POST   /api/admin/founder-payouts/:id/mark-paid
POST   /api/admin/founder-payouts/:id/mark-failed

GET    /api/admin/founder-analytics/{overview|codes|partners|campaigns}
```

### 19.3 Contracts
- Typed error envelopes: `{ error, code, details? }`.
- Rate-limited via existing `withRateLimit` middleware.
- Validated with zod schemas at `src/lib/validations/founder-partner.schema.ts`.

### 19.4 GraphQL (optional, future)
Expose `FounderPartner`, `PartnerAgreement`, `FounderCode`, `FounderCommission` with paginated connections + DataLoader batching. Not required for v1.

---

## 20. Notification System

Channels: email (transactional), dashboard, WhatsApp (opt-in), Slack (internal).

### 20.1 Partner notifications
- Application submitted / status changes
- Agreement ready to sign
- Code activated / paused / expiring in 7 days
- New signup (opt-in, throttled to daily digest by default)
- Commission accrued / validated / paid
- Payout status
- QBR reminder (7 days prior)

### 20.2 Internal notifications
- New inbound application (routed by category)
- Application aging in queue > 48h
- Payout run ready to approve
- Fraud flag raised
- Agreement expiring < 30 days
- Partner NPS drop / churn signal

### 20.3 Templates
Managed in `PartnershipNotificationTemplate` per existing pattern. Locale-aware: `en`, `fr`, `rw` (matching `public/locales/`).

---

## 21. Legal Considerations

Encoded in `PartnerAgreement` and enforced by policy:

- **Mandatory clauses** — parties, term, territory, commission schedule, exclusivity, brand usage, data protection (Rwanda Law N° 058/2021), termination, dispute resolution, governing law.
- **Brand usage** — approved logos, guidelines URL, prohibited uses (competitor comparisons, medical claims). Signed in the doc; marketing-kit endpoint is the canonical source.
- **Termination** — for cause (fraud, brand damage) → immediate + clawback; for convenience → 30-day notice; earned commissions honored per §10.
- **Taxes** — WHT applied per country. Rwanda default 15% (`FeeConfiguration.whtRate` already 15%). Partner responsible for own income tax; ImboniServe issues year-end statements.
- **Payout rules** — minimum threshold `PARTNERSHIP_MIN_PAYOUT_CENTS` (e.g. 500,000 = 5,000 RWF); below-threshold rolls over; monthly cadence by default (N+1 month for the previous month); dual-control release.
- **Code ownership** — codes are **licensed to the partner for the agreement term**; on termination they revert to ImboniServe (revoked, historical redemptions preserved).
- **Data protection** — attribution data anonymized in partner dashboard by default; consented reveal only.
- **KYC on payout accounts** — required; changes trigger 24h cooling-off before payouts resume.

---

## 22. Migration Strategy

The migration is **strictly additive** and **zero-downtime**.

### Phase 0 — Pre-flight bug fixes and shared services [1–2 sprints] (BC-1)

**Mandatory before Phase A.** Fixes pre-existing bugs (see `docs/FOUNDER_PARTNER_PROGRAM_UX_REVIEW.md` B1–B7) that would silently corrupt Founder attribution if left in place. All items ship behind `unified_attribution_resolver_enabled` flag with a full rollback path.

1. **Cookie unification (B1)** — `/api/r/{code}` writes both `referral_code` (legacy, 60-day deprecation) and `im_ref` (canonical). `/api/auth/signup` reads both.
2. **Signup URL param hydration (B2)** — `src/pages/signup.tsx` reads `?ref=`, `?partner=`, `?m=`, `?invite=` and pre-fills `formData.referralCode`; disabled-but-clearable when arrived from a partner link.
3. **AttributionResolver service (B3, B11)** — new `src/lib/services/attribution-resolver.service.ts`; walks Founder → Affiliate → Marketer → ReferralLink → CustomerReferral → BusinessInvite. Wired into `/api/auth/signup`. Fixes today's silent-drop of marketer and CUST-XXXX codes.
4. **`GET /api/codes/resolve`** — read-only, rate-limited code preview for the signup page's live-validate UX. Returns `{ valid, tier, trialDays, partnerDisplayName? }`.
5. **`TrialPolicyService` (server) + `<TrialLengthLabel />` (client)** — single source of trial copy (BC-4). CI lint blocks new hardcoded `\b14-?day\b` literals.
6. **Copy audit** — refactor every hardcoded `14-day` in `signup.tsx`, `pricing.tsx`, `index.tsx`, `features/*.tsx`, `service-terms.tsx` behind `<TrialLengthLabel />` / `t()`.
7. **Post-signup `/welcome` page (B4)** — real confirmation screen showing trial length, end-date, and (if applicable) partner acknowledgement.
8. **Business-dashboard trial pill (B6)** — top-right widget showing days remaining + "Have a code?" post-signup application affordance.
9. **Cleanup of misleading `AFFILIATE` dropdown option (B8)** — remove from public signup or wire up the proper `Affiliate` creation path.
10. **Persona e2e Playwright suite** — one script per persona A–K in `tests/e2e/partnership/`; must pass before Phase A merge.

**Success criteria**: 100% of persona journeys pass; zero attribution regressions in staging; no user-visible behavior change for existing personas (A, E, F, G under standard trial).

### Phase A — Ship (behind feature flag) [1 sprint]
1. Prisma migration: create all new tables (§17), extend `BillingEventType` enum, add nullable columns on `Business`.
2. Deploy `TrialPolicyService` — still returns 14 days for everyone until `FounderCode` records exist.
3. Refactor the two hardcoded trial sites (`src/pages/api/auth/signup.ts:117-119`, `src/lib/services/business-approval.service.ts:310-312`) to call `TrialPolicyService.resolveTrialDays()`.
4. **Compatibility contract test** — a smoke test asserts existing signups (no code, Affiliate code, ReferralLink code, CustomerReferral, Marketer code) still produce identical `Business` rows as before, plus `trialSource = STANDARD` on the new column.
5. Roll out to production with feature flag `founder_partners_enabled=false`. No user-visible change.

### Phase B — Admin surface [1 sprint]
1. Ship `/admin/partnerships/*` UI.
2. Ship `AttributionResolver` service — with Founder resolver present but flag-gated at the top layer (falls through to Affiliate flow while flag is off).
3. Ship `CommissionEngine` (subscribes to invoice-paid events; no-op when flag off).
4. Ship `NotificationTemplates` and `PartnershipAuditLog`.

### Phase C — Pilot [2 sprints]
1. Flip flag ON only for internally-created partners.
2. Onboard 3–5 anchor partners (1 media, 1 creator, 1 association).
3. Monitor:
   - `Business.trialSource` distribution
   - `FinancialLedgerEntry` counts for new event types (should reconcile with `FounderCommission`)
   - Alert on any commission dispute or double-attribution
4. QBR after 30 days.

### Phase D — Inbound applications [1 sprint]
1. Publish `/partners/apply` public page.
2. Enable inbound application flow.
3. Marketing kit + partner portal go live.

### Phase E — General availability
1. Publish partnership page + code marketplace to select regions.
2. Enable full self-serve partner portal.
3. Continuous risk monitoring + monthly payout runs.

### Rollback
Feature flag off → new codes return `not found` at resolver → fallback to 14-day trial → no data loss; ledger entries and commission rows remain queryable as historical.

### Compatibility test matrix (must pass at every phase)

| Test | Expected |
|---|---|
| Signup with no code | 14-day trial, no Founder attribution, `trialSource=STANDARD` |
| Signup with valid Affiliate code (via `?ref=` **or** cookie) | 14-day trial, `referredByAffiliateId` set (unchanged), `trialSource=STANDARD`, `PartnershipAttributionAttempt.wonBy='AFFILIATE'` |
| Signup with ReferralLink code | Unchanged path; `trialSource=STANDARD`; `ReferralClick.convertedAt` set |
| Signup with Marketer code `?m=MKT-XXXX` | **NEW: now attributes correctly** (post-Phase-0). `MarketerAttribution` row created; `trialSource=STANDARD` |
| Signup with CustomerReferral (`CUST-XXXX`) | **NEW: now flips to `CONVERTED` at signup** (post-Phase-0); `trialSource=STANDARD` |
| Signup with new Founder code `ISIMBI30` | 30-day trial, `trialSource=FOUNDER_CODE`, `FounderCodeRedemption` created, `Business.founderPartnerId` set |
| Signup with expired Founder code | Silent fallback to 14 days; no attribution; `PartnershipAttributionAttempt.wonBy=NONE` |
| Signup with Founder + Affiliate cookies | Founder wins; Affiliate logged in `PartnershipAttributionAttempt` |
| Post-signup Founder-code application (no invoice yet) | Trial extended, `trialSource=FOUNDER_CODE`, `FounderCodeRedemption` created, `founder.trial.extended` emitted |
| Post-signup Founder-code application (after paid invoice) | Rejected 400 |
| Refund on Founder-attributed invoice | Reversal ledger entry; `FounderCommission.status = REVERSED` |

---

## 23. Future Roadmap

- **Partner Tiers** (Bronze / Silver / Gold / Platinum) — auto-tier by MRR generated, unlocks perks (higher default rate, personal AM, priority support).
- **Certifications** — "ImboniServe Certified Consultant", exam + badge + directory listing.
- **Partner Badges** — displayed on partner profile pages: "Top Producer Q1 2027", "First 10 Partners", "Association Anchor".
- **Seasonal Campaigns** — Ramadan Push, Tourism Season, End-of-Year Deals with joint marketing budgets.
- **Leaderboards** — public quarterly leaderboards (opt-in) create healthy competition.
- **Hospitality Ambassadors** — top-performing creators become paid ambassadors with retainer + revenue share.
- **Regional Partner Managers** — dedicated PMs per province / country as scale demands.
- **Partner Academy** — LMS with modules on selling ImboniServe, hospitality digitalization, ROI storytelling. Completion → certification.
- **Community Events** — annual Partner Summit, quarterly virtual roundtables.
- **AI Partner Insights** — LLM-powered next-best-action for AMs, churn-risk prediction for partners, personalized content suggestions.
- **Multi-market expansion** — country-scoped agreements + FX/withholding-tax handling for East African rollout.
- **Marketplace of pre-built partner integrations** — POS resellers, PMS integrators bundling ImboniServe.
- **Revenue-share for hardware/services** — resellers who deploy printers/tablets earn share on hardware + software.
- **Programmable payouts** — same-day MoMo for partners meeting KYC + trust thresholds.
- **Attribution-graph analytics** — multi-touch attribution across Founder + Affiliate + community channels.
- **Partner API** — allow enterprise partners to embed signup flow with their branding + auto-attributed.

---

## Appendix A — Existing Codebase Anchors

- Trial constant: `src/config/pricing.ts:184-190`
- Trial application: `src/pages/api/auth/signup.ts:117-119`
- Admin trial application: `src/lib/services/business-approval.service.ts:310-312`
- Affiliate attribution (Tier 1): `src/pages/api/auth/signup.ts:69-84`
- ReferralLink click redirect: `src/pages/api/r/[code].ts:1-55`
- Tier 2/3 rewards engine: `src/lib/services/referral-tracking-tier.service.ts:1-377`
- Simple customer referral: `src/pages/api/customer-referrals/generate.ts`, `src/pages/api/customer-referrals/track.ts`
- Marketer commission (pattern to mirror for Founder): `src/lib/services/marketer-commission.service.ts:1-179`
- Ledger truth: `prisma/schema.prisma` — `FinancialLedgerEntry` (with unique `idempotencyKey`)
- Fraud detection: `src/lib/services/fraud-detection.service.ts`
- Trial eligibility: `src/lib/services/trial-eligibility.service.ts`

## Appendix B — Non-Goals for V2

- Not replacing any of the four existing programs.
- Not exposing Founder commission percentages publicly.
- Not shortening or altering the standard 14-day trial for non-Founder signups.
- Not building a new payment processor (payouts go through existing MoMo/bank integrations).
- Not building a new billing engine (invoices continue to flow through existing `Invoice` + `FinancialLedgerEntry`).
- Not merging `ProfessionalMarketer` and `FounderPartner` — they remain distinct engines addressing different personas (B2B agents vs strategic partners).

