# CONTENT-001A — Implementation Backlog

> **Mission**: ImboniServe Knowledge & Growth Platform — Implementation Readiness  
> **Document Type**: CONTENT-002 Engineering Backlog  
> **Date**: 2025-08-15  
> **Status**: COMPLETE

---

## 1. Purpose

Provide a precise, numbered implementation backlog for CONTENT-002. Each item has: ID, title, objective, files/areas likely affected, dependencies, risk, test requirements, and phase priority.

## 2. Priority Definitions

| Priority | Meaning |
|----------|---------|
| P0 | Blocks implementation foundation — must be done first |
| P1 | Important for usable editorial operation — must be in Phase A |
| P2 | Improvement / later — can be Phase B |

## 3. Backlog

### P0 — Foundation (Blocks Everything)

| ID | Title | Objective | Files / Areas | Dependencies | Risk | Test Requirements | Phase |
|----|-------|-----------|---------------|-------------|------|-------------------|-------|
| CONTENT-002-001 | Prisma schema: new models | Add EditorialArticle, Topic, Tag, ArticleTag, ContentTransition, PlatformMediaAsset, ArticleProductLink, ContentEvent to schema.prisma | `prisma/schema.prisma` | None | Low — additive | Migration applies cleanly; tables exist | A |
| CONTENT-002-002 | Prisma schema: extend User | Add editorialRoles field + 3 relation fields to User model | `prisma/schema.prisma` | 001 | Low — additive | Column exists with default [] | A |
| CONTENT-002-003 | Prisma schema: extend NewsletterSubscriber | Add 9 nullable fields to NewsletterSubscriber | `prisma/schema.prisma` | 001 | Low — additive | Columns exist, nullable | A |
| CONTENT-002-004 | Prisma migration | Generate and apply migration | `prisma/migrations/` | 001, 002, 003 | Medium — production DB | Post-migration verification checks | A |
| CONTENT-002-005 | Auth: extend JWT/session | Add editorialRoles to NextAuth JWT and session callbacks | `src/pages/api/auth/[...nextauth].ts` | 002 | Medium — auth system | Session includes editorialRoles; existing auth unchanged | A |
| CONTENT-002-006 | Product key registry | Create config file with product keys and labels | `src/config/product-keys.ts` | None | Low | Config loads; keys are strings | A |
| CONTENT-002-007 | Markdown rendering utility | Install remark/rehype/rehype-sanitize; create render utility | `src/lib/markdown.ts`, `package.json` | None | Low — new dependency | XSS payloads sanitized; valid Markdown renders | A |

### P1 — Editorial Operation (Usable System)

