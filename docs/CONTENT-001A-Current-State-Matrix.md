# CONTENT-001A — Current State Matrix

> **Mission**: ImboniServe Knowledge & Growth Platform — Implementation Readiness  
> **Document Type**: Architecture Reconciliation Matrix  
> **Date**: 2025-08-15  
> **Status**: COMPLETE

---

## 1. Purpose

Map every CONTENT-001 architecture requirement against the actual repository code to determine: EXISTS–REUSE, EXISTS–EXTEND, EXISTS–REFACTOR, NEW, NOT REQUIRED NOW, or FUTURE.

## 2. Repository State at Audit Time

- **Branch**: `main`
- **HEAD**: `081149d` (docs(content): define knowledge and growth architecture)
- **Working tree**: Clean (only untracked PAY-003 docs unrelated to this mission)
- **Last content commit**: CONTENT-001 (19 files, 5,282 lines)
- **No code changes since CONTENT-001**

## 3. Reconciliation Matrix

### 3.1 Data Layer

| # | Architecture Requirement | Current Code | Status | Action |
|---|--------------------------|-------------|--------|--------|
| 1 | EditorialArticle model | Does not exist | NEW | Create Prisma model |
| 2 | Topic model | Does not exist | NEW | Create Prisma model |
| 3 | Tag model | Does not exist | NEW | Create Prisma model |
| 4 | ArticleTag join | Does not exist | NEW | Create Prisma model |
| 5 | ContentTransition (audit trail) | Does not exist | NEW | Create Prisma model |
| 6 | PlatformMediaAsset | Does not exist (MediaAsset is business-scoped) | NEW | Create separate Prisma model |
| 7 | ArticleProductLink | Does not exist | NEW | Create Prisma model |
| 8 | ArticleKnowledgeLink | Does not exist | NEW | Create Prisma model |
| 9 | KnowledgeEntity | Does not exist | NEW | Create Prisma model |
| 10 | Signal | Does not exist | NEW | Create Prisma model |
| 11 | EditorialIdea | Does not exist | NEW | Create Prisma model |
| 12 | NewsletterIssue | Does not exist | NEW | Create Prisma model |
| 13 | NewsletterCampaign | Does not exist | NEW | Create Prisma model |
| 14 | NewsletterSegment | Does not exist | NEW | Create Prisma model |
| 15 | NewsletterSubscriberSegment | Does not exist | NEW | Create Prisma model |
| 16 | ContentEvent | Does not exist | NEW | Create Prisma model |
| 17 | ContentRevision | Does not exist | NOT REQUIRED NOW | Phase B |
| 18 | RelatedArticle | Does not exist | NOT REQUIRED NOW | Phase B |
| 19 | Narrative | Does not exist | NOT REQUIRED NOW | Phase B |
| 20 | ArticleNarrativeLink | Does not exist | NOT REQUIRED NOW | Phase B |
| 21 | ArticleLocale | Does not exist | FUTURE | Phase C+ |
| 22 | Extend NewsletterSubscriber | Exists: emailOrPhone, sourcePage, isActive, unsubscribedAt | EXISTS–EXTEND | Add nullable fields: name, email, phone, consentAt, consentSource, preferences, lastEngagedAt, bounceCount, suppressedAt |
| 23 | Extend User with editorialRoles | Exists: roles (UserRole[]), no editorialRoles | EXISTS–EXTEND | Add `editorialRoles String[] @default([])` |
| 24 | Extend DemoRequest with UTM | Exists: name, businessName, contact, message, status (enum) | EXISTS–EXTEND | Add nullable fields: utmSource, utmMedium, utmCampaign, utmContent, refCode |
| 25 | ContentPost (business CMS) | Exists: business-scoped, types MICROBLOG/PHOTO/SHORT_VIDEO/PROMO/COMBO | EXISTS–REUSE | No changes — remains independent |
| 26 | MediaAsset (business media) | Exists: business-scoped | EXISTS–REUSE | No changes — remains independent |
| 27 | PostEngagement | Exists: business-scoped | EXISTS–REUSE | No changes |
| 28 | PostAttribution | Exists: business-scoped | EXISTS–REUSE | No changes |

### 3.2 Services

