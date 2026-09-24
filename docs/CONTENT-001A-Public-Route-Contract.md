# CONTENT-001A — Public Route Contract

> **Mission**: ImboniServe Knowledge & Growth Platform — Implementation Readiness  
> **Document Type**: Public Route Specification  
> **Date**: 2025-08-15  
> **Status**: COMPLETE

---

## 1. Purpose

Define the exact public routes for Phase A, their rendering strategy, data requirements, SEO behavior, 404 handling, and access control.

## 2. Phase A Routes

| # | Route | Type | Rendering | Phase |
|---|-------|------|-----------|-------|
| 1 | `/blog` | Listing | SSR (getServerSideProps) | A |
| 2 | `/blog/[slug]` | Detail | SSR (getServerSideProps) | A |
| 3 | `/stories` | Listing | SSR | A |
| 4 | `/stories/[slug]` | Detail | SSR | A |
| 5 | `/insights` | Listing | SSR | A |
| 6 | `/insights/[slug]` | Detail | SSR | A |
| 7 | `/guides` | Listing | SSR | A |
| 8 | `/guides/[slug]` | Detail | SSR | A |

## 3. Route-to-Type Mapping

| Route Prefix | Content Types Served |
|-------------|---------------------|
| `/blog` | Article, Announcement |
| `/stories` | FounderStory, ProductStory, CaseStudy |
| `/insights` | IndustryInsight |
| `/guides` | Guide |

**Note**: Report, Newsletter, Resource types are Phase B. They will get their own route prefixes (`/reports`, `/newsletter`, `/resources`) in Phase B.

## 4. Listing Pages

### 4.1 Data Requirements

```typescript
// getServerSideProps for listing pages
{
  articles: PublishedArticle[],  // Paginated, filtered by type(s) for this route
  total: number,
  page: number,
  pageSize: number,
  topic?: Topic,                  // If topic filter applied (Phase B)
}
```

### 4.2 Query

```sql
SELECT * FROM EditorialArticle
WHERE status = 'PUBLISHED'
  AND publishedAt <= NOW()
  AND type IN ([types for this route])
ORDER BY publishedAt DESC
LIMIT [pageSize] OFFSET [offset]
```

### 4.3 Pagination

- Default page size: 12
- Max page size: 50
- URL: `/blog?page=2` (query parameter)
- Display: "Page 2 of 13" + prev/next links
- Beyond page 10: show "Older posts" link instead of numbered pages

### 4.4 Layout

```
[ArticleLayout or PublicLayout]
  [Page Header: section title + description]
  [Article Grid]
    [Card: cover image, title, excerpt, topic, date, author]
  [Pagination]
  [Newsletter signup (inline variant)]
[/ArticleLayout]
```

### 4.5 SEO

| Element | Value |
|---------|-------|
| `<title>` | "Blog \| ImboniServe" (or "Stories", "Insights", "Guides") |
| `<meta name="description">` | Section description from i18n or default |
| Canonical | `https://imboniserve.com/blog` (no query params) |
| OG type | `website` |
| JSON-LD | `CollectionPage` schema |

## 5. Detail Pages

### 5.1 Data Requirements

```typescript
// getServerSideProps for detail pages
{
  article: {
    id, type, title, subtitle, slug, excerpt,
    bodyHtml,         // Markdown rendered to sanitized HTML
    publishedAt, updatedAt,
    coverImageUrl,
    topic: { name, slug },
    tags: [{ name, slug }],
    author: { name },
    seoMeta,
    productLinks,
  },
  relatedArticles: PublishedArticle[],  // Same topic, max 3
}
```

### 5.2 Query

```sql
SELECT * FROM EditorialArticle
WHERE slug = [slug]
  AND status = 'PUBLISHED'
  AND publishedAt <= NOW()
```

If not found or not published → 404.

### 5.3 404 Behavior

- Non-existent slug → standard 404 page
- Existing slug but status ≠ PUBLISHED → 404 (no information leak)
- Archived slug → 404 (not 410 — avoid revealing article existed)
- Invalid slug format → 404

### 5.4 Layout

```
[ArticleLayout]
  [Head: per-article SEO metadata]
  [Breadcrumb: Home > Section > Article Title]
  [Article Header: title, subtitle, author, date, topic, reading time]
  [Cover image (if set)]
  [Article body: rendered HTML]
  [Product links section (if any)]
  [Tag list]
  [Social share buttons]
  [Newsletter signup (inline)]
  [Related articles (max 3)]
[/ArticleLayout]
```

