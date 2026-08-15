# CONTENT-001A — SEO Implementation Contract

> **Mission**: ImboniServe Knowledge & Growth Platform — Implementation Readiness  
> **Document Type**: SEO Implementation Specification  
> **Date**: 2025-08-15  
> **Status**: COMPLETE

---

## 1. Purpose

Define exactly what must change in the existing SEO infrastructure to support editorial content, without breaking existing public page SEO.

## 2. Current SEO State

| Component | Location | Status |
|-----------|----------|--------|
| Per-page meta tags | `src/components/PublicLayout.tsx:44-74` | ✅ title, description, canonical, OG, Twitter |
| JSON-LD Organization | `PublicLayout.tsx:63-73` | ✅ |
| JSON-LD WebSite | `PublicLayout.tsx:75-80` | ✅ |
| Static sitemap | `src/pages/sitemap.xml.ts` | ⚠️ 10 hardcoded URLs |
| robots.txt | `src/pages/robots.txt.ts` | ✅ Allow all + sitemap ref |
| Cookie consent | `src/components/CookieConsentBanner.tsx` | ✅ |
| i18n meta | `src/pages/_app.tsx` | ✅ meta description via getTranslation |

## 3. Changes Required

### 3.1 Sitemap Refactor (EXISTS–REFACTOR)

**Current**: `src/pages/sitemap.xml.ts` generates a single sitemap with 10 static URLs.

**Target**: Sitemap index pointing to sub-sitemaps.

**Implementation**:

1. **`src/pages/sitemap.xml.ts`** (refactored) → Sitemap index

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://imboniserve.com/sitemap-pages.xml</loc></sitemap>
  <sitemap><loc>https://imboniserve.com/sitemap-articles.xml</loc></sitemap>
</sitemapindex>
```

2. **`src/pages/sitemap-pages.xml.ts`** (new) → Static pages (existing 10 URLs + new listing pages)

```typescript
// Same static URLs as before + /blog, /stories, /insights, /guides
const staticPages = [
  '/', '/pricing', '/discover', '/store', '/faq',
  '/terms', '/privacy', '/cookies', '/login', '/signup', '/unsubscribe',
  '/blog', '/stories', '/insights', '/guides',
]
```

3. **`src/pages/sitemap-articles.xml.ts`** (new) → Dynamic published articles

```typescript
export const getServerSideProps = async ({ res, req }) => {
  const baseUrl = getBaseUrl(req)
  const articles = await prisma.editorialArticle.findMany({
    where: { status: 'PUBLISHED', publishedAt: { lte: new Date() } },
    select: { slug: true, type: true, publishedAt: true, updatedAt: true },
    orderBy: { publishedAt: 'desc' },
  })

  const urls = articles.map(a => ({
    loc: `${baseUrl}/${getTypePath(a.type)}/${a.slug}`,
    lastmod: a.updatedAt.toISOString(),
    changefreq: 'weekly',
    priority: '0.8',
  }))

  res.setHeader('Content-Type', 'application/xml')
  res.setHeader('Cache-Control', 'public, max-age=300')
  res.write(generateSitemapXml(urls))
  res.end()
  return { props: {} }
}
```

**Type-to-path mapping** (shared utility):
```typescript
function getTypePath(type: string): string {
  switch (type) {
    case 'Article':
    case 'Announcement': return 'blog'
    case 'FounderStory':
    case 'ProductStory':
    case 'CaseStudy': return 'stories'
    case 'IndustryInsight': return 'insights'
    case 'Guide': return 'guides'
    case 'Report': return 'reports'      // Phase B
    case 'Newsletter': return 'newsletter' // Phase B
    case 'Resource': return 'resources'    // Phase B
    default: return 'blog'
  }
}
```

### 3.2 Article SEO Metadata (NEW)

**Per-article SEO** stored in `EditorialArticle.seoMeta` (Json):

```json
{
  "metaTitle": "How QR Ordering Reduces Wait Times by 40% | ImboniServe",
  "metaDescription": "Real data from Rwandan restaurants shows QR ordering cuts wait times dramatically.",
  "canonicalUrl": null,
  "ogTitle": "QR Ordering Cuts Wait Times by 40%",
  "ogDescription": "Real data from Rwandan restaurants...",
  "ogImageId": "media_abc123",
  "twitterCard": "summary_large_image",
  "noIndex": false
}
```

**Fallback rules** (when seoMeta field is null or field within seoMeta is null):

| SEO Field | Fallback |
|-----------|----------|
| metaTitle | `article.title + " \| ImboniServe"` |
| metaDescription | `article.excerpt` or first 160 chars of body |
| canonicalUrl | `baseUrl + getTypePath(type) + "/" + slug` |
| ogTitle | metaTitle |
| ogDescription | metaDescription |
| ogImage | coverImage URL or `/imgs/logo2.png` |
| twitterCard | `summary_large_image` |
| noIndex | `false` |

### 3.3 ArticleLayout Component (NEW)

Creates a new `src/components/ArticleLayout.tsx` that wraps PublicLayout and adds:

1. **Article JSON-LD**:
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Article Title",
  "description": "Meta description",
  "image": ["https://imboniserve.com/imgs/articles/cover.jpg"],
  "datePublished": "2025-01-20T10:00:00+02:00",
  "dateModified": "2025-01-22T15:30:00+02:00",
  "author": { "@type": "Person", "name": "Author Name" },
  "publisher": {
    "@type": "Organization",
    "name": "ImboniServe",
    "logo": { "@type": "ImageObject", "url": "https://imboniserve.com/imgs/logo2.png" }
  },
  "mainEntityOfPage": { "@type": "WebPage", "@id": "https://imboniserve.com/blog/article-slug" },
  "articleSection": "Inventory Management"
}
```