| ID | Title | Objective | Files / Areas | Dependencies | Risk | Test Requirements | Phase |
|----|-------|-----------|---------------|-------------|------|-------------------|-------|
| CONTENT-002-008 | EditorialService | Create service for article CRUD, transitions, permission checks | `src/lib/services/editorial.service.ts` | 001, 004, 005 | Medium — core logic | U1-U8, U12 (unit tests) | A |
| CONTENT-002-009 | TopicService | Create service for topic CRUD | `src/lib/services/topic.service.ts` | 001, 004 | Low | U9 (unit test) | A |
| CONTENT-002-010 | TagService | Create service for tag CRUD | `src/lib/services/tag.service.ts` | 001, 004 | Low | U10 (unit test) | A |
| CONTENT-002-011 | PlatformMediaService | Create service for platform media (reuse StorageService) | `src/lib/services/platform-media.service.ts`, `src/lib/services/storage.service.ts` | 001, 004 | Medium — storage integration | I6-I7 (integration tests) | A |
| CONTENT-002-012 | StorageService platform methods | Add uploadPlatformImage, uploadPlatformVideo to StorageService | `src/lib/services/storage.service.ts` | None | Low — additive methods | Upload succeeds; path prefix is platform/ | A |
| CONTENT-002-013 | Admin API: articles | Create CRUD + transition endpoints for articles | `src/pages/api/admin/content/articles/` | 008, 005 | Medium | I1-I3, I15, S1-S3 (integration + security) | A |
| CONTENT-002-014 | Admin API: topics | Create CRUD endpoints for topics | `src/pages/api/admin/content/topics/` | 009 | Low | I4 (integration) | A |
| CONTENT-002-015 | Admin API: tags | Create CRUD endpoints for tags | `src/pages/api/admin/content/tags/` | 010 | Low | I5 (integration) | A |
| CONTENT-002-016 | Admin API: media | Create list, upload, detail, update, delete endpoints | `src/pages/api/admin/content/media/` | 011 | Medium | I6-I7, S7-S8 (integration + security) | A |
| CONTENT-002-017 | Admin API: product links | Create set/get endpoints for article product links | `src/pages/api/admin/content/articles/[id]/products.ts` | 008, 006 | Low | I10 (integration) | A |
| CONTENT-002-018 | Public API: articles | Create public list + detail endpoints | `src/pages/api/public/content/articles/` | 008, 007 | Low | I8-I9 (integration) | A |
| CONTENT-002-019 | Public API: content events | Create anonymous event tracking endpoint | `src/pages/api/public/content/events.ts` | 001 | Low | I11 (integration) | A |
| CONTENT-002-020 | Admin UI: content dashboard | Create /admin/content with stats and recent activity | `src/pages/admin/content/index.tsx` | 013 | Low | E1 (E2E) | A |
| CONTENT-002-021 | Admin UI: article list | Create /admin/content/articles with filters, pagination | `src/pages/admin/content/articles/index.tsx` | 013 | Low | E1 (E2E) | A |
| CONTENT-002-022 | Admin UI: article editor | Create /admin/content/articles/new and [id] with Markdown editor, SEO panel, workflow controls | `src/pages/admin/content/articles/new.tsx`, `src/pages/admin/content/articles/[id].tsx` | 013, 014, 015, 016, 017, 007 | High — most complex UI | E1-E4, E9-E10 (E2E) | A |
| CONTENT-002-023 | Admin UI: topics | Create /admin/content/topics with tree view and CRUD | `src/pages/admin/content/topics.tsx` | 014 | Low | — | A |
| CONTENT-002-024 | Admin UI: tags | Create /admin/content/tags with list and CRUD | `src/pages/admin/content/tags.tsx` | 015 | Low | — | A |
| CONTENT-002-025 | Admin UI: media library | Create /admin/content/media with grid, upload, detail | `src/pages/admin/content/media/` | 016 | Medium | — | A |
| CONTENT-002-026 | Public UI: blog listing + detail | Create /blog and /blog/[slug] with ArticleLayout | `src/pages/blog/index.tsx`, `src/pages/blog/[slug].tsx` | 018, 007 | Medium | E5-E8 (E2E) | A |
| CONTENT-002-027 | Public UI: stories listing + detail | Create /stories and /stories/[slug] | `src/pages/stories/` | 018, 007 | Low | — | A |
| CONTENT-002-028 | Public UI: insights listing + detail | Create /insights and /insights/[slug] | `src/pages/insights/` | 018, 007 | Low | — | A |
| CONTENT-002-029 | Public UI: guides listing + detail | Create /guides and /guides/[slug] | `src/pages/guides/` | 018, 007 | Low | — | A |
| CONTENT-002-030 | ArticleLayout component | Create ArticleLayout with article SEO, JSON-LD, breadcrumbs | `src/components/ArticleLayout.tsx` | 007 | Medium | E7 (E2E — SEO metadata) | A |
| CONTENT-002-031 | Sitemap refactor | Replace static sitemap with sitemap index + sub-sitemaps | `src/pages/sitemap.xml.ts`, `src/pages/sitemap-pages.xml.ts`, `src/pages/sitemap-articles.xml.ts` | 018 | Medium — affects existing SEO | I13 (integration); existing URLs preserved | A |
| CONTENT-002-032 | Middleware: UTM capture | Add UTM parameter cookie capture to middleware | `src/middleware.ts` | None | Low — additive | U15 (unit test) | A |
| CONTENT-002-033 | Newsletter subscribe extension | Extend API + service to accept new fields | `src/pages/api/growth/newsletter-subscribe.ts`, `src/lib/services/newsletter.service.ts` | 003 | Low — backward compatible | I12 (integration) | A |
| CONTENT-002-034 | Admin newsletter page extension | Display new subscriber fields in admin UI | `src/pages/admin/newsletter.tsx` | 033 | Low | — | A |
| CONTENT-002-035 | Analytics script component | Create provider-agnostic analytics script | `src/components/AnalyticsScript.tsx`, `src/pages/_app.tsx` or `_document.tsx` | None | Low | — | A |
| CONTENT-002-036 | Email provider interface | Define interface (no implementation) | `src/lib/services/email-provider.interface.ts` | None | Low | — | A |
| CONTENT-002-037 | Scheduled publication cron | Create cron API route for auto-publishing scheduled articles | `src/pages/api/cron/publish-scheduled.ts` | 008 | Medium — timing | I14 (integration) | A |
| CONTENT-002-038 | Homepage: latest articles | Add latest articles section to homepage | `src/pages/index.tsx` | 018 | Low | — | A |
| CONTENT-002-039 | Navigation: Insights link | Add "Insights" link to PublicLayout header | `src/components/PublicLayout.tsx` | None | Low | — | A |
| CONTENT-002-040 | i18n: editorial translations | Add editorial translation keys to en.json (required), fr.json + rw.json (best effort) | `src/locales/en.json`, `src/locales/fr.json`, `src/locales/rw.json` | None | Low | — | A |
| CONTENT-002-041 | Seed: default topics | Create seed script for initial topics | `prisma/seed-editorial.ts` | 004 | Low | — | A |
| CONTENT-002-042 | Admin UI: editorial settings | Create /admin/content/settings page | `src/pages/admin/content/settings.tsx` | 013 | Low | — | A |

