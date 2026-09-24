# CONTENT-001 — SEO Architecture

> **Mission**: ImboniServe Knowledge & Growth Platform  
> **Document Type**: SEO Architecture Design  
> **Date**: 2025-01-20  
> **Status**: COMPLETE

---

## 1. Purpose

Define the SEO architecture for editorial content on the ImboniServe public website. This extends the existing PublicLayout SEO infrastructure with per-content metadata, dynamic sitemaps, and structured data.

## 2. Current State

**Existing** (from forensic audit):
- `PublicLayout` provides per-page `<title>`, `<meta name="description">`, canonical URL, Open Graph, Twitter Card, and JSON-LD (Organization, WebSite)
- Static sitemap with 10 hardcoded URLs
- No per-content SEO metadata
- No dynamic sitemap
- No Article/BlogPosting structured data
- No hreflang for i18n

## 3. SEO Metadata Model

### 3.1 Per-Article SEO Metadata

Stored as `EditorialArticle.seoMeta` (Json):

```json
{
  "slug": "qr-ordering-reduces-wait-times",
  "metaTitle": "How QR Ordering Reduces Wait Times by 40% | ImboniServe",
  "metaDescription": "Discover how QR code ordering transforms restaurant operations by cutting wait times by 40%. Real data from Rwandan hospitality businesses.",
  "canonicalUrl": null,
  "ogTitle": "QR Ordering Cuts Wait Times by 40%",
  "ogDescription": "Real data from Rwandan restaurants shows QR ordering dramatically reduces wait times.",
  "ogImageId": "media_abc123",
  "twitterCard": "summary_large_image",
  "twitterTitle": null,
  "twitterDescription": null,
  "twitterImageId": null,
  "noIndex": false,
  "noFollow": false,
  "keywords": ["QR ordering", "restaurant technology", "wait times", "Rwanda"],
  "structuredData": {
    "@type": "Article",
    "author": { "@type": "Person", "name": "Author Name" },
    "datePublished": "2025-01-20",
    "dateModified": "2025-01-22",
    "image": ["/imgs/articles/qr-ordering-cover.jpg"],
    "publisher": { "@type": "Organization", "name": "ImboniServe" }
  }
}
```

### 3.2 SEO Field Rules

| Field | Rule | Fallback |
|-------|------|----------|
| `slug` | URL-safe, unique, lowercase, hyphenated | Auto-generated from title |
| `metaTitle` | Max 60 chars | Article title + " \| ImboniServe" |
| `metaDescription` | Max 160 chars | Article excerpt or first 160 chars of body |
| `canonicalUrl` | Override canonical URL | Default: `siteUrl + /{type-path}/{slug}` |
| `ogTitle` | Max 60 chars | `metaTitle` |
| `ogDescription` | Max 200 chars | `metaDescription` |
| `ogImageId` | PlatformMediaAsset ID | Cover image or default OG image |
| `noIndex` | Boolean | `false` (index by default) |
| `keywords` | Array of strings | Extracted from tags + topic |

## 4. URL Structure

### 4.1 Content URL Patterns

| Content Type | URL Pattern | Example |
|-------------|-------------|---------|
| Article | `/blog/{slug}` | `/blog/qr-ordering-reduces-wait-times` |
| FounderStory | `/stories/{slug}` | `/stories/why-we-built-imboniserve` |
| IndustryInsight | `/insights/{slug}` | `/insights/mobile-first-dining-east-africa` |
| ProductStory | `/stories/{slug}` | `/stories/inside-smart-dining-slips` |
| CaseStudy | `/stories/{slug}` | `/stories/restaurant-x-doubled-revenue` |
| Guide | `/guides/{slug}` | `/guides/inventory-management-restaurants` |
| Report | `/reports/{slug}` | `/reports/state-of-hospitality-tech-rwanda-2025` |
| Newsletter | `/newsletter/{slug}` | `/newsletter/imboniserve-weekly-issue-12` |
| Announcement | `/blog/{slug}` | `/blog/imboniserve-now-supports-airtel-money` |
| Resource | `/resources/{slug}` | `/resources/restaurant-inventory-template` |

### 4.2 Topic/Tag URLs

| Entity | URL Pattern | Example |
|--------|-------------|---------|
| Topic | `/topic/{slug}` | `/topic/inventory-management` |
| Tag | `/tag/{slug}` | `/tag/qr-ordering` |
| Author | `/author/{slug}` | `/author/john-doe` |

### 4.3 Listing Pages

| Page | URL | Content |
|------|-----|---------|
| Blog listing | `/blog` | All articles + announcements |
| Stories listing | `/stories` | Founder stories + product stories + case studies |
| Insights listing | `/insights` | Industry insights |
| Guides listing | `/guides` | Guides |
| Reports listing | `/reports` | Reports |
| Resources listing | `/resources` | Resources |
| Newsletter archive | `/newsletter` | Newsletter issues |
| Topic listing | `/topic/{slug}` | Articles in topic |
| Tag listing | `/tag/{slug}` | Articles with tag |

### 4.4 Route Implementation

