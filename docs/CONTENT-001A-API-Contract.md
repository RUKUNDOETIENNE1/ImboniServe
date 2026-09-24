# CONTENT-001A — API Contract

> **Mission**: ImboniServe Knowledge & Growth Platform — Implementation Readiness  
> **Document Type**: Implementation-Ready API Surface  
> **Date**: 2025-08-15  
> **Status**: COMPLETE

---

## 1. Purpose

Define every API endpoint for Phase A implementation. Each endpoint specifies: method, path, authorization, input, output, validation, errors, and side effects.

## 2. Authorization Model

| Role | Editorial API Access |
|------|---------------------|
| ADMIN (in `roles`) | Full editorial access (implicit) |
| User with `editorialRoles` including EDITOR | Create, edit own, submit for review |
| User with `editorialRoles` including REVIEWER | All EDITOR + review, approve, reject |
| User with `editorialRoles` including PUBLISHER | All REVIEWER + schedule, publish |
| No editorial roles | 403 Forbidden |

**Auth check pattern**: `getServerSession(req, res, authOptions)` → check `session.user.roles.includes('ADMIN')` OR `session.user.editorialRoles` contains required role.

## 3. Admin Content API — Articles

### 3.1 List Articles

| Property | Value |
|----------|-------|
| **Method** | GET |
| **Path** | `/api/admin/content/articles` |
| **Authorization** | EDITOR, REVIEWER, PUBLISHER, or ADMIN |
| **Input (query)** | `page` (default 1), `pageSize` (default 20, max 100), `status` (optional), `type` (optional), `topicId` (optional), `q` (optional search) |
| **Output** | `{ items: Article[], total: number, page: number, pageSize: number }` |
| **Validation** | page ≥ 1, pageSize 1–100 |
| **Errors** | 401 (not authenticated), 403 (no editorial role) |
| **Side effects** | None |

### 3.2 Create Article

| Property | Value |
|----------|-------|
| **Method** | POST |
| **Path** | `/api/admin/content/articles` |
| **Authorization** | EDITOR, REVIEWER, PUBLISHER, or ADMIN |
| **Input (body)** | `{ type: string, title: string, subtitle?: string, excerpt?: string, body: string, bodyFormat?: string, topicId?: string, tags?: string[], coverImageId?: string, seoMeta?: object }` |
| **Output** | `{ article: Article }` |
| **Validation** | type must be valid content type, title non-empty, slug auto-generated from title (uniqueness check), body non-empty |
| **Errors** | 400 (validation), 401, 403, 409 (slug collision) |
| **Side effects** | Creates EditorialArticle, creates ContentTransition (null → DRAFT), creates ArticleTag entries for tags |

### 3.3 Get Article

| Property | Value |
|----------|-------|
| **Method** | GET |
| **Path** | `/api/admin/content/articles/[id]` |
| **Authorization** | EDITOR, REVIEWER, PUBLISHER, or ADMIN |
| **Input (params)** | `id` |
| **Output** | `{ article: Article, transitions: Transition[], productLinks: ProductLink[], articleTags: Tag[] }` |
| **Validation** | id must be valid cuid |
| **Errors** | 401, 403, 404 (not found) |
| **Side effects** | None |

### 3.4 Update Article

| Property | Value |
|----------|-------|
| **Method** | PATCH |
| **Path** | `/api/admin/content/articles/[id]` |
| **Authorization** | EDITOR (own only), REVIEWER, PUBLISHER, or ADMIN |
| **Input (body)** | Partial update of any article field except `id`, `slug` (if PUBLISHED), `status` (use transition endpoint) |
| **Output** | `{ article: Article }` |
| **Validation** | Cannot edit PUBLISHED article directly (must transition to UPDATED first). Cannot change slug of PUBLISHED article. |
| **Errors** | 400, 401, 403, 404, 409 (slug collision) |
| **Side effects** | Updates EditorialArticle, updates ArticleTag entries if tags changed |

