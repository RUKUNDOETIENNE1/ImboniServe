# CONTENT-001 — Public Information Architecture

> **Mission**: ImboniServe Knowledge & Growth Platform  
> **Document Type**: Public Information Architecture  
> **Date**: 2025-01-20  
> **Status**: COMPLETE

---

## 1. Purpose

Define the public-facing URL structure, page templates, navigation, and content discovery experience for editorial content on the ImboniServe website.

## 2. URL Structure

### 2.1 Content Routes

| Route | Type | NOW/NEXT | Purpose |
|-------|------|----------|---------|
| `/blog` | Listing | NOW | Articles + announcements |
| `/blog/[slug]` | Detail | NOW | Individual article |
| `/stories` | Listing | NOW | Founder stories + product stories + case studies |
| `/stories/[slug]` | Detail | NOW | Individual story |
| `/insights` | Listing | NOW | Industry insights |
| `/insights/[slug]` | Detail | NOW | Individual insight |
| `/guides` | Listing | NOW | Guides |
| `/guides/[slug]` | Detail | NOW | Individual guide |
| `/reports` | Listing | NEXT | Reports |
| `/reports/[slug]` | Detail | NEXT | Individual report |
| `/resources` | Listing | NEXT | Resources |
| `/resources/[slug]` | Detail | NEXT | Individual resource |
| `/newsletter` | Archive | NEXT | Newsletter issue archive |
| `/newsletter/[slug]` | Detail | NEXT | Individual newsletter issue |
| `/topic/[slug]` | Listing | NEXT | Articles by topic |
| `/tag/[slug]` | Listing | NEXT | Articles by tag |
| `/author/[slug]` | Profile | NEXT | Author profile + articles |

### 2.2 Existing Routes (Unchanged)

| Route | Purpose |
|-------|---------|
| `/` | Homepage |
| `/pricing` | Pricing |
| `/features/*` | Feature pages |
| `/discover/*` | Business discovery |
| `/faq` | FAQ |
| `/login`, `/signup` | Auth |
| `/terms`, `/privacy`, `/cookies` | Legal |

## 3. Page Templates

### 3.1 Content Listing Page

```
[PublicLayout]
  [Page Header: title + description]
  [Topic/Tag filter pills (if applicable)]
  [Content grid/list]
    [Card: cover image, title, excerpt, topic, date, author]
    [Card: ...]
  [Pagination]
  [Newsletter signup (inline variant)]
[/PublicLayout]
```

### 3.2 Content Detail Page

```
[PublicLayout with per-article SEO]
  [Breadcrumb: Home > Section > Article]
  [Article header: title, subtitle, author, date, topic, reading time]
  [Cover image]
  [Article body (rendered Markdown/HTML)]
  [Content truth badges (if claims have verification)]
  [Related articles]
  [Newsletter signup (inline)]
  [Social share buttons]
  [Author bio (if author profile exists)]
[/PublicLayout]
```

### 3.3 Topic/Tag Listing Page

```
[PublicLayout]
  [Topic/Tag header: name, description]
  [Sub-topic navigation (if hierarchical)]
  [Article grid filtered by topic/tag]
  [Pagination]
[/PublicLayout]
```

## 4. Navigation

### 4.1 Header Navigation (Extend Existing)

Existing PublicLayout nav:
```
Features | Pricing | Solutions (dropdown) | Discover | Contact
```

Extended with content:
```
Features | Pricing | Solutions | Insights | Discover | Contact
```

- **Insights** dropdown or direct link to `/blog` or `/insights`
- Do not make UI unnecessarily complex — single "Insights" or "Blog" entry point
- Footer includes links to all content sections

### 4.2 Footer Navigation (Extend Existing)

Add content section links:
```
Content:
  Blog | Stories | Insights | Guides | Newsletter

Company:
  About | Contact | Careers (LATER)

Legal:
  Terms | Privacy | Cookies
```

### 4.3 In-Content Navigation

- Breadcrumbs on every content page
- Related articles at bottom of each article
- Topic/tag links within article metadata
- Author link to author profile

## 5. Homepage Integration

### 5.1 Content Section on Homepage

Add a "Latest Insights" section to the existing homepage:
- 3 most recent published articles
- Cover image, title, excerpt, date
- "View all" link to `/blog`

### 5.2 Newsletter Signup on Homepage

Existing `NewsletterSignup` component already in PublicLayout footer. Add an inline variant in the homepage content flow.

## 6. Content Discovery

### 6.1 Search (NEXT Scope)

- Full-text search across published articles
- Search by title, body, excerpt, tags, topics
- Search results page at `/search?q={query}`
- Existing WebSite JSON-LD SearchAction points to `/search`

### 6.2 Filtering

- By topic (pill buttons)
- By tag (pill buttons)
- By content type (tabs or dropdown)
- By date range (LATER)

### 6.3 Sorting

- Default: by publishedAt (newest first)
- Alternative: by popularity (analytics-driven, LATER)
- Alternative: alphabetical (LATER)

## 7. Content Rendering

### 7.1 Markdown Rendering

- Article body stored as Markdown (default `bodyFormat: "MARKDOWN"`)
- Server-side rendering to HTML via `remark`/`rehype` or similar
- Support for: headings, paragraphs, lists, code blocks, blockquotes, images, links, tables
- Sanitize HTML output (prevent XSS) — see Content Governance & Security document

### 7.2 Rich Text (LATER)

- If `bodyFormat: "RICH_TEXT"`, body is stored as structured JSON (e.g., ProseMirror, Lexical)
- Rendered to HTML via renderer library
- Enables inline editing in admin UI

### 7.3 Code Syntax Highlighting

- Code blocks rendered with syntax highlighting (e.g., Prism.js, Shiki)
- Only for technical content (guides about API, integrations)

## 8. Performance

- **SSR**: All content pages use `getServerSideProps` for SEO and fresh content
- **ISR**: Consider Incremental Static Regeneration for content pages (NEXT scope)
- **Image optimization**: Next.js Image component for responsive images
- **Caching**: Cache listing pages for 5 minutes, detail pages for 1 minute (via `Cache-Control` headers)

## 9. Mobile Experience

- All content pages are responsive (existing Tailwind CSS patterns)
- Mobile navigation includes content sections
- Article body optimized for mobile reading (font size, line height, spacing)
- Touch-friendly navigation and filters

---

*End of Public Information Architecture*
