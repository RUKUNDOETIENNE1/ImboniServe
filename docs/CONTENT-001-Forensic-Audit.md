# CONTENT-001 — Forensic Audit Report

> **Mission**: ImboniServe Knowledge & Growth Platform — Content Intelligence, Editorial & Marketing Architecture  
> **Phase**: FORENSIC DISCOVERY & CURRENT-STATE AUDIT  
> **Date**: 2025-01-20  
> **Status**: COMPLETE

---

## 1. Executive Summary

This document records the findings of a forensic audit of the ImboniServe repository (`c:\Dev\ImboniResto`) to understand the current state of public website, content, CMS, newsletter, marketing, SEO, and lead-capture infrastructure. The audit examined Prisma schema models, API routes, UI pages, service layers, middleware, and component architecture.

**Key Finding**: The repository contains a **business-scoped micro-content CMS** (ContentPost/MediaAsset) designed for discovery-feed posts (MICROBLOG, PHOTO, SHORT_VIDEO, PROMO, COMBO) and a **lightweight growth layer** (newsletter subscribers, demo requests). There is **no editorial content system** (articles, guides, insights, stories), **no SEO content infrastructure**, **no email campaign delivery**, **no analytics tracking**, and **no knowledge/signal/evidence models**. The existing CMS is business-scoped and feature-flagged, not platform-level editorial content.

---

## 2. Repository Structure Overview

### 2.1 Framework & Stack
- **Framework**: Next.js (Pages Router) with TypeScript
- **ORM**: Prisma
- **Auth**: NextAuth (JWT strategy, 8-hour sessions, MFA/OTP support)
- **Storage**: Supabase Storage (via `StorageService`)
- **Media Processing**: ffmpeg/ffprobe (video duration validation, thumbnail generation)
- **i18n**: Custom translation system (en, fr, rw) with JSON locale files
- **PWA**: Service worker, manifest, install prompts

### 2.2 Page Structure (`src/pages/`)
| Path | Purpose |
|------|---------|
| `/` | Homepage (1283 lines, marketing + features + pricing) |
| `/pricing` | Pricing page |
| `/faq` | FAQ page |
| `/features/*` | 7 feature sub-pages (ai, analytics, finance, growth, infrastructure, operations, index) |
| `/discover/*` | Public business discovery (index, feed, map, [slug]) |
| `/explore-businesses` | Business explorer redirect |
| `/login`, `/signup`, `/welcome` | Auth flow |
| `/forgot-password`, `/reset-password` | Password recovery |
| `/terms`, `/privacy`, `/cookies`, `/service-terms` | Legal pages |
| `/unsubscribe` | Newsletter unsubscribe |
| `/dashboard/*` | Business dashboard (91 items including `/dashboard/cms/*`) |
| `/admin/*` | Platform admin (41 items including `/admin/newsletter`, `/admin/leads`) |
| `/api/*` | API routes (~500 items) |
| `/sitemap.xml` | Static sitemap |
| `/robots.txt` | Static robots |

### 2.3 Key Directories
- `src/lib/services/` — Service layer (CmsService, NewsletterService, DemoRequestService, StorageService, etc.)
- `src/lib/` — Shared utilities, i18n, middleware, analytics, monitoring
- `src/components/` — React components (PublicLayout, NewsletterSignup, SocialShare, etc.)
- `src/locales/` — Translation files (en.json, fr.json, rw.json)
- `prisma/` — schema.prisma (main), schema_additions.prisma (procurement)
- `docs/` — Extensive documentation library (300+ files)

---

## 3. Existing Content & CMS Infrastructure

### 3.1 Prisma Models

#### ContentPost (`prisma/schema.prisma:817-839`)
```
model ContentPost {
  id           String            @id @default(cuid())
  businessId   String
  type         String            // MICROBLOG | PHOTO | SHORT_VIDEO | PROMO | COMBO
  title        String?
  body         String?
  mediaIds     String[]
  comboItems   Json?
  promoMeta    Json?
  status       String            @default("DRAFT")
  publishAt    DateTime?
  expireAt     DateTime?
  targeting    Json?
  createdBy    String?
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt
  business     Business          @relation(...)
  attributions PostAttribution[]
  engagements  PostEngagement[]
}
```

**Observations**:
- Business-scoped (`businessId` required) — not platform-level editorial content
- `type` is a free-form string (not enum) — types hardcoded in CmsService
- No slug, no SEO metadata, no author relation, no categories/tags
- No content versioning or revision history
- `mediaIds` is a String array (not FK relation) — loose coupling to MediaAsset
- `targeting` Json field exists but no evidence of active use

