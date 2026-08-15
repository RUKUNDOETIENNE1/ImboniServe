# CONTENT-001A — Data Model Contract

> **Mission**: ImboniServe Knowledge & Growth Platform — Implementation Readiness  
> **Document Type**: Implementation-Ready Data Model  
> **Date**: 2025-08-15  
> **Status**: COMPLETE

---

## 1. Purpose

Define the exact Prisma models for Phase A implementation. Every model includes: purpose, fields, relationships, indexes, uniqueness, delete behavior, audit requirements, and phase.

## 2. Phase A Models

### 2.1 EditorialArticle

| Property | Value |
|----------|-------|
| **Purpose** | Core editorial content entity (articles, stories, insights, guides) |
| **Phase** | A |
| **Delete behavior** | No hard delete. Use ARCHIVED status. Admin can delete DRAFT/REJECTED only. |
| **Audit** | ContentTransition records all status changes |

**Fields:**

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| id | String @id | Yes | cuid() | Primary key |
| type | String | Yes | — | Article, FounderStory, IndustryInsight, ProductStory, CaseStudy, Guide, Report, Newsletter, Announcement, Resource |
| title | String | Yes | — | |
| subtitle | String? | No | — | |
| slug | String @unique | Yes | — | URL-safe, auto-generated from title |
| excerpt | String? | No | — | Summary for listings and SEO |
| body | String | Yes | — | Markdown content |
| bodyFormat | String | Yes | "MARKDOWN" | MARKDOWN (Phase A); RICH_TEXT, HTML (future) |
| status | String | Yes | "DRAFT" | DRAFT, REVIEW, APPROVED, SCHEDULED, PUBLISHED, UPDATED, ARCHIVED, REJECTED |
| authorId | String? | No | — | FK to User |
| reviewerId | String? | No | — | FK to User |
| publisherId | String? | No | — | FK to User |
| publishedAt | DateTime? | No | — | Set when transitioning to PUBLISHED |
| scheduledAt | DateTime? | No | — | Set when transitioning to SCHEDULED |
| archivedAt | DateTime? | No | — | Set when transitioning to ARCHIVED |
| coverImageId | String? | No | — | Loose reference to PlatformMediaAsset.id (not Prisma relation) |
| topicId | String? | No | — | FK to Topic |
| tags | String[] | Yes | [] | Denormalized for query speed |
| seoMeta | Json? | No | — | SEO metadata (metaTitle, metaDescription, OG, etc.) |
| metadata | Json? | No | — | Type-specific metadata |
| createdAt | DateTime | Yes | now() | |
| updatedAt | DateTime | Yes | updatedAt | |

**Relationships:**

| Relation | Type | Target | On delete |
|----------|------|--------|-----------|
| author | User? | @relation("AuthoredArticles") | Set null |
| reviewer | User? | @relation("ReviewedArticles") | Set null |
| publisher | User? | @relation("PublishedArticles") | Set null |
| topic | Topic? | @relation | Set null |
| transitions | ContentTransition[] | | Cascade |
| articleTags | ArticleTag[] | | Cascade |
| productLinks | ArticleProductLink[] | | Cascade |

**Indexes:**

| Index | Fields |
|-------|--------|
| @@unique | slug |
| @@index | [status, publishedAt] |
| @@index | [type, status] |
| @@index | [topicId, status] |
| @@index | [publishedAt] |

### 2.2 Topic

| Property | Value |
|----------|-------|
| **Purpose** | Hierarchical content categorization |
| **Phase** | A |
| **Delete behavior** | Soft delete via isActive = false. Hard delete only if no articles linked. |
| **Audit** | No audit trail (admin-managed taxonomy) |

**Fields:**

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| id | String @id | Yes | cuid() | |
| name | String | Yes | — | |
| slug | String @unique | Yes | — | URL-safe, auto-generated |
| description | String? | No | — | |
| parentId | String? | No | — | Self-referencing for hierarchy |
| color | String? | No | — | UI display color |
| icon | String? | No | — | UI display icon name |
| sortOrder | Int | Yes | 0 | |
| isActive | Boolean | Yes | true | |
| createdAt | DateTime | Yes | now() | |
| updatedAt | DateTime | Yes | updatedAt | |

**Relationships:**

