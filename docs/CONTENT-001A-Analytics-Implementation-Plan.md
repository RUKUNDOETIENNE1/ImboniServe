# CONTENT-001A — Analytics Implementation Plan

> **Mission**: ImboniServe Knowledge & Growth Platform — Implementation Readiness  
> **Document Type**: Analytics Implementation Scope  
> **Date**: 2025-08-15  
> **Status**: COMPLETE

---

## 1. Purpose

Define the minimum privacy-first analytics foundation for Phase A and the full analytics platform for Phase B.

## 2. Current State

**Existing analytics:**
- PostEngagement: VIEW events for SHORT_VIDEO posts only (business CMS)
- PWA telemetry: `src/lib/analytics/pwa-telemetry`
- Sentry: error monitoring
- No web analytics provider (no GA, Plausible, Fathom, etc.)
- No UTM parameter capture
- No conversion tracking
- No content performance metrics

## 3. Phase A Scope (Minimum Foundation)

### 3.1 What Phase A Does

| Item | Action |
|------|--------|
| Web analytics provider | Add provider-agnostic script snippet (Plausible or GA4 via env var) |
| UTM cookie capture | EXTEND middleware to capture UTM parameters |
| ContentEvent model | NEW model for custom content events |
| Content event API | NEW endpoint for anonymous event tracking |
| Analytics dashboard | DEFER to Phase B (use provider's dashboard) |
| Conversion tracking | DEFER to Phase B (extend DemoRequest/User with UTM) |
| Content ROI | DEFER to Phase B |

### 3.2 Web Analytics Provider Integration

**Provider-agnostic approach:**

```typescript
// src/components/AnalyticsScript.tsx
export default function AnalyticsScript() {
  const provider = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER
  const domain = process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN

  if (provider === 'plausible' && domain) {
    return (
      <script
        defer
        data-domain={domain}
        src="https://plausible.io/js/script.js"
      />
    )
  }

  if (provider === 'ga4' && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
    return (
      <>
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`} />
        <script dangerouslySetInnerHTML={{ __html: `...GA4 config...` }} />
      </>
    )
  }

  return null // No analytics if not configured
}
```

**Integration point**: Add `<AnalyticsScript />` to `_app.tsx` or `_document.tsx`, after cookie consent check.

**Cookie consent**: Analytics script loads only after user consents (existing CookieConsentBanner). For Plausible: no cookies needed, loads immediately. For GA4: loads after consent.

### 3.3 UTM Cookie Capture (Middleware Extension)

**Current middleware** (`src/middleware.ts`): captures referral codes (`ref`, `aff`, `partner`, `m`, `invite`, `inv`) and sets `im_ref` cookie (30-day, httpOnly).

**Extension**: Add UTM parameter capture (additive, no changes to existing logic):

```typescript
const UTM_PARAMS = [
  { param: 'utm_source', cookie: 'im_utm_source' },
  { param: 'utm_medium', cookie: 'im_utm_medium' },
  { param: 'utm_campaign', cookie: 'im_utm_campaign' },
  { param: 'utm_content', cookie: 'im_utm_content' },
  { param: 'utm_term', cookie: 'im_utm_term' },
]

for (const { param, cookie } of UTM_PARAMS) {
  const value = url.searchParams.get(param)
  if (value) {
    res.cookies.set(cookie, value, {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    })
  }
}
```

**Key**: This is additive. Existing referral cookie logic is unchanged. UTM cookies are set independently.

### 3.4 ContentEvent Model

Tracks custom content events beyond what the analytics provider captures:

| Event Type | Trigger | Data |
|-----------|---------|------|
| PAGE_VIEW | Article detail page load | articleId, sessionId, UTM cookies |
| READ_COMPLETE | Scroll to bottom of article | articleId, sessionId |
| SHARE | Social share button click | articleId, platform (linkedin/twitter/etc.) |
| CTA_CLICK | Click on CTA within article | articleId, ctaType (signup/demo/newsletter) |
| NEWSLETTER_SIGNUP | Newsletter signup from article page | articleId (if source is article) |
| DEMO_REQUEST | Demo request from article page | articleId (if source is article) |

### 3.5 Content Event API

**`POST /api/public/content/events`** (anonymous, public):

```json
{
  "articleId": "cuid",
  "eventType": "PAGE_VIEW",
  "metadata": { "scrollDepth": 100 }
}
```

- Reads UTM cookies and refCode from request
- Creates ContentEvent record
- Returns `{ success: true }`
- No PII collected
- Rate limited (per session ID)

### 3.6 What Phase A Does NOT Do

- **No analytics dashboard** — use provider's built-in dashboard
- **No conversion tracking** — DemoRequest UTM extension is Phase B
- **No content ROI calculation** — Phase B
- **No real-time analytics** — not needed
- **No heatmap** — Phase C
- **No A/B testing** — Phase C
- **No multi-touch attribution** — Phase B

## 4. Phase B Scope

### 4.1 Features

| Feature | Description |
|---------|-------------|
| DemoRequest UTM extension | Add utmSource, utmMedium, utmCampaign, utmContent, refCode to DemoRequest |
| User signup attribution | Add signupSource, UTM fields to User |
| Content analytics dashboard | `/admin/content/analytics` with per-article metrics |
| Attribution funnel | Views → signups → demos → trials |
| Traffic source breakdown | Organic, newsletter, social, referral |
| Content ROI | Revenue attributed to content (first-touch) |

### 4.2 Dashboard Metrics (Phase B)

- Total page views (by day, content type, topic)
- Top performing articles
- Traffic sources
- Conversion funnel
- Content engagement (reading time, share rate)

## 5. Privacy Requirements

| Requirement | Implementation |
|------------|---------------|
| No PII in analytics | Provider configured for privacy; ContentEvent stores sessionId only |
| Cookie consent | Existing CookieConsentBanner; analytics loads after consent (GA4) or without cookies (Plausible) |
| UTM cookies are functional | First-party, httpOnly, not tracking cookies |
| Data retention | Provider policy (Plausible: indefinite, GA4: 14 months) |
| GDPR/PDPL compliance | No cookies for Plausible; GA4 requires consent |
| Data export | Via provider API |

## 6. Provider Recommendation

**Recommended**: Plausible Analytics
- Privacy-first (no cookies, no PII)
- Lightweight (1KB script)
- Simple, actionable metrics
- GDPR-friendly out of the box
- Open-source, self-hostable

**Alternative**: Google Analytics 4
- More detailed metrics
- Requires cookie consent
- Heavier script
- 14-month data retention default

**Decision**: Deployment configuration via `NEXT_PUBLIC_ANALYTICS_PROVIDER` env var. Architecture supports both.

## 7. Observability Events

The following editorial events should eventually enter the platform's observability/audit system (Heart Pulse, Service Replay, audit logs):

| Event | When | Purpose |
|-------|------|---------|
| ARTICLE_CREATED | Article created | Audit trail |
| ARTICLE_APPROVED | Article approved | Audit trail |
| ARTICLE_PUBLISHED | Article published | Audit trail + observability |
| ARTICLE_ARCHIVED | Article archived | Audit trail |
| ARTICLE_REJECTED | Article rejected | Audit trail |

**Phase A**: These events are captured via ContentTransition (audit trail within editorial system).
**Phase B+**: If the platform's observability system needs these events, they can be emitted from the transition endpoint.

**Important**: Do NOT automatically connect every editorial action to operational hospitality events. Keep editorial domain and operational domain appropriately separated.

---

*End of Analytics Implementation Plan*