#### MediaAsset (`prisma/schema.prisma:841-856`)
```
model MediaAsset {
  id           String   @id @default(cuid())
  businessId   String
  type         String   // IMAGE | VIDEO
  storageKey   String
  width        Int?
  height       Int?
  durationSec  Int?
  thumbnailKey String?
  sizeBytes    Int
  mimeType     String
  createdAt    DateTime @default(now())
  business     Business @relation(...)
}
```

**Observations**:
- Business-scoped — no shared/platform media library
- No alt text, caption, attribution, or metadata fields
- No usage tracking (which posts use which assets)
- Storage quota tracked on Business (`storageUsedBytes`) and Plan (`storageGBLimit`)

#### PostEngagement (`prisma/schema.prisma:858-869`)
```
model PostEngagement {
  id        String      @id @default(cuid())
  postId    String
  userId    String?
  type      String      // VIEW, LIKE, SHARE, etc.
  metadata  Json?
  createdAt DateTime    @default(now())
  post      ContentPost @relation(...)
}
```

**Observations**: Generic engagement tracking. Analytics API (`/api/cms/analytics`) only tracks VIEW events for SHORT_VIDEO posts. No aggregate engagement dashboard.

#### PostAttribution (`prisma/schema.prisma:871-883`)
```
model PostAttribution {
  id           String      @id @default(cuid())
  postId       String
  businessId   String
  orderId      String
  channel      String
  attributedAt DateTime    @default(now())
  business     Business    @relation(...)
  order        Sale        @relation(...)
  post         ContentPost @relation(...)
}
```

**Observations**: Links content posts to sales orders — basic content-to-revenue attribution. Limited to `Sale` model (in-house orders), not marketplace or subscription conversions.

### 3.2 CMS Service Layer

**CmsService** (`src/lib/services/cms.service.ts`):
- `createPost(businessId, userId, input)` — creates DRAFT post
- `updatePost(businessId, postId, input)` — updates post fields
- `submitForReview(businessId, postId)` — DRAFT → PENDING_REVIEW
- `approvePost(actor, targetBusinessId, postId)` — PENDING_REVIEW → APPROVED (admin or self-approve via feature flag)
- `listPosts(businessId, opts)` — paginated list with status/search filter
- Feature-flagged: `CMS_V1` must be enabled for business
- Plan-limited: `cmsPostsLimit` / `cmsPostsThisMonth` on Business/Plan

**Content Types** (hardcoded in `CmsService` and UI):
- `MICROBLOG` — text post
- `PHOTO` — image post
- `SHORT_VIDEO` — video post (max 30 seconds, ffprobe-validated)
- `PROMO` — promotional content with `promoMeta`
- `COMBO` — combined content with `comboItems`

**Content Lifecycle**: DRAFT → PENDING_REVIEW → APPROVED → SCHEDULED → PUBLISHED → EXPIRED / REJECTED

### 3.3 CMS UI

| Route | File | Purpose |
|-------|------|---------|
| `/dashboard/cms/` | `index.tsx` | Post list with status filter, search, delete |
| `/dashboard/cms/new` | `new.tsx` | Create post: type selection, title, body, media upload, scheduling |
| `/dashboard/cms/[id]` | `[id].tsx` | Edit post: update fields, submit for review |
| `/dashboard/cms/settings` | `settings.tsx` | CMS notification toggle (`cmsNotifyTrending`) |