Routes are **not automatically all created**. NOW scope creates:
- `/blog` (listing) + `/blog/[slug]` (detail)
- `/stories` (listing) + `/stories/[slug]` (detail)
- `/insights` (listing) + `/insights/[slug]` (detail)
- `/guides` (listing) + `/guides/[slug]` (detail)

NEXT scope adds:
- `/reports` (listing) + `/reports/[slug]` (detail)
- `/resources` (listing) + `/resources/[slug]` (detail)
- `/newsletter` (archive) + `/newsletter/[slug]` (detail)
- `/topic/[slug]` + `/tag/[slug]`

## 5. Dynamic Sitemap

### 5.1 Sitemap Structure

Replace the current static sitemap with a **dynamic sitemap index**:

```
/sitemap.xml          → Sitemap index (lists individual sitemaps)
/sitemap-pages.xml    → Static pages (home, pricing, features, etc.)
/sitemap-articles.xml → Editorial articles (blog, stories, insights, guides)
/sitemap-topics.xml   → Topic pages
/sitemap-tags.xml     → Tag pages
```

### 5.2 Sitemap Generation

```typescript
// src/pages/sitemap-articles.xml.ts
export const getServerSideProps: GetServerSideProps = async ({ res, req }) => {
  const baseUrl = getBaseUrl(req)
  const articles = await prisma.editorialArticle.findMany({
    where: { status: 'PUBLISHED' },
    select: { slug: true, type: true, publishedAt: true, updatedAt: true },
    orderBy: { publishedAt: 'desc' },
  })

  const urls = articles.map(article => ({
    loc: `${baseUrl}/${getTypePath(article.type)}/${article.slug}`,
    lastmod: article.updatedAt.toISOString(),
    changefreq: 'weekly',
    priority: '0.8',
  }))

  res.setHeader('Content-Type', 'application/xml')
  res.write(generateSitemapXml(urls))
  res.end()
  return { props: {} }
}
```

### 5.3 Sitemap Rules
- Only PUBLISHED content appears in sitemap
- `lastmod` = article `updatedAt`
- `changefreq` = "weekly" for content, "monthly" for static pages
- `priority` = 1.0 for homepage, 0.8 for articles, 0.6 for topic/tag pages, 0.4 for static pages
- Sitemap is regenerated on each request (no caching for NOW; add cache in NEXT)

## 6. Structured Data (JSON-LD)

### 6.1 Article Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "How QR Ordering Reduces Wait Times by 40%",
  "description": "Real data from Rwandan restaurants...",
  "image": ["https://imboniserve.com/imgs/articles/cover.jpg"],
  "datePublished": "2025-01-20T10:00:00+02:00",
  "dateModified": "2025-01-22T15:30:00+02:00",
  "author": {
    "@type": "Person",
    "name": "Author Name",
    "url": "https://imboniserve.com/author/author-name"
  },
  "publisher": {
    "@type": "Organization",
    "name": "ImboniServe",
    "logo": {
      "@type": "ImageObject",
      "url": "https://imboniserve.com/imgs/logo2.png"
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://imboniserve.com/blog/qr-ordering-reduces-wait-times"
  },
  "articleSection": "Inventory Management",
  "keywords": "QR ordering, restaurant technology, wait times"
}
```

### 6.2 BreadcrumbList Schema

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://imboniserve.com/" },
    { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://imboniserve.com/blog" },
    { "@type": "ListItem", "position": 3, "name": "Article Title" }
  ]
}
```

### 6.3 Existing Organization + WebSite Schema

The existing Organization and WebSite JSON-LD in PublicLayout remains unchanged. Article pages add Article + BreadcrumbList schemas.

## 7. Robots Meta

| Page Type | noIndex | noFollow |
|-----------|---------|----------|
| Published articles | false | false |
| Listing pages | false | false |
| Topic/tag pages | false | false |
| Draft/review articles | true | true |
| Admin pages | true | true |
| API routes | true | true |
- `noIndex` articles: respect `seoMeta.noIndex` field
- `robots.txt` remains `Allow: /` (admin routes are protected by auth, not robots)

## 8. Open Graph & Social Sharing

### 8.1 OG Image Strategy
- Each article can have a custom OG image via `seoMeta.ogImageId`
- Default: article cover image
- Fallback: site default OG image (`/imgs/logo2.png`)
- Recommended size: 1200×630px

### 8.2 Social Share Component
- Existing `SocialShare` component in PublicLayout
- Extend with per-article share URLs
- Add share counts (NEXT scope)

## 9. hreflang / i18n SEO

### 9.1 NOW Scope
- No hreflang tags (content is single-language for NOW)
- i18n system exists for UI, but content is not localized yet

### 9.2 LATER Scope
- hreflang tags for localized content
- Locale-specific URLs: `/en/blog/{slug}`, `/fr/blog/{slug}`, `/rw/blog/{slug}`
- Alternate language sitemap entries

## 10. Performance Considerations

- Sitemap generation: server-side, cached for 1 hour (NEXT)
- SEO meta tags: rendered server-side via Next.js `getServerSideProps`
- No client-side SEO meta injection (all SSR)
- Structured data: inline JSON-LD in page HTML (no external requests)

---

*End of SEO Architecture*
