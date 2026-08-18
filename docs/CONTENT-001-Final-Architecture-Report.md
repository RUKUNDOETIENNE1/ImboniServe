# CONTENT-001 — Final Architecture Report

> **Mission**: ImboniServe Knowledge & Growth Platform — Content Intelligence, Editorial & Marketing Architecture  
> **Document Type**: Final Architecture Report  
> **Date**: 2025-01-20  
> **Status**: COMPLETE

---

## 1. Mission Summary

Design the architectural foundation for the ImboniServe Knowledge & Growth Platform — a system that enables ImboniServe to understand hospitality problems, capture market signals, produce editorial content, build audience, generate leads, and create a compounding loop of knowledge and growth. The architecture must allow for natural evolution without future rewrites, while the immediate implementation must remain focused and practical.

## 2. What Was Done

### 2.1 Forensic Audit
Conducted a comprehensive forensic audit of the existing repository to understand the current state of:
- Public website (homepage, features, pricing, FAQ, legal pages)
- CMS infrastructure (ContentPost, MediaAsset, PostEngagement, PostAttribution)
- Newsletter infrastructure (NewsletterSubscriber, NewsletterService)
- Lead capture (DemoRequest, DemoRequestService)
- SEO infrastructure (PublicLayout meta tags, static sitemap, robots.txt)
- Analytics (none beyond video view tracking)
- Marketing (referral cookies, sales pipeline, growth workspace)
- Auth & business isolation (NextAuth, roles, businessId scoping)
- i18n (custom translation system, en/fr/rw)
- Storage (Supabase Storage via StorageService)

### 2.2 Architecture Design
Designed 20 deliverable documents covering:
- Content domain model and data model
- Knowledge, signal, evidence, and narrative models
- SEO, newsletter, and media library architecture
- Public information architecture and editorial experience
- Analytics & attribution and content-product relationships
- Content distribution and governance & security
- Internationalization and AI assistance extension points
- Implementation scope and roadmap
- Architecture decision records

## 3. Key Findings

### 3.1 What Exists
- **Business-scoped CMS**: ContentPost (MICROBLOG, PHOTO, SHORT_VIDEO, PROMO, COMBO) with DRAFT → PENDING_REVIEW → APPROVED → SCHEDULED → PUBLISHED lifecycle, feature-flagged, plan-limited
- **Newsletter subscribers**: Subscribe/unsubscribe/CSV export, no email delivery
- **Demo requests**: PENDING → CONTACTED → COMPLETED workflow
- **Basic SEO**: Per-page meta tags, OG, Twitter Card, JSON-LD (Organization, WebSite)
- **Static sitemap**: 10 hardcoded URLs
- **Referral cookies**: 30-day attribution via middleware
- **Supabase Storage**: Video/image upload with validation, thumbnails, quota enforcement
- **Feature flags**: Per-business overrides with plan-gating
- **i18n**: en, fr, rw translations
- **Auth**: NextAuth with JWT, MFA/OTP, roles, business isolation

### 3.2 What Does Not Exist
- No editorial content system (articles, guides, insights, stories)
- No SEO content metadata (slugs, meta titles per content)
- No dynamic sitemap
- No web analytics
- No email campaign delivery
- No content governance (editorial roles, review workflow)
- No content versioning
- No content categorization (topics, tags)
- No knowledge models
- No signal engine
- No evidence/verification layer
- No content-product relationships
- No content distribution to external channels
- No content localization

## 4. Architectural Decisions

### 4.1 Major Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Create new editorial content models, not extend ContentPost | Different scope (platform vs business), different lifecycle, different governance |
| 2 | Content type as String, not enum | Extensible without migration |
| 3 | Product references via string keys, not FKs | Products are conceptual, not database entities |
| 4 | Newsletter issue as EditorialArticle | Inherits workflow, SEO, relationships |
| 5 | Email provider abstraction | No vendor lock-in, deployment configuration decision |
| 6 | SEO metadata as Json field | Flexible, 1:1 with article, no extra query |
| 7 | Content truth as Json metadata | Lightweight, not a scientific citation platform |
| 8 | Knowledge entity as flat model with hierarchy | Foundation only, no graph database |
| 9 | Signal capture as manual + DemoRequest auto-capture | Pragmatic for NOW, extensible for LATER |
| 10 | Privacy-first analytics (Plausible) | Lightweight, GDPR-friendly, no cookies |
| 11 | Dynamic sitemap | Reflects current published content |
| 12 | Reuse existing infrastructure | Tested, working, consistent patterns |

### 4.2 What Remains Independent

- **Existing CMS (ContentPost/MediaAsset)**: Business-scoped Discovery Feed — completely separate from editorial content
- **Existing product features**: Not modified — editorial content references them via string keys
- **Existing auth system**: Extended with `editorialRoles` field — no changes to existing role system
- **Existing newsletter subscribers**: Extended with additive fields — no breaking changes

## 5. Data Model Summary

### 5.1 New Models (15)