### 3.4 CMS API Routes

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/cms/posts` | GET, POST | List/create posts (business-scoped, MANAGER+ required) |
| `/api/cms/posts/[id]` | GET, PATCH, DELETE | Get/update/delete post |
| `/api/cms/media/upload` | POST | Multipart upload (50MB max, ffprobe validation) |
| `/api/cms/media/[id]` | DELETE | Delete media asset |
| `/api/cms/analytics` | GET, POST | Video view analytics + tracking |
| `/api/cms/notifications/settings` | GET, PATCH | Trending notification toggle |

### 3.5 Discovery Feed (Public Content Surface)

- `/discover/feed` — public feed of published ContentPosts
- `/discover/` — discovery directory of businesses
- `/discover/[slug]` — individual business profile
- `/discover/map` — map view of businesses
- Feature-flagged: `FEED_V1`, `FEED_ENGAGEMENT_V1`, `FEED_RECOMMENDATIONS_V1` (all disabled by default)

### 3.6 Storage Infrastructure

**StorageService** (`src/lib/services/storage.service.ts`):
- Backend: Supabase Storage (`SUPABASE_STORAGE_URL`, `SUPABASE_STORAGE_KEY`)
- Video: mp4, quicktime, webm (max 50MB, max 30s duration)
- Image: jpeg, png, webp, gif (max 10MB)
- Auto-thumbnail generation for videos via ffmpeg
- Storage quota enforcement (plan-based `storageGBLimit`)
- Private bucket support (`documents-priv`)

---

## 4. Newsletter Infrastructure

### 4.1 Prisma Model

```
model NewsletterSubscriber {
  id            String   @id @default(cuid())
  createdAt     DateTime @default(now())
  emailOrPhone  String   @unique
  sourcePage    String?
  isActive      Boolean  @default(true)
  unsubscribedAt DateTime?
}
```

**Observations**:
- Single field `emailOrPhone` — no separate email/phone, no name, no preferences
- No consent tracking (GDPR/consent timestamp)
- No segmentation or tagging
- No campaign tracking or delivery records
- No suppression list (only isActive boolean)
- No double opt-in

### 4.2 NewsletterService (`src/lib/services/newsletter.service.ts`)
- `subscribe({ emailOrPhone, sourcePage })` — create or reactivate
- `unsubscribe(emailOrPhone)` — set isActive=false, unsubscribedAt
- `getAllSubscribers({ isActive, limit, offset })` — admin list
- `getStats()` — total, active, unsubscribed, bySource
- `exportToCSV(isActive?)` — CSV export
- Explicitly annotated: "GROWTH LAYER - Audience building only. NO integration with revenue/wallet/payout systems"

### 4.3 Newsletter API & UI

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/growth/newsletter-subscribe` | POST | Public subscribe |
| `/api/growth/newsletter-unsubscribe` | POST | Public unsubscribe |
| `/api/admin/growth/newsletter` | GET | Admin list + CSV export |
| `/api/admin/growth/stats` | GET | Combined demo + newsletter stats |

**Admin UI**: `/admin/newsletter` — subscriber table, stats cards (total/active/unsubscribed), by-source breakdown, CSV export, status filter

**Public Component**: `NewsletterSignup` (`src/components/NewsletterSignup.tsx`) — footer and inline variants, i18n-aware, sourcePage tracking

**Unsubscribe Page**: `/unsubscribe.tsx` — standalone unsubscribe form

### 4.4 What Does NOT Exist
- No email delivery provider integration (no SendGrid, Mailchimp, SES, etc.)
- No campaign creation/sending
- No email templates
- No subscriber preferences or segmentation
- No double opt-in
- No consent records
- No bounce/complaint tracking
- No A/B testing

---

## 5. Lead Capture / Demo Request Infrastructure

### 5.1 Prisma Model

```
model DemoRequest {
  id            String   @id @default(cuid())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  name          String
  businessName  String
  contact       String   // Phone or email
  message       String?
  status        DemoRequestStatus @default(PENDING)
  contactedAt   DateTime?
  contactedBy   String?
  completedAt   DateTime?
  notes         String?
}

enum DemoRequestStatus {
  PENDING
  CONTACTED
  COMPLETED
  CANCELLED
}
```

### 5.2 Service & API
- **DemoRequestService** (`src/lib/services/demo-request.service.ts`): createRequest, getAllRequests, updateStatus, getStats
- **Public API**: `/api/growth/demo-request` (POST) — validates name, businessName, contact, message
- **Admin API**: `/api/admin/growth/demo-requests` (GET)
- **Admin UI**: `/admin/leads` — request list, stats, status filter, status updates

---

## 6. SEO Infrastructure

### 6.1 What Exists

**PublicLayout** (`src/components/PublicLayout.tsx:42-91`):
- Per-page `<title>` and `<meta name="description">`
- Canonical URL via `NEXT_PUBLIC_SITE_URL`
- Open Graph: og:type, og:title, og:description, og:url, og:image (static logo)
- Twitter Card: summary_large_image, twitter:title, twitter:description, twitter:image
- JSON-LD: Organization schema, WebSite schema with SearchAction

**_app.tsx**: Global `<meta name="description">` fallback

**_document.tsx**: PWA meta tags, favicon, manifest, preconnect hints (Cloudinary, Google Storage, YouTube, Pusher)

