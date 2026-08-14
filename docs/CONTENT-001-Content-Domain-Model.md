# CONTENT-001 — Content Domain Model

> **Mission**: ImboniServe Knowledge & Growth Platform  
> **Document Type**: Content Domain Model  
> **Date**: 2025-01-20  
> **Status**: COMPLETE

---

## 1. Purpose

Define the content domain model for the ImboniServe Knowledge & Growth Platform. This is the conceptual model — what entities exist, how they relate, what lifecycle they follow. The physical data model is documented separately in `CONTENT-001-Content-Data-Model.md`.

## 2. Core Principle

**Content is a first-class platform entity, not a business-scoped feature.** Editorial content is created by platform editors, published on the public website, and governed by an editorial workflow. It is fundamentally different from the existing business-scoped ContentPost (Discovery Feed micro-content).

## 3. Content Types

| Type | Purpose | Example |
|------|---------|---------|
| **Article** | Standard editorial content | "How QR ordering reduces wait times by 40%" |
| **FounderStory** | Narrative content about ImboniServe's journey | "Why we built ImboniServe for Rwanda" |
| **IndustryInsight** | Analysis of hospitality industry trends | "The rise of mobile-first dining in East Africa" |
| **ProductStory** | Content about ImboniServe features/capabilities | "Inside Smart Dining Slips™" |
| **CaseStudy** | Customer success stories | "How Restaurant X doubled revenue with ImboniServe" |
| **Guide** | How-to and educational content | "Complete guide to inventory management for restaurants" |
| **Report** | Data-driven reports and analysis | "State of Hospitality Tech in Rwanda 2025" |
| **Newsletter** | Newsletter issue as first-class content | "ImboniServe Weekly — Issue #12" |
| **Announcement** | Product updates, news | "ImboniServe now supports Airtel Money" |
| **Resource** | Downloadable resources, templates, tools | "Restaurant inventory template" |

### Design Notes
- Content types are **not hardcoded into business logic** — they drive UI templates and default metadata, not content storage structure
- New types can be added without schema migration (type is a string field with validation)
- Each type may have type-specific metadata via a flexible `metadata` Json field
- The set of types is intentionally finite but extensible

## 4. Content Lifecycle

```
IDEA → DRAFT → REVIEW → APPROVED → SCHEDULED → PUBLISHED → UPDATED → ARCHIVED
                    ↓                                          ↑
                REJECTED ←──────────────────────────────────────┘
```

| State | Meaning | Who Can Transition |
|-------|---------|-------------------|
| **IDEA** | Captured idea, not yet drafted | Editor → DRAFT |
| **DRAFT** | Being written | Editor → REVIEW, ARCHIVED |
| **REVIEW** | Submitted for editorial review | Reviewer → APPROVED, REJECTED |
| **APPROVED** | Approved, ready to schedule/publish | Publisher → SCHEDULED, PUBLISHED |
| **SCHEDULED** | Scheduled for future publication | System → PUBLISHED (at publishAt) |
| **PUBLISHED** | Live on public website | Editor → UPDATED, ARCHIVED |
| **UPDATED** | Published content being updated | Editor → PUBLISHED (republish) |
| **REJECTED** | Rejected during review | Editor → DRAFT (revise) |
| **ARCHIVED** | No longer public | Editor → DRAFT (revive) |

### Lifecycle Rules
- Only PUBLISHED content appears on public pages and sitemap
- SCHEDULED content auto-transitions to PUBLISHED via cron job
- ARCHIVED content returns 410 Gone (not 404) if URL accessed
- State transitions are auditable (who, when, from, to)

## 5. Content Entity Model

### 5.1 EditorialArticle (Core Content Entity)

```
EditorialArticle
├── id: String (cuid)
├── type: String (Article | FounderStory | IndustryInsight | ...)
├── title: String
├── subtitle: String?
├── slug: String (unique, URL-safe)
├── excerpt: String? (summary for listings and SEO)
├── body: Text (Markdown or rich text)
├── bodyFormat: String (MARKDOWN | RICH_TEXT | HTML)
├── status: String (lifecycle state)
├── authorId: String? (FK to User)
├── reviewerId: String? (FK to User)
├── publisherId: String? (FK to User)
├── publishedAt: DateTime?
├── updatedAt: DateTime?
├── scheduledAt: DateTime?
├── archivedAt: DateTime?
├── coverImageId: String? (FK to PlatformMediaAsset)
├── topicId: String? (FK to Topic)
├── tags: String[] (flexible tagging)
├── metadata: Json (type-specific metadata)
├── seoMeta: Json (SEO metadata — see SEO Architecture)
├── contentTruth: Json (evidence/verification metadata — see Evidence Model)
├── distributionMeta: Json (channel-specific metadata — see Distribution Architecture)
├── analyticsMeta: Json (UTM, campaign tracking — see Analytics Architecture)
├── createdAt: DateTime
├── updatedAt: DateTime
```

### 5.2 Topic (Categorization)

```
Topic
├── id: String
├── name: String
├── slug: String (unique)
├── description: String?
├── parentId: String? (self-referencing for hierarchy)
├── color: String? (UI display)
├── icon: String? (UI display)
├── sortOrder: Int
├── articleCount: Int (denormalized)
├── createdAt: DateTime
├── updatedAt: DateTime
```

### 5.3 Tag (Flexible Labeling)

```
Tag
├── id: String
├── name: String (unique)
├── slug: String (unique)
├── description: String?
├── usageCount: Int (denormalized)
├── createdAt: DateTime
```

### 5.4 ArticleTag (Join)

