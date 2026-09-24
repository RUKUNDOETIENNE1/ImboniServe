# CONTENT-001A — Architecture Reconciliation

> **Mission**: ImboniServe Knowledge & Growth Platform — Implementation Readiness  
> **Document Type**: Architecture Reconciliation  
> **Date**: 2025-08-15  
> **Status**: COMPLETE

---

## 1. Purpose

Reconcile every major CONTENT-001 architectural decision against the current repository. Identify where the architecture aligns with code, where it deviates, and where proposed changes are needed.

## 2. ADR Reconciliation

### ADR-001: Separate Editorial Content from Business-Scoped CMS

**Architecture**: Create new EditorialArticle model, separate from ContentPost.  
**Code reality**: ContentPost exists at `prisma/schema.prisma:817` with `businessId` (required), types MICROBLOG/PHOTO/SHORT_VIDEO/PROMO/COMBO, status DRAFT/PENDING_REVIEW/APPROVED/SCHEDULED/PUBLISHED/EXPIRED/REJECTED. CmsService at `src/lib/services/cms.service.ts` enforces business scoping.  
**Verdict**: ✅ **ALIGNED** — No conflicts. EditorialArticle will be a new model with no businessId. ContentPost remains untouched.

### ADR-002: Content Type as String, Not Enum

**Architecture**: Store content type as String with application-level validation.  
**Code reality**: ContentPost.type is already a String (not enum). CmsService defines PostType as a TypeScript union type.  
**Verdict**: ✅ **ALIGNED** — Same pattern. EditorialArticle.type will be String.

### ADR-003: Product References via String Keys

**Architecture**: Use `productKey` (String) in ArticleProductLink, maintain config file registry.  
**Code reality**: No existing product reference mechanism in content. Product features are described in homepage sections and feature pages.  
**Verdict**: ✅ **ALIGNED** — New pattern, no conflicts. `src/config/product-keys.ts` will be a new file.

### ADR-004: Newsletter Issue as EditorialArticle

**Architecture**: Newsletter issue is EditorialArticle with type "Newsletter", linked 1:1 to NewsletterIssue.  
**Code reality**: NewsletterSubscriber exists but no NewsletterIssue model. NewsletterService handles only subscriber management.  
**Verdict**: ✅ **ALIGNED** — NewsletterIssue will be new model. No conflicts with existing newsletter infrastructure.

### ADR-005: Email Provider Abstraction

**Architecture**: Define EmailProvider interface, implement logging provider for dev.  
**Code reality**: No email provider exists. No email sending infrastructure.  
**Verdict**: ✅ **ALIGNED** — New interface. Phase A defines interface only; Phase B implements real provider.

### ADR-006: SEO Metadata as Json Field

**Architecture**: Store SEO metadata as Json field on EditorialArticle.  
**Code reality**: PublicLayout at `src/components/PublicLayout.tsx` accepts `title` and `metaDescription` props. No per-content SEO metadata storage.  
**Verdict**: ✅ **ALIGNED** — seoMeta Json field on EditorialArticle. PublicLayout extended or ArticleLayout created for article pages.

### ADR-007: Content Truth as Json Metadata

**Architecture**: Store content truth/evidence as Json field on EditorialArticle.  
**Code reality**: No existing evidence/verification system.  
**Verdict**: ✅ **ALIGNED** — New Json field. No conflicts.

### ADR-008: Knowledge Entity as Flat Model with Hierarchy

**Architecture**: Single KnowledgeEntity model with type (String) and parentId (self-referencing).  
**Code reality**: No existing knowledge model.  
**Verdict**: ✅ **ALIGNED** — New model. No conflicts.

### ADR-009: Signal Capture as Manual + DemoRequest Auto-Capture

**Architecture**: Manual signal entry + auto-capture from DemoRequest.  
**Code reality**: DemoRequest exists at `prisma/schema.prisma:4067` with name, businessName, contact, message, status. DemoRequestService at `src/lib/services/demo-request.service.ts` handles CRUD.  
**Verdict**: ✅ **ALIGNED** — Signal model is new. DemoRequest auto-capture is a Phase B feature. Phase A creates Signal model with manual entry only.

### ADR-010: Privacy-First Analytics (Plausible)

**Architecture**: Recommend Plausible, support GA4 alternative, configurable via env vars.  
**Code reality**: No analytics provider integrated. PostEngagement tracks video views only.  
**Verdict**: ✅ **ALIGNED** — New integration. Phase A adds provider-agnostic script snippet.

### ADR-011: Dynamic Sitemap

**Architecture**: Replace static sitemap with dynamic sitemap index.  
**Code reality**: `src/pages/sitemap.xml.ts` has 10 hardcoded URLs.  
**Verdict**: ✅ **ALIGNED** — Refactor existing file. No conflicts with existing URLs (they remain in the static-pages sitemap).

### ADR-012: Reuse Existing Infrastructure

**Architecture**: Reuse StorageService, FeatureFlagService, NewsletterService, auth, i18n, middleware.  
**Code reality**: All exist and are functional.  
**Verdict**: ⚠️ **PARTIALLY ALIGNED** — See discrepancy 4.2 (StorageService requires businessId). Otherwise aligned.

## 3. Content Boundary Confirmation

### Business Content (ContentPost)