| # | Architecture Requirement | Current Code | Status | Action |
|---|--------------------------|-------------|--------|--------|
| 29 | EditorialService | Does not exist | NEW | Create service for article CRUD, transitions |
| 30 | TopicService | Does not exist | NEW | Create service for topic CRUD |
| 31 | TagService | Does not exist | NEW | Create service for tag CRUD |
| 32 | PlatformMediaService | Does not exist | NEW | Create service for platform media (reuse StorageService upload logic) |
| 33 | IdeaService | Does not exist | NEW | Create service for idea pipeline |
| 34 | SignalService | Does not exist | NEW | Create service for signal capture/triage |
| 35 | KnowledgeService | Does not exist | NEW | Create service for knowledge entities |
| 36 | NewsletterIssueService | Does not exist | NEW | Create service for newsletter issues |
| 37 | EmailProviderService | Does not exist | NEW | Create interface + logging provider (Phase B for real provider) |
| 38 | ContentAnalyticsService | Does not exist | NEW | Create service for content events |
| 39 | CmsService (business CMS) | Exists: createPost, updatePost, submitForReview, approvePost, listPosts | EXISTS–REUSE | No changes — separate from editorial |
| 40 | NewsletterService | Exists: subscribe, unsubscribe, getAllSubscribers, getStats, exportToCSV | EXISTS–EXTEND | Extend with consent tracking, segmentation support |
| 41 | StorageService | Exists: uploadVideo, uploadImage, uploadFileGeneric, uploadPrivateDocument, getPublicUrl, deleteFile, probeVideo, generateThumbnailBuffer | EXISTS–EXTEND | Add platform-level upload method (no businessId) or create PlatformStorageService |
| 42 | DemoRequestService | Exists: createRequest, getAllRequests, updateStatus, getStats | EXISTS–EXTEND | Extend to capture UTM cookies at creation time |
| 43 | FeatureFlagService | Exists: isEnabled, INITIAL_FLAGS | EXISTS–REUSE | No changes needed for editorial (editorial is platform-level, not feature-flagged per business) |

### 3.4 API Routes

| # | Architecture Requirement | Current Code | Status | Action |
|---|--------------------------|-------------|--------|--------|
| 44 | /api/admin/content/articles (CRUD) | Does not exist | NEW | Create API routes |
| 45 | /api/admin/content/articles/[id]/transition | Does not exist | NEW | Create transition endpoint |
| 46 | /api/admin/content/topics (CRUD) | Does not exist | NEW | Create API routes |
| 47 | /api/admin/content/tags (CRUD) | Does not exist | NEW | Create API routes |
| 48 | /api/admin/content/media (list, upload) | Does not exist | NEW | Create API routes |
| 49 | /api/admin/content/ideas (CRUD) | Does not exist | NEW | Create API routes |
| 50 | /api/admin/content/signals (CRUD) | Does not exist | NEW | Create API routes |
| 51 | /api/admin/content/knowledge (CRUD) | Does not exist | NEW | Create API routes |
| 52 | /api/public/content/articles | Does not exist | NEW | Create public read-only API |
| 53 | /api/public/content/articles/[slug] | Does not exist | NEW | Create public read-only API |
| 54 | /api/cms/posts (business CMS) | Exists: GET, POST | EXISTS–REUSE | No changes |
| 55 | /api/cms/posts/[id] | Exists: GET, PATCH, DELETE | EXISTS–REUSE | No changes |
| 56 | /api/cms/posts/[id]/submit | Exists: POST | EXISTS–REUSE | No changes |
| 57 | /api/cms/posts/[id]/approve | Exists: POST | EXISTS–REUSE | No changes |
| 58 | /api/cms/media/upload | Exists: POST | EXISTS–REUSE | No changes |
| 59 | /api/cms/analytics | Exists: GET, POST | EXISTS–REUSE | No changes |
| 60 | /api/growth/newsletter-subscribe | Exists: POST | EXISTS–EXTEND | Extend input to accept name, email, phone separately |
| 61 | /api/growth/newsletter-unsubscribe | Exists: POST | EXISTS–REUSE | No changes |
| 62 | /api/growth/demo-request | Exists: POST | EXISTS–EXTEND | Extend to read UTM cookies from request |
| 63 | /api/admin/growth/newsletter | Exists: GET | EXISTS–EXTEND | Extend with new fields in response |
| 64 | /api/admin/growth/stats | Exists: GET | EXISTS–REUSE | No changes |
| 65 | /api/admin/content/analytics | Does not exist | NOT REQUIRED NOW | Phase B |
| 66 | /api/admin/content/newsletter/issues | Does not exist | NOT REQUIRED NOW | Phase B |

