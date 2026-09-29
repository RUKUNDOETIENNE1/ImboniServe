# CONTENT-001 — Implementation Scope & Roadmap

> **Mission**: ImboniServe Knowledge & Growth Platform  
> **Document Type**: Implementation Scope Definition  
> **Date**: 2025-01-20  
> **Status**: COMPLETE

---

## 1. Purpose

Define the implementation scope across four horizons: NOW, NEXT, LATER, and LONG-TERM. This is a design document — no implementation begins unless the mission explicitly reaches an implementation phase.

## 2. Scope Definition Principles

1. **NOW**: Minimum viable editorial content system — articles, SEO, public pages, basic newsletter, analytics
2. **NEXT**: Governance, versioning, email delivery, ideas, signals, evidence, distribution
3. **LATER**: AI assistance, social distribution, content localization, content decay, knowledge graph
4. **LONG-TERM**: Market intelligence, benchmarking, personalization, "Ask ImboniServe"

## 3. NOW Scope (Immediate Implementation)

### 3.1 Data Models (Schema Additions)

| Model | Purpose |
|-------|---------|
| EditorialArticle | Core editorial content entity |
| Topic | Hierarchical content categorization |
| Tag | Flexible content labeling |
| ArticleTag | Join: article ↔ tag |
| ContentTransition | Audit trail for state changes |
| PlatformMediaAsset | Platform-level media library |
| ArticleProductLink | Content ↔ product relationships |
| ArticleKnowledgeLink | Content ↔ knowledge entity links |
| KnowledgeEntity | Foundation for knowledge graph |
| Signal | Market signal capture |
| EditorialIdea | Idea pipeline |
| NewsletterIssue | Newsletter issue metadata |
| NewsletterCampaign | Delivery tracking |
| NewsletterSegment | Subscriber segmentation |
| NewsletterSubscriberSegment | Join: subscriber ↔ segment |
| ContentEvent | Custom content event tracking |

### 3.2 Schema Extensions (Additive Fields)

| Model | Fields to Add |
|-------|--------------|
| NewsletterSubscriber | name, email, phone, consentAt, consentSource, preferences, lastEngagedAt, bounceCount, suppressedAt |
| User | editorialRoles |
| DemoRequest | utmSource, utmMedium, utmCampaign, utmContent, refCode |

### 3.3 Public Pages

| Route | Purpose |
|-------|---------|
| `/blog` | Article listing |
| `/blog/[slug]` | Article detail |
| `/stories` | Stories listing |
| `/stories/[slug]` | Story detail |
| `/insights` | Insights listing |
| `/insights/[slug]` | Insight detail |
| `/guides` | Guides listing |
| `/guides/[slug]` | Guide detail |

### 3.4 Admin Pages

| Route | Purpose |
|-------|---------|
| `/admin/content` | Content dashboard |
| `/admin/content/articles` | Article list |
| `/admin/content/articles/new` | Create article |
| `/admin/content/articles/[id]` | Edit article |
| `/admin/content/topics` | Topic management |
| `/admin/content/tags` | Tag management |
| `/admin/content/media` | Media library |
| `/admin/content/media/upload` | Upload media |
| `/admin/content/media/[id]` | Media detail |
| `/admin/content/ideas` | Idea pipeline |
| `/admin/content/ideas/new` | Create idea |
| `/admin/content/ideas/[id]` | Edit idea |
| `/admin/content/signals` | Signal inbox |
| `/admin/content/signals/[id]` | Signal detail |
| `/admin/content/knowledge` | Knowledge entities |
| `/admin/content/settings` | Editorial settings |