### 3.5 Delete Article

| Property | Value |
|----------|-------|
| **Method** | DELETE |
| **Path** | `/api/admin/content/articles/[id]` |
| **Authorization** | ADMIN only |
| **Input (params)** | `id` |
| **Output** | `{ success: true }` |
| **Validation** | Can only delete articles with status DRAFT or REJECTED. PUBLISHED articles must be ARCHIVED first. |
| **Errors** | 400 (cannot delete non-draft/rejected), 401, 403, 404 |
| **Side effects** | Deletes EditorialArticle (cascade: ContentTransition, ArticleTag, ArticleProductLink) |

### 3.6 Transition Article Status

| Property | Value |
|----------|-------|
| **Method** | POST |
| **Path** | `/api/admin/content/articles/[id]/transition` |
| **Authorization** | Role depends on target status (see Workflow Contract) |
| **Input (body)** | `{ toStatus: string, note?: string, scheduledAt?: string }` |
| **Output** | `{ article: Article, transition: Transition }` |
| **Validation** | Transition must be valid per state machine. `scheduledAt` required when toStatus = SCHEDULED. |
| **Errors** | 400 (invalid transition), 401, 403 (insufficient role for transition), 404 |
| **Side effects** | Updates EditorialArticle.status, creates ContentTransition, sets publishedAt/scheduledAt/archivedAt as appropriate |

## 4. Admin Content API — Topics

### 4.1 List Topics

| Property | Value |
|----------|-------|
| **Method** | GET |
| **Path** | `/api/admin/content/topics` |
| **Authorization** | EDITOR, REVIEWER, PUBLISHER, or ADMIN |
| **Input (query)** | `includeInactive` (default false) |
| **Output** | `{ topics: Topic[] }` (hierarchical) |
| **Errors** | 401, 403 |
| **Side effects** | None |

### 4.2 Create Topic

| Property | Value |
|----------|-------|
| **Method** | POST |
| **Path** | `/api/admin/content/topics` |
| **Authorization** | ADMIN |
| **Input (body)** | `{ name: string, description?: string, parentId?: string, color?: string, icon?: string, sortOrder?: number }` |
| **Output** | `{ topic: Topic }` |
| **Validation** | name non-empty, slug auto-generated, parentId must exist if provided |
| **Errors** | 400, 401, 403, 409 (slug collision) |
| **Side effects** | Creates Topic |

### 4.3 Update Topic

| Property | Value |
|----------|-------|
| **Method** | PATCH |
| **Path** | `/api/admin/content/topics/[id]` |
| **Authorization** | ADMIN |
| **Input (body)** | Partial update of topic fields |
| **Output** | `{ topic: Topic }` |
| **Errors** | 400, 401, 403, 404, 409 |
| **Side effects** | Updates Topic |

### 4.4 Delete Topic

| Property | Value |
|----------|-------|
| **Method** | DELETE |
| **Path** | `/api/admin/content/topics/[id]` |
| **Authorization** | ADMIN |
| **Input** | `id` |
| **Output** | `{ success: true }` |
| **Validation** | Cannot delete if articles are linked (set isActive = false instead) |
| **Errors** | 400 (has linked articles), 401, 403, 404 |
| **Side effects** | Deletes Topic or sets isActive = false |

## 5. Admin Content API — Tags

### 5.1 List Tags

| Property | Value |
|----------|-------|
| **Method** | GET |
| **Path** | `/api/admin/content/tags` |
| **Authorization** | EDITOR, REVIEWER, PUBLISHER, or ADMIN |
| **Input (query)** | `q` (optional search) |
| **Output** | `{ tags: Tag[] }` |
| **Errors** | 401, 403 |
| **Side effects** | None |

### 5.2 Create Tag

