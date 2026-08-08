# PP-001 — Partnership Platform Foundation
## Architecture Decision Record & Implementation Report

**Date:** 2026-07-31  
**Status:** Approved  
**Author:** Engineering  
**Milestone:** PP-001

---

## 1. Partnership Platform Architecture Review

### Problem
The platform had 6 siloed acquisition channels, each with independent models for partners, codes, commissions, payouts, risk profiles, and activity logs:

| Channel | Models |
|---------|--------|
| Founder Partner | `FounderPartner`, `FounderPartnerApplication`, `FounderCode`, `FounderCodeRedemption`, `FounderCommission`, `FounderPartnerPayout`, `FounderPartnerRiskProfile`, `PartnerActivity`, `PartnerQBR`, `PartnershipAuditLog` |
| Affiliate | `Affiliate`, `AffiliateCommission`, `AffiliateCommissionNew`, `AffiliatePayout` |
| Professional Marketer | `ProfessionalMarketer`, `MarketerAttribution`, `MarketerWallet`, `MarketerCommission`, `MarketerPayout`, `MarketerRiskProfile` |
| ReferralLink | `ReferralLink`, `DiningCredit`, `ReferralClick`, `ReferralReward` |
| CustomerReferral | `CustomerReferral` |
| BusinessInvite | `BusinessInvite`, `InviteCredit` |

Shared infrastructure existed but was coupled to `FounderPartner`:
- `PartnerAgreement` — FK to `FounderPartner`
- `PartnerCampaign` — FK to `FounderPartner`
- `PartnerActivity` — FK to `FounderPartner`
- `PartnershipAuditLog` — FK to `FounderPartner`

### Solution
Created a **generalized `Partnership` root entity** that decouples partner lifecycle from any specific partner type. All shared models (agreements, campaigns, codes, commissions, payouts, risk, health, activity, audit) now reference `Partnership` instead of `FounderPartner`.

**Founder Partner becomes a profile** (1:1 with `Partnership`) rather than the root entity. Future partner types will follow the same pattern.

---

## 2. Architecture Decision Record

### ADR-PP-001: Generalized Partnership Root Entity

**Context:** The platform needs to support 14+ partnership types without architectural redesign.

**Decision:** Create a `Partnership` root entity with type-specific profiles linking back via `partnershipId`.

**Consequences:**
- ✅ All partner types share the same lifecycle, agreement, campaign, code, commission, payout, risk, health, and audit infrastructure
- ✅ Adding a new partner type requires only a new profile model + enum value — no schema redesign
- ✅ Analytics queries operate on `Partnership` for cross-type comparisons
- ⚠️ Existing `FounderPartner` models remain for backward compatibility; future migration will deprecate them

### ADR-PP-002: Multi-Touch Attribution Persistence

**Context:** The existing `AcquisitionAttribution` stores only canonical (last-touch) attribution. Future multi-touch attribution requires history.

**Decision:** Created `PartnershipAttribution` for multi-touch attribution history. `AcquisitionAttribution` remains the canonical source of truth.

**Consequences:**
- ✅ First-touch, last-touch, assist, and canonical touches are all persisted
- ✅ `isCanonical` flag links multi-touch history to canonical attribution
- ✅ Future multi-touch attribution models can be computed from history without redesign

### ADR-PP-003: Additive-Only Migration Strategy

**Context:** Production database must not be disrupted.

**Decision:** All changes are additive — new tables, new enums, new enum values, one nullable column on `FounderPartner`. No existing tables are altered or dropped.

**Consequences:**
- ✅ Zero-downtime deployment
- ✅ Full backward compatibility
- ✅ Rollback: drop new tables (no data loss in existing tables)

---

## 3. Prisma Schema Changes