### 3.5 API Routes

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/admin/content/articles` | GET, POST | List/create articles |
| `/api/admin/content/articles/[id]` | GET, PATCH, DELETE | Get/update/delete article |
| `/api/admin/content/articles/[id]/transition` | POST | State transition |
| `/api/admin/content/topics` | GET, POST | List/create topics |
| `/api/admin/content/topics/[id]` | GET, PATCH, DELETE | Get/update/delete topic |
| `/api/admin/content/tags` | GET, POST | List/create tags |
| `/api/admin/content/tags/[id]` | GET, PATCH, DELETE | Get/update/delete tag |
| `/api/admin/content/media` | GET | List media |
| `/api/admin/content/media/upload` | POST | Upload media |
| `/api/admin/content/media/[id]` | GET, PATCH, DELETE | Get/update/delete media |
| `/api/admin/content/ideas` | GET, POST | List/create ideas |
| `/api/admin/content/ideas/[id]` | GET, PATCH | Get/update idea |
| `/api/admin/content/signals` | GET, POST | List/create signals |
| `/api/admin/content/signals/[id]` | GET, PATCH | Get/update signal |
| `/api/admin/content/knowledge` | GET, POST | List/create knowledge entities |
| `/api/admin/content/knowledge/[id]` | GET, PATCH, DELETE | Get/update/delete knowledge entity |
| `/api/public/content/articles` | GET | Public list (published only) |
| `/api/public/content/articles/[slug]` | GET | Public detail (published only) |

### 3.6 Infrastructure

| Component | Purpose |
|-----------|---------|
| Dynamic sitemap (`/sitemap-articles.xml.ts`) | Dynamic content sitemap |
| UTM cookie capture (middleware extension) | Attribution tracking |
| Analytics integration (Plausible/GA) | Web analytics |
| Markdown rendering service | Safe article body rendering |
| Email provider interface | Newsletter delivery abstraction |
| Product key registry (`src/config/product-keys.ts`) | Product reference mapping |

### 3.7 Services

| Service | Purpose |
|---------|---------|
| EditorialService | Article CRUD, state transitions, listing |
| TopicService | Topic CRUD, hierarchy management |
| TagService | Tag CRUD, auto-slug |
| PlatformMediaService | Media upload, list, delete |
| IdeaService | Idea CRUD, pipeline management |
| SignalService | Signal CRUD, triage |
| KnowledgeService | Knowledge entity CRUD |
| NewsletterIssueService | Issue CRUD, send scheduling |
| EmailProviderService | Email delivery abstraction |
| ContentAnalyticsService | Content event tracking, metrics |

### 3.8 NOW Scope Exclusions

- No content versioning/revisions (NEXT)
- No email delivery to real provider (interface only, logging provider for dev)
- No social media distribution (LATER)
- No AI assistance (LATER)
- No content localization (LATER)
- No content decay detection (LATER)
- No knowledge graph traversal (LATER)
- No narrative engine (NEXT foundation only)

## 4. NEXT Scope

### 4.1 Features

| Feature | Description |
|---------|-------------|
| Content revisions | Immutable revision history, compare, restore |
| Related articles | Content ↔ content relationships |
| Email delivery | Real email provider integration (SendGrid/SES/Resend) |
| Newsletter campaigns | Full campaign creation, sending, tracking |
| Newsletter preferences | Subscriber preference management |
| Idea pipeline UI | Kanban board, drag-and-drop |
| Signal auto-capture | Auto-capture from DemoRequest, support chat |
| Evidence/verification | Content truth UI, public badges |
| Narrative management | Narrative CRUD, article linking |
| Content-product cross-linking | Feature pages show related articles |
| Author profiles | Public author pages |
| Topic/tag pages | `/topic/[slug]`, `/tag/[slug]` |
| Newsletter archive | `/newsletter`, `/newsletter/[slug]` |
| Reports & resources | `/reports/*`, `/resources/*` |
| Content search | Full-text search across articles |
| RSS feed | `/rss.xml` |

## 5. LATER Scope

| Feature | Description |
|---------|-------------|
| AI research assistance | Suggest sources, related knowledge |
| AI outline generation | Generate article outlines |
| AI draft assistance | Generate/expand draft content |
| AI SEO optimization | Suggest meta tags, analyze SEO score |
| AI title suggestions | Suggest alternative titles |
| AI social repurposing | Generate channel-specific content |
| AI newsletter generation | Assemble newsletter from articles |
| AI translation | Translate articles to other locales |
| AI content refresh | Identify stale content, suggest updates |
| Content decay detection | Automated decay signal detection |
| Social media distribution | API integrations with LinkedIn, X, Facebook |
| Content localization | ArticleLocale, locale-specific URLs, hreflang |
| Knowledge graph visualization | Visual knowledge entity relationships |
| Signal clustering | Group similar signals, detect trends |
| Content A/B testing | Test titles, excerpts, CTAs |
| Content embedding | Embed ImboniServe content on third-party sites |

## 6. LONG-TERM Scope (Foundation Only)

| Feature | Description |
|---------|-------------|
| Hospitality benchmarking | Industry benchmarks from aggregated data |
| Industry reports | Automated report generation from platform data |
| Market intelligence | Market analysis and opportunity detection |
| "Ask ImboniServe" | AI-powered hospitality Q&A |
| Content personalization | Personalized content recommendations |
| Predictive editorial intelligence | AI predicts what content to create |
| Hospitality knowledge graph | Full graph database of hospitality knowledge |
| Research products | Paid research products from aggregated insights |

## 7. Dependency Analysis

### 7.1 NOW Dependencies

| Dependency | Type | Status |
|-----------|------|--------|
| Prisma schema additions | Database | New models, additive |
| StorageService | Existing | Reuse for platform media |
| FeatureFlagService | Existing | Reuse for editorial feature flags |
| NextAuth | Existing | Reuse for editorial auth |
| PublicLayout | Existing | Extend with content SEO |
| Middleware | Existing | Extend with UTM capture |
| AdminLayout | Existing | Reuse for editorial admin |
| i18n system | Existing | Add editorial translation keys |
| NewsletterService | Existing | Extend with campaigns |
| DemoRequestService | Existing | Extend with UTM fields |

### 7.2 New Dependencies

| Dependency | Type | Purpose |
|-----------|------|---------|
| remark/rehype | npm | Markdown rendering + sanitization |
| rehype-sanitize | npm | XSS prevention |
| Plausible (or GA4) | External | Web analytics |
| Email provider SDK | External | Newsletter delivery (NEXT) |

### 7.3 No Conflicts

- All schema changes are additive (no existing model modifications beyond adding nullable fields)
- All new routes are under `/admin/content/*` and `/api/admin/content/*` (no conflicts with existing routes)
- All new public routes are under `/blog`, `/stories`, `/insights`, `/guides` (no conflicts with existing routes)
- Existing CMS (`/dashboard/cms/*`) remains completely independent

## 8. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Schema migration issues | Low | Medium | All changes additive, nullable fields |
| Performance with large content set | Low | Medium | Proper indexing, pagination |
| SEO competition | Medium | Low | Quality content, proper metadata |
| Email deliverability | Medium | High | Use reputable provider, monitor bounces |
| Editorial workflow adoption | Medium | Medium | Simple workflow, clear roles |
| Analytics privacy compliance | Low | High | Privacy-first provider, cookie consent |

## 9. Implementation Readiness

| Criterion | Status |
|-----------|--------|
| Architecture designed | ✅ Complete |
| Data models defined | ✅ Complete |
| API routes planned | ✅ Complete |
| UI pages planned | ✅ Complete |
| Security model defined | ✅ Complete |
| SEO architecture defined | ✅ Complete |
| Newsletter architecture defined | ✅ Complete |
| Analytics architecture defined | ✅ Complete |
| Existing infrastructure audited | ✅ Complete |
| Conflicts identified | ✅ None |
| Dependencies identified | ✅ Complete |
| Implementation scope defined | ✅ Complete |

**Status**: Ready for implementation when mission reaches implementation phase.

---

*End of Implementation Scope & Roadmap*