### P2 — Phase B (Deferred)

| ID | Title | Objective | Phase |
|----|-------|-----------|-------|
| CONTENT-002-043 | KnowledgeEntity model + service + UI | Knowledge graph foundation | B |
| CONTENT-002-044 | Signal model + service + UI | Market signal capture | B |
| CONTENT-002-045 | EditorialIdea model + service + Kanban UI | Idea pipeline | B |
| CONTENT-002-046 | ArticleKnowledgeLink | Content ↔ knowledge | B |
| CONTENT-002-047 | NewsletterIssue + Campaign + Segment | Full newsletter platform | B |
| CONTENT-002-048 | Email provider implementation | Real email delivery | B |
| CONTENT-002-049 | ContentRevision | Immutable version history | B |
| CONTENT-002-050 | RelatedArticle | Content ↔ content relationships | B |
| CONTENT-002-051 | Narrative + ArticleNarrativeLink | Strategic narratives | B |
| CONTENT-002-052 | Content analytics dashboard | Per-article metrics, traffic sources, funnel | B |
| CONTENT-002-053 | DemoRequest UTM extension | Capture UTM on demo requests | B |
| CONTENT-002-054 | Topic/tag public pages | /topic/[slug], /tag/[slug] | B |
| CONTENT-002-055 | Author profiles | /author/[slug] | B |
| CONTENT-002-056 | Newsletter archive | /newsletter, /newsletter/[slug] | B |
| CONTENT-002-057 | Content search | Full-text search across articles | B |
| CONTENT-002-058 | RSS feed | /rss.xml | B |
| CONTENT-002-059 | Preview mode | Token-based draft preview | B |
| CONTENT-002-060 | Reports & resources pages | /reports, /resources | B |

## 4. Dependency Graph (P0 + P1)

```
001 (schema: new models)
├── 002 (schema: extend User)
├── 003 (schema: extend NewsletterSubscriber)
├── 004 (migration) ← 001, 002, 003
│   ├── 005 (auth: JWT/session) ← 002
│   ├── 008 (EditorialService) ← 004, 005
│   ├── 009 (TopicService) ← 004
│   ├── 010 (TagService) ← 004
│   ├── 011 (PlatformMediaService) ← 004
│   ├── 037 (cron: publish scheduled) ← 008
│   ├── 041 (seed: topics) ← 004
│   └── 019 (public API: events) ← 001
├── 006 (product key registry)
├── 007 (markdown rendering)
├── 012 (StorageService platform methods)
├── 013 (admin API: articles) ← 008, 005
│   ├── 017 (admin API: product links) ← 008, 006
│   ├── 020 (admin UI: dashboard) ← 013
│   ├── 021 (admin UI: article list) ← 013
│   ├── 022 (admin UI: article editor) ← 013, 014, 015, 016, 017, 007
│   └── 042 (admin UI: settings) ← 013
├── 014 (admin API: topics) ← 009
│   └── 023 (admin UI: topics) ← 014
├── 015 (admin API: tags) ← 010
│   └── 024 (admin UI: tags) ← 015
├── 016 (admin API: media) ← 011
│   └── 025 (admin UI: media library) ← 016
├── 018 (public API: articles) ← 008, 007
│   ├── 026-029 (public UI: blog/stories/insights/guides) ← 018, 007
│   ├── 030 (ArticleLayout) ← 007
│   ├── 031 (sitemap refactor) ← 018
│   └── 038 (homepage: latest articles) ← 018
├── 032 (middleware: UTM)
├── 033 (newsletter extension) ← 003
│   └── 034 (admin newsletter page) ← 033
├── 035 (analytics script)
├── 036 (email provider interface)
├── 039 (navigation: insights link)
└── 040 (i18n: editorial translations)
```

## 5. Suggested Implementation Order

### Sprint 1: Foundation (P0)
1. CONTENT-002-001 through 007 (schema, migration, auth, config, markdown)

### Sprint 2: Services (P0/P1)
2. CONTENT-002-008 through 012 (services + storage extension)

### Sprint 3: Admin APIs (P1)
3. CONTENT-002-013 through 019 (all admin + public APIs)

### Sprint 4: Admin UI (P1)
4. CONTENT-002-020 through 025 (admin pages)

### Sprint 5: Public UI + SEO (P1)
5. CONTENT-002-026 through 031 (public pages, ArticleLayout, sitemap)

### Sprint 6: Extensions + Polish (P1)
6. CONTENT-002-032 through 042 (middleware, newsletter, analytics, i18n, seed, settings, cron, homepage, nav)

---

*End of Implementation Backlog*