| Relation | Type | Target | On delete |
|----------|------|--------|-----------|
| parent | Topic? | @relation("TopicHierarchy") | Set null |
| children | Topic[] | @relation("TopicHierarchy") | |
| articles | EditorialArticle[] | | Set null on article.topicId |

**Indexes:**

| Index | Fields |
|-------|--------|
| @@unique | slug |
| @@index | [parentId, sortOrder] |

### 2.3 Tag

| Property | Value |
|----------|-------|
| **Purpose** | Flexible content labeling |
| **Phase** | A |
| **Delete behavior** | Hard delete allowed (cascade removes ArticleTag joins) |
| **Audit** | No audit trail |

**Fields:**

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| id | String @id | Yes | cuid() | |
| name | String @unique | Yes | — | |
| slug | String @unique | Yes | — | URL-safe, auto-generated |
| description | String? | No | — | |
| createdAt | DateTime | Yes | now() | |

**Relationships:**

| Relation | Type | Target | On delete |
|----------|------|--------|-----------|
| articleTags | ArticleTag[] | | Cascade |

**Indexes:**

| Index | Fields |
|-------|--------|
| @@unique | name |
| @@unique | slug |

### 2.4 ArticleTag

| Property | Value |
|----------|-------|
| **Purpose** | Join table: EditorialArticle ↔ Tag |
| **Phase** | A |
| **Delete behavior** | Cascade delete when article or tag is deleted |
| **Audit** | No |

**Fields:**

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| id | String @id | Yes | cuid() | |
| articleId | String | Yes | — | FK to EditorialArticle |
| tagId | String | Yes | — | FK to Tag |
| createdAt | DateTime | Yes | now() | |

**Relationships:**

| Relation | Type | Target | On delete |
|----------|------|--------|-----------|
| article | EditorialArticle | | Cascade |
| tag | Tag | | Cascade |

**Indexes:**

| Index | Fields |
|-------|--------|
| @@unique | [articleId, tagId] |
| @@index | [tagId] |

### 2.5 ContentTransition

| Property | Value |
|----------|-------|
| **Purpose** | Audit trail for all editorial content state changes |
| **Phase** | A |
| **Delete behavior** | No delete (immutable audit record). Cascade only if article is hard-deleted. |
| **Audit** | This IS the audit trail |

**Fields:**

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| id | String @id | Yes | cuid() | |
| articleId | String | Yes | — | FK to EditorialArticle |
| fromStatus | String | Yes | — | Previous status |
| toStatus | String | Yes | — | New status |
| actorId | String | Yes | — | FK to User (loose, not Prisma relation) |
| note | String? | No | — | Optional transition note |
| createdAt | DateTime | Yes | now() | |

**Relationships:**

| Relation | Type | Target | On delete |
|----------|------|--------|-----------|
| article | EditorialArticle | | Cascade |

**Indexes:**

| Index | Fields |
|-------|--------|
| @@index | [articleId, createdAt] |
| @@index | [toStatus, createdAt] |

### 2.6 PlatformMediaAsset

| Property | Value |
|----------|-------|
| **Purpose** | Platform-level media asset (not business-scoped) |
| **Phase** | A |
| **Delete behavior** | Hard delete allowed (removes DB record; storage file deletion is best-effort) |
| **Audit** | No (uploadedById tracks who uploaded) |

**Fields:**

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| id | String @id | Yes | cuid() | |
| type | String | Yes | — | IMAGE, VIDEO, DOCUMENT, ICON, ILLUSTRATION |
| storageKey | String | Yes | — | Supabase storage key |
| filename | String | Yes | — | Original filename |
| altText | String? | No | — | Accessibility + SEO |
| caption | String? | No | — | Display caption |
| attribution | String? | No | — | Credit/source |
| width | Int? | No | — | |
| height | Int? | No | — | |
| durationSec | Int? | No | — | Video duration |
| thumbnailKey | String? | No | — | |
| sizeBytes | Int | Yes | — | |
| mimeType | String | Yes | — | |
| tags | String[] | Yes | [] | For search/organization |
| usageCount | Int | Yes | 0 | Denormalized counter |
| uploadedById | String? | No | — | FK to User (loose) |
| createdAt | DateTime | Yes | now() | |
| updatedAt | DateTime | Yes | updatedAt | |

**Relationships:** None (loose references only)

**Indexes:**

| Index | Fields |
|-------|--------|
| @@index | [type, createdAt] |

### 2.7 ArticleProductLink