**Sitemap** (`src/pages/sitemap.xml.ts`):
- Static, 10 hardcoded URLs: `/`, `/pricing`, `/discover`, `/store`, `/faq`, `/terms`, `/privacy`, `/cookies`, `/login`, `/signup`, `/unsubscribe`
- No dynamic content URLs
- No lastmod dates
- No priority differentiation beyond homepage (1.0) vs others (0.6)

**Robots** (`src/pages/robots.txt.ts`): Allow all, sitemap reference

### 6.2 What Does NOT Exist
- No per-content SEO metadata (slug, meta title, meta description, canonical per article)
- No structured data for articles (Article, BlogPosting schema)
- No dynamic sitemap generation from content
- No OG image per page/content
- No breadcrumb structured data
- No hreflang tags for i18n
- No SEO scoring or analysis
- No robots meta per page

---

## 7. Analytics & Tracking

### 7.1 What Exists
- **PostEngagement**: VIEW events tracked for SHORT_VIDEO posts via `/api/cms/analytics` (POST track)
- **CMS Analytics**: Total views, unique posts, avg watch time, top videos, views by day
- **PWA Telemetry**: `src/lib/analytics/pwa-telemetry` imported in `_app.tsx`
- **Sentry**: Client-side error monitoring (`src/lib/monitoring/sentry.client`)

### 7.2 What Does NOT Exist
- No Google Analytics, gtag, Plausible, Fathom, or any web analytics
- No conversion tracking
- No UTM parameter capture (middleware captures referral codes, not UTM)
- No funnel analysis
- No page view tracking
- No event tracking beyond video views
- No attribution from content to signup/subscription

---

## 8. Marketing & Growth Infrastructure

### 8.1 What Exists
- **Referral/Affiliate System**: Middleware captures `ref`, `aff`, `partner`, `m`, `invite`, `inv` URL params → 30-day `im_ref` cookie. Admin pages for affiliates and founder partners.
- **Sales Pipeline**: `/admin/sales-pipeline` and `/admin/sales-pipeline/` admin pages
- **Growth Workspace**: `/admin/growth-workspace/[partnershipId]` — partnership-specific growth workspace
- **Demo Request Lead Capture**: As documented in section 5
- **Newsletter Subscriber Management**: As documented in section 4
- **Social Share Component**: `src/components/SocialShare.tsx` exists (imported in PublicLayout)

### 8.2 What Does NOT Exist
- No CRM (CRM_V1 feature flag exists but disabled)
- No email campaign delivery
- No social media scheduling/posting
- No landing page builder
- No A/B testing
- No marketing automation
- No conversion funnel tracking
- No customer journey mapping
- No content distribution to external channels

---

## 9. Authentication & Business Isolation

### 9.1 Auth System
- **NextAuth** with JWT strategy (`src/pages/api/auth/[...nextauth].ts`)
- Session includes: `id`, `roles[]`, `role`, `businessId`, `planCode`, `subscriptionStatus`, `trialEndDate`
- MFA via OTP (`AuthOTPService`) with confirm token flow
- 8-hour session max age, 1-hour token refresh
- Production requires `NEXTAUTH_SECRET` ≥ 32 characters

### 9.2 Role System
- Roles: `ADMIN`, `PLATFORM_ADMIN`, `MANAGER`, and operational roles (CASHIER, WAITER, etc.)
- CMS access: requires `ADMIN`, `PLATFORM_ADMIN`, or `MANAGER` role
- Admin panel access: requires `ADMIN` role
- Self-approve: `CMS_SELF_APPROVE_V1` feature flag + `MANAGER` role

### 9.3 Business Isolation
- ContentPost scoped by `businessId` — all queries filter by session user's `businessId`
- MediaAsset scoped by `businessId`
- PostAttribution links to both post and business
- CMS API enforces: `session.user.businessId` must match post's `businessId`
- Plan-based limits: `cmsPostsLimit`, `storageGBLimit` enforced at API layer

### 9.4 Feature Flag System
- `FeatureFlagService` with per-business overrides
- CMS-related flags: `CMS_V1`, `CMS_SELF_APPROVE_V1`, `FEED_V1`, `FEED_ENGAGEMENT_V1`, `FEED_RECOMMENDATIONS_V1`
- All CMS/feed flags disabled by default
- Flags have `minimumPlan` field for plan-gated features

---

## 10. Internationalization

