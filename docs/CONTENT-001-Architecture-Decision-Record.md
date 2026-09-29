# CONTENT-001 — Architecture Decision Record

> **Mission**: ImboniServe Knowledge & Growth Platform  
> **Document Type**: Architecture Decision Record (ADR)  
> **Date**: 2025-01-20  
> **Status**: COMPLETE

---

## 1. Purpose

Record the major architectural decisions made during the CONTENT-001 design phase, with rationale, alternatives considered, and consequences.

---

## ADR-001: Separate Editorial Content from Business-Scoped CMS

**Date**: 2025-01-20  
**Status**: ACCEPTED

### Context
The repository contains an existing CMS (ContentPost, MediaAsset) that is business-scoped and designed for the Discovery Feed (MICROBLOG, PHOTO, SHORT_VIDEO, PROMO, COMBO). The Knowledge & Growth Platform needs platform-level editorial content (articles, guides, insights, stories).

### Decision
Create new editorial content models (EditorialArticle, PlatformMediaAsset) separate from existing ContentPost/MediaAsset. Do not extend ContentPost.

### Rationale
- ContentPost is business-scoped (`businessId` required) — editorial content is platform-level
- ContentPost types are micro-content (MICROBLOG, PHOTO, etc.) — editorial content types are long-form (Article, Guide, etc.)
- ContentPost has no SEO metadata, no slug, no editorial workflow — editorial content needs all of these
- Extending ContentPost would require breaking changes to existing functionality
- Keeping them separate preserves the existing Discovery Feed without risk

### Alternatives Considered
1. **Extend ContentPost with new types** — rejected: different scope, different lifecycle, different governance
2. **Add `businessId = null` for platform content** — rejected: violates business isolation invariant, confusing semantics
3. **Single unified content model with type discriminator** — rejected: too complex, different fields needed per use case

### Consequences
- Two content systems in the codebase (existing CMS + new editorial)
- No shared content table — some code duplication
- Clear separation of concerns — editorial content and business content are independent

---

## ADR-002: Content Type as String, Not Enum

**Date**: 2025-01-20  
**Status**: ACCEPTED

### Context
Editorial content has multiple types (Article, FounderStory, IndustryInsight, ProductStory, CaseStudy, Guide, Report, Newsletter, Announcement, Resource). New types may be needed in the future.

### Decision
Store content type as a `String` field with application-level validation, not a Prisma enum.

### Rationale
- Adding new content types should not require a database migration
- Prisma enums require schema changes and migrations
- String fields with validation provide the same type safety at the application layer
- Content type drives UI templates and defaults, not storage structure

### Alternatives Considered
1. **Prisma enum** — rejected: requires migration for new types
2. **Separate table for content types** — rejected: over-engineered for a finite set

### Consequences
- Type validation must be done at the application layer (service validation)
- No database-level type safety for content type
- Easy to add new types without migration

---

## ADR-003: Product References via String Keys, Not Foreign Keys

**Date**: 2025-01-20  
**Status**: ACCEPTED

### Context
Editorial content references ImboniServe product features (QR ordering, inventory, analytics, etc.). These features may not have database representations — they are conceptual product capabilities.

### Decision
Use `productKey` (String) in `ArticleProductLink` to reference products, not a foreign key to a product table. Maintain a configuration file (`src/config/product-keys.ts`) as a lightweight registry.

### Rationale
- Product features are not database entities — they are conceptual capabilities
- Hardcoding FK relationships would couple content to product schema
- String keys allow referencing features that exist only as configuration
- New product references can be added without migration
- Prevents the need for a product table that duplicates feature page content

### Alternatives Considered
1. **FK to a Product table** — rejected: products don't have database records; would require creating a product table
2. **Store product references in metadata Json** — rejected: harder to query, no uniqueness constraint

### Consequences
- No referential integrity for product references (unknown keys are displayed as-is)
- Product key registry must be maintained manually
- Easy to add new product references without migration

---

## ADR-004: Newsletter Issue as EditorialArticle

**Date**: 2025-01-20  
**Status**: ACCEPTED

### Context
Newsletter issues are editorial content that goes through an editorial workflow, has SEO metadata (archive page), and has additional newsletter-specific metadata (subject line, segment, send tracking).

### Decision
A newsletter issue is an `EditorialArticle` with `type: "Newsletter"`, linked 1:1 to a `NewsletterIssue` record for newsletter-specific metadata.