### New Enums (10)
- `PartnershipLifecycleStatus` — PROSPECT → APPLIED → ONBOARDED → ACTIVE → SUSPENDED → REACTIVATED → TERMINATED
- `PartnershipCodeStatus` — ACTIVE, PAUSED, EXPIRED, REVOKED, EXHAUSTED
- `PartnershipCommissionType` — SIGNUP_BONUS, RECURRING_REVENUE, CAMPAIGN_BONUS, TIER_BONUS, REFERRAL_FEE, CUSTOM
- `PartnershipCommissionStatus` — PENDING, VALIDATED, APPROVED, PAID, VOID, CLAWED_BACK
- `PartnershipPayoutStatus` — PENDING, APPROVED, PROCESSING, PAID, FAILED, REJECTED
- `PartnershipAgreementStatus` — DRAFT, SENT, SIGNED, ACTIVE, EXPIRED, TERMINATED, AMENDED
- `PartnershipCampaignStatus` — DRAFT, ACTIVE, PAUSED, COMPLETED, CANCELLED
- `AttributionTouchType` — FIRST_TOUCH, LAST_TOUCH, ASSIST, CANONICAL
- `PartnershipHealthGrade` — A, B, C, D, F

### Extended Enums (3)
- `PartnerType` — Added 12 new values (AFFILIATE, PROFESSIONAL_MARKETER, CUSTOMER_REFERRAL, BUSINESS_INVITE, HOSPITALITY_ASSOCIATION, TOURISM_BOARD, GOVERNMENT_PROGRAM, POS_PARTNER, MARKETPLACE_PARTNER, HARDWARE_RESELLER, TECHNOLOGY_INTEGRATOR, AI_CAMPAIGN_PARTNER)
- `PartnershipEventType` — Added 12 new values (PARTNER_REACTIVATED, AGREEMENT_TERMINATED, CAMPAIGN_CANCELLED, TRIAL_ACTIVATED, TRIAL_EXPIRED, TRIAL_CONVERTED, COMMISSION_APPROVED, PAYOUT_REJECTED, RISK_FLAG_REMOVED, HEALTH_SCORE_UPDATED, ATTRIBUTION_RESOLVED)
- `AttributionSourceType` — Added PARTNERSHIP_CODE, PARTNERSHIP_CAMPAIGN

### New Models (13)
| Model | Purpose | Key Indexes |
|-------|---------|-------------|
| `Partnership` | Root entity for all partner types | status, partnerType, email |
| `PartnershipApplication` | Generalized application flow | status |
| `PartnershipAgreementV2` | Agreement lifecycle with amendment chain | partnershipId, status, effectiveAt |
| `PartnershipCampaignV2` | Campaign management with analytics | partnershipId, status, channel |
| `PartnershipCode` | Code namespace for any partner type | partnershipId, code, status |
| `PartnershipCodeRedemption` | Per-redemption tracking | codeId, businessId |
| `PartnershipAttribution` | Multi-touch attribution history | partnershipId, businessId, sourceType, touchType, isCanonical |
| `PartnershipCommission` | Commission ledger with clawback | partnershipId+status, businessId, status, createdAt, type |
| `PartnershipPayout` | Payout with batch commission refs | partnershipId+status, status, createdAt |
| `PartnershipActivityLog` | Activity tracking | partnershipId+createdAt, type+createdAt |
| `PartnershipRiskProfileV2` | Risk scoring | riskLevel |
| `PartnershipHealthScore` | Health scoring with components | grade, score |
| `PartnershipAuditLogV2` | Audit trail | partnershipId+createdAt, action+createdAt |

### Modified Models (2)
- `FounderPartner` — Added nullable `partnershipId` (1:1 link to `Partnership`)
- `User` — Added `partnership` relation

### New Service
- `src/lib/services/partnership.service.ts` — `PartnershipService` with create, lifecycle management, metrics refresh, search, activity logging, and audit

---

## 4. Database Migration Review

**File:** `prisma/migrations/20260731090000_pp001_partnership_platform/migration.sql`

### Safety Assessment
- ✅ **Additive only** — No DROP, no ALTER on existing columns
- ✅ **Zero-downtime** — All new tables created independently
- ✅ **Backward compatible** — `FounderPartner.partnershipId` is nullable
- ✅ **Properly indexed** — All foreign keys and query patterns indexed
- ✅ **FK constraints** — All relationships properly constrained