| Property | Value |
|----------|-------|
| **Purpose** | Content ↔ product capability relationships (string key, not FK) |
| **Phase** | A |
| **Delete behavior** | Cascade delete when article is deleted |
| **Audit** | No |

**Fields:**

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| id | String @id | Yes | cuid() | |
| articleId | String | Yes | — | FK to EditorialArticle |
| productKey | String | Yes | — | e.g., "qr-ordering", "inventory" |
| productLabel | String? | No | — | Display override |
| linkType | String | Yes | "MENTIONED" | FEATURED, MENTIONED, COMPARED, TUTORIAL |
| sortOrder | Int | Yes | 0 | |
| createdAt | DateTime | Yes | now() | |

**Relationships:**

| Relation | Type | Target | On delete |
|----------|------|--------|-----------|
| article | EditorialArticle | | Cascade |

**Indexes:**

| Index | Fields |
|-------|--------|
| @@unique | [articleId, productKey] |
| @@index | [productKey] |

### 2.8 ContentEvent

| Property | Value |
|----------|-------|
| **Purpose** | Custom content event tracking (page views, CTA clicks) |
| **Phase** | A |
| **Delete behavior** | Hard delete allowed (analytics data, not permanent) |
| **Audit** | No |

**Fields:**

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| id | String @id | Yes | cuid() | |
| articleId | String? | No | — | Loose reference to EditorialArticle |
| eventType | String | Yes | — | PAGE_VIEW, READ_COMPLETE, SHARE, CTA_CLICK, NEWSLETTER_SIGNUP, DEMO_REQUEST |
| metadata | Json? | No | — | Event-specific data |
| sessionId | String? | No | — | Anonymous session ID |
| utmSource | String? | No | — | |
| utmMedium | String? | No | — | |
| utmCampaign | String? | No | — | |
| refCode | String? | No | — | Referral code |
| createdAt | DateTime | Yes | now() | |

**Relationships:** None (loose references only)

**Indexes:**

| Index | Fields |
|-------|--------|
| @@index | [articleId, eventType, createdAt] |
| @@index | [eventType, createdAt] |
| @@index | [sessionId, createdAt] |

## 3. Phase A Schema Extensions (Additive Fields)

### 3.1 User Extension

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| editorialRoles | String[] | [] | EDITOR, REVIEWER, PUBLISHER |

**Migration**: Add column with default `[]`. No existing users get editorial roles.

### 3.2 NewsletterSubscriber Extension

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| name | String? | null | Subscriber name |
| email | String? | null | Separate email field |
| phone | String? | null | Separate phone field |
| consentAt | DateTime? | null | When consent was given |
| consentSource | String? | null | Where consent was captured |
| preferences | Json? | null | Content preferences |
| lastEngagedAt | DateTime? | null | Last open/click |
| bounceCount | Int | 0 | Email bounce count |
| suppressedAt | DateTime? | null | Suppression timestamp |

**Migration**: Add nullable columns. Existing records have null values. New subscriptions populate new fields.

## 4. Phase B Models (Deferred — Documented for Reference)

| Model | Purpose | Why Deferred |
|-------|---------|-------------|
| KnowledgeEntity | Knowledge graph foundation | No immediate user-facing value in Phase A |
| Signal | Market signal capture | Manual capture has no urgency until editorial operation is running |
| EditorialIdea | Idea pipeline | Editorial workflow is sufficient for Phase A |
| ArticleKnowledgeLink | Content ↔ knowledge | Depends on KnowledgeEntity |
| NewsletterIssue | Newsletter issue metadata | Requires email provider (Phase B) |
| NewsletterCampaign | Delivery tracking | Requires email provider |
| NewsletterSegment | Subscriber segmentation | Requires campaign model |
| NewsletterSubscriberSegment | Subscriber ↔ segment join | Depends on segment |
| ContentRevision | Immutable revision history | Nice-to-have, not blocking editorial operation |
| RelatedArticle | Content ↔ content | Nice-to-have, not blocking |
| Narrative | Strategic narrative | Foundation-only, no immediate value |
| ArticleNarrativeLink | Content ↔ narrative | Depends on Narrative |

## 5. User Model Relations (Phase A)

The User model needs three new relation fields for editorial article relationships:

```prisma
// ADD to User model:
authoredArticles    EditorialArticle[] @relation("AuthoredArticles")
reviewedArticles    EditorialArticle[] @relation("ReviewedArticles")
publishedArticles   EditorialArticle[] @relation("PublishedArticles")
```