### 3.5 UI Pages

| # | Architecture Requirement | Current Code | Status | Action |
|---|--------------------------|-------------|--------|--------|
| 67 | /admin/content (dashboard) | Does not exist | NEW | Create admin page |
| 68 | /admin/content/articles (list) | Does not exist | NEW | Create admin page |
| 69 | /admin/content/articles/new | Does not exist | NEW | Create admin page |
| 70 | /admin/content/articles/[id] | Does not exist | NEW | Create admin page |
| 71 | /admin/content/topics | Does not exist | NEW | Create admin page |
| 72 | /admin/content/tags | Does not exist | NEW | Create admin page |
| 73 | /admin/content/media | Does not exist | NEW | Create admin page |
| 74 | /admin/content/media/upload | Does not exist | NEW | Create admin page |
| 75 | /admin/content/ideas | Does not exist | NEW | Create admin page |
| 76 | /admin/content/signals | Does not exist | NEW | Create admin page |
| 77 | /admin/content/knowledge | Does not exist | NEW | Create admin page |
| 78 | /admin/content/settings | Does not exist | NEW | Create admin page |
| 79 | /blog (listing) | Does not exist | NEW | Create public page |
| 80 | /blog/[slug] (detail) | Does not exist | NEW | Create public page |
| 81 | /stories (listing) | Does not exist | NEW | Create public page |
| 82 | /stories/[slug] (detail) | Does not exist | NEW | Create public page |
| 83 | /insights (listing) | Does not exist | NEW | Create public page |
| 84 | /insights/[slug] (detail) | Does not exist | NEW | Create public page |
| 85 | /guides (listing) | Does not exist | NEW | Create public page |
| 86 | /guides/[slug] (detail) | Does not exist | NEW | Create public page |
| 87 | /admin/content/newsletter/* | Does not exist | NOT REQUIRED NOW | Phase B |
| 88 | /admin/content/narratives/* | Does not exist | NOT REQUIRED NOW | Phase B |
| 89 | /newsletter (archive) | Does not exist | NOT REQUIRED NOW | Phase B |
| 90 | /topic/[slug] | Does not exist | NOT REQUIRED NOW | Phase B |
| 91 | /tag/[slug] | Does not exist | NOT REQUIRED NOW | Phase B |
| 92 | /author/[slug] | Does not exist | NOT REQUIRED NOW | Phase B |
| 93 | /reports/* | Does not exist | NOT REQUIRED NOW | Phase B |
| 94 | /resources/* | Does not exist | NOT REQUIRED NOW | Phase B |
| 95 | /dashboard/cms/* (business CMS) | Exists: index, new, [id], settings | EXISTS–REUSE | No changes |
| 96 | /admin/newsletter (subscriber mgmt) | Exists | EXISTS–EXTEND | Extend with new subscriber fields |
| 97 | /admin/leads (demo requests) | Exists | EXISTS–EXTEND | Extend with UTM display |

### 3.6 Infrastructure

| # | Architecture Requirement | Current Code | Status | Action |
|---|--------------------------|-------------|--------|--------|
| 98 | Dynamic sitemap | Static: 10 hardcoded URLs in sitemap.xml.ts | EXISTS–REFACTOR | Replace with dynamic sitemap index + content sitemap |
| 99 | robots.txt | Exists: Allow all + sitemap reference | EXISTS–REUSE | No changes |
| 100 | UTM cookie capture in middleware | Does not exist (only referral cookies) | EXISTS–EXTEND | Add UTM parameter capture to existing middleware |
| 101 | SEO metadata (per-article) | PublicLayout provides title, description, canonical, OG, Twitter, JSON-LD (Organization + WebSite) | EXISTS–EXTEND | Extend PublicLayout or create ArticleLayout with Article JSON-LD |
| 102 | Markdown rendering | Does not exist | NEW | Add remark/rehype pipeline with sanitization |
| 103 | Analytics integration | Does not exist (only video view tracking via PostEngagement) | NEW | Add analytics provider script (Phase A: provider-agnostic snippet) |
| 104 | Email provider | Does not exist | NOT REQUIRED NOW | Phase B — define interface only in Phase A |
| 105 | Product key registry | Does not exist | NEW | Create src/config/product-keys.ts |
| 106 | i18n (editorial strings) | Exists: en, fr, rw translations | EXISTS–EXTEND | Add editorial translation keys to locale files |
| 107 | Auth (editorial roles) | Exists: NextAuth JWT with roles, businessId | EXISTS–EXTEND | Add editorialRoles to JWT/session callbacks |
| 108 | Cookie consent | Exists: CookieConsentBanner component | EXISTS–REUSE | No changes |
| 109 | PWA/service worker | Exists | EXISTS–REUSE | No changes |

### 3.7 Security

| # | Architecture Requirement | Current Code | Status | Action |
|---|--------------------------|-------------|--------|--------|
| 110 | Editorial role-based access | Exists: UserRole enum (OWNER, CASHIER, KITCHEN_MANAGER, ADMIN, SUPPLIER, SUPERVISOR, MANAGER, FRONT_DESK, WAITER) — no editorial roles | EXISTS–EXTEND | Add editorialRoles field to User; check in API routes and admin pages |
| 111 | PLATFORM_ADMIN role | Referenced in CmsService code (`roles.includes('PLATFORM_ADMIN')`) but NOT in UserRole enum | EXISTS–REFACTOR | Discrepancy: code checks for non-existent role. For editorial, use ADMIN only. Document this. |
| 112 | XSS prevention (Markdown) | Does not exist | NEW | Add rehype-sanitize to Markdown rendering pipeline |
| 113 | CSRF protection | Exists: NextAuth SameSite cookies | EXISTS–REUSE | No changes |
| 114 | Public/private separation | Exists for business CMS (auth-gated) | NEW | Implement for editorial (only PUBLISHED articles public) |
| 115 | Audit trail | Does not exist for editorial | NEW | ContentTransition model |
| 116 | Media authorization | Exists for business CMS (businessId check) | NEW | Implement for platform media (editorial role check) |

## 4. Key Discrepancies Found

### 4.1 PLATFORM_ADMIN Role

**Architecture (CONTENT-001)**: References `PLATFORM_ADMIN` in editorial role definitions and CmsService code.  
**Actual code**: `UserRole` enum does NOT include `PLATFORM_ADMIN`. CmsService line 88 checks `roles.includes('PLATFORM_ADMIN')` but this value can never be true.  
**Resolution**: For editorial system, use `ADMIN` role only for full editorial access. Do not add `PLATFORM_ADMIN` to UserRole enum — use `editorialRoles` field instead. Document this as a proposed deviation from CONTENT-001.

### 4.2 StorageService businessId Parameter

**Architecture (CONTENT-001)**: Says "reuse existing StorageService" for platform media.  
**Actual code**: All StorageService upload methods require `businessId` parameter (used in storage key path).  
**Resolution**: Add a `uploadPlatformImage` and `uploadPlatformVideo` method to StorageService, or create a thin `PlatformStorageService` wrapper. Platform media uses a dedicated bucket or `platform/` path prefix instead of businessId.

### 4.3 Auth Redirect

**Architecture (CONTENT-001)**: States "redirect admins to /admin".  
**Actual code**: Redirect callback sends all users to `/dashboard` (unless explicit callback URL provided).  
**Resolution**: This is existing behavior, not a CONTENT-001A concern. Editorial admin pages will be under `/admin/content/*` and require explicit navigation. No change needed.

### 4.4 Feature Flag Gating

**Architecture (CONTENT-001)**: Editorial content is platform-level, not feature-flagged per business.  
**Actual code**: CmsService uses `FeatureFlagService.isEnabled(FEATURE_FLAGS.CMS_V1, businessId)` for business CMS.  
**Resolution**: Editorial system does NOT use feature flags — it's platform-level, always available to editorial-role users. This is correct per architecture. No conflict.

## 5. Summary Counts

| Status | Count |
|--------|-------|
| EXISTS–REUSE | 18 |
| EXISTS–EXTEND | 14 |
| EXISTS–REFACTOR | 2 |
| NEW | 42 |
| NOT REQUIRED NOW | 14 |
| FUTURE | 1 |
| **Total** | **91** |

---

*End of Current State Matrix*
