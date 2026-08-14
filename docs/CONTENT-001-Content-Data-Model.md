# CONTENT-001 — Content Data Model

> **Mission**: ImboniServe Knowledge & Growth Platform  
> **Document Type**: Prisma Schema Design  
> **Date**: 2025-01-20  
> **Status**: COMPLETE

---

## 1. Purpose

Define the physical Prisma data model for the editorial content system. This is the concrete schema that would be added to `prisma/schema.prisma` when implementation begins. All models are **additive** — they do not modify existing models.

## 2. Schema Design Principles

1. **Additive only** — no changes to existing models (ContentPost, MediaAsset, etc.)
2. **Platform-scoped** — no `businessId` on editorial models
3. **String-based enums** — use `String` with validation, not Prisma enums, for extensibility
4. **Json for flexible metadata** — type-specific, channel-specific, SEO-specific metadata
5. **Soft deletes via status** — ARCHIVED, not deleted
6. **Audit trail** — ContentTransition for all state changes
7. **Indexed for query patterns** — slug lookup, status+publishedAt, topic filtering

## 3. Editorial Content Models

### 3.1 EditorialArticle

```prisma
/// Platform-level editorial content (articles, guides, insights, stories, etc.)
/// Separate from business-scoped ContentPost (Discovery Feed)
model EditorialArticle {
  id              String    @id @default(cuid())
  type            String    // Article | FounderStory | IndustryInsight | ProductStory | CaseStudy | Guide | Report | Newsletter | Announcement | Resource
  title           String
  subtitle        String?
  slug            String    @unique
  excerpt         String?   // Summary for listings and SEO
  body            String    // Markdown or rich text content
  bodyFormat      String    @default("MARKDOWN") // MARKDOWN | RICH_TEXT | HTML
  status          String    @default("DRAFT") // IDEA | DRAFT | REVIEW | APPROVED | SCHEDULED | PUBLISHED | UPDATED | REJECTED | ARCHIVED
  authorId        String?
  reviewerId      String?
  publisherId     String?
  publishedAt     DateTime?
  scheduledAt     DateTime?
  archivedAt      DateTime?
  coverImageId    String?   // FK to PlatformMediaAsset (loose reference, not Prisma relation)
  topicId         String?   // FK to Topic
  tags            String[]  // Flexible tagging (denormalized for query speed)
  metadata        Json?     // Type-specific metadata
  seoMeta         Json?     // SEO metadata (slug override, meta title, etc.)
  contentTruth    Json?     // Evidence/verification metadata
  distributionMeta Json?    // Channel-specific distribution metadata
  analyticsMeta   Json?     // UTM, campaign tracking metadata
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  author          User?     @relation("AuthoredArticles", fields: [authorId], references: [id])
  reviewer        User?     @relation("ReviewedArticles", fields: [reviewerId], references: [id])
  publisher       User?     @relation("PublishedArticles", fields: [publisherId], references: [id])
  topic           Topic?    @relation(fields: [topicId], references: [id])
  revisions       ContentRevision[]
  transitions     ContentTransition[]
  articleTags     ArticleTag[]
  relatedArticles RelatedArticle[]
  productLinks    ArticleProductLink[]
  knowledgeLinks  ArticleKnowledgeLink[]

  @@index([status, publishedAt])
  @@index([type, status])
  @@index([topicId, status])
  @@index([publishedAt])
  @@index([slug])
}
```

### 3.2 Topic

```prisma
/// Hierarchical content categorization
model Topic {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  parentId    String?  // Self-referencing for hierarchy
  color       String?  // UI display color
  icon        String?  // UI display icon name
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  parent      Topic?      @relation("TopicHierarchy", fields: [parentId], references: [id])
  children    Topic[]     @relation("TopicHierarchy")
  articles    EditorialArticle[]

  @@index([parentId, sortOrder])
  @@index([slug])
}
```

### 3.3 Tag

```prisma
/// Flexible content labeling (global, reusable)
model Tag {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  description String?
  createdAt   DateTime @default(now())

  // Relations
  articleTags ArticleTag[]

  @@index([slug])
}
```

### 3.4 ArticleTag

```prisma
/// Join table: EditorialArticle ↔ Tag
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
```

### 3.5 ContentRevision