| Model | Purpose |
|-------|---------|
| EditorialArticle | Core editorial content |
| Topic | Hierarchical categorization |
| Tag | Flexible labeling |
| ArticleTag | Article ↔ Tag join |
| ContentTransition | State change audit trail |
| PlatformMediaAsset | Platform media library |
| ArticleProductLink | Content ↔ Product reference |
| ArticleKnowledgeLink | Content ↔ Knowledge reference |
| KnowledgeEntity | Knowledge graph foundation |
| Signal | Market signal capture |
| EditorialIdea | Idea pipeline |
| NewsletterIssue | Newsletter-specific metadata |
| NewsletterCampaign | Delivery tracking |
| NewsletterSegment | Subscriber segmentation |
| NewsletterSubscriberSegment | Subscriber ↔ Segment join |
| ContentEvent | Custom event tracking |

### 5.2 Extended Models (3)

| Model | Additions |
|-------|-----------|
| NewsletterSubscriber | name, email, phone, consentAt, consentSource, preferences, lastEngagedAt, bounceCount, suppressedAt |
| User | editorialRoles |
| DemoRequest | utmSource, utmMedium, utmCampaign, utmContent, refCode |

### 5.3 NEXT Phase Models (4)

| Model | Purpose |
|-------|---------|
| ContentRevision | Immutable revision history |
| RelatedArticle | Content ↔ Content relationships |
| Narrative | Strategic narrative foundation |
| ArticleNarrativeLink | Content ↔ Narrative relationships |

## 6. Implementation Scope

### NOW (Immediate)
- Editorial content model with 10 content types
- Content lifecycle: IDEA → DRAFT → REVIEW → APPROVED → SCHEDULED → PUBLISHED → UPDATED → ARCHIVED
- SEO metadata (slug, meta title, meta description, OG, structured data)
- Dynamic sitemap generation
- Content categorization (topics, tags)
- Platform-level media library
- Newsletter campaign model (subscriber management extended)
- Analytics integration (Plausible/GA4)
- Content ↔ product relationships (string keys)
- Editorial admin experience (article editor, topic/tag management, media library, idea pipeline, signal inbox, knowledge entities)
- Public content pages (/blog, /stories, /insights, /guides)
- Knowledge model foundation
- Signal engine foundation
- UTM parameter capture in middleware
- Content event tracking

### NEXT
- Content governance (editorial roles, review workflow)
- Content versioning/revisions
- Email delivery integration (real provider)
- Newsletter campaigns (full send, tracking, webhooks)
- Idea pipeline UI (Kanban)
- Signal auto-capture (from DemoRequest)
- Evidence/verification UI
- Narrative management
- Author profiles
- Topic/tag pages
- Newsletter archive
- Reports & resources pages
- Content search
- RSS feed

### LATER
- AI assistance (research, outline, draft, SEO, titles, social, newsletter, translation, refresh)
- Social media distribution
- Content localization (ArticleLocale, hreflang)
- Knowledge graph visualization
- Signal clustering
- Content decay detection
- A/B testing

### LONG-TERM (Foundation Only)
- Hospitality benchmarking
- Industry reports
- Market intelligence
- "Ask ImboniServe"
- Content personalization
- Predictive editorial intelligence
- Hospitality knowledge graph

## 7. Compounding Loop Architecture

```
HOSPITALITY KNOWLEDGE (KnowledgeEntity)
    → MARKET SIGNALS (Signal)
    → EDITORIAL IDEAS (EditorialIdea)
    → EDITORIAL CONTENT (EditorialArticle)
    → AUDIENCE (Public pages + SEO + Analytics)
    → LEADS (DemoRequest + UTM attribution)
    → CUSTOMERS (User signup → Subscription)
    → REAL HOSPITALITY EXPERIENCE (Product usage)
    → NEW KNOWLEDGE / EVIDENCE (ContentTruth + new KnowledgeEntities)
    → BACK TO THE SYSTEM
```

Each stage is supported by a model:
- Knowledge → KnowledgeEntity
- Signals → Signal
- Ideas → EditorialIdea
- Content → EditorialArticle
- Audience → Public pages + Analytics + SEO
- Leads → DemoRequest (extended with UTM)
- Customers → User (extended with signupSource)
- Evidence → EditorialArticle.contentTruth

## 8. Security Summary

| Control | Implementation |
|---------|---------------|
| Authentication | NextAuth (existing, reused) |
| Authorization | Editorial roles (EDITOR, REVIEWER, PUBLISHER, ADMIN) |
| XSS prevention | Markdown sanitization (rehype-sanitize) |
| CSRF protection | NextAuth SameSite cookies (existing) |
| SQL injection | Prisma ORM (existing) |
| File upload security | Type/size validation (existing StorageService) |
| Audit trail | ContentTransition (all state changes) |
| Revision history | ContentRevision (immutable, NEXT) |
| No hard deletes | Archive instead of delete |
| PII protection | Admin-only access to subscriber data |
| Cookie consent | Existing CookieConsentBanner |
| Public/private separation | Only PUBLISHED content is public |