### 5.5 SEO

| Element | Value |
|---------|-------|
| `<title>` | `seoMeta.metaTitle` or `article.title + " \| ImboniServe"` |
| `<meta name="description">` | `seoMeta.metaDescription` or `article.excerpt` or first 160 chars |
| Canonical | `seoMeta.canonicalUrl` or `https://imboniserve.com/{route}/{slug}` |
| OG type | `article` |
| OG title | `seoMeta.ogTitle` or meta title |
| OG description | `seoMeta.ogDescription` or meta description |
| OG image | `seoMeta.ogImageId` → PlatformMediaAsset URL or cover image or default |
| Twitter card | `summary_large_image` (default) or `seoMeta.twitterCard` |
| JSON-LD | `Article` schema + `BreadcrumbList` schema |

### 5.6 Reading Time

Calculated client-side or server-side: `wordCount / 200` (words per minute), rounded up. Displayed as "5 min read".

## 6. ArticleLayout Component

### 6.1 Purpose

Extends PublicLayout with article-specific SEO metadata and structured data.

### 6.2 Props

```typescript
interface ArticleLayoutProps {
  children: React.ReactNode
  title: string
  metaDescription?: string
  canonicalUrl?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  publishedAt?: string
  updatedAt?: string
  authorName?: string
  articleSection?: string  // Topic name
  structuredData?: object  // Article JSON-LD
}
```

### 6.3 Behavior

- Renders PublicLayout with base SEO
- Adds Article JSON-LD structured data
- Adds BreadcrumbList JSON-LD
- Sets OG type to `article`
- Includes article-specific meta tags (article:published_time, article:section, etc.)

## 7. Draft Protection

### 7.1 Server-Side

- `getServerSideProps` queries only `status = 'PUBLISHED' AND publishedAt <= NOW()`
- Non-published articles return `{ notFound: true }` → Next.js renders 404
- No preview mode in Phase A (Phase B adds preview with token)

### 7.2 No Information Leak

- 404 page is identical whether slug doesn't exist or article is not published
- No redirect to login for draft articles
- No "This article is a draft" message

## 8. Canonical URL Behavior

| Scenario | Canonical |
|----------|-----------|
| Article with `seoMeta.canonicalUrl` | Use that URL |
| Article without canonical override | `https://imboniserve.com/{route}/{slug}` |
| Listing page | `https://imboniserve.com/{route}` (no query params) |
| Paginated listing | Canonical stays on base URL (page 1), use `rel="prev"` and `rel="next"` |

## 9. Homepage Integration

### 9.1 Latest Articles Section

Add a "Latest Insights" section to the existing homepage (`src/pages/index.tsx`):
- Query: 3 most recent PUBLISHED articles (any type)
- Display: cover image, title, excerpt, date
- "View all" link to `/blog`

### 9.2 Implementation

- Add `getServerSideProps` to homepage (currently uses `getStaticProps` or no data fetching)
- OR: client-side fetch from `/api/public/content/articles?pageSize=3`
- Recommended: SSR for SEO (homepage should show fresh content to crawlers)

## 10. Navigation Integration

### 10.1 Header

Add "Insights" link to existing PublicLayout navigation:
```
Features | Pricing | Solutions | Insights | Discover | Contact
```

- "Insights" links to `/blog`
- Do not add separate links for stories, insights, guides — they're accessible from the blog listing or direct URLs

### 10.2 Footer

Add content section to footer:
```
Content:
  Blog | Stories | Insights | Guides
```

## 11. Performance

| Concern | Strategy |
|---------|----------|
| Listing page query | Indexed on `[status, publishedAt]` — fast |
| Detail page query | Indexed on `slug` (unique) — fast |
| Markdown rendering | Server-side via remark/rehype — cached in memory if same article |
| Images | Next.js Image component with lazy loading |
| Related articles | Query same topic, limit 3 — indexed on `[topicId, status]` |
| Pagination | OFFSET/LIMIT — fine for <10K articles. Phase B: cursor-based if needed. |

## 12. Caching

| Page | Cache Strategy |
|------|---------------|
| Listing pages | `Cache-Control: public, max-age=300` (5 minutes) |
| Detail pages | `Cache-Control: public, max-age=60` (1 minute) |
| 404 pages | `Cache-Control: public, max-age=60` (1 minute) |

Phase B: Consider ISR (Incremental Static Regeneration) with `revalidate` for detail pages.

---

*End of Public Route Contract*