```prisma
/// Immutable revision history for editorial content
model ContentRevision {
  id             String   @id @default(cuid())
  articleId      String
  revisionNumber Int
  title          String
  subtitle       String?
  excerpt        String?
  body           String
  bodyFormat     String
  changedById    String
  changeSummary  String?
  createdAt      DateTime @default(now())

  article        EditorialArticle @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@unique([articleId, revisionNumber])
  @@index([articleId, revisionNumber])
}
```

### 3.6 ContentTransition

```prisma
/// Audit trail for all content state transitions
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
```

### 3.7 RelatedArticle

```prisma
/// Content ↔ Content relationships
model RelatedArticle {
  id                String   @id @default(cuid())
  articleId         String
  relatedArticleId  String
  relationshipType  String   @default("RELATED") // RELATED | SERIES | CONTINUATION | RESPONSE
  sortOrder         Int      @default(0)
  createdAt         DateTime @default(now())

  @@unique([articleId, relatedArticleId])
  @@index([articleId, sortOrder])
}
```

### 3.8 ArticleProductLink

```prisma
/// Flexible content ↔ product relationships (string key, not FK)
model ArticleProductLink {
  id          String   @id @default(cuid())
  articleId   String
  productKey  String   // e.g., "qr-ordering", "inventory", "analytics" — NOT a FK
  productLabel String? // Display override
  linkType    String   @default("MENTIONED") // FEATURED | MENTIONED | COMPARED | TUTORIAL
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())

  article     EditorialArticle @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@unique([articleId, productKey])
  @@index([productKey])
}
```

### 3.9 ArticleKnowledgeLink

```prisma
/// Content ↔ Knowledge entity relationships
model ArticleKnowledgeLink {
  id                String   @id @default(cuid())
  articleId         String
  knowledgeEntityId String
  linkType          String   @default("REFERENCES") // ADDRESSES | EXPLAINS | DEMONSTRATES | REFERENCES
  createdAt         DateTime @default(now())

  article           EditorialArticle @relation(fields: [articleId], references: [id], onDelete: Cascade)
  knowledgeEntity   KnowledgeEntity  @relation(fields: [knowledgeEntityId], references: [id], onDelete: Cascade)

  @@unique([articleId, knowledgeEntityId])
  @@index([knowledgeEntityId])
}
```

## 4. Platform Media Library Models

### 4.1 PlatformMediaAsset

```prisma
/// Platform-level media asset (not business-scoped)
/// Separate from business-scoped MediaAsset
model PlatformMediaAsset {
  id            String   @id @default(cuid())
  type          String   // IMAGE | VIDEO | DOCUMENT | ICON | ILLUSTRATION
  storageKey    String
  filename      String
  altText       String?
  caption       String?
  attribution   String?  // Credit/source
  width         Int?
  height        Int?
  durationSec   Int?
  thumbnailKey  String?
  sizeBytes     Int
  mimeType      String
  tags          String[] // For search/organization
  metadata      Json?    // Additional metadata (EXIF, color palette, etc.)
  usageCount    Int      @default(0) // Denormalized usage counter
  uploadedById  String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([type, createdAt])
  @@index([tags])
}
```

## 5. Newsletter Extension Models

### 5.1 NewsletterIssue

```prisma
/// Newsletter issue metadata (extends EditorialArticle with type: "Newsletter")
model NewsletterIssue {
  id           String   @id @default(cuid())
  articleId    String   @unique // FK to EditorialArticle (1:1)
  issueNumber  Int      // Sequential issue number
  subjectLine  String   // Email subject line
  preheader    String?  // Preview text
  segmentId    String?  // FK to NewsletterSegment (target audience)
  sentAt       DateTime?
  sentCount    Int      @default(0)
  openCount    Int      @default(0)
  clickCount   Int      @default(0)
  bounceCount  Int      @default(0)
  unsubscribeCount Int  @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([issueNumber])
  @@index([sentAt])
}
```

### 5.2 NewsletterSegment

```prisma
/// Subscriber segmentation for targeted campaigns
model NewsletterSegment {
  id          String   @id @default(cuid())
  name        String
  description String?
  rules       Json     // Segmentation rules (source, tags, preferences, etc.)
  subscriberCount Int  @default(0) // Denormalized
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  issues      NewsletterIssue[]
  subscriberSegments NewsletterSubscriberSegment[]

  @@index([isActive])
}
```