### Rationale
- Newsletter issues need the same editorial workflow as articles
- Newsletter issues need SEO metadata for the archive page
- Newsletter issues can be related to other content (topics, tags, knowledge)
- Avoids a separate content system for newsletters
- 1:1 relationship with NewsletterIssue adds only newsletter-specific fields

### Alternatives Considered
1. **Separate NewsletterIssue model with its own body field** — rejected: duplicates editorial workflow, SEO, governance
2. **NewsletterIssue as a standalone model without EditorialArticle** — rejected: loses workflow, SEO, relationships

### Consequences
- Newsletter issues inherit all EditorialArticle capabilities (workflow, SEO, topics, tags)
- NewsletterIssue adds newsletter-specific fields (issue number, subject line, send tracking)
- One query needed to get both article and issue metadata (1:1 join)

---

## ADR-005: Email Provider Abstraction

**Date**: 2025-01-20  
**Status**: ACCEPTED

### Context
Newsletter campaigns need email delivery. No email provider is currently integrated. The architecture must not assume a specific provider.

### Decision
Define an `EmailProvider` interface with methods for sending campaigns and tracking delivery. Implement a logging provider for development. Production provider is a deployment configuration decision.

### Rationale
- Different deployment environments may use different providers
- Provider selection depends on cost, deliverability, and regional availability
- Avoiding vendor lock-in
- Allows testing without a real email provider

### Alternatives Considered
1. **Hardcode SendGrid** — rejected: vendor lock-in, may not be best for Rwanda/East Africa
2. **Build custom email sending** — rejected: SMTP delivery is unreliable, not core competency

### Consequences
- Provider must be implemented before production newsletter sending
- Provider selection is a deployment decision, not an architecture decision
- Interface must be stable to support multiple providers

---

## ADR-006: SEO Metadata as Json, Not Separate Model

**Date**: 2025-01-20  
**Status**: ACCEPTED

### Context
Each editorial article needs SEO metadata (meta title, meta description, OG tags, structured data, etc.). This metadata is article-specific.

### Decision
Store SEO metadata as a Json field (`seoMeta`) on EditorialArticle, not as a separate model.

### Rationale
- SEO metadata is 1:1 with article — no need for a separate table
- Json field allows flexible metadata structure without schema changes
- SEO metadata is read with the article (no extra query)
- Different content types may need different SEO metadata structures

### Alternatives Considered
1. **Separate SeoMeta model with FK** — rejected: unnecessary 1:1 table, extra query
2. **Individual columns for each SEO field** — rejected: rigid, requires migration for new fields

### Consequences
- No database-level validation of SEO metadata structure
- Application layer must validate SEO metadata
- Flexible — can add new SEO fields without migration

---

## ADR-007: Content Truth as Json Metadata, Not Evidence Platform

**Date**: 2025-01-20  
**Status**: ACCEPTED

### Context
Editorial content makes claims that should be verifiable. The system needs to track verification levels and evidence references without building a scientific citation platform.

### Decision
Store content truth/evidence as a Json field (`contentTruth`) on EditorialArticle with a lightweight structure of claims, verification levels, and evidence references.

### Rationale
- A full evidence management system is over-engineered for NOW
- Claims and evidence are article-specific (1:1)
- Json structure is flexible enough for future enhancement
- Verification levels are a controlled vocabulary, not a complex taxonomy

### Alternatives Considered
1. **Separate Claim and Evidence models with FKs** — rejected: over-engineered for NOW, adds query complexity
2. **No content truth tracking** — rejected: loses future capability for evidence-based content

### Consequences
- No database-level validation of claim/evidence structure
- Application layer must validate content truth metadata
- Can evolve to separate models in LATER if needed

---

## ADR-008: Knowledge Entity as Flat Model with Hierarchy

**Date**: 2025-01-20  
**Status**: ACCEPTED

### Context
The knowledge model needs to represent problems, questions, concepts, capabilities, roles, business types, and topics with hierarchical relationships.

### Decision
Use a single `KnowledgeEntity` model with `type` (String) and `parentId` (self-referencing) for hierarchy. No graph database.

### Rationale
- A graph database is over-engineered for NOW (foundation only)
- Self-referencing parent/child is sufficient for hierarchical relationships
- Single model with type discriminator is simpler than multiple models
- String type allows adding new entity types without migration