## 9. Unresolved Questions

| # | Question | Resolution |
|---|----------|------------|
| 1 | Which email provider to use for newsletter delivery? | Deployment configuration decision. Evaluate SendGrid, AWS SES, Resend, Postmark based on Rwanda/East Africa deliverability. |
| 2 | Which analytics provider: Plausible vs GA4? | Recommended Plausible for privacy-first approach. Final decision at implementation time. |
| 3 | Self-hosted Plausible or cloud? | Depends on infrastructure budget. Cloud is simpler, self-hosted is cheaper long-term. |
| 4 | Should editorial content use ISR (Incremental Static Regeneration)? | Evaluate at implementation time. ISR improves performance but adds complexity. |
| 5 | Should content revisions store full body or diff? | Full body for simplicity (storage is cheap). Diffs for LATER if storage becomes concern. |
| 6 | How to handle content redirects when slugs change? | NEXT scope: add redirect table. For NOW, slug changes are discouraged. |
| 7 | Should editorial admin be a separate Next.js app? | No — same app, different routes. Simpler deployment, shared auth. |

## 10. Implementation Readiness

| Criterion | Status |
|-----------|--------|
| Architecture designed | ✅ |
| Data models defined | ✅ |
| API routes planned | ✅ |
| UI pages planned | ✅ |
| Security model defined | ✅ |
| SEO architecture defined | ✅ |
| Newsletter architecture defined | ✅ |
| Analytics architecture defined | ✅ |
| Existing infrastructure audited | ✅ |
| Conflicts identified | ✅ None |
| Dependencies identified | ✅ |
| Implementation scope defined | ✅ |
| ADRs documented | ✅ |
| Deliverables produced | ✅ 20 documents |

**Status**: Architecture design complete. Ready for implementation when mission reaches implementation phase.

## 11. Deliverables Produced

| # | Document | File |
|---|----------|------|
| 1 | Executive Summary | `docs/CONTENT-001-Executive-Summary.md` |
| 2 | Forensic Audit Report | `docs/CONTENT-001-Forensic-Audit.md` |
| 3 | Content Domain Model | `docs/CONTENT-001-Content-Domain-Model.md` |
| 4 | Content Data Model | `docs/CONTENT-001-Content-Data-Model.md` |
| 5 | Knowledge, Signal, Evidence & Narrative Model | `docs/CONTENT-001-Knowledge-Signal-Evidence-Narrative-Model.md` |
| 6 | SEO Architecture | `docs/CONTENT-001-SEO-Architecture.md` |
| 7 | Newsletter Architecture | `docs/CONTENT-001-Newsletter-Architecture.md` |
| 8 | Media Library Architecture | `docs/CONTENT-001-Media-Library-Architecture.md` |
| 9 | Public Information Architecture | `docs/CONTENT-001-Public-Information-Architecture.md` |
| 10 | Editorial Experience Architecture | `docs/CONTENT-001-Editorial-Experience-Architecture.md` |
| 11 | Analytics & Attribution Architecture | `docs/CONTENT-001-Analytics-Attribution-Architecture.md` |
| 12 | Content-Product Relationship Architecture | `docs/CONTENT-001-Content-Product-Relationship-Architecture.md` |
| 13 | Content Distribution Architecture | `docs/CONTENT-001-Content-Distribution-Architecture.md` |
| 14 | Content Governance & Security | `docs/CONTENT-001-Content-Governance-Security.md` |
| 15 | Internationalization Architecture | `docs/CONTENT-001-Internationalization-Architecture.md` |
| 16 | AI Assistance Extension Points | `docs/CONTENT-001-AI-Assistance-Extension-Points.md` |
| 17 | Implementation Scope & Roadmap | `docs/CONTENT-001-Implementation-Scope-Roadmap.md` |
| 18 | Architecture Decision Record | `docs/CONTENT-001-Architecture-Decision-Record.md` |
| 19 | Final Architecture Report | (this document) |
| 20 | Dependency Analysis | (included in Implementation Scope & Roadmap, section 7) |

## 12. Conclusion

The ImboniServe Knowledge & Growth Platform architecture is designed. The foundation supports:

1. **Editorial content** with 10 content types, full lifecycle, SEO, and governance
2. **Knowledge foundation** with hierarchical entities and content linking
3. **Signal engine foundation** with manual capture and DemoRequest auto-capture
4. **Evidence layer** with lightweight verification metadata
5. **Newsletter platform** with campaigns, segments, and provider abstraction
6. **Analytics & attribution** with privacy-first provider and UTM tracking
7. **Content-product relationships** via flexible string keys
8. **Multi-channel distribution** with web (NOW) and newsletter (NOW), social (LATER)
9. **AI extension points** for 10 future AI capabilities
10. **Internationalization** with future-proof design for content localization

The architecture **does not overbuild the future** and **does not destroy the future by under-designing the foundation**. It is ready for implementation when the mission reaches that phase.

---

*End of Final Architecture Report*