```
ContentPost
├── businessId: String (REQUIRED)
├── type: MICROBLOG | PHOTO | SHORT_VIDEO | PROMO | COMBO
├── status: DRAFT | PENDING_REVIEW | APPROVED | SCHEDULED | PUBLISHED | EXPIRED | REJECTED
├── Feature-flagged: CMS_V1 per business
├── Plan-limited: cmsPostsLimit, cmsPostsThisMonth
└── Used for: Discovery Feed (business marketing content)
```

### Platform Editorial Content (EditorialArticle)

```
EditorialArticle
├── businessId: (NONE — platform-level)
├── type: Article | FounderStory | IndustryInsight | ProductStory | CaseStudy | Guide | Report | Newsletter | Announcement | Resource
├── status: IDEA | DRAFT | REVIEW | APPROVED | SCHEDULED | PUBLISHED | UPDATED | ARCHIVED | REJECTED
├── NOT feature-flagged (platform-level, always available to editorial users)
├── NOT plan-limited
└── Used for: Editorial content (blog, stories, insights, guides)
```

### Boundary Invariants

1. **EditorialArticle must NOT have a businessId field** — platform content is not scoped to any business
2. **ContentPost must NOT be used for editorial content** — different types, different lifecycle, different governance
3. **PlatformMediaAsset must NOT have a businessId field** — platform media is not scoped to any business
4. **Editorial content APIs must NOT check businessId** — platform-level access control via editorialRoles
5. **Business CMS APIs must NOT change** — existing CmsService, routes, and UI remain untouched
6. **No data migration from ContentPost to EditorialArticle** — they are separate systems

## 4. Proposed Deviations from CONTENT-001

### Deviation 1: PLATFORM_ADMIN Role

**CONTENT-001 says**: References `PLATFORM_ADMIN` in role definitions.  
**Reality**: `PLATFORM_ADMIN` does not exist in `UserRole` enum. CmsService checks for it but it can never be true.  
**Proposed change**: Do NOT add `PLATFORM_ADMIN` to UserRole enum. Use `ADMIN` role for full editorial access. Use `editorialRoles` field (String[]) for granular editorial permissions.  
**Justification**: Adding a new UserRole enum value requires a migration and affects all role-checking code. `editorialRoles` is additive (String array with default empty) and doesn't touch the existing role system.

### Deviation 2: StorageService Platform Upload

**CONTENT-001 says**: "Reuse existing StorageService" for platform media.  
**Reality**: All StorageService methods require `businessId` parameter.  
**Proposed change**: Add `uploadPlatformImage` and `uploadPlatformVideo` methods to StorageService (or create `PlatformStorageService` wrapper). These methods use `platform/` as path prefix instead of businessId.  
**Justification**: Minimal change to existing service. New methods don't affect existing business-scoped uploads. Alternative (separate service) adds unnecessary indirection.

### Deviation 3: Signal Auto-Capture Deferred to Phase B

**CONTENT-001 says**: Signal capture includes "auto-capture from DemoRequest".  
**Proposed change**: Defer DemoRequest auto-capture to Phase B. Phase A creates Signal model with manual entry only.  
**Justification**: Auto-capture requires modifying DemoRequestService and API to create Signal records. This is an extension, not a foundation. Manual signal entry is sufficient for Phase A.

### Deviation 4: NewsletterIssue Deferred to Phase B

**CONTENT-001 says**: NewsletterIssue model is in NOW scope.  
**Proposed change**: Defer NewsletterIssue, NewsletterCampaign, NewsletterSegment, NewsletterSubscriberSegment to Phase B. Phase A only extends NewsletterSubscriber with additive fields.  
**Justification**: Phase A goal is "genuinely usable editorial operation." Newsletter campaign sending requires an email provider, which is Phase B. Subscriber model extension is sufficient for Phase A (capture richer subscriber data now, send campaigns later).

### Deviation 5: KnowledgeEntity and Signal Deferred to Phase B

**CONTENT-001 says**: KnowledgeEntity and Signal models are in NOW scope.  
**Proposed change**: Defer KnowledgeEntity, Signal, EditorialIdea, ArticleKnowledgeLink to Phase B. Phase A focuses on editorial content, taxonomy, SEO, and public pages.  
**Justification**: Phase A goal is a usable editorial operation. Knowledge/signal/idea models are foundation-only with no immediate user-facing value. They add schema complexity without enabling editorial workflow. Phase B can add them when the editorial operation is running.

## 5. Reconciliation Summary

| ADR | Aligned? | Action |
|-----|----------|--------|
| ADR-001 (Separate editorial from CMS) | ✅ | No changes needed |
| ADR-002 (String type, not enum) | ✅ | No changes needed |
| ADR-003 (Product string keys) | ✅ | No changes needed |
| ADR-004 (Newsletter as EditorialArticle) | ✅ | Phase B |
| ADR-005 (Email provider abstraction) | ✅ | Phase A: interface only |
| ADR-006 (SEO as Json) | ✅ | No changes needed |
| ADR-007 (Content truth as Json) | ✅ | Phase B |
| ADR-008 (Knowledge flat model) | ✅ | Phase B |
| ADR-009 (Signal manual + auto) | ⚠️ | Phase A: manual only; Phase B: auto-capture |
| ADR-010 (Privacy-first analytics) | ✅ | Phase A: provider-agnostic |
| ADR-011 (Dynamic sitemap) | ✅ | Refactor existing |
| ADR-012 (Reuse infrastructure) | ⚠️ | StorageService needs platform methods |

**No architectural decisions are overturned.** Five proposed deviations adjust Phase A scope without changing the architecture itself.

---

*End of Architecture Reconciliation*