### 10.1 What Exists
- Custom i18n system: `src/lib/i18n.ts` with `setLocale`, `loadTranslations`, `getTranslation`, `useTranslation` hook
- 3 locales: `en` (English), `fr` (French), `rw` (Kinyarwanda)
- Translation files: `src/locales/en.json` (116KB), `fr.json` (131KB), `rw.json` (127KB)
- `LanguageSwitcher` component in PublicLayout
- Next.js router locale integration
- `VERIFIED_KINYARWANDA_TERMBASE.json` — verified term base for Kinyarwanda

### 10.2 Observations
- i18n is UI-only — no content translation infrastructure
- No per-content locale variants
- No hreflang tags
- No locale-specific URLs (e.g., `/en/blog`, `/fr/blog`)
- No timezone-aware content scheduling

---

## 11. Reconciliation with Product Architecture

### 11.1 What Must Remain Independent
The existing **business-scoped CMS** (ContentPost, MediaAsset, PostEngagement, PostAttribution) serves the **Discovery Feed** — a customer-facing feed of business promotional content. This is a **product feature**, not editorial content. The Knowledge & Growth Platform's editorial content system must be **separate** from this:

| Dimension | Existing CMS (Product) | Knowledge Platform (Editorial) |
|-----------|----------------------|-------------------------------|
| Scope | Per-business | Platform-level |
| Content types | MICROBLOG, PHOTO, SHORT_VIDEO, PROMO, COMBO | Article, Guide, Insight, Story, Report, Newsletter |
| Author | Business user (manager/admin) | Platform editors |
| Audience | Discovery feed visitors | Public website visitors |
| Business isolation | Required (businessId) | Not required (platform content) |
| Storage | Per-business quota | Platform storage |
| Feature flags | CMS_V1, FEED_V1 | New flags needed |

### 11.2 What Can Be Reused
- **StorageService**: Supabase upload infrastructure (extend for platform media)
- **PublicLayout**: SEO meta tags, OG tags, JSON-LD (extend for content pages)
- **NewsletterService**: Subscriber management (extend with campaigns, preferences)
- **FeatureFlagService**: Feature gating infrastructure
- **Auth system**: Role-based access (extend with editorial roles)
- **i18n system**: Translation infrastructure (extend for content localization)
- **Middleware**: Referral/UTM capture (extend for content attribution)
- **AdminLayout**: Admin panel shell (extend for editorial admin)

### 11.3 What Must Be New
- Editorial content models (Article, Guide, Insight, etc.)
- Platform-level media library (not business-scoped)
- SEO metadata model (slug, meta title, meta description per content)
- Content categorization (topics, categories, tags)
- Content governance (authors, editors, reviewers, publishers)
- Content versioning/revisions
- Email campaign delivery integration
- Analytics/tracking integration
- Content ↔ product relationship model
- Knowledge model (problems, questions, concepts)
- Signal engine foundation
- Evidence/verification layer
- Idea pipeline
- Narrative engine foundation
- Content distribution channels
- Dynamic sitemap generation

---

## 12. Gap Analysis Summary

### 12.1 Critical Gaps (Block NOW Scope)
1. **No editorial content model** — ContentPost is micro-content, not articles
2. **No SEO metadata model** — no slugs, meta titles, descriptions per content
3. **No content categorization** — no topics, categories, tags
4. **No dynamic sitemap** — static, 10 hardcoded URLs
5. **No analytics tracking** — no web analytics, no conversion tracking
6. **No email delivery** — subscriber list only, no campaign sending

### 12.2 Important Gaps (Block NEXT Scope)
7. **No content governance** — no author/editor/reviewer roles
8. **No content versioning** — no revision history
9. **No content ↔ product relationships** — no linking articles to features
10. **No knowledge model** — no problems, questions, concepts
11. **No signal engine** — no capture of market signals
12. **No idea pipeline** — no editorial idea management

### 12.3 Future Gaps (LATER/LONG-TERM)
13. **No evidence/verification layer**
14. **No narrative engine**
15. **No content distribution to external channels**
16. **No content decay detection**
17. **No AI assistance for content**
18. **No hospitality knowledge graph**
19. **No benchmarking/market intelligence**
20. **No personalization**

---

## 13. Architecture Decisions Informed by Audit