| Property | Value |
|----------|-------|
| **Method** | POST |
| **Path** | `/api/admin/content/tags` |
| **Authorization** | EDITOR, REVIEWER, PUBLISHER, or ADMIN |
| **Input (body)** | `{ name: string, description?: string }` |
| **Output** | `{ tag: Tag }` |
| **Validation** | name non-empty, slug auto-generated, name unique |
| **Errors** | 400, 401, 403, 409 (name/slug collision) |
| **Side effects** | Creates Tag |

### 5.3 Delete Tag

| Property | Value |
|----------|-------|
| **Method** | DELETE |
| **Path** | `/api/admin/content/tags/[id]` |
| **Authorization** | ADMIN |
| **Input** | `id` |
| **Output** | `{ success: true }` |
| **Errors** | 401, 403, 404 |
| **Side effects** | Deletes Tag (cascade removes ArticleTag joins) |

## 6. Admin Content API — Media

### 6.1 List Media

| Property | Value |
|----------|-------|
| **Method** | GET |
| **Path** | `/api/admin/content/media` |
| **Authorization** | EDITOR, REVIEWER, PUBLISHER, or ADMIN |
| **Input (query)** | `page`, `pageSize`, `type` (optional), `q` (optional search filename/altText/tags) |
| **Output** | `{ items: MediaAsset[], total: number, page: number, pageSize: number }` |
| **Errors** | 401, 403 |
| **Side effects** | None |

### 6.2 Upload Media

| Property | Value |
|----------|-------|
| **Method** | POST |
| **Path** | `/api/admin/content/media/upload` |
| **Authorization** | EDITOR, REVIEWER, PUBLISHER, or ADMIN |
| **Input (multipart)** | `file` (required), `altText` (optional), `caption` (optional), `attribution` (optional), `tags` (optional, comma-separated) |
| **Output** | `{ media: MediaAsset }` |
| **Validation** | File type: IMAGE (jpeg/png/webp/gif), VIDEO (mp4/quicktime/webm), DOCUMENT (pdf). Size limits: IMAGE 10MB, VIDEO 50MB, DOCUMENT 15MB. |
| **Errors** | 400 (invalid type/size), 401, 403, 500 (storage failure) |
| **Side effects** | Uploads to Supabase Storage (platform bucket/prefix), creates PlatformMediaAsset record |

### 6.3 Get Media

| Property | Value |
|----------|-------|
| **Method** | GET |
| **Path** | `/api/admin/content/media/[id]` |
| **Authorization** | EDITOR, REVIEWER, PUBLISHER, or ADMIN |
| **Output** | `{ media: MediaAsset }` |
| **Errors** | 401, 403, 404 |
| **Side effects** | None |

### 6.4 Update Media

| Property | Value |
|----------|-------|
| **Method** | PATCH |
| **Path** | `/api/admin/content/media/[id]` |
| **Authorization** | EDITOR, REVIEWER, PUBLISHER, or ADMIN |
| **Input (body)** | `{ altText?: string, caption?: string, attribution?: string, tags?: string[] }` |
| **Output** | `{ media: MediaAsset }` |
| **Errors** | 401, 403, 404 |
| **Side effects** | Updates PlatformMediaAsset |

### 6.5 Delete Media

| Property | Value |
|----------|-------|
| **Method** | DELETE |
| **Path** | `/api/admin/content/media/[id]` |
| **Authorization** | ADMIN |
| **Output** | `{ success: true }` |
| **Errors** | 401, 403, 404 |
| **Side effects** | Deletes PlatformMediaAsset, best-effort storage file deletion |

## 7. Admin Content API — Product Links

### 7.1 Set Product Links

| Property | Value |
|----------|-------|
| **Method** | PUT |
| **Path** | `/api/admin/content/articles/[id]/products` |
| **Authorization** | EDITOR, REVIEWER, PUBLISHER, or ADMIN |
| **Input (body)** | `{ links: [{ productKey: string, productLabel?: string, linkType: string, sortOrder: number }] }` |
| **Output** | `{ productLinks: ProductLink[] }` |
| **Validation** | productKey non-empty, linkType must be FEATURED/MENTIONED/COMPARED/TUTORIAL |
| **Errors** | 400, 401, 403, 404 |
| **Side effects** | Replaces all ArticleProductLink entries for article |

