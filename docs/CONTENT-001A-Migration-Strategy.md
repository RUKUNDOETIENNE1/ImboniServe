# CONTENT-001A — Migration Strategy

> **Mission**: ImboniServe Knowledge & Growth Platform — Implementation Readiness  
> **Document Type**: Prisma Migration Plan  
> **Date**: 2025-08-15  
> **Status**: COMPLETE

---

## 1. Purpose

Define the exact Prisma migration plan for Phase A — new models, extended models, indexes, migration order, seed requirements, and backward compatibility.

## 2. Migration Principles

1. **All changes are additive** — no existing model is modified destructively
2. **New models are independent** — no FK to existing models except User (for author/reviewer/publisher)
3. **Extended models get nullable fields** — no existing field is changed or removed
4. **No data migration** — no existing data is moved or transformed
5. **Existing ContentPost is untouched** — no changes to business CMS models
6. **Single migration** — all Phase A changes in one migration for simplicity

## 3. Migration Content

### 3.1 New Models (7)

| Model | Tables Created |
|-------|---------------|
| EditorialArticle | `EditorialArticle` |
| Topic | `Topic` |
| Tag | `Tag` |
| ArticleTag | `ArticleTag` |
| ContentTransition | `ContentTransition` |
| PlatformMediaAsset | `PlatformMediaAsset` |
| ArticleProductLink | `ArticleProductLink` |
| ContentEvent | `ContentEvent` |

### 3.2 Extended Models (2)

| Model | Fields Added |
|-------|-------------|
| User | `editorialRoles` (String[], default []), 3 new relation fields |
| NewsletterSubscriber | 9 nullable fields (name, email, phone, consentAt, consentSource, preferences, lastEngagedAt, bounceCount, suppressedAt) |

### 3.3 New Indexes

| Table | Index |
|-------|-------|
| EditorialArticle | UNIQUE(slug), INDEX(status, publishedAt), INDEX(type, status), INDEX(topicId, status), INDEX(publishedAt) |
| Topic | UNIQUE(slug), INDEX(parentId, sortOrder) |
| Tag | UNIQUE(name), UNIQUE(slug) |
| ArticleTag | UNIQUE(articleId, tagId), INDEX(tagId) |
| ContentTransition | INDEX(articleId, createdAt), INDEX(toStatus, createdAt) |
| PlatformMediaAsset | INDEX(type, createdAt) |
| ArticleProductLink | UNIQUE(articleId, productKey), INDEX(productKey) |
| ContentEvent | INDEX(articleId, eventType, createdAt), INDEX(eventType, createdAt), INDEX(sessionId, createdAt) |
| NewsletterSubscriber | (existing indexes unchanged) |

### 3.4 Foreign Keys

| From | To | On Delete |
|------|----|-----------|
| EditorialArticle.authorId → User.id | Set null |
| EditorialArticle.reviewerId → User.id | Set null |
| EditorialArticle.publisherId → User.id | Set null |
| EditorialArticle.topicId → Topic.id | Set null |
| ArticleTag.articleId → EditorialArticle.id | Cascade |
| ArticleTag.tagId → Tag.id | Cascade |
| ContentTransition.articleId → EditorialArticle.id | Cascade |
| ArticleProductLink.articleId → EditorialArticle.id | Cascade |
| Topic.parentId → Topic.id | Set null |

## 4. Migration Order

Single migration in this order:

1. **Create tables** (no FK dependencies first):
   - `Topic` (self-referencing FK)
   - `Tag`
   - `PlatformMediaAsset`
   - `ContentEvent`

2. **Create tables with FK to User and Topic**:
   - `EditorialArticle` (FK to User × 3, FK to Topic)

3. **Create join/dependent tables**:
   - `ArticleTag` (FK to EditorialArticle, Tag)
   - `ContentTransition` (FK to EditorialArticle)
   - `ArticleProductLink` (FK to EditorialArticle)

4. **Alter existing tables** (additive):
   - `User`: ADD COLUMN `editorialRoles` TEXT[] DEFAULT '{}'
   - `NewsletterSubscriber`: ADD COLUMN `name` TEXT NULL, ADD COLUMN `email` TEXT NULL, etc.

5. **Create indexes** (after tables and data):

## 5. Migration Command

```bash
npx prisma migrate dev --name editorial_content_phase_a
```

This generates a single migration file in `prisma/migrations/[timestamp]_editorial_content_phase_a/migration.sql`.

## 6. Seed Requirements

### 6.1 Default Topics

Seed initial topics for editorial content:

| Topic | Slug | Parent |
|-------|------|--------|
| Operations | operations | — |
| Inventory Management | inventory-management | Operations |
| QR Ordering | qr-ordering | Operations |
| Payments | payments | — |
| Mobile Money | mobile-money | Payments |
| Growth | growth | — |
| Marketing | marketing | Growth |
| Customer Experience | customer-experience | — |
| Technology | technology | — |

**Seed mechanism**: Prisma seed script (`prisma/seed-editorial.ts`) that creates topics if they don't exist.

### 6.2 Default Tags

No default tags — tags are created organically by editors.

### 6.3 Editorial Role Assignment

No seed — ADMIN assigns editorial roles via admin user management.

### 6.4 Product Key Registry

No seed — configuration file (`src/config/product-keys.ts`), not database.

## 7. Backward Compatibility

| Concern | Status |
|---------|--------|
| Existing ContentPost data | ✅ Untouched — no changes to model or table |
| Existing MediaAsset data | ✅ Untouched — separate from PlatformMediaAsset |
| Existing NewsletterSubscriber data | ✅ Untouched — new fields are nullable, existing records have null |
| Existing User data | ✅ Untouched — editorialRoles defaults to empty array |
| Existing API routes | ✅ Untouched — new routes are additive |
| Existing sitemap URLs | ✅ Preserved — moved to sitemap-pages.xml |
| Existing PublicLayout | ✅ Untouched — ArticleLayout is a new component |
| Existing middleware | ✅ Extended — UTM capture is additive to existing referral logic |

## 8. Rollback Plan

If migration needs to be rolled back:

1. **Drop new tables**: `ArticleProductLink`, `ContentTransition`, `ArticleTag`, `EditorialArticle`, `Topic`, `Tag`, `PlatformMediaAsset`, `ContentEvent`
2. **Drop added columns**: `User.editorialRoles`, NewsletterSubscriber new fields
3. **Drop indexes**: All new indexes

**Prisma rollback**: `npx prisma migrate reset` (destructive — drops ALL data). For targeted rollback, write a manual down migration.

**Recommended**: Test migration on staging before production. Have a backup before applying.

## 9. Post-Migration Verification

| Check | Method |
|-------|--------|
| All new tables exist | `SELECT table_name FROM information_schema.tables WHERE table_name IN ('EditorialArticle', 'Topic', ...)` |
| All indexes exist | `SELECT indexname FROM pg_indexes WHERE tablename = 'EditorialArticle'` |
| User.editorialRoles column exists | `SELECT column_name FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'editorialRoles'` |
| NewsletterSubscriber new columns exist | Same query for NewsletterSubscriber |
| Existing ContentPost table unchanged | `SELECT * FROM ContentPost LIMIT 1` — should work as before |
| Existing API routes still work | Manual API call to `/api/cms/posts` |
| Existing sitemap still works | Fetch `/sitemap.xml` — should return sitemap index |

## 10. Migration File Naming

```
prisma/migrations/
  [timestamp]_editorial_content_phase_a/
    migration.sql
```

---

*End of Migration Strategy*