2. **BreadcrumbList JSON-LD**:
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

3. **Article-specific OG tags**:
```html
<meta property="og:type" content="article" />
<meta property="article:published_time" content="2025-01-20T10:00:00+02:00" />
<meta property="article:modified_time" content="2025-01-22T15:30:00+02:00" />
<meta property="article:section" content="Inventory Management" />
<meta property="article:author" content="Author Name" />
```

4. **noIndex support**: If `seoMeta.noIndex = true`, add `<meta name="robots" content="noindex,nofollow" />`

### 3.4 Existing PublicLayout (EXISTS–REUSE — No Changes)

PublicLayout remains unchanged for non-article pages. It continues to provide:
- title, meta description, canonical, OG, Twitter, JSON-LD (Organization + WebSite)
- Article pages use ArticleLayout which wraps PublicLayout

### 3.5 robots.txt (EXISTS–REUSE — No Changes)

Current robots.txt allows all user-agents and references sitemap. The sitemap URL in robots.txt points to `/sitemap.xml` which becomes the sitemap index. No change needed.

### 3.6 Homepage SEO (EXISTS–REUSE)

Homepage SEO remains unchanged. The "Latest Insights" section is content within the existing page, not a separate SEO entity.

## 4. SEO Validation Rules

### 4.1 Admin Editor Validation

| Field | Rule | Warning (non-blocking) |
|-------|------|----------------------|
| metaTitle | Max 60 chars | "Meta title exceeds 60 characters — may be truncated in search results" |
| metaDescription | Max 160 chars | "Meta description exceeds 160 characters — may be truncated" |
| slug | URL-safe, lowercase, hyphenated | "Slug should be lowercase with hyphens only" |
| ogImage | Should be 1200×630px | "OG image should be 1200×630px for optimal display" |
| altText (cover image) | Should not be empty | "Alt text recommended for accessibility and SEO" |

### 4.2 SERP Preview

Admin editor shows a SERP preview:
```
┌─────────────────────────────────────────┐
│ Meta Title (or title + | ImboniServe)   │
│ https://imboniserve.com/blog/article...  │
│ Meta description (or excerpt)...         │
└─────────────────────────────────────────┘
```

## 5. Indexing Behavior

| Page Type | noIndex | Crawlable |
|-----------|---------|-----------|
| Published article (noIndex=false) | ✅ Indexable | Yes |
| Published article (noIndex=true) | ❌ No index | Crawlable but not indexed |
| Listing pages | ✅ Indexable | Yes |
| Draft/review/etc articles | N/A | Not crawlable (404) |
| Admin pages | N/A | Not crawlable (auth-gated) |
| API routes | N/A | Not in sitemap, not crawlable |

## 6. Existing SEO Preservation Checklist

| Existing Page | SEO Before | SEO After | Changed? |
|---------------|-----------|-----------|----------|
| `/` (homepage) | title, desc, OG, JSON-LD | Same | ❌ No |
| `/pricing` | PublicLayout meta | Same | ❌ No |
| `/discover` | PublicLayout meta | Same | ❌ No |
| `/store` | PublicLayout meta | Same | ❌ No |
| `/faq` | PublicLayout meta | Same | ❌ No |
| `/terms` | PublicLayout meta | Same | ❌ No |
| `/privacy` | PublicLayout meta | Same | ❌ No |
| `/cookies` | PublicLayout meta | Same | ❌ No |
| `/login` | PublicLayout meta | Same | ❌ No |
| `/signup` | PublicLayout meta | Same | ❌ No |
| `/unsubscribe` | PublicLayout meta | Same | ❌ No |
| `/sitemap.xml` | 10 static URLs | Sitemap index → sub-sitemaps | ✅ Refactored (preserves all existing URLs) |
| `/robots.txt` | Allow all + sitemap ref | Same | ❌ No |

**All existing URLs remain in sitemap-pages.xml.** No existing URL is removed.

---

*End of SEO Implementation Contract*