These are reverse relations from EditorialArticle.authorId/reviewerId/publisherId.

## 6. Prisma Schema Snippet (Phase A)

```prisma
// ============ EDITORIAL CONTENT MODELS (Phase A) ============

model EditorialArticle {
  id            String   @id @default(cuid())
  type          String
  title         String
  subtitle      String?
  slug          String   @unique
  excerpt       String?
  body          String
  bodyFormat    String   @default("MARKDOWN")
  status        String   @default("DRAFT")
  authorId      String?
  reviewerId    String?
  publisherId   String?
  publishedAt   DateTime?
  scheduledAt   DateTime?
  archivedAt    DateTime?
  coverImageId  String?
  topicId       String?
  tags          String[]
  seoMeta       Json?
  metadata      Json?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  author        User?              @relation("AuthoredArticles", fields: [authorId], references: [id])
  reviewer      User?              @relation("ReviewedArticles", fields: [reviewerId], references: [id])
  publisher     User?              @relation("PublishedArticles", fields: [publisherId], references: [id])
  topic         Topic?             @relation(fields: [topicId], references: [id])
  transitions   ContentTransition[]
  articleTags   ArticleTag[]
  productLinks  ArticleProductLink[]

  @@index([status, publishedAt])
  @@index([type, status])
  @@index([topicId, status])
  @@index([publishedAt])
}

model Topic {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  parentId    String?
  color       String?
  icon        String?
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  parent      Topic?   @relation("TopicHierarchy", fields: [parentId], references: [id])
  children    Topic[]  @relation("TopicHierarchy")
  articles    EditorialArticle[]

  @@index([parentId, sortOrder])
}

model Tag {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  description String?
  createdAt   DateTime @default(now())

  articleTags ArticleTag[]
}

model ArticleTag {
  id        String   @id @default(cuid())
  articleId String
  tagId     String
  createdAt DateTime @default(now())

  article   EditorialArticle @relation(fields: [articleId], references: [id], onDelete: Cascade)
  tag       Tag              @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@unique([articleId, tagId])
  @@index([tagId])
}

model ContentTransition {
  id         String   @id @default(cuid())
  articleId  String
  fromStatus String
  toStatus   String
  actorId    String
  note       String?
  createdAt  DateTime @default(now())

  article    EditorialArticle @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@index([articleId, createdAt])
  @@index([toStatus, createdAt])
}

model PlatformMediaAsset {
  id            String   @id @default(cuid())
  type          String
  storageKey    String
  filename      String
  altText       String?
  caption       String?
  attribution   String?
  width         Int?
  height        Int?
  durationSec   Int?
  thumbnailKey  String?
  sizeBytes     Int
  mimeType      String
  tags          String[]
  usageCount    Int      @default(0)
  uploadedById  String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([type, createdAt])
}

model ArticleProductLink {
  id           String   @id @default(cuid())
  articleId    String
  productKey   String
  productLabel String?
  linkType     String   @default("MENTIONED")
  sortOrder    Int      @default(0)
  createdAt    DateTime @default(now())

  article      EditorialArticle @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@unique([articleId, productKey])
  @@index([productKey])
}

model ContentEvent {
  id          String   @id @default(cuid())
  articleId   String?
  eventType   String
  metadata    Json?
  sessionId   String?
  utmSource   String?
  utmMedium   String?
  utmCampaign String?
  refCode     String?
  createdAt   DateTime @default(now())

  @@index([articleId, eventType, createdAt])
  @@index([eventType, createdAt])
  @@index([sessionId, createdAt])
}
```

## 7. User Model Extension Snippet

```prisma
// ADD to existing User model:
editorialRoles      String[]            @default([])
authoredArticles    EditorialArticle[]  @relation("AuthoredArticles")
reviewedArticles    EditorialArticle[]  @relation("ReviewedArticles")
publishedArticles   EditorialArticle[]  @relation("PublishedArticles")
```

## 8. NewsletterSubscriber Extension Snippet

```prisma
// ADD to existing NewsletterSubscriber model:
name           String?
email          String?
phone          String?
consentAt      DateTime?
consentSource  String?
preferences    Json?
lastEngagedAt  DateTime?
bounceCount    Int       @default(0)
suppressedAt   DateTime?
```

---

*End of Data Model Contract*