### 5.3 NewsletterSubscriberSegment

```prisma
/// Join: NewsletterSubscriber ↔ NewsletterSegment
model NewsletterSubscriberSegment {
  id           String   @id @default(cuid())
  subscriberId String
  segmentId    String
  addedAt      DateTime @default(now())

  subscriber   NewsletterSubscriber @relation(fields: [subscriberId], references: [id], onDelete: Cascade)
  segment      NewsletterSegment    @relation(fields: [segmentId], references: [id], onDelete: Cascade)

  @@unique([subscriberId, segmentId])
}
```

### 5.4 NewsletterCampaign

```prisma
/// Delivery tracking for newsletter sends
model NewsletterCampaign {
  id           String   @id @default(cuid())
  issueId      String?  // FK to NewsletterIssue (nullable for non-issue campaigns)
  campaignName String
  subjectLine  String
  sentAt       DateTime?
  status       String   @default("DRAFT") // DRAFT | SCHEDULED | SENDING | SENT | FAILED
  recipientCount Int    @default(0)
  providerId   String?  // External provider campaign ID
  providerName String?  // e.g., "sendgrid", "ses", "mailchimp"
  metadata     Json?    // Provider-specific metadata
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([status, sentAt])
}
```

### 5.5 NewsletterSubscriber Extension

The existing `NewsletterSubscriber` model needs **additive fields** (not a new model):

```prisma
// ADD to existing NewsletterSubscriber model:
//   name          String?    // Subscriber name
//   email         String?    // Separate email field (for email delivery)
//   phone         String?    // Separate phone field (for WhatsApp/SMS)
//   consentAt     DateTime?  // When consent was given
//   consentSource String?    // Where consent was captured
//   preferences   Json?      // Content preferences, frequency, etc.
//   lastEngagedAt DateTime?  // Last open/click
//   bounceCount   Int        @default(0)
//   suppressedAt  DateTime?  // Suppression (bounces, complaints)
//   segments      NewsletterSubscriberSegment[]
```

**Migration approach**: Add nullable fields to existing model. Existing records will have null values. New subscriptions populate the new fields.

## 6. Knowledge & Signal Foundation Models

### 6.1 KnowledgeEntity

```prisma
/// Foundation for hospitality knowledge graph
model KnowledgeEntity {
  id          String   @id @default(cuid())
  type        String   // PROBLEM | QUESTION | CONCEPT | CAPABILITY | ROLE | BUSINESS_TYPE | TOPIC
  name        String
  slug        String   @unique
  description String?
  parentId    String?  // Self-referencing for hierarchy
  metadata    Json?    // Type-specific metadata
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  parent      KnowledgeEntity?       @relation("KnowledgeHierarchy", fields: [parentId], references: [id])
  children    KnowledgeEntity[]      @relation("KnowledgeHierarchy")
  articleLinks ArticleKnowledgeLink[]

  @@index([type, isActive])
  @@index([parentId])
  @@index([slug])
}
```

### 6.2 Signal

```prisma
/// Market signal capture (foundation only — no inference engine)
model Signal {
  id          String   @id @default(cuid())
  type        String   // CUSTOMER_QUESTION | SALES_OBJECTION | SUPPORT_QUESTION | FEATURE_REQUEST | CONTENT_INTEREST | INDUSTRY_TREND | PRODUCT_OBSERVATION
  source      String   // DEMO_REQUEST | SUPPORT_CHAT | SALES_CALL | NEWSLETTER_REPLY | SOCIAL_COMMENT | INTERNAL_OBSERVATION
  content     String   // The signal text/summary
  metadata    Json?    // Additional context
  status      String   @default("NEW") // NEW | TRIAGED | ACTED_ON | ARCHIVED
  capturedById String?
  articleId   String?  // If signal led to content (loose reference)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([type, status])
  @@index([status, createdAt])
  @@index([source, createdAt])
}
```

### 6.3 ContentTruth (Evidence Metadata)

Evidence/verification is stored as **Json metadata on EditorialArticle**, not as separate models:

