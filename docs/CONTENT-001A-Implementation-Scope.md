# CONTENT-001A — Implementation Scope

> **Mission**: ImboniServe Knowledge & Growth Platform — Implementation Readiness  
> **Document Type**: Phase Scope Definition  
> **Date**: 2025-08-15  
> **Status**: COMPLETE

---

## 1. Purpose

Define the exact scope for each implementation phase. Phase A is the minimum to run a real editorial operation. No scope creep.

## 2. Phase A — NOW (Editorial Operation Foundation)

### 2.1 Goal

Make ImboniServe capable of running a real editorial operation: create articles, manage them through an editorial workflow, publish to the public website with SEO, and track basic analytics.

### 2.2 In Scope

**Editorial Content**
- EditorialArticle model with 10 content types
- Full editorial lifecycle (DRAFT → REVIEW → APPROVED → SCHEDULED → PUBLISHED → UPDATED → ARCHIVED)
- Slug (unique), title, subtitle, excerpt, body (Markdown), bodyFormat
- Author, reviewer, publisher relationships (FK to User)
- publishedAt, scheduledAt, archivedAt timestamps
- Cover image (loose reference to PlatformMediaAsset)

**Taxonomy**
- Topic model (hierarchical, self-referencing)
- Tag model (flat, unique slug)
- ArticleTag join table

**Editorial Workflow**
- State transitions via ContentTransition audit trail
- Role-based permissions (EDITOR, REVIEWER, PUBLISHER, ADMIN)
- Scheduled publication support

**Product Relationships**
- ArticleProductLink model (string productKey, not FK)
- Product key registry config file (`src/config/product-keys.ts`)

**SEO**
- Per-article SEO metadata (seoMeta Json field)
- Dynamic sitemap (replace static sitemap with dynamic generation)
- Article JSON-LD structured data
- Breadcrumb structured data
- Canonical URLs
- OG/Twitter metadata per article

**Public Website**
- `/blog` (listing) + `/blog/[slug]` (detail)
- `/stories` (listing) + `/stories/[slug]` (detail)
- `/insights` (listing) + `/insights/[slug]` (detail)
- `/guides` (listing) + `/guides/[slug]` (detail)
- ArticleLayout component (extends PublicLayout with article SEO)
- Markdown rendering with sanitization (rehype-sanitize)
- Published-only access (drafts return 404)
- Pagination on listing pages

**Media**
- PlatformMediaAsset model (no businessId)
- StorageService extension (platform upload methods)
- Admin media library (list, upload, detail)
- Alt text, caption, attribution fields
- Cover image support for articles
- Inline image support in Markdown

**Admin / Editor**
- `/admin/content` (dashboard with stats)
- `/admin/content/articles` (list with filters)
- `/admin/content/articles/new` (create)
- `/admin/content/articles/[id]` (edit with workflow controls)
- `/admin/content/topics` (CRUD)
- `/admin/content/tags` (CRUD)
- `/admin/content/media` (library grid)
- `/admin/content/media/upload` (upload)
- `/admin/content/media/[id]` (detail/edit)
- `/admin/content/settings` (editorial settings)
- Markdown editor (textarea + live preview)
- SEO panel (meta title, description, slug, OG, SERP preview)
- Preview mode (view article as it will appear publicly)

**Newsletter (Minimum)**
- Extend NewsletterSubscriber with additive fields (name, email, phone, consentAt, consentSource, preferences, lastEngagedAt, bounceCount, suppressedAt)
- Extend subscribe API to accept new fields
- Existing unsubscribe, list, stats, CSV export continue working
- NO newsletter issue creation, campaign sending, or email delivery

**Analytics (Minimum)**
- Provider-agnostic analytics script snippet (Plausible or GA4 via env var)
- UTM parameter capture in middleware (additive to existing referral cookies)
- ContentEvent model for custom content events (page view, CTA click)
- No analytics dashboard in Phase A (use provider's dashboard)

**Auth Extension**
- Add `editorialRoles String[] @default([])` to User model
- Extend NextAuth JWT/session callbacks to include editorialRoles
- Editorial role checks in API routes and admin pages

**i18n**
- Add editorial translation keys to en.json (required)
- Add editorial translation keys to fr.json, rw.json (best effort)

### 2.3 Out of Scope (Phase A)

- KnowledgeEntity, Signal, EditorialIdea models → Phase B
- ArticleKnowledgeLink → Phase B
- NewsletterIssue, NewsletterCampaign, NewsletterSegment → Phase B
- NewsletterSubscriberSegment → Phase B
- ContentRevision (version history) → Phase B
- RelatedArticle → Phase B
- Narrative, ArticleNarrativeLink → Phase B
- Content truth/evidence UI → Phase B
- Email provider integration → Phase B
- Newsletter campaign sending → Phase B
- Signal auto-capture from DemoRequest → Phase B
- Content analytics dashboard → Phase B
- Topic/tag public pages (`/topic/[slug]`, `/tag/[slug]`) → Phase B
- Author profiles (`/author/[slug]`) → Phase B
- Newsletter archive (`/newsletter`) → Phase B
- Reports & resources pages → Phase B
- Content search → Phase B
- RSS feed → Phase B
- AI assistance → Phase C
- Social media distribution → Phase C
- Content localization → Phase C
- Knowledge graph → Phase D

## 3. Phase B — NEXT (Editorial Maturity)

### 3.1 Goal

Extend the editorial operation with knowledge management, signal capture, newsletter campaigns, content versioning, and richer discovery.

### 3.2 In Scope

- KnowledgeEntity model + admin UI + article linking
- Signal model + admin UI + manual capture
- EditorialIdea model + Kanban UI
- ArticleKnowledgeLink
- NewsletterIssue + NewsletterCampaign + NewsletterSegment + NewsletterSubscriberSegment
- Email provider interface + real provider integration
- Newsletter campaign creation, scheduling, sending, tracking
- ContentRevision (immutable version history)
- RelatedArticle (content ↔ content)
- Narrative + ArticleNarrativeLink
- Content truth/evidence UI + public badges
- Signal auto-capture from DemoRequest
- Content analytics dashboard
- Topic/tag public pages
- Author profiles
- Newsletter archive
- Reports & resources pages
- Content search (full-text)
- RSS feed
- DemoRequest UTM field extension (additive)

## 4. Phase C — LATER (Intelligence & Distribution)

- AI research assistance
- AI outline generation
- AI draft assistance
- AI SEO optimization
- AI title suggestions
- AI social repurposing
- AI newsletter generation
- AI translation
- AI content refresh
- Content decay detection
- Social media distribution (LinkedIn, X, Facebook)
- Content localization (ArticleLocale, hreflang)
- Knowledge graph visualization
- Signal clustering
- Content A/B testing

## 5. Phase D — LONG-TERM (Market Intelligence)

- Hospitality benchmarking
- Industry reports
- Market intelligence
- "Ask ImboniServe"
- Content personalization
- Predictive editorial intelligence
- Hospitality knowledge graph

## 6. Scope Boundary Enforcement

| Rule | Enforcement |
|------|-------------|
| No business CMS changes | ContentPost, CmsService, /dashboard/cms/* untouched |
| No Prisma enum changes | UserRole enum unchanged; use editorialRoles String[] |
| No production infrastructure changes | No email provider, no analytics provider config, no DNS, no Vercel changes |
| No AI implementation | AI extension points documented only |
| No content localization | i18n for UI only; content is single-language |
| No social media integration | Distribution architecture documented only |

---

*End of Implementation Scope*