### Deployment Considerations
1. **Enum value additions** (`ALTER TYPE ... ADD VALUE`) must run outside a transaction in PostgreSQL. The migration separates these from table creation.
2. **`PartnershipEventType` new values** — Code emitting these events should be deployed after the migration is applied.
3. **No data migration needed** — Existing `FounderPartner` rows continue to function without `partnershipId`. Linking existing partners to `Partnership` rows will be done in PP-002 as a data backfill.
4. **Rollback** — `DROP TABLE` for all new tables; `ALTER TABLE FounderPartner DROP COLUMN partnershipId`. No data loss in existing tables.

---

## 5. Event Architecture

### Existing Events (preserved)
The `PartnershipEvent` model and `PartnershipEventService` remain unchanged. They already support generic event emission via `emit()`.

### New Event Types Added
| Event | When Emitted |
|-------|-------------|
| `PARTNER_REACTIVATED` | Partnership reactivated from SUSPENDED |
| `AGREEMENT_TERMINATED` | Agreement terminated before expiry |
| `CAMPAIGN_CANCELLED` | Campaign cancelled (vs completed) |
| `TRIAL_ACTIVATED` | Trial started via partnership code |
| `TRIAL_EXPIRED` | Trial period ended |
| `TRIAL_CONVERTED` | Trial converted to paid subscription |
| `COMMISSION_APPROVED` | Commission approved (between VALIDATED and PAID) |
| `PAYOUT_REJECTED` | Payout rejected (distinct from FAILED) |
| `RISK_FLAG_REMOVED` | Risk flag cleared |
| `HEALTH_SCORE_UPDATED` | Health score recomputed |
| `ATTRIBUTION_RESOLVED` | Attribution resolved from code |

### Event Reusability
All events are partnership-type-agnostic. The `entityType` field distinguishes whether the event relates to a `Partnership`, `PartnershipCode`, `PartnershipCampaign`, etc. No partner-type-specific events exist.

---

## 6. Attribution Architecture

### Existing System (preserved)
- `AcquisitionAttribution` — canonical attribution, one per business
- `AttributionResolver` — resolves codes across 6 namespaces in precedence order
- `AttributionService` — persists canonical attribution

### New: Multi-Touch Attribution History
`PartnershipAttribution` stores every attribution touch:
- `touchType` — FIRST_TOUCH, LAST_TOUCH, ASSIST, CANONICAL
- `priority` — ordering within a touch type
- `isCanonical` — links to the `AcquisitionAttribution` canonical record
- Full UTM metadata, IP, user agent for analytics

### Future Multi-Touch Support
The schema supports computing any attribution model (first-touch, last-touch, linear, time-decay, position-based) from the `PartnershipAttribution` history without redesign.

---

## 7. Performance Review

### Index Strategy
- All FK columns indexed
- Composite indexes on common query patterns (`partnershipId + status`, `partnershipId + createdAt`)
- Unique constraints on `PartnershipCode.code`, `PartnershipCodeRedemption(codeId, businessId)`, `PartnershipPayout.referenceId`
- `PartnershipHealthScore` indexed by `grade` and `score` for ranking queries

### Query Patterns Supported
- Partner dashboard: `Partnership` by `id` with includes
- Partner list by type/status: indexed `partnerType` + `status`
- Attribution history by business: indexed `businessId` on `PartnershipAttribution`
- Commission ledger by partner: indexed `partnershipId + status`
- Payout history by partner: indexed `partnershipId + status`
- Health score rankings: indexed `grade` + `score`
- Campaign analytics: denormalized `actualSignups`, `actualConversions`, `actualRevenueCents`

### Denormalized Metrics
`Partnership` has lifetime metric columns (`totalSignups`, `totalConversions`, `totalRevenueCents`, `totalCommissionCents`, `totalPayoutsCents`) for O(1) dashboard reads. `PartnershipService.refreshMetrics()` recomputes from source tables.