```
ArticleTag
├── id: String
├── articleId: String (FK to EditorialArticle)
├── tagId: String (FK to Tag)
├── createdAt: DateTime
├── @@unique([articleId, tagId])
```

### 5.5 ContentRevision (Versioning — NEXT Phase)

```
ContentRevision
├── id: String
├── articleId: String (FK to EditorialArticle)
├── revisionNumber: Int
├── title: String
├── body: Text
├── changedById: String (FK to User)
├── changeSummary: String?
├── createdAt: DateTime
```

### 5.6 ContentTransition (Audit Trail)

```
ContentTransition
├── id: String
├── articleId: String (FK to EditorialArticle)
├── fromStatus: String
├── toStatus: String
├── actorId: String (FK to User)
├── note: String?
├── createdAt: DateTime
```

## 6. Content Governance Model

### 6.1 Editorial Roles

| Role | Permissions |
|------|------------|
| **EDITOR** | Create, edit, submit for review, archive own content |
| **REVIEWER** | All EDITOR permissions + review/approve/reject content |
| **PUBLISHER** | All REVIEWER permissions + schedule/publish content |
| **ADMIN** | All permissions + manage topics, tags, media, settings |

### 6.2 Role Assignment
- Editorial roles are **additional roles** on the User model, not replacements for existing business roles
- A user can be both a business MANAGER and a platform EDITOR
- Editorial roles are checked via a `editorialRoles` field on User (separate from `roles`)

### 6.3 Approval Flow
1. EDITOR creates content → status: DRAFT
2. EDITOR submits for review → status: REVIEW
3. REVIEWER reviews → status: APPROVED or REJECTED
4. PUBLISHER schedules or publishes → status: SCHEDULED or PUBLISHED
5. System auto-publishes scheduled content at `scheduledAt`

**Self-publish shortcut**: ADMIN can skip review (DRAFT → PUBLISHED directly).

## 7. Content Relationships

### 7.1 Content ↔ Content (Related Articles)

```
RelatedArticle
├── id: String
├── articleId: String (FK to EditorialArticle)
├── relatedArticleId: String (FK to EditorialArticle)
├── relationshipType: String (RELATED | SERIES | CONTINUATION | RESPONSE)
├── sortOrder: Int
├── createdAt: DateTime
├── @@unique([articleId, relatedArticleId])
```

### 7.2 Content ↔ Product (Flexible — see Content-Product Relationship Architecture)

```
ArticleProductLink
├── id: String
├── articleId: String (FK to EditorialArticle)
├── productKey: String (e.g., "qr-ordering", "inventory", "analytics")
├── productLabel: String? (display override)
├── linkType: String (FEATURED | MENTIONED | COMPARED | TUTORIAL)
├── sortOrder: Int
├── createdAt: DateTime
├── @@unique([articleId, productKey])
```

**Critical**: `productKey` is a string, not a FK to a product table. This avoids hardcoding product names and allows flexible referencing without coupling content to product schema.

### 7.3 Content ↔ Knowledge (Foundation — see Knowledge & Signal Model)

```
ArticleKnowledgeLink
├── id: String
├── articleId: String (FK to EditorialArticle)
├── knowledgeEntityId: String (FK to KnowledgeEntity)
├── linkType: String (ADDRESSES | EXPLAINS | DEMONSTRATES | REFERENCES)
├── createdAt: DateTime
```

## 8. Newsletter as First-Class Content

A Newsletter issue is an EditorialArticle with `type: "Newsletter"`. This means:
- Newsletter issues go through the same editorial workflow
- Newsletter issues have SEO metadata (archive page)
- Newsletter issues have topics and tags
- Newsletter issues can be related to other content
- Newsletter issues have distribution metadata (subscriber segments, send time)

**Additional Newsletter-specific models** (see Newsletter Architecture):
- NewsletterIssue (extends EditorialArticle with issue number, subject line, send metadata)
- NewsletterCampaign (delivery tracking per send)

## 9. Content Distribution Model

Content is authored once and distributed to multiple channels:

| Channel | Status | Distribution Mechanism |
|---------|--------|----------------------|
| **Web** | NOW | Public pages with SEO |
| **Newsletter** | NOW | Email campaign with subscriber list |
| **LinkedIn** | LATER | Social distribution with platform-specific metadata |
| **X/Twitter** | LATER | Social distribution |
| **Facebook** | LATER | Social distribution |
| **Instagram** | LATER | Social distribution |
| **YouTube** | LATER | Video content distribution |
| **WhatsApp** | LATER | WhatsApp channel/status distribution |

**Distribution metadata** is stored per-article in `distributionMeta` Json field:
```json
{
  "channels": ["web", "newsletter"],
  "newsletter": { "issueNumber": 12, "subjectLine": "..." },
  "social": { "linkedin": { "scheduledAt": "...", "customText": "..." } }
}
```

## 10. Design Invariants

1. **Editorial content is platform-level** — no `businessId` field on EditorialArticle
2. **Content type is a string, not an enum** — extensible without migration
3. **Slug is unique** — one canonical URL per content
4. **Only PUBLISHED content is public** — all other statuses are admin-only
5. **All state transitions are auditable** — ContentTransition records
6. **Content ↔ product links use string keys** — no FK to product tables
7. **Newsletter issues are EditorialArticles** — not a separate content system
8. **Tags are global** — not per-article; reusable across all content
9. **Topics are hierarchical** — parent/child for navigation depth
10. **Revisions are immutable** — once created, a revision's content cannot change

---

*End of Content Domain Model*