## 8. Public Content API

### 8.1 List Published Articles

| Property | Value |
|----------|-------|
| **Method** | GET |
| **Path** | `/api/public/content/articles` |
| **Authorization** | None (public) |
| **Input (query)** | `page`, `pageSize`, `type` (optional), `topicId` (optional), `tag` (optional) |
| **Output** | `{ items: PublicArticle[], total: number, page: number, pageSize: number }` |
| **Validation** | page ≥ 1, pageSize 1–50 |
| **Errors** | None (always returns 200 or empty list) |
| **Side effects** | None |

### 8.2 Get Published Article by Slug

| Property | Value |
|----------|-------|
| **Method** | GET |
| **Path** | `/api/public/content/articles/[slug]` |
| **Authorization** | None (public) |
| **Input (params)** | `slug` |
| **Output** | `{ article: PublicArticle, relatedArticles: PublicArticle[] }` |
| **Validation** | Article must have status PUBLISHED |
| **Errors** | 404 (not found or not published) |
| **Side effects** | None (page view tracking via ContentEvent is client-side) |

**PublicArticle shape** (no internal fields):
```json
{
  "id": "string",
  "type": "string",
  "title": "string",
  "subtitle": "string|null",
  "slug": "string",
  "excerpt": "string|null",
  "body": "string (rendered HTML)",
  "publishedAt": "ISO date",
  "updatedAt": "ISO date",
  "coverImageUrl": "string|null",
  "topic": { "name": "string", "slug": "string" } | null,
  "tags": [{ "name": "string", "slug": "string" }],
  "author": { "name": "string" } | null,
  "seoMeta": { "metaTitle": "string", "metaDescription": "string", ... },
  "productLinks": [{ "productKey": "string", "productLabel": "string", "linkType": "string" }]
}
```

## 9. Extended Existing APIs

### 9.1 Newsletter Subscribe (Extended)

| Property | Value |
|----------|-------|
| **Method** | POST |
| **Path** | `/api/growth/newsletter-subscribe` (existing) |
| **Authorization** | None (public) |
| **Input (body)** | `{ emailOrPhone: string, sourcePage?: string, name?: string, email?: string, phone?: string, consentSource?: string }` (extended) |
| **Output** | `{ success: true }` (existing) |
| **Validation** | emailOrPhone required (existing). New fields optional. |
| **Errors** | 400, 500 (existing) |
| **Side effects** | Creates/updates NewsletterSubscriber with new fields |

### 9.2 Demo Request (Extended)

| Property | Value |
|----------|-------|
| **Method** | POST |
| **Path** | `/api/growth/demo-request` (existing) |
| **Authorization** | None (public) |
| **Input (body)** | `{ name: string, businessName: string, contact: string, message?: string }` (existing) |
| **Output** | `{ success: true }` (existing) |
| **Validation** | Existing validation unchanged. |
| **Errors** | 400, 500 (existing) |
| **Side effects** | Creates DemoRequest. NEW: reads UTM cookies from request and stores on DemoRequest. |

## 10. Content Event API

### 10.1 Track Content Event

| Property | Value |
|----------|-------|
| **Method** | POST |
| **Path** | `/api/public/content/events` |
| **Authorization** | None (public, anonymous) |
| **Input (body)** | `{ articleId?: string, eventType: string, metadata?: object }` |
| **Output** | `{ success: true }` |
| **Validation** | eventType must be valid. articleId must be a published article if provided. |
| **Errors** | 400 (invalid eventType), 404 (article not found/published) |
| **Side effects** | Creates ContentEvent. Reads UTM cookies and refCode from request. |

---

*End of API Contract*