---

## 8. Analytics Readiness

The schema naturally supports:
- **Customer Acquisition Cost** — `PartnershipCampaignV2.budgetCents` / `actualConversions`
- **Partner ROI** — `totalRevenueCents` / `totalCommissionCents`
- **Campaign ROI** — `actualRevenueCents` / `budgetCents`
- **Geographic Performance** — `Partnership.region` + `PartnershipAttribution.businessId` → Business location
- **Retention by Channel** — `PartnershipAttribution.sourceType` → Business subscription status
- **Conversion Funnels** — `PartnershipAttribution` touch types (FIRST_TOUCH → LAST_TOUCH → CANONICAL)
- **Partnership Health** — `PartnershipHealthScore` with component scores
- **Partner Rankings** — `PartnershipHealthScore.score` + `grade` indexes
- **Lifetime Value by Channel** — `Partnership.totalRevenueCents` grouped by `partnerType`
- **Hospitality Intelligence** — Business + Partnership + Attribution joins

No redesign required for any of these analytics use cases.

---

## 9. Backward Compatibility Verification

### Existing Models — Untouched
- `FounderPartner`, `FounderCode`, `FounderCommission`, `FounderPartnerPayout`, `FounderPartnerRiskProfile`, `FounderPartnerApplication` — all remain with original schema
- `PartnerAgreement`, `PartnerCampaign`, `PartnerActivity`, `PartnershipAuditLog` — remain with FK to `FounderPartner`
- `Affiliate`, `AffiliateCommission`, `AffiliateCommissionNew`, `AffiliatePayout` — untouched
- `ProfessionalMarketer`, `MarketerAttribution`, `MarketerWallet`, `MarketerCommission`, `MarketerPayout`, `MarketerRiskProfile` — untouched
- `ReferralLink`, `CustomerReferral`, `BusinessInvite`, `InviteCredit` — untouched

### Existing Services — Untouched
- `AttributionResolver` — continues resolving codes across existing 6 namespaces
- `AttributionService` — continues persisting canonical attribution
- `TrialPolicyService` — continues computing trial days from attribution
- `PartnershipEventService` — generic, works with new event types automatically

### Existing API Endpoints — Untouched
All existing endpoints continue to function. The new `Partnership` models are not referenced by any existing endpoint.

### TypeScript Compilation
- 0 new errors introduced by PP-001
- Pre-existing errors (186) remain unchanged — all in unrelated modules

---

## 10. Implementation Report

### Files Created
| File | Purpose |
|------|---------|
| `prisma/migrations/20260731090000_pp001_partnership_platform/migration.sql` | Database migration |
| `src/lib/services/partnership.service.ts` | Core Partnership Platform service |

### Files Modified
| File | Changes |
|------|---------|
| `prisma/schema.prisma` | 10 new enums, 13 new models, 3 extended enums, 2 modified models |

### Validation Results
- ✅ Prisma schema validation: Valid
- ✅ Prisma client generation: Successful (v5.22.0)
- ✅ TypeScript compilation: 0 new errors (186 pre-existing, unchanged)
- ✅ Migration SQL: Reviewed, additive-only, properly indexed

### Success Criteria
- [x] Partnership Platform is generalized and reusable
- [x] Founder Partner is the first consumer, not the platform itself
- [x] Existing acquisition channels remain fully backward compatible
- [x] Database foundation is production-ready
- [x] Migration is validated and committed
- [x] Platform is ready for PP-002 (Founder Partner Implementation)

---

## 11. Engineering SOP Compliance

- ✅ Implemented incrementally (schema → migration → service)
- ✅ Validated each step (prisma validate → prisma generate → tsc)
- ✅ Reviewed generated migration SQL
- ✅ Ran type checks
- ✅ No new TypeScript errors
- ✅ Migration committed to repository
- ✅ Backward compatibility verified
- ✅ Final implementation report produced
