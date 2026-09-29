# CONTENT-001 — Analytics & Attribution Architecture

> **Mission**: ImboniServe Knowledge & Growth Platform  
> **Document Type**: Analytics & Attribution Architecture  
> **Date**: 2025-01-20  
> **Status**: COMPLETE

---

## 1. Purpose

Define the analytics and attribution architecture for editorial content — tracking content performance, visitor engagement, conversion paths, and content ROI.

## 2. Current State

**Existing** (from forensic audit):
- No web analytics (no GA, Plausible, Fathom, etc.)
- PostEngagement: VIEW events for SHORT_VIDEO posts only
- PWA telemetry: `src/lib/analytics/pwa-telemetry`
- Sentry: error monitoring
- Referral cookie capture in middleware (`im_ref` cookie, 30-day)
- No UTM parameter capture
- No conversion tracking
- No funnel analysis

## 3. Analytics Layers

### 3.1 Layer 1: Web Analytics (NOW)

Track page views and visitor behavior on public content pages.

**Provider**: Plausible (recommended for privacy-first, lightweight) or Google Analytics 4

**Design decision**: Use a privacy-first analytics provider. Plausible is recommended because:
- Lightweight script (1KB vs GA's 45KB+)
- No cookies required (GDPR-friendly)
- Simple, actionable metrics
- Open-source, self-hostable option

**Integration**:
- Script injected in `PublicLayout` `<Head>` (or `_document.tsx`)
- Configurable via environment variable: `ANALYTICS_PROVIDER=plausible`, `PLAUSIBLE_DOMAIN=imboniserve.com`
- No PII collected

### 3.2 Layer 2: Content Performance (NOW)

Track content-specific metrics beyond page views.

| Metric | Source | Storage |
|--------|--------|---------|
| Page views | Analytics provider | Provider dashboard |
| Unique visitors | Analytics provider | Provider dashboard |
| Reading time | Custom event | Provider custom events |
| Social shares | Share button click events | Provider custom events |
| Newsletter signups from content | Newsletter subscribe with `sourcePage` | NewsletterSubscriber.sourcePage |
| Demo requests from content | Demo request with `sourcePage` | DemoRequest (extend) |

### 3.3 Layer 3: Attribution (NOW)

Track how content contributes to business conversions.

#### UTM Parameter Capture

Extend existing middleware to capture UTM parameters:

```
?utm_source=newsletter&utm_medium=email&utm_campaign=issue-12&utm_content=article-qr-ordering
```

| Parameter | Cookie | Duration |
|-----------|--------|----------|
| `utm_source` | `im_utm_source` | 30 days |
| `utm_medium` | `im_utm_medium` | 30 days |
| `utm_campaign` | `im_utm_campaign` | 30 days |
| `utm_content` | `im_utm_content` | 30 days |
| `utm_term` | `im_utm_term` | 30 days |

**Capture point**: Middleware (same as existing referral cookie capture)

**Storage**: UTM cookies read at conversion events (signup, demo request) and stored on the conversion record.

#### Conversion Path

```
CONTENT → VISITOR → ENGAGEMENT → CTA → LEAD → DEMO → TRIAL → CUSTOMER
```

| Stage | Tracking Mechanism |
|-------|-------------------|
| CONTENT | Article slug, topic, tags |
| VISITOR | Analytics provider (page view) |
| ENGAGEMENT | Reading time, social shares, scroll depth |
| CTA | Click on signup/demo CTA within article |
| LEAD | DemoRequest with `sourcePage` = article URL + UTM cookies |
| DEMO | DemoRequest status → CONTACTED |
| TRIAL | User signup with `signupSource` = content + UTM cookies |
| CUSTOMER | Subscription activation (link to original signup source) |

### 3.4 Layer 4: Content ROI (NEXT)

Aggregate content-attributed conversions:

| Metric | Calculation |
|--------|-------------|
| Content-attributed signups | Count of signups where `signupSource` contains content URL |
| Content-attributed demos | Count of demo requests from content pages |
| Content-attributed revenue | Revenue from customers whose first touch was content |
| Content cost | Editor time + media costs (manual input) |
| Content ROI | (Attributed revenue - content cost) / content cost |

## 4. Data Model Extensions

### 4.1 DemoRequest Extension

```prisma
// ADD to existing DemoRequest:
//   utmSource   String?
//   utmMedium   String?
//   utmCampaign String?
//   utmContent  String?
//   refCode     String?  // Existing referral code from cookie
```

### 4.2 User Extension (for signup attribution)

```prisma
// ADD to existing User:
//   signupSource    String?  // URL or source page
//   utmSource       String?
//   utmMedium       String?
//   utmCampaign     String?
//   utmContent      String?
//   refCode         String?
```

### 4.3 ContentEvent (Custom Event Tracking)

```prisma
/// Custom content events (beyond analytics provider)
model ContentEvent {
  id          String   @id @default(cuid())
  articleId   String?  // FK to EditorialArticle (loose reference)
  eventType   String   // PAGE_VIEW | READ_COMPLETE | SHARE | CTA_CLICK | NEWSLETTER_SIGNUP | DEMO_REQUEST
  metadata    Json?    // Event-specific data
  sessionId   String?  // Anonymous session ID (from cookie)
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

## 5. Middleware Extension

### 5.1 UTM Cookie Capture

Extend `src/middleware.ts` to capture UTM parameters alongside existing referral cookies:

```typescript
const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const

for (const param of UTM_PARAMS) {
  const value = url.searchParams.get(param)
  if (value) {
    const cookieName = `im_${param.replace('_', '')}`
    res.cookies.set(cookieName, value, {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    })
  }
}
```

### 5.2 Session ID

Set an anonymous session ID cookie for content event tracking:
- Cookie: `im_sid` (non-httpOnly, for client-side events)
- Duration: 30 minutes (session)
- Generated: UUID

## 6. Analytics API

### 6.1 Content Analytics API

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/content/analytics` | GET | Content performance overview |
| `/api/admin/content/analytics/[articleId]` | GET | Per-article analytics |
| `/api/admin/content/analytics/attribution` | GET | Attribution funnel |
| `/api/admin/content/analytics/traffic` | GET | Traffic by source/medium |

### 6.2 Analytics Dashboard

| Page | Purpose |
|------|---------|
| `/admin/content/analytics` | Content analytics overview |
| `/admin/content/analytics/[articleId]` | Per-article performance |

### 6.3 Dashboard Metrics

- Total page views (by day, by content type, by topic)
- Top performing articles
- Traffic sources (organic, newsletter, social, referral)
- Conversion funnel (views → signups → demos → trials)
- Content engagement (reading time, share rate, bounce rate)

## 7. Privacy & Compliance

- **No PII in analytics**: Analytics provider configured to not collect PII
- **Cookie consent**: Existing `CookieConsentBanner` component — analytics script loaded only after consent
- **Data retention**: Analytics data retained per provider policy (Plausible: indefinite, GA: 14 months default)
- **GDPR/PDPL**: UTM cookies are functional (first-party, httpOnly) — not tracking cookies
- **Data export**: Analytics data exportable via provider API

## 8. What We Do NOT Build

- **No custom analytics engine** (use provider)
- **No real-time analytics dashboard** (provider's dashboard is sufficient)
- **No heatmaps** (LATER scope)
- **No A/B testing** (LATER scope)
- **No multi-touch attribution model** (first-touch + last-touch for NOW)
- **No content decay analytics** (LATER scope)

---

*End of Analytics & Attribution Architecture*