```json
// EditorialArticle.contentTruth Json structure:
{
  "claims": [
    {
      "id": "claim_1",
      "text": "QR ordering reduces wait times by 40%",
      "verificationLevel": "CUSTOMER-VERIFIED",
      "evidence": [
        { "type": "case-study", "reference": "Case Study: Restaurant X", "url": "/stories/restaurant-x" },
        { "type": "data", "reference": "Internal analytics Q3 2024" }
      ]
    }
  ],
  "overallVerification": "CUSTOMER-VERIFIED"
}
```

**Verification levels**: `VERIFIED`, `TESTED`, `CUSTOMER-VERIFIED`, `DATA-BACKED`, `EXTERNAL-SOURCE`, `HYPOTHESIS`, `UNVERIFIED`

## 7. Idea Pipeline Model

### 7.1 EditorialIdea

```prisma
/// Structured editorial idea pipeline
model EditorialIdea {
  id          String   @id @default(cuid())
  title       String
  description String?
  sourceType  String   // SIGNAL | EDITORIAL | CUSTOMER_FEEDBACK | INDUSTRY_TREND | SPONTANEOUS
  sourceId    String?  // FK to Signal if source is signal (loose reference)
  status      String   @default("IDEA") // IDEA | RESEARCH | READY | DRAFTED | PUBLISHED | ARCHIVED
  priority    String   @default("NORMAL") // LOW | NORMAL | HIGH | URGENT
  assignedToId String?
  topicId     String?  // FK to Topic
  tags        String[]
  notes       String?
  articleId   String?  // If idea became an article (loose reference)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([status, priority])
  @@index([sourceType, createdAt])
}
```

## 8. Narrative Foundation Model

### 8.1 Narrative

```prisma
/// Lightweight strategic narrative foundation
model Narrative {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  theme       String?  // Core theme (e.g., "hospitality-empowerment")
  status      String   @default("DRAFT") // DRAFT | ACTIVE | RETIRED
  metadata    Json?    // Narrative structure, key messages, audience
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([status, theme])
  @@index([slug])
}
```

### 8.2 ArticleNarrativeLink

```prisma
/// Content ↔ Narrative relationships
model ArticleNarrativeLink {
  id          String   @id @default(cuid())
  articleId   String
  narrativeId String
  linkType    String   @default("PART_OF") // PART_OF | INTRODUCES | CONTINUES | CONCLUDES
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())

  @@unique([articleId, narrativeId])
  @@index([narrativeId])
}
```

## 9. User Model Extension

The existing `User` model needs **additive fields** for editorial roles:

```prisma
// ADD to existing User model:
//   editorialRoles String[] @default([]) // EDITOR | REVIEWER | PUBLISHER
```

**Migration approach**: Add field with default empty array. No existing users get editorial roles by default. Admin assigns editorial roles via admin panel.

## 10. Index Strategy

| Query Pattern | Index |
|--------------|-------|
| Find article by slug | `EditorialArticle.slug` (unique) |
| List published articles by date | `[status, publishedAt]` |
| List articles by type | `[type, status]` |
| List articles by topic | `[topicId, status]` |
| Search articles by tag | `ArticleTag.[tagId]` |
| List content transitions for article | `[articleId, createdAt]` |
| List signals by type/status | `[type, status]` |
| List ideas by priority | `[status, priority]` |
| Newsletter issues by number | `[issueNumber]` |
| Media by type | `[type, createdAt]` |

## 11. Migration Strategy

1. **Phase 1 (NOW)**: Add EditorialArticle, Topic, Tag, ArticleTag, ContentTransition, PlatformMediaAsset, NewsletterIssue, NewsletterCampaign, NewsletterSegment, NewsletterSubscriberSegment, KnowledgeEntity, Signal, EditorialIdea, ArticleProductLink, ArticleKnowledgeLink. Extend NewsletterSubscriber with additive fields. Extend User with `editorialRoles`.
2. **Phase 2 (NEXT)**: Add ContentRevision, RelatedArticle, Narrative, ArticleNarrativeLink. Extend with evidence metadata.
3. **Phase 3 (LATER)**: Add content localization models, distribution channel models, AI assistance models.

**All migrations are additive** — no breaking changes to existing schema.

---

*End of Content Data Model*