### Alternatives Considered
1. **Separate models per knowledge type** — rejected: too many models, similar fields
2. **Graph database (Neo4j, etc.)** — rejected: over-engineered, not needed for foundation
3. **Prisma relation table for arbitrary relationships** — rejected: premature complexity

### Consequences
- Only parent/child relationships (no arbitrary graph edges)
- No graph traversal queries
- Can evolve to graph database in LONG-TERM if needed
- Simple admin UI for managing knowledge entities

---

## ADR-009: Signal Capture as Manual + DemoRequest Auto-Capture

**Date**: 2025-01-20  
**Status**: ACCEPTED

### Context
The signal engine needs to capture market signals from various sources. Automated capture from all sources is not feasible for NOW.

### Decision
Manual signal entry via admin UI for most sources. Auto-capture from DemoRequest (existing data → signal). No automated capture from support chat, sales calls, or social media for NOW.

### Rationale
- Automated capture from chat/calls requires integrations that don't exist yet
- DemoRequest is an existing data source with structured fields
- Manual entry is sufficient for foundation — editors can capture signals from any source
- Signal → Idea → Article pipeline is the key workflow, not the capture mechanism

### Alternatives Considered
1. **No signal capture for NOW** — rejected: loses foundation for signal engine
2. **Full automated capture from all sources** — rejected: integrations don't exist, over-engineered

### Consequences
- Signal capture is manual (editor effort required)
- DemoRequest auto-capture provides some automated signals
- Can add automated capture from other sources in LATER

---

## ADR-010: Privacy-First Analytics (Plausible) Over Google Analytics

**Date**: 2025-01-20  
**Status**: ACCEPTED

### Context
The platform needs web analytics for content performance tracking. No analytics provider is currently integrated.

### Decision
Recommend Plausible Analytics as the primary analytics provider. Architecture supports GA4 as an alternative. Provider is configurable via environment variables.

### Rationale
- Plausible is privacy-first (no cookies, no PII, GDPR-friendly)
- Lightweight script (1KB) vs GA4 (45KB+)
- Simple, actionable metrics
- Open-source, self-hostable option
- Better for Rwanda/East Africa (no cookie consent complexity)

### Alternatives Considered
1. **Google Analytics 4** — rejected as default: heavy, cookie-heavy, complex
2. **Fathom** — viable alternative, similar to Plausible
3. **Custom analytics** — rejected: not core competency, reinventing the wheel

### Consequences
- Analytics provider is a deployment configuration decision
- Architecture supports both Plausible and GA4
- Privacy-first approach aligns with platform values

---

## ADR-011: Dynamic Sitemap, Not Static

**Date**: 2025-01-20  
**Status**: ACCEPTED

### Context
The existing sitemap is static with 10 hardcoded URLs. Editorial content needs dynamic sitemap entries.

### Decision
Replace static sitemap with a dynamic sitemap index that generates sitemaps from published content on each request.

### Rationale
- Static sitemap cannot accommodate content URLs
- Dynamic sitemap reflects current published content
- Sitemap index allows splitting by content type for scalability
- Server-side generation ensures freshness

### Alternatives Considered
1. **Static sitemap with manual updates** — rejected: doesn't scale, error-prone
2. **Build-time sitemap generation** — rejected: requires rebuild for new content
3. **Cached dynamic sitemap** — deferred to NEXT (add 1-hour cache)

### Consequences
- Sitemap generation on every request (add caching in NEXT)
- Server-side processing required
- Always reflects current published content

---

## ADR-012: Reuse Existing Infrastructure, Extend Where Needed

**Date**: 2025-01-20  
**Status**: ACCEPTED

### Context
The repository has existing infrastructure (StorageService, FeatureFlagService, NewsletterService, PublicLayout, auth, i18n, middleware) that can be reused or extended.

### Decision
Reuse existing infrastructure wherever possible. Extend with additive changes only. Do not rebuild working functionality.

### Rationale
- Existing infrastructure is tested and working
- Rebuilding is wasteful and risky
- Additive changes preserve existing functionality
- Consistent codebase patterns

### Alternatives Considered
1. **Build everything new** — rejected: wasteful, risky, inconsistent
2. **Refactor existing infrastructure** — rejected: unnecessary risk, no clear benefit

### Consequences
- Editorial content system uses same patterns as existing code
- Some existing models get additive fields (NewsletterSubscriber, User, DemoRequest)
- No breaking changes to existing functionality

---

*End of Architecture Decision Record*