| Decision | Rationale |
|----------|-----------|
| Create new editorial content models (not extend ContentPost) | ContentPost is business-scoped micro-content; editorial content is platform-level with different lifecycle, governance, and metadata |
| Reuse StorageService for platform media | Proven Supabase integration with video/image validation; extend with platform-level bucket |
| Reuse NewsletterService subscriber model | Solid foundation; extend with consent, preferences, campaigns |
| Reuse PublicLayout SEO meta | Good foundation; extend with per-content SEO |
| Reuse FeatureFlagService | Established pattern for gradual rollout |
| New dynamic sitemap generation | Current static sitemap cannot accommodate content URLs |
| New analytics integration | No existing web analytics to extend |
| New email delivery integration | No existing provider to extend |
| Keep Discovery Feed CMS separate | Product feature with different requirements; do not merge |

---

## 14. File Inventory (Content/Marketing Relevant)

### 14.1 Prisma Models
- `prisma/schema.prisma:817-839` — ContentPost
- `prisma/schema.prisma:841-856` — MediaAsset
- `prisma/schema.prisma:858-869` — PostEngagement
- `prisma/schema.prisma:871-883` — PostAttribution
- `prisma/schema.prisma:4067-4094` — DemoRequest + DemoRequestStatus enum
- `prisma/schema.prisma:4097-4111` — NewsletterSubscriber

### 14.2 Services
- `src/lib/services/cms.service.ts` — CmsService
- `src/lib/services/newsletter.service.ts` — NewsletterService
- `src/lib/services/demo-request.service.ts` — DemoRequestService
- `src/lib/services/storage.service.ts` — StorageService
- `src/lib/services/feature-flag.service.ts` — FeatureFlagService

### 14.3 UI Pages
- `src/pages/dashboard/cms/index.tsx` — CMS post list
- `src/pages/dashboard/cms/new.tsx` — Create post
- `src/pages/dashboard/cms/[id].tsx` — Edit post
- `src/pages/dashboard/cms/settings.tsx` — CMS settings
- `src/pages/admin/newsletter.tsx` — Newsletter admin
- `src/pages/admin/leads.tsx` — Demo request admin
- `src/pages/discover/feed.tsx` — Public discovery feed
- `src/pages/discover/index.tsx` — Discovery directory
- `src/pages/discover/[slug].tsx` — Business profile
- `src/pages/unsubscribe.tsx` — Newsletter unsubscribe
- `src/pages/sitemap.xml.ts` — Sitemap
- `src/pages/robots.txt.ts` — Robots

### 14.4 API Routes
- `src/pages/api/cms/posts/index.ts` — Posts CRUD
- `src/pages/api/cms/posts/[id].ts` — Post detail
- `src/pages/api/cms/media/upload.ts` — Media upload
- `src/pages/api/cms/media/[id].ts` — Media delete
- `src/pages/api/cms/analytics.ts` — CMS analytics
- `src/pages/api/cms/notifications/settings.ts` — Notification settings
- `src/pages/api/growth/newsletter-subscribe.ts` — Public subscribe
- `src/pages/api/growth/newsletter-unsubscribe.ts` — Public unsubscribe
- `src/pages/api/growth/demo-request.ts` — Public demo request
- `src/pages/api/admin/growth/newsletter.ts` — Admin newsletter
- `src/pages/api/admin/growth/demo-requests.ts` — Admin demo requests
- `src/pages/api/admin/growth/stats.ts` — Admin growth stats

### 14.5 Components
- `src/components/PublicLayout.tsx` — Public layout with SEO
- `src/components/NewsletterSignup.tsx` — Newsletter signup
- `src/components/SocialShare.tsx` — Social sharing
- `src/components/LanguageSwitcher.tsx` — Locale switcher

### 14.6 Infrastructure
- `src/middleware.ts` — Referral cookie capture
- `src/pages/_app.tsx` — Global meta, PWA, i18n
- `src/pages/_document.tsx` — PWA meta, preconnect
- `src/pages/api/auth/[...nextauth].ts` — Auth system
- `src/locales/en.json`, `fr.json`, `rw.json` — Translations

---

## 15. Conclusion

The forensic audit reveals a repository with a **solid product foundation** (auth, business isolation, feature flags, storage, i18n) and a **minimal growth layer** (newsletter subscribers, demo requests, referral cookies), but **no editorial content infrastructure**. The existing CMS is a business-scoped micro-content system for the Discovery Feed — fundamentally different from the platform-level editorial content system needed for the Knowledge & Growth Platform.

The architecture should **build new editorial content models** while **reusing existing infrastructure** (StorageService, FeatureFlagService, PublicLayout SEO, NewsletterService, auth system). The existing business-scoped CMS must remain **completely independent** from the new editorial content system.

---

*End of Forensic Audit Report*
