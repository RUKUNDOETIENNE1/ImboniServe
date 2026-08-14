# CONTENT-001 — Internationalization Architecture

> **Mission**: ImboniServe Knowledge & Growth Platform  
> **Document Type**: Internationalization Architecture  
> **Date**: 2025-01-20  
> **Status**: COMPLETE

---

## 1. Purpose

Define the internationalization architecture for editorial content — supporting future content localization, locale-specific URLs, and multi-language publishing without building the full system now.

## 2. Current State

**Existing** (from forensic audit):
- Custom i18n system: `src/lib/i18n.ts` with `setLocale`, `loadTranslations`, `getTranslation`, `useTranslation` hook
- 3 locales: `en` (English), `fr` (French), `rw` (Kinyarwanda)
- Translation files: `src/locales/en.json` (116KB), `fr.json` (131KB), `rw.json` (127KB)
- `LanguageSwitcher` component in PublicLayout
- Next.js router locale integration
- UI-only — no content translation infrastructure

## 3. Design Principle

> **Do not hardcode Rwanda. Do not hardcode English as the only future possibility.**

The architecture must support future content localization without requiring schema migrations. The NOW scope does not implement content localization, but the data model must accommodate it.

## 4. NOW Scope: UI Internationalization

### 4.1 What Works Now

- UI strings (navigation, buttons, labels) are already translated via existing i18n system
- Editorial admin UI uses existing `useTranslation` hook
- Public content pages use existing `PublicLayout` with i18n
- Language switcher allows users to switch UI language

### 4.2 NOW Scope Extensions

- Add editorial-specific translation keys to locale files
- Translate editorial admin UI strings (en, fr, rw)
- Content listing pages show UI in user's locale
- Article body is single-language (author's language) for NOW

## 5. LATER Scope: Content Localization

### 5.1 Content Localization Model

When content localization is needed, add:

```prisma
/// Localized version of an editorial article
model ArticleLocale {
  id          String   @id @default(cuid())
  articleId   String   // FK to EditorialArticle (master)
  locale      String   // en | fr | rw | sw | etc.
  title       String
  subtitle    String?
  excerpt     String?
  body        String
  slug        String   // Locale-specific slug
  seoMeta     Json?    // Locale-specific SEO
  status      String   @default("DRAFT") // Translation has its own lifecycle
  translatorId String?
  publishedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([articleId, locale])
  @@index([locale, status])
}
```

### 5.2 Locale-Specific URLs

```
/en/blog/qr-ordering-reduces-wait-times    (English)
/fr/blog/reduction-temps-attente-qr        (French)
/rw/blog/kuri-ikoresha-qr-umu-gi-king      (Kinyarwanda)
```

- Default locale (`en`) does not require locale prefix: `/blog/{slug}`
- Non-default locales use prefix: `/{locale}/blog/{slug}`
- hreflang tags link all locale variants

### 5.3 Sitemap for Localized Content

```xml
<url>
  <loc>https://imboniserve.com/blog/qr-ordering</loc>
  <xhtml:link rel="alternate" hreflang="en" href="https://imboniserve.com/blog/qr-ordering"/>
  <xhtml:link rel="alternate" hreflang="fr" href="https://imboniserve.com/fr/blog/reduction-temps-attente"/>
  <xhtml:link rel="alternate" hreflang="rw" href="https://imboniserve.com/rw/blog/kuri-qr"/>
</url>
```

## 6. Design Decisions for NOW

### 6.1 Article Body Language

- `EditorialArticle` has no `locale` field in NOW scope
- Articles are written in a single language (typically English)
- The `body` field contains content in the author's language
- Future: `ArticleLocale` table for translations

### 6.2 Locale-Aware Routing

- NOW: No locale prefix on content URLs (`/blog/{slug}`, not `/en/blog/{slug}`)
- LATER: Add locale prefix when content localization is implemented
- Next.js router locale is used for UI only (not content URLs)

### 6.3 Newsletter Localization

- NOW: Newsletter issues are single-language
- LATER: Locale-specific newsletter segments and issues
- Subscriber `preferences.language` field is captured now (for future use)

### 6.4 Date/Time Display

- Use existing locale-aware date formatting
- Content `publishedAt` displayed in user's locale format
- Timezone: stored as UTC, displayed in user's local timezone

## 7. What We Do NOT Build Now

- **No content translation workflow** (LATER)
- **No locale-specific content URLs** (LATER)
- **No hreflang tags** (LATER)
- **No localized sitemap entries** (LATER)
- **No multi-language editorial admin** (LATER)
- **No automated translation** (LONG-TERM)

## 8. Future-Proofing Checklist

| Design Decision | Future-Proof? |
|----------------|---------------|
| Article body is single string | ✅ — ArticleLocale table adds translations |
| Slug is unique globally | ✅ — ArticleLocale has locale-specific slug |
| No locale field on EditorialArticle | ✅ — Default locale implied; ArticleLocale for others |
| Subscriber preferences include language | ✅ — Already captured for future segmentation |
| SEO metadata in Json | ✅ — Can include locale-specific metadata |
| Topic/Tag names are single-language | ✅ — Can add TopicLocale/TagLocale tables |
| URL structure has no locale prefix | ✅ — Can add prefix for non-default locales |

---

*End of Internationalization Architecture*
